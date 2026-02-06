// ============================================
// TRAVEL & VACATIONS CONFIGURATION
// ============================================
// System for vacation planning, destinations, and time off.

// ============================================
// VACATION TYPES
// ============================================

export type VacationType = 
  | 'beach'
  | 'adventure'
  | 'cultural'
  | 'ski'
  | 'safari'
  | 'cruise'
  | 'staycation'
  | 'wellness'
  | 'romantic'
  | 'family'

export type LuxuryLevel = 
  | 'budget'
  | 'comfortable'
  | 'luxury'
  | 'ultra_luxury'

// ============================================
// VACATION INTERFACE
// ============================================

export interface Vacation {
  id: string
  destination: Destination
  
  // Timing
  startDate: { week: number; day: number; year: number }
  duration: number              // Days
  
  // Who's going
  companions: VacationCompanion[]
  isRomantic: boolean
  isFamilyTrip: boolean
  isSolo: boolean
  
  // Type
  vacationType: VacationType
  luxuryLevel: LuxuryLevel
  
  // Accommodation
  accommodationType: 'hotel' | 'resort' | 'villa' | 'yacht' | 'cabin' | 'airbnb'
  accommodationName?: string
  costPerNight: number
  
  // Activities
  activities: VacationActivity[]
  activitiesCompleted: VacationActivity[]
  
  // Status
  status: 'planning' | 'booked' | 'ongoing' | 'completed' | 'cancelled'
  
  // Costs
  totalCost: number
  flightCost: number
  accommodationCost: number
  activitiesCost: number
  
  // Privacy
  isPubliclyKnown: boolean
  paparazziRisk: number
  
  // Outcomes (filled after vacation)
  outcomes?: VacationOutcome
}

export interface VacationCompanion {
  id: string
  name: string
  relationship: 'partner' | 'child' | 'friend' | 'family' | 'staff'
  addedCost: number             // Per person additional costs
}

export interface VacationOutcome {
  stressReduction: number
  
  // Relationship effects
  partnerHappinessChange?: number
  childBondingChange?: Record<string, number>
  
  // Memories
  memorablesMoments: string[]
  photosForSocialMedia: number
  
  // Unexpected events
  unexpectedEvents: VacationEvent[]
  
  // Media
  wasPhotographed: boolean
  storiesPublished: string[]
  
  // Health
  healthBenefit: number
  gotSick: boolean
  
  // Overall rating
  overallSatisfaction: number   // 0-100
}

export interface VacationEvent {
  type: 'positive' | 'negative' | 'neutral'
  description: string
  impact: number
}

// ============================================
// DESTINATIONS
// ============================================

export interface Destination {
  id: string
  name: string
  country: string
  region: string
  type: DestinationType
  
  // Requirements
  visaRequired: boolean
  travelTime: number            // Hours from typical home base
  bestSeason: string[]          // 'spring', 'summer', 'fall', 'winter'
  
  // Experience
  luxuryOptions: boolean
  privacyRating: number         // 0-100, can you escape paparazzi?
  romanticRating: number        // 0-100
  familyFriendly: boolean
  adventureOptions: boolean
  
  // Social
  celebrityHotspot: boolean
  networkingPotential: number
  
  // Costs
  averageDailyCost: {
    budget: number
    comfortable: number
    luxury: number
    ultra_luxury: number
  }
  
  // Activities available
  availableActivities: string[]
  
  // Description
  description: string
  highlights: string[]
}

export type DestinationType = 
  | 'beach'
  | 'city'
  | 'mountain'
  | 'island'
  | 'safari'
  | 'cultural'
  | 'wellness'
  | 'ski'

// ============================================
// VACATION ACTIVITIES
// ============================================

export interface VacationActivity {
  id: string
  name: string
  type: 'relaxation' | 'adventure' | 'cultural' | 'romantic' | 'family' | 'social' | 'wellness'
  
  cost: number
  duration: number              // Hours
  
  // Effects
  stressReduction: number
  partnerHappiness?: number
  childBonding?: number
  
  // Special
  isOnceInLifetime: boolean
  photogenic: boolean           // Good for social media
  exclusivity: number           // 0-100, how special is it
  
  // Risks
  adventureRisk: number         // 0-100
  paparazziRisk: number
}

// ============================================
// DESTINATION CATALOG
// ============================================

