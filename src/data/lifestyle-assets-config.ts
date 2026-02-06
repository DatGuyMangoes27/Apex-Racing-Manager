// ============================================
// LIFESTYLE ASSETS CONFIGURATION
// ============================================
// Configuration for the asset-based lifestyle system where
// individual purchases determine lifestyle level and bonuses.

import type { LifestyleLevel } from './lifestyle-config'

// ============================================
// OWNED VEHICLE TYPES
// ============================================

export interface OwnedVehicle {
  id: string
  vehicleId: string               // Reference to VEHICLE_CATALOG entry
  brand: string
  model: string
  type: 'sports_car' | 'supercar' | 'hypercar' | 'luxury_sedan' | 'suv' | 'classic_car' | 'motorcycle' | 'boat' | 'yacht' | 'superyacht' | 'helicopter' | 'light_jet' | 'private_jet'
  year: number
  
  purchasePrice: number
  currentValue: number
  purchaseDate: { week: number; year: number }
  
  mileage: number
  condition: number               // 0-100
  monthlyMaintenanceCost: number
  monthlyInsuranceCost: number
  
  isPrimaryVehicle: boolean
  isCollectible: boolean
  appreciationRate?: number       // Annual % for collectibles
  depreciationRate?: number       // Annual % for regular vehicles
  
  prestige: number                // 0-100, affects lifestyle score
  enjoyment: number               // 0-100, affects happiness
}

// ============================================
// HOME FURNISHING TYPES
// ============================================

export type FurnishingCategory = 
  | 'furniture'
  | 'art'
  | 'electronics'
  | 'appliances'
  | 'outdoor'
  | 'home_office'
  | 'smart_home'
  | 'wine_cellar'
  | 'home_gym'
  | 'home_theater'
  | 'pool_spa'

export type FurnishingTier = 'basic' | 'quality' | 'designer' | 'luxury' | 'bespoke'

export interface HomeFurnishing {
  id: string
  propertyId: string              // Links to owned property
  category: FurnishingCategory
  tier: FurnishingTier
  name: string
  description: string
  
  purchasePrice: number
  currentValue: number
  purchaseDate: { week: number; year: number }
  
  // Depreciation (furniture loses value, art may appreciate)
  monthlyDepreciation: number     // Percentage
  
  // Benefits
  comfortBonus: number            // 0-20
  prestigeBonus: number           // 0-20
  
  // Status
  condition: number               // 0-100
  needsReplacement: boolean
}

export interface FurnishingCatalogEntry {
  id: string
  category: FurnishingCategory
  tier: FurnishingTier
  name: string
  description: string
  basePrice: number
  monthlyDepreciation: number
  comfortBonus: number
  prestigeBonus: number
  lifespan: number                // Years before needs replacement
}

// ============================================
// MEMBERSHIP TYPES
// ============================================

export type MembershipType = 
  | 'country_club'
  | 'yacht_club'
  | 'private_gym'
  | 'aviation_club'
  | 'concierge_service'
  | 'wine_club'
  | 'car_club'
  | 'social_club'

export interface Membership {
  id: string
  type: MembershipType
  clubId: string                  // Reference to catalog
  name: string
  location: string
  
  joinDate: { week: number; year: number }
  annualFee: number
  monthlyFee: number
  initializationFee: number       // One-time joining fee
  
  // Benefits
  prestigeBonus: number           // 0-30
  networkingBonus: number         // 0-30
  stressReduction: number         // 0-20
  
  // Status
  membershipTier: 'standard' | 'gold' | 'platinum' | 'founding'
  yearsAsMember: number
  eventsAttended: number
  
  // Perks
  perks: string[]
}

export interface MembershipCatalogEntry {
  id: string
  type: MembershipType
  name: string
  location: string
  description: string
  
  initializationFee: number
  annualFee: number
  monthlyFee: number
  
  // Requirements
  minimumNetWorth?: number
  requiresSponsorship: boolean
  waitlistMonths: number
  
  // Benefits
  prestigeBonus: number
  networkingBonus: number
  stressReduction: number
  
  // Available tiers
  tiers: {
    tier: 'standard' | 'gold' | 'platinum' | 'founding'
    additionalFee: number
    additionalPrestige: number
    perks: string[]
  }[]
  
  exclusivity: number             // 0-100
}

// ============================================
// LUXURY SERVICES TYPES
// ============================================

export type LuxuryServiceType = 
  | 'spa_wellness'
  | 'concierge'
  | 'travel'
  | 'personal_care'
  | 'security'
  | 'medical'

export interface LuxuryService {
  id: string
  serviceId: string              // Reference to catalog
  type: LuxuryServiceType
  name: string
  tier: 'standard' | 'premium' | 'elite'
  
  startDate: { week: number; year: number }
  monthlyFee: number
  
  // Benefits
  stressReduction: number        // 0-25
  prestigeBonus: number          // 0-20
  timeFreedPerWeek: number       // Hours
  healthBonus: number            // 0-15
  
  // Status
  isActive: boolean
  monthsSubscribed: number
}

export interface LuxuryServiceCatalogEntry {
  id: string
  type: LuxuryServiceType
  name: string
  description: string
  tier: 'standard' | 'premium' | 'elite'
  
  monthlyFee: number
  setupFee: number
  
  // Benefits
  stressReduction: number
  prestigeBonus: number
  timeFreedPerWeek: number
  healthBonus: number
  
  // Requirements
  minimumNetWorth?: number
  requiresProperty?: boolean     // Some require a residence
}

// ============================================
// LUXURY EXPERIENCES TYPES
// ============================================

export type ExperienceType = 
  | 'vacation'
  | 'event'
  | 'charter'
  | 'exclusive_access'
  | 'adventure'

export interface LuxuryExperience {
  id: string
  experienceId: string           // Reference to catalog
  type: ExperienceType
  name: string
  
  purchaseDate: { week: number; year: number }
  cost: number
  
  // Details
  duration: string               // "1 week", "1 day", etc.
  durationWeeks: number          // Actual weeks (for processing)
  
  // Benefits (applied when experience completes)
  stressReduction: number        // 0-40
  networkingBonus: number        // 0-30 (connections made)
  prestigeBonus: number          // 0-25
  happinessBoost: number         // 0-30
  
  // Tracking
  completedWeek?: number
  cooldownUntilWeek?: number     // Can't repeat immediately
}

export interface ExperienceCatalogEntry {
  id: string
  type: ExperienceType
  name: string
  description: string
  location: string
  
  cost: number
  duration: string
  durationWeeks: number
  
  // Benefits
  stressReduction: number
  networkingBonus: number
  prestigeBonus: number
  happinessBoost: number
  
  // Restrictions
  cooldownWeeks: number          // Can't repeat for X weeks
  minimumNetWorth?: number
  seasonalAvailability?: string  // "summer", "winter", "all"
}

// ============================================
// COLLECTIBLES TYPES
// ============================================

export type CollectibleCategory = 
  | 'watches'
  | 'wine'
  | 'art'
  | 'memorabilia'
  | 'jewelry'
  | 'rare_items'

export type CollectibleRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export interface Collectible {
  id: string
  catalogId: string              // Reference to catalog
  category: CollectibleCategory
  rarity: CollectibleRarity
  
  name: string
  description: string
  
  purchasePrice: number
  currentValue: number
  purchaseDate: { week: number; year: number }
  
  // Value tracking
  appreciationRate: number       // Annual % (can be negative)
  lastAppraisalValue: number
  lastAppraisalDate: { week: number; year: number }
  
  // Costs
  monthlyInsuranceCost: number
  monthlyStorageCost: number
  
  // Benefits
  prestigeBonus: number          // 0-30
  
  // Status
  condition: 'mint' | 'excellent' | 'good' | 'fair'
  isInsured: boolean
  isDisplayed: boolean           // Displayed items give more prestige
}

export interface CollectibleCatalogEntry {
  id: string
  category: CollectibleCategory
  rarity: CollectibleRarity
  name: string
  description: string
  
  basePrice: number
  priceVariance: number          // +/- % for randomization
  
  appreciationRate: number       // Base annual %
  insuranceRate: number          // Annual % of value
  storageCost: number            // Monthly fixed
  
  prestigeBonus: number
  
  // Availability
  minimumNetWorth?: number
  requiresConnection?: boolean   // Need networking to find
}

// ============================================
// PETS
// ============================================

export type PetType = 'dog' | 'cat' | 'horse' | 'exotic_bird' | 'aquarium' | 'reptile'

export interface Pet {
  id: string
  catalogId: string
  type: PetType
  name: string               // Player-named
  breed: string
  
  purchasePrice: number
  monthlyUpkeep: number      // Food, vet, grooming
  
  // Benefits
  stressReduction: number    // 0-20
  happinessBoost: number     // 0-15
  prestigeBonus: number      // 0-10 (exotic pets)
  
  // Status
  health: number             // 0-100
  happiness: number          // 0-100
  ageYears: number
  purchaseDate: { week: number; year: number }
}

export interface PetCatalogEntry {
  id: string
  type: PetType
  breed: string
  description: string
  basePrice: number
  monthlyUpkeep: number
  stressReduction: number
  happinessBoost: number
  prestigeBonus: number
  lifespanYears: number
}

