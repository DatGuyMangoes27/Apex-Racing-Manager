/**
 * Sponsor Performance Targets System
 * 
 * This module handles sponsor target generation, satisfaction tracking,
 * and consequence evaluation for the career mode.
 */

import { SponsorTier } from '@/data/sponsors'

// ============================================
// TARGET TYPES & INTERFACES
// ============================================

export type SponsorTargetType = 
  | 'championship_position'  // Finish in top X in championship
  | 'wins'                   // Win at least X races
  | 'podiums'                // Score at least X podiums
  | 'races_started'          // Start at least X% of races
  | 'max_dnfs'               // Have no more than X DNFs

export interface SponsorTarget {
  id: string
  type: SponsorTargetType
  targetValue: number         // The target to achieve
  currentProgress: number     // Current progress towards target
  description: string         // Human-readable description
  met: boolean                // Whether target has been met
  exceeded: boolean           // Whether target was exceeded (for bonuses)
  isInverse: boolean          // For targets like max_dnfs where lower is better
}

export interface TargetTemplate {
  type: SponsorTargetType
  baseValue: number           // Base target value
  tierModifier: number        // Multiplier based on sponsor tier
  seriesModifier: number      // Multiplier based on series tier
  description: string         // Template description with {value} placeholder
  isInverse?: boolean         // For targets where lower is better
}

// ============================================
// SATISFACTION SYSTEM
// ============================================

export interface SatisfactionChange {
  amount: number
  reason: string
  timestamp: number
}

export interface SatisfactionThresholds {
  excellent: number           // 80+ : Bonus payments
  good: number                // 60+ : Normal payments
  warning: number             // 40+ : Reduced payments
  critical: number            // 20+ : Severe reduction + warning
  termination: number         // Below 20: Contract terminated
}

export const SATISFACTION_THRESHOLDS: SatisfactionThresholds = {
  excellent: 80,
  good: 60,
  warning: 40,
  critical: 20,
  termination: 20
}

// ============================================
// SATISFACTION MODIFIERS
// ============================================

export interface SatisfactionModifiers {
  // Race result modifiers
  win: number
  podium: number
  pointsFinish: number
  dnf: number
  bottomQuarter: number
  
  // Season-end modifiers
  targetMet: number
  targetExceeded: number
  targetMissed: number
  targetBadlyMissed: number    // < 50% progress
  allTargetsMet: number        // Bonus for meeting ALL targets
}

export const SATISFACTION_MODIFIERS: SatisfactionModifiers = {
  // Race result modifiers
  win: 5,
  podium: 3,
  pointsFinish: 1,
  dnf: -2,
  bottomQuarter: -1,
  
  // Season-end modifiers
  targetMet: 5,
  targetExceeded: 8,
  targetMissed: -10,
  targetBadlyMissed: -20,
  allTargetsMet: 15
}

// ============================================
// MEDIA-RELATED SATISFACTION MODIFIERS
// ============================================

export interface MediaSatisfactionModifiers {
  // Positive media actions
  positiveMediaDuty: number        // Completed duty with positive tone
  neutralMediaDuty: number         // Completed duty with neutral tone
  sponsorMention: number           // Specifically mentioned sponsor positively
  
  // Negative media actions
  missedMediaDuty: number          // Skipped/missed mandatory duty
  negativeMediaDuty: number        // Completed duty with negative/critical tone
  controversyTriggered: number     // Caused a media controversy
  teamCriticism: number            // Publicly criticized team/personnel
  brokenPromise: number            // Failed to deliver on public promise
}

export const MEDIA_SATISFACTION_MODIFIERS: MediaSatisfactionModifiers = {
  // Positive
  positiveMediaDuty: 2,
  neutralMediaDuty: 1,
  sponsorMention: 3,
  
  // Negative
  missedMediaDuty: -3,
  negativeMediaDuty: -2,
  controversyTriggered: -4,
  teamCriticism: -5,
  brokenPromise: -6
}

// ============================================
// PAYMENT MODIFIERS BASED ON SATISFACTION
// ============================================

