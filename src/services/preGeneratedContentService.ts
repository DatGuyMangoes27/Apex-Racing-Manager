/**
 * Pre-Generated Content Service
 *
 * Central service that bulk-loads ALL pre-generated Content Studio data into
 * memory at career creation (behind a loading screen) and provides O(1)
 * lookups for staff, partners, contacts, narratives, pre-race commentary,
 * and portraits.
 *
 * Key design decisions:
 *   - Upfront bulk loading (~35 MB JSON — trivial for desktop Electron app)
 *   - Indexed Maps for O(1) access during gameplay — zero disk I/O while playing
 *   - Used-ID tracking to prevent duplicates within a career session
 *   - Graceful fallback: if pool exhausted or data missing, returns null so
 *     callers can fall back to existing runtime generation
 */

import { CONTENT_MANIFEST } from '@/data/content-manifest'
import type { Sponsor, SponsorCategory } from '@/data/sponsors'

// ============================================================
// Types — mirror Content Studio output shapes
// ============================================================

export interface PreGenPhysicalDescription {
  skinTone: string
  hairColor: string
  hairStyle: string
  eyeColor: string
  facialHair: string | null
  description: string
}

export interface PreGenStaffProfile {
  id: string
  name: string
  nationality: string
  age: number
  gender: string
  role: string
  bio: string
  physical: PreGenPhysicalDescription
  personality: string
  quirks: string[]
  skills?: Record<string, number>
  hasImage: boolean
  imagePath?: string
}

export interface PreGenPartnerProfile {
  id: string
  name: string
  nationality: string
  age: number
  gender: string
  bio: string
  physical: PreGenPhysicalDescription
  career: string
  traits: string[]
  interests: string[]
  style: string
  educationLevel: string
  wealthLevel: string
  socialCircle: string
  desires: {
    wantsChildren: boolean
    desiredChildrenCount: number
    wantsMarriage: boolean
    lifestyleExpectations: string
    qualityTimeImportance: number
    socialLifeImportance: number
    privacyImportance: number
  }
  meetingContext: string
  firstImpression: string
  dealBreakers: string[]
  loveLanguage: string
  hasImage: boolean
  imagePath?: string
}

export interface PreGenContactProfile {
  id: string
  name: string
  nationality: string
  age: number
  gender: string
  contactType: string
  bio: string
  physical: PreGenPhysicalDescription
  traits: string[]
  interests: string[]
  educationLevel: string
  wealthLevel: string
  socialCircle: string
  connectionToMotorsport: string
  meetingContext: string
  conversationTopics: string[]
  canHelp: string[]
  personalitySummary: string
  hasImage: boolean
  imagePath?: string
}

export interface PreGenDriverNarrative {
  id: string
  [key: string]: unknown  // narrative fields vary by generator version
}

export interface PreGenTeamNarrative {
  id: string
  origin: string
  philosophy: string
  achievements: string[]
  teamPrincipal: { name: string; background: string; nationality: string }
  keyFigures: { name: string; role: string; description: string }[]
  headquarters: string
  reputation: string
  fanBase: string
  [key: string]: unknown
}

export interface PreGenPreRaceContent {
  id: string
  atmosphereSnippets: string[]
  driverSnippets: string[]
  strategyPoints: string[]
  historicalReferences: string[]
  weatherCommentary: string[]
  gridWalkQuotes: string[]
  cornerCallouts?: string[]
}

export interface PreGenTrackNarrative {
  id: string
  history?: string
  atmosphere?: string
  trackCharacter?: string
  nickname?: string
  famousCorners?: Array<{ name?: string; description?: string; challenge?: string }>
  keyFactors?: string[]
  overtakingSpots?: string[]
  historySnippets?: string[]
  weatherNotes?: string
  drivingAdvice?: string
  famousRaces?: string[]
  localCulture?: string
  [key: string]: unknown
}

// ============================================================
// Service state — module-level singleton
// ============================================================

let loaded = false
let loading = false
let loadingPromise: Promise<{ success: boolean; stats: Record<string, number> }> | null = null
let sponsorWarningLogged = false

// Indexed pools
const staffPool: PreGenStaffProfile[] = []
const staffByRole = new Map<string, PreGenStaffProfile[]>()

const partnerPool: PreGenPartnerProfile[] = []

