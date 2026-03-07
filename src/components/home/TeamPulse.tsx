/**
 * TeamPulse — Dark glass stat tiles inspired by analytics dashboards
 * Each tile: icon, label, big value, sub-value, color-coded, hover lift
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  DollarSign,
  Smile,
  Meh,
  Frown,
  Shield,
  Car,
  Trophy,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'

function formatCash(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount}`
}

function getMoodIcon(mood: number) {
  if (mood >= 60) return <Smile className="w-5 h-5" />
  if (mood >= 35) return <Meh className="w-5 h-5" />
  return <Frown className="w-5 h-5" />
}

interface StatTile {
  id: string
  label: string
  value: string
  subValue?: string
  icon: React.ReactNode
  accentColor: string
  glowColor: string
  path: string
  trend?: 'up' | 'down'
  trendLabel?: string
}

export function TeamPulse() {
  const navigate = useNavigate()
  const { careerState, player } = useCareerStore()
  const { getStandings, getSeriesById } = useRivalStore()
  const ownedTeam = careerState?.ownedTeam

  const stats = useMemo((): StatTile[] => {
    const items: StatTile[] = []
    if (!careerState) return items

    // 1. Cash
    if (ownedTeam) {
      const cash = ownedTeam.budgets?.cash ?? ownedTeam.finances?.cash ?? 0
      items.push({
        id: 'cash',
        label: 'Cash',
        value: formatCash(cash),
        icon: <DollarSign className="w-5 h-5" />,
        accentColor: cash >= 0 ? 'text-emerald-400' : 'text-red-400',
        glowColor: cash >= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
        path: '/finances',
        trend: cash >= 0 ? 'up' : 'down',
        trendLabel: cash >= 0 ? 'Healthy' : 'Critical',
      })
    }

    // 2. Board Mood
    if (ownedTeam) {
      const mood = ownedTeam.boardMood ?? 50
      const color = mood >= 70 ? 'text-emerald-400' : mood >= 45 ? 'text-amber-400' : 'text-red-400'
      const glow = mood >= 70 ? 'rgba(52,211,153,0.15)' : mood >= 45 ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)'
      items.push({
        id: 'board',
        label: 'Board Mood',
        value: `${mood}%`,
        icon: getMoodIcon(mood),
        accentColor: color,
        glowColor: glow,
        path: '/finances',
        trendLabel: mood >= 70 ? 'Happy' : mood >= 45 ? 'Cautious' : 'Angry',
      })
    }

    // 3. Car Readiness
    if (ownedTeam) {
      const staffCount = ownedTeam.staff?.length || 0
      const hasEngineer = ownedTeam.staff?.some(s => s.role === 'chief_engineer' || s.role === 'engineer')
      const hasStrategist = ownedTeam.staff?.some(s => s.role === 'strategist')
      const staffScore = Math.min(100, staffCount * 20 + (hasEngineer ? 20 : 0) + (hasStrategist ? 20 : 0))
      const carCount = careerState.cars?.length || 0
      const avgCarHealth = carCount > 0
        ? careerState.cars!.reduce((sum, c) => {
            const wearValues = c.partWear ? Object.values(c.partWear).filter((v): v is number => typeof v === 'number') : []
            const avgWear = wearValues.length > 0 ? wearValues.reduce((s, w) => s + w, 0) / wearValues.length : 0
            return sum + (100 - avgWear)
          }, 0) / carCount
        : 0
      const readiness = Math.round((staffScore + avgCarHealth) / 2)
      const color = readiness >= 70 ? 'text-emerald-400' : readiness >= 45 ? 'text-amber-400' : 'text-red-400'
      const glow = readiness >= 70 ? 'rgba(52,211,153,0.15)' : readiness >= 45 ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)'
      items.push({
        id: 'readiness',
        label: 'Readiness',
        value: `${readiness}%`,
        icon: <Shield className="w-5 h-5" />,
        accentColor: color,
        glowColor: glow,
        path: '/garage',
      })
    }

    // 4. Championship Position
    if (player?.currentSeriesId) {
      const standings = getStandings(player.currentSeriesId)
      const series = getSeriesById(player.currentSeriesId)
      const driverStandings = Array.isArray(standings) ? standings : (standings as any)?.driverStandings ?? standings ?? []
      const playerIdx = driverStandings.findIndex((s: any) => s.isPlayer)
      const totalTeams = series?.teams?.length ?? driverStandings.length ?? 12
      const pos = playerIdx >= 0 ? playerIdx + 1 : null
      const color = pos && pos <= 3 ? 'text-amber-300' : 'text-slate-200'
      items.push({
        id: 'championship',
        label: 'Championship',
        value: pos ? `P${pos}` : '--',
        subValue: pos ? `of ${totalTeams}` : undefined,
        icon: <Trophy className="w-5 h-5" />,
        accentColor: color,
        glowColor: pos && pos <= 3 ? 'rgba(252,211,77,0.15)' : 'rgba(148,163,184,0.08)',
        path: '/paddock',
      })
    }

    // 5. Fleet Health
    if (careerState.cars?.length) {
      const cars = careerState.cars
      const avgHealth = Math.round(
        cars.reduce((sum, c) => {
          const wearValues = c.partWear ? Object.values(c.partWear).filter((v): v is number => typeof v === 'number') : []
          const avgWear = wearValues.length > 0 ? wearValues.reduce((s, w) => s + w, 0) / wearValues.length : 0
          return sum + (100 - avgWear)
        }, 0) / cars.length
      )
      const color = avgHealth >= 70 ? 'text-emerald-400' : avgHealth >= 45 ? 'text-amber-400' : 'text-red-400'
      const glow = avgHealth >= 70 ? 'rgba(52,211,153,0.15)' : avgHealth >= 45 ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)'
      items.push({
        id: 'fleet',
        label: 'Fleet Health',
        value: `${avgHealth}%`,
        subValue: `${cars.length} car${cars.length > 1 ? 's' : ''}`,
        icon: <Car className="w-5 h-5" />,
        accentColor: color,
        glowColor: glow,
        path: '/garage',
      })
    }

    return items
  }, [careerState, ownedTeam, player, getStandings, getSeriesById])

  if (stats.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-2.5">
      {stats.map((stat, i) => (
        <motion.button
          key={stat.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.3 }}
          onClick={() => navigate(stat.path)}
          className="group relative overflow-hidden rounded-xl border border-white/[0.06] p-4 text-left transition-all duration-300 hover:border-white/[0.12] hover:-translate-y-[1px] hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, rgba(30,30,34,0.9) 0%, rgba(20,20,24,0.95) 100%)' }}
        >
          {/* Decorative glow orb */}
          <div
            className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-60 group-hover:opacity-90 transition-opacity"
            style={{ background: stat.glowColor }}
          />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`${stat.accentColor} opacity-80`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className={`font-display font-bold text-2xl tracking-tight ${stat.accentColor}`}>
                    {stat.value}
                  </span>
                  {stat.subValue && (
                    <span className="text-[11px] text-slate-500">{stat.subValue}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Trend / status badge */}
            {(stat.trend || stat.trendLabel) && (
              <div className="flex items-center gap-1 shrink-0">
                {stat.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                {stat.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                {stat.trendLabel && (
                  <span className={`text-[10px] font-medium ${
                    stat.trend === 'up' ? 'text-emerald-400/80' :
                    stat.trend === 'down' ? 'text-red-400/80' :
                    'text-slate-500'
                  }`}>
                    {stat.trendLabel}
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.button>
      ))}
    </div>
  )
}
