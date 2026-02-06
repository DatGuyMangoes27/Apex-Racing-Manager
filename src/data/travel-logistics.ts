// ============================================
// TRAVEL & LOGISTICS SYSTEM
// ============================================
// Calculates travel costs based on team base location
// and series/race locations around the world.

// ============================================
// TYPES
// ============================================

export type WorldRegion = 
  | 'western_europe'
  | 'eastern_europe'
  | 'north_america'
  | 'south_america'
  | 'asia_pacific'
  | 'middle_east'
  | 'oceania'
  | 'africa'

export interface CountryLocation {
  id: string
  name: string
  region: WorldRegion
  coordinates: { lat: number; lng: number }  // For map positioning
  flagEmoji: string
  motorsportHub: boolean
  description: string
}

export interface RegionDistance {
  from: WorldRegion
  to: WorldRegion
  travelMultiplier: number      // Cost multiplier for travel
  freightMultiplier: number     // Cost multiplier for shipping
  turnaroundPenalty: number     // Days lost in turnaround
  fatiguePenalty: number        // Staff fatigue increase (0-20)
}

export interface LogisticsHub {
  id: string
  name: string
  region: WorldRegion
  country: string
  rentalCostPerWeek: number
  freightReduction: number      // % reduction in freight costs
  turnaroundBonus: number       // Days saved
  description: string
  // Warehouse capabilities (for spare parts storage)
  warehouseCapacity: number     // Base parts storage capacity
  warehouseUpgradeCost: number  // Cost to upgrade capacity by 15 parts
  maxWarehouseLevel: number     // Maximum upgrade levels (0-3)
}

export interface TravelCostEstimate {
  seriesName: string
  seriesRegion: WorldRegion
  annualTravelCost: number
  annualFreightCost: number
  totalAnnualCost: number
  turnaroundDays: number
  fatigueImpact: 'low' | 'medium' | 'high' | 'extreme'
}

// ============================================
// COUNTRY DATA
// ============================================

