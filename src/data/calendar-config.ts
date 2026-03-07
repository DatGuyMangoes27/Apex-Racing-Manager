/**
 * Calendar Configuration for Championship Schedules
 * 
 * Defines territory boundaries, fixed venues, layout preferences,
 * iconic tracks, and grade requirements to create realistic calendars.
 * 
 * Key principle: Round counts are driven by available tracks in a series'
 * territory, not by arbitrary tier-based numbers. 6 rounds at correct
 * tracks is better than 12 rounds at random wrong tracks.
 */

import { TrackRegion } from './ams2-tracks'
import { TeamTier } from './ams2-teams-real'

// ============================================
// FIXED VENUE CHAMPIONSHIPS
// ============================================

/**
 * Championships that are inherently tied to a specific venue.
 * These bypass all track selection logic and always use the exact
 * track and layout specified. Primarily for named one-off events.
 */
export interface FixedVenue {
  trackId: string
  layoutId: string
}

export const FIXED_VENUE_CHAMPIONSHIPS: Record<string, FixedVenue> = {
  // Endurance classics
  '24h-le-mans':        { trackId: 'le_mans',       layoutId: '24h' },               // 13.6km Circuit de la Sarthe
  'daytona-24h':        { trackId: 'daytona',        layoutId: 'sports_car_course' }, // Daytona road course for Rolex 24
  'spa-24h':            { trackId: 'spa',             layoutId: '2020' },              // Full GP circuit
  'nurburgring-24h':    { trackId: 'nurburgring',    layoutId: '24_hour_2020' },      // GP + Nordschleife combined
  'bathurst-12h':       { trackId: 'bathurst',        layoutId: '2020' },              // Mount Panorama
  'suzuka-10h':         { trackId: 'suzuka',          layoutId: 'gp' },                // Full Suzuka (Kansai GP)
  'sao-paulo-6h':       { trackId: 'interlagos',      layoutId: 'gp' },                // Interlagos GP layout
  'kyalami-9h':         { trackId: 'kyalami',         layoutId: 'default' },            // Kyalami GP

  // Sprint/special classics
  'daytona-500':        { trackId: 'daytona',        layoutId: 'nascar_tri_oval' },    // Superspeedway oval
  'indianapolis-500':   { trackId: 'indianapolis',   layoutId: 'oval' },                // The Brickyard oval
  'bathurst-1000':      { trackId: 'bathurst',        layoutId: '2020' },                // Mount Panorama
  'nascar-le-mans':     { trackId: 'le_mans',         layoutId: '24h' },                 // NASCAR at La Sarthe
  'adelaide-street-festival': { trackId: 'adelaide',  layoutId: 'default' },             // Adelaide street circuit

  // Other venue-specific events
  'night-racing-challenge': { trackId: 'le_mans',     layoutId: 'circuit_bugatti' },    // Night race at Bugatti
  'monaco-junior-gp':     { trackId: 'monaco',        layoutId: 'default' },             // Monaco street circuit
  // Club single-venue mini-seasons
  'brands-hatch-club':    { trackId: 'brands_hatch',  layoutId: 'gp' },                  // Multi-round club meet at Brands Hatch
}


// ============================================
// SERIES TERRITORY SYSTEM
// ============================================

/**
 * Hard geographic boundaries for each series.
 * A track MUST be in one of the allowed regions to appear on the calendar.
 * No more random European tracks filling IMSA calendars.
 * 
 * The `primary` region gets priority ordering (tracks from primary appear first).
 */
export interface SeriesTerritory {
  allowedRegions: TrackRegion[]
  primary: TrackRegion  // Primary region for ordering priority
}

/**
 * Territory definitions by series ID pattern.
 * Checked via exact match first, then prefix match (longest prefix wins).
 */
