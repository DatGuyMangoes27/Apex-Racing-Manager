// ============================================
// RELATIONSHIP MANAGER
// ============================================
// Handles dating, marriage, and partner relationship simulation.

import {
  Partner,
  PartnerTrait,
  RelationshipStatus,
  DateOption,
  WeddingOption,
  PrenupAgreement,
  MoodFactor,
  PartnerOrigin,
  PartnerCareer,
  PARTNER_TRAITS,
  DATE_OPTIONS,
  WEDDING_OPTIONS,
  RELATIONSHIP_CONFIG,
  calculateCompatibility,
  getPartnerTraitById
} from '../../data/family-config'
import type { PersonalFinancialState, PersonalTransaction } from '../../data/personal-finance-config'
import type { SocialBio } from '@/types/personalLife'
import { generateSocialBio, generateFallbackSocialBio } from '@/services/dialogueAI'
import type { SocialBioContext } from '@/services/dialogueAI'
import {
  getRandomPartnerByGender,
  extractPartnerBio,
  isContentLoaded,
  type PreGenPartnerProfile
} from '@/services/preGeneratedContentService'

// ============================================
// PARTNER GENERATION
// ============================================

const FIRST_NAMES_FEMALE = [
  'Sofia', 'Emma', 'Isabella', 'Olivia', 'Mia', 'Charlotte', 'Amelia', 'Elena',
  'Victoria', 'Alexandra', 'Natasha', 'Maria', 'Valentina', 'Sophia', 'Camilla',
  'Arabella', 'Francesca', 'Giulia', 'Chiara', 'Laura', 'Anna', 'Eva', 'Julia'
]

const FIRST_NAMES_MALE = [
  'James', 'William', 'Alexander', 'Sebastian', 'Lucas', 'Marco', 'Nicolas',
  'Oliver', 'Benjamin', 'Max', 'Leo', 'Felix', 'Hugo', 'Oscar', 'Carlo'
]

const LAST_NAMES = [
  'Anderson', 'Martinez', 'Schmidt', 'Rossi', 'Mueller', 'Silva', 'Dubois',
  'Kowalski', 'Jensen', 'Williams', 'Brown', 'Taylor', 'Davies', 'Wilson',
  'Thompson', 'White', 'Robinson', 'Clark', 'Lewis', 'Walker', 'Hall'
]

/**
 * Map pre-generated career string to game's PartnerCareer type.
 */
function mapPreGenCareer(careerStr: string): PartnerCareer {
  const mapping: Record<string, PartnerCareer> = {
    model: 'model', athlete: 'athlete', business_exec: 'business_exec',
    doctor: 'doctor', lawyer: 'lawyer', entrepreneur: 'entrepreneur',
    artist: 'artist', journalist: 'journalist', scientist: 'scientist',
    socialite: 'socialite', racing_driver: 'racing_driver',
    engineer: 'engineer', team_staff: 'team_staff',
    // Content Studio aliases
    fashion_designer: 'artist', actor: 'socialite', musician: 'artist',
    tech_entrepreneur: 'entrepreneur', banker: 'business_exec',
    professor: 'scientist', architect: 'engineer', chef: 'entrepreneur',
    influencer: 'socialite', philanthropist: 'socialite',
    pilot: 'athlete', diplomat: 'business_exec'
  }
  return mapping[careerStr] || 'entrepreneur'
}

/**
 * Map pre-generated meeting context string to game's PartnerOrigin type.
 */
function mapMeetingContextToOrigin(context: string, fallbackOrigin: PartnerOrigin): PartnerOrigin {
  if (!context) return fallbackOrigin
  const lower = context.toLowerCase()
  if (lower.includes('paddock') || lower.includes('race') || lower.includes('motorsport') || lower.includes('track')) return 'racing_paddock'
  if (lower.includes('business') || lower.includes('corporate') || lower.includes('gala')) return 'business_event'
  if (lower.includes('friend') || lower.includes('social') || lower.includes('party')) return 'social_circle'
  if (lower.includes('media') || lower.includes('interview') || lower.includes('press')) return 'media_appearance'
  if (lower.includes('charity') || lower.includes('fundrais') || lower.includes('foundation')) return 'charity_event'
  if (lower.includes('childhood') || lower.includes('grew up') || lower.includes('school')) return 'childhood_friend'
  return fallbackOrigin
}

/**
 * Build a Partner from a pre-generated profile.
 */
