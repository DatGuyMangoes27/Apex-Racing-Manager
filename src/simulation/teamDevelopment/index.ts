/**
 * Team Development System
 * 
 * Comprehensive car development with:
 * - 4 development areas (Aero, Chassis, Powertrain, Electronics)
 * - Budget management and weekly allocation
 * - Tiered upgrades that affect AI opponent difficulty
 * - AI team development (development race)
 * - Enhanced events system
 */

import { TeamTier } from '@/data/ams2-teams-real'
import { 
  FacilityType, 
  getCombinedRdBonus,
  getManufacturingSpeedBonus 
} from '@/data/facility-config'
import { applyAeroDevPerk, applyChassisDevPerk, applyReliabilityPerk } from '@/simulation/perkSystem'

// ============================================
// DEVELOPMENT AREAS
// ============================================

export type DevelopmentArea = 'aerodynamics' | 'chassis' | 'powertrain' | 'electronics'

export interface AreaProgress {
  points: number           // 0-100 points in this area
  currentUpgradeId: string | null  // Currently researching upgrade
  researchProgress: number // 0-100 progress on current upgrade
  completedUpgrades: string[]  // IDs of completed upgrades
}

export interface DevelopmentAreas {
  aerodynamics: AreaProgress
  chassis: AreaProgress
  powertrain: AreaProgress
  electronics: AreaProgress
}

// What each area affects in terms of AI modifiers
export const AREA_EFFECTS: Record<DevelopmentArea, {
  name: string
  description: string
  icon: string
  aiTargets: string[]
  color: string
}> = {
  aerodynamics: {
    name: 'Aerodynamics',
    description: 'Qualifying pace, top speed, downforce efficiency',
    icon: 'Wind',
    aiTargets: ['qualifyingSkill'],
    color: 'text-blue-400'
  },
  chassis: {
    name: 'Chassis',
    description: 'Handling, tire management, consistency',
    icon: 'Car',
    aiTargets: ['consistency', 'tireManagement'],
    color: 'text-orange-400'
  },
  powertrain: {
    name: 'Powertrain',
    description: 'Race pace, reliability, power delivery',
    icon: 'Zap',
    aiTargets: ['raceSkill', 'vehicleReliability'],
    color: 'text-red-400'
  },
  electronics: {
    name: 'Electronics',
    description: 'Wet performance, starts, traction control',
    icon: 'Cpu',
    aiTargets: ['wetSkill', 'startReactions'],
    color: 'text-purple-400'
  }
}

// ============================================
// UPGRADE SYSTEM
// ============================================

export type UpgradeTier = 1 | 2 | 3

export interface CarUpgrade {
  id: string
  name: string
  area: DevelopmentArea
  tier: UpgradeTier
  description: string
  researchCost: number         // Budget cost to research
  pointsRequired: number       // Development points needed
  aiModifierBonus: number      // AI modifier when complete (negative = player advantage)
  prerequisiteId?: string      // Must complete this upgrade first
}

// Upgrade definitions for each area
export const UPGRADES: CarUpgrade[] = [
  // ============================================
  // AERODYNAMICS UPGRADES
  // ============================================
  {
    id: 'aero_t1_front_wing',
    name: 'Front Wing Optimization',
    area: 'aerodynamics',
    tier: 1,
    description: 'Improved front wing elements for better corner entry',
    researchCost: 15000,
    pointsRequired: 15,
    aiModifierBonus: -0.005
  },
  {
    id: 'aero_t1_rear_diffuser',
    name: 'Rear Diffuser Update',
    area: 'aerodynamics',
    tier: 1,
    description: 'Enhanced rear diffuser for improved downforce',
    researchCost: 18000,
    pointsRequired: 18,
    aiModifierBonus: -0.005
  },
  {
    id: 'aero_t2_floor_package',
    name: 'Floor Package Revision',
    area: 'aerodynamics',
    tier: 2,
    description: 'Major floor redesign for ground effect optimization',
    researchCost: 35000,
    pointsRequired: 35,
    aiModifierBonus: -0.01,
    prerequisiteId: 'aero_t1_front_wing'
  },
  {
    id: 'aero_t2_cooling',
    name: 'Cooling Efficiency Package',
    area: 'aerodynamics',
    tier: 2,
    description: 'Reduced drag through optimized cooling channels',
    researchCost: 30000,
    pointsRequired: 30,
    aiModifierBonus: -0.008,
    prerequisiteId: 'aero_t1_rear_diffuser'
  },
  {
    id: 'aero_t3_complete',
    name: 'Championship Aero Package',
    area: 'aerodynamics',
    tier: 3,
    description: 'Full aerodynamic optimization for maximum performance',
    researchCost: 60000,
    pointsRequired: 55,
    aiModifierBonus: -0.015,
    prerequisiteId: 'aero_t2_floor_package'
  },

  // ============================================
  // CHASSIS UPGRADES
  // ============================================
  {
    id: 'chassis_t1_suspension',
    name: 'Suspension Geometry Update',
    area: 'chassis',
    tier: 1,
    description: 'Revised suspension geometry for better tire contact',
    researchCost: 12000,
    pointsRequired: 12,
    aiModifierBonus: -0.005
  },
  {
    id: 'chassis_t1_weight',
    name: 'Weight Distribution Optimization',
    area: 'chassis',
    tier: 1,
    description: 'Improved weight distribution for balanced handling',
    researchCost: 14000,
    pointsRequired: 14,
    aiModifierBonus: -0.005
  },
  {
    id: 'chassis_t2_stiffness',
    name: 'Chassis Stiffness Package',
    area: 'chassis',
    tier: 2,
    description: 'Increased torsional stiffness for predictable handling',
    researchCost: 28000,
    pointsRequired: 28,
    aiModifierBonus: -0.01,
    prerequisiteId: 'chassis_t1_suspension'
  },
  {
    id: 'chassis_t2_dampers',
    name: 'Advanced Damper System',
    area: 'chassis',
    tier: 2,
    description: 'New damper technology for improved tire life',
    researchCost: 32000,
    pointsRequired: 32,
    aiModifierBonus: -0.008,
    prerequisiteId: 'chassis_t1_weight'
  },
  {
    id: 'chassis_t3_complete',
    name: 'Race-Winning Chassis',
    area: 'chassis',
    tier: 3,
    description: 'Complete chassis optimization package',
    researchCost: 55000,
    pointsRequired: 50,
    aiModifierBonus: -0.015,
    prerequisiteId: 'chassis_t2_stiffness'
  },

  // ============================================
  // POWERTRAIN UPGRADES
  // ============================================
  {
    id: 'power_t1_mapping',
    name: 'Engine Mapping Update',
    area: 'powertrain',
    tier: 1,
    description: 'Optimized engine maps for better driveability',
    researchCost: 10000,
    pointsRequired: 10,
    aiModifierBonus: -0.005
  },
  {
    id: 'power_t1_reliability',
    name: 'Reliability Package',
    area: 'powertrain',
    tier: 1,
    description: 'Improved component reliability',
    researchCost: 16000,
    pointsRequired: 16,
    aiModifierBonus: -0.005
  },
  {
    id: 'power_t2_exhaust',
    name: 'Exhaust System Upgrade',
    area: 'powertrain',
    tier: 2,
    description: 'New exhaust design for increased power',
    researchCost: 25000,
    pointsRequired: 25,
    aiModifierBonus: -0.01,
    prerequisiteId: 'power_t1_mapping'
  },
  {
    id: 'power_t2_cooling',
    name: 'Engine Cooling Upgrade',
    area: 'powertrain',
    tier: 2,
    description: 'Better cooling for sustained high performance',
    researchCost: 30000,
    pointsRequired: 30,
    aiModifierBonus: -0.008,
    prerequisiteId: 'power_t1_reliability'
  },
  {
    id: 'power_t3_complete',
    name: 'Maximum Power Package',
    area: 'powertrain',
    tier: 3,
    description: 'Full powertrain optimization',
    researchCost: 50000,
    pointsRequired: 48,
    aiModifierBonus: -0.015,
    prerequisiteId: 'power_t2_exhaust'
  },

  // ============================================
  // ELECTRONICS UPGRADES
  // ============================================
  {
    id: 'elec_t1_traction',
    name: 'Traction Control Mapping',
    area: 'electronics',
    tier: 1,
    description: 'Improved traction control algorithms',
    researchCost: 8000,
    pointsRequired: 10,
    aiModifierBonus: -0.005
  },
  {
    id: 'elec_t1_launch',
    name: 'Launch Control Update',
    area: 'electronics',
    tier: 1,
    description: 'Better race start procedures',
    researchCost: 12000,
    pointsRequired: 12,
    aiModifierBonus: -0.005
  },
  {
    id: 'elec_t2_wet',
    name: 'Wet Weather Package',
    area: 'electronics',
    tier: 2,
    description: 'Optimized settings for wet conditions',
    researchCost: 22000,
    pointsRequired: 22,
    aiModifierBonus: -0.01,
    prerequisiteId: 'elec_t1_traction'
  },
  {
    id: 'elec_t2_data',
    name: 'Data Analysis System',
    area: 'electronics',
    tier: 2,
    description: 'Advanced telemetry and data systems',
    researchCost: 28000,
    pointsRequired: 28,
    aiModifierBonus: -0.008,
    prerequisiteId: 'elec_t1_launch'
  },
  {
    id: 'elec_t3_complete',
    name: 'Championship Electronics',
    area: 'electronics',
    tier: 3,
    description: 'Complete electronics optimization',
    researchCost: 45000,
    pointsRequired: 45,
    aiModifierBonus: -0.015,
    prerequisiteId: 'elec_t2_wet'
  }
]

