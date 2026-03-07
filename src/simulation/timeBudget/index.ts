// ============================================
// TIME BUDGET SERVICE
// ============================================
// Pure functions for the daily time budget + fatigue system (Option C).
// Each day the owner has a pool of hours. Activities consume hours.
// Overworking causes fatigue that carries over to the next day.
// Rest days recover fatigue debt.

import type { DayBudgetState, DayLogEntry, DrainLevel } from '@/store/careerStore'

// ============================================
// CONFIGURATION CONSTANTS
// ============================================

export const TIME_BUDGET_CONFIG = {
  /** Base waking hours per day */
  BASE_HOURS: 16,

  /** Green zone: 0 to this value = comfortable, no fatigue penalty */
  GREEN_ZONE_MAX: 10,

  /** Yellow zone: GREEN_ZONE_MAX to this value = pushing it, minor carry-over */
  YELLOW_ZONE_MAX: 13,

  /** Red zone: YELLOW_ZONE_MAX to BASE_HOURS = exhausting, heavy carry-over */
  RED_ZONE_MAX: 16,

  /** Hours of fatigue debt per hour spent in yellow zone */
  YELLOW_PENALTY_PER_HOUR: 0.25,

  /** Hours of fatigue debt per hour spent in red zone */
  RED_PENALTY_PER_HOUR: 0.5,

  /** If you end the day with fewer than this many hours used, you get rest recovery */
  REST_RECOVERY_THRESHOLD: 10,

  /** Hours of fatigue debt recovered on a rest day */
  REST_RECOVERY_AMOUNT: 3,

  /** Hours of fatigue debt recovered per restorative hour spent */
  RESTORATIVE_DEBT_RECOVERY_PER_HOUR: 0.25,

  /** Maximum fatigue debt that can accumulate (caps how bad it gets) */
  MAX_FATIGUE_DEBT: 6,

  /** Even at maximum fatigue + jet lag, you always get at least this many hours */
  MIN_DAILY_HOURS: 10,

  /** Drain multipliers: how "tiring" each drain level is relative to clock hours */
  DRAIN_MULTIPLIERS: {
    restorative: -0.5,  // Actually reduces effective fatigue hours
    low: 0.75,          // Less tiring than clock time
    normal: 1.0,        // Fatigue matches clock time
    high: 1.5           // More tiring than clock time
  } as Record<DrainLevel, number>,
} as const

// ============================================
// FATIGUE ZONE CALCULATION
// ============================================

export type FatigueZone = 'green' | 'yellow' | 'red'

/**
 * Determines what fatigue zone the player is currently in based on hours used.
 */
export function calculateFatigueZone(hoursUsed: number): FatigueZone {
  if (hoursUsed <= TIME_BUDGET_CONFIG.GREEN_ZONE_MAX) return 'green'
  if (hoursUsed <= TIME_BUDGET_CONFIG.YELLOW_ZONE_MAX) return 'yellow'
  return 'red'
}

/**
 * Returns a human-readable label and color info for a fatigue zone.
 */
export function getFatigueZoneInfo(zone: FatigueZone): { label: string; color: string; description: string } {
  switch (zone) {
    case 'green':
      return { label: 'Comfortable', color: 'text-status-success', description: 'Fatigue recovery active' }
    case 'yellow':
      return { label: 'Pushing It', color: 'text-accent-orange', description: 'Minor fatigue carry-over tomorrow' }
    case 'red':
      return { label: 'Exhausting', color: 'text-accent-red', description: 'Heavy fatigue carry-over tomorrow' }
  }
}

// ============================================
// DRAIN MULTIPLIER
// ============================================

/**
 * Returns the drain multiplier for a given drain level.
 * - restorative: -0.5x (reduces fatigue)
 * - low: 0.75x (easier than clock time)
 * - normal: 1.0x (standard)
 * - high: 1.5x (more draining than clock time)
 */
export function getDrainMultiplier(drainLevel: DrainLevel): number {
  return TIME_BUDGET_CONFIG.DRAIN_MULTIPLIERS[drainLevel] ?? 1.0
}

// ============================================
// DAILY POOL CALCULATION
// ============================================

/**
 * Calculates the total hours available for a new day, accounting for fatigue debt,
 * jet lag, and any bonuses (lifestyle upgrades, etc.)
 */
export function calculateDailyPool(
  fatigueDebt: number = 0,
  jetLagPenalty: number = 0,
  bonusHours: number = 0
): number {
  const raw = TIME_BUDGET_CONFIG.BASE_HOURS - fatigueDebt - jetLagPenalty + bonusHours
  return Math.max(TIME_BUDGET_CONFIG.MIN_DAILY_HOURS, Math.round(raw * 4) / 4) // Round to nearest 0.25
}

// ============================================
// ACTION GATING
// ============================================