export const SERIES_TERRITORIES: Record<string, SeriesTerritory> = {
  // ── Brazilian domestic series ──────────────────────────────────────
  'stock-car':              { allowedRegions: ['brazil'], primary: 'brazil' },
  'copa-truck':             { allowedRegions: ['brazil'], primary: 'brazil' },
  'copa-fusca':             { allowedRegions: ['brazil'], primary: 'brazil' },
  'copa-uno':               { allowedRegions: ['brazil'], primary: 'brazil' },
  'copa-classic':           { allowedRegions: ['brazil'], primary: 'brazil' },
  'formula-inter':          { allowedRegions: ['brazil'], primary: 'brazil' },
  'formula-vee':            { allowedRegions: ['brazil'], primary: 'brazil' },
  'formula-junior':         { allowedRegions: ['brazil'], primary: 'brazil' },
  'carrera-cup-brasil':     { allowedRegions: ['brazil'], primary: 'brazil' },
  'montana':                { allowedRegions: ['brazil'], primary: 'brazil' },
  'hot-cars':               { allowedRegions: ['brazil'], primary: 'brazil' },
  'brazilian':              { allowedRegions: ['brazil'], primary: 'brazil' },
  'interlagos':             { allowedRegions: ['brazil'], primary: 'brazil' },
  'p2-sprint-brasil':       { allowedRegions: ['brazil'], primary: 'brazil' },
  'p1-brazilian':           { allowedRegions: ['brazil'], primary: 'brazil' },
  'p1-gen2-sprint':         { allowedRegions: ['brazil'], primary: 'brazil' },
  'sprint-race-brasil':     { allowedRegions: ['brazil'], primary: 'brazil' },
  'old-stock':              { allowedRegions: ['brazil'], primary: 'brazil' },
  'rental-kart-cup-brasil': { allowedRegions: ['brazil'], primary: 'brazil' },
  'kartcross':              { allowedRegions: ['brazil'], primary: 'brazil' },
  'tc-legends-brasil':      { allowedRegions: ['brazil'], primary: 'brazil' },
  'opala-historic':         { allowedRegions: ['brazil'], primary: 'brazil' },
  'stock-car-brasil-retro': { allowedRegions: ['brazil'], primary: 'brazil' },
  'formula-reiza':          { allowedRegions: ['brazil', 'south_america'], primary: 'brazil' },

  // ── Brazilian kart series ──────────────────────────────────────────
  'kart':                   { allowedRegions: ['brazil'], primary: 'brazil' },

  // ── Americas / North American series ───────────────────────────────
  // IMSA can realistically expand to South American venues (São Paulo, Buenos Aires)
  // but NOT to European WEC-territory venues
  'imsa':                   { allowedRegions: ['north_america', 'south_america', 'brazil'], primary: 'north_america' },
  'dpi':                    { allowedRegions: ['north_america', 'south_america', 'brazil'], primary: 'north_america' },
  'formula-usa':            { allowedRegions: ['north_america', 'south_america', 'brazil'], primary: 'north_america' },
  'stock-usa':              { allowedRegions: ['north_america'], primary: 'north_america' },
  'oval-thunder':           { allowedRegions: ['north_america'], primary: 'north_america' },
  'short-track':            { allowedRegions: ['north_america'], primary: 'north_america' },
  'sonoma':                 { allowedRegions: ['north_america'], primary: 'north_america' },

  // Americas GT series - MUST be listed BEFORE short gt3/gt4/gt5 prefixes
  'gt3-americas':           { allowedRegions: ['north_america', 'south_america', 'brazil'], primary: 'north_america' },
  'gt5-americas':           { allowedRegions: ['north_america', 'south_america', 'brazil'], primary: 'north_america' },
  'gt-america':             { allowedRegions: ['north_america', 'south_america', 'brazil'], primary: 'north_america' },
  'carrera-cup-north-america': { allowedRegions: ['north_america'], primary: 'north_america' },
  'super-trofeo-north-america': { allowedRegions: ['north_america'], primary: 'north_america' },

  // ── Asia-Pacific series ────────────────────────────────────────────
  // Very few tracks in-game (Suzuka only for Asia), so allow Oceania expansion
  'gt3-asia':               { allowedRegions: ['asia', 'oceania'], primary: 'asia' },
  'gt4-asia':               { allowedRegions: ['asia', 'oceania'], primary: 'asia' },
  'gt-world-challenge-asia': { allowedRegions: ['asia', 'oceania'], primary: 'asia' },
  'carrera-cup-asia':       { allowedRegions: ['asia', 'oceania'], primary: 'asia' },
  'super-trofeo-asia':      { allowedRegions: ['asia', 'oceania'], primary: 'asia' },
  'lancer-cup-asia':        { allowedRegions: ['asia', 'oceania'], primary: 'asia' },
  'asia-touring':           { allowedRegions: ['asia', 'oceania'], primary: 'asia' },
  'japanese-gt':            { allowedRegions: ['asia', 'oceania'], primary: 'asia' },
  'sepang':                 { allowedRegions: ['asia', 'oceania'], primary: 'asia' },

  // ── Australian series ──────────────────────────────────────────────
  // Only 2 Oceania tracks, so allow Asia flyaway (Suzuka is realistic)
  'supercars':              { allowedRegions: ['oceania', 'asia'], primary: 'oceania' },
  'super-v8':               { allowedRegions: ['oceania', 'asia'], primary: 'oceania' },
  'arc-camaro':             { allowedRegions: ['oceania', 'asia'], primary: 'oceania' },
  'aussie-racing':          { allowedRegions: ['oceania', 'asia'], primary: 'oceania' },
  'phillip-island':         { allowedRegions: ['oceania'], primary: 'oceania' },
  'adelaide':               { allowedRegions: ['oceania'], primary: 'oceania' },

  // ── European domestic series ───────────────────────────────────────
  'gt-world-challenge-europe': { allowedRegions: ['europe'], primary: 'europe' },
  'gt3':                    { allowedRegions: ['europe'], primary: 'europe' },
  'gt4':                    { allowedRegions: ['europe'], primary: 'europe' },
  'gt5':                    { allowedRegions: ['europe'], primary: 'europe' },
  'gte':                    { allowedRegions: ['europe'], primary: 'europe' },
  'gt1':                    { allowedRegions: ['europe'], primary: 'europe' },
  'gt-open':                { allowedRegions: ['europe'], primary: 'europe' },
  'gt-classic':             { allowedRegions: ['europe'], primary: 'europe' },
  'group-a':                { allowedRegions: ['europe'], primary: 'europe' },
  'group-c':                { allowedRegions: ['europe'], primary: 'europe' },
  'caterham':               { allowedRegions: ['europe'], primary: 'europe' },
  'ginetta':                { allowedRegions: ['europe'], primary: 'europe' },
  'g40-cup':                { allowedRegions: ['europe'], primary: 'europe' },
  'g55-supercup':           { allowedRegions: ['europe'], primary: 'europe' },
  'mini-challenge':         { allowedRegions: ['europe'], primary: 'europe' },
  'british-gt':             { allowedRegions: ['europe'], primary: 'europe' },
  'brands-hatch':           { allowedRegions: ['europe'], primary: 'europe' },
  'gentleman-driver':       { allowedRegions: ['europe'], primary: 'europe' },
  'weekend-warrior':        { allowedRegions: ['europe'], primary: 'europe' },
  'rookie-formula':         { allowedRegions: ['europe'], primary: 'europe' },
  'fun-racing':             { allowedRegions: ['europe'], primary: 'europe' },
  'endurance-rookie':       { allowedRegions: ['europe'], primary: 'europe' },
  'nordic-gt':              { allowedRegions: ['europe'], primary: 'europe' },
  'weekend-kart':           { allowedRegions: ['europe'], primary: 'europe' },
  'karting-4t':             { allowedRegions: ['europe'], primary: 'europe' },
  'formula-trainer':        { allowedRegions: ['europe'], primary: 'europe' },
  'formula-festival':       { allowedRegions: ['europe'], primary: 'europe' },

  // ── Historic/special European series ───────────────────────────────
  'le-mans-2005':           { allowedRegions: ['europe'], primary: 'europe' },
  'fia-gt-2005':            { allowedRegions: ['europe'], primary: 'europe' },
  'gtr-revival':            { allowedRegions: ['europe'], primary: 'europe' },
  'm1-procar':              { allowedRegions: ['europe'], primary: 'europe' },
  'vintage-touring':        { allowedRegions: ['europe'], primary: 'europe' },
  'formula-classic':        { allowedRegions: ['europe'], primary: 'europe' },
  'formula-vintage':        { allowedRegions: ['europe'], primary: 'europe' },
  'formula-retro':          { allowedRegions: ['europe'], primary: 'europe' },

  // ── Global / World Championship series ─────────────────────────────
  // WEC-style: visits all major motorsport regions
  'hypercar':               { allowedRegions: ['europe', 'north_america', 'asia', 'oceania', 'brazil', 'south_america', 'africa'], primary: 'europe' },
  'lmdh':                   { allowedRegions: ['europe', 'north_america', 'asia', 'oceania', 'brazil', 'south_america', 'africa'], primary: 'europe' },
  'lmp2':                   { allowedRegions: ['europe', 'north_america', 'asia', 'oceania', 'brazil', 'south_america', 'africa'], primary: 'europe' },
  'prototype':              { allowedRegions: ['europe', 'north_america', 'asia', 'oceania', 'brazil', 'south_america', 'africa'], primary: 'europe' },
  'intercontinental':       { allowedRegions: ['europe', 'north_america', 'asia', 'oceania', 'brazil', 'south_america', 'africa'], primary: 'europe' },
  'world-rallycross':       { allowedRegions: ['europe', 'north_america', 'brazil'], primary: 'europe' },

  // F1-style global formula
  'formula-ultimate':       { allowedRegions: ['europe', 'north_america', 'asia', 'oceania', 'brazil', 'south_america', 'africa'], primary: 'europe' },
  'formula-v10':            { allowedRegions: ['europe', 'north_america', 'asia', 'oceania', 'brazil', 'south_america'], primary: 'europe' },
  'formula-v12':            { allowedRegions: ['europe', 'north_america', 'asia', 'oceania', 'brazil', 'south_america'], primary: 'europe' },
  'formula-3':              { allowedRegions: ['europe', 'asia', 'oceania'], primary: 'europe' },
}

/**
 * Fallback territory by championship region string.
 * Used when no series ID pattern matches.
 */
const REGION_TERRITORY_FALLBACK: Record<string, SeriesTerritory> = {
  'Brazil':       { allowedRegions: ['brazil'], primary: 'brazil' },
  'Americas':     { allowedRegions: ['north_america', 'south_america', 'brazil'], primary: 'north_america' },
  'USA':          { allowedRegions: ['north_america'], primary: 'north_america' },
  'Europe':       { allowedRegions: ['europe'], primary: 'europe' },
  'Asia-Pacific': { allowedRegions: ['asia', 'oceania'], primary: 'asia' },
  'Australia':    { allowedRegions: ['oceania', 'asia'], primary: 'oceania' },
  'Global':       { allowedRegions: ['europe', 'north_america', 'asia', 'oceania', 'brazil', 'south_america', 'africa'], primary: 'europe' },
}

/**
 * Get the territory (allowed regions) for a series.
 * Priority: exact ID match > prefix match (longest first) > region fallback > global default
 */
export function getSeriesTerritory(seriesId: string, seriesRegion?: string): SeriesTerritory {
  // 1. Exact match
  if (SERIES_TERRITORIES[seriesId]) {
    return SERIES_TERRITORIES[seriesId]
  }

  // 2. Prefix match (longest prefix wins)
  const sortedEntries = Object.entries(SERIES_TERRITORIES)
    .sort(([a], [b]) => b.length - a.length)

  for (const [pattern, territory] of sortedEntries) {
    if (seriesId.startsWith(pattern)) {
      return territory
    }
  }

  // 3. Fall back to championship region
  if (seriesRegion && REGION_TERRITORY_FALLBACK[seriesRegion]) {
    return REGION_TERRITORY_FALLBACK[seriesRegion]
  }

  // 4. Default: global (all regions allowed)
  return {
    allowedRegions: ['europe', 'north_america', 'asia', 'oceania', 'brazil', 'south_america', 'africa'],
    primary: 'europe',
  }
}


