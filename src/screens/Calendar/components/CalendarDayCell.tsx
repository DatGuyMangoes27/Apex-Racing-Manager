/**
 * CalendarDayCell
 * Individual day cell matching the Figma Schedule design
 * Shows day number and colored event pills
 */

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { 
  Plus,
  Flag,
  AlertTriangle,
  AlertCircle,
  Handshake,
  Users,
  Wrench,
  Newspaper,
  Heart,
  Car,
  Check,
  Clock,
  UserX,
  Timer,
  HeartHandshake,
  Home,
  Dumbbell,
  Leaf,
  GraduationCap,
  Palette,
  PawPrint,
  Settings
} from 'lucide-react'
import { 
  ScheduledActivity, 
  ActivityCategory,
  useCareerStore
} from '@/store/careerStore'
import { calculateDayEffectiveHours } from '@/simulation/activities/schedulingOverhead'
import { RaceEvent } from '@/store/rivalStore'
import { getDaysUntilDeadline } from '@/simulation/activities/mandatoryActivities'

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }

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
  isEvenCol: boolean
  isLastRow: boolean
  isLastCol: boolean
  onClick: () => void
  onAddActivity: () => void
}

// Map activity categories to the Figma color scheme
type EventColor = 'black' | 'red' | 'orange' | 'blue' | 'purple'

function getEventColor(activity: ScheduledActivity): EventColor {
  // Mandatory activities with deadlines → Red (Deadline)
  if (activity.mandatory && activity.deadline) return 'red'
  
  switch (activity.category) {
    case 'race': return 'black'
    case 'maintenance': return 'orange'
    case 'development': return 'purple'
    case 'sponsor': return 'blue'
    case 'team': return 'blue'
    case 'media': return 'blue'
    case 'social': return 'blue'
    case 'personal': return 'blue'
    case 'lifestyle': return 'orange'
    case 'romance': return 'blue'
    case 'family': return 'blue'
    case 'fitness': return 'purple'
    case 'wellness': return 'purple'
    case 'education': return 'purple'
    case 'hobby': return 'purple'
    case 'pet': return 'blue'
    default: return 'blue'
  }
}

const EVENT_BG: Record<EventColor, string> = {
  black: 'bg-black',
  red: 'bg-[#e7000b]',
  orange: 'bg-[#d08700]',
  blue: 'bg-[#155dfc]',
  purple: 'bg-[#9810fa]'
}

