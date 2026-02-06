import { motion } from 'framer-motion'
import { Clock, Battery, BatteryLow, BatteryWarning, Zap, Moon } from 'lucide-react'
import { Badge } from '@/components/ui'
import { useCareerStore } from '@/store/careerStore'
import { 
  calculateFatigueZone, 
  getFatigueZoneInfo, 
  TIME_BUDGET_CONFIG,
  getDaySummary
} from '@/simulation/timeBudget'

interface TimeBudgetBarProps {
  compact?: boolean
}

export function TimeBudgetBar({ compact = false }: TimeBudgetBarProps) {
  const { careerState } = useCareerStore()
  
  if (!careerState?.dayBudget) return null
  
  const { dayBudget } = careerState
  const zone = calculateFatigueZone(dayBudget.hoursUsed)
  const zoneInfo = getFatigueZoneInfo(zone)
  const summary = getDaySummary(dayBudget)
  
  // Calculate progress percentage
  const usedPercent = (dayBudget.hoursUsed / dayBudget.totalHours) * 100
  
  // Zone boundary percentages for the bar
  const greenEnd = (TIME_BUDGET_CONFIG.GREEN_ZONE_MAX / dayBudget.totalHours) * 100
  const yellowEnd = (TIME_BUDGET_CONFIG.YELLOW_ZONE_MAX / dayBudget.totalHours) * 100
  
  // Battery icon based on remaining hours
  const getBatteryIcon = () => {
    if (dayBudget.hoursRemaining <= 2) return <BatteryLow className="w-4 h-4 text-accent-red" />
    if (dayBudget.hoursRemaining <= 5) return <BatteryWarning className="w-4 h-4 text-accent-orange" />
    return <Battery className="w-4 h-4 text-status-success" />
  }
  
  // Zone color classes
  const zoneColorClasses = {
    green: { bar: 'bg-status-success', text: 'text-status-success', glow: 'shadow-status-success/20' },
    yellow: { bar: 'bg-accent-orange', text: 'text-accent-orange', glow: 'shadow-accent-orange/20' },
    red: { bar: 'bg-accent-red', text: 'text-accent-red', glow: 'shadow-accent-red/20' }
  }
  
  const colors = zoneColorClasses[zone]
  
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-surface/80 backdrop-blur-sm rounded-lg border border-surface-border/50">
        <Clock className={`w-3.5 h-3.5 ${colors.text}`} />
        <span className={`font-mono font-bold text-sm ${colors.text}`}>
          {dayBudget.hoursRemaining}h
        </span>
        <div className="w-16 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${colors.bar}`}
            initial={{ width: 0 }}
            animate={{ width: `${100 - usedPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    )
  }
  
  return (
    <div className={`
      flex items-center gap-4 px-4 py-2 
      bg-surface-elevated/80 backdrop-blur-sm 
      border-b border-surface-border/50
      ${zone === 'red' ? 'border-b-accent-red/30' : ''}
    `}>
      {/* Hours Remaining */}
      <div className="flex items-center gap-2">
        {getBatteryIcon()}
        <div>
          <span className={`font-mono font-bold text-lg ${colors.text}`}>
            {dayBudget.hoursRemaining}h
          </span>
          <span className="text-text-muted text-xs ml-1">remaining</span>
        </div>
      </div>
      
      {/* Progress Bar with Zone Markers */}
      <div className="flex-1 max-w-sm">
        <div className="relative h-2.5 bg-surface-secondary rounded-full overflow-hidden">
          {/* Zone background segments */}
          <div 
            className="absolute inset-y-0 left-0 bg-status-success/10 rounded-l-full" 
            style={{ width: `${greenEnd}%` }} 
          />
          <div 
            className="absolute inset-y-0 bg-accent-orange/10" 
            style={{ left: `${greenEnd}%`, width: `${yellowEnd - greenEnd}%` }} 
          />
          <div 
            className="absolute inset-y-0 right-0 bg-accent-red/10 rounded-r-full" 
            style={{ left: `${yellowEnd}%` }} 
          />
          
          {/* Used progress bar */}
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full ${colors.bar} ${colors.glow} shadow-lg`}
            initial={{ width: 0 }}
            animate={{ width: `${usedPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          
          {/* Zone boundary markers */}
          <div 
            className="absolute inset-y-0 w-px bg-text-muted/30" 
            style={{ left: `${greenEnd}%` }} 
          />
          <div 
            className="absolute inset-y-0 w-px bg-text-muted/30" 
            style={{ left: `${yellowEnd}%` }} 
          />
        </div>
        
        {/* Zone labels */}
        <div className="flex justify-between mt-0.5">
          <span className="text-[9px] text-text-muted">0h</span>
          <span className="text-[9px] text-text-muted">{dayBudget.totalHours}h</span>
        </div>
      </div>
      
      {/* Fatigue Zone Badge */}
      <Badge 
        variant={zone === 'green' ? 'green' : zone === 'yellow' ? 'orange' : 'red'} 
        size="sm"
      >
        <Zap className="w-3 h-3 mr-1" />
        {zoneInfo.label}
      </Badge>
      
      {/* Fatigue Debt Indicator */}
      {dayBudget.fatigueDebt > 0 && (
        <div className="flex items-center gap-1 text-xs text-accent-orange">
          <Moon className="w-3 h-3" />
          <span className="font-mono">-{dayBudget.fatigueDebt}h debt</span>
        </div>
      )}
      
      {/* Tomorrow's Estimate */}
      <div className="text-xs text-text-muted">
        <span>Tomorrow: </span>
        <span className={`font-mono font-bold ${
          summary.tomorrowPool >= 14 ? 'text-status-success' : 
          summary.tomorrowPool >= 12 ? 'text-accent-orange' : 
          'text-accent-red'
        }`}>
          {summary.tomorrowPool}h
        </span>
      </div>
    </div>
  )
}
