// ============================================
// TRAVEL TIME COSTS
// ============================================
// Maps real-world travel distances (from race/vacation destinations)
// to in-game time costs and jet lag penalties.

import type { DrainLevel, CalendarEntryType, ScheduledActivity } from '@/store/careerStore'

// ============================================
// TRAVEL TIERS
// ============================================

export interface TravelTier {
  label: string
  travelTimeRange: [number, number]   // Min/max real travel hours
  gameHoursCost: number               // How many in-game hours the travel day consumes
  drainLevel: DrainLevel
  jetLagDays: number                  // How many days jet lag penalty lasts
  jetLagHoursPerDay: number           // Hours deducted per jet lag day
  calendarType: CalendarEntryType
}

export const TRAVEL_TIERS: TravelTier[] = [
  {
    label: 'Short Haul',
    travelTimeRange: [0, 4],
    gameHoursCost: 5,
    drainLevel: 'normal',
    jetLagDays: 0,
    jetLagHoursPerDay: 0,
    calendarType: 'travel'
  },
  {
    label: 'Medium Haul',
    travelTimeRange: [4, 8],
    gameHoursCost: 9,
    drainLevel: 'high',
    jetLagDays: 1,
    jetLagHoursPerDay: 1,
    calendarType: 'travel'
  },
  {
    label: 'Long Haul',
    travelTimeRange: [8, 16],
    gameHoursCost: 14,
    drainLevel: 'high',
    jetLagDays: 2,
    jetLagHoursPerDay: 1.5,
    calendarType: 'travel'
  },
  {
    label: 'Ultra Long Haul',
    travelTimeRange: [16, 999],
    gameHoursCost: 16,  // Full day travel
    drainLevel: 'high',
    jetLagDays: 3,
    jetLagHoursPerDay: 2,
    calendarType: 'travel'
  }
]

// ============================================
// TRAVEL TIER RESOLUTION
// ============================================

/**
 * Determine which travel tier applies for a given real-world travel time (hours).
 */
export function getTravelTier(travelTimeHours: number): TravelTier {
  const tier = TRAVEL_TIERS.find(
    t => travelTimeHours >= t.travelTimeRange[0] && travelTimeHours < t.travelTimeRange[1]
  )
  return tier ?? TRAVEL_TIERS[TRAVEL_TIERS.length - 1]  // Default to ultra long
}

/**
 * Creates a travel calendar entry (ScheduledActivity) for a trip.
 */
export function createTravelActivity(
  fromLocation: string,
  toLocation: string,
  travelTimeHours: number,
  week: number,
  day: number,
  isReturn: boolean = false
): Partial<ScheduledActivity> {
  const tier = getTravelTier(travelTimeHours)
  
  return {
    id: `travel_${isReturn ? 'return' : 'outbound'}_${week}_${day}_${Date.now()}`,
    templateId: `travel_${tier.label.toLowerCase().replace(/\s+/g, '_')}`,
    name: isReturn 
      ? `Return Travel: ${toLocation} -> ${fromLocation}` 
      : `Travel: ${fromLocation} -> ${toLocation}`,
    description: `${tier.label} travel (${travelTimeHours}h real time). Consumes ${tier.gameHoursCost}h of your day.${
      tier.jetLagDays > 0 ? ` Expect ${tier.jetLagDays} day(s) of jet lag.` : ''
    }`,
    category: 'maintenance',
    scheduledWeek: week,
    scheduledDay: day,
    duration: tier.gameHoursCost,
    spanDays: 1,
    status: 'scheduled',
    mandatory: true,
    canReschedule: false,
    drainLevel: tier.drainLevel,
    calendarEntryType: 'travel',
    autoScheduled: true,
    
    // Tag for processing
    triggeredBy: 'travel',
    triggerData: {
      from: fromLocation,
      to: toLocation,
      realTravelHours: travelTimeHours,
      tier: tier.label,
      jetLagDays: tier.jetLagDays,
      jetLagHoursPerDay: tier.jetLagHoursPerDay,
      isReturn
    } as Record<string, unknown>
  }
}

/**
 * Calculate jet lag penalty for a given day after arrival.
 * Returns 0 if no jet lag, or the hours penalty for that day.
 */
export function getJetLagPenalty(
  travelTimeHours: number,
  daysAfterArrival: number
): number {
  const tier = getTravelTier(travelTimeHours)
  
  if (daysAfterArrival >= tier.jetLagDays) return 0
  
  // Jet lag tapers off: full penalty day 1, decreasing each day
  const taperFactor = 1 - (daysAfterArrival / tier.jetLagDays)
  return Math.round(tier.jetLagHoursPerDay * taperFactor * 4) / 4  // Round to 0.25
}

/**
 * Given a race calendar event with location info, generates travel entries.
 * Returns outbound (pre-race) and return (post-race) travel activities.
 */
export function generateRaceTravelEntries(
  homeBase: string,
  trackName: string,
  travelTimeHours: number,
  raceWeek: number
): Array<Partial<ScheduledActivity>> {
  const entries: Array<Partial<ScheduledActivity>> = []
  const tier = getTravelTier(travelTimeHours)
  
  // Outbound travel: 1-2 days before race (Friday) depending on distance
  const outboundDay = tier.gameHoursCost >= 14 ? 3 : 4  // Wednesday for ultra-long, Thursday for others
  entries.push(createTravelActivity(
    homeBase,
    trackName,
    travelTimeHours,
    raceWeek,
    outboundDay,
    false
  ))
  
  // Return travel: day after race (Monday of next week)
  entries.push(createTravelActivity(
    trackName,
    homeBase,
    travelTimeHours,
    raceWeek + 1,
    1,  // Monday
    true
  ))
  
  return entries
}
