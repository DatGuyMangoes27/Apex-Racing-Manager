// ============================================
// FACILITY & TEAM STAFF CONFIGURATION
// ============================================
// Defines staff types, skills, salaries, and generation for both:
// - Facility personnel (work at factory/HQ on R&D)
// - Team/Race staff (travel to races and manage race operations)

import { TeamTier } from '@/store/rivalStore'
import { FacilityType } from './facility-config'
import { pickNationality, pickGender, generateStaffName } from './staff-names'
import { getPortraitIdByGender } from '@/utils/generated-assets'
import {
  getRandomStaff,
  getPreGenPortrait,
  isContentLoaded,
  getStaffById as preGenGetStaffById,
  getStaffByName as preGenGetStaffByName,
  type PreGenStaffProfile
} from '@/services/preGeneratedContentService'

// ============================================
// STAFF ROLES
// ============================================

// Facility staff roles - work at the factory/HQ
export type FacilityStaffRole = 
  | 'aerodynamicist'
  | 'structural_engineer'
  | 'power_unit_engineer'
  | 'simulation_specialist'
  | 'production_manager'
  | 'marketing_manager'
  | 'junior_engineer'
  | 'senior_engineer'
  | 'department_head'

// Team/Race staff roles - travel with the team to races
export type TeamStaffRole =
  | 'chief_engineer'
  | 'technical_director'
  | 'strategist'
  | 'race_engineer'
  | 'crew_chief'
  | 'team_manager'
  | 'pr_manager'
  | 'data_analyst'
  | 'performance_engineer'

// Combined staff role type for unified market
export type StaffRole = FacilityStaffRole | TeamStaffRole

// Categorize roles by type
export const STAFF_ROLE_CATEGORY: Record<StaffRole, 'facility' | 'team'> = {
  // Facility roles
  aerodynamicist: 'facility',
  structural_engineer: 'facility',
  power_unit_engineer: 'facility',
  simulation_specialist: 'facility',
  production_manager: 'facility',
  marketing_manager: 'facility',
  junior_engineer: 'facility',
  senior_engineer: 'facility',
  department_head: 'facility',
  // Team roles
  chief_engineer: 'team',
  technical_director: 'team',
  strategist: 'team',
  race_engineer: 'team',
  crew_chief: 'team',
  team_manager: 'team',
  pr_manager: 'team',
  data_analyst: 'team',
  performance_engineer: 'team'
}

/** Roles that can conduct staff candidate interviews (delegated from owner) */
export const ROLES_CAN_CONDUCT_INTERVIEWS: StaffRole[] = ['team_manager', 'department_head']

// ============================================
// STAFF DELEGATION SYSTEM
// ============================================

export type DelegationDomain = 
  | 'logistics'          // Parts allocation, shipping, warehouse
  | 'rnd_focus'          // R&D development direction
  | 'race_strategy'      // Race weekend setup suggestions
  | 'media_management'   // Social media, interview responses
  | 'manufacturing'      // Manufacturing queue, part reordering
  | 'marketing'          // Merchandise, marketing campaigns
  | 'scouting'           // Driver/staff scouting reports
  | 'mandatory_scheduling' // Auto-schedule mandatory activities

export interface DelegationCapability {
  domain: DelegationDomain
  label: string
  description: string
  primarySkill: string        // Which staff skill drives quality
  secondarySkill?: string     // Optional secondary skill
}

/**
 * Maps delegation primarySkill / secondarySkill strings to actual FacilityStaffSkills keys.
 * Needed because some delegation capabilities use conceptual names (e.g. 'logistics')
 * that don't directly match the skill interface keys.
 */
export const DELEGATION_SKILL_KEY_MAP: Record<string, keyof FacilityStaffSkills> = {
  technical: 'technical',
  logistics: 'management',
  operations: 'management',
  strategy: 'technical',
  analysis: 'innovation',
  marketing: 'communication',
  engineering: 'technical',
  creativity: 'innovation',
  communication: 'communication',
}

/** Maps each team staff role to what domains they can auto-manage */
export const STAFF_DELEGATION_MAP: Partial<Record<StaffRole, DelegationCapability[]>> = {
  team_manager: [
    { domain: 'logistics', label: 'Logistics Management', description: 'Auto-manages parts allocation, shipping methods, and warehouse operations', primarySkill: 'logistics', secondarySkill: 'operations' },
    { domain: 'mandatory_scheduling', label: 'Activity Scheduling', description: 'Auto-schedules mandatory activities at optimal times', primarySkill: 'operations' }
  ],
  technical_director: [
    { domain: 'rnd_focus', label: 'R&D Direction', description: 'Auto-allocates development focus across aero, chassis, powertrain, and electronics', primarySkill: 'technical', secondarySkill: 'analysis' }
  ],
  strategist: [
    { domain: 'race_strategy', label: 'Race Strategy', description: 'Pre-populates race weekend strategy suggestions based on track data', primarySkill: 'strategy', secondarySkill: 'analysis' }
  ],
  pr_manager: [
    { domain: 'media_management', label: 'Media Management', description: 'Auto-posts social media updates and responds to media requests', primarySkill: 'marketing', secondarySkill: 'communication' }
  ],
  crew_chief: [
    { domain: 'manufacturing', label: 'Manufacturing Queue', description: 'Auto-reorders parts when stock runs low and manages manufacturing priority', primarySkill: 'engineering', secondarySkill: 'operations' }
  ],
  marketing_manager: [
    { domain: 'marketing', label: 'Marketing & Merch', description: 'Handles merchandise collection launches and marketing campaign selection', primarySkill: 'marketing', secondarySkill: 'creativity' }
  ],
  data_analyst: [
    { domain: 'scouting', label: 'Scouting Reports', description: 'Auto-identifies promising drivers and staff with analysis summaries', primarySkill: 'analysis', secondarySkill: 'technical' }
  ]
}

/**
 * Calculate the quality of delegated decisions based on staff skills (0-1).
 * quality > 0.8: Optimal decisions (same as best player choice)
 * quality 0.5-0.8: Decent decisions (80% as effective)
 * quality < 0.5: Poor decisions (60% as effective, sometimes wasteful)
 */
export function calculateDelegationQuality(
  staffSkill: number,       // 0-100 primary skill
  staffExperience: number,  // years or months
  secondarySkill?: number   // 0-100 optional
): number {
  const primaryWeight = staffSkill / 100
  const experienceMultiplier = Math.min(1.2, 0.7 + (staffExperience / 20) * 0.5) // 0.7 base, up to 1.2x
  const secondaryBonus = secondarySkill ? (secondarySkill / 100) * 0.15 : 0 // Up to +0.15
  return Math.min(1, primaryWeight * experienceMultiplier + secondaryBonus)
}

/**
 * Get the effectiveness multiplier for a delegation quality level.
 * Used to scale the outcome of auto-managed decisions.
 */
export function getDelegationEffectiveness(quality: number): { multiplier: number; label: string; description: string } {
  if (quality >= 0.8) return { multiplier: 1.0, label: 'Excellent', description: 'Makes optimal decisions - as good as your best choice' }
  if (quality >= 0.5) return { multiplier: 0.8, label: 'Decent', description: 'Makes competent decisions - 80% as effective' }
  return { multiplier: 0.6, label: 'Poor', description: 'Makes suboptimal decisions - sometimes wasteful' }
}

