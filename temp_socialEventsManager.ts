// ============================================
// SOCIAL EVENTS MANAGER
// ============================================
// Handles social events, philanthropy, rivalries, and scandal simulation.
// Now integrated with the encounter/dating system!

import {
  SocialEvent,
  SocialEventType,
  EventOutcome,
  CharityFoundation,
  CharityCause,
  CharityEvent,
  Rivalry,
  RivalryType,
  Scandal,
  ScandalType,
  PrivacyLevel,
  SOCIAL_EVENT_TEMPLATES,
  POSSIBLE_EVENT_OUTCOMES,
  CHARITY_CAUSE_CONFIG,
  RIVALRY_EVENTS,
  SCANDAL_TEMPLATES,
  SCANDAL_RESPONSES,
  _PRIVACY_LEVELS,
  getPrivacyLevel,
  calculateScandalDamage
} from '../../data/social-events-config'
import type { PersonalBrand } from '../../data/lifestyle-config'

export function attendSocialEvent(
  event: SocialEvent,
  playerReputation: number,
  playerBrand: PersonalBrand,
  partnerPresent: boolean
): {
  outcome: EventOutcome
  reputationChange: number
  newContacts: Array<{ type: string; name: string }>
  sponsorLeads: Array<{ company: string; value: number }>
  brandEffects: Partial<PersonalBrand>
} {
  // Check if can attend
  if (event.minimumReputation && playerReputation < event.minimumReputation) {
    return {
      outcome: {
        type: 'negative',
        description: 'You were turned away at the door - not prestigious enough',
        effects: { reputationChange: -5 }
      },
      reputationChange: -5,
      newContacts: [],
      sponsorLeads: [],
      brandEffects: {}
    }
  }
  
  // Roll for outcome
  const possibleOutcomes = POSSIBLE_EVENT_OUTCOMES[event.type] || []
  const roll = Math.random()
  
  // Weight towards positive with higher brand value
  const brandBonus = playerBrand.brandValue / 200 // Max 0.5 bonus
  
  let outcome: EventOutcome
  if (roll < 0.4 + brandBonus) {
    outcome = possibleOutcomes.filter(o => o.type === 'positive')[0] || possibleOutcomes[0]
  } else if (roll < 0.8 + brandBonus / 2) {
    outcome = possibleOutcomes.filter(o => o.type === 'neutral')[0] || possibleOutcomes[0]
  } else {
    outcome = possibleOutcomes.filter(o => o.type === 'negative')[0] || possibleOutcomes[0]
  }
  
  if (!outcome) {
    outcome = { type: 'neutral', description: 'A pleasant event', effects: {} }
  }
  
  // Collect effects
  const newContacts: Array<{ type: string; name: string }> = []
  const sponsorLeads: Array<{ company: string; value: number }> = []
  
  if (outcome.effects.newContact) {
    newContacts.push(outcome.effects.newContact)
  }
  if (outcome.effects.sponsorLead) {
    sponsorLeads.push(outcome.effects.sponsorLead)
  }
  
  // Base reputation from event
  let reputationChange = event.effects.publicImageChange
  reputationChange += outcome.effects.reputationChange || 0
  
  // Partner bonus
  if (partnerPresent && event.effects.partnerHappinessBonus) {
    reputationChange += 2 // Appearing as a couple is good for image
  }
  
  const brandEffects: Partial<PersonalBrand> = {
    publicImage: Math.min(100, playerBrand.publicImage + event.effects.publicImageChange / 2),
    mediaPresence: Math.min(100, playerBrand.mediaPresence + event.effects.mediaExposure / 3)
  }
  
  return {
    outcome,
    reputationChange,
    newContacts,
    sponsorLeads,
    brandEffects
  }
}

