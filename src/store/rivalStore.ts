import { create } from 'zustand'
import { persist } from 'zustand/middleware'
// NOTE: careerStore and rivalStore have a circular dependency.
// This is safe because both are Zustand stores — the store objects are created at
// module init time, and all cross-store .getState() calls happen at runtime.
import { 
  AMS2_TRACKS,
  getTrackById,
  getTracksFiltered,
  getTracksForCategory,
  selectTracksForCalendar,
  sortTracksByRegionPriority,
  AMS2Track
} from '../data/ams2-tracks'
import {
  type AMS2RealTeam,
  type AMS2Driver,
  type TeamTier,
  getTeamsForClass,
  getTeamsForReputation,
  getModernCarClasses,
  getCarClassById,
  getTeamById as getRealTeamById,
  detectManufacturerId,
  detectProgramType,
  getTeamsByManufacturer,
  findRelatedTeamEntries,
  getCarNameForManufacturer
} from '../data/ams2-teams-real'
import type { ProgramType, RacingProgram as RacingProgramData } from '../data/racing-programs'
import {
  getChampionshipById,
  getAllChampionships,
  isCurrentClass
} from '../data/championships'
import {
  AMS2_RACING_PROGRAMS,
  getProgramById,
  getProgramsByManufacturer,
  getProgramForTeamEntry
} from '../data/racing-programs'
import { AMS2_MANUFACTURERS, getManufacturerById } from '../data/manufacturers'
import {
  getSeriesTerritory,
  getAcceptableGradesForTier,
  getCalendarSettingsForTier,
  getMaxRoundsForTier,
  getIconicTracksForCategory,
  FIXED_VENUE_CHAMPIONSHIPS,
  selectBestLayoutId
} from '../data/calendar-config'
import {
  createAITeamDevelopment,
  updateAITeamDevelopment,
  calculateAITeamModifier,
  resetAITeamForSeason
} from '@/simulation/teamDevelopment'
import type { AITeamDevelopment } from '@/simulation/teamDevelopment'
import type { TeamNarrative } from '@/data/team-narratives'
import { getPointsSystem, getPointsForPosition } from '@/data/points-systems'
import {
  getDriverNarrative,
  getTeamNarrative as getPreGenTeamNarrative,
  isContentLoaded as isPreGenContentLoaded
} from '@/services/preGeneratedContentService'

import { useCareerStore } from './careerStore'

// ============================================
// TYPES
// ============================================

export type Personality = 'aggressive' | 'calculating' | 'inconsistent' | 'steady' | 'flashy' | 'defensive'
export type CareerStage = 'rising' | 'peak' | 'declining' | 'veteran'
export type ContractType = 'race-driver' | 'reserve' | 'test-driver' | 'pay-driver' | 'works-full' | 'spec' | 'customer' | 'factory-supported'
export type ChampionshipType = 'single-class' | 'multi-class' | 'sprint' | 'endurance' | 'mixed' | 'spec-series' | 'national' | 'continental' | 'international' | 'historic' | 'club' | 'endurance-special'

export interface Manufacturer {
  id: string
  name: string
  country: string
  logoUrl?: string
  programs: string[] // program IDs
}

export interface RacingProgram {
  id: string
  name: string
  manufacturerId: string
  type: 'works' | 'customer' | 'spec-series'
  tier: TeamTier
  seriesIds: string[]
  teamIds: string[]
}

export interface RivalStats {
  raceSkill: number
  qualifyingSkill: number
  aggression: number
  defending: number
  consistency: number
  wetSkill: number
  tireManagement: number
  fuelManagement: number
  stamina: number
  startReactions: number
}

export interface RivalDriver {
  id: string
  firstName: string
  lastName: string
  nationality: string
  age: number
  dateOfBirth: string
  personality: Personality
  stats: RivalStats
  peakAge: number
  declineRate: number
  currentTeamId: string
  currentSeriesId: string
  contractEndYear: number
  salary: number
  marketValue: number
  reputation: number
  totalRaces: number
  totalWins: number
  totalPodiums: number
  championships: number
  careerActive: boolean
  relationshipWithPlayer: number
  rivalryIntensity: number
  baseSkill: number
  currentForm: number
  formStreak: number
  developmentRate: number
  careerStage: CareerStage
  seasonStats: { wins: number; podiums: number; points: number; races: number; avgFinish: number; bestFinish: number; dnfs: number }
  trackAffinities: Record<string, number>
  lastRacePosition: number
  weekendForm: number
  narrative?: any
}

export interface TeamDevelopmentEvent {
  teamId: string
  teamName: string
  type: string
  description: string
  modifier: number
  week: number
}

export interface DetailedCarClasses {
  id: string
  name: string
  category: string
  gridSize?: number
}

/** Car class list for grid size lookup; populated from data or left empty to use fallback logic */
const DETAILED_CAR_CLASSES: DetailedCarClasses[] = []

export interface AITeamEconomics {
  /** 0-100 score; display as excellent/good/stable/struggling/critical in UI */
  financialHealth: number
  sponsorTier: 'none' | 'local' | 'regional' | 'national' | 'international' | 'global'
  seasonWins: number
  seasonPodiums: number
  seasonPoints: number
  bestChampionshipPosition: number
  momentum: number  // -100 to 100
  foundedYear: number
  recentPositions: number[]  // Last 5 race positions
}

export interface Team extends AMS2RealTeam {
  country: string
  // Real team data
  liveryNames: string[]
  realDrivers: { name: string; country: string }[]
  // Multi-series program linking
  manufacturerId?: string
  programId?: string
  programType: ProgramType
  relatedEntryIds?: string[]
  // Original base team ID from AMS2 data (before championship prefix)
  baseTeamId: string
  // Team development (AI teams improve over season)
  development?: AITeamDevelopment
  // === AI TEAM ECONOMICS: Dynamic financial simulation ===
  economics?: AITeamEconomics
  // === TV BROADCAST COMMENTARY: Rich narrative data ===
  narrative?: TeamNarrative  // Generated at career creation for commentary depth
  // Runtime fields (set when building world from championships)
  seriesId?: string
  facilities?: 'basic' | 'standard' | 'professional' | 'elite'
  availableSeats?: number
  secondaryColor?: string
  // Player team flag (set when player chose this real team)
  isPlayerTeam?: boolean
}

// Re-export types for convenience
export type { TeamTier }
export type { ProgramType }

export interface Series {
  id: string
  name: string
  shortName: string
  tier: TeamTier
  carClassId: string       // Primary AMS2 car class ID
  carClassName: string     // Human readable name
  category: string         // formula, gt, stock, etc
  teams: string[]          // Team IDs
  calendar: RaceEvent[]
  prizeMoney: {
    win: number
    podium: number
    points: number
  }
  seatCost: number       // Average seat cost for this series (0 if paid driver)
  minReputation: number  // Minimum reputation to be considered
  gridSize: number
  isModern: boolean      // Can be used for full seasons
  // Championship-based fields
  championshipId?: string     // Links to Championship definition
  championshipType?: ChampionshipType
  multiClass: boolean         // If true, multiple car classes race together
  carClassIds: string[]       // All car classes that compete in this series
  region?: string             // Geographic region
  format?: 'sprint' | 'endurance' | 'mixed'
  prestige: number            // 0-100 championship prestige
  prizePool: number           // Total season prize pool
  seasonRounds?: number       // Defined round count from championship data
  seriesCategory?: string     // More specific category from championship (e.g. 'endurance', 'stock-usa', 'gt-sportscar')
  historicEra?: string        // For historic championships
  youtubeId?: string          // Trailer or intro video
}

export interface RaceEvent {
  id: string
  round: number
  trackId: string
  trackName: string
  layoutId: string
  layoutName: string
  country: string
  lengthKm: number
  week: number           // Week of the year
  sessions: {
    practice: boolean
    qualifying: boolean
    race: boolean
    sprintRace: boolean
  }
  weather?: 'dry' | 'rain' | 'variable'  // Weather conditions for the race
}

export interface SeasonStanding {
  driverId: string
  driverName: string
  teamId: string
  teamName: string
  points: number
  wins: number
  podiums: number
  poles: number
  fastestLaps: number
  races: number
  bestFinish: number
  avgFinish: number
  dnfs: number
  position: number
  isPlayer: boolean
}

// Telemetry participant data from UDP
export interface TelemetryParticipant {
  name: string
  position: number
  lapsCompleted: number
  bestLapTime: number
  isPlayer: boolean
}

export type InterestLevel = 'none' | 'watching' | 'interested' | 'very-interested' | 'offering'

export interface TeamInterest {
  teamId: string
  seriesId: string
  level: InterestLevel
  reputationRequired: number
  reputationGap: number      // How much more rep needed
  percentProgress: number    // 0-100 progress toward offer
}

// Assignment details for a specific team entry
export interface TeamEntryAssignment {
  entryId: string           // Team entry ID (e.g., 'lmdh-bmw-m-hybrid-v8--25--imsa-2024-')
  entryName: string         // Display name (e.g., "BMW M Hybrid V8 #25 (IMSA 2024)")
  carName: string           // Car name (e.g., "BMW M Hybrid V8")
  carClassId: string        // Car class ID for lookup
  seriesId: string          // Series ID
  seriesName: string        // Series display name
  reason?: string           // Why this assignment (e.g., "Your reputation exceeds current driver")
}

// Summary of a team entry for display
export interface TeamEntrySummary {
  entryId: string
  entryName: string
  carName: string
  seriesId: string
  seriesName: string
  currentDriverName?: string
  currentDriverRep?: number
}

// Full entry info for reassignment logic
export interface ProgramEntryInfo {
  entryId: string
  entryName: string
  carName: string
  carClassId: string
  seriesId: string
  seriesName: string
  tier: TeamTier
  currentDriverName?: string
  currentDriverRep?: number
}

// Mid-season reassignment result
export interface MidSeasonReassignment {
  reason: 'injury-cover' | 'strategic'
  oldEntryId: string
  oldEntryName: string
  newEntryId: string
  newEntryName: string
  newCarName: string
  newCarClassId: string
  newSeriesId: string
  newSeriesName: string
  duration: 'temporary' | 'remainder-of-season'  // Temporary = just for one race, remainder = rest of season
  injuredDriverName?: string
}

export type OfferType = 'works-program' | 'spec-series-team' | 'customer-team'

export interface ContractOffer {
  // Base identification
  teamId: string            // For backwards compatibility - primary team entry
  seriesId: string          // For backwards compatibility - primary series
  teamName: string
  seriesName: string
  
  // Financial terms
  salary: number            // Per race
  bonusPerWin: number
  bonusPerPodium: number
  seatCost: number          // One-time payment if pay driver
  duration: number          // Seasons
  expiresWeek: number
  interestLevel: InterestLevel
  
  // NEW: Contract type determines assignment behavior
  offerType: OfferType
  
  // For works-program offers:
  programId?: string                      // Program ID (e.g., 'bmw-m-motorsport-lmdh')
  programName?: string                    // Display name (e.g., "BMW M Motorsport")
  manufacturerId?: string
  programType?: ProgramType
  likelyAssignment?: TeamEntryAssignment  // What they'll probably assign you
  allProgramEntries?: TeamEntrySummary[]  // All entries in the program (for display)
  
  // For spec-series-team and customer-team offers:
  fixedAssignment?: TeamEntryAssignment   // The specific assignment (guaranteed)
  
  // Buyout offers (when player is under contract)
  isBuyoutOffer?: boolean       // True if this requires buying out current contract
  buyoutCost?: number           // What they pay your current team (release clause)
  signingBonus?: number         // What you receive from the buyout
  effectiveDate?: 'immediate' | 'next_season'  // When contract starts
  
  // ============================================
  // ENHANCED CONTRACT TERMS
  // ============================================
  
  // Performance Targets (what the team expects)
  hasPerformanceTargets?: boolean
  targetSummary?: string[]              // Brief summary for offer display (e.g., "Top 5 in championship")
  
  // Renewal Options
  hasAutoRenewal?: boolean
  renewalCondition?: string             // Human readable (e.g., "Auto-renews if you finish top 3")
  hasTeamOption?: boolean
  hasPlayerOption?: boolean
  
  // Termination Conditions
  hasPerformanceClause?: boolean        // Can be fired for poor performance
  dnfLimit?: number                     // Max DNFs before consequences
  
  // Media Duties
  hasMediaDuties?: boolean
  mediaDutySummary?: string             // Human readable (e.g., "4 press conferences, 8 social posts")
  
  // Tier info for generating full contract terms
  teamTier?: TeamTier
  totalRaces?: number
  gridSize?: number
  
  // Legacy fields for backwards compatibility
  contractType?: ContractType
  availableSeriesIds?: string[]
  selectedSeriesIds?: string[]
}

interface RivalStore {
  // State
  rivals: RivalDriver[]
  teams: Team[]
  series: Series[]
  seasonStandings: Record<string, SeasonStanding[]> // seriesId -> standings
  pendingContractOffers: ContractOffer[]
  
  // Actions
  initializeWorld: () => void
  resetWorld: () => void
  addRival: (rival: RivalDriver) => void
  updateRival: (id: string, updates: Partial<RivalDriver>) => void
  updateHiredDriverSkills: (driverId: string, skillBoosts: Record<string, number>) => void
  retireRival: (id: string) => void
  generateRookie: (seriesId: string) => RivalDriver
  simulateTransferWindow: () => void
  updateStandings: (seriesId: string, standings: SeasonStanding[]) => void
  updateStandingsFromRace: (seriesId: string, raceResults: TelemetryParticipant[], playerName: string, sessionType?: string) => void
  getStandings: (seriesId: string) => SeasonStanding[]
  resetStandingsRaceCount: (seriesId: string, actualRaceCount: number) => void
  resetSeasonStandings: () => void // Reset all standings for new season
  simulateOtherSeries: (currentWeek: number, excludedSeries: string | null | string[]) => void
  simulateRaceForSeries: (seriesId: string, round: number) => void
  getRivalsInSeries: (seriesId: string) => RivalDriver[]
  getTeamsInSeries: (seriesId: string) => Team[]
  
  // Contract system
  generateCalendar: (seriesId: string, year: number) => RaceEvent[]
  repairSeriesCalendar: (seriesId: string, year: number) => RaceEvent[]
  regenerateAllCalendars: (year: number) => void // Regenerate calendars for new season
  updateRoundTrack: (seriesId: string, round: number, trackId: string, layoutId: string) => void
  addRound: (seriesId: string, trackId: string, layoutId: string, week: number) => void
  removeRound: (seriesId: string, round: number) => void
  getAvailableSeriesForPlayer: (reputation: number) => Series[]
  calculateTeamInterest: (teamId: string, playerReputation: number, recentWins?: number) => TeamInterest
  getAllTeamInterests: (playerReputation: number, recentWins?: number) => TeamInterest[]
  generateContractOffers: (playerId: string, playerReputation: number, recentWins?: number) => ContractOffer[]
  acceptContract: (offer: ContractOffer) => void
  declineContract: (offer: ContractOffer) => void
  clearExpiredOffers: (currentWeek: number) => void
  getTeamById: (teamId: string) => Team | undefined
  getSeriesById: (seriesId: string) => Series | undefined
  
  // Manufacturer & Program system (data from manufacturers + racing-programs)
  getManufacturers: () => import('../data/manufacturers').Manufacturer[]
  getManufacturer: (id: string) => import('../data/manufacturers').Manufacturer | undefined
  getPrograms: () => RacingProgramData[]
  getProgram: (id: string) => RacingProgramData | undefined
  getProgramsForManufacturer: (manufacturerId: string) => RacingProgramData[]
  getTeamsForProgram: (programId: string) => Team[]
  getSeriesForProgram: (programId: string) => Series[]
  /** Get all entries in a program with full data for reassignment logic */
  getProgramEntries: (programId: string | undefined) => ProgramEntryInfo[]
  /** Check for mid-season injury cover opportunity for works drivers */
  checkMidSeasonReassignment: (programId: string | undefined, currentEntryId: string, playerReputation: number) => MidSeasonReassignment | null
  
  // Team categorization for contract offers
  categorizeTeamForOffer: (team: Team) => OfferType
  getWorksPrograms: () => RacingProgramData[]
  getSpecSeriesTeams: () => Team[]
  getCustomerTeams: () => Team[]
  getTeamPrimaryDriver: (teamId: string) => RivalDriver | undefined
  evaluatePlayerFit: (team: Team, playerReputation: number) => { canOffer: boolean; role: 'race-driver' | 'reserve'; reason: string } | null
  
  // Calendar conflict / DNS handling
  recordPlayerDNS: (seriesId: string, playerName: string, round: number, reason: 'conflict' | 'injury' | 'other') => void
  
  // === Form & Development System ===
  calculateWeekendForm: (driverId: string, trackId: string) => number
  updateFormAfterRace: (driverId: string, position: number, gridSize: number) => void
  updateDriversAfterSeason: (seriesId: string) => void
  runTransferWindow: (currentYear: number) => TransferNews[]
  
  // === AI Team Economics Simulation ===
  initializeTeamEconomics: () => void
  updateTeamSeasonStats: (seriesId: string, standings: SeasonStanding[]) => void
  processTeamEconomicsEndOfSeason: (currentYear: number) => TeamEconomicsNews[]
  
  // === TV Broadcast Commentary: Narrative System ===
  generateNarrativesForSeries: (
    seriesId: string, 
    apiKey: string,
    onProgress?: (progress: { total: number; completed: number; status: string }) => void
  ) => Promise<void>
  hasNarrativesGenerated: (seriesId: string) => boolean
  getNarrativeGenerationStatus: () => { total: number; generated: number; pending: string[] }
  
  // Migration helpers for existing careers (DRIVER narratives)
  needsNarrativeMigration: () => boolean
  migrateNarrativesForAllSeries: (
    apiKey: string,
    onProgress?: (seriesName: string, progress: number) => void
  ) => Promise<void>
  
  // === TV Broadcast Commentary: TEAM Narrative System ===
  generateTeamNarrativesForSeries: (
    seriesId: string, 
    apiKey: string,
    onProgress?: (progress: { total: number; completed: number; status: string }) => void
  ) => Promise<void>
  hasTeamNarrativesGenerated: (seriesId: string) => boolean
  needsTeamNarrativeMigration: () => boolean
  migrateTeamNarrativesForAllSeries: (
    apiKey: string,
    onProgress?: (seriesName: string, progress: number) => void
  ) => Promise<void>
  
  // Series data migration (points systems, categories)
  needsSeriesDataMigration: () => boolean
  migrateSeriesData: () => { seriesUpdated: number; message: string }
  recalculateStandingsWithNewPoints: (seriesId: string) => { success: boolean; message: string; oldLeaderPoints?: number; newLeaderPoints?: number }
  
  generateSeasonRookies: (currentYear: number) => RivalDriver[]
  getDriversWithForm: (seriesId: string, trackId: string) => Array<RivalDriver & { effectiveSkill: number; teamDevBonus: number }>
  prepareRaceWeekend: (seriesId: string, trackId: string) => void
  
  // === Team Development System ===
  teamDevelopmentEvents: TeamDevelopmentEvent[]  // Recent AI team development events
  initializeTeamDevelopment: () => void
  updateAllTeamDevelopment: (currentWeek: number) => TeamDevelopmentEvent[]
  getTeamDevelopmentModifier: (teamId: string) => number
  
  // === Background Narrative Generation (persists across navigation) ===
  backgroundNarrativeGeneration: {
    isRunning: boolean
    currentSeries: string | null
    progress: number  // 0-1
    error: string | null
  }
  startBackgroundNarrativeGeneration: (apiKey: string) => void
  getBackgroundNarrativeStatus: () => { isRunning: boolean; currentSeries: string | null; progress: number; error: string | null }
  
  // === Background TEAM Narrative Generation (persists across navigation) ===
  backgroundTeamNarrativeGeneration: {
    isRunning: boolean
    currentSeries: string | null
    progress: number  // 0-1
    error: string | null
  }
  startBackgroundTeamNarrativeGeneration: (apiKey: string) => void
  getBackgroundTeamNarrativeStatus: () => { isRunning: boolean; currentSeries: string | null; progress: number; error: string | null }
  getTeamDevelopmentRanking: (seriesId: string) => Array<{ teamId: string; teamName: string; totalPoints: number; weeklyGain: number }>
  resetAllTeamDevelopmentForSeason: () => void
  
  // === Economy Fixes ===
  fixAllTeamEconomics: () => { teamsFixed: number; message: string }
}

// Transfer news for end-of-season reporting
export interface TransferNews {
  type: 'promotion' | 'demotion' | 'retirement' | 'rookie' | 'team_change' | 'contract_renewal'
  driverName: string
  fromTeam?: string
  toTeam?: string
  fromSeries?: string
  toSeries?: string
  headline: string
}

// Team economics news for end-of-season reporting
export interface TeamEconomicsNews {
  type: 'sponsor_upgrade' | 'sponsor_downgrade' | 'sponsor_lost' | 'sponsor_gained' | 
        'facility_upgrade' | 'facility_downgrade' | 'budget_increase' | 'budget_decrease' |
        'prestige_rise' | 'prestige_fall' | 'financial_crisis' | 'investment_boost'
  teamName: string
  seriesName: string
  oldValue?: string
  newValue?: string
  headline: string
}

// Helper constants for team economics
const SPONSOR_TIERS: Array<AITeamEconomics['sponsorTier']> = ['none', 'local', 'regional', 'national', 'international', 'global']
const FACILITY_LEVELS: Array<NonNullable<Team['facilities']>> = ['basic', 'standard', 'professional', 'elite']
const BUDGET_LEVELS: Array<Team['budget']> = ['low', 'medium', 'high', 'factory']