export const DESTINATIONS: Destination[] = [
  // Beach/Island
  {
    id: 'maldives',
    name: 'Maldives',
    country: 'Maldives',
    region: 'Indian Ocean',
    type: 'island',
    visaRequired: false,
    travelTime: 12,
    bestSeason: ['winter', 'spring'],
    luxuryOptions: true,
    privacyRating: 95,
    romanticRating: 100,
    familyFriendly: true,
    adventureOptions: true,
    celebrityHotspot: true,
    networkingPotential: 60,
    averageDailyCost: { budget: 300, comfortable: 800, luxury: 3000, ultra_luxury: 15000 },
    availableActivities: ['snorkeling', 'diving', 'spa', 'sunset_cruise', 'private_dining'],
    description: 'Ultimate tropical paradise with overwater villas',
    highlights: ['Private island resorts', 'World-class diving', 'Complete privacy']
  },
  {
    id: 'bora_bora',
    name: 'Bora Bora',
    country: 'French Polynesia',
    region: 'South Pacific',
    type: 'island',
    visaRequired: false,
    travelTime: 20,
    bestSeason: ['summer', 'fall'],
    luxuryOptions: true,
    privacyRating: 90,
    romanticRating: 98,
    familyFriendly: true,
    adventureOptions: true,
    celebrityHotspot: true,
    networkingPotential: 40,
    averageDailyCost: { budget: 400, comfortable: 1000, luxury: 4000, ultra_luxury: 20000 },
    availableActivities: ['lagoon_tour', 'shark_feeding', 'spa', 'helicopter_tour'],
    description: 'Iconic overwater bungalows and turquoise lagoon',
    highlights: ['Mount Otemanu views', 'Coral gardens', 'Ultimate romance']
  },
  {
    id: 'caribbean_yacht',
    name: 'Caribbean Yacht Charter',
    country: 'Various',
    region: 'Caribbean',
    type: 'island',
    visaRequired: false,
    travelTime: 10,
    bestSeason: ['winter', 'spring'],
    luxuryOptions: true,
    privacyRating: 85,
    romanticRating: 85,
    familyFriendly: true,
    adventureOptions: true,
    celebrityHotspot: true,
    networkingPotential: 70,
    averageDailyCost: { budget: 500, comfortable: 2000, luxury: 10000, ultra_luxury: 50000 },
    availableActivities: ['island_hopping', 'diving', 'fishing', 'beach_parties'],
    description: 'Explore the Caribbean on your own yacht',
    highlights: ['Island hopping', 'Complete freedom', 'Incredible waters']
  },
  
  // City
  {
    id: 'monaco',
    name: 'Monaco',
    country: 'Monaco',
    region: 'Europe',
    type: 'city',
    visaRequired: false,
    travelTime: 2,
    bestSeason: ['spring', 'summer', 'fall'],
    luxuryOptions: true,
    privacyRating: 30,
    romanticRating: 75,
    familyFriendly: false,
    adventureOptions: false,
    celebrityHotspot: true,
    networkingPotential: 95,
    averageDailyCost: { budget: 400, comfortable: 1000, luxury: 3000, ultra_luxury: 15000 },
    availableActivities: ['casino', 'yacht_parties', 'fine_dining', 'f1_circuit_tour'],
    description: 'The playground of the rich and famous',
    highlights: ['Casino Monte Carlo', 'Grand Prix circuit', 'Superyacht harbor']
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    region: 'Asia',
    type: 'city',
    visaRequired: false,
    travelTime: 14,
    bestSeason: ['spring', 'fall'],
    luxuryOptions: true,
    privacyRating: 70,
    romanticRating: 70,
    familyFriendly: true,
    adventureOptions: true,
    celebrityHotspot: false,
    networkingPotential: 60,
    averageDailyCost: { budget: 150, comfortable: 400, luxury: 1500, ultra_luxury: 5000 },
    availableActivities: ['temple_visits', 'sushi_omakase', 'shopping', 'teamlab', 'onsen'],
    description: 'Blend of ancient tradition and futuristic innovation',
    highlights: ['Incredible food', 'Unique culture', 'Safe and clean']
  },
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'UAE',
    region: 'Middle East',
    type: 'city',
    visaRequired: false,
    travelTime: 7,
    bestSeason: ['winter', 'spring'],
    luxuryOptions: true,
    privacyRating: 60,
    romanticRating: 70,
    familyFriendly: true,
    adventureOptions: true,
    celebrityHotspot: true,
    networkingPotential: 80,
    averageDailyCost: { budget: 200, comfortable: 600, luxury: 2000, ultra_luxury: 10000 },
    availableActivities: ['desert_safari', 'burj_khalifa', 'shopping', 'yacht_party', 'f1'],
    description: 'Over-the-top luxury in the desert',
    highlights: ['Architectural wonders', 'Tax-free shopping', 'Year-round sun']
  },
  
  // Mountain/Adventure
  {
    id: 'swiss_alps',
    name: 'Swiss Alps',
    country: 'Switzerland',
    region: 'Europe',
    type: 'ski',
    visaRequired: false,
    travelTime: 2,
    bestSeason: ['winter'],
    luxuryOptions: true,
    privacyRating: 80,
    romanticRating: 90,
    familyFriendly: true,
    adventureOptions: true,
    celebrityHotspot: true,
    networkingPotential: 70,
    averageDailyCost: { budget: 300, comfortable: 800, luxury: 2500, ultra_luxury: 10000 },
    availableActivities: ['skiing', 'helicopter_skiing', 'spa', 'fondue_dinner', 'glacier_walk'],
    description: 'World-class skiing and Alpine luxury',
    highlights: ['Zermatt', 'St. Moritz', 'Incredible scenery']
  },
  {
    id: 'aspen',
    name: 'Aspen',
    country: 'USA',
    region: 'North America',
    type: 'ski',
    visaRequired: false,
    travelTime: 12,
    bestSeason: ['winter'],
    luxuryOptions: true,
    privacyRating: 50,
    romanticRating: 80,
    familyFriendly: true,
    adventureOptions: true,
    celebrityHotspot: true,
    networkingPotential: 75,
    averageDailyCost: { budget: 400, comfortable: 1000, luxury: 3000, ultra_luxury: 15000 },
    availableActivities: ['skiing', 'snowboarding', 'apres_ski', 'fine_dining', 'shopping'],
    description: 'America\'s most glamorous ski resort',
    highlights: ['Celebrity sightings', 'World-class slopes', 'Vibrant nightlife']
  },
  {
    id: 'patagonia',
    name: 'Patagonia',
    country: 'Argentina/Chile',
    region: 'South America',
    type: 'mountain',
    visaRequired: false,
    travelTime: 18,
    bestSeason: ['summer', 'fall'],
    luxuryOptions: true,
    privacyRating: 95,
    romanticRating: 85,
    familyFriendly: false,
    adventureOptions: true,
    celebrityHotspot: false,
    networkingPotential: 20,
    averageDailyCost: { budget: 150, comfortable: 400, luxury: 1500, ultra_luxury: 5000 },
    availableActivities: ['hiking', 'glacier_trekking', 'horseback_riding', 'wildlife'],
    description: 'Untamed wilderness at the end of the world',
    highlights: ['Torres del Paine', 'Glaciers', 'Complete isolation']
  },
  
  // Safari
  {
    id: 'kenya_safari',
    name: 'Kenya Safari',
    country: 'Kenya',
    region: 'Africa',
    type: 'safari',
    visaRequired: true,
    travelTime: 10,
    bestSeason: ['summer', 'winter'],
    luxuryOptions: true,
    privacyRating: 90,
    romanticRating: 80,
    familyFriendly: true,
    adventureOptions: true,
    celebrityHotspot: false,
    networkingPotential: 30,
    averageDailyCost: { budget: 200, comfortable: 600, luxury: 2000, ultra_luxury: 8000 },
    availableActivities: ['game_drives', 'balloon_safari', 'masai_village', 'bush_dinner'],
    description: 'See the Big Five in their natural habitat',
    highlights: ['Masai Mara', 'Great Migration', 'Luxury tented camps']
  },
  
  // Wellness
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    region: 'Asia',
    type: 'wellness',
    visaRequired: false,
    travelTime: 16,
    bestSeason: ['spring', 'fall'],
    luxuryOptions: true,
    privacyRating: 75,
    romanticRating: 90,
    familyFriendly: true,
    adventureOptions: true,
    celebrityHotspot: true,
    networkingPotential: 40,
    averageDailyCost: { budget: 100, comfortable: 300, luxury: 1000, ultra_luxury: 5000 },
    availableActivities: ['yoga_retreat', 'spa', 'temple_visits', 'surfing', 'rice_terraces'],
    description: 'Spiritual island of gods and wellness',
    highlights: ['Ubud temples', 'World-class spas', 'Incredible value']
  }
]