// Helper to get upgrades for an area
export function getUpgradesForArea(area: DevelopmentArea): CarUpgrade[] {
  return UPGRADES.filter(u => u.area === area).sort((a, b) => a.tier - b.tier)
}

// Helper to get upgrade by ID
export function getUpgradeById(id: string): CarUpgrade | undefined {
  return UPGRADES.find(u => u.id === id)
}

// ============================================
// BUDGET SYSTEM
// ============================================

export interface DevelopmentBudget {
  seasonTotal: number          // Total budget for the season
  remaining: number            // Remaining budget
  weeklyAllocation: number     // How much to spend per week
  focusArea: DevelopmentArea | 'balanced'  // Where to focus spending
  bonusFromResults: number     // Extra budget from race results
}

// Budget by team tier (season totals)
export const BUDGET_BY_TIER: Record<TeamTier, {
  base: number
  perWin: number
  perPodium: number
  perPoints: number
}> = {
  'entry': { base: 50000, perWin: 2000, perPodium: 1000, perPoints: 100 },
  'amateur': { base: 100000, perWin: 5000, perPodium: 2500, perPoints: 250 },
  'semi-pro': { base: 250000, perWin: 10000, perPodium: 5000, perPoints: 500 },
  'professional': { base: 500000, perWin: 20000, perPodium: 10000, perPoints: 1000 },
  'pro': { base: 800000, perWin: 30000, perPodium: 15000, perPoints: 1500 },
  'elite': { base: 1500000, perWin: 50000, perPodium: 25000, perPoints: 2500 },
  'pinnacle': { base: 2500000, perWin: 100000, perPodium: 50000, perPoints: 5000 }
}

// ============================================
// AI TEAM DEVELOPMENT
// ============================================

export interface AITeamDevelopment {
  teamId: string
  totalPoints: number          // Overall development level (0-100)
  areaPoints: Record<DevelopmentArea, number>  // Points per area
  developmentRate: number      // Weekly development rate
  lastUpdateWeek: number
  seasonStartPoints: number    // Points at start of season (for comparison)
}

// Development rates by team budget level
export const AI_DEVELOPMENT_RATES: Record<string, { min: number; max: number }> = {
  'factory': { min: 1.2, max: 1.8 },      // Factory teams develop fastest
  'high': { min: 0.9, max: 1.3 },         // Well-funded teams
  'medium': { min: 0.5, max: 0.9 },       // Mid-budget teams
  'low': { min: 0.2, max: 0.5 }           // Small teams develop slowly
}

// ============================================
// ENHANCED EVENTS
// ============================================

export type DevelopmentEventType = 
  | 'breakthrough'       // Major positive development
  | 'setback'           // Development problem
  | 'supplier_issue'    // Cost increase
  | 'engineer_insight'  // Efficiency bonus
  | 'wind_tunnel'       // Special discovery
  | 'rival_upgrade'     // Rival team brings upgrade
  | 'regulation_change' // Rules change affects development

export interface TeamDevelopmentEvent {
  id: string
  type: DevelopmentEventType
  title: string
  description: string
  area?: DevelopmentArea
  effects: DevelopmentEventEffect[]
  week: number
  year: number
  teamId?: string        // For AI team events
  isPlayerTeam: boolean
}