export const useRivalStore = create<RivalStore>()(
  persist(
    (set, get) => ({
      rivals: [],
      teams: [],
      series: [],
      seasonStandings: {},
      pendingContractOffers: [],
      teamDevelopmentEvents: [],
      
      // Background narrative generation state (drivers)
      backgroundNarrativeGeneration: {
        isRunning: false,
        currentSeries: null,
        progress: 0,
        error: null
      },
      
      // Background TEAM narrative generation state
      backgroundTeamNarrativeGeneration: {
        isRunning: false,
        currentSeries: null,
        progress: 0,
        error: null
      },

      resetWorld: () => {
        set({
          rivals: [],
          teams: [],
          series: [],
          seasonStandings: {},
          pendingContractOffers: []
        })
      },

      initializeWorld: () => {
        // Initialize with championship definitions from championships.ts
        const championships = getAllChampionships()
        
        // Create series from championship definitions
        const allSeries: Series[] = []
        const allTeams: Team[] = []
        
        championships.forEach(championship => {
          // Get teams for all car classes in this championship
          const championshipTeams: AMS2RealTeam[] = []
          championship.carClassIds.forEach(classId => {
            const classTeams = getTeamsForClass(classId)
            championshipTeams.push(...classTeams)
          })
          
          if (championshipTeams.length === 0) {
            console.log(`[World] Skipping ${championship.name} - no teams found for classes: ${championship.carClassIds.join(', ')}`)
            return
          }
          
          // Get primary car class info
          const primaryClassId = championship.carClassIds[0]
          const primaryClass = getCarClassById(primaryClassId)
          
          // Create series from championship
          const series: Series = {
            id: championship.id,
            name: championship.name,
            shortName: championship.shortName,
            tier: championship.tier,
            carClassId: primaryClassId,
            carClassName: primaryClass?.name || primaryClassId,
            category: getCategoryForClass(primaryClassId),
            teams: [],
            calendar: [],
            prizeMoney: getPrizeMoneyFromPrizePool(championship.prizePool, championship.tier),
            seatCost: getSeatCostForTier(championship.tier),
            minReputation: getMinReputationForTier(championship.tier),
            gridSize: calculateGridSize(championshipTeams, championship.multiClass, primaryClassId),
            isModern: isCurrentClass(primaryClassId),
            // Championship-based fields
            championshipId: championship.id,
            championshipType: championship.type,
            multiClass: championship.multiClass,
            carClassIds: championship.carClassIds,
            region: championship.region,
            format: championship.format,
            prestige: championship.prestige,
            prizePool: championship.prizePool,
            seasonRounds: championship.seasonRounds,
            seriesCategory: championship.seriesCategory,
            historicEra: championship.historicEra,
            youtubeId: championship.youtubeId
          }
          
          // Track teams processed within THIS championship to avoid multiclass duplicates
          // (e.g., if a team somehow appears in both GT3 and GT4 within same championship)
          const processedInThisChampionship = new Set<string>()
          
          // Create teams from real data - each championship gets its own team entries
          // KEY CHANGE: Split teams by livery so each "seat" is a separate team entry
          championshipTeams.forEach(realTeam => {
            // Skip duplicates within the same championship (multiclass edge case)
            if (processedInThisChampionship.has(realTeam.id)) {
              return
            }
            processedInThisChampionship.add(realTeam.id)
            
            // Detect manufacturer and program info
            const manufacturerId = detectManufacturerId(realTeam.name)
            const detectedType = detectProgramType(realTeam.name)
            // Map detected type to ProgramType (detectProgramType returns 'works' | 'customer' | 'spec-series')
            const programType: ProgramType = detectedType === 'works' ? 'works' : detectedType === 'spec-series' ? 'spec-series' : 'customer'
            const program = getProgramForTeamEntry(realTeam.id)
            const relatedEntries = findRelatedTeamEntries(realTeam.id)
            const relatedEntryIds = relatedEntries.map(entry => entry.id)
            
            // Determine how many seat entries to create
            // Use the minimum of liveries and drivers (each seat needs both)
            const numSeats = Math.min(
              realTeam.liveryNames.length,
              Math.max(realTeam.drivers.length, 1)
            )
            
            // For spec series OR teams with multiple liveries, create individual seat entries
            const shouldSplitByLivery = programType === 'spec-series' || realTeam.liveryNames.length > 1
            
            if (shouldSplitByLivery && numSeats > 0) {
              // Create one team entry per seat/livery
              for (let seatIdx = 0; seatIdx < numSeats; seatIdx++) {
                const liveryName = realTeam.liveryNames[seatIdx] || realTeam.liveryNames[0]
                const driver = realTeam.drivers[seatIdx] || realTeam.drivers[0]
                const carNumber = extractCarNumber(liveryName)
                
                // Generate team name based on program type
                let teamName: string
                let shortName: string
                
                if (programType === 'spec-series') {
                  // For spec series: generate team name from driver
                  const generated = generateSpecSeriesTeamName(driver?.name || 'Unknown', liveryName)
                  teamName = generated.name
                  shortName = generated.shortName
                } else {
                  // For other teams: use original team name with car number
                  teamName = realTeam.name
                  shortName = carNumber ? `#${carNumber}` : realTeam.shortName
                }
                
                // Create unique team ID for this specific seat
                const seatTeamId = `${championship.id}-${realTeam.id}-seat${seatIdx}`
                
                const team: Team = {
                  id: seatTeamId,
                  name: teamName,
                  shortName: shortName,
                  color: programType === 'spec-series' ? generateTeamColor(teamName) : realTeam.color,
                  secondaryColor: '#ffffff',
                  seriesId: championship.id,
                  carClassId: realTeam.carClassId,
                  carClassName: realTeam.carClassName,
                  tier: realTeam.tier,
                  budget: programType === 'spec-series' ? 'medium' : realTeam.budget,
                  prestige: Math.max(30, realTeam.prestige - (seatIdx * 2)), // Slight variation
                  facilities: getFacilitiesForBudget(realTeam.budget),
                  drivers: [],
                  availableSeats: 1, // Each seat entry has exactly 1 seat
                  reputationRequired: Math.max(0, realTeam.reputationRequired - (seatIdx * 1)),
                  // Use tier-based economics WITH VARIATION based on prestige
                  payDriver: !['elite', 'pinnacle'].includes(realTeam.tier), // Elite/pinnacle pay the driver
                  seatCost: calculateSeatCostWithVariation(realTeam.tier, Math.max(30, realTeam.prestige - (seatIdx * 2)), hashString(seatTeamId)),
                  salaryRange: calculateSalaryRangeWithVariation(realTeam.tier, Math.max(30, realTeam.prestige - (seatIdx * 2))),
                  country: realTeam.country,
                  // SINGLE livery for this seat
                  liveryNames: [liveryName],
                  // SINGLE driver for this seat  
                  realDrivers: driver ? [driver] : [],
                  // Multi-series program linking
                  manufacturerId,
                  programId: program?.id,
                  programType,
                  relatedEntryIds: relatedEntryIds.length > 0 ? relatedEntryIds : undefined,
                  // Store the original team ID for program lookups
                  baseTeamId: realTeam.id
                }
                
                allTeams.push(team)
                series.teams.push(team.id)
              }
            } else {
              // Fallback: create single team entry (for teams with just 1 livery)
              const teamIdForChampionship = `${championship.id}-${realTeam.id}`
              
              const team: Team = {
                id: teamIdForChampionship,
                name: realTeam.name,
                shortName: realTeam.shortName,
                color: realTeam.color,
                secondaryColor: '#ffffff',
                seriesId: championship.id,
                carClassId: realTeam.carClassId,
                carClassName: realTeam.carClassName,
                tier: realTeam.tier,
                budget: realTeam.budget,
                prestige: realTeam.prestige,
                facilities: getFacilitiesForBudget(realTeam.budget),
                drivers: [],
                availableSeats: 1,
                reputationRequired: realTeam.reputationRequired,
                // Use tier-based economics WITH VARIATION based on prestige
                payDriver: !['elite', 'pinnacle'].includes(realTeam.tier), // Elite/pinnacle pay the driver
                seatCost: calculateSeatCostWithVariation(realTeam.tier, realTeam.prestige, hashString(teamIdForChampionship)),
                salaryRange: calculateSalaryRangeWithVariation(realTeam.tier, realTeam.prestige),
                country: realTeam.country,
                liveryNames: realTeam.liveryNames.slice(0, 1), // Take first livery only
                realDrivers: realTeam.drivers.slice(0, 1), // Take first driver only
                // Multi-series program linking
                manufacturerId,
                programId: program?.id,
                programType,
                relatedEntryIds: relatedEntryIds.length > 0 ? relatedEntryIds : undefined,
                baseTeamId: realTeam.id
              }
              
              allTeams.push(team)
              series.teams.push(team.id)
            }
          })
          
          allSeries.push(series)
        })
        
        // Generate calendars for each series
        const currentYear = new Date().getFullYear()
        const seriesWithCalendars = allSeries.map(s => ({
          ...s,
          calendar: generateCalendarForSeries(s, currentYear)
        }))
        
        // Generate rival drivers from real driver data
        const allRivals = generateRivalsFromTeams(allTeams)
        
        console.log(`[World] Initialized ${seriesWithCalendars.length} championships, ${allTeams.length} teams, ${allRivals.length} drivers`)
        console.log(`[World] Multi-class championships: ${seriesWithCalendars.filter(s => s.multiClass).map(s => s.name).join(', ')}`)
        
        set({
          series: seriesWithCalendars,
          teams: allTeams,
          rivals: allRivals,
          pendingContractOffers: []
        })
        
        // Initialize team economics for dynamic simulation
        get().initializeTeamEconomics()
      },

      addRival: (rival) => {
        set((state) => ({
          rivals: [...state.rivals, rival]
        }))
      },

      updateRival: (id, updates) => {
        set((state) => ({
          rivals: state.rivals.map(r => 
            r.id === id ? { ...r, ...updates } : r
          )
        }))
      },
      
      // Update hired driver skills based on training boosts from careerStore
      updateHiredDriverSkills: (driverId, skillBoosts) => {
        const { rivals } = get()
        const driver = rivals.find(r => r.id === driverId)
        
        if (!driver) {
          console.log('[RivalStore] updateHiredDriverSkills: Driver not found:', driverId)
          return
        }
        
        // Calculate overall skill boost from individual skill changes
        // Skills in skillBoosts: raceSkill, qualifyingSkill, consistency, wetSkill, defending, aggression, stamina
        const skillWeights: Record<string, number> = {
          raceSkill: 0.25,
          qualifyingSkill: 0.15,
          consistency: 0.20,
          wetSkill: 0.10,
          defending: 0.15,
          aggression: 0.05,
          stamina: 0.10
        }
        
        let totalBoost = 0
        for (const [skill, boost] of Object.entries(skillBoosts)) {
          const weight = skillWeights[skill] || 0.1
          totalBoost += (boost || 0) * weight
        }
        
        // Apply to baseSkill with cap at potential ceiling
        // Note: potentialCeiling isn't directly on RivalDriver, so we estimate it
        const estimatedCeiling = Math.min(1.0, driver.baseSkill + (driver.developmentRate || 0.01) * 20)
        const newBaseSkill = Math.min(estimatedCeiling, Math.max(0.1, driver.baseSkill + totalBoost))
        
        // Update the driver's base skill
        // Also update individual stats for immediate UI reflection
        const updatedStats = { ...driver.stats }
        for (const [skill, boost] of Object.entries(skillBoosts)) {
          if (skill in updatedStats && typeof boost === 'number') {
            const currentVal = (updatedStats as any)[skill] || 0.5
            ;(updatedStats as any)[skill] = Math.min(1.0, Math.max(0.1, currentVal + boost))
          }
        }
        
        set((state) => ({
          rivals: state.rivals.map(r => 
            r.id === driverId 
              ? { 
                  ...r, 
                  baseSkill: newBaseSkill,
                  stats: updatedStats,
                  // Also slightly improve development rate for drivers who are actively training
                  developmentRate: Math.min(0.035, (r.developmentRate || 0.01) * 1.02)
                } 
              : r
          )
        }))
        
        const skillChange = newBaseSkill - driver.baseSkill
        console.log(`[RivalStore] Updated hired driver ${driverId} skills: baseSkill ${driver.baseSkill.toFixed(3)} -> ${newBaseSkill.toFixed(3)} (${skillChange >= 0 ? '+' : ''}${skillChange.toFixed(3)})`)
        console.log(`[RivalStore] Individual stat boosts applied:`, Object.entries(skillBoosts).filter(([_, v]) => v !== 0).map(([k, v]) => `${k}: ${v > 0 ? '+' : ''}${v.toFixed(3)}`).join(', '))
      },

      retireRival: (id) => {
        set((state) => ({
          rivals: state.rivals.map(r =>
            r.id === id ? { ...r, careerActive: false, retirementYear: new Date().getFullYear() } : r
          )
        }))
      },

      generateRookie: (seriesId) => {
        return generateRandomRival(seriesId, 18 + Math.floor(Math.random() * 4))
      },

      simulateTransferWindow: () => {
        const { rivals, teams } = get()
        console.log('Transfer window simulation', rivals.length, teams.length)
      },

      updateStandings: (seriesId, standings) => {
        set((state) => ({
          seasonStandings: {
            ...state.seasonStandings,
            [seriesId]: standings
          }
        }))
      },

      updateStandingsFromRace: (seriesId, raceResults, playerName, sessionType = 'Race') => {
        // Only process actual race sessions, not Practice or Qualifying
        const isActualRace = sessionType === 'Race' || sessionType === 'race' || !sessionType
        if (!isActualRace && sessionType !== 'simulated') {
          console.log(`[RivalStore] Skipping standings update for non-race session: ${sessionType}`)
          return
        }
        
        const { seasonStandings, series } = get()
        const currentStandings = seasonStandings[seriesId] || []
        const currentSeries = series.find(s => s.id === seriesId)
        
        // Get dynamic points system for this series
        const championship = currentSeries?.championshipId 
          ? getChampionshipById(currentSeries.championshipId) 
          : null
        const pointsSystem = getPointsSystem(championship?.pointsSystemId || 'standard')
        
        // Determine who got the fastest lap (lowest bestLapTime > 0)
        const validLaps = raceResults.filter(r => r.bestLapTime > 0 && r.lapsCompleted > 0)
        const fastestLapDriver = validLaps.length > 0
          ? validLaps.reduce((fastest, r) => r.bestLapTime < fastest.bestLapTime ? r : fastest)
          : null
        const fastestLapBonus = pointsSystem.fastestLap || 0
        
        // Process each participant's result
        const updatedStandings = [...currentStandings]
        
        raceResults.forEach(result => {
          let points = getPointsForPosition(pointsSystem, result.position)
          const isWin = result.position === 1
          const isPodium = result.position <= 3
          const isDNF = result.lapsCompleted === 0 && result.position > 10
          const hasFastestLap = fastestLapDriver?.name === result.name && fastestLapBonus > 0
          
          // Add fastest lap bonus points
          if (hasFastestLap && result.position <= 10) {
            points += fastestLapBonus
          }
          
          // Find existing standing or create new one
          let standing = updatedStandings.find(s => s.driverName === result.name)
          
          if (standing) {
            // Update existing standing
            standing.points += points
            standing.races += 1
            standing.wins += isWin ? 1 : 0
            standing.podiums += isPodium ? 1 : 0
            standing.fastestLaps += hasFastestLap ? 1 : 0
            standing.dnfs += isDNF ? 1 : 0
            standing.bestFinish = Math.min(standing.bestFinish, result.position)
            standing.avgFinish = ((standing.avgFinish * (standing.races - 1)) + result.position) / standing.races
          } else {
            // Create new standing entry
            const newStanding: SeasonStanding = {
              driverId: `driver_${result.name.replace(/\s+/g, '_').toLowerCase()}`,
              driverName: result.name,
              teamId: 'unknown',
              teamName: currentSeries?.name || 'Unknown',
              points,
              wins: isWin ? 1 : 0,
              podiums: isPodium ? 1 : 0,
              poles: 0,
              fastestLaps: hasFastestLap ? 1 : 0,
              races: 1,
              bestFinish: result.position,
              avgFinish: result.position,
              dnfs: isDNF ? 1 : 0,
              position: 0, // Will be calculated below
              isPlayer: result.isPlayer || result.name === playerName
            }
            updatedStandings.push(newStanding)
          }
        })
        
        // Sort by points and assign positions
        updatedStandings.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points
          if (b.wins !== a.wins) return b.wins - a.wins
          return a.avgFinish - b.avgFinish
        })
        
        updatedStandings.forEach((standing, index) => {
          standing.position = index + 1
        })
        
        console.log(`[RivalStore] Updated standings for ${seriesId}: ${updatedStandings.length} drivers, leader: ${updatedStandings[0]?.driverName} (${updatedStandings[0]?.points} pts)`)
        
        set((state) => ({
          seasonStandings: {
            ...state.seasonStandings,
            [seriesId]: updatedStandings
          }
        }))
      },

      getStandings: (seriesId) => {
        const { seasonStandings } = get()
        return seasonStandings[seriesId] || []
      },

      resetStandingsRaceCount: (seriesId, actualRaceCount) => {
        const standings = get().seasonStandings[seriesId] || []
        
        if (standings.length === 0) {
          console.log(`[RivalStore] No standings found for series ${seriesId}`)
          return
        }
        
        console.log(`[RivalStore] HARD RESETTING standings for ${seriesId}`)
        
        // Get dynamic points system for this series
        const currentSeries = get().getSeriesById(seriesId)
        const championship = currentSeries?.championshipId 
          ? getChampionshipById(currentSeries.championshipId) 
          : null
        const pointsSystem = getPointsSystem(championship?.pointsSystemId || 'standard')
        
        // HARD RESET: Clear all accumulated stats - they're too corrupted to scale
        // We'll rebuild points based on current position assuming fair distribution
        const numDrivers = standings.length
        
        const fixedStandings = standings.map((s, idx) => {
          // Assign points based on rough position estimate
          // First, get current position (1-indexed)
          const currentPos = s.position || idx + 1
          
          // For player, we'll recalculate from actual race history later
          // For AI, estimate points based on average position over actualRaceCount
          let estimatedPoints = 0
          let estimatedWins = 0
          let estimatedPodiums = 0
          
          if (s.isPlayer) {
            // Player points will be recalculated from actual race history
            // Just keep a reasonable estimate for now
            const playerRaceHistory = useCareerStore.getState().player?.raceHistory || []
            const seasonRaces = playerRaceHistory.filter((r: { seriesId: string }) => r.seriesId === seriesId)
            
            estimatedPoints = seasonRaces.reduce((sum: number, r: { points: number }) => sum + r.points, 0)
            estimatedWins = seasonRaces.filter((r: { racePosition: number }) => r.racePosition === 1).length
            estimatedPodiums = seasonRaces.filter((r: { racePosition: number }) => r.racePosition <= 3).length
          } else {
            // For AI: estimate based on their grid position and reasonable distribution
            // Top drivers get more points, distributed reasonably
            const gridSlot = currentPos
            const avgFinishPos = Math.min(numDrivers, gridSlot + Math.floor(Math.random() * 3) - 1)
            const pointsPerRace = getPointsForPosition(pointsSystem, avgFinishPos)
            estimatedPoints = pointsPerRace * actualRaceCount
            
            // Estimate wins/podiums based on finishing position
            if (avgFinishPos <= 3) {
              estimatedPodiums = Math.min(actualRaceCount, Math.floor(actualRaceCount * 0.5))
              estimatedWins = avgFinishPos === 1 ? Math.floor(actualRaceCount * 0.3) : 0
            }
          }
          
          return {
            ...s,
            races: actualRaceCount,
            wins: estimatedWins,
            podiums: estimatedPodiums,
            points: estimatedPoints,
            bestFinish: s.bestFinish || currentPos,
            averagePosition: currentPos,
            totalPositions: currentPos * actualRaceCount
          }
        })
        
        // Re-sort by points and reassign positions
        fixedStandings.sort((a, b) => b.points - a.points)
        fixedStandings.forEach((s, idx) => {
          s.position = idx + 1
        })
        
        set(state => ({
          seasonStandings: {
            ...state.seasonStandings,
            [seriesId]: fixedStandings
          }
        }))
      },

      resetSeasonStandings: () => {
        const { series, teams, rivals } = get()
        console.log(`[RivalStore] Resetting all championship standings for new season`)
        
        // Create fresh standings for each series
        const freshStandings: Record<string, SeasonStanding[]> = {}
        
        series.forEach(s => {
          // Get all drivers in this series
          const seriesTeams = teams.filter(t => t.seriesId === s.id)
          const seriesDrivers = rivals.filter(r => r.currentSeriesId === s.id && r.careerActive)
          
          // Build initial standings with all drivers at 0 points
          const initialStandings: SeasonStanding[] = []
          
          // Add rival drivers
          seriesDrivers.forEach((driver, idx) => {
            const team = seriesTeams.find(t => t.id === driver.currentTeamId)
            initialStandings.push({
              driverId: driver.id,
              driverName: `${driver.firstName} ${driver.lastName}`,
              teamId: driver.currentTeamId,
              teamName: team?.name || 'Unknown',
              points: 0,
              wins: 0,
              podiums: 0,
              poles: 0,
              fastestLaps: 0,
              races: 0,
              bestFinish: 0,
              avgFinish: 0,
              dnfs: 0,
              position: idx + 1,
              isPlayer: false
            })
          })
          
          // Also include any real team drivers not in rivals list
          seriesTeams.forEach(team => {
            team.realDrivers?.forEach(rd => {
              const alreadyInStandings = initialStandings.some(
                st => st.driverName === rd.name || st.driverId === rd.name
              )
              if (!alreadyInStandings) {
                initialStandings.push({
                  driverId: rd.name,
                  driverName: rd.name,
                  teamId: team.id,
                  teamName: team.name,
                  points: 0,
                  wins: 0,
                  podiums: 0,
                  poles: 0,
                  fastestLaps: 0,
                  races: 0,
                  bestFinish: 0,
                  avgFinish: 0,
                  dnfs: 0,
                  position: initialStandings.length + 1,
                  isPlayer: false
                })
              }
            })
          })
          
          if (initialStandings.length > 0) {
            freshStandings[s.id] = initialStandings
            console.log(`[RivalStore] Reset standings for ${s.name}: ${initialStandings.length} drivers`)
          }
        })
        
        set({ seasonStandings: freshStandings })
        console.log(`[RivalStore] Season standings reset complete for ${Object.keys(freshStandings).length} series`)
      },

      simulateOtherSeries: (currentWeek, excludedSeries) => {
        const { series } = get()
        const excludedIds = new Set(
          Array.isArray(excludedSeries)
            ? excludedSeries.filter(Boolean)
            : (excludedSeries ? [excludedSeries] : [])
        )
        
        // Find all series that have a race this week, excluding player's series
        series.forEach(s => {
          if (excludedIds.has(s.id)) return // Skip excluded series
          
          const raceThisWeek = s.calendar?.find(r => r.week === currentWeek)
          if (raceThisWeek) {
            console.log(`[RivalStore] Simulating race for ${s.name}, Round ${raceThisWeek.round}`)
            get().simulateRaceForSeries(s.id, raceThisWeek.round)
          }
        })
      },

      simulateRaceForSeries: (seriesId, round) => {
        const { teams, rivals, series } = get()
        // Defensive checks for corrupted/uninitialized state
        if (!Array.isArray(series)) return
        const currentSeries = series.find(s => s.id === seriesId)
        if (!currentSeries) return
        
        // Get race info for this round (for track-specific factors)
        const raceEvent = currentSeries.calendar?.find(r => r.round === round)
        const trackId = raceEvent?.trackId || ''
        
        // Get drivers in this series
        const seriesTeams = Array.isArray(teams) ? teams.filter(t => t.seriesId === seriesId) : []
        const seriesDrivers = Array.isArray(rivals) ? rivals.filter(r => r.currentSeriesId === seriesId && r.careerActive) : []
        
        // Use gridSize for DNF positions (fallback to reasonable default)
        const gridSize = currentSeries.gridSize || Math.max(seriesDrivers.length, seriesTeams.length * 2, 20)
        
        if (seriesDrivers.length === 0) {
          // FALLBACK: Generate results based on team.realDrivers when no rival drivers exist
          // This happens for series that weren't fully populated with RivalDriver objects
          console.warn(`[RivalStore] No rival drivers found for ${currentSeries.name} (${seriesId}), using team.realDrivers fallback`)
          
          const fakeDrivers = seriesTeams.flatMap(team => 
            team.realDrivers.map((d, driverIndex) => {
              // Calculate skill based on team prestige (0-100) and tier
              // Prestige-based skill: 40-95 range based on prestige
              const prestigeSkill = 40 + (team.prestige / 100) * 55
              // Tier bonus: entry=0, amateur=5, semi-pro=10, professional=15, pro=20, elite=25, pinnacle=30
              const tierBonus = {
                'entry': 0, 'amateur': 5, 'semi-pro': 10, 'professional': 15,
                'pro': 20, 'elite': 25, 'pinnacle': 30
              }[team.tier] || 10
              // First driver is typically stronger
              const positionBonus = driverIndex === 0 ? 3 : 0
              // Add some consistent variance per driver (seeded by name)
              const nameHash = d.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
              const driverVariance = ((nameHash % 20) - 10) // -10 to +10 consistent variance
              
              return {
                name: d.name,
                teamId: team.id,
                skill: Math.min(99, Math.max(40, prestigeSkill + tierBonus + positionBonus + driverVariance))
              }
            })
          ).slice(0, gridSize)
          
          if (fakeDrivers.length === 0) {
            console.warn(`[RivalStore] No drivers at all for ${currentSeries.name}, skipping simulation`)
            return
          }
          
          // Simulate race positions with improved algorithm
          const dnfCount = Math.floor(fakeDrivers.length * 0.05) // ~5% DNFs
          const dnfIndices = new Set<number>()
          while (dnfIndices.size < dnfCount) {
            dnfIndices.add(Math.floor(Math.random() * fakeDrivers.length))
          }
          
          const results = fakeDrivers.map((driver, idx) => {
            // Scale randomness inversely with skill (better drivers more consistent)
            const consistencyFactor = driver.skill / 100
            const randomRange = 30 * (1 - consistencyFactor * 0.5) // 15-30 range based on skill
            const randomFactor = (Math.random() * randomRange * 2) - randomRange
            
            return {
              name: driver.name,
              effectiveSkill: driver.skill + randomFactor,
              teamId: driver.teamId,
              dnf: dnfIndices.has(idx)
            }
          })
          .sort((a, b) => {
            // DNFs sort to the back
            if (a.dnf && !b.dnf) return 1
            if (!a.dnf && b.dnf) return -1
            return b.effectiveSkill - a.effectiveSkill
          })
          .map((driver, index) => ({
            name: driver.name,
            position: driver.dnf ? gridSize - (dnfCount - 1) + index : index + 1,
            lapsCompleted: driver.dnf ? 0 : Math.floor(40 + Math.random() * 30), // 40-70 laps
            bestLapTime: 0,
            isPlayer: false
          }))
          
          // Update standings
          get().updateStandingsFromRace(seriesId, results, '', 'simulated')
          console.log(`[RivalStore] Simulated ${currentSeries.name} Round ${round} (fallback mode): Winner - ${results[0]?.name}`)
          return
        }
        
        // NORMAL PATH: Simulate race using actual rival drivers with improved algorithm
        const results = seriesDrivers.map(driver => {
          // Base skill from driver stats
          const baseSkill = (driver.stats.raceSkill * 0.4 + driver.stats.consistency * 0.3 + driver.stats.defending * 0.15 + driver.stats.tireManagement * 0.15)
          
          // Apply current form modifier (typically -0.15 to +0.15)
          const formModifier = driver.currentForm || 0
          
          // Track affinity bonus (if driver has affinity for this track)
          const trackAffinity = driver.trackAffinities?.[trackId] || 0
          
          // Team development modifier (get from team if available)
          const team = seriesTeams.find(t => t.id === driver.currentTeamId)
          const teamBonus = team ? (team.prestige / 100) * 0.1 : 0 // Up to 10% bonus from team prestige
          
          // Calculate effective skill
          const effectiveSkill = baseSkill + formModifier + trackAffinity + teamBonus
          
          // Randomness scaled by consistency (more consistent = less random)
          const consistencyFactor = driver.stats.consistency
          const maxRandom = 0.3 * (1 - consistencyFactor * 0.5) // 15-30% range
          const randomFactor = (Math.random() * maxRandom * 2) - maxRandom
          
          // DNF chance affected by consistency and stamina
          const baseDnfChance = 0.05
          const dnfModifier = (1 - driver.stats.consistency) * 0.03 + (1 - driver.stats.stamina) * 0.02
          const dnfChance = Math.min(0.15, baseDnfChance + dnfModifier) // Cap at 15%
          const isDNF = Math.random() < dnfChance
          
          return {
            driver,
            score: isDNF ? -1 : effectiveSkill * (1 + randomFactor),
            dnf: isDNF
          }
        })
        .sort((a, b) => b.score - a.score)
        
        // Count DNFs for proper position assignment
        const dnfResults = results.filter(r => r.dnf)
        
        const finalResults = results.map((result, index) => ({
          name: `${result.driver.firstName} ${result.driver.lastName}`,
          // DNFs get positions at the back of the grid, not just back of driver list
          position: result.dnf ? gridSize - dnfResults.length + dnfResults.indexOf(result) + 1 : index + 1,
          lapsCompleted: result.dnf ? 0 : Math.floor(40 + Math.random() * 30), // 40-70 laps for finishers
          bestLapTime: 0,
          isPlayer: false
        }))
        
        // Update standings
        get().updateStandingsFromRace(seriesId, finalResults, '', 'simulated')
        
        // Update form/streak/seasonStats in one batched state write.
        // This is significantly faster than one store update per driver.
        const formUpdates = new Map<string, {
          newForm: number
          newStreak: number
          position: number
          seasonStats: {
            wins: number
            podiums: number
            points: number
            races: number
            avgFinish: number
            bestFinish: number
            dnfs: number
          }
        }>()

        results.forEach((result, index) => {
          const driver = result.driver
          const position = result.dnf
            ? gridSize - dnfResults.length + dnfResults.indexOf(result) + 1
            : index + 1

          const normalizedResult = 1 - ((position - 1) / Math.max(1, gridSize - 1))
          const expectedResult = driver.baseSkill || 0.5
          const delta = normalizedResult - expectedResult

          const newForm = clamp(
            (driver.currentForm * 0.6) + (delta * 0.4),
            -0.15,
            0.15
          )

          let newStreak = driver.formStreak || 0
          if (delta > 0.1) newStreak = Math.min(5, newStreak + 1)
          else if (delta < -0.1) newStreak = Math.max(-5, newStreak - 1)
          else newStreak = Math.sign(newStreak) * Math.max(0, Math.abs(newStreak) - 1)

          const isWin = position === 1
          const isPodium = position <= 3
          const prevStats = driver.seasonStats || { wins: 0, podiums: 0, points: 0, races: 0, avgFinish: 0, bestFinish: 99, dnfs: 0 }
          const newRaces = prevStats.races + 1
          const newAvgFinish = ((prevStats.avgFinish * prevStats.races) + position) / newRaces

          formUpdates.set(driver.id, {
            newForm,
            newStreak,
            position,
            seasonStats: {
              ...prevStats,
              wins: prevStats.wins + (isWin ? 1 : 0),
              podiums: prevStats.podiums + (isPodium ? 1 : 0),
              races: newRaces,
              avgFinish: newAvgFinish,
              bestFinish: Math.min(prevStats.bestFinish, position)
            }
          })
        })

        set((state) => ({
          rivals: state.rivals.map(r => {
            const update = formUpdates.get(r.id)
            if (!update) return r
            return {
              ...r,
              currentForm: update.newForm,
              formStreak: update.newStreak,
              lastRacePosition: update.position,
              seasonStats: update.seasonStats
            }
          })
        }))
        
        console.log(`[RivalStore] Simulated ${currentSeries.name} Round ${round}: Winner - ${finalResults[0]?.name}, DNFs: ${dnfResults.length}`)
      },

      getRivalsInSeries: (seriesId) => {
        const { rivals } = get()
        // Defensive check for corrupted/uninitialized state
        if (!Array.isArray(rivals)) return []
        return rivals.filter(r => r.currentSeriesId === seriesId && r.careerActive)
      },

      getTeamsInSeries: (seriesId) => {
        const { teams } = get()
        // Defensive check for corrupted/uninitialized state
        if (!Array.isArray(teams)) return []
        return teams.filter(t => t.seriesId === seriesId)
      },

      generateCalendar: (seriesId, year) => {
        const { series } = get()
        if (!Array.isArray(series)) return []
        const s = series.find(s => s.id === seriesId)
        if (s) return generateCalendarForSeries(s, year)

        // Fallback: series may not have been instantiated in world state
        // (e.g., missing team definitions for a valid championship). Build a
        // minimal temporary Series from championship data so schedule UI still works.
        const championship = getChampionshipById(seriesId)
        if (!championship) return []

        const primaryClassId = championship.carClassIds?.[0] || 'generic'
        const primaryClass = getCarClassById(primaryClassId)
        const tempSeries: Series = {
          id: championship.id,
          name: championship.name,
          shortName: championship.shortName,
          tier: championship.tier,
          carClassId: primaryClassId,
          carClassName: primaryClass?.name || primaryClassId,
          category: getCategoryForClass(primaryClassId),
          teams: [],
          calendar: [],
          prizeMoney: getPrizeMoneyFromPrizePool(championship.prizePool, championship.tier),
          seatCost: getSeatCostForTier(championship.tier),
          minReputation: getMinReputationForTier(championship.tier),
          gridSize: 20,
          isModern: isCurrentClass(primaryClassId),
          championshipId: championship.id,
          championshipType: championship.type,
          multiClass: championship.multiClass,
          carClassIds: championship.carClassIds,
          region: championship.region,
          format: championship.format,
          prestige: championship.prestige,
          prizePool: championship.prizePool,
          seasonRounds: championship.seasonRounds,
          seriesCategory: championship.seriesCategory,
          historicEra: championship.historicEra,
          youtubeId: championship.youtubeId
        }

        return generateCalendarForSeries(tempSeries, year)
      },

      repairSeriesCalendar: (seriesId, year) => {
        const { series } = get()
        const safeSeries = Array.isArray(series) ? series : []
        const existing = safeSeries.find(s => s.id === seriesId)

        // Build a source series from existing runtime data when possible,
        // otherwise from championship definitions.
        let sourceSeries: Series | null = existing || null
        if (!sourceSeries) {
          const championship = getChampionshipById(seriesId)
          if (!championship) return []

          const primaryClassId = championship.carClassIds?.[0] || 'generic'
          const primaryClass = getCarClassById(primaryClassId)
          sourceSeries = {
            id: championship.id,
            name: championship.name,
            shortName: championship.shortName,
            tier: championship.tier,
            carClassId: primaryClassId,
            carClassName: primaryClass?.name || primaryClassId,
            category: getCategoryForClass(primaryClassId),
            teams: [],
            calendar: [],
            prizeMoney: getPrizeMoneyFromPrizePool(championship.prizePool, championship.tier),
            seatCost: getSeatCostForTier(championship.tier),
            minReputation: getMinReputationForTier(championship.tier),
            gridSize: 20,
            isModern: isCurrentClass(primaryClassId),
            championshipId: championship.id,
            championshipType: championship.type,
            multiClass: championship.multiClass,
            carClassIds: championship.carClassIds,
            region: championship.region,
            format: championship.format,
            prestige: championship.prestige,
            prizePool: championship.prizePool,
            seasonRounds: championship.seasonRounds,
            seriesCategory: championship.seriesCategory,
            historicEra: championship.historicEra,
            youtubeId: championship.youtubeId
          }
        }

        const generated = generateCalendarForSeries(sourceSeries, year)
        if (generated.length === 0) return []

        if (existing) {
          set({
            series: safeSeries.map(s => s.id === seriesId ? { ...s, calendar: generated } : s)
          })
        } else {
          set({
            series: [...safeSeries, { ...sourceSeries, calendar: generated }]
          })
        }

        return generated
      },
      
      regenerateAllCalendars: (year) => {
        const { series } = get()
        if (!Array.isArray(series)) return
        
        console.log(`[RivalStore] Regenerating all series calendars for year ${year}`)
        
        const updatedSeries = series.map(s => ({
          ...s,
          calendar: generateCalendarForSeries(s, year)
        }))
        
        set({ series: updatedSeries })
        
        console.log(`[RivalStore] Calendars regenerated for ${updatedSeries.length} series`)
      },

      updateRoundTrack: (seriesId, round, trackId, layoutId) => {
        const { series } = get()
        if (!Array.isArray(series)) return
        const track = getTrackById(trackId)
        if (!track) return
        const layout = track.layouts.find(l => l.id === layoutId) || track.layouts[0]
        if (!layout) return

        set({
          series: series.map(s => {
            if (s.id !== seriesId) return s
            return {
              ...s,
              calendar: s.calendar.map(ev => {
                if (ev.round !== round) return ev
                return {
                  ...ev,
                  trackId: track.id,
                  trackName: track.name,
                  layoutId: layout.id,
                  layoutName: layout.name,
                  country: track.country,
                  lengthKm: layout.lengthKm,
                }
              })
            }
          })
        })
      },

      addRound: (seriesId, trackId, layoutId, week) => {
        const { series } = get()
        if (!Array.isArray(series)) return
        const track = getTrackById(trackId)
        if (!track) return
        const layout = track.layouts.find(l => l.id === layoutId) || track.layouts[0]
        if (!layout) return

        set({
          series: series.map(s => {
            if (s.id !== seriesId) return s
            const newRound = s.calendar.length + 1
            const newEvent: RaceEvent = {
              id: `${seriesId}_new_r${newRound}`,
              round: newRound,
              trackId: track.id,
              trackName: track.name,
              layoutId: layout.id,
              layoutName: layout.name,
              country: track.country,
              lengthKm: layout.lengthKm,
              week,
              sessions: { practice: true, qualifying: true, race: true, sprintRace: false },
            }
            return { ...s, calendar: [...s.calendar, newEvent] }
          })
        })
      },

      removeRound: (seriesId, round) => {
        const { series } = get()
        if (!Array.isArray(series)) return

        set({
          series: series.map(s => {
            if (s.id !== seriesId) return s
            const filtered = s.calendar
              .filter(ev => ev.round !== round)
              .map((ev, i) => ({ ...ev, round: i + 1 }))
            return { ...s, calendar: filtered }
          })
        })
      },

      getAvailableSeriesForPlayer: (reputation) => {
        const { series } = get()
        if (!Array.isArray(series)) return []
        return series.filter(s => s.minReputation <= reputation && s.isModern)
      },

      // Calculate team interest based on player reputation and performance
      calculateTeamInterest: (teamId, playerReputation, recentWins = 0) => {
        const { teams, series } = get()
        const team = teams.find(t => t.id === teamId)
        if (!team) {
          return {
            teamId,
            seriesId: '',
            level: 'none' as InterestLevel,
            reputationRequired: 0,
            reputationGap: 100,
            percentProgress: 0
          }
        }
        
        const _seriesData = series.find(s => s.id === team.seriesId)
        
        // ============================================
        // BACKGROUND-AWARE INTEREST CALCULATION
        // ============================================
        const careerStore = useCareerStore.getState()
        const playerBackground = careerStore.player?.background
        
        // Calculate effective reputation (boosted by recent wins)
        let effectiveRep = playerReputation + (recentWins * 2)
        
        // Background bonuses
        let backgroundBonus = 0
        
        // 1. Manufacturer affiliation bonus (Factory Academy graduate)
        if (playerBackground?.affiliatedManufacturer && team.manufacturerId) {
          if (playerBackground.affiliatedManufacturer === team.manufacturerId) {
            // Academy graduates get huge bonus with their manufacturer
            backgroundBonus += 15
          }
        }
        
        // 2. Family legacy connection bonus
        if (playerBackground?.familyLegacy?.connectionBonus) {
          // Family name opens doors everywhere
          backgroundBonus += Math.floor(playerBackground.familyLegacy.connectionBonus / 5) // +5 for 25% bonus
        }
        
        // 3. Engineering background bonus for technical teams
        if (playerBackground?.hasEngineeringBackground && 
            (team.tier === 'elite' || team.tier === 'pinnacle' || team.facilities === 'elite')) {
          // Technical teams value drivers with engineering understanding
          backgroundBonus += 5
        }
        
        // 4. Proven racing record bonus
        if (playerBackground?.hasProvenRacingRecord) {
          backgroundBonus += 3 // Teams trust drivers with records
        }
        
        // 5. Pay driver stigma penalty for prestigious teams
        if (playerBackground?.hasPayDriverStigma && 
            (team.tier === 'elite' || team.tier === 'pinnacle') && !team.payDriver) {
          backgroundBonus -= 5 // Elite teams may look down on pay drivers
        }
        
        effectiveRep += backgroundBonus
        
        // ============================================
        // TEAM ECONOMICS MODIFIERS
        // Team financial health affects hiring standards
        // ============================================
        let economicsModifier = 0
        
        if (team.economics) {
          // Financial health affects team's hiring standards
          if (team.economics.financialHealth < 30) {
            // Struggling teams are more desperate - easier to get in
            economicsModifier += 8
          } else if (team.economics.financialHealth < 50) {
            economicsModifier += 3
          } else if (team.economics.financialHealth > 80) {
            // Wealthy teams can be pickier
            economicsModifier -= 3
          }
          
          // Momentum affects team's risk tolerance
          if (team.economics.momentum <= -2) {
            // Teams on a losing streak may take chances on new talent
            economicsModifier += 5
          } else if (team.economics.momentum >= 2) {
            // Successful teams want proven drivers
            economicsModifier -= 3
          }
          
          // Sponsor tier affects team's visibility and driver interest
          const sponsorIndex = SPONSOR_TIERS.indexOf(team.economics.sponsorTier)
          if (sponsorIndex <= 1) {
            // No/local sponsors = less attractive team, but easier to join
            economicsModifier += 2
          } else if (sponsorIndex >= 4) {
            // International/global sponsors = more attractive but pickier
            economicsModifier -= 2
          }
        }
        
        effectiveRep += economicsModifier
        
        // ============================================
        // REBALANCED: Race count and win requirements
        // Elite/pinnacle teams want proven drivers
        // ============================================
        const playerStats = careerStore.player
        const playerRaceCount = playerStats?.totalRaces || 0
        const playerWinCount = playerStats?.totalWins || 0
        const playerPodiumCount = playerStats?.totalPodiums || 0
        
        // Minimum requirements by tier (REBALANCED - harder to reach top)
        // Includes minimum seasons completed to prevent unrealistic speed-runs
        const tierRequirements: Record<string, { minRaces: number; minWins: number; minPodiums: number; minSeasons: number }> = {
          'entry': { minRaces: 0, minWins: 0, minPodiums: 0, minSeasons: 0 },
          'amateur': { minRaces: 3, minWins: 0, minPodiums: 0, minSeasons: 0 },
          'semi-pro': { minRaces: 10, minWins: 0, minPodiums: 1, minSeasons: 1 },
          'professional': { minRaces: 20, minWins: 2, minPodiums: 5, minSeasons: 2 },
          'pro': { minRaces: 25, minWins: 3, minPodiums: 8, minSeasons: 2 },
          'elite': { minRaces: 40, minWins: 8, minPodiums: 15, minSeasons: 4 },
          'pinnacle': { minRaces: 60, minWins: 15, minPodiums: 30, minSeasons: 6 }
        }
        
        const reqs = tierRequirements[team.tier] || { minRaces: 0, minWins: 0, minPodiums: 0, minSeasons: 0 }
        const playerSeasonsCompleted = playerStats?.seasonsCompleted || 0
        
        // Check if player meets minimum requirements
        const meetsRaceRequirement = playerRaceCount >= reqs.minRaces
        const meetsWinRequirement = playerWinCount >= reqs.minWins
        const meetsPodiumRequirement = playerPodiumCount >= reqs.minPodiums
        const meetsSeasonsRequirement = playerSeasonsCompleted >= reqs.minSeasons
        const meetsAllRequirements = meetsRaceRequirement && meetsWinRequirement && meetsPodiumRequirement && meetsSeasonsRequirement
        
        // Penalty for not meeting requirements (more severe for elite/pinnacle)
        let requirementPenalty = 0
        if (!meetsAllRequirements) {
          if (team.tier === 'pinnacle') {
            // Top teams don't even consider drivers who don't meet requirements
            if (!meetsRaceRequirement) requirementPenalty += 30
            if (!meetsWinRequirement) requirementPenalty += 25
            if (!meetsPodiumRequirement) requirementPenalty += 15
            if (!meetsSeasonsRequirement) requirementPenalty += 20
          } else if (team.tier === 'elite') {
            if (!meetsRaceRequirement) requirementPenalty += 20
            if (!meetsWinRequirement) requirementPenalty += 15
            if (!meetsPodiumRequirement) requirementPenalty += 10
            if (!meetsSeasonsRequirement) requirementPenalty += 15
          } else if (team.tier === 'pro' || team.tier === 'professional') {
            if (!meetsRaceRequirement) requirementPenalty += 10
            if (!meetsWinRequirement) requirementPenalty += 8
            if (!meetsPodiumRequirement) requirementPenalty += 5
            if (!meetsSeasonsRequirement) requirementPenalty += 8
          } else {
            // Entry/amateur/semi-pro are more lenient
            if (!meetsRaceRequirement) requirementPenalty += 3
            if (!meetsWinRequirement) requirementPenalty += 2
            if (!meetsSeasonsRequirement) requirementPenalty += 3
          }
        }
        
        effectiveRep -= requirementPenalty
        
        const repGap = team.reputationRequired - effectiveRep
        const percentProgress = Math.min(100, Math.max(0, (effectiveRep / Math.max(1, team.reputationRequired)) * 100))
        
        // Interest thresholds are more lenient for pay-driver seats and entry-level teams
        // Elite/pro teams are pickier, amateur teams are more willing to take new drivers
        const isEntryLevel = team.tier === 'entry' || team.tier === 'amateur' || team.tier === 'semi-pro'
        const leniency = isEntryLevel ? 5 : 0 // Entry-level teams give +5 effective rep bonus
        const adjustedRep = effectiveRep + leniency
        
        let level: InterestLevel
        // Pay-driver seats are easier to get (you're paying them!)
        if (team.payDriver) {
          if (adjustedRep >= team.reputationRequired - 5) {
            level = 'offering'
          } else if (adjustedRep >= team.reputationRequired - 10) {
            level = 'very-interested'
          } else if (adjustedRep >= team.reputationRequired - 20) {
            level = 'interested'
          } else {
            level = 'watching'
          }
        } else {
          // Salaried seats are more competitive (REBALANCED - harder thresholds)
          if (adjustedRep >= team.reputationRequired + 10) {
            level = 'offering'
          } else if (adjustedRep >= team.reputationRequired) {
            level = 'very-interested'
          } else if (adjustedRep >= team.reputationRequired - 8) {
            level = 'interested'
          } else if (adjustedRep >= team.reputationRequired - 20) {
            level = 'watching'
          } else {
            level = 'none'
          }
        }
        
        return {
          teamId,
          seriesId: team.seriesId ?? '',
          level,
          reputationRequired: team.reputationRequired,
          reputationGap: Math.max(0, repGap),
          percentProgress
        }
      },

      // Get interest levels for all teams
      getAllTeamInterests: (playerReputation, recentWins = 0) => {
        const { teams } = get()
        return teams.map(team => 
          get().calculateTeamInterest(team.id, playerReputation, recentWins)
        )
      },

      // Generate contract offers based on new categorization system
      generateContractOffers: (_playerId: string, playerReputation: number, recentWins = 0): ContractOffer[] => {
        const state = get()
        // Defensive checks for corrupted/uninitialized state
        const teams = Array.isArray(state.teams) ? state.teams : []
        const series = Array.isArray(state.series) ? state.series : []
        const _rivals = Array.isArray(state.rivals) ? state.rivals : []
        const offers: ContractOffer[] = []
        
        // ============================================
        // REALISTIC SALARY SCALING - Convert per-race to annual-equivalent
        // Entry: $50k-$200k/year | Semi-pro: $200k-$500k/year
        // Pro: $80k-$350K/year | Elite: $200K-$800K/year | Pinnacle: $500K-$3M/year
        // ============================================
        
        /**
         * Calculate realistic contract salary offer based on tier, player reputation, and team prestige
         * Uses the global getSalaryRangeForTier function
         */
        const calculateContractSalary = (tier: TeamTier, prestige: number, reputationFactor: number = 0.5): number => {
          const range = getSalaryRangeForTier(tier)
          
          // If tier doesn't pay salaries, return 0
          if (range.max === 0) return 0
          
          // Prestige factor (0.8x to 1.4x)
          const prestigeFactor = 0.8 + (prestige / 100) * 0.6
          
          // Interpolate within range based on player reputation factor (0-1)
          const baseSalary = range.min + (range.max - range.min) * reputationFactor
          
          return Math.round(baseSalary * prestigeFactor)
        }
        
        // Import career store to check contract status
        const careerStore = useCareerStore.getState()
        const contractStatus = careerStore.getContractStatus()
        const yearsRemaining = careerStore.getYearsRemaining()
        const releaseClause = careerStore.calculateReleaseClause()
        const currentContract = careerStore.player?.contract
        
        console.log(`[Contracts] Generating offers for player with rep ${playerReputation}`)
        console.log(`[Contracts] Contract status: ${contractStatus}, years remaining: ${yearsRemaining}, release clause: $${releaseClause}`)
        console.log(`[Contracts] Total teams: ${teams.length}, Total series: ${series.length}`)
        
        // Determine offer parameters based on contract status
        const isBuyoutRequired = contractStatus === 'locked'
        const isForNextSeason = contractStatus === 'final_year'
        
        // If locked and no teams want to pay buyout, return empty
        // We'll still generate offers but mark them as buyout offers
        
        // Track which works programs we've already created offers for
        const processedWorksProgramIds = new Set<string>()
        
        // ============================================
        // 1. WORKS PROGRAM OFFERS
        // ============================================
        const worksPrograms = get().getWorksPrograms()
        
        worksPrograms.forEach(program => {
          // Get all teams in this program (use baseTeamId since program stores original AMS2 IDs)
          const programTeams = teams.filter(t => program.teamEntryIds.includes(t.baseTeamId))
          if (programTeams.length === 0) return
          
          // Check if any team in the program has interest
          const teamsWithInterest = programTeams.filter(team => {
            const seriesData = series.find(s => s.id === team.seriesId)
            if (!seriesData || !seriesData.isModern) return false
            const interest = get().calculateTeamInterest(team.id, playerReputation, recentWins)
            return interest.level === 'offering' || interest.level === 'very-interested'
          })
          
          if (teamsWithInterest.length === 0) return
          
          // Find best fit for player across all program entries
          let bestEntry: Team | null = null
          let bestFitResult: { canOffer: boolean; role: 'race-driver' | 'reserve'; reason: string } | null = null
          
          for (const team of programTeams) {
            const fit = get().evaluatePlayerFit(team, playerReputation)
            if (fit && fit.role === 'race-driver') {
              // Prefer race driver positions
              if (!bestFitResult || bestFitResult.role !== 'race-driver') {
                bestEntry = team
                bestFitResult = fit
              }
            } else if (fit && !bestFitResult) {
              // Fall back to reserve if no race seat found
              bestEntry = team
              bestFitResult = fit
            }
          }
          
          if (!bestEntry || !bestFitResult) return
          
          const bestSeriesData = series.find(s => s.id === bestEntry!.seriesId)
          if (!bestSeriesData) return
          
          // Calculate salary using tier-based realistic values
          const baseSalary = calculateContractSalary(bestEntry.tier, bestEntry.prestige, 0.7) * (program.salaryMultiplier || 1.0)
          
          // Build all program entries summary for display
          const allProgramEntries: TeamEntrySummary[] = programTeams.map(t => {
            const primaryDriver = get().getTeamPrimaryDriver(t.id)
            const teamSeries = series.find(s => s.id === t.seriesId)
            return {
              entryId: t.id,
              entryName: t.name,
              carName: getCarNameForManufacturer(t.carClassId, program.manufacturerId || undefined),
              seriesId: t.seriesId ?? '',
              seriesName: teamSeries?.name || 'Unknown Series',
              currentDriverName: primaryDriver ? `${primaryDriver.firstName} ${primaryDriver.lastName}` : undefined,
              currentDriverRep: primaryDriver?.reputation
            }
          })
          
          // Create likely assignment
          const likelyAssignment: TeamEntryAssignment = {
            entryId: bestEntry.id,
            entryName: bestEntry.name,
            carName: getCarNameForManufacturer(bestEntry.carClassId, program.manufacturerId || undefined),
            carClassId: bestEntry.carClassId,
            seriesId: bestEntry.seriesId ?? '',
            seriesName: bestSeriesData.name,
            reason: bestFitResult.reason
          }
          
          const _manufacturer = program.manufacturerId ? getManufacturerById(program.manufacturerId) : undefined
          
          // Works program contracts have the most demanding terms
          const worksTier = bestEntry.tier
          const worksTargetSummary = worksTier === 'pinnacle' 
            ? ['Championship top 3', 'Multiple wins required', 'Beat teammate consistently']
            : worksTier === 'elite'
              ? ['Championship top 5', 'Win at least 2 races', 'Beat teammate 55%+']
              : ['Championship top 8', 'Score regular podiums', 'Beat teammate 50%+']
          
          const worksMediaSummary = `${worksTier === 'pinnacle' ? '12' : worksTier === 'elite' ? '8' : '6'} press conferences, ${worksTier === 'pinnacle' ? '24' : worksTier === 'elite' ? '16' : '12'} social posts, ${worksTier === 'pinnacle' ? '6' : '4'} team events`
          
          const worksRenewalCondition = worksTier === 'pinnacle' ? 'Championship top 3' 
            : worksTier === 'elite' ? 'Championship top 5' 
            : 'Meet all targets'
          
          offers.push({
            // Base identification (use best entry for backwards compatibility)
            teamId: bestEntry.id,
            seriesId: bestEntry.seriesId ?? '',
            teamName: program.name, // Use program name, not team entry
            seriesName: bestSeriesData.name,
            
            // Financial terms
            salary: bestFitResult.role === 'reserve' ? Math.round(baseSalary * 0.3) : Math.round(baseSalary),
            bonusPerWin: Math.round(baseSalary * 0.4),
            bonusPerPodium: Math.round(baseSalary * 0.15),
            seatCost: 0, // Works teams don't require pay-driver
            duration: 2,
            expiresWeek: 4,
            interestLevel: 'offering',
            
            // NEW: Offer type
            offerType: 'works-program',
            
            // Works program fields
            programId: program.id,
            programName: program.name,
            manufacturerId: program.manufacturerId || undefined,
            programType: 'works',
            likelyAssignment,
            allProgramEntries,
            
            // Legacy fields
            contractType: 'works-full',
            availableSeriesIds: program.seriesIds,
            selectedSeriesIds: program.seriesIds,
            
            // Enhanced contract terms - Works programs are most demanding
            hasPerformanceTargets: true,
            targetSummary: worksTargetSummary,
            hasAutoRenewal: true,
            renewalCondition: worksRenewalCondition,
            hasTeamOption: false, // Works drivers usually don't have team options - they get reassigned instead
            hasPlayerOption: playerReputation >= 80, // Only top drivers get player options
            hasPerformanceClause: true,
            dnfLimit: worksTier === 'pinnacle' ? 2 : worksTier === 'elite' ? 3 : 4,
            hasMediaDuties: true,
            mediaDutySummary: worksMediaSummary,
            teamTier: worksTier,
            totalRaces: bestSeriesData.calendar?.length || 12,
            gridSize: bestSeriesData.gridSize || 20
          })
          
          processedWorksProgramIds.add(program.id)
        })
        
        // ============================================
        // 2. SPEC SERIES TEAM OFFERS
        // ============================================
        const specSeriesTeams = get().getSpecSeriesTeams()
        
        specSeriesTeams.forEach(team => {
          const seriesData = series.find(s => s.id === team.seriesId)
          if (!seriesData || !seriesData.isModern) return
          
          const interest = get().calculateTeamInterest(team.id, playerReputation, recentWins)
          if (interest.level !== 'offering' && interest.level !== 'very-interested') return
          
          // Random chance for non-offering interest
          if (interest.level === 'very-interested' && Math.random() > 0.7) return
          
          // Calculate salary using tier-based realistic values
          const baseSalary = calculateContractSalary(team.tier, team.prestige, 0.5)
          
          const fixedAssignment: TeamEntryAssignment = {
            entryId: team.id,
            entryName: team.name,
            carName: getCarNameForManufacturer(team.carClassId, team.manufacturerId) || seriesData.carClassName,
            carClassId: team.carClassId,
            seriesId: team.seriesId ?? '',
            seriesName: seriesData.name
          }
          
          // Generate enhanced contract terms based on tier
          const specTargetSummary = team.tier === 'entry' 
            ? ['Complete the season'] 
            : team.tier === 'amateur'
              ? ['Finish in top 15', 'Score podiums']
              : ['Finish in top 10', 'Score podiums', 'Beat teammate']
          
          const specMediaSummary = ['semi-pro', 'professional', 'pro', 'elite', 'pinnacle'].includes(team.tier)
            ? `${team.tier === 'professional' || team.tier === 'pro' ? '4' : team.tier === 'elite' ? '6' : '2'} press conferences, team events`
            : undefined
          
          offers.push({
            teamId: team.id,
            seriesId: team.seriesId ?? '',
            teamName: team.name,
            seriesName: seriesData.name,
            
            salary: team.payDriver ? 0 : Math.round(baseSalary),
            bonusPerWin: Math.round(baseSalary * 0.2),
            bonusPerPodium: Math.round(baseSalary * 0.08),
            seatCost: team.payDriver ? (team.seatCost || calculateSeatCostWithVariation(team.tier, team.prestige, hashString(team.id))) : 0,
            duration: 1,
            expiresWeek: 4,
            interestLevel: interest.level,
            
            offerType: 'spec-series-team',
            fixedAssignment,
            
            programId: team.programId,
            manufacturerId: team.manufacturerId,
            programType: 'spec-series',
            contractType: 'spec',
            availableSeriesIds: [team.seriesId ?? ''],
            selectedSeriesIds: [team.seriesId ?? ''],
            
            // Enhanced contract terms
            hasPerformanceTargets: team.tier !== 'entry',
            targetSummary: specTargetSummary,
            hasAutoRenewal: ['professional', 'pro', 'elite'].includes(team.tier),
            renewalCondition: ['professional', 'pro', 'elite'].includes(team.tier) ? 'Auto-renews if targets met' : undefined,
            hasTeamOption: ['semi-pro', 'professional', 'pro'].includes(team.tier),
            hasPlayerOption: false,
            hasPerformanceClause: ['semi-pro', 'professional', 'pro', 'elite', 'pinnacle'].includes(team.tier),
            dnfLimit: team.tier === 'pinnacle' ? 3 : team.tier === 'elite' ? 4 : 5,
            hasMediaDuties: ['semi-pro', 'professional', 'pro', 'elite', 'pinnacle'].includes(team.tier),
            mediaDutySummary: specMediaSummary,
            teamTier: team.tier,
            totalRaces: seriesData.calendar?.length || 12,
            gridSize: seriesData.gridSize || 20
          })
        })
        
        // ============================================
        // 3. CUSTOMER TEAM OFFERS
        // ============================================
        const customerTeams = get().getCustomerTeams()
        
        customerTeams.forEach(team => {
          // Skip if team is part of a works program we already made an offer for
          if (team.programId && processedWorksProgramIds.has(team.programId)) return
          
          const seriesData = series.find(s => s.id === team.seriesId)
          if (!seriesData || !seriesData.isModern) return
          
          const interest = get().calculateTeamInterest(team.id, playerReputation, recentWins)
          if (interest.level !== 'offering' && interest.level !== 'very-interested') return
          
          // Random chance for non-offering interest
          if (interest.level === 'very-interested' && Math.random() > 0.6) return
          
          // Calculate salary using tier-based realistic values
          const reputationFactor = Math.min(1, Math.max(0, (playerReputation - team.reputationRequired + 20) / 50))
          const baseSalary = calculateContractSalary(team.tier, team.prestige, reputationFactor)
          
          const fixedAssignment: TeamEntryAssignment = {
            entryId: team.id,
            entryName: team.name,
            carName: getCarNameForManufacturer(team.carClassId, team.manufacturerId),
            carClassId: team.carClassId,
            seriesId: team.seriesId ?? '',
            seriesName: seriesData.name
          }
          
          // Determine contract type based on team's program type
          let contractType: ContractType = 'customer'
          if (team.programType === 'factory-supported') {
            contractType = 'factory-supported'
          }
          
          // Generate enhanced contract terms based on tier
          const customerTargetSummary = team.tier === 'entry' 
            ? ['Complete the season'] 
            : team.tier === 'amateur'
              ? ['Finish in top 15', 'Score at least 2 podiums']
              : team.tier === 'semi-pro'
                ? ['Finish in top 10', 'Score at least 3 podiums', 'Beat teammate 50%+']
                : ['Finish in top 5', 'Score podiums consistently', 'Beat teammate']
          
          const customerMediaSummary = ['semi-pro', 'professional', 'pro', 'elite', 'pinnacle'].includes(team.tier)
            ? `${team.tier === 'pinnacle' ? '12' : team.tier === 'elite' ? '8' : team.tier === 'pro' || team.tier === 'professional' ? '4' : '2'} press conferences, ${team.tier === 'pinnacle' ? '6' : team.tier === 'elite' ? '4' : '2'} team events`
            : undefined
          
          const customerRenewalCondition = team.tier === 'pinnacle' ? 'Championship top 3' 
            : team.tier === 'elite' ? 'Championship top 5' 
            : ['professional', 'pro'].includes(team.tier) ? 'Meet all targets' 
            : undefined
          
          offers.push({
            teamId: team.id,
            seriesId: team.seriesId ?? '',
            teamName: team.name,
            seriesName: seriesData.name,
            
            salary: team.payDriver ? 0 : Math.round(baseSalary),
            bonusPerWin: Math.round(baseSalary * 0.25 * (team.prestige / 100)),
            bonusPerPodium: Math.round(baseSalary * 0.1 * (team.prestige / 100)),
            seatCost: team.payDriver ? (team.seatCost || calculateSeatCostWithVariation(team.tier, team.prestige, hashString(team.id))) : 0,
            duration: interest.level === 'offering' ? 2 : 1,
            expiresWeek: 4,
            interestLevel: interest.level,
            
            offerType: 'customer-team',
            fixedAssignment,
            
            programId: team.programId,
            manufacturerId: team.manufacturerId,
            programType: team.programType,
            contractType,
            availableSeriesIds: [team.seriesId ?? ''],
            selectedSeriesIds: [team.seriesId ?? ''],
            
            // Enhanced contract terms
            hasPerformanceTargets: team.tier !== 'entry',
            targetSummary: customerTargetSummary,
            hasAutoRenewal: ['professional', 'pro', 'elite', 'pinnacle'].includes(team.tier),
            renewalCondition: customerRenewalCondition,
            hasTeamOption: ['semi-pro', 'professional', 'pro'].includes(team.tier) && playerReputation < 75,
            hasPlayerOption: ['elite', 'pinnacle'].includes(team.tier) && playerReputation >= 70,
            hasPerformanceClause: ['semi-pro', 'professional', 'pro', 'elite', 'pinnacle'].includes(team.tier),
            dnfLimit: team.tier === 'pinnacle' ? 3 : team.tier === 'elite' ? 4 : team.tier === 'pro' || team.tier === 'professional' ? 5 : 6,
            hasMediaDuties: ['semi-pro', 'professional', 'pro', 'elite', 'pinnacle'].includes(team.tier),
            mediaDutySummary: customerMediaSummary,
            teamTier: team.tier,
            totalRaces: seriesData.calendar?.length || 12,
            gridSize: seriesData.gridSize || 20
          })
        })
        
        console.log(`[Contracts] Generated ${offers.length} offers (Works: ${offers.filter(o => o.offerType === 'works-program').length}, Spec: ${offers.filter(o => o.offerType === 'spec-series-team').length}, Customer: ${offers.filter(o => o.offerType === 'customer-team').length})`)
        
        // ============================================
        // FALLBACK: Low-rep players get entry-level offers
        // ============================================
        if (offers.length === 0 && playerReputation <= 15) {
          console.log(`[Contracts] No offers found, creating fallback offers for new player`)
          
          const sortedTeams = [...teams].sort((a, b) => a.reputationRequired - b.reputationRequired)
          const accessibleTeams = sortedTeams
            .filter(t => {
              const s = series.find(s => s.id === t.seriesId)
              return s?.isModern && t.reputationRequired <= 15
            })
            .slice(0, 5)
          
          accessibleTeams.forEach(team => {
            const seriesData = series.find(s => s.id === team.seriesId)
            if (!seriesData) return
            
            const offerType = get().categorizeTeamForOffer(team)
            const fixedAssignment: TeamEntryAssignment = {
              entryId: team.id,
              entryName: team.name,
              carName: getCarNameForManufacturer(team.carClassId, team.manufacturerId) || seriesData.carClassName,
              carClassId: team.carClassId,
              seriesId: team.seriesId ?? '',
              seriesName: seriesData.name
            }
            
            offers.push({
              teamId: team.id,
              seriesId: team.seriesId ?? '',
              teamName: team.name,
              seriesName: seriesData.name,
              salary: 0,
              bonusPerWin: 500,
              bonusPerPodium: 200,
              seatCost: team.payDriver ? (team.seatCost || calculateSeatCostWithVariation(team.tier, team.prestige, hashString(team.id))) : 0,
              duration: 1,
              expiresWeek: 4,
              interestLevel: 'interested',
              
              offerType,
              fixedAssignment,
              
              programId: team.programId,
              manufacturerId: team.manufacturerId,
              programType: team.programType,
              contractType: team.programType === 'spec-series' ? 'spec' : 'customer',
              availableSeriesIds: [team.seriesId ?? ''],
              selectedSeriesIds: [team.seriesId ?? '']
            })
          })
          console.log(`[Contracts] Created ${offers.length} fallback offers`)
        }
        
        // ============================================
        // ADD BUYOUT INFO BASED ON CONTRACT STATUS
        // ============================================
        const processedOffers: ContractOffer[] = offers.map((offer: ContractOffer): ContractOffer | null => {
          // If player is locked (not final year), this requires a buyout
          if (isBuyoutRequired && currentContract) {
            // Only high-prestige teams will pay buyouts
            const offeringTeam = teams.find(t => t.id === offer.teamId)
            const prestigeThreshold = 60 // Only teams with 60+ prestige will consider buyouts
            
            if (offeringTeam && offeringTeam.prestige >= prestigeThreshold) {
              return {
                ...offer,
                isBuyoutOffer: true,
                buyoutCost: releaseClause,
                signingBonus: Math.round(releaseClause * 0.2), // 20% signing bonus
                effectiveDate: 'immediate' as const
              }
            }
            // Low prestige teams won't make offers if buyout required
            return null
          }
          
          // If final year, offers are for next season
          if (isForNextSeason) {
            return {
              ...offer,
              effectiveDate: 'next_season' as const
            }
          }
          
          // Free agent - immediate offers
          return {
            ...offer,
            effectiveDate: 'immediate' as const
          }
        }).filter((offer): offer is ContractOffer => offer !== null)
        
        // Sort: works > customer > spec, then paid seats, then prestige
        processedOffers.sort((a: ContractOffer, b: ContractOffer) => {
          // Priority 1: Offer type
          const typeOrder: Record<OfferType, number> = { 'works-program': 0, 'customer-team': 1, 'spec-series-team': 2 }
          const typeCompare = typeOrder[a.offerType] - typeOrder[b.offerType]
          if (typeCompare !== 0) return typeCompare
          
          // Priority 2: Paid seats over pay-driver
          if (a.salary > 0 && b.salary === 0) return -1
          if (a.salary === 0 && b.salary > 0) return 1
          
          // Priority 3: Prestige
          const teamA = teams.find(t => t.id === a.teamId)
          const teamB = teams.find(t => t.id === b.teamId)
          return (teamB?.prestige ?? 0) - (teamA?.prestige ?? 0)
        })
        
        console.log(`[Contracts] Generated ${processedOffers.length} offers (buyout required: ${isBuyoutRequired}, for next season: ${isForNextSeason})`)
        
        set({ pendingContractOffers: processedOffers })
        return processedOffers
      },

      acceptContract: (offer) => {
        set((state) => ({
          pendingContractOffers: state.pendingContractOffers.filter(
            o => !(o.teamId === offer.teamId && o.seriesId === offer.seriesId)
          ),
          teams: state.teams.map(t => 
            t.id === offer.teamId 
              ? { ...t, availableSeats: (t.availableSeats ?? 0) - 1 }
              : t
          )
        }))
      },

      declineContract: (offer) => {
        set((state) => ({
          pendingContractOffers: state.pendingContractOffers.filter(
            o => !(o.teamId === offer.teamId && o.seriesId === offer.seriesId)
          )
        }))
      },

      clearExpiredOffers: (currentWeek) => {
        set((state) => ({
          pendingContractOffers: state.pendingContractOffers.filter(
            o => o.expiresWeek > currentWeek
          )
        }))
      },

      getTeamById: (teamId) => {
        const { teams } = get()
        if (!Array.isArray(teams)) return undefined
        return teams.find(t => t.id === teamId)
      },

      getSeriesById: (seriesId) => {
        const { series } = get()
        if (!Array.isArray(series)) return undefined
        return series.find(s => s.id === seriesId)
      },

      // ============================================
      // Manufacturer & Program System
      // ============================================
      
      getManufacturers: () => {
        return AMS2_MANUFACTURERS
      },

      getManufacturer: (id) => {
        return getManufacturerById(id)
      },

      getPrograms: () => {
        return AMS2_RACING_PROGRAMS
      },

      getProgram: (id) => {
        return getProgramById(id)
      },

      getProgramsForManufacturer: (manufacturerId) => {
        return getProgramsByManufacturer(manufacturerId)
      },

      getTeamsForProgram: (programId) => {
        const { teams } = get()
        const program = getProgramById(programId)
        if (!program || !Array.isArray(teams)) return []
        
        // Get teams that match any of the team entry IDs in the program
        // Use baseTeamId since program.teamEntryIds stores original AMS2 team IDs
        return teams.filter(t => program.teamEntryIds.includes(t.baseTeamId))
      },

      getSeriesForProgram: (programId) => {
        const { series } = get()
        const program = getProgramById(programId)
        if (!program || !Array.isArray(series)) return []
        
        // Get series that match the program's series IDs
        return series.filter(s => program.seriesIds.includes(s.id))
      },

      /**
       * Get all entries in a program with full data for reassignment logic
       * Used for end-of-season reassignment checks
       */
      getProgramEntries: (programId) => {
        if (!programId) return []
        
        const program = getProgramById(programId)
        if (!program) return []
        
        const { teams, series, rivals } = get()
        
        // Find teams by their baseTeamId (original AMS2 ID) matching program entries
        return program.teamEntryIds.map(baseEntryId => {
          const team = teams.find(t => t.baseTeamId === baseEntryId)
          const seriesData = series.find(s => s.id === team?.seriesId)
          const driver = rivals.find(r => r.currentTeamId === team?.id)
          
          return {
            entryId: team?.id || baseEntryId,
            entryName: team?.name || baseEntryId,
            carName: getCarNameForManufacturer(team?.carClassId || '', program.manufacturerId || undefined),
            carClassId: team?.carClassId || '',
            seriesId: team?.seriesId || '',
            seriesName: seriesData?.name || '',
            tier: team?.tier || 'amateur',
            currentDriverName: driver ? `${driver.firstName} ${driver.lastName}` : undefined,
            currentDriverRep: driver?.reputation
          }
        }).filter(entry => entry.entryId) // Filter out any entries without valid data
      },

      /**
       * Check for mid-season injury cover opportunity
       * Works drivers may be called up to cover for injured drivers in higher-tier entries
       */
      checkMidSeasonReassignment: (programId, currentEntryId, playerReputation) => {
        if (!programId) return null
        
        const program = getProgramById(programId)
        if (!program) return null
        
        const { teams, series, rivals } = get()
        const TIER_ORDER: TeamTier[] = ['entry', 'amateur', 'semi-pro', 'professional', 'pro', 'elite', 'pinnacle']
        
        // Find the player's current entry tier
        const currentTeam = teams.find(t => t.id === currentEntryId)
        if (!currentTeam) return null
        
        const currentTierIndex = TIER_ORDER.indexOf(currentTeam.tier)
        
        // Find injured drivers in higher-tier entries within the same program
        const injuredHigherTierEntries: Array<{
          entry: ProgramEntryInfo
          driver: RivalDriver
        }> = []
        
        // Use baseTeamId to find teams in the program
        program.teamEntryIds.forEach(baseEntryId => {
          // Find team by baseTeamId
          const team = teams.find(t => t.baseTeamId === baseEntryId)
          if (!team) return
          
          if (team.id === currentEntryId) return // Skip current entry
          
          const entryTierIndex = TIER_ORDER.indexOf(team.tier)
          
          // Only consider higher or equal tier entries
          if (entryTierIndex < currentTierIndex) return
          
          // Find the driver assigned to this entry
          const driver = rivals.find(r => r.currentTeamId === team.id && r.careerActive)
          if (!driver) return
          
          // Check if driver is injured 
          // For now, we'll simulate this with a small random chance per week
          // Future enhancement: add proper injury tracking to RivalDriver
          const isInjured = Math.random() < 0.02 // 2% chance per week
          
          if (isInjured) {
            const seriesData = series.find(s => s.id === team.seriesId)
            injuredHigherTierEntries.push({
              entry: {
                entryId: team.id,
                entryName: team.name,
                carName: getCarNameForManufacturer(team.carClassId, program.manufacturerId || undefined),
                carClassId: team.carClassId,
                seriesId: team.seriesId ?? '',
                seriesName: seriesData?.name || '',
                tier: team.tier,
                currentDriverName: `${driver.firstName} ${driver.lastName}`,
                currentDriverRep: driver.reputation
              },
              driver
            })
          }
        })
        
        if (injuredHigherTierEntries.length === 0) return null
        
        // Sort by tier (highest first) and pick the best opportunity
        injuredHigherTierEntries.sort((a, b) => {
          const tierA = TIER_ORDER.indexOf(a.entry.tier)
          const tierB = TIER_ORDER.indexOf(b.entry.tier)
          return tierB - tierA
        })
        
        const bestOpportunity = injuredHigherTierEntries[0]
        
        // Check if player's reputation is sufficient (within 15 points of injured driver)
        if (playerReputation < (bestOpportunity.entry.currentDriverRep || 0) - 15) {
          return null // Player not experienced enough
        }
        
        // Return the reassignment opportunity
        return {
          reason: 'injury-cover' as const,
          oldEntryId: currentEntryId,
          oldEntryName: currentTeam.name,
          newEntryId: bestOpportunity.entry.entryId,
          newEntryName: bestOpportunity.entry.entryName,
          newCarName: bestOpportunity.entry.carName,
          newCarClassId: bestOpportunity.entry.carClassId,
          newSeriesId: bestOpportunity.entry.seriesId,
          newSeriesName: bestOpportunity.entry.seriesName,
          duration: Math.random() < 0.3 ? 'temporary' : 'remainder-of-season' as const,
          injuredDriverName: bestOpportunity.entry.currentDriverName
        }
      },

      // ============================================
      // Team Categorization for Contract Offers
      // ============================================
      
      categorizeTeamForOffer: (team) => {
        // Check if team belongs to a works program
        if (team.programType === 'works') {
          return 'works-program'
        }
        
        // Check if team is in a spec series
        if (team.programType === 'spec-series') {
          return 'spec-series-team'
        }
        
        // Everything else is customer (factory-supported, customer, independent)
        return 'customer-team'
      },
      
      getWorksPrograms: () => {
        return AMS2_RACING_PROGRAMS.filter(p => p.programType === 'works')
      },
      
      getSpecSeriesTeams: () => {
        const { teams } = get()
        if (!Array.isArray(teams)) return []
        return teams.filter(t => t.programType === 'spec-series')
      },
      
      getCustomerTeams: () => {
        const { teams } = get()
        if (!Array.isArray(teams)) return []
        return teams.filter(t => 
          t.programType === 'customer' || 
          t.programType === 'factory-supported' || 
          t.programType === 'independent'
        )
      },
      
      getTeamPrimaryDriver: (teamId) => {
        const { teams, rivals } = get()
        const team = teams.find(t => t.id === teamId)
        if (!team || team.drivers.length === 0) return undefined
        
        // Find the driver with highest reputation on this team
        const teamDrivers = rivals.filter(r => r.currentTeamId === teamId)
        if (teamDrivers.length === 0) return undefined
        
        return teamDrivers.sort((a, b) => b.reputation - a.reputation)[0]
      },
      
      evaluatePlayerFit: (team, playerReputation) => {
        const primaryDriver = get().getTeamPrimaryDriver(team.id)
        
        // If no primary driver (vacant seat), player can get race seat
        if (!primaryDriver) {
          return {
            canOffer: true,
            role: 'race-driver',
            reason: 'Vacant seat available'
          }
        }
        
        const repDifference = playerReputation - primaryDriver.reputation
        
        // Player significantly better than current driver - can replace them
        if (repDifference > 5) {
          return {
            canOffer: true,
            role: 'race-driver',
            reason: `Your reputation (${playerReputation}) exceeds ${primaryDriver.firstName} ${primaryDriver.lastName} (${primaryDriver.reputation})`
          }
        }
        
        // Player close to current driver - can be reserve
        if (repDifference > -15) {
          return {
            canOffer: true,
            role: 'reserve',
            reason: `Close to current driver's level - reserve position available`
          }
        }
        
        // Player too far below - no offer from this team
        return null
      },

      // ============================================
      // Calendar Conflict / DNS Handling
      // ============================================
      
      recordPlayerDNS: (seriesId, playerName, round, reason) => {
        const { seasonStandings, series: allSeries } = get()
        const currentStandings = seasonStandings[seriesId] || []
        const currentSeries = allSeries.find(s => s.id === seriesId)
        
        console.log(`[RivalStore] Recording DNS for ${playerName} in ${seriesId} round ${round} (${reason})`)
        
        // Find or create player standing entry
        const updatedStandings = [...currentStandings]
        let standing = updatedStandings.find(s => s.driverName === playerName && s.isPlayer)
        
        if (standing) {
          // Update existing standing - DNS counts as a race with 0 points
          standing.races += 1
          standing.dnfs += 1 // DNS counts as DNF for statistics
          // avgFinish stays the same since DNS doesn't count toward average
        } else {
          // Create new standing entry for player (they joined mid-season)
          const newStanding: SeasonStanding = {
            driverId: `player_${playerName.replace(/\s+/g, '_').toLowerCase()}`,
            driverName: playerName,
            teamId: 'player',
            teamName: currentSeries?.name || 'Unknown',
            points: 0,
            wins: 0,
            podiums: 0,
            poles: 0,
            fastestLaps: 0,
            races: 1,
            bestFinish: 99, // No best finish yet
            avgFinish: 0,
            dnfs: 1,
            position: 0, // Will be calculated
            isPlayer: true
          }
          updatedStandings.push(newStanding)
        }
        
        // Recalculate positions
        updatedStandings.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points
          if (b.wins !== a.wins) return b.wins - a.wins
          return a.avgFinish - b.avgFinish
        })
        
        updatedStandings.forEach((s, index) => {
          s.position = index + 1
        })
        
        // Update state
        set({
          seasonStandings: {
            ...seasonStandings,
            [seriesId]: updatedStandings
          }
        })
        
        console.log(`[RivalStore] DNS recorded. Player now at P${standing?.position || updatedStandings.length} in ${seriesId}`)
      },

      // === Form & Development System Implementation ===

      /**
       * Calculate weekend form for a driver at a specific track
       * Combines base form, track affinity, streak bonus, and random variance
       */
      calculateWeekendForm: (driverId, trackId) => {
        const { rivals } = get()
        const driver = rivals.find(r => r.id === driverId)
        if (!driver) return 0
        
        // Base form from recent results (-0.15 to +0.15)
        const recentForm = driver.currentForm || 0
        
        // Weekend variance (random luck factor)
        const weekendLuck = (Math.random() - 0.5) * 0.08 // ±4%
        
        // Track affinity bonus (some drivers better at certain tracks)
        const trackBonus = driver.trackAffinities?.[trackId] || 0 // ±5%
        
        // Confidence from recent results (streak bonus)
        let confidenceBonus = 0
        if (driver.formStreak >= 3) confidenceBonus = 0.03
        else if (driver.formStreak >= 2) confidenceBonus = 0.015
        else if (driver.formStreak <= -3) confidenceBonus = -0.03
        else if (driver.formStreak <= -2) confidenceBonus = -0.015
        
        // Career stage modifier
        let stageModifier = 0
        if (driver.careerStage === 'rising') stageModifier = 0.01
        else if (driver.careerStage === 'declining') stageModifier = -0.01
        else if (driver.careerStage === 'veteran') stageModifier = -0.02
        
        const totalForm = clamp(
          recentForm + weekendLuck + trackBonus + confidenceBonus + stageModifier,
          -0.15,
          0.15
        )
        
        return totalForm
      },

      /**
       * Update driver form after a race based on performance vs expectations
       */
      updateFormAfterRace: (driverId, position, gridSize) => {
        const { rivals } = get()
        const driver = rivals.find(r => r.id === driverId)
        if (!driver) return
        
        // Calculate normalized result (0-1, higher is better)
        const normalizedResult = 1 - ((position - 1) / Math.max(1, gridSize - 1))
        
        // Expected result based on base skill
        const expectedResult = driver.baseSkill || 0.5
        
        // Did they over/underperform?
        const delta = normalizedResult - expectedResult
        
        // Update form (weighted average with previous form)
        const newForm = clamp(
          (driver.currentForm * 0.6) + (delta * 0.4),
          -0.15,
          0.15
        )
        
        // Update streak
        let newStreak = driver.formStreak || 0
        if (delta > 0.1) newStreak = Math.min(5, newStreak + 1) // Good race
        else if (delta < -0.1) newStreak = Math.max(-5, newStreak - 1) // Bad race
        else newStreak = Math.sign(newStreak) * Math.max(0, Math.abs(newStreak) - 1) // Neutral, decay toward 0
        
        // Update season stats
        const isWin = position === 1
        const isPodium = position <= 3
        const prevStats = driver.seasonStats || { wins: 0, podiums: 0, points: 0, races: 0, avgFinish: 0, bestFinish: 99, dnfs: 0 }
        const newRaces = prevStats.races + 1
        const newAvgFinish = ((prevStats.avgFinish * prevStats.races) + position) / newRaces
        
        set((state) => ({
          rivals: state.rivals.map(r => r.id === driverId ? {
            ...r,
            currentForm: newForm,
            formStreak: newStreak,
            lastRacePosition: position,
            seasonStats: {
              ...prevStats,
              wins: prevStats.wins + (isWin ? 1 : 0),
              podiums: prevStats.podiums + (isPodium ? 1 : 0),
              races: newRaces,
              avgFinish: newAvgFinish,
              bestFinish: Math.min(prevStats.bestFinish, position)
            }
          } : r)
        }))
        
        // Intentionally no per-driver console logging here; it is too expensive
        // during large batched simulations.
      },

      /**
       * Update driver skills at end of season based on performance
       */
      updateDriversAfterSeason: (seriesId) => {
        const { rivals, seasonStandings } = get()
        const standings = seasonStandings[seriesId] || []
        
        if (standings.length === 0) return
        
        const updates: Array<{ id: string; updates: Partial<RivalDriver> }> = []
        
        rivals.filter(r => r.currentSeriesId === seriesId && r.careerActive).forEach(driver => {
          const standing = standings.find(s => s.driverName === `${driver.firstName} ${driver.lastName}`)
          if (!standing) return
          
          // Calculate skill change based on season performance
          let skillChange = 0
          const stage = driver.careerStage || 'peak'
          
          switch (stage) {
            case 'rising':
              // Young drivers can improve significantly
              if (standing.wins > 0) skillChange = driver.developmentRate * 2
              else if (standing.podiums > 0) skillChange = driver.developmentRate * 1.5
              else if (standing.avgFinish <= 5) skillChange = driver.developmentRate
              else skillChange = driver.developmentRate * 0.5
              break
              
            case 'peak':
              // Stable, small adjustments based on performance
              if (standing.wins >= 3) skillChange = 0.01
              else if (standing.podiums >= 5) skillChange = 0.005
              else if (standing.avgFinish > 15) skillChange = -0.005
              break
              
            case 'declining':
              // Natural decline, can slow with good results
              skillChange = -driver.declineRate
              if (standing.wins > 0) skillChange += 0.005
              if (standing.podiums >= 3) skillChange += 0.003
              break
              
            case 'veteran':
              // Faster decline
              skillChange = -driver.declineRate * 1.5
              if (standing.wins > 0) skillChange += 0.003
              break
          }
          
          const newBaseSkill = clamp(driver.baseSkill + skillChange, 0.3, 0.98)
          
          // Update career stage based on age
          let newStage = stage
          const age = driver.age + 1 // They're now a year older
          if (age < 24) newStage = 'rising'
          else if (age < 32) newStage = 'peak'
          else if (age < 38) newStage = 'declining'
          else newStage = 'veteran'
          
          // Update career totals
          updates.push({
            id: driver.id,
            updates: {
              baseSkill: newBaseSkill,
              careerStage: newStage,
              age,
              totalRaces: driver.totalRaces + standing.races,
              totalWins: driver.totalWins + standing.wins,
              totalPodiums: driver.totalPodiums + standing.podiums,
              championships: driver.championships + (standing.position === 1 ? 1 : 0),
              currentForm: 0, // Reset form for new season
              formStreak: 0,
              seasonStats: { wins: 0, podiums: 0, points: 0, races: 0, avgFinish: 0, bestFinish: 99, dnfs: 0 }
            }
          })
          
          console.log(`[Development] ${driver.firstName} ${driver.lastName}: skill ${driver.baseSkill.toFixed(3)} -> ${newBaseSkill.toFixed(3)} (${stage} -> ${newStage})`)
        })
        
        // Apply all updates
        set((state) => ({
          rivals: state.rivals.map(r => {
            const update = updates.find(u => u.id === r.id)
            return update ? { ...r, ...update.updates } : r
          })
        }))
      },

      /**
       * Run end-of-season transfer window with promotions, demotions, retirements
       */
      runTransferWindow: (currentYear) => {
        const { rivals, teams, series, seasonStandings } = get()
        const news: TransferNews[] = []
        
        // === 1. RETIREMENTS ===
        const retirementCandidates = rivals.filter(r => 
          r.careerActive && (
            (r.age >= 38 && r.careerStage === 'veteran') ||
            (r.age >= 40) ||
            (r.careerStage === 'veteran' && r.baseSkill < 0.45)
          )
        )
        
        retirementCandidates.forEach(driver => {
          // Retirement probability based on age and skill
          const retirementChance = driver.age >= 42 ? 0.9 :
                                   driver.age >= 40 ? 0.6 :
                                   driver.age >= 38 ? 0.3 : 0.1
          
          if (Math.random() < retirementChance) {
            get().retireRival(driver.id)
            news.push({
              type: 'retirement',
              driverName: `${driver.firstName} ${driver.lastName}`,
              headline: `${driver.firstName} ${driver.lastName} announces retirement after ${driver.totalRaces} career races and ${driver.championships} championship${driver.championships !== 1 ? 's' : ''}`
            })
          }
        })
        
        // === 2. PROMOTIONS ===
        TIER_ORDER.slice(0, -1).forEach((tier, tierIndex) => {
          const nextTier = TIER_ORDER[tierIndex + 1]
          const tierSeries = series.filter(s => s.tier === tier)
          
          tierSeries.forEach(s => {
            const standings = seasonStandings[s.id] || []
            
            // Top 3 finishers under 28 are promotion candidates
            const promotionCandidates = standings.slice(0, 3)
              .map(standing => rivals.find(r => r.id === standing.driverId || `${r.firstName} ${r.lastName}` === standing.driverName))
              .filter((r): r is RivalDriver => !!r && r.age < 28 && r.careerActive)
            
            promotionCandidates.forEach(driver => {
              // Find a team in the next tier with an available seat
              const nextTierTeams = teams.filter(t => {
                const teamSeries = series.find(ts => ts.id === t.seriesId)
                return teamSeries?.tier === nextTier && (t.availableSeats ?? 0) > 0
              })
              
              if (nextTierTeams.length > 0) {
                const newTeam = nextTierTeams[Math.floor(Math.random() * nextTierTeams.length)]
                const oldTeam = teams.find(t => t.id === driver.currentTeamId)
                
                // Move driver to new team
                set((state): Partial<RivalStore> => ({
                  rivals: state.rivals.map(r => r.id === driver.id ? {
                    ...r,
                    currentTeamId: newTeam.id,
                    currentSeriesId: newTeam.seriesId ?? '',
                    contractEndYear: currentYear + 2
                  } : r),
                  teams: state.teams.map(t => {
                    if (t.id === driver.currentTeamId) return { ...t, availableSeats: (t.availableSeats ?? 0) + 1 }
                    if (t.id === newTeam.id) return { ...t, availableSeats: (t.availableSeats ?? 0) - 1 }
                    return t
                  })
                }))
                
                news.push({
                  type: 'promotion',
                  driverName: `${driver.firstName} ${driver.lastName}`,
                  fromTeam: oldTeam?.name,
                  toTeam: newTeam.name,
                  fromSeries: s.name,
                  toSeries: series.find(ts => ts.id === newTeam.seriesId)?.name,
                  headline: `${driver.firstName} ${driver.lastName} promoted to ${newTeam.name} for ${currentYear + 1}`
                })
              }
            })
          })
        })
        
        // === 3. DEMOTIONS ===
        TIER_ORDER.slice(1).forEach((tier, tierIndex) => {
          const prevTier = TIER_ORDER[tierIndex]
          const tierSeries = series.filter(s => s.tier === tier)
          
          tierSeries.forEach(s => {
            const standings = seasonStandings[s.id] || []
            
            // Bottom 25% over age 32 with declining form are demotion candidates
            const bottomQuarter = Math.floor(standings.length * 0.75)
            const demotionCandidates = standings.slice(bottomQuarter)
              .map(standing => rivals.find(r => r.id === standing.driverId || `${r.firstName} ${r.lastName}` === standing.driverName))
              .filter((r): r is RivalDriver => !!r && r.age > 32 && r.careerStage !== 'rising' && r.careerActive)
            
            demotionCandidates.forEach(driver => {
              if (Math.random() < 0.4) { // 40% chance of demotion
                const prevTierTeams = teams.filter(t => {
                  const teamSeries = series.find(ts => ts.id === t.seriesId)
                  return teamSeries?.tier === prevTier && (t.availableSeats ?? 0) > 0
                })
                
                if (prevTierTeams.length > 0) {
                  const newTeam = prevTierTeams[Math.floor(Math.random() * prevTierTeams.length)]
                  const oldTeam = teams.find(t => t.id === driver.currentTeamId)
                  
                  set((state): Partial<RivalStore> => ({
                    rivals: state.rivals.map(r => r.id === driver.id ? {
                      ...r,
                      currentTeamId: newTeam.id,
                      currentSeriesId: newTeam.seriesId ?? '',
                      contractEndYear: currentYear + 1
                    } : r),
                    teams: state.teams.map(t => {
                      if (t.id === driver.currentTeamId) return { ...t, availableSeats: (t.availableSeats ?? 0) + 1 }
                      if (t.id === newTeam.id) return { ...t, availableSeats: (t.availableSeats ?? 0) - 1 }
                      return t
                    })
                  }))
                  
                  news.push({
                    type: 'demotion',
                    driverName: `${driver.firstName} ${driver.lastName}`,
                    fromTeam: oldTeam?.name,
                    toTeam: newTeam.name,
                    fromSeries: s.name,
                    toSeries: series.find(ts => ts.id === newTeam.seriesId)?.name,
                    headline: `${driver.firstName} ${driver.lastName} moves to ${newTeam.name} for ${currentYear + 1}`
                  })
                }
              }
            })
          })
        })
        
        console.log(`[Transfer Window] ${news.length} moves completed`)
        return news
      },

      // ============================================
      // AI TEAM ECONOMICS SIMULATION
      // ============================================

      /**
       * Initialize economics for all teams that don't have it
       */
      initializeTeamEconomics: () => {
        const { teams } = get()
        const currentYear = new Date().getFullYear()
        
        const updatedTeams = teams.map(team => {
          // Skip if already has economics
          if (team.economics) return team
          
          // Initialize based on current team state
          const sponsorTier = getSponsorTierFromPrestige(team.prestige, team.tier)
          const financialHealth = getInitialFinancialHealth(team.prestige, team.budget)
          
          const economics: AITeamEconomics = {
            financialHealth,
            sponsorTier,
            seasonWins: 0,
            seasonPodiums: 0,
            seasonPoints: 0,
            bestChampionshipPosition: 99,
            momentum: 0,
            foundedYear: currentYear - Math.floor(team.prestige / 5) - Math.floor(Math.random() * 20),
            recentPositions: []
          }
          
          return { ...team, economics }
        })
        
        set({ teams: updatedTeams })
        console.log(`[Team Economics] Initialized economics for ${updatedTeams.filter(t => !teams.find(ot => ot.id === t.id)?.economics).length} teams`)
      },

      /**
       * Update team season stats after each race in a series
       */
      updateTeamSeasonStats: (seriesId, standings) => {
        const { teams } = get()
        
        const updatedTeams = teams.map(team => {
          if (team.seriesId !== seriesId || !team.economics) return team
          
          // Find team's drivers in standings
          const teamDriverStandings = standings.filter(s => {
            const rivalStore = get()
            const driver = rivalStore.rivals.find(r => 
              `${r.firstName} ${r.lastName}` === s.driverName && r.currentTeamId === team.id
            )
            return driver !== undefined
          })
          
          if (teamDriverStandings.length === 0) return team
          
          // Aggregate team stats
          const totalWins = teamDriverStandings.reduce((sum, s) => sum + s.wins, 0)
          const totalPodiums = teamDriverStandings.reduce((sum, s) => sum + s.podiums, 0)
          const totalPoints = teamDriverStandings.reduce((sum, s) => sum + s.points, 0)
          const bestPosition = Math.min(...teamDriverStandings.map(s => s.position))
          
          return {
            ...team,
            economics: {
              ...team.economics,
              seasonWins: totalWins,
              seasonPodiums: totalPodiums,
              seasonPoints: totalPoints,
              bestChampionshipPosition: Math.min(team.economics.bestChampionshipPosition, bestPosition)
            }
          }
        })
        
        set({ teams: updatedTeams })
      },

      /**
       * Process end-of-season economic changes for all AI teams
       * This simulates: sponsor changes, facility upgrades/downgrades, budget shifts, prestige changes
       */
      processTeamEconomicsEndOfSeason: (currentYear) => {
        const { teams, series, seasonStandings } = get()
        const news: TeamEconomicsNews[] = []
        
        const updatedTeams = teams.map(team => {
          // Skip teams without economics
          if (!team.economics) return team
          
          const teamSeries = series.find(s => s.id === team.seriesId)
          if (!teamSeries) return team
          
          const standings = seasonStandings[team.seriesId ?? ''] || []
          let updatedTeam = { ...team }
          let updatedEconomics = { ...team.economics }
          
          // Calculate season performance rating (0-100)
          const gridSize = teamSeries.gridSize || standings.length || 20
          const positionRating = updatedEconomics.bestChampionshipPosition <= 3 ? 100 :
                                 updatedEconomics.bestChampionshipPosition <= 5 ? 80 :
                                 updatedEconomics.bestChampionshipPosition <= 10 ? 60 :
                                 updatedEconomics.bestChampionshipPosition <= gridSize / 2 ? 40 : 20
          
          const winsRating = Math.min(100, updatedEconomics.seasonWins * 20)
          const podiumsRating = Math.min(100, updatedEconomics.seasonPodiums * 10)
          const performanceRating = (positionRating * 0.5 + winsRating * 0.3 + podiumsRating * 0.2)
          
          // Update momentum based on performance vs expectations
          const expectedRating = team.prestige // Prestige roughly equals expectation
          const performanceDelta = performanceRating - expectedRating
          
          if (performanceDelta > 20) {
            updatedEconomics.momentum = Math.min(3, updatedEconomics.momentum + 1)
          } else if (performanceDelta < -20) {
            updatedEconomics.momentum = Math.max(-3, updatedEconomics.momentum - 1)
          } else {
            // Trend toward 0
            if (updatedEconomics.momentum > 0) updatedEconomics.momentum--
            if (updatedEconomics.momentum < 0) updatedEconomics.momentum++
          }
          
          // Store recent position
          updatedEconomics.recentPositions = [
            updatedEconomics.bestChampionshipPosition,
            ...(updatedEconomics.recentPositions || []).slice(0, 2)
          ]
          
          // === SPONSOR CHANGES ===
          const currentSponsorIndex = SPONSOR_TIERS.indexOf(updatedEconomics.sponsorTier)
          let newSponsorIndex = currentSponsorIndex
          
          // Good performance or momentum can attract better sponsors
          if ((performanceRating > 70 && Math.random() < 0.3) || 
              (updatedEconomics.momentum >= 2 && Math.random() < 0.4)) {
            if (currentSponsorIndex < SPONSOR_TIERS.length - 1) {
              newSponsorIndex = currentSponsorIndex + 1
              news.push({
                type: 'sponsor_upgrade',
                teamName: team.name,
                seriesName: teamSeries.name,
                oldValue: updatedEconomics.sponsorTier,
                newValue: SPONSOR_TIERS[newSponsorIndex],
                headline: `${team.name} secures ${SPONSOR_TIERS[newSponsorIndex]} sponsorship deal for ${currentYear + 1}`
              })
            }
          }
          // Poor performance or negative momentum can lose sponsors
          else if ((performanceRating < 30 && Math.random() < 0.25) || 
                   (updatedEconomics.momentum <= -2 && Math.random() < 0.35)) {
            if (currentSponsorIndex > 0) {
              newSponsorIndex = currentSponsorIndex - 1
              news.push({
                type: 'sponsor_downgrade',
                teamName: team.name,
                seriesName: teamSeries.name,
                oldValue: updatedEconomics.sponsorTier,
                newValue: SPONSOR_TIERS[newSponsorIndex],
                headline: `${team.name} loses major sponsor, downgrades to ${SPONSOR_TIERS[newSponsorIndex]} backing`
              })
            }
          }
          updatedEconomics.sponsorTier = SPONSOR_TIERS[newSponsorIndex]
          
          // === FINANCIAL HEALTH ===
          // Good sponsors and results improve financial health
          const sponsorIncome = (newSponsorIndex + 1) * 10 // 10-60 points from sponsors
          const resultBonus = performanceRating * 0.2 // 0-20 from results
          const baseCost = 40 // Operating costs eat into health
          
          const healthChange = sponsorIncome + resultBonus - baseCost + (updatedEconomics.momentum * 5)
          updatedEconomics.financialHealth = Math.max(10, Math.min(100, 
            updatedEconomics.financialHealth + (healthChange / 10)
          ))
          
          // === FACILITY CHANGES ===
          const currentFacilityIndex = FACILITY_LEVELS.indexOf(team.facilities ?? 'basic')
          let newFacilityIndex = currentFacilityIndex
          
          // High financial health + good momentum can upgrade facilities
          if (updatedEconomics.financialHealth > 75 && updatedEconomics.momentum > 0 && Math.random() < 0.2) {
            if (currentFacilityIndex < FACILITY_LEVELS.length - 1) {
              newFacilityIndex = currentFacilityIndex + 1
              news.push({
                type: 'facility_upgrade',
                teamName: team.name,
                seriesName: teamSeries.name,
                oldValue: team.facilities,
                newValue: FACILITY_LEVELS[newFacilityIndex],
                headline: `${team.name} invests in new ${FACILITY_LEVELS[newFacilityIndex]} facilities`
              })
            }
          }
          // Low financial health forces facility downgrade
          else if (updatedEconomics.financialHealth < 30 && Math.random() < 0.15) {
            if (currentFacilityIndex > 0) {
              newFacilityIndex = currentFacilityIndex - 1
              news.push({
                type: 'facility_downgrade',
                teamName: team.name,
                seriesName: teamSeries.name,
                oldValue: team.facilities,
                newValue: FACILITY_LEVELS[newFacilityIndex],
                headline: `${team.name} forced to cut costs, downgrading facilities`
              })
            }
          }
          updatedTeam.facilities = FACILITY_LEVELS[newFacilityIndex]
          
          // === BUDGET CHANGES ===
          const currentBudgetIndex = BUDGET_LEVELS.indexOf(team.budget)
          let newBudgetIndex = currentBudgetIndex
          
          // Strong financial health + good sponsors can increase budget
          if (updatedEconomics.financialHealth > 80 && newSponsorIndex >= 3 && Math.random() < 0.15) {
            if (currentBudgetIndex < BUDGET_LEVELS.length - 1) {
              newBudgetIndex = currentBudgetIndex + 1
              news.push({
                type: 'budget_increase',
                teamName: team.name,
                seriesName: teamSeries.name,
                oldValue: team.budget,
                newValue: BUDGET_LEVELS[newBudgetIndex],
                headline: `${team.name} announces increased ${BUDGET_LEVELS[newBudgetIndex]} budget for ${currentYear + 1}`
              })
            }
          }
          // Poor financial health forces budget cut
          else if (updatedEconomics.financialHealth < 25 && Math.random() < 0.2) {
            if (currentBudgetIndex > 0) {
              newBudgetIndex = currentBudgetIndex - 1
              news.push({
                type: 'budget_decrease',
                teamName: team.name,
                seriesName: teamSeries.name,
                oldValue: team.budget,
                newValue: BUDGET_LEVELS[newBudgetIndex],
                headline: `${team.name} announces budget cuts amid financial struggles`
              })
            }
          }
          updatedTeam.budget = BUDGET_LEVELS[newBudgetIndex]
          
          // === PRESTIGE CHANGES ===
          let prestigeChange = 0
          
          // Championship win = big prestige boost
          if (updatedEconomics.bestChampionshipPosition === 1) {
            prestigeChange += 5 + Math.floor(Math.random() * 3)
          } else if (updatedEconomics.bestChampionshipPosition <= 3) {
            prestigeChange += 2 + Math.floor(Math.random() * 2)
          } else if (updatedEconomics.bestChampionshipPosition > gridSize * 0.75) {
            prestigeChange -= 2 + Math.floor(Math.random() * 3)
          }
          
          // Momentum affects prestige
          prestigeChange += updatedEconomics.momentum
          
          // Facility changes affect prestige
          if (newFacilityIndex > currentFacilityIndex) prestigeChange += 2
          if (newFacilityIndex < currentFacilityIndex) prestigeChange -= 3
          
          const oldPrestige = team.prestige
          updatedTeam.prestige = Math.max(10, Math.min(100, team.prestige + prestigeChange))
          
          if (prestigeChange >= 5) {
            news.push({
              type: 'prestige_rise',
              teamName: team.name,
              seriesName: teamSeries.name,
              oldValue: String(oldPrestige),
              newValue: String(updatedTeam.prestige),
              headline: `${team.name}'s reputation soars after successful ${currentYear} season`
            })
          } else if (prestigeChange <= -5) {
            news.push({
              type: 'prestige_fall',
              teamName: team.name,
              seriesName: teamSeries.name,
              oldValue: String(oldPrestige),
              newValue: String(updatedTeam.prestige),
              headline: `${team.name} faces criticism after disappointing ${currentYear} campaign`
            })
          }
          
          // === FINANCIAL CRISIS / INVESTMENT ===
          if (updatedEconomics.financialHealth < 20 && updatedEconomics.momentum <= -2) {
            news.push({
              type: 'financial_crisis',
              teamName: team.name,
              seriesName: teamSeries.name,
              headline: `${team.name} facing financial difficulties, future uncertain`
            })
          } else if (updatedEconomics.financialHealth > 90 && updatedEconomics.momentum >= 2) {
            news.push({
              type: 'investment_boost',
              teamName: team.name,
              seriesName: teamSeries.name,
              headline: `${team.name} attracts major investment following stellar season`
            })
          }
          
          // Reset season stats for next year
          updatedEconomics.seasonWins = 0
          updatedEconomics.seasonPodiums = 0
          updatedEconomics.seasonPoints = 0
          updatedEconomics.bestChampionshipPosition = 99
          
          updatedTeam.economics = updatedEconomics
          return updatedTeam
        })
        
        set({ teams: updatedTeams })
        console.log(`[Team Economics] Processed ${updatedTeams.length} teams, ${news.length} economic changes`)
        return news
      },

      /**
       * Generate new rookie drivers for the upcoming season
       */
      generateSeasonRookies: (currentYear) => {
        const { teams, series } = get()
        const newRookies: RivalDriver[] = []
        
        // Entry-level series get 3-4 rookies each
        const entrySeries = series.filter(s => s.tier === 'entry' || s.tier === 'amateur')
        
        entrySeries.forEach(s => {
          const numRookies = 2 + Math.floor(Math.random() * 3) // 2-4 rookies
          const seriesTeams = teams.filter(t => t.seriesId === s.id && (t.availableSeats ?? 0) > 0)
          
          for (let i = 0; i < numRookies && seriesTeams.length > 0; i++) {
            const team = seriesTeams[Math.floor(Math.random() * seriesTeams.length)]
            const rookie = generateRookieDriver(s.id, team, currentYear)
            
            newRookies.push(rookie)
            team.availableSeats = Math.max(0, (team.availableSeats ?? 0) - 1)
            
            console.log(`[Rookie] ${rookie.firstName} ${rookie.lastName} joins ${team.name}`)
          }
        })
        
        // Add rookies to the store
        set((state): Partial<RivalStore> => ({
          rivals: [...state.rivals, ...newRookies],
          teams: state.teams.map(t => {
            const teamRookies = newRookies.filter(r => r.currentTeamId === t.id)
            const existingDrivers = t.drivers ?? []
            return teamRookies.length > 0 
              ? { ...t, availableSeats: (t.availableSeats ?? 0) - teamRookies.length, drivers: [...existingDrivers, ...teamRookies.map(r => r.id)] } as Team
              : t
          })
        }))
        
        return newRookies
      },

      /**
       * Get all drivers in a series with their effective skill for the weekend
       */
      getDriversWithForm: (seriesId, trackId) => {
        const { rivals, getTeamDevelopmentModifier } = get()
        const seriesDrivers = rivals.filter(r => r.currentSeriesId === seriesId && r.careerActive)
        
        return seriesDrivers.map(driver => {
          const weekendForm = get().calculateWeekendForm(driver.id, trackId)
          
          // Include team development modifier - AI teams that have developed get a performance boost
          const teamDevModifier = getTeamDevelopmentModifier(driver.currentTeamId)
          
          // Team development converts to skill bonus (e.g., 0.10 modifier = +0.10 effective skill)
          // This makes teams with better development perform better
          const effectiveSkill = clamp(driver.baseSkill + weekendForm + teamDevModifier, 0.3, 0.98)
          
          return {
            ...driver,
            effectiveSkill,
            weekendForm,
            teamDevBonus: teamDevModifier // Track this for debugging/display
          }
        })
      },

      /**
       * Prepare for race weekend - calculate and store weekend form for all drivers
       */
      prepareRaceWeekend: (seriesId, trackId) => {
        const { rivals } = get()
        const seriesDrivers = rivals.filter(r => r.currentSeriesId === seriesId && r.careerActive)
        
        const updates = seriesDrivers.map(driver => {
          const weekendForm = get().calculateWeekendForm(driver.id, trackId)
          return { id: driver.id, weekendForm }
        })
        
        set((state) => ({
          rivals: state.rivals.map(r => {
            const update = updates.find(u => u.id === r.id)
            return update ? { ...r, weekendForm: update.weekendForm } : r
          })
        }))
        
        console.log(`[Race Weekend] Prepared form for ${updates.length} drivers at ${trackId}`)
      },

      // ============================================
      // TV BROADCAST COMMENTARY: NARRATIVE SYSTEM
      // ============================================

      /**
       * Generate rich narrative backstories for all drivers in a series
       * Uses batched LLM calls for efficiency
       */
      generateNarrativesForSeries: async (seriesId, apiKey, onProgress) => {
        const { rivals, teams, series } = get()
        const targetSeries = series.find(s => s.id === seriesId)
        
        if (!targetSeries) {
          console.error(`[Narrative] Series not found: ${seriesId}`)
          return
        }
        
        // Get drivers in this series
        const seriesDrivers = rivals.filter(r => r.currentSeriesId === seriesId && r.careerActive)
        
        if (seriesDrivers.length === 0) {
          console.log(`[Narrative] No drivers found in series ${seriesId}`)
          return
        }
        
        // Check how many already have narratives
        const driversNeedingNarratives = seriesDrivers.filter(d => !d.narrative)
        
        if (driversNeedingNarratives.length === 0) {
          console.log(`[Narrative] All ${seriesDrivers.length} drivers already have narratives`)
          onProgress?.({ total: seriesDrivers.length, completed: seriesDrivers.length, status: 'complete' })
          return
        }
        
        console.log(`[Narrative] Generating narratives for ${driversNeedingNarratives.length} drivers in ${targetSeries.name}`)
        
        // ── Try pre-generated narratives first ──
        if (isPreGenContentLoaded()) {
          const preGenMatched: Record<string, any> = {}
          const remaining: typeof driversNeedingNarratives = []

          for (const driver of driversNeedingNarratives) {
            const preGenNarr = getDriverNarrative(driver.id)
            if (preGenNarr) {
              preGenMatched[driver.id] = preGenNarr
            } else {
              remaining.push(driver)
            }
          }

          // Apply pre-generated narratives immediately
          if (Object.keys(preGenMatched).length > 0) {
            set((state) => ({
              rivals: state.rivals.map(rival => {
                const narrative = preGenMatched[rival.id]
                if (narrative) return { ...rival, narrative }
                return rival
              })
            }))
            console.log(`[Narrative] Applied ${Object.keys(preGenMatched).length} pre-generated narratives for ${targetSeries.name}`)
          }

          // If all drivers are covered, we're done
          if (remaining.length === 0) {
            onProgress?.({ total: driversNeedingNarratives.length, completed: driversNeedingNarratives.length, status: 'complete' })
            return
          }

          // Fall through to Gemini for remaining drivers
          console.log(`[Narrative] ${remaining.length} drivers need Gemini-generated narratives (not found in pre-gen data)`)
          // Update the list to only generate for remaining
          driversNeedingNarratives.length = 0
          driversNeedingNarratives.push(...remaining)
        }

        // ── Fallback: Gemini generation for any remaining drivers ──
        const driverInfos = driversNeedingNarratives.map(driver => {
          const team = teams.find(t => t.id === driver.currentTeamId)
          return {
            id: driver.id,
            name: `${driver.firstName} ${driver.lastName}`,
            firstName: driver.firstName,
            lastName: driver.lastName,
            nationality: driver.nationality,
            age: driver.age,
            teamName: team?.name || 'Unknown Team',
            teamTier: team?.tier || 'amateur',
            personality: driver.personality,
            careerStage: driver.careerStage,
            totalWins: driver.totalWins,
            totalPodiums: driver.totalPodiums,
            championships: driver.championships
          }
        })
        
        try {
          if (!window.electron?.generateDriverNarratives) {
            console.error('[Narrative] window.electron.generateDriverNarratives is not available')
            onProgress?.({ total: driversNeedingNarratives.length, completed: 0, status: 'error' })
            return
          }
          
          const result = await window.electron.generateDriverNarratives(
            driverInfos,
            targetSeries.name,
            apiKey
          )
          
          if (result.success && result.narratives) {
            set((state) => ({
              rivals: state.rivals.map(rival => {
                const narrative = result.narratives[rival.id]
                if (narrative) {
                  return { ...rival, narrative }
                }
                return rival
              })
            }))
            
            console.log(`[Narrative] Generated ${Object.keys(result.narratives).length} narratives for ${targetSeries.name}`)
            onProgress?.({ total: driversNeedingNarratives.length, completed: driversNeedingNarratives.length, status: 'complete' })
          } else {
            console.error(`[Narrative] Failed to generate narratives:`, result.error)
            onProgress?.({ total: driversNeedingNarratives.length, completed: 0, status: 'error' })
          }
        } catch (error) {
          console.error(`[Narrative] Error generating narratives:`, error)
          onProgress?.({ total: driversNeedingNarratives.length, completed: 0, status: 'error' })
        }
      },

      /**
       * Check if a series has narratives generated for all drivers
       */
      hasNarrativesGenerated: (seriesId) => {
        const { rivals } = get()
        const seriesDrivers = rivals.filter(r => r.currentSeriesId === seriesId && r.careerActive)
        
        if (seriesDrivers.length === 0) return true // Empty series counts as complete
        
        return seriesDrivers.every(d => d.narrative !== undefined)
      },

      /**
       * Get overall narrative generation status across all series
       */
      getNarrativeGenerationStatus: () => {
        const { rivals, series } = get()
        
        const activeDrivers = rivals.filter(r => r.careerActive)
        const driversWithNarratives = activeDrivers.filter(d => d.narrative !== undefined)
        
        // Find series that need narratives
        const pendingSeries = series.filter(s => {
          const drivers = activeDrivers.filter(d => d.currentSeriesId === s.id)
          return drivers.length > 0 && drivers.some(d => !d.narrative)
        }).map(s => s.name)
        
        return {
          total: activeDrivers.length,
          generated: driversWithNarratives.length,
          pending: pendingSeries
        }
      },

      /**
       * Check if this career save needs narrative migration
       * Returns true if there are drivers without narratives
       */
      needsNarrativeMigration: () => {
        const { rivals } = get()
        
        // If no rivals, no migration needed
        if (rivals.length === 0) return false
        
        // Check if any active driver is missing a narrative
        const activeDrivers = rivals.filter(r => r.careerActive)
        const driversWithoutNarratives = activeDrivers.filter(d => !d.narrative)
        
        return driversWithoutNarratives.length > 0
      },

      /**
       * Migrate all series by generating narratives for drivers without them
       * Call this after loading an existing career to add TV broadcast support
       * Prioritizes the player's current series first, then does the rest
       */
      migrateNarrativesForAllSeries: async (apiKey, onProgress) => {
        const { series, getNarrativeGenerationStatus, generateNarrativesForSeries } = get()
        
        // Get player's current series from career store
        const playerSeriesId = useCareerStore.getState().player?.currentSeriesId
        
        const status = getNarrativeGenerationStatus()
        const pendingSeries = status.pending
        
        if (pendingSeries.length === 0) {
          console.log('[NarrativeMigration] No series need migration')
          onProgress?.('Complete!', 1)
          return
        }
        
        console.log(`[NarrativeMigration] Starting migration for ${pendingSeries.length} series`)
        
        // Get series objects for pending series names
        let seriesToMigrate = series.filter(s => pendingSeries.includes(s.name))
        const totalSeries = seriesToMigrate.length
        
        // Prioritize player's current series - move it to the front
        if (playerSeriesId) {
          const playerSeriesIndex = seriesToMigrate.findIndex(s => s.id === playerSeriesId)
          if (playerSeriesIndex > 0) {
            const playerSeries = seriesToMigrate[playerSeriesIndex]
            seriesToMigrate = [
              playerSeries,
              ...seriesToMigrate.slice(0, playerSeriesIndex),
              ...seriesToMigrate.slice(playerSeriesIndex + 1)
            ]
            console.log(`[NarrativeMigration] Prioritizing player series: ${playerSeries.name}`)
          }
        }
        
        for (let i = 0; i < seriesToMigrate.length; i++) {
          const s = seriesToMigrate[i]
          // Calculate progress as 0-1 (completed/total, but show current progress)
          const progress = i / totalSeries
          
          // Report progress with series name
          onProgress?.(s.name, progress)
          
          console.log(`[NarrativeMigration] Generating narratives for ${s.name} (${i + 1}/${totalSeries})`)
          
          await generateNarrativesForSeries(s.id, apiKey)
          
          // Small delay between series to avoid rate limiting
          if (i < seriesToMigrate.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }
        
        // Report completion
        onProgress?.('Complete!', 1)
        console.log('[NarrativeMigration] Migration complete')
      },

      // ============================================
      // TV BROADCAST COMMENTARY: TEAM NARRATIVE SYSTEM
      // ============================================

      /**
       * Generate rich narrative backstories for all teams in a series
       * Uses batched LLM calls for efficiency
       */
      generateTeamNarrativesForSeries: async (seriesId, apiKey, onProgress) => {
        const { teams, series } = get()
        const targetSeries = series.find(s => s.id === seriesId)
        
        if (!targetSeries) {
          console.error(`[TeamNarrative] Series not found: ${seriesId}`)
          return
        }
        
        // Get teams in this series that need narratives
        let seriesTeams = Object.values(teams).filter(t => 
          t.seriesId === seriesId && !t.narrative
        )
        
        if (seriesTeams.length === 0) {
          console.log(`[TeamNarrative] All teams in ${targetSeries.name} already have narratives`)
          return
        }
        
        console.log(`[TeamNarrative] Generating narratives for ${seriesTeams.length} teams in ${targetSeries.name}`)

        // ── Try pre-generated team narratives first ──
        if (isPreGenContentLoaded()) {
          const preGenMatched: Record<string, any> = {}

          for (const team of seriesTeams) {
            const preGenNarr = getPreGenTeamNarrative(team.id)
            if (preGenNarr) {
              // Map pre-gen narrative to game's TeamNarrative shape
              preGenMatched[team.id] = {
                teamId: team.id,
                origin: preGenNarr.origin || '',
                philosophy: preGenNarr.philosophy || '',
                culturalIdentity: '',
                technicalReputation: preGenNarr.reputation || '',
                paddockStanding: '',
                achievements: preGenNarr.achievements || [],
                titleCount: (preGenNarr.achievements || []).length,
                famousAlumni: [],
                teamPrincipal: preGenNarr.teamPrincipal?.name || '',
                keyFigures: preGenNarr.keyFigures?.map((f: any) => f.name) || [],
                currentTrajectory: '',
                recentForm: '',
                anecdotes: [],
                fanBase: preGenNarr.fanBase || '',
                generatedAt: new Date().toISOString(),
                generatedVersion: 1
              } as TeamNarrative
            }
          }

          // Apply pre-generated narratives immediately
          if (Object.keys(preGenMatched).length > 0) {
            const teamsArray = get().teams
            const teamsRecord: Record<string, Team> = {}
            teamsArray.forEach(team => { teamsRecord[team.id] = team })

            for (const [teamId, narrative] of Object.entries(preGenMatched)) {
              if (teamsRecord[teamId]) {
                teamsRecord[teamId] = { ...teamsRecord[teamId], narrative: narrative as TeamNarrative }
              }
            }

            const updatedTeams = Object.values(teamsRecord)
            set({ teams: updatedTeams })
            console.log(`[TeamNarrative] Applied ${Object.keys(preGenMatched).length} pre-generated team narratives for ${targetSeries.name}`)
          }

          // Filter out teams that now have narratives
          seriesTeams = seriesTeams.filter(t => !preGenMatched[t.id])
          if (seriesTeams.length === 0) {
            onProgress?.({ total: seriesTeams.length, completed: seriesTeams.length, status: 'complete' })
            return
          }

          console.log(`[TeamNarrative] ${seriesTeams.length} teams need Gemini-generated narratives`)
        }
        
        // ── Fallback: Gemini generation for remaining teams ──
        const teamBasicInfo = seriesTeams.map(t => ({
          id: t.id,
          name: t.name,
          shortName: t.shortName,
          country: t.country,
          tier: t.tier,
          budget: t.budget,
          facilities: t.facilities,
          prestige: t.prestige,
          seriesName: targetSeries.name,
          driverNames: (t.drivers ?? []).map(dId => {
            const id = typeof dId === 'string' ? dId : (dId as AMS2Driver).name
            const driver = get().rivals.find(r => r.id === id)
            return driver ? `${driver.firstName} ${driver.lastName}` : (typeof dId === 'string' ? 'Unknown' : (dId as AMS2Driver).name)
          })
        }))
        
        try {
          onProgress?.({ total: seriesTeams.length, completed: 0, status: 'generating' })
          
          if (!window.electron?.generateTeamNarratives) {
            console.error('[TeamNarrative] window.electron.generateTeamNarratives is not available')
            onProgress?.({ total: seriesTeams.length, completed: 0, status: 'error' })
            return
          }
          
          const result = await window.electron.generateTeamNarratives(
            teamBasicInfo,
            targetSeries.name,
            apiKey
          )
          
          if (result?.success && result.narratives) {
            const teamsArray = get().teams
            const teamsRecord: Record<string, Team> = {}
            teamsArray.forEach(team => {
              teamsRecord[team.id] = team
            })
            
            for (const [teamId, narrative] of Object.entries(result.narratives as Record<string, any>)) {
              if (teamsRecord[teamId]) {
                teamsRecord[teamId] = {
                  ...teamsRecord[teamId],
                  narrative: narrative as TeamNarrative
                }
              }
            }
            
            const updatedTeams = Object.values(teamsRecord)
            set({ teams: updatedTeams })
            console.log(`[TeamNarrative] Generated ${Object.keys(result.narratives).length} team narratives for ${targetSeries.name}`)
          }
          
          onProgress?.({ total: seriesTeams.length, completed: seriesTeams.length, status: 'complete' })
          
        } catch (error) {
          console.error(`[TeamNarrative] Failed to generate team narratives for ${targetSeries.name}:`, error)
          onProgress?.({ total: seriesTeams.length, completed: 0, status: 'error' })
        }
      },

      /**
       * Check if a series has team narratives generated for all teams
       */
      hasTeamNarrativesGenerated: (seriesId) => {
        const { teams } = get()
        const seriesTeams = Object.values(teams).filter(t => t.seriesId === seriesId)
        
        if (seriesTeams.length === 0) return true
        
        return seriesTeams.every(t => !!t.narrative)
      },

      /**
       * Check if any teams are missing narratives
       */
      needsTeamNarrativeMigration: () => {
        const { teams } = get()
        
        // Check if any team is missing a narrative
        const teamsWithoutNarratives = Object.values(teams).filter(t => !t.narrative)
        
        return teamsWithoutNarratives.length > 0
      },

      /**
       * Migrate all series by generating team narratives for teams without them
       */
      migrateTeamNarrativesForAllSeries: async (apiKey, onProgress) => {
        const { series, teams, generateTeamNarrativesForSeries } = get()
        
        // Get player's current series from career store
        const playerSeriesId = useCareerStore.getState().player?.currentSeriesId
        
        // Find series that have teams without narratives
        const seriesNeedingMigration = series.filter(s => {
          const seriesTeams = Object.values(teams).filter(t => t.seriesId === s.id)
          return seriesTeams.some(t => !t.narrative)
        })
        
        if (seriesNeedingMigration.length === 0) {
          console.log('[TeamNarrativeMigration] No series need migration')
          onProgress?.('Complete!', 1)
          return
        }
        
        console.log(`[TeamNarrativeMigration] Migrating ${seriesNeedingMigration.length} series`)
        
        // Prioritize player's current series
        let seriesToMigrate = seriesNeedingMigration
        const totalSeries = seriesToMigrate.length
        
        if (playerSeriesId) {
          const playerSeriesIndex = seriesToMigrate.findIndex(s => s.id === playerSeriesId)
          if (playerSeriesIndex > 0) {
            const playerSeries = seriesToMigrate[playerSeriesIndex]
            seriesToMigrate = [
              playerSeries,
              ...seriesToMigrate.slice(0, playerSeriesIndex),
              ...seriesToMigrate.slice(playerSeriesIndex + 1)
            ]
            console.log(`[TeamNarrativeMigration] Prioritizing player series: ${playerSeries.name}`)
          }
        }
        
        // Generate narratives for each series
        for (let i = 0; i < seriesToMigrate.length; i++) {
          const s = seriesToMigrate[i]
          const progress = i / totalSeries
          
          onProgress?.(s.name, progress)
          console.log(`[TeamNarrativeMigration] Generating team narratives for ${s.name} (${i + 1}/${totalSeries})`)
          
          await generateTeamNarrativesForSeries(s.id, apiKey)
          
          // Small delay between series
          if (i < seriesToMigrate.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }
        
        onProgress?.('Complete!', 1)
        console.log('[TeamNarrativeMigration] Migration complete')
      },

      /**
       * Start background narrative generation - PERSISTS ACROSS NAVIGATION
       * Call this from any component - it will continue running even if you navigate away
       */
      startBackgroundNarrativeGeneration: (apiKey: string) => {
        const { backgroundNarrativeGeneration, series, getNarrativeGenerationStatus, generateNarrativesForSeries } = get()
        
        // Don't start if already running
        if (backgroundNarrativeGeneration.isRunning) {
          console.log('[BackgroundNarratives] Already running, skipping...')
          return
        }
        
        // Get player's current series from career store
        const playerSeriesId = useCareerStore.getState().player?.currentSeriesId
        
        const status = getNarrativeGenerationStatus()
        const pendingSeries = status.pending
        
        if (pendingSeries.length === 0) {
          console.log('[BackgroundNarratives] No series need generation')
          return
        }
        
        // Mark as running
        set({
          backgroundNarrativeGeneration: {
            isRunning: true,
            currentSeries: 'Starting...',
            progress: 0,
            error: null
          }
        })
        
        console.log(`[BackgroundNarratives] Starting generation for ${pendingSeries.length} series`)
        
        // Get series objects for pending series names
        let seriesToMigrate = series.filter(s => pendingSeries.includes(s.name))
        const totalSeries = seriesToMigrate.length
        
        // Prioritize player's current series - move it to the front
        if (playerSeriesId) {
          const playerSeriesIndex = seriesToMigrate.findIndex(s => s.id === playerSeriesId)
          if (playerSeriesIndex > 0) {
            const playerSeries = seriesToMigrate[playerSeriesIndex]
            seriesToMigrate = [
              playerSeries,
              ...seriesToMigrate.slice(0, playerSeriesIndex),
              ...seriesToMigrate.slice(playerSeriesIndex + 1)
            ]
            console.log(`[BackgroundNarratives] Prioritizing player series: ${playerSeries.name}`)
          }
        }
        
        // Run generation in background (fire and forget)
        ;(async () => {
          try {
            for (let i = 0; i < seriesToMigrate.length; i++) {
              const s = seriesToMigrate[i]
              const progress = i / totalSeries
              
              // Update state (this persists across navigation!)
              set({
                backgroundNarrativeGeneration: {
                  isRunning: true,
                  currentSeries: s.name,
                  progress,
                  error: null
                }
              })
              
              console.log(`[BackgroundNarratives] Generating: ${s.name} (${i + 1}/${totalSeries})`)
              
              await generateNarrativesForSeries(s.id, apiKey)
              
              // Small delay between series to avoid rate limiting
              if (i < seriesToMigrate.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500))
              }
            }
            
            // Mark as complete
            set({
              backgroundNarrativeGeneration: {
                isRunning: false,
                currentSeries: null,
                progress: 1,
                error: null
              }
            })
            
            console.log('[BackgroundNarratives] Generation complete!')
          } catch (error) {
            console.error('[BackgroundNarratives] Generation failed:', error)
            set({
              backgroundNarrativeGeneration: {
                isRunning: false,
                currentSeries: null,
                progress: 0,
                error: String(error)
              }
            })
          }
        })()
      },

      /**
       * Get current background narrative generation status
       */
      getBackgroundNarrativeStatus: () => {
        const { backgroundNarrativeGeneration } = get()
        return backgroundNarrativeGeneration
      },

      /**
       * Start background TEAM narrative generation - PERSISTS ACROSS NAVIGATION
       * Call this from any component - it will continue running even if you navigate away
       */
      startBackgroundTeamNarrativeGeneration: (apiKey: string) => {
        const { backgroundTeamNarrativeGeneration, series, teams, generateTeamNarrativesForSeries } = get()
        
        // Don't start if already running
        if (backgroundTeamNarrativeGeneration.isRunning) {
          console.log('[BackgroundTeamNarratives] Already running, skipping...')
          return
        }
        
        // Get player's current series from career store
        const playerSeriesId = useCareerStore.getState().player?.currentSeriesId
        
        // Find series that have teams without narratives
        const seriesNeedingMigration = series.filter(s => {
          const seriesTeams = Object.values(teams).filter(t => t.seriesId === s.id)
          return seriesTeams.some(t => !t.narrative)
        })
        
        if (seriesNeedingMigration.length === 0) {
          console.log('[BackgroundTeamNarratives] No series need team narrative generation')
          return
        }
        
        // Mark as running
        set({
          backgroundTeamNarrativeGeneration: {
            isRunning: true,
            currentSeries: 'Starting...',
            progress: 0,
            error: null
          }
        })
        
        console.log(`[BackgroundTeamNarratives] Starting generation for ${seriesNeedingMigration.length} series`)
        
        // Prioritize player's current series
        let seriesToMigrate = seriesNeedingMigration
        const totalSeries = seriesToMigrate.length
        
        if (playerSeriesId) {
          const playerSeriesIndex = seriesToMigrate.findIndex(s => s.id === playerSeriesId)
          if (playerSeriesIndex > 0) {
            const playerSeries = seriesToMigrate[playerSeriesIndex]
            seriesToMigrate = [
              playerSeries,
              ...seriesToMigrate.slice(0, playerSeriesIndex),
              ...seriesToMigrate.slice(playerSeriesIndex + 1)
            ]
            console.log(`[BackgroundTeamNarratives] Prioritizing player series: ${playerSeries.name}`)
          }
        }
        
        // Run generation in background (fire and forget)
        ;(async () => {
          try {
            for (let i = 0; i < seriesToMigrate.length; i++) {
              const s = seriesToMigrate[i]
              const progress = i / totalSeries
              
              // Update state (this persists across navigation!)
              set({
                backgroundTeamNarrativeGeneration: {
                  isRunning: true,
                  currentSeries: s.name,
                  progress,
                  error: null
                }
              })
              
              console.log(`[BackgroundTeamNarratives] Generating: ${s.name} (${i + 1}/${totalSeries})`)
              
              await generateTeamNarrativesForSeries(s.id, apiKey)
              
              // Small delay between series to avoid rate limiting
              if (i < seriesToMigrate.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500))
              }
            }
            
            // Mark as complete
            set({
              backgroundTeamNarrativeGeneration: {
                isRunning: false,
                currentSeries: null,
                progress: 1,
                error: null
              }
            })
            
            console.log('[BackgroundTeamNarratives] Generation complete!')
          } catch (error) {
            console.error('[BackgroundTeamNarratives] Generation failed:', error)
            set({
              backgroundTeamNarrativeGeneration: {
                isRunning: false,
                currentSeries: null,
                progress: 0,
                error: String(error)
              }
            })
          }
        })()
      },

      /**
       * Get current background TEAM narrative generation status
       */
      getBackgroundTeamNarrativeStatus: () => {
        const { backgroundTeamNarrativeGeneration } = get()
        return backgroundTeamNarrativeGeneration
      },

      /**
       * Check if series data migration would help
       * Always returns true if there's an active career - allows refresh of stale data
       */
      needsSeriesDataMigration: () => {
        const { series } = get()
        return series.length > 0
      },

      /**
       * Migrate all series with authentic points systems and categories from championships
       * 
       * This updates:
       * - Points calculation will now use series-specific point systems
       * - Commentary will use series-appropriate vocabulary (no DRS for GT3, etc.)
       * - Future races will display correct points values
       * 
       * NOTE: Existing standings are preserved (position-based, not points-based)
       * Contracts and sponsors use position targets, so they work with any point system
       */
      migrateSeriesData: () => {
        const { series } = get()
        
        if (series.length === 0) {
          return { seriesUpdated: 0, message: 'No series to migrate' }
        }
        
        let updatedCount = 0
        let pointsSystemsApplied: string[] = []
        let commentaryProfilesApplied: string[] = []
        
        // Go through each series and verify it has proper championship links
        series.forEach(s => {
          if (!s.championshipId) return
          
          const championship = getChampionshipById(s.championshipId)
          if (!championship) return
          
          // Track what we're applying
          if (championship.pointsSystemId) {
            updatedCount++
            pointsSystemsApplied.push(`${s.shortName}: ${championship.pointsSystemId}`)
          }
          if (championship.seriesCategory) {
            commentaryProfilesApplied.push(`${s.shortName}: ${championship.seriesCategory}`)
          }
        })
        
        // Build detailed message
        let message = ''
        if (updatedCount > 0) {
          message = `Applied authentic data to ${updatedCount} series.\n`
          message += `Point systems: ${pointsSystemsApplied.slice(0, 5).join(', ')}${pointsSystemsApplied.length > 5 ? '...' : ''}\n`
          message += `Commentary profiles: ${commentaryProfilesApplied.slice(0, 5).join(', ')}${commentaryProfilesApplied.length > 5 ? '...' : ''}\n`
          message += '\nFuture races will use series-authentic points and terminology.'
        } else {
          message = 'All series already have current data'
        }
        
        console.log(`[SeriesDataMigration] Updated ${updatedCount} series`)
        console.log(`[SeriesDataMigration] Points systems: ${pointsSystemsApplied.join(', ')}`)
        console.log(`[SeriesDataMigration] Commentary profiles: ${commentaryProfilesApplied.join(', ')}`)
        
        return { seriesUpdated: updatedCount, message }
      },

      /**
       * Recalculate championship standings using the correct point system
       * For player: uses actual race history positions
       * For AI: estimates based on wins/podiums/races distribution
       */
      recalculateStandingsWithNewPoints: (seriesId: string) => {
        const { seasonStandings, series } = get()
        const currentStandings = seasonStandings[seriesId]
        
        if (!currentStandings || currentStandings.length === 0) {
          console.log(`[StandingsRecalc] No standings found for ${seriesId}`)
          return { success: false, message: 'No standings found' }
        }
        
        const currentSeries = series.find(s => s.id === seriesId)
        if (!currentSeries?.championshipId) {
          console.log(`[StandingsRecalc] Series ${seriesId} has no championship linked`)
          return { success: false, message: 'No championship linked' }
        }
        
        // Get the correct point system for this series
        const championship = getChampionshipById(currentSeries.championshipId)
        if (!championship?.pointsSystemId) {
          console.log(`[StandingsRecalc] Championship has no point system`)
          return { success: false, message: 'No point system configured' }
        }
        
        const pointsSystem = getPointsSystem(championship.pointsSystemId)
        const maxPointsPerRace = pointsSystem.points[1] || 25
        
        console.log(`[StandingsRecalc] Recalculating ${seriesId} with ${championship.pointsSystemId} (${maxPointsPerRace} pts/win)`)
        
        // Get player's actual race history for accurate recalculation
        const playerRaceHistory = useCareerStore.getState().player?.raceHistory || []
        const playerSeriesRaces = playerRaceHistory.filter((r: { seriesId: string }) => r.seriesId === seriesId)
        
        // Calculate what the points SHOULD be based on the new system
        const recalculatedStandings = currentStandings.map(standing => {
          let newPoints = 0
          
          if (standing.isPlayer && playerSeriesRaces.length > 0) {
            // For player: recalculate from actual race positions
            playerSeriesRaces.forEach((race: { racePosition: number; fastestLap?: boolean }) => {
              const racePoints = getPointsForPosition(pointsSystem, race.racePosition)
              // Add fastest lap bonus if applicable
              if (race.fastestLap && pointsSystem.fastestLap) {
                newPoints += pointsSystem.fastestLap
              }
              newPoints += racePoints
            })
            console.log(`[StandingsRecalc] Player: ${standing.points} → ${newPoints} pts (from ${playerSeriesRaces.length} races)`)
          } else {
            // For AI: estimate based on wins/podiums/races ratio
            const races = standing.races || 1
            const wins = standing.wins || 0
            const podiums = standing.podiums || 0
            
            // Points from wins
            newPoints += wins * (pointsSystem.points[1] || 25)
            
            // Points from other podiums (2nd and 3rd place)
            const otherPodiums = Math.max(0, podiums - wins)
            const avgPodiumPoints = ((pointsSystem.points[2] || 18) + (pointsSystem.points[3] || 15)) / 2
            newPoints += otherPodiums * avgPodiumPoints
            
            // Points from non-podium finishes
            const nonPodiumRaces = Math.max(0, races - podiums)
            // Estimate average points for non-podium races based on average position
            const avgNonPodiumPos = standing.avgFinish > 3 ? standing.avgFinish : 7
            const avgNonPodiumPoints = getPointsForPosition(pointsSystem, Math.round(avgNonPodiumPos))
            newPoints += nonPodiumRaces * avgNonPodiumPoints
            
            // Round to integer
            newPoints = Math.round(newPoints)
          }
          
          return {
            ...standing,
            points: newPoints
          }
        })
        
        // Re-sort by new points
        recalculatedStandings.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points
          if (b.wins !== a.wins) return b.wins - a.wins
          return a.avgFinish - b.avgFinish
        })
        
        // Reassign positions
        recalculatedStandings.forEach((standing, index) => {
          standing.position = index + 1
        })
        
        // Update the standings
        set((state) => ({
          seasonStandings: {
            ...state.seasonStandings,
            [seriesId]: recalculatedStandings
          }
        }))
        
        const leader = recalculatedStandings[0]
        console.log(`[StandingsRecalc] Done! Leader: ${leader?.driverName} (${leader?.points} pts)`)
        
        return { 
          success: true, 
          message: `Recalculated with ${championship.pointsSystemId}`,
          oldLeaderPoints: currentStandings[0]?.points,
          newLeaderPoints: leader?.points
        }
      },

      // ============================================
      // TEAM DEVELOPMENT SYSTEM
      // ============================================
      
      /**
       * Initialize team development for all teams
       */
      initializeTeamDevelopment: () => {
        const { teams } = get()
        
        const updatedTeams = teams.map(team => {
          // Skip if already has development
          if (team.development) return team
          
          // Create development state based on team budget
          const development = createAITeamDevelopment(
            team.id,
            team.budget,
            // Starting points based on prestige (higher prestige = more developed)
            Math.round(team.prestige * 0.4) // 0-40 starting points
          )
          
          return { ...team, development }
        })
        
        set({ teams: updatedTeams })
        console.log(`[Team Development] Initialized development for ${updatedTeams.length} teams`)
      },

      /**
       * Update all AI team development for one week
       */
      updateAllTeamDevelopment: (currentWeek) => {
        const { teams } = get()
        const events: TeamDevelopmentEvent[] = []
        
        const updatedTeams = teams.map(team => {
          if (!team.development) {
            // Initialize if missing
            const development = createAITeamDevelopment(
              team.id,
              team.budget,
              Math.round(team.prestige * 0.4)
            )
            return { ...team, development }
          }
          
          // Update development
          const { newState, pointsGained: _pointsGained, event } = updateAITeamDevelopment(
            team.development,
            currentWeek
          )
          
          // Add team name to event if generated; map to store's TeamDevelopmentEvent shape
          if (event) {
            const description = event.description.replace('{teamName}', team.name)
            events.push({
              teamId: team.id,
              teamName: team.name,
              type: event.type,
              description,
              modifier: event.effects?.reduce((s: number, e: { value: number }) => s + e.value, 0) ?? 0,
              week: event.week
            })
          }
          
          return { ...team, development: newState }
        })
        
        set({ 
          teams: updatedTeams,
          teamDevelopmentEvents: [...get().teamDevelopmentEvents.slice(-50), ...events] // Keep last 50 events
        })
        
        if (events.length > 0) {
          console.log(`[Team Development] Week ${currentWeek}: ${events.length} development events`)
        }
        
        return events
      },

      /**
       * Get the development modifier for a specific team (affects AI strength)
       */
      getTeamDevelopmentModifier: (teamId) => {
        const { teams } = get()
        const team = teams.find(t => t.id === teamId)
        
        if (!team?.development) return 0
        
        return calculateAITeamModifier(team.development)
      },

      /**
       * Get development ranking for teams in a series
       */
      getTeamDevelopmentRanking: (seriesId) => {
        const { teams } = get()
        const seriesTeams = teams.filter(t => t.seriesId === seriesId)
        
        // Build display names: append car number/shortName when multiple teams share a name
        const nameCount = new Map<string, number>()
        for (const t of seriesTeams) nameCount.set(t.name, (nameCount.get(t.name) || 0) + 1)
        
        return seriesTeams
          .map(team => {
            const dev = team.development
            const weeklyGain = dev ? dev.totalPoints - dev.seasonStartPoints : 0
            
            let displayName = team.name
            if ((nameCount.get(team.name) || 0) > 1 && team.shortName) {
              displayName = `${team.name} ${team.shortName}`
            }
            
            return {
              teamId: team.id,
              teamName: displayName,
              totalPoints: dev?.totalPoints || 0,
              weeklyGain: weeklyGain > 0 ? weeklyGain : 0
            }
          })
          .sort((a, b) => b.totalPoints - a.totalPoints)
      },

      /**
       * Reset all team development for new season
       */
      resetAllTeamDevelopmentForSeason: () => {
        const { teams } = get()
        
        const updatedTeams = teams.map(team => {
          if (!team.development) return team
          
          const resetDevelopment = resetAITeamForSeason(team.development)
          return { ...team, development: resetDevelopment }
        })
        
        set({ 
          teams: updatedTeams,
          teamDevelopmentEvents: [] // Clear events for new season
        })
        
        console.log(`[Team Development] Reset development for ${updatedTeams.length} teams for new season`)
      },
      
      // === Economy Fixes ===
      fixAllTeamEconomics: () => {
        const { teams } = get()
        let teamsFixed = 0
        
        const updatedTeams = teams.map(team => {
          // Calculate correct values WITH VARIATION based on prestige
          const correctSeatCost = calculateSeatCostWithVariation(team.tier, team.prestige, hashString(team.id))
          const correctSalaryRange = calculateSalaryRangeWithVariation(team.tier, team.prestige)
          const correctPayDriver = !['elite', 'pinnacle'].includes(team.tier)
          
          // Get the base tier cost to check if current value is WAY off (old hardcoded values)
          const baseTierCost = getSeatCostForTier(team.tier)
          const currentCostTooLow = team.seatCost < baseTierCost * 0.5 // More than 50% below tier base
          const currentCostTooHigh = team.seatCost > baseTierCost * 2 // More than 2x tier base
          
          // Fix if: pay driver status wrong, or seat cost is way off from tier expectations
          const needsFix = team.payDriver !== correctPayDriver || 
                          currentCostTooLow || 
                          currentCostTooHigh ||
                          (correctPayDriver && team.seatCost === 0) || // Pay driver but no cost set
                          (!correctPayDriver && team.seatCost > 0)     // Not pay driver but has cost
          
          if (needsFix) {
            teamsFixed++
            console.log(`[RivalStore] Fixed team ${team.name} (prestige: ${team.prestige}): seatCost $${team.seatCost?.toLocaleString()} -> $${correctSeatCost.toLocaleString()}, tier: ${team.tier}`)
            return {
              ...team,
              seatCost: correctSeatCost,
              salaryRange: correctSalaryRange,
              payDriver: correctPayDriver
            }
          }
          return team
        })
        
        set({ teams: updatedTeams })
        
        console.log(`[RivalStore] Fixed economics for ${teamsFixed} teams with prestige-based variation`)
        
        return { 
          teamsFixed, 
          message: teamsFixed > 0 
            ? `Fixed ${teamsFixed} teams with prestige-based economics` 
            : 'All teams already have correct economics'
        }
      }
    }),
    {
      name: 'ams2-rivals-storage',
      version: 1,
      migrate: (persistedState) => {
        const state = (persistedState || {}) as Record<string, any>
        const coerceArray = (value: unknown) => {
          if (Array.isArray(value)) return value
          if (value && typeof value === 'object') return Object.values(value as Record<string, unknown>)
          return []
        }
        return {
          ...state,
          rivals: coerceArray(state.rivals),
          teams: coerceArray(state.teams),
          series: coerceArray(state.series),
          pendingContractOffers: coerceArray(state.pendingContractOffers),
          teamDevelopmentEvents: coerceArray(state.teamDevelopmentEvents)
        }
      }
    }
  )
)