export const COUNTRIES: Record<string, CountryLocation> = {
  // Western Europe - Motorsport heartland
  UK: {
    id: 'UK',
    name: 'United Kingdom',
    region: 'western_europe',
    coordinates: { lat: 52.0, lng: -1.0 },
    flagEmoji: '🇬🇧',
    motorsportHub: true,
    description: 'Motorsport Valley - The global center of racing engineering'
  },
  Germany: {
    id: 'Germany',
    name: 'Germany',
    region: 'western_europe',
    coordinates: { lat: 51.0, lng: 10.0 },
    flagEmoji: '🇩🇪',
    motorsportHub: true,
    description: 'Engineering excellence with strong manufacturer presence'
  },
  Italy: {
    id: 'Italy',
    name: 'Italy',
    region: 'western_europe',
    coordinates: { lat: 42.0, lng: 12.0 },
    flagEmoji: '🇮🇹',
    motorsportHub: true,
    description: 'Passionate racing culture and iconic manufacturers'
  },
  France: {
    id: 'France',
    name: 'France',
    region: 'western_europe',
    coordinates: { lat: 46.0, lng: 2.0 },
    flagEmoji: '🇫🇷',
    motorsportHub: true,
    description: 'Home of Le Mans and endurance racing heritage'
  },
  Spain: {
    id: 'Spain',
    name: 'Spain',
    region: 'western_europe',
    coordinates: { lat: 40.0, lng: -4.0 },
    flagEmoji: '🇪🇸',
    motorsportHub: false,
    description: 'Growing motorsport scene with excellent testing facilities'
  },
  Netherlands: {
    id: 'Netherlands',
    name: 'Netherlands',
    region: 'western_europe',
    coordinates: { lat: 52.0, lng: 5.0 },
    flagEmoji: '🇳🇱',
    motorsportHub: false,
    description: 'Strategic European hub with strong sim racing talent'
  },
  Belgium: {
    id: 'Belgium',
    name: 'Belgium',
    region: 'western_europe',
    coordinates: { lat: 50.5, lng: 4.5 },
    flagEmoji: '🇧🇪',
    motorsportHub: false,
    description: 'Central location with legendary Spa-Francorchamps'
  },
  Austria: {
    id: 'Austria',
    name: 'Austria',
    region: 'western_europe',
    coordinates: { lat: 47.5, lng: 14.5 },
    flagEmoji: '🇦🇹',
    motorsportHub: false,
    description: 'Red Bull\'s backyard with excellent facilities'
  },
  Switzerland: {
    id: 'Switzerland',
    name: 'Switzerland',
    region: 'western_europe',
    coordinates: { lat: 47.0, lng: 8.0 },
    flagEmoji: '🇨🇭',
    motorsportHub: false,
    description: 'Financial hub with historic racing connections'
  },
  Portugal: {
    id: 'Portugal',
    name: 'Portugal',
    region: 'western_europe',
    coordinates: { lat: 39.5, lng: -8.0 },
    flagEmoji: '🇵🇹',
    motorsportHub: false,
    description: 'Year-round testing weather and growing facilities'
  },
  
  // Scandinavia
  Sweden: {
    id: 'Sweden',
    name: 'Sweden',
    region: 'western_europe',
    coordinates: { lat: 62.0, lng: 15.0 },
    flagEmoji: '🇸🇪',
    motorsportHub: false,
    description: 'Strong rallying heritage and engineering talent'
  },
  Finland: {
    id: 'Finland',
    name: 'Finland',
    region: 'western_europe',
    coordinates: { lat: 64.0, lng: 26.0 },
    flagEmoji: '🇫🇮',
    motorsportHub: false,
    description: 'Factory of world champions - exceptional driver talent'
  },
  Norway: {
    id: 'Norway',
    name: 'Norway',
    region: 'western_europe',
    coordinates: { lat: 62.0, lng: 10.0 },
    flagEmoji: '🇳🇴',
    motorsportHub: false,
    description: 'Growing motorsport investment'
  },
  Denmark: {
    id: 'Denmark',
    name: 'Denmark',
    region: 'western_europe',
    coordinates: { lat: 56.0, lng: 10.0 },
    flagEmoji: '🇩🇰',
    motorsportHub: false,
    description: 'Compact location with good European access'
  },
  
  // Eastern Europe
  Poland: {
    id: 'Poland',
    name: 'Poland',
    region: 'eastern_europe',
    coordinates: { lat: 52.0, lng: 20.0 },
    flagEmoji: '🇵🇱',
    motorsportHub: false,
    description: 'Emerging market with lower operational costs'
  },
  'Czech Republic': {
    id: 'Czech Republic',
    name: 'Czech Republic',
    region: 'eastern_europe',
    coordinates: { lat: 50.0, lng: 15.0 },
    flagEmoji: '🇨🇿',
    motorsportHub: false,
    description: 'Central European location with manufacturing tradition'
  },
  Hungary: {
    id: 'Hungary',
    name: 'Hungary',
    region: 'eastern_europe',
    coordinates: { lat: 47.0, lng: 20.0 },
    flagEmoji: '🇭🇺',
    motorsportHub: false,
    description: 'Home of the Hungaroring with growing facilities'
  },
  
  // North America
  USA: {
    id: 'USA',
    name: 'United States',
    region: 'north_america',
    coordinates: { lat: 38.0, lng: -97.0 },
    flagEmoji: '🇺🇸',
    motorsportHub: true,
    description: 'Largest motorsport market with diverse series'
  },
  Canada: {
    id: 'Canada',
    name: 'Canada',
    region: 'north_america',
    coordinates: { lat: 56.0, lng: -106.0 },
    flagEmoji: '🇨🇦',
    motorsportHub: false,
    description: 'Strong ties to both US and European racing'
  },
  Mexico: {
    id: 'Mexico',
    name: 'Mexico',
    region: 'north_america',
    coordinates: { lat: 23.0, lng: -102.0 },
    flagEmoji: '🇲🇽',
    motorsportHub: false,
    description: 'Growing market with lower costs and good talent'
  },
  
  // South America
  Brazil: {
    id: 'Brazil',
    name: 'Brazil',
    region: 'south_america',
    coordinates: { lat: -14.0, lng: -51.0 },
    flagEmoji: '🇧🇷',
    motorsportHub: true,
    description: 'Legendary racing nation with passionate fanbase'
  },
  Argentina: {
    id: 'Argentina',
    name: 'Argentina',
    region: 'south_america',
    coordinates: { lat: -34.0, lng: -64.0 },
    flagEmoji: '🇦🇷',
    motorsportHub: false,
    description: 'Rich motorsport heritage with touring car tradition'
  },
  
  // Asia-Pacific
  Japan: {
    id: 'Japan',
    name: 'Japan',
    region: 'asia_pacific',
    coordinates: { lat: 36.0, lng: 138.0 },
    flagEmoji: '🇯🇵',
    motorsportHub: true,
    description: 'Manufacturing powerhouse with unique racing culture'
  },
  China: {
    id: 'China',
    name: 'China',
    region: 'asia_pacific',
    coordinates: { lat: 35.0, lng: 105.0 },
    flagEmoji: '🇨🇳',
    motorsportHub: false,
    description: 'Massive emerging market with heavy investment'
  },
  'South Korea': {
    id: 'South Korea',
    name: 'South Korea',
    region: 'asia_pacific',
    coordinates: { lat: 36.0, lng: 128.0 },
    flagEmoji: '🇰🇷',
    motorsportHub: false,
    description: 'Tech-forward with growing motorsport interest'
  },
  
  // Oceania
  Australia: {
    id: 'Australia',
    name: 'Australia',
    region: 'oceania',
    coordinates: { lat: -25.0, lng: 134.0 },
    flagEmoji: '🇦🇺',
    motorsportHub: true,
    description: 'Strong racing culture with excellent V8 Supercars heritage'
  },
  'New Zealand': {
    id: 'New Zealand',
    name: 'New Zealand',
    region: 'oceania',
    coordinates: { lat: -41.0, lng: 174.0 },
    flagEmoji: '🇳🇿',
    motorsportHub: false,
    description: 'Remote but produces exceptional driving talent'
  },
  
  // Middle East / Africa
  'South Africa': {
    id: 'South Africa',
    name: 'South Africa',
    region: 'africa',
    coordinates: { lat: -29.0, lng: 24.0 },
    flagEmoji: '🇿🇦',
    motorsportHub: false,
    description: 'Emerging market with excellent year-round weather'
  },
}