export function hostSocialEvent(
  event: SocialEvent,
  budget: number,
  _guestList: string[],
  _currentWeek: number,
  _currentYear: number
): {
  success: boolean
  totalCost: number
  reputationGain: number
  sponsorImpressions: number
  newContacts: number
  message: string
} {
  // Quality based on budget vs expected
  const expectedBudget = event.cost
  const qualityMultiplier = Math.min(2, budget / expectedBudget)
  
  const success = qualityMultiplier >= 0.8
  
  // Effects scale with quality
  const reputationGain = Math.round(event.effects.publicImageChange * qualityMultiplier)
  const sponsorImpressions = Math.round(event.effects.sponsorImpressions * qualityMultiplier)
  const newContacts = Math.floor(event.effects.networkingOpportunities / 10 * qualityMultiplier)
  
  let message = ''
  if (qualityMultiplier >= 1.5) {
    message = `Your ${event.name} was the talk of the town! Exceptional event.`
  } else if (qualityMultiplier >= 1) {
    message = `Your ${event.name} was a great success.`
  } else if (qualityMultiplier >= 0.8) {
    message = `Your ${event.name} went well, though it wasn't extravagant.`
  } else {
    message = `Your ${event.name} was underwhelming. Guests expected more.`
  }
  
  return {
    success,
    totalCost: budget,
    reputationGain,
    sponsorImpressions,
    newContacts,
    message
  }
}

// ============================================
// PHILANTHROPY
// ============================================

export function createFoundation(
  name: string,
  cause: CharityCause,
  initialBudget: number,
  currentWeek: number,
  currentYear: number
): CharityFoundation {
  const causeConfig = CHARITY_CAUSE_CONFIG[cause]
  
  return {
    id: `foundation-${Date.now()}`,
    name,
    cause,
    establishedDate: { week: currentWeek, year: currentYear },
    annualBudget: initialBudget,
    totalDonated: 0,
    impactScore: 50,
    publicAwareness: 20,
    taxDeductionPercentage: causeConfig.taxDeductionRate * 100,
    reputationBonus: causeConfig.baseReputationBonus
  }
}

export function processAnnualPhilanthropy(
  foundations: CharityFoundation[],
  _totalDonations: number
): {
  updatedFoundations: CharityFoundation[]
  totalTaxDeduction: number
  reputationGain: number
  publicAwarenessGain: number
} {
  let totalTaxDeduction = 0
  let reputationGain = 0
  let publicAwarenessGain = 0
  
  const updatedFoundations = foundations.map(foundation => {
    // Process annual budget
    const causeConfig = CHARITY_CAUSE_CONFIG[foundation.cause]
    
    // Tax deduction
    const deduction = foundation.annualBudget * causeConfig.taxDeductionRate
    totalTaxDeduction += deduction
    
    // Reputation based on donation size and cause
    const donationImpact = Math.log10(foundation.annualBudget / 10000 + 1) * 5
    reputationGain += donationImpact * (causeConfig.baseReputationBonus / 10)
    
    // Public awareness grows with donations
    const awarenessGain = Math.min(10, foundation.annualBudget / 100000)
    publicAwarenessGain += awarenessGain
    
    // Impact improves with consistent funding
    const impactGrowth = Math.min(5, foundation.annualBudget / 200000)
    
    return {
      ...foundation,
      totalDonated: foundation.totalDonated + foundation.annualBudget,
      impactScore: Math.min(100, foundation.impactScore + impactGrowth),
      publicAwareness: Math.min(100, foundation.publicAwareness + awarenessGain)
    }
  })
  
  return {
    updatedFoundations,
    totalTaxDeduction,
    reputationGain: Math.round(reputationGain),
    publicAwarenessGain: Math.round(publicAwarenessGain)
  }
}

