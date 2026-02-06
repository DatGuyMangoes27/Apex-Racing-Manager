/**
 * Car Marketplace Simulation
 * Handles listing generation, dynamic pricing, auctions, and car condition logic
 */

import { AMS2_CAR_CLASSES, CarClass } from '@/data/ams2-cars'
import { getClassLiveriesFromManifest } from '@/utils/images'
import { CHAMPIONSHIPS } from '@/data/championships'
import {
  MarketplaceListing,
  MarketplaceListingType,
  CarCondition,
  CarPartWear,
  CarServiceRecord,
  CarProvenance,
  CarUpgrade
} from '@/store/careerStore'

/**
 * Find all championship IDs that use a specific car class
 */
function getChampionshipsForCarClass(carClassId: string): string[] {
  return CHAMPIONSHIPS
    .filter(c => c.carClassIds.includes(carClassId))
    .map(c => c.id)
}

// ============================================
// CONSTANTS
// ============================================

// Base prices by tier (in dollars) - REALISTIC PRICING
const BASE_PRICE_BY_TIER: Record<string, number> = {
  'entry': 25000,        // Karts, basic formula
  'amateur': 80000,      // Entry GT, junior formula
  'semi-pro': 200000,    // GT4, regional touring
  'professional': 450000, // GT3, national stock
  'pro': 800000,         // GTE, top touring
  'elite': 2000000,      // LMP2, top single-seaters
  'pinnacle': 8000000,   // Hypercar, F1-style
  'historic': 1500000    // Collector value
}

// Price multipliers by category - REALISTIC PRICING
const CATEGORY_MULTIPLIER: Record<string, number> = {
  'kart': 0.2,           // Karts are cheap
  'formula': 1.5,        // Single-seaters are expensive
  'gt': 1.0,             // GT is baseline
  'prototype': 2.0,      // Prototypes are very expensive
  'touring': 0.6,        // Touring cars cheaper
  'stock': 0.5,          // Stock cars more affordable
  'rallycross': 0.4,     // RX relatively cheap
  'road': 0.3,           // Road cars cheapest
  'vintage': 2.5         // Historic cars command premium
}

// Condition thresholds (based on average part wear)
const CONDITION_THRESHOLDS: { max: number; condition: CarCondition }[] = [
  { max: 15, condition: 'excellent' },
  { max: 35, condition: 'good' },
  { max: 60, condition: 'fair' },
  { max: 100, condition: 'project' }
]

// Service bonus multiplier (well-maintained cars are worth more)
const SERVICE_HISTORY_BONUS = 0.05 // 5% per full service, max 25%
const MAX_SERVICE_BONUS = 0.25

// Provenance bonuses
const NOTABLE_RESULT_BONUS = 0.02 // 2% per notable result
const MAX_PROVENANCE_BONUS = 0.15 // Max 15%
const ACCIDENT_PENALTY = 0.05 // 5% per significant accident

// Upgrade value retention (upgrades retain % of their cost)
const UPGRADE_VALUE_RETENTION = 0.6

// Market demand variance (random factor for pricing)
const MARKET_DEMAND_VARIANCE = 0.15 // ±15%

// Auction starting bid discount
const AUCTION_START_DISCOUNT = 0.3 // Start at 70% of calculated value

// Listing duration (in weeks)
const NEW_CAR_LISTING_DURATION = 12 // Always available
const USED_CAR_LISTING_DURATION = 4
const AUCTION_DURATION = 2

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Get random float between min and max
 */
function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

/**
 * Calculate average part wear
 */