// ============================================
// Helper functions
// ============================================

function getCategoryForClass(classId: string): string {
  if (classId.includes('formula') || classId.includes('f-') || classId.includes('f3')) return 'formula'
  // Check prototype/LMDh BEFORE gt - 'lmdh-gtp' contains 'gt' but is a prototype class
  if (classId.includes('lmdh') || classId.includes('prototype') || classId.includes('lmp') || classId.includes('hypercar')) return 'prototype'
  if (classId.includes('gt')) return 'gt'
  if (classId.includes('stock')) return 'stock'
  if (classId.includes('kart')) return 'kart'
  if (classId.includes('touring') || classId.includes('supercar')) return 'touring'
  return 'other'
}

function getFacilitiesForBudget(budget: 'low' | 'medium' | 'high' | 'factory'): 'basic' | 'standard' | 'professional' | 'elite' {
  switch (budget) {
    case 'factory': return 'elite'
    case 'high': return 'professional'
    case 'medium': return 'standard'
    case 'low': return 'basic'
  }
}

function getPrizeMoneyForTier(tier: TeamTier): { win: number; podium: number; points: number } {
  // Realistic motorsport prize money per race
  // Note: Real motorsport income comes mostly from sponsorships and factory support,
  // not race prizes. These values are modest to reflect that reality.
  switch (tier) {
    case 'entry': return { win: 1000, podium: 500, points: 50 }            // Karting/Academy
    case 'amateur': return { win: 2500, podium: 1200, points: 150 }        // Caterham/GT5
    case 'semi-pro': return { win: 6000, podium: 3000, points: 400 }       // GT4/Carrera Cup
    case 'professional': return { win: 12000, podium: 6000, points: 800 }  // GT3 Pro-Am
    case 'pro': return { win: 15000, podium: 7500, points: 1000 }          // GT3/LMP2
    case 'elite': return { win: 40000, podium: 20000, points: 3000 }       // IMSA/WEC GT
    case 'pinnacle': return { win: 100000, podium: 50000, points: 8000 }   // WEC Hypercar/LMDh
    default: return { win: 1000, podium: 500, points: 50 }
  }
}

