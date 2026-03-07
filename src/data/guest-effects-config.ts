/**
 * Guest Effects Configuration
 * 
 * Defines per-type effects for VIP guests and media invitations,
 * venue guest type affinity defaults, facility-driven capacity scaling,
 * dynamic guest limit calculations, and acceptance rate formulas.
 */

import type { ActivityEffect, VIPGuest, MediaInvite } from '@/store/careerStore'
import type { VenueType } from '@/data/venues'

// ============================================
// GUEST TYPE DEFINITIONS
// ============================================

export type VIPGuestType = 'board_members' | 'potential_sponsors' | 'celebrities' | 'officials' | 'drivers'
export type MediaInviteType = 'local_press' | 'national_media' | 'international' | 'influencers'

// ============================================
// GUEST AFFINITY MAP (per venue type)
// 0 = unavailable, 0.1-0.4 = poor fit, 0.5-0.7 = decent, 0.8-1.0 = ideal
// ============================================

export interface GuestAffinity {
  board_members: number
  potential_sponsors: number
  celebrities: number
  officials: number
  drivers: number
  local_press: number
  national_media: number
  international: number
  influencers: number
}

export const DEFAULT_VENUE_GUEST_AFFINITY: Record<VenueType, GuestAffinity> = {
  team_hq: {
    board_members: 1.0,
    potential_sponsors: 0.8,
    celebrities: 0.2,
    officials: 0.6,
    drivers: 0.5,
    local_press: 0.8,
    national_media: 0.4,
    international: 0.2,
    influencers: 0.3
  },
  hotel_conference: {
    board_members: 0.8,
    potential_sponsors: 0.9,
    celebrities: 0.6,
    officials: 0.8,
    drivers: 0.5,
    local_press: 0.7,
    national_media: 0.8,
    international: 0.7,
    influencers: 0.5
  },
  track_facility: {
    board_members: 0.5,
    potential_sponsors: 0.7,
    celebrities: 0.6,
    officials: 1.0,
    drivers: 1.0,
    local_press: 0.8,
    national_media: 0.9,
    international: 0.9,
    influencers: 0.7
  },
  restaurant: {
    board_members: 0.7,
    potential_sponsors: 0.8,
    celebrities: 0.9,
    officials: 0.6,
    drivers: 0.4,
    local_press: 0.3,
    national_media: 0.3,
    international: 0.2,
    influencers: 0.4
  },
  stadium: {
    board_members: 0.3,
    potential_sponsors: 0.6,
    celebrities: 1.0,
    officials: 0.5,
    drivers: 0.7,
    local_press: 0.9,
    national_media: 1.0,
    international: 1.0,
    influencers: 1.0
  },
  exhibition_center: {
    board_members: 0.6,
    potential_sponsors: 1.0,
    celebrities: 0.8,
    officials: 0.7,
    drivers: 0.6,
    local_press: 0.8,
    national_media: 0.9,
    international: 1.0,
    influencers: 0.8
  },
  virtual: {
    board_members: 0.0,
    potential_sponsors: 0.0,
    celebrities: 0.0,
    officials: 0.0,
    drivers: 0.0,
    local_press: 0.5,
    national_media: 0.7,
    international: 0.7,
    influencers: 1.0
  }
}

// ============================================
// PER-TYPE EFFECT DEFINITIONS
// Effects applied per ACCEPTED guest
// ============================================

export interface GuestEffectConfig {
  label: string
  description: string
  effectsPerGuest: Partial<ActivityEffect>
  /** For types like sponsors where effects trigger per N guests */
  effectsPerNGuests?: { n: number; effects: Partial<ActivityEffect> }
  /** Risk of negative media coverage (0-1, 0 = no risk) */
  scrutinyRisk?: number
  /** Cost per guest for this type specifically (on top of catering etc.) */
  additionalCostPerGuest?: number
}

