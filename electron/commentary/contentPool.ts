/**
 * Commentary Content Pool System
 * 
 * Pre-generates rich, contextual color commentary content at race start to enable
 * continuous TV broadcast-style commentary without excessive API calls.
 * 
 * Leverages ALL game data: career stats, finances, personal life, sponsors,
 * media, staff, logistics, health, pressure, season narrative, and more.
 * Uses multi-pass generation for 80+ deeply contextual, unique lines per race.
 */

import { logCommentaryDecision } from '../services/debugLogger'
import { 
  getSeriesProfile, 
  buildAvoidTermsPrompt, 
  buildPreferredTermsPrompt,
  SeriesCategory 
} from '../../src/data/series-commentary'

interface DriverNarrative {
  id?: string
  name?: string
  nationality?: string
  age?: number
  careerStage?: string
  drivingStyle?: string
  biography?: string
  rivalries?: string[]
  quirks?: string[]
  nickname?: string
  famousQuote?: string
  careerHighlight?: string
  careerLowPoint?: string
  championships?: number
  totalWins?: number
  [key: string]: unknown
}

interface TrackNarrative {
  id?: string
  name?: string
  historicalNotes?: string[]
  keyCorners?: string[]
  atmosphere?: string
  trackCharacter?: string
  nickname?: string
  famousCorners?: Array<{ name?: string; description?: string; challenge?: string }>
  keyFactors?: string[]
  weatherNotes?: string
  historySnippets?: string[]
  overtakingSpots?: string[]
  [key: string]: unknown
}

interface RivalDriver {
  id: string
  firstName?: string
  lastName?: string
  nationality?: string
  [key: string]: unknown
}

// ============================================================================
// TYPES
// ============================================================================

export type ContentCategory = 
  // --- Original categories ---
  | 'track_atmosphere'
  | 'track_history' 
  | 'corner_callout'
  | 'driver_background'
  | 'driver_style'
  | 'driver_rivalry'
  | 'championship_context'
  | 'strategy_talk'
  | 'weather_observation'
  | 'position_battle'
  | 'gap_analysis'
  | 'sector_observation'
  // --- New rich data categories ---
  | 'player_track_history'    // Player's personal history at this track
  | 'career_milestone'        // Records near breaking, GOAT progress, achievement stats
  | 'form_narrative'          // Current form, streaks, momentum
  | 'team_dynamics'           // Facilities, staff, car performance, board mood
  | 'financial_drama'         // Sponsor pressure, budget concerns, merchandise
  | 'personal_color'          // Relationship, health, lifestyle, off-track life
  | 'qualifying_callback'     // Reference qualifying results during race
  | 'pressure_narrative'      // Title fight, championship pressure, contract pressure
  | 'underdog_moment'         // Coming from the back, giant-killer opportunities
  | 'pit_reporter_insight'    // Paddock gossip, team radio style, garage intel
  | 'season_arc'              // Season narrative, trajectory, story so far
  | 'head_to_head'            // Direct rival comparisons, rivalry history
  | 'world_context'           // Merchandise, investments, media fame, off-track business

export type VoiceRole = 'lead' | 'analyst'

export interface GeneratedLine {
  id: string
  text: string
  category: ContentCategory
  voice: VoiceRole
  priority: number           // 1-10, higher = more important
  relevantLap?: 'early' | 'mid' | 'late' | 'final' | 'any'
  driverId?: string          // If about a specific driver
  sectorRelevant?: 1 | 2 | 3 // If sector-specific
  used: boolean
  generatedAt: number
}

export interface RaceContentPool {
  raceId: string
  trackId: string
  seriesId: string
  
  // Content buckets
  trackContent: GeneratedLine[]
  driverContent: GeneratedLine[]
  championshipContent: GeneratedLine[]
  strategyContent: GeneratedLine[]
  worldContent: GeneratedLine[]       // NEW: team dynamics, finances, sponsors, logistics
  personalContent: GeneratedLine[]    // NEW: personal life, media, career milestones, pressure
  
  // Tracking
  usedIds: Set<string>
  generatedAt: number
  totalGenerated: number
}

// ============================================================================
// RICH CONTENT POOL CONTEXT - Accepts ALL game data
// ============================================================================

export interface ContentPoolContext {
  // --- Core race info ---
  trackId: string
  trackName: string
  trackNarrative?: TrackNarrative
  
  seriesId: string
  seriesName: string
  seriesCategory?: SeriesCategory
  
  drivers: Array<{
    id: string
    name: string
    teamName: string
    position: number
    narrative?: DriverNarrative
    pointsPosition?: number
  }>
  
  championshipStandings?: Array<{
    driverName: string
    points: number
    position: number
    wins: number
    podiums?: number
    dnfs?: number
    avgFinish?: number
    isPlayer?: boolean
  }>
  
  playerName: string
  playerPosition?: number
  playerPointsPosition?: number
  
  currentLap?: number
  totalLaps: number
  weather?: string
  
  // --- Session context ---
  sessionType?: 'practice' | 'qualifying' | 'race'
  qualifyingPosition?: number       // Player's quali result (if in race session)
  qualifyingBest?: number           // Best quali lap time in seconds
  practiceBest?: number             // Best practice lap time in seconds
  
  // --- Player career context ---
  playerCareer?: {
    totalRaces: number
    totalWins: number
    totalPodiums: number
    totalPoles: number
    totalFastestLaps: number
    championships: number
    consecutiveWins: number
    consecutivePodiums: number
    consecutivePoints: number
    comebackWins: number
    hatTricks: number
    grandSlams: number
    wetRaceWins?: number
    reputation: number
    experienceLevel: string         // 'Rookie' | 'Sophomore' | 'Veteran'
    isRookie: boolean
    age: number
    nationality: string
  }
  
  // --- Player track history (THIS track) ---
  playerTrackHistory?: {
    visits: number
    wins: number
    podiums: number
    poles: number
    fastestLaps: number
    dnfs: number
    bestFinish: number
    worstFinish: number
    avgFinish: number
    consecutiveWins: number
    maxConsecutiveWins: number
    lastResult: number
    firstVisitYear: number
    lastVisitYear: number
    seriesRacedHere: string[]
  }
  
  // --- Season form ---
  seasonForm?: {
    seasonWins: number
    seasonPodiums: number
    seasonPoles: number
    seasonFastestLaps: number
    seasonDNFs: number
    seasonAvgFinish: number
    seasonBestFinish: number
    racesCompleted: number
    currentStreak: string           // e.g. "3 podiums in last 5 races"
    lastRaceResult?: number
    lastTrackName?: string
  }
  
  // --- GOAT / milestones ---
  goatProgress?: {
    currentTier: string
    tierProgress: number
    recordsNearBreaking?: Array<{
      recordName: string
      currentValue: number
      recordValue: number
      gap: number
    }>
    recordBreakingMoment?: string   // If winning this race breaks a record
    recentMilestones?: string[]
    tripleCrownProgress?: string
  }
  
  // --- Rivalry data ---
  rivalry?: {
    rivalName: string
    rivalTeam?: string
    rivalryIntensity: number        // 0-100
    rivalPosition?: number          // Current race position
    rivalChampionshipPosition?: number
    rivalSeasonWins?: number
    relationshipWithPlayer?: number // -100 to 100
  }
  
  // --- Championship drama ---
  championshipDrama?: {
    pointsGapToLeader: number
    pointsGapToAhead: number
    pointsGapToBehind: number
    driverAheadInStandings?: string
    driverBehindInStandings?: string
    titleFightStatus: string        // 'leading' | 'contending' | 'long_shot' | 'out_of_contention'
    mathematicallyAlive: boolean
    maxPointsRemaining: number
    racesRemaining: number
    isSeasonOpener: boolean
    isSeasonFinale: boolean
    currentRound: number
    totalRounds: number
  }
  
  // --- Team dynamics ---
  teamDynamics?: {
    teamName: string
    teamReputation: number
    teamMorale?: number
    boardMood?: number
    carPerformance?: number         // 0-100
    carReliability?: number         // 0-100
    staffMoraleAvg?: number
    facilityLevels?: {
      aero: number
      chassis: number
      engine: number
      sim: number
      manufacturing: number
    }
    upgradeInProgress?: string      // e.g. "Aero facility upgrading to Level 3"
    hiredDriverName?: string        // Second driver name
    hiredDriverSeasonWins?: number
    hiredDriverSeasonPodiums?: number
  }
  
