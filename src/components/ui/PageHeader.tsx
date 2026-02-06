import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, icon, actions, className }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx('flex items-start justify-between mb-6', className)}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-red to-accent-orange flex items-center justify-center text-white">
            {icon}
          </div>
        )}
        <div>
          <h1 className="font-display font-bold text-2xl tracking-wide">{title}</h1>
          {subtitle && (
            <p className="text-text-muted mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </motion.div>
  )
}

// Section header for card sections
interface SectionHeaderProps {
  title: string
  action?: ReactNode
  className?: string
}

export function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <div className={clsx('flex items-center justify-between mb-4', className)}>
      <h3 className="font-display font-semibold text-lg tracking-wide">{title}</h3>
      {action}
    </div>
  )
}