// ============================================
// REGION DISTANCE MATRIX
// ============================================

export const REGION_DISTANCES: RegionDistance[] = [
  // Western Europe internal
  { from: 'western_europe', to: 'western_europe', travelMultiplier: 1.0, freightMultiplier: 1.0, turnaroundPenalty: 0, fatiguePenalty: 2 },
  { from: 'western_europe', to: 'eastern_europe', travelMultiplier: 1.1, freightMultiplier: 1.1, turnaroundPenalty: 0, fatiguePenalty: 3 },
  
  // Western Europe to other regions
  { from: 'western_europe', to: 'north_america', travelMultiplier: 1.6, freightMultiplier: 1.8, turnaroundPenalty: 1, fatiguePenalty: 10 },
  { from: 'western_europe', to: 'south_america', travelMultiplier: 1.8, freightMultiplier: 2.0, turnaroundPenalty: 2, fatiguePenalty: 12 },
  { from: 'western_europe', to: 'asia_pacific', travelMultiplier: 2.0, freightMultiplier: 2.2, turnaroundPenalty: 2, fatiguePenalty: 15 },
  { from: 'western_europe', to: 'oceania', travelMultiplier: 2.2, freightMultiplier: 2.5, turnaroundPenalty: 3, fatiguePenalty: 18 },
  { from: 'western_europe', to: 'middle_east', travelMultiplier: 1.4, freightMultiplier: 1.5, turnaroundPenalty: 1, fatiguePenalty: 6 },
  { from: 'western_europe', to: 'africa', travelMultiplier: 1.5, freightMultiplier: 1.6, turnaroundPenalty: 1, fatiguePenalty: 8 },
  
  // North America
  { from: 'north_america', to: 'north_america', travelMultiplier: 1.0, freightMultiplier: 1.0, turnaroundPenalty: 0, fatiguePenalty: 3 },
  { from: 'north_america', to: 'south_america', travelMultiplier: 1.4, freightMultiplier: 1.5, turnaroundPenalty: 1, fatiguePenalty: 8 },
  { from: 'north_america', to: 'western_europe', travelMultiplier: 1.6, freightMultiplier: 1.8, turnaroundPenalty: 1, fatiguePenalty: 10 },
  { from: 'north_america', to: 'eastern_europe', travelMultiplier: 1.8, freightMultiplier: 2.0, turnaroundPenalty: 2, fatiguePenalty: 12 },
  { from: 'north_america', to: 'asia_pacific', travelMultiplier: 1.8, freightMultiplier: 2.0, turnaroundPenalty: 2, fatiguePenalty: 14 },
  { from: 'north_america', to: 'oceania', travelMultiplier: 2.0, freightMultiplier: 2.3, turnaroundPenalty: 2, fatiguePenalty: 16 },
  { from: 'north_america', to: 'middle_east', travelMultiplier: 1.8, freightMultiplier: 2.0, turnaroundPenalty: 2, fatiguePenalty: 12 },
  { from: 'north_america', to: 'africa', travelMultiplier: 1.9, freightMultiplier: 2.1, turnaroundPenalty: 2, fatiguePenalty: 14 },
  
  // South America
  { from: 'south_america', to: 'south_america', travelMultiplier: 1.0, freightMultiplier: 1.0, turnaroundPenalty: 0, fatiguePenalty: 3 },
  { from: 'south_america', to: 'north_america', travelMultiplier: 1.4, freightMultiplier: 1.5, turnaroundPenalty: 1, fatiguePenalty: 8 },
  { from: 'south_america', to: 'western_europe', travelMultiplier: 1.8, freightMultiplier: 2.0, turnaroundPenalty: 2, fatiguePenalty: 12 },
  { from: 'south_america', to: 'eastern_europe', travelMultiplier: 2.0, freightMultiplier: 2.2, turnaroundPenalty: 2, fatiguePenalty: 14 },
  { from: 'south_america', to: 'asia_pacific', travelMultiplier: 2.2, freightMultiplier: 2.5, turnaroundPenalty: 3, fatiguePenalty: 18 },
  { from: 'south_america', to: 'oceania', travelMultiplier: 2.0, freightMultiplier: 2.3, turnaroundPenalty: 2, fatiguePenalty: 16 },
  { from: 'south_america', to: 'middle_east', travelMultiplier: 2.0, freightMultiplier: 2.2, turnaroundPenalty: 2, fatiguePenalty: 14 },
  { from: 'south_america', to: 'africa', travelMultiplier: 1.6, freightMultiplier: 1.8, turnaroundPenalty: 1, fatiguePenalty: 10 },
  
  // Asia Pacific
  { from: 'asia_pacific', to: 'asia_pacific', travelMultiplier: 1.0, freightMultiplier: 1.0, turnaroundPenalty: 0, fatiguePenalty: 3 },
  { from: 'asia_pacific', to: 'oceania', travelMultiplier: 1.3, freightMultiplier: 1.4, turnaroundPenalty: 1, fatiguePenalty: 6 },
  { from: 'asia_pacific', to: 'western_europe', travelMultiplier: 2.0, freightMultiplier: 2.2, turnaroundPenalty: 2, fatiguePenalty: 15 },
  { from: 'asia_pacific', to: 'eastern_europe', travelMultiplier: 1.8, freightMultiplier: 2.0, turnaroundPenalty: 2, fatiguePenalty: 12 },
  { from: 'asia_pacific', to: 'north_america', travelMultiplier: 1.8, freightMultiplier: 2.0, turnaroundPenalty: 2, fatiguePenalty: 14 },
  { from: 'asia_pacific', to: 'south_america', travelMultiplier: 2.2, freightMultiplier: 2.5, turnaroundPenalty: 3, fatiguePenalty: 18 },
  { from: 'asia_pacific', to: 'middle_east', travelMultiplier: 1.4, freightMultiplier: 1.5, turnaroundPenalty: 1, fatiguePenalty: 8 },
  { from: 'asia_pacific', to: 'africa', travelMultiplier: 1.8, freightMultiplier: 2.0, turnaroundPenalty: 2, fatiguePenalty: 12 },
  
  // Oceania
  { from: 'oceania', to: 'oceania', travelMultiplier: 1.0, freightMultiplier: 1.0, turnaroundPenalty: 0, fatiguePenalty: 2 },
  { from: 'oceania', to: 'asia_pacific', travelMultiplier: 1.3, freightMultiplier: 1.4, turnaroundPenalty: 1, fatiguePenalty: 6 },
  { from: 'oceania', to: 'western_europe', travelMultiplier: 2.2, freightMultiplier: 2.5, turnaroundPenalty: 3, fatiguePenalty: 18 },
  { from: 'oceania', to: 'eastern_europe', travelMultiplier: 2.3, freightMultiplier: 2.6, turnaroundPenalty: 3, fatiguePenalty: 18 },
  { from: 'oceania', to: 'north_america', travelMultiplier: 2.0, freightMultiplier: 2.3, turnaroundPenalty: 2, fatiguePenalty: 16 },
  { from: 'oceania', to: 'south_america', travelMultiplier: 2.0, freightMultiplier: 2.3, turnaroundPenalty: 2, fatiguePenalty: 16 },
  { from: 'oceania', to: 'middle_east', travelMultiplier: 1.8, freightMultiplier: 2.0, turnaroundPenalty: 2, fatiguePenalty: 12 },
  { from: 'oceania', to: 'africa', travelMultiplier: 1.9, freightMultiplier: 2.1, turnaroundPenalty: 2, fatiguePenalty: 14 },
  
  // Eastern Europe
  { from: 'eastern_europe', to: 'eastern_europe', travelMultiplier: 1.0, freightMultiplier: 1.0, turnaroundPenalty: 0, fatiguePenalty: 2 },
  { from: 'eastern_europe', to: 'western_europe', travelMultiplier: 1.1, freightMultiplier: 1.1, turnaroundPenalty: 0, fatiguePenalty: 3 },
  { from: 'eastern_europe', to: 'middle_east', travelMultiplier: 1.3, freightMultiplier: 1.4, turnaroundPenalty: 1, fatiguePenalty: 5 },
  { from: 'eastern_europe', to: 'asia_pacific', travelMultiplier: 1.8, freightMultiplier: 2.0, turnaroundPenalty: 2, fatiguePenalty: 12 },
  
  // Middle East
  { from: 'middle_east', to: 'middle_east', travelMultiplier: 1.0, freightMultiplier: 1.0, turnaroundPenalty: 0, fatiguePenalty: 2 },
  { from: 'middle_east', to: 'western_europe', travelMultiplier: 1.4, freightMultiplier: 1.5, turnaroundPenalty: 1, fatiguePenalty: 6 },
  { from: 'middle_east', to: 'asia_pacific', travelMultiplier: 1.4, freightMultiplier: 1.5, turnaroundPenalty: 1, fatiguePenalty: 8 },
  
  // Africa
  { from: 'africa', to: 'africa', travelMultiplier: 1.0, freightMultiplier: 1.0, turnaroundPenalty: 0, fatiguePenalty: 2 },
  { from: 'africa', to: 'western_europe', travelMultiplier: 1.5, freightMultiplier: 1.6, turnaroundPenalty: 1, fatiguePenalty: 8 },
  { from: 'africa', to: 'middle_east', travelMultiplier: 1.3, freightMultiplier: 1.4, turnaroundPenalty: 1, fatiguePenalty: 5 },
]