export interface PaymentModifier {
  minSatisfaction: number
  maxSatisfaction: number
  modifier: number            // Multiplier for payments (e.g., 0.5 = 50%)
  bonusModifier: number       // Multiplier for win/podium bonuses
}

export const PAYMENT_MODIFIERS: PaymentModifier[] = [
  { minSatisfaction: 80, maxSatisfaction: 100, modifier: 1.1, bonusModifier: 1.15 },  // Excellent
  { minSatisfaction: 60, maxSatisfaction: 79, modifier: 1.0, bonusModifier: 1.0 },    // Good
  { minSatisfaction: 40, maxSatisfaction: 59, modifier: 0.75, bonusModifier: 0.75 },  // Warning
  { minSatisfaction: 20, maxSatisfaction: 39, modifier: 0.5, bonusModifier: 0.5 },    // Critical
  { minSatisfaction: 0, maxSatisfaction: 19, modifier: 0, bonusModifier: 0 }          // Terminated
]

// ============================================
// TARGET TEMPLATES BY SPONSOR TIER
// ============================================

export const TARGET_TEMPLATES: Record<SponsorTier, TargetTemplate[]> = {
  elite: [
    {
      type: 'championship_position',
      baseValue: 3,
      tierModifier: 1,
      seriesModifier: 1,
      description: 'Finish in the top {value} in the championship'
    },
    {
      type: 'wins',
      baseValue: 3,
      tierModifier: 1,
      seriesModifier: 0.8,
      description: 'Win at least {value} race(s) this season'
    },
    {
      type: 'podiums',
      baseValue: 8,
      tierModifier: 1,
      seriesModifier: 0.7,
      description: 'Score at least {value} podium(s) this season'
    },
    {
      type: 'max_dnfs',
      baseValue: 2,
      tierModifier: 1,
      seriesModifier: 1,
      description: 'Have no more than {value} DNF(s)',
      isInverse: true
    }
  ],
  high: [
    {
      type: 'championship_position',
      baseValue: 5,
      tierModifier: 1,
      seriesModifier: 1,
      description: 'Finish in the top {value} in the championship'
    },
    {
      type: 'podiums',
      baseValue: 5,
      tierModifier: 1,
      seriesModifier: 0.8,
      description: 'Score at least {value} podium(s) this season'
    },
    {
      type: 'races_started',
      baseValue: 80,
      tierModifier: 1,
      seriesModifier: 1,
      description: 'Start at least {value}% of scheduled races'
    }
  ],
  mid: [
    {
      type: 'championship_position',
      baseValue: 10,
      tierModifier: 1,
      seriesModifier: 1.2,
      description: 'Finish in the top {value} in the championship'
    },
    {
      type: 'podiums',
      baseValue: 3,
      tierModifier: 1,
      seriesModifier: 0.8,
      description: 'Score at least {value} podium(s) this season'
    },
    {
      type: 'races_started',
      baseValue: 75,
      tierModifier: 1,
      seriesModifier: 1,
      description: 'Start at least {value}% of scheduled races'
    }
  ],
  entry: [
    {
      type: 'championship_position',
      baseValue: 15,
      tierModifier: 1,
      seriesModifier: 1.3,
      description: 'Finish in the top {value} in the championship'
    },
    {
      type: 'races_started',
      baseValue: 70,
      tierModifier: 1,
      seriesModifier: 1,
      description: 'Start at least {value}% of scheduled races'
    }
  ]
}

// ============================================
// SERIES TIER DIFFICULTY MODIFIERS
// ============================================

// How difficult it is to achieve targets in different series tiers
export const SERIES_TIER_DIFFICULTY: Record<string, number> = {
  'entry': 0.6,        // Easier targets in entry-level series
  'amateur': 0.7,
  'semi-pro': 0.85,
  'professional': 1.0,
  'pro': 1.0,
  'elite': 1.2,        // Harder targets in elite series
  'pinnacle': 1.5      // Very hard targets in pinnacle series
}

// ============================================
// GRACE PERIOD CONFIGURATION
// ============================================

export const GRACE_PERIOD_RACES = 3  // No penalties for first 3 races

// ============================================
// REPUTATION IMPACT
// ============================================