// ============================================
// ACTIVITY CATALOG
// ============================================

export const VACATION_ACTIVITIES: Record<string, Omit<VacationActivity, 'id'>[]> = {
  beach: [
    { name: 'Private Beach Day', type: 'relaxation', cost: 500, duration: 8, stressReduction: 25, photogenic: true, exclusivity: 70, isOnceInLifetime: false, adventureRisk: 0, paparazziRisk: 20 },
    { name: 'Sunset Cruise', type: 'romantic', cost: 2000, duration: 3, stressReduction: 20, partnerHappiness: 15, photogenic: true, exclusivity: 60, isOnceInLifetime: false, adventureRisk: 5, paparazziRisk: 30 },
    { name: 'Scuba Diving', type: 'adventure', cost: 300, duration: 4, stressReduction: 15, photogenic: true, exclusivity: 40, isOnceInLifetime: false, adventureRisk: 30, paparazziRisk: 5 },
    { name: 'Private Island Picnic', type: 'romantic', cost: 5000, duration: 6, stressReduction: 30, partnerHappiness: 25, photogenic: true, exclusivity: 95, isOnceInLifetime: true, adventureRisk: 0, paparazziRisk: 5 }
  ],
  adventure: [
    { name: 'Helicopter Tour', type: 'adventure', cost: 3000, duration: 2, stressReduction: 20, photogenic: true, exclusivity: 70, isOnceInLifetime: false, adventureRisk: 20, paparazziRisk: 10 },
    { name: 'Bungee Jumping', type: 'adventure', cost: 200, duration: 1, stressReduction: 30, photogenic: true, exclusivity: 30, isOnceInLifetime: true, adventureRisk: 50, paparazziRisk: 15 },
    { name: 'Mountain Climbing', type: 'adventure', cost: 1000, duration: 8, stressReduction: 25, photogenic: true, exclusivity: 50, isOnceInLifetime: false, adventureRisk: 60, paparazziRisk: 5 }
  ],
  wellness: [
    { name: 'Spa Day', type: 'wellness', cost: 500, duration: 6, stressReduction: 40, photogenic: false, exclusivity: 40, isOnceInLifetime: false, adventureRisk: 0, paparazziRisk: 10 },
    { name: 'Yoga Retreat', type: 'wellness', cost: 300, duration: 4, stressReduction: 35, photogenic: false, exclusivity: 30, isOnceInLifetime: false, adventureRisk: 0, paparazziRisk: 5 },
    { name: 'Meditation Session', type: 'wellness', cost: 200, duration: 2, stressReduction: 25, photogenic: false, exclusivity: 20, isOnceInLifetime: false, adventureRisk: 0, paparazziRisk: 0 }
  ],
  cultural: [
    { name: 'Private Museum Tour', type: 'cultural', cost: 1000, duration: 3, stressReduction: 15, photogenic: true, exclusivity: 60, isOnceInLifetime: false, adventureRisk: 0, paparazziRisk: 20 },
    { name: 'Cooking Class', type: 'cultural', cost: 300, duration: 4, stressReduction: 20, photogenic: true, exclusivity: 30, isOnceInLifetime: false, adventureRisk: 0, paparazziRisk: 15 },
    { name: 'Historical Walking Tour', type: 'cultural', cost: 100, duration: 3, stressReduction: 10, photogenic: true, exclusivity: 20, isOnceInLifetime: false, adventureRisk: 0, paparazziRisk: 25 }
  ],
  family: [
    { name: 'Theme Park Day', type: 'family', cost: 500, duration: 10, stressReduction: 15, childBonding: 25, photogenic: true, exclusivity: 20, isOnceInLifetime: false, adventureRisk: 5, paparazziRisk: 40 },
    { name: 'Beach Building', type: 'family', cost: 0, duration: 3, stressReduction: 20, childBonding: 20, photogenic: true, exclusivity: 10, isOnceInLifetime: false, adventureRisk: 0, paparazziRisk: 30 },
    { name: 'Wildlife Sanctuary', type: 'family', cost: 200, duration: 4, stressReduction: 20, childBonding: 20, photogenic: true, exclusivity: 40, isOnceInLifetime: false, adventureRisk: 5, paparazziRisk: 20 }
  ]
}

