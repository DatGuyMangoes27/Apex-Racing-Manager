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
} from 'lucide-react'
import { Card, CardHeader, Badge, Button, Progress } from '@/components/ui'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import type { RivalDriver, RivalStats } from '@/store/rivalStore'

interface TimelineItemProps {
  year: number
  title: string
  description: string
  type: 'race' | 'milestone' | 'achievement' | 'contract' | 'championship'
}

function TimelineItem({ year, title, description, type }: TimelineItemProps) {
  const typeConfig: Record<typeof type, { color: string; icon: typeof Trophy }> = {
    race: { color: 'bg-status-info', icon: Flag },
    milestone: { color: 'bg-accent-red', icon: Target },
    achievement: { color: 'bg-accent-gold', icon: Star },
    contract: { color: 'bg-accent-orange', icon: Calendar },
    championship: { color: 'bg-gradient-to-br from-accent-gold to-accent-orange', icon: Crown }
  }

  const config = typeConfig[type]
  const IconComponent = config.icon

  return (
    <div className="flex gap-4">
      <div className="relative">
        <div className={`w-12 h-12 rounded-full ${config.color} flex items-center justify-center z-10 shadow-lg`}>
          <IconComponent className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="flex-1 pt-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-text-muted">{year}</span>
          {type === 'championship' && (
            <Badge variant="gold" size="sm">Champion</Badge>
          )}
        </div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-text-muted">{description}</p>
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
    <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
      <div>
        <p className="text-text-secondary">{label}</p>
        {track && <p className="text-xs text-text-muted">{track}</p>}
      </div>
      <span className="font-mono font-bold text-xl">{value}</span>
    </div>
  )
}

// Enhanced Timeline with full career events
function EnhancedTimeline({ 
  player, 
  careerState, 
  _getSeriesById 
}: { 
  player: any; 
  careerState: any; 
  getSeriesById: (id: string) => any;
}) {
  // Build timeline events from career data
  const events: Array<{
    year: number;
    type: 'milestone' | 'achievement' | 'race' | 'contract' | 'championship';
    title: string;
    description: string;
    icon?: any;
  }> = []

  // Career start
  events.push({
    year: player.careerStartYear || careerState.currentYear,
    type: 'milestone',
    title: 'Career Started',
    description: `Began racing career at age ${player.careerStartAge}`,
  })

  // First race (if any)
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

  // First win (if any)
  const firstWin = raceHistory.find((r: RaceResult) => r.racePosition === 1)
  if (firstWin) {
    events.push({
      year: new Date(firstWin.date).getFullYear(),
      type: 'achievement',
      title: 'First Victory',
      description: `Won at ${firstWin.trackName}`,
    })
  }

  // First pole (if any)
  const firstPole = raceHistory.find((r: RaceResult) => r.qualifyingPosition === 1)
  if (firstPole) {
    events.push({
      year: new Date(firstPole.date).getFullYear(),
      type: 'achievement',
      title: 'First Pole Position',
      description: `Took pole at ${firstPole.trackName}`,
    })
  }

  // Championship wins from career events
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

  // Contracts signed
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

  // GOAT milestones unlocked
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

  // Sort by year descending (most recent first)
  events.sort((a, b) => b.year - a.year)

  // Limit to most recent 10 events
  const displayEvents = events.slice(0, 10)

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-surface-border" />
      
      {/* Timeline items */}
      <div className="space-y-4">
        {displayEvents.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Your journey begins...</p>
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
        <div className="mt-4 text-center">
          <p className="text-xs text-text-muted">
            +{events.length - 10} more events in your career
          </p>
        </div>
      )}
    </div>
  )
}

