// ============================================
// USE OWNER ACTION - Central Action Utility
// ============================================
// One-stop hook for any player action that should:
// 1. Check if they have enough time
// 2. Consume hours from the day budget
// 3. Create a calendar entry (ScheduledActivity)
// 4. Send a notification (email or phone) via the notification router
// 5. Then run the actual action logic
//
// Usage:
//   const { performAction, canPerform } = useOwnerAction()
//   performAction({ activityId: 'date_dinner', activityName: 'Dinner Date', ... })

import { useCallback } from 'react'
import { useCareerStore, type DrainLevel, type CalendarEntryType, type ActivityCategory } from '@/store/careerStore'
import { getActivityTimeCost, requiresOwnerTime, type ActivityTimeCost } from '@/data/activity-time-costs'
import { routeNotification } from '@/services/notificationRouter';