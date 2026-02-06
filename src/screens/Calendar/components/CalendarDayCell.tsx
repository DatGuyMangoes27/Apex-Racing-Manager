/**
 * CalendarDayCell
 * Individual day cell within the monthly calendar grid
 * Shows day number, activity previews, and status indicators
 */

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { 
  Plus,
  Flag,
  AlertTriangle,
  Handshake,
  Users,
  Wrench,
  Newspaper,
  Heart,
  Car,
  Check,
  Clock,
  AlertCircle,
  UserX,
  Timer
} from 'lucide-react'
import { Badge } from '@/components/ui'
import { 
  ScheduledActivity, 
  ActivityCategory,
  useCareerStore
} from '@/store/careerStore'
import { RaceEvent } from '@/store/rivalStore'
import { getDaysUntilDeadline } from '@/simulation/activities/mandatoryActivities'

interface CalendarDayCellProps {
  day: number
  week: number
  dayOfWeek: number
  isCurrentMonth: boolean
  isToday: boolean
  isPast: boolean
  activities: ScheduledActivity[]
  race?: RaceEvent
  hasMandatory: boolean
  onClick: () => void
  onAddActivity: () => void
}

// Get icon for activity category
function getCategoryIcon(category: ActivityCategory) {
  const icons: Record<ActivityCategory, typeof Handshake> = {
    sponsor: Handshake,
    team: Users,
    development: Wrench,
    media: Newspaper,
    personal: Heart,
    race: Flag,
    maintenance: Car,
    lifestyle: Heart
  }
  return icons[category] || Clock
}

// Get color for activity category
function getCategoryColor(category: ActivityCategory): string {
  const colors: Record<ActivityCategory, string> = {
    sponsor: 'text-accent-gold',
    team: 'text-accent-blue',
    development: 'text-accent-purple',
    media: 'text-accent-orange',
    personal: 'text-status-success',
    race: 'text-accent-red',
    maintenance: 'text-text-muted',
    lifestyle: 'text-status-success'
  }
  return colors[category] || 'text-text-muted'
}