const contactPool: PreGenContactProfile[] = []
const contactsByType = new Map<string, PreGenContactProfile[]>()

const driverNarratives = new Map<string, PreGenDriverNarrative>()
const teamNarratives = new Map<string, PreGenTeamNarrative>()
const preRacePools = new Map<string, PreGenPreRaceContent>()
const trackNarratives = new Map<string, PreGenTrackNarrative>()

const sponsorPool: Sponsor[] = []
const sponsorById = new Map<string, Sponsor>()

// Used-ID tracking (prevents duplicates within a career)
const usedStaffIds = new Set<string>()
const usedPartnerIds = new Set<string>()
const usedContactIds = new Set<string>()

// ============================================================
// Loading
// ============================================================

// Resolve data paths relative to app base so packaged exe (file://) finds public/data/
const DATA_BASE = (import.meta.env.BASE_URL || './').replace(/\/?$/, '/')

/**
 * Fetch a pre-built bundle file that contains all items for a category as a JSON array.
 * Falls back to individual-file fetching if the bundle doesn't exist.
 *
 * Bundle files are generated by `scripts/bundle-content.js` and live at
 * `public/data/<category>.bundle.json`.
 */
async function fetchBundle<T>(basePath: string, ids: string[]): Promise<T[]> {
  try {
    // basePath looks like "/data/staff-pool" — derive bundle name from the last segment
    const dirName = basePath.replace(/^\//, '').split('/').pop() // e.g. "staff-pool"
    const url = `${DATA_BASE}data/${dirName}.bundle.json`
    const resp = await fetch(url)
    if (resp.ok) {
      const items = await resp.json() as T[]
      if (Array.isArray(items) && items.length > 0) {
        // Assign IDs from manifest if items don't have them (bundle arrays are ordered to match ids)
        for (let i = 0; i < items.length; i++) {
          const item = items[i] as T & { id?: string }
          if (!item.id && ids[i]) {
            item.id = ids[i]
          }
        }
        return items
      }
    }
  } catch {
    // bundle fetch failed — fall through to individual fetching
  }

  // Fallback: fetch individual files (legacy path, much slower)
  console.warn(`[PreGenContent] Bundle not found for ${basePath}, falling back to individual fetches...`)
  const results: T[] = []
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50)
    const chunkResults = await Promise.all(
      chunk.map(async (id) => {
        try {
          const relativePath = basePath.replace(/^\//, '')
          const url = `${DATA_BASE}${relativePath}/${id}.json`
          const resp = await fetch(url)
          if (!resp.ok) return null
          const data = await resp.json() as T & { id?: string }
          if (data && !data.id) (data as any).id = id
          return data
        } catch {
          return null
        }
      })
    )
    for (const item of chunkResults) {
      if (item) results.push(item)
    }
  }
  return results
}

/**
 * Bulk-load ALL pre-generated content into memory.
 * Call once at career creation behind a loading screen.
 * Uses parallel batch loading (~50 concurrent requests) for speed.
 *
 * Safe to call concurrently — all callers share the same promise.
 *
 * @param onProgress  Optional callback: (loaded, total, category) for UI progress bar
 */
export async function loadAllPreGeneratedContent(
  onProgress?: (loaded: number, total: number, category: string) => void
): Promise<{ success: boolean; stats: Record<string, number> }> {
  if (loaded) return { success: true, stats: getStats() }

  // If another call is already loading, share the same promise
  if (loading && loadingPromise) {
    return loadingPromise
  }

  loading = true

  // Create and store the loading promise so concurrent callers share it
  loadingPromise = _doLoad(onProgress)

  try {
    return await loadingPromise
  } finally {
    loadingPromise = null
  }
}

