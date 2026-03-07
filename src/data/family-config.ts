// ============================================
// FAMILY & RELATIONSHIP CONFIGURATION
// ============================================
// Configuration for dating, marriage, children, and dynasty systems.

import type { Country } from './personal-finance-config'

// ============================================
// PARTNER SYSTEM
// ============================================

export type RelationshipStatus = 
  | 'single'
  | 'dating'
  | 'engaged'
  | 'married'
  | 'separated'
  | 'divorced'
  | 'widowed'

export type PartnerOrigin =
  | 'racing_paddock'      // Met through motorsport
  | 'business_event'      // Corporate/networking event
  | 'social_circle'       // Friend introduction
  | 'media_appearance'    // Met through media work
  | 'charity_event'       // Philanthropy connection
  | 'random_encounter'    // Fate
  | 'childhood_friend'    // Known since youth

export type PartnerCareer =
  | 'model'
  | 'athlete'
  | 'business_exec'
  | 'doctor'
  | 'lawyer'
  | 'entrepreneur'
  | 'artist'
  | 'journalist'
  | 'scientist'
  | 'socialite'
  | 'racing_driver'
  | 'engineer'
  | 'team_staff'
  | 'none'

export interface PartnerTrait {
  id: string
  name: string
  description: string
  effects: {
    happinessModifier?: number       // Base happiness impact
    socialEventBonus?: number        // Better at social events
    sponsorAttractionBonus?: number  // Helps with sponsors
    stressReliefBonus?: number       // Better stress relief
    familyHappinessBonus?: number    // Better family life
    publicImageBonus?: number        // Media/PR benefits
    expenseModifier?: number         // Affects lifestyle costs
    fertilityModifier?: number       // Affects family planning
    careerSupportBonus?: number      // Helps with racing career
  }
}

export const PARTNER_TRAITS: PartnerTrait[] = [
  {
    id: 'supportive',
    name: 'Supportive',
    description: 'Always there during tough times',
    effects: { stressReliefBonus: 15, happinessModifier: 10, careerSupportBonus: 10 }
  },
  {
    id: 'ambitious',
    name: 'Ambitious',
    description: 'Career-focused and driven',
    effects: { happinessModifier: -5, sponsorAttractionBonus: 10, expenseModifier: 15 }
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Loves events and networking',
    effects: { socialEventBonus: 20, publicImageBonus: 10, happinessModifier: 5 }
  },
  {
    id: 'private',
    name: 'Private',
    description: 'Prefers staying out of spotlight',
    effects: { socialEventBonus: -10, stressReliefBonus: 10, publicImageBonus: -5 }
  },
  {
    id: 'glamorous',
    name: 'Glamorous',
    description: 'Always camera-ready and stylish',
    effects: { publicImageBonus: 15, sponsorAttractionBonus: 10, expenseModifier: 25 }
  },
  {
    id: 'practical',
    name: 'Practical',
    description: 'Down-to-earth and sensible',
    effects: { expenseModifier: -15, familyHappinessBonus: 10, happinessModifier: 5 }
  },
  {
    id: 'nurturing',
    name: 'Nurturing',
    description: 'Great with children and family',
    effects: { familyHappinessBonus: 20, fertilityModifier: 10, happinessModifier: 5 }
  },
  {
    id: 'adventurous',
    name: 'Adventurous',
    description: 'Loves travel and new experiences',
    effects: { happinessModifier: 10, expenseModifier: 10, stressReliefBonus: 5 }
  },
  {
    id: 'racing_enthusiast',
    name: 'Racing Enthusiast',
    description: 'Genuinely loves motorsport',
    effects: { careerSupportBonus: 20, happinessModifier: 10, socialEventBonus: 5 }
  },
  {
    id: 'high_maintenance',
    name: 'High Maintenance',
    description: 'Expects the best of everything',
    effects: { expenseModifier: 35, publicImageBonus: 10, happinessModifier: -10 }
  },
  {
    id: 'independent',
    name: 'Independent',
    description: 'Values personal space and freedom',
    effects: { happinessModifier: 5, socialEventBonus: -5, stressReliefBonus: 5 }
  },
  {
    id: 'jealous',
    name: 'Jealous',
    description: 'Gets jealous of attention from others',
    effects: { happinessModifier: -15, socialEventBonus: -10, stressReliefBonus: -10 }
  },
  // NEW: Negative / Complex partner traits
  {
    id: 'materialistic',
    name: 'Materialistic',
    description: 'Values wealth and luxury above all',
    effects: { expenseModifier: 40, sponsorAttractionBonus: 5, happinessModifier: -10, publicImageBonus: 5 }
  },
  {
    id: 'controlling',
    name: 'Controlling',
    description: 'Needs to be in charge of everything',
    effects: { happinessModifier: -15, stressReliefBonus: -15, socialEventBonus: -5, careerSupportBonus: 5 }
  },
  {
    id: 'secretive',
    name: 'Secretive',
    description: 'Keeps things hidden and avoids openness',
    effects: { happinessModifier: -5, stressReliefBonus: -10, familyHappinessBonus: -10 }
  },
  {
    id: 'workaholic',
    name: 'Workaholic',
    description: 'Obsessed with their own career',
    effects: { careerSupportBonus: 15, happinessModifier: -5, familyHappinessBonus: -10, expenseModifier: -10 }
  },
  {
    id: 'dramatic',
    name: 'Dramatic',
    description: 'Makes everything into a big deal',
    effects: { happinessModifier: -10, publicImageBonus: -5, stressReliefBonus: -15, socialEventBonus: 10 }
  },
  {
    id: 'possessive',
    name: 'Possessive',
    description: 'Clingy and demanding of attention',
    effects: { happinessModifier: -10, socialEventBonus: -15, stressReliefBonus: -10 }
  },
  {
    id: 'party_animal',
    name: 'Party Animal',
    description: 'Lives for the nightlife and social scene',
    effects: { socialEventBonus: 25, publicImageBonus: -5, expenseModifier: 20, stressReliefBonus: 10, familyHappinessBonus: -10 }
  },
  {
    id: 'commitment_phobic',
    name: 'Commitment Phobic',
    description: 'Afraid of settling down',
    effects: { happinessModifier: -5, familyHappinessBonus: -15, stressReliefBonus: -5 }
  },
  {
    id: 'passive_aggressive',
    name: 'Passive Aggressive',
    description: 'Expresses negativity indirectly',
    effects: { happinessModifier: -10, stressReliefBonus: -15, familyHappinessBonus: -5 }
  },
  {
    id: 'self_centered',
    name: 'Self-Centered',
    description: 'Puts their needs above everyone else',
    effects: { happinessModifier: -10, careerSupportBonus: -10, familyHappinessBonus: -10, expenseModifier: 15 }
  }
]