function getCategoryIcon(category: ActivityCategory) {
  const icons: Record<ActivityCategory, typeof Handshake> = {
    sponsor: Handshake,
    team: Users,
    development: Settings,
    media: Newspaper,
    personal: Heart,
    race: Flag,
    maintenance: Wrench,
    lifestyle: Heart,
    social: Users,
    romance: HeartHandshake,
    family: Home,
    fitness: Dumbbell,
    wellness: Leaf,
    education: GraduationCap,
    hobby: Palette,
    pet: PawPrint
  }
  return icons[category] || Clock
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
  isEvenCol,
  isLastRow,
  isLastCol,
  onClick,
  onAddActivity
}: CalendarDayCellProps) {
  const { hasReserveDriver, careerState } = useCareerStore()
  const seriesNameById = useMemo(() => {
    const map = new Map<string, string>()
    ;(careerState?.seriesEntries || []).forEach((e: any) => {
      map.set(e.seriesId, e.seriesName || e.seriesId)
    })
    return map
  }, [careerState?.seriesEntries])
  
  const getSeriesChip = (activity: ScheduledActivity): string | null => {
    const templateId = activity.templateId || ''
    const prefixes = [
      'race_session_practice_',
      'race_session_qualifying_',
      'race_session_race_',
      'race_weekend_event_',
      'race_expected_sponsor_hospitality_',
      'race_expected_fan_meet_',
      'race_expected_driver_briefing_',
      'race_expected_scrutineering_',
    ]
    const prefix = prefixes.find(p => templateId.startsWith(p))
    if (!prefix) return null
    const seriesId = templateId.slice(prefix.length)
    const name = seriesNameById.get(seriesId)
    if (!name) return null
    return name.length > 14 ? `${name.slice(0, 14)}...` : name
  }
  
  const scheduledActivities = activities.filter(a => a.status === 'scheduled')
  const completedActivities = activities.filter(a => a.status === 'completed')
  const activityCount = activities.length
  
  const isRaceDay = !!race
  
  // Check for overloaded day
  const conflictInfo = useMemo(() => {
    if (scheduledActivities.length === 0) return null
    
    const isRaceDayForCalc = scheduledActivities.some(a => a.category === 'race')
    const breakdown = calculateDayEffectiveHours(scheduledActivities, isRaceDayForCalc)
    
    if (!breakdown.hasConflict) return null
    
    const hasReserve = hasReserveDriver()
    
    if (breakdown.hasRoleTransition && hasReserve) {
      const ownerOnly = scheduledActivities.filter(a => !a.requiresDriver)
      const resolved = calculateDayEffectiveHours(ownerOnly, false)
      if (!resolved.hasConflict) {
        return { hasConflict: false, canResolveWithReserve: true, breakdown: resolved }
      }
    }
    
    return {
      hasConflict: true,
      canResolveWithReserve: breakdown.hasRoleTransition,
      breakdown,
    }
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
  
  // Determine cell background (matching Figma checkerboard pattern)
  let cellBg = 'bg-white'
  if (!isCurrentMonth) {
    cellBg = 'bg-[#f3f4f6]'
  } else if (isEvenCol) {
    cellBg = 'bg-[#f9fafb]'
  }
  
  // Today highlight overrides
  if (isToday) {
    cellBg = 'bg-blue-50'
  }
  
  // Border classes
  const borderRight = !isLastCol ? 'border-r-[1.6px] border-r-black' : ''
  const borderBottom = !isLastRow ? 'border-b-[1.6px] border-b-black' : ''
  
  // Get displayable activities (up to 2 event pills)
  const displayActivities = [...scheduledActivities, ...completedActivities].slice(0, 2)
  const remainingCount = activityCount - displayActivities.length

  return (
    <div
      className={`
        relative min-h-[140px] cursor-pointer group transition-colors
        ${cellBg} ${borderRight} ${borderBottom}
        ${isToday ? 'ring-2 ring-[#155dfc] ring-inset z-10' : ''}
        ${conflictInfo?.hasConflict ? 'ring-2 ring-[#e7000b] ring-inset' : ''}
        ${urgentDeadline?.urgency === 'critical' ? 'ring-2 ring-[#e7000b] ring-inset animate-pulse' : ''}
        hover:bg-white/80
      `}
      onClick={onClick}
    >
      {/* Day Number + Indicators */}
      <div className="flex items-start justify-between p-[8px]">
        <span className={`text-[18px] leading-[28px] ${
          !isCurrentMonth ? 'text-black/30' :
          isToday ? 'text-[#155dfc]' :
          isPast ? 'text-black/40' :
          'text-black'
        }`} style={FB}>
          {day}
        </span>
        
        <div className="flex items-center gap-[2px]">
          {conflictInfo?.hasConflict && (
            <AlertCircle className="w-[14px] h-[14px] text-[#e7000b] animate-pulse" />
          )}
          {conflictInfo && !conflictInfo.hasConflict && conflictInfo.canResolveWithReserve && (
            <UserX className="w-[14px] h-[14px] text-[#00a63e]" />
          )}
          {urgentDeadline && (
            <Timer className={`w-[14px] h-[14px] ${urgentDeadline.urgency === 'critical' ? 'text-[#e7000b] animate-pulse' : 'text-[#d08700]'}`} />
          )}
          {hasMandatory && !isPast && !urgentDeadline && (
            <AlertTriangle className="w-[14px] h-[14px] text-[#d08700]" />
          )}
        </div>
      </div>
      
      {/* Event Pills */}
      <div className="flex flex-col gap-[4px] px-[8px] overflow-hidden">
        {displayActivities.map((activity, idx) => {
          const color = getEventColor(activity)
          const bgClass = EVENT_BG[color]
          const Icon = getCategoryIcon(activity.category)
          const isCompleted = activity.status === 'completed'
          
          // Determine time label
          let timeLabel = ''
          if (activity.scheduledPeriod) {
            const periodTimes: Record<string, string> = {
              morning: '09:00',
              afternoon: '14:00',
              evening: '19:00'
            }
            timeLabel = periodTimes[activity.scheduledPeriod] || ''
          }
          if (activity.mandatory && !timeLabel) {
            timeLabel = 'EOD'
          }
          if (activity.category === 'race') {
            timeLabel = activity.scheduledPeriod === 'morning' ? '10:00' : 
                        activity.scheduledPeriod === 'afternoon' ? '14:00' : '15:00'
          }
          
          return (
            <div 
              key={`${activity.id}-${idx}`}
              className={`${bgClass} rounded-[10px] px-[6px] pt-[6px] pb-[4px] flex flex-col gap-[2px] ${isCompleted ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-[4px]">
                <Icon className="w-[12px] h-[12px] text-white flex-shrink-0" />
                <span className="text-[9px] text-white truncate leading-[11px]" style={FB}>
                  {isCompleted ? '✓ ' : ''}{activity.name.length > 18 ? activity.name.slice(0, 18) + '...' : activity.name}
                </span>
              </div>
              {timeLabel && (
                <span className="text-[8px] text-white/90 leading-[12px]" style={FR}>
                  {timeLabel}
                </span>
              )}
            </div>
          )
        })}
        
        {remainingCount > 0 && (
          <span className="text-[9px] text-black/50 px-[2px]" style={FB}>
            +{remainingCount} more
          </span>
        )}
      </div>
      
      {/* Add Activity Button (hover) */}
      {isCurrentMonth && !isPast && (
        <button
          className="absolute bottom-[4px] right-[4px] w-[20px] h-[20px] rounded-[6px] bg-[#155dfc]/20 text-[#155dfc] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            onAddActivity()
          }}
        >
          <Plus className="w-[12px] h-[12px]" />
        </button>
      )}
    </div>
  )
}
