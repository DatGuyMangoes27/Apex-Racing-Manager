// ============================================
// SPARE PARTS MANUFACTURING
// ============================================
// In-house production queue and quality calculations

import { v4 as uuidv4 } from 'uuid'
import type {
  SparePart,
  SparePartsState,
  ManufacturingJob,
  ManufacturingJobStatus
} from '@/store/careerStore'
import type { SparePartType } from '@/data/spare-parts-config'
import { 
  MANUFACTURING_CONFIG,
  MANUFACTURER_ORDER_CONFIG,
  calculateManufacturingTime,
  calculateManufacturingQuality,
  calculateManufacturingCost
} from '@/data/spare-parts-config'
import { MANUFACTURERS } from '@/data/manufacturers'
import { addParts, createSparePart } from './partsInventory'

// ============================================
// MANUFACTURING JOB MANAGEMENT
// ============================================

/**
 * Create a new manufacturing job
 */
export function createManufacturingJob(params: {
  partType: SparePartType
  quantity: number
  manufacturingFacilityLevel: number
  currentWeek: number
  currentYear: number
  manufacturerId: string // For pricing reference
}): ManufacturingJob {
  const config = MANUFACTURING_CONFIG[params.partType]
  const manufacturer = MANUFACTURERS[params.manufacturerId]
  
  // Get purchase price for cost calculation
  const purchasePrice = manufacturer?.partsCosts[params.partType] || 10000
  
  // Calculate manufacturing time and cost
  const manufacturingWeeks = calculateManufacturingTime(
    params.partType,
    params.manufacturingFacilityLevel
  )
  
  const costPerPart = calculateManufacturingCost(
    params.partType,
    purchasePrice,
    params.manufacturingFacilityLevel
  )
  
  // Calculate completion time
  let completionWeek = params.currentWeek + Math.ceil(manufacturingWeeks)
  let completionYear = params.currentYear
  
  while (completionWeek > 52) {
    completionWeek -= 52
    completionYear++
  }
  
  // Quality target based on facility level
  const baseQuality = config.baseQuality + (params.manufacturingFacilityLevel - 1) * 2
  
  return {
    id: uuidv4(),
    partType: params.partType,
    quantity: params.quantity,
    startWeek: params.currentWeek,
    startYear: params.currentYear,
    completionWeek,
    completionYear,
    qualityTarget: baseQuality,
    status: 'queued',
    materialCost: Math.round(costPerPart * params.quantity * 0.7), // 70% materials
    laborCost: Math.round(costPerPart * params.quantity * 0.3)     // 30% labor
  }
}

/**
 * Queue a manufacturing job
 */
export function queueManufacturingJob(
  state: SparePartsState,
  partType: SparePartType,
  quantity: number,
  manufacturingFacilityLevel: number,
  currentWeek: number,
  currentYear: number,
  manufacturerId: string
): { state: SparePartsState; job: ManufacturingJob; cost: number } {
  const job = createManufacturingJob({
    partType,
    quantity,
    manufacturingFacilityLevel,
    currentWeek,
    currentYear,
    manufacturerId
  })
  
  // If no jobs in progress, start this one immediately
  const hasActiveJob = state.manufacturingQueue.some(j => j.status === 'in_progress')
  if (!hasActiveJob) {
    job.status = 'in_progress'
  }
  
  return {
    state: {
      ...state,
      manufacturingQueue: [...state.manufacturingQueue, job]
    },
    job,
    cost: job.materialCost + job.laborCost
  }
}

/**
 * Process manufacturing queue - check for completions and start new jobs
 */
export function processManufacturingQueue(
  state: SparePartsState,
  currentWeek: number,
  currentYear: number,
  manufacturingFacilityLevel: number
): { state: SparePartsState; completedJobs: ManufacturingJob[]; newParts: SparePart[] } {
  const completedJobs: ManufacturingJob[] = []
  const newParts: SparePart[] = []
  let updatedQueue: ManufacturingJob[] = []
  
  // First pass: check for completed jobs
  for (const job of state.manufacturingQueue) {
    if (job.status === 'cancelled') {
      // Skip cancelled jobs
      continue
    }
    
    // Check if job is complete
    const isComplete = 
      (job.completionYear < currentYear) ||
      (job.completionYear === currentYear && job.completionWeek <= currentWeek)
    
    if (isComplete && job.status === 'in_progress') {
      // Generate the parts
      const producedParts: SparePart[] = []
      
      for (let i = 0; i < job.quantity; i++) {
        const quality = calculateManufacturingQuality(job.partType, manufacturingFacilityLevel)
        
        producedParts.push(createSparePart({
          type: job.partType,
          manufacturerId: 'in-house',
          quality,
          location: 'hq', // Parts go to HQ
          cost: Math.round((job.materialCost + job.laborCost) / job.quantity),
          isInHouse: true,
          productionWeek: currentWeek,
          productionYear: currentYear
        }))
      }
      
      newParts.push(...producedParts)
      completedJobs.push({
        ...job,
        status: 'completed' as ManufacturingJobStatus,
        producedParts: producedParts.map(p => p.id)
      })
    } else {
      updatedQueue.push(job)
    }
  }
  
  // Second pass: start the next queued job if nothing is in progress
  const hasActiveJob = updatedQueue.some(j => j.status === 'in_progress')
  
  if (!hasActiveJob) {
    const nextJob = updatedQueue.find(j => j.status === 'queued')
    if (nextJob) {
      updatedQueue = updatedQueue.map(j =>
        j.id === nextJob.id ? { ...j, status: 'in_progress' as ManufacturingJobStatus } : j
      )
    }
  }
  
  // Add new parts to inventory
  let updatedState = addParts(
    { ...state, manufacturingQueue: updatedQueue },
    newParts,
    'manufactured'
  )
  
  return { state: updatedState, completedJobs, newParts }
}