export interface DevelopmentEventEffect {
  type: 'points' | 'cost' | 'efficiency' | 'ai_modifier' | 'budget'
  area?: DevelopmentArea
  value: number
  duration?: number      // Weeks the effect lasts (for temporary effects)
}

// Event templates
export const EVENT_TEMPLATES: Record<DevelopmentEventType, {
  positive: boolean
  probability: number    // Base probability per week
  templates: Array<{
    title: string
    description: string
    effects: DevelopmentEventEffect[]
  }>
}> = {
  breakthrough: {
    positive: true,
    probability: 0.06,
    templates: [
      {
        title: 'Wind Tunnel Breakthrough!',
        description: 'Engineers discovered a significant aerodynamic improvement.',
        effects: [{ type: 'points', area: 'aerodynamics', value: 8 }]
      },
      {
        title: 'Chassis Optimization Success',
        description: 'New suspension geometry testing exceeded expectations.',
        effects: [{ type: 'points', area: 'chassis', value: 7 }]
      },
      {
        title: 'Power Unit Gains',
        description: 'Engine mapping optimization unlocked extra performance.',
        effects: [{ type: 'points', area: 'powertrain', value: 6 }]
      },
      {
        title: 'Electronics Breakthrough',
        description: 'New software algorithms improving traction significantly.',
        effects: [{ type: 'points', area: 'electronics', value: 7 }]
      }
    ]
  },
  setback: {
    positive: false,
    probability: 0.04,
    templates: [
      {
        title: 'Development Setback',
        description: 'Promising upgrade direction proved to be a dead end.',
        effects: [{ type: 'points', value: -4 }]
      },
      {
        title: 'Testing Issue',
        description: 'Reliability problems discovered during track testing.',
        effects: [{ type: 'points', area: 'powertrain', value: -5 }]
      },
      {
        title: 'Correlation Problems',
        description: 'Wind tunnel data not matching track performance.',
        effects: [{ type: 'points', area: 'aerodynamics', value: -4 }]
      }
    ]
  },
  supplier_issue: {
    positive: false,
    probability: 0.03,
    templates: [
      {
        title: 'Supplier Delays',
        description: 'Key component supplier facing production issues.',
        effects: [{ type: 'cost', value: 1.15 }] // 15% cost increase
      },
      {
        title: 'Material Shortage',
        description: 'Specialized materials in short supply.',
        effects: [{ type: 'cost', value: 1.2 }] // 20% cost increase
      }
    ]
  },
  engineer_insight: {
    positive: true,
    probability: 0.05,
    templates: [
      {
        title: 'Engineer Insight',
        description: 'Lead engineer identified efficiency improvements.',
        effects: [{ type: 'efficiency', value: 1.5, duration: 2 }] // 50% more efficient for 2 weeks
      },
      {
        title: 'Data Mining Success',
        description: 'Historical data analysis revealed optimization opportunities.',
        effects: [{ type: 'efficiency', value: 1.3, duration: 3 }]
      }
    ]
  },
  wind_tunnel: {
    positive: true,
    probability: 0.02,
    templates: [
      {
        title: 'Wind Tunnel Discovery!',
        description: 'Unexpected aerodynamic phenomenon discovered.',
        effects: [
          { type: 'points', area: 'aerodynamics', value: 10 },
          { type: 'ai_modifier', value: -0.005 }
        ]
      }
    ]
  },
  rival_upgrade: {
    positive: false, // Negative for player context (rival gets stronger)
    probability: 0.08,
    templates: [
      {
        title: 'Rival Brings Upgrade',
        description: '{teamName} introduces major upgrade package.',
        effects: [] // Effects handled separately for AI teams
      }
    ]
  },
  regulation_change: {
    positive: false,
    probability: 0.01,
    templates: [
      {
        title: 'Technical Directive',
        description: 'FIA clarification affects current development direction.',
        effects: [{ type: 'points', value: -3 }]
      }
    ]
  }
}

// ============================================
// MAIN STATE TYPE
// ============================================

export interface TeamDevelopmentState {
  // Core development
  areas: DevelopmentAreas
  totalPoints: number          // Sum of all area points (for comparison)
  
  // Budget
  budget: DevelopmentBudget
  
  // Tracking
  lastUpdatedWeek: number
  weeklyGrowthRate: number
  efficiencyModifier: number   // Temporary efficiency bonus from events
  efficiencyExpiresWeek: number
  costModifier: number         // Temporary cost modifier from events
  costExpiresWeek: number
  
  // Legacy milestone system (kept for compatibility)
  milestones: TeamMilestone[]
  
  // Events history
  eventHistory: TeamDevelopmentEvent[]
}

export interface TeamMilestone {
  id: string
  name: string
  description: string
  pointsRequired: number
  achieved: boolean
  achievedWeek?: number
  achievedYear?: number
  effects: TeamMilestoneEffect[]
}

export interface TeamMilestoneEffect {
  type: 'ai_modifier' | 'reputation' | 'relationship' | 'unlock'
  target: string
  value: number
}

// ============================================
// CONSTANTS
// ============================================

export const MAX_AREA_POINTS = 100
export const MAX_TOTAL_POINTS = 400  // 100 per area

// Technical feedback effectiveness
export const TECH_FEEDBACK_MULTIPLIER = 0.02  // Higher = more impact from driver skill

// Base development rate per week (without budget)
export const BASE_WEEKLY_RATE = 0.5

// ============================================
// TEAM MILESTONES (Legacy - kept for compatibility)
// ============================================

