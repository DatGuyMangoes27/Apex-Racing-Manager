// ============================================
// TEAM SPONSOR SYSTEM
// ============================================
// Generates and manages team-level sponsorship deals
// (Replaces personal driver sponsors)

import { 
  TeamSponsorDeal, 
  TeamSponsorTarget,
  TeamSponsorSlot,
  OwnedTeam 
} from '@/store/careerStore'
import type { Sponsor } from '@/data/sponsors'
import { getSponsors } from '@/services/preGeneratedContentService'
import { getTeamSponsorTierForReputation, TeamSponsorPaymentTier, getSponsorWeeklyPortfolioCap } from '@/data/financial-config'
import { calculateActivePerks } from '@/simulation/perkSystem'
import { calculateSponsorInterest } from '@/simulation/sponsors'

const MIN_INTEREST_FOR_SEEK = 30
export const MIN_INTEREST_FOR_SUGGESTED = 50

let sponsorIdCounter = 0

/**
 * Generate team sponsor offers based on team reputation and current state
 */
export function generateTeamSponsorOffers(
  team: OwnedTeam,
  currentYear: number,
  maxOffers: number = 5,
  desiredSlot?: TeamSponsorSlot,
  contactedSponsorIds: string[] = [],
  preferredSponsorIds?: string[]
): TeamSponsorDeal[] {
  const currentActiveWeekly = (team.finances?.sponsors || [])
    .filter(s => s.active)
    .reduce((sum, s) => sum + Math.round((s.monthlyPayment || 0) / 4), 0)
  const weeklyPortfolioCap = getSponsorWeeklyPortfolioCap(team.reputation ?? 0)
  if (currentActiveWeekly >= weeklyPortfolioCap) return []

  const eligibleSponsors = getEligibleSponsors(team, contactedSponsorIds)
  if (eligibleSponsors.length === 0) return []

  let candidateSponsors = eligibleSponsors.filter(
    sponsor => calculateSponsorInterest(sponsor, team) >= MIN_INTEREST_FOR_SEEK
  )

  if (preferredSponsorIds && preferredSponsorIds.length > 0) {
    const preferredSet = new Set(preferredSponsorIds)
    candidateSponsors = candidateSponsors.filter(s => preferredSet.has(s.id))
  }
  if (candidateSponsors.length === 0) return []

  if (desiredSlot && !isSlotAvailable(team, desiredSlot)) return []
  
  const tier = getTeamSponsorTierForReputation(team.reputation)
  const perks = calculateActivePerks()
  
  // Shuffle and take up to maxOffers
  const shuffled = [...candidateSponsors].sort(() => Math.random() - 0.5)
  const offers: TeamSponsorDeal[] = []
  
  for (let i = 0; i < Math.min(maxOffers, shuffled.length); i++) {
    const sponsor = shuffled[i]
    const offer = generateSponsorOffer(
      sponsor,
      tier,
      team,
      currentYear,
      perks,
      desiredSlot
    )
    offers.push(offer)
  }
  
  return offers
}

function getEligibleSponsors(team: OwnedTeam, contactedSponsorIds: string[] = []): Sponsor[] {
  const currentSponsorIds = new Set((team.finances?.sponsors || []).map(s => s.sponsorId))
  const contactedSet = new Set(contactedSponsorIds)
  const reputation = team.reputation ?? 0

  return getSponsors().filter(s => {
    if (currentSponsorIds.has(s.id)) return false
    const vis = (s as any).visibility ?? 'always'
    if (vis === 'approach_only') return false
    if (vis === 'always') return true
    if (vis === 'unlock_after_reputation') {
      const threshold = (s as any).unlockReputation ?? 0
      return reputation >= threshold
    }
    if (vis === 'unlock_after_contact') return contactedSet.has(s.id)
    return true
  })
}

