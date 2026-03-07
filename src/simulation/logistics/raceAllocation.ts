// ============================================
// RACE SPARES KIT ALLOCATION
// ============================================
// Planning, shipping, and managing spare parts for race weekends

import type { SparePartsState, SparePart, RaceSparesKit } from '@/store/careerStore'
import type { SparePartType } from '@/data/spare-parts-config'
import type { WorldRegion } from '@/data/travel-logistics'
import type { TeamTier } from '@/store/rivalStore'
import { getRecommendedSpares } from '@/data/spare-parts-config'
import { shipParts as initiateShipment, willArriveInTime } from './partsShipping'

/**
 * Initialize race kits for upcoming races that don't already have one
 */
export function initializeRaceKits(
  state: SparePartsState,
  upcomingRaces: Array<{
    raceId: string
    raceName: string
    trackId: string
    raceWeek: number
    raceYear: number
    trackRegion: WorldRegion
  }>,
  teamTier: TeamTier,
  _currentWeek: number,
  _currentYear: number
): SparePartsState {
  const existingRaceIds = new Set(state.raceSparesKits.map(k => k.raceId))
  const recommended = getRecommendedSpares(teamTier)

  const newKits: RaceSparesKit[] = upcomingRaces
    .filter(race => !existingRaceIds.has(race.raceId))
    .map(race => ({
      raceId: race.raceId,
      raceName: race.raceName,
      trackId: race.trackId,
      raceWeek: race.raceWeek,
      raceYear: race.raceYear,
      trackRegion: race.trackRegion,
      allocatedParts: { engine: [], chassis: [], brakes: [], suspension: [], gearbox: [] },
      usedParts: [],
      status: 'planning' as const,
      minimumRequired: {
        engine: recommended.engine,
        chassis: recommended.chassis,
        brakes: recommended.brakes,
        suspension: recommended.suspension,
        gearbox: recommended.gearbox
      }
    }))

  if (newKits.length === 0) return state

  return {
    ...state,
    raceSparesKits: [...state.raceSparesKits, ...newKits]
  }
}

export function addPartsToKit(
  state: SparePartsState,
  raceId: string,
  partType: SparePartType,
  partIds: string[]
): { state: SparePartsState; success: boolean; error?: string } {
  const kit = state.raceSparesKits.find(k => k.raceId === raceId)
  
  if (!kit) {
    return { state, success: false, error: 'Race kit not found' }
  }
  
  if (kit.status !== 'planning') {
    return { state, success: false, error: 'Cannot modify kit after shipping started' }
  }
  
  // Verify all parts exist and are available (at HQ or warehouse)
  for (const partId of partIds) {
    const part = state.inventory.find(p => p.id === partId)
    if (!part) {
      return { state, success: false, error: `Part ${partId} not found` }
    }
    if (part.location === 'in-transit' || part.location.startsWith('at-race-')) {
      return { state, success: false, error: `Part ${partId} is not available for allocation` }
    }
    if (part.type !== partType) {
      return { state, success: false, error: `Part ${partId} is not a ${partType}` }
    }
  }
  
  // Update kit allocation
  const updatedKits = state.raceSparesKits.map(k => {
    if (k.raceId !== raceId) return k
    
    return {
      ...k,
      allocatedParts: {
        ...k.allocatedParts,
        [partType]: [...k.allocatedParts[partType], ...partIds]
      }
    }
  })
  
  return {
    state: { ...state, raceSparesKits: updatedKits },
    success: true
  }
}

/**
 * Remove parts from a race kit allocation
 */
export function removePartsFromKit(
  state: SparePartsState,
  raceId: string,
  partType: SparePartType,
  partIds: string[]
): { state: SparePartsState; success: boolean; error?: string } {
  const kit = state.raceSparesKits.find(k => k.raceId === raceId)
  
  if (!kit) {
    return { state, success: false, error: 'Race kit not found' }
  }
  
  if (kit.status !== 'planning') {
    return { state, success: false, error: 'Cannot modify kit after shipping started' }
  }
  
  const partIdSet = new Set(partIds)
  
  const updatedKits = state.raceSparesKits.map(k => {
    if (k.raceId !== raceId) return k
    
    return {
      ...k,
      allocatedParts: {
        ...k.allocatedParts,
        [partType]: k.allocatedParts[partType].filter(id => !partIdSet.has(id))
      }
    }
  })
  
  return {
    state: { ...state, raceSparesKits: updatedKits },
    success: true
  }
}

/**
 * Auto-allocate recommended parts to a kit from HQ
 */
