/**
 * HeroBanner — Cinematic full-width race countdown or development phase banner
 * Inspired by F1 broadcast overlays and premium dark dashboards.
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flag, Calendar, Settings2, Wrench } from 'lucide-react'
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

export function HeroBanner() {
  const navigate = useNavigate()
  const { careerState, player } = useCareerStore()
  const { getSeriesById } = useRivalStore()

  const bannerData = useMemo(() => {
    if (!careerState || !player?.currentSeriesId) {
      return {
        mode: 'no-series' as const,
        week: careerState?.currentWeek ?? 1,
        year: careerState?.currentYear ?? 2024,
      }
    }

    const series = getSeriesById(player.currentSeriesId)
    if (!series) return null

    const nextRace = series.calendar?.find(r => r.week >= (careerState.currentWeek || 0))
    const trackInfo = nextRace ? getTrackById(nextRace.trackId) : null
    const weeksUntilRace = nextRace ? nextRace.week - (careerState.currentWeek || 0) : null
    const daysUntil = weeksUntilRace !== null ? weeksUntilRace * 7 : null
    const isRaceWeek = weeksUntilRace === 0
    const currentDay = careerState.currentDay ?? 1
    const isRaceWeekend = !!nextRace && nextRace.week === careerState.currentWeek && currentDay >= 5

    return {
      mode: isRaceWeek || isRaceWeekend ? 'race-week' : 'countdown',
      series,
      nextRace,
      trackInfo,
      daysUntil,
      isRaceWeek,
      currentRound: careerState.currentRound || 0,
      totalRounds: series.calendar?.length || 0,
      week: careerState.currentWeek,
      year: careerState.currentYear,
      trackCountry: trackInfo?.country || nextRace?.country || '',
      displayTrackName: trackInfo?.name || nextRace?.trackName || careerState?.nextRaceTrack || 'TBC',
    }
  }, [careerState, player, getSeriesById])

  if (!bannerData) return null

  // No series — development phase
  if (bannerData.mode === 'no-series') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-[130px] rounded-xl overflow-hidden cursor-pointer group"
        onClick={() => navigate('/series-entry')}
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
      >
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url(/textures/carbon-fiber.png)', backgroundSize: '200px' }} />
        <div className="relative h-full flex items-center justify-between px-8">
          <div>
            <p className="text-[11px] font-display font-semibold text-blue-400/60 uppercase tracking-[0.2em] mb-1">
              Development Phase
            </p>
            <h2 className="font-display font-black text-2xl text-slate-200">
              Week {bannerData.week} <span className="text-slate-500 font-medium">·</span> <span className="text-slate-400 font-semibold">Season {bannerData.year}</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">Enter a series to begin racing</p>
          </div>
          <motion.div
            animate={{ opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Flag className="w-20 h-20 text-blue-500/20" />
          </motion.div>
        </div>
      </motion.div>
    )
  }

  const { nextRace, trackInfo, daysUntil, isRaceWeek, currentRound, totalRounds, trackCountry, displayTrackName } = bannerData
  const countryFlag = COUNTRY_FLAGS[trackCountry] || ''

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative h-[200px] rounded-xl overflow-hidden cursor-pointer group"
      onClick={() => navigate('/race-day')}
    >
      {/* Track image background */}
      <div className="absolute inset-0">
        {trackInfo ? (
          <TrackImage
            trackId={trackInfo.id}
            imageType="grandstand"
            size="full"
            className="!rounded-none h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }} />
        )}
      </div>

      {/* Multi-layer gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0F] via-[#0D0D0F]/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0F]/60 to-transparent" />

      {/* Race week red accent border */}
      {isRaceWeek && (
        <motion.div
          className="absolute top-0 inset-x-0 h-[3px]"
          style={{ background: 'linear-gradient(90deg, #E10600, #FF8000, #E10600)' }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Top-left: Round pill + race week badge */}
      <div className="absolute top-4 left-5 flex items-center gap-2.5">
        <span
          className="px-3 py-1 rounded-full text-[11px] font-display font-bold uppercase tracking-wider text-slate-300 backdrop-blur-md"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          Round {currentRound + 1}/{totalRounds}
        </span>
        {isRaceWeek && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full font-display font-bold text-[11px] uppercase tracking-wider"
            style={{
              background: 'linear-gradient(135deg, rgba(225,6,0,0.85) 0%, rgba(255,128,0,0.85) 100%)',
              border: '1px solid rgba(225,6,0,0.5)',
              color: '#fff',
              boxShadow: '0 0 20px rgba(225,6,0,0.3)',
            }}
          >
            <Flag className="w-3 h-3" />
            Race Week
          </motion.span>
        )}
      </div>

      {/* Top-right: Country flag */}
      {countryFlag && (
        <div className="absolute top-4 right-5">
          <span className="text-2xl drop-shadow-lg">{countryFlag}</span>
        </div>
      )}

      {/* Bottom content */}
      <div className="absolute bottom-0 inset-x-0 p-5 flex items-end justify-between">
        {/* Track name */}
        <div>
          <h2
            className="font-display font-black text-3xl tracking-wide text-white"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.5)' }}
          >
            {displayTrackName.toUpperCase()}
          </h2>
        </div>

        {/* Right side: countdown + actions */}
        <div className="flex items-end gap-5">
          {/* Days countdown */}
          {!isRaceWeek && daysUntil !== null && daysUntil > 0 && (
            <div className="text-right mr-2">
              <p className="text-[9px] font-display font-semibold text-slate-400 uppercase tracking-[0.2em]">
                Days to race
              </p>
              <motion.p
                className="font-display font-black text-5xl leading-none"
                style={{
                  background: 'linear-gradient(180deg, #E10600, #FF8000)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 20px rgba(225,6,0,0.4))',
                }}
                animate={{ opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {daysUntil}
              </motion.p>
            </div>
          )}

          {/* Quick action pills */}
          <div className="flex gap-1.5">
            {[
              { icon: Calendar, label: 'Calendar', path: '/calendar' },
              { icon: Settings2, label: 'Strategy', path: '/race-day', primary: true },
              { icon: Wrench, label: 'Setup', path: '/garage' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={(e) => { e.stopPropagation(); navigate(action.path) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-display font-semibold transition-all duration-200 backdrop-blur-md ${
                  action.primary
                    ? 'text-white hover:shadow-lg hover:shadow-red-500/20'
                    : 'text-slate-300 hover:text-white'
                }`}
                style={action.primary ? {
                  background: 'linear-gradient(135deg, rgba(225,6,0,0.8), rgba(255,128,0,0.8))',
                  border: '1px solid rgba(225,6,0,0.4)',
                } : {
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <action.icon className="w-3.5 h-3.5" />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