export const FACILITY_STAFF_ROLE_NAMES: Record<FacilityStaffRole, string> = {
  aerodynamicist: 'Aerodynamicist',
  structural_engineer: 'Structural Engineer',
  power_unit_engineer: 'Power Unit Engineer',
  simulation_specialist: 'Simulation Specialist',
  production_manager: 'Production Manager',
  marketing_manager: 'Marketing Manager',
  junior_engineer: 'Junior Engineer',
  senior_engineer: 'Senior Engineer',
  department_head: 'Department Head'
}

export const TEAM_STAFF_ROLE_NAMES: Record<TeamStaffRole, string> = {
  chief_engineer: 'Chief Engineer',
  technical_director: 'Technical Director',
  strategist: 'Race Strategist',
  race_engineer: 'Race Engineer',
  crew_chief: 'Crew Chief',
  team_manager: 'Team Manager',
  pr_manager: 'PR Manager',
  data_analyst: 'Data Analyst',
  performance_engineer: 'Performance Engineer'
}

// Combined role names for unified access
export const STAFF_ROLE_NAMES: Record<StaffRole, string> = {
  ...FACILITY_STAFF_ROLE_NAMES,
  ...TEAM_STAFF_ROLE_NAMES
}

export const FACILITY_STAFF_ROLE_DESCRIPTIONS: Record<FacilityStaffRole, string> = {
  aerodynamicist: 'Specializes in aerodynamic analysis, wind tunnel testing, and CFD simulation',
  structural_engineer: 'Focuses on chassis design, stress analysis, and structural optimization',
  power_unit_engineer: 'Works on engine mapping, reliability, and power delivery',
  simulation_specialist: 'Operates driver-in-loop simulators and develops simulation models',
  production_manager: 'Manages manufacturing processes, quality control, and part logistics',
  marketing_manager: 'Handles sponsor relations, PR campaigns, team branding, and merchandise proposals',
  junior_engineer: 'Entry-level engineer learning the trade - can assist in any department',
  senior_engineer: 'Experienced engineer with broad technical knowledge',
  department_head: 'Senior leader who can run any technical department'
}

export const TEAM_STAFF_ROLE_DESCRIPTIONS: Record<TeamStaffRole, string> = {
  chief_engineer: 'Leads the engineering team and oversees car setup and development direction',
  technical_director: 'Sets technical strategy and coordinates between departments',
  strategist: 'Makes real-time race decisions: pit timing, tire strategy, and weather responses',
  race_engineer: 'Works directly with the driver on car setup, data analysis, and race preparation',
  crew_chief: 'Manages pit crew operations, ensuring fast and reliable pit stops',
  team_manager: 'Handles team logistics, personnel, and day-to-day operations',
  pr_manager: 'Manages media relations, sponsor communications, and team image',
  data_analyst: 'Analyzes telemetry, lap times, and competitor data to find performance gains',
  performance_engineer: 'Optimizes car performance through data-driven setup changes'
}

// Combined descriptions
export const STAFF_ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  ...FACILITY_STAFF_ROLE_DESCRIPTIONS,
  ...TEAM_STAFF_ROLE_DESCRIPTIONS
}

// Which facility each role is best suited for
export const ROLE_FACILITY_MAPPING: Record<FacilityStaffRole, FacilityType[]> = {
  aerodynamicist: ['aero'],
  structural_engineer: ['chassis'],
  power_unit_engineer: ['engine'],
  simulation_specialist: ['sim'],
  production_manager: ['manufacturing'],
  marketing_manager: ['marketing'],
  junior_engineer: ['aero', 'chassis', 'engine', 'sim', 'manufacturing'],
  senior_engineer: ['aero', 'chassis', 'engine', 'sim', 'manufacturing'],
  department_head: ['aero', 'chassis', 'engine', 'sim', 'manufacturing', 'marketing']
}

// ============================================
// FACILITY STAFF SKILLS
// ============================================

export interface FacilityStaffSkills {
  technical: number      // 0-100: Technical expertise
  management: number     // 0-100: Team management & organization
  innovation: number     // 0-100: Creative problem-solving
  reliability: number    // 0-100: Consistency and attention to detail
  communication: number  // 0-100: Ability to collaborate and present
}

// Skills that matter most for each facility
export const FACILITY_SKILL_WEIGHTS: Record<FacilityType, Partial<Record<keyof FacilityStaffSkills, number>>> = {
  aero: { technical: 0.4, innovation: 0.3, reliability: 0.2, communication: 0.1 },
  chassis: { technical: 0.4, reliability: 0.3, innovation: 0.2, management: 0.1 },
  engine: { technical: 0.5, reliability: 0.3, innovation: 0.2 },
  sim: { technical: 0.3, innovation: 0.3, communication: 0.2, reliability: 0.2 },
  manufacturing: { management: 0.3, reliability: 0.4, technical: 0.2, communication: 0.1 },
  marketing: { communication: 0.4, management: 0.3, innovation: 0.2, reliability: 0.1 }
}

// ============================================
// FACILITY STAFF INTERFACE
// ============================================

/** Snapshot of pre-generated bio stored on staff so it survives refresh/save without relying on preGen service lookup */
export interface StaffPreGenBioSnapshot {
  bio: string
  personality: string
  quirks: string[]
  physicalDescription?: string
}

export interface FacilityStaffMember {
  id: string
  name: string
  gender: 'male' | 'female'
  portraitId: string         // Persistent portrait reference from manifest
  role: FacilityStaffRole
  staffCategory: 'facility'
  nationality: string
  age: number
  skills: FacilityStaffSkills
  experience: number        // Years in the industry
  currentTeam?: string      // Current employer (if any)
  salary: number            // Weekly salary demand
  contractYears: number     // Years they want to sign for
  reputation: number        // 0-100: How well-known they are
  availability: 'available' | 'under_contract' | 'retiring'
  preferredFacility?: FacilityType  // Where they'd prefer to work
  traits: FacilityStaffTrait[]
  /** Full pre-gen bio snapshot so bios persist across market refresh and save/load */
  preGenBio?: StaffPreGenBioSnapshot
}

export interface TeamStaffMember {
  id: string
  name: string
  gender: 'male' | 'female'
  portraitId: string         // Persistent portrait reference from manifest
  role: TeamStaffRole
  staffCategory: 'team'
  nationality: string
  age: number
  skills: FacilityStaffSkills  // Reuse same skill structure
  experience: number
  currentTeam?: string
  salary: number
  contractYears: number
  reputation: number
  availability: 'available' | 'under_contract' | 'retiring'
  traits: FacilityStaffTrait[]
  /** Full pre-gen bio snapshot so bios persist across market refresh and save/load */
  preGenBio?: StaffPreGenBioSnapshot
  // Team staff specific fields
  racesWorked?: number       // Total races worked in career
  championshipsWon?: number  // Championships contributed to
}

// Union type for staff market
export type StaffMember = FacilityStaffMember | TeamStaffMember

