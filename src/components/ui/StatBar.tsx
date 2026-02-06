import { motion } from 'framer-motion'
import clsx from 'clsx'

interface StatBarProps {
  label: string
  value: number       // 0-100
  maxValue?: number
  showValue?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'red' | 'orange' | 'green' | 'blue' | 'gradient'
  animated?: boolean
}

const colorVariants = {
  red: 'bg-accent-red',
  orange: 'bg-accent-orange',
  green: 'bg-status-success',
  blue: 'bg-status-info',
  gradient: 'bg-gradient-to-r from-accent-red to-accent-orange'
}

const sizeVariants = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3'
}

export function StatBar({ 
  label, 
  value, 
  maxValue = 100, 
  showValue = true,
  size = 'md',
  color = 'gradient',
  animated = true
}: StatBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100))
  
  // Determine color based on value if not specified
  const getAutoColor = () => {
    if (percentage >= 75) return 'green'
    if (percentage >= 50) return 'orange'
    if (percentage >= 25) return 'red'
    return 'red'
  }

  const barColor = color === 'gradient' ? 'gradient' : getAutoColor()

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-text-secondary">{label}</span>
        {showValue && (
          <span className="text-sm font-mono font-medium text-text-primary">
            {Math.round(value)}
          </span>
        )}
      </div>
      <div className={clsx('stat-bar', sizeVariants[size])}>
        <motion.div
          className={clsx('stat-bar-fill', colorVariants[barColor])}
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

// Compact stat display for grids
interface StatBadgeProps {
  label: string
  value: number
  maxValue?: number
  size?: 'sm' | 'md'
}

export function StatBadge({ label, value, maxValue = 100, size = 'md' }: StatBadgeProps) {
  const percentage = (value / maxValue) * 100
  
  const getColor = () => {
    if (percentage >= 75) return 'text-status-success'
    if (percentage >= 50) return 'text-accent-orange'
    return 'text-accent-red'
  }

  return (
    <div className={clsx(
      'flex items-center gap-2 bg-background/50 rounded-lg',
      size === 'sm' ? 'px-2 py-1' : 'px-3 py-2'
    )}>
      <span className={clsx(
        'text-text-muted',
        size === 'sm' ? 'text-xs' : 'text-sm'
      )}>
        {label}
      </span>
      <span className={clsx(
        'font-mono font-bold',
        size === 'sm' ? 'text-sm' : 'text-base',
        getColor()
      )}>
        {Math.round(value)}
      </span>
    </div>
  )
}

// Multi-stat radar style display
interface StatRadarProps {
  stats: { label: string; value: number }[]
  size?: number
}

export function StatRadar({ stats, size = 200 }: StatRadarProps) {
  const center = size / 2
  const radius = (size / 2) - 20
  const angleStep = (2 * Math.PI) / stats.length

  const points = stats.map((stat, i) => {
    const angle = i * angleStep - Math.PI / 2
    const r = (stat.value / 100) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      labelX: center + (radius + 15) * Math.cos(angle),
      labelY: center + (radius + 15) * Math.sin(angle),
      label: stat.label,
      value: stat.value
    }
  })

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  return (
    <svg width={size} height={size} className="overflow-visible">
      {/* Background grid circles */}
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <circle
          key={scale}
          cx={center}
          cy={center}
          r={radius * scale}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.1}
        />
      ))}
      
      {/* Axis lines */}
      {points.map((_p, i) => (
        <line
          key={i}
          x1={center}
          y1={center}
          x2={center + radius * Math.cos(i * angleStep - Math.PI / 2)}
          y2={center + radius * Math.sin(i * angleStep - Math.PI / 2)}
          stroke="currentColor"
          strokeOpacity={0.1}
        />
      ))}
      
      {/* Stat area */}
      <motion.path
        d={pathD}
        fill="url(#statGradient)"
        stroke="#E10600"
        strokeWidth={2}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ transformOrigin: 'center' }}
      />
      
      {/* Labels */}
      {points.map((p, i) => (
        <text
          key={i}
          x={p.labelX}
          y={p.labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs fill-text-muted"
        >
          {p.label}
        </text>
      ))}
      
      {/* Gradient definition */}
      <defs>
        <linearGradient id="statGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E10600" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#FF8000" stopOpacity={0.1} />
        </linearGradient>
      </defs>
    </svg>
  )
}
