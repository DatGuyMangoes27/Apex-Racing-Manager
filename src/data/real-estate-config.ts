// ============================================
// REAL ESTATE CONFIGURATION
// ============================================
// Configuration for personal property ownership including
// primary residences, investment properties, and commercial real estate.

import type { Country } from './personal-finance-config'

// ============================================
// PROPERTY TYPES
// ============================================

export type PropertyType = 
  | 'apartment'       // Urban living, lower maintenance
  | 'house'           // Suburban family home
  | 'villa'           // Luxury residence
  | 'mansion'         // Ultra-luxury estate
  | 'penthouse'       // Top-floor luxury apartment
  | 'beach_house'     // Vacation property
  | 'ski_chalet'      // Mountain retreat
  | 'commercial'      // Business property (shops, offices)
  | 'land'            // Undeveloped land for appreciation

export type PropertyStatus = 
  | 'primary_residence'   // Where you live
  | 'vacation_home'       // Second home for personal use
  | 'rental'              // Income-generating rental
  | 'vacant'              // Owned but unused
  | 'under_renovation'    // Being upgraded
  | 'for_sale'            // Listed for sale

// ============================================
// PROPERTY INTERFACE
// ============================================

export interface Property {
  id: string
  name: string
  type: PropertyType
  status: PropertyStatus
  
  // Location
  country: Country
  city: string
  neighborhood: string    // e.g., "Monaco - Monte Carlo", "London - Mayfair"
  
  // Value
  purchasePrice: number
  purchaseDate: { week: number; year: number }
  currentValue: number
  lastValuationDate: { week: number; year: number }
  appreciationRate: number  // Annual rate, varies by location
  
  // Costs
  monthlyMaintenance: number
  annualPropertyTax: number
  insuranceCost: number
  
  // Mortgage (if any)
  mortgageId?: string
  
  // Rental (if status is 'rental')
  rental?: PropertyRental
  
  // Renovation
  renovation?: PropertyRenovation
  
  // Features and perks
  features: PropertyFeature[]
  perks: PropertyPerk[]
  
  // Quality and condition
  quality: PropertyQuality
  condition: number       // 0-100, degrades over time without maintenance
  
  // Size
  squareMeters: number
  bedrooms: number
  bathrooms: number
  garageSpaces: number
}

export interface PropertyRental {
  isRented: boolean
  monthlyRent: number
  tenantQuality: 'excellent' | 'good' | 'average' | 'problematic'
  leaseStartDate?: { week: number; year: number }
  leaseEndDate?: { week: number; year: number }
  occupancyRate: number     // Historical occupancy %
  managementFee: number     // % of rent for property management
  lastMaintenanceRequest?: { week: number; year: number; cost: number }
}

export interface PropertyRenovation {
  type: RenovationType
  startDate: { week: number; year: number }
  completionDate: { week: number; year: number }
  cost: number
  valueIncrease: number     // How much it adds to property value
  qualityUpgrade?: PropertyQuality
  inProgress: boolean
}

export type RenovationType = 
  | 'basic_refresh'       // Paint, minor fixes
  | 'kitchen_upgrade'     // Modern kitchen
  | 'bathroom_upgrade'    // Luxury bathrooms
  | 'full_renovation'     // Complete overhaul
  | 'luxury_conversion'   // Convert to higher tier
  | 'extension'           // Add space
  | 'smart_home'          // Technology upgrades
  | 'eco_upgrade'         // Energy efficiency

export type PropertyFeature = 
  | 'pool'
  | 'gym'
  | 'home_cinema'
  | 'wine_cellar'
  | 'spa'
  | 'tennis_court'
  | 'helipad'
  | 'boat_dock'
  | 'racing_simulator'
  | 'car_collection_garage'
  | 'staff_quarters'
  | 'security_system'
  | 'smart_home'
  | 'solar_panels'
  | 'garden'
  | 'rooftop_terrace'
  | 'private_elevator'
  | 'concierge'

export type PropertyQuality = 
  | 'basic'           // Standard quality
  | 'good'            // Above average
  | 'premium'         // High quality
  | 'luxury'          // Luxury finishes
  | 'ultra_luxury'    // The best money can buy

// ============================================
// PROPERTY PERKS
// ============================================

