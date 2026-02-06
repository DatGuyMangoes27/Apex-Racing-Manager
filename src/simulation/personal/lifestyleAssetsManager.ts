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
  _MembershipType,
  FURNISHING_CATALOG,
  MEMBERSHIP_CATALOG,
  LUXURY_SERVICES_CATALOG,
  EXPERIENCES_CATALOG,
  COLLECTIBLES_CATALOG,
  PET_CATALOG,
  WARDROBE_CATALOG,
  DIET_CATALOG,
  LIFESTYLE_SCORE_WEIGHTS,
  _LIFESTYLE_LEVEL_THRESHOLDS,
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
import type { VEHICLE_CATALOG, type PersonalStaff, type Hobby } from '@/data/lifestyle-config';
  // Find existing furnishing in this category for this property
  const existingIndex = furnishings.findIndex(
    f => f.propertyId === propertyId && f.category === category
  )
  
  // Find new tier item in catalog
  const newItem = FURNISHING_CATALOG.find(
    f => f.category === category && f.tier === newTier
  )
  
  if (!newItem) {
    return { success: false, message: `No ${newTier} tier available for ${category}` }
  }
  
  // Calculate cost (full price minus trade-in value of existing)
  let tradeinValue = 0
  if (existingIndex >= 0) {
    const existing = furnishings[existingIndex]
    tradeinValue = Math.round(existing.currentValue * 0.4) // 40% trade-in value
  }
  
  const netCost = newItem.basePrice - tradeinValue
  
  if (finances.liquidCash < netCost) {
    return {
      success: false,
      message: `Insufficient funds. Need $${netCost.toLocaleString()} (after $${tradeinValue.toLocaleString()} trade-in)`
    }
  }
  
  // Create new furnishing
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
  
  // Update furnishings array
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
    sum + (h.prestigeLevel * weights.hobbies.prestigeBonus), 0
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
    
    updatedAssets = {
      ...updatedAssets,
      vehicles: updatedVehicles,
      furnishings: updatedFurnishings
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
  const vehicleValue = assets.vehicles.reduce((sum, v) => sum + v.currentValue, 0)
  const furnishingValue = assets.furnishings.reduce((sum, f) => sum + f.currentValue, 0)
  // Memberships don't have resale value
  
  return vehicleValue + furnishingValue
}

export function getAssetSummary(assets: LifestyleAssets): {
  vehicleCount: number
  vehicleValue: number
  furnishingCount: number
  furnishingValue: number
  membershipCount: number
  monthlyAssetCosts: number
  annualMembershipFees: number
} {
  const vehicleValue = assets.vehicles.reduce((sum, v) => sum + v.currentValue, 0)
  const furnishingValue = assets.furnishings.reduce((sum, f) => sum + f.currentValue, 0)
  const monthlyVehicleCosts = assets.vehicles.reduce((sum, v) => 
    sum + v.monthlyMaintenanceCost + v.monthlyInsuranceCost, 0
  )
  const annualMembershipFees = assets.memberships.reduce((sum, m) => sum + m.annualFee, 0)
  const monthlyMembershipFees = assets.memberships.reduce((sum, m) => sum + m.monthlyFee, 0)
  
  return {
    vehicleCount: assets.vehicles.length,
    vehicleValue,
    furnishingCount: assets.furnishings.length,
    furnishingValue,
    membershipCount: assets.memberships.length,
    monthlyAssetCosts: monthlyVehicleCosts + monthlyMembershipFees,
    annualMembershipFees
  }
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