/**
 * Checks if the player can afford to do an activity with the given hour cost.
 */
export function canPerformAction(hoursRemaining: number, actionCost: number): boolean {
  return hoursRemaining >= actionCost
}

// ============================================
// HOUR CONSUMPTION
// ============================================

/**
 * Consumes hours from the day budget and returns the updated state.
 * Does NOT mutate -- returns a new DayBudgetState.
 */
export function consumeHours(
  dayBudget: DayBudgetState,
  hours: number,
  drainLevel: DrainLevel,
  activityName: string,
  activityId?: string
): DayBudgetState {
  const effectiveHours = hours * getDrainMultiplier(drainLevel)

  const newEntry: DayLogEntry = {
    activityId: activityId || `action_${Date.now()}`,
    name: activityName,
    hoursSpent: hours,
    drainLevel,
    effectiveHours,
    timestamp: dayBudget.dayLog.length + 1
  }

  return {
    ...dayBudget,
    hoursUsed: dayBudget.hoursUsed + hours,
    hoursRemaining: Math.max(0, dayBudget.hoursRemaining - hours),
    currentHour: Math.min(23, (dayBudget.currentHour ?? 7) + hours),  // Advance the clock
    dayLog: [...dayBudget.dayLog, newEntry],
    activitiesCompletedToday: activityId
      ? [...dayBudget.activitiesCompletedToday, activityId]
      : dayBudget.activitiesCompletedToday
  }
}

// ============================================
// FATIGUE CARRY-OVER CALCULATION
// ============================================

/**
 * Calculates how much fatigue debt carries over to the next day based on:
 * 1. Total hours used (which fatigue zone was reached)
 * 2. Drain levels of activities (high drain = more fatigue per hour)
 * 
 * The calculation uses "effective hours" which account for drain multipliers,
 * then applies zone-based penalties on the effective hours in each zone.
 */
export function calculateFatigueCarryOver(dayLog: DayLogEntry[]): number {
  if (dayLog.length === 0) return 0

  // Sum up effective hours (drain-weighted)
  const totalEffectiveHours = dayLog.reduce((sum, entry) => {
    // Restorative activities reduce effective hours (can go negative)
    return sum + Math.max(0, entry.effectiveHours)
  }, 0)

  // Calculate carry-over based on effective hours in each zone
  let carryOver = 0

  if (totalEffectiveHours > TIME_BUDGET_CONFIG.GREEN_ZONE_MAX) {
    // Hours in yellow zone
    const yellowHours = Math.min(
      totalEffectiveHours - TIME_BUDGET_CONFIG.GREEN_ZONE_MAX,
      TIME_BUDGET_CONFIG.YELLOW_ZONE_MAX - TIME_BUDGET_CONFIG.GREEN_ZONE_MAX
    )
    carryOver += yellowHours * TIME_BUDGET_CONFIG.YELLOW_PENALTY_PER_HOUR

    // Hours in red zone
    if (totalEffectiveHours > TIME_BUDGET_CONFIG.YELLOW_ZONE_MAX) {
      const redHours = totalEffectiveHours - TIME_BUDGET_CONFIG.YELLOW_ZONE_MAX
      carryOver += redHours * TIME_BUDGET_CONFIG.RED_PENALTY_PER_HOUR
    }
  }

  // Restorative activities can reduce carry-over
  const restorativeHours = dayLog
    .filter(entry => entry.drainLevel === 'restorative')
    .reduce((sum, entry) => sum + entry.hoursSpent, 0)
  
  // Each restorative hour reduces carry-over by 0.25
  carryOver = Math.max(0, carryOver - (restorativeHours * 0.25))

  return Math.round(carryOver * 4) / 4 // Round to nearest 0.25
}

// ============================================
// REST RECOVERY
// ============================================

/**
 * Calculates fatigue debt recovery for ending the day early (rest bonus).
 * If the player used fewer than REST_RECOVERY_THRESHOLD hours, they get recovery.
 * Recovery scales smoothly: fewer hours used = more debt cleared.
 */
export function calculateRestRecovery(hoursUsed: number): number {
  if (hoursUsed <= TIME_BUDGET_CONFIG.REST_RECOVERY_THRESHOLD) {
    // More rest = more recovery, scaled from 0 to REST_RECOVERY_AMOUNT
    const restRatio = 1 - (hoursUsed / TIME_BUDGET_CONFIG.REST_RECOVERY_THRESHOLD)
    return Math.round(TIME_BUDGET_CONFIG.REST_RECOVERY_AMOUNT * restRatio * 4) / 4
  }
  return 0
}

/**
 * Calculates how much fatigue debt is directly recovered by restorative activities.
 * Restorative activities (spa, gym, rest day, walks) actively heal existing debt.
 */
