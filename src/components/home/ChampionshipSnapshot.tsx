import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'

const COUNTRY_FLAGS: Record<string, string> = {
  'Brazil': '\u{1F1E7}\u{1F1F7}', 'Germany': '\u{1F1E9}\u{1F1EA}', 'UK': '\u{1F1EC}\u{1F1E7}', 'England': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
  'Belgium': '\u{1F1E7}\u{1F1EA}', 'Italy': '\u{1F1EE}\u{1F1F9}', 'Australia': '\u{1F1E6}\u{1F1FA}', 'Japan': '\u{1F1EF}\u{1F1F5}',
  'USA': '\u{1F1FA}\u{1F1F8}', 'France': '\u{1F1EB}\u{1F1F7}', 'Spain': '\u{1F1EA}\u{1F1F8}', 'Austria': '\u{1F1E6}\u{1F1F9}',
  'Netherlands': '\u{1F1F3}\u{1F1F1}', 'Portugal': '\u{1F1F5}\u{1F1F9}', 'Canada': '\u{1F1E8}\u{1F1E6}',
  'Argentina': '\u{1F1E6}\u{1F1F7}', 'Mexico': '\u{1F1F2}\u{1F1FD}', 'China': '\u{1F1E8}\u{1F1F3}', 'South Africa': '\u{1F1FF}\u{1F1E6}',
  'Sweden': '\u{1F1F8}\u{1F1EA}', 'Finland': '\u{1F1EB}\u{1F1EE}', 'Malaysia': '\u{1F1F2}\u{1F1FE}', 'Singapore': '\u{1F1F8}\u{1F1EC}',
  'New Zealand': '\u{1F1F3}\u{1F1FF}', 'Denmark': '\u{1F1E9}\u{1F1F0}', 'Norway': '\u{1F1F3}\u{1F1F4}',
  'Hungary': '\u{1F1ED}\u{1F1FA}', 'Czech Republic': '\u{1F1E8}\u{1F1FF}', 'Monaco': '\u{1F1F2}\u{1F1E8}',
  'Thailand': '\u{1F1F9}\u{1F1ED}', 'Colombia': '\u{1F1E8}\u{1F1F4}', 'India': '\u{1F1EE}\u{1F1F3}',
}

type Tab = 'drivers' | 'teams'

