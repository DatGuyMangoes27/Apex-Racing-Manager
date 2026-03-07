// ============================================
// LIFESTYLE ASSETS MANAGER
// ============================================
// Business logic for managing player-owned lifestyle assets:
// vehicles, furnishings, memberships, and calculating lifestyle score.

import {
  OwnedVehicle,
  HomeFurnishing,
  Membership,
  LuxuryService,
  LuxuryExperience,
  Collectible,
  Pet,
  WardrobeItem,
  DietPlan,
  LifestyleAssets,
  LifestyleScoreBreakdown,
  FurnishingTier,
  FurnishingCategory,
  MembershipType,
  FURNISHING_CATALOG,
  MEMBERSHIP_CATALOG,
  LUXURY_SERVICES_CATALOG,
  EXPERIENCES_CATALOG,
  COLLECTIBLES_CATALOG,
  PET_CATALOG,
  WARDROBE_CATALOG,
  DIET_CATALOG,
  LIFESTYLE_SCORE_WEIGHTS,
  LIFESTYLE_LEVEL_THRESHOLDS,
  VEHICLE_MAINTENANCE_RATES,
  VEHICLE_INSURANCE_RATES,
  VEHICLE_DEPRECIATION_RATES,
  getLifestyleLevelFromScore,
  getFurnishingById,
  getMembershipById,
  FurnishingCatalogEntry,
  MembershipCatalogEntry,
  type LuxuryServiceCatalogEntry,
  type ExperienceCatalogEntry,
  type CollectibleCatalogEntry,
  type PetCatalogEntry,
  type WardrobeCatalogEntry,
  type DietCatalogEntry,
  calculateCollectiblePurchasePrice
} from '@/data/lifestyle-assets-config'
import { VEHICLE_CATALOG } from '@/data/lifestyle-config';
import type { PersonalStaff, Hobby } from '@/data/lifestyle-config';
import type { PersonalFinancialState } from '@/data/personal-finance-config';

// ============================================
// TYPES
// ============================================

export interface WeeklyAssetProcessingResult {
  updatedAssets: LifestyleAssets
  totalCosts: number
  depreciation: number
  appreciation: number
  costBreakdown: {
    vehicleMaintenance: number
    vehicleInsurance: number
    membershipFees: number
    total: number
  }
  events: string[]
}

// ============================================
// VALUE CHANGE PROCESSING
// ============================================

/**
 * Process monthly vehicle depreciation/appreciation.
 * Regular vehicles depreciate, collectible/classic vehicles appreciate.
 * Uses VEHICLE_DEPRECIATION_RATES config with random variance.
 */
function processVehicleDepreciation(vehicles: OwnedVehicle[], months: number): OwnedVehicle[] {
  return vehicles.map(v => {
    // Get the rate: positive = depreciation, negative = appreciation (for collectibles)
    const configRate = VEHICLE_DEPRECIATION_RATES[v.category] ?? 0.10
    const rate = v.isCollectible
      ? -(v.appreciationRate || Math.abs(configRate))
      : (v.depreciationRate || configRate)
    // Monthly rate with +/-20% random variance so values aren't perfectly predictable
    const variance = 0.8 + Math.random() * 0.4
    const monthlyRate = (rate / 12) * months * variance
    const newValue = Math.round(v.currentValue * (1 - monthlyRate))
    // Regular vehicles floor at 10% of purchase price; collectibles have no floor
    const floor = v.isCollectible ? 0 : Math.round(v.purchasePrice * 0.10)
    return { ...v, currentValue: Math.max(newValue, floor) }
  })
}

/**
 * Process monthly furnishing depreciation.
 * Condition degrades over time based on tier quality.
 * Value drops proportionally with condition.
 */
function processFurnishingDepreciation(furnishings: HomeFurnishing[], months: number): HomeFurnishing[] {
  return furnishings.map(f => {
    // Luxury items degrade slower than basic items
    const degradeRate = f.tier === 'luxury' ? 0.5 : f.tier === 'premium' ? 0.8 : 1.2
    const newCondition = Math.max(0, f.condition - (degradeRate * months))
    // Value drops proportionally with condition; max 80% resale even at 100% condition
    const conditionRatio = newCondition / 100
    const newValue = Math.round(f.purchasePrice * conditionRatio * 0.8)
    const needsReplacement = newCondition < 25
    return { ...f, condition: newCondition, currentValue: newValue, needsReplacement }
  })
}

/**
 * Process monthly collectible appreciation/depreciation.
 * Rarity affects consistency: legendary items are more stable,
 * common items are more volatile and can lose value.
 */
function processCollectibleAppreciation(collectibles: Collectible[], months: number): Collectible[] {
  return collectibles.map(c => {
    const baseRate = c.appreciationRate || 0.04 // Default 4% annual
    // Rarity multiplier: legendary items appreciate more consistently
    const rarityMult: Record<string, number> = { legendary: 1.3, rare: 1.1, uncommon: 1.0, common: 0.9 }
    const mult = rarityMult[c.rarity] || 1.0
    // Random market variance: common items more volatile
    const volatilityMap: Record<string, number> = { legendary: 0.15, rare: 0.25, uncommon: 0.35, common: 0.45 }
    const volatility = volatilityMap[c.rarity] || 0.3
    const variance = (1 - volatility) + Math.random() * (volatility * 2)
    const monthlyRate = (baseRate * mult / 12) * months * variance
    const newValue = Math.round(c.currentValue * (1 + monthlyRate))
    // Floor at 50% of purchase price
    return { ...c, currentValue: Math.max(newValue, Math.round(c.purchasePrice * 0.5)) }
  })
}

