import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'

function getSecurityLabel(mood: number): { text: string; color: string; bgColor: string } {
  if (mood >= 80) return { text: 'VERY SECURE', color: '#4ade80', bgColor: 'rgba(74, 222, 128, 0.15)' }
  if (mood >= 60) return { text: 'SECURE', color: '#4ade80', bgColor: 'rgba(74, 222, 128, 0.12)' }
  if (mood >= 40) return { text: 'AT RISK', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)' }
  return { text: 'CRITICAL', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' }
}

function getArcColor(mood: number): string {
  if (mood >= 70) return '#22c55e'
  if (mood >= 40) return '#f97316'
  return '#ef4444'
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

export function BoardStatusCard() {
  const { careerState } = useCareerStore()

  const data = useMemo(() => {
    if (!careerState?.ownedTeam) return null
    const boardMood = careerState.ownedTeam.boardMood ?? 50

    const targets = careerState.boardTargets ?? []
    const primaryTarget = targets.find((t: any) => t.mandatory) || targets[0]
    let objectiveText = 'No objective set'
    let onTarget = boardMood >= 50

    if (primaryTarget) {
      switch (primaryTarget.type) {
        case 'champ_position':
          objectiveText = `${primaryTarget.targetValue}${getOrdinal(primaryTarget.targetValue)} or above`
          onTarget = primaryTarget.onTrack !== false
          break
        case 'points_min':
          objectiveText = `Score ${primaryTarget.targetValue}+ points`
          onTarget = primaryTarget.onTrack !== false
          break
        case 'budget_cap':
          objectiveText = 'Stay within budget cap'
          onTarget = careerState.costCapCompliance !== false
          break
        case 'dnf_limit':
          objectiveText = `Max ${primaryTarget.targetValue} DNFs`
          onTarget = primaryTarget.onTrack !== false
          break
        default:
          objectiveText = primaryTarget.description || 'Board objective'
      }
    }

    const seriesEntries = careerState.seriesEntries ?? []
    const champType = seriesEntries.length > 0 ? "Teams' Championship" : 'Championship'

    return { boardMood, objectiveText, onTarget, champType }
  }, [careerState])

  if (!data) return null

  const security = getSecurityLabel(data.boardMood)
  const arcColor = getArcColor(data.boardMood)

  // SVG gauge geometry
  const cx = 100, cy = 88, r = 68
  const arcLength = Math.PI * r
  const filledLength = (data.boardMood / 100) * arcLength
  const needleAngle = Math.PI - (data.boardMood / 100) * Math.PI
  const needleX = cx + Math.cos(needleAngle) * (r - 10)
  const needleY = cy - Math.sin(needleAngle) * (r - 10)

  // Tick marks for the gauge
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const angle = Math.PI - (i / 10) * Math.PI
    const innerR = r - 18
    const outerR = r - 14
    return {
      x1: cx + Math.cos(angle) * innerR,
      y1: cy - Math.sin(angle) * innerR,
      x2: cx + Math.cos(angle) * outerR,
      y2: cy - Math.sin(angle) * outerR,
    }
  })

  return (
    <div
      className="rounded overflow-hidden flex-1 flex flex-col"
      style={{ background: 'linear-gradient(to bottom, #374354, #2a3442, #263040)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-1">
        <h3
          className="text-[13px] font-bold uppercase tracking-[0.15em]"
          style={{ color: '#d4dae3', fontFamily: 'Rajdhani, sans-serif' }}
        >
          Chairman's Happiness
        </h3>
        <Info className="w-3.5 h-3.5 cursor-help" style={{ color: '#5a6a7a' }} />
      </div>

      {/* Gauge + Security */}
      <div className="px-5 pb-3">
        <div className="flex items-start gap-3">
          {/* Semicircular gauge */}
          <div className="flex-shrink-0">
            <svg viewBox="0 0 200 115" className="w-48 h-[100px]">
              <defs>
                <filter id="gaugeGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background arc */}
              <path
                d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                stroke="#1e2a38"
              />

              {/* Track marks */}
              {ticks.map((tick, i) => (
                <line
                  key={i}
                  x1={tick.x1} y1={tick.y1}
                  x2={tick.x2} y2={tick.y2}
                  stroke="#3a4a5e"
                  strokeWidth="1"
                />
              ))}

              {/* Filled arc */}
              <motion.path
                d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                fill="none"
                stroke={arcColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={arcLength}
                initial={{ strokeDashoffset: arcLength }}
                animate={{ strokeDashoffset: arcLength - filledLength }}
                transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
                filter="url(#gaugeGlow)"
              />

              {/* Needle */}
              <motion.line
                x1={cx} y1={cy}
                initial={{ x2: cx - r + 10, y2: cy }}
                animate={{ x2: needleX, y2: needleY }}
                transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Needle pivot */}
              <circle cx={cx} cy={cy} r="5" fill="#1e2a38" stroke="white" strokeWidth="2" />

              {/* Labels */}
              <text x={cx - r + 2} y={cy + 16} fill="#5a6a7a" fontSize="9" fontFamily="Rajdhani, sans-serif" textAnchor="start">
                Disappointed
              </text>
              <text x={cx + r - 2} y={cy + 16} fill="#5a6a7a" fontSize="9" fontFamily="Rajdhani, sans-serif" textAnchor="end">
                Happy
              </text>
            </svg>
          </div>

          {/* Job Security */}
          <div className="flex flex-col items-center justify-center pt-3 flex-1 min-w-0">
            <span
              className="text-[10px] uppercase tracking-[0.15em] mb-2 font-semibold"
              style={{ color: '#6a7a8a', fontFamily: 'Rajdhani, sans-serif' }}
            >
              Job Security
            </span>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="px-4 py-1.5 rounded"
              style={{
                background: security.bgColor,
                border: `1px solid ${security.color}40`,
              }}
            >
              <span
                className="text-sm font-bold tracking-wide"
                style={{ color: security.color, fontFamily: 'Rajdhani, sans-serif' }}
              >
                {security.text}
              </span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Season Objective */}
      <div
        className="px-5 py-3"
        style={{ borderTop: '1px solid #3a4a5e', background: 'rgba(0,0,0,0.15)' }}
      >
        <p
          className="text-[10px] uppercase tracking-[0.15em] mb-1 font-semibold"
          style={{ color: '#6a7a8a', fontFamily: 'Rajdhani, sans-serif' }}
        >
          Season Objective - {data.champType}
        </p>
      </div>

      {/* Currently Deciding — MM3 style status footer */}
      <div
        className="px-5 py-3 mt-auto text-center"
        style={{ borderTop: '1px solid #3a4a5e', background: 'rgba(0,0,0,0.2)' }}
      >
        <span
          className="text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: '#8a9ab0', fontFamily: 'Rajdhani, sans-serif' }}
        >
          Currently Deciding
        </span>
      </div>
    </div>
  )
}
