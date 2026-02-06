// ============================================
// ACTIVISM & CAUSES CONFIGURATION
// ============================================
// System for supporting causes, political stances, and controversy management.

// ============================================
// CAUSE TYPES
// ============================================

export type CauseCategory = 
  | 'environmental'
  | 'social_justice'
  | 'health'
  | 'education'
  | 'motorsport'
  | 'humanitarian'
  | 'political'

export type SupportLevel = 
  | 'silent'        // Donate privately
  | 'public'        // Publicly support
  | 'active'        // Campaign actively
  | 'leading'       // Start/lead initiatives

// ============================================
// CAUSE INTERFACE
// ============================================

export interface Cause {
  id: string
  name: string
  category: CauseCategory
  description: string
  
  // Controversy level
  controversyLevel: number      // 0-100
  politicalAlignment: 'left' | 'center' | 'right' | 'nonpartisan'
  
  // Support landscape
  publicSupport: number         // % of public who support
  corporateSupport: number      // % of corporations who support
  
  // Sponsor risk
  sponsorRiskLevel: 'safe' | 'mild' | 'risky' | 'dangerous'
  riskySponsorTypes: string[]   // Industries that might object
}

export interface CauseSupport {
  id: string
  causeId: string
  causeName: string
  
  // Your involvement
  supportLevel: SupportLevel
  
  // Timeline
  startedSupporting: { week: number; year: number }
  
  // Actions taken
  publicStatements: number
  eventsAttended: number
  eventsHosted: number
  
  // Financial
  donationsTotal: number
  donationsThisYear: number
  
  // Impact
  awarenessRaised: number       // Media impressions
  fundsRaisedTotal: number      // Through your efforts
  legislationSupported: string[]
  
  // Consequences
  supportersGained: number
  criticsGained: number
  sponsorReactions: CauseSponsorReaction[]
  
  // Public perception
  isPubliclyKnown: boolean
  publicPerception: 'hero' | 'respected' | 'neutral' | 'controversial' | 'divisive'
}

export interface CauseSponsorReaction {
  sponsorId: string
  sponsorName: string
  reaction: 'supportive' | 'neutral' | 'concerned' | 'threatened' | 'terminated'
  reason: string
  satisfactionChange: number
}

// ============================================
// ACTIVISM EVENTS
// ============================================

export interface ActivismEvent {
  id: string
  causeId: string
  type: ActivismEventType
  name: string
  
  // Details
  date: { week: number; year: number }
  location: string
  
  // Your role
  yourRole: 'attendee' | 'speaker' | 'organizer' | 'funder' | 'face_of_campaign'
  
  // Visibility
  publicVisibility: 'low' | 'medium' | 'high' | 'viral'
  expectedMediaCoverage: boolean
  
  // Risk
  controversyRisk: number       // 0-100
  sponsorRiskLevel: 'safe' | 'mild' | 'risky' | 'dangerous'
  potentialBacklash: string[]
  
  // Benefits
  reputationGain: number
  causeImpact: number
  newSupporters: number
  mediaAttention: number
  
  // Networking
  notableAttendees: string[]
  networkingOpportunities: number
  
  // Cost
  participationCost: number     // Donations expected, etc.
  timeCost: number              // Hours
}

export type ActivismEventType = 
  | 'rally'
  | 'fundraiser'
  | 'press_conference'
  | 'documentary_appearance'
  | 'foundation_launch'
  | 'campaign_launch'
  | 'charity_race'
  | 'awareness_day'
  | 'legislative_meeting'
  | 'un_speech'

// ============================================
// POLITICAL STANCES
// ============================================

export interface PoliticalStance {
  id: string
  topic: string
  category: PoliticalCategory
  
  // Your position
  yourPosition: StancePosition
  isPublic: boolean
  
  // How people know
  statementsGiven: number
  socialMediaPosts: number
  interviewsMentioned: number
  