function buildPartnerFromPreGen(
  preGen: PreGenPartnerProfile,
  origin: PartnerOrigin,
  wealthLevel: number
): Partner {
  // Split name into first/last
  const nameParts = preGen.name.split(' ')
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(' ') || 'Unknown'

  // Map career from pre-gen data or derive from origin
  const career = preGen.career ? mapPreGenCareer(preGen.career) : generateCareerForOrigin(origin, wealthLevel)
  const careerIncome = getCareerIncome(career)

  // Use pre-gen traits if available, otherwise generate
  const traitCount = 2 + Math.floor(Math.random() * 2)
  const shuffledTraits = [...PARTNER_TRAITS].sort(() => Math.random() - 0.5)
  const traits = shuffledTraits.slice(0, traitCount).map(t => t.id)

  // Map origin from pre-gen meeting context
  const mappedOrigin = mapMeetingContextToOrigin(preGen.meetingContext, origin)

  // Build desires from pre-gen data or generate from traits
  let desires: Partner['desires']
  if (preGen.desires) {
    desires = {
      wantsChildren: preGen.desires.wantsChildren,
      desiredChildrenCount: preGen.desires.desiredChildrenCount,
      wantsMarriage: preGen.desires.wantsMarriage,
      lifestyleExpectations: mapWealthToLifestyle(preGen.wealthLevel || 'comfortable'),
      qualityTimeImportance: preGen.desires.qualityTimeImportance ?? 5,
      careerSupportImportance: preGen.desires.careerSupportImportance ?? 5,
      socialLifeImportance: preGen.desires.socialLifeImportance ?? 5,
      privacyImportance: preGen.desires.privacyImportance ?? 5
    }
  } else {
    desires = generateDesires(traits, wealthLevel)
  }

  // Extract bio from pre-generated data
  const preGenBio = extractPartnerBio(preGen)
  const bio: SocialBio = {
    background: preGenBio.background,
    careerNarrative: preGenBio.careerNarrative,
    anecdotes: preGenBio.anecdotes,
    personalityDescription: preGenBio.personalityDescription,
    lifeSituation: preGenBio.lifeSituation
  }

  // Appearance from pre-gen physical description
  const appearance = preGen.physical ? {
    hairColor: preGen.physical.hairColor || 'brown',
    eyeColor: preGen.physical.eyeColor || 'brown',
    style: mapStyleToAppearance(preGen.style)
  } : undefined

  return {
    id: preGen.id,
    firstName,
    lastName,
    age: preGen.age,
    nationality: preGen.nationality as any,
    origin: mappedOrigin,
    career,
    careerIncome,
    traits,
    bio,
    relationshipStatus: 'single',
    happiness: 70,
    loveLevel: 30 + Math.floor(Math.random() * 20),
    trustLevel: 40 + Math.floor(Math.random() * 20),
    compatibilityScore: 50,
    recentMoodFactors: [],
    childrenIds: [],
    desires,
    dealBreakerViolationCount: {},
    dealBreakerWarningsGiven: [],
    appearance
  }
}

function mapWealthToLifestyle(wealth: string): 'modest' | 'comfortable' | 'affluent' | 'luxury' | 'ultra_luxury' {
  const map: Record<string, 'modest' | 'comfortable' | 'affluent' | 'luxury' | 'ultra_luxury'> = {
    modest: 'modest', comfortable: 'comfortable', wealthy: 'affluent', ultra_wealthy: 'ultra_luxury'
  }
  return map[wealth] || 'comfortable'
}

function mapStyleToAppearance(style: string): 'elegant' | 'casual' | 'sporty' | 'glamorous' | 'bohemian' {
  if (!style) return 'elegant'
  const lower = style.toLowerCase()
  if (lower.includes('elegant') || lower.includes('classic') || lower.includes('refined')) return 'elegant'
  if (lower.includes('casual') || lower.includes('relaxed') || lower.includes('laid-back')) return 'casual'
  if (lower.includes('sporty') || lower.includes('athletic') || lower.includes('active')) return 'sporty'
  if (lower.includes('glamorous') || lower.includes('bold') || lower.includes('luxurious')) return 'glamorous'
  if (lower.includes('bohemian') || lower.includes('creative') || lower.includes('artistic')) return 'bohemian'
  return 'elegant'
}