export const PET_CATALOG: PetCatalogEntry[] = [
  // Dogs
  { id: 'pet_golden', type: 'dog', breed: 'Golden Retriever', description: 'Loyal, friendly family dog', basePrice: 2500, monthlyUpkeep: 250, stressReduction: 15, happinessBoost: 12, prestigeBonus: 0, lifespanYears: 12 },
  { id: 'pet_frenchie', type: 'dog', breed: 'French Bulldog', description: 'Compact, playful companion', basePrice: 4000, monthlyUpkeep: 300, stressReduction: 12, happinessBoost: 10, prestigeBonus: 2, lifespanYears: 11 },
  { id: 'pet_german_shepherd', type: 'dog', breed: 'German Shepherd', description: 'Intelligent, protective guard dog', basePrice: 3500, monthlyUpkeep: 280, stressReduction: 10, happinessBoost: 10, prestigeBonus: 3, lifespanYears: 11 },
  { id: 'pet_husky', type: 'dog', breed: 'Siberian Husky', description: 'Energetic, striking appearance', basePrice: 3000, monthlyUpkeep: 300, stressReduction: 12, happinessBoost: 10, prestigeBonus: 2, lifespanYears: 13 },
  
  // Cats
  { id: 'pet_persian', type: 'cat', breed: 'Persian Cat', description: 'Elegant, calm indoor cat', basePrice: 2000, monthlyUpkeep: 150, stressReduction: 10, happinessBoost: 8, prestigeBonus: 2, lifespanYears: 15 },
  { id: 'pet_bengal', type: 'cat', breed: 'Bengal Cat', description: 'Active, exotic-looking cat', basePrice: 3500, monthlyUpkeep: 200, stressReduction: 8, happinessBoost: 10, prestigeBonus: 4, lifespanYears: 14 },
  
  // Horses
  { id: 'pet_thoroughbred', type: 'horse', breed: 'Thoroughbred', description: 'Racing pedigree, requires stabling', basePrice: 50000, monthlyUpkeep: 2500, stressReduction: 18, happinessBoost: 12, prestigeBonus: 10, lifespanYears: 28 },
  { id: 'pet_arabian', type: 'horse', breed: 'Arabian Horse', description: 'Graceful endurance breed', basePrice: 75000, monthlyUpkeep: 3000, stressReduction: 18, happinessBoost: 14, prestigeBonus: 12, lifespanYears: 30 },
  
  // Exotic
  { id: 'pet_parrot', type: 'exotic_bird', breed: 'Macaw Parrot', description: 'Colorful, intelligent companion', basePrice: 5000, monthlyUpkeep: 200, stressReduction: 8, happinessBoost: 8, prestigeBonus: 5, lifespanYears: 50 },
  { id: 'pet_aquarium', type: 'aquarium', breed: 'Saltwater Reef Tank', description: 'Stunning marine aquarium', basePrice: 15000, monthlyUpkeep: 500, stressReduction: 12, happinessBoost: 6, prestigeBonus: 6, lifespanYears: 99 },
  { id: 'pet_reptile', type: 'reptile', breed: 'Blue Iguana', description: 'Rare exotic reptile', basePrice: 8000, monthlyUpkeep: 150, stressReduction: 5, happinessBoost: 5, prestigeBonus: 6, lifespanYears: 20 },
]

// ============================================
// WARDROBE / FASHION
// ============================================

export type WardrobeCategory = 'casual' | 'business' | 'formal' | 'sportswear' | 'accessories' | 'watches'

export interface WardrobeItem {
  id: string
  catalogId: string
  category: WardrobeCategory
  name: string
  brand: string
  
  purchasePrice: number
  currentValue: number
  
  // Benefits
  prestigeBonus: number      // 0-15
  confidenceBoost: number    // 0-10
  networkingBonus: number    // 0-5 (dressing well helps)
  
  purchaseDate: { week: number; year: number }
  condition: number          // 0-100
  wearCount: number
}

export interface WardrobeCatalogEntry {
  id: string
  category: WardrobeCategory
  name: string
  brand: string
  description: string
  basePrice: number
  prestigeBonus: number
  confidenceBoost: number
  networkingBonus: number
  durability: number         // How many "wears" before degrading
}

export const WARDROBE_CATALOG: WardrobeCatalogEntry[] = [
  // Casual
  { id: 'ward_casual_basic', category: 'casual', name: 'Everyday Basics', brand: 'Various', description: 'Quality everyday clothes', basePrice: 500, prestigeBonus: 0, confidenceBoost: 1, networkingBonus: 0, durability: 200 },
  { id: 'ward_casual_designer', category: 'casual', name: 'Designer Casual', brand: 'Gucci / Balenciaga', description: 'Luxury casual streetwear', basePrice: 5000, prestigeBonus: 4, confidenceBoost: 3, networkingBonus: 1, durability: 150 },
  
  // Business
  { id: 'ward_business_suit', category: 'business', name: 'Tailored Business Suit', brand: 'Hugo Boss', description: 'Professional tailored suit', basePrice: 2000, prestigeBonus: 3, confidenceBoost: 4, networkingBonus: 2, durability: 120 },
  { id: 'ward_business_bespoke', category: 'business', name: 'Bespoke Savile Row Suit', brand: 'Savile Row', description: 'Hand-tailored on Savile Row', basePrice: 15000, prestigeBonus: 8, confidenceBoost: 6, networkingBonus: 4, durability: 200 },
  { id: 'ward_business_luxury', category: 'business', name: 'Luxury Business Collection', brand: 'Tom Ford', description: 'Full Tom Ford business wardrobe', basePrice: 30000, prestigeBonus: 10, confidenceBoost: 7, networkingBonus: 5, durability: 180 },
  
  // Formal
  { id: 'ward_formal_tux', category: 'formal', name: 'Classic Tuxedo', brand: 'Armani', description: 'Black-tie ready Armani tux', basePrice: 5000, prestigeBonus: 6, confidenceBoost: 5, networkingBonus: 3, durability: 100 },
  { id: 'ward_formal_bespoke', category: 'formal', name: 'Bespoke Evening Collection', brand: 'Brioni', description: 'Multiple bespoke formal pieces', basePrice: 40000, prestigeBonus: 12, confidenceBoost: 8, networkingBonus: 5, durability: 150 },
  
  // Sportswear
  { id: 'ward_sport_basic', category: 'sportswear', name: 'Athletic Basics', brand: 'Nike / Adidas', description: 'Quality athletic wear', basePrice: 800, prestigeBonus: 1, confidenceBoost: 2, networkingBonus: 0, durability: 150 },
  { id: 'ward_sport_premium', category: 'sportswear', name: 'Premium Activewear', brand: 'Lululemon / Arc\'teryx', description: 'High-end athletic clothing', basePrice: 3000, prestigeBonus: 3, confidenceBoost: 3, networkingBonus: 1, durability: 180 },
  
  // Accessories
  { id: 'ward_acc_shoes', category: 'accessories', name: 'Designer Shoes Collection', brand: 'Louboutin / Berluti', description: 'Collection of luxury footwear', basePrice: 8000, prestigeBonus: 5, confidenceBoost: 3, networkingBonus: 2, durability: 120 },
  { id: 'ward_acc_leather', category: 'accessories', name: 'Luxury Leather Goods', brand: 'Herm\u00e8s / Louis Vuitton', description: 'Bags, belts, wallets', basePrice: 12000, prestigeBonus: 7, confidenceBoost: 3, networkingBonus: 2, durability: 250 },
  { id: 'ward_acc_sunglasses', category: 'accessories', name: 'Designer Sunglasses Set', brand: 'Ray-Ban / Cartier', description: 'Premium eyewear collection', basePrice: 3000, prestigeBonus: 3, confidenceBoost: 2, networkingBonus: 1, durability: 100 },
  
  // Watches (wearable, not collectible-grade)
  { id: 'ward_watch_entry', category: 'watches', name: 'Entry Luxury Watch', brand: 'TAG Heuer', description: 'Quality automatic timepiece', basePrice: 5000, prestigeBonus: 4, confidenceBoost: 3, networkingBonus: 2, durability: 500 },
  { id: 'ward_watch_mid', category: 'watches', name: 'Mid-Range Luxury Watch', brand: 'Omega Seamaster', description: 'Iconic professional watch', basePrice: 12000, prestigeBonus: 6, confidenceBoost: 4, networkingBonus: 3, durability: 500 },
  { id: 'ward_watch_high', category: 'watches', name: 'High-End Watch', brand: 'Rolex Submariner', description: 'The quintessential luxury watch', basePrice: 35000, prestigeBonus: 10, confidenceBoost: 5, networkingBonus: 4, durability: 500 },
  { id: 'ward_watch_ultra', category: 'watches', name: 'Ultra-Luxury Watch', brand: 'Patek Philippe', description: 'Horological masterpiece', basePrice: 120000, prestigeBonus: 15, confidenceBoost: 6, networkingBonus: 5, durability: 500 },
]

// ============================================
// DIET & NUTRITION
// ============================================

export type DietPlanType = 'standard' | 'athletic' | 'gourmet' | 'organic' | 'personalized' | 'elite_performance'

export interface DietPlan {
  id: string
  catalogId: string
  type: DietPlanType
  name: string
  
  monthlyFee: number
  
  // Benefits
  healthBonus: number         // 0-20 (to physical health)
  fitnessBonus: number        // 0-15
  energyBonus: number         // 0-10
  stressReduction: number     // 0-10
  
  startDate: { week: number; year: number }
  isActive: boolean
}

export interface DietCatalogEntry {
  id: string
  type: DietPlanType
  name: string
  description: string
  monthlyFee: number
  healthBonus: number
  fitnessBonus: number
  energyBonus: number
  stressReduction: number
}

export const DIET_CATALOG: DietCatalogEntry[] = [
  { id: 'diet_standard', type: 'standard', name: 'Balanced Meal Plan', description: 'Nutritionist-designed balanced diet', monthlyFee: 200, healthBonus: 3, fitnessBonus: 2, energyBonus: 2, stressReduction: 1 },
  { id: 'diet_athletic', type: 'athletic', name: 'Athletic Performance Diet', description: 'High-protein, macro-optimized plan', monthlyFee: 500, healthBonus: 5, fitnessBonus: 8, energyBonus: 5, stressReduction: 2 },
  { id: 'diet_organic', type: 'organic', name: 'Organic & Whole Foods', description: 'All-organic, locally-sourced ingredients', monthlyFee: 800, healthBonus: 8, fitnessBonus: 4, energyBonus: 4, stressReduction: 4 },
  { id: 'diet_gourmet', type: 'gourmet', name: 'Gourmet Chef-Prepared', description: 'Daily meals prepared by a private chef', monthlyFee: 2000, healthBonus: 6, fitnessBonus: 3, energyBonus: 5, stressReduction: 8 },
  { id: 'diet_personalized', type: 'personalized', name: 'DNA-Based Personalized Diet', description: 'Genetically optimized nutrition plan', monthlyFee: 1500, healthBonus: 12, fitnessBonus: 8, energyBonus: 7, stressReduction: 5 },
  { id: 'diet_elite', type: 'elite_performance', name: 'Elite Performance Program', description: 'Full nutritionist + chef + supplements', monthlyFee: 5000, healthBonus: 18, fitnessBonus: 15, energyBonus: 10, stressReduction: 8 },
]

