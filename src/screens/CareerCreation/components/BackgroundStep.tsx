import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ChevronRight as ChevronRightSmall,
} from 'lucide-react'
import { useCareerCreation } from '../CareerCreationContext'
import {
  getAllOwnerBackgrounds,
  OWNER_BACKGROUNDS,
  formatCurrency,
} from '@/data/owner-backgrounds'
import type { OwnerBackground } from '@/data/owner-backgrounds'
import { getOwnerBackgroundImage } from '@/data/stock-images'

// ============================================
// FIGMA-EXACT BACKGROUND SELECTION — CAROUSEL
// White/black theme · Arial Black · carousel card + details panel
// ============================================

const FONT_BLACK: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FONT_REGULAR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }

interface BackgroundStepProps {
  onBackToMenu?: () => void
}

export default function BackgroundStep({ onBackToMenu }: BackgroundStepProps) {
  const { selectedBackgroundId, setSelectedBackgroundId, goForward } = useCareerCreation()
  const backgrounds = getAllOwnerBackgrounds()
  const total = backgrounds.length

  // Find current index from selected background, default to 0
  const selectedIndex = backgrounds.findIndex(bg => bg.id === selectedBackgroundId)
  const [currentIndex, setCurrentIndex] = useState(selectedIndex >= 0 ? selectedIndex : 0)

  const currentBg = backgrounds[currentIndex]

  // Auto-select background when navigating
  const navigateTo = useCallback((index: number) => {
    const newIndex = ((index % total) + total) % total
    setCurrentIndex(newIndex)
    setSelectedBackgroundId(backgrounds[newIndex].id)
  }, [total, backgrounds, setSelectedBackgroundId])

  const goNext = useCallback(() => navigateTo(currentIndex + 1), [currentIndex, navigateTo])
  const goPrev = useCallback(() => navigateTo(currentIndex - 1), [currentIndex, navigateTo])

  // Ensure something is selected on mount
  if (!selectedBackgroundId && backgrounds.length > 0) {
    setSelectedBackgroundId(backgrounds[0].id)
  }

  const bgImage = getOwnerBackgroundImage(currentBg.id)

  // Build connections list from background data
  const connections: string[] = []
  if (currentBg.hasCorporateNetwork) connections.push('Corporate network')
  if (currentBg.hasGrassrootsSupport) connections.push('Grassroots community')
  if (currentBg.hasPaddockRespect) connections.push('Paddock respect')
  if (currentBg.hasMediaConnections) connections.push('Media connections')
  if (currentBg.hasTechPartners) connections.push('Tech industry partners')
  if (currentBg.manufacturerConnections && currentBg.manufacturerConnections.length > 0) {
    connections.push(`${currentBg.manufacturerConnections.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ')} relations`)
  }
  if (connections.length === 0) {
    connections.push('No special connections')
  }

  const handleContinue = () => {
    if (!selectedBackgroundId) {
      setSelectedBackgroundId(backgrounds[currentIndex].id)
    }
    goForward()
  }

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(144deg, #f9fafb 0%, #ffffff 50%, #f3f4f6 100%)',
      }}
    >
      {/* ── TOP HEADER BAR ── */}
      <div
        className="flex items-center justify-between px-6 shrink-0"
        style={{ height: 92, borderBottom: '0.8px solid rgba(0,0,0,0.2)' }}
      >
        {/* Left: Back + Title */}
        <div className="flex items-center gap-3">
          {onBackToMenu && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBackToMenu}
              className="w-9 h-9 bg-black rounded-2xl flex items-center justify-center shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </motion.button>
          )}
          <div>
            <p
              className="text-xl text-[#0a0a0a] leading-7 tracking-[-1px]"
              style={FONT_BLACK}
            >
              NEW CAREER
            </p>
            <p
              className="text-[10px] text-[#4a5565] leading-[15px] tracking-[0.25px]"
              style={FONT_REGULAR}
            >
              Choose Background
            </p>
          </div>
        </div>

        {/* Right: Page counter */}
        <p className="text-sm text-[#4a5565] leading-5" style={FONT_REGULAR}>
          {currentIndex + 1} / {total}
        </p>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex items-center justify-center px-12 min-h-0">
        <div
          className="grid gap-8 w-full"
          style={{ maxWidth: 1236, gridTemplateColumns: '1fr 1fr' }}
        >
          {/* ── LEFT: Carousel Card ── */}
          <div className="relative">
            {/* Main card */}
            <motion.div
              className="bg-white border border-black rounded-3xl overflow-hidden"
              style={{
                boxShadow: '0px 25px 50px -12px rgba(0,0,0,0.25)',
              }}
            >
              {/* Image area */}
              <div className="relative bg-[#f3f4f6] overflow-hidden" style={{ height: 420 }}>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentBg.id}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    src={bgImage}
                    alt={currentBg.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </AnimatePresence>
              </div>

              {/* Info area */}
              <div className="px-6 pt-6 pb-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentBg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p
                      className="text-2xl text-[#0a0a0a] leading-[30px]"
                      style={FONT_BLACK}
                    >
                      {currentBg.name.toUpperCase()}
                    </p>
                    <p
                      className="text-sm text-[#4a5565] leading-5 mt-2"
                      style={FONT_REGULAR}
                    >
                      {currentBg.description}
                    </p>

                    {/* Capital / Reputation row */}
                    <div
                      className="flex items-center justify-between mt-4 pt-4"
                      style={{ borderTop: '0.8px solid rgba(0,0,0,0.2)' }}
                    >
                      <div>
                        <p
                          className="text-[10px] text-[#4a5565] leading-[15px] tracking-[0.25px]"
                          style={FONT_REGULAR}
                        >
                          CAPITAL
                        </p>
                        <p className="text-2xl text-[#0a0a0a] leading-8" style={FONT_BLACK}>
                          {formatCurrency(currentBg.startingCash)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-[10px] text-[#4a5565] leading-[15px] tracking-[0.25px]"
                          style={FONT_REGULAR}
                        >
                          REPUTATION
                        </p>
                        <p className="text-2xl text-[#0a0a0a] leading-8" style={FONT_BLACK}>
                          {currentBg.startingReputation}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Prev / Next arrows */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={goPrev}
              className="absolute bg-black rounded-full flex items-center justify-center shadow-xl"
              style={{
                width: 48,
                height: 48,
                left: -24,
                top: '50%',
                transform: 'translateY(-50%)',
                boxShadow: '0px 20px 25px 0px rgba(0,0,0,0.1), 0px 8px 10px 0px rgba(0,0,0,0.1)',
              }}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={goNext}
              className="absolute bg-black rounded-full flex items-center justify-center shadow-xl"
              style={{
                width: 48,
                height: 48,
                right: -24,
                top: '50%',
                transform: 'translateY(-50%)',
                boxShadow: '0px 20px 25px 0px rgba(0,0,0,0.1), 0px 8px 10px 0px rgba(0,0,0,0.1)',
              }}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </motion.button>

            {/* Dot indicators */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {backgrounds.map((bg, idx) => (
                <button
                  key={bg.id}
                  onClick={() => navigateTo(idx)}
                  className="transition-all duration-300"
                  style={{
                    width: idx === currentIndex ? 32 : 8,
                    height: 8,
                    borderRadius: 9999,
                    backgroundColor: idx === currentIndex ? '#000' : 'rgba(0,0,0,0.2)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── RIGHT: Details Panel ── */}
          <div
            className="rounded-3xl border border-black overflow-hidden flex flex-col justify-center"
            style={{
              background: 'linear-gradient(132deg, #101828 0%, #000000 100%)',
              paddingLeft: 32,
              paddingRight: 32,
              paddingTop: 32,
              paddingBottom: 32,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentBg.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-6"
              >
                {/* Perks section */}
                <div>
                  <p
                    className="text-xs text-white/50 tracking-[1.2px] leading-4 mb-3"
                    style={FONT_REGULAR}
                  >
                    PERKS
                  </p>
                  <div className="flex flex-col gap-2">
                    {currentBg.perks.map((perk) => (
                      <div key={perk.id} className="flex items-start gap-3">
                        <ChevronRightSmall className="w-4 h-4 text-white/60 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm text-white leading-5" style={FONT_BLACK}>
                            {perk.name}
                          </p>
                          <p className="text-xs text-white/60 leading-4" style={FONT_REGULAR}>
                            {perk.effect}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ borderTop: '0.8px solid rgba(255,255,255,0.1)' }} />

                {/* Connections section */}
                <div>
                  <p
                    className="text-xs text-white/50 tracking-[1.2px] leading-4 mb-3"
                    style={FONT_REGULAR}
                  >
                    CONNECTIONS
                  </p>
                  <div className="flex flex-col gap-2">
                    {connections.map((conn, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <ChevronRightSmall className="w-4 h-4 text-white/60 shrink-0" />
                        <p className="text-sm text-white/80 leading-5" style={FONT_REGULAR}>
                          {conn}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div
        className="flex flex-col items-start shrink-0 pt-6 px-12"
        style={{ height: 97, borderTop: '0.8px solid rgba(0,0,0,0.2)', background: 'white' }}
      >
        <div className="flex items-center justify-end w-full" style={{ maxWidth: 1236, margin: '0 auto' }}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleContinue}
            className="bg-black rounded-2xl flex items-center gap-3 px-8"
            style={{ height: 48 }}
          >
            <span className="text-base text-white leading-6" style={FONT_BLACK}>
              CONTINUE
            </span>
            <ArrowRight className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