export function generatePotentialPartner(
  playerAge: number,
  origin: PartnerOrigin,
  wealthLevel: number
): Partner {
  // ── Try pre-generated pool first ──
  if (isContentLoaded()) {
    const gender = Math.random() > 0.5 ? 'female' : 'male'
    const preGen = getRandomPartnerByGender(gender)
    if (preGen) {
      return buildPartnerFromPreGen(preGen, origin, wealthLevel)
    }
  }

  // ── Fallback: runtime generation (original logic) ──
  const isFemale = Math.random() > 0.5
  const firstName = isFemale
    ? FIRST_NAMES_FEMALE[Math.floor(Math.random() * FIRST_NAMES_FEMALE.length)]
    : FIRST_NAMES_MALE[Math.floor(Math.random() * FIRST_NAMES_MALE.length)]
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
  
  const ageOffset = Math.floor(Math.random() * 20) - 10
  const age = Math.max(21, Math.min(55, playerAge + ageOffset))
  
  const traitCount = 2 + Math.floor(Math.random() * 2)
  const shuffledTraits = [...PARTNER_TRAITS].sort(() => Math.random() - 0.5)
  const traits = shuffledTraits.slice(0, traitCount).map(t => t.id)
  
  const career = generateCareerForOrigin(origin, wealthLevel)
  const careerIncome = getCareerIncome(career)
  
  const nationalities = [
    'United Kingdom', 'Germany', 'Italy', 'France', 'United States',
    'Brazil', 'Australia', 'Netherlands', 'Japan', 'Monaco', 'Switzerland'
  ] as const
  const nationality = nationalities[Math.floor(Math.random() * nationalities.length)]
  
  const desires = generateDesires(traits, wealthLevel)
  
  const bioContext: SocialBioContext = {
    name: `${firstName} ${lastName}`,
    age,
    gender: isFemale ? 'female' : 'male',
    nationality,
    traits,
    contactType: 'partner',
    origin,
    career
  }
  const bio = generateFallbackSocialBio(bioContext)
  
  return {
    id: `partner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    firstName,
    lastName,
    age,
    nationality,
    origin,
    career,
    careerIncome,
    traits,
    bio,
    relationshipStatus: 'single',
    happiness: 70,
    loveLevel: 30 + Math.floor(Math.random() * 20),
    trustLevel: 40 + Math.floor(Math.random() * 20),
    compatibilityScore: 50,
    recentMoodFactors: [],
    childrenIds: [],
    desires,
    dealBreakerViolationCount: {},
    dealBreakerWarningsGiven: []
  }
}

/**
 * Asynchronously upgrade a partner's bio with AI-generated content
 */
export async function upgradePartnerBioWithAI(partner: Partner): Promise<SocialBio> {
  const bioContext: SocialBioContext = {
    name: `${partner.firstName} ${partner.lastName}`,
    age: partner.age,
    gender: undefined, // Partner type doesn't store gender directly
    occupation: partner.career?.replace(/_/g, ' '),
    nationality: partner.nationality,
    traits: partner.traits,
    contactType: 'partner',
    origin: partner.origin,
    career: partner.career
  }
  return generateSocialBio(bioContext)
}

function generateCareerForOrigin(origin: PartnerOrigin, wealthLevel: number): PartnerCareer {
  const careersByOrigin: Record<PartnerOrigin, PartnerCareer[]> = {
    racing_paddock: ['racing_driver', 'engineer', 'team_staff', 'journalist'],
    business_event: ['business_exec', 'entrepreneur', 'lawyer'],
    social_circle: ['socialite', 'model', 'artist', 'entrepreneur'],
    media_appearance: ['journalist', 'model', 'artist'],
    charity_event: ['doctor', 'lawyer', 'business_exec', 'socialite'],
    random_encounter: ['doctor', 'artist', 'scientist', 'athlete'],
    childhood_friend: ['entrepreneur', 'doctor', 'lawyer', 'none']
  }
  
  const options = careersByOrigin[origin]
  return options[Math.floor(Math.random() * options.length)]
}

function getCareerIncome(career: PartnerCareer): number {
  const incomes: Record<PartnerCareer, number> = {
    model: 15000,
    athlete: 25000,
    business_exec: 30000,
    doctor: 20000,
    lawyer: 25000,
    entrepreneur: 35000,
    artist: 8000,
    journalist: 10000,
    scientist: 12000,
    socialite: 5000,
    racing_driver: 50000,
    engineer: 15000,
    team_staff: 8000,
    none: 0
  }
  
  // Add some variance (±30%)
  const variance = 0.7 + Math.random() * 0.6
  return Math.round(incomes[career] * variance)
}

function generateDesires(traits: string[], wealthLevel: number): Partner['desires'] {
  let wantsChildren = Math.random() > 0.3 // 70% chance
  let desiredChildrenCount = wantsChildren ? 1 + Math.floor(Math.random() * 3) : 0
  
  // Nurturing trait increases family desire
  if (traits.includes('nurturing')) {
    wantsChildren = true
    desiredChildrenCount = Math.max(desiredChildrenCount, 2)
  }
  
  // Lifestyle expectations based on wealth exposure and traits
  let lifestyleExpectations: Partner['desires']['lifestyleExpectations'] = 'comfortable'
  if (traits.includes('high_maintenance') || traits.includes('glamorous')) {
    lifestyleExpectations = wealthLevel > 10000000 ? 'ultra_luxury' : 'luxury'
  } else if (traits.includes('practical')) {
    lifestyleExpectations = 'modest'
  } else if (wealthLevel > 5000000) {
    lifestyleExpectations = 'affluent'
  }
  
  return {
    wantsChildren,
    desiredChildrenCount,
    wantsMarriage: Math.random() > 0.2, // 80% want marriage
    lifestyleExpectations,
    qualityTimeImportance: 50 + Math.floor(Math.random() * 50),
    careerSupportImportance: traits.includes('supportive') ? 80 : 40 + Math.floor(Math.random() * 40),
    socialLifeImportance: traits.includes('social_butterfly') ? 85 : 30 + Math.floor(Math.random() * 50),
    privacyImportance: traits.includes('private') ? 90 : 20 + Math.floor(Math.random() * 50)
  }
}

// ============================================
// DATING ACTIONS
// ============================================

export function goOnDate(
  partner: Partner,
  dateOption: DateOption,
  finances: PersonalFinancialState,
  contactContext?: { loveLanguage?: string; interests?: string[] }
): {
  updatedPartner: Partner
  transaction: PersonalTransaction
  outcome: {
    success: boolean
    message: string
    happinessGained: number
    loveGained: number
    trustGained: number
    bonusApplied?: string  // Description of any bonus applied
  }
} {
  // Calculate base gains
  let happinessGain = dateOption.happinessGain
  let loveGain = dateOption.loveLevelGain
  let trustGain = dateOption.trustGain
  
  // Apply trait bonuses
  for (const traitId of partner.traits) {
    const bonus = dateOption.traitBonuses?.[traitId] || 0
    happinessGain += bonus
    loveGain += bonus * 0.5
  }
  
  // Apply love language bonus (+50% if matching)
  let bonusApplied: string | undefined
  if (contactContext?.loveLanguage && dateOption.loveLanguageTag) {
    const normalized = contactContext.loveLanguage.toLowerCase().replace(/[\s-]+/g, '_')
    if (normalized === dateOption.loveLanguageTag || 
        normalized.includes(dateOption.loveLanguageTag.split('_')[0])) {
      happinessGain = Math.round(happinessGain * 1.5)
      loveGain = Math.round(loveGain * 1.5)
      trustGain = Math.round(trustGain * 1.5)
      bonusApplied = 'love language match'
    }
  }
  
  // Apply shared interest bonus (+30% per match, cap +100%)
  if (contactContext?.interests && dateOption.interestTags) {
    const normalizedInterests = contactContext.interests.map(i => i.toLowerCase().replace(/[\s-]+/g, '_'))
    let matchCount = 0
    for (const tag of dateOption.interestTags) {
      if (normalizedInterests.some(interest => interest.includes(tag) || tag.includes(interest))) {
        matchCount++
      }
    }
    if (matchCount > 0) {
      const interestMultiplier = Math.min(2.0, 1.0 + matchCount * 0.3)
      happinessGain = Math.round(happinessGain * interestMultiplier)
      loveGain = Math.round(loveGain * interestMultiplier)
      bonusApplied = bonusApplied 
        ? `${bonusApplied} + shared interests`
        : 'shared interests'
    }
  }
  
  // Random variance (±20%)
  const variance = 0.8 + Math.random() * 0.4
  happinessGain = Math.round(happinessGain * variance)
  loveGain = Math.round(loveGain * variance)
  trustGain = Math.round(trustGain * variance)
  
  // Update partner
  const updatedPartner: Partner = {
    ...partner,
    happiness: Math.min(100, partner.happiness + happinessGain),
    loveLevel: Math.min(100, partner.loveLevel + loveGain),
    trustLevel: Math.min(100, partner.trustLevel + trustGain),
    recentMoodFactors: [
      ...partner.recentMoodFactors,
      {
        reason: `Enjoyed ${dateOption.name}`,
        impact: happinessGain,
        weeksRemaining: 4,
        category: 'relationship'
      }
    ]
  }
  
  // Create transaction
  // Note: week and year should be provided by caller context
  const transaction: PersonalTransaction = {
    id: `date-${Date.now()}`,
    date: { week: 1, year: 2024 }, // TODO: Get actual week/year from context
    type: 'expense',
    amount: dateOption.cost,
    category: 'lifestyle',
    description: `Date: ${dateOption.name} with ${partner.firstName}`,
    taxDeductible: false
  }
  
  return {
    updatedPartner,
    transaction,
    outcome: {
      success: true,
      message: bonusApplied
        ? `Had an amazing ${dateOption.name} with ${partner.firstName}! (${bonusApplied} bonus)`
        : `Had a wonderful ${dateOption.name} with ${partner.firstName}!`,
      happinessGained: happinessGain,
      loveGained: loveGain,
      trustGained: trustGain,
      bonusApplied
    }
  }
}

// ============================================
// RELATIONSHIP PROGRESSION
// ============================================

export function proposeToPartner(
  partner: Partner,
  currentWeek: number,
  currentYear: number
): {
  accepted: boolean
  updatedPartner: Partner
  message: string
} {
  // Check if dating long enough
  const relationshipStart = partner.relationshipStartDate
  if (!relationshipStart) {
    return {
      accepted: false,
      updatedPartner: partner,
      message: 'You need to be dating first!'
    }
  }
  
  // Calculate acceptance chance based on love, trust, happiness
  const loveWeight = partner.loveLevel * 0.4
  const trustWeight = partner.trustLevel * 0.3
  const happinessWeight = partner.happiness * 0.2
  const compatWeight = partner.compatibilityScore * 0.1
  
  let acceptanceScore = loveWeight + trustWeight + happinessWeight + compatWeight
  
  // Trait modifiers for proposal acceptance
  if (partner.traits.includes('commitment_phobic')) {
    acceptanceScore -= 30 // Major penalty
  }
  if (!partner.desires.wantsMarriage) {
    acceptanceScore -= 25 // They don't want marriage at all
  }
  if (partner.traits.includes('romantic') || partner.traits.includes('nurturing')) {
    acceptanceScore += 10 // More receptive to commitment
  }
  if (partner.traits.includes('independent')) {
    acceptanceScore -= 10 // Values freedom
  }
  
  // Need at least 70 score, with some randomness
  const roll = Math.random() * 100
  const accepted = roll < acceptanceScore
  
  if (accepted) {
    return {
      accepted: true,
      updatedPartner: {
        ...partner,
        relationshipStatus: 'engaged',
        engagementDate: { week: currentWeek, year: currentYear },
        happiness: Math.min(100, partner.happiness + 20),
        loveLevel: Math.min(100, partner.loveLevel + 15),
        recentMoodFactors: [
          ...partner.recentMoodFactors,
          {
            reason: 'Got engaged!',
            impact: 25,
            weeksRemaining: 12,
            category: 'relationship'
          }
        ]
      },
      message: `${partner.firstName} said YES! You're now engaged!`
    }
  } else {
    // Rejection hurts but doesn't end relationship
    return {
      accepted: false,
      updatedPartner: {
        ...partner,
        happiness: Math.max(0, partner.happiness - 10),
        trustLevel: Math.max(0, partner.trustLevel - 5),
        recentMoodFactors: [
          ...partner.recentMoodFactors,
          {
            reason: 'Proposal timing wasn\'t right',
            impact: -15,
            weeksRemaining: 8,
            category: 'relationship'
          }
        ]
      },
      message: `${partner.firstName} said they're not ready yet. The relationship continues...`
    }
  }
}