export interface ReputationImpact {
  sponsorTerminated: number     // Reputation hit when sponsor terminates
  marketabilityPenalty: number  // Marketability hit when sponsor terminates
  seasonCompleteBonus: number   // Rep bonus for completing season with 70+ satisfaction
  marketabilityBonus: number    // Marketability bonus for happy sponsors
}

export const REPUTATION_IMPACT: ReputationImpact = {
  sponsorTerminated: -3,
  marketabilityPenalty: -2,  // Reduced from -5: slower brand damage
  seasonCompleteBonus: 1,
  marketabilityBonus: 1     // Reduced from 2: slower brand growth
}

// ============================================
// HELPER TYPES FOR UI
// ============================================

export type SatisfactionLevel = 'excellent' | 'good' | 'warning' | 'critical' | 'terminated'

export function getSatisfactionLevel(satisfaction: number): SatisfactionLevel {
  if (satisfaction >= SATISFACTION_THRESHOLDS.excellent) return 'excellent'
  if (satisfaction >= SATISFACTION_THRESHOLDS.good) return 'good'
  if (satisfaction >= SATISFACTION_THRESHOLDS.warning) return 'warning'
  if (satisfaction >= SATISFACTION_THRESHOLDS.critical) return 'critical'
  return 'terminated'
}

export function getSatisfactionColor(satisfaction: number): string {
  const level = getSatisfactionLevel(satisfaction)
  switch (level) {
    case 'excellent': return '#22c55e'    // Green
    case 'good': return '#3b82f6'         // Blue
    case 'warning': return '#f59e0b'      // Amber
    case 'critical': return '#ef4444'     // Red
    case 'terminated': return '#7f1d1d'   // Dark red
  }
}

export function getSatisfactionLabel(satisfaction: number): string {
  const level = getSatisfactionLevel(satisfaction)
  switch (level) {
    case 'excellent': return 'Excellent'
    case 'good': return 'Satisfied'
    case 'warning': return 'Concerned'
    case 'critical': return 'Unhappy'
    case 'terminated': return 'Terminated'
  }
}

// ============================================
// TARGET GENERATION FUNCTIONS
// ============================================

/**
 * Calculate the adjusted target value based on sponsor tier and series tier
 */
function calculateTargetValue(
  template: TargetTemplate,
  seriesTier: string,
  totalRaces: number
): number {
  const seriesDifficulty = SERIES_TIER_DIFFICULTY[seriesTier] || 1.0
  
  let value = template.baseValue
  
  // Apply series modifier
  value = Math.round(value * template.seriesModifier * seriesDifficulty)
  
  // For championship position, cap at reasonable value based on grid size
  if (template.type === 'championship_position') {
    // Ensure target is at least 1 and not more than a reasonable percentage of grid
    value = Math.max(1, Math.min(value, Math.ceil(totalRaces * 0.5)))
  }
  
  // For races_started, it's a percentage so keep it as-is
  if (template.type === 'races_started') {
    value = Math.min(100, Math.max(50, template.baseValue))
  }
  
  // For max_dnfs, keep it reasonable
  if (template.type === 'max_dnfs') {
    value = Math.max(1, Math.min(value, Math.ceil(totalRaces * 0.2)))
  }
  
  // For wins/podiums, scale based on total races
  if (template.type === 'wins' || template.type === 'podiums') {
    // Ensure we don't expect more wins/podiums than races
    const maxReasonable = template.type === 'wins' 
      ? Math.ceil(totalRaces * 0.3)  // Max 30% win rate expectation
      : Math.ceil(totalRaces * 0.5)  // Max 50% podium rate expectation
    value = Math.min(value, maxReasonable)
    value = Math.max(1, value)
  }
  
  return value
}

/**
 * Generate a description for a target
 */
function generateTargetDescription(
  template: TargetTemplate,
  targetValue: number
): string {
  return template.description.replace('{value}', targetValue.toString())
}

/**
 * Select which targets to generate for a sponsor based on their tier
 * Elite sponsors get more/harder targets, entry-level sponsors get fewer/easier
 */
