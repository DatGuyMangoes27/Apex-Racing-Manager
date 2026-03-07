// ============================================
// TEAM FINANCIAL CONFIGURATION
// ============================================
// Central configuration for all team-level financial constants

import type { TeamTier } from '@/store/rivalStore'

// ============================================
// SERIES ENTRY FEES BY TIER
// ============================================

export interface EntryFeeConfig {
  tier: TeamTier
  baseFee: number
  variancePercent: number  // ±X% variance
}

// Realistic entry fees based on real-world series
// Entry = Club racing (Formula Vee, Caterham Academy)
// Amateur = Regional series (Ginetta, local GT4)  
// Semi-pro = National one-make (Carrera Cup, Super Trofeo)
// Professional = National touring (Stock Car feeder)
// Pro = Major national (Stock Car Brasil, GT World Challenge)
// Elite = Top endurance/touring (WEC, Supercars, IMSA)
// Pinnacle = F1-equivalent (Formula Ultimate)
export const ENTRY_FEES_BY_TIER: Record<TeamTier, EntryFeeConfig> = {
  entry: { tier: 'entry', baseFee: 15000, variancePercent: 20 },        // Club racing ~$10-20k
  amateur: { tier: 'amateur', baseFee: 50000, variancePercent: 20 },     // Regional ~$35-65k
  'semi-pro': { tier: 'semi-pro', baseFee: 175000, variancePercent: 25 }, // National one-make ~$125-225k
  professional: { tier: 'professional', baseFee: 400000, variancePercent: 25 }, // National pro ~$300-500k
  pro: { tier: 'pro', baseFee: 850000, variancePercent: 30 },           // Major national ~$600k-1.1M
  elite: { tier: 'elite', baseFee: 2000000, variancePercent: 30 },      // Top endurance ~$1.4-2.6M
  pinnacle: { tier: 'pinnacle', baseFee: 4500000, variancePercent: 25 } // F1-level ~$3.4-5.6M
}

export function calculateEntryFee(tier: TeamTier, seed?: number): number {
  const config = ENTRY_FEES_BY_TIER[tier]
  const random = seed !== undefined 
    ? ((seed % 1000) / 1000) 
    : Math.random()
  const variance = 1 + ((random - 0.5) * 2 * (config.variancePercent / 100))
  return Math.round(config.baseFee * variance / 1000) * 1000
}

// ============================================
// PRIZE MONEY POOLS BY TIER
// ============================================

export interface PrizePoolConfig {
  tier: TeamTier
  // Per-race payouts
  winBonus: number
  podiumBonus: number      // 2nd-3rd place
  pointsFinish: number     // 4th-10th (scaled)
  // Season-end championship payouts
  championBonus: number
  runnerUpBonus: number
  thirdPlaceBonus: number
  topFiveBonus: number     // 4th-5th
  topTenBonus: number      // 6th-10th
}

// Realistic prize money based on real-world payouts
// Entry = Minimal prizes, mostly trophies/exposure
// Amateur = Small cash prizes cover costs
// Semi-pro = Meaningful prizes to support campaigns
// Professional = Substantial income possible
// Pro = Strong financial incentives
// Elite = Major prize pools (WEC, Supercars-level)
// Pinnacle = F1-level payouts (massive TV/constructors fund)
export const PRIZE_POOLS_BY_TIER: Record<TeamTier, PrizePoolConfig> = {
  entry: {
    tier: 'entry',
    winBonus: 1500,           // Token prize
    podiumBonus: 750,
    pointsFinish: 300,
    championBonus: 15000,     // End of year recognition
    runnerUpBonus: 8000,
    thirdPlaceBonus: 5000,
    topFiveBonus: 2500,
    topTenBonus: 1000
  },
  amateur: {
    tier: 'amateur',
    winBonus: 4000,
    podiumBonus: 2000,
    pointsFinish: 800,
    championBonus: 50000,
    runnerUpBonus: 30000,
    thirdPlaceBonus: 20000,
    topFiveBonus: 10000,
    topTenBonus: 5000
  },
  'semi-pro': {
    tier: 'semi-pro',
    winBonus: 12000,          // Carrera Cup-level
    podiumBonus: 6000,
    pointsFinish: 2500,
    championBonus: 150000,
    runnerUpBonus: 90000,
    thirdPlaceBonus: 60000,
    topFiveBonus: 30000,
    topTenBonus: 15000
  },
  professional: {
    tier: 'professional',
    winBonus: 30000,
    podiumBonus: 15000,
    pointsFinish: 6000,
    championBonus: 400000,
    runnerUpBonus: 240000,
    thirdPlaceBonus: 160000,
    topFiveBonus: 80000,
    topTenBonus: 40000
  },
  pro: {
    tier: 'pro',
    winBonus: 65000,          // GT World Challenge-level
    podiumBonus: 32000,
    pointsFinish: 13000,
    championBonus: 850000,
    runnerUpBonus: 510000,
    thirdPlaceBonus: 340000,
    topFiveBonus: 170000,
    topTenBonus: 85000
  },
  elite: {
    tier: 'elite',
    winBonus: 175000,         // WEC/Supercars-level
    podiumBonus: 85000,
    pointsFinish: 35000,
    championBonus: 3500000,
    runnerUpBonus: 2100000,
    thirdPlaceBonus: 1400000,
    topFiveBonus: 700000,
    topTenBonus: 350000
  },
  pinnacle: {
    tier: 'pinnacle',
    winBonus: 750000,         // F1-level per race (~$1-2M per race in constructors fund)
    podiumBonus: 400000,
    pointsFinish: 150000,
    championBonus: 75000000,  // Constructors champion (~$140M but spread across positions)
    runnerUpBonus: 55000000,
    thirdPlaceBonus: 42000000,
    topFiveBonus: 28000000,
    topTenBonus: 15000000
  }
}

