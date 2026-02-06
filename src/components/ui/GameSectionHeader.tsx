import { HTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

interface GameSectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  accent?: 'red' | 'orange' | 'blue' | 'gold' | 'default'
  rightElement?: React.ReactNode
}

export function GameSectionHeader({ 
  title, 
  subtitle, 
  accent = 'red', 
  rightElement,
  className,
  ...props 
}: GameSectionHeaderProps) {
  
  const accentColors = {
    red: 'bg-accent-red',
    orange: 'bg-accent-orange',
    blue: 'bg-status-info',
    gold: 'bg-accent-gold',
    default: 'bg-surface-border'
  }

  const textAccentColors = {
    red: 'text-accent-red',
    orange: 'text-accent-orange',
    blue: 'text-status-info',
    gold: 'text-accent-gold',
    default: 'text-text-primary'
  }

  // Parse title to see if it has two parts (space separated) for styling
  // e.g. "DRIVER IDENTITY" -> "DRIVER" (white) "IDENTITY" (colored)
  const titleParts = title.split(' ')
  const firstWord = titleParts[0]
  const restOfTitle = titleParts.slice(1).join(' ')

  return (
    <div className={clsx('flex items-end justify-between mb-6', className)} {...props}>
      <div>
        <div className="flex items-baseline gap-2 mb-1">
          <h2 className="font-display font-black text-4xl italic tracking-wider uppercase leading-none">
            <span className="text-white">{firstWord}</span>
            {restOfTitle && (
              <span className={clsx('ml-2', textAccentColors[accent])}>
                {restOfTitle}
              </span>
            )}
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: 40 }}
            className={clsx('h-1', accentColors[accent])}
          />
          {subtitle && (
            <p className="text-sm font-mono uppercase tracking-widest text-text-muted">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {rightElement && (
        <div className="mb-1">
          {rightElement}
        </div>
      )}
    </div>
  )
}
