import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  Clock,
  Flag,
  Sun,
  Cloud,
  CloudRain,
  Trophy,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  Ruler,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Snowflake,
  Star,
  Users,
  Play,
  Plus,
  Handshake,
  Wrench,
  Newspaper,
  Heart,
  Car,
  Check,
  X,
  ClipboardList
} from 'lucide-react';
  borderColor: string; indicator: string; label: string; icon: string 
} {
  switch (type) {
    case 'personal':
      return { borderColor: 'border-l-status-success', indicator: 'bg-status-success', label: 'Your Time', icon: '⏱' }
    case 'team':
      return { borderColor: 'border-l-accent-blue', indicator: 'bg-accent-blue', label: 'Team (Passive)', icon: '📋' }
    case 'mandatory':
      return { borderColor: 'border-l-accent-red', indicator: 'bg-accent-red', label: 'Mandatory', icon: '⚠' }
    case 'travel':
      return { borderColor: 'border-l-accent-purple', indicator: 'bg-accent-purple', label: 'Travel', icon: '✈' }
    default:
      return { borderColor: 'border-l-surface-secondary', indicator: 'bg-surface-secondary', label: 'Activity', icon: '📌' }
  }
}

// Weekly Schedule View Component
interface WeeklyScheduleViewProps {
  currentWeek: number
  calendar: RaceEvent[]
  scheduledActivities: ScheduledActivity[]
  acceptedInvitations: InvitationalEvent[]
  onWeekSelect: (week: number) => void
  onActivityCancel: (activityId: string) => void
  onActivityComplete: (activityId: string) => void
}

