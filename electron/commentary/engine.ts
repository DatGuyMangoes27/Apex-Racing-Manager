import { BrowserWindow } from 'electron'
import { generateCommentary, clearRecentLines } from './scriptGenerator'
import { synthesizeSpeech } from './voice'
import { playAudio, playAudioAndWait, stopAllAudio, setVolume, testAudioPlayback, clearQueue } from './audio'
import { queueManager } from './queueManager'
import { telemetryLog, logCommentaryDecision } from '../services/debugLogger'
import { getSeriesProfile, SeriesCategory } from '../../src/data/series-commentary'
import { setVoiceIds } from './voices'
import { evolveNarrativeThreads, type NarrativeThread } from './narrativeThreads'
import { getCommentaryEntityState, upsertCommentaryEntityState } from '../db/database'

/**
 * Commentary Engine
 * 
 * Detects race events from telemetry and triggers dynamic AI commentary.
 * Supports Practice, Qualifying, and Race sessions with different styles.
 * Includes general "color commentary" about driver career and team.
 */

// ===== DRIVER NAME VALIDATION =====
// Filters out team names, manufacturer names, and car designations from participant data

/**
 * Sanitize track names - AMS2 sometimes sends file paths or internal IDs
 * Converts things like "Spa_Francorchamps_2020" or "tracks/interlagos.aiw" to "Spa-Francorchamps"
 */
