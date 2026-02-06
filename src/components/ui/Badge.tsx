import clsx from 'clsx'

export type BadgeVariant = 'default' | 'red' | 'orange' | 'green' | 'blue' | 'purple' | 'outline' | 'gold' | 'yellow' | 'secondary' | 'destructive' | 'warning' | 'danger' | 'success' | 'info' | 'error' | 'gray'
export type BadgeSize = 'sm' | 'md' | 'lg' | 'xs'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-secondary text-text-secondary',
  red: 'bg-accent-red/20 text-accent-red border border-accent-red/30',
  orange: 'bg-accent-orange/20 text-accent-orange border border-accent-orange/30',
  green: 'bg-status-success/20 text-status-success border border-status-success/30',
  blue: 'bg-status-info/20 text-status-info border border-status-info/30',
  purple: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  outline: 'bg-transparent text-text-secondary border border-surface-border',
  gold: 'bg-accent-gold/20 text-accent-gold border border-accent-gold/30',
  yellow: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  secondary: 'bg-surface-secondary text-text-secondary border border-surface-border',
  destructive: 'bg-status-danger/20 text-status-danger border border-status-danger/30',
  warning: 'bg-accent-orange/20 text-accent-orange border border-accent-orange/30',
  danger: 'bg-status-danger/20 text-status-danger border border-status-danger/30',
  success: 'bg-status-success/20 text-status-success border border-status-success/30',
  info: 'bg-status-info/20 text-status-info border border-status-info/30',
  error: 'bg-status-danger/20 text-status-danger border border-status-danger/30',
  gray: 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
}

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base'
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center font-medium rounded-full',
      variantStyles[variant],
      sizeStyles[size],
      className
    )}>
      {children}
    </span>
  )
}

// Specialized status badge
type StatusType = 'active' | 'inactive' | 'pending' | 'expired' | 'injured'

interface StatusBadgeProps {
  status: StatusType
  label?: string
}

const statusConfig: Record<StatusType, { color: BadgeVariant; defaultLabel: string }> = {
  active: { color: 'green', defaultLabel: 'Active' },
  inactive: { color: 'default', defaultLabel: 'Inactive' },
  pending: { color: 'orange', defaultLabel: 'Pending' },
  expired: { color: 'red', defaultLabel: 'Expired' },
  injured: { color: 'red', defaultLabel: 'Injured' }
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <Badge variant={config.color} size="sm">
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {label || config.defaultLabel}
    </Badge>
  )
}


