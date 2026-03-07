import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
} from 'lucide-react'
import { useCareerCreation } from '../CareerCreationContext'
import {
  getModernCarClasses,
  type AMS2RealTeam,
  type TeamTier,
} from '@/data/ams2-teams-real'
import { getAllChampionships } from '@/data/championships'
import { getLiveryImage } from '@/utils/images'

const TIER_LABELS: Record<TeamTier, string> = {
  entry: 'Entry',
  amateur: 'Amateur',
  'semi-pro': 'Semi-Pro',
  professional: 'Professional',
  pro: 'Pro',
  elite: 'Elite',
  pinnacle: 'Pinnacle',
}

const TIER_COLORS: Record<TeamTier, string> = {
  entry: '#6B6B6B',
  amateur: '#A0A0A0',
  'semi-pro': '#00D26A',
  professional: '#007AFF',
  pro: '#FF8000',
  elite: '#FFD700',
  pinnacle: '#E10600',
}

const BUDGET_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: 'Low Budget', color: '#6B6B6B' },
  medium: { label: 'Mid Budget', color: '#A0A0A0' },
  high: { label: 'High Budget', color: '#FFD700' },
  factory: { label: 'Factory', color: '#E10600' },
}

const COUNTRY_FLAGS: Record<string, string> = {
  'USA': '\u{1F1FA}\u{1F1F8}', 'United States': '\u{1F1FA}\u{1F1F8}',
  'UK': '\u{1F1EC}\u{1F1E7}', 'United Kingdom': '\u{1F1EC}\u{1F1E7}', 'England': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
  'Germany': '\u{1F1E9}\u{1F1EA}', 'Italy': '\u{1F1EE}\u{1F1F9}', 'France': '\u{1F1EB}\u{1F1F7}',
  'Japan': '\u{1F1EF}\u{1F1F5}', 'Brazil': '\u{1F1E7}\u{1F1F7}', 'Australia': '\u{1F1E6}\u{1F1FA}',
  'Spain': '\u{1F1EA}\u{1F1F8}', 'Austria': '\u{1F1E6}\u{1F1F9}', 'Netherlands': '\u{1F1F3}\u{1F1F1}',
  'Belgium': '\u{1F1E7}\u{1F1EA}', 'Canada': '\u{1F1E8}\u{1F1E6}', 'Mexico': '\u{1F1F2}\u{1F1FD}',
  'Sweden': '\u{1F1F8}\u{1F1EA}', 'Finland': '\u{1F1EB}\u{1F1EE}', 'Denmark': '\u{1F1E9}\u{1F1F0}',
  'Switzerland': '\u{1F1E8}\u{1F1ED}', 'Portugal': '\u{1F1F5}\u{1F1F9}', 'Argentina': '\u{1F1E6}\u{1F1F7}',
  'South Africa': '\u{1F1FF}\u{1F1E6}', 'New Zealand': '\u{1F1F3}\u{1F1FF}', 'China': '\u{1F1E8}\u{1F1F3}',
  'South Korea': '\u{1F1F0}\u{1F1F7}', 'Malaysia': '\u{1F1F2}\u{1F1FE}', 'Singapore': '\u{1F1F8}\u{1F1EC}',
  'Monaco': '\u{1F1F2}\u{1F1E8}', 'Hungary': '\u{1F1ED}\u{1F1FA}', 'Czech Republic': '\u{1F1E8}\u{1F1FF}',
  'Norway': '\u{1F1F3}\u{1F1F4}', 'Ireland': '\u{1F1EE}\u{1F1EA}', 'Poland': '\u{1F1F5}\u{1F1F1}',
  'Colombia': '\u{1F1E8}\u{1F1F4}', 'India': '\u{1F1EE}\u{1F1F3}', 'Thailand': '\u{1F1F9}\u{1F1ED}',
}

function getStarRating(prestige: number): number {
  if (prestige >= 90) return 5
  if (prestige >= 70) return 4
  if (prestige >= 50) return 3
  if (prestige >= 30) return 2
  return 1
}

function getPlayableClassIds(): Set<string> {
  const championships = getAllChampionships()
  const classIds = new Set<string>()
  championships.forEach(c => c.carClassIds.forEach(id => classIds.add(id)))
  return classIds
}

