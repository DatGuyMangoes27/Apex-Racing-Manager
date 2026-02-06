// ============================================
// SPARE PARTS INVENTORY MANAGEMENT
// ============================================
// Core CRUD operations for managing spare parts inventory

import { v4 as uuidv4 } from 'uuid'
import type {
  SparePart,
  SparePartsState,
  PartsWarehouse,
  AutoReorderThresholds
} from '@/store/careerStore'
import type { SparePartType } from '@/data/spare-parts-config'
import type { WorldRegion } from '@/data/travel-logistics'
import { SPARE_PART_TYPES, calculateHQWarehouseCapacity } from '@/data/spare-parts-config'

// ============================================
// SPARE PART CRUD OPERATIONS
// ============================================

/**
 * Create a new spare part
 */
export function createSparePart(params: {
  type: SparePartType
  manufacturerId: string
  quality: number
  location: string
  cost: number
  isInHouse: boolean
  productionWeek: number
  productionYear: number
}): SparePart {
  return {
    id: uuidv4(),
    type: params.type,
    manufacturerId: params.manufacturerId,
    quality: Math.max(50, Math.min(100, params.quality)),
    productionWeek: params.productionWeek,
    productionYear: params.productionYear,
    location: params.location,
    cost: params.cost,
    isInHouse: params.isInHouse
  }
}

/**
 * Get all parts by location
 */
export function getPartsByLocation(state: SparePartsState, location: string): SparePart[] {
  return state.inventory.filter(part => part.location === location)
}

/**
 * Get all parts at HQ
 */
export function getPartsAtHQ(state: SparePartsState): SparePart[] {
  return getPartsByLocation(state, 'hq')
}

/**
 * Get all parts at a specific warehouse
 */
export function getPartsAtWarehouse(state: SparePartsState, warehouseId: string): SparePart[] {
  return getPartsByLocation(state, warehouseId)
}

/**
 * Get all parts in transit
 */
export function getPartsInTransit(state: SparePartsState): SparePart[] {
  return state.inventory.filter(part => part.location === 'in-transit')
}

/**
 * Get all parts at a specific race
 */
export function getPartsAtRace(state: SparePartsState, raceId: string): SparePart[] {
  return getPartsByLocation(state, `at-race-${raceId}`)
}

/**
 * Get parts by type at a location
 */
export function getPartsByTypeAtLocation(
  state: SparePartsState,
  partType: SparePartType,
  location: string
): SparePart[] {
  return state.inventory.filter(
    part => part.type === partType && part.location === location
  )
}

/**
 * Count parts by type at a location
 */
export function countPartsByTypeAtLocation(
  state: SparePartsState,
  partType: SparePartType,
  location: string
): number {
  return getPartsByTypeAtLocation(state, partType, location).length
}

/**
 * Get inventory summary by type for a location
 */
export function getInventorySummary(
  state: SparePartsState,
  location: string
): Record<SparePartType, { count: number; avgQuality: number; totalValue: number }> {
  const summary: Record<SparePartType, { count: number; avgQuality: number; totalValue: number }> = {
    engine: { count: 0, avgQuality: 0, totalValue: 0 },
    chassis: { count: 0, avgQuality: 0, totalValue: 0 },
    brakes: { count: 0, avgQuality: 0, totalValue: 0 },
    suspension: { count: 0, avgQuality: 0, totalValue: 0 },
    gearbox: { count: 0, avgQuality: 0, totalValue: 0 }
  }

  const parts = getPartsByLocation(state, location)
  
  for (const part of parts) {
    summary[part.type].count++
    summary[part.type].totalValue += part.cost
  }

  // Calculate average quality
  for (const partType of SPARE_PART_TYPES) {
    const typeParts = parts.filter(p => p.type === partType)
    if (typeParts.length > 0) {
      summary[partType].avgQuality = Math.round(
        typeParts.reduce((sum, p) => sum + p.quality, 0) / typeParts.length
      )
    }
  }

  return summary
}

/**
 * Get total inventory across all locations
 */
export function getTotalInventorySummary(
  state: SparePartsState
): Record<SparePartType, { count: number; avgQuality: number; totalValue: number }> {
  const summary: Record<SparePartType, { count: number; avgQuality: number; totalValue: number }> = {
    engine: { count: 0, avgQuality: 0, totalValue: 0 },
    chassis: { count: 0, avgQuality: 0, totalValue: 0 },
    brakes: { count: 0, avgQuality: 0, totalValue: 0 },
    suspension: { count: 0, avgQuality: 0, totalValue: 0 },
    gearbox: { count: 0, avgQuality: 0, totalValue: 0 }
  }

  for (const part of state.inventory) {
    summary[part.type].count++
    summary[part.type].totalValue += part.cost
  }

  // Calculate average quality
  for (const partType of SPARE_PART_TYPES) {
    const typeParts = state.inventory.filter(p => p.type === partType)
    if (typeParts.length > 0) {
      summary[partType].avgQuality = Math.round(
        typeParts.reduce((sum, p) => sum + p.quality, 0) / typeParts.length
      )
    }
  }

  return summary
}

/**
 * Move a part to a new location
 */
export function movePart(
  state: SparePartsState,
  partId: string,
  newLocation: string
): SparePartsState {
  return {
    ...state,
    inventory: state.inventory.map(part =>
      part.id === partId ? { ...part, location: newLocation } : part
    )
  }
}

/**
 * Move multiple parts to a new location
 */
export function moveParts(
  state: SparePartsState,
  partIds: string[],
  newLocation: string
): SparePartsState {
  const partIdSet = new Set(partIds)
  return {
    ...state,
    inventory: state.inventory.map(part =>
      partIdSet.has(part.id) ? { ...part, location: newLocation } : part
    )
  }
}

/**
 * Remove a part from inventory (used/scrapped)
 */
export function removePart(
  state: SparePartsState,
  partId: string,
  incrementUsed: boolean = true
): SparePartsState {
  return {
    ...state,
    inventory: state.inventory.filter(part => part.id !== partId),
    totalPartsUsed: incrementUsed ? state.totalPartsUsed + 1 : state.totalPartsUsed
  }
}

/**
 * Remove multiple parts from inventory
 */
export function removeParts(
  state: SparePartsState,
  partIds: string[],
  incrementUsed: boolean = true
): SparePartsState {
  const partIdSet = new Set(partIds)
  const removedCount = partIds.length
  
  return {
    ...state,
    inventory: state.inventory.filter(part => !partIdSet.has(part.id)),
    totalPartsUsed: incrementUsed ? state.totalPartsUsed + removedCount : state.totalPartsUsed
  }
}

/**
 * Add parts to inventory
 */
export function addParts(
  state: SparePartsState,
  parts: SparePart[],
  source: 'manufactured' | 'purchased' | 'other' = 'other'
): SparePartsState {
  return {
    ...state,
    inventory: [...state.inventory, ...parts],
    totalPartsManufactured: source === 'manufactured' 
      ? state.totalPartsManufactured + parts.length 
      : state.totalPartsManufactured,
    totalPartsPurchased: source === 'purchased'
      ? state.totalPartsPurchased + parts.length
      : state.totalPartsPurchased
  }
}

// ============================================
// WAREHOUSE OPERATIONS
// ============================================

/**
 * Create a new warehouse
 */
export function createWarehouse(params: {
  hubId: string
  name: string
  region: WorldRegion
  country: string
  weeklyRentalCost: number
  activatedWeek: number
  activatedYear: number
}): PartsWarehouse {
  return {
    id: uuidv4(),
    hubId: params.hubId,
    name: params.name,
    region: params.region,
    country: params.country,
    capacity: 20, // Base capacity
    upgradeLevel: 0,
    currentParts: [],
    rentalActive: true,
    weeklyRentalCost: params.weeklyRentalCost,
    activatedWeek: params.activatedWeek,
    activatedYear: params.activatedYear
  }
}

