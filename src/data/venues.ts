/**
 * Venues System
 * Locations where team activities can be held
 * Each venue has different costs, capacities, and effects on activity outcomes
 */

import { ActivityCategory } from '@/store/careerStore'
import { GuestAffinity, DEFAULT_VENUE_GUEST_AFFINITY, getTeamHQCapacity as _getTeamHQCapacity } from '@/data/guest-effects-config'

// Re-export for convenience
export { getTeamHQCapacity } from '@/data/guest-effects-config'

// Venue types that determine base characteristics
export type VenueType = 
  | 'team_hq'           // Team headquarters - free, always available
  | 'hotel_conference'  // Hotel meeting rooms
  | 'track_facility'    // Racing circuit facilities
  | 'restaurant'        // Premium restaurants for intimate events
  | 'stadium'           // Large arenas for major events
  | 'exhibition_center' // Convention centers for product launches
  | 'virtual'           // Online/virtual events

export interface Venue {
  id: string
  name: string
  type: VenueType
  country: string
  city: string
  
  // Capacity constraints
  capacity: {
    min: number
    max: number
  }
  
  // Costs
  baseCostPerDay: number  // Base rental cost per day
  
  // Prestige affects sponsor satisfaction and media coverage
  prestigeLevel: 1 | 2 | 3 | 4 | 5
  
  // What activities this venue supports
  supportedActivities: ActivityCategory[]
  
  // Outcome modifiers (percentage bonuses)
  modifiers: {
    mediaBoost: number       // % bonus to media coverage effectiveness
    sponsorBoost: number     // % bonus to sponsor satisfaction gains
    fanBoost: number         // % bonus to fan engagement
    teamMoraleBoost: number  // % bonus to team morale effects
  }
  
  // Requirements to use this venue
  requirements?: {
    minTeamReputation?: number       // Minimum reputation to book
    minWeeksAdvanceBooking?: number  // Must book X weeks ahead
    requiresLocalPresence?: boolean  // Must have team base in same country
  }
  
  // Special features
  features?: {
    hasMediaFacilities?: boolean     // Built-in press room
    hasCateringIncluded?: boolean    // Basic catering included in price
    hasAccommodation?: boolean       // On-site accommodation available
    hasTechnicalFacilities?: boolean // For development activities
    isExclusive?: boolean            // Only one team can book at a time
  }
  
  // Guest type affinity: 0-1 per type (0 = unavailable, 1 = ideal)
  // If not specified, uses DEFAULT_VENUE_GUEST_AFFINITY for this venue's type
  guestAffinity?: GuestAffinity
  
  // Description for UI
  description: string
}

// Team HQ - Always available, free venue option
// NOTE: capacity.max here is the base default. Actual capacity is dynamically
// determined by marketing facility level via getTeamHQCapacity().
export const TEAM_HQ_VENUE: Venue = {
  id: 'team_hq',
  name: 'Team Headquarters',
  type: 'team_hq',
  country: 'dynamic', // Uses team's baseCountry
  city: 'dynamic',
  capacity: { min: 1, max: 15 },  // Base capacity (Level 1). Scales with marketing facility.
  baseCostPerDay: 0,
  prestigeLevel: 2,
  supportedActivities: ['team', 'development', 'media', 'personal', 'maintenance', 'sponsor'],
  modifiers: {
    mediaBoost: 0,
    sponsorBoost: -10, // Sponsors prefer more prestigious venues
    fanBoost: -20,     // Less exciting for fans
    teamMoraleBoost: 10 // Home turf bonus
  },
  features: {
    hasTechnicalFacilities: true,
    hasCateringIncluded: false
  },
  description: 'Your team\'s home base. Free to use but less impressive for external events. Capacity grows with Marketing facility upgrades.'
}

// Virtual venue - Free but reduced engagement
export const VIRTUAL_VENUE: Venue = {
  id: 'virtual',
  name: 'Virtual Event',
  type: 'virtual',
  country: 'Online',
  city: 'Online',
  capacity: { min: 1, max: 10000 },
  baseCostPerDay: 500, // Platform/streaming costs
  prestigeLevel: 1,
  supportedActivities: ['media', 'team', 'sponsor'],
  modifiers: {
    mediaBoost: -20,    // Less impactful than in-person
    sponsorBoost: -30,  // Sponsors strongly prefer in-person
    fanBoost: 30,       // But reaches more fans globally
    teamMoraleBoost: -10
  },
  features: {
    hasMediaFacilities: true
  },
  description: 'Online event with global reach but reduced personal engagement.'
}

