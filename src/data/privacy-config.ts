// ============================================
// PRIVACY & PAPARAZZI CONFIGURATION
// ============================================
// System for managing privacy, paparazzi encounters, and media leaks.

// ============================================
// PRIVACY LEVELS
// ============================================

export type PrivacyLevel = 
  | 'open'          // Public life, welcomes media
  | 'balanced'      // Normal celebrity approach
  | 'private'       // Limits exposure
  | 'reclusive'     // Avoids all media

// ============================================
// PRIVACY STATE
// ============================================

export interface PrivacyState {
  privacyLevel: PrivacyLevel
  
  // Security
  securityTeamSize: number
  securityBudget: number        // Monthly
  homeSecurityLevel: number     // 0-100
  hasSecureCompound: boolean
  
  // Paparazzi
  paparazziInterest: number     // 0-100, how much they follow you
  knownHangouts: KnownLocation[]
  paparazziAgencies: PaparazziAgency[]
  
  // Sightings
  recentSightings: PaparazziSighting[]
  
  // Leaks
  leakedStories: LeakedStory[]
  pendingLeaks: PendingLeak[]
  
  // Legal
  activeRestrainingOrders: number
  lawsuitsAgainstMedia: MediaLawsuit[]
  privacyLawyer?: PrivacyLawyer
  
  // Stats
  photosSoldThisYear: number
  storiesLeakedThisYear: number
  legalVictories: number
}

// ============================================
// LOCATIONS
// ============================================

export interface KnownLocation {
  id: string
  name: string
  type: 'residence' | 'restaurant' | 'gym' | 'club' | 'shop' | 'school' | 'other'
  
  // Discovery
  discoveredDate: { week: number; year: number }
  howDiscovered: 'followed' | 'social_media_post' | 'insider_tip' | 'pattern_analysis'
  
  // Paparazzi presence
  paparazziRating: number       // 0-100, how often they stake it out
  photoOpportunityRating: number
  
  // Can be made secure
  canSecure: boolean
  securityCost?: number
  isSecured: boolean
}

// ============================================
// PAPARAZZI
// ============================================

export interface PaparazziAgency {
  id: string
  name: string
  reputation: 'tabloid' | 'mainstream' | 'legitimate'
  aggressiveness: number        // 0-100
  payRate: number               // What they pay per good shot
  
  // Relationship
  hasExclusiveDeal: boolean
  relationshipLevel: number     // -100 to 100
  
  // History
  photosSoldToThem: number
  storiesLeakedFrom: number
}

export interface PaparazziSighting {
  id: string
  date: { week: number; day: number; year: number }
  location: string
  
  // What happened
  wasPhotographed: boolean
  whoWasWithYou: string[]
  activityCaptured: string
  emotionalStateCaptured: 'happy' | 'neutral' | 'upset' | 'angry' | 'intimate'
  
  // Photos
  photoQuality: 'poor' | 'decent' | 'good' | 'excellent'
  photosSold: boolean
  
  // Publication
  photosPublished: boolean
  publicationName?: string
  publicationDate?: { week: number; day: number; year: number }
  storyAngle?: string           // How they spun it
  headline?: string
  
  // Impact
  reputationImpact: number
  partnerReaction?: string
  sponsorConcerns?: string[]
}

// ============================================
// LEAKS
// ============================================

export interface LeakedStory {
  id: string
  type: LeakType
  headline: string
  content: string
  
  // Source
  leakSource: LeakSource
  sourceName?: string           // If known
  accuracy: number              // 0-100, how true is it
  
  // Publication
  publicationName: string
  publicationDate: { week: number; year: number }
  
  // Impact
  publicReaction: 'sympathetic' | 'curious' | 'judgmental' | 'outraged'
  viralLevel: number            // 0-100
  daysInNews: number
  
  // Damage
  reputationDamage: number
  partnerTrustDamage: number
  sponsorConcerns: { sponsorId: string; concernLevel: number }[]
  
  // Response
  hasResponded: boolean
  responseType?: LeakResponse
  responseEffectiveness?: number
}

export type LeakType = 
  | 'relationship'    // Dating, cheating, breakup
  | 'financial'       // Spending, debt, tax
  | 'health'          // Medical issues
  | 'scandal'         // Bad behavior
  | 'business'        // Team/business deals
  | 'family'          // Family drama
  | 'legal'           // Lawsuits, settlements
  | 'political'       // Political views

export type LeakSource = 
  | 'paparazzi'
  | 'insider'         // Team member, staff
  | 'ex_partner'
  | 'ex_staff'
  | 'family_member'
  | 'hack'            // Phone/email hack
  | 'rival'
  | 'unknown'

export type LeakResponse = 
  | 'deny'
  | 'confirm'
  | 'no_comment'
  | 'legal_action'
  | 'spin'            // Redirect narrative
  | 'emotional_plea'  // Ask for privacy
  | 'full_statement'

export interface PendingLeak {
  id: string
  type: LeakType
  description: string
  
  // What's at risk
  potentialHeadlines: string[]
  accuracyIfLeaked: number
  