// ============================================
// CONFIGURATION
// ============================================

export const TRAVEL_CONFIG = {
  // Stress relief
  baseStressReliefPerDay: 5,
  luxuryStressBonus: { budget: 0, comfortable: 5, luxury: 10, ultra_luxury: 20 },
  
  // Relationship
  partnerHappinessPerDay: 3,
  childBondingPerDay: 2,
  
  // Privacy
  paparazziBaseChance: 0.1,     // Per day
  celebrityHotspotMultiplier: 2,
  
  // Health
  healthBenefitPerWeek: 5,
  
  // Costs
  flightCostMultiplier: { budget: 0.5, comfortable: 1, luxury: 3, ultra_luxury: 10 },
  travelInsurance: 0.03,        // 3% of trip cost
  
  // Time
  minimumVacationDays: 3,
  optimalVacationDays: 14,
  maxBenefitDays: 21,           // Diminishing returns after this
  
  // Recovery
  stressReductionCap: 50,       // Max stress reduction per vacation
  
  // Work impact
  missedWeekPenalty: 0.05       // 5% performance penalty per week away
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

export function createVacation(
  destination: Destination,
  startDate: { week: number; day: number; year: number },
  duration: number,
  luxuryLevel: LuxuryLevel
): Vacation {
  const dailyCost = destination.averageDailyCost[luxuryLevel]
  
  return {
    id: `vacation_${Date.now()}`,
    destination,
    startDate,
    duration,
    companions: [],
    isRomantic: false,
    isFamilyTrip: false,
    isSolo: true,
    vacationType: destination.type as VacationType,
    luxuryLevel,
    accommodationType: luxuryLevel === 'ultra_luxury' ? 'villa' : 'hotel',
    costPerNight: dailyCost * 0.4, // Accommodation is ~40% of daily cost
    activities: [],
    activitiesCompleted: [],
    status: 'planning',
    totalCost: dailyCost * duration,
    flightCost: dailyCost * 2 * TRAVEL_CONFIG.flightCostMultiplier[luxuryLevel],
    accommodationCost: dailyCost * 0.4 * duration,
    activitiesCost: 0,
    isPubliclyKnown: false,
    paparazziRisk: 100 - destination.privacyRating
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function calculateVacationCost(vacation: Vacation): number {
  let total = vacation.flightCost + vacation.accommodationCost
  
  // Companion costs
  vacation.companions.forEach(c => {
    total += c.addedCost * vacation.duration
  })
  
  // Activities
  vacation.activities.forEach(a => {
    total += a.cost
  })
  
  // Insurance
  total *= (1 + TRAVEL_CONFIG.travelInsurance)
  
  return Math.round(total)
}

export function calculateStressRelief(vacation: Vacation): number {
  let relief = TRAVEL_CONFIG.baseStressReliefPerDay * vacation.duration
  
  // Luxury bonus
  relief += TRAVEL_CONFIG.luxuryStressBonus[vacation.luxuryLevel]
  
  // Privacy bonus
  relief += vacation.destination.privacyRating * 0.1
  
  // Activities
  vacation.activitiesCompleted.forEach(a => {
    relief += a.stressReduction
  })
  
  // Cap
  return Math.min(relief, TRAVEL_CONFIG.stressReductionCap)
}

export function getDestinationById(id: string): Destination | undefined {
  return DESTINATIONS.find(d => d.id === id)
}

export function getDestinationsByType(type: DestinationType): Destination[] {
  return DESTINATIONS.filter(d => d.type === type)
}

export function getRecommendedDestinations(
  budget: number,
  vacationType: VacationType,
  needsPrivacy: boolean,
  isRomantic: boolean
): Destination[] {
  return DESTINATIONS.filter(d => {
    // Budget check (comfortable level)
    if (d.averageDailyCost.comfortable * 7 > budget) return false
    
    // Type match (loose)
    if (vacationType && d.type !== vacationType) return false
    
    // Privacy
    if (needsPrivacy && d.privacyRating < 70) return false
    
    // Romance
    if (isRomantic && d.romanticRating < 70) return false
    
    return true
  }).sort((a, b) => b.romanticRating - a.romanticRating)
}