export type FacilityStaffTrait = 
  | 'perfectionist'     // Higher quality but slower
  | 'fast_worker'       // Faster but may miss details
  | 'team_player'       // Boosts nearby staff
  | 'lone_wolf'         // Works best alone
  | 'innovator'         // More likely to find breakthroughs
  | 'reliable'          // Consistent output
  | 'ambitious'         // Wants promotions, may leave
  | 'loyal'             // Unlikely to leave
  | 'mentor'            // Improves junior staff
  | 'experienced'       // Been around, knows tricks

export const TRAIT_DESCRIPTIONS: Record<FacilityStaffTrait, string> = {
  perfectionist: 'Takes time to ensure quality work',
  fast_worker: 'Completes tasks quickly',
  team_player: 'Improves department morale and collaboration',
  lone_wolf: 'Works best independently',
  innovator: 'May discover breakthroughs',
  reliable: 'Consistently delivers results',
  ambitious: 'Seeks advancement opportunities',
  loyal: 'Committed to the team long-term',
  mentor: 'Helps develop junior staff',
  experienced: 'Brings valuable industry knowledge'
}

export const TRAIT_EFFECTS: Record<FacilityStaffTrait, { bonusType: string; bonusValue: number }> = {
  perfectionist: { bonusType: 'quality', bonusValue: 0.1 },
  fast_worker: { bonusType: 'speed', bonusValue: 0.15 },
  team_player: { bonusType: 'morale', bonusValue: 5 },
  lone_wolf: { bonusType: 'solo_bonus', bonusValue: 0.1 },
  innovator: { bonusType: 'breakthrough_chance', bonusValue: 0.05 },
  reliable: { bonusType: 'consistency', bonusValue: 0.1 },
  ambitious: { bonusType: 'growth', bonusValue: 0.1 },
  loyal: { bonusType: 'retention', bonusValue: 0.2 },
  mentor: { bonusType: 'junior_growth', bonusValue: 0.15 },
  experienced: { bonusType: 'efficiency', bonusValue: 0.1 }
}

// ============================================
// SALARY RANGES BY TIER AND ROLE
// ============================================

export interface SalaryRange {
  min: number
  max: number
}

// Base weekly salary ranges by facility role
export const BASE_SALARY_BY_FACILITY_ROLE: Record<FacilityStaffRole, SalaryRange> = {
  junior_engineer: { min: 800, max: 1500 },
  aerodynamicist: { min: 2000, max: 5000 },
  structural_engineer: { min: 1800, max: 4500 },
  power_unit_engineer: { min: 2200, max: 5500 },
  simulation_specialist: { min: 1500, max: 4000 },
  production_manager: { min: 1600, max: 4200 },
  marketing_manager: { min: 1400, max: 3800 },
  senior_engineer: { min: 3500, max: 7000 },
  department_head: { min: 5000, max: 12000 }
}

// Base weekly salary ranges by team role
export const BASE_SALARY_BY_TEAM_ROLE: Record<TeamStaffRole, SalaryRange> = {
  race_engineer: { min: 2000, max: 5000 },
  data_analyst: { min: 1500, max: 4000 },
  performance_engineer: { min: 2000, max: 5000 },
  crew_chief: { min: 1800, max: 4500 },
  strategist: { min: 3000, max: 7000 },
  pr_manager: { min: 1500, max: 4000 },
  team_manager: { min: 2500, max: 6000 },
  chief_engineer: { min: 4000, max: 9000 },
  technical_director: { min: 6000, max: 15000 }
}

// Combined salary ranges for all roles
export const BASE_SALARY_BY_ROLE: Record<StaffRole, SalaryRange> = {
  ...BASE_SALARY_BY_FACILITY_ROLE,
  ...BASE_SALARY_BY_TEAM_ROLE
}

// Tier multipliers for salaries
export const TIER_SALARY_MULTIPLIER: Record<TeamTier, number> = {
  entry: 0.4,
  amateur: 0.6,
  'semi-pro': 0.8,
  professional: 1.0,
  pro: 1.3,
  elite: 1.7,
  pinnacle: 2.5
}

/**
 * Calculate expected salary for a staff member
 */
export function calculateStaffSalary(
  role: StaffRole,
  skills: FacilityStaffSkills,
  experience: number,
  reputation: number,
  tier: TeamTier
): number {
  const baseRange = BASE_SALARY_BY_ROLE[role]
  const tierMultiplier = TIER_SALARY_MULTIPLIER[tier]
  
  // Average skill affects salary
  const avgSkill = Object.values(skills).reduce((a, b) => a + b, 0) / 5
  const skillFactor = 0.5 + (avgSkill / 100) * 0.5 // 0.5 to 1.0
  
  // Experience affects salary (capped at 20 years)
  const expFactor = 1 + Math.min(experience, 20) * 0.03 // Up to 60% more
  
  // Reputation affects salary
  const repFactor = 0.8 + (reputation / 100) * 0.4 // 0.8 to 1.2
  
  const baseSalary = baseRange.min + (baseRange.max - baseRange.min) * skillFactor
  const finalSalary = baseSalary * tierMultiplier * expFactor * repFactor
  
  return Math.round(finalSalary / 10) * 10 // Round to nearest 10
}

// ============================================
// STAFF GENERATION
// ============================================

// ── Seeded random helpers for deterministic stat derivation from pre-gen IDs ──

