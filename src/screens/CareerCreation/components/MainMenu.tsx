import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Plus,
  Trash2,
  Trophy,
  Medal,
  Calendar,
  AlertTriangle,
  Globe,
  ArrowRight,
  Users,
  Flag,
  TrendingUp,
  Settings,
} from 'lucide-react'
import type { PlayerDriver } from '@/store/careerStore'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import { HERO_IMAGES } from '@/data/stock-images'

// ============================================
// FIGMA-EXACT START SCREEN
// White/black theme · Arial Black · clean cards
// ============================================

const FONT_BLACK: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FONT_REGULAR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }

interface MainMenuProps {
  hasSaveData: boolean
  player: PlayerDriver | null
  careerState: { currentYear: number; currentWeek: number } | null
  onContinue: () => void
  onNewCareer: () => void
  onDeleteSave: () => void
  showDeleteModal: boolean
  onCloseDeleteModal: () => void
  onConfirmDelete: () => void
  isCreatingWorld: boolean
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function useCareerStats() {
  const { careerState, player } = useCareerStore()
  const { getStandings, getSeriesById } = useRivalStore()

  return useMemo(() => {
    if (!player || !careerState) return null

    const entries = careerState.seriesEntries ?? []
    const seriesId = player.currentSeriesId || entries[0]?.seriesId
    if (!seriesId) return { points: 0, rank: '--', season: careerState.currentYear, nextRace: null }

    const standings = getStandings(seriesId) ?? []
    const teamName = careerState.ownedTeam?.name ?? ''
    const teamDriverIds = (careerState.ownedTeam?.drivers ?? []).map((d: { driverId: string }) => d.driverId)

    let totalPoints = 0
    let rank = '--'
    for (let i = 0; i < standings.length; i++) {
      const s = standings[i]
      if (s.teamName === teamName || teamDriverIds.includes(s.driverId)) {
        totalPoints += s.points
        if (rank === '--') rank = getOrdinal(i + 1)
      }
    }

    // Find next race
    const series = getSeriesById(seriesId)
    let nextRace: { name: string; daysUntil: number } | null = null
    if (series?.calendar) {
      const currentWeek = careerState.currentWeek
      const nextRaceEvent = series.calendar.find((r: { week: number }) => r.week >= currentWeek)
      if (nextRaceEvent) {
        const daysUntil = Math.max(0, (nextRaceEvent.week - currentWeek) * 7 - ((careerState.currentDay ?? 1) - 1))
        nextRace = {
          name: nextRaceEvent.trackName?.toUpperCase() ?? 'UNKNOWN CIRCUIT',
          daysUntil,
        }
      }
    }

    return {
      points: totalPoints,
      rank,
      season: careerState.currentYear,
      nextRace,
    }
  }, [player, careerState, getStandings, getSeriesById])
}

export default function MainMenu({
  hasSaveData,
  player,
  careerState,
  onContinue,
  onNewCareer,
  onDeleteSave,
  showDeleteModal,
  onCloseDeleteModal,
  onConfirmDelete,
  isCreatingWorld,
}: MainMenuProps) {
  const navigate = useNavigate()
  const stats = useCareerStats()

  return (
    <div className="relative w-full h-full overflow-hidden bg-white">
      {/* Background racing image with white overlay */}
      <div className="absolute inset-0">
        <img
          src={HERO_IMAGES.mainMenu}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.85) 100%)',
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top bar: Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-4 px-12 pt-12"
        >
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shrink-0">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <p
              className="text-5xl text-[#0a0a0a] leading-[48px] tracking-[-2.4px]"
              style={FONT_BLACK}
            >
              APEX
            </p>
            <p
              className="text-sm text-[#4a5565] tracking-[0.35px] leading-5"
              style={FONT_REGULAR}
            >
              RACING MANAGER
            </p>
          </div>
        </motion.div>

