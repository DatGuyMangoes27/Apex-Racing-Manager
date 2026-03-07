import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, PenTool, ChevronRight, Flag, Trophy, Wrench, Palette, Tag } from 'lucide-react'
import { useCareerCreation } from '../CareerCreationContext'

const CARD_DATA = [
  {
    mode: 'choose_team' as const,
    title: 'CHOOSE TEAM',
    image: '/images/generated/scenes/hero-paddock.jpg',
    description: 'Take the reins at one of the existing teams in the world of motorsport.',
    icon: Users,
    features: [
      { icon: Trophy, text: 'Inherit team history & reputation' },
      { icon: Flag, text: 'Real AMS2 liveries & drivers' },
      { icon: Wrench, text: 'Existing budget & facilities' },
    ],
    accentColor: '#E10600',
  },
  {
    mode: 'create_team' as const,
    title: 'CREATE TEAM',
    image: '/images/generated/scenes/hero-garage.jpg',
    description: 'The logo, the colours, the name... create and then bring your team through the ranks.',
    icon: PenTool,
    badge: 'FREE',
    features: [
      { icon: Palette, text: 'Design your team identity' },
      { icon: Tag, text: 'Choose your backstory & perks' },
      { icon: Flag, text: 'Pick your HQ location' },
    ],
    accentColor: '#FF8000',
  },
] as const

export default function TeamTypeSelection() {
  const { setFlowMode } = useCareerCreation()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: '#1a2230' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 pt-10 pb-6 text-center"
      >
        <h1
          className="text-4xl tracking-widest uppercase mb-2"
          style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, color: '#e8edf3' }}
        >
          Team Type
        </h1>
        <p
          className="text-sm tracking-wide"
          style={{ color: '#6a7a8a', fontFamily: 'Rajdhani, sans-serif' }}
        >
          Will you take charge of an existing team, or create your own?
        </p>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mx-auto mt-4 h-px w-32"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(225,6,0,0.5), transparent)' }}
        />
      </motion.div>

      {/* Cards */}
      <div className="flex-1 flex items-center justify-center px-8 pb-24 relative z-10">
        <div className="grid grid-cols-2 gap-8 max-w-5xl w-full">
          {CARD_DATA.map((card, index) => {
            const isHovered = hoveredCard === card.mode
            const Icon = card.icon

            return (
              <motion.div
                key={card.mode}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.15, duration: 0.6 }}
                onMouseEnter={() => setHoveredCard(card.mode)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => setFlowMode(card.mode)}
                className="group relative cursor-pointer"
              >
                <motion.div
                  animate={{ scale: isHovered ? 1.02 : 1, y: isHovered ? -4 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="relative rounded overflow-hidden"
                  style={{
                    background: 'linear-gradient(to bottom, #374354, #2a3442)',
                    border: isHovered ? `1px solid ${card.accentColor}60` : '1px solid #3a4a5e',
                    boxShadow: isHovered
                      ? `0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px ${card.accentColor}30`
                      : '0 4px 20px rgba(0,0,0,0.3)',
                  }}
                >
                  {/* Image area */}
                  <div className="relative h-56 overflow-hidden">
                    <motion.img
                      src={card.image}
                      alt={card.title}
                      className="w-full h-full object-cover"
                      animate={{ scale: isHovered ? 1.08 : 1 }}
                      transition={{ duration: 0.7 }}
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(to top, #2a3442 0%, #2a344280 40%, transparent 100%)',
                      }}
                    />

                    {/* Accent top bar */}
                    <motion.div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ background: card.accentColor }}
                      initial={{ scaleX: 0, transformOrigin: 'left' }}
                      animate={{ scaleX: isHovered ? 1 : 0.3 }}
                      transition={{ duration: 0.4 }}
                    />

                    {/* Badge */}
                    {card.badge && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.6, type: 'spring', stiffness: 400 }}
                        className="absolute top-4 right-4 px-3 py-1 rounded text-sm tracking-wider"
                        style={{
                          background: '#FFD700',
                          color: '#0d1520',
                          fontFamily: 'Rajdhani, sans-serif',
                          fontWeight: 700,
                        }}
                      >
                        {card.badge}
                      </motion.div>
                    )}

                    {/* Title overlaid on image */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded flex items-center justify-center"
                          style={{
                            background: `${card.accentColor}20`,
                            border: `1px solid ${card.accentColor}40`,
                          }}
                        >
                          <Icon className="w-5 h-5" style={{ color: card.accentColor }} />
                        </div>
                        <h2
                          className="text-2xl tracking-wider uppercase"
                          style={{
                            fontFamily: 'Rajdhani, sans-serif',
                            fontWeight: 800,
                            color: '#e8edf3',
                            textShadow: '0 2px 20px rgba(0,0,0,0.8)',
                          }}
                        >
                          {card.title}
                        </h2>
                      </div>
                    </div>
                  </div>

                  {/* Content area */}
                  <div className="p-6 pt-4">
                    <p className="text-sm leading-relaxed mb-5" style={{ color: '#8a9ab0' }}>
                      {card.description}
                    </p>

                    {/* Feature list */}
                    <div className="space-y-2.5 mb-6">
                      {card.features.map((feature, fi) => {
                        const FeatureIcon = feature.icon
                        return (
                          <motion.div
                            key={fi}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.15 + fi * 0.08 }}
                            className="flex items-center gap-3"
                          >
                            <div
                              className="w-1 h-1 rounded-full flex-shrink-0"
                              style={{ background: card.accentColor }}
                            />
                            <FeatureIcon
                              className="w-3.5 h-3.5 flex-shrink-0"
                              style={{ color: `${card.accentColor}99` }}
                            />
                            <span className="text-xs tracking-wide" style={{ color: '#7a8a9a' }}>
                              {feature.text}
                            </span>
                          </motion.div>
                        )
                      })}
                    </div>

                    {/* Select button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 rounded text-sm tracking-widest uppercase flex items-center justify-center gap-2"
                      style={{
                        fontFamily: 'Rajdhani, sans-serif',
                        fontWeight: 700,
                        background: isHovered
                          ? `linear-gradient(135deg, ${card.accentColor}, ${card.accentColor}CC)`
                          : `${card.accentColor}15`,
                        color: isHovered ? '#fff' : card.accentColor,
                        border: `1px solid ${card.accentColor}${isHovered ? '80' : '30'}`,
                        boxShadow: isHovered ? `0 4px 20px ${card.accentColor}40` : 'none',
                      }}
                    >
                      Select
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