async function _doLoad(
  onProgress?: (loaded: number, total: number, category: string) => void
): Promise<{ success: boolean; stats: Record<string, number> }> {
  const manifest = CONTENT_MANIFEST as typeof CONTENT_MANIFEST & {
    sponsors?: { ids: string[]; count: number; basePath: string }
  }
  const sponsorCount = manifest.sponsors?.count ?? 0
  const totalItems =
    manifest.staff.count +
    manifest.partners.count +
    manifest.contacts.count +
    manifest.driverNarratives.count +
    manifest.teamNarratives.count +
    manifest.preracePools.count +
    sponsorCount
  let loadedCount = 0

  const report = (category: string, count: number = 1) => {
    loadedCount += count
    onProgress?.(loadedCount, totalItems, category)
  }

  try {
    console.log(`[PreGenContent] Starting bundle load (total items: ${totalItems})...`)
    const t0 = performance.now()

    // Fetch all 8 bundles in parallel (8 HTTP requests instead of 8,219)
    const [
      staffItems,
      partnerItems,
      contactItems,
      driverItems,
      teamItems,
      preraceItems,
      trackItems,
      sponsorItems,
    ] = await Promise.all([
      fetchBundle<PreGenStaffProfile>(manifest.staff.basePath, manifest.staff.ids),
      fetchBundle<PreGenPartnerProfile>(manifest.partners.basePath, manifest.partners.ids),
      fetchBundle<PreGenContactProfile>(manifest.contacts.basePath, manifest.contacts.ids),
      fetchBundle<PreGenDriverNarrative>(manifest.driverNarratives.basePath, manifest.driverNarratives.ids),
      fetchBundle<PreGenTeamNarrative>(manifest.teamNarratives.basePath, manifest.teamNarratives.ids),
      fetchBundle<PreGenPreRaceContent>(manifest.preracePools.basePath, manifest.preracePools.ids),
      manifest.trackNarratives?.ids?.length
        ? fetchBundle<PreGenTrackNarrative>(manifest.trackNarratives.basePath, manifest.trackNarratives.ids)
        : Promise.resolve([] as PreGenTrackNarrative[]),
      manifest.sponsors?.ids?.length
        ? fetchBundle<Sponsor>(manifest.sponsors.basePath, manifest.sponsors.ids)
        : Promise.resolve([] as Sponsor[]),
    ])

    // ── Index Staff ──
    for (const data of staffItems) {
      staffPool.push(data)
      const role = data.role || 'unknown'
      if (!staffByRole.has(role)) staffByRole.set(role, [])
      staffByRole.get(role)!.push(data)
    }
    report('staff', staffItems.length)

    // ── Index Partners ──
    for (const data of partnerItems) {
      partnerPool.push(data)
    }
    report('partners', partnerItems.length)

    // ── Index Contacts ──
    for (const data of contactItems) {
      contactPool.push(data)
      const type = data.contactType || 'unknown'
      if (!contactsByType.has(type)) contactsByType.set(type, [])
      contactsByType.get(type)!.push(data)
    }
    report('contacts', contactItems.length)

    // ── Index Driver narratives ──
    for (const data of driverItems) {
      const id = data.id || ''
      const driverId = id.replace(/^driver-/, '')
      driverNarratives.set(driverId, data)
      driverNarratives.set(id, data)
      // Also index by normalized name for fuzzy lookup (game IDs differ from pre-gen IDs)
      const namePart = driverId.replace(/-[a-z]{2,3}$/, '').replace(/-/g, ' ').toLowerCase().trim()
      if (namePart) driverNarratives.set(`name:${namePart}`, data)
    }
    report('driverNarratives', driverItems.length)

    // ── Index Team narratives ──
    for (const data of teamItems) {
      const id = data.id || ''
      const teamId = id.replace(/^team-/, '')
      teamNarratives.set(teamId, data)
      teamNarratives.set(id, data)
      // Also index by normalized name for fuzzy lookup (game IDs differ from pre-gen IDs)
      const namePart = teamId.replace(/-/g, ' ').toLowerCase().trim()
      if (namePart) teamNarratives.set(`name:${namePart}`, data)
    }
    report('teamNarratives', teamItems.length)

    // ── Index Pre-race pools ──
    for (const data of preraceItems) {
      const id = data.id || ''
      const trackId = id.replace(/^prerace-/, '')
      preRacePools.set(trackId, data)
      preRacePools.set(id, data)
    }
    report('preracePools', preraceItems.length)

    // ── Index Track narratives ──
    for (const data of trackItems) {
      const id = data.id || ''
      const trackId = id.replace(/^track-/, '')
      trackNarratives.set(trackId, data)
      trackNarratives.set(id, data)
    }
    report('trackNarratives', trackItems.length)

    // ── Index Sponsors ──
    let sponsorValidationFails = 0
    for (const data of sponsorItems) {
      if (data.id && data.name && data.category && data.tier && data.country && data.paymentTiers && data.requirements) {
        sponsorPool.push(data)
        sponsorById.set(data.id, data)
      } else {
        sponsorValidationFails++
      }
    }
    report('sponsors', sponsorItems.length)
    if (sponsorValidationFails > 0) {
      console.warn(`[PreGenContent] Sponsor validation failures: ${sponsorValidationFails} out of ${sponsorItems.length}`)
    }
    if (!manifest.sponsors?.ids?.length) {
      console.warn('[PreGenContent] No sponsors section in manifest or empty ids list')
    }

    loaded = true
    loading = false
    sponsorWarningLogged = false

    const elapsed = ((performance.now() - t0) / 1000).toFixed(1)
    const stats = getStats()
    console.log(`[PreGenContent] Loaded in ${elapsed}s: ${stats.staff} staff, ${stats.partners} partners, ${stats.contacts} contacts, ${stats.sponsors} sponsors, ${stats.driverNarratives} driver narr., ${stats.teamNarratives} team narr., ${stats.preracePools} prerace pools`)
    return { success: true, stats }
  } catch (err) {
    console.error('[PreGenContent] Failed to load pre-generated content:', err)
    loading = false
    return { success: false, stats: getStats() }
  }
}