export interface Partner {
  id: string
  firstName: string
  lastName: string
  maidenName?: string         // If married and took your name
  age: number
  nationality: Country
  
  // Background
  origin: PartnerOrigin
  career: PartnerCareer
  careerIncome: number        // Monthly income from their career
  
  // Personality
  traits: string[]            // PartnerTrait IDs
  
  // Bio - AI-generated backstory and personality details
  bio?: import('@/types/personalLife').SocialBio
  
  // Relationship
  relationshipStatus: RelationshipStatus
  relationshipStartDate?: { week: number; year: number }
  engagementDate?: { week: number; year: number }
  marriageDate?: { week: number; year: number }
  
  // Happiness metrics
  happiness: number           // 0-100
  loveLevel: number           // 0-100 (how much they love you)
  trustLevel: number          // 0-100
  compatibilityScore: number  // 0-100 (calculated from traits)
  
  // Recent mood factors
  recentMoodFactors: MoodFactor[]
  
  // Children together
  childrenIds: string[]
  
  // Desires and preferences
  desires: PartnerDesires
  
  // Deal breaker tracking
  dealBreakerViolationCount: Record<string, number>  // Maps deal breaker string -> violation count
  dealBreakerWarningsGiven: string[]                 // Deal breakers that have triggered an ultimatum
  lastDealBreakerCheckWeek?: number                  // Prevents duplicate checks in same week
  
  // Physical appearance (for UI/flavor)
  appearance?: {
    hairColor: string
    eyeColor: string
    style: 'elegant' | 'casual' | 'sporty' | 'glamorous' | 'bohemian'
  }
}

export interface MoodFactor {
  reason: string
  impact: number              // Positive or negative
  weeksRemaining: number      // How long this affects mood
  category: 'relationship' | 'lifestyle' | 'family' | 'career' | 'social'
}

export interface PartnerDesires {
  wantsChildren: boolean
  desiredChildrenCount: number
  wantsMarriage: boolean
  lifestyleExpectations: 'modest' | 'comfortable' | 'affluent' | 'luxury' | 'ultra_luxury'
  qualityTimeImportance: number   // 0-100
  careerSupportImportance: number // 0-100
  socialLifeImportance: number    // 0-100
  privacyImportance: number       // 0-100
}

// ============================================
// DATING SYSTEM
// ============================================

export type DateType =
  | 'casual_dinner'
  | 'fancy_restaurant'
  | 'movie_night'
  | 'sporting_event'
  | 'weekend_getaway'
  | 'exotic_vacation'
  | 'yacht_cruise'
  | 'private_concert'
  | 'home_cooked'