export function ChampionshipSnapshot() {
  const navigate = useNavigate()
  const { player, careerState } = useCareerStore()
  const { getStandings, getSeriesById } = useRivalStore()
  const [activeTab, setActiveTab] = useState<Tab>('drivers')

  const data = useMemo(() => {
    if (!player?.currentSeriesId) return null

    const standings = getStandings(player.currentSeriesId)
    if (!standings) return null

    const series = getSeriesById(player.currentSeriesId)
    const driverStandings = Array.isArray(standings) ? standings : (standings.driverStandings ?? standings)
    const teamStandings = (standings as any)?.teamStandings ?? []
    const teamName = careerState?.ownedTeam?.name

    return {
      driverStandings: (driverStandings ?? []).slice(0, 11),
      teamStandings: teamStandings.slice(0, 11),
      playerTeamName: teamName,
      seriesName: series?.shortName || series?.name || 'Championship',
    }
  }, [player?.currentSeriesId, getStandings, getSeriesById, careerState?.ownedTeam])

  return (
    <div
      className="rounded flex flex-col flex-1 min-h-0 overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #374354, #2a3442, #263040)' }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <h3
          className="text-sm font-bold uppercase tracking-[0.15em] text-center"
          style={{ color: '#d4dae3', fontFamily: 'Rajdhani, sans-serif' }}
        >
          Standings
        </h3>
      </div>

      {/* Tab Toggle — MM3 style: Teams | Drivers */}
      <div className="flex mx-4 mb-2 rounded overflow-hidden" style={{ border: '1px solid #3a4a5e' }}>
        {(['teams', 'drivers'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              background: activeTab === tab
                ? 'linear-gradient(to bottom, #E10600, #c00500)'
                : 'rgba(30, 42, 56, 0.5)',
              color: activeTab === tab ? '#fff' : '#6a7a8a',
            }}
          >
            {tab === 'drivers' ? 'Drivers' : 'Teams'}
          </button>
        ))}
      </div>

      {/* Standings Table */}
      <div className="flex-1 overflow-y-auto px-3 min-h-0">
        {!data ? (
          <p
            className="text-xs text-center py-4"
            style={{ color: '#4a5a6e', fontFamily: 'Rajdhani, sans-serif' }}
          >
            No championship data yet
          </p>
        ) : activeTab === 'drivers' ? (
          <table className="w-full">
            <thead>
              <tr style={{ color: '#5a6a7a' }}>
                <th className="text-left pb-2 text-[9px] font-semibold uppercase tracking-[0.15em] w-7">Pos</th>
                <th className="text-left pb-2 text-[9px] font-semibold uppercase tracking-[0.15em] w-6"></th>
                <th className="text-left pb-2 text-[9px] font-semibold uppercase tracking-[0.15em]">Driver</th>
                <th className="text-left pb-2 text-[9px] font-semibold uppercase tracking-[0.15em]">Team</th>
                <th className="text-right pb-2 text-[9px] font-semibold uppercase tracking-[0.15em] w-12">PTS</th>
              </tr>
            </thead>
            <tbody>
              {data.driverStandings.map((entry: any, i: number) => {
                const flag = COUNTRY_FLAGS[entry.country] || COUNTRY_FLAGS[entry.nationality] || ''
                const isPlayer = entry.isPlayer
                return (
                  <motion.tr
                    key={entry.driverId || entry.driverName || i}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    style={{
                      borderTop: '1px solid rgba(58, 74, 94, 0.3)',
                      background: isPlayer ? 'rgba(225, 6, 0, 0.08)' : 'transparent',
                    }}
                    className="transition-colors hover:bg-[#2a3a4e]"
                  >
                    <td className="py-1.5">
                      <span
                        className="text-xs font-mono font-bold"
                        style={{ color: isPlayer ? '#E10600' : '#8a9ab0' }}
                      >
                        {entry.position}
                      </span>
                    </td>
                    <td className="py-1.5">
                      {flag && <span className="text-xs">{flag}</span>}
                    </td>
                    <td className="py-1.5">
                      <span
                        className="text-xs font-semibold"
                        style={{
                          color: isPlayer ? '#E10600' : '#c8d0dc',
                          fontFamily: 'Rajdhani, sans-serif',
                        }}
                      >
                        {entry.driverName}
                      </span>
                    </td>
                    <td className="py-1.5">
                      <span
                        className="text-[11px] truncate block max-w-[90px]"
                        style={{ color: '#6a7a8a' }}
                      >
                        {entry.teamName}
                      </span>
                    </td>
                    <td className="py-1.5 text-right">
                      <span
                        className="text-xs font-mono font-bold"
                        style={{ color: isPlayer ? '#E10600' : '#c8d0dc' }}
                      >
                        {entry.points}
                      </span>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ color: '#5a6a7a' }}>
                <th className="text-left pb-2 text-[9px] font-semibold uppercase tracking-[0.15em] w-7">Pos</th>
                <th className="text-left pb-2 text-[9px] font-semibold uppercase tracking-[0.15em]">Team</th>
                <th className="text-right pb-2 text-[9px] font-semibold uppercase tracking-[0.15em] w-12">PTS</th>
              </tr>
            </thead>
            <tbody>
              {data.teamStandings.map((entry: any, i: number) => {
                const isPlayer = entry.teamName === data.playerTeamName || entry.teamId === careerState?.ownedTeam?.id
                return (
                  <motion.tr
                    key={entry.teamId || entry.teamName || i}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    style={{
                      borderTop: '1px solid rgba(58, 74, 94, 0.3)',
                      background: isPlayer ? 'rgba(225, 6, 0, 0.08)' : 'transparent',
                    }}
                    className="transition-colors hover:bg-[#2a3a4e]"
                  >
                    <td className="py-1.5">
                      <span
                        className="text-xs font-mono font-bold"
                        style={{ color: isPlayer ? '#E10600' : '#8a9ab0' }}
                      >
                        {entry.position}
                      </span>
                    </td>
                    <td className="py-1.5">
                      <span
                        className="text-xs font-semibold"
                        style={{
                          color: isPlayer ? '#E10600' : '#c8d0dc',
                          fontFamily: 'Rajdhani, sans-serif',
                        }}
                      >
                        {entry.teamName}
                      </span>
                    </td>
                    <td className="py-1.5 text-right">
                      <span
                        className="text-xs font-mono font-bold"
                        style={{ color: isPlayer ? '#E10600' : '#c8d0dc' }}
                      >
                        {entry.points}
                      </span>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Standings CTA — MM3 blue button */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid #3a4a5e' }}>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/paddock')}
          className="w-full py-2 font-bold text-xs uppercase tracking-wider rounded"
          style={{
            background: 'linear-gradient(to bottom, #4fa8d6, #3a8db8)',
            color: '#fff',
            fontFamily: 'Rajdhani, sans-serif',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          Standings
        </motion.button>
      </div>
    </div>
  )
}