export function autoAllocateKit(
  state: SparePartsState,
  raceId: string,
  preferHighQuality: boolean = true
): { state: SparePartsState; success: boolean; allocatedCounts: Record<SparePartType, number>; warnings: string[] } {
  const kit = state.raceSparesKits.find(k => k.raceId === raceId)
  
  if (!kit) {
    return { 
      state, 
      success: false, 
      allocatedCounts: { engine: 0, chassis: 0, brakes: 0, suspension: 0, gearbox: 0 },
      warnings: ['Race kit not found']
    }
  }
  
  const warnings: string[] = []
  const allocatedCounts: Record<SparePartType, number> = {
    engine: 0, chassis: 0, brakes: 0, suspension: 0, gearbox: 0
  }
  
  let updatedState = state
  
  for (const partType of SPARE_PART_TYPES) {
    const needed = kit.minimumRequired[partType] - kit.allocatedParts[partType].length
    
    if (needed <= 0) continue
    
    // Find available parts at HQ
    const availableParts = preferHighQuality
      ? getBestQualityParts(updatedState, partType, 'hq', needed)
      : getPartsByTypeAtLocation(updatedState, partType, 'hq').slice(0, needed)
    
    if (availableParts.length < needed) {
      warnings.push(`Only ${availableParts.length}/${needed} ${partType} parts available at HQ`)
    }
    
    if (availableParts.length > 0) {
      const result = allocatePartsToKit(
        updatedState,
        raceId,
        partType,
        availableParts.map(p => p.id)
      )
      
      if (result.success) {
        updatedState = result.state
        allocatedCounts[partType] = availableParts.length
      }
    }
  }
  
  return {
    state: updatedState,
    success: warnings.length === 0,
    allocatedCounts,
    warnings
  }
}

// ============================================
// KIT SHIPPING
// ============================================

/**
 * Ship race kit to track
 */
export function shipRaceKit(
  state: SparePartsState,
  raceId: string,
  originWarehouseId: string, // 'hq' or warehouse ID
  originRegion: WorldRegion,
  shippingMethod: ShippingMethod,
  currentWeek: number,
  currentYear: number
): { state: SparePartsState; success: boolean; cost: number; error?: string } {
  const kit = state.raceSparesKits.find(k => k.raceId === raceId)
  
  if (!kit) {
    return { state, success: false, cost: 0, error: 'Race kit not found' }
  }
  
  if (kit.status !== 'planning') {
    return { state, success: false, cost: 0, error: 'Kit already shipped or at track' }
  }
  
  // Collect all allocated part IDs
  const allPartIds: string[] = []
  for (const partType of SPARE_PART_TYPES) {
    allPartIds.push(...kit.allocatedParts[partType])
  }
  
  if (allPartIds.length === 0) {
    return { state, success: false, cost: 0, error: 'No parts allocated to kit' }
  }
  
  // Verify all parts are at the origin location
  for (const partId of allPartIds) {
    const part = state.inventory.find(p => p.id === partId)
    if (!part || part.location !== originWarehouseId) {
      return { 
        state, 
        success: false, 
        cost: 0, 
        error: `Part ${partId} is not at origin location` 
      }
    }
  }
  
  // Create shipment
  const shipmentResult = initiateShipment(
    state,
    allPartIds,
    originWarehouseId,
    originRegion,
    `at-race-${raceId}`,
    kit.trackRegion,
    shippingMethod,
    currentWeek,
    currentYear,
    raceId
  )
  
  // Update kit status
  const updatedKits = shipmentResult.state.raceSparesKits.map(k => {
    if (k.raceId !== raceId) return k
    
    return {
      ...k,
      status: 'shipping' as RaceSparesKitStatus,
      shipmentId: shipmentResult.shipment.id
    }
  })
  
  return {
    state: { ...shipmentResult.state, raceSparesKits: updatedKits },
    success: true,
    cost: shipmentResult.cost
  }
}

/**
 * Check if kit needs to be shipped soon
 */
export function getKitShippingUrgency(
  kit: RaceSparesKit,
  hqRegion: WorldRegion,
  currentWeek: number,
  currentYear: number
): 'ok' | 'ship_now' | 'urgent' | 'too_late' {
  if (kit.status !== 'planning') return 'ok'
  
  const weeksUntilRace = calculateWeeksUntil(
    currentWeek, currentYear,
    kit.raceWeek, kit.raceYear
  )
  
  // Check if standard shipping will arrive in time
  const standardArrives = willArriveInTime(
    hqRegion,
    kit.trackRegion,
    'standard',
    currentWeek,
    currentYear,
    kit.raceWeek,
    kit.raceYear
  )
  
  const expressArrives = willArriveInTime(
    hqRegion,
    kit.trackRegion,
    'express',
    currentWeek,
    currentYear,
    kit.raceWeek,
    kit.raceYear
  )
  
  const airFreightArrives = willArriveInTime(
    hqRegion,
    kit.trackRegion,
    'air_freight',
    currentWeek,
    currentYear,
    kit.raceWeek,
    kit.raceYear
  )
  
  if (standardArrives) {
    if (weeksUntilRace <= RACE_KIT_SHIPPING_DEADLINE_WEEKS) {
      return 'ship_now'
    }
    return 'ok'
  }
  
  if (expressArrives) return 'urgent'
  if (airFreightArrives) return 'urgent'
  
  return 'too_late'
}