function _WeeklyScheduleView({
  currentWeek,
  calendar,
  scheduledActivities,
  acceptedInvitations,
  onWeekSelect,
  onActivityCancel,
  onActivityComplete
}: WeeklyScheduleViewProps) {
  const weeksToShow = 8
  const startWeek = Math.max(1, currentWeek - 1)
  const weeks = Array.from({ length: weeksToShow }, (_, i) => startWeek + i)

  return (
    <Card variant="glass" padding="lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-accent-blue" />
          Team Schedule - Weeks {startWeek} to {startWeek + weeksToShow - 1}
        </h3>
      </div>

      <div className="space-y-3">
        {weeks.map(week => {
          const race = calendar.find(r => r.week === week)
          const weekActivities = scheduledActivities.filter(a => a.scheduledWeek === week)
          const invitationsThisWeek = acceptedInvitations.filter(inv => {
            return inv.week === week
          })
          const isPast = week < currentWeek
          const isCurrent = week === currentWeek
          const isRaceWeek = !!race

          return (
            <motion.div
              key={week}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (week - startWeek) * 0.05 }}
              className={`
                p-4 rounded-xl border transition-all cursor-pointer
                ${isCurrent 
                  ? 'border-accent-blue bg-accent-blue/10' 
                  : isPast 
                    ? 'border-surface-secondary bg-surface-secondary/30 opacity-60' 
                    : 'border-surface-secondary bg-surface-secondary/50 hover:border-accent-blue/50'}
              `}
              onClick={() => !isPast && onWeekSelect(week)}
            >
              {/* Week Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`
                    text-lg font-display font-bold
                    ${isCurrent ? 'text-accent-blue' : isPast ? 'text-text-muted' : 'text-text-primary'}
                  `}>
                    Week {week}
                  </span>
                  {isCurrent && (
                    <Badge variant="blue" className="text-xs">Current</Badge>
                  )}
                  {isRaceWeek && (
                    <Badge variant="red" className="text-xs">
                      <Flag className="w-3 h-3 mr-1" />
                      Race Week
                    </Badge>
                  )}
                </div>
                {!isPast && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onWeekSelect(week)
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                )}
              </div>

              {/* Race Info if applicable */}
              {race && (
                <div className="mb-3 p-2 rounded-lg bg-accent-red/10 border border-accent-red/30">
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-accent-red" />
                    <span className="font-medium text-sm">{race.trackName}</span>
                    <span className="text-xs text-text-muted">Round {race.round}</span>
                  </div>
                </div>
              )}

              {/* Scheduled Activities */}
              {weekActivities.length > 0 ? (
                <div className="space-y-2">
                  {weekActivities.map(activity => {
                    const template = ACTIVITY_TEMPLATES.find(t => t.id === activity.templateId)
                    if (!template) return null
                    const Icon = getActivityIcon(template.category)
                    const colorClass = getActivityColor(template.category)
                    const [textColor, bgColor] = colorClass.split(' ')

                    const entryTypeStyle = getCalendarEntryTypeStyle(activity.calendarEntryType)
                    const isPassiveTeam = activity.calendarEntryType === 'team'

                    return (
                      <div 
                        key={activity.id}
                        className={`
                          flex items-center justify-between p-2 rounded-lg border-l-4
                          ${bgColor} border border-surface-secondary
                          ${entryTypeStyle.borderColor}
                          ${isPassiveTeam ? 'opacity-70' : ''}
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-md ${bgColor} flex items-center justify-center`}>
                            <Icon className={`w-3.5 h-3.5 ${textColor}`} />
                          </div>
                          <div>
                            <span className="text-sm font-medium">{template.name}</span>
                            <span className="text-xs text-text-muted ml-2">
                              Day {activity.scheduledDay} • {template.duration}h
                              {isPassiveTeam && ' (no time cost)'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {activity.status === 'scheduled' && !isPast && (
                            <>
                              {isCurrent && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-status-success hover:bg-status-success/20"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onActivityComplete(activity.id)
                                  }}
                                  title="Complete activity"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-status-error hover:bg-status-error/20"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onActivityCancel(activity.id)
                                }}
                                title="Cancel activity"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {activity.status === 'completed' && (
                            <Badge variant="green" className="text-xs">Done</Badge>
                          )}
                          {activity.status === 'missed' && (
                            <Badge variant="red" className="text-xs">Missed</Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-sm text-text-muted italic">
                  {isPast ? 'No activities scheduled' : 'Click to schedule activities'}
                </div>
              )}

              {/* Invitational Events */}
              {invitationsThisWeek.length > 0 && (
                <div className="mt-2 space-y-2">
                  {invitationsThisWeek.map(inv => (
                    <div 
                      key={inv.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-accent-gold/10 border border-accent-gold/30"
                    >
                      <Star className="w-4 h-4 text-accent-gold" />
                      <span className="text-sm font-medium">{inv.name}</span>
                      <Badge variant="gold" className="text-xs">Invitational</Badge>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </Card>
  )
}

// Schedule Activity Modal Component
interface ScheduleActivityModalProps {
  week: number
  day: number
  currentYear: number
  availableActivities: ActivityTemplate[]
  existingActivities: ScheduledActivity[]
  calendar: RaceEvent[]
  currentWeek: number
  onSchedule: (templateId: string, day: number) => void
  onClose: () => void
}

// Helper to convert week/day to actual Date using the new week system
// Week 1 is a partial week from Jan 1 to first Sunday
// Weeks 2+ are full Mon-Sun weeks
function getDateFromWeekDay(week: number, dayOfWeek: number, startYear: number): Date {
  return getDateFromWeekAndDay(week, dayOfWeek, startYear)
}

function ScheduleActivityModal({
  week,
  day,
  currentYear,
  availableActivities,
  existingActivities,
  calendar,
  _currentWeek,
  onSchedule,
  onClose
}: ScheduleActivityModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<ActivityCategory | 'all'>('all')
  
  const race = calendar.find(r => r.week === week)
  const isRaceWeek = !!race
  
  // Filter activities
  const filteredActivities = availableActivities.filter(a => {
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false
    // Check race week compatibility
    if (isRaceWeek && !a.canScheduleOnRaceWeek) return false
    return true
  })

  const categories: { value: ActivityCategory | 'all', label: string }[] = [
    { value: 'all', label: 'All Activities' },
    { value: 'sponsor', label: 'Sponsor' },
    { value: 'team', label: 'Team' },
    { value: 'development', label: 'Development' },
    { value: 'media', label: 'Media' },
    { value: 'personal', label: 'Personal' },
    { value: 'maintenance', label: 'Maintenance' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#1A1A1E] border border-surface-secondary rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-surface-secondary">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-accent-blue" />
                Schedule Activity - Week {week}
              </h2>
              {isRaceWeek && race && (
                <p className="text-sm text-accent-red mt-1 flex items-center gap-1">
                  <Flag className="w-4 h-4" />
                  Race Week: {race.trackName}
                </p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex h-[60vh]">
          {/* Activity List */}
          <div className="w-1/2 border-r border-surface-secondary overflow-y-auto p-4">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map(cat => (
                <Button
                  key={cat.value}
                  variant={categoryFilter === cat.value ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setCategoryFilter(cat.value)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            {/* Activity List */}
            <div className="space-y-2">
              {filteredActivities.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  No activities available for this week
                </div>
              ) : (
                filteredActivities.map(activity => {
                  const Icon = getActivityIcon(activity.category)
                  const colorClass = getActivityColor(activity.category)
                  const [textColor, bgColor] = colorClass.split(' ')
                  const isSelected = selectedTemplate?.id === activity.id

                  return (
                    <motion.div
                      key={activity.id}
                      whileHover={{ scale: 1.01 }}
                      className={`
                        p-3 rounded-xl border cursor-pointer transition-all
                        ${isSelected 
                          ? 'border-accent-blue bg-accent-blue/10' 
                          : 'border-surface-secondary bg-surface-secondary/50 hover:border-accent-blue/50'}
                      `}
                      onClick={() => setSelectedTemplate(activity)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${textColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{activity.name}</h4>
                            {activity.baseCost > 0 && (
                              <Badge variant="red" className="text-xs">
                                ${(activity.baseCost / 1000).toFixed(0)}k
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-text-muted mt-1 line-clamp-2">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-text-muted flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {activity.duration}h
                            </span>
                            {activity.requiresDriver && (
                              <Badge variant="orange" className="text-xs">Driver Required</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>

          {/* Activity Details & Scheduling */}
          <div className="w-1/2 p-4 overflow-y-auto">
            {selectedTemplate ? (
              <div className="space-y-4">
                {/* Activity Header */}
                <div className="p-4 rounded-xl bg-surface-secondary/50">
                  <h3 className="font-display font-bold text-lg mb-2">{selectedTemplate.name}</h3>
                  <p className="text-sm text-text-muted">{selectedTemplate.description}</p>
                </div>

                {/* Effects on Complete */}
                <div className="p-4 rounded-xl bg-status-success/10 border border-status-success/30">
                  <h4 className="font-semibold text-sm flex items-center gap-2 mb-3 text-status-success">
                    <Check className="w-4 h-4" />
                    On Completion
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedTemplate.defaultEffectsOnComplete || {}).map(([key, value]) => {
                      if (value === 0 || value === undefined) return null
                      const isPositive = typeof value === 'number' && value > 0
                      return (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span className="text-text-muted capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className={isPositive ? 'text-status-success' : 'text-status-error'}>
                            {isPositive ? '+' : ''}{value}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Effects on Miss */}
                {selectedTemplate.defaultEffectsOnMiss && Object.values(selectedTemplate.defaultEffectsOnMiss).some(v => v !== 0) && (
                  <div className="p-4 rounded-xl bg-status-error/10 border border-status-error/30">
                    <h4 className="font-semibold text-sm flex items-center gap-2 mb-3 text-status-error">
                      <X className="w-4 h-4" />
                      If Missed
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedTemplate.defaultEffectsOnMiss || {}).map(([key, value]) => {
                        if (value === 0 || value === undefined) return null
                        const isPositive = typeof value === 'number' && value > 0
                        return (
                          <div key={key} className="flex items-center justify-between text-xs">
                            <span className="text-text-muted capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className={isPositive ? 'text-status-success' : 'text-status-error'}>
                              {isPositive ? '+' : ''}{value}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Scheduled Date Indicator */}
                <div className="p-4 rounded-xl bg-surface-secondary/50">
                  <h4 className="font-semibold text-sm mb-3">Scheduled Date</h4>
                  {(() => {
                    const templateSpanDays = selectedTemplate.spanDays || 1
                    const startDate = getDateFromWeekDay(week, day, currentYear)
                    
                    // Format options for dates
                    const fullDateFormat: Intl.DateTimeFormatOptions = { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    }
                    const shortDateFormat: Intl.DateTimeFormatOptions = { 
                      month: 'short', 
                      day: 'numeric' 
                    }
                    
                    // Check for conflicts on any affected days
                    const conflictDays: number[] = []
                    for (let d = day; d < day + templateSpanDays && d <= 7; d++) {
                      const isBlocked = existingActivities.some(a => {
                        const aSpan = a.spanDays || 1
                        const aStartDay = a.scheduledDay
                        const aEndDay = aStartDay + aSpan - 1
                        return a.status === 'scheduled' && d >= aStartDay && d <= aEndDay
                      })
                      if (isBlocked) conflictDays.push(d)
                    }
                    
                    // Check for week overflow
                    const wouldOverflowWeek = day + templateSpanDays - 1 > 7
                    const hasConflict = conflictDays.length > 0 || wouldOverflowWeek
                    
                    return (
                      <>
                        {/* Primary date display */}
                        <div className="text-center mb-3">
                          <div className="text-lg font-semibold text-text-primary">
                            {startDate.toLocaleDateString('en-US', fullDateFormat)}
                          </div>
                        </div>
                        
                        {/* Multi-day date row */}
                        {templateSpanDays > 1 && (
                          <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
                            {Array.from({ length: templateSpanDays }).map((_, idx) => {
                              const dayNum = day + idx
                              const actualDate = getDateFromWeekDay(week, dayNum, currentYear)
                              const isOverflow = dayNum > 7
                              const isConflict = conflictDays.includes(dayNum)
                              
                              return (
                                <div key={idx} className="flex items-center">
                                  <div 
                                    className={`
                                      px-3 py-2 rounded-lg text-center
                                      ${isOverflow 
                                        ? 'bg-status-error/20 text-status-error border border-status-error/30'
                                        : isConflict
                                          ? 'bg-status-warning/20 text-status-warning border border-status-warning/30'
                                          : 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30'
                                      }
                                    `}
                                  >
                                    <div className="text-xs font-medium">
                                      {isOverflow ? 'Overflow' : actualDate.toLocaleDateString('en-US', shortDateFormat)}
                                    </div>
                                    <div className="text-[10px] opacity-75">
                                      {isOverflow ? 'Next Week' : getDayName(dayNum).slice(0, 3)}
                                    </div>
                                  </div>
                                  {idx < templateSpanDays - 1 && (
                                    <ChevronRight className="w-4 h-4 text-text-muted mx-1" />
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                        
                        {/* Duration info */}
                        <p className="text-xs text-text-muted text-center">
                          {templateSpanDays > 1 
                            ? `Duration: ${selectedTemplate.duration}h/day × ${templateSpanDays} days`
                            : `Duration: ${selectedTemplate.duration} ${selectedTemplate.duration === 1 ? 'hour' : 'hours'}`}
                        </p>
                        
                        {/* Conflict warning */}
                        {hasConflict && (
                          <div className="mt-3 p-2 rounded-lg bg-status-error/10 border border-status-error/20">
                            <div className="flex items-center gap-2 text-status-error text-sm">
                              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                              <span>
                                {wouldOverflowWeek 
                                  ? 'This activity would extend into the next week'
                                  : `Conflict detected on ${conflictDays.length} day(s)`
                                }
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>

                {/* Schedule Button */}
                <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={() => {
                    onSchedule(selectedTemplate.id, day)
                    onClose()
                  }}
                  disabled={(() => {
                    const templateSpanDays = selectedTemplate.spanDays || 1
                    // Check for conflicts
                    for (let d = day; d < day + templateSpanDays && d <= 7; d++) {
                      const isBlocked = existingActivities.some(a => {
                        const aSpan = a.spanDays || 1
                        const aStartDay = a.scheduledDay
                        const aEndDay = aStartDay + aSpan - 1
                        return a.status === 'scheduled' && d >= aStartDay && d <= aEndDay
                      })
                      if (isBlocked) return true
                    }
                    // Check for week overflow
                    return day + templateSpanDays - 1 > 7
                  })()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule {selectedTemplate.name}
                </Button>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted">
                <div className="text-center">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select an activity to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function Calendar() {
  const navigate = useNavigate()
  const { 
    careerState, 
    player, 
    _getAcceptedInvitations,
    getScheduledActivities,
    getAvailableActivities,
    getMandatoryActivities,
    scheduleActivity,
    scheduleConfiguredActivity,
    cancelActivity,
    completeActivity
  } = useCareerStore()
  const { series, seasonStandings, getSeriesById, getRivalsInSeries, initializeWorld } = useRivalStore()
  const [selectedRound, setSelectedRound] = useState<RaceEvent | null>(null)
  const [_selectedInvitational, _setSelectedInvitational] = useState<InvitationalEvent | null>(null)
  const [selectedWeekForScheduling, setSelectedWeekForScheduling] = useState<number | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedActivityTemplate, setSelectedActivityTemplate] = useState<ActivityTemplate | null>(null)
  
  // Monthly calendar state
  const [selectedDayForDetail, setSelectedDayForDetail] = useState<{ week: number; day: number } | null>(null)
  const [showDayDetail, setShowDayDetail] = useState(false)
  const [showActivityConfig, setShowActivityConfig] = useState(false)
  const [configWeek, setConfigWeek] = useState<number>(1)
  const [configDay, setConfigDay] = useState<number>(1)
  
  // Event gameplay state
  const [selectedActivityForGameplay, setSelectedActivityForGameplay] = useState<ScheduledActivity | null>(null)
  const [showGameplayModal, setShowGameplayModal] = useState(false)
  
  // Scroll ref for calendar
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Initialize world if not done yet
  useEffect(() => {
    if (series.length === 0) {
      initializeWorld()
    }
  }, [series.length, initializeWorld])

  if (!careerState || !player) return null

  // Determine if this is owner mode
  const isOwnerMode = !!careerState.ownedTeam
  const ownerSeriesEntries = careerState.seriesEntries || []
  
  // Get current series - from player contract OR from owned team's series entries
  const currentSeries = useMemo(() => {
    // For driver mode, use player's current series
    if (player.currentSeriesId) {
      return getSeriesById(player.currentSeriesId)
    }
    // For owner mode, get the first series the team has entered
    if (isOwnerMode && ownerSeriesEntries.length > 0) {
      return getSeriesById(ownerSeriesEntries[0].seriesId)
    }
    return null
  }, [player.currentSeriesId, isOwnerMode, ownerSeriesEntries, getSeriesById])
  
  const currentWeek = careerState.currentWeek
  const calendar = currentSeries?.calendar ?? []
  const standings = currentSeries ? seasonStandings[currentSeries.id] ?? [] : []

  // Get rivals for standings display
  const seriesRivals = currentSeries ? getRivalsInSeries(currentSeries.id) : []

  // Find the current/next race
  const currentRace = calendar.find(r => r.week === currentWeek)
  
  // Auto-select current or next race on load
  useEffect(() => {
    if (!selectedRound && calendar.length > 0) {
      const next = calendar.find(r => r.week >= currentWeek) || calendar[calendar.length - 1]
      setSelectedRound(next)
      
      // Scroll to it
      if (scrollContainerRef.current) {
        // Simple timeout to wait for render
        setTimeout(() => {
          const index = calendar.indexOf(next)
          if (index > 0 && scrollContainerRef.current) {
            const cardWidth = 320 // Approx width + gap
            scrollContainerRef.current.scrollTo({
              left: (index * cardWidth) - 100,
              behavior: 'smooth'
            })
          }
        }, 500)
      }
    }
  }, [calendar, currentWeek, selectedRound])

  // Generate weather (deterministic based on track and week)
  const getWeather = (trackId: string, week: number) => {
    const hash = (trackId.charCodeAt(0) + week) % 3
    return hash === 0 ? 'sun' : hash === 1 ? 'cloud' : 'rain'
  }

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'sun': return <Sun className="w-4 h-4 text-accent-orange" />
      case 'cloud': return <Cloud className="w-4 h-4 text-text-muted" />
      case 'rain': return <CloudRain className="w-4 h-4 text-status-info" />
      default: return <Sun className="w-4 h-4" />
    }
  }

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'Brazil': '🇧🇷', 'Germany': '🇩🇪', 'UK': '🇬🇧', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      'Belgium': '🇧🇪', 'Italy': '🇮🇹', 'Australia': '🇦🇺', 'Japan': '🇯🇵',
      'USA': '🇺🇸', 'France': '🇫🇷', 'Spain': '🇪🇸', 'Austria': '🇦🇹',
      'Netherlands': '🇳🇱', 'Portugal': '🇵🇹', 'Monaco': '🇲🇨', 'Canada': '🇨🇦',
      'Argentina': '🇦🇷', 'South Africa': '🇿🇦',
      'Finland': '🇫🇮', 'Norway': '🇳🇴', 'Czech Republic': '🇨🇿',
      'Switzerland': '🇨🇭', 'Ecuador': '🇪🇨', 'Poland': '🇵🇱',
    }
    return flags[country] ?? '🏁'
  }

  // Get player's race result for a round
  const getPlayerResult = (round: number) => {
    return (player.raceHistory ?? []).find(r => 
      r.seriesId === currentSeries?.id && r.round === round
    )
  }

  // Get selected track youtube ID
  const selectedTrackInfo = selectedRound ? getTrackById(selectedRound.trackId) : null
  const selectedVideoId = selectedTrackInfo?.youtubeId

  return (
    <div className="space-y-6">
      <GameSectionHeader
        title={isOwnerMode ? "TEAM CALENDAR" : "RACE CALENDAR"}
        subtitle={isOwnerMode 
          ? `${careerState.ownedTeam?.name || 'Your Team'} - ${careerState.currentYear} Season${currentSeries ? ` • ${currentSeries.name}` : ''}`
          : currentSeries 
            ? `${currentSeries.name} - ${careerState.currentYear} Season` 
            : 'No championship selected'}
        accent="blue"
        rightElement={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2">
              <span className="text-text-muted text-sm">Week:</span>
              <span className="font-mono font-bold text-lg">{currentWeek}</span>
              <span className="text-text-muted text-sm">/ 52</span>
            </div>
            {currentRace && (
              <>
                <RaceReadinessWidget compact />
                <Badge variant="red" size="lg">
                  <Flag className="w-3 h-3 mr-1" />
                  Race Week!
                </Badge>
              </>
            )}
          </div>
        }
      />

      {/* No Championship Warning - Only show for driver mode */}
      {!isOwnerMode && !currentSeries && (
        <Card variant="glass" padding="lg">
          <div className="flex items-center gap-4 p-4 bg-status-warning/10 border border-status-warning/30 rounded-xl">
            <AlertCircle className="w-8 h-8 text-status-warning" />
            <div className="flex-1">
              <h3 className="font-medium text-status-warning">No Championship Selected</h3>
              <p className="text-sm text-text-muted">
                You need to sign a contract with a team to view the race calendar.
              </p>
            </div>
            <Button variant="primary" onClick={() => navigate('/contracts')}>
              Find a Team
            </Button>
          </div>
        </Card>
      )}

      {/* Calendar Tabs - Always show for owners, require series for drivers */}
      {(isOwnerMode || currentSeries) && (
        <Tabs defaultValue={isOwnerMode ? "schedule" : "calendar"}>
          <TabsList className="mb-6">
            {/* Team Schedule is primary for owners */}
            {isOwnerMode && (
              <TabsTrigger value="schedule">
                <ClipboardList className="w-4 h-4 mr-1" />
                Team Schedule
              </TabsTrigger>
            )}
            {/* Race Calendar - show if in a series */}
            {currentSeries && (
              <TabsTrigger value="calendar">
                <CalendarIcon className="w-4 h-4 mr-1" />
                Race Calendar ({calendar.length} Rounds)
              </TabsTrigger>
            )}
            {/* Team Schedule for non-owners */}
            {!isOwnerMode && (
              <TabsTrigger value="schedule">
                <ClipboardList className="w-4 h-4 mr-1" />
                Team Schedule
              </TabsTrigger>
            )}
            {/* Standings - only if in a series */}
            {currentSeries && (
              <TabsTrigger value="standings">Championship Standings</TabsTrigger>
            )}
          </TabsList>

          {/* Race Calendar Tab - only when in a series */}
          {currentSeries && (
          <TabsContent value="calendar" className="space-y-8">
            {/* Selected Round Highlight (Hero) */}
            <AnimatePresence mode="wait">
              {selectedRound && (
                <motion.div
                  key={selectedRound.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-8"
                >
                  <GameCard
                    title={`Round ${selectedRound.round}: ${selectedRound.trackName}`}
                    subtitle={`${selectedRound.layoutName} • ${selectedRound.country}`}
                    image={findTrackImageFromManifest(selectedRound.trackName, selectedRound.layoutName) || getTrackImage(selectedRound.trackName, selectedRound.layoutName)}
                    videoId={selectedVideoId}
                    aspectRatio="wide"
                    variant="hero"
                    selected={true}
                    action={
                      selectedRound.week === currentWeek && (
                        <Button 
                          variant="primary" 
                          size="lg"
                          onClick={() => navigate('/race-day')}
                        >
                          <Play className="w-5 h-5 mr-2" />
                          START RACE WEEKEND
                        </Button>
                      )
                    }
                    footer={
                      <div className="w-full grid grid-cols-4 gap-6 p-2">
                        <div>
                          <p className="text-xs text-text-muted uppercase mb-1">Schedule</p>
                          <p className="font-bold flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-accent-blue" />
                            Week {selectedRound.week}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-text-muted uppercase mb-1">Circuit Length</p>
                          <p className="font-bold flex items-center gap-2">
                            <Ruler className="w-4 h-4 text-accent-orange" />
                            {selectedRound.lengthKm.toFixed(2)} km
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-text-muted uppercase mb-1">Forecast</p>
                          <p className="font-bold flex items-center gap-2">
                            {getWeatherIcon(getWeather(selectedRound.trackId, selectedRound.week))}
                            {getWeather(selectedRound.trackId, selectedRound.week).toUpperCase()}
                          </p>
                        </div>
                        {getPlayerResult(selectedRound.round) && (
                          <div>
                            <p className="text-xs text-text-muted uppercase mb-1">Result</p>
                            <Badge variant="gold">
                              P{getPlayerResult(selectedRound.round)!.racePosition}
                            </Badge>
                          </div>
                        )}
                      </div>
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Horizontal Scrollable Calendar */}
            <div className="relative">
              <div 
                ref={scrollContainerRef}
                className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-accent-red/20 scrollbar-track-transparent"
                style={{ scrollPaddingLeft: '2rem', scrollPaddingRight: '2rem' }}
              >
                {calendar.map((race, _index) => {
                  const isPast = race.week < currentWeek
                  const isCurrent = race.week === currentWeek
                  const isSelected = selectedRound?.id === race.id
                  const _weather = getWeather(race.trackId, race.week)
                  const result = getPlayerResult(race.round)
                  const _trackInfo = getTrackById(race.trackId)

                  return (
                    <div 
                      key={race.id} 
                      className="snap-start flex-shrink-0 w-80"
                      onClick={() => setSelectedRound(race)}
                    >
                      <GameCard
                        title={`R${race.round}`}
                        subtitle={race.trackName}
                        image={findTrackImageFromManifest(race.trackName, race.layoutName) || getTrackImage(race.trackName, race.layoutName)}
                        // videoId={trackInfo?.youtubeId} // Don't auto-play all of them, too heavy
                        aspectRatio="video"
                        selected={isSelected}
                        disabled={false}
                        className={isPast ? 'opacity-70 grayscale hover:grayscale-0' : ''}
                        badges={
                          <>
                            {isCurrent && <Badge variant="red" size="sm">CURRENT</Badge>}
                            {isPast && <Badge variant="default" size="sm">COMPLETED</Badge>}
                            {result && <Badge variant="gold" size="sm">P{result.racePosition}</Badge>}
                          </>
                        }
                        footer={
                          <div className="w-full flex justify-between">
                            <span className="flex items-center gap-1">
                              {getCountryFlag(race.country)} {race.country}
                            </span>
                            <span className="flex items-center gap-1 text-text-muted">
                              <CalendarIcon className="w-3 h-3" /> W{race.week}
                            </span>
                          </div>
                        }
                      />
                    </div>
                  )
                })}
              </div>
              
              {/* Fade edges */}
              <div className="absolute top-0 bottom-6 left-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
              <div className="absolute top-0 bottom-6 right-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            </div>
          </TabsContent>
          )}

          {/* Team Schedule Tab - Now with Monthly Calendar Grid */}
          <TabsContent value="schedule" className="space-y-6">
            {/* Monthly Calendar Grid */}
            <MonthlyCalendarGrid
              currentWeek={currentWeek}
              currentDay={careerState.currentDay ?? 1}
              currentYear={careerState.currentYear}
              calendar={calendar}
              scheduledActivities={getScheduledActivities()}
              mandatoryActivities={getMandatoryActivities()}
              onDayClick={(week, day) => {
                setSelectedDayForDetail({ week, day })
                setShowDayDetail(true)
              }}
              onAddActivity={(week, day) => {
                setConfigWeek(week)
                setConfigDay(day)
                // Show activity selection first
                setSelectedWeekForScheduling(week)
                setShowScheduleModal(true)
              }}
            />

            {/* Day Detail Panel */}
            <DayDetailPanel
              isOpen={showDayDetail}
              week={selectedDayForDetail?.week ?? currentWeek}
              day={selectedDayForDetail?.day ?? 1}
              activities={getScheduledActivities(selectedDayForDetail?.week).filter(
                a => a.scheduledDay === selectedDayForDetail?.day
              )}
              race={calendar.find(r => r.week === selectedDayForDetail?.week)}
              currentWeek={currentWeek}
              currentDay={careerState.currentDay ?? 1}
              onClose={() => {
                setShowDayDetail(false)
                setSelectedDayForDetail(null)
              }}
              onAddActivity={() => {
                if (selectedDayForDetail) {
                  setConfigWeek(selectedDayForDetail.week)
                  setConfigDay(selectedDayForDetail.day)
                  setSelectedWeekForScheduling(selectedDayForDetail.week)
                  setShowScheduleModal(true)
                }
              }}
              onCompleteActivity={completeActivity}
              onCancelActivity={cancelActivity}
              onViewActivity={(activity) => {
                console.log('View activity:', activity)
                // Could open a detail modal here
              }}
              onAttendEvent={(activity) => {
                setSelectedActivityForGameplay(activity)
                setShowGameplayModal(true)
              }}
            />
            
            {/* Event Gameplay Modal */}
            <EventGameplayModal
              isOpen={showGameplayModal}
              activity={selectedActivityForGameplay}
              teamContext={{
                teamName: careerState.ownedTeam?.name || `${player?.firstName || ''} ${player?.lastName || ''}`.trim() || 'Your Team',
                reputation: player?.reputation || 50,
                sponsors: careerState.ownedTeam?.finances?.sponsors || [],
                staff: careerState.ownedTeam?.staff || [],
                drivers: careerState.ownedTeam?.drivers || []
              }}
              onComplete={(_activityId, gameplayEffects) => {
                if (selectedActivityForGameplay) {
                  // Complete the activity with gameplay-modified effects (includes base + gameplay bonuses)
                  completeActivity(selectedActivityForGameplay.id, gameplayEffects)
                  console.log('[Calendar] Activity completed with gameplay effects:', gameplayEffects)
                }
                setShowGameplayModal(false)
                setSelectedActivityForGameplay(null)
              }}
              onCancel={() => {
                setShowGameplayModal(false)
                setSelectedActivityForGameplay(null)
              }}
            />

            {/* Legacy Schedule Activity Modal - for activity selection */}
            <AnimatePresence>
              {showScheduleModal && selectedWeekForScheduling && (
                <ScheduleActivityModal
                  week={selectedWeekForScheduling}
                  day={configDay}
                  currentYear={careerState.currentYear}
                  availableActivities={getAvailableActivities()}
                  existingActivities={getScheduledActivities(selectedWeekForScheduling)}
                  calendar={calendar}
                  currentWeek={currentWeek}
                  onSchedule={(templateId, scheduledDay) => {
                    // For now, use the simple scheduling
                    // In full implementation, this would open ActivityConfigModal
                    const template = ACTIVITY_TEMPLATES.find(t => t.id === templateId)
                    if (template?.isConfigurable) {
                      setSelectedActivityTemplate(template)
                      setConfigWeek(selectedWeekForScheduling)
                      setConfigDay(scheduledDay)
                      setShowScheduleModal(false)
                      setShowActivityConfig(true)
                    } else {
                      scheduleActivity(templateId, selectedWeekForScheduling, scheduledDay)
                      setShowScheduleModal(false)
                      setSelectedWeekForScheduling(null)
                    }
                  }}
                  onClose={() => {
                    setShowScheduleModal(false)
                    setSelectedWeekForScheduling(null)
                  }}
                />
              )}
            </AnimatePresence>

            {/* Full Activity Configuration Modal */}
            <ActivityConfigModal
              isOpen={showActivityConfig}
              activityTemplate={selectedActivityTemplate || undefined}
              week={configWeek}
              day={configDay}
              onClose={() => {
                setShowActivityConfig(false)
                setSelectedActivityTemplate(null)
              }}
              onSchedule={(templateId, week, day, config) => {
                scheduleConfiguredActivity(templateId, week, day, config)
                setShowActivityConfig(false)
                setSelectedActivityTemplate(null)
              }}
            />
          </TabsContent>

          {/* Standings Tab - only when in a series */}
          {currentSeries && (
          <TabsContent value="standings">
            <Card variant="glass" padding="lg">
              <CardHeader 
                title="Championship Standings" 
                subtitle={`${currentSeries.name} - ${careerState.currentYear}`}
              />
              
              {standings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-text-muted text-sm border-b border-surface-border">
                        <th className="pb-3 pl-2 w-12">Pos</th>
                        <th className="pb-3">Driver</th>
                        <th className="pb-3 text-center w-16">Form</th>
                        <th className="pb-3 text-center w-16">Races</th>
                        <th className="pb-3 text-center w-16">Wins</th>
                        <th className="pb-3 text-center w-16">Podiums</th>
                        <th className="pb-3 text-center w-16">Best</th>
                        <th className="pb-3 text-center w-16">Avg</th>
                        <th className="pb-3 text-right pr-2 w-20">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((standing, index) => {
                        const isPlayer = standing.isPlayer || standing.driverName === `${player.firstName} ${player.lastName}`
                        const leaderPoints = standings[0]?.points || 0
                        const gapToLeader = index === 0 ? 0 : leaderPoints - standing.points
                        
                        // Find the rival driver to get form data
                        const rivalDriver = seriesRivals.find(r => 
                          `${r.firstName} ${r.lastName}` === standing.driverName
                        )
                        
                        return (
                          <tr 
                            key={standing.driverId || standing.driverName}
                            className={`
                              border-b border-surface-border/50 transition-colors
                              ${isPlayer ? 'bg-accent-red/10 hover:bg-accent-red/20' : 'hover:bg-surface/50'}
                            `}
                          >
                            <td className="py-3 pl-2">
                              <div className="flex items-center gap-1">
                                <span className={`
                                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                  ${index === 0 ? 'bg-accent-gold text-black' : ''}
                                  ${index === 1 ? 'bg-gray-400 text-black' : ''}
                                  ${index === 2 ? 'bg-amber-700 text-white' : ''}
                                  ${index > 2 ? 'bg-surface-secondary' : ''}
                                `}>
                                  {standing.position}
                                </span>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <span className={isPlayer ? 'font-bold text-accent-red' : ''}>
                                  {standing.driverName || 'Unknown Driver'}
                                </span>
                                {isPlayer && (
                                  <Badge variant="red" size="sm">You</Badge>
                                )}
                              </div>
                              {gapToLeader > 0 && (
                                <span className="text-xs text-text-muted">-{gapToLeader} pts</span>
                              )}
                            </td>
                            <td className="py-3 text-center">
                              {!isPlayer && rivalDriver ? (
                                <FormIndicator driver={rivalDriver} />
                              ) : isPlayer ? (
                                <span className="text-xs text-text-muted">-</span>
                              ) : (
                                <span className="text-xs text-text-muted">-</span>
                              )}
                            </td>
                            <td className="py-3 text-center font-mono text-sm">{standing.races}</td>
                            <td className="py-3 text-center font-mono text-sm">
                              {standing.wins > 0 ? (
                                <span className="text-accent-gold font-bold">{standing.wins}</span>
                              ) : (
                                <span className="text-text-muted">0</span>
                              )}
                            </td>
                            <td className="py-3 text-center font-mono text-sm">
                              {standing.podiums > 0 ? (
                                <span className="text-status-success">{standing.podiums}</span>
                              ) : (
                                <span className="text-text-muted">0</span>
                              )}
                            </td>
                            <td className="py-3 text-center font-mono text-sm">
                              P{standing.bestFinish}
                            </td>
                            <td className="py-3 text-center font-mono text-sm text-text-muted">
                              {standing.avgFinish.toFixed(1)}
                            </td>
                            <td className="py-3 text-right pr-2">
                              <span className={`font-mono font-bold text-lg ${index === 0 ? 'text-accent-gold' : ''}`}>
                                {standing.points}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-text-muted">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No championship data yet</p>
                  <p className="text-sm mt-1">Complete races to see standings update from telemetry</p>
                </div>
              )}
            </Card>
          </TabsContent>
          )}

        </Tabs>
      )}
    </div>
  )
}

function _TrophySvg({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
}

/**
 * Form Indicator Component
 * Shows visual representation of a driver's current form/streak
 */
function FormIndicator({ driver }: { driver: RivalDriver }) {
  const form = driver.currentForm || 0
  const streak = driver.formStreak || 0
  
  // Determine form state
  const isHot = streak >= 2 || form > 0.05
  const isCold = streak <= -2 || form < -0.05
  const isNeutral = !isHot && !isCold
  
  // Get streak icons (show consecutive results)
  const _getStreakIcons = () => {
    const absStreak = Math.abs(streak)
    if (absStreak < 2) return null
    
    const icons = []
    for (let i = 0; i < Math.min(absStreak, 3); i++) {
      if (streak > 0) {
        icons.push(<TrendingUp key={i} className="w-3 h-3 text-status-success" />)
      } else {
        icons.push(<TrendingDown key={i} className="w-3 h-3 text-status-error" />)
      }
    }
    return icons
  }
  
  return (
    <div className="flex items-center justify-center gap-1">
      {isHot && (
        <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-status-success/20 rounded text-status-success" title={`Hot streak: +${form.toFixed(2)} form`}>
          <Flame className="w-3.5 h-3.5" />
          {streak >= 2 && <span className="text-xs font-bold">{streak}</span>}
        </div>
      )}
      {isCold && (
        <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-status-error/20 rounded text-status-error" title={`Cold streak: ${form.toFixed(2)} form`}>
          <Snowflake className="w-3.5 h-3.5" />
          {streak <= -2 && <span className="text-xs font-bold">{Math.abs(streak)}</span>}
        </div>
      )}
      {isNeutral && (
        <div className="flex items-center px-1.5 py-0.5 bg-surface/50 rounded text-text-muted" title="Neutral form">
          <Minus className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  )
}