export function hostCharityGala(
  foundation: CharityFoundation,
  eventBudget: number,
  guestCount: number,
  _currentWeek: number,
  _currentYear: number
): {
  event: CharityEvent
  amountRaised: number
  reputationGain: number
  newDonors: number
} {
  // Amount raised based on event quality and guest count
  const averageDonation = 5000 + (eventBudget / guestCount) * 0.5
  const participationRate = 0.6 + (foundation.impactScore / 200)
  const amountRaised = Math.round(averageDonation * guestCount * participationRate)
  
  const causeConfig = CHARITY_CAUSE_CONFIG[foundation.cause]
  const reputationGain = Math.round(
    10 + 
    (amountRaised / 100000) * 5 + 
    causeConfig.mediaAppeal / 10
  )
  
  const event: CharityEvent = {
    id: `charity-event-${Date.now()}`,
    foundationId: foundation.id,
    type: 'gala',
    name: `${foundation.name} Annual Gala`,
    cost: eventBudget,
    amountRaised,
    reputationGain,
    mediaExposure: causeConfig.mediaAppeal,
    taxDeductible: true
  }
  
  return {
    event,
    amountRaised,
    reputationGain,
    newDonors: Math.floor(guestCount * 0.1)
  }
}

// ============================================
// RIVALRIES
// ============================================

export function createRivalry(
  rivalId: string,
  rivalName: string,
  rivalType: Rivalry['rivalType'],
  type: RivalryType,
  origin: string,
  currentWeek: number,
  currentYear: number
): Rivalry {
  return {
    id: `rivalry-${Date.now()}`,
    rivalId,
    rivalName,
    rivalType,
    type,
    intensity: 30 + Math.floor(Math.random() * 20),
    origin,
    originDate: { week: currentWeek, year: currentYear },
    publicClashes: 0,
    mediaIncidents: 0,
    mediaAttention: 10,
    motivationBonus: 5,
    stressIncrease: 5,
    isActive: true,
    lastInteraction: { week: currentWeek, year: currentYear }
  }
}

export function processRivalryEvent(
  rivalry: Rivalry,
  eventType: string,
  isPublic: boolean,
  currentWeek: number,
  currentYear: number
): Rivalry {
  const eventConfig = RIVALRY_EVENTS.find(e => e.trigger === eventType)
  
  if (!eventConfig) return rivalry
  
  let intensity = rivalry.intensity + eventConfig.intensityChange
  let publicClashes = rivalry.publicClashes
  let mediaIncidents = rivalry.mediaIncidents
  
  if (isPublic) {
    publicClashes++
    mediaIncidents++
    intensity += 5
  }
  
  // Calculate effects based on intensity
  const mediaAttention = Math.min(50, Math.floor(intensity / 2))
  const motivationBonus = Math.min(20, Math.floor(intensity / 5))
  const stressIncrease = Math.min(25, Math.floor(intensity / 4))
  
  return {
    ...rivalry,
    intensity: Math.min(100, intensity),
    publicClashes,
    mediaIncidents,
    mediaAttention,
    motivationBonus,
    stressIncrease,
    lastInteraction: { week: currentWeek, year: currentYear }
  }
}

export function resolveRivalry(
  rivalry: Rivalry,
  resolution: 'reconciliation' | 'total_victory' | 'defeat' | 'fade_away'
): {
  finalRivalry: Rivalry
  reputationEffect: number
  message: string
} {
  let reputationEffect = 0
  let message = ''
  
  switch (resolution) {
    case 'reconciliation':
      reputationEffect = 10
      message = `You and ${rivalry.rivalName} have buried the hatchet. The feud is over.`
      break
    case 'total_victory':
      reputationEffect = 15 + Math.floor(rivalry.intensity / 5)
      message = `You've emerged victorious in your rivalry with ${rivalry.rivalName}!`
      break
    case 'defeat':
      reputationEffect = -10 - Math.floor(rivalry.intensity / 5)
      message = `${rivalry.rivalName} has bested you. The rivalry ends in your defeat.`
      break
    case 'fade_away':
      reputationEffect = 0
      message = `Your rivalry with ${rivalry.rivalName} has simply faded with time.`
      break
  }
  
  return {
    finalRivalry: { ...rivalry, isActive: false },
    reputationEffect,
    message
  }
}

