// ============================================
// DAY PERIODS CONFIGURATION
// ============================================
// Defines the time-of-day system: morning, afternoon, evening, night.
// Activities and messages use these periods for realistic scheduling.

import type { ContactInfo } from '@/types/personalLife'

// ============================================
// TYPES
// ============================================

export type DayPeriod = 'morning' | 'afternoon' | 'evening' | 'night'

export interface DayPeriodConfig {
  startHour: number
  endHour: number
  label: string
  shortLabel: string
  hoursInPeriod: number
}

// ============================================
// PERIOD DEFINITIONS
// ============================================

export const DAY_PERIODS: Record<DayPeriod, DayPeriodConfig> = {
  morning:   { startHour: 7,  endHour: 12, label: 'Morning (7am – 12pm)',  shortLabel: 'Morning',   hoursInPeriod: 5 },
  afternoon: { startHour: 12, endHour: 17, label: 'Afternoon (12pm – 5pm)', shortLabel: 'Afternoon', hoursInPeriod: 5 },
  evening:   { startHour: 17, endHour: 22, label: 'Evening (5pm – 10pm)',   shortLabel: 'Evening',   hoursInPeriod: 5 },
  night:     { startHour: 22, endHour: 23, label: 'Night (10pm – 11pm)',    shortLabel: 'Night',     hoursInPeriod: 1 },
}

/** Ordered list of periods for iteration */
export const DAY_PERIOD_ORDER: DayPeriod[] = ['morning', 'afternoon', 'evening', 'night']

/** The hour the day starts (7 AM) */
export const DAY_START_HOUR = 7

/** The hour the day ends (11 PM) */
export const DAY_END_HOUR = 23

// ============================================
// PERIOD HELPERS
// ============================================

/**
 * Determines which period a given hour falls into.
 * Hours before 7 or at/after 23 are clamped to night.
 */
export function getPeriodForHour(hour: number): DayPeriod {
  if (hour < DAY_PERIODS.morning.startHour) return 'night'
  if (hour < DAY_PERIODS.afternoon.startHour) return 'morning'
  if (hour < DAY_PERIODS.evening.startHour) return 'afternoon'
  if (hour < DAY_PERIODS.night.startHour) return 'evening'
  return 'night'
}

/**
 * Returns how many hours remain in the current period.
 */
export function getHoursRemainingInPeriod(currentHour: number): number {
  const period = getPeriodForHour(currentHour)
  const config = DAY_PERIODS[period]
  return Math.max(0, config.endHour - currentHour)
}

/**
 * Formats a fractional game hour into a display string.
 * e.g. 14.5 -> "2:30 PM", 9 -> "9:00 AM", 22.25 -> "10:15 PM"
 */
export function formatGameHour(hour: number): string {
  const h = Math.floor(hour)
  const m = Math.round((hour - h) * 60)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h
  const displayMinute = m.toString().padStart(2, '0')
  return `${displayHour}:${displayMinute} ${period}`
}

/**
 * Formats a game hour into a short 24h string for compact displays.
 * e.g. 14.5 -> "14:30"
 */
export function formatGameHour24(hour: number): string {
  const h = Math.floor(hour)
  const m = Math.round((hour - h) * 60)
  return `${h}:${m.toString().padStart(2, '0')}`
}

// ============================================
// ACTIVITY PERIOD VALIDATION
// ============================================

export interface PeriodCheckResult {
  allowed: boolean
  reason?: string
  currentPeriod: DayPeriod
  nextAvailableHour?: number
  nextAvailablePeriod?: DayPeriod
}

/**
 * Checks if an activity can be performed at the current hour,
 * given its allowed periods. If no allowedPeriods are set, always allowed.
 */
