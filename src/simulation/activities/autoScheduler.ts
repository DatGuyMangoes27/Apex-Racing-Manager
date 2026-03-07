/**
 * Auto-Scheduler Engine
 * 
 * Takes schedule suggestions (from the suggestion engine) and bin-packs them
 * into the week while respecting effective daily hour limits (including travel
 * overhead, role transitions, and race-day penalties), fatigue zones, race-day
 * exclusions, and activity-type spreading.
 * 
 * Used by:
 *  - PA weekly planning email "Auto-Schedule" button
 *  - Future: one-click "Let PA plan my week" feature
 */

import type { CareerState, ScheduledActivity, ActivityCategory } from '@/store/careerStore'
import type { ScheduleSuggestion } from './suggestionEngine'
import { generateScheduleSuggestions } from './suggestionEngine'
import { getWeek1Length } from '@/utils/calendar'
import { 
  calculateDayEffectiveHours, 
  wouldExceedDayLimit, 
  MAX_HOURS_PER_DAY,
  type EffectiveHoursBreakdown 
} from './schedulingOverhead'

// ============================================
// TYPES
// ============================================

/** Lightweight activity representation for overhead calculation */
interface ActivityStub {
  duration: number
  category: ActivityCategory
  configuration?: undefined
  requiresDriver?: boolean
  requiresOwner?: boolean
}

interface DayBucket {
  day: number
  activities: Array<ScheduledActivity | ActivityStub>  // Track actual activities for effective hours
  maxEffectiveHours: number
  categories: Set<string>
  isRaceDay: boolean
}

interface AutoScheduleResult {
  scheduled: ScheduleSuggestion[]
  skipped: ScheduleSuggestion[]
  reason: Record<string, string>  // skipped suggestion id → reason
}

// ============================================
// CONSTANTS
// ============================================

const RESERVED_FREE_HOURS = 3   // Leave at least 3h free per day for player initiative
const EFFECTIVE_PLANNING_MAX = MAX_HOURS_PER_DAY - RESERVED_FREE_HOURS  // 13h planning ceiling
const MAX_SAME_CATEGORY_PER_DAY = 2  // Don't stack more than 2 of same category type in one day

// ============================================
// SUGGESTION → ACTIVITY CATEGORY MAPPING
// ============================================

/** Map suggestion category to a plausible ActivityCategory for location group derivation */
function suggestionToActivityCategory(suggestionCategory: ScheduleSuggestion['category']): ActivityCategory {
  switch (suggestionCategory) {
    case 'mandatory':    return 'team'       // Most mandatory activities are at team HQ
    case 'recommended':  return 'team'       // Recommended activities tend to be team-related
    case 'personal':     return 'personal'   // Personal activities are at home
    default:             return 'team'
  }
}

// ============================================
// AUTO-SCHEDULE ALGORITHM
// ============================================

/**
 * Generate schedule suggestions and bin-pack them into the week.
 * Convenience wrapper for PA email "Auto-Schedule" and "Let PA plan my week" flows.
 */
export function generateAutoSchedule(
  careerState: CareerState,
  player: Record<string, unknown> | null
): AutoScheduleResult {
  const suggestions = generateScheduleSuggestions(careerState, player)
  return applyAutoScheduleLogic(suggestions, careerState)
}

/**
 * Core bin-packing algorithm for schedule suggestions.
 */
export function applyAutoScheduleLogic(
  suggestions: ScheduleSuggestion[],
  careerState: CareerState
): AutoScheduleResult {
  // Build day buckets with existing time usage
  const buckets: DayBucket[] = []
  const existingActivities = (careerState.scheduledActivities || []).filter(
    (a: ScheduledActivity) => a.scheduledWeek === careerState.currentWeek && a.status === 'scheduled'
  )

  // Detect race days (any day with a 'race' category activity)
  const raceDays = new Set<number>()
  for (const act of existingActivities) {
    if (act.category === 'race') {
      raceDays.add(act.scheduledDay)
      // Race weekends often span multiple days
      if (act.spanDays && act.spanDays > 1) {
        for (let d = act.scheduledDay; d < act.scheduledDay + act.spanDays; d++) {
          raceDays.add(d)
        }
      }
    }
  }

  // Week 1 is a partial week — only create buckets for days that actually exist
  const currentYear = careerState.currentYear ?? new Date().getFullYear()
  const week1Length = getWeek1Length(currentYear)
  const jan1DayOfWeek = 8 - week1Length
  const weekStartDay = careerState.currentWeek === 1 ? jan1DayOfWeek : 1

  for (let d = weekStartDay; d <= 7; d++) {
    const dayActivities = existingActivities.filter((a: ScheduledActivity) => {
      if (a.spanDays && a.spanDays > 1) {
        return d >= a.scheduledDay && d < a.scheduledDay + a.spanDays
      }
      return a.scheduledDay === d
    })
    
    const categories = new Set(dayActivities.map((a: ScheduledActivity) => a.category))
    
    buckets.push({
      day: d,
      activities: [...dayActivities],
      maxEffectiveHours: EFFECTIVE_PLANNING_MAX,
      categories,
      isRaceDay: raceDays.has(d),
    })
  }

  // Sort suggestions by priority (highest first)
  const sorted = [...suggestions].sort((a, b) => b.priority - a.priority)
  
  const scheduled: ScheduleSuggestion[] = []
  const skipped: ScheduleSuggestion[] = []
  const reason: Record<string, string> = {}

  for (const suggestion of sorted) {
    const placed = tryPlaceSuggestion(suggestion, buckets)
    if (placed) {
      scheduled.push({ ...suggestion, suggestedDay: placed.day })
    } else {
      skipped.push(suggestion)
      reason[suggestion.templateId] = 'No available time slot this week'
    }
  }

  return { scheduled, skipped, reason }
}