export function isContentLoaded(): boolean {
  return loaded
}

/**
 * Ensure content is loaded. If not loaded yet, triggers loading and returns when done.
 * Safe to call multiple times - will wait for in-progress loading or return immediately if loaded.
 * Returns true if content is available.
 */
export async function ensureContentLoaded(): Promise<boolean> {
  if (loaded) return true
  const result = await loadAllPreGeneratedContent()
  return result.success
}

function getStats(): Record<string, number> {
  return {
    staff: staffPool.length,
    partners: partnerPool.length,
    contacts: contactPool.length,
    sponsors: sponsorPool.length,
    driverNarratives: driverNarratives.size / 2,  // double-indexed
    teamNarratives: teamNarratives.size / 2,
    preracePools: preRacePools.size / 2,
    trackNarratives: trackNarratives.size / 2
  }
}

// ============================================================
// Random selection helpers (with used-ID tracking)
// ============================================================

function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickRandomUnused<T extends { id: string }>(
  pool: T[],
  usedIds: Set<string>
): T | null {
  const available = pool.filter(item => !usedIds.has(item.id))
  if (available.length === 0) return null
  const pick = available[Math.floor(Math.random() * available.length)]
  usedIds.add(pick.id)
  return pick
}

// ============================================================
// Staff Pool API
// ============================================================

/**
 * Get a random pre-generated staff member, optionally filtered by role.
 * Returns null if pool is exhausted (caller should fall back to runtime generation).
 */
export function getRandomStaff(role?: string, count: number = 1): PreGenStaffProfile[] {
  if (!loaded) return []
  const pool = role ? (staffByRole.get(role) || []) : staffPool
  const results: PreGenStaffProfile[] = []

  for (let i = 0; i < count; i++) {
    const pick = pickRandomUnused(pool, usedStaffIds)
    if (pick) results.push(pick)
    else break  // pool exhausted
  }
  return results
}

/**
 * Get a specific staff profile by ID.
 */
export function getStaffById(id: string): PreGenStaffProfile | null {
  if (!loaded) return null
  return staffPool.find(s => s.id === id) || null
}

/**
 * Get a pre-generated staff profile by exact name (for backfilling bios on runtime-generated staff).
 */
export function getStaffByName(name: string): PreGenStaffProfile | null {
  if (!loaded || !name?.trim()) return null
  const normalized = name.trim()
  return staffPool.find(s => s.name?.trim() === normalized) || null
}

/**
 * Get all available (unused) staff IDs for a given role.
 */
export function getAvailableStaffCount(role?: string): number {
  if (!loaded) return 0
  const pool = role ? (staffByRole.get(role) || []) : staffPool
  return pool.filter(s => !usedStaffIds.has(s.id)).length
}

// ============================================================
// Partner Pool API
// ============================================================

/**
 * Get a random pre-generated partner profile.
 * Returns null if pool is exhausted.
 */
export function getRandomPartner(): PreGenPartnerProfile | null {
  if (!loaded) return null
  return pickRandomUnused(partnerPool, usedPartnerIds)
}

/**
 * Get a random partner filtered by gender.
 */