export const TEAM_MILESTONES: Omit<TeamMilestone, 'achieved' | 'achievedWeek' | 'achievedYear'>[] = [
  {
    id: 'first_contribution',
    name: 'First Contribution',
    description: 'Begin contributing to car development',
    pointsRequired: 20,
    effects: [
      { type: 'relationship', target: 'teamRelationship', value: 5 },
      { type: 'reputation', target: 'reputation', value: 2 }
    ]
  },
  {
    id: 'development_driver',
    name: 'Development Driver',
    description: 'Recognized for valuable technical input',
    pointsRequired: 50,
    effects: [
      { type: 'ai_modifier', target: 'raceSkill', value: -0.003 },
      { type: 'relationship', target: 'teamRelationship', value: 5 }
    ]
  },
  {
    id: 'technical_leader',
    name: 'Technical Leader',
    description: 'Leading the development direction',
    pointsRequired: 100,
    effects: [
      { type: 'ai_modifier', target: 'qualifyingSkill', value: -0.003 },
      { type: 'reputation', target: 'reputation', value: 5 }
    ]
  },
  {
    id: 'factory_asset',
    name: 'Factory Asset',
    description: 'Key to the team\'s competitive position',
    pointsRequired: 200,
    effects: [
      { type: 'ai_modifier', target: 'raceSkill', value: -0.005 },
      { type: 'unlock', target: 'elite_contracts', value: 1 }
    ]
  },
  {
    id: 'legendary_contributor',
    name: 'Legendary Contributor',
    description: 'Your development work will be remembered for years',
    pointsRequired: 350,
    effects: [
      { type: 'ai_modifier', target: 'raceSkill', value: -0.007 },
      { type: 'ai_modifier', target: 'qualifyingSkill', value: -0.005 },
      { type: 'reputation', target: 'reputation', value: 15 }
    ]
  }
]

// ============================================
// INITIALIZATION FUNCTIONS
// ============================================

/**
 * Create default area progress
 */
function createDefaultAreaProgress(): AreaProgress {
  return {
    points: 0,
    currentUpgradeId: null,
    researchProgress: 0,
    completedUpgrades: []
  }
}

/**
 * Create default development areas
 */
export function createDefaultDevelopmentAreas(): DevelopmentAreas {
  return {
    aerodynamics: createDefaultAreaProgress(),
    chassis: createDefaultAreaProgress(),
    powertrain: createDefaultAreaProgress(),
    electronics: createDefaultAreaProgress()
  }
}

/**
 * Create default budget for a team tier
 */
export function createDefaultBudget(tier: TeamTier): DevelopmentBudget {
  const tierBudget = BUDGET_BY_TIER[tier] || BUDGET_BY_TIER['amateur']
  return {
    seasonTotal: tierBudget.base,
    remaining: tierBudget.base,
    weeklyAllocation: Math.round(tierBudget.base / 40), // ~40 weeks in season
    focusArea: 'balanced',
    bonusFromResults: 0
  }
}

/**
 * Create default team development state
 */
export function createDefaultTeamDevelopmentState(tier: TeamTier = 'amateur'): TeamDevelopmentState {
  return {
    areas: createDefaultDevelopmentAreas(),
    totalPoints: 0,
    budget: createDefaultBudget(tier),
    lastUpdatedWeek: 0,
    weeklyGrowthRate: 0,
    efficiencyModifier: 1,
    efficiencyExpiresWeek: 0,
    costModifier: 1,
    costExpiresWeek: 0,
    milestones: TEAM_MILESTONES.map(m => ({
      ...m,
      achieved: false
    })),
    eventHistory: []
  }
}

/**
 * Create AI team development state
 */
export function createAITeamDevelopment(
  teamId: string,
  budget: 'low' | 'medium' | 'high' | 'factory',
  startingPoints: number = 0
): AITeamDevelopment {
  const rates = AI_DEVELOPMENT_RATES[budget] || AI_DEVELOPMENT_RATES['medium']
  const rate = rates.min + Math.random() * (rates.max - rates.min)
  
  // Distribute starting points across areas
  const perArea = startingPoints / 4
  
  return {
    teamId,
    totalPoints: startingPoints,
    areaPoints: {
      aerodynamics: perArea,
      chassis: perArea,
      powertrain: perArea,
      electronics: perArea
    },
    developmentRate: rate,
    lastUpdateWeek: 0,
    seasonStartPoints: startingPoints
  }
}

// ============================================
// MORALE & MEDIA MODIFIERS FOR DEVELOPMENT
// ============================================

/**
 * Morale modifiers that affect development speed
 */
export interface MoraleModifiers {
  teamMorale: number       // 0-100, team staff morale
  driverMorale: number     // 0-100, hired driver morale  
  boardMood: number        // 0-100, board satisfaction
  controversyCount: number // Number of active controversies
  missedDuties: number     // Media duties missed this season
}

/**
 * Calculate the morale efficiency multiplier
 * High morale = faster development, low morale = slower development
 */
export function calculateMoraleEfficiency(morale: MoraleModifiers): {
  multiplier: number
  breakdown: {
    teamMoraleEffect: number
    driverMoraleEffect: number
    boardMoodEffect: number
    controversyPenalty: number
    mediaPenalty: number
  }
} {
  // Team morale is the primary factor (30% weight)
  // Baseline is 50 morale = 1.0x efficiency
  // 100 morale = 1.15x (15% boost)
  // 0 morale = 0.7x (30% penalty)
  const teamMoraleEffect = 0.7 + (morale.teamMorale / 100) * 0.45
  
  // Driver morale affects development feedback (15% weight)
  // Good driver morale improves technical feedback integration
  const driverMoraleEffect = 0.85 + (morale.driverMorale / 100) * 0.3
  
  // Board mood affects budget releases (15% weight)
  // Happy board = more resources, unhappy = restricted
  const boardMoodEffect = 0.85 + (morale.boardMood / 100) * 0.3
  
  // Controversy penalty - each active controversy hurts focus
  // -5% per controversy, capped at -20%
  const controversyPenalty = Math.max(0.8, 1 - (morale.controversyCount * 0.05))
  
  // Missed media duties hurt team reputation and sponsor support
  // -3% per missed duty, capped at -15%
  const mediaPenalty = Math.max(0.85, 1 - (morale.missedDuties * 0.03))
  
  // Combined multiplier (multiplicative stacking)
  // At perfect conditions (100 all, 0 controversies, 0 missed): 1.15 * 1.15 * 1.15 * 1.0 * 1.0 = ~1.52
  // At terrible conditions (0 all, 4 controversies, 5 missed): 0.7 * 0.85 * 0.85 * 0.8 * 0.85 = ~0.34
  // This creates significant swing but not overwhelming
  const weightedMultiplier = (
    (teamMoraleEffect * 0.35) +      // 35% weight
    (driverMoraleEffect * 0.2) +     // 20% weight
    (boardMoodEffect * 0.2) +        // 20% weight
    (controversyPenalty * 0.15) +    // 15% weight
    (mediaPenalty * 0.1)             // 10% weight
  )
  
  // Final multiplier clamped to reasonable range (0.5x to 1.3x)
  const multiplier = Math.max(0.5, Math.min(1.3, weightedMultiplier))
  
  return {
    multiplier,
    breakdown: {
      teamMoraleEffect: teamMoraleEffect - 1, // Show as +/- percentage
      driverMoraleEffect: driverMoraleEffect - 1,
      boardMoodEffect: boardMoodEffect - 1,
      controversyPenalty: controversyPenalty - 1,
      mediaPenalty: mediaPenalty - 1
    }
  }
}