export type LoveLanguageType =
  | 'words_of_affirmation'
  | 'acts_of_service'
  | 'receiving_gifts'
  | 'quality_time'
  | 'physical_touch'

export interface DateOption {
  type: DateType
  name: string
  description: string
  cost: number
  duration: 'evening' | 'day' | 'weekend' | 'week'
  
  // Effects
  happinessGain: number
  loveLevelGain: number
  trustGain: number
  
  // Requirements/bonuses
  requiresPrivacy?: boolean
  requiresWealth?: number       // Minimum net worth
  traitBonuses?: Record<string, number>  // Extra gain if partner has trait
  loveLanguageTag?: LoveLanguageType     // Which love language this date appeals to
  interestTags?: string[]                // Interest categories for bonus matching
}

export const DATE_OPTIONS: DateOption[] = [
  {
    type: 'casual_dinner',
    name: 'Casual Dinner',
    description: 'Relaxed meal at a nice restaurant',
    cost: 200,
    duration: 'evening',
    happinessGain: 5,
    loveLevelGain: 3,
    trustGain: 2,
    traitBonuses: { practical: 3, private: 2 },
    loveLanguageTag: 'quality_time',
    interestTags: ['fine_dining']
  },
  {
    type: 'fancy_restaurant',
    name: 'Fine Dining',
    description: 'Michelin-starred restaurant experience',
    cost: 1500,
    duration: 'evening',
    happinessGain: 8,
    loveLevelGain: 5,
    trustGain: 3,
    traitBonuses: { glamorous: 5, high_maintenance: 5 },
    loveLanguageTag: 'quality_time',
    interestTags: ['fine_dining', 'luxury']
  },
  {
    type: 'movie_night',
    name: 'Movie Night',
    description: 'Cozy evening at home or private screening',
    cost: 50,
    duration: 'evening',
    happinessGain: 4,
    loveLevelGain: 4,
    trustGain: 3,
    requiresPrivacy: true,
    traitBonuses: { private: 4, practical: 2 },
    loveLanguageTag: 'physical_touch',
    interestTags: ['entertainment']
  },
  {
    type: 'sporting_event',
    name: 'Sporting Event',
    description: 'VIP box at a major sporting event',
    cost: 3000,
    duration: 'evening',
    happinessGain: 7,
    loveLevelGain: 4,
    trustGain: 2,
    traitBonuses: { racing_enthusiast: 6, adventurous: 3 },
    loveLanguageTag: 'quality_time',
    interestTags: ['sports', 'motorsport', 'entertainment']
  },
  {
    type: 'weekend_getaway',
    name: 'Weekend Getaway',
    description: 'Quick escape to a romantic destination',
    cost: 5000,
    duration: 'weekend',
    happinessGain: 12,
    loveLevelGain: 8,
    trustGain: 5,
    traitBonuses: { adventurous: 5, supportive: 3 },
    loveLanguageTag: 'physical_touch',
    interestTags: ['travel', 'adventure']
  },
  {
    type: 'exotic_vacation',
    name: 'Exotic Vacation',
    description: 'Luxury trip to an exotic destination',
    cost: 25000,
    duration: 'week',
    happinessGain: 20,
    loveLevelGain: 15,
    trustGain: 8,
    requiresWealth: 1000000,
    traitBonuses: { glamorous: 8, adventurous: 8, high_maintenance: 5 },
    loveLanguageTag: 'quality_time',
    interestTags: ['travel', 'luxury', 'adventure']
  },
  {
    type: 'yacht_cruise',
    name: 'Yacht Cruise',
    description: 'Private yacht experience',
    cost: 15000,
    duration: 'weekend',
    happinessGain: 15,
    loveLevelGain: 10,
    trustGain: 6,
    requiresWealth: 5000000,
    traitBonuses: { glamorous: 6, social_butterfly: 4 },
    loveLanguageTag: 'quality_time',
    interestTags: ['luxury', 'socializing', 'travel']
  },
  {
    type: 'private_concert',
    name: 'Private Concert',
    description: 'Exclusive performance by their favorite artist',
    cost: 50000,
    duration: 'evening',
    happinessGain: 25,
    loveLevelGain: 15,
    trustGain: 5,
    requiresWealth: 10000000,
    traitBonuses: { high_maintenance: 10, glamorous: 8 },
    loveLanguageTag: 'receiving_gifts',
    interestTags: ['music', 'luxury', 'entertainment']
  },
  {
    type: 'home_cooked',
    name: 'Home Cooked Meal',
    description: 'Personal touch - cooking together at home',
    cost: 100,
    duration: 'evening',
    happinessGain: 6,
    loveLevelGain: 6,
    trustGain: 5,
    requiresPrivacy: true,
    traitBonuses: { practical: 5, supportive: 4, nurturing: 4 },
    loveLanguageTag: 'acts_of_service',
    interestTags: ['fine_dining']
  }
]