// ============================================
// LOGISTICS HUBS
// ============================================

export const LOGISTICS_HUBS: LogisticsHub[] = [
  {
    id: 'hub_uk',
    name: 'UK Logistics Center',
    region: 'western_europe',
    country: 'UK',
    rentalCostPerWeek: 8000,
    freightReduction: 40,
    turnaroundBonus: 1,
    description: 'Full workshop and parts storage near Silverstone',
    warehouseCapacity: 25,
    warehouseUpgradeCost: 20000,
    maxWarehouseLevel: 3
  },
  {
    id: 'hub_germany',
    name: 'German Operations Base',
    region: 'western_europe',
    country: 'Germany',
    rentalCostPerWeek: 7500,
    freightReduction: 35,
    turnaroundBonus: 1,
    description: 'Central European hub near Nürburgring',
    warehouseCapacity: 25,
    warehouseUpgradeCost: 18000,
    maxWarehouseLevel: 3
  },
  {
    id: 'hub_usa_east',
    name: 'US East Coast Facility',
    region: 'north_america',
    country: 'USA',
    rentalCostPerWeek: 9000,
    freightReduction: 45,
    turnaroundBonus: 1,
    description: 'Strategic base for IMSA and East Coast events',
    warehouseCapacity: 30,
    warehouseUpgradeCost: 25000,
    maxWarehouseLevel: 3
  },
  {
    id: 'hub_usa_west',
    name: 'US West Coast Facility',
    region: 'north_america',
    country: 'USA',
    rentalCostPerWeek: 9500,
    freightReduction: 45,
    turnaroundBonus: 1,
    description: 'Pacific operations for West Coast and Asia connections',
    warehouseCapacity: 30,
    warehouseUpgradeCost: 25000,
    maxWarehouseLevel: 3
  },
  {
    id: 'hub_japan',
    name: 'Japan Technical Center',
    region: 'asia_pacific',
    country: 'Japan',
    rentalCostPerWeek: 10000,
    freightReduction: 50,
    turnaroundBonus: 2,
    description: 'Full service facility with manufacturer connections',
    warehouseCapacity: 35,
    warehouseUpgradeCost: 30000,
    maxWarehouseLevel: 3
  },
  {
    id: 'hub_australia',
    name: 'Australian Operations Hub',
    region: 'oceania',
    country: 'Australia',
    rentalCostPerWeek: 7000,
    freightReduction: 40,
    turnaroundBonus: 1,
    description: 'Key base for Oceania and Asian rounds',
    warehouseCapacity: 20,
    warehouseUpgradeCost: 15000,
    maxWarehouseLevel: 3
  },
  {
    id: 'hub_brazil',
    name: 'São Paulo Logistics Center',
    region: 'south_america',
    country: 'Brazil',
    rentalCostPerWeek: 5000,
    freightReduction: 35,
    turnaroundBonus: 1,
    description: 'South American operations at lower cost',
    warehouseCapacity: 20,
    warehouseUpgradeCost: 12000,
    maxWarehouseLevel: 3
  },
  {
    id: 'hub_dubai',
    name: 'Dubai Freight Hub',
    region: 'middle_east',
    country: 'UAE',
    rentalCostPerWeek: 12000,
    freightReduction: 50,
    turnaroundBonus: 2,
    description: 'Premium facility bridging Europe, Asia, and Africa',
    warehouseCapacity: 40,
    warehouseUpgradeCost: 35000,
    maxWarehouseLevel: 3
  }
]

