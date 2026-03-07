/**
 * Opportunity Response Modal
 * 
 * Displays opportunity details and allows the player to accept or decline.
 * For accepted opportunities, allows scheduling on the calendar.
 */

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DollarSign, TrendingUp, TrendingDown, Briefcase, Building2, 
  Check, X, Clock, Trophy, Star, Sparkles, AlertTriangle,
  Users, Heart, Calendar, Factory, Sunrise, Sun, Sunset, Moon, CheckCircle2
} from 'lucide-react'
import { Card, Button, Badge, Modal } from '@/components/ui'
import { useCareerStore, getDayName } from '@/store/careerStore'
import { getActivityTimeCost } from '@/data/activity-time-costs'
import { DAY_PERIOD_ORDER, DAY_PERIODS, type DayPeriod } from '@/data/day-periods-config'

// Helper functions for opportunity categories
function getCategoryIcon(category: string) {
  switch (category) {
    case 'media': return <Sparkles className="w-6 h-6" />
    case 'sponsor': return <Briefcase className="w-6 h-6" />
    case 'team': return <Users className="w-6 h-6" />
    case 'manufacturer': return <Factory className="w-6 h-6" />
    case 'special': return <Trophy className="w-6 h-6" />
    default: return <Star className="w-6 h-6" />
  }
}

function getCategoryLabel(category: string) {
  switch (category) {
    case 'media': return 'Media'
    case 'sponsor': return 'Sponsor'
    case 'team': return 'Team'
    case 'manufacturer': return 'Manufacturer'
    case 'special': return 'Special'
    default: return category
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case 'media': return 'bg-accent-red/20'
    case 'sponsor': return 'bg-accent-gold/20'
    case 'team': return 'bg-accent-blue/20'
    case 'manufacturer': return 'bg-accent-purple/20'
    case 'special': return 'bg-accent-orange/20'
    default: return 'bg-surface-secondary'
  }
}

function getOrganizerIcon(type: string) {
  switch (type) {
    case 'sponsor': return <Briefcase className="w-4 h-4 text-text-muted" />
    case 'manufacturer': return <Factory className="w-4 h-4 text-text-muted" />
    case 'media': return <Sparkles className="w-4 h-4 text-text-muted" />
    case 'team': return <Users className="w-4 h-4 text-text-muted" />
    default: return <Star className="w-4 h-4 text-text-muted" />
  }
}

interface OpportunityResponseModalProps {
  opportunity: any
  isOpen: boolean
  onClose: () => void
  currentWeek: number
  currentYear: number
  scheduledActivities: any[]
}

