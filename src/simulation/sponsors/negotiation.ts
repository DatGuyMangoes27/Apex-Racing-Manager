/**
 * Sponsor Negotiation System
 * 
 * Handles the state machine for sponsor negotiations, offer generation,
 * counter-offer processing, and response timing.
 */

import {
  SponsorNegotiation,
  NegotiationStatus,
  NegotiationRound,
  SponsorOffer,
  SponsorPersonalityType,
  TeamSponsorSlot,
  TeamSponsorTarget,
  OwnedTeam,
  TeamSponsorDeal
} from '@/store/careerStore'
import type { Sponsor } from '@/data/sponsors'
import { getTeamSponsorTierForReputation, getSponsorWeeklyPortfolioCap } from '@/data/financial-config'
import { getSponsorById, getSponsors } from '@/services/preGeneratedContentService'

// ============================================
// CONSTANTS
// ============================================

export const NEGOTIATION_CONFIG = {
  counterTolerance: 0.25,  // 25% difference tolerance
  walkawayChancePerRound: 0.05,  // 5% base chance per round
  maxRounds: 5
} as const

/** How many weeks a declined sponsor is on cooldown before re-approach */
export const DECLINE_COOLDOWN_WEEKS = 8

/**
 * Reputation penalty for declining sponsors.
 */
export function getSponsorDeclinePenalty(sponsorTier: string): number {
  switch (sponsorTier) {
    case 'elite': return 3
    case 'high': return 2
    case 'mid': return 1
    case 'entry': return 0
    default: return 1
  }
}

/**
 * Returns response delay in weeks based on sponsor characteristics.
 */
