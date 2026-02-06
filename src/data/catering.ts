/**
 * Catering Options System
 * Food and beverage packages for team activities
 * Affects costs, guest satisfaction, and event prestige
 */

// Catering tier determines base quality and impression
export type CateringTier = 'basic' | 'business' | 'premium' | 'luxury' | 'gala'

export interface CateringOption {
  id: string
  name: string
  tier: CateringTier
  description: string
  
  // Costs
  costPerPerson: number
  minimumOrder?: number  // Minimum number of people
  setupFee?: number      // One-time setup cost
  
  // Quality affects outcomes
  qualityRating: 1 | 2 | 3 | 4 | 5
  
  // Effect modifiers (percentage bonuses)
  modifiers: {
    guestSatisfaction: number  // How happy guests are
    sponsorImpression: number  // Sponsor perception
    mediaImpression: number    // Media/PR value
    teamMorale: number         // Team appreciation
  }
  
  // What's included
  includes: {
    drinks: 'water_only' | 'soft_drinks' | 'full_bar' | 'premium_bar' | 'champagne'
    food: 'snacks' | 'light_bites' | 'buffet' | 'seated_meal' | 'multi_course'
    service: 'self_service' | 'basic_staff' | 'full_service' | 'butler_service'
    dietary: boolean  // Dietary options available
    branding: boolean // Can add team/sponsor branding
  }
  
  // Suitability for different event types
  suitableFor: ('team' | 'sponsor' | 'media' | 'fan' | 'vip')[]
}