export function getRandomPartnerByGender(gender: string): PreGenPartnerProfile | null {
  if (!loaded) return null
  const genderPool = partnerPool.filter(p => p.gender === gender && !usedPartnerIds.has(p.id))
  if (genderPool.length === 0) return null
  const pick = genderPool[Math.floor(Math.random() * genderPool.length)]
  usedPartnerIds.add(pick.id)
  return pick
}

/**
 * Get a specific partner profile by ID.
 */
export function getPartnerById(id: string): PreGenPartnerProfile | null {
  if (!loaded) return null
  return partnerPool.find(p => p.id === id) || null
}

export function getAvailablePartnerCount(): number {
  if (!loaded) return 0
  return partnerPool.filter(p => !usedPartnerIds.has(p.id)).length
}

/**
 * Pull N partner profiles to seed as stealth-romanceable friend contacts.
 * Marks them as used so they won't appear again as dating encounters.
 * Uses the player's datingPreference to pick appropriate genders.
 */
export function getRandomPartnersForFriendSeeding(
  count: number,
  preferredGenders: ('male' | 'female')[]
): PreGenPartnerProfile[] {
  if (!loaded) return []
  const results: PreGenPartnerProfile[] = []
  
  for (let i = 0; i < count; i++) {
    // Alternate through preferred genders
    const gender = preferredGenders[i % preferredGenders.length]
    const available = partnerPool.filter(p => 
      p.gender === gender && !usedPartnerIds.has(p.id)
    )
    if (available.length === 0) continue
    
    const pick = available[Math.floor(Math.random() * available.length)]
    usedPartnerIds.add(pick.id)
    results.push(pick)
  }
  
  return results
}

// ============================================================
// Contact Pool API
// ============================================================

/**
 * Get a random pre-generated contact profile, optionally filtered by type.
 * Returns null if pool is exhausted.
 */
export function getRandomContact(type?: string): PreGenContactProfile | null {
  if (!loaded) return null
  const pool = type ? (contactsByType.get(type) || []) : contactPool
  return pickRandomUnused(pool, usedContactIds)
}

/**
 * Get a random contact filtered by gender and optionally type.
 */
export function getRandomContactByGender(
  gender: string,
  type?: string
): PreGenContactProfile | null {
  if (!loaded) return null
  const basePool = type ? (contactsByType.get(type) || []) : contactPool
  const genderPool = basePool.filter(c => c.gender === gender && !usedContactIds.has(c.id))
  if (genderPool.length === 0) return null
  const pick = genderPool[Math.floor(Math.random() * genderPool.length)]
  usedContactIds.add(pick.id)
  return pick
}

/**
 * Get a specific contact profile by ID.
 */
export function getContactById(id: string): PreGenContactProfile | null {
  if (!loaded) return null
  return contactPool.find(c => c.id === id) || null
}

export function getAvailableContactCount(type?: string): number {
  if (!loaded) return 0
  const pool = type ? (contactsByType.get(type) || []) : contactPool
  return pool.filter(c => !usedContactIds.has(c.id)).length
}

// ============================================================
// Sponsor Pool API (sole source for gameplay — no static list)
// ============================================================

/**
 * Get all loaded sponsors. Returns empty array if not yet loaded or no sponsor-pool in manifest.
 */
export function getSponsors(): Sponsor[] {
  if (!loaded) {
    if (!sponsorWarningLogged) {
      console.warn('[PreGenContent] getSponsors() called but content not loaded yet — will return empty until loading completes')
      sponsorWarningLogged = true
    }
    return []
  }
  return sponsorPool
}

/**
 * Get sponsor count (even during loading, for diagnostics).
 */
export function getSponsorCount(): number {
  return sponsorPool.length
}

/**
 * Get a sponsor by ID. Returns null if not found.
 */
export function getSponsorById(id: string): Sponsor | null {
  if (!loaded) return null
  return sponsorById.get(id) ?? sponsorPool.find(s => s.id === id) ?? null
}

/**
 * Get the logo path for a sponsor (from loaded profile imagePath). Returns empty string if none.
 */
export function getSponsorLogoPath(sponsorId: string): string {
  const sponsor = getSponsorById(sponsorId)
  if (!sponsor?.imagePath) return ''
  return `${DATA_BASE}images/generated/${sponsor.imagePath}`
}

/** Get all sponsors in a category. */
export function getSponsorsByCategory(category: SponsorCategory): Sponsor[] {
  return getSponsors().filter(s => s.category === category)
}

