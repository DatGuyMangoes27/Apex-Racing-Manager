// ============================================
// COLLECTIONS SYSTEM CONFIGURATION
// ============================================
// Configuration for collectible cars, watches, art, wine, and memorabilia.

// ============================================
// COLLECTION TYPES
// ============================================

export type CollectionType = 
  | 'cars'
  | 'watches'
  | 'art'
  | 'wine'
  | 'memorabilia'

export type ItemRarity = 
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'very_rare'
  | 'legendary'

export type ItemCondition = 
  | 'poor'
  | 'fair'
  | 'good'
  | 'excellent'
  | 'mint'
  | 'concours'  // For cars - show quality

// ============================================
// COLLECTION INTERFACE
// ============================================

export interface Collection {
  id: string
  type: CollectionType
  name: string
  items: CollectionItem[]
  
  // Value
  totalPurchaseValue: number
  currentMarketValue: number
  appreciationRate: number      // Annual % change
  
  // Display
  displayLocation?: string      // Where you show it off
  hasShowroom: boolean
  showroomCost?: number
  
  // Insurance
  isInsured: boolean
  insuranceCost: number         // Annual
  insuranceProvider?: string
  
  // Social
  isPubliclyKnown: boolean      // Media knows about it
  hasBeenFeatured: boolean      // Featured in magazines
  visitorsAllowed: boolean      // Can host tours
  
  // Stats
  totalItemsOwned: number
  itemsSold: number
  totalProfitLoss: number
  
  // Started
  startDate: { week: number; year: number }
}

// ============================================
// COLLECTION ITEM INTERFACE
// ============================================

export interface CollectionItem {
  id: string
  collectionType: CollectionType
  name: string
  description: string
  
  // Acquisition
  purchasePrice: number
  purchaseDate: { week: number; year: number }
  acquiredFrom: string          // Auction house, dealer, gift
  
  // Value
  currentValue: number
  rarity: ItemRarity
  condition: ItemCondition
  lastAppraisalDate?: { week: number; year: number }
  
  // Details (type-specific)
  carDetails?: CarCollectionDetails
  watchDetails?: WatchCollectionDetails
  artDetails?: ArtCollectionDetails
  wineDetails?: WineCollectionDetails
  memorabiliaDetails?: MemorabiliaDetails
  
  // Social value
  conversationPiece: boolean    // Impressive to guests
  canLoanToMuseum: boolean
  mediaInterest: number         // 0-100, how much press cares
  
  // Status
  isOnDisplay: boolean
  isOnLoan: boolean
  loanedTo?: string
  loanIncome?: number
  
  // For sale
  isForSale: boolean
  askingPrice?: number
}

// ============================================
// CAR COLLECTION DETAILS
// ============================================

export interface CarCollectionDetails {
  make: string
  model: string
  year: number
  
  // Specs
  mileage: number
  engineType: string
  horsepower: number
  transmission: 'manual' | 'automatic' | 'sequential'
  color: string
  interiorColor: string
  
  // Condition
  isDriverable: boolean
  hasBeenRestored: boolean
  restorationCost?: number
  restorationYear?: number
  
  // History
  racingHistory?: string        // "Won Le Mans 1967"
  previousOwners: string[]
  celebrityOwned?: string       // Famous previous owner
  
  // Documentation
  hasOriginalDocuments: boolean
  matchingNumbers: boolean      // Original engine/chassis match
  certificateOfAuthenticity: boolean
  
  // Maintenance
  annualMaintenanceCost: number
  lastServiceDate?: { week: number; year: number }
  storageCost: number           // Annual climate-controlled storage
  
  // Events
  eligibleForConcours: boolean
  concoursWins: string[]
  ralliesParticipated: number
}

export interface CarCatalogEntry {
  make: string
  model: string
  yearRange: { min: number; max: number }
  basePrice: number
  rarity: ItemRarity
  appreciationRate: number
  historicalSignificance: string
  racingHistory?: string
  annualMaintenance: number
  mediaInterest: number
}

