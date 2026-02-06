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
  return ''
}

// ============================================
// STAFF PORTRAITS
// ============================================

// Cached gender-indexed staff lists for fast portrait lookup
let _maleStaffAssets: StaffAsset[] | null = null
let _femaleStaffAssets: StaffAsset[] | null = null

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
 * Uses a hash of the seed to always pick the same portrait for the same input.
 * Returns a manifest staff ID (e.g. "staff-team-0042") that can be resolved to a path.
 */
export function getPortraitIdByGender(gender: 'male' | 'female', seed: string): string {
  const assets = getStaffAssetsByGender(gender)
  if (assets.length === 0) {
    // Fallback: try all staff if gender-specific list is empty
    const allStaff = Object.values(manifest.personal?.staff || {})
    if (allStaff.length === 0) return ''
    const idx = hashForPortrait(seed) % allStaff.length
    return allStaff[idx].id
  }
  const idx = hashForPortrait(seed) % assets.length
  return assets[idx].id
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
 * Get a random staff portrait for a given role (legacy - non-deterministic)
 */
export function getRandomStaffPortraitByRole(role: string): string {
  const staffWithRole = getStaffByRole(role)
  if (staffWithRole.length === 0) return ''
  
  const randomIndex = Math.floor(Math.random() * staffWithRole.length)
  const staff = staffWithRole[randomIndex]
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

// Export the manifest for direct access if needed
export { manifest as generatedManifest }