export function canDoActivityInCurrentPeriod(
  allowedPeriods: DayPeriod[] | undefined,
  currentHour: number
): PeriodCheckResult {
  const currentPeriod = getPeriodForHour(currentHour)

  // No restriction = always allowed
  if (!allowedPeriods || allowedPeriods.length === 0) {
    return { allowed: true, currentPeriod }
  }

  // Check if current period is in the allowed list
  if (allowedPeriods.includes(currentPeriod)) {
    return { allowed: true, currentPeriod }
  }

  // Not allowed — find the next available period
  const currentPeriodIndex = DAY_PERIOD_ORDER.indexOf(currentPeriod)
  for (let offset = 1; offset <= DAY_PERIOD_ORDER.length; offset++) {
    const nextIndex = (currentPeriodIndex + offset) % DAY_PERIOD_ORDER.length
    const nextPeriod = DAY_PERIOD_ORDER[nextIndex]
    if (allowedPeriods.includes(nextPeriod)) {
      const nextConfig = DAY_PERIODS[nextPeriod]
      // If the next available period is earlier in the day (wrapped around), it means tomorrow
      const isToday = nextIndex > currentPeriodIndex
      return {
        allowed: false,
        currentPeriod,
        nextAvailableHour: isToday ? nextConfig.startHour : undefined,
        nextAvailablePeriod: nextPeriod,
        reason: isToday
          ? `Available in the ${nextPeriod} (after ${formatGameHour(nextConfig.startHour)})`
          : `Only available in the ${nextPeriod} — try again tomorrow`
      }
    }
  }

  return {
    allowed: false,
    currentPeriod,
    reason: 'Not available at any time today'
  }
}

// ============================================
// CONTACT RESPONSE WINDOWS
// ============================================
// Defines when each contact type is likely to respond to messages.
// The player can ALWAYS send a message at any time.
// Replies from NPCs are delayed until within their response window.

export interface ContactResponseWindow {
  startHour: number    // Earliest hour they respond (e.g. 8 = 8 AM)
  endHour: number      // Latest hour they respond (e.g. 18 = 6 PM)
  weekdaysOnly?: boolean  // If true, no responses on weekends (day 6-7)
}

export const CONTACT_RESPONSE_WINDOWS: Record<string, ContactResponseWindow> = {
  // Business contacts — office hours only
  team_staff:       { startHour: 8,  endHour: 18 },
  sponsor_rep:      { startHour: 9,  endHour: 18, weekdaysOnly: true },
  team_principal:   { startHour: 8,  endHour: 19 },

  // Personal contacts — wider availability
  partner:          { startHour: 7,  endHour: 23 },
  potential_date:   { startHour: 9,  endHour: 23 },
  family:           { startHour: 8,  endHour: 22 },
  friend:           { startHour: 10, endHour: 23 },
  rival_driver:     { startHour: 12, endHour: 22 },

  // Fallback for unknown types
  _default:         { startHour: 8,  endHour: 22 },
}

/**
 * Gets the response window for a contact based on their type.
 */
export function getContactResponseWindow(contactType: string): ContactResponseWindow {
  return CONTACT_RESPONSE_WINDOWS[contactType] ?? CONTACT_RESPONSE_WINDOWS._default
}

/**
 * Checks if a contact would respond at the given hour and day.
 * Returns true if they're within their active window.
 */
export function isContactInResponseWindow(
  contactType: string,
  currentHour: number,
  currentDay: number  // 1-7 (Mon-Sun, 6-7 = weekend)
): boolean {
  const window = getContactResponseWindow(contactType)
  
  // Check weekday restriction
  if (window.weekdaysOnly && currentDay >= 6) return false
  
  // Check hour range
  return currentHour >= window.startHour && currentHour < window.endHour
}

/**
 * Calculates the next hour + day when a contact would respond,
 * given the current hour and day. Used to set scheduledDeliveryHour/Day
 * for delayed NPC replies.
 * 
 * Returns { hour, dayOffset } where dayOffset is 0 for today, 1 for tomorrow, etc.
 */