// ============================================
// KIT ARRIVAL AND RACE PROCESSING
// ============================================

/**
 * Mark kit as arrived at track (called when shipment arrives)
 */
export function markKitArrived(
  state: SparePartsState,
  raceId: string
): SparePartsState {
  return {
    ...state,
    raceSparesKits: state.raceSparesKits.map(k => {
      if (k.raceId !== raceId) return k
      if (k.status !== 'shipping') return k
      
      return { ...k, status: 'at_track' as RaceSparesKitStatus }
    })
  }
}

/**
 * Use a part from the race kit (during race)
 */
export function usePartFromKit(
  state: SparePartsState,
  raceId: string,
  partType: SparePartType
): { state: SparePartsState; usedPart: SparePart | null; success: boolean; error?: string } {
  const kit = state.raceSparesKits.find(k => k.raceId === raceId)
  
  if (!kit) {
    return { state, usedPart: null, success: false, error: 'Race kit not found' }
  }
  
  if (kit.status !== 'at_track') {
    return { state, usedPart: null, success: false, error: 'Kit not at track' }
  }
  
  const availablePartIds = kit.allocatedParts[partType].filter(
    id => !kit.usedParts.includes(id)
  )
  
  if (availablePartIds.length === 0) {
    return { state, usedPart: null, success: false, error: `No ${partType} parts available in kit` }
  }
  
  // Use the first available part
  const partIdToUse = availablePartIds[0]
  const usedPart = state.inventory.find(p => p.id === partIdToUse) || null
  
  // Mark part as used and remove from inventory
  let updatedState = removeParts(state, [partIdToUse], true)
  
  // Update kit
  updatedState = {
    ...updatedState,
    raceSparesKits: updatedState.raceSparesKits.map(k => {
      if (k.raceId !== raceId) return k
      
      return {
        ...k,
        usedParts: [...k.usedParts, partIdToUse]
      }
    })
  }
  
  return { state: updatedState, usedPart, success: true }
}

/**
 * Calculate reliability penalty for missing parts
 */
export function calculateMissingPartsPenalty(
  kit: RaceSparesKit
): { penalty: number; missingParts: Record<SparePartType, number> } {
  const missingParts: Record<SparePartType, number> = {
    engine: 0, chassis: 0, brakes: 0, suspension: 0, gearbox: 0
  }
  
  let criticalMissing = 0
  
  for (const partType of SPARE_PART_TYPES) {
    const allocated = kit.allocatedParts[partType].length - kit.usedParts.filter(
      id => kit.allocatedParts[partType].includes(id)
    ).length
    const required = kit.minimumRequired[partType]
    
    if (allocated < required) {
      missingParts[partType] = required - allocated
      
      // Critical parts (engine, gearbox) have higher penalty
      if (partType === 'engine' || partType === 'gearbox') {
        criticalMissing += (required - allocated) * 2
      } else {
        criticalMissing += required - allocated
      }
    }
  }
  
  const penalty = criticalMissing * MISSING_PARTS_RELIABILITY_PENALTY
  
  return { penalty: Math.min(0.5, penalty), missingParts } // Cap at 50% penalty
}

// ============================================
// POST-RACE RETURNS
// ============================================

/**
 * Return unused parts from race
 */
