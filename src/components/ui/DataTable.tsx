import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

interface Column<T> {
  key: string
  header: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (item: T, index: number) => ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string
  onRowClick?: (item: T) => void
  emptyMessage?: string
  highlightRow?: (item: T) => boolean
  compact?: boolean
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data available',
  highlightRow,
  compact = false
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  'text-text-secondary font-medium text-sm',
                  compact ? 'py-2 px-3' : 'py-3 px-4',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right',
                  col.align !== 'center' && col.align !== 'right' && 'text-left'
                )}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <motion.tr
              key={keyExtractor(item)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => onRowClick?.(item)}
              className={clsx(
                'border-b border-surface-border/50 transition-colors',
                onRowClick && 'cursor-pointer hover:bg-surface/50',
                highlightRow?.(item) && 'bg-accent-red/10'
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={clsx(
                    compact ? 'py-2 px-3' : 'py-3 px-4',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right'
                  )}
                >
                  {col.render 
                    ? col.render(item, index)
                    : String(item[col.key] ?? '')
                  }
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Position badge component for standings
interface PositionBadgeProps {
  position: number
  size?: 'sm' | 'md'
}

export function PositionBadge({ position, size = 'md' }: PositionBadgeProps) {
  const getPositionClass = () => {
    if (position === 1) return 'position-1'
    if (position === 2) return 'position-2'
    if (position === 3) return 'position-3'
    return 'bg-surface-secondary text-text-primary'
  }

  return (
    <span className={clsx(
      'position-badge',
      getPositionClass(),
      size === 'sm' && 'w-6 h-6 text-xs'
    )}>
      {position}
    </span>
  )
}

// Driver name cell with nationality
interface DriverCellProps {
  firstName: string
  lastName: string
  nationality: string
  isPlayer?: boolean
}

export function DriverCell({ firstName, lastName, nationality, isPlayer }: DriverCellProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
        isPlayer 
          ? 'bg-gradient-to-br from-accent-red to-accent-orange text-white'
          : 'bg-surface-secondary text-text-secondary'
      )}>
        {firstName[0]}{lastName[0]}
      </div>
      <div>
        <p className={clsx('font-medium', isPlayer && 'text-accent-red')}>
          {firstName} {lastName}
        </p>
        <p className="text-xs text-text-muted">{nationality}</p>
      </div>
    </div>
  )
}