// ============================================
// SERIES FOR COST ESTIMATES (From actual app championships)
// ============================================

export interface ExampleSeries {
  id: string
  name: string
  region: WorldRegion
  racesPerSeason: number
  baseTravelCostPerRace: number
  baseFreightCostPerRace: number
  tier: 'entry' | 'regional' | 'continental' | 'global'
}

export const EXAMPLE_SERIES: ExampleSeries[] = [
  // ============================================
  // GLOBAL / PINNACLE SERIES
  // ============================================
  {
    id: 'wec',
    name: 'FIA World Endurance Championship',
    region: 'western_europe',
    racesPerSeason: 8,
    baseTravelCostPerRace: 45000,
    baseFreightCostPerRace: 75000,
    tier: 'global'
  },
  {
    id: 'formula-ultimate',
    name: 'Formula Ultimate Championship',
    region: 'western_europe',
    racesPerSeason: 10,
    baseTravelCostPerRace: 50000,
    baseFreightCostPerRace: 85000,
    tier: 'global'
  },
  
  // ============================================
  // EUROPEAN SERIES
  // ============================================
  {
    id: 'gt-world-challenge-europe',
    name: 'GT World Challenge Europe',
    region: 'western_europe',
    racesPerSeason: 10,
    baseTravelCostPerRace: 15000,
    baseFreightCostPerRace: 25000,
    tier: 'continental'
  },
  {
    id: 'gt3-sprint-series',
    name: 'GT3 Sprint Series',
    region: 'western_europe',
    racesPerSeason: 8,
    baseTravelCostPerRace: 12000,
    baseFreightCostPerRace: 20000,
    tier: 'continental'
  },
  {
    id: 'gt4-european-series',
    name: 'GT4 European Series',
    region: 'western_europe',
    racesPerSeason: 7,
    baseTravelCostPerRace: 8000,
    baseFreightCostPerRace: 14000,
    tier: 'regional'
  },
  {
    id: 'formula-3',
    name: 'FIA Formula 3 Championship',
    region: 'western_europe',
    racesPerSeason: 9,
    baseTravelCostPerRace: 18000,
    baseFreightCostPerRace: 30000,
    tier: 'continental'
  },
  {
    id: 'carrera-cup-world',
    name: 'Porsche Carrera Cup',
    region: 'western_europe',
    racesPerSeason: 10,
    baseTravelCostPerRace: 10000,
    baseFreightCostPerRace: 16000,
    tier: 'regional'
  },
  {
    id: 'super-trofeo-europe',
    name: 'Lamborghini Super Trofeo',
    region: 'western_europe',
    racesPerSeason: 6,
    baseTravelCostPerRace: 12000,
    baseFreightCostPerRace: 18000,
    tier: 'regional'
  },
  {
    id: 'caterham-academy',
    name: 'Caterham Academy',
    region: 'western_europe',
    racesPerSeason: 7,
    baseTravelCostPerRace: 3000,
    baseFreightCostPerRace: 4000,
    tier: 'entry'
  },
  
  // ============================================
  // AMERICAN SERIES
  // ============================================
  {
    id: 'imsa-gtp',
    name: 'IMSA WeatherTech Championship',
    region: 'north_america',
    racesPerSeason: 11,
    baseTravelCostPerRace: 22000,
    baseFreightCostPerRace: 38000,
    tier: 'continental'
  },
  {
    id: 'gt-america',
    name: 'GT America',
    region: 'north_america',
    racesPerSeason: 8,
    baseTravelCostPerRace: 14000,
    baseFreightCostPerRace: 22000,
    tier: 'regional'
  },
  {
    id: 'formula-usa',
    name: 'Formula USA Championship',
    region: 'north_america',
    racesPerSeason: 10,
    baseTravelCostPerRace: 16000,
    baseFreightCostPerRace: 28000,
    tier: 'continental'
  },
  
  // ============================================
  // BRAZILIAN SERIES
  // ============================================
  {
    id: 'stock-car-brasil',
    name: 'Stock Car Pro Series',
    region: 'south_america',
    racesPerSeason: 12,
    baseTravelCostPerRace: 5000,
    baseFreightCostPerRace: 8000,
    tier: 'regional'
  },
  {
    id: 'carrera-cup-brasil',
    name: 'Porsche Carrera Cup Brasil',
    region: 'south_america',
    racesPerSeason: 8,
    baseTravelCostPerRace: 4000,
    baseFreightCostPerRace: 6000,
    tier: 'regional'
  },
  {
    id: 'formula-vee',
    name: 'Formula Vee Championship',
    region: 'south_america',
    racesPerSeason: 8,
    baseTravelCostPerRace: 2000,
    baseFreightCostPerRace: 3000,
    tier: 'entry'
  },
  
  // ============================================
  // AUSTRALIAN SERIES
  // ============================================
  {
    id: 'supercars-championship',
    name: 'Repco Supercars Championship',
    region: 'oceania',
    racesPerSeason: 13,
    baseTravelCostPerRace: 14000,
    baseFreightCostPerRace: 22000,
    tier: 'continental'
  },
  {
    id: 'aussie-racing-cars',
    name: 'Aussie Racing Cars',
    region: 'oceania',
    racesPerSeason: 8,
    baseTravelCostPerRace: 4000,
    baseFreightCostPerRace: 5000,
    tier: 'entry'
  }
]

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get distance data between two regions
 */