// ============================================
// LIFESTYLE ASSETS CONTAINER
// ============================================

export interface LifestyleAssets {
  vehicles: OwnedVehicle[]
  furnishings: HomeFurnishing[]
  memberships: Membership[]
  services: LuxuryService[]
  experiences: LuxuryExperience[]
  collectibles: Collectible[]
  pets: Pet[]
  wardrobe: WardrobeItem[]
  dietPlan: DietPlan | null
}

// ============================================
// FURNISHING CATALOG
// ============================================

export const FURNISHING_CATALOG: FurnishingCatalogEntry[] = [
  // FURNITURE - Basic
  { id: 'furn_basic_living', category: 'furniture', tier: 'basic', name: 'Basic Living Room Set', description: 'Functional sofa, coffee table, and chairs', basePrice: 3000, monthlyDepreciation: 0.5, comfortBonus: 2, prestigeBonus: 0, lifespan: 8 },
  { id: 'furn_basic_dining', category: 'furniture', tier: 'basic', name: 'Basic Dining Set', description: 'Simple dining table and chairs', basePrice: 1500, monthlyDepreciation: 0.5, comfortBonus: 1, prestigeBonus: 0, lifespan: 10 },
  { id: 'furn_basic_bedroom', category: 'furniture', tier: 'basic', name: 'Basic Bedroom Set', description: 'Bed frame, mattress, and dresser', basePrice: 2000, monthlyDepreciation: 0.4, comfortBonus: 3, prestigeBonus: 0, lifespan: 10 },
  
  // FURNITURE - Quality
  { id: 'furn_quality_living', category: 'furniture', tier: 'quality', name: 'Quality Living Room Set', description: 'Comfortable sectional with quality materials', basePrice: 12000, monthlyDepreciation: 0.4, comfortBonus: 5, prestigeBonus: 3, lifespan: 12 },
  { id: 'furn_quality_dining', category: 'furniture', tier: 'quality', name: 'Quality Dining Set', description: 'Solid wood table with upholstered chairs', basePrice: 8000, monthlyDepreciation: 0.4, comfortBonus: 3, prestigeBonus: 3, lifespan: 15 },
  { id: 'furn_quality_bedroom', category: 'furniture', tier: 'quality', name: 'Quality Bedroom Set', description: 'Premium mattress with wooden furniture', basePrice: 10000, monthlyDepreciation: 0.3, comfortBonus: 7, prestigeBonus: 3, lifespan: 15 },
  
  // FURNITURE - Designer
  { id: 'furn_designer_living', category: 'furniture', tier: 'designer', name: 'Designer Living Room', description: 'Italian leather sofas and designer pieces', basePrice: 45000, monthlyDepreciation: 0.3, comfortBonus: 10, prestigeBonus: 8, lifespan: 20 },
  { id: 'furn_designer_dining', category: 'furniture', tier: 'designer', name: 'Designer Dining Room', description: 'Custom dining table with designer chairs', basePrice: 30000, monthlyDepreciation: 0.3, comfortBonus: 6, prestigeBonus: 10, lifespan: 20 },
  { id: 'furn_designer_bedroom', category: 'furniture', tier: 'designer', name: 'Designer Master Suite', description: 'Luxury bed and custom cabinetry', basePrice: 50000, monthlyDepreciation: 0.2, comfortBonus: 12, prestigeBonus: 10, lifespan: 25 },
  
  // FURNITURE - Luxury
  { id: 'furn_luxury_living', category: 'furniture', tier: 'luxury', name: 'Luxury Living Room', description: 'Bespoke pieces from top European designers', basePrice: 150000, monthlyDepreciation: 0.2, comfortBonus: 15, prestigeBonus: 15, lifespan: 30 },
  { id: 'furn_luxury_dining', category: 'furniture', tier: 'luxury', name: 'Luxury Dining Room', description: 'Antique or custom-made dining collection', basePrice: 100000, monthlyDepreciation: 0.1, comfortBonus: 10, prestigeBonus: 18, lifespan: 50 },
  
  // FURNITURE - Bespoke
  { id: 'furn_bespoke_living', category: 'furniture', tier: 'bespoke', name: 'Bespoke Living Room', description: 'One-of-a-kind commissioned pieces', basePrice: 500000, monthlyDepreciation: 0, comfortBonus: 20, prestigeBonus: 20, lifespan: 100 },
  
  // ELECTRONICS - Basic to Luxury
  { id: 'elec_basic_av', category: 'electronics', tier: 'basic', name: 'Basic Home Entertainment', description: 'Standard TV and sound system', basePrice: 2000, monthlyDepreciation: 1.5, comfortBonus: 3, prestigeBonus: 0, lifespan: 5 },
  { id: 'elec_quality_av', category: 'electronics', tier: 'quality', name: 'Quality Home Theater', description: '65" OLED TV with surround sound', basePrice: 10000, monthlyDepreciation: 1.2, comfortBonus: 8, prestigeBonus: 3, lifespan: 7 },
  { id: 'elec_designer_av', category: 'electronics', tier: 'designer', name: 'Designer Home Theater', description: 'Projector room with audiophile sound', basePrice: 50000, monthlyDepreciation: 1.0, comfortBonus: 12, prestigeBonus: 8, lifespan: 10 },
  { id: 'elec_luxury_av', category: 'electronics', tier: 'luxury', name: 'Luxury Cinema Room', description: 'Full private cinema with B&O or similar', basePrice: 200000, monthlyDepreciation: 0.8, comfortBonus: 18, prestigeBonus: 15, lifespan: 15 },
  
  // HOME OFFICE
  { id: 'office_basic', category: 'home_office', tier: 'basic', name: 'Basic Home Office', description: 'Desk, chair, and basic setup', basePrice: 1500, monthlyDepreciation: 0.6, comfortBonus: 2, prestigeBonus: 0, lifespan: 7 },
  { id: 'office_quality', category: 'home_office', tier: 'quality', name: 'Professional Home Office', description: 'Ergonomic furniture and quality equipment', basePrice: 8000, monthlyDepreciation: 0.5, comfortBonus: 6, prestigeBonus: 3, lifespan: 10 },
  { id: 'office_designer', category: 'home_office', tier: 'designer', name: 'Executive Home Office', description: 'Designer desk, premium equipment', basePrice: 35000, monthlyDepreciation: 0.3, comfortBonus: 10, prestigeBonus: 10, lifespan: 15 },
  { id: 'office_luxury', category: 'home_office', tier: 'luxury', name: 'Luxury Study', description: 'Library-style office with custom built-ins', basePrice: 100000, monthlyDepreciation: 0.2, comfortBonus: 15, prestigeBonus: 18, lifespan: 25 },
  
  // OUTDOOR
  { id: 'outdoor_basic', category: 'outdoor', tier: 'basic', name: 'Basic Patio Set', description: 'Simple outdoor furniture', basePrice: 1000, monthlyDepreciation: 0.8, comfortBonus: 2, prestigeBonus: 0, lifespan: 5 },
  { id: 'outdoor_quality', category: 'outdoor', tier: 'quality', name: 'Quality Outdoor Living', description: 'Weather-resistant quality furniture', basePrice: 8000, monthlyDepreciation: 0.6, comfortBonus: 5, prestigeBonus: 3, lifespan: 10 },
  { id: 'outdoor_designer', category: 'outdoor', tier: 'designer', name: 'Designer Outdoor Space', description: 'Premium outdoor kitchen and lounge', basePrice: 50000, monthlyDepreciation: 0.4, comfortBonus: 10, prestigeBonus: 10, lifespan: 15 },
  { id: 'outdoor_luxury', category: 'outdoor', tier: 'luxury', name: 'Resort-Style Outdoor', description: 'Pool cabana, outdoor kitchen, fire features', basePrice: 200000, monthlyDepreciation: 0.3, comfortBonus: 15, prestigeBonus: 18, lifespan: 20 },
  
  // APPLIANCES
  { id: 'appl_basic_kitchen', category: 'appliances', tier: 'basic', name: 'Basic Kitchen Appliances', description: 'Standard refrigerator, oven, dishwasher', basePrice: 3000, monthlyDepreciation: 0.6, comfortBonus: 2, prestigeBonus: 0, lifespan: 10 },
  { id: 'appl_quality_kitchen', category: 'appliances', tier: 'quality', name: 'Quality Kitchen Suite', description: 'Stainless steel premium brand appliances', basePrice: 15000, monthlyDepreciation: 0.5, comfortBonus: 5, prestigeBonus: 3, lifespan: 15 },
  { id: 'appl_designer_kitchen', category: 'appliances', tier: 'designer', name: 'Chef\'s Kitchen', description: 'Sub-Zero, Wolf, or Miele appliances', basePrice: 60000, monthlyDepreciation: 0.4, comfortBonus: 10, prestigeBonus: 10, lifespan: 20 },
  { id: 'appl_luxury_kitchen', category: 'appliances', tier: 'luxury', name: 'Professional Kitchen', description: 'Commercial-grade with wine storage', basePrice: 150000, monthlyDepreciation: 0.3, comfortBonus: 15, prestigeBonus: 15, lifespan: 25 },
  
  // ART (appreciates or stable)
  { id: 'art_basic', category: 'art', tier: 'basic', name: 'Decorative Art', description: 'Prints and affordable original pieces', basePrice: 2000, monthlyDepreciation: 0, comfortBonus: 2, prestigeBonus: 1, lifespan: 100 },
  { id: 'art_quality', category: 'art', tier: 'quality', name: 'Original Artwork', description: 'Original pieces from emerging artists', basePrice: 15000, monthlyDepreciation: -0.1, comfortBonus: 5, prestigeBonus: 5, lifespan: 100 },
  { id: 'art_designer', category: 'art', tier: 'designer', name: 'Curated Art Collection', description: 'Established artist works', basePrice: 100000, monthlyDepreciation: -0.2, comfortBonus: 8, prestigeBonus: 12, lifespan: 100 },
  { id: 'art_luxury', category: 'art', tier: 'luxury', name: 'Blue Chip Art', description: 'Museum-quality pieces', basePrice: 500000, monthlyDepreciation: -0.3, comfortBonus: 10, prestigeBonus: 20, lifespan: 100 },
  
  // SMART HOME
  { id: 'smart_basic', category: 'smart_home', tier: 'basic', name: 'Basic Smart Home Kit', description: 'Smart thermostat, lights, and doorbell', basePrice: 3000, monthlyDepreciation: 1.5, comfortBonus: 5, prestigeBonus: 2, lifespan: 5 },
  { id: 'smart_quality', category: 'smart_home', tier: 'quality', name: 'Connected Home System', description: 'Integrated lighting, climate, and security', basePrice: 15000, monthlyDepreciation: 1.2, comfortBonus: 10, prestigeBonus: 5, lifespan: 7 },
  { id: 'smart_designer', category: 'smart_home', tier: 'designer', name: 'Premium Automation', description: 'Full home automation with voice control', basePrice: 50000, monthlyDepreciation: 1.0, comfortBonus: 15, prestigeBonus: 10, lifespan: 10 },
  { id: 'smart_luxury', category: 'smart_home', tier: 'luxury', name: 'Estate Automation System', description: 'Crestron/Control4 whole-home integration', basePrice: 200000, monthlyDepreciation: 0.8, comfortBonus: 18, prestigeBonus: 15, lifespan: 15 },
  { id: 'smart_bespoke', category: 'smart_home', tier: 'bespoke', name: 'AI-Powered Smart Estate', description: 'Custom AI butler with predictive automation', basePrice: 500000, monthlyDepreciation: 0.5, comfortBonus: 20, prestigeBonus: 20, lifespan: 20 },
  
  // WINE CELLAR
  { id: 'wine_basic', category: 'wine_cellar', tier: 'basic', name: 'Wine Cooler', description: 'Temperature-controlled wine storage unit', basePrice: 2500, monthlyDepreciation: 0.6, comfortBonus: 3, prestigeBonus: 3, lifespan: 10 },
  { id: 'wine_quality', category: 'wine_cellar', tier: 'quality', name: 'Walk-In Wine Cellar', description: 'Climate-controlled cellar with storage racks', basePrice: 25000, monthlyDepreciation: 0.4, comfortBonus: 6, prestigeBonus: 8, lifespan: 20 },
  { id: 'wine_designer', category: 'wine_cellar', tier: 'designer', name: 'Custom Wine Room', description: 'Designer cellar with tasting area', basePrice: 75000, monthlyDepreciation: 0.3, comfortBonus: 10, prestigeBonus: 15, lifespan: 30 },
  { id: 'wine_luxury', category: 'wine_cellar', tier: 'luxury', name: 'Grand Wine Vault', description: 'Professional-grade cellar with sommelier station', basePrice: 250000, monthlyDepreciation: 0.2, comfortBonus: 15, prestigeBonus: 20, lifespan: 50 },
  { id: 'wine_bespoke', category: 'wine_cellar', tier: 'bespoke', name: 'Museum Wine Collection Room', description: 'World-class cellar with climate zones', basePrice: 750000, monthlyDepreciation: 0.1, comfortBonus: 18, prestigeBonus: 22, lifespan: 100 },
  
  // HOME GYM
  { id: 'gym_basic', category: 'home_gym', tier: 'basic', name: 'Basic Fitness Equipment', description: 'Dumbbells, bench, and cardio machine', basePrice: 5000, monthlyDepreciation: 0.8, comfortBonus: 5, prestigeBonus: 1, lifespan: 10 },
  { id: 'gym_quality', category: 'home_gym', tier: 'quality', name: 'Home Gym Setup', description: 'Power rack, cable machine, and commercial cardio', basePrice: 25000, monthlyDepreciation: 0.6, comfortBonus: 10, prestigeBonus: 5, lifespan: 15 },
  { id: 'gym_designer', category: 'home_gym', tier: 'designer', name: 'Premium Fitness Studio', description: 'Technogym equipment with virtual classes', basePrice: 75000, monthlyDepreciation: 0.5, comfortBonus: 15, prestigeBonus: 10, lifespan: 15 },
  { id: 'gym_luxury', category: 'home_gym', tier: 'luxury', name: 'Private Wellness Center', description: 'Commercial-grade gym with sauna and recovery', basePrice: 200000, monthlyDepreciation: 0.4, comfortBonus: 18, prestigeBonus: 15, lifespan: 20 },
  { id: 'gym_bespoke', category: 'home_gym', tier: 'bespoke', name: 'Elite Training Facility', description: 'Pro athlete-level facility with cryotherapy', basePrice: 500000, monthlyDepreciation: 0.3, comfortBonus: 20, prestigeBonus: 18, lifespan: 25 },
  
  // HOME THEATER
  { id: 'theater_basic', category: 'home_theater', tier: 'basic', name: 'Media Room Setup', description: '75" TV with soundbar and seating', basePrice: 8000, monthlyDepreciation: 1.2, comfortBonus: 8, prestigeBonus: 3, lifespan: 7 },
  { id: 'theater_quality', category: 'home_theater', tier: 'quality', name: 'Dedicated Theater Room', description: 'Projector, surround sound, theater seating', basePrice: 35000, monthlyDepreciation: 1.0, comfortBonus: 12, prestigeBonus: 8, lifespan: 10 },
  { id: 'theater_designer', category: 'home_theater', tier: 'designer', name: 'Premium Cinema', description: '4K laser projector with Dolby Atmos', basePrice: 100000, monthlyDepreciation: 0.8, comfortBonus: 16, prestigeBonus: 12, lifespan: 12 },
  { id: 'theater_luxury', category: 'home_theater', tier: 'luxury', name: 'Private Cinema', description: 'Commercial-grade projector with IMAX-style sound', basePrice: 350000, monthlyDepreciation: 0.6, comfortBonus: 18, prestigeBonus: 18, lifespan: 15 },
  { id: 'theater_bespoke', category: 'home_theater', tier: 'bespoke', name: 'World-Class Private Cinema', description: 'THX-certified cinema with 35mm capability', basePrice: 1000000, monthlyDepreciation: 0.4, comfortBonus: 20, prestigeBonus: 20, lifespan: 20 },
  
  // POOL & SPA
  { id: 'pool_basic', category: 'pool_spa', tier: 'basic', name: 'Hot Tub', description: 'Quality outdoor hot tub with jets', basePrice: 10000, monthlyDepreciation: 0.8, comfortBonus: 8, prestigeBonus: 3, lifespan: 10 },
  { id: 'pool_quality', category: 'pool_spa', tier: 'quality', name: 'Pool with Hot Tub', description: 'In-ground pool with attached spa', basePrice: 75000, monthlyDepreciation: 0.5, comfortBonus: 14, prestigeBonus: 8, lifespan: 20 },
  { id: 'pool_designer', category: 'pool_spa', tier: 'designer', name: 'Designer Pool Complex', description: 'Infinity edge pool with waterfall and cabana', basePrice: 200000, monthlyDepreciation: 0.4, comfortBonus: 17, prestigeBonus: 15, lifespan: 25 },
  { id: 'pool_luxury', category: 'pool_spa', tier: 'luxury', name: 'Resort-Style Pool Estate', description: 'Multiple pools, grotto, and outdoor kitchen', basePrice: 500000, monthlyDepreciation: 0.3, comfortBonus: 19, prestigeBonus: 18, lifespan: 30 },
  { id: 'pool_bespoke', category: 'pool_spa', tier: 'bespoke', name: 'Private Water Park', description: 'Olympic pool, lazy river, and water features', basePrice: 2000000, monthlyDepreciation: 0.2, comfortBonus: 20, prestigeBonus: 20, lifespan: 40 },
]