function getSeatCostForTier(tier: TeamTier): number {
  // Base seat costs by tier - used as baseline for calculations
  // Lower tiers require payment; higher tiers pay the driver
  switch (tier) {
    case 'entry': return 25000           // Karting/Academy: $20-40K
    case 'amateur': return 75000         // Caterham/GT5: $50-100K
    case 'semi-pro': return 200000       // GT4/Carrera Cup: $150-300K
    case 'professional': return 350000   // GT3 Pro-Am: $250-500K
    case 'pro': return 400000            // GT3 Full Pro (some still pay): $300-600K
    case 'elite': return 0               // Paid driver - factory support
    case 'pinnacle': return 0            // Paid driver - factory team
    default: return 25000
  }
}

/**
 * Calculate seat cost with variation based on team prestige and randomness
 * Higher prestige teams charge MORE (they're in demand)
 * @param tier - Team tier
 * @param prestige - Team prestige (0-100)
 * @param randomSeed - Optional seed for consistent randomness (use team name hash)
 */
export function calculateSeatCostWithVariation(tier: TeamTier, prestige: number, randomSeed?: number): number {
  const baseCost = getSeatCostForTier(tier)
  
  // Elite and pinnacle tiers don't charge - they pay the driver
  if (baseCost === 0) return 0
  
  // Prestige multiplier: 0.7x (low prestige) to 1.4x (high prestige)
  // High prestige teams can charge more because drivers want to be there
  const prestigeMultiplier = 0.7 + (prestige / 100) * 0.7
  
  // Random variation: ±15% (using seed for consistency)
  const random = randomSeed !== undefined 
    ? ((randomSeed % 1000) / 1000) // Pseudo-random from seed
    : Math.random()
  const randomVariation = 0.85 + (random * 0.3) // 0.85 to 1.15
  
  // Calculate final cost, rounded to nearest $1000
  const finalCost = Math.round((baseCost * prestigeMultiplier * randomVariation) / 1000) * 1000
  
  return finalCost
}

