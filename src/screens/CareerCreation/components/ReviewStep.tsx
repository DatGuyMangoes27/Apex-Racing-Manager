import { motion } from 'framer-motion'
import {
  Globe,
  Building2 as Building,
  Sparkles,
  Info,
  Key,
  ChevronRight,
} from 'lucide-react'
import { useCareerCreation } from '../CareerCreationContext'
import { formatCurrency } from '@/data/owner-backgrounds'

const FONT_BLACK: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FONT_REGULAR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export default function ReviewStep() {
  const {
    firstName,
    lastName,
    dateOfBirth,
    nationality,
    selectedPortraitPath,
    selectedBackground,
    teamName,
    teamCountry,
    geminiApiKey,
  } = useCareerCreation()

  const dobString = `${dateOfBirth.day} ${MONTHS[dateOfBirth.month - 1]} ${dateOfBirth.year}`

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto px-8 pt-12 pb-24"
    >
      <div className="mb-8">
        <p className="text-3xl text-[#0a0a0a] leading-9 tracking-[-1.5px]" style={FONT_BLACK}>
          REVIEW
        </p>
        <p className="text-sm text-[#4a5565] leading-5 mt-1" style={FONT_REGULAR}>
          Confirm your choices before starting your career.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Manager card */}
        <div className="col-span-1 bg-white border border-black rounded-3xl overflow-hidden">
          <div className="h-1 bg-black" />
          <div className="p-6">
            <div className="text-center mb-5">
              {selectedPortraitPath ? (
                <img
                  src={selectedPortraitPath}
                  alt={`${firstName} ${lastName}`}
                  className="w-20 h-20 mx-auto rounded-2xl object-cover mb-4 border-2 border-black"
                />
              ) : (
                <div
                  className="w-20 h-20 mx-auto rounded-2xl bg-black flex items-center justify-center text-3xl text-white mb-4"
                  style={FONT_BLACK}
                >
                  {firstName[0] || '?'}
                  {lastName[0] || '?'}
                </div>
              )}
              <p className="text-xl text-[#0a0a0a] leading-6" style={FONT_BLACK}>
                {firstName}
              </p>
              <p className="text-2xl text-[#0a0a0a] leading-8 -mt-0.5" style={FONT_BLACK}>
                {lastName}
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Globe className="w-4 h-4 text-[#4a5565]" />
                <span className="text-sm text-[#4a5565]" style={FONT_REGULAR}>{nationality}</span>
              </div>
              <p className="text-xs text-[#4a5565] mt-1" style={FONT_REGULAR}>{dobString}</p>
            </div>

            <div className="space-y-2 text-sm pt-4" style={{ borderTop: '1px solid #e5e7eb' }}>
              {selectedBackground && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[#4a5565]" style={FONT_REGULAR}>Background</span>
                    <span className="text-[#0a0a0a] text-right" style={FONT_BLACK}>
                      {selectedBackground.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4a5565]" style={FONT_REGULAR}>Capital</span>
                    <span className="text-[#0a0a0a]" style={FONT_BLACK}>
                      {formatCurrency(selectedBackground.startingCash)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4a5565]" style={FONT_REGULAR}>Reputation</span>
                    <span className="text-[#0a0a0a]" style={FONT_BLACK}>
                      {selectedBackground.startingReputation}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-[#4a5565]" style={FONT_REGULAR}>Gemini API</span>
                <span className="flex items-center gap-1" style={{ ...FONT_BLACK, color: geminiApiKey.trim() ? '#22c55e' : '#99a1af' }}>
                  <Key className="w-3 h-3" />
                  {geminiApiKey.trim() ? 'Set' : 'Not set'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Team card */}
        <div
          className="col-span-2 rounded-3xl border border-black overflow-hidden"
          style={{ background: 'linear-gradient(131deg, #101828 0%, #000000 100%)' }}
        >
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0">
                <Building className="w-6 h-6 text-black" />
              </div>
              <div>
                <p className="text-xl text-white leading-7" style={FONT_BLACK}>
                  {teamName || 'YOUR TEAM'}
                </p>
                <p className="text-xs text-white/50 leading-4" style={FONT_REGULAR}>
                  {teamCountry}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-white/50 tracking-[1.2px] leading-4 mb-1" style={FONT_REGULAR}>
                    HEADQUARTERS
                  </p>
                  <p className="text-sm text-white leading-5" style={FONT_BLACK}>{teamCountry}</p>
                </div>
                {selectedBackground && (
                  <>
                    <div>
                      <p className="text-xs text-white/50 tracking-[1.2px] leading-4 mb-1" style={FONT_REGULAR}>
                        BOARD MOOD
                      </p>
                      <p className="text-sm text-white leading-5" style={FONT_BLACK}>
                        {selectedBackground.initialBoardMood}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/50 tracking-[1.2px] leading-4 mb-1" style={FONT_REGULAR}>
                        FAN SENTIMENT
                      </p>
                      <p className="text-sm text-white leading-5" style={FONT_BLACK}>
                        {50 + selectedBackground.fanSentimentBonus}%
                      </p>
                    </div>
                  </>
                )}
              </div>

              {selectedBackground && (
                <div>
                  <p className="text-xs text-white/50 tracking-[1.2px] leading-4 mb-3" style={FONT_REGULAR}>
                    YOUR ADVANTAGES
                  </p>
                  <div className="space-y-2">
                    {selectedBackground.perks.map(perk => (
                      <div key={perk.id} className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-white/60 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm text-white leading-5" style={FONT_BLACK}>{perk.name}</p>
                          <p className="text-xs text-white/60 leading-4" style={FONT_REGULAR}>{perk.effect}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedBackground && (
              <div
                className="mt-6 p-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <p className="text-sm text-white/70 italic leading-5" style={FONT_REGULAR}>
                  &ldquo;{selectedBackground.bio}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Your First Steps */}
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-[#4a5565]" />
          <p className="text-sm text-[#0a0a0a]" style={FONT_BLACK}>YOUR FIRST STEPS</p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          {[
            { num: 1, text: 'Visit the marketplace to acquire your first car' },
            { num: 2, text: 'Enter a series that fits your budget and goals' },
            { num: 3, text: 'Assign yourself as driver and prepare for race day' },
          ].map(step => (
            <div key={step.num} className="flex items-start gap-3">
              <span
                className="w-6 h-6 bg-black rounded-full flex items-center justify-center text-xs text-white shrink-0"
                style={FONT_BLACK}
              >
                {step.num}
              </span>
              <p className="text-[#4a5565] leading-5" style={FONT_REGULAR}>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