export function returnKitAfterRace(
  state: SparePartsState,
  raceId: string,
  returnToWarehouseId: string,
  returnToRegion: WorldRegion,
  trackRegion: WorldRegion,
  shippingMethod: ShippingMethod,
  currentWeek: number,
  currentYear: number
): { state: SparePartsState; success: boolean; cost: number; returnedParts: number; error?: string } {
  const kit = state.raceSparesKits.find(k => k.raceId === raceId)
  
  if (!kit) {
    return { state, success: false, cost: 0, returnedParts: 0, error: 'Race kit not found' }
  }
  
  if (kit.status !== 'at_track') {
    return { state, success: false, cost: 0, returnedParts: 0, error: 'Kit not at track' }
  }
  
  // Find unused parts
  const unusedPartIds: string[] = []
  for (const partType of SPARE_PART_TYPES) {
    for (const partId of kit.allocatedParts[partType]) {
      if (!kit.usedParts.includes(partId)) {
        // Check part still exists in inventory
        const part = state.inventory.find(p => p.id === partId)
        if (part) {
          unusedPartIds.push(partId)
        }
      }
    }
  }
  
  if (unusedPartIds.length === 0) {
    // No parts to return, just mark kit as returned
    return {
      state: {
        ...state,
        raceSparesKits: state.raceSparesKits.map(k =>
          k.raceId === raceId ? { ...k, status: 'returned' as RaceSparesKitStatus } : k
        )
      },
      success: true,
      cost: 0,
      returnedParts: 0
    }
  }
  
  // Create return shipment
  const shipmentResult = initiateShipment(
    state,
    unusedPartIds,
    `at-race-${raceId}`,
    trackRegion,
    returnToWarehouseId,
    returnToRegion,
    shippingMethod,
    currentWeek,
    currentYear
  )
  
  // Update kit status
  const updatedKits = shipmentResult.state.raceSparesKits.map(k => {
    if (k.raceId !== raceId) return k
    
    return {
      ...k,
      status: 'returned' as RaceSparesKitStatus,
      returnShipmentId: shipmentResult.shipment.id
    }
  })
  
  return {
    state: { ...shipmentResult.state, raceSparesKits: updatedKits },
    success: true,
    cost: shipmentResult.cost,
    returnedParts: unusedPartIds.length
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate weeks until a target date
 */
function calculateWeeksUntil(
  currentWeek: number,
  currentYear: number,
  targetWeek: number,
  targetYear: number
): number {
  const yearDiff = targetYear - currentYear
  const weekDiff = targetWeek - currentWeek
  
  return (yearDiff * 52) + weekDiff
}

/**
 * Get kit by race ID
 */
export function getKitByRaceId(state: SparePartsState, raceId: string): RaceSparesKit | undefined {
  return state.raceSparesKits.find(k => k.raceId === raceId)
}

/**
 * Get all kits that need attention (planning or shipping)
 */
export function getKitsNeedingAttention(state: SparePartsState): RaceSparesKit[] {
  return state.raceSparesKits.filter(k => k.status === 'planning' || k.status === 'shipping')
}

/**
 * Get kit allocation status
 */
export function getKitAllocationStatus(kit: RaceSparesKit): {
  isComplete: boolean
  isOverAllocated: boolean
  partStatus: Record<SparePartType, { allocated: number; required: number; status: 'ok' | 'low' | 'over' }>
} {
  const partStatus: Record<SparePartType, { allocated: number; required: number; status: 'ok' | 'low' | 'over' }> = {
    engine: { allocated: 0, required: 0, status: 'ok' },
    chassis: { allocated: 0, required: 0, status: 'ok' },
    brakes: { allocated: 0, required: 0, status: 'ok' },
    suspension: { allocated: 0, required: 0, status: 'ok' },
    gearbox: { allocated: 0, required: 0, status: 'ok' }
  }
  
  let isComplete = true
  let isOverAllocated = false
  
  for (const partType of SPARE_PART_TYPES) {
    const allocated = kit.allocatedParts[partType].length
    const required = kit.minimumRequired[partType]
    
    let status: 'ok' | 'low' | 'over' = 'ok'
    if (allocated < required) {
      status = 'low'
      isComplete = false
    } else if (allocated > required * 2) {
      status = 'over'
      isOverAllocated = true
    }
    
    partStatus[partType] = { allocated, required, status }
  }
  
  return { isComplete, isOverAllocated, partStatus }
}

/**
 * Find closest warehouse to a race region
 */
export function findClosestWarehouse(
  state: SparePartsState,
  raceRegion: WorldRegion,
  hqRegion: WorldRegion
): { warehouseId: string; region: WorldRegion } | null {
  // Check active warehouses
  const activeWarehouses = state.warehouses.filter(w => w.rentalActive)
  
  // Find warehouse in same region
  const sameRegionWarehouse = activeWarehouses.find(w => w.region === raceRegion)
  if (sameRegionWarehouse) {
    return { warehouseId: sameRegionWarehouse.id, region: sameRegionWarehouse.region }
  }
  
  // If HQ is in same region, use HQ
  if (hqRegion === raceRegion) {
    return { warehouseId: 'hq', region: hqRegion }
  }
  
  // Default to HQ
  return { warehouseId: 'hq', region: hqRegion }
}

/**
 * Clean up old completed/returned kits
 */
export function cleanupOldKits(
  state: SparePartsState,
  currentWeek: number,
  currentYear: number,
  keepWeeks: number = 8 // Keep kits for 8 weeks after race
): SparePartsState {
  return {
    ...state,
    raceSparesKits: state.raceSparesKits.filter(kit => {
      if (kit.status === 'planning' || kit.status === 'shipping' || kit.status === 'at_track') {
        return true // Keep active kits
      }
      
      // Check if kit is old enough to remove
      const weeksSinceRace = calculateWeeksUntil(
        kit.raceWeek, kit.raceYear,
        currentWeek, currentYear
      )
      
      return weeksSinceRace < keepWeeks
    })
  }
}