/**
 * Cancel a manufacturing job
 */
export function cancelManufacturingJob(
  state: SparePartsState,
  jobId: string
): { state: SparePartsState; success: boolean; refund?: number; error?: string } {
  const job = state.manufacturingQueue.find(j => j.id === jobId)
  
  if (!job) {
    return { state, success: false, error: 'Job not found' }
  }
  
  if (job.status === 'completed') {
    return { state, success: false, error: 'Cannot cancel completed job' }
  }
  
  // Calculate refund based on status
  let refundPercent = 0.8 // 80% refund if queued
  if (job.status === 'in_progress') {
    refundPercent = 0.5 // 50% refund if in progress (materials committed)
  }
  
  const refund = Math.round((job.materialCost + job.laborCost) * refundPercent)
  
  // Remove cancelled job and potentially start next job
  let updatedQueue = state.manufacturingQueue.map(j =>
    j.id === jobId ? { ...j, status: 'cancelled' as ManufacturingJobStatus } : j
  )
  
  // If we cancelled an in-progress job, start the next queued one
  if (job.status === 'in_progress') {
    const nextJob = updatedQueue.find(j => j.status === 'queued')
    if (nextJob) {
      updatedQueue = updatedQueue.map(j =>
        j.id === nextJob.id ? { ...j, status: 'in_progress' as ManufacturingJobStatus } : j
      )
    }
  }
  
  return {
    state: { ...state, manufacturingQueue: updatedQueue },
    success: true,
    refund
  }
}

/**
 * Prioritize a queued job (move to front of queue)
 */
export function prioritizeJob(
  state: SparePartsState,
  jobId: string
): { state: SparePartsState; success: boolean; error?: string } {
  const job = state.manufacturingQueue.find(j => j.id === jobId)
  
  if (!job) {
    return { state, success: false, error: 'Job not found' }
  }
  
  if (job.status !== 'queued') {
    return { state, success: false, error: 'Can only prioritize queued jobs' }
  }
  
  // Reorder: put this job first among queued jobs
  const inProgressJobs = state.manufacturingQueue.filter(j => j.status === 'in_progress')
  const thisJob = state.manufacturingQueue.find(j => j.id === jobId)!
  const otherQueuedJobs = state.manufacturingQueue.filter(
    j => j.status === 'queued' && j.id !== jobId
  )
  const otherJobs = state.manufacturingQueue.filter(
    j => j.status !== 'in_progress' && j.status !== 'queued'
  )
  
  return {
    state: {
      ...state,
      manufacturingQueue: [...inProgressJobs, thisJob, ...otherQueuedJobs, ...otherJobs]
    },
    success: true
  }
}

// ============================================
// MANUFACTURING COST ESTIMATION
// ============================================

/**
 * Estimate manufacturing cost for a batch
 */
export function estimateManufacturingCost(
  partType: SparePartType,
  quantity: number,
  manufacturingFacilityLevel: number,
  manufacturerId: string
): {
  materialCost: number
  laborCost: number
  totalCost: number
  timeWeeks: number
  estimatedQuality: number
} {
  const manufacturer = MANUFACTURERS[manufacturerId]
  const purchasePrice = manufacturer?.partsCosts[partType] || 10000
  
  const costPerPart = calculateManufacturingCost(
    partType,
    purchasePrice,
    manufacturingFacilityLevel
  )
  
  const timeWeeks = calculateManufacturingTime(partType, manufacturingFacilityLevel)
  const config = MANUFACTURING_CONFIG[partType]
  const estimatedQuality = config.baseQuality + (manufacturingFacilityLevel - 1) * 2
  
  const totalCost = costPerPart * quantity
  
  return {
    materialCost: Math.round(totalCost * 0.7),
    laborCost: Math.round(totalCost * 0.3),
    totalCost,
    timeWeeks,
    estimatedQuality
  }
}

/**
 * Compare manufacturing vs purchasing costs
 */
