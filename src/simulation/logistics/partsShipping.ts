// ============================================
// SPARE PARTS SHIPPING & LOGISTICS
// ============================================
// Transit time calculations and shipment processing

import { v4 as uuidv4 } from 'uuid'
import type {
  SparePart,
  SparePartsState,
  PartShipment,
  PartShipmentStatus,
  PartOrder,
  PartOrderStatus,
  PartsWarehouse
} from '@/store/careerStore'
import type { SparePartType, ShippingMethod } from '@/data/spare-parts-config'
import type { WorldRegion } from '@/data/travel-logistics'
import { calculateTransitTime, calculateShippingCost, MANUFACTURER_ORDER_CONFIG } from '@/data/spare-parts-config';
import { addParts } from './partsInventory';

function getPartById(state: SparePartsState, id: string): SparePart | undefined {
  return state.inventory.find(p => p.id === id)
}

function createShipment(params: any): PartShipment {
  return {
    id: uuidv4(),
    parts: params.parts.map((p: SparePart) => p.id),
    origin: params.origin,
    originRegion: params.originRegion,
    destination: params.destination,
    destinationRegion: params.destinationRegion,
    method: params.method,
    status: 'in-transit' as PartShipmentStatus,
    departureWeek: params.currentWeek,
    departureYear: params.currentYear,
    estimatedArrivalWeek: params.currentWeek + 1,
    cost: calculateShippingCost(params.method, params.originRegion, params.destinationRegion, params.parts.length),
    raceId: params.raceId
  }
}

function moveParts(state: SparePartsState, partIds: string[], location: string): SparePartsState {
  return {
    ...state,
    inventory: state.inventory.map(p => partIds.includes(p.id) ? { ...p, location } : p)
  }
}

export function shipParts(
  state: SparePartsState,
  partIds: string[],
  origin: string,
  originRegion: WorldRegion,
  destination: string,
  destinationRegion: WorldRegion,
  method: ShippingMethod,
  currentWeek: number,
  currentYear: number,
  raceId?: string
): { state: SparePartsState; shipment: PartShipment; cost: number } {
  // Get the actual parts
  const parts = partIds
    .map(id => getPartById(state, id))
    .filter((p): p is SparePart => p !== undefined)
  
  // Create the shipment
  const shipment = createShipment({
    parts,
    origin,
    originRegion,
    destination,
    destinationRegion,
    method,
    currentWeek,
    currentYear,
    raceId
  })
  
  // Move parts to in-transit
  let updatedState = moveParts(state, partIds, 'in-transit')
  
  // Add shipment to active shipments
  updatedState = {
    ...updatedState,
    activeShipments: [...updatedState.activeShipments, shipment]
  }
  
  return {
    state: updatedState,
    shipment,
    cost: shipment.cost
  }
}

// ============================================
// SHIPMENT PROCESSING
// ============================================

/**
 * Process all shipments for the current week
 * Returns shipments that have arrived
 */
export function processShipments(
  state: SparePartsState,
  currentWeek: number,
  currentYear: number
): { state: SparePartsState; arrivedShipments: PartShipment[] } {
  const arrivedShipments: PartShipment[] = []
  const remainingShipments: PartShipment[] = []
  
  for (const shipment of state.activeShipments) {
    // Check if shipment has arrived
    const hasArrived = 
      (shipment.estimatedArrivalYear < currentYear) ||
      (shipment.estimatedArrivalYear === currentYear && shipment.estimatedArrivalWeek <= currentWeek)
    
    if (hasArrived && shipment.status === 'in_transit') {
      // Mark as delivered
      arrivedShipments.push({
        ...shipment,
        status: 'delivered' as PartShipmentStatus,
        actualArrivalWeek: currentWeek,
        actualArrivalYear: currentYear
      })
    } else {
      remainingShipments.push(shipment)
    }
  }
  
  // Move arrived parts to their destinations
  let updatedState = { ...state, activeShipments: remainingShipments }
  
  for (const shipment of arrivedShipments) {
    updatedState = moveParts(updatedState, shipment.parts, shipment.destination)
  }
  
  return { state: updatedState, arrivedShipments }
}

/**
 * Get shipment by ID
 */
export function getShipmentById(state: SparePartsState, shipmentId: string): PartShipment | undefined {
  return state.activeShipments.find(s => s.id === shipmentId)
}

/**
 * Get shipments for a race
 */
export function getShipmentsForRace(state: SparePartsState, raceId: string): PartShipment[] {
  return state.activeShipments.filter(s => s.raceId === raceId)
}

/**
 * Calculate estimated delivery date
 */
export function getEstimatedDelivery(
  originRegion: WorldRegion,
  destinationRegion: WorldRegion,
  method: ShippingMethod,
  currentWeek: number,
  currentYear: number
): { week: number; year: number } {
  const transitTime = calculateTransitTime(originRegion, destinationRegion, method)
  
  let arrivalWeek = currentWeek + Math.ceil(transitTime)
  let arrivalYear = currentYear
  
  while (arrivalWeek > 52) {
    arrivalWeek -= 52
    arrivalYear++
  }
  
  return { week: arrivalWeek, year: arrivalYear }
}