  // --- Financial snapshot ---
  financialSnapshot?: {
    runwayStatus: string            // 'healthy' | 'stable' | 'caution' | 'critical' | 'emergency'
    costCapUsagePercent?: number
    activeSponsorCount: number
    merchandiseWeeklyRevenue?: number
    topSellingProduct?: string
    sponsorsAtRisk?: number         // Count of unhappy sponsors
    recentBigDeal?: string          // e.g. "Signed $500K title sponsor this week"
  }
  
  // --- Sponsor pressure ---
  sponsorPressure?: {
    totalSponsors: number
    sponsorWarnings: number         // Sponsors that issued warnings
    targetsMetCount: number
    targetsTotalCount: number
    lowestSatisfaction?: number     // Worst sponsor satisfaction
    titleSponsorHappy?: boolean
  }
  
  // --- Personal life highlights ---
  personalLife?: {
    relationshipStatus: string      // 'single' | 'dating' | 'engaged' | 'married' | 'divorced'
    partnerName?: string
    childrenCount: number
    recentLifeEvent?: string        // e.g. "Married last month" or "Baby born 3 weeks ago"
    healthLevel: number             // 0-100
    fitnessLevel: number            // 0-100
    stressLevel: number             // 0-100
    lifestyleTier: string           // 'modest' | 'comfortable' | 'affluent' | 'luxurious' | 'ultra_luxury'
    injuryStatus?: string           // e.g. "Recovering from wrist injury"
  }
  
  // --- Media / social ---
  mediaProfile?: {
    mediaPersona: string            // 'professional' | 'entertainer' | 'controversial' | 'beloved' | 'unknown'
    followerCount: number
    recentHeadline?: string
    controversyLevel: number        // 0-100
    publicPerception: number        // 0-100
    viralPosts?: number
    mediaReachTier?: string         // 'local' | 'regional' | 'national' | 'global' | 'legendary'
  }
  
  // --- Pressure state ---
  pressureState?: {
    currentPressure: number         // 0-100
    pressureType: string            // 'normal' | 'high' | 'extreme' | 'critical'
    titleFight: boolean
    homeRace: boolean
    contractPressure: boolean
    streakType?: string             // 'winning' | 'podium' | 'losing' | null
    streakLength?: number
  }
  
  // --- Logistics snapshot ---
  logisticsSnapshot?: {
    raceKitReady: boolean
    partsShortage: boolean
    shortageDetails?: string        // e.g. "Low on brake discs"
    manufacturingActive: boolean
    manufacturingJobs?: number
  }
  
  // --- Contract context ---
  contractContext?: {
    contractEndingSoon: boolean
    contractTargetsMet: number
    contractTargetsTotal: number
    teamSatisfaction?: number       // 0-100
    teamWarningIssued: boolean
  }

  // --- Paddock world snapshot (Phase 2) ---
  worldSnapshot?: {
    generatedAt: string
    seriesId?: string
    seriesName?: string
    currentRound: number
    totalRounds: number
    racesRemaining: number
    titleFightStatus?: string
    teamCount: number
    driverCount: number
    teams: Array<{
      id: string
      name: string
      shortName?: string
      points: number
      wins: number
      avgFinish?: number
      trend?: 'rising' | 'stable' | 'falling'
      reliabilityRisk?: 'low' | 'moderate' | 'high'
      sponsorPressure?: 'none' | 'low' | 'moderate' | 'high'
    }>
    drivers: Array<{
      id: string
      name: string
      teamId?: string
      teamName?: string
      points?: number
      wins?: number
      recentForm?: string
      rivalryIntensity?: number
    }>
    coverageLanes: {
      frontRunners: string[]
      midfield: string[]
      underdogs: string[]
    }
    marketSignals: {
      activeSponsors: number
      sponsorsAtRisk: number
      budgetPressure: 'none' | 'low' | 'moderate' | 'high'
      boardPressure?: number
    }
  }
}

// ============================================================================
// CONTENT POOL STATE
// ============================================================================

let currentPool: RaceContentPool | null = null

/**
 * Get current content pool
 */
export function getContentPool(): RaceContentPool | null {
  return currentPool
}

/**
 * Clear content pool
 */
export function clearContentPool(): void {
  currentPool = null
}

/**
 * Load a pre-generated content pool from Content Studio data.
 * Maps the PreRaceContent shape to the internal RaceContentPool structure.
 */
export function loadPreGeneratedContentPool(
  trackId: string,
  seriesId: string,
  preGenData: {
    atmosphereSnippets?: string[]
    driverSnippets?: string[]
    strategyPoints?: string[]
    historicalReferences?: string[]
    weatherCommentary?: string[]
    gridWalkQuotes?: string[]
    cornerCallouts?: string[]
  }
): RaceContentPool {
  const lines: GeneratedLine[] = []
  let idCounter = 0

  const makeLine = (text: string, category: ContentCategory, voice: VoiceRole = 'analyst', priority = 5, lapPhase: 'early' | 'mid' | 'late' | 'any' = 'any'): GeneratedLine => ({
    id: `pregen-${trackId}-${idCounter++}`,
    text,
    category,
    voice,
    priority,
    relevantLap: lapPhase,
    used: false,
    generatedAt: Date.now()
  })

  if (preGenData.atmosphereSnippets) {
    for (const snippet of preGenData.atmosphereSnippets) {
      lines.push(makeLine(snippet, 'track_atmosphere', 'analyst', 6, 'early'))
    }
  }
  if (preGenData.historicalReferences) {
    for (const snippet of preGenData.historicalReferences) {
      lines.push(makeLine(snippet, 'track_history', 'analyst', 4))
    }
  }
  if (preGenData.cornerCallouts) {
    for (const snippet of preGenData.cornerCallouts) {
      lines.push(makeLine(snippet, 'corner_callout', 'lead', 6, 'mid'))
    }
  }
  if (preGenData.strategyPoints) {
    for (const snippet of preGenData.strategyPoints) {
      lines.push(makeLine(snippet, 'strategy_talk', 'analyst', 5, 'mid'))
    }
  }
  if (preGenData.weatherCommentary) {
    for (const snippet of preGenData.weatherCommentary) {
      lines.push(makeLine(snippet, 'weather_observation', 'analyst', 3, 'early'))
    }
  }
  if (preGenData.gridWalkQuotes) {
    for (const snippet of preGenData.gridWalkQuotes) {
      lines.push(makeLine(snippet, 'pit_reporter_insight', 'lead', 4, 'early'))
    }
  }
  if (preGenData.driverSnippets) {
    for (const snippet of preGenData.driverSnippets) {
      lines.push(makeLine(snippet, 'driver_background', 'lead', 5))
    }
  }

  // Distribute lines into content buckets
  const trackContent = lines.filter(l =>
    l.category === 'track_atmosphere' || l.category === 'track_history' ||
    l.category === 'weather_observation' || l.category === 'corner_callout'
  )
  const driverContent = lines.filter(l => l.category === 'driver_background' || l.category === 'driver_style' || l.category === 'pit_reporter_insight')
  const strategyContent = lines.filter(l => l.category === 'strategy_talk')
  const championshipContent: GeneratedLine[] = []
  const worldContent: GeneratedLine[] = []
  const personalContent: GeneratedLine[] = []

  const pool: RaceContentPool = {
    raceId: `pregen-${seriesId}-${trackId}-${Date.now()}`,
    trackId,
    seriesId,
    trackContent,
    driverContent,
    championshipContent,
    strategyContent,
    worldContent,
    personalContent,
    usedIds: new Set<string>(),
    generatedAt: Date.now(),
    totalGenerated: lines.length
  }

  currentPool = pool
  console.log(`[ContentPool] Loaded pre-generated pool: ${lines.length} lines for track ${trackId}`)
  logCommentaryDecision(
    'PREGEN_POOL_LOADED',
    `Loaded pre-generated commentary pool for ${trackId}`,
    {
      trackId,
      seriesId,
      lineCount: lines.length,
      hasAtmosphere: (preGenData.atmosphereSnippets?.length || 0) > 0,
      hasDriver: (preGenData.driverSnippets?.length || 0) > 0,
      hasStrategy: (preGenData.strategyPoints?.length || 0) > 0,
      hasHistory: (preGenData.historicalReferences?.length || 0) > 0,
      hasWeather: (preGenData.weatherCommentary?.length || 0) > 0,
      hasGrid: (preGenData.gridWalkQuotes?.length || 0) > 0,
    },
    'event'
  )
  return pool
}