/**
 * Calculate salary range with variation based on team prestige
 * Higher prestige teams pay MORE (they have bigger budgets)
 * @param tier - Team tier  
 * @param prestige - Team prestige (0-100)
 */
export function calculateSalaryRangeWithVariation(tier: TeamTier, prestige: number): { min: number; max: number } {
  const baseRange = getSalaryRangeForTier(tier)
  
  // If tier doesn't pay salaries, return zeros
  if (baseRange.max === 0) return { min: 0, max: 0 }
  
  // Prestige multiplier: 0.6x (low prestige) to 1.5x (high prestige)
  // High prestige teams have bigger budgets and pay better
  const prestigeMultiplier = 0.6 + (prestige / 100) * 0.9
  
  return {
    min: Math.round((baseRange.min * prestigeMultiplier) / 1000) * 1000,
    max: Math.round((baseRange.max * prestigeMultiplier) / 1000) * 1000
  }
}

/**
 * Simple hash function for team names to get consistent randomness
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Get realistic salary range for a given tier
 * Returns annual salary range { min, max } in dollars
 */
export function getSalaryRangeForTier(tier: TeamTier): { min: number; max: number } {
  switch (tier) {
    case 'entry': return { min: 0, max: 0 }                    // Pay-to-drive
    case 'amateur': return { min: 0, max: 0 }                  // Pay-to-drive
    case 'semi-pro': return { min: 0, max: 50000 }             // Some small stipends
    case 'professional': return { min: 30000, max: 150000 }    // GT3 Pro-Am paid drivers
    case 'pro': return { min: 80000, max: 350000 }             // Full pro salaries
    case 'elite': return { min: 200000, max: 800000 }          // Factory-supported
    case 'pinnacle': return { min: 500000, max: 3000000 }      // WEC/LMDh factory
    default: return { min: 0, max: 0 }
  }
}