// ============================================
// MEMBERSHIP CATALOG
// ============================================

export const MEMBERSHIP_CATALOG: MembershipCatalogEntry[] = [
  // COUNTRY CLUBS
  {
    id: 'club_country_local',
    type: 'country_club',
    name: 'Local Country Club',
    location: 'Various',
    description: 'Regional country club with golf, tennis, and dining',
    initializationFee: 25000,
    annualFee: 15000,
    monthlyFee: 0,
    requiresSponsorship: false,
    waitlistMonths: 0,
    prestigeBonus: 5,
    networkingBonus: 8,
    stressReduction: 5,
    tiers: [
      { tier: 'standard', additionalFee: 0, additionalPrestige: 0, perks: ['Golf access', 'Tennis courts', 'Dining room'] },
      { tier: 'gold', additionalFee: 5000, additionalPrestige: 2, perks: ['Priority tee times', 'Guest passes', 'Pool access'] }
    ],
    exclusivity: 30
  },
  {
    id: 'club_country_premium',
    type: 'country_club',
    name: 'Premium Country Club',
    location: 'Various',
    description: 'Prestigious club with championship golf course',
    initializationFee: 100000,
    annualFee: 35000,
    monthlyFee: 0,
    minimumNetWorth: 5000000,
    requiresSponsorship: true,
    waitlistMonths: 12,
    prestigeBonus: 12,
    networkingBonus: 15,
    stressReduction: 8,
    tiers: [
      { tier: 'standard', additionalFee: 0, additionalPrestige: 0, perks: ['Full club access', 'Tournament entry', 'Spa access'] },
      { tier: 'gold', additionalFee: 15000, additionalPrestige: 3, perks: ['Preferred dining', 'Locker room', 'Guest privileges'] },
      { tier: 'platinum', additionalFee: 30000, additionalPrestige: 5, perks: ['Private events', 'Board consideration', 'Reciprocal clubs'] }
    ],
    exclusivity: 60
  },
  {
    id: 'club_country_elite',
    type: 'country_club',
    name: 'Elite Country Club',
    location: 'Monaco / London / New York',
    description: 'World-renowned exclusive club with celebrity members',
    initializationFee: 500000,
    annualFee: 100000,
    monthlyFee: 0,
    minimumNetWorth: 50000000,
    requiresSponsorship: true,
    waitlistMonths: 36,
    prestigeBonus: 25,
    networkingBonus: 30,
    stressReduction: 12,
    tiers: [
      { tier: 'standard', additionalFee: 0, additionalPrestige: 0, perks: ['Full access', 'Concierge', 'Global reciprocity'] },
      { tier: 'founding', additionalFee: 200000, additionalPrestige: 10, perks: ['Board seat', 'Event hosting', 'Legacy membership'] }
    ],
    exclusivity: 95
  },
  
  // YACHT CLUBS
  {
    id: 'club_yacht_local',
    type: 'yacht_club',
    name: 'Marina Yacht Club',
    location: 'Various',
    description: 'Local yacht club with mooring and social events',
    initializationFee: 15000,
    annualFee: 8000,
    monthlyFee: 0,
    requiresSponsorship: false,
    waitlistMonths: 0,
    prestigeBonus: 5,
    networkingBonus: 10,
    stressReduction: 8,
    tiers: [
      { tier: 'standard', additionalFee: 0, additionalPrestige: 0, perks: ['Clubhouse access', 'Racing events', 'Social calendar'] }
    ],
    exclusivity: 25
  },
  {
    id: 'club_yacht_monaco',
    type: 'yacht_club',
    name: 'Yacht Club de Monaco',
    location: 'Monaco',
    description: 'Prestigious Mediterranean yacht club',
    initializationFee: 200000,
    annualFee: 50000,
    monthlyFee: 0,
    minimumNetWorth: 20000000,
    requiresSponsorship: true,
    waitlistMonths: 24,
    prestigeBonus: 22,
    networkingBonus: 28,
    stressReduction: 10,
    tiers: [
      { tier: 'standard', additionalFee: 0, additionalPrestige: 0, perks: ['Mediterranean mooring', 'GP viewing', 'Galas'] },
      { tier: 'platinum', additionalFee: 100000, additionalPrestige: 8, perks: ['VIP berths', 'Superyacht events', 'Royal regattas'] }
    ],
    exclusivity: 85
  },
  
  // PRIVATE GYM / FITNESS
  {
    id: 'club_gym_premium',
    type: 'private_gym',
    name: 'Exclusive Fitness Club',
    location: 'Various',
    description: 'Private gym with personal training and spa',
    initializationFee: 5000,
    annualFee: 12000,
    monthlyFee: 0,
    requiresSponsorship: false,
    waitlistMonths: 0,
    prestigeBonus: 3,
    networkingBonus: 8,
    stressReduction: 12,
    tiers: [
      { tier: 'standard', additionalFee: 0, additionalPrestige: 0, perks: ['24/7 access', 'Classes', 'Basic spa'] },
      { tier: 'gold', additionalFee: 6000, additionalPrestige: 2, perks: ['Personal trainer', 'Full spa', 'Nutrition coaching'] }
    ],
    exclusivity: 40
  },
  {
    id: 'club_gym_ultra',
    type: 'private_gym',
    name: 'Ultra-Private Health Club',
    location: 'Major Cities',
    description: 'Members-only health club with medical integration',
    initializationFee: 50000,
    annualFee: 40000,
    monthlyFee: 0,
    minimumNetWorth: 10000000,
    requiresSponsorship: true,
    waitlistMonths: 6,
    prestigeBonus: 10,
    networkingBonus: 15,
    stressReduction: 18,
    tiers: [
      { tier: 'standard', additionalFee: 0, additionalPrestige: 0, perks: ['Private suites', 'Medical staff', 'Recovery tech'] },
      { tier: 'platinum', additionalFee: 20000, additionalPrestige: 5, perks: ['House calls', 'Cryotherapy', 'Longevity programs'] }
    ],
    exclusivity: 70
  },
  
  // AVIATION CLUBS
  {
    id: 'club_aviation_membership',
    type: 'aviation_club',
    name: 'Private Aviation Club',
    location: 'Global',
    description: 'Fractional jet ownership and flight hours',
    initializationFee: 100000,
    annualFee: 50000,
    monthlyFee: 0,
    minimumNetWorth: 10000000,
    requiresSponsorship: false,
    waitlistMonths: 0,
    prestigeBonus: 18,
    networkingBonus: 20,
    stressReduction: 15,
    tiers: [
      { tier: 'standard', additionalFee: 0, additionalPrestige: 0, perks: ['25 flight hours', 'Light jets', 'FBO access'] },
      { tier: 'gold', additionalFee: 50000, additionalPrestige: 5, perks: ['50 flight hours', 'Mid-size jets', 'Concierge'] },
      { tier: 'platinum', additionalFee: 150000, additionalPrestige: 10, perks: ['100 flight hours', 'Heavy jets', 'Priority booking'] }
    ],
    exclusivity: 75
  },
  
  // CONCIERGE SERVICES
  {
    id: 'club_concierge_premium',
    type: 'concierge_service',
    name: 'Premium Concierge Service',
    location: 'Global',
    description: 'Personal concierge for travel and lifestyle',
    initializationFee: 5000,
    annualFee: 15000,
    monthlyFee: 0,
    requiresSponsorship: false,
    waitlistMonths: 0,
    prestigeBonus: 5,
    networkingBonus: 5,
    stressReduction: 15,
    tiers: [
      { tier: 'standard', additionalFee: 0, additionalPrestige: 0, perks: ['Travel booking', 'Restaurant reservations', 'Event tickets'] },
      { tier: 'gold', additionalFee: 10000, additionalPrestige: 3, perks: ['24/7 support', 'VIP access', 'Personal shopping'] }
    ],
    exclusivity: 30
  },
  {
    id: 'club_concierge_ultra',
    type: 'concierge_service',
    name: 'Ultra-Premium Lifestyle Management',
    location: 'Global',
    description: 'Complete lifestyle management service',
    initializationFee: 50000,
    annualFee: 100000,
    monthlyFee: 0,
    minimumNetWorth: 25000000,
    requiresSponsorship: true,
    waitlistMonths: 3,
    prestigeBonus: 15,
    networkingBonus: 12,
    stressReduction: 25,
    tiers: [
      { tier: 'standard', additionalFee: 0, additionalPrestige: 0, perks: ['Dedicated team', 'Property management', 'Staff sourcing'] },
      { tier: 'platinum', additionalFee: 50000, additionalPrestige: 8, perks: ['Family office services', 'Crisis management', 'Media relations'] }
    ],
    exclusivity: 85
  },
  
  // WINE CLUBS
  {
    id: 'club_wine_collector',
    type: 'wine_club',
    name: 'Fine Wine Collectors Club',
    location: 'Global',
    description: 'Access to rare wines and cellar services',
    initializationFee: 10000,
    annualFee: 12000,
    monthlyFee: 0,
    requiresSponsorship: false,
    waitlistMonths: 0,
    prestigeBonus: 5,
    networkingBonus: 10,
    stressReduction: 5,
    tiers: [
      { tier: 'standard', additionalFee: 0, additionalPrestige: 0, perks: ['Allocations', 'Storage', 'Tastings'] },
      { tier: 'gold', additionalFee: 8000, additionalPrestige: 3, perks: ['First picks', 'Winery visits', 'Sommelier service'] }
    ],
    exclusivity: 40
  },
  
  // CAR CLUBS
  {
    id: 'club_car_enthusiast',
    type: 'car_club',
    name: 'Supercar Owners Club',
    location: 'Global',
    description: 'Network of supercar enthusiasts with track days',
    initializationFee: 25000,
    annualFee: 20000,
    monthlyFee: 0,
    requiresSponsorship: false,
    waitlistMonths: 0,
    prestigeBonus: 10,
    networkingBonus: 18,
    stressReduction: 8,
    tiers: [
      { tier: 'standard', additionalFee: 0, additionalPrestige: 0, perks: ['Track days', 'Tours', 'Social events'] },
      { tier: 'platinum', additionalFee: 15000, additionalPrestige: 5, perks: ['Factory visits', 'Launch events', 'Driving experiences'] }
    ],
    exclusivity: 55
  },
  
  // SOCIAL CLUBS
  {
    id: 'club_social_soho',
    type: 'social_club',
    name: 'Members\' Club',
    location: 'London / New York / LA',
    description: 'Creative industry social club',
    initializationFee: 3000,
    annualFee: 4000,
    monthlyFee: 0,
    requiresSponsorship: true,
    waitlistMonths: 6,
    prestigeBonus: 8,
    networkingBonus: 20,
    stressReduction: 8,
    tiers: [
      { tier: 'standard', additionalFee: 0, additionalPrestige: 0, perks: ['Club access', 'Events', 'Global houses'] }
    ],
    exclusivity: 50
  }
]

