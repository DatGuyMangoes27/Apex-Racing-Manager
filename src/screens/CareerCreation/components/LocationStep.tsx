import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  MapPin,
} from 'lucide-react'
import { useCareerCreation } from '../CareerCreationContext'
import {
  getAllLocationPerks,
} from '@/data/owner-backgrounds'

// ============================================
// FIGMA-EXACT LOCATION STEP — CAROUSEL
// Same layout as BackgroundStep: card + details panel
// ============================================

const FONT_BLACK: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FONT_REGULAR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }

// Country-specific gradient backgrounds (flag-inspired)
const COUNTRY_GRADIENTS: Record<string, string> = {
  UK: 'linear-gradient(135deg, #1d2b64 0%, #c02425 50%, #f8cdda 100%)',
  Germany: 'linear-gradient(180deg, #000000 0%, #dd0000 50%, #ffcc00 100%)',
  Italy: 'linear-gradient(180deg, #009246 0%, #ffffff 50%, #ce2b37 100%)',
  USA: 'linear-gradient(135deg, #002868 0%, #bf0a30 60%, #ffffff 100%)',
  Japan: 'linear-gradient(135deg, #ffffff 0%, #ffffff 60%, #bc002d 100%)',
  Brazil: 'linear-gradient(135deg, #009c3b 0%, #ffdf00 50%, #002776 100%)',
  France: 'linear-gradient(90deg, #002395 0%, #ffffff 50%, #ed2939 100%)',
  Netherlands: 'linear-gradient(180deg, #ae1c28 0%, #ffffff 50%, #21468b 100%)',
  Australia: 'linear-gradient(135deg, #00008b 0%, #002b7f 50%, #ff0000 100%)',
}

// Nearby teams for flavour (representative)
const NEARBY_TEAMS: Record<string, string[]> = {
  UK: ['McLaren', 'Williams', 'Aston Martin'],
  Germany: ['Mercedes', 'BMW', 'Audi Sport'],
  Italy: ['Ferrari', 'AlphaTauri', 'Dallara'],
  USA: ['Penske', 'Andretti', 'Chip Ganassi'],
  Japan: ['Toyota', 'Honda', 'Nissan'],
  Brazil: ['Campos Racing', 'Full Time', 'AMattheis'],
  France: ['Alpine', 'Peugeot', 'ORECA'],
  Netherlands: ['Racing Team Nederland', 'Van Amersfoort', 'MP Motorsport'],
  Australia: ['Erebus', 'Triple Eight', 'Dick Johnson'],
}

// Approximate annual base cost per country (flavour data)
const ANNUAL_COSTS: Record<string, string> = {
  UK: '$520K/yr',
  Germany: '$480K/yr',
  Italy: '$380K/yr',
  USA: '$550K/yr',
  Japan: '$460K/yr',
  Brazil: '$280K/yr',
  France: '$420K/yr',
  Netherlands: '$400K/yr',
  Australia: '$450K/yr',
}

