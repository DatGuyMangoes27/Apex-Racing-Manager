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
  manufacturerBonus?: string[]  // Manufacturer IDs that get bonus
  seriesBonus?: string[]        // Series categories that get bonus (e.g., 'gt3', 'formula')
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

// ============================================
// SPONSOR DATABASE
// ============================================

export const SPONSORS: Sponsor[] = [
  // ============================================
  // ENERGY DRINKS - Realistic Values
  // Entry: $50k-$150k/year | Mid: $200k-$600k/year | Elite: $800k-$3M/year
  // ============================================
  {
    id: 'monster-energy',
    name: 'Monster Energy',
    category: 'energy_drinks',
    tier: 'high',
    description: 'Unleash the beast on track with Monster Energy backing',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 7500, winBonus: 4500, podiumBonus: 2200, championshipBonus: 25000 },
      mid: { monthly: 38000, winBonus: 18000, podiumBonus: 9000, championshipBonus: 100000 },
      elite: { monthly: 135000, winBonus: 55000, podiumBonus: 27500, championshipBonus: 400000 }
    },
    requirements: {
      minReputation: 35,
      minMarketability: 45,
      minWins: 1
    },
    priority: { primary: 'media', secondary: 'performance', weight: 4 },
    expectations: {
      minSeasonPodiums: 4,
      championshipTarget: 'top5',
      requiredShoutouts: 8,
      requiredInterviews: 2,
      viralPostBonus: true,
      requiredEvents: 2,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['USA', 'Mexico', 'Brazil'],
    seriesBonus: ['rallycross', 'nascar', 'stock']
  },
  {
    id: 'red-bull',
    name: 'Red Bull',
    category: 'energy_drinks',
    tier: 'elite',
    description: 'Red Bull gives you wings - the ultimate motorsport partner',
    country: 'Austria',
    paymentTiers: {
      entry: { monthly: 18000, winBonus: 10000, podiumBonus: 5000, championshipBonus: 75000 },
      mid: { monthly: 95000, winBonus: 50000, podiumBonus: 25000, championshipBonus: 350000 },
      elite: { monthly: 450000, winBonus: 175000, podiumBonus: 85000, championshipBonus: 1500000 }
    },
    requirements: {
      minReputation: 70,
      minMarketability: 70,
      minWins: 5,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'performance', secondary: 'media', weight: 5 },
    expectations: {
      minSeasonWins: 3,
      minSeasonPodiums: 8,
      championshipTarget: 'win',
      maxDNFs: 2,
      requiredShoutouts: 12,
      requiredInterviews: 4,
      viralPostBonus: true,
      requiredEvents: 4,
      productLaunches: 2,
      exclusiveAppearances: 3,
      preferredImageStyle: 'edgy',
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['Austria', 'Germany', 'Netherlands'],
    seriesBonus: ['formula', 'gt3']
  },
  {
    id: 'rockstar-energy',
    name: 'Rockstar Energy',
    category: 'energy_drinks',
    tier: 'mid',
    description: 'Party like a rockstar, race like a champion',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 4800, winBonus: 2800, podiumBonus: 1400, championshipBonus: 15000 },
      mid: { monthly: 24000, winBonus: 11000, podiumBonus: 5500, championshipBonus: 60000 },
      elite: { monthly: 68000, winBonus: 32000, podiumBonus: 16000, championshipBonus: 180000 }
    },
    requirements: {
      minReputation: 25,
      minMarketability: 35
    },
    priority: { primary: 'media', secondary: 'events', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 6,
      requiredInterviews: 1,
      viralPostBonus: true,
      requiredEvents: 2,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['USA', 'Canada'],
    seriesBonus: ['rallycross', 'touring']
  },
  {
    id: 'celsius',
    name: 'Celsius',
    category: 'energy_drinks',
    tier: 'mid',
    description: 'Live Fit - Essential energy for peak performance',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 3800, winBonus: 2200, podiumBonus: 1100, championshipBonus: 12000 },
      mid: { monthly: 19000, winBonus: 9000, podiumBonus: 4500, championshipBonus: 50000 },
      elite: { monthly: 52000, winBonus: 24000, podiumBonus: 12000, championshipBonus: 140000 }
    },
    requirements: {
      minReputation: 22,
      minMarketability: 30
    },
    priority: { primary: 'media', secondary: 'brand_alignment', weight: 3 },
    expectations: {
      minSeasonPodiums: 1,
      requiredShoutouts: 5,
      viralPostBonus: true,
      requiredEvents: 1,
      preferredImageStyle: 'professional',
      noControversyClause: false
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['indycar', 'nascar']
  },
  {
    id: 'prime-energy',
    name: 'PRIME',
    category: 'energy_drinks',
    tier: 'high',
    description: 'Hydration for champions - the viral sensation',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 5500, winBonus: 3500, podiumBonus: 1750, championshipBonus: 20000 },
      mid: { monthly: 32000, winBonus: 16000, podiumBonus: 8000, championshipBonus: 85000 },
      elite: { monthly: 115000, winBonus: 48000, podiumBonus: 24000, championshipBonus: 320000 }
    },
    requirements: {
      minReputation: 40,
      minMarketability: 55,
      minWins: 2
    },
    priority: { primary: 'media', secondary: 'events', weight: 5 },
    expectations: {
      minSeasonPodiums: 3,
      championshipTarget: 'top5',
      requiredShoutouts: 10,
      requiredInterviews: 3,
      minFollowers: 50000,
      viralPostBonus: true,
      requiredEvents: 3,
      productLaunches: 1,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['USA', 'UK'],
    seriesBonus: ['formula', 'mma']
  },
  {
    id: 'nos-energy',
    name: 'NOS Energy',
    category: 'energy_drinks',
    tier: 'mid',
    description: 'High performance energy for high performance athletes',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 4200, winBonus: 2500, podiumBonus: 1250, championshipBonus: 14000 },
      mid: { monthly: 21000, winBonus: 10000, podiumBonus: 5000, championshipBonus: 55000 },
      elite: { monthly: 58000, winBonus: 26000, podiumBonus: 13000, championshipBonus: 160000 }
    },
    requirements: {
      minReputation: 24,
      minMarketability: 32
    },
    priority: { primary: 'performance', secondary: 'media', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 4,
      viralPostBonus: true,
      requiredEvents: 1,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['nascar', 'drift']
  },
  {
    id: 'reign-energy',
    name: 'Reign Total Body Fuel',
    category: 'energy_drinks',
    tier: 'entry',
    description: 'Performance energy for serious athletes',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 2200, winBonus: 1200, podiumBonus: 600, championshipBonus: 8000 },
      mid: { monthly: 11000, winBonus: 5500, podiumBonus: 2750, championshipBonus: 30000 },
      elite: { monthly: 32000, winBonus: 14000, podiumBonus: 7000, championshipBonus: 85000 }
    },
    requirements: {
      minReputation: 15,
      minMarketability: 20
    },
    priority: { primary: 'media', weight: 2 },
    expectations: {
      requiredShoutouts: 3,
      viralPostBonus: true,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['USA']
  },
  {
    id: 'gfuel',
    name: 'G FUEL',
    category: 'energy_drinks',
    tier: 'entry',
    description: 'The official energy drink of esports and sim racing',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 1800, winBonus: 1000, podiumBonus: 500, championshipBonus: 6000 },
      mid: { monthly: 9000, winBonus: 4500, podiumBonus: 2250, championshipBonus: 25000 },
      elite: { monthly: 26000, winBonus: 11000, podiumBonus: 5500, championshipBonus: 70000 }
    },
    requirements: {
      minReputation: 12,
      minMarketability: 25
    },
    priority: { primary: 'media', secondary: 'events', weight: 3 },
    expectations: {
      requiredShoutouts: 4,
      minFollowers: 10000,
      viralPostBonus: true,
      requiredEvents: 1,
      preferredImageStyle: 'edgy'
    },
    seriesBonus: ['gt3', 'gt4']
  },

  // ============================================
  // OIL & FUEL - Realistic Values
  // Entry: $60k-$200k/year | Mid: $300k-$800k/year | Elite: $1.5M-$5M/year
  // ============================================
  {
    id: 'shell',
    name: 'Shell',
    category: 'oil_fuel',
    tier: 'elite',
    description: 'Shell V-Power racing fuel technology partnership',
    country: 'Netherlands',
    paymentTiers: {
      entry: { monthly: 14000, winBonus: 7000, podiumBonus: 3500, championshipBonus: 60000 },
      mid: { monthly: 72000, winBonus: 36000, podiumBonus: 18000, championshipBonus: 280000 },
      elite: { monthly: 380000, winBonus: 140000, podiumBonus: 70000, championshipBonus: 1200000 }
    },
    requirements: {
      minReputation: 55,
      minMarketability: 45,
      seriesTiers: ['semi-pro', 'pro', 'elite']
    },
    priority: { primary: 'performance', secondary: 'brand_alignment', weight: 4 },
    expectations: {
      minSeasonWins: 2,
      minSeasonPodiums: 6,
      championshipTarget: 'top3',
      maxDNFs: 3,
      requiredShoutouts: 4,
      requiredEvents: 2,
      productLaunches: 1,
      preferredImageStyle: 'technical',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    manufacturerBonus: ['ferrari', 'ducati'],
    seriesBonus: ['formula', 'gt3', 'hypercar']
  },
  {
    id: 'castrol',
    name: 'Castrol',
    category: 'oil_fuel',
    tier: 'high',
    description: 'Castrol EDGE - Strength to perform under pressure',
    country: 'UK',
    paymentTiers: {
      entry: { monthly: 6800, winBonus: 3800, podiumBonus: 1900, championshipBonus: 28000 },
      mid: { monthly: 36000, winBonus: 19000, podiumBonus: 9500, championshipBonus: 110000 },
      elite: { monthly: 108000, winBonus: 48000, podiumBonus: 24000, championshipBonus: 320000 }
    },
    requirements: {
      minReputation: 40,
      minMarketability: 35,
      minPodiums: 3
    },
    priority: { primary: 'performance', secondary: 'media', weight: 3 },
    expectations: {
      minSeasonPodiums: 4,
      championshipTarget: 'top5',
      maxDNFs: 4,
      requiredShoutouts: 3,
      requiredEvents: 1,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['UK', 'Australia'],
    seriesBonus: ['touring', 'gt3', 'v8supercars']
  },
  {
    id: 'mobil1',
    name: 'Mobil 1',
    category: 'oil_fuel',
    tier: 'high',
    description: 'Advanced synthetic motor oil for peak performance',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 6200, winBonus: 3400, podiumBonus: 1700, championshipBonus: 25000 },
      mid: { monthly: 33000, winBonus: 17000, podiumBonus: 8500, championshipBonus: 100000 },
      elite: { monthly: 98000, winBonus: 44000, podiumBonus: 22000, championshipBonus: 290000 }
    },
    requirements: {
      minReputation: 38,
      minMarketability: 32,
      minRaces: 10
    },
    priority: { primary: 'performance', secondary: 'brand_alignment', weight: 4 },
    expectations: {
      minSeasonPodiums: 3,
      championshipTarget: 'top5',
      maxDNFs: 5,
      requiredShoutouts: 2,
      requiredEvents: 1,
      preferredImageStyle: 'technical',
      noControversyClause: true
    },
    manufacturerBonus: ['porsche', 'mclaren'],
    seriesBonus: ['formula', 'gt3', 'nascar']
  },
  {
    id: 'petronas',
    name: 'Petronas',
    category: 'oil_fuel',
    tier: 'elite',
    description: 'Fluid technology solutions for champions',
    country: 'Malaysia',
    paymentTiers: {
      entry: { monthly: 12000, winBonus: 6000, podiumBonus: 3000, championshipBonus: 50000 },
      mid: { monthly: 65000, winBonus: 32000, podiumBonus: 16000, championshipBonus: 240000 },
      elite: { monthly: 320000, winBonus: 120000, podiumBonus: 60000, championshipBonus: 1000000 }
    },
    requirements: {
      minReputation: 60,
      minMarketability: 50,
      minWins: 3,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'performance', secondary: 'brand_alignment', weight: 5 },
    expectations: {
      minSeasonWins: 3,
      minSeasonPodiums: 8,
      championshipTarget: 'win',
      maxDNFs: 2,
      requiredShoutouts: 6,
      requiredInterviews: 2,
      requiredEvents: 3,
      productLaunches: 1,
      preferredImageStyle: 'technical',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    manufacturerBonus: ['mercedes'],
    seriesBonus: ['formula']
  },
  {
    id: 'gulf-oil',
    name: 'Gulf Oil',
    category: 'oil_fuel',
    tier: 'mid',
    description: 'Classic motorsport heritage meets modern performance',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 4800, winBonus: 2800, podiumBonus: 1400, championshipBonus: 18000 },
      mid: { monthly: 25000, winBonus: 13000, podiumBonus: 6500, championshipBonus: 72000 },
      elite: { monthly: 68000, winBonus: 30000, podiumBonus: 15000, championshipBonus: 195000 }
    },
    requirements: {
      minReputation: 28,
      minMarketability: 30
    },
    priority: { primary: 'brand_alignment', secondary: 'performance', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 2,
      requiredEvents: 2,
      preferredImageStyle: 'professional',
      noControversyClause: true
    },
    manufacturerBonus: ['porsche', 'ford', 'mclaren'],
    seriesBonus: ['gt3', 'lmp', 'hypercar']
  },
  {
    id: 'total-energies',
    name: 'TotalEnergies',
    category: 'oil_fuel',
    tier: 'elite',
    description: 'Multi-energy company powering motorsport excellence',
    country: 'France',
    paymentTiers: {
      entry: { monthly: 13000, winBonus: 6500, podiumBonus: 3250, championshipBonus: 55000 },
      mid: { monthly: 68000, winBonus: 34000, podiumBonus: 17000, championshipBonus: 260000 },
      elite: { monthly: 350000, winBonus: 130000, podiumBonus: 65000, championshipBonus: 1100000 }
    },
    requirements: {
      minReputation: 58,
      minMarketability: 48,
      minWins: 2,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'performance', secondary: 'events', weight: 4 },
    expectations: {
      minSeasonWins: 2,
      minSeasonPodiums: 5,
      championshipTarget: 'top3',
      maxDNFs: 3,
      requiredShoutouts: 4,
      requiredEvents: 2,
      productLaunches: 1,
      preferredImageStyle: 'technical',
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['France', 'Belgium'],
    seriesBonus: ['lmp', 'hypercar', 'rallycross']
  },
  {
    id: 'valvoline',
    name: 'Valvoline',
    category: 'oil_fuel',
    tier: 'mid',
    description: '150 years of motor oil innovation',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 4200, winBonus: 2400, podiumBonus: 1200, championshipBonus: 16000 },
      mid: { monthly: 22000, winBonus: 11500, podiumBonus: 5750, championshipBonus: 65000 },
      elite: { monthly: 60000, winBonus: 27000, podiumBonus: 13500, championshipBonus: 175000 }
    },
    requirements: {
      minReputation: 26,
      minMarketability: 28
    },
    priority: { primary: 'performance', secondary: 'media', weight: 2 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 3,
      requiredEvents: 1,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['USA', 'Australia'],
    seriesBonus: ['nascar', 'v8supercars', 'touring']
  },
  {
    id: 'pennzoil',
    name: 'Pennzoil',
    category: 'oil_fuel',
    tier: 'high',
    description: 'Proof not promises - synthetic oil technology',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 5800, winBonus: 3100, podiumBonus: 1550, championshipBonus: 22000 },
      mid: { monthly: 31000, winBonus: 16000, podiumBonus: 8000, championshipBonus: 95000 },
      elite: { monthly: 88000, winBonus: 40000, podiumBonus: 20000, championshipBonus: 260000 }
    },
    requirements: {
      minReputation: 36,
      minMarketability: 32,
      minRaces: 8
    },
    priority: { primary: 'performance', secondary: 'brand_alignment', weight: 3 },
    expectations: {
      minSeasonPodiums: 3,
      championshipTarget: 'top5',
      maxDNFs: 4,
      requiredShoutouts: 2,
      requiredEvents: 1,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['nascar', 'indycar']
  },
  {
    id: 'sunoco',
    name: 'Sunoco Racing Fuels',
    category: 'oil_fuel',
    tier: 'mid',
    description: 'Official fuel of championship racing',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 3800, winBonus: 2100, podiumBonus: 1050, championshipBonus: 14000 },
      mid: { monthly: 19500, winBonus: 9800, podiumBonus: 4900, championshipBonus: 58000 },
      elite: { monthly: 54000, winBonus: 25000, podiumBonus: 12500, championshipBonus: 160000 }
    },
    requirements: {
      minReputation: 24,
      minMarketability: 26
    },
    priority: { primary: 'performance', weight: 2 },
    expectations: {
      minSeasonPodiums: 1,
      requiredShoutouts: 2,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['nascar', 'indycar', 'imsa']
  },
  {
    id: 'vp-racing',
    name: 'VP Racing Fuels',
    category: 'oil_fuel',
    tier: 'entry',
    description: 'Mad scientist fuels for grassroots to pro racing',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 2300, winBonus: 1400, podiumBonus: 700, championshipBonus: 9000 },
      mid: { monthly: 11500, winBonus: 5800, podiumBonus: 2900, championshipBonus: 35000 },
      elite: { monthly: 34000, winBonus: 15000, podiumBonus: 7500, championshipBonus: 100000 }
    },
    requirements: {
      minReputation: 15,
      minMarketability: 18
    },
    priority: { primary: 'performance', weight: 2 },
    expectations: {
      minSeasonPodiums: 1,
      requiredShoutouts: 2,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['drag', 'drift', 'rallycross']
  },

  // ============================================
  // TIRES - Realistic Values
  // Entry: $50k-$150k/year | Mid: $250k-$700k/year | Elite: $1.2M-$4M/year
  // ============================================
  {
    id: 'pirelli',
    name: 'Pirelli',
    category: 'tires',
    tier: 'elite',
    description: 'Power is nothing without control',
    country: 'Italy',
    paymentTiers: {
      entry: { monthly: 11000, winBonus: 5500, podiumBonus: 2750, championshipBonus: 48000 },
      mid: { monthly: 55000, winBonus: 28000, podiumBonus: 14000, championshipBonus: 200000 },
      elite: { monthly: 280000, winBonus: 100000, podiumBonus: 50000, championshipBonus: 900000 }
    },
    requirements: {
      minReputation: 50,
      minMarketability: 45,
      seriesTiers: ['semi-pro', 'pro', 'elite']
    },
    priority: { primary: 'performance', secondary: 'brand_alignment', weight: 4 },
    expectations: {
      minSeasonWins: 2,
      minSeasonPodiums: 6,
      championshipTarget: 'top3',
      maxDNFs: 3,
      requiredShoutouts: 3,
      requiredEvents: 2,
      preferredImageStyle: 'technical',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['Italy'],
    seriesBonus: ['formula', 'gt3', 'gt4']
  },
  {
    id: 'michelin',
    name: 'Michelin',
    category: 'tires',
    tier: 'elite',
    description: 'A better way forward in motorsport technology',
    country: 'France',
    paymentTiers: {
      entry: { monthly: 10000, winBonus: 5000, podiumBonus: 2500, championshipBonus: 42000 },
      mid: { monthly: 50000, winBonus: 25000, podiumBonus: 12500, championshipBonus: 180000 },
      elite: { monthly: 250000, winBonus: 90000, podiumBonus: 45000, championshipBonus: 800000 }
    },
    requirements: {
      minReputation: 48,
      minMarketability: 42,
      minPodiums: 5
    },
    priority: { primary: 'performance', secondary: 'events', weight: 4 },
    expectations: {
      minSeasonWins: 1,
      minSeasonPodiums: 5,
      championshipTarget: 'top5',
      maxDNFs: 4,
      requiredShoutouts: 2,
      requiredEvents: 1,
      productLaunches: 1,
      preferredImageStyle: 'technical',
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['France'],
    seriesBonus: ['lmp', 'hypercar', 'rallycross']
  },
  {
    id: 'goodyear',
    name: 'Goodyear',
    category: 'tires',
    tier: 'high',
    description: 'More driven - winning heritage since 1898',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 6200, winBonus: 3200, podiumBonus: 1600, championshipBonus: 24000 },
      mid: { monthly: 30000, winBonus: 15000, podiumBonus: 7500, championshipBonus: 90000 },
      elite: { monthly: 85000, winBonus: 38000, podiumBonus: 19000, championshipBonus: 260000 }
    },
    requirements: {
      minReputation: 35,
      minMarketability: 30,
      minRaces: 15
    },
    priority: { primary: 'performance', secondary: 'brand_alignment', weight: 3 },
    expectations: {
      minSeasonPodiums: 3,
      championshipTarget: 'top5',
      maxDNFs: 5,
      requiredShoutouts: 2,
      requiredEvents: 1,
      preferredImageStyle: 'professional'
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['nascar', 'indycar', 'lmp']
  },
  {
    id: 'bridgestone',
    name: 'Bridgestone',
    category: 'tires',
    tier: 'elite',
    description: 'Solutions for your journey - premium tire technology',
    country: 'Japan',
    paymentTiers: {
      entry: { monthly: 10500, winBonus: 5200, podiumBonus: 2600, championshipBonus: 45000 },
      mid: { monthly: 52000, winBonus: 26000, podiumBonus: 13000, championshipBonus: 190000 },
      elite: { monthly: 260000, winBonus: 95000, podiumBonus: 47500, championshipBonus: 850000 }
    },
    requirements: {
      minReputation: 52,
      minMarketability: 46,
      minPodiums: 4,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'performance', secondary: 'brand_alignment', weight: 5 },
    expectations: {
      minSeasonWins: 2,
      minSeasonPodiums: 6,
      championshipTarget: 'top3',
      maxDNFs: 3,
      requiredShoutouts: 4,
      requiredInterviews: 1,
      requiredEvents: 2,
      preferredImageStyle: 'technical',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['Japan'],
    seriesBonus: ['super_gt', 'formula', 'indycar']
  },
  {
    id: 'continental',
    name: 'Continental',
    category: 'tires',
    tier: 'high',
    description: 'German engineering excellence in tire technology',
    country: 'Germany',
    paymentTiers: {
      entry: { monthly: 5600, winBonus: 2900, podiumBonus: 1450, championshipBonus: 21000 },
      mid: { monthly: 27000, winBonus: 13500, podiumBonus: 6750, championshipBonus: 82000 },
      elite: { monthly: 78000, winBonus: 34000, podiumBonus: 17000, championshipBonus: 235000 }
    },
    requirements: {
      minReputation: 34,
      minMarketability: 30,
      minRaces: 12
    },
    priority: { primary: 'performance', secondary: 'media', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      maxDNFs: 5,
      requiredShoutouts: 2,
      requiredEvents: 1,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['Germany'],
    seriesBonus: ['touring', 'gt4', 'imsa']
  },
  {
    id: 'yokohama',
    name: 'Yokohama',
    category: 'tires',
    tier: 'mid',
    description: 'Excellence in tire technology for motorsport',
    country: 'Japan',
    paymentTiers: {
      entry: { monthly: 4200, winBonus: 2300, podiumBonus: 1150, championshipBonus: 16000 },
      mid: { monthly: 21000, winBonus: 10500, podiumBonus: 5250, championshipBonus: 62000 },
      elite: { monthly: 58000, winBonus: 26000, podiumBonus: 13000, championshipBonus: 175000 }
    },
    requirements: {
      minReputation: 28,
      minMarketability: 26
    },
    priority: { primary: 'performance', secondary: 'media', weight: 2 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 3,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['Japan'],
    seriesBonus: ['super_gt', 'touring', 'drift']
  },
  {
    id: 'falken',
    name: 'Falken',
    category: 'tires',
    tier: 'mid',
    description: 'High performance tires for the passionate driver',
    country: 'Japan',
    paymentTiers: {
      entry: { monthly: 3600, winBonus: 1900, podiumBonus: 950, championshipBonus: 14000 },
      mid: { monthly: 18500, winBonus: 9200, podiumBonus: 4600, championshipBonus: 55000 },
      elite: { monthly: 50000, winBonus: 23000, podiumBonus: 11500, championshipBonus: 155000 }
    },
    requirements: {
      minReputation: 25,
      minMarketability: 24
    },
    priority: { primary: 'media', secondary: 'performance', weight: 2 },
    expectations: {
      minSeasonPodiums: 1,
      requiredShoutouts: 4,
      viralPostBonus: true,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['Japan', 'Germany'],
    seriesBonus: ['drift', 'gt4', 'time_attack']
  },
  {
    id: 'hankook',
    name: 'Hankook',
    category: 'tires',
    tier: 'high',
    description: 'Driving emotion - official tire of DTM',
    country: 'South Korea',
    paymentTiers: {
      entry: { monthly: 5900, winBonus: 3100, podiumBonus: 1550, championshipBonus: 23000 },
      mid: { monthly: 29000, winBonus: 14500, podiumBonus: 7250, championshipBonus: 88000 },
      elite: { monthly: 82000, winBonus: 36000, podiumBonus: 18000, championshipBonus: 250000 }
    },
    requirements: {
      minReputation: 36,
      minMarketability: 32,
      minRaces: 10
    },
    priority: { primary: 'performance', secondary: 'events', weight: 3 },
    expectations: {
      minSeasonPodiums: 3,
      championshipTarget: 'top5',
      maxDNFs: 4,
      requiredShoutouts: 2,
      requiredEvents: 2,
      preferredImageStyle: 'professional'
    },
    nationalityBonus: ['South Korea'],
    seriesBonus: ['dtm', 'touring', 'formula']
  },
  {
    id: 'toyo-tires',
    name: 'Toyo Tires',
    category: 'tires',
    tier: 'entry',
    description: 'Driven to perform - grassroots to pro motorsport',
    country: 'Japan',
    paymentTiers: {
      entry: { monthly: 2600, winBonus: 1500, podiumBonus: 750, championshipBonus: 10000 },
      mid: { monthly: 13000, winBonus: 6500, podiumBonus: 3250, championshipBonus: 40000 },
      elite: { monthly: 35000, winBonus: 16000, podiumBonus: 8000, championshipBonus: 105000 }
    },
    requirements: {
      minReputation: 16,
      minMarketability: 18
    },
    priority: { primary: 'media', secondary: 'performance', weight: 2 },
    expectations: {
      requiredShoutouts: 3,
      viralPostBonus: true,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['Japan', 'USA'],
    seriesBonus: ['drift', 'time_attack']
  },

  // ============================================
  // TECH & GAMING - Realistic Values
  // Entry: $30k-$100k/year | Mid: $150k-$500k/year | Elite: $600k-$2M/year
  // ============================================
  {
    id: 'fanatec',
    name: 'Fanatec',
    category: 'tech_gaming',
    tier: 'entry',
    description: 'Premium sim racing equipment for aspiring champions',
    country: 'Germany',
    paymentTiers: {
      entry: { monthly: 3800, winBonus: 2200, podiumBonus: 1100, championshipBonus: 14000 },
      mid: { monthly: 17000, winBonus: 8500, podiumBonus: 4250, championshipBonus: 52000 },
      elite: { monthly: 45000, winBonus: 20000, podiumBonus: 10000, championshipBonus: 135000 }
    },
    requirements: {
      minReputation: 10,
      minMarketability: 20
    },
    priority: { primary: 'media', secondary: 'events', weight: 3 },
    expectations: {
      requiredShoutouts: 6,
      minFollowers: 5000,
      viralPostBonus: true,
      requiredEvents: 2,
      productLaunches: 1,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['Germany'],
    seriesBonus: ['gt3', 'gt4']
  },
  {
    id: 'logitech',
    name: 'Logitech G',
    category: 'tech_gaming',
    tier: 'entry',
    description: 'Play advanced - sim racing gear for all levels',
    country: 'Switzerland',
    paymentTiers: {
      entry: { monthly: 2800, winBonus: 1600, podiumBonus: 800, championshipBonus: 10000 },
      mid: { monthly: 14000, winBonus: 7000, podiumBonus: 3500, championshipBonus: 42000 },
      elite: { monthly: 36000, winBonus: 16000, podiumBonus: 8000, championshipBonus: 110000 }
    },
    requirements: {
      minReputation: 8,
      minMarketability: 15
    },
    priority: { primary: 'media', weight: 2 },
    expectations: {
      requiredShoutouts: 4,
      viralPostBonus: true,
      requiredEvents: 1,
      preferredImageStyle: 'professional'
    }
  },
  {
    id: 'razer',
    name: 'Razer',
    category: 'tech_gaming',
    tier: 'mid',
    description: 'For gamers. By gamers. Now in motorsport.',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 4800, winBonus: 2700, podiumBonus: 1350, championshipBonus: 18000 },
      mid: { monthly: 24000, winBonus: 12000, podiumBonus: 6000, championshipBonus: 72000 },
      elite: { monthly: 62000, winBonus: 28000, podiumBonus: 14000, championshipBonus: 185000 }
    },
    requirements: {
      minReputation: 22,
      minMarketability: 40
    },
    priority: { primary: 'media', secondary: 'events', weight: 4 },
    expectations: {
      requiredShoutouts: 8,
      minFollowers: 15000,
      viralPostBonus: true,
      requiredEvents: 2,
      productLaunches: 1,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['USA', 'Singapore']
  },
  {
    id: 'amd',
    name: 'AMD',
    category: 'tech_gaming',
    tier: 'high',
    description: 'High performance computing meets high performance racing',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 6500, winBonus: 3800, podiumBonus: 1900, championshipBonus: 26000 },
      mid: { monthly: 33000, winBonus: 16500, podiumBonus: 8250, championshipBonus: 100000 },
      elite: { monthly: 92000, winBonus: 42000, podiumBonus: 21000, championshipBonus: 280000 }
    },
    requirements: {
      minReputation: 35,
      minMarketability: 40,
      minRaces: 10
    },
    priority: { primary: 'brand_alignment', secondary: 'media', weight: 4 },
    expectations: {
      minSeasonPodiums: 3,
      championshipTarget: 'top5',
      requiredShoutouts: 4,
      requiredInterviews: 1,
      requiredEvents: 2,
      productLaunches: 1,
      preferredImageStyle: 'technical',
      noControversyClause: true
    },
    manufacturerBonus: ['mercedes'],
    seriesBonus: ['formula']
  },
  {
    id: 'nvidia',
    name: 'NVIDIA',
    category: 'tech_gaming',
    tier: 'elite',
    description: 'The way its meant to be raced - GPU technology leader',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 8500, winBonus: 4800, podiumBonus: 2400, championshipBonus: 36000 },
      mid: { monthly: 45000, winBonus: 22500, podiumBonus: 11250, championshipBonus: 140000 },
      elite: { monthly: 150000, winBonus: 65000, podiumBonus: 32500, championshipBonus: 480000 }
    },
    requirements: {
      minReputation: 55,
      minMarketability: 55,
      minWins: 3,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'media', weight: 5 },
    expectations: {
      minSeasonWins: 2,
      minSeasonPodiums: 5,
      championshipTarget: 'top3',
      requiredShoutouts: 6,
      requiredInterviews: 2,
      minFollowers: 50000,
      requiredEvents: 3,
      productLaunches: 2,
      preferredImageStyle: 'technical',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['formula', 'lmp']
  },
  {
    id: 'intel',
    name: 'Intel',
    category: 'tech_gaming',
    tier: 'elite',
    description: 'Intel Inside - powering the future of motorsport',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 7800, winBonus: 4200, podiumBonus: 2100, championshipBonus: 32000 },
      mid: { monthly: 40000, winBonus: 20000, podiumBonus: 10000, championshipBonus: 125000 },
      elite: { monthly: 130000, winBonus: 56000, podiumBonus: 28000, championshipBonus: 420000 }
    },
    requirements: {
      minReputation: 52,
      minMarketability: 50,
      minWins: 2,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'events', weight: 4 },
    expectations: {
      minSeasonWins: 1,
      minSeasonPodiums: 4,
      championshipTarget: 'top5',
      requiredShoutouts: 4,
      requiredInterviews: 1,
      requiredEvents: 2,
      productLaunches: 1,
      preferredImageStyle: 'technical',
      noControversyClause: true
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['formula']
  },
  {
    id: 'corsair',
    name: 'Corsair',
    category: 'tech_gaming',
    tier: 'mid',
    description: 'Gaming peripherals and streaming gear excellence',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 4300, winBonus: 2400, podiumBonus: 1200, championshipBonus: 16000 },
      mid: { monthly: 21500, winBonus: 10800, podiumBonus: 5400, championshipBonus: 65000 },
      elite: { monthly: 56000, winBonus: 26000, podiumBonus: 13000, championshipBonus: 170000 }
    },
    requirements: {
      minReputation: 20,
      minMarketability: 35
    },
    priority: { primary: 'media', secondary: 'events', weight: 3 },
    expectations: {
      requiredShoutouts: 6,
      minFollowers: 10000,
      viralPostBonus: true,
      requiredEvents: 1,
      productLaunches: 1,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['USA']
  },
  {
    id: 'steelseries',
    name: 'SteelSeries',
    category: 'tech_gaming',
    tier: 'entry',
    description: 'Engineered for esports - gaming peripherals',
    country: 'Denmark',
    paymentTiers: {
      entry: { monthly: 3000, winBonus: 1700, podiumBonus: 850, championshipBonus: 11000 },
      mid: { monthly: 15000, winBonus: 7500, podiumBonus: 3750, championshipBonus: 45000 },
      elite: { monthly: 38000, winBonus: 17000, podiumBonus: 8500, championshipBonus: 115000 }
    },
    requirements: {
      minReputation: 12,
      minMarketability: 22
    },
    priority: { primary: 'media', weight: 2 },
    expectations: {
      requiredShoutouts: 4,
      viralPostBonus: true,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['Denmark']
  },
  {
    id: 'asus-rog',
    name: 'ASUS ROG',
    category: 'tech_gaming',
    tier: 'high',
    description: 'Republic of Gamers - extreme gaming hardware',
    country: 'Taiwan',
    paymentTiers: {
      entry: { monthly: 5800, winBonus: 3200, podiumBonus: 1600, championshipBonus: 22000 },
      mid: { monthly: 30000, winBonus: 15000, podiumBonus: 7500, championshipBonus: 92000 },
      elite: { monthly: 80000, winBonus: 36000, podiumBonus: 18000, championshipBonus: 245000 }
    },
    requirements: {
      minReputation: 32,
      minMarketability: 38,
      minRaces: 8
    },
    priority: { primary: 'media', secondary: 'performance', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 5,
      minFollowers: 15000,
      viralPostBonus: true,
      requiredEvents: 1,
      productLaunches: 1,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['Taiwan'],
    seriesBonus: ['gt3', 'formula']
  },
  {
    id: 'msi',
    name: 'MSI Gaming',
    category: 'tech_gaming',
    tier: 'mid',
    description: 'True gaming - high performance hardware',
    country: 'Taiwan',
    paymentTiers: {
      entry: { monthly: 4500, winBonus: 2500, podiumBonus: 1250, championshipBonus: 17000 },
      mid: { monthly: 22500, winBonus: 11200, podiumBonus: 5600, championshipBonus: 68000 },
      elite: { monthly: 58000, winBonus: 27000, podiumBonus: 13500, championshipBonus: 175000 }
    },
    requirements: {
      minReputation: 22,
      minMarketability: 32
    },
    priority: { primary: 'media', secondary: 'events', weight: 2 },
    expectations: {
      requiredShoutouts: 4,
      viralPostBonus: true,
      requiredEvents: 1,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['Taiwan']
  },
  {
    id: 'alienware',
    name: 'Alienware',
    category: 'tech_gaming',
    tier: 'high',
    description: 'Beyond gaming - extreme performance computing',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 6200, winBonus: 3400, podiumBonus: 1700, championshipBonus: 24000 },
      mid: { monthly: 31000, winBonus: 15500, podiumBonus: 7750, championshipBonus: 95000 },
      elite: { monthly: 82000, winBonus: 37000, podiumBonus: 18500, championshipBonus: 250000 }
    },
    requirements: {
      minReputation: 34,
      minMarketability: 42,
      minWins: 1
    },
    priority: { primary: 'media', secondary: 'brand_alignment', weight: 4 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 5,
      minFollowers: 20000,
      viralPostBonus: true,
      requiredEvents: 2,
      productLaunches: 1,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['USA']
  },
  {
    id: 'samsung',
    name: 'Samsung',
    category: 'tech_gaming',
    tier: 'elite',
    description: 'Galaxy of innovation - global technology leader',
    country: 'South Korea',
    paymentTiers: {
      entry: { monthly: 9500, winBonus: 5300, podiumBonus: 2650, championshipBonus: 40000 },
      mid: { monthly: 52000, winBonus: 26000, podiumBonus: 13000, championshipBonus: 160000 },
      elite: { monthly: 175000, winBonus: 75000, podiumBonus: 37500, championshipBonus: 550000 }
    },
    requirements: {
      minReputation: 58,
      minMarketability: 58,
      minWins: 4,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'media', weight: 5 },
    expectations: {
      minSeasonWins: 3,
      minSeasonPodiums: 8,
      championshipTarget: 'top3',
      maxDNFs: 2,
      requiredShoutouts: 8,
      requiredInterviews: 3,
      minFollowers: 100000,
      requiredEvents: 4,
      productLaunches: 2,
      preferredImageStyle: 'professional',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['South Korea'],
    seriesBonus: ['formula']
  },

  // ============================================
  // RACING EQUIPMENT - Realistic Values
  // Entry: $25k-$80k/year | Mid: $100k-$350k/year | Elite: $400k-$1.2M/year
  // ============================================
  {
    id: 'sparco',
    name: 'Sparco',
    category: 'equipment',
    tier: 'entry',
    description: 'Italian racing equipment excellence since 1977',
    country: 'Italy',
    paymentTiers: {
      entry: { monthly: 3000, winBonus: 1700, podiumBonus: 850, championshipBonus: 11000 },
      mid: { monthly: 15000, winBonus: 7500, podiumBonus: 3750, championshipBonus: 45000 },
      elite: { monthly: 40000, winBonus: 18000, podiumBonus: 9000, championshipBonus: 120000 }
    },
    requirements: {
      minReputation: 12,
      minMarketability: 18
    },
    priority: { primary: 'media', secondary: 'events', weight: 2 },
    expectations: {
      requiredShoutouts: 3,
      requiredEvents: 1,
      preferredImageStyle: 'professional'
    },
    nationalityBonus: ['Italy']
  },
  {
    id: 'alpinestars',
    name: 'Alpinestars',
    category: 'equipment',
    tier: 'high',
    description: 'Protection and performance for elite racers',
    country: 'Italy',
    paymentTiers: {
      entry: { monthly: 5300, winBonus: 3000, podiumBonus: 1500, championshipBonus: 20000 },
      mid: { monthly: 27000, winBonus: 13500, podiumBonus: 6750, championshipBonus: 82000 },
      elite: { monthly: 75000, winBonus: 34000, podiumBonus: 17000, championshipBonus: 225000 }
    },
    requirements: {
      minReputation: 35,
      minMarketability: 35,
      minPodiums: 3
    },
    priority: { primary: 'performance', secondary: 'media', weight: 3 },
    expectations: {
      minSeasonPodiums: 3,
      championshipTarget: 'top5',
      requiredShoutouts: 4,
      requiredInterviews: 1,
      requiredEvents: 2,
      preferredImageStyle: 'professional',
      noControversyClause: true
    },
    nationalityBonus: ['Italy'],
    seriesBonus: ['formula', 'gt3', 'motogp']
  },
  {
    id: 'omp-racing',
    name: 'OMP Racing',
    category: 'equipment',
    tier: 'entry',
    description: 'Safety and style for the modern racer',
    country: 'Italy',
    paymentTiers: {
      entry: { monthly: 2400, winBonus: 1300, podiumBonus: 650, championshipBonus: 9000 },
      mid: { monthly: 12000, winBonus: 6000, podiumBonus: 3000, championshipBonus: 36000 },
      elite: { monthly: 32000, winBonus: 15000, podiumBonus: 7500, championshipBonus: 95000 }
    },
    requirements: {
      minReputation: 8,
      minMarketability: 12
    },
    priority: { primary: 'media', weight: 2 },
    expectations: {
      requiredShoutouts: 2,
      preferredImageStyle: 'professional'
    },
    nationalityBonus: ['Italy']
  },
  {
    id: 'bell-helmets',
    name: 'Bell Helmets',
    category: 'equipment',
    tier: 'high',
    description: 'Worn by champions for over 65 years',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 5800, winBonus: 3200, podiumBonus: 1600, championshipBonus: 22000 },
      mid: { monthly: 30000, winBonus: 15000, podiumBonus: 7500, championshipBonus: 90000 },
      elite: { monthly: 80000, winBonus: 36000, podiumBonus: 18000, championshipBonus: 240000 }
    },
    requirements: {
      minReputation: 38,
      minMarketability: 40,
      minWins: 2
    },
    priority: { primary: 'performance', secondary: 'brand_alignment', weight: 4 },
    expectations: {
      minSeasonWins: 1,
      minSeasonPodiums: 4,
      championshipTarget: 'top5',
      requiredShoutouts: 3,
      requiredInterviews: 1,
      requiredEvents: 2,
      preferredImageStyle: 'professional',
      noControversyClause: true
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['formula', 'indycar', 'nascar']
  },
  {
    id: 'arai',
    name: 'Arai',
    category: 'equipment',
    tier: 'high',
    description: 'Japanese helmet craftsmanship for the elite',
    country: 'Japan',
    paymentTiers: {
      entry: { monthly: 5500, winBonus: 3000, podiumBonus: 1500, championshipBonus: 21000 },
      mid: { monthly: 28000, winBonus: 14000, podiumBonus: 7000, championshipBonus: 85000 },
      elite: { monthly: 76000, winBonus: 34000, podiumBonus: 17000, championshipBonus: 230000 }
    },
    requirements: {
      minReputation: 36,
      minMarketability: 35
    },
    priority: { primary: 'brand_alignment', secondary: 'performance', weight: 3 },
    expectations: {
      minSeasonPodiums: 3,
      requiredShoutouts: 2,
      requiredEvents: 1,
      preferredImageStyle: 'technical',
      noControversyClause: true
    },
    nationalityBonus: ['Japan'],
    seriesBonus: ['formula', 'super_gt']
  },
  {
    id: 'schuberth',
    name: 'Schuberth',
    category: 'equipment',
    tier: 'elite',
    description: 'German precision helmets for Formula 1 champions',
    country: 'Germany',
    paymentTiers: {
      entry: { monthly: 7000, winBonus: 3800, podiumBonus: 1900, championshipBonus: 28000 },
      mid: { monthly: 38000, winBonus: 19000, podiumBonus: 9500, championshipBonus: 115000 },
      elite: { monthly: 110000, winBonus: 50000, podiumBonus: 25000, championshipBonus: 340000 }
    },
    requirements: {
      minReputation: 55,
      minMarketability: 50,
      minWins: 3,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'performance', secondary: 'brand_alignment', weight: 5 },
    expectations: {
      minSeasonWins: 2,
      minSeasonPodiums: 6,
      championshipTarget: 'top3',
      maxDNFs: 3,
      requiredShoutouts: 4,
      requiredInterviews: 2,
      requiredEvents: 2,
      preferredImageStyle: 'technical',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['Germany'],
    seriesBonus: ['formula']
  },
  {
    id: 'stilo',
    name: 'Stilo',
    category: 'equipment',
    tier: 'mid',
    description: 'Italian helmet design meets racing innovation',
    country: 'Italy',
    paymentTiers: {
      entry: { monthly: 3700, winBonus: 2100, podiumBonus: 1050, championshipBonus: 14000 },
      mid: { monthly: 19000, winBonus: 9500, podiumBonus: 4750, championshipBonus: 57000 },
      elite: { monthly: 50000, winBonus: 23000, podiumBonus: 11500, championshipBonus: 150000 }
    },
    requirements: {
      minReputation: 22,
      minMarketability: 25
    },
    priority: { primary: 'media', secondary: 'performance', weight: 2 },
    expectations: {
      minSeasonPodiums: 1,
      requiredShoutouts: 3,
      requiredEvents: 1,
      preferredImageStyle: 'professional'
    },
    nationalityBonus: ['Italy'],
    seriesBonus: ['rally', 'touring']
  },
  {
    id: 'sabelt',
    name: 'Sabelt',
    category: 'equipment',
    tier: 'mid',
    description: 'Premium racing harnesses and equipment',
    country: 'Italy',
    paymentTiers: {
      entry: { monthly: 3400, winBonus: 1900, podiumBonus: 950, championshipBonus: 13000 },
      mid: { monthly: 17000, winBonus: 8500, podiumBonus: 4250, championshipBonus: 52000 },
      elite: { monthly: 46000, winBonus: 21000, podiumBonus: 10500, championshipBonus: 140000 }
    },
    requirements: {
      minReputation: 20,
      minMarketability: 22
    },
    priority: { primary: 'performance', weight: 2 },
    expectations: {
      requiredShoutouts: 2,
      requiredEvents: 1,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['Italy'],
    seriesBonus: ['gt3', 'rally']
  },
  {
    id: 'momo',
    name: 'MOMO',
    category: 'equipment',
    tier: 'entry',
    description: 'Italian steering wheels and racing equipment since 1964',
    country: 'Italy',
    paymentTiers: {
      entry: { monthly: 2700, winBonus: 1500, podiumBonus: 750, championshipBonus: 10000 },
      mid: { monthly: 13000, winBonus: 6500, podiumBonus: 3250, championshipBonus: 40000 },
      elite: { monthly: 34000, winBonus: 16000, podiumBonus: 8000, championshipBonus: 100000 }
    },
    requirements: {
      minReputation: 10,
      minMarketability: 15
    },
    priority: { primary: 'media', weight: 2 },
    expectations: {
      requiredShoutouts: 2,
      preferredImageStyle: 'professional'
    },
    nationalityBonus: ['Italy']
  },
  {
    id: 'stand21',
    name: 'Stand 21',
    category: 'equipment',
    tier: 'high',
    description: 'French racing suits worn by world champions',
    country: 'France',
    paymentTiers: {
      entry: { monthly: 5100, winBonus: 2800, podiumBonus: 1400, championshipBonus: 19000 },
      mid: { monthly: 26000, winBonus: 13000, podiumBonus: 6500, championshipBonus: 78000 },
      elite: { monthly: 68000, winBonus: 31000, podiumBonus: 15500, championshipBonus: 205000 }
    },
    requirements: {
      minReputation: 34,
      minMarketability: 32,
      minPodiums: 2
    },
    priority: { primary: 'performance', secondary: 'brand_alignment', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 3,
      requiredInterviews: 1,
      requiredEvents: 1,
      preferredImageStyle: 'professional',
      noControversyClause: true
    },
    nationalityBonus: ['France'],
    seriesBonus: ['formula', 'lmp']
  },

  // ============================================
  // LUXURY WATCHES - Realistic Values (Prestige tier - highest payouts)
  // Entry: $100k-$300k/year | Mid: $500k-$1.5M/year | Elite: $2M-$10M+/year
  // ============================================
  {
    id: 'tag-heuer',
    name: 'TAG Heuer',
    category: 'watches',
    tier: 'elite',
    description: 'Don\'t crack under pressure - Swiss precision timing',
    country: 'Switzerland',
    paymentTiers: {
      entry: { monthly: 16000, winBonus: 8500, podiumBonus: 4250, championshipBonus: 70000 },
      mid: { monthly: 85000, winBonus: 42500, podiumBonus: 21250, championshipBonus: 320000 },
      elite: { monthly: 320000, winBonus: 130000, podiumBonus: 65000, championshipBonus: 1200000 }
    },
    requirements: {
      minReputation: 65,
      minMarketability: 60,
      minWins: 3,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'events', secondary: 'brand_alignment', weight: 5 },
    expectations: {
      minSeasonWins: 2,
      minSeasonPodiums: 6,
      championshipTarget: 'top3',
      maxDNFs: 3,
      requiredShoutouts: 6,
      requiredInterviews: 3,
      minFollowers: 100000,
      requiredEvents: 4,
      productLaunches: 2,
      preferredImageStyle: 'professional',
      noControversyClause: true,
      exclusiveCategoryClause: true,
      rivalExclusivity: []
    },
    manufacturerBonus: ['porsche'],
    seriesBonus: ['formula', 'lmp']
  },
  {
    id: 'rolex',
    name: 'Rolex',
    category: 'watches',
    tier: 'elite',
    description: 'A crown for every achievement - the ultimate partnership',
    country: 'Switzerland',
    paymentTiers: {
      entry: { monthly: 28000, winBonus: 14000, podiumBonus: 7000, championshipBonus: 120000 },
      mid: { monthly: 165000, winBonus: 82500, podiumBonus: 41250, championshipBonus: 600000 },
      elite: { monthly: 720000, winBonus: 280000, podiumBonus: 140000, championshipBonus: 2800000 }
    },
    requirements: {
      minReputation: 85,
      minMarketability: 80,
      minChampionships: 1,
      seriesTiers: ['elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'events', weight: 5 },
    expectations: {
      minSeasonWins: 4,
      minSeasonPodiums: 10,
      championshipTarget: 'win',
      maxDNFs: 2,
      requiredShoutouts: 8,
      requiredInterviews: 4,
      minFollowers: 250000,
      requiredEvents: 6,
      productLaunches: 3,
      preferredImageStyle: 'professional',
      noControversyClause: true,
      exclusiveCategoryClause: true,
      rivalExclusivity: []
    },
    seriesBonus: ['formula', 'lmp', 'hypercar']
  },
  {
    id: 'richard-mille',
    name: 'Richard Mille',
    category: 'watches',
    tier: 'elite',
    description: 'Racing machines for the wrist - extreme exclusivity',
    country: 'Switzerland',
    paymentTiers: {
      entry: { monthly: 35000, winBonus: 17500, podiumBonus: 8750, championshipBonus: 150000 },
      mid: { monthly: 200000, winBonus: 100000, podiumBonus: 50000, championshipBonus: 750000 },
      elite: { monthly: 900000, winBonus: 350000, podiumBonus: 175000, championshipBonus: 3500000 }
    },
    requirements: {
      minReputation: 92,
      minMarketability: 88,
      minChampionships: 2,
      minWins: 10,
      seriesTiers: ['elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'performance', weight: 5 },
    expectations: {
      minSeasonWins: 5,
      minSeasonPodiums: 12,
      championshipTarget: 'win',
      maxDNFs: 1,
      requiredShoutouts: 10,
      requiredInterviews: 6,
      minFollowers: 500000,
      requiredEvents: 8,
      productLaunches: 4,
      preferredImageStyle: 'professional',
      noControversyClause: true,
      exclusiveCategoryClause: true,
      rivalExclusivity: []
    },
    manufacturerBonus: ['mclaren', 'ferrari'],
    seriesBonus: ['formula']
  },
  {
    id: 'iwc',
    name: 'IWC Schaffhausen',
    category: 'watches',
    tier: 'elite',
    description: 'Engineering for men who make the decisions',
    country: 'Switzerland',
    paymentTiers: {
      entry: { monthly: 15000, winBonus: 7500, podiumBonus: 3750, championshipBonus: 62000 },
      mid: { monthly: 75000, winBonus: 37500, podiumBonus: 18750, championshipBonus: 280000 },
      elite: { monthly: 270000, winBonus: 110000, podiumBonus: 55000, championshipBonus: 1000000 }
    },
    requirements: {
      minReputation: 60,
      minMarketability: 55,
      minWins: 2,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'events', secondary: 'brand_alignment', weight: 4 },
    expectations: {
      minSeasonWins: 1,
      minSeasonPodiums: 5,
      championshipTarget: 'top3',
      maxDNFs: 4,
      requiredShoutouts: 5,
      requiredInterviews: 2,
      minFollowers: 75000,
      requiredEvents: 3,
      productLaunches: 1,
      preferredImageStyle: 'professional',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    manufacturerBonus: ['mercedes'],
    seriesBonus: ['formula', 'lmp']
  },
  {
    id: 'omega',
    name: 'Omega',
    category: 'watches',
    tier: 'elite',
    description: 'First on the moon, first in motorsport timing',
    country: 'Switzerland',
    paymentTiers: {
      entry: { monthly: 17500, winBonus: 9000, podiumBonus: 4500, championshipBonus: 75000 },
      mid: { monthly: 92000, winBonus: 46000, podiumBonus: 23000, championshipBonus: 350000 },
      elite: { monthly: 350000, winBonus: 140000, podiumBonus: 70000, championshipBonus: 1350000 }
    },
    requirements: {
      minReputation: 68,
      minMarketability: 62,
      minWins: 4,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'events', secondary: 'performance', weight: 5 },
    expectations: {
      minSeasonWins: 3,
      minSeasonPodiums: 7,
      championshipTarget: 'top3',
      maxDNFs: 3,
      requiredShoutouts: 6,
      requiredInterviews: 3,
      minFollowers: 120000,
      requiredEvents: 4,
      productLaunches: 2,
      preferredImageStyle: 'professional',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    seriesBonus: ['formula']
  },
  {
    id: 'breitling',
    name: 'Breitling',
    category: 'watches',
    tier: 'high',
    description: 'Instruments for professionals - aviation meets racing',
    country: 'Switzerland',
    paymentTiers: {
      entry: { monthly: 10500, winBonus: 5800, podiumBonus: 2900, championshipBonus: 42000 },
      mid: { monthly: 58000, winBonus: 29000, podiumBonus: 14500, championshipBonus: 175000 },
      elite: { monthly: 190000, winBonus: 80000, podiumBonus: 40000, championshipBonus: 580000 }
    },
    requirements: {
      minReputation: 52,
      minMarketability: 48,
      minPodiums: 5,
      seriesTiers: ['semi-pro', 'pro', 'elite']
    },
    priority: { primary: 'events', secondary: 'media', weight: 4 },
    expectations: {
      minSeasonPodiums: 4,
      championshipTarget: 'top5',
      maxDNFs: 4,
      requiredShoutouts: 4,
      requiredInterviews: 2,
      requiredEvents: 3,
      productLaunches: 1,
      preferredImageStyle: 'professional',
      noControversyClause: true
    },
    seriesBonus: ['gt3', 'lmp']
  },
  {
    id: 'hublot',
    name: 'Hublot',
    category: 'watches',
    tier: 'elite',
    description: 'The art of fusion - bold luxury timepieces',
    country: 'Switzerland',
    paymentTiers: {
      entry: { monthly: 19500, winBonus: 10000, podiumBonus: 5000, championshipBonus: 82000 },
      mid: { monthly: 105000, winBonus: 52500, podiumBonus: 26250, championshipBonus: 400000 },
      elite: { monthly: 420000, winBonus: 170000, podiumBonus: 85000, championshipBonus: 1600000 }
    },
    requirements: {
      minReputation: 72,
      minMarketability: 68,
      minWins: 5,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'events', secondary: 'brand_alignment', weight: 5 },
    expectations: {
      minSeasonWins: 3,
      minSeasonPodiums: 8,
      championshipTarget: 'top3',
      maxDNFs: 2,
      requiredShoutouts: 7,
      requiredInterviews: 3,
      minFollowers: 150000,
      requiredEvents: 5,
      productLaunches: 2,
      preferredImageStyle: 'edgy',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    manufacturerBonus: ['ferrari'],
    seriesBonus: ['formula']
  },
  {
    id: 'tissot',
    name: 'Tissot',
    category: 'watches',
    tier: 'mid',
    description: 'Innovators by tradition - official timing partner',
    country: 'Switzerland',
    paymentTiers: {
      entry: { monthly: 5800, winBonus: 3200, podiumBonus: 1600, championshipBonus: 22000 },
      mid: { monthly: 30000, winBonus: 15000, podiumBonus: 7500, championshipBonus: 90000 },
      elite: { monthly: 80000, winBonus: 36000, podiumBonus: 18000, championshipBonus: 240000 }
    },
    requirements: {
      minReputation: 35,
      minMarketability: 38
    },
    priority: { primary: 'events', secondary: 'media', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 4,
      requiredInterviews: 1,
      requiredEvents: 2,
      preferredImageStyle: 'professional'
    },
    seriesBonus: ['motogp', 'touring']
  },
  {
    id: 'longines',
    name: 'Longines',
    category: 'watches',
    tier: 'high',
    description: 'Elegance is an attitude - timekeeping excellence',
    country: 'Switzerland',
    paymentTiers: {
      entry: { monthly: 9000, winBonus: 4800, podiumBonus: 2400, championshipBonus: 36000 },
      mid: { monthly: 48000, winBonus: 24000, podiumBonus: 12000, championshipBonus: 145000 },
      elite: { monthly: 150000, winBonus: 65000, podiumBonus: 32500, championshipBonus: 460000 }
    },
    requirements: {
      minReputation: 48,
      minMarketability: 45,
      minPodiums: 3,
      seriesTiers: ['semi-pro', 'pro', 'elite']
    },
    priority: { primary: 'events', secondary: 'brand_alignment', weight: 3 },
    expectations: {
      minSeasonPodiums: 3,
      requiredShoutouts: 3,
      requiredInterviews: 2,
      requiredEvents: 2,
      preferredImageStyle: 'professional',
      noControversyClause: true
    },
    seriesBonus: ['equestrian', 'skiing']
  },
  {
    id: 'zenith',
    name: 'Zenith',
    category: 'watches',
    tier: 'high',
    description: 'Time to reach your star - chronograph pioneers',
    country: 'Switzerland',
    paymentTiers: {
      entry: { monthly: 9500, winBonus: 5100, podiumBonus: 2550, championshipBonus: 38000 },
      mid: { monthly: 52000, winBonus: 26000, podiumBonus: 13000, championshipBonus: 158000 },
      elite: { monthly: 165000, winBonus: 70000, podiumBonus: 35000, championshipBonus: 500000 }
    },
    requirements: {
      minReputation: 50,
      minMarketability: 48,
      minWins: 2,
      seriesTiers: ['semi-pro', 'pro', 'elite']
    },
    priority: { primary: 'performance', secondary: 'events', weight: 4 },
    expectations: {
      minSeasonWins: 1,
      minSeasonPodiums: 4,
      championshipTarget: 'top5',
      requiredShoutouts: 4,
      requiredInterviews: 2,
      requiredEvents: 2,
      preferredImageStyle: 'technical',
      noControversyClause: true
    },
    seriesBonus: ['lmp', 'gt3']
  },

  // ============================================
  // LIFESTYLE & FASHION - Realistic Values
  // Entry: $50k-$180k/year | Mid: $250k-$800k/year | Elite: $1M-$4M/year
  // ============================================
  {
    id: 'puma',
    name: 'Puma',
    category: 'lifestyle',
    tier: 'high',
    description: 'Forever Faster - sportswear for champions',
    country: 'Germany',
    paymentTiers: {
      entry: { monthly: 6300, winBonus: 3600, podiumBonus: 1800, championshipBonus: 25000 },
      mid: { monthly: 34000, winBonus: 17000, podiumBonus: 8500, championshipBonus: 105000 },
      elite: { monthly: 100000, winBonus: 45000, podiumBonus: 22500, championshipBonus: 310000 }
    },
    requirements: {
      minReputation: 38,
      minMarketability: 45,
      minWins: 2
    },
    priority: { primary: 'media', secondary: 'events', weight: 4 },
    expectations: {
      minSeasonPodiums: 4,
      requiredShoutouts: 6,
      requiredInterviews: 2,
      minFollowers: 30000,
      requiredEvents: 3,
      productLaunches: 2,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['Germany'],
    manufacturerBonus: ['ferrari', 'porsche', 'bmw'],
    seriesBonus: ['formula']
  },
  {
    id: 'hugo-boss',
    name: 'Hugo Boss',
    category: 'lifestyle',
    tier: 'elite',
    description: 'Success is a state of mind - dress for the podium',
    country: 'Germany',
    paymentTiers: {
      entry: { monthly: 11000, winBonus: 5800, podiumBonus: 2900, championshipBonus: 45000 },
      mid: { monthly: 60000, winBonus: 30000, podiumBonus: 15000, championshipBonus: 185000 },
      elite: { monthly: 195000, winBonus: 82000, podiumBonus: 41000, championshipBonus: 600000 }
    },
    requirements: {
      minReputation: 55,
      minMarketability: 60,
      minPodiums: 8,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'events', weight: 5 },
    expectations: {
      minSeasonWins: 2,
      minSeasonPodiums: 6,
      championshipTarget: 'top3',
      maxDNFs: 3,
      requiredShoutouts: 6,
      requiredInterviews: 3,
      minFollowers: 100000,
      requiredEvents: 4,
      productLaunches: 2,
      preferredImageStyle: 'professional',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['Germany'],
    manufacturerBonus: ['porsche', 'audi'],
    seriesBonus: ['formula']
  },
  {
    id: 'tommy-hilfiger',
    name: 'Tommy Hilfiger',
    category: 'lifestyle',
    tier: 'high',
    description: 'Classic American cool meets motorsport',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 7400, winBonus: 4000, podiumBonus: 2000, championshipBonus: 30000 },
      mid: { monthly: 38000, winBonus: 19000, podiumBonus: 9500, championshipBonus: 115000 },
      elite: { monthly: 108000, winBonus: 48000, podiumBonus: 24000, championshipBonus: 330000 }
    },
    requirements: {
      minReputation: 42,
      minMarketability: 52
    },
    priority: { primary: 'media', secondary: 'brand_alignment', weight: 4 },
    expectations: {
      minSeasonPodiums: 3,
      requiredShoutouts: 5,
      requiredInterviews: 2,
      minFollowers: 40000,
      requiredEvents: 2,
      productLaunches: 1,
      preferredImageStyle: 'professional'
    },
    nationalityBonus: ['USA', 'Netherlands'],
    manufacturerBonus: ['mercedes'],
    seriesBonus: ['formula']
  },
  {
    id: 'under-armour',
    name: 'Under Armour',
    category: 'lifestyle',
    tier: 'mid',
    description: 'The only way is through - performance apparel',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 4800, winBonus: 2700, podiumBonus: 1350, championshipBonus: 18000 },
      mid: { monthly: 24000, winBonus: 12000, podiumBonus: 6000, championshipBonus: 72000 },
      elite: { monthly: 62000, winBonus: 28000, podiumBonus: 14000, championshipBonus: 190000 }
    },
    requirements: {
      minReputation: 28,
      minMarketability: 38
    },
    priority: { primary: 'performance', secondary: 'media', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 4,
      minFollowers: 15000,
      requiredEvents: 1,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['USA']
  },
  {
    id: 'nike',
    name: 'Nike',
    category: 'lifestyle',
    tier: 'elite',
    description: 'Just Do It - the world\'s premier sports brand',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 13000, winBonus: 7000, podiumBonus: 3500, championshipBonus: 55000 },
      mid: { monthly: 72000, winBonus: 36000, podiumBonus: 18000, championshipBonus: 220000 },
      elite: { monthly: 240000, winBonus: 100000, podiumBonus: 50000, championshipBonus: 750000 }
    },
    requirements: {
      minReputation: 62,
      minMarketability: 68,
      minWins: 5,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'media', secondary: 'brand_alignment', weight: 5 },
    expectations: {
      minSeasonWins: 3,
      minSeasonPodiums: 8,
      championshipTarget: 'top3',
      maxDNFs: 2,
      requiredShoutouts: 8,
      requiredInterviews: 4,
      minFollowers: 200000,
      viralPostBonus: true,
      requiredEvents: 5,
      productLaunches: 3,
      preferredImageStyle: 'edgy',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['formula']
  },
  {
    id: 'adidas',
    name: 'Adidas',
    category: 'lifestyle',
    tier: 'elite',
    description: 'Impossible is nothing - three stripes in racing',
    country: 'Germany',
    paymentTiers: {
      entry: { monthly: 12000, winBonus: 6500, podiumBonus: 3250, championshipBonus: 50000 },
      mid: { monthly: 65000, winBonus: 32500, podiumBonus: 16250, championshipBonus: 200000 },
      elite: { monthly: 220000, winBonus: 92000, podiumBonus: 46000, championshipBonus: 680000 }
    },
    requirements: {
      minReputation: 58,
      minMarketability: 65,
      minWins: 4,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'media', secondary: 'events', weight: 5 },
    expectations: {
      minSeasonWins: 2,
      minSeasonPodiums: 7,
      championshipTarget: 'top3',
      maxDNFs: 3,
      requiredShoutouts: 7,
      requiredInterviews: 3,
      minFollowers: 150000,
      viralPostBonus: true,
      requiredEvents: 4,
      productLaunches: 2,
      preferredImageStyle: 'edgy',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['Germany'],
    seriesBonus: ['formula']
  },
  {
    id: 'ralph-lauren',
    name: 'Ralph Lauren',
    category: 'lifestyle',
    tier: 'elite',
    description: 'The pinnacle of American luxury fashion',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 9500, winBonus: 5300, podiumBonus: 2650, championshipBonus: 40000 },
      mid: { monthly: 52000, winBonus: 26000, podiumBonus: 13000, championshipBonus: 160000 },
      elite: { monthly: 175000, winBonus: 74000, podiumBonus: 37000, championshipBonus: 540000 }
    },
    requirements: {
      minReputation: 55,
      minMarketability: 62,
      minPodiums: 6,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'events', weight: 4 },
    expectations: {
      minSeasonPodiums: 5,
      championshipTarget: 'top5',
      maxDNFs: 4,
      requiredShoutouts: 5,
      requiredInterviews: 2,
      minFollowers: 80000,
      requiredEvents: 3,
      productLaunches: 1,
      preferredImageStyle: 'professional',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['USA']
  },
  {
    id: 'ray-ban',
    name: 'Ray-Ban',
    category: 'lifestyle',
    tier: 'mid',
    description: 'Iconic eyewear for racing icons',
    country: 'Italy',
    paymentTiers: {
      entry: { monthly: 4200, winBonus: 2300, podiumBonus: 1150, championshipBonus: 16000 },
      mid: { monthly: 21000, winBonus: 10500, podiumBonus: 5250, championshipBonus: 64000 },
      elite: { monthly: 55000, winBonus: 25000, podiumBonus: 12500, championshipBonus: 170000 }
    },
    requirements: {
      minReputation: 30,
      minMarketability: 42
    },
    priority: { primary: 'media', secondary: 'brand_alignment', weight: 3 },
    expectations: {
      requiredShoutouts: 4,
      minFollowers: 25000,
      requiredEvents: 2,
      preferredImageStyle: 'professional'
    },
    nationalityBonus: ['Italy', 'USA']
  },
  {
    id: 'oakley',
    name: 'Oakley',
    category: 'lifestyle',
    tier: 'mid',
    description: 'Beyond reason - performance eyewear and apparel',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 4000, winBonus: 2200, podiumBonus: 1100, championshipBonus: 15000 },
      mid: { monthly: 20000, winBonus: 10000, podiumBonus: 5000, championshipBonus: 60000 },
      elite: { monthly: 53000, winBonus: 24000, podiumBonus: 12000, championshipBonus: 160000 }
    },
    requirements: {
      minReputation: 28,
      minMarketability: 40
    },
    priority: { primary: 'performance', secondary: 'media', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 5,
      minFollowers: 20000,
      viralPostBonus: true,
      requiredEvents: 1,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['motocross', 'cycling']
  },
  {
    id: 'giorgio-armani',
    name: 'Giorgio Armani',
    category: 'lifestyle',
    tier: 'elite',
    description: 'Italian elegance for the motorsport elite',
    country: 'Italy',
    paymentTiers: {
      entry: { monthly: 11000, winBonus: 6000, podiumBonus: 3000, championshipBonus: 46000 },
      mid: { monthly: 58000, winBonus: 29000, podiumBonus: 14500, championshipBonus: 178000 },
      elite: { monthly: 200000, winBonus: 85000, podiumBonus: 42500, championshipBonus: 620000 }
    },
    requirements: {
      minReputation: 58,
      minMarketability: 64,
      minPodiums: 7,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'events', weight: 5 },
    expectations: {
      minSeasonPodiums: 6,
      championshipTarget: 'top5',
      maxDNFs: 3,
      requiredShoutouts: 5,
      requiredInterviews: 3,
      minFollowers: 100000,
      requiredEvents: 4,
      productLaunches: 2,
      preferredImageStyle: 'professional',
      noControversyClause: true,
      exclusiveCategoryClause: true,
      rivalExclusivity: []
    },
    nationalityBonus: ['Italy']
  },

  // ============================================
  // AUTOMOTIVE - Realistic Values
  // Entry: $40k-$120k/year | Mid: $180k-$500k/year | Elite: $600k-$2M/year
  // ============================================
  {
    id: 'brembo',
    name: 'Brembo',
    category: 'automotive',
    tier: 'high',
    description: 'Turning energy into emotion - brake systems excellence',
    country: 'Italy',
    paymentTiers: {
      entry: { monthly: 5800, winBonus: 3200, podiumBonus: 1600, championshipBonus: 22000 },
      mid: { monthly: 30000, winBonus: 15000, podiumBonus: 7500, championshipBonus: 90000 },
      elite: { monthly: 82000, winBonus: 37000, podiumBonus: 18500, championshipBonus: 250000 }
    },
    requirements: {
      minReputation: 35,
      minMarketability: 30,
      seriesTiers: ['semi-pro', 'pro', 'elite']
    },
    priority: { primary: 'performance', secondary: 'brand_alignment', weight: 3 },
    expectations: {
      minSeasonPodiums: 3,
      requiredShoutouts: 3,
      requiredEvents: 1,
      preferredImageStyle: 'technical',
      noControversyClause: true
    },
    nationalityBonus: ['Italy'],
    seriesBonus: ['formula', 'gt3', 'touring']
  },
  {
    id: 'bilstein',
    name: 'Bilstein',
    category: 'automotive',
    tier: 'mid',
    description: 'German suspension technology for the track',
    country: 'Germany',
    paymentTiers: {
      entry: { monthly: 3700, winBonus: 2100, podiumBonus: 1050, championshipBonus: 14000 },
      mid: { monthly: 19000, winBonus: 9500, podiumBonus: 4750, championshipBonus: 57000 },
      elite: { monthly: 50000, winBonus: 23000, podiumBonus: 11500, championshipBonus: 150000 }
    },
    requirements: {
      minReputation: 22,
      minMarketability: 20
    },
    priority: { primary: 'performance', weight: 2 },
    expectations: {
      minSeasonPodiums: 1,
      requiredShoutouts: 2,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['Germany'],
    seriesBonus: ['touring', 'gt4', 'rallycross']
  },
  {
    id: 'motul',
    name: 'Motul',
    category: 'automotive',
    tier: 'mid',
    description: '300V competition oil - trusted by racers worldwide',
    country: 'France',
    paymentTiers: {
      entry: { monthly: 4200, winBonus: 2400, podiumBonus: 1200, championshipBonus: 16000 },
      mid: { monthly: 21000, winBonus: 10500, podiumBonus: 5250, championshipBonus: 64000 },
      elite: { monthly: 55000, winBonus: 25000, podiumBonus: 12500, championshipBonus: 165000 }
    },
    requirements: {
      minReputation: 24,
      minMarketability: 22
    },
    priority: { primary: 'performance', secondary: 'media', weight: 2 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 3,
      requiredEvents: 1,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['France', 'Japan'],
    seriesBonus: ['gt3', 'lmp', 'super_gt']
  },
  {
    id: 'bosch',
    name: 'Bosch Motorsport',
    category: 'automotive',
    tier: 'elite',
    description: 'Invented for life - automotive technology leader',
    country: 'Germany',
    paymentTiers: {
      entry: { monthly: 8500, winBonus: 4800, podiumBonus: 2400, championshipBonus: 35000 },
      mid: { monthly: 45000, winBonus: 22500, podiumBonus: 11250, championshipBonus: 138000 },
      elite: { monthly: 150000, winBonus: 65000, podiumBonus: 32500, championshipBonus: 460000 }
    },
    requirements: {
      minReputation: 52,
      minMarketability: 45,
      minWins: 3,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'performance', secondary: 'brand_alignment', weight: 4 },
    expectations: {
      minSeasonWins: 2,
      minSeasonPodiums: 5,
      championshipTarget: 'top3',
      maxDNFs: 3,
      requiredShoutouts: 4,
      requiredInterviews: 2,
      requiredEvents: 2,
      preferredImageStyle: 'technical',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['Germany'],
    seriesBonus: ['formula', 'dtm', 'rallycross']
  },
  {
    id: 'kw-suspension',
    name: 'KW Suspension',
    category: 'automotive',
    tier: 'mid',
    description: 'German coilover technology for motorsport',
    country: 'Germany',
    paymentTiers: {
      entry: { monthly: 3400, winBonus: 1900, podiumBonus: 950, championshipBonus: 13000 },
      mid: { monthly: 17000, winBonus: 8500, podiumBonus: 4250, championshipBonus: 52000 },
      elite: { monthly: 44000, winBonus: 20000, podiumBonus: 10000, championshipBonus: 135000 }
    },
    requirements: {
      minReputation: 20,
      minMarketability: 18
    },
    priority: { primary: 'performance', weight: 2 },
    expectations: {
      minSeasonPodiums: 1,
      requiredShoutouts: 2,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['Germany'],
    seriesBonus: ['gt4', 'touring', 'time_attack']
  },
  {
    id: 'eibach',
    name: 'Eibach',
    category: 'automotive',
    tier: 'entry',
    description: 'Performance springs and suspension components',
    country: 'Germany',
    paymentTiers: {
      entry: { monthly: 2700, winBonus: 1500, podiumBonus: 750, championshipBonus: 10000 },
      mid: { monthly: 13000, winBonus: 6500, podiumBonus: 3250, championshipBonus: 40000 },
      elite: { monthly: 34000, winBonus: 15000, podiumBonus: 7500, championshipBonus: 105000 }
    },
    requirements: {
      minReputation: 14,
      minMarketability: 15
    },
    priority: { primary: 'performance', weight: 2 },
    expectations: {
      requiredShoutouts: 2,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['Germany', 'USA']
  },
  {
    id: 'bbs',
    name: 'BBS Wheels',
    category: 'automotive',
    tier: 'high',
    description: 'Forged racing wheels - the choice of champions',
    country: 'Germany',
    paymentTiers: {
      entry: { monthly: 5300, winBonus: 3000, podiumBonus: 1500, championshipBonus: 20000 },
      mid: { monthly: 27000, winBonus: 13500, podiumBonus: 6750, championshipBonus: 82000 },
      elite: { monthly: 72000, winBonus: 32000, podiumBonus: 16000, championshipBonus: 220000 }
    },
    requirements: {
      minReputation: 32,
      minMarketability: 28
    },
    priority: { primary: 'performance', secondary: 'brand_alignment', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 3,
      requiredEvents: 1,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['Germany'],
    seriesBonus: ['formula', 'gt3', 'dtm']
  },
  {
    id: 'recaro',
    name: 'Recaro',
    category: 'automotive',
    tier: 'mid',
    description: 'Racing seats trusted by professionals worldwide',
    country: 'Germany',
    paymentTiers: {
      entry: { monthly: 4000, winBonus: 2200, podiumBonus: 1100, championshipBonus: 15000 },
      mid: { monthly: 20000, winBonus: 10000, podiumBonus: 5000, championshipBonus: 60000 },
      elite: { monthly: 52000, winBonus: 24000, podiumBonus: 12000, championshipBonus: 158000 }
    },
    requirements: {
      minReputation: 22,
      minMarketability: 20
    },
    priority: { primary: 'performance', secondary: 'media', weight: 2 },
    expectations: {
      minSeasonPodiums: 1,
      requiredShoutouts: 2,
      preferredImageStyle: 'professional'
    },
    nationalityBonus: ['Germany'],
    seriesBonus: ['touring', 'gt3']
  },
  {
    id: 'akrapovic',
    name: 'Akrapovic',
    category: 'automotive',
    tier: 'high',
    description: 'Premium exhaust systems for ultimate performance',
    country: 'Slovenia',
    paymentTiers: {
      entry: { monthly: 5000, winBonus: 2800, podiumBonus: 1400, championshipBonus: 19000 },
      mid: { monthly: 25000, winBonus: 12500, podiumBonus: 6250, championshipBonus: 76000 },
      elite: { monthly: 68000, winBonus: 30000, podiumBonus: 15000, championshipBonus: 205000 }
    },
    requirements: {
      minReputation: 30,
      minMarketability: 28
    },
    priority: { primary: 'performance', secondary: 'media', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 3,
      viralPostBonus: true,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['Slovenia'],
    seriesBonus: ['motogp', 'gt3', 'touring']
  },
  {
    id: 'hre-wheels',
    name: 'HRE Performance Wheels',
    category: 'automotive',
    tier: 'high',
    description: 'American forged wheel excellence',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 5500, winBonus: 3100, podiumBonus: 1550, championshipBonus: 21000 },
      mid: { monthly: 28000, winBonus: 14000, podiumBonus: 7000, championshipBonus: 85000 },
      elite: { monthly: 74000, winBonus: 34000, podiumBonus: 17000, championshipBonus: 225000 }
    },
    requirements: {
      minReputation: 34,
      minMarketability: 32
    },
    priority: { primary: 'media', secondary: 'performance', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 4,
      minFollowers: 15000,
      preferredImageStyle: 'professional'
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['gt3', 'imsa']
  },

  // ============================================
  // FINANCIAL SERVICES - Realistic Values
  // Entry: $80k-$250k/year | Mid: $400k-$1.2M/year | Elite: $1.5M-$6M/year
  // ============================================
  {
    id: 'santander',
    name: 'Santander',
    category: 'financial',
    tier: 'elite',
    description: 'Banking on success - global financial partner',
    country: 'Spain',
    paymentTiers: {
      entry: { monthly: 10500, winBonus: 5800, podiumBonus: 2900, championshipBonus: 44000 },
      mid: { monthly: 58000, winBonus: 29000, podiumBonus: 14500, championshipBonus: 175000 },
      elite: { monthly: 215000, winBonus: 90000, podiumBonus: 45000, championshipBonus: 660000 }
    },
    requirements: {
      minReputation: 55,
      minMarketability: 50,
      minWins: 3,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'events', weight: 4 },
    expectations: {
      minSeasonWins: 2,
      minSeasonPodiums: 5,
      championshipTarget: 'top5',
      maxDNFs: 4,
      requiredShoutouts: 5,
      requiredInterviews: 2,
      minFollowers: 80000,
      requiredEvents: 3,
      preferredImageStyle: 'professional',
      noControversyClause: true
    },
    nationalityBonus: ['Spain', 'Brazil', 'Mexico'],
    manufacturerBonus: ['ferrari'],
    seriesBonus: ['formula']
  },
  {
    id: 'ups',
    name: 'UPS',
    category: 'financial',
    tier: 'mid',
    description: 'What can brown do for you? Speed and precision.',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 5300, winBonus: 3000, podiumBonus: 1500, championshipBonus: 20000 },
      mid: { monthly: 27000, winBonus: 13500, podiumBonus: 6750, championshipBonus: 82000 },
      elite: { monthly: 72000, winBonus: 32000, podiumBonus: 16000, championshipBonus: 220000 }
    },
    requirements: {
      minReputation: 32,
      minMarketability: 34
    },
    priority: { primary: 'brand_alignment', secondary: 'media', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 3,
      requiredEvents: 2,
      preferredImageStyle: 'professional',
      noControversyClause: true
    },
    nationalityBonus: ['USA'],
    manufacturerBonus: ['ferrari'],
    seriesBonus: ['formula', 'nascar']
  },
  {
    id: 'mastercard',
    name: 'Mastercard',
    category: 'financial',
    tier: 'elite',
    description: 'Priceless moments in motorsport',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 12500, winBonus: 6800, podiumBonus: 3400, championshipBonus: 52000 },
      mid: { monthly: 68000, winBonus: 34000, podiumBonus: 17000, championshipBonus: 210000 },
      elite: { monthly: 265000, winBonus: 108000, podiumBonus: 54000, championshipBonus: 820000 }
    },
    requirements: {
      minReputation: 62,
      minMarketability: 58,
      minWins: 4,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'events', secondary: 'brand_alignment', weight: 5 },
    expectations: {
      minSeasonWins: 2,
      minSeasonPodiums: 6,
      championshipTarget: 'top3',
      maxDNFs: 3,
      requiredShoutouts: 6,
      requiredInterviews: 3,
      minFollowers: 120000,
      requiredEvents: 4,
      productLaunches: 1,
      preferredImageStyle: 'professional',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['formula']
  },
  {
    id: 'visa',
    name: 'Visa',
    category: 'financial',
    tier: 'elite',
    description: 'Everywhere you want to race',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 11500, winBonus: 6300, podiumBonus: 3150, championshipBonus: 48000 },
      mid: { monthly: 62000, winBonus: 31000, podiumBonus: 15500, championshipBonus: 190000 },
      elite: { monthly: 245000, winBonus: 100000, podiumBonus: 50000, championshipBonus: 760000 }
    },
    requirements: {
      minReputation: 60,
      minMarketability: 56,
      minWins: 3,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'events', secondary: 'media', weight: 4 },
    expectations: {
      minSeasonWins: 2,
      minSeasonPodiums: 5,
      championshipTarget: 'top5',
      maxDNFs: 4,
      requiredShoutouts: 5,
      requiredInterviews: 2,
      minFollowers: 100000,
      requiredEvents: 3,
      preferredImageStyle: 'professional',
      noControversyClause: true
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['formula']
  },
  {
    id: 'crypto-com',
    name: 'Crypto.com',
    category: 'financial',
    tier: 'elite',
    description: 'Fortune favors the brave - crypto exchange leader',
    country: 'Singapore',
    paymentTiers: {
      entry: { monthly: 16000, winBonus: 8500, podiumBonus: 4250, championshipBonus: 68000 },
      mid: { monthly: 85000, winBonus: 42500, podiumBonus: 21250, championshipBonus: 260000 },
      elite: { monthly: 380000, winBonus: 155000, podiumBonus: 77500, championshipBonus: 1180000 }
    },
    requirements: {
      minReputation: 65,
      minMarketability: 65,
      minWins: 5,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'media', secondary: 'events', weight: 5 },
    expectations: {
      minSeasonWins: 3,
      minSeasonPodiums: 8,
      championshipTarget: 'top3',
      maxDNFs: 2,
      requiredShoutouts: 10,
      requiredInterviews: 4,
      minFollowers: 200000,
      viralPostBonus: true,
      requiredEvents: 5,
      productLaunches: 2,
      preferredImageStyle: 'edgy',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['Singapore'],
    seriesBonus: ['formula']
  },
  {
    id: 'allianz',
    name: 'Allianz',
    category: 'financial',
    tier: 'high',
    description: 'Confidence in motion - global insurance leader',
    country: 'Germany',
    paymentTiers: {
      entry: { monthly: 7400, winBonus: 4000, podiumBonus: 2000, championshipBonus: 30000 },
      mid: { monthly: 40000, winBonus: 20000, podiumBonus: 10000, championshipBonus: 122000 },
      elite: { monthly: 128000, winBonus: 56000, podiumBonus: 28000, championshipBonus: 390000 }
    },
    requirements: {
      minReputation: 45,
      minMarketability: 42,
      seriesTiers: ['semi-pro', 'pro', 'elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'events', weight: 3 },
    expectations: {
      minSeasonPodiums: 3,
      championshipTarget: 'top5',
      requiredShoutouts: 3,
      requiredInterviews: 1,
      requiredEvents: 2,
      preferredImageStyle: 'professional',
      noControversyClause: true
    },
    nationalityBonus: ['Germany'],
    seriesBonus: ['formula']
  },
  {
    id: 'emirates',
    name: 'Emirates',
    category: 'financial',
    tier: 'elite',
    description: 'Fly better - luxury airline sponsorship',
    country: 'UAE',
    paymentTiers: {
      entry: { monthly: 15000, winBonus: 8000, podiumBonus: 4000, championshipBonus: 62000 },
      mid: { monthly: 80000, winBonus: 40000, podiumBonus: 20000, championshipBonus: 245000 },
      elite: { monthly: 345000, winBonus: 140000, podiumBonus: 70000, championshipBonus: 1070000 }
    },
    requirements: {
      minReputation: 68,
      minMarketability: 62,
      minWins: 4,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'events', weight: 5 },
    expectations: {
      minSeasonWins: 3,
      minSeasonPodiums: 7,
      championshipTarget: 'top3',
      maxDNFs: 3,
      requiredShoutouts: 6,
      requiredInterviews: 3,
      minFollowers: 150000,
      requiredEvents: 4,
      preferredImageStyle: 'professional',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['UAE'],
    seriesBonus: ['formula']
  },
  {
    id: 'dhl',
    name: 'DHL',
    category: 'financial',
    tier: 'high',
    description: 'The logistics of speed - official F1 logistics partner',
    country: 'Germany',
    paymentTiers: {
      entry: { monthly: 6800, winBonus: 3700, podiumBonus: 1850, championshipBonus: 27000 },
      mid: { monthly: 37000, winBonus: 18500, podiumBonus: 9250, championshipBonus: 112000 },
      elite: { monthly: 118000, winBonus: 52000, podiumBonus: 26000, championshipBonus: 360000 }
    },
    requirements: {
      minReputation: 42,
      minMarketability: 40,
      seriesTiers: ['semi-pro', 'pro', 'elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'media', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 4,
      requiredInterviews: 1,
      requiredEvents: 2,
      preferredImageStyle: 'professional',
      noControversyClause: true
    },
    nationalityBonus: ['Germany'],
    seriesBonus: ['formula']
  },
  {
    id: 'heineken',
    name: 'Heineken 0.0',
    category: 'financial',
    tier: 'high',
    description: 'Now you can - alcohol-free celebration sponsor',
    country: 'Netherlands',
    paymentTiers: {
      entry: { monthly: 7800, winBonus: 4200, podiumBonus: 2100, championshipBonus: 31000 },
      mid: { monthly: 42000, winBonus: 21000, podiumBonus: 10500, championshipBonus: 128000 },
      elite: { monthly: 138000, winBonus: 60000, podiumBonus: 30000, championshipBonus: 425000 }
    },
    requirements: {
      minReputation: 48,
      minMarketability: 48,
      minPodiums: 4,
      seriesTiers: ['semi-pro', 'pro', 'elite']
    },
    priority: { primary: 'events', secondary: 'media', weight: 4 },
    expectations: {
      minSeasonPodiums: 4,
      requiredShoutouts: 5,
      requiredInterviews: 2,
      minFollowers: 50000,
      requiredEvents: 3,
      preferredImageStyle: 'professional',
      noControversyClause: true
    },
    nationalityBonus: ['Netherlands'],
    seriesBonus: ['formula']
  },
  {
    id: 'aws',
    name: 'AWS (Amazon)',
    category: 'financial',
    tier: 'elite',
    description: 'Cloud computing powering racing analytics',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 13500, winBonus: 7300, podiumBonus: 3650, championshipBonus: 56000 },
      mid: { monthly: 74000, winBonus: 37000, podiumBonus: 18500, championshipBonus: 225000 },
      elite: { monthly: 300000, winBonus: 125000, podiumBonus: 62500, championshipBonus: 930000 }
    },
    requirements: {
      minReputation: 64,
      minMarketability: 60,
      minWins: 4,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'media', weight: 5 },
    expectations: {
      minSeasonWins: 2,
      minSeasonPodiums: 6,
      championshipTarget: 'top3',
      maxDNFs: 3,
      requiredShoutouts: 6,
      requiredInterviews: 2,
      minFollowers: 100000,
      requiredEvents: 3,
      productLaunches: 1,
      preferredImageStyle: 'technical',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['formula']
  },

  // ============================================
  // LOCAL & REGIONAL - Realistic Values (Grassroots/Entry-level)
  // Entry: $10k-$40k/year | Mid: $40k-$100k/year | Elite: $80k-$200k/year
  // ============================================
  {
    id: 'local-garage',
    name: 'Ace Performance Garage',
    category: 'local',
    tier: 'entry',
    description: 'Your local performance workshop backing local talent',
    country: 'Regional',
    paymentTiers: {
      entry: { monthly: 1200, winBonus: 600, podiumBonus: 300, championshipBonus: 4500 },
      mid: { monthly: 4500, winBonus: 2000, podiumBonus: 1000, championshipBonus: 14000 },
      elite: { monthly: 10000, winBonus: 4500, podiumBonus: 2250, championshipBonus: 30000 }
    },
    requirements: {
      minReputation: 5,
      minMarketability: 5
    },
    priority: { primary: 'media', weight: 1 },
    expectations: {
      requiredShoutouts: 2,
      preferredImageStyle: 'edgy'
    }
  },
  {
    id: 'regional-bank',
    name: 'Regional Savings Bank',
    category: 'local',
    tier: 'entry',
    description: 'Community bank supporting rising stars',
    country: 'Regional',
    paymentTiers: {
      entry: { monthly: 1500, winBonus: 800, podiumBonus: 400, championshipBonus: 5500 },
      mid: { monthly: 5500, winBonus: 2500, podiumBonus: 1250, championshipBonus: 17000 },
      elite: { monthly: 12000, winBonus: 5500, podiumBonus: 2750, championshipBonus: 36000 }
    },
    requirements: {
      minReputation: 8,
      minMarketability: 10
    },
    priority: { primary: 'brand_alignment', weight: 1 },
    expectations: {
      requiredShoutouts: 1,
      requiredEvents: 1,
      preferredImageStyle: 'professional'
    }
  },
  {
    id: 'local-dealership',
    name: 'Metro Auto Dealership',
    category: 'local',
    tier: 'entry',
    description: 'Car dealership investing in motorsport talent',
    country: 'Regional',
    paymentTiers: {
      entry: { monthly: 2000, winBonus: 1000, podiumBonus: 500, championshipBonus: 7500 },
      mid: { monthly: 7000, winBonus: 3200, podiumBonus: 1600, championshipBonus: 22000 },
      elite: { monthly: 15000, winBonus: 6800, podiumBonus: 3400, championshipBonus: 46000 }
    },
    requirements: {
      minReputation: 10,
      minMarketability: 12
    },
    priority: { primary: 'events', secondary: 'media', weight: 2 },
    expectations: {
      requiredShoutouts: 2,
      requiredEvents: 1,
      preferredImageStyle: 'professional'
    }
  },
  {
    id: 'karting-supplier',
    name: 'KartWorld Supplies',
    category: 'local',
    tier: 'entry',
    description: 'Karting equipment supplier supporting grassroots racing',
    country: 'Regional',
    paymentTiers: {
      entry: { monthly: 1000, winBonus: 500, podiumBonus: 250, championshipBonus: 3800 },
      mid: { monthly: 3500, winBonus: 1600, podiumBonus: 800, championshipBonus: 11000 },
      elite: { monthly: 8000, winBonus: 3600, podiumBonus: 1800, championshipBonus: 24000 }
    },
    requirements: {
      minReputation: 3,
      minMarketability: 5
    },
    priority: { primary: 'performance', weight: 1 },
    expectations: {
      requiredShoutouts: 1,
      preferredImageStyle: 'edgy'
    },
    seriesBonus: ['kart']
  },
  {
    id: 'driving-school',
    name: 'ProDrive Racing School',
    category: 'local',
    tier: 'entry',
    description: 'Racing school investing in promising talent',
    country: 'Regional',
    paymentTiers: {
      entry: { monthly: 1400, winBonus: 700, podiumBonus: 350, championshipBonus: 5200 },
      mid: { monthly: 5000, winBonus: 2200, podiumBonus: 1100, championshipBonus: 15500 },
      elite: { monthly: 11000, winBonus: 5000, podiumBonus: 2500, championshipBonus: 34000 }
    },
    requirements: {
      minReputation: 6,
      minMarketability: 8
    },
    priority: { primary: 'performance', secondary: 'media', weight: 1 },
    expectations: {
      requiredShoutouts: 2,
      preferredImageStyle: 'professional'
    }
  },
  {
    id: 'local-tire-shop',
    name: 'Fastlane Tire & Auto',
    category: 'local',
    tier: 'entry',
    description: 'Local tire shop supporting grassroots motorsport',
    country: 'Regional',
    paymentTiers: {
      entry: { monthly: 1100, winBonus: 550, podiumBonus: 275, championshipBonus: 4200 },
      mid: { monthly: 4000, winBonus: 1800, podiumBonus: 900, championshipBonus: 12000 },
      elite: { monthly: 9000, winBonus: 4000, podiumBonus: 2000, championshipBonus: 27000 }
    },
    requirements: {
      minReputation: 4,
      minMarketability: 6
    },
    priority: { primary: 'performance', weight: 1 },
    expectations: {
      requiredShoutouts: 1,
      preferredImageStyle: 'technical'
    }
  },
  {
    id: 'restaurant-chain',
    name: 'Pit Stop Diner',
    category: 'local',
    tier: 'entry',
    description: 'Local restaurant chain backing local racers',
    country: 'Regional',
    paymentTiers: {
      entry: { monthly: 1300, winBonus: 650, podiumBonus: 325, championshipBonus: 4900 },
      mid: { monthly: 4800, winBonus: 2100, podiumBonus: 1050, championshipBonus: 14500 },
      elite: { monthly: 10500, winBonus: 4800, podiumBonus: 2400, championshipBonus: 32000 }
    },
    requirements: {
      minReputation: 7,
      minMarketability: 9
    },
    priority: { primary: 'media', weight: 1 },
    expectations: {
      requiredShoutouts: 2,
      preferredImageStyle: 'edgy'
    }
  },
  {
    id: 'local-insurance',
    name: 'Hometown Insurance',
    category: 'local',
    tier: 'entry',
    description: 'Regional insurance company supporting young talent',
    country: 'Regional',
    paymentTiers: {
      entry: { monthly: 1600, winBonus: 850, podiumBonus: 425, championshipBonus: 6000 },
      mid: { monthly: 6000, winBonus: 2800, podiumBonus: 1400, championshipBonus: 18500 },
      elite: { monthly: 13000, winBonus: 6000, podiumBonus: 3000, championshipBonus: 40000 }
    },
    requirements: {
      minReputation: 9,
      minMarketability: 11
    },
    priority: { primary: 'brand_alignment', weight: 1 },
    expectations: {
      requiredShoutouts: 1,
      preferredImageStyle: 'professional',
      noControversyClause: true
    }
  },
  {
    id: 'sim-center',
    name: 'SimRace Arena',
    category: 'local',
    tier: 'entry',
    description: 'Sim racing center supporting real-world racers',
    country: 'Regional',
    paymentTiers: {
      entry: { monthly: 900, winBonus: 450, podiumBonus: 225, championshipBonus: 3400 },
      mid: { monthly: 3200, winBonus: 1400, podiumBonus: 700, championshipBonus: 9800 },
      elite: { monthly: 7500, winBonus: 3400, podiumBonus: 1700, championshipBonus: 23000 }
    },
    requirements: {
      minReputation: 3,
      minMarketability: 5
    },
    priority: { primary: 'media', weight: 1 },
    expectations: {
      requiredShoutouts: 2,
      viralPostBonus: true,
      preferredImageStyle: 'edgy'
    },
    seriesBonus: ['gt3', 'gt4']
  },
  {
    id: 'auto-parts',
    name: 'RaceParts Direct',
    category: 'local',
    tier: 'entry',
    description: 'Online auto parts retailer backing rising talent',
    country: 'Regional',
    paymentTiers: {
      entry: { monthly: 1800, winBonus: 900, podiumBonus: 450, championshipBonus: 6800 },
      mid: { monthly: 6500, winBonus: 3000, podiumBonus: 1500, championshipBonus: 20000 },
      elite: { monthly: 14000, winBonus: 6500, podiumBonus: 3250, championshipBonus: 43000 }
    },
    requirements: {
      minReputation: 10,
      minMarketability: 12
    },
    priority: { primary: 'media', secondary: 'performance', weight: 1 },
    expectations: {
      requiredShoutouts: 2,
      preferredImageStyle: 'technical'
    }
  },
  {
    id: 'energy-bar',
    name: 'PowerFuel Nutrition',
    category: 'local',
    tier: 'entry',
    description: 'Sports nutrition brand for entry-level athletes',
    country: 'Regional',
    paymentTiers: {
      entry: { monthly: 800, winBonus: 400, podiumBonus: 200, championshipBonus: 3000 },
      mid: { monthly: 3000, winBonus: 1350, podiumBonus: 675, championshipBonus: 9200 },
      elite: { monthly: 7000, winBonus: 3200, podiumBonus: 1600, championshipBonus: 21500 }
    },
    requirements: {
      minReputation: 2,
      minMarketability: 4
    },
    priority: { primary: 'media', weight: 1 },
    expectations: {
      requiredShoutouts: 2,
      preferredImageStyle: 'edgy'
    }
  },
  {
    id: 'helmet-graphics',
    name: 'Custom Lid Designs',
    category: 'local',
    tier: 'entry',
    description: 'Helmet painting and graphics shop',
    country: 'Regional',
    paymentTiers: {
      entry: { monthly: 700, winBonus: 350, podiumBonus: 175, championshipBonus: 2600 },
      mid: { monthly: 2500, winBonus: 1100, podiumBonus: 550, championshipBonus: 7600 },
      elite: { monthly: 6000, winBonus: 2700, podiumBonus: 1350, championshipBonus: 18500 }
    },
    requirements: {
      minReputation: 2,
      minMarketability: 3
    },
    priority: { primary: 'media', weight: 1 },
    expectations: {
      requiredShoutouts: 1,
      preferredImageStyle: 'edgy'
    }
  },
  {
    id: 'local-gym',
    name: 'FitRacer Performance Gym',
    category: 'local',
    tier: 'entry',
    description: 'Fitness center specializing in motorsport athletes',
    country: 'Regional',
    paymentTiers: {
      entry: { monthly: 1100, winBonus: 550, podiumBonus: 275, championshipBonus: 4100 },
      mid: { monthly: 4200, winBonus: 1900, podiumBonus: 950, championshipBonus: 13000 },
      elite: { monthly: 9500, winBonus: 4300, podiumBonus: 2150, championshipBonus: 29000 }
    },
    requirements: {
      minReputation: 5,
      minMarketability: 7
    },
    priority: { primary: 'performance', secondary: 'media', weight: 1 },
    expectations: {
      requiredShoutouts: 2,
      preferredImageStyle: 'edgy'
    }
  },

  // ============================================
  // ADDITIONAL SPONSORS - BEVERAGES
  // ============================================
  {
    id: 'coca-cola',
    name: 'Coca-Cola',
    category: 'lifestyle',
    tier: 'elite',
    description: 'Real magic on the race track',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 15000, winBonus: 8000, podiumBonus: 4000, championshipBonus: 62000 },
      mid: { monthly: 80000, winBonus: 40000, podiumBonus: 20000, championshipBonus: 245000 },
      elite: { monthly: 325000, winBonus: 132000, podiumBonus: 66000, championshipBonus: 1000000 }
    },
    requirements: {
      minReputation: 70,
      minMarketability: 72,
      minWins: 6,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'events', secondary: 'media', weight: 5 },
    expectations: {
      minSeasonWins: 4,
      minSeasonPodiums: 10,
      championshipTarget: 'top3',
      maxDNFs: 2,
      requiredShoutouts: 10,
      requiredInterviews: 4,
      minFollowers: 300000,
      requiredEvents: 6,
      productLaunches: 3,
      preferredImageStyle: 'professional',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['nascar', 'formula']
  },
  {
    id: 'pepsi',
    name: 'Pepsi',
    category: 'lifestyle',
    tier: 'elite',
    description: 'For the love of racing',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 13800, winBonus: 7400, podiumBonus: 3700, championshipBonus: 57000 },
      mid: { monthly: 74000, winBonus: 37000, podiumBonus: 18500, championshipBonus: 225000 },
      elite: { monthly: 300000, winBonus: 120000, podiumBonus: 60000, championshipBonus: 920000 }
    },
    requirements: {
      minReputation: 68,
      minMarketability: 70,
      minWins: 5,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'media', secondary: 'events', weight: 5 },
    expectations: {
      minSeasonWins: 3,
      minSeasonPodiums: 8,
      championshipTarget: 'top3',
      maxDNFs: 3,
      requiredShoutouts: 8,
      requiredInterviews: 3,
      minFollowers: 200000,
      viralPostBonus: true,
      requiredEvents: 5,
      productLaunches: 2,
      preferredImageStyle: 'edgy',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['nascar', 'indycar']
  },
  {
    id: 'gatorade',
    name: 'Gatorade',
    category: 'lifestyle',
    tier: 'high',
    description: 'Win from within - sports hydration leader',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 7400, winBonus: 4000, podiumBonus: 2000, championshipBonus: 30000 },
      mid: { monthly: 38000, winBonus: 19000, podiumBonus: 9500, championshipBonus: 116000 },
      elite: { monthly: 112000, winBonus: 50000, podiumBonus: 25000, championshipBonus: 345000 }
    },
    requirements: {
      minReputation: 42,
      minMarketability: 48
    },
    priority: { primary: 'performance', secondary: 'media', weight: 3 },
    expectations: {
      minSeasonPodiums: 3,
      requiredShoutouts: 5,
      requiredInterviews: 1,
      minFollowers: 30000,
      requiredEvents: 2,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['USA']
  },

  // ============================================
  // ADDITIONAL SPONSORS - AIRLINES & TRAVEL
  // ============================================
  {
    id: 'qatar-airways',
    name: 'Qatar Airways',
    category: 'financial',
    tier: 'elite',
    description: 'Going places together - premium airline',
    country: 'Qatar',
    paymentTiers: {
      entry: { monthly: 16000, winBonus: 8500, podiumBonus: 4250, championshipBonus: 66000 },
      mid: { monthly: 85000, winBonus: 42500, podiumBonus: 21250, championshipBonus: 260000 },
      elite: { monthly: 365000, winBonus: 145000, podiumBonus: 72500, championshipBonus: 1130000 }
    },
    requirements: {
      minReputation: 70,
      minMarketability: 65,
      minWins: 5,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'events', weight: 5 },
    expectations: {
      minSeasonWins: 3,
      minSeasonPodiums: 8,
      championshipTarget: 'top3',
      maxDNFs: 2,
      requiredShoutouts: 6,
      requiredInterviews: 3,
      minFollowers: 150000,
      requiredEvents: 5,
      preferredImageStyle: 'professional',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['Qatar'],
    seriesBonus: ['formula']
  },
  {
    id: 'etihad',
    name: 'Etihad Airways',
    category: 'financial',
    tier: 'elite',
    description: 'Choose well - luxury aviation partner',
    country: 'UAE',
    paymentTiers: {
      entry: { monthly: 14200, winBonus: 7600, podiumBonus: 3800, championshipBonus: 59000 },
      mid: { monthly: 76000, winBonus: 38000, podiumBonus: 19000, championshipBonus: 232000 },
      elite: { monthly: 320000, winBonus: 128000, podiumBonus: 64000, championshipBonus: 990000 }
    },
    requirements: {
      minReputation: 66,
      minMarketability: 62,
      minWins: 4,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'media', weight: 4 },
    expectations: {
      minSeasonWins: 2,
      minSeasonPodiums: 6,
      championshipTarget: 'top5',
      maxDNFs: 3,
      requiredShoutouts: 5,
      requiredInterviews: 2,
      minFollowers: 120000,
      requiredEvents: 4,
      preferredImageStyle: 'professional',
      noControversyClause: true
    },
    nationalityBonus: ['UAE'],
    seriesBonus: ['formula']
  },
  {
    id: 'hilton',
    name: 'Hilton Hotels',
    category: 'financial',
    tier: 'high',
    description: 'Be our guest - hospitality partner',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 8400, winBonus: 4500, podiumBonus: 2250, championshipBonus: 34000 },
      mid: { monthly: 44000, winBonus: 22000, podiumBonus: 11000, championshipBonus: 134000 },
      elite: { monthly: 138000, winBonus: 60000, podiumBonus: 30000, championshipBonus: 425000 }
    },
    requirements: {
      minReputation: 50,
      minMarketability: 52,
      seriesTiers: ['semi-pro', 'pro', 'elite']
    },
    priority: { primary: 'events', secondary: 'brand_alignment', weight: 3 },
    expectations: {
      minSeasonPodiums: 3,
      requiredShoutouts: 4,
      requiredInterviews: 2,
      requiredEvents: 3,
      preferredImageStyle: 'professional',
      noControversyClause: true
    },
    nationalityBonus: ['USA']
  },
  {
    id: 'marriott',
    name: 'Marriott',
    category: 'financial',
    tier: 'high',
    description: 'Where can we take you - global hospitality',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 7900, winBonus: 4200, podiumBonus: 2100, championshipBonus: 32000 },
      mid: { monthly: 42000, winBonus: 21000, podiumBonus: 10500, championshipBonus: 128000 },
      elite: { monthly: 132000, winBonus: 58000, podiumBonus: 29000, championshipBonus: 405000 }
    },
    requirements: {
      minReputation: 48,
      minMarketability: 50,
      seriesTiers: ['semi-pro', 'pro', 'elite']
    },
    priority: { primary: 'events', secondary: 'media', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 3,
      requiredInterviews: 1,
      requiredEvents: 3,
      preferredImageStyle: 'professional'
    },
    nationalityBonus: ['USA']
  },

  // ============================================
  // ADDITIONAL SPONSORS - TECH GIANTS
  // ============================================
  {
    id: 'microsoft',
    name: 'Microsoft',
    category: 'tech_gaming',
    tier: 'elite',
    description: 'Empowering every racer on the planet',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 10500, winBonus: 5800, podiumBonus: 2900, championshipBonus: 44000 },
      mid: { monthly: 58000, winBonus: 29000, podiumBonus: 14500, championshipBonus: 178000 },
      elite: { monthly: 195000, winBonus: 82000, podiumBonus: 41000, championshipBonus: 600000 }
    },
    requirements: {
      minReputation: 58,
      minMarketability: 55,
      minWins: 3,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'media', weight: 4 },
    expectations: {
      minSeasonWins: 2,
      minSeasonPodiums: 5,
      championshipTarget: 'top5',
      maxDNFs: 4,
      requiredShoutouts: 5,
      requiredInterviews: 2,
      minFollowers: 80000,
      requiredEvents: 3,
      productLaunches: 1,
      preferredImageStyle: 'technical',
      noControversyClause: true
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['formula']
  },
  {
    id: 'google',
    name: 'Google',
    category: 'tech_gaming',
    tier: 'elite',
    description: 'Organizing the worlds racing data',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 11500, winBonus: 6300, podiumBonus: 3150, championshipBonus: 48000 },
      mid: { monthly: 63000, winBonus: 31500, podiumBonus: 15750, championshipBonus: 192000 },
      elite: { monthly: 215000, winBonus: 90000, podiumBonus: 45000, championshipBonus: 660000 }
    },
    requirements: {
      minReputation: 60,
      minMarketability: 58,
      minWins: 4,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'media', secondary: 'brand_alignment', weight: 5 },
    expectations: {
      minSeasonWins: 2,
      minSeasonPodiums: 6,
      championshipTarget: 'top3',
      maxDNFs: 3,
      requiredShoutouts: 6,
      requiredInterviews: 2,
      minFollowers: 150000,
      viralPostBonus: true,
      requiredEvents: 3,
      productLaunches: 2,
      preferredImageStyle: 'technical',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['formula']
  },
  {
    id: 'oracle',
    name: 'Oracle',
    category: 'tech_gaming',
    tier: 'elite',
    description: 'Cloud technology for racing analytics',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 12800, winBonus: 6800, podiumBonus: 3400, championshipBonus: 53000 },
      mid: { monthly: 68000, winBonus: 34000, podiumBonus: 17000, championshipBonus: 208000 },
      elite: { monthly: 280000, winBonus: 115000, podiumBonus: 57500, championshipBonus: 860000 }
    },
    requirements: {
      minReputation: 65,
      minMarketability: 60,
      minWins: 5,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'performance', weight: 5 },
    expectations: {
      minSeasonWins: 3,
      minSeasonPodiums: 8,
      championshipTarget: 'top3',
      maxDNFs: 2,
      requiredShoutouts: 6,
      requiredInterviews: 3,
      minFollowers: 120000,
      requiredEvents: 4,
      productLaunches: 2,
      preferredImageStyle: 'technical',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['USA'],
    manufacturerBonus: ['red-bull'],
    seriesBonus: ['formula']
  },
  {
    id: 'hp',
    name: 'HP Inc.',
    category: 'tech_gaming',
    tier: 'high',
    description: 'Technology partner for modern racing',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 6800, winBonus: 3700, podiumBonus: 1850, championshipBonus: 27000 },
      mid: { monthly: 36000, winBonus: 18000, podiumBonus: 9000, championshipBonus: 110000 },
      elite: { monthly: 100000, winBonus: 45000, podiumBonus: 22500, championshipBonus: 305000 }
    },
    requirements: {
      minReputation: 40,
      minMarketability: 42,
      minRaces: 12
    },
    priority: { primary: 'brand_alignment', secondary: 'media', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 4,
      requiredInterviews: 1,
      minFollowers: 30000,
      requiredEvents: 2,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['formula']
  },

  // ============================================
  // ADDITIONAL SPONSORS - MORE AUTOMOTIVE BRANDS
  // ============================================
  {
    id: 'magneti-marelli',
    name: 'Magneti Marelli',
    category: 'automotive',
    tier: 'high',
    description: 'Italian automotive electronics excellence',
    country: 'Italy',
    paymentTiers: {
      entry: { monthly: 6100, winBonus: 3400, podiumBonus: 1700, championshipBonus: 24000 },
      mid: { monthly: 32000, winBonus: 16000, podiumBonus: 8000, championshipBonus: 98000 },
      elite: { monthly: 90000, winBonus: 40000, podiumBonus: 20000, championshipBonus: 275000 }
    },
    requirements: {
      minReputation: 38,
      minMarketability: 32,
      seriesTiers: ['semi-pro', 'pro', 'elite']
    },
    priority: { primary: 'performance', secondary: 'brand_alignment', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 3,
      requiredEvents: 1,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['Italy'],
    seriesBonus: ['formula', 'gt3']
  },
  {
    id: 'sachs',
    name: 'ZF Sachs',
    category: 'automotive',
    tier: 'mid',
    description: 'German clutch and damper technology',
    country: 'Germany',
    paymentTiers: {
      entry: { monthly: 3800, winBonus: 2100, podiumBonus: 1050, championshipBonus: 14000 },
      mid: { monthly: 19500, winBonus: 9750, podiumBonus: 4875, championshipBonus: 60000 },
      elite: { monthly: 53000, winBonus: 24000, podiumBonus: 12000, championshipBonus: 162000 }
    },
    requirements: {
      minReputation: 24,
      minMarketability: 22
    },
    priority: { primary: 'performance', weight: 2 },
    expectations: {
      minSeasonPodiums: 1,
      requiredShoutouts: 2,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['Germany'],
    seriesBonus: ['dtm', 'touring']
  },
  {
    id: 'ohlins',
    name: 'Ohlins',
    category: 'automotive',
    tier: 'high',
    description: 'Swedish suspension technology for winners',
    country: 'Sweden',
    paymentTiers: {
      entry: { monthly: 5500, winBonus: 3000, podiumBonus: 1500, championshipBonus: 21000 },
      mid: { monthly: 28500, winBonus: 14250, podiumBonus: 7125, championshipBonus: 87000 },
      elite: { monthly: 79000, winBonus: 36000, podiumBonus: 18000, championshipBonus: 242000 }
    },
    requirements: {
      minReputation: 35,
      minMarketability: 30
    },
    priority: { primary: 'performance', secondary: 'brand_alignment', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 3,
      requiredEvents: 1,
      preferredImageStyle: 'technical',
      noControversyClause: true
    },
    nationalityBonus: ['Sweden'],
    seriesBonus: ['motogp', 'gt3', 'superbike']
  },
  {
    id: 'endless-brakes',
    name: 'Endless Brakes',
    category: 'automotive',
    tier: 'mid',
    description: 'Japanese braking technology for motorsport',
    country: 'Japan',
    paymentTiers: {
      entry: { monthly: 3600, winBonus: 2000, podiumBonus: 1000, championshipBonus: 13500 },
      mid: { monthly: 18000, winBonus: 9000, podiumBonus: 4500, championshipBonus: 55000 },
      elite: { monthly: 48500, winBonus: 22000, podiumBonus: 11000, championshipBonus: 148000 }
    },
    requirements: {
      minReputation: 22,
      minMarketability: 20
    },
    priority: { primary: 'performance', weight: 2 },
    expectations: {
      minSeasonPodiums: 1,
      requiredShoutouts: 2,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['Japan'],
    seriesBonus: ['super_gt', 'drift', 'time_attack']
  },

  // ============================================
  // ADDITIONAL SPONSORS - CLOTHING/APPAREL
  // ============================================
  {
    id: 'new-balance',
    name: 'New Balance',
    category: 'lifestyle',
    tier: 'mid',
    description: 'Fearlessly independent since 1906',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 4400, winBonus: 2400, podiumBonus: 1200, championshipBonus: 17000 },
      mid: { monthly: 22000, winBonus: 11000, podiumBonus: 5500, championshipBonus: 67000 },
      elite: { monthly: 59000, winBonus: 27000, podiumBonus: 13500, championshipBonus: 180000 }
    },
    requirements: {
      minReputation: 26,
      minMarketability: 34
    },
    priority: { primary: 'media', secondary: 'performance', weight: 2 },
    expectations: {
      minSeasonPodiums: 1,
      requiredShoutouts: 4,
      minFollowers: 15000,
      preferredImageStyle: 'professional'
    },
    nationalityBonus: ['USA']
  },
  {
    id: 'reebok',
    name: 'Reebok',
    category: 'lifestyle',
    tier: 'mid',
    description: 'Sport the unexpected',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 4200, winBonus: 2300, podiumBonus: 1150, championshipBonus: 16000 },
      mid: { monthly: 21000, winBonus: 10500, podiumBonus: 5250, championshipBonus: 64000 },
      elite: { monthly: 57000, winBonus: 26000, podiumBonus: 13000, championshipBonus: 175000 }
    },
    requirements: {
      minReputation: 25,
      minMarketability: 32
    },
    priority: { primary: 'media', secondary: 'events', weight: 2 },
    expectations: {
      minSeasonPodiums: 1,
      requiredShoutouts: 3,
      minFollowers: 12000,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['USA', 'UK']
  },
  {
    id: 'lacoste',
    name: 'Lacoste',
    category: 'lifestyle',
    tier: 'high',
    description: 'French elegance meets sporting excellence',
    country: 'France',
    paymentTiers: {
      entry: { monthly: 6500, winBonus: 3600, podiumBonus: 1800, championshipBonus: 26000 },
      mid: { monthly: 34000, winBonus: 17000, podiumBonus: 8500, championshipBonus: 104000 },
      elite: { monthly: 96000, winBonus: 43000, podiumBonus: 21500, championshipBonus: 295000 }
    },
    requirements: {
      minReputation: 38,
      minMarketability: 46
    },
    priority: { primary: 'brand_alignment', secondary: 'events', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 4,
      requiredInterviews: 1,
      minFollowers: 25000,
      requiredEvents: 2,
      preferredImageStyle: 'professional',
      noControversyClause: true
    },
    nationalityBonus: ['France']
  },

  // ============================================
  // ADDITIONAL SPONSORS - MORE WATCHES
  // ============================================
  {
    id: 'cartier',
    name: 'Cartier',
    category: 'watches',
    tier: 'elite',
    description: 'The jeweler of kings, king of jewelers',
    country: 'France',
    paymentTiers: {
      entry: { monthly: 21000, winBonus: 11000, podiumBonus: 5500, championshipBonus: 88000 },
      mid: { monthly: 115000, winBonus: 57500, podiumBonus: 28750, championshipBonus: 350000 },
      elite: { monthly: 480000, winBonus: 195000, podiumBonus: 97500, championshipBonus: 1500000 }
    },
    requirements: {
      minReputation: 78,
      minMarketability: 75,
      minChampionships: 1,
      minWins: 8,
      seriesTiers: ['elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'events', weight: 5 },
    expectations: {
      minSeasonWins: 4,
      minSeasonPodiums: 10,
      championshipTarget: 'top3',
      maxDNFs: 2,
      requiredShoutouts: 8,
      requiredInterviews: 4,
      minFollowers: 200000,
      requiredEvents: 6,
      productLaunches: 2,
      preferredImageStyle: 'professional',
      noControversyClause: true,
      exclusiveCategoryClause: true,
      rivalExclusivity: []
    },
    nationalityBonus: ['France'],
    seriesBonus: ['formula']
  },
  {
    id: 'patek-philippe',
    name: 'Patek Philippe',
    category: 'watches',
    tier: 'elite',
    description: 'You never actually own a Patek Philippe',
    country: 'Switzerland',
    paymentTiers: {
      entry: { monthly: 23000, winBonus: 12000, podiumBonus: 6000, championshipBonus: 95000 },
      mid: { monthly: 125000, winBonus: 62500, podiumBonus: 31250, championshipBonus: 385000 },
      elite: { monthly: 530000, winBonus: 215000, podiumBonus: 107500, championshipBonus: 1650000 }
    },
    requirements: {
      minReputation: 82,
      minMarketability: 80,
      minChampionships: 1,
      minWins: 10,
      seriesTiers: ['elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'events', weight: 5 },
    expectations: {
      minSeasonWins: 5,
      minSeasonPodiums: 12,
      championshipTarget: 'win',
      maxDNFs: 1,
      requiredShoutouts: 6,
      requiredInterviews: 4,
      minFollowers: 300000,
      requiredEvents: 5,
      productLaunches: 2,
      preferredImageStyle: 'professional',
      noControversyClause: true,
      exclusiveCategoryClause: true,
      rivalExclusivity: []
    },
    seriesBonus: ['formula']
  },
  {
    id: 'tudor',
    name: 'Tudor',
    category: 'watches',
    tier: 'high',
    description: 'Born to dare - Rolex sister brand',
    country: 'Switzerland',
    paymentTiers: {
      entry: { monthly: 7800, winBonus: 4200, podiumBonus: 2100, championshipBonus: 32000 },
      mid: { monthly: 42000, winBonus: 21000, podiumBonus: 10500, championshipBonus: 128000 },
      elite: { monthly: 132000, winBonus: 58000, podiumBonus: 29000, championshipBonus: 405000 }
    },
    requirements: {
      minReputation: 46,
      minMarketability: 44,
      minPodiums: 4,
      seriesTiers: ['semi-pro', 'pro', 'elite']
    },
    priority: { primary: 'events', secondary: 'performance', weight: 4 },
    expectations: {
      minSeasonPodiums: 4,
      championshipTarget: 'top5',
      maxDNFs: 4,
      requiredShoutouts: 4,
      requiredInterviews: 2,
      minFollowers: 50000,
      requiredEvents: 3,
      preferredImageStyle: 'professional',
      noControversyClause: true
    },
    seriesBonus: ['lmp', 'hypercar']
  },

  // ============================================
  // ADDITIONAL SPONSORS - MORE TECH
  // ============================================
  {
    id: 'thrustmaster',
    name: 'Thrustmaster',
    category: 'tech_gaming',
    tier: 'entry',
    description: 'Precision sim racing hardware',
    country: 'France',
    paymentTiers: {
      entry: { monthly: 2400, winBonus: 1300, podiumBonus: 650, championshipBonus: 9000 },
      mid: { monthly: 12000, winBonus: 6000, podiumBonus: 3000, championshipBonus: 36000 },
      elite: { monthly: 30000, winBonus: 13500, podiumBonus: 6750, championshipBonus: 92000 }
    },
    requirements: {
      minReputation: 10,
      minMarketability: 18
    },
    priority: { primary: 'media', weight: 2 },
    expectations: {
      requiredShoutouts: 3,
      viralPostBonus: true,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['France'],
    seriesBonus: ['gt4']
  },
  {
    id: 'simucube',
    name: 'Simucube',
    category: 'tech_gaming',
    tier: 'mid',
    description: 'Professional direct drive sim racing',
    country: 'Finland',
    paymentTiers: {
      entry: { monthly: 4700, winBonus: 2600, podiumBonus: 1300, championshipBonus: 18000 },
      mid: { monthly: 24000, winBonus: 12000, podiumBonus: 6000, championshipBonus: 73000 },
      elite: { monthly: 63000, winBonus: 28500, podiumBonus: 14250, championshipBonus: 192000 }
    },
    requirements: {
      minReputation: 22,
      minMarketability: 30
    },
    priority: { primary: 'media', secondary: 'events', weight: 3 },
    expectations: {
      requiredShoutouts: 5,
      minFollowers: 10000,
      viralPostBonus: true,
      requiredEvents: 1,
      productLaunches: 1,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['Finland'],
    seriesBonus: ['gt3']
  },
  {
    id: 'asetek',
    name: 'Asetek SimSports',
    category: 'tech_gaming',
    tier: 'mid',
    description: 'Premium sim racing pedals and wheels',
    country: 'Denmark',
    paymentTiers: {
      entry: { monthly: 4000, winBonus: 2200, podiumBonus: 1100, championshipBonus: 15000 },
      mid: { monthly: 20000, winBonus: 10000, podiumBonus: 5000, championshipBonus: 61000 },
      elite: { monthly: 55000, winBonus: 25000, podiumBonus: 12500, championshipBonus: 168000 }
    },
    requirements: {
      minReputation: 18,
      minMarketability: 25
    },
    priority: { primary: 'media', weight: 2 },
    expectations: {
      requiredShoutouts: 4,
      viralPostBonus: true,
      requiredEvents: 1,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['Denmark'],
    seriesBonus: ['gt3', 'gt4']
  },

  // ============================================
  // ADDITIONAL SPONSORS - MORE ENERGY
  // ============================================
  {
    id: 'c4-energy',
    name: 'C4 Energy',
    category: 'energy_drinks',
    tier: 'entry',
    description: 'Explosive energy for explosive performance',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 2400, winBonus: 1400, podiumBonus: 700, championshipBonus: 9000 },
      mid: { monthly: 12000, winBonus: 6000, podiumBonus: 3000, championshipBonus: 36000 },
      elite: { monthly: 32000, winBonus: 14500, podiumBonus: 7250, championshipBonus: 98000 }
    },
    requirements: {
      minReputation: 14,
      minMarketability: 20
    },
    priority: { primary: 'media', weight: 2 },
    expectations: {
      requiredShoutouts: 3,
      viralPostBonus: true,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['USA']
  },
  {
    id: 'bang-energy',
    name: 'Bang Energy',
    category: 'energy_drinks',
    tier: 'mid',
    description: 'Potent brain and body fuel',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 3700, winBonus: 2100, podiumBonus: 1050, championshipBonus: 14000 },
      mid: { monthly: 19000, winBonus: 9500, podiumBonus: 4750, championshipBonus: 58000 },
      elite: { monthly: 51000, winBonus: 23000, podiumBonus: 11500, championshipBonus: 155000 }
    },
    requirements: {
      minReputation: 20,
      minMarketability: 28
    },
    priority: { primary: 'media', secondary: 'performance', weight: 3 },
    expectations: {
      minSeasonPodiums: 1,
      requiredShoutouts: 5,
      minFollowers: 8000,
      viralPostBonus: true,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['mma', 'crossfit']
  },

  // ============================================
  // ADDITIONAL SPONSORS - MORE OIL/FUEL
  // ============================================
  {
    id: 'elf-oils',
    name: 'Elf',
    category: 'oil_fuel',
    tier: 'high',
    description: 'French lubricants with F1 heritage',
    country: 'France',
    paymentTiers: {
      entry: { monthly: 6500, winBonus: 3600, podiumBonus: 1800, championshipBonus: 26000 },
      mid: { monthly: 34000, winBonus: 17000, podiumBonus: 8500, championshipBonus: 104000 },
      elite: { monthly: 96000, winBonus: 43000, podiumBonus: 21500, championshipBonus: 295000 }
    },
    requirements: {
      minReputation: 38,
      minMarketability: 34,
      minRaces: 12
    },
    priority: { primary: 'performance', secondary: 'brand_alignment', weight: 3 },
    expectations: {
      minSeasonPodiums: 3,
      requiredShoutouts: 3,
      requiredEvents: 1,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['France'],
    manufacturerBonus: ['renault', 'alpine'],
    seriesBonus: ['formula']
  },
  {
    id: 'liqui-moly',
    name: 'Liqui Moly',
    category: 'oil_fuel',
    tier: 'mid',
    description: 'German oil technology for every engine',
    country: 'Germany',
    paymentTiers: {
      entry: { monthly: 4400, winBonus: 2400, podiumBonus: 1200, championshipBonus: 17000 },
      mid: { monthly: 22000, winBonus: 11000, podiumBonus: 5500, championshipBonus: 67000 },
      elite: { monthly: 61000, winBonus: 28000, podiumBonus: 14000, championshipBonus: 187000 }
    },
    requirements: {
      minReputation: 25,
      minMarketability: 26
    },
    priority: { primary: 'performance', secondary: 'media', weight: 2 },
    expectations: {
      minSeasonPodiums: 1,
      requiredShoutouts: 3,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['Germany'],
    seriesBonus: ['touring', 'dtm']
  },

  // ============================================
  // ADDITIONAL SPONSORS - FOOD/CONSUMER GOODS
  // ============================================
  {
    id: 'red-bull-simply-cola',
    name: 'Peroni',
    category: 'lifestyle',
    tier: 'mid',
    description: 'Italian beer brand (0.0 racing partnership)',
    country: 'Italy',
    paymentTiers: {
      entry: { monthly: 4700, winBonus: 2600, podiumBonus: 1300, championshipBonus: 18000 },
      mid: { monthly: 24000, winBonus: 12000, podiumBonus: 6000, championshipBonus: 73000 },
      elite: { monthly: 65000, winBonus: 30000, podiumBonus: 15000, championshipBonus: 200000 }
    },
    requirements: {
      minReputation: 30,
      minMarketability: 35
    },
    priority: { primary: 'events', secondary: 'media', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 4,
      requiredEvents: 2,
      preferredImageStyle: 'professional',
      noControversyClause: true
    },
    nationalityBonus: ['Italy'],
    manufacturerBonus: ['ferrari', 'aston-martin']
  },
  {
    id: 'pirelli-pzero',
    name: 'Lavazza',
    category: 'lifestyle',
    tier: 'high',
    description: 'Italian coffee excellence - official F1 partner',
    country: 'Italy',
    paymentTiers: {
      entry: { monthly: 6300, winBonus: 3500, podiumBonus: 1750, championshipBonus: 25000 },
      mid: { monthly: 33000, winBonus: 16500, podiumBonus: 8250, championshipBonus: 100000 },
      elite: { monthly: 94000, winBonus: 42000, podiumBonus: 21000, championshipBonus: 288000 }
    },
    requirements: {
      minReputation: 40,
      minMarketability: 42
    },
    priority: { primary: 'events', secondary: 'brand_alignment', weight: 3 },
    expectations: {
      minSeasonPodiums: 3,
      requiredShoutouts: 4,
      requiredInterviews: 1,
      requiredEvents: 3,
      preferredImageStyle: 'professional',
      noControversyClause: true
    },
    nationalityBonus: ['Italy'],
    seriesBonus: ['formula']
  },

  // ============================================
  // ADDITIONAL SPONSORS - TELECOMMUNICATIONS
  // ============================================
  {
    id: 'vodafone',
    name: 'Vodafone',
    category: 'tech_gaming',
    tier: 'elite',
    description: 'The future is exciting - ready?',
    country: 'UK',
    paymentTiers: {
      entry: { monthly: 10000, winBonus: 5500, podiumBonus: 2750, championshipBonus: 42000 },
      mid: { monthly: 53000, winBonus: 26500, podiumBonus: 13250, championshipBonus: 162000 },
      elite: { monthly: 182000, winBonus: 78000, podiumBonus: 39000, championshipBonus: 560000 }
    },
    requirements: {
      minReputation: 56,
      minMarketability: 52,
      minWins: 3,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'media', weight: 4 },
    expectations: {
      minSeasonWins: 2,
      minSeasonPodiums: 5,
      championshipTarget: 'top5',
      maxDNFs: 4,
      requiredShoutouts: 5,
      requiredInterviews: 2,
      minFollowers: 80000,
      requiredEvents: 3,
      preferredImageStyle: 'technical',
      noControversyClause: true
    },
    nationalityBonus: ['UK'],
    manufacturerBonus: ['mclaren'],
    seriesBonus: ['formula']
  },
  {
    id: 't-mobile',
    name: 'T-Mobile',
    category: 'tech_gaming',
    tier: 'high',
    description: 'Uncarrier - breaking the rules',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 7300, winBonus: 4000, podiumBonus: 2000, championshipBonus: 29000 },
      mid: { monthly: 38000, winBonus: 19000, podiumBonus: 9500, championshipBonus: 116000 },
      elite: { monthly: 116000, winBonus: 52000, podiumBonus: 26000, championshipBonus: 355000 }
    },
    requirements: {
      minReputation: 44,
      minMarketability: 45
    },
    priority: { primary: 'media', secondary: 'events', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 5,
      minFollowers: 40000,
      viralPostBonus: true,
      requiredEvents: 2,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['USA', 'Germany']
  },

  // ============================================
  // ADDITIONAL SPONSORS - INSURANCE
  // ============================================
  {
    id: 'axa',
    name: 'AXA',
    category: 'financial',
    tier: 'high',
    description: 'Know you can - global insurance leader',
    country: 'France',
    paymentTiers: {
      entry: { monthly: 7100, winBonus: 3900, podiumBonus: 1950, championshipBonus: 28000 },
      mid: { monthly: 38000, winBonus: 19000, podiumBonus: 9500, championshipBonus: 116000 },
      elite: { monthly: 120000, winBonus: 54000, podiumBonus: 27000, championshipBonus: 370000 }
    },
    requirements: {
      minReputation: 44,
      minMarketability: 40,
      seriesTiers: ['semi-pro', 'pro', 'elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'events', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 3,
      requiredInterviews: 1,
      requiredEvents: 2,
      preferredImageStyle: 'professional',
      noControversyClause: true
    },
    nationalityBonus: ['France']
  },
  {
    id: 'zurich',
    name: 'Zurich Insurance',
    category: 'financial',
    tier: 'high',
    description: 'For those who truly love motorsport',
    country: 'Switzerland',
    paymentTiers: {
      entry: { monthly: 7500, winBonus: 4100, podiumBonus: 2050, championshipBonus: 30000 },
      mid: { monthly: 40000, winBonus: 20000, podiumBonus: 10000, championshipBonus: 122000 },
      elite: { monthly: 126000, winBonus: 56000, podiumBonus: 28000, championshipBonus: 388000 }
    },
    requirements: {
      minReputation: 46,
      minMarketability: 42,
      seriesTiers: ['semi-pro', 'pro', 'elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'media', weight: 3 },
    expectations: {
      minSeasonPodiums: 3,
      requiredShoutouts: 3,
      requiredInterviews: 1,
      requiredEvents: 2,
      preferredImageStyle: 'professional',
      noControversyClause: true
    },
    nationalityBonus: ['Switzerland']
  },

  // ============================================
  // ADDITIONAL SPONSORS - LUXURY CAR BRANDS (for manufacturer bonuses)
  // ============================================
  {
    id: 'porsche-design',
    name: 'Porsche Design',
    category: 'lifestyle',
    tier: 'elite',
    description: 'Spirit of the 911 in everyday excellence',
    country: 'Germany',
    paymentTiers: {
      entry: { monthly: 11500, winBonus: 6300, podiumBonus: 3150, championshipBonus: 48000 },
      mid: { monthly: 61000, winBonus: 30500, podiumBonus: 15250, championshipBonus: 186000 },
      elite: { monthly: 205000, winBonus: 86000, podiumBonus: 43000, championshipBonus: 630000 }
    },
    requirements: {
      minReputation: 60,
      minMarketability: 58,
      minWins: 4,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'events', weight: 5 },
    expectations: {
      minSeasonWins: 2,
      minSeasonPodiums: 6,
      championshipTarget: 'top5',
      maxDNFs: 3,
      requiredShoutouts: 5,
      requiredInterviews: 2,
      minFollowers: 80000,
      requiredEvents: 3,
      productLaunches: 1,
      preferredImageStyle: 'professional',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['Germany'],
    manufacturerBonus: ['porsche'],
    seriesBonus: ['gt3', 'lmp']
  },
  {
    id: 'ferrari-store',
    name: 'Ferrari Lifestyle',
    category: 'lifestyle',
    tier: 'elite',
    description: 'The Prancing Horse lifestyle collection',
    country: 'Italy',
    paymentTiers: {
      entry: { monthly: 12800, winBonus: 6800, podiumBonus: 3400, championshipBonus: 53000 },
      mid: { monthly: 68000, winBonus: 34000, podiumBonus: 17000, championshipBonus: 208000 },
      elite: { monthly: 235000, winBonus: 98000, podiumBonus: 49000, championshipBonus: 725000 }
    },
    requirements: {
      minReputation: 65,
      minMarketability: 62,
      minWins: 5,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'events', weight: 5 },
    expectations: {
      minSeasonWins: 3,
      minSeasonPodiums: 8,
      championshipTarget: 'top3',
      maxDNFs: 2,
      requiredShoutouts: 6,
      requiredInterviews: 3,
      minFollowers: 120000,
      requiredEvents: 4,
      productLaunches: 2,
      preferredImageStyle: 'professional',
      noControversyClause: true,
      exclusiveCategoryClause: true,
      rivalExclusivity: []
    },
    nationalityBonus: ['Italy'],
    manufacturerBonus: ['ferrari'],
    seriesBonus: ['formula', 'gt3']
  },

  // ============================================
  // FINAL BATCH - REACHING 150+ SPONSORS
  // ============================================
  {
    id: 'aramco',
    name: 'Aramco',
    category: 'oil_fuel',
    tier: 'elite',
    description: 'Saudi energy giant - major F1 sponsor',
    country: 'Saudi Arabia',
    paymentTiers: {
      entry: { monthly: 17000, winBonus: 9000, podiumBonus: 4500, championshipBonus: 72000 },
      mid: { monthly: 90000, winBonus: 45000, podiumBonus: 22500, championshipBonus: 275000 },
      elite: { monthly: 400000, winBonus: 160000, podiumBonus: 80000, championshipBonus: 1240000 }
    },
    requirements: {
      minReputation: 72,
      minMarketability: 68,
      minWins: 6,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'events', weight: 5 },
    expectations: {
      minSeasonWins: 4,
      minSeasonPodiums: 10,
      championshipTarget: 'top3',
      maxDNFs: 2,
      requiredShoutouts: 8,
      requiredInterviews: 4,
      minFollowers: 200000,
      requiredEvents: 5,
      productLaunches: 2,
      preferredImageStyle: 'professional',
      noControversyClause: true,
      exclusiveCategoryClause: true
    },
    nationalityBonus: ['Saudi Arabia'],
    manufacturerBonus: ['aston-martin'],
    seriesBonus: ['formula']
  },
  {
    id: 'lenovo',
    name: 'Lenovo',
    category: 'tech_gaming',
    tier: 'high',
    description: 'Smarter technology for all',
    country: 'China',
    paymentTiers: {
      entry: { monthly: 7300, winBonus: 4000, podiumBonus: 2000, championshipBonus: 29000 },
      mid: { monthly: 38000, winBonus: 19000, podiumBonus: 9500, championshipBonus: 116000 },
      elite: { monthly: 112000, winBonus: 50000, podiumBonus: 25000, championshipBonus: 345000 }
    },
    requirements: {
      minReputation: 42,
      minMarketability: 40
    },
    priority: { primary: 'brand_alignment', secondary: 'media', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 4,
      requiredInterviews: 1,
      minFollowers: 30000,
      requiredEvents: 2,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['China'],
    seriesBonus: ['formula']
  },
  {
    id: 'snapdragon',
    name: 'Snapdragon (Qualcomm)',
    category: 'tech_gaming',
    tier: 'elite',
    description: 'Mobile processor technology meets racing',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 10500, winBonus: 5800, podiumBonus: 2900, championshipBonus: 44000 },
      mid: { monthly: 55000, winBonus: 27500, podiumBonus: 13750, championshipBonus: 168000 },
      elite: { monthly: 188000, winBonus: 80000, podiumBonus: 40000, championshipBonus: 580000 }
    },
    requirements: {
      minReputation: 55,
      minMarketability: 52,
      minWins: 3,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'brand_alignment', secondary: 'media', weight: 4 },
    expectations: {
      minSeasonWins: 2,
      minSeasonPodiums: 5,
      championshipTarget: 'top5',
      maxDNFs: 4,
      requiredShoutouts: 5,
      requiredInterviews: 2,
      minFollowers: 80000,
      requiredEvents: 3,
      productLaunches: 1,
      preferredImageStyle: 'technical',
      noControversyClause: true
    },
    nationalityBonus: ['USA'],
    manufacturerBonus: ['ferrari'],
    seriesBonus: ['formula']
  },
  {
    id: 'scale-ai',
    name: 'Scale AI',
    category: 'tech_gaming',
    tier: 'high',
    description: 'Accelerating AI development for racing analytics',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 6800, winBonus: 3700, podiumBonus: 1850, championshipBonus: 27000 },
      mid: { monthly: 36000, winBonus: 18000, podiumBonus: 9000, championshipBonus: 110000 },
      elite: { monthly: 104000, winBonus: 46000, podiumBonus: 23000, championshipBonus: 320000 }
    },
    requirements: {
      minReputation: 40,
      minMarketability: 38
    },
    priority: { primary: 'brand_alignment', secondary: 'media', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 4,
      requiredInterviews: 1,
      minFollowers: 25000,
      requiredEvents: 1,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['formula']
  },
  {
    id: 'pioneer',
    name: 'Pioneer',
    category: 'tech_gaming',
    tier: 'entry',
    description: 'Sound and vision innovation',
    country: 'Japan',
    paymentTiers: {
      entry: { monthly: 3000, winBonus: 1700, podiumBonus: 850, championshipBonus: 11000 },
      mid: { monthly: 15000, winBonus: 7500, podiumBonus: 3750, championshipBonus: 46000 },
      elite: { monthly: 40000, winBonus: 18000, podiumBonus: 9000, championshipBonus: 122000 }
    },
    requirements: {
      minReputation: 14,
      minMarketability: 18
    },
    priority: { primary: 'media', weight: 2 },
    expectations: {
      requiredShoutouts: 3,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['Japan']
  },
  {
    id: 'kenwood',
    name: 'Kenwood',
    category: 'tech_gaming',
    tier: 'entry',
    description: 'Communication and audio for motorsport',
    country: 'Japan',
    paymentTiers: {
      entry: { monthly: 2700, winBonus: 1500, podiumBonus: 750, championshipBonus: 10000 },
      mid: { monthly: 13500, winBonus: 6750, podiumBonus: 3375, championshipBonus: 41000 },
      elite: { monthly: 36000, winBonus: 16000, podiumBonus: 8000, championshipBonus: 110000 }
    },
    requirements: {
      minReputation: 12,
      minMarketability: 16
    },
    priority: { primary: 'media', weight: 2 },
    expectations: {
      requiredShoutouts: 2,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['Japan']
  },
  {
    id: 'denso',
    name: 'Denso',
    category: 'automotive',
    tier: 'high',
    description: 'Japanese automotive components excellence',
    country: 'Japan',
    paymentTiers: {
      entry: { monthly: 6300, winBonus: 3500, podiumBonus: 1750, championshipBonus: 25000 },
      mid: { monthly: 33000, winBonus: 16500, podiumBonus: 8250, championshipBonus: 100000 },
      elite: { monthly: 93000, winBonus: 41000, podiumBonus: 20500, championshipBonus: 285000 }
    },
    requirements: {
      minReputation: 38,
      minMarketability: 32,
      seriesTiers: ['semi-pro', 'pro', 'elite']
    },
    priority: { primary: 'performance', secondary: 'brand_alignment', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 3,
      requiredEvents: 1,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['Japan'],
    manufacturerBonus: ['toyota'],
    seriesBonus: ['super_gt', 'lmp']
  },
  {
    id: 'ngk',
    name: 'NGK Spark Plugs',
    category: 'automotive',
    tier: 'mid',
    description: 'Ignition technology powering champions',
    country: 'Japan',
    paymentTiers: {
      entry: { monthly: 4000, winBonus: 2200, podiumBonus: 1100, championshipBonus: 15000 },
      mid: { monthly: 21000, winBonus: 10500, podiumBonus: 5250, championshipBonus: 64000 },
      elite: { monthly: 56000, winBonus: 25000, podiumBonus: 12500, championshipBonus: 172000 }
    },
    requirements: {
      minReputation: 24,
      minMarketability: 22
    },
    priority: { primary: 'performance', secondary: 'media', weight: 2 },
    expectations: {
      minSeasonPodiums: 1,
      requiredShoutouts: 2,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['Japan'],
    seriesBonus: ['super_gt', 'formula']
  },
  {
    id: 'enkei',
    name: 'Enkei Wheels',
    category: 'automotive',
    tier: 'mid',
    description: 'Japanese racing wheel craftsmanship',
    country: 'Japan',
    paymentTiers: {
      entry: { monthly: 3700, winBonus: 2050, podiumBonus: 1025, championshipBonus: 14000 },
      mid: { monthly: 19000, winBonus: 9500, podiumBonus: 4750, championshipBonus: 58000 },
      elite: { monthly: 51000, winBonus: 23000, podiumBonus: 11500, championshipBonus: 156000 }
    },
    requirements: {
      minReputation: 22,
      minMarketability: 20
    },
    priority: { primary: 'performance', secondary: 'media', weight: 2 },
    expectations: {
      minSeasonPodiums: 1,
      requiredShoutouts: 2,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['Japan'],
    seriesBonus: ['super_gt', 'drift']
  },
  {
    id: 'oz-racing',
    name: 'OZ Racing',
    category: 'automotive',
    tier: 'high',
    description: 'Italian wheel manufacturer for F1 teams',
    country: 'Italy',
    paymentTiers: {
      entry: { monthly: 5800, winBonus: 3200, podiumBonus: 1600, championshipBonus: 23000 },
      mid: { monthly: 30000, winBonus: 15000, podiumBonus: 7500, championshipBonus: 92000 },
      elite: { monthly: 84000, winBonus: 37000, podiumBonus: 18500, championshipBonus: 258000 }
    },
    requirements: {
      minReputation: 36,
      minMarketability: 32
    },
    priority: { primary: 'performance', secondary: 'brand_alignment', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 3,
      requiredEvents: 1,
      preferredImageStyle: 'technical'
    },
    nationalityBonus: ['Italy'],
    seriesBonus: ['formula', 'gt3', 'dtm']
  },
  {
    id: 'mcdonalds',
    name: 'McDonalds',
    category: 'lifestyle',
    tier: 'elite',
    description: 'Im lovin it - global fast food giant',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 15000, winBonus: 8000, podiumBonus: 4000, championshipBonus: 62000 },
      mid: { monthly: 80000, winBonus: 40000, podiumBonus: 20000, championshipBonus: 245000 },
      elite: { monthly: 300000, winBonus: 125000, podiumBonus: 62500, championshipBonus: 925000 }
    },
    requirements: {
      minReputation: 68,
      minMarketability: 72,
      minWins: 6,
      seriesTiers: ['pro', 'elite']
    },
    priority: { primary: 'media', secondary: 'events', weight: 5 },
    expectations: {
      minSeasonWins: 3,
      minSeasonPodiums: 8,
      championshipTarget: 'top5',
      maxDNFs: 4,
      requiredShoutouts: 8,
      requiredInterviews: 3,
      minFollowers: 150000,
      viralPostBonus: true,
      requiredEvents: 4,
      productLaunches: 2,
      preferredImageStyle: 'professional',
      noControversyClause: true
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['nascar', 'formula']
  },
  {
    id: 'subway',
    name: 'Subway',
    category: 'lifestyle',
    tier: 'mid',
    description: 'Eat fresh - athlete nutrition sponsor',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 4300, winBonus: 2350, podiumBonus: 1175, championshipBonus: 16000 },
      mid: { monthly: 22000, winBonus: 11000, podiumBonus: 5500, championshipBonus: 67000 },
      elite: { monthly: 58000, winBonus: 26000, podiumBonus: 13000, championshipBonus: 178000 }
    },
    requirements: {
      minReputation: 26,
      minMarketability: 32
    },
    priority: { primary: 'media', secondary: 'events', weight: 2 },
    expectations: {
      minSeasonPodiums: 1,
      requiredShoutouts: 4,
      minFollowers: 10000,
      viralPostBonus: true,
      requiredEvents: 1,
      preferredImageStyle: 'professional'
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['nascar']
  },
  {
    id: 'budweiser',
    name: 'Budweiser (0.0)',
    category: 'lifestyle',
    tier: 'high',
    description: 'King of beers - non-alcoholic racing partner',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 7900, winBonus: 4300, podiumBonus: 2150, championshipBonus: 31000 },
      mid: { monthly: 42000, winBonus: 21000, podiumBonus: 10500, championshipBonus: 128000 },
      elite: { monthly: 125000, winBonus: 55000, podiumBonus: 27500, championshipBonus: 385000 }
    },
    requirements: {
      minReputation: 48,
      minMarketability: 50
    },
    priority: { primary: 'events', secondary: 'media', weight: 4 },
    expectations: {
      minSeasonPodiums: 3,
      requiredShoutouts: 5,
      requiredInterviews: 2,
      minFollowers: 50000,
      requiredEvents: 3,
      preferredImageStyle: 'professional',
      noControversyClause: true
    },
    nationalityBonus: ['USA'],
    seriesBonus: ['nascar', 'indycar']
  },
  {
    id: 'monster-audio',
    name: 'Monster Audio',
    category: 'tech_gaming',
    tier: 'entry',
    description: 'Premium audio equipment',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 2800, winBonus: 1550, podiumBonus: 775, championshipBonus: 10500 },
      mid: { monthly: 14000, winBonus: 7000, podiumBonus: 3500, championshipBonus: 43000 },
      elite: { monthly: 37000, winBonus: 16500, podiumBonus: 8250, championshipBonus: 113000 }
    },
    requirements: {
      minReputation: 13,
      minMarketability: 18
    },
    priority: { primary: 'media', weight: 2 },
    expectations: {
      requiredShoutouts: 3,
      viralPostBonus: true,
      preferredImageStyle: 'edgy'
    },
    nationalityBonus: ['USA']
  },
  {
    id: 'beats',
    name: 'Beats by Dre',
    category: 'tech_gaming',
    tier: 'high',
    description: 'Premium headphones for premium athletes',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 6400, winBonus: 3500, podiumBonus: 1750, championshipBonus: 25000 },
      mid: { monthly: 33000, winBonus: 16500, podiumBonus: 8250, championshipBonus: 100000 },
      elite: { monthly: 96000, winBonus: 42000, podiumBonus: 21000, championshipBonus: 295000 }
    },
    requirements: {
      minReputation: 40,
      minMarketability: 48
    },
    priority: { primary: 'media', secondary: 'brand_alignment', weight: 4 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 6,
      requiredInterviews: 1,
      minFollowers: 40000,
      viralPostBonus: true,
      preferredImageStyle: 'edgy',
      noControversyClause: true
    },
    nationalityBonus: ['USA']
  },
  {
    id: 'bose',
    name: 'Bose',
    category: 'tech_gaming',
    tier: 'high',
    description: 'Better sound through research',
    country: 'USA',
    paymentTiers: {
      entry: { monthly: 6900, winBonus: 3800, podiumBonus: 1900, championshipBonus: 27000 },
      mid: { monthly: 36000, winBonus: 18000, podiumBonus: 9000, championshipBonus: 110000 },
      elite: { monthly: 102000, winBonus: 45000, podiumBonus: 22500, championshipBonus: 315000 }
    },
    requirements: {
      minReputation: 42,
      minMarketability: 45
    },
    priority: { primary: 'media', secondary: 'brand_alignment', weight: 3 },
    expectations: {
      minSeasonPodiums: 2,
      requiredShoutouts: 4,
      requiredInterviews: 1,
      minFollowers: 35000,
      preferredImageStyle: 'professional'
    },
    nationalityBonus: ['USA']
  }
]

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all sponsors by category
 */
export function getSponsorsByCategory(category: SponsorCategory): Sponsor[] {
  return SPONSORS.filter(s => s.category === category)
}

/**
 * Get all sponsors by tier
 */
export function getSponsorsByTier(tier: SponsorTier): Sponsor[] {
  return SPONSORS.filter(s => s.tier === tier)
}

/**
 * Get a sponsor by ID
 */
export function getSponsorById(id: string): Sponsor | undefined {
  return SPONSORS.find(s => s.id === id)
}

/**
 * Get all unique categories from sponsors
 */
export function getAllCategories(): SponsorCategory[] {
  return [...new Set(SPONSORS.map(s => s.category))]
}

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