/**
 * Try to find a bucket (day) for a suggestion.
 * Prefers the suggested day, then tries alternatives.
 */
function tryPlaceSuggestion(
  suggestion: ScheduleSuggestion,
  buckets: DayBucket[]
): DayBucket | null {
  const { suggestedDay, category } = suggestion
  
  // Determine the category type for spreading check
  const catType = category === 'personal' ? 'personal' 
    : category === 'mandatory' ? 'mandatory'
    : 'team'

  // Build an activity stub for effective hours check
  const activityStub = createActivityStub(suggestion)

  // Try suggested day first (find by day number, not array index, since Week 1 may be partial)
  const preferredBucket = buckets.find(b => b.day === suggestedDay)
  if (preferredBucket && canFit(preferredBucket, activityStub, catType)) {
    placeSuggestion(preferredBucket, activityStub, catType)
    return preferredBucket
  }

  // Try other weekdays first (Mon-Fri), then weekends
  const dayOrder = category === 'personal'
    ? [6, 7, 5, 4, 3, 2, 1]  // Personal: prefer weekends
    : [1, 2, 3, 4, 5, 6, 7]  // Business: prefer weekdays
  
  for (const d of dayOrder) {
    if (d === suggestedDay) continue // Already tried
    const bucket = buckets.find(b => b.day === d)
    if (bucket && canFit(bucket, activityStub, catType)) {
      placeSuggestion(bucket, activityStub, catType)
      return bucket
    }
  }

  return null
}

/**
 * Create a lightweight activity stub from a suggestion for effective hours calculation.
 */
function createActivityStub(suggestion: ScheduleSuggestion): ActivityStub {
  const activityCategory = suggestionToActivityCategory(suggestion.category)
  return {
    duration: suggestion.hours,
    category: activityCategory,
    configuration: undefined,
    requiresDriver: suggestion.category !== 'personal',  // Personal activities don't require driver
    requiresOwner: suggestion.category === 'mandatory',  // Mandatory activities tend to require owner
  }
}

function canFit(bucket: DayBucket, newActivity: ActivityStub, catType: string): boolean {
  // Don't schedule on race days
  if (bucket.isRaceDay) return false
  
  // Check effective hours (travel overhead, role transitions, etc.)
  const projected = wouldExceedDayLimit(bucket.activities, newActivity, bucket.isRaceDay)
  if (projected.effectiveHours > bucket.maxEffectiveHours) return false
  
  // Check category spreading (count how many of same type already)
  const existingCount = Array.from(bucket.categories).filter(c => c === catType).length
  if (existingCount >= MAX_SAME_CATEGORY_PER_DAY) return false
  
  return true
}

function placeSuggestion(bucket: DayBucket, activity: ActivityStub, catType: string): void {
  bucket.activities.push(activity)
  bucket.categories.add(catType)
}

/**
 * Apply auto-schedule results to the career store.
 * Called from the email action handler when user clicks "Auto-Schedule".
 * 
 * Returns the number of activities successfully scheduled.
 */
export function applyAutoScheduleToStore(
  suggestions: ScheduleSuggestion[],
  currentWeek: number,
  scheduleActivity: (templateId: string, week: number, day: number) => ScheduledActivity | null
): number {
  let count = 0
  for (const s of suggestions) {
    const result = scheduleActivity(s.templateId, currentWeek, s.suggestedDay)
    if (result) {
      count++
    }
  }
  return count
}
