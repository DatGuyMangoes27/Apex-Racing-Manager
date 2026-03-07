import { Clock, Sun, ArrowRight, CalendarCheck } from 'lucide-react'
import { Modal } from '@/components/ui'
import type { MissedNotification, ScheduledActivity } from '@/store/careerStore'

interface EndDayModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  hoursRemaining?: number
  activitiesCompleted?: number
  missedNotifications?: MissedNotification[]
  incompleteActivities?: ScheduledActivity[]
  className?: string
}

function getMissedHint(item: MissedNotification): string {
  if (item.staffRoleKey) {
    return `Hire a ${item.missingRoleLabel || 'team staff member'} in Staff Market.`
  }
  if (item.personalLifeField) {
    return `Add a ${item.missingRoleLabel || 'contact'} in Personal Life.`
  }
  return 'Add the right contact or staff to receive these.'
}

export function EndDayModal({
  isOpen,
  onClose,
  onConfirm,
  hoursRemaining = 0,
  activitiesCompleted = 0,
  missedNotifications = [],
  incompleteActivities = []
}: EndDayModalProps) {
  const digestItems = missedNotifications.slice(0, 3)
  const extraCount = Math.max(0, missedNotifications.length - digestItems.length)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="End Day">
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <Sun className="w-5 h-5 text-yellow-400" />
          <div>
            <p className="text-sm text-text-primary">{activitiesCompleted} activities completed today</p>
            {hoursRemaining > 0 && (
              <p className="text-xs text-yellow-400">{hoursRemaining} hours remaining unused</p>
            )}
          </div>
        </div>
        <p className="text-sm text-text-muted">
          {hoursRemaining > 0
            ? 'You still have free hours. Are you sure you want to end the day?'
            : 'Ready to end the day and advance to tomorrow.'}
        </p>
        {incompleteActivities.length > 0 && (
          <div className="rounded-lg border border-surface-border/60 bg-surface-secondary/40 p-3 space-y-2">
            <p className="text-sm font-medium text-text-primary flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-amber-500" />
              Scheduled for today (not completed)
            </p>
            <p className="text-xs text-text-muted">
              You have {incompleteActivities.length} activit{incompleteActivities.length === 1 ? 'y' : 'ies'} you haven&apos;t completed. Go to Calendar to complete them or end the day to risk missing them.
            </p>
            <ul className="space-y-1.5">
              {incompleteActivities.map(activity => (
                <li key={activity.id} className="text-xs text-text-primary flex items-center gap-2">
                  <span className="truncate">{activity.name}</span>
                  {activity.mandatory && (
                    <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      Mandatory
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {missedNotifications.length > 0 && (
          <div className="rounded-lg border border-surface-border/60 bg-surface-secondary/40 p-3 space-y-2">
            <p className="text-sm font-medium text-text-primary">Missed notifications today</p>
            <div className="space-y-2">
              {digestItems.map(item => (
                <div key={item.id} className="text-xs text-text-muted">
                  <div className="text-text-primary">{item.subject}</div>
                  <div>{getMissedHint(item)}</div>
                </div>
              ))}
            </div>
            {extraCount > 0 && (
              <p className="text-xs text-text-muted">+{extraCount} more missed notifications</p>
            )}
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2">
            <ArrowRight className="w-4 h-4" /> End Day
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default EndDayModal
