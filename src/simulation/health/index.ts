/**
 * Injury System
 * 
 * Manages player injuries, their triggers, severity, and recovery.
 * Injuries make races harder (AI buff) and limit training options.
 */

import { DriverStats, RaceResult } from '@/store/careerStore';

// ============================================
// TYPES
// ============================================

export type InjurySeverity = 'none' | 'minor' | 'moderate' | 'major'
export type InjuryType = 'muscle_strain' | 'back_pain' | 'neck_strain' | 'concussion' | 'wrist_injury' | 'rib_injury' | 'leg_injury' | 'fatigue_collapse' | 'training_accident'
export type InjuryCause = 'crash' | 'overtraining' | 'training_accident' | 'fatigue' | 'random'

export interface InjuryState {
  injured: boolean
  severity: InjurySeverity
  recoveryWeeksRemaining: number
  originalRecoveryWeeks: number
  type?: InjuryType
  cause?: InjuryCause
  description?: string
}

export interface InjuryEvent {
  id: string
  type: InjuryType
  severity: InjurySeverity
  cause: string
  title: string
  description: string
  recoveryWeeks: number
  aiPenalty: number
  trainingRestrictions: string[]
}

const RECOVERY_WEEKS: Record<string, { min: number; max: number }> = {
  none: { min: 0, max: 0 },
  minor: { min: 1, max: 2 },
  moderate: { min: 2, max: 4 },
  major: { min: 4, max: 8 }
}

const BASE_RECOVERY_WEEKS = RECOVERY_WEEKS as Record<InjurySeverity, { min: number; max: number }>

const LOW_FITNESS_THRESHOLD = 40
const HIGH_FITNESS_RECOVERY_BONUS = 0.2
const LOW_FITNESS_RECOVERY_PENALTY = 0.3
const CRASH_INJURY_CHANCE = 0.15
const OVERTRAINING_INJURY_CHANCE = 0.08
const TRAINING_ACCIDENT_CHANCE = 0.05
const RANDOM_INJURY_CHANCE = 0.005

const INJURY_AI_PENALTIES: Record<InjurySeverity, number> = {
  none: 0,
  minor: 2,
  moderate: 5,
  major: 10
}

// ============================================
// INJURY DEFINITIONS
// ============================================

