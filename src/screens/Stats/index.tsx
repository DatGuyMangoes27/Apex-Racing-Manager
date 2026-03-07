import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Trophy,
  Flag,
  Target,
  Award,
  Zap,
  MapPin,
  Calendar,
  Star,
  Users,
  Swords,
  User,
  ChevronDown,
  Flame,
  Crown,
  Activity,
} from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import type { RivalDriver, RivalStats } from '@/store/rivalStore'
import type { RaceResult, TrackHistory } from '@/store/careerStore'
import type { SeasonStanding } from '@/store/rivalStore'
import { normalizeTrackName } from '@/data/track-aliases'

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }
const CARD = 'bg-white border-[0.8px] border-black/20 rounded-[24px] overflow-hidden'
const INNER = 'bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[16px] p-[16px]'

interface TimelineItemProps {
  year: number
  title: string
  description: string
  type: 'race' | 'milestone' | 'achievement' | 'contract' | 'championship'
}

function TimelineItem({ year, title, description, type }: TimelineItemProps) {
  const typeConfig: Record<typeof type, { bg: string; icon: typeof Trophy }> = {
    race: { bg: 'bg-[#3b82f6]', icon: Flag },
    milestone: { bg: 'bg-[#ef4444]', icon: Target },
    achievement: { bg: 'bg-[#f59e0b]', icon: Star },
    contract: { bg: 'bg-[#f97316]', icon: Calendar },
    championship: { bg: 'bg-gradient-to-br from-[#f59e0b] to-[#f97316]', icon: Crown }
  }

  const config = typeConfig[type]
  const IconComponent = config.icon

  return (
    <div className="flex gap-[16px]">
      <div className="relative">
        <div className={`w-[48px] h-[48px] rounded-full ${config.bg} flex items-center justify-center z-10 shadow-lg`}>
          <IconComponent className="w-[20px] h-[20px] text-white" />
        </div>
      </div>
      <div className="flex-1 pt-[4px]">
        <div className="flex items-center gap-[8px]">
          <span className="font-mono text-[12px] text-[#4a5565]">{year}</span>
          {type === 'championship' && (
            <span className="px-[8px] py-[2px] bg-[#fef3c7] text-[#b45309] rounded-[8px] text-[11px]" style={FBold}>Champion</span>
          )}
        </div>
        <h4 className="text-[15px] text-[#0a0a0a]" style={FBold}>{title}</h4>
        <p className="text-[13px] text-[#4a5565]" style={FR}>{description}</p>
      </div>
    </div>
  )
}

interface RecordItemProps {
  label: string
  value: string
  track: string
}

function RecordItem({ label, value, track }: RecordItemProps) {
  return (
    <div className="flex items-center justify-between p-[12px] bg-[#f9fafb] rounded-[12px]">
      <div>
        <p className="text-[14px] text-[#0a0a0a]" style={FR}>{label}</p>
        {track && <p className="text-[12px] text-[#4a5565]" style={FR}>{track}</p>}
      </div>
      <span className="font-mono text-[20px] text-[#0a0a0a]" style={FBold}>{value}</span>
    </div>
  )
}

