/**
 * LifeBalanceGauges — Three balance meters (Team | Personal | Driver)
 * 
 * Each gauge shows a composite score with sub-metrics listed below.
 * Color coding: green (70+), yellow (40-70), red (<40).
 * Clicking navigates to the relevant section.
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Heart, Flag } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { Card, CardHeader } from '@/components/ui'
import { calculateLifeBalanceScores, type LifeBalanceScores } from '@/simulation/activities/suggestionEngine'

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-status-success'
  if (score >= 40) return 'text-accent-orange'
  return 'text-accent-red'
}

function getScoreBg(score: number): string {
  if (score >= 70) return 'from-status-success/20 to-status-success/5'
  if (score >= 40) return 'from-accent-orange/20 to-accent-orange/5'
  return 'from-accent-red/20 to-accent-red/5'
}

function getScoreRingColor(score: number): string {
  if (score >= 70) return 'stroke-status-success'
  if (score >= 40) return 'stroke-accent-orange'
  return 'stroke-accent-red'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 65) return 'Good'
  if (score >= 45) return 'Fair'
  if (score >= 25) return 'Poor'
  return 'Critical'
}

function formatMetricValue(value: number): string {
  if (!Number.isFinite(value)) return '0'
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export function LifeBalanceGauges({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  const { careerState, player } = useCareerStore()

  const scores = useMemo<LifeBalanceScores | null>(() => {
    if (!careerState || !player) return null
    return calculateLifeBalanceScores(careerState, player as unknown as Record<string, unknown>)
  }, [careerState, player])

  if (!scores) return null

  if (compact) {
    const gauges = [
      { label: 'Team', icon: <Building2 className="w-3 h-3" />, score: scores.teamHealth.composite, path: '/finances' },
      { label: 'Personal', icon: <Heart className="w-3 h-3" />, score: scores.personalLife.composite, path: '/personal-life' },
      { label: 'Racing', icon: <Flag className="w-3 h-3" />, score: scores.driverPerformance.composite, path: '/garage' },
    ]
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-3 rounded-xl border border-surface-border"
      >
        <h3 className="text-[10px] font-display font-semibold text-text-muted uppercase tracking-wider mb-2">
          Life Balance
        </h3>
        <div className="space-y-2">
          {gauges.map((g) => (
            <div
              key={g.label}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate(g.path)}
            >
              <span className={getScoreColor(g.score)}>{g.icon}</span>
              <span className="text-[10px] text-text-secondary font-medium w-14 shrink-0">{g.label}</span>
              <div className="flex-1 h-2.5 bg-surface-secondary rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    g.score >= 70 ? 'bg-status-success' : g.score >= 40 ? 'bg-accent-orange' : 'bg-accent-red'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${g.score}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <span className={`text-[10px] font-mono font-bold w-6 text-right ${getScoreColor(g.score)}`}>
                {g.score}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <GaugeCard
        title="Team Health"
        icon={<Building2 className="w-4 h-4" />}
        score={scores.teamHealth.composite}
        metrics={[
          { label: 'Board Mood', value: scores.teamHealth.boardMood },
          { label: 'Staff Morale', value: scores.teamHealth.teamMorale },
          { label: 'Financial Runway', value: scores.teamHealth.financialRunway },
          { label: 'Sponsor Satisfaction', value: scores.teamHealth.sponsorSatisfaction },
        ]}
        onClick={() => navigate('/finances')}
      />
      <GaugeCard
        title="Personal Life"
        icon={<Heart className="w-4 h-4" />}
        score={scores.personalLife.composite}
        metrics={[
          { label: 'Partner Happiness', value: scores.personalLife.partnerHappiness },
          { label: 'Stress', value: scores.personalLife.stress, inverted: true },
          { label: 'Mental Health', value: scores.personalLife.mentalHealth },
          { label: 'Social Life', value: scores.personalLife.socialLife },
        ]}
        onClick={() => navigate('/personal-life')}
      />
      <GaugeCard
        title="Driver Performance"
        icon={<Flag className="w-4 h-4" />}
        score={scores.driverPerformance.composite}
        metrics={[
          { label: 'Fitness', value: scores.driverPerformance.fitness },
          { label: 'Confidence', value: scores.driverPerformance.confidence },
          { label: 'Car Readiness', value: scores.driverPerformance.carReadiness },
          { label: 'Championship', value: scores.driverPerformance.championshipScore },
        ]}
        onClick={() => navigate('/garage')}
      />
    </div>
  )
}

function GaugeCard({
  title,
  icon,
  score,
  metrics,
  onClick,
}: {
  title: string
  icon: React.ReactNode
  score: number
  metrics: Array<{ label: string; value: number; inverted?: boolean }>
  onClick: () => void
}) {
  const circumference = 2 * Math.PI * 40  // radius = 40
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <Card className="cursor-pointer hover:border-accent-orange/30 transition-all" onClick={onClick}>
      <div className={`p-4 bg-gradient-to-b ${getScoreBg(score)} rounded-xl`}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className={getScoreColor(score)}>{icon}</span>
          <h3 className="text-sm font-display font-semibold text-text-primary">{title}</h3>
        </div>

        {/* Circular Gauge */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
              {/* Background ring */}
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                strokeWidth="8"
                className="stroke-surface-secondary/50"
              />
              {/* Score ring */}
              <motion.circle
                cx="50" cy="50" r="40"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                className={getScoreRingColor(score)}
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-mono font-black text-xl leading-none ${getScoreColor(score)}`}>
                {score}
              </span>
              <span className="text-[9px] text-text-muted mt-0.5">{getScoreLabel(score)}</span>
            </div>
          </div>

          {/* Sub-metrics */}
          <div className="flex-1 space-y-1.5">
            {metrics.map((m) => {
              // For inverted metrics (e.g. Stress), lower = better (green), higher = worse (red)
              const colorValue = m.inverted ? (100 - m.value) : m.value
              const clampedWidth = Math.max(0, Math.min(100, m.value))
              return (
                <div key={m.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-text-muted flex-1 truncate">{m.label}</span>
                  <div className="w-16 h-1.5 bg-surface-secondary/50 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        colorValue >= 70 ? 'bg-status-success' :
                        colorValue >= 40 ? 'bg-accent-orange' :
                        'bg-accent-red'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${clampedWidth}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  <span className={`text-[10px] font-mono w-6 text-right ${getScoreColor(colorValue)}`}>
                    {formatMetricValue(m.value)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}