export function getNextResponseTime(
  contactType: string,
  currentHour: number,
  currentDay: number  // 1-7
): { hour: number; dayOffset: number } {
  const window = getContactResponseWindow(contactType)
  
  // Check if they'd respond right now
  if (isContactInResponseWindow(contactType, currentHour, currentDay)) {
    // Add a small random offset (1-15 min = 0.02-0.25 hours) for realism
    const offset = 0.02 + Math.random() * 0.23
    return { hour: Math.min(currentHour + offset, window.endHour - 0.1), dayOffset: 0 }
  }
  
  // Not in window — figure out when they next would be
  // First check: later today?
  if (currentHour < window.startHour) {
    // It's before their window starts today
    const isWeekend = currentDay >= 6
    if (!window.weekdaysOnly || !isWeekend) {
      // They'll be available later today
      const randomOffset = Math.random() * 0.5  // 0-30 min after window opens
      return { hour: window.startHour + randomOffset, dayOffset: 0 }
    }
  }
  
  // Next business day
  let dayOffset = 1
  let checkDay = currentDay + 1
  
  // If weekdays only, skip to Monday
  if (window.weekdaysOnly) {
    while (((checkDay - 1) % 7) + 1 >= 6) {
      dayOffset++
      checkDay++
    }
  }
  
  // Random time within their morning window
  const randomOffset = Math.random() * 1.0  // 0-60 min after window opens
  return { hour: window.startHour + randomOffset, dayOffset }
}

// ============================================
// DATE/TIME DISPLAY HELPERS (for Phone UI)
// ============================================

/**
 * Returns a relative label for a message timestamp compared to current game time.
 * Used for WhatsApp-style date separators and conversation list timestamps.
 */
export function getRelativeDayLabel(
  msgWeek: number, msgDay: number, msgYear: number,
  currentWeek: number, currentDay: number, currentYear: number
): string {
  // Same day
  if (msgYear === currentYear && msgWeek === currentWeek && msgDay === currentDay) {
    return 'Today'
  }
  
  // Yesterday (handle week boundary)
  const isYesterday = (
    (msgYear === currentYear && msgWeek === currentWeek && msgDay === currentDay - 1) ||
    (msgYear === currentYear && msgWeek === currentWeek - 1 && currentDay === 1 && msgDay === 7)
  )
  if (isYesterday) return 'Yesterday'
  
  // Same week — show day name
  if (msgYear === currentYear && msgWeek === currentWeek) {
    const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    return dayNames[msgDay] || `Day ${msgDay}`
  }
  
  // Different week
  if (msgYear === currentYear) {
    return `Week ${msgWeek}, Day ${msgDay}`
  }
  
  // Different year
  return `Year ${msgYear}, Wk ${msgWeek}`
}

/**
 * Returns a compact relative time label for the conversation list.
 * - Same day: formatted time (e.g. "2:30 PM")
 * - Yesterday: "Yesterday"  
 * - Same week: day name ("Mon", "Tue", etc.)
 * - Older: "Wk 3"
 */
export function getConversationListTimestamp(
  msgWeek: number, msgDay: number, msgHour: number, msgYear: number,
  currentWeek: number, currentDay: number, currentYear: number
): string {
  // Same day — show time
  if (msgYear === currentYear && msgWeek === currentWeek && msgDay === currentDay) {
    return formatGameHour(msgHour)
  }
  
  // Yesterday
  const isYesterday = (
    (msgYear === currentYear && msgWeek === currentWeek && msgDay === currentDay - 1) ||
    (msgYear === currentYear && msgWeek === currentWeek - 1 && currentDay === 1 && msgDay === 7)
  )
  if (isYesterday) return 'Yesterday'
  
  // Same week
  if (msgYear === currentYear && msgWeek === currentWeek) {
    const shortDays = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return shortDays[msgDay] || `Day ${msgDay}`
  }
  
  // Older
  return `Wk ${msgWeek}`
}
