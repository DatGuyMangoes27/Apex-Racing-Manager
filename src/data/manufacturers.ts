/**
 * Manufacturer Database
 * Only includes manufacturers that have actual livery images in the game assets
 * Used for manufacturer relationships, discounts, and detailed car information
 */

export type ManufacturerTier = 'budget' | 'mainstream' | 'premium' | 'luxury'
export type ManufacturerSpecialty = 'gt' | 'touring' | 'formula' | 'prototype' | 'stock' | 'kart'

export interface ManufacturerPartsCosts {
  engine: number
  chassis: number
  brakes: number
  suspension: number
  gearbox: number
}

export interface Manufacturer {
  id: string
  name: string
  country: string
  countryCode: string  // ISO 3166-1 alpha-2
  founded: number
  headquarters: string
  description: string
  specialties: ManufacturerSpecialty[]
  tier: ManufacturerTier
  partsCosts: ManufacturerPartsCosts
  supportQuality: number  // 1-100, affects service costs and reliability
  // Mapped car class IDs that use this manufacturer
  carClassIds: string[]
}

// Favor tier thresholds and benefits
export const MANUFACTURER_FAVOR_TIERS = {
  none: { min: 0, max: 24, carDiscount: 0, partsDiscount: 0, label: 'None' },
  bronze: { min: 25, max: 49, carDiscount: 0.05, partsDiscount: 0, label: 'Bronze' },
  silver: { min: 50, max: 74, carDiscount: 0.10, partsDiscount: 0.05, label: 'Silver' },
  gold: { min: 75, max: 89, carDiscount: 0.15, partsDiscount: 0.10, label: 'Gold' },
  platinum: { min: 90, max: 100, carDiscount: 0.20, partsDiscount: 0.15, label: 'Platinum' }
} as const

export type FavorTier = keyof typeof MANUFACTURER_FAVOR_TIERS

export function getFavorTier(favor: number): FavorTier {
  if (favor >= 90) return 'platinum'
  if (favor >= 75) return 'gold'
  if (favor >= 50) return 'silver'
  if (favor >= 25) return 'bronze'
  return 'none'
}

export function getFavorBenefits(favor: number) {
  const tier = getFavorTier(favor)
  return MANUFACTURER_FAVOR_TIERS[tier]
}

// All manufacturers with actual livery images in the game
export const MANUFACTURERS: Record<string, Manufacturer> = {
  // ===========================================
  // LUXURY GT MANUFACTURERS
  // ===========================================
  'mclaren': {
    id: 'mclaren',
    name: 'McLaren',
    country: 'United Kingdom',
    countryCode: 'GB',
    founded: 1963,
    headquarters: 'Woking, Surrey',
    description: 'British supercar manufacturer and Formula One constructor known for technological innovation and racing heritage.',
    specialties: ['gt', 'formula'],
    tier: 'luxury',
    partsCosts: { engine: 18000, chassis: 15000, brakes: 4500, suspension: 6000, gearbox: 12000 },
    supportQuality: 95,
    carClassIds: ['gt3', 'gt3-gen2', 'gt4']
  },
  'lamborghini': {
    id: 'lamborghini',
    name: 'Lamborghini',
    country: 'Italy',
    countryCode: 'IT',
    founded: 1963,
    headquarters: "Sant'Agata Bolognese",
    description: 'Italian supercar manufacturer famous for aggressive styling and powerful V10/V12 engines.',
    specialties: ['gt'],
    tier: 'luxury',
    partsCosts: { engine: 20000, chassis: 16000, brakes: 5000, suspension: 6500, gearbox: 13000 },
    supportQuality: 88,
    carClassIds: ['gt3', 'gt3-gen2', 'super-trofeo']
  },

  // ===========================================
  // PREMIUM GT MANUFACTURERS
  // ===========================================
  'porsche': {
    id: 'porsche',
    name: 'Porsche',
    country: 'Germany',
    countryCode: 'DE',
    founded: 1931,
    headquarters: 'Stuttgart',
    description: 'German sports car manufacturer with unparalleled motorsport success, from Le Mans to GT racing.',
    specialties: ['gt', 'prototype'],
    tier: 'premium',
    partsCosts: { engine: 15000, chassis: 12000, brakes: 3500, suspension: 5000, gearbox: 10000 },
    supportQuality: 98,
    carClassIds: ['gt3', 'gt3-gen2', 'gt4', 'gt5', 'gte', 'carrera-cup', 'hypercar', 'lmdh-gtp']
  },
  'mercedes-amg': {
    id: 'mercedes-amg',
    name: 'Mercedes-AMG',
    country: 'Germany',
    countryCode: 'DE',
    founded: 1967,
    headquarters: 'Affalterbach',
    description: 'High-performance division of Mercedes-Benz, dominating DTM and GT racing with engineering excellence.',
    specialties: ['gt', 'touring'],
    tier: 'premium',
    partsCosts: { engine: 14000, chassis: 11000, brakes: 3200, suspension: 4800, gearbox: 9500 },
    supportQuality: 96,
    carClassIds: ['gt3', 'gt3-gen2', 'gt4']
  },
  'aston-martin': {
    id: 'aston-martin',
    name: 'Aston Martin',
    country: 'United Kingdom',
    countryCode: 'GB',
    founded: 1913,
    headquarters: 'Gaydon, Warwickshire',
    description: 'British luxury sports car manufacturer with a storied Le Mans history and elegant racing machines.',
    specialties: ['gt'],
    tier: 'premium',
    partsCosts: { engine: 16000, chassis: 13000, brakes: 3800, suspension: 5200, gearbox: 11000 },
    supportQuality: 90,
    carClassIds: ['gt3-gen2', 'gt4', 'gte']
  },
  'cadillac': {
    id: 'cadillac',
    name: 'Cadillac',
    country: 'United States',
    countryCode: 'US',
    founded: 1902,
    headquarters: 'Detroit, Michigan',
    description: 'American luxury brand making a strong return to prototype racing with the V-Series.R program.',
    specialties: ['prototype'],
    tier: 'premium',
    partsCosts: { engine: 17000, chassis: 14000, brakes: 4000, suspension: 5500, gearbox: 11500 },
    supportQuality: 85,
    carClassIds: ['lmdh-gtp']
  },

  // ===========================================
  // MAINSTREAM GT/TOURING MANUFACTURERS
  // ===========================================
  'audi': {
    id: 'audi',
    name: 'Audi',
    country: 'Germany',
    countryCode: 'DE',
    founded: 1909,
    headquarters: 'Ingolstadt',
    description: 'German manufacturer with quattro heritage and Le Mans dominance through the R8 and R18 programs.',
    specialties: ['gt', 'prototype', 'touring'],
    tier: 'mainstream',
    partsCosts: { engine: 12000, chassis: 9000, brakes: 2800, suspension: 4000, gearbox: 8000 },
    supportQuality: 94,
    carClassIds: ['gt3', 'gt3-gen2', 'gt4', 'rallycross']
  },
  'bmw': {
    id: 'bmw',
    name: 'BMW',
    country: 'Germany',
    countryCode: 'DE',
    founded: 1916,
    headquarters: 'Munich',
    description: 'Bavarian manufacturer known for driver-focused sports cars and extensive touring car heritage.',
    specialties: ['gt', 'touring', 'prototype'],
    tier: 'mainstream',
    partsCosts: { engine: 11000, chassis: 8500, brakes: 2600, suspension: 3800, gearbox: 7500 },
    supportQuality: 93,
    carClassIds: ['gt3', 'gt3-gen2', 'gt4', 'gte', 'lmdh-gtp']
  },
  'chevrolet': {
    id: 'chevrolet',
    name: 'Chevrolet',
    country: 'United States',
    countryCode: 'US',
    founded: 1911,
    headquarters: 'Detroit, Michigan',
    description: 'American manufacturer with the legendary Corvette racing program and V8 muscle car heritage.',
    specialties: ['gt', 'stock'],
    tier: 'mainstream',
    partsCosts: { engine: 10000, chassis: 8000, brakes: 2400, suspension: 3500, gearbox: 7000 },
    supportQuality: 88,
    carClassIds: ['gt3-gen2', 'gt4', 'gte', 'arc', 'supercar', 'stock-car-2022', 'stock-car-2023', 'stock-car-2024', 'old-stock']
  },
  'nissan': {
    id: 'nissan',
    name: 'Nissan',
    country: 'Japan',
    countryCode: 'JP',
    founded: 1933,
    headquarters: 'Yokohama',
    description: 'Japanese manufacturer famous for the GT-R NISMO program and Super GT dominance.',
    specialties: ['gt'],
    tier: 'mainstream',
    partsCosts: { engine: 11000, chassis: 8500, brakes: 2600, suspension: 3800, gearbox: 7500 },
    supportQuality: 91,
    carClassIds: ['gt3']
  },
  'alpine': {
    id: 'alpine',
    name: 'Alpine',
    country: 'France',
    countryCode: 'FR',
    founded: 1955,
    headquarters: 'Dieppe',
    description: 'French sports car brand revived by Renault, known for lightweight handling and rally heritage.',
    specialties: ['gt', 'prototype'],
    tier: 'mainstream',
    partsCosts: { engine: 10000, chassis: 8000, brakes: 2400, suspension: 3600, gearbox: 7000 },
    supportQuality: 85,
    carClassIds: ['gt4', 'lmdh-gtp']
  },
  'ford': {
    id: 'ford',
    name: 'Ford',
    country: 'United States',
    countryCode: 'US',
    founded: 1903,
    headquarters: 'Dearborn, Michigan',
    description: 'American automotive giant with Le Mans heritage through GT40 and modern Mustang racing programs.',
    specialties: ['gt', 'touring', 'stock'],
    tier: 'mainstream',
    partsCosts: { engine: 9000, chassis: 7500, brakes: 2200, suspension: 3200, gearbox: 6500 },
    supportQuality: 87,
    carClassIds: ['supercar', 'rallycross', 'hot-cars-1983']
  },
  'holden': {
    id: 'holden',
    name: 'Holden',
    country: 'Australia',
    countryCode: 'AU',
    founded: 1856,
    headquarters: 'Melbourne',
    description: 'Australian icon that dominated Supercars racing with the Commodore before transitioning to Chevrolet.',
    specialties: ['touring', 'stock'],
    tier: 'mainstream',
    partsCosts: { engine: 9000, chassis: 7500, brakes: 2200, suspension: 3200, gearbox: 6500 },
    supportQuality: 82,
    carClassIds: ['supercar']
  },
  'toyota': {
    id: 'toyota',
    name: 'Toyota',
    country: 'Japan',
    countryCode: 'JP',
    founded: 1937,
    headquarters: 'Toyota City',
    description: 'Japanese manufacturer with exceptional reliability and success in Brazilian Stock Car racing.',
    specialties: ['touring', 'stock'],
    tier: 'mainstream',
    partsCosts: { engine: 8500, chassis: 7000, brakes: 2000, suspension: 3000, gearbox: 6000 },
    supportQuality: 95,
    carClassIds: ['sprint-race', 'stock-car-2022', 'stock-car-2023', 'stock-car-2024']
  },

  // ===========================================
  // BUDGET/ENTRY LEVEL MANUFACTURERS
  // ===========================================
  'ginetta': {
    id: 'ginetta',
    name: 'Ginetta',
    country: 'United Kingdom',
    countryCode: 'GB',
    founded: 1958,
    headquarters: 'Leeds',
    description: 'British specialist racing car manufacturer offering accessible entry points to motorsport.',
    specialties: ['gt'],
    tier: 'budget',
    partsCosts: { engine: 6000, chassis: 5000, brakes: 1500, suspension: 2200, gearbox: 4000 },
    supportQuality: 80,
    carClassIds: ['gt4', 'gt5', 'ginetta-g55-supercup', 'p3']
  },
  'caterham': {
    id: 'caterham',
    name: 'Caterham',
    country: 'United Kingdom',
    countryCode: 'GB',
    founded: 1973,
    headquarters: 'Crawley, Sussex',
    description: 'British manufacturer of lightweight sports cars continuing the Lotus Seven legacy.',
    specialties: ['gt'],
    tier: 'budget',
    partsCosts: { engine: 4000, chassis: 3500, brakes: 1000, suspension: 1500, gearbox: 2500 },
    supportQuality: 75,
    carClassIds: ['caterham-academy', 'caterham-superlight', 'caterham-supersport', 'caterham-620r']
  },
  'mini': {
    id: 'mini',
    name: 'MINI',
    country: 'United Kingdom',
    countryCode: 'GB',
    founded: 1959,
    headquarters: 'Oxford',
    description: 'Iconic British brand known for compact racing machines with giant-killing potential.',
    specialties: ['touring'],
    tier: 'budget',
    partsCosts: { engine: 3500, chassis: 3000, brakes: 900, suspension: 1400, gearbox: 2200 },
    supportQuality: 82,
    carClassIds: ['jcw']
  },
  'volkswagen': {
    id: 'volkswagen',
    name: 'Volkswagen',
    country: 'Germany',
    countryCode: 'DE',
    founded: 1937,
    headquarters: 'Wolfsburg',
    description: 'German manufacturer with extensive touring car and rallycross programs across the globe.',
    specialties: ['touring', 'kart'],
    tier: 'budget',
    partsCosts: { engine: 5000, chassis: 4000, brakes: 1200, suspension: 1800, gearbox: 3000 },
    supportQuality: 88,
    carClassIds: ['tsi-cup', 'rallycross', 'classic-b']
  },
  'mitsubishi': {
    id: 'mitsubishi',
    name: 'Mitsubishi',
    country: 'Japan',
    countryCode: 'JP',
    founded: 1870,
    headquarters: 'Tokyo',
    description: 'Japanese manufacturer with legendary Lancer Evolution rally and circuit racing heritage.',
    specialties: ['touring'],
    tier: 'budget',
    partsCosts: { engine: 5500, chassis: 4500, brakes: 1300, suspension: 2000, gearbox: 3500 },
    supportQuality: 84,
    carClassIds: ['lancer-cup']
  },
  'fiat': {
    id: 'fiat',
    name: 'Fiat',
    country: 'Italy',
    countryCode: 'IT',
    founded: 1899,
    headquarters: 'Turin',
    description: 'Italian manufacturer with extensive touring car history, particularly in Brazilian racing.',
    specialties: ['touring'],
    tier: 'budget',
    partsCosts: { engine: 3500, chassis: 3000, brakes: 900, suspension: 1400, gearbox: 2200 },
    supportQuality: 78,
    carClassIds: ['classic-b']
  },
  'puma': {
    id: 'puma',
    name: 'Puma',
    country: 'Brazil',
    countryCode: 'BR',
    founded: 1964,
    headquarters: 'São Paulo',
    description: 'Brazilian sports car manufacturer with a passionate following in South American motorsport.',
    specialties: ['gt'],
    tier: 'budget',
    partsCosts: { engine: 4000, chassis: 3500, brakes: 1000, suspension: 1600, gearbox: 2800 },
    supportQuality: 70,
    carClassIds: ['gt5', 'classic-b']
  },

  // ===========================================
  // PROTOTYPE MANUFACTURERS
  // ===========================================
  'ligier': {
    id: 'ligier',
    name: 'Ligier',
    country: 'France',
    countryCode: 'FR',
    founded: 1969,
    headquarters: 'Magny-Cours',
    description: 'French constructor specializing in sports prototypes, from LMP2 to entry-level racing.',
    specialties: ['prototype'],
    tier: 'mainstream',
    partsCosts: { engine: 12000, chassis: 10000, brakes: 3000, suspension: 4200, gearbox: 8500 },
    supportQuality: 86,
    carClassIds: ['p3', 'lmp2-gen2']
  },
  'oreca': {
    id: 'oreca',
    name: 'Oreca',
    country: 'France',
    countryCode: 'FR',
    founded: 1973,
    headquarters: 'Signes',
    description: 'French racing constructor dominating LMP2 and building customer prototypes for WEC and IMSA.',
    specialties: ['prototype'],
    tier: 'mainstream',
    partsCosts: { engine: 13000, chassis: 11000, brakes: 3200, suspension: 4500, gearbox: 9000 },
    supportQuality: 92,
    carClassIds: ['lmp2-gen1', 'lmp2-gen2']
  },
  'dallara': {
    id: 'dallara',
    name: 'Dallara',
    country: 'Italy',
    countryCode: 'IT',
    founded: 1972,
    headquarters: 'Parma',
    description: 'Italian constructor supplying chassis to IndyCar, F3, and multiple prototype categories.',
    specialties: ['formula', 'prototype'],
    tier: 'mainstream',
    partsCosts: { engine: 11000, chassis: 9000, brakes: 2800, suspension: 4000, gearbox: 8000 },
    supportQuality: 94,
    carClassIds: ['f3', 'formula-usa-2023', 'lmp2-gen1']
  },
  'metalmoro': {
    id: 'metalmoro',
    name: 'Metalmoro',
    country: 'Brazil',
    countryCode: 'BR',
    founded: 2005,
    headquarters: 'São Paulo',
    description: 'Brazilian prototype constructor building competitive machines for South American endurance racing.',
    specialties: ['prototype'],
    tier: 'budget',
    partsCosts: { engine: 7000, chassis: 6000, brakes: 1800, suspension: 2600, gearbox: 5000 },
    supportQuality: 72,
    carClassIds: ['p1-gen1', 'p1-gen2', 'p2', 'p4']
  },
  'sigma': {
    id: 'sigma',
    name: 'Sigma',
    country: 'Brazil',
    countryCode: 'BR',
    founded: 2008,
    headquarters: 'São Paulo',
    description: 'Brazilian prototype manufacturer competing in national endurance championships.',
    specialties: ['prototype'],
    tier: 'budget',
    partsCosts: { engine: 6500, chassis: 5500, brakes: 1600, suspension: 2400, gearbox: 4500 },
    supportQuality: 68,
    carClassIds: ['p1-gen1', 'p4']
  },
  'norma': {
    id: 'norma',
    name: 'Norma',
    country: 'France',
    countryCode: 'FR',
    founded: 1984,
    headquarters: 'Saint-Savin',
    description: 'French prototype manufacturer known for competitive LMP3 and sportscar racing machines.',
    specialties: ['prototype'],
    tier: 'budget',
    partsCosts: { engine: 8000, chassis: 7000, brakes: 2000, suspension: 3000, gearbox: 5500 },
    supportQuality: 78,
    carClassIds: ['p3']
  },
  'mcr': {
    id: 'mcr',
    name: 'MCR',
    country: 'Brazil',
    countryCode: 'BR',
    founded: 2010,
    headquarters: 'São Paulo',
    description: 'Brazilian constructor specializing in P2 class prototypes for national championships.',
    specialties: ['prototype'],
    tier: 'budget',
    partsCosts: { engine: 6000, chassis: 5000, brakes: 1500, suspension: 2200, gearbox: 4000 },
    supportQuality: 65,
    carClassIds: ['p2']
  },

  // ===========================================
  // FORMULA MANUFACTURERS
  // ===========================================
  'reiza': {
    id: 'reiza',
    name: 'Reiza',
    country: 'Brazil',
    countryCode: 'BR',
    founded: 2009,
    headquarters: 'São Paulo',
    description: 'Brazilian racing game studio that also designs and manufactures formula racing cars.',
    specialties: ['formula'],
    tier: 'budget',
    partsCosts: { engine: 5000, chassis: 4500, brakes: 1200, suspension: 1800, gearbox: 3500 },
    supportQuality: 80,
    carClassIds: ['formula-vee', 'formula-trainer', 'formula-trainer-advanced', 'formula-inter', 'formula-ultimate', 'formula-reiza']
  },

  // ===========================================
  // GENERIC (for spec series)
  // ===========================================
  'generic': {
    id: 'generic',
    name: 'Generic',
    country: 'International',
    countryCode: 'XX',
    founded: 2000,
    headquarters: 'Various',
    description: 'Spec series equipment providers for karts, NASCAR, and other controlled categories.',
    specialties: ['kart', 'stock'],
    tier: 'budget',
    partsCosts: { engine: 2000, chassis: 1500, brakes: 500, suspension: 800, gearbox: 1200 },
    supportQuality: 70,
    carClassIds: ['kart-4t-rental', 'kart-4t-race', 'kart-125cc', 'kart-shifter', 'superkart', 'kartcross', 'stock-usa-gen1', 'stock-usa-gen2', 'stock-usa-gen3', 'stock-usa-gen3-lm', 'super-v8', 'trophy-truck']
  }
}

// Helper to get manufacturer from a car class ID
export function getManufacturerForCarClass(carClassId: string): Manufacturer | undefined {
  return Object.values(MANUFACTURERS).find(m => m.carClassIds.includes(carClassId))
}

// Helper to get manufacturer by ID
export function getManufacturer(manufacturerId: string): Manufacturer | undefined {
  return MANUFACTURERS[manufacturerId.toLowerCase()]
}

// Get all manufacturers for a specific specialty
export function getManufacturersBySpecialty(specialty: ManufacturerSpecialty): Manufacturer[] {
  return Object.values(MANUFACTURERS).filter(m => m.specialties.includes(specialty))
}

// Get all manufacturers by tier
export function getManufacturersByTier(tier: ManufacturerTier): Manufacturer[] {
  return Object.values(MANUFACTURERS).filter(m => m.tier === tier)
}

// Calculate parts cost total for a manufacturer
export function getTotalPartsCost(manufacturer: Manufacturer): number {
  const costs = manufacturer.partsCosts
  return costs.engine + costs.chassis + costs.brakes + costs.suspension + costs.gearbox
}

// Get manufacturer ID from car name (tries to match manufacturer name in car name)
export function guessManufacturerFromCarName(carName: string): string | undefined {
  const lowerName = carName.toLowerCase()
  
  for (const [id, manufacturer] of Object.entries(MANUFACTURERS)) {
    if (lowerName.includes(manufacturer.name.toLowerCase())) {
      return id
    }
  }
  
  // Handle common abbreviations
  if (lowerName.includes('amr') || lowerName.includes('aston')) return 'aston-martin'
  if (lowerName.includes('corvette') || lowerName.includes('camaro')) return 'chevrolet'
  if (lowerName.includes('huracan') || lowerName.includes('huracán')) return 'lamborghini'
  if (lowerName.includes('cayman') || lowerName.includes('911') || lowerName.includes('992')) return 'porsche'
  if (lowerName.includes('r8')) return 'audi'
  if (lowerName.includes('m4') || lowerName.includes('m6') || lowerName.includes('m8')) return 'bmw'
  if (lowerName.includes('720s') || lowerName.includes('570s')) return 'mclaren'
  if (lowerName.includes('gt-r') || lowerName.includes('gtr')) return 'nissan'
  if (lowerName.includes('vantage')) return 'aston-martin'
  if (lowerName.includes('puma') || lowerName.includes('p052')) return 'puma'
  
  return undefined
}

// Alias for backward compatibility with existing code (as array for .map() usage)
export const AMS2_MANUFACTURERS = Object.values(MANUFACTURERS)

// Alias functions for backward compatibility
export const getManufacturerById = getManufacturer

export function getManufacturersForClass(carClassId: string): Manufacturer[] {
  return Object.values(MANUFACTURERS).filter(m => 
    m.carClassIds.includes(carClassId)
  )
}