  // Risk
  leakProbability: number       // 0-100
  estimatedWeeksUntilLeak: number
  
  // Source
  likelySource: LeakSource
  sourceKnown: boolean
  
  // Prevention
  canBePrevented: boolean
  preventionOptions: PreventionOption[]
  
  // Potential damage
  potentialReputationDamage: number
  potentialPartnerDamage: number
  potentialSponsorDamage: number
}

export interface PreventionOption {
  id: string
  method: 'nda' | 'payoff' | 'legal_threat' | 'buy_exclusive' | 'preemptive_statement' | 'source_management'
  description: string
  cost: number
  successChance: number         // 0-100
  ethicalRating: 'clean' | 'gray' | 'questionable'
}

// ============================================
// LEGAL
// ============================================

export interface MediaLawsuit {
  id: string
  defendant: string             // Publication name
  type: 'defamation' | 'invasion_privacy' | 'harassment' | 'copyright'
  
  // Case
  filing: { week: number; year: number }
  status: 'filed' | 'discovery' | 'trial' | 'settled' | 'won' | 'lost'
  
  // Financial
  legalCosts: number
  claimedDamages: number
  settlementAmount?: number
  awardedAmount?: number
  
  // Timeline
  estimatedResolutionWeeks: number
  
  // Impact
  publicPerception: 'supportive' | 'mixed' | 'against_you'
}

export interface PrivacyLawyer {
  id: string
  name: string
  firm: string
  
  // Quality
  reputation: number            // 0-100
  winRate: number              // Percentage
  
  // Costs
  retainerMonthly: number
  hourlyRate: number
  
  // Specialties
  specialties: ('defamation' | 'privacy' | 'harassment' | 'contracts')[]
  
  // Relationship
  yearsWorkedTogether: number
  casesHandled: number
}

// ============================================
// PAPARAZZI EVENT TEMPLATES
// ============================================

export interface PaparazziEventTemplate {
  id: string
  scenario: string
  probability: number           // Base chance per week
  
  // Triggers
  triggers: {
    newRelationship?: boolean
    recentScandal?: boolean
    raceWeek?: boolean
    socialEvent?: boolean
    highProfile?: boolean       // If you're very famous
  }
  
  // What happens
  activityCaptured: string
  photoOpportunity: 'low' | 'medium' | 'high'
  
  // Potential stories
  possibleAngles: string[]
  
  // Impact range
  reputationImpact: { min: number; max: number }
}

export const PAPARAZZI_EVENTS: PaparazziEventTemplate[] = [
  {
    id: 'restaurant_date',
    scenario: 'Photographed leaving restaurant with partner',
    probability: 0.3,
    triggers: { highProfile: true },
    activityCaptured: 'Date night',
    photoOpportunity: 'medium',
    possibleAngles: ['Romantic night out', 'Spending big', 'Relationship goals'],
    reputationImpact: { min: -5, max: 5 }
  },
  {
    id: 'gym_candid',
    scenario: 'Photographed at gym',
    probability: 0.2,
    triggers: { highProfile: true },
    activityCaptured: 'Working out',
    photoOpportunity: 'low',
    possibleAngles: ['Fitness dedication', 'Looking tired', 'New workout partner?'],
    reputationImpact: { min: 0, max: 5 }
  },
  {
    id: 'argument_captured',
    scenario: 'Argument with partner captured',
    probability: 0.05,
    triggers: { newRelationship: true },
    activityCaptured: 'Heated discussion',
    photoOpportunity: 'high',
    possibleAngles: ['Trouble in paradise', 'Explosive argument', 'Relationship on the rocks'],
    reputationImpact: { min: -20, max: -5 }
  },
  {
    id: 'mystery_person',
    scenario: 'Photographed with unknown person',
    probability: 0.1,
    triggers: { highProfile: true },
    activityCaptured: 'Meeting someone',
    photoOpportunity: 'medium',
    possibleAngles: ['New romance?', 'Secret meeting', 'Business or pleasure?'],
    reputationImpact: { min: -15, max: 0 }
  },
  {
    id: 'family_outing',
    scenario: 'Family day out captured',
    probability: 0.15,
    triggers: { highProfile: true },
    activityCaptured: 'Family time',
    photoOpportunity: 'medium',
    possibleAngles: ['Family man', 'Doting parent', 'Happy family'],
    reputationImpact: { min: 0, max: 10 }
  },
  {
    id: 'late_night',
    scenario: 'Leaving club late at night',
    probability: 0.1,
    triggers: { socialEvent: true },
    activityCaptured: 'Night out',
    photoOpportunity: 'high',
    possibleAngles: ['Party lifestyle', 'Living it up', 'Worse for wear?'],
    reputationImpact: { min: -10, max: 0 }
  }
]

// ============================================
// CONFIGURATION
// ============================================