/**
 * Get development efficiency description for UI
 */
export function getMoraleEfficiencyStatus(multiplier: number): {
  status: string
  color: string
  icon: string
} {
  if (multiplier >= 1.2) return { status: 'Excellent Focus', color: 'text-green-400', icon: '🚀' }
  if (multiplier >= 1.1) return { status: 'High Motivation', color: 'text-green-500', icon: '⬆️' }
  if (multiplier >= 1.0) return { status: 'Normal Operations', color: 'text-blue-400', icon: '➡️' }
  if (multiplier >= 0.9) return { status: 'Slight Distraction', color: 'text-yellow-400', icon: '⚠️' }
  if (multiplier >= 0.75) return { status: 'Poor Morale', color: 'text-orange-400', icon: '⬇️' }
  return { status: 'Critical Issues', color: 'text-red-400', icon: '🔻' }
}

// ============================================
// CORE DEVELOPMENT FUNCTIONS
// ============================================

/**
 * Calculate weekly development points for player
 * Now includes morale modifiers from media system
 */
export function calculateWeeklyDevelopment(
  state: TeamDevelopmentState,
  technicalFeedback: number,
  currentWeek: number,
  moraleModifiers?: MoraleModifiers
): {
  basePoints: number
  efficiencyBonus: number
  moraleModifier: number
  totalPoints: number
} {
  // Base rate from budget spent
  const budgetFactor = state.budget.weeklyAllocation / 10000 // $10k = 1 point
  
  // Technical feedback bonus (0-100 stat)
  const techBonus = technicalFeedback * TECH_FEEDBACK_MULTIPLIER
  
  // Apply efficiency modifier (from events)
  const efficiency = currentWeek < state.efficiencyExpiresWeek 
    ? state.efficiencyModifier 
    : 1
  
  // Calculate morale modifier
  let moraleMultiplier = 1.0
  if (moraleModifiers) {
    const moraleResult = calculateMoraleEfficiency(moraleModifiers)
    moraleMultiplier = moraleResult.multiplier
  }
  
  const basePoints = BASE_WEEKLY_RATE + budgetFactor
  const efficiencyBonus = basePoints * (efficiency - 1)
  const preMoralePoints = basePoints + efficiencyBonus + techBonus
  const totalPoints = preMoralePoints * moraleMultiplier
  
  return {
    basePoints,
    efficiencyBonus,
    moraleModifier: moraleMultiplier - 1, // Show as +/- percentage
    totalPoints: Math.max(0, totalPoints)
  }
}

/**
 * Apply weekly development to state
 * Now accepts optional morale modifiers, facility levels, and staff bonuses
 * 
 * @param state - Current development state
 * @param technicalFeedback - Driver's technical feedback stat (0-100)
 * @param currentWeek - Current game week
 * @param currentYear - Current game year
 * @param moraleModifiers - Optional morale modifiers from team management
 * @param facilityLevels - Optional facility levels (1-5 for each facility type)
 * @param staffBonuses - Optional staff effectiveness bonuses per facility (0.0 - 0.25+)
 */