/** Get all sponsors in a tier. */
export function getSponsorsByTier(tier: import('@/data/sponsors').SponsorTier): Sponsor[] {
  return getSponsors().filter(s => s.tier === tier)
}

/** Get all unique categories from loaded sponsors. */
export function getSponsorCategories(): SponsorCategory[] {
  const cats = new Set(getSponsors().map(s => s.category))
  return [...cats]
}

// ============================================================
// Narrative Lookups (O(1) by ID)
// ============================================================

/**
 * Get the pre-generated driver narrative for a given driver ID.
 * Returns null if not found — caller should fall back to Gemini.
 */
export function getDriverNarrative(driverId: string): PreGenDriverNarrative | null {
  if (!loaded) return null
  return driverNarratives.get(driverId) || null
}

/**
 * Fuzzy lookup by driver name (firstName + lastName).
 * Falls back to name-based index when exact ID match fails.
 */
export function getDriverNarrativeByName(firstName: string, lastName: string): PreGenDriverNarrative | null {
  if (!loaded) return null
  const key = `name:${firstName} ${lastName}`.toLowerCase().trim()
  return driverNarratives.get(key) || null
}

/**
 * Get the pre-generated team narrative for a given team ID.
 * Returns null if not found — caller should fall back to Gemini.
 */
export function getTeamNarrative(teamId: string): PreGenTeamNarrative | null {
  if (!loaded) return null
  return teamNarratives.get(teamId) || null
}

/**
 * Fuzzy lookup by team name.
 * Falls back to name-based index when exact ID match fails.
 */
export function getTeamNarrativeByName(teamName: string): PreGenTeamNarrative | null {
  if (!loaded || !teamName) return null
  const key = `name:${teamName}`.toLowerCase().trim()
  return teamNarratives.get(key) || null
}

/**
 * Get the pre-generated pre-race commentary pool for a given track+layout.
 * Tries layout-specific key first (e.g. "silverstone--gp"), falls back to venue-only key.
 */
export function getPreRacePool(trackId: string, layoutId?: string): PreGenPreRaceContent | null {
  if (!loaded) return null
  if (layoutId) {
    const layoutKey = `${trackId}--${layoutId}`
    const result = preRacePools.get(layoutKey)
    if (result) return result
  }
  return preRacePools.get(trackId) || null
}

/**
 * Check if we have a pre-generated narrative for a specific driver.
 */
export function hasDriverNarrative(driverId: string): boolean {
  return driverNarratives.has(driverId)
}

/**
 * Check if we have a pre-generated narrative for a specific team.
 */
export function hasTeamNarrative(teamId: string): boolean {
  return teamNarratives.has(teamId)
}

/**
 * Check if we have a pre-generated pre-race pool for a specific track.
 */
export function hasPreRacePool(trackId: string): boolean {
  return preRacePools.has(trackId)
}

/**
 * Get the pre-generated track narrative for a given track+layout.
 * Tries layout-specific key first (e.g. "silverstone--gp"), falls back to venue-only key.
 */
export function getTrackNarrativeFromPreGen(trackId: string, layoutId?: string): PreGenTrackNarrative | null {
  if (!loaded) return null
  if (layoutId) {
    const layoutKey = `${trackId}--${layoutId}`
    const result = trackNarratives.get(layoutKey)
    if (result) return result
  }
  return trackNarratives.get(trackId) || null
}

// ============================================================
// Portrait Matching
// ============================================================

/**
 * Get the portrait path for a pre-generated entity by its ID.
 * Returns null if no portrait is mapped.
 * Supports both key styles: "partner-0000" and "partner-0000.png" (legacy manifest).
 */
export function getPreGenPortrait(entityId: string): string | null {
  const portraits = CONTENT_MANIFEST.portraits as Record<string, string>
  const rel = portraits[entityId] ?? portraits[`${entityId}.png`]
  if (!rel) return null
  return `/images/generated/${rel}`
}

// ============================================================
// Bio Extraction — extract SocialBio-shaped data from pre-generated profiles
// ============================================================

export interface PreGenSocialBio {
  background: string
  careerNarrative: string
  anecdotes: string[]
  personalityDescription: string
  lifeSituation: string
}

/**
 * Extract a SocialBio-compatible object from a pre-generated staff profile.
 */
