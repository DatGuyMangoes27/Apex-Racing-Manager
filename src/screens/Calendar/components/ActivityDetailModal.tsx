/**
 * ActivityDetailModal
 * Shows full details for a scheduled activity when the user clicks a card in the day panel.
 */

import {
  X,
  Clock,
  DollarSign,
  Calendar,
  MapPin,
  AlertTriangle,
  Check,
  XCircle,
  Handshake,
  Users,
  Wrench,
  Newspaper,
  Heart,
  Car,
  Flag,
} from 'lucide-react'
import { Modal, Button, Badge } from '@/components/ui'
import { getDayName } from '@/store/careerStore'
import type { ScheduledActivity, ActivityCategory, ActivityEffect } from '@/store/careerStore'

const EFFECT_LABELS: Record<string, string> = {
  boardMood: 'Board mood',
  sponsorSatisfaction: 'Sponsor satisfaction',
  teamMorale: 'Team morale',
  driverFatigue: 'Driver fatigue',
  driverMorale: 'Driver morale',
  reputation: 'Reputation',
  cash: 'Cash',
  developmentPoints: 'R&D points',
  fanSentiment: 'Fan sentiment',
  confidence: 'Confidence',
  stress: 'Stress',
  fitness: 'Fitness',
  marketability: 'Marketability',
  mentalStrength: 'Mental strength',
}

function formatEffectSummary(effect: ActivityEffect): string[] {
  const lines: string[] = []
  for (const [key, value] of Object.entries(effect)) {
    if (value === undefined || value === null) continue
    if (typeof value === 'boolean') {
      if (value) lines.push(EFFECT_LABELS[key] || key)
      continue
    }
    if (typeof value === 'number') {
      const label = EFFECT_LABELS[key] || key
      const sign = value >= 0 ? '+' : ''
      lines.push(`${label} ${sign}${value}`)
    }
  }
  return lines
}

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
  }
  return icons[category] || Clock
}

export interface ActivityDetailModalProps {
  activity: ScheduledActivity | null
  onClose: () => void
  isToday?: boolean
  isPast?: boolean
  onAttend?: (activity: ScheduledActivity) => void
  onComplete?: (activityId: string) => void
  onCancel?: (activityId: string) => void
  onReschedule?: (activity: ScheduledActivity) => void
}

export function ActivityDetailModal({
  activity,
  onClose,
  isToday = false,
  isPast = false,
  onAttend,
  onComplete,
  onCancel,
  onReschedule,
}: ActivityDetailModalProps) {
  const isOpen = !!activity
  if (!activity) return null

  const Icon = getCategoryIcon(activity.category)
  const styles = getCategoryStyle(activity.category)
  const spanDays = activity.spanDays || 1
  const completeLines = formatEffectSummary(activity.effectsOnComplete || {})
  const missLines = formatEffectSummary(activity.effectsOnMiss || {})
  const canReschedule =
    activity.canReschedule ||
    ((activity.triggeredBy === 'after_car_purchase' || activity.triggeredBy === 'after_series_entry') &&
      activity.deadline)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={activity.name} size="md" showCloseButton={true}>
      <div className="p-6 pt-0">
        {/* Category + badges */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl ${styles.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${styles.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="default" className="text-xs">
                {activity.category}
              </Badge>
              {activity.mandatory && (
                <Badge variant="orange" className="text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Mandatory
                </Badge>
              )}
              {activity.status === 'completed' && (
                <Badge variant="green" className="text-xs">Completed</Badge>
              )}
              {activity.status === 'missed' && (
                <Badge variant="red" className="text-xs">Missed</Badge>
              )}
            </div>
          </div>
        </div>

        {activity.description && (
          <p className="text-sm text-text-muted mb-4">{activity.description}</p>
        )}

        {/* Details grid */}
        <div className="space-y-3 text-sm mb-4">
          <div className="flex items-center gap-2 text-text-muted">
            <Clock className="w-4 h-4" />
            <span>{activity.duration}h</span>
            {spanDays > 1 && <span className="text-accent-purple">({spanDays} days)</span>}
          </div>
          {((activity.totalCost != null && activity.totalCost > 0) ||
            (activity.requiredCash != null && activity.requiredCash > 0)) && (
            <div className="flex items-center gap-2 text-text-muted">
              <DollarSign className="w-4 h-4" />
              <span>
                ${(activity.totalCost ?? activity.requiredCash ?? 0).toLocaleString()}
              </span>
            </div>
          )}
          {activity.rescheduleCost != null && activity.rescheduleCost > 0 && (
            <div className="flex items-center gap-2 text-accent-orange">
              <Calendar className="w-4 h-4" />
              <span>${activity.rescheduleCost.toLocaleString()} to reschedule</span>
            </div>
          )}
          {activity.deadline && typeof activity.deadline === 'object' && (
            <div className="flex items-center gap-2 text-text-muted">
              <Calendar className="w-4 h-4" />
              <span>
                Before Week {activity.deadline.week}, Day {activity.deadline.day} (
                {getDayName(activity.deadline.day)})
              </span>
            </div>
          )}
          {activity.rescheduleDeadline != null && !activity.deadline && (
            <div className="flex items-center gap-2 text-text-muted">
              <Calendar className="w-4 h-4" />
              <span>Must be before week {activity.rescheduleDeadline}</span>
            </div>
          )}
          {activity.configuration?.venueId && (
            <div className="flex items-center gap-2 text-text-muted">
              <MapPin className="w-4 h-4" />
              <span>{activity.configuration.venueName || 'Venue'}</span>
            </div>
          )}
        </div>

        {/* Effects on complete */}
        {completeLines.length > 0 && activity.status === 'scheduled' && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
              On completion
            </p>
            <p className="text-sm text-status-success">{completeLines.join(', ')}</p>
          </div>
        )}

        {/* Effects on miss */}
        {missLines.length > 0 && activity.status === 'scheduled' && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
              If missed or cancelled
            </p>
            <p className="text-sm text-status-error">{missLines.join(', ')}</p>
          </div>
        )}

        {/* Actions (only for scheduled, non-past) */}
        {activity.status === 'scheduled' && !isPast && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-surface-border">
            {isToday && (onAttend || onComplete) && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (onAttend) onAttend(activity)
                  else if (onComplete) onComplete(activity.id)
                  onClose()
                }}
              >
                <Check className="w-4 h-4 mr-1" />
                {onAttend ? 'Attend Event' : 'Complete'}
              </Button>
            )}
            {!activity.mandatory && onCancel && (
              <Button
                variant="ghost"
                size="sm"
                className="text-status-error hover:bg-status-error/20"
                onClick={() => {
                  onCancel(activity.id)
                  onClose()
                }}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Cancel activity
              </Button>
            )}
            {canReschedule && onReschedule && (
              <Button
                variant="ghost"
                size="sm"
                className="text-accent-blue hover:bg-accent-blue/20"
                onClick={() => {
                  onReschedule(activity)
                  onClose()
                }}
              >
                <Calendar className="w-4 h-4 mr-1" />
                Reschedule
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