// Comprehensive venue database
export const VENUES: Venue[] = [
  TEAM_HQ_VENUE,
  VIRTUAL_VENUE,
  
  // === HOTEL CONFERENCE VENUES ===
  {
    id: 'hotel_budget_generic',
    name: 'Budget Business Hotel',
    type: 'hotel_conference',
    country: 'Various',
    city: 'Various',
    capacity: { min: 10, max: 50 },
    baseCostPerDay: 500,
    prestigeLevel: 1,
    supportedActivities: ['team', 'media', 'sponsor'],
    modifiers: {
      mediaBoost: -10,
      sponsorBoost: -15,
      fanBoost: -20,
      teamMoraleBoost: 0
    },
    description: 'Basic hotel conference room. Gets the job done.'
  },
  {
    id: 'hotel_business_generic',
    name: 'Business Hotel Conference Center',
    type: 'hotel_conference',
    country: 'Various',
    city: 'Various',
    capacity: { min: 20, max: 150 },
    baseCostPerDay: 1500,
    prestigeLevel: 2,
    supportedActivities: ['team', 'media', 'sponsor'],
    modifiers: {
      mediaBoost: 0,
      sponsorBoost: 0,
      fanBoost: -10,
      teamMoraleBoost: 5
    },
    features: {
      hasMediaFacilities: true
    },
    description: 'Professional conference facilities with AV equipment.'
  },
  {
    id: 'hotel_luxury_london',
    name: 'The Savoy - River Room',
    type: 'hotel_conference',
    country: 'UK',
    city: 'London',
    capacity: { min: 30, max: 350 },
    baseCostPerDay: 8000,
    prestigeLevel: 5,
    supportedActivities: ['sponsor', 'media', 'team'],
    modifiers: {
      mediaBoost: 25,
      sponsorBoost: 30,
      fanBoost: 10,
      teamMoraleBoost: 15
    },
    requirements: {
      minTeamReputation: 50,
      minWeeksAdvanceBooking: 4
    },
    features: {
      hasMediaFacilities: true,
      hasCateringIncluded: true,
      isExclusive: true
    },
    description: 'Iconic London luxury hotel. Perfect for high-profile sponsor events.'
  },
  {
    id: 'hotel_luxury_monaco',
    name: 'Hôtel de Paris Monte-Carlo',
    type: 'hotel_conference',
    country: 'Monaco',
    city: 'Monte Carlo',
    capacity: { min: 20, max: 150 },
    baseCostPerDay: 15000,
    prestigeLevel: 5,
    supportedActivities: ['sponsor', 'media'],
    modifiers: {
      mediaBoost: 35,
      sponsorBoost: 40,
      fanBoost: 20,
      teamMoraleBoost: 20
    },
    requirements: {
      minTeamReputation: 70,
      minWeeksAdvanceBooking: 6
    },
    features: {
      hasMediaFacilities: true,
      hasCateringIncluded: true,
      hasAccommodation: true,
      isExclusive: true
    },
    description: 'The ultimate in motorsport glamour. Maximum sponsor impact.'
  },
  {
    id: 'hotel_premium_germany',
    name: 'Grand Hyatt Berlin',
    type: 'hotel_conference',
    country: 'Germany',
    city: 'Berlin',
    capacity: { min: 50, max: 500 },
    baseCostPerDay: 5000,
    prestigeLevel: 4,
    supportedActivities: ['sponsor', 'media', 'team'],
    modifiers: {
      mediaBoost: 15,
      sponsorBoost: 20,
      fanBoost: 5,
      teamMoraleBoost: 10
    },
    requirements: {
      minTeamReputation: 30,
      minWeeksAdvanceBooking: 2
    },
    features: {
      hasMediaFacilities: true,
      hasCateringIncluded: true
    },
    description: 'Premium German venue with excellent business facilities.'
  },

  // === TRACK FACILITIES ===
  {
    id: 'track_silverstone',
    name: 'Silverstone Wing Conference Centre',
    type: 'track_facility',
    country: 'UK',
    city: 'Silverstone',
    capacity: { min: 50, max: 500 },
    baseCostPerDay: 6000,
    prestigeLevel: 4,
    supportedActivities: ['sponsor', 'media', 'development', 'team'],
    modifiers: {
      mediaBoost: 20,
      sponsorBoost: 25,
      fanBoost: 30,
      teamMoraleBoost: 20
    },
    requirements: {
      minTeamReputation: 25
    },
    features: {
      hasMediaFacilities: true,
      hasTechnicalFacilities: true
    },
    description: 'State-of-the-art facility at the home of British motorsport.'
  },
  {
    id: 'track_monza',
    name: 'Autodromo Nazionale Monza - Paddock Club',
    type: 'track_facility',
    country: 'Italy',
    city: 'Monza',
    capacity: { min: 30, max: 300 },
    baseCostPerDay: 7000,
    prestigeLevel: 5,
    supportedActivities: ['sponsor', 'media', 'development'],
    modifiers: {
      mediaBoost: 25,
      sponsorBoost: 30,
      fanBoost: 35,
      teamMoraleBoost: 25
    },
    requirements: {
      minTeamReputation: 40
    },
    features: {
      hasMediaFacilities: true,
      hasTechnicalFacilities: true
    },
    description: 'The Temple of Speed. Legendary venue for motorsport events.'
  },
  {
    id: 'track_spa',
    name: 'Circuit de Spa-Francorchamps - Media Center',
    type: 'track_facility',
    country: 'Belgium',
    city: 'Spa',
    capacity: { min: 40, max: 250 },
    baseCostPerDay: 5500,
    prestigeLevel: 4,
    supportedActivities: ['sponsor', 'media', 'development', 'team'],
    modifiers: {
      mediaBoost: 20,
      sponsorBoost: 20,
      fanBoost: 25,
      teamMoraleBoost: 20
    },
    requirements: {
      minTeamReputation: 30
    },
    features: {
      hasMediaFacilities: true,
      hasTechnicalFacilities: true
    },
    description: 'Beautiful Ardennes setting for professional motorsport events.'
  },
  {
    id: 'track_interlagos',
    name: 'Autódromo José Carlos Pace - VIP Lounge',
    type: 'track_facility',
    country: 'Brazil',
    city: 'São Paulo',
    capacity: { min: 30, max: 200 },
    baseCostPerDay: 4000,
    prestigeLevel: 3,
    supportedActivities: ['sponsor', 'media', 'team'],
    modifiers: {
      mediaBoost: 15,
      sponsorBoost: 15,
      fanBoost: 30,
      teamMoraleBoost: 15
    },
    features: {
      hasMediaFacilities: true
    },
    description: 'Passionate Brazilian motorsport atmosphere.'
  },
  {
    id: 'track_generic',
    name: 'Local Circuit Facilities',
    type: 'track_facility',
    country: 'Various',
    city: 'Various',
    capacity: { min: 20, max: 150 },
    baseCostPerDay: 2500,
    prestigeLevel: 2,
    supportedActivities: ['sponsor', 'media', 'development', 'team', 'maintenance'],
    modifiers: {
      mediaBoost: 5,
      sponsorBoost: 10,
      fanBoost: 15,
      teamMoraleBoost: 10
    },
    features: {
      hasTechnicalFacilities: true
    },
    description: 'Local racing circuit with basic facilities.'
  },

  // === RESTAURANTS ===
  {
    id: 'restaurant_upscale_generic',
    name: 'Upscale Restaurant - Private Dining',
    type: 'restaurant',
    country: 'Various',
    city: 'Various',
    capacity: { min: 8, max: 30 },
    baseCostPerDay: 2000,
    prestigeLevel: 3,
    supportedActivities: ['sponsor', 'team'],
    modifiers: {
      mediaBoost: -10, // Not suitable for media events
      sponsorBoost: 20,
      fanBoost: -30,
      teamMoraleBoost: 15
    },
    features: {
      hasCateringIncluded: true
    },
    description: 'Intimate private dining for important conversations.'
  },
  {
    id: 'restaurant_michelin_london',
    name: 'The Ledbury - Private Room',
    type: 'restaurant',
    country: 'UK',
    city: 'London',
    capacity: { min: 6, max: 20 },
    baseCostPerDay: 5000,
    prestigeLevel: 5,
    supportedActivities: ['sponsor', 'team'],
    modifiers: {
      mediaBoost: 5,
      sponsorBoost: 35,
      fanBoost: -20,
      teamMoraleBoost: 20
    },
    requirements: {
      minTeamReputation: 40,
      minWeeksAdvanceBooking: 3
    },
    features: {
      hasCateringIncluded: true,
      isExclusive: true
    },
    description: 'Two Michelin star dining. Impress your most important sponsors.'
  },
  {
    id: 'restaurant_michelin_paris',
    name: 'L\'Ambroisie - Salon Privé',
    type: 'restaurant',
    country: 'France',
    city: 'Paris',
    capacity: { min: 4, max: 16 },
    baseCostPerDay: 8000,
    prestigeLevel: 5,
    supportedActivities: ['sponsor'],
    modifiers: {
      mediaBoost: 10,
      sponsorBoost: 40,
      fanBoost: -10,
      teamMoraleBoost: 25
    },
    requirements: {
      minTeamReputation: 60,
      minWeeksAdvanceBooking: 4
    },
    features: {
      hasCateringIncluded: true,
      isExclusive: true
    },
    description: 'Three Michelin stars in Place des Vosges. Ultimate exclusivity.'
  },

  // === STADIUMS/ARENAS ===
  {
    id: 'stadium_o2_london',
    name: 'The O2 Arena',
    type: 'stadium',
    country: 'UK',
    city: 'London',
    capacity: { min: 500, max: 20000 },
    baseCostPerDay: 50000,
    prestigeLevel: 5,
    supportedActivities: ['media', 'sponsor'],
    modifiers: {
      mediaBoost: 50,
      sponsorBoost: 40,
      fanBoost: 60,
      teamMoraleBoost: 30
    },
    requirements: {
      minTeamReputation: 70,
      minWeeksAdvanceBooking: 12
    },
    features: {
      hasMediaFacilities: true,
      isExclusive: true
    },
    description: 'Major arena for massive fan events and product launches.'
  },
  {
    id: 'stadium_generic',
    name: 'Regional Sports Arena',
    type: 'stadium',
    country: 'Various',
    city: 'Various',
    capacity: { min: 200, max: 5000 },
    baseCostPerDay: 15000,
    prestigeLevel: 3,
    supportedActivities: ['media', 'sponsor'],
    modifiers: {
      mediaBoost: 25,
      sponsorBoost: 20,
      fanBoost: 40,
      teamMoraleBoost: 15
    },
    requirements: {
      minTeamReputation: 35,
      minWeeksAdvanceBooking: 4
    },
    features: {
      hasMediaFacilities: true
    },
    description: 'Medium-sized arena for regional fan events.'
  },

  // === EXHIBITION CENTERS ===
  {
    id: 'exhibition_excel_london',
    name: 'ExCeL London',
    type: 'exhibition_center',
    country: 'UK',
    city: 'London',
    capacity: { min: 100, max: 10000 },
    baseCostPerDay: 25000,
    prestigeLevel: 4,
    supportedActivities: ['sponsor', 'media', 'development'],
    modifiers: {
      mediaBoost: 30,
      sponsorBoost: 30,
      fanBoost: 35,
      teamMoraleBoost: 10
    },
    requirements: {
      minTeamReputation: 40,
      minWeeksAdvanceBooking: 8
    },
    features: {
      hasMediaFacilities: true,
      hasTechnicalFacilities: true
    },
    description: 'Premier exhibition space for product launches and car reveals.'
  },
  {
    id: 'exhibition_messe_frankfurt',
    name: 'Messe Frankfurt',
    type: 'exhibition_center',
    country: 'Germany',
    city: 'Frankfurt',
    capacity: { min: 100, max: 8000 },
    baseCostPerDay: 20000,
    prestigeLevel: 4,
    supportedActivities: ['sponsor', 'media', 'development'],
    modifiers: {
      mediaBoost: 25,
      sponsorBoost: 30,
      fanBoost: 25,
      teamMoraleBoost: 10
    },
    requirements: {
      minTeamReputation: 35,
      minWeeksAdvanceBooking: 6
    },
    features: {
      hasMediaFacilities: true,
      hasTechnicalFacilities: true
    },
    description: 'World-renowned German exhibition center near the automotive industry.'
  },
  {
    id: 'exhibition_generic',
    name: 'Convention Center',
    type: 'exhibition_center',
    country: 'Various',
    city: 'Various',
    capacity: { min: 50, max: 2000 },
    baseCostPerDay: 8000,
    prestigeLevel: 3,
    supportedActivities: ['sponsor', 'media', 'development'],
    modifiers: {
      mediaBoost: 15,
      sponsorBoost: 15,
      fanBoost: 20,
      teamMoraleBoost: 5
    },
    requirements: {
      minWeeksAdvanceBooking: 2
    },
    features: {
      hasMediaFacilities: true
    },
    description: 'Local convention center for mid-sized events.'
  }
]