export const VIP_GUEST_EFFECTS: Record<VIPGuestType, GuestEffectConfig> = {
  board_members: {
    label: 'Board Members',
    description: 'Boost board confidence and demonstrate governance strength',
    effectsPerGuest: {
      boardMood: 3,
      sponsorSatisfaction: 1
    },
    additionalCostPerGuest: 150
  },
  potential_sponsors: {
    label: 'Potential Sponsors',
    description: 'Network with prospective business partners for future deals',
    effectsPerGuest: {
      sponsorSatisfaction: 2
    },
    effectsPerNGuests: {
      n: 2,
      effects: { sponsorLeadsGenerated: 1 }
    },
    additionalCostPerGuest: 200
  },
  celebrities: {
    label: 'Celebrities',
    description: 'Increase fan engagement, social following, and marketability',
    effectsPerGuest: {
      fanSentiment: 3,
      personalFollowers: 50,
      marketability: 1
    },
    additionalCostPerGuest: 500
  },
  officials: {
    label: 'Motorsport Officials',
    description: 'Build reputation and legitimacy within the motorsport community',
    effectsPerGuest: {
      reputation: 2,
      boardMood: 1
    },
    additionalCostPerGuest: 100
  },
  drivers: {
    label: 'Guest Drivers',
    description: 'Earn paddock respect and boost team morale',
    effectsPerGuest: {
      teamMorale: 2,
      reputation: 1
    },
    additionalCostPerGuest: 75
  }
}

export const MEDIA_INVITE_EFFECTS: Record<MediaInviteType, GuestEffectConfig> = {
  local_press: {
    label: 'Local Press',
    description: 'Regional newspapers and radio -- friendly coverage with low risk',
    effectsPerGuest: {
      fanSentiment: 2
    },
    scrutinyRisk: 0.05,
    additionalCostPerGuest: 50
  },
  national_media: {
    label: 'National Media',
    description: 'Major TV and newspapers -- high reach with moderate scrutiny',
    effectsPerGuest: {
      reputation: 2,
      fanSentiment: 3
    },
    scrutinyRisk: 0.15,
    additionalCostPerGuest: 150
  },
  international: {
    label: 'International Media',
    description: 'Global motorsport outlets -- worldwide reach with high scrutiny',
    effectsPerGuest: {
      reputation: 4,
      sponsorLeadsGenerated: 1
    },
    scrutinyRisk: 0.30,
    additionalCostPerGuest: 300
  },
  influencers: {
    label: 'Influencers',
    description: 'Social media personalities -- viral potential but unpredictable',
    effectsPerGuest: {
      personalFollowers: 100,
      fanSentiment: 4
    },
    scrutinyRisk: 0.10,
    additionalCostPerGuest: 200
  }
}

// ============================================
// VENUE PRESTIGE GATES
// Minimum prestige level required for certain guest types
// ============================================

export const PRESTIGE_REQUIREMENTS: Partial<Record<VIPGuestType | MediaInviteType, number>> = {
  celebrities: 3,
  international: 3,
  // officials at prestige 4+ get a count bonus (handled in calculateGuestLimits)
}

/** Extra max count bonus for board members at high-prestige venues */
export function getPrestigeBoardBonus(prestigeLevel: number): number {
  if (prestigeLevel >= 5) return 4
  if (prestigeLevel >= 4) return 2
  return 0
}

// ============================================
// MARKETING FACILITY: TEAM HQ CAPACITY SCALING
// ============================================

export const TEAM_HQ_CAPACITY_BY_MARKETING_LEVEL: Record<number, number> = {
  1: 15,   // Cramped workshop, barely room for a small meeting
  2: 40,   // Dedicated hospitality suite and meeting rooms
  3: 100,  // Full media centre and proper event spaces
  4: 200,  // Large event hall and broadcast studio
  5: 400   // VIP hospitality wing, rivals mid-tier external venues
}

/**
 * Get the Team HQ venue capacity based on marketing facility level.
 */
export function getTeamHQCapacity(marketingLevel: number): number {
  const level = Math.max(1, Math.min(5, marketingLevel))
  return TEAM_HQ_CAPACITY_BY_MARKETING_LEVEL[level] ?? 15
}

// ============================================
// MARKETING FACILITY: TEAM HQ GUEST TYPE UNLOCKS
// Which guest types are available at Team HQ based on marketing level
// ============================================