// Comprehensive catering options
export const CATERING_OPTIONS: CateringOption[] = [
  // === BASIC TIER ===
  {
    id: 'water_only',
    name: 'Water & Coffee Station',
    tier: 'basic',
    description: 'Self-service water, coffee, and tea. Minimal but functional.',
    costPerPerson: 5,
    qualityRating: 1,
    modifiers: {
      guestSatisfaction: -20,
      sponsorImpression: -30,
      mediaImpression: -20,
      teamMorale: -10
    },
    includes: {
      drinks: 'water_only',
      food: 'snacks',
      service: 'self_service',
      dietary: false,
      branding: false
    },
    suitableFor: ['team']
  },
  {
    id: 'basic_refreshments',
    name: 'Basic Refreshments',
    tier: 'basic',
    description: 'Coffee, tea, soft drinks with pastries and light snacks.',
    costPerPerson: 15,
    qualityRating: 2,
    modifiers: {
      guestSatisfaction: -10,
      sponsorImpression: -15,
      mediaImpression: -10,
      teamMorale: 0
    },
    includes: {
      drinks: 'soft_drinks',
      food: 'snacks',
      service: 'self_service',
      dietary: false,
      branding: false
    },
    suitableFor: ['team', 'media']
  },

  // === BUSINESS TIER ===
  {
    id: 'business_lunch',
    name: 'Business Lunch Package',
    tier: 'business',
    description: 'Professional lunch buffet with variety of options.',
    costPerPerson: 35,
    minimumOrder: 10,
    qualityRating: 3,
    modifiers: {
      guestSatisfaction: 0,
      sponsorImpression: 0,
      mediaImpression: 0,
      teamMorale: 5
    },
    includes: {
      drinks: 'soft_drinks',
      food: 'buffet',
      service: 'basic_staff',
      dietary: true,
      branding: false
    },
    suitableFor: ['team', 'media', 'sponsor']
  },
  {
    id: 'business_reception',
    name: 'Business Reception',
    tier: 'business',
    description: 'Standing reception with canapés and beverages.',
    costPerPerson: 45,
    minimumOrder: 20,
    setupFee: 200,
    qualityRating: 3,
    modifiers: {
      guestSatisfaction: 5,
      sponsorImpression: 5,
      mediaImpression: 5,
      teamMorale: 5
    },
    includes: {
      drinks: 'full_bar',
      food: 'light_bites',
      service: 'basic_staff',
      dietary: true,
      branding: true
    },
    suitableFor: ['team', 'media', 'sponsor', 'fan']
  },
  {
    id: 'working_lunch',
    name: 'Working Lunch',
    tier: 'business',
    description: 'Efficient lunch service designed for working meetings.',
    costPerPerson: 30,
    qualityRating: 3,
    modifiers: {
      guestSatisfaction: 0,
      sponsorImpression: 0,
      mediaImpression: -5,
      teamMorale: 5
    },
    includes: {
      drinks: 'soft_drinks',
      food: 'buffet',
      service: 'basic_staff',
      dietary: true,
      branding: false
    },
    suitableFor: ['team', 'sponsor']
  },

  // === PREMIUM TIER ===
  {
    id: 'premium_buffet',
    name: 'Premium Buffet',
    tier: 'premium',
    description: 'High-quality buffet with premium ingredients and presentation.',
    costPerPerson: 75,
    minimumOrder: 15,
    setupFee: 500,
    qualityRating: 4,
    modifiers: {
      guestSatisfaction: 15,
      sponsorImpression: 15,
      mediaImpression: 10,
      teamMorale: 15
    },
    includes: {
      drinks: 'full_bar',
      food: 'buffet',
      service: 'full_service',
      dietary: true,
      branding: true
    },
    suitableFor: ['team', 'media', 'sponsor', 'fan']
  },
  {
    id: 'seated_dinner',
    name: 'Seated Three-Course Dinner',
    tier: 'premium',
    description: 'Formal seated dinner with three courses and table service.',
    costPerPerson: 120,
    minimumOrder: 20,
    setupFee: 1000,
    qualityRating: 4,
    modifiers: {
      guestSatisfaction: 25,
      sponsorImpression: 25,
      mediaImpression: 15,
      teamMorale: 20
    },
    includes: {
      drinks: 'full_bar',
      food: 'seated_meal',
      service: 'full_service',
      dietary: true,
      branding: true
    },
    suitableFor: ['sponsor', 'vip', 'team']
  },
  {
    id: 'cocktail_reception',
    name: 'Cocktail Reception',
    tier: 'premium',
    description: 'Elegant cocktail party with premium drinks and gourmet canapés.',
    costPerPerson: 85,
    minimumOrder: 30,
    setupFee: 750,
    qualityRating: 4,
    modifiers: {
      guestSatisfaction: 20,
      sponsorImpression: 20,
      mediaImpression: 20,
      teamMorale: 15
    },
    includes: {
      drinks: 'premium_bar',
      food: 'light_bites',
      service: 'full_service',
      dietary: true,
      branding: true
    },
    suitableFor: ['sponsor', 'media', 'vip', 'fan']
  },

  // === LUXURY TIER ===
  {
    id: 'fine_dining',
    name: 'Fine Dining Experience',
    tier: 'luxury',
    description: 'Multi-course fine dining with sommelier and personalized service.',
    costPerPerson: 200,
    minimumOrder: 10,
    setupFee: 2000,
    qualityRating: 5,
    modifiers: {
      guestSatisfaction: 35,
      sponsorImpression: 40,
      mediaImpression: 25,
      teamMorale: 30
    },
    includes: {
      drinks: 'premium_bar',
      food: 'multi_course',
      service: 'butler_service',
      dietary: true,
      branding: true
    },
    suitableFor: ['sponsor', 'vip']
  },
  {
    id: 'luxury_reception',
    name: 'Luxury VIP Reception',
    tier: 'luxury',
    description: 'Exclusive reception with champagne, oysters, and butler service.',
    costPerPerson: 175,
    minimumOrder: 20,
    setupFee: 1500,
    qualityRating: 5,
    modifiers: {
      guestSatisfaction: 30,
      sponsorImpression: 35,
      mediaImpression: 30,
      teamMorale: 25
    },
    includes: {
      drinks: 'champagne',
      food: 'light_bites',
      service: 'butler_service',
      dietary: true,
      branding: true
    },
    suitableFor: ['sponsor', 'vip', 'media']
  },

  // === GALA TIER ===
  {
    id: 'gala_dinner',
    name: 'Gala Dinner',
    tier: 'gala',
    description: 'Black-tie gala with five-course tasting menu and premium entertainment.',
    costPerPerson: 350,
    minimumOrder: 50,
    setupFee: 5000,
    qualityRating: 5,
    modifiers: {
      guestSatisfaction: 45,
      sponsorImpression: 50,
      mediaImpression: 40,
      teamMorale: 40
    },
    includes: {
      drinks: 'champagne',
      food: 'multi_course',
      service: 'butler_service',
      dietary: true,
      branding: true
    },
    suitableFor: ['sponsor', 'vip', 'media']
  },
  {
    id: 'championship_celebration',
    name: 'Championship Celebration',
    tier: 'gala',
    description: 'Ultimate celebration package with flowing champagne and live entertainment.',
    costPerPerson: 500,
    minimumOrder: 100,
    setupFee: 10000,
    qualityRating: 5,
    modifiers: {
      guestSatisfaction: 50,
      sponsorImpression: 50,
      mediaImpression: 50,
      teamMorale: 50
    },
    includes: {
      drinks: 'champagne',
      food: 'multi_course',
      service: 'butler_service',
      dietary: true,
      branding: true
    },
    suitableFor: ['sponsor', 'vip', 'media', 'fan', 'team']
  }
]

