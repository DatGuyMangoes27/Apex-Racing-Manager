/**
 * Sponsor Database for AMS2 Career Mode
 * 
 * Realistic sponsors organized by category with multi-criteria requirements
 * and affiliation bonuses for nationality, manufacturer, and series matches.
 */

export type SponsorCategory = 
  | 'energy_drinks'
  | 'oil_fuel'
  | 'tires'
  | 'tech_gaming'
  | 'equipment'
  | 'watches'
  | 'lifestyle'
  | 'automotive'
  | 'financial'
  | 'local'
  | 'gaming'
  | 'apparel'
  | 'finance'
  | 'tech'
  | 'luxury'

export type SponsorTier = 'entry' | 'mid' | 'high' | 'elite'

// ============================================
// SPONSOR PERSONALITY & EXPECTATIONS
// ============================================

/**
 * What a sponsor cares about most - their primary motivation
 */
export type SponsorPriorityType = 
  | 'performance'      // Wins, podiums, championships
  | 'media'            // Social media, interviews, exposure
  | 'events'           // Galas, appearances, product launches
  | 'brand_alignment'  // Professional image, exclusivity
  | 'balanced'         // Cares about everything moderately

/**
 * Sponsor's focus and what they value
 */
export interface SponsorPriority {
  primary: SponsorPriorityType
  secondary?: SponsorPriorityType
  weight: 1 | 2 | 3 | 4 | 5  // How demanding they are (1=relaxed, 5=very demanding)
}

/**
 * What the sponsor expects during the contract - revealed during negotiation
 */
export interface SponsorExpectations {
  // Performance expectations
  minSeasonWins?: number
  minSeasonPodiums?: number  
  maxDNFs?: number
  championshipTarget?: 'win' | 'top3' | 'top5' | 'top10' | 'points'
  
  // Media expectations
  requiredShoutouts?: number           // Social media mentions per season
  requiredInterviews?: number          // Sponsor-arranged interviews per season
  minFollowers?: number                // Minimum social following
  noControversyClause?: boolean        // Professional image required
  viralPostBonus?: boolean             // Bonus for viral content
  
  // Event expectations
  requiredEvents?: number              // Sponsor events per season (meet & greet, etc.)
  productLaunches?: number             // Product launch appearances
  exclusiveAppearances?: number        // VIP/exclusive events
  
  // Brand alignment
  preferredImageStyle?: 'professional' | 'edgy' | 'family_friendly' | 'luxury' | 'technical'
  rivalExclusivity?: string[]          // Sponsor IDs they won't share team with
  exclusiveCategoryClause?: boolean    // Only sponsor in their category
}

export interface SponsorRequirements {
  minReputation: number
  minMarketability: number
  // Optional conditions
  seriesTiers?: string[]        // e.g., ['pro', 'elite'] 
  nationalities?: string[]      // e.g., ['Germany', 'Austria'] for German brands
  manufacturerIds?: string[]    // e.g., ['porsche', 'audi'] for VW Group sponsors
  minWins?: number
  minPodiums?: number
  minChampionships?: number
  minRaces?: number
}

export interface SponsorPayment {
  monthly: number
  winBonus: number
  podiumBonus: number
  championshipBonus?: number    // Bonus for winning championship
}

export interface Sponsor {
  id: string
  name: string
  category: SponsorCategory
  tier: SponsorTier
  description: string
  country: string  // Brand's home country
  
  // Payment tiers based on player's current series tier
  paymentTiers: {
    entry: SponsorPayment
    mid: SponsorPayment
    elite: SponsorPayment
  }
  
  requirements: SponsorRequirements
  
  // Sponsor personality - what they care about (optional, defaults based on category)
  priority?: SponsorPriority
  
  // What they expect during the contract (optional, generated if not specified)
  expectations?: SponsorExpectations
  
  // Affiliation bonuses (20% payment increase if matched)
  nationalityBonus?: string[]   // Driver nationalities that get bonus
  manufacturerBonus?: string[]   // Manufacturer IDs that get bonus
  seriesBonus?: string[]        // Series categories that get bonus (e.g., 'gt3', 'formula')

