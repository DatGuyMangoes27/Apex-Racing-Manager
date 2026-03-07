/**
 * Stock Imagery for AMS2 Career Mode
 * AI-generated motorsport scene photography (Nano Banana Pro)
 * Used for atmospheric backgrounds throughout the app
 * 
 * Images are stored in: public/images/generated/scenes/
 * Generated via Content Studio's scene-generator or the standalone script.
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
// BASE PATH for generated scene images
// ============================================

const SCENES_BASE = '/images/generated/scenes'

// ============================================
// AI-GENERATED SCENE IMAGES
// All images generated via Nano Banana Pro (gemini-3-pro-image-preview)
// Stored in: public/images/generated/scenes/
// ============================================

// GT Racing - Modern GT cars, GT3/GT4
const GT_RACING_IMAGES: StockImage[] = [
  {
    url: `${SCENES_BASE}/gt-racing-001.jpg`,
    photographer: 'AI Generated',
    category: 'gt-racing',
    tags: ['gt', 'sports-car', 'racing', 'pack']
  },
  {
    url: `${SCENES_BASE}/gt-racing-002.jpg`,
    photographer: 'AI Generated',
    category: 'gt-racing',
    tags: ['gt', 'track', 'chicane']
  },
  {
    url: `${SCENES_BASE}/gt-racing-003.jpg`,
    photographer: 'AI Generated',
    category: 'gt-racing',
    tags: ['porsche', 'gt', 'racing']
  },
  {
    url: `${SCENES_BASE}/gt-racing-004.jpg`,
    photographer: 'AI Generated',
    category: 'gt-racing',
    tags: ['bmw', 'racing', 'speed']
  },
]

// Prototype / Endurance Racing
const PROTOTYPE_IMAGES: StockImage[] = [
  {
    url: `${SCENES_BASE}/prototype-001.jpg`,
    photographer: 'AI Generated',
    category: 'prototype',
    tags: ['endurance', 'le-mans', 'night']
  },
  {
    url: `${SCENES_BASE}/prototype-002.jpg`,
    photographer: 'AI Generated',
    category: 'prototype',
    tags: ['prototype', 'dawn', 'endurance']
  },
  {
    url: `${SCENES_BASE}/prototype-003.jpg`,
    photographer: 'AI Generated',
    category: 'prototype',
    tags: ['lmp2', 'racing', 'start-finish']
  },
]

// Formula / Open Wheel
const FORMULA_IMAGES: StockImage[] = [
  {
    url: `${SCENES_BASE}/formula-001.jpg`,
    photographer: 'AI Generated',
    category: 'formula',
    tags: ['formula', 'open-wheel', 'start']
  },
  {
    url: `${SCENES_BASE}/formula-002.jpg`,
    photographer: 'AI Generated',
    category: 'formula',
    tags: ['formula', 'street-circuit', 'sparks']
  },
  {
    url: `${SCENES_BASE}/formula-003.jpg`,
    photographer: 'AI Generated',
    category: 'formula',
    tags: ['formula', 'grid', 'aerial']
  },
]

// Touring / Stock Cars
const TOURING_IMAGES: StockImage[] = [
  {
    url: `${SCENES_BASE}/touring-001.jpg`,
    photographer: 'AI Generated',
    category: 'touring',
    tags: ['touring', 'door-to-door', 'racing']
  },
  {
    url: `${SCENES_BASE}/touring-002.jpg`,
    photographer: 'AI Generated',
    category: 'touring',
    tags: ['stock-car', 'brazil', 'racing']
  },
  {
    url: `${SCENES_BASE}/touring-003.jpg`,
    photographer: 'AI Generated',
    category: 'touring',
    tags: ['muscle', 'drift', 'v8']
  },
]

// Spec Series (Porsche, one-make)
const SPEC_SERIES_IMAGES: StockImage[] = [
  {
    url: `${SCENES_BASE}/spec-series-001.jpg`,
    photographer: 'AI Generated',
    category: 'spec-series',
    tags: ['porsche', 'cup', 'one-make']
  },
  {
    url: `${SCENES_BASE}/spec-series-002.jpg`,
    photographer: 'AI Generated',
    category: 'spec-series',
    tags: ['ginetta', 'racing', 'british']
  },
  {
    url: `${SCENES_BASE}/spec-series-003.jpg`,
    photographer: 'AI Generated',
    category: 'spec-series',
    tags: ['lamborghini', 'super-trofeo', 'racing']
  },
]

// Historic / Vintage Racing
const HISTORIC_IMAGES: StockImage[] = [
  {
    url: `${SCENES_BASE}/historic-001.jpg`,
    photographer: 'AI Generated',
    category: 'historic',
    tags: ['vintage', 'group-c', 'le-mans']
  },
  {
    url: `${SCENES_BASE}/historic-002.jpg`,
    photographer: 'AI Generated',
    category: 'historic',
    tags: ['classic', 'formula', '1970s']
  },
  {
    url: `${SCENES_BASE}/historic-003.jpg`,
    photographer: 'AI Generated',
    category: 'historic',
    tags: ['classic', '1950s', 'silver']
  },
]

// Karting
const KARTING_IMAGES: StockImage[] = [
  {
    url: `${SCENES_BASE}/karting-001.jpg`,
    photographer: 'AI Generated',
    category: 'karting',
    tags: ['karting', 'wheel-to-wheel', 'hairpin']
  },
  {
    url: `${SCENES_BASE}/karting-002.jpg`,
    photographer: 'AI Generated',
    category: 'karting',
    tags: ['karting', 'track', 'junior']
  },
]

// Paddock / Pit Lane / Garage
const PADDOCK_IMAGES: StockImage[] = [
  {
    url: `${SCENES_BASE}/paddock-001.jpg`,
    photographer: 'AI Generated',
    category: 'paddock',
    tags: ['paddock', 'motorhome', 'atmosphere']
  },
  {
    url: `${SCENES_BASE}/paddock-002.jpg`,
    photographer: 'AI Generated',
    category: 'paddock',
    tags: ['garage', 'mechanic', 'tools']
  },
  {
    url: `${SCENES_BASE}/paddock-003.jpg`,
    photographer: 'AI Generated',
    category: 'paddock',
    tags: ['pit-lane', 'night', 'endurance']
  },
]

// Victory / Celebration
const VICTORY_IMAGES: StockImage[] = [
  {
    url: `${SCENES_BASE}/victory-001.jpg`,
    photographer: 'AI Generated',
    category: 'victory',
    tags: ['victory', 'champagne', 'podium']
  },
  {
    url: `${SCENES_BASE}/victory-002.jpg`,
    photographer: 'AI Generated',
    category: 'victory',
    tags: ['winner', 'parc-ferme', 'celebration']
  },
]

// Night Racing
const NIGHT_RACING_IMAGES: StockImage[] = [
  {
    url: `${SCENES_BASE}/night-racing-001.jpg`,
    photographer: 'AI Generated',
    category: 'night-racing',
    tags: ['night', 'headlights', 'endurance']
  },
  {
    url: `${SCENES_BASE}/night-racing-002.jpg`,
    photographer: 'AI Generated',
    category: 'night-racing',
    tags: ['night', 'solitary', 'dark']
  },
]

// Sim Racing
const SIM_RACING_IMAGES: StockImage[] = [
  {
    url: `${SCENES_BASE}/sim-racing-001.jpg`,
    photographer: 'AI Generated',
    category: 'sim-racing',
    tags: ['sim', 'cockpit', 'gaming']
  },
  {
    url: `${SCENES_BASE}/sim-racing-002.jpg`,
    photographer: 'AI Generated',
    category: 'sim-racing',
    tags: ['esports', 'competition', 'stage']
  },
]

// Track Aerials
const TRACK_AERIAL_IMAGES: StockImage[] = [
  {
    url: `${SCENES_BASE}/track-aerial-001.jpg`,
    photographer: 'AI Generated',
    category: 'track-aerial',
    tags: ['track', 'aerial', 'circuit']
  },
  {
    url: `${SCENES_BASE}/track-aerial-002.jpg`,
    photographer: 'AI Generated',
    category: 'track-aerial',
    tags: ['circuit', 'overhead', 'racing']
  },
]

// Garage / Workshop
const GARAGE_IMAGES: StockImage[] = [
  {
    url: `${SCENES_BASE}/garage-001.jpg`,
    photographer: 'AI Generated',
    category: 'garage',
    tags: ['garage', 'workshop', 'professional']
  },
  {
    url: `${SCENES_BASE}/garage-002.jpg`,
    photographer: 'AI Generated',
    category: 'garage',
    tags: ['engine', 'assembly', 'craftsmanship']
  },
]

// Pit Stop
const PIT_STOP_IMAGES: StockImage[] = [
  {
    url: `${SCENES_BASE}/pit-stop-001.jpg`,
    photographer: 'AI Generated',
    category: 'pit-stop',
    tags: ['pit-stop', 'crew', 'action']
  },
]

// Rain Racing
const RAIN_RACING_IMAGES: StockImage[] = [
  {
    url: `${SCENES_BASE}/rain-racing-001.jpg`,
    photographer: 'AI Generated',
    category: 'rain-racing',
    tags: ['rain', 'wet', 'spray']
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
// AI-generated scene images for team owner backgrounds
// ============================================

export const OWNER_BACKGROUND_IMAGES: Record<string, string> = {
  // Self-Made Entrepreneur - Business/office setting
  'self_made': `${SCENES_BASE}/owner-bg-self-made.jpg`,
  
  // Racing Dynasty Heir - Luxury/heritage
  'racing_dynasty': `${SCENES_BASE}/owner-bg-racing-dynasty.jpg`,
  
  // Tech Investor - Modern tech/office
  'tech_investor': `${SCENES_BASE}/owner-bg-tech-investor.jpg`,
  
  // Former Racing Driver - Racing/podium
  'former_driver': `${SCENES_BASE}/owner-bg-former-driver.jpg`,
  
  // Finance Mogul - Finance/city
  'finance_mogul': `${SCENES_BASE}/owner-bg-finance-mogul.jpg`,
  
  // Passionate Enthusiast - Fan/paddock
  'passionate_enthusiast': `${SCENES_BASE}/owner-bg-passionate-enthusiast.jpg`,
  
  // Corporate Executive - Corporate/boardroom
  'corporate_executive': `${SCENES_BASE}/owner-bg-corporate-executive.jpg`,
  
  // Lottery Winner - Celebration/luck
  'lottery_winner': `${SCENES_BASE}/owner-bg-lottery-winner.jpg`,
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
 * Get image URL with custom dimensions.
 * For local images, returns the URL as-is (no Unsplash resize params needed).
 */
export function getImageWithSize(baseUrl: string, _width: number, _height: number): string {
  // Local generated images don't support dynamic resizing via URL params.
  // The image is served as-is. CSS handles display sizing.
  return baseUrl
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
  mainMenu: `${SCENES_BASE}/hero-main-menu.jpg`,
  
  // Home screen - career hub
  careerHub: `${SCENES_BASE}/hero-career-hub.jpg`,
  
  // Paddock / World browser
  paddock: `${SCENES_BASE}/hero-paddock.jpg`,
  
  // Contracts
  contracts: `${SCENES_BASE}/hero-contracts.jpg`,
  
  // Calendar
  calendar: `${SCENES_BASE}/hero-calendar.jpg`,
  
  // Garage
  garage: `${SCENES_BASE}/hero-garage.jpg`,
  
  // Stats / Achievements
  achievements: `${SCENES_BASE}/hero-achievements.jpg`,
  
  // Race day
  raceDay: `${SCENES_BASE}/hero-race-day.jpg`,
}

// Default fallback image
export const FALLBACK_IMAGE = `${SCENES_BASE}/scene-fallback.jpg`