export const CAR_CATALOG: CarCatalogEntry[] = [
  // Legendary
  {
    make: 'Ferrari',
    model: '250 GTO',
    yearRange: { min: 1962, max: 1964 },
    basePrice: 50000000,
    rarity: 'legendary',
    appreciationRate: 8,
    historicalSignificance: 'Most valuable car ever built, only 36 made',
    racingHistory: 'Multiple class wins at Le Mans',
    annualMaintenance: 50000,
    mediaInterest: 100
  },
  {
    make: 'Mercedes-Benz',
    model: '300SL Gullwing',
    yearRange: { min: 1954, max: 1957 },
    basePrice: 1500000,
    rarity: 'legendary',
    appreciationRate: 6,
    historicalSignificance: 'First production car with fuel injection',
    annualMaintenance: 25000,
    mediaInterest: 90
  },
  {
    make: 'McLaren',
    model: 'F1',
    yearRange: { min: 1992, max: 1998 },
    basePrice: 20000000,
    rarity: 'legendary',
    appreciationRate: 7,
    historicalSignificance: 'Fastest naturally aspirated road car, only 106 made',
    racingHistory: 'Won Le Mans 1995',
    annualMaintenance: 40000,
    mediaInterest: 95
  },
  
  // Very Rare
  {
    make: 'Ferrari',
    model: 'F40',
    yearRange: { min: 1987, max: 1992 },
    basePrice: 2500000,
    rarity: 'very_rare',
    appreciationRate: 5,
    historicalSignificance: 'Last Ferrari signed off by Enzo Ferrari',
    annualMaintenance: 20000,
    mediaInterest: 85
  },
  {
    make: 'Porsche',
    model: '959',
    yearRange: { min: 1986, max: 1993 },
    basePrice: 1800000,
    rarity: 'very_rare',
    appreciationRate: 5,
    historicalSignificance: 'Most technologically advanced car of its era',
    racingHistory: 'Paris-Dakar winner',
    annualMaintenance: 15000,
    mediaInterest: 75
  },
  {
    make: 'Aston Martin',
    model: 'DB5',
    yearRange: { min: 1963, max: 1965 },
    basePrice: 800000,
    rarity: 'very_rare',
    appreciationRate: 4,
    historicalSignificance: 'James Bond\'s iconic car',
    annualMaintenance: 12000,
    mediaInterest: 88
  },
  {
    make: 'Jaguar',
    model: 'E-Type',
    yearRange: { min: 1961, max: 1975 },
    basePrice: 250000,
    rarity: 'rare',
    appreciationRate: 4,
    historicalSignificance: 'Called "the most beautiful car ever" by Enzo Ferrari',
    annualMaintenance: 8000,
    mediaInterest: 70
  },
  
  // Rare
  {
    make: 'Porsche',
    model: '911 Carrera RS 2.7',
    yearRange: { min: 1972, max: 1973 },
    basePrice: 1200000,
    rarity: 'rare',
    appreciationRate: 5,
    historicalSignificance: 'First production car with rear spoiler',
    racingHistory: 'Dominant in GT racing',
    annualMaintenance: 10000,
    mediaInterest: 75
  },
  {
    make: 'BMW',
    model: 'M1',
    yearRange: { min: 1978, max: 1981 },
    basePrice: 650000,
    rarity: 'rare',
    appreciationRate: 4,
    historicalSignificance: 'BMW\'s only mid-engined supercar, only 453 made',
    racingHistory: 'ProCar series',
    annualMaintenance: 8000,
    mediaInterest: 65
  },
  
  // Uncommon modern collectibles
  {
    make: 'Ferrari',
    model: 'LaFerrari',
    yearRange: { min: 2013, max: 2018 },
    basePrice: 4000000,
    rarity: 'very_rare',
    appreciationRate: 4,
    historicalSignificance: 'Ferrari\'s first hybrid hypercar',
    annualMaintenance: 25000,
    mediaInterest: 80
  },
  {
    make: 'Porsche',
    model: '918 Spyder',
    yearRange: { min: 2013, max: 2015 },
    basePrice: 1800000,
    rarity: 'very_rare',
    appreciationRate: 3,
    historicalSignificance: 'Hybrid hypercar, Nurburgring record holder',
    annualMaintenance: 15000,
    mediaInterest: 70
  }
]

