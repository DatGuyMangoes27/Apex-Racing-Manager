// ============================================
// OWNER BACKGROUNDS SYSTEM
// ============================================
// Backgrounds for team owners that affect starting money,
// perks, connections, and story elements.

export interface OwnerPerk {
  id: string
  name: string
  description: string
  effect: string // Description of the mechanical effect
}

export interface OwnerBackground {
  id: string
  name: string
  tagline: string
  description: string
  bio: string // Longer story/flavor text for the owner's history
  
  // Starting conditions
  startingCash: number        // Team investment amount
  personalBuffer: number      // Personal liquid cash (separate from team investment)
  startingReputation: number
  
  // Perks
  perks: OwnerPerk[]
  
  // Connections
  manufacturerConnections?: string[] // Manufacturer IDs with better starting relations
  manufacturerRelationBonus: number   // Bonus to connected manufacturers (0-50)
  
  // Financial perks (hooks for future expansion)
  sponsorNegotiationBonus: number     // % bonus to sponsor deal values
  investmentOpportunities: boolean    // Unlocks investment events
  loanTermsBonus: number              // % better loan interest rates
  costManagementBonus: number         // % reduction to operational costs
  
  // Board/Reputation
  boardPatience: number               // Extra weeks before board gets upset (can be negative)
  initialBoardMood: number            // Starting board mood (0-100)
  fanSentimentBonus: number           // Starting fan sentiment modifier
  
  // Special flags
  hasPaddockRespect: boolean          // Starts with respect from teams/drivers
  hasMediaConnections: boolean        // Better media coverage
  hasCorporateNetwork: boolean        // Access to corporate sponsors
  hasTechPartners: boolean            // Can attract tech sponsors
  hasGrassrootsSupport: boolean       // Strong local fan base
  
  // UI
  icon: string
  color: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
}

// ============================================
// OWNER BACKGROUNDS
// ============================================

