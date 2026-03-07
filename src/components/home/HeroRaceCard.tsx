/**
 * HeroRaceCard — Figma-inspired large center race card
 * Track image background, race name overlay, stat pills (Laps, Prize, Diff), CTA button.
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flag, Play, Settings2 } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import { TrackImage } from '@/components/ui/TrackImage'
import { getTrackById } from '@/data/ams2-tracks'

export function HeroRaceCard() {
  const navigate = useNavigate()
  const { careerState, player } = useCareerStore()
  const { getSeriesById } = useRivalStore()

  const raceData = useMemo(() => {
    if (!careerState || !player?.currentSeriesId) {
      return null
    }

    const series = getSeriesById(player.currentSeriesId)
    if (!series) return null

    const nextRace = series.calendar?.find(r => r.week >= (careerState.currentWeek || 0))
    const trackInfo = nextRace ? getTrackById(nextRace.trackId) : null
    const weeksUntilRace = nextRace ? nextRace.week - (careerState.currentWeek || 0) : null
    const daysUntil = weeksUntilRace !== null ? weeksUntilRace * 7 : null
    const isRaceWeek = weeksUntilRace === 0

    return {
      trackName: trackInfo?.name || nextRace?.trackName || careerState?.nextRaceTrack || 'TBC',
      trackInfo,
      series,
      daysUntil,
      isRaceWeek,
      laps: nextRace?.laps || trackInfo?.laps || '--',
      prize: nextRace?.prize || series?.prizePool || '--',
      difficulty: series?.difficulty || 'MEDIUM',
    }
  }, [careerState, player, getSeriesById])

  if (!raceData) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => navigate('/series-entry')}
        className="rounded-2xl border-2 border-black/80 bg-white/[0.08] backdrop-blur-sm shadow-lg flex flex-col items-center justify-center py-20 cursor-pointer"
      >
        <Flag className="w-10 h-10 text-slate-600 mb-3" />
        <p className="font-display font-black text-xl text-slate-400 tracking-tight">NO SERIES ENTERED</p>
        <p className="text-xs text-slate-500 mt-1">Enter a series to start racing</p>
      </motion.div>
    )
  }

  const prizeDisplay = typeof raceData.prize === 'number'
    ? `$${(raceData.prize / 1000).toFixed(0)}K`
    : raceData.prize

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border-2 border-black/80 bg-white/[0.08] backdrop-blur-sm shadow-lg overflow-hidden cursor-pointer group"
      onClick={() => navigate('/race-day')}
    >
      {/* Header bar: "CONTINUE CAREER" */}
      <div className="flex items-center justify-between px-5 py-3 border-b-2 border-black/80">
        <span className="text-[10px] font-display font-bold text-slate-400 tracking-widest uppercase">
          Continue Career
        </span>
        <div className="flex items-center gap-2">
          <span className="font-display font-black text-white text-sm tracking-tight">
            {raceData.trackName.toUpperCase()}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            Starts in
          </span>
          <span className="font-display font-black text-lg text-white">
            {raceData.daysUntil !== null ? `${raceData.daysUntil}D` : '--'}
          </span>
          <Settings2 className="w-4 h-4 text-slate-500 ml-1" />
        </div>
      </div>

      {/* Track image with overlay */}
      <div className="relative h-[260px]">
        {raceData.trackInfo ? (
          <TrackImage
            trackId={raceData.trackInfo.id}
            imageType="grandstand"
            size="full"
            className="!rounded-none h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* "NEXT RACE" badge */}
        <div className="absolute top-4 left-4">
          <span
            className="px-3 py-1 rounded-full text-[10px] font-display font-bold text-white/90 uppercase tracking-wider backdrop-blur-md"
            style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <Flag className="w-3 h-3 inline mr-1.5 -mt-0.5" />
            Next Race · {raceData.daysUntil ?? '--'} Days
          </span>
        </div>

        {/* Big track name */}
        <div className="absolute bottom-20 left-5 right-5">
          <h1
            className="font-display font-black text-5xl text-white tracking-wide leading-none"
            style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}
          >
            {raceData.trackName.toUpperCase().split(' ').map((word, i) => (
              <span key={i}>
                {word}
                <br />
              </span>
            ))}
          </h1>
        </div>

        {/* Stat pills at bottom of image */}
        <div className="absolute bottom-4 left-4 right-4 flex gap-2">
          {[
            { value: raceData.laps, label: 'LAPS' },
            { value: prizeDisplay, label: 'PRIZE' },
            { value: raceData.difficulty.toString().toUpperCase(), label: 'DIFF' },
          ].map((pill) => (
            <div
              key={pill.label}
              className="flex-1 flex flex-col items-center py-2.5 rounded-xl backdrop-blur-md"
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <span className="font-display font-black text-lg text-white">{pill.value}</span>
              <span className="text-[8px] font-display font-bold text-slate-400 tracking-widest">{pill.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA button */}
      <button
        onClick={(e) => { e.stopPropagation(); navigate('/race-day') }}
        className="w-full flex items-center justify-center gap-2 py-3.5 border-t-2 border-black/80 hover:bg-white/[0.04] transition-colors"
      >
        <Play className="w-4 h-4 text-slate-400" />
        <span className="font-display font-black text-sm text-white tracking-wider uppercase">
          Race Details
        </span>
      </button>
    </motion.div>
  )
}
