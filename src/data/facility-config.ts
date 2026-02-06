// ============================================
// FACILITY CONFIGURATION
// ============================================
// Defines upgrade paths, costs, and effects for team facilities

import { TeamTier } from '@/store/rivalStore'
import { applyFacilityCostPerk } from '@/simulation/perkSystem'

// ============================================
// FACILITY TYPES
// ============================================

export type FacilityType = 'aero' | 'chassis' | 'engine' | 'sim' | 'manufacturing' | 'marketing'

export const FACILITY_TYPES: FacilityType[] = ['aero', 'chassis', 'engine', 'sim', 'manufacturing', 'marketing']

export const FACILITY_NAMES: Record<FacilityType, string> = {
  aero: 'Aerodynamics',
  chassis: 'Chassis Engineering',
  engine: 'Power Unit',
  sim: 'Simulator',
  manufacturing: 'Manufacturing',
  marketing: 'Marketing & PR'
}

export const FACILITY_DESCRIPTIONS: Record<FacilityType, string> = {
  aero: 'Wind tunnel and CFD capabilities for aerodynamic development',
  chassis: 'Structural analysis and chassis design facilities',
  engine: 'Power unit development and testing facilities',
  sim: 'Driver-in-the-loop simulator for setup and driver training',
  manufacturing: 'In-house production capabilities for faster part turnaround',
  marketing: 'Marketing operations and sponsor hospitality facilities'
}

export const FACILITY_ICONS: Record<FacilityType, string> = {
  aero: 'Wind',
  chassis: 'Car',
  engine: 'Gauge',
  sim: 'Monitor',
  manufacturing: 'Factory',
  marketing: 'Megaphone'
}

// ============================================
// FACILITY LEVELS
// ============================================

export const MAX_FACILITY_LEVEL = 5
export const MIN_FACILITY_LEVEL = 1

export interface FacilityLevelConfig {
  level: number
  name: string
  description: string
  rdBonus: number           // Multiplier for R&D speed (1.0 = baseline)
  staffSlots: number        // Number of staff that can be assigned
  weeklyMultiplier: number  // Multiplier for base weekly cost
}

export const FACILITY_LEVELS: FacilityLevelConfig[] = [
  {
    level: 1,
    name: 'Basic',
    description: 'Entry-level facilities with minimal capabilities',
    rdBonus: 1.0,
    staffSlots: 1,
    weeklyMultiplier: 1.0
  },
  {
    level: 2,
    name: 'Standard',
    description: 'Improved facilities with better equipment',
    rdBonus: 1.1,
    staffSlots: 1,
    weeklyMultiplier: 1.3
  },
  {
    level: 3,
    name: 'Professional',
    description: 'Professional-grade facilities with modern tools',
    rdBonus: 1.25,
    staffSlots: 2,
    weeklyMultiplier: 1.7
  },
  {
    level: 4,
    name: 'Advanced',
    description: 'State-of-the-art facilities with cutting-edge technology',
    rdBonus: 1.4,
    staffSlots: 2,
    weeklyMultiplier: 2.2
  },
  {
    level: 5,
    name: 'World-Class',
    description: 'The best facilities money can buy - factory team standard',
    rdBonus: 1.6,
    staffSlots: 3,
    weeklyMultiplier: 3.0
  }
]

export function getFacilityLevelConfig(level: number): FacilityLevelConfig {
  const clampedLevel = Math.max(MIN_FACILITY_LEVEL, Math.min(MAX_FACILITY_LEVEL, level))
  return FACILITY_LEVELS[clampedLevel - 1]
}

// ============================================
// UPGRADE COSTS BY TIER
// ============================================

export interface FacilityUpgradeCost {
  baseCost: number          // Base cost for Level 1->2
  levelMultiplier: number   // Cost multiplier per level (compounds)
  duration: number          // Weeks to complete upgrade
}

