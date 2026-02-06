import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { HelpModal } from './HelpModal'
import { getHelpForScreen } from './helpContent'
import { useLocation } from 'react-router-dom'

interface HelpButtonProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  screenOverride?: string // Force specific help content
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12'
}

const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24
}

export function HelpButton({ className = '', size = 'md', screenOverride }: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  
  const helpContent = getHelpForScreen(screenOverride || location.pathname)
  
  if (!helpContent) return null

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`
          ${sizeClasses[size]}
          flex items-center justify-center
          bg-surface-secondary/80 hover:bg-surface-secondary
          border border-surface-border hover:border-accent-orange/50
          rounded-full
          text-text-muted hover:text-accent-orange
          transition-all duration-200
          backdrop-blur-sm
          ${className}
        `}
        title="Help"
        aria-label="Open help"
      >
        <HelpCircle size={iconSizes[size]} />
      </motion.button>
      
      <HelpModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        content={helpContent}
      />
    </>
  )
}

// Floating help button for corner positioning
export function FloatingHelpButton({ screenOverride }: { screenOverride?: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <HelpButton size="lg" screenOverride={screenOverride} />
    </div>
  )
}