// ============================================
// MEMBERSHIP MANAGEMENT
// ============================================

export function joinMembership(
  membershipId: string,
  tier: 'standard' | 'gold' | 'platinum' | 'founding',
  finances: PersonalFinancialState,
  netWorth: number,
  currentWeek: number,
  currentYear: number
): PurchaseResult {
  const catalogEntry = getMembershipById(membershipId)
  if (!catalogEntry) {
    return { success: false, message: 'Membership not found in catalog' }
  }
  
  // Check net worth requirement
  if (catalogEntry.minimumNetWorth && netWorth < catalogEntry.minimumNetWorth) {
    return {
      success: false,
      message: `Requires minimum net worth of $${catalogEntry.minimumNetWorth.toLocaleString()}`
    }
  }
  
  // Find tier details
  const tierDetails = catalogEntry.tiers.find(t => t.tier === tier)
  if (!tierDetails) {
    return { success: false, message: `${tier} tier not available for this membership` }
  }
  
  // Calculate total initiation cost
  const initiationCost = catalogEntry.initializationFee + tierDetails.additionalFee
  
  if (finances.liquidCash < initiationCost) {
    return {
      success: false,
      message: `Insufficient funds for initiation fee. Need $${initiationCost.toLocaleString()}`
    }
  }
  
  const membership: Membership = {
    id: `membership_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: catalogEntry.type,
    clubId: catalogEntry.id,
    name: catalogEntry.name,
    location: catalogEntry.location,
    
    joinDate: { week: currentWeek, year: currentYear },
    annualFee: catalogEntry.annualFee + tierDetails.additionalFee,
    monthlyFee: catalogEntry.monthlyFee,
    initializationFee: initiationCost,
    
    prestigeBonus: catalogEntry.prestigeBonus + tierDetails.additionalPrestige,
    networkingBonus: catalogEntry.networkingBonus,
    stressReduction: catalogEntry.stressReduction,
    
    membershipTier: tier,
    yearsAsMember: 0,
    eventsAttended: 0,
    
    perks: tierDetails.perks
  }
  
  return {
    success: true,
    message: `Joined ${catalogEntry.name} (${tier} tier) for $${initiationCost.toLocaleString()} initiation fee`,
    cost: initiationCost,
    item: membership
  }
}

export function cancelMembership(membership: Membership): SaleResult {
  // No refund on cancellation, just confirmation
  return {
    success: true,
    message: `Cancelled ${membership.name} membership`,
    proceeds: 0
  }
}

export function processMembershipAnniversary(
  memberships: Membership[],
  currentWeek: number,
  currentYear: number
): Membership[] {
  return memberships.map(membership => {
    const joinWeek = membership.joinDate.week
    const joinYear = membership.joinDate.year
    
    // Check if anniversary week
    const yearsElapsed = currentYear - joinYear
    const isAnniversary = currentWeek === joinWeek && yearsElapsed > membership.yearsAsMember
    
    if (isAnniversary) {
      return {
        ...membership,
        yearsAsMember: membership.yearsAsMember + 1,
        // Long-term members get slight bonus
        prestigeBonus: membership.prestigeBonus + (membership.yearsAsMember >= 5 ? 1 : 0)
      }
    }
    
    return membership
  })
}

// ============================================
// LIFESTYLE SCORE CALCULATION
// ============================================

export function calculateLifestyleScore(
  primaryResidenceValue: number,
  assets: LifestyleAssets,
  collectionsValue: number,
  staff: PersonalStaff[],
  hobbies: Hobby[]
): LifestyleScoreBreakdown {
  const weights = LIFESTYLE_SCORE_WEIGHTS
  
  // 1. Housing score (0-30)
  let housingScore = 0
  for (const threshold of weights.housing.thresholds) {
    if (primaryResidenceValue >= threshold.minValue) {
      housingScore = threshold.points
    }
  }
  housingScore = Math.min(housingScore, weights.housing.maxPoints)
  
  // 2. Vehicles score (0-20)
  const totalVehicleValue = assets.vehicles.reduce((sum, v) => sum + v.currentValue, 0)
  let vehicleScore = 0
  for (const threshold of weights.vehicles.thresholds) {
    if (totalVehicleValue >= threshold.minValue) {
      vehicleScore = threshold.points
    }
  }
  vehicleScore = Math.min(vehicleScore, weights.vehicles.maxPoints)
  
  // 3. Collections score (0-15)
  let collectionsScore = 0
  for (const threshold of weights.collections.thresholds) {
    if (collectionsValue >= threshold.minValue) {
      collectionsScore = threshold.points
    }
  }
  collectionsScore = Math.min(collectionsScore, weights.collections.maxPoints)
  
  // 4. Furnishings score (0-10) - based on highest tier across all categories
  const furnishingTiers = assets.furnishings.map(f => f.tier)
  let highestTierPoints = 0
  for (const tier of furnishingTiers) {
    const tierPoints = weights.furnishings.tierPoints[tier] || 0
    highestTierPoints = Math.max(highestTierPoints, tierPoints)
  }
  const furnishingsScore = Math.min(highestTierPoints, weights.furnishings.maxPoints)
  
  // 5. Memberships score (0-10)
  const membershipBasePoints = assets.memberships.length * weights.memberships.perMembershipBase
  const membershipExclusivityBonus = assets.memberships.reduce((sum, m) => {
    const catalog = getMembershipById(m.clubId)
    return sum + ((catalog?.exclusivity || 0) * weights.memberships.exclusivityBonus)
  }, 0)
  const membershipsScore = Math.min(
    membershipBasePoints + membershipExclusivityBonus,
    weights.memberships.maxPoints
  )
  
  // 6. Staff score (0-10)
  const staffBasePoints = staff.length * weights.staff.perStaffMember
  const staffQualityBonus = staff.reduce((sum, s) => 
    sum + (s.competence * weights.staff.qualityBonus), 0
  )
  const staffScore = Math.min(staffBasePoints + staffQualityBonus, weights.staff.maxPoints)
  
  // 7. Hobbies score (0-5)
  const hobbiesBasePoints = hobbies.length * weights.hobbies.perHobby
  const hobbiesPrestigeBonus = hobbies.reduce((sum, h) => 
    sum + ((h as any).prestigeLevel || 0) * weights.hobbies.prestigeBonus, 0
  )
  const hobbiesScore = Math.min(hobbiesBasePoints + hobbiesPrestigeBonus, weights.hobbies.maxPoints)
  
  // Total score
  const total = Math.round(
    housingScore + vehicleScore + collectionsScore + 
    furnishingsScore + membershipsScore + staffScore + hobbiesScore
  )
  
  // Determine level from score
  const level = getLifestyleLevelFromScore(total)
  
  return {
    housing: Math.round(housingScore * 10) / 10,
    vehicles: Math.round(vehicleScore * 10) / 10,
    collections: Math.round(collectionsScore * 10) / 10,
    furnishings: Math.round(furnishingsScore * 10) / 10,
    memberships: Math.round(membershipsScore * 10) / 10,
    staff: Math.round(staffScore * 10) / 10,
    hobbies: Math.round(hobbiesScore * 10) / 10,
    total,
    level
  }
}

// ============================================
// WEEKLY LIFESTYLE BONUSES (Aggregates all asset bonuses into gameplay effects)
// ============================================

export interface WeeklyLifestyleBonuses {
  // Stress & Health
  totalStressReduction: number       // Points of stress reduced per week (passive)
  totalHealthBonus: number           // Bonus to health recovery per week
  totalFitnessBonus: number          // Bonus to fitness per week
  totalEnergyBonus: number           // Reduces fatigue debt carry-over
  timeFreedPerWeek: number           // Extra hours freed from services (added to day budget)
  
  // Prestige & Brand
  totalPrestigeBonus: number         // Added to brand value / public image calculation
  totalConfidenceBoost: number       // Bonus for negotiations and social events
  totalNetworkingBonus: number       // Bonus for contact quality at events
  
  // Happiness
  totalHappinessBoost: number        // Passive happiness effect
  
  // Breakdown for UI
  breakdown: {
    services: { stressReduction: number; prestigeBonus: number; timeFreed: number; healthBonus: number }
    dietPlans: { healthBonus: number; fitnessBonus: number; energyBonus: number; stressReduction: number }
    memberships: { prestigeBonus: number; networkingBonus: number; stressReduction: number }
    wardrobe: { prestigeBonus: number; confidenceBoost: number; networkingBonus: number }
    vehicles: { prestigeBonus: number }
    furnishings: { comfortBonus: number; prestigeBonus: number }
    collectibles: { prestigeBonus: number }
    pets: { stressReduction: number; happinessBoost: number }
    experiences: { stressReduction: number; networkingBonus: number; prestigeBonus: number }
  }
}

/**
 * Aggregates ALL lifestyle asset bonuses into concrete gameplay effects.
 * Call this during weekly processing and apply the results to:
 * - Health/stress (stressLevel, health, fitness)
 * - Day budget (fatigueDebt reduction, bonus hours)
 * - Brand (publicImage, brandValue via prestige)
 * - Social events (networking bonuses, confidence)
 * - Sponsor negotiations (prestige/confidence bonuses)
 */
export function processWeeklyLifestyleBonuses(
  assets: LifestyleAssets
): WeeklyLifestyleBonuses {
  // --- Services ---
  const activeServices = (assets.services || []).filter(s => s.isActive)
  const serviceStress = activeServices.reduce((sum, s) => sum + (s.stressReduction || 0), 0)
  const servicePrestige = activeServices.reduce((sum, s) => sum + (s.prestigeBonus || 0), 0)
  const serviceTimeFreed = activeServices.reduce((sum, s) => sum + (s.timeFreedPerWeek || 0), 0)
  const serviceHealth = activeServices.reduce((sum, s) => sum + (s.healthBonus || 0), 0)
  
  // --- Diet Plans ---
  const activeDiets = (assets.dietPlans || []).filter(d => d.isActive)
  const dietHealth = activeDiets.reduce((sum, d) => sum + (d.healthBonus || 0), 0)
  const dietFitness = activeDiets.reduce((sum, d) => sum + (d.fitnessBonus || 0), 0)
  const dietEnergy = activeDiets.reduce((sum, d) => sum + (d.energyBonus || 0), 0)
  const dietStress = activeDiets.reduce((sum, d) => sum + (d.stressReduction || 0), 0)
  
  // --- Memberships ---
  const memberPrestige = (assets.memberships || []).reduce((sum, m) => sum + (m.prestigeBonus || 0), 0)
  const memberNetworking = (assets.memberships || []).reduce((sum, m) => sum + (m.networkingBonus || 0), 0)
  const memberStress = (assets.memberships || []).reduce((sum, m) => sum + (m.stressReduction || 0), 0)
  
  // --- Wardrobe ---
  const wardrobePrestige = (assets.wardrobe || []).reduce((sum, w) => sum + (w.prestigeBonus || 0), 0)
  const wardrobeConfidence = (assets.wardrobe || []).reduce((sum, w) => sum + (w.confidenceBoost || 0), 0)
  const wardrobeNetworking = (assets.wardrobe || []).reduce((sum, w) => sum + (w.networkingBonus || 0), 0)
  
  // --- Vehicles (primary vehicle gets extra weight) ---
  const primaryVehicle = (assets.vehicles || []).find(v => v.isPrimary)
  const vehiclePrestige = (assets.vehicles || []).reduce((sum, v) => {
    const catalog = VEHICLE_CATALOG.find(c => c.brand === v.brand && c.model === v.model)
    return sum + ((catalog as any)?.prestige || 0)
  }, 0)
  // Primary vehicle gives a bonus on top
  const primaryVehiclePrestige = primaryVehicle ? (() => {
    const catalog = VEHICLE_CATALOG.find(c => c.brand === primaryVehicle.brand && c.model === primaryVehicle.model)
    return ((catalog as any)?.prestige || 0) * 0.5 // 50% extra for primary
  })() : 0
  
  // --- Furnishings ---
  const furnishingComfort = (assets.furnishings || []).reduce((sum, f) => sum + (f.comfortBonus || 0), 0)
  const furnishingPrestige = (assets.furnishings || []).reduce((sum, f) => sum + (f.prestigeBonus || 0), 0)
  
  // --- Collectibles ---
  const collectiblePrestige = (assets.collectibles || []).reduce((sum, c) => sum + (c.prestigeBonus || 0), 0)
  
  // --- Pets (passive weekly stress reduction + happiness) ---
  const petStress = (assets.pets || []).reduce((sum, p) => sum + Math.round((p.stressReduction || 0) * 0.3), 0) // 30% of full value as passive
  const petHappiness = (assets.pets || []).reduce((sum, p) => sum + Math.round((p.happinessBoost || 0) * 0.2), 0)
  
  // --- Experiences (active/recent experiences give temporary bonuses) ---
  const activeExperiences = (assets.experiences || []).filter(e => !e.completedWeek)
  const expStress = activeExperiences.reduce((sum, e) => sum + (e.stressReduction || 0), 0)
  const expNetworking = activeExperiences.reduce((sum, e) => sum + (e.networkingBonus || 0), 0)
  const expPrestige = activeExperiences.reduce((sum, e) => sum + (e.prestigeBonus || 0), 0)
  
  // --- Aggregate ---
  const totalStressReduction = serviceStress + dietStress + memberStress + petStress + expStress + Math.round(furnishingComfort * 0.1)
  const totalHealthBonus = serviceHealth + dietHealth
  const totalFitnessBonus = dietFitness
  const totalEnergyBonus = dietEnergy
  const timeFreedPerWeek = serviceTimeFreed
  const totalPrestigeBonus = servicePrestige + memberPrestige + wardrobePrestige + vehiclePrestige + primaryVehiclePrestige + furnishingPrestige + collectiblePrestige + expPrestige
  const totalConfidenceBoost = wardrobeConfidence
  const totalNetworkingBonus = memberNetworking + wardrobeNetworking + expNetworking
  const totalHappinessBoost = petHappiness
  
  return {
    totalStressReduction,
    totalHealthBonus,
    totalFitnessBonus,
    totalEnergyBonus,
    timeFreedPerWeek,
    totalPrestigeBonus,
    totalConfidenceBoost,
    totalNetworkingBonus,
    totalHappinessBoost,
    breakdown: {
      services: { stressReduction: serviceStress, prestigeBonus: servicePrestige, timeFreed: serviceTimeFreed, healthBonus: serviceHealth },
      dietPlans: { healthBonus: dietHealth, fitnessBonus: dietFitness, energyBonus: dietEnergy, stressReduction: dietStress },
      memberships: { prestigeBonus: memberPrestige, networkingBonus: memberNetworking, stressReduction: memberStress },
      wardrobe: { prestigeBonus: wardrobePrestige, confidenceBoost: wardrobeConfidence, networkingBonus: wardrobeNetworking },
      vehicles: { prestigeBonus: vehiclePrestige + primaryVehiclePrestige },
      furnishings: { comfortBonus: furnishingComfort, prestigeBonus: furnishingPrestige },
      collectibles: { prestigeBonus: collectiblePrestige },
      pets: { stressReduction: petStress, happinessBoost: petHappiness },
      experiences: { stressReduction: expStress, networkingBonus: expNetworking, prestigeBonus: expPrestige }
    }
  }
}

// ============================================
// WEEKLY PROCESSING
// ============================================

export function processWeeklyAssets(
  assets: LifestyleAssets,
  currentWeek: number,
  currentYear: number,
  isMonthEnd: boolean = false
): WeeklyAssetProcessingResult {
  const events: string[] = []
  let updatedAssets = { ...assets }
  
  // Monthly processing (every 4 weeks)
  if (isMonthEnd) {
    // Process vehicle depreciation/appreciation
    const updatedVehicles = processVehicleDepreciation(assets.vehicles, 1)
    
    // Calculate vehicle value changes
    const oldVehicleValue = assets.vehicles.reduce((sum, v) => sum + v.currentValue, 0)
    const newVehicleValue = updatedVehicles.reduce((sum, v) => sum + v.currentValue, 0)
    const vehicleValueChange = newVehicleValue - oldVehicleValue
    
    if (vehicleValueChange > 0) {
      events.push(`Vehicles appreciated by $${vehicleValueChange.toLocaleString()}`)
    } else if (vehicleValueChange < 0) {
      events.push(`Vehicles depreciated by $${Math.abs(vehicleValueChange).toLocaleString()}`)
    }
    
    // Process furnishing depreciation
    const updatedFurnishings = processFurnishingDepreciation(assets.furnishings, 1)
    
    // Check for furnishings needing replacement
    const needsReplacement = updatedFurnishings.filter(f => f.needsReplacement && !assets.furnishings.find(of => of.id === f.id)?.needsReplacement)
    needsReplacement.forEach(f => {
      events.push(`${f.name} needs replacement (condition: ${Math.round(f.condition)}%)`)
    })
    
    // Process collectible appreciation
    const updatedCollectibles = processCollectibleAppreciation(assets.collectibles || [], 1)
    
    const oldCollectibleValue = (assets.collectibles || []).reduce((sum, c) => sum + c.currentValue, 0)
    const newCollectibleValue = updatedCollectibles.reduce((sum, c) => sum + c.currentValue, 0)
    const collectibleValueChange = newCollectibleValue - oldCollectibleValue
    
    if (collectibleValueChange > 0) {
      events.push(`Collectibles appreciated by $${collectibleValueChange.toLocaleString()}`)
    } else if (collectibleValueChange < 0) {
      events.push(`Collectibles depreciated by $${Math.abs(collectibleValueChange).toLocaleString()}`)
    }

    updatedAssets = {
      ...updatedAssets,
      vehicles: updatedVehicles,
      furnishings: updatedFurnishings,
      collectibles: updatedCollectibles
    }
  }
  
  // Process membership anniversaries
  const updatedMemberships = processMembershipAnniversary(assets.memberships, currentWeek, currentYear)
  const anniversaries = updatedMemberships.filter((m, i) => 
    m.yearsAsMember > assets.memberships[i]?.yearsAsMember
  )
  anniversaries.forEach(m => {
    events.push(`${m.yearsAsMember} year anniversary at ${m.name}!`)
  })
  
  updatedAssets = {
    ...updatedAssets,
    memberships: updatedMemberships
  }
  
  // Calculate weekly costs
  const vehicleMaintenance = Math.round(
    assets.vehicles.reduce((sum, v) => sum + v.monthlyMaintenanceCost, 0) / 4
  )
  const vehicleInsurance = Math.round(
    assets.vehicles.reduce((sum, v) => sum + v.monthlyInsuranceCost, 0) / 4
  )
  const membershipFees = Math.round(
    assets.memberships.reduce((sum, m) => sum + m.monthlyFee + (m.annualFee / 12), 0) / 4
  )
  
  const totalCosts = vehicleMaintenance + vehicleInsurance + membershipFees
  
  // Calculate net appreciation/depreciation this period
  const appreciation = assets.vehicles
    .filter(v => v.isCollectible)
    .reduce((sum, v) => sum + (v.currentValue * (v.appreciationRate || 0) / 100 / 52), 0)
  
  const depreciation = assets.vehicles
    .filter(v => !v.isCollectible)
    .reduce((sum, v) => sum + (v.currentValue * (v.depreciationRate || 0) / 100 / 52), 0)
  
  return {
    updatedAssets,
    totalCosts,
    depreciation: Math.round(depreciation),
    appreciation: Math.round(appreciation),
    costBreakdown: {
      vehicleMaintenance,
      vehicleInsurance,
      membershipFees,
      total: totalCosts
    },
    events
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getTotalAssetValue(assets: LifestyleAssets): number {
  const vehicleValue = (assets.vehicles || []).reduce((sum, v) => sum + v.currentValue, 0)
  const furnishingValue = (assets.furnishings || []).reduce((sum, f) => sum + f.currentValue, 0)
  const collectibleValue = (assets.collectibles || []).reduce((sum, c) => sum + c.currentValue, 0)
  return vehicleValue + furnishingValue + collectibleValue
}

export function getAssetSummary(assets: LifestyleAssets): {
  vehicleCount: number
  vehicleValue: number
  furnishingCount: number
  furnishingValue: number
  membershipCount: number
  collectibleCount: number
  collectibleValue: number
  monthlyAssetCosts: number
  annualMembershipFees: number
} {
  const vehicleValue = (assets.vehicles || []).reduce((sum, v) => sum + v.currentValue, 0)
  const furnishingValue = (assets.furnishings || []).reduce((sum, f) => sum + f.currentValue, 0)
  const collectibleValue = (assets.collectibles || []).reduce((sum, c) => sum + c.currentValue, 0)
  const monthlyVehicleCosts = (assets.vehicles || []).reduce((sum, v) =>
    sum + (v.maintenanceCostPerWeek || 0) * 4 + (v.insuranceCostPerWeek || 0) * 4, 0
  )
  const annualMembershipFees = (assets.memberships || []).reduce((sum, m) => sum + (m.annualFee || 0), 0)
  const monthlyMembershipFees = (assets.memberships || []).reduce((sum, m) => sum + (m.monthlyFee || 0), 0)

  return {
    vehicleCount: (assets.vehicles || []).length,
    vehicleValue,
    furnishingCount: (assets.furnishings || []).length,
    furnishingValue,
    membershipCount: (assets.memberships || []).length,
    collectibleCount: (assets.collectibles || []).length,
    collectibleValue,
    monthlyAssetCosts: monthlyVehicleCosts + monthlyMembershipFees,
    annualMembershipFees
  }
}

export function canAffordAsset(
  price: number,
  liquidCash: number,
  minimumReserve: number = 50000
): { canAfford: boolean; reason?: string } {
  if (liquidCash < price) {
    return { canAfford: false, reason: 'Insufficient funds' }
  }

  if (liquidCash - price < minimumReserve) {
    return {
      canAfford: false,
      reason: `Would leave less than $${minimumReserve.toLocaleString()} reserve`
    }
  }

  return { canAfford: true }
}

export function getVehicleCatalog() {
  return VEHICLE_CATALOG.map((v, index) => ({
    index,
    brand: v.brand,
    model: v.model,
    type: v.type,
    price: v.basePrice,
    prestige: v.prestige,
    enjoyment: v.enjoyment,
    isCollectible: (v as any).collectible === true
  }))
}

export function getMembershipCatalog(): MembershipCatalogEntry[] {
  return MEMBERSHIP_CATALOG
}

export function getFurnishingCatalog(): FurnishingCatalogEntry[] {
  return FURNISHING_CATALOG
}

// ============================================
// LUXURY SERVICES MANAGEMENT
// ============================================

export function subscribeService(
  catalogId: string,
  tier: 'standard' | 'premium' | 'elite',
  currentWeek: number,
  currentYear: number
): PurchaseResult {
  const catalogEntry = LUXURY_SERVICES_CATALOG.find(s => s.id === catalogId)
  if (!catalogEntry) return { success: false, message: 'Service not found' }
  
  const tierMultiplier = tier === 'elite' ? 1.8 : tier === 'premium' ? 1.3 : 1.0
  const monthlyFee = Math.round(catalogEntry.monthlyFee * tierMultiplier)
  
  const service: LuxuryService = {
    id: `svc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    serviceId: catalogId,
    type: catalogEntry.type,
    name: catalogEntry.name,
    tier,
    startDate: { week: currentWeek, year: currentYear },
    monthlyFee,
    stressReduction: Math.round(catalogEntry.stressReduction * tierMultiplier),
    prestigeBonus: Math.round(catalogEntry.prestigeBonus * tierMultiplier),
    timeFreedPerWeek: Math.round(catalogEntry.timeFreedPerWeek * tierMultiplier),
    healthBonus: Math.round((catalogEntry.healthBonus || 0) * tierMultiplier),
    isActive: true,
    monthsSubscribed: 0
  }
  
  return { success: true, message: `Subscribed to ${service.name} (${tier})`, cost: monthlyFee, item: service as any }
}