// Base upgrade costs by team tier
// Higher tiers have higher costs but also higher budgets
export const FACILITY_UPGRADE_COSTS: Record<TeamTier, FacilityUpgradeCost> = {
  entry: {
    baseCost: 15000,
    levelMultiplier: 1.8,
    duration: 4
  },
  amateur: {
    baseCost: 50000,
    levelMultiplier: 1.8,
    duration: 4
  },
  'semi-pro': {
    baseCost: 150000,
    levelMultiplier: 1.9,
    duration: 5
  },
  professional: {
    baseCost: 400000,
    levelMultiplier: 2.0,
    duration: 6
  },
  pro: {
    baseCost: 1000000,
    levelMultiplier: 2.1,
    duration: 7
  },
  elite: {
    baseCost: 3000000,
    levelMultiplier: 2.2,
    duration: 8
  },
  pinnacle: {
    baseCost: 10000000,
    levelMultiplier: 2.3,
    duration: 10
  }
}

/**
 * Calculate the cost to upgrade a facility from current level to next level
 */
export function calculateUpgradeCost(tier: TeamTier, currentLevel: number): number {
  if (currentLevel >= MAX_FACILITY_LEVEL) return 0
  
  const config = FACILITY_UPGRADE_COSTS[tier] || FACILITY_UPGRADE_COSTS['amateur']
  if (!config) return 50000 // Fallback if still undefined
  
  // Cost increases exponentially with level
  // Level 1->2: baseCost
  // Level 2->3: baseCost * levelMultiplier
  // Level 3->4: baseCost * levelMultiplier^2
  // etc.
  const cost = config.baseCost * Math.pow(config.levelMultiplier, currentLevel - 1)
  return Math.round(cost / 1000) * 1000 // Round to nearest 1000
}

/**
 * Calculate the duration (in weeks) for a facility upgrade
 */
export function calculateUpgradeDuration(tier: TeamTier, currentLevel: number): number {
  if (currentLevel >= MAX_FACILITY_LEVEL) return 0
  
  const config = FACILITY_UPGRADE_COSTS[tier] || FACILITY_UPGRADE_COSTS['amateur']
  if (!config) return 4 // Fallback if still undefined
  
  // Duration increases by 1 week per level
  return config.duration + (currentLevel - 1)
}

// ============================================
// WEEKLY OPERATIONAL COSTS
// ============================================

export interface FacilityOperationalCost {
  baseWeeklyCost: number  // Cost per facility at level 1
}

// Base weekly operational cost per facility (at level 1)
// Actual cost = baseWeeklyCost * levelMultiplier * numFacilities
export const FACILITY_OPERATIONAL_COSTS: Record<TeamTier, FacilityOperationalCost> = {
  entry: { baseWeeklyCost: 250 },
  amateur: { baseWeeklyCost: 750 },
  'semi-pro': { baseWeeklyCost: 3000 },
  professional: { baseWeeklyCost: 9000 },
  pro: { baseWeeklyCost: 25000 },
  elite: { baseWeeklyCost: 75000 },
  pinnacle: { baseWeeklyCost: 350000 }
}

/**
 * Calculate weekly operational cost for a single facility
 */
export function calculateFacilityWeeklyCost(tier: TeamTier, level: number): number {
  const baseCost = FACILITY_OPERATIONAL_COSTS[tier].baseWeeklyCost
  const levelConfig = getFacilityLevelConfig(level)
  return Math.round(baseCost * levelConfig.weeklyMultiplier)
}

/**
 * Calculate total weekly operational costs for all facilities
 */
export function calculateTotalFacilityCosts(
  tier: TeamTier,
  facilities: Record<FacilityType, number>
): number {
  let total = 0
  for (const facilityType of FACILITY_TYPES) {
    const level = facilities[facilityType] || 1
    total += calculateFacilityWeeklyCost(tier, level)
  }
  return total
}

// ============================================
// R&D BONUSES
// ============================================

// Mapping of facilities to R&D development areas
export const FACILITY_RD_MAPPING: Record<FacilityType, string[]> = {
  aero: ['aerodynamics'],
  chassis: ['chassis'],
  engine: ['powertrain'],
  sim: ['aerodynamics', 'chassis', 'powertrain', 'electronics'], // Affects all areas
  manufacturing: [], // Affects upgrade completion time, not R&D speed
  marketing: []      // Affects sponsor attraction, not R&D
}

/**
 * Get the R&D speed bonus for a development area based on facility level
 */
export function getFacilityRdBonus(_facilityType: FacilityType, level: number): number {
  const levelConfig = getFacilityLevelConfig(level)
  return levelConfig.rdBonus
}

/**
 * Get the combined R&D bonus for a development area considering all relevant facilities
 * Sim facility provides a smaller bonus (50% of its level bonus) to all areas
 */
