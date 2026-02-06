// ============================================
// SPARE PARTS CONFIGURATION
// ============================================
// Lead times, costs, shipping rates, and thresholds for
// the spare parts logistics system

import type { TeamTier } from '@/store/rivalStore'
import type { ManufacturerTier } from './manufacturers'
import type { WorldRegion } from './travel-logistics'

// ============================================
// SPARE PART TYPES
// ============================================

export type SparePartType = 'engine' | 'chassis' | 'brakes' | 'suspension' | 'gearbox'

export const SPARE_PART_TYPES: SparePartType[] = ['engine', 'chassis', 'brakes', 'suspension', 'gearbox']

export const SPARE_PART_NAMES: Record<SparePartType, string> = {
  engine: 'Engine',
  chassis: 'Chassis',
  brakes: 'Brakes',
  suspension: 'Suspension',
  gearbox: 'Gearbox'
}

export const SPARE_PART_ICONS: Record<SparePartType, string> = {
  engine: 'Gauge',
  chassis: 'Car',
  brakes: 'CircleDot',
  suspension: 'ArrowUpDown',
  gearbox: 'Cog'
}

// ============================================
// SHIPPING CONFIGURATION
// ============================================

export type ShippingMethod = 'standard' | 'express' | 'air_freight'

export interface ShippingMethodConfig {
  id: ShippingMethod
  name: string
  description: string
  costMultiplier: number
  // Time multiplier (lower = faster, applied to base transit time)
  timeMultiplier: number
}

export const SHIPPING_METHODS: Record<ShippingMethod, ShippingMethodConfig> = {
  standard: {
    id: 'standard',
    name: 'Standard Freight',
    description: 'Ground/sea shipping - economical but slow',
    costMultiplier: 1.0,
    timeMultiplier: 1.0
  },
  express: {
    id: 'express',
    name: 'Express Freight',
    description: 'Priority shipping - faster delivery',
    costMultiplier: 2.5,
    timeMultiplier: 0.5
  },
  air_freight: {
    id: 'air_freight',
    name: 'Air Freight',
    description: 'Emergency air shipping - extremely fast but very expensive',
    costMultiplier: 5.0,
    timeMultiplier: 0.15
  }
}

// Base transit times in weeks based on region distance
export type RegionDistanceCategory = 'same_region' | 'adjacent' | 'cross_continental' | 'opposite_hemisphere'

export const BASE_TRANSIT_TIMES: Record<RegionDistanceCategory, number> = {
  same_region: 1,           // 1 week
  adjacent: 2,              // 2 weeks
  cross_continental: 4,     // 4 weeks
  opposite_hemisphere: 6    // 6 weeks
}

// Map region pairs to distance categories
export function getRegionDistanceCategory(from: WorldRegion, to: WorldRegion): RegionDistanceCategory {
  if (from === to) return 'same_region'
  
  // Define adjacent regions
  const adjacentRegions: Record<WorldRegion, WorldRegion[]> = {
    western_europe: ['eastern_europe', 'middle_east', 'africa'],
    eastern_europe: ['western_europe', 'middle_east', 'asia_pacific'],
    north_america: ['south_america'],
    south_america: ['north_america', 'africa'],
    asia_pacific: ['eastern_europe', 'middle_east', 'oceania'],
    middle_east: ['western_europe', 'eastern_europe', 'asia_pacific', 'africa'],
    oceania: ['asia_pacific'],
    africa: ['western_europe', 'middle_east', 'south_america']
  }
  
  if (adjacentRegions[from]?.includes(to)) return 'adjacent'
  
  // Opposite hemisphere detection
  const northernRegions: WorldRegion[] = ['western_europe', 'eastern_europe', 'north_america', 'asia_pacific', 'middle_east']
  const southernRegions: WorldRegion[] = ['south_america', 'oceania', 'africa']
  
  const fromNorth = northernRegions.includes(from)
  const toNorth = northernRegions.includes(to)
  const fromSouth = southernRegions.includes(from)
  const toSouth = southernRegions.includes(to)
  
  // Cross-continental within same hemisphere or mixed
  if ((fromNorth && toNorth) || (fromSouth && toSouth)) {
    return 'cross_continental'
  }
  
  // Opposite hemispheres
  return 'opposite_hemisphere'
}

// Calculate transit time in weeks
export function calculateTransitTime(
  from: WorldRegion,
  to: WorldRegion,
  method: ShippingMethod
): number {
  const category = getRegionDistanceCategory(from, to)
  const baseTime = BASE_TRANSIT_TIMES[category]
  const methodConfig = SHIPPING_METHODS[method]
  
  // Round up to nearest 0.5 weeks (minimum 0.5 weeks for any shipment)
  const transitTime = Math.max(0.5, Math.ceil(baseTime * methodConfig.timeMultiplier * 2) / 2)
  return transitTime
}

// Base shipping cost per part type (weight-based)
export const BASE_SHIPPING_COSTS: Record<SparePartType, number> = {
  brakes: 500,
  suspension: 800,
  gearbox: 1500,
  engine: 2500,
  chassis: 4000
}

// Calculate shipping cost for a part
export function calculateShippingCost(
  partType: SparePartType,
  from: WorldRegion,
  to: WorldRegion,
  method: ShippingMethod
): number {
  const baseCost = BASE_SHIPPING_COSTS[partType]
  const methodConfig = SHIPPING_METHODS[method]
  const category = getRegionDistanceCategory(from, to)
  
  // Distance multiplier
  const distanceMultipliers: Record<RegionDistanceCategory, number> = {
    same_region: 1.0,
    adjacent: 1.5,
    cross_continental: 2.0,
    opposite_hemisphere: 2.5
  }
  
  const totalCost = baseCost * methodConfig.costMultiplier * distanceMultipliers[category]
  return Math.round(totalCost)
}

// ============================================
// MANUFACTURING CONFIGURATION
// ============================================

export interface ManufacturingConfig {
  partType: SparePartType
  baseWeeks: number           // Time at level 1 manufacturing facility
  level5Weeks: number         // Time at level 5 manufacturing facility
  baseMaterialCost: number    // Material cost (% of part purchase price)
  laborCostPerWeek: number    // Additional labor cost per week
  baseQuality: number         // Base quality range minimum
  qualityRange: number        // Quality variance (+/- this amount)
}

export const MANUFACTURING_CONFIG: Record<SparePartType, ManufacturingConfig> = {
  brakes: {
    partType: 'brakes',
    baseWeeks: 1,
    level5Weeks: 0.5,
    baseMaterialCost: 0.4,    // 40% of purchase price
    laborCostPerWeek: 500,
    baseQuality: 85,
    qualityRange: 5
  },
  suspension: {
    partType: 'suspension',
    baseWeeks: 2,
    level5Weeks: 1,
    baseMaterialCost: 0.45,
    laborCostPerWeek: 750,
    baseQuality: 82,
    qualityRange: 5
  },
  gearbox: {
    partType: 'gearbox',
    baseWeeks: 3,
    level5Weeks: 1.5,
    baseMaterialCost: 0.5,
    laborCostPerWeek: 1000,
    baseQuality: 80,
    qualityRange: 5
  },
  engine: {
    partType: 'engine',
    baseWeeks: 5,
    level5Weeks: 2.5,
    baseMaterialCost: 0.55,
    laborCostPerWeek: 1500,
    baseQuality: 78,
    qualityRange: 5
  },
  chassis: {
    partType: 'chassis',
    baseWeeks: 6,
    level5Weeks: 3,
    baseMaterialCost: 0.6,
    laborCostPerWeek: 2000,
    baseQuality: 75,
    qualityRange: 5
  }
}

// Calculate manufacturing time based on facility level (1-5)
export function calculateManufacturingTime(partType: SparePartType, facilityLevel: number): number {
  const config = MANUFACTURING_CONFIG[partType]
  const clampedLevel = Math.max(1, Math.min(5, facilityLevel))
  
  // Linear interpolation between base and level 5 times
  const timeDiff = config.baseWeeks - config.level5Weeks
  const levelProgress = (clampedLevel - 1) / 4  // 0 at level 1, 1 at level 5
  
  return Math.max(0.5, config.baseWeeks - (timeDiff * levelProgress))
}

// Calculate manufacturing quality based on facility level
export function calculateManufacturingQuality(partType: SparePartType, facilityLevel: number): number {
  const config = MANUFACTURING_CONFIG[partType]
  const clampedLevel = Math.max(1, Math.min(5, facilityLevel))
  
  // Quality improves with facility level (+2% per level)
  const levelBonus = (clampedLevel - 1) * 2
  const baseQuality = config.baseQuality + levelBonus
  
  // Add random variance
  const variance = (Math.random() * 2 - 1) * config.qualityRange
  
  return Math.round(Math.max(50, Math.min(100, baseQuality + variance)))
}

// Calculate manufacturing cost
export function calculateManufacturingCost(
  partType: SparePartType,
  purchasePrice: number,
  facilityLevel: number
): number {
  const config = MANUFACTURING_CONFIG[partType]
  const manufacturingTime = calculateManufacturingTime(partType, facilityLevel)
  
  const materialCost = purchasePrice * config.baseMaterialCost
  const laborCost = manufacturingTime * config.laborCostPerWeek
  
  return Math.round(materialCost + laborCost)
}

// ============================================
// MANUFACTURER ORDER CONFIGURATION
// ============================================

export interface ManufacturerOrderConfig {
  tier: ManufacturerTier
  standardLeadWeeks: number
  rushLeadWeeks: number
  rushCostMultiplier: number
  qualityGuarantee: number    // Minimum quality %
}

export const MANUFACTURER_ORDER_CONFIG: Record<ManufacturerTier, ManufacturerOrderConfig> = {
  budget: {
    tier: 'budget',
    standardLeadWeeks: 3,
    rushLeadWeeks: 1.5,
    rushCostMultiplier: 2.0,
    qualityGuarantee: 90
  },
  mainstream: {
    tier: 'mainstream',
    standardLeadWeeks: 2,
    rushLeadWeeks: 1,
    rushCostMultiplier: 2.0,
    qualityGuarantee: 93
  },
  premium: {
    tier: 'premium',
    standardLeadWeeks: 1.5,
    rushLeadWeeks: 0.75,
    rushCostMultiplier: 2.0,
    qualityGuarantee: 96
  },
  luxury: {
    tier: 'luxury',
    standardLeadWeeks: 1,
    rushLeadWeeks: 0.5,
    rushCostMultiplier: 2.0,
    qualityGuarantee: 98
  }
}

// ============================================
// RACE SPARES RECOMMENDATIONS
// ============================================

export interface RecommendedSpares {
  brakes: number
  suspension: number
  gearbox: number
  engine: number
  chassis: number
}

export const RECOMMENDED_SPARES_BY_TIER: Record<TeamTier, RecommendedSpares> = {
  entry: {
    brakes: 1,
    suspension: 1,
    gearbox: 0,
    engine: 0,
    chassis: 0
  },
  amateur: {
    brakes: 1,
    suspension: 1,
    gearbox: 0,
    engine: 0,
    chassis: 0
  },
  'semi-pro': {
    brakes: 2,
    suspension: 1,
    gearbox: 1,
    engine: 0,
    chassis: 0
  },
  professional: {
    brakes: 2,
    suspension: 2,
    gearbox: 1,
    engine: 1,
    chassis: 0
  },
  pro: {
    brakes: 2,
    suspension: 2,
    gearbox: 1,
    engine: 1,
    chassis: 0
  },
  elite: {
    brakes: 3,
    suspension: 2,
    gearbox: 2,
    engine: 1,
    chassis: 1
  },
  pinnacle: {
    brakes: 3,
    suspension: 2,
    gearbox: 2,
    engine: 1,
    chassis: 1
  }
}

// Get recommended spares for a specific tier
export function getRecommendedSpares(tier: TeamTier): RecommendedSpares {
  return RECOMMENDED_SPARES_BY_TIER[tier] || RECOMMENDED_SPARES_BY_TIER.amateur
}

// ============================================
// WAREHOUSE CONFIGURATION
// ============================================

export interface WarehouseCapacityConfig {
  baseCapacity: number        // Base parts storage capacity
  capacityPerUpgrade: number  // Additional capacity per upgrade level
  maxUpgradeLevel: number
}

export const WAREHOUSE_CAPACITY_CONFIG: WarehouseCapacityConfig = {
  baseCapacity: 20,           // 20 parts base
  capacityPerUpgrade: 15,     // +15 parts per level
  maxUpgradeLevel: 3          // Max 3 upgrades (20 + 45 = 65 parts max)
}

// Calculate warehouse capacity
export function calculateWarehouseCapacity(upgradeLevel: number): number {
  const clampedLevel = Math.max(0, Math.min(WAREHOUSE_CAPACITY_CONFIG.maxUpgradeLevel, upgradeLevel))
  return WAREHOUSE_CAPACITY_CONFIG.baseCapacity + (clampedLevel * WAREHOUSE_CAPACITY_CONFIG.capacityPerUpgrade)
}

// Warehouse upgrade costs
export const WAREHOUSE_UPGRADE_COSTS: number[] = [
  0,        // Level 0 (base) - included in rental
  15000,    // Level 1 upgrade
  35000,    // Level 2 upgrade
  75000     // Level 3 upgrade
]

// ============================================
// AUTO-REORDER CONFIGURATION
// ============================================

export interface AutoReorderThresholds {
  brakes: number
  suspension: number
  gearbox: number
  engine: number
  chassis: number
}

export const DEFAULT_AUTO_REORDER_THRESHOLDS: AutoReorderThresholds = {
  brakes: 3,
  suspension: 2,
  gearbox: 1,
  engine: 1,
  chassis: 0
}

// ============================================
// RACE KIT CONFIGURATION
// ============================================

// How many weeks before race to start preparing kit
export const RACE_KIT_PREPARATION_WEEKS = 4

// How many weeks before race kit must be shipped to arrive on time (with buffer)
export const RACE_KIT_SHIPPING_DEADLINE_WEEKS = 3

// Penalty multiplier for missing parts at race (applied to car reliability)
export const MISSING_PARTS_RELIABILITY_PENALTY = 0.15  // 15% per missing critical part

// ============================================
// PART QUALITY EFFECTS
// ============================================

// How part quality affects reliability during races
export function getQualityReliabilityModifier(quality: number): number {
  // 100% quality = 1.0 (no change)
  // 90% quality = 0.95 (5% worse)
  // 80% quality = 0.90 (10% worse)
  // 70% quality = 0.80 (20% worse)
  if (quality >= 95) return 1.0
  if (quality >= 90) return 0.97
  if (quality >= 85) return 0.95
  if (quality >= 80) return 0.92
  if (quality >= 75) return 0.88
  if (quality >= 70) return 0.85
  return 0.80
}

// ============================================
// HQ WAREHOUSE CONFIGURATION
// ============================================

// HQ always has a warehouse with special properties
export const HQ_WAREHOUSE_CONFIG = {
  id: 'hq',
  name: 'Headquarters',
  baseCapacity: 50,           // Larger than regional warehouses
  capacityPerUpgrade: 25,     // More capacity per upgrade
  maxUpgradeLevel: 5,
  rentalCost: 0               // HQ warehouse is free (part of facility costs)
}

// Calculate HQ warehouse capacity based on manufacturing facility level
export function calculateHQWarehouseCapacity(manufacturingFacilityLevel: number): number {
  return HQ_WAREHOUSE_CONFIG.baseCapacity + 
    (manufacturingFacilityLevel * HQ_WAREHOUSE_CONFIG.capacityPerUpgrade)
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get all part types as array
export function getAllPartTypes(): SparePartType[] {
  return [...SPARE_PART_TYPES]
}

// Get part type display name
export function getPartTypeName(partType: SparePartType): string {
  return SPARE_PART_NAMES[partType]
}

// Format part quality for display
export function formatPartQuality(quality: number): string {
  if (quality >= 95) return 'Excellent'
  if (quality >= 90) return 'Very Good'
  if (quality >= 85) return 'Good'
  if (quality >= 80) return 'Fair'
  if (quality >= 75) return 'Below Average'
  return 'Poor'
}

// Get quality color class for UI
export function getQualityColorClass(quality: number): string {
  if (quality >= 95) return 'text-status-success'
  if (quality >= 90) return 'text-green-400'
  if (quality >= 85) return 'text-accent-orange'
  if (quality >= 80) return 'text-yellow-500'
  if (quality >= 75) return 'text-status-warning'
  return 'text-status-danger'
}

// Calculate total value of parts
export function calculatePartsValue(parts: { cost: number }[]): number {
  return parts.reduce((sum, part) => sum + part.cost, 0)
}
