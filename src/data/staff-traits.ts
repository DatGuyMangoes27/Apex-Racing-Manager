// ============================================
// STAFF TRAITS & SPECIALIZATIONS
// Definitions, effects, and display metadata for the staff job market
// ============================================

import type { StaffSpecialization, StaffPersonality, TeamStaffRole } from '@/store/careerStore'

// ============================================
// SPECIALIZATION DEFINITIONS
// ============================================

export interface SpecializationDef {
  id: StaffSpecialization
  name: string
  description: string
  rarity: 'common' | 'uncommon' | 'rare'
  compatibleRoles: TeamStaffRole[]
  primaryEffect: {
    type: 'development' | 'race' | 'operations' | 'morale'
    target: string
    bonus: number
  }
  incompatibleWith?: StaffSpecialization[]
}

export const STAFF_SPECIALIZATIONS: Record<StaffSpecialization, SpecializationDef> = {
  setup_wizard: {
    id: 'setup_wizard',
    name: 'Setup Wizard',
    description: 'Exceptional ability to optimize car setup for any track',
    rarity: 'rare',
    compatibleRoles: ['chief_engineer', 'technical_director', 'data_engineer'],
    primaryEffect: { type: 'development', target: 'setup_optimization', bonus: 15 },
    incompatibleWith: []
  },
  pit_master: {
    id: 'pit_master',
    name: 'Pit Master',
    description: 'Expert at organizing and executing lightning-fast pit stops',
    rarity: 'uncommon',
    compatibleRoles: ['crew_chief', 'strategist'],
    primaryEffect: { type: 'race', target: 'pit_stop_time', bonus: -10 }
  },
  data_analyst: {
    id: 'data_analyst',
    name: 'Data Analyst',
    description: 'Extracts deep insights from telemetry and simulation data',
    rarity: 'common',
    compatibleRoles: ['data_engineer', 'technical_director', 'chief_engineer'],
    primaryEffect: { type: 'development', target: 'telemetry_insights', bonus: 10 }
  },
  motivator: {
    id: 'motivator',
    name: 'Motivator',
    description: 'Natural leader who inspires the team to perform at their best',
    rarity: 'common',
    compatibleRoles: ['team_manager', 'crew_chief', 'pr_manager'],
    primaryEffect: { type: 'morale', target: 'team_morale', bonus: 5 }
  },
  cost_cutter: {
    id: 'cost_cutter',
    name: 'Cost Cutter',
    description: 'Finds efficiencies that reduce development and operational costs',
    rarity: 'uncommon',
    compatibleRoles: ['team_manager', 'technical_director'],
    primaryEffect: { type: 'operations', target: 'development_costs', bonus: -10 }
  },
  talent_scout: {
    id: 'talent_scout',
    name: 'Talent Scout',
    description: 'Keen eye for identifying promising drivers and staff',
    rarity: 'uncommon',
    compatibleRoles: ['team_manager', 'pr_manager'],
    primaryEffect: { type: 'operations', target: 'driver_evaluation', bonus: 15 }
  },
  media_savvy: {
    id: 'media_savvy',
    name: 'Media Savvy',
    description: 'Excellent at building brand presence and attracting sponsors',
    rarity: 'uncommon',
    compatibleRoles: ['pr_manager', 'team_manager'],
    primaryEffect: { type: 'operations', target: 'sponsor_attraction', bonus: 15 }
  },
  tire_whisperer: {
    id: 'tire_whisperer',
    name: 'Tire Whisperer',
    description: 'Deep understanding of tire behavior and management strategies',
    rarity: 'rare',
    compatibleRoles: ['chief_engineer', 'strategist', 'data_engineer'],
    primaryEffect: { type: 'race', target: 'tire_management', bonus: 10 }
  },
  reliability_guru: {
    id: 'reliability_guru',
    name: 'Reliability Guru',
    description: 'Obsessive attention to detail that prevents mechanical failures',
    rarity: 'rare',
    compatibleRoles: ['chief_engineer', 'crew_chief', 'technical_director'],
    primaryEffect: { type: 'race', target: 'mechanical_failure_rate', bonus: -15 }
  },
  aero_specialist: {
    id: 'aero_specialist',
    name: 'Aero Specialist',
    description: 'Advanced aerodynamics knowledge accelerating downforce development',
    rarity: 'rare',
    compatibleRoles: ['technical_director', 'chief_engineer', 'data_engineer'],
    primaryEffect: { type: 'development', target: 'aero_rd_speed', bonus: 20 }
  }
}

// ============================================
// PERSONALITY DEFINITIONS
// ============================================

export interface PersonalityDef {
  id: StaffPersonality
  name: string
  description: string
  salaryModifier: number
  loyaltyModifier: number
  negotiationStyle: string
}

export const STAFF_PERSONALITIES: Record<StaffPersonality, PersonalityDef> = {
  ambitious: {
    id: 'ambitious',
    name: 'Ambitious',
    description: 'Driven to succeed, expects rapid career progression',
    salaryModifier: 1.15,
    loyaltyModifier: -10,
    negotiationStyle: 'aggressive'
  },
  loyal: {
    id: 'loyal',
    name: 'Loyal',
    description: 'Values stability and long-term relationships',
    salaryModifier: 0.95,
    loyaltyModifier: 20,
    negotiationStyle: 'cooperative'
  },
  demanding: {
    id: 'demanding',
    name: 'Demanding',
    description: 'Expects the best resources and compensation',
    salaryModifier: 1.25,
    loyaltyModifier: -5,
    negotiationStyle: 'tough'
  },
  flexible: {
    id: 'flexible',
    name: 'Flexible',
    description: 'Adaptable and easy to work with',
    salaryModifier: 1.0,
    loyaltyModifier: 10,
    negotiationStyle: 'balanced'
  }
}