export function getResponseDelay(
  sponsor: { tier: string; personality?: string; patience?: number },
  responseType: 'outreach' | 'counter'
): number {
  const tierDelays: Record<string, { outreach: [number, number]; counter: [number, number] }> = {
    entry: { outreach: [1, 1], counter: [1, 1] },
    mid: { outreach: [1, 2], counter: [1, 1] },
    high: { outreach: [2, 3], counter: [1, 2] },
    elite: { outreach: [3, 4], counter: [2, 3] }
  }

  const [min, max] = tierDelays[sponsor.tier]?.[responseType] ?? [1, 2]
  let delay = min + Math.floor(Math.random() * (max - min + 1))

  if (sponsor.personality === 'corporate') delay += 1
  if (sponsor.personality === 'casual') delay = Math.max(1, delay - 1)

  return Math.max(1, delay)
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate the percentage difference between two offers
 */
export function calculateOfferDifference(offer1: SponsorOffer, offer2: SponsorOffer): number {
  const total1 = offer1.monthlyPayment * 12 * offer1.duration + 
                 offer1.winBonus * 10 + 
                 offer1.podiumBonus * 20 + 
                 offer1.championshipBonus
  const total2 = offer2.monthlyPayment * 12 * offer2.duration + 
                 offer2.winBonus * 10 + 
                 offer2.podiumBonus * 20 + 
                 offer2.championshipBonus
  
  if (total1 === 0) return 0
  return Math.abs((total2 - total1) / total1)
}

/**
 * Validate a counter offer
 */
export function validateCounterOffer(
  negotiation: SponsorNegotiation,
  counterOffer: SponsorOffer
): { acceptable: boolean; reason?: string } {
  const difference = calculateOfferDifference(negotiation.currentOffer, counterOffer)
  
  // Check if asking for too much more
  if (difference > NEGOTIATION_CONFIG.counterTolerance) {
    return {
      acceptable: false,
      reason: 'Counter offer requests too much above current offer'
    }
  }
  
  // Duration cannot exceed 5 years
  if (counterOffer.duration > 5) {
    return {
      acceptable: false,
      reason: 'Contract duration cannot exceed 5 years'
    }
  }
  
  // Duration cannot be less than 1 year
  if (counterOffer.duration < 1) {
    return {
      acceptable: false,
      reason: 'Contract duration must be at least 1 year'
    }
  }
  
  return { acceptable: true }
}

/**
 * Process player's counter offer and generate sponsor response
 */
export function processSponsorCounterResponse(
  negotiation: SponsorNegotiation,
  playerCounter: SponsorOffer,
  currentWeek: number,
  currentYear: number
): {
  negotiation: SponsorNegotiation
  response: 'accept' | 'counter' | 'withdraw'
  sponsorCounter?: SponsorOffer
} {
  const roundNumber = negotiation.rounds.length + 1
  
  // Check if max rounds exceeded
  if (roundNumber >= negotiation.maxRounds) {
    return {
      negotiation: {
        ...negotiation,
        status: 'sponsor_withdrew',
        lastActivityWeek: currentWeek,
        lastActivityYear: currentYear
      },
      response: 'withdraw'
    }
  }
  
  // Calculate how aggressive the counter is
  const difference = calculateOfferDifference(negotiation.currentOffer, playerCounter)
  
  // Patience affects tolerance
  const toleranceModifier = negotiation.patience * 0.05  // 0.05 - 0.25
  const effectiveTolerance = NEGOTIATION_CONFIG.counterTolerance + toleranceModifier
  
  // Chance to accept decreases with each round
  const baseAcceptChance = 0.3 - (roundNumber * 0.05)
  const acceptChance = Math.max(0.1, baseAcceptChance + (negotiation.patience * 0.05))
  
  // If counter is reasonable, might accept
  if (difference <= effectiveTolerance * 0.5 && Math.random() < acceptChance) {
    return {
      negotiation: {
        ...negotiation,
        status: 'accepted',
        currentOffer: playerCounter,
        lastActivityWeek: currentWeek,
        lastActivityYear: currentYear,
        rounds: [
          ...negotiation.rounds,
          {
            roundNumber,
            proposedBy: 'team',
            offer: playerCounter,
            response: 'accept',
            responseWeek: currentWeek,
            responseYear: currentYear,
            emailId: ''
          }
        ]
      },
      response: 'accept'
    }
  }
  
  // Chance to walk away
  const walkawayChance = NEGOTIATION_CONFIG.walkawayChancePerRound * (roundNumber - 1) *
    (difference > effectiveTolerance ? 2 : 1) *
    (6 - negotiation.patience) / 3
  
  if (Math.random() < walkawayChance) {
    return {
      negotiation: {
        ...negotiation,
        status: 'sponsor_withdrew',
        lastActivityWeek: currentWeek,
        lastActivityYear: currentYear,
        rounds: [
          ...negotiation.rounds,
          {
            roundNumber,
            proposedBy: 'team',
            offer: playerCounter,
            response: 'decline',
            responseWeek: currentWeek,
            responseYear: currentYear,
            emailId: ''
          }
        ]
      },
      response: 'withdraw'
    }
  }
  
  // Generate counter-counter offer (meeting halfway)
  const sponsorCounter = generateSponsorCounterOffer(
    negotiation.currentOffer,
    playerCounter,
    negotiation.patience
  )
  
  return {
    negotiation: {
      ...negotiation,
      status: 'reviewing_offer',
      currentOffer: sponsorCounter,
      lastActivityWeek: currentWeek,
      lastActivityYear: currentYear,
      rounds: [
        ...negotiation.rounds,
        {
          roundNumber,
          proposedBy: 'team',
          offer: playerCounter,
          response: 'counter',
          responseWeek: currentWeek,
          responseYear: currentYear,
          emailId: ''
        }
      ]
    },
    response: 'counter',
    sponsorCounter
  }
}

/**
 * Generate sponsor's counter offer
 */
function generateSponsorCounterOffer(
  sponsorOffer: SponsorOffer,
  playerOffer: SponsorOffer,
  patience: number
): SponsorOffer {
  // Meet partway between offers based on patience
  const meetingPoint = 0.3 + (patience * 0.1)  // 0.4 - 0.8
  
  return {
    slot: sponsorOffer.slot,
    monthlyPayment: Math.round(
      sponsorOffer.monthlyPayment + 
      (playerOffer.monthlyPayment - sponsorOffer.monthlyPayment) * meetingPoint
    ),
    winBonus: Math.round(
      sponsorOffer.winBonus + 
      (playerOffer.winBonus - sponsorOffer.winBonus) * meetingPoint
    ),
    podiumBonus: Math.round(
      sponsorOffer.podiumBonus + 
      (playerOffer.podiumBonus - sponsorOffer.podiumBonus) * meetingPoint
    ),
    championshipBonus: Math.round(
      sponsorOffer.championshipBonus + 
      (playerOffer.championshipBonus - sponsorOffer.championshipBonus) * meetingPoint
    ),
    duration: playerOffer.duration,  // Usually accept duration changes
    targets: sponsorOffer.targets   // Targets stay the same
  }
}

// ============================================
// NEGOTIATION ACCEPTANCE
// ============================================

/**
 * Accept current offer and convert to sponsor deal
 */
export function acceptNegotiation(
  negotiation: SponsorNegotiation,
  currentYear: number
): TeamSponsorDeal {
  const offer = negotiation.currentOffer
  
  return {
    id: `team_sponsor_${Date.now()}`,
    sponsorId: negotiation.sponsorId,
    sponsorName: negotiation.sponsorName,
    slot: offer.slot,
    monthlyPayment: offer.monthlyPayment,
    winBonus: offer.winBonus,
    podiumBonus: offer.podiumBonus,
    championshipBonus: offer.championshipBonus,
    startYear: currentYear,
    duration: offer.duration,
    active: true,
    satisfaction: 70,  // Start at 70%
    targets: offer.targets,
    seasonWins: 0,
    seasonPodiums: 0,
    seasonRaces: 0,
    warningIssued: false,
    finalWarningIssued: false
  }
}

function getSlotMultiplier(slot: TeamSponsorSlot): number {
  switch (slot) {
    case 'title': return 2.2
    case 'primary': return 1.25
    case 'secondary': return 0.9
    case 'associate': return 0.35
    default: return 1.0
  }
}

function determineNegotiationSlot(team: OwnedTeam, tierName: string): TeamSponsorSlot {
  const sponsors = team.finances?.sponsors ?? []
  const active = sponsors.filter(s => s.active)

  const hasTitle = active.some(s => s.slot === 'title')
  if (!hasTitle && tierName === 'global') return 'title'

  const primaryCount = active.filter(s => s.slot === 'primary').length
  if (primaryCount < 2 && (tierName === 'global' || tierName === 'international')) return 'primary'

  const secondaryCount = active.filter(s => s.slot === 'secondary').length
  if (secondaryCount < 3 && tierName !== 'local') return 'secondary'

  return 'associate'
}

function buildInitialOffer(team: OwnedTeam, slot: TeamSponsorSlot): SponsorOffer {
  const tier = getTeamSponsorTierForReputation(team.reputation ?? 0)
  const duration = Math.floor(Math.random() * 3) + 1
  const mult = getSlotMultiplier(slot)

  const monthlyPayment = Math.round(
    lerp(tier.monthlyPaymentRange.min, tier.monthlyPaymentRange.max, Math.random()) * mult
  )
  const winBonus = Math.round(
    lerp(tier.winBonusRange.min, tier.winBonusRange.max, Math.random()) * mult
  )
  const podiumBonus = Math.round(
    lerp(tier.podiumBonusRange.min, tier.podiumBonusRange.max, Math.random()) * mult
  )

  const currentActiveWeekly = (team.finances?.sponsors || [])
    .filter(s => s.active)
    .reduce((sum, s) => sum + Math.round((s.monthlyPayment || 0) / 4), 0)
  const weeklyPortfolioCap = getSponsorWeeklyPortfolioCap(team.reputation ?? 0)
  const remainingWeeklyHeadroom = Math.max(0, weeklyPortfolioCap - currentActiveWeekly)
  const maxMonthlyByHeadroom = remainingWeeklyHeadroom * 4
  const boundedMonthly = maxMonthlyByHeadroom > 0
    ? Math.min(monthlyPayment, maxMonthlyByHeadroom)
    : monthlyPayment

  const championshipBonus = tier.tier === 'global'
    ? Math.round(boundedMonthly * 12)
    : tier.tier === 'international'
      ? Math.round(boundedMonthly * 6)
      : 0

  const targets: TeamSponsorTarget[] = [{
    id: `target_races_${Date.now()}`,
    type: 'races_entered',
    targetValue: 8 * duration,
    currentValue: 0,
    description: `Enter at least ${8 * duration} races`,
    met: false,
    exceeded: false
  }]

  return {
    slot,
    monthlyPayment: boundedMonthly,
    winBonus,
    podiumBonus,
    championshipBonus,
    duration,
    targets
  }
}

function createNegotiation(
  sponsor: Sponsor,
  team: OwnedTeam,
  initiatedBy: 'team' | 'sponsor',
  currentWeek: number,
  currentYear: number
): SponsorNegotiation {
  const tier = getTeamSponsorTierForReputation(team.reputation ?? 0)
  const slot = determineNegotiationSlot(team, tier.tier)
  const initialOffer = buildInitialOffer(team, slot)
  const patience = sponsor.tier === 'elite' ? 4 : sponsor.tier === 'high' ? 4 : sponsor.tier === 'mid' ? 3 : 2
  const maxRounds = Math.min(5, Math.max(3, patience + 1))
  const expiresWeekNorm = ((currentWeek + 8 - 1) % 52) + 1
  const expiresYearNorm = currentWeek + 8 > 52 ? currentYear + 1 : currentYear

  const personality: SponsorPersonalityType =
    sponsor.category === 'financial' || sponsor.category === 'finance'
      ? 'corporate'
      : sponsor.category === 'lifestyle' || sponsor.category === 'apparel'
        ? 'casual'
        : sponsor.tier === 'elite'
          ? 'demanding'
          : 'formal'

  const status: NegotiationStatus = initiatedBy === 'team' ? 'outreach_sent' : 'reviewing_offer'

  return {
    id: `sponsor_neg_${Date.now()}_${sponsor.id}`,
    sponsorId: sponsor.id,
    sponsorName: sponsor.name,
    sponsorCategory: sponsor.category,
    sponsorTier: sponsor.tier,
    initiatedBy,
    status,
    personality,
    patience,
    currentOffer: { ...initialOffer },
    initialOffer: { ...initialOffer },
    rounds: [],
    maxRounds,
    startedWeek: currentWeek,
    startedYear: currentYear,
    expiresWeek: expiresWeekNorm,
    expiresYear: expiresYearNorm,
    lastActivityWeek: currentWeek,
    lastActivityYear: currentYear,
    lastEmailId: ''
  }
}

// ============================================
// SPONSOR APPROACH (INCOMING)
// ============================================

/**
 * Check if a sponsor should approach the team this week
 * 
 * Sponsors only approach teams that meet or nearly meet their requirements.
 */
export function shouldSponsorApproach(
  sponsor: Sponsor,
  team: OwnedTeam,
  marketingBudget: number
): boolean {
  // Already sponsored by them?
  const existingSponsors = team.finances?.sponsors || []
  if (existingSponsors.some(s => s.sponsorId === sponsor.id)) {
    return false
  }
  
  // Check active negotiations
  const activeNegotiations = team.finances?.activeNegotiations || []
  if (activeNegotiations.some(n => n.sponsorId === sponsor.id && 
      n.status !== 'accepted' && n.status !== 'declined' && n.status !== 'expired')) {
    return false
  }
  
  // Check reputation vs requirements (use correct field: minReputation)
  const repRequirement = sponsor.requirements?.minReputation || 0
  if (repRequirement > 0 && team.reputation < repRequirement * 0.8) {
    return false  // Too low reputation - sponsor won't approach
  }
  
  // Check wins requirement
  const winsRequirement = sponsor.requirements?.minWins || 0
  const teamWins = 0 // TODO: Get team wins from career state
  if (winsRequirement > 0 && teamWins < Math.ceil(winsRequirement * 0.7)) {
    return false  // Not enough wins - sponsor won't approach
  }
  
  // Base approach chance
  let chance = 0.02  // 2% base weekly chance
  
  // Reputation bonus
  if (team.reputation >= repRequirement) {
    chance += 0.02
  }
  if (team.reputation >= repRequirement * 1.5) {
    chance += 0.03
  }
  
  // Marketing budget effect (normalized to $10k = +1% chance)
  chance += (marketingBudget / 10000) * 0.01
  
  // Tier matching - higher tier sponsors are more interested in higher tier teams
  const teamTier = getTeamSponsorTierForReputation(team.reputation)
  // Map sponsor tier to approximate team tier level for comparison
  // 'entry'/'mid' sponsors prefer 'local'/'regional' teams
  // 'high'/'elite' sponsors prefer 'national'/'international'/'global' teams
  const sponsorPrefersHigherTier = sponsor.tier === 'high' || sponsor.tier === 'elite'
  const teamIsHigherTier = ['national', 'international', 'global'].includes(teamTier.tier)
  if (sponsorPrefersHigherTier === teamIsHigherTier) {
    chance += 0.02
  }
  
  return Math.random() < chance
}

/**
 * Generate approaching sponsors for this week
 */
export function generateWeeklySponsorApproaches(
  team: OwnedTeam,
  currentWeek: number,
  currentYear: number,
  maxApproaches: number = 2
): SponsorNegotiation[] {
  const approaches: SponsorNegotiation[] = []
  const marketingBudget = team.budgets?.marketingBudget || 0
  
  // Shuffle sponsors for randomness
  const shuffledSponsors = [...getSponsors()].sort(() => Math.random() - 0.5)
  
  for (const sponsor of shuffledSponsors) {
    if (approaches.length >= maxApproaches) break
    
    if (shouldSponsorApproach(sponsor, team, marketingBudget)) {
      approaches.push(createNegotiation(sponsor, team, 'sponsor', currentWeek, currentYear))
    }
  }
  
  return approaches
}

// ============================================
// TEAM OUTREACH
// ============================================

/**
 * Check if team can approach a sponsor
 * 
 * Teams can approach sponsors even if they don't fully meet requirements,
 * but must be within 70% of the reputation requirement.
 */
export function canApproachSponsor(
  sponsor: Sponsor,
  team: OwnedTeam
): { canApproach: boolean; reason?: string } {
  // Already sponsored by them?
  const existingSponsors = team.finances?.sponsors || []
  if (existingSponsors.some(s => s.sponsorId === sponsor.id)) {
    return { canApproach: false, reason: 'Already sponsored by this company' }
  }
  
  // Check active negotiations
  const activeNegotiations = team.finances?.activeNegotiations || []
  const existingNegotiation = activeNegotiations.find(n => 
    n.sponsorId === sponsor.id && 
    !['accepted', 'declined', 'expired', 'sponsor_withdrew'].includes(n.status)
  )
  if (existingNegotiation) {
    return { canApproach: false, reason: 'Already in negotiations with this sponsor' }
  }
  
  // Check reputation requirement (use correct field: minReputation)
  const repRequirement = sponsor.requirements?.minReputation || 0
  if (repRequirement > 0 && team.reputation < repRequirement * 0.7) {
    return { 
      canApproach: false, 
      reason: `Team reputation too low (need ${Math.round(repRequirement * 0.7)}+)` 
    }
  }
  
  // Check wins requirement
  const winsRequirement = sponsor.requirements?.minWins || 0
  const teamWins = 0 // TODO: Get team wins from career state
  if (winsRequirement > 0 && teamWins < Math.ceil(winsRequirement * 0.5)) {
    return {
      canApproach: false,
      reason: `Need at least ${Math.ceil(winsRequirement * 0.5)} career wins (have ${teamWins})`
    }
  }
  
  return { canApproach: true }
}

/**
 * Initiate outreach to a sponsor
 */
export function initiateOutreach(
  sponsor: Sponsor,
  team: OwnedTeam,
  currentWeek: number,
  currentYear: number
): SponsorNegotiation | null {
  const { canApproach, reason } = canApproachSponsor(sponsor, team)
  if (!canApproach) {
    console.warn(`Cannot approach sponsor: ${reason}`)
    return null
  }
  
  return createNegotiation(sponsor, team, 'team', currentWeek, currentYear)
}

// ============================================
// OUTREACH RESPONSE PROCESSING
// ============================================

/**
 * Process sponsor response to team outreach
 */
export function processOutreachResponse(
  negotiation: SponsorNegotiation,
  team: OwnedTeam,
  currentWeek: number,
  currentYear: number
): {
  negotiation: SponsorNegotiation
  response: 'interested' | 'soft_decline' | 'hard_decline'
} {
  const sponsor = getSponsorById(negotiation.sponsorId)
  if (!sponsor) {
    return {
      negotiation: { ...negotiation, status: 'declined' },
      response: 'hard_decline'
    }
  }
  
  // Check requirements (use correct field: minReputation, minWins)
  const repRequirement = sponsor.requirements?.minReputation || 0
  const winsRequirement = sponsor.requirements?.minWins || 0
  const teamWins = 0 // TODO: Get team wins from career state
  
  // Hard decline if too far below reputation requirements
  if (repRequirement > 0 && team.reputation < repRequirement * 0.7) {
    return {
      negotiation: {
        ...negotiation,
        status: 'declined',
        lastActivityWeek: currentWeek,
        lastActivityYear: currentYear
      },
      response: 'hard_decline'
    }
  }
  
  // Hard decline if too far below wins requirements
  if (winsRequirement > 0 && teamWins < Math.ceil(winsRequirement * 0.5)) {
    return {
      negotiation: {
        ...negotiation,
        status: 'declined',
        lastActivityWeek: currentWeek,
        lastActivityYear: currentYear
      },
      response: 'hard_decline'
    }
  }
  
  // Soft decline if below requirements but not too far
  const meetsRep = repRequirement === 0 || team.reputation >= repRequirement
  const meetsWins = winsRequirement === 0 || teamWins >= winsRequirement
  
  if (!meetsRep || !meetsWins) {
    // Calculate decline chance based on how far below requirements
    let softDeclineChance = 0.4
    if (repRequirement > 0) {
      softDeclineChance += Math.max(0, 0.3 - (team.reputation / repRequirement) * 0.3)
    }
    if (winsRequirement > 0) {
      softDeclineChance += Math.max(0, 0.2 - (teamWins / winsRequirement) * 0.2)
    }
    
    if (Math.random() < softDeclineChance) {
      return {
        negotiation: {
          ...negotiation,
          status: 'declined',
          lastActivityWeek: currentWeek,
          lastActivityYear: currentYear
        },
        response: 'soft_decline'
      }
    }
  }
  
  // Interested - proceed to negotiation
  return {
    negotiation: {
      ...negotiation,
      status: 'reviewing_offer',
      lastActivityWeek: currentWeek,
      lastActivityYear: currentYear
    },
    response: 'interested'
  }
}

// ============================================
// NEGOTIATION EXPIRY
// ============================================

/**
 * Check and update expired negotiations
 */
export function processNegotiationExpiry(
  negotiations: SponsorNegotiation[],
  currentWeek: number,
  currentYear: number
): SponsorNegotiation[] {
  return negotiations.map(neg => {
    if (['accepted', 'declined', 'expired', 'sponsor_withdrew'].includes(neg.status)) {
      return neg
    }
    
    const isExpired = 
      currentYear > neg.expiresYear ||
      (currentYear === neg.expiresYear && currentWeek >= neg.expiresWeek)
    
    if (isExpired) {
      return {
        ...neg,
        status: 'expired' as NegotiationStatus,
        lastActivityWeek: currentWeek,
        lastActivityYear: currentYear
      }
    }
    
    return neg
  })
}

// ============================================
// SPONSOR INTEREST CALCULATION
// ============================================

/**
 * Calculate sponsor's interest level in the team (0-100)
 * 
 * Interest is heavily influenced by whether the team meets requirements.
 * A sponsor will NOT be interested if the team is far below their standards.
 */
export function calculateSponsorInterest(
  sponsor: Sponsor,
  team: OwnedTeam
): number {
  // Get requirements - note: data uses minReputation, minWins, etc.
  const repRequirement = sponsor.requirements?.minReputation || 0
  const winsRequirement = sponsor.requirements?.minWins || 0
  
  // Check if basic requirements are met
  const teamWins = 0 // TODO: Get team wins from career state
  const meetsReputation = repRequirement === 0 || team.reputation >= repRequirement
  const meetsWins = winsRequirement === 0 || teamWins >= winsRequirement
  
  // If far below requirements, very low interest
  if (repRequirement > 0 && team.reputation < repRequirement * 0.6) {
    // Below 60% of reputation requirement - not interested
    return Math.max(5, 15 + (team.reputation / repRequirement) * 15)
  }
  
  if (winsRequirement > 0 && teamWins < winsRequirement * 0.5) {
    // Below 50% of wins requirement - significantly reduces interest
    return Math.max(10, 25)
  }
  
  // Base interest - starts lower if requirements not fully met
  let interest = meetsReputation && meetsWins ? 50 : 30
  
  // Reputation comparison (now using correct field)
  if (repRequirement > 0) {
    const repRatio = team.reputation / repRequirement
    if (repRatio >= 1.5) {
      interest += 25  // Far exceeds requirement
    } else if (repRatio >= 1.0) {
      interest += 15  // Meets requirement
    } else if (repRatio >= 0.8) {
      interest -= 5   // Close but not quite
    } else if (repRatio >= 0.7) {
      interest -= 15  // Below requirement
    } else {
      interest -= 30  // Far below requirement
    }
  }
  
  // Wins requirement check
  if (winsRequirement > 0) {
    const winsRatio = teamWins / winsRequirement
    if (winsRatio >= 1.0) {
      interest += 10  // Meets wins requirement
    } else if (winsRatio >= 0.5) {
      interest -= 10  // Some wins but not enough
    } else {
      interest -= 20  // Far below wins requirement
    }
  }
  
  // Nationality bonus (positive affiliation)
  if (sponsor.nationalityBonus?.includes(team.baseCountry)) {
    interest += 10
  }
  
  // Manufacturer bonus
  if (sponsor.manufacturerBonus?.includes(team.manufacturerAlignment || '')) {
    interest += 10
  }
  
  // Marketing budget effect (smaller impact)
  const marketingBudget = team.budgets?.marketingBudget || 0
  interest += Math.min(5, marketingBudget / 10000)
  
  return Math.max(0, Math.min(100, interest))
}

// ============================================
// HELPERS
// ============================================

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// ============================================
// WEEKLY NEGOTIATION PROCESSING
// ============================================

export interface WeeklyNegotiationResult {
  updatedNegotiations: SponsorNegotiation[]
  newApproaches: SponsorNegotiation[]
  emailsToGenerate: {
    type: 'outreach_response' | 'counter_response' | 'sponsor_approach' | 'negotiation_expired'
    negotiation: SponsorNegotiation
    response?: 'interested' | 'soft_decline' | 'hard_decline' | 'counter' | 'accept'
  }[]
  completedDeals: TeamSponsorDeal[]
}

/**
 * Process all active negotiations for the week.
 * This is called during advanceWeek() to progress negotiations.
 */
export function processWeeklyNegotiations(
  team: OwnedTeam,
  currentWeek: number,
  currentYear: number
): WeeklyNegotiationResult {
  const activeNegotiations = team.finances?.activeNegotiations || []
  const updatedNegotiations: SponsorNegotiation[] = []
  const emailsToGenerate: WeeklyNegotiationResult['emailsToGenerate'] = []
  const completedDeals: TeamSponsorDeal[] = []
  
  for (const negotiation of activeNegotiations) {
    // Skip completed negotiations
    if (['accepted', 'declined', 'expired', 'sponsor_withdrew'].includes(negotiation.status)) {
      updatedNegotiations.push(negotiation)
      continue
    }
    
    // Check for expiry
    if (currentYear > negotiation.expiresYear ||
        (currentYear === negotiation.expiresYear && currentWeek >= negotiation.expiresWeek)) {
      const expiredNeg = { ...negotiation, status: 'expired' as NegotiationStatus }
      updatedNegotiations.push(expiredNeg)
      emailsToGenerate.push({ type: 'negotiation_expired', negotiation: expiredNeg })
      continue
    }
    
    // Check if it's time for a response (sponsor hasn't responded this week)
    const responseYear = negotiation.nextResponseWeek ? Math.floor((negotiation.nextResponseWeek - 1) / 52) + 1 : currentYear
    const responseWeek = negotiation.nextResponseWeek ? ((negotiation.nextResponseWeek - 1) % 52) + 1 : currentWeek
    const shouldRespond = 
      (currentYear > responseYear ||
       (currentYear === responseYear && currentWeek >= responseWeek))
    
    if (!shouldRespond) {
      updatedNegotiations.push(negotiation)
      continue
    }
    
    // Process based on status
    switch (negotiation.status) {
      case 'outreach_sent':
      case 'pending_response': {
        // Team sent outreach - sponsor responds
        const { negotiation: updated, response } = processOutreachResponse(
          negotiation, team, currentWeek, currentYear
        )
        updatedNegotiations.push(updated)
        emailsToGenerate.push({ 
          type: 'outreach_response', 
          negotiation: updated, 
          response 
        })
        break
      }
      
      case 'counter_pending': {
        // Team sent counter - sponsor responds
        // Extract the player's counter offer from the last round
        const lastRound = negotiation.rounds[negotiation.rounds.length - 1]
        if (!lastRound || lastRound.proposedBy !== 'team') {
          // No valid counter to process, keep negotiation as-is
          updatedNegotiations.push(negotiation)
          break
        }
        
        const playerCounter = lastRound.offer
        const result = processSponsorCounterResponse(
          negotiation,
          playerCounter,
          currentWeek,
          currentYear
        )
        
        if (result.response === 'withdraw') {
          updatedNegotiations.push(result.negotiation)
          emailsToGenerate.push({ 
            type: 'counter_response', 
            negotiation: result.negotiation, 
            response: 'hard_decline' 
          })
        } else if (result.response === 'accept') {
          // Sponsor accepted the team's counter
          updatedNegotiations.push(result.negotiation)
          emailsToGenerate.push({ 
            type: 'counter_response', 
            negotiation: result.negotiation, 
            response: 'accept' 
          })
          
          // Create the deal
          const deal = acceptNegotiation(result.negotiation, currentYear)
          completedDeals.push(deal)
        } else if (result.response === 'counter' && result.sponsorCounter) {
          // Sponsor counters back
          const newRound: NegotiationRound = {
            roundNumber: negotiation.rounds.length + 1,
            proposedBy: 'sponsor',
            offer: result.sponsorCounter,
            emailId: ''
          }
          
          const counteredNeg = {
            ...result.negotiation,
            status: 'reviewing_offer' as NegotiationStatus,
            currentOffer: result.sponsorCounter,
            rounds: [...result.negotiation.rounds, newRound],
            // Set next response deadline for team (give them until expiry)
            nextResponseWeek: negotiation.expiresWeek,
            nextResponseYear: negotiation.expiresYear
          }
          updatedNegotiations.push(counteredNeg)
          emailsToGenerate.push({ 
            type: 'counter_response', 
            negotiation: counteredNeg, 
            response: 'counter' 
          })
        }
        break
      }
      
      case 'reviewing_offer': {
        // Waiting for team response - no automatic action
        // But check for patience running out
        const weeksSinceActivity = (currentYear - (negotiation.lastActivityYear || currentYear)) * 52 +
          (currentWeek - (negotiation.lastActivityWeek || currentWeek))
        
        if (weeksSinceActivity > negotiation.patience) {
          // Sponsor patience exhausted
          const withdrawnNeg = {
            ...negotiation,
            status: 'sponsor_withdrew' as NegotiationStatus,
            lastActivityWeek: currentWeek,
            lastActivityYear: currentYear
          }
          updatedNegotiations.push(withdrawnNeg)
          emailsToGenerate.push({ 
            type: 'counter_response', 
            negotiation: withdrawnNeg, 
            response: 'hard_decline' 
          })
        } else {
          updatedNegotiations.push(negotiation)
        }
        break
      }
      
      default:
        updatedNegotiations.push(negotiation)
    }
  }
  
  // Generate new sponsor approaches
  const newApproaches = generateWeeklySponsorApproaches(team, currentWeek, currentYear)
  
  for (const approach of newApproaches) {
    emailsToGenerate.push({ type: 'sponsor_approach', negotiation: approach })
  }
  
  return {
    updatedNegotiations,
    newApproaches,
    emailsToGenerate,
    completedDeals
  }
}

export { validateCounterOffer as isCounterAcceptable }