function calculateAverageWear(wear: CarPartWear): number {
  const values = Object.values(wear)
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/**
 * Determine car condition from part wear
 */
function determineCondition(wear: CarPartWear): CarCondition {
  const avgWear = calculateAverageWear(wear)
  for (const threshold of CONDITION_THRESHOLDS) {
    if (avgWear <= threshold.max) {
      return threshold.condition
    }
  }
  return 'project'
}

/**
 * Calculate reliability from part wear (inverse relationship)
 */
function calculateReliability(wear: CarPartWear): number {
  const avgWear = calculateAverageWear(wear)
  // 100% reliability at 0 wear, ~50% at 100 wear
  return Math.max(40, Math.round(100 - avgWear * 0.6))
}

/**
 * Calculate performance penalty from wear
 */
function calculatePerformancePenalty(wear: CarPartWear): number {
  // Engine wear affects performance most
  const enginePenalty = wear.engine * 0.3
  const chassisPenalty = wear.chassis * 0.15
  const suspensionPenalty = wear.suspension * 0.1
  return Math.round(enginePenalty + chassisPenalty + suspensionPenalty) / 10
}

// ============================================
// PART WEAR GENERATION
// ============================================

/**
 * Generate new car part wear (minimal/zero)
 */
function generateNewCarWear(): CarPartWear {
  return {
    engine: randomInt(0, 3),
    chassis: randomInt(0, 2),
    gearbox: randomInt(0, 2),
    brakes: randomInt(0, 5),
    suspension: randomInt(0, 3)
  }
}

/**
 * Generate used car part wear based on condition target
 */
function generateUsedCarWear(targetCondition: CarCondition): CarPartWear {
  const ranges: Record<CarCondition, [number, number]> = {
    'excellent': [5, 15],
    'good': [15, 35],
    'fair': [35, 60],
    'project': [60, 90]
  }
  
  const [min, max] = ranges[targetCondition]
  
  // Generate with some variance per component
  const baseWear = randomInt(min, max)
  const variance = (max - min) / 4
  
  return {
    engine: Math.max(0, Math.min(100, baseWear + randomInt(-variance, variance))),
    chassis: Math.max(0, Math.min(100, baseWear + randomInt(-variance, variance) - 5)),
    gearbox: Math.max(0, Math.min(100, baseWear + randomInt(-variance, variance))),
    brakes: Math.max(0, Math.min(100, baseWear + randomInt(-variance, variance) + 10)), // Brakes wear faster
    suspension: Math.max(0, Math.min(100, baseWear + randomInt(-variance, variance)))
  }
}

// ============================================
// SERVICE HISTORY GENERATION
// ============================================

/**
 * Generate service history for a used car
 */
function generateServiceHistory(
  mileage: number,
  currentWeek: number,
  currentYear: number
): CarServiceRecord[] {
  const services: CarServiceRecord[] = []
  
  // Roughly one service per 5000 mileage units
  const expectedServices = Math.floor(mileage / 5000)
  const actualServices = randomInt(
    Math.max(0, expectedServices - 2),
    expectedServices + 1
  )
  
  for (let i = 0; i < actualServices; i++) {
    // Distribute services over time
    const weeksAgo = randomInt(4, 52 * 3) // Up to 3 years back
    let serviceWeek = currentWeek - weeksAgo
    let serviceYear = currentYear
    
    while (serviceWeek <= 0) {
      serviceWeek += 52
      serviceYear--
    }
    
    const isFullService = Math.random() < 0.4
    const isRepair = !isFullService && Math.random() < 0.3
    
    const serviceRecord: CarServiceRecord = {
      week: serviceWeek,
      year: serviceYear,
      type: isFullService ? 'full' : isRepair ? 'repair' : 'partial',
      cost: isFullService ? randomInt(5000, 15000) : isRepair ? randomInt(2000, 8000) : randomInt(1000, 4000)
    }
    
    if (isFullService) {
      serviceRecord.partsReplaced = ['engine', 'brakes', 'suspension'] as (keyof CarPartWear)[]
      serviceRecord.description = 'Full service - all major components inspected and serviced'
    } else if (isRepair) {
      const parts: (keyof CarPartWear)[] = ['engine', 'chassis', 'gearbox', 'brakes', 'suspension']
      serviceRecord.partsReplaced = [parts[randomInt(0, parts.length - 1)]]
      serviceRecord.description = `Repair - ${serviceRecord.partsReplaced[0]} replaced`
    } else {
      serviceRecord.description = 'Partial service - routine maintenance'
    }
    
    services.push(serviceRecord)
  }
  
  // Sort by date (most recent first)
  return services.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.week - a.week
  })
}

// ============================================
// PROVENANCE GENERATION
// ============================================

/**
 * Generate car provenance (racing history)
 */