  // When you took the stance
  firstPublicStatement?: { week: number; year: number }
  
  // Controversy
  controversyLevel: number
  backlashReceived: boolean
  
  // Alignment with others
  alignedSponsors: string[]
  opposedSponsors: string[]
  alignedContacts: string[]
  opposedContacts: string[]
  
  // Impact
  followersGained: number
  followersLost: number
  reputationChange: number
}

export type PoliticalCategory = 
  | 'environment'
  | 'social'
  | 'economic'
  | 'international'
  | 'sports_governance'
  | 'human_rights'

export type StancePosition = 
  | 'strongly_against'
  | 'against'
  | 'neutral'
  | 'support'
  | 'strongly_support'

// ============================================
// CONTROVERSY EVENTS
// ============================================

export interface ControversyEvent {
  id: string
  causeId?: string
  stanceId?: string
  
  // What happened
  trigger: string               // What caused it
  description: string
  
  // Timing
  startDate: { week: number; year: number }
  peakDate?: { week: number; year: number }
  endDate?: { week: number; year: number }
  
  // Scale
  intensity: 'minor' | 'moderate' | 'major' | 'massive'
  mediaaCycle: number           // Days in news
  socialMediaMentions: number
  
  // Damage
  reputationDamage: number
  sponsorDamage: { sponsorId: string; damage: number }[]
  partnerReaction?: string
  
  // Response
  hasResponded: boolean
  responseType?: ControversyResponse
  responseEffectiveness?: number
  
  // Resolution
  isResolved: boolean
  resolutionType?: 'apologized' | 'stood_firm' | 'clarified' | 'ignored' | 'time_passed'
  longTermImpact: number
}

export type ControversyResponse = 
  | 'double_down'       // Defend position strongly
  | 'clarify'           // Explain what you meant
  | 'apologize'         // Full apology
  | 'partial_apology'   // "Sorry if offended"
  | 'ignore'            // No comment
  | 'deflect'           // Change subject
  | 'humor'             // Make light of it

// ============================================
// CAUSE CATALOG
// ============================================