export function getCombinedRdBonus(
  developmentArea: string,
  facilities: Record<FacilityType, number>
): number {
  let bonus = 1.0
  
  // Check primary facility for this area
  for (const [facilityType, areas] of Object.entries(FACILITY_RD_MAPPING)) {
    if (areas.includes(developmentArea)) {
      const level = facilities[facilityType as FacilityType] || 1
      const facilityBonus = getFacilityRdBonus(facilityType as FacilityType, level)
      
      if (facilityType === 'sim') {
        // Sim provides 50% of its bonus to all areas
        bonus *= 1 + (facilityBonus - 1) * 0.5
      } else {
        // Primary facilities provide full bonus
        bonus *= facilityBonus
      }
    }
  }
  
  return bonus
}

/**
 * Get manufacturing bonus for upgrade completion time
 * Higher manufacturing level = faster upgrade completion
 */
export function getManufacturingSpeedBonus(manufacturingLevel: number): number {
  const levelConfig = getFacilityLevelConfig(manufacturingLevel)
  // Manufacturing bonus reduces time: Level 1 = 1.0x, Level 5 = 0.7x time
  return 1 - (levelConfig.rdBonus - 1) * 0.5
}

/**
 * Get marketing facility bonus for sponsor attraction
 * Higher marketing level = higher sponsor interest
 */
export function getMarketingBonus(marketingLevel: number): number {
  const levelConfig = getFacilityLevelConfig(marketingLevel)
  return levelConfig.rdBonus
}

// ============================================
// STAFF CONFIGURATION
// ============================================

export interface FacilityStaffRole {
  role: string
  title: string
  description: string
  skillsRequired: ('reliability' | 'strategy' | 'pit' | 'aeroAssist')[]
}

export const FACILITY_STAFF_ROLES: Record<FacilityType, FacilityStaffRole> = {
  aero: {
    role: 'aerodynamicist',
    title: 'Aerodynamicist',
    description: 'Specializes in aerodynamic development and wind tunnel operations',
    skillsRequired: ['reliability', 'aeroAssist']
  },
  chassis: {
    role: 'structural_engineer',
    title: 'Structural Engineer',
    description: 'Focuses on chassis design and structural integrity',
    skillsRequired: ['reliability']
  },
  engine: {
    role: 'power_unit_engineer',
    title: 'Power Unit Engineer',
    description: 'Develops and optimizes power unit performance',
    skillsRequired: ['reliability']
  },
  sim: {
    role: 'simulation_specialist',
    title: 'Simulation Specialist',
    description: 'Operates simulators and analyzes virtual testing data',
    skillsRequired: ['strategy', 'reliability']
  },
  manufacturing: {
    role: 'production_manager',
    title: 'Production Manager',
    description: 'Manages manufacturing processes and part production',
    skillsRequired: ['reliability', 'pit']
  },
  marketing: {
    role: 'marketing_manager',
    title: 'Marketing Manager',
    description: 'Handles marketing campaigns and sponsor relations',
    skillsRequired: ['strategy']
  }
}

/**
 * Calculate staff quality bonus based on assigned staff skills
 * Returns a multiplier between 0.8 (poor staff) and 1.3 (excellent staff)
 */
export function calculateStaffQualityBonus(
  facilityType: FacilityType,
  staffSkills: { reliability: number; strategy: number; pit: number; aeroAssist?: number }[]
): number {
  if (staffSkills.length === 0) return 0.9 // No staff penalty
  
  const roleConfig = FACILITY_STAFF_ROLES[facilityType]
  let totalSkill = 0
  let skillCount = 0
  
  for (const staff of staffSkills) {
    for (const skillName of roleConfig.skillsRequired) {
      const skillValue = staff[skillName] ?? 50
      totalSkill += skillValue
      skillCount++
    }
  }
  
  if (skillCount === 0) return 1.0
  
  const avgSkill = totalSkill / skillCount
  // Map 0-100 skill to 0.8-1.3 multiplier
  return 0.8 + (avgSkill / 100) * 0.5
}

// ============================================
// STAFF SPECIALIZATION BONUSES
// ============================================

import type { StaffSpecialization } from '@/store/careerStore'

