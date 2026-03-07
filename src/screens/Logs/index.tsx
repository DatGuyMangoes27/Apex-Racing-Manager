import { useEffect, useMemo, useState } from 'react'
import { Activity, Download, MessageSquare, Radio, Terminal, Trash2 } from 'lucide-react'

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }
const CARD = 'bg-white border-[0.8px] border-black/20 rounded-[24px] overflow-hidden'

type LogLevel = 'info' | 'event' | 'warning' | 'decision' | 'error'

interface LogEntry {
  timestamp: number
  timeStr: string
  type: string
  message: string
  details?: Record<string, any>
  level: LogLevel
}

const FLOW_TYPES = new Set([
  'DATA_SOURCE_ACCEPTED',
  'DATA_SOURCE_REJECTED',
  'MEMORY_MENTION_SAVED',
  'MEMORY_MENTION_SAVE_FAILED',
  'PREGEN_POOL_LOADED',
  'NARRATIVE_THREADS_UPDATED',
  'COVERAGE_LANE_SELECTED',
  'THREAD_CALLBACK_GUIDE',
  'THREAD_RESOLUTION_RULE',
  'THREAD_RESOLUTION_QUALITY',
  'E2E_STREAM_START',
  'E2E_STREAM_COMPLETE',
])

function isFlowLog(entry: LogEntry): boolean {
  return FLOW_TYPES.has(entry.type)
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  info: 'bg-[#e0e7ef] text-[#0a0a0a]',
  event: 'bg-[#dcfce7] text-[#00a63e]',
  warning: 'bg-[#fef3c7] text-[#b45309]',
  decision: 'bg-[#e0e7ef] text-[#0a0a0a]',
  error: 'bg-[#fee2e2] text-[#ef4444]',
}