// ============================================
// LUXURY SERVICES CATALOG
// ============================================

export const LUXURY_SERVICES_CATALOG: LuxuryServiceCatalogEntry[] = [
  // SPA & WELLNESS
  {
    id: 'service_spa_basic',
    type: 'spa_wellness',
    name: 'In-Home Massage Service',
    description: 'Weekly massage therapy at your residence',
    tier: 'standard',
    monthlyFee: 2000,
    setupFee: 0,
    stressReduction: 10,
    prestigeBonus: 2,
    timeFreedPerWeek: 0,
    healthBonus: 5
  },
  {
    id: 'service_spa_premium',
    type: 'spa_wellness',
    name: 'Personal Wellness Program',
    description: 'Dedicated wellness team with massage, acupuncture, and meditation',
    tier: 'premium',
    monthlyFee: 8000,
    setupFee: 2000,
    stressReduction: 18,
    prestigeBonus: 5,
    timeFreedPerWeek: 0,
    healthBonus: 10
  },
  {
    id: 'service_spa_elite',
    type: 'spa_wellness',
    name: 'Elite Wellness Suite',
    description: 'Full-service spa team, nutrition, and longevity treatments',
    tier: 'elite',
    monthlyFee: 15000,
    setupFee: 10000,
    stressReduction: 25,
    prestigeBonus: 10,
    timeFreedPerWeek: 0,
    healthBonus: 15,
    minimumNetWorth: 10000000
  },
  
  // TRAVEL CONCIERGE
  {
    id: 'service_travel_basic',
    type: 'travel',
    name: 'Travel Concierge',
    description: 'Personal travel planning and booking service',
    tier: 'standard',
    monthlyFee: 500,
    setupFee: 0,
    stressReduction: 5,
    prestigeBonus: 1,
    timeFreedPerWeek: 3,
    healthBonus: 0
  },
  {
    id: 'service_travel_premium',
    type: 'travel',
    name: 'Luxury Travel Management',
    description: 'VIP access, private transfers, exclusive reservations',
    tier: 'premium',
    monthlyFee: 2500,
    setupFee: 1000,
    stressReduction: 10,
    prestigeBonus: 5,
    timeFreedPerWeek: 5,
    healthBonus: 0
  },
  {
    id: 'service_travel_elite',
    type: 'travel',
    name: 'Elite Travel Office',
    description: 'Dedicated team for seamless global travel with security coordination',
    tier: 'elite',
    monthlyFee: 5000,
    setupFee: 5000,
    stressReduction: 15,
    prestigeBonus: 10,
    timeFreedPerWeek: 8,
    healthBonus: 0,
    minimumNetWorth: 25000000
  },
  
  // PERSONAL CARE
  {
    id: 'service_stylist_basic',
    type: 'personal_care',
    name: 'Personal Stylist',
    description: 'Monthly wardrobe consultation and shopping',
    tier: 'standard',
    monthlyFee: 1000,
    setupFee: 500,
    stressReduction: 3,
    prestigeBonus: 5,
    timeFreedPerWeek: 2,
    healthBonus: 0
  },
  {
    id: 'service_stylist_premium',
    type: 'personal_care',
    name: 'Image Consultant',
    description: 'Full image management with stylist, grooming, and brand guidance',
    tier: 'premium',
    monthlyFee: 5000,
    setupFee: 2000,
    stressReduction: 8,
    prestigeBonus: 12,
    timeFreedPerWeek: 4,
    healthBonus: 0
  },
  {
    id: 'service_stylist_elite',
    type: 'personal_care',
    name: 'Celebrity Image Team',
    description: 'Dedicated team including stylist, makeup artist, and grooming specialist',
    tier: 'elite',
    monthlyFee: 10000,
    setupFee: 5000,
    stressReduction: 12,
    prestigeBonus: 18,
    timeFreedPerWeek: 6,
    healthBonus: 0,
    minimumNetWorth: 20000000
  },
  
  // SECURITY
  {
    id: 'service_security_basic',
    type: 'security',
    name: 'Personal Security Consultant',
    description: 'Security assessment and travel advisories',
    tier: 'standard',
    monthlyFee: 3000,
    setupFee: 2000,
    stressReduction: 8,
    prestigeBonus: 3,
    timeFreedPerWeek: 0,
    healthBonus: 0
  },
  {
    id: 'service_security_premium',
    type: 'security',
    name: 'Close Protection Team',
    description: '24/7 personal security detail',
    tier: 'premium',
    monthlyFee: 15000,
    setupFee: 10000,
    stressReduction: 15,
    prestigeBonus: 8,
    timeFreedPerWeek: 0,
    healthBonus: 0,
    minimumNetWorth: 25000000
  },
  {
    id: 'service_security_elite',
    type: 'security',
    name: 'Executive Protection Division',
    description: 'Full security team with advance personnel and crisis management',
    tier: 'elite',
    monthlyFee: 30000,
    setupFee: 25000,
    stressReduction: 22,
    prestigeBonus: 15,
    timeFreedPerWeek: 0,
    healthBonus: 5,
    minimumNetWorth: 100000000
  },
  
  // MEDICAL CONCIERGE
  {
    id: 'service_medical_basic',
    type: 'medical',
    name: 'Concierge Medicine',
    description: 'Direct access to personal physician',
    tier: 'standard',
    monthlyFee: 2000,
    setupFee: 1000,
    stressReduction: 5,
    prestigeBonus: 2,
    timeFreedPerWeek: 1,
    healthBonus: 8
  },
  {
    id: 'service_medical_premium',
    type: 'medical',
    name: 'Executive Health Program',
    description: 'Comprehensive health monitoring with specialist access',
    tier: 'premium',
    monthlyFee: 8000,
    setupFee: 5000,
    stressReduction: 10,
    prestigeBonus: 5,
    timeFreedPerWeek: 2,
    healthBonus: 12
  },
  {
    id: 'service_medical_elite',
    type: 'medical',
    name: 'Private Medical Team',
    description: 'On-call physician, nurse, and global medical evacuation',
    tier: 'elite',
    monthlyFee: 20000,
    setupFee: 15000,
    stressReduction: 18,
    prestigeBonus: 10,
    timeFreedPerWeek: 3,
    healthBonus: 15,
    minimumNetWorth: 50000000
  }
]

