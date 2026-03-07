import { DollarSign } from 'lucide-react'

interface UpcomingCostsWidgetProps {
  costs?: Array<{ label: string; amount: number }>
  className?: string
}

export function UpcomingCostsWidget({ costs = [], className = '' }: UpcomingCostsWidgetProps) {
  const total = costs.reduce((sum, c) => sum + c.amount, 0)

  return (
    <div className={`bg-surface rounded-lg p-3 border border-border ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-muted font-medium">Upcoming Costs</span>
        <DollarSign className="w-4 h-4 text-text-muted" />
      </div>
      {costs.length === 0 ? (
        <p className="text-xs text-text-muted">No upcoming costs</p>
      ) : (
        <>
          {costs.slice(0, 3).map((c, i) => (
            <div key={i} className="flex justify-between text-xs py-1">
              <span className="text-text-secondary">{c.label}</span>
              <span className="text-text-primary font-medium">${c.amount.toLocaleString()}</span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-border flex justify-between text-xs font-bold">
            <span className="text-text-muted">Total</span>
            <span className="text-text-primary">${total.toLocaleString()}</span>
          </div>
        </>
      )}
    </div>
  )
}