  // Pre-generated content (Content Studio)
  story?: string               // Backstory / "why they sponsor" (from Content Studio)
  imagePath?: string           // Relative path to logo e.g. 'logos/sponsors/{id}.png'

  // Visibility / unlock (who can see or seek this sponsor)
  visibility?: 'always' | 'unlock_after_reputation' | 'unlock_after_contact' | 'approach_only'
  unlockReputation?: number    // When visibility is unlock_after_reputation, show when team reputation >= this
}

// ============================================
// DEFAULT PRIORITIES BY CATEGORY
// ============================================

/**
 * Default sponsor priorities based on category
 * These are used when a sponsor doesn't have explicit priority set
 */
export const DEFAULT_CATEGORY_PRIORITIES: Record<SponsorCategory, SponsorPriority> = {
  energy_drinks: { primary: 'media', secondary: 'performance', weight: 4 },
  oil_fuel: { primary: 'performance', secondary: 'brand_alignment', weight: 3 },
  tires: { primary: 'performance', secondary: 'brand_alignment', weight: 3 },
  tech_gaming: { primary: 'media', secondary: 'events', weight: 4 },
  equipment: { primary: 'performance', secondary: 'brand_alignment', weight: 2 },
  watches: { primary: 'events', secondary: 'brand_alignment', weight: 5 },
  lifestyle: { primary: 'media', secondary: 'events', weight: 4 },
  automotive: { primary: 'balanced', secondary: 'performance', weight: 3 },
  financial: { primary: 'events', secondary: 'brand_alignment', weight: 4 },
  local: { primary: 'balanced', weight: 2 },
  gaming: { primary: 'media', secondary: 'events', weight: 4 },
  apparel: { primary: 'media', secondary: 'brand_alignment', weight: 3 },
  finance: { primary: 'events', secondary: 'brand_alignment', weight: 4 },
  tech: { primary: 'media', secondary: 'performance', weight: 4 },
  luxury: { primary: 'events', secondary: 'brand_alignment', weight: 5 }
}

/**
 * Get sponsor priority (uses explicit or falls back to category default)
 */
export function getSponsorPriority(sponsor: Sponsor): SponsorPriority {
  return sponsor.priority || DEFAULT_CATEGORY_PRIORITIES[sponsor.category]
}

/**
 * Generate default expectations based on sponsor tier and priority
 */
export function getDefaultExpectations(sponsor: Sponsor): SponsorExpectations {
  if (sponsor.expectations) return sponsor.expectations
  
  const priority = getSponsorPriority(sponsor)
  const tierMultiplier = sponsor.tier === 'elite' ? 2 : sponsor.tier === 'high' ? 1.5 : sponsor.tier === 'mid' ? 1 : 0.5
  
  const expectations: SponsorExpectations = {}
  
  // Performance expectations
  if (priority.primary === 'performance' || priority.secondary === 'performance') {
    if (sponsor.tier === 'elite') {
      expectations.minSeasonPodiums = 5
      expectations.championshipTarget = 'top3'
      expectations.maxDNFs = 3
    } else if (sponsor.tier === 'high') {
      expectations.minSeasonPodiums = 3
      expectations.championshipTarget = 'top5'
      expectations.maxDNFs = 4
    } else if (sponsor.tier === 'mid') {
      expectations.minSeasonPodiums = 1
      expectations.championshipTarget = 'top10'
    }
  }
  
  // Media expectations
  if (priority.primary === 'media' || priority.secondary === 'media') {
    expectations.requiredShoutouts = Math.round(4 * tierMultiplier)
    if (sponsor.tier === 'elite' || sponsor.tier === 'high') {
      expectations.requiredInterviews = Math.round(2 * tierMultiplier)
      expectations.viralPostBonus = true
    }
    if (sponsor.tier === 'elite') {
      expectations.noControversyClause = priority.primary === 'brand_alignment'
    }
  }
  
  // Event expectations
  if (priority.primary === 'events' || priority.secondary === 'events') {
    expectations.requiredEvents = Math.round(2 * tierMultiplier)
    if (sponsor.tier === 'elite' || sponsor.tier === 'high') {
      expectations.productLaunches = 1
      expectations.exclusiveAppearances = Math.round(1 * tierMultiplier)
    }
  }
  
  // Brand alignment
  if (priority.primary === 'brand_alignment' || sponsor.category === 'watches' || sponsor.category === 'financial') {
    expectations.noControversyClause = true
    expectations.preferredImageStyle = sponsor.category === 'watches' ? 'luxury' : 
                                       sponsor.category === 'financial' ? 'professional' :
                                       sponsor.category === 'energy_drinks' ? 'edgy' : 'professional'
  }
  
  // Elite sponsors often want category exclusivity
  if (sponsor.tier === 'elite') {
    expectations.exclusiveCategoryClause = true
  }
  
  return expectations
}

