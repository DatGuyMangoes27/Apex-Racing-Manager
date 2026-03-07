// ============================================
// CAREER JOURNEY WIDGET
// ============================================
// Visualizes the player's progression through the series
// tier ladder, showing where they started, where they are,
// and what's ahead. This is the "north star" for long-term goals.

import { Trophy, TrendingUp } from 'lucide-react'

interface CareerJourneyWidgetProps {
  currentTier?: number
  maxTier?: number
  seriesName?: string
  className?: string
}

export function CareerJourneyWidget({
  currentTier = 1,
  maxTier = 5,
  seriesName = 'Club Racing',
  className = ''
}: CareerJourneyWidgetProps) {
  const progress = Math.round((currentTier / maxTier) * 100)

  return (
    <div className={`bg-surface rounded-lg p-3 border border-border ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-muted font-medium">Career Journey</span>
        <Trophy className="w-4 h-4 text-yellow-400" />
      </div>
      <div className="text-lg font-bold text-text-primary">Tier {currentTier}</div>
      <div className="text-xs text-text-muted">{seriesName}</div>
      <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center gap-1 mt-1">
        <TrendingUp className="w-3 h-3 text-text-muted" />
        <span className="text-[10px] text-text-muted">
          {currentTier}/{maxTier} tiers
        </span>
      </div>
    </div>
  )
}