export const TEAM_HQ_UNLOCKS_BY_LEVEL: Record<number, {
  vip: VIPGuestType[]
  media: MediaInviteType[]
}> = {
  1: {
    vip: ['board_members'],
    media: ['local_press']
  },
  2: {
    vip: ['board_members', 'potential_sponsors'],
    media: ['local_press', 'national_media']
  },
  3: {
    vip: ['board_members', 'potential_sponsors', 'officials', 'drivers'],
    media: ['local_press', 'national_media', 'influencers']
  },
  4: {
    vip: ['board_members', 'potential_sponsors', 'officials', 'drivers', 'celebrities'],
    media: ['local_press', 'national_media', 'influencers', 'international']
  },
  5: {
    vip: ['board_members', 'potential_sponsors', 'officials', 'drivers', 'celebrities'],
    media: ['local_press', 'national_media', 'influencers', 'international']
  }
}

// ============================================
// MARKETING FACILITY: GLOBAL EVENT QUALITY MULTIPLIER
// Multiplies all guest-related effects regardless of venue
// ============================================

export const MARKETING_EVENT_QUALITY_MULTIPLIER: Record<number, number> = {
  1: 1.0,
  2: 1.1,
  3: 1.2,
  4: 1.35,
  5: 1.5
}

export function getMarketingEventQualityMultiplier(marketingLevel: number): number {
  const level = Math.max(1, Math.min(5, marketingLevel))
  return MARKETING_EVENT_QUALITY_MULTIPLIER[level] ?? 1.0
}

// ============================================
// DYNAMIC GUEST LIMITS (REPUTATION PROGRESSION)
// ============================================

export interface PlayerStateForGuests {
  reputation: number
  boardMood: number
  fanSentiment: number
  personalFollowers?: number
}

export interface GuestLimitResult {
  type: string
  maxCount: number
  unlocked: boolean
  unlockRequirement?: string  // Human-readable requirement text
}

/** Calculate the reputation-based max for each VIP guest type */
function getVIPRepMax(type: VIPGuestType, state: PlayerStateForGuests): { max: number; unlocked: boolean; requirement?: string } {
  switch (type) {
    case 'board_members':
      return {
        max: Math.min(8, 2 + Math.max(0, Math.floor((state.boardMood - 50) / 20))),
        unlocked: true
      }
    case 'potential_sponsors':
      return {
        max: Math.min(10, 1 + Math.max(0, Math.floor((state.reputation - 30) / 15))),
        unlocked: true
      }
    case 'celebrities': {
      const unlocked = state.reputation >= 60
      return {
        max: unlocked ? Math.min(8, 1 + Math.max(0, Math.floor((state.reputation - 60) / 10))) : 0,
        unlocked,
        requirement: unlocked ? undefined : 'Requires 60 reputation'
      }
    }
    case 'officials':
      return {
        max: Math.min(6, 1 + Math.max(0, Math.floor((state.reputation - 40) / 20))),
        unlocked: true
      }
    case 'drivers':
      return {
        max: Math.min(10, 2 + Math.max(0, Math.floor((state.reputation - 30) / 15))),
        unlocked: true
      }
  }
}

/** Calculate the reputation-based max for each media invite type */
function getMediaRepMax(type: MediaInviteType, state: PlayerStateForGuests): { max: number; unlocked: boolean; requirement?: string } {
  switch (type) {
    case 'local_press':
      return { max: 10, unlocked: true }
    case 'national_media': {
      const unlocked = state.reputation >= 40
      return {
        max: unlocked ? Math.min(10, 2 + Math.max(0, Math.floor((state.reputation - 40) / 15))) : 0,
        unlocked,
        requirement: unlocked ? undefined : 'Requires 40 reputation'
      }
    }
    case 'international': {
      const unlocked = state.reputation >= 65
      return {
        max: unlocked ? Math.min(8, 1 + Math.max(0, Math.floor((state.reputation - 65) / 15))) : 0,
        unlocked,
        requirement: unlocked ? undefined : 'Requires 65 reputation'
      }
    }
    case 'influencers': {
      const unlocked = state.fanSentiment >= 50
      return {
        max: unlocked ? Math.min(10, 2 + Math.max(0, Math.floor((state.fanSentiment - 50) / 15))) : 0,
        unlocked,
        requirement: unlocked ? undefined : 'Requires 50 fan sentiment'
      }
    }
  }
}

