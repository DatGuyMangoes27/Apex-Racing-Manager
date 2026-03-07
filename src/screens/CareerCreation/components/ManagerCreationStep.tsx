import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  RefreshCw,
  Key,
} from 'lucide-react'
import { useCareerCreation } from '../CareerCreationContext'
import {
  OWNER_BACKGROUNDS,
  formatCurrency,
  getDifficultyLabel,
} from '@/data/owner-backgrounds'
import type { OwnerBackground } from '@/data/owner-backgrounds'
import { NATIONALITIES } from '@/data/staff-names'
import PortraitPicker from './PortraitPicker'

const FONT_BLACK: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FONT_REGULAR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }

const CONTINENTS: { id: string; label: string; regions: string[] }[] = [
  { id: 'europe', label: 'Europe', regions: ['european'] },
  { id: 'americas', label: 'Americas', regions: ['american', 'brazilian'] },
  { id: 'asia', label: 'Asia', regions: ['asian'] },
  { id: 'africa', label: 'Africa', regions: ['african'] },
  { id: 'middle_east', label: 'Middle East', regions: ['middle_eastern'] },
]

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22c55e',
  medium: '#eab308',
  hard: '#f97316',
  expert: '#ef4444',
}

const FIRST_NAMES = [
  'James', 'Michael', 'David', 'Carlos', 'Pierre', 'Marco', 'Hans', 'Luca',
  'Alexander', 'Sebastian', 'Max', 'Lewis', 'Daniel', 'Charles', 'Oscar', 'Valtteri',
  'Fernando', 'Nico', 'Kimi', 'Felipe', 'Jenson', 'Mika', 'Ayrton', 'Alain',
  'Robert', 'William', 'Thomas', 'Antoine', 'Lorenzo', 'Rafael', 'Erik', 'Viktor',
]
const LAST_NAMES = [
  'Hamilton', 'Verstappen', 'Schumacher', 'Prost', 'Clark', 'Fangio', 'Lauda',
  'Stewart', 'Senna', 'Piquet', 'Mansell', 'Häkkinen', 'Räikkönen', 'Alonso',
  'Vettel', 'Ricciardo', 'Norris', 'Leclerc', 'Russell', 'Sainz', 'Gasly',
  'Tsunoda', 'Ocon', 'Bottas', 'Perez', 'Stroll', 'Magnussen', 'Hulkenberg',
  'Anderson', 'Bennett', 'Crawford', 'Duval', 'Fischer', 'Garcia', 'Johansson',
]

