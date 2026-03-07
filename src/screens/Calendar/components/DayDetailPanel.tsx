/**
 * DayDetailPanel
 * Expandable panel showing full details for a selected day
 * Displays all activities, race info, and allows scheduling
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useMemo, useState } from 'react'
import { 
  X,
  Plus,
  Flag,
  AlertTriangle,
  Clock,
  DollarSign,
  Check,
  XCircle,
  Calendar,
  Handshake,
  Users,
  Wrench,
  Newspaper,
  Heart,
  Car,
  ChevronRight,
  MapPin,
  AlertCircle,
  UserPlus,
  Timer,
  ShieldAlert,
  // New category icons
  HeartHandshake,
  Home,
  Dumbbell,
  Leaf,
  GraduationCap,
  Palette,
  PawPrint
} from 'lucide-react'
import { Button, Badge } from '@/components/ui';
import { useCareerStore, getDayName } from '@/store/careerStore';
import { getDaysUntilDeadline } from '@/simulation/activities/mandatoryActivities';
import { calculateDayEffectiveHours, type EffectiveHoursBreakdown } from '@/simulation/activities/schedulingOverhead';
import type { ScheduledActivity, ActivityCategory } from '@/store/careerStore';
import { DAY_PERIODS, DAY_PERIOD_ORDER, type DayPeriod, getPeriodForHour, canDoActivityInCurrentPeriod } from '@/data/day-periods-config';
import { getActivityTimeCost } from '@/data/activity-time-costs';
import { Sunrise, Sun as SunIcon, Sunset, Moon as MoonIcon2 } from 'lucide-react';

function getCategoryStyle(category: ActivityCategory): { text: string; bg: string } {
  const styles: Record<ActivityCategory, { text: string; bg: string }> = {
    sponsor: { text: 'text-accent-gold', bg: 'bg-accent-gold/20' },
    team: { text: 'text-accent-blue', bg: 'bg-accent-blue/20' },
    development: { text: 'text-accent-purple', bg: 'bg-accent-purple/20' },
    media: { text: 'text-accent-orange', bg: 'bg-accent-orange/20' },
    personal: { text: 'text-status-success', bg: 'bg-status-success/20' },
    race: { text: 'text-accent-red', bg: 'bg-accent-red/20' },
    maintenance: { text: 'text-text-muted', bg: 'bg-surface-secondary' },
    lifestyle: { text: 'text-status-success', bg: 'bg-status-success/20' },
    // New specific personal-life categories
    social: { text: 'text-pink-400', bg: 'bg-pink-400/20' },
    romance: { text: 'text-rose-400', bg: 'bg-rose-400/20' },
    family: { text: 'text-amber-400', bg: 'bg-amber-400/20' },
    fitness: { text: 'text-cyan-400', bg: 'bg-cyan-400/20' },
    wellness: { text: 'text-teal-400', bg: 'bg-teal-400/20' },
    education: { text: 'text-indigo-400', bg: 'bg-indigo-400/20' },
    hobby: { text: 'text-emerald-400', bg: 'bg-emerald-400/20' },
    pet: { text: 'text-orange-400', bg: 'bg-orange-400/20' }
  }
  return styles[category] || { text: 'text-text-muted', bg: 'bg-surface-secondary' }
}

function getCategoryIcon(category: ActivityCategory) {
  const icons: Record<ActivityCategory, typeof Handshake> = {
    sponsor: Handshake,
    team: Users,
    development: Wrench,
    media: Newspaper,
    personal: Heart,
    race: Flag,
    maintenance: Car,
    lifestyle: Heart,
    // New specific personal-life categories
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

export function DayDetailPanel({
  isOpen,
  week,
  day,
  activities,
  race,
  currentWeek,
  currentDay,
  onClose,
  onAddActivity,
  onCompleteActivity,
  onCancelActivity,
  onViewActivity,
  onAttendEvent
}: DayDetailPanelProps) {
  const { hasReserveDriver, careerState, rescheduleActivity } = useCareerStore()
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
      'race_expected_pre_race_press_conference_',
      'race_expected_post_qualifying_media_',
      'race_expected_post_race_press_conference_',
      'race_expected_sponsor_hospitality_',
      'race_expected_post_race_sponsor_commitment_',
      'race_expected_fan_meet_',
      'race_expected_driver_briefing_',
      'race_expected_scrutineering_',
    ]
    const prefix = prefixes.find(p => templateId.startsWith(p))
    if (!prefix) return null
    const seriesId = templateId.slice(prefix.length)
    return seriesNameById.get(seriesId) || null
  }
  const getSessionCode = (activity: ScheduledActivity): 'FP' | 'Q' | 'R' | null => {
    const templateId = activity.templateId || ''
    if (templateId.startsWith('race_session_practice_')) return 'FP'
    if (templateId.startsWith('race_session_qualifying_')) return 'Q'
    if (templateId.startsWith('race_session_race_')) return 'R'
    return null
  }
  const [rescheduleForActivity, setRescheduleForActivity] = useState<ScheduledActivity | null>(null)
  const [rescheduleWeek, setRescheduleWeek] = useState(currentWeek)
  const [rescheduleDay, setRescheduleDay] = useState(currentDay)
  
  const isPast = week < currentWeek || (week === currentWeek && day < currentDay)
  const isToday = week === currentWeek && day === currentDay
  const dayName = getDayName(day)
  
  const scheduledActivities = activities.filter(a => a.status === 'scheduled')
  const completedActivities = activities.filter(a => a.status === 'completed')
  const missedActivities = activities.filter(a => a.status === 'missed')
  
  // Calculate effective hours and detect overloaded days
  const conflictInfo = useMemo(() => {
    if (scheduledActivities.length === 0) return null
    
    const isRaceDay = scheduledActivities.some(a => a.category === 'race')
    const breakdown = calculateDayEffectiveHours(scheduledActivities, isRaceDay)
    
    // No conflict if effective hours fit within the day
    if (!breakdown.hasConflict && !breakdown.hasRoleTransition) return null
    
    const driverActivities = scheduledActivities.filter(a => a.requiresDriver)
    const ownerOnlyActivities = scheduledActivities.filter(a => a.requiresOwner && !a.requiresDriver)
    
    // Check if reserve driver resolves the conflict
    const hasReserve = hasReserveDriver()
    let resolvedBreakdown: EffectiveHoursBreakdown | null = null
    if (breakdown.hasConflict && breakdown.hasRoleTransition && hasReserve) {
      // With reserve, driver activities are delegated - recalculate
      const ownerActivities = scheduledActivities.filter(a => !a.requiresDriver)
      resolvedBreakdown = calculateDayEffectiveHours(ownerActivities, false)
    }
    
    const isResolved = resolvedBreakdown !== null && !resolvedBreakdown.hasConflict
    
    return {
      hasConflict: isResolved ? false : breakdown.hasConflict,
      canResolveWithReserve: breakdown.hasRoleTransition,
      hasReserve,
      driverActivities,
      ownerOnlyActivities,
      breakdown: isResolved ? resolvedBreakdown! : breakdown,
    }
  }, [scheduledActivities, hasReserveDriver])
  
  // Check for urgent deadlines
  const urgentActivities = useMemo(() => {
    if (!careerState) return []
    
    return scheduledActivities
      .filter(a => a.mandatory && a.deadline)
      .map(a => {
        const daysLeft = getDaysUntilDeadline(
          currentWeek,
          currentDay,
          a.deadline!.week,
          a.deadline!.day
        )
        return { activity: a, daysLeft }
      })
      .filter(a => a.daysLeft <= 3)
      .sort((a, b) => a.daysLeft - b.daysLeft)
  }, [scheduledActivities, careerState, currentWeek, currentDay])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 w-[400px] bg-[#1A1A1E] border-l border-surface-secondary shadow-2xl z-40 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-surface-secondary bg-surface-secondary/30 flex-shrink-0 max-h-[45%] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center
                  ${isToday ? 'bg-accent-blue/20' : isPast ? 'bg-surface-secondary' : 'bg-surface-secondary/50'}
                `}>
                  <Calendar className={`w-5 h-5 ${isToday ? 'text-accent-blue' : 'text-text-muted'}`} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg">
                    {dayName}
                  </h2>
                  <p className="text-sm text-text-muted">
                    Week {week}, Day {day}
                    {isToday && <Badge variant="blue" className="ml-2 text-xs">Today</Badge>}
                    {isPast && <Badge variant="default" className="ml-2 text-xs">Past</Badge>}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Race Info */}
            {race && (
              <div className="mt-3 p-3 rounded-xl bg-accent-red/10 border border-accent-red/30">
                <div className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-accent-red" />
                  <div className="flex-1">
                    <p className="font-medium text-accent-red">Race Weekend</p>
                    <p className="text-sm text-text-muted">
                      Round {race.round}: {race.trackName}
                    </p>
                  </div>
                  <Badge variant="red">
                    {race.layoutName}
                  </Badge>
                </div>
              </div>
            )}
            
            {/* Overloaded Day Warning */}
            {conflictInfo?.hasConflict && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 rounded-xl bg-status-error/10 border border-status-error/50"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-status-error">Overloaded Day</p>
                    <p className="text-sm text-text-muted mt-1">
                      Not enough hours including travel and transitions. 
                      {conflictInfo.breakdown.overflowHours > 0 && (
                        <span className="text-status-error font-medium"> {conflictInfo.breakdown.overflowHours.toFixed(1)}h over the limit.</span>
                      )}
                    </p>
                    <p className="text-xs text-accent-orange mt-1">
                      Completing all activities will cause extra stress and fatigue. Consider cancelling or rescheduling some.
                    </p>
                    
                    {/* Hours Breakdown */}
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Activities</span>
                        <span>{conflictInfo.breakdown.totalDuration}h</span>
                      </div>
                      {conflictInfo.breakdown.travelOverhead > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-text-muted">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            Travel ({conflictInfo.breakdown.locationGroups.filter(g => g !== 'virtual').length} locations)
                          </span>
                          <span>+{conflictInfo.breakdown.travelOverhead}h</span>
                        </div>
                      )}
                      {conflictInfo.breakdown.roleTransitionPenalty > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-text-muted">
                            <Users className="w-3 h-3 inline mr-1" />
                            Role switch (driver/owner)
                          </span>
                          <span>+{conflictInfo.breakdown.roleTransitionPenalty}h</span>
                        </div>
                      )}
                      {conflictInfo.breakdown.raceDayOverhead > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-text-muted">
                            <Flag className="w-3 h-3 inline mr-1" />
                            Race day prep
                          </span>
                          <span>+{conflictInfo.breakdown.raceDayOverhead}h</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t border-surface-secondary pt-1 font-medium">
                        <span className="text-status-error">Total</span>
                        <span className="text-status-error">{conflictInfo.breakdown.effectiveHours.toFixed(1)}h / 16h</span>
                      </div>
                    </div>
                    
                    {/* Role conflict detail */}
                    {conflictInfo.breakdown.hasRoleTransition && conflictInfo.driverActivities.length > 0 && conflictInfo.ownerOnlyActivities.length > 0 && (
                      <div className="mt-2 space-y-1 text-xs border-t border-surface-secondary pt-2">
                        <div className="flex items-center gap-2">
                          <Car className="w-3 h-3 text-accent-blue" />
                          <span>Driver: {conflictInfo.driverActivities.map(a => a.name).join(', ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3 text-accent-purple" />
                          <span>Owner: {conflictInfo.ownerOnlyActivities.map(a => a.name).join(', ')}</span>
                        </div>
                      </div>
                    )}
                    
                    {conflictInfo.canResolveWithReserve && !conflictInfo.hasReserve && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3 text-accent-blue border-accent-blue hover:bg-accent-blue/10"
                      >
                        <UserPlus className="w-3 h-3 mr-1" />
                        Hire Reserve Driver to Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Resolved Conflict */}
            {conflictInfo && !conflictInfo.hasConflict && conflictInfo.hasReserve && conflictInfo.canResolveWithReserve && (
              <div className="mt-3 p-3 rounded-xl bg-status-success/10 border border-status-success/30">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-status-success" />
                  <div className="flex-1">
                    <p className="font-medium text-status-success">Conflict Resolved</p>
                    <p className="text-sm text-text-muted">
                      Your reserve driver will handle driving duties while you attend meetings.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Urgent Deadlines */}
            {urgentActivities.length > 0 && !isPast && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 rounded-xl bg-accent-orange/10 border border-accent-orange/50"
              >
                <div className="flex items-start gap-3">
                  <Timer className="w-5 h-5 text-accent-orange flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-accent-orange">Urgent Deadlines</p>
                    <div className="mt-2 space-y-2">
                      {urgentActivities.map(({ activity, daysLeft }) => (
                        <div 
                          key={activity.id}
                          className={`text-sm flex items-center justify-between ${daysLeft <= 1 ? 'text-status-error' : 'text-text-secondary'}`}
                        >
                          <span>{activity.name}</span>
                          <Badge variant={daysLeft <= 1 ? 'destructive' : 'orange'} className="text-xs">
                            {daysLeft <= 0 ? 'TODAY!' : daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1 min-h-0">
            {/* Scheduled Activities -- grouped by time band */}
            {scheduledActivities.length > 0 && (() => {
              // Group activities by period
              const periodIcons: Record<DayPeriod, typeof Sunrise> = {
                morning: Sunrise, afternoon: SunIcon, evening: Sunset, night: MoonIcon2,
              }
              const currentHour = careerState?.dayBudget?.currentHour ?? 7
              const currentPeriod = isToday ? getPeriodForHour(currentHour) : null

              const groups = DAY_PERIOD_ORDER.map(period => ({
                period,
                config: DAY_PERIODS[period],
                activities: scheduledActivities.filter(a => a.scheduledPeriod === period),
              }))
              const anytimeActivities = scheduledActivities.filter(a => !a.scheduledPeriod)

              const renderActivityCard = (activity: ScheduledActivity) => {
                const Icon = getCategoryIcon(activity.category)
                const styles = getCategoryStyle(activity.category)
              const seriesChip = getSeriesChip(activity)
              const sessionCode = getSessionCode(activity)
                // Running-late badge: activity's scheduled period has passed
                const isRunningLate = isToday && activity.scheduledPeriod && currentPeriod
                  && DAY_PERIOD_ORDER.indexOf(currentPeriod) > DAY_PERIOD_ORDER.indexOf(activity.scheduledPeriod)
                  && activity.status === 'scheduled'

                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`
                      p-3 rounded-xl border cursor-pointer transition-all
                      ${activity.mandatory 
                        ? 'border-accent-orange/50 bg-accent-orange/5' 
                        : 'border-surface-secondary bg-surface-secondary/30'}
                      hover:border-accent-blue/50
                    `}
                    onClick={() => onViewActivity(activity)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg ${styles.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${styles.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{activity.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {sessionCode && (
                            <Badge variant="red" className="text-[10px] h-5">
                              {sessionCode}
                            </Badge>
                          )}
                          {seriesChip && (
                            <Badge
                              variant="outline"
                              className="text-[10px] h-5 border-accent-blue/40 text-accent-blue max-w-[150px]"
                              title={seriesChip}
                            >
                              <span className="truncate">{seriesChip}</span>
                            </Badge>
                          )}
                          {activity.mandatory && (
                            <span className="flex items-center gap-1 shrink-0" title="Required">
                              <AlertTriangle className="w-3.5 h-3.5 text-accent-orange" aria-hidden />
                              <span className="text-[10px] font-medium text-accent-orange uppercase tracking-wide hidden sm:inline">Required</span>
                            </span>
                          )}
                          {isRunningLate && (
                            <span className="text-[10px] font-medium text-accent-orange bg-accent-orange/15 px-1.5 py-0.5 rounded-full shrink-0">
                              Running Late
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-text-muted flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {activity.duration}h
                            {(activity.spanDays || 1) > 1 && (
                              <span className="text-accent-purple ml-1">
                                ({activity.spanDays} days)
                              </span>
                            )}
                          </span>
                          {activity.totalCost && activity.totalCost > 0 && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ${activity.totalCost.toLocaleString()}
                            </span>
                          )}
                          {activity.rescheduleCost && activity.rescheduleCost > 0 && (
                            <span className="flex items-center gap-1 text-accent-orange" title="Cost to reschedule">
                              <Calendar className="w-3 h-3" />
                              ${activity.rescheduleCost.toLocaleString()} to move
                            </span>
                          )}
                          {activity.configuration?.venueId && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {activity.configuration.venueName || 'Venue'}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
                    </div>
                    
                    {/* Action Buttons */}
                    {!isPast && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-surface-secondary">
                        {(() => {
                          const spanDays = activity.spanDays || 1
                          const dayIndex = day - activity.scheduledDay + 1
                          const thisDayAlreadyAttended = spanDays > 1 && (activity.completedDays || []).includes(dayIndex)
                          const canAttendToday = isToday && !thisDayAlreadyAttended
                          
                          // Period gating check
                          const actTimeCost = getActivityTimeCost(activity.templateId)
                          const periodCheck = isToday
                            ? canDoActivityInCurrentPeriod(actTimeCost.allowedPeriods, currentHour)
                            : { allowed: true, currentPeriod: 'morning' as DayPeriod }
                          const isPeriodBlocked = canAttendToday && !periodCheck.allowed
                          
                          if (canAttendToday && isPeriodBlocked) {
                            return (
                              <div className="flex-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled
                                  className="w-full opacity-50 cursor-not-allowed"
                                  title={periodCheck.reason || 'Not available now'}
                                >
                                  <Clock className="w-4 h-4 mr-1" />
                                  {periodCheck.reason || 'Not available now'}
                                </Button>
                              </div>
                            )
                          }
                          
                          return canAttendToday ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 text-status-success hover:bg-status-success/20"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onAttendEvent) {
                                  onAttendEvent(activity)
                                } else {
                                  onCompleteActivity(activity.id)
                                }
                              }}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              {onAttendEvent ? 'Attend Event' : 'Complete'}
                              {spanDays > 1 && ` (Day ${dayIndex}/${spanDays})`}
                            </Button>
                          ) : thisDayAlreadyAttended && isToday ? (
                            <span className="text-xs text-status-success flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              Day {dayIndex} attended
                            </span>
                          ) : null
                        })()}
                        {!activity.mandatory && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 text-status-error hover:bg-status-error/20"
                            onClick={(e) => {
                              e.stopPropagation()
                              onCancelActivity(activity.id)
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                        {(activity.canReschedule || ((activity.triggeredBy === 'after_car_purchase' || activity.triggeredBy === 'after_series_entry') && activity.deadline)) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 text-accent-blue hover:bg-accent-blue/20"
                            onClick={(e) => {
                              e.stopPropagation()
                              setRescheduleForActivity(rescheduleForActivity?.id === activity.id ? null : activity)
                              if (rescheduleForActivity?.id !== activity.id) {
                                setRescheduleWeek(activity.scheduledWeek)
                                setRescheduleDay(activity.scheduledDay)
                              }
                            }}
                          >
                            <Calendar className="w-4 h-4 mr-1" />
                            Reschedule
                          </Button>
                        )}
                      </div>
                    )}
                    {/* Reschedule picker */}
                    {rescheduleForActivity?.id === activity.id && (
                      <div className="mt-3 pt-3 border-t border-surface-secondary space-y-2" onClick={(e) => e.stopPropagation()}>
                        {(activity.rescheduleCost != null && activity.rescheduleCost > 0) && (
                          <p className="text-xs text-accent-orange">
                            Reschedule cost: ${Math.floor(activity.rescheduleCost * (1 + (activity.timesRescheduled || 0) * 0.5)).toLocaleString()}
                            {activity.timesRescheduled ? ` (fee increases each time; ${(activity.timesRescheduled || 0)} move(s) so far)` : ''}. Board mood may drop slightly.
                          </p>
                        )}
                        {(activity.deadline || activity.rescheduleDeadline) ? (
                          <p className="text-xs text-text-muted">
                            Must be before {activity.deadline && typeof activity.deadline === 'object'
                              ? `Week ${activity.deadline.week}, Day ${activity.deadline.day} (${getDayName(activity.deadline.day)})`
                              : `week ${activity.rescheduleDeadline}`}. New slot:
                          </p>
                        ) : (
                          <p className="text-xs text-text-muted">Select a new slot:</p>
                        )}
                        <div className="flex gap-2 items-center flex-wrap">
                          <label className="text-xs text-text-muted">Week</label>
                          <select
                            className="bg-surface-secondary border border-surface-border rounded px-2 py-1 text-sm"
                            value={rescheduleWeek}
                            onChange={(e) => setRescheduleWeek(Number(e.target.value))}
                          >
                            {(() => {
                              const maxWeek = activity.deadline && typeof activity.deadline === 'object'
                                ? activity.deadline.week
                                : (activity.rescheduleDeadline ?? currentWeek + 4)
                              return Array.from({ length: Math.max(0, maxWeek - currentWeek + 1) }, (_, i) => currentWeek + i).map((w) => (
                                <option key={w} value={w}>W{w}</option>
                              ))
                            })()}
                          </select>
                          <label className="text-xs text-text-muted">Day</label>
                          <select
                            className="bg-surface-secondary border border-surface-border rounded px-2 py-1 text-sm"
                            value={rescheduleDay}
                            onChange={(e) => setRescheduleDay(Number(e.target.value))}
                          >
                            {[1, 2, 3, 4, 5, 6, 7]
                              .filter(d => rescheduleWeek > currentWeek || d >= currentDay)
                              .map((d) => (
                              <option key={d} value={d}>{getDayName(d)}</option>
                            ))}
                          </select>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              const ok = rescheduleActivity(activity.id, rescheduleWeek, rescheduleDay)
                              if (ok) setRescheduleForActivity(null)
                            }}
                          >
                            Move
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setRescheduleForActivity(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              }

              return (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                    Schedule ({scheduledActivities.length})
                  </h3>
                  <div className="space-y-4">
                    {/* Period sections */}
                    {groups.map(({ period, config, activities: periodActivities }) => {
                      const PeriodIcon = periodIcons[period]
                      const totalHours = periodActivities.reduce((sum, a) => sum + (a.duration || 0), 0)
                      const isOverflowed = totalHours > config.hoursInPeriod
                      const overflow = totalHours - config.hoursInPeriod
                      const isCurrentPeriod = currentPeriod === period
                      const periodIdx = DAY_PERIOD_ORDER.indexOf(period)
                      const nextPeriod = periodIdx < DAY_PERIOD_ORDER.length - 1 ? DAY_PERIOD_ORDER[periodIdx + 1] : null
                      
                      return (
                        <div key={period}>
                          {/* Period Header */}
                          <div className={`flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg ${
                            isCurrentPeriod && isToday
                              ? 'bg-accent-blue/10 border border-accent-blue/25'
                              : 'bg-surface-secondary/40'
                          }`}>
                            <PeriodIcon className={`w-3.5 h-3.5 ${isCurrentPeriod && isToday ? 'text-accent-blue' : 'text-text-muted'}`} />
                            <span className={`text-xs font-semibold ${isCurrentPeriod && isToday ? 'text-accent-blue' : 'text-text-secondary'}`}>
                              {config.shortLabel}
                            </span>
                            <span className="text-[10px] text-text-muted">
                              {config.startHour > 12 ? config.startHour - 12 : config.startHour}
                              {config.startHour >= 12 ? 'pm' : 'am'}
                              {' - '}
                              {config.endHour > 12 ? config.endHour - 12 : config.endHour}
                              {config.endHour >= 12 ? 'pm' : 'am'}
                            </span>
                            <span className="ml-auto text-[10px] font-mono text-text-muted">
                              {totalHours}h / {config.hoursInPeriod}h
                            </span>
                            {isOverflowed && nextPeriod && (
                              <span className="text-[10px] text-accent-orange font-medium" title={`${overflow}h overflow into ${DAY_PERIODS[nextPeriod].shortLabel}`}>
                                +{overflow}h
                              </span>
                            )}
                          </div>
                          
                          {/* Activities in this period */}
                          {periodActivities.length > 0 ? (
                            <div className="space-y-2 ml-1">
                              {periodActivities.map(renderActivityCard)}
                            </div>
                          ) : (
                            <p className="text-[10px] text-text-muted/60 ml-6 mb-1">No activities</p>
                          )}
                        </div>
                      )
                    })}

                    {/* Anytime / Flexible */}
                    {anytimeActivities.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg bg-surface-secondary/40">
                          <Timer className="w-3.5 h-3.5 text-text-muted" />
                          <span className="text-xs font-semibold text-text-secondary">Flexible</span>
                          <span className="ml-auto text-[10px] font-mono text-text-muted">
                            {anytimeActivities.reduce((s, a) => s + (a.duration || 0), 0)}h
                          </span>
                        </div>
                        <div className="space-y-2 ml-1">
                          {anytimeActivities.map(renderActivityCard)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
            
            {/* Completed Activities */}
            {completedActivities.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                  Completed ({completedActivities.length})
                </h3>
                <div className="space-y-2">
                  {completedActivities.map(activity => {
                    const _Icon = getCategoryIcon(activity.category)
                    
                    return (
                      <div
                        key={activity.id}
                        className="p-3 rounded-xl border border-status-success/30 bg-status-success/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-status-success/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-status-success" />
                          </div>
                          <div className="flex-1">
                            <span className="font-medium">{activity.name}</span>
                            <p className="text-xs text-text-muted mt-0.5">
                              Completed Week {activity.completedWeek}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            {/* Missed Activities */}
            {missedActivities.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-status-error uppercase tracking-wider mb-3">
                  Missed ({missedActivities.length})
                </h3>
                <div className="space-y-2">
                  {missedActivities.map(activity => (
                    <div
                      key={activity.id}
                      className="p-3 rounded-xl border border-status-error/30 bg-status-error/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-status-error/20 flex items-center justify-center">
                          <XCircle className="w-4 h-4 text-status-error" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-status-error">{activity.name}</span>
                          <p className="text-xs text-text-muted mt-0.5">
                            {activity.missConsequences?.reputationPenalty && (
                              <span>Rep {activity.missConsequences.reputationPenalty}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Empty State */}
            {activities.length === 0 && !race && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-text-muted opacity-50" />
                <p className="text-text-muted mb-4">No activities scheduled</p>
                {!isPast && (
                  <Button variant="primary" size="sm" onClick={onAddActivity}>
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Activity
                  </Button>
                )}
              </div>
            )}
          </div>
          
          {/* Footer Actions */}
          {!isPast && (
            <div className="flex-shrink-0 p-4 border-t border-surface-secondary bg-[#1A1A1E]">
              <Button 
                variant="primary" 
                className="w-full"
                onClick={onAddActivity}
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule New Activity
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