export interface PropertyPerk {
  type: PropertyPerkType
  value: number
  description: string
}

export type PropertyPerkType = 
  | 'reputation_bonus'        // Living in prestigious area
  | 'sponsor_attraction'      // Impressive address for meetings
  | 'staff_discount'          // Easier staff recruitment
  | 'family_happiness'        // Better for family life
  | 'stress_reduction'        // Relaxing environment
  | 'networking'              // Neighbors are influential
  | 'media_appeal'            // Good for photoshoots
  | 'privacy'                 // Away from paparazzi
  | 'tax_benefit'             // Location-based tax advantages

// ============================================
// LOCATION-BASED PROPERTY DATA
// ============================================

export interface LocationPropertyMarket {
  country: Country
  city: string
  neighborhoods: NeighborhoodData[]
  averageAppreciation: number   // Annual %
  rentalYield: number           // Annual % of property value
  propertyTaxRate: number       // Annual % of property value
  marketHeat: 'cold' | 'normal' | 'hot' | 'bubble'  // Affects appreciation
}

export interface NeighborhoodData {
  name: string
  prestige: 'modest' | 'middle_class' | 'affluent' | 'prestigious' | 'ultra_elite'
  priceMultiplier: number       // Relative to city average
  rentalDemand: 'low' | 'medium' | 'high' | 'very_high'
  perks: PropertyPerk[]
  availableTypes: PropertyType[]
  description: string
}

// ============================================
// PROPERTY MARKET DATA
// ============================================