// Mapping of specializations to facility bonuses
export const SPECIALIZATION_FACILITY_BONUSES: Record<StaffSpecialization, Partial<Record<FacilityType, number>>> = {
  setup_wizard: { chassis: 0.08, engine: 0.05 },
  pit_master: { manufacturing: 0.10 },
  data_analyst: { sim: 0.15, aero: 0.05 },
  motivator: {},  // Morale effect, not facility
  cost_cutter: { manufacturing: 0.08 },
  talent_scout: {},  // No facility bonus
  media_savvy: { marketing: 0.15 },
  tire_whisperer: { chassis: 0.05 },
  reliability_guru: { engine: 0.12, manufacturing: 0.08 },
  aero_specialist: { aero: 0.20, sim: 0.05 }
}

// Specializations that affect race performance (not facilities)
export const SPECIALIZATION_RACE_BONUSES: Record<StaffSpecialization, {
  pitStopTime?: number      // Negative = faster (good)
  strategyQuality?: number  // Positive = better
  reliability?: number      // Positive = fewer failures
  tireManagement?: number   // Positive = better
  setupSpeed?: number       // Positive = faster setup optimization
}> = {
  setup_wizard: { setupSpeed: 0.15 },
  pit_master: { pitStopTime: -0.10 },
  data_analyst: { strategyQuality: 0.08, setupSpeed: 0.05 },
  motivator: {},
  cost_cutter: {},
  talent_scout: {},
  media_savvy: {},
  tire_whisperer: { tireManagement: 0.10, strategyQuality: 0.05 },
  reliability_guru: { reliability: 0.15 },
  aero_specialist: { setupSpeed: 0.10 }
}

/**
 * Calculate enhanced staff effectiveness bonus including specializations
 * This is the main function to use for facility R&D calculations
 */
export function calculateStaffEffectivenessBonus(
  facilityType: FacilityType,
  staffMembers: Array<{
    skills: { reliability: number; strategy: number; pit: number; aeroAssist?: number }
    specializations?: StaffSpecialization[]
    experience?: number
  }>
): number {
  if (staffMembers.length === 0) return 0
  
  let totalBonus = 0
  
  for (const staff of staffMembers) {
    // Base skill contribution (0-10% per staff based on avg skill)
    const roleConfig = FACILITY_STAFF_ROLES[facilityType]
    let skillTotal = 0
    let skillCount = 0
    
    for (const skillName of roleConfig.skillsRequired) {
      const skillValue = staff.skills[skillName] ?? 50
      skillTotal += skillValue
      skillCount++
    }
    
    const avgSkill = skillCount > 0 ? skillTotal / skillCount : 50
    const baseBonus = (avgSkill / 100) * 0.10
    
    // Experience multiplier (1.0-1.2 based on years)
    const experienceMultiplier = 1.0 + Math.min(0.2, (staff.experience || 0) * 0.01)
    
    // Specialization bonus
    let specBonus = 0
    if (staff.specializations) {
      for (const spec of staff.specializations) {
        const facilityBonuses = SPECIALIZATION_FACILITY_BONUSES[spec]
        if (facilityBonuses && facilityBonuses[facilityType]) {
          specBonus += facilityBonuses[facilityType]!
        }
      }
    }
    
    // Combine: base + spec, multiplied by experience
    totalBonus += (baseBonus + specBonus) * experienceMultiplier
  }
  
  return totalBonus
}

/**
 * Calculate race performance bonuses from all staff
 */