export function calculateRacePrizeMoney(
  position: number, 
  tier: TeamTier,
  _totalParticipants: number
): number {
  const config = PRIZE_POOLS_BY_TIER[tier]
  
  if (position === 1) return config.winBonus
  if (position <= 3) return config.podiumBonus
  if (position <= 10) {
    // Scale points finish bonus (4th gets more than 10th)
    const scale = (11 - position) / 7  // 1.0 for 4th, ~0.14 for 10th
    return Math.round(config.pointsFinish * scale)
  }
  return 0
}

export function calculateSeasonPrizeMoney(
  championshipPosition: number,
  tier: TeamTier
): number {
  const config = PRIZE_POOLS_BY_TIER[tier]
  
  if (championshipPosition === 1) return config.championBonus
  if (championshipPosition === 2) return config.runnerUpBonus
  if (championshipPosition === 3) return config.thirdPlaceBonus
  if (championshipPosition <= 5) return config.topFiveBonus
  if (championshipPosition <= 10) return config.topTenBonus
  return 0
}

// ============================================
// SERIES REVENUE (TV / PARTICIPATION MONEY)
// ============================================

export interface SeriesRevenueConfig {
  // Annual participation/TV revenue share for teams
  annualRevenue: number
  // How it's distributed: per-race or quarterly
  distributionType: 'per-race' | 'quarterly'
}

// Realistic series revenue based on real-world TV deals and participation payments
// Entry = Minimal/none - pay to play
// Amateur = Small revenue share from regional broadcasts
// Semi-pro = One-make series provide some TV/sponsor pool sharing
// Professional = National series TV deals provide meaningful revenue
// Pro = Major national series have substantial TV contracts
// Elite = WEC/IMSA/Supercars-level TV and participation revenue
// Pinnacle = F1-level (massive Column 1 payment ~$35-50M for participating)
export const SERIES_REVENUE_BY_TIER: Record<TeamTier, SeriesRevenueConfig> = {
  entry: { annualRevenue: 0, distributionType: 'quarterly' },                 // No TV money at club level
  amateur: { annualRevenue: 5000, distributionType: 'quarterly' },            // Token streaming revenue
  'semi-pro': { annualRevenue: 50000, distributionType: 'per-race' },         // One-make series pool
  professional: { annualRevenue: 200000, distributionType: 'per-race' },      // National TV deal share
  pro: { annualRevenue: 750000, distributionType: 'per-race' },               // Major national TV revenue
  elite: { annualRevenue: 3500000, distributionType: 'quarterly' },           // WEC/IMSA-level participation
  pinnacle: { annualRevenue: 45000000, distributionType: 'quarterly' }        // F1 Column 1 payment
}

/**
 * Calculate per-race series revenue
 * For per-race distribution, divides annual revenue by expected race count
 */
export function calculatePerRaceRevenue(tier: TeamTier, totalRaces: number): number {
  const config = SERIES_REVENUE_BY_TIER[tier]
  if (config.distributionType === 'per-race' && totalRaces > 0) {
    return Math.round(config.annualRevenue / totalRaces)
  }
  return 0
}

/**
 * Calculate quarterly series revenue
 * For quarterly distribution, divides annual revenue by 4
 */