export function processWeeklyRivalries(
  rivalries: Rivalry[],
  currentWeek: number,
  currentYear: number
): Rivalry[] {
  return rivalries.map(rivalry => {
    if (!rivalry.isActive) return rivalry
    
    // Natural intensity decay over time
    const weeksSinceInteraction = 
      (currentYear - (rivalry.lastInteraction?.year || currentYear)) * 52 +
      (currentWeek - (rivalry.lastInteraction?.week || currentWeek))
    
    let intensity = rivalry.intensity
    if (weeksSinceInteraction > 4) {
      intensity = Math.max(10, intensity - 1)
    }
    if (weeksSinceInteraction > 26) {
      intensity = Math.max(5, intensity - 2)
    }
    
    // Rivalry fades if too weak
    const isActive = intensity > 5
    
    return {
      ...rivalry,
      intensity,
      isActive,
      mediaAttention: Math.min(50, Math.floor(intensity / 2)),
      motivationBonus: Math.min(20, Math.floor(intensity / 5)),
      stressIncrease: Math.min(25, Math.floor(intensity / 4))
    }
  })
}

// ============================================
// SCANDALS
// ============================================

export function createScandal(
  type: ScandalType,
  currentWeek: number,
  currentYear: number,
  hasHardEvidence: boolean = false
): Scandal {
  const template = SCANDAL_TEMPLATES.find(t => t.type === type)
  
  if (!template) {
    throw new Error(`Unknown scandal type: ${type}`)
  }
  
  return {
    ...template,
    id: `scandal-${Date.now()}`,
    discoveryDate: { week: currentWeek, year: currentYear },
    status: 'brewing',
    publicAwareness: 5,
    hasResponded: false,
    crisisManagementCost: 0,
    hasHardEvidence
  }
}

export function processScandalWeek(
  scandal: Scandal,
  privacy: PrivacyLevel,
  hasResponded: boolean
): Scandal {
  let updated = { ...scandal }
  
  // Scandal lifecycle
  switch (scandal.status) {
    case 'brewing':
      // Random chance of exposure based on privacy
      if (Math.random() * 100 < privacy.paparazziRisk) {
        updated.status = 'exposed'
        updated.publicAwareness = 20
      }
      break
      
    case 'exposed':
      // Grows rapidly
      updated.publicAwareness = Math.min(100, updated.publicAwareness + 15)
      if (updated.publicAwareness > 60) {
        updated.status = 'peak'
        updated.peakMediaWeek = { week: 0, year: 0 } // Would be set from context
      }
      break
      
    case 'peak':
      // Maximum damage
      updated.publicAwareness = Math.min(100, updated.publicAwareness + 5)
      // Will transition to declining after response or time
      if (hasResponded) {
        updated.status = 'declining'
      }
      break
      
    case 'declining':
      // Slowly fades
      updated.publicAwareness = Math.max(10, updated.publicAwareness - 5)
      if (updated.publicAwareness <= 15) {
        updated.status = 'resolved'
      }
      break
  }
  
  return updated
}

export function respondToScandal(
  scandal: Scandal,
  responseType: NonNullable<Scandal['responseType']>,
  isActuallyGuilty: boolean,
  currentWeek: number,
  currentYear: number
): {
  updatedScandal: Scandal
  reputationImpact: number
  cost: number
  success: boolean
  message: string
} {
  const response = SCANDAL_RESPONSES[responseType]
  
  // Base cost of crisis management
  const baseCost = scandal.severity === 'catastrophic' ? 500000 :
                   scandal.severity === 'major' ? 200000 :
                   scandal.severity === 'moderate' ? 50000 : 10000
  
  const cost = Math.round(baseCost * response.costMultiplier)
  
  // Calculate effectiveness
  const effectiveness = isActuallyGuilty 
    ? response.effectivenessIfGuilty 
    : response.effectivenessIfInnocent
  
  // Check for backfire
  const backfired = Math.random() * 100 < response.riskOfBackfire && isActuallyGuilty
  
  let reputationImpact = 0
  let success = false
  let message = ''
  
  if (backfired) {
    // Response backfired - things get worse
    reputationImpact = -scandal.reputationDamage * 1.5
    success = false
    message = `Your ${response.name} strategy backfired! The scandal has intensified.`
  } else if (effectiveness > 50) {
    // Successful response
    reputationImpact = -scandal.reputationDamage * (1 - effectiveness / 100) + response.mediaReaction
    success = true
    message = `Your ${response.name} strategy was effective. The scandal is dying down.`
  } else {
    // Partially effective
    reputationImpact = -scandal.reputationDamage * 0.7
    success = false
    message = `Your ${response.name} strategy had limited effect.`
  }
  
  // Update scandal
  const updatedScandal: Scandal = {
    ...scandal,
    hasResponded: true,
    responseType,
    crisisManagementCost: cost,
    status: backfired ? 'peak' : 'declining',
    publicAwareness: backfired 
      ? Math.min(100, scandal.publicAwareness + 20)
      : Math.max(scandal.publicAwareness - effectiveness / 3, 10)
  }
  
  if (success && !backfired) {
    updatedScandal.resolutionDate = { week: currentWeek, year: currentYear }
  }
  
  return {
    updatedScandal,
    reputationImpact: Math.round(reputationImpact),
    cost,
    success,
    message
  }
}