// ============================================================================
// CONTENT GENERATION - Multi-Pass System
// ============================================================================

/**
 * Generate the pre-race content pool using multi-pass generation.
 * Called when RaceDay screen loads, before race starts.
 * 
 * 5 focused passes produce 80+ deeply contextual lines:
 *  Pass 1: Track & Atmosphere (~15 lines)
 *  Pass 2: Driver Stories & Rivalries (~20 lines)
 *  Pass 3: Championship Drama (~15 lines)
 *  Pass 4: Team & Career World (~15 lines)
 *  Pass 5: Session-Specific Color (~15 lines)
 */
export async function generateRaceContentPool(
  context: ContentPoolContext,
  apiKey: string,
  onProgress?: (stage: string, progress: number) => void
): Promise<RaceContentPool> {
  
  console.log(`[ContentPool] Generating RICH content for ${context.trackName} (${context.seriesName})`)
  console.log(`[ContentPool] Data available: career=${!!context.playerCareer}, trackHistory=${!!context.playerTrackHistory}, team=${!!context.teamDynamics}, personal=${!!context.personalLife}, pressure=${!!context.pressureState}`)
  
  const pool: RaceContentPool = {
    raceId: `${context.seriesId}-${context.trackId}-${Date.now()}`,
    trackId: context.trackId,
    seriesId: context.seriesId,
    trackContent: [],
    driverContent: [],
    championshipContent: [],
    strategyContent: [],
    worldContent: [],
    personalContent: [],
    usedIds: new Set(),
    generatedAt: Date.now(),
    totalGenerated: 0
  }
  
  // Get series-specific profile for all passes
  const seriesCategory = context.seriesCategory || 'gt-sportscar'
  const seriesProfile = getSeriesProfile(seriesCategory)
  const avoidTerms = buildAvoidTermsPrompt(seriesCategory)
  const preferredTerms = buildPreferredTermsPrompt(seriesCategory)
  const seriesHeader = `SERIES: ${seriesProfile.displayName} (${seriesProfile.category.toUpperCase()} racing)\n${seriesProfile.culturalContext}\n${avoidTerms}\n${preferredTerms}`
  
  try {
    // ── Pass 1: Track & Atmosphere ──
    onProgress?.('Generating track commentary...', 0.05)
    const pass1 = await generatePass_TrackAtmosphere(context, apiKey, seriesHeader)
    for (const line of pass1) pool.trackContent.push(line)
    
    // ── Pass 2: Driver Stories & Rivalries ──
    onProgress?.('Generating driver stories...', 0.25)
    const pass2 = await generatePass_DriverStories(context, apiKey, seriesHeader)
    for (const line of pass2) pool.driverContent.push(line)
    
    // ── Pass 3: Championship Drama ──
    onProgress?.('Generating championship drama...', 0.45)
    const pass3 = await generatePass_ChampionshipDrama(context, apiKey, seriesHeader)
    for (const line of pass3) pool.championshipContent.push(line)
    
    // ── Pass 4: Team & Career World ──
    onProgress?.('Generating world context...', 0.65)
    const pass4 = await generatePass_TeamCareerWorld(context, apiKey, seriesHeader)
    for (const line of pass4) pool.worldContent.push(line)
    
    // ── Pass 5: Session-Specific Color ──
    onProgress?.('Generating session color...', 0.85)
    const pass5 = await generatePass_SessionColor(context, apiKey, seriesHeader)
    // Distribute pass 5 across buckets
    for (const line of pass5) {
      sortLineIntoBucket(line, pool)
    }
    
    // Add data-driven fallback lines for any thin areas
    const fallbackLines = generateRichFallbackContent(context)
    for (const line of fallbackLines) {
      sortLineIntoBucket(line, pool)
    }
    
    pool.totalGenerated = pool.trackContent.length + pool.driverContent.length + 
      pool.championshipContent.length + pool.strategyContent.length + 
      pool.worldContent.length + pool.personalContent.length
    
    currentPool = pool
    
    onProgress?.('Content pool ready', 1.0)
    console.log(`[ContentPool] Generated ${pool.totalGenerated} lines of rich commentary:`)
    console.log(`  Track: ${pool.trackContent.length}, Drivers: ${pool.driverContent.length}, Championship: ${pool.championshipContent.length}`)
    console.log(`  Strategy: ${pool.strategyContent.length}, World: ${pool.worldContent.length}, Personal: ${pool.personalContent.length}`)
    
    return pool
    
  } catch (error) {
    console.error('[ContentPool] Multi-pass generation failed:', error)
    
    // Fall back to rich data-driven templates
    const fallbackLines = generateRichFallbackContent(context)
    for (const line of fallbackLines) {
      sortLineIntoBucket(line, pool)
    }
    
    pool.totalGenerated = fallbackLines.length
    currentPool = pool
    onProgress?.('Content pool ready (fallback)', 1.0)
    console.log(`[ContentPool] Fallback pool: ${pool.totalGenerated} data-driven lines`)
    return pool
  }
}

// ============================================================================
// PASS 1: Track & Atmosphere
// ============================================================================

async function generatePass_TrackAtmosphere(
  context: ContentPoolContext,
  apiKey: string,
  seriesHeader: string
): Promise<GeneratedLine[]> {
  
  const trackContext = context.trackNarrative 
    ? `Track: ${context.trackName}
Atmosphere: ${context.trackNarrative.atmosphere}
Character: ${context.trackNarrative.trackCharacter}
${context.trackNarrative.nickname ? `Nickname: "${context.trackNarrative.nickname}"` : ''}
Famous corners: ${(context.trackNarrative.famousCorners || []).map(c => `${c.name || 'Unknown'} (${c.description || c.challenge || 'challenge'})`).join(', ')}
Key factors: ${(context.trackNarrative.keyFactors || []).join(', ')}
${context.trackNarrative.weatherNotes || ''}
${Array.isArray(context.trackNarrative.historySnippets) ? `History: ${context.trackNarrative.historySnippets.slice(0, 3).join('. ')}` : ''}
${Array.isArray(context.trackNarrative.overtakingSpots) ? `Overtaking spots: ${context.trackNarrative.overtakingSpots.join(', ')}` : ''}`
    : `Track: ${context.trackName}`

  // Player's personal history at this track
  const playerTrackSection = context.playerTrackHistory && context.playerTrackHistory.visits > 0
    ? `\nPLAYER'S HISTORY AT THIS TRACK:
- ${context.playerTrackHistory.visits} previous visits
- ${context.playerTrackHistory.wins} wins, ${context.playerTrackHistory.podiums} podiums, ${context.playerTrackHistory.poles} poles
- Best finish: P${context.playerTrackHistory.bestFinish}${context.playerTrackHistory.worstFinish ? `, worst: P${context.playerTrackHistory.worstFinish}` : ''}
- Average finish: P${context.playerTrackHistory.avgFinish.toFixed(1)}
${context.playerTrackHistory.consecutiveWins > 0 ? `- Currently on a ${context.playerTrackHistory.consecutiveWins}-race win streak HERE` : ''}
${context.playerTrackHistory.dnfs > 0 ? `- ${context.playerTrackHistory.dnfs} DNFs here (knows heartbreak at this track)` : ''}
- Last result here: P${context.playerTrackHistory.lastResult}
- First visited: ${context.playerTrackHistory.firstVisitYear}`
    : context.playerTrackHistory 
      ? `\nPLAYER'S HISTORY AT THIS TRACK:\n- FIRST EVER VISIT! Brand new venue for ${context.playerName}.`
      : ''

  const prompt = `Generate TV broadcast commentary lines about this track and its atmosphere.

${seriesHeader}

${trackContext}
${playerTrackSection}

- Series: ${context.seriesName}
- Total Laps: ${context.totalLaps}
- Player: ${context.playerName}
${context.weather ? `- Weather: ${context.weather}` : ''}

Generate 12-15 lines covering:
- Track atmosphere/character (3-4 lines)
- Famous corners and overtaking spots (3-4 lines)
- Player's personal track history - their record here, memories, emotional connection (3-4 lines, ONLY if history data provided)
- Weather impact if relevant (1-2 lines)
- Track history/heritage (2-3 lines)

For each line:
- "text": Natural commentary (15-40 words)
- "category": One of: track_atmosphere, track_history, corner_callout, player_track_history, weather_observation, sector_observation
- "voice": "lead" for exciting/atmospheric, "analyst" for factual/technical
- "lap_phase": "early", "mid", "late", "final", or "any"

Return JSON array. No markdown.`

  return callGeminiAndParse(prompt, apiKey, context, 'pass1')
}