export function getRegionDistance(from: WorldRegion, to: WorldRegion): RegionDistance {
  const distance = REGION_DISTANCES.find(d => d.from === from && d.to === to)
  if (distance) return distance
  
  // Try reverse lookup
  const reverse = REGION_DISTANCES.find(d => d.from === to && d.to === from)
  if (reverse) return reverse
  
  // Default for same region
  return {
    from,
    to,
    travelMultiplier: 1.0,
    freightMultiplier: 1.0,
    turnaroundPenalty: 0,
    fatiguePenalty: 2
  }
}

/**
 * Calculate travel cost estimate for a country/series combination
 */
export function calculateTravelCostEstimate(
  countryId: string,
  series: ExampleSeries
): TravelCostEstimate {
  const country = COUNTRIES[countryId]
  if (!country) {
    return {
      seriesName: series.name,
      seriesRegion: series.region,
      annualTravelCost: series.baseTravelCostPerRace * series.racesPerSeason,
      annualFreightCost: series.baseFreightCostPerRace * series.racesPerSeason,
      totalAnnualCost: (series.baseTravelCostPerRace + series.baseFreightCostPerRace) * series.racesPerSeason,
      turnaroundDays: 0,
      fatigueImpact: 'low'
    }
  }
  
  const distance = getRegionDistance(country.region, series.region)
  
  const annualTravelCost = Math.round(
    series.baseTravelCostPerRace * series.racesPerSeason * distance.travelMultiplier
  )
  const annualFreightCost = Math.round(
    series.baseFreightCostPerRace * series.racesPerSeason * distance.freightMultiplier
  )
  
  let fatigueImpact: 'low' | 'medium' | 'high' | 'extreme' = 'low'
  if (distance.fatiguePenalty >= 15) fatigueImpact = 'extreme'
  else if (distance.fatiguePenalty >= 10) fatigueImpact = 'high'
  else if (distance.fatiguePenalty >= 5) fatigueImpact = 'medium'
  
  return {
    seriesName: series.name,
    seriesRegion: series.region,
    annualTravelCost,
    annualFreightCost,
    totalAnnualCost: annualTravelCost + annualFreightCost,
    turnaroundDays: distance.turnaroundPenalty,
    fatigueImpact
  }
}