export function calculateStaffRaceBonus(
  staffMembers: Array<{
    skills: { reliability: number; strategy: number; pit: number }
    specializations?: StaffSpecialization[]
  }>
): {
  pitStopBonus: number
  strategyBonus: number
  reliabilityBonus: number
  tireManagementBonus: number
  setupBonus: number
} {
  const result = {
    pitStopBonus: 0,
    strategyBonus: 0,
    reliabilityBonus: 0,
    tireManagementBonus: 0,
    setupBonus: 0
  }
  
  if (staffMembers.length === 0) return result
  
  for (const staff of staffMembers) {
    // Base skill contributions
    result.strategyBonus += (staff.skills.strategy / 100) * 0.05
    result.pitStopBonus += (staff.skills.pit / 100) * 0.03
    result.reliabilityBonus += (staff.skills.reliability / 100) * 0.04
    
    // Specialization bonuses
    if (staff.specializations) {
      for (const spec of staff.specializations) {
        const raceBonus = SPECIALIZATION_RACE_BONUSES[spec]
        if (raceBonus.pitStopTime) result.pitStopBonus += Math.abs(raceBonus.pitStopTime)
        if (raceBonus.strategyQuality) result.strategyBonus += raceBonus.strategyQuality
        if (raceBonus.reliability) result.reliabilityBonus += raceBonus.reliability
        if (raceBonus.tireManagement) result.tireManagementBonus += raceBonus.tireManagement
        if (raceBonus.setupSpeed) result.setupBonus += raceBonus.setupSpeed
      }
    }
  }
  
  // Cap bonuses at reasonable levels
  result.pitStopBonus = Math.min(0.25, result.pitStopBonus)
  result.strategyBonus = Math.min(0.30, result.strategyBonus)
  result.reliabilityBonus = Math.min(0.25, result.reliabilityBonus)
  result.tireManagementBonus = Math.min(0.20, result.tireManagementBonus)
  result.setupBonus = Math.min(0.25, result.setupBonus)
  
  return result
}

// ============================================
// TEAM STAFF ROLE IMPACT CALCULATIONS
// ============================================

import type { TeamStaffRole } from '@/store/careerStore'

/**
 * Role-specific impact on race performance and team operations
 * These bonuses are based on the staff member's skills and apply on top of specialization bonuses
 */
export interface RoleImpactConfig {
  role: TeamStaffRole
  raceBonuses: {
    pitStopTime?: number       // Reduction in pit stop time (negative = faster)
    strategyQuality?: number   // Improvement to race strategy decisions
    reliability?: number       // Reduction in mechanical failures
    tireManagement?: number    // Better tire wear management
    setupSpeed?: number        // Faster car setup optimization
  }
  facilityBonuses: Partial<Record<FacilityType, number>>
  description: string
}

export const TEAM_STAFF_ROLE_IMPACTS: Record<TeamStaffRole, RoleImpactConfig> = {
  chief_engineer: {
    role: 'chief_engineer',
    raceBonuses: {
      setupSpeed: 0.12,
      reliability: 0.05
    },
    facilityBonuses: {
      chassis: 0.10,
      engine: 0.08,
      aero: 0.06
    },
    description: 'Leads car development and race weekend engineering decisions'
  },
  technical_director: {
    role: 'technical_director',
    raceBonuses: {
      setupSpeed: 0.08,
      reliability: 0.03
    },
    facilityBonuses: {
      aero: 0.12,
      chassis: 0.10,
      engine: 0.10,
      sim: 0.05
    },
    description: 'Oversees all technical operations and long-term development strategy'
  },
  strategist: {
    role: 'strategist',
    raceBonuses: {
      strategyQuality: 0.15,
      tireManagement: 0.08
    },
    facilityBonuses: {
      sim: 0.08
    },
    description: 'Plans race strategy, pit stop timing, and tire management'
  },
  team_manager: {
    role: 'team_manager',
    raceBonuses: {},
    facilityBonuses: {
      manufacturing: 0.05
    },
    description: 'Manages day-to-day operations, logistics, and team coordination'
  },
  pr_manager: {
    role: 'pr_manager',
    raceBonuses: {},
    facilityBonuses: {
      marketing: 0.12
    },
    description: 'Handles media relations, sponsor communications, and team image'
  },
  crew_chief: {
    role: 'crew_chief',
    raceBonuses: {
      pitStopTime: -0.12,      // 12% faster pit stops
      reliability: 0.10        // 10% reduction in mechanical failures
    },
    facilityBonuses: {
      manufacturing: 0.08     // Improves part quality and production
    },
    description: 'Leads pit crew operations and ensures car reliability throughout the weekend'
  },
  data_engineer: {
    role: 'data_engineer',
    raceBonuses: {
      setupSpeed: 0.15,        // 15% faster setup optimization
      strategyQuality: 0.06   // Better data-driven strategy decisions
    },
    facilityBonuses: {
      sim: 0.15,              // Major simulator effectiveness boost
      aero: 0.05              // Data insights help aero development
    },
    description: 'Analyzes telemetry data, manages simulation tools, and optimizes car setup'
  },
  reserve_driver: {
    role: 'reserve_driver',
    raceBonuses: {
      setupSpeed: 0.05       // Testing feedback helps setup
    },
    facilityBonuses: {
      sim: 0.08              // Simulator work aids development
    },
    description: 'Backup driver for simulator work and emergency race replacements'
  }
}