// ============================================
// MARRIAGE SYSTEM
// ============================================

export type WeddingType =
  | 'courthouse'
  | 'intimate'
  | 'traditional'
  | 'destination'
  | 'celebrity'

export interface WeddingOption {
  type: WeddingType
  name: string
  description: string
  baseCost: number
  guestCount: { min: number; max: number }
  
  // Effects
  publicImageBonus: number
  partnerHappinessBonus: number
  mediaAttention: number        // 0-100
  
  // Requirements
  requiresReputation?: number
  requiresWealth?: number
}

export const WEDDING_OPTIONS: WeddingOption[] = [
  {
    type: 'courthouse',
    name: 'Courthouse Wedding',
    description: 'Simple, private ceremony at city hall',
    baseCost: 500,
    guestCount: { min: 2, max: 10 },
    publicImageBonus: 0,
    partnerHappinessBonus: -5,  // Some partners want more
    mediaAttention: 5
  },
  {
    type: 'intimate',
    name: 'Intimate Ceremony',
    description: 'Small gathering of close friends and family',
    baseCost: 25000,
    guestCount: { min: 20, max: 50 },
    publicImageBonus: 5,
    partnerHappinessBonus: 10,
    mediaAttention: 20
  },
  {
    type: 'traditional',
    name: 'Traditional Wedding',
    description: 'Classic ceremony with all the trimmings',
    baseCost: 100000,
    guestCount: { min: 100, max: 200 },
    publicImageBonus: 10,
    partnerHappinessBonus: 15,
    mediaAttention: 40
  },
  {
    type: 'destination',
    name: 'Destination Wedding',
    description: 'Exotic location for you and your closest',
    baseCost: 250000,
    guestCount: { min: 50, max: 150 },
    publicImageBonus: 15,
    partnerHappinessBonus: 20,
    mediaAttention: 60,
    requiresWealth: 2000000
  },
  {
    type: 'celebrity',
    name: 'Celebrity Wedding',
    description: 'No expense spared, magazine-cover worthy',
    baseCost: 1000000,
    guestCount: { min: 200, max: 500 },
    publicImageBonus: 25,
    partnerHappinessBonus: 25,
    mediaAttention: 100,
    requiresReputation: 70,
    requiresWealth: 10000000
  }
]

export interface PrenupAgreement {
  enabled: boolean
  protectedAssets: {
    preMarriageWealth: boolean
    businessInterests: boolean
    teamEquity: boolean
    realEstate: boolean
    inheritances: boolean
  }
  alimonyTerms?: {
    yearsOfMarriageThreshold: number
    monthlyAmount: number
    durationYears: number
  }
  partnerReaction: number     // -100 to +100 (negative = unhappy about prenup)
}

// ============================================
// CHILDREN SYSTEM
// ============================================

export type ChildGender = 'male' | 'female'

export interface ChildTrait {
  id: string
  name: string
  description: string
  category: 'personality' | 'aptitude' | 'interest'
  inheritedChance?: number    // Chance to inherit from parent
  effects: {
    racingAptitude?: number
    academicAptitude?: number
    socialSkills?: number
    creativity?: number
    discipline?: number
    ambition?: number
  }
}