export const PROPERTY_MARKETS: LocationPropertyMarket[] = [
  {
    country: 'Monaco',
    city: 'Monaco',
    averageAppreciation: 0.03,
    rentalYield: 0.025,
    propertyTaxRate: 0,
    marketHeat: 'hot',
    neighborhoods: [
      {
        name: 'Monte Carlo',
        prestige: 'ultra_elite',
        priceMultiplier: 1.5,
        rentalDemand: 'very_high',
        perks: [
          { type: 'reputation_bonus', value: 30, description: 'The most prestigious address in racing' },
          { type: 'sponsor_attraction', value: 25, description: 'Sponsors love Monaco meetings' },
          { type: 'networking', value: 30, description: 'Billionaire neighbors' },
          { type: 'tax_benefit', value: 100, description: 'No income tax' }
        ],
        availableTypes: ['penthouse', 'apartment', 'villa'],
        description: 'The heart of luxury living, home to racing royalty and billionaires'
      },
      {
        name: 'Fontvieille',
        prestige: 'prestigious',
        priceMultiplier: 0.8,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 20, description: 'Monaco address' },
          { type: 'tax_benefit', value: 100, description: 'No income tax' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'More residential area of Monaco, slightly more affordable'
      }
    ]
  },
  {
    country: 'United Kingdom',
    city: 'London',
    averageAppreciation: 0.04,
    rentalYield: 0.035,
    propertyTaxRate: 0.012,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Mayfair',
        prestige: 'ultra_elite',
        priceMultiplier: 2.0,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 25, description: 'Most exclusive London address' },
          { type: 'sponsor_attraction', value: 20, description: 'Prime location for business' },
          { type: 'networking', value: 25, description: 'Elite social circle' }
        ],
        availableTypes: ['apartment', 'penthouse', 'mansion'],
        description: 'The pinnacle of London luxury, home to aristocrats and tycoons'
      },
      {
        name: 'Chelsea',
        prestige: 'prestigious',
        priceMultiplier: 1.3,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 15, description: 'Fashionable address' },
          { type: 'family_happiness', value: 10, description: 'Good schools nearby' }
        ],
        availableTypes: ['house', 'apartment', 'mansion'],
        description: 'Affluent and fashionable, popular with celebrities and families'
      },
      {
        name: 'Surrey Countryside',
        prestige: 'affluent',
        priceMultiplier: 0.6,
        rentalDemand: 'medium',
        perks: [
          { type: 'family_happiness', value: 20, description: 'Space and nature for family' },
          { type: 'stress_reduction', value: 15, description: 'Peaceful countryside' },
          { type: 'privacy', value: 20, description: 'Away from city attention' }
        ],
        availableTypes: ['house', 'villa', 'mansion', 'land'],
        description: 'Motorsport Valley adjacent, many F1 team principals live here'
      }
    ]
  },
  {
    country: 'United States',
    city: 'Miami',
    averageAppreciation: 0.05,
    rentalYield: 0.045,
    propertyTaxRate: 0.02,
    marketHeat: 'hot',
    neighborhoods: [
      {
        name: 'Star Island',
        prestige: 'ultra_elite',
        priceMultiplier: 2.5,
        rentalDemand: 'medium',
        perks: [
          { type: 'reputation_bonus', value: 25, description: 'Celebrity island address' },
          { type: 'media_appeal', value: 30, description: 'Perfect for lifestyle content' },
          { type: 'privacy', value: 25, description: 'Gated island community' }
        ],
        availableTypes: ['mansion', 'villa'],
        description: 'Exclusive island home to celebrities and sports stars'
      },
      {
        name: 'Brickell',
        prestige: 'affluent',
        priceMultiplier: 1.0,
        rentalDemand: 'very_high',
        perks: [
          { type: 'networking', value: 15, description: 'Business district connections' },
          { type: 'sponsor_attraction', value: 15, description: 'Central business location' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'Miami\'s financial district with stunning high-rises'
      }
    ]
  },
  {
    country: 'Italy',
    city: 'Milan',
    averageAppreciation: 0.025,
    rentalYield: 0.03,
    propertyTaxRate: 0.015,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Quadrilatero della Moda',
        prestige: 'ultra_elite',
        priceMultiplier: 2.0,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 20, description: 'Fashion district address' },
          { type: 'sponsor_attraction', value: 25, description: 'Luxury brand HQ proximity' },
          { type: 'media_appeal', value: 20, description: 'Fashion week proximity' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'The golden quadrangle of fashion, home to luxury brands'
      }
    ]
  },
  {
    country: 'Switzerland',
    city: 'Geneva',
    averageAppreciation: 0.02,
    rentalYield: 0.025,
    propertyTaxRate: 0.005,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Cologny',
        prestige: 'ultra_elite',
        priceMultiplier: 1.8,
        rentalDemand: 'medium',
        perks: [
          { type: 'tax_benefit', value: 50, description: 'Favorable Swiss taxation' },
          { type: 'privacy', value: 30, description: 'Discreet Swiss banking culture' },
          { type: 'networking', value: 20, description: 'Global elite neighbors' }
        ],
        availableTypes: ['villa', 'mansion'],
        description: 'Exclusive lakeside community, home to racing drivers and billionaires'
      }
    ]
  },
  {
    country: 'France',
    city: 'Nice',
    averageAppreciation: 0.03,
    rentalYield: 0.035,
    propertyTaxRate: 0.01,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Cap Ferrat',
        prestige: 'ultra_elite',
        priceMultiplier: 2.5,
        rentalDemand: 'medium',
        perks: [
          { type: 'reputation_bonus', value: 25, description: 'French Riviera prestige' },
          { type: 'stress_reduction', value: 25, description: 'Mediterranean paradise' },
          { type: 'privacy', value: 25, description: 'Secluded peninsula' }
        ],
        availableTypes: ['villa', 'mansion'],
        description: 'The most exclusive peninsula on the French Riviera'
      }
    ]
  },
  {
    country: 'Australia',
    city: 'Sydney',
    averageAppreciation: 0.04,
    rentalYield: 0.03,
    propertyTaxRate: 0.012,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Point Piper',
        prestige: 'ultra_elite',
        priceMultiplier: 2.0,
        rentalDemand: 'low',
        perks: [
          { type: 'reputation_bonus', value: 20, description: 'Australia\'s most expensive street' },
          { type: 'stress_reduction', value: 20, description: 'Harbour views' }
        ],
        availableTypes: ['mansion', 'villa'],
        description: 'Sydney\'s most exclusive waterfront suburb'
      }
    ]
  },
  {
    country: 'Japan',
    city: 'Tokyo',
    averageAppreciation: 0.015,
    rentalYield: 0.03,
    propertyTaxRate: 0.014,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Minato',
        prestige: 'prestigious',
        priceMultiplier: 1.5,
        rentalDemand: 'high',
        perks: [
          { type: 'networking', value: 15, description: 'Business district access' },
          { type: 'sponsor_attraction', value: 15, description: 'Japanese corporate HQs' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'Upscale district home to embassies and corporations'
      }
    ]
  }
]