export const INJURY_TYPES: Record<InjuryType, {
  name: string
  severities: InjurySeverity[]
  causes: InjuryCause[]
  description: string
  trainingRestrictions: string[]
}> = {
  muscle_strain: {
    name: 'Muscle Strain',
    severities: ['minor', 'moderate'],
    causes: ['overtraining', 'training_accident'],
    description: 'Strained muscle from overexertion',
    trainingRestrictions: ['gym_intense', 'gym_light']
  },
  back_pain: {
    name: 'Back Pain',
    severities: ['minor', 'moderate', 'major'],
    causes: ['crash', 'overtraining'],
    description: 'Back discomfort affecting driving posture',
    trainingRestrictions: ['gym_intense', 'simulator']
  },
  neck_strain: {
    name: 'Neck Strain',
    severities: ['minor', 'moderate'],
    causes: ['crash'],
    description: 'Neck strain from high G-forces',
    trainingRestrictions: ['gym_intense', 'simulator']
  },
  concussion: {
    name: 'Concussion',
    severities: ['moderate', 'major'],
    causes: ['crash'],
    description: 'Head impact requiring rest and monitoring',
    trainingRestrictions: ['gym_intense', 'gym_light', 'simulator', 'reaction']
  },
  wrist_injury: {
    name: 'Wrist Injury',
    severities: ['minor', 'moderate'],
    causes: ['crash', 'training_accident'],
    description: 'Wrist sprain or strain',
    trainingRestrictions: ['gym_intense', 'simulator']
  },
  rib_injury: {
    name: 'Rib Injury',
    severities: ['moderate', 'major'],
    causes: ['crash'],
    description: 'Bruised or fractured ribs',
    trainingRestrictions: ['gym_intense', 'gym_light']
  },
  leg_injury: {
    name: 'Leg Injury',
    severities: ['moderate', 'major'],
    causes: ['crash'],
    description: 'Leg injury affecting pedal control',
    trainingRestrictions: ['gym_intense', 'gym_light']
  },
  fatigue_collapse: {
    name: 'Exhaustion',
    severities: ['minor', 'moderate'],
    causes: ['fatigue', 'overtraining'],
    description: 'Physical exhaustion requiring mandatory rest',
    trainingRestrictions: ['gym_intense', 'gym_light', 'simulator']
  },
  training_accident: {
    name: 'Training Accident',
    severities: ['minor', 'moderate'],
    causes: ['training_accident'],
    description: 'Accident during training session',
    trainingRestrictions: ['gym_intense']
  }
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Create default injury state (healthy)
 */
export function createDefaultInjuryState(): InjuryState {
  return {
    injured: false,
    severity: 'none',
    recoveryWeeksRemaining: 0,
    originalRecoveryWeeks: 0
  }
}

/**
 * Calculate injury risk modifier based on fitness
 */
export function calculateFitnessModifier(fitness: number): number {
  if (fitness >= 80) return -0.5  // 50% less likely
  if (fitness >= 60) return -0.25 // 25% less likely
  if (fitness < LOW_FITNESS_THRESHOLD) return 0.5 // 50% more likely
  return 0 // No modifier
}

/**
 * Check for crash-related injury
 */
export function checkCrashInjury(
  stats: DriverStats,
  raceResult: RaceResult
): InjuryState | null {
  if (!raceResult.dnf) return null

  const fitnessModifier = calculateFitnessModifier(stats.fitness)
  const adjustedChance = CRASH_INJURY_CHANCE * (1 + fitnessModifier)
  
  if (Math.random() > adjustedChance) return null

  // Determine severity (crashes tend to be worse)
  const severityRoll = Math.random()
  let severity: InjurySeverity
  if (severityRoll < 0.5) severity = 'minor'
  else if (severityRoll < 0.85) severity = 'moderate'
  else severity = 'major'

  // Pick appropriate injury type
  const crashTypes: InjuryType[] = ['back_pain', 'neck_strain', 'wrist_injury', 'rib_injury', 'leg_injury', 'concussion']
  const possibleTypes = crashTypes.filter(t => 
    INJURY_TYPES[t].severities.includes(severity)
  )
  const type = possibleTypes[Math.floor(Math.random() * possibleTypes.length)]
  
  return generateInjury(type, severity, 'crash', stats.fitness)
}

/**
 * Check for overtraining injury
 */
export function checkOvertrainingInjury(
  stats: DriverStats,
  fatigue: number
): InjuryState | null {
  if (fatigue < 90) return null // Only check at high fatigue

  const fatigueMultiplier = fatigue >= 100 ? 2 : 1
  const fitnessModifier = calculateFitnessModifier(stats.fitness)
  const adjustedChance = OVERTRAINING_INJURY_CHANCE * fatigueMultiplier * (1 + fitnessModifier)
  
  if (Math.random() > adjustedChance) return null

  // Overtraining injuries are usually minor to moderate
  const severity: InjurySeverity = Math.random() < 0.7 ? 'minor' : 'moderate'
  const types: InjuryType[] = ['muscle_strain', 'back_pain', 'fatigue_collapse']
  const type = types[Math.floor(Math.random() * types.length)]
  
  return generateInjury(type, severity, 'overtraining', stats.fitness)
}

/**
 * Check for training accident
 */
export function checkTrainingAccident(
  stats: DriverStats,
  activityId: string
): InjuryState | null {
  // Only intense activities risk injury
  const riskyActivities = ['gym_intense', 'wet_practice']
  if (!riskyActivities.includes(activityId)) return null

  const fitnessModifier = calculateFitnessModifier(stats.fitness)
  const adjustedChance = TRAINING_ACCIDENT_CHANCE * (1 + fitnessModifier)
  
  if (Math.random() > adjustedChance) return null

  const severity: InjurySeverity = Math.random() < 0.8 ? 'minor' : 'moderate'
  const types: InjuryType[] = ['muscle_strain', 'wrist_injury', 'training_accident']
  const type = types[Math.floor(Math.random() * types.length)]
  
  return generateInjury(type, severity, 'training_accident', stats.fitness)
}

/**
 * Check for random injury (weekly check)
 */
export function checkRandomInjury(stats: DriverStats): InjuryState | null {
  const fitnessModifier = calculateFitnessModifier(stats.fitness)
  const adjustedChance = RANDOM_INJURY_CHANCE * (1 + fitnessModifier)
  
  if (Math.random() > adjustedChance) return null

  // Random injuries are usually minor
  const severity: InjurySeverity = Math.random() < 0.85 ? 'minor' : 'moderate'
  const types: InjuryType[] = ['muscle_strain', 'back_pain']
  const type = types[Math.floor(Math.random() * types.length)]
  
  return generateInjury(type, severity, 'random', stats.fitness)
}

/**
 * Generate an injury with appropriate recovery time
 */
export function generateInjury(
  type: InjuryType,
  severity: InjurySeverity,
  cause: InjuryCause,
  fitness: number
): InjuryState {
  const recoveryRange = BASE_RECOVERY_WEEKS[severity]
  let baseRecovery = recoveryRange.min + Math.floor(
    Math.random() * (recoveryRange.max - recoveryRange.min + 1)
  )

  // Apply fitness modifier to recovery time
  if (fitness >= 80) {
    baseRecovery = Math.max(1, Math.ceil(baseRecovery * (1 - HIGH_FITNESS_RECOVERY_BONUS)))
  } else if (fitness < LOW_FITNESS_THRESHOLD) {
    baseRecovery = Math.ceil(baseRecovery * (1 + LOW_FITNESS_RECOVERY_PENALTY))
  }

  const injuryInfo = INJURY_TYPES[type]

  return {
    injured: true,
    severity,
    type,
    description: injuryInfo.description,
    recoveryWeeksRemaining: baseRecovery,
    originalRecoveryWeeks: baseRecovery,
    cause
  }
}

/**
 * Process weekly injury healing
 */
export function processInjuryHealing(
  injury: InjuryState,
  fitness: number
): InjuryState {
  if (!injury.injured) return injury

  // Calculate healing rate based on fitness
  let healingRate = 1 // 1 week of healing per week
  if (fitness >= 80) {
    healingRate = 1.5 // 50% faster
  } else if (fitness < LOW_FITNESS_THRESHOLD) {
    healingRate = 0.5 // 50% slower
  }

  const weeksHealed = Math.ceil(healingRate)
  const newRecovery = Math.max(0, injury.recoveryWeeksRemaining - weeksHealed)

  if (newRecovery <= 0) {
    // Fully healed
    return createDefaultInjuryState()
  }

  return {
    ...injury,
    recoveryWeeksRemaining: newRecovery
  }
}

/**
 * Check if an activity is restricted by current injury
 */
export function isActivityRestricted(
  injury: InjuryState,
  activityId: string
): boolean {
  if (!injury.injured || !injury.type) return false
  
  const restrictions = INJURY_TYPES[injury.type].trainingRestrictions
  return restrictions.includes(activityId)
}

/**
 * Get all restricted activities for current injury
 */
export function getRestrictedActivities(injury: InjuryState): string[] {
  if (!injury.injured || !injury.type) return []
  return INJURY_TYPES[injury.type].trainingRestrictions
}

/**
 * Get AI penalty for current injury
 */
export function getInjuryAIPenalty(injury: InjuryState): number {
  return INJURY_AI_PENALTIES[injury.severity]
}

/**
 * Get injury status description
 */
export function getInjuryStatusText(injury: InjuryState): string {
  if (!injury.injured) return 'Healthy'
  
  const typeName = injury.type ? INJURY_TYPES[injury.type].name : 'Injury'
  const weeksText = injury.recoveryWeeksRemaining === 1 ? '1 week' : `${injury.recoveryWeeksRemaining} weeks`
  
  return `${typeName} (${injury.severity}) - ${weeksText} recovery`
}

/**
 * Check if player can race with current injury
 */
export function canRaceWithInjury(injury: InjuryState): { canRace: boolean; warning?: string } {
  if (!injury.injured) return { canRace: true }

  switch (injury.severity) {
    case 'minor':
      return { 
        canRace: true, 
        warning: 'Racing while injured may slow recovery' 
      }
    case 'moderate':
      return { 
        canRace: true, 
        warning: 'Racing with moderate injury - increased AI difficulty and slower recovery' 
      }
    case 'major':
      return { 
        canRace: false, 
        warning: 'Too injured to race - must recover first' 
      }
    default:
      return { canRace: true }
  }
}

/**
 * Generate injury event for notifications
 */
export function createInjuryEvent(
  injury: InjuryState,
  week: number,
  year: number
): InjuryEvent {
  const typeInfo = injury.type ? INJURY_TYPES[injury.type] : null
  
  return {
    id: `injury_${week}_${year}`,
    type: injury.type || 'muscle_strain',
    severity: injury.severity,
    cause: injury.cause || 'random',
    title: typeInfo?.name || 'Injury',
    description: injury.description || 'You\'ve sustained an injury',
    recoveryWeeks: injury.originalRecoveryWeeks,
    aiPenalty: INJURY_AI_PENALTIES[injury.severity],
    trainingRestrictions: typeInfo?.trainingRestrictions || []
  }
}