export default function ManagerCreationStep() {
  const {
    firstName,
    lastName,
    dateOfBirth,
    nationality,
    selectedPortraitPath,
    selectedBackgroundId,
    geminiApiKey,
    setFirstName,
    setLastName,
    setDateOfBirth,
    setNationality,
    setSelectedPortraitPath,
    setGeminiApiKey,
  } = useCareerCreation()

  const [selectedContinent, setSelectedContinent] = useState(() => {
    const nat = NATIONALITIES.find(n => n.country === nationality)
    if (nat) {
      const continent = CONTINENTS.find(c => c.regions.includes(nat.region))
      if (continent) return continent.id
    }
    return 'europe'
  })

  const continentCountries = useMemo(() => {
    const continent = CONTINENTS.find(c => c.id === selectedContinent)
    if (!continent) return NATIONALITIES
    return NATIONALITIES.filter(n => continent.regions.includes(n.region))
  }, [selectedContinent])

  const currentBackstory = selectedBackgroundId ? OWNER_BACKGROUNDS[selectedBackgroundId] : null

  const handleAutoGenerate = () => {
    const randomFirst = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
    const randomLast = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
    const randomNat = NATIONALITIES[Math.floor(Math.random() * NATIONALITIES.length)]
    const randomDay = Math.floor(Math.random() * 28) + 1
    const randomMonth = Math.floor(Math.random() * 12) + 1
    const randomYear = 1960 + Math.floor(Math.random() * 40)

    setFirstName(randomFirst)
    setLastName(randomLast)
    setNationality(randomNat.country)
    setDateOfBirth({ day: randomDay, month: randomMonth, year: randomYear })

    const cont = CONTINENTS.find(c => c.regions.includes(randomNat.region))
    if (cont) setSelectedContinent(cont.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-5xl mx-auto px-8 pt-12 pb-24"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-3xl text-[#0a0a0a] leading-9 tracking-[-1.5px]" style={FONT_BLACK}>
            CREATE MANAGER
          </p>
          <p className="text-sm text-[#4a5565] leading-5 mt-1" style={FONT_REGULAR}>
            Define yourself!
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAutoGenerate}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl text-sm text-[#4a5565] transition-colors hover:border-black"
          style={FONT_REGULAR}
        >
          <RefreshCw className="w-4 h-4" />
          Auto Generate
        </motion.button>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* LEFT COLUMN: DETAILS */}
        <div>
          <p className="text-sm text-[#0a0a0a] tracking-[1.2px] leading-4 mb-4 text-center" style={FONT_BLACK}>
            DETAILS
          </p>

          <div className="bg-white border border-black rounded-3xl p-6">
            <div className="space-y-5">
              {/* Name fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-[#4a5565] tracking-[0.25px] leading-[15px] mb-2" style={FONT_REGULAR}>
                    FIRST NAME
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Enter Forename..."
                    className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl text-sm text-[#0a0a0a] focus:outline-none focus:border-black transition-colors"
                    style={FONT_REGULAR}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#4a5565] tracking-[0.25px] leading-[15px] mb-2" style={FONT_REGULAR}>
                    SURNAME
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Enter Surname..."
                    className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl text-sm text-[#0a0a0a] focus:outline-none focus:border-black transition-colors"
                    style={FONT_REGULAR}
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-[10px] text-[#4a5565] tracking-[0.25px] leading-[15px] mb-2" style={FONT_REGULAR}>
                  DATE OF BIRTH
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={dateOfBirth.day}
                    onChange={e => setDateOfBirth({ ...dateOfBirth, day: Number(e.target.value) })}
                    className="px-3 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl text-sm text-[#0a0a0a] focus:outline-none cursor-pointer"
                    style={FONT_REGULAR}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
                    ))}
                  </select>
                  <select
                    value={dateOfBirth.month}
                    onChange={e => setDateOfBirth({ ...dateOfBirth, month: Number(e.target.value) })}
                    className="px-3 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl text-sm text-[#0a0a0a] focus:outline-none cursor-pointer"
                    style={FONT_REGULAR}
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={dateOfBirth.year}
                    onChange={e => setDateOfBirth({ ...dateOfBirth, year: Number(e.target.value) })}
                    className="px-3 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl text-sm text-[#0a0a0a] focus:outline-none cursor-pointer"
                    style={FONT_REGULAR}
                  >
                    {Array.from({ length: 50 }, (_, i) => 1955 + i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Continent */}
              <div>
                <label className="block text-[10px] text-[#4a5565] tracking-[0.25px] leading-[15px] mb-2" style={FONT_REGULAR}>
                  CONTINENT
                </label>
                <select
                  value={selectedContinent}
                  onChange={e => setSelectedContinent(e.target.value)}
                  className="w-full px-3 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl text-sm text-[#0a0a0a] focus:outline-none cursor-pointer"
                  style={FONT_REGULAR}
                >
                  {CONTINENTS.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Country list */}
              <div>
                <label className="block text-[10px] text-[#4a5565] tracking-[0.25px] leading-[15px] mb-2" style={FONT_REGULAR}>
                  COUNTRY
                </label>
                <div className="max-h-48 overflow-y-auto bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl">
                  {continentCountries.map(nat => {
                    const isSelected = nationality === nat.country
                    return (
                      <div
                        key={nat.country}
                        onClick={() => setNationality(nat.country)}
                        className="px-4 py-2 cursor-pointer text-sm transition-colors"
                        style={{
                          background: isSelected ? '#000' : 'transparent',
                          color: isSelected ? '#fff' : '#4a5565',
                          fontWeight: isSelected ? 700 : 400,
                          ...FONT_REGULAR,
                        }}
                      >
                        {nat.country}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Gemini API Key */}
          <div className="bg-white border border-[#e5e7eb] rounded-3xl p-5 mt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-[#f0fdf4] rounded-xl flex items-center justify-center border border-[#dcfce7]">
                <Key className="w-4 h-4 text-[#22c55e]" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-[#0a0a0a]" style={FONT_BLACK}>
                  Gemini API Key
                </p>
                <p className="text-[10px] text-[#4a5565]" style={FONT_REGULAR}>
                  Optional — enables AI commentary &amp; dialogue
                </p>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded-lg bg-[#f9fafb] border border-[#e5e7eb] text-[#4a5565]"
                style={FONT_REGULAR}
              >
                Optional
              </span>
            </div>
            <input
              type="password"
              value={geminiApiKey}
              onChange={e => setGeminiApiKey(e.target.value)}
              placeholder="Enter your Gemini API key..."
              className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl text-sm text-[#0a0a0a] focus:outline-none focus:border-black transition-colors"
              style={FONT_REGULAR}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: APPEARANCE + BACKSTORY */}
        <div>
          <p className="text-sm text-[#0a0a0a] tracking-[1.2px] leading-4 mb-4 text-center" style={FONT_BLACK}>
            APPEARANCE
          </p>

          {/* Portrait Picker */}
          <div className="bg-white border border-black rounded-3xl p-6 mb-6">
            <PortraitPicker
              selectedPortraitPath={selectedPortraitPath}
              onSelect={setSelectedPortraitPath}
            />
          </div>

          {/* Backstory display */}
          <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6">
            <p className="text-[10px] text-[#4a5565] tracking-[0.25px] leading-[15px] mb-3" style={FONT_REGULAR}>
              BACKSTORY
            </p>
            {currentBackstory && <BackstoryDisplay background={currentBackstory} />}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function BackstoryDisplay({ background }: { background: OwnerBackground }) {
  const diffColor = DIFFICULTY_COLORS[background.difficulty] || '#4a5565'

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#4a5565] leading-5" style={FONT_REGULAR}>
        {background.description}
      </p>

      <div className="space-y-2">
        {background.perks.map(perk => (
          <div key={perk.id} className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-black mt-2 shrink-0" />
            <div>
              <span className="text-xs text-[#0a0a0a]" style={FONT_BLACK}>{perk.name}</span>
              <span className="text-xs text-[#4a5565] ml-1.5" style={FONT_REGULAR}>{perk.effect}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <span
          className="text-xs px-3 py-1 rounded-lg bg-[#f0fdf4] text-[#22c55e] border border-[#dcfce7]"
          style={FONT_BLACK}
        >
          {formatCurrency(background.startingCash)}
        </span>
        <span
          className="text-xs px-3 py-1 rounded-lg bg-[#f9fafb] text-[#0a0a0a] border border-[#e5e7eb]"
          style={FONT_BLACK}
        >
          Rep: {background.startingReputation}
        </span>
        <span
          className="text-xs px-3 py-1 rounded-lg border border-[#e5e7eb]"
          style={{ ...FONT_BLACK, color: diffColor, backgroundColor: `${diffColor}10` }}
        >
          {getDifficultyLabel(background.difficulty)}
        </span>
      </div>
    </div>
  )
}
