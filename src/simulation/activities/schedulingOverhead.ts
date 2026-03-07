/**
 * Scheduling Overhead System
 * 
 * Calculates realistic "effective hours" for a day by accounting for:
 *  - Per-activity travel/prep overhead (grouped by location)
 *  - Role transition penalty (driver ↔ owner switch)
 *  - Race-day driver overhead (track prep, qualifying, debrief)
 * 
 * Used by:
 *  - scheduleActivity() validation in careerStore
 *  - checkScheduleConflict() in careerStore
 *  - Auto-scheduler bin-packing (autoScheduler.ts)
 *  - Calendar UI conflict indicators (DayDetailPanel, CalendarDayCell)
 */

import type { ActivityCategory, ScheduledActivity } from '@/store/careerStore'
import { VENUES } from '@/data/venues'
import type { VenueType } from '@/data/venues'

// ============================================
// LOCATION GROUPS
// ============================================

export type LocationGroup = 'home' | 'team_hq' | 'track' | 'external' | 'virtual'

/** Map activity category → default location group */
const CATEGORY_LOCATION_MAP: Record<ActivityCategory, LocationGroup> = {
  personal:    'home',
  lifestyle:   'home',
  team:        'team_hq',
  maintenance: 'team_hq',
  development: 'track',
  race:        'track',
  sponsor:     'external',
  media:       'external',
}

/** Map venue type → location group (used when activity has a configured venue) */
const VENUE_TYPE_LOCATION_MAP: Record<VenueType, LocationGroup> = {
  team_hq:          'team_hq',
  track_facility:   'track',
  hotel_conference:  'external',
  restaurant:       'external',
  stadium:          'external',
  exhibition_center: 'external',
  virtual:          'virtual',
}

// ============================================
// CONSTANTS
// ============================================

/** Travel + prep overhead charged once per unique location group visited in a day */
export const TRAVEL_OVERHEAD_PER_LOCATION = 0.5  // 30 minutes

/** Virtual activities have zero travel overhead */
export const VIRTUAL_OVERHEAD = 0

/** Penalty when a day mixes driver-required and owner-only activities (charged once) */
export const ROLE_TRANSITION_PENALTY = 1  // 1 hour

/** Extra overhead on race days for the driver (track prep, qualifying, debrief) */
export const RACE_DAY_DRIVER_OVERHEAD = 4  // 4 hours

/** Hard cap on hours in a day */
export const MAX_HOURS_PER_DAY = 16

// ============================================
// LOCATION GROUP RESOLUTION
// ============================================

/**
 * Determine the location group for an activity.
 * Uses the configured venue if one is set, otherwise falls back to category default.
 */
export function getLocationGroup(activity: Pick<ScheduledActivity, 'category' | 'configuration'>): LocationGroup {
  // If a specific venue is configured, use the venue type
  if (activity.configuration?.venueId) {
    const venue = VENUES.find(v => v.id === activity.configuration!.venueId)
    if (venue) {
      return VENUE_TYPE_LOCATION_MAP[venue.type] ?? CATEGORY_LOCATION_MAP[activity.category]
    }
  }
  return CATEGORY_LOCATION_MAP[activity.category] ?? 'external'
}

/**
 * Get location group from just a category (for templates / auto-scheduler 
 * where no venue is configured yet).
 */
export function getLocationGroupFromCategory(category: ActivityCategory): LocationGroup {
  return CATEGORY_LOCATION_MAP[category] ?? 'external'
}

// ============================================
// EFFECTIVE HOURS CALCULATION
// ============================================

export interface EffectiveHoursBreakdown {
  /** Raw sum of activity durations */
  totalDuration: number
  /** 0.5h per unique non-virtual location group */
  travelOverhead: number
  /** 1h if the day has both driver and owner-only activities */
  roleTransitionPenalty: number
  /** 4h if race day with driver activities */
  raceDayOverhead: number
  /** Sum of all the above */
  effectiveHours: number
  /** max(0, effectiveHours - MAX_HOURS_PER_DAY) */
  overflowHours: number
  /** Whether the day is overloaded */
  hasConflict: boolean
  /** Which location groups are in play */
  locationGroups: LocationGroup[]
  /** Number of activities considered */
  activityCount: number
  /** Whether a role transition exists (driver + owner mix) */
  hasRoleTransition: boolean
  /** Whether this is a race day with driver activities */
  hasRaceDayOverhead: boolean
}

