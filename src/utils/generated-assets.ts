/**
 * Generated Assets Utility
 * Provides access to AI-generated images (portraits, logos, cutscenes, etc.)
 * from the asset generation manifest
 */

// Import the generated manifest
import generatedManifest from '@/data/generated-manifest.json'

// Type definitions for the manifest structure
interface PhysicalDescription {
  skinTone: string
  hairColor: string
  hairStyle: string
  eyeColor: string
  facialHair: string | null
  description: string
}

interface DriverAsset {
  name: string
  country: string
  nationality: string
  age: number
  careerStage: string
  personality: string
  physical: PhysicalDescription
  teams: string[]
  portrait: string
  generatedAt: string
}

interface ManufacturerAsset {
  name: string
  country: string
  tier: string
  badge: string
  generatedAt: string
}

interface BankAsset {
  name: string
  logo: string
  generatedAt: string
}

interface ChampionshipAsset {
  name: string
  tier: string
  logo: string
  generatedAt: string
}

interface TrackAsset {
  name: string
  country: string
  images: {
    aerial?: string
    grandstand?: string
    paddock?: string
    pitlane?: string
  }
  generatedAt: string
}

interface PartnerAsset {
  id: string
  gender: string
  age: number
  ageRange: string
  career: string
  careerTitle: string
  country: string
  nationality: string
  style: string
  physical: PhysicalDescription
  portrait: string
  generatedAt: string
}

interface ChildAsset {
  id: string
  baseId: string
  gender: string
  stage: string
  ageRange: string
  country: string
  nationality: string
  physical: PhysicalDescription
  portrait: string
  generatedAt: string
}

interface StaffAsset {
  id: string
  category: string
  role: string
  roleTitle: string
  gender: string
  age: number
  country: string
  nationality: string
  style: string
  physical: PhysicalDescription
  portrait: string
  generatedAt?: string
}

interface UIAsset {
  id: string
  name: string
  type: string
  path: string
  generatedAt: string
}

interface CutsceneAsset {
  id: string
  name: string
  description: string
  path: string
  generatedAt: string
}

interface GeneratedManifest {
  version: string
  generated: string
  lastUpdated: string
  stats: {
    totalAssets: number
    byCategory: Record<string, number>
  }
  drivers: Record<string, DriverAsset>
  teams: Record<string, unknown>
  sponsors: Record<string, unknown>
  manufacturers: Record<string, ManufacturerAsset>
  banks: Record<string, BankAsset>
  championships: Record<string, ChampionshipAsset>
  tracks: Record<string, TrackAsset>
  personal: {
    partners: Record<string, PartnerAsset>
    children: Record<string, ChildAsset>
    contacts: Record<string, unknown>
    staff: Record<string, StaffAsset>
  }
  media: Record<string, unknown>
  business: {
    boardMembers: Record<string, unknown>
    sponsorExecs: Record<string, unknown>
  }
  venues: Record<string, unknown>
  ui: Record<string, UIAsset>
  cutscenes?: Record<string, CutsceneAsset>
}

// Cast the manifest to our typed interface
const manifest = generatedManifest as unknown as GeneratedManifest

// Base path for generated images
const BASE_URL = (import.meta.env.BASE_URL || './').replace(/\/?$/, '/')
const GENERATED_PATH = `${BASE_URL}images/generated/`

// Debug: Log manifest stats on module load
console.log('[GeneratedAssets] Manifest loaded:')
console.log('[GeneratedAssets] - Total assets:', manifest.stats?.totalAssets || 0)
console.log('[GeneratedAssets] - Drivers:', Object.keys(manifest.drivers || {}).length)
console.log('[GeneratedAssets] - Manufacturers:', Object.keys(manifest.manufacturers || {}).length)
console.log('[GeneratedAssets] - Partners:', Object.keys(manifest.personal?.partners || {}).length)
console.log('[GeneratedAssets] - Staff:', Object.keys(manifest.personal?.staff || {}).length)

// ============================================
// ID NORMALIZATION
// ============================================

/**
 * Normalize a name and country to a manifest ID
 * Converts "Bobby Hillin Jr." + "USA" to "bobby-hillin-jr-usa"
 */