export function compareManufactureVsPurchase(
  partType: SparePartType,
  quantity: number,
  manufacturingFacilityLevel: number,
  manufacturerId: string,
  rushOrder: boolean = false
): {
  manufacture: {
    cost: number
    timeWeeks: number
    quality: number
    recommended: boolean
  }
  purchase: {
    cost: number
    timeWeeks: number
    quality: number
    recommended: boolean
  }
  savings: number
  timeDifference: number
} {
  const manufacturer = MANUFACTURERS[manufacturerId]
  const purchasePrice = manufacturer?.partsCosts[partType] || 10000
  const manufacturerTier = manufacturer?.tier || 'mainstream'
  
  // Manufacturing costs
  const mfgEstimate = estimateManufacturingCost(
    partType,
    quantity,
    manufacturingFacilityLevel,
    manufacturerId
  )
  
  // Purchase costs
  const { rushCostMultiplier, standardLeadWeeks, rushLeadWeeks, qualityGuarantee } = 
    MANUFACTURER_ORDER_CONFIG[manufacturerTier]
  
  const purchaseCost = purchasePrice * quantity * (rushOrder ? rushCostMultiplier : 1)
  const purchaseTime = rushOrder ? rushLeadWeeks : standardLeadWeeks
  
  const savings = purchaseCost - mfgEstimate.totalCost
  const timeDifference = purchaseTime - mfgEstimate.timeWeeks
  
  // Recommendations
  // Prefer manufacturing if: cheaper AND quality is acceptable AND time is acceptable
  const manufacturingRecommended = 
    mfgEstimate.totalCost < purchaseCost && 
    mfgEstimate.estimatedQuality >= 80 &&
    mfgEstimate.timeWeeks <= purchaseTime * 1.5
  
  // Prefer purchasing if: faster OR better quality needed OR manufacturing facility is low
  const purchasingRecommended = !manufacturingRecommended
  
  return {
    manufacture: {
      cost: mfgEstimate.totalCost,
      timeWeeks: mfgEstimate.timeWeeks,
      quality: mfgEstimate.estimatedQuality,
      recommended: manufacturingRecommended
    },
    purchase: {
      cost: purchaseCost,
      timeWeeks: purchaseTime,
      quality: qualityGuarantee,
      recommended: purchasingRecommended
    },
    savings,
    timeDifference
  }
}

// ============================================
// MANUFACTURING QUEUE UTILITIES
// ============================================

/**
 * Get current manufacturing queue status
 */
export function getManufacturingQueueStatus(state: SparePartsState): {
  currentJob: ManufacturingJob | null
  queuedJobs: number
  totalQueuedParts: number
  estimatedQueueClearWeeks: number
} {
  const activeJobs = state.manufacturingQueue.filter(
    j => j.status === 'in_progress' || j.status === 'queued'
  )
  
  const currentJob = state.manufacturingQueue.find(j => j.status === 'in_progress') || null
  const queuedJobs = state.manufacturingQueue.filter(j => j.status === 'queued').length
  const totalQueuedParts = activeJobs.reduce((sum, j) => sum + j.quantity, 0)
  
  // Estimate total time for all queued jobs
  // This is a rough estimate - actual time depends on facility level changes
  let estimatedQueueClearWeeks = 0
  for (const job of activeJobs) {
    if (job.status === 'in_progress') {
      // Remaining time for current job (rough estimate)
      const totalWeeks = job.completionWeek - job.startWeek + 
        (job.completionYear - job.startYear) * 52
      estimatedQueueClearWeeks += Math.max(0, totalWeeks)
    } else {
      // Full time for queued jobs
      const totalWeeks = job.completionWeek - job.startWeek + 
        (job.completionYear - job.startYear) * 52
      estimatedQueueClearWeeks += totalWeeks
    }
  }
  
  return {
    currentJob,
    queuedJobs,
    totalQueuedParts,
    estimatedQueueClearWeeks
  }
}

/**
 * Get job by ID
 */
export function getJobById(state: SparePartsState, jobId: string): ManufacturingJob | undefined {
  return state.manufacturingQueue.find(j => j.id === jobId)
}

/**
 * Get jobs by part type
 */
export function getJobsByPartType(
  state: SparePartsState,
  partType: SparePartType
): ManufacturingJob[] {
  return state.manufacturingQueue.filter(j => j.partType === partType)
}

/**
 * Calculate total pending production by part type
 */
export function getPendingProductionByType(
  state: SparePartsState
): Record<SparePartType, number> {
  const pending: Record<SparePartType, number> = {
    engine: 0,
    chassis: 0,
    brakes: 0,
    suspension: 0,
    gearbox: 0
  }
  
  for (const job of state.manufacturingQueue) {
    if (job.status === 'in_progress' || job.status === 'queued') {
      pending[job.partType] += job.quantity
    }
  }
  
  return pending
}

/**
 * Check if manufacturing facility can handle more jobs
 * Returns capacity utilization (0-1)
 */
export function getManufacturingCapacityUtilization(
  state: SparePartsState,
  maxConcurrentJobs: number = 3 // Based on facility level
): number {
  const activeJobs = state.manufacturingQueue.filter(
    j => j.status === 'in_progress' || j.status === 'queued'
  ).length
  
  return Math.min(1, activeJobs / maxConcurrentJobs)
}

/**
 * Get recommended max concurrent jobs based on facility level
 */
export function getMaxConcurrentJobs(manufacturingFacilityLevel: number): number {
  // Level 1: 2 jobs, Level 2: 3 jobs, Level 3: 4 jobs, Level 4: 5 jobs, Level 5: 6 jobs
  return manufacturingFacilityLevel + 1
}