export function cancelService(serviceId: string, services: LuxuryService[]): SaleResult {
  const service = services.find(s => s.id === serviceId)
  if (!service) return { success: false, message: 'Service not found' }
  return { success: true, message: `Cancelled ${service.name}`, proceeds: 0 }
}

export function getServiceCatalog(): LuxuryServiceCatalogEntry[] {
  return LUXURY_SERVICES_CATALOG
}

// ============================================
// EXPERIENCES MANAGEMENT
// ============================================

export function bookExperience(
  catalogId: string,
  currentWeek: number,
  currentYear: number
): PurchaseResult {
  const catalogEntry = EXPERIENCES_CATALOG.find(e => e.id === catalogId)
  if (!catalogEntry) return { success: false, message: 'Experience not found' }
  
  const experience: LuxuryExperience = {
    id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    experienceId: catalogId,
    type: catalogEntry.type,
    name: catalogEntry.name,
    purchaseDate: { week: currentWeek, year: currentYear },
    cost: catalogEntry.cost,
    duration: catalogEntry.duration,
    durationWeeks: catalogEntry.durationWeeks,
    stressReduction: catalogEntry.stressReduction,
    networkingBonus: catalogEntry.networkingBonus,
    prestigeBonus: catalogEntry.prestigeBonus,
    happinessBoost: catalogEntry.happinessBoost,
    completedWeek: undefined,
    cooldownUntilWeek: undefined
  }
  
  return { success: true, message: `Booked ${experience.name}!`, cost: catalogEntry.cost, item: experience as any }
}