function selectTargetsForTier(tier: SponsorTier): TargetTemplate[] {
  const templates = TARGET_TEMPLATES[tier]
  
  // Number of targets based on tier
  const targetCounts: Record<SponsorTier, number> = {
    elite: 3,    // Elite sponsors have 3 demanding targets
    high: 2,     // High tier has 2 targets
    mid: 2,      // Mid tier has 2 targets
    entry: 1     // Entry level has just 1 easy target
  }
  
  const count = targetCounts[tier]
  
  // For elite/high, we use the defined templates
  // For mid/entry, we pick from available templates
  if (tier === 'elite') {
    // Elite always has position + wins + podiums (skip max_dnfs sometimes)
    return templates.slice(0, count)
  }
  
  // For other tiers, return the first N templates
  return templates.slice(0, count)
}

/**
 * Generate sponsor targets for a new sponsor deal
 * 
 * @param sponsorTier - The tier of the sponsor (entry, mid, high, elite)
 * @param seriesTier - The tier of the series the player is racing in
 * @param totalRaces - Total number of races in the season
 * @param gridSize - Number of competitors in the series (for position targets)
 * @returns Array of SponsorTarget objects
 */
export function generateSponsorTargets(
  sponsorTier: SponsorTier,
  seriesTier: string,
  totalRaces: number,
  gridSize: number = 20
): SponsorTarget[] {
  const selectedTemplates = selectTargetsForTier(sponsorTier)
  
  return selectedTemplates.map((template, index) => {
    let targetValue = calculateTargetValue(template, seriesTier, totalRaces)
    
    // For championship position, also consider grid size
    if (template.type === 'championship_position') {
      targetValue = Math.min(targetValue, Math.ceil(gridSize * 0.6))
    }
    
    return {
      id: `target_${template.type}_${Date.now()}_${index}`,
      type: template.type,
      targetValue,
      currentProgress: template.type === 'max_dnfs' ? 0 : 0, // DNFs start at 0 (good)
      description: generateTargetDescription(template, targetValue),
      met: false,
      exceeded: false,
      isInverse: template.isInverse || false
    }
  })
}

/**
 * Check if a target has been met based on current progress
 */
export function isTargetMet(target: SponsorTarget): boolean {
  if (target.isInverse) {
    // For inverse targets (like max_dnfs), progress should be <= target
    return target.currentProgress <= target.targetValue
  }
  // For normal targets, progress should be >= target
  return target.currentProgress >= target.targetValue
}

/**
 * Check if a target has been exceeded (for bonus calculation)
 */
export function isTargetExceeded(target: SponsorTarget): boolean {
  if (target.isInverse) {
    // For inverse targets, exceeded means significantly under the limit
    return target.currentProgress <= Math.floor(target.targetValue * 0.5)
  }
  // For normal targets, exceeded means 25%+ over the target
  return target.currentProgress >= Math.ceil(target.targetValue * 1.25)
}

/**
 * Check if a target is badly missed (< 50% progress)
 */
export function isTargetBadlyMissed(target: SponsorTarget): boolean {
  if (target.isInverse) {
    // For inverse targets, badly missed means way over the limit
    return target.currentProgress > target.targetValue * 1.5
  }
  // For normal targets, badly missed means < 50% of target achieved
  return target.currentProgress < target.targetValue * 0.5
}

/**
 * Update target progress after a race
 * 
 * @param target - The target to update
 * @param raceResult - Object containing race result data
 * @returns Updated target
 */
export function updateTargetProgress(
  target: SponsorTarget,
  raceResult: {
    position: number
    isDNF: boolean
    gridSize: number
  }
): SponsorTarget {
  const updatedTarget = { ...target }
  
  switch (target.type) {
    case 'wins':
      if (raceResult.position === 1 && !raceResult.isDNF) {
        updatedTarget.currentProgress += 1
      }
      break
      
    case 'podiums':
      if (raceResult.position <= 3 && !raceResult.isDNF) {
        updatedTarget.currentProgress += 1
      }
      break
      
    case 'races_started':
      // This is tracked as a percentage, updated at season end
      // For now, increment race count (will be converted to % later)
      updatedTarget.currentProgress += 1
      break
      
    case 'max_dnfs':
      if (raceResult.isDNF) {
        updatedTarget.currentProgress += 1
      }
      break
      
    // championship_position is evaluated at season end only
    case 'championship_position':
      // No per-race update needed
      break
  }
  
  // Update met/exceeded status
  updatedTarget.met = isTargetMet(updatedTarget)
  updatedTarget.exceeded = isTargetExceeded(updatedTarget)
  
  return updatedTarget
}

