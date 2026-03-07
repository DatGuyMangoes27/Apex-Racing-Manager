// ============================================
// SOCIAL EVENTS MANAGER
// ============================================
// Handles social events, philanthropy, rivalries, and scandal simulation.
// Now integrated with the encounter/dating system!

import {
  SocialEvent,
  SocialEventType,
  EventOutcome,
  AttendanceTier,
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
  calculateScandalDamage
} from '../../data/social-events-config'
import type { PersonalBrand } from '../../data/lifestyle-config'
import type { ContactInfo, PotentialDate } from '@/types/personalLife'
import type { Gender } from '@/services/contactService'

// ============================================
// TIER BONUSES
// ============================================

const TIER_BONUSES: Record<AttendanceTier, {
  positiveWeightBonus: number   // Added to positive outcome chance
  guaranteedContacts: number    // Extra guaranteed contacts
  guaranteedSponsorLead: boolean
  qualityCapBonus: number       // Extra quality cap for hosting
  networkingMultiplier: number  // Multiplier on networking effects
}> = {
  standard: { positiveWeightBonus: 0, guaranteedContacts: 0, guaranteedSponsorLead: false, qualityCapBonus: 0, networkingMultiplier: 1 },
  vip: { positiveWeightBonus: 0.15, guaranteedContacts: 1, guaranteedSponsorLead: false, qualityCapBonus: 1, networkingMultiplier: 1.5 },
  vip_table: { positiveWeightBonus: 0.3, guaranteedContacts: 2, guaranteedSponsorLead: true, qualityCapBonus: 2, networkingMultiplier: 2 }
}

// ============================================
// INVITED CONTACT PROCESSING
// ============================================

export interface InvitedContactResult {
  contactId: string
  relationshipBoost: number
  trustBoost: number
  romanceBoost: number
  bonusContact?: { type: string; name: string }  // Contact introduced by your guest
  logMessage: string
}

export function processInvitedContacts(
  invitedContactIds: string[],
  contacts: any[],
  outcomeType: 'positive' | 'neutral' | 'negative',
  eventName: string,
  hasPartner: boolean,
  partnerId?: string
): InvitedContactResult[] {
  const results: InvitedContactResult[] = []
  
  const qualityBonus = outcomeType === 'positive' ? 15 : outcomeType === 'neutral' ? 8 : 3
  const trustBonus = outcomeType === 'positive' ? 8 : outcomeType === 'neutral' ? 4 : 1
  
  for (const contactId of invitedContactIds) {
    const contact = contacts.find((c: any) => c.id === contactId)
    if (!contact) continue
    
    const result: InvitedContactResult = {
      contactId,
      relationshipBoost: qualityBonus,
      trustBoost: trustBonus,
      romanceBoost: 0,
      logMessage: `Attended ${eventName} with ${contact.name}`
    }
    
    // Partner/date romance boost
    const contactType = contact.type || ''
    if (contactId === partnerId) {
      result.romanceBoost = outcomeType === 'positive' ? 10 : 5
      result.relationshipBoost += 5
      result.logMessage = `Power couple appearance at ${eventName} with ${contact.name}`
    } else if (contactType === 'potential_date') {
      result.romanceBoost = outcomeType === 'positive' ? 8 : 4
      result.logMessage = `Date night at ${eventName} with ${contact.name}`
      // Drama if player has a partner and brings a date
      if (hasPartner && partnerId && contactId !== partnerId) {
        result.logMessage = `Brought ${contact.name} to ${eventName} — your partner won't be happy`
      }
    }
    
    // Business contacts may introduce you to their network
    const businessTypes = ['business_mogul', 'sponsor_exec', 'banker', 'politician', 'lawyer']
    if (businessTypes.includes(contactType) && outcomeType !== 'negative' && Math.random() < 0.35) {
      const introTypes = ['business_mogul', 'sponsor_exec', 'banker', 'celebrity']
      const introType = introTypes[Math.floor(Math.random() * introTypes.length)]
      result.bonusContact = { 
        type: introType, 
        name: `${contact.name}'s Associate` 
      }
      result.logMessage += ` — ${contact.name} introduced you to a colleague`
    }
    
    results.push(result)
  }
  
  return results
}