export default function OpportunityResponseModal({
  opportunity,
  isOpen,
  onClose,
  currentWeek,
  currentYear,
  scheduledActivities
}: OpportunityResponseModalProps) {
  const [isAccepting, setIsAccepting] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<DayPeriod | null>(null)
  const [showAllWeeks, setShowAllWeeks] = useState(false)
  
  const { acceptOpportunity, declineOpportunity } = useCareerStore()

  const timeCostInfo = useMemo(() => getActivityTimeCost(opportunity.id), [opportunity.id])
  const allowedPeriods = useMemo<DayPeriod[]>(
    () => (timeCostInfo.allowedPeriods && timeCostInfo.allowedPeriods.length > 0)
      ? timeCostInfo.allowedPeriods
      : DAY_PERIOD_ORDER,
    [timeCostInfo.allowedPeriods]
  )

  const periodIcons: Record<DayPeriod, typeof Sun> = {
    morning: Sunrise,
    afternoon: Sun,
    evening: Sunset,
    night: Moon,
  }

  useEffect(() => {
    if (!isOpen) return
    setIsAccepting(false)
    setSelectedWeek(null)
    setSelectedDay(null)
    setShowAllWeeks(false)

    const initialPeriod = timeCostInfo.preferredPeriod
      || (timeCostInfo.allowedPeriods && timeCostInfo.allowedPeriods[0])
      || null
    setSelectedPeriod(initialPeriod)
  }, [isOpen, opportunity.instanceId, timeCostInfo.preferredPeriod, timeCostInfo.allowedPeriods])
  
  // Generate available weeks for scheduling
  const availableWeeks = useMemo(() => {
    const weeks: number[] = []
    for (let i = 0; i < 52; i++) {
      const week = currentWeek + i
      if (week <= 52) {
        weeks.push(week)
      }
    }
    return weeks
  }, [currentWeek])
  
  // Check for scheduling conflicts
  const getWeekConflicts = (week: number) => {
    return scheduledActivities.filter(
      a => a.scheduledWeek === week && a.status === 'scheduled'
    )
  }

  const isActivityOnDay = (activity: any, day: number) => {
    const span = activity.spanDays || 1
    const startDay = activity.scheduledDay
    const endDay = startDay + span - 1
    return day >= startDay && day <= endDay
  }

  const hasPeriodConflict = (week: number, day: number, period: DayPeriod) => {
    return scheduledActivities.some((activity) => {
      if (activity.status !== 'scheduled') return false
      if (activity.scheduledWeek !== week) return false
      if (!isActivityOnDay(activity, day)) return false

      // Legacy activities without a period should block all periods to avoid invisible overlap.
      if (!activity.scheduledPeriod) return true
      return activity.scheduledPeriod === period
    })
  }

  const getAvailableDaysForWeekAndPeriod = (week: number, period: DayPeriod | null) => {
    if (!period) return 7
    return [1, 2, 3, 4, 5, 6, 7].filter(day => !hasPeriodConflict(week, day, period)).length
  }

  const visibleWeeks = useMemo(() => {
    const BASE_VISIBLE_WEEKS = 12
    if (showAllWeeks) return availableWeeks
    return availableWeeks.slice(0, BASE_VISIBLE_WEEKS)
  }, [availableWeeks, showAllWeeks])
  
  // Calculate rewards summary
  const rewardsSummary = useMemo(() => {
    const rewards = opportunity.rewards
    const items: { icon: typeof DollarSign; label: string; value: string; color: string }[] = []
    
    if (rewards.cash) {
      items.push({
        icon: DollarSign,
        label: 'Payment',
        value: `$${rewards.cash.toLocaleString()}`,
        color: 'text-status-success'
      })
    }
    if (rewards.reputation) {
      items.push({
        icon: TrendingUp,
        label: 'Reputation',
        value: `+${rewards.reputation}`,
        color: 'text-accent-orange'
      })
    }
    if (rewards.fanSentiment) {
      items.push({
        icon: Heart,
        label: 'Fan Sentiment',
        value: `+${rewards.fanSentiment}`,
        color: 'text-status-info'
      })
    }
    if (rewards.manufacturerFavor) {
      items.push({
        icon: Factory,
        label: 'Manufacturer Relations',
        value: `+${rewards.manufacturerFavor}`,
        color: 'text-accent-purple'
      })
    }
    if (rewards.sponsorSatisfaction) {
      items.push({
        icon: Building2,
        label: 'Sponsor Satisfaction',
        value: `+${rewards.sponsorSatisfaction}%`,
        color: 'text-accent-gold'
      })
    }
    if (rewards.mediaExposure) {
      items.push({
        icon: Sparkles,
        label: 'Media Exposure',
        value: `+${rewards.mediaExposure}`,
        color: 'text-accent-blue'
      })
    }
    
    return items
  }, [opportunity.rewards])
  
  // Calculate consequences summary
  const consequencesSummary = useMemo(() => {
    const cons = opportunity.consequences
    const items: { icon: typeof TrendingDown; label: string; value: string; color: string }[] = []
    
    if (cons.reputationLoss) {
      items.push({
        icon: TrendingDown,
        label: 'Reputation',
        value: `-${cons.reputationLoss}`,
        color: 'text-status-error'
      })
    }
    if (cons.fanSentimentLoss) {
      items.push({
        icon: Heart,
        label: 'Fan Sentiment',
        value: `-${cons.fanSentimentLoss}`,
        color: 'text-status-error'
      })
    }
    if (cons.relationshipLoss) {
      items.push({
        icon: AlertTriangle,
        label: `${cons.relationshipLoss.type} Relations`,
        value: `-${cons.relationshipLoss.amount}`,
        color: 'text-status-warning'
      })
    }
    
    return items
  }, [opportunity.consequences])
  
  // Handle accept
  const handleAccept = () => {
    if (!selectedWeek || !selectedDay || !selectedPeriod) return
    
    acceptOpportunity(opportunity.instanceId, selectedWeek, selectedDay, selectedPeriod)
    onClose()
  }
  
  // Handle decline
  const handleDecline = () => {
    declineOpportunity(opportunity.instanceId)
    onClose()
  }
  
  // Days until expiry
  const daysUntilExpiry = useMemo(() => {
    const expWeek = opportunity.expiresWeek ?? 0
    const expYear = opportunity.expiresYear ?? currentYear
    if (!expWeek || !currentWeek) return 7 // Default fallback
    
    let weeksRemaining = expWeek - currentWeek
    if (expYear > currentYear) {
      weeksRemaining += (expYear - currentYear) * 52
    }
    return Math.max(0, weeksRemaining * 7)
  }, [opportunity, currentWeek, currentYear])
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isAccepting ? 'Schedule Opportunity' : 'Opportunity Received'}
      size="xl"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${getCategoryColor(opportunity.category)}`}>
            {getCategoryIcon(opportunity.category)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default" size="sm">
                {getCategoryLabel(opportunity.category)}
              </Badge>
              <Badge 
                variant={daysUntilExpiry <= 7 ? 'red' : 'default'} 
                size="sm"
              >
                <Clock className="w-3 h-3 mr-1" />
                {daysUntilExpiry} days to respond
              </Badge>
            </div>
            <h3 className="font-display font-bold text-xl">{opportunity.name}</h3>
            <div className="flex items-center gap-2 mt-1 text-text-muted text-sm">
              {getOrganizerIcon(opportunity.organizerType)}
              <span>{opportunity.organizerName}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-accent-gold">
              <Star className="w-4 h-4" />
              <span className="font-bold">{opportunity.prestige}</span>
            </div>
            <span className="text-xs text-text-muted">Prestige</span>
          </div>
        </div>
        
        {/* Description / Email */}
        <Card variant="glass" padding="md">
          <p className="text-sm text-text-secondary whitespace-pre-line">
            {opportunity.emailBodyTemplate}
          </p>
        </Card>
        
        {/* Time Commitment */}
        <div className="flex items-center gap-4 p-3 bg-surface rounded-lg">
          <Clock className="w-5 h-5 text-text-muted" />
          <div>
            <p className="text-sm font-medium">Time Commitment</p>
            <p className="text-xs text-text-muted">
              {opportunity.duration} hours over {opportunity.durationDays} day{opportunity.durationDays > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {/* Benefits Section */}
        {rewardsSummary.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-status-success mb-3 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Benefits if Accepted
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {rewardsSummary.map((reward, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-2 p-2 bg-surface rounded-lg"
                >
                  <reward.icon className={`w-4 h-4 ${reward.color}`} />
                  <div className="flex-1">
                    <span className="text-xs text-text-muted">{reward.label}</span>
                    <p className={`font-bold text-sm ${reward.color}`}>{reward.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Consequences Section */}
        {consequencesSummary.length > 0 && !isAccepting && (
          <div>
            <h4 className="text-sm font-semibold text-status-warning mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Consequences if Declined
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {consequencesSummary.map((consequence, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-2 p-2 bg-status-error/10 border border-status-error/20 rounded-lg"
                >
                  <consequence.icon className={`w-4 h-4 ${consequence.color}`} />
                  <div className="flex-1">
                    <span className="text-xs text-text-muted">{consequence.label}</span>
                    <p className={`font-bold text-sm ${consequence.color}`}>{consequence.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Scheduling Section (when accepting) */}
        {isAccepting && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent-blue" />
              Select Week, Slot & Day
            </h4>

            {/* Time Slot Selection */}
            <div>
              <p className="text-sm text-text-muted mb-2">Pick time slot first:</p>
              <div className="grid grid-cols-4 gap-2">
                {DAY_PERIOD_ORDER.map(period => {
                  const isAllowed = allowedPeriods.includes(period)
                  const isSelected = selectedPeriod === period
                  const PIcon = periodIcons[period]
                  const config = DAY_PERIODS[period]

                  return (
                    <button
                      key={period}
                      type="button"
                      disabled={!isAllowed}
                      onClick={() => {
                        if (!isAllowed) return
                        setSelectedPeriod(period)
                        if (selectedWeek && selectedDay && hasPeriodConflict(selectedWeek, selectedDay, period)) {
                          setSelectedDay(null)
                        }
                      }}
                      className={`
                        p-2 rounded-lg border transition-all text-center
                        ${!isAllowed
                          ? 'opacity-30 cursor-not-allowed border-surface-secondary bg-surface-secondary/20'
                          : isSelected
                            ? 'border-accent-blue bg-accent-blue/20 text-accent-blue ring-2 ring-accent-blue/40'
                            : 'border-surface-secondary bg-surface hover:border-accent-blue/50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <PIcon className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">{config.shortLabel}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Week Selection */}
            <div className="max-h-56 overflow-y-auto pr-1">
              <div className="grid grid-cols-4 gap-2">
              {visibleWeeks.map(week => {
                const conflicts = getWeekConflicts(week)
                const hasConflicts = conflicts.length > 0
                const availableDays = getAvailableDaysForWeekAndPeriod(week, selectedPeriod)
                const hasNoAvailableDays = selectedPeriod ? availableDays === 0 : false
                
                return (
                  <button
                    key={week}
                    type="button"
                    disabled={hasNoAvailableDays}
                    onClick={() => {
                      setSelectedWeek(week)
                      if (selectedPeriod && selectedDay && hasPeriodConflict(week, selectedDay, selectedPeriod)) {
                        setSelectedDay(null)
                      }
                    }}
                    className={`
                      p-3 rounded-lg border-2 transition-all text-center relative
                      ${selectedWeek === week 
                        ? 'border-accent-blue bg-accent-blue/25 ring-2 ring-accent-blue/30 shadow-[0_0_0_1px_rgba(59,130,246,0.35)]' 
                        : 'border-surface-secondary hover:border-surface-tertiary'}
                      ${hasConflicts ? 'opacity-85' : ''}
                      ${hasNoAvailableDays ? 'opacity-40 cursor-not-allowed' : ''}
                    `}
                  >
                    <p className="font-bold">Week {week}</p>
                    {selectedWeek === week && (
                      <span className="absolute top-2 right-2 text-accent-blue">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    )}
                    {hasConflicts && (
                      <p className="text-xs text-status-warning mt-1">
                        {conflicts.length} event{conflicts.length > 1 ? 's' : ''}
                      </p>
                    )}
                    {selectedPeriod && (
                      <p className={`text-xs mt-1 ${hasNoAvailableDays ? 'text-status-error' : 'text-status-success'}`}>
                        {hasNoAvailableDays ? 'No open slots' : `${availableDays} open day${availableDays > 1 ? 's' : ''}`}
                      </p>
                    )}
                  </button>
                )
              })}
              </div>
            </div>
            {availableWeeks.length > 12 && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAllWeeks(v => !v)}
                  className="text-xs px-3 py-1.5 rounded-md border border-surface-secondary text-text-muted hover:text-text-primary hover:border-accent-blue/40 transition-colors"
                >
                  {showAllWeeks
                    ? 'Show fewer weeks'
                    : `Show more weeks (${availableWeeks.length - visibleWeeks.length} more)`}
                </button>
              </div>
            )}
            
            {/* Day Selection */}
            {selectedWeek && (
              <div>
                <p className="text-sm text-text-muted mb-2">Select starting day:</p>
                {!selectedPeriod && (
                  <p className="text-xs text-status-warning mb-2">
                    Choose a time slot first to see available days.
                  </p>
                )}
                <div className="grid grid-cols-7 gap-1">
                  {[1, 2, 3, 4, 5, 6, 7].map(day => {
                    const dayName = getDayName(day)
                    const hasConflict = selectedPeriod
                      ? hasPeriodConflict(selectedWeek, day, selectedPeriod)
                      : false
                    const isDisabled = !selectedPeriod || hasConflict
                    
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        type="button"
                        disabled={isDisabled}
                        className={`
                          p-2 rounded text-xs transition-all border
                          ${selectedDay === day 
                            ? 'bg-accent-blue text-white border-accent-blue ring-2 ring-accent-blue/35' 
                            : hasConflict
                              ? 'bg-status-error/15 border-status-error/40 text-status-error cursor-not-allowed'
                              : !selectedPeriod
                                ? 'bg-surface-secondary/30 border-surface-secondary text-text-muted cursor-not-allowed'
                                : 'bg-surface border-surface-secondary hover:border-accent-blue/50'}
                        `}
                      >
                        <div className="font-semibold">{dayName.substring(0, 3)}</div>
                        <div className="text-[10px] opacity-80">
                          {hasConflict ? 'Taken' : !selectedPeriod ? '-' : 'Open'}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {(selectedWeek && selectedDay && selectedPeriod) && (
              <div className="p-3 rounded-lg bg-accent-blue/10 border border-accent-blue/30 text-sm">
                <p className="font-medium text-accent-blue">
                  Scheduled for Week {selectedWeek}, {getDayName(selectedDay)}, {DAY_PERIODS[selectedPeriod].shortLabel}
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-surface-secondary">
          {!isAccepting ? (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDecline}
              >
                <X className="w-4 h-4 mr-2" />
                Decline
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => setIsAccepting(true)}
              >
                <Check className="w-4 h-4 mr-2" />
                Accept
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsAccepting(false)}
              >
                Back
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleAccept}
                disabled={!selectedWeek || !selectedDay || !selectedPeriod}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Confirm Schedule
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}

// default export is on the function declaration above