/**
 * Get all travel cost estimates for a country
 */
export function getAllTravelEstimatesForCountry(countryId: string): TravelCostEstimate[] {
  return EXAMPLE_SERIES.map(series => calculateTravelCostEstimate(countryId, series))
}

/**
 * Get top 3 most cost-effective series for a country
 */
export function getBestSeriesForCountry(countryId: string): TravelCostEstimate[] {
  const estimates = getAllTravelEstimatesForCountry(countryId)
  return estimates.sort((a, b) => a.totalAnnualCost - b.totalAnnualCost).slice(0, 3)
}

/**
 * Get top 3 most expensive series for a country
 */
export function getWorstSeriesForCountry(countryId: string): TravelCostEstimate[] {
  const estimates = getAllTravelEstimatesForCountry(countryId)
  return estimates.sort((a, b) => b.totalAnnualCost - a.totalAnnualCost).slice(0, 3)
}

/**
 * Format currency for display
 */
export function formatTravelCost(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount.toLocaleString()}`
}

/**
 * Get fatigue color class
 */
export function getFatigueColor(impact: 'low' | 'medium' | 'high' | 'extreme'): string {
  switch (impact) {
    case 'low': return 'text-status-success'
    case 'medium': return 'text-accent-orange'
    case 'high': return 'text-status-warning'
    case 'extreme': return 'text-status-danger'
  }
}

/**
 * Get all countries as array
 */
export function getAllCountries(): CountryLocation[] {
  return Object.values(COUNTRIES)
}

/**
 * Get countries by region
 */
export function getCountriesByRegion(region: WorldRegion): CountryLocation[] {
  return getAllCountries().filter(c => c.region === region)
}

/**
 * Get motorsport hub countries
 */
export function getMotorsportHubs(): CountryLocation[] {
  return getAllCountries().filter(c => c.motorsportHub)
}

/**
 * Get region display name
 */
export function getRegionDisplayName(region: WorldRegion): string {
  const names: Record<WorldRegion, string> = {
    'western_europe': 'Western Europe',
    'eastern_europe': 'Eastern Europe',
    'north_america': 'North America',
    'south_america': 'South America',
    'asia_pacific': 'Asia-Pacific',
    'oceania': 'Oceania',
    'middle_east': 'Middle East',
    'africa': 'Africa'
  }
  return names[region]
}

// ============================================
// WAREHOUSE HELPER FUNCTIONS
// ============================================

/**
 * Get logistics hub by ID
 */
export function getLogisticsHubById(hubId: string): LogisticsHub | undefined {
  return LOGISTICS_HUBS.find(hub => hub.id === hubId)
}

/**
 * Get all logistics hubs in a region
 */
export function getHubsByRegion(region: WorldRegion): LogisticsHub[] {
  return LOGISTICS_HUBS.filter(hub => hub.region === region)
}

/**
 * Calculate warehouse capacity at a given upgrade level
 */
export function calculateHubWarehouseCapacity(hub: LogisticsHub, upgradeLevel: number): number {
  const clampedLevel = Math.max(0, Math.min(hub.maxWarehouseLevel, upgradeLevel))
  const capacityPerLevel = 15 // Additional capacity per upgrade level
  return hub.warehouseCapacity + (clampedLevel * capacityPerLevel)
}

/**
 * Calculate total cost to upgrade warehouse to a given level
 */
export function calculateHubWarehouseUpgradeCost(hub: LogisticsHub, targetLevel: number): number {
  const clampedLevel = Math.max(1, Math.min(hub.maxWarehouseLevel, targetLevel))
  // Each level costs more: level 1 = base, level 2 = 1.5x base, level 3 = 2x base
  const levelMultipliers = [0, 1, 1.5, 2]
  
  let totalCost = 0
  for (let i = 1; i <= clampedLevel; i++) {
    totalCost += hub.warehouseUpgradeCost * levelMultipliers[i]
  }
  
  return Math.round(totalCost)
}

/**
 * Get the nearest logistics hub to a given region
 */
export function getNearestHub(targetRegion: WorldRegion): LogisticsHub | null {
  // First check for a hub in the same region
  const sameRegionHubs = getHubsByRegion(targetRegion)
  if (sameRegionHubs.length > 0) {
    return sameRegionHubs[0]
  }
  
  // Define adjacent regions for fallback
  const adjacentRegions: Record<WorldRegion, WorldRegion[]> = {
    western_europe: ['eastern_europe', 'middle_east', 'africa'],
    eastern_europe: ['western_europe', 'middle_east', 'asia_pacific'],
    north_america: ['south_america'],
    south_america: ['north_america', 'africa'],
    asia_pacific: ['eastern_europe', 'middle_east', 'oceania'],
    middle_east: ['western_europe', 'eastern_europe', 'asia_pacific', 'africa'],
    oceania: ['asia_pacific'],
    africa: ['western_europe', 'middle_east', 'south_america']
  }
  
  // Check adjacent regions
  const adjacent = adjacentRegions[targetRegion] || []
  for (const region of adjacent) {
    const hubs = getHubsByRegion(region)
    if (hubs.length > 0) {
      return hubs[0]
    }
  }
  
  // Fallback to any hub
  return LOGISTICS_HUBS[0] || null
}

/**
 * Get recommended hubs for a set of race regions
 */
export function getRecommendedHubsForRaces(
  raceRegions: WorldRegion[]
): { hub: LogisticsHub; coverageCount: number }[] {
  const regionCounts = new Map<WorldRegion, number>()
  
  // Count races per region
  for (const region of raceRegions) {
    regionCounts.set(region, (regionCounts.get(region) || 0) + 1)
  }
  
  // Score each hub by how many races it covers
  const hubScores: { hub: LogisticsHub; coverageCount: number }[] = []
  
  for (const hub of LOGISTICS_HUBS) {
    let coverageCount = regionCounts.get(hub.region) || 0
    
    // Add partial coverage for adjacent regions (count as 0.5)
    const adjacentRegions: Record<WorldRegion, WorldRegion[]> = {
      western_europe: ['eastern_europe', 'middle_east', 'africa'],
      eastern_europe: ['western_europe', 'middle_east', 'asia_pacific'],
      north_america: ['south_america'],
      south_america: ['north_america', 'africa'],
      asia_pacific: ['eastern_europe', 'middle_east', 'oceania'],
      middle_east: ['western_europe', 'eastern_europe', 'asia_pacific', 'africa'],
      oceania: ['asia_pacific'],
      africa: ['western_europe', 'middle_east', 'south_america']
    }
    
    const adjacent = adjacentRegions[hub.region] || []
    for (const adjRegion of adjacent) {
      coverageCount += (regionCounts.get(adjRegion) || 0) * 0.5
    }
    
    if (coverageCount > 0) {
      hubScores.push({ hub, coverageCount })
    }
  }
  
  // Sort by coverage
  return hubScores.sort((a, b) => b.coverageCount - a.coverageCount)
}

/**
 * Get all regions as array
 */
export function getAllRegions(): WorldRegion[] {
  return [
    'western_europe',
    'eastern_europe',
    'north_america',
    'south_america',
    'asia_pacific',
    'middle_east',
    'oceania',
    'africa'
  ]
}
