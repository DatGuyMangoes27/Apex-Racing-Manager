import { Briefcase, AlertTriangle } from 'lucide-react'

interface SponsorHealthWidgetProps {
  sponsors?: Array<{ name: string; satisfaction: number }>
  className?: string
}

export function SponsorHealthWidget({ sponsors = [], className = '' }: SponsorHealthWidgetProps) {
  const avgSatisfaction = sponsors.length > 0 ? Math.round(sponsors.reduce((sum, s) => sum + s.satisfaction, 0) / sponsors.length) : 0
  const atRisk = sponsors.filter(s => s.satisfaction < 40)

  return (
    <div className={`bg-surface rounded-lg p-3 border border-border ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-muted font-medium">Sponsor Health</span>
        <Briefcase className="w-4 h-4 text-text-muted" />
      </div>
      <div className="text-lg font-bold text-text-primary">{sponsors.length} Sponsors</div>
      <div className="text-xs text-text-muted">Avg satisfaction: {avgSatisfaction}%</div>
      {atRisk.length > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-yellow-400">
          <AlertTriangle className="w-3 h-3" />
          {atRisk.length} at risk
        </div>
      )}
    </div>
  )
}