export function applyWeeklyDevelopment(
  state: TeamDevelopmentState,
  technicalFeedback: number,
  currentWeek: number,
  currentYear: number,
  moraleModifiers?: MoraleModifiers,
  facilityLevels?: Record<FacilityType, number>,
  staffBonuses?: Record<FacilityType, number>
): {
  newState: TeamDevelopmentState
  pointsGained: Record<DevelopmentArea, number>
  completedUpgrades: CarUpgrade[]
  events: TeamDevelopmentEvent[]
  newMilestones: TeamMilestone[]
  moraleImpact: number
  facilityBonuses?: Record<DevelopmentArea, number>
  staffBonusesApplied?: Record<DevelopmentArea, number>
} {
  const development = calculateWeeklyDevelopment(state, technicalFeedback, currentWeek, moraleModifiers)
  const pointsGained: Record<DevelopmentArea, number> = {
    aerodynamics: 0,
    chassis: 0,
    powertrain: 0,
    electronics: 0
  }
  
  // Track facility bonuses for UI display
  const facilityBonuses: Record<DevelopmentArea, number> = {
    aerodynamics: 0,
    chassis: 0,
    powertrain: 0,
    electronics: 0
  }
  
  // Track staff bonuses for UI display
  const staffBonusesApplied: Record<DevelopmentArea, number> = {
    aerodynamics: 0,
    chassis: 0,
    powertrain: 0,
    electronics: 0
  }
  
  const completedUpgrades: CarUpgrade[] = []
  const events: TeamDevelopmentEvent[] = []
  const newMilestones: TeamMilestone[] = []
  
  // Distribute points based on focus
  const areas: DevelopmentArea[] = ['aerodynamics', 'chassis', 'powertrain', 'electronics']
  let newAreas = { ...state.areas }
  
  // Apply development speed perks per area
  const applyAreaPerk = (area: DevelopmentArea, points: number): number => {
    if (area === 'aerodynamics') return applyAeroDevPerk(points * 100) / 100 // Scale for perk function
    if (area === 'chassis') return applyChassisDevPerk(points * 100) / 100
    if (area === 'powertrain') return applyReliabilityPerk(points * 100) / 100 // Reliability perk boosts powertrain dev
    return points
  }
  
  if (state.budget.focusArea === 'balanced') {
    // Split evenly
    const perArea = development.totalPoints / 4
    areas.forEach(area => {
      pointsGained[area] = applyAreaPerk(area, perArea)
    })
  } else {
    // Focus area gets 60%, others split 40%
    const focusPoints = development.totalPoints * 0.6
    const otherPoints = development.totalPoints * 0.4 / 3
    
    areas.forEach(area => {
      const base = area === state.budget.focusArea ? focusPoints : otherPoints
      pointsGained[area] = applyAreaPerk(area, base)
    })
  }
  
  // Apply facility bonuses to each development area
  if (facilityLevels) {
    // Convert facility levels to the format expected by getCombinedRdBonus
    const facilitiesForBonus: Record<FacilityType, number> = {
      aero: facilityLevels.aero || 1,
      chassis: facilityLevels.chassis || 1,
      engine: facilityLevels.engine || 1,
      sim: facilityLevels.sim || 1,
      manufacturing: facilityLevels.manufacturing || 1,
      marketing: facilityLevels.marketing || 1
    }
    
    areas.forEach(area => {
      const bonus = getCombinedRdBonus(area, facilitiesForBonus)
      // Apply bonus to points gained
      const basePoints = pointsGained[area]
      const bonusPoints = basePoints * (bonus - 1)
      pointsGained[area] = basePoints + bonusPoints
      facilityBonuses[area] = bonus - 1 // Store as percentage (0.1 = 10%)
    })
  }
  
  // Apply staff effectiveness bonuses to each development area
  // Staff assigned to R&D facilities provide additional bonuses
  if (staffBonuses) {
    // Map facilities to development areas
    const facilityToArea: Record<string, DevelopmentArea> = {
      aero: 'aerodynamics',
      chassis: 'chassis',
      engine: 'powertrain',
      sim: 'electronics'
    }
    
    // Apply staff bonuses from their respective facilities
    for (const [facility, bonus] of Object.entries(staffBonuses)) {
      const devArea = facilityToArea[facility]
      if (devArea && bonus > 0) {
        const basePoints = pointsGained[devArea]
        const staffBonus = basePoints * bonus
        pointsGained[devArea] = basePoints + staffBonus
        staffBonusesApplied[devArea] = bonus // Store for UI display
      }
    }
  }
  
  // Calculate manufacturing speed bonus (faster upgrade completion)
  // Manufacturing level reduces the effective "points required" for upgrades
  // Level 1 = 1.0x (no bonus), Level 5 = ~0.7x (30% faster)
  const manufacturingBonus = facilityLevels 
    ? getManufacturingSpeedBonus(facilityLevels.manufacturing || 1)
    : 1.0
  
  // Apply points to each area and check upgrade progress
  areas.forEach(area => {
    const currentArea = newAreas[area]
    const gained = pointsGained[area]
    
    const newPoints = Math.min(MAX_AREA_POINTS, currentArea.points + gained)
    
    // Check for upgrade completion
    if (currentArea.currentUpgradeId) {
      const upgrade = getUpgradeById(currentArea.currentUpgradeId)
      if (upgrade) {
        // Apply manufacturing bonus - effectively reduces points required
        // by making our progress "worth more"
        const effectiveGain = gained / manufacturingBonus
        const newProgress = currentArea.researchProgress + effectiveGain
        
        if (newProgress >= upgrade.pointsRequired) {
          // Upgrade complete!
          completedUpgrades.push(upgrade)
          newAreas = {
            ...newAreas,
            [area]: {
              ...currentArea,
              points: newPoints,
              currentUpgradeId: null,
              researchProgress: 0,
              completedUpgrades: [...currentArea.completedUpgrades, upgrade.id]
            }
          }
        } else {
          newAreas = {
            ...newAreas,
            [area]: {
              ...currentArea,
              points: newPoints,
              researchProgress: newProgress
            }
          }
        }
      }
    } else {
      newAreas = {
        ...newAreas,
        [area]: {
          ...currentArea,
          points: newPoints
        }
      }
    }
  })
  
  // Calculate new total points
  const newTotalPoints = Object.values(newAreas).reduce((sum, a) => sum + a.points, 0)
  
  // Check for milestones
  const updatedMilestones = state.milestones.map(milestone => {
    if (!milestone.achieved && newTotalPoints >= milestone.pointsRequired) {
      const achieved: TeamMilestone = {
        ...milestone,
        achieved: true,
        achievedWeek: currentWeek,
        achievedYear: currentYear
      }
      newMilestones.push(achieved)
      return achieved
    }
    return milestone
  })
  
  // Generate random events (15% chance)
  const event = generateDevelopmentEvent(state, currentWeek, currentYear)
  if (event) {
    events.push(event)
  }
  
  // Deduct budget
  const newRemaining = Math.max(0, state.budget.remaining - state.budget.weeklyAllocation)
  
  return {
    newState: {
      ...state,
      areas: newAreas,
      totalPoints: newTotalPoints,
      budget: {
        ...state.budget,
        remaining: newRemaining
      },
      lastUpdatedWeek: currentWeek,
      weeklyGrowthRate: development.totalPoints,
      milestones: updatedMilestones,
      eventHistory: [...state.eventHistory, ...events]
    },
    pointsGained,
    completedUpgrades,
    events,
    newMilestones,
    moraleImpact: development.moraleModifier,
    facilityBonuses: facilityLevels ? facilityBonuses : undefined,
    staffBonusesApplied: staffBonuses ? staffBonusesApplied : undefined
  }
}

/**
 * Start researching an upgrade
 */
export function startUpgradeResearch(
  state: TeamDevelopmentState,
  upgradeId: string
): TeamDevelopmentState | null {
  const upgrade = getUpgradeById(upgradeId)
  if (!upgrade) return null
  
  const area = state.areas[upgrade.area]
  
  // Check if already researching something in this area
  if (area.currentUpgradeId) return null
  
  // Check if already completed
  if (area.completedUpgrades.includes(upgradeId)) return null
  
  // Check prerequisite
  if (upgrade.prerequisiteId && !area.completedUpgrades.includes(upgrade.prerequisiteId)) {
    return null
  }
  
  // Check budget
  const effectiveCost = upgrade.researchCost * state.costModifier
  if (state.budget.remaining < effectiveCost) return null
  
  return {
    ...state,
    areas: {
      ...state.areas,
      [upgrade.area]: {
        ...area,
        currentUpgradeId: upgradeId,
        researchProgress: 0
      }
    },
    budget: {
      ...state.budget,
      remaining: state.budget.remaining - effectiveCost
    }
  }
}

/**
 * Set development focus area
 */
export function setDevelopmentFocus(
  state: TeamDevelopmentState,
  focus: DevelopmentArea | 'balanced'
): TeamDevelopmentState {
  return {
    ...state,
    budget: {
      ...state.budget,
      focusArea: focus
    }
  }
}

/**
 * Set weekly budget allocation
 */
export function setWeeklyAllocation(
  state: TeamDevelopmentState,
  amount: number
): TeamDevelopmentState {
  // Cap at remaining budget / remaining weeks or a reasonable max
  const maxAllocation = Math.min(state.budget.remaining, state.budget.seasonTotal / 10)
  const allocation = Math.max(0, Math.min(maxAllocation, amount))
  
  return {
    ...state,
    budget: {
      ...state.budget,
      weeklyAllocation: allocation
    }
  }
}

