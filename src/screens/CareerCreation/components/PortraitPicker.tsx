import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Check } from 'lucide-react'

const FONT_BLACK: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FONT_REGULAR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }

const PORTRAIT_COUNT = 100
const PORTRAITS_PER_PAGE = 18

function getPortraitPath(index: number): string {
  const padded = String(index).padStart(4, '0')
  return `/images/generated/contacts/contact-contact-${padded}.png`
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

interface PortraitPickerProps {
  selectedPortraitPath: string | null
  onSelect: (path: string) => void
}

export default function PortraitPicker({ selectedPortraitPath, onSelect }: PortraitPickerProps) {
  const [seed, setSeed] = useState(0)
  const portraits = useMemo(() => {
    const indices = Array.from({ length: PORTRAIT_COUNT }, (_, i) => i)
    return shuffleArray(indices).slice(0, PORTRAITS_PER_PAGE).map(getPortraitPath)
  }, [seed])

  const handleShuffle = () => {
    setSeed(s => s + 1)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] text-[#4a5565] tracking-[0.25px] leading-[15px]" style={FONT_REGULAR}>
          SELECT PORTRAIT
        </p>
        <button
          onClick={handleShuffle}
          className="flex items-center gap-1.5 text-[11px] text-[#4a5565] hover:text-black transition-colors"
          style={FONT_REGULAR}
        >
          <RefreshCw className="w-3 h-3" />
          Shuffle
        </button>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {portraits.map((path, idx) => {
          const isSelected = selectedPortraitPath === path
          return (
            <motion.button
              key={`${seed}-${idx}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.02, duration: 0.2 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(path)}
              className="relative aspect-square rounded-xl overflow-hidden transition-all"
              style={{
                outline: isSelected ? '2px solid #000' : '1px solid #e5e7eb',
                outlineOffset: isSelected ? 2 : 0,
              }}
            >
              <img
                src={path}
                alt={`Portrait ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 bg-black/20 flex items-center justify-center"
                >
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Large preview of selected */}
      {selectedPortraitPath && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-3"
        >
          <img
            src={selectedPortraitPath}
            alt="Selected portrait"
            className="w-16 h-16 rounded-xl object-cover"
            style={{ outline: '2px solid #000', outlineOffset: 2 }}
          />
          <span className="text-xs text-[#4a5565]" style={FONT_REGULAR}>Selected portrait</span>
        </motion.div>
      )}
    </div>
  )
}