/**
 * Check if shipment will arrive in time for a race
 */
export function willArriveInTime(
  originRegion: WorldRegion,
  destinationRegion: WorldRegion,
  method: ShippingMethod,
  currentWeek: number,
  currentYear: number,
  raceWeek: number,
  raceYear: number
): boolean {
  const { week: arrivalWeek, year: arrivalYear } = getEstimatedDelivery(
    originRegion,
    destinationRegion,
    method,
    currentWeek,
    currentYear
  )
  
  // Need to arrive at least 1 week before race
  if (arrivalYear < raceYear) return true
  if (arrivalYear > raceYear) return false
  return arrivalWeek < raceWeek
}

/**
 * Find fastest shipping method that arrives in time
 */
export function findBestShippingMethod(
  originRegion: WorldRegion,
  destinationRegion: WorldRegion,
  currentWeek: number,
  currentYear: number,
  raceWeek: number,
  raceYear: number
): ShippingMethod | null {
  // Try standard first (cheapest)
  const methods: ShippingMethod[] = ['standard', 'express', 'air_freight']
  
  for (const method of methods) {
    if (willArriveInTime(originRegion, destinationRegion, method, currentWeek, currentYear, raceWeek, raceYear)) {
      return method
    }
  }
  
  return null // No method will arrive in time
}

// ============================================
// MANUFACTURER ORDERS
// ============================================

/**
 * Create a parts order from manufacturer
 */
export function createPartOrder(params: {
  partType: SparePartType
  quantity: number
  manufacturerId: string
  destinationWarehouse: string
  rushOrder: boolean
  unitCost: number
  currentWeek: number
  currentYear: number
}): PartOrder {
  // Get manufacturer tier for lead time calculation
  const manufacturer = MANUFACTURERS[params.manufacturerId]
  const tier: ManufacturerTier = manufacturer?.tier || 'mainstream'
  const orderConfig = MANUFACTURER_ORDER_CONFIG[tier]
  
  // Calculate lead time
  const leadWeeks = params.rushOrder 
    ? orderConfig.rushLeadWeeks 
    : orderConfig.standardLeadWeeks
  
  let arrivalWeek = params.currentWeek + Math.ceil(leadWeeks)
  let arrivalYear = params.currentYear
  
  while (arrivalWeek > 52) {
    arrivalWeek -= 52
    arrivalYear++
  }
  
  // Calculate total cost
  const rushMultiplier = params.rushOrder ? orderConfig.rushCostMultiplier : 1.0
  const totalCost = params.unitCost * params.quantity * rushMultiplier
  
  return {
    id: uuidv4(),
    partType: params.partType,
    quantity: params.quantity,
    manufacturerId: params.manufacturerId,
    orderWeek: params.currentWeek,
    orderYear: params.currentYear,
    estimatedArrivalWeek: arrivalWeek,
    estimatedArrivalYear: arrivalYear,
    destinationWarehouse: params.destinationWarehouse,
    status: 'processing',
    rushOrder: params.rushOrder,
    unitCost: params.unitCost,
    totalCost
  }
}

/**
 * Place a parts order
 */
export function placePartOrder(
  state: SparePartsState,
  partType: SparePartType,
  quantity: number,
  manufacturerId: string,
  destinationWarehouse: string,
  rushOrder: boolean,
  unitCost: number,
  currentWeek: number,
  currentYear: number
): { state: SparePartsState; order: PartOrder; cost: number } {
  const order = createPartOrder({
    partType,
    quantity,
    manufacturerId,
    destinationWarehouse,
    rushOrder,
    unitCost,
    currentWeek,
    currentYear
  })
  
  return {
    state: {
      ...state,
      pendingOrders: [...state.pendingOrders, order]
    },
    order,
    cost: order.totalCost
  }
}

/**
 * Process pending orders - check for arrivals
 */