export function calculateOngoingScandalEffects(scandals: Scandal[]): {
  reputationDrain: number
  sponsorRisk: number
  stressIncrease: number
  partnerTrustDamage: number
} {
  const activeScandals = scandals.filter(s => s.status !== 'resolved')
  
  if (activeScandals.length === 0) {
    return { reputationDrain: 0, sponsorRisk: 0, stressIncrease: 0, partnerTrustDamage: 0 }
  }
  
  return activeScandals.reduce((acc, scandal) => {
    const damage = calculateScandalDamage(scandal)
    
    return {
      reputationDrain: acc.reputationDrain + damage * 0.1, // Weekly drain
      sponsorRisk: Math.min(100, acc.sponsorRisk + scandal.sponsorImpact * (scandal.publicAwareness / 100)),
      stressIncrease: acc.stressIncrease + (scandal.status === 'peak' ? 20 : 10),
      partnerTrustDamage: acc.partnerTrustDamage + scandal.partnerTrustDamage * 0.1
    }
  }, { reputationDrain: 0, sponsorRisk: 0, stressIncrease: 0, partnerTrustDamage: 0 })
}

// ============================================
// PRIVACY MANAGEMENT
// ============================================

export function setPrivacyLevel(
  _currentLevel: PrivacyLevel['level'],
  scandals: Scandal[]
): {
  recommendedLevel: PrivacyLevel['level']
  reason: string
} {
  const activeScandals = scandals.filter(s => s.status !== 'resolved').length
  
  if (activeScandals > 0) {
    return {
      recommendedLevel: 'private',
      reason: 'Active scandals make increased privacy advisable'
    }
  }
  
  // Default recommendation based on current
  return {
    recommendedLevel: 'balanced',
    reason: 'Balanced privacy offers good sponsor appeal with reasonable protection'
  }
}

export function calculatePrivacyCosts(level: PrivacyLevel['level']): number {
  return getPrivacyLevel(level).monthlySecurityCost
}

// ============================================
// CONTACT ENCOUNTER SYSTEM INTEGRATION
// ============================================
// Use these functions to roll for meeting new people at events

export interface EncounterContext {
  eventType: SocialEventType
  playerFame: number           // 0-100
  playerPublicImage: number    // 0-100
  hasPartner: boolean
  playerAge: number
  preferredGender?: Gender     // For romantic encounters
  currentWeek: number
  currentYear: number
}

export interface EncounterResult {
  success: boolean
  contact?: ContactInfo
  potentialDate?: PotentialDate
  introMessage?: string
  metAt: string
  isRomantic: boolean
}

/**
 * Map social event types to encounter event types
 */
function mapEventType(eventType: SocialEventType): import('@/services/contactService').EventType {
  switch (eventType) {
    case 'gala':
    case 'charity_gala':
    case 'awards_ceremony':
    case 'fashion_show':
      return 'gala'
    case 'paddock_party':
    case 'team_celebration':
      return 'paddock_social'
    case 'sponsor_dinner':
    case 'business_networking':
      return 'sponsor_meeting'
    case 'media_appearance':
    case 'interview':
      return 'media_event'
    default:
      return 'social_scene'
  }
}