export interface GuestLimitsInput {
  playerState: PlayerStateForGuests
  venueType: VenueType
  venuePrestige: number
  venueCapacityMax: number
  marketingLevel: number
  /** Current total guest count already committed (sum of all other types) */
  currentTotalGuests?: number
}

export interface GuestTypeLimit {
  maxCount: number
  unlocked: boolean
  available: boolean       // True if venue affinity > 0 AND unlocked AND prestige met
  venueAffinity: number
  unlockRequirement?: string
  warningText?: string     // e.g., "Not ideal for this venue"
}

/**
 * Calculate the dynamic guest limits for all types given the player/venue/facility state.
 */
export function calculateGuestLimits(input: GuestLimitsInput): {
  vip: Record<VIPGuestType, GuestTypeLimit>
  media: Record<MediaInviteType, GuestTypeLimit>
  venueCapacityMax: number
} {
  const { playerState, venueType, venuePrestige, venueCapacityMax, marketingLevel } = input
  const affinity = DEFAULT_VENUE_GUEST_AFFINITY[venueType]
  
  // For team_hq, check marketing level unlocks
  const hqUnlocks = venueType === 'team_hq' 
    ? TEAM_HQ_UNLOCKS_BY_LEVEL[Math.max(1, Math.min(5, marketingLevel))] 
    : null

  const effectiveCapacity = venueType === 'team_hq' 
    ? getTeamHQCapacity(marketingLevel) 
    : venueCapacityMax

  // VIP limits
  const vipTypes: VIPGuestType[] = ['board_members', 'potential_sponsors', 'celebrities', 'officials', 'drivers']
  const vipLimits = {} as Record<VIPGuestType, GuestTypeLimit>
  
  for (const type of vipTypes) {
    const venueAff = affinity[type]
    const repResult = getVIPRepMax(type, playerState)
    
    // Check prestige gate
    const prestigeReq = PRESTIGE_REQUIREMENTS[type]
    const prestigeMet = !prestigeReq || venuePrestige >= prestigeReq
    
    // Check HQ marketing unlock
    const hqUnlocked = hqUnlocks ? hqUnlocks.vip.includes(type) : true
    
    // Board members get prestige bonus
    let maxCount = repResult.max
    if (type === 'board_members') {
      maxCount += getPrestigeBoardBonus(venuePrestige)
    }
    
    // Cap at remaining venue capacity
    maxCount = Math.min(maxCount, effectiveCapacity)
    
    const unlocked = repResult.unlocked && hqUnlocked
    const available = unlocked && prestigeMet && venueAff > 0
    
    let unlockRequirement = repResult.requirement
    if (!hqUnlocked && venueType === 'team_hq') {
      const requiredLevel = Object.entries(TEAM_HQ_UNLOCKS_BY_LEVEL)
        .find(([, v]) => v.vip.includes(type))?.[0]
      unlockRequirement = `Upgrade Marketing facility to Level ${requiredLevel}`
    }
    if (!prestigeMet && prestigeReq) {
      unlockRequirement = unlockRequirement 
        ? `${unlockRequirement} & prestige ${prestigeReq}+ venue`
        : `Requires prestige ${prestigeReq}+ venue`
    }
    
    let warningText: string | undefined
    if (available && venueAff > 0 && venueAff < 0.5) {
      warningText = 'Not ideal for this venue'
    }
    
    vipLimits[type] = {
      maxCount: available ? Math.max(1, maxCount) : 0,
      unlocked,
      available,
      venueAffinity: venueAff,
      unlockRequirement: available ? undefined : unlockRequirement,
      warningText
    }
  }
  
  // Media limits
  const mediaTypes: MediaInviteType[] = ['local_press', 'national_media', 'international', 'influencers']
  const mediaLimits = {} as Record<MediaInviteType, GuestTypeLimit>
  
  for (const type of mediaTypes) {
    const venueAff = affinity[type]
    const repResult = getMediaRepMax(type, playerState)
    
    // Check prestige gate
    const prestigeReq = PRESTIGE_REQUIREMENTS[type]
    const prestigeMet = !prestigeReq || venuePrestige >= prestigeReq
    
    // Check HQ marketing unlock
    const hqUnlocked = hqUnlocks ? hqUnlocks.media.includes(type) : true
    
    let maxCount = repResult.max
    maxCount = Math.min(maxCount, effectiveCapacity)
    
    const unlocked = repResult.unlocked && hqUnlocked
    const available = unlocked && prestigeMet && venueAff > 0
    
    let unlockRequirement = repResult.requirement
    if (!hqUnlocked && venueType === 'team_hq') {
      const requiredLevel = Object.entries(TEAM_HQ_UNLOCKS_BY_LEVEL)
        .find(([, v]) => v.media.includes(type))?.[0]
      unlockRequirement = `Upgrade Marketing facility to Level ${requiredLevel}`
    }
    if (!prestigeMet && prestigeReq) {
      unlockRequirement = unlockRequirement
        ? `${unlockRequirement} & prestige ${prestigeReq}+ venue`
        : `Requires prestige ${prestigeReq}+ venue`
    }
    
    let warningText: string | undefined
    if (available && venueAff > 0 && venueAff < 0.5) {
      warningText = 'Not ideal for this venue'
    }
    
    mediaLimits[type] = {
      maxCount: available ? Math.max(1, maxCount) : 0,
      unlocked,
      available,
      venueAffinity: venueAff,
      unlockRequirement: available ? undefined : unlockRequirement,
      warningText
    }
  }
  
  return {
    vip: vipLimits,
    media: mediaLimits,
    venueCapacityMax: effectiveCapacity
  }
}

// ============================================
// ACCEPTANCE RATE CALCULATION
// ============================================

const BASE_ACCEPTANCE_RATES: Record<VIPGuestType | MediaInviteType, number> = {
  board_members: 0.80,
  potential_sponsors: 0.65,
  celebrities: 0.60,
  officials: 0.70,
  drivers: 0.75,
  local_press: 0.85,
  national_media: 0.70,
  international: 0.60,
  influencers: 0.65
}

export interface AcceptanceRateInput {
  type: VIPGuestType | MediaInviteType
  invitedCount: number
  reputation: number
  venuePrestige: number
  marketingLevel: number
  hasCompetingEventThisWeek?: boolean
}

/**
 * Calculate the expected acceptance rate for a guest type.
 * Returns a value between 0 and 1.
 */
export function calculateAcceptanceRate(input: AcceptanceRateInput): number {
  const { type, invitedCount, reputation, venuePrestige, marketingLevel, hasCompetingEventThisWeek } = input
  
  let rate = BASE_ACCEPTANCE_RATES[type] ?? 0.70
  
  // Reputation bonus: up to +15% at rep 100
  rate += Math.min(0.15, reputation / 100 * 0.15)
  
  // Venue prestige bonus: +3% per prestige level
  rate += venuePrestige * 0.03
  
  // Marketing facility bonus: up to +20% at level 5
  const marketingBonus = (Math.max(1, Math.min(5, marketingLevel)) - 1) * 0.05
  rate += marketingBonus
  
  // Diminishing returns: -4% per guest above 3 of same type
  if (invitedCount > 3) {
    rate -= (invitedCount - 3) * 0.04
  }
  
  // Competing event penalty
  if (hasCompetingEventThisWeek) {
    rate -= 0.10
  }
  
  // Clamp between 30% and 98%
  return Math.max(0.30, Math.min(0.98, rate))
}

/**
 * Get the estimated attendance range for display in the UI.
 * Returns [min, max] expected attendees.
 */
export function getEstimatedAttendance(input: AcceptanceRateInput): { min: number; max: number; rate: number } {
  const rate = calculateAcceptanceRate(input)
  const { invitedCount } = input
  
  // Provide a range: rate -10% to rate +10%
  const minRate = Math.max(0.1, rate - 0.10)
  const maxRate = Math.min(1.0, rate + 0.10)
  
  return {
    min: Math.max(1, Math.floor(invitedCount * minRate)),
    max: Math.min(invitedCount, Math.ceil(invitedCount * maxRate)),
    rate
  }
}

/**
 * Roll actual attendance for each guest when the activity completes.
 * Each individual guest has an independent acceptance probability.
 */
export function rollActualAttendance(invitedCount: number, acceptanceRate: number): number {
  let accepted = 0
  for (let i = 0; i < invitedCount; i++) {
    if (Math.random() < acceptanceRate) {
      accepted++
    }
  }
  // Always at least 1 if anyone was invited
  return invitedCount > 0 ? Math.max(1, accepted) : 0
}