/**
 * Finalize targets at season end with final championship position
 * 
 * @param targets - Array of targets to finalize
 * @param finalPosition - Player's final championship position
 * @param totalRacesInSeason - Total races in the season calendar
 * @param racesStarted - Number of races the player actually started
 * @returns Array of finalized targets
 */
export function finalizeSeasonTargets(
  targets: SponsorTarget[],
  finalPosition: number,
  totalRacesInSeason: number,
  racesStarted: number
): SponsorTarget[] {
  return targets.map(target => {
    const updatedTarget = { ...target }
    
    switch (target.type) {
      case 'championship_position':
        updatedTarget.currentProgress = finalPosition
        // For position, lower is better so we need special handling
        updatedTarget.met = finalPosition <= target.targetValue
        updatedTarget.exceeded = finalPosition <= Math.floor(target.targetValue * 0.5)
        break
        
      case 'races_started':
        // Convert to percentage
        const percentage = Math.round((racesStarted / totalRacesInSeason) * 100)
        updatedTarget.currentProgress = percentage
        updatedTarget.met = percentage >= target.targetValue
        updatedTarget.exceeded = percentage >= Math.min(100, target.targetValue + 15)
        break
        
      default:
        // For other targets, just update met/exceeded status
        updatedTarget.met = isTargetMet(updatedTarget)
        updatedTarget.exceeded = isTargetExceeded(updatedTarget)
    }
    
    return updatedTarget
  })
}

/**
 * Get progress percentage for displaying in UI
 * 
 * @param target - The target to get progress for
 * @returns Progress as a percentage (0-100)
 */
export function getTargetProgressPercentage(target: SponsorTarget): number {
  if (target.isInverse) {
    // For inverse targets (like max_dnfs), show how much "budget" is remaining
    if (target.targetValue === 0) return target.currentProgress === 0 ? 100 : 0
    const remaining = target.targetValue - target.currentProgress
    const percentage = (remaining / target.targetValue) * 100
    return Math.max(0, Math.min(100, percentage))
  }
  
  // For normal targets
  if (target.targetValue === 0) return 100
  const percentage = (target.currentProgress / target.targetValue) * 100
  return Math.min(100, percentage) // Cap at 100% for display
}

/**
 * Get a human-readable progress string for a target
 */
export function getTargetProgressString(target: SponsorTarget): string {
  switch (target.type) {
    case 'championship_position':
      if (target.currentProgress === 0) return 'Season in progress'
      return `Currently P${target.currentProgress} (need top ${target.targetValue})`
      
    case 'races_started':
      return `${target.currentProgress}% (need ${target.targetValue}%)`
      
    case 'max_dnfs':
      return `${target.currentProgress}/${target.targetValue} DNFs used`
      
    default:
      return `${target.currentProgress}/${target.targetValue}`
  }
}

// ============================================
// SATISFACTION EVALUATION FUNCTIONS
// ============================================

export interface RaceResultForSatisfaction {
  position: number
  isDNF: boolean
  gridSize: number
  isPointsFinish: boolean
  raceNumber: number           // Which race of the season (1-based)
}

export interface SatisfactionUpdateResult {
  newSatisfaction: number
  change: number
  reason: string
  triggeredWarning: boolean
  triggeredTermination: boolean
}

/**
 * Calculate satisfaction change after a race
 * 
 * @param currentSatisfaction - Current satisfaction level (0-100)
 * @param raceResult - Race result data
 * @returns Object with new satisfaction and details about the change
 */