/**
 * Add bonus budget from race results
 */
export function addResultBonus(
  state: TeamDevelopmentState,
  tier: TeamTier,
  wins: number,
  podiums: number,
  pointsFinishes: number
): TeamDevelopmentState {
  const tierBudget = BUDGET_BY_TIER[tier] || BUDGET_BY_TIER['amateur']
  
  const bonus = (wins * tierBudget.perWin) +
                (podiums * tierBudget.perPodium) +
                (pointsFinishes * tierBudget.perPoints)
  
  return {
    ...state,
    budget: {
      ...state.budget,
      remaining: state.budget.remaining + bonus,
      bonusFromResults: state.budget.bonusFromResults + bonus
    }
  }
}

// ============================================
// AI TEAM DEVELOPMENT FUNCTIONS
// ============================================

/**
 * Update AI team development for one week
 */
export function updateAITeamDevelopment(
  aiTeam: AITeamDevelopment,
  currentWeek: number
): {
  newState: AITeamDevelopment
  pointsGained: number
  event: TeamDevelopmentEvent | null
} {
  // Random focus area for this week
  const areas: DevelopmentArea[] = ['aerodynamics', 'chassis', 'powertrain', 'electronics']
  const focusArea = areas[Math.floor(Math.random() * areas.length)]
  
  // Calculate points (with some randomness)
  const variance = 0.8 + Math.random() * 0.4 // 80% to 120%
  const basePoints = aiTeam.developmentRate * variance
  
  // Apply points (60% to focus, 40% split among others)
  const focusPoints = basePoints * 0.6
  const otherPoints = basePoints * 0.4 / 3
  
  const newAreaPoints = { ...aiTeam.areaPoints }
  areas.forEach(area => {
    const gain = area === focusArea ? focusPoints : otherPoints
    newAreaPoints[area] = Math.min(MAX_AREA_POINTS, newAreaPoints[area] + gain)
  })
  
  const newTotalPoints = Object.values(newAreaPoints).reduce((sum, p) => sum + p, 0)
  
  // Check for breakthrough/setback events (5% chance)
  let event: TeamDevelopmentEvent | null = null
  if (Math.random() < 0.05) {
    const isPositive = Math.random() < 0.6 // 60% positive
    if (isPositive) {
      const bonusPoints = 3 + Math.random() * 5
      newAreaPoints[focusArea] = Math.min(MAX_AREA_POINTS, newAreaPoints[focusArea] + bonusPoints)
      event = {
        id: `ai_breakthrough_${aiTeam.teamId}_${currentWeek}`,
        type: 'rival_upgrade',
        title: 'Rival Breakthrough',
        description: `Major development progress in ${AREA_EFFECTS[focusArea].name}`,
        area: focusArea,
        effects: [],
        week: currentWeek,
        year: 0,
        teamId: aiTeam.teamId,
        isPlayerTeam: false
      }
    } else {
      const lossPoints = 2 + Math.random() * 3
      newAreaPoints[focusArea] = Math.max(0, newAreaPoints[focusArea] - lossPoints)
    }
  }
  
  return {
    newState: {
      ...aiTeam,
      totalPoints: newTotalPoints,
      areaPoints: newAreaPoints,
      lastUpdateWeek: currentWeek
    },
    pointsGained: basePoints,
    event
  }
}

/**
 * Reset AI team development for new season
 */
export function resetAITeamForSeason(aiTeam: AITeamDevelopment): AITeamDevelopment {
  // Keep 25% of development (teams retain some knowledge)
  const retentionRate = 0.25
  
  const newAreaPoints: Record<DevelopmentArea, number> = {
    aerodynamics: aiTeam.areaPoints.aerodynamics * retentionRate,
    chassis: aiTeam.areaPoints.chassis * retentionRate,
    powertrain: aiTeam.areaPoints.powertrain * retentionRate,
    electronics: aiTeam.areaPoints.electronics * retentionRate
  }
  
  const newTotal = Object.values(newAreaPoints).reduce((sum, p) => sum + p, 0)
  
  return {
    ...aiTeam,
    totalPoints: newTotal,
    areaPoints: newAreaPoints,
    lastUpdateWeek: 0,
    seasonStartPoints: newTotal
  }
}

// ============================================
// EVENT GENERATION
// ============================================

/**
 * Generate a random development event
 */
export function generateDevelopmentEvent(
  _state: TeamDevelopmentState,
  currentWeek: number,
  currentYear: number
): TeamDevelopmentEvent | null {
  // Check each event type
  for (const [type, config] of Object.entries(EVENT_TEMPLATES)) {
    if (Math.random() < config.probability) {
      const template = config.templates[Math.floor(Math.random() * config.templates.length)]
      
      // Determine affected area (if applicable)
      const areas: DevelopmentArea[] = ['aerodynamics', 'chassis', 'powertrain', 'electronics']
      const randomArea = areas[Math.floor(Math.random() * areas.length)]
      
      // Apply area to effects that need it
      const effects = template.effects.map(effect => ({
        ...effect,
        area: effect.area || randomArea
      }))
      
      return {
        id: `${type}_${currentWeek}_${currentYear}_${Math.random().toString(36).substr(2, 9)}`,
        type: type as DevelopmentEventType,
        title: template.title,
        description: template.description,
        area: effects[0]?.area,
        effects,
        week: currentWeek,
        year: currentYear,
        isPlayerTeam: true
      }
    }
  }
  
  return null
}

/**
 * Apply event effects to state
 */
export function applyEventEffects(
  state: TeamDevelopmentState,
  event: TeamDevelopmentEvent,
  currentWeek: number
): TeamDevelopmentState {
  let newState = { ...state }
  
  for (const effect of event.effects) {
    switch (effect.type) {
      case 'points':
        if (effect.area) {
          const area = newState.areas[effect.area]
          newState = {
            ...newState,
            areas: {
              ...newState.areas,
              [effect.area]: {
                ...area,
                points: Math.max(0, Math.min(MAX_AREA_POINTS, area.points + effect.value))
              }
            }
          }
        } else {
          // Apply to all areas equally
          const perArea = effect.value / 4
          const areas: DevelopmentArea[] = ['aerodynamics', 'chassis', 'powertrain', 'electronics']
          areas.forEach(area => {
            const areaState = newState.areas[area]
            newState = {
              ...newState,
              areas: {
                ...newState.areas,
                [area]: {
                  ...areaState,
                  points: Math.max(0, Math.min(MAX_AREA_POINTS, areaState.points + perArea))
                }
              }
            }
          })
        }
        break
        
      case 'efficiency':
        newState = {
          ...newState,
          efficiencyModifier: effect.value,
          efficiencyExpiresWeek: currentWeek + (effect.duration || 1)
        }
        break
        
      case 'cost':
        newState = {
          ...newState,
          costModifier: effect.value,
          costExpiresWeek: currentWeek + (effect.duration || 4)
        }
        break
        
      case 'budget':
        newState = {
          ...newState,
          budget: {
            ...newState.budget,
            remaining: newState.budget.remaining + effect.value
          }
        }
        break
    }
  }
  
  // Update total points
  newState.totalPoints = Object.values(newState.areas).reduce((sum, a) => sum + a.points, 0)
  
  return newState
}