export const CHILD_TRAITS: ChildTrait[] = [
  // Personality traits
  {
    id: 'determined',
    name: 'Determined',
    description: 'Never gives up easily',
    category: 'personality',
    effects: { discipline: 15, ambition: 10, racingAptitude: 5 }
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Thinks outside the box',
    category: 'personality',
    effects: { creativity: 20, academicAptitude: 5 }
  },
  {
    id: 'competitive',
    name: 'Competitive',
    description: 'Always wants to win',
    category: 'personality',
    inheritedChance: 40,
    effects: { ambition: 15, racingAptitude: 10, socialSkills: -5 }
  },
  {
    id: 'calm',
    name: 'Calm Under Pressure',
    description: 'Stays cool in tough situations',
    category: 'personality',
    inheritedChance: 30,
    effects: { racingAptitude: 15, discipline: 10 }
  },
  {
    id: 'charismatic',
    name: 'Charismatic',
    description: 'Natural people person',
    category: 'personality',
    effects: { socialSkills: 20, creativity: 5 }
  },
  
  // Aptitude traits
  {
    id: 'natural_talent',
    name: 'Natural Racing Talent',
    description: 'Born to race',
    category: 'aptitude',
    inheritedChance: 25,
    effects: { racingAptitude: 25 }
  },
  {
    id: 'quick_learner',
    name: 'Quick Learner',
    description: 'Picks things up fast',
    category: 'aptitude',
    effects: { academicAptitude: 15, racingAptitude: 10 }
  },
  {
    id: 'technical_mind',
    name: 'Technical Mind',
    description: 'Understands mechanics naturally',
    category: 'aptitude',
    inheritedChance: 20,
    effects: { racingAptitude: 10, academicAptitude: 10 }
  },
  
  // Interest traits
  {
    id: 'racing_obsessed',
    name: 'Racing Obsessed',
    description: 'Lives and breathes motorsport',
    category: 'interest',
    inheritedChance: 50,
    effects: { racingAptitude: 15, discipline: 10 }
  },
  {
    id: 'business_minded',
    name: 'Business Minded',
    description: 'Interested in the business side',
    category: 'interest',
    effects: { academicAptitude: 10, ambition: 15 }
  },
  {
    id: 'artistic',
    name: 'Artistic',
    description: 'Drawn to creative pursuits',
    category: 'interest',
    effects: { creativity: 20, racingAptitude: -10 }
  }
]

export type ChildCareerPath =
  | 'racing_driver'
  | 'team_manager'
  | 'engineer'
  | 'business'
  | 'media'
  | 'other'
  | 'undecided'

export interface Child {
  id: string
  firstName: string
  lastName: string
  gender: ChildGender
  birthDate: { week: number; year: number }
  age: number
  
  // Parents
  biologicalParentIds: string[]   // Player + partner (or could be adopted)
  isAdopted: boolean
  
  // Traits
  traits: string[]                // ChildTrait IDs
  
  // Development scores (0-100)
  development: {
    racingAptitude: number
    academicAptitude: number
    socialSkills: number
    creativity: number
    discipline: number
    ambition: number
    physicalFitness: number
  }
  
  // Relationship with player
  bondLevel: number               // 0-100
  recentInteractions: ChildInteraction[]
  
  // Education
  education: {
    currentLevel: 'preschool' | 'elementary' | 'middle_school' | 'high_school' | 'university' | 'graduated'
    schoolType: 'public' | 'private' | 'boarding' | 'homeschool'
    performance: number           // 0-100 academic performance
    extracurriculars: string[]    // Activities
  }
  
  // Racing development (if pursuing racing)
  racingDevelopment?: {
    isActive: boolean
    currentLevel: 'karting' | 'junior_formula' | 'regional' | 'national' | 'professional'
    yearsExperience: number
    results: ChildRacingResult[]
    potentialRating: number       // 0-100, represents ceiling
    currentRating: number         // 0-100, current ability
  }
  
  // Career path
  careerPath: ChildCareerPath
  careerInterestLevel: number     // How interested in racing career
  
  // Happiness
  happiness: number               // 0-100
}

export interface ChildInteraction {
  type: 'quality_time' | 'racing_activity' | 'education_support' | 'discipline' | 'celebration' | 'support'
  description: string
  date: { week: number; year: number }
  bondImpact: number
  happinessImpact: number
}

export interface ChildRacingResult {
  event: string
  position: number
  totalParticipants: number
  level: string
  date: { week: number; year: number }
  notes?: string
}

// ============================================
// DYNASTY SYSTEM
// ============================================

export interface FamilyMember {
  id: string
  firstName: string
  lastName: string
  relationship: 'player' | 'spouse' | 'child' | 'grandchild' | 'parent' | 'sibling'
  generation: number            // 1 = founder, 2 = children, etc.
  
  // Status
  isAlive: boolean
  birthDate?: { week: number; year: number }
  deathDate?: { week: number; year: number }
  
  // If they're a racing driver
  racingCareer?: {
    active: boolean
    totalRaces: number
    wins: number
    championships: number
    peakRating: number
  }
  
  // If they ran the team
  teamLeadership?: {
    startDate: { week: number; year: number }
    endDate?: { week: number; year: number }
    championshipsWon: number
    teamHighestTier: string
  }
}

export interface FamilyTree {
  founderId: string
  founderName: string
  dynastyStartDate: { week: number; year: number }
  
  // All family members (living and deceased)
  members: FamilyMember[]
  
  // Relationships
  marriages: Array<{
    partner1Id: string
    partner2Id: string
    marriageDate: { week: number; year: number }
    divorceDate?: { week: number; year: number }
    childrenIds: string[]
  }>
  
  // Dynasty achievements
  achievements: DynastyAchievement[]
  
