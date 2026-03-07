/**
 * OperationsCard — Figma-inspired progress bars card
 * Shows: Pit Crew, R&D, Morale with percentage bars.
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Settings, Wrench, FlaskConical, Heart } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'

interface OpMetric {
  icon: React.ReactNode
  label: string
  value: number
  path: string
}

export function OperationsCard() {
  const navigate = useNavigate()
  const { careerState } = useCareerStore()
  const ownedTeam = careerState?.ownedTeam

  const metrics = useMemo((): OpMetric[] => {
    if (!careerState || !ownedTeam) return []

    // Pit Crew score (based on staff count and skills)
    const staffCount = ownedTeam.staff?.length || 0
    const maxStaff = 10
    const pitCrewScore = Math.min(100, Math.round((staffCount / maxStaff) * 100))

    // R&D progress (based on development activities)
    const devLevel = ownedTeam.developmentLevel ?? ownedTeam.facilityLevel ?? 50
    const rndScore = Math.min(100, devLevel)

    // Team morale
    const avgMorale = ownedTeam.staff?.length
      ? Math.round(ownedTeam.staff.reduce((sum, s) => sum + (s.morale ?? 70), 0) / ownedTeam.staff.length)
      : ownedTeam.boardMood ?? 70

    return [
      { icon: <Wrench className="w-4 h-4" />, label: 'PIT CREW', value: pitCrewScore, path: '/garage' },
      { icon: <FlaskConical className="w-4 h-4" />, label: 'R&D', value: rndScore, path: '/garage' },
      { icon: <Heart className="w-4 h-4" />, label: 'MORALE', value: avgMorale, path: '/finances' },
    ]
  }, [careerState, ownedTeam])

  if (metrics.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl border-2 border-black/80 bg-white/[0.08] backdrop-blur-sm shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-black/80">
        <Settings className="w-4 h-4 text-slate-300" />
        <span className="font-display font-black text-sm text-white tracking-tight">
          OPERATIONS
        </span>
      </div>

      {/* Metrics */}
      <div className="p-4 space-y-4">
        {metrics.map((metric, i) => (
          <motion.button
            key={metric.label}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            onClick={() => navigate(metric.path)}
            className="w-full text-left group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">{metric.icon}</span>
                <span className="text-xs font-display font-bold text-white tracking-wider">
                  {metric.label}
                </span>
              </div>
              <span className="text-xs font-display font-black text-white">
                {metric.value}%
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metric.value}%` }}
                transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: metric.value >= 80
                    ? 'linear-gradient(90deg, #10b981, #34d399)'
                    : metric.value >= 50
                      ? 'linear-gradient(90deg, #1e1e22, #3b3b42)'
                      : 'linear-gradient(90deg, #ef4444, #f87171)',
                }}
              />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