export const SPONSOR_CATEGORIES: Record<SponsorCategory, { name: string; icon: string; description: string }> = {
  energy_drinks: {
    name: 'Energy Drinks',
    icon: '⚡',
    description: 'High-energy brands seeking exciting motorsport partnerships'
  },
  oil_fuel: {
    name: 'Oil & Fuel',
    icon: '🛢️',
    description: 'Lubricant and fuel companies with motorsport heritage'
  },
  tires: {
    name: 'Tires',
    icon: '🏎️',
    description: 'Tire manufacturers invested in racing technology'
  },
  tech_gaming: {
    name: 'Tech & Gaming',
    icon: '🎮',
    description: 'Technology and sim racing equipment brands'
  },
  equipment: {
    name: 'Racing Equipment',
    icon: '🪖',
    description: 'Safety gear and racing equipment manufacturers'
  },
  watches: {
    name: 'Luxury Watches',
    icon: '⌚',
    description: 'Prestigious timepiece brands for elite drivers'
  },
  gaming: {
    name: 'Gaming',
    icon: '🎮',
    description: 'Video game and esports brands'
  },
  apparel: {
    name: 'Apparel',
    icon: '👕',
    description: 'Fashion and clothing brands'
  },
  finance: {
    name: 'Finance',
    icon: '💼',
    description: 'Financial services and banking'
  },
  tech: {
    name: 'Technology',
    icon: '💻',
    description: 'Technology companies and software'
  },
  luxury: {
    name: 'Luxury',
    icon: '💎',
    description: 'High-end luxury brands'
  },
  lifestyle: {
    name: 'Lifestyle & Fashion',
    icon: '👔',
    description: 'Fashion and lifestyle brands targeting motorsport fans'
  },
  automotive: {
    name: 'Automotive',
    icon: '🔧',
    description: 'Aftermarket parts and automotive service brands'
  },
  financial: {
    name: 'Financial Services',
    icon: '💳',
    description: 'Banks, insurance, and financial institutions'
  },
  local: {
    name: 'Local & Regional',
    icon: '📍',
    description: 'Regional businesses supporting local talent'
  }
}

// Sponsors are loaded from Content Studio sponsor-pool via preGeneratedContentService (getSponsors, getSponsorById).

// ============================================
// HELPER FUNCTIONS (type-only; sponsor list from preGeneratedContentService)
// ============================================

/**
 * Calculate payment with affiliation bonus
 */
export function calculatePaymentWithBonus(
  sponsor: Sponsor,
  payment: SponsorPayment,
  playerNationality?: string,
  manufacturerId?: string,
  seriesCategory?: string
): SponsorPayment {
  let bonusMultiplier = 1.0
  
  // Nationality bonus (20%)
  if (playerNationality && sponsor.nationalityBonus?.includes(playerNationality)) {
    bonusMultiplier += 0.2
  }
  
  // Manufacturer bonus (20%)
  if (manufacturerId && sponsor.manufacturerBonus?.includes(manufacturerId)) {
    bonusMultiplier += 0.2
  }
  
  // Series bonus (10%)
  if (seriesCategory && sponsor.seriesBonus?.includes(seriesCategory)) {
    bonusMultiplier += 0.1
  }
  
  return {
    monthly: Math.floor(payment.monthly * bonusMultiplier),
    winBonus: Math.floor(payment.winBonus * bonusMultiplier),
    podiumBonus: Math.floor(payment.podiumBonus * bonusMultiplier)
  }
}