// Helper functions

/**
 * Get venues that support a specific activity category
 */
export function getVenuesForActivity(category: ActivityCategory): Venue[] {
  return VENUES.filter(v => v.supportedActivities.includes(category))
}

/**
 * Get venues available to a team based on reputation
 */
export function getAvailableVenues(teamReputation: number, category?: ActivityCategory): Venue[] {
  let venues = VENUES
  
  if (category) {
    venues = venues.filter(v => v.supportedActivities.includes(category))
  }
  
  return venues.filter(v => {
    if (v.requirements?.minTeamReputation && teamReputation < v.requirements.minTeamReputation) {
      return false
    }
    return true
  })
}

/**
 * Get venues filtered by venue type array
 * Used for activity-specific venue filtering
 */
export function getVenuesByTypes(types: string[], minReputation: number = 0): Venue[] {
  return VENUES.filter(v => 
    types.includes(v.type) &&
    (!v.requirements?.minTeamReputation || minReputation >= v.requirements.minTeamReputation)
  )
}

/**
 * Get venue by ID
 */
export function getVenueById(id: string): Venue | undefined {
  return VENUES.find(v => v.id === id)
}

/**
 * Calculate venue cost with modifiers
 */
export function calculateVenueCost(
  venue: Venue, 
  durationDays: number = 1,
  teamReputation: number = 50
): number {
  let cost = venue.baseCostPerDay * durationDays
  
  // High reputation teams get venue discounts (up to 20% at 100 rep)
  const reputationDiscount = Math.min(teamReputation / 500, 0.2)
  cost = cost * (1 - reputationDiscount)
  
  return Math.round(cost)
}