export default function Logs() {
  const [telemetryLogs, setTelemetryLogs] = useState<LogEntry[]>([])
  const [commentaryLogs, setCommentaryLogs] = useState<LogEntry[]>([])
  const [search, setSearch] = useState('')
  const [flowOnly, setFlowOnly] = useState(false)
  const [activeTab, setActiveTab] = useState<'commentary' | 'telemetry'>('commentary')
  const [statusMessage, setStatusMessage] = useState<string>('')

  useEffect(() => {
    const loadBuffered = async (): Promise<void> => {
      try {
        const buffered = await window.electron?.getBufferedLogs?.()
        if (buffered?.telemetry) setTelemetryLogs(buffered.telemetry)
        if (buffered?.commentary) setCommentaryLogs(buffered.commentary)
      } catch (error) {
        console.error('[Logs] Failed to load buffered logs:', error)
      }
    }

    loadBuffered()
    window.electron?.onTelemetryLog?.((entry: LogEntry) => {
      setTelemetryLogs((prev) => [...prev, entry].slice(-1500))
    })
    window.electron?.onCommentaryLog?.((entry: LogEntry) => {
      setCommentaryLogs((prev) => [...prev, entry].slice(-2000))
    })
  }, [])

  const filteredTelemetry = useMemo(() => {
    return telemetryLogs.filter((entry) => {
      const query = search.trim().toLowerCase()
      if (!query) return true
      const haystack = `${entry.type} ${entry.message} ${JSON.stringify(entry.details || {})}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [telemetryLogs, search])

  const filteredCommentary = useMemo(() => {
    return commentaryLogs.filter((entry) => {
      if (flowOnly && !isFlowLog(entry)) return false
      const query = search.trim().toLowerCase()
      if (!query) return true
      const haystack = `${entry.type} ${entry.message} ${JSON.stringify(entry.details || {})}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [commentaryLogs, search, flowOnly])

  const handleClear = async (): Promise<void> => {
    try {
      await window.electron?.clearLogFiles?.()
      setTelemetryLogs([])
      setCommentaryLogs([])
      setStatusMessage('Cleared log buffers and files.')
      setTimeout(() => setStatusMessage(''), 2500)
    } catch (error) {
      setStatusMessage('Failed to clear logs.')
      setTimeout(() => setStatusMessage(''), 2500)
      console.error('[Logs] Failed to clear logs:', error)
    }
  }

  const handleExport = async (): Promise<void> => {
    try {
      const result = await window.electron?.saveLogsToFile?.(telemetryLogs, commentaryLogs)
      if (result?.success) {
        setStatusMessage(`Saved logs to ${result.filePath}`)
      } else {
        setStatusMessage('Export cancelled or failed.')
      }
      setTimeout(() => setStatusMessage(''), 3500)
    } catch (error) {
      setStatusMessage('Failed to export logs.')
      setTimeout(() => setStatusMessage(''), 2500)
      console.error('[Logs] Export failed:', error)
    }
  }

  const currentLogs = activeTab === 'commentary' ? filteredCommentary : filteredTelemetry
  const flowHealth = useMemo(() => {
    const all = commentaryLogs
    const count = (type: string) => all.filter((entry) => entry.type === type).length
    const callbackGuides = all.filter((entry) => entry.type === 'THREAD_CALLBACK_GUIDE')
    const callbackWithGuide = callbackGuides.filter((entry) => entry.details?.hasGuide).length
    const finishResolutionRules = all.filter((entry) => entry.type === 'THREAD_RESOLUTION_RULE')
    const finishWithPayoffOrCooldown = finishResolutionRules.filter((entry) => {
      const payoff = Number(entry.details?.activePayoff || 0)
      const cooldown = Number(entry.details?.activeCooldown || 0)
      return payoff > 0 || cooldown > 0
    }).length
    const finishResolutionQuality = all.filter((entry) => entry.type === 'THREAD_RESOLUTION_QUALITY')
    const finishQualityHit = finishResolutionQuality.filter((entry) => {
      const payoff = Boolean(entry.details?.payoffSignal)
      const cooldown = Boolean(entry.details?.cooldownSignal)
      return payoff || cooldown
    }).length
    return {
      accepted: count('DATA_SOURCE_ACCEPTED'),
      rejected: count('DATA_SOURCE_REJECTED'),
      mentionsSaved: count('MEMORY_MENTION_SAVED'),
      mentionSaveFailed: count('MEMORY_MENTION_SAVE_FAILED'),
      pregenLoaded: count('PREGEN_POOL_LOADED'),
      threadsUpdated: count('NARRATIVE_THREADS_UPDATED'),
      coverageLaneSelected: count('COVERAGE_LANE_SELECTED'),
      callbackGuides: count('THREAD_CALLBACK_GUIDE'),
      callbackGuideHitRate: callbackGuides.length > 0 ? Math.round((callbackWithGuide / callbackGuides.length) * 100) : 0,
      finishResolutionRules: count('THREAD_RESOLUTION_RULE'),
      finishPayoffCooldownRate: finishResolutionRules.length > 0
        ? Math.round((finishWithPayoffOrCooldown / finishResolutionRules.length) * 100)
        : 0,
      finishResolutionQuality: count('THREAD_RESOLUTION_QUALITY'),
      finishQualityHitRate: finishResolutionQuality.length > 0
        ? Math.round((finishQualityHit / finishResolutionQuality.length) * 100)
        : 0,
    }
  }, [commentaryLogs])

  return (
    <div className="bg-white w-full h-full overflow-y-auto">
      <div className="p-[24px] flex flex-col gap-[24px]">
        {/* Header */}
        <div className="flex items-center gap-[12px]">
          <Terminal className="w-[28px] h-[28px] text-[#0a0a0a]" />
          <div>
            <h1 className="text-[30px] text-[#0a0a0a] tracking-[-1.5px] leading-tight" style={FB}>Logs</h1>
            <p className="text-[14px] text-[#4a5565]" style={FR}>Telemetry and commentary diagnostics</p>
          </div>
        </div>

        {/* Main Card */}
        <div className={`${CARD} p-[24px]`}>
          {/* Flow Health Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-[8px] mb-[16px]">
            {[
              { label: 'Source Accepted', value: flowHealth.accepted },
              { label: 'Source Rejected', value: flowHealth.rejected },
              { label: 'Mentions Saved', value: flowHealth.mentionsSaved },
              { label: 'Mention Save Failed', value: flowHealth.mentionSaveFailed },
              { label: 'PreGen Pools Loaded', value: flowHealth.pregenLoaded },
              { label: 'Threads Updated', value: flowHealth.threadsUpdated },
              { label: 'Coverage Lane Picks', value: flowHealth.coverageLaneSelected },
              { label: 'Callback Guides', value: flowHealth.callbackGuides },
              { label: 'Callback Guide Hit Rate', value: `${flowHealth.callbackGuideHitRate}%` },
              { label: 'Finish Resolution Rules', value: flowHealth.finishResolutionRules },
              { label: 'Payoff/Cooldown Rate', value: `${flowHealth.finishPayoffCooldownRate}%` },
              { label: 'Resolution Quality Logs', value: flowHealth.finishResolutionQuality },
              { label: 'Resolution Hit Rate', value: `${flowHealth.finishQualityHitRate}%` },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[16px] p-[12px]">
                <p className="text-[11px] text-[#4a5565]" style={FR}>{stat.label}</p>
                <p className="font-mono text-[14px] text-[#0a0a0a]" style={FBold}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs & Actions */}
          <div className="flex flex-wrap items-center gap-[12px] mb-[16px]">
            <button
              onClick={() => setActiveTab('commentary')}
              className={`flex items-center gap-[8px] px-[16px] py-[10px] text-[14px] rounded-[16px] transition-colors ${
                activeTab === 'commentary' ? 'bg-black text-white' : 'border-[0.8px] border-black/20 text-[#0a0a0a] hover:bg-[#f9fafb]'
              }`}
              style={FBold}
            >
              <MessageSquare className="w-[16px] h-[16px]" />
              Commentary
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-[8px] px-[16px] py-[10px] text-[14px] rounded-[16px] transition-colors ${
                activeTab === 'telemetry' ? 'bg-black text-white' : 'border-[0.8px] border-black/20 text-[#0a0a0a] hover:bg-[#f9fafb]'
              }`}
              style={FBold}
            >
              <Radio className="w-[16px] h-[16px]" />
              Telemetry
            </button>
            <div className="ml-auto flex items-center gap-[8px]">
              <button
                onClick={() => setFlowOnly((prev) => !prev)}
                disabled={activeTab !== 'commentary'}
                className={`flex items-center gap-[8px] px-[14px] py-[10px] text-[13px] rounded-[12px] border-[0.8px] border-black/20 transition-colors disabled:opacity-40 ${
                  flowOnly ? 'bg-black text-white' : 'text-[#0a0a0a] hover:bg-[#f9fafb]'
                }`}
                style={FR}
              >
                <Activity className="w-[16px] h-[16px]" />
                {flowOnly ? 'Flow Only: On' : 'Flow Only: Off'}
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-[8px] px-[14px] py-[10px] text-[13px] rounded-[12px] border-[0.8px] border-black/20 text-[#0a0a0a] hover:bg-[#f9fafb] transition-colors"
                style={FR}
              >
                <Download className="w-[16px] h-[16px]" />
                Export
              </button>
              <button
                onClick={handleClear}
                className="flex items-center gap-[8px] px-[14px] py-[10px] text-[13px] rounded-[12px] bg-[#ef4444] text-white hover:bg-[#dc2626] transition-colors"
                style={FR}
              >
                <Trash2 className="w-[16px] h-[16px]" />
                Clear
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-[12px] mb-[16px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter by type, message, or details..."
              className="w-full px-[14px] py-[10px] bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[12px] text-[14px] text-[#0a0a0a] focus:outline-none focus:border-black/30"
              style={FR}
            />
            <span className="px-[12px] py-[6px] bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[10px] text-[13px] text-[#4a5565] whitespace-nowrap" style={FBold}>
              {currentLogs.length}
            </span>
          </div>

          {statusMessage && <p className="text-[12px] text-[#00a63e] mb-[12px]" style={FR}>{statusMessage}</p>}

          {/* Log Entries */}
          <div className="max-h-[60vh] overflow-auto flex flex-col gap-[8px]">
            {currentLogs.length === 0 && (
              <p className="text-[14px] text-[#4a5565] py-[32px] text-center" style={FR}>No logs to display.</p>
            )}
            {currentLogs.map((entry, index) => (
              <div key={`${entry.timestamp}-${index}`} className="p-[12px] rounded-[16px] bg-[#f9fafb] border-[0.8px] border-black/10">
                <div className="flex items-center gap-[8px] mb-[4px]">
                  <span className="font-mono text-[12px] text-[#4a5565]">{entry.timeStr}</span>
                  <span className="px-[8px] py-[2px] bg-[#e0e7ef] rounded-[8px] text-[11px] text-[#0a0a0a]" style={FBold}>{entry.type}</span>
                  <span className={`px-[8px] py-[2px] rounded-[8px] text-[11px] ${LEVEL_COLORS[entry.level]}`} style={FBold}>
                    {entry.level}
                  </span>
                </div>
                <p className="text-[14px] text-[#0a0a0a]" style={FR}>{entry.message}</p>
                {entry.details && (
                  <pre className="text-[12px] text-[#4a5565] mt-[8px] whitespace-pre-wrap break-all" style={FR}>
                    {JSON.stringify(entry.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