// ============================================================================
// PASS 2: Driver Stories & Rivalries
// ============================================================================

async function generatePass_DriverStories(
  context: ContentPoolContext,
  apiKey: string,
  seriesHeader: string
): Promise<GeneratedLine[]> {
  
  const topDrivers = context.drivers.slice(0, 12)
  const driverContext = topDrivers.map(d => {
    const narrative = d.narrative
    if (narrative) {
      return `${d.name} (${d.teamName}, Grid P${d.position}${d.pointsPosition ? `, Champ P${d.pointsPosition}` : ''}): ${narrative.drivingStyle || ''}. ${narrative.quirks?.[0] || narrative.careerHighlight || ''}`
    }
    return `${d.name} (${d.teamName}, Grid P${d.position}${d.pointsPosition ? `, Champ P${d.pointsPosition}` : ''})`
  }).join('\n')
  
  // Rivalry context
  const rivalrySection = context.rivalry
    ? `\nKEY RIVALRY:
${context.playerName} vs ${context.rivalry.rivalName}${context.rivalry.rivalTeam ? ` (${context.rivalry.rivalTeam})` : ''}
- Rivalry intensity: ${context.rivalry.rivalryIntensity}/100
- Rival championship position: P${context.rivalry.rivalChampionshipPosition || '?'}
- Rival season wins: ${context.rivalry.rivalSeasonWins || 0}
- Relationship: ${context.rivalry.relationshipWithPlayer !== undefined ? (context.rivalry.relationshipWithPlayer > 20 ? 'Respectful' : context.rivalry.relationshipWithPlayer < -20 ? 'Hostile' : 'Tense') : 'Unknown'}`
    : ''
  
  // Player form for comparison
  const playerFormSection = context.seasonForm
    ? `\nPLAYER FORM (${context.playerName}):
- Season: ${context.seasonForm.seasonWins}W ${context.seasonForm.seasonPodiums}P from ${context.seasonForm.racesCompleted} races
- Average finish: P${context.seasonForm.seasonAvgFinish.toFixed(1)}
${context.seasonForm.currentStreak ? `- Current streak: ${context.seasonForm.currentStreak}` : ''}
${context.seasonForm.lastRaceResult ? `- Last race: P${context.seasonForm.lastRaceResult} at ${context.seasonForm.lastTrackName || 'unknown'}` : ''}`
    : ''

  const prompt = `Generate TV broadcast commentary about the drivers in this race.

${seriesHeader}

DRIVERS ON THE GRID:
${driverContext}
${rivalrySection}
${playerFormSection}

Generate 15-20 lines covering:
- Driver backgrounds and stories (5-7 lines about DIFFERENT drivers)
- Driving style observations (3-4 lines)
- Rivalry narratives - tension between specific drivers (3-4 lines)
- Head-to-head comparisons (2-3 lines)
- Player's form and momentum (2-3 lines)

For each line:
- "text": Natural commentary (15-40 words)
- "category": One of: driver_background, driver_style, driver_rivalry, head_to_head, form_narrative
- "voice": "lead" for dramatic/emotional stories, "analyst" for stats/comparison
- "lap_phase": "early", "mid", "late", or "any"
- "driver_name": The driver this line is about (optional)

Return JSON array. No markdown.`

  return callGeminiAndParse(prompt, apiKey, context, 'pass2')
}

// ============================================================================
// PASS 3: Championship Drama
// ============================================================================

async function generatePass_ChampionshipDrama(
  context: ContentPoolContext,
  apiKey: string,
  seriesHeader: string
): Promise<GeneratedLine[]> {
  
  // Full championship standings
  const standingsSection = context.championshipStandings?.slice(0, 8).map((s, i) => 
    `${i + 1}. ${s.driverName}: ${s.points}pts (${s.wins}W${s.podiums ? ` ${s.podiums}P` : ''}${s.dnfs ? ` ${s.dnfs}DNF` : ''})${s.isPlayer ? ' ← PLAYER' : ''}`
  ).join('\n') || 'Championship standings not available'
  
  // Championship drama details
  const dramaSection = context.championshipDrama
    ? `\nCHAMPIONSHIP SITUATION:
- Round ${context.championshipDrama.currentRound} of ${context.championshipDrama.totalRounds} (${context.championshipDrama.racesRemaining} races remaining)
- Title fight status: ${context.championshipDrama.titleFightStatus.replace(/_/g, ' ').toUpperCase()}
- Gap to leader: ${context.championshipDrama.pointsGapToLeader} points
${context.championshipDrama.driverAheadInStandings ? `- Driver ahead: ${context.championshipDrama.driverAheadInStandings} (${context.championshipDrama.pointsGapToAhead}pts ahead)` : ''}
${context.championshipDrama.driverBehindInStandings ? `- Driver behind: ${context.championshipDrama.driverBehindInStandings} (${context.championshipDrama.pointsGapToBehind}pts behind)` : ''}
- Mathematically alive: ${context.championshipDrama.mathematicallyAlive ? 'YES' : 'NO'}
- Max points remaining: ${context.championshipDrama.maxPointsRemaining}
${context.championshipDrama.isSeasonOpener ? '- THIS IS THE SEASON OPENER!' : ''}
${context.championshipDrama.isSeasonFinale ? '- THIS IS THE SEASON FINALE! Everything on the line!' : ''}`
    : ''
  
  // GOAT / milestone context
  const milestoneSection = context.goatProgress
    ? `\nCAREER MILESTONES (${context.playerName}):
- GOAT Tier: ${context.goatProgress.currentTier} (${context.goatProgress.tierProgress}% to next)
${context.goatProgress.recordBreakingMoment ? `- *** RECORD ALERT: ${context.goatProgress.recordBreakingMoment} ***` : ''}
${context.goatProgress.recordsNearBreaking?.map(r => `- Near record: ${r.recordName} (needs ${r.gap} more, currently ${r.currentValue}/${r.recordValue})`).join('\n') || ''}
${context.goatProgress.recentMilestones?.length ? `- Recent milestones: ${context.goatProgress.recentMilestones.join(', ')}` : ''}
${context.goatProgress.tripleCrownProgress ? `- Triple Crown: ${context.goatProgress.tripleCrownProgress}` : ''}`
    : ''
  
  // Pressure context
  const pressureSection = context.pressureState
    ? `\nPRESSURE LEVEL: ${context.pressureState.currentPressure}/100 (${context.pressureState.pressureType})
${context.pressureState.titleFight ? '- In a TITLE FIGHT' : ''}
${context.pressureState.homeRace ? '- HOME RACE - extra expectation from the fans' : ''}
${context.pressureState.contractPressure ? '- CONTRACT YEAR - needs results to secure future' : ''}
${context.pressureState.streakType ? `- On a ${context.pressureState.streakLength}-race ${context.pressureState.streakType} streak` : ''}`
    : ''

  const prompt = `Generate TV broadcast commentary about the championship battle and career drama.

${seriesHeader}

CHAMPIONSHIP STANDINGS:
${standingsSection}
${dramaSection}
${milestoneSection}
${pressureSection}

Player: ${context.playerName}${context.playerCareer ? ` (${context.playerCareer.totalWins} career wins, ${context.playerCareer.championships} titles)` : ''}

Generate 12-15 lines covering:
- Championship title fight implications (4-5 lines)
- Points gap drama and what-if scenarios (2-3 lines)
- Career milestone/record-chasing moments (2-3 lines, ONLY if milestone data provided)
- Pressure narratives - what's at stake (2-3 lines)
- Season arc - the story of this championship so far (2-3 lines)

For each line:
- "text": Natural commentary (15-40 words)
- "category": One of: championship_context, pressure_narrative, career_milestone, season_arc, gap_analysis
- "voice": "lead" for dramatic title fight moments, "analyst" for statistical analysis
- "lap_phase": "early", "mid", "late", "final", or "any"

Return JSON array. No markdown.`

  return callGeminiAndParse(prompt, apiKey, context, 'pass3')
}