export function calculateQuarterlyRevenue(tier: TeamTier): number {
  const config = SERIES_REVENUE_BY_TIER[tier]
  if (config.distributionType === 'quarterly') {
    return Math.round(config.annualRevenue / 4)
  }
  return 0
}

/**
 * Get the distribution type for a tier
 */
export function getSeriesRevenueDistribution(tier: TeamTier): 'per-race' | 'quarterly' {
  return SERIES_REVENUE_BY_TIER[tier].distributionType
}

// ============================================
// MANUFACTURER PAYMENTS
// ============================================

export interface ManufacturerPaymentConfig {
  // Works teams receive support
  worksAnnualSupport: Record<TeamTier, number>
  // Customer teams pay lease fees
  customerAnnualLease: Record<TeamTier, number>
}

// Realistic manufacturer support and customer lease values
// Works teams receive technical support, engines, development resources
// Customer teams pay for engines/powertrains and limited support
// F1 engine leases are ~$15-20M/year; support can be worth $30-50M+
export const MANUFACTURER_PAYMENTS: ManufacturerPaymentConfig = {
  worksAnnualSupport: {
    entry: 25000,             // Minimal factory support at club level
    amateur: 100000,          // Regional support programs
    'semi-pro': 350000,       // One-make series backing (Porsche Junior, etc.)
    professional: 1200000,    // National series factory programs
    pro: 4000000,             // Major factory GT programs
    elite: 12000000,          // LMDh/WEC factory backing
    pinnacle: 45000000        // F1 works team factory support value
  },
  customerAnnualLease: {
    entry: 10000,             // Basic engine lease
    amateur: 40000,           // Regional customer lease
    'semi-pro': 150000,       // Cup car lease programs
    professional: 450000,     // National series customer fee
    pro: 1500000,             // GT3 customer program
    elite: 5000000,           // LMDh customer lease
    pinnacle: 18000000        // F1 power unit lease (~$15-20M real world)
  }
}

export function getManufacturerPayment(
  tier: TeamTier,
  worksOrCustomer: 'works' | 'customer'
): number {
  if (worksOrCustomer === 'works') {
    return MANUFACTURER_PAYMENTS.worksAnnualSupport[tier]
  }
  return -MANUFACTURER_PAYMENTS.customerAnnualLease[tier]  // Negative = expense
}

// ============================================
// DEVELOPMENT / UPGRADE COSTS
// ============================================

export interface DevelopmentCostConfig {
  tier: TeamTier
  // Per-upgrade costs
  performanceUpgrade: { small: number; medium: number; large: number }
  reliabilityUpgrade: { small: number; medium: number; large: number }
  // Weekly R&D burn rate (base, scales with focus)
  weeklyRDBurnRate: number
}

// Realistic development costs
// Entry = Basic setup adjustments, affordable parts
// Pinnacle = F1-level aero packages ($5-20M each), complex hybrid systems
// Weekly R&D represents ongoing development work between upgrades
export const DEVELOPMENT_COSTS_BY_TIER: Record<TeamTier, DevelopmentCostConfig> = {
  entry: {
    tier: 'entry',
    performanceUpgrade: { small: 3500, medium: 12000, large: 28000 },    // Basic tuning
    reliabilityUpgrade: { small: 2500, medium: 8000, large: 20000 },
    weeklyRDBurnRate: 1200                                               // Minimal dev work
  },
  amateur: {
    tier: 'amateur',
    performanceUpgrade: { small: 12000, medium: 35000, large: 85000 },   // Aftermarket upgrades
    reliabilityUpgrade: { small: 8000, medium: 25000, large: 60000 },
    weeklyRDBurnRate: 4000
  },
  'semi-pro': {
    tier: 'semi-pro',
    performanceUpgrade: { small: 35000, medium: 100000, large: 250000 }, // Pro parts packages
    reliabilityUpgrade: { small: 25000, medium: 75000, large: 180000 },
    weeklyRDBurnRate: 12000
  },
  professional: {
    tier: 'professional',
    performanceUpgrade: { small: 90000, medium: 275000, large: 650000 }, // Factory-level
    reliabilityUpgrade: { small: 65000, medium: 195000, large: 475000 },
    weeklyRDBurnRate: 35000
  },
  pro: {
    tier: 'pro',
    performanceUpgrade: { small: 225000, medium: 675000, large: 1750000 }, // GT3/GTE level
    reliabilityUpgrade: { small: 160000, medium: 475000, large: 1200000 },
    weeklyRDBurnRate: 85000
  },
  elite: {
    tier: 'elite',
    performanceUpgrade: { small: 600000, medium: 1800000, large: 4500000 }, // WEC/LMDh level
    reliabilityUpgrade: { small: 420000, medium: 1260000, large: 3150000 },
    weeklyRDBurnRate: 220000
  },
  pinnacle: {
    tier: 'pinnacle',
    performanceUpgrade: { small: 2500000, medium: 7500000, large: 18000000 }, // F1 aero package
    reliabilityUpgrade: { small: 1750000, medium: 5250000, large: 12500000 },
    weeklyRDBurnRate: 1500000                                              // ~$78M/year dev spend
  }
}

