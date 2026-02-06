// ============================================
// TIME BUDGET HOOK
// ============================================
// Reusable hook that all action screens can use to:
// 1. Check if the player can afford an action
// 2. Consume hours when an action is performed
// 3. Preview what an action will cost
// 4. Show time cost UI inline

import { useCallback, useMemo } from 'react'
import { useCareerStore, type DrainLevel } from '@/store/careerStore'
import { 
  canPerformAction, 
  previewAction, 
  calculateFatigueZone,
  getFatigueZoneInfo,
  type FatigueZone
} from '@/simulation/timeBudget'
import { 
  getActivityTimeCost, 
  requiresOwnerTime,
  type ActivityTimeCost 
} from '@/data/activity-time-costs'

export interface UseTimeBudgetResult {
  /** Current hours remaining today */
  hoursRemaining: number
  /** Total hours available today */
  totalHours: number
  /** Hours already used today */
  hoursUsed: number
  /** Current fatigue zone */
  zone: FatigueZone
  /** Current fatigue zone display info */
  zoneInfo: ReturnType<typeof getFatigueZoneInfo>
  /** Current fatigue debt */
  fatigueDebt: number
  /** Number of activities completed today */
  activitiesToday: number
  
  /** Check if we can afford a specific action by ID */
  canAfford: (activityId: string) => boolean
  /** Check if we can afford a custom hour cost */
  canAffordHours: (hours: number) => boolean
  /** Get the time cost config for an activity by ID */
  getCost: (activityId: string) => ActivityTimeCost
  /** Check if an activity requires owner time */
  isOwnerTime: (activityId: string) => boolean
  
  /** Preview what would happen if we perform an action */
  preview: (activityId: string) => ReturnType<typeof previewAction>
  /** Preview with custom hours/drain */
  previewCustom: (hours: number, drain: DrainLevel) => ReturnType<typeof previewAction>
  
  /** Consume hours for performing an action (returns true if successful) */
  consumeTime: (activityId: string, activityName: string) => boolean
  /** Consume custom hours */
  consumeCustomTime: (hours: number, drain: DrainLevel, name: string, id?: string) => boolean
  
  /** Whether the time budget system is active */
  isActive: boolean
}

/**
 * Hook for interacting with the daily time budget system.
 * Use in any screen that has player actions costing time.
 */
export function useTimeBudget(): UseTimeBudgetResult {
  const { careerState, consumeHoursFromBudget } = useCareerStore()
  
  const dayBudget = careerState?.dayBudget
  const isActive = !!dayBudget
  
  const hoursRemaining = dayBudget?.hoursRemaining ?? 16
  const totalHours = dayBudget?.totalHours ?? 16
  const hoursUsed = dayBudget?.hoursUsed ?? 0
  const fatigueDebt = dayBudget?.fatigueDebt ?? 0
  const activitiesToday = dayBudget?.dayLog.length ?? 0
  
  const zone = useMemo(() => calculateFatigueZone(hoursUsed), [hoursUsed])
  const zoneInfo = useMemo(() => getFatigueZoneInfo(zone), [zone])
  
  const canAfford = useCallback((activityId: string): boolean => {
    const cost = getActivityTimeCost(activityId)
    if (!requiresOwnerTime(activityId)) return true // Team/passive activities always allowed
    return canPerformAction(hoursRemaining, cost.hours)
  }, [hoursRemaining])
  
  const canAffordHours = useCallback((hours: number): boolean => {
    return canPerformAction(hoursRemaining, hours)
  }, [hoursRemaining])
  
  const getCost = useCallback((activityId: string): ActivityTimeCost => {
    return getActivityTimeCost(activityId)
  }, [])
  
  const isOwnerTime = useCallback((activityId: string): boolean => {
    return requiresOwnerTime(activityId)
  }, [])
  
  const preview = useCallback((activityId: string) => {
    if (!dayBudget) return { canAfford: true, hoursAfter: 16, zoneAfter: 'green' as FatigueZone, zoneBefore: 'green' as FatigueZone, zoneChanged: false }
    const cost = getActivityTimeCost(activityId)
    return previewAction(dayBudget, cost.hours, cost.drain)
  }, [dayBudget])
  
  const previewCustom = useCallback((hours: number, drain: DrainLevel) => {
    if (!dayBudget) return { canAfford: true, hoursAfter: 16, zoneAfter: 'green' as FatigueZone, zoneBefore: 'green' as FatigueZone, zoneChanged: false }
    return previewAction(dayBudget, hours, drain)
  }, [dayBudget])
  
  const consumeTime = useCallback((activityId: string, activityName: string): boolean => {
    const cost = getActivityTimeCost(activityId)
    if (!requiresOwnerTime(activityId)) return true // No cost for passive
    if (!canPerformAction(hoursRemaining, cost.hours)) return false
    consumeHoursFromBudget(cost.hours, cost.drain, activityName, activityId)
    return true
  }, [hoursRemaining, consumeHoursFromBudget])
  
  const consumeCustomTime = useCallback((hours: number, drain: DrainLevel, name: string, id?: string): boolean => {
    if (!canPerformAction(hoursRemaining, hours)) return false
    consumeHoursFromBudget(hours, drain, name, id)
    return true
  }, [hoursRemaining, consumeHoursFromBudget])
  
  return {
    hoursRemaining,
    totalHours,
    hoursUsed,
    zone,
    zoneInfo,
    fatigueDebt,
    activitiesToday,
    canAfford,
    canAffordHours,
    getCost,
    isOwnerTime,
    preview,
    previewCustom,
    consumeTime,
    consumeCustomTime,
    isActive
  }
}

/**
 * Utility: wraps an action handler with time budget checking.
 * If the player can't afford the action, the handler is not called.
 * If they can, hours are consumed and then the handler is called.
 * 
 * Usage:
 *   const gatedHandler = useTimeGatedAction('press_conference', 'Press Conference', handlePressCo)
 *   <Button onClick={gatedHandler} disabled={!canAfford('press_conference')}>
 */
export function useTimeGatedAction(
  activityId: string,
  activityName: string,
  handler: () => void
): () => void {
  const { consumeTime, canAfford } = useTimeBudget()
  
  return useCallback(() => {
    if (!canAfford(activityId)) {
      console.warn(`[TimeBudget] Cannot afford action: ${activityName} (${activityId})`)
      return
    }
    const consumed = consumeTime(activityId, activityName)
    if (consumed) {
      handler()
    }
  }, [activityId, activityName, handler, canAfford, consumeTime])
}