// ============================================
// AI MODIFIER CALCULATION
// ============================================

/**
 * Calculate total AI modifier from team development
 */
export function calculateTeamDevelopmentModifier(state: TeamDevelopmentState): number {
  let modifier = 0
  
  // Add completed upgrade bonuses
  const areas: DevelopmentArea[] = ['aerodynamics', 'chassis', 'powertrain', 'electronics']
  areas.forEach(area => {
    const areaState = state.areas[area]
    areaState.completedUpgrades.forEach(upgradeId => {
      const upgrade = getUpgradeById(upgradeId)
      if (upgrade) {
        modifier += upgrade.aiModifierBonus
      }
    })
  })
  
  // Add milestone bonuses
  for (const milestone of state.milestones) {
    if (milestone.achieved) {
      for (const effect of milestone.effects) {
        if (effect.type === 'ai_modifier') {
          modifier += effect.value
        }
      }
    }
  }
  
  // Cap at reasonable values (-5% to 0%)
  return Math.max(-0.05, Math.min(0, modifier))
}

/**
 * Calculate AI team modifier (makes AI stronger based on their development)
 */
export function calculateAITeamModifier(aiTeam: AITeamDevelopment): number {
  // AI development makes them stronger (positive modifier to their skill)
  // Range: 0 to +5% based on development (matches player's max development advantage)
  // At max development (400 points), AI gets +0.05 to their effective skill
  const developmentFactor = aiTeam.totalPoints / MAX_TOTAL_POINTS
  
  // Also factor in completed upgrades - each upgrade tier adds small bonus
  // Note: AITeamDevelopment doesn't track upgrades, so bonus is 0
  const upgradeBonus = 0
  
  return Math.min(0.05, developmentFactor * 0.04 + upgradeBonus)
}

// ============================================
// SEASON MANAGEMENT
// ============================================

/**
 * Reset development for a new season (partial reset)
 */
export function resetSeasonDevelopment(
  state: TeamDevelopmentState,
  newTier: TeamTier
): TeamDevelopmentState {
  // Keep 30% of development progress
  const retentionRate = 0.3
  
  const newAreas: DevelopmentAreas = {
    aerodynamics: {
      ...state.areas.aerodynamics,
      points: state.areas.aerodynamics.points * retentionRate,
      currentUpgradeId: null,
      researchProgress: 0
      // Keep completed upgrades
    },
    chassis: {
      ...state.areas.chassis,
      points: state.areas.chassis.points * retentionRate,
      currentUpgradeId: null,
      researchProgress: 0
    },
    powertrain: {
      ...state.areas.powertrain,
      points: state.areas.powertrain.points * retentionRate,
      currentUpgradeId: null,
      researchProgress: 0
    },
    electronics: {
      ...state.areas.electronics,
      points: state.areas.electronics.points * retentionRate,
      currentUpgradeId: null,
      researchProgress: 0
    }
  }
  
  const newTotal = Object.values(newAreas).reduce((sum, a) => sum + a.points, 0)
  
  // Reset budget for new season
  const newBudget = createDefaultBudget(newTier)
  
  // Reset milestones below certain threshold
  const resetMilestones = state.milestones.map(m => ({
    ...m,
    achieved: m.achieved && m.pointsRequired >= 100 // Keep high-tier milestones
  }))
  
  return {
    ...state,
    areas: newAreas,
    totalPoints: newTotal,
    budget: newBudget,
    weeklyGrowthRate: 0,
    efficiencyModifier: 1,
    efficiencyExpiresWeek: 0,
    costModifier: 1,
    costExpiresWeek: 0,
    milestones: resetMilestones,
    eventHistory: [] // Clear event history for new season
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get development status description
 */
export function getDevelopmentStatus(totalPoints: number): {
  status: string
  color: string
} {
  const percentage = (totalPoints / MAX_TOTAL_POINTS) * 100
  
  if (percentage >= 80) return { status: 'Championship Contender', color: 'text-accent-gold' }
  if (percentage >= 60) return { status: 'Strong Package', color: 'text-status-success' }
  if (percentage >= 40) return { status: 'Competitive', color: 'text-status-info' }
  if (percentage >= 20) return { status: 'Developing', color: 'text-status-warning' }
  return { status: 'Early Stage', color: 'text-text-muted' }
}

/**
 * Get area status description
 */
export function getAreaStatus(points: number): {
  status: string
  color: string
} {
  if (points >= 80) return { status: 'Elite', color: 'text-accent-gold' }
  if (points >= 60) return { status: 'Advanced', color: 'text-status-success' }
  if (points >= 40) return { status: 'Competitive', color: 'text-status-info' }
  if (points >= 20) return { status: 'Basic', color: 'text-status-warning' }
  return { status: 'Undeveloped', color: 'text-text-muted' }
}

/**
 * Get available upgrades for an area (not started, prerequisites met)
 */
export function getAvailableUpgrades(
  state: TeamDevelopmentState,
  area: DevelopmentArea
): CarUpgrade[] {
  const areaState = state.areas[area]
  const areaUpgrades = getUpgradesForArea(area)
  
  return areaUpgrades.filter(upgrade => {
    // Not already completed
    if (areaState.completedUpgrades.includes(upgrade.id)) return false
    
    // Not currently researching
    if (areaState.currentUpgradeId === upgrade.id) return false
    
    // Prerequisite met (if any)
    if (upgrade.prerequisiteId && !areaState.completedUpgrades.includes(upgrade.prerequisiteId)) {
      return false
    }
    
    return true
  })
}

/**
 * Format budget as currency string
 */
export function formatBudget(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount}`
}