/**
 * Activate a warehouse (start renting)
 */
export function activateWarehouse(
  state: SparePartsState,
  hubId: string,
  name: string,
  region: WorldRegion,
  country: string,
  weeklyRentalCost: number,
  currentWeek: number,
  currentYear: number
): SparePartsState {
  // Check if warehouse already exists for this hub
  const existingWarehouse = state.warehouses.find(w => w.hubId === hubId)
  
  if (existingWarehouse) {
    // Reactivate existing warehouse
    return {
      ...state,
      warehouses: state.warehouses.map(w =>
        w.hubId === hubId
          ? { ...w, rentalActive: true, activatedWeek: currentWeek, activatedYear: currentYear }
          : w
      )
    }
  }
  
  // Create new warehouse
  const newWarehouse = createWarehouse({
    hubId,
    name,
    region,
    country,
    weeklyRentalCost,
    activatedWeek: currentWeek,
    activatedYear: currentYear
  })
  
  return {
    ...state,
    warehouses: [...state.warehouses, newWarehouse]
  }
}

/**
 * Deactivate a warehouse (stop renting)
 * Parts must be moved out first!
 */
export function deactivateWarehouse(
  state: SparePartsState,
  warehouseId: string
): { state: SparePartsState; success: boolean; error?: string } {
  const warehouse = state.warehouses.find(w => w.id === warehouseId)
  
  if (!warehouse) {
    return { state, success: false, error: 'Warehouse not found' }
  }
  
  // Check if warehouse has parts
  const partsInWarehouse = getPartsAtWarehouse(state, warehouseId)
  if (partsInWarehouse.length > 0) {
    return { 
      state, 
      success: false, 
      error: `Warehouse still contains ${partsInWarehouse.length} parts. Move them first.` 
    }
  }
  
  return {
    state: {
      ...state,
      warehouses: state.warehouses.map(w =>
        w.id === warehouseId ? { ...w, rentalActive: false } : w
      )
    },
    success: true
  }
}

/**
 * Upgrade warehouse capacity
 */
export function upgradeWarehouse(
  state: SparePartsState,
  warehouseId: string
): { state: SparePartsState; success: boolean; newCapacity?: number; error?: string } {
  const warehouse = state.warehouses.find(w => w.id === warehouseId)
  
  if (!warehouse) {
    return { state, success: false, error: 'Warehouse not found' }
  }
  
  if (warehouse.upgradeLevel >= 3) {
    return { state, success: false, error: 'Warehouse already at maximum capacity' }
  }
  
  const newLevel = warehouse.upgradeLevel + 1
  const newCapacity = 20 + (newLevel * 15) // 20, 35, 50, 65
  
  return {
    state: {
      ...state,
      warehouses: state.warehouses.map(w =>
        w.id === warehouseId
          ? { ...w, upgradeLevel: newLevel, capacity: newCapacity }
          : w
      )
    },
    success: true,
    newCapacity
  }
}

/**
 * Get warehouse by ID
 */
export function getWarehouseById(state: SparePartsState, warehouseId: string): PartsWarehouse | undefined {
  return state.warehouses.find(w => w.id === warehouseId)
}

/**
 * Get active warehouses
 */
export function getActiveWarehouses(state: SparePartsState): PartsWarehouse[] {
  return state.warehouses.filter(w => w.rentalActive)
}

/**
 * Check warehouse capacity
 */
export function getWarehouseCapacityInfo(
  state: SparePartsState,
  warehouseId: string
): { current: number; max: number; available: number } | null {
  const warehouse = state.warehouses.find(w => w.id === warehouseId)
  if (!warehouse) return null
  
  const currentParts = getPartsAtWarehouse(state, warehouseId).length
  
  return {
    current: currentParts,
    max: warehouse.capacity,
    available: warehouse.capacity - currentParts
  }
}