/**
 * Get prestige level description
 */
export function getPrestigeDescription(level: 1 | 2 | 3 | 4 | 5): string {
  const descriptions: Record<number, string> = {
    1: 'Basic',
    2: 'Standard',
    3: 'Premium',
    4: 'Luxury',
    5: 'Elite'
  }
  return descriptions[level]
}

/**
 * Get the effective capacity of a venue.
 * For team_hq, this scales with marketing facility level.
 * For all other venues, returns the static capacity.max.
 */
export function getEffectiveVenueCapacity(venue: Venue, marketingLevel?: number): number {
  if (venue.type === 'team_hq' && marketingLevel != null) {
    return _getTeamHQCapacity(marketingLevel)
  }
  return venue.capacity.max
}

/**
 * Get the guest affinity map for a venue.
 * Uses venue-specific override if present, otherwise falls back to venue-type defaults.
 */
export function getVenueGuestAffinity(venue: Venue): GuestAffinity {
  return venue.guestAffinity ?? DEFAULT_VENUE_GUEST_AFFINITY[venue.type]
}

/**
 * Get venues grouped by type
 */
export function getVenuesByType(): Record<VenueType, Venue[]> {
  const grouped: Record<VenueType, Venue[]> = {
    team_hq: [],
    hotel_conference: [],
    track_facility: [],
    restaurant: [],
    stadium: [],
    exhibition_center: [],
    virtual: []
  }
  
  for (const venue of VENUES) {
    grouped[venue.type].push(venue)
  }
  
  return grouped
}