function _hashId(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function _seededRandom(seed: number, offset: number): number {
  const x = Math.sin(seed + offset * 9.8 + 0.1) * 10000
  return x - Math.floor(x)
}

function _clampSkill(v: number): number {
  return Math.max(10, Math.min(100, Math.round(v)))
}

/**
 * Map pre-generated personality string to a FacilityStaffTrait.
 */
function mapPersonalityToTrait(personality: string): FacilityStaffTrait {
  const mapping: Record<string, FacilityStaffTrait> = {
    perfectionist: 'perfectionist',
    ambitious: 'ambitious',
    loyal: 'loyal',
    creative: 'innovator',
    disciplined: 'reliable',
    analytical: 'perfectionist',
    calm: 'reliable',
    charismatic: 'team_player',
    demanding: 'fast_worker',
    flexible: 'team_player',
    innovative: 'innovator'
  }
  return mapping[personality] || 'reliable'
}

/**
 * Build a FacilityStaffMember from a pre-generated profile + deterministic stats.
 */
function buildFacilityStaffFromPreGen(
  preGen: PreGenStaffProfile,
  role: FacilityStaffRole,
  tier: TeamTier,
  availableOnly: boolean
): FacilityStaffMember {
  const seed = _hashId(preGen.id)

  const age = preGen.age || (22 + Math.floor(_seededRandom(seed, 0) * 23))
  const experience = Math.max(0, age - 22 - Math.floor(_seededRandom(seed, 1) * 5))

  const baseSkill = role === 'junior_engineer' ? 35 : 
                   role === 'senior_engineer' ? 65 :
                   role === 'department_head' ? 75 : 50
  const variance = role === 'junior_engineer' ? 20 : 25

  const skills: FacilityStaffSkills = {
    technical: _clampSkill(baseSkill + (_seededRandom(seed, 2) * variance * 2) - variance),
    management: _clampSkill(baseSkill + (_seededRandom(seed, 3) * variance * 2) - variance),
    innovation: _clampSkill(baseSkill + (_seededRandom(seed, 4) * variance * 2) - variance),
    reliability: _clampSkill(baseSkill + (_seededRandom(seed, 5) * variance * 2) - variance),
    communication: _clampSkill(baseSkill + (_seededRandom(seed, 6) * variance * 2) - variance)
  }

  const avgSkill = Object.values(skills).reduce((a, b) => a + b, 0) / 5
  const reputation = Math.min(100, Math.max(5, Math.floor(avgSkill * 0.5 + experience * 2 + _seededRandom(seed, 7) * 20)))

  // Build traits from pre-gen personality + seeded selection
  const primaryTrait = mapPersonalityToTrait(preGen.personality)
  const allTraits: FacilityStaffTrait[] = ['perfectionist', 'fast_worker', 'team_player', 'lone_wolf', 'innovator', 'reliable', 'ambitious', 'loyal', 'mentor', 'experienced']
  const numTraits = 1 + Math.floor(_seededRandom(seed, 8) * 3)
  const traits: FacilityStaffTrait[] = [primaryTrait]
  for (let i = 1; i < numTraits; i++) {
    const idx = Math.floor(_seededRandom(seed, 8 + i) * allTraits.length)
    const trait = allTraits[idx]
    if (!traits.includes(trait) &&
        !(trait === 'team_player' && traits.includes('lone_wolf')) &&
        !(trait === 'lone_wolf' && traits.includes('team_player')) &&
        !(trait === 'perfectionist' && traits.includes('fast_worker')) &&
        !(trait === 'fast_worker' && traits.includes('perfectionist'))) {
      traits.push(trait)
    }
  }

  const preferredFacilities = ROLE_FACILITY_MAPPING[role]
  const preferredFacility = preferredFacilities[Math.floor(_seededRandom(seed, 12) * preferredFacilities.length)]

  const contractYears = role === 'junior_engineer' ? 1 + Math.floor(_seededRandom(seed, 13) * 2) :
                       role === 'department_head' ? 2 + Math.floor(_seededRandom(seed, 13) * 3) :
                       1 + Math.floor(_seededRandom(seed, 13) * 3)

  const salary = calculateStaffSalary(role, skills, experience, reputation, tier)
  const availability = availableOnly ? 'available' : (_seededRandom(seed, 14) > 0.7 ? 'under_contract' : 'available')

  const gender = (preGen.gender === 'male' || preGen.gender === 'female') ? preGen.gender : 'male'
  const portraitId = getPreGenPortrait(preGen.id) || getPortraitIdByGender(gender, preGen.id)

  const preGenBio: StaffPreGenBioSnapshot = {
    bio: preGen.bio || '',
    personality: preGen.personality || '',
    quirks: preGen.quirks || [],
    physicalDescription: preGen.physical?.description
  }

  return {
    id: preGen.id,
    name: preGen.name,
    gender,
    portraitId,
    role,
    staffCategory: 'facility' as const,
    nationality: preGen.nationality,
    age,
    skills,
    experience,
    salary,
    contractYears,
    reputation,
    availability,
    preferredFacility,
    traits,
    preGenBio
  }
}

/**
 * Generate a random facility staff member.
 * Tries pre-generated Content Studio data first, falls back to runtime generation.
 */
export function generateFacilityStaff(
  role: FacilityStaffRole,
  tier: TeamTier,
  availableOnly: boolean = true
): FacilityStaffMember {
  // ── Try pre-generated pool first ──
  if (isContentLoaded()) {
    const preGen = getRandomStaff(undefined, 1)
    if (preGen.length > 0) {
      return buildFacilityStaffFromPreGen(preGen[0], role, tier, availableOnly)
    }
  }

  // ── Fallback: runtime generation (original logic) ──
  const nationality = pickNationality()
  const gender = pickGender()
  const { firstName, lastName } = generateStaffName(gender, nationality.region)
  
  const id = `fstaff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const portraitId = getPortraitIdByGender(gender, id)
  
  let minAge = 22
  let maxAge = 45
  if (role === 'junior_engineer') {
    minAge = 22
    maxAge = 28
  } else if (role === 'department_head' || role === 'senior_engineer') {
    minAge = 35
    maxAge = 60
  }
  const age = minAge + Math.floor(Math.random() * (maxAge - minAge))
  
  const experience = Math.max(0, age - 22 - Math.floor(Math.random() * 5))
  
  const baseSkill = role === 'junior_engineer' ? 35 : 
                   role === 'senior_engineer' ? 65 :
                   role === 'department_head' ? 75 : 50
  
  const variance = role === 'junior_engineer' ? 20 : 25
  
  const skills: FacilityStaffSkills = {
    technical: Math.min(100, Math.max(10, baseSkill + Math.floor(Math.random() * variance * 2) - variance)),
    management: Math.min(100, Math.max(10, baseSkill + Math.floor(Math.random() * variance * 2) - variance)),
    innovation: Math.min(100, Math.max(10, baseSkill + Math.floor(Math.random() * variance * 2) - variance)),
    reliability: Math.min(100, Math.max(10, baseSkill + Math.floor(Math.random() * variance * 2) - variance)),
    communication: Math.min(100, Math.max(10, baseSkill + Math.floor(Math.random() * variance * 2) - variance))
  }
  
  const avgSkill = Object.values(skills).reduce((a, b) => a + b, 0) / 5
  const reputation = Math.min(100, Math.max(5, Math.floor(avgSkill * 0.5 + experience * 2 + Math.random() * 20)))
  
  const allTraits: FacilityStaffTrait[] = ['perfectionist', 'fast_worker', 'team_player', 'lone_wolf', 'innovator', 'reliable', 'ambitious', 'loyal', 'mentor', 'experienced']
  const numTraits = 1 + Math.floor(Math.random() * 3)
  const traits: FacilityStaffTrait[] = []
  const availableTraitsList = [...allTraits]
  
  for (let i = 0; i < numTraits && availableTraitsList.length > 0; i++) {
    const idx = Math.floor(Math.random() * availableTraitsList.length)
    const trait = availableTraitsList.splice(idx, 1)[0]
    if (trait === 'team_player' && traits.includes('lone_wolf')) continue
    if (trait === 'lone_wolf' && traits.includes('team_player')) continue
    if (trait === 'perfectionist' && traits.includes('fast_worker')) continue
    if (trait === 'fast_worker' && traits.includes('perfectionist')) continue
    traits.push(trait)
  }
  
  const preferredFacilities = ROLE_FACILITY_MAPPING[role]
  const preferredFacility = preferredFacilities[Math.floor(Math.random() * preferredFacilities.length)]
  
  const contractYears = role === 'junior_engineer' ? 1 + Math.floor(Math.random() * 2) :
                       role === 'department_head' ? 2 + Math.floor(Math.random() * 3) :
                       1 + Math.floor(Math.random() * 3)
  
  const salary = calculateStaffSalary(role, skills, experience, reputation, tier)
  
  const availability = availableOnly ? 'available' : 
                      Math.random() > 0.7 ? 'under_contract' : 'available'
  
  return {
    id,
    name: `${firstName} ${lastName}`,
    gender,
    portraitId,
    role,
    staffCategory: 'facility' as const,
    nationality: nationality.country,
    age,
    skills,
    experience,
    salary,
    contractYears,
    reputation,
    availability,
    preferredFacility,
    traits
  }
}

/**
 * Build a TeamStaffMember from a pre-generated profile + deterministic stats.
 */
function buildTeamStaffFromPreGen(
  preGen: PreGenStaffProfile,
  role: TeamStaffRole,
  tier: TeamTier,
  availableOnly: boolean
): TeamStaffMember {
  const seed = _hashId(preGen.id)

  const age = preGen.age || (25 + Math.floor(_seededRandom(seed, 0) * 25))
  const experience = Math.max(0, age - 23 - Math.floor(_seededRandom(seed, 1) * 5))

  const baseSkill = 
    role === 'technical_director' ? 75 :
    role === 'chief_engineer' ? 70 :
    role === 'strategist' ? 65 :
    role === 'data_analyst' ? 55 :
    role === 'race_engineer' ? 60 :
    role === 'performance_engineer' ? 60 :
    role === 'crew_chief' ? 55 :
    role === 'team_manager' ? 60 :
    role === 'pr_manager' ? 50 : 55
  const variance = 25

  const skills: FacilityStaffSkills = {
    technical: _clampSkill(baseSkill + (_seededRandom(seed, 2) * variance * 2) - variance),
    management: _clampSkill(baseSkill + (_seededRandom(seed, 3) * variance * 2) - variance),
    innovation: _clampSkill(baseSkill + (_seededRandom(seed, 4) * variance * 2) - variance),
    reliability: _clampSkill(baseSkill + (_seededRandom(seed, 5) * variance * 2) - variance),
    communication: _clampSkill(baseSkill + (_seededRandom(seed, 6) * variance * 2) - variance)
  }

  const avgSkill = Object.values(skills).reduce((a, b) => a + b, 0) / 5
  const reputation = Math.min(100, Math.max(5, Math.floor(avgSkill * 0.5 + experience * 2 + _seededRandom(seed, 7) * 20)))

  const primaryTrait = mapPersonalityToTrait(preGen.personality)
  const allTraits: FacilityStaffTrait[] = ['perfectionist', 'fast_worker', 'team_player', 'lone_wolf', 'innovator', 'reliable', 'ambitious', 'loyal', 'mentor', 'experienced']
  const numTraits = 1 + Math.floor(_seededRandom(seed, 8) * 3)
  const traits: FacilityStaffTrait[] = [primaryTrait]
  for (let i = 1; i < numTraits; i++) {
    const idx = Math.floor(_seededRandom(seed, 8 + i) * allTraits.length)
    const trait = allTraits[idx]
    if (!traits.includes(trait) &&
        !(trait === 'team_player' && traits.includes('lone_wolf')) &&
        !(trait === 'lone_wolf' && traits.includes('team_player')) &&
        !(trait === 'perfectionist' && traits.includes('fast_worker')) &&
        !(trait === 'fast_worker' && traits.includes('perfectionist'))) {
      traits.push(trait)
    }
  }

  const contractYears = role === 'technical_director' || role === 'chief_engineer'
    ? 2 + Math.floor(_seededRandom(seed, 12) * 3)
    : 1 + Math.floor(_seededRandom(seed, 12) * 3)

  const salary = calculateStaffSalary(role, skills, experience, reputation, tier)
  const availability = availableOnly ? 'available' : (_seededRandom(seed, 13) > 0.7 ? 'under_contract' : 'available')

  const racesWorked = Math.floor(experience * (15 + _seededRandom(seed, 14) * 10))
  const championshipsWon = experience > 10 && reputation > 70
    ? Math.floor(_seededRandom(seed, 15) * Math.min(3, Math.floor(experience / 5)))
    : 0

  const gender = (preGen.gender === 'male' || preGen.gender === 'female') ? preGen.gender : 'male'
  const portraitId = getPreGenPortrait(preGen.id) || getPortraitIdByGender(gender, preGen.id)

  const preGenBio: StaffPreGenBioSnapshot = {
    bio: preGen.bio || '',
    personality: preGen.personality || '',
    quirks: preGen.quirks || [],
    physicalDescription: preGen.physical?.description
  }

  return {
    id: preGen.id,
    name: preGen.name,
    gender,
    portraitId,
    role,
    staffCategory: 'team' as const,
    nationality: preGen.nationality,
    age,
    skills,
    experience,
    salary,
    contractYears,
    reputation,
    availability,
    traits,
    preGenBio,
    racesWorked,
    championshipsWon
  }
}

/**
 * Generate a random team/race staff member.
 * Tries pre-generated Content Studio data first, falls back to runtime generation.
 */
export function generateTeamStaff(
  role: TeamStaffRole,
  tier: TeamTier,
  availableOnly: boolean = true
): TeamStaffMember {
  // ── Try pre-generated pool first ──
  if (isContentLoaded()) {
    const preGen = getRandomStaff(undefined, 1)
    if (preGen.length > 0) {
      return buildTeamStaffFromPreGen(preGen[0], role, tier, availableOnly)
    }
  }

  // ── Fallback: runtime generation (original logic) ──
  const nationality = pickNationality()
  const gender = pickGender()
  const { firstName, lastName } = generateStaffName(gender, nationality.region)
  
  const id = `tstaff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const portraitId = getPortraitIdByGender(gender, id)
  
  let minAge = 25
  let maxAge = 50
  if (role === 'data_analyst' || role === 'race_engineer') {
    minAge = 24
    maxAge = 40
  } else if (role === 'technical_director' || role === 'chief_engineer') {
    minAge = 35
    maxAge = 65
  } else if (role === 'crew_chief') {
    minAge = 28
    maxAge = 55
  }
  const age = minAge + Math.floor(Math.random() * (maxAge - minAge))
  
  const experience = Math.max(0, age - 23 - Math.floor(Math.random() * 5))
  
  const baseSkill = 
    role === 'technical_director' ? 75 :
    role === 'chief_engineer' ? 70 :
    role === 'strategist' ? 65 :
    role === 'data_analyst' ? 55 :
    role === 'race_engineer' ? 60 :
    role === 'performance_engineer' ? 60 :
    role === 'crew_chief' ? 55 :
    role === 'team_manager' ? 60 :
    role === 'pr_manager' ? 50 : 55
  
  const variance = 25
  
  const skills: FacilityStaffSkills = {
    technical: Math.min(100, Math.max(10, baseSkill + Math.floor(Math.random() * variance * 2) - variance)),
    management: Math.min(100, Math.max(10, baseSkill + Math.floor(Math.random() * variance * 2) - variance)),
    innovation: Math.min(100, Math.max(10, baseSkill + Math.floor(Math.random() * variance * 2) - variance)),
    reliability: Math.min(100, Math.max(10, baseSkill + Math.floor(Math.random() * variance * 2) - variance)),
    communication: Math.min(100, Math.max(10, baseSkill + Math.floor(Math.random() * variance * 2) - variance))
  }
  
  const avgSkill = Object.values(skills).reduce((a, b) => a + b, 0) / 5
  const reputation = Math.min(100, Math.max(5, Math.floor(avgSkill * 0.5 + experience * 2 + Math.random() * 20)))
  
  const allTraits: FacilityStaffTrait[] = ['perfectionist', 'fast_worker', 'team_player', 'lone_wolf', 'innovator', 'reliable', 'ambitious', 'loyal', 'mentor', 'experienced']
  const numTraits = 1 + Math.floor(Math.random() * 3)
  const traits: FacilityStaffTrait[] = []
  const availableTraitsList = [...allTraits]
  
  for (let i = 0; i < numTraits && availableTraitsList.length > 0; i++) {
    const idx = Math.floor(Math.random() * availableTraitsList.length)
    const trait = availableTraitsList.splice(idx, 1)[0]
    if (trait === 'team_player' && traits.includes('lone_wolf')) continue
    if (trait === 'lone_wolf' && traits.includes('team_player')) continue
    if (trait === 'perfectionist' && traits.includes('fast_worker')) continue
    if (trait === 'fast_worker' && traits.includes('perfectionist')) continue
    traits.push(trait)
  }
  
  const contractYears = role === 'technical_director' || role === 'chief_engineer' 
    ? 2 + Math.floor(Math.random() * 3)
    : 1 + Math.floor(Math.random() * 3)
  
  const salary = calculateStaffSalary(role, skills, experience, reputation, tier)
  
  const availability = availableOnly ? 'available' : 
                      Math.random() > 0.7 ? 'under_contract' : 'available'
  
  const racesWorked = Math.floor(experience * (15 + Math.random() * 10))
  const championshipsWon = experience > 10 && reputation > 70 
    ? Math.floor(Math.random() * Math.min(3, Math.floor(experience / 5)))
    : 0
  
  return {
    id,
    name: `${firstName} ${lastName}`,
    gender,
    portraitId,
    role,
    staffCategory: 'team' as const,
    nationality: nationality.country,
    age,
    skills,
    experience,
    salary,
    contractYears,
    reputation,
    availability,
    traits,
    racesWorked,
    championshipsWon
  }
}

/**
 * Generate a pool of available facility staff for the market
 */
export function generateFacilityStaffMarket(
  tier: TeamTier,
  count: number = 15
): FacilityStaffMember[] {
  const staff: FacilityStaffMember[] = []
  
  // Ensure at least one of each specialist role
  const specialistRoles: FacilityStaffRole[] = [
    'aerodynamicist',
    'structural_engineer',
    'power_unit_engineer',
    'simulation_specialist',
    'production_manager',
    'marketing_manager'
  ]
  
  // Add one specialist for each facility type
  for (const role of specialistRoles) {
    staff.push(generateFacilityStaff(role, tier, true))
  }
  
  // Fill remaining slots with mix of roles
  const allRoles: FacilityStaffRole[] = [
    ...specialistRoles,
    'junior_engineer',
    'junior_engineer', // More juniors available
    'senior_engineer',
    'department_head'
  ]
  
  while (staff.length < count) {
    const role = allRoles[Math.floor(Math.random() * allRoles.length)]
    staff.push(generateFacilityStaff(role, tier, true))
  }
  
  // Sort by reputation (descending)
  return staff.sort((a, b) => b.reputation - a.reputation)
}

/**
 * Generate a pool of available team/race staff for the market
 */
export function generateTeamStaffMarket(
  tier: TeamTier,
  count: number = 10
): TeamStaffMember[] {
  const staff: TeamStaffMember[] = []
  
  // Ensure at least one of the key team roles
  const keyRoles: TeamStaffRole[] = [
    'chief_engineer',
    'strategist',
    'race_engineer',
    'crew_chief'
  ]
  
  // Add one of each key role
  for (const role of keyRoles) {
    staff.push(generateTeamStaff(role, tier, true))
  }
  
  // Fill remaining slots with mix of roles
  const allRoles: TeamStaffRole[] = [
    ...keyRoles,
    'technical_director',
    'team_manager',
    'pr_manager',
    'data_analyst',
    'data_analyst', // More data analysts available
    'performance_engineer',
    'race_engineer' // More race engineers
  ]
  
  while (staff.length < count) {
    const role = allRoles[Math.floor(Math.random() * allRoles.length)]
    staff.push(generateTeamStaff(role, tier, true))
  }
  
  // Sort by reputation (descending)
  return staff.sort((a, b) => b.reputation - a.reputation)
}

/**
 * Generate a unified staff market with both facility and team staff
 */
export function generateUnifiedStaffMarket(
  tier: TeamTier,
  facilityCount: number = 12,
  teamCount: number = 8
): StaffMember[] {
  const facilityStaff = generateFacilityStaffMarket(tier, facilityCount)
  const teamStaff = generateTeamStaffMarket(tier, teamCount)
  
  // Combine and sort by reputation
  return [...facilityStaff, ...teamStaff].sort((a, b) => b.reputation - a.reputation)
}

/**
 * Calculate effectiveness of a staff member in a facility
 */
export function calculateFacilityEffectiveness(
  staff: FacilityStaffMember,
  facility: FacilityType
): number {
  const skillWeights = FACILITY_SKILL_WEIGHTS[facility]
  
  let effectiveness = 0
  let totalWeight = 0
  
  for (const [skill, weight] of Object.entries(skillWeights)) {
    if (weight) {
      effectiveness += (staff.skills[skill as keyof FacilityStaffSkills] || 50) * weight
      totalWeight += weight
    }
  }
  
  if (totalWeight > 0) {
    effectiveness = effectiveness / totalWeight
  } else {
    // Fallback to average
    effectiveness = Object.values(staff.skills).reduce((a, b) => a + b, 0) / 5
  }
  
  // Bonus for being in preferred facility
  if (staff.preferredFacility === facility) {
    effectiveness *= 1.1
  }
  
  // Bonus for specialist role matching facility
  const preferredRoles = ROLE_FACILITY_MAPPING[staff.role]
  if (preferredRoles.includes(facility)) {
    effectiveness *= 1.15
  }
  
  // Trait bonuses: use TRAIT_EFFECTS for efficiency and consistency so UI effectiveness aligns with R&D
  for (const trait of staff.traits) {
    const effect = TRAIT_EFFECTS[trait]
    if (effect && (effect.bonusType === 'efficiency' || effect.bonusType === 'consistency')) {
      effectiveness *= 1 + effect.bonusValue
    }
  }

  return Math.min(100, Math.round(effectiveness))
}

/**
 * Get contract cost (signing bonus + first year salary)
 */
export function calculateContractCost(staff: FacilityStaffMember): number {
  const weeklySalary = staff.salary
  const yearlyBaseSalary = weeklySalary * 52
  
  // Signing bonus based on reputation
  const signingBonusMultiplier = 0.1 + (staff.reputation / 100) * 0.2 // 10-30% of yearly salary
  const signingBonus = Math.round(yearlyBaseSalary * signingBonusMultiplier / 1000) * 1000
  
  return signingBonus
}

/**
 * Get yearly salary cost
 */
export function calculateYearlySalaryCost(staff: FacilityStaffMember): number {
  return staff.salary * 52
}

// ============================================
// WORLD STAFF POOL INITIALIZATION
// ============================================

export interface WorldStaffMemberInit {
  staff: FacilityStaffMember | TeamStaffMember
  status: 'available' | 'employed_ai' | 'employed_player' | 'retired' | 'cooldown'
  employedBy?: string
  cooldownWeeksRemaining?: number
  enteredPoolYear: number
  retirementAge: number
}

// Fallback AI team names — only used when no game-world teams are available
export const AI_TEAM_NAMES_FALLBACK = [
  'Apex Motorsport', 'Titan Racing', 'Horizon Grand Prix', 'Cobalt Engineering',
  'Summit Autosport', 'Vanguard Racing', 'Meridian Motorsports', 'Zenith Racing',
  'Catalyst Grand Prix', 'Forge Racing', 'Pinnacle Autosport', 'Eclipse Motorsport',
  'Ironclad Racing', 'Aurora Engineering', 'Velocity Racing', 'Atlas Motorsports'
] as const

// Defines minimum staff each AI team should have per category
const AI_TEAM_ROSTER_TEMPLATE: { facility: { role: FacilityStaffRole; count: number }[]; team: { role: TeamStaffRole; count: number }[] } = {
  facility: [
    { role: 'aerodynamicist', count: 2 },
    { role: 'structural_engineer', count: 2 },
    { role: 'power_unit_engineer', count: 1 },
    { role: 'simulation_specialist', count: 1 },
    { role: 'production_manager', count: 1 },
    { role: 'junior_engineer', count: 2 },
    { role: 'senior_engineer', count: 2 },
    { role: 'department_head', count: 1 },
  ],
  team: [
    { role: 'chief_engineer', count: 1 },
    { role: 'technical_director', count: 1 },
    { role: 'strategist', count: 1 },
    { role: 'race_engineer', count: 2 },
    { role: 'crew_chief', count: 1 },
    { role: 'team_manager', count: 1 },
    { role: 'data_analyst', count: 1 },
    { role: 'performance_engineer', count: 1 },
  ]
}

// Target total staff count — should stay close to the pre-generated content pool
// so every staff member gets a real portrait and rich bio.
const STAFF_POOL_TARGET = 3_900
// Reserve this many slots for the free-agent pool
const FREE_AGENT_BUDGET = 400

/**
 * Generate the initial world staff pool.
 * 
 * The total size is capped at ~STAFF_POOL_TARGET to stay within the pre-generated
 * content pool.  When there are many AI teams the per-team roster is automatically
 * scaled down so the total employed + free-agent count stays on budget.
 *
 * @param gameTeamNames - Optional list of actual in-game team names from the rival store.
 *                        Falls back to AI_TEAM_NAMES_FALLBACK if not provided.
 */
export function generateWorldStaffPool(
  currentYear: number,
  tier: TeamTier = 'amateur',
  gameTeamNames?: string[]
): WorldStaffMemberInit[] {
  const pool: WorldStaffMemberInit[] = []

  // Use game-world team names if available, otherwise use generic fallback names
  const teamNames = (gameTeamNames && gameTeamNames.length > 0)
    ? gameTeamNames
    : [...AI_TEAM_NAMES_FALLBACK]

  // ── Compute scaling factor for per-team rosters ──
  // Full roster = 12 facility + 9 team = 21 staff per team.
  // Budget for employed staff = total target minus free-agent reserve.
  const fullRosterSize = AI_TEAM_ROSTER_TEMPLATE.facility.reduce((s, r) => s + r.count, 0)
    + AI_TEAM_ROSTER_TEMPLATE.team.reduce((s, r) => s + r.count, 0)
  const employedBudget = STAFF_POOL_TARGET - FREE_AGENT_BUDGET
  const maxTeamsAtFullRoster = Math.floor(employedBudget / fullRosterSize) // ~166 teams

  // Scale factor: 1.0 when teams fit the budget, < 1.0 when there are too many.
  // Never go below a minimum of 3 staff per team (1 facility + 2 team) so every
  // team has at least some representation.
  const rosterScale = teamNames.length <= maxTeamsAtFullRoster
    ? 1.0
    : maxTeamsAtFullRoster / teamNames.length

  // Pre-compute the scaled counts once so every team gets the same roster shape
  const scaledFacility = AI_TEAM_ROSTER_TEMPLATE.facility.map(({ role, count }) => ({
    role,
    count: Math.max(1, Math.round(count * rosterScale))
  }))
  const scaledTeam = AI_TEAM_ROSTER_TEMPLATE.team.map(({ role, count }) => ({
    role,
    count: Math.max(0, Math.round(count * rosterScale))
  }))
  // Guarantee at least 1 team-staff slot (team_manager) even at extreme scales
  if (scaledTeam.every(r => r.count === 0)) {
    const tmIdx = scaledTeam.findIndex(r => r.role === 'team_manager')
    if (tmIdx >= 0) scaledTeam[tmIdx].count = 1
  }

  const scaledPerTeam = scaledFacility.reduce((s, r) => s + r.count, 0)
    + scaledTeam.reduce((s, r) => s + r.count, 0)

  console.log(`[WorldStaffPool] ${teamNames.length} teams, roster scale ${rosterScale.toFixed(2)} (${fullRosterSize} → ${scaledPerTeam} per team)`)

  // ── Phase 1: Generate per-team rosters for all AI teams ──
  for (const teamName of teamNames) {
    for (const { role, count } of scaledFacility) {
      for (let i = 0; i < count; i++) {
        const staff = generateFacilityStaff(role, tier, true)
        pool.push({
          staff,
          status: 'employed_ai',
          employedBy: teamName,
          enteredPoolYear: currentYear - Math.floor(Math.random() * 12),
          retirementAge: 55 + Math.floor(Math.random() * 14)
        })
      }
    }

    for (const { role, count } of scaledTeam) {
      for (let i = 0; i < count; i++) {
        const staff = generateTeamStaff(role, tier, true)
        pool.push({
          staff,
          status: 'employed_ai',
          employedBy: teamName,
          enteredPoolYear: currentYear - Math.floor(Math.random() * 12),
          retirementAge: 55 + Math.floor(Math.random() * 14)
        })
      }
    }
  }

  // ── Phase 2: Generate free agent pool ──
  // Scale free agents to fill remaining budget after employed staff
  const employedSoFar = pool.length
  const remainingBudget = Math.max(100, STAFF_POOL_TARGET - employedSoFar)

  // Split remaining budget: ~60% facility, ~40% team
  const facilityAgentBudget = Math.round(remainingBudget * 0.6)
  const teamAgentBudget = remainingBudget - facilityAgentBudget

  const facilityRoles: FacilityStaffRole[] = [
    'aerodynamicist', 'structural_engineer', 'power_unit_engineer',
    'simulation_specialist', 'production_manager', 'marketing_manager',
    'junior_engineer', 'senior_engineer', 'department_head'
  ]

  // Distribute budget across facility roles with weighted proportions
  const facilityWeights: Record<string, number> = {
    junior_engineer: 3, senior_engineer: 2, aerodynamicist: 2,
    structural_engineer: 2, power_unit_engineer: 1.5, simulation_specialist: 1.5,
    production_manager: 1.5, marketing_manager: 1, department_head: 0.8
  }
  const totalFacWeight = facilityRoles.reduce((s, r) => s + (facilityWeights[r] || 1), 0)

  for (const role of facilityRoles) {
    const weight = facilityWeights[role] || 1
    const count = Math.max(2, Math.round((weight / totalFacWeight) * facilityAgentBudget))
    for (let i = 0; i < count; i++) {
      const staff = generateFacilityStaff(role, tier, true)
      pool.push({
        staff,
        status: 'available',
        enteredPoolYear: currentYear - Math.floor(Math.random() * 10),
        retirementAge: 55 + Math.floor(Math.random() * 14)
      })
    }
  }

  const teamRoles: TeamStaffRole[] = [
    'chief_engineer', 'technical_director', 'strategist', 'race_engineer',
    'crew_chief', 'team_manager', 'pr_manager', 'data_analyst', 'performance_engineer'
  ]

  const teamWeights: Record<string, number> = {
    race_engineer: 2, data_analyst: 1.5, strategist: 1.5, crew_chief: 1.5,
    team_manager: 1.5, performance_engineer: 1.5, chief_engineer: 1,
    technical_director: 0.8, pr_manager: 1
  }
  const totalTeamWeight = teamRoles.reduce((s, r) => s + (teamWeights[r] || 1), 0)

  for (const role of teamRoles) {
    const weight = teamWeights[role] || 1
    const count = Math.max(2, Math.round((weight / totalTeamWeight) * teamAgentBudget))
    for (let i = 0; i < count; i++) {
      const staff = generateTeamStaff(role, tier, true)
      pool.push({
        staff,
        status: 'available',
        enteredPoolYear: currentYear - Math.floor(Math.random() * 10),
        retirementAge: 55 + Math.floor(Math.random() * 14)
      })
    }
  }

  const employedCount = pool.filter(m => m.status === 'employed_ai').length
  const availableCount = pool.filter(m => m.status === 'available').length
  console.log(`[WorldStaffPool] Generated pool of ${pool.length} members (${employedCount} employed, ${availableCount} free agents, target was ${STAFF_POOL_TARGET})`)
  return pool
}

/**
 * Enrich staff members that lack a preGenBio by assigning a random unused pre-gen
 * profile's bio data. This handles saves created before the pre-gen system was added,
 * and staff generated when pre-gen content wasn't loaded.
 *
 * Returns the number of staff members enriched.
 */
export function enrichStaffBios(staff: StaffMember[]): number {
  if (!isContentLoaded()) return 0

  let enriched = 0
  for (const member of staff) {
    if (member.preGenBio) continue // already has a bio

    // Try to find by ID first (if staff was pre-gen but lost bio during serialization)
    const byId = preGenGetStaffById(member.id)
    const byName = !byId ? preGenGetStaffByName(member.name) : null
    const match = byId ?? byName

    if (match) {
      member.preGenBio = {
        bio: match.bio || '',
        personality: match.personality || '',
        quirks: match.quirks || [],
        physicalDescription: match.physical?.description
      }
      enriched++
      continue
    }

    // No match — grab a random unused profile and transplant its bio
    const pool = getRandomStaff(undefined, 1)
    if (pool.length > 0) {
      const donor = pool[0]
      // Rewrite the bio to use the staff member's actual name and nationality
      const personalizedBio = donor.bio
        ? donor.bio.replace(new RegExp(donor.name, 'g'), member.name)
        : ''
      member.preGenBio = {
        bio: personalizedBio || generateRuntimeBio(member),
        personality: donor.personality || '',
        quirks: donor.quirks || [],
        physicalDescription: donor.physical?.description
      }
      enriched++
    } else {
      // Pool exhausted — generate a simple runtime bio
      member.preGenBio = {
        bio: generateRuntimeBio(member),
        personality: '',
        quirks: [],
      }
      enriched++
    }
  }
  return enriched
}

/**
 * Generate a rich runtime bio from a staff member's existing data.
 * Used as a fallback when no pre-generated bio is available.
 */
export function generateRuntimeBio(staff: StaffMember): string {
  const roleName = STAFF_ROLE_NAMES[staff.role] || staff.role.replace(/_/g, ' ')
  const avgSkill = Math.round(Object.values(staff.skills).reduce((a, b) => a + b, 0) / 5)

  // Build background section
  const expLevel = staff.experience > 20 ? 'veteran' : staff.experience > 10 ? 'experienced' : staff.experience > 5 ? 'established' : 'emerging'
  const skillLevel = avgSkill >= 80 ? 'exceptional' : avgSkill >= 65 ? 'strong' : avgSkill >= 50 ? 'solid' : 'developing'

  const intros = [
    `${staff.name} is a ${expLevel} ${roleName} from ${staff.nationality} with ${staff.experience} years of experience in the motorsport industry.`,
    `A ${staff.nationality} ${roleName} with ${staff.experience} years in the sport, ${staff.name} has built a reputation as a ${skillLevel} contributor.`,
    `With ${staff.experience} years of hands-on experience, ${staff.name} is a ${expLevel} ${staff.nationality} ${roleName} who brings ${skillLevel} technical abilities to any team.`,
  ]
  const intro = intros[Math.floor(Math.random() * intros.length)]

  // Highlight best skill
  const skillNames: Record<string, string> = {
    technical: 'technical expertise', management: 'management skills',
    innovation: 'innovative thinking', reliability: 'reliability and consistency',
    communication: 'communication abilities'
  }
  const bestSkill = Object.entries(staff.skills).sort(([, a], [, b]) => b - a)[0]
  const skillHighlight = bestSkill ? ` Their greatest strength lies in their ${skillNames[bestSkill[0]] || bestSkill[0]}.` : ''

  // Trait-based flavor
  const traitPhrases: Record<string, string> = {
    perfectionist: 'Known for meticulous attention to detail and high standards.',
    fast_worker: 'Recognized for their ability to deliver results quickly under pressure.',
    team_player: 'Valued for their collaborative spirit and ability to bring teams together.',
    lone_wolf: 'Prefers to work independently, often producing their best results with autonomy.',
    innovator: 'Always looking for creative solutions and pushing the boundaries of what\'s possible.',
    reliable: 'Consistently dependable, they are often the bedrock of any engineering department.',
    ambitious: 'Driven by a desire to constantly improve and advance in the sport.',
    loyal: 'Known for deep commitment to the teams and people they work with.',
    mentor: 'Takes pride in developing the next generation of engineering talent.',
    experienced: 'Their wealth of experience provides invaluable perspective to any team.'
  }
  const traitLines = staff.traits.slice(0, 2).map(t => traitPhrases[t]).filter(Boolean)

  const bio = [intro, skillHighlight, ...traitLines].filter(Boolean).join(' ')
  return bio
}
