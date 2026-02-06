/**
 * DayDetailPanel
 * Expandable panel showing full details for a selected day
 * Displays all activities, race info, and allows scheduling
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useMemo } from 'react'
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
  _ShieldAlert
} from 'lucide-react'
import { Button, Badge } from '@/components/ui';
  const styles: Record<ActivityCategory, { text: string; bg: string }> = {
    sponsor: { text: 'text-accent-gold', bg: 'bg-accent-gold/20' },
    team: { text: 'text-accent-blue', bg: 'bg-accent-blue/20' },
    development: { text: 'text-accent-purple', bg: 'bg-accent-purple/20' },
    media: { text: 'text-accent-orange', bg: 'bg-accent-orange/20' },
    personal: { text: 'text-status-success', bg: 'bg-status-success/20' },
    race: { text: 'text-accent-red', bg: 'bg-accent-red/20' },
    maintenance: { text: 'text-text-muted', bg: 'bg-surface-secondary' },
    lifestyle: { text: 'text-status-success', bg: 'bg-status-success/20' }
  }
  return styles[category] || { text: 'text-text-muted', bg: 'bg-surface-secondary' }
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
  const { hasReserveDriver, careerState } = useCareerStore()
  
  const isPast = week < currentWeek || (week === currentWeek && day < currentDay)
  const isToday = week === currentWeek && day === currentDay
  const dayName = getDayName(day)
  
  const scheduledActivities = activities.filter(a => a.status === 'scheduled')
  const completedActivities = activities.filter(a => a.status === 'completed')
  const missedActivities = activities.filter(a => a.status === 'missed')
  
  // Check for driver/owner conflicts
  const conflictInfo = useMemo(() => {
    if (scheduledActivities.length < 2) return null
    
    const driverActivities = scheduledActivities.filter(a => a.requiresDriver)
    const ownerOnlyActivities = scheduledActivities.filter(a => a.requiresOwner && !a.requiresDriver)
    
    if (driverActivities.length > 0 && ownerOnlyActivities.length > 0) {
      const canResolve = hasReserveDriver()
      return {
        hasConflict: !canResolve,
        canResolveWithReserve: true,
        hasReserve: canResolve,
        driverActivities,
        ownerOnlyActivities
      }
    }
    return null
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
          className="fixed right-0 top-0 bottom-0 w-[400px] bg-[#1A1A1E] border-l border-surface-secondary shadow-2xl z-40 overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-surface-secondary bg-surface-secondary/30">
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
            
            {/* Conflict Warning */}
            {conflictInfo?.hasConflict && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 rounded-xl bg-status-error/10 border border-status-error/50"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-status-error">Scheduling Conflict!</p>
                    <p className="text-sm text-text-muted mt-1">
                      You can't be the driver AND attend owner duties on the same day.
                    </p>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <Car className="w-3 h-3 text-accent-blue" />
                        <span>Driver: {conflictInfo.driverActivities.map(a => a.name).join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-accent-purple" />
                        <span>Owner: {conflictInfo.ownerOnlyActivities.map(a => a.name).join(', ')}</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 text-accent-blue border-accent-blue hover:bg-accent-blue/10"
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Hire Reserve Driver to Resolve
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Resolved Conflict */}
            {conflictInfo && !conflictInfo.hasConflict && conflictInfo.hasReserve && (
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
          <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 180px)' }}>
            {/* Scheduled Activities */}
            {scheduledActivities.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                  Scheduled ({scheduledActivities.length})
                </h3>
                <div className="space-y-2">
                  {scheduledActivities.map(activity => {
                    const Icon = getCategoryIcon(activity.category)
                    const styles = getCategoryStyles(activity.category)
                    
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
                              {activity.mandatory && (
                                <AlertTriangle className="w-3.5 h-3.5 text-accent-orange flex-shrink-0" />
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
                            {isToday && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex-1 text-status-success hover:bg-status-success/20"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Use gameplay modal if available, otherwise quick complete
                                  if (onAttendEvent) {
                                    onAttendEvent(activity)
                                  } else {
                                    onCompleteActivity(activity.id)
                                  }
                                }}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                {onAttendEvent ? 'Attend Event' : 'Complete'}
                              </Button>
                            )}
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
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}
            
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
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-surface-secondary bg-[#1A1A1E]">
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
