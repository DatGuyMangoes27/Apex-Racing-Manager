import { useRef, useEffect } from 'react'
import { useStudio } from '../context/StudioContext'

export default function Generation() {
  const {
    apiKeys, summary, isGenerating, generationType, imagesRemaining, dailyBudget,
    generationLog, startTextGen, startImageGen, pauseGen, resumeGen, stopGen, refreshSummary
  } = useStudio()

  const logRef = useRef<HTMLDivElement>(null)

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [generationLog])

  // Refresh on mount
  useEffect(() => {
    refreshSummary()
  }, [refreshSummary])

  const textRemaining = summary?.textTasks ?? 0
  const imageRemaining = summary?.imageTasks ?? 0

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Generation</h1>
        <p className="text-gray-400 text-sm mt-1">Generate text narratives and portrait images using Gemini AI</p>
      </div>

      {/* No API Key Warning */}
      {apiKeys.length === 0 && (
        <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4 mb-6">
          <p className="text-red-300">Add at least one Gemini API key in Settings before generating.</p>
        </div>
      )}

      {/* Multi-key indicator */}
      {apiKeys.length > 1 && (
        <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3 mb-6">
          <p className="text-green-300 text-sm">{apiKeys.length} API keys active - using {Math.max(20, apiKeys.length * 4)} parallel workers for maximum throughput</p>
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Text Generation */}
        <div className="bg-surface-2 rounded-lg p-5 border border-surface-3">
          <h2 className="text-lg font-semibold text-white mb-2">Text Generation</h2>
          <p className="text-gray-400 text-sm mb-4">
            Generate narratives, bios, and profiles for all entities.
          </p>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-3xl font-bold text-blue-400">{textRemaining.toLocaleString()}</div>
            <div className="text-gray-500 text-sm">tasks remaining</div>
          </div>
          {summary?.byCategory && (
            <div className="space-y-1 mb-4 max-h-32 overflow-y-auto">
              {Object.entries(summary.byCategory)
                .filter(([, c]) => c.text > 0)
                .map(([cat, counts]) => (
                  <div key={cat} className="flex justify-between text-xs">
                    <span className="text-gray-400">{cat.replace(/-/g, ' ')}</span>
                    <span className="text-blue-400">{counts.text}</span>
                  </div>
                ))}
            </div>
          )}
          <button
            onClick={startTextGen}
            disabled={apiKeys.length === 0 || isGenerating || textRemaining === 0}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
          >
            {isGenerating && generationType === 'text' ? 'Generating...' : textRemaining === 0 ? 'All Done' : 'Start Text Generation'}
          </button>
        </div>

        {/* Image Generation */}
        <div className="bg-surface-2 rounded-lg p-5 border border-surface-3">
          <h2 className="text-lg font-semibold text-white mb-2">Image Generation</h2>
          <p className="text-gray-400 text-sm mb-4">
            Generate unique portraits for all characters.
          </p>
          <div className="flex items-center gap-4 mb-2">
            <div className="text-3xl font-bold text-purple-400">{imageRemaining.toLocaleString()}</div>
            <div className="text-gray-500 text-sm">tasks remaining</div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className="text-sm text-green-400">{imagesRemaining} images left today</div>
            <div className="text-gray-600 text-xs">/ {dailyBudget} daily limit</div>
          </div>
          <div className="w-full bg-surface-1 rounded-full h-2 mb-4">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${(imagesRemaining / dailyBudget) * 100}%` }}
            />
          </div>
          {summary?.byCategory && (
            <div className="space-y-1 mb-4 max-h-32 overflow-y-auto">
              {Object.entries(summary.byCategory)
                .filter(([, c]) => c.image > 0)
                .map(([cat, counts]) => (
                  <div key={cat} className="flex justify-between text-xs">
                    <span className="text-gray-400">{cat.replace(/-/g, ' ')}</span>
                    <span className="text-purple-400">{counts.image}</span>
                  </div>
                ))}
            </div>
          )}
          <button
            onClick={startImageGen}
            disabled={apiKeys.length === 0 || isGenerating || imageRemaining === 0 || imagesRemaining === 0}
            className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
          >
            {isGenerating && generationType === 'image' ? 'Generating...'
              : imageRemaining === 0 ? 'All Done'
              : imagesRemaining === 0 ? 'Daily Limit Reached'
              : 'Start Image Generation'}
          </button>
        </div>
      </div>

      {/* Batch Controls */}
      {isGenerating && (
        <div className="flex gap-3 mb-4">
          <button
            onClick={pauseGen}
            className="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-lg text-sm"
          >
            Pause
          </button>
          <button
            onClick={resumeGen}
            className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg text-sm"
          >
            Resume
          </button>
          <button
            onClick={stopGen}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm"
          >
            Stop
          </button>
          <button
            onClick={refreshSummary}
            className="px-4 py-2 bg-surface-3 hover:bg-surface-4 text-white rounded-lg text-sm"
          >
            Refresh Stats
          </button>
        </div>
      )}

      {/* Live Log */}
      <div className="flex-1 min-h-0">
        <h2 className="text-lg font-semibold text-white mb-2">Activity Log</h2>
        <div
          ref={logRef}
          className="bg-surface-1 rounded-lg border border-surface-2 p-4 h-[calc(100%-2rem)] overflow-y-auto font-mono text-xs"
        >
          {generationLog.length === 0 ? (
            <p className="text-gray-600">No activity yet. Start generating to see live progress.</p>
          ) : (
            generationLog.map((entry, i) => (
              <LogEntry key={i} entry={entry} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function LogEntry({ entry }: { entry: any }) {
  const colorMap: Record<string, string> = {
    start: 'text-blue-400',
    progress: 'text-gray-300',
    complete: 'text-green-400',
    error: 'text-red-400',
    paused: 'text-yellow-400',
    budget_exhausted: 'text-orange-400',
    batch_complete: 'text-cyan-400',
  }

  const color = colorMap[entry.type] || 'text-gray-400'
  const time = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : ''

  return (
    <div className={`${color} py-0.5 flex gap-2`}>
      <span className="text-gray-600 shrink-0">{time}</span>
      <span className="text-gray-600 shrink-0">[{entry.category || 'sys'}]</span>
      <span>{entry.message}</span>
      {entry.current !== undefined && entry.total !== undefined && (
        <span className="text-gray-600 ml-auto shrink-0">{entry.current}/{entry.total}</span>
      )}
    </div>
  )
}