// ============================================
// LAYOUT PREFERENCES BY CATEGORY
// ============================================

/**
 * When a track has multiple layouts, this determines which to pick
 * based on the series category. Layouts are tried in order - first match wins.
 * Falls back to track.defaultLayout if no preference matches.
 */
export const LAYOUT_PREFERENCES: Record<string, string[]> = {
  // Stock car (USA) - ovals first, then roval/road
  'stock-usa':    ['oval', 'nascar_tri_oval', 'roval', 'road', 'road_course', 'sports_car_course', 'default', 'full'],

  // Brazilian stock car - has specific stock layouts at some tracks
  'stock':        ['stock_car_brasil', 'stock', 'default', 'full', 'gp', 'international'],
  'touring':      ['national', 'gp', 'default', 'full', 'short', 'international'],

  // Endurance / prototype - longest layouts
  'endurance':    ['default', 'gp', 'full', 'sports_car_course', 'road_course', '24h', '24_hour_2020', 'international'],
  'prototype':    ['default', 'gp', 'full', 'sports_car_course', 'road_course', '24h', '24_hour_2020', 'international'],

  // Formula - GP layouts
  'formula':      ['gp', 'default', 'full', 'international', 'road_course', 'sports_car_course'],

  // GT racing - full GP layouts
  'gt':           ['gp', 'default', 'full', 'international', 'road_course', 'sports_car_course'],
  'gt-sportscar': ['gp', 'default', 'full', 'international', 'road_course', 'sports_car_course'],

  // Spec series - depends on level but generally GP/full
  'spec-series':  ['gp', 'default', 'full', 'national', 'international'],

  // Kart - kart-specific layouts
  'kart':         ['kart', 'kart_one', 'kart_1', 'kart_101', 'copa_sao_paulo_stage_1', 'mini', 'interior', 'default', 'full', 'short'],

  // Rallycross - rallycross-specific layouts
  'rallycross':   ['rallycross', 'rx', 'dirt', 'default', 'full', 'short'],
}

/**
 * Tier-based layout override: lower tiers should use shorter/simpler layouts
 * when available, rather than the full GP configuration.
 */
export const TIER_LAYOUT_PREFERENCE: Record<string, string[]> = {
  'entry':     ['short', 'club', 'national', 'mini', 'interior', 'default', 'full', 'gp'],
  'amateur':   ['short', 'national', 'club', 'default', 'full', 'gp', 'international'],
  'semi-pro':  ['national', 'default', 'full', 'gp', 'international'],
}

/**
 * Select the best layout for a track given the series category and tier.
 * Returns the layout ID to use.
 */
export function selectBestLayoutId(
  layouts: { id: string; name?: string; sourceVerified?: boolean }[],
  defaultLayoutId: string,
  seriesCategory: string,
  tier: TeamTier
): string {
  const normalize = (value: string) => value.toLowerCase()
  const isRaceLayoutForCategory = (layoutId: string): boolean => {
    const id = normalize(layoutId)

    // STT variants are typically test/time-trial style variants and should not be default race picks.
    if (id.includes('stt')) return false

    const isRallyVariant =
      id.includes('rx') ||
      id.includes('rally') ||
      id.includes('dirt') ||
      id.includes('snow') ||
      id.includes('ice')

    if (seriesCategory === 'rallycross') {
      return true
    }

    // Non-rally categories should never default to rallycross/off-road variants.
    if (isRallyVariant) return false

    // Avoid pure oval layouts for non-stock categories.
    const isPureOval = id.includes('oval') && !id.includes('roval') && !id.includes('road')
    if (seriesCategory !== 'stock-usa' && isPureOval) return false

    return true
  }

  const verifiedLayouts = layouts.filter(l => l.sourceVerified !== false)
  const raceableLayouts = verifiedLayouts.filter(l => isRaceLayoutForCategory(l.id))
  const effectiveLayouts =
    raceableLayouts.length > 0
      ? raceableLayouts
      : (verifiedLayouts.length > 0 ? verifiedLayouts : layouts)

  const layoutIds = effectiveLayouts.map(l => l.id)

  // 1. Check tier-specific preferences first (for lower tiers)
  const tierPrefs = TIER_LAYOUT_PREFERENCE[tier]
  if (tierPrefs) {
    for (const pref of tierPrefs) {
      if (layoutIds.includes(pref)) return pref
    }
  }

  // 2. Check category-specific preferences
  const categoryPrefs = LAYOUT_PREFERENCES[seriesCategory]
  if (categoryPrefs) {
    for (const pref of categoryPrefs) {
      if (layoutIds.includes(pref)) return pref
    }
  }

  // 3. Fall back to default layout only if it is raceable.
  if (layoutIds.includes(defaultLayoutId)) return defaultLayoutId

  // 4. Final fallback to first raceable/verified layout.
  return layoutIds[0] || defaultLayoutId
}


// ============================================
// ICONIC TRACKS BY CATEGORY
// ============================================

/**
 * Iconic tracks that should appear in calendars for each category.
 * These are the "must-visit" circuits that make championships feel authentic.
 * 
 * Keys match actual seriesCategory values used in championships.ts.
 */