export function getExperienceCatalog(): ExperienceCatalogEntry[] {
  return EXPERIENCES_CATALOG
}

// ============================================
// COLLECTIBLES MANAGEMENT
// ============================================

export function purchaseCollectible(
  catalogId: string,
  currentWeek: number,
  currentYear: number
): PurchaseResult {
  const catalogEntry = COLLECTIBLES_CATALOG.find(c => c.id === catalogId)
  if (!catalogEntry) return { success: false, message: 'Collectible not found' }
  
  const price = calculateCollectiblePurchasePrice(catalogEntry)
  
  const collectible: Collectible = {
    id: `col_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    catalogId,
    category: catalogEntry.category,
    rarity: catalogEntry.rarity,
    name: catalogEntry.name,
    description: catalogEntry.description,
    purchasePrice: price,
    currentValue: price,
    purchaseDate: { week: currentWeek, year: currentYear },
    appreciationRate: catalogEntry.appreciationRate,
    lastAppraisalValue: price,
    lastAppraisalDate: { week: currentWeek, year: currentYear },
    monthlyInsuranceCost: Math.round(price * 0.001),
    monthlyStorageCost: catalogEntry.category === 'wine' ? 50 : catalogEntry.category === 'art' ? 100 : 25,
    prestigeBonus: catalogEntry.prestigeBonus,
    condition: 'mint',
    isInsured: true,
    isDisplayed: false
  }
  
  return { success: true, message: `Acquired ${collectible.name} for $${price.toLocaleString()}`, cost: price, item: collectible as any }
}

export function sellCollectible(collectible: Collectible): SaleResult {
  // Selling at current market value minus 10% commission
  const proceeds = Math.round(collectible.currentValue * 0.9)
  return { success: true, message: `Sold ${collectible.name} for $${proceeds.toLocaleString()}`, proceeds }
}

export function getCollectibleCatalog(): CollectibleCatalogEntry[] {
  return COLLECTIBLES_CATALOG
}

// ============================================
// PET MANAGEMENT
// ============================================

export function adoptPet(
  catalogId: string,
  petName: string,
  currentWeek: number,
  currentYear: number
): PurchaseResult {
  const catalogEntry = PET_CATALOG.find(p => p.id === catalogId)
  if (!catalogEntry) return { success: false, message: 'Pet not found' }
  
  const pet: Pet = {
    id: `pet_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    catalogId,
    type: catalogEntry.type,
    name: petName,
    breed: catalogEntry.breed,
    purchasePrice: catalogEntry.basePrice,
    monthlyUpkeep: catalogEntry.monthlyUpkeep,
    stressReduction: catalogEntry.stressReduction,
    happinessBoost: catalogEntry.happinessBoost,
    prestigeBonus: catalogEntry.prestigeBonus,
    health: 100,
    happiness: 90,
    ageYears: 0,
    purchaseDate: { week: currentWeek, year: currentYear }
  }
  
  return { success: true, message: `Welcome home, ${petName}!`, cost: catalogEntry.basePrice, item: pet as any }
}