// ============================================
// BASE PROPERTY PRICES
// ============================================

export interface PropertyPriceConfig {
  type: PropertyType
  basePriceRange: { min: number; max: number }  // Before location multiplier
  maintenancePercent: number    // Annual maintenance as % of value
  insurancePercent: number      // Annual insurance as % of value
  defaultBedrooms: { min: number; max: number }
  defaultBathrooms: { min: number; max: number }
  defaultSquareMeters: { min: number; max: number }
  availableFeatures: PropertyFeature[]
  qualityMultipliers: Record<PropertyQuality, number>
}

export const PROPERTY_PRICE_CONFIGS: Record<PropertyType, PropertyPriceConfig> = {
  apartment: {
    type: 'apartment',
    basePriceRange: { min: 200000, max: 800000 },
    maintenancePercent: 0.01,
    insurancePercent: 0.003,
    defaultBedrooms: { min: 1, max: 3 },
    defaultBathrooms: { min: 1, max: 2 },
    defaultSquareMeters: { min: 50, max: 150 },
    availableFeatures: ['gym', 'concierge', 'smart_home', 'security_system', 'rooftop_terrace'],
    qualityMultipliers: { basic: 0.8, good: 1.0, premium: 1.3, luxury: 1.8, ultra_luxury: 2.5 }
  },
  house: {
    type: 'house',
    basePriceRange: { min: 400000, max: 1500000 },
    maintenancePercent: 0.015,
    insurancePercent: 0.004,
    defaultBedrooms: { min: 3, max: 5 },
    defaultBathrooms: { min: 2, max: 4 },
    defaultSquareMeters: { min: 150, max: 400 },
    availableFeatures: ['pool', 'garden', 'gym', 'home_cinema', 'smart_home', 'security_system', 'racing_simulator'],
    qualityMultipliers: { basic: 0.8, good: 1.0, premium: 1.3, luxury: 1.7, ultra_luxury: 2.3 }
  },
  villa: {
    type: 'villa',
    basePriceRange: { min: 1500000, max: 5000000 },
    maintenancePercent: 0.02,
    insurancePercent: 0.005,
    defaultBedrooms: { min: 4, max: 7 },
    defaultBathrooms: { min: 3, max: 6 },
    defaultSquareMeters: { min: 300, max: 800 },
    availableFeatures: ['pool', 'spa', 'gym', 'home_cinema', 'wine_cellar', 'garden', 'staff_quarters', 'smart_home', 'security_system', 'racing_simulator', 'tennis_court'],
    qualityMultipliers: { basic: 0.7, good: 0.9, premium: 1.2, luxury: 1.6, ultra_luxury: 2.2 }
  },
  mansion: {
    type: 'mansion',
    basePriceRange: { min: 5000000, max: 25000000 },
    maintenancePercent: 0.025,
    insurancePercent: 0.006,
    defaultBedrooms: { min: 6, max: 15 },
    defaultBathrooms: { min: 5, max: 12 },
    defaultSquareMeters: { min: 600, max: 2000 },
    availableFeatures: ['pool', 'spa', 'gym', 'home_cinema', 'wine_cellar', 'tennis_court', 'helipad', 'car_collection_garage', 'staff_quarters', 'smart_home', 'security_system', 'racing_simulator', 'garden', 'private_elevator'],
    qualityMultipliers: { basic: 0.6, good: 0.8, premium: 1.1, luxury: 1.5, ultra_luxury: 2.0 }
  },
  penthouse: {
    type: 'penthouse',
    basePriceRange: { min: 2000000, max: 15000000 },
    maintenancePercent: 0.015,
    insurancePercent: 0.005,
    defaultBedrooms: { min: 3, max: 6 },
    defaultBathrooms: { min: 3, max: 5 },
    defaultSquareMeters: { min: 200, max: 600 },
    availableFeatures: ['pool', 'spa', 'gym', 'home_cinema', 'wine_cellar', 'rooftop_terrace', 'concierge', 'smart_home', 'security_system', 'private_elevator'],
    qualityMultipliers: { basic: 0.7, good: 0.9, premium: 1.2, luxury: 1.6, ultra_luxury: 2.2 }
  },
  beach_house: {
    type: 'beach_house',
    basePriceRange: { min: 800000, max: 4000000 },
    maintenancePercent: 0.02,
    insurancePercent: 0.008,  // Higher due to coastal risks
    defaultBedrooms: { min: 3, max: 6 },
    defaultBathrooms: { min: 2, max: 4 },
    defaultSquareMeters: { min: 150, max: 400 },
    availableFeatures: ['pool', 'boat_dock', 'garden', 'smart_home', 'security_system'],
    qualityMultipliers: { basic: 0.8, good: 1.0, premium: 1.3, luxury: 1.7, ultra_luxury: 2.3 }
  },
  ski_chalet: {
    type: 'ski_chalet',
    basePriceRange: { min: 1000000, max: 6000000 },
    maintenancePercent: 0.02,
    insurancePercent: 0.005,
    defaultBedrooms: { min: 4, max: 8 },
    defaultBathrooms: { min: 3, max: 6 },
    defaultSquareMeters: { min: 200, max: 500 },
    availableFeatures: ['spa', 'gym', 'home_cinema', 'wine_cellar', 'smart_home', 'security_system'],
    qualityMultipliers: { basic: 0.8, good: 1.0, premium: 1.3, luxury: 1.7, ultra_luxury: 2.3 }
  },
  commercial: {
    type: 'commercial',
    basePriceRange: { min: 500000, max: 10000000 },
    maintenancePercent: 0.01,
    insurancePercent: 0.004,
    defaultBedrooms: { min: 0, max: 0 },
    defaultBathrooms: { min: 1, max: 4 },
    defaultSquareMeters: { min: 100, max: 2000 },
    availableFeatures: ['security_system', 'smart_home'],
    qualityMultipliers: { basic: 0.8, good: 1.0, premium: 1.2, luxury: 1.5, ultra_luxury: 1.8 }
  },
  land: {
    type: 'land',
    basePriceRange: { min: 100000, max: 5000000 },
    maintenancePercent: 0.005,
    insurancePercent: 0.001,
    defaultBedrooms: { min: 0, max: 0 },
    defaultBathrooms: { min: 0, max: 0 },
    defaultSquareMeters: { min: 1000, max: 50000 },
    availableFeatures: [],
    qualityMultipliers: { basic: 1.0, good: 1.0, premium: 1.0, luxury: 1.0, ultra_luxury: 1.0 }
  }
}