/**
 * Calculate the combined race performance impact from all team staff roles
 * Takes into account each staff member's skills and their role-specific bonuses
 */
export function calculateTeamStaffRoleImpact(
  staffMembers: Array<{
    role: TeamStaffRole
    skills: { reliability: number; strategy: number; pit: number; aeroAssist?: number }
    specializations?: StaffSpecialization[]
    experience?: number
  }>
): {
  pitStopBonus: number
  strategyBonus: number
  reliabilityBonus: number
  tireManagementBonus: number
  setupBonus: number
} {
  const result = {
    pitStopBonus: 0,
    strategyBonus: 0,
    reliabilityBonus: 0,
    tireManagementBonus: 0,
    setupBonus: 0
  }
  
  for (const staff of staffMembers) {
    const roleConfig = TEAM_STAFF_ROLE_IMPACTS[staff.role]
    if (!roleConfig) continue
    
    // Calculate skill effectiveness (0.5 to 1.5 multiplier based on avg skill)
    const avgSkill = (staff.skills.reliability + staff.skills.strategy + staff.skills.pit) / 3
    const skillMultiplier = 0.5 + (avgSkill / 100)
    
    // Experience bonus (1.0 to 1.2)
    const expBonus = 1.0 + Math.min(0.2, (staff.experience || 0) * 0.01)
    
    // Apply role-specific race bonuses scaled by skill and experience
    const bonuses = roleConfig.raceBonuses
    if (bonuses.pitStopTime) {
      result.pitStopBonus += Math.abs(bonuses.pitStopTime) * skillMultiplier * expBonus
    }
    if (bonuses.strategyQuality) {
      result.strategyBonus += bonuses.strategyQuality * skillMultiplier * expBonus
    }
    if (bonuses.reliability) {
      result.reliabilityBonus += bonuses.reliability * skillMultiplier * expBonus
    }
    if (bonuses.tireManagement) {
      result.tireManagementBonus += bonuses.tireManagement * skillMultiplier * expBonus
    }
    if (bonuses.setupSpeed) {
      result.setupBonus += bonuses.setupSpeed * skillMultiplier * expBonus
    }
  }
  
  // Cap bonuses at reasonable levels
  result.pitStopBonus = Math.min(0.35, result.pitStopBonus)
  result.strategyBonus = Math.min(0.35, result.strategyBonus)
  result.reliabilityBonus = Math.min(0.30, result.reliabilityBonus)
  result.tireManagementBonus = Math.min(0.25, result.tireManagementBonus)
  result.setupBonus = Math.min(0.40, result.setupBonus)
  
  return result
}

/**
 * Calculate facility effectiveness bonus from team staff roles
 */
export function calculateTeamStaffFacilityBonus(
  facilityType: FacilityType,
  staffMembers: Array<{
    role: TeamStaffRole
    skills: { reliability: number; strategy: number; pit: number; aeroAssist?: number }
    experience?: number
  }>
): number {
  let totalBonus = 0
  
  for (const staff of staffMembers) {
    const roleConfig = TEAM_STAFF_ROLE_IMPACTS[staff.role]
    if (!roleConfig) continue
    
    const facilityBonus = roleConfig.facilityBonuses[facilityType]
    if (!facilityBonus) continue
    
    // Scale by skill effectiveness
    const avgSkill = (staff.skills.reliability + staff.skills.strategy + staff.skills.pit) / 3
    const skillMultiplier = 0.5 + (avgSkill / 100)
    
    // Experience bonus
    const expBonus = 1.0 + Math.min(0.15, (staff.experience || 0) * 0.008)
    
    totalBonus += facilityBonus * skillMultiplier * expBonus
  }
  
  // Cap total bonus at 50%
  return Math.min(0.50, totalBonus)
}

/**
 * Get a summary of what impact a staff role has on the team
 */
