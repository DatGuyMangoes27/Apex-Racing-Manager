import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Wrench } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'

interface WorkItem {
  id: string
  name: string
  type: 'facility' | 'rnd'
  progress: number
  detail?: string
  timeLabel?: string
}

const FACILITY_LABELS: Record<string, string> = {
  aero: 'Aero Facility',
  chassis: 'Chassis Facility',
  engine: 'Engine Facility',
  sim: 'Simulator',
  manufacturing: 'Manufacturing',
  marketing: 'Marketing',
}

const AREA_LABELS: Record<string, string> = {
  aerodynamics: 'Aerodynamics R&D',
  chassis: 'Chassis R&D',
  powertrain: 'Powertrain R&D',
  electronics: 'Electronics R&D',
}

export function PartDevelopmentPanel() {
  const { careerState } = useCareerStore()
  const [facilityOpen, setFacilityOpen] = useState(true)
  const [rndOpen, setRndOpen] = useState(true)

  const { facilityItems, rndItems, activeCount } = useMemo(() => {
    if (!careerState) return { facilityItems: [], rndItems: [], activeCount: 0 }

    const fItems: WorkItem[] = []
    const rItems: WorkItem[] = []

    const facilities = careerState.ownedTeam?.facilities
    if (facilities) {
      for (const [key, fac] of Object.entries(facilities)) {
        const f = fac as any
        if (f?.upgradeInProgress || f?.rebuildInProgress) {
          let progress = 0
          let timeLabel = ''
          if (f.upgradeStartWeek != null && f.upgradeCompletionWeek != null && careerState.currentWeek != null) {
            const total = f.upgradeCompletionWeek - f.upgradeStartWeek
            const remaining = Math.max(0, f.upgradeCompletionWeek - careerState.currentWeek)
            progress = total > 0 ? Math.min(100, Math.round(((total - remaining) / total) * 100)) : 50
            timeLabel = `${remaining} Weeks`
          }
          fItems.push({
            id: `fac-${key}`,
            name: f.rebuildInProgress ? `Rebuilding ${FACILITY_LABELS[key] || key}` : `Building ${FACILITY_LABELS[key] || key}`,
            type: 'facility',
            progress,
            detail: 'Headquarters',
            timeLabel,
          })
        }
      }
    }

    const areas = careerState.teamDevelopment?.areas
    if (areas) {
      for (const [key, area] of Object.entries(areas)) {
        const a = area as any
        if (a?.currentUpgradeId) {
          rItems.push({
            id: `rnd-${key}`,
            name: `${AREA_LABELS[key] || key} Improvements`,
            type: 'rnd',
            progress: Math.round(a.researchProgress ?? 0),
          })
        }
      }
    }

    return { facilityItems: fItems, rndItems: rItems, activeCount: fItems.length + rItems.length }
  }, [careerState])

  return (
    <div
      className="rounded overflow-hidden flex-1 min-h-0 flex flex-col"
      style={{ background: 'linear-gradient(to bottom, #374354, #2a3442)' }}
    >
      {/* Header */}
      <div className="px-5 py-2.5" style={{ borderBottom: '1px solid #3a4a5e' }}>
        <h3
          className="text-[13px] font-bold uppercase tracking-[0.15em] text-center"
          style={{ color: '#d4dae3', fontFamily: 'Rajdhani, sans-serif' }}
        >
          Work in Progress
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
              style={{ background: 'rgba(30, 42, 56, 0.6)' }}
            >
              <Wrench className="w-7 h-7" style={{ color: '#4a5a6e' }} />
            </div>
            <span
              className="text-sm font-semibold"
              style={{ color: '#5a6a7a', fontFamily: 'Rajdhani, sans-serif' }}
            >
              No work in progress
            </span>
          </div>
        ) : (
          <>
            {/* Headquarters Section */}
            <div>
              <button
                onClick={() => setFacilityOpen(!facilityOpen)}
                className="w-full flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors"
                style={{
                  color: '#8a9ab0',
                  fontFamily: 'Rajdhani, sans-serif',
                  borderBottom: '1px solid #3a4a5e',
                }}
              >
                <span>Headquarters</span>
                <motion.div animate={{ rotate: facilityOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.div>
              </button>
              <AnimatePresence>
                {facilityOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    {facilityItems.length === 0 ? (
                      <p className="px-5 py-3 text-xs" style={{ color: '#4a5a6e' }}>
                        No facility upgrades in progress
                      </p>
                    ) : (
                      <div>
                        {facilityItems.map((item) => (
                          <WorkItemRow key={item.id} item={item} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Part Improvements Section */}
            <div>
              <button
                onClick={() => setRndOpen(!rndOpen)}
                className="w-full flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors"
                style={{
                  color: '#8a9ab0',
                  fontFamily: 'Rajdhani, sans-serif',
                  borderBottom: '1px solid #3a4a5e',
                }}
              >
                <span>Part Improvements</span>
                <motion.div animate={{ rotate: rndOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.div>
              </button>
              <AnimatePresence>
                {rndOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    {rndItems.length === 0 ? (
                      <p className="px-5 py-3 text-xs" style={{ color: '#4a5a6e' }}>
                        No research in progress
                      </p>
                    ) : (
                      <div>
                        {rndItems.map((item) => (
                          <WorkItemRow key={item.id} item={item} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function WorkItemRow({ item }: { item: WorkItem }) {
  const barColor = item.type === 'facility'
    ? 'linear-gradient(to right, #b8860b, #daa520, #f0c040)'
    : 'linear-gradient(to right, #c8a000, #e0c020, #f0d840)'

  return (
    <div className="px-4 py-2.5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(58, 74, 94, 0.4)' }}>
      <div className="flex-1 relative h-7 rounded overflow-hidden" style={{ background: 'rgba(30, 42, 56, 0.6)' }}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded"
          style={{ background: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(5, item.progress)}%` }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <span
          className="relative z-10 flex items-center h-full px-3 text-[11px] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
          style={{ color: '#fff', fontFamily: 'Rajdhani, sans-serif' }}
        >
          {item.name}
        </span>
      </div>

      {item.timeLabel && (
        <span className="text-[11px] font-mono shrink-0 w-16 text-right" style={{ color: '#6a7a8a' }}>
          {item.timeLabel}
        </span>
      )}

      {item.detail && (
        <span
          className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shrink-0"
          style={{
            color: '#6a7a8a',
            background: 'rgba(30, 42, 56, 0.8)',
            border: '1px solid rgba(58, 74, 94, 0.4)',
            fontFamily: 'Rajdhani, sans-serif',
          }}
        >
          {item.detail}
        </span>
      )}
    </div>
  )
}
