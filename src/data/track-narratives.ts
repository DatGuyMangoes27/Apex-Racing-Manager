/**
 * Track Narrative System
 * 
 * Rich narrative content for tracks to enable TV broadcast-style commentary.
 * Generated via AI when first visiting a track, then cached for reuse.
 */

// ============================================================================
// TRACK NARRATIVE INTERFACES
// ============================================================================

export interface FamousCorner {
  name: string              // "Copse", "Maggots-Beckets", "Stowe"
  description: string       // "One of the fastest corners in motorsport..."
  sectorPosition: 1 | 2 | 3 // Which sector this corner is in
  cornerNumber?: number     // Official corner number if applicable
  difficulty?: 'easy' | 'medium' | 'hard' | 'extreme'
}

export interface NotableMoment {
  year: number
  description: string       // "Mansell's incredible comeback drive"
  category?: 'overtake' | 'crash' | 'weather' | 'finish' | 'controversy' | 'record'
}

export interface SectorNotes {
  sector1: string           // Commentary about sector 1
  sector2: string           // Commentary about sector 2  
  sector3: string           // Commentary about sector 3
}

export interface TrackNarrative {
  trackId: string
  
  // === ATMOSPHERE & CHARACTER ===
  atmosphere: string          // "The cathedral of speed, steeped in history..."
  trackCharacter: string      // "Fast, flowing, rewards brave driving"
  nickname?: string           // "The Temple of Speed", "The Green Hell"
  
  // === FAMOUS CORNERS ===
  famousCorners: FamousCorner[]
  
  // === HISTORY ===
  historySnippets: string[]   // "First raced here in 1948...", "Home of F1's British GP..."
  notableMoments: NotableMoment[]
  
  // === RACING CHARACTERISTICS ===
  overtakingSpots: string[]   // "Turn 1", "Wellington Straight", "Parabolica"
  keyFactors: string[]        // "Tire management crucial", "Heavy on brakes"
  weatherNotes?: string       // "Often sees dramatic weather changes mid-race"
  
  // === SECTOR-BY-SECTOR NOTES ===
  sectorNotes: SectorNotes
  
  // === GENERATION METADATA ===
  generatedAt?: string        // ISO timestamp
  generatedVersion?: number   // Schema version for migrations
}

// ============================================================================
// TRACK NARRATIVE CACHE
// ============================================================================

const TRACK_NARRATIVE_STORAGE_KEY = 'ams2-track-narratives'
const CURRENT_SCHEMA_VERSION = 1

// In-memory cache for quick access
let narrativeCache: Record<string, TrackNarrative> = {}

/**
 * Load track narratives from localStorage
 */
export function loadTrackNarratives(): Record<string, TrackNarrative> {
  try {
    const stored = localStorage.getItem(TRACK_NARRATIVE_STORAGE_KEY)
    if (stored) {
      narrativeCache = JSON.parse(stored)
      return narrativeCache
    }
  } catch (err) {
    console.error('[TrackNarrative] Failed to load from storage:', err)
  }
  return {}
}

/**
 * Save track narratives to localStorage
 */
export function saveTrackNarratives(): void {
  try {
    localStorage.setItem(TRACK_NARRATIVE_STORAGE_KEY, JSON.stringify(narrativeCache))
  } catch (err) {
    console.error('[TrackNarrative] Failed to save to storage:', err)
  }
}

/**
 * Get a track narrative from cache
 */
export function getTrackNarrative(trackId: string): TrackNarrative | undefined {
  // Ensure cache is loaded
  if (Object.keys(narrativeCache).length === 0) {
    loadTrackNarratives()
  }
  return narrativeCache[trackId]
}

/**
 * Store a track narrative in cache and persist
 */
export function setTrackNarrative(trackId: string, narrative: TrackNarrative): void {
  narrativeCache[trackId] = {
    ...narrative,
    generatedAt: narrative.generatedAt || new Date().toISOString(),
    generatedVersion: CURRENT_SCHEMA_VERSION
  }
  saveTrackNarratives()
}

/**
 * Check if a track has a narrative generated
 */
export function hasTrackNarrative(trackId: string): boolean {
  return getTrackNarrative(trackId) !== undefined
}

/**
 * Get all cached track narratives
 */
export function getAllTrackNarratives(): Record<string, TrackNarrative> {
  if (Object.keys(narrativeCache).length === 0) {
    loadTrackNarratives()
  }
  return { ...narrativeCache }
}

/**
 * Clear all track narratives (for testing/reset)
 */
export function clearTrackNarratives(): void {
  narrativeCache = {}
  localStorage.removeItem(TRACK_NARRATIVE_STORAGE_KEY)
}

/**
 * Get count of cached narratives
 */
export function getTrackNarrativeCount(): number {
  if (Object.keys(narrativeCache).length === 0) {
    loadTrackNarratives()
  }
  return Object.keys(narrativeCache).length
}

// ============================================================================
// HELPER FUNCTIONS FOR COMMENTARY
// ============================================================================

/**
 * Get a random history snippet for a track
 */
export function getRandomHistorySnippet(trackId: string): string | undefined {
  const narrative = getTrackNarrative(trackId)
  if (!narrative || narrative.historySnippets.length === 0) return undefined
  
  const index = Math.floor(Math.random() * narrative.historySnippets.length)
  return narrative.historySnippets[index]
}

/**
 * Get a random famous corner for commentary
 */
export function getRandomFamousCorner(trackId: string): FamousCorner | undefined {
  const narrative = getTrackNarrative(trackId)
  if (!narrative || narrative.famousCorners.length === 0) return undefined
  
  const index = Math.floor(Math.random() * narrative.famousCorners.length)
  return narrative.famousCorners[index]
}

/**
 * Get sector-specific commentary
 */
export function getSectorNote(trackId: string, sector: 1 | 2 | 3): string | undefined {
  const narrative = getTrackNarrative(trackId)
  if (!narrative) return undefined
  
  switch (sector) {
    case 1: return narrative.sectorNotes.sector1
    case 2: return narrative.sectorNotes.sector2
    case 3: return narrative.sectorNotes.sector3
  }
}

/**
 * Get corners in a specific sector
 */
export function getCornersInSector(trackId: string, sector: 1 | 2 | 3): FamousCorner[] {
  const narrative = getTrackNarrative(trackId)
  if (!narrative) return []
  
  return narrative.famousCorners.filter(c => c.sectorPosition === sector)
}

/**
 * Get key racing factors for pre-race discussion
 */
export function getKeyFactors(trackId: string): string[] {
  const narrative = getTrackNarrative(trackId)
  return narrative?.keyFactors || []
}

/**
 * Get overtaking opportunities for race commentary
 */
export function getOvertakingSpots(trackId: string): string[] {
  const narrative = getTrackNarrative(trackId)
  return narrative?.overtakingSpots || []
}