  // Legacy stats
  legacy: {
    generationsActive: number
    totalFamilyChampionships: number
    totalFamilyWins: number
    totalFamilyRaces: number
    yearsInMotorsport: number
    familyNetWorth: number
    notableDrivers: string[]
    notableTeamPrincipals: string[]
  }
}

export interface DynastyAchievement {
  id: string
  name: string
  description: string
  unlockedDate: { week: number; year: number }
  category: 'family' | 'racing' | 'business' | 'legacy'
}

export const DYNASTY_ACHIEVEMENTS = [
  { id: 'first_marriage', name: 'Family Founded', category: 'family' },
  { id: 'first_child', name: 'New Generation', category: 'family' },
  { id: 'child_wins_race', name: 'Chip Off The Block', category: 'racing' },
  { id: 'child_wins_championship', name: 'Racing Dynasty', category: 'racing' },
  { id: 'three_generations', name: 'Three Generations', category: 'legacy' },
  { id: 'dynasty_wealth', name: 'Family Fortune', category: 'business' },
  { id: 'ten_family_championships', name: 'Legendary Dynasty', category: 'legacy' }
]

// ============================================
// RELATIONSHIP EVENTS
// ============================================

export interface RelationshipEvent {
  id: string
  type: 'positive' | 'negative' | 'neutral' | 'milestone'
  category: 'dating' | 'marriage' | 'family' | 'conflict' | 'surprise'
  title: string
  description: string
  
  // Effects
  partnerHappinessChange: number
  loveChange: number
  trustChange: number
  publicImageChange?: number
  
  // Choices (if any)
  choices?: Array<{
    id: string
    text: string
    effects: {
      happiness?: number
      love?: number
      trust?: number
      cost?: number
    }
  }>
}

// ============================================
// CONFIGURATION CONSTANTS
// ============================================

export const RELATIONSHIP_CONFIG = {
  // Dating
  datingMinWeeks: 12,           // Minimum weeks dating before proposal
  engagementMinWeeks: 8,        // Minimum weeks engaged before wedding
  
  // Happiness thresholds
  happinessThresholds: {
    miserable: 20,
    unhappy: 40,
    content: 60,
    happy: 80,
    ecstatic: 95
  },
  
  // Weekly decay/growth
  weeklyBondDecay: 0.5,         // Happiness decays if no interaction
  qualityTimeBonus: 3,          // Bonus for spending time together
  
  // Divorce triggers
  divorceHappinessThreshold: 20, // Below this for extended period = risk
  divorceRiskWeeks: 26,          // Weeks unhappy before divorce risk
  
  // Children
  childAgeForKarting: 8,
  childAgeForJuniorFormula: 14,
  childAgeForAdulthood: 18,
  maxChildren: 6,
  
  // Inheritance (when passing the torch)
  childMinAgeForSuccession: 25,
  
  // Costs
  monthlyChildCost: {
    infant: 2000,
    toddler: 2500,
    child: 3000,
    teenager: 4000,
    youngAdult: 1000  // If still supporting
  },
  
  privateSchoolMultiplier: 3,   // 3x cost for private school
  boardingSchoolMultiplier: 5,  // 5x cost for boarding school
  
  // Karting costs
  kartingAnnualCost: 30000,
  juniorFormulaAnnualCost: 150000
}

// ============================================
// DEAL BREAKER SYSTEM
// ============================================

/**
 * Snapshot of game state used by deal breaker checks.
 * Callers build this from the full store state.
 */
export interface DealBreakerGameState {
  // Financial
  personalNetWorth: number
  teamCashBalance: number
  teamBudgetDeficit: number
  // Career / performance
  teamPerformanceTrend: 'improving' | 'stable' | 'declining'
  weeksWithoutUpgrade: number
  recentRaceResults: Array<{ position: number; dnf?: boolean }>
  // Social
  socialEventsDeclinedRecently: number
  socialEventsAttendedRecently: number
  weeksSinceLastDate: number
  weeksSinceLastQualityTime: number
  // Lifestyle
  lifestyleTier: string
  recentMediaScandals: number
  publicSocialMediaPosts: number
  // Relationship context
  partnerTraits: string[]
  weeksInRelationship: number
  isMarried: boolean
  hasChildren: boolean
  childrenCount: number
  // Player behavior
  alcoholEventsRecently: number
  gamblingEventsRecently: number
  lateNightEventsRecently: number
  otherFemaleContactsHighAffection: number
}

export interface DealBreakerMapping {
  /** Function to check if this deal breaker is currently violated */
  check: (gs: DealBreakerGameState) => boolean
  /** Trust damage per weekly violation */
  trustDamage: number
  /** Romance damage per weekly violation */
  romanceDamage: number
  /** Warning message template (partner name will be prefixed) */
  warningMessage: string
  /** Number of violations before an ultimatum event triggers */
  ultimatumAfter: number
}

