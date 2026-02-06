import clsx from 'clsx'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Progress({ value, max = 100, className, color, size = 'md' }: ProgressProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))
  
  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  }

  return (
    <div className={clsx('w-full bg-surface-secondary rounded-full overflow-hidden', sizeStyles[size], className)}>
      <div
        className={clsx('h-full rounded-full transition-all duration-300', color || 'bg-accent-red')}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
