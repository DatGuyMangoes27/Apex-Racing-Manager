// ============================================
// WEEKLY SPARE PARTS PROCESSING
// ============================================
// Functions to be called during advanceWeek for spare parts system

import type {
  SparePartsState,
  PartShipment,
  PartOrder,
  ManufacturingJob,
  SparePart,
  RaceSparesKit,
  _PartsWarehouse
} from '@/store/careerStore'
import type { WorldRegion } from '@/data/travel-logistics'
import type { TeamTier } from '@/store/rivalStore'
import { processShipments } from './partsShipping'
import { processPartOrders, placePartOrder } from './partsShipping'
import { processManufacturingQueue } from './partsManufacturing'
import { 
  initializeRaceKits,
  markKitArrived,
  getKitShippingUrgency,
  cleanupOldKits
} from './raceAllocation'
import { getReorderNeeds, getActiveWarehouses } from './partsInventory'
import { MANUFACTURERS } from '@/data/manufacturers'

// ============================================
// MAIN WEEKLY PROCESSING FUNCTION
// ============================================

export interface WeeklySparePartsResult {
  // State changes
  updatedState: SparePartsState
  
  // Shipments
  arrivedShipments: PartShipment[]
  
  // Orders
  deliveredOrders: PartOrder[]
  newOrderParts: SparePart[]
  autoOrdersPlaced: PartOrder[]
  
  // Manufacturing
  completedJobs: ManufacturingJob[]
  newManufacturedParts: SparePart[]
  
  // Race kits
  newRaceKits: RaceSparesKit[]
  kitsArrivedAtTrack: string[] // raceIds
  
  // Costs
  warehouseRentalCosts: number
  autoOrderCosts: number
  
  // Alerts
  alerts: SparePartsAlert[]
}

export interface SparePartsAlert {
  type: 'kit_shipping_urgent' | 'kit_shipping_required' | 'low_inventory' | 'order_delayed' | 'shipment_delayed'
  severity: 'info' | 'warning' | 'critical'
  message: string
  raceId?: string
  partType?: string
}

/**
 * Process all spare parts systems for the current week
 */
export function processWeeklySpareParts(
  state: SparePartsState,
  currentWeek: number,
  currentYear: number,
  manufacturingFacilityLevel: number,
  hqRegion: WorldRegion,
  teamTier: TeamTier,
  upcomingRaces: Array<{
    raceId: string
    raceName: string
    trackId: string
    raceWeek: number
    raceYear: number
    trackRegion: WorldRegion
  }>,
  defaultManufacturerId: string = 'generic'
): WeeklySparePartsResult {
  let updatedState = { ...state }
  const alerts: SparePartsAlert[] = []
  const autoOrdersPlaced: PartOrder[] = []
  let autoOrderCosts = 0
  
  // 1. Process manufacturing queue
  const manufacturingResult = processManufacturingQueue(
    updatedState,
    currentWeek,
    currentYear,
    manufacturingFacilityLevel
  )
  updatedState = manufacturingResult.state
  
  // 2. Process shipment arrivals
  const shipmentResult = processShipments(
    updatedState,
    currentWeek,
    currentYear
  )
  updatedState = shipmentResult.state
  
  // Check for race kit arrivals
  const kitsArrivedAtTrack: string[] = []
  for (const shipment of shipmentResult.arrivedShipments) {
    if (shipment.raceId) {
      updatedState = markKitArrived(updatedState, shipment.raceId)
      kitsArrivedAtTrack.push(shipment.raceId)
    }
  }
  
  // 3. Process pending orders from manufacturers
  const orderResult = processPartOrders(
    updatedState,
    currentWeek,
    currentYear
  )
  updatedState = orderResult.state
  
  // 4. Initialize race kits for upcoming races
  const previousKitCount = updatedState.raceSparesKits.length
  updatedState = initializeRaceKits(
    updatedState,
    upcomingRaces,
    teamTier,
    currentWeek,
    currentYear
  )
  const newRaceKits = updatedState.raceSparesKits.slice(previousKitCount)
  
  // 5. Check race kit shipping urgency and generate alerts
  for (const kit of updatedState.raceSparesKits) {
    if (kit.status !== 'planning') continue
    
    const urgency = getKitShippingUrgency(kit, hqRegion, currentWeek, currentYear)
    
    if (urgency === 'ship_now') {
      alerts.push({
        type: 'kit_shipping_required',
        severity: 'warning',
        message: `Race kit for ${kit.raceName} should be shipped this week`,
        raceId: kit.raceId
      })
    } else if (urgency === 'urgent') {
      alerts.push({
        type: 'kit_shipping_urgent',
        severity: 'critical',
        message: `Race kit for ${kit.raceName} needs express/air shipping to arrive in time!`,
        raceId: kit.raceId
      })
    } else if (urgency === 'too_late') {
      alerts.push({
        type: 'kit_shipping_urgent',
        severity: 'critical',
        message: `Race kit for ${kit.raceName} may not arrive in time even with air freight!`,
        raceId: kit.raceId
      })
    }
  }
  
  // 6. Process auto-reorder if enabled
  if (updatedState.autoReorderEnabled) {
    const reorderNeeds = getReorderNeeds(updatedState)
    
    for (const need of reorderNeeds) {
      const manufacturer = MANUFACTURERS[defaultManufacturerId]
      const unitCost = manufacturer?.partsCosts[need.partType] || 10000
      
      const orderResult = placePartOrder(
        updatedState,
        need.partType,
        need.needed,
        defaultManufacturerId,
        'hq',
        false, // Not rush order for auto-reorder
        unitCost,
        currentWeek,
        currentYear
      )
      
      updatedState = orderResult.state
      autoOrdersPlaced.push(orderResult.order)
      autoOrderCosts += orderResult.cost
      
      alerts.push({
        type: 'low_inventory',
        severity: 'info',
        message: `Auto-ordered ${need.needed} ${need.partType}(s) - inventory was below threshold`,
        partType: need.partType
      })
    }
  } else {
    // Just generate alerts for low inventory without auto-ordering
    const reorderNeeds = getReorderNeeds({ ...updatedState, autoReorderEnabled: true })
    for (const need of reorderNeeds) {
      alerts.push({
        type: 'low_inventory',
        severity: 'warning',
        message: `Low ${need.partType} inventory: ${need.current}/${need.threshold} at HQ`,
        partType: need.partType
      })
    }
  }
  
  // 7. Calculate warehouse rental costs
  const activeWarehouses = getActiveWarehouses(updatedState)
  const warehouseRentalCosts = activeWarehouses.reduce(
    (sum, w) => sum + w.weeklyRentalCost, 0
  )
  
  // 8. Clean up old race kits
  updatedState = cleanupOldKits(updatedState, currentWeek, currentYear)
  
  // 9. Check for delayed shipments/orders
  for (const shipment of updatedState.activeShipments) {
    if (shipment.status === 'delayed') {
      alerts.push({
        type: 'shipment_delayed',
        severity: 'warning',
        message: `Shipment to ${shipment.destination} has been delayed`,
        raceId: shipment.raceId
      })
    }
  }
  
  for (const order of updatedState.pendingOrders) {
    if (order.status === 'delayed') {
      alerts.push({
        type: 'order_delayed',
        severity: 'warning',
        message: `Order for ${order.quantity} ${order.partType}(s) from manufacturer has been delayed`,
        partType: order.partType
      })
    }
  }
  
  return {
    updatedState,
    arrivedShipments: shipmentResult.arrivedShipments,
    deliveredOrders: orderResult.deliveredOrders,
    newOrderParts: orderResult.newParts,
    autoOrdersPlaced,
    completedJobs: manufacturingResult.completedJobs,
    newManufacturedParts: manufacturingResult.newParts,
    newRaceKits,
    kitsArrivedAtTrack,
    warehouseRentalCosts,
    autoOrderCosts,
    alerts
  }
}