export const OWNER_BACKGROUNDS: Record<string, OwnerBackground> = {
  self_made: {
    id: 'self_made',
    name: 'Self-Made Entrepreneur',
    tagline: 'Built everything from scratch',
    description: 'You built a successful business through hard work and determination. Now you\'re ready for your biggest challenge yet.',
    bio: 'Starting with nothing but ambition, you worked your way up from a small garage operation to running a profitable business. Along the way, you developed a keen eye for talent, a knack for negotiation, and an unshakeable belief in doing things your way. The racing paddock is unfamiliar territory, but you\'ve conquered tougher challenges before.',
    
    startingCash: 350000,
    personalBuffer: 200000,
    startingReputation: 40,
    
    perks: [
      { id: 'negotiator', name: 'Natural Negotiator', description: 'Years of business deals have sharpened your negotiation skills', effect: '+15% sponsor deal values' },
      { id: 'bootstrap', name: 'Bootstrap Mentality', description: 'You know how to make every dollar count', effect: '-10% operational costs' }
    ],
    
    manufacturerConnections: [],
    manufacturerRelationBonus: 0,
    sponsorNegotiationBonus: 15,
    investmentOpportunities: false,
    loanTermsBonus: 5,
    costManagementBonus: 10,
    
    boardPatience: 4,
    initialBoardMood: 65,
    fanSentimentBonus: 5,
    
    hasPaddockRespect: false,
    hasMediaConnections: false,
    hasCorporateNetwork: false,
    hasTechPartners: false,
    hasGrassrootsSupport: true,
    
    icon: 'Briefcase',
    color: 'slate',
    difficulty: 'medium'
  },
  
  racing_dynasty: {
    id: 'racing_dynasty',
    name: 'Racing Dynasty Heir',
    tagline: 'Born into the paddock',
    description: 'Your family has been in motorsport for generations. The name opens doors, but expectations are sky-high.',
    bio: 'Your grandfather raced in the early days of motorsport. Your father ran a successful team for two decades. Now it\'s your turn to carry the family legacy forward. Everyone knows your name, and everyone will be watching to see if you can live up to it. The connections are there, but so is the pressure.',
    
    startingCash: 850000,
    personalBuffer: 500000,
    startingReputation: 60,
    
    perks: [
      { id: 'legacy_name', name: 'Legacy Name', description: 'Your family name carries weight in the paddock', effect: '+20 starting reputation with manufacturers' },
      { id: 'insider_knowledge', name: 'Insider Knowledge', description: 'You grew up around racing teams', effect: 'Better initial staff recruitment options' },
      { id: 'family_contacts', name: 'Family Contacts', description: 'Your family knows everyone worth knowing', effect: '+25% manufacturer relationship bonus' }
    ],
    
    manufacturerConnections: ['porsche', 'ferrari', 'mercedes-amg'],
    manufacturerRelationBonus: 25,
    sponsorNegotiationBonus: 10,
    investmentOpportunities: true,
    loanTermsBonus: 15,
    costManagementBonus: 0,
    
    boardPatience: -2, // Higher expectations
    initialBoardMood: 75,
    fanSentimentBonus: 15,
    
    hasPaddockRespect: true,
    hasMediaConnections: true,
    hasCorporateNetwork: true,
    hasTechPartners: false,
    hasGrassrootsSupport: false,
    
    icon: 'Crown',
    color: 'gold',
    difficulty: 'medium'
  },
  
  tech_investor: {
    id: 'tech_investor',
    name: 'Tech Investor',
    tagline: 'Silicon Valley meets the racetrack',
    description: 'Your tech ventures made you wealthy. Now you\'re bringing that innovative mindset to motorsport.',
    bio: 'You made your fortune in the tech boom, building and investing in companies that changed industries. Racing has always been a passion, and now you have the resources to pursue it properly. Your approach is data-driven and innovative, which some traditionalists view with skepticism. But you\'ve disrupted industries before.',
    
    startingCash: 2500000,
    personalBuffer: 1500000,
    startingReputation: 35,
    
    perks: [
      { id: 'deep_pockets', name: 'Deep Pockets', description: 'Money isn\'t an obstacle', effect: 'Access to premium investment opportunities' },
      { id: 'tech_connections', name: 'Tech Connections', description: 'Your network includes tech giants', effect: 'Attract technology sponsors' },
      { id: 'data_driven', name: 'Data-Driven', description: 'You believe in analytics', effect: '+15% simulation facility effectiveness' }
    ],
    
    manufacturerConnections: [],
    manufacturerRelationBonus: 0,
    sponsorNegotiationBonus: 5,
    investmentOpportunities: true,
    loanTermsBonus: 20,
    costManagementBonus: 0,
    
    boardPatience: 0,
    initialBoardMood: 70,
    fanSentimentBonus: -5, // Some fans distrust tech money
    
    hasPaddockRespect: false,
    hasMediaConnections: true,
    hasCorporateNetwork: true,
    hasTechPartners: true,
    hasGrassrootsSupport: false,
    
    icon: 'Cpu',
    color: 'cyan',
    difficulty: 'easy'
  },
  
  former_driver: {
    id: 'former_driver',
    name: 'Former Racing Driver',
    tagline: 'From the cockpit to the pitwall',
    description: 'You raced professionally for years. Now you\'re on the other side, running your own team.',
    bio: 'You know what it takes to compete at the highest level because you\'ve done it. The roar of engines, the smell of burning rubber, the thrill of the fight - it\'s in your blood. Retirement from driving didn\'t mean retirement from racing. Your experience gives you unique insight, and the paddock respects what you achieved behind the wheel.',
    
    startingCash: 450000,
    personalBuffer: 300000,
    startingReputation: 55,
    
    perks: [
      { id: 'driver_insight', name: 'Driver Insight', description: 'You understand what drivers need', effect: '+20% driver morale and development' },
      { id: 'paddock_respect', name: 'Paddock Respect', description: 'You earned respect on track', effect: 'Better initial relationships with drivers and teams' },
      { id: 'race_craft', name: 'Race Craft Knowledge', description: 'You know race strategy inside out', effect: '+10% strategy effectiveness' }
    ],
    
    manufacturerConnections: ['bmw', 'audi'],
    manufacturerRelationBonus: 15,
    sponsorNegotiationBonus: 5,
    investmentOpportunities: false,
    loanTermsBonus: 0,
    costManagementBonus: 5,
    
    boardPatience: 2,
    initialBoardMood: 70,
    fanSentimentBonus: 20,
    
    hasPaddockRespect: true,
    hasMediaConnections: true,
    hasCorporateNetwork: false,
    hasTechPartners: false,
    hasGrassrootsSupport: true,
    
    icon: 'Trophy',
    color: 'orange',
    difficulty: 'medium'
  },
  
  finance_mogul: {
    id: 'finance_mogul',
    name: 'Finance Mogul',
    tagline: 'The numbers always add up',
    description: 'A career in high finance taught you how money works. Time to apply those skills to motorsport.',
    bio: 'Wall Street, hedge funds, private equity - you\'ve navigated them all. Numbers tell stories if you know how to read them. Racing teams are businesses, and businesses can be optimized. Some call you cold and calculating, but you call it efficient. The paddock will learn to respect your methods.',
    
    startingCash: 1400000,
    personalBuffer: 800000,
    startingReputation: 30,
    
    perks: [
      { id: 'financial_acumen', name: 'Financial Acumen', description: 'You understand complex finances', effect: '-20% loan interest rates' },
      { id: 'investor_network', name: 'Investor Network', description: 'You know people with money', effect: 'Access to additional investment opportunities' },
      { id: 'cost_control', name: 'Cost Control Expert', description: 'You spot waste instantly', effect: '-15% operational costs' }
    ],
    
    manufacturerConnections: [],
    manufacturerRelationBonus: 0,
    sponsorNegotiationBonus: 20,
    investmentOpportunities: true,
    loanTermsBonus: 25,
    costManagementBonus: 15,
    
    boardPatience: -4, // Investors expect results
    initialBoardMood: 60,
    fanSentimentBonus: -10, // Fans suspicious of finance types
    
    hasPaddockRespect: false,
    hasMediaConnections: false,
    hasCorporateNetwork: true,
    hasTechPartners: false,
    hasGrassrootsSupport: false,
    
    icon: 'TrendingUp',
    color: 'emerald',
    difficulty: 'hard'
  },
  
  passionate_enthusiast: {
    id: 'passionate_enthusiast',
    name: 'Passionate Enthusiast',
    tagline: 'Living the dream',
    description: 'Racing has been your lifelong passion. You\'ve saved everything for this chance.',
    bio: 'Every weekend spent at circuits. Every penny saved for this moment. You may not have the deepest pockets or the best connections, but you have something more valuable: genuine love for the sport. The fans see it. The drivers feel it. Your enthusiasm is contagious, and it just might be enough to build something special.',
    
    startingCash: 280000,
    personalBuffer: 100000,
    startingReputation: 45,
    
    perks: [
      { id: 'fan_favorite', name: 'Fan Favorite', description: 'Fans love an underdog story', effect: '+25% merchandise and fan revenue' },
      { id: 'grassroots_hero', name: 'Grassroots Hero', description: 'Local communities rally behind you', effect: '+20% local sponsor interest' },
      { id: 'infectious_passion', name: 'Infectious Passion', description: 'Your enthusiasm motivates everyone', effect: '+10% staff and driver morale' }
    ],
    
    manufacturerConnections: [],
    manufacturerRelationBonus: 0,
    sponsorNegotiationBonus: 0,
    investmentOpportunities: false,
    loanTermsBonus: 0,
    costManagementBonus: 5,
    
    boardPatience: 8, // Low expectations initially
    initialBoardMood: 80,
    fanSentimentBonus: 25,
    
    hasPaddockRespect: false,
    hasMediaConnections: false,
    hasCorporateNetwork: false,
    hasTechPartners: false,
    hasGrassrootsSupport: true,
    
    icon: 'Heart',
    color: 'red',
    difficulty: 'hard'
  },
  
  corporate_executive: {
    id: 'corporate_executive',
    name: 'Corporate Executive',
    tagline: 'Boardroom to paddock',
    description: 'Years running major corporations prepared you for this. Time to apply professional management to racing.',
    bio: 'You climbed the corporate ladder and sat in the corner office. Meetings, mergers, market strategy - you\'ve seen it all. Racing is different, but business principles remain the same. Your corporate network is extensive, and sponsors trust your professional approach. Some say you lack passion, but results speak louder.',
    
    startingCash: 900000,
    personalBuffer: 500000,
    startingReputation: 35,
    
    perks: [
      { id: 'corporate_sponsors', name: 'Corporate Sponsors', description: 'Big companies trust your professionalism', effect: '+30% corporate sponsor interest' },
      { id: 'management_expertise', name: 'Management Expertise', description: 'You know how to run an organization', effect: '+15% staff efficiency' },
      { id: 'professional_network', name: 'Professional Network', description: 'Your contacts span industries', effect: 'Access to cross-industry partnerships' }
    ],
    
    manufacturerConnections: ['mercedes-amg', 'bmw', 'audi'],
    manufacturerRelationBonus: 10,
    sponsorNegotiationBonus: 15,
    investmentOpportunities: true,
    loanTermsBonus: 10,
    costManagementBonus: 10,
    
    boardPatience: -2, // Professional standards
    initialBoardMood: 65,
    fanSentimentBonus: -5,
    
    hasPaddockRespect: false,
    hasMediaConnections: true,
    hasCorporateNetwork: true,
    hasTechPartners: true,
    hasGrassrootsSupport: false,
    
    icon: 'Building',
    color: 'blue',
    difficulty: 'medium'
  },
  
  lottery_winner: {
    id: 'lottery_winner',
    name: 'Lottery Winner',
    tagline: 'Lady luck\'s chosen',
    description: 'Fortune smiled on you. Now you\'re spending your winnings on a childhood dream.',
    bio: 'One ticket changed everything. Suddenly, dreams became possibilities. Racing was always the dream, watching from the stands and wondering "what if." Now you have the chance to find out. The paddock doesn\'t quite know what to make of you, and neither does the media. But money talks, and you\'ve got plenty to say.',
    
    startingCash: 1000000,
    personalBuffer: 400000,
    startingReputation: 20,
    
    perks: [
      { id: 'lucky_streak', name: 'Lucky Streak', description: 'Fortune favors the bold', effect: 'Small random bonuses on financial events' },
      { id: 'nothing_to_lose', name: 'Nothing to Lose', description: 'You\'re already winning', effect: '-20% stress from setbacks' }
    ],
    
    manufacturerConnections: [],
    manufacturerRelationBonus: 0,
    sponsorNegotiationBonus: -10, // Sponsors skeptical
    investmentOpportunities: false,
    loanTermsBonus: -10, // Banks cautious
    costManagementBonus: -10, // Poor spending habits
    
    boardPatience: 6,
    initialBoardMood: 75,
    fanSentimentBonus: 10, // People love a good story
    
    hasPaddockRespect: false,
    hasMediaConnections: false,
    hasCorporateNetwork: false,
    hasTechPartners: false,
    hasGrassrootsSupport: true,
    
    icon: 'Sparkles',
    color: 'purple',
    difficulty: 'expert'
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getAllOwnerBackgrounds(): OwnerBackground[] {
  return Object.values(OWNER_BACKGROUNDS)
}

export function getOwnerBackgroundById(id: string): OwnerBackground | undefined {
  return OWNER_BACKGROUNDS[id]
}

export function getOwnerBackgroundsByDifficulty(difficulty: OwnerBackground['difficulty']): OwnerBackground[] {
  return getAllOwnerBackgrounds().filter(b => b.difficulty === difficulty)
}

export function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount.toLocaleString()}`
}

export function getDifficultyLabel(difficulty: OwnerBackground['difficulty']): string {
  switch (difficulty) {
    case 'easy': return 'Wealthy Start'
    case 'medium': return 'Balanced Challenge'
    case 'hard': return 'Tight Budget'
    case 'expert': return 'Maximum Risk'
  }
}

export function getDifficultyDescription(difficulty: OwnerBackground['difficulty']): string {
  switch (difficulty) {
    case 'easy': return 'Plenty of capital to absorb mistakes and invest in growth'
    case 'medium': return 'Reasonable resources with room for calculated risks'
    case 'hard': return 'Every decision counts - limited margin for error'
    case 'expert': return 'You\'ll need skill, strategy, and a bit of luck to survive'
  }
}

// ============================================
// LOCATION PERKS SYSTEM
// ============================================
// Team base country affects operations, costs, and opportunities

export interface LocationPerk {
  id: string
  country: string
  name: string
  description: string
  effects: {
    // Cost modifiers (percentages)
    operationalCostModifier?: number      // % change to opex
    staffCostModifier?: number            // % change to staff salaries
    facilityCostModifier?: number         // % change to facility upgrades
    
    // Development modifiers
    engineerQualityBonus?: number         // Bonus to engineer recruitment
    aeroDevBonus?: number                 // % bonus to aero development
    chassisDevBonus?: number              // % bonus to chassis development
    reliabilityBonus?: number             // % bonus to reliability
    
    // Financial opportunities
    sponsorPoolBonus?: number             // % increase to sponsor pool
    localSponsorBonus?: number            // Bonus to local sponsor interest
    investmentAccessBonus?: number        // % better investment opportunities
    
    // Series access
    seriesAccessBonus?: string[]          // Series IDs with easier entry
    seriesAccessPenalty?: string[]        // Series IDs with harder entry
    
    // Fan/media
    fanEngagementBonus?: number           // % bonus to fan sentiment growth
    mediaCoverageBonus?: number           // % bonus to media coverage
  }
}

export const LOCATION_PERKS: Record<string, LocationPerk> = {
  UK: {
    id: 'uk',
    country: 'UK',
    name: 'Motorsport Valley',
    description: 'The heart of global motorsport engineering. Access to world-class talent and facilities.',
    effects: {
      engineerQualityBonus: 20,
      aeroDevBonus: 15,
      chassisDevBonus: 10,
      staffCostModifier: 15, // Higher salaries
      facilityCostModifier: 10,
      seriesAccessBonus: ['british_gt', 'btcc', 'formula_3']
    }
  },
  
  Germany: {
    id: 'germany',
    country: 'Germany',
    name: 'Engineering Excellence',
    description: 'Precision manufacturing and deep technical expertise. Strong manufacturer connections.',
    effects: {
      chassisDevBonus: 20,
      reliabilityBonus: 15,
      engineerQualityBonus: 10,
      staffCostModifier: 10,
      seriesAccessBonus: ['dtm', 'adac_gt', 'vln']
    }
  },
  
  Italy: {
    id: 'italy',
    country: 'Italy',
    name: 'Racing Passion',
    description: 'The spiritual home of motorsport. Passionate fans and premium sponsor interest.',
    effects: {
      fanEngagementBonus: 25,
      sponsorPoolBonus: 15,
      mediaCoverageBonus: 20,
      operationalCostModifier: -5, // Slightly lower costs
      seriesAccessBonus: ['gt_world_challenge_europe', 'italian_gt']
    }
  },
  
  USA: {
    id: 'usa',
    country: 'USA',
    name: 'Commercial Powerhouse',
    description: 'The largest market for motorsport sponsorship. Deep pockets and media reach.',
    effects: {
      sponsorPoolBonus: 30,
      mediaCoverageBonus: 25,
      investmentAccessBonus: 20,
      operationalCostModifier: 5,
      facilityCostModifier: 10,
      seriesAccessBonus: ['imsa', 'indycar', 'nascar']
    }
  },
  
  Japan: {
    id: 'japan',
    country: 'Japan',
    name: 'Manufacturing Precision',
    description: 'Legendary attention to detail and reliability. Strong tech sector partnerships.',
    effects: {
      reliabilityBonus: 25,
      chassisDevBonus: 10,
      operationalCostModifier: 10,
      staffCostModifier: 5,
      seriesAccessBonus: ['super_gt', 'super_formula']
    }
  },
  
  Brazil: {
    id: 'brazil',
    country: 'Brazil',
    name: 'Emerging Market',
    description: 'Lower operational costs and passionate local fanbase. Growing talent pool.',
    effects: {
      operationalCostModifier: -20,
      staffCostModifier: -15,
      facilityCostModifier: -15,
      fanEngagementBonus: 15,
      localSponsorBonus: 20,
      seriesAccessBonus: ['stock_car_brasil', 'formula_vee']
    }
  },
  
  France: {
    id: 'france',
    country: 'France',
    name: 'Endurance Heritage',
    description: 'Home of Le Mans. Deep endurance racing expertise and prestige connections.',
    effects: {
      aeroDevBonus: 10,
      reliabilityBonus: 10,
      mediaCoverageBonus: 10,
      seriesAccessBonus: ['wec', 'elms', 'ffsa_gt']
    }
  },
  
  Netherlands: {
    id: 'netherlands',
    country: 'Netherlands',
    name: 'Strategic Hub',
    description: 'Central European location. Excellent logistics and sim racing talent pool.',
    effects: {
      operationalCostModifier: -5,
      investmentAccessBonus: 10,
      engineerQualityBonus: 5,
      seriesAccessBonus: ['gt_world_challenge_europe']
    }
  },
  
  Australia: {
    id: 'australia',
    country: 'Australia',
    name: 'Pacific Gateway',
    description: 'Access to Asian and Pacific markets. Strong touring car heritage.',
    effects: {
      fanEngagementBonus: 10,
      sponsorPoolBonus: 10,
      operationalCostModifier: 5,
      seriesAccessBonus: ['supercars', 'australian_gt']
    }
  }
}

// Default perk for countries not explicitly defined
export const DEFAULT_LOCATION_PERK: LocationPerk = {
  id: 'default',
  country: 'Other',
  name: 'Standard Operations',
  description: 'A balanced location with no specific advantages or disadvantages.',
  effects: {}
}

export function getLocationPerk(country: string): LocationPerk {
  return LOCATION_PERKS[country] || DEFAULT_LOCATION_PERK
}

export function getAllLocationPerks(): LocationPerk[] {
  return Object.values(LOCATION_PERKS)
}

export function getLocationPerkDescription(country: string): string {
  const perk = getLocationPerk(country)
  return perk.description
}

export function getLocationPerkEffectsSummary(country: string): string[] {
  const perk = getLocationPerk(country)
  const effects: string[] = []
  
  if (perk.effects.engineerQualityBonus) {
    effects.push(`+${perk.effects.engineerQualityBonus}% engineer quality`)
  }
  if (perk.effects.aeroDevBonus) {
    effects.push(`+${perk.effects.aeroDevBonus}% aero development`)
  }
  if (perk.effects.chassisDevBonus) {
    effects.push(`+${perk.effects.chassisDevBonus}% chassis development`)
  }
  if (perk.effects.reliabilityBonus) {
    effects.push(`+${perk.effects.reliabilityBonus}% reliability`)
  }
  if (perk.effects.sponsorPoolBonus) {
    effects.push(`+${perk.effects.sponsorPoolBonus}% sponsor pool`)
  }
  if (perk.effects.fanEngagementBonus) {
    effects.push(`+${perk.effects.fanEngagementBonus}% fan engagement`)
  }
  if (perk.effects.operationalCostModifier) {
    const sign = perk.effects.operationalCostModifier > 0 ? '+' : ''
    effects.push(`${sign}${perk.effects.operationalCostModifier}% operational costs`)
  }
  if (perk.effects.staffCostModifier) {
    const sign = perk.effects.staffCostModifier > 0 ? '+' : ''
    effects.push(`${sign}${perk.effects.staffCostModifier}% staff costs`)
  }
  if (perk.effects.mediaCoverageBonus) {
    effects.push(`+${perk.effects.mediaCoverageBonus}% media coverage`)
  }
  if (perk.effects.investmentAccessBonus) {
    effects.push(`+${perk.effects.investmentAccessBonus}% investment access`)
  }
  
  return effects
}