export const ICONIC_TRACKS: Record<string, string[]> = {
  // GT racing - classic GT circuits
  'gt': [
    'spa', 'monza', 'nurburgring', 'silverstone',
    'bathurst', 'suzuka', 'brands_hatch',
  ],
  'gt-sportscar': [
    'spa', 'monza', 'nurburgring', 'silverstone',
    'bathurst', 'suzuka', 'brands_hatch', 'interlagos',
  ],

  // Formula/open-wheel
  'formula': [
    'monaco', 'silverstone', 'monza', 'spa',
    'interlagos', 'suzuka', 'barcelona', 'spielberg',
  ],

  // Brazilian Stock Car
  'stock': [
    'interlagos', 'goiania', 'londrina', 'curitiba',
    'brasilia', 'velo_citta', 'cascavel', 'taruma',
  ],

  // American Stock Car (NASCAR-style)
  'stock-usa': [
    'daytona', 'indianapolis', 'pocono', 'fontana',
    'gateway', 'watkins_glen', 'road_america', 'virginia',
  ],

  // Endurance / WEC-style
  'endurance': [
    'le_mans', 'spa', 'sebring', 'daytona',
    'nurburgring', 'monza', 'silverstone', 'interlagos',
    'bathurst', 'suzuka',
  ],

  // Prototype (alias for endurance)
  'prototype': [
    'le_mans', 'spa', 'sebring', 'daytona',
    'nurburgring', 'monza', 'silverstone',
  ],

  // Touring cars
  'touring': [
    'brands_hatch', 'silverstone', 'donington', 'oulton_park',
    'snetterton', 'hockenheim', 'nurburgring',
    'bathurst', 'adelaide', // For Supercars
    'interlagos', 'goiania', // For Brazilian touring
  ],

  // Spec series (one-make)
  'spec-series': [
    'spa', 'monza', 'silverstone', 'hockenheim',
    'nurburgring', 'brands_hatch', 'interlagos',
  ],

  // Kart
  'kart': [
    'granja_viana', 'speedland', 'interlagos',
  ],

  // Rallycross
  'rallycross': [
    'tykki', 'buskerud', 'ascurra',
  ],
}

/**
 * Get iconic tracks for a category, limited by tier.
 * Higher tiers get more iconic tracks, lower tiers get fewer.
 */
export function getIconicTracksForCategory(category: string, tier: TeamTier): string[] {
  const tracks = ICONIC_TRACKS[category] || []

  const maxIconicTracks = getMaxIconicTracksForTier(tier)
  return tracks.slice(0, maxIconicTracks)
}

function getMaxIconicTracksForTier(tier: TeamTier): number {
  switch (tier) {
    case 'pinnacle': return 10
    case 'elite': return 8
    case 'pro': return 6
    case 'professional': return 5
    case 'semi-pro': return 4
    case 'amateur': return 3
    case 'entry': return 2
    default: return 4
  }
}


// ============================================
// TRACK GRADE REQUIREMENTS BY TIER
// ============================================

/**
 * FIA track grades that are acceptable for each tier.
 * Higher tiers require higher-grade facilities.
 */
export const TIER_GRADE_REQUIREMENTS: Record<TeamTier, string[]> = {
  pinnacle: ['Grade 1'],
  elite: ['Grade 1', 'Grade 2'],
  pro: ['Grade 1', 'Grade 2', 'Grade 3'],
  professional: ['Grade 1', 'Grade 2', 'Grade 3'],
  'semi-pro': ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 1T'],
  amateur: [],  // Any track (empty = no restriction)
  entry: [],    // Any track
}

/**
 * Get acceptable track grades for a tier.
 * Returns empty array if any grade is acceptable.
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
 * Calendar structure settings by tier.
 * Higher tiers have more condensed schedules.
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
 * Get calendar settings for a tier.
 */
export function getCalendarSettingsForTier(tier: TeamTier): CalendarSettings {
  return TIER_CALENDAR_SETTINGS[tier] || TIER_CALENDAR_SETTINGS.amateur
}


// ============================================
// MAX ROUND CAPS BY TIER (soft caps)
// ============================================

/**
 * Maximum reasonable rounds per season by tier.
 * Used as an upper cap - actual rounds are min(this, seasonRounds, availableTracks).
 */
export const TIER_MAX_ROUNDS: Record<TeamTier, number> = {
  pinnacle: 24,
  elite: 16,
  pro: 14,
  professional: 12,
  'semi-pro': 10,
  amateur: 8,
  entry: 6,
}

/**
 * Get max rounds for a tier (used as upper cap only).
 */
export function getMaxRoundsForTier(tier: TeamTier): number {
  return TIER_MAX_ROUNDS[tier] || 10
}