// ============================================
// EXPERIENCES CATALOG
// ============================================

export const EXPERIENCES_CATALOG: ExperienceCatalogEntry[] = [
  // VACATIONS
  {
    id: 'exp_vacation_resort',
    type: 'vacation',
    name: 'Luxury Resort Retreat',
    description: 'Week at a 5-star resort with spa and fine dining',
    location: 'Maldives / Bora Bora',
    cost: 25000,
    duration: '1 week',
    durationWeeks: 1,
    stressReduction: 30,
    networkingBonus: 5,
    prestigeBonus: 5,
    happinessBoost: 25,
    cooldownWeeks: 8,
    seasonalAvailability: 'all'
  },
  {
    id: 'exp_vacation_villa',
    type: 'vacation',
    name: 'Private Villa Escape',
    description: 'Exclusive villa with full staff and chef',
    location: 'Tuscany / Provence / Caribbean',
    cost: 75000,
    duration: '2 weeks',
    durationWeeks: 2,
    stressReduction: 40,
    networkingBonus: 8,
    prestigeBonus: 10,
    happinessBoost: 30,
    cooldownWeeks: 12,
    seasonalAvailability: 'all'
  },
  {
    id: 'exp_vacation_safari',
    type: 'adventure',
    name: 'Luxury Safari',
    description: 'Private safari experience with exclusive lodges',
    location: 'Kenya / Tanzania / Botswana',
    cost: 50000,
    duration: '10 days',
    durationWeeks: 2,
    stressReduction: 35,
    networkingBonus: 10,
    prestigeBonus: 12,
    happinessBoost: 28,
    cooldownWeeks: 24,
    seasonalAvailability: 'all'
  },
  {
    id: 'exp_vacation_ski',
    type: 'vacation',
    name: 'Elite Ski Experience',
    description: 'Private chalet with heli-skiing and après-ski',
    location: 'Aspen / St. Moritz / Courchevel',
    cost: 100000,
    duration: '1 week',
    durationWeeks: 1,
    stressReduction: 28,
    networkingBonus: 15,
    prestigeBonus: 15,
    happinessBoost: 25,
    cooldownWeeks: 26,
    seasonalAvailability: 'winter',
    minimumNetWorth: 10000000
  },
  
  // CHARTERS
  {
    id: 'exp_charter_jet_weekend',
    type: 'charter',
    name: 'Private Jet Weekend',
    description: 'Round-trip private jet to destination of choice',
    location: 'Anywhere',
    cost: 50000,
    duration: '3 days',
    durationWeeks: 0,
    stressReduction: 20,
    networkingBonus: 8,
    prestigeBonus: 15,
    happinessBoost: 20,
    cooldownWeeks: 4
  },
  {
    id: 'exp_charter_yacht_week',
    type: 'charter',
    name: 'Yacht Charter',
    description: 'Private yacht with crew in Mediterranean or Caribbean',
    location: 'Mediterranean / Caribbean',
    cost: 150000,
    duration: '1 week',
    durationWeeks: 1,
    stressReduction: 38,
    networkingBonus: 20,
    prestigeBonus: 20,
    happinessBoost: 30,
    cooldownWeeks: 12,
    minimumNetWorth: 10000000
  },
  {
    id: 'exp_charter_superyacht',
    type: 'charter',
    name: 'Superyacht Experience',
    description: 'Superyacht charter with helicopter and submarine',
    location: 'Global',
    cost: 500000,
    duration: '2 weeks',
    durationWeeks: 2,
    stressReduction: 40,
    networkingBonus: 30,
    prestigeBonus: 25,
    happinessBoost: 35,
    cooldownWeeks: 26,
    minimumNetWorth: 50000000
  },
  
  // EXCLUSIVE EVENTS
  {
    id: 'exp_event_f1',
    type: 'event',
    name: 'F1 Paddock Experience',
    description: 'VIP paddock access with team hospitality',
    location: 'Monaco / Abu Dhabi / Silverstone',
    cost: 50000,
    duration: '3 days',
    durationWeeks: 0,
    stressReduction: 15,
    networkingBonus: 25,
    prestigeBonus: 18,
    happinessBoost: 22,
    cooldownWeeks: 26
  },
  {
    id: 'exp_event_superbowl',
    type: 'event',
    name: 'Super Bowl VIP',
    description: 'Premium suite with exclusive pre-game party',
    location: 'USA',
    cost: 75000,
    duration: '2 days',
    durationWeeks: 0,
    stressReduction: 12,
    networkingBonus: 20,
    prestigeBonus: 15,
    happinessBoost: 25,
    cooldownWeeks: 52,
    seasonalAvailability: 'winter'
  },
  {
    id: 'exp_event_gala',
    type: 'exclusive_access',
    name: 'Elite Charity Gala',
    description: 'Table at prestigious charity event (Met Gala, amfAR)',
    location: 'New York / Cannes',
    cost: 250000,
    duration: '1 evening',
    durationWeeks: 0,
    stressReduction: 5,
    networkingBonus: 30,
    prestigeBonus: 22,
    happinessBoost: 15,
    cooldownWeeks: 52,
    minimumNetWorth: 25000000
  },
  {
    id: 'exp_event_auction',
    type: 'exclusive_access',
    name: 'Art Basel VIP',
    description: 'Private previews and exclusive collector events',
    location: 'Miami / Basel / Hong Kong',
    cost: 100000,
    duration: '4 days',
    durationWeeks: 1,
    stressReduction: 10,
    networkingBonus: 25,
    prestigeBonus: 18,
    happinessBoost: 18,
    cooldownWeeks: 26,
    minimumNetWorth: 10000000
  },
  
  // ADVENTURES
  {
    id: 'exp_adventure_everest',
    type: 'adventure',
    name: 'Everest Base Camp Luxury',
    description: 'Helicopter-supported trek with luxury camping',
    location: 'Nepal',
    cost: 80000,
    duration: '2 weeks',
    durationWeeks: 2,
    stressReduction: 25,
    networkingBonus: 8,
    prestigeBonus: 15,
    happinessBoost: 30,
    cooldownWeeks: 52
  },
  {
    id: 'exp_adventure_space',
    type: 'adventure',
    name: 'Space Tourism Experience',
    description: 'Suborbital spaceflight experience',
    location: 'Space',
    cost: 450000,
    duration: '3 days',
    durationWeeks: 0,
    stressReduction: 10,
    networkingBonus: 25,
    prestigeBonus: 30,
    happinessBoost: 35,
    cooldownWeeks: 52,
    minimumNetWorth: 100000000
  }
]

