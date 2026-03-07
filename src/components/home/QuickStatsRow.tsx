/**
 * QuickStatsRow — Figma-inspired 4 stat cards in a row
 * Shows: PTS, RANK, PODIUM, MORALE with large values
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Star, Award, Heart } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'

interface StatCard {
  icon: React.ReactNode
  value: string | number
  label: string
}

export function QuickStatsRow() {
  const { careerState, player } = useCareerStore()
  const { getStandings, getSeriesById } = useRivalStore()

  const stats = useMemo((): StatCard[] => {
    if (!careerState) return []

    // Points
    let points = 0
    let rank = '--'
    let podiums = 0

    if (player?.currentSeriesId) {
      const standings = getStandings(player.currentSeriesId)
      const driverStandings = Array.isArray(standings) ? standings : (standings as any)?.driverStandings ?? standings ?? []
      const playerIdx = driverStandings.findIndex((s: any) => s.isPlayer)
      if (playerIdx >= 0) {
        points = driverStandings[playerIdx].points ?? 0
        rank = `${playerIdx + 1}${getSuffix(playerIdx + 1)}`
        podiums = driverStandings[playerIdx].podiums ?? driverStandings[playerIdx].wins ?? 0
      }
    }

    // Morale
    const boardMood = careerState.ownedTeam?.boardMood ?? 50

    return [
      { icon: <Trophy className="w-5 h-5" />, value: points.toLocaleString(), label: 'PTS' },
      { icon: <Star className="w-5 h-5" />, value: rank, label: 'RANK' },
      { icon: <Award className="w-5 h-5" />, value: podiums, label: 'PODIUM' },
      { icon: <Heart className="w-5 h-5" />, value: `${boardMood}%`, label: 'MORALE' },
    ]
  }, [careerState, player, getStandings, getSeriesById])

  if (stats.length === 0) return null

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-2xl border-2 border-black/80 bg-white/[0.08] backdrop-blur-sm shadow-lg flex flex-col items-center justify-center py-4 px-2 gap-1"
        >
          <div className="text-slate-400">{stat.icon}</div>
          <span className="font-display font-black text-2xl text-white tracking-tight">
            {stat.value}
          </span>
          <span className="text-[9px] font-display font-bold text-slate-500 tracking-widest uppercase">
            {stat.label}
          </span>
        </motion.div>
      ))}
    </div>
  )
}

function getSuffix(n: number): string {
  if (n >= 11 && n <= 13) return 'th'
  switch (n % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}
