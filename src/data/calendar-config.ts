/**
 * Calendar Configuration for Championship Schedules
 * 
 * Defines regional preferences, iconic tracks, and grade requirements
 * to create more realistic and relevant championship calendars.
 */

import { TrackRegion } from './ams2-tracks'
import { TeamTier } from './ams2-teams-real'

// ============================================
// REGIONAL PREFERENCES
// ============================================

export interface RegionalPreference {
  primary: TrackRegion
  secondary?: TrackRegion
  weight: number // 0-1, percentage of tracks from primary region
}

/**
 * Regional preferences based on series ID patterns
 * Maps series patterns to their preferred track regions
 */
export const SERIES_REGIONAL_PREFERENCES: Record<string, RegionalPreference> = {
  // Brazilian series - heavily favor Brazilian tracks
  'stock-car': { primary: 'brazil', weight: 0.7 },
  'copa-truck': { primary: 'brazil', weight: 0.7 },
  'copa-fusca': { primary: 'brazil', weight: 0.8 },
  'copa-uno': { primary: 'brazil', weight: 0.8 },
  'copa-classic': { primary: 'brazil', weight: 0.7 },
  'formula-inter': { primary: 'brazil', weight: 0.6 },
  'formula-vee': { primary: 'brazil', weight: 0.7 },
  'carrera-cup-brasil': { primary: 'brazil', weight: 0.7 },
  'montana': { primary: 'brazil', weight: 0.8 },
  'hot-cars': { primary: 'brazil', weight: 0.8 },
  
  // European GT/Touring series
  'gt3': { primary: 'europe', secondary: 'oceania', weight: 0.5 },
  'gt4': { primary: 'europe', weight: 0.55 },
  'gt5': { primary: 'europe', weight: 0.6 },
  'gte': { primary: 'europe', weight: 0.5 },
  'gt1': { primary: 'europe', weight: 0.5 },
  'gt-open': { primary: 'europe', weight: 0.6 },
  'group-a': { primary: 'europe', weight: 0.6 },
  'group-c': { primary: 'europe', weight: 0.5 },
  'caterham': { primary: 'europe', weight: 0.7 },
  'ginetta': { primary: 'europe', weight: 0.7 },
  'g40-cup': { primary: 'europe', weight: 0.7 },
  'g55-supercup': { primary: 'europe', weight: 0.7 },
  'mini-challenge': { primary: 'europe', weight: 0.7 },
  
  // North American series
  'formula-usa': { primary: 'north_america', weight: 0.6 },
  'dpi': { primary: 'north_america', secondary: 'europe', weight: 0.5 },
  
  // Australian series
  'supercars': { primary: 'oceania', weight: 0.7 },
  'super-v8': { primary: 'oceania', weight: 0.7 },
  'arc-camaro': { primary: 'oceania', weight: 0.8 },
  
  // Global prototype/endurance series - mix of all regions
  'hypercar': { primary: 'europe', secondary: 'north_america', weight: 0.35 },
  'lmdh': { primary: 'europe', secondary: 'north_america', weight: 0.35 },
  'lmp2': { primary: 'europe', secondary: 'north_america', weight: 0.4 },
  'prototype': { primary: 'europe', weight: 0.4 },
  
  // Formula series - global spread for top tiers
  'formula-ultimate': { primary: 'europe', weight: 0.4 },
  'formula-v10': { primary: 'europe', weight: 0.4 },
  'formula-v12': { primary: 'europe', weight: 0.45 },
  'formula-3': { primary: 'europe', weight: 0.5 },
  'formula-reiza': { primary: 'brazil', secondary: 'europe', weight: 0.5 },
  'formula-trainer': { primary: 'europe', weight: 0.6 },
  'formula-junior': { primary: 'brazil', weight: 0.6 },
  
  // Kart series - use kart tracks from appropriate regions
  'kart': { primary: 'brazil', weight: 0.6 },
}

/**
 * Get regional preference for a series based on its ID
 */
export function getRegionalPreference(seriesId: string): RegionalPreference {
  // Try exact match first
  if (SERIES_REGIONAL_PREFERENCES[seriesId]) {
    return SERIES_REGIONAL_PREFERENCES[seriesId]
  }
  
  // Try prefix match (e.g., "stock-car-2024" matches "stock-car")
  for (const [pattern, pref] of Object.entries(SERIES_REGIONAL_PREFERENCES)) {
    if (seriesId.startsWith(pattern)) {
      return pref
    }
  }
  
  // Default: balanced global preference
  return { primary: 'europe', weight: 0.3 }
}

// ============================================
// ICONIC TRACKS BY CATEGORY
// ============================================

/**
 * Iconic tracks that should appear in calendars for each category
 * These are the "must-visit" circuits that make championships feel authentic
 */
export const ICONIC_TRACKS: Record<string, string[]> = {
  // GT racing - classic GT circuits
  gt: [
    'spa',           // Spa-Francorchamps - legendary GT venue
    'monza',         // Monza - Italian classic
    'nurburgring',   // Nürburgring GP - German powerhouse
    'silverstone',   // Silverstone - British motorsport home
    'bathurst',      // Bathurst - Australian icon
    'suzuka',        // Suzuka - Japanese precision
    'brands_hatch',  // Brands Hatch - British favorite
  ],
  
  // Formula/open-wheel - F1-style circuits
  formula: [
    'monaco',        // Monaco - the jewel
    'silverstone',   // Silverstone - British GP
    'monza',         // Monza - Temple of Speed
    'spa',           // Spa - Eau Rouge legendary
    'interlagos',    // Interlagos - Brazilian passion
    'suzuka',        // Suzuka - figure-8 classic
    'barcelona',     // Barcelona - testing favorite
    'spielberg',     // Red Bull Ring - modern classic
  ],
  
  // Brazilian Stock Car - authentic Brazilian circuits
  stock: [
    'interlagos',    // Interlagos - flagship venue
    'goiania',       // Goiânia - traditional Stock Car track
    'londrina',      // Londrina - Ayrton Senna track
    'curitiba',      // Curitiba - southern classic
    'brasilia',      // Brasília - capital circuit
    'velo_citta',    // Velo Città - modern facility
    'cascavel',      // Cascavel - Paraná favorite
    'taruma',        // Tarumã - Rio Grande do Sul
  ],
  
  // Prototype/Endurance - legendary endurance venues
  prototype: [
    'le_mans',       // Le Mans - 24 Hours legend
    'spa',           // Spa - 24 Hours venue
    'sebring',       // Sebring - American endurance
    'daytona',       // Daytona - Rolex 24
    'nurburgring',   // Nürburgring - 24 Hours
    'monza',         // Monza - WEC round
    'silverstone',   // Silverstone - WEC round
  ],
  
  // Touring cars - mixed circuits
  touring: [
    'brands_hatch',  // Brands Hatch - BTCC home
    'silverstone',   // Silverstone - British classic
    'donington',     // Donington - touring car venue
    'oulton_park',   // Oulton Park - challenging
    'snetterton',    // Snetterton - UK touring
    'hockenheim',    // Hockenheim - DTM venue
    'nurburgring',   // Nürburgring - DTM
  ],
  
  // Kart circuits
  kart: [
    'granja_viana',  // Granja Viana - Brazilian karting mecca
    'speedland',     // Speedland - modern kart facility
    'interlagos',    // Interlagos kart track
  ],
  
  // Australian/Oceania
  oceania: [
    'bathurst',      // Mount Panorama - V8 Supercars legend
    'adelaide',      // Adelaide - street circuit classic
  ],
  
  // North American
  north_america: [
    'road_america',  // Road America - American classic
    'laguna_seca',   // Laguna Seca - Corkscrew
    'watkins_glen',  // Watkins Glen - East coast legend
    'sebring',       // Sebring - bumpy classic
    'daytona',       // Daytona - speedway
    'indianapolis',  // Indianapolis - the Brickyard
    'long_beach',    // Long Beach - street classic
    'montreal',      // Montreal - Canadian GP
  ],
}

/**
 * Get iconic tracks for a category, limited by tier
 * Higher tiers get more iconic tracks, lower tiers get fewer
 */
export function getIconicTracksForCategory(category: string, tier: TeamTier): string[] {
  const tracks = ICONIC_TRACKS[category] || []
  
  // Limit iconic tracks based on tier
  const maxIconicTracks = getMaxIconicTracksForTier(tier)
  
  return tracks.slice(0, maxIconicTracks)
}

function getMaxIconicTracksForTier(tier: TeamTier): number {
  switch (tier) {
    case 'pinnacle': return 8  // Most iconic tracks
    case 'elite': return 6
    case 'pro': return 5
    case 'professional': return 4
    case 'semi-pro': return 3
    case 'amateur': return 2
    case 'entry': return 1     // Just 1 flagship track
    default: return 3
  }
}

// ============================================
// TRACK GRADE REQUIREMENTS BY TIER
// ============================================

/**
 * FIA track grades that are acceptable for each tier
 * Higher tiers require higher-grade facilities
 */
export const TIER_GRADE_REQUIREMENTS: Record<TeamTier, string[]> = {
  pinnacle: ['Grade 1'],                           // Only top-tier circuits
  elite: ['Grade 1', 'Grade 2'],                   // Top professional venues
  pro: ['Grade 1', 'Grade 2', 'Grade 3'],          // Professional circuits
  professional: ['Grade 1', 'Grade 2', 'Grade 3'], // Professional circuits
  'semi-pro': ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 1T'], // Include motorcycle grades
  amateur: [],  // Any track (empty = no restriction)
  entry: [],    // Any track
}

/**
 * Get acceptable track grades for a tier
 * Returns empty array if any grade is acceptable
 */
export function getAcceptableGradesForTier(tier: TeamTier): string[] {
  return TIER_GRADE_REQUIREMENTS[tier] || []
}

// ============================================
// CALENDAR STRUCTURE SETTINGS
// ============================================

export interface CalendarSettings {
  seasonStartWeek: number
  seasonEndWeek: number
  minWeeksBetweenRaces: number
  allowBackToBack: boolean
}

/**
 * Calendar structure settings by tier
 * Higher tiers have more condensed schedules
 */
export const TIER_CALENDAR_SETTINGS: Record<TeamTier, CalendarSettings> = {
  pinnacle: {
    seasonStartWeek: 6,
    seasonEndWeek: 48,
    minWeeksBetweenRaces: 1,
    allowBackToBack: true,
  },
  elite: {
    seasonStartWeek: 8,
    seasonEndWeek: 46,
    minWeeksBetweenRaces: 2,
    allowBackToBack: true,
  },
  pro: {
    seasonStartWeek: 8,
    seasonEndWeek: 45,
    minWeeksBetweenRaces: 2,
    allowBackToBack: false,
  },
  professional: {
    seasonStartWeek: 10,
    seasonEndWeek: 44,
    minWeeksBetweenRaces: 2,
    allowBackToBack: false,
  },
  'semi-pro': {
    seasonStartWeek: 10,
    seasonEndWeek: 42,
    minWeeksBetweenRaces: 3,
    allowBackToBack: false,
  },
  amateur: {
    seasonStartWeek: 12,
    seasonEndWeek: 40,
    minWeeksBetweenRaces: 3,
    allowBackToBack: false,
  },
  entry: {
    seasonStartWeek: 14,
    seasonEndWeek: 38,
    minWeeksBetweenRaces: 4,
    allowBackToBack: false,
  },
}

/**
 * Get calendar settings for a tier
 */
export function getCalendarSettingsForTier(tier: TeamTier): CalendarSettings {
  return TIER_CALENDAR_SETTINGS[tier] || TIER_CALENDAR_SETTINGS.amateur
}

// ============================================
// NUMBER OF ROUNDS BY TIER
// ============================================

/**
 * Number of rounds (races) per season by tier
 */
export const TIER_ROUND_COUNTS: Record<TeamTier, number> = {
  pinnacle: 20,    // Full calendar like F1
  elite: 16,       // Major championship
  pro: 14,         // Professional series
  professional: 13,
  'semi-pro': 12,  // Regional pro series
  amateur: 10,     // Club racing
  entry: 8,        // Entry-level
}

/**
 * Get number of rounds for a tier
 */
export function getRoundCountForTier(tier: TeamTier): number {
  return TIER_ROUND_COUNTS[tier] || 10
}