function generateSponsorOffer(
  sponsor: Sponsor,
  tier: TeamSponsorPaymentTier,
  team: OwnedTeam,
  currentYear: number,
  perks: ReturnType<typeof calculateActivePerks>,
  forcedSlot?: TeamSponsorSlot
): TeamSponsorDeal {
  const id = `team_sponsor_${++sponsorIdCounter}_${Date.now()}`
  
  // Determine slot based on sponsor size and current deals
  const slot = forcedSlot ?? determineSponsorSlot(team, tier.tier)
  
  // Generate payment amounts with variance
  const variance = 0.8 + Math.random() * 0.4  // 0.8 - 1.2x
  let monthlyPayment = Math.round(
    lerp(tier.monthlyPaymentRange.min, tier.monthlyPaymentRange.max, Math.random()) * variance
  )
  let winBonus = Math.round(
    lerp(tier.winBonusRange.min, tier.winBonusRange.max, Math.random()) * variance
  )
  let podiumBonus = Math.round(
    lerp(tier.podiumBonusRange.min, tier.podiumBonusRange.max, Math.random()) * variance
  )
  
  // Apply slot multipliers
  const slotMultiplier = getSlotMultiplier(slot)
  monthlyPayment = Math.round(monthlyPayment * slotMultiplier)
  winBonus = Math.round(winBonus * slotMultiplier)
  podiumBonus = Math.round(podiumBonus * slotMultiplier)
  
  // Apply perk bonuses
  const sponsorBonusModifier = perks.combined.sponsorDealValueModifier
  if (sponsorBonusModifier > 1.0) {
    const bonus = sponsorBonusModifier
    monthlyPayment = Math.round(monthlyPayment * bonus)
    winBonus = Math.round(winBonus * bonus)
    podiumBonus = Math.round(podiumBonus * bonus)
  }

  // Respect remaining sponsor portfolio cap headroom so newly generated offers
  // align with actual payable economy at current team reputation.
  const currentActiveWeekly = (team.finances?.sponsors || [])
    .filter(s => s.active)
    .reduce((sum, s) => sum + Math.round((s.monthlyPayment || 0) / 4), 0)
  const weeklyPortfolioCap = getSponsorWeeklyPortfolioCap(team.reputation ?? 0)
  const remainingWeeklyHeadroom = Math.max(0, weeklyPortfolioCap - currentActiveWeekly)
  const maxMonthlyByHeadroom = remainingWeeklyHeadroom * 4
  if (maxMonthlyByHeadroom > 0) {
    monthlyPayment = Math.min(monthlyPayment, maxMonthlyByHeadroom)
  }
  
  // Generate contract duration (1-3 years)
  const duration = Math.floor(Math.random() * 3) + 1
  
  // Generate targets
  const targets = generateSponsorTargets(tier.tier, duration)
  
  // Championship bonus for higher tiers
  const championshipBonus = tier.tier === 'global' 
    ? Math.round(monthlyPayment * 12)  // 1 year's payment
    : tier.tier === 'international' 
      ? Math.round(monthlyPayment * 6)
      : 0
  
  return {
    id,
    sponsorId: sponsor.id,
    sponsorName: sponsor.name,
    slot,
    monthlyPayment,
    winBonus,
    podiumBonus,
    championshipBonus,
    startYear: currentYear,
    duration,
    active: false,  // Offer, not active yet
    satisfaction: 70,  // Starting satisfaction
    targets,
    seasonWins: 0,
    seasonPodiums: 0,
    seasonRaces: 0,
    warningIssued: false,
    finalWarningIssued: false
  }
}

function determineSponsorSlot(team: OwnedTeam, tierName: string): TeamSponsorSlot {
  const currentSlots = new Set(team.finances.sponsors.filter(s => s.active).map(s => s.slot))
  
  // Title sponsor - only one allowed
  if (!currentSlots.has('title') && tierName === 'global') {
    return 'title'
  }
  
  // Primary - max 2
  const primaryCount = team.finances.sponsors.filter(s => s.active && s.slot === 'primary').length
  if (primaryCount < 2 && (tierName === 'global' || tierName === 'international')) {
    return 'primary'
  }
  
  // Secondary - max 3
  const secondaryCount = team.finances.sponsors.filter(s => s.active && s.slot === 'secondary').length
  if (secondaryCount < 3 && (tierName !== 'local')) {
    return 'secondary'
  }
  
  // Associate - capped to prevent early-game sponsor stacking
  return 'associate'
}