// ============================================
// WATCH COLLECTION DETAILS
// ============================================

export interface WatchCollectionDetails {
  brand: string
  model: string
  reference: string
  year: number
  
  // Movement
  movement: 'automatic' | 'manual' | 'quartz'
  caliber?: string
  complications: string[]       // Chronograph, moonphase, etc.
  
  // Case
  caseMaterial: string          // Gold, steel, platinum
  caseSize: number              // mm
  dialColor: string
  
  // Documentation
  serialNumber: string
  hasOriginalBox: boolean
  hasOriginalPapers: boolean
  
  // Service
  lastServiceDate?: { week: number; year: number }
  serviceInterval: number       // Years
  
  // Provenance
  previousOwners: string[]
  limitedEdition: boolean
  editionNumber?: string        // "23 of 100"
}

export interface WatchCatalogEntry {
  brand: string
  model: string
  basePrice: number
  rarity: ItemRarity
  appreciationRate: number
  significance: string
  mediaInterest: number
}

export const WATCH_CATALOG: WatchCatalogEntry[] = [
  // Legendary
  {
    brand: 'Patek Philippe',
    model: 'Nautilus 5711',
    basePrice: 150000,
    rarity: 'very_rare',
    appreciationRate: 8,
    significance: 'Most sought-after luxury sports watch, discontinued',
    mediaInterest: 85
  },
  {
    brand: 'Rolex',
    model: 'Daytona "Paul Newman"',
    basePrice: 500000,
    rarity: 'legendary',
    appreciationRate: 10,
    significance: 'Most valuable Rolex, named after the actor',
    mediaInterest: 95
  },
  {
    brand: 'Audemars Piguet',
    model: 'Royal Oak "Jumbo"',
    basePrice: 80000,
    rarity: 'rare',
    appreciationRate: 6,
    significance: 'Revolutionary luxury sports watch design',
    mediaInterest: 75
  },
  
  // Very Rare
  {
    brand: 'Patek Philippe',
    model: 'Perpetual Calendar 5270',
    basePrice: 120000,
    rarity: 'rare',
    appreciationRate: 5,
    significance: 'Haute horlogerie complication masterpiece',
    mediaInterest: 70
  },
  {
    brand: 'Vacheron Constantin',
    model: 'Overseas',
    basePrice: 35000,
    rarity: 'uncommon',
    appreciationRate: 4,
    significance: 'One of the "Holy Trinity" brands',
    mediaInterest: 60
  },
  
  // Rare Racing Heritage
  {
    brand: 'TAG Heuer',
    model: 'Monaco',
    basePrice: 8000,
    rarity: 'uncommon',
    appreciationRate: 3,
    significance: 'Steve McQueen\'s iconic racing watch',
    mediaInterest: 65
  },
  {
    brand: 'Omega',
    model: 'Speedmaster "Moonwatch"',
    basePrice: 7000,
    rarity: 'common',
    appreciationRate: 2,
    significance: 'First watch worn on the moon',
    mediaInterest: 55
  },
  {
    brand: 'Rolex',
    model: 'Submariner',
    basePrice: 15000,
    rarity: 'uncommon',
    appreciationRate: 4,
    significance: 'The definitive dive watch',
    mediaInterest: 60
  }
]

// ============================================
// ART COLLECTION DETAILS
// ============================================

export interface ArtCollectionDetails {
  artist: string
  title: string
  year: number
  
  // Medium
  medium: 'oil' | 'acrylic' | 'watercolor' | 'mixed_media' | 'sculpture' | 'photography' | 'print'
  dimensions: { width: number; height: number; depth?: number }
  
  // Authentication
  provenance: string[]          // Ownership history
  catalogueRaisonne?: string    // Reference in official catalog
  certificateOfAuthenticity: boolean
  
  // Condition
  hasBeenRestored: boolean
  restorationHistory?: string[]
  
  // Display
  frameType?: string
  displayRequirements: string[] // "UV protection", "Climate controlled"
  
