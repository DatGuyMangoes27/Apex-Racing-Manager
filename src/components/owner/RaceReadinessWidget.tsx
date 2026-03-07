import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

interface RaceReadinessWidgetProps {
  readiness?: number
  nextRace?: string
  issues?: string[]
  className?: string
}

export function RaceReadinessWidget({ readiness = 75, nextRace, issues = [], className = '' }: RaceReadinessWidgetProps) {
  const color = readiness >= 80 ? 'text-green-400' : readiness >= 50 ? 'text-yellow-400' : 'text-red-400'
  const Icon = readiness >= 80 ? CheckCircle2 : readiness >= 50 ? AlertTriangle : XCircle

  return (
    <div className={`bg-surface rounded-lg p-3 border border-border ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-muted font-medium">Race Readiness</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className={`text-lg font-bold ${color}`}>{readiness}%</div>
      {nextRace && <div className="text-xs text-text-muted">Next: {nextRace}</div>}
      {issues.length > 0 && (
        <div className="mt-2 space-y-1">
          {issues.slice(0, 2).map((issue, i) => (
            <div key={i} className="text-xs text-yellow-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {issue}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
