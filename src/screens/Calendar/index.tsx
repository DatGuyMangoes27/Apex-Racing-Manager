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
import { useNavigate } from 'react-router-dom';
// UI components replaced with custom styled elements
import { getDriverPortrait } from '@/utils/generated-assets';
import { useCareerStore, ACTIVITY_TEMPLATES, getDayName } from '@/store/careerStore';
import type { ScheduledActivity, ActivityTemplate, ActivityCategory } from '@/store/careerStore';
import { useRivalStore } from '@/store/rivalStore';
import type { RaceEvent, RivalDriver } from '@/store/rivalStore';
import type { InvitationalEvent } from '@/store/careerStore';
import { getTrackById } from '@/data/ams2-tracks';
import { findTrackImageFromManifest, getTrackImage } from '@/utils/images';
import { getDateFromWeekAndDay } from '@/utils/calendar';
import { RaceReadinessWidget } from '@/components/owner';
import { MonthlyCalendarGrid, DayDetailPanel, EventGameplayModal, ActivityConfigModal, ActivityDetailModal, ActivityCompletionModal, ActivityOutcomeModal } from './components';
import type { ActivityOutcomeData, DisplayableEffect, BonusBreakdown, MeterChange } from './components';
import type { ActivityOutcomeContext } from '@/services/eventContentGenerator';
import { getSocialActionById, getCombinedBonusMultiplier, getLoveLanguageMultiplier, getInterestBonusMultiplier } from '@/data/social-actions-config';
import { InterviewModal } from '@/components/media';
import { wouldExceedDayLimit, MAX_HOURS_PER_DAY as OVERHEAD_MAX_HOURS } from '@/simulation/activities/schedulingOverhead';
import { DAY_PERIODS, DAY_PERIOD_ORDER, type DayPeriod } from '@/data/day-periods-config';
import { getActivityTimeCost } from '@/data/activity-time-costs';
import { Sunrise, Sunset, Moon as MoonIcon } from 'lucide-react';

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }
const CARD = 'bg-white border-[0.8px] border-black/20 rounded-[24px] overflow-hidden'

function getActivityTypeStyle(type: string): {
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

// Activity helper functions
function getActivityIcon(category: string): typeof Clock {
  switch (category) {
    case 'training': return Flame
    case 'media': return Newspaper
    case 'social': return Heart
    case 'team': return Users
    case 'personal': return Star
    case 'sponsor': return Handshake
    case 'mechanical': return Wrench
    case 'racing': return Car
    case 'rest': return Clock
    default: return ClipboardList
  }
}

function getActivityColor(category: string): string {
  switch (category) {
    case 'training': return 'text-orange-400'
    case 'media': return 'text-blue-400'
    case 'social': return 'text-pink-400'
    case 'team': return 'text-accent-blue'
    case 'personal': return 'text-purple-400'
    case 'sponsor': return 'text-accent-gold'
    case 'mechanical': return 'text-status-warning'
    case 'racing': return 'text-accent-red'
    case 'rest': return 'text-status-success'
    default: return 'text-text-muted'
  }
}

function getCalendarEntryTypeStyle(entryType: string | undefined): { color: string; bgColor: string; label: string } {
  switch (entryType) {
    case 'race': return { color: 'text-accent-red', bgColor: 'bg-accent-red/10', label: 'Race' }
    case 'practice': return { color: 'text-accent-blue', bgColor: 'bg-accent-blue/10', label: 'Practice' }
    case 'qualifying': return { color: 'text-purple-400', bgColor: 'bg-purple-500/10', label: 'Qualifying' }
    case 'test': return { color: 'text-status-warning', bgColor: 'bg-status-warning/10', label: 'Test Day' }
    case 'event': return { color: 'text-accent-gold', bgColor: 'bg-accent-gold/10', label: 'Event' }
    default: return { color: 'text-text-muted', bgColor: 'bg-surface', label: 'Activity' }
  }
}

/** Form Indicator - shows visual representation of a driver's current form/streak */
function FormIndicator({ driver }: { driver: RivalDriver }) {
  const form = driver.currentForm || 0
  const streak = driver.formStreak || 0
  const isHot = streak >= 2 || form > 0.05
  const isCold = streak <= -2 || form < -0.05
  const isNeutral = !isHot && !isCold
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
    <div className={`${CARD} p-[20px]`}>
      <div className="flex items-center justify-between mb-[16px]">
        <h3 className="text-[18px] text-[#0a0a0a] flex items-center gap-[8px]" style={FB}>
          <CalendarIcon className="w-[20px] h-[20px] text-[#2563eb]" />
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
                    <span className="px-[6px] py-[2px] text-[10px] rounded-[6px] bg-[#2563eb]/10 text-[#2563eb]" style={FBold}>Current</span>
                  )}
                  {isRaceWeek && (
                    <span className="px-[6px] py-[2px] text-[10px] rounded-[6px] bg-[#ef4444]/10 text-[#ef4444] flex items-center gap-[2px]" style={FBold}>
                      <Flag className="w-[12px] h-[12px]" /> Race Week
                    </span>
                  )}
                </div>
                {!isPast && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onWeekSelect(week) }}
                    className="h-[28px] px-[10px] border-[0.8px] border-black/20 rounded-[8px] text-[11px] text-[#0a0a0a] flex items-center gap-[4px] hover:bg-[#f9fafb] transition-colors"
                    style={FBold}
                  >
                    <Plus className="w-[14px] h-[14px]" /> Add
                  </button>
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
                                <button onClick={(e) => { e.stopPropagation(); onActivityComplete(activity.id) }} title="Complete activity" className="w-[28px] h-[28px] rounded-[6px] flex items-center justify-center text-[#00a63e] hover:bg-[#00a63e]/10 transition-colors">
                                  <Check className="w-[16px] h-[16px]" />
                                </button>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); onActivityCancel(activity.id) }} title="Cancel activity" className="w-[28px] h-[28px] rounded-[6px] flex items-center justify-center text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors">
                                <X className="w-[16px] h-[16px]" />
                              </button>
                            </>
                          )}
                          {activity.status === 'completed' && (
                            <span className="px-[6px] py-[2px] text-[10px] rounded-[6px] bg-[#00a63e]/10 text-[#00a63e]" style={FBold}>Done</span>
                          )}
                          {activity.status === 'missed' && (
                            <span className="px-[6px] py-[2px] text-[10px] rounded-[6px] bg-[#ef4444]/10 text-[#ef4444]" style={FBold}>Missed</span>
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
                      <span className="px-[6px] py-[2px] text-[10px] rounded-[6px] bg-[#f59e0b]/10 text-[#f59e0b]" style={FBold}>Invitational</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
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
  onSchedule: (templateId: string, day: number, period?: DayPeriod) => void
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
  const [selectedPeriod, setSelectedPeriod] = useState<DayPeriod | null>(null)
  
  // When a template is selected, auto-select its preferred period
  useEffect(() => {
    if (selectedTemplate) {
      const timeCost = getActivityTimeCost(selectedTemplate.id)
      if (timeCost.preferredPeriod) {
        setSelectedPeriod(timeCost.preferredPeriod)
      } else if (timeCost.allowedPeriods && timeCost.allowedPeriods.length === 1) {
        setSelectedPeriod(timeCost.allowedPeriods[0])
      } else {
        setSelectedPeriod(null)
      }
    } else {
      setSelectedPeriod(null)
    }
  }, [selectedTemplate])
  
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
            <button onClick={onClose} className="w-[32px] h-[32px] rounded-full bg-[#f9fafb] flex items-center justify-center text-[#4a5565] hover:bg-black/10 transition-colors">
              <X className="w-[20px] h-[20px]" />
            </button>
          </div>
        </div>

        <div className="flex h-[60vh]">
          {/* Activity List */}
          <div className="w-1/2 border-r border-surface-secondary overflow-y-auto p-4">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={`h-[28px] px-[10px] rounded-[8px] text-[11px] transition-colors ${categoryFilter === cat.value ? 'bg-black text-white' : 'text-[#4a5565] hover:bg-[#f9fafb]'}`}
                  style={FBold}
                >
                  {cat.label}
                </button>
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
                              <span className="px-[6px] py-[2px] text-[10px] rounded-[6px] bg-[#ef4444]/10 text-[#ef4444]" style={FBold}>
                                ${(activity.baseCost / 1000).toFixed(0)}k
                              </span>
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
                              <span className="px-[6px] py-[2px] text-[10px] rounded-[6px] bg-[#f59e0b]/10 text-[#f59e0b]" style={FBold}>Driver Required</span>
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
                    
                    // Check for conflicts on any affected days using effective hours
                    const newActivityStub = {
                      duration: selectedTemplate.duration || 2,
                      category: selectedTemplate.category,
                      configuration: undefined as undefined,
                      requiresDriver: selectedTemplate.requiresDriver ?? true,
                      requiresOwner: !selectedTemplate.requiresDriver,
                    }
                    const conflictDays: number[] = []
                    for (let d = day; d < day + templateSpanDays && d <= 7; d++) {
                      const activitiesOnDay = existingActivities.filter(a => {
                        const aSpan = a.spanDays || 1
                        const aStartDay = a.scheduledDay
                        const aEndDay = aStartDay + aSpan - 1
                        return a.status === 'scheduled' && d >= aStartDay && d <= aEndDay
                      })
                      const isRaceDayCheck = activitiesOnDay.some(a => a.category === 'race')
                      const projected = wouldExceedDayLimit(activitiesOnDay, newActivityStub, isRaceDayCheck)
                      if (projected.hasConflict) conflictDays.push(d)
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

                {/* Time Slot Picker */}
                {(() => {
                  const timeCost = getActivityTimeCost(selectedTemplate.id)
                  const allowedPeriods = timeCost.allowedPeriods
                  // Calculate hours already scheduled per period for overflow warnings
                  const hoursPerPeriod: Record<DayPeriod, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 }
                  existingActivities
                    .filter(a => a.status === 'scheduled' && a.scheduledDay === day)
                    .forEach(a => {
                      const p = a.scheduledPeriod
                      if (p) hoursPerPeriod[p] += a.duration || 0
                    })
                  
                  const periodIcons: Record<DayPeriod, typeof Sun> = {
                    morning: Sunrise,
                    afternoon: Sun,
                    evening: Sunset,
                    night: MoonIcon,
                  }
                  
                  return (
                    <div className="p-4 rounded-xl bg-surface-secondary/50">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-accent-blue" />
                        Time Slot
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {DAY_PERIOD_ORDER.map(period => {
                          const config = DAY_PERIODS[period]
                          const PIcon = periodIcons[period]
                          const isAllowed = !allowedPeriods || allowedPeriods.includes(period)
                          const isSelected = selectedPeriod === period
                          const scheduledH = hoursPerPeriod[period]
                          const wouldOverflow = isSelected && (scheduledH + (selectedTemplate.duration || 0)) > config.hoursInPeriod
                          
                          return (
                            <button
                              key={period}
                              disabled={!isAllowed}
                              onClick={() => setSelectedPeriod(isSelected ? null : period)}
                              className={`
                                relative flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs transition-all
                                ${!isAllowed 
                                  ? 'opacity-30 cursor-not-allowed border-surface-secondary bg-surface-secondary/20'
                                  : isSelected
                                    ? 'border-accent-blue bg-accent-blue/15 text-accent-blue ring-1 ring-accent-blue/40'
                                    : 'border-surface-secondary bg-surface-secondary/30 hover:border-accent-blue/50 hover:bg-accent-blue/5 text-text-secondary'
                                }
                              `}
                            >
                              <PIcon className="w-4 h-4" />
                              <span className="font-medium">{config.shortLabel}</span>
                              <span className="text-[10px] text-text-muted">
                                {config.startHour > 12 ? config.startHour - 12 : config.startHour}
                                {config.startHour >= 12 ? 'pm' : 'am'}
                                {' - '}
                                {config.endHour > 12 ? config.endHour - 12 : config.endHour}
                                {config.endHour >= 12 ? 'pm' : 'am'}
                              </span>
                              {isAllowed && scheduledH > 0 && (
                                <span className="text-[10px] text-text-muted">{scheduledH}h used</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                      {/* Overflow warning */}
                      {selectedPeriod && (() => {
                        const config = DAY_PERIODS[selectedPeriod]
                        const totalAfter = hoursPerPeriod[selectedPeriod] + (selectedTemplate.duration || 0)
                        if (totalAfter > config.hoursInPeriod) {
                          const overflow = totalAfter - config.hoursInPeriod
                          const currentIdx = DAY_PERIOD_ORDER.indexOf(selectedPeriod)
                          const nextPeriod = currentIdx < DAY_PERIOD_ORDER.length - 1 ? DAY_PERIOD_ORDER[currentIdx + 1] : null
                          return (
                            <div className="mt-2 p-2 rounded-lg bg-accent-orange/10 border border-accent-orange/20">
                              <div className="flex items-center gap-2 text-accent-orange text-xs">
                                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>
                                  {config.shortLabel} overbooked ({totalAfter}h / {config.hoursInPeriod}h)
                                  {nextPeriod && ` — ${overflow}h will push into ${DAY_PERIODS[nextPeriod].shortLabel}`}
                                </span>
                              </div>
                            </div>
                          )
                        }
                        return null
                      })()}
                      {!selectedPeriod && (
                        <p className="mt-2 text-[10px] text-text-muted text-center">No slot selected — will be flexible</p>
                      )}
                    </div>
                  )
                })()}

                {/* Schedule Button */}
                <button 
                  className="w-full h-[40px] bg-black text-white rounded-[16px] text-[13px] flex items-center justify-center gap-[8px] hover:bg-black/90 transition-colors disabled:bg-[#f9fafb] disabled:text-[#4a5565] disabled:cursor-not-allowed"
                  style={FBold}
                  onClick={() => {
                    onSchedule(selectedTemplate.id, day, selectedPeriod ?? undefined)
                    onClose()
                  }}
                  disabled={(() => {
                    const templateSpanDays = selectedTemplate.spanDays || 1
                    const scheduleStub = {
                      duration: selectedTemplate.duration || 2,
                      category: selectedTemplate.category,
                      configuration: undefined as undefined,
                      requiresDriver: selectedTemplate.requiresDriver ?? true,
                      requiresOwner: !selectedTemplate.requiresDriver,
                    }
                    for (let d = day; d < day + templateSpanDays && d <= 7; d++) {
                      const activitiesOnDay = existingActivities.filter(a => {
                        const aSpan = a.spanDays || 1
                        const aStartDay = a.scheduledDay
                        const aEndDay = aStartDay + aSpan - 1
                        return a.status === 'scheduled' && d >= aStartDay && d <= aEndDay
                      })
                      const isRaceDayCheck = activitiesOnDay.some(a => a.category === 'race')
                      const projected = wouldExceedDayLimit(activitiesOnDay, scheduleStub, isRaceDayCheck)
                      if (projected.hasConflict) return true
                    }
                    return day + templateSpanDays - 1 > 7
                  })()}
                >
                  <Plus className="w-[16px] h-[16px]" />
                  Schedule {selectedTemplate.name}
                </button>
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

/**
 * Categories that should route to the ActivityOutcomeModal (personal life activities).
 */
const OUTCOME_MODAL_CATEGORIES = new Set<string>([
  'social', 'romance', 'family', 'fitness', 'wellness',
  'education', 'hobby', 'pet', 'personal', 'lifestyle'
])

/**
 * Roll an outcome quality for an activity based on context.
 * Higher relationship levels and better stats → better chance of 'great' outcomes.
 */
function rollOutcomeQuality(activity: ScheduledActivity): 'great' | 'good' | 'neutral' | 'poor' {
  // Base probabilities: great 20%, good 50%, neutral 20%, poor 10%
  let greatChance = 0.20
  let goodChance = 0.50
  let neutralChance = 0.20
  
  // Relationship level boost (for social/romance activities)
  if (activity.socialActionMeta) {
    const state = useCareerStore.getState()
    const contact = state.careerState?.messaging?.contacts.find(
      (c: any) => c.id === activity.socialActionMeta!.contactId
    )
    if (contact) {
      const relLevel = contact.relationshipLevel || 50
      if (relLevel > 70) { greatChance += 0.15; goodChance += 0.10 }
      else if (relLevel > 40) { greatChance += 0.05; goodChance += 0.05 }
      else if (relLevel < 20) { greatChance -= 0.10; neutralChance += 0.10 }
    }
  }
  
  const roll = Math.random()
  const poorChance = Math.max(0, 1 - greatChance - goodChance - neutralChance)
  
  if (roll < greatChance) return 'great'
  if (roll < greatChance + goodChance) return 'good'
  if (roll < greatChance + goodChance + neutralChance) return 'neutral'
  return 'poor'
}

/**
 * Compute ActivityOutcomeData from a ScheduledActivity before showing the modal.
 * Gathers effects, bonus info, meter snapshots, and narrative context.
 */
function computeActivityOutcome(activity: ScheduledActivity): ActivityOutcomeData {
  const state = useCareerStore.getState()
  const category = activity.category || 'personal'
  const outcomeQuality = rollOutcomeQuality(activity)
  
  const appliedEffects: DisplayableEffect[] = []
  const bonuses: BonusBreakdown[] = []
  const meterChanges: MeterChange[] = []
  let partnerReaction: string | undefined
  
  // Build narrative context
  const narrativeContext: ActivityOutcomeContext = {
    category: category as any,
    activityName: activity.name,
    activityDescription: activity.description,
    outcomeQuality,
    effects: {},
  }
  
  // === SOCIAL / ROMANCE: relationship effects ===
  if (activity.socialActionMeta) {
    const meta = activity.socialActionMeta
    const contact = state.careerState?.messaging?.contacts.find(
      (c: any) => c.id === meta.contactId
    )
    
    narrativeContext.contactName = meta.contactName
    narrativeContext.contactType = contact?.type || 'contact'
    narrativeContext.subcategory = meta.category
    
    if (contact) {
      narrativeContext.relationshipLevel = contact.relationshipLevel
      
      // Calculate bonuses
      const actionDef = getSocialActionById(meta.actionId)
      let bonusMultiplier = 1.0
      
      if (actionDef) {
        const loveMultiplier = getLoveLanguageMultiplier(actionDef, contact.loveLanguage)
        const interestMultiplier = getInterestBonusMultiplier(actionDef, contact.interests)
        bonusMultiplier = getCombinedBonusMultiplier(actionDef, contact.loveLanguage, contact.interests)
        
        const loveMatch = loveMultiplier > 1.0
        narrativeContext.loveLanguageMatch = loveMatch
        
        // Find matching interests
        if (actionDef.interestTags && contact.interests) {
          const normalizedInterests = contact.interests.map((i: string) => i.toLowerCase().replace(/[\s-]+/g, '_'))
          const matchedInterests = actionDef.interestTags.filter(tag => {
            const tagLower = tag.toLowerCase()
            return normalizedInterests.some((interest: string) =>
              interest.includes(tagLower) || tagLower.includes(interest)
            )
          })
          narrativeContext.sharedInterests = matchedInterests
        }
        
        narrativeContext.bonusMultiplier = bonusMultiplier
        
        // Add bonus breakdown entries
        bonuses.push({
          label: 'Love Language',
          description: loveMatch
            ? `This activity matches ${meta.contactName}'s love language`
            : `${meta.contactName}'s love language doesn't match this activity`,
          multiplier: loveMultiplier,
          active: loveMatch,
        })
        
        if (actionDef.interestTags && actionDef.interestTags.length > 0) {
          const sharedCount = narrativeContext.sharedInterests?.length || 0
          bonuses.push({
            label: 'Shared Interests',
            description: sharedCount > 0
              ? `${sharedCount} shared interest${sharedCount > 1 ? 's' : ''} enhanced the experience`
              : 'No shared interests matched this activity',
            multiplier: interestMultiplier,
            active: sharedCount > 0,
          })
        }
      }
      
      // Build effects with multipliers
      if (meta.effects.affection) {
        const val = meta.effects.affection * bonusMultiplier
        appliedEffects.push({ key: 'affection', label: 'Affection', value: val, isPositive: val > 0 })
        narrativeContext.effects.affection = val
      }
      if (meta.effects.trust) {
        const val = meta.effects.trust * bonusMultiplier
        appliedEffects.push({ key: 'trust', label: 'Trust', value: val, isPositive: val > 0 })
        narrativeContext.effects.trust = val
      }
      if (meta.effects.romance) {
        const val = meta.effects.romance * bonusMultiplier
        appliedEffects.push({ key: 'romance', label: 'Romance', value: val, isPositive: val > 0 })
        narrativeContext.effects.romance = val
      }
      
      // Meter changes (before → after)
      const affGain = (meta.effects.affection || 0) * bonusMultiplier
      const trustGain = (meta.effects.trust || 0) * bonusMultiplier
      const romGain = (meta.effects.romance || 0) * bonusMultiplier
      
      if (affGain !== 0) {
        meterChanges.push({
          label: 'Affection',
          before: contact.affectionMeter || 0,
          after: Math.min(100, Math.max(0, (contact.affectionMeter || 0) + affGain)),
          max: 100,
          color: '#f472b6', // pink-400
        })
      }
      if (trustGain !== 0) {
        meterChanges.push({
          label: 'Trust',
          before: contact.trustMeter || 0,
          after: Math.min(100, Math.max(0, (contact.trustMeter || 0) + trustGain)),
          max: 100,
          color: '#60a5fa', // blue-400
        })
      }
      if (romGain !== 0) {
        meterChanges.push({
          label: 'Romance',
          before: contact.romanceMeter || 0,
          after: Math.min(100, Math.max(0, (contact.romanceMeter || 0) + romGain)),
          max: 100,
          color: '#fb7185', // rose-400
        })
      }
      
      // Partner reaction
      const reactions: Record<string, string[]> = {
        great: [
          `${meta.contactName} seems genuinely happy`,
          `${meta.contactName} can't stop smiling`,
          `${meta.contactName} squeezes your hand and says it was perfect`,
        ],
        good: [
          `${meta.contactName} seemed to enjoy the time together`,
          `${meta.contactName} thanks you for a lovely time`,
        ],
        neutral: [
          `${meta.contactName} gives a polite smile`,
          `${meta.contactName} seemed a bit distracted`,
        ],
        poor: [
          `${meta.contactName} seemed uncomfortable at times`,
          `${meta.contactName} is unusually quiet afterward`,
        ],
      }
      const reactionPool = reactions[outcomeQuality] || reactions.good
      partnerReaction = reactionPool[Math.floor(Math.random() * reactionPool.length)]
    }
  }
  
  // === LIFESTYLE ACTIVITIES: non-social effects from effectsOnComplete ===
  if (!activity.socialActionMeta && activity.effectsOnComplete) {
    const effects = activity.effectsOnComplete
    const effectLabels: Record<string, string> = {
      stressReduction: 'Stress Relief',
      stress: 'Stress',
      fitnessBonus: 'Fitness',
      fitness: 'Fitness',
      healthBonus: 'Health',
      health: 'Health',
      happinessBoost: 'Happiness',
      happiness: 'Happiness',
      skillProgress: 'Skill Progress',
      petHappiness: 'Pet Happiness',
      moduleProgress: 'Course Progress',
      mentalStrength: 'Mental Strength',
      confidence: 'Confidence',
      boardMood: 'Board Mood',
      teamMorale: 'Team Morale',
      reputation: 'Reputation',
    }
    
    for (const [key, value] of Object.entries(effects)) {
      if (value === undefined || value === 0 || typeof value === 'boolean') continue
      const numVal = typeof value === 'number' ? value : 0
      if (numVal === 0) continue
      
      // For stress reduction, show as positive (reducing stress is good)
      const isStress = key === 'stressReduction' || key === 'stress'
      const displayPositive = isStress ? numVal > 0 : numVal > 0
      
      appliedEffects.push({
        key,
        label: effectLabels[key] || key.replace(/([A-Z])/g, ' $1').trim(),
        value: numVal,
        isPositive: isStress ? true : displayPositive,
      })
      narrativeContext.effects[key] = numVal
    }
  }
  
  // === Category-specific narrative context enrichment ===
  if (category === 'hobby') {
    // Extract hobby name from activity name (e.g., "Hobby: Piano" → "Piano")
    narrativeContext.hobbyName = activity.name.replace(/^Hobby:\s*/i, '')
  }
  if (category === 'pet') {
    narrativeContext.petName = activity.name.replace(/^Pet Time:\s*/i, '')
  }
  if (category === 'education') {
    narrativeContext.courseName = activity.name.replace(/^(Study|Course):\s*/i, '')
    if (activity.description) {
      narrativeContext.courseProgress = activity.description
    }
  }
  if (category === 'fitness') {
    narrativeContext.workoutType = activity.name.replace(/^Workout:\s*/i, '')
  }
  
  return {
    appliedEffects,
    bonuses: bonuses.length > 0 ? bonuses : undefined,
    meterChanges: meterChanges.length > 0 ? meterChanges : undefined,
    partnerReaction,
    outcomeQuality,
    narrativeContext,
  }
}

/**
 * Activities that should auto-complete without the EventGameplayModal.
 * These are informational, tutorial, or routine activities where interactive
 * dialogue choices don't make contextual sense.
 */
const AUTO_COMPLETE_ACTIVITIES = new Set([
  'onboarding_facility_walkthrough',   // Informational tour
  'onboarding_inbox_comms',            // Tutorial
  'onboarding_calendar_time',          // Tutorial
  'onboarding_garage_car_intro',       // Informational
  'onboarding_media_pr_intro',         // Informational
  'onboarding_week1_wrap',             // Short recap
  'onboarding_gym_fitness',            // Exercise
  'onboarding_social_media_obligation',// Routine task
  'onboarding_safety_briefing',        // Compliance attendance
  'onboarding_photo_shoot',            // Routine
  'onboarding_partner_dinner',         // Personal time
  'onboarding_attract_sponsors_session', // Informational session
])

export function Calendar() {
  const navigate = useNavigate()
  const { 
    careerState, 
    player, 
    getAcceptedInvitations,
    getScheduledActivities,
    getAvailableActivities,
    getMandatoryActivities,
    scheduleActivity,
    scheduleConfiguredActivity,
    cancelActivity,
    completeActivity
  } = useCareerStore()
  const { series, seasonStandings, getSeriesById, getRivalsInSeries, initializeWorld, generateCalendar } = useRivalStore()
  const [selectedRound, setSelectedRound] = useState<RaceEvent | null>(null)
  const [_selectedInvitational, _setSelectedInvitational] = useState<InvitationalEvent | null>(null)
  const [selectedWeekForScheduling, setSelectedWeekForScheduling] = useState<number | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [calTab, setCalTab] = useState<'schedule' | 'calendar' | 'standings'>('schedule')
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null)
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
  // Auto-complete activity completion summary modal
  const [completionActivity, setCompletionActivity] = useState<ScheduledActivity | null>(null)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  // Intro/onboarding interview (AI questions with interviewTopic so no race questions)
  const [interviewModalActivity, setInterviewModalActivity] = useState<ScheduledActivity | null>(null)
  // Activity detail modal (clicking a card in day panel)
  const [selectedActivityForDetail, setSelectedActivityForDetail] = useState<ScheduledActivity | null>(null)
  // Activity Outcome Modal (personal/lifestyle/social activities)
  const [outcomeActivity, setOutcomeActivity] = useState<ScheduledActivity | null>(null)
  const [outcomeData, setOutcomeData] = useState<ActivityOutcomeData | null>(null)
  const [showOutcomeModal, setShowOutcomeModal] = useState(false)
  
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
  
  // Active series entries (owner mode) - filter to active status
  const activeSeriesEntries = useMemo(() => 
    ownerSeriesEntries.filter(e => e.status === 'active'),
    [ownerSeriesEntries]
  )

  // Resolve which series to display: selectedSeriesId (owner multi-series) or first entry
  const effectiveSeriesId = useMemo(() => {
    if (isOwnerMode && activeSeriesEntries.length > 0) {
      if (selectedSeriesId && activeSeriesEntries.some(e => e.seriesId === selectedSeriesId)) {
        return selectedSeriesId
      }
      return activeSeriesEntries[0].seriesId
    }
    return player.currentSeriesId ?? null
  }, [isOwnerMode, activeSeriesEntries, selectedSeriesId, player.currentSeriesId])

  // Sync selectedSeriesId when entries change (e.g. leave a series)
  useEffect(() => {
    if (!selectedSeriesId || !activeSeriesEntries.some(e => e.seriesId === selectedSeriesId)) {
      setSelectedSeriesId(activeSeriesEntries[0]?.seriesId ?? null)
    }
  }, [activeSeriesEntries, selectedSeriesId])

  // Get current series for display
  const currentSeries = useMemo(() => 
    effectiveSeriesId ? getSeriesById(effectiveSeriesId) : null,
    [effectiveSeriesId, getSeriesById]
  )
  
  const currentWeek = careerState.currentWeek
  const currentDay = careerState.currentDay ?? 1
  const calendar = useMemo(() => {
    const base = currentSeries?.calendar ?? []
    if (base.length > 0) return base
    if (currentSeries?.id) {
      return generateCalendar(currentSeries.id, careerState.currentYear)
    }
    return []
  }, [currentSeries, generateCalendar, careerState.currentYear])
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
    <div className="bg-white w-full h-full overflow-y-auto">
      <div className="pl-[24px] py-[24px] pr-[24px] flex flex-col gap-[24px]">
      {/* Header */}
      <div>
        <h1 className="text-[24px] text-black tracking-[-1.2px] leading-[32px]" style={FB}>
          SCHEDULE
        </h1>
        <p className="text-[12px] text-[#4a5565]" style={FR}>
          Track your calendar and championship progress
        </p>
      </div>

      {/* Tabs - Always show CALENDAR, conditionally show REGISTERED SERIES */}
      <div className="flex gap-[8px]">
        <button 
          onClick={() => setCalTab('schedule')} 
          className={`h-[37px] px-[24px] rounded-[16px] text-[14px] flex items-center gap-[8px] transition-colors ${
            calTab === 'schedule' 
              ? 'bg-black text-white' 
              : 'bg-[rgba(255,255,255,0.8)] border-[1.6px] border-black text-black hover:bg-white'
          }`} 
          style={FB}
        >
          <CalendarIcon className="w-[16px] h-[16px]" /> CALENDAR
        </button>
        {(currentSeries || ownerSeriesEntries.length > 0) && (
          <button 
            onClick={() => setCalTab('calendar')} 
            className={`h-[37px] px-[24px] rounded-[16px] text-[14px] flex items-center gap-[8px] transition-colors ${
              calTab === 'calendar' || calTab === 'standings'
                ? 'bg-black text-white' 
                : 'bg-[rgba(255,255,255,0.8)] border-[1.6px] border-black text-black hover:bg-white'
            }`} 
            style={FB}
          >
            <Trophy className="w-[16px] h-[16px]" /> REGISTERED SERIES
          </button>
        )}
      </div>

      {/* ══════ CALENDAR TAB ══════ Always rendered when active */}
      {calTab === 'schedule' && (
        <div className="space-y-[24px]">
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
              setSelectedWeekForScheduling(week)
              setShowScheduleModal(true)
            }}
          />

          <DayDetailPanel
            isOpen={showDayDetail}
            week={selectedDayForDetail?.week ?? currentWeek}
            day={selectedDayForDetail?.day ?? 1}
            activities={getScheduledActivities(selectedDayForDetail?.week).filter(a => {
              const start = a.scheduledDay
              const span = a.spanDays || 1
              const day = selectedDayForDetail?.day ?? 1
              return day >= start && day < start + span
            })}
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
            onViewActivity={(activity) => setSelectedActivityForDetail(activity)}
            onAttendEvent={(activity) => {
              if (OUTCOME_MODAL_CATEGORIES.has(activity.category) || activity.socialActionMeta) {
                const data = computeActivityOutcome(activity)
                setOutcomeActivity(activity)
                setOutcomeData(data)
                setShowOutcomeModal(true)
              } else if (AUTO_COMPLETE_ACTIVITIES.has(activity.templateId)) {
                setCompletionActivity(activity)
                setShowCompletionModal(true)
              } else if (activity.templateId === 'onboarding_intro_press') {
                setInterviewModalActivity(activity)
              } else if (activity.category === 'media') {
                navigate('/media', { state: { calendarDuty: { activityId: activity.id, templateId: activity.templateId, name: activity.name, description: activity.description, category: activity.category } } })
              } else {
                setSelectedActivityForGameplay(activity)
                setShowGameplayModal(true)
              }
            }}
          />

          <ActivityDetailModal
            activity={selectedActivityForDetail}
            onClose={() => setSelectedActivityForDetail(null)}
            isToday={!!selectedDayForDetail && currentWeek === selectedDayForDetail.week && currentDay === selectedDayForDetail.day}
            isPast={!!selectedDayForDetail && (selectedDayForDetail.week < currentWeek || (selectedDayForDetail.week === currentWeek && selectedDayForDetail.day < currentDay))}
            onAttend={(activity) => {
              if (OUTCOME_MODAL_CATEGORIES.has(activity.category) || activity.socialActionMeta) {
                const data = computeActivityOutcome(activity)
                setOutcomeActivity(activity)
                setOutcomeData(data)
                setShowOutcomeModal(true)
                setSelectedActivityForDetail(null)
              } else if (AUTO_COMPLETE_ACTIVITIES.has(activity.templateId)) {
                setCompletionActivity(activity)
                setShowCompletionModal(true)
                setSelectedActivityForDetail(null)
              } else if (activity.templateId === 'onboarding_intro_press') {
                setInterviewModalActivity(activity)
              } else if (activity.category === 'media') {
                navigate('/media', { state: { calendarDuty: { activityId: activity.id, templateId: activity.templateId, name: activity.name, description: activity.description, category: activity.category } } })
              } else {
                setSelectedActivityForGameplay(activity)
                setShowGameplayModal(true)
              }
            }}
            onComplete={completeActivity}
            onCancel={cancelActivity}
            onReschedule={() => {}}
          />

          {interviewModalActivity && (
            <InterviewModal
              isOpen={!!interviewModalActivity}
              onClose={() => setInterviewModalActivity(null)}
              onComplete={(result) => {
                if (interviewModalActivity) {
                  completeActivity(interviewModalActivity.id, {
                    reputation: result.outcome === 'success' ? 2 : result.outcome === 'disaster' ? -1 : 0,
                    marketability: result.outcome === 'success' ? 1 : 0,
                    cash: result.finalPayment || 0
                  })
                }
                setInterviewModalActivity(null)
              }}
              context={{
                playerName: `${player?.firstName ?? ''} ${player?.lastName ?? ''}`.trim(),
                teamName: careerState?.ownedTeam?.name ?? 'Your Team',
                seriesName: currentSeries?.name ?? 'Championship',
                seriesTier: (currentSeries as any)?.tier ?? 'amateur',
                tier: 'local',
                outletName: 'Local Media',
                interviewTopic: 'onboarding',
              }}
              payment={0}
            />
          )}

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
                completeActivity(selectedActivityForGameplay.id, gameplayEffects)
              }
              setShowGameplayModal(false)
              setSelectedActivityForGameplay(null)
            }}
            onCancel={() => {
              setShowGameplayModal(false)
              setSelectedActivityForGameplay(null)
            }}
          />

          <ActivityCompletionModal
            isOpen={showCompletionModal}
            activity={completionActivity}
            onDone={(activityId) => {
              completeActivity(activityId)
              setShowCompletionModal(false)
              setCompletionActivity(null)
            }}
            onClose={() => {
              setShowCompletionModal(false)
              setCompletionActivity(null)
            }}
          />

          <ActivityOutcomeModal
            isOpen={showOutcomeModal}
            activity={outcomeActivity}
            outcomeData={outcomeData}
            onDone={(activityId) => {
              completeActivity(activityId)
              setShowOutcomeModal(false)
              setOutcomeActivity(null)
              setOutcomeData(null)
            }}
            onClose={() => {
              setShowOutcomeModal(false)
              setOutcomeActivity(null)
              setOutcomeData(null)
            }}
          />

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
                onSchedule={(templateId, scheduledDay, period) => {
                  const template = ACTIVITY_TEMPLATES.find(t => t.id === templateId)
                  if (template?.isConfigurable) {
                    setSelectedActivityTemplate(template)
                    setConfigWeek(selectedWeekForScheduling)
                    setConfigDay(scheduledDay)
                    setShowScheduleModal(false)
                    setShowActivityConfig(true)
                  } else {
                    scheduleActivity(templateId, selectedWeekForScheduling, scheduledDay, undefined, period)
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

          <ActivityConfigModal
            isOpen={showActivityConfig}
            activityTemplate={selectedActivityTemplate || undefined}
            week={configWeek}
            day={configDay}
            onClose={() => {
              setShowActivityConfig(false)
              setSelectedActivityTemplate(null)
            }}
            onSchedule={(templateId, week, day, config, period) => {
              scheduleConfiguredActivity(templateId, week, day, config, period)
              setShowActivityConfig(false)
              setSelectedActivityTemplate(null)
            }}
          />
        </div>
      )}

      {/* ══════ REGISTERED SERIES TAB ══════ Only when series exists */}
      {currentSeries && (calTab === 'calendar' || calTab === 'standings') && (
        <div className="space-y-[24px]">
          {/* Series selector - when registered in multiple series */}
          {activeSeriesEntries.length > 1 && (
            <div className="flex flex-wrap items-center gap-[8px]">
              <span className="text-[12px] text-[#4a5565]" style={FR}>Series:</span>
              <div className="flex flex-wrap gap-[8px]">
                {activeSeriesEntries.map((entry) => {
                  const series = getSeriesById(entry.seriesId)
                  const isSelected = effectiveSeriesId === entry.seriesId
                  return (
                    <button
                      key={entry.seriesId}
                      onClick={() => setSelectedSeriesId(entry.seriesId)}
                      className={`h-[32px] px-[16px] rounded-[12px] text-[12px] transition-colors flex items-center gap-[6px] ${
                        isSelected ? 'bg-black text-white' : 'bg-[#f3f4f6] text-black hover:bg-[#e5e7eb] border-[0.8px] border-black/20'
                      }`}
                      style={FBold}
                    >
                      <Trophy className="w-[14px] h-[14px]" />
                      {entry.seriesName || series?.name || entry.seriesId}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex gap-[8px]">
            <button onClick={() => setCalTab('calendar')} className={`h-[32px] px-[16px] rounded-[12px] text-[12px] transition-colors ${calTab === 'calendar' ? 'bg-black text-white' : 'bg-[#f3f4f6] text-black hover:bg-[#e5e7eb]'}`} style={FBold}>
              Race Calendar ({calendar.length} Rounds)
            </button>
            <button onClick={() => setCalTab('standings')} className={`h-[32px] px-[16px] rounded-[12px] text-[12px] transition-colors ${calTab === 'standings' ? 'bg-black text-white' : 'bg-[#f3f4f6] text-black hover:bg-[#e5e7eb]'}`} style={FBold}>
              Championship Standings
            </button>
          </div>

          {calTab === 'calendar' && (
            <div className="space-y-[24px]">
              <AnimatePresence mode="wait">
                {selectedRound && (
                  <motion.div key={selectedRound.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-[8px]">
                    <div className="bg-[rgba(255,255,255,0.8)] border-[1.6px] border-black rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] overflow-hidden ring-2 ring-black/20">
                      <div className="relative h-[200px] overflow-hidden">
                        <img src={findTrackImageFromManifest(selectedRound.trackName, selectedRound.layoutName) || getTrackImage(selectedRound.trackName, selectedRound.layoutName)} alt="" className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-[16px] left-[16px] right-[16px]">
                          <h3 className="text-[20px] text-white" style={FB}>Round {selectedRound.round}: {selectedRound.trackName}</h3>
                          <p className="text-[13px] text-white/80" style={FR}>{selectedRound.layoutName} · {selectedRound.country}</p>
                        </div>
                        {selectedRound.week === currentWeek && (
                          <div className="absolute top-[16px] right-[16px]">
                            <button onClick={() => navigate('/race-day')} className="h-[40px] px-[16px] bg-black text-white rounded-[16px] text-[13px] flex items-center gap-[8px] hover:bg-black/90 transition-colors" style={FBold}>
                              <Play className="w-[20px] h-[20px]" /> START RACE WEEKEND
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-[24px] p-[16px]">
                        <div>
                          <p className="text-[11px] text-[#4a5565] uppercase mb-[4px]" style={FR}>Schedule</p>
                          <p className="text-[14px] text-[#0a0a0a] flex items-center gap-[8px]" style={FBold}><CalendarIcon className="w-[16px] h-[16px] text-[#2563eb]" /> Week {selectedRound.week}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-[#4a5565] uppercase mb-[4px]" style={FR}>Circuit Length</p>
                          <p className="text-[14px] text-[#0a0a0a] flex items-center gap-[8px]" style={FBold}><Ruler className="w-[16px] h-[16px] text-[#ea580c]" /> {selectedRound.lengthKm.toFixed(2)} km</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-[#4a5565] uppercase mb-[4px]" style={FR}>Forecast</p>
                          <p className="text-[14px] text-[#0a0a0a] flex items-center gap-[8px]" style={FBold}>{getWeatherIcon(getWeather(selectedRound.trackId, selectedRound.week))} {getWeather(selectedRound.trackId, selectedRound.week).toUpperCase()}</p>
                        </div>
                        {getPlayerResult(selectedRound.round) && (
                          <div>
                            <p className="text-[11px] text-[#4a5565] uppercase mb-[4px]" style={FR}>Result</p>
                            <span className="px-[8px] py-[2px] text-[12px] rounded-[6px] bg-[#f59e0b]/10 text-[#f59e0b]" style={FBold}>P{getPlayerResult(selectedRound.round)!.racePosition}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <div ref={scrollContainerRef} className="flex overflow-x-auto gap-[16px] pb-[24px] snap-x snap-mandatory" style={{ scrollPaddingLeft: '2rem', scrollPaddingRight: '2rem' }}>
                  {calendar.map((race) => {
                    const isPast = race.week < currentWeek
                    const isCurrent = race.week === currentWeek
                    const isSelected = selectedRound?.id === race.id
                    const result = getPlayerResult(race.round)
                    return (
                      <div key={race.id} className="snap-start flex-shrink-0 w-[320px]" onClick={() => setSelectedRound(race)}>
                        <div className={`bg-[rgba(255,255,255,0.8)] border-[1.6px] border-black rounded-[16px] overflow-hidden cursor-pointer transition-all ${isSelected ? 'ring-2 ring-black/30' : 'hover:shadow-md'} ${isPast ? 'opacity-70 grayscale hover:grayscale-0' : ''}`}>
                          <div className="relative h-[120px] overflow-hidden">
                            <img src={findTrackImageFromManifest(race.trackName, race.layoutName) || getTrackImage(race.trackName, race.layoutName)} alt="" className="w-full h-full object-cover" loading="lazy" />
                            <div className="absolute top-[8px] right-[8px] flex gap-[4px]">
                              {isCurrent && <span className="px-[6px] py-[2px] text-[10px] rounded-[4px] bg-[#ef4444] text-white" style={FBold}>CURRENT</span>}
                              {isPast && <span className="px-[6px] py-[2px] text-[10px] rounded-[4px] bg-black/60 text-white" style={FBold}>COMPLETED</span>}
                              {result && <span className="px-[6px] py-[2px] text-[10px] rounded-[4px] bg-[#f59e0b] text-black" style={FBold}>P{result.racePosition}</span>}
                            </div>
                          </div>
                          <div className="p-[12px]">
                            <h4 className="text-[14px] text-[#0a0a0a]" style={FB}>R{race.round}</h4>
                            <p className="text-[12px] text-[#4a5565]" style={FR}>{race.trackName}</p>
                            <div className="flex justify-between mt-[8px] text-[11px] text-[#4a5565]" style={FR}>
                              <span className="flex items-center gap-[4px]">{getCountryFlag(race.country)} {race.country}</span>
                              <span className="flex items-center gap-[4px]"><CalendarIcon className="w-[12px] h-[12px]" /> W{race.week}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="absolute top-0 bottom-[24px] left-0 w-[32px] bg-gradient-to-r from-white to-transparent pointer-events-none" />
                <div className="absolute top-0 bottom-[24px] right-0 w-[32px] bg-gradient-to-l from-white to-transparent pointer-events-none" />
              </div>
            </div>
          )}

          {calTab === 'standings' && (
            <div className="bg-[rgba(255,255,255,0.8)] border-[1.6px] border-black rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] overflow-hidden p-[20px]">
              <div className="mb-[16px]">
                <h3 className="text-[18px] text-[#0a0a0a]" style={FB}>Championship Standings</h3>
                <p className="text-[13px] text-[#4a5565]" style={FR}>{currentSeries.name} - {careerState.currentYear}</p>
              </div>
              {standings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]" style={FR}>
                    <thead>
                      <tr className="text-left text-[#4a5565] border-b border-black/10">
                        <th className="pb-[12px] pl-[8px] w-[48px]" style={FBold}>Pos</th>
                        <th className="pb-[12px]" style={FBold}>Driver</th>
                        <th className="pb-[12px] text-center w-[64px]" style={FBold}>Form</th>
                        <th className="pb-[12px] text-center w-[64px]" style={FBold}>Races</th>
                        <th className="pb-[12px] text-center w-[64px]" style={FBold}>Wins</th>
                        <th className="pb-[12px] text-center w-[64px]" style={FBold}>Podiums</th>
                        <th className="pb-[12px] text-center w-[64px]" style={FBold}>Best</th>
                        <th className="pb-[12px] text-center w-[64px]" style={FBold}>Avg</th>
                        <th className="pb-[12px] text-right pr-[8px] w-[80px]" style={FBold}>Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((standing, index) => {
                        const isPlayer = standing.isPlayer || standing.driverName === `${player.firstName} ${player.lastName}`
                        const leaderPoints = standings[0]?.points || 0
                        const gapToLeader = index === 0 ? 0 : leaderPoints - standing.points
                        const rivalDriver = seriesRivals.find(r => `${r.firstName} ${r.lastName}` === standing.driverName)
                        return (
                          <tr key={standing.driverId || standing.driverName} className={`border-b border-black/5 transition-colors ${isPlayer ? 'bg-black/5 hover:bg-black/10' : 'hover:bg-[#f9fafb]'}`}>
                            <td className="py-[12px] pl-[8px]">
                              <span className={`w-[24px] h-[24px] rounded-full flex items-center justify-center text-[11px] ${index === 0 ? 'bg-[#f59e0b] text-black' : index === 1 ? 'bg-gray-400 text-black' : index === 2 ? 'bg-amber-700 text-white' : 'bg-[#f9fafb] text-[#4a5565]'}`} style={FBold}>{standing.position}</span>
                            </td>
                            <td className="py-[12px]">
                              <div className="flex items-center gap-[8px]">
                                <img src={getDriverPortrait(standing.driverName || 'Unknown Driver')} alt="" className="w-[24px] h-[24px] rounded-full object-cover bg-gray-200" />
                                <span style={isPlayer ? FBold : FR}>{standing.driverName || 'Unknown Driver'}</span>
                                {isPlayer && <span className="px-[6px] py-[1px] text-[10px] rounded-[4px] bg-[#ef4444]/10 text-[#ef4444]" style={FBold}>You</span>}
                              </div>
                              {gapToLeader > 0 && <span className="text-[11px] text-[#4a5565]" style={FR}>-{gapToLeader} pts</span>}
                            </td>
                            <td className="py-[12px] text-center">{!isPlayer && rivalDriver ? <FormIndicator driver={rivalDriver} /> : <span className="text-[11px] text-[#4a5565]">-</span>}</td>
                            <td className="py-[12px] text-center text-[#0a0a0a]">{standing.races}</td>
                            <td className="py-[12px] text-center">{standing.wins > 0 ? <span className="text-[#f59e0b]" style={FBold}>{standing.wins}</span> : <span className="text-[#4a5565]">0</span>}</td>
                            <td className="py-[12px] text-center">{standing.podiums > 0 ? <span className="text-[#00a63e]">{standing.podiums}</span> : <span className="text-[#4a5565]">0</span>}</td>
                            <td className="py-[12px] text-center text-[#0a0a0a]">P{standing.bestFinish}</td>
                            <td className="py-[12px] text-center text-[#4a5565]">{standing.avgFinish.toFixed(1)}</td>
                            <td className="py-[12px] text-right pr-[8px]"><span className={`text-[16px] ${index === 0 ? 'text-[#f59e0b]' : 'text-[#0a0a0a]'}`} style={FB}>{standing.points}</span></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-[48px]">
                  <Trophy className="w-[48px] h-[48px] mx-auto mb-[12px] text-[#4a5565] opacity-50" />
                  <p className="text-[14px] text-[#4a5565]" style={FR}>No championship data yet</p>
                  <p className="text-[12px] text-[#4a5565] mt-[4px]" style={FR}>Complete races to see standings update from telemetry</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      </div>
    </div>
  )
}