export function CalendarDayCell({
  day,
  _week,
  dayOfWeek,
  isCurrentMonth,
  isToday,
  isPast,
  activities,
  race,
  hasMandatory,
  onClick,
  onAddActivity
}: CalendarDayCellProps) {
  const { hasReserveDriver, careerState } = useCareerStore()
  
  const scheduledActivities = activities.filter(a => a.status === 'scheduled')
  const completedActivities = activities.filter(a => a.status === 'completed')
  const _hasActivities = activities.length > 0
  const activityCount = activities.length
  
  // Determine cell styling
  const isRaceDay = !!race
  const isWeekend = dayOfWeek >= 6 // Saturday or Sunday
  
  // Check for driver/owner conflicts on this day
  const conflictInfo = useMemo(() => {
    if (scheduledActivities.length < 2) return null
    
    // Check if there are both driver-required and owner-only activities
    const driverActivities = scheduledActivities.filter(a => a.requiresDriver)
    const ownerOnlyActivities = scheduledActivities.filter(a => a.requiresOwner && !a.requiresDriver)
    
    if (driverActivities.length > 0 && ownerOnlyActivities.length > 0) {
      const canResolve = hasReserveDriver()
      return {
        hasConflict: !canResolve,
        canResolveWithReserve: true,
        driverActivities,
        ownerOnlyActivities
      }
    }
    return null
  }, [scheduledActivities, hasReserveDriver])
  
  // Check for mandatory activities with approaching deadlines
  const urgentDeadline = useMemo(() => {
    if (!careerState) return null
    
    const mandatoryActivities = scheduledActivities.filter(a => a.mandatory && a.deadline)
    
    for (const activity of mandatoryActivities) {
      if (activity.deadline) {
        const daysLeft = getDaysUntilDeadline(
          careerState.currentWeek,
          careerState.currentDay ?? 1,
          activity.deadline.week,
          activity.deadline.day
        )
        
        if (daysLeft <= 1) {
          return { activity, daysLeft, urgency: 'critical' as const }
        } else if (daysLeft <= 3) {
          return { activity, daysLeft, urgency: 'high' as const }
        }
      }
    }
    return null
  }, [scheduledActivities, careerState])
  
  return (
    <motion.div
      whileHover={{ scale: isCurrentMonth ? 1.02 : 1 }}
      className={`
        min-h-[90px] p-1.5 border-r border-surface-secondary last:border-r-0
        transition-colors cursor-pointer relative group
        ${!isCurrentMonth ? 'bg-surface-secondary/20 opacity-50' : ''}
        ${isToday ? 'bg-accent-blue/10 ring-2 ring-accent-blue ring-inset' : ''}
        ${isPast && isCurrentMonth ? 'bg-surface-secondary/10' : ''}
        ${isRaceDay ? 'bg-accent-red/5' : ''}
        ${isWeekend && isCurrentMonth && !isRaceDay && !isToday ? 'bg-surface-secondary/5' : ''}
        ${conflictInfo?.hasConflict ? 'ring-2 ring-status-error ring-inset bg-status-error/5' : ''}
        ${urgentDeadline?.urgency === 'critical' ? 'ring-2 ring-status-error ring-inset animate-pulse' : ''}
        ${hasMandatory && !isPast && !conflictInfo?.hasConflict && urgentDeadline?.urgency !== 'critical' ? 'ring-1 ring-accent-orange ring-inset' : ''}
        hover:bg-surface-secondary/30
      `}
      onClick={onClick}
    >
      {/* Day Number */}
      <div className="flex items-start justify-between mb-1">
        <span className={`
          text-sm font-mono font-medium
          ${!isCurrentMonth ? 'text-text-muted/50' : ''}
          ${isToday ? 'text-accent-blue font-bold' : ''}
          ${isPast && isCurrentMonth ? 'text-text-muted' : ''}
        `}>
          {day}
        </span>
        
        {/* Indicators */}
        <div className="flex items-center gap-0.5">
          {isRaceDay && (
            <Flag className="w-3 h-3 text-accent-red" />
          )}
          {/* Driver/Owner Conflict Warning */}
          {conflictInfo?.hasConflict && (
            <div className="relative group/conflict">
              <AlertCircle className="w-3 h-3 text-status-error animate-pulse" />
              <div className="absolute z-20 bottom-full left-0 mb-1 p-1.5 bg-surface-primary border border-status-error rounded shadow-lg opacity-0 group-hover/conflict:opacity-100 transition-opacity whitespace-nowrap text-[9px]">
                <div className="text-status-error font-medium">Scheduling Conflict!</div>
                <div className="text-text-muted">You can't be driver and owner simultaneously</div>
                <div className="text-accent-blue mt-0.5">Hire a reserve driver to resolve</div>
              </div>
            </div>
          )}
          {/* Resolved conflict indicator */}
          {conflictInfo && !conflictInfo.hasConflict && conflictInfo.canResolveWithReserve && (
            <div className="relative group/reserve">
              <UserX className="w-3 h-3 text-status-success" />
              <div className="absolute z-20 bottom-full left-0 mb-1 p-1.5 bg-surface-primary border border-status-success rounded shadow-lg opacity-0 group-hover/reserve:opacity-100 transition-opacity whitespace-nowrap text-[9px]">
                <div className="text-status-success font-medium">Reserve Driver Covering</div>
                <div className="text-text-muted">Your reserve driver handles driving duties</div>
              </div>
            </div>
          )}
          {/* Urgent deadline warning */}
          {urgentDeadline && (
            <div className="relative group/deadline">
              <Timer className={`w-3 h-3 ${urgentDeadline.urgency === 'critical' ? 'text-status-error animate-pulse' : 'text-accent-orange'}`} />
              <div className="absolute z-20 bottom-full left-0 mb-1 p-1.5 bg-surface-primary border border-accent-orange rounded shadow-lg opacity-0 group-hover/deadline:opacity-100 transition-opacity whitespace-nowrap text-[9px]">
                <div className={`font-medium ${urgentDeadline.urgency === 'critical' ? 'text-status-error' : 'text-accent-orange'}`}>
                  {urgentDeadline.urgency === 'critical' ? 'DEADLINE TODAY!' : `${urgentDeadline.daysLeft} days left`}
                </div>
                <div className="text-text-muted">{urgentDeadline.activity.name}</div>
              </div>
            </div>
          )}
          {hasMandatory && !isPast && !urgentDeadline && (
            <AlertTriangle className="w-3 h-3 text-accent-orange" />
          )}
          {activityCount > 0 && (
            <Badge 
              variant={conflictInfo?.hasConflict ? 'destructive' : hasMandatory ? 'orange' : 'default'} 
              className="h-4 min-w-[16px] text-[10px] px-1"
            >
              {activityCount}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Race Label */}
      {isRaceDay && (
        <div className="mb-1 px-1 py-0.5 rounded bg-accent-red/20 text-accent-red text-[10px] font-medium truncate">
          {race.trackName.split(' ')[0]}
        </div>
      )}
      
      {/* Activity Previews - Show up to 2 */}
      <div className="space-y-0.5">
        {scheduledActivities.slice(0, 2).map(activity => {
          const Icon = getCategoryIcon(activity.category)
          const color = getCategoryColor(activity.category)
          // Check if this is a multi-day activity
          const isSpanContinuation = (activity as any)._isSpanContinuation
          const spanPosition = (activity as any)._spanPosition
          const totalSpanDays = (activity as any)._totalSpanDays || activity.spanDays || 1
          const isMultiDay = totalSpanDays > 1
          
          return (
            <div 
              key={`${activity.id}-${spanPosition || 1}`}
              className={`
                flex items-center gap-1 px-1 py-0.5 rounded text-[10px]
                ${activity.mandatory 
                  ? 'bg-accent-orange/20 text-accent-orange' 
                  : isSpanContinuation
                    ? 'bg-accent-purple/15 text-accent-purple border-l-2 border-accent-purple'
                    : 'bg-surface-secondary/50 text-text-secondary'}
              `}
            >
              <Icon className={`w-2.5 h-2.5 flex-shrink-0 ${color}`} />
              <span className="truncate">
                {isSpanContinuation 
                  ? `↳ ${activity.name.split(' ').slice(0, 1).join(' ')}` 
                  : activity.name.split(' ').slice(0, 2).join(' ')}
              </span>
              {isMultiDay && !isSpanContinuation && (
                <span className="text-[8px] text-text-muted ml-auto">
                  {totalSpanDays}d
                </span>
              )}
            </div>
          )
        })}
        
        {/* Completed activities indicator */}
        {completedActivities.length > 0 && (
          <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-status-success/10 text-status-success text-[10px]">
            <Check className="w-2.5 h-2.5" />
            <span>{completedActivities.length} done</span>
          </div>
        )}
        
        {/* More activities indicator */}
        {scheduledActivities.length > 2 && (
          <div className="text-[10px] text-text-muted px-1">
            +{scheduledActivities.length - 2} more
          </div>
        )}
      </div>
      
      {/* Add Activity Button (hover) */}
      {isCurrentMonth && !isPast && (
        <motion.button
          initial={{ opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          className={`
            absolute bottom-1 right-1 w-5 h-5 rounded 
            bg-accent-blue/20 text-accent-blue
            flex items-center justify-center
            opacity-0 group-hover:opacity-100 transition-opacity
          `}
          onClick={(e) => {
            e.stopPropagation()
            onAddActivity()
          }}
        >
          <Plus className="w-3 h-3" />
        </motion.button>
      )}
    </motion.div>
  )
}