/**
 * Calculate effective hours for a set of activities on a single day.
 * 
 * @param activities - All scheduled activities on this day
 * @param isRaceDay - Whether this day is part of a race weekend
 * @returns Full breakdown of effective hours and conflict status
 */
export function calculateDayEffectiveHours(
  activities: Array<Pick<ScheduledActivity, 'duration' | 'category' | 'configuration' | 'requiresDriver' | 'requiresOwner'>>,
  isRaceDay: boolean = false
): EffectiveHoursBreakdown {
  if (activities.length === 0) {
    return {
      totalDuration: 0,
      travelOverhead: 0,
      roleTransitionPenalty: 0,
      raceDayOverhead: 0,
      effectiveHours: 0,
      overflowHours: 0,
      hasConflict: false,
      locationGroups: [],
      activityCount: 0,
      hasRoleTransition: false,
      hasRaceDayOverhead: false,
    }
  }

  // 1. Raw duration sum
  const totalDuration = activities.reduce((sum, a) => sum + (a.duration || 2), 0)

  // 2. Unique location groups → travel overhead
  const locationGroupSet = new Set<LocationGroup>()
  for (const a of activities) {
    locationGroupSet.add(getLocationGroup(a))
  }
  const locationGroups = Array.from(locationGroupSet)
  
  // Virtual activities don't incur travel overhead; remove 'virtual' from the set for counting
  const nonVirtualLocations = locationGroups.filter(g => g !== 'virtual')
  const travelOverhead = nonVirtualLocations.length * TRAVEL_OVERHEAD_PER_LOCATION

  // 3. Role transition penalty
  const hasDriverActivities = activities.some(a => a.requiresDriver)
  const hasOwnerOnlyActivities = activities.some(a => a.requiresOwner && !a.requiresDriver)
  const hasRoleTransition = hasDriverActivities && hasOwnerOnlyActivities
  const roleTransitionPenalty = hasRoleTransition ? ROLE_TRANSITION_PENALTY : 0

  // 4. Race day driver overhead
  const hasRaceDayOverhead = isRaceDay && hasDriverActivities
  const raceDayOverhead = hasRaceDayOverhead ? RACE_DAY_DRIVER_OVERHEAD : 0

  // 5. Total effective hours
  const effectiveHours = totalDuration + travelOverhead + roleTransitionPenalty + raceDayOverhead
  const overflowHours = Math.max(0, effectiveHours - MAX_HOURS_PER_DAY)
  const hasConflict = effectiveHours > MAX_HOURS_PER_DAY

  return {
    totalDuration,
    travelOverhead,
    roleTransitionPenalty,
    raceDayOverhead,
    effectiveHours,
    overflowHours,
    hasConflict,
    locationGroups,
    activityCount: activities.length,
    hasRoleTransition,
    hasRaceDayOverhead,
  }
}

/**
 * Check what the effective hours WOULD be if a hypothetical activity were added
 * to an existing set of activities on a day.
 * 
 * Used by scheduleActivity() and auto-scheduler to validate before committing.
 */
export function wouldExceedDayLimit(
  existingActivities: Array<Pick<ScheduledActivity, 'duration' | 'category' | 'configuration' | 'requiresDriver' | 'requiresOwner'>>,
  newActivity: Pick<ScheduledActivity, 'duration' | 'category' | 'configuration' | 'requiresDriver' | 'requiresOwner'>,
  isRaceDay: boolean = false
): EffectiveHoursBreakdown {
  return calculateDayEffectiveHours([...existingActivities, newActivity], isRaceDay)
}