export const CAUSE_CATALOG: Cause[] = [
  // Environmental
  {
    id: 'climate_action',
    name: 'Climate Action',
    category: 'environmental',
    description: 'Fighting climate change through sustainable practices and policy',
    controversyLevel: 40,
    politicalAlignment: 'left',
    publicSupport: 65,
    corporateSupport: 50,
    sponsorRiskLevel: 'mild',
    riskySponsorTypes: ['oil_gas', 'fossil_fuels']
  },
  {
    id: 'ocean_conservation',
    name: 'Ocean Conservation',
    category: 'environmental',
    description: 'Protecting marine ecosystems and reducing plastic pollution',
    controversyLevel: 15,
    politicalAlignment: 'nonpartisan',
    publicSupport: 80,
    corporateSupport: 70,
    sponsorRiskLevel: 'safe',
    riskySponsorTypes: []
  },
  {
    id: 'sustainable_motorsport',
    name: 'Sustainable Motorsport',
    category: 'environmental',
    description: 'Pushing for electric and hydrogen racing technologies',
    controversyLevel: 25,
    politicalAlignment: 'nonpartisan',
    publicSupport: 60,
    corporateSupport: 65,
    sponsorRiskLevel: 'safe',
    riskySponsorTypes: []
  },
  
  // Social Justice
  {
    id: 'diversity_motorsport',
    name: 'Diversity in Motorsport',
    category: 'social_justice',
    description: 'Increasing representation in racing',
    controversyLevel: 30,
    politicalAlignment: 'center',
    publicSupport: 70,
    corporateSupport: 75,
    sponsorRiskLevel: 'safe',
    riskySponsorTypes: []
  },
  {
    id: 'racial_equality',
    name: 'Racial Equality',
    category: 'social_justice',
    description: 'Fighting systemic racism and promoting equality',
    controversyLevel: 50,
    politicalAlignment: 'left',
    publicSupport: 60,
    corporateSupport: 55,
    sponsorRiskLevel: 'mild',
    riskySponsorTypes: []
  },
  {
    id: 'lgbtq_rights',
    name: 'LGBTQ+ Rights',
    category: 'social_justice',
    description: 'Supporting equality for LGBTQ+ individuals',
    controversyLevel: 55,
    politicalAlignment: 'left',
    publicSupport: 55,
    corporateSupport: 60,
    sponsorRiskLevel: 'risky',
    riskySponsorTypes: ['certain_countries_sponsors']
  },
  
  // Health
  {
    id: 'mental_health',
    name: 'Mental Health Awareness',
    category: 'health',
    description: 'Reducing stigma and improving mental health support',
    controversyLevel: 10,
    politicalAlignment: 'nonpartisan',
    publicSupport: 85,
    corporateSupport: 80,
    sponsorRiskLevel: 'safe',
    riskySponsorTypes: []
  },
  {
    id: 'road_safety',
    name: 'Road Safety',
    category: 'health',
    description: 'Promoting safe driving and reducing traffic deaths',
    controversyLevel: 5,
    politicalAlignment: 'nonpartisan',
    publicSupport: 95,
    corporateSupport: 90,
    sponsorRiskLevel: 'safe',
    riskySponsorTypes: []
  },
  
  // Education
  {
    id: 'youth_motorsport',
    name: 'Youth Motorsport Access',
    category: 'education',
    description: 'Making motorsport accessible to underprivileged youth',
    controversyLevel: 5,
    politicalAlignment: 'nonpartisan',
    publicSupport: 90,
    corporateSupport: 85,
    sponsorRiskLevel: 'safe',
    riskySponsorTypes: []
  },
  {
    id: 'stem_education',
    name: 'STEM Education',
    category: 'education',
    description: 'Promoting science, technology, engineering, and math',
    controversyLevel: 5,
    politicalAlignment: 'nonpartisan',
    publicSupport: 90,
    corporateSupport: 90,
    sponsorRiskLevel: 'safe',
    riskySponsorTypes: []
  },
  
  // Humanitarian
  {
    id: 'refugee_support',
    name: 'Refugee Support',
    category: 'humanitarian',
    description: 'Helping refugees and displaced people',
    controversyLevel: 45,
    politicalAlignment: 'left',
    publicSupport: 55,
    corporateSupport: 45,
    sponsorRiskLevel: 'risky',
    riskySponsorTypes: []
  },
  {
    id: 'poverty',
    name: 'Fighting Poverty',
    category: 'humanitarian',
    description: 'Working to end extreme poverty worldwide',
    controversyLevel: 15,
    politicalAlignment: 'nonpartisan',
    publicSupport: 85,
    corporateSupport: 75,
    sponsorRiskLevel: 'safe',
    riskySponsorTypes: []
  },
  {
    id: 'veterans',
    name: 'Veteran Support',
    category: 'humanitarian',
    description: 'Supporting military veterans and their families',
    controversyLevel: 10,
    politicalAlignment: 'nonpartisan',
    publicSupport: 90,
    corporateSupport: 85,
    sponsorRiskLevel: 'safe',
    riskySponsorTypes: []
  }
]

// ============================================
// CONFIGURATION
// ============================================