function generateProvenance(carClass: CarClass): CarProvenance {
  const previousOwners = randomInt(1, 4)
  const hasRaceHistory = Math.random() < 0.7
  
  const provenance: CarProvenance = {
    previousOwners,
    originalPurchaseYear: new Date().getFullYear() - randomInt(1, 5),
    accidentHistory: Math.random() < 0.3 ? randomInt(1, 3) : 0
  }
  
  if (hasRaceHistory) {
    const races = randomInt(10, 100)
    const winRate = randomFloat(0, 0.15)
    const podiumRate = randomFloat(winRate, winRate + 0.2)
    const dnfRate = randomFloat(0.05, 0.15)
    
    provenance.raceHistory = {
      races,
      wins: Math.floor(races * winRate),
      podiums: Math.floor(races * podiumRate),
      dnfs: Math.floor(races * dnfRate)
    }
    
    // Maybe add notable results
    if (Math.random() < 0.3 && carClass.tier !== 'entry') {
      const notableResults: string[] = []
      const tier = carClass.tier
      
      const events = [
        { name: 'Spa 24 Hours', tiers: ['pro', 'elite', 'pinnacle'] },
        { name: 'Bathurst 12 Hour', tiers: ['pro', 'elite'] },
        { name: 'Nürburgring 24', tiers: ['pro', 'elite', 'pinnacle'] },
        { name: 'Daytona 24', tiers: ['pro', 'elite', 'pinnacle'] },
        { name: 'Le Mans 24h', tiers: ['elite', 'pinnacle'] },
        { name: 'GT World Challenge', tiers: ['semi-pro', 'pro', 'professional'] },
        { name: 'Regional Championship', tiers: ['amateur', 'semi-pro'] },
        { name: 'Club Championship', tiers: ['entry', 'amateur'] }
      ]
      
      const eligibleEvents = events.filter(e => e.tiers.includes(tier))
      if (eligibleEvents.length > 0) {
        const event = eligibleEvents[randomInt(0, eligibleEvents.length - 1)]
        const position = randomInt(1, 10)
        const year = new Date().getFullYear() - randomInt(1, 3)
        notableResults.push(`${event.name} - ${position}${getOrdinalSuffix(position)} Place ${year}`)
      }
      
      provenance.notableResults = notableResults
    }
  }
  
  return provenance
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

// ============================================
// UPGRADE GENERATION
// ============================================

/**
 * Generate installed upgrades for a used car
 */
function generateUpgrades(
  carClass: CarClass,
  currentWeek: number,
  currentYear: number
): CarUpgrade[] {
  const upgrades: CarUpgrade[] = []
  
  // Higher tier cars more likely to have upgrades
  const upgradeChance = {
    'entry': 0.1,
    'amateur': 0.2,
    'semi-pro': 0.3,
    'professional': 0.4,
    'pro': 0.5,
    'elite': 0.6,
    'pinnacle': 0.7,
    'historic': 0.3
  }[carClass.tier] || 0.3
  
  if (Math.random() > upgradeChance) return upgrades
  
  const numUpgrades = randomInt(1, 3)
  const upgradeTypes: Array<{ type: 'performance' | 'reliability' | 'handling'; name: string; effectRange: [number, number]; costRange: [number, number] }> = [
    { type: 'performance', name: 'Engine Tune', effectRange: [3, 8], costRange: [5000, 20000] },
    { type: 'performance', name: 'ECU Remap', effectRange: [2, 5], costRange: [2000, 8000] },
    { type: 'reliability', name: 'Reinforced Gearbox', effectRange: [5, 10], costRange: [8000, 25000] },
    { type: 'reliability', name: 'Cooling Upgrade', effectRange: [3, 7], costRange: [3000, 10000] },
    { type: 'handling', name: 'Suspension Kit', effectRange: [3, 6], costRange: [5000, 15000] },
    { type: 'handling', name: 'Aero Package', effectRange: [4, 8], costRange: [10000, 30000] }
  ]
  
  const selectedTypes = new Set<string>()
  
  for (let i = 0; i < numUpgrades; i++) {
    const available = upgradeTypes.filter(u => !selectedTypes.has(u.name))
    if (available.length === 0) break
    
    const upgrade = available[randomInt(0, available.length - 1)]
    selectedTypes.add(upgrade.name)
    
    const weeksAgo = randomInt(4, 52)
    let installWeek = currentWeek - weeksAgo
    let installYear = currentYear
    while (installWeek <= 0) {
      installWeek += 52
      installYear--
    }
    
    upgrades.push({
      id: `upgrade_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: upgrade.name,
      type: upgrade.type,
      effect: randomInt(upgrade.effectRange[0], upgrade.effectRange[1]),
      cost: randomInt(upgrade.costRange[0], upgrade.costRange[1]),
      installedWeek: installWeek,
      installedYear: installYear
    })
  }
  
  return upgrades
}

// ============================================
// PRICING CALCULATIONS
// ============================================

/**
 * Calculate base price for a car class
 */
export function calculateBasePrice(carClass: CarClass): number {
  const tierPrice = BASE_PRICE_BY_TIER[carClass.tier] || 100000
  const categoryMultiplier = CATEGORY_MULTIPLIER[carClass.category] || 1.0
  return Math.round(tierPrice * categoryMultiplier)
}

/**
 * Calculate full price with all adjustments
 */
function calculateDynamicPrice(
  basePrice: number,
  listingType: MarketplaceListingType,
  partWear: CarPartWear,
  mileage: number,
  serviceHistory: CarServiceRecord[],
  provenance: CarProvenance | undefined,
  upgrades: CarUpgrade[]
): { price: number; breakdown: NonNullable<MarketplaceListing['priceBreakdown']> } {
  
  // Start with base
  let price = basePrice
  const breakdown: NonNullable<MarketplaceListing['priceBreakdown']> = {
    base: basePrice,
    wearDiscount: 0,
    mileageDiscount: 0,
    serviceBonus: 0,
    provenanceBonus: 0,
    upgradeValue: 0,
    marketDemand: 0
  }
  
  if (listingType === 'new') {
    // New cars only get market demand adjustment
    const demandFactor = randomFloat(1 - MARKET_DEMAND_VARIANCE / 2, 1 + MARKET_DEMAND_VARIANCE / 2)
    breakdown.marketDemand = Math.round(basePrice * (demandFactor - 1))
    price = Math.round(basePrice * demandFactor)
    return { price, breakdown }
  }
  
  // Used/Auction cars get full adjustments
  
  // 1. Wear discount (up to -40% for project cars)
  const avgWear = calculateAverageWear(partWear)
  const wearDiscount = avgWear * 0.004 // 0.4% per wear point
  breakdown.wearDiscount = -Math.round(basePrice * wearDiscount)
  price -= Math.round(basePrice * wearDiscount)
  
  // 2. Mileage discount (up to -20% for high mileage)
  const mileageDiscount = Math.min(0.20, mileage / 100000 * 0.2)
  breakdown.mileageDiscount = -Math.round(basePrice * mileageDiscount)
  price -= Math.round(basePrice * mileageDiscount)
  
  // 3. Service history bonus (well-maintained cars)
  const fullServices = serviceHistory.filter(s => s.type === 'full').length
  const serviceBonus = Math.min(MAX_SERVICE_BONUS, fullServices * SERVICE_HISTORY_BONUS)
  breakdown.serviceBonus = Math.round(basePrice * serviceBonus)
  price += Math.round(basePrice * serviceBonus)
  
  // 4. Provenance bonus/penalty
  if (provenance) {
    let provenanceValue = 0
    
    // Notable results add value
    if (provenance.notableResults && provenance.notableResults.length > 0) {
      provenanceValue += Math.min(MAX_PROVENANCE_BONUS, provenance.notableResults.length * NOTABLE_RESULT_BONUS)
    }
    
    // Accidents reduce value
    if (provenance.accidentHistory && provenance.accidentHistory > 0) {
      provenanceValue -= provenance.accidentHistory * ACCIDENT_PENALTY
    }
    
    breakdown.provenanceBonus = Math.round(basePrice * provenanceValue)
    price += Math.round(basePrice * provenanceValue)
  }
  
  // 5. Upgrade value (retained value of installed upgrades)
  const upgradeValue = upgrades.reduce((sum, u) => sum + u.cost, 0) * UPGRADE_VALUE_RETENTION
  breakdown.upgradeValue = Math.round(upgradeValue)
  price += Math.round(upgradeValue)
  
  // 6. Market demand variance
  const demandFactor = randomFloat(1 - MARKET_DEMAND_VARIANCE, 1 + MARKET_DEMAND_VARIANCE)
  const demandAdjustment = price * (demandFactor - 1)
  breakdown.marketDemand = Math.round(demandAdjustment)
  price = Math.round(price * demandFactor)
  
  return { price: Math.max(1000, price), breakdown }
}

// ============================================
// LISTING GENERATION
// ============================================

/**
 * Generate a new car listing
 */
export function generateNewCarListing(
  carClass: CarClass,
  currentWeek: number,
  currentYear: number,
  seriesCompatible: string[]
): MarketplaceListing | null {
  // Get available liveries
  const liveries = getClassLiveriesFromManifest(carClass.id)
  console.log(`[Marketplace] Class ${carClass.id} (${carClass.name}) has ${liveries.length} liveries`)
  if (liveries.length > 0) {
    console.log(`[Marketplace] Sample livery paths:`, liveries.slice(0, 3))
  }
  if (liveries.length === 0) return null
  
  const liveryPath = liveries[randomInt(0, liveries.length - 1)]
  // Decode the URL-encoded filename to get the display name
  const encodedName = liveryPath.split('/').pop()?.replace('.png', '') || 'Default'
  const liveryName = decodeURIComponent(encodedName)
  console.log(`[Marketplace] Selected livery for ${carClass.name}:`, liveryPath)
  
  // Get manufacturer from first car in class
  const car = carClass.cars[0]
  
  const partWear = generateNewCarWear()
  const basePrice = calculateBasePrice(carClass)
  const { price, breakdown } = calculateDynamicPrice(
    basePrice, 'new', partWear, 0, [], undefined, []
  )
  
  const listing: MarketplaceListing = {
    id: generateId(),
    carClassId: carClass.id,
    carClassName: carClass.name,
    manufacturerId: car?.id || carClass.id,
    manufacturerName: car?.manufacturer || 'Unknown',
    liveryName,
    liveryPath,
    
    listingType: 'new',
    condition: 'excellent',
    
    partWear,
    mileage: 0,
    reliability: calculateReliability(partWear),
    performance: 100, // Base performance for new car
    
    serviceHistory: [],
    installedUpgrades: [],
    
    basePrice,
    currentPrice: price,
    priceBreakdown: breakdown,
    
    listedWeek: currentWeek,
    listedYear: currentYear,
    availableUntilWeek: currentWeek + NEW_CAR_LISTING_DURATION,
    availableUntilYear: currentYear,
    seriesCompatible
  }
  
  return listing
}

/**
 * Generate a used car listing
 */
export function generateUsedCarListing(
  carClass: CarClass,
  currentWeek: number,
  currentYear: number,
  seriesCompatible: string[],
  targetCondition?: CarCondition
): MarketplaceListing | null {
  const liveries = getClassLiveriesFromManifest(carClass.id)
  if (liveries.length === 0) return null
  
  const liveryPath = liveries[randomInt(0, liveries.length - 1)]
  // Decode the URL-encoded filename to get the display name
  const encodedName = liveryPath.split('/').pop()?.replace('.png', '') || 'Default'
  const liveryName = decodeURIComponent(encodedName)
  
  const car = carClass.cars[0]
  
  // Determine condition
  const condition = targetCondition || (['excellent', 'good', 'fair', 'project'] as CarCondition[])[
    randomInt(0, 3)
  ]
  
  const partWear = generateUsedCarWear(condition)
  const mileage = condition === 'excellent' ? randomInt(1000, 8000) :
                  condition === 'good' ? randomInt(5000, 20000) :
                  condition === 'fair' ? randomInt(15000, 40000) :
                  randomInt(30000, 80000)
  
  const serviceHistory = generateServiceHistory(mileage, currentWeek, currentYear)
  const provenance = generateProvenance(carClass)
  const upgrades = generateUpgrades(carClass, currentWeek, currentYear)
  
  const basePrice = calculateBasePrice(carClass)
  const { price, breakdown } = calculateDynamicPrice(
    basePrice, 'used', partWear, mileage, serviceHistory, provenance, upgrades
  )
  
  // Calculate performance with upgrades and wear
  const perfUpgrades = upgrades.filter(u => u.type === 'performance')
  const perfBonus = perfUpgrades.reduce((sum, u) => sum + u.effect, 0)
  const wearPenalty = calculatePerformancePenalty(partWear)
  const performance = Math.max(60, Math.min(100, 85 + perfBonus - wearPenalty))
  
  // Calculate listing end date
  let availableUntilWeek = currentWeek + USED_CAR_LISTING_DURATION
  let availableUntilYear = currentYear
  if (availableUntilWeek > 52) {
    availableUntilWeek -= 52
    availableUntilYear++
  }
  
  const listing: MarketplaceListing = {
    id: generateId(),
    carClassId: carClass.id,
    carClassName: carClass.name,
    manufacturerId: car?.id || carClass.id,
    manufacturerName: car?.manufacturer || 'Unknown',
    liveryName,
    liveryPath,
    
    listingType: 'used',
    condition,
    
    partWear,
    mileage,
    reliability: calculateReliability(partWear),
    performance,
    
    provenance,
    serviceHistory,
    installedUpgrades: upgrades,
    
    basePrice,
    currentPrice: price,
    priceBreakdown: breakdown,
    
    listedWeek: currentWeek,
    listedYear: currentYear,
    availableUntilWeek,
    availableUntilYear,
    seriesCompatible
  }
  
  return listing
}

/**
 * Generate an auction listing
 */
export function generateAuctionListing(
  carClass: CarClass,
  currentWeek: number,
  currentYear: number,
  seriesCompatible: string[]
): MarketplaceListing | null {
  // Auctions can be any condition but often have interesting provenance
  const listing = generateUsedCarListing(carClass, currentWeek, currentYear, seriesCompatible)
  if (!listing) return null
  
  // Convert to auction
  listing.listingType = 'auction'
  listing.id = generateId() // Fresh ID
  
  // Auction end date
  let auctionEndWeek = currentWeek + AUCTION_DURATION
  let auctionEndYear = currentYear
  if (auctionEndWeek > 52) {
    auctionEndWeek -= 52
    auctionEndYear++
  }
  
  listing.auctionEndWeek = auctionEndWeek
  listing.auctionEndYear = auctionEndYear
  listing.availableUntilWeek = auctionEndWeek
  listing.availableUntilYear = auctionEndYear
  
  // Starting bid is discounted from calculated value
  const startingBid = Math.round(listing.currentPrice * (1 - AUCTION_START_DISCOUNT))
  listing.minimumBid = startingBid
  listing.currentBid = undefined
  listing.bidCount = 0
  
  return listing
}

// ============================================
// MARKETPLACE GENERATION
// ============================================

/**
 * Get car classes that can be used in a specific series
 */
export function getCarClassesForSeries(_seriesId: string, carClassIds: string[]): CarClass[] {
  return AMS2_CAR_CLASSES.filter(cc => carClassIds.includes(cc.id) && cc.isModern)
}

/**
 * Generate marketplace listings for a player
 * NO TIER GATING - all cars are available, affordability is the natural gate
 */
export function generateMarketplaceListings(
  currentWeek: number,
  currentYear: number,
  _playerTier: string,
  ownedCarClassIds: string[] = []
): MarketplaceListing[] {
  const listings: MarketplaceListing[] = []
  
  // No tier gating - show ALL modern car classes
  // Player budget is the natural limitation
  const availableClasses = AMS2_CAR_CLASSES.filter(cc => cc.isModern)
  
  console.log(`[Marketplace] Generating listings for ${availableClasses.length} car classes (no tier gating)`)
  
  // Generate listings for each class
  for (const carClass of availableClasses) {
    // Skip if player already owns a car of this class
    if (ownedCarClassIds.includes(carClass.id)) continue
    
    // Get actual championship IDs that use this car class
    const seriesCompatible = getChampionshipsForCarClass(carClass.id)
    
    // Skip if no championships use this car class
    if (seriesCompatible.length === 0) {
      console.log(`[Marketplace] Skipping ${carClass.id} - no compatible championships`)
      continue
    }
    
    // Always generate 1-2 new car listings
    const newListing = generateNewCarListing(carClass, currentWeek, currentYear, seriesCompatible)
    if (newListing) listings.push(newListing)
    
    // Sometimes generate a second new listing with different livery
    if (Math.random() < 0.3) {
      const newListing2 = generateNewCarListing(carClass, currentWeek, currentYear, seriesCompatible)
      if (newListing2 && newListing2.liveryPath !== newListing?.liveryPath) {
        listings.push(newListing2)
      }
    }
    
    // Generate 0-3 used car listings
    const usedCount = randomInt(0, 3)
    for (let i = 0; i < usedCount; i++) {
      const usedListing = generateUsedCarListing(carClass, currentWeek, currentYear, seriesCompatible)
      if (usedListing) listings.push(usedListing)
    }
    
    // Generate 0-1 auction listings
    if (Math.random() < 0.25) {
      const auctionListing = generateAuctionListing(carClass, currentWeek, currentYear, seriesCompatible)
      if (auctionListing) listings.push(auctionListing)
    }
  }
  
  return listings
}

// ============================================
// AUCTION PROCESSING
// ============================================

/**
 * Process AI bids on auctions
 */
export function processAuctionBids(
  listings: MarketplaceListing[],
  currentWeek: number,
  currentYear: number
): MarketplaceListing[] {
  return listings.map(listing => {
    if (listing.listingType !== 'auction') return listing
    
    // Check if auction is still active
    const isActive = listing.auctionEndYear! > currentYear ||
      (listing.auctionEndYear === currentYear && listing.auctionEndWeek! > currentWeek)
    
    if (!isActive) return listing
    
    // 30% chance of new bid each week
    if (Math.random() < 0.3) {
      const currentBid = listing.currentBid || listing.minimumBid || 0
      const bidIncrement = Math.round(currentBid * randomFloat(0.05, 0.15))
      const newBid = currentBid + Math.max(1000, bidIncrement)
      
      return {
        ...listing,
        currentBid: newBid,
        bidCount: (listing.bidCount || 0) + 1
      }
    }
    
    return listing
  })
}

/**
 * Remove expired listings
 */
export function removeExpiredListings(
  listings: MarketplaceListing[],
  currentWeek: number,
  currentYear: number
): { active: MarketplaceListing[]; expired: MarketplaceListing[] } {
  const active: MarketplaceListing[] = []
  const expired: MarketplaceListing[] = []
  
  for (const listing of listings) {
    const isExpired = listing.availableUntilYear < currentYear ||
      (listing.availableUntilYear === currentYear && listing.availableUntilWeek <= currentWeek)
    
    if (isExpired && listing.listingType !== 'new') {
      // New cars never expire, just get refreshed
      expired.push(listing)
    } else {
      active.push(listing)
    }
  }
  
  return { active, expired }
}

/**
 * Check if player won an auction
 */
export function checkAuctionWinner(
  listing: MarketplaceListing,
  currentWeek: number,
  currentYear: number
): { won: boolean; finalPrice: number } {
  if (listing.listingType !== 'auction') {
    return { won: false, finalPrice: 0 }
  }
  
  const isEnded = listing.auctionEndYear! < currentYear ||
    (listing.auctionEndYear === currentYear && listing.auctionEndWeek! <= currentWeek)
  
  if (!isEnded) {
    return { won: false, finalPrice: 0 }
  }
  
  // Player wins if their bid is the highest
  if (listing.playerBid && listing.playerBid >= (listing.currentBid || 0)) {
    return { won: true, finalPrice: listing.playerBid }
  }
  
  return { won: false, finalPrice: 0 }
}

// ============================================
// EXPORTS
// ============================================

export {
  calculateAverageWear,
  determineCondition,
  calculateReliability,
  calculatePerformancePenalty,
  CONDITION_THRESHOLDS,
  BASE_PRICE_BY_TIER
}