export function calculateRaceSatisfactionChange(
  currentSatisfaction: number,
  raceResult: RaceResultForSatisfaction
): SatisfactionUpdateResult {
  let change = 0
  let reason = ''
  
  // Grace period - no penalties for first 3 races
  const inGracePeriod = raceResult.raceNumber <= GRACE_PERIOD_RACES
  
  if (raceResult.isDNF) {
    if (!inGracePeriod) {
      change = SATISFACTION_MODIFIERS.dnf
      reason = 'DNF'
    } else {
      reason = 'DNF (grace period - no penalty)'
    }
  } else if (raceResult.position === 1) {
    change = SATISFACTION_MODIFIERS.win
    reason = 'Race win!'
  } else if (raceResult.position <= 3) {
    change = SATISFACTION_MODIFIERS.podium
    reason = 'Podium finish'
  } else if (raceResult.isPointsFinish) {
    change = SATISFACTION_MODIFIERS.pointsFinish
    reason = 'Points finish'
  } else if (raceResult.position > raceResult.gridSize * 0.75) {
    // Bottom quarter of the field
    if (!inGracePeriod) {
      change = SATISFACTION_MODIFIERS.bottomQuarter
      reason = 'Poor finish (bottom quarter)'
    } else {
      reason = 'Poor finish (grace period - no penalty)'
    }
  }
  
  // Calculate new satisfaction (clamped to 0-100)
  const newSatisfaction = Math.max(0, Math.min(100, currentSatisfaction + change))
  
  // Check for warning/termination thresholds
  const triggeredWarning = newSatisfaction < SATISFACTION_THRESHOLDS.warning && 
                           currentSatisfaction >= SATISFACTION_THRESHOLDS.warning
  const triggeredTermination = newSatisfaction < SATISFACTION_THRESHOLDS.termination
  
  return {
    newSatisfaction,
    change,
    reason,
    triggeredWarning,
    triggeredTermination
  }
}

/**
 * Calculate satisfaction change at end of season based on targets
 * 
 * @param currentSatisfaction - Current satisfaction level
 * @param targets - Array of finalized season targets
 * @returns Object with new satisfaction and details
 */
export function calculateSeasonEndSatisfaction(
  currentSatisfaction: number,
  targets: SponsorTarget[]
): SatisfactionUpdateResult {
  let change = 0
  const reasons: string[] = []
  
  let targetsMet = 0
  let targetsExceeded = 0
  let targetsMissed = 0
  let targetsBadlyMissed = 0
  
  targets.forEach(target => {
    if (target.exceeded) {
      targetsExceeded++
      change += SATISFACTION_MODIFIERS.targetExceeded
      reasons.push(`Exceeded: ${target.description}`)
    } else if (target.met) {
      targetsMet++
      change += SATISFACTION_MODIFIERS.targetMet
      reasons.push(`Met: ${target.description}`)
    } else if (isTargetBadlyMissed(target)) {
      targetsBadlyMissed++
      change += SATISFACTION_MODIFIERS.targetBadlyMissed
      reasons.push(`Badly missed: ${target.description}`)
    } else {
      targetsMissed++
      change += SATISFACTION_MODIFIERS.targetMissed
      reasons.push(`Missed: ${target.description}`)
    }
  })
  
  // Bonus for meeting ALL targets
  if (targets.length > 0 && targetsMet + targetsExceeded === targets.length) {
    change += SATISFACTION_MODIFIERS.allTargetsMet
    reasons.push('All targets met bonus!')
  }
  
  const newSatisfaction = Math.max(0, Math.min(100, currentSatisfaction + change))
  const triggeredTermination = newSatisfaction < SATISFACTION_THRESHOLDS.termination
  
  return {
    newSatisfaction,
    change,
    reason: reasons.join('; '),
    triggeredWarning: false, // Not applicable at season end
    triggeredTermination
  }
}

/**
 * Get the payment modifier based on current satisfaction
 * 
 * @param satisfaction - Current satisfaction level (0-100)
 * @returns Payment modifier (multiplier for payments)
 */
export function getPaymentModifier(satisfaction: number): number {
  const tier = PAYMENT_MODIFIERS.find(
    pm => satisfaction >= pm.minSatisfaction && satisfaction <= pm.maxSatisfaction
  )
  return tier?.modifier ?? 1.0
}

/**
 * Get the bonus modifier based on current satisfaction
 * 
 * @param satisfaction - Current satisfaction level (0-100)
 * @returns Bonus modifier (multiplier for win/podium bonuses)
 */