export function extractStaffBio(staff: PreGenStaffProfile): PreGenSocialBio {
  return {
    background: staff.bio || '',
    careerNarrative: `Works as a ${staff.role.replace(/_/g, ' ')} in the motorsport industry.`,
    anecdotes: staff.quirks || [],
    personalityDescription: staff.personality
      ? `Known for being ${staff.personality}. ${staff.bio?.split('.').slice(0, 2).join('.') || ''}`
      : staff.bio || '',
    lifeSituation: `Currently based in ${staff.nationality}, age ${staff.age}.`
  }
}

/**
 * Extract a SocialBio-compatible object from a pre-generated partner profile.
 */
export function extractPartnerBio(partner: PreGenPartnerProfile): PreGenSocialBio {
  return {
    background: partner.bio || '',
    careerNarrative: partner.career
      ? `Works in ${partner.career.replace(/_/g, ' ')}.`
      : '',
    anecdotes: partner.dealBreakers?.length
      ? [`Love language: ${partner.loveLanguage}`, ...partner.interests.slice(0, 2)]
      : partner.interests.slice(0, 3),
    personalityDescription: partner.firstImpression || partner.bio || '',
    lifeSituation: partner.meetingContext || ''
  }
}

/**
 * Extract a SocialBio-compatible object from a pre-generated contact profile.
 */
export function extractContactBio(contact: PreGenContactProfile): PreGenSocialBio {
  return {
    background: contact.bio || '',
    careerNarrative: contact.connectionToMotorsport || '',
    anecdotes: contact.conversationTopics?.slice(0, 3) || [],
    personalityDescription: contact.personalitySummary || contact.bio || '',
    lifeSituation: contact.meetingContext || ''
  }
}

// ============================================================
// Used-ID Persistence (for save/load)
// ============================================================

export interface UsedContentIds {
  staff: string[]
  partners: string[]
  contacts: string[]
}

/**
 * Get the current used-ID sets for persistence in the save game.
 */
export function getUsedIds(): UsedContentIds {
  return {
    staff: [...usedStaffIds],
    partners: [...usedPartnerIds],
    contacts: [...usedContactIds]
  }
}

/**
 * Restore used-ID sets from a save game.
 */
export function restoreUsedIds(ids: UsedContentIds): void {
  usedStaffIds.clear()
  usedPartnerIds.clear()
  usedContactIds.clear()

  if (ids.staff) ids.staff.forEach(id => usedStaffIds.add(id))
  if (ids.partners) ids.partners.forEach(id => usedPartnerIds.add(id))
  if (ids.contacts) ids.contacts.forEach(id => usedContactIds.add(id))

  console.log(`[PreGenContent] Restored used IDs: ${usedStaffIds.size} staff, ${usedPartnerIds.size} partners, ${usedContactIds.size} contacts`)
}

/**
 * Mark a specific entity ID as used (e.g. when assigned during gameplay).
 */
export function markAsUsed(category: 'staff' | 'partners' | 'contacts', id: string): void {
  switch (category) {
    case 'staff': usedStaffIds.add(id); break
    case 'partners': usedPartnerIds.add(id); break
    case 'contacts': usedContactIds.add(id); break
  }
}

/**
 * Release a previously-used entity ID back into the available pool.
 * Used during career creation "reroll" to swap a pre-picked contact for another.
 */
export function releaseUsedId(category: 'staff' | 'partners' | 'contacts', id: string): void {
  switch (category) {
    case 'staff': usedStaffIds.delete(id); break
    case 'partners': usedPartnerIds.delete(id); break
    case 'contacts': usedContactIds.delete(id); break
  }
}

/**
 * Reset all used IDs (for new career).
 */
export function resetUsedIds(): void {
  usedStaffIds.clear()
  usedPartnerIds.clear()
  usedContactIds.clear()
}

/**
 * Unload all content from memory (cleanup).
 */
export function unloadContent(): void {
  staffPool.length = 0
  staffByRole.clear()
  partnerPool.length = 0
  contactPool.length = 0
  contactsByType.clear()
  driverNarratives.clear()
  teamNarratives.clear()
  preRacePools.clear()
  trackNarratives.clear()
  sponsorPool.length = 0
  sponsorById.clear()
  resetUsedIds()
  loaded = false
  loading = false
  loadingPromise = null
  sponsorWarningLogged = false
  console.log('[PreGenContent] Unloaded all content')
}
