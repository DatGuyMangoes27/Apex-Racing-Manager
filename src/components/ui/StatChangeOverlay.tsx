// ============================================
// STAT CHANGE OVERLAY
// ============================================
// Displays floating "+X Reputation", "-$5,000 Team Budget" indicators
// when game stats change, making consequences visible to the player.

import { motion, AnimatePresence } from 'framer-motion'
import { useStatChangeTracker, type StatChange } from '@/hooks/useStatChangeTracker'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatChangeOverlayProps {
  /** How long each indicator stays visible (ms) */
  displayDuration?: number
  /** Maximum number of indicators shown at once */
  maxVisible?: number
}

export function StatChangeOverlay({ 
  displayDuration = 4000,
  maxVisible = 6
}: StatChangeOverlayProps) {
  const { changes, dismissChange } = useStatChangeTracker(displayDuration)
  
  // Only show the most recent changes
  const visibleChanges = changes.slice(-maxVisible)
  
  if (visibleChanges.length === 0) return null
  
  return (
    <div className="fixed top-20 right-6 z-[90] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {visibleChanges.map((change) => (
          <StatChangeIndicator 
            key={change.id} 
            change={change} 
            onDismiss={() => dismissChange(change.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

function StatChangeIndicator({ change, onDismiss }: { change: StatChange; onDismiss: () => void }) {
  const isPositive = change.isPositive
  const sign = change.delta > 0 ? '+' : ''
  
  // Format the delta based on stat type
  const formattedDelta = (() => {
    switch (change.type) {
      case 'cash':
      case 'teamCash':
        return `${sign}$${Math.abs(Math.round(change.delta)).toLocaleString()}`
      case 'reputation':
        return `${sign}${change.delta.toFixed(1)}`
      case 'boardMood':
      case 'sponsorSatisfaction':
        return `${sign}${change.delta.toFixed(0)}%`
      default:
        return `${sign}${change.delta.toFixed(0)}`
    }
  })()
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.9, transition: { duration: 0.3 } }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 30,
        opacity: { duration: 0.2 }
      }}
      onClick={onDismiss}
      className={`
        pointer-events-auto cursor-pointer
        flex items-center gap-2 px-3 py-2 rounded-lg
        backdrop-blur-xl border shadow-lg
        min-w-[180px]
        ${isPositive 
          ? 'bg-status-success/15 border-status-success/40' 
          : 'bg-accent-red/15 border-accent-red/40'
        }
      `}
    >
      {/* Icon */}
      <span className="text-base shrink-0">{change.icon}</span>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-status-success shrink-0" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-accent-red shrink-0" />
          )}
          <span className={`font-mono font-bold text-sm ${change.color}`}>
            {formattedDelta}
          </span>
        </div>
        <span className="text-[10px] text-text-muted uppercase tracking-wider">
          {change.label}
        </span>
      </div>
      
      {/* Fade-out progress bar */}
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 rounded-b-lg ${
          isPositive ? 'bg-status-success/60' : 'bg-accent-red/60'
        }`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 4, ease: 'linear' }}
      />
    </motion.div>
  )
}