/**
 * Roll for encounters at a social event
 * Call this when attending galas, parties, and other social gatherings
 */
export async function rollForEventEncounters(
  context: EncounterContext
): Promise<EncounterResult[]> {
  const results: EncounterResult[] = []
  
  try {
    // Dynamically import to avoid circular dependencies
    const { rollEventEncounter, generatePotentialDate } = await import('@/services/contactService')
    
    const eventType = mapEventType(context.eventType)
    
    // Base number of encounter rolls based on event type
    let rollCount = 1
    if (context.eventType === 'gala' || context.eventType === 'charity_gala') {
      rollCount = 2 // Galas have more networking opportunities
    } else if (context.eventType === 'paddock_party' || context.eventType === 'team_celebration') {
      rollCount = 3 // Party atmosphere = more mingling
    }
    
    // Fame bonus: famous people attract more attention
    if (context.playerFame > 80) {
      rollCount += 1
    }
    
    for (let i = 0; i < rollCount; i++) {
      const encounterResult = rollEventEncounter(
        eventType,
        {
          fame: context.playerFame,
          publicImage: context.playerPublicImage,
          hasPartner: context.hasPartner,
          playerAge: context.playerAge,
          preferredGender: context.preferredGender
        },
        context.currentWeek,
        context.currentYear
      )
      
      if (encounterResult.success && encounterResult.contact) {
        const isRomantic = encounterResult.contact.type === 'potential_date' || 
                          encounterResult.contact.type === 'partner'
        
        // For romantic encounters, also create a detailed PotentialDate entry
        let potentialDateEntry: PotentialDate | undefined
        if (isRomantic && !context.hasPartner) {
          // Get the gender from the contact or use the result
          const contactGender = encounterResult.contact.gender || 
                               (context.preferredGender === 'male' ? 'female' : 'male')
          
          const dateEntry = generatePotentialDate(
            contactGender,
            encounterResult.metAt,
            context.currentWeek,
            context.currentYear,
            context.playerAge
          )
          
          // Override the name to match the contact
          potentialDateEntry = {
            ...dateEntry,
            firstName: encounterResult.contact.name.split(' ')[0],
            lastName: encounterResult.contact.name.split(' ').slice(1).join(' '),
            id: encounterResult.contact.id // Link to the same ID
          }
        }
        
        results.push({
          success: true,
          contact: encounterResult.contact as ContactInfo,
          potentialDate: potentialDateEntry,
          introMessage: encounterResult.introMessage,
          metAt: encounterResult.metAt,
          isRomantic
        })
      }
    }
  } catch (error) {
    console.error('[SocialEvents] Failed to roll for encounters:', error)
  }
  
  return results
}

/**
 * Enhanced attendSocialEvent that includes encounter system
 */
export function attendSocialEventWithEncounters(
  event: SocialEvent,
  playerReputation: number,
  playerBrand: PersonalBrand,
  partnerPresent: boolean,
  encounterContext: EncounterContext
): Promise<{
  outcome: EventOutcome
  reputationChange: number
  newContacts: Array<{ type: string; name: string }>
  sponsorLeads: Array<{ company: string; value: number }>
  brandEffects: Partial<PersonalBrand>
  encounters: EncounterResult[]
}> {
  return new Promise(async (resolve) => {
    // First, get the base event results
    const baseResult = attendSocialEvent(event, playerReputation, playerBrand, partnerPresent)
    
    // Then roll for encounters
    const encounters = await rollForEventEncounters(encounterContext)
    
    // Merge new contacts from encounters into the result
    const encounterContacts = encounters
      .filter(e => e.contact)
      .map(e => ({
        type: e.contact!.type,
        name: e.contact!.name
      }))
    
    resolve({
      ...baseResult,
      newContacts: [...baseResult.newContacts, ...encounterContacts],
      encounters
    })
  })
}