// === HELPER FUNCTIONS ===

/**
 * Get catering options by tier
 */
export function getCateringByTier(tier: CateringTier): CateringOption[] {
  return CATERING_OPTIONS.filter(c => c.tier === tier)
}

/**
 * Get catering options suitable for an event type
 */
export function getCateringForEventType(eventType: 'team' | 'sponsor' | 'media' | 'fan' | 'vip'): CateringOption[] {
  return CATERING_OPTIONS.filter(c => c.suitableFor.includes(eventType))
}

/**
 * Get catering by ID
 */
export function getCateringById(id: string): CateringOption | undefined {
  return CATERING_OPTIONS.find(c => c.id === id)
}

/**
 * Calculate total catering cost for an event
 */
export function calculateCateringCost(
  option: CateringOption,
  guestCount: number
): { total: number; perPerson: number; setupFee: number; breakdown: string } {
  const effectiveGuests = Math.max(guestCount, option.minimumOrder || 1)
  const perPersonTotal = option.costPerPerson * effectiveGuests
  const setupFee = option.setupFee || 0
  const total = perPersonTotal + setupFee
  
  let breakdown = `${effectiveGuests} guests × $${option.costPerPerson} = $${perPersonTotal}`
  if (setupFee > 0) {
    breakdown += ` + $${setupFee} setup = $${total}`
  }
  
  return {
    total,
    perPerson: option.costPerPerson,
    setupFee,
    breakdown
  }
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: CateringTier): string {
  const names: Record<CateringTier, string> = {
    basic: 'Basic',
    business: 'Business',
    premium: 'Premium',
    luxury: 'Luxury',
    gala: 'Gala'
  }
  return names[tier]
}

/**
 * Get recommended catering for budget
 */
export function getRecommendedCatering(
  budget: number,
  guestCount: number,
  eventType?: 'team' | 'sponsor' | 'media' | 'fan' | 'vip'
): CateringOption[] {
  let options = CATERING_OPTIONS
  
  if (eventType) {
    options = options.filter(c => c.suitableFor.includes(eventType))
  }
  
  return options
    .filter(c => {
      const cost = calculateCateringCost(c, guestCount).total
      return cost <= budget
    })
    .sort((a, b) => b.qualityRating - a.qualityRating) // Best quality first
}

/**
 * Get drink level description
 */
export function getDrinkDescription(level: CateringOption['includes']['drinks']): string {
  const descriptions: Record<CateringOption['includes']['drinks'], string> = {
    water_only: 'Water, coffee & tea',
    soft_drinks: 'Soft drinks & juices',
    full_bar: 'Full bar selection',
    premium_bar: 'Premium spirits & wines',
    champagne: 'Champagne & premium selection'
  }
  return descriptions[level]
}

/**
 * Get food level description
 */
export function getFoodDescription(level: CateringOption['includes']['food']): string {
  const descriptions: Record<CateringOption['includes']['food'], string> = {
    snacks: 'Light snacks',
    light_bites: 'Canapés & finger food',
    buffet: 'Full buffet selection',
    seated_meal: 'Seated three-course meal',
    multi_course: 'Multi-course tasting menu'
  }
  return descriptions[level]
}

/**
 * Get service level description
 */
export function getServiceDescription(level: CateringOption['includes']['service']): string {
  const descriptions: Record<CateringOption['includes']['service'], string> = {
    self_service: 'Self-service',
    basic_staff: 'Basic service staff',
    full_service: 'Full table service',
    butler_service: 'Butler service'
  }
  return descriptions[level]
}
