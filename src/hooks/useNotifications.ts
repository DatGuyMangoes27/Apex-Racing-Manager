import { useMemo } from 'react'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'

export interface Notification {
  id: string
  screen: string  // matches sidebar path (e.g., '/race-day', '/media')
  type: 'action' | 'warning' | 'info'
  message: string
  priority: number  // higher = more important
}

export interface NotificationsByScreen {
  [path: string]: Notification[]
}

/**
 * Hook that computes pending notifications from career state
 * Returns notifications grouped by screen/path for sidebar badges
 */
export function useNotifications() {
  const { player, careerState, hasUnresolvedConflicts } = useCareerStore()
  const { getSeriesById } = useRivalStore()

  const notifications = useMemo<Notification[]>(() => {
    if (!player || !careerState) return []

    const notifs: Notification[] = []

    // Get current series for race week detection
    const currentSeries = player.currentSeriesId ? getSeriesById(player.currentSeriesId) : null
    const calendar = currentSeries?.calendar ?? []
    const isRaceWeek = calendar.some(r => r.week === careerState.currentWeek)

    // ============================================
    // Race Day: Is race week
    // ============================================
    if (isRaceWeek && player.contract) {
      notifs.push({
        id: 'race-week',
        screen: '/race-day',
        type: 'action',
        message: 'Race this week!',
        priority: 100
      })
    }

    // ============================================
    // Media: Pending press conference
    // ============================================
    // Check for post-race press conference (last race was recent)
    const lastRace = player.raceHistory.length > 0 
      ? player.raceHistory[player.raceHistory.length - 1] 
      : null
    const lastRaceWasRecent = lastRace && player.currentSeriesId === lastRace.seriesId
    
    // Pre-race press conference on race week
    if ((isRaceWeek && player.contract) || lastRaceWasRecent) {
      notifs.push({
        id: 'press-conference',
        screen: '/media',
        type: 'action',
        message: 'Press conference',
        priority: 80
      })
    }

    // ============================================
    // Finances: Pending sponsor offers
    // ============================================
    const pendingSponsorOffers = careerState.pendingSponsorOffers?.length || 0
    if (pendingSponsorOffers > 0) {
      notifs.push({
        id: 'sponsor-offers',
        screen: '/finances',
        type: 'action',
        message: `${pendingSponsorOffers} sponsor offer${pendingSponsorOffers > 1 ? 's' : ''}`,
        priority: 70
      })
    }

    // ============================================
    // Finances: Low funds warning
    // ============================================
    if (player.finances.bankBalance < 5000) {
      notifs.push({
        id: 'low-funds',
        screen: '/finances',
        type: 'warning',
        message: 'Low funds',
        priority: 90
      })
    }

    // ============================================
    // Contracts: Contract expiring soon
    // ============================================
    if (player.contract) {
      const currentYear = careerState.currentYear
      const currentWeek = careerState.currentWeek
      const contractEndYear = player.contract.endYear
      
      // If contract ends this year and we're in the last 4 weeks of the season (week > 48)
      // Or if contract ends next year but we're near end of current year
      const weeksUntilSeasonEnd = 52 - currentWeek
      const isContractExpiringSoon = (contractEndYear === currentYear && weeksUntilSeasonEnd <= 4)
      
      if (isContractExpiringSoon) {
        notifs.push({
          id: 'contract-expiring',
          screen: '/contracts',
          type: 'warning',
          message: 'Contract expiring',
          priority: 85
        })
      }
    }

    // ============================================
    // Calendar: Unresolved conflicts
    // ============================================
    if (hasUnresolvedConflicts()) {
      notifs.push({
        id: 'calendar-conflict',
        screen: '/calendar',
        type: 'warning',
        message: 'Calendar conflict',
        priority: 95
      })
    }

    // ============================================
    // Phone: Unread messages
    // ============================================
    const messaging = careerState.messaging
    if (messaging) {
      const nowYear = careerState.currentYear
      const nowWeek = careerState.currentWeek
      const nowDay = careerState.currentDay ?? 1
      const nowHour = careerState.dayBudget?.currentHour ?? 23

      const isDeliveredNow = (msg: any): boolean => {
        if (!msg?.timestamp) return true
        const ts = msg.timestamp
        const msgYear = ts.year ?? nowYear
        const msgWeek = ts.week ?? nowWeek
        const msgDay = ts.day ?? nowDay
        const msgHour = ts.hour ?? 0

        if (msgYear < nowYear) return true
        if (msgYear > nowYear) return false
        if (msgWeek < nowWeek) return true
        if (msgWeek > nowWeek) return false
        if (msgDay < nowDay) return true
        if (msgDay > nowDay) return false
        return msgHour <= nowHour
      }

      // Derive unread from unread, deliverable messages instead of trusting
      // cached unread counters. This prevents future-hour queued messages from
      // surfacing early as "unread now".
      const totalUnread = Object.values(messaging.conversations || {}).reduce((sum, conv: any) => {
        const messages = Array.isArray(conv?.messages) ? conv.messages : []
        const unreadVisible = messages.filter((m: any) => !(m?.isRead || m?.read) && isDeliveredNow(m)).length
        return sum + unreadVisible
      }, 0)
      
      if (totalUnread > 0) {
        notifs.push({
          id: 'unread-messages',
          screen: '/phone',
          type: 'action',
          message: `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}`,
          priority: 60
        })
      }
      
      // Pending contact requests (gameplay action needed)
      const pendingRequests = messaging.pendingRequests?.filter(
        (r: any) => r.status === 'pending'
      ) || []
      if (pendingRequests.length > 0) {
        notifs.push({
          id: 'contact-requests',
          screen: '/phone',
          type: 'action',
          message: `${pendingRequests.length} request${pendingRequests.length > 1 ? 's' : ''} from contacts`,
          priority: 55
        })
      }
      
      // Group chat unread
      const groupUnread = Object.values(messaging.groupConversations || {}).reduce(
        (sum, gc: any) => sum + (gc?.unreadCount || 0), 0
      )
      if (groupUnread > 0) {
        notifs.push({
          id: 'group-unread',
          screen: '/phone',
          type: 'info',
          message: `${groupUnread} group message${groupUnread > 1 ? 's' : ''}`,
          priority: 40
        })
      }
      
      // Partner ghosting warning
      const partner = messaging.contacts?.find((c: any) => c.type === 'partner')
      if (partner) {
        const partnerConvId = `conv_${partner.id}`
        const partnerConv = messaging.conversations?.[partnerConvId] as any
        if (partnerConv?.playerGhostedDays && partnerConv.playerGhostedDays >= 3) {
          notifs.push({
            id: 'partner-ghosting',
            screen: '/phone',
            type: 'warning',
            message: `${partner.name} hasn't heard from you!`,
            priority: 75
          })
        }
      }
    }

    // Sort by priority (highest first)
    return notifs.sort((a, b) => b.priority - a.priority)
  }, [player, careerState, getSeriesById, hasUnresolvedConflicts])

  // Group notifications by screen
  const notificationsByScreen = useMemo<NotificationsByScreen>(() => {
    const byScreen: NotificationsByScreen = {}
    for (const notif of notifications) {
      if (!byScreen[notif.screen]) {
        byScreen[notif.screen] = []
      }
      byScreen[notif.screen].push(notif)
    }
    return byScreen
  }, [notifications])

  // Get total count of all notifications
  const totalCount = notifications.length

  // Check if a specific screen has notifications
  const hasNotifications = (path: string): boolean => {
    return (notificationsByScreen[path]?.length || 0) > 0
  }

  // Get notifications for a specific screen
  const getNotificationsForScreen = (path: string): Notification[] => {
    return notificationsByScreen[path] || []
  }

  // Get count for a specific screen
  const getNotificationCount = (path: string): number => {
    return notificationsByScreen[path]?.length || 0
  }

  return {
    notifications,
    notificationsByScreen,
    totalCount,
    hasNotifications,
    getNotificationsForScreen,
    getNotificationCount
  }
}