export function getDevelopmentCost(
  tier: TeamTier,
  upgradeType: 'performance' | 'reliability',
  size: 'small' | 'medium' | 'large'
): number {
  const config = DEVELOPMENT_COSTS_BY_TIER[tier]
  return upgradeType === 'performance'
    ? config.performanceUpgrade[size]
    : config.reliabilityUpgrade[size]
}

// ============================================
// CAR MAINTENANCE COSTS
// ============================================

export interface MaintenanceCostConfig {
  // Weekly base maintenance (per car)
  weeklyBaseMaintenance: number
  // Post-race service cost (per car, per race)
  postRaceService: number
  // Repair costs for damage/wear
  minorRepair: number       // Small damage, quick fix
  majorRepair: number       // Significant damage, longer fix
  engineRebuild: number     // Complete engine work
  gearboxRebuild: number    // Gearbox overhaul
  // Component replacement costs
  tyreSetCost: number       // Per set (for practice/testing, races handled separately)
  brakePadsCost: number
  clutchReplaceCost: number
}

// Realistic maintenance costs based on tier
// Entry = Club cars, affordable maintenance
// Pinnacle = F1-level where even small components cost tens of thousands
export const MAINTENANCE_COSTS_BY_TIER: Record<TeamTier, MaintenanceCostConfig> = {
  entry: {
    weeklyBaseMaintenance: 250,
    postRaceService: 800,
    minorRepair: 500,
    majorRepair: 3000,
    engineRebuild: 8000,
    gearboxRebuild: 4000,
    tyreSetCost: 400,
    brakePadsCost: 200,
    clutchReplaceCost: 600
  },
  amateur: {
    weeklyBaseMaintenance: 750,
    postRaceService: 2500,
    minorRepair: 1500,
    majorRepair: 8000,
    engineRebuild: 25000,
    gearboxRebuild: 12000,
    tyreSetCost: 1200,
    brakePadsCost: 600,
    clutchReplaceCost: 2000
  },
  'semi-pro': {
    weeklyBaseMaintenance: 2500,
    postRaceService: 8000,
    minorRepair: 5000,
    majorRepair: 25000,
    engineRebuild: 75000,
    gearboxRebuild: 35000,
    tyreSetCost: 3500,
    brakePadsCost: 1800,
    clutchReplaceCost: 6000
  },
  professional: {
    weeklyBaseMaintenance: 7500,
    postRaceService: 22000,
    minorRepair: 15000,
    majorRepair: 65000,
    engineRebuild: 180000,
    gearboxRebuild: 85000,
    tyreSetCost: 8500,
    brakePadsCost: 4500,
    clutchReplaceCost: 15000
  },
  pro: {
    weeklyBaseMaintenance: 18000,
    postRaceService: 55000,
    minorRepair: 35000,
    majorRepair: 150000,
    engineRebuild: 400000,
    gearboxRebuild: 180000,
    tyreSetCost: 18000,
    brakePadsCost: 9500,
    clutchReplaceCost: 35000
  },
  elite: {
    weeklyBaseMaintenance: 45000,
    postRaceService: 140000,
    minorRepair: 85000,
    majorRepair: 380000,
    engineRebuild: 950000,
    gearboxRebuild: 420000,
    tyreSetCost: 42000,
    brakePadsCost: 22000,
    clutchReplaceCost: 85000
  },
  pinnacle: {
    weeklyBaseMaintenance: 180000,
    postRaceService: 550000,
    minorRepair: 250000,
    majorRepair: 1200000,
    engineRebuild: 4500000,      // F1 power units cost millions
    gearboxRebuild: 1800000,
    tyreSetCost: 150000,         // F1 tyre allocation is expensive
    brakePadsCost: 85000,
    clutchReplaceCost: 280000
  }
}

/**
 * Calculate weekly car maintenance costs for the team
 */
export function calculateWeeklyMaintenanceCost(
  tier: TeamTier,
  carCount: number,
  isRaceWeek: boolean = false
): number {
  const config = MAINTENANCE_COSTS_BY_TIER[tier]
  let cost = config.weeklyBaseMaintenance * carCount
  
  // Add post-race service cost if it's a race week
  if (isRaceWeek) {
    cost += config.postRaceService * carCount
  }
  
  return cost
}

/**
 * Calculate repair cost based on damage severity
 */
export function calculateRepairCost(
  tier: TeamTier,
  damageType: 'minor' | 'major' | 'engine' | 'gearbox'
): number {
  const config = MAINTENANCE_COSTS_BY_TIER[tier]
  switch (damageType) {
    case 'minor': return config.minorRepair
    case 'major': return config.majorRepair
    case 'engine': return config.engineRebuild
    case 'gearbox': return config.gearboxRebuild
  }
}

// ============================================
// FACILITY / OPERATIONAL COSTS
// ============================================

export interface FacilityCostConfig {
  tier: TeamTier
  weeklyOperationalCost: number      // Base weekly facility costs
  logisticsHubRental: number         // Per-week if renting a hub
}

// Realistic facility and logistics costs
// Entry = Garage/workshop rental, basic equipment
// Pinnacle = State-of-the-art factory, wind tunnel, simulators
// F1 teams spend ~$2-3M/week on operations; smaller teams much less
export const FACILITY_COSTS_BY_TIER: Record<TeamTier, FacilityCostConfig> = {
  entry: { tier: 'entry', weeklyOperationalCost: 1500, logisticsHubRental: 2500 },      // Small workshop
  amateur: { tier: 'amateur', weeklyOperationalCost: 4500, logisticsHubRental: 6500 },   // Dedicated garage
  'semi-pro': { tier: 'semi-pro', weeklyOperationalCost: 18000, logisticsHubRental: 25000 }, // Small facility
  professional: { tier: 'professional', weeklyOperationalCost: 55000, logisticsHubRental: 70000 }, // Mid-size HQ
  pro: { tier: 'pro', weeklyOperationalCost: 150000, logisticsHubRental: 180000 },       // Professional facility
  elite: { tier: 'elite', weeklyOperationalCost: 450000, logisticsHubRental: 550000 },   // Major team HQ
  pinnacle: { tier: 'pinnacle', weeklyOperationalCost: 2200000, logisticsHubRental: 800000 } // F1-level factory
}

// ============================================
// DRIVER SALARY RANGES BY TIER
// ============================================

export interface DriverSalaryConfig {
  // Monthly retainer (base salary paid regardless of races)
  monthlyRetainerRange: { min: number; max: number }
  // Per-race appearance fee
  perRaceFeeRange: { min: number; max: number }
  // Performance bonuses
  winBonusRange: { min: number; max: number }
  podiumBonusRange: { min: number; max: number }
}

// Realistic driver salary ranges based on tier
// Entry = Amateur drivers, often pay-to-drive or minimal pay
// Pinnacle = F1-level salaries (top drivers earn $20-50M+)
export const DRIVER_SALARY_BY_TIER: Record<TeamTier, DriverSalaryConfig> = {
  entry: {
    monthlyRetainerRange: { min: 0, max: 500 },          // Often unpaid at club level
    perRaceFeeRange: { min: 0, max: 200 },
    winBonusRange: { min: 100, max: 500 },
    podiumBonusRange: { min: 50, max: 250 }
  },
  amateur: {
    monthlyRetainerRange: { min: 0, max: 2000 },         // Small stipend possible
    perRaceFeeRange: { min: 0, max: 1000 },
    winBonusRange: { min: 500, max: 2000 },
    podiumBonusRange: { min: 250, max: 1000 }
  },
  'semi-pro': {
    monthlyRetainerRange: { min: 1000, max: 8000 },      // Meaningful pay starts here
    perRaceFeeRange: { min: 1500, max: 5000 },
    winBonusRange: { min: 2000, max: 8000 },
    podiumBonusRange: { min: 1000, max: 4000 }
  },
  professional: {
    monthlyRetainerRange: { min: 5000, max: 25000 },     // Livable salary
    perRaceFeeRange: { min: 5000, max: 15000 },
    winBonusRange: { min: 8000, max: 25000 },
    podiumBonusRange: { min: 4000, max: 12000 }
  },
  pro: {
    monthlyRetainerRange: { min: 15000, max: 80000 },    // Good professional salary
    perRaceFeeRange: { min: 15000, max: 50000 },
    winBonusRange: { min: 25000, max: 80000 },
    podiumBonusRange: { min: 10000, max: 40000 }
  },
  elite: {
    monthlyRetainerRange: { min: 50000, max: 350000 },   // Top-tier national/international
    perRaceFeeRange: { min: 50000, max: 200000 },
    winBonusRange: { min: 75000, max: 250000 },
    podiumBonusRange: { min: 30000, max: 100000 }
  },
  pinnacle: {
    monthlyRetainerRange: { min: 200000, max: 4000000 }, // F1-level ($2.4M-$48M/year)
    perRaceFeeRange: { min: 100000, max: 500000 },
    winBonusRange: { min: 200000, max: 1000000 },
    podiumBonusRange: { min: 75000, max: 400000 }
  }
}

/**
 * Calculate a realistic driver salary package based on tier and skill
 */
export function calculateDriverSalary(
  tier: TeamTier,
  skillLevel: number = 50  // 0-100 skill rating
): { monthlyRetainer: number; perRaceFee: number; winBonus: number; podiumBonus: number } {
  const config = DRIVER_SALARY_BY_TIER[tier]
  const skillMultiplier = 0.5 + (skillLevel / 100) * 1.0  // 0.5x to 1.5x based on skill
  
  return {
    monthlyRetainer: Math.round(
      (config.monthlyRetainerRange.min + 
        (config.monthlyRetainerRange.max - config.monthlyRetainerRange.min) * (skillLevel / 100)) * skillMultiplier / 100
    ) * 100,
    perRaceFee: Math.round(
      (config.perRaceFeeRange.min + 
        (config.perRaceFeeRange.max - config.perRaceFeeRange.min) * (skillLevel / 100)) * skillMultiplier / 100
    ) * 100,
    winBonus: Math.round(
      (config.winBonusRange.min + 
        (config.winBonusRange.max - config.winBonusRange.min) * (skillLevel / 100)) / 100
    ) * 100,
    podiumBonus: Math.round(
      (config.podiumBonusRange.min + 
        (config.podiumBonusRange.max - config.podiumBonusRange.min) * (skillLevel / 100)) / 100
    ) * 100
  }
}

// ============================================
// TEAM SPONSOR PAYMENT TIERS
// ============================================
// Team sponsors pay more than personal sponsors

export interface TeamSponsorPaymentTier {
  tier: 'local' | 'regional' | 'national' | 'international' | 'global'
  monthlyPaymentRange: { min: number; max: number }
  winBonusRange: { min: number; max: number }
  podiumBonusRange: { min: number; max: number }
  minTeamReputation: number
}

// Team sponsorship values tuned for slow-burn progression.
// Goal: avoid early snowballing and make top-tier brand status a 10-15 year arc.
export const TEAM_SPONSOR_TIERS: TeamSponsorPaymentTier[] = [
  {
    tier: 'local',
    monthlyPaymentRange: { min: 1200, max: 9000 },        // $14K-108K/year
    winBonusRange: { min: 500, max: 3500 },
    podiumBonusRange: { min: 250, max: 1800 },
    minTeamReputation: 0
  },
  {
    tier: 'regional',
    monthlyPaymentRange: { min: 6000, max: 24000 },       // $72K-288K/year
    winBonusRange: { min: 2500, max: 10000 },
    podiumBonusRange: { min: 1200, max: 5000 },
    minTeamReputation: 35
  },
  {
    tier: 'national',
    monthlyPaymentRange: { min: 18000, max: 65000 },      // $216K-780K/year
    winBonusRange: { min: 7000, max: 28000 },
    podiumBonusRange: { min: 3500, max: 14000 },
    minTeamReputation: 55
  },
  {
    tier: 'international',
    monthlyPaymentRange: { min: 60000, max: 180000 },     // $720K-2.2M/year
    winBonusRange: { min: 22000, max: 70000 },
    podiumBonusRange: { min: 11000, max: 35000 },
    minTeamReputation: 72
  },
  {
    tier: 'global',
    monthlyPaymentRange: { min: 140000, max: 500000 },    // $1.7M-6M/year (top-tier only)
    winBonusRange: { min: 50000, max: 180000 },
    podiumBonusRange: { min: 25000, max: 90000 },
    minTeamReputation: 88
  }
]

export function getTeamSponsorTierForReputation(reputation: number): TeamSponsorPaymentTier {
  // Find highest tier the team qualifies for
  const eligible = TEAM_SPONSOR_TIERS.filter(t => reputation >= t.minTeamReputation)
  return eligible[eligible.length - 1] || TEAM_SPONSOR_TIERS[0]
}

export interface SponsorPortfolioCapBand {
  maxReputation: number
  weeklyCap: number
}

// Weekly cap bands to keep sponsor income growth in line with long-term progression.
export const SPONSOR_WEEKLY_PORTFOLIO_CAPS: SponsorPortfolioCapBand[] = [
  { maxReputation: 35, weeklyCap: 12000 },
  { maxReputation: 45, weeklyCap: 22000 },
  { maxReputation: 60, weeklyCap: 38000 },
  { maxReputation: 75, weeklyCap: 70000 },
  { maxReputation: 85, weeklyCap: 110000 },
  { maxReputation: 100, weeklyCap: 180000 }
]

export function getSponsorWeeklyPortfolioCap(reputation: number): number {
  const safeRep = Math.max(0, Math.min(100, reputation))
  for (const band of SPONSOR_WEEKLY_PORTFOLIO_CAPS) {
    if (safeRep <= band.maxReputation) return band.weeklyCap
  }
  return SPONSOR_WEEKLY_PORTFOLIO_CAPS[SPONSOR_WEEKLY_PORTFOLIO_CAPS.length - 1].weeklyCap
}

// ============================================
// COST CAP CONFIGURATION
// ============================================

export interface CostCapConfig {
  tier: TeamTier
  hasCostCap: boolean
  capAmount?: number
  excludedCategories?: string[]  // Categories not counted toward cap
}

// Realistic cost caps based on real-world regulations
// Only major series have formal cost caps - F1's is $145M (2024)
// WEC and some GT series have Balance of Performance but no hard caps
// Entry/amateur series have no caps - spending is naturally limited
export const COST_CAP_BY_TIER: Record<TeamTier, CostCapConfig> = {
  entry: { tier: 'entry', hasCostCap: false },
  amateur: { tier: 'amateur', hasCostCap: false },
  'semi-pro': { tier: 'semi-pro', hasCostCap: false },
  professional: { tier: 'professional', hasCostCap: false }, // Most pro series don't have caps
  pro: { tier: 'pro', hasCostCap: true, capAmount: 15000000, excludedCategories: ['entry_fee', 'travel'] }, // GT3 series soft cap
  elite: { tier: 'elite', hasCostCap: true, capAmount: 45000000, excludedCategories: ['entry_fee', 'travel'] }, // WEC-style cap
  pinnacle: { tier: 'pinnacle', hasCostCap: true, capAmount: 145000000, excludedCategories: ['entry_fee', 'travel', 'manufacturer_lease'] } // F1 cost cap
}

// ============================================
// TRANSACTION CATEGORIES
// ============================================

export type TeamTransactionCategory =
  // Income
  | 'team_sponsor'           // Team sponsorship payments
  | 'prize_race'             // Per-race prize money
  | 'prize_championship'     // Season-end championship bonus
  | 'manufacturer_support'   // Works team support payments
  | 'series_revenue'         // TV/participation revenue
  // Expenses
  | 'entry_fee'              // Series entry costs
  | 'manufacturer_lease'     // Customer team lease payments
  | 'development'            // R&D and upgrade costs
  | 'travel'                 // Logistics costs per race
  | 'facilities'             // Base operational costs
  | 'salaries'               // Staff salaries (race & facility staff)
  | 'marketing'              // Marketing campaigns and activities
  | 'sponsor_event'          // Sponsor events and activations
  | 'sponsor_bonus'          // Sponsor bonus payments (on achievements)
  | 'car_maintenance'        // Car maintenance and repairs
  | 'repairs'                // Emergency repairs
  | 'other'                  // Miscellaneous
  // Loan-related
  | 'loan_disbursement'      // Receiving loan funds
  | 'loan_payment'           // Paying back loan principal
  | 'loan_interest'          // Interest payments on loans
  | 'credit_line_draw'       // Drawing from credit line
  | 'credit_line_repay'      // Repaying credit line
  | 'credit_line_fee'        // Credit line maintenance fees
  | 'investor_milestone_penalty' // Penalty for missing investor milestones
  // Investment-related
  | 'investment_purchase'    // Buying investments (stocks, property, business)
  | 'investment_sale'        // Selling investments
  | 'investment_income'      // Passive income from investments
  | 'dividend'               // Dividend payments
  | 'rental_income'          // Real estate rental income
  | 'business_revenue'       // Side business income
  | 'business_expense'       // Side business operating costs
  | 'equity_sale'            // Selling team equity
  // Merchandise-related
  | 'merchandise_sales'      // Revenue from merchandise
  | 'merchandise_production' // Cost to produce merchandise
  | 'merchandise_store_costs' // Store operating costs