/**
 * Calculate realistic driver salary based on tier, skill, and team prestige
 * Returns annual salary in USD
 */
function calculateDriverSalary(tier: TeamTier, baseSkill: number, prestige: number): number {
  const salaryRange = getSalaryRangeForTier(tier)
  
  // No salary for pay-driver tiers
  if (salaryRange.max === 0) return 0
  
  // Interpolate within range based on skill (0-1) and prestige (0-100)
  const skillFactor = baseSkill // 0-1
  const prestigeFactor = prestige / 100 // 0-1
  
  // Combined factor weights skill more heavily
  const combinedFactor = (skillFactor * 0.7) + (prestigeFactor * 0.3)
  
  const salary = salaryRange.min + (salaryRange.max - salaryRange.min) * combinedFactor
  
  // Add some randomness (±15%)
  const variance = 1 + (Math.random() - 0.5) * 0.3
  
  return Math.round(salary * variance)
}

/**
 * Calculate realistic market value based on tier, skill, and prestige
 * Returns market value in USD
 */
function calculateDriverMarketValue(tier: TeamTier, baseSkill: number, prestige: number): number {
  // Base market values by tier (realistic transfer values)
  const baseValues: Record<TeamTier, number> = {
    'entry': 10000,          // Karting - minimal market value
    'amateur': 50000,        // GT5/Caterham - building reputation
    'semi-pro': 200000,      // GT4/Carrera Cup - recognized talent
    'professional': 500000,  // GT3 Pro-Am - proven driver
    'pro': 1000000,          // GT3/LMP2 - professional value
    'elite': 3000000,        // Factory supported - high value
    'pinnacle': 10000000,    // WEC/LMDh - elite value
  }
  
  const baseValue = baseValues[tier] || 50000
  
  // Skill multiplier (0.3x to 2x based on skill 0-1)
  const skillMultiplier = 0.3 + baseSkill * 1.7
  
  // Prestige bonus (0.8x to 1.5x based on team prestige)
  const prestigeMultiplier = 0.8 + (prestige / 100) * 0.7
  
  // Add some randomness (±20%)
  const variance = 1 + (Math.random() - 0.5) * 0.4
  
  return Math.round(baseValue * skillMultiplier * prestigeMultiplier * variance)
}

/**
 * Estimate tier from prestige for random rival generation
 */
function getTierFromPrestige(prestige: number): TeamTier {
  if (prestige >= 90) return 'pinnacle'
  if (prestige >= 75) return 'elite'
  if (prestige >= 60) return 'pro'
  if (prestige >= 45) return 'professional'
  if (prestige >= 30) return 'semi-pro'
  if (prestige >= 15) return 'amateur'
  return 'entry'
}

/**
 * Calculate grid size based on teams, their drivers/liveries, and car class data
 * For spec series (single team with many drivers), count liveries/drivers
 * Otherwise use car class gridSize from ams2-cars.ts
 */
function calculateGridSize(
  teams: AMS2RealTeam[], 
  multiClass: boolean, 
  primaryClassId: string
): number {
  // First, try to use the car class gridSize from detailed car data
  const detailedClass = DETAILED_CAR_CLASSES.find((c: DetailedCarClasses) => c.id === primaryClassId)
  
  // Calculate total liveries/drivers across all teams
  let totalEntries = 0
  teams.forEach(team => {
    // Use liveries count if available, otherwise drivers count, minimum of 2 per team
    const teamEntries = Math.max(
      team.liveryNames?.length || 0,
      team.drivers?.length || 0,
      2
    )
    totalEntries += teamEntries
  })
  
  // For spec series (1 team but many liveries), use total entries
  if (teams.length === 1 && totalEntries > 2) {
    return Math.min(30, totalEntries)
  }
  
  // If we have detailed car class data with gridSize, use that
  if (detailedClass?.gridSize) {
    // For multi-class, increase grid size
    return multiClass ? Math.min(60, detailedClass.gridSize * 1.5) : detailedClass.gridSize
  }
  
  // Fallback: use team count * 2 (legacy behavior)
  const baseGridSize = Math.min(30, teams.length * 2)
  return multiClass ? Math.min(60, baseGridSize * 1.5) : baseGridSize
}

/**
 * Extract car number from livery name (e.g., "#911" from "Porsche 911 GT3 Cup 4.0 #911")
 */
function extractCarNumber(liveryName: string): string {
  const match = liveryName.match(/#(\d+[a-z]?)/i)
  return match ? match[1] : ''
}

/**
 * Generate a team name for spec series from driver name and livery
 * Example: Driver "Adam Knight" with livery "#911" -> "Knight Racing"
 */
function generateSpecSeriesTeamName(driverName: string, liveryName: string): { name: string; shortName: string } {
  const carNumber = extractCarNumber(liveryName)
  const nameParts = driverName.split(' ')
  const surname = nameParts[nameParts.length - 1] || driverName
  
  // Generate team name variations
  const teamNameOptions = [
    `${surname} Racing`,
    `${surname} Motorsport`,
    `Team ${surname}`,
    `${surname} Performance`
  ]
  
  // Use car number to deterministically pick a name variation
  const numericCarNumber = parseInt(carNumber) || 0
  const selectedName = teamNameOptions[numericCarNumber % teamNameOptions.length]
  
  // Short name is first 3 chars of surname uppercase
  const shortName = surname.substring(0, 3).toUpperCase()
  
  return { name: selectedName, shortName }
}

/**
 * Generate a unique team color based on driver name hash
 */
function generateTeamColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)
  return `hsl(${hue}, 65%, 45%)`
}

/**
 * Calculate per-race prize money from total prize pool
 */
function getPrizeMoneyFromPrizePool(prizePool: number, tier: TeamTier): { win: number; podium: number; points: number } {
  // Assume ~10 races per season, with win taking 15%, podium 8%, points 2% each
  const perRacePool = prizePool / 10
  
  // Base calculation from pool
  const baseWin = Math.round(perRacePool * 0.15)
  const basePodium = Math.round(perRacePool * 0.08)
  const basePoints = Math.round(perRacePool * 0.02)
  
  // Minimum values based on tier
  const tierMins = getPrizeMoneyForTier(tier)
  
  return {
    win: Math.max(baseWin, tierMins.win),
    podium: Math.max(basePodium, tierMins.podium),
    points: Math.max(basePoints, tierMins.points)
  }
}

function getTierTrackLevel(tier: TeamTier): number {
  switch (tier) {
    case 'entry': return 1
    case 'amateur': return 2
    case 'semi-pro': return 3
    case 'professional': return 4
    case 'pro': return 5
    case 'elite': return 6
    case 'pinnacle': return 6
    default: return 3
  }
}

function isRaceLayoutIdCompatible(layoutId: string, category: string): boolean {
  const id = layoutId.toLowerCase()

  // Keep STT variants out of generated race calendars by default.
  if (id.includes('stt')) return false

  const isRallyVariant =
    id.includes('rx') ||
    id.includes('rally') ||
    id.includes('dirt') ||
    id.includes('snow') ||
    id.includes('ice')

  if (category === 'rallycross') return true
  if (isRallyVariant) return false

  // Only stock-usa should default to pure oval race layouts.
  const isPureOval = id.includes('oval') && !id.includes('roval') && !id.includes('road')
  if (category !== 'stock-usa' && isPureOval) return false

  return true
}