// ============================================================================
// PASS 4: Team & Career World
// ============================================================================

async function generatePass_TeamCareerWorld(
  context: ContentPoolContext,
  apiKey: string,
  seriesHeader: string
): Promise<GeneratedLine[]> {
  
  // Team dynamics
  const teamSection = context.teamDynamics
    ? `TEAM SITUATION (${context.teamDynamics.teamName}):
- Team reputation: ${context.teamDynamics.teamReputation}/100
${context.teamDynamics.teamMorale !== undefined ? `- Team morale: ${context.teamDynamics.teamMorale}/100` : ''}
${context.teamDynamics.boardMood !== undefined ? `- Board mood: ${context.teamDynamics.boardMood}/100${context.teamDynamics.boardMood < 40 ? ' (BOARD UNHAPPY!)' : context.teamDynamics.boardMood > 75 ? ' (Board delighted)' : ''}` : ''}
${context.teamDynamics.carPerformance !== undefined ? `- Car performance: ${context.teamDynamics.carPerformance}/100` : ''}
${context.teamDynamics.carReliability !== undefined ? `- Car reliability: ${context.teamDynamics.carReliability}/100${context.teamDynamics.carReliability < 50 ? ' (RELIABILITY CONCERNS!)' : ''}` : ''}
${context.teamDynamics.upgradeInProgress ? `- Facility upgrade in progress: ${context.teamDynamics.upgradeInProgress}` : ''}
${context.teamDynamics.hiredDriverName ? `- Teammate: ${context.teamDynamics.hiredDriverName} (${context.teamDynamics.hiredDriverSeasonWins || 0}W, ${context.teamDynamics.hiredDriverSeasonPodiums || 0}P this season)` : ''}`
    : `TEAM: ${context.drivers[0]?.teamName || 'Unknown'}`
  
  // Financial context
  const financeSection = context.financialSnapshot
    ? `\nFINANCIAL SITUATION:
- Cash runway: ${context.financialSnapshot.runwayStatus.toUpperCase()}${context.financialSnapshot.runwayStatus === 'critical' || context.financialSnapshot.runwayStatus === 'emergency' ? ' ⚠️' : ''}
${context.financialSnapshot.costCapUsagePercent !== undefined ? `- Cost cap usage: ${context.financialSnapshot.costCapUsagePercent}%${context.financialSnapshot.costCapUsagePercent > 90 ? ' (NEAR THE LIMIT!)' : ''}` : ''}
- Active sponsors: ${context.financialSnapshot.activeSponsorCount}
${context.financialSnapshot.sponsorsAtRisk ? `- Sponsors at risk: ${context.financialSnapshot.sponsorsAtRisk} unhappy sponsor(s)` : ''}
${context.financialSnapshot.merchandiseWeeklyRevenue ? `- Merchandise bringing in $${(context.financialSnapshot.merchandiseWeeklyRevenue / 1000).toFixed(0)}K/week` : ''}
${context.financialSnapshot.recentBigDeal ? `- Recent deal: ${context.financialSnapshot.recentBigDeal}` : ''}`
    : ''
  
  // Sponsor pressure
  const sponsorSection = context.sponsorPressure
    ? `\nSPONSOR PRESSURE:
- ${context.sponsorPressure.totalSponsors} sponsors watching
- Targets met: ${context.sponsorPressure.targetsMetCount}/${context.sponsorPressure.targetsTotalCount}
${context.sponsorPressure.sponsorWarnings > 0 ? `- ${context.sponsorPressure.sponsorWarnings} sponsor(s) have issued WARNINGS` : ''}
${context.sponsorPressure.titleSponsorHappy === false ? '- TITLE SPONSOR is unhappy - MUST perform!' : ''}`
    : ''
  
  // Logistics
  const logisticsSection = context.logisticsSnapshot
    ? `\nLOGISTICS:
- Race kit: ${context.logisticsSnapshot.raceKitReady ? 'Ready' : 'NOT READY'}
${context.logisticsSnapshot.partsShortage ? `- PARTS SHORTAGE: ${context.logisticsSnapshot.shortageDetails || 'Low inventory'}` : ''}
${context.logisticsSnapshot.manufacturingActive ? `- Manufacturing: ${context.logisticsSnapshot.manufacturingJobs || 'several'} jobs in queue` : ''}`
    : ''
  
  // Contract context
  const contractSection = context.contractContext
    ? `\nCONTRACT SITUATION:
${context.contractContext.contractEndingSoon ? '- CONTRACT ENDING SOON - future at stake!' : ''}
- Targets met: ${context.contractContext.contractTargetsMet}/${context.contractContext.contractTargetsTotal}
${context.contractContext.teamWarningIssued ? '- Team has issued a WARNING' : ''}
${context.contractContext.teamSatisfaction !== undefined ? `- Team satisfaction: ${context.contractContext.teamSatisfaction}/100` : ''}`
    : ''
  
  // Personal life flavor
  const personalSection = context.personalLife
    ? `\nOFF-TRACK LIFE (${context.playerName}):
- Status: ${context.personalLife.relationshipStatus}${context.personalLife.partnerName ? ` to ${context.personalLife.partnerName}` : ''}
${context.personalLife.childrenCount > 0 ? `- ${context.personalLife.childrenCount} child(ren)` : ''}
${context.personalLife.recentLifeEvent ? `- Recent event: ${context.personalLife.recentLifeEvent}` : ''}
- Health: ${context.personalLife.healthLevel}/100, Fitness: ${context.personalLife.fitnessLevel}/100
${context.personalLife.stressLevel > 70 ? `- HIGH STRESS: ${context.personalLife.stressLevel}/100` : ''}
${context.personalLife.injuryStatus ? `- Injury: ${context.personalLife.injuryStatus}` : ''}
- Lifestyle: ${context.personalLife.lifestyleTier.replace(/_/g, ' ')}`
    : ''
  
  // Media profile
  const mediaSection = context.mediaProfile
    ? `\nMEDIA PROFILE:
- Persona: ${context.mediaProfile.mediaPersona}
- Followers: ${context.mediaProfile.followerCount > 1000000 ? `${(context.mediaProfile.followerCount / 1000000).toFixed(1)}M` : context.mediaProfile.followerCount > 1000 ? `${(context.mediaProfile.followerCount / 1000).toFixed(0)}K` : context.mediaProfile.followerCount}
${context.mediaProfile.recentHeadline ? `- Recent headline: "${context.mediaProfile.recentHeadline}"` : ''}
${context.mediaProfile.controversyLevel > 50 ? `- Controversy level: ${context.mediaProfile.controversyLevel}/100 (generating headlines!)` : ''}
${context.mediaProfile.viralPosts ? `- ${context.mediaProfile.viralPosts} viral posts this season` : ''}`
    : ''

  const worldSnapshotSection = context.worldSnapshot
    ? `\nPADDOCK SNAPSHOT:
- Round ${context.worldSnapshot.currentRound}/${context.worldSnapshot.totalRounds} (${context.worldSnapshot.racesRemaining} races remaining)
- Team coverage: ${context.worldSnapshot.teamCount} teams, ${context.worldSnapshot.driverCount} drivers
- Front-runners: ${context.worldSnapshot.coverageLanes.frontRunners.slice(0, 3).join(', ') || 'n/a'}
- Midfield: ${context.worldSnapshot.coverageLanes.midfield.slice(0, 3).join(', ') || 'n/a'}
- Underdogs: ${context.worldSnapshot.coverageLanes.underdogs.slice(0, 3).join(', ') || 'n/a'}
- Market: ${context.worldSnapshot.marketSignals.activeSponsors} active sponsors, ${context.worldSnapshot.marketSignals.sponsorsAtRisk} at risk, budget pressure ${context.worldSnapshot.marketSignals.budgetPressure}`
    : ''

  const prompt = `Generate TV broadcast commentary about the team, career world, and off-track context around this race.

${seriesHeader}

${teamSection}
${financeSection}
${sponsorSection}
${logisticsSection}
${contractSection}
${personalSection}
${mediaSection}
${worldSnapshotSection}

Player: ${context.playerName}

Generate 12-15 lines covering:
- Team dynamics and car concerns (3-4 lines)
- Financial/sponsor pressure - what's at stake commercially (2-3 lines, ONLY if data provided)
- Personal life color - humanizing the driver (2-3 lines, ONLY if data provided)
- Media/social presence (1-2 lines, ONLY if data provided)
- Pit reporter style insights from the garage/paddock (2-3 lines)
- World context - merchandise, business, off-track ventures (1-2 lines, ONLY if data provided)

IMPORTANT: Only generate lines for data that was ACTUALLY provided above. Do NOT invent financial figures or personal details.

For each line:
- "text": Natural commentary (15-40 words)
- "category": One of: team_dynamics, financial_drama, personal_color, pit_reporter_insight, world_context
- "voice": "lead" for dramatic/emotional, "analyst" for analytical
- "lap_phase": "early", "mid", "late", or "any"

Return JSON array. No markdown.`

  return callGeminiAndParse(prompt, apiKey, context, 'pass4')
}