// Track Mastery Tab - shows performance at each track
function TrackMasteryTab({ trackHistory, raceHistory }: { trackHistory: Record<string, TrackHistory>; raceHistory?: RaceResult[] }) {
  // If trackHistory is empty but we have raceHistory, rebuild it on the fly
  const computedTrackHistory = React.useMemo(() => {
    if (trackHistory && Object.keys(trackHistory).length > 0) {
      return trackHistory
    }
    
    // Rebuild from raceHistory if available
    if (!raceHistory || raceHistory.length === 0) return {}
    
    const rebuilt: Record<string, TrackHistory> = {}
    
    // Sort by date
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
      
      // Track series raced here
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
      
      // Consecutive visits without DNF
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
      <Card variant="glass" padding="lg">
        <CardHeader 
          title="Track Mastery" 
          subtitle="Your performance at each circuit"
        />
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 mx-auto text-text-muted mb-4" />
          <h3 className="font-display font-semibold text-xl mb-2">No Track Data Yet</h3>
          <p className="text-text-muted">
            Complete races to build your track history
          </p>
        </div>
      </Card>
    )
  }

  // Sort tracks by visits (most visited first)
  const sortedTracks = [...tracks].sort((a, b) => b.visits - a.visits)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card variant="glass" padding="md" className="text-center">
          <p className="text-3xl font-display font-bold text-accent-red">{tracks.length}</p>
          <p className="text-sm text-text-muted">Tracks Visited</p>
        </Card>
        <Card variant="glass" padding="md" className="text-center">
          <p className="text-3xl font-display font-bold text-accent-gold">
            {tracks.filter(t => t.wins > 0).length}
          </p>
          <p className="text-sm text-text-muted">Tracks Won At</p>
        </Card>
        <Card variant="glass" padding="md" className="text-center">
          <p className="text-3xl font-display font-bold text-status-info">
            {Math.max(...tracks.map(t => t.maxConsecutiveWins || 0))}
          </p>
          <p className="text-sm text-text-muted">Best Win Streak</p>
        </Card>
        <Card variant="glass" padding="md" className="text-center">
          <p className="text-3xl font-display font-bold text-status-success">
            {(tracks.reduce((sum, t) => sum + t.avgFinish, 0) / tracks.length || 0).toFixed(1)}
          </p>
          <p className="text-sm text-text-muted">Avg Finish</p>
        </Card>
      </div>

      {/* Track List */}
      <Card variant="glass" padding="lg">
        <CardHeader 
          title="Track Performance" 
          subtitle="Your results at each circuit"
        />
        <div className="space-y-3 mt-4">
          {sortedTracks.map((track, index) => (
            <motion.div
              key={track.trackId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="p-4 bg-background/50 rounded-lg hover:bg-background/70 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent-red/20 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-accent-red" />
                    </div>
                    <div>
                      <h4 className="font-medium">{track.trackName}</h4>
                      <p className="text-xs text-text-muted">
                        {track.visits} visit{track.visits !== 1 ? 's' : ''} • 
                        First: {track.firstVisitYear} • 
                        Last: {track.lastVisitYear}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-center">
                  <div>
                    <p className="font-display font-bold text-accent-gold">{track.wins}</p>
                    <p className="text-xs text-text-muted">Wins</p>
                  </div>
                  <div>
                    <p className="font-display font-bold text-accent-orange">{track.podiums}</p>
                    <p className="text-xs text-text-muted">Podiums</p>
                  </div>
                  <div>
                    <p className="font-display font-bold text-status-info">{track.poles}</p>
                    <p className="text-xs text-text-muted">Poles</p>
                  </div>
                  <div>
                    <p className="font-display font-bold">P{track.bestFinish}</p>
                    <p className="text-xs text-text-muted">Best</p>
                  </div>
                  <div>
                    <p className="font-display font-bold text-text-secondary">
                      {track.avgFinish.toFixed(1)}
                    </p>
                    <p className="text-xs text-text-muted">Avg</p>
                  </div>
                  {track.maxConsecutiveWins > 1 && (
                    <div>
                      <Badge variant="gold" size="sm">
                        {track.maxConsecutiveWins}x streak
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// Calculate records from race history
function RecordsTab({ raceHistory }: { raceHistory: RaceResult[] }) {
  // Group races by series (season)
  const racesBySeries: Record<string, RaceResult[]> = {}
  raceHistory.forEach(race => {
    const key = race.seriesId
    if (!racesBySeries[key]) racesBySeries[key] = []
    racesBySeries[key].push(race)
  })

  // Calculate best championship position (we'd need standings data, estimate from results)
  // For now, estimate based on race finishes
  let _bestChampionshipPosition = '-'
  
  // Calculate most wins in a season
  let mostWinsInSeason = 0
  let mostWinsSeriesId = ''
  Object.entries(racesBySeries).forEach(([seriesId, races]) => {
    const wins = races.filter(r => r.racePosition === 1).length
    if (wins > mostWinsInSeason) {
      mostWinsInSeason = wins
      mostWinsSeriesId = seriesId
    }
  })

  // Calculate best win streak (consecutive wins)
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

  // Calculate most podiums in a season
  let mostPodiumsInSeason = 0
  let mostPodiumsSeriesId = ''
  Object.entries(racesBySeries).forEach(([seriesId, races]) => {
    const podiums = races.filter(r => r.racePosition <= 3).length
    if (podiums > mostPodiumsInSeason) {
      mostPodiumsInSeason = podiums
      mostPodiumsSeriesId = seriesId
    }
  })

  // Get track records (best lap times per track)
  const _trackBestLaps: Record<string, { time: number; date: string; position: number }> = {}
  raceHistory.forEach(_race => {
    // Note: bestLapTime might not be stored - this is a placeholder
    // In future, we could store and track best laps per track
  })

  // Calculate points finishes
  const pointsFinishes = raceHistory.filter(r => r.racePosition <= 10 && !r.dnf).length
  const fastestLaps = raceHistory.filter(r => r.fastestLap).length

  return (
    <div className="grid grid-cols-2 gap-6">
      <Card variant="glass" padding="lg">
        <CardHeader title="Personal Records" />
        <div className="space-y-4">
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
      </Card>

      <Card variant="glass" padding="lg">
        <CardHeader title="Career Milestones" />
        <div className="space-y-4">
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
      </Card>
    </div>
  )
}

// Rival Comparison Tab
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

  // Get standings from player's current series
  const currentSeriesId = player?.currentContract?.seriesId
  const standings = currentSeriesId ? getStandings(currentSeriesId) : []
  
  // Filter rivals in current championship (exclude player)
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

  // Get selected rival's full data
  const selectedRival = useMemo(() => {
    if (!selectedRivalId) return null
    
    const standing = rivalsInChampionship.find(r => r.driverId === selectedRivalId)
    if (!standing) return null
    
    return {
      standing,
      driver: standing.rivalData || null
    }
  }, [selectedRivalId, rivalsInChampionship])

  // Get player's standing in current championship
  const playerStanding = standings.find(s => s.isPlayer)

  // Calculate head-to-head record
  const headToHead = useMemo(() => {
    if (!selectedRival || !player?.raceHistory) {
      return { playerWins: 0, rivalWins: 0, ties: 0, total: 0 }
    }

    const _rivalName = selectedRival.standing.driverName.toLowerCase()
    let playerWins = 0
    let rivalWins = 0
    let ties = 0

    // For actual head-to-head, we'd need race-by-race positions for both drivers
    // Since we only have player's race history, we'll estimate based on standings
    // A more accurate version would track race results for all drivers
    
    const racesCompleted = Math.min(
      playerStanding?.races || 0,
      selectedRival.standing.races
    )

    // Calculate wins against each other based on their race counts
    // This is an approximation - in a full implementation, you'd track individual race results
    if (racesCompleted > 0 && playerStanding) {
      const playerWinRate = playerStanding.avgFinish
      const rivalWinRate = selectedRival.standing.avgFinish
      
      // Driver with better avg finish "wins" more head-to-heads
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

  // Generate radar data for comparison
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
      // Generate estimated stats from performance
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
    // Map RivalStats to match player stats structure
    // RivalStats uses raceSkill (0-1), we need to convert to 0-100 scale
    return [
      { label: 'Race', value: Math.round((stats.raceSkill ?? 0.5) * 100) },
      { label: 'Cons', value: Math.round((stats.consistency ?? 0.5) * 100) },
      { label: 'Wet', value: Math.round((stats.wetSkill ?? 0.5) * 100) },
      { label: 'Tire', value: Math.round((stats.tireManagement ?? 0.5) * 100) },
      { label: 'Tech', value: Math.round((stats.raceSkill ?? 0.5) * 100) }, // Use raceSkill as proxy for technical feedback
      { label: 'Mental', value: Math.round((stats.consistency ?? 0.5) * 100) }, // Use consistency as proxy for mental strength
    ]
  }, [selectedRival, playerRadarStats])

  // No standings/rivals available
  if (!currentSeriesId || rivalsInChampionship.length === 0) {
    return (
      <Card variant="glass" padding="lg">
        <CardHeader 
          title="Rival Comparison" 
          subtitle="Compare your stats with other drivers"
        />
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto text-text-muted mb-4" />
          <h3 className="font-display font-semibold text-xl mb-2">No Rivals Found</h3>
          <p className="text-text-muted max-w-md mx-auto">
            Complete races in a championship to compare yourself against other drivers
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Rival Selector */}
      <Card variant="glass" padding="lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-lg">Select a Rival</h3>
            <p className="text-sm text-text-muted">Choose a driver to compare your performance</p>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-4 py-3 bg-surface-secondary hover:bg-surface-secondary/80 
                         rounded-lg border border-surface-border transition-colors min-w-[280px]"
            >
              {selectedRival ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-accent-red/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-accent-red" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{selectedRival.standing.driverName}</p>
                    <p className="text-xs text-text-muted">
                      P{selectedRival.standing.position} • {selectedRival.standing.points} pts
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center">
                    <Users className="w-5 h-5 text-text-muted" />
                  </div>
                  <span className="flex-1 text-left text-text-muted">Select a rival...</span>
                </>
              )}
              <ChevronDown className={`w-5 h-5 text-text-muted transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 right-0 mt-2 bg-surface-primary rounded-lg border border-surface-border 
                           shadow-xl z-50 max-h-[400px] overflow-y-auto"
              >
                {rivalsInChampionship.map((rival) => (
                  <button
                    key={rival.driverId}
                    onClick={() => {
                      setSelectedRivalId(rival.driverId)
                      setIsDropdownOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-secondary/50 transition-colors
                               ${selectedRivalId === rival.driverId ? 'bg-accent-red/10' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                                   ${rival.position <= 3 ? 'bg-accent-gold/20 text-accent-gold' : 'bg-surface-secondary text-text-muted'}`}>
                      {rival.position}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{rival.driverName}</p>
                      <p className="text-xs text-text-muted">{rival.teamName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-medium">{rival.points} pts</p>
                      <p className="text-xs text-text-muted">{rival.wins}W {rival.podiums}P</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </Card>

      {selectedRival && playerStanding && (
        <>
          {/* Main Comparison Grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* Season Stats Side-by-Side */}
            <Card variant="racing" padding="lg" className="col-span-2">
              <CardHeader 
                title="Season Statistics" 
                subtitle="Current championship performance"
              />
              
              <div className="mt-6">
                {/* Driver Headers */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-status-info/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-status-info" />
                    </div>
                    <div>
                      <p className="font-display font-semibold">{player.name}</p>
                      <p className="text-xs text-text-muted">You</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <Swords className="w-6 h-6 text-accent-red" />
                  </div>
                  <div className="flex items-center gap-3 justify-end">
                    <div className="text-right">
                      <p className="font-display font-semibold">{selectedRival.standing.driverName}</p>
                      <p className="text-xs text-text-muted">{selectedRival.standing.teamName}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-accent-red/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-accent-red" />
                    </div>
                  </div>
                </div>

                {/* Stats Comparison Rows */}
                <div className="space-y-3">
                  <ComparisonRow 
                    label="Position" 
                    playerValue={playerStanding.position} 
                    rivalValue={selectedRival.standing.position}
                    format="position"
                    lowerIsBetter
                  />
                  <ComparisonRow 
                    label="Points" 
                    playerValue={playerStanding.points} 
                    rivalValue={selectedRival.standing.points}
                  />
                  <ComparisonRow 
                    label="Wins" 
                    playerValue={playerStanding.wins} 
                    rivalValue={selectedRival.standing.wins}
                  />
                  <ComparisonRow 
                    label="Podiums" 
                    playerValue={playerStanding.podiums} 
                    rivalValue={selectedRival.standing.podiums}
                  />
                  <ComparisonRow 
                    label="Poles" 
                    playerValue={playerStanding.poles} 
                    rivalValue={selectedRival.standing.poles}
                  />
                  <ComparisonRow 
                    label="Avg Finish" 
                    playerValue={playerStanding.avgFinish} 
                    rivalValue={selectedRival.standing.avgFinish}
                    format="decimal"
                    lowerIsBetter
                  />
                  <ComparisonRow 
                    label="Best Finish" 
                    playerValue={playerStanding.bestFinish} 
                    rivalValue={selectedRival.standing.bestFinish}
                    format="position"
                    lowerIsBetter
                  />
                  <ComparisonRow 
                    label="DNFs" 
                    playerValue={playerStanding.dnfs} 
                    rivalValue={selectedRival.standing.dnfs}
                    lowerIsBetter
                  />
                </div>
              </div>
            </Card>

            {/* Head-to-Head & Rivalry */}
            <div className="space-y-6">
              {/* Head-to-Head Record */}
              <Card variant="glass" padding="lg">
                <CardHeader title="Head-to-Head" />
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center">
                      <p className="text-3xl font-display font-bold text-status-info">{headToHead.playerWins}</p>
                      <p className="text-xs text-text-muted">Your Wins</p>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-lg font-display text-text-muted">vs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-display font-bold text-accent-red">{headToHead.rivalWins}</p>
                      <p className="text-xs text-text-muted">Their Wins</p>
                    </div>
                  </div>
                  
                  {/* Win Rate Bar */}
                  <div className="h-3 rounded-full bg-surface-secondary overflow-hidden flex">
                    {headToHead.total > 0 && (
                      <>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(headToHead.playerWins / headToHead.total) * 100}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="bg-status-info"
                        />
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(headToHead.rivalWins / headToHead.total) * 100}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                          className="bg-accent-red"
                        />
                      </>
                    )}
                  </div>
                  <p className="text-xs text-text-muted text-center mt-2">
                    {headToHead.total} race{headToHead.total !== 1 ? 's' : ''} together
                  </p>
                </div>
              </Card>

              {/* Rivalry Intensity */}
              <Card variant="glass" padding="lg">
                <CardHeader title="Rivalry" />
                <div className="mt-4">
                  <RivalryMeter 
                    intensity={selectedRival.driver?.rivalryIntensity ?? calculateRivalryIntensity(playerStanding, selectedRival.standing)}
                  />
                  <div className="mt-4 space-y-2">
                    {selectedRival.driver?.relationshipWithPlayer !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-muted">Relationship</span>
                        <span className={selectedRival.driver.relationshipWithPlayer > 0 ? 'text-status-success' : 
                                        selectedRival.driver.relationshipWithPlayer < 0 ? 'text-accent-red' : 'text-text-muted'}>
                          {selectedRival.driver.relationshipWithPlayer > 20 ? 'Friendly' :
                           selectedRival.driver.relationshipWithPlayer > 0 ? 'Respectful' :
                           selectedRival.driver.relationshipWithPlayer > -20 ? 'Neutral' :
                           selectedRival.driver.relationshipWithPlayer > -50 ? 'Tense' : 'Hostile'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Skill Radar Comparison */}
          <Card variant="glass" padding="lg">
            <CardHeader 
              title="Skill Comparison" 
              subtitle="Overlaid driver ability profiles"
            />
            <div className="flex items-center justify-center py-6">
              <ComparisonRadar 
                playerStats={playerRadarStats}
                rivalStats={rivalRadarStats}
                playerName={player.name}
                rivalName={selectedRival.standing.driverName}
                size={320}
              />
            </div>
            <div className="flex justify-center gap-8 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-status-info/60" />
                <span className="text-sm text-text-muted">You</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-accent-red/60" />
                <span className="text-sm text-text-muted">{selectedRival.standing.driverName}</span>
              </div>
            </div>
          </Card>

          {/* Career Comparison */}
          {selectedRival.driver && (
            <Card variant="glass" padding="lg">
              <CardHeader 
                title="Career Comparison" 
                subtitle="Lifetime achievements and experience"
              />
              <div className="grid grid-cols-5 gap-4 mt-6">
                <CareerStatCard 
                  label="Total Races"
                  playerValue={player.raceHistory?.length || 0}
                  rivalValue={selectedRival.driver.totalRaces}
                  icon={Flag}
                />
                <CareerStatCard 
                  label="Total Wins"
                  playerValue={player.raceHistory?.filter((r: RaceResult) => r.racePosition === 1).length || 0}
                  rivalValue={selectedRival.driver.totalWins}
                  icon={Trophy}
                />
                <CareerStatCard 
                  label="Podiums"
                  playerValue={player.raceHistory?.filter((r: RaceResult) => r.racePosition <= 3).length || 0}
                  rivalValue={selectedRival.driver.totalPodiums}
                  icon={Award}
                />
                <CareerStatCard 
                  label="Championships"
                  playerValue={player.championships || 0}
                  rivalValue={selectedRival.driver.championships}
                  icon={Crown}
                />
                <CareerStatCard 
                  label="Experience"
                  playerValue={careerState.currentYear - (player.careerStartYear || careerState.currentYear)}
                  rivalValue={selectedRival.driver.age - 18}
                  icon={Activity}
                  suffix=" yrs"
                />
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

// Helper: Calculate rivalry intensity from standings
function calculateRivalryIntensity(playerStanding: SeasonStanding, rivalStanding: SeasonStanding): number {
  const posDiff = Math.abs(playerStanding.position - rivalStanding.position)
  const ptsDiff = Math.abs(playerStanding.points - rivalStanding.points)
  
  // Closer in standings = higher rivalry
  let intensity = 100 - (posDiff * 15)
  
  // Close points battle intensifies rivalry
  if (ptsDiff < 50) intensity += 20
  else if (ptsDiff < 100) intensity += 10
  
  // Both fighting for top positions
  if (playerStanding.position <= 3 && rivalStanding.position <= 3) {
    intensity += 25
  }
  
  return Math.max(0, Math.min(100, intensity))
}

// Comparison Row Component
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
    <div className="grid grid-cols-3 gap-4 items-center py-2 border-b border-surface-border/50 last:border-0">
      <div className={`text-right font-mono font-bold text-lg ${playerBetter ? 'text-status-info' : tied ? 'text-text-muted' : 'text-text-secondary'}`}>
        {formatValue(playerValue)}
        {playerBetter && <span className="ml-2 text-xs">▲</span>}
      </div>
      <div className="text-center text-sm text-text-muted">{label}</div>
      <div className={`text-left font-mono font-bold text-lg ${rivalBetter ? 'text-accent-red' : tied ? 'text-text-muted' : 'text-text-secondary'}`}>
        {rivalBetter && <span className="mr-2 text-xs">▲</span>}
        {formatValue(rivalValue)}
      </div>
    </div>
  )
}

// Rivalry Meter Component
function RivalryMeter({ intensity }: { intensity: number }) {
  const getIntensityLabel = () => {
    if (intensity >= 80) return { label: 'Fierce Rivalry', color: 'text-accent-red' }
    if (intensity >= 60) return { label: 'Strong Rivalry', color: 'text-accent-orange' }
    if (intensity >= 40) return { label: 'Competitive', color: 'text-accent-gold' }
    if (intensity >= 20) return { label: 'Respectful', color: 'text-status-info' }
    return { label: 'Minimal', color: 'text-text-muted' }
  }

  const { label, color } = getIntensityLabel()

  return (
    <div className="text-center">
      <div className="relative w-24 h-24 mx-auto mb-3">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth="12"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="url(#rivalryGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            initial={{ strokeDasharray: '0 251.2' }}
            animate={{ strokeDasharray: `${(intensity / 100) * 251.2} 251.2` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id="rivalryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF8000" />
              <stop offset="100%" stopColor="#E10600" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Flame className={`w-8 h-8 ${intensity >= 60 ? 'text-accent-red' : 'text-text-muted'}`} />
        </div>
      </div>
      <p className={`font-display font-semibold ${color}`}>{label}</p>
      <p className="text-xs text-text-muted">{intensity}% intensity</p>
    </div>
  )
}

// Comparison Radar Chart
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
      {/* Background grid circles */}
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <circle
          key={scale}
          cx={center}
          cy={center}
          r={radius * scale}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.1}
        />
      ))}
      
      {/* Axis lines */}
      {playerStats.map((_, i) => (
        <line
          key={i}
          x1={center}
          y1={center}
          x2={center + radius * Math.cos(i * angleStep - Math.PI / 2)}
          y2={center + radius * Math.sin(i * angleStep - Math.PI / 2)}
          stroke="currentColor"
          strokeOpacity={0.1}
        />
      ))}
      
      {/* Rival area (behind) */}
      <motion.path
        d={rivalPath}
        fill="rgba(225, 6, 0, 0.2)"
        stroke="#E10600"
        strokeWidth={2}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{ transformOrigin: 'center' }}
      />
      
      {/* Player area (front) */}
      <motion.path
        d={playerPath}
        fill="rgba(59, 130, 246, 0.2)"
        stroke="#3B82F6"
        strokeWidth={2}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ transformOrigin: 'center' }}
      />
      
      {/* Labels */}
      {playerStats.map((stat, i) => {
        const angle = i * angleStep - Math.PI / 2
        const labelX = center + (radius + 20) * Math.cos(angle)
        const labelY = center + (radius + 20) * Math.sin(angle)
        return (
          <text
            key={i}
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-text-muted"
          >
            {stat.label}
          </text>
        )
      })}
    </svg>
  )
}

// Career Stat Card
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
      className="bg-surface-secondary/50 rounded-lg p-4 text-center"
    >
      <div className="w-10 h-10 mx-auto rounded-lg bg-accent-red/20 flex items-center justify-center text-accent-red mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-text-muted mb-2">{label}</p>
      <div className="flex items-center justify-center gap-3">
        <span className={`font-mono font-bold ${playerBetter ? 'text-status-info' : 'text-text-secondary'}`}>
          {playerValue}{suffix}
        </span>
        <span className="text-text-muted text-xs">vs</span>
        <span className={`font-mono font-bold ${rivalBetter ? 'text-accent-red' : 'text-text-secondary'}`}>
          {rivalValue}{suffix}
        </span>
      </div>
    </motion.div>
  )
}