export default function TeamBrowser() {
  const { selectedRealTeam, setSelectedRealTeam } = useCareerCreation()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<TeamTier | 'all'>('all')
  const [classFilter, setClassFilter] = useState<string | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [liveryError, setLiveryError] = useState(false)

  const playableClassIds = useMemo(() => getPlayableClassIds(), [])
  const carClasses = useMemo(() => {
    return getModernCarClasses().filter(c => playableClassIds.has(c.id))
  }, [playableClassIds])

  const allTeams = useMemo(() => {
    const teams: AMS2RealTeam[] = []
    const seen = new Set<string>()
    carClasses.forEach(cls => {
      cls.teams.forEach(team => {
        if (!seen.has(team.id)) {
          seen.add(team.id)
          teams.push(team)
        }
      })
    })
    return teams.sort((a, b) => a.name.localeCompare(b.name))
  }, [carClasses])

  const filteredTeams = useMemo(() => {
    let teams = allTeams

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      teams = teams.filter(
        t =>
          t.name.toLowerCase().includes(q) ||
          t.carClassName.toLowerCase().includes(q) ||
          t.country.toLowerCase().includes(q)
      )
    }

    if (tierFilter !== 'all') {
      teams = teams.filter(t => t.tier === tierFilter)
    }

    if (classFilter !== 'all') {
      teams = teams.filter(t => t.carClassId === classFilter)
    }

    return teams
  }, [allTeams, searchQuery, tierFilter, classFilter])

  const uniqueTiers = useMemo(() => {
    const tiers = new Set<TeamTier>()
    allTeams.forEach(t => tiers.add(t.tier))
    return Array.from(tiers).sort()
  }, [allTeams])

  useEffect(() => {
    if (!selectedRealTeam && filteredTeams.length > 0) {
      setSelectedRealTeam(filteredTeams[0])
    }
  }, [filteredTeams])

  useEffect(() => {
    setLiveryError(false)
  }, [selectedRealTeam?.id])

  const handleSelectTeam = (team: AMS2RealTeam) => {
    setSelectedRealTeam(team)
  }

  const selectedLiveryUrl = useMemo(() => {
    if (!selectedRealTeam?.liveryNames?.length) return null
    return getLiveryImage(selectedRealTeam.carClassId, selectedRealTeam.liveryNames[0])
  }, [selectedRealTeam])

  const team = selectedRealTeam
  const tierColor = team ? (TIER_COLORS[team.tier] || '#6B6B6B') : '#6B6B6B'
  const budgetInfo = team ? (BUDGET_LABELS[team.budget] || { label: team.budget, color: '#6B6B6B' }) : { label: '', color: '#6B6B6B' }

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: '#1a2230' }}>
      {/* Header bar */}
      <div
        className="relative z-30 flex items-center justify-between px-6 py-3"
        style={{
          background: 'linear-gradient(to bottom, #0d1520, #0d1520f2, transparent)',
        }}
      >
        <div>
          <h1
            className="text-xl tracking-[0.15em] uppercase"
            style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, color: '#e8edf3' }}
          >
            Team Select
          </h1>
          <p className="text-[11px]" style={{ color: '#5a6a7a' }}>
            Choose which team to start managing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2"
            >
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#5a6a7a' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-48 pl-8 pr-3 py-1.5 rounded text-xs focus:outline-none"
                  style={{
                    background: 'rgba(30, 42, 56, 0.8)',
                    border: '1px solid #3a4a5e',
                    color: '#d4dae3',
                  }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: '#5a6a7a' }}>
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <select
                value={tierFilter}
                onChange={e => setTierFilter(e.target.value as TeamTier | 'all')}
                className="px-2 py-1.5 rounded text-xs focus:outline-none cursor-pointer"
                style={{
                  background: 'rgba(30, 42, 56, 0.8)',
                  border: '1px solid #3a4a5e',
                  color: '#d4dae3',
                }}
              >
                <option value="all">All Tiers</option>
                {uniqueTiers.map(tier => (
                  <option key={tier} value={tier}>{TIER_LABELS[tier]}</option>
                ))}
              </select>
              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                className="px-2 py-1.5 rounded text-xs focus:outline-none cursor-pointer"
                style={{
                  background: 'rgba(30, 42, 56, 0.8)',
                  border: '1px solid #3a4a5e',
                  color: '#d4dae3',
                }}
              >
                <option value="all">All Classes</option>
                {carClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </motion.div>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded transition-colors"
            style={{
              background: showFilters ? 'rgba(225, 6, 0, 0.15)' : 'rgba(30, 42, 56, 0.6)',
              border: showFilters ? '1px solid rgba(225, 6, 0, 0.3)' : '1px solid #3a4a5e',
              color: showFilters ? '#E10600' : '#6a7a8a',
            }}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main area — car livery + info panel */}
      <div className="flex-1 relative min-h-0">
        <AnimatePresence mode="wait">
          {team && (
            <motion.div
              key={team.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0"
            >
              {selectedLiveryUrl && !liveryError ? (
                <img
                  src={selectedLiveryUrl}
                  alt={team.liveryNames[0]}
                  className="w-full h-full object-cover object-center"
                  onError={() => setLiveryError(true)}
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{
                    background: `linear-gradient(135deg, ${team.color}30 0%, #1a2230 60%, ${team.color}10 100%)`,
                  }}
                />
              )}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, transparent, transparent 50%, rgba(13, 21, 32, 0.85))' }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0d1520 0%, rgba(13, 21, 32, 0.3) 50%, transparent)' }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(13, 21, 32, 0.6), transparent 30%)' }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Team info panel — floating right side */}
        <AnimatePresence mode="wait">
          {team && (
            <motion.div
              key={`info-${team.id}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="absolute top-4 right-4 bottom-4 w-[300px] z-20"
            >
              <div
                className="h-full rounded flex flex-col overflow-hidden"
                style={{
                  background: 'linear-gradient(to bottom, rgba(55, 67, 84, 0.92), rgba(42, 52, 66, 0.92))',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid #3a4a5e',
                }}
              >
                {/* Team color accent bar */}
                <div className="h-1 shrink-0" style={{ background: team.color }} />

                {/* Team name + country */}
                <div className="px-5 pt-5 pb-3">
                  <h2
                    className="text-2xl tracking-wide leading-tight mb-2"
                    style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, color: '#e8edf3' }}
                  >
                    {team.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{COUNTRY_FLAGS[team.country] || ''}</span>
                    <span className="text-sm font-medium" style={{ color: '#8a9ab0' }}>{team.country}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="px-5 pb-4">
                  <p className="text-xs leading-relaxed" style={{ color: '#6a7a8a' }}>
                    Competing in the <span style={{ color: '#8a9ab0' }} className="font-medium">{team.carClassName}</span> class.
                    {team.payDriver && ' Pay driver seat available.'}
                    {team.tier === 'pinnacle' && ' A top-tier operation at the pinnacle of motorsport.'}
                    {team.tier === 'elite' && ' An elite team with championship pedigree.'}
                    {team.tier === 'entry' && ' A grassroots team looking for a strong leader.'}
                  </p>
                </div>

                <div className="mx-5" style={{ borderTop: '1px solid #3a4a5e' }} />

                {/* Budget */}
                <div className="px-5 py-3 text-center">
                  <span
                    className="text-[10px] uppercase tracking-[0.15em]"
                    style={{ color: '#5a6a7a', fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    Budget
                  </span>
                  <p
                    className="text-xl tracking-wide mt-0.5"
                    style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, color: budgetInfo.color }}
                  >
                    {budgetInfo.label}
                  </p>
                </div>

                {/* Tier + Prestige */}
                <div className="px-5 pb-3 flex gap-4">
                  <div className="flex-1 text-center">
                    <span
                      className="text-[10px] uppercase tracking-[0.15em] block"
                      style={{ color: '#5a6a7a', fontFamily: 'Rajdhani, sans-serif' }}
                    >
                      Tier
                    </span>
                    <span
                      className="text-lg mt-0.5 block"
                      style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: tierColor }}
                    >
                      {TIER_LABELS[team.tier]}
                    </span>
                  </div>
                  <div className="flex-1 text-center">
                    <span
                      className="text-[10px] uppercase tracking-[0.15em] block"
                      style={{ color: '#5a6a7a', fontFamily: 'Rajdhani, sans-serif' }}
                    >
                      Prestige
                    </span>
                    <span
                      className="text-lg mt-0.5 block"
                      style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: '#e8edf3' }}
                    >
                      {team.prestige}
                    </span>
                  </div>
                </div>

                <div className="mx-5" style={{ borderTop: '1px solid #3a4a5e' }} />

                {/* Mini stat bars */}
                <div className="px-5 py-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: team.color }} />
                    <span
                      className="text-[10px] uppercase tracking-[0.15em]"
                      style={{ color: '#5a6a7a', fontFamily: 'Rajdhani, sans-serif' }}
                    >
                      Team Overview
                    </span>
                  </div>
                  <div className="flex items-end gap-1 h-16">
                    {[
                      { label: 'Car', value: Math.min(100, team.prestige + 10) },
                      { label: 'Drv', value: Math.min(100, team.prestige + 5) },
                      { label: 'HQ', value: Math.min(100, team.prestige - 5) },
                      { label: 'Staff', value: Math.min(100, team.prestige) },
                      { label: 'Spnsr', value: Math.min(100, team.prestige - 10) },
                      { label: 'Pit', value: Math.min(100, team.prestige + 2) },
                    ].map((stat, i) => (
                      <div key={stat.label} className="flex-1 flex flex-col items-center gap-1">
                        <motion.div
                          className="w-full rounded-t"
                          style={{
                            background: 'linear-gradient(to top, #2d8a4e, #4cb868, #7dd89a)',
                            height: `${Math.max(8, (stat.value / 100) * 52)}px`,
                          }}
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(8, (stat.value / 100) * 52)}px` }}
                          transition={{ duration: 0.5, delay: 0.3 + i * 0.05 }}
                        />
                        <span
                          className="text-[7px] uppercase"
                          style={{ color: '#5a6a7a', fontFamily: 'Rajdhani, sans-serif' }}
                        >
                          {stat.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex-1" />

                {/* Drivers preview */}
                {team.drivers.length > 0 && (
                  <div className="px-5 py-3" style={{ borderTop: '1px solid #3a4a5e' }}>
                    <div className="flex items-center gap-3">
                      {team.drivers.slice(0, 2).map((driver, idx) => (
                        <div key={idx} className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                            style={{
                              background: 'rgba(30, 42, 56, 0.6)',
                              border: '1px solid #3a4a5e',
                            }}
                          >
                            <span className="text-[9px] font-bold" style={{ color: '#6a7a8a' }}>
                              {driver.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p
                              className="text-[11px] truncate"
                              style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, color: '#d4dae3' }}
                            >
                              {driver.name}
                            </p>
                            <p className="text-[9px]" style={{ color: '#5a6a7a' }}>{driver.country}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="px-4 py-3 flex gap-2" style={{ borderTop: '1px solid #3a4a5e' }}>
                  <span
                    className="flex-1 text-center text-[10px] uppercase tracking-wider self-center"
                    style={{ color: '#5a6a7a', fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    {filteredTeams.length} Teams
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded text-xs transition-colors"
                    style={{
                      background: 'rgba(30, 42, 56, 0.6)',
                      border: '1px solid #3a4a5e',
                      color: '#8a9ab0',
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: 600,
                    }}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    VIEW
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom strip — team scroller */}
      <div className="relative z-20 shrink-0">
        <div
          className="absolute -top-8 left-0 right-0 h-8 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #0d1520, transparent)' }}
        />

        <div className="px-4 py-3" style={{ background: '#0d1520', borderTop: '1px solid #3a4a5e' }}>
          <div className="relative">
            <button
              onClick={() => scrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{
                background: 'rgba(30, 42, 56, 0.8)',
                border: '1px solid #3a4a5e',
                color: '#6a7a8a',
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' })}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{
                background: 'rgba(30, 42, 56, 0.8)',
                border: '1px solid #3a4a5e',
                color: '#6a7a8a',
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div
              ref={scrollRef}
              className="flex gap-2 overflow-x-auto mx-10 py-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {filteredTeams.map((t) => {
                const isActive = selectedRealTeam?.id === t.id
                const teamStars = getStarRating(t.prestige)
                const liveryUrl = getLiveryImage(t.carClassId, t.liveryNames[0] || '')

                return (
                  <motion.button
                    key={t.id}
                    onClick={() => handleSelectTeam(t)}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="shrink-0 w-[140px] rounded overflow-hidden transition-all duration-200 text-left"
                    style={{
                      background: isActive
                        ? 'linear-gradient(to bottom, #374354, #2a3442)'
                        : 'rgba(30, 42, 56, 0.4)',
                      border: isActive ? '1px solid rgba(225, 6, 0, 0.5)' : '1px solid rgba(58, 74, 94, 0.5)',
                      boxShadow: isActive ? '0 4px 16px rgba(225, 6, 0, 0.1)' : 'none',
                    }}
                  >
                    <div className="h-14 relative overflow-hidden" style={{ background: 'rgba(30, 42, 56, 0.6)' }}>
                      {liveryUrl && (
                        <img
                          src={liveryUrl}
                          alt={t.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      )}
                      <div
                        className="absolute inset-0"
                        style={{ background: 'linear-gradient(to top, rgba(13, 21, 32, 0.8), transparent)' }}
                      />
                      <div
                        className="absolute top-0 left-0 w-full h-0.5"
                        style={{ backgroundColor: t.color }}
                      />
                    </div>

                    <div className="px-2.5 py-2">
                      <p
                        className="text-[11px] leading-tight truncate"
                        style={{
                          fontFamily: 'Rajdhani, sans-serif',
                          fontWeight: 700,
                          color: isActive ? '#e8edf3' : '#8a9ab0',
                        }}
                      >
                        {t.name}
                      </p>
                      <div className="flex items-center gap-0.5 mt-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className="w-2.5 h-2.5"
                            style={{
                              color: i < teamStars ? '#daa520' : '#3a4a5e',
                              fill: i < teamStars ? '#daa520' : 'none',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