// ============================================
// COLLECTIBLES CATALOG
// ============================================

export const COLLECTIBLES_CATALOG: CollectibleCatalogEntry[] = [
  // WATCHES
  {
    id: 'col_watch_rolex',
    category: 'watches',
    rarity: 'common',
    name: 'Rolex Submariner',
    description: 'Iconic diving watch, excellent investment piece',
    basePrice: 15000,
    priceVariance: 0.1,
    appreciationRate: 0.05,
    insuranceRate: 0.01,
    storageCost: 50,
    prestigeBonus: 5
  },
  {
    id: 'col_watch_patek_basic',
    category: 'watches',
    rarity: 'uncommon',
    name: 'Patek Philippe Calatrava',
    description: 'Classic dress watch from the king of watchmaking',
    basePrice: 35000,
    priceVariance: 0.1,
    appreciationRate: 0.06,
    insuranceRate: 0.01,
    storageCost: 75,
    prestigeBonus: 10
  },
  {
    id: 'col_watch_patek_nautilus',
    category: 'watches',
    rarity: 'rare',
    name: 'Patek Philippe Nautilus',
    description: 'Highly sought-after sports luxury watch',
    basePrice: 150000,
    priceVariance: 0.15,
    appreciationRate: 0.10,
    insuranceRate: 0.012,
    storageCost: 100,
    prestigeBonus: 18,
    minimumNetWorth: 5000000
  },
  {
    id: 'col_watch_richard_mille',
    category: 'watches',
    rarity: 'legendary',
    name: 'Richard Mille RM 011',
    description: 'Ultra-luxury sports watch worn by celebrities',
    basePrice: 500000,
    priceVariance: 0.2,
    appreciationRate: 0.08,
    insuranceRate: 0.015,
    storageCost: 150,
    prestigeBonus: 25,
    minimumNetWorth: 25000000,
    requiresConnection: true
  },
  
  // WINE
  {
    id: 'col_wine_bordeaux',
    category: 'wine',
    rarity: 'common',
    name: 'First Growth Bordeaux Case',
    description: 'Case of premier cru Bordeaux vintages',
    basePrice: 5000,
    priceVariance: 0.15,
    appreciationRate: 0.04,
    insuranceRate: 0.005,
    storageCost: 100,
    prestigeBonus: 3
  },
  {
    id: 'col_wine_burgundy',
    category: 'wine',
    rarity: 'uncommon',
    name: 'Grand Cru Burgundy Collection',
    description: 'Selection of premium Burgundy wines',
    basePrice: 25000,
    priceVariance: 0.2,
    appreciationRate: 0.06,
    insuranceRate: 0.005,
    storageCost: 150,
    prestigeBonus: 8
  },
  {
    id: 'col_wine_drc',
    category: 'wine',
    rarity: 'rare',
    name: 'Domaine de la Romanée-Conti',
    description: 'Legendary Burgundy producer, liquid gold',
    basePrice: 150000,
    priceVariance: 0.25,
    appreciationRate: 0.12,
    insuranceRate: 0.008,
    storageCost: 200,
    prestigeBonus: 18,
    minimumNetWorth: 10000000
  },
  {
    id: 'col_wine_cellar',
    category: 'wine',
    rarity: 'legendary',
    name: 'Legendary Cellar Collection',
    description: 'Museum-quality collection of historic vintages',
    basePrice: 500000,
    priceVariance: 0.3,
    appreciationRate: 0.08,
    insuranceRate: 0.01,
    storageCost: 500,
    prestigeBonus: 25,
    minimumNetWorth: 50000000,
    requiresConnection: true
  },
  
  // ART
  {
    id: 'col_art_emerging',
    category: 'art',
    rarity: 'common',
    name: 'Emerging Artist Work',
    description: 'Original piece from promising contemporary artist',
    basePrice: 15000,
    priceVariance: 0.4,
    appreciationRate: 0.08,
    insuranceRate: 0.01,
    storageCost: 100,
    prestigeBonus: 5
  },
  {
    id: 'col_art_established',
    category: 'art',
    rarity: 'uncommon',
    name: 'Established Artist Painting',
    description: 'Work by recognized contemporary artist',
    basePrice: 100000,
    priceVariance: 0.3,
    appreciationRate: 0.06,
    insuranceRate: 0.012,
    storageCost: 200,
    prestigeBonus: 12
  },
  {
    id: 'col_art_master',
    category: 'art',
    rarity: 'rare',
    name: 'Modern Master Work',
    description: 'Piece by renowned 20th century master',
    basePrice: 1000000,
    priceVariance: 0.25,
    appreciationRate: 0.05,
    insuranceRate: 0.015,
    storageCost: 500,
    prestigeBonus: 22,
    minimumNetWorth: 25000000
  },
  {
    id: 'col_art_museum',
    category: 'art',
    rarity: 'legendary',
    name: 'Museum-Quality Masterpiece',
    description: 'Historically significant work by legendary artist',
    basePrice: 10000000,
    priceVariance: 0.2,
    appreciationRate: 0.04,
    insuranceRate: 0.02,
    storageCost: 2000,
    prestigeBonus: 30,
    minimumNetWorth: 100000000,
    requiresConnection: true
  },
  
  // MEMORABILIA
  {
    id: 'col_memo_sports_signed',
    category: 'memorabilia',
    rarity: 'common',
    name: 'Signed Sports Jersey',
    description: 'Authenticated jersey from sports legend',
    basePrice: 10000,
    priceVariance: 0.3,
    appreciationRate: 0.03,
    insuranceRate: 0.008,
    storageCost: 50,
    prestigeBonus: 3
  },
  {
    id: 'col_memo_championship',
    category: 'memorabilia',
    rarity: 'uncommon',
    name: 'Championship Ring Collection',
    description: 'Authentic championship rings',
    basePrice: 50000,
    priceVariance: 0.25,
    appreciationRate: 0.04,
    insuranceRate: 0.01,
    storageCost: 75,
    prestigeBonus: 8
  },
  {
    id: 'col_memo_historic',
    category: 'memorabilia',
    rarity: 'rare',
    name: 'Historic Sports Artifact',
    description: 'Game-used item from legendary moment',
    basePrice: 250000,
    priceVariance: 0.35,
    appreciationRate: 0.05,
    insuranceRate: 0.012,
    storageCost: 150,
    prestigeBonus: 15,
    minimumNetWorth: 10000000
  },
  
  // JEWELRY
  {
    id: 'col_jewelry_diamond',
    category: 'jewelry',
    rarity: 'uncommon',
    name: 'Investment Diamond',
    description: 'Certified investment-grade diamond',
    basePrice: 50000,
    priceVariance: 0.15,
    appreciationRate: 0.02,
    insuranceRate: 0.015,
    storageCost: 100,
    prestigeBonus: 10
  },
  {
    id: 'col_jewelry_colored',
    category: 'jewelry',
    rarity: 'rare',
    name: 'Fancy Colored Diamond',
    description: 'Rare colored diamond, highly collectible',
    basePrice: 500000,
    priceVariance: 0.2,
    appreciationRate: 0.05,
    insuranceRate: 0.018,
    storageCost: 200,
    prestigeBonus: 20,
    minimumNetWorth: 25000000
  },
  {
    id: 'col_jewelry_royal',
    category: 'jewelry',
    rarity: 'legendary',
    name: 'Historic Royal Jewelry',
    description: 'Piece with royal or celebrity provenance',
    basePrice: 5000000,
    priceVariance: 0.25,
    appreciationRate: 0.04,
    insuranceRate: 0.02,
    storageCost: 500,
    prestigeBonus: 28,
    minimumNetWorth: 100000000,
    requiresConnection: true
  },
  
  // RARE ITEMS
  {
    id: 'col_rare_book',
    category: 'rare_items',
    rarity: 'uncommon',
    name: 'Rare First Edition',
    description: 'First edition of significant literary work',
    basePrice: 25000,
    priceVariance: 0.3,
    appreciationRate: 0.03,
    insuranceRate: 0.008,
    storageCost: 50,
    prestigeBonus: 5
  },
  {
    id: 'col_rare_coin',
    category: 'rare_items',
    rarity: 'rare',
    name: 'Historic Coin Collection',
    description: 'Rare and ancient coins',
    basePrice: 100000,
    priceVariance: 0.2,
    appreciationRate: 0.04,
    insuranceRate: 0.01,
    storageCost: 75,
    prestigeBonus: 10
  },
  {
    id: 'col_rare_artifact',
    category: 'rare_items',
    rarity: 'legendary',
    name: 'Ancient Artifact',
    description: 'Legally acquired historical artifact',
    basePrice: 1000000,
    priceVariance: 0.35,
    appreciationRate: 0.03,
    insuranceRate: 0.015,
    storageCost: 300,
    prestigeBonus: 22,
    minimumNetWorth: 50000000,
    requiresConnection: true
  }
]

// ============================================
// LIFESTYLE SCORE CALCULATION
// ============================================