function sanitizeTrackName(rawName: string | undefined): string {
  if (!rawName || rawName.trim() === '') return 'Unknown Track'
  
  let name = rawName.trim()
  
  // Remove file path components
  if (name.includes('/') || name.includes('\\')) {
    const parts = name.split(/[/\\]/)
    name = parts[parts.length - 1] // Get last part (filename)
  }
  
  // Remove file extensions
  name = name.replace(/\.(aiw|json|xml|txt|bin)$/i, '')
  
  // Replace underscores with spaces
  name = name.replace(/_/g, ' ')
  
  // Remove year suffixes like "2020" or "2024"
  name = name.replace(/\s*(19|20)\d{2}\s*$/g, '')
  
  // Remove common suffixes
  name = name.replace(/\s*(gp|circuit|raceway|speedway|international|national)$/gi, (match) => {
    // Keep these as proper words, just ensure capitalization
    return ' ' + match.trim().charAt(0).toUpperCase() + match.trim().slice(1).toLowerCase()
  })
  
  // Clean up multiple spaces
  name = name.replace(/\s+/g, ' ').trim()
  
  // Title case each word
  name = name.split(' ')
    .map(word => {
      // Handle special cases
      if (word.toLowerCase() === 'de' || word.toLowerCase() === 'du' || word.toLowerCase() === 'la') {
        return word.toLowerCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
  
  // Handle common AMS2 track name mappings
  const trackMappings: Record<string, string> = {
    'interlagos': 'Interlagos',
    'spa': 'Spa-Francorchamps',
    'spa francorchamps': 'Spa-Francorchamps',
    'monza': 'Monza',
    'autodromo nazionale monza': 'Monza',
    'nurburgring': 'Nürburgring',
    'nurburgring nordschleife': 'Nürburgring Nordschleife',
    'silverstone': 'Silverstone',
    'brands hatch': 'Brands Hatch',
    'le mans': 'Le Mans',
    'circuit de la sarthe': 'Le Mans',
    'imola': 'Imola',
    'autodromo enzo e dino ferrari': 'Imola',
    'hockenheim': 'Hockenheim',
    'hockenheimring': 'Hockenheim',
    'snetterton': 'Snetterton',
    'donington': 'Donington Park',
    'oulton park': 'Oulton Park',
    'bathurst': 'Mount Panorama',
    'mount panorama': 'Mount Panorama',
    'laguna seca': 'Laguna Seca',
    'road america': 'Road America',
    'watkins glen': 'Watkins Glen',
    'long beach': 'Long Beach',
    'adelaide': 'Adelaide',
    'kyalami': 'Kyalami',
    'suzuka': 'Suzuka',
    'fuji': 'Fuji Speedway',
    'goiania': 'Goiânia',
    'curitiba': 'Curitiba',
    'velo citta': 'Velo Città',
    'velopark': 'Velopark',
    'cascavel': 'Cascavel',
    'taruma': 'Tarumã',
    'guapore': 'Guaporé',
    'santa cruz': 'Santa Cruz do Sul',
    'londrina': 'Londrina',
    'spielberg': 'Red Bull Ring',
    'red bull ring': 'Red Bull Ring',
    'portimao': 'Portimão',
    'algarve': 'Portimão',
    'barcelona': 'Barcelona-Catalunya',
    'catalunya': 'Barcelona-Catalunya',
    'jerez': 'Jerez',
    'paul ricard': 'Paul Ricard',
    'magny cours': 'Magny-Cours',
    'zandvoort': 'Zandvoort',
    'zolder': 'Zolder',
    'assen': 'Assen',
    'oschersleben': 'Oschersleben',
    'sachsenring': 'Sachsenring',
    'most': 'Most',
    'hungaroring': 'Hungaroring',
    'buenos aires': 'Buenos Aires',
    'jacarepagua': 'Jacarepaguá',
    'montreal': 'Montreal',
    'mosport': 'Canadian Tire Motorsport Park',
    'virginia': 'Virginia International Raceway',
    'road_atlanta': 'Road Atlanta',
  }
  
  // Check for known mappings (case-insensitive)
  const lowerName = name.toLowerCase()
  for (const [key, value] of Object.entries(trackMappings)) {
    if (lowerName.includes(key)) {
      return value
    }
  }
  
  return name || 'Unknown Track'
}

const SUSPICIOUS_NAME_KEYWORDS = [
  // Team suffixes
  'racing', 'motorsport', 'team', 'sport', 'works', 'factory', 'junior', 'academy', 'esports',
  // Manufacturers (common in AMS2)
  'bmw', 'mercedes', 'ferrari', 'porsche', 'audi', 'mclaren', 'williams', 'alpine',
  'alfa romeo', 'aston martin', 'haas', 'red bull', 'redbull', 'toro rosso', 'alphatauri',
  'lamborghini', 'bentley', 'jaguar', 'lexus', 'nissan', 'honda', 'toyota', 'hyundai',
  'chevrolet', 'ford', 'dodge', 'cadillac', 'corvette', 'camaro', 'mustang', 'ginetta',
  'radical', 'caterham', 'lotus', 'ktm', 'dallara', 'ligier', 'oreca', 'riley',
  'metalmoro', 'stock car', 'copa truck', 'formula vee', 'f-vee',
  // Car models/classes
  'gt3', 'gt4', 'gte', 'lmp1', 'lmp2', 'lmp3', 'dpi', 'lmdh', 'hypercar',
  'm4', 'm3', 'm8', '911', '992', '991', '488', '296', 'huracan', 'r8',
  'amg', 'vantage', 'continental', 'supra', 'nsx', 'z4', 'cayman', 'boxster',
  'ultima', 'p1', 'mp4', 'f40', 'f50', 'enzo', 'laferrari',
  // Series names
  'formula', 'f1', 'f2', 'f3', 'f4', 'indycar', 'nascar', 'imsa', 'wec', 'elms',
  // Generic
  'driver', 'ai driver', 'cpu', 'bot', 'opponent'
]

/**
 * Validate if a participant name looks like a real driver name
 * Returns the name if valid, or a generic fallback if suspicious
 */
function getValidDriverName(name: string | undefined, fallback: string = 'a rival'): string {
  if (!name || name.trim() === '') return fallback
  
  const trimmedName = name.trim()
  const lowerName = trimmedName.toLowerCase()
  
  // Check for suspicious keywords
  for (const keyword of SUSPICIOUS_NAME_KEYWORDS) {
    if (lowerName.includes(keyword)) {
      console.log(`[CommentaryEngine] Filtered suspicious name: "${trimmedName}" (matched: "${keyword}")`)
      return fallback
    }
  }
  
  // Check if name is ONLY a number (car number)
  if (/^\d+$/.test(trimmedName)) {
    console.log(`[CommentaryEngine] Filtered car number: "${trimmedName}"`)
    return fallback
  }
  
  // Check if name looks like a car designation
  if (/^(#|car\s*|no\.?\s*)\d+$/i.test(trimmedName)) {
    console.log(`[CommentaryEngine] Filtered car designation: "${trimmedName}"`)
    return fallback
  }
  
  // Check if name is too short (likely abbreviation or code)
  if (trimmedName.length < 3) {
    console.log(`[CommentaryEngine] Filtered short name: "${trimmedName}"`)
    return fallback
  }
  
  return trimmedName
}

export interface CommentaryEvent {
  type: CommentaryEventType
  context: EventContext
  priority: 'high' | 'medium' | 'low'
  timestamp: number
}

export type CommentaryEventType = 
  // Race Events
  | 'RACE_START' | 'OVERTAKE' | 'POSITION_LOST' | 'FASTEST_LAP' | 'PERSONAL_BEST'
  | 'GAP_CLOSING' | 'GAP_OPENING' | 'FINAL_LAPS' | 'PODIUM_FINISH' | 'RACE_WIN'
  | 'RACE_FINISH' | 'PIT_ENTRY' | 'PIT_EXIT' | 'SECTOR_PURPLE' | 'BATTLE_FORMING'
  // Flags (from shared memory)
  | 'FLAG_GREEN' | 'FLAG_YELLOW' | 'FLAG_DOUBLE_YELLOW' | 'FLAG_BLUE' | 'FLAG_WHITE' | 'FLAG_BLACK' | 'FLAG_CHEQUERED'
  | 'FLAG_SAFETY_CAR' | 'FLAG_RED'
  | 'FLAG_FINAL_LAP'  // White flag for final lap
  // Start-specific events
  | 'POOR_START' | 'GREAT_START' | 'UNDER_PRESSURE'
  // Field commentary (about other drivers)
  | 'FIELD_BATTLE' | 'LEADER_UPDATE' | 'MIDFIELD_ACTION'
  // Situational Events (NEW)
  | 'MOMENTUM_BUILDING' | 'DEFENSIVE_DRIVING' | 'CONSISTENCY_PRAISE' 
  | 'RECOVERY_DRIVE' | 'PRESSURE_BUILDING' | 'GAP_CALCULATION'
  // Session Events
  | 'SESSION_START' | 'SESSION_END' | 'PRACTICE_IMPROVEMENT' | 'QUALIFYING_ATTEMPT'
  | 'POLE_POSITION' | 'FRONT_ROW' | 'STRATEGY_UPDATE'
  // Practice/Qualifying Specific (NEW)
  | 'OTHER_DRIVER_HOTLAP' | 'TRACK_EVOLUTION' | 'SECTOR_COMPARISON' | 'PIT_ACTIVITY'
  // Track-Specific (NEW)
  | 'CORNER_CALLOUT' | 'TRACK_CHARACTER'
  // Banter (NEW)
  | 'TRIVIA_DROP' | 'DISAGREEMENT'
  // Record/Achievement Events (NEW)
  | 'RECORD_BROKEN' | 'RECORD_APPROACHING' | 'MILESTONE_UNLOCKED' | 'TRIPLE_CROWN_LEG'
  // Milestone Celebration Events
  | 'MILESTONE_WIN_STREAK'     // 3+ consecutive wins
  | 'MILESTONE_PODIUM_STREAK'  // 5+ consecutive podiums
  | 'MILESTONE_COMEBACK'       // Comeback win celebration
  | 'MILESTONE_HAT_TRICK'      // Pole + Win + FL achieved
  | 'MILESTONE_GRAND_SLAM'     // Pole + Lead every lap + Win + FL
  // Team/Sponsor Narrative Events
  | 'TEAM_PRESSURE_MENTION'    // When team satisfaction is low
  | 'SPONSOR_PRESSURE_MENTION' // When sponsors are at risk
  | 'MEDIA_HEADLINE_CALLBACK'  // Reference a recent press headline
  // General/Color Commentary
  | 'LAP_COMPLETE' | 'HALFWAY_POINT' | 'WEATHER_CHANGE' | 'TRACK_LIMITS'
  | 'COLOR_COMMENTARY' | 'DRIVER_BACKGROUND' | 'TEAM_INFO' | 'CHAMPIONSHIP_UPDATE'
  | 'RIVALRY_MENTION' | 'RANDOM_FACT'
  // === NEW: Telemetry-driven events (from Crew Chief data) ===
  // Rival events (detected from participant data)
  | 'RIVAL_PIT_ENTRY'          // Rival driver entered pits
  | 'RIVAL_PIT_EXIT'           // Rival driver exited pits
  | 'RIVAL_FASTEST_LAP'        // Rival set a new fastest lap
  | 'RIVAL_RETIRED'            // Rival retired/DNF
  // Player incidents (from crash/collision data)
  | 'CONTACT_DETECTED'         // Collision with another car
  | 'PLAYER_SPINNING'          // Player is spinning
  | 'PLAYER_OFFTRACK'          // Player went off track
  // Damage reports
  | 'DAMAGE_REPORT'            // Significant damage detected
  | 'ENGINE_WARNING'           // Engine damage building
  | 'AERO_DAMAGE'              // Aero damage detected
  // Yellow flag / safety car
  | 'FCY_DEPLOYED'             // Full course yellow/safety car
  | 'FCY_ENDING'               // Safety car ending
  // === NEW: Session phase events (like Crew Chief) ===
  // Session time warnings
  | 'SESSION_TIME_5MIN'        // 5 minutes remaining
  | 'SESSION_TIME_1MIN'        // 1 minute remaining  
  | 'SESSION_TIME_30SEC'       // 30 seconds remaining
  | 'SESSION_CHECKERED'        // Time is up, finish your lap!
  // Session best tracking
  | 'SESSION_BEST_STOLEN'      // Someone stole P1/session best
  | 'SESSION_BEST_SET'         // Player set session best
  // Practice/Quali completion
  | 'QUALI_P1_SECURED'         // Player secured pole
  | 'QUALI_FRONT_ROW_SECURED'  // Player secured front row
  | 'QUALI_COMPLETE'           // Qualifying session finished
  | 'PRACTICE_COMPLETE'        // Practice session finished
  // === NEW: Crew Chief-style enhanced detections ===
  // Gap to leader tracking (like Crew Chief Timings.cs)
  | 'GAP_TO_LEADER_UPDATE'     // Periodic gap to leader update
  | 'LEADER_GAP_CLOSING'       // Player closing gap to leader
  | 'LEADER_GAP_OPENING'       // Player losing ground to leader
  // Weather changes (like Crew Chief ConditionsMonitor.cs)
  | 'RAIN_INCOMING'            // Rain starting/increasing
  | 'RAIN_STOPPING'            // Rain stopping/decreasing
  | 'TRACK_TEMP_CHANGE'        // Significant track temp change
  // Enhanced damage detection (like Crew Chief DamageReporting.cs)
  | 'BRAKE_DAMAGE'             // Brake damage detected
  | 'SUSPENSION_DAMAGE'        // Suspension damage detected
  | 'TYRE_DAMAGE'              // Significant tyre wear/damage
  | 'PUNCTURE_DETECTED'        // Likely puncture (extreme tyre wear)
  // Sector tracking (like Crew Chief LapTimes.cs)
  | 'SECTOR_PURPLE'            // Player set session-best sector
  | 'OVERALL_FASTEST_LAP'      // Player set overall fastest lap
  // DRS tracking (like Crew Chief FlagsMonitor.cs)
  | 'DRS_AVAILABLE'            // DRS is now available
  | 'DRS_ZONE_ENTRY'           // Entering DRS zone
  // Blue flag handling (like Crew Chief FlagsMonitor.cs)
  | 'BLUE_FLAG_PERSISTENT'     // Blue flag for multiple corners
  // Position trend detection (like Crew Chief Position.cs)
  | 'LOSING_POSITION_TREND'    // Consistently losing ground
  | 'GAINING_POSITION_TREND'   // Consistently gaining positions
  | 'LAST_PLACE_WARNING'       // Player is in last place
  // === NEW: Strategy Speculation Events ===
  | 'STRATEGY_SPECULATION'     // General pit strategy observation
  | 'STRATEGY_UNDERCUT_ATTEMPT' // Rival pits early - possible undercut
  | 'STRATEGY_OVERCUT_ATTEMPT'  // Rival stays out - possible overcut
  | 'PIT_WINDOW_OPEN'          // Pit window has opened
  | 'STRATEGY_COMMITTED'       // Player/rival committed to strategy
  // === NEW: Crowd / Atmosphere Events ===
  | 'CROWD_ROAR'               // Home hero moment / exciting action
  | 'ATMOSPHERE_ELECTRIC'      // Generally exciting atmosphere
  // === NEW: Breathing Room / Pacing ===
  | 'BREATHING_ROOM'           // Natural pause in commentary
  // === NEW: Post-Race / Cool-Down Events ===
  | 'COOLDOWN_LAP'             // Immediately after checkered flag
  | 'POST_RACE_REFLECTION'     // Deeper race analysis
  | 'CHAMPIONSHIP_IMPLICATIONS' // Points impact after race
  // === NEW: Pit Reporter Events ===
  | 'PIT_REPORTER_GRID'        // Grid walk observations
  | 'PIT_REPORTER_PIT_UPDATE'  // Pit lane report during stops
  | 'PIT_REPORTER_POST_RACE'   // Parc ferme / celebrations

export interface EventContext {
  // Basic info
  playerName: string
  playerPosition: number
  previousPosition?: number
  overtakenDriver?: string
  trackName: string
  currentLap: number
  totalLaps: number
  
  // Timing
  gapAhead?: number
  gapBehind?: number
  bestLapTime?: number
  lastLapTime?: number
  sectorTime?: number
  sectorNumber?: number
  lapsRemaining?: number
  
  // Session info
  sessionType?: 'Practice' | 'Qualifying' | 'Race' | 'Test'
  raceState?: string
  
  // Flags (from shared-memory -> legacy session passthrough)
  flagColour?: number
  flagReason?: number
  homeCountry?: string
  
  // Pit (player)
  pitMode?: number
  
  // Career data (from save)
  championshipPosition?: number
  championshipPoints?: number
  totalWins?: number
  totalPodiums?: number
  totalRaces?: number
  teamName?: string
  carName?: string
  carClass?: string
  reputation?: number
  rivalName?: string
  rivalPosition?: number  // Rival's position in current race
  seasonWins?: number
  lastRaceResult?: number
  lastTrackName?: string  // Track name from last race (for narrative)
  currentStreak?: string // e.g., "3 podiums in a row"
  
  // Background info
  scenarioName?: string
  age?: number
  nationality?: string
  experienceLevel?: string // e.g., "Rookie", "Sophomore", "Veteran"
  isRookie?: boolean
  commentaryDataSource?: 'content_studio' | 'runtime' | 'mixed'
  
  // Other drivers context (for narrative/comparison)
  championshipLeader?: string      // Name of championship leader
  championshipLeaderPosition?: number  // Their position in this race
  lastRaceWinner?: string          // Who won the last race
  lastRaceWinnerPosition?: number  // Their position in this race
  
  // ===== TV BROADCAST: DRIVER NARRATIVES =====
  // Rich backstories for colorful commentary about other drivers
  // Fields match the Content Studio pre-generated bundle format
  driverNarratives?: Array<{
    name: string
    nationality?: string
    age?: number
    teamId?: string
    biography?: string          // Full multi-sentence driver backstory
    drivingStyle?: string       // "Aggressive late-braker" etc.
    rivalries?: string[]        // Known rivalries with other drivers
    quirks?: string[]           // Personality quirks / fun facts
    nickname?: string           // Driver nickname
    famousQuote?: string        // Memorable quote
    careerHighlight?: string    // Best career moment
    careerLowPoint?: string     // Toughest career moment
    careerStage?: string        // 'rising' | 'peak' | 'declining' | 'veteran'
    totalWins?: number
    championships?: number
    rivalryIntensity?: number
  }>
  
  // ===== TV BROADCAST: TEAM NARRATIVES =====
  // Rich backstories for colorful commentary about other teams
  // Fields match the Content Studio pre-generated bundle format
  teamNarratives?: Array<{
    teamId: string
    name: string
    shortName?: string
    origin?: string              // Full team backstory
    philosophy?: string          // Team racing philosophy
    achievements?: string[]      // Notable achievements
    teamPrincipal?: string       // Team boss info
    headquarters?: string        // Where the team is based
    reputation?: string          // Paddock reputation
    fanBase?: string             // Fan following description
  }>
  
  // ===== 8-THEME INTELLIGENCE DATA =====
  
  // THEME 1: TECHNICAL (Car Health)
  oilTempCelsius?: number
  waterTempCelsius?: number
  fuelLevel?: number           // 0-1 percentage
  fuelCapacity?: number
  fuelLapsRemaining?: number   // Calculated laps of fuel left
  carHealthStatus?: 'healthy' | 'warm' | 'hot' | 'critical'
  
  // THEME 2: TRACK/ENVIRONMENT
  trackTemperature?: number
  ambientTemperature?: number
  rainDensity?: number         // 0 = dry, 1 = heavy rain
  weatherCondition?: 'dry' | 'damp' | 'wet' | 'storm'
  windSpeed?: number
  isHomeRace?: boolean         // Track matches player nationality
  
  // THEME 3: STRATEGY (Momentum & Deltas)
  gapDelta3Laps?: number       // Gap change over last 3 laps (negative = catching)
  momentumStatus?: 'catching' | 'stable' | 'falling_back'
  averageLapTime?: number      // Player's average over last 5 laps
  consistencyRating?: 'metronomic' | 'consistent' | 'erratic'
  
  // THEME 4: EXPECTATION (Team Baseline)
  teamTier?: 'top' | 'midfield' | 'backmarker'  // Based on team name
  expectedPosition?: number    // Where they "should" finish based on team + rep
  performanceVsExpectation?: 'overachieving' | 'meeting' | 'underachieving'
  
  // THEME 5: RACE PHASE
  racePhase?: 'opening_scuffle' | 'management' | 'final_sprint' | 'victory_lap'
  lapProgress?: number         // 0-1 how far through the race
  
  // THEME 6: PSYCHOLOGY (Pressure)
  pressureLevel?: 'relaxed' | 'focused' | 'intense' | 'critical'
  underAttackLaps?: number     // Consecutive laps with car within 1s behind
  pressureStability?: 'cracking' | 'stable' | 'firm' // NEW: narrative pressure trend
  gapClosingRate?: number // NEW: seconds gained/lost per lap
  positionStability?: 'stuck' | 'clear' | 'vulnerable' // NEW: narrative position trend
  contractPressure?: boolean   // Is contract expiring soon?
  
  // THEME 7: TEAMMATE
  teammatePosition?: number
  teammateName?: string
  teammateGap?: number         // Positive = ahead of teammate
  beatingTeammate?: boolean
  
  // THEME 8: SESSION MEMORY (Cross-session context)
  qualifyingPosition?: number       // Where they qualified
  gridPosition?: number             // Starting position for race
  qualifyingGapToPole?: number      // Gap to P1 in qualifying (seconds)
  carCompetitiveness?: 'front-runner' | 'competitive' | 'midfield' | 'struggling' | 'backmarker'
  positionsGainedFromGrid?: number  // Current pos - grid pos (negative = gained)
  startDisaster?: boolean           // Lost 5+ positions from grid
  startSuccess?: boolean            // Gained 3+ positions from grid
  
  // THEME 9: TRACK HISTORY (Career context for current track)
  trackHistory?: {
    visits: number            // Total times at this track
    wins: number              // Wins at this track
    podiums: number           // Podiums at this track
    poles: number             // Poles at this track
    fastestLaps: number       // Fastest laps at this track
    consecutiveWins: number   // Current consecutive win streak at track
    maxConsecutiveWins: number // Best ever consecutive win streak at track
    bestFinish: number        // Best finish at this track
    avgFinish: number         // Average finish at this track
    lastVisitYear: number     // Last year visited
    firstVisitYear: number    // First year visited
    dnfs: number              // DNFs at this track
  }
  isTrackDominator?: boolean   // 3+ wins at this track
  hasWinningStreak?: boolean   // Currently on 2+ consecutive wins at track
  isTrackNightmare?: boolean   // 50%+ DNF rate or avg finish > 15
  isTrackDebut?: boolean       // First time at this track
  
  // THEME 10: RECORD CHASING (Historical records and GOAT progress)
  recordsNearBreaking?: {
    recordId: string
    recordName: string
    recordHolder: string
    recordValue: number
    currentValue: number
    remaining: number          // How many more needed to break
    category: string           // e.g., "F1", "Endurance", "Career"
  }[]
  goatTier?: string            // Current GOAT tier name
  goatTierProgress?: number    // 0-100 progress to next tier
  nextGoatTier?: string        // Name of next tier to reach
  recentMilestones?: string[]  // Milestones unlocked this session
  tripleCrownProgress?: {
    crownId: string
    crownName: string
    legsCompleted: number
    totalLegs: number
    nextLeg?: string           // Name of next leg to complete
    isComplete: boolean
  }[]
  isClosestToRecord?: boolean  // Within 1-2 of breaking ANY record
  recordBreakingMoment?: string // If this race/win would break a record, name it
  
  // THEME 11: MEDIA PERSONA (Press/Public Image)
  mediaPersona?: 'confident' | 'humble' | 'bold' | 'diplomatic' | 'aggressive' | 'unknown'
  mediaPersonaLevel?: 'unknown' | 'emerging' | 'established' | 'iconic'
  recentHeadline?: string           // Most recent press headline for callbacks
  rivalPressConflict?: string       // If recently had press beef with a rival
  controversyLevel?: number         // 0-100, high = more press scrutiny
  publicPerception?: number         // 0-100, how the public views the driver
  
  // THEME 11 EXTENDED: MEDIA & SOCIAL (Actual press clippings and social media)
  recentPressClippings?: {
    headline: string
    sentiment: 'positive' | 'neutral' | 'negative' | 'controversial'
    outlet: string
  }[]                                // Last 3 actual press clippings for callbacks
  mediaFollowerCount?: number        // Social media follower count
  isVerifiedSocialMedia?: boolean    // Has verified status (50k+ followers)
  viralPostCount?: number            // Number of viral posts this season
  
  // THEME 12: EXTENDED ACHIEVEMENT STATS (Career milestones)
  consecutiveWins?: number           // Current win streak
  consecutivePodiums?: number        // Current podium streak
  consecutivePoints?: number         // Current points finish streak
  comebackWins?: number              // Career comeback wins (from P10+)
  hatTricks?: number                 // Pole + Win + FL achievements
  grandSlams?: number                // Pole + Lead every lap + Win + FL
  totalFastestLaps?: number          // Career fastest laps
  perfectSeasons?: number            // Seasons with 100% wins
  dnfFreeSeasons?: number            // Seasons without DNF
  
  // THEME 13: CONTRACT & TEAM DYNAMICS
  teamSatisfaction?: number          // 0-100, team happiness level
  teamSatisfactionStatus?: 'thrilled' | 'pleased' | 'neutral' | 'concerned' | 'crisis'
  teamWarningIssued?: boolean        // Has team issued a warning?
  teamFinalWarningIssued?: boolean   // Has team issued final warning?
  contractTargetsMet?: number        // Number of contract targets met
  contractTargetsTotal?: number      // Total contract targets
  contractEndingSoon?: boolean       // Contract expires this/next year
  
  // THEME 14: SPONSOR SATISFACTION
  sponsorsSatisfied?: number         // Count of sponsors with >= 70 satisfaction
  sponsorsAtRisk?: number            // Count of sponsors with < 40 satisfaction
  sponsorsTotal?: number             // Total active sponsors
  topSponsorName?: string            // Highest-paying sponsor name
  sponsorPressureLevel?: 'none' | 'low' | 'moderate' | 'high'  // Overall sponsor pressure
  
  // RACE NARRATIVE (story continuity)
  narrativeMemory?: NarrativeMemory  // Key moments from the race so far
  
  // === NEW: TELEMETRY-DRIVEN DATA (from AMS2 shared memory) ===
  
  // Collision detection
  lastCollisionMagnitude?: number    // Impact force (0 = no collision)
  lastCollisionOpponentName?: string // Name of who we hit
  
  // Crash/damage state
  crashState?: number                // 0=none, 1=offtrack, 3=spinning, 4=rolling
  aeroDamage?: number                // 0-1 damage severity
  engineDamage?: number              // 0-1 damage severity
  suspensionDamage?: [number, number, number, number]  // Per-wheel damage
  tyreWear?: [number, number, number, number]          // Per-wheel wear
  
  // Yellow flag state
  yellowFlagState?: number           // Safety car/FCY state
  
  // Rival events (set when rival does something noteworthy)
  rivalPittingName?: string          // Name of rival entering pits
  rivalRetiredName?: string          // Name of rival who retired
  rivalFastestLapName?: string       // Name of rival who set fastest lap
  rivalFastestLapTime?: number       // Their new fastest lap time
  
  // === NEW: Session phase context ===
  timeRemaining?: number             // Time remaining in session (seconds)
  sessionPhase?: SessionPhase        // Current session phase
  overallSessionBest?: number        // Best lap in session by anyone
  overallSessionBestDriver?: string  // Who set the session best
  
  // === NEW: Crew Chief-style enhanced context ===
  // Gap to leader
  gapToLeader?: number               // Gap to race leader in seconds
  gapToLeaderDelta?: number          // Change in gap to leader per lap
  leaderName?: string                // Name of race leader
  
  // Weather changes
  previousRainDensity?: number       // Previous rain density for change detection
  weatherTrend?: 'improving' | 'worsening' | 'stable'
  
  // Enhanced damage
  brakeDamage?: [number, number, number, number]  // Per-wheel brake damage
  maxTyreWear?: number               // Highest tyre wear value
  worstTyre?: 'FL' | 'FR' | 'RL' | 'RR'  // Which tyre is worst
  
  // Sector tracking
  currentSector?: number             // Current sector (1, 2, 3)
  sector1Time?: number               // Current lap sector 1 time
  sector2Time?: number               // Current lap sector 2 time
  sector3Time?: number               // Current lap sector 3 time
  sessionBestSector1?: number        // Session best sector 1
  sessionBestSector2?: number        // Session best sector 2
  sessionBestSector3?: number        // Session best sector 3
  
  // DRS tracking
  drsState?: number                  // DRS state flags
  drsAvailable?: boolean             // DRS currently available
  drsActive?: boolean                // DRS currently deployed
  
  // Blue flag
  blueFlagLaps?: number              // Laps under blue flag
  
  // Position trend
  positionTrend?: 'gaining' | 'losing' | 'stable'
  positionsGainedLast5?: number      // Net positions gained in last 5 laps
  
  // ===== CALENDAR & SEASON PROGRESS =====
  currentRound?: number              // Current round in the championship (e.g., 5)
  totalRounds?: number               // Total rounds in the season (e.g., 12)
  seasonProgress?: number            // 0-100 percentage through season
  nextRaceTrack?: string             // Next race track name
  nextRaceWeek?: number              // Next race week number
  upcomingRaces?: {                  // Next 2-3 races
    round: number
    trackName: string
    week: number
  }[]
  previousRaces?: {                  // Last 3 races summary
    trackName: string
    position: number
    round: number
  }[]
  isSeasonOpener?: boolean           // First race of season
  isSeasonFinale?: boolean           // Last race of season
  racesRemaining?: number            // Races left in season
  
  // ===== FULL CHAMPIONSHIP STANDINGS =====
  fullStandings?: {                  // Top 10 championship standings
    position: number
    name: string
    teamName: string
    points: number
    wins: number
    gapToLeader: number
    isPlayer: boolean
  }[]
  pointsGapToLeader?: number         // Points behind championship leader
  pointsGapToAhead?: number          // Points behind driver ahead in standings
  pointsGapToBehind?: number         // Points ahead of driver behind
  driverAheadInStandings?: string    // Name of driver ahead in championship
  driverBehindInStandings?: string   // Name of driver behind in championship
  titleFightStatus?: 'dominant_lead' | 'comfortable' | 'close_battle' | 'must_win' | 'out_of_contention'
  mathematicallyAlive?: boolean      // Can still win title?
  maxPointsRemaining?: number        // Max points still available
  pointsNeededForTitle?: number      // Points needed to clinch
  
  // ===== SERIES/CHAMPIONSHIP INFO =====
  seriesName?: string                // Full series name (e.g., "GT World Challenge")
  seriesShortName?: string           // Short name (e.g., "GTWC")
  seriesTier?: 'factory' | 'pro' | 'semi-pro' | 'amateur' | 'historic'
  seriesCategory?: string            // Category (formula, gt, stock, etc.)
  seriesPrestige?: number            // 0-100 prestige rating
  isMultiClass?: boolean             // Multi-class racing?

  // ===== PADDOCK WORLD SNAPSHOT (Phase 2) =====
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
  
  // ===== SEASON FORM =====
  seasonPodiums?: number             // Podiums this season
  seasonPoles?: number               // Poles this season
  seasonFastestLaps?: number         // Fastest laps this season
  seasonDNFs?: number                // DNFs this season
  seasonAvgFinish?: number           // Average finish this season
  seasonBestFinish?: number          // Best finish this season
  racesCompletedThisSeason?: number  // Races finished this season
  
  // ===== BROADCAST PHASE (for TV-style commentary flow) =====
  broadcastPhase?: 'pre-session' | 'early-session' | 'mid-session' | 'late-session'
  hasValidTiming?: boolean           // True when lap times exist to reference
  narrativeThreads?: NarrativeThread[]

  // ===== STRATEGY / CROWD / POST-RACE ENRICHMENTS =====
  pitWindowLap?: number
  pitLap?: number
  estimatedStops?: number
  fuelConsumptionPerLap?: number
  raceProgress?: number
  isHomeHero?: boolean
  excitingMomentCount?: number
  finalPosition?: number
  positionsGained?: number
  overtakesMade?: number
  overtakesLost?: number
  purpleSectors?: number
  personalBests?: number
  narrativeHighlights?: string[]
  keyMoments?: NarrativeMemory
  startPosition?: number
  pointsScored?: number
  newChampionshipPosition?: number

  // Legacy aliases still referenced by older pathways
  teamPressure?: boolean
  sponsorPressure?: boolean
  mediaHeadlines?: string[]
  
  // ===== PLAYER ACTIVITY STATE (for intelligent commentary routing) =====
  _playerState?: PlayerActivityState  // Current player activity state
  _redirectedFrom?: CommentaryEventType  // If event was redirected, original type
  speed?: number                     // Current speed in kph
}

// ===== SESSION MEMORY =====
// Tracks data across sessions (e.g., quali position for race commentary)
interface SessionMemory {
  qualifyingPosition?: number       // Where they qualified
  qualifyingTime?: number           // Their best quali lap time
  qualifyingGapToPole?: number      // Gap to P1 in qualifying
  gridPosition?: number             // Starting grid position for race
  practicePosition?: number         // Best practice position
  practiceBestTime?: number         // Best practice lap time
  fieldAverageQualiTime?: number    // For car competitiveness calculation
  carCompetitiveness?: 'front-runner' | 'competitive' | 'midfield' | 'struggling' | 'backmarker'
  raceFinished?: boolean            // Flag to stop commentary after race ends
  finalRacePosition?: number        // Final position when race ended
}

// ===== RACE NARRATIVE MEMORY =====
// Tracks key moments during the race for callbacks and story continuity
export interface NarrativeMemory {
  // Start phase
  poorStart?: { lap: number; positionsLost: number; fromPosition: number; toPosition: number }
  greatStart?: { lap: number; positionsGained: number; fromPosition: number; toPosition: number }
  
  // Key battles
  bigOvertakes: { lap: number; driver: string; forPosition: number }[]
  positionsLost: { lap: number; driver: string; toPosition: number }[]
  
  // Lead changes
  tookLead?: { lap: number; fromWho?: string }
  lostLead?: { lap: number; toWho?: string }
  leadChanges: number
  
  // Recovery narrative
  lowestPosition?: { lap: number; position: number }
  highestPosition?: { lap: number; position: number }
  isRecoveryDrive: boolean  // Dropped significantly then climbed back
  
  // Pressure moments
  underPressurePeriods: { startLap: number; endLap?: number; fromDriver?: string }[]
  defensiveSuccesses: number  // Times held position under pressure
  
  // Consistency
  fastestLapSet?: { lap: number; time: number }
  personalBests: number
  purpleSectors: number
  overtakesMade: number
  overtakesLost: number
  defensiveMoves: number
  
  // Mentioned facts (to avoid repeating)
  mentionedPoorStart: boolean
  mentionedGreatStart: boolean
  mentionedRecovery: boolean
  mentionedFastestLap: boolean
}

// Create fresh narrative memory
function createNarrativeMemory(): NarrativeMemory {
  return {
    bigOvertakes: [],
    positionsLost: [],
    leadChanges: 0,
    isRecoveryDrive: false,
    underPressurePeriods: [],
    defensiveSuccesses: 0,
    personalBests: 0,
    purpleSectors: 0,
    overtakesMade: 0,
    overtakesLost: 0,
    defensiveMoves: 0,
    mentionedPoorStart: false,
    mentionedGreatStart: false,
    mentionedRecovery: false,
    mentionedFastestLap: false
  }
}

interface CommentaryState {
  enabled: boolean
  lastEventTime: Record<string, number>
  lastPosition: number
  lastLap: number
  lastBestLap: number
  lastGapAhead: number
  lastGapBehind: number
  sessionStarted: boolean
  sessionStartedAt: number  // Timestamp when session started (for warmup period)
  raceStarted: boolean
  announcedFinalLaps: boolean
  announcedHalfway: boolean
  queuedEvents: CommentaryEvent[]
  isProcessing: boolean
  cooldowns: Record<string, number>
  currentSessionType: string
  lastColorCommentary: number
  colorCommentaryInterval: number // ms between random chatter
  careerData: Partial<EventContext> | null
  // Start detection
  positionAtRaceStart: number
  announcedPoorStart: boolean
  announcedGreatStart: boolean
  // Field tracking (for other drivers)
  lastFieldPositions: Map<number, number> // carIndex -> position
  lastFieldUpdate: number
  // Momentum tracking
  positionHistory: { lap: number; position: number; timestamp: number }[]
  recentLapTimes: number[] // Last 5 lap times for consistency check
  lastDefensiveCheck: number
  underPressureLaps: number
  lastGapLogTime: number
  lastQualiLogTime: number
  lastSessionLogTime: number
  // Practice/Quali tracking
  otherDriverBestTimes: Map<number, number> // carIndex -> best lap
  lastTrackEvolutionCheck: number
  averageBestTime: number
  // 8-Theme Intelligence Tracking
  gapHistory: { lap: number; gapAhead: number; gapBehind: number }[]  // For delta calculation
  lastFuelLevel: number  // For fuel consumption rate
  fuelConsumptionPerLap: number
  // Session Memory (persists across sessions)
  sessionMemory: SessionMemory
  // Race Narrative Memory (tracks story moments for callbacks)
  narrativeMemory: NarrativeMemory
  // Flag tracking (announce on change only)
  lastFlagColour?: number
  lastFlagReason?: number
  lastFlagAnnouncedAt?: number
  lastPlayerPitMode: number
  
  // === NEW: Telemetry-driven state tracking ===
  // Rival tracking (detect actual events instead of random triggers)
  rivalBestTimes: Map<string, number>      // driverName -> their best lap time
  rivalsInPits: Set<string>                // Names of drivers currently in pits
  rivalsRetired: Set<string>               // Names of drivers who have retired
  
  // Collision/crash tracking
  lastCollisionMagnitude: number           // Last collision force
  lastCollisionTime: number                // When last collision was detected
  lastCrashState: number                   // Previous crash state
  
  // Yellow flag tracking
  lastYellowFlagState: number
  
  // === NEW: Session phase tracking (like Crew Chief) ===
  sessionPhase: SessionPhase              // Current session phase
  lastTimeRemaining: number               // Last known time remaining
  announced5MinWarning: boolean           // Announced 5 minute warning
  announced1MinWarning: boolean           // Announced 1 minute warning
  announced30SecWarning: boolean          // Announced 30 second warning
  announcedSessionCheckered: boolean      // Announced checkered (time up)
  announcedSessionComplete: boolean       // Announced session complete
  overallSessionBest: number              // Best lap time in session by anyone
  overallSessionBestDriver: string        // Who set it
  playerClassSessionBest: number          // Best in player's class
  playerSessionBest: number               // Player's best in this session
  lastOverallSessionBest: number          // Previous overall best (to detect changes)
  
  // === NEW: Crew Chief-style enhanced tracking ===
  // Gap to leader tracking
  lastGapToLeader: number                 // Previous gap to leader
  gapToLeaderHistory: number[]            // Last 5 gaps for delta calculation
  lastLeaderUpdate: number                // Last time we announced leader gap
  
  // Weather tracking
  lastRainDensity: number                 // Previous rain density
  lastTrackTemp: number                   // Previous track temperature
  weatherChangeAnnounced: number          // Last weather change announcement time
  
  // Enhanced damage tracking
  lastBrakeDamage: [number, number, number, number]
  lastSuspensionDamage: [number, number, number, number]
  lastTyreWear: [number, number, number, number]
  damageAnnouncementTimes: Record<string, number>  // Track per-damage-type cooldowns
  
  // Sector tracking
  sessionBestSectors: [number, number, number]  // Best S1, S2, S3 in session
  lastSectorTimes: [number, number, number]     // Player's last sector times
  purpleSectorAnnounced: [boolean, boolean, boolean]  // Already announced purple?
  
  // DRS tracking
  lastDrsState: number                    // Previous DRS state
  drsAvailableAnnounced: boolean          // Already announced DRS available?
  
  // Blue flag tracking
  blueFlagStartTime: number               // When blue flag started
  blueFlagLaps: number                    // Consecutive laps under blue
  lastBlueFlagState: boolean              // Was blue flagged last check
  
  // Position trend tracking
  positionHistory5Laps: number[]          // Last 5 lap positions for trend
  lastPositionTrendCheck: number          // Last trend check time
  
  // === PLAYER ACTIVITY STATE MACHINE ===
  playerActivityState: PlayerActivityState  // What is the player actually doing?
  lastPlayerSpeed: number                   // For state transition detection
  lapAtPitExit: number                      // Track which lap they exited pits
  lastStateChangeTime: number               // When state last changed
  
  // === STRATEGY SPECULATION TRACKING ===
  pitStops: Map<string, { lap: number; timestamp: number }[]>  // driverName -> pit stop laps
  estimatedStrategy: Map<string, 'one-stop' | 'two-stop' | 'unknown'>  // Strategy estimates
  pitWindowAnnounced: boolean               // Announced pit window open
  lastStrategyUpdate: number                // Last strategy speculation time
  playerPitLaps: number[]                   // Laps when player pitted
  
  // === CROWD / ATMOSPHERE TRACKING ===
  trackCountry?: string                     // Country where track is located
  lastCrowdReaction: number                 // Last crowd reaction time
  excitingMomentCount: number               // Recent exciting moments (for atmosphere)
  
  // === BREATHING ROOM / PACING ===
  consecutiveCommentaryCount: number        // Count of consecutive commentary pieces
  lastBreathingRoom: number                 // Last breathing room timestamp
  
  // === POST-RACE TRACKING ===
  raceFinished: boolean                     // Has the race finished
  cooldownLapAnnounced: boolean             // Announced cool-down lap
  postRaceReflectionAnnounced: boolean      // Announced post-race reflection
  championshipImplicationsAnnounced: boolean // Announced championship implications
}

// Session phase enum (like Crew Chief)
export type SessionPhase = 
  | 'Unavailable'    // No session data
  | 'Garage'         // In garage/menu
  | 'Countdown'      // Before green light
  | 'Formation'      // Formation lap
  | 'Green'          // Session active
  | 'Checkered'      // Time/laps up, cars finishing
  | 'Finished'       // Session complete
  | 'FullCourseYellow' // FCY/Safety car

// ===== PLAYER STATE MACHINE =====
// Tracks what the player is ACTUALLY doing for intelligent commentary routing
// This enables "redirect, not restrict" - different states get DIFFERENT colorful commentary
export type PlayerActivityState = 
  | 'GARAGE'         // Stationary in pits - paddock talk, driver intros, track history
  | 'PIT_LANE'       // Moving in pit lane - pit lane observations, strategy chat
  | 'OUT_LAP'        // First lap after pits - setup talk, tyre warmup, what to expect
  | 'FLYING_LAP'     // Hot lap with timing - full action commentary, corners, pace
  | 'IN_LAP'         // Heading to pits - lap analysis, reflection, strategy
  | 'COOLDOWN_LAP'   // Post-flying, cooling tyres - debrief, what went well
  | 'RACE_RUNNING'   // In a race (different flow than practice/quali)

// Events ALLOWED per player state - this is "redirect" not "restrict"
// Each state has RICH commentary options, just appropriate ones
const STATE_ALLOWED_EVENTS: Record<PlayerActivityState, CommentaryEventType[]> = {
  'GARAGE': [
    // Rich paddock content for stationary moments
    'SESSION_START', 'DRIVER_BACKGROUND', 'TEAM_INFO', 'TRACK_CHARACTER',
    'TRIVIA_DROP', 'CHAMPIONSHIP_UPDATE', 'RIVALRY_MENTION', 'COLOR_COMMENTARY',
    'RANDOM_FACT', 'MEDIA_HEADLINE_CALLBACK', 'TEAM_PRESSURE_MENTION', 
    'SPONSOR_PRESSURE_MENTION', 'TRACK_EVOLUTION', 'DISAGREEMENT',
    // Pit reporter events (grid walk, etc.)
    'PIT_REPORTER_GRID', 'ATMOSPHERE_ELECTRIC', 'BREATHING_ROOM'
  ],
  'PIT_LANE': [
    // Pit lane observations, strategy
    'PIT_ENTRY', 'PIT_EXIT', 'PIT_ACTIVITY', 'TEAM_INFO', 'TRACK_CHARACTER',
    'TRIVIA_DROP', 'COLOR_COMMENTARY', 'RANDOM_FACT', 'STRATEGY_UPDATE',
    // Strategy speculation & pit reporter
    'STRATEGY_SPECULATION', 'STRATEGY_UNDERCUT_ATTEMPT', 'STRATEGY_OVERCUT_ATTEMPT',
    'PIT_REPORTER_PIT_UPDATE', 'BREATHING_ROOM'
  ],
  'OUT_LAP': [
    // Setup, preparation, track learning - NO lap time or corner analysis
    'TRACK_CHARACTER', 'TRIVIA_DROP', 'DRIVER_BACKGROUND', 'TEAM_INFO',
    'WEATHER_CHANGE', 'TRACK_EVOLUTION', 'COLOR_COMMENTARY', 'RANDOM_FACT',
    'RIVALRY_MENTION', 'CHAMPIONSHIP_UPDATE', 'DISAGREEMENT'
  ],
  'FLYING_LAP': [
    // FULL ACTION - everything is fair game!
    // Timing achievements
    'CORNER_CALLOUT', 'LAP_COMPLETE', 'PERSONAL_BEST', 'FASTEST_LAP',
    'SECTOR_PURPLE', 'QUALIFYING_ATTEMPT', 'PRACTICE_IMPROVEMENT',
    'SESSION_BEST_SET', 'SESSION_BEST_STOLEN', 'GAP_CLOSING', 'GAP_OPENING',
    // Battle/position (can happen in multi-car quali runs)
    'OVERTAKE', 'POSITION_LOST', 'BATTLE_FORMING', 'UNDER_PRESSURE',
    'PRESSURE_BUILDING', 'DEFENSIVE_DRIVING', 'MOMENTUM_BUILDING',
    // Color commentary
    'TRACK_CHARACTER', 'COLOR_COMMENTARY', 'TRIVIA_DROP', 'RANDOM_FACT',
    'DRIVER_BACKGROUND', 'TEAM_INFO', 'CHAMPIONSHIP_UPDATE', 'RIVALRY_MENTION',
    'DISAGREEMENT',
    // Weather/track
    'WEATHER_CHANGE', 'TRACK_EVOLUTION',
    // Flags
    'FLAG_YELLOW', 'FLAG_BLUE', 'FLAG_GREEN',
    // Rival events
    'RIVAL_FASTEST_LAP', 'RIVAL_PIT_ENTRY', 'RIVAL_PIT_EXIT',
    // Narrative
    'TEAM_PRESSURE_MENTION', 'SPONSOR_PRESSURE_MENTION', 'MEDIA_HEADLINE_CALLBACK',
    // TV Broadcast
    'CROWD_ROAR', 'ATMOSPHERE_ELECTRIC', 'BREATHING_ROOM',
    'STRATEGY_SPECULATION', 'PIT_WINDOW_OPEN'
  ],
  'IN_LAP': [
    // Lap reflection, what went well/wrong
    'LAP_COMPLETE', 'PERSONAL_BEST', 'COLOR_COMMENTARY', 'RANDOM_FACT',
    'TRACK_CHARACTER', 'PIT_ENTRY', 'STRATEGY_UPDATE'
  ],
  'COOLDOWN_LAP': [
    // Debrief mode - analysis and reflection
    'LAP_COMPLETE', 'COLOR_COMMENTARY', 'RANDOM_FACT', 'TRACK_CHARACTER',
    'TRIVIA_DROP', 'CHAMPIONSHIP_UPDATE', 'SESSION_END', 'DISAGREEMENT',
    // Post-race events
    'COOLDOWN_LAP', 'POST_RACE_REFLECTION', 'CHAMPIONSHIP_IMPLICATIONS',
    'PIT_REPORTER_POST_RACE', 'ATMOSPHERE_ELECTRIC'
  ],
  'RACE_RUNNING': [
    // Race has different rules - everything action-focused
    'OVERTAKE', 'POSITION_LOST', 'BATTLE_FORMING', 'UNDER_PRESSURE',
    'GAP_CLOSING', 'DEFENSIVE_DRIVING', 'PRESSURE_BUILDING', 'MOMENTUM_BUILDING',
    'RACE_START', 'FINAL_LAPS', 'HALFWAY_POINT', 'LAP_COMPLETE',
    'FASTEST_LAP', 'PERSONAL_BEST', 'PIT_ENTRY', 'PIT_EXIT',
    'CORNER_CALLOUT', 'TRACK_CHARACTER', 'COLOR_COMMENTARY', 'RANDOM_FACT',
    'CHAMPIONSHIP_UPDATE', 'RIVALRY_MENTION', 'WEATHER_CHANGE', 'DISAGREEMENT',
    'RACE_WIN', 'PODIUM_FINISH', 'RACE_FINISH', 'LEADER_UPDATE',
    'MIDFIELD_ACTION', 'RIVAL_PIT_ENTRY', 'RIVAL_PIT_EXIT', 'RIVAL_FASTEST_LAP',
    'CONTACT_DETECTED', 'PLAYER_SPINNING', 'FLAG_YELLOW', 'FLAG_SAFETY_CAR',
    'TEAM_PRESSURE_MENTION', 'SPONSOR_PRESSURE_MENTION',
    // TV Broadcast - Strategy & Atmosphere
    'STRATEGY_SPECULATION', 'STRATEGY_UNDERCUT_ATTEMPT', 'STRATEGY_OVERCUT_ATTEMPT',
    'STRATEGY_COMMITTED', 'PIT_WINDOW_OPEN',
    'CROWD_ROAR', 'ATMOSPHERE_ELECTRIC', 'BREATHING_ROOM',
    'PIT_REPORTER_PIT_UPDATE'
  ]
}

// Events that BYPASS state checking (always allowed - high priority real-time)
// These are CRITICAL events that should NEVER be blocked or redirected
const BYPASS_STATE_EVENTS: CommentaryEventType[] = [
  // Race finish events
  'RACE_WIN', 'PODIUM_FINISH', 'RACE_FINISH', 'SESSION_END',
  // Session milestone events - broadcast-level, must fire regardless of player state
  'SESSION_START', 'SESSION_TIME_5MIN', 'SESSION_TIME_1MIN', 'SESSION_TIME_30SEC',
  'SESSION_CHECKERED', 'PRACTICE_COMPLETE', 'QUALI_COMPLETE',
  // Post-race TV broadcast events
  'COOLDOWN_LAP', 'POST_RACE_REFLECTION', 'CHAMPIONSHIP_IMPLICATIONS',
  'PIT_REPORTER_POST_RACE',
  // Incidents and flags - CRITICAL safety/drama
  'CONTACT_DETECTED', 'PLAYER_SPINNING', 'PLAYER_OFFTRACK',
  'FLAG_YELLOW', 'FLAG_DOUBLE_YELLOW', 'FLAG_SAFETY_CAR', 'FLAG_RED', 'FLAG_BLUE',
  'FCY_DEPLOYED', 'FCY_ENDING',
  // Crowd moments (should always fire when appropriate)
  'CROWD_ROAR', 'ATMOSPHERE_ELECTRIC',
  // Qualifying achievements
  'POLE_POSITION', 'FRONT_ROW', 'QUALI_P1_SECURED', 'QUALI_FRONT_ROW_SECURED',
  // Milestones
  'MILESTONE_WIN_STREAK', 'MILESTONE_PODIUM_STREAK', 'MILESTONE_COMEBACK', 
  'MILESTONE_HAT_TRICK', 'MILESTONE_GRAND_SLAM', 'RECORD_BROKEN',
  // ACTION events that should ALWAYS fire (the exciting stuff!)
  'OVERTAKE', 'POSITION_LOST', 'BATTLE_FORMING', 'UNDER_PRESSURE',
  'FASTEST_LAP', 'PERSONAL_BEST', 'SECTOR_PURPLE',
  'SESSION_BEST_SET', 'SESSION_BEST_STOLEN',
  'RIVAL_FASTEST_LAP', 'RIVAL_RETIRED',
  // Race starts
  'RACE_START', 'POOR_START', 'GREAT_START',
  // Damage reports
  'DAMAGE_REPORT', 'ENGINE_WARNING', 'AERO_DAMAGE'
]

// ===== TEAM TIER MAPPING =====
// Maps known team names to expected performance tier
const TEAM_TIERS: Record<string, 'top' | 'midfield' | 'backmarker'> = {
  // F1-style teams
  'Red Bull': 'top',
  'Ferrari': 'top', 
  'Mercedes': 'top',
  'McLaren': 'top',
  'Aston Martin': 'midfield',
  'Alpine': 'midfield',
  'Williams': 'backmarker',
  'Haas': 'backmarker',
  'Kick Sauber': 'backmarker',
  'RB': 'midfield',
  // Generic fallbacks
  'Works Team': 'top',
  'Factory Team': 'top',
  'Customer Team': 'midfield',
  'Private Entry': 'backmarker',
}

// ===== INTELLIGENCE CALCULATION FUNCTIONS =====

/**
 * Calculate expected position based on team tier and driver reputation
 */
function calculateExpectedPosition(teamName: string | undefined, reputation: number | undefined, totalParticipants: number): number {
  const teamTier = teamName ? (TEAM_TIERS[teamName] || 'midfield') : 'midfield'
  const rep = reputation || 50
  
  // Base expected position by tier
  let basePosition: number
  switch (teamTier) {
    case 'top': basePosition = 3; break
    case 'midfield': basePosition = 10; break
    case 'backmarker': basePosition = 18; break
  }
  
  // Adjust by reputation (-5 to +5 positions)
  const repAdjustment = Math.round((50 - rep) / 10)
  const expected = Math.max(1, Math.min(totalParticipants, basePosition + repAdjustment))
  
  return expected
}

/**
 * Determine car health status from temperatures
 */
function calculateCarHealth(oilTemp: number | undefined, waterTemp: number | undefined): 'healthy' | 'warm' | 'hot' | 'critical' {
  const oil = oilTemp || 0
  const water = waterTemp || 0
  
  if (oil > 150 || water > 120) return 'critical'
  if (oil > 130 || water > 105) return 'hot'
  if (oil > 110 || water > 95) return 'warm'
  return 'healthy'
}

/**
 * Determine weather condition from rain density
 */
function calculateWeatherCondition(rainDensity: number | undefined): 'dry' | 'damp' | 'wet' | 'storm' {
  const rain = rainDensity || 0
  if (rain > 0.7) return 'storm'
  if (rain > 0.4) return 'wet'
  if (rain > 0.1) return 'damp'
  return 'dry'
}

/**
 * Calculate race phase based on lap progress
 */
function calculateRacePhase(currentLap: number, totalLaps: number): 'opening_scuffle' | 'management' | 'final_sprint' | 'victory_lap' {
  if (totalLaps <= 0) return 'management'
  
  const progress = currentLap / totalLaps
  
  if (progress < 0.15) return 'opening_scuffle'  // First 15%
  if (progress > 0.85) return 'final_sprint'     // Last 15%
  if (progress >= 1.0) return 'victory_lap'
  return 'management'
}

/**
 * Calculate momentum status from gap history
 */
function calculateMomentumStatus(gapHistory: { lap: number; gapAhead: number }[]): { status: 'catching' | 'stable' | 'falling_back'; delta: number } {
  if (gapHistory.length < 3) return { status: 'stable', delta: 0 }
  
  const recent = gapHistory.slice(-3)
  const oldest = recent[0].gapAhead
  const newest = recent[recent.length - 1].gapAhead
  const delta = newest - oldest  // Negative = catching up
  
  if (delta < -0.5) return { status: 'catching', delta }
  if (delta > 0.5) return { status: 'falling_back', delta }
  return { status: 'stable', delta }
}

/**
 * Calculate consistency rating from recent lap times
 */
function calculateConsistency(lapTimes: number[]): 'metronomic' | 'consistent' | 'erratic' {
  if (lapTimes.length < 3) return 'consistent'
  
  const validTimes = lapTimes.filter(t => t > 0)
  if (validTimes.length < 3) return 'consistent'
  
  const avg = validTimes.reduce((a, b) => a + b, 0) / validTimes.length
  const variance = validTimes.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / validTimes.length
  const stdDev = Math.sqrt(variance)
  
  // Standard deviation as percentage of lap time
  const variancePercent = (stdDev / avg) * 100
  
  if (variancePercent < 0.5) return 'metronomic'  // Under 0.5% variance
  if (variancePercent < 1.5) return 'consistent'   // Under 1.5% variance
  return 'erratic'
}

/**
 * Calculate pressure level based on gaps and race phase
 */
function calculatePressureLevel(
  gapBehind: number | undefined, 
  racePhase: string, 
  underAttackLaps: number,
  position: number
): 'relaxed' | 'focused' | 'intense' | 'critical' {
  const gap = gapBehind || 99
  
  // Critical: Close gap in final laps or fighting for podium
  if ((racePhase === 'final_sprint' && gap < 2) || (position <= 3 && gap < 1)) {
    return 'critical'
  }
  
  // Intense: Under attack for multiple laps
  if (underAttackLaps >= 3 || gap < 0.8) {
    return 'intense'
  }
  
  // Focused: Normal racing pressure
  if (gap < 3 || racePhase === 'final_sprint') {
    return 'focused'
  }
  
  return 'relaxed'
}

// Cooldowns to prevent spam (in ms) - REDUCED for more frequent commentary
const EVENT_COOLDOWNS: Record<string, number> = {
  // High frequency events - fast cooldowns for action
  OVERTAKE: 8000,           // Was 10s
  POSITION_LOST: 8000,      // Was 10s
  GAP_CLOSING: 12000,       // Was 20s
  GAP_OPENING: 15000,       // Was 25s
  BATTLE_FORMING: 15000,    // Was 30s
  LAP_COMPLETE: 90000,      // Increased: only every ~3 laps
  
  // Medium frequency
  FASTEST_LAP: 20000,       // Was 30s
  PERSONAL_BEST: 15000,     // Was 25s
  SECTOR_PURPLE: 18000,     // Was 25s
  PRACTICE_IMPROVEMENT: 20000, // Was 30s
  
  // Race phase events
  FINAL_LAPS: 45000,        // Was 60s
  HALFWAY_POINT: 120000,    // Keep - only once
  RACE_START: 30000,
  RACE_FINISH: 30000,
  RACE_WIN: 30000,
  PODIUM_FINISH: 30000,
  
  // Record/Achievement events - rare but important
  RECORD_BROKEN: 60000,     // Once per record broken
  RECORD_APPROACHING: 90000, // Don't spam about approaching records
  MILESTONE_UNLOCKED: 60000, // Once per milestone
  TRIPLE_CROWN_LEG: 120000,  // Rare achievement
  
  // NEW: Milestone celebration events
  MILESTONE_WIN_STREAK: 180000,   // Every 3 minutes max when on streak
  MILESTONE_PODIUM_STREAK: 180000, // Same for podium streak
  MILESTONE_COMEBACK: 60000,      // Once per comeback win
  MILESTONE_HAT_TRICK: 60000,     // Once per hat trick
  MILESTONE_GRAND_SLAM: 60000,    // Once per grand slam
  
  // NEW: Team/Sponsor narrative events - infrequent background mentions
  TEAM_PRESSURE_MENTION: 300000,  // Every 5 minutes max
  SPONSOR_PRESSURE_MENTION: 300000, // Same for sponsor mentions
  MEDIA_HEADLINE_CALLBACK: 240000,  // Every 4 minutes max
  
  // Start-specific events (once per race)
  POOR_START: 120000,       // Keep - only once
  GREAT_START: 120000,      // Keep - only once
  UNDER_PRESSURE: 40000,    // Was 60s
  
  // Field commentary - MORE frequent for player-centric updates
  FIELD_BATTLE: 12000,      // Was 20s - battles near player
  LEADER_UPDATE: 35000,     // Was 45s
  MIDFIELD_ACTION: 18000,   // Was 30s - key for player context
  
  // Situational events - REDUCED for more commentary
  MOMENTUM_BUILDING: 25000,   // Was 45s
  DEFENSIVE_DRIVING: 30000,   // Was 50s
  CONSISTENCY_PRAISE: 60000,  // Was 90s
  RECOVERY_DRIVE: 25000,      // Was 40s
  PRESSURE_BUILDING: 15000,   // Was 30s - key tension builder
  GAP_CALCULATION: 30000,     // Was 45s
  
  // Practice/Quali specific
  OTHER_DRIVER_HOTLAP: 18000, // Was 25s
  TRACK_EVOLUTION: 60000,     // Was 90s
  SECTOR_COMPARISON: 25000,   // Was 35s
  PIT_ACTIVITY: 30000,        // Was 40s
  
  // Track specific
  CORNER_CALLOUT: 45000,      // Was 60s
  TRACK_CHARACTER: 90000,     // Was 120s
  
  // Banter
  TRIVIA_DROP: 120000,        // Was 180s
  DISAGREEMENT: 100000,       // Was 150s
  
  // Pit events
  PIT_ENTRY: 12000,           // Was 15s
  PIT_EXIT: 12000,            // Was 15s
  
  // Flags (announce on change; also keep a short cooldown for flicker)
  FLAG_GREEN: 12000,
  FLAG_YELLOW: 12000,
  FLAG_DOUBLE_YELLOW: 12000,
  FLAG_BLUE: 12000,
  FLAG_WHITE: 12000,
  FLAG_BLACK: 12000,
  FLAG_CHEQUERED: 30000,
  FLAG_FINAL_LAP: 30000,       // Final lap announcement
  
  // === NEW: Telemetry-driven events ===
  // Rival events
  RIVAL_PIT_ENTRY: 15000,       // Announce rival pitting
  RIVAL_PIT_EXIT: 20000,        // Rival rejoined track
  RIVAL_FASTEST_LAP: 20000,     // Rival set fastest lap
  RIVAL_RETIRED: 30000,         // Rival DNF/retired
  
  // Player incidents - react quickly!
  CONTACT_DETECTED: 5000,       // Quick reaction to contact
  PLAYER_SPINNING: 3000,        // Immediate spinning reaction
  PLAYER_OFFTRACK: 8000,        // Off track moment
  
  // Damage reports
  DAMAGE_REPORT: 30000,         // General damage update
  ENGINE_WARNING: 45000,        // Don't spam engine warnings
  AERO_DAMAGE: 30000,           // Aero damage report
  
  // Yellow flag / safety car
  FCY_DEPLOYED: 20000,          // Safety car announcement
  FCY_ENDING: 20000,            // Safety car ending
  
  // === NEW: Session phase events ===
  SESSION_TIME_5MIN: 300000,    // Only once per session (5 min)
  SESSION_TIME_1MIN: 60000,     // Only once per session
  SESSION_TIME_30SEC: 30000,    // Only once per session
  SESSION_CHECKERED: 30000,     // Checkered flag for timed session
  SESSION_BEST_STOLEN: 15000,   // Someone stole P1
  SESSION_BEST_SET: 15000,      // Player set session best
  QUALI_P1_SECURED: 30000,      // Pole position secured at end
  QUALI_FRONT_ROW_SECURED: 30000, // Front row secured
  QUALI_COMPLETE: 60000,        // Quali session finished
  PRACTICE_COMPLETE: 60000,     // Practice session finished
  
  // Session events
  SESSION_START: 60000,
  SESSION_END: 30000,
  QUALIFYING_ATTEMPT: 15000,  // Was 20s
  POLE_POSITION: 30000,
  FRONT_ROW: 30000,
  
  // Color commentary - REDUCED for more chatter
  COLOR_COMMENTARY: 50000,    // Was 90s
  DRIVER_BACKGROUND: 120000,  // Was 180s
  TEAM_INFO: 120000,          // Was 180s
  CHAMPIONSHIP_UPDATE: 80000, // Was 120s
  RIVALRY_MENTION: 80000,     // Was 120s
  RANDOM_FACT: 60000,         // Was 90s
  
  // === NEW: Crew Chief-style enhanced events ===
  // Gap to leader
  GAP_TO_LEADER_UPDATE: 45000,  // Update every 45s max
  LEADER_GAP_CLOSING: 25000,    // Announce when closing on leader
  LEADER_GAP_OPENING: 30000,    // Announce when losing to leader
  
  // Weather changes
  RAIN_INCOMING: 30000,         // Rain starting
  RAIN_STOPPING: 30000,         // Rain stopping
  TRACK_TEMP_CHANGE: 120000,    // Track temp changes (rare)
  
  // Enhanced damage
  BRAKE_DAMAGE: 45000,          // Brake damage report
  SUSPENSION_DAMAGE: 45000,     // Suspension damage
  TYRE_DAMAGE: 30000,           // Tyre wear warning
  PUNCTURE_DETECTED: 10000,     // Urgent - puncture
  
  // Sector tracking (SECTOR_PURPLE already defined above)
  OVERALL_FASTEST_LAP: 20000,   // Fastest lap celebration
  
  // DRS
  DRS_AVAILABLE: 20000,         // DRS available
  DRS_ZONE_ENTRY: 30000,        // Entering DRS zone
  
  // Blue flag
  BLUE_FLAG_PERSISTENT: 20000,  // Persistent blue flag
  
  // Position trend
  LOSING_POSITION_TREND: 60000, // Trend warning
  GAINING_POSITION_TREND: 45000, // Positive trend
  LAST_PLACE_WARNING: 90000,    // Last place alert
  
  // === Strategy Speculation ===
  STRATEGY_SPECULATION: 90000,    // General strategy observation
  STRATEGY_UNDERCUT_ATTEMPT: 30000, // Quick reaction to undercut
  STRATEGY_OVERCUT_ATTEMPT: 30000,  // Quick reaction to overcut
  PIT_WINDOW_OPEN: 120000,         // Once per pit window
  STRATEGY_COMMITTED: 60000,       // Strategy commitment
  
  // === Crowd / Atmosphere ===
  CROWD_ROAR: 45000,              // Home hero / exciting moment
  ATMOSPHERE_ELECTRIC: 90000,     // General atmosphere
  
  // === Breathing Room ===
  BREATHING_ROOM: 120000,         // Natural pause (don't spam)
  
  // === Post-Race ===
  COOLDOWN_LAP: 30000,            // Cool-down lap (single use usually)
  POST_RACE_REFLECTION: 45000,    // Post-race analysis
  CHAMPIONSHIP_IMPLICATIONS: 60000, // Championship impact
  
  // === Pit Reporter ===
  PIT_REPORTER_GRID: 60000,       // Grid walk
  PIT_REPORTER_PIT_UPDATE: 30000, // Pit lane update
  PIT_REPORTER_POST_RACE: 45000,  // Post-race pit report
}

// Maximum queue size to prevent buildup - INCREASED for more events
const MAX_QUEUE_SIZE = 8

// Session warmup period - block non-SESSION_START events for this long after session begins
// This prevents awkward commentary like "beautiful corner" in the first second of quali
const SESSION_WARMUP_MS = 15000 // 15 seconds

const state: CommentaryState = {
  enabled: false,
  lastEventTime: {},
  lastPosition: 0,
  lastLap: 0,
  lastBestLap: 0,
  lastGapAhead: 999,
  lastGapBehind: 999,
  sessionStarted: false,
  sessionStartedAt: 0,
  raceStarted: false,
  announcedFinalLaps: false,
  announcedHalfway: false,
  queuedEvents: [],
  isProcessing: false,
  cooldowns: { ...EVENT_COOLDOWNS },
  currentSessionType: '',
  lastColorCommentary: 0,
  colorCommentaryInterval: 25000, // Random chatter every 25s-50s (was 45s-90s)
  careerData: null,
  // Start detection
  positionAtRaceStart: 0,
  announcedPoorStart: false,
  announcedGreatStart: false,
  // Field tracking
  lastFieldPositions: new Map(),
  lastFieldUpdate: 0,
  // Momentum tracking
  positionHistory: [],
  recentLapTimes: [],
  lastDefensiveCheck: 0,
  underPressureLaps: 0,
  lastGapLogTime: 0,
  lastQualiLogTime: 0,
  lastSessionLogTime: 0,
  // Practice/Quali tracking
  otherDriverBestTimes: new Map(),
  lastTrackEvolutionCheck: 0,
  averageBestTime: 0,
  // 8-Theme Intelligence Tracking
  gapHistory: [],
  lastFuelLevel: 1.0,
  fuelConsumptionPerLap: 0,
  // Session Memory (persists across sessions)
  sessionMemory: {},
  // Race Narrative Memory (tracks story moments)
  narrativeMemory: createNarrativeMemory(),
  // Flag tracking
  lastFlagColour: undefined,
  lastFlagReason: undefined,
  lastFlagAnnouncedAt: 0,
  lastPlayerPitMode: 0,
  
  // === NEW: Telemetry-driven state tracking ===
  rivalBestTimes: new Map(),
  rivalsInPits: new Set(),
  rivalsRetired: new Set(),
  lastCollisionMagnitude: 0,
  lastCollisionTime: 0,
  lastCrashState: 0,
  lastYellowFlagState: 0,
  
  // === NEW: Session phase tracking ===
  sessionPhase: 'Unavailable' as SessionPhase,
  lastTimeRemaining: -1,
  announced5MinWarning: false,
  announced1MinWarning: false,
  announced30SecWarning: false,
  announcedSessionCheckered: false,
  announcedSessionComplete: false,
  overallSessionBest: -1,
  overallSessionBestDriver: '',
  playerClassSessionBest: -1,
  playerSessionBest: -1,
  lastOverallSessionBest: -1,
  
  // === NEW: Crew Chief-style enhanced tracking ===
  // Gap to leader
  lastGapToLeader: -1,
  gapToLeaderHistory: [],
  lastLeaderUpdate: 0,
  
  // Weather tracking
  lastRainDensity: 0,
  lastTrackTemp: 0,
  weatherChangeAnnounced: 0,
  
  // Enhanced damage tracking
  lastBrakeDamage: [0, 0, 0, 0] as [number, number, number, number],
  lastSuspensionDamage: [0, 0, 0, 0] as [number, number, number, number],
  lastTyreWear: [0, 0, 0, 0] as [number, number, number, number],
  damageAnnouncementTimes: {},
  
  // Sector tracking
  sessionBestSectors: [-1, -1, -1] as [number, number, number],
  lastSectorTimes: [0, 0, 0] as [number, number, number],
  purpleSectorAnnounced: [false, false, false] as [boolean, boolean, boolean],
  
  // DRS tracking
  lastDrsState: 0,
  drsAvailableAnnounced: false,
  
  // Blue flag tracking
  blueFlagStartTime: 0,
  blueFlagLaps: 0,
  lastBlueFlagState: false,
  
  // Position trend tracking
  positionHistory5Laps: [],
  lastPositionTrendCheck: 0,
  
  // === PLAYER ACTIVITY STATE MACHINE ===
  playerActivityState: 'GARAGE' as PlayerActivityState,
  lastPlayerSpeed: 0,
  lapAtPitExit: -1,
  lastStateChangeTime: 0,
  
  // === STRATEGY SPECULATION TRACKING ===
  pitStops: new Map(),
  estimatedStrategy: new Map(),
  pitWindowAnnounced: false,
  lastStrategyUpdate: 0,
  playerPitLaps: [],
  
  // === CROWD / ATMOSPHERE TRACKING ===
  trackCountry: undefined,
  lastCrowdReaction: 0,
  excitingMomentCount: 0,
  
  // === BREATHING ROOM / PACING ===
  consecutiveCommentaryCount: 0,
  lastBreathingRoom: 0,
  
  // === POST-RACE TRACKING ===
  raceFinished: false,
  cooldownLapAnnounced: false,
  postRaceReflectionAnnounced: false,
  championshipImplicationsAnnounced: false,
}

/**
 * Map shared-memory flag colour enum to a commentary event type.
 * Updated to use FlagColour enum from pcars2.ts
 *
 * Note: Values are from AMS2/PCARS2 shared memory spec via Crew Chief
 */
function mapFlagColourToEventType(flagColour: number): CommentaryEventType | null {
  // FlagColour enum values from pcars2.ts
  // 0=none, 1=green, 2=blue, 3=white(slow), 4=white(final), 5=red, 6=yellow,
  // 7=double yellow, 8=black+white, 9=black+orange, 10=black, 11=chequered
  switch (flagColour) {
    case 1: return 'FLAG_GREEN'
    case 2: return 'FLAG_BLUE'
    case 3: return 'FLAG_WHITE'        // Slow car ahead
    case 4: return 'FLAG_FINAL_LAP'    // Final lap!
    case 5: return null                // Red flag - race stopped, don't announce
    case 6: return 'FLAG_YELLOW'
    case 7: return 'FLAG_DOUBLE_YELLOW'
    case 10: return 'FLAG_BLACK'
    case 11: return 'FLAG_CHEQUERED'
    default: return null
  }
}

// ===== PLAYER ACTIVITY STATE MACHINE =====
// Determines what the player is ACTUALLY doing based on telemetry
// This powers the "redirect, not restrict" commentary system

/**
 * Calculate player activity state from telemetry
 * Enables intelligent commentary routing - different states get different colorful content
 */
function calculatePlayerActivityState(
  speed: number,
  pitMode: number | undefined,
  currentLap: number,
  sessionType: string | undefined,
  raceState: string | undefined
): PlayerActivityState {
  // PitMode values: 0=none, 1=pit_entry, 2=in_pits, 3=pit_exit, 4=pit_request
  const isInPits = pitMode === 2
  const isPitEntry = pitMode === 1
  const isPitExit = pitMode === 3
  const isMoving = speed > 5 // kph threshold for "moving"
  const isAtSpeed = speed > 50 // kph threshold for "at racing speed"
  
  // Race mode has different rules
  if (sessionType === 'Race' && raceState === 'Racing') {
    return 'RACE_RUNNING'
  }
  
  // In garage/pits and not moving
  if (isInPits && !isMoving) {
    return 'GARAGE'
  }
  
  // In pit lane but moving
  if (isInPits || isPitEntry || isPitExit) {
    return 'PIT_LANE'
  }
  
  // On track - determine lap type
  if (!isMoving) {
    return 'GARAGE' // Stationary on track = treat like garage
  }
  
  // Track if this is an out lap (first lap after pit exit)
  if (state.lapAtPitExit >= 0 && currentLap === state.lapAtPitExit) {
    return 'OUT_LAP'
  }
  
  // If just exited pits and we're slow, it's an out lap
  if (!isAtSpeed && state.playerActivityState === 'PIT_LANE') {
    return 'OUT_LAP'
  }
  
  // At speed on track = flying lap (or in-lap if heading to pits)
  // We'll detect in-lap separately when pit entry is triggered
  if (isPitEntry) {
    return 'IN_LAP'
  }
  
  // Default: at speed on track = flying lap
  if (isAtSpeed) {
    return 'FLYING_LAP'
  }
  
  // Slow on track (between out lap and flying lap threshold)
  return 'OUT_LAP'
}

/**
 * Update the player activity state and log transitions
 */
function updatePlayerActivityState(
  speed: number,
  pitMode: number | undefined,
  currentLap: number,
  sessionType: string | undefined,
  raceState: string | undefined
): void {
  const newState = calculatePlayerActivityState(speed, pitMode, currentLap, sessionType, raceState)
  
  if (newState !== state.playerActivityState) {
    const oldState = state.playerActivityState
    state.playerActivityState = newState
    state.lastStateChangeTime = Date.now()
    
    // Track pit exit lap for out-lap detection
    if (oldState === 'PIT_LANE' && newState === 'OUT_LAP') {
      state.lapAtPitExit = currentLap
    }
    
    // Clear pit exit lap when on flying lap
    if (newState === 'FLYING_LAP') {
      state.lapAtPitExit = -1
    }
    
    // Log the state transition for debugging
    telemetryLog.playerStateChange(oldState, newState, { speed, pitMode, currentLap })
  }
  
  state.lastPlayerSpeed = speed
}

/**
 * Validate if an event is appropriate for current player state
 * Returns: { allowed: boolean, reason: string, redirectTo?: CommentaryEventType }
 */
function validateEventForState(
  eventType: CommentaryEventType,
  playerState: PlayerActivityState
): { allowed: boolean; reason: string; redirectTo?: CommentaryEventType } {
  // High-priority events bypass state checking (crashes, wins, etc.)
  if (BYPASS_STATE_EVENTS.includes(eventType)) {
    return { allowed: true, reason: 'Bypass event - always allowed' }
  }
  
  // Check if event is in the allowed list for current state
  const allowedEvents = STATE_ALLOWED_EVENTS[playerState] || []
  
  if (allowedEvents.includes(eventType)) {
    return { allowed: true, reason: `Event allowed in ${playerState} state` }
  }
  
  // NOT allowed - suggest redirect based on state
  // We now redirect to COLOR_COMMENTARY primarily, which allows the Narrative Strand Director
  // to pick the most appropriate and diverse next topic (Venue vs Driver vs Team etc.)
  const redirectOptions: Partial<Record<PlayerActivityState, CommentaryEventType>> = {
    'GARAGE': 'COLOR_COMMENTARY',
    'PIT_LANE': 'PIT_ACTIVITY',
    'OUT_LAP': 'COLOR_COMMENTARY',
    'FLYING_LAP': 'COLOR_COMMENTARY',
    'IN_LAP': 'COLOR_COMMENTARY',
    'COOLDOWN_LAP': 'COLOR_COMMENTARY',
    'RACE_RUNNING': 'COLOR_COMMENTARY'
  }
  
  const redirectTo = redirectOptions[playerState]
  
  return {
    allowed: false,
    reason: `${eventType} not appropriate for ${playerState} state`,
    redirectTo
  }
}

/**
 * Detect flag changes from telemetry.
 * Requirement: announce ONLY when state changes; if mapping unknown, skip.
 */
function detectFlagEvents(context: EventContext, events: CommentaryEvent[]): void {
  const colour = context.flagColour
  const reason = context.flagReason
  if (colour === undefined) return

  const changed = colour !== state.lastFlagColour || reason !== state.lastFlagReason
  // Always update last-seen values so we truly announce on change
  state.lastFlagColour = colour
  state.lastFlagReason = reason
  if (!changed) return

  const eventType = mapFlagColourToEventType(colour)
  if (!eventType) return // unknown enum => skip

  // Avoid spam if telemetry flickers
  if (isOnCooldown(eventType)) return
  events.push({
    type: eventType,
    context,
    priority: eventType === 'FLAG_YELLOW' || eventType === 'FLAG_DOUBLE_YELLOW' || eventType === 'FLAG_BLACK'
      ? 'high'
      : 'medium',
    timestamp: Date.now()
  })
  markEventTriggered(eventType)
}

let mainWindow: BrowserWindow | null = null
let geminiKey: string = ''
let elevenLabsKey: string = ''
let leadVoiceId: string = 'KYXXenFO8IFao5NWmALZ' // Crofty v2 - Lead commentator (cloned voice)
let coVoiceId: string = 'cmPhBFoVi6Q3CAWAx2Gr' // Brundle - Co-commentator

/**
 * Initialize the commentary engine
 */
export function initCommentaryEngine(window: BrowserWindow): void {
  mainWindow = window
  console.log('[Commentary] Engine initialized')
  
  // Configure queue manager with callback for script notifications
  updateQueueManagerConfig()
}

/**
 * Update queue manager configuration when API keys or voices change
 */
function updateQueueManagerConfig(): void {
  if (geminiKey && elevenLabsKey) {
    queueManager.configure({
      geminiKey,
      elevenLabsKey,
      leadVoiceId,
      coVoiceId,
      onScript: (data) => {
        // Notify frontend
        mainWindow?.webContents.send('commentary:script', data)
      },
      // Enable streaming TTS for low-latency live events
      useStreaming: true,
      mainWindow
    })
  }
}

/**
 * Enable/disable commentary
 */
export function setCommentaryEnabled(enabled: boolean): void {
  const wasEnabled = state.enabled
  state.enabled = enabled
  if (!enabled) {
    stopAllAudio()
    state.queuedEvents = []
    queueManager.clearAll()
  }
  const hasKeys = !!(geminiKey && elevenLabsKey)
  console.log(`[Commentary] ${enabled ? 'ENABLED' : 'DISABLED'} (was ${wasEnabled ? 'on' : 'off'}, keys: ${hasKeys ? 'yes' : 'NO'})`)
  if (enabled && !hasKeys) {
    console.warn('[Commentary] WARNING: Enabled but missing API keys – processTelemetry will early-return')
  }
}

/**
 * Set API keys
 */
export function setAPIKeys(gemini: string, elevenLabs: string): void {
  geminiKey = gemini
  elevenLabsKey = elevenLabs
  console.log('[Commentary] API keys configured (Gemini + ElevenLabs)')
  updateQueueManagerConfig()
}

/**
 * Get currently configured API keys (for scheduler integration)
 */
export function getAPIKeys(): { geminiKey: string; elevenLabsKey: string } {
  return { geminiKey, elevenLabsKey }
}

/**
 * Set voice settings (single voice - backward compat)
 */
export function setVoiceSettings(voice: string, volume: number): void {
  leadVoiceId = voice
  setVolume(volume)
  console.log(`[Commentary] Lead voice set to ${voice}, volume ${volume}`)
}

/**
 * Set dual voice settings (lead + co-commentator)
 */
export function setDualVoiceSettings(leadVoice: string, coVoice: string, volume: number): void {
  leadVoiceId = leadVoice || ''
  coVoiceId = coVoice || ''
  setVolume(volume ?? 0.8)
  
  // IMPORTANT: Also update the voices module used by the scheduler
  setVoiceIds(leadVoiceId, coVoiceId)
  
  console.log(`[Commentary] Lead: ${leadVoiceId || '(none)'}, Co: ${coVoiceId || '(none)'}, volume ${volume}`)
  updateQueueManagerConfig()
}

/**
 * Get current voice IDs
 */
export function getVoiceIds(): { lead: string; co: string } {
  return { lead: leadVoiceId, co: coVoiceId }
}

/**
 * Set career data for color commentary
 */
export function setCareerData(data: Partial<EventContext>): void {
  const source = data.commentaryDataSource || 'mixed'
  const sanitized = { ...data }
  // Sanitize player name to prevent double spaces from firstName/lastName concatenation
  if (sanitized.playerName) {
    sanitized.playerName = sanitized.playerName.replace(/\s+/g, ' ').trim()
  }
  const beforeDriverNarratives = Array.isArray(data.driverNarratives) ? data.driverNarratives.length : 0
  const beforeTeamNarratives = Array.isArray(data.teamNarratives) ? data.teamNarratives.length : 0

  // Strict pre-generated policy: only trust narrative payloads tagged as Content Studio.
  if (source !== 'content_studio') {
    delete sanitized.driverNarratives
    delete sanitized.teamNarratives
    logCommentaryDecision(
      'DATA_SOURCE_REJECTED',
      `Rejected non-pregen narrative payload from source "${source}"`,
      {
        source,
        droppedDriverNarratives: beforeDriverNarratives,
        droppedTeamNarratives: beforeTeamNarratives,
        playerName: sanitized.playerName,
        teamName: sanitized.teamName,
      },
      'warning'
    )
  } else {
    const sampleDrivers = Array.isArray(data.driverNarratives)
      ? data.driverNarratives.slice(0, 3).map(d => {
          const hasBio = !!(d as any).biography
          const hasStyle = !!(d as any).drivingStyle
          return `${d.name}(bio:${hasBio},style:${hasStyle})`
        }).join(', ')
      : 'none'
    logCommentaryDecision(
      'DATA_SOURCE_ACCEPTED',
      `Accepted pre-generated narrative payload from source "${source}"`,
      {
        source,
        driverNarratives: beforeDriverNarratives,
        teamNarratives: beforeTeamNarratives,
        playerName: sanitized.playerName,
        teamName: sanitized.teamName,
        sampleDrivers,
      },
      'info'
    )
  }

  const seriesThreadKey = String(sanitized.seriesName || sanitized.seriesShortName || 'global')
  const existingThreadState = getCommentaryEntityState('series', seriesThreadKey)
  const existingThreadsRaw = existingThreadState.success && Array.isArray(existingThreadState.data)
    ? existingThreadState.data.find((row) => row.stateKey === 'narrative_threads')?.value
    : undefined
  const existingThreads = Array.isArray(existingThreadsRaw) ? existingThreadsRaw as NarrativeThread[] : []

  const evolvedThreads = evolveNarrativeThreads(existingThreads, {
    currentRound: sanitized.currentRound,
    titleFightStatus: sanitized.titleFightStatus,
    contractEndingSoon: sanitized.contractEndingSoon,
    sponsorPressureLevel: sanitized.sponsorPressureLevel,
    seasonAvgFinish: sanitized.seasonAvgFinish,
    teamName: sanitized.teamName,
    playerName: sanitized.playerName,
    worldSnapshot: sanitized.worldSnapshot,
  })
  sanitized.narrativeThreads = evolvedThreads

  upsertCommentaryEntityState({
    entityType: 'series',
    entityId: seriesThreadKey,
    stateKey: 'narrative_threads',
    value: evolvedThreads,
    roundUpdated: sanitized.currentRound,
  })

  logCommentaryDecision(
    'NARRATIVE_THREADS_UPDATED',
    `Updated ${evolvedThreads.length} narrative threads for ${seriesThreadKey}`,
    {
      seriesKey: seriesThreadKey,
      source,
      threadCount: evolvedThreads.length,
      currentRound: sanitized.currentRound,
      states: evolvedThreads.slice(0, 8).map((thread) => ({
        id: thread.id,
        type: thread.type,
        state: thread.state,
      })),
    },
    'decision'
  )

  state.careerData = sanitized
  console.log('[Commentary] Career data updated:', sanitized.playerName, sanitized.teamName, `(source: ${source})`)
}

/**
 * Check if an event is on cooldown
 */
function isOnCooldown(eventType: string): boolean {
  const lastTime = state.lastEventTime[eventType] || 0
  const cooldown = state.cooldowns[eventType] || 5000
  return Date.now() - lastTime < cooldown
}

/**
 * Check if we're in the session warmup period
 * During warmup, we only allow SESSION_START events to give the welcome commentary time to play
 * This prevents awkward commentary like "beautiful corner" in the first second of qualifying
 */
function isInSessionWarmup(): boolean {
  if (!state.sessionStarted || state.sessionStartedAt === 0) {
    return false
  }
  const elapsed = Date.now() - state.sessionStartedAt
  return elapsed < SESSION_WARMUP_MS
}

/**
 * Mark an event as triggered (start cooldown)
 */
function markEventTriggered(eventType: string): void {
  state.lastEventTime[eventType] = Date.now()
}

/**
 * Process telemetry data and detect events
 */
// Throttle telemetry processing - check frequently for events
let lastTelemetryProcess = 0
const TELEMETRY_PROCESS_INTERVAL = 1000 // Process every 1 second (was 2s)

let telemetryGateLoggedAt = 0

export function processTelemetry(
  session: any,
  participants: any[],
  playerIndex: number
): void {
  if (!state.enabled || !geminiKey || !elevenLabsKey) {
    const now = Date.now()
    if (now - telemetryGateLoggedAt > 15_000) {
      telemetryGateLoggedAt = now
      console.log(`[Commentary] processTelemetry skipped – enabled:${state.enabled} gemini:${!!geminiKey} eleven:${!!elevenLabsKey}`)
    }
    return
  }
  
  // Throttle processing to prevent spam
  const now = Date.now()
  if (now - lastTelemetryProcess < TELEMETRY_PROCESS_INTERVAL) {
    return
  }
  lastTelemetryProcess = now
  
  // Find player ONLY by isPlayer flag - don't use carIndex fallback as it's unreliable after sorting
  const player = participants.find(p => p.isPlayer)
  if (!player) {
    // Debug log when player not found
    if (Math.random() < 0.1) {
      console.log(`[Commentary] Player not found in ${participants.length} participants. isPlayer flags:`, 
        participants.slice(0, 5).map(p => ({ name: p.name, isPlayer: p.isPlayer })))
    }
    return
  }
  
  // Debug: Log position data occasionally to track issues
  if (Math.random() < 0.05) { // 5% chance to log
    console.log(`[Commentary] Player: ${player.name}, Position: P${player.racePosition}, isPlayer: ${player.isPlayer}`)
    console.log(`[Commentary] Last position: P${state.lastPosition}, Current: P${player.racePosition}`)
  }
  
  const sessionType = mapSessionType(session?.sessionType)
  
  // Log session type every 30 seconds so we can debug session detection issues
  const shouldLogSession = now - (state.lastSessionLogTime || 0) > 30000
  if (shouldLogSession) {
    state.lastSessionLogTime = now
    telemetryLog.actionCheck('SESSION_TYPE', false,
      `Raw: "${session?.sessionType}" -> Mapped: "${sessionType}" | State: ${session?.raceState}`,
      { rawSessionType: session?.sessionType, mappedType: sessionType, raceState: session?.raceState }
    )
  }
  
  // ===== UPDATE PLAYER ACTIVITY STATE =====
  // This powers the intelligent commentary routing - "redirect, not restrict"
  const playerSpeed = session?.speed || player.speed || 0
  const pitMode = player.pitMode
  const currentLap = player.currentLap || 0
  const raceState = session?.raceState
  
  updatePlayerActivityState(playerSpeed, pitMode, currentLap, sessionType, raceState)
  
  // Position is meaningless when sitting in the garage or before completing a lap
  const hasValidPosition = (player.currentLap || 0) >= 1 && state.playerActivityState !== 'GARAGE'
  
  const context: EventContext = {
    playerName: state.careerData?.playerName || player.name || 'Driver',
    playerPosition: hasValidPosition ? (player.racePosition || 0) : 0,
    trackName: sanitizeTrackName(session?.trackName),
    currentLap: player.currentLap || 0,
    totalLaps: session?.lapsInEvent || 0,
    // Filter out invalid lap times (-123 is a game placeholder for "no time set")
    bestLapTime: (player.bestLapTime > 0 ? player.bestLapTime : null) || 
                 (session?.bestLapTime > 0 ? session.bestLapTime : null) || 
                 0,
    lastLapTime: (player.lastLapTime > 0 ? player.lastLapTime : null) || 
                 (session?.lastLapTime > 0 ? session.lastLapTime : null) || 
                 0,
    raceState: session?.raceState,
    sessionType,
    lapsRemaining: (session?.lapsInEvent || 0) - (player.currentLap || 0),
    // Flags (raw enums; mapping handled by commentary engine/generator)
    flagColour: session?.highestFlagColour,
    flagReason: session?.highestFlagReason,
    // Pit (player)
    pitMode: player.pitMode,
    // Player activity state (for verified context in prompts)
    speed: playerSpeed,
    _playerState: state.playerActivityState,
    // Merge in career data
    ...state.careerData,
    carName: session?.carName || state.careerData?.carName,
    carClass: session?.carClass || state.careerData?.carClass,
  }
  
  // Calculate gaps - use the GAME's split times (much more accurate than manual calculation)
  // splitTimeAhead/Behind are calculated by AMS2 and account for track position properly
  context.gapAhead = session?.splitTimeAhead > 0 ? session.splitTimeAhead : undefined
  context.gapBehind = session?.splitTimeBehind > 0 ? session.splitTimeBehind : undefined
  
  // Log gaps periodically (every 15 seconds) so we can see the race situation
  const shouldLogGaps = now - (state.lastGapLogTime || 0) > 15000
  if (shouldLogGaps && (context.gapAhead || context.gapBehind)) {
    state.lastGapLogTime = now
    telemetryLog.gapUpdate(context.gapAhead, context.gapBehind, context.playerPosition)
    
    // Also log if we're in a battle situation
    const inBattle = (context.gapAhead && context.gapAhead < 2.0) || (context.gapBehind && context.gapBehind < 1.5)
    if (inBattle) {
      telemetryLog.actionCheck('BATTLE_SITUATION', true, 
        `Close racing! Ahead: ${context.gapAhead?.toFixed(1)}s, Behind: ${context.gapBehind?.toFixed(1)}s`,
        { gapAhead: context.gapAhead, gapBehind: context.gapBehind }
      )
    }
  }
  
  // Keep sorted participants for other uses
  const sortedParticipants = [...participants].sort((a, b) => a.racePosition - b.racePosition)
  const playerIdx = sortedParticipants.findIndex(p => p.isPlayer)
  
  // ===== 8-THEME INTELLIGENCE CALCULATIONS =====
  
  // THEME 1: TECHNICAL (Car Health) - from session telemetry
  context.oilTempCelsius = session?.oilTempCelsius
  context.waterTempCelsius = session?.waterTempCelsius
  context.fuelLevel = session?.fuelLevel
  context.fuelCapacity = session?.fuelCapacity
  context.carHealthStatus = calculateCarHealth(session?.oilTempCelsius, session?.waterTempCelsius)
  
  // Calculate fuel laps remaining
  if (session?.fuelLevel && state.fuelConsumptionPerLap > 0) {
    context.fuelLapsRemaining = Math.floor(session.fuelLevel / state.fuelConsumptionPerLap)
  }
  
  // Track fuel consumption
  if (session?.fuelLevel && state.lastFuelLevel > session.fuelLevel && context.currentLap > 1) {
    const consumed = state.lastFuelLevel - session.fuelLevel
    // Smooth the consumption rate
    state.fuelConsumptionPerLap = state.fuelConsumptionPerLap > 0 
      ? (state.fuelConsumptionPerLap * 0.7) + (consumed * 0.3)
      : consumed
  }
  state.lastFuelLevel = session?.fuelLevel || state.lastFuelLevel
  
  // THEME 2: TRACK/ENVIRONMENT
  context.trackTemperature = session?.trackTemperature
  context.ambientTemperature = session?.ambientTemperature
  context.rainDensity = session?.rainDensity
  context.windSpeed = session?.windSpeed
  context.weatherCondition = calculateWeatherCondition(session?.rainDensity)
  
  // Check if home race (track location contains player nationality)
  const playerNationality = state.careerData?.nationality?.toLowerCase() || ''
  const trackLocation = (session?.trackLocation || '').toLowerCase()
  context.isHomeRace = playerNationality.length > 2 && (
    trackLocation.includes(playerNationality) ||
    (playerNationality === 'british' && (trackLocation.includes('silverstone') || trackLocation.includes('brands'))) ||
    (playerNationality === 'american' && (trackLocation.includes('usa') || trackLocation.includes('austin'))) ||
    (playerNationality === 'italian' && (trackLocation.includes('monza') || trackLocation.includes('imola')))
  )
  
  // THEME 3: STRATEGY (Momentum & Deltas)
  // Track gap history for delta calculation
  if (context.currentLap > 0 && context.gapAhead !== undefined) {
    const lastEntry = state.gapHistory[state.gapHistory.length - 1]
    if (!lastEntry || lastEntry.lap !== context.currentLap) {
      state.gapHistory.push({
        lap: context.currentLap,
        gapAhead: context.gapAhead,
        gapBehind: context.gapBehind || 99
      })
      // Keep only last 5 entries
      if (state.gapHistory.length > 5) state.gapHistory.shift()
    }
  }
  
  const momentum = calculateMomentumStatus(state.gapHistory)
  context.momentumStatus = momentum.status
  context.gapDelta3Laps = momentum.delta
  context.gapClosingRate = momentum.delta / 3 // Seconds gained/lost per lap over 3 laps
  
  // Calculate position stability
  if (state.positionHistory.length >= 5) {
    const recentPositions = state.positionHistory.slice(-5).map(h => h.position)
    const posChanged = new Set(recentPositions).size > 1
    const tightGaps = (context.gapAhead || 99) < 2 && (context.gapBehind || 99) < 2
    
    if (!posChanged && tightGaps) {
      context.positionStability = 'stuck'
    } else if ((context.gapBehind || 99) < 0.8 && context.momentumStatus === 'falling_back') {
      context.positionStability = 'vulnerable'
    } else if ((context.gapAhead || 99) > 5 && (context.gapBehind || 99) > 5) {
      context.positionStability = 'clear'
    }
  }

  // Track lap times for consistency
  if (player.lastLapTime && player.lastLapTime > 0) {
    const lastRecorded = state.recentLapTimes[state.recentLapTimes.length - 1]
    if (lastRecorded !== player.lastLapTime) {
      state.recentLapTimes.push(player.lastLapTime)
      if (state.recentLapTimes.length > 5) state.recentLapTimes.shift()
    }
  }
  context.consistencyRating = calculateConsistency(state.recentLapTimes)
  if (state.recentLapTimes.length > 0) {
    context.averageLapTime = state.recentLapTimes.reduce((a, b) => a + b, 0) / state.recentLapTimes.length
  }
  
  // THEME 4: EXPECTATION (Team Baseline)
  const teamName = state.careerData?.teamName || session?.carName
  context.teamTier = teamName ? (TEAM_TIERS[teamName] || 'midfield') : 'midfield'
  context.expectedPosition = calculateExpectedPosition(teamName, state.careerData?.reputation, participants.length)
  
  if (context.playerPosition < context.expectedPosition - 2) {
    context.performanceVsExpectation = 'overachieving'
  } else if (context.playerPosition > context.expectedPosition + 2) {
    context.performanceVsExpectation = 'underachieving'
  } else {
    context.performanceVsExpectation = 'meeting'
  }
  
  // THEME 5: RACE PHASE
  context.racePhase = calculateRacePhase(context.currentLap, context.totalLaps)
  context.lapProgress = context.totalLaps > 0 ? context.currentLap / context.totalLaps : 0
  
  // THEME 6: PSYCHOLOGY (Pressure)
  // Track consecutive laps under attack
  if (context.gapBehind !== undefined && context.gapBehind < 1.5) {
    state.underPressureLaps++
  } else {
    state.underPressureLaps = Math.max(0, state.underPressureLaps - 1)
  }
  context.underAttackLaps = state.underPressureLaps
  context.pressureLevel = calculatePressureLevel(
    context.gapBehind, 
    context.racePhase || 'management',
    state.underPressureLaps,
    context.playerPosition
  )

  // Calculate pressure stability
  if (state.underPressureLaps >= 3) {
    // If the gap behind is shrinking (momentum status is falling_back relative to the gap behind)
    // Wait, context.momentumStatus is for the gap AHEAD. 
    // I need momentum relative to the car BEHIND.
    const behindMomentum = calculateMomentumStatus(state.gapHistory.map(h => ({ lap: h.lap, gapAhead: h.gapBehind || 99 })))
    if (behindMomentum.status === 'catching') { // Car behind is catching
      context.pressureStability = 'cracking'
    } else if (behindMomentum.status === 'falling_back' || behindMomentum.status === 'stable') {
      context.pressureStability = 'firm'
    } else {
      context.pressureStability = 'stable'
    }
  } else {
    context.pressureStability = 'stable'
  }
  
  // THEME 9: TRACK HISTORY (Historical performance at this track)
  // Look up track history from career data using normalized track name
  const trackName = (session?.trackName || 'Unknown Track').toLowerCase()
  const allTrackHistory = (state.careerData as any)?.allTrackHistory || {}
  
  // Try to find a matching track in history (handle variations in naming)
  let matchedTrackHistory = null
  for (const [historyTrackId, history] of Object.entries(allTrackHistory)) {
    const historyTrackName = (history as any)?.trackName?.toLowerCase() || historyTrackId.toLowerCase()
    // Match if track names contain each other or IDs match
    if (trackName.includes(historyTrackName) || historyTrackName.includes(trackName) ||
        trackName.includes(historyTrackId) || historyTrackId.includes(trackName.replace(/\s+/g, '_'))) {
      matchedTrackHistory = history
      break
    }
  }
  
  if (matchedTrackHistory) {
    const th = matchedTrackHistory as any
    context.trackHistory = {
      visits: th.visits || 0,
      wins: th.wins || 0,
      podiums: th.podiums || 0,
      poles: th.poles || 0,
      fastestLaps: th.fastestLaps || 0,
      consecutiveWins: th.consecutiveWins || 0,
      maxConsecutiveWins: th.maxConsecutiveWins || 0,
      bestFinish: th.bestFinish || 99,
      avgFinish: th.avgFinish || 99,
      lastVisitYear: th.lastVisitYear || 0,
      firstVisitYear: th.firstVisitYear || 0,
      dnfs: th.dnfs || 0
    }
    
    // Derive track status flags
    context.isTrackDominator = context.trackHistory.wins >= 3
    context.hasWinningStreak = context.trackHistory.consecutiveWins >= 2
    context.isTrackNightmare = 
      (context.trackHistory.dnfs / (context.trackHistory.visits || 1)) > 0.5 || 
      context.trackHistory.avgFinish > 15
    context.isTrackDebut = false
    
    // Log when we have interesting track history (occasionally)
    if (Math.random() < 0.01 && context.trackHistory.visits > 0) {
      console.log(`[Commentary] Track History for ${trackName}: ${context.trackHistory.visits} visits, ${context.trackHistory.wins} wins`)
    }
  } else {
    // No history = track debut
    context.isTrackDebut = true
    context.isTrackDominator = false
    context.hasWinningStreak = false
    context.isTrackNightmare = false
    
    if (Math.random() < 0.01) {
      console.log(`[Commentary] Track debut at ${trackName}`)
    }
  }
  
  // Track session changes
  if (state.currentSessionType !== sessionType && sessionType) {
    const previousSession = state.currentSessionType
    
    // Log session change to debug panel
    telemetryLog.sessionChange(previousSession || 'None', sessionType)
    
    // Reset session-specific state (time warnings, phase, etc.)
    resetSessionState()
    
    // SAVE SESSION MEMORY when transitioning FROM Qualifying TO Race
    if (previousSession === 'Qualifying' && sessionType === 'Race') {
      console.log('[Commentary] Transitioning from Qualifying to Race - saving session memory')
      state.sessionMemory.qualifyingPosition = state.lastPosition
      state.sessionMemory.gridPosition = state.lastPosition // Grid = final quali position
      
      // CREW CHIEF: Clear audio queue before announcing qualifying complete
      // This ensures no stale qualifying events play during the race
      clearQueue()
      console.log('[Commentary] Cleared queue for Qualifying -> Race transition')
      
      // Fire QUALI_COMPLETE event to announce the result
      telemetryLog.actionCheck('QUALI_COMPLETE', true, 
        `Qualifying ended! Grid P${state.lastPosition}`,
        { gridPosition: state.lastPosition, bestLapTime: player.bestLapTime }
      )
      
      // Queue the qualifying complete announcement (high priority, plays immediately)
      queueEvent({
        type: 'SESSION_END',
        context: {
          ...context,
          sessionType: 'Qualifying',
          playerPosition: state.lastPosition,
          gridPosition: state.lastPosition
        },
        priority: 'high',
        timestamp: Date.now()
      })
      
      if (state.averageBestTime > 0 && player.bestLapTime > 0) {
        state.sessionMemory.qualifyingGapToPole = (player.bestLapTime - (session?.bestLapTime || player.bestLapTime)) || 0
        state.sessionMemory.qualifyingTime = player.bestLapTime
        state.sessionMemory.fieldAverageQualiTime = state.averageBestTime
        
        // Calculate car competitiveness from qualifying gaps
        const gapToAverage = player.bestLapTime - state.averageBestTime
        if (gapToAverage < -0.5) {
          state.sessionMemory.carCompetitiveness = 'front-runner'
        } else if (gapToAverage < -0.2) {
          state.sessionMemory.carCompetitiveness = 'competitive'
        } else if (gapToAverage < 0.3) {
          state.sessionMemory.carCompetitiveness = 'midfield'
        } else if (gapToAverage < 0.8) {
          state.sessionMemory.carCompetitiveness = 'struggling'
        } else {
          state.sessionMemory.carCompetitiveness = 'backmarker'
        }
        console.log('[Commentary] Session Memory saved:', state.sessionMemory)
      }
    }
    
    // SAVE Practice data when transitioning FROM Practice TO Qualifying
    if (previousSession === 'Practice' && sessionType === 'Qualifying') {
      console.log('[Commentary] Transitioning from Practice to Qualifying - saving practice data')
      state.sessionMemory.practicePosition = state.lastPosition
      state.sessionMemory.practiceBestTime = player.bestLapTime || 0
    }
    
    // Reset race finish flag when starting a new session
    if (sessionType === 'Race') {
      state.sessionMemory.raceFinished = false
      state.sessionMemory.finalRacePosition = undefined
      // Reset narrative memory for fresh race story
      state.narrativeMemory = createNarrativeMemory()
      console.log('[Commentary] New race session - narrative memory reset')
    }
    
    state.currentSessionType = sessionType
    state.sessionStarted = false
    state.sessionStartedAt = 0
    state.raceStarted = false
    state.announcedFinalLaps = false
    state.announcedHalfway = false
    state.lastLap = 0
    // Reset tracking for new session
    state.positionHistory = []
    state.recentLapTimes = []
    state.underPressureLaps = 0
    state.positionAtRaceStart = 0
    state.announcedPoorStart = false
    state.announcedGreatStart = false
    // Clear recent commentary lines (for anti-repetition)
    clearRecentLines()
  }
  
  // ===== ADD SESSION MEMORY TO CONTEXT =====
  // This allows prompts to reference quali position, grid position, etc.
  if (sessionType === 'Race' && state.sessionMemory.gridPosition) {
    context.qualifyingPosition = state.sessionMemory.qualifyingPosition
    context.gridPosition = state.sessionMemory.gridPosition
    context.qualifyingGapToPole = state.sessionMemory.qualifyingGapToPole
    context.carCompetitiveness = state.sessionMemory.carCompetitiveness
    
    // Calculate positions gained/lost from grid
    const positionsFromGrid = state.sessionMemory.gridPosition - context.playerPosition
    context.positionsGainedFromGrid = positionsFromGrid
    
    // Flag disaster or success starts
    if (positionsFromGrid <= -5) {
      context.startDisaster = true
    } else if (positionsFromGrid >= 3) {
      context.startSuccess = true
    }
  }
  
  // ===== ADD NARRATIVE MEMORY TO CONTEXT =====
  // Pass race story so far for callbacks and continuity
  if (sessionType === 'Race') {
    context.narrativeMemory = state.narrativeMemory
    
    // Update highest/lowest position tracking
    if (!state.narrativeMemory.lowestPosition || context.playerPosition > state.narrativeMemory.lowestPosition.position) {
      state.narrativeMemory.lowestPosition = { lap: context.currentLap, position: context.playerPosition }
    }
    if (!state.narrativeMemory.highestPosition || context.playerPosition < state.narrativeMemory.highestPosition.position) {
      state.narrativeMemory.highestPosition = { lap: context.currentLap, position: context.playerPosition }
    }
    
    // Detect recovery drive narrative
    const lowestPos = state.narrativeMemory.lowestPosition?.position || 0
    const currentPos = context.playerPosition
    if (lowestPos > 0 && lowestPos - currentPos >= 5) {
      state.narrativeMemory.isRecoveryDrive = true
    }
  }
  
  // RACE FINISH DETECTION - Stop commentary when race ends
  if (sessionType === 'Race' && !state.sessionMemory.raceFinished) {
    const raceStateStr = context.raceState
    if (raceStateStr === 'Finished' || raceStateStr === 'DNF' || raceStateStr === 'Retired' || raceStateStr === 'Disqualified') {
      console.log('[Commentary] Race finished detected! State:', raceStateStr, 'Position:', context.playerPosition)
      
      // Log the race completion to telemetry
      telemetryLog.actionCheck('RACE_COMPLETE', true, 
        `Race ended! P${context.playerPosition} - ${raceStateStr}`,
        { position: context.playerPosition, state: raceStateStr, gridPosition: state.sessionMemory.gridPosition }
      )
      telemetryLog.raceFinished(context.playerPosition, raceStateStr)
      
      state.sessionMemory.raceFinished = true
      state.sessionMemory.finalRacePosition = context.playerPosition
      
      // Determine the right event type (position must be valid and not retired/DNF)
      let eventType: CommentaryEventType = 'RACE_FINISH'
      if (context.playerPosition === 1 && raceStateStr === 'Finished') {
        eventType = 'RACE_WIN'
      } else if (context.playerPosition > 0 && context.playerPosition <= 3 && raceStateStr === 'Finished') {
        eventType = 'PODIUM_FINISH'
      }
      
      // Fire the race finish event with full context
      const finishContext = {
        ...context,
        sessionType: 'Race' as const,
        qualifyingPosition: state.sessionMemory.qualifyingPosition,
        gridPosition: state.sessionMemory.gridPosition,
        raceState: raceStateStr,
        // Calculate positions gained/lost from grid
        positionsGainedFromGrid: state.sessionMemory.gridPosition 
          ? state.sessionMemory.gridPosition - context.playerPosition 
          : undefined
      }
      
      const finalEvent: CommentaryEvent = {
        type: eventType,
        context: finishContext,
        priority: 'high',
        timestamp: Date.now()
      }
      
      console.log('[Commentary] Queueing race finish event:', eventType, 'Position:', context.playerPosition)
      queueEvent(finalEvent)
      
      // Mark all narrative callbacks as mentioned (they're used in the finish commentary)
      state.narrativeMemory.mentionedPoorStart = true
      state.narrativeMemory.mentionedGreatStart = true
      state.narrativeMemory.mentionedRecovery = true
      state.narrativeMemory.mentionedFastestLap = true
      console.log('[Narrative] Marked all callbacks as mentioned for finish commentary')
      
      return // Stop processing - race is over
    }
  }
  
  // Skip all processing if race is finished
  if (state.sessionMemory.raceFinished) {
    return
  }
  
  // === NEW: Telemetry-driven event detection (runs in all sessions) ===
  // These use real data from AMS2 shared memory instead of random triggers
  const telemetryEvents: CommentaryEvent[] = []
  
  // Detect rival events (fastest laps, pitting, retirements)
  detectRivalEvents(context, participants, telemetryEvents)
  
  // Detect collision events
  detectCollisionEvents(context, session, participants, telemetryEvents)
  
  // Detect spinning/offtrack
  detectCrashStateEvents(context, session, telemetryEvents)
  
  // Detect damage
  detectDamageEvents(context, session, telemetryEvents)
  
  // Detect yellow flag / safety car
  detectYellowFlagEvents(context, session, telemetryEvents)
  
  // === NEW: Session phase and time warning detection (like Crew Chief) ===
  // Detect session time warnings (5min, 1min, 30sec)
  detectSessionPhaseEvents(context, session, participants, telemetryEvents)
  
  // Detect session best changes (P1 stolen in quali)
  detectSessionBestEvents(context, session, participants, telemetryEvents)
  
  // === NEW: Crew Chief-style enhanced detections ===
  // Gap to leader tracking (like Crew Chief Timings.cs)
  detectGapToLeaderEvents(context, sortedParticipants, telemetryEvents)
  
  // Weather change detection (like Crew Chief ConditionsMonitor.cs)
  detectWeatherChangeEvents(context, session, telemetryEvents)
  
  // Enhanced damage detection (like Crew Chief DamageReporting.cs)
  detectEnhancedDamageEvents(context, session, telemetryEvents)
  
  // Sector purple detection (like Crew Chief LapTimes.cs)
  detectSectorPurpleEvents(context, session, sortedParticipants, telemetryEvents)
  
  // DRS availability detection (like Crew Chief FlagsMonitor.cs)
  detectDrsEvents(context, session, telemetryEvents)
  
  // Blue flag persistence tracking
  detectBlueFlagEvents(context, session, telemetryEvents)
  
  // Position trend detection (like Crew Chief Position.cs)
  detectPositionTrendEvents(context, telemetryEvents)
  
  // === NEW: Authentic TV Broadcast Events ===
  // Strategy speculation based on pit stops
  detectStrategyEvents(context, sortedParticipants, telemetryEvents)
  
  // Crowd reactions for exciting moments
  detectCrowdEvents(context, telemetryEvents)
  
  // Post-race commentary detection
  detectPostRaceEvents(context, telemetryEvents)
  
  // Queue all detected telemetry events
  telemetryEvents.forEach(event => queueEvent(event))
  
  // Detect events based on session type
  if (sessionType === 'Practice' || sessionType === 'Test') {
    detectPracticeEvents(context, session)
  } else if (sessionType === 'Qualifying') {
    detectQualifyingEvents(context, session)
  } else if (sessionType === 'Race') {
    detectRaceEvents(context, sortedParticipants, playerIdx, session)
  }
  
  // Color commentary can happen in any session
  maybeAddColorCommentary(context)
  
  // Update queue manager with current telemetry for context refresh
  queueManager.updateTelemetry({
    playerPosition: context.playerPosition,
    currentLap: context.currentLap,
    totalLaps: context.totalLaps,
    gapAhead: context.gapAhead,
    gapBehind: context.gapBehind,
    trackName: context.trackName,
    sessionType: context.sessionType,
    raceState: context.raceState
  })
  
  // Update state for next comparison
  state.lastPosition = context.playerPosition
  state.lastLap = context.currentLap
  state.lastBestLap = context.bestLapTime || 0
  state.lastGapAhead = context.gapAhead || 999
  state.lastGapBehind = context.gapBehind || 999
  state.lastPlayerPitMode = context.pitMode ?? 0
}

/**
 * Map session type string to our enum
 */
function mapSessionType(sessionType: string | undefined): EventContext['sessionType'] {
  if (!sessionType) return undefined
  const lower = sessionType.toLowerCase()
  if (lower.includes('practice') || lower.includes('test')) return 'Practice'
  if (lower.includes('quali')) return 'Qualifying'
  if (lower.includes('race')) return 'Race'
  return undefined
}

/**
 * Detect practice session events
 */
function detectPracticeEvents(context: EventContext, session: any): void {
  const events: CommentaryEvent[] = []
  
  // Flags (announce on change only)
  detectFlagEvents(context, events)
  
  // Session start
  if (!state.sessionStarted && context.raceState === 'Racing') {
    state.sessionStarted = true
    state.sessionStartedAt = Date.now()
    console.log('[Commentary] Practice session started - warmup period active for', SESSION_WARMUP_MS, 'ms')
    events.push({
      type: 'SESSION_START',
      context: { ...context, sessionType: 'Practice' },
      priority: 'high',
      timestamp: Date.now()
    })
  }
  
  // Improvement on personal best
  if (context.bestLapTime && 
      state.lastBestLap > 0 && 
      context.bestLapTime < state.lastBestLap && 
      !isOnCooldown('PRACTICE_IMPROVEMENT')) {
    events.push({
      type: 'PRACTICE_IMPROVEMENT',
      context,
      priority: 'medium',
      timestamp: Date.now()
    })
    markEventTriggered('PRACTICE_IMPROVEMENT')
  }
  
  // ===== PRACTICE-SPECIFIC EVENTS (NEW) =====
  detectPracticeQualiSpecificEvents(context, events)
  
  events.forEach(event => queueEvent(event))
}

/**
 * Detect qualifying session events
 */
function detectQualifyingEvents(context: EventContext, session: any): void {
  const events: CommentaryEvent[] = []
  const now = Date.now()
  
  // Flags (announce on change only)
  detectFlagEvents(context, events)
  
  // Session start
  if (!state.sessionStarted && context.raceState === 'Racing') {
    state.sessionStarted = true
    state.sessionStartedAt = now
    console.log('[Commentary] Qualifying session started - warmup period active for', SESSION_WARMUP_MS, 'ms')
    events.push({
      type: 'SESSION_START',
      context: { ...context, sessionType: 'Qualifying' },
      priority: 'high',
      timestamp: now
    })
  }
  
  // === QUALIFYING TELEMETRY LOGGING ===
  // Log lap time data every 10 seconds so we can debug
  const shouldLogQualiData = now - (state.lastQualiLogTime || 0) > 10000
  if (shouldLogQualiData) {
    state.lastQualiLogTime = now
    telemetryLog.actionCheck('QUALI_STATUS', false, 
      `P${context.playerPosition} | Best: ${context.bestLapTime?.toFixed(3) || 'none'} | Last tracked: ${state.lastBestLap?.toFixed(3) || 'none'} | Lap: ${context.currentLap}`,
      { 
        position: context.playerPosition,
        bestLapTime: context.bestLapTime,
        lastTrackedBest: state.lastBestLap,
        currentLap: context.currentLap,
        playerState: state.playerActivityState
      }
    )
  }
  
  // Personal best in quali (hot lap)
  const qualiPBConditions = context.bestLapTime && 
      state.lastBestLap > 0 && 
      context.bestLapTime < state.lastBestLap
  const qualiOnCooldown = isOnCooldown('QUALIFYING_ATTEMPT')
  
  if (qualiPBConditions && !qualiOnCooldown) {
    telemetryLog.actionCheck('QUALIFYING_PB', true, 
      `New best! ${context.bestLapTime?.toFixed(3)}s (was ${state.lastBestLap?.toFixed(3)}s) -> P${context.playerPosition}`,
      { newTime: context.bestLapTime, oldTime: state.lastBestLap, position: context.playerPosition }
    )
    
    // Check if this puts us on pole or front row
    if (context.playerPosition === 1) {
      events.push({
        type: 'POLE_POSITION',
        context,
        priority: 'high',
        timestamp: now
      })
    } else if (context.playerPosition <= 3) {
      events.push({
        type: 'FRONT_ROW',
        context,
        priority: 'high',
        timestamp: now
      })
    } else {
      events.push({
        type: 'QUALIFYING_ATTEMPT',
        context,
        priority: 'medium',
        timestamp: now
      })
    }
    markEventTriggered('QUALIFYING_ATTEMPT')
  } else if (qualiPBConditions && qualiOnCooldown) {
    telemetryLog.actionCheck('QUALIFYING_PB', false, 'On cooldown',
      { newTime: context.bestLapTime, oldTime: state.lastBestLap }
    )
  }
  
  // ===== QUALIFYING-SPECIFIC EVENTS (NEW) =====
  detectPracticeQualiSpecificEvents(context, events)
  
  events.forEach(event => queueEvent(event))
}

// ============================================================================
// TELEMETRY-DRIVEN EVENT DETECTION (NEW)
// These detect REAL events from actual telemetry data instead of random triggers
// ============================================================================

/**
 * Detect rival events from participant data (pitting, retiring, fastest laps)
 * Called every telemetry update to track actual changes
 */
function detectRivalEvents(context: EventContext, participants: any[], events: CommentaryEvent[]): void {
  const now = Date.now()
  
  // Track rivals' fastest lap times and detect real improvements
  for (const p of participants) {
    if (p.isPlayer || !p.name || p.name.trim() === '') continue
    
    // Detect rival fastest lap improvement
    if (p.fastestLapTime && p.fastestLapTime > 0) {
      const prevBest = state.rivalBestTimes.get(p.name) || 999
      if (p.fastestLapTime < prevBest - 0.1) { // Must improve by at least 0.1s
        state.rivalBestTimes.set(p.name, p.fastestLapTime)
        
        // Only announce if this is not the first lap time recorded
        if (prevBest < 900 && !isOnCooldown('RIVAL_FASTEST_LAP')) {
          events.push({
            type: 'RIVAL_FASTEST_LAP',
            context: { ...context, rivalFastestLapName: p.name, rivalFastestLapTime: p.fastestLapTime },
            priority: 'medium',
            timestamp: now
          })
          markEventTriggered('RIVAL_FASTEST_LAP')
        }
      }
    }
    
    // Detect rival pit entry/exit
    const wasPitting = state.rivalsInPits.has(p.name)
    const isPitting = p.pitMode === 2 // PIT_MODE_IN_PIT
    
    if (isPitting && !wasPitting && !isOnCooldown('RIVAL_PIT_ENTRY')) {
      state.rivalsInPits.add(p.name)
      events.push({
        type: 'RIVAL_PIT_ENTRY',
        context: { ...context, rivalPittingName: p.name },
        priority: 'low',
        timestamp: now
      })
      markEventTriggered('RIVAL_PIT_ENTRY')
    } else if (!isPitting && wasPitting) {
      state.rivalsInPits.delete(p.name)
      // Don't announce pit exit as frequently - less important
    }
    
    // Detect rival retirement/DNF
    const wasRetired = state.rivalsRetired.has(p.name)
    const isRetired = p.raceState === 5 || p.raceState === 6 // RETIRED or DNF
    
    if (isRetired && !wasRetired && !isOnCooldown('RIVAL_RETIRED')) {
      state.rivalsRetired.add(p.name)
      events.push({
        type: 'RIVAL_RETIRED',
        context: { ...context, rivalRetiredName: p.name },
        priority: 'medium',
        timestamp: now
      })
      markEventTriggered('RIVAL_RETIRED')
    }
  }
}

/**
 * Detect collision events from telemetry
 */
function detectCollisionEvents(context: EventContext, session: any, participants: any[], events: CommentaryEvent[]): void {
  const now = Date.now()
  
  const collisionMagnitude = session?.lastOpponentCollisionMagnitude || 0
  const collisionIndex = session?.lastOpponentCollisionIndex ?? -1
  
  // Detect new collision (magnitude > threshold and different from last)
  if (collisionMagnitude > 0.5 && // Significant impact
      collisionMagnitude !== state.lastCollisionMagnitude &&
      now - state.lastCollisionTime > 3000 && // At least 3s since last collision
      !isOnCooldown('CONTACT_DETECTED')) {
    
    // Find who we hit
    let opponentName = 'another car'
    if (collisionIndex >= 0 && collisionIndex < participants.length) {
      const opponent = participants.find((p, i) => i === collisionIndex || p.carIndex === collisionIndex)
      if (opponent?.name) {
        opponentName = opponent.name
      }
    }
    
    events.push({
      type: 'CONTACT_DETECTED',
      context: { 
        ...context, 
        lastCollisionMagnitude: collisionMagnitude,
        lastCollisionOpponentName: opponentName
      },
      priority: 'high',
      timestamp: now
    })
    markEventTriggered('CONTACT_DETECTED')
    state.lastCollisionTime = now
  }
  
  state.lastCollisionMagnitude = collisionMagnitude
}

/**
 * Detect crash/spin events from crash state
 */
function detectCrashStateEvents(context: EventContext, session: any, events: CommentaryEvent[]): void {
  const now = Date.now()
  
  const crashState = session?.crashState || 0
  // CrashState: 0=none, 1=offtrack, 2=large_prop, 3=spinning, 4=rolling
  
  // Detect spinning
  if (crashState === 3 && state.lastCrashState !== 3 && !isOnCooldown('PLAYER_SPINNING')) {
    events.push({
      type: 'PLAYER_SPINNING',
      context: { ...context, crashState },
      priority: 'high',
      timestamp: now
    })
    markEventTriggered('PLAYER_SPINNING')
  }
  
  // Detect off-track
  if (crashState === 1 && state.lastCrashState !== 1 && !isOnCooldown('PLAYER_OFFTRACK')) {
    events.push({
      type: 'PLAYER_OFFTRACK',
      context: { ...context, crashState },
      priority: 'medium',
      timestamp: now
    })
    markEventTriggered('PLAYER_OFFTRACK')
  }
  
  state.lastCrashState = crashState
}

/**
 * Detect damage events from damage values
 */
function detectDamageEvents(context: EventContext, session: any, events: CommentaryEvent[]): void {
  const now = Date.now()
  
  const aeroDamage = session?.aeroDamage || 0
  const engineDamage = session?.engineDamage || 0
  
  // Aero damage report (> 20% damage)
  if (aeroDamage > 0.2 && !isOnCooldown('AERO_DAMAGE')) {
    events.push({
      type: 'AERO_DAMAGE',
      context: { ...context, aeroDamage },
      priority: 'medium',
      timestamp: now
    })
    markEventTriggered('AERO_DAMAGE')
  }
  
  // Engine warning (> 30% damage)
  if (engineDamage > 0.3 && !isOnCooldown('ENGINE_WARNING')) {
    events.push({
      type: 'ENGINE_WARNING',
      context: { ...context, engineDamage },
      priority: 'medium',
      timestamp: now
    })
    markEventTriggered('ENGINE_WARNING')
  }
}

/**
 * Detect yellow flag / safety car events
 */
function detectYellowFlagEvents(context: EventContext, session: any, events: CommentaryEvent[]): void {
  const now = Date.now()
  
  const yellowFlagState = session?.yellowFlagState || 0
  // YellowFlagState: 0=none, 1=pending, 2-5=various FCY phases, 6=last_lap, 7=resume, 8=halt
  
  // Detect FCY deployment (state changes from 0 to 1-5)
  if (yellowFlagState >= 1 && yellowFlagState <= 5 && 
      state.lastYellowFlagState === 0 && 
      !isOnCooldown('FCY_DEPLOYED')) {
    events.push({
      type: 'FCY_DEPLOYED',
      context: { ...context, yellowFlagState },
      priority: 'high',
      timestamp: now
    })
    markEventTriggered('FCY_DEPLOYED')
  }
  
  // Detect FCY ending (state changes to 7=resume or back to 0)
  if ((yellowFlagState === 7 || yellowFlagState === 0) && 
      state.lastYellowFlagState >= 1 && state.lastYellowFlagState <= 5 &&
      !isOnCooldown('FCY_ENDING')) {
    events.push({
      type: 'FCY_ENDING',
      context: { ...context, yellowFlagState },
      priority: 'high',
      timestamp: now
    })
    markEventTriggered('FCY_ENDING')
  }
  
  state.lastYellowFlagState = yellowFlagState
}

/**
 * Calculate the current session phase (like Crew Chief's mapToSessionPhase)
 * This provides accurate phase tracking for practice/qualifying/race
 */
function calculateSessionPhase(
  sessionType: string | undefined,
  raceState: string | undefined,
  gameState: string | undefined,
  timeRemaining: number,
  pitMode: number | undefined,
  yellowFlagState: number,
  playerSpeed: number
): SessionPhase {
  // Check for FCY first (applies to all sessions)
  if (yellowFlagState >= 1 && yellowFlagState <= 5) {
    return 'FullCourseYellow'
  }
  
  // Race session phases
  if (sessionType === 'Race') {
    if (raceState === 'Not Started') {
      if (gameState === 'Ingame In Menu') {
        return 'Garage'
      } else if (pitMode === 4) { // PIT_MODE_IN_GARAGE
        return 'Garage'
      }
      return 'Countdown'
    } else if (raceState === 'Racing') {
      return 'Green'
    } else if (raceState === 'Finished' || raceState === 'DNF' || raceState === 'Retired' || raceState === 'Disqualified') {
      return 'Finished'
    }
  }
  
  // Practice/Qualifying phases
  if (sessionType === 'Practice' || sessionType === 'Qualifying' || sessionType === 'Test') {
    if (raceState === 'Not Started') {
      return 'Garage'
    }
    
    // Check if time has run out
    if (timeRemaining >= 0 && timeRemaining <= 0.5) {
      // Time is up - check if player is still on a flying lap
      if (playerSpeed > 5) {
        return 'Checkered' // Still driving, complete your lap!
      }
      return 'Finished'
    }
    
    if (raceState === 'Racing') {
      return 'Green'
    }
    
    if (raceState === 'Finished') {
      return 'Finished'
    }
  }
  
  return 'Unavailable'
}

/**
 * Detect session time warnings and phase transitions
 * This is the key function for proper practice/qualifying flow
 */
function detectSessionPhaseEvents(
  context: EventContext, 
  session: any, 
  participants: any[],
  events: CommentaryEvent[]
): void {
  const now = Date.now()
  const timeRemaining = session?.timeRemaining || -1
  const playerSpeed = session?.speed || 0
  const sessionType = context.sessionType
  
  // Only track time for timed sessions (Practice/Qualifying)
  if (sessionType !== 'Practice' && sessionType !== 'Qualifying') {
    return
  }
  
  // Calculate current session phase
  const newPhase = calculateSessionPhase(
    sessionType,
    context.raceState,
    session?.sessionState,
    timeRemaining,
    context.pitMode,
    session?.yellowFlagState || 0,
    playerSpeed
  )
  
  // Detect phase transitions
  if (newPhase !== state.sessionPhase) {
    console.log(`[Commentary] Session phase: ${state.sessionPhase} -> ${newPhase}`)
    telemetryLog.phaseTransition(state.sessionPhase || 'None', newPhase)
    
    // Checkered flag for timed session (time up, complete your lap!)
    if (newPhase === 'Checkered' && !state.announcedSessionCheckered) {
      events.push({
        type: 'SESSION_CHECKERED',
        context: { ...context, sessionPhase: newPhase },
        priority: 'high',
        timestamp: now
      })
      state.announcedSessionCheckered = true
    }
    
    // Session finished
    if (newPhase === 'Finished' && !state.announcedSessionComplete) {
      const eventType = sessionType === 'Qualifying' ? 'QUALI_COMPLETE' : 'PRACTICE_COMPLETE'
      
      // Check final position for qualifying
      if (sessionType === 'Qualifying') {
        telemetryLog.qualiComplete(context.playerPosition)
        if (context.playerPosition === 1) {
          events.push({
            type: 'QUALI_P1_SECURED',
            context,
            priority: 'high',
            timestamp: now
          })
        } else if (context.playerPosition <= 3) {
          events.push({
            type: 'QUALI_FRONT_ROW_SECURED',
            context,
            priority: 'high',
            timestamp: now
          })
        }
      } else {
        telemetryLog.practiceComplete()
      }
      
      events.push({
        type: eventType,
        context,
        priority: 'high',
        timestamp: now
      })
      state.announcedSessionComplete = true
    }
    
    state.sessionPhase = newPhase
  }
  
  // Time warnings (only when session is Green and time is decreasing)
  if (newPhase === 'Green' && timeRemaining > 0 && state.lastTimeRemaining > 0) {
    // 5 minute warning
    if (timeRemaining <= 300 && state.lastTimeRemaining > 300 && !state.announced5MinWarning) {
      events.push({
        type: 'SESSION_TIME_5MIN',
        context: { ...context, timeRemaining },
        priority: 'medium',
        timestamp: now
      })
      state.announced5MinWarning = true
    }
    
    // 1 minute warning
    if (timeRemaining <= 60 && state.lastTimeRemaining > 60 && !state.announced1MinWarning) {
      events.push({
        type: 'SESSION_TIME_1MIN',
        context: { ...context, timeRemaining },
        priority: 'high',
        timestamp: now
      })
      state.announced1MinWarning = true
    }
    
    // 30 second warning
    if (timeRemaining <= 30 && state.lastTimeRemaining > 30 && !state.announced30SecWarning) {
      events.push({
        type: 'SESSION_TIME_30SEC',
        context: { ...context, timeRemaining },
        priority: 'high',
        timestamp: now
      })
      state.announced30SecWarning = true
    }
  }
  
  state.lastTimeRemaining = timeRemaining
}

/**
 * Detect session best lap changes (someone stealing P1 in quali)
 */
function detectSessionBestEvents(
  context: EventContext,
  session: any,
  participants: any[],
  events: CommentaryEvent[]
): void {
  const now = Date.now()
  const sessionType = context.sessionType
  
  // Only track for timed sessions
  if (sessionType !== 'Practice' && sessionType !== 'Qualifying') {
    return
  }
  
  // Track overall session best
  let currentOverallBest = state.overallSessionBest
  let currentOverallBestDriver = state.overallSessionBestDriver
  
  for (const p of participants) {
    if (p.fastestLapTime && p.fastestLapTime > 0) {
      if (currentOverallBest < 0 || p.fastestLapTime < currentOverallBest) {
        currentOverallBest = p.fastestLapTime
        currentOverallBestDriver = getValidDriverName(p.name, 'another driver')
      }
    }
  }
  
  // Update player's session best
  const player = participants.find(p => p.isPlayer)
  if (player?.fastestLapTime && player.fastestLapTime > 0) {
    if (state.playerSessionBest < 0 || player.fastestLapTime < state.playerSessionBest) {
      state.playerSessionBest = player.fastestLapTime
    }
  }
  
  // Detect when someone steals the session best (P1 in quali)
  if (currentOverallBest > 0 && state.lastOverallSessionBest > 0) {
    // Someone improved the overall best
    if (currentOverallBest < state.lastOverallSessionBest - 0.01) {
      const wasPlayersBest = state.overallSessionBestDriver === (player?.name || '')
      const isPlayersBest = currentOverallBestDriver === (player?.name || '')
      
      if (isPlayersBest && !wasPlayersBest) {
        // Player just set session best!
        if (!isOnCooldown('SESSION_BEST_SET')) {
          events.push({
            type: 'SESSION_BEST_SET',
            context: { ...context, overallSessionBest: currentOverallBest },
            priority: 'high',
            timestamp: now
          })
          markEventTriggered('SESSION_BEST_SET')
        }
      } else if (!isPlayersBest && wasPlayersBest) {
        // Someone stole P1 from the player!
        if (!isOnCooldown('SESSION_BEST_STOLEN')) {
          events.push({
            type: 'SESSION_BEST_STOLEN',
            context: { 
              ...context, 
              overallSessionBest: currentOverallBest,
              overallSessionBestDriver: currentOverallBestDriver
            },
            priority: 'high',
            timestamp: now
          })
          markEventTriggered('SESSION_BEST_STOLEN')
        }
      }
    }
  }
  
  state.lastOverallSessionBest = currentOverallBest
  state.overallSessionBest = currentOverallBest
  state.overallSessionBestDriver = currentOverallBestDriver
}

/**
 * Reset session state when session changes
 */
function resetSessionState(): void {
  state.sessionPhase = 'Unavailable'
  state.lastTimeRemaining = -1
  state.announced5MinWarning = false
  state.announced1MinWarning = false
  state.announced30SecWarning = false
  state.announcedSessionCheckered = false
  state.announcedSessionComplete = false
  state.overallSessionBest = -1
  state.overallSessionBestDriver = ''
  state.playerClassSessionBest = -1
  state.playerSessionBest = -1
  state.lastOverallSessionBest = -1
  state.rivalBestTimes.clear()
  state.rivalsInPits.clear()
  state.rivalsRetired.clear()
  
  // Reset Crew Chief-style enhanced tracking
  state.lastGapToLeader = -1
  state.gapToLeaderHistory = []
  state.lastLeaderUpdate = 0
  state.lastRainDensity = 0
  state.lastTrackTemp = 0
  state.weatherChangeAnnounced = 0
  state.lastBrakeDamage = [0, 0, 0, 0]
  state.lastSuspensionDamage = [0, 0, 0, 0]
  state.lastTyreWear = [0, 0, 0, 0]
  state.damageAnnouncementTimes = {}
  state.sessionBestSectors = [-1, -1, -1]
  state.lastSectorTimes = [0, 0, 0]
  state.purpleSectorAnnounced = [false, false, false]
  state.lastDrsState = 0
  state.drsAvailableAnnounced = false
  state.blueFlagStartTime = 0
  state.blueFlagLaps = 0
  state.lastBlueFlagState = false
  state.positionHistory5Laps = []
  state.lastPositionTrendCheck = 0
  
  // Reset authentic TV broadcast tracking
  state.pitStops.clear()
  state.estimatedStrategy.clear()
  state.pitWindowAnnounced = false
  state.lastStrategyUpdate = 0
  state.playerPitLaps = []
  state.lastCrowdReaction = 0
  state.excitingMomentCount = 0
  state.consecutiveCommentaryCount = 0
  state.lastBreathingRoom = 0
  state.raceFinished = false
  state.cooldownLapAnnounced = false
  state.postRaceReflectionAnnounced = false
  state.championshipImplicationsAnnounced = false
  
  console.log('[Commentary] Session state reset (including Crew Chief-style & TV broadcast tracking)')
}

// ============================================================================
// CREW CHIEF-STYLE ENHANCED DETECTION FUNCTIONS
// ============================================================================

/**
 * Detect gap to leader events (like Crew Chief Timings.cs)
 * Tracks gap to P1 and announces when significantly closing/opening
 */
function detectGapToLeaderEvents(
  context: EventContext,
  participants: any[],
  events: CommentaryEvent[]
): void {
  const now = Date.now()
  
  // Only relevant in races with multiple cars
  if (context.sessionType !== 'Race' || participants.length < 2) return
  if (context.playerPosition === 1) return // We ARE the leader
  
  // Find the leader (P1)
  const leader = participants.find(p => p.racePosition === 1)
  if (!leader) return
  
  // Calculate gap to leader using lap data
  // This is approximate - real gap would need track position data
  const player = participants.find(p => p.isPlayer)
  if (!player) return
  
  // Use lap difference + estimated time based on fastest laps
  const lapDiff = leader.lapsCompleted - player.lapsCompleted
  const avgLapTime = context.bestLapTime || 90 // Default 90s lap
  let estimatedGap = lapDiff * avgLapTime
  
  // If same lap, use track position to estimate (rough approximation)
  if (lapDiff === 0 && leader.currentLapDistance && player.currentLapDistance) {
    const distanceDiff = leader.currentLapDistance - player.currentLapDistance
    const trackLength = context.trackName?.includes('Spa') ? 7004 : 5000 // Default track length
    estimatedGap = (distanceDiff / trackLength) * avgLapTime
  }
  
  // Add to context
  context.gapToLeader = Math.abs(estimatedGap)
  context.leaderName = getValidDriverName(leader.name, 'the leader')
  
  // Track gap history for delta calculation
  if (context.currentLap !== state.lastLap) {
    state.gapToLeaderHistory.push(context.gapToLeader)
    if (state.gapToLeaderHistory.length > 5) {
      state.gapToLeaderHistory.shift()
    }
  }
  
  // Calculate gap delta (change over last 3 laps)
  if (state.gapToLeaderHistory.length >= 3) {
    const oldGap = state.gapToLeaderHistory[state.gapToLeaderHistory.length - 3]
    const newGap = context.gapToLeader
    context.gapToLeaderDelta = newGap - oldGap // Negative = catching
    
    // Announce significant gap changes
    if (context.gapToLeaderDelta < -1.5 && !isOnCooldown('LEADER_GAP_CLOSING')) {
      events.push({
        type: 'LEADER_GAP_CLOSING',
        context,
        priority: 'medium',
        timestamp: now
      })
      markEventTriggered('LEADER_GAP_CLOSING')
    } else if (context.gapToLeaderDelta > 2.0 && !isOnCooldown('LEADER_GAP_OPENING')) {
      events.push({
        type: 'LEADER_GAP_OPENING',
        context,
        priority: 'low',
        timestamp: now
      })
      markEventTriggered('LEADER_GAP_OPENING')
    }
  }
  
  // Periodic leader gap update (every 45s max)
  if (now - state.lastLeaderUpdate > 45000 && 
      context.gapToLeader > 5 && // Only if not right behind
      !isOnCooldown('GAP_TO_LEADER_UPDATE') &&
      Math.random() < 0.3) { // 30% chance when due
    events.push({
      type: 'GAP_TO_LEADER_UPDATE',
      context,
      priority: 'low',
      timestamp: now
    })
    markEventTriggered('GAP_TO_LEADER_UPDATE')
    state.lastLeaderUpdate = now
  }
  
  state.lastGapToLeader = context.gapToLeader
}

/**
 * Detect weather change events (like Crew Chief ConditionsMonitor.cs)
 */
function detectWeatherChangeEvents(
  context: EventContext,
  session: any,
  events: CommentaryEvent[]
): void {
  const now = Date.now()
  
  const currentRain = session?.rainDensity || 0
  const currentTrackTemp = session?.trackTemp || session?.trackTemperature || 0
  
  // Detect rain changes
  if (state.lastRainDensity >= 0) {
    const rainDelta = currentRain - state.lastRainDensity
    
    // Rain incoming (increasing by more than 0.1)
    if (rainDelta > 0.15 && !isOnCooldown('RAIN_INCOMING')) {
      context.previousRainDensity = state.lastRainDensity
      context.weatherTrend = 'worsening'
      events.push({
        type: 'RAIN_INCOMING',
        context,
        priority: 'high',
        timestamp: now
      })
      markEventTriggered('RAIN_INCOMING')
      state.weatherChangeAnnounced = now
    }
    
    // Rain stopping (decreasing by more than 0.15)
    if (rainDelta < -0.15 && currentRain < 0.3 && !isOnCooldown('RAIN_STOPPING')) {
      context.previousRainDensity = state.lastRainDensity
      context.weatherTrend = 'improving'
      events.push({
        type: 'RAIN_STOPPING',
        context,
        priority: 'medium',
        timestamp: now
      })
      markEventTriggered('RAIN_STOPPING')
      state.weatherChangeAnnounced = now
    }
  }
  
  // Detect significant track temp changes (rare, for color commentary)
  if (state.lastTrackTemp > 0 && currentTrackTemp > 0) {
    const tempDelta = currentTrackTemp - state.lastTrackTemp
    
    if (Math.abs(tempDelta) > 5 && !isOnCooldown('TRACK_TEMP_CHANGE')) {
      events.push({
        type: 'TRACK_TEMP_CHANGE',
        context: { ...context, trackTemperature: currentTrackTemp },
        priority: 'low',
        timestamp: now
      })
      markEventTriggered('TRACK_TEMP_CHANGE')
    }
  }
  
  state.lastRainDensity = currentRain
  state.lastTrackTemp = currentTrackTemp
}

/**
 * Detect enhanced damage events (like Crew Chief DamageReporting.cs)
 * Uses brake, suspension, and tyre data we already read from shared memory
 */
function detectEnhancedDamageEvents(
  context: EventContext,
  session: any,
  events: CommentaryEvent[]
): void {
  const now = Date.now()
  
  // Get damage data from session (we already read this in pcars2.ts!)
  const brakeDamage = session?.brakeDamage || [0, 0, 0, 0]
  const suspensionDamage = session?.suspensionDamage || [0, 0, 0, 0]
  const tyreWear = session?.tyreWear || [0, 0, 0, 0]
  
  const tyreNames = ['FL', 'FR', 'RL', 'RR'] as const
  
  // Add to context
  context.brakeDamage = brakeDamage
  context.suspensionDamage = suspensionDamage
  context.tyreWear = tyreWear
  
  // Find worst tyre
  const maxWear = Math.max(...tyreWear)
  const worstTyreIndex = tyreWear.indexOf(maxWear)
  context.maxTyreWear = maxWear
  context.worstTyre = tyreNames[worstTyreIndex]
  
  // Brake damage detection (> 0.3 = significant)
  const maxBrakeDamage = Math.max(...brakeDamage)
  if (maxBrakeDamage > 0.3 && 
      Math.max(...state.lastBrakeDamage) < 0.3 &&
      !isOnCooldown('BRAKE_DAMAGE')) {
    const worstBrakeIndex = brakeDamage.indexOf(maxBrakeDamage)
    events.push({
      type: 'BRAKE_DAMAGE',
      context: { ...context, worstTyre: tyreNames[worstBrakeIndex] },
      priority: 'medium',
      timestamp: now
    })
    markEventTriggered('BRAKE_DAMAGE')
  }
  
  // Suspension damage detection (> 0.25 = significant)
  const maxSuspDamage = Math.max(...suspensionDamage)
  if (maxSuspDamage > 0.25 && 
      Math.max(...state.lastSuspensionDamage) < 0.25 &&
      !isOnCooldown('SUSPENSION_DAMAGE')) {
    const worstSuspIndex = suspensionDamage.indexOf(maxSuspDamage)
    events.push({
      type: 'SUSPENSION_DAMAGE',
      context: { ...context, worstTyre: tyreNames[worstSuspIndex] },
      priority: 'high',
      timestamp: now
    })
    markEventTriggered('SUSPENSION_DAMAGE')
  }
  
  // Tyre wear warnings
  // Critical wear (> 0.85) - possible puncture
  if (maxWear > 0.9 && Math.max(...state.lastTyreWear) < 0.9 && !isOnCooldown('PUNCTURE_DETECTED')) {
    events.push({
      type: 'PUNCTURE_DETECTED',
      context,
      priority: 'high',
      timestamp: now
    })
    markEventTriggered('PUNCTURE_DETECTED')
  }
  // High wear warning (> 0.7)
  else if (maxWear > 0.7 && Math.max(...state.lastTyreWear) < 0.7 && !isOnCooldown('TYRE_DAMAGE')) {
    events.push({
      type: 'TYRE_DAMAGE',
      context,
      priority: 'medium',
      timestamp: now
    })
    markEventTriggered('TYRE_DAMAGE')
  }
  
  // Update state
  state.lastBrakeDamage = brakeDamage as [number, number, number, number]
  state.lastSuspensionDamage = suspensionDamage as [number, number, number, number]
  state.lastTyreWear = tyreWear as [number, number, number, number]
}

/**
 * Detect DRS availability events (like Crew Chief FlagsMonitor.cs)
 * Only triggers for series that actually have DRS (Formula Ultimate / F1)
 */
function detectDrsEvents(
  context: EventContext,
  session: any,
  events: CommentaryEvent[]
): void {
  // Only detect DRS for series that have it (Formula 1 / Formula Ultimate only)
  const seriesCategory = (context.seriesCategory as SeriesCategory) || 'gt-sportscar'
  const seriesProfile = getSeriesProfile(seriesCategory)
  
  if (!seriesProfile.hasDRS) {
    // This series doesn't have DRS - skip detection entirely
    return
  }
  
  const now = Date.now()
  
  // DRS state flags from shared memory (see pcars2.ts DrsState enum)
  // DRS_INSTALLED: 1, DRS_ZONE_RULES: 2, DRS_AVAILABLE_NEXT: 4, 
  // DRS_AVAILABLE_NOW: 8, DRS_ACTIVE: 16
  const drsState = session?.drsState || 0
  
  context.drsState = drsState
  context.drsAvailable = (drsState & 8) !== 0 // DRS_AVAILABLE_NOW
  context.drsActive = (drsState & 16) !== 0    // DRS_ACTIVE
  
  // Detect DRS becoming available (for close racing)
  const wasAvailable = (state.lastDrsState & 8) !== 0
  const isAvailable = context.drsAvailable
  
  if (isAvailable && !wasAvailable && !state.drsAvailableAnnounced && !isOnCooldown('DRS_AVAILABLE')) {
    // Only announce if we're close to car ahead (DRS is relevant)
    if (context.gapAhead !== undefined && context.gapAhead < 1.5) {
      events.push({
        type: 'DRS_AVAILABLE',
        context,
        priority: 'medium',
        timestamp: now
      })
      markEventTriggered('DRS_AVAILABLE')
      state.drsAvailableAnnounced = true
    }
  }
  
  // Reset announced flag when DRS becomes unavailable
  if (!isAvailable && wasAvailable) {
    state.drsAvailableAnnounced = false
  }
  
  state.lastDrsState = drsState
}

/**
 * Detect persistent blue flag situations (like Crew Chief FlagsMonitor.cs)
 */
function detectBlueFlagEvents(
  context: EventContext,
  session: any,
  events: CommentaryEvent[]
): void {
  const now = Date.now()
  
  // Check if currently blue flagged (flag colour 2 = blue)
  const isBlueFlag = context.flagColour === 2
  
  if (isBlueFlag && !state.lastBlueFlagState) {
    // Blue flag just started
    state.blueFlagStartTime = now
    state.blueFlagLaps = 1
  } else if (isBlueFlag && state.lastBlueFlagState) {
    // Still under blue flag - track duration
    if (context.currentLap !== state.lastLap) {
      state.blueFlagLaps++
    }
    
    // Persistent blue flag (3+ laps or 30+ seconds)
    const blueFlagDuration = now - state.blueFlagStartTime
    if ((state.blueFlagLaps >= 3 || blueFlagDuration > 30000) && 
        !isOnCooldown('BLUE_FLAG_PERSISTENT')) {
      context.blueFlagLaps = state.blueFlagLaps
      events.push({
        type: 'BLUE_FLAG_PERSISTENT',
        context,
        priority: 'medium',
        timestamp: now
      })
      markEventTriggered('BLUE_FLAG_PERSISTENT')
    }
  } else if (!isBlueFlag && state.lastBlueFlagState) {
    // Blue flag ended
    state.blueFlagStartTime = 0
    state.blueFlagLaps = 0
  }
  
  state.lastBlueFlagState = isBlueFlag
}

/**
 * Detect sector purple events (like Crew Chief LapTimes.cs)
 * Tracks session-best sectors and overall fastest laps
 */
function detectSectorPurpleEvents(
  context: EventContext,
  session: any,
  participants: any[],
  events: CommentaryEvent[]
): void {
  const now = Date.now()
  
  // Get sector times from session data
  const currentS1 = session?.currentSector1Time || 0
  const currentS2 = session?.currentSector2Time || 0
  const currentS3 = session?.currentSector3Time || 0
  const fastestS1 = session?.fastestSector1Time || 0
  const fastestS2 = session?.fastestSector2Time || 0
  const fastestS3 = session?.fastestSector3Time || 0
  
  // Add sector data to context
  context.sector1Time = currentS1
  context.sector2Time = currentS2
  context.sector3Time = currentS3
  context.sessionBestSector1 = state.sessionBestSectors[0]
  context.sessionBestSector2 = state.sessionBestSectors[1]
  context.sessionBestSector3 = state.sessionBestSectors[2]
  
  // Find session best sectors across all participants
  for (const p of participants) {
    // We'd need per-participant sector data which may not be available
    // For now, use player's fastest sectors as reference
  }
  
  // Update session best sectors from player's fastest
  if (fastestS1 > 0 && (state.sessionBestSectors[0] < 0 || fastestS1 < state.sessionBestSectors[0])) {
    state.sessionBestSectors[0] = fastestS1
  }
  if (fastestS2 > 0 && (state.sessionBestSectors[1] < 0 || fastestS2 < state.sessionBestSectors[1])) {
    state.sessionBestSectors[1] = fastestS2
  }
  if (fastestS3 > 0 && (state.sessionBestSectors[2] < 0 || fastestS3 < state.sessionBestSectors[2])) {
    state.sessionBestSectors[2] = fastestS3
  }
  
  // Detect when player sets a new session-best sector (purple)
  // Check S1 (when S1 time is posted and better than session best)
  if (currentS1 > 0 && state.lastSectorTimes[0] === 0 && 
      currentS1 <= state.sessionBestSectors[0] &&
      !state.purpleSectorAnnounced[0] &&
      !isOnCooldown('SECTOR_PURPLE')) {
    context.currentSector = 1
    context.sectorTime = currentS1
    events.push({
      type: 'SECTOR_PURPLE',
      context,
      priority: 'medium',
      timestamp: now
    })
    markEventTriggered('SECTOR_PURPLE')
    state.purpleSectorAnnounced[0] = true
    state.narrativeMemory.purpleSectors++
  }
  
  // Check S2 (when S2 time is posted)
  if (currentS2 > 0 && state.lastSectorTimes[1] === 0 && 
      currentS2 <= state.sessionBestSectors[1] &&
      !state.purpleSectorAnnounced[1] &&
      !isOnCooldown('SECTOR_PURPLE')) {
    context.currentSector = 2
    context.sectorTime = currentS2
    events.push({
      type: 'SECTOR_PURPLE',
      context,
      priority: 'medium',
      timestamp: now
    })
    markEventTriggered('SECTOR_PURPLE')
    state.purpleSectorAnnounced[1] = true
    state.narrativeMemory.purpleSectors++
  }
  
  // Check S3/lap complete (when S3 time is posted)
  if (currentS3 > 0 && state.lastSectorTimes[2] === 0 && 
      currentS3 <= state.sessionBestSectors[2] &&
      !state.purpleSectorAnnounced[2] &&
      !isOnCooldown('SECTOR_PURPLE')) {
    context.currentSector = 3
    context.sectorTime = currentS3
    events.push({
      type: 'SECTOR_PURPLE',
      context,
      priority: 'medium',
      timestamp: now
    })
    markEventTriggered('SECTOR_PURPLE')
    state.purpleSectorAnnounced[2] = true
    state.narrativeMemory.purpleSectors++
  }
  
  // Reset purple announced flags on new lap (when all sectors reset to 0)
  if (currentS1 === 0 && currentS2 === 0 && currentS3 === 0) {
    state.purpleSectorAnnounced = [false, false, false]
  }
  
  // Detect overall fastest lap (player sets session best)
  const playerBestLap = context.bestLapTime || 0
  if (playerBestLap > 0 && state.overallSessionBest > 0 && 
      playerBestLap <= state.overallSessionBest &&
      !isOnCooldown('OVERALL_FASTEST_LAP')) {
    events.push({
      type: 'OVERALL_FASTEST_LAP',
      context,
      priority: 'high',
      timestamp: now
    })
    markEventTriggered('OVERALL_FASTEST_LAP')
  }
  
  // Update last sector times
  state.lastSectorTimes = [currentS1, currentS2, currentS3]
}

/**
 * Detect position trend events (like Crew Chief Position.cs)
 * Tracks consistent gaining or losing of positions over multiple laps
 */
function detectPositionTrendEvents(
  context: EventContext,
  events: CommentaryEvent[]
): void {
  const now = Date.now()
  
  // Only check trends every 10 seconds
  if (now - state.lastPositionTrendCheck < 10000) return
  state.lastPositionTrendCheck = now
  
  // Track position history
  if (context.currentLap !== state.lastLap && context.currentLap > 1) {
    state.positionHistory5Laps.push(context.playerPosition)
    if (state.positionHistory5Laps.length > 5) {
      state.positionHistory5Laps.shift()
    }
  }
  
  // Need at least 4 laps of data
  if (state.positionHistory5Laps.length < 4) return
  
  const positions = state.positionHistory5Laps
  const firstPos = positions[0]
  const lastPos = positions[positions.length - 1]
  const netChange = firstPos - lastPos // Positive = gained positions
  
  context.positionsGainedLast5 = netChange
  
  // Determine trend
  let gaining = 0
  let losing = 0
  for (let i = 1; i < positions.length; i++) {
    if (positions[i] < positions[i-1]) gaining++
    else if (positions[i] > positions[i-1]) losing++
  }
  
  if (gaining >= 3) {
    context.positionTrend = 'gaining'
  } else if (losing >= 3) {
    context.positionTrend = 'losing'
  } else {
    context.positionTrend = 'stable'
  }
  
  // Announce significant trends
  if (context.positionTrend === 'gaining' && netChange >= 3 && !isOnCooldown('GAINING_POSITION_TREND')) {
    events.push({
      type: 'GAINING_POSITION_TREND',
      context,
      priority: 'medium',
      timestamp: now
    })
    markEventTriggered('GAINING_POSITION_TREND')
  }
  
  if (context.positionTrend === 'losing' && netChange <= -3 && !isOnCooldown('LOSING_POSITION_TREND')) {
    events.push({
      type: 'LOSING_POSITION_TREND',
      context,
      priority: 'medium',
      timestamp: now
    })
    markEventTriggered('LOSING_POSITION_TREND')
  }
  
  // Last place warning (if in last and not previously)
  const isLastPlace = context.playerPosition === (context.totalLaps > 0 ? context.totalLaps : 20)
  if (isLastPlace && !isOnCooldown('LAST_PLACE_WARNING')) {
    events.push({
      type: 'LAST_PLACE_WARNING',
      context,
      priority: 'medium',
      timestamp: now
    })
    markEventTriggered('LAST_PLACE_WARNING')
  }
}

// ============================================================================
// AUTHENTIC TV BROADCAST DETECTION FUNCTIONS
// ============================================================================

/**
 * Detect strategy speculation events
 * Analyzes pit stops to speculate on undercut/overcut and one-stop/two-stop strategies
 */
function detectStrategyEvents(
  context: EventContext,
  participants: any[],
  events: CommentaryEvent[]
): void {
  // Only during races
  if (context.sessionType !== 'Race') return
  if (!context.totalLaps || context.totalLaps <= 0) return
  
  const now = Date.now()
  const raceProgress = context.currentLap / context.totalLaps
  
  // === PIT WINDOW DETECTION ===
  // Typical pit window opens around 25-35% into the race
  const pitWindowStart = 0.25
  const pitWindowEnd = 0.75
  
  if (raceProgress >= pitWindowStart && 
      raceProgress <= pitWindowStart + 0.05 && 
      !state.pitWindowAnnounced && 
      !isOnCooldown('PIT_WINDOW_OPEN')) {
    events.push({
      type: 'PIT_WINDOW_OPEN',
      context: {
        ...context,
        pitWindowLap: Math.round(context.totalLaps * pitWindowStart),
      },
      priority: 'medium',
      timestamp: now
    })
    markEventTriggered('PIT_WINDOW_OPEN')
    state.pitWindowAnnounced = true
  }
  
  // === TRACK RIVAL PIT STOPS ===
  // Check if any rivals are currently in pits
  for (const p of participants) {
    if (!p || p.isPlayer) continue
    const driverName = p.name || 'Unknown'
    
    // Detect pit entry (pitMode changes to pit)
    const isPitting = p.pitMode === 1 || p.pitMode === 2 // PIT_MODE_DRIVING_INTO_PITS or PIT_MODE_IN_PIT
    const wasInPits = state.rivalsInPits.has(driverName)
    
    if (isPitting && !wasInPits) {
      // Rival just entered pits
      const pitHistory = state.pitStops.get(driverName) || []
      pitHistory.push({ lap: context.currentLap, timestamp: now })
      state.pitStops.set(driverName, pitHistory)
      
      // === UNDERCUT DETECTION ===
      // If a rival pits early (before pit window midpoint) when close to player
      const raceMiddle = 0.5
      const isEarlyStop = raceProgress < raceMiddle
      const isCloseToPlayer = Math.abs(p.racePosition - context.playerPosition) <= 3
      
      if (isEarlyStop && isCloseToPlayer && !isOnCooldown('STRATEGY_UNDERCUT_ATTEMPT')) {
        events.push({
          type: 'STRATEGY_UNDERCUT_ATTEMPT',
          context: {
            ...context,
            rivalPittingName: driverName,
            rivalPosition: p.racePosition,
            pitLap: context.currentLap,
          },
          priority: 'medium',
          timestamp: now
        })
        markEventTriggered('STRATEGY_UNDERCUT_ATTEMPT')
      }
    }
    
    // Detect pit exit (for overcut detection)
    if (!isPitting && wasInPits) {
      // Rival exited pits - check for overcut scenario
      const playerNotPittedYet = state.playerPitLaps.length === 0
      const rivalPitCount = (state.pitStops.get(driverName) || []).length
      
      if (playerNotPittedYet && rivalPitCount > 0 && 
          raceProgress > 0.35 && raceProgress < 0.6 &&
          !isOnCooldown('STRATEGY_OVERCUT_ATTEMPT')) {
        events.push({
          type: 'STRATEGY_OVERCUT_ATTEMPT',
          context: {
            ...context,
            rivalPittingName: driverName,
            pitLap: context.currentLap,
          },
          priority: 'low',
          timestamp: now
        })
        markEventTriggered('STRATEGY_OVERCUT_ATTEMPT')
      }
    }
    
    // Update pit state
    if (isPitting) {
      state.rivalsInPits.add(driverName)
    } else {
      state.rivalsInPits.delete(driverName)
    }
  }
  
  // === STRATEGY SPECULATION ===
  // Periodically speculate on overall race strategy
  if (raceProgress > 0.3 && raceProgress < 0.7 &&
      now - state.lastStrategyUpdate > 90000 && // 90 seconds between speculation
      !isOnCooldown('STRATEGY_SPECULATION') &&
      Math.random() < 0.15) { // 15% chance when conditions met
    
    // Estimate strategy based on fuel consumption and race progress
    const fuelUsed = 1.0 - (state.lastFuelLevel || 1.0)
    const estimatedFuelNeeded = fuelUsed / raceProgress
    const likelyOneStop = estimatedFuelNeeded < 1.2 // Can make it on one stop
    
    events.push({
      type: 'STRATEGY_SPECULATION',
      context: {
        ...context,
        estimatedStops: likelyOneStop ? 1 : 2,
        fuelConsumptionPerLap: state.fuelConsumptionPerLap,
        raceProgress: Math.round(raceProgress * 100),
      },
      priority: 'low',
      timestamp: now
    })
    markEventTriggered('STRATEGY_SPECULATION')
    state.lastStrategyUpdate = now
  }
  
  // Track player pit stops
  if (context.pitMode === 1 || context.pitMode === 2) { // Player in pits
    if (!state.playerPitLaps.includes(context.currentLap)) {
      state.playerPitLaps.push(context.currentLap)
    }
  }
}

/**
 * Detect crowd reaction events
 * Triggers for home heroes, exciting moments, and atmosphere
 */
function detectCrowdEvents(
  context: EventContext,
  events: CommentaryEvent[]
): void {
  const now = Date.now()
  
  // === HOME HERO DETECTION ===
  // Check if player's nationality matches track country
  const playerNationality = context.nationality?.toLowerCase()
  const trackCountry = state.trackCountry?.toLowerCase()
  
  // Map track names to countries (simplified)
  const trackCountryMap: Record<string, string> = {
    'interlagos': 'brazilian',
    'sao paulo': 'brazilian',
    'spielberg': 'austrian',
    'red bull ring': 'austrian',
    'silverstone': 'british',
    'monza': 'italian',
    'spa': 'belgian',
    'monaco': 'monegasque',
    'suzuka': 'japanese',
    'melbourne': 'australian',
    'albert park': 'australian',
    'montreal': 'canadian',
    'circuit gilles': 'canadian',
    'hockenheim': 'german',
    'nurburgring': 'german',
    'barcelona': 'spanish',
    'zandvoort': 'dutch',
    'imola': 'italian',
    'paul ricard': 'french',
    'brands hatch': 'british',
    'donington': 'british',
    'oulton': 'british',
    'snetterton': 'british',
    'assen': 'dutch',
    'portimao': 'portuguese',
    'estoril': 'portuguese',
    'jacarepagua': 'brazilian',
    'goiania': 'brazilian',
    'curitiba': 'brazilian',
    'buenos aires': 'argentinian',
    'mexico': 'mexican',
    'austin': 'american',
    'cota': 'american',
    'laguna seca': 'american',
    'watkins glen': 'american',
    'road america': 'american',
    'mount panorama': 'australian',
    'bathurst': 'australian',
    'fuji': 'japanese',
    'sepang': 'malaysian',
    'yeongam': 'korean',
    'shanghai': 'chinese',
  }
  
  // Try to match track name to country
  const trackNameLower = context.trackName?.toLowerCase() || ''
  let derivedTrackCountry = trackCountry
  for (const [trackKey, country] of Object.entries(trackCountryMap)) {
    if (trackNameLower.includes(trackKey)) {
      derivedTrackCountry = country
      break
    }
  }
  
  const isHomeHero = playerNationality && derivedTrackCountry && 
    (playerNationality.includes(derivedTrackCountry) || derivedTrackCountry.includes(playerNationality))
  
  // Trigger crowd roar for home hero moments
  if (isHomeHero && !isOnCooldown('CROWD_ROAR')) {
    // Check for exciting home hero moments
    const recentOvertake = state.narrativeMemory.overtakesMade > 0 && 
      (now - (state.lastEventTime['OVERTAKE'] || 0)) < 30000
    const inPodiumPosition = context.playerPosition <= 3
    const inFinalLaps = context.lapsRemaining !== undefined && context.lapsRemaining <= 5
    const setFastestLap = state.narrativeMemory.fastestLapSet?.lap === context.currentLap
    
    if (recentOvertake || (inPodiumPosition && inFinalLaps) || setFastestLap) {
      events.push({
        type: 'CROWD_ROAR',
        context: {
          ...context,
          isHomeHero: true,
          homeCountry: derivedTrackCountry,
        },
        priority: 'medium',
        timestamp: now
      })
      markEventTriggered('CROWD_ROAR')
      state.lastCrowdReaction = now
    }
  }
  
  // === EXCITING ATMOSPHERE DETECTION ===
  // Track exciting moments and trigger atmosphere commentary
  const recentExcitingEvents = [
    'OVERTAKE', 'BATTLE_FORMING', 'GAP_CLOSING', 'FINAL_LAPS', 
    'FCY_DEPLOYED', 'CONTACT_DETECTED', 'FASTEST_LAP'
  ]
  
  let excitingCount = 0
  for (const eventType of recentExcitingEvents) {
    const lastTime = state.lastEventTime[eventType] || 0
    if (now - lastTime < 60000) { // Within last minute
      excitingCount++
    }
  }
  
  // If multiple exciting things happened recently
  if (excitingCount >= 3 && 
      now - state.lastCrowdReaction > 90000 && // 90s since last crowd reaction
      !isOnCooldown('ATMOSPHERE_ELECTRIC')) {
    events.push({
      type: 'ATMOSPHERE_ELECTRIC',
      context: {
        ...context,
        excitingMomentCount: excitingCount,
      },
      priority: 'low',
      timestamp: now
    })
    markEventTriggered('ATMOSPHERE_ELECTRIC')
    state.lastCrowdReaction = now
  }
}

/**
 * Detect post-race events
 * Triggers cool-down lap, race reflection, and championship implications
 */
function detectPostRaceEvents(
  context: EventContext,
  events: CommentaryEvent[]
): void {
  // Only during races
  if (context.sessionType !== 'Race') return
  
  const now = Date.now()
  const raceState = context.raceState?.toLowerCase() || ''
  const isFinished = raceState === 'finished' || raceState === 'dnf' || 
    raceState === 'retired' || raceState === 'disqualified'
  
  // Detect race finished
  if (isFinished && !state.raceFinished) {
    state.raceFinished = true
  }
  
  if (!state.raceFinished) return
  
  // === COOL-DOWN LAP ===
  if (!state.cooldownLapAnnounced && !isOnCooldown('COOLDOWN_LAP')) {
    events.push({
      type: 'COOLDOWN_LAP',
      context: {
        ...context,
        finalPosition: context.playerPosition,
        positionsGained: state.sessionMemory.gridPosition 
          ? state.sessionMemory.gridPosition - context.playerPosition
          : 0,
        // Include narrative memory for callbacks
        overtakesMade: state.narrativeMemory.overtakesMade,
        overtakesLost: state.narrativeMemory.overtakesLost,
        purpleSectors: state.narrativeMemory.purpleSectors,
        personalBests: state.narrativeMemory.personalBests,
      },
      priority: 'high',
      timestamp: now
    })
    markEventTriggered('COOLDOWN_LAP')
    state.cooldownLapAnnounced = true
  }
  
  // === POST-RACE REFLECTION === (a bit after cool-down lap)
  if (state.cooldownLapAnnounced && 
      !state.postRaceReflectionAnnounced &&
      now - (state.lastEventTime['COOLDOWN_LAP'] || 0) > 15000 && // 15s after cooldown
      !isOnCooldown('POST_RACE_REFLECTION')) {
    
    // Build narrative highlights from memory
    const highlights: string[] = []
    if (state.narrativeMemory.overtakesMade > 3) {
      highlights.push(`${state.narrativeMemory.overtakesMade} overtakes`)
    }
    if (state.narrativeMemory.defensiveMoves > 2) {
      highlights.push('strong defensive driving')
    }
    if (state.narrativeMemory.fastestLapSet) {
      highlights.push('fastest lap')
    }
    if (state.narrativeMemory.personalBests > 3) {
      highlights.push('consistent pace improvements')
    }
    
    events.push({
      type: 'POST_RACE_REFLECTION',
      context: {
        ...context,
        narrativeHighlights: highlights,
        keyMoments: state.narrativeMemory,
        startPosition: state.sessionMemory.gridPosition,
        finalPosition: context.playerPosition,
      },
      priority: 'medium',
      timestamp: now
    })
    markEventTriggered('POST_RACE_REFLECTION')
    state.postRaceReflectionAnnounced = true
  }
  
  // === CHAMPIONSHIP IMPLICATIONS === (after reflection)
  if (state.postRaceReflectionAnnounced &&
      !state.championshipImplicationsAnnounced &&
      context.championshipPosition !== undefined &&
      now - (state.lastEventTime['POST_RACE_REFLECTION'] || 0) > 10000 && // 10s after reflection
      !isOnCooldown('CHAMPIONSHIP_IMPLICATIONS')) {
    
    events.push({
      type: 'CHAMPIONSHIP_IMPLICATIONS',
      context: {
        ...context,
        pointsScored: calculatePointsForPosition(context.playerPosition),
        newChampionshipPosition: context.championshipPosition,
        pointsGapToLeader: context.pointsGapToLeader,
        titleFightStatus: context.titleFightStatus,
      },
      priority: 'medium',
      timestamp: now
    })
    markEventTriggered('CHAMPIONSHIP_IMPLICATIONS')
    state.championshipImplicationsAnnounced = true
  }
}

/**
 * Helper to estimate points for a position
 */
function calculatePointsForPosition(position: number): number {
  // Standard points (can be customized per series)
  const points: Record<number, number> = {
    1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
    6: 8, 7: 6, 8: 4, 9: 2, 10: 1
  }
  return points[position] || 0
}

/**
 * Detect events specific to Practice/Qualifying sessions
 * (e.g., other drivers improving, track evolution, sector comparisons)
 */
function detectPracticeQualiSpecificEvents(context: EventContext, events: CommentaryEvent[]): void {
  const now = Date.now()
  
  // NOTE: OTHER_DRIVER_HOTLAP is now detected by detectRivalEvents() using real data!
  // This random trigger is kept as fallback for sessions without full participant data
  
  // OTHER_DRIVER_HOTLAP: Only use random trigger if we haven't detected any real improvements
  if (!isOnCooldown('OTHER_DRIVER_HOTLAP') && state.rivalBestTimes.size === 0 && Math.random() < 0.1) {
    // 10% chance per check - simulates another driver improving (fallback only)
    events.push({
      type: 'OTHER_DRIVER_HOTLAP',
      context,
      priority: 'low',
      timestamp: now
    })
    markEventTriggered('OTHER_DRIVER_HOTLAP')
  }
  
  // TRACK_EVOLUTION: Periodic observation about track getting faster
  if (!isOnCooldown('TRACK_EVOLUTION') && 
      context.currentLap > 5 && // After some running
      Math.random() < 0.05) { // 5% chance
    events.push({
      type: 'TRACK_EVOLUTION',
      context,
      priority: 'low',
      timestamp: now
    })
    markEventTriggered('TRACK_EVOLUTION')
  }
  
  // SECTOR_COMPARISON: Comment on sector times
  if (context.sectorTime && context.sectorNumber &&
      !isOnCooldown('SECTOR_COMPARISON') &&
      Math.random() < 0.15) { // 15% chance when sector completed
    events.push({
      type: 'SECTOR_COMPARISON',
      context,
      priority: 'low',
      timestamp: now
    })
    markEventTriggered('SECTOR_COMPARISON')
  }
  
  // PIT_ACTIVITY: Random pit lane observation
  if (!isOnCooldown('PIT_ACTIVITY') && Math.random() < 0.03) { // 3% chance
    events.push({
      type: 'PIT_ACTIVITY',
      context,
      priority: 'low',
      timestamp: now
    })
    markEventTriggered('PIT_ACTIVITY')
  }
}

/**
 * Detect race events
 */
function detectRaceEvents(
  context: EventContext,
  sortedParticipants: any[],
  playerIdx: number,
  session: any
): void {
  const events: CommentaryEvent[] = []
  
  // Flags (announce on change only)
  detectFlagEvents(context, events)

  // Pit entry/exit (telemetry-backed, more reliable than random PIT_ACTIVITY)
  // Works for both UDP and shared memory pit modes: treat 0 as "not in pit sequence".
  const pitMode = context.pitMode ?? 0
  if (state.lastPlayerPitMode === 0 && pitMode !== 0 && !isOnCooldown('PIT_ENTRY')) {
    events.push({
      type: 'PIT_ENTRY',
      context,
      priority: 'high',
      timestamp: Date.now()
    })
    markEventTriggered('PIT_ENTRY')
  } else if (state.lastPlayerPitMode !== 0 && pitMode === 0 && !isOnCooldown('PIT_EXIT')) {
    events.push({
      type: 'PIT_EXIT',
      context,
      priority: 'medium',
      timestamp: Date.now()
    })
    markEventTriggered('PIT_EXIT')
  }
  
  // Race Start - ONLY trigger on lap 1 to avoid mid-race triggers
  // The race state goes to 'Racing' at green lights when currentLap is 0 or 1
  if (context.raceState === 'Racing' && 
      !state.raceStarted && 
      context.currentLap <= 1) {
    state.raceStarted = true
    state.positionAtRaceStart = context.playerPosition // Track starting position
    events.push({
      type: 'RACE_START',
      context,
      priority: 'high',
      timestamp: Date.now()
    })
  }
  
  // Reset flags ONLY when transitioning OUT of racing (not every packet)
  // Track if we were racing before
  const wasRacing = state.raceStarted
  if (context.raceState === 'Racing') {
    state.raceStarted = true
  } else if (wasRacing && context.raceState && context.raceState !== 'Racing') {
    // Only reset when we WERE racing and now we're NOT
    state.raceStarted = false
    state.announcedFinalLaps = false
    state.announcedHalfway = false
    state.positionAtRaceStart = 0
    state.announcedPoorStart = false
    state.announcedGreatStart = false
  }
  
  // Position gained (overtake)
  const positionChanged = state.lastPosition > 0 && context.playerPosition !== state.lastPosition
  const positionGained = state.lastPosition > 0 && context.playerPosition < state.lastPosition
  const positionLost = state.lastPosition > 0 && context.playerPosition > state.lastPosition
  
  // Log position check every 10 seconds or on change
  if (positionChanged) {
    telemetryLog.actionCheck('POSITION_CHANGE', true, 
      positionGained ? `Gained: P${state.lastPosition} -> P${context.playerPosition}` : `Lost: P${state.lastPosition} -> P${context.playerPosition}`,
      { lastPos: state.lastPosition, currentPos: context.playerPosition }
    )
  }
  
  if (positionGained && !isOnCooldown('OVERTAKE')) {
    const positionsGained = state.lastPosition - context.playerPosition
    const overtakenDriver = getValidDriverName(sortedParticipants[playerIdx + 1]?.name, 'a rival')
    telemetryLog.actionCheck('OVERTAKE', true, 
      `Passed ${overtakenDriver}! P${state.lastPosition} -> P${context.playerPosition}`,
      { from: state.lastPosition, to: context.playerPosition, driver: overtakenDriver }
    )
    
    // Track in narrative memory
    state.narrativeMemory.bigOvertakes.push({
      lap: context.currentLap,
      driver: overtakenDriver,
      forPosition: context.playerPosition
    })
    state.narrativeMemory.overtakesMade++
    // Keep only last 5 overtakes
    if (state.narrativeMemory.bigOvertakes.length > 5) {
      state.narrativeMemory.bigOvertakes.shift()
    }
    
    // Track lead changes
    if (context.playerPosition === 1 && state.lastPosition > 1) {
      state.narrativeMemory.tookLead = { lap: context.currentLap, fromWho: overtakenDriver }
      state.narrativeMemory.leadChanges++
      console.log('[Narrative] Took the lead on lap', context.currentLap)
    }
    
    events.push({
      type: 'OVERTAKE',
      context: {
        ...context,
        previousPosition: state.lastPosition,
        overtakenDriver
      },
      priority: 'high',
      timestamp: Date.now()
    })
    markEventTriggered('OVERTAKE')
    
    // Check for GREAT START (gained 3+ positions on lap 1)
    if (context.currentLap <= 1 && 
        state.positionAtRaceStart > 0 &&
        !state.announcedGreatStart) {
      const totalGained = state.positionAtRaceStart - context.playerPosition
      if (totalGained >= 3) {
        state.announcedGreatStart = true
        // Track in narrative memory
        state.narrativeMemory.greatStart = {
          lap: context.currentLap,
          positionsGained: totalGained,
          fromPosition: state.positionAtRaceStart,
          toPosition: context.playerPosition
        }
        // Mark as not yet mentioned (will be set true after finish commentary uses it)
        state.narrativeMemory.mentionedGreatStart = false
        console.log('[Narrative] Great start recorded:', state.narrativeMemory.greatStart)
        events.push({
          type: 'GREAT_START',
          context: {
            ...context,
            previousPosition: state.positionAtRaceStart
          },
          priority: 'high',
          timestamp: Date.now()
        })
      }
    }
  }
  
  // Position lost
  if (positionLost && !isOnCooldown('POSITION_LOST')) {
    
    const positionsLost = context.playerPosition - state.lastPosition
    const passingDriver = getValidDriverName(sortedParticipants[playerIdx - 1]?.name, 'a rival')
    
    // Track in narrative memory
    state.narrativeMemory.positionsLost.push({
      lap: context.currentLap,
      driver: passingDriver,
      toPosition: context.playerPosition
    })
    state.narrativeMemory.overtakesLost++
    // Keep only last 5
    if (state.narrativeMemory.positionsLost.length > 5) {
      state.narrativeMemory.positionsLost.shift()
    }
    
    // Track lead lost
    if (state.lastPosition === 1 && context.playerPosition > 1) {
      state.narrativeMemory.lostLead = { lap: context.currentLap, toWho: passingDriver }
      state.narrativeMemory.leadChanges++
      console.log('[Narrative] Lost the lead on lap', context.currentLap)
    }
    
    events.push({
      type: 'POSITION_LOST',
      context: {
        ...context,
        previousPosition: state.lastPosition,
        overtakenDriver: passingDriver
      },
      priority: 'medium',
      timestamp: Date.now()
    })
    markEventTriggered('POSITION_LOST')
    
    // Check for POOR START (lost 3+ positions on lap 1)
    if (context.currentLap <= 1 && 
        state.positionAtRaceStart > 0 &&
        !state.announcedPoorStart) {
      const totalLost = context.playerPosition - state.positionAtRaceStart
      if (totalLost >= 3) {
        state.announcedPoorStart = true
        // Track in narrative memory
        state.narrativeMemory.poorStart = {
          lap: context.currentLap,
          positionsLost: totalLost,
          fromPosition: state.positionAtRaceStart,
          toPosition: context.playerPosition
        }
        // Mark as not yet mentioned (will be set true after finish commentary uses it)
        state.narrativeMemory.mentionedPoorStart = false
        console.log('[Narrative] Poor start recorded:', state.narrativeMemory.poorStart)
        events.push({
          type: 'POOR_START',
          context: {
            ...context,
            previousPosition: state.positionAtRaceStart
          },
          priority: 'high',
          timestamp: Date.now()
        })
      }
    }
    
    // Check for UNDER_PRESSURE (lost 2+ positions rapidly, not on lap 1)
    if (context.currentLap > 1 && positionsLost >= 2 && !isOnCooldown('UNDER_PRESSURE')) {
      events.push({
        type: 'UNDER_PRESSURE',
        context: {
          ...context,
          previousPosition: state.lastPosition
        },
        priority: 'high',
        timestamp: Date.now()
      })
      markEventTriggered('UNDER_PRESSURE')
    }
  }
  
  // Personal best lap - with logging
  const pbConditionsMet = context.bestLapTime && 
      state.lastBestLap > 0 && 
      context.bestLapTime < state.lastBestLap
  const pbOnCooldown = isOnCooldown('PERSONAL_BEST')
  
  if (pbConditionsMet && !pbOnCooldown) {
    telemetryLog.actionCheck('PERSONAL_BEST', true, 
      `New PB! ${context.bestLapTime?.toFixed(3)}s (was ${state.lastBestLap?.toFixed(3)}s)`,
      { newTime: context.bestLapTime, oldTime: state.lastBestLap }
    )
    // Track in narrative memory
    state.narrativeMemory.personalBests++
    state.narrativeMemory.fastestLapSet = { lap: context.currentLap, time: context.bestLapTime as number }
    
    events.push({
      type: 'PERSONAL_BEST',
      context,
      priority: 'medium',
      timestamp: Date.now()
    })
    markEventTriggered('PERSONAL_BEST')
  } else if (pbConditionsMet && pbOnCooldown) {
    telemetryLog.actionCheck('PERSONAL_BEST', false, 'On cooldown', 
      { newTime: context.bestLapTime, oldTime: state.lastBestLap }
    )
  }
  
  // Halfway point
  if (context.totalLaps > 0 && 
      context.currentLap === Math.floor(context.totalLaps / 2) &&
      !state.announcedHalfway) {
    state.announcedHalfway = true
    events.push({
      type: 'HALFWAY_POINT',
      context,
      priority: 'medium',
      timestamp: Date.now()
    })
  }
  
  // Final laps (3 laps to go)
  if (context.lapsRemaining !== undefined && 
      context.lapsRemaining <= 3 && 
      context.lapsRemaining > 0 &&
      !state.announcedFinalLaps) {
    state.announcedFinalLaps = true
    events.push({
      type: 'FINAL_LAPS',
      context,
      priority: 'high',
      timestamp: Date.now()
    })
  }
  
  // Gap closing (hunting down car ahead) - with logging
  const gapClosingConditions = context.gapAhead !== undefined && 
      state.lastGapAhead < 999 &&
      context.gapAhead < state.lastGapAhead - 0.3 &&
      context.gapAhead < 2.0
  const gapClosingOnCooldown = isOnCooldown('GAP_CLOSING')
  
  if (gapClosingConditions && !gapClosingOnCooldown) {
    telemetryLog.actionCheck('GAP_CLOSING', true, 
      `Closing! ${state.lastGapAhead?.toFixed(1)}s -> ${context.gapAhead?.toFixed(1)}s`,
      { was: state.lastGapAhead, now: context.gapAhead }
    )
    events.push({
      type: 'GAP_CLOSING',
      context,
      priority: 'medium',
      timestamp: Date.now()
    })
    markEventTriggered('GAP_CLOSING')
  } else if (gapClosingConditions && gapClosingOnCooldown) {
    telemetryLog.actionCheck('GAP_CLOSING', false, 'On cooldown',
      { was: state.lastGapAhead, now: context.gapAhead }
    )
  }
  
  // Battle forming (car behind closing in) - with logging
  const battleFormingConditions = context.gapBehind !== undefined && 
      context.gapBehind < 1.0 &&
      state.lastGapBehind >= 1.5
  const battleOnCooldown = isOnCooldown('BATTLE_FORMING')
  
  if (battleFormingConditions && !battleOnCooldown) {
    telemetryLog.actionCheck('BATTLE_FORMING', true,
      `Under attack! Gap behind: ${context.gapBehind?.toFixed(1)}s`,
      { gapBehind: context.gapBehind }
    )
    events.push({
      type: 'BATTLE_FORMING',
      context,
      priority: 'medium',
      timestamp: Date.now()
    })
    markEventTriggered('BATTLE_FORMING')
  }
  
  // ===== SITUATIONAL EVENTS (NEW) =====
  
  // Track position history for momentum detection
  if (context.currentLap !== state.lastLap) {
    state.positionHistory.push({
      lap: context.currentLap,
      position: context.playerPosition,
      timestamp: Date.now()
    })
    // Keep only last 5 laps
    if (state.positionHistory.length > 5) {
      state.positionHistory.shift()
    }
    
    // Track lap times for consistency
    if (context.lastLapTime && context.lastLapTime > 0) {
      state.recentLapTimes.push(context.lastLapTime)
      if (state.recentLapTimes.length > 5) {
        state.recentLapTimes.shift()
      }
    }
  }
  
  // MOMENTUM_BUILDING: Gained 2+ positions in last 3 laps
  if (state.positionHistory.length >= 3 && !isOnCooldown('MOMENTUM_BUILDING')) {
    const posThreeLapsAgo = state.positionHistory[state.positionHistory.length - 3]?.position
    const currentPos = context.playerPosition
    if (posThreeLapsAgo && posThreeLapsAgo - currentPos >= 2) {
      events.push({
        type: 'MOMENTUM_BUILDING',
        context: {
          ...context,
          previousPosition: posThreeLapsAgo
        },
        priority: 'medium',
        timestamp: Date.now()
      })
      markEventTriggered('MOMENTUM_BUILDING')
    }
  }
  
  // RECOVERY_DRIVE: Started poorly but climbing back
  if (state.positionAtRaceStart > 0 && 
      context.currentLap > 3 &&
      !isOnCooldown('RECOVERY_DRIVE')) {
    const droppedAtStart = context.playerPosition > state.positionAtRaceStart + 2
    const nowRecovering = context.playerPosition < state.lastPosition
    if (droppedAtStart && nowRecovering && state.positionHistory.length >= 2) {
      const recentGain = state.positionHistory[state.positionHistory.length - 2]?.position - context.playerPosition
      if (recentGain >= 2) {
        events.push({
          type: 'RECOVERY_DRIVE',
          context: {
            ...context,
            previousPosition: state.positionAtRaceStart
          },
          priority: 'medium',
          timestamp: Date.now()
        })
        markEventTriggered('RECOVERY_DRIVE')
      }
    }
  }
  
  // DEFENSIVE_DRIVING: Held position under pressure (gap behind < 1s for 2+ laps)
  if (context.gapBehind !== undefined && context.gapBehind < 1.0) {
    state.underPressureLaps++
    if (state.underPressureLaps >= 2 && 
        context.playerPosition === state.lastPosition &&
        !isOnCooldown('DEFENSIVE_DRIVING')) {
      events.push({
        type: 'DEFENSIVE_DRIVING',
        context,
        priority: 'medium',
        timestamp: Date.now()
      })
      state.narrativeMemory.defensiveMoves++
      markEventTriggered('DEFENSIVE_DRIVING')
      state.underPressureLaps = 0 // Reset
    }
  } else {
    state.underPressureLaps = 0 // Reset if gap opens
  }
  
  // CONSISTENCY_PRAISE: 3+ laps with similar times (within 0.5s)
  if (state.recentLapTimes.length >= 3 && !isOnCooldown('CONSISTENCY_PRAISE')) {
    const lastThree = state.recentLapTimes.slice(-3)
    const maxTime = Math.max(...lastThree)
    const minTime = Math.min(...lastThree)
    if (maxTime - minTime < 0.5 && minTime > 0) {
      events.push({
        type: 'CONSISTENCY_PRAISE',
        context,
        priority: 'low',
        timestamp: Date.now()
      })
      markEventTriggered('CONSISTENCY_PRAISE')
    }
  }
  
  // PRESSURE_BUILDING: Gap ahead closing, getting exciting
  if (context.gapAhead !== undefined && 
      context.gapAhead < 1.5 &&
      context.gapAhead > 0.3 &&
      state.lastGapAhead > context.gapAhead &&
      !isOnCooldown('PRESSURE_BUILDING')) {
    events.push({
      type: 'PRESSURE_BUILDING',
      context,
      priority: 'medium',
      timestamp: Date.now()
    })
    markEventTriggered('PRESSURE_BUILDING')
  }
  
  // GAP_CALCULATION: "Needs X tenths per lap to catch"
  if (context.gapAhead !== undefined && 
      context.lapsRemaining !== undefined &&
      context.lapsRemaining > 2 &&
      context.gapAhead > 1.0 && context.gapAhead < 10.0 &&
      !isOnCooldown('GAP_CALCULATION') &&
      Math.random() < 0.2) { // 20% chance when conditions met
    events.push({
      type: 'GAP_CALCULATION',
      context,
      priority: 'low',
      timestamp: Date.now()
    })
    markEventTriggered('GAP_CALCULATION')
  }
  
  // ===== MILESTONE & ACHIEVEMENT EVENTS (NEW) =====
  
  // MILESTONE_WIN_STREAK: Driver is on a 3+ win streak
  if (context.consecutiveWins && context.consecutiveWins >= 3 && 
      !isOnCooldown('MILESTONE_WIN_STREAK') &&
      Math.random() < 0.3) { // 30% chance when on streak
    events.push({
      type: 'MILESTONE_WIN_STREAK',
      context,
      priority: 'low', // Color commentary style
      timestamp: Date.now()
    })
    markEventTriggered('MILESTONE_WIN_STREAK')
  }
  
  // MILESTONE_PODIUM_STREAK: Driver is on a 5+ podium streak
  if (context.consecutivePodiums && context.consecutivePodiums >= 5 && 
      !isOnCooldown('MILESTONE_PODIUM_STREAK') &&
      Math.random() < 0.25) { // 25% chance when on streak
    events.push({
      type: 'MILESTONE_PODIUM_STREAK',
      context,
      priority: 'low',
      timestamp: Date.now()
    })
    markEventTriggered('MILESTONE_PODIUM_STREAK')
  }
  
  // TEAM_PRESSURE_MENTION: Team satisfaction is concerning
  if ((context.teamWarningIssued || context.teamFinalWarningIssued || 
       (context.teamSatisfaction !== undefined && context.teamSatisfaction < 50)) &&
      !isOnCooldown('TEAM_PRESSURE_MENTION') &&
      Math.random() < 0.15) { // 15% chance when team is unhappy
    events.push({
      type: 'TEAM_PRESSURE_MENTION',
      context,
      priority: 'low',
      timestamp: Date.now()
    })
    markEventTriggered('TEAM_PRESSURE_MENTION')
  }
  
  // SPONSOR_PRESSURE_MENTION: Sponsors are at risk
  if ((context.sponsorPressureLevel === 'high' || context.sponsorPressureLevel === 'moderate' ||
       (context.sponsorsAtRisk && context.sponsorsAtRisk > 0)) &&
      !isOnCooldown('SPONSOR_PRESSURE_MENTION') &&
      Math.random() < 0.12) { // 12% chance when sponsors concerned
    events.push({
      type: 'SPONSOR_PRESSURE_MENTION',
      context,
      priority: 'low',
      timestamp: Date.now()
    })
    markEventTriggered('SPONSOR_PRESSURE_MENTION')
  }
  
  // MEDIA_HEADLINE_CALLBACK: Reference recent press clippings
  if (context.recentPressClippings && context.recentPressClippings.length > 0 &&
      !isOnCooldown('MEDIA_HEADLINE_CALLBACK') &&
      Math.random() < 0.1) { // 10% chance when headlines available
    events.push({
      type: 'MEDIA_HEADLINE_CALLBACK',
      context,
      priority: 'low',
      timestamp: Date.now()
    })
    markEventTriggered('MEDIA_HEADLINE_CALLBACK')
  }
  
  // Lap complete (VERY occasional - only when interesting)
  // Skip if nothing has changed recently - position same, gaps similar
  const lapPositionChanged = state.lastPosition !== context.playerPosition
  const significantGapChange = 
    (state.lastGapAhead !== 999 && Math.abs((context.gapAhead || 0) - state.lastGapAhead) > 1.0) ||
    (state.lastGapBehind !== 999 && Math.abs((context.gapBehind || 0) - state.lastGapBehind) > 1.0)
  const isKeyLap = context.currentLap === 1 || context.currentLap === Math.floor(context.totalLaps / 2) || context.currentLap >= context.totalLaps - 3
  
  const somethingInteresting = lapPositionChanged || significantGapChange || isKeyLap
  
  if (context.currentLap > state.lastLap && 
      context.currentLap > 1 &&
      !isOnCooldown('LAP_COMPLETE') &&
      somethingInteresting &&
      Math.random() < 0.15) { // Reduced to 15% chance
    events.push({
      type: 'LAP_COMPLETE',
      context,
      priority: 'low',
      timestamp: Date.now()
    })
    markEventTriggered('LAP_COMPLETE')
  }
  
  // Detect field events (other drivers)
  detectFieldEvents(context, sortedParticipants, playerIdx, events)
  
  events.forEach(event => queueEvent(event))
}

/**
 * Detect events about other drivers in the field
 * PRIORITIZES: Player's direct rivals (cars ahead/behind), then nearby battles, then leader
 */
function detectFieldEvents(
  context: EventContext,
  sortedParticipants: any[],
  playerIdx: number,
  events: CommentaryEvent[]
): void {
  const now = Date.now()
  
  // Only check field events occasionally to avoid spam
  if (now - state.lastFieldUpdate < 5000) return // 5 second throttle (was 8s)
  
  // Get the car directly ahead and behind the player
  const carAhead = playerIdx > 0 ? sortedParticipants[playerIdx - 1] : null
  const carBehind = playerIdx < sortedParticipants.length - 1 ? sortedParticipants[playerIdx + 1] : null
  
  // PRIORITY 1: Commentary about the driver directly ahead of player (the one we're chasing)
  if (carAhead && !isOnCooldown('MIDFIELD_ACTION') && Math.random() < 0.55) { // Was 0.40
    const gapToAhead = context.gapAhead
    let commentary = ''
    
    if (gapToAhead !== undefined && gapToAhead < 1.5) {
      // Close battle
      events.push({
        type: 'MIDFIELD_ACTION',
        context: {
          ...context,
          overtakenDriver: getValidDriverName(carAhead.name, 'the car ahead'),
          gapAhead: gapToAhead
        },
        priority: 'medium', // Higher priority for direct rival
        timestamp: now
      })
      markEventTriggered('MIDFIELD_ACTION')
      state.lastFieldUpdate = now
      return
    }
  }
  
  // PRIORITY 2: Commentary about the driver directly behind (defending from)
  if (carBehind && !isOnCooldown('FIELD_BATTLE') && Math.random() < 0.50) { // Was 0.35
    const gapToBehind = context.gapBehind
    
    if (gapToBehind !== undefined && gapToBehind < 2.0) {
      events.push({
        type: 'FIELD_BATTLE',
        context: {
          ...context,
          overtakenDriver: getValidDriverName(carBehind.name, 'the car behind'),
          gapBehind: gapToBehind
        },
        priority: 'medium',
        timestamp: now
      })
      markEventTriggered('FIELD_BATTLE')
      state.lastFieldUpdate = now
      return
    }
  }
  
  // PRIORITY 3: Detect position changes near the player (battles affecting our race)
  for (const participant of sortedParticipants) {
    if (participant.isPlayer) continue
    
    const carIndex = participant.carIndex
    const currentPos = participant.racePosition
    const lastPos = state.lastFieldPositions.get(carIndex)
    
    if (lastPos !== undefined && lastPos !== currentPos) {
      const posChange = Math.abs(currentPos - lastPos)
      
      // Report if it's VERY close to player (within 2 positions - directly affects us)
      const isVeryNearPlayer = Math.abs(currentPos - context.playerPosition) <= 2
      
      if (posChange >= 1 && isVeryNearPlayer && 
          !isOnCooldown('FIELD_BATTLE') && 
          Math.random() < 0.80) { // 80% chance for battles that directly affect player (was 65%)
        
        events.push({
          type: 'FIELD_BATTLE',
          context: {
            ...context,
            overtakenDriver: getValidDriverName(participant.name, 'a driver'),
            previousPosition: lastPos
          },
          priority: 'medium', // Elevated priority - affects player's race
          timestamp: now
        })
        markEventTriggered('FIELD_BATTLE')
        state.lastFieldUpdate = now
        
        // Update tracking
        state.lastFieldPositions.set(carIndex, currentPos)
        return
      }
    }
    
    // Update tracking
    state.lastFieldPositions.set(carIndex, currentPos)
  }
  
  // PRIORITY 4: General pack commentary (player's position in the field)
  if (context.playerPosition > 3 && 
      !isOnCooldown('MIDFIELD_ACTION') &&
      Math.random() < 0.40) { // Was 0.25
    
    // Find 2-3 cars around the player for context
    const nearbyDrivers = sortedParticipants
      .filter(p => !p.isPlayer && Math.abs(p.racePosition - context.playerPosition) <= 3)
      .slice(0, 3)
    
    if (nearbyDrivers.length > 0) {
      events.push({
        type: 'MIDFIELD_ACTION',
        context: {
          ...context,
          overtakenDriver: nearbyDrivers.map(d => getValidDriverName(d.name, 'a rival')).join(', ')
        },
        priority: 'low',
        timestamp: now
      })
      markEventTriggered('MIDFIELD_ACTION')
      state.lastFieldUpdate = now
      return
    }
  }
  
  // PRIORITY 5 (LOWEST): Leader update - only if player is NOT in top 5
  // We care less about P1 if we're P15!
  const leader = sortedParticipants.find(p => p.racePosition === 1)
  if (leader && !leader.isPlayer && 
      context.playerPosition > 5 && // Only when player is well back
      !isOnCooldown('LEADER_UPDATE') &&
      Math.random() < 0.25) { // 25% chance (was 15%)
    events.push({
      type: 'LEADER_UPDATE',
      context: {
        ...context,
        overtakenDriver: getValidDriverName(leader.name, 'the leader')
      },
      priority: 'low',
      timestamp: now
    })
    markEventTriggered('LEADER_UPDATE')
    state.lastFieldUpdate = now
  }
}

/**
 * Determine what broadcast phase we're in for appropriate commentary
 * This ensures commentary feels like a real TV broadcast
 * Different logic for Practice vs Qualifying vs Race!
 */
function getBroadcastPhase(context: EventContext): 'pre-session' | 'early-session' | 'mid-session' | 'late-session' {
  const hasAnyLapTime = (context.bestLapTime || 0) > 0
  const hasCompletedLaps = (context.currentLap || 0) >= 1
  const sessionTimeRemaining = context.timeRemaining || 999999
  const sessionType = context.sessionType
  
  // Pre-session: Waiting for green flag
  if (!state.sessionStarted) {
    return 'pre-session'
  }
  
  // ===== RACE-SPECIFIC PHASES =====
  if (sessionType === 'Race') {
    const currentLap = context.currentLap || 0
    const totalLaps = context.totalLaps || 999
    const lapsRemaining = context.lapsRemaining || totalLaps
    
    // Opening laps (first 3 laps) - talk about starts, first corner, early battles
    if (currentLap <= 3) {
      return 'early-session'
    }
    // Final laps (last 5 or under 10% remaining)
    if (lapsRemaining <= 5 || (totalLaps > 0 && currentLap / totalLaps > 0.9)) {
      return 'late-session'
    }
    // Mid-race
    return 'mid-session'
  }
  
  // ===== QUALIFYING-SPECIFIC PHASES =====
  if (sessionType === 'Qualifying') {
    // Early quali: First hot laps going out, no times set yet
    if (!hasAnyLapTime || !hasCompletedLaps) {
      return 'early-session'
    }
    // Late quali: Under 3 minutes - final attempts!
    if (sessionTimeRemaining < 180) {
      return 'late-session'
    }
    // Mid quali: Times are in, fighting for positions
    return 'mid-session'
  }
  
  // ===== PRACTICE-SPECIFIC PHASES =====
  // Early practice: Green flag but no meaningful lap times yet
  // This is where we talk about the track, weather, paddock news - NOT performance
  if (!hasAnyLapTime || !hasCompletedLaps) {
    return 'early-session'
  }
  
  // Late practice: Under 5 minutes remaining
  if (sessionTimeRemaining < 300) {
    return 'late-session'
  }
  
  // Mid practice: Normal running with valid timing data
  return 'mid-session'
}

/**
 * Maybe add color commentary (random chatter about driver/team/career)
 * Now broadcast-aware - different topics for different session phases
 */
// Track recent strands to enable rotation (mirrors scriptGenerator but for event selection)
type NarrativeStrand = 'VENUE' | 'DRIVER' | 'TEAM' | 'SEASON' | 'SESSION'
const recentEventStrands: NarrativeStrand[] = []
const EVENT_STRAND_HISTORY_SIZE = 3

// Map event types to their narrative strands
const EVENT_TO_STRAND: Partial<Record<CommentaryEventType, NarrativeStrand>> = {
  // VENUE strand
  'TRACK_CHARACTER': 'VENUE',
  'CORNER_CALLOUT': 'VENUE',
  'TRACK_EVOLUTION': 'VENUE',
  'WEATHER_CHANGE': 'VENUE',
  // DRIVER strand
  'DRIVER_BACKGROUND': 'DRIVER',
  'RANDOM_FACT': 'DRIVER',
  // TEAM strand
  'TEAM_INFO': 'TEAM',
  'TEAM_PRESSURE_MENTION': 'TEAM',
  'SPONSOR_PRESSURE_MENTION': 'TEAM',
  // SEASON strand
  'CHAMPIONSHIP_UPDATE': 'SEASON',
  'RIVALRY_MENTION': 'SEASON',
  'MEDIA_HEADLINE_CALLBACK': 'SEASON',
  // SESSION strand
  'TRIVIA_DROP': 'SESSION',
  'COLOR_COMMENTARY': 'SESSION',
  'DISAGREEMENT': 'SESSION',
}

function maybeAddColorCommentary(context: EventContext): void {
  const now = Date.now()
  const timeSinceLastColor = now - state.lastColorCommentary
  const minInterval = state.colorCommentaryInterval
  const maxInterval = minInterval * 2
  
  // Random interval between min and max - INCREASED trigger chance
  const shouldTrigger = timeSinceLastColor > minInterval && 
                       (timeSinceLastColor > maxInterval || Math.random() < 0.20)
  
  if (!shouldTrigger) return
  
  // Determine broadcast phase for appropriate topic selection
  const broadcastPhase = getBroadcastPhase(context)
  
  // ===== STRAND-AWARE EVENT SELECTION =====
  // Build pools of events for each strand, then pick from an unused strand
  
  const strandPools: Record<NarrativeStrand, CommentaryEventType[]> = {
    'VENUE': [],
    'DRIVER': [],
    'TEAM': [],
    'SEASON': [],
    'SESSION': []
  }
  
  // ===== VENUE strand - track talk, weather, conditions =====
  if (!isOnCooldown('TRACK_CHARACTER')) strandPools['VENUE'].push('TRACK_CHARACTER')
  if (context.trackName && !isOnCooldown('CORNER_CALLOUT') && state.playerActivityState === 'FLYING_LAP') {
    strandPools['VENUE'].push('CORNER_CALLOUT') // Only during flying laps
  }
  if (!isOnCooldown('TRACK_EVOLUTION')) strandPools['VENUE'].push('TRACK_EVOLUTION')
  // Only mention weather if it's actually noteworthy (not dry)
  if (context.weatherCondition && context.weatherCondition !== 'dry' && !isOnCooldown('WEATHER_CHANGE')) {
    strandPools['VENUE'].push('WEATHER_CHANGE')
  }
  
  // ===== DRIVER strand - driver background, psychology, expectations =====
  if (!isOnCooldown('DRIVER_BACKGROUND')) strandPools['DRIVER'].push('DRIVER_BACKGROUND')
  if (!isOnCooldown('RANDOM_FACT')) strandPools['DRIVER'].push('RANDOM_FACT')
  // Add color commentary with driver focus if we have driver data
  if (context.totalWins !== undefined || context.totalPodiums !== undefined || context.isRookie) {
    if (!isOnCooldown('COLOR_COMMENTARY')) strandPools['DRIVER'].push('COLOR_COMMENTARY')
  }
  
  // ===== TEAM strand - team dynamics, pressure, sponsors =====
  if (context.teamName && !isOnCooldown('TEAM_INFO')) strandPools['TEAM'].push('TEAM_INFO')
  if (context.teamSatisfactionStatus === 'concerned' || context.teamSatisfactionStatus === 'crisis') {
    if (!isOnCooldown('TEAM_PRESSURE_MENTION')) strandPools['TEAM'].push('TEAM_PRESSURE_MENTION')
  }
  if (context.sponsorPressureLevel === 'moderate' || context.sponsorPressureLevel === 'high') {
    if (!isOnCooldown('SPONSOR_PRESSURE_MENTION')) strandPools['TEAM'].push('SPONSOR_PRESSURE_MENTION')
  }
  // Always allow team color commentary if we have team data
  if (context.teamName && !isOnCooldown('COLOR_COMMENTARY') && !strandPools['DRIVER'].includes('COLOR_COMMENTARY')) {
    strandPools['TEAM'].push('COLOR_COMMENTARY')
  }
  
  // ===== SEASON strand - championship, rivalry, media =====
  if (context.championshipPosition && !isOnCooldown('CHAMPIONSHIP_UPDATE')) strandPools['SEASON'].push('CHAMPIONSHIP_UPDATE')
  if (context.rivalName && !isOnCooldown('RIVALRY_MENTION')) strandPools['SEASON'].push('RIVALRY_MENTION')
  if (context.recentPressClippings && context.recentPressClippings.length > 0 && !isOnCooldown('MEDIA_HEADLINE_CALLBACK')) {
    strandPools['SEASON'].push('MEDIA_HEADLINE_CALLBACK')
  }
  // Add generic season color if we have standings data
  if (context.championshipPosition && !isOnCooldown('COLOR_COMMENTARY') && 
      !strandPools['DRIVER'].includes('COLOR_COMMENTARY') && !strandPools['TEAM'].includes('COLOR_COMMENTARY')) {
    strandPools['SEASON'].push('COLOR_COMMENTARY')
  }
  
  // ===== SESSION strand - general color, trivia, banter =====
  if (!isOnCooldown('TRIVIA_DROP')) strandPools['SESSION'].push('TRIVIA_DROP')
  if (!isOnCooldown('DISAGREEMENT') && Math.random() < 0.35) strandPools['SESSION'].push('DISAGREEMENT')
  // Fallback color commentary for session strand
  if (!isOnCooldown('COLOR_COMMENTARY') && 
      !strandPools['DRIVER'].includes('COLOR_COMMENTARY') && 
      !strandPools['TEAM'].includes('COLOR_COMMENTARY') &&
      !strandPools['SEASON'].includes('COLOR_COMMENTARY')) {
    strandPools['SESSION'].push('COLOR_COMMENTARY')
  }
  
  // ===== SMART STRAND SELECTION =====
  // Instead of mechanical rotation, prioritize based on CONTEXT
  // A real broadcast talks about what's RELEVANT, not random topics
  
  const allStrands: NarrativeStrand[] = ['VENUE', 'DRIVER', 'TEAM', 'SEASON', 'SESSION']
  
  // Calculate strand weights based on current situation
  const strandWeights: Record<NarrativeStrand, number> = {
    'VENUE': 1,
    'DRIVER': 1,
    'TEAM': 1,
    'SEASON': 1,
    'SESSION': 1
  }
  
  // Boost strands based on what's actually happening
  const gapAhead = context.gapAhead || 999
  const gapBehind = context.gapBehind || 999
  const inBattle = gapAhead < 2.0 || gapBehind < 1.5
  const isQuali = context.sessionType === 'Qualifying'
  const isRace = context.sessionType === 'Race'
  const earlySession = broadcastPhase === 'early-session'
  const lateSession = broadcastPhase === 'late-session'
  
  // In a BATTLE - focus on action, rivalry, psychology
  if (inBattle) {
    strandWeights['SEASON'] = 4  // Rivalry talk
    strandWeights['DRIVER'] = 3  // Psychology, pressure
    strandWeights['VENUE'] = 0.5 // Less track talk during battles
    strandWeights['SESSION'] = 0.5
  }
  
  // EARLY session - introductions, background, track
  if (earlySession) {
    strandWeights['VENUE'] = 3    // Track introduction
    strandWeights['DRIVER'] = 2   // Driver background
    strandWeights['TEAM'] = 2     // Team situation
    strandWeights['SESSION'] = 1.5 // What's at stake
  }
  
  // LATE session - championship, pressure, stakes
  if (lateSession) {
    strandWeights['SEASON'] = 4   // Championship implications
    strandWeights['DRIVER'] = 2   // Pressure on the driver
    strandWeights['TEAM'] = 1.5   // Team expectations
    strandWeights['VENUE'] = 0.5  // Less track talk at the end
  }
  
  // Qualifying - strategy and psychological pressure
  if (isQuali) {
    strandWeights['SESSION'] = 2  // Strategy, timing
    strandWeights['DRIVER'] = 1.5 // Mental game
  }
  
  // Race - rivalry and team strategy
  if (isRace) {
    strandWeights['SEASON'] = 2   // Rivalry, standings
    strandWeights['TEAM'] = 1.5   // Pit strategy
  }
  
  // COHERENCE: Reduce weight of strand we just used (but don't block it)
  const lastStrand = recentEventStrands[recentEventStrands.length - 1]
  if (lastStrand) {
    strandWeights[lastStrand] *= 0.3  // 70% less likely to repeat immediately
  }
  
  // Filter to strands that have available events
  const availableStrands = allStrands.filter(s => strandPools[s].length > 0)
  if (availableStrands.length === 0) return
  
  // Weighted random selection
  const totalWeight = availableStrands.reduce((sum, s) => sum + strandWeights[s], 0)
  let random = Math.random() * totalWeight
  
  let selectedStrand: NarrativeStrand = availableStrands[0]
  for (const strand of availableStrands) {
    random -= strandWeights[strand]
    if (random <= 0) {
      selectedStrand = strand
      break
    }
  }
  const strandEvents = strandPools[selectedStrand]
  
  // Pick a random event from that strand
  const eventType = strandEvents[Math.floor(Math.random() * strandEvents.length)]
  
  // Track this strand in history
  recentEventStrands.push(selectedStrand)
  if (recentEventStrands.length > EVENT_STRAND_HISTORY_SIZE) {
    recentEventStrands.shift()
  }
  
  // Log the strand selection
  telemetryLog.stateChange('EVENT_STRAND', recentEventStrands[recentEventStrands.length - 2] || 'None', selectedStrand)
  
  // Add broadcast phase to context so prompts can be phase-aware
  const enrichedContext = { 
    ...context, 
    broadcastPhase,
    hasValidTiming: broadcastPhase !== 'early-session' && broadcastPhase !== 'pre-session'
  }
  
  queueEvent({
    type: eventType,
    context: enrichedContext,
    priority: 'low',
    timestamp: now
  })
  
  markEventTriggered(eventType)
  state.lastColorCommentary = now
}

/**
 * Queue an event for commentary
 * Now includes PLAYER STATE VALIDATION - redirects inappropriate events to fitting alternatives
 * This is the "redirect, not restrict" system - every moment gets colorful commentary,
 * just commentary that matches what's actually happening!
 */
function queueEvent(event: CommentaryEvent): void {
  // Check if commentary is enabled
  if (!state.enabled) return
  
  // ===== SESSION WARMUP CHECK =====
  // During the warmup period after a session starts, only allow SESSION_START events
  // This gives the welcome commentary time to play without interruption
  if (isInSessionWarmup() && event.type !== 'SESSION_START') {
    const elapsed = Date.now() - state.sessionStartedAt
    console.log(`[Commentary] Blocked ${event.type} during warmup (${Math.round(elapsed/1000)}s/${SESSION_WARMUP_MS/1000}s)`)
    return
  }
  
  const now = Date.now()
  
  // ===== BREATHING ROOM / NATURAL PACING =====
  // After consecutive commentary pieces, occasionally allow silence or atmospheric moments
  // This prevents commentary fatigue and makes it feel more like real TV broadcast
  const HIGH_PRIORITY_EVENTS: CommentaryEventType[] = [
    'RACE_START', 'RACE_WIN', 'PODIUM_FINISH', 'RACE_FINISH',
    'OVERTAKE', 'POSITION_LOST', 'FINAL_LAPS', 'FCY_DEPLOYED', 'FCY_ENDING',
    'CONTACT_DETECTED', 'PLAYER_SPINNING', 'FLAG_YELLOW', 'FLAG_DOUBLE_YELLOW',
    'COOLDOWN_LAP', 'POST_RACE_REFLECTION', 'CHAMPIONSHIP_IMPLICATIONS'
  ]
  
  const isHighPriority = HIGH_PRIORITY_EVENTS.includes(event.type) || event.priority === 'high'
  
  // Track consecutive commentary
  state.consecutiveCommentaryCount++
  
  // Reset counter if enough time has passed (natural silence occurred)
  if (now - state.lastBreathingRoom > 45000) { // 45s without commentary = reset
    state.consecutiveCommentaryCount = 0
  }
  
  // After 5+ consecutive pieces, sometimes take a breath (but never skip high priority!)
  if (!isHighPriority && state.consecutiveCommentaryCount >= 5 && event.priority === 'low') {
    const breathingChance = 0.30 // 30% chance to take a breath
    
    if (Math.random() < breathingChance && !isOnCooldown('BREATHING_ROOM')) {
      // Either skip entirely OR convert to breathing room moment
      if (Math.random() < 0.5) {
        // 50%: Just skip - let the racing breathe
        console.log(`[Commentary] Skipping ${event.type} for natural pacing (${state.consecutiveCommentaryCount} consecutive pieces)`)
        state.consecutiveCommentaryCount = 0
        state.lastBreathingRoom = now
        return
      } else {
        // 50%: Convert to breathing room commentary
        console.log(`[Commentary] Converting ${event.type} to BREATHING_ROOM for pacing`)
        event = {
          ...event,
          type: 'BREATHING_ROOM',
          priority: 'low',
          context: {
            ...event.context,
            _redirectedFrom: event.type
          }
        }
        state.consecutiveCommentaryCount = 0
        state.lastBreathingRoom = now
        markEventTriggered('BREATHING_ROOM')
      }
    }
  }
  
  // Check cooldown for this event type
  const lastTime = state.lastEventTime[event.type] || 0
  const cooldown = EVENT_COOLDOWNS[event.type] || 30000 // Default 30s cooldown
  
  if (now - lastTime < cooldown) {
    // Still on cooldown, skip this event
    return
  }
  
  // ===== PLAYER STATE VALIDATION =====
  // Validate event is appropriate for current player activity state
  // If not, REDIRECT to an appropriate alternative (not block!)
  const playerState = state.playerActivityState
  const validation = validateEventForState(event.type, playerState)
  
  // Log the validation decision for debugging
  telemetryLog.eventValidation(event.type, validation.allowed, validation.reason, validation.redirectTo)
  
  let eventToQueue = event
  
  if (!validation.allowed) {
    // Event not appropriate for current state - REDIRECT to alternative
    if (validation.redirectTo) {
      // Check if redirect target is also on cooldown
      const redirectLastTime = state.lastEventTime[validation.redirectTo] || 0
      const redirectCooldown = EVENT_COOLDOWNS[validation.redirectTo] || 30000
      
      if (now - redirectLastTime >= redirectCooldown) {
        // Redirect to appropriate alternative
        eventToQueue = {
          ...event,
          type: validation.redirectTo,
          // Add context about the redirect for smarter prompts
          context: {
            ...event.context,
            _redirectedFrom: event.type,
            _playerState: playerState
          }
        }
        console.log(`[Commentary] Redirected ${event.type} -> ${validation.redirectTo} (player state: ${playerState})`)
      } else {
        // Redirect target also on cooldown - drop the event
        console.log(`[Commentary] Dropped ${event.type} - redirect target ${validation.redirectTo} also on cooldown`)
        return
      }
    } else {
      // No redirect available - drop the event
      console.log(`[Commentary] Dropped ${event.type} - not appropriate for ${playerState} state`)
      return
    }
  }
  
  // Update last event time for the event we're actually queueing
  state.lastEventTime[eventToQueue.type] = now
  
  // Log the event detection
  telemetryLog.eventDetected(eventToQueue.type, {
    priority: eventToQueue.priority,
    position: eventToQueue.context.playerPosition,
    lap: eventToQueue.context.currentLap,
    playerState: playerState,
    wasRedirected: eventToQueue.type !== event.type
  })
  
  // Route to multi-stream queue manager
  // The queue manager handles duplicate checking, stream routing, and expiry
  queueManager.routeEvent(eventToQueue)
}

/**
 * DEPRECATED: Old sequential queue processor
 * This has been replaced by queueManager which handles:
 * - Multi-stream processing (live, status, color)
 * - Stale event expiry
 * - Context refresh with current telemetry
 * - Backlog detection to skip co-commentator
 * - Pre-generation of color commentary
 * 
 * Kept for reference only - all processing now done by queueManager.processNext()
 */
// async function processQueue(): Promise<void> { ... }

/**
 * Determine if co-commentator should respond based on event type
 */
function shouldCoCommentatorRespond(eventType: CommentaryEventType): boolean {
  // Higher chance for exciting events
  const responseChances: Partial<Record<CommentaryEventType, number>> = {
    RACE_START: 0.9,      // Almost always react
    RACE_WIN: 0.95,       // Celebrate together!
    PODIUM_FINISH: 0.85,
    OVERTAKE: 0.6,
    POSITION_LOST: 0.4,
    FASTEST_LAP: 0.7,
    FINAL_LAPS: 0.8,
    POLE_POSITION: 0.85,
    GAP_CLOSING: 0.5,
    BATTLE_FORMING: 0.6,
    COLOR_COMMENTARY: 0.7, // Good for banter
    CHAMPIONSHIP_UPDATE: 0.6,
    RIVALRY_MENTION: 0.75,
    HALFWAY_POINT: 0.5,
    PERSONAL_BEST: 0.5,
    QUALIFYING_ATTEMPT: 0.4,
    // NEW: Milestone celebration events - high response chance!
    MILESTONE_WIN_STREAK: 0.85,     // Co-commentator loves celebrating streaks
    MILESTONE_PODIUM_STREAK: 0.8,
    MILESTONE_COMEBACK: 0.9,        // Great drama to discuss!
    MILESTONE_HAT_TRICK: 0.95,      // Huge achievement - react!
    MILESTONE_GRAND_SLAM: 0.98,     // Rarest achievement - both commentators!
    // Team/Sponsor narratives - moderate chance for discussion
    TEAM_PRESSURE_MENTION: 0.6,     // Good for insightful banter
    SPONSOR_PRESSURE_MENTION: 0.5,  // Occasional commercial discussion
    MEDIA_HEADLINE_CALLBACK: 0.7,   // Co-commentator can add perspective
  }
  
  const chance = responseChances[eventType] ?? 0.35
  return Math.random() < chance
}

/**
 * Handle race completion
 */
export function handleRaceComplete(data: any): void {
  if (!state.enabled) return
  
  const context: EventContext = {
    playerName: state.careerData?.playerName || data.playerName || 'Driver',
    playerPosition: data.playerPosition || 0,
    trackName: data.trackName || 'Unknown Track',
    currentLap: data.lapsCompleted || 0,
    totalLaps: data.lapsCompleted || 0,
    bestLapTime: data.bestLapTime,
    sessionType: data.sessionType || 'Race',
    ...state.careerData
  }
  
  let eventType: CommentaryEventType = 'RACE_FINISH'
  
  if (data.dnf) {
    eventType = 'RACE_FINISH'
  } else if (data.playerPosition === 1) {
    eventType = 'RACE_WIN'
  } else if (data.playerPosition > 0 && data.playerPosition <= 3) {
    eventType = 'PODIUM_FINISH'
  }
  
  queueEvent({
    type: eventType,
    context,
    priority: 'high',
    timestamp: Date.now()
  })
}

/**
 * Handle session completion
 */
export function handleSessionComplete(data: any): void {
  if (!state.enabled) return
  
  const context: EventContext = {
    playerName: state.careerData?.playerName || data.playerName || 'Driver',
    playerPosition: data.playerPosition || 0,
    trackName: data.trackName || 'Unknown Track',
    currentLap: 0,
    totalLaps: 0,
    bestLapTime: data.bestLapTime,
    sessionType: mapSessionType(data.sessionType),
    ...state.careerData
  }
  
  queueEvent({
    type: 'SESSION_END',
    context,
    priority: 'medium',
    timestamp: Date.now()
  })
}

/**
 * Test audio system
 */
export async function testAudio(): Promise<boolean> {
  return testAudioPlayback()
}

/**
 * Get available voices for UI
 */
export function getAvailableVoices(): Array<{ id: string; name: string; description: string }> {
  return [
    { id: 'cmPhBFoVi6Q3CAWAx2Gr', name: 'Brundle', description: 'Co-commentator - Martin Brundle style ⭐' },
    { id: 'V0cljQmo7wpx8LTdbqfJ', name: 'Vicky Cowan', description: 'British female, preppy radio presenter' },
    { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', description: 'British male, steady broadcaster' },
    { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', description: 'British male, warm storyteller' },
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', description: 'British male, warm' },
    { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', description: 'American male, deep narrator' },
    { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', description: 'American male, energetic' },
  ]
}