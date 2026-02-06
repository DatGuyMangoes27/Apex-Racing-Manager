/**
 * Contract System Module
 * 
 * Handles contract target generation, team satisfaction tracking,
 * renewal/termination evaluation, and media duty management.
 * 
 * Follows the same pattern as the sponsor system for consistency.
 */

import type { 
  ContractTarget, 
  ContractTargetType, 
  ContractTargetSeverity,
  RenewalConditions,
  TeamOption,
  PlayerOption,
  TerminationConditions,
  MediaDuties,
  ContractSeasonStats,
  Contract,
  AutoRenewCondition
} from '@/store/careerStore'
import type { TeamTier } from '@/data/ams2-teams-real'
import { getPointsSystem, getMaxPointsForRace } from '@/data/points-systems';

export function generateMediaDuties(tier: TeamTier): MediaDuties {
  const dutyConfig: Record<string, { social: number; events: number }> = {
    'entry': { social: 0, events: 0 },
    'amateur': { social: 0, events: 0 },
    'semi-pro': { social: 2, events: 0 },
    'professional': { social: 4, events: 0 },
    'pro': { social: 6, events: 0 },
    'elite': { social: 10, events: 0 },
    'pinnacle': { social: 15, events: 0 }
  }
  
  const config = dutyConfig[tier]
  
  return {
    // Press conferences are per-race (1 pre-race + 1 post-race)
    // This tracks how many races have been completed with press duties fulfilled
    pressConferencesRequired: 0, // Now tracked per-race, not as a season total
    socialMediaPosts: config.social,
    teamEventsRequired: config.events,
    completed: { press: 0, social: 0, events: 0 },
    penalty: tier === 'pinnacle' || tier === 'elite' ? 'both' : 'satisfaction_drop',
    penaltyAmount: tier === 'pinnacle' ? 10 : tier === 'elite' ? 7 : 5
  }
}

/**
 * Generate team option based on tier and reputation
 */
export function generateTeamOption(tier: TeamTier, playerReputation: number): TeamOption | undefined {
  // Only professional+ tiers have team options
  if (!['professional', 'pro', 'elite', 'pinnacle'].includes(tier)) return undefined
  
  // High reputation players don't get team options (they get player options instead)
  if (playerReputation >= 75) return undefined
  
  return {
    canExtend: true,
    years: 1,
    deadline: 40, // Week 40 of the season
    exercised: false
  }
}

/**
 * Generate player option based on tier and reputation
 */
export function generatePlayerOption(tier: TeamTier, playerReputation: number): PlayerOption | undefined {
  // High reputation players at elite+ tiers get player options
  if (!['elite', 'pinnacle'].includes(tier)) return undefined
  if (playerReputation < 70) return undefined
  
  return {
    canExtend: true,
    years: 1,
    deadline: 35, // Week 35 of the season
    exercised: false
  }
}

// ============================================
// SATISFACTION UI HELPERS
// ============================================

export type TeamSatisfactionLevel = 'excellent' | 'happy' | 'satisfied' | 'concerned' | 'unhappy' | 'critical'

export function getTeamSatisfactionLevel(satisfaction: number): TeamSatisfactionLevel {
  if (satisfaction >= 85) return 'excellent'
  if (satisfaction >= 70) return 'happy'
  if (satisfaction >= 55) return 'satisfied'
  if (satisfaction >= SATISFACTION_WARNING_THRESHOLD) return 'concerned'
  if (satisfaction >= SATISFACTION_FINAL_WARNING_THRESHOLD) return 'unhappy'
  return 'critical'
}

export function getTeamSatisfactionColor(satisfaction: number): string {
  const level = getTeamSatisfactionLevel(satisfaction)
  switch (level) {
    case 'excellent': return '#22c55e'  // Green
    case 'happy': return '#4ade80'       // Light green
    case 'satisfied': return '#3b82f6'   // Blue
    case 'concerned': return '#f59e0b'   // Amber
    case 'unhappy': return '#f97316'     // Orange
    case 'critical': return '#ef4444'    // Red
  }
}

export function getTeamSatisfactionLabel(satisfaction: number): string {
  const level = getTeamSatisfactionLevel(satisfaction)
  switch (level) {
    case 'excellent': return 'Excellent'
    case 'happy': return 'Happy'
    case 'satisfied': return 'Satisfied'
    case 'concerned': return 'Concerned'
    case 'unhappy': return 'Unhappy'
    case 'critical': return 'Critical'
  }
}