export function rehomePet(pet: Pet): SaleResult {
  return { success: true, message: `${pet.name} has been rehomed.`, proceeds: 0 }
}

export function getPetCatalog(): PetCatalogEntry[] {
  return PET_CATALOG
}

// ============================================
// WARDROBE MANAGEMENT
// ============================================

export function purchaseWardrobeItem(
  catalogId: string,
  currentWeek: number,
  currentYear: number
): PurchaseResult {
  const catalogEntry = WARDROBE_CATALOG.find(w => w.id === catalogId)
  if (!catalogEntry) return { success: false, message: 'Item not found' }
  
  const item: WardrobeItem = {
    id: `ward_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    catalogId,
    category: catalogEntry.category,
    name: catalogEntry.name,
    brand: catalogEntry.brand,
    purchasePrice: catalogEntry.basePrice,
    currentValue: catalogEntry.basePrice,
    prestigeBonus: catalogEntry.prestigeBonus,
    confidenceBoost: catalogEntry.confidenceBoost,
    networkingBonus: catalogEntry.networkingBonus,
    purchaseDate: { week: currentWeek, year: currentYear },
    condition: 100,
    wearCount: 0
  }
  
  return { success: true, message: `Purchased ${item.name} by ${item.brand}`, cost: catalogEntry.basePrice, item: item as any }
}

export function sellWardrobeItem(item: WardrobeItem): SaleResult {
  const proceeds = Math.round(item.currentValue * 0.3) // Used clothes resale
  return { success: true, message: `Sold ${item.name} for $${proceeds.toLocaleString()}`, proceeds }
}

export function getWardrobeCatalog(): WardrobeCatalogEntry[] {
  return WARDROBE_CATALOG
}

// ============================================
// DIET & NUTRITION MANAGEMENT
// ============================================

export function subscribeDiet(
  catalogId: string,
  currentWeek: number,
  currentYear: number
): PurchaseResult {
  const catalogEntry = DIET_CATALOG.find(d => d.id === catalogId)
  if (!catalogEntry) return { success: false, message: 'Diet plan not found' }
  
  const plan: DietPlan = {
    id: `diet_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    catalogId,
    type: catalogEntry.type,
    name: catalogEntry.name,
    monthlyFee: catalogEntry.monthlyFee,
    healthBonus: catalogEntry.healthBonus,
    fitnessBonus: catalogEntry.fitnessBonus,
    energyBonus: catalogEntry.energyBonus,
    stressReduction: catalogEntry.stressReduction,
    startDate: { week: currentWeek, year: currentYear },
    isActive: true
  }
  
  return { success: true, message: `Started ${plan.name} diet plan`, cost: catalogEntry.monthlyFee, item: plan as any }
}

