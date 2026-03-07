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
// FACILITY LEVELS (per-facility differentiation)
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

// Default (fallback) level curve – used when a facility has no per-type override
// weeklyMultiplier scales steeply: L5 costs ~10x L1 to operate
export const FACILITY_LEVELS: FacilityLevelConfig[] = [
  { level: 1, name: 'Basic',        description: 'Entry-level facilities with minimal capabilities',         rdBonus: 1.0,  staffSlots: 1, weeklyMultiplier: 1.0 },
  { level: 2, name: 'Standard',     description: 'Improved facilities with better equipment',                rdBonus: 1.1,  staffSlots: 1, weeklyMultiplier: 2.0 },
  { level: 3, name: 'Professional', description: 'Professional-grade facilities with modern tools',          rdBonus: 1.25, staffSlots: 2, weeklyMultiplier: 4.0 },
  { level: 4, name: 'Advanced',     description: 'State-of-the-art facilities with cutting-edge technology', rdBonus: 1.4,  staffSlots: 2, weeklyMultiplier: 7.0 },
  { level: 5, name: 'World-Class',  description: 'The best facilities money can buy - factory team standard', rdBonus: 1.6,  staffSlots: 3, weeklyMultiplier: 10.0 }
]

// ============================================
// Per-facility level overrides (Option B)
// Each facility gets its own curve for rdBonus, staffSlots, weeklyMultiplier.
// Aero/Chassis/Engine are the core R&D departments and scale up headcount.
// Sim is expensive but boosts all areas. Manufacturing/Marketing are support.
// ============================================

export const FACILITY_LEVEL_OVERRIDES: Partial<Record<FacilityType, FacilityLevelConfig[]>> = {
  aero: [
    { level: 1, name: 'Basic',        description: 'Small CFD workstation and scale model testing',          rdBonus: 1.0,  staffSlots: 1, weeklyMultiplier: 1.0 },
    { level: 2, name: 'Standard',     description: 'Upgraded CFD cluster and shared wind tunnel access',     rdBonus: 1.12, staffSlots: 2, weeklyMultiplier: 2.2 },
    { level: 3, name: 'Professional', description: 'Dedicated 50% wind tunnel and full CFD suite',           rdBonus: 1.28, staffSlots: 3, weeklyMultiplier: 5.0 },
    { level: 4, name: 'Advanced',     description: 'Full-time wind tunnel with rolling road and DES solvers', rdBonus: 1.45, staffSlots: 4, weeklyMultiplier: 8.5 },
    { level: 5, name: 'World-Class',  description: 'Dual wind tunnels, real-time CFD, and advanced flow-viz', rdBonus: 1.65, staffSlots: 6, weeklyMultiplier: 12.0 }
  ],
  chassis: [
    { level: 1, name: 'Basic',        description: 'Manual jigs and basic FEA analysis',                    rdBonus: 1.0,  staffSlots: 1, weeklyMultiplier: 1.0 },
    { level: 2, name: 'Standard',     description: 'CNC machining access and improved structural analysis', rdBonus: 1.10, staffSlots: 2, weeklyMultiplier: 1.8 },
    { level: 3, name: 'Professional', description: 'In-house composite lay-up and crash testing rig',       rdBonus: 1.25, staffSlots: 3, weeklyMultiplier: 3.5 },
    { level: 4, name: 'Advanced',     description: 'Autoclave, seven-post rig, and topology optimisation',  rdBonus: 1.42, staffSlots: 4, weeklyMultiplier: 6.0 },
    { level: 5, name: 'World-Class',  description: 'Full monocoque production, impact lab, and additive manufacturing', rdBonus: 1.62, staffSlots: 5, weeklyMultiplier: 9.0 }
  ],
  engine: [
    { level: 1, name: 'Basic',        description: 'Engine rebuild bench and basic dyno',                   rdBonus: 1.0,  staffSlots: 1, weeklyMultiplier: 1.0 },
    { level: 2, name: 'Standard',     description: 'Climate-controlled dyno cell and data acquisition',     rdBonus: 1.12, staffSlots: 2, weeklyMultiplier: 2.5 },
    { level: 3, name: 'Professional', description: 'Multi-cell dyno facility and ERS integration lab',      rdBonus: 1.28, staffSlots: 3, weeklyMultiplier: 5.5 },
    { level: 4, name: 'Advanced',     description: 'Transient dyno, combustion analysis, and flow bench',   rdBonus: 1.45, staffSlots: 4, weeklyMultiplier: 9.0 },
    { level: 5, name: 'World-Class',  description: 'Altitude chamber, PU test beds, and hybrid energy lab', rdBonus: 1.65, staffSlots: 6, weeklyMultiplier: 13.0 }
  ],
  sim: [
    { level: 1, name: 'Basic',        description: 'Desktop simulator with basic physics model',            rdBonus: 1.0,  staffSlots: 1, weeklyMultiplier: 1.0 },
    { level: 2, name: 'Standard',     description: 'Motion platform and improved tyre model',               rdBonus: 1.15, staffSlots: 1, weeklyMultiplier: 2.5 },
    { level: 3, name: 'Professional', description: 'Driver-in-the-loop simulator with G-force cueing',      rdBonus: 1.30, staffSlots: 2, weeklyMultiplier: 6.0 },
    { level: 4, name: 'Advanced',     description: 'Full-motion dome with real-time aero coupling',         rdBonus: 1.50, staffSlots: 3, weeklyMultiplier: 10.0 },
    { level: 5, name: 'World-Class',  description: 'F1-grade DiL simulator with digital twin integration',  rdBonus: 1.70, staffSlots: 4, weeklyMultiplier: 15.0 }
  ],
  manufacturing: [
    { level: 1, name: 'Basic',        description: 'Outsourced production with manual assembly',            rdBonus: 1.0,  staffSlots: 1, weeklyMultiplier: 1.0 },
    { level: 2, name: 'Standard',     description: '3-axis CNC and basic composite shop',                   rdBonus: 1.0,  staffSlots: 1, weeklyMultiplier: 1.8 },
    { level: 3, name: 'Professional', description: '5-axis CNC, autoclave, and in-house paint shop',        rdBonus: 1.0,  staffSlots: 2, weeklyMultiplier: 3.5 },
    { level: 4, name: 'Advanced',     description: 'Additive manufacturing, automated QC, and clean room',  rdBonus: 1.0,  staffSlots: 2, weeklyMultiplier: 6.0 },
    { level: 5, name: 'World-Class',  description: 'Lights-out CNC, robotic assembly, and full metrology',  rdBonus: 1.0,  staffSlots: 3, weeklyMultiplier: 8.0 }
  ],
  marketing: [
    { level: 1, name: 'Basic',        description: 'Social media presence and DIY content',                 rdBonus: 1.0,  staffSlots: 1, weeklyMultiplier: 1.0 },
    { level: 2, name: 'Standard',     description: 'Dedicated press officer and partner hospitality suite',  rdBonus: 1.0,  staffSlots: 1, weeklyMultiplier: 1.8 },
    { level: 3, name: 'Professional', description: 'Full media centre, CRM platform, and event team',       rdBonus: 1.0,  staffSlots: 2, weeklyMultiplier: 3.5 },
    { level: 4, name: 'Advanced',     description: 'Broadcast-quality content studio and analytics team',    rdBonus: 1.0,  staffSlots: 2, weeklyMultiplier: 5.5 },
    { level: 5, name: 'World-Class',  description: 'Global brand partnerships team and VIP hospitality wing', rdBonus: 1.0,  staffSlots: 3, weeklyMultiplier: 8.0 }
  ]
}

/**
 * Get the level config for a specific facility type and level.
 * Uses per-facility overrides if available, otherwise falls back to the default curve.
 * If a grade is provided, applies grade bonuses to rdBonus and staffSlots.
 */
export function getFacilityLevelConfig(level: number, facilityType?: FacilityType, grade?: TeamTier): FacilityLevelConfig {
  const clampedLevel = Math.max(MIN_FACILITY_LEVEL, Math.min(MAX_FACILITY_LEVEL, level))
  
  let config: FacilityLevelConfig
  if (facilityType) {
    const overrides = FACILITY_LEVEL_OVERRIDES[facilityType]
    if (overrides && overrides[clampedLevel - 1]) {
      config = overrides[clampedLevel - 1]
    } else {
      config = FACILITY_LEVELS[clampedLevel - 1]
    }
  } else {
    config = FACILITY_LEVELS[clampedLevel - 1]
  }
  
  // Apply grade bonuses if grade is provided
  if (grade) {
    const gradeBonus = FACILITY_GRADE_BONUSES[grade]
    if (gradeBonus) {
      return {
        ...config,
        rdBonus: config.rdBonus + gradeBonus.rdBonusAdd,
        staffSlots: config.staffSlots + gradeBonus.staffSlotsAdd
      }
    }
  }
  
  return config
}

// ============================================
// FACILITY GRADE SYSTEM
// ============================================
// Each facility has its own grade (independent of racing tier).
// Higher grades provide additive bonuses to R&D and extra staff slots.
// When a facility hits L5, it can be "rebuilt" to the next grade (resets to L1).
// Semi-pro L1 is better than amateur L5, rewarding the rebuild investment.

export interface FacilityGradeBonus {
  rdBonusAdd: number       // Added to level rdBonus (e.g., +0.70 means aero L1 goes 1.0 → 1.70)
  staffSlotsAdd: number    // Extra staff slots on top of level config
  description: string      // Display name for the grade (e.g., "Amateur-grade")
}

export const FACILITY_GRADE_BONUSES: Record<TeamTier, FacilityGradeBonus> = {
  entry:        { rdBonusAdd: -0.10, staffSlotsAdd: 0,  description: 'Garage-level' },
  amateur:      { rdBonusAdd: 0,     staffSlotsAdd: 0,  description: 'Amateur-grade' },
  'semi-pro':   { rdBonusAdd: 0.70,  staffSlotsAdd: 1,  description: 'Semi-pro-grade' },
  professional: { rdBonusAdd: 1.50,  staffSlotsAdd: 2,  description: 'Professional-grade' },
  pro:          { rdBonusAdd: 2.40,  staffSlotsAdd: 3,  description: 'Pro-grade' },
  elite:        { rdBonusAdd: 3.40,  staffSlotsAdd: 5,  description: 'Elite-grade' },
  pinnacle:     { rdBonusAdd: 4.50,  staffSlotsAdd: 7,  description: 'Pinnacle-grade' },
}

// Rebuild (grade transition) config — the cost & time to upgrade a facility to the next grade.
// The facility resets to L1 of the new grade, but with better baseline stats.
// Rebuild costs are per-facility and get multiplied by FACILITY_UPGRADE_MULTIPLIERS.
export interface FacilityGradeRebuildConfig {
  cost: number           // Base one-time cost per facility (before facility-type multiplier)
  durationWeeks: number  // Major construction project duration
  minReputation: number  // Team reputation needed to unlock this grade
}

export const FACILITY_GRADE_REBUILD: Partial<Record<TeamTier, FacilityGradeRebuildConfig>> = {
  // Can't rebuild TO entry or amateur (starting grades)
  'semi-pro':    { cost: 500000,      durationWeeks: 20, minReputation: 25 },
  professional:  { cost: 2000000,     durationWeeks: 30, minReputation: 40 },
  pro:           { cost: 8000000,     durationWeeks: 40, minReputation: 55 },
  elite:         { cost: 30000000,    durationWeeks: 52, minReputation: 70 },
  pinnacle:      { cost: 100000000,   durationWeeks: 65, minReputation: 85 },
}

/** Ordered list of facility grades for progression lookup */
export const FACILITY_GRADE_ORDER: TeamTier[] = ['entry', 'amateur', 'semi-pro', 'professional', 'pro', 'elite', 'pinnacle']

/** Get the next grade after the given grade (or null if at pinnacle) */
export function getNextFacilityGrade(currentGrade: TeamTier): TeamTier | null {
  const idx = FACILITY_GRADE_ORDER.indexOf(currentGrade)
  if (idx < 0 || idx >= FACILITY_GRADE_ORDER.length - 1) return null
  return FACILITY_GRADE_ORDER[idx + 1]
}

/** Get the rebuild config for upgrading TO a target grade */
export function getFacilityRebuildConfig(targetGrade: TeamTier): FacilityGradeRebuildConfig | null {
  return FACILITY_GRADE_REBUILD[targetGrade] ?? null
}

/** Calculate the rebuild cost for a specific facility type (applies per-facility multiplier) */
export function calculateFacilityRebuildCost(facilityType: FacilityType, targetGrade: TeamTier): number {
  const config = getFacilityRebuildConfig(targetGrade)
  if (!config) return 0
  const facilityMult = FACILITY_UPGRADE_MULTIPLIERS[facilityType] ?? 1.0
  return Math.round(config.cost * facilityMult)
}

// ============================================
// FACILITY CONDITION SYSTEM (Option C)
// ============================================
// Each facility has a condition (0-100%) that decays weekly and
// multiplies the facility's effectiveness. Spend cash or owner time
// to restore it.

export interface FacilityConditionConfig {
  /** Weekly decay rate (percentage points lost per week at level 1; higher levels decay slightly faster) */
  baseWeeklyDecay: number
  /** Minimum condition before a "critical" warning fires */
  criticalThreshold: number
  /** Cost to fully repair, per facility level (as fraction of base upgrade cost) */
  repairCostFraction: number
  /** Owner hours needed for a maintenance inspection */
  inspectionHours: number
}

export const FACILITY_CONDITION_CONFIG: FacilityConditionConfig = {
  baseWeeklyDecay: 1.5,
  criticalThreshold: 30,
  repairCostFraction: 0.05,
  inspectionHours: 2
}

/**
 * Calculate weekly condition decay for a facility
 * Higher-level facilities have slightly more to maintain
 */
export function getWeeklyConditionDecay(level: number): number {
  return FACILITY_CONDITION_CONFIG.baseWeeklyDecay + (level - 1) * 0.3
}

/**
 * Calculate repair cost for a facility based on tier and level
 */
export function calculateRepairCost(tier: TeamTier, level: number): number {
  const baseCost = FACILITY_OPERATIONAL_COSTS[tier]?.baseWeeklyCost ?? 750
  // Repair = ~2-4 weeks of operational cost depending on how run-down it is
  return Math.round(baseCost * level * 3)
}

/**
 * Get the effectiveness multiplier from condition (0.5 at 0%, 1.0 at 100%)
 */
export function getConditionEffectiveness(condition: number): number {
  const clamped = Math.max(0, Math.min(100, condition))
  return 0.5 + (clamped / 100) * 0.5
}

// ============================================
// FACILITY PROJECTS / PERKS (Option C)
// ============================================

export interface FacilityProject {
  id: string
  facilityType: FacilityType
  name: string
  description: string
  minLevel: number          // Facility must be at least this level to unlock
  cost: number              // One-time cost (multiplied by tier later)
  durationWeeks: number     // Weeks to complete
  cooldownWeeks: number     // Weeks before it can be run again (0 = one-time)
  effects: {
    rdSpeedBonus?: number         // Temporary R&D speed multiplier (e.g. 0.15 = +15%)
    reliabilityBonus?: number     // Temporary reliability improvement
    sponsorInterestBonus?: number // Temporary sponsor interest boost
    manufacturingSpeedBonus?: number // Temporary manufacturing speed boost
    conditionRestore?: number     // Restore this many condition points
  }
  effectDurationWeeks: number     // How long the bonus lasts after completion
}

export const FACILITY_PROJECTS: FacilityProject[] = [
  // AERO projects
  {
    id: 'aero_wind_tunnel_calibration',
    facilityType: 'aero',
    name: 'Wind Tunnel Calibration',
    description: 'Recalibrate wind tunnel instruments for maximum accuracy. Temporarily boosts aero R&D speed.',
    minLevel: 2,
    cost: 8000,
    durationWeeks: 2,
    cooldownWeeks: 12,
    effects: { rdSpeedBonus: 0.20 },
    effectDurationWeeks: 6
  },
  {
    id: 'aero_cfd_correlation_study',
    facilityType: 'aero',
    name: 'CFD Correlation Study',
    description: 'Deep correlation between CFD and track data. Permanent small boost to aero insight.',
    minLevel: 3,
    cost: 25000,
    durationWeeks: 4,
    cooldownWeeks: 0, // one-time
    effects: { rdSpeedBonus: 0.08 },
    effectDurationWeeks: 52 // essentially permanent for one season
  },
  // CHASSIS projects
  {
    id: 'chassis_crash_test_programme',
    facilityType: 'chassis',
    name: 'Crash Test Programme',
    description: 'Comprehensive crash testing to validate new designs. Improves chassis reliability.',
    minLevel: 2,
    cost: 12000,
    durationWeeks: 3,
    cooldownWeeks: 16,
    effects: { reliabilityBonus: 0.10, rdSpeedBonus: 0.10 },
    effectDurationWeeks: 8
  },
  {
    id: 'chassis_weight_reduction_study',
    facilityType: 'chassis',
    name: 'Weight Reduction Study',
    description: 'Optimise every component for minimum mass. Temporarily boosts chassis development.',
    minLevel: 4,
    cost: 40000,
    durationWeeks: 5,
    cooldownWeeks: 0,
    effects: { rdSpeedBonus: 0.15 },
    effectDurationWeeks: 10
  },
  // ENGINE projects
  {
    id: 'engine_dyno_marathon',
    facilityType: 'engine',
    name: 'Dyno Endurance Run',
    description: '1000-hour endurance test to map reliability limits. Boosts powertrain reliability.',
    minLevel: 2,
    cost: 15000,
    durationWeeks: 3,
    cooldownWeeks: 16,
    effects: { reliabilityBonus: 0.15 },
    effectDurationWeeks: 8
  },
  {
    id: 'engine_combustion_optimisation',
    facilityType: 'engine',
    name: 'Combustion Optimisation',
    description: 'Advanced combustion analysis for peak performance. Boosts powertrain R&D.',
    minLevel: 4,
    cost: 50000,
    durationWeeks: 6,
    cooldownWeeks: 0,
    effects: { rdSpeedBonus: 0.18 },
    effectDurationWeeks: 10
  },
  // SIM projects
  {
    id: 'sim_tyre_model_update',
    facilityType: 'sim',
    name: 'Tyre Model Update',
    description: 'Integrate latest tyre compound data into the simulator model. Boosts all R&D areas briefly.',
    minLevel: 2,
    cost: 6000,
    durationWeeks: 2,
    cooldownWeeks: 10,
    effects: { rdSpeedBonus: 0.12 },
    effectDurationWeeks: 6
  },
  {
    id: 'sim_digital_twin_sync',
    facilityType: 'sim',
    name: 'Digital Twin Synchronisation',
    description: 'Full digital twin correlation with physical car. Major but temporary R&D speed increase.',
    minLevel: 4,
    cost: 35000,
    durationWeeks: 4,
    cooldownWeeks: 0,
    effects: { rdSpeedBonus: 0.25 },
    effectDurationWeeks: 8
  },
  // MANUFACTURING projects
  {
    id: 'manufacturing_lean_audit',
    facilityType: 'manufacturing',
    name: 'Lean Manufacturing Audit',
    description: 'Process optimisation to reduce waste and speed up production.',
    minLevel: 2,
    cost: 5000,
    durationWeeks: 2,
    cooldownWeeks: 12,
    effects: { manufacturingSpeedBonus: 0.20 },
    effectDurationWeeks: 8
  },
  {
    id: 'manufacturing_quality_blitz',
    facilityType: 'manufacturing',
    name: 'Quality Control Blitz',
    description: 'Intensive QC programme. Improves part reliability and reduces defects.',
    minLevel: 3,
    cost: 18000,
    durationWeeks: 3,
    cooldownWeeks: 16,
    effects: { reliabilityBonus: 0.12, manufacturingSpeedBonus: 0.10 },
    effectDurationWeeks: 10
  },
  // MARKETING projects
  {
    id: 'marketing_media_blitz',
    facilityType: 'marketing',
    name: 'Media Blitz Campaign',
    description: 'Concentrated PR push to raise team profile and attract sponsors.',
    minLevel: 2,
    cost: 10000,
    durationWeeks: 2,
    cooldownWeeks: 10,
    effects: { sponsorInterestBonus: 0.25 },
    effectDurationWeeks: 6
  },
  {
    id: 'marketing_brand_refresh',
    facilityType: 'marketing',
    name: 'Brand Refresh',
    description: 'Complete rebrand with professional identity. Long-lasting sponsor interest boost.',
    minLevel: 4,
    cost: 45000,
    durationWeeks: 6,
    cooldownWeeks: 0,
    effects: { sponsorInterestBonus: 0.15 },
    effectDurationWeeks: 26 // half a season
  }
]

/**
 * Get available projects for a facility type and level
 */
export function getAvailableProjects(facilityType: FacilityType, level: number): FacilityProject[] {
  return FACILITY_PROJECTS.filter(p => p.facilityType === facilityType && p.minLevel <= level)
}

/**
 * Scale a project's cost by team tier
 */
export function getProjectCostForTier(project: FacilityProject, tier: TeamTier): number {
  const tierMultipliers: Record<TeamTier, number> = {
    entry: 0.3,
    amateur: 1.0,
    'semi-pro': 3.0,
    professional: 8.0,
    pro: 20.0,
    elite: 60.0,
    pinnacle: 200.0
  }
  return Math.round(project.cost * (tierMultipliers[tier] || 1.0))
}

// ============================================
// INTER-FACILITY SYNERGIES (Option C)
// ============================================
// Bonus R&D multiplier when related facilities are both at high levels.

export interface FacilitySynergy {
  id: string
  name: string
  description: string
  facilities: [FacilityType, FacilityType]
  /** Minimum average level of the two facilities to activate */
  minAvgLevel: number
  /** R&D bonus when active (additive, e.g. 0.05 = +5%) */
  rdBonus: number
  /** Which development areas benefit */
  affectedAreas: string[]
}

export const FACILITY_SYNERGIES: FacilitySynergy[] = [
  {
    id: 'synergy_aero_sim',
    name: 'Virtual Wind Tunnel',
    description: 'Strong aero + sim facilities enable CFD-to-track correlation, boosting aerodynamic development.',
    facilities: ['aero', 'sim'],
    minAvgLevel: 2,
    rdBonus: 0.08,
    affectedAreas: ['aerodynamics']
  },
  {
    id: 'synergy_chassis_sim',
    name: 'Virtual Crash Lab',
    description: 'Chassis and sim working together to simulate crash structures digitally before physical tests.',
    facilities: ['chassis', 'sim'],
    minAvgLevel: 3,
    rdBonus: 0.06,
    affectedAreas: ['chassis']
  },
  {
    id: 'synergy_engine_chassis',
    name: 'Integrated Powertrain',
    description: 'Close engine-chassis collaboration optimises packaging, weight, and cooling.',
    facilities: ['engine', 'chassis'],
    minAvgLevel: 3,
    rdBonus: 0.05,
    affectedAreas: ['powertrain', 'chassis']
  },
  {
    id: 'synergy_manufacturing_chassis',
    name: 'Rapid Prototyping',
    description: 'Manufacturing and chassis teams co-locate for faster iteration on structural parts.',
    facilities: ['manufacturing', 'chassis'],
    minAvgLevel: 2,
    rdBonus: 0.04,
    affectedAreas: ['chassis']
  },
  {
    id: 'synergy_aero_engine',
    name: 'Cooling Package Optimisation',
    description: 'Aero and engine departments jointly optimise cooling and drag, benefiting both areas.',
    facilities: ['aero', 'engine'],
    minAvgLevel: 3,
    rdBonus: 0.05,
    affectedAreas: ['aerodynamics', 'powertrain']
  },
  {
    id: 'synergy_sim_engine',
    name: 'Energy Strategy Modelling',
    description: 'Sim and engine teams model energy deployment for hybrid systems.',
    facilities: ['sim', 'engine'],
    minAvgLevel: 3,
    rdBonus: 0.06,
    affectedAreas: ['powertrain', 'electronics']
  }
]

/**
 * Get active synergies based on current facility levels
 */
export function getActiveSynergies(
  facilities: Record<FacilityType, number>
): FacilitySynergy[] {
  return FACILITY_SYNERGIES.filter(synergy => {
    const [f1, f2] = synergy.facilities
    const level1 = facilities[f1] || 1
    const level2 = facilities[f2] || 1
    const avgLevel = (level1 + level2) / 2
    return avgLevel >= synergy.minAvgLevel
  })
}

/**
 * Get total synergy bonus for a specific development area
 */
export function getSynergyBonus(
  developmentArea: string,
  facilities: Record<FacilityType, number>
): number {
  let bonus = 0
  const activeSynergies = getActiveSynergies(facilities)
  for (const synergy of activeSynergies) {
    if (synergy.affectedAreas.includes(developmentArea)) {
      bonus += synergy.rdBonus
    }
  }
  return bonus
}

// ============================================
// GLOBAL FACILITY STAFF CAP
// ============================================
// Realistic cap: team tier provides a base headcount, total facility levels add more.

export const FACILITY_STAFF_CAP_BY_TIER: Record<TeamTier, number> = {
  entry: 4,
  amateur: 8,
  'semi-pro': 14,
  professional: 22,
  pro: 32,
  elite: 45,
  pinnacle: 60
}

/**
 * Get the maximum number of facility staff a team can employ
 * Base from tier + 1 extra slot per 3 total facility levels above 6 (the baseline of all-level-1)
 */
export function getMaxFacilityStaff(tier: TeamTier, facilities: Record<FacilityType, number>): number {
  const baseCap = FACILITY_STAFF_CAP_BY_TIER[tier] || 8
  const totalLevels = FACILITY_TYPES.reduce((sum, ft) => sum + (facilities[ft] || 1), 0)
  const bonusFromLevels = Math.floor(Math.max(0, totalLevels - 6) / 3)
  return baseCap + bonusFromLevels
}

// ============================================
// UPGRADE COSTS BY TIER
// ============================================

export interface FacilityUpgradeCost {
  baseCost: number              // Base cost for Level 1->2
  levelMultiplier: number       // Cost multiplier per level (compounds)
  baseDuration: number          // Base weeks to complete L1->2 upgrade
  durationMultiplier: number    // Duration multiplier per level (compounds)
}

// Base upgrade costs by team tier
// Realistic progression: L1->L5 for a single facility should take 1-3 years
// Higher tiers have higher costs proportional to their budgets
export const FACILITY_UPGRADE_COSTS: Record<TeamTier, FacilityUpgradeCost> = {
  entry: {
    baseCost: 20000,
    levelMultiplier: 2.5,
    baseDuration: 6,
    durationMultiplier: 1.6
  },
  amateur: {
    baseCost: 75000,
    levelMultiplier: 2.2,
    baseDuration: 8,
    durationMultiplier: 1.5
  },
  'semi-pro': {
    baseCost: 250000,
    levelMultiplier: 2.2,
    baseDuration: 10,
    durationMultiplier: 1.5
  },
  professional: {
    baseCost: 750000,
    levelMultiplier: 2.3,
    baseDuration: 12,
    durationMultiplier: 1.5
  },
  pro: {
    baseCost: 2500000,
    levelMultiplier: 2.3,
    baseDuration: 14,
    durationMultiplier: 1.4
  },
  elite: {
    baseCost: 8000000,
    levelMultiplier: 2.4,
    baseDuration: 16,
    durationMultiplier: 1.4
  },
  pinnacle: {
    baseCost: 30000000,
    levelMultiplier: 2.5,
    baseDuration: 20,
    durationMultiplier: 1.4
  }
}

// ============================================
// MAX CONCURRENT UPGRADES BY TIER
// ============================================
// Smaller teams have limited construction crews / contractor access.
// Only pinnacle and elite teams can run 3 build-outs simultaneously.

export const MAX_CONCURRENT_UPGRADES: Record<TeamTier, number> = {
  entry: 1,
  amateur: 1,
  'semi-pro': 2,
  professional: 2,
  pro: 2,
  elite: 3,
  pinnacle: 3
}

/** Get the maximum number of concurrent facility upgrades for a given tier */
export function getMaxConcurrentUpgrades(tier: TeamTier): number {
  return MAX_CONCURRENT_UPGRADES[tier] ?? 1
}

/**
 * Calculate the cost to upgrade a facility from current level to next level.
 * The `tier` parameter represents the facility's grade (not the team's racing tier).
 */
export function calculateUpgradeCost(tier: TeamTier, currentLevel: number): number {
  if (currentLevel >= MAX_FACILITY_LEVEL) return 0
  
  const config = FACILITY_UPGRADE_COSTS[tier] || FACILITY_UPGRADE_COSTS['amateur']
  if (!config) return 75000 // Fallback if still undefined
  
  // Cost increases exponentially with level
  // Level 1->2: baseCost
  // Level 2->3: baseCost * levelMultiplier
  // Level 3->4: baseCost * levelMultiplier^2
  // etc.
  const cost = config.baseCost * Math.pow(config.levelMultiplier, currentLevel - 1)
  return Math.round(cost / 1000) * 1000 // Round to nearest 1000
}

/**
 * Calculate the duration (in weeks) for a facility upgrade.
 * Uses exponential scaling so higher levels take significantly longer.
 * The `tier` parameter represents the facility's grade (not the team's racing tier).
 * 
 * Amateur example: L1->2 = 8w, L2->3 = 12w, L3->4 = 18w, L4->5 = 27w
 */
export function calculateUpgradeDuration(tier: TeamTier, currentLevel: number): number {
  if (currentLevel >= MAX_FACILITY_LEVEL) return 0
  
  const config = FACILITY_UPGRADE_COSTS[tier] || FACILITY_UPGRADE_COSTS['amateur']
  if (!config) return 8 // Fallback if still undefined
  
  // Duration scales exponentially: baseDuration * durationMultiplier^(currentLevel-1)
  const duration = config.baseDuration * Math.pow(config.durationMultiplier, currentLevel - 1)
  return Math.round(duration)
}

// ============================================
// WEEKLY OPERATIONAL COSTS
// ============================================

export interface FacilityOperationalCost {
  baseWeeklyCost: number  // Cost per facility at level 1
}

// Base weekly operational cost per facility (at level 1)
// Actual cost = baseWeeklyCost * weeklyMultiplier[level] per facility
// These represent rent, utilities, equipment maintenance, consumables, and support staff
// Running high-level facilities is a major ongoing financial commitment
export const FACILITY_OPERATIONAL_COSTS: Record<TeamTier, FacilityOperationalCost> = {
  entry: { baseWeeklyCost: 800 },
  amateur: { baseWeeklyCost: 2500 },
  'semi-pro': { baseWeeklyCost: 10000 },
  professional: { baseWeeklyCost: 30000 },
  pro: { baseWeeklyCost: 80000 },
  elite: { baseWeeklyCost: 200000 },
  pinnacle: { baseWeeklyCost: 800000 }
}

// Per-facility operational cost multipliers
// A wind tunnel or engine dyno is far more expensive to run than a marketing office
export const FACILITY_OPERATIONAL_MULTIPLIERS: Record<FacilityType, number> = {
  aero: 1.4,           // Wind tunnels need massive power, compressed air, clean rooms
  chassis: 1.0,        // Baseline: FEA workstations, composite tools
  engine: 1.5,         // Dyno cells burn fuel and electricity constantly
  sim: 1.2,            // High-performance computing, cooling, electricity
  manufacturing: 1.3,  // CNC machines, raw materials, consumables
  marketing: 0.6       // Mostly people costs, office space — no heavy equipment
}

/**
 * Calculate weekly operational cost for a single facility.
 * Combines grade base cost × facility-type multiplier × level multiplier.
 * The `tier` parameter represents the facility's grade (not the team's racing tier).
 * 
 * Example at amateur-grade L1:
 *   Engine: $2,500 × 1.5 × 1.0 = $3,750/wk
 *   Marketing: $2,500 × 0.6 × 1.0 = $1,500/wk
 */
export function calculateFacilityWeeklyCost(tier: TeamTier, level: number, facilityType?: FacilityType): number {
  const baseCost = FACILITY_OPERATIONAL_COSTS[tier].baseWeeklyCost
  const levelConfig = getFacilityLevelConfig(level, facilityType)
  const facilityMult = facilityType ? (FACILITY_OPERATIONAL_MULTIPLIERS[facilityType] ?? 1.0) : 1.0
  return Math.round(baseCost * facilityMult * levelConfig.weeklyMultiplier)
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
    total += calculateFacilityWeeklyCost(tier, level, facilityType)
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
 * Get the R&D speed bonus for a development area based on facility level and grade.
 * Now uses per-facility level overrides. Grade bonus is applied via getFacilityLevelConfig.
 */
export function getFacilityRdBonus(facilityType: FacilityType, level: number, grade?: TeamTier): number {
  const levelConfig = getFacilityLevelConfig(level, facilityType, grade)
  return levelConfig.rdBonus
}

/**
 * Get the combined R&D bonus for a development area considering all relevant facilities,
 * including inter-facility synergies (Option C) and condition degradation.
 * Sim facility provides a smaller bonus (50% of its level bonus) to all areas.
 */
export function getCombinedRdBonus(
  developmentArea: string,
  facilities: Record<FacilityType, number>,
  conditions?: Record<FacilityType, number>,
  grades?: Record<FacilityType, TeamTier>
): number {
  let bonus = 1.0
  
  // Check primary facility for this area
  for (const [facilityType, areas] of Object.entries(FACILITY_RD_MAPPING)) {
    if (areas.includes(developmentArea)) {
      const level = facilities[facilityType as FacilityType] || 1
      const grade = grades?.[facilityType as FacilityType]
      let facilityBonus = getFacilityRdBonus(facilityType as FacilityType, level, grade)
      
      // Apply condition degradation if provided
      if (conditions) {
        const cond = conditions[facilityType as FacilityType] ?? 100
        facilityBonus = 1 + (facilityBonus - 1) * getConditionEffectiveness(cond)
      }
      
      if (facilityType === 'sim') {
        // Sim provides 50% of its bonus to all areas
        bonus *= 1 + (facilityBonus - 1) * 0.5
      } else {
        // Primary facilities provide full bonus
        bonus *= facilityBonus
      }
    }
  }
  
  // Apply inter-facility synergy bonus
  const synergyBonus = getSynergyBonus(developmentArea, facilities)
  bonus *= 1 + synergyBonus
  
  return bonus
}

/**
 * Get manufacturing bonus for upgrade completion time
 * Higher manufacturing level = faster upgrade completion
 * Level 1 = 1.0x (no bonus), Level 5 = ~0.60x time (40% faster)
 */
export function getManufacturingSpeedBonus(manufacturingLevel: number): number {
  // Explicit mapping for clear, meaningful progression
  const speedMap: Record<number, number> = {
    1: 1.0,    // No bonus
    2: 0.90,   // 10% faster
    3: 0.80,   // 20% faster
    4: 0.70,   // 30% faster
    5: 0.60    // 40% faster
  }
  return speedMap[Math.max(1, Math.min(5, manufacturingLevel))] ?? 1.0
}

/**
 * Get marketing facility bonus for sponsor attraction
 * Higher marketing level = higher sponsor interest multiplier
 * Returns a multiplier (e.g. 1.0 at level 1, 1.5 at level 5)
 */
export function getMarketingBonus(marketingLevel: number): number {
  // Explicit mapping for clear, meaningful sponsor attraction progression
  const marketingMap: Record<number, number> = {
    1: 1.0,    // Baseline
    2: 1.10,   // +10% sponsor interest
    3: 1.25,   // +25% sponsor interest
    4: 1.40,   // +40% sponsor interest
    5: 1.60    // +60% sponsor interest
  }
  return marketingMap[Math.max(1, Math.min(5, marketingLevel))] ?? 1.0
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
// UPGRADE REQUIREMENTS (with per-facility prerequisite chains)
// ============================================

export interface FacilityUpgradeRequirement {
  minTeamReputation?: number
  minTier?: TeamTier
  prerequisiteFacility?: { type: FacilityType; minLevel: number }
}

// Global requirements that apply to every facility at a given target level
// Even L2 requires some proven track record now
export const FACILITY_UPGRADE_REQUIREMENTS: Record<number, FacilityUpgradeRequirement> = {
  2: { minTeamReputation: 10 },
  3: { minTeamReputation: 30 },
  4: { minTeamReputation: 50, minTier: 'semi-pro' },
  5: { minTeamReputation: 70, minTier: 'professional' }
}

// Per-facility prerequisite chains (Option B).
// e.g. Sim Level 3 requires Aero at Level 2 AND Chassis at Level 2.
// Manufacturing Level 4 requires Chassis at Level 3.
export const FACILITY_PREREQUISITE_CHAINS: Record<FacilityType, Record<number, { type: FacilityType; minLevel: number }[]>> = {
  aero: {
    // Aero is a core department — no facility prereqs
  },
  chassis: {
    // Chassis is a core department — no facility prereqs
  },
  engine: {
    // Engine is a core department — no facility prereqs
  },
  sim: {
    // Sim Level 3 needs decent aero + chassis to correlate against
    3: [{ type: 'aero', minLevel: 2 }, { type: 'chassis', minLevel: 2 }],
    // Sim Level 5 needs engine data too
    5: [{ type: 'engine', minLevel: 3 }]
  },
  manufacturing: {
    // Manufacturing Level 4 needs chassis at 3 (you need composite understanding to automate)
    4: [{ type: 'chassis', minLevel: 3 }]
  },
  marketing: {
    // Marketing can be upgraded freely; no technical prereqs
  }
}

/**
 * Check if a facility upgrade is allowed (with per-facility prereqs)
 */
export function canUpgradeFacility(
  facilityType: FacilityType,
  currentLevel: number,
  teamReputation: number,
  teamTier: TeamTier,
  facilities: Record<FacilityType, number>
): { allowed: boolean; reason?: string } {
  if (currentLevel >= MAX_FACILITY_LEVEL) {
    return { allowed: false, reason: 'Facility already at maximum level' }
  }
  
  const targetLevel = currentLevel + 1
  
  // 1. Check global requirements for this level
  const globalReqs = FACILITY_UPGRADE_REQUIREMENTS[targetLevel]
  if (globalReqs) {
    if (globalReqs.minTeamReputation && teamReputation < globalReqs.minTeamReputation) {
      return { 
        allowed: false, 
        reason: `Requires team reputation of ${globalReqs.minTeamReputation} (current: ${Math.round(teamReputation)})` 
      }
    }
    
    if (globalReqs.minTier) {
      const tierOrder: TeamTier[] = ['entry', 'amateur', 'semi-pro', 'professional', 'pro', 'elite', 'pinnacle']
      const currentTierIndex = tierOrder.indexOf(teamTier)
      const requiredTierIndex = tierOrder.indexOf(globalReqs.minTier)
      
      if (currentTierIndex < requiredTierIndex) {
        return { 
          allowed: false, 
          reason: `Requires team tier of ${globalReqs.minTier} or higher` 
        }
      }
    }
    
    // Legacy single-prerequisite (kept for backwards compat)
    if (globalReqs.prerequisiteFacility) {
      const prereqLevel = facilities[globalReqs.prerequisiteFacility.type] || 1
      if (prereqLevel < globalReqs.prerequisiteFacility.minLevel) {
        return {
          allowed: false,
          reason: `Requires ${FACILITY_NAMES[globalReqs.prerequisiteFacility.type]} at level ${globalReqs.prerequisiteFacility.minLevel}`
        }
      }
    }
  }
  
  // 2. Check per-facility prerequisite chains
  const facilityChains = FACILITY_PREREQUISITE_CHAINS[facilityType]
  if (facilityChains) {
    // Check all levels up to and including the target
    for (let lvl = 2; lvl <= targetLevel; lvl++) {
      const prereqs = facilityChains[lvl]
      if (prereqs) {
        for (const prereq of prereqs) {
          const prereqLevel = facilities[prereq.type] || 1
          if (prereqLevel < prereq.minLevel) {
            return {
              allowed: false,
              reason: `Requires ${FACILITY_NAMES[prereq.type]} at level ${prereq.minLevel}`
            }
          }
        }
      }
    }
  }
  
  return { allowed: true }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a summary of facility stats for display.
 * The `tier` parameter now represents the facility's grade (not the team's racing tier).
 */
export function getFacilitySummary(
  facilityType: FacilityType,
  level: number,
  tier: TeamTier,
  grade?: TeamTier
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
  grade: TeamTier
  gradeDescription: string
} {
  const effectiveGrade = grade || tier
  const levelConfig = getFacilityLevelConfig(level, facilityType, effectiveGrade)
  const canUpgrade = level < MAX_FACILITY_LEVEL
  const gradeBonus = FACILITY_GRADE_BONUSES[effectiveGrade]
  
  return {
    name: FACILITY_NAMES[facilityType],
    level,
    levelName: levelConfig.name,
    description: levelConfig.description,
    rdBonus: levelConfig.rdBonus,
    staffSlots: levelConfig.staffSlots,
    weeklyCost: calculateFacilityWeeklyCost(effectiveGrade, level, facilityType),
    upgradeCost: canUpgrade ? calculateFacilityUpgradeCost(facilityType, level, effectiveGrade) : 0,
    upgradeDuration: canUpgrade ? getUpgradeDuration(facilityType, level, effectiveGrade) : 0,
    canUpgrade,
    grade: effectiveGrade,
    gradeDescription: gradeBonus?.description || 'Unknown-grade'
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

// Per-facility upgrade cost multipliers
// Building a wind tunnel or engine dyno facility is far more expensive
// than fitting out a marketing office
export const FACILITY_UPGRADE_MULTIPLIERS: Record<FacilityType, number> = {
  aero: 1.4,           // Civil engineering: wind tunnel construction, vibration isolation
  chassis: 1.0,        // Baseline: composite workshop, testing rigs
  engine: 1.5,         // Most expensive: dyno cells, fuel systems, vibration-proof foundations
  sim: 0.8,            // Mostly software licenses, electronics, and a dome structure
  manufacturing: 1.2,  // CNC machines, autoclaves, tooling
  marketing: 0.5       // Fit-out and furnishing — much cheaper than technical facilities
}

/**
 * Calculate upgrade cost with facility-specific variation.
 * 
 * Amateur L1->2 examples:
 *   Engine: $75K × 1.5 = $112.5K
 *   Marketing: $75K × 0.5 = $37.5K
 */
export function calculateFacilityUpgradeCost(
  facilityType: FacilityType, 
  currentLevel: number, 
  tier: TeamTier
): number {
  const baseCost = calculateUpgradeCost(tier, currentLevel)
  const facilityMult = FACILITY_UPGRADE_MULTIPLIERS[facilityType] ?? 1.0
  const rawCost = Math.round(baseCost * facilityMult)
  return applyFacilityCostPerk(rawCost)
}

/**
 * Get upgrade duration for a facility (with per-facility variation).
 * Delegates to calculateUpgradeDuration for the core exponential scaling,
 * then adds facility-specific construction time.
 * 
 * Amateur examples:
 *   Aero   L1->2 = 10w, L2->3 = 14w, L3->4 = 20w, L4->5 = 29w
 *   Sim    L1->2 = 8w,  L2->3 = 12w, L3->4 = 18w, L4->5 = 27w
 */
export function getUpgradeDuration(
  facilityType: FacilityType, 
  currentLevel: number,
  tier: TeamTier = 'amateur'
): number {
  // Core exponential duration from tier config
  const baseDuration = calculateUpgradeDuration(tier, currentLevel)
  
  // Facility-specific additions (physical construction complexity)
  const facilityAdditions: Record<FacilityType, number> = {
    aero: 2,        // Wind tunnels require civil engineering work
    chassis: 1,     // Structural rig installation
    engine: 2,      // Heavy machinery and vibration isolation
    sim: 0,         // Mostly software and electronics
    manufacturing: 1, // CNC and tooling installation
    marketing: 0     // Mostly fit-out and furnishing
  }
  return baseDuration + facilityAdditions[facilityType]
}

/**
 * Get the number of staff slots for a facility based on its level, type, and grade.
 * Uses per-facility overrides for realistic headcount.
 * Grade bonus adds extra slots on top of the level config.
 */
export function getFacilityStaffSlots(level: number, facilityType?: FacilityType, grade?: TeamTier): number {
  const config = getFacilityLevelConfig(level, facilityType, grade)
  return config.staffSlots
}

/**
 * Get facility R&D bonus (alias for getFacilityRdBonus).
 * Grade bonus is applied via getFacilityLevelConfig when grade is provided.
 */
export function getFacilityRDBonus(level: number, facilityType?: FacilityType, grade?: TeamTier): number {
  return getFacilityRdBonus(facilityType || 'aero', level, grade)
}

/**
 * Calculate total weekly facility costs.
 * Uses each facility's own grade (not team tier) for cost calculation.
 * Falls back to provided `tier` if facility has no grade.
 */
export function calculateTotalFacilityWeeklyCosts(
  facilities: Record<FacilityType, { level: number; grade?: TeamTier; upgradeInProgress?: boolean; rebuildInProgress?: boolean }>,
  tier: TeamTier
): number {
  let total = 0
  for (const facilityType of FACILITY_TYPES) {
    const facility = facilities[facilityType]
    if (facility) {
      const facilityGrade = facility.grade || tier
      total += calculateFacilityWeeklyCost(facilityGrade, facility.level, facilityType)
      // Add extra cost for ongoing upgrades or rebuilds
      if (facility.upgradeInProgress || facility.rebuildInProgress) {
        total += calculateFacilityWeeklyCost(facilityGrade, facility.level, facilityType) * 0.2
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