export default function LocationStep() {
  const { teamCountry, setTeamCountry, goBack, goForward } = useCareerCreation()
  const locations = useMemo(() => getAllLocationPerks(), [])
  const total = locations.length

  const selectedIndex = locations.findIndex(l => l.country === teamCountry)
  const [currentIndex, setCurrentIndex] = useState(selectedIndex >= 0 ? selectedIndex : 0)

  const currentLoc = locations[currentIndex]

  const navigateTo = useCallback((index: number) => {
    const newIndex = ((index % total) + total) % total
    setCurrentIndex(newIndex)
    setTeamCountry(locations[newIndex].country)
  }, [total, locations, setTeamCountry])

  const goNext = useCallback(() => navigateTo(currentIndex + 1), [currentIndex, navigateTo])
  const goPrev = useCallback(() => navigateTo(currentIndex - 1), [currentIndex, navigateTo])

  // Build perk name labels from effects for display
  const perkItems = useMemo(() => {
    const effects = currentLoc.effects
    const items: { name: string; effect: string }[] = []

    if (effects.engineerQualityBonus) items.push({ name: 'Engineering Talent', effect: `+${effects.engineerQualityBonus}% engineer quality` })
    if (effects.aeroDevBonus) items.push({ name: 'Aero Expertise', effect: `+${effects.aeroDevBonus}% aero development` })
    if (effects.chassisDevBonus) items.push({ name: 'Chassis Development', effect: `+${effects.chassisDevBonus}% chassis dev` })
    if (effects.reliabilityBonus) items.push({ name: 'Reliability Focus', effect: `+${effects.reliabilityBonus}% reliability` })
    if (effects.sponsorPoolBonus) items.push({ name: 'Sponsor Access', effect: `+${effects.sponsorPoolBonus}% sponsor pool` })
    if (effects.fanEngagementBonus) items.push({ name: 'Fan Passion', effect: `+${effects.fanEngagementBonus}% fan engagement` })
    if (effects.mediaCoverageBonus) items.push({ name: 'Media Attention', effect: `+${effects.mediaCoverageBonus}% media coverage` })
    if (effects.investmentAccessBonus) items.push({ name: 'Investment Hub', effect: `+${effects.investmentAccessBonus}% investment access` })

    return items.slice(0, 3)
  }, [currentLoc])

  const gradient = COUNTRY_GRADIENTS[currentLoc.country] || 'linear-gradient(135deg, #374354, #1a2230)'
  const teams = NEARBY_TEAMS[currentLoc.country] || []
  const annualCost = ANNUAL_COSTS[currentLoc.country] || '$400K/yr'

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
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goBack}
            className="w-9 h-9 bg-black rounded-2xl flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </motion.button>
          <div>
            <p className="text-xl text-[#0a0a0a] leading-7 tracking-[-1px]" style={FONT_BLACK}>
              NEW CAREER
            </p>
            <p className="text-[10px] text-[#4a5565] leading-[15px] tracking-[0.25px]" style={FONT_REGULAR}>
              Choose Headquarters
            </p>
          </div>
        </div>
        <p className="text-sm text-[#4a5565] leading-5" style={FONT_REGULAR}>
          {currentIndex + 1} / {total}
        </p>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex items-center justify-center px-12 min-h-0">
        <div
          className="grid gap-8 w-full"
          style={{ maxWidth: 1242, gridTemplateColumns: '1fr 1fr' }}
        >
          {/* ── LEFT: Carousel Card ── */}
          <div className="relative">
            <motion.div
              className="bg-white border border-black rounded-3xl overflow-hidden"
              style={{ boxShadow: '0px 25px 50px -12px rgba(0,0,0,0.25)' }}
            >
              {/* Image / gradient area */}
              <div className="relative overflow-hidden" style={{ height: 420 }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentLoc.id}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0"
                    style={{ background: gradient }}
                  />
                </AnimatePresence>
              </div>

              {/* Info area */}
              <div className="px-6 pt-6 pb-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentLoc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* Country name + pin icon */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-2xl text-[#0a0a0a] leading-[30px]" style={FONT_BLACK}>
                          {currentLoc.country}
                        </p>
                        <p className="text-sm text-[#4a5565] leading-5" style={FONT_REGULAR}>
                          {currentLoc.name}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-[#4a5565] leading-5 mt-2" style={FONT_REGULAR}>
                      {currentLoc.description}
                    </p>

                    {/* Annual cost */}
                    <div
                      className="flex flex-col gap-1 mt-4 pt-4"
                      style={{ borderTop: '0.8px solid rgba(0,0,0,0.2)' }}
                    >
                      <p className="text-[10px] text-[#4a5565] leading-[15px] tracking-[0.25px]" style={FONT_REGULAR}>
                        ANNUAL COST
                      </p>
                      <p className="text-2xl text-[#0a0a0a] leading-8" style={FONT_BLACK}>
                        {annualCost}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Prev/Next arrows */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={goPrev}
              className="absolute bg-black rounded-full flex items-center justify-center"
              style={{
                width: 48, height: 48, left: -24, top: '50%', transform: 'translateY(-50%)',
                boxShadow: '0px 20px 25px 0px rgba(0,0,0,0.1), 0px 8px 10px 0px rgba(0,0,0,0.1)',
              }}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={goNext}
              className="absolute bg-black rounded-full flex items-center justify-center"
              style={{
                width: 48, height: 48, right: -24, top: '50%', transform: 'translateY(-50%)',
                boxShadow: '0px 20px 25px 0px rgba(0,0,0,0.1), 0px 8px 10px 0px rgba(0,0,0,0.1)',
              }}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </motion.button>

            {/* Dot indicators */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {locations.map((loc, idx) => (
                <button
                  key={loc.id}
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
            className="rounded-3xl border border-black overflow-hidden flex flex-col justify-center px-8 py-8"
            style={{ background: 'linear-gradient(131deg, #101828 0%, #000000 100%)' }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentLoc.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-4"
              >
                {/* Hub label */}
                <p className="text-xs text-white/50 tracking-[1.2px] leading-4" style={FONT_REGULAR}>
                  {currentLoc.name}
                </p>

                {/* Location Perks */}
                <div>
                  <p className="text-xs text-white/50 tracking-[1.2px] leading-4 mb-3" style={FONT_REGULAR}>
                    LOCATION PERKS
                  </p>
                  <div className="flex flex-col gap-2">
                    {perkItems.map((perk, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <ChevronRight className="w-4 h-4 text-white/60 mt-0.5 shrink-0" />
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

                {/* Logistics */}
                <div style={{ borderTop: '0.8px solid rgba(255,255,255,0.1)' }} className="pt-4">
                  <p className="text-xs text-white/50 tracking-[1.2px] leading-4 mb-1" style={FONT_REGULAR}>
                    LOGISTICS
                  </p>
                  <p className="text-sm text-white/80 leading-5" style={FONT_REGULAR}>
                    {currentLoc.description}
                  </p>
                </div>

                {/* Nearby Teams */}
                {teams.length > 0 && (
                  <div style={{ borderTop: '0.8px solid rgba(255,255,255,0.1)' }} className="pt-4">
                    <p className="text-xs text-white/50 tracking-[1.2px] leading-4 mb-2" style={FONT_REGULAR}>
                      NEARBY TEAMS
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {teams.map((team) => (
                        <span
                          key={team}
                          className="bg-white/5 text-xs text-white/70 leading-4 px-2 py-1 rounded-lg"
                          style={FONT_REGULAR}
                        >
                          {team}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div
        className="flex items-start shrink-0 pt-6 px-12"
        style={{ height: 98, borderTop: '0.8px solid rgba(0,0,0,0.2)', background: 'white' }}
      >
        <div className="flex items-center justify-between w-full" style={{ maxWidth: 1242, margin: '0 auto' }}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={goBack}
            className="rounded-2xl flex items-center gap-3 px-6 border border-black/20"
            style={{ height: 48 }}
          >
            <ArrowLeft className="w-4 h-4 text-[#0a0a0a]" />
            <span className="text-base text-[#0a0a0a] leading-6" style={FONT_BLACK}>
              BACK
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={goForward}
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