export function planWedding(
  partner: Partner,
  weddingOption: WeddingOption,
  prenup: PrenupAgreement | null,
  currentWeek: number,
  currentYear: number
): {
  updatedPartner: Partner
  totalCost: number
  publicImageGain: number
  message: string
} {
  // Calculate total cost (base + per guest)
  const guestCount = Math.floor(
    (weddingOption.guestCount.min + weddingOption.guestCount.max) / 2
  )
  const totalCost = weddingOption.baseCost + guestCount * 500
  
  // Partner happiness based on wedding type and their expectations
  let happinessGain = weddingOption.partnerHappinessBonus
  
  // Prenup reaction
  if (prenup?.enabled) {
    happinessGain += prenup.partnerReaction / 5 // Prenup reaction affects happiness
  }
  
  // Check if wedding matches expectations
  const lifestyleMatch = checkLifestyleMatch(partner.desires.lifestyleExpectations, weddingOption)
  happinessGain += lifestyleMatch
  
  return {
    updatedPartner: {
      ...partner,
      relationshipStatus: 'married',
      marriageDate: { week: currentWeek, year: currentYear },
      happiness: Math.min(100, partner.happiness + happinessGain + 20),
      loveLevel: Math.min(100, partner.loveLevel + 20),
      trustLevel: Math.min(100, partner.trustLevel + 15),
      recentMoodFactors: [
        ...partner.recentMoodFactors,
        {
          reason: 'Wedding day!',
          impact: 30,
          weeksRemaining: 16,
          category: 'relationship'
        }
      ]
    },
    totalCost,
    publicImageGain: weddingOption.publicImageBonus,
    message: `Congratulations! You and ${partner.firstName} are now married!`
  }
}