export function getRoleImpactSummary(role: TeamStaffRole): {
  description: string
  primaryBonuses: string[]
  facilityEffects: string[]
} {
  const config = TEAM_STAFF_ROLE_IMPACTS[role]
  if (!config) {
    return { description: 'Unknown role', primaryBonuses: [], facilityEffects: [] }
  }
  
  const primaryBonuses: string[] = []
  const bonuses = config.raceBonuses
  
  if (bonuses.pitStopTime) {
    primaryBonuses.push(`${Math.abs(bonuses.pitStopTime * 100).toFixed(0)}% faster pit stops`)
  }
  if (bonuses.strategyQuality) {
    primaryBonuses.push(`+${(bonuses.strategyQuality * 100).toFixed(0)}% strategy quality`)
  }
  if (bonuses.reliability) {
    primaryBonuses.push(`+${(bonuses.reliability * 100).toFixed(0)}% car reliability`)
  }
  if (bonuses.tireManagement) {
    primaryBonuses.push(`+${(bonuses.tireManagement * 100).toFixed(0)}% tire management`)
  }
  if (bonuses.setupSpeed) {
    primaryBonuses.push(`+${(bonuses.setupSpeed * 100).toFixed(0)}% setup optimization`)
  }
  
  const facilityEffects: string[] = []
  for (const [facility, bonus] of Object.entries(config.facilityBonuses)) {
    if (bonus && bonus > 0) {
      facilityEffects.push(`+${(bonus * 100).toFixed(0)}% ${FACILITY_NAMES[facility as FacilityType]} effectiveness`)
    }
  }
  
  return {
    description: config.description,
    primaryBonuses,
    facilityEffects
  }
}

/**
 * Calculate team morale bonus from staff personalities and traits
 */
export function calculateStaffMoraleContribution(
  staffMembers: Array<{
    specializations?: StaffSpecialization[]
    morale?: number
  }>
): number {
  if (staffMembers.length === 0) return 0
  
  let moraleBonus = 0
  
  for (const staff of staffMembers) {
    // Staff morale affects team morale slightly
    const staffMorale = staff.morale ?? 50
    moraleBonus += (staffMorale - 50) / 100 * 2  // -1 to +1 per staff
    
    // Motivator specialization adds flat bonus
    if (staff.specializations?.includes('motivator')) {
      moraleBonus += 5
    }
  }
  
  return Math.round(moraleBonus)
}

// ============================================
// UPGRADE REQUIREMENTS
// ============================================

export interface FacilityUpgradeRequirement {
  minTeamReputation?: number
  minTier?: TeamTier
  prerequisiteFacility?: { type: FacilityType; minLevel: number }
}

// Requirements to unlock certain facility levels
export const FACILITY_UPGRADE_REQUIREMENTS: Record<number, FacilityUpgradeRequirement> = {
  2: {}, // No requirements for Level 2
  3: { minTeamReputation: 30 },
  4: { minTeamReputation: 50 },
  5: { minTeamReputation: 70, minTier: 'professional' }
}

/**
 * Check if a facility upgrade is allowed
 */