export function attendSocialEvent(
  event: SocialEvent,
  playerReputation: number,
  playerBrand: PersonalBrand,
  partnerPresent: boolean,
  lifestyleNetworkingBonus: number = 0,
  lifestylePrestigeBonus: number = 0,
  partnerSocialEventBonus: number = 0
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
  
  const tier: AttendanceTier = event.attendanceTier || 'standard'
  const tierBonus = TIER_BONUSES[tier]
  
  // Roll for outcome — tier improves positive weighting
  const possibleOutcomes = POSSIBLE_EVENT_OUTCOMES[event.type] || []
  const roll = Math.random()
  
  // Weight towards positive with higher brand value + tier bonus + lifestyle bonuses
  const brandBonus = playerBrand.brandValue / 200 // Max 0.5 bonus
  const lifestyleBonus = Math.min(0.1, (lifestylePrestigeBonus * 0.0005) + (lifestyleNetworkingBonus * 0.001)) // Up to +10% from lifestyle
  const partnerEventBonus = Math.min(0.05, partnerSocialEventBonus * 0.005) // Up to +5% from partner traits
  const positiveThreshold = 0.4 + brandBonus + tierBonus.positiveWeightBonus + lifestyleBonus + partnerEventBonus
  
  let outcome: EventOutcome
  if (roll < positiveThreshold) {
    // Pick a random positive outcome for variety
    const positives = possibleOutcomes.filter(o => o.type === 'positive')
    outcome = positives[Math.floor(Math.random() * positives.length)] || possibleOutcomes[0]
  } else if (roll < 0.8 + brandBonus / 2 + tierBonus.positiveWeightBonus / 2) {
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
  
  // Tier guaranteed contacts
  if (tierBonus.guaranteedContacts > 0) {
    const contactTypes = event.expectedAttendeeTypes || ['business_mogul']
    for (let i = 0; i < tierBonus.guaranteedContacts; i++) {
      const ct = contactTypes[Math.floor(Math.random() * contactTypes.length)]
      newContacts.push({ type: ct, name: `VIP ${ct.replace(/_/g, ' ')}` })
    }
  }
  
  // Lifestyle networking bonus: chance to meet an additional high-quality contact
  if (lifestyleNetworkingBonus > 5 && Math.random() < Math.min(0.4, lifestyleNetworkingBonus * 0.02)) {
    const premiumTypes = ['business_mogul', 'sponsor_exec', 'celebrity', 'politician']
    const ct = premiumTypes[Math.floor(Math.random() * premiumTypes.length)]
    newContacts.push({ type: ct, name: `Networking ${ct.replace(/_/g, ' ')}` })
  }
  
  // Tier guaranteed sponsor lead
  if (tierBonus.guaranteedSponsorLead && sponsorLeads.length === 0) {
    sponsorLeads.push({ company: 'VIP Table Connection', value: Math.floor(100000 + Math.random() * 500000) })
  }
  
  // Base reputation from event (boosted by networking multiplier for tier)
  let reputationChange = event.effects.publicImageChange
  reputationChange += outcome.effects.reputationChange || 0
  reputationChange = Math.round(reputationChange * tierBonus.networkingMultiplier)
  
  // Partner bonus — doubled if bringing partner as plus-one with VIP
  if (partnerPresent && event.effects.partnerHappinessBonus) {
    const coupleBonus = tier !== 'standard' ? 4 : 2
    reputationChange += coupleBonus // Power couple image boost
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
  const tier: AttendanceTier = event.attendanceTier || 'standard'
  const tierBonus = TIER_BONUSES[tier]
  
  // Quality based on budget vs expected — tier raises cap
  const expectedBudget = event.cost
  const maxQuality = 2 + tierBonus.qualityCapBonus
  const qualityMultiplier = Math.min(maxQuality, budget / expectedBudget)
  
  const success = qualityMultiplier >= 0.8
  
  // Effects scale with quality and tier networking multiplier
  const reputationGain = Math.round(event.effects.publicImageChange * qualityMultiplier * tierBonus.networkingMultiplier)
  const sponsorImpressions = Math.round(event.effects.sponsorImpressions * qualityMultiplier * tierBonus.networkingMultiplier)
  const newContacts = Math.floor(event.effects.networkingOpportunities / 10 * qualityMultiplier) + tierBonus.guaranteedContacts
  
  const tierLabel = tier === 'vip' ? ' (VIP)' : tier === 'vip_table' ? ' (VIP Table)' : ''
  let message = ''
  if (qualityMultiplier >= 1.5) {
    message = `Your ${event.name}${tierLabel} was the talk of the town! Exceptional event.`
  } else if (qualityMultiplier >= 1) {
    message = `Your ${event.name}${tierLabel} was a great success.`
  } else if (qualityMultiplier >= 0.8) {
    message = `Your ${event.name}${tierLabel} went well, though it wasn't extravagant.`
  } else {
    message = `Your ${event.name}${tierLabel} was underwhelming. Guests expected more.`
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
      reputationEffect = 5
      message = 'You and your rival have buried the hatchet. Respect earned.'
      break
    case 'total_victory':
      reputationEffect = 15
      message = 'You dominated the rivalry. Your reputation soars.'
      break
    case 'defeat':
      reputationEffect = -10
      message = 'The rivalry ended with you on the losing side.'
      break
    case 'fade_away':
      reputationEffect = 0
      message = 'The rivalry has faded with time. Neither side won.'
      break
  }

  return {
    finalRivalry: {
      ...rivalry,
      isActive: false,
      intensity: 0
    },
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
  // World encounter system: pass game-world entities for weighted encounter rolls
  worldEntities?: Array<{ id: string; name: string; entityType: 'rival_driver' | 'team_owner' | 'staff' | 'investor'; teamName?: string; role?: string; nationality?: string; reputation?: number }>
  existingContactEntityIds?: Set<string>  // Entity IDs already in player's contacts
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
    const { getWeightedEncounterPool, pickWorldEntityForEncounter, generateWorldContact } = await import('@/services/worldContactService')
    
    const eventType = mapEventType(context.eventType)
    
    // Set up world encounter pool if world entities are provided
    const worldPool = context.worldEntities && context.worldEntities.length > 0
      ? getWeightedEncounterPool(context.eventType, context.worldEntities)
      : null
    
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
      // Try world character encounter first (if world entities provided)
      if (worldPool) {
        const worldEntity = pickWorldEntityForEncounter(worldPool, context.existingContactEntityIds || new Set())
        if (worldEntity) {
          const worldContact = generateWorldContact(
            worldEntity,
            context.eventType,
            context.currentWeek,
            context.currentYear
          )
          results.push({
            success: true,
            contact: worldContact,
            introMessage: `You met ${worldEntity.name}${worldEntity.teamName ? ` from ${worldEntity.teamName}` : ''} at the event.`,
            metAt: context.eventType,
            isRomantic: false
          })
          // Add to existing contacts so we don't pick them again
          context.existingContactEntityIds?.add(worldEntity.id)
          continue // Skip random NPC roll for this slot
        }
      }
      
      // Fall back to random NPC encounter
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
    const baseResult = attendSocialEvent(event, playerReputation, playerBrand, partnerPresent)
    const encounters = await rollForEventEncounters(encounterContext)
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