  // Significance
  artistPeriod: string          // "Blue Period", "Late Work"
  artMovement: string           // "Impressionism", "Pop Art"
  historicalImportance: string
}

export interface ArtCatalogEntry {
  artist: string
  priceRange: { min: number; max: number }
  rarity: ItemRarity
  appreciationRate: number
  movement: string
  mediaInterest: number
}

export const ART_CATALOG: ArtCatalogEntry[] = [
  // Blue Chip
  {
    artist: 'Pablo Picasso',
    priceRange: { min: 1000000, max: 100000000 },
    rarity: 'legendary',
    appreciationRate: 5,
    movement: 'Cubism',
    mediaInterest: 100
  },
  {
    artist: 'Andy Warhol',
    priceRange: { min: 500000, max: 50000000 },
    rarity: 'very_rare',
    appreciationRate: 6,
    movement: 'Pop Art',
    mediaInterest: 90
  },
  {
    artist: 'Jean-Michel Basquiat',
    priceRange: { min: 1000000, max: 80000000 },
    rarity: 'very_rare',
    appreciationRate: 8,
    movement: 'Neo-Expressionism',
    mediaInterest: 85
  },
  {
    artist: 'Banksy',
    priceRange: { min: 100000, max: 10000000 },
    rarity: 'rare',
    appreciationRate: 10,
    movement: 'Street Art',
    mediaInterest: 95
  },
  
  // Contemporary
  {
    artist: 'Damien Hirst',
    priceRange: { min: 50000, max: 5000000 },
    rarity: 'rare',
    appreciationRate: 3,
    movement: 'Contemporary',
    mediaInterest: 75
  },
  {
    artist: 'Jeff Koons',
    priceRange: { min: 200000, max: 20000000 },
    rarity: 'rare',
    appreciationRate: 4,
    movement: 'Neo-Pop',
    mediaInterest: 80
  },
  
  // Motorsport Art
  {
    artist: 'Juan Manuel Fangio Portraits',
    priceRange: { min: 10000, max: 100000 },
    rarity: 'rare',
    appreciationRate: 5,
    movement: 'Motorsport Art',
    mediaInterest: 60
  }
]

// ============================================
// WINE COLLECTION DETAILS
// ============================================

export interface WineCollectionDetails {
  producer: string
  name: string
  vintage: number
  region: string
  
  // Classification
  classification: string        // "First Growth", "Grand Cru"
  grapeVariety: string[]
  
  // Storage
  bottleSize: 'standard' | 'magnum' | 'jeroboam' | 'methuselah'
  bottleCount: number
  storageTemperature: number
  humidity: number
  
  // Drinking
  drinkingWindow: { start: number; peak: number; end: number }
  currentMaturity: 'too_young' | 'approaching' | 'optimal' | 'past_peak'
  
  // Ratings
  criticScores: { critic: string; score: number }[]
  
  // Provenance
  purchasedFrom: string
  storageHistory: string        // "ex-chateau", "perfect cellar"
}

export interface WineCatalogEntry {
  producer: string
  region: string
  classification: string
  basePrice: number             // Per bottle
  rarity: ItemRarity
  appreciationRate: number
  collectibility: number        // 0-100
}