export const LIFESTYLE_SCORE_WEIGHTS = {
  // Housing - from real estate (0-30 points)
  housing: {
    maxPoints: 30,
    thresholds: [
      { minValue: 0, points: 0 },
      { minValue: 500000, points: 5 },
      { minValue: 1000000, points: 10 },
      { minValue: 3000000, points: 15 },
      { minValue: 10000000, points: 22 },
      { minValue: 50000000, points: 30 }
    ]
  },
  
  // Vehicles (0-20 points)
  vehicles: {
    maxPoints: 20,
    thresholds: [
      { minValue: 0, points: 0 },
      { minValue: 50000, points: 3 },
      { minValue: 150000, points: 6 },
      { minValue: 400000, points: 10 },
      { minValue: 1000000, points: 14 },
      { minValue: 3000000, points: 20 }
    ]
  },
  
  // Collections (0-15 points)
  collections: {
    maxPoints: 15,
    thresholds: [
      { minValue: 0, points: 0 },
      { minValue: 50000, points: 2 },
      { minValue: 250000, points: 5 },
      { minValue: 1000000, points: 9 },
      { minValue: 5000000, points: 12 },
      { minValue: 20000000, points: 15 }
    ]
  },
  
  // Furnishings (0-10 points)
  furnishings: {
    maxPoints: 10,
    tierPoints: {
      basic: 1,
      quality: 3,
      designer: 5,
      luxury: 8,
      bespoke: 10
    }
  },
  
  // Memberships (0-10 points)
  memberships: {
    maxPoints: 10,
    perMembershipBase: 2,
    exclusivityBonus: 0.05  // Points per exclusivity point
  },
  
  // Staff (0-10 points)
  staff: {
    maxPoints: 10,
    perStaffMember: 1.5,
    qualityBonus: 0.02     // Per competence point
  },
  
  // Hobbies (0-5 points)
  hobbies: {
    maxPoints: 5,
    perHobby: 1,
    prestigeBonus: 0.03
  }
}

// Score to Level mapping
export const LIFESTYLE_LEVEL_THRESHOLDS: { minScore: number; level: LifestyleLevel }[] = [
  { minScore: 0, level: 'frugal' },
  { minScore: 16, level: 'modest' },
  { minScore: 31, level: 'comfortable' },
  { minScore: 51, level: 'affluent' },
  { minScore: 71, level: 'luxury' },
  { minScore: 86, level: 'ultra_luxury' }
]

// ============================================
// LIFESTYLE SCORE BREAKDOWN
// ============================================

export interface LifestyleScoreBreakdown {
  housing: number
  vehicles: number
  collections: number
  furnishings: number
  memberships: number
  staff: number
  hobbies: number
  total: number
  level: LifestyleLevel
}

// ============================================
// VEHICLE MAINTENANCE COSTS
// ============================================

export const VEHICLE_MAINTENANCE_RATES: Record<string, number> = {
  // Annual maintenance as % of vehicle value
  sports_car: 0.03,       // 3%
  supercar: 0.05,         // 5%
  hypercar: 0.08,         // 8%
  luxury_sedan: 0.025,    // 2.5%
  suv: 0.02,              // 2%
  classic_car: 0.06,      // 6%
  motorcycle: 0.04,       // 4%
  boat: 0.10,             // 10% - boats are expensive
  yacht: 0.08,            // 8% - crew, docking, etc.
  superyacht: 0.10,       // 10% - massive crew and costs
  helicopter: 0.15,       // 15% - high maintenance
  light_jet: 0.12,        // 12% - regular inspections
  private_jet: 0.10       // 10% - professional maintenance
}

export const VEHICLE_INSURANCE_RATES: Record<string, number> = {
  // Annual insurance as % of vehicle value
  sports_car: 0.02,
  supercar: 0.03,
  hypercar: 0.04,
  luxury_sedan: 0.015,
  suv: 0.012,
  classic_car: 0.025,     // Agreed value policies
  motorcycle: 0.025,
  boat: 0.02,             // Hull insurance
  yacht: 0.015,           // Comprehensive coverage
  superyacht: 0.012,      // Lower % but massive value
  helicopter: 0.05,       // High risk
  light_jet: 0.03,        // Aviation insurance
  private_jet: 0.025      // Aviation insurance
}

export const VEHICLE_DEPRECIATION_RATES: Record<string, number> = {
  // Annual depreciation (negative for collectibles that appreciate)
  sports_car: 0.10,       // 10% per year
  supercar: 0.08,         // 8% per year (hold value better)
  hypercar: -0.05,        // Appreciate 5% per year
  luxury_sedan: 0.15,     // 15% per year
  suv: 0.12,              // 12% per year
  classic_car: -0.04,     // Appreciate 4% per year
  motorcycle: 0.08,       // 8% per year
  boat: 0.12,             // 12% per year
  yacht: 0.08,            // 8% per year
  superyacht: 0.05,       // 5% - hold value better
  helicopter: 0.10,       // 10% per year
  light_jet: 0.08,        // 8% per year
  private_jet: 0.06       // 6% - hold value well
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function createDefaultLifestyleAssets(): LifestyleAssets {
  return {
    vehicles: [],
    furnishings: [],
    memberships: [],
    services: [],
    experiences: [],
    collectibles: [],
    pets: [],
    wardrobe: [],
    dietPlan: null
  }
}

export function getLifestyleLevelFromScore(score: number): LifestyleLevel {
  // Find the highest threshold that the score meets
  for (let i = LIFESTYLE_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (score >= LIFESTYLE_LEVEL_THRESHOLDS[i].minScore) {
      return LIFESTYLE_LEVEL_THRESHOLDS[i].level
    }
  }
  return 'frugal'
}

export function getFurnishingTierValue(tier: FurnishingTier): number {
  return LIFESTYLE_SCORE_WEIGHTS.furnishings.tierPoints[tier] || 0
}

export function getMembershipById(id: string): MembershipCatalogEntry | undefined {
  return MEMBERSHIP_CATALOG.find(m => m.id === id)
}

export function getFurnishingById(id: string): FurnishingCatalogEntry | undefined {
  return FURNISHING_CATALOG.find(f => f.id === id)
}

export function calculateVehicleMaintenanceCost(vehicle: OwnedVehicle): number {
  const maintenanceRate = VEHICLE_MAINTENANCE_RATES[vehicle.type] || 0.03
  const insuranceRate = VEHICLE_INSURANCE_RATES[vehicle.type] || 0.02
  
  const annualMaintenance = vehicle.currentValue * maintenanceRate
  const annualInsurance = vehicle.currentValue * insuranceRate
  
  // Return monthly cost
  return Math.round((annualMaintenance + annualInsurance) / 12)
}

export function calculateTotalMonthlyCosts(assets: LifestyleAssets): {
  vehicles: number
  furnishings: number
  memberships: number
  services: number
  collectibles: number
  total: number
} {
  const vehicleCosts = assets.vehicles.reduce((sum, v) => 
    sum + v.monthlyMaintenanceCost + v.monthlyInsuranceCost, 0
  )
  
  const furnishingCosts = 0  // Depreciation, not direct cost
  
  const membershipCosts = assets.memberships.reduce((sum, m) => 
    sum + m.monthlyFee + (m.annualFee / 12), 0
  )
  
  const serviceCosts = assets.services.reduce((sum, s) => 
    sum + s.monthlyFee, 0
  )
  
  const collectibleCosts = assets.collectibles.reduce((sum, c) => 
    sum + c.monthlyInsuranceCost + c.monthlyStorageCost, 0
  )
  
  return {
    vehicles: Math.round(vehicleCosts),
    furnishings: furnishingCosts,
    memberships: Math.round(membershipCosts),
    services: Math.round(serviceCosts),
    collectibles: Math.round(collectibleCosts),
    total: Math.round(vehicleCosts + membershipCosts + serviceCosts + collectibleCosts)
  }
}

// ============================================
// HELPER FUNCTIONS - SERVICES
// ============================================

export function getServiceById(id: string): LuxuryServiceCatalogEntry | undefined {
  return LUXURY_SERVICES_CATALOG.find(s => s.id === id)
}

export function getServicesByType(type: LuxuryServiceType): LuxuryServiceCatalogEntry[] {
  return LUXURY_SERVICES_CATALOG.filter(s => s.type === type)
}

// ============================================
// HELPER FUNCTIONS - EXPERIENCES
// ============================================

export function getExperienceById(id: string): ExperienceCatalogEntry | undefined {
  return EXPERIENCES_CATALOG.find(e => e.id === id)
}

export function getExperiencesByType(type: ExperienceType): ExperienceCatalogEntry[] {
  return EXPERIENCES_CATALOG.filter(e => e.type === type)
}

export function getAvailableExperiences(
  netWorth: number, 
  currentWeek: number,
  activeExperiences: LuxuryExperience[]
): ExperienceCatalogEntry[] {
  return EXPERIENCES_CATALOG.filter(exp => {
    // Check net worth requirement
    if (exp.minimumNetWorth && netWorth < exp.minimumNetWorth) return false
    
    // Check if on cooldown
    const owned = activeExperiences.find(e => e.experienceId === exp.id)
    if (owned?.cooldownUntilWeek && currentWeek < owned.cooldownUntilWeek) return false
    
    return true
  })
}

// ============================================
// HELPER FUNCTIONS - COLLECTIBLES
// ============================================

export function getCollectibleById(id: string): CollectibleCatalogEntry | undefined {
  return COLLECTIBLES_CATALOG.find(c => c.id === id)
}

export function getCollectiblesByCategory(category: CollectibleCategory): CollectibleCatalogEntry[] {
  return COLLECTIBLES_CATALOG.filter(c => c.category === category)
}

export function getAvailableCollectibles(
  netWorth: number,
  networkingLevel: number = 0
): CollectibleCatalogEntry[] {
  return COLLECTIBLES_CATALOG.filter(col => {
    // Check net worth requirement
    if (col.minimumNetWorth && netWorth < col.minimumNetWorth) return false
    
    // Check connection requirement (networking level 75+ for connection-required items)
    if (col.requiresConnection && networkingLevel < 75) return false
    
    return true
  })
}

export function calculateCollectiblePurchasePrice(catalogEntry: CollectibleCatalogEntry): number {
  const variance = catalogEntry.priceVariance
  const multiplier = 1 + (Math.random() * variance * 2 - variance)
  return Math.round(catalogEntry.basePrice * multiplier)
}

export function calculateTotalCollectiblesValue(collectibles: Collectible[]): number {
  return collectibles.reduce((sum, c) => sum + c.currentValue, 0)
}

export function calculateTotalServicesMonthly(services: LuxuryService[]): number {
  return services.reduce((sum, s) => sum + s.monthlyFee, 0)
}
