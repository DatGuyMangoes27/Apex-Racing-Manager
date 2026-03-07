import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'

export interface CardHeaderProps {
  title?: string
  subtitle?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
  children?: ReactNode
}

const paddingMap: Record<string, string> = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
}

export function Card({ className = '', children, padding, variant, hoverable, ...props }: HTMLAttributes<HTMLDivElement> & { variant?: string; padding?: string; hoverable?: boolean }) {
  const paddingClass = padding ? paddingMap[padding] ?? '' : ''
  const hoverClass = hoverable ? 'hover:border-accent-blue/40 transition-colors' : ''
  return (
    <div className={`bg-surface rounded-xl border border-border ${paddingClass} ${hoverClass} ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, icon, action, className = '', children }: CardHeaderProps) {
  return (
    <div className={`px-4 py-3 border-b border-border flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-2">
        {icon && <span className="text-text-muted">{icon}</span>}
        <div>
          {title && <h3 className="text-sm font-semibold text-text-primary">{title}</h3>}
          {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
      {children}
    </div>
  )
}

export function CardContent({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-4 py-3 border-t border-border ${className}`} {...props}>
      {children}
    </div>
  )
}
