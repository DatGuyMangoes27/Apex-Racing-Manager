import { Clock, Zap, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui'
import { useCareerStore, type DrainLevel } from '@/store/careerStore'
import { previewAction, getFatigueZoneInfo } from '@/simulation/timeBudget'

interface ActionTimeCostPreviewProps {
  /** Clock hours the action costs */
  hours: number
  /** How draining the activity is */
  drainLevel: DrainLevel
  /** Optional label override */
  label?: string
  /** Compact mode (inline, no border) */
  compact?: boolean
  /** Show as disabled if can't afford */
  showDisabled?: boolean
}

/** Drain level display info */
function getDrainDisplay(drain: DrainLevel) {
  switch (drain) {
    case 'restorative': return { label: 'Restorative', color: 'text-cyan-400', badgeVariant: 'blue' as const }
    case 'low': return { label: 'Light', color: 'text-status-success', badgeVariant: 'green' as const }
    case 'normal': return { label: 'Normal', color: 'text-text-secondary', badgeVariant: 'default' as const }
    case 'high': return { label: 'Heavy', color: 'text-accent-orange', badgeVariant: 'orange' as const }
  }
}

/**
 * Shows a preview of how an action will affect the daily time budget.
 * Use this before any action button that costs owner time.
 */
export function ActionTimeCostPreview({ 
  hours, 
  drainLevel, 
  label, 
  compact = false,
  showDisabled = true
}: ActionTimeCostPreviewProps) {
  const { careerState } = useCareerStore()
  
  if (!careerState?.dayBudget) return null
  
  const preview = previewAction(careerState.dayBudget, hours, drainLevel)
  const drainInfo = getDrainDisplay(drainLevel)
  const afterZoneInfo = getFatigueZoneInfo(preview.zoneAfter)
  
  if (compact) {
    return (
      <span className={`
        inline-flex items-center gap-1 text-xs
        ${!preview.canAfford && showDisabled ? 'text-accent-red' : 'text-text-muted'}
      `}>
        <Clock className="w-3 h-3" />
        <span className="font-mono">{hours}h</span>
        {!preview.canAfford && showDisabled && (
          <span className="text-accent-red">(not enough time)</span>
        )}
      </span>
    )
  }
  
  return (
    <div className={`
      p-3 rounded-lg border text-sm
      ${!preview.canAfford && showDisabled
        ? 'bg-accent-red/10 border-accent-red/30'
        : preview.zoneChanged
          ? 'bg-accent-orange/10 border-accent-orange/30'
          : 'bg-surface/50 border-surface-border/50'
      }
    `}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-text-muted" />
          <span className="font-medium">
            {label || 'Time Cost'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold">{hours}h</span>
          {drainInfo && (
            <Badge variant={drainInfo.badgeVariant} size="sm">
              {drainInfo.label}
            </Badge>
          )}
        </div>
      </div>
      
      {/* After preview */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-border/50">
        <span className="text-text-muted text-xs">After:</span>
        <div className="flex items-center gap-2">
          <span className={`font-mono font-bold ${
            preview.canAfford ? afterZoneInfo.color : 'text-accent-red'
          }`}>
            {preview.hoursAfter}h remaining
          </span>
          {preview.zoneChanged && preview.canAfford && (
            <Badge 
              variant={preview.zoneAfter === 'yellow' ? 'orange' : 'red'} 
              size="sm"
            >
              <Zap className="w-3 h-3 mr-1" />
              {afterZoneInfo.label}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Cannot afford warning */}
      {!preview.canAfford && showDisabled && (
        <div className="flex items-center gap-2 mt-2 text-accent-red text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Not enough time today. You need {hours}h but only have {careerState.dayBudget.hoursRemaining}h.</span>
        </div>
      )}
    </div>
  )
}
