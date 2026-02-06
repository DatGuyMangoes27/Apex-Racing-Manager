/**
 * Driver Development System Configuration
 * 
 * Defines training programs, XP progression, and skill development
 * for hired drivers in the team management system.
 */

// ============================================
// TYPES
// ============================================

export type TrainingProgram = 
  | 'simulator_sessions'     // +qualifying, +consistency
  | 'fitness_program'        // +stamina, +consistency
  | 'wet_weather_training'   // +wetSkill
  | 'racecraft_coaching'     // +defending, +raceSkill
  | 'mental_coaching'        // +consistency, reduces aggression variance

export type CareerStage = 'rising' | 'peak' | 'declining' | 'veteran'

// ============================================
// INTERFACES
// ============================================

export interface DriverSkills {
  overall: number           // 0-1 scale, derived from other skills
  raceSkill: number         // Core racing pace
  qualifyingSkill: number   // Single-lap pace
  consistency: number       // Variation in performance
  wetSkill: number          // Performance in wet conditions
  defending: number         // Wheel-to-wheel ability
  aggression: number        // Risk-taking tendency
  stamina: number           // Endurance over long stints
}

export interface TrainingProgress {
  currentProgram: TrainingProgram | null
  programStartWeek: number
  programStartYear: number
  weeklyHoursAllocated: number  // 0-20 hours per week
  programProgress: number       // 0-100%
}

export interface DriverDevelopmentState {
  driverId: string
  
  // Current skill levels (mirrors RivalDriver but tracks separately for hired drivers)
  skills: DriverSkills
  
  // Experience system
  experiencePoints: number
  experienceLevel: number        // Derived from XP thresholds
  
  // Training state
  trainingProgress: TrainingProgress
  
  // Potential and growth
  potentialCeiling: number       // Maximum achievable overall skill (0.6-1.0)
  developmentRate: number        // How fast this driver improves (0.005-0.035)
  careerStage: CareerStage
  
  // Development history
  seasonalGrowth: number[]       // Overall skill change per season
  trainingHistory: CompletedTraining[]
  
  // Performance tracking for passive development
  recentRaceResults: RaceResultForXP[]
}

export interface CompletedTraining {
  program: TrainingProgram
  completedWeek: number
  completedYear: number
  skillsGained: Partial<DriverSkills>
  effectiveness: number   // 0-1, affected by satisfaction, facilities
}

export interface RaceResultForXP {
  week: number
  year: number
  position: number
  gridPosition: number
  wasWet: boolean
  hadBattles: boolean      // Wheel-to-wheel racing
  dnf: boolean
  polePosition: boolean
}

// ============================================
// TRAINING PROGRAM DEFINITIONS
// ============================================

export interface TrainingProgramConfig {
  id: TrainingProgram
  name: string
  description: string
  weeklyCost: number
  durationWeeks: number
  primarySkill: keyof DriverSkills
  primaryBonus: number
  secondarySkill?: keyof DriverSkills
  secondaryBonus?: number
  facilityBonus?: 'sim' | 'manufacturing'  // Which facility boosts effectiveness
}

export const TRAINING_PROGRAMS: Record<TrainingProgram, TrainingProgramConfig> = {
  simulator_sessions: {
    id: 'simulator_sessions',
    name: 'Simulator Sessions',
    description: 'Intensive sim practice to improve qualifying pace and consistency.',
    weeklyCost: 15000,
    durationWeeks: 3,
    primarySkill: 'qualifyingSkill',
    primaryBonus: 0.04,
    secondarySkill: 'consistency',
    secondaryBonus: 0.02,
    facilityBonus: 'sim'
  },
  fitness_program: {
    id: 'fitness_program',
    name: 'Fitness Program',
    description: 'Physical conditioning to improve stamina and race-long consistency.',
    weeklyCost: 8000,
    durationWeeks: 4,
    primarySkill: 'stamina',
    primaryBonus: 0.04,
    secondarySkill: 'consistency',
    secondaryBonus: 0.02
  },
  wet_weather_training: {
    id: 'wet_weather_training',
    name: 'Wet Weather Camp',
    description: 'Specialized training in wet and changing conditions.',
    weeklyCost: 25000,
    durationWeeks: 3,
    primarySkill: 'wetSkill',
    primaryBonus: 0.05
  },
  racecraft_coaching: {
    id: 'racecraft_coaching',
    name: 'Racecraft Coaching',
    description: 'One-on-one coaching for wheel-to-wheel racing skills.',
    weeklyCost: 20000,
    durationWeeks: 4,
    primarySkill: 'defending',
    primaryBonus: 0.04,
    secondarySkill: 'raceSkill',
    secondaryBonus: 0.02
  },
  mental_coaching: {
    id: 'mental_coaching',
    name: 'Mental Coaching',
    description: 'Sports psychology to improve consistency and reduce mistakes.',
    weeklyCost: 12000,
    durationWeeks: 3,
    primarySkill: 'consistency',
    primaryBonus: 0.04,
    secondarySkill: 'aggression',
    secondaryBonus: -0.015  // Reduces aggression variance (good thing)
  }
}

// ============================================
// XP SYSTEM CONFIGURATION
// ============================================

export const XP_REWARDS = {
  // Race participation
  raceStart: 5,
  raceFinish: 3,       // Additional for finishing (no DNF)
  
  // Position-based
  pointsFinish: 10,    // Top 10
  topFive: 15,         // Top 5
  podium: 25,          // Top 3
  win: 50,
  
  // Qualifying
  polePosition: 15,
  frontRow: 8,
  
  // Special conditions
  wetRaceFinish: 10,   // Additional for finishing in wet
  overtakes: 2,        // Per significant overtake (simplified as hadBattles)
  
  // Negative
  dnf: -5
}

export const XP_LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  850,    // Level 5
  1300,   // Level 6
  1900,   // Level 7
  2600,   // Level 8
  3500,   // Level 9
  4600,   // Level 10
  6000,   // Level 11
  7700,   // Level 12
  9700,   // Level 13
  12000,  // Level 14
  15000   // Level 15 (max)
]

// ============================================
// CAREER STAGE MODIFIERS
// ============================================

export const CAREER_STAGE_MODIFIERS: Record<CareerStage, {
  xpMultiplier: number
  trainingEffectiveness: number
  passiveGrowthRate: number
  skillDeclineRisk: number
}> = {
  rising: {
    xpMultiplier: 1.5,           // Young drivers learn faster
    trainingEffectiveness: 1.2,
    passiveGrowthRate: 0.015,    // Natural improvement
    skillDeclineRisk: 0
  },
  peak: {
    xpMultiplier: 1.0,
    trainingEffectiveness: 1.0,
    passiveGrowthRate: 0.005,
    skillDeclineRisk: 0
  },
  declining: {
    xpMultiplier: 0.8,
    trainingEffectiveness: 0.9,
    passiveGrowthRate: 0,
    skillDeclineRisk: 0.02       // 2% chance of skill decline per season
  },
  veteran: {
    xpMultiplier: 0.6,
    trainingEffectiveness: 0.75,
    passiveGrowthRate: -0.005,   // Natural decline
    skillDeclineRisk: 0.05       // 5% chance of additional decline
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate XP earned from a race result
 */
export function calculateRaceXP(result: RaceResultForXP, careerStage: CareerStage): number {
  let xp = 0
  
  // Base participation
  xp += XP_REWARDS.raceStart
  
  if (!result.dnf) {
    xp += XP_REWARDS.raceFinish
    
    // Position rewards
    if (result.position === 1) xp += XP_REWARDS.win
    else if (result.position <= 3) xp += XP_REWARDS.podium
    else if (result.position <= 5) xp += XP_REWARDS.topFive
    else if (result.position <= 10) xp += XP_REWARDS.pointsFinish
    
    // Qualifying rewards
    if (result.polePosition) xp += XP_REWARDS.polePosition
    else if (result.gridPosition <= 2) xp += XP_REWARDS.frontRow
    
    // Special conditions
    if (result.wasWet) xp += XP_REWARDS.wetRaceFinish
    if (result.hadBattles) xp += XP_REWARDS.overtakes * 3  // Assume 3 "battles"
  } else {
    xp += XP_REWARDS.dnf
  }
  
  // Apply career stage multiplier
  const stageModifier = CAREER_STAGE_MODIFIERS[careerStage]
  xp = Math.round(xp * stageModifier.xpMultiplier)
  
  return Math.max(0, xp)
}

/**
 * Calculate level from XP
 */
export function calculateLevelFromXP(xp: number): number {
  for (let i = XP_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVEL_THRESHOLDS[i]) {
      return i + 1
    }
  }
  return 1
}

/**
 * Calculate XP progress to next level (0-100%)
 */
export function calculateLevelProgress(xp: number): number {
  const currentLevel = calculateLevelFromXP(xp)
  if (currentLevel >= XP_LEVEL_THRESHOLDS.length) return 100
  
  const currentThreshold = XP_LEVEL_THRESHOLDS[currentLevel - 1]
  const nextThreshold = XP_LEVEL_THRESHOLDS[currentLevel]
  const progress = ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100
  
  return Math.min(100, Math.max(0, progress))
}

/**
 * Calculate training effectiveness based on driver satisfaction, facility level, etc.
 */
export function calculateTrainingEffectiveness(
  careerStage: CareerStage,
  driverSatisfaction: number,  // 0-100
  facilityLevel: number,       // 1-5
  hasRelevantFacility: boolean
): number {
  let effectiveness = CAREER_STAGE_MODIFIERS[careerStage].trainingEffectiveness
  
  // Satisfaction modifier: -20% to +20%
  const satisfactionModifier = (driverSatisfaction - 50) / 250  // -0.2 to +0.2
  effectiveness += satisfactionModifier
  
  // Facility modifier: 0% to +30%
  if (hasRelevantFacility) {
    const facilityModifier = (facilityLevel - 1) * 0.075  // 0, 0.075, 0.15, 0.225, 0.30
    effectiveness += facilityModifier
  }
  
  return Math.max(0.5, Math.min(1.5, effectiveness))
}

/**
 * Calculate skill improvement from training completion
 */
export function calculateTrainingSkillGains(
  program: TrainingProgramConfig,
  effectiveness: number
): Partial<DriverSkills> {
  const gains: Partial<DriverSkills> = {}
  
  gains[program.primarySkill] = program.primaryBonus * effectiveness
  
  if (program.secondarySkill && program.secondaryBonus) {
    gains[program.secondarySkill] = program.secondaryBonus * effectiveness
  }
  
  return gains
}

/**
 * Calculate passive skill improvement based on XP level and career stage
 */
export function calculatePassiveSkillGrowth(
  leveledUp: boolean,
  careerStage: CareerStage,
  developmentRate: number
): number {
  const stageModifier = CAREER_STAGE_MODIFIERS[careerStage]
  
  let growth = stageModifier.passiveGrowthRate
  
  // Level up bonus
  if (leveledUp) {
    growth += developmentRate * 0.5  // Half a development rate on level up
  }
  
  return growth
}

/**
 * Calculate overall skill from individual skills
 */
export function calculateOverallSkill(skills: Omit<DriverSkills, 'overall'>): number {
  // Weighted average of skills
  const weights = {
    raceSkill: 0.25,
    qualifyingSkill: 0.15,
    consistency: 0.20,
    wetSkill: 0.10,
    defending: 0.15,
    aggression: 0.05,  // Lower weight, can be good or bad
    stamina: 0.10
  }
  
  let total = 0
  let weightSum = 0
  
  for (const [skill, weight] of Object.entries(weights)) {
    const value = skills[skill as keyof typeof skills]
    if (value !== undefined) {
      total += value * weight
      weightSum += weight
    }
  }
  
  return weightSum > 0 ? total / weightSum : 0.5
}

/**
 * Create initial development state for a hired driver
 */
export function createDriverDevelopmentState(
  driverId: string,
  baseSkill: number,
  developmentRate: number,
  careerStage: CareerStage,
  age: number
): DriverDevelopmentState {
  // Generate initial skills based on baseSkill with some variance
  const variance = 0.05
  const generateSkill = () => Math.max(0.1, Math.min(1.0, baseSkill + (Math.random() - 0.5) * variance))
  
  const skills: DriverSkills = {
    overall: baseSkill,
    raceSkill: generateSkill(),
    qualifyingSkill: generateSkill(),
    consistency: generateSkill(),
    wetSkill: generateSkill(),
    defending: generateSkill(),
    aggression: 0.3 + Math.random() * 0.4,  // 0.3-0.7
    stamina: generateSkill()
  }
  
  // Calculate potential ceiling based on age and development rate
  const potentialCeiling = Math.min(1.0, baseSkill + developmentRate * (35 - age))
  
  return {
    driverId,
    skills,
    experiencePoints: 0,
    experienceLevel: 1,
    trainingProgress: {
      currentProgram: null,
      programStartWeek: 0,
      programStartYear: 0,
      weeklyHoursAllocated: 0,
      programProgress: 0
    },
    potentialCeiling,
    developmentRate,
    careerStage,
    seasonalGrowth: [],
    trainingHistory: [],
    recentRaceResults: []
  }
}

/**
 * Get all training programs as an array
 */
export function getAllTrainingPrograms(): TrainingProgramConfig[] {
  return Object.values(TRAINING_PROGRAMS)
}

/**
 * Calculate total cost of a training program
 */
export function calculateProgramTotalCost(program: TrainingProgramConfig): number {
  return program.weeklyCost * program.durationWeeks
}