function checkLifestyleMatch(
  expectations: Partner['desires']['lifestyleExpectations'],
  wedding: WeddingOption
): number {
  const expectationLevel = {
    modest: 1,
    comfortable: 2,
    affluent: 3,
    luxury: 4,
    ultra_luxury: 5
  }
  
  const weddingLevel = {
    courthouse: 1,
    intimate: 2,
    traditional: 3,
    destination: 4,
    celebrity: 5
  }
  
  const diff = weddingLevel[wedding.type] - expectationLevel[expectations]
  
  if (diff >= 1) return 10  // Exceeded expectations
  if (diff === 0) return 5  // Met expectations
  if (diff === -1) return 0 // Slightly below
  return -10                // Significantly below
}

// ============================================
// WEEKLY RELATIONSHIP UPDATE
// ============================================

export function processWeeklyRelationship(
  partner: Partner,
  playerAttentionGiven: boolean,
  playerTravelingAway: boolean,
  playerStressLevel: number,
  context?: {
    recentMediaScandals?: number
    publicSocialMediaPosts?: number
    socialEventsAttended?: number
    socialEventsDeclined?: number
    // Conversation activity data
    messagesSentThisWeek?: number
    messagesReceivedThisWeek?: number
    playerGhostedDays?: number
    conversationStage?: string
  }
): Partner {
  const config = RELATIONSHIP_CONFIG
  const desires = partner.desires
  
  let happinessChange = 0
  let loveChange = 0
  let trustChange = 0
  
  // ── Desire-scaled decay when not given attention ──
  // qualityTimeImportance (0-100) scales the decay: 90 = -3/week, 30 = -0.5/week
  const qualityDecayFactor = desires?.qualityTimeImportance
    ? 0.5 + (desires.qualityTimeImportance / 100) * 2.5 // 0.5 to 3.0
    : config.weeklyBondDecay
  
  // Consider messaging activity as a form of attention
  const msgsSent = context?.messagesSentThisWeek ?? 0
  const hasConversationActivity = msgsSent >= 2
  const effectiveAttention = playerAttentionGiven || hasConversationActivity
  
  if (!effectiveAttention) {
    happinessChange -= qualityDecayFactor
    loveChange -= qualityDecayFactor * 0.5
  } else {
    happinessChange += config.qualityTimeBonus
    loveChange += 1
    trustChange += 0.5
    
    // Extra bonus for active messaging (on top of base attention bonus)
    if (msgsSent >= 5) {
      happinessChange += 2
      loveChange += 0.5
      trustChange += 0.5
    } else if (msgsSent >= 3) {
      happinessChange += 1
      trustChange += 0.25
    }
  }
  
  // ── Ghosting penalty: partner feels neglected when ignored ──
  const ghostedDays = context?.playerGhostedDays ?? 0
  if (ghostedDays >= 5) {
    happinessChange -= 4
    trustChange -= 2
    loveChange -= 1
  } else if (ghostedDays >= 3) {
    happinessChange -= 2
    trustChange -= 1
  }
  
  // ── Stale conversation penalty: relationship withers without contact ──
  if (context?.conversationStage === 'stale') {
    happinessChange -= 3
    loveChange -= 1
    trustChange -= 0.5
  }
  
  // Being away hurts relationship
  if (playerTravelingAway) {
    happinessChange -= 2
    if (partner.traits.includes('jealous')) {
      happinessChange -= 3
      trustChange -= 2
    }
    // Possessive partners also suffer more
    if (partner.traits.includes('possessive')) {
      happinessChange -= 2
      trustChange -= 1
    }
  }
  
  // High player stress affects partner
  if (playerStressLevel > 70) {
    happinessChange -= 2
    if (partner.traits.includes('supportive')) {
      happinessChange += 3 // Supportive partners help
    }
  }
  
  // ── socialLifeImportance: scales gains/losses from social events ──
  if (context && desires?.socialLifeImportance) {
    const socialFactor = desires.socialLifeImportance / 100 // 0 to 1
    if (context.socialEventsAttended && context.socialEventsAttended > 0) {
      happinessChange += context.socialEventsAttended * socialFactor * 2
    }
    if (context.socialEventsDeclined && context.socialEventsDeclined > 0) {
      happinessChange -= context.socialEventsDeclined * socialFactor * 2
      trustChange -= context.socialEventsDeclined * socialFactor * 0.5
    }
  }
  
  // ── privacyImportance: high-privacy partners lose happiness from media/scandals ──
  if (context && desires?.privacyImportance) {
    const privacyFactor = desires.privacyImportance / 100 // 0 to 1
    if (context.recentMediaScandals && context.recentMediaScandals > 0) {
      happinessChange -= context.recentMediaScandals * privacyFactor * 5
      trustChange -= context.recentMediaScandals * privacyFactor * 2
    }
    if (context.publicSocialMediaPosts && context.publicSocialMediaPosts > 2) {
      happinessChange -= (context.publicSocialMediaPosts - 2) * privacyFactor * 1.5
    }
  }
  
  // Process and decay mood factors
  const newMoodFactors = partner.recentMoodFactors
    .map(mf => ({ ...mf, weeksRemaining: mf.weeksRemaining - 1 }))
    .filter(mf => mf.weeksRemaining > 0)
  
  // Apply current mood factors
  for (const factor of newMoodFactors) {
    happinessChange += factor.impact * 0.1 // Ongoing impact
  }
  
  // Apply trait effects
  for (const traitId of partner.traits) {
    const trait = getPartnerTraitById(traitId)
    if (trait?.effects.happinessModifier) {
      happinessChange += trait.effects.happinessModifier * 0.05 // Weekly portion
    }
  }
  
  const updatedPartner: Partner = {
    ...partner,
    happiness: Math.max(0, Math.min(100, partner.happiness + happinessChange)),
    loveLevel: Math.max(0, Math.min(100, partner.loveLevel + loveChange)),
    trustLevel: Math.max(0, Math.min(100, partner.trustLevel + trustChange)),
    recentMoodFactors: newMoodFactors
  }
  
  return updatedPartner
}

// ============================================
// DIVORCE HANDLING
// ============================================

export interface DivorceSettlement {
  alimonyMonthly: number
  alimonyDurationMonths: number
  assetDivision: number         // Percentage partner gets
  childCustody: 'player' | 'partner' | 'shared'
  childSupportMonthly: number
  prenupProtections: string[]
}

export function calculateDivorceSettlement(
  partner: Partner,
  playerNetWorth: number,
  marriageDurationYears: number,
  childrenCount: number,
  prenup: PrenupAgreement | null
): DivorceSettlement {
  // Base asset division (50/50 without prenup)
  let assetDivision = 50
  const prenupProtections: string[] = []
  
  if (prenup?.enabled) {
    // Prenup protections reduce what partner gets
    if (prenup.protectedAssets.preMarriageWealth) {
      assetDivision -= 20
      prenupProtections.push('Pre-marriage wealth protected')
    }
    if (prenup.protectedAssets.businessInterests) {
      assetDivision -= 10
      prenupProtections.push('Business interests protected')
    }
    if (prenup.protectedAssets.teamEquity) {
      assetDivision -= 15
      prenupProtections.push('Team equity protected')
    }
    if (prenup.protectedAssets.realEstate) {
      assetDivision -= 5
      prenupProtections.push('Real estate protected')
    }
  }
  
  // Longer marriages increase partner share (without prenup)
  if (!prenup?.enabled) {
    assetDivision += Math.min(10, marriageDurationYears * 2)
  }
  
  assetDivision = Math.max(10, Math.min(60, assetDivision))
  
  // Alimony calculation
  let alimonyMonthly = 0
  let alimonyDurationMonths = 0
  
  if (prenup?.alimonyTerms && marriageDurationYears >= prenup.alimonyTerms.yearsOfMarriageThreshold) {
    alimonyMonthly = prenup.alimonyTerms.monthlyAmount
    alimonyDurationMonths = prenup.alimonyTerms.durationYears * 12
  } else if (!prenup?.enabled) {
    // Standard alimony based on wealth and marriage duration
    alimonyMonthly = Math.round(playerNetWorth * 0.001 * Math.min(1, marriageDurationYears / 10))
    alimonyDurationMonths = marriageDurationYears * 12
  }
  
  // Child custody and support
  let childCustody: DivorceSettlement['childCustody'] = 'shared'
  let childSupportMonthly = 0
  
  if (childrenCount > 0) {
    // Custody based on relationship factors
    if (partner.happiness < 30 || partner.trustLevel < 30) {
      childCustody = 'player'
    } else if (Math.random() > 0.7) {
      childCustody = 'partner'
      childSupportMonthly = 3000 * childrenCount
    }
    
    if (childCustody === 'shared') {
      childSupportMonthly = 1500 * childrenCount
    }
  }
  
  return {
    alimonyMonthly,
    alimonyDurationMonths,
    assetDivision,
    childCustody,
    childSupportMonthly,
    prenupProtections
  }
}

export function processDivorce(
  partner: Partner,
  settlement: DivorceSettlement,
  currentWeek: number,
  currentYear: number
): {
  exPartner: Partner
  oneTimeAssetLoss: number
  monthlyObligations: {
    alimony: number
    childSupport: number
    endDate?: { week: number; year: number }
  }
} {
  const exPartner: Partner = {
    ...partner,
    relationshipStatus: 'divorced',
    happiness: 30,
    loveLevel: 10,
    trustLevel: 10
  }
  
  // Calculate one-time asset loss (this would be the % of liquid assets)
  const oneTimeAssetLoss = settlement.assetDivision / 100 // Convert to multiplier
  
  // Calculate end date for alimony
  const endWeek = currentWeek + Math.floor(settlement.alimonyDurationMonths * 4.33)
  const endYear = currentYear + Math.floor(endWeek / 52)
  
  return {
    exPartner,
    oneTimeAssetLoss,
    monthlyObligations: {
      alimony: settlement.alimonyMonthly,
      childSupport: settlement.childSupportMonthly,
      endDate: settlement.alimonyDurationMonths > 0 
        ? { week: endWeek % 52, year: endYear }
        : undefined
    }
  }
}

// ============================================
// SEPARATION DURATION CALCULATION
// ============================================

/**
 * Calculate how long a breakup or divorce takes based on relationship health.
 * Breakups: 2-4 days. Divorces: 4-16 weeks (28-112 days).
 * Good relationships take longer (contested); bad ones resolve quickly.
 */
export function calculateSeparationDuration(
  type: 'breakup' | 'divorce',
  partner: Partner
): number {
  if (type === 'breakup') {
    // Base: 3 days
    let days = 3
    
    // Good health = harder to let go (+1 day)
    if (partner.happiness > 60 && partner.loveLevel > 60) {
      days += 1
    }
    // Bad health = quick and clean (-1 day)
    if (partner.happiness < 30 && partner.loveLevel < 30) {
      days -= 1
    }
    
    return Math.max(2, Math.min(4, days))
  }
  
  // Divorce
  let weeks = 8 // Base: 8 weeks
  
  // Good relationship health: contested, takes longer
  if (partner.happiness > 50 && partner.loveLevel > 50 && partner.trustLevel > 50) {
    weeks += 4 + Math.floor(Math.random() * 5) // +4 to +8 weeks
  }
  // Bad relationship health: both want out, goes fast
  else if (partner.happiness < 25 && partner.loveLevel < 25) {
    weeks -= 2 + Math.floor(Math.random() * 3) // -2 to -4 weeks
  }
  
  // Trait modifiers
  const traits = partner.traits || []
  if (traits.includes('dramatic')) weeks += 2
  if (traits.includes('materialistic') || traits.includes('high_maintenance')) weeks += 3
  if (traits.includes('forgiving') || traits.includes('practical')) weeks -= 2
  
  // Children add custody negotiation time
  const childrenCount = partner.childrenIds?.length || 0
  weeks += childrenCount * 2
  
  // Clamp to 4-16 weeks range, convert to days
  weeks = Math.max(4, Math.min(16, weeks))
  return weeks * 7
}

// ============================================
// RELATIONSHIP STATUS HELPERS
// ============================================

export function getRelationshipStatusDisplay(status: RelationshipStatus): string {
  const displays: Record<RelationshipStatus, string> = {
    single: 'Single',
    dating: 'Dating',
    engaged: 'Engaged',
    married: 'Married',
    separated: 'Separated',
    divorced: 'Divorced',
    widowed: 'Widowed'
  }
  return displays[status]
}

export function getPartnerHappinessDescription(happiness: number): string {
  const thresholds = RELATIONSHIP_CONFIG.happinessThresholds
  
  if (happiness >= thresholds.ecstatic) return 'Ecstatic'
  if (happiness >= thresholds.happy) return 'Very Happy'
  if (happiness >= thresholds.content) return 'Content'
  if (happiness >= thresholds.unhappy) return 'Unhappy'
  if (happiness >= thresholds.miserable) return 'Very Unhappy'
  return 'Miserable'
}

export function calculateCombinedTraitEffects(partner: Partner): {
  socialEventBonus: number
  sponsorAttractionBonus: number
  stressReliefBonus: number
  familyHappinessBonus: number
  publicImageBonus: number
  expenseModifier: number
  careerSupportBonus: number
} {
  const effects = {
    socialEventBonus: 0,
    sponsorAttractionBonus: 0,
    stressReliefBonus: 0,
    familyHappinessBonus: 0,
    publicImageBonus: 0,
    expenseModifier: 0,
    careerSupportBonus: 0
  }
  
  for (const traitId of partner.traits) {
    const trait = getPartnerTraitById(traitId)
    if (trait) {
      effects.socialEventBonus += trait.effects.socialEventBonus || 0
      effects.sponsorAttractionBonus += trait.effects.sponsorAttractionBonus || 0
      effects.stressReliefBonus += trait.effects.stressReliefBonus || 0
      effects.familyHappinessBonus += trait.effects.familyHappinessBonus || 0
      effects.publicImageBonus += trait.effects.publicImageBonus || 0
      effects.expenseModifier += trait.effects.expenseModifier || 0
      effects.careerSupportBonus += trait.effects.careerSupportBonus || 0
    }
  }
  
  return effects
}