export const WINE_CATALOG: WineCatalogEntry[] = [
  // Bordeaux First Growths
  {
    producer: 'Chateau Lafite Rothschild',
    region: 'Pauillac',
    classification: 'First Growth',
    basePrice: 1000,
    rarity: 'very_rare',
    appreciationRate: 6,
    collectibility: 95
  },
  {
    producer: 'Chateau Margaux',
    region: 'Margaux',
    classification: 'First Growth',
    basePrice: 800,
    rarity: 'very_rare',
    appreciationRate: 5,
    collectibility: 93
  },
  {
    producer: 'Chateau Petrus',
    region: 'Pomerol',
    classification: 'Unclassified',
    basePrice: 4000,
    rarity: 'legendary',
    appreciationRate: 8,
    collectibility: 100
  },
  
  // Burgundy
  {
    producer: 'Domaine de la Romanee-Conti',
    region: 'Burgundy',
    classification: 'Grand Cru',
    basePrice: 15000,
    rarity: 'legendary',
    appreciationRate: 10,
    collectibility: 100
  },
  {
    producer: 'Domaine Leroy',
    region: 'Burgundy',
    classification: 'Grand Cru',
    basePrice: 3000,
    rarity: 'legendary',
    appreciationRate: 8,
    collectibility: 95
  },
  
  // Champagne
  {
    producer: 'Dom Perignon',
    region: 'Champagne',
    classification: 'Prestige Cuvee',
    basePrice: 250,
    rarity: 'uncommon',
    appreciationRate: 3,
    collectibility: 70
  },
  {
    producer: 'Krug',
    region: 'Champagne',
    classification: 'Prestige Cuvee',
    basePrice: 300,
    rarity: 'rare',
    appreciationRate: 4,
    collectibility: 80
  }
]

// ============================================
// MEMORABILIA DETAILS
// ============================================

export interface MemorabiliaDetails {
  category: 'racing' | 'sports' | 'entertainment' | 'historical'
  era: string
  
  // For racing memorabilia
  racingDetails?: {
    driver?: string
    team?: string
    event?: string
    season?: number
    result?: string             // "Race winning", "Championship winning"
    carNumber?: number
  }
  
  // Authentication
  authenticated: boolean
  authenticator?: string
  certificateNumber?: string
  
  // Type
  itemType: 'helmet' | 'suit' | 'gloves' | 'car_part' | 'trophy' | 'flag' | 'artwork' | 'document' | 'other'
  
  // Significance
  significance: string
  
  // Condition
  usedInCompetition: boolean
  hasSignature: boolean
  signedBy?: string[]
}

export const MEMORABILIA_CATALOG = [
  {
    name: 'Race-Winning Helmet',
    itemType: 'helmet',
    basePriceRange: { min: 5000, max: 500000 },
    rarityModifiers: {
      championship_winning: 5,
      legendary_driver: 3,
      fatal_accident: 4,
      signed: 1.5
    }
  },
  {
    name: 'Championship Trophy Replica',
    itemType: 'trophy',
    basePriceRange: { min: 1000, max: 50000 },
    rarityModifiers: {
      original: 10,
      team_issued: 3
    }
  },
  {
    name: 'Race-Used Steering Wheel',
    itemType: 'car_part',
    basePriceRange: { min: 2000, max: 100000 },
    rarityModifiers: {
      championship_winning: 4,
      famous_race: 2
    }
  }
]

// ============================================
// COLLECTION EVENTS
// ============================================

export interface CollectionEvent {
  id: string
  type: 'auction' | 'private_sale' | 'exhibition' | 'concours' | 'tasting' | 'show'
  name: string
  date: { week: number; year: number }
  location: string
  
  // Participation
  attendanceCost: number
  vipAccess: boolean
  vipCost?: number
  
  // For auctions
  auctionDetails?: {
    itemsAvailable: CollectionItem[]
    registrationRequired: boolean
    buyersPremium: number       // Percentage
  }
  
  // Opportunities
  networkingValue: number       // 0-100
  potentialContacts: string[]
  mediaPresence: number         // 0-100
  
  // Your participation
  canExhibit: boolean           // Can you show your items
  exhibitionFee?: number
  exhibitionPrize?: number
}

// ============================================
// CONFIGURATION
// ============================================

export const COLLECTIONS_CONFIG = {
  // Insurance
  insuranceRatePercent: 1,      // 1% of value per year
  
  // Storage
  climateStoragePerItem: 500,   // Annual per item
  showroomCostBase: 50000,      // Annual showroom cost
  
  // Appreciation
  baseAppreciationRate: 2,      // Default 2% per year
  conditionModifiers: {
    poor: -3,
    fair: -1,
    good: 0,
    excellent: 1,
    mint: 2,
    concours: 3
  },
  
  // Selling
  auctionCommission: 0.15,      // 15% seller's commission
  privateSaleFee: 0.05,         // 5% for broker
  
  // Events
  concoursEntryFee: 5000,
  exhibitionLoanFee: 10000,     // What museums pay per item
  
  // Media
  mediaFeatureChance: 0.1,      // 10% chance per year if collection is notable
  
  // Tax
  capitalGainsTax: 0.28         // Long-term capital gains on collectibles
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

export function createCollection(type: CollectionType, startDate: { week: number; year: number }): Collection {
  const names: Record<CollectionType, string> = {
    cars: 'Car Collection',
    watches: 'Watch Collection',
    art: 'Art Collection',
    wine: 'Wine Cellar',
    memorabilia: 'Racing Memorabilia'
  }
  
  return {
    id: `collection_${type}_${Date.now()}`,
    type,
    name: names[type],
    items: [],
    totalPurchaseValue: 0,
    currentMarketValue: 0,
    appreciationRate: COLLECTIONS_CONFIG.baseAppreciationRate,
    hasShowroom: false,
    isInsured: false,
    insuranceCost: 0,
    isPubliclyKnown: false,
    hasBeenFeatured: false,
    visitorsAllowed: false,
    totalItemsOwned: 0,
    itemsSold: 0,
    totalProfitLoss: 0,
    startDate
  }
}

export function calculateCollectionValue(collection: Collection): number {
  return collection.items.reduce((sum, item) => sum + item.currentValue, 0)
}

export function calculateInsuranceCost(collection: Collection): number {
  const totalValue = calculateCollectionValue(collection)
  return Math.round(totalValue * (COLLECTIONS_CONFIG.insuranceRatePercent / 100))
}

export function calculateAnnualAppreciation(item: CollectionItem): number {
  // Base appreciation from catalog
  let rate = 2 // Default
  
  // Condition modifier
  rate += COLLECTIONS_CONFIG.conditionModifiers[item.condition] || 0
  
  // Rarity modifier
  const rarityMod = {
    common: 0,
    uncommon: 0.5,
    rare: 1,
    very_rare: 2,
    legendary: 3
  }
  rate += rarityMod[item.rarity] || 0
  
  return rate
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getCollectionStats(collection: Collection): {
  totalItems: number
  totalValue: number
  avgItemValue: number
  mostValuable: CollectionItem | null
  rarityBreakdown: Record<ItemRarity, number>
  totalAppreciation: number
} {
  const items = collection.items
  const totalValue = items.reduce((sum, item) => sum + item.currentValue, 0)
  const purchaseValue = items.reduce((sum, item) => sum + item.purchasePrice, 0)
  
  const rarityBreakdown: Record<ItemRarity, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    very_rare: 0,
    legendary: 0
  }
  
  items.forEach(item => {
    rarityBreakdown[item.rarity]++
  })
  
  const mostValuable = items.length > 0
    ? items.reduce((max, item) => item.currentValue > max.currentValue ? item : max)
    : null
  
  return {
    totalItems: items.length,
    totalValue,
    avgItemValue: items.length > 0 ? Math.round(totalValue / items.length) : 0,
    mostValuable,
    rarityBreakdown,
    totalAppreciation: totalValue - purchaseValue
  }
}

export function isEligibleForConcours(item: CollectionItem): boolean {
  if (item.collectionType !== 'cars') return false
  if (!item.carDetails) return false
  
  return (
    (item.condition === 'concours' || item.condition === 'mint') &&
    item.carDetails.hasOriginalDocuments &&
    item.carDetails.matchingNumbers
  )
}

export function calculateSaleProceeds(
  item: CollectionItem,
  saleType: 'auction' | 'private'
): { gross: number; fees: number; net: number; taxEstimate: number } {
  const gross = item.currentValue
  const feeRate = saleType === 'auction' 
    ? COLLECTIONS_CONFIG.auctionCommission 
    : COLLECTIONS_CONFIG.privateSaleFee
  const fees = Math.round(gross * feeRate)
  const net = gross - fees
  
  const gain = net - item.purchasePrice
  const taxEstimate = gain > 0 
    ? Math.round(gain * COLLECTIONS_CONFIG.capitalGainsTax)
    : 0
  
  return { gross, fees, net, taxEstimate }
}