export const TRANSACTION_CATEGORY_LABELS: Record<TeamTransactionCategory, string> = {
  team_sponsor: 'Team Sponsor',
  prize_race: 'Race Prize Money',
  prize_championship: 'Championship Prize',
  manufacturer_support: 'Manufacturer Support',
  series_revenue: 'Series Revenue',
  entry_fee: 'Series Entry Fee',
  manufacturer_lease: 'Manufacturer Lease',
  development: 'Development & R&D',
  travel: 'Travel & Logistics',
  facilities: 'Facility Operations',
  salaries: 'Staff Salaries',
  marketing: 'Marketing',
  sponsor_event: 'Sponsor Events',
  sponsor_bonus: 'Sponsor Bonuses',
  car_maintenance: 'Car Maintenance',
  repairs: 'Emergency Repairs',
  other: 'Other',
  loan_disbursement: 'Loan Disbursement',
  loan_payment: 'Loan Payment',
  loan_interest: 'Loan Interest',
  credit_line_draw: 'Credit Line Draw',
  credit_line_repay: 'Credit Line Repayment',
  credit_line_fee: 'Credit Line Fee',
  investor_milestone_penalty: 'Investor Penalty',
  investment_purchase: 'Investment Purchase',
  investment_sale: 'Investment Sale',
  investment_income: 'Investment Income',
  dividend: 'Dividend',
  rental_income: 'Rental Income',
  business_revenue: 'Business Revenue',
  business_expense: 'Business Expense',
  equity_sale: 'Equity Sale',
  merchandise_sales: 'Merchandise Sales',
  merchandise_production: 'Merchandise Production',
  merchandise_store_costs: 'Store Costs'
}

export const INCOME_CATEGORIES: TeamTransactionCategory[] = [
  'team_sponsor',
  'prize_race',
  'prize_championship',
  'manufacturer_support',
  'series_revenue'
]

export const EXPENSE_CATEGORIES: TeamTransactionCategory[] = [
  'entry_fee',
  'manufacturer_lease',
  'development',
  'travel',
  'facilities',
  'salaries',
  'marketing',
  'sponsor_event',
  'sponsor_bonus',
  'car_maintenance',
  'repairs',
  'other'
]

// ============================================
// HELPER: Format currency
// ============================================

export function formatCurrency(amount: number): string {
  // Defensive check for undefined/null/NaN
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '$0'
  }
  if (Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  } else if (Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount.toLocaleString()}`
}

// ============================================
// HELPER: Calculate annual budget estimate
// ============================================

export function estimateAnnualBudget(
  tier: TeamTier,
  worksOrCustomer: 'works' | 'customer',
  _carCount: number = 1,
  seriesCount: number = 1
): { income: number; expenses: number; net: number } {
  const facilityConfig = FACILITY_COSTS_BY_TIER[tier]
  const devConfig = DEVELOPMENT_COSTS_BY_TIER[tier]
  const prizeConfig = PRIZE_POOLS_BY_TIER[tier]
  
  // Estimate ~20 races per season
  const racesPerSeason = 20
  
  // Estimated income
  const estimatedWins = Math.floor(racesPerSeason * 0.1)  // 10% win rate estimate
  const estimatedPodiums = Math.floor(racesPerSeason * 0.2)  // 20% podium rate
  const estimatedPointsFinishes = Math.floor(racesPerSeason * 0.5)  // 50% points
  
  const raceIncome = (
    (estimatedWins * prizeConfig.winBonus) +
    (estimatedPodiums * prizeConfig.podiumBonus) +
    (estimatedPointsFinishes * prizeConfig.pointsFinish * 0.5)  // Average points payout
  )
  
  const manufacturerIncome = getManufacturerPayment(tier, worksOrCustomer)
  const championshipIncome = prizeConfig.topFiveBonus  // Conservative estimate
  
  const totalIncome = Math.max(0, raceIncome + manufacturerIncome + championshipIncome)
  
  // Estimated expenses
  const entryFees = calculateEntryFee(tier) * seriesCount
  const facilityExpenses = facilityConfig.weeklyOperationalCost * 52
  const developmentExpenses = devConfig.weeklyRDBurnRate * 52
  const manufacturerExpense = worksOrCustomer === 'customer' 
    ? MANUFACTURER_PAYMENTS.customerAnnualLease[tier] 
    : 0
  
  // Travel estimate: assume 15 races with moderate travel
  const travelExpenses = racesPerSeason * (facilityConfig.weeklyOperationalCost * 0.5)
  
  const totalExpenses = entryFees + facilityExpenses + developmentExpenses + manufacturerExpense + travelExpenses
  
  return {
    income: totalIncome,
    expenses: totalExpenses,
    net: totalIncome - totalExpenses
  }
}
