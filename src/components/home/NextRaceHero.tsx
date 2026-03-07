import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flag } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import { TrackImage } from '@/components/ui/TrackImage'
import { getTrackById } from '@/data/ams2-tracks'

const COUNTRY_FLAGS: Record<string, string> = {
  'Brazil': '\u{1F1E7}\u{1F1F7}', 'Germany': '\u{1F1E9}\u{1F1EA}', 'UK': '\u{1F1EC}\u{1F1E7}', 'England': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
  'Belgium': '\u{1F1E7}\u{1F1EA}', 'Italy': '\u{1F1EE}\u{1F1F9}', 'Australia': '\u{1F1E6}\u{1F1FA}', 'Japan': '\u{1F1EF}\u{1F1F5}',
  'USA': '\u{1F1FA}\u{1F1F8}', 'France': '\u{1F1EB}\u{1F1F7}', 'Spain': '\u{1F1EA}\u{1F1F8}', 'Austria': '\u{1F1E6}\u{1F1F9}',
  'Netherlands': '\u{1F1F3}\u{1F1F1}', 'Portugal': '\u{1F1F5}\u{1F1F9}', 'Monaco': '\u{1F1F2}\u{1F1E8}', 'Canada': '\u{1F1E8}\u{1F1E6}',
  'Argentina': '\u{1F1E6}\u{1F1F7}', 'Mexico': '\u{1F1F2}\u{1F1FD}', 'China': '\u{1F1E8}\u{1F1F3}', 'South Africa': '\u{1F1FF}\u{1F1E6}',
  'Hungary': '\u{1F1ED}\u{1F1FA}', 'Czech Republic': '\u{1F1E8}\u{1F1FF}', 'Sweden': '\u{1F1F8}\u{1F1EA}', 'Finland': '\u{1F1EB}\u{1F1EE}',
  'Malaysia': '\u{1F1F2}\u{1F1FE}', 'Bahrain': '\u{1F1E7}\u{1F1ED}', 'UAE': '\u{1F1E6}\u{1F1EA}', 'Singapore': '\u{1F1F8}\u{1F1EC}',
}

export function NextRaceHero({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  const { careerState, player } = useCareerStore()
  const { getStandings, getSeriesById } = useRivalStore()

  const raceData = useMemo(() => {
    if (!careerState || !player?.currentSeriesId) return null

    const series = getSeriesById(player.currentSeriesId)
    if (!series) return null

    const nextRace = series.calendar?.find(r => r.week >= (careerState.currentWeek || 0))
    const trackInfo = nextRace ? getTrackById(nextRace.trackId) : null

    const weeksUntilRace = nextRace ? nextRace.week - (careerState.currentWeek || 0) : null

    return {
      series,
      nextRace,
      trackInfo,
      weeksUntilRace,
      totalRounds: series.calendar?.length || 0,
      currentRound: careerState.currentRound || 0,
    }
  }, [careerState, player, getStandings, getSeriesById])

  if (!raceData) {
    return (
      <div className="rounded overflow-hidden" style={{ background: 'linear-gradient(to bottom, #374354, #2a3442)' }}>
        <div className="p-8 text-center">
          <Flag className="w-10 h-10 mx-auto mb-3" style={{ color: '#3a4a5e' }} />
          <h2
            className="font-bold text-lg mb-1 tracking-wide"
            style={{ color: '#d4dae3', fontFamily: 'Rajdhani, sans-serif' }}
          >
            No Race Scheduled
          </h2>
          <p className="text-xs" style={{ color: '#6a7a8a' }}>Enter a series to begin your season</p>
        </div>
      </div>
    )
  }

  const {
    nextRace,
    trackInfo,
    weeksUntilRace,
    totalRounds,
    currentRound,
  } = raceData

  const isRaceWeek = weeksUntilRace === 0
  const trackCountry = trackInfo?.country || nextRace?.country || ''
  const countryFlag = COUNTRY_FLAGS[trackCountry] || ''
  const displayTrackName = trackInfo?.name || nextRace?.trackName || careerState?.nextRaceTrack || 'TBC'
  const daysUntil = weeksUntilRace !== null ? weeksUntilRace * 7 : null

  return (
    <div
      className="rounded overflow-hidden cursor-pointer group relative"
      onClick={() => navigate('/race-day')}
      style={{ background: 'linear-gradient(to bottom, #374354, #2a3442)' }}
    >
      {/* Header strip — "NEXT RACE" with countdown */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h3
            className="text-sm font-bold uppercase tracking-[0.15em]"
            style={{ color: '#d4dae3', fontFamily: 'Rajdhani, sans-serif' }}
          >
            Next Race
          </h3>
          {daysUntil !== null && daysUntil > 0 && (
            <span
              className="text-xs font-medium"
              style={{ color: '#7a8a9a', fontFamily: 'Rajdhani, sans-serif' }}
            >
              in {daysUntil} Days
            </span>
          )}
        </div>
        {countryFlag && <span className="text-lg">{countryFlag}</span>}
      </div>

      {/* Track Photo — MM3 style with overlays */}
      <div className="relative h-[160px]">
        <div className="absolute inset-0">
          {trackInfo ? (
            <TrackImage
              trackId={trackInfo.id}
              imageType="grandstand"
              size="full"
              className="!rounded-none h-full"
            />
          ) : (
            <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #1e2a38, #263040)' }} />
          )}
        </div>

        {/* Bottom gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#263040] via-[#263040]/50 to-transparent" />

        {/* Calendar button — top right, MM3 blue style */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation()
            navigate('/calendar')
          }}
          className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider"
          style={{
            background: 'linear-gradient(to bottom, #4fa8d6, #3a8db8)',
            color: '#fff',
            fontFamily: 'Rajdhani, sans-serif',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          Calendar
        </motion.button>

        {/* Bottom-left: Event badge + track name */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.15em]"
              style={{ color: '#7a8a9a', fontFamily: 'Rajdhani, sans-serif' }}
            >
              Event {currentRound + 1}
            </span>
            {isRaceWeek && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded animate-pulse"
                style={{
                  background: 'rgba(225, 6, 0, 0.25)',
                  border: '1px solid rgba(225, 6, 0, 0.5)',
                  color: '#E10600',
                  fontFamily: 'Rajdhani, sans-serif',
                }}
              >
                <Flag className="w-2.5 h-2.5" />
                RACE WEEK
              </span>
            )}
          </div>

          <h2
            className="font-black text-xl tracking-wide leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
            style={{ color: '#fff', fontFamily: 'Rajdhani, sans-serif' }}
          >
            {displayTrackName.toUpperCase()}
          </h2>
        </div>
      </div>
    </div>
  )
}
