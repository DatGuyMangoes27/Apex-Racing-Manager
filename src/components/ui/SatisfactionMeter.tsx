import { motion } from 'framer-motion'
import { getSatisfactionColor, getSatisfactionLabel, getSatisfactionLevel } from '@/simulation/sponsors'

interface SatisfactionMeterProps {
  satisfaction: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showValue?: boolean
  animated?: boolean
  className?: string
}

/**
 * Visual satisfaction meter component for sponsor deals
 * Shows a color-coded progress bar with optional label and value
 */
export function SatisfactionMeter({
  satisfaction,
  size = 'md',
  showLabel = true,
  showValue = true,
  animated = true,
  className = ''
}: SatisfactionMeterProps) {
  const color = getSatisfactionColor(satisfaction)
  const label = getSatisfactionLabel(satisfaction)
  const level = getSatisfactionLevel(satisfaction)
  
  // Size variants
  const sizes = {
    sm: { height: 'h-1.5', text: 'text-xs', padding: 'p-1' },
    md: { height: 'h-2', text: 'text-sm', padding: 'p-1.5' },
    lg: { height: 'h-3', text: 'text-base', padding: 'p-2' }
  }
  
  const sizeConfig = sizes[size]
  
  // Icon based on satisfaction level
  const getIcon = () => {
    switch (level) {
      case 'excellent':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z" clipRule="evenodd" />
          </svg>
        )
      case 'good':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-3 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-3.536 5.879a1 1 0 011.415-1.415 3 3 0 014.242 0 1 1 0 01-1.415 1.415 1 1 0 00-1.414 0 1 1 0 01-1.414 0 1 1 0 00-1.414 0z" clipRule="evenodd" />
          </svg>
        )
      case 'critical':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
        )
      case 'terminated':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
        )
    }
  }
  
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Header with label and value */}
      {(showLabel || showValue) && (
        <div className={`flex items-center justify-between ${sizeConfig.text}`}>
          {showLabel && (
            <div className="flex items-center gap-1" style={{ color }}>
              {getIcon()}
              <span className="font-medium">{label}</span>
            </div>
          )}
          {showValue && (
            <span className="text-white/70 font-mono">{Math.round(satisfaction)}%</span>
          )}
        </div>
      )}
      
      {/* Progress bar background */}
      <div className={`w-full ${sizeConfig.height} bg-black/40 rounded-full overflow-hidden border border-white/10`}>
        {/* Filled portion */}
        <motion.div
          className={`${sizeConfig.height} rounded-full`}
          style={{ backgroundColor: color }}
          initial={animated ? { width: 0 } : { width: `${satisfaction}%` }}
          animate={{ width: `${satisfaction}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      
      {/* Threshold markers (optional for larger sizes) */}
      {size === 'lg' && (
        <div className="relative w-full h-0">
          <div className="absolute left-[20%] -top-1 w-px h-1 bg-white/30" title="Critical" />
          <div className="absolute left-[40%] -top-1 w-px h-1 bg-white/30" title="Warning" />
          <div className="absolute left-[60%] -top-1 w-px h-1 bg-white/30" title="Good" />
          <div className="absolute left-[80%] -top-1 w-px h-1 bg-white/30" title="Excellent" />
        </div>
      )}
    </div>
  )
}

/**
 * Compact inline satisfaction indicator for tight spaces
 */
export function SatisfactionBadge({ satisfaction }: { satisfaction: number }) {
  const color = getSatisfactionColor(satisfaction)
  const label = getSatisfactionLabel(satisfaction)
  
  return (
    <div 
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ 
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`
      }}
    >
      <div 
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
      <span className="text-white/50 font-mono">{Math.round(satisfaction)}%</span>
    </div>
  )
}

/**
 * Minimal satisfaction dot indicator for table rows
 */
export function SatisfactionDot({ 
  satisfaction, 
  showTooltip = true 
}: { 
  satisfaction: number
  showTooltip?: boolean 
}) {
  const color = getSatisfactionColor(satisfaction)
  const label = getSatisfactionLabel(satisfaction)
  
  return (
    <div 
      className="w-3 h-3 rounded-full cursor-help"
      style={{ backgroundColor: color }}
      title={showTooltip ? `${label} (${Math.round(satisfaction)}%)` : undefined}
    />
  )
}

export default SatisfactionMeter