export function canUpgradeFacility(
  _facilityType: FacilityType,
  currentLevel: number,
  teamReputation: number,
  teamTier: TeamTier,
  facilities: Record<FacilityType, number>
): { allowed: boolean; reason?: string } {
  if (currentLevel >= MAX_FACILITY_LEVEL) {
    return { allowed: false, reason: 'Facility already at maximum level' }
  }
  
  const targetLevel = currentLevel + 1
  const requirements = FACILITY_UPGRADE_REQUIREMENTS[targetLevel]
  
  if (!requirements) {
    return { allowed: true }
  }
  
  if (requirements.minTeamReputation && teamReputation < requirements.minTeamReputation) {
    return { 
      allowed: false, 
      reason: `Requires team reputation of ${requirements.minTeamReputation} (current: ${teamReputation})` 
    }
  }
  
  if (requirements.minTier) {
    const tierOrder: TeamTier[] = ['entry', 'amateur', 'semi-pro', 'professional', 'pro', 'elite', 'pinnacle']
    const currentTierIndex = tierOrder.indexOf(teamTier)
    const requiredTierIndex = tierOrder.indexOf(requirements.minTier)
    
    if (currentTierIndex < requiredTierIndex) {
      return { 
        allowed: false, 
        reason: `Requires team tier of ${requirements.minTier} or higher` 
      }
    }
  }
  
  if (requirements.prerequisiteFacility) {
    const prereqLevel = facilities[requirements.prerequisiteFacility.type] || 1
    if (prereqLevel < requirements.prerequisiteFacility.minLevel) {
      return {
        allowed: false,
        reason: `Requires ${FACILITY_NAMES[requirements.prerequisiteFacility.type]} at level ${requirements.prerequisiteFacility.minLevel}`
      }
    }
  }
  
  return { allowed: true }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a summary of facility stats for display
 */
export function getFacilitySummary(
  facilityType: FacilityType,
  level: number,
  tier: TeamTier
): {
  name: string
  level: number
  levelName: string
  description: string
  rdBonus: number
  staffSlots: number
  weeklyCost: number
  upgradeCost: number
  upgradeDuration: number
  canUpgrade: boolean
} {
  const levelConfig = getFacilityLevelConfig(level)
  const canUpgrade = level < MAX_FACILITY_LEVEL
  
  return {
    name: FACILITY_NAMES[facilityType],
    level,
    levelName: levelConfig.name,
    description: levelConfig.description,
    rdBonus: levelConfig.rdBonus,
    staffSlots: levelConfig.staffSlots,
    weeklyCost: calculateFacilityWeeklyCost(tier, level),
    upgradeCost: canUpgrade ? calculateUpgradeCost(tier, level) : 0,
    upgradeDuration: canUpgrade ? calculateUpgradeDuration(tier, level) : 0,
    canUpgrade
  }
}

/**
 * Create default facility levels (all at level 1)
 */
export function createDefaultFacilityLevels(): Record<FacilityType, number> {
  return {
    aero: 1,
    chassis: 1,
    engine: 1,
    sim: 1,
    manufacturing: 1,
    marketing: 1
  }
}

// ============================================
// HELPER ALIASES (for backwards compatibility)
// ============================================

/**
 * Calculate upgrade cost with facility-specific variation
 */
export function calculateFacilityUpgradeCost(
  facilityType: FacilityType, 
  currentLevel: number, 
  tier: TeamTier
): number {
  // Add slight variation based on facility type
  const baseCost = calculateUpgradeCost(tier, currentLevel)
  const facilityMultipliers: Record<FacilityType, number> = {
    aero: 1.1,      // Wind tunnels are expensive
    chassis: 1.0,
    engine: 1.15,   // Engine facilities most expensive
    sim: 0.9,       // Software-heavy, slightly cheaper
    manufacturing: 1.05,
    marketing: 0.85  // Marketing is cheaper to upgrade
  }
  const rawCost = Math.round(baseCost * facilityMultipliers[facilityType])
  return applyFacilityCostPerk(rawCost)
}

/**
 * Get upgrade duration for a facility
 */
export function getUpgradeDuration(
  facilityType: FacilityType, 
  currentLevel: number
): number {
  // Base duration plus small variation
  const baseDuration = Math.max(2, 2 + Math.floor(currentLevel / 2))
  const facilityAdditions: Record<FacilityType, number> = {
    aero: 1,        // Wind tunnels take time
    chassis: 0,
    engine: 1,      // Complex machinery
    sim: 0,         // Quick to install
    manufacturing: 0,
    marketing: 0
  }
  return baseDuration + facilityAdditions[facilityType]
}

/**
 * Get the number of staff slots for a facility based on its level
 */
export function getFacilityStaffSlots(level: number): number {
  // Level 1: 1 slot, Level 2: 1 slot, Level 3: 2 slots, Level 4: 2 slots, Level 5: 3 slots
  return Math.floor((level + 1) / 2)
}

/**
 * Get facility R&D bonus (alias for getFacilityRdBonus)
 */
export function getFacilityRDBonus(level: number): number {
  return getFacilityRdBonus('aero', level) // Uses generic calculation
}

/**
 * Calculate total weekly facility costs
 */
export function calculateTotalFacilityWeeklyCosts(
  facilities: Record<FacilityType, { level: number; upgradeInProgress?: boolean }>,
  tier: TeamTier
): number {
  let total = 0
  for (const facilityType of FACILITY_TYPES) {
    const facility = facilities[facilityType]
    if (facility) {
      total += calculateFacilityWeeklyCost(tier, facility.level)
      // Add extra cost for ongoing upgrades
      if (facility.upgradeInProgress) {
        total += calculateFacilityWeeklyCost(tier, facility.level) * 0.2
      }
    }
  }
  return Math.round(total)
}

/**
 * Get all facility types
 */
export function getAllFacilityTypes(): FacilityType[] {
  return [...FACILITY_TYPES]
}