// ============================================
// ROLE SALARY RANGES
// ============================================

export interface RoleSalaryRange {
  name: string
  minSalary: number
  maxSalary: number
  signingBonusRange: [number, number]
}

export const ROLE_SALARY_RANGES: Record<TeamStaffRole, RoleSalaryRange> = {
  chief_engineer: { name: 'Chief Engineer', minSalary: 5000, maxSalary: 25000, signingBonusRange: [10000, 50000] },
  technical_director: { name: 'Technical Director', minSalary: 8000, maxSalary: 35000, signingBonusRange: [15000, 75000] },
  strategist: { name: 'Strategist', minSalary: 4000, maxSalary: 20000, signingBonusRange: [8000, 40000] },
  team_manager: { name: 'Team Manager', minSalary: 6000, maxSalary: 28000, signingBonusRange: [12000, 60000] },
  pr_manager: { name: 'PR Manager', minSalary: 3000, maxSalary: 15000, signingBonusRange: [5000, 25000] },
  crew_chief: { name: 'Crew Chief', minSalary: 3500, maxSalary: 18000, signingBonusRange: [6000, 30000] },
  data_engineer: { name: 'Data Engineer', minSalary: 4000, maxSalary: 22000, signingBonusRange: [8000, 35000] },
  reserve_driver: { name: 'Reserve Driver', minSalary: 2000, maxSalary: 12000, signingBonusRange: [3000, 15000] }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getSpecializationsForRole(role: TeamStaffRole): StaffSpecialization[] {
  return (Object.values(STAFF_SPECIALIZATIONS) as SpecializationDef[])
    .filter(s => s.compatibleRoles.includes(role))
    .map(s => s.id)
}

export function calculateBaseSalary(
  role: TeamStaffRole,
  reputation: number,
  personality: StaffPersonality,
  specializations: StaffSpecialization[]
): number {
  const range = ROLE_SALARY_RANGES[role]
  const baseSalary = range.minSalary + (range.maxSalary - range.minSalary) * (reputation / 100)

  // Personality modifier
  const personalityMod = STAFF_PERSONALITIES[personality].salaryModifier

  // Specialization bonus (rare specs = higher salary)
  let specBonus = 1.0
  for (const specId of specializations) {
    const spec = STAFF_SPECIALIZATIONS[specId]
    if (spec.rarity === 'rare') specBonus += 0.15
    else if (spec.rarity === 'uncommon') specBonus += 0.08
    else specBonus += 0.03
  }

  return Math.round(baseSalary * personalityMod * specBonus)
}

export function getSpecializationsByRarity(rarity: 'common' | 'uncommon' | 'rare'): StaffSpecialization[] {
  return (Object.values(STAFF_SPECIALIZATIONS) as SpecializationDef[])
    .filter(s => s.rarity === rarity)
    .map(s => s.id)
}

export function checkPersonalityChemistry(
  personality1: StaffPersonality,
  personality2: StaffPersonality
): 'positive' | 'negative' | 'neutral' {
  // Positive combinations
  if (personality1 === 'loyal' && personality2 === 'flexible') return 'positive'
  if (personality1 === 'flexible' && personality2 === 'loyal') return 'positive'
  if (personality1 === 'ambitious' && personality2 === 'ambitious') return 'positive'

  // Negative combinations
  if (personality1 === 'demanding' && personality2 === 'demanding') return 'negative'
  if (personality1 === 'ambitious' && personality2 === 'demanding') return 'negative'
  if (personality1 === 'demanding' && personality2 === 'ambitious') return 'negative'

  return 'neutral'
}

// ============================================
// NAME / NATIONALITY DATA (legacy)
// ============================================

export const STAFF_FIRST_NAMES = [
  'James', 'Michael', 'David', 'Robert', 'John', 'William', 'Richard', 'Thomas',
  'Marco', 'Luca', 'Pierre', 'Jean', 'Klaus', 'Hans', 'Carlos', 'Fernando',
  'Sarah', 'Emma', 'Anna', 'Maria', 'Sophie', 'Laura', 'Rachel', 'Claire'
]

export const STAFF_LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rossi', 'Müller', 'Dubois', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore',
  'Tanaka', 'Nakamura', 'Petrov', 'Johansson', 'Fischer', 'Weber', 'Costa', 'Silva'
]

export const STAFF_NATIONALITIES = [
  'British', 'American', 'Italian', 'German', 'French', 'Spanish',
  'Japanese', 'Brazilian', 'Australian', 'Dutch', 'Austrian', 'Swiss',
  'Canadian', 'Mexican', 'Swedish', 'Finnish'
]

export const STAFF_ACHIEVEMENTS = [
  'Championship Winner', 'Rookie of the Year', 'Engineering Excellence Award',
  'Cost Efficiency Award', 'Innovation Prize', 'Best Pit Crew',
  'Fastest Pit Stop Record', 'Development Breakthrough', 'Safety Innovation',
  'Team Spirit Award', 'Most Improved Team', 'Technical Innovation'
]