export function cancelDiet(): SaleResult {
  return { success: true, message: 'Diet plan cancelled', proceeds: 0 }
}

export function getDietCatalog(): DietCatalogEntry[] {
  return DIET_CATALOG
}

// ============================================
// VEHICLE PURCHASE / SELL
// ============================================

interface PurchaseResult {
  success: boolean
  message: string
  cost?: number
  item?: any
}

interface SaleResult {
  success: boolean
  message: string
  proceeds?: number
}

export function purchaseVehicle(
  catalogIndex: number,
  finances: { liquidCash: number },
  currentWeek: number,
  currentYear: number
): PurchaseResult {
  const catalog = VEHICLE_CATALOG
  if (catalogIndex < 0 || catalogIndex >= catalog.length) {
    return { success: false, message: 'Vehicle not found in catalog' }
  }
  const entry = catalog[catalogIndex]
  if (finances.liquidCash < entry.basePrice) {
    return { success: false, message: `Cannot afford ${entry.brand} ${entry.model} ($${entry.basePrice.toLocaleString()})` }
  }

  const vehicle: OwnedVehicle = {
    id: `vehicle_${Date.now()}`,
    brand: entry.brand,
    model: entry.model,
    type: entry.type as any,
    purchasePrice: entry.basePrice,
    currentValue: entry.basePrice,
    purchaseWeek: currentWeek,
    purchaseYear: currentYear,
    condition: 100,
    mileage: 0,
    isPrimary: false,
    maintenanceCostPerWeek: Math.round(entry.basePrice * 0.001),
    insuranceCostPerWeek: Math.round(entry.basePrice * 0.0005)
  }

  return { success: true, message: `Purchased ${entry.brand} ${entry.model}`, cost: entry.basePrice, item: vehicle }
}