        {/* Center: Two main cards */}
        <div className="flex-1 flex items-center justify-center px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="grid gap-8 w-full"
            style={{
              maxWidth: 1152,
              gridTemplateColumns: hasSaveData ? '1fr 1fr' : '1fr',
            }}
          >
            {/* ── CONTINUE CAREER CARD (white) ── */}
            {hasSaveData && player && stats && (
              <motion.div
                whileHover={{ scale: 1.005 }}
                transition={{ type: 'spring', stiffness: 300 }}
                onClick={onContinue}
                className="bg-white border-4 border-black rounded-3xl overflow-hidden p-1 cursor-pointer"
                style={{ minHeight: 580 }}
              >
                <div className="relative h-full flex flex-col px-12 py-12">
                  {/* Badge */}
                  <div className="bg-black rounded-full inline-flex items-center gap-2 px-4 py-2 self-start mb-4">
                    <Play className="w-3 h-3 text-white fill-white" />
                    <span
                      className="text-xs text-white tracking-[1.2px] leading-4"
                      style={FONT_BLACK}
                    >
                      CAREER MODE
                    </span>
                  </div>

                  {/* Title */}
                  <div className="mb-6" style={FONT_BLACK}>
                    <p className="text-7xl text-[#0a0a0a] leading-[72px] tracking-[-3.6px]">
                      CONTINUE
                    </p>
                    <p className="text-7xl text-[#0a0a0a] leading-[72px] tracking-[-3.6px]">
                      CAREER
                    </p>
                  </div>

                  {/* Stats row */}
                  <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl p-6 mb-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-[#4a5565]" />
                          <span className="text-xs text-[#4a5565] tracking-[0.3px]" style={FONT_REGULAR}>
                            POINTS
                          </span>
                        </div>
                        <p className="text-3xl text-[#0a0a0a] leading-9" style={FONT_BLACK}>
                          {stats.points.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Medal className="w-4 h-4 text-[#4a5565]" />
                          <span className="text-xs text-[#4a5565] tracking-[0.3px]" style={FONT_REGULAR}>
                            RANK
                          </span>
                        </div>
                        <p className="text-3xl text-[#0a0a0a] leading-9" style={FONT_BLACK}>
                          {stats.rank}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#4a5565]" />
                          <span className="text-xs text-[#4a5565] tracking-[0.3px]" style={FONT_REGULAR}>
                            SEASON
                          </span>
                        </div>
                        <p className="text-3xl text-[#0a0a0a] leading-9" style={FONT_BLACK}>
                          {stats.season}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Next race block */}
                  {stats.nextRace && (
                    <div className="bg-black rounded-2xl px-6 pt-6 pb-5 mb-6">
                      <p className="text-xs text-[#99a1af] tracking-[1.2px] leading-4 mb-2" style={FONT_REGULAR}>
                        NEXT RACE
                      </p>
                      <p className="text-2xl text-white leading-8" style={FONT_BLACK}>
                        {stats.nextRace.name}
                      </p>
                      <p className="text-sm text-[#99a1af] leading-5 mt-1" style={FONT_REGULAR}>
                        Starts in {stats.nextRace.daysUntil} days
                      </p>
                    </div>
                  )}

                  {/* Spacer to push footer down */}
                  <div className="flex-1" />

                  {/* Last played + arrow + delete */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#4a5565] leading-4" style={FONT_REGULAR}>
                        LAST PLAYED
                      </p>
                      <p className="text-sm text-[#0a0a0a] leading-5 mt-1" style={FONT_BLACK}>
                        {player.firstName} {player.lastName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteSave()
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
                        title="Delete save"
                      >
                        <Trash2 className="w-4 h-4 text-[#99a1af] hover:text-red-500" />
                      </motion.button>
                      <ArrowRight className="w-8 h-8 text-black" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── START NEW CAREER CARD (black) ── */}
            <motion.div
              whileHover={{ scale: 1.005 }}
              transition={{ type: 'spring', stiffness: 300 }}
              onClick={onNewCareer}
              className="bg-black border-4 border-black rounded-3xl overflow-hidden relative cursor-pointer"
              style={{ minHeight: 580 }}
            >
              {/* Subtle background image overlay */}
              <div className="absolute inset-0 opacity-10">
                <img
                  src={HERO_IMAGES.mainMenu}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>

              <div className="relative flex flex-col h-full px-12 py-12">
                {/* Badge */}
                <div className="bg-white rounded-full inline-flex items-center gap-2 px-4 py-2 self-start mb-6">
                  <Plus className="w-3 h-3 text-black" />
                  <span
                    className="text-xs text-black tracking-[1.2px] leading-4"
                    style={FONT_BLACK}
                  >
                    NEW GAME
                  </span>
                </div>

                {/* Title */}
                <div className="mb-6" style={FONT_BLACK}>
                  <p className="text-7xl text-white leading-[72px] tracking-[-3.6px]">
                    START
                  </p>
                  <p className="text-7xl text-white leading-[72px] tracking-[-3.6px]">
                    NEW CAREER
                  </p>
                </div>

                {/* Feature cards */}
                <div className="flex flex-col gap-4 flex-1">
                  <div className="bg-white/10 border border-white/20 rounded-2xl px-5 py-4">
                    <p className="text-sm text-white leading-5" style={FONT_BLACK}>
                      BUILD YOUR TEAM
                    </p>
                    <p className="text-xs text-[#99a1af] leading-4 mt-1" style={FONT_REGULAR}>
                      Choose drivers, cars, and crew
                    </p>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-2xl px-5 py-4">
                    <p className="text-sm text-white leading-5" style={FONT_BLACK}>
                      COMPETE GLOBALLY
                    </p>
                    <p className="text-xs text-[#99a1af] leading-4 mt-1" style={FONT_REGULAR}>
                      Race on legendary tracks worldwide
                    </p>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-2xl px-5 py-4">
                    <p className="text-sm text-white leading-5" style={FONT_BLACK}>
                      CLIMB THE RANKS
                    </p>
                    <p className="text-xs text-[#99a1af] leading-4 mt-1" style={FONT_REGULAR}>
                      Become the #1 racing team
                    </p>
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-white tracking-[0.35px] leading-5" style={FONT_BLACK}>
                    BEGIN YOUR JOURNEY
                  </p>
                  <ArrowRight className="w-8 h-8 text-white" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-between px-8 py-6"
        >
          <span className="text-xs text-[#4a5565] leading-4" style={FONT_BLACK}>
            VERSION 1.0
          </span>
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/settings')}
              className="text-base text-[#4a5565] leading-6 hover:text-[#0a0a0a] transition-colors"
              style={FONT_REGULAR}
            >
              SETTINGS
            </button>
            <button
              className="text-base text-[#4a5565] leading-6 hover:text-[#0a0a0a] transition-colors"
              style={FONT_REGULAR}
            >
              CREDITS
            </button>
            <button
              onClick={() => {
                if (window.electron?.closeApp) {
                  window.electron.closeApp()
                } else {
                  window.close()
                }
              }}
              className="text-base text-[#4a5565] leading-6 hover:text-[#0a0a0a] transition-colors"
              style={FONT_REGULAR}
            >
              QUIT
            </button>
          </div>
        </motion.div>
      </div>

      {/* ── DELETE SAVE MODAL ── */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-3xl border-4 border-black overflow-hidden"
            >
              <div className="px-8 py-6 border-b-2 border-black">
                <p className="text-2xl text-[#0a0a0a] leading-8" style={FONT_BLACK}>
                  DELETE SAVE DATA?
                </p>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-start gap-4 p-4 bg-[#fef3c7] border border-[#f59e0b] rounded-2xl">
                  <AlertTriangle className="w-6 h-6 text-[#f59e0b] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-[#0a0a0a]" style={FONT_BLACK}>
                      This cannot be undone!
                    </p>
                    <p className="text-xs text-[#4a5565] mt-1" style={FONT_REGULAR}>
                      Starting a new career will permanently delete your existing save data.
                    </p>
                  </div>
                </div>

                {player && (
                  <div className="p-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl">
                    <p className="text-xs text-[#4a5565] mb-1" style={FONT_REGULAR}>
                      CURRENT SAVE
                    </p>
                    <p className="text-lg text-[#0a0a0a]" style={FONT_BLACK}>
                      {player.firstName} {player.lastName}
                    </p>
                    <p className="text-xs text-[#4a5565] mt-1" style={FONT_REGULAR}>
                      {player.totalRaces} races &middot; {player.totalWins} wins &middot; Rep: {Math.round(player.reputation)}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={onCloseDeleteModal}
                    className="flex-1 py-3 bg-[#f3f4f6] border-2 border-[#e5e7eb] rounded-2xl text-sm text-[#0a0a0a] tracking-wider hover:bg-[#e5e7eb] transition-colors"
                    style={FONT_BLACK}
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={onConfirmDelete}
                    className="flex-1 py-3 bg-red-500 rounded-2xl text-sm text-white tracking-wider hover:bg-red-600 transition-colors"
                    style={FONT_BLACK}
                  >
                    DELETE
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CREATING WORLD MODAL ── */}
      <AnimatePresence>
        {isCreatingWorld && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl border-4 border-black p-10 text-center"
            >
              <div className="relative w-16 h-16 mx-auto mb-4">
                <Globe className="w-16 h-16 text-black animate-pulse" />
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-black/30"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <p className="text-xl text-[#0a0a0a]" style={FONT_BLACK}>
                GENERATING WORLD
              </p>
              <p className="text-sm text-[#4a5565] mt-2" style={FONT_REGULAR}>
                Creating teams, drivers, and championships...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