export function isSlotAvailable(team: OwnedTeam, slot: TeamSponsorSlot): boolean {
  const activeSponsors = (team.finances?.sponsors || []).filter(s => s.active)
  const count = activeSponsors.filter(s => s.slot === slot).length
  const slotLimits: Record<TeamSponsorSlot, number> = {
    title: 1,
    primary: 2,
    secondary: 3,
    associate: 4
  }
  return count < slotLimits[slot]
}

export function getSlotCapacity(
  team: OwnedTeam,
  slot: TeamSponsorSlot
): { current: number; max: number } {
  const activeSponsors = (team.finances?.sponsors || []).filter(s => s.active)
  const current = activeSponsors.filter(s => s.slot === slot).length
  const slotLimits: Record<TeamSponsorSlot, number> = {
    title: 1,
    primary: 2,
    secondary: 3,
    associate: 4
  }
  return { current, max: slotLimits[slot] }
}

export function getSuggestedSponsorsForSlot(
  team: OwnedTeam,
  slot: TeamSponsorSlot,
  maxCount: number = 5,
  contactedSponsorIds: string[] = []
): Sponsor[] {
  if (!isSlotAvailable(team, slot)) return []
  const eligible = getEligibleSponsors(team, contactedSponsorIds)
  const interested = eligible.filter(
    sponsor => calculateSponsorInterest(sponsor, team) >= MIN_INTEREST_FOR_SUGGESTED
  )
  const shuffled = [...interested].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, maxCount)
}

export function selectEventSponsors(
  team: OwnedTeam,
  count: number,
  contactedSponsorIds: string[] = []
): string[] {
  if (count <= 0) return []
  const eligible = getEligibleSponsors(team, contactedSponsorIds)
  const interested = eligible.filter(
    sponsor => calculateSponsorInterest(sponsor, team) >= MIN_INTEREST_FOR_SEEK
  )
  const shuffled = [...interested].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length)).map(s => s.id)
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

function generateSponsorTargets(
  tierName: string, 
  duration: number
): TeamSponsorTarget[] {
  const targets: TeamSponsorTarget[] = []
  
  // All sponsors want races entered
  targets.push({
    id: `target_races_${Date.now()}`,
    type: 'races_entered',
    targetValue: 8 * duration,  // 8 races per year
    currentValue: 0,
    description: `Enter at least ${8 * duration} races`,
    met: false,
    exceeded: false
  })
  
  // Higher tiers want results
  if (tierName === 'national' || tierName === 'regional') {
    targets.push({
      id: `target_podiums_${Date.now()}`,
      type: 'total_podiums',
      targetValue: 2 * duration,
      currentValue: 0,
      description: `Score at least ${2 * duration} podiums`,
      met: false,
      exceeded: false
    })
  }
  
  if (tierName === 'international') {
    targets.push({
      id: `target_podiums_${Date.now()}`,
      type: 'total_podiums',
      targetValue: 4 * duration,
      currentValue: 0,
      description: `Score at least ${4 * duration} podiums`,
      met: false,
      exceeded: false
    })
    targets.push({
      id: `target_wins_${Date.now()}`,
      type: 'total_wins',
      targetValue: 1 * duration,
      currentValue: 0,
      description: `Win at least ${1 * duration} race(s)`,
      met: false,
      exceeded: false
    })
  }
  
  if (tierName === 'global') {
    targets.push({
      id: `target_podiums_${Date.now()}`,
      type: 'total_podiums',
      targetValue: 6 * duration,
      currentValue: 0,
      description: `Score at least ${6 * duration} podiums`,
      met: false,
      exceeded: false
    })
    targets.push({
      id: `target_wins_${Date.now()}`,
      type: 'total_wins',
      targetValue: 3 * duration,
      currentValue: 0,
      description: `Win at least ${3 * duration} races`,
      met: false,
      exceeded: false
    })
    targets.push({
      id: `target_champ_${Date.now()}`,
      type: 'championship_position',
      targetValue: 5,  // Top 5 in championship
      currentValue: 0,
      description: 'Finish top 5 in championship',
      met: false,
      exceeded: false
    })
  }
  
  return targets
}

