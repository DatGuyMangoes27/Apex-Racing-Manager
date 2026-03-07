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
// CONTRACT TARGETS & CLAUSES GENERATION
// ============================================

/** Generate performance targets for a contract based on tier and series. */
export function generateContractTargets(
  teamTier: TeamTier,
  totalRaces: number,
  gridSize: number,
  _isWorksDriver: boolean,
  championshipId?: string
): ContractTarget[] {
  const pointsSystem = championshipId ? getPointsSystem(championshipId) : null
  const maxPointsPerRace = pointsSystem ? getMaxPointsForRace(pointsSystem) : 25
  const roughPointsForTopHalf = Math.floor(totalRaces * maxPointsPerRace * 0.4)
  const targets: ContractTarget[] = []
  let id = 0
  const add = (type: ContractTargetType, targetValue: number, description: string, severity: ContractTargetSeverity) => {
    targets.push({
      id: `ct-${++id}`,
      type,
      targetValue,
      currentProgress: 0,
      description,
      met: false,
      exceeded: false,
      severity
    })
  }
  if (['professional', 'pro', 'elite', 'pinnacle'].includes(teamTier)) {
    add('points_minimum', Math.max(10, roughPointsForTopHalf), `Score at least ${Math.max(10, roughPointsForTopHalf)} points`, 'expected')
    add('podiums', teamTier === 'pinnacle' || teamTier === 'elite' ? 2 : 1, `At least ${teamTier === 'pinnacle' || teamTier === 'elite' ? 2 : 1} podium(s)`, 'bonus')
  }
  return targets
}

/** Generate termination conditions for a contract based on tier. */
export function generateTerminationConditions(teamTier: TeamTier): TerminationConditions {
  const strict = ['elite', 'pinnacle'].includes(teamTier)
  return {
    performanceClause: true,
    missedTargetLimit: strict ? 1 : 2,
    dnfPenalty: true,
    maxDNFsBeforeWarning: 3,
    maxDNFsBeforeTermination: strict ? 5 : 6,
    canBeTerminatedMidSeason: strict
  }
}

/** Generate renewal conditions for a contract based on tier and duration. */
export function generateRenewalConditions(teamTier: TeamTier, duration: number): RenewalConditions {
  const extensionYears = duration >= 2 ? 1 : 1
  const salaryIncrease = ['elite', 'pinnacle'].includes(teamTier) ? 15 : 10
  return {
    autoRenewIf: 'meets_targets' as AutoRenewCondition,
    extensionYears,
    salaryIncrease
  }
}

// ============================================
// SATISFACTION THRESHOLDS
// ============================================

export const SATISFACTION_WARNING_THRESHOLD = 45
export const SATISFACTION_FINAL_WARNING_THRESHOLD = 35
export const SATISFACTION_TERMINATION_THRESHOLD = 25

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

// ============================================
// CONTRACT SATISFACTION & SEASON TRACKING
// ============================================

export const DEFAULT_TEAM_SATISFACTION = 70

export interface RaceResultForContract {
  position: number
  totalDrivers: number
  points: number
  dnf: boolean
  fastestLap: boolean
  positionsGained: number
  gridPosition: number
}

export function calculateRaceSatisfactionChange(
  result: RaceResultForContract,
  contract: Contract,
  currentSatisfaction: number
): number {
  const positionRatio = result.position / result.totalDrivers
  let change = 0
  
  if (positionRatio <= 0.1) change = 8    // Top 10%
  else if (positionRatio <= 0.25) change = 4  // Top 25%
  else if (positionRatio <= 0.5) change = 1   // Top 50%
  else if (positionRatio <= 0.75) change = -2 // Bottom 50%
  else change = -5                             // Bottom 25%
  
  if (result.dnf) change -= 3
  if (result.fastestLap) change += 1
  if (result.positionsGained >= 5) change += 2
  
  return Math.max(-10, Math.min(10, change))
}

export function updateContractTargets(
  targets: ContractTarget[],
  result: RaceResultForContract,
  seasonStats: ContractSeasonStats
): ContractTarget[] {
  return targets.map(target => {
    let progress = target.currentProgress || 0
    switch (target.type) {
      case 'points_minimum': progress = seasonStats.points; break
      case 'podiums': progress = seasonStats.podiums; break
      case 'wins': progress = seasonStats.wins; break
      default: break
    }
    return { ...target, currentProgress: progress }
  })
}

export function updateSeasonStats(
  stats: ContractSeasonStats,
  result: RaceResultForContract
): ContractSeasonStats {
  return {
    ...stats,
    racesCompleted: stats.racesCompleted + 1,
    points: stats.points + result.points,
    wins: stats.wins + (result.position === 1 ? 1 : 0),
    podiums: stats.podiums + (result.position <= 3 ? 1 : 0),
    dnfCount: stats.dnfCount + (result.dnf ? 1 : 0)
  }
}

/** Result of contract renewal evaluation (may be extended with newEndYear, newSalary, etc. by callers) */
export type RenewalEvaluationResult = { shouldRenew: boolean; reason: string }

export function evaluateContractRenewal(
  contract: Contract,
  satisfaction: number,
  seasonStats: ContractSeasonStats
): RenewalEvaluationResult {
  if (satisfaction < 30) return { shouldRenew: false, reason: 'Team satisfaction too low' }
  if (satisfaction >= 70 && seasonStats.wins > 0) return { shouldRenew: true, reason: 'Strong performance' }
  if (satisfaction >= 50) return { shouldRenew: true, reason: 'Acceptable performance' }
  return { shouldRenew: false, reason: 'Underwhelming season results' }
}