function EnhancedTimeline({ 
  player, 
  careerState, 
  _getSeriesById 
}: { 
  player: any; 
  careerState: any; 
  getSeriesById: (id: string) => any;
}) {
  const events: Array<{
    year: number;
    type: 'milestone' | 'achievement' | 'race' | 'contract' | 'championship';
    title: string;
    description: string;
    icon?: any;
  }> = []

  events.push({
    year: player.careerStartYear || careerState.currentYear,
    type: 'milestone',
    title: 'Career Started',
    description: `Began racing career at age ${player.careerStartAge}`,
  })

  const raceHistory = player.raceHistory || []
  if (raceHistory.length > 0) {
    const firstRace = raceHistory[0]
    events.push({
      year: new Date(firstRace.date).getFullYear(),
      type: 'race',
      title: 'First Race',
      description: `Finished P${firstRace.racePosition} at ${firstRace.trackName}`,
    })
  }

  const firstWin = raceHistory.find((r: RaceResult) => r.racePosition === 1)
  if (firstWin) {
    events.push({
      year: new Date(firstWin.date).getFullYear(),
      type: 'achievement',
      title: 'First Victory',
      description: `Won at ${firstWin.trackName}`,
    })
  }

  const firstPole = raceHistory.find((r: RaceResult) => r.qualifyingPosition === 1)
  if (firstPole) {
    events.push({
      year: new Date(firstPole.date).getFullYear(),
      type: 'achievement',
      title: 'First Pole Position',
      description: `Took pole at ${firstPole.trackName}`,
    })
  }

  const careerEvents = player.careerEvents || []
  careerEvents
    .filter((e: any) => e.type === 'championship_won' || e.type === 'achievement')
    .forEach((e: any) => {
      events.push({
        year: new Date(e.date).getFullYear(),
        type: e.type === 'championship_won' ? 'championship' : 'achievement',
        title: e.title,
        description: e.description,
      })
    })

  if (player.contractHistory) {
    player.contractHistory.forEach((contract: any) => {
      events.push({
        year: contract.startYear,
        type: 'contract',
        title: `Signed with ${contract.teamName}`,
        description: `${contract.duration} year contract in ${contract.seriesName}`,
      })
    })
  }

  if (player.goatProgress?.milestones) {
    Object.values(player.goatProgress.milestones as Record<string, any>)
      .filter((m: any) => m.unlocked && m.unlockedDate)
      .forEach((m: any) => {
        events.push({
          year: new Date(m.unlockedDate).getFullYear(),
          type: 'achievement',
          title: m.name,
          description: m.description,
        })
      })
  }

  events.sort((a, b) => b.year - a.year)
  const displayEvents = events.slice(0, 10)

  return (
    <div className="relative">
      <div className="absolute left-[24px] top-0 bottom-0 w-[2px] bg-black/10" />
      <div className="flex flex-col gap-[16px]">
        {displayEvents.length === 0 ? (
          <div className="text-center py-[32px] text-[#4a5565]">
            <Calendar className="w-[48px] h-[48px] mx-auto mb-[12px] opacity-50" />
            <p className="text-[14px]" style={FR}>Your journey begins...</p>
          </div>
        ) : (
          displayEvents.map((event, index) => (
            <motion.div
              key={`${event.year}-${event.title}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <TimelineItem
                year={event.year}
                title={event.title}
                description={event.description}
                type={event.type as any}
              />
            </motion.div>
          ))
        )}
      </div>

      {events.length > 10 && (
        <div className="mt-[16px] text-center">
          <p className="text-[12px] text-[#4a5565]" style={FR}>
            +{events.length - 10} more events in your career
          </p>
        </div>
      )}
    </div>
  )
}

function TrackMasteryTab({ trackHistory, raceHistory }: { trackHistory: Record<string, TrackHistory>; raceHistory?: RaceResult[] }) {
  const computedTrackHistory = React.useMemo(() => {
    if (trackHistory && Object.keys(trackHistory).length > 0) {
      return trackHistory
    }
    
    if (!raceHistory || raceHistory.length === 0) return {}
    
    const rebuilt: Record<string, TrackHistory> = {}
    
    const sortedRaces = [...raceHistory].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    
    const lastWinPerTrack: Record<string, boolean> = {}
    const lastDnfPerTrack: Record<string, boolean> = {}
    
    for (const race of sortedRaces) {
      const trackId = normalizeTrackName(race.trackName)
      const raceYear = new Date(race.date).getFullYear()
      
      if (!rebuilt[trackId]) {
        rebuilt[trackId] = {
          trackId,
          trackName: race.trackName,
          visits: 0,
          wins: 0,
          podiums: 0,
          poles: 0,
          fastestLaps: 0,
          dnfs: 0,
          bestFinish: 99,
          worstFinish: 0,
          avgFinish: 0,
          consecutiveWins: 0,
          maxConsecutiveWins: 0,
          consecutiveVisits: 0,
          lastVisitYear: raceYear,
          firstVisitYear: raceYear,
          lastResult: 0,
          seriesRacedHere: []
        }
      }
      
      const th = rebuilt[trackId]
      th.visits++
      th.lastResult = race.racePosition
      
      if (race.seriesId && !th.seriesRacedHere.includes(race.seriesId)) {
        th.seriesRacedHere.push(race.seriesId)
      }
      
      if (race.racePosition === 1) {
        th.wins++
        if (lastWinPerTrack[trackId]) {
          th.consecutiveWins++
        } else {
          th.consecutiveWins = 1
        }
        th.maxConsecutiveWins = Math.max(th.maxConsecutiveWins, th.consecutiveWins)
        lastWinPerTrack[trackId] = true
      } else {
        th.consecutiveWins = 0
        lastWinPerTrack[trackId] = false
      }
      
      if (!race.dnf) {
        if (!lastDnfPerTrack[trackId]) {
          th.consecutiveVisits++
        } else {
          th.consecutiveVisits = 1
        }
        lastDnfPerTrack[trackId] = false
      } else {
        th.consecutiveVisits = 0
        lastDnfPerTrack[trackId] = true
      }
      
      if (race.racePosition <= 3 && !race.dnf) th.podiums++
      if (race.qualifyingPosition === 1) th.poles++
      if (race.fastestLap) th.fastestLaps++
      if (race.dnf) th.dnfs++
      
      if (!race.dnf) {
        if (race.racePosition < th.bestFinish) th.bestFinish = race.racePosition
        if (race.racePosition > th.worstFinish) th.worstFinish = race.racePosition
        const prevTotal = th.avgFinish * (th.visits - 1)
        th.avgFinish = (prevTotal + race.racePosition) / th.visits
      }
      
      th.lastVisitYear = Math.max(th.lastVisitYear, raceYear)
      th.firstVisitYear = Math.min(th.firstVisitYear, raceYear)
    }
    
    return rebuilt
  }, [trackHistory, raceHistory])
  
  const tracks = Object.values(computedTrackHistory || {})
  
  if (tracks.length === 0) {
    return (
      <div className={`${CARD} p-[24px]`}>
        <div className="mb-[16px]">
          <h3 className="text-[20px] text-[#0a0a0a] tracking-[-0.5px]" style={FB}>Track Mastery</h3>
          <p className="text-[13px] text-[#4a5565]" style={FR}>Your performance at each circuit</p>
        </div>
        <div className="text-center py-[48px]">
          <MapPin className="w-[64px] h-[64px] mx-auto text-[#4a5565] mb-[16px]" />
          <h3 className="text-[20px] text-[#0a0a0a] mb-[8px]" style={FBold}>No Track Data Yet</h3>
          <p className="text-[14px] text-[#4a5565]" style={FR}>
            Complete races to build your track history
          </p>
        </div>
      </div>
    )
  }

  const sortedTracks = [...tracks].sort((a, b) => b.visits - a.visits)

  return (
    <div className="flex flex-col gap-[24px]">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-[16px]">
        {[
          { value: tracks.length, label: 'Tracks Visited', color: '#ef4444' },
          { value: tracks.filter(t => t.wins > 0).length, label: 'Tracks Won At', color: '#f59e0b' },
          { value: Math.max(...tracks.map(t => t.maxConsecutiveWins || 0)), label: 'Best Win Streak', color: '#3b82f6' },
          { value: (tracks.reduce((sum, t) => sum + t.avgFinish, 0) / tracks.length || 0).toFixed(1), label: 'Avg Finish', color: '#00a63e' },
        ].map((stat) => (
          <div key={stat.label} className={`${CARD} p-[16px] text-center`}>
            <p className="text-[28px] tracking-[-1px]" style={{ ...FB, color: stat.color }}>{stat.value}</p>
            <p className="text-[13px] text-[#4a5565]" style={FR}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Track List */}
      <div className={`${CARD} p-[24px]`}>
        <div className="mb-[16px]">
          <h3 className="text-[20px] text-[#0a0a0a] tracking-[-0.5px]" style={FB}>Track Performance</h3>
          <p className="text-[13px] text-[#4a5565]" style={FR}>Your results at each circuit</p>
        </div>
        <div className="flex flex-col gap-[12px] mt-[16px]">
          {sortedTracks.map((track, index) => (
            <motion.div
              key={track.trackId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="p-[16px] bg-[#f9fafb] rounded-[16px] hover:bg-[#f3f4f6] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-[12px]">
                    <div className="w-[40px] h-[40px] rounded-[12px] bg-[#fef2f2] flex items-center justify-center">
                      <MapPin className="w-[20px] h-[20px] text-[#ef4444]" />
                    </div>
                    <div>
                      <h4 className="text-[15px] text-[#0a0a0a]" style={FBold}>{track.trackName}</h4>
                      <p className="text-[12px] text-[#4a5565]" style={FR}>
                        {track.visits} visit{track.visits !== 1 ? 's' : ''} • 
                        First: {track.firstVisitYear} • 
                        Last: {track.lastVisitYear}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-[24px] text-center">
                  <div>
                    <p className="text-[16px] text-[#f59e0b]" style={FB}>{track.wins}</p>
                    <p className="text-[11px] text-[#4a5565]" style={FR}>Wins</p>
                  </div>
                  <div>
                    <p className="text-[16px] text-[#f97316]" style={FB}>{track.podiums}</p>
                    <p className="text-[11px] text-[#4a5565]" style={FR}>Podiums</p>
                  </div>
                  <div>
                    <p className="text-[16px] text-[#3b82f6]" style={FB}>{track.poles}</p>
                    <p className="text-[11px] text-[#4a5565]" style={FR}>Poles</p>
                  </div>
                  <div>
                    <p className="text-[16px] text-[#0a0a0a]" style={FB}>P{track.bestFinish}</p>
                    <p className="text-[11px] text-[#4a5565]" style={FR}>Best</p>
                  </div>
                  <div>
                    <p className="text-[16px] text-[#4a5565]" style={FB}>{track.avgFinish.toFixed(1)}</p>
                    <p className="text-[11px] text-[#4a5565]" style={FR}>Avg</p>
                  </div>
                  {track.maxConsecutiveWins > 1 && (
                    <div>
                      <span className="px-[8px] py-[3px] bg-[#fef3c7] text-[#b45309] rounded-[8px] text-[11px]" style={FBold}>
                        {track.maxConsecutiveWins}x streak
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RecordsTab({ raceHistory }: { raceHistory: RaceResult[] }) {
  const racesBySeries: Record<string, RaceResult[]> = {}
  raceHistory.forEach(race => {
    const key = race.seriesId
    if (!racesBySeries[key]) racesBySeries[key] = []
    racesBySeries[key].push(race)
  })

  let _bestChampionshipPosition = '-'
  
  let mostWinsInSeason = 0
  let mostWinsSeriesId = ''
  Object.entries(racesBySeries).forEach(([seriesId, races]) => {
    const wins = races.filter(r => r.racePosition === 1).length
    if (wins > mostWinsInSeason) {
      mostWinsInSeason = wins
      mostWinsSeriesId = seriesId
    }
  })

  let currentStreak = 0
  let bestWinStreak = 0
  let streakTrack = ''
  const sortedRaces = [...raceHistory].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  sortedRaces.forEach(race => {
    if (race.racePosition === 1) {
      currentStreak++
      if (currentStreak > bestWinStreak) {
        bestWinStreak = currentStreak
        streakTrack = race.trackName
      }
    } else {
      currentStreak = 0
    }
  })

  let mostPodiumsInSeason = 0
  let mostPodiumsSeriesId = ''
  Object.entries(racesBySeries).forEach(([seriesId, races]) => {
    const podiums = races.filter(r => r.racePosition <= 3).length
    if (podiums > mostPodiumsInSeason) {
      mostPodiumsInSeason = podiums
      mostPodiumsSeriesId = seriesId
    }
  })

  const _trackBestLaps: Record<string, { time: number; date: string; position: number }> = {}
  raceHistory.forEach(_race => {
  })

  const pointsFinishes = raceHistory.filter(r => r.racePosition <= 10 && !r.dnf).length
  const fastestLaps = raceHistory.filter(r => r.fastestLap).length

  return (
    <div className="grid grid-cols-2 gap-[24px]">
      <div className={`${CARD} p-[24px]`}>
        <h3 className="text-[18px] text-[#0a0a0a] tracking-[-0.5px] mb-[16px]" style={FB}>Personal Records</h3>
        <div className="flex flex-col gap-[16px]">
          <RecordItem
            label="Most Wins in a Season"
            value={mostWinsInSeason > 0 ? String(mostWinsInSeason) : '-'}
            track={mostWinsInSeason > 0 ? mostWinsSeriesId.replace(/-/g, ' ') : ''}
          />
          <RecordItem
            label="Best Win Streak"
            value={bestWinStreak > 0 ? String(bestWinStreak) : '-'}
            track={bestWinStreak > 0 ? `ended at ${streakTrack}` : ''}
          />
          <RecordItem
            label="Most Podiums in a Season"
            value={mostPodiumsInSeason > 0 ? String(mostPodiumsInSeason) : '-'}
            track={mostPodiumsInSeason > 0 ? mostPodiumsSeriesId.replace(/-/g, ' ') : ''}
          />
          <RecordItem
            label="Fastest Laps"
            value={String(fastestLaps)}
            track=""
          />
        </div>
      </div>

      <div className={`${CARD} p-[24px]`}>
        <h3 className="text-[18px] text-[#0a0a0a] tracking-[-0.5px] mb-[16px]" style={FB}>Career Milestones</h3>
        <div className="flex flex-col gap-[16px]">
          <RecordItem
            label="Total Points Finishes"
            value={String(pointsFinishes)}
            track={`${raceHistory.length > 0 ? Math.round((pointsFinishes / raceHistory.length) * 100) : 0}% of races`}
          />
          <RecordItem
            label="Total Wins"
            value={String(raceHistory.filter(r => r.racePosition === 1).length)}
            track=""
          />
          <RecordItem
            label="Total Podiums"
            value={String(raceHistory.filter(r => r.racePosition <= 3).length)}
            track=""
          />
          <RecordItem
            label="DNFs"
            value={String(raceHistory.filter(r => r.dnf).length)}
            track={`${raceHistory.length > 0 ? Math.round((raceHistory.filter(r => r.dnf).length / raceHistory.length) * 100) : 0}% of races`}
          />
        </div>
      </div>
    </div>
  )
}

interface RivalComparisonTabProps {
  player: any
  careerState: any
  rivals: RivalDriver[]
  getStandings: (seriesId: string) => SeasonStanding[]
  selectedRivalId: string | null
  setSelectedRivalId: (id: string | null) => void
}

function RivalComparisonTab({
  player,
  careerState,
  rivals,
  getStandings,
  selectedRivalId,
  setSelectedRivalId
}: RivalComparisonTabProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const currentSeriesId = player?.currentSeriesId || player?.contract?.seriesId || careerState?.seriesEntries?.[0]?.seriesId
  const standings = currentSeriesId ? getStandings(currentSeriesId) : []
  
  const rivalsInChampionship = useMemo(() => {
    if (!standings.length) return []
    
    return standings
      .filter(s => !s.isPlayer)
      .map(standing => {
        const rivalData = rivals.find(r => 
          `${r.firstName} ${r.lastName}`.toLowerCase() === standing.driverName.toLowerCase() ||
          r.id === standing.driverId
        )
        return {
          ...standing,
          rivalData
        }
      })
      .sort((a, b) => a.position - b.position)
  }, [standings, rivals])

  const selectedRival = useMemo(() => {
    if (!selectedRivalId) return null
    
    const standing = rivalsInChampionship.find(r => r.driverId === selectedRivalId)
    if (!standing) return null
    
    return {
      standing,
      driver: standing.rivalData || null
    }
  }, [selectedRivalId, rivalsInChampionship])

  const playerStanding = standings.find(s => s.isPlayer)

  const headToHead = useMemo(() => {
    if (!selectedRival || !player?.raceHistory) {
      return { playerWins: 0, rivalWins: 0, ties: 0, total: 0 }
    }

    const _rivalName = selectedRival.standing.driverName.toLowerCase()
    let playerWins = 0
    let rivalWins = 0
    let ties = 0

    const racesCompleted = Math.min(
      playerStanding?.races || 0,
      selectedRival.standing.races
    )

    if (racesCompleted > 0 && playerStanding) {
      const playerWinRate = playerStanding.avgFinish
      const rivalWinRate = selectedRival.standing.avgFinish
      
      if (playerWinRate < rivalWinRate) {
        playerWins = Math.round(racesCompleted * 0.6)
        rivalWins = racesCompleted - playerWins
      } else if (rivalWinRate < playerWinRate) {
        rivalWins = Math.round(racesCompleted * 0.6)
        playerWins = racesCompleted - rivalWins
      } else {
        playerWins = Math.floor(racesCompleted / 2)
        rivalWins = racesCompleted - playerWins
      }
    }

    return { playerWins, rivalWins, ties, total: racesCompleted }
  }, [selectedRival, player, playerStanding])

  const playerStats = player?.stats || {}
  const playerRadarStats = [
    { label: 'Race', value: playerStats.racecraft ?? 50 },
    { label: 'Cons', value: playerStats.consistency ?? 50 },
    { label: 'Wet', value: playerStats.wetSkill ?? 50 },
    { label: 'Tire', value: playerStats.tireManagement ?? 50 },
    { label: 'Tech', value: playerStats.technicalFeedback ?? 50 },
    { label: 'Mental', value: playerStats.mentalStrength ?? 50 },
  ]

  const rivalRadarStats = useMemo(() => {
    if (!selectedRival?.driver?.stats) {
      const standing = selectedRival?.standing
      if (!standing) return playerRadarStats.map(s => ({ ...s, value: 50 }))
      
      const avgFinish = standing.avgFinish || 10
      const winRate = standing.races > 0 ? (standing.wins / standing.races) * 100 : 0
      const podiumRate = standing.races > 0 ? (standing.podiums / standing.races) * 100 : 0
      
      return [
        { label: 'Race', value: Math.min(95, 50 + (winRate * 0.5) + (25 - avgFinish)) },
        { label: 'Cons', value: Math.min(95, 40 + podiumRate + (20 - standing.dnfs * 5)) },
        { label: 'Wet', value: 50 + Math.random() * 30 - 15 },
        { label: 'Tire', value: 50 + Math.random() * 30 - 15 },
        { label: 'Tech', value: 50 + Math.random() * 30 - 15 },
        { label: 'Mental', value: Math.min(95, 50 + winRate * 0.3) },
      ]
    }
    
    const stats = selectedRival.driver.stats
    return [
      { label: 'Race', value: Math.round((stats.raceSkill ?? 0.5) * 100) },
      { label: 'Cons', value: Math.round((stats.consistency ?? 0.5) * 100) },
      { label: 'Wet', value: Math.round((stats.wetSkill ?? 0.5) * 100) },
      { label: 'Tire', value: Math.round((stats.tireManagement ?? 0.5) * 100) },
      { label: 'Tech', value: Math.round((stats.raceSkill ?? 0.5) * 100) },
      { label: 'Mental', value: Math.round((stats.consistency ?? 0.5) * 100) },
    ]
  }, [selectedRival, playerRadarStats])

  if (!currentSeriesId || rivalsInChampionship.length === 0) {
    return (
      <div className={`${CARD} p-[24px]`}>
        <div className="mb-[16px]">
          <h3 className="text-[20px] text-[#0a0a0a] tracking-[-0.5px]" style={FB}>Rival Comparison</h3>
          <p className="text-[13px] text-[#4a5565]" style={FR}>Compare your stats with other drivers</p>
        </div>
        <div className="text-center py-[48px]">
          <Users className="w-[64px] h-[64px] mx-auto text-[#4a5565] mb-[16px]" />
          <h3 className="text-[20px] text-[#0a0a0a] mb-[8px]" style={FBold}>No Rivals Found</h3>
          <p className="text-[14px] text-[#4a5565] max-w-[400px] mx-auto" style={FR}>
            Complete races in a championship to compare yourself against other drivers
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[24px]">
      {/* Rival Selector */}
      <div className={`${CARD} p-[24px]`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[18px] text-[#0a0a0a]" style={FBold}>Select a Rival</h3>
            <p className="text-[13px] text-[#4a5565]" style={FR}>Choose a driver to compare your performance</p>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-[12px] px-[16px] py-[12px] bg-[#f9fafb] hover:bg-[#f3f4f6] rounded-[16px] border-[0.8px] border-black/10 transition-colors min-w-[280px]"
              style={FR}
            >
              {selectedRival ? (
                <>
                  <div className="w-[40px] h-[40px] rounded-full bg-[#fef2f2] flex items-center justify-center">
                    <User className="w-[20px] h-[20px] text-[#ef4444]" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[14px] text-[#0a0a0a]" style={FBold}>{selectedRival.standing.driverName}</p>
                    <p className="text-[12px] text-[#4a5565]">
                      P{selectedRival.standing.position} • {selectedRival.standing.points} pts
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-[40px] h-[40px] rounded-full bg-[#f3f4f6] flex items-center justify-center">
                    <Users className="w-[20px] h-[20px] text-[#4a5565]" />
                  </div>
                  <span className="flex-1 text-left text-[#4a5565] text-[14px]">Select a rival...</span>
                </>
              )}
              <ChevronDown className={`w-[20px] h-[20px] text-[#4a5565] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 right-0 mt-[8px] bg-white rounded-[16px] border-[0.8px] border-black/20 shadow-xl z-50 max-h-[400px] overflow-y-auto"
              >
                {rivalsInChampionship.map((rival) => (
                  <button
                    key={rival.driverId}
                    onClick={() => {
                      setSelectedRivalId(rival.driverId)
                      setIsDropdownOpen(false)
                    }}
                    className={`w-full flex items-center gap-[12px] px-[16px] py-[12px] hover:bg-[#f9fafb] transition-colors ${
                      selectedRivalId === rival.driverId ? 'bg-[#fef2f2]' : ''
                    }`}
                    style={FR}
                  >
                    <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center text-[13px] ${
                      rival.position <= 3 ? 'bg-[#fef3c7] text-[#b45309]' : 'bg-[#f3f4f6] text-[#4a5565]'
                    }`} style={FBold}>
                      {rival.position}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-[14px] text-[#0a0a0a]" style={FBold}>{rival.driverName}</p>
                      <p className="text-[12px] text-[#4a5565]">{rival.teamName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[14px] text-[#0a0a0a]" style={FBold}>{rival.points} pts</p>
                      <p className="text-[12px] text-[#4a5565]">{rival.wins}W {rival.podiums}P</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {selectedRival && playerStanding && (
        <>
          {/* Main Comparison Grid */}
          <div className="grid grid-cols-3 gap-[24px]">
            {/* Season Stats Side-by-Side */}
            <div className={`${CARD} p-[24px] col-span-2`}>
              <div className="mb-[16px]">
                <h3 className="text-[18px] text-[#0a0a0a] tracking-[-0.5px]" style={FB}>Season Statistics</h3>
                <p className="text-[13px] text-[#4a5565]" style={FR}>Current championship performance</p>
              </div>
              
              <div className="mt-[24px]">
                {/* Driver Headers */}
                <div className="grid grid-cols-3 gap-[16px] mb-[24px]">
                  <div className="flex items-center gap-[12px]">
                    <div className="w-[48px] h-[48px] rounded-full bg-[#dbeafe] flex items-center justify-center">
                      <User className="w-[24px] h-[24px] text-[#3b82f6]" />
                    </div>
                    <div>
                      <p className="text-[15px] text-[#0a0a0a]" style={FBold}>{player.name}</p>
                      <p className="text-[12px] text-[#4a5565]" style={FR}>You</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <Swords className="w-[24px] h-[24px] text-[#ef4444]" />
                  </div>
                  <div className="flex items-center gap-[12px] justify-end">
                    <div className="text-right">
                      <p className="text-[15px] text-[#0a0a0a]" style={FBold}>{selectedRival.standing.driverName}</p>
                      <p className="text-[12px] text-[#4a5565]" style={FR}>{selectedRival.standing.teamName}</p>
                    </div>
                    <div className="w-[48px] h-[48px] rounded-full bg-[#fef2f2] flex items-center justify-center">
                      <User className="w-[24px] h-[24px] text-[#ef4444]" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-[12px]">
                  <ComparisonRow label="Position" playerValue={playerStanding.position} rivalValue={selectedRival.standing.position} format="position" lowerIsBetter />
                  <ComparisonRow label="Points" playerValue={playerStanding.points} rivalValue={selectedRival.standing.points} />
                  <ComparisonRow label="Wins" playerValue={playerStanding.wins} rivalValue={selectedRival.standing.wins} />
                  <ComparisonRow label="Podiums" playerValue={playerStanding.podiums} rivalValue={selectedRival.standing.podiums} />
                  <ComparisonRow label="Poles" playerValue={playerStanding.poles} rivalValue={selectedRival.standing.poles} />
                  <ComparisonRow label="Avg Finish" playerValue={playerStanding.avgFinish} rivalValue={selectedRival.standing.avgFinish} format="decimal" lowerIsBetter />
                  <ComparisonRow label="Best Finish" playerValue={playerStanding.bestFinish} rivalValue={selectedRival.standing.bestFinish} format="position" lowerIsBetter />
                  <ComparisonRow label="DNFs" playerValue={playerStanding.dnfs} rivalValue={selectedRival.standing.dnfs} lowerIsBetter />
                </div>
              </div>
            </div>

            {/* Head-to-Head & Rivalry */}
            <div className="flex flex-col gap-[24px]">
              <div className={`${CARD} p-[24px]`}>
                <h3 className="text-[16px] text-[#0a0a0a] mb-[16px]" style={FB}>Head-to-Head</h3>
                <div className="flex items-center justify-between mb-[16px]">
                  <div className="text-center">
                    <p className="text-[28px] text-[#3b82f6]" style={FB}>{headToHead.playerWins}</p>
                    <p className="text-[12px] text-[#4a5565]" style={FR}>Your Wins</p>
                  </div>
                  <div className="text-center px-[16px]">
                    <p className="text-[16px] text-[#4a5565]" style={FB}>vs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[28px] text-[#ef4444]" style={FB}>{headToHead.rivalWins}</p>
                    <p className="text-[12px] text-[#4a5565]" style={FR}>Their Wins</p>
                  </div>
                </div>
                
                <div className="h-[12px] rounded-full bg-[#f3f4f6] overflow-hidden flex">
                  {headToHead.total > 0 && (
                    <>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(headToHead.playerWins / headToHead.total) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="bg-[#3b82f6]"
                      />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(headToHead.rivalWins / headToHead.total) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                        className="bg-[#ef4444]"
                      />
                    </>
                  )}
                </div>
                <p className="text-[12px] text-[#4a5565] text-center mt-[8px]" style={FR}>
                  {headToHead.total} race{headToHead.total !== 1 ? 's' : ''} together
                </p>
              </div>

              <div className={`${CARD} p-[24px]`}>
                <h3 className="text-[16px] text-[#0a0a0a] mb-[16px]" style={FB}>Rivalry</h3>
                <RivalryMeter 
                  intensity={selectedRival.driver?.rivalryIntensity ?? calculateRivalryIntensity(playerStanding, selectedRival.standing)}
                />
                <div className="mt-[16px] flex flex-col gap-[8px]">
                  {selectedRival.driver?.relationshipWithPlayer !== undefined && (
                    <div className="flex items-center justify-between text-[14px]" style={FR}>
                      <span className="text-[#4a5565]">Relationship</span>
                      <span style={{ color: selectedRival.driver.relationshipWithPlayer > 0 ? '#00a63e' : selectedRival.driver.relationshipWithPlayer < 0 ? '#ef4444' : '#4a5565' }}>
                        {selectedRival.driver.relationshipWithPlayer > 20 ? 'Friendly' :
                         selectedRival.driver.relationshipWithPlayer > 0 ? 'Respectful' :
                         selectedRival.driver.relationshipWithPlayer > -20 ? 'Neutral' :
                         selectedRival.driver.relationshipWithPlayer > -50 ? 'Tense' : 'Hostile'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Skill Radar Comparison */}
          <div className={`${CARD} p-[24px]`}>
            <div className="mb-[16px]">
              <h3 className="text-[18px] text-[#0a0a0a] tracking-[-0.5px]" style={FB}>Skill Comparison</h3>
              <p className="text-[13px] text-[#4a5565]" style={FR}>Overlaid driver ability profiles</p>
            </div>
            <div className="flex items-center justify-center py-[24px]">
              <ComparisonRadar 
                playerStats={playerRadarStats}
                rivalStats={rivalRadarStats}
                playerName={player.name}
                rivalName={selectedRival.standing.driverName}
                size={320}
              />
            </div>
            <div className="flex justify-center gap-[32px] mt-[16px]">
              <div className="flex items-center gap-[8px]">
                <div className="w-[16px] h-[16px] rounded-[4px] bg-[#3b82f6]/60" />
                <span className="text-[13px] text-[#4a5565]" style={FR}>You</span>
              </div>
              <div className="flex items-center gap-[8px]">
                <div className="w-[16px] h-[16px] rounded-[4px] bg-[#ef4444]/60" />
                <span className="text-[13px] text-[#4a5565]" style={FR}>{selectedRival.standing.driverName}</span>
              </div>
            </div>
          </div>

          {/* Career Comparison */}
          {selectedRival.driver && (
            <div className={`${CARD} p-[24px]`}>
              <div className="mb-[16px]">
                <h3 className="text-[18px] text-[#0a0a0a] tracking-[-0.5px]" style={FB}>Career Comparison</h3>
                <p className="text-[13px] text-[#4a5565]" style={FR}>Lifetime achievements and experience</p>
              </div>
              <div className="grid grid-cols-5 gap-[16px] mt-[24px]">
                <CareerStatCard label="Total Races" playerValue={player.raceHistory?.length || 0} rivalValue={selectedRival.driver.totalRaces} icon={Flag} />
                <CareerStatCard label="Total Wins" playerValue={player.raceHistory?.filter((r: RaceResult) => r.racePosition === 1).length || 0} rivalValue={selectedRival.driver.totalWins} icon={Trophy} />
                <CareerStatCard label="Podiums" playerValue={player.raceHistory?.filter((r: RaceResult) => r.racePosition <= 3).length || 0} rivalValue={selectedRival.driver.totalPodiums} icon={Award} />
                <CareerStatCard label="Championships" playerValue={player.championships || 0} rivalValue={selectedRival.driver.championships} icon={Crown} />
                <CareerStatCard label="Experience" playerValue={careerState.currentYear - (player.careerStartYear || careerState.currentYear)} rivalValue={selectedRival.driver.age - 18} icon={Activity} suffix=" yrs" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function calculateRivalryIntensity(playerStanding: SeasonStanding, rivalStanding: SeasonStanding): number {
  const posDiff = Math.abs(playerStanding.position - rivalStanding.position)
  const ptsDiff = Math.abs(playerStanding.points - rivalStanding.points)
  
  let intensity = 100 - (posDiff * 15)
  
  if (ptsDiff < 50) intensity += 20
  else if (ptsDiff < 100) intensity += 10
  
  if (playerStanding.position <= 3 && rivalStanding.position <= 3) {
    intensity += 25
  }
  
  return Math.max(0, Math.min(100, intensity))
}

interface ComparisonRowProps {
  label: string
  playerValue: number
  rivalValue: number
  format?: 'number' | 'decimal' | 'position'
  lowerIsBetter?: boolean
}

function ComparisonRow({ label, playerValue, rivalValue, format = 'number', lowerIsBetter = false }: ComparisonRowProps) {
  const formatValue = (val: number) => {
    if (format === 'decimal') return val.toFixed(1)
    if (format === 'position') return `P${val}`
    return String(val)
  }

  const playerBetter = lowerIsBetter ? playerValue < rivalValue : playerValue > rivalValue
  const rivalBetter = lowerIsBetter ? rivalValue < playerValue : rivalValue > playerValue
  const tied = playerValue === rivalValue

  return (
    <div className="grid grid-cols-3 gap-[16px] items-center py-[8px] border-b border-black/5 last:border-0">
      <div className={`text-right font-mono text-[16px] ${playerBetter ? 'text-[#3b82f6]' : tied ? 'text-[#4a5565]' : 'text-[#0a0a0a]/60'}`} style={FBold}>
        {formatValue(playerValue)}
        {playerBetter && <span className="ml-[8px] text-[11px]">▲</span>}
      </div>
      <div className="text-center text-[13px] text-[#4a5565]" style={FR}>{label}</div>
      <div className={`text-left font-mono text-[16px] ${rivalBetter ? 'text-[#ef4444]' : tied ? 'text-[#4a5565]' : 'text-[#0a0a0a]/60'}`} style={FBold}>
        {rivalBetter && <span className="mr-[8px] text-[11px]">▲</span>}
        {formatValue(rivalValue)}
      </div>
    </div>
  )
}

function RivalryMeter({ intensity }: { intensity: number }) {
  const getIntensityLabel = () => {
    if (intensity >= 80) return { label: 'Fierce Rivalry', color: '#ef4444' }
    if (intensity >= 60) return { label: 'Strong Rivalry', color: '#f97316' }
    if (intensity >= 40) return { label: 'Competitive', color: '#f59e0b' }
    if (intensity >= 20) return { label: 'Respectful', color: '#3b82f6' }
    return { label: 'Minimal', color: '#4a5565' }
  }

  const { label, color } = getIntensityLabel()

  return (
    <div className="text-center">
      <div className="relative w-[96px] h-[96px] mx-auto mb-[12px]">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" />
          <motion.circle
            cx="50" cy="50" r="40" fill="none"
            stroke="url(#rivalryGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            initial={{ strokeDasharray: '0 251.2' }}
            animate={{ strokeDasharray: `${(intensity / 100) * 251.2} 251.2` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id="rivalryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Flame className={`w-[32px] h-[32px] ${intensity >= 60 ? 'text-[#ef4444]' : 'text-[#4a5565]'}`} />
        </div>
      </div>
      <p className="text-[15px]" style={{ ...FBold, color }}>{label}</p>
      <p className="text-[12px] text-[#4a5565]" style={FR}>{intensity}% intensity</p>
    </div>
  )
}

interface ComparisonRadarProps {
  playerStats: { label: string; value: number }[]
  rivalStats: { label: string; value: number }[]
  playerName: string
  rivalName: string
  size?: number
}

function ComparisonRadar({ playerStats, rivalStats, _playerName, _rivalName, size = 280 }: ComparisonRadarProps) {
  const center = size / 2
  const radius = (size / 2) - 30
  const angleStep = (2 * Math.PI) / playerStats.length

  const getPoints = (stats: { label: string; value: number }[]) => {
    return stats.map((stat, i) => {
      const angle = i * angleStep - Math.PI / 2
      const r = (stat.value / 100) * radius
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle)
      }
    })
  }

  const playerPoints = getPoints(playerStats)
  const rivalPoints = getPoints(rivalStats)

  const playerPath = playerPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
  const rivalPath = rivalPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  return (
    <svg width={size} height={size} className="overflow-visible">
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <circle key={scale} cx={center} cy={center} r={radius * scale} fill="none" stroke="#e5e7eb" strokeWidth={1} />
      ))}
      
      {playerStats.map((_, i) => (
        <line key={i} x1={center} y1={center}
          x2={center + radius * Math.cos(i * angleStep - Math.PI / 2)}
          y2={center + radius * Math.sin(i * angleStep - Math.PI / 2)}
          stroke="#e5e7eb" strokeWidth={1}
        />
      ))}
      
      <motion.path d={rivalPath} fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" strokeWidth={2}
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }} style={{ transformOrigin: 'center' }}
      />
      
      <motion.path d={playerPath} fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth={2}
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }} style={{ transformOrigin: 'center' }}
      />
      
      {playerStats.map((stat, i) => {
        const angle = i * angleStep - Math.PI / 2
        const labelX = center + (radius + 20) * Math.cos(angle)
        const labelY = center + (radius + 20) * Math.sin(angle)
        return (
          <text key={i} x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle"
            className="text-[12px]" fill="#4a5565"
          >
            {stat.label}
          </text>
        )
      })}
    </svg>
  )
}

interface CareerStatCardProps {
  label: string
  playerValue: number
  rivalValue: number
  icon: React.ElementType
  suffix?: string
}

function CareerStatCard({ label, playerValue, rivalValue, icon: Icon, suffix = '' }: CareerStatCardProps) {
  const playerBetter = playerValue > rivalValue
  const rivalBetter = rivalValue > playerValue

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={INNER + ' text-center'}
    >
      <div className="w-[40px] h-[40px] mx-auto rounded-[12px] bg-[#fef2f2] flex items-center justify-center text-[#ef4444] mb-[12px]">
        <Icon className="w-[20px] h-[20px]" />
      </div>
      <p className="text-[12px] text-[#4a5565] mb-[8px]" style={FR}>{label}</p>
      <div className="flex items-center justify-center gap-[12px]">
        <span className={`font-mono text-[15px] ${playerBetter ? 'text-[#3b82f6]' : 'text-[#0a0a0a]/60'}`} style={FBold}>
          {playerValue}{suffix}
        </span>
        <span className="text-[12px] text-[#4a5565]" style={FR}>vs</span>
        <span className={`font-mono text-[15px] ${rivalBetter ? 'text-[#ef4444]' : 'text-[#0a0a0a]/60'}`} style={FBold}>
          {rivalValue}{suffix}
        </span>
      </div>
    </motion.div>
  )
}

export default function Stats() {
  return (
    <div className="bg-white w-full h-full overflow-y-auto">
      <div className="p-[24px] flex flex-col gap-[24px]">
        <div className="flex items-center gap-[12px]">
          <BarChart3 className="w-[28px] h-[28px] text-[#0a0a0a]" />
          <h1 className="text-[30px] text-[#0a0a0a] tracking-[-1.5px] leading-tight" style={FB}>Stats</h1>
        </div>
        <p className="text-[14px] text-[#4a5565]" style={FR}>Stats screen</p>
      </div>
    </div>
  )
}