function getSeriesTrackEligibility(
  track: AMS2Track,
  series: Series,
  category: string,
  enforceTierSuitability: boolean
): { eligible: boolean; selectedLayoutId?: string } {
  if (enforceTierSuitability) {
    const level = getTierTrackLevel(series.tier)
    if (!track.suitableTiers.includes(level)) {
      return { eligible: false }
    }
  }

  const bestLayoutId = selectBestLayoutId(
    track.layouts,
    track.defaultLayout,
    category,
    series.tier
  )
  const layout = track.layouts.find(l => l.id === bestLayoutId) ||
    track.layouts.find(l => l.id === track.defaultLayout) ||
    track.layouts[0]

  if (!layout) return { eligible: false }
  if (!isRaceLayoutIdCompatible(layout.id, category)) return { eligible: false }

  return { eligible: true, selectedLayoutId: layout.id }
}

/**
 * Generate a realistic championship calendar for a series
 * 
 * Territory-first approach:
 * 1. Fixed venue check - Named events (24h Le Mans, Daytona 500, etc.) get their exact track
 * 2. Territory filtering - Tracks MUST be in the series' allowed regions (hard boundary)
 * 3. Category/type filtering - Track types must match the racing category
 * 4. Grade filtering - Higher tiers require higher-grade circuits
 * 5. Round count = min(seasonRounds, availableTracks) - never more rounds than tracks
 * 6. Iconic track prioritization - Must-visit circuits appear first
 * 7. Layout selection - Category-appropriate layouts (oval for NASCAR, road for IMSA, etc.)
 */
function generateCalendarForSeries(series: Series, year: number): RaceEvent[] {
  const calendar: RaceEvent[] = []
  const calendarSettings = getCalendarSettingsForTier(series.tier)

  // ── STEP 1: Check for fixed venue (named events like 24h Le Mans, Daytona 500) ──
  const fixedVenue = FIXED_VENUE_CHAMPIONSHIPS[series.id]
  if (fixedVenue) {
    const track = getTrackById(fixedVenue.trackId)
    if (track) {
      const primaryLayout = track.layouts.find(l => l.id === fixedVenue.layoutId) ||
                            track.layouts.find(l => l.id === track.defaultLayout) ||
                            track.layouts[0]

      if (primaryLayout) {
        const requestedRounds = series.seasonRounds || 1
        const { seasonStartWeek, seasonEndWeek, minWeeksBetweenRaces } = calendarSettings
        const totalWeeks = Math.max(1, seasonEndWeek - seasonStartWeek)
        const spacing = Math.max(
          minWeeksBetweenRaces,
          Math.floor(totalWeeks / Math.max(requestedRounds, 1))
        )

        const layoutCycle = [
          primaryLayout,
          ...track.layouts.filter(l => l.id !== primaryLayout.id)
        ]

        for (let roundIndex = 0; roundIndex < requestedRounds; roundIndex++) {
          const layout = layoutCycle[roundIndex % layoutCycle.length] || primaryLayout
          const week = Math.min(
            seasonStartWeek + (roundIndex * spacing),
            seasonEndWeek - ((requestedRounds - roundIndex - 1) * minWeeksBetweenRaces)
          )

          calendar.push({
            id: `${series.id}_${year}_r${roundIndex + 1}`,
            round: roundIndex + 1,
            trackId: track.id,
            trackName: track.name,
            layoutId: layout.id,
            layoutName: layout.name,
            country: track.country,
            lengthKm: layout.lengthKm,
            week,
            sessions: {
              practice: true,
              qualifying: true,
              race: true,
              sprintRace: false
            }
          })
        }

        console.log(`[Calendar] Fixed venue: ${series.name} → ${track.name} (${requestedRounds} rounds)`)
        return calendar
      }
    } else {
      console.warn(`[Calendar] Fixed venue track '${fixedVenue.trackId}' not found for ${series.name}`)
    }
  }

  // ── STEP 2: Get territory (allowed regions) for this series ──
  const territory = getSeriesTerritory(series.id, series.region)
  const acceptableGrades = getAcceptableGradesForTier(series.tier)

  // Use seriesCategory (more specific) with fallback to category
  const effectiveCategory = series.seriesCategory || series.category

  // ── STEP 3: Get tracks filtered by category, territory, and grade ──
  let filteredTracks = getTracksForCategory(
    effectiveCategory,
    territory.allowedRegions,
    acceptableGrades.length > 0 ? acceptableGrades : undefined
  )

  // Fallback 1: relax grade requirements within territory
  if (filteredTracks.length === 0) {
    filteredTracks = getTracksForCategory(
      effectiveCategory,
      territory.allowedRegions
    )
  }

  // Fallback 2: try permanent tracks within territory (no type/grade filter)
  if (filteredTracks.length === 0) {
    filteredTracks = AMS2_TRACKS.filter(t =>
      territory.allowedRegions.includes(t.region) &&
      t.type === 'permanent'
    )
  }

  // Fallback 3: any track in territory (very last resort)
  if (filteredTracks.length === 0) {
    filteredTracks = AMS2_TRACKS.filter(t =>
      territory.allowedRegions.includes(t.region)
    )
  }

  if (filteredTracks.length === 0) {
    console.warn(`[Calendar] No tracks found for ${series.name} in territory [${territory.allowedRegions.join(', ')}]`)
    return calendar
  }

  // ── STEP 3B: Universal realism guardrails (all series) ──
  const strictEligibleTracks = filteredTracks.filter(track =>
    getSeriesTrackEligibility(track, series, effectiveCategory, true).eligible
  )
  if (strictEligibleTracks.length > 0) {
    filteredTracks = strictEligibleTracks
  } else {
    const relaxedEligibleTracks = filteredTracks.filter(track =>
      getSeriesTrackEligibility(track, series, effectiveCategory, false).eligible
    )
    if (relaxedEligibleTracks.length > 0) {
      filteredTracks = relaxedEligibleTracks
      console.log(`[Calendar] ${series.name}: using relaxed eligibility fallback (${relaxedEligibleTracks.length} tracks)`)
    }
  }

  // ── STEP 4: Determine round count - capped by available tracks ──
  const requestedRounds = series.seasonRounds || getMaxRoundsForTier(series.tier)
  const numRounds = Math.min(requestedRounds, filteredTracks.length)

  if (numRounds < requestedRounds) {
    console.log(`[Calendar] ${series.name}: Capped from ${requestedRounds} to ${numRounds} rounds (only ${filteredTracks.length} tracks in territory)`)
  }

  // ── STEP 5: Sort tracks with primary region priority ──
  const sortedTracks = sortTracksByRegionPriority(filteredTracks, territory.primary)

  // ── STEP 6: Select tracks, prioritizing iconic ones ──
  const iconicTrackIds = getIconicTracksForCategory(effectiveCategory, series.tier)
  const selectedTracks = selectTracksForCalendar(
    sortedTracks,
    iconicTrackIds,
    numRounds
  )

  // ── STEP 7: Generate calendar with proper week spacing ──
  const { seasonStartWeek, seasonEndWeek, minWeeksBetweenRaces } = calendarSettings
  const totalWeeks = seasonEndWeek - seasonStartWeek
  const weekSpacing = Math.max(
    minWeeksBetweenRaces,
    Math.floor(totalWeeks / Math.max(selectedTracks.length, 1))
  )

  // ── STEP 8: Create race events with category-appropriate layouts ──
  selectedTracks.forEach((track, index) => {
    // Select layout based on category and tier (not just defaultLayout)
    const bestLayoutId = selectBestLayoutId(
      track.layouts,
      track.defaultLayout,
      effectiveCategory,
      series.tier
    )
    const layout = track.layouts.find(l => l.id === bestLayoutId) ||
                   track.layouts.find(l => l.id === track.defaultLayout) ||
                   track.layouts[0]

    if (!layout) return

    // Calculate week, ensuring we stay within season bounds
    const week = Math.min(
      seasonStartWeek + (index * weekSpacing),
      seasonEndWeek - (selectedTracks.length - index - 1) * minWeeksBetweenRaces
    )

    calendar.push({
      id: `${series.id}_${year}_r${index + 1}`,
      round: index + 1,
      trackId: track.id,
      trackName: track.name,
      layoutId: layout.id,
      layoutName: layout.name,
      country: track.country,
      lengthKm: layout.lengthKm,
      week,
      sessions: {
        practice: true,
        qualifying: true,
        race: true,
        sprintRace: series.tier === 'professional' || series.tier === 'pro' || series.tier === 'elite' || series.tier === 'pinnacle'
      }
    })
  })

  // ── Logging ──
  const regionCounts = calendar.reduce((acc, race) => {
    const track = getTrackById(race.trackId)
    if (track) {
      acc[track.region] = (acc[track.region] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  console.log(`[Calendar] Generated ${calendar.length} rounds for ${series.name}:`, {
    tier: series.tier,
    category: effectiveCategory,
    territory: territory.allowedRegions,
    regionDistribution: regionCounts,
    tracks: calendar.map(r => `${r.trackName} (${r.layoutName})`),
    iconicIncluded: iconicTrackIds.filter(id => calendar.some(r => r.trackId === id))
  })

  return calendar
}

/**
 * Get minimum reputation required for each tier
 * Based on the 7-tier championship hierarchy
 */
export function getMinReputationForTier(tier: TeamTier): number {
  switch (tier) {
    case 'entry': return 0
    case 'amateur': return 15
    case 'semi-pro': return 30
    case 'professional': return 45
    case 'pro': return 60
    case 'elite': return 75
    case 'pinnacle': return 85
    default: return 0
  }
}

/**
 * Get the tier name for display
 */
export function getTierDisplayName(tier: TeamTier): string {
  switch (tier) {
    case 'entry': return 'Entry Level'
    case 'amateur': return 'Amateur'
    case 'semi-pro': return 'Semi-Professional'
    case 'professional': return 'Professional'
    case 'pro': return 'Pro Series'
    case 'elite': return 'Elite'
    case 'pinnacle': return 'Pinnacle'
    default: return tier
  }
}

/**
 * Get all tiers in order from lowest to highest
 */
export const TIER_ORDER: TeamTier[] = ['entry', 'amateur', 'semi-pro', 'professional', 'pro', 'elite', 'pinnacle']

function generateRivalsFromTeams(teams: Team[]): RivalDriver[] {
  const rivals: RivalDriver[] = []
  
  teams.forEach(team => {
    // Use real driver data if available
    team.realDrivers.forEach((realDriver, index) => {
      const nameParts = realDriver.name.split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ') || nameParts[0]
      
      const age = 20 + Math.floor(Math.random() * 18) // 20-38 years old
      const rival = generateRivalFromData(
        firstName,
        lastName,
        realDriver.country,
        age,
        team,
        index
      )
      
      rivals.push(rival)
      ;(team.drivers as (string | AMS2Driver)[]).push(rival.id)
      team.availableSeats = Math.max(0, (team.availableSeats ?? 0) - 1)
    })
    
    // If team needs more drivers, generate random ones
    while (team.drivers.length < 2 && (team.availableSeats ?? 0) > 0) {
      const age = 18 + Math.floor(Math.random() * 20)
      const rival = generateRandomRival(team.seriesId ?? '', age, team.prestige)
      rival.currentTeamId = team.id
      rival.id = `${team.id}_gen_${team.drivers.length}`
      rivals.push(rival)
      ;(team.drivers as (string | AMS2Driver)[]).push(rival.id)
      team.availableSeats = (team.availableSeats ?? 0) - 1
    }
  })
  
  return rivals
}

function generateRivalFromData(
  firstName: string,
  lastName: string,
  countryCode: string,
  age: number,
  team: Team,
  driverIndex: number
): RivalDriver {
  const personalities: Personality[] = ['aggressive', 'calculating', 'inconsistent', 'steady', 'flashy', 'defensive']
  
  // Map country code to full name
  const countryMap: Record<string, string> = {
    'BRA': 'Brazil', 'GBR': 'UK', 'DEU': 'Germany', 'USA': 'USA',
    'FRA': 'France', 'ITA': 'Italy', 'ESP': 'Spain', 'JPN': 'Japan',
    'AUS': 'Australia', 'NLD': 'Netherlands', 'BEL': 'Belgium',
    'AUT': 'Austria', 'PRT': 'Portugal', 'CHE': 'Switzerland',
    'MEX': 'Mexico', 'ARG': 'Argentina', 'CAN': 'Canada',
    'NZL': 'New Zealand', 'DNK': 'Denmark', 'SWE': 'Sweden',
    'NOR': 'Norway', 'FIN': 'Finland', 'POL': 'Poland',
    'CHN': 'China', 'THA': 'Thailand', 'MCO': 'Monaco',
    'RUS': 'Russia', 'COL': 'Colombia', 'ARE': 'UAE',
    'HKG': 'Hong Kong', 'KOR': 'South Korea', 'ECU': 'Ecuador',
    'TUR': 'Turkey', 'HRV': 'Croatia', 'CZE': 'Czech Republic',
    'SMR': 'San Marino', 'KAZ': 'Kazakhstan', 'SAU': 'Saudi Arabia',
    'MYS': 'Malaysia', 'SRB': 'Serbia',
  }
  const nationality = countryMap[countryCode] || countryCode
  
  // Skill scales with team prestige and position
  const prestigeFactor = team.prestige / 100
  const positionFactor = driverIndex === 0 ? 1.0 : 0.9 // First driver slightly better
  const baseSkill = 0.4 + (prestigeFactor * 0.45 * positionFactor) + Math.random() * 0.1
  const variance = 0.08
  
  // Determine career stage based on age
  const careerStage: CareerStage = age < 24 ? 'rising' :
                                   age < 32 ? 'peak' :
                                   age < 38 ? 'declining' : 'veteran'
  
  // Development rate - higher for younger drivers
  const developmentRate = age < 24 ? 0.015 + Math.random() * 0.015 : // 0.015-0.03 for young
                          age < 28 ? 0.01 + Math.random() * 0.01 :   // 0.01-0.02 for prime
                          0.005 + Math.random() * 0.005              // 0.005-0.01 for older
  
  return {
    id: `${team.id}_${firstName.toLowerCase()}_${lastName.toLowerCase()}`.replace(/[^a-z0-9_]/g, ''),
    firstName,
    lastName,
    nationality,
    age,
    dateOfBirth: new Date(new Date().getFullYear() - age, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    personality: personalities[Math.floor(Math.random() * personalities.length)],
    stats: {
      raceSkill: clamp(baseSkill + (Math.random() - 0.5) * variance),
      qualifyingSkill: clamp(baseSkill + (Math.random() - 0.5) * variance),
      aggression: 0.3 + Math.random() * 0.5,
      defending: clamp(baseSkill + (Math.random() - 0.5) * variance),
      consistency: clamp(baseSkill + (Math.random() - 0.5) * variance),
      wetSkill: clamp(baseSkill + (Math.random() - 0.5) * variance * 2),
      tireManagement: clamp(baseSkill + (Math.random() - 0.5) * variance),
      fuelManagement: clamp(baseSkill + (Math.random() - 0.5) * variance),
      stamina: clamp(baseSkill + (Math.random() - 0.5) * variance),
      startReactions: 0.4 + Math.random() * 0.4
    },
    peakAge: 25 + Math.floor(Math.random() * 8),
    declineRate: 0.01 + Math.random() * 0.02,
    currentTeamId: team.id,
    currentSeriesId: team.seriesId ?? '',
    contractEndYear: new Date().getFullYear() + 1 + Math.floor(Math.random() * 3),
    // Realistic salary based on tier and skill
    salary: calculateDriverSalary(team.tier, baseSkill, team.prestige),
    marketValue: calculateDriverMarketValue(team.tier, baseSkill, team.prestige),
    reputation: Math.floor(baseSkill * 80 + team.prestige * 0.2),
    totalRaces: age > 22 ? Math.floor((age - 18) * 15 * Math.random()) : 0,
    totalWins: 0,
    totalPodiums: 0,
    championships: 0,
    careerActive: true,
    relationshipWithPlayer: 0,
    rivalryIntensity: 0,
    // NEW: Persistent skill system
    baseSkill,
    currentForm: 0, // Start with neutral form
    formStreak: 0,
    developmentRate,
    careerStage,
    seasonStats: { wins: 0, podiums: 0, points: 0, races: 0, avgFinish: 0, bestFinish: 99, dnfs: 0 },
    trackAffinities: {}, // Empty - will be populated over time
    lastRacePosition: 0,
    weekendForm: 0
  }
}

// ============================================
// AI TEAM ECONOMICS HELPER FUNCTIONS
// ============================================

/**
 * Determine initial sponsor tier based on team prestige and tier
 */
function getSponsorTierFromPrestige(prestige: number, tier: TeamTier): AITeamEconomics['sponsorTier'] {
  // Factory/pinnacle teams always have global sponsors
  if (tier === 'pinnacle') return 'global'
  if (tier === 'elite') return prestige > 70 ? 'global' : 'international'
  
  // Map prestige to sponsor tier
  if (prestige >= 85) return 'global'
  if (prestige >= 70) return 'international'
  if (prestige >= 55) return 'national'
  if (prestige >= 40) return 'regional'
  if (prestige >= 25) return 'local'
  return 'none'
}

/**
 * Calculate initial financial health based on prestige and budget (0-100 score)
 */
function getInitialFinancialHealth(prestige: number, budget: Team['budget']): number {
  // Base health from prestige (30-70 range)
  const baseHealth = 30 + (prestige / 100) * 40
  
  // Budget modifier
  const budgetBonus = {
    'low': -10,
    'medium': 0,
    'high': 10,
    'factory': 20
  }[budget] || 0
  
  // Add some randomness (-5 to +5)
  const variance = Math.floor(Math.random() * 11) - 5
  
  return Math.max(20, Math.min(90, baseHealth + budgetBonus + variance))
}

function generateRandomRival(seriesId: string, age: number, teamPrestige: number = 50): RivalDriver {
  const firstNames = [
    'Marcus', 'Lucas', 'Gabriel', 'Pedro', 'Rafael', 'Bruno', 'Felipe', 'Carlos', 'Diego', 'André',
    'Max', 'Lewis', 'Charles', 'Lando', 'Oscar', 'George', 'Fernando', 'Sergio', 'Daniel', 'Valtteri'
  ]
  const lastNames = [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Pereira', 'Ferreira', 'Almeida', 'Rodrigues', 'Martins',
    'Weber', 'Müller', 'Schmidt', 'Fischer', 'Wagner', 'Becker', 'Hoffmann', 'Schulz', 'Koch', 'Richter'
  ]
  const nationalities = ['Brazil', 'Germany', 'UK', 'Italy', 'Spain', 'France', 'Netherlands', 'Australia', 'USA', 'Japan']
  const personalities: Personality[] = ['aggressive', 'calculating', 'inconsistent', 'steady', 'flashy', 'defensive']
  
  const prestigeFactor = teamPrestige / 100
  const baseSkill = 0.4 + (prestigeFactor * 0.4) + Math.random() * 0.15
  const variance = 0.12
  
  // Determine career stage based on age
  const careerStage: CareerStage = age < 24 ? 'rising' :
                                   age < 32 ? 'peak' :
                                   age < 38 ? 'declining' : 'veteran'
  
  const developmentRate = age < 24 ? 0.015 + Math.random() * 0.015 :
                          age < 28 ? 0.01 + Math.random() * 0.01 :
                          0.005 + Math.random() * 0.005
  
  return {
    id: `rival_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
    nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
    age,
    dateOfBirth: new Date(new Date().getFullYear() - age, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    personality: personalities[Math.floor(Math.random() * personalities.length)],
    stats: {
      raceSkill: clamp(baseSkill + (Math.random() - 0.5) * variance),
      qualifyingSkill: clamp(baseSkill + (Math.random() - 0.5) * variance),
      aggression: Math.random(),
      defending: clamp(baseSkill + (Math.random() - 0.5) * variance),
      consistency: clamp(baseSkill + (Math.random() - 0.5) * variance),
      wetSkill: clamp(baseSkill + (Math.random() - 0.5) * variance * 2),
      tireManagement: clamp(baseSkill + (Math.random() - 0.5) * variance),
      fuelManagement: clamp(baseSkill + (Math.random() - 0.5) * variance),
      stamina: clamp(baseSkill + (Math.random() - 0.5) * variance),
      startReactions: Math.random()
    },
    peakAge: 25 + Math.floor(Math.random() * 8),
    declineRate: 0.01 + Math.random() * 0.02,
    currentTeamId: '',
    currentSeriesId: seriesId,
    contractEndYear: new Date().getFullYear() + 1 + Math.floor(Math.random() * 3),
    // Realistic salary based on tier and skill
    salary: calculateDriverSalary(getTierFromPrestige(teamPrestige), baseSkill, teamPrestige),
    marketValue: calculateDriverMarketValue(getTierFromPrestige(teamPrestige), baseSkill, teamPrestige),
    reputation: Math.floor(baseSkill * 80 + teamPrestige * 0.2),
    totalRaces: age > 22 ? Math.floor((age - 18) * 15 * Math.random()) : 0,
    totalWins: 0,
    totalPodiums: 0,
    championships: 0,
    careerActive: true,
    relationshipWithPlayer: 0,
    rivalryIntensity: 0,
    // NEW: Persistent skill system
    baseSkill,
    currentForm: 0,
    formStreak: 0,
    developmentRate,
    careerStage,
    seasonStats: { wins: 0, podiums: 0, points: 0, races: 0, avgFinish: 0, bestFinish: 99, dnfs: 0 },
    trackAffinities: {},
    lastRacePosition: 0,
    weekendForm: 0
  }
}

/**
 * Generate a rookie driver with high potential but unproven skill
 */
function generateRookieDriver(seriesId: string, team: Team, currentYear: number): RivalDriver {
  const rookieFirstNames = [
    'Theo', 'Noah', 'Oliver', 'Elias', 'Matteo', 'Leo', 'Finn', 'Luca', 'Arthur', 'Hugo',
    'Ryu', 'Kai', 'Enzo', 'Axel', 'Milo', 'Felix', 'Roman', 'Jasper', 'Atlas', 'Zane'
  ]
  const rookieLastNames = [
    'Johnson', 'Williams', 'Brown', 'Garcia', 'Martinez', 'Anderson', 'Thomas', 'Jackson',
    'Tanaka', 'Kim', 'Nakamura', 'Chen', 'Park', 'Lee', 'Yamamoto', 'Suzuki'
  ]
  const nationalities = ['UK', 'USA', 'Japan', 'Brazil', 'Germany', 'France', 'Italy', 'Netherlands', 'Australia', 'Spain']
  const personalities: Personality[] = ['aggressive', 'calculating', 'flashy', 'steady']
  
  const age = 18 + Math.floor(Math.random() * 4) // 18-21
  
  // Rookies have lower initial skill but high potential (development rate)
  const potentialCeiling = 0.65 + Math.random() * 0.3 // 0.65-0.95 (some will be future champions)
  const baseSkill = 0.35 + Math.random() * 0.15 // Start with 0.35-0.5 skill
  const developmentRate = 0.02 + Math.random() * 0.015 // High development rate 0.02-0.035
  
  const firstName = rookieFirstNames[Math.floor(Math.random() * rookieFirstNames.length)]
  const lastName = rookieLastNames[Math.floor(Math.random() * rookieLastNames.length)]
  
  return {
    id: `rookie_${currentYear}_${firstName.toLowerCase()}_${lastName.toLowerCase()}_${Math.random().toString(36).substr(2, 5)}`,
    firstName,
    lastName,
    nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
    age,
    dateOfBirth: new Date(currentYear - age, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    personality: personalities[Math.floor(Math.random() * personalities.length)],
    stats: {
      raceSkill: clamp(baseSkill + (Math.random() - 0.5) * 0.1),
      qualifyingSkill: clamp(baseSkill + (Math.random() - 0.5) * 0.1),
      aggression: 0.4 + Math.random() * 0.4, // Rookies tend to be aggressive
      defending: clamp(baseSkill + (Math.random() - 0.5) * 0.08),
      consistency: clamp(baseSkill - 0.1 + Math.random() * 0.1), // Less consistent initially
      wetSkill: clamp(baseSkill + (Math.random() - 0.5) * 0.15),
      tireManagement: clamp(baseSkill + (Math.random() - 0.5) * 0.1),
      fuelManagement: clamp(baseSkill + (Math.random() - 0.5) * 0.1),
      stamina: 0.6 + Math.random() * 0.3, // Young = good stamina
      startReactions: 0.4 + Math.random() * 0.3
    },
    peakAge: 26 + Math.floor(Math.random() * 6), // Peak between 26-31
    declineRate: 0.008 + Math.random() * 0.012,
    currentTeamId: team.id,
    currentSeriesId: seriesId,
    contractEndYear: currentYear + 1 + Math.floor(Math.random() * 2),
    // Rookies get lower salaries but market value reflects potential
    salary: Math.round(calculateDriverSalary(team.tier, baseSkill, team.prestige) * 0.4),
    marketValue: calculateDriverMarketValue(team.tier, potentialCeiling, team.prestige),
    reputation: Math.floor(10 + Math.random() * 15), // Low initial reputation
    totalRaces: 0,
    totalWins: 0,
    totalPodiums: 0,
    championships: 0,
    careerActive: true,
    relationshipWithPlayer: 0,
    rivalryIntensity: 0,
    // Persistent skill system
    baseSkill,
    currentForm: 0,
    formStreak: 0,
    developmentRate,
    careerStage: 'rising' as CareerStage,
    seasonStats: { wins: 0, podiums: 0, points: 0, races: 0, avgFinish: 0, bestFinish: 99, dnfs: 0 },
    trackAffinities: {},
    lastRacePosition: 0,
    weekendForm: 0
  }
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value))
}