export const PRIVACY_CONFIG = {
  // Paparazzi interest factors
  interestFromWins: 2,          // Per race win
  interestFromScandal: 20,      // Per scandal
  interestFromRelationship: 15, // New relationship
  interestDecayPerWeek: 2,      // Natural decay
  
  // Security costs
  baseSecurityCost: 10000,      // Monthly for basic
  securityPerBodyguard: 8000,   // Monthly per guard
  homeSecurityInstallation: 50000,
  secureCompoundCost: 500000,
  
  // Legal costs
  lawyerRetainerBase: 5000,     // Monthly
  lawsuitFilingCost: 50000,
  averageSettlement: 250000,
  averageTrial: 500000,
  
  // Prevention costs
  ndaCost: 25000,
  payoffRange: { min: 50000, max: 500000 },
  exclusiveRightsCost: 100000,
  
  // Damage
  maxReputationDamagePerLeak: 30,
  trustDamageMultiplier: 1.5,
  
  // Privacy level effects
  privacyLevelEffects: {
    open: { paparazziInterest: 1.5, publicImageBonus: 10, privacyRisk: 1.5 },
    balanced: { paparazziInterest: 1.0, publicImageBonus: 0, privacyRisk: 1.0 },
    private: { paparazziInterest: 0.7, publicImageBonus: -5, privacyRisk: 0.7 },
    reclusive: { paparazziInterest: 0.3, publicImageBonus: -15, privacyRisk: 0.4 }
  }
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

export function createPrivacyState(): PrivacyState {
  return {
    privacyLevel: 'balanced',
    securityTeamSize: 0,
    securityBudget: 0,
    homeSecurityLevel: 20,
    hasSecureCompound: false,
    paparazziInterest: 30,
    knownHangouts: [],
    paparazziAgencies: [],
    recentSightings: [],
    leakedStories: [],
    pendingLeaks: [],
    activeRestrainingOrders: 0,
    lawsuitsAgainstMedia: [],
    photosSoldThisYear: 0,
    storiesLeakedThisYear: 0,
    legalVictories: 0
  }
}

export function createPaparazziSighting(
  location: string,
  companions: string[],
  activity: string
): PaparazziSighting {
  return {
    id: `sighting_${Date.now()}`,
    date: { week: 1, day: 1, year: 2024 }, // Should be set by caller
    location,
    wasPhotographed: true,
    whoWasWithYou: companions,
    activityCaptured: activity,
    emotionalStateCaptured: 'neutral',
    photoQuality: 'decent',
    photosSold: false,
    photosPublished: false,
    reputationImpact: 0
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function calculatePaparazziInterest(
  baseInterest: number,
  recentWins: number,
  recentScandals: number,
  isInRelationship: boolean,
  privacyLevel: PrivacyLevel
): number {
  let interest = baseInterest
  
  interest += recentWins * PRIVACY_CONFIG.interestFromWins
  interest += recentScandals * PRIVACY_CONFIG.interestFromScandal
  if (isInRelationship) interest += PRIVACY_CONFIG.interestFromRelationship
  
  interest *= PRIVACY_CONFIG.privacyLevelEffects[privacyLevel].paparazziInterest
  
  return Math.min(100, Math.max(0, interest))
}

export function calculateSecurityCost(state: PrivacyState): number {
  let cost = PRIVACY_CONFIG.baseSecurityCost
  cost += state.securityTeamSize * PRIVACY_CONFIG.securityPerBodyguard
  if (state.privacyLawyer) cost += state.privacyLawyer.retainerMonthly
  return cost
}

export function getPreventionOptions(leak: PendingLeak): PreventionOption[] {
  const options: PreventionOption[] = []
  
  // NDA always an option if source known
  if (leak.sourceKnown) {
    options.push({
      id: 'nda',
      method: 'nda',
      description: 'Get source to sign NDA',
      cost: PRIVACY_CONFIG.ndaCost,
      successChance: 60,
      ethicalRating: 'clean'
    })
  }
  
  // Payoff for insider leaks
  if (['insider', 'ex_staff', 'ex_partner'].includes(leak.likelySource)) {
    options.push({
      id: 'payoff',
      method: 'payoff',
      description: 'Pay for silence',
      cost: PRIVACY_CONFIG.payoffRange.min + 
            (PRIVACY_CONFIG.payoffRange.max - PRIVACY_CONFIG.payoffRange.min) * (leak.potentialReputationDamage / 100),
      successChance: 80,
      ethicalRating: 'gray'
    })
  }
  
  // Legal threat
  options.push({
    id: 'legal',
    method: 'legal_threat',
    description: 'Threaten legal action',
    cost: 10000,
    successChance: 40,
    ethicalRating: 'clean'
  })
  
  // Buy exclusive rights
  if (leak.likelySource === 'paparazzi') {
    options.push({
      id: 'buy_exclusive',
      method: 'buy_exclusive',
      description: 'Buy exclusive rights to photos/story',
      cost: PRIVACY_CONFIG.exclusiveRightsCost,
      successChance: 90,
      ethicalRating: 'clean'
    })
  }
  
  // Preemptive statement
  options.push({
    id: 'preemptive',
    method: 'preemptive_statement',
    description: 'Get ahead of story with your own statement',
    cost: 5000, // PR costs
    successChance: 70, // Reduces damage, doesn't prevent
    ethicalRating: 'clean'
  })
  
  return options
}