// ============================================
// SPONSOR SATISFACTION
// ============================================

/**
 * Update sponsor satisfaction at season end based on target completion
 */
export function calculateSeasonEndSatisfaction(
  sponsor: TeamSponsorDeal,
  championshipPosition: number
): TeamSponsorDeal {
  const updated = { ...sponsor }
  
  // Update championship position target
  updated.targets = updated.targets.map(t => {
    if (t.type === 'championship_position') {
      return {
        ...t,
        currentValue: championshipPosition,
        met: championshipPosition <= t.targetValue,
        exceeded: championshipPosition <= Math.floor(t.targetValue * 0.6)  // Top 60% of target
      }
    }
    return t
  })
  
  // Calculate satisfaction change
  let satisfactionChange = 0
  
  for (const target of updated.targets) {
    if (target.exceeded) {
      satisfactionChange += 15  // Exceeded target
    } else if (target.met) {
      satisfactionChange += 5   // Met target
    } else {
      satisfactionChange -= 15  // Missed target
    }
  }
  
  updated.satisfaction = Math.max(0, Math.min(100, updated.satisfaction + satisfactionChange))
  
  // Issue warnings based on satisfaction
  if (updated.satisfaction < 40 && !updated.warningIssued) {
    updated.warningIssued = true
  }
  if (updated.satisfaction < 20 && !updated.finalWarningIssued) {
    updated.finalWarningIssued = true
  }
  
  return updated
}

/**
 * Check if sponsor should terminate contract
 */
export function checkSponsorTermination(sponsor: TeamSponsorDeal): boolean {
  if (!sponsor.active) return false
  
  // Terminate if satisfaction hits 0
  if (sponsor.satisfaction <= 0) return true
  
  // Terminate after final warning if still below 30
  if (sponsor.finalWarningIssued && sponsor.satisfaction < 30) return true
  
  return false
}

/**
 * Reset sponsor season stats for new season
 */
export function resetSponsorSeasonStats(sponsor: TeamSponsorDeal): TeamSponsorDeal {
  return {
    ...sponsor,
    seasonWins: 0,
    seasonPodiums: 0,
    seasonRaces: 0,
    targets: sponsor.targets.map(t => ({
      ...t,
      currentValue: 0,
      met: false,
      exceeded: false
    }))
  }
}

// ============================================
// HELPERS
// ============================================

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// ============================================
// OFFER ACCEPTANCE
// ============================================

export function acceptSponsorOffer(offer: TeamSponsorDeal): TeamSponsorDeal {
  return {
    ...offer,
    active: true
  }
}

export function declineSponsorOffer(_offer: TeamSponsorDeal): void {
  // Just remove from pending - nothing to track
}

// ============================================
// DISPLAY HELPERS
// ============================================

export function getSponsorSlotLabel(slot: TeamSponsorSlot): string {
  switch (slot) {
    case 'title': return 'Title Sponsor'
    case 'primary': return 'Primary Sponsor'
    case 'secondary': return 'Secondary Sponsor'
    case 'associate': return 'Associate Sponsor'
    default: return 'Sponsor'
  }
}

export function getSponsorSatisfactionStatus(satisfaction: number): {
  label: string
  color: string
} {
  if (satisfaction >= 80) return { label: 'Excellent', color: 'text-green-400' }
  if (satisfaction >= 60) return { label: 'Good', color: 'text-blue-400' }
  if (satisfaction >= 40) return { label: 'Warning', color: 'text-yellow-400' }
  if (satisfaction >= 20) return { label: 'Critical', color: 'text-orange-400' }
  return { label: 'Terminating', color: 'text-red-400' }
}
