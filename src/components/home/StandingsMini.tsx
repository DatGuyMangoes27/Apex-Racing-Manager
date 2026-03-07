/**
 * StandingsMini — Premium dark leaderboard with player highlight
 * Top 5 + player row, compact for home sidebar.
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Trophy } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'

const COUNTRY_FLAGS: Record<string, string> = {
  'Brazil': '\u{1F1E7}\u{1F1F7}', 'Germany': '\u{1F1E9}\u{1F1EA}', 'UK': '\u{1F1EC}\u{1F1E7}', 'England': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
  'Belgium': '\u{1F1E7}\u{1F1EA}', 'Italy': '\u{1F1EE}\u{1F1F9}', 'Australia': '\u{1F1E6}\u{1F1FA}', 'Japan': '\u{1F1EF}\u{1F1F5}',
  'USA': '\u{1F1FA}\u{1F1F8}', 'France': '\u{1F1EB}\u{1F1F7}', 'Spain': '\u{1F1EA}\u{1F1F8}', 'Austria': '\u{1F1E6}\u{1F1F9}',
  'Netherlands': '\u{1F1F3}\u{1F1F1}', 'Portugal': '\u{1F1F5}\u{1F1F9}', 'Canada': '\u{1F1E8}\u{1F1E6}',
  'Argentina': '\u{1F1E6}\u{1F1F7}', 'Mexico': '\u{1F1F2}\u{1F1FD}', 'Hungary': '\u{1F1ED}\u{1F1FA}',
  'Sweden': '\u{1F1F8}\u{1F1EA}', 'Finland': '\u{1F1EB}\u{1F1EE}', 'Monaco': '\u{1F1F2}\u{1F1E8}',
}

function getPositionStyle(pos: number): string {
  if (pos === 1) return 'text-amber-300 font-black'
  if (pos === 2) return 'text-slate-300 font-bold'
  if (pos === 3) return 'text-amber-600 font-bold'
  return 'text-slate-500 font-semibold'
}

export function StandingsMini() {
  const navigate = useNavigate()
  const { player, careerState } = useCareerStore()
  const { getStandings } = useRivalStore()

  const data = useMemo(() => {
    if (!player?.currentSeriesId) return null
    const standings = getStandings(player.currentSeriesId)
    if (!standings) return null
    const driverStandings = Array.isArray(standings) ? standings : (standings as any).driverStandings ?? standings ?? []
    const top5 = driverStandings.slice(0, 5)
    return { entries: top5 }
  }, [player?.currentSeriesId, getStandings])

  if (!data || data.entries.length === 0) {
    return (
      <div
        className="rounded-xl overflow-hidden p-4"
        style={{ background: 'linear-gradient(135deg, rgba(30,30,34,0.9) 0%, rgba(20,20,24,0.95) 100%)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-slate-500" />
          <h3 className="text-xs font-display font-semibold text-slate-500 uppercase tracking-wider">Standings</h3>
        </div>
        <p className="text-xs text-slate-600">No championship data yet</p>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(30,30,34,0.9) 0%, rgba(20,20,24,0.95) 100%)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400/60" />
          <h3 className="text-xs font-display font-semibold text-slate-400 uppercase tracking-wider">Standings</h3>
        </div>
        <button
          onClick={() => navigate('/paddock')}
          className="flex items-center gap-0.5 text-[10px] font-medium text-slate-500 hover:text-slate-300 transition-colors"
        >
          Full <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Entries */}
      <div>
        {data.entries.map((entry: any, i: number) => {
          const flag = COUNTRY_FLAGS[entry.country] || COUNTRY_FLAGS[entry.nationality] || ''
          const isPlayer = entry.isPlayer
          return (
            <motion.div
              key={entry.driverId || entry.driverName || i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => navigate('/paddock')}
              className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition-colors hover:bg-white/[0.03] ${
                isPlayer ? 'bg-red-500/[0.06]' : ''
              }`}
              style={{ borderBottom: i < data.entries.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}
            >
              {/* Position */}
              <span className={`text-sm font-mono w-5 text-center ${getPositionStyle(entry.position)}`}>
                {entry.position}
              </span>

              {/* Red accent bar for player */}
              {isPlayer && (
                <div className="w-[2px] h-4 rounded-full" style={{ background: 'linear-gradient(180deg, #E10600, #FF8000)' }} />
              )}

              {/* Flag */}
              {flag && <span className="text-sm">{flag}</span>}

              {/* Name */}
              <span className={`flex-1 text-xs font-medium truncate ${
                isPlayer ? 'text-red-400' : 'text-slate-300'
              }`}>
                {entry.driverName}
              </span>

              {/* Points */}
              <span className={`text-xs font-mono font-bold ${
                isPlayer ? 'text-red-400' : 'text-slate-400'
              }`}>
                {entry.points}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