export function sellVehicle(vehicle: OwnedVehicle): SaleResult {
  const depreciation = 0.85 // 15% loss on resale
  const proceeds = Math.round(vehicle.currentValue * depreciation)
  return { success: true, message: `Sold ${vehicle.brand} ${vehicle.model} for $${proceeds.toLocaleString()}`, proceeds }
}

// ============================================
// FURNISHING PURCHASE / SELL
// ============================================

export function purchaseFurnishing(
  furnishingId: string,
  propertyId: string,
  finances: { liquidCash: number },
  currentWeek: number,
  currentYear: number
): PurchaseResult {
  const catalogEntry = getFurnishingById(furnishingId)
  if (!catalogEntry) return { success: false, message: 'Furnishing not found in catalog' }
  if (finances.liquidCash < catalogEntry.basePrice) {
    return { success: false, message: `Cannot afford ${catalogEntry.name} ($${catalogEntry.basePrice.toLocaleString()})` }
  }

  const furnishing: HomeFurnishing = {
    id: `furnishing_${Date.now()}`,
    catalogId: furnishingId,
    propertyId,
    name: catalogEntry.name,
    category: catalogEntry.category,
    tier: catalogEntry.tier as FurnishingTier,
    purchasePrice: catalogEntry.basePrice,
    currentValue: catalogEntry.basePrice,
    condition: 100,
    purchaseWeek: currentWeek,
    purchaseYear: currentYear
  }

  return { success: true, message: `Purchased ${catalogEntry.name}`, cost: catalogEntry.basePrice, item: furnishing }
}

export function sellFurnishing(furnishing: HomeFurnishing): SaleResult {
  const proceeds = Math.round((furnishing.currentValue || furnishing.purchasePrice) * 0.5)
  return { success: true, message: `Sold ${furnishing.name} for $${proceeds.toLocaleString()}`, proceeds }
}

export function upgradeFurnishing(
  propertyId: string,
  category: FurnishingCategory,
  newTier: FurnishingTier,
  furnishings: HomeFurnishing[],
  finances: PersonalFinancialState,
  currentWeek: number,
  currentYear: number
): PurchaseResult & { updatedFurnishings?: HomeFurnishing[] } {
  const existingIndex = furnishings.findIndex(
    f => f.propertyId === propertyId && f.category === category
  )
  const newItem = FURNISHING_CATALOG.find(
    f => f.category === category && f.tier === newTier
  )
  if (!newItem) {
    return { success: false, message: `No ${newTier} tier available for ${category}` }
  }
  let tradeinValue = 0
  if (existingIndex >= 0) {
    const existing = furnishings[existingIndex]
    tradeinValue = Math.round(existing.currentValue * 0.4)
  }
  const netCost = newItem.basePrice - tradeinValue
  if (finances.liquidCash < netCost) {
    return {
      success: false,
      message: `Insufficient funds. Need $${netCost.toLocaleString()} (after $${tradeinValue.toLocaleString()} trade-in)`
    }
  }
  const newFurnishing: HomeFurnishing = {
    id: `furn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    propertyId,
    category: newItem.category,
    tier: newItem.tier,
    name: newItem.name,
    description: newItem.description,
    purchasePrice: newItem.basePrice,
    currentValue: newItem.basePrice,
    purchaseDate: { week: currentWeek, year: currentYear },
    monthlyDepreciation: newItem.monthlyDepreciation,
    comfortBonus: newItem.comfortBonus,
    prestigeBonus: newItem.prestigeBonus,
    condition: 100,
    needsReplacement: false
  }
  const updatedFurnishings = [...furnishings]
  if (existingIndex >= 0) {
    updatedFurnishings[existingIndex] = newFurnishing
  } else {
    updatedFurnishings.push(newFurnishing)
  }
  return {
    success: true,
    message: `Upgraded to ${newItem.name} for $${netCost.toLocaleString()} (after trade-in)`,
    cost: netCost,
    updatedFurnishings
  }
}

// ============================================
// PRIMARY VEHICLE
// ============================================

export function setPrimaryVehicle(
  vehicles: OwnedVehicle[],
  vehicleId: string
): OwnedVehicle[] {
  return vehicles.map(v => ({
    ...v,
    isPrimary: v.id === vehicleId
  }))
}