// ============================================
// RENOVATION CONFIGS
// ============================================

export interface RenovationConfig {
  type: RenovationType
  name: string
  description: string
  costPercentOfValue: number    // Cost as % of current property value
  durationWeeks: number
  valueIncreasePercent: number  // How much it adds to value
  qualityUpgrade?: boolean      // Can upgrade quality level
  requiredMinQuality?: PropertyQuality  // Minimum quality to perform
}

export const RENOVATION_CONFIGS: Record<RenovationType, RenovationConfig> = {
  basic_refresh: {
    type: 'basic_refresh',
    name: 'Basic Refresh',
    description: 'Fresh paint, minor repairs, and cleaning',
    costPercentOfValue: 0.02,
    durationWeeks: 2,
    valueIncreasePercent: 0.03,
    qualityUpgrade: false
  },
  kitchen_upgrade: {
    type: 'kitchen_upgrade',
    name: 'Kitchen Upgrade',
    description: 'Modern kitchen with premium appliances',
    costPercentOfValue: 0.05,
    durationWeeks: 4,
    valueIncreasePercent: 0.07
  },
  bathroom_upgrade: {
    type: 'bathroom_upgrade',
    name: 'Bathroom Upgrade',
    description: 'Luxury bathroom finishes and fixtures',
    costPercentOfValue: 0.04,
    durationWeeks: 3,
    valueIncreasePercent: 0.05
  },
  full_renovation: {
    type: 'full_renovation',
    name: 'Full Renovation',
    description: 'Complete interior overhaul',
    costPercentOfValue: 0.15,
    durationWeeks: 12,
    valueIncreasePercent: 0.20,
    qualityUpgrade: true
  },
  luxury_conversion: {
    type: 'luxury_conversion',
    name: 'Luxury Conversion',
    description: 'Transform into ultra-luxury specification',
    costPercentOfValue: 0.25,
    durationWeeks: 20,
    valueIncreasePercent: 0.35,
    qualityUpgrade: true,
    requiredMinQuality: 'premium'
  },
  extension: {
    type: 'extension',
    name: 'Extension',
    description: 'Add additional living space',
    costPercentOfValue: 0.20,
    durationWeeks: 16,
    valueIncreasePercent: 0.25
  },
  smart_home: {
    type: 'smart_home',
    name: 'Smart Home Installation',
    description: 'Full home automation and technology',
    costPercentOfValue: 0.03,
    durationWeeks: 2,
    valueIncreasePercent: 0.04
  },
  eco_upgrade: {
    type: 'eco_upgrade',
    name: 'Eco Upgrade',
    description: 'Solar panels, insulation, and efficiency',
    costPercentOfValue: 0.06,
    durationWeeks: 4,
    valueIncreasePercent: 0.05
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function generatePropertyPrice(
  type: PropertyType,
  quality: PropertyQuality,
  locationMultiplier: number,
  marketHeat: 'cold' | 'normal' | 'hot' | 'bubble'
): number {
  const config = PROPERTY_PRICE_CONFIGS[type]
  
  // Random within base range
  const basePrice = config.basePriceRange.min + 
    Math.random() * (config.basePriceRange.max - config.basePriceRange.min)
  
  // Apply quality multiplier
  const qualityPrice = basePrice * config.qualityMultipliers[quality]
  
  // Apply location multiplier
  const locationPrice = qualityPrice * locationMultiplier
  
  // Apply market heat
  const heatMultipliers = { cold: 0.85, normal: 1.0, hot: 1.15, bubble: 1.35 }
  const finalPrice = locationPrice * heatMultipliers[marketHeat]
  
  // Round to nearest 10,000
  return Math.round(finalPrice / 10000) * 10000
}

export function calculatePropertyMaintenanceCost(property: Property): number {
  const config = PROPERTY_PRICE_CONFIGS[property.type]
  const annualMaintenance = property.currentValue * config.maintenancePercent
  
  // Condition affects maintenance (lower condition = higher maintenance)
  const conditionMultiplier = 1 + ((100 - property.condition) / 100) * 0.5
  
  return Math.round((annualMaintenance * conditionMultiplier) / 12)  // Monthly
}

export function calculatePropertyInsuranceCost(property: Property): number {
  const config = PROPERTY_PRICE_CONFIGS[property.type]
  return Math.round((property.currentValue * config.insurancePercent) / 12)  // Monthly
}

export function calculatePropertyTax(property: Property, market: LocationPropertyMarket): number {
  return Math.round((property.currentValue * market.propertyTaxRate) / 12)  // Monthly
}

export function calculateRentalIncome(property: Property): number {
  if (!property.rental || !property.rental.isRented) return 0
  
  const grossRent = property.rental.monthlyRent
  const managementFee = grossRent * property.rental.managementFee
  
  return Math.round(grossRent - managementFee)
}

export function estimateRentalValue(property: Property, market: LocationPropertyMarket): number {
  // Base rental is property value * rental yield / 12
  const baseMonthlyRent = (property.currentValue * market.rentalYield) / 12
  
  // Quality affects rental
  const qualityMultipliers: Record<PropertyQuality, number> = {
    basic: 0.8,
    good: 1.0,
    premium: 1.15,
    luxury: 1.3,
    ultra_luxury: 1.5
  }
  
  const adjustedRent = baseMonthlyRent * qualityMultipliers[property.quality]
  
  // Condition affects rental
  const conditionMultiplier = 0.8 + (property.condition / 100) * 0.2
  
  return Math.round(adjustedRent * conditionMultiplier)
}

export function updatePropertyValue(
  property: Property,
  market: LocationPropertyMarket,
  weeksElapsed: number
): number {
  // Weekly appreciation (convert annual to weekly)
  const weeklyAppreciation = market.averageAppreciation / 52
  
  // Apply over elapsed weeks
  const appreciationMultiplier = Math.pow(1 + weeklyAppreciation, weeksElapsed)
  
  // Condition affects value
  const conditionPenalty = property.condition < 50 
    ? 1 - ((50 - property.condition) / 100) * 0.2 
    : 1
  
  return Math.round(property.currentValue * appreciationMultiplier * conditionPenalty)
}

export function degradePropertyCondition(currentCondition: number, weeksElapsed: number): number {
  // Property degrades ~2% per year (0.04% per week)
  const degradation = weeksElapsed * 0.0004 * 100
  return Math.max(0, Math.round(currentCondition - degradation))
}

export function getMarketForProperty(country: Country, city: string): LocationPropertyMarket | undefined {
  return PROPERTY_MARKETS.find(m => m.country === country && m.city === city)
}

export function getNeighborhoodData(
  market: LocationPropertyMarket,
  neighborhoodName: string
): NeighborhoodData | undefined {
  return market.neighborhoods.find(n => n.name === neighborhoodName)
}

// ============================================
// PROPERTY LISTING GENERATION
// ============================================

export interface PropertyListing {
  property: Omit<Property, 'id' | 'purchaseDate' | 'lastValuationDate' | 'mortgageId' | 'rental' | 'renovation'>
  name: string
  askingPrice: number
  listPrice: number
  daysOnMarket: number
  sellerMotivation: 'normal' | 'motivated' | 'desperate'  // Affects negotiation
  negotiationRoom: number  // % below asking they'll accept
}

export function generatePropertyListing(
  country: Country,
  city: string,
  neighborhoodName: string,
  type: PropertyType,
  quality: PropertyQuality
): PropertyListing | null {
  const market = getMarketForProperty(country, city)
  if (!market) return null
  
  const neighborhood = getNeighborhoodData(market, neighborhoodName)
  if (!neighborhood) return null
  
  if (!neighborhood.availableTypes.includes(type)) return null
  
  const config = PROPERTY_PRICE_CONFIGS[type]
  
  // Generate property details
  const price = generatePropertyPrice(type, quality, neighborhood.priceMultiplier, market.marketHeat)
  
  const bedrooms = Math.floor(
    config.defaultBedrooms.min + 
    Math.random() * (config.defaultBedrooms.max - config.defaultBedrooms.min + 1)
  )
  const bathrooms = Math.floor(
    config.defaultBathrooms.min + 
    Math.random() * (config.defaultBathrooms.max - config.defaultBathrooms.min + 1)
  )
  const squareMeters = Math.floor(
    config.defaultSquareMeters.min + 
    Math.random() * (config.defaultSquareMeters.max - config.defaultSquareMeters.min)
  )
  
  // Random features from available
  const numFeatures = Math.floor(Math.random() * 4) + 1
  const features = config.availableFeatures
    .sort(() => Math.random() - 0.5)
    .slice(0, numFeatures)
  
  // Seller motivation
  const motivationRoll = Math.random()
  const sellerMotivation = motivationRoll < 0.1 ? 'desperate' : 
                          motivationRoll < 0.3 ? 'motivated' : 'normal'
  
  const negotiationRoom = sellerMotivation === 'desperate' ? 15 :
                         sellerMotivation === 'motivated' ? 8 : 3
  
  return {
    property: {
      name: `${neighborhood.name} ${type.replace('_', ' ')}`,
      type,
      status: 'vacant',
      country,
      city,
      neighborhood: neighborhoodName,
      purchasePrice: 0,  // Will be set on purchase
      currentValue: price,
      appreciationRate: market.averageAppreciation,
      monthlyMaintenance: Math.round((price * config.maintenancePercent) / 12),
      annualPropertyTax: Math.round(price * market.propertyTaxRate),
      insuranceCost: Math.round((price * config.insurancePercent) / 12),
      features,
      perks: neighborhood.perks,
      quality,
      condition: 85 + Math.floor(Math.random() * 15),  // 85-99
      squareMeters,
      bedrooms,
      bathrooms,
      garageSpaces: type === 'mansion' ? 4 : type === 'villa' ? 2 : type === 'house' ? 2 : 0
    },
    name: `${neighborhood.name} ${type.replace('_', ' ')}`,
    askingPrice: price,
    listPrice: price,
    daysOnMarket: Math.floor(Math.random() * 180),
    sellerMotivation,
    negotiationRoom
  }
}