export function processPartOrders(
  state: SparePartsState,
  currentWeek: number,
  currentYear: number
): { state: SparePartsState; deliveredOrders: PartOrder[]; newParts: SparePart[] } {
  const deliveredOrders: PartOrder[] = []
  const remainingOrders: PartOrder[] = []
  const newParts: SparePart[] = []
  
  for (const order of state.pendingOrders) {
    // Check if order has arrived
    const hasArrived = 
      (order.estimatedArrivalYear < currentYear) ||
      (order.estimatedArrivalYear === currentYear && order.estimatedArrivalWeek <= currentWeek)
    
    if (hasArrived && (order.status === 'processing' || order.status === 'in_transit')) {
      // Create the spare parts from the order
      const manufacturer = MANUFACTURERS[order.manufacturerId]
      const quality = manufacturer 
        ? MANUFACTURER_ORDER_CONFIG[manufacturer.tier].qualityGuarantee
        : 90
      
      const orderedParts: SparePart[] = []
      for (let i = 0; i < order.quantity; i++) {
        orderedParts.push(createSparePart({
          type: order.partType,
          manufacturerId: order.manufacturerId,
          quality: quality + Math.floor(Math.random() * 5), // Small variance
          location: order.destinationWarehouse,
          cost: order.unitCost,
          isInHouse: false,
          productionWeek: currentWeek,
          productionYear: currentYear
        }))
      }
      
      newParts.push(...orderedParts)
      deliveredOrders.push({
        ...order,
        status: 'delivered' as PartOrderStatus,
        deliveredParts: orderedParts.map(p => p.id)
      })
    } else {
      // Update status if processing -> in_transit
      if (order.status === 'processing') {
        const midpoint = Math.floor(
          (order.estimatedArrivalWeek - order.orderWeek) / 2
        )
        const transitStartWeek = order.orderWeek + midpoint
        
        if (currentYear > order.orderYear || currentWeek >= transitStartWeek) {
          remainingOrders.push({ ...order, status: 'in_transit' as PartOrderStatus })
        } else {
          remainingOrders.push(order)
        }
      } else {
        remainingOrders.push(order)
      }
    }
  }
  
  // Add new parts to inventory
  let updatedState = addParts({ ...state, pendingOrders: remainingOrders }, newParts, 'purchased')
  
  return { state: updatedState, deliveredOrders, newParts }
}

/**
 * Cancel a pending order
 */
export function cancelOrder(
  state: SparePartsState,
  orderId: string
): { state: SparePartsState; success: boolean; refund?: number; error?: string } {
  const order = state.pendingOrders.find(o => o.id === orderId)
  
  if (!order) {
    return { state, success: false, error: 'Order not found' }
  }
  
  if (order.status === 'in_transit') {
    return { state, success: false, error: 'Cannot cancel order that is already in transit' }
  }
  
  // 50% refund for cancellation
  const refund = Math.round(order.totalCost * 0.5)
  
  return {
    state: {
      ...state,
      pendingOrders: state.pendingOrders.map(o =>
        o.id === orderId ? { ...o, status: 'cancelled' as PartOrderStatus } : o
      )
    },
    success: true,
    refund
  }
}

// ============================================
// SHIPPING COST ESTIMATION
// ============================================

/**
 * Estimate shipping cost for parts
 */
export function estimateShippingCost(
  partTypes: { type: SparePartType; count: number }[],
  originRegion: WorldRegion,
  destinationRegion: WorldRegion,
  method: ShippingMethod
): number {
  return partTypes.reduce((sum, { type, count }) => {
    return sum + calculateShippingCost(type, originRegion, destinationRegion, method) * count
  }, 0)
}

/**
 * Get shipping options with costs and times
 */
export function getShippingOptions(
  partTypes: { type: SparePartType; count: number }[],
  originRegion: WorldRegion,
  destinationRegion: WorldRegion,
  currentWeek: number,
  currentYear: number
): {
  method: ShippingMethod
  cost: number
  transitWeeks: number
  arrivalWeek: number
  arrivalYear: number
}[] {
  const methods: ShippingMethod[] = ['standard', 'express', 'air_freight']
  
  return methods.map(method => {
    const cost = estimateShippingCost(partTypes, originRegion, destinationRegion, method)
    const transitWeeks = calculateTransitTime(originRegion, destinationRegion, method)
    const { week: arrivalWeek, year: arrivalYear } = getEstimatedDelivery(
      originRegion,
      destinationRegion,
      method,
      currentWeek,
      currentYear
    )
    
    return {
      method,
      cost,
      transitWeeks,
      arrivalWeek,
      arrivalYear
    }
  })
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get all pending shipments summary
 */
export function getShipmentsSummary(state: SparePartsState): {
  inTransit: number
  partsInTransit: number
  totalValue: number
} {
  const inTransitShipments = state.activeShipments.filter(s => s.status === 'in_transit')
  const partsInTransit = inTransitShipments.reduce((sum, s) => sum + s.parts.length, 0)
  const totalValue = inTransitShipments.reduce((sum, s) => sum + s.cost, 0)
  
  return {
    inTransit: inTransitShipments.length,
    partsInTransit,
    totalValue
  }
}

/**
 * Get all pending orders summary
 */
export function getOrdersSummary(state: SparePartsState): {
  pending: number
  totalParts: number
  totalCost: number
} {
  const pendingOrders = state.pendingOrders.filter(
    o => o.status === 'processing' || o.status === 'in_transit'
  )
  
  return {
    pending: pendingOrders.length,
    totalParts: pendingOrders.reduce((sum, o) => sum + o.quantity, 0),
    totalCost: pendingOrders.reduce((sum, o) => sum + o.totalCost, 0)
  }
}

/**
 * Check if warehouse has active incoming shipments
 */
export function hasIncomingShipments(state: SparePartsState, warehouseId: string): boolean {
  return state.activeShipments.some(
    s => s.destination === warehouseId && s.status === 'in_transit'
  )
}

/**
 * Get incoming shipments for a location
 */
export function getIncomingShipments(state: SparePartsState, location: string): PartShipment[] {
  return state.activeShipments.filter(
    s => s.destination === location && s.status === 'in_transit'
  )
}