/**
 * Maps deal breaker strings (as they appear in partner profiles) to
 * mechanical game-state checks and consequences.
 */
export const DEAL_BREAKER_MAPPINGS: Record<string, DealBreakerMapping> = {
  'Lack of ambition': {
    check: (gs) => gs.teamPerformanceTrend === 'declining' && gs.weeksWithoutUpgrade > 8,
    trustDamage: -3,
    romanceDamage: -2,
    warningMessage: 'feels like you\'ve lost your drive',
    ultimatumAfter: 4
  },
  'Financial instability': {
    check: (gs) => gs.personalNetWorth < 0 || gs.teamBudgetDeficit > 50000,
    trustDamage: -4,
    romanceDamage: -2,
    warningMessage: 'is worried about your financial situation',
    ultimatumAfter: 3
  },
  'Disinterest in social events': {
    check: (gs) => gs.socialEventsDeclinedRecently >= 3,
    trustDamage: -2,
    romanceDamage: -3,
    warningMessage: 'is upset you keep skipping social events',
    ultimatumAfter: 5
  },
  'Workaholism': {
    check: (gs) => gs.weeksSinceLastDate > 4 && gs.weeksSinceLastQualityTime > 3,
    trustDamage: -3,
    romanceDamage: -3,
    warningMessage: 'feels like you only care about work',
    ultimatumAfter: 4
  },
  'Infidelity': {
    check: (gs) => gs.otherFemaleContactsHighAffection >= 2,
    trustDamage: -6,
    romanceDamage: -4,
    warningMessage: 'has noticed how close you are with other people',
    ultimatumAfter: 2
  },
  'Dishonesty': {
    check: (gs) => gs.recentMediaScandals >= 2,
    trustDamage: -5,
    romanceDamage: -2,
    warningMessage: 'doesn\'t feel like they can trust you anymore',
    ultimatumAfter: 3
  },
  'Neglect': {
    check: (gs) => gs.weeksSinceLastQualityTime > 5,
    trustDamage: -3,
    romanceDamage: -4,
    warningMessage: 'feels completely neglected',
    ultimatumAfter: 3
  },
  'Poor lifestyle choices': {
    check: (gs) => gs.alcoholEventsRecently >= 3 || gs.gamblingEventsRecently >= 2,
    trustDamage: -3,
    romanceDamage: -2,
    warningMessage: 'is concerned about your lifestyle choices',
    ultimatumAfter: 4
  },
  'Reckless spending': {
    check: (gs) => gs.teamCashBalance < 0 && gs.personalNetWorth < 100000,
    trustDamage: -3,
    romanceDamage: -2,
    warningMessage: 'is frustrated by your reckless spending',
    ultimatumAfter: 4
  },
  'Lack of emotional support': {
    check: (gs) => gs.weeksSinceLastQualityTime > 4,
    trustDamage: -2,
    romanceDamage: -3,
    warningMessage: 'doesn\'t feel emotionally supported',
    ultimatumAfter: 4
  },
  'Constant travelling': {
    check: (gs) => gs.weeksSinceLastDate > 3 && gs.socialEventsAttendedRecently < 1,
    trustDamage: -2,
    romanceDamage: -3,
    warningMessage: 'is tired of you always being away',
    ultimatumAfter: 5
  },
  'Public embarrassment': {
    check: (gs) => gs.recentMediaScandals >= 1 && gs.publicSocialMediaPosts >= 3,
    trustDamage: -4,
    romanceDamage: -3,
    warningMessage: 'is mortified by the public attention',
    ultimatumAfter: 3
  },
  'Lack of family focus': {
    check: (gs) => gs.isMarried && gs.weeksSinceLastQualityTime > 4,
    trustDamage: -3,
    romanceDamage: -2,
    warningMessage: 'feels like family isn\'t a priority for you',
    ultimatumAfter: 4
  },
  'Excessive partying': {
    check: (gs) => gs.lateNightEventsRecently >= 3 || gs.alcoholEventsRecently >= 3,
    trustDamage: -3,
    romanceDamage: -2,
    warningMessage: 'thinks you party too much',
    ultimatumAfter: 4
  },
  'Career stagnation': {
    check: (gs) => gs.weeksWithoutUpgrade > 12 && gs.teamPerformanceTrend !== 'improving',
    trustDamage: -2,
    romanceDamage: -2,
    warningMessage: 'is worried your career isn\'t going anywhere',
    ultimatumAfter: 5
  },
  'Controlling behavior': {
    check: (gs) => gs.socialEventsDeclinedRecently >= 2 && gs.weeksSinceLastQualityTime > 3,
    trustDamage: -3,
    romanceDamage: -3,
    warningMessage: 'feels suffocated by your expectations',
    ultimatumAfter: 3
  },
  'Selfishness': {
    check: (gs) => gs.weeksSinceLastDate > 4 && gs.socialEventsAttendedRecently >= 2,
    trustDamage: -3,
    romanceDamage: -3,
    warningMessage: 'feels like everything is always about you',
    ultimatumAfter: 4
  },
  'Lack of romance': {
    check: (gs) => gs.weeksSinceLastDate > 6,
    trustDamage: -1,
    romanceDamage: -5,
    warningMessage: 'feels like the romance has died',
    ultimatumAfter: 4
  }
}

