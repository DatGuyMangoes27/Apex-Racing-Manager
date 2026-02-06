/**
 * Stock Imagery for AMS2 Career Mode
 * Curated high-quality motorsport photography from Unsplash
 * Used for atmospheric backgrounds throughout the app
 */

// ============================================
// TYPES
// ============================================

export type ImageCategory = 
  | 'gt-racing'
  | 'prototype'
  | 'formula'
  | 'touring'
  | 'spec-series'
  | 'historic'
  | 'karting'
  | 'paddock'
  | 'victory'
  | 'night-racing'
  | 'rain-racing'
  | 'pit-stop'
  | 'garage'
  | 'sim-racing'
  | 'track-aerial'

export type RegionCategory = 
  | 'brazil'
  | 'europe'
  | 'australia'
  | 'usa'
  | 'global'

export interface StockImage {
  url: string
  photographer?: string
  category: ImageCategory
  tags: string[]
}

// ============================================
// UNSPLASH IMAGE URLS
// Using direct Unsplash URLs with sizing parameters
// Format: https://images.unsplash.com/photo-ID?w=WIDTH&h=HEIGHT&fit=crop
// ============================================

// GT Racing - Modern GT cars, GT3/GT4
const GT_RACING_IMAGES: StockImage[] = [
  {
    url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&h=600&fit=crop',
    photographer: 'Campbell',
    category: 'gt-racing',
    tags: ['gt', 'sports-car', 'racing']
  },
  {
    url: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&h=600&fit=crop',
    photographer: 'Adrian Dascal',
    category: 'gt-racing',
    tags: ['gt', 'track', 'supercar']
  },
  {
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&h=600&fit=crop',
    photographer: 'Campbell',
    category: 'gt-racing',
    tags: ['porsche', 'gt', 'racing']
  },
  {
    url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&h=600&fit=crop',
    photographer: 'Erik Mclean',
    category: 'gt-racing',
    tags: ['bmw', 'racing', 'track']
  },
]

// Prototype / Endurance Racing
const PROTOTYPE_IMAGES: StockImage[] = [
  {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=600&fit=crop',
    photographer: 'Harley-Davidson',
    category: 'prototype',
    tags: ['endurance', 'le-mans', 'night']
  },
  {
    url: 'https://images.unsplash.com/photo-1547744152-14d985cb937f?w=1200&h=600&fit=crop',
    photographer: 'Taras Chernus',
    category: 'prototype',
    tags: ['prototype', 'racing', 'track']
  },
  {
    url: 'https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=1200&h=600&fit=crop',
    photographer: 'Jannes Glas',
    category: 'prototype',
    tags: ['endurance', 'racing', 'sports-car']
  },
]

// Formula / Open Wheel
const FORMULA_IMAGES: StockImage[] = [
  {
    url: 'https://images.unsplash.com/photo-1541447553396-53fbe2d77f70?w=1200&h=600&fit=crop',
    photographer: 'Caleb Oquendo',
    category: 'formula',
    tags: ['formula', 'open-wheel', 'track']
  },
  {
    url: 'https://images.unsplash.com/photo-1504707748692-419802cf939d?w=1200&h=600&fit=crop',
    photographer: 'Spencer Davis',
    category: 'formula',
    tags: ['formula', 'racing', 'single-seater']
  },
  {
    url: 'https://images.unsplash.com/photo-1552642986-ccb41e7059e7?w=1200&h=600&fit=crop',
    photographer: 'Jonathan Petersson',
    category: 'formula',
    tags: ['formula', 'grid', 'racing']
  },
]

// Touring / Stock Cars
const TOURING_IMAGES: StockImage[] = [
  {
    url: 'https://images.unsplash.com/photo-1600706432502-77a0e2e32431?w=1200&h=600&fit=crop',
    photographer: 'Meritt Thomas',
    category: 'touring',
    tags: ['touring', 'muscle', 'racing']
  },
  {
    url: 'https://images.unsplash.com/photo-1558618047-f4b511b673f6?w=1200&h=600&fit=crop',
    photographer: 'Harley-Davidson',
    category: 'touring',
    tags: ['touring', 'track', 'racing']
  },
  {
    url: 'https://images.unsplash.com/photo-1611016186353-9af58c69a533?w=1200&h=600&fit=crop',
    photographer: 'Jakob Rosen',
    category: 'touring',
    tags: ['touring', 'muscle-car', 'track']
  },
]

// Spec Series (Porsche, one-make)
const SPEC_SERIES_IMAGES: StockImage[] = [
  {
    url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=1200&h=600&fit=crop',
    photographer: 'Nigel Tadyanehondo',
    category: 'spec-series',
    tags: ['porsche', 'cup', 'racing']
  },
  {
    url: 'https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=1200&h=600&fit=crop',
    photographer: 'Jannes Glas',
    category: 'spec-series',
    tags: ['one-make', 'racing', 'grid']
  },
  {
    url: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=1200&h=600&fit=crop',
    photographer: 'Maxim Hopman',
    category: 'spec-series',
    tags: ['sports-car', 'racing', 'track']
  },
]

// Historic / Vintage Racing
const HISTORIC_IMAGES: StockImage[] = [
  {
    url: 'https://images.unsplash.com/photo-1591384640699-9a85bd036da2?w=1200&h=600&fit=crop',
    photographer: 'Mathew Schwartz',
    category: 'historic',
    tags: ['vintage', 'classic', 'racing']
  },
  {
    url: 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=1200&h=600&fit=crop',
    photographer: 'Peter Broomfield',
    category: 'historic',
    tags: ['vintage', 'sports-car', 'classic']
  },
  {
    url: 'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?w=1200&h=600&fit=crop',
    photographer: 'Evan Velez Saxer',
    category: 'historic',
    tags: ['classic', 'retro', 'vintage']
  },
]

// Karting
const KARTING_IMAGES: StockImage[] = [
  {
    url: 'https://images.unsplash.com/photo-1541447553396-53fbe2d77f70?w=1200&h=600&fit=crop',
    photographer: 'Caleb Oquendo',
    category: 'karting',
    tags: ['karting', 'junior', 'racing']
  },
  {
    url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&h=600&fit=crop',
    photographer: 'National Cancer Institute',
    category: 'karting',
    tags: ['karting', 'track', 'motorsport']
  },
]

// Paddock / Pit Lane / Garage
const PADDOCK_IMAGES: StockImage[] = [
  {
    url: 'https://images.unsplash.com/photo-1567818735868-e71b99932e29?w=1200&h=600&fit=crop',
    photographer: 'Jeff Cooper',
    category: 'paddock',
    tags: ['paddock', 'pit', 'team']
  },
  {
    url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&h=600&fit=crop',
    photographer: 'Markus Spiske',
    category: 'paddock',
    tags: ['garage', 'mechanic', 'tools']
  },
  {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=600&fit=crop',
    photographer: 'Harley-Davidson',
    category: 'paddock',
    tags: ['pit-lane', 'night', 'racing']
  },
]

// Victory / Celebration
const VICTORY_IMAGES: StockImage[] = [
  {
    url: 'https://images.unsplash.com/photo-1552642986-ccb41e7059e7?w=1200&h=600&fit=crop',
    photographer: 'Jonathan Petersson',
    category: 'victory',
    tags: ['victory', 'celebration', 'podium']
  },
  {
    url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&h=600&fit=crop',
    photographer: 'Victor Freitas',
    category: 'victory',
    tags: ['trophy', 'winner', 'celebration']
  },
]

// Night Racing
const NIGHT_RACING_IMAGES: StockImage[] = [
  {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=600&fit=crop',
    photographer: 'Harley-Davidson',
    category: 'night-racing',
    tags: ['night', 'endurance', 'lights']
  },
  {
    url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&h=600&fit=crop',
    photographer: 'Traf',
    category: 'night-racing',
    tags: ['night', 'racing', 'dark']
  },
]

// Sim Racing
const SIM_RACING_IMAGES: StockImage[] = [
  {
    url: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=1200&h=600&fit=crop',
    photographer: 'Florian Olivo',
    category: 'sim-racing',
    tags: ['sim', 'esports', 'gaming']
  },
  {
    url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&h=600&fit=crop',
    photographer: 'Fredrick Tendong',
    category: 'sim-racing',
    tags: ['gaming', 'setup', 'sim']
  },
]

// Track Aerials
const TRACK_AERIAL_IMAGES: StockImage[] = [
  {
    url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&h=600&fit=crop',
    photographer: 'Campbell',
    category: 'track-aerial',
    tags: ['track', 'aerial', 'circuit']
  },
  {
    url: 'https://images.unsplash.com/photo-1547744152-14d985cb937f?w=1200&h=600&fit=crop',
    photographer: 'Taras Chernus',
    category: 'track-aerial',
    tags: ['circuit', 'track', 'racing']
  },
]

// Garage / Workshop
const GARAGE_IMAGES: StockImage[] = [
  {
    url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&h=600&fit=crop',
    photographer: 'Markus Spiske',
    category: 'garage',
    tags: ['garage', 'tools', 'mechanic']
  },
  {
    url: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=1200&h=600&fit=crop',
    photographer: 'Tim Mossholder',
    category: 'garage',
    tags: ['workshop', 'tools', 'automotive']
  },
]

// Pit Stop
const PIT_STOP_IMAGES: StockImage[] = [
  {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=600&fit=crop',
    photographer: 'Harley-Davidson',
    category: 'pit-stop',
    tags: ['pit-stop', 'team', 'racing']
  },
]

// Rain Racing
const RAIN_RACING_IMAGES: StockImage[] = [
  {
    url: 'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=1200&h=600&fit=crop',
    photographer: 'Erik Mclean',
    category: 'rain-racing',
    tags: ['rain', 'wet', 'racing']
  },
]

// ============================================
// IMAGE COLLECTIONS BY CATEGORY
// ============================================

export const STOCK_IMAGES: Record<ImageCategory, StockImage[]> = {
  'gt-racing': GT_RACING_IMAGES,
  'prototype': PROTOTYPE_IMAGES,
  'formula': FORMULA_IMAGES,
  'touring': TOURING_IMAGES,
  'spec-series': SPEC_SERIES_IMAGES,
  'historic': HISTORIC_IMAGES,
  'karting': KARTING_IMAGES,
  'paddock': PADDOCK_IMAGES,
  'victory': VICTORY_IMAGES,
  'night-racing': NIGHT_RACING_IMAGES,
  'sim-racing': SIM_RACING_IMAGES,
  'track-aerial': TRACK_AERIAL_IMAGES,
  'garage': GARAGE_IMAGES,
  'pit-stop': PIT_STOP_IMAGES,
  'rain-racing': RAIN_RACING_IMAGES,
}

// ============================================
// SCENARIO TO IMAGE MAPPING
// Maps career creation scenarios to appropriate imagery
// ============================================

export const SCENARIO_IMAGES: Record<string, ImageCategory> = {
  'karting_prodigy': 'karting',
  'late_bloomer': 'paddock',
  'rich_amateur': 'gt-racing',
  'ex_pro_comeback': 'formula',
  'sim_racing_champion': 'sim-racing',
  'factory_academy': 'paddock',
  'racing_dynasty': 'victory',
  'mechanics_kid': 'garage',
  'recovering_champion': 'formula',
  'second_career': 'touring',
  'national_champion': 'touring',
  'privateer': 'garage',
  'custom': 'track-aerial',
}

// ============================================
// OWNER BACKGROUND IMAGES
// High-quality images for team owner backgrounds
// ============================================

export const OWNER_BACKGROUND_IMAGES: Record<string, string> = {
  // Self-Made Entrepreneur - Business/office setting
  'self_made': 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=400&fit=crop&auto=format&q=80',
  
  // Racing Dynasty Heir - Luxury/heritage
  'racing_dynasty': 'https://images.unsplash.com/photo-1532906619279-a764d9526715?w=600&h=400&fit=crop&auto=format&q=80',
  
  // Tech Investor - Modern tech/office
  'tech_investor': 'https://images.unsplash.com/photo-1558494949-ef526b01201b?w=600&h=400&fit=crop&auto=format&q=80',
  
  // Former Racing Driver - Racing/podium
  'former_driver': 'https://images.unsplash.com/photo-1530906622963-8a60586a49c7?w=600&h=400&fit=crop&auto=format&q=80',
  
  // Finance Mogul - Finance/city
  'finance_mogul': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop&auto=format&q=80',
  
  // Passionate Enthusiast - Fan/paddock
  'passionate_enthusiast': 'https://images.unsplash.com/photo-1529651737248-dad5e287768e?w=600&h=400&fit=crop&auto=format&q=80',
  
  // Corporate Executive - Corporate/boardroom
  'corporate_executive': 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop&auto=format&q=80',
  
  // Lottery Winner - Celebration/luck
  'lottery_winner': 'https://images.unsplash.com/photo-1585516093375-38104875080c?w=600&h=400&fit=crop&auto=format&q=80',
}

/**
 * Get image for an owner background
 */
export function getOwnerBackgroundImage(backgroundId: string): string {
  return OWNER_BACKGROUND_IMAGES[backgroundId] || FALLBACK_IMAGE
}

// ============================================
// CHAMPIONSHIP TYPE TO IMAGE MAPPING
// ============================================

export const CHAMPIONSHIP_TYPE_IMAGES: Record<string, ImageCategory> = {
  'spec-series': 'spec-series',
  'national': 'touring',
  'continental': 'gt-racing',
  'international': 'prototype',
  'historic': 'historic',
  'multi-class': 'prototype',
}

// ============================================
// TIER TO IMAGE MAPPING
// ============================================

export const TIER_IMAGES: Record<string, ImageCategory> = {
  'entry': 'karting',
  'amateur': 'spec-series',
  'semi-pro': 'gt-racing',
  'professional': 'gt-racing',
  'pro': 'gt-racing',
  'elite': 'prototype',
  'pinnacle': 'formula',
}

// ============================================
// REGION TO IMAGE MAPPING
// ============================================

export const REGION_IMAGES: Record<string, ImageCategory> = {
  'Global': 'prototype',
  'Europe': 'gt-racing',
  'Americas': 'touring',
  'Asia-Pacific': 'gt-racing',
  'Brazil': 'touring',
  'Australia': 'touring',
  'USA': 'touring',
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a random image from a category
 */
export function getRandomImage(category: ImageCategory): string {
  const images = STOCK_IMAGES[category]
  if (!images || images.length === 0) {
    return STOCK_IMAGES['paddock'][0].url // fallback
  }
  const randomIndex = Math.floor(Math.random() * images.length)
  return images[randomIndex].url
}

/**
 * Get the first image from a category (deterministic)
 */
export function getCategoryImage(category: ImageCategory): string {
  const images = STOCK_IMAGES[category]
  if (!images || images.length === 0) {
    return STOCK_IMAGES['paddock'][0].url // fallback
  }
  return images[0].url
}

/**
 * Get image for a scenario
 */
export function getScenarioImage(scenarioId: string): string {
  const category = SCENARIO_IMAGES[scenarioId] || 'paddock'
  return getCategoryImage(category)
}

/**
 * Get image for a championship type
 */
export function getChampionshipTypeImage(type: string): string {
  const category = CHAMPIONSHIP_TYPE_IMAGES[type] || 'gt-racing'
  return getCategoryImage(category)
}

/**
 * Get image for a tier
 */
export function getTierImage(tier: string): string {
  const category = TIER_IMAGES[tier] || 'gt-racing'
  return getCategoryImage(category)
}

/**
 * Get image for a region
 */
export function getRegionImage(region: string): string {
  const category = REGION_IMAGES[region] || 'gt-racing'
  return getCategoryImage(category)
}

/**
 * Get image URL with custom dimensions
 */
export function getImageWithSize(baseUrl: string, width: number, height: number): string {
  // Unsplash URLs can be modified with w= and h= parameters
  const url = new URL(baseUrl)
  url.searchParams.set('w', width.toString())
  url.searchParams.set('h', height.toString())
  url.searchParams.set('fit', 'crop')
  url.searchParams.set('auto', 'format')
  url.searchParams.set('q', '80')
  return url.toString()
}

/**
 * Get all images (for preloading)
 */
export function getAllImageUrls(): string[] {
  return Object.values(STOCK_IMAGES)
    .flat()
    .map(img => img.url)
}

// ============================================
// SPECIFIC HERO IMAGES FOR KEY SCREENS
// ============================================

export const HERO_IMAGES = {
  // Main menu / Career creation header
  mainMenu: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=400&fit=crop&auto=format&q=80',
  
  // Home screen - career hub
  careerHub: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&h=300&fit=crop&auto=format&q=80',
  
  // Paddock / World browser
  paddock: 'https://images.unsplash.com/photo-1567818735868-e71b99932e29?w=1200&h=300&fit=crop&auto=format&q=80',
  
  // Contracts
  contracts: 'https://images.unsplash.com/photo-1547744152-14d985cb937f?w=1200&h=300&fit=crop&auto=format&q=80',
  
  // Calendar
  calendar: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&h=300&fit=crop&auto=format&q=80',
  
  // Garage
  garage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&h=300&fit=crop&auto=format&q=80',
  
  // Stats / Achievements
  achievements: 'https://images.unsplash.com/photo-1552642986-ccb41e7059e7?w=1200&h=300&fit=crop&auto=format&q=80',
  
  // Race day
  raceDay: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=400&fit=crop&auto=format&q=80',
}

// Default fallback image
export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&h=600&fit=crop&auto=format&q=80'