// ============================================
// COST TRACKING
// ============================================

/**
 * Calculate total weekly spare parts costs
 */
export function calculateWeeklySparePartsCosts(result: WeeklySparePartsResult): {
  warehouseRental: number
  autoOrders: number
  total: number
} {
  return {
    warehouseRental: result.warehouseRentalCosts,
    autoOrders: result.autoOrderCosts,
    total: result.warehouseRentalCosts + result.autoOrderCosts
  }
}

/**
 * Get summary of spare parts activity for the week
 */
export function getWeeklySummary(result: WeeklySparePartsResult): {
  shipmentsArrived: number
  partsDelivered: number
  partsManufactured: number
  ordersPlaced: number
  kitsCreated: number
  kitsShipped: number
  totalCosts: number
  criticalAlerts: number
} {
  return {
    shipmentsArrived: result.arrivedShipments.length,
    partsDelivered: result.newOrderParts.length,
    partsManufactured: result.newManufacturedParts.length,
    ordersPlaced: result.autoOrdersPlaced.length,
    kitsCreated: result.newRaceKits.length,
    kitsShipped: result.kitsArrivedAtTrack.length,
    totalCosts: result.warehouseRentalCosts + result.autoOrderCosts,
    criticalAlerts: result.alerts.filter(a => a.severity === 'critical').length
  }
}

// ============================================
// INTEGRATION HELPER
// ============================================

/**
 * Check if spare parts system needs attention
 */
export function sparePartsNeedsAttention(state: SparePartsState): boolean {
  // Check for planning kits
  const planningKits = state.raceSparesKits.filter(k => k.status === 'planning')
  if (planningKits.length > 0) return true
  
  // Check for active manufacturing
  const activeJobs = state.manufacturingQueue.filter(
    j => j.status === 'in_progress' || j.status === 'queued'
  )
  if (activeJobs.length > 0) return true
  
  // Check for pending orders
  const pendingOrders = state.pendingOrders.filter(
    o => o.status === 'processing' || o.status === 'in_transit'
  )
  if (pendingOrders.length > 0) return true
  
  // Check for active shipments
  if (state.activeShipments.length > 0) return true
  
  return false
}

/**
 * Get high-priority items requiring user attention
 */
export function getHighPriorityItems(
  state: SparePartsState,
  hqRegion: WorldRegion,
  currentWeek: number,
  currentYear: number
): {
  urgentKits: RaceSparesKit[]
  lowInventory: { partType: string; count: number }[]
  delayedShipments: PartShipment[]
  delayedOrders: PartOrder[]
} {
  const urgentKits = state.raceSparesKits.filter(kit => {
    if (kit.status !== 'planning') return false
    const urgency = getKitShippingUrgency(kit, hqRegion, currentWeek, currentYear)
    return urgency === 'urgent' || urgency === 'too_late'
  })
  
  // Check low inventory (using auto-reorder thresholds as reference)
  const lowInventory: { partType: string; count: number }[] = []
  const reorderNeeds = getReorderNeeds({ ...state, autoReorderEnabled: true })
  for (const need of reorderNeeds) {
    lowInventory.push({
      partType: need.partType,
      count: need.current
    })
  }
  
  const delayedShipments = state.activeShipments.filter(s => s.status === 'delayed')
  const delayedOrders = state.pendingOrders.filter(o => o.status === 'delayed')
  
  return {
    urgentKits,
    lowInventory,
    delayedShipments,
    delayedOrders
  }
}
