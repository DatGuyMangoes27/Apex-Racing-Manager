import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Star, TrendingUp, TrendingDown, Calendar,
  DollarSign, ChevronRight, Home, Medal, Flag,
  BookOpen, ArrowRight
} from 'lucide-react'
import { getCelebrationImage } from '@/utils/generated-assets'
import { useCareerStore, type SeasonSummary } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import { generateSeasonStory, type SeasonStoryMoment } from '@/simulation/seasonNarrative'

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }
const CARD = 'bg-white border-[0.8px] border-black/20 rounded-[24px] overflow-hidden'

export default function SeasonEnd() {
  const navigate = useNavigate()
  const { player, careerState, endSeason } = useCareerStore()
  const [summary, setSummary] = useState<SeasonSummary | null>(null)
  const [storyMoments, setStoryMoments] = useState<SeasonStoryMoment[]>([])
  const [showStory, setShowStory] = useState(false)
  const [revealedMoments, setRevealedMoments] = useState(0)
  const programSeriesSummaries = useMemo(() => {
    if (!player || !careerState) return []
    const rivalStore = useRivalStore.getState()
    const seriesIds = Array.from(
      new Set([
        ...(careerState.seriesEntries || []).map(e => e.seriesId),
        ...(player.currentSeriesId ? [player.currentSeriesId] : [])
      ].filter(Boolean))
    )
    return seriesIds.map(seriesId => {
      const series = rivalStore.getSeriesById(seriesId)
      const standings = rivalStore.getStandings(seriesId)
      const playerFullName = `${player.firstName} ${player.lastName}`
      const playerStanding = standings.find(s => s.isPlayer || s.driverName === playerFullName)
      const seasonRaces = player.raceHistory.filter(r => r.seriesId === seriesId)
      return {
        seriesId,
        seriesName: series?.name || seriesId,
        finalPosition: playerStanding?.position || (standings.length > 0 ? standings.length + 1 : 0),
        totalDrivers: standings.length,
        wins: seasonRaces.filter(r => r.racePosition === 1).length,
        podiums: seasonRaces.filter(r => r.racePosition <= 3).length,
        races: seasonRaces.length,
        points: playerStanding?.points || 0,
        isChampion: playerStanding?.position === 1,
      }
    }).filter(s => s.races > 0 || s.totalDrivers > 0)
  }, [player, careerState])

  useEffect(() => {
    if (!careerState || !player) return
    const resolvedSeriesId = careerState.seriesEntries?.[0]?.seriesId || player.currentSeriesId

    if (careerState.seasonCompleted) {
      const rivalStore = useRivalStore.getState()
      if (!resolvedSeriesId) return

      const series = rivalStore.getSeriesById(resolvedSeriesId)
      const standings = rivalStore.getStandings(resolvedSeriesId)
      const playerFullName = `${player.firstName} ${player.lastName}`
      const playerStanding = standings.find(s => s.isPlayer || s.driverName === playerFullName)
      const seasonRaces = player.raceHistory.filter(r => r.seriesId === resolvedSeriesId)

      const reconstructed: SeasonSummary = {
        year: careerState.currentYear,
        seriesName: series?.name || 'Unknown Series',
        finalPosition: playerStanding?.position || standings.length + 1,
        totalDrivers: standings.length,
        points: playerStanding?.points || 0,
        wins: seasonRaces.filter(r => r.racePosition === 1).length,
        podiums: seasonRaces.filter(r => r.racePosition <= 3).length,
        races: seasonRaces.length,
        prizeMoney: seasonRaces.reduce((sum, r) => sum + r.prizeMoney, 0),
        isChampion: playerStanding?.position === 1
      }
      setSummary(reconstructed)
    } else {
      const result = endSeason()
      if (result) setSummary(result)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!summary || !player || !careerState) return

    const storySeriesIds = programSeriesSummaries.map(s => s.seriesId)
    const seasonRaces = storySeriesIds.length > 0
      ? player.raceHistory.filter(r => storySeriesIds.includes(r.seriesId))
      : player.raceHistory

    const moments = generateSeasonStory({
      player,
      careerState,
      summary,
      seasonRaces
    })
    setStoryMoments(moments)
  }, [summary, player, careerState, programSeriesSummaries])

  useEffect(() => {
    if (!showStory || revealedMoments >= storyMoments.length) return
    const timer = setTimeout(() => setRevealedMoments(prev => prev + 1), 600)
    return () => clearTimeout(timer)
  }, [showStory, revealedMoments, storyMoments.length])

  if (!summary || !player) {
    return (
      <div className="bg-white w-full h-full overflow-y-auto">
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-[16px]">
            <Trophy className="w-[64px] h-[64px] text-[#4a5565] mx-auto animate-pulse" />
            <p className="text-[#4a5565] text-[16px]" style={FR}>Loading season summary...</p>
          </div>
        </div>
      </div>
    )
  }

  const positionSuffix = (pos: number) => {
    if (pos === 1) return 'st'
    if (pos === 2) return 'nd'
    if (pos === 3) return 'rd'
    return 'th'
  }

  return (
    <div className="bg-white w-full h-full overflow-y-auto">
      <div className="p-[24px] flex flex-col gap-[24px] max-w-[900px] mx-auto">
        {/* Header */}
        <div>
          <div className="flex items-center gap-[12px] mb-[4px]">
            <Trophy className="w-[28px] h-[28px] text-[#0a0a0a]" />
            <h1 className="text-[30px] text-[#0a0a0a] tracking-[-1.5px]" style={FB}>
              {summary.year} Season Review
            </h1>
          </div>
          <p className="text-[14px] text-[#4a5565]" style={FR}>{summary.seriesName}</p>
        </div>

        {/* Championship Result Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className={`${CARD} ${summary.isChampion ? 'border-[#f59e0b]/40' : ''}`}>
            {/* Celebration Hero Image */}
            <div className="relative h-[160px] overflow-hidden">
              <img
                src={getCelebrationImage(summary.isChampion ? 'champion-celebration' : 'season-reflection')}
                alt="Season End"
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent" />
            </div>
            <div className="text-center space-y-[16px] p-[24px] -mt-[64px] relative">
              {summary.isChampion ? (
                <>
                  <Trophy className="w-[80px] h-[80px] mx-auto text-[#f59e0b]" />
                  <h2 className="text-[30px] text-[#f59e0b] tracking-[-1.5px]" style={FB}>Champion!</h2>
                  <p className="text-[18px] text-[#4a5565]" style={FR}>
                    {player.firstName} {player.lastName} — {summary.seriesName} {summary.year} Champion
                  </p>
                </>
              ) : (
                <>
                  <Medal className="w-[64px] h-[64px] mx-auto text-[#4a5565]" />
                  <h2 className="text-[26px] text-[#0a0a0a] tracking-[-1px]" style={FB}>
                    {summary.finalPosition}{positionSuffix(summary.finalPosition)} Place
                  </h2>
                  <p className="text-[16px] text-[#4a5565]" style={FR}>
                    {summary.seriesName} {summary.year} — out of {summary.totalDrivers} drivers
                  </p>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Season Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-[16px]"
        >
          {[
            { label: 'Races', value: summary.races, icon: Flag, color: '#2563eb' },
            { label: 'Wins', value: summary.wins, icon: Trophy, color: '#f59e0b' },
            { label: 'Podiums', value: summary.podiums, icon: Medal, color: '#ea580c' },
            { label: 'Points', value: summary.points, icon: Star, color: '#7c3aed' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[16px] p-[16px]">
              <div className="text-center space-y-[8px]">
                <stat.icon className="w-[24px] h-[24px] mx-auto" style={{ color: stat.color }} />
                <p className="text-[26px] text-[#0a0a0a]" style={FB}>{stat.value}</p>
                <p className="text-[11px] text-[#4a5565] uppercase tracking-[1px]" style={FBold}>{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Multi-Series Program Breakdown */}
        {programSeriesSummaries.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            <div className={`${CARD} p-[24px]`}>
              <div className="flex items-center justify-between mb-[16px]">
                <h3 className="text-[18px] text-[#0a0a0a]" style={FB}>Program Breakdown</h3>
                <span className="px-[10px] py-[4px] bg-[#2563eb]/10 text-[#2563eb] text-[12px] rounded-[8px]" style={FBold}>
                  {programSeriesSummaries.length} Series
                </span>
              </div>
              <div className="space-y-[8px]">
                {programSeriesSummaries.map(s => (
                  <div key={s.seriesId} className="flex items-center justify-between p-[12px] rounded-[12px] bg-[#f9fafb]">
                    <div>
                      <p className="text-[14px] text-[#0a0a0a]" style={FBold}>{s.seriesName}</p>
                      <p className="text-[12px] text-[#4a5565]" style={FR}>
                        {s.races} races · {s.wins} wins · {s.podiums} podiums
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] text-[#0a0a0a]" style={FBold}>
                        {s.totalDrivers > 0 ? `P${s.finalPosition}/${s.totalDrivers}` : 'No standings'}
                      </p>
                      {s.isChampion && (
                        <span className="px-[8px] py-[2px] bg-[#f59e0b]/10 text-[#f59e0b] text-[11px] rounded-[6px]" style={FBold}>
                          Champion
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Prize Money */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className={`${CARD} p-[24px]`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[12px]">
                <DollarSign className="w-[24px] h-[24px] text-[#00a63e]" />
                <div>
                  <p className="text-[13px] text-[#4a5565]" style={FR}>Total Prize Money</p>
                  <p className="text-[22px] text-[#00a63e]" style={FB}>
                    ${summary.prizeMoney.toLocaleString()}
                  </p>
                </div>
              </div>
              <span className={`px-[10px] py-[4px] text-[12px] rounded-[8px] ${summary.isChampion ? 'bg-[#f59e0b]/10 text-[#f59e0b]' : 'bg-[#f9fafb] text-[#4a5565]'}`} style={FBold}>
                {summary.isChampion ? 'Championship Bonus Applied' : `P${summary.finalPosition} Earnings`}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Story of the Season */}
        {storyMoments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {!showStory ? (
              <button
                onClick={() => { setShowStory(true); setRevealedMoments(1) }}
                className="w-full h-[48px] bg-black text-white rounded-[16px] flex items-center justify-center gap-[8px] text-[14px] hover:bg-black/90 transition-colors"
                style={FBold}
              >
                <BookOpen className="w-[20px] h-[20px]" />
                Read the Story of Your Season
              </button>
            ) : (
              <div className={`${CARD} p-[24px]`}>
                <div className="flex items-center gap-[12px] mb-[24px]">
                  <BookOpen className="w-[24px] h-[24px] text-[#2563eb]" />
                  <h3 className="text-[18px] text-[#0a0a0a]" style={FB}>The Story of Your Season</h3>
                </div>

                <div className="space-y-[16px]">
                  <AnimatePresence>
                    {storyMoments.slice(0, revealedMoments).map((moment, i) => (
                      <motion.div
                        key={moment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.1 }}
                        className="flex items-start gap-[16px] p-[12px] rounded-[12px] bg-[#f9fafb]"
                      >
                        <span className="text-[24px] flex-shrink-0">{moment.icon}</span>
                        <div className="flex-1">
                          <p className="text-[13px] text-[#0a0a0a] leading-relaxed" style={FR}>{moment.text}</p>
                          <span className="inline-block mt-[8px] px-[8px] py-[2px] bg-black/5 text-[#4a5565] text-[11px] rounded-[6px]" style={FR}>
                            {moment.category}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {revealedMoments < storyMoments.length && (
                  <div className="mt-[16px] text-center">
                    <button
                      onClick={() => setRevealedMoments(storyMoments.length)}
                      className="text-[13px] text-[#2563eb] hover:underline"
                      style={FR}
                    >
                      Reveal all
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex justify-center"
        >
          <button
            onClick={() => navigate('/home')}
            className="h-[48px] px-[32px] bg-black text-white rounded-[16px] flex items-center gap-[8px] text-[14px] hover:bg-black/90 transition-colors"
            style={FBold}
          >
            <Home className="w-[20px] h-[20px]" />
            Continue to Next Season
            <ArrowRight className="w-[20px] h-[20px]" />
          </button>
        </motion.div>
      </div>
    </div>
  )
}