export function getBonusModifier(satisfaction: number): number {
  const tier = PAYMENT_MODIFIERS.find(
    pm => satisfaction >= pm.minSatisfaction && satisfaction <= pm.maxSatisfaction
  )
  return tier?.bonusModifier ?? 1.0
}

/**
 * Calculate the actual payment amount after satisfaction modifier
 * 
 * @param basePayment - Base payment amount
 * @param satisfaction - Current satisfaction level
 * @returns Adjusted payment amount
 */
export function calculateAdjustedPayment(
  basePayment: number,
  satisfaction: number
): number {
  const modifier = getPaymentModifier(satisfaction)
  return Math.round(basePayment * modifier)
}

/**
 * Calculate the actual bonus amount after satisfaction modifier
 * 
 * @param baseBonus - Base bonus amount
 * @param satisfaction - Current satisfaction level
 * @returns Adjusted bonus amount
 */
export function calculateAdjustedBonus(
  baseBonus: number,
  satisfaction: number
): number {
  const modifier = getBonusModifier(satisfaction)
  return Math.round(baseBonus * modifier)
}

/**
 * Check if a sponsor should issue a warning based on satisfaction drop
 * 
 * @param oldSatisfaction - Previous satisfaction level
 * @param newSatisfaction - New satisfaction level
 * @returns True if warning should be issued
 */
export function shouldIssueWarning(
  oldSatisfaction: number,
  newSatisfaction: number
): boolean {
  // Issue warning when crossing below 50 or below 30
  if (oldSatisfaction >= 50 && newSatisfaction < 50) return true
  if (oldSatisfaction >= 30 && newSatisfaction < 30) return true
  return false
}

/**
 * Check if a sponsor should terminate the contract
 * 
 * @param satisfaction - Current satisfaction level
 * @returns True if sponsor will terminate
 */
export function shouldTerminateContract(satisfaction: number): boolean {
  return satisfaction < SATISFACTION_THRESHOLDS.termination
}

/**
 * Generate a summary of the sponsor's mood/status
 */
export interface SponsorMoodSummary {
  level: SatisfactionLevel
  label: string
  color: string
  icon: 'happy' | 'neutral' | 'concerned' | 'angry' | 'terminated'
  message: string
}

export function getSponsorMoodSummary(
  satisfaction: number,
  targets: SponsorTarget[],
  sponsorName: string
): SponsorMoodSummary {
  const level = getSatisfactionLevel(satisfaction)
  const label = getSatisfactionLabel(satisfaction)
  const color = getSatisfactionColor(satisfaction)
  
  // Count target status
  const metCount = targets.filter(t => t.met).length
  const totalCount = targets.length
  
  let icon: SponsorMoodSummary['icon']
  let message: string
  
  switch (level) {
    case 'excellent':
      icon = 'happy'
      message = `${sponsorName} is thrilled with your performance! They're considering extending your deal.`
      break
    case 'good':
      icon = 'neutral'
      message = `${sponsorName} is satisfied with your performance. Keep up the good work!`
      break
    case 'warning':
      icon = 'concerned'
      message = `${sponsorName} is concerned about recent results. ${metCount}/${totalCount} targets on track.`
      break
    case 'critical':
      icon = 'angry'
      message = `${sponsorName} is unhappy with your performance. Contract at risk!`
      break
    case 'terminated':
      icon = 'terminated'
      message = `${sponsorName} has terminated the sponsorship due to poor performance.`
      break
  }
  
  return { level, label, color, icon, message }
}

/**
 * Default satisfaction value when a sponsor deal is signed
 */
export const DEFAULT_SATISFACTION = 70

// ============================================
// MEDIA-BASED SATISFACTION CALCULATIONS
// ============================================

export interface MediaActionForSatisfaction {
  type: 'duty_completed' | 'duty_skipped' | 'duty_missed' | 'controversy' | 'promise_broken' | 'promise_kept'
  tone?: 'positive' | 'neutral' | 'negative'
  mentionedSponsor?: boolean
  criticizedTeam?: boolean
  controversySeverity?: number  // 1-10
}export interface MediaSatisfactionResult {
  change: number
  reason: string
}

/**
 * Calculate satisfaction change from a media action
 * 
 * @param action - The media action that occurred
 * @returns Object with satisfaction change and reason
 */
export function calculateMediaSatisfactionChange(
  action: MediaActionForSatisfaction
): MediaSatisfactionResult {
  let change = 0
  let reason = ''
  
  switch (action.type) {
    case 'duty_completed':
      if (action.mentionedSponsor) {
        change = MEDIA_SATISFACTION_MODIFIERS.sponsorMention
        reason = 'Positive sponsor mention in media'
      } else if (action.tone === 'positive') {
        change = MEDIA_SATISFACTION_MODIFIERS.positiveMediaDuty
        reason = 'Positive media appearance'
      } else if (action.tone === 'negative' || action.criticizedTeam) {
        change = MEDIA_SATISFACTION_MODIFIERS.negativeMediaDuty
        reason = 'Negative media appearance'
      } else {
        change = MEDIA_SATISFACTION_MODIFIERS.neutralMediaDuty
        reason = 'Media duty completed'
      }
      break
      
    case 'duty_skipped':
    case 'duty_missed':
      change = MEDIA_SATISFACTION_MODIFIERS.missedMediaDuty
      reason = action.type === 'duty_skipped' ? 'Skipped media duty' : 'Missed media duty'
      break
      
    case 'controversy':
      // Severity 1-10 scales the penalty
      const severityMod = action.controversySeverity ? (action.controversySeverity / 5) : 1
      change = Math.round(MEDIA_SATISFACTION_MODIFIERS.controversyTriggered * severityMod)
      reason = 'Media controversy'
      break
      
    case 'promise_broken':
      change = MEDIA_SATISFACTION_MODIFIERS.brokenPromise
      reason = 'Broken public promise'
      break
      
    case 'promise_kept':
      change = 3 // Bonus for keeping promise
      reason = 'Delivered on public promise'
      break
  }
  
  // Team criticism is an additional penalty
  if (action.criticizedTeam) {
    change += MEDIA_SATISFACTION_MODIFIERS.teamCriticism
    reason += ' (criticized team)'
  }
  
  return { change, reason }
}

/**
 * Apply media effect to sponsor satisfaction
 * Returns the clamped new satisfaction value
 * 
 * @param currentSatisfaction - Current satisfaction (0-100)
 * @param mediaChange - Change amount from media action
 * @returns New satisfaction value (0-100)
 */
export function applyMediaSatisfactionChange(
  currentSatisfaction: number,
  mediaChange: number
): number {
  return Math.max(0, Math.min(100, currentSatisfaction + mediaChange))
}

/**
 * Calculate cumulative media impact on sponsor satisfaction
 * Used for weekly/end-of-week processing
 * 
 * @param actions - Array of media actions during the period
 * @returns Total satisfaction change
 */
export function calculateCumulativeMediaImpact(
  actions: MediaActionForSatisfaction[]
): MediaSatisfactionResult {
  let totalChange = 0
  const reasons: string[] = []
  
  for (const action of actions) {
    const result = calculateMediaSatisfactionChange(action)
    totalChange += result.change
    reasons.push(result.reason)
  }
  
  // Cap total change to prevent extreme swings from many small actions
  totalChange = Math.max(-15, Math.min(10, totalChange))
  
  return {
    change: totalChange,
    reason: reasons.length > 0 ? reasons.join('; ') : 'No media actions'
  }
}

/**
 * Check if media performance triggers a sponsor warning
 * 
 * @param mediaScoreChange - How much media score changed this week
 * @param controversyCount - Number of controversies this season
 * @param missedDuties - Number of missed duties this season
 * @returns True if sponsor should send warning about media performance
 */
export function shouldSendMediaWarning(
  mediaScoreChange: number,
  controversyCount: number,
  missedDuties: number
): boolean {
  // Warning if media score dropped significantly
  if (mediaScoreChange < -10) return true
  
  // Warning if multiple controversies this season
  if (controversyCount >= 3) return true
  
  // Warning if missed multiple duties
  if (missedDuties >= 2) return true
  
  return false
}