import { motion } from 'framer-motion'
import { Building2 as Building, MapPin } from 'lucide-react'
import { useCareerCreation } from '../CareerCreationContext'
import { getLocationPerk } from '@/data/owner-backgrounds'

const FONT_BLACK: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FONT_REGULAR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }

export default function TeamIdentityStep() {
  const { teamName, setTeamName, teamCountry } = useCareerCreation()
  const locationPerk = getLocationPerk(teamCountry)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto px-8 pt-12 pb-24"
    >
      <div className="mb-8">
        <p className="text-3xl text-[#0a0a0a] leading-9 tracking-[-1.5px]" style={FONT_BLACK}>
          TEAM IDENTITY
        </p>
        <p className="text-sm text-[#4a5565] leading-5 mt-1" style={FONT_REGULAR}>
          Name your racing operation. This is how you'll be known in the paddock.
        </p>
      </div>

      <div className="bg-white border border-black rounded-3xl p-8">
        {/* Icon + heading */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shrink-0">
            <Building className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-lg text-[#0a0a0a] leading-6" style={FONT_BLACK}>
              YOUR TEAM
            </p>
            <p className="text-sm text-[#4a5565] leading-5" style={FONT_REGULAR}>
              Establish your racing operation
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Team Name */}
          <div>
            <label
              className="block text-[10px] text-[#4a5565] tracking-[0.25px] leading-[15px] mb-2"
              style={FONT_REGULAR}
            >
              TEAM NAME
            </label>
            <input
              type="text"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="e.g. Phoenix Racing"
              className="w-full px-5 py-3.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl text-base text-[#0a0a0a] focus:outline-none focus:border-black transition-colors"
              style={FONT_REGULAR}
            />
          </div>

          {/* Team HQ info */}
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl p-5">
            <p
              className="text-[10px] text-[#4a5565] tracking-[0.25px] leading-[15px] mb-2"
              style={FONT_REGULAR}
            >
              TEAM HEADQUARTERS
            </p>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#4a5565]" />
              <p className="text-base text-[#0a0a0a] leading-6" style={FONT_BLACK}>
                {teamCountry}
              </p>
            </div>
            <p className="text-xs text-[#4a5565] leading-4 mt-1" style={FONT_REGULAR}>
              {locationPerk.name}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