export function normalizeToManifestId(name: string, country: string): string {
  const normalizedName = name
    .toLowerCase()
    .replace(/[.']/g, '')  // Remove dots and apostrophes
    .replace(/\s+/g, '-')  // Replace spaces with hyphens
    .replace(/-+/g, '-')   // Collapse multiple hyphens
    .trim()
  
  const normalizedCountry = country.toLowerCase()
  
  return `${normalizedName}-${normalizedCountry}`
}

/**
 * Try multiple ID formats to find a match
 */
function findAssetById<T>(
  assets: Record<string, T>,
  id: string,
  name?: string,
  country?: string
): T | null {
  // Direct ID match
  if (assets[id]) {
    return assets[id]
  }
  
  // Try normalized ID from name and country
  if (name && country) {
    const normalizedId = normalizeToManifestId(name, country)
    if (assets[normalizedId]) {
      return assets[normalizedId]
    }
  }
  
  // Try case-insensitive match
  const lowerCaseId = id.toLowerCase()
  const matchingKey = Object.keys(assets).find(key => key.toLowerCase() === lowerCaseId)
  if (matchingKey) {
    return assets[matchingKey]
  }
  
  return null
}

// ============================================
// PATH HELPERS
// ============================================

/**
 * Build the full path to a generated asset
 */
function buildAssetPath(relativePath: string): string {
  if (!relativePath) return ''
  return `${GENERATED_PATH}${relativePath}`
}

// ============================================
// DRIVER PORTRAITS
// ============================================

/**
 * Get driver portrait path by ID or name+country
 */
export function getDriverPortrait(idOrName: string, country?: string): string {
  const driver = findAssetById(manifest.drivers || {}, idOrName, idOrName, country)
  if (driver?.portrait) {
    return buildAssetPath(driver.portrait)
  }
  return ''
}

/**
 * Get driver asset data (includes physical description, age, etc.)
 */
export function getDriverAsset(idOrName: string, country?: string): DriverAsset | null {
  return findAssetById(manifest.drivers || {}, idOrName, idOrName, country)
}

/**
 * Check if a driver portrait exists
 */
export function hasDriverPortrait(idOrName: string, country?: string): boolean {
  return !!getDriverPortrait(idOrName, country)
}

/**
 * Get all driver IDs
 */
export function getAllDriverIds(): string[] {
  return Object.keys(manifest.drivers || {})
}

// ============================================
// MANUFACTURER LOGOS
// ============================================

/**
 * Get manufacturer logo/badge path
 */
export function getManufacturerLogo(idOrName: string): string {
  // Try direct lookup
  const lower = idOrName.toLowerCase().replace(/\s+/g, '-')
  const mfr = manifest.manufacturers?.[lower] || 
              manifest.manufacturers?.[idOrName] ||
              Object.values(manifest.manufacturers || {}).find(m => 
                m.name.toLowerCase() === idOrName.toLowerCase()
              )
  
  if (mfr?.badge) {
    return buildAssetPath(mfr.badge)
  }
  return ''
}

/**
 * Get manufacturer asset data
 */
export function getManufacturerAsset(idOrName: string): ManufacturerAsset | null {
  const lower = idOrName.toLowerCase().replace(/\s+/g, '-')
  return manifest.manufacturers?.[lower] || 
         manifest.manufacturers?.[idOrName] ||
         Object.values(manifest.manufacturers || {}).find(m => 
           m.name.toLowerCase() === idOrName.toLowerCase()
         ) || null
}

/**
 * Check if manufacturer logo exists
 */
export function hasManufacturerLogo(idOrName: string): boolean {
  return !!getManufacturerLogo(idOrName)
}

// ============================================
// TEAM LOGOS
// ============================================

/**
 * Get team logo path
 * Note: Teams may not have generated logos in the current manifest
 */
export function getTeamLogo(teamId: string): string {
  // Teams structure may vary - check if it exists
  const team = manifest.teams?.[teamId]
  if (team && typeof team === 'object' && 'logo' in team) {
    return buildAssetPath((team as { logo: string }).logo)
  }
  return ''
}

// ============================================
// SPONSOR LOGOS
// ============================================

/**
 * Get sponsor logo path
 */
export function getSponsorLogo(sponsorId: string): string {
  const sponsor = manifest.sponsors?.[sponsorId]
  if (sponsor && typeof sponsor === 'object' && 'logo' in sponsor) {
    return buildAssetPath((sponsor as { logo: string }).logo)
  }
  return ''
}

// ============================================
// BANK/INVESTMENT LOGOS
// ============================================

/**
 * Get bank/investment fund logo path
 */
export function getBankLogo(bankId: string): string {
  // Try direct lookup
  const lower = bankId.toLowerCase().replace(/\s+/g, '-')
  const bank = manifest.banks?.[lower] || manifest.banks?.[bankId]
  
  if (bank?.logo) {
    return buildAssetPath(bank.logo)
  }
  return ''
}

/**
 * Get all bank IDs
 */
export function getAllBankIds(): string[] {
  return Object.keys(manifest.banks || {})
}

// ============================================
// CHAMPIONSHIP LOGOS
// ============================================

/**
 * Get championship logo path
 */
export function getChampionshipLogo(champId: string): string {
  const lower = champId.toLowerCase().replace(/\s+/g, '-')
  const champ = manifest.championships?.[lower] || manifest.championships?.[champId]
  
  if (champ?.logo) {
    return buildAssetPath(champ.logo)
  }
  // Fall back to convention-based path for logos generated by Content Studio
  // that may not yet be in the manifest
  return buildAssetPath(`logos/championships/${lower}.png`)
}

// ============================================
// STAFF PORTRAITS
// ============================================

// Cached gender-indexed staff lists for fast portrait lookup
let _maleStaffAssets: StaffAsset[] | null = null
let _femaleStaffAssets: StaffAsset[] | null = null

// Portrait allocation registry — tracks which portrait IDs are already assigned
// to prevent duplicate portraits across different staff members
const _usedPortraitIds = new Set<string>()

/**
 * Initialize the portrait registry with all portrait IDs currently in use.
 * Should be called when a career is loaded, before any new staff generation.
 */
export function initPortraitRegistry(usedIds: string[]): void {
  _usedPortraitIds.clear()
  usedIds.forEach(id => { if (id) _usedPortraitIds.add(id) })
}

/**
 * Manually register a portrait ID as in use (e.g. when assigning via pre-gen lookup).
 */
export function markPortraitUsed(id: string): void {
  if (id) _usedPortraitIds.add(id)
}

function getStaffAssetsByGender(gender: 'male' | 'female'): StaffAsset[] {
  if (gender === 'male') {
    if (!_maleStaffAssets) {
      _maleStaffAssets = Object.values(manifest.personal?.staff || {}).filter(s => s.gender === 'male')
    }
    return _maleStaffAssets
  } else {
    if (!_femaleStaffAssets) {
      _femaleStaffAssets = Object.values(manifest.personal?.staff || {}).filter(s => s.gender === 'female')
    }
    return _femaleStaffAssets
  }
}

/**
 * Simple deterministic hash for seeded portrait selection
 */
function hashForPortrait(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

/**
 * Get a deterministic portrait ID for a given gender and seed string.
 * Uses a hash of the seed as a starting index, then walks forward to find
 * the first unused portrait (skipping any already in the registry).
 * Auto-registers the selected portrait to prevent future duplicates.
 * Returns a manifest staff ID (e.g. "staff-team-0042") that can be resolved to a path.
 */
export function getPortraitIdByGender(gender: 'male' | 'female', seed: string): string {
  const assets = getStaffAssetsByGender(gender)
  if (assets.length === 0) {
    // Fallback: try all staff if gender-specific list is empty
    const allStaff = Object.values(manifest.personal?.staff || {})
    if (allStaff.length === 0) return ''
    const startIdx = hashForPortrait(seed) % allStaff.length
    // Walk forward to find an unused portrait
    for (let offset = 0; offset < allStaff.length; offset++) {
      const idx = (startIdx + offset) % allStaff.length
      const candidateId = allStaff[idx].id
      if (!_usedPortraitIds.has(candidateId)) {
        _usedPortraitIds.add(candidateId)
        return candidateId
      }
    }
    // All exhausted — allow reuse from hash position
    return allStaff[startIdx].id
  }

  const startIdx = hashForPortrait(seed) % assets.length

  // Walk forward to find an unused portrait
  for (let offset = 0; offset < assets.length; offset++) {
    const idx = (startIdx + offset) % assets.length
    const candidateId = assets[idx].id
    if (!_usedPortraitIds.has(candidateId)) {
      _usedPortraitIds.add(candidateId)
      return candidateId
    }
  }

  // All portraits for this gender are exhausted — allow reuse from hash position
  return assets[startIdx].id
}

/**
 * Get portrait path from a manifest staff ID (the portraitId stored on staff objects)
 */
export function getPortraitByManifestId(portraitId: string): string {
  if (!portraitId) return ''
  const staff = manifest.personal?.staff?.[portraitId]
  if (staff?.portrait) {
    return buildAssetPath(staff.portrait)
  }
  return ''
}

/**
 * Get a fallback portrait path for a given gender (deterministic based on a seed)
 */
export function getFallbackPortrait(gender: 'male' | 'female'): string {
  const assets = getStaffAssetsByGender(gender)
  if (assets.length === 0) return ''
  // Just use the first one as a consistent fallback
  return assets[0].portrait ? buildAssetPath(assets[0].portrait) : ''
}

/**
 * Get staff portrait path (legacy - looks up by staff's own ID in manifest)
 */
export function getStaffPortrait(staffId: string): string {
  const staff = manifest.personal?.staff?.[staffId]
  if (staff?.portrait) {
    return buildAssetPath(staff.portrait)
  }
  return ''
}

/**
 * Get staff asset data
 */
export function getStaffAsset(staffId: string): StaffAsset | null {
  return manifest.personal?.staff?.[staffId] || null
}

/**
 * Get all staff IDs
 */
export function getAllStaffIds(): string[] {
  return Object.keys(manifest.personal?.staff || {})
}

/**
 * Get staff by role
 */
export function getStaffByRole(role: string): StaffAsset[] {
  return Object.values(manifest.personal?.staff || {}).filter(s => s.role === role)
}

/**
 * Get a random staff portrait for a given role (legacy - non-deterministic).
 * Checks the portrait registry to avoid assigning an already-used portrait when possible.
 */
export function getRandomStaffPortraitByRole(role: string): string {
  const staffWithRole = getStaffByRole(role)
  if (staffWithRole.length === 0) return ''
  
  const startIndex = Math.floor(Math.random() * staffWithRole.length)
  // Walk forward from random start to find an unused portrait
  for (let offset = 0; offset < staffWithRole.length; offset++) {
    const idx = (startIndex + offset) % staffWithRole.length
    const candidate = staffWithRole[idx]
    if (candidate.portrait && !_usedPortraitIds.has(candidate.id)) {
      _usedPortraitIds.add(candidate.id)
      return buildAssetPath(candidate.portrait)
    }
  }
  // All exhausted — fall back to random pick (allow reuse)
  const staff = staffWithRole[startIndex]
  return staff.portrait ? buildAssetPath(staff.portrait) : ''
}

// ============================================
// PARTNER PORTRAITS
// ============================================

/**
 * Get partner portrait path
 */
export function getPartnerPortrait(partnerId: string): string {
  const partner = manifest.personal?.partners?.[partnerId]
  if (partner?.portrait) {
    return buildAssetPath(partner.portrait)
  }
  return ''
}

/**
 * Get partner asset data
 */
export function getPartnerAsset(partnerId: string): PartnerAsset | null {
  return manifest.personal?.partners?.[partnerId] || null
}

/**
 * Get all partner IDs
 */
export function getAllPartnerIds(): string[] {
  return Object.keys(manifest.personal?.partners || {})
}

/**
 * Get a random partner portrait
 */
export function getRandomPartnerPortrait(gender?: 'male' | 'female'): string {
  const partners = Object.values(manifest.personal?.partners || {})
  const filtered = gender ? partners.filter(p => p.gender === gender) : partners
  
  if (filtered.length === 0) return ''
  
  const randomIndex = Math.floor(Math.random() * filtered.length)
  const partner = filtered[randomIndex]
  return partner.portrait ? buildAssetPath(partner.portrait) : ''
}

// ============================================
// CHILDREN PORTRAITS
// ============================================

/**
 * Get child portrait path
 */
export function getChildPortrait(childId: string): string {
  const child = manifest.personal?.children?.[childId]
  if (child?.portrait) {
    return buildAssetPath(child.portrait)
  }
  return ''
}

/**
 * Get child portrait by base ID and age stage
 */
export function getChildPortraitByStage(baseId: string, stage: string): string {
  const childId = `${baseId}-${stage}`
  return getChildPortrait(childId)
}

/**
 * Get all stages for a child base ID
 */
export function getChildStages(baseId: string): ChildAsset[] {
  return Object.values(manifest.personal?.children || {}).filter(c => c.baseId === baseId)
}

// ============================================
// TRACK IMAGES
// ============================================

export type TrackImageType = 'aerial' | 'grandstand' | 'paddock' | 'pitlane'

/**
 * Get track image path
 */
export function getTrackImage(trackId: string, type: TrackImageType = 'aerial'): string {
  const lower = trackId.toLowerCase().replace(/\s+/g, '-')
  const track = manifest.tracks?.[lower] || manifest.tracks?.[trackId]
  
  if (track?.images?.[type]) {
    return buildAssetPath(track.images[type]!)
  }
  return ''
}

/**
 * Get all available track image types for a track
 */
export function getAvailableTrackImages(trackId: string): TrackImageType[] {
  const lower = trackId.toLowerCase().replace(/\s+/g, '-')
  const track = manifest.tracks?.[lower] || manifest.tracks?.[trackId]
  
  if (!track?.images) return []
  
  return (Object.keys(track.images) as TrackImageType[]).filter(key => !!track.images[key])
}

// ============================================
// CUTSCENE IMAGES
// ============================================

// Known cutscene files (from file system)
const CUTSCENE_FILES = [
  'championship-moment',
  'championship-trophy',
  'contract-signing',
  'factory-tour',
  'first-win',
  'garage-celebration',
  'garage-preparation',
  'garage-reveal',
  'media-interview',
  'night-lights',
  'night-race',
  'paddock-morning',
  'paddock-night',
  'pit-stop-drama',
  'podium-celebration',
  'press-conference',
  'race-start',
  'rain-race',
  'retirement-ceremony',
  'sponsor-meeting',
  'sunset-track',
  'team-photo'
]

/**
 * Get cutscene image path
 */
export function getCutsceneImage(sceneId: string): string {
  // First check manifest
  const scene = manifest.cutscenes?.[sceneId]
  if (scene?.path) {
    return buildAssetPath(scene.path)
  }
  
  // Fall back to known files
  const normalizedId = sceneId.toLowerCase().replace(/\s+/g, '-')
  if (CUTSCENE_FILES.includes(normalizedId)) {
    return buildAssetPath(`cutscenes/${normalizedId}.png`)
  }
  
  return ''
}

/**
 * Get all available cutscene IDs
 */
export function getAllCutsceneIds(): string[] {
  const fromManifest = Object.keys(manifest.cutscenes || {})
  return [...new Set([...fromManifest, ...CUTSCENE_FILES])]
}

/**
 * Get a random cutscene for a category
 */
export function getRandomCutscene(category?: 'race' | 'celebration' | 'business' | 'paddock'): string {
  const categories: Record<string, string[]> = {
    race: ['race-start', 'pit-stop-drama', 'night-race', 'rain-race'],
    celebration: ['podium-celebration', 'championship-trophy', 'first-win', 'garage-celebration'],
    business: ['contract-signing', 'sponsor-meeting', 'press-conference', 'media-interview'],
    paddock: ['paddock-morning', 'paddock-night', 'factory-tour', 'garage-reveal']
  }
  
  const scenes = category ? categories[category] || CUTSCENE_FILES : CUTSCENE_FILES
  const randomIndex = Math.floor(Math.random() * scenes.length)
  return getCutsceneImage(scenes[randomIndex])
}

// ============================================
// UI TEXTURES
// ============================================

// Known UI texture files
const UI_TEXTURES = [
  'ui-abstract-speed',
  'ui-carbon-texture',
  'ui-cockpit-blur',
  'ui-metal-texture'
]

/**
 * Get UI texture/background path
 */
export function getUITexture(textureId: string): string {
  // First check manifest
  const texture = manifest.ui?.[textureId]
  if (texture?.path) {
    return buildAssetPath(texture.path)
  }
  
  // Fall back to known files
  const normalizedId = textureId.toLowerCase().replace(/\s+/g, '-')
  if (UI_TEXTURES.includes(normalizedId)) {
    return buildAssetPath(`ui/${normalizedId}.png`)
  }
  
  return ''
}

/**
 * Get all UI texture IDs
 */
export function getAllUITextureIds(): string[] {
  const fromManifest = Object.keys(manifest.ui || {})
  return [...new Set([...fromManifest, ...UI_TEXTURES])]
}

// ============================================
// VENUE IMAGES
// ============================================

/**
 * Get generic venue image (for tracks without specific images)
 */
export function getVenueImage(venueName: string): string {
  // Check if we have a generated venue image
  const venueId = venueName.toLowerCase().replace(/\s+/g, '-')
  const venueFiles = ['venue-lemans', 'venue-monza', 'venue-nurburgring', 'venue-silverstone', 'venue-spa']
  
  // Try to match by name
  const match = venueFiles.find(v => v.includes(venueId) || venueId.includes(v.replace('venue-', '')))
  if (match) {
    return buildAssetPath(`venues/${match}.png`)
  }
  
  // Return a random venue as fallback
  const randomIndex = Math.floor(Math.random() * venueFiles.length)
  return buildAssetPath(`venues/${venueFiles[randomIndex]}.png`)
}

// ============================================
// STATS & UTILITIES
// ============================================

/**
 * Get manifest stats
 */
export function getManifestStats(): { total: number; byCategory: Record<string, number> } {
  return {
    total: manifest.stats?.totalAssets || 0,
    byCategory: manifest.stats?.byCategory || {}
  }
}

/**
 * Check if the manifest is loaded and has data
 */
export function isManifestLoaded(): boolean {
  return !!manifest && Object.keys(manifest.drivers || {}).length > 0
}

// ============================================
// LIFESTYLE IMAGES
// ============================================

/**
 * Get a lifestyle image by category and item id.
 * Images live at: images/generated/lifestyle/<subcategory>/<filename>.png
 * itemId is normalized (lowercase, no accents, hyphens) for consistent resolution.
 */
export function getLifestyleImage(subcategory: string, itemId: string): string {
  const normalized = normalizeAssetKey(itemId)
  return `${GENERATED_PATH}lifestyle/${subcategory}/${normalized}.png`
}

/** Normalize string for image lookup: lowercase, spaces to hyphens, strip diacritics (é→e). */
export function normalizeAssetKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '-')
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

// Maps catalog IDs/types to lifestyle image filenames (no extension)
// Category fallback for furnishings (uses standard tier by default)
const FURNISHING_IMAGE_MAP: Record<string, string> = {
  furniture: 'living-room-standard',
  art: 'living-room-standard',
  electronics: 'home-theater-standard',
  appliances: 'kitchen-standard',
  outdoor: 'outdoor-standard',
  home_office: 'home-office-standard',
  smart_home: 'smart-home-standard',
  wine_cellar: 'wine-cellar-standard',
  home_gym: 'home-gym-standard',
  home_theater: 'home-theater-standard',
  pool_spa: 'pool-standard',
  living: 'living-room-standard',
  dining: 'dining-room-standard',
  bedroom: 'bedroom-standard',
  bathroom: 'bathroom-standard',
  garage: 'garage-standard',
  security: 'security-standard',
}
// Per-item furnishing image mapping (matches IDs from FURNISHING_CATALOG)
const FURNISHING_ITEM_IMAGE_MAP: Record<string, string> = {
  // Living room tiers
  'furn-living-standard': 'living-room-standard',
  'furn-living-premium': 'living-room-premium',
  'furn-living-luxury': 'living-room-luxury',
  'furn_living_standard': 'living-room-standard',
  'furn_living_premium': 'living-room-premium',
  'furn_living_luxury': 'living-room-luxury',
  // Dining tiers
  'furn-dining-standard': 'dining-room-standard',
  'furn-dining-premium': 'dining-room-premium',
  'furn-dining-luxury': 'dining-room-luxury',
  'furn_dining_standard': 'dining-room-standard',
  'furn_dining_premium': 'dining-room-premium',
  'furn_dining_luxury': 'dining-room-luxury',
  // Bedroom tiers
  'furn-bedroom-standard': 'bedroom-standard',
  'furn-bedroom-premium': 'bedroom-premium',
  'furn-bedroom-luxury': 'bedroom-luxury',
  'furn_bedroom_standard': 'bedroom-standard',
  'furn_bedroom_premium': 'bedroom-premium',
  'furn_bedroom_luxury': 'bedroom-luxury',
  // Kitchen tiers
  'furn-kitchen-standard': 'kitchen-standard',
  'furn-kitchen-premium': 'kitchen-premium',
  'furn-kitchen-luxury': 'kitchen-luxury',
  'furn_kitchen_standard': 'kitchen-standard',
  'furn_kitchen_premium': 'kitchen-premium',
  'furn_kitchen_luxury': 'kitchen-luxury',
  // Office tiers
  'furn-office-standard': 'home-office-standard',
  'furn-office-premium': 'home-office-premium',
  'furn-office-luxury': 'home-office-luxury',
  'furn_office_standard': 'home-office-standard',
  'furn_office_premium': 'home-office-premium',
  'furn_office_luxury': 'home-office-luxury',
  // Outdoor tiers
  'furn-outdoor-standard': 'outdoor-standard',
  'furn-outdoor-premium': 'outdoor-premium',
  'furn-outdoor-luxury': 'outdoor-luxury',
  'furn_outdoor_standard': 'outdoor-standard',
  'furn_outdoor_premium': 'outdoor-premium',
  'furn_outdoor_luxury': 'outdoor-luxury',
  // Theater tiers
  'furn-theater-standard': 'home-theater-standard',
  'furn-theater-premium': 'home-theater-premium',
  'furn-theater-luxury': 'home-theater-luxury',
  'furn_theater_standard': 'home-theater-standard',
  'furn_theater_premium': 'home-theater-premium',
  'furn_theater_luxury': 'home-theater-luxury',
  // Wine cellar tiers
  'furn-wine-cellar-standard': 'wine-cellar-standard',
  'furn-wine-cellar-premium': 'wine-cellar-premium',
  'furn-wine-cellar-luxury': 'wine-cellar-luxury',
  'furn_wine_cellar_standard': 'wine-cellar-standard',
  'furn_wine_cellar_premium': 'wine-cellar-premium',
  'furn_wine_cellar_luxury': 'wine-cellar-luxury',
  // Gym tiers
  'furn-gym-standard': 'home-gym-standard',
  'furn-gym-premium': 'home-gym-premium',
  'furn-gym-luxury': 'home-gym-luxury',
  'furn_gym_standard': 'home-gym-standard',
  'furn_gym_premium': 'home-gym-premium',
  'furn_gym_luxury': 'home-gym-luxury',
  // Pool/spa tiers
  'furn-pool-standard': 'pool-standard',
  'furn-pool-premium': 'pool-premium',
  'furn-pool-luxury': 'pool-luxury',
  'furn_pool_standard': 'pool-standard',
  'furn_pool_premium': 'pool-premium',
  'furn_pool_luxury': 'pool-luxury',
  // Smart home tiers
  'furn-smart-standard': 'smart-home-standard',
  'furn-smart-premium': 'smart-home-premium',
  'furn-smart-luxury': 'smart-home-luxury',
  'furn_smart_standard': 'smart-home-standard',
  'furn_smart_premium': 'smart-home-premium',
  'furn_smart_luxury': 'smart-home-luxury',
  // Bathroom tiers
  'furn-bathroom-standard': 'bathroom-standard',
  'furn-bathroom-premium': 'bathroom-premium',
  'furn-bathroom-luxury': 'bathroom-luxury',
  'furn_bathroom_standard': 'bathroom-standard',
  'furn_bathroom_premium': 'bathroom-premium',
  'furn_bathroom_luxury': 'bathroom-luxury',
  // Garage tiers
  'furn-garage-standard': 'garage-standard',
  'furn-garage-premium': 'garage-premium',
  'furn-garage-luxury': 'garage-luxury',
  'furn_garage_standard': 'garage-standard',
  'furn_garage_premium': 'garage-premium',
  'furn_garage_luxury': 'garage-luxury',
  // Security tiers
  'furn-security-standard': 'security-standard',
  'furn-security-premium': 'security-premium',
  'furn-security-luxury': 'security-luxury',
  'furn_security_standard': 'security-standard',
  'furn_security_premium': 'security-premium',
  'furn_security_luxury': 'security-luxury',
}
const SERVICE_TYPE_IMAGE_MAP: Record<string, string> = {
  // Type-level fallbacks
  spa_wellness: 'spa-wellness-basic',
  travel: 'travel-concierge',
  personal_care: 'personal-stylist',
  security: 'personal-security',
  medical: 'concierge-medicine',
  chef: 'private-chef',
  housekeeper: 'housekeeper',
}
// Per-item service image mapping (matches service IDs from catalog)
const SERVICE_ITEM_IMAGE_MAP: Record<string, string> = {
  // Spa tiers
  'svc-spa-monthly': 'spa-wellness-basic',
  'svc-spa-weekly': 'spa-wellness-premium',
  'svc-spa-wellness-program': 'spa-wellness-elite',
  'svc_spa_monthly': 'spa-wellness-basic',
  'svc_spa_weekly': 'spa-wellness-premium',
  'svc_spa_wellness_program': 'spa-wellness-elite',
  // Travel tiers
  'svc-travel-standard': 'travel-concierge',
  'svc-travel-premium': 'travel-concierge-ultra',
  'svc_travel_standard': 'travel-concierge',
  'svc_travel_premium': 'travel-concierge-ultra',
  // Stylist tiers
  'svc-stylist-basic': 'personal-stylist',
  'svc-stylist-haute': 'personal-stylist-haute',
  'svc_stylist_basic': 'personal-stylist',
  'svc_stylist_haute': 'personal-stylist-haute',
  // Security tiers
  'svc-security-basic': 'personal-security',
  'svc-security-full': 'personal-security-team',
  'svc_security_basic': 'personal-security',
  'svc_security_full': 'personal-security-team',
  // Medical tiers
  'svc-medical-basic': 'concierge-medicine',
  'svc-medical-elite': 'concierge-medicine-elite',
  'svc_medical_basic': 'concierge-medicine',
  'svc_medical_elite': 'concierge-medicine-elite',
  // Chef tiers
  'svc-chef-basic': 'private-chef',
  'svc-chef-full': 'private-chef-team',
  'svc_chef_basic': 'private-chef',
  'svc_chef_full': 'private-chef-team',
  // Housekeeper tiers
  'svc-housekeeper-basic': 'housekeeper',
  'svc-housekeeper-estate': 'estate-manager',
  'svc_housekeeper_basic': 'housekeeper',
  'svc_housekeeper_estate': 'estate-manager',
}
const WARDROBE_IMAGE_MAP: Record<string, string> = {
  // Category fallbacks
  casual: 'casual-wear',
  business: 'business-suit',
  formal: 'tuxedo',
  sportswear: 'sportswear',
  accessories: 'designer-shoes',
  watches: 'tag-heuer',
  outerwear: 'designer-outerwear',
  // Per-item unique mappings
  'ward-casual-basic': 'casual-wear',
  'ward-casual-designer': 'casual-designer',
  'ward-business-suit': 'business-suit',
  'ward-business-bespoke': 'bespoke-suit',
  'ward-business-luxury': 'luxury-suit-collection',
  'ward-formal-tux': 'tuxedo',
  'ward-formal-bespoke': 'tuxedo',
  'ward-sport-basic': 'sportswear',
  'ward-sport-premium': 'sportswear-premium',
  'ward-acc-shoes': 'designer-shoes',
  'ward-acc-leather': 'luxury-leather-goods',
  'ward-acc-sunglasses': 'designer-sunglasses',
  'ward-watch-entry': 'tag-heuer',
  'ward-watch-mid': 'tag-heuer',
  'ward-watch-high': 'tag-heuer',
  'ward-watch-ultra': 'tag-heuer',
  'ward-outerwear': 'designer-outerwear',
  'ward-outerwear-couture': 'couture-outerwear',
  'ward-race-team': 'team-wear',
}
const DIET_TYPE_IMAGE_MAP: Record<string, string> = {
  standard: 'balanced-diet',
  athletic: 'athletic-diet',
  organic: 'organic-diet',
  gourmet: 'gourmet-diet',
  personalized: 'personalized-diet',
  elite_performance: 'elite-diet',
  'elite-performance': 'elite-diet',
}
const PROPERTY_TYPE_IMAGE_MAP: Record<string, string> = {
  house: 'house',
  apartment: 'apartment',
  penthouse: 'penthouse',
  villa: 'villa',
  mansion: 'mansion',
  beach_house: 'beach-house',
  'beach-house': 'beach-house',
  ski_chalet: 'ski-chalet',
  'ski-chalet': 'ski-chalet',
  commercial: 'commercial',
  land: 'land',
}

// City-specific property images: `type-city` -> filename (without .png)
const PROPERTY_CITY_IMAGE_MAP: Record<string, string> = {
  // Apartments
  'apartment-monaco': 'apartment-monaco', 'apartment-new-york': 'apartment-new-york',
  'apartment-paris': 'apartment-paris', 'apartment-dubai': 'apartment-dubai',
  'apartment-tokyo': 'apartment-tokyo', 'apartment-miami': 'apartment-miami',
  'apartment-barcelona': 'apartment-barcelona', 'apartment-amsterdam': 'apartment-amsterdam',
  'apartment-london': 'apartment-london', 'apartment-singapore': 'apartment-singapore',
  'apartment-lisbon': 'apartment-lisbon', 'apartment-berlin': 'apartment-berlin',
  // Houses
  'house-surrey': 'house-surrey', 'house-surrey-countryside': 'house-surrey',
  'house-munich': 'house-munich', 'house-los-angeles': 'house-los-angeles',
  'house-cape-town': 'house-cape-town', 'house-toronto': 'house-toronto',
  'house-melbourne': 'house-melbourne', 'house-oxford': 'house-oxford',
  'house-charlotte': 'house-charlotte',
  // Villas
  'villa-monaco': 'villa-monaco', 'villa-nice': 'villa-nice',
  'villa-lake-como': 'villa-lake-como', 'villa-marbella': 'villa-marbella',
  'villa-dubai': 'villa-dubai', 'villa-singapore': 'villa-singapore',
  'villa-sydney': 'villa-sydney', 'villa-algarve': 'villa-algarve',
  // Mansions
  'mansion-beverly-hills': 'mansion-beverly-hills', 'mansion-miami': 'mansion-miami',
  'mansion-dubai': 'mansion-dubai', 'mansion-marbella': 'mansion-marbella',
  'mansion-singapore': 'mansion-singapore', 'mansion-london': 'mansion-london',
  // Penthouses
  'penthouse-monaco': 'penthouse-monaco', 'penthouse-new-york': 'penthouse-new-york',
  'penthouse-dubai': 'penthouse-dubai', 'penthouse-singapore': 'penthouse-singapore',
  'penthouse-paris': 'penthouse-paris', 'penthouse-miami': 'penthouse-miami',
  'penthouse-tokyo': 'penthouse-tokyo', 'penthouse-sao-paulo': 'penthouse-sao-paulo',
  // Beach houses
  'beach-house-malibu': 'beach-house-malibu', 'beach_house-malibu': 'beach-house-malibu',
  'beach-house-sydney': 'beach-house-sydney', 'beach_house-sydney': 'beach-house-sydney',
  'beach-house-nice': 'beach-house-nice', 'beach_house-nice': 'beach-house-nice',
  'beach-house-sitges': 'beach-house-sitges', 'beach_house-sitges': 'beach-house-sitges',
  'beach-house-cancun': 'beach-house-cancun', 'beach_house-cancun': 'beach-house-cancun',
  // Other
  'ski-chalet-geneva': 'ski-chalet-geneva', 'ski_chalet-geneva': 'ski-chalet-geneva',
  'land-starnberg': 'land-starnberg',
  'commercial-london': 'commercial-london',
  land: 'land',
  primary_residence: 'house',
  vacation_home: 'villa',
}
const COURSE_CATEGORY_IMAGE_MAP: Record<string, string> = {
  business: 'business-strategy',
  leadership: 'executive-leadership',
  finance: 'investment-management',
  law: 'business-law',
  technology: 'ai-machine-learning',
  motorsport: 'motorsport-engineering',
  public_speaking: 'public-speaking',
  'public-speaking': 'public-speaking',
  mba: 'executive-mba',
  'executive-mba': 'executive-mba',
  'ai-machine-learning': 'ai-machine-learning',
  'business-law': 'business-law',
  'business-strategy': 'business-strategy',
  'executive-leadership': 'executive-leadership',
  'investment-management': 'investment-management',
  'motorsport-engineering': 'motorsport-engineering',
  'public-speaking': 'public-speaking',
}
const EXPERIENCE_IMAGE_MAP: Record<string, string> = {
  exp_vacation_resort: 'luxury-resort',
  exp_vacation_villa: 'private-villa',
  exp_vacation_safari: 'luxury-safari',
  exp_vacation_ski: 'ski-experience',
  exp_charter_jet_weekend: 'private-jet-weekend',
  exp_charter_yacht_week: 'yacht-charter',
  exp_charter_superyacht: 'superyacht',
  exp_event_f1: 'f1-paddock',
  exp_event_superbowl: 'superbowl-vip',
  exp_event_gala: 'charity-gala',
  exp_event_auction: 'art-basel-vip',
  exp_adventure_everest: 'everest-luxury-trek',
  exp_adventure_space: 'space-tourism',
}
const COLLECTIBLE_IMAGE_MAP: Record<string, string> = {
  // Watches — all unique
  col_watch_rolex: 'rolex-submariner',
  col_watch_patek_basic: 'patek-calatrava',
  col_watch_patek_nautilus: 'patek-nautilus',
  col_watch_richard_mille: 'richard-mille',
  // Wine — all unique
  col_wine_bordeaux: 'wine-bordeaux',
  col_wine_burgundy: 'wine-burgundy',
  col_wine_drc: 'wine-drc',
  col_wine_cellar: 'wine-legendary-cellar',
  // Art — all unique
  col_art_emerging: 'art-emerging',
  col_art_established: 'art-established',
  col_art_master: 'art-master',
  col_art_museum: 'art-museum-masterpiece',
  // Memorabilia — all unique
  col_memo_sports_signed: 'memorabilia-sports',
  col_memo_sports_jersey: 'championship-rings',
  col_memo_racing: 'historic-sports-artifact',
  // Jewelry — all unique
  col_jewelry_diamond: 'diamond-investment',
  col_jewelry_rare: 'fancy-colored-diamond',
  col_jewelry_royal: 'royal-jewelry',
  // Rare — all unique
  col_rare_books: 'rare-book',
  col_rare_coins: 'historic-coin-collection',
  col_rare_other: 'ancient-artifact',
}

// Per-item membership image mapping
const MEMBERSHIP_ITEM_IMAGE_MAP: Record<string, string> = {
  // Country club tiers
  'mem-country-club-basic': 'country-club',
  'mem-country-club-premium': 'country-club-premium',
  'mem-country-club-elite': 'country-club-elite',
  'mem_country_club_basic': 'country-club',
  'mem_country_club_premium': 'country-club-premium',
  'mem_country_club_elite': 'country-club-elite',
  // Yacht club tiers
  'mem-yacht-club': 'yacht-club',
  'mem-yacht-club-premium': 'yacht-club-monaco',
  'mem_yacht_club': 'yacht-club',
  'mem_yacht_club_premium': 'yacht-club-monaco',
  // Gym tiers
  'mem-private-gym': 'private-gym',
  'mem-private-gym-ultra': 'private-gym-ultra',
  'mem_private_gym': 'private-gym',
  'mem_private_gym_ultra': 'private-gym-ultra',
  // Aviation
  'mem-aviation': 'aviation-club',
  'mem_aviation': 'aviation-club',
  // Concierge tiers
  'mem-concierge': 'concierge-premium',
  'mem-concierge-ultra': 'concierge-ultra',
  'mem_concierge': 'concierge-premium',
  'mem_concierge_ultra': 'concierge-ultra',
  // Wine club
  'mem-wine-club': 'wine-club',
  'mem_wine_club': 'wine-club',
  // Car club
  'mem-car-club': 'car-club',
  'mem_car_club': 'car-club',
  // Social club
  'mem-social-club': 'social-club',
  'mem_social_club': 'social-club',
}

// Per-hobby image mapping with level support
const HOBBY_IMAGE_MAP: Record<string, string> = {
  // Golf levels
  'golf': 'golf-beginner',
  'golf-beginner': 'golf-beginner',
  'golf-intermediate': 'golf-intermediate',
  'golf-advanced': 'golf-advanced',
  // Yachting levels
  'yachting': 'yachting-beginner',
  'yachting-beginner': 'yachting-beginner',
  'yachting-intermediate': 'yachting-intermediate',
  'yachting-advanced': 'yachting-advanced',
  // Car collecting levels
  'car-collecting': 'car-collecting-beginner',
  'car_collecting': 'car-collecting-beginner',
  'car-collecting-beginner': 'car-collecting-beginner',
  'car-collecting-intermediate': 'car-collecting-intermediate',
  'car-collecting-advanced': 'car-collecting-advanced',
  // Horse racing levels
  'horse-racing': 'horse-racing-beginner',
  'horse_racing': 'horse-racing-beginner',
  'horse-racing-beginner': 'horse-racing-beginner',
  'horse-racing-intermediate': 'horse-racing-intermediate',
  'horse-racing-advanced': 'horse-racing-advanced',
  // Art collecting levels
  'art-collecting': 'art-collecting-beginner',
  'art_collecting': 'art-collecting-beginner',
  'art-collecting-beginner': 'art-collecting-beginner',
  'art-collecting-intermediate': 'art-collecting-intermediate',
  'art-collecting-advanced': 'art-collecting-advanced',
  // Wine collecting levels
  'wine-collecting': 'wine-collecting-beginner',
  'wine_collecting': 'wine-collecting-beginner',
  'wine-collecting-beginner': 'wine-collecting-beginner',
  'wine-collecting-intermediate': 'wine-collecting-intermediate',
  'wine-collecting-advanced': 'wine-collecting-advanced',
  // Flying levels
  'flying': 'flying-beginner',
  'flying-beginner': 'flying-beginner',
  'flying-intermediate': 'flying-intermediate',
  'flying-advanced': 'flying-advanced',
  // Fishing levels
  'fishing': 'fishing-beginner',
  'fishing-beginner': 'fishing-beginner',
  'fishing-intermediate': 'fishing-intermediate',
  'fishing-advanced': 'fishing-advanced',
  // Photography levels
  'photography': 'photography-beginner',
  'photography-beginner': 'photography-beginner',
  'photography-intermediate': 'photography-intermediate',
  'photography-advanced': 'photography-advanced',
  // Non-leveled hobbies
  'sim-racing': 'sim-racing',
  'sim_racing': 'sim-racing',
  'fitness': 'fitness',
  'cooking': 'cooking',
  'music': 'music',
  'art': 'art',
  'charity': 'charity-work',
}

/**
 * Resolve a catalog id/type to the lifestyle image filename (no path, no extension).
 * Use this when building CatalogGrid items so imageId matches files in lifestyle/<category>/.
 * 
 * Priority: per-item map (unique images) > category fallback > normalized ID > default
 */
export function getLifestyleImageId(
  category: string,
  catalogId: string,
  opts?: { type?: string; category?: string; tier?: string; level?: number; city?: string }
): string {
  const idNorm = catalogId.toLowerCase().replace(/_/g, '-')
  const typeNorm = opts?.type?.toLowerCase().replace(/_/g, '-')
  const catNorm = opts?.category?.toLowerCase().replace(/_/g, '-')

  switch (category) {
    case 'pets':
      return PET_IMAGE_MAP[catalogId] || idNorm || 'golden-retriever'
    case 'furnishings': {
      // Try per-item first (e.g., furn-living-luxury)
      const itemKey = FURNISHING_ITEM_IMAGE_MAP[idNorm] || FURNISHING_ITEM_IMAGE_MAP[catalogId]
      if (itemKey) return itemKey
      // Fall back to category + tier inference
      const byCat = (opts?.category || '').toLowerCase()
      const tier = opts?.tier || 'standard'
      // Try to build a tier-specific key from category
      if (byCat) {
        const tierKey = `${byCat.replace(/_/g, '-')}-${tier}`
        const byTier = FURNISHING_ITEM_IMAGE_MAP[`furn-${tierKey}`]
        if (byTier) return byTier
      }
      const key = FURNISHING_IMAGE_MAP[byCat] || FURNISHING_IMAGE_MAP[byCat.replace(/-/g, '_')]
      if (key) return key
      if (idNorm.includes('bedroom')) return 'bedroom-standard'
      if (idNorm.includes('dining')) return 'dining-room-standard'
      if (idNorm.includes('living')) return 'living-room-standard'
      if (idNorm.includes('office')) return 'home-office-standard'
      if (idNorm.includes('gym')) return 'home-gym-standard'
      if (idNorm.includes('theater')) return 'home-theater-standard'
      if (idNorm.includes('pool') || idNorm.includes('spa')) return 'pool-standard'
      if (idNorm.includes('wine')) return 'wine-cellar-standard'
      if (idNorm.includes('smart')) return 'smart-home-standard'
      if (idNorm.includes('outdoor')) return 'outdoor-standard'
      if (idNorm.includes('bathroom')) return 'bathroom-standard'
      if (idNorm.includes('garage')) return 'garage-standard'
      if (idNorm.includes('security')) return 'security-standard'
      return 'living-room-standard'
    }
    case 'services': {
      // Try per-item first
      const svcItem = SERVICE_ITEM_IMAGE_MAP[idNorm] || SERVICE_ITEM_IMAGE_MAP[catalogId]
      if (svcItem) return svcItem
      return SERVICE_TYPE_IMAGE_MAP[opts?.type || ''] || typeNorm || 'spa-wellness-basic'
    }
    case 'wardrobe':
      return WARDROBE_IMAGE_MAP[idNorm] || WARDROBE_IMAGE_MAP[opts?.category || ''] || WARDROBE_IMAGE_MAP[catNorm] || 'casual-wear'
    case 'diet':
      return DIET_TYPE_IMAGE_MAP[opts?.type || ''] || DIET_TYPE_IMAGE_MAP[catalogId.replace('diet_', '')] || typeNorm || 'balanced-diet'
    case 'properties': {
      // Try city-specific image first (e.g., apartment-monaco)
      const propType = opts?.type || ''
      const propCity = opts?.city || ''
      if (propType && propCity) {
        const cityKey = normalizeAssetKey(`${propType}-${propCity}`)
        if (PROPERTY_CITY_IMAGE_MAP[cityKey]) return PROPERTY_CITY_IMAGE_MAP[cityKey]
      }
      return PROPERTY_TYPE_IMAGE_MAP[propType] || PROPERTY_TYPE_IMAGE_MAP[opts?.category || ''] || PROPERTY_TYPE_IMAGE_MAP[idNorm.replace('prop-', '')] || typeNorm || 'house'
    }
    case 'courses':
      return COURSE_CATEGORY_IMAGE_MAP[opts?.category || ''] || COURSE_CATEGORY_IMAGE_MAP[idNorm.replace('course-', '')] || catNorm || 'business-strategy'
    case 'experiences':
      return EXPERIENCE_IMAGE_MAP[catalogId] || EXPERIENCE_IMAGE_MAP[idNorm.replace(/-/g, '_')] || idNorm.replace('exp-', '') || 'luxury-resort'
    case 'collectibles':
      return COLLECTIBLE_IMAGE_MAP[catalogId] || COLLECTIBLE_IMAGE_MAP[idNorm.replace(/-/g, '_')] || idNorm.replace('col-', '') || 'art-emerging'
    case 'memberships': {
      const memItem = MEMBERSHIP_ITEM_IMAGE_MAP[idNorm] || MEMBERSHIP_ITEM_IMAGE_MAP[catalogId]
      if (memItem) return memItem
      return idNorm || catNorm || 'country-club'
    }
    case 'hobbies': {
      // Try with level suffix first
      const level = opts?.level
      if (level !== undefined) {
        const levelName = level >= 70 ? 'advanced' : level >= 40 ? 'intermediate' : 'beginner'
        const hobbyLevelKey = `${idNorm}-${levelName}`
        const byLevel = HOBBY_IMAGE_MAP[hobbyLevelKey]
        if (byLevel) return byLevel
      }
      return HOBBY_IMAGE_MAP[idNorm] || HOBBY_IMAGE_MAP[catalogId] || idNorm || 'golf-beginner'
    }
    default:
      return idNorm || typeNorm || catNorm || ''
  }
}

/**
 * Map vehicle brand+model to image filename.
 */
const VEHICLE_IMAGE_MAP: Record<string, string> = {
  'porsche-911-gt3': 'porsche-911-gt3',
  'ferrari-296-gtb': 'ferrari-296-gtb',
  'mclaren-720s': 'mclaren-720s',
  'mercedes-amg-gt': 'mercedes-amg-gt',
  'bmw-m4-csl': 'bmw-m4-csl',
  'aston-martin-vantage': 'aston-martin-vantage',
  'lamborghini-huracan': 'lamborghini-huracan',
  'pagani-huayra': 'pagani-huayra',
  'bugatti-chiron': 'bugatti-chiron',
  'rolls-royce-ghost': 'rolls-royce-ghost',
  'bentley-continental-gt': 'bentley-continental',
  'range-rover-autobiography': 'range-rover',
  'range-rover-sv-autobiography': 'range-rover',
  'mercedes-g-wagon': 'g-wagon',
  'mercedes-g63-amg': 'g-wagon',
  'toyota-land-cruiser': 'land-cruiser',
  'tesla-model-s-plaid': 'tesla-model-s',
  'ford-gt': 'ford-gt',
  'audi-r8': 'audi-r8',
  'audi-r8-v10': 'audi-r8',
  'ferrari-250-gto': 'ferrari-250-gto',
  'shelby-cobra-427': 'shelby-cobra',
  'porsche-959': 'porsche-959',
  // Missing catalog vehicles
  'ford-mustang-gt': 'ford-mustang-gt',
  'chevrolet-corvette-stingray': 'chevrolet-corvette',
  'porsche-cayman-gts': 'porsche-cayman-gts',
  'aston-martin-db12': 'aston-martin-db12',
  'ferrari-roma': 'ferrari-roma',
  'lamborghini-revuelto': 'lamborghini-revuelto',
  'ferrari-sf90-stradale': 'ferrari-sf90',
  'ferrari-sf90': 'ferrari-sf90',
  'mclaren-speedtail': 'mclaren-speedtail',
  'koenigsegg-jesko': 'koenigsegg-jesko',
  'porsche-cayenne-turbo-gt': 'porsche-cayenne-turbo',
  'lamborghini-urus-performante': 'lamborghini-urus',
  'lamborghini-urus': 'lamborghini-urus',
  'porsche-taycan-turbo-s': 'porsche-taycan',
  'rimac-nevera': 'rimac-nevera',
  'rolls-royce-phantom': 'rolls-royce-phantom',
  'maybach-s680': 'maybach-s680',
  'mercedes-300sl-gullwing': 'mercedes-300sl',
  'ferrari-288-gto': 'ferrari-288-gto',
  // Starter vehicles
  'bmw-3-series': 'bmw-3-series',
  'mercedes-s-class': 'mercedes-s-class',
  'porsche-911-carrera': 'porsche-911-carrera',
  'bmw-m4': 'bmw-m4',
  'range-rover-sport': 'range-rover-sport',
}

/**
 * Get a vehicle image by brand+model string or vehicle id.
 */
export function getVehicleImage(brandModel: string): string {
  const key = normalizeAssetKey(brandModel)
  const imageId = VEHICLE_IMAGE_MAP[key] || key
  return getLifestyleImage('vehicles', imageId)
}

/**
 * Get a property image, optionally city-specific.
 * Falls back to generic type image if no city-specific image exists.
 * e.g., getPropertyImage('apartment', 'Monaco') -> apartment-monaco.png (if exists) -> apartment.png (fallback)
 */
export function getPropertyImage(propertyType: string, city?: string): string {
  if (city) {
    const cityKey = normalizeAssetKey(`${propertyType}-${city}`)
    const cityImage = PROPERTY_CITY_IMAGE_MAP[cityKey]
    if (cityImage) {
      return getLifestyleImage('properties', cityImage)
    }
  }
  // Fallback to generic type
  const typeKey = PROPERTY_TYPE_IMAGE_MAP[propertyType] || propertyType
  return getLifestyleImage('properties', typeKey)
}

/**
 * Map pet IDs to image filenames.
 */
const PET_IMAGE_MAP: Record<string, string> = {
  'pet_golden': 'golden-retriever',
  'pet_frenchie': 'french-bulldog',
  'pet_german_shepherd': 'german-shepherd',
  'pet_husky': 'husky',
  'pet_persian': 'persian-cat',
  'pet_bengal': 'bengal-cat',
  'pet_thoroughbred': 'thoroughbred',
  'pet_arabian': 'arabian-horse',
  'pet_parrot': 'macaw-parrot',
  'pet_aquarium': 'reef-aquarium',
  'pet_reptile': 'blue-iguana',
}

/**
 * Get a pet image by pet id.
 */
export function getPetImage(petId: string): string {
  const imageId = PET_IMAGE_MAP[petId] || petId
  return getLifestyleImage('pets', imageId)
}

/**
 * Get a collectible image by collectible id.
 */
export function getCollectibleImage(collectibleId: string): string {
  return getLifestyleImage('collectibles', collectibleId)
}

/**
 * Get an experience image by experience id.
 */
export function getExperienceImage(experienceId: string): string {
  return getLifestyleImage('experiences', experienceId)
}

/**
 * Get a membership image by membership id.
 */
export function getMembershipImage(membershipId: string): string {
  return getLifestyleImage('memberships', membershipId)
}

/**
 * Get a furnishing category image.
 */
export function getFurnishingImage(furnishingId: string): string {
  return getLifestyleImage('furnishings', furnishingId)
}

/**
 * Get a hobby image.
 */
export function getHobbyImage(hobbyId: string): string {
  return getLifestyleImage('hobbies', hobbyId)
}

/**
 * Get a diet plan image.
 */
export function getDietImage(dietId: string): string {
  return getLifestyleImage('diet', dietId)
}

/**
 * Get a course image.
 */
export function getCourseImage(courseId: string): string {
  return getLifestyleImage('courses', courseId)
}

/**
 * Get a service image.
 */
export function getServiceImage(serviceId: string): string {
  return getLifestyleImage('services', serviceId)
}

/**
 * Get a wardrobe image.
 */
export function getWardrobeImage(wardrobeId: string): string {
  return getLifestyleImage('wardrobe', wardrobeId)
}

// ============================================
// MISCELLANEOUS IMAGES
// ============================================

/**
 * Get a misc image by category and item id.
 */
export function getMiscImage(subcategory: string, itemId: string): string {
  return `${GENERATED_PATH}misc/${subcategory}/${itemId}.png`
}

/**
 * Map app merchandise IDs to published filenames (content studio outputs team-tshirt.png, etc.)
 */
const MERCHANDISE_IMAGE_MAP: Record<string, string> = {
  'merch-tshirt': 'team-tshirt',
  'merch-cap': 'team-cap',
  'merch-hoodie': 'team-hoodie',
  'merch-model-car': 'model-car',
  'merch-poster': 'race-poster',
  'merch-jacket': 'team-jacket',
  'merch-mug': 'team-mug',
  'merch-flag': 'team-flag',
  'merch-keychain': 'team-keychain',
  'merch-decal': 'team-decal',
}

/**
 * Get a merchandise product image.
 * Resolves app ids (e.g. merch-tshirt) to published filenames (team-tshirt.png).
 */
export function getMerchandiseImage(itemId: string): string {
  const filename = MERCHANDISE_IMAGE_MAP[itemId] ?? itemId
  return getMiscImage('merchandise', filename)
}

/**
 * Get a manufacturing facility image by level (1-5).
 */
export function getManufacturingImage(level: number): string {
  const levelNames = ['factory-basic', 'factory-improved', 'factory-professional', 'factory-elite', 'factory-world-class']
  return getMiscImage('manufacturing', levelNames[Math.min(level - 1, 4)] || 'factory-basic')
}

/**
 * Get a weather condition image.
 */
export function getWeatherImage(condition: string): string {
  return getMiscImage('weather', `weather-${condition}`)
}

/**
 * Get a news thumbnail image.
 */
export function getNewsImage(newsType: string): string {
  return getMiscImage('news', `news-${newsType}`)
}

/**
 * Get a celebration image.
 */
export function getCelebrationImage(celebrationType: string): string {
  return getMiscImage('celebrations', celebrationType)
}

// Export the manifest for direct access if needed
export { manifest as generatedManifest }