export function calculateRestorativeDebtRecovery(dayLog: DayLogEntry[]): number {
  const restorativeHours = dayLog
    .filter(entry => entry.drainLevel === 'restorative')
    .reduce((sum, entry) => sum + entry.hoursSpent, 0)
  
  // Each restorative hour recovers 0.25h of existing fatigue debt
  const recovery = restorativeHours * TIME_BUDGET_CONFIG.RESTORATIVE_DEBT_RECOVERY_PER_HOUR
  return Math.round(recovery * 4) / 4
}

// ============================================
// DAY RESET
// ============================================

/**
 * Creates a fresh DayBudgetState for a new day, accounting for accumulated fatigue
 * debt and any jet lag penalty.
 */
export function resetDayBudget(
  previousFatigueDebt: number = 0,
  jetLagPenalty: number = 0,
  bonusHours: number = 0
): DayBudgetState {
  const totalHours = calculateDailyPool(previousFatigueDebt, jetLagPenalty, bonusHours)

  return {
    totalHours,
    hoursUsed: 0,
    hoursRemaining: totalHours,
    fatigueDebt: previousFatigueDebt,
    jetLagPenalty,
    activitiesCompletedToday: [],
    dayLog: [],
    currentHour: 7  // Day starts at 7 AM
  }
}

// ============================================
// MENTAL STATE IMPACT
// ============================================

/**
 * Calculates how the day's time usage should affect the existing mentalState.fatigue (0-100).
 * This connects the new time budget system to the existing race performance fatigue stat.
 * 
 * Green zone recovery is now graduated:
 *   0-3h used  → -8 (full rest day, strong recovery)
 *   3-6h used  → -5 (light day, good recovery)
 *   6-10h used → -2 (moderate day, slight recovery)
 * Yellow zone (10-13h) → +5 (busy day, slight fatigue increase)
 * Red zone (13+h) → +15 (exhausting day, heavy fatigue increase)
 */
export function calculateMentalFatigueImpact(hoursUsed: number): number {
  const zone = calculateFatigueZone(hoursUsed)
  switch (zone) {
    case 'green':
      // Graduated recovery within green zone
      if (hoursUsed <= 3) return -8    // Full rest day = strong recovery
      if (hoursUsed <= 6) return -5    // Light day = good recovery
      return -2                         // Moderate day = slight recovery
    case 'yellow': return 5            // Busy day = slight fatigue increase
    case 'red': return 15              // Exhausting day = heavy fatigue increase
  }
}

// ============================================
// SUMMARY HELPERS (for UI)
// ============================================

/**
 * Returns a summary of the day for the End Day modal.
 */
export function getDaySummary(dayBudget: DayBudgetState) {
  const zone = calculateFatigueZone(dayBudget.hoursUsed)
  const zoneInfo = getFatigueZoneInfo(zone)
  const carryOver = calculateFatigueCarryOver(dayBudget.dayLog)
  const restRecovery = calculateRestRecovery(dayBudget.hoursUsed)
  const restorativeRecovery = calculateRestorativeDebtRecovery(dayBudget.dayLog)
  const netFatigueChange = carryOver - restRecovery - restorativeRecovery
  const projectedFatigueDebt = Math.min(
    TIME_BUDGET_CONFIG.MAX_FATIGUE_DEBT,
    Math.max(0, dayBudget.fatigueDebt + netFatigueChange)
  )
  const tomorrowPool = calculateDailyPool(projectedFatigueDebt, 0)

  return {
    hoursUsed: dayBudget.hoursUsed,
    totalHours: dayBudget.totalHours,
    hoursRemaining: dayBudget.hoursRemaining,
    activitiesCompleted: dayBudget.dayLog.length,
    zone,
    zoneInfo,
    carryOver,
    restRecovery,
    restorativeRecovery,
    netFatigueChange,
    currentFatigueDebt: dayBudget.fatigueDebt,
    projectedFatigueDebt,
    tomorrowPool,
    dayLog: dayBudget.dayLog
  }
}

/**
 * Previews what will happen if the player performs an action with the given cost.
 */
export function previewAction(
  dayBudget: DayBudgetState,
  hours: number,
  _drainLevel: DrainLevel
): {
  canAfford: boolean
  hoursAfter: number
  zoneAfter: FatigueZone
  zoneBefore: FatigueZone
  zoneChanged: boolean
} {
  const zoneBefore = calculateFatigueZone(dayBudget.hoursUsed)
  const hoursAfter = Math.max(0, dayBudget.hoursRemaining - hours)
  const hoursUsedAfter = dayBudget.hoursUsed + hours
  const zoneAfter = calculateFatigueZone(hoursUsedAfter)

  return {
    canAfford: dayBudget.hoursRemaining >= hours,
    hoursAfter,
    zoneAfter,
    zoneBefore,
    zoneChanged: zoneBefore !== zoneAfter
  }
}
