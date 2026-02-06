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
  marketing_manager: 'Handles sponsor relations, PR campaigns, and team branding',
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

/**
 * Generate a random facility staff member
 */
export function generateFacilityStaff(
  role: FacilityStaffRole,
  tier: TeamTier,
  availableOnly: boolean = true
): FacilityStaffMember {
  // Pick nationality, gender, and name
  const nationality = pickNationality()
  const gender = pickGender()
  const { firstName, lastName } = generateStaffName(gender, nationality.region)
  
  // Generate a unique ID
  const id = `fstaff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Assign a persistent portrait matching gender
  const portraitId = getPortraitIdByGender(gender, id)
  
  // Generate age based on role
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
  
  // Experience based on age
  const experience = Math.max(0, age - 22 - Math.floor(Math.random() * 5))
  
  // Generate skills based on role and random variance
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
  
  // Reputation based on experience and skills
  const avgSkill = Object.values(skills).reduce((a, b) => a + b, 0) / 5
  const reputation = Math.min(100, Math.max(5, Math.floor(avgSkill * 0.5 + experience * 2 + Math.random() * 20)))
  
  // Generate traits (1-3)
  const allTraits: FacilityStaffTrait[] = ['perfectionist', 'fast_worker', 'team_player', 'lone_wolf', 'innovator', 'reliable', 'ambitious', 'loyal', 'mentor', 'experienced']
  const numTraits = 1 + Math.floor(Math.random() * 3)
  const traits: FacilityStaffTrait[] = []
  const availableTraitsList = [...allTraits]
  
  for (let i = 0; i < numTraits && availableTraitsList.length > 0; i++) {
    const idx = Math.floor(Math.random() * availableTraitsList.length)
    const trait = availableTraitsList.splice(idx, 1)[0]
    // Avoid conflicting traits
    if (trait === 'team_player' && traits.includes('lone_wolf')) continue
    if (trait === 'lone_wolf' && traits.includes('team_player')) continue
    if (trait === 'perfectionist' && traits.includes('fast_worker')) continue
    if (trait === 'fast_worker' && traits.includes('perfectionist')) continue
    traits.push(trait)
  }
  
  // Preferred facility based on role
  const preferredFacilities = ROLE_FACILITY_MAPPING[role]
  const preferredFacility = preferredFacilities[Math.floor(Math.random() * preferredFacilities.length)]
  
  // Contract years (shorter for juniors, longer for seniors)
  const contractYears = role === 'junior_engineer' ? 1 + Math.floor(Math.random() * 2) :
                       role === 'department_head' ? 2 + Math.floor(Math.random() * 3) :
                       1 + Math.floor(Math.random() * 3)
  
  // Calculate salary
  const salary = calculateStaffSalary(role, skills, experience, reputation, tier)
  
  // Availability
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
 * Generate a random team/race staff member
 */
export function generateTeamStaff(
  role: TeamStaffRole,
  tier: TeamTier,
  availableOnly: boolean = true
): TeamStaffMember {
  // Pick nationality, gender, and name
  const nationality = pickNationality()
  const gender = pickGender()
  const { firstName, lastName } = generateStaffName(gender, nationality.region)
  
  // Generate a unique ID
  const id = `tstaff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Assign a persistent portrait matching gender
  const portraitId = getPortraitIdByGender(gender, id)
  
  // Generate age based on role seniority
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
  
  // Experience based on age
  const experience = Math.max(0, age - 23 - Math.floor(Math.random() * 5))
  
  // Generate skills based on role
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
  
  // Reputation based on experience and skills
  const avgSkill = Object.values(skills).reduce((a, b) => a + b, 0) / 5
  const reputation = Math.min(100, Math.max(5, Math.floor(avgSkill * 0.5 + experience * 2 + Math.random() * 20)))
  
  // Generate traits (1-3)
  const allTraits: FacilityStaffTrait[] = ['perfectionist', 'fast_worker', 'team_player', 'lone_wolf', 'innovator', 'reliable', 'ambitious', 'loyal', 'mentor', 'experienced']
  const numTraits = 1 + Math.floor(Math.random() * 3)
  const traits: FacilityStaffTrait[] = []
  const availableTraitsList = [...allTraits]
  
  for (let i = 0; i < numTraits && availableTraitsList.length > 0; i++) {
    const idx = Math.floor(Math.random() * availableTraitsList.length)
    const trait = availableTraitsList.splice(idx, 1)[0]
    // Avoid conflicting traits
    if (trait === 'team_player' && traits.includes('lone_wolf')) continue
    if (trait === 'lone_wolf' && traits.includes('team_player')) continue
    if (trait === 'perfectionist' && traits.includes('fast_worker')) continue
    if (trait === 'fast_worker' && traits.includes('perfectionist')) continue
    traits.push(trait)
  }
  
  // Contract years
  const contractYears = role === 'technical_director' || role === 'chief_engineer' 
    ? 2 + Math.floor(Math.random() * 3)
    : 1 + Math.floor(Math.random() * 3)
  
  // Calculate salary
  const salary = calculateStaffSalary(role, skills, experience, reputation, tier)
  
  // Availability
  const availability = availableOnly ? 'available' : 
                      Math.random() > 0.7 ? 'under_contract' : 'available'
  
  // Team staff specific fields
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
  
  // Trait bonuses
  for (const trait of staff.traits) {
    if (trait === 'reliable') effectiveness *= 1.05
    if (trait === 'innovator') effectiveness *= 1.05
    if (trait === 'experienced') effectiveness *= 1.05
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

/**
 * Generate the initial world staff pool (150-200 members).
 * A mix of available and AI-employed staff across all roles and tiers.
 */
export function generateWorldStaffPool(
  currentYear: number,
  tier: TeamTier = 'amateur'
): WorldStaffMemberInit[] {
  const pool: WorldStaffMemberInit[] = []

  // Facility staff: ~100 members across roles
  const facilityRoles: FacilityStaffRole[] = [
    'aerodynamicist', 'structural_engineer', 'power_unit_engineer',
    'simulation_specialist', 'production_manager', 'marketing_manager',
    'junior_engineer', 'senior_engineer', 'department_head'
  ]

  // Generate ~11 per facility role = ~99 facility staff
  for (const role of facilityRoles) {
    const count = role === 'junior_engineer' ? 15 : 
                  role === 'department_head' ? 8 :
                  role === 'senior_engineer' ? 12 : 11
    for (let i = 0; i < count; i++) {
      const staff = generateFacilityStaff(role, tier, true)
      const retirementAge = 55 + Math.floor(Math.random() * 14) // 55-68
      
      // ~40% are employed by AI teams, ~60% available
      const statusRoll = Math.random()
      const status: 'available' | 'employed_ai' = statusRoll < 0.4 ? 'employed_ai' : 'available'
      const aiTeams = ['Red Bull Racing', 'Mercedes AMG', 'McLaren', 'Ferrari', 'Aston Martin', 
                       'Alpine', 'Williams', 'AlphaTauri', 'Alfa Romeo', 'Haas F1',
                       'Porsche Motorsport', 'BMW Motorsport', 'Toyota Gazoo Racing',
                       'Penske Racing', 'Andretti Autosport', 'Chip Ganassi Racing']
      
      pool.push({
        staff,
        status,
        employedBy: status === 'employed_ai' ? aiTeams[Math.floor(Math.random() * aiTeams.length)] : undefined,
        enteredPoolYear: currentYear - Math.floor(Math.random() * 10),
        retirementAge
      })
    }
  }

  // Team staff: ~80 members across roles
  const teamRoles: TeamStaffRole[] = [
    'chief_engineer', 'technical_director', 'strategist', 'race_engineer',
    'crew_chief', 'team_manager', 'pr_manager', 'data_analyst', 'performance_engineer'
  ]

  // Generate ~9 per team role = ~81 team staff
  for (const role of teamRoles) {
    const count = role === 'race_engineer' ? 12 :
                  role === 'data_analyst' ? 10 :
                  role === 'technical_director' ? 6 : 9
    for (let i = 0; i < count; i++) {
      const staff = generateTeamStaff(role, tier, true)
      const retirementAge = 55 + Math.floor(Math.random() * 14) // 55-68
      
      // ~40% are employed by AI teams
      const statusRoll = Math.random()
      const status: 'available' | 'employed_ai' = statusRoll < 0.4 ? 'employed_ai' : 'available'
      const aiTeams = ['Red Bull Racing', 'Mercedes AMG', 'McLaren', 'Ferrari', 'Aston Martin',
                       'Alpine', 'Williams', 'AlphaTauri', 'Alfa Romeo', 'Haas F1',
                       'Porsche Motorsport', 'BMW Motorsport', 'Toyota Gazoo Racing',
                       'Penske Racing', 'Andretti Autosport', 'Chip Ganassi Racing']
      
      pool.push({
        staff,
        status,
        employedBy: status === 'employed_ai' ? aiTeams[Math.floor(Math.random() * aiTeams.length)] : undefined,
        enteredPoolYear: currentYear - Math.floor(Math.random() * 10),
        retirementAge
      })
    }
  }

  console.log(`[WorldStaffPool] Generated initial pool of ${pool.length} members (${pool.filter(m => m.status === 'available').length} available)`)
  return pool
}