/**
 * Find the closest matching deal breaker mapping for a given string.
 * Does fuzzy matching: checks if any mapping key is contained in the
 * deal breaker string (case-insensitive) or vice versa.
 */
export function findDealBreakerMapping(dealBreaker: string): DealBreakerMapping | undefined {
  // Exact match first
  if (DEAL_BREAKER_MAPPINGS[dealBreaker]) return DEAL_BREAKER_MAPPINGS[dealBreaker]
  
  // Fuzzy match: check if any key is contained in the deal breaker or vice versa
  const lower = dealBreaker.toLowerCase()
  for (const [key, mapping] of Object.entries(DEAL_BREAKER_MAPPINGS)) {
    const keyLower = key.toLowerCase()
    if (lower.includes(keyLower) || keyLower.includes(lower)) return mapping
    // Keyword match
    const keywords = keyLower.split(/\s+/)
    const matchCount = keywords.filter(kw => kw.length > 3 && lower.includes(kw)).length
    if (matchCount >= 2 || (keywords.length <= 2 && matchCount >= 1)) return mapping
  }
  
  // Fallback: generic deal breaker with mild consequences
  return {
    check: (gs) => gs.weeksSinceLastQualityTime > 5 || gs.weeksSinceLastDate > 5,
    trustDamage: -2,
    romanceDamage: -2,
    warningMessage: 'seems unhappy about something',
    ultimatumAfter: 5
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function calculateCompatibility(_playerTraits: string[], partnerTraits: string[]): number {
  // Base compatibility
  let compatibility = 50
  
  // Positive trait combinations
  const goodCombos = [
    ['supportive', 'racing_enthusiast'],
    ['practical', 'supportive'],
    ['nurturing', 'practical'],
    ['adventurous', 'social_butterfly']
  ]
  
  // Negative trait combinations  
  const badCombos = [
    ['jealous', 'social_butterfly'],
    ['high_maintenance', 'practical'],
    ['private', 'glamorous']
  ]
  
  for (const combo of goodCombos) {
    if (partnerTraits.includes(combo[0]) || partnerTraits.includes(combo[1])) {
      compatibility += 10
    }
  }
  
  for (const combo of badCombos) {
    if (partnerTraits.includes(combo[0]) && partnerTraits.includes(combo[1])) {
      compatibility -= 15
    }
  }
  
  // Racing enthusiast is always a plus
  if (partnerTraits.includes('racing_enthusiast')) {
    compatibility += 15
  }
  
  return Math.max(0, Math.min(100, compatibility))
}

export function getPartnerTraitById(id: string): PartnerTrait | undefined {
  return PARTNER_TRAITS.find(t => t.id === id)
}

export function getChildTraitById(id: string): ChildTrait | undefined {
  return CHILD_TRAITS.find(t => t.id === id)
}

export function calculateChildDevelopmentCost(child: Child): number {
  const config = RELATIONSHIP_CONFIG
  
  let baseCost = 0
  if (child.age < 1) baseCost = config.monthlyChildCost.infant
  else if (child.age < 4) baseCost = config.monthlyChildCost.toddler
  else if (child.age < 13) baseCost = config.monthlyChildCost.child
  else if (child.age < 18) baseCost = config.monthlyChildCost.teenager
  else baseCost = config.monthlyChildCost.youngAdult
  
  // School multiplier
  if (child.education.schoolType === 'private') {
    baseCost *= config.privateSchoolMultiplier
  } else if (child.education.schoolType === 'boarding') {
    baseCost *= config.boardingSchoolMultiplier
  }
  
  // Racing development cost
  if (child.racingDevelopment?.isActive) {
    if (child.racingDevelopment.currentLevel === 'karting') {
      baseCost += config.kartingAnnualCost / 12
    } else if (child.racingDevelopment.currentLevel === 'junior_formula') {
      baseCost += config.juniorFormulaAnnualCost / 12
    }
  }
  
  return Math.round(baseCost)
}