// ============================================================================
// PASS 5: Session-Specific Color
// ============================================================================

async function generatePass_SessionColor(
  context: ContentPoolContext,
  apiKey: string,
  seriesHeader: string
): Promise<GeneratedLine[]> {
  
  const sessionType = context.sessionType || 'race'
  
  let sessionSpecificContext = ''
  let sessionInstructions = ''
  
  switch (sessionType) {
    case 'practice':
      sessionSpecificContext = `SESSION: Practice
- Drivers learning the track, finding setup
- Lap times less meaningful, exploring limits
${context.playerTrackHistory?.visits === 0 ? `- ${context.playerName} has NEVER been here before - everything is new` : ''}`
      
      sessionInstructions = `Generate practice-specific commentary:
- Setup talk and track learning (4-5 lines)
- Sector exploration and corner technique (3-4 lines)
- Driver approach comparisons (2-3 lines)
- Weather impact on setup choices (1-2 lines)
- Practice pace analysis (2-3 lines)`
      break
      
    case 'qualifying':
      sessionSpecificContext = `SESSION: Qualifying
- Pure speed, one-lap pace
- Grid positions at stake
${context.practiceBest ? `- ${context.playerName} best practice time: ${formatLapTime(context.practiceBest)}` : ''}`
      
      sessionInstructions = `Generate qualifying-specific commentary:
- Qualifying approach and strategy (3-4 lines)
- Sector time analysis (2-3 lines)
- Grid position implications (3-4 lines)
- Pressure of the single lap (2-3 lines)
- Track evolution through qualifying (2-3 lines)`
      break
      
    case 'race':
    default:
      sessionSpecificContext = `SESSION: Race
${context.qualifyingPosition ? `- ${context.playerName} starts P${context.qualifyingPosition}` : ''}
${context.qualifyingPosition && context.playerTrackHistory ? `- Qualified P${context.qualifyingPosition} at a track where they average P${context.playerTrackHistory.avgFinish.toFixed(0)}` : ''}
- ${context.totalLaps} laps`
      
      const underdogContext = context.qualifyingPosition && context.qualifyingPosition > 10
        ? `\n- Starting from the back: UNDERDOG OPPORTUNITY for a comeback drive`
        : context.qualifyingPosition === 1
          ? `\n- POLE POSITION: Everything to lose, starting from the front`
          : ''
      
      sessionSpecificContext += underdogContext
      
      sessionInstructions = `Generate race-specific commentary:
- Race strategy and tire management (3-4 lines)
- Qualifying callback - reference starting positions (2-3 lines)
- Position battle predictions (2-3 lines)
${context.qualifyingPosition && context.qualifyingPosition > 10 ? '- Underdog/comeback narrative (2-3 lines)' : ''}
${context.qualifyingPosition === 1 ? '- Pole position pressure and tactics (2-3 lines)' : ''}
- Race rhythm and pace observations (2-3 lines)
- Late race drama and scenarios (2-3 lines)`
      break
  }

  const prompt = `Generate session-specific TV broadcast commentary.

${seriesHeader}

${sessionSpecificContext}

Track: ${context.trackName}
Player: ${context.playerName}
${context.weather ? `Weather: ${context.weather}` : ''}

${sessionInstructions}

For each line:
- "text": Natural commentary (15-40 words)
- "category": One of: strategy_talk, qualifying_callback, position_battle, underdog_moment, sector_observation, weather_observation, form_narrative
- "voice": "lead" for dramatic, "analyst" for technical
- "lap_phase": "early", "mid", "late", "final", or "any"

Return JSON array. No markdown.`

  return callGeminiAndParse(prompt, apiKey, context, 'pass5')
}

// ============================================================================
// GEMINI API HELPER
// ============================================================================

async function callGeminiAndParse(
  prompt: string,
  apiKey: string,
  context: ContentPoolContext,
  passId: string
): Promise<GeneratedLine[]> {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gemini-2.0-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a motorsport broadcast producer creating commentary content. Generate varied, natural-sounding lines that a real TV commentator would say. Return ONLY a valid JSON array of objects. No markdown wrapping.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.85
      })
    })
    
    if (!response.ok) {
      console.error(`[ContentPool] ${passId} API error: ${response.status}`)
      return []
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    
    if (!content) return []
    
    // Parse JSON (handle markdown wrapping)
    let jsonStr = content
    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0].trim()
    } else if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0].trim()
    }
    
    const rawLines = JSON.parse(jsonStr)
    
    return rawLines.map((raw: any, idx: number) => ({
      id: `${passId}-${Date.now()}-${idx}`,
      text: raw.text || raw.content || '',
      category: mapCategory(raw.category),
      voice: raw.voice === 'analyst' ? 'analyst' as VoiceRole : 'lead' as VoiceRole,
      priority: getPriority(raw.category),
      relevantLap: mapLapPhase(raw.lap_phase),
      driverId: findDriverId(raw.driver_name, context.drivers),
      used: false,
      generatedAt: Date.now()
    })).filter((line: GeneratedLine) => line.text.length > 10)
    
  } catch (error) {
    console.error(`[ContentPool] ${passId} generation failed:`, error)
    return []
  }
}

// ============================================================================
// CONTENT SELECTION
// ============================================================================

/**
 * Get next available content from the pool
 */
export function getNextContent(
  category?: ContentCategory,
  lapPhase?: 'early' | 'mid' | 'late' | 'final',
  voice?: VoiceRole
): GeneratedLine | null {
  if (!currentPool) return null
  
  // Combine ALL content buckets (including new ones)
  const allContent = [
    ...currentPool.trackContent,
    ...currentPool.driverContent,
    ...currentPool.championshipContent,
    ...currentPool.strategyContent,
    ...currentPool.worldContent,
    ...currentPool.personalContent
  ]
  
  // Filter by criteria
  let candidates = allContent.filter(line => {
    if (line.used) return false
    if (category && line.category !== category) return false
    if (voice && line.voice !== voice) return false
    if (lapPhase && line.relevantLap !== 'any' && line.relevantLap !== lapPhase) return false
    return true
  })
  
  if (candidates.length === 0) {
    // Fallback: get any unused content
    candidates = allContent.filter(line => !line.used)
  }
  
  if (candidates.length === 0) return null
  
  // Sort by priority and pick randomly from top candidates
  candidates.sort((a, b) => b.priority - a.priority)
  const topCandidates = candidates.slice(0, Math.min(5, candidates.length))
  const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)]
  
  // Mark as used
  selected.used = true
  currentPool.usedIds.add(selected.id)
  
  return selected
}

