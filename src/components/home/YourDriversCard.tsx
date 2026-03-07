/**
 * YourDriversCard — Figma-inspired driver roster
 * Shows driver name, wins, and overall rating with avatars.
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, ChevronRight, User } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'

export function YourDriversCard() {
  const navigate = useNavigate()
  const { careerState } = useCareerStore()
  const ownedTeam = careerState?.ownedTeam

  const drivers = useMemo(() => {
    if (!ownedTeam?.drivers) return []
    return ownedTeam.drivers.slice(0, 3).map(driver => ({
      id: driver.id || driver.name,
      name: driver.name || 'Unknown Driver',
      wins: driver.wins ?? driver.seasonWins ?? 0,
      rating: driver.overall ?? driver.rating ?? driver.skill ?? 80,
    }))
  }, [ownedTeam])

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="rounded-2xl border-2 border-black/80 bg-white/[0.08] backdrop-blur-sm shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black/80">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-300" />
          <span className="font-display font-black text-sm text-white tracking-tight">
            YOUR DRIVERS
          </span>
        </div>
        <button
          onClick={() => navigate('/paddock')}
          className="flex items-center gap-0.5 text-[10px] font-display font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider"
        >
          View All <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Driver list */}
      <div className="divide-y divide-white/[0.06]">
        {drivers.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No drivers signed</p>
          </div>
        ) : (
          drivers.map((driver, i) => (
            <motion.button
              key={driver.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              onClick={() => navigate('/paddock')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors group"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                <User className="w-5 h-5 text-slate-500" />
              </div>

              {/* Name and wins */}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-display font-bold text-white truncate">
                  {driver.name.toUpperCase()}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  {driver.wins} WINS
                </p>
              </div>

              {/* Rating */}
              <span className="font-display font-black text-3xl text-white leading-none">
                {driver.rating}
              </span>
            </motion.button>
          ))
        )}
      </div>
    </motion.div>
  )
}
