/**
 * Team Narrative System
 * 
 * Rich narrative content for teams to enable TV broadcast-style commentary.
 * Generated via AI when creating a career, then cached for reuse.
 * Allows commentators to talk about OTHER teams, not just the player's team.
 */

// ============================================================================
// TEAM NARRATIVE INTERFACES
// ============================================================================

export interface TeamNarrative {
  teamId: string
  
  // === ORIGIN & HISTORY ===
  origin: string                    // "Founded in a small garage in Bavaria back in 1987..."
  foundingStory?: string            // More detailed founding story if interesting
  
  // === PHILOSOPHY & CULTURE ===
  philosophy: string                // "Known for developing young talent..."
  culturalIdentity: string          // "A true family team at heart" / "Corporate precision" / "Underdog spirit"
  
  // === REPUTATION ===
  technicalReputation: string       // "Engineering excellence - always pushing boundaries"
  paddockStanding: string           // "Respected throughout the paddock for professionalism"
  fanBase?: string                  // "Passionate local supporters" / "Global following"
  
  // === ACHIEVEMENTS ===
  achievements: string[]            // ["3x championship winners", "Le Mans class victory 2019"]
  titleCount: number                // Number of championships won
  
  // === PEOPLE ===
  famousAlumni: string[]            // ["Rubens Barrichello", "Michael Schumacher"] - drivers who raced here
  teamPrincipal?: string            // Current team boss name
  keyFigures?: string[]             // Other notable personnel
  
  // === CURRENT STATE ===
  currentTrajectory: string         // "A team on the rise under new management"
  recentForm: string                // "Strong start to 2024" / "Rebuilding after tough 2023"
  
  // === COLOR COMMENTARY ===
  anecdotes: string[]               // Fun facts for color commentary
  
  // === GENERATION METADATA ===
  generatedAt?: string              // ISO timestamp
  generatedVersion?: number         // Schema version for migrations
}

// ============================================================================
// TEAM NARRATIVE CACHE
// ============================================================================

const TEAM_NARRATIVE_STORAGE_KEY = 'ams2-team-narratives'
const CURRENT_SCHEMA_VERSION = 1

// In-memory cache for quick access
let narrativeCache: Record<string, TeamNarrative> = {}

/**
 * Load team narratives from localStorage
 */
export function loadTeamNarratives(): Record<string, TeamNarrative> {
  try {
    const stored = localStorage.getItem(TEAM_NARRATIVE_STORAGE_KEY)
    if (stored) {
      narrativeCache = JSON.parse(stored)
      return narrativeCache
    }
  } catch (err) {
    console.error('[TeamNarrative] Failed to load from storage:', err)
  }
  return {}
}

/**
 * Save team narratives to localStorage
 */
export function saveTeamNarratives(): void {
  try {
    localStorage.setItem(TEAM_NARRATIVE_STORAGE_KEY, JSON.stringify(narrativeCache))
  } catch (err) {
    console.error('[TeamNarrative] Failed to save to storage:', err)
  }
}

/**
 * Get a team narrative from cache
 */
export function getTeamNarrative(teamId: string): TeamNarrative | undefined {
  // Ensure cache is loaded
  if (Object.keys(narrativeCache).length === 0) {
    loadTeamNarratives()
  }
  return narrativeCache[teamId]
}

/**
 * Store a team narrative in cache and persist
 */
export function setTeamNarrative(teamId: string, narrative: TeamNarrative): void {
  narrativeCache[teamId] = {
    ...narrative,
    generatedAt: narrative.generatedAt || new Date().toISOString(),
    generatedVersion: CURRENT_SCHEMA_VERSION
  }
  saveTeamNarratives()
}

/**
 * Check if a team has a narrative generated
 */
export function hasTeamNarrative(teamId: string): boolean {
  return getTeamNarrative(teamId) !== undefined
}

/**
 * Get all cached team narratives
 */
export function getAllTeamNarratives(): Record<string, TeamNarrative> {
  if (Object.keys(narrativeCache).length === 0) {
    loadTeamNarratives()
  }
  return { ...narrativeCache }
}

/**
 * Clear all team narratives (for testing/reset)
 */
export function clearTeamNarratives(): void {
  narrativeCache = {}
  localStorage.removeItem(TEAM_NARRATIVE_STORAGE_KEY)
}

/**
 * Get count of cached narratives
 */
export function getTeamNarrativeCount(): number {
  if (Object.keys(narrativeCache).length === 0) {
    loadTeamNarratives()
  }
  return Object.keys(narrativeCache).length
}

/**
 * Get narratives for multiple teams
 */
export function getTeamNarrativesForSeries(teamIds: string[]): TeamNarrative[] {
  return teamIds
    .map(id => getTeamNarrative(id))
    .filter((n): n is TeamNarrative => n !== undefined)
}

// ============================================================================
// HELPER FUNCTIONS FOR COMMENTARY
// ============================================================================

/**
 * Get a random anecdote for a team
 */
export function getRandomTeamAnecdote(teamId: string): string | undefined {
  const narrative = getTeamNarrative(teamId)
  if (!narrative || narrative.anecdotes.length === 0) return undefined
  
  const index = Math.floor(Math.random() * narrative.anecdotes.length)
  return narrative.anecdotes[index]
}

/**
 * Get a random achievement for a team
 */
export function getRandomTeamAchievement(teamId: string): string | undefined {
  const narrative = getTeamNarrative(teamId)
  if (!narrative || narrative.achievements.length === 0) return undefined
  
  const index = Math.floor(Math.random() * narrative.achievements.length)
  return narrative.achievements[index]
}

/**
 * Get famous alumni for a team
 */
export function getTeamAlumni(teamId: string): string[] {
  const narrative = getTeamNarrative(teamId)
  return narrative?.famousAlumni || []
}

/**
 * Get team origin story
 */
export function getTeamOrigin(teamId: string): string | undefined {
  const narrative = getTeamNarrative(teamId)
  return narrative?.origin
}

/**
 * Get team philosophy for commentary
 */
export function getTeamPhilosophy(teamId: string): string | undefined {
  const narrative = getTeamNarrative(teamId)
  return narrative?.philosophy
}

/**
 * Check if team needs narrative generation
 */
export function teamNeedsNarrative(teamId: string): boolean {
  return !hasTeamNarrative(teamId)
}

/**
 * Get teams that need narratives from a list
 */
export function getTeamsNeedingNarratives(teamIds: string[]): string[] {
  return teamIds.filter(id => teamNeedsNarrative(id))
}