/**
 * Get content about a specific driver
 */
export function getDriverContent(driverId: string): GeneratedLine | null {
  if (!currentPool) return null
  
  const candidate = currentPool.driverContent.find(
    line => !line.used && line.driverId === driverId
  )
  
  if (candidate) {
    candidate.used = true
    currentPool.usedIds.add(candidate.id)
  }
  
  return candidate || null
}

/**
 * Get sector-specific content
 */
export function getSectorContent(sector: 1 | 2 | 3): GeneratedLine | null {
  if (!currentPool) return null
  
  const candidate = currentPool.trackContent.find(
    line => !line.used && (line.sectorRelevant === sector || line.category === 'sector_observation')
  )
  
  if (candidate) {
    candidate.used = true
    currentPool.usedIds.add(candidate.id)
  }
  
  return candidate || null
}

/**
 * Get championship/position content
 */
export function getChampionshipContent(): GeneratedLine | null {
  return getNextContent('championship_context')
}

/**
 * Get pool statistics
 */
export function getPoolStats(): { total: number; used: number; remaining: number } | null {
  if (!currentPool) return null
  
  const total = currentPool.totalGenerated
  const used = currentPool.usedIds.size
  
  return {
    total,
    used,
    remaining: total - used
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function sortLineIntoBucket(line: GeneratedLine, pool: RaceContentPool): void {
  switch (line.category) {
    case 'track_atmosphere':
    case 'track_history':
    case 'corner_callout':
    case 'sector_observation':
    case 'player_track_history':
    case 'weather_observation':
      pool.trackContent.push(line)
      break
    case 'driver_background':
    case 'driver_style':
    case 'driver_rivalry':
    case 'head_to_head':
    case 'form_narrative':
      pool.driverContent.push(line)
      break
    case 'championship_context':
    case 'position_battle':
    case 'gap_analysis':
    case 'pressure_narrative':
    case 'career_milestone':
    case 'season_arc':
      pool.championshipContent.push(line)
      break
    case 'strategy_talk':
    case 'qualifying_callback':
    case 'underdog_moment':
      pool.strategyContent.push(line)
      break
    case 'team_dynamics':
    case 'financial_drama':
    case 'pit_reporter_insight':
    case 'world_context':
      pool.worldContent.push(line)
      break
    case 'personal_color':
      pool.personalContent.push(line)
      break
    default:
      pool.strategyContent.push(line)
      break
  }
}

function mapCategory(raw: string): ContentCategory {
  const mapping: Record<string, ContentCategory> = {
    // Original
    'track_atmosphere': 'track_atmosphere',
    'track_history': 'track_history',
    'corner_callout': 'corner_callout',
    'driver_background': 'driver_background',
    'driver_style': 'driver_style',
    'driver_rivalry': 'driver_rivalry',
    'championship_context': 'championship_context',
    'strategy_talk': 'strategy_talk',
    'weather_observation': 'weather_observation',
    'position_battle': 'position_battle',
    'gap_analysis': 'gap_analysis',
    'sector_observation': 'sector_observation',
    // New
    'player_track_history': 'player_track_history',
    'career_milestone': 'career_milestone',
    'form_narrative': 'form_narrative',
    'team_dynamics': 'team_dynamics',
    'financial_drama': 'financial_drama',
    'personal_color': 'personal_color',
    'qualifying_callback': 'qualifying_callback',
    'pressure_narrative': 'pressure_narrative',
    'underdog_moment': 'underdog_moment',
    'pit_reporter_insight': 'pit_reporter_insight',
    'season_arc': 'season_arc',
    'head_to_head': 'head_to_head',
    'world_context': 'world_context',
  }
  
  return mapping[raw?.toLowerCase()] || 'track_atmosphere'
}

function mapLapPhase(raw: string): GeneratedLine['relevantLap'] {
  if (!raw) return 'any'
  const phase = raw.toLowerCase()
  if (['early', 'mid', 'late', 'final'].includes(phase)) {
    return phase as GeneratedLine['relevantLap']
  }
  return 'any'
}

function getPriority(category: string): number {
  const priorities: Record<string, number> = {
    // Original
    'championship_context': 8,
    'driver_rivalry': 7,
    'driver_background': 6,
    'driver_style': 5,
    'track_atmosphere': 5,
    'corner_callout': 4,
    'strategy_talk': 4,
    'track_history': 3,
    'sector_observation': 3,
    'weather_observation': 2,
    'position_battle': 7,
    'gap_analysis': 6,
    // New - higher priority for dramatic/unique content
    'pressure_narrative': 9,
    'career_milestone': 9,
    'player_track_history': 8,
    'season_arc': 8,
    'head_to_head': 7,
    'form_narrative': 7,
    'qualifying_callback': 6,
    'underdog_moment': 8,
    'team_dynamics': 5,
    'financial_drama': 6,
    'personal_color': 5,
    'pit_reporter_insight': 4,
    'world_context': 4,
  }
  return priorities[category] || 5
}

function findDriverId(name: string | undefined, drivers: ContentPoolContext['drivers']): string | undefined {
  if (!name) return undefined
  const driver = drivers.find(d => 
    d.name.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(d.name.split(' ').pop()?.toLowerCase() || '')
  )
  return driver?.id
}

function formatLapTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : `${secs}s`
}

// ============================================================================
// RICH FALLBACK CONTENT - Data-driven templates (no API needed)
// ============================================================================

function generateRichFallbackContent(context: ContentPoolContext): GeneratedLine[] {
  const lines: GeneratedLine[] = []
  let id = 0
  const make = (text: string, category: ContentCategory, voice: VoiceRole, priority: number, lap: GeneratedLine['relevantLap'] = 'any'): GeneratedLine => ({
    id: `fallback-${id++}`,
    text,
    category,
    voice,
    priority,
    relevantLap: lap,
    used: false,
    generatedAt: Date.now()
  })
  
  // --- Track basics ---
  lines.push(make(
    `Welcome to ${context.trackName} for today's ${context.seriesName} action.`,
    'track_atmosphere', 'lead', 8, 'early'
  ))
  lines.push(make(
    `We have ${context.totalLaps} laps ahead of us today, and it should be quite a battle.`,
    'track_atmosphere', 'lead', 7, 'early'
  ))
  
  // --- Player track history ---
  const th = context.playerTrackHistory
  if (th && th.visits > 0) {
    lines.push(make(
      `${context.playerName} knows this place well, ${th.visits} previous visits with ${th.wins} win${th.wins !== 1 ? 's' : ''} and ${th.podiums} podium${th.podiums !== 1 ? 's' : ''}.`,
      'player_track_history', 'analyst', 8, 'early'
    ))
    if (th.consecutiveWins > 0) {
      lines.push(make(
        `${context.playerName} has won the last ${th.consecutiveWins} race${th.consecutiveWins !== 1 ? 's' : ''} here. This is becoming a fortress track.`,
        'player_track_history', 'lead', 9, 'early'
      ))
    }
    if (th.bestFinish <= 3) {
      lines.push(make(
        `A best finish of P${th.bestFinish} here. ${context.playerName} clearly has an affinity with this circuit.`,
        'player_track_history', 'analyst', 7, 'early'
      ))
    }
    if (th.dnfs > 0) {
      lines.push(make(
        `${th.dnfs} retirement${th.dnfs !== 1 ? 's' : ''} here in the past though. Not always a happy hunting ground.`,
        'player_track_history', 'analyst', 5, 'mid'
      ))
    }
    lines.push(make(
      `Last time here, ${context.playerName} finished P${th.lastResult}. Looking to improve on that today.`,
      'player_track_history', 'analyst', 6, 'early'
    ))
  } else if (th && th.visits === 0) {
    lines.push(make(
      `A brand new circuit for ${context.playerName} today. First time visiting ${context.trackName}.`,
      'player_track_history', 'lead', 8, 'early'
    ))
  }
  
  // --- Season form ---
  const sf = context.seasonForm
  if (sf) {
    if (sf.seasonWins > 0) {
      lines.push(make(
        `${context.playerName} has ${sf.seasonWins} win${sf.seasonWins !== 1 ? 's' : ''} this season from ${sf.racesCompleted} race${sf.racesCompleted !== 1 ? 's' : ''}. Strong form.`,
        'form_narrative', 'analyst', 7, 'early'
      ))
    }
    if (sf.currentStreak) {
      lines.push(make(
        `The form is there: ${sf.currentStreak} for ${context.playerName}.`,
        'form_narrative', 'lead', 7, 'mid'
      ))
    }
    if (sf.seasonAvgFinish <= 5) {
      lines.push(make(
        `An average finish of P${sf.seasonAvgFinish.toFixed(1)} this season. Consistently in the mix.`,
        'form_narrative', 'analyst', 6, 'mid'
      ))
    }
    if (sf.lastRaceResult) {
      lines.push(make(
        `Coming off a P${sf.lastRaceResult} last time out at ${sf.lastTrackName || 'the previous round'}. ${sf.lastRaceResult <= 3 ? 'Confidence will be high.' : sf.lastRaceResult > 10 ? 'Looking for a bounce-back today.' : 'Will want to build on that.'}`,
        'form_narrative', 'analyst', 6, 'early'
      ))
    }
  }
  
  // --- Championship drama ---
  const cd = context.championshipDrama
  if (cd) {
    if (cd.titleFightStatus === 'leading') {
      lines.push(make(
        `${context.playerName} leads the championship by ${cd.pointsGapToAhead || cd.pointsGapToBehind} points with ${cd.racesRemaining} race${cd.racesRemaining !== 1 ? 's' : ''} to go.`,
        'championship_context', 'analyst', 9, 'early'
      ))
    } else if (cd.titleFightStatus === 'contending') {
      lines.push(make(
        `${cd.pointsGapToLeader} points off the lead with ${cd.racesRemaining} rounds remaining. The title fight is alive.`,
        'championship_context', 'lead', 9, 'mid'
      ))
    }
    if (cd.isSeasonFinale) {
      lines.push(make(
        `The season finale! Everything comes down to today's race. What a way to settle the championship.`,
        'championship_context', 'lead', 10, 'early'
      ))
    }
    if (cd.isSeasonOpener) {
      lines.push(make(
        `And so a new season begins! A clean slate, everyone on zero points, and everything to play for.`,
        'championship_context', 'lead', 9, 'early'
      ))
    }
    if (cd.driverAheadInStandings && cd.pointsGapToAhead <= 10) {
      lines.push(make(
        `Just ${cd.pointsGapToAhead} points separate ${context.playerName} from ${cd.driverAheadInStandings}. One good result could flip the standings.`,
        'gap_analysis', 'analyst', 8, 'mid'
      ))
    }
  }
  
  // --- Career milestones ---
  const goat = context.goatProgress
  if (goat) {
    if (goat.recordBreakingMoment) {
      lines.push(make(
        `History could be made today: ${goat.recordBreakingMoment}`,
        'career_milestone', 'lead', 10, 'any'
      ))
    }
    if (goat.recordsNearBreaking?.length) {
      const nearest = goat.recordsNearBreaking[0]
      lines.push(make(
        `Just ${nearest.gap} away from the ${nearest.recordName} record. The history books are watching.`,
        'career_milestone', 'analyst', 8, 'late'
      ))
    }
  }
  
  // --- Player career stats ---
  const pc = context.playerCareer
  if (pc) {
    if (pc.consecutiveWins > 0) {
      lines.push(make(
        `${pc.consecutiveWins} consecutive win${pc.consecutiveWins !== 1 ? 's' : ''}! Can ${context.playerName} extend the streak today?`,
        'career_milestone', 'lead', 8, 'mid'
      ))
    }
    if (pc.isRookie) {
      lines.push(make(
        `Still a rookie with just ${pc.totalRaces} races under the belt, but ${context.playerName} is already turning heads.`,
        'form_narrative', 'analyst', 6, 'early'
      ))
    }
  }
  
  // --- Rivalry ---
  if (context.rivalry) {
    lines.push(make(
      `Keep an eye on ${context.playerName} and ${context.rivalry.rivalName} today. The rivalry has been building all season.`,
      'head_to_head', 'lead', 7, 'any'
    ))
  }
  
  // --- Team dynamics ---
  const td = context.teamDynamics
  if (td) {
    if (td.carReliability !== undefined && td.carReliability < 50) {
      lines.push(make(
        `Reliability has been a concern for ${td.teamName}. The mechanics will be watching their screens nervously today.`,
        'team_dynamics', 'analyst', 7, 'mid'
      ))
    }
    if (td.upgradeInProgress) {
      lines.push(make(
        `Big developments behind the scenes: ${td.upgradeInProgress}. Investment in the future from ${td.teamName}.`,
        'team_dynamics', 'analyst', 5, 'mid'
      ))
    }
    if (td.boardMood !== undefined && td.boardMood < 40) {
      lines.push(make(
        `The board at ${td.teamName} wants results. Pressure from upstairs to deliver today.`,
        'team_dynamics', 'lead', 6, 'mid'
      ))
    }
  }
  
  // --- Sponsor pressure ---
  const sp = context.sponsorPressure
  if (sp && sp.sponsorWarnings > 0) {
    lines.push(make(
      `${sp.sponsorWarnings} sponsor${sp.sponsorWarnings !== 1 ? 's have' : ' has'} issued warnings. Commercial pressure adding to the racing challenge.`,
      'financial_drama', 'analyst', 6, 'mid'
    ))
  }
  
  // --- Personal life ---
  const pl = context.personalLife
  if (pl) {
    if (pl.recentLifeEvent) {
      lines.push(make(
        `Off the track, ${context.playerName} has had plenty going on. ${pl.recentLifeEvent}. Life doesn't stop for racing.`,
        'personal_color', 'analyst', 5, 'mid'
      ))
    }
    if (pl.injuryStatus) {
      lines.push(make(
        `Worth noting that ${context.playerName} is ${pl.injuryStatus}. Brave to be on the grid today.`,
        'personal_color', 'lead', 7, 'early'
      ))
    }
  }
  
  // --- Pressure state ---
  const ps = context.pressureState
  if (ps) {
    if (ps.homeRace) {
      lines.push(make(
        `A home race for ${context.playerName} today. The crowd will be behind them, but the expectation is enormous.`,
        'pressure_narrative', 'lead', 8, 'early'
      ))
    }
    if (ps.contractPressure) {
      lines.push(make(
        `Contract situation adding another layer of pressure. Every result matters when your future's on the line.`,
        'pressure_narrative', 'analyst', 7, 'mid'
      ))
    }
  }
  
  // --- Qualifying callback ---
  if (context.qualifyingPosition) {
    lines.push(make(
      `Starting from P${context.qualifyingPosition} after qualifying. ${context.qualifyingPosition <= 3 ? 'A strong grid slot to work from.' : context.qualifyingPosition > 15 ? 'Plenty of work to do from back there.' : 'A solid midfield starting position.'}`,
      'qualifying_callback', 'analyst', 6, 'early'
    ))
  }
  
  // --- Top drivers ---
  context.drivers.slice(0, 5).forEach((driver, idx) => {
    lines.push(make(
      `${driver.name} starts from P${driver.position} today, representing ${driver.teamName}.`,
      'driver_background', 'analyst', 4, 'early'
    ))
  })
  
  // --- Championship standings ---
  if (context.championshipStandings && context.championshipStandings.length > 0) {
    const leader = context.championshipStandings[0]
    lines.push(make(
      `${leader.driverName} leads the championship with ${leader.points} points heading into today.`,
      'championship_context', 'analyst', 7, 'any'
    ))
  }
  
  // --- Generic strategy ---
  lines.push(make(
    `Tire management will be key today. Let's see who can make their rubber last.`,
    'strategy_talk', 'analyst', 4, 'mid'
  ))
  
  return lines
}