export const ACTIVISM_CONFIG = {
  // Support levels
  silentDonationMin: 10000,
  publicSupportMinDonation: 25000,
  activeMinDonation: 100000,
  leadingMinDonation: 500000,
  
  // Reputation effects
  baseReputationGainPerEvent: 5,
  controversyReputationPenalty: 0.5, // Per point of controversy
  
  // Sponsor effects
  sponsorConcernThreshold: 40,  // Controversy level that concerns sponsors
  sponsorExitThreshold: 70,     // Controversy level that makes sponsors leave
  
  // Public perception
  perceptionShiftRate: 0.1,     // How fast perception changes
  
  // Event costs
  rallyOrganizingCost: 50000,
  foundationLaunchCost: 500000,
  campaignLaunchCost: 250000,
  
  // Time costs
  activeAdvocacyHoursPerWeek: 5,
  leadingAdvocacyHoursPerWeek: 15,
  
  // Controversy decay
  controversyDecayPerWeek: 5
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

export function createCauseSupport(
  cause: Cause,
  supportLevel: SupportLevel,
  startDate: { week: number; year: number }
): CauseSupport {
  return {
    id: `support_${cause.id}_${Date.now()}`,
    causeId: cause.id,
    causeName: cause.name,
    supportLevel,
    startedSupporting: startDate,
    publicStatements: 0,
    eventsAttended: 0,
    eventsHosted: 0,
    donationsTotal: 0,
    donationsThisYear: 0,
    awarenessRaised: 0,
    fundsRaisedTotal: 0,
    legislationSupported: [],
    supportersGained: 0,
    criticsGained: 0,
    sponsorReactions: [],
    isPubliclyKnown: supportLevel !== 'silent',
    publicPerception: 'neutral'
  }
}

export function createPoliticalStance(
  topic: string,
  category: PoliticalCategory,
  position: StancePosition,
  isPublic: boolean
): PoliticalStance {
  return {
    id: `stance_${Date.now()}`,
    topic,
    category,
    yourPosition: position,
    isPublic,
    statementsGiven: 0,
    socialMediaPosts: 0,
    interviewsMentioned: 0,
    controversyLevel: 0,
    backlashReceived: false,
    alignedSponsors: [],
    opposedSponsors: [],
    alignedContacts: [],
    opposedContacts: [],
    followersGained: 0,
    followersLost: 0,
    reputationChange: 0
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function calculateSponsorRisk(
  cause: Cause,
  supportLevel: SupportLevel,
  sponsorIndustries: string[]
): { riskLevel: 'low' | 'medium' | 'high'; atRiskSponsors: string[] } {
  const atRisk = sponsorIndustries.filter(i => cause.riskySponsorTypes.includes(i))
  
  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  
  if (atRisk.length > 0 && supportLevel !== 'silent') {
    if (supportLevel === 'leading' || supportLevel === 'active') {
      riskLevel = 'high'
    } else {
      riskLevel = 'medium'
    }
  }
  
  return { riskLevel, atRiskSponsors: atRisk }
}

export function getCauseById(id: string): Cause | undefined {
  return CAUSE_CATALOG.find(c => c.id === id)
}

export function getControversyResponse(
  responseType: ControversyResponse,
  _originalControversy: number
): { reputationChange: number; controversyChange: number; publicReaction: string } {
  switch (responseType) {
    case 'double_down':
      return {
        reputationChange: -5,
        controversyChange: 20,
        publicReaction: 'Supporters love it, critics outraged'
      }
    case 'clarify':
      return {
        reputationChange: 0,
        controversyChange: -15,
        publicReaction: 'Most accept the clarification'
      }
    case 'apologize':
      return {
        reputationChange: -10,
        controversyChange: -40,
        publicReaction: 'Mixed - some forgive, some see weakness'
      }
    case 'partial_apology':
      return {
        reputationChange: -5,
        controversyChange: -10,
        publicReaction: 'Seen as insincere by many'
      }
    case 'ignore':
      return {
        reputationChange: 0,
        controversyChange: -5,
        publicReaction: 'Story slowly dies down'
      }
    case 'deflect':
      return {
        reputationChange: -2,
        controversyChange: -10,
        publicReaction: 'Some notice the deflection'
      }
    case 'humor':
      return {
        reputationChange: 5,
        controversyChange: -20,
        publicReaction: 'Risky but often works'
      }
    default:
      return {
        reputationChange: 0,
        controversyChange: 0,
        publicReaction: 'No change'
      }
  }
}