/**
 * Check HQ capacity
 */
export function getHQCapacityInfo(
  state: SparePartsState,
  manufacturingLevel: number
): { current: number; max: number; available: number } {
  const currentParts = getPartsAtHQ(state).length
  const maxCapacity = calculateHQWarehouseCapacity(manufacturingLevel)
  
  return {
    current: currentParts,
    max: maxCapacity,
    available: maxCapacity - currentParts
  }
}

/**
 * Check if location has capacity for parts
 */
export function hasCapacityForParts(
  state: SparePartsState,
  location: string,
  partCount: number,
  manufacturingLevel: number = 1
): boolean {
  if (location === 'hq') {
    const capacity = getHQCapacityInfo(state, manufacturingLevel)
    return capacity.available >= partCount
  }
  
  const warehouseCapacity = getWarehouseCapacityInfo(state, location)
  if (!warehouseCapacity) return false
  
  return warehouseCapacity.available >= partCount
}

// ============================================
// AUTO-REORDER SYSTEM
// ============================================

/**
 * Update auto-reorder settings
 */
export function updateAutoReorderSettings(
  state: SparePartsState,
  enabled: boolean,
  thresholds?: Partial<AutoReorderThresholds>
): SparePartsState {
  return {
    ...state,
    autoReorderEnabled: enabled,
    autoReorderThresholds: thresholds
      ? { ...state.autoReorderThresholds, ...thresholds }
      : state.autoReorderThresholds
  }
}

/**
 * Check which part types need reordering at HQ
 */
export function getReorderNeeds(
  state: SparePartsState
): { partType: SparePartType; current: number; threshold: number; needed: number }[] {
  if (!state.autoReorderEnabled) return []
  
  const needs: { partType: SparePartType; current: number; threshold: number; needed: number }[] = []
  
  for (const partType of SPARE_PART_TYPES) {
    const currentCount = countPartsByTypeAtLocation(state, partType, 'hq')
    const threshold = state.autoReorderThresholds[partType]
    
    if (currentCount < threshold) {
      needs.push({
        partType,
        current: currentCount,
        threshold,
        needed: threshold - currentCount
      })
    }
  }
  
  return needs
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get total inventory value
 */
export function getTotalInventoryValue(state: SparePartsState): number {
  return state.inventory.reduce((sum, part) => sum + part.cost, 0)
}

/**
 * Get inventory value at location
 */
export function getInventoryValueAtLocation(state: SparePartsState, location: string): number {
  return getPartsByLocation(state, location).reduce((sum, part) => sum + part.cost, 0)
}

/**
 * Find best quality parts of a type at a location
 */
export function getBestQualityParts(
  state: SparePartsState,
  partType: SparePartType,
  location: string,
  count: number
): SparePart[] {
  return getPartsByTypeAtLocation(state, partType, location)
    .sort((a, b) => b.quality - a.quality)
    .slice(0, count)
}

/**
 * Get part by ID
 */
export function getPartById(state: SparePartsState, partId: string): SparePart | undefined {
  return state.inventory.find(part => part.id === partId)
}

/**
 * Calculate average quality of parts at location
 */
export function getAverageQualityAtLocation(state: SparePartsState, location: string): number {
  const parts = getPartsByLocation(state, location)
  if (parts.length === 0) return 0
  
  return Math.round(parts.reduce((sum, p) => sum + p.quality, 0) / parts.length)
}

/**
 * Get oldest parts (for using FIFO)
 */
export function getOldestParts(
  state: SparePartsState,
  partType: SparePartType,
  location: string,
  count: number
): SparePart[] {
  return getPartsByTypeAtLocation(state, partType, location)
    .sort((a, b) => {
      if (a.productionYear !== b.productionYear) {
        return a.productionYear - b.productionYear
      }
      return a.productionWeek - b.productionWeek
    })
    .slice(0, count)
}