// ============================================
// EFFECT CALCULATION
// ============================================

/**
 * Calculate the total ActivityEffect from all accepted VIP guests and media invites.
 * Applies venue affinity and marketing multiplier.
 */
export function calculateGuestEffects(
  vipGuests: Array<{ type: VIPGuestType; acceptedCount: number }>,
  mediaInvites: Array<{ type: MediaInviteType; acceptedCount: number }>,
  venueType: VenueType,
  marketingLevel: number
): ActivityEffect {
  const affinity = DEFAULT_VENUE_GUEST_AFFINITY[venueType]
  const qualityMult = getMarketingEventQualityMultiplier(marketingLevel)
  const totalEffects: ActivityEffect = {}
  
  // Process VIP guests
  for (const guest of vipGuests) {
    const config = VIP_GUEST_EFFECTS[guest.type]
    if (!config || guest.acceptedCount <= 0) continue
    
    const aff = affinity[guest.type] || 0
    if (aff <= 0) continue
    
    const multiplier = guest.acceptedCount * aff * qualityMult
    
    // Apply per-guest effects
    for (const [key, value] of Object.entries(config.effectsPerGuest)) {
      if (typeof value === 'number') {
        const effectKey = key as keyof ActivityEffect
        const current = (totalEffects[effectKey] as number) || 0
        ;(totalEffects as Record<string, number>)[effectKey] = current + Math.round(value * multiplier)
      }
    }
    
    // Apply per-N-guests effects
    if (config.effectsPerNGuests) {
      const triggers = Math.floor(guest.acceptedCount / config.effectsPerNGuests.n)
      if (triggers > 0) {
        for (const [key, value] of Object.entries(config.effectsPerNGuests.effects)) {
          if (typeof value === 'number') {
            const effectKey = key as keyof ActivityEffect
            const current = (totalEffects[effectKey] as number) || 0
            ;(totalEffects as Record<string, number>)[effectKey] = current + Math.round(value * triggers * aff * qualityMult)
          }
        }
      }
    }
  }
  
  // Process media invites
  for (const invite of mediaInvites) {
    const config = MEDIA_INVITE_EFFECTS[invite.type]
    if (!config || invite.acceptedCount <= 0) continue
    
    const aff = affinity[invite.type] || 0
    if (aff <= 0) continue
    
    const multiplier = invite.acceptedCount * aff * qualityMult
    
    // Apply per-guest effects
    for (const [key, value] of Object.entries(config.effectsPerGuest)) {
      if (typeof value === 'number') {
        const effectKey = key as keyof ActivityEffect
        const current = (totalEffects[effectKey] as number) || 0
        ;(totalEffects as Record<string, number>)[effectKey] = current + Math.round(value * multiplier)
      }
    }
    
    // Check for scrutiny risk (negative coverage chance)
    if (config.scrutinyRisk && config.scrutinyRisk > 0) {
      // Each media person has a scrutiny risk chance
      for (let i = 0; i < invite.acceptedCount; i++) {
        if (Math.random() < config.scrutinyRisk) {
          // Negative coverage hit
          totalEffects.reputation = (totalEffects.reputation || 0) - 2
          totalEffects.fanSentiment = (totalEffects.fanSentiment || 0) - 3
        }
      }
    }
  }
  
  return totalEffects
}

// ============================================
// UI HELPER: EFFECT DESCRIPTION TEXT
// ============================================

export function getGuestTypeEffectDescription(type: VIPGuestType | MediaInviteType): string {
  const vipConfig = VIP_GUEST_EFFECTS[type as VIPGuestType]
  if (vipConfig) return vipConfig.description
  
  const mediaConfig = MEDIA_INVITE_EFFECTS[type as MediaInviteType]
  if (mediaConfig) return mediaConfig.description
  
  return ''
}

export function getGuestTypeLabel(type: VIPGuestType | MediaInviteType): string {
  const vipConfig = VIP_GUEST_EFFECTS[type as VIPGuestType]
  if (vipConfig) return vipConfig.label
  
  const mediaConfig = MEDIA_INVITE_EFFECTS[type as MediaInviteType]
  if (mediaConfig) return mediaConfig.label
  
  return type
}
