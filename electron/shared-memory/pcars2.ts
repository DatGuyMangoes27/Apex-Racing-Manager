/**
 * AMS2 / Project Cars 2 Shared Memory Reader
 * 
 * Uses Windows memory-mapped files to read telemetry data directly from AMS2.
 * This is more reliable and lower latency than UDP.
 * 
 * Shared memory name: $pcars2$
 * Game setting required: Options -> System -> Shared Memory = Project Cars 2
 */

import koffi from 'koffi'

// Windows API constants
const FILE_MAP_READ = 0x0004
const INVALID_HANDLE_VALUE = -1

// Shared memory constants
const SHARED_MEMORY_NAME = '$pcars2$'
const STRING_LENGTH_MAX = 64
const STORED_PARTICIPANTS_MAX = 64
const TYRE_MAX = 4
const VEC_MAX = 3

// Total shared memory size (approximately 21KB)
const SHARED_MEMORY_SIZE = 21000

// ============================================================================
// OFFSET DEFINITIONS (from SMS shared memory header)
// ============================================================================

const OFFSETS = {
  // Main header
  mVersion: 0,                    // uint32
  mBuildVersionNumber: 4,         // uint32
  mGameState: 8,                  // uint32 (enum)
  mSessionState: 12,              // uint32 (enum)
  mRaceState: 16,                 // uint32 (enum)
  mViewedParticipantIndex: 20,    // int32
  mNumParticipants: 24,           // int32
  
  // Participant info array (64 participants x 100 bytes each = 6400 bytes)
  mParticipantInfo: 28,
  
  // After participant info
  mUnfilteredThrottle: 6428,      // float
  mUnfilteredBrake: 6432,         // float
  mUnfilteredSteering: 6436,      // float
  mUnfilteredClutch: 6440,        // float
  mCarName: 6444,                 // char[64]
  mCarClassName: 6508,            // char[64]
  mLapsInEvent: 6572,             // uint32
  mTrackLocation: 6576,           // char[64]
  mTrackVariation: 6640,          // char[64]
  mTrackLength: 6704,             // float
  mNumSectors: 6708,              // int32
  mLapInvalidated: 6712,          // bool
  mBestLapTime: 6716,             // float
  mLastLapTime: 6720,             // float
  mCurrentTime: 6724,             // float
  mSplitTimeAhead: 6728,          // float
  mSplitTimeBehind: 6732,         // float
  mSplitTime: 6736,               // float
  mEventTimeRemaining: 6740,      // float
  mPersonalFastestLapTime: 6744,  // float
  mWorldFastestLapTime: 6748,     // float
  
  // Sector times
  mCurrentSector1Time: 6752,
  mCurrentSector2Time: 6756,
  mCurrentSector3Time: 6760,
  mFastestSector1Time: 6764,
  mFastestSector2Time: 6768,
  mFastestSector3Time: 6772,
  
  // Flags and pit
  mHighestFlagColour: 6800,       // uint32 (enum)
  mHighestFlagReason: 6804,       // uint32 (enum)
  mPitMode: 6808,                 // uint32 (enum)
  mPitSchedule: 6812,             // uint32 (enum)
  
  // Car state
  mCarFlags: 6816,                // uint32
  mOilTempCelsius: 6820,          // float
  mOilPressureKPa: 6824,          // float
  mWaterTempCelsius: 6828,        // float
  mWaterPressureKPa: 6832,        // float
  mFuelPressureKPa: 6836,         // float
  mFuelLevel: 6840,               // float
  mFuelCapacity: 6844,            // float
  mSpeed: 6848,                   // float (m/s)
  mRpm: 6852,                     // float
  mMaxRPM: 6856,                  // float
  mBrake: 6860,                   // float
  mThrottle: 6864,                // float
  mClutch: 6868,                  // float
  mSteering: 6872,                // float
  mGear: 6876,                    // int32
  mNumGears: 6880,                // int32
  mOdometerKM: 6884,              // float
  
  // Boost/Anti-lock (after odometer)
  mAntiLockActive: 6888,          // bool (1 byte)
  mBoostActive: 6889,             // bool (1 byte)
  // 2 bytes padding at 6890-6891
  mBoostAmount: 6892,             // float
  
  // Collision detection (from Crew Chief)
  mLastOpponentCollisionIndex: 6896,    // int32 (-1 = no collision)
  mLastOpponentCollisionMagnitude: 6900, // float (impact force)
  
  // Motion data (orientation, velocity, acceleration)
  mOrientation: 6904,             // float[3] (12 bytes)
  mLocalVelocity: 6916,           // float[3] (12 bytes)
  mWorldVelocity: 6928,           // float[3] (12 bytes)
  mAngularVelocity: 6940,         // float[3] (12 bytes)
  mLocalAcceleration: 6952,       // float[3] (12 bytes)
  mWorldAcceleration: 6964,       // float[3] (12 bytes)
  mExtentsCentre: 6976,           // float[3] (12 bytes)
  
  // Tyre data arrays (4 tyres each)
  mTyreFlags: 6988,               // uint32[4] (16 bytes)
  mTerrain: 7004,                 // uint32[4] (16 bytes)
  mTyreY: 7020,                   // float[4] (16 bytes)
  mTyreRPS: 7036,                 // float[4] (16 bytes)
  mTyreSlipSpeed: 7052,           // float[4] (16 bytes)
  mTyreTemp: 7068,                // float[4] (16 bytes)
  mTyreGrip: 7084,                // float[4] (16 bytes)
  mTyreHeightAboveGround: 7100,   // float[4] (16 bytes)
  mTyreLateralStiffness: 7116,    // float[4] (16 bytes)
  mTyreWear: 7132,                // float[4] (16 bytes)
  mBrakeDamage: 7148,             // float[4] (16 bytes)
  mSuspensionDamage: 7164,        // float[4] (16 bytes)
  mBrakeTempCelsius: 7180,        // float[4] (16 bytes)
  mTyreTreadTemp: 7196,           // float[4] (16 bytes)
  mTyreLayerTemp: 7212,           // float[4] (16 bytes)
  mTyreCarcassTemp: 7228,         // float[4] (16 bytes)
  mTyreRimTemp: 7244,             // float[4] (16 bytes)
  mTyreInternalAirTemp: 7260,     // float[4] (16 bytes)
  
  // Crash/damage state (from Crew Chief)
  mCrashState: 7276,              // uint32 (eCrashDamageState enum)
  mAeroDamage: 7280,              // float (0-1 severity)
  mEngineDamage: 7284,            // float (0-1 severity)
  
  // Weather
  mAmbientTemperature: 7292,      // float
  mTrackTemperature: 7296,        // float
  mRainDensity: 7300,             // float
  mWindSpeed: 7304,               // float
  
  // Additional arrays for all participants
  mFastestLapTimes: 8944,         // float[64]
  mLastLapTimes: 9200,            // float[64]
  mRaceStates: 9520,              // uint32[64]
  mPitModes: 9776,                // uint32[64]
  mSpeeds: 10800,                 // float[64]
  mCarNames: 11056,               // char[64][64]
  mCarClassNames: 15152,          // char[64][64]
  
  // Late additions (after participant arrays, from Crew Chief)
  mEnforcedPitStopLap: 19248,     // int32
  mTranslatedTrackLocation: 19252, // char[64]
  mTranslatedTrackVariation: 19316, // char[64]
  mBrakeBias: 19380,              // float
  mNationalities: 19548,          // uint32[64] (256 bytes)
  mSnowDensity: 19804,            // float
  mSessionDuration: 19808,        // float
  mSessionAdditionalLaps: 19812,  // int32
  mDrsState: 19864,               // uint32 (DrsState enum)
  mYellowFlagState: 19924,        // uint32 (YellowFlagState enum)
}

// ParticipantInfo structure (100 bytes each)
// 6400 bytes total / 64 max participants = 100 bytes per participant
// Structure has padding to maintain 4-byte alignment for floats/ints
const PARTICIPANT_SIZE = 100
const PARTICIPANT_OFFSETS = {
  mIsActive: 0,            // bool (1 byte)
  mName: 1,                // char[64] - name at offset 1
  // 3 bytes padding after name (offset 65-67) to align to 4-byte boundary
  mWorldPosition: 68,      // float[3] (12 bytes) - aligned at offset 68
  mCurrentLapDistance: 80, // float
  mRacePosition: 84,       // uint32 <-- THE KEY FIELD!
  mLapsCompleted: 88,      // uint32
  mCurrentLap: 92,         // uint32
  mCurrentSector: 96,      // int32
  // Total: 100 bytes
}

// ============================================================================
// ENUMS
// ============================================================================

export const GameState = {
  GAME_EXITED: 0,
  GAME_FRONT_END: 1,
  GAME_INGAME_PLAYING: 2,
  GAME_INGAME_PAUSED: 3,
  GAME_INGAME_INMENU_TIME_TICKING: 4,
  GAME_INGAME_RESTARTING: 5,
  GAME_INGAME_REPLAY: 6,
  GAME_FRONT_END_REPLAY: 7,
} as const

export const SessionState = {
  SESSION_INVALID: 0,
  SESSION_PRACTICE: 1,
  SESSION_TEST: 2,
  SESSION_QUALIFY: 3,
  SESSION_FORMATION_LAP: 4,
  SESSION_RACE: 5,
  SESSION_TIME_ATTACK: 6,
} as const

export const RaceState = {
  RACESTATE_INVALID: 0,
  RACESTATE_NOT_STARTED: 1,
  RACESTATE_RACING: 2,
  RACESTATE_FINISHED: 3,
  RACESTATE_DISQUALIFIED: 4,
  RACESTATE_RETIRED: 5,
  RACESTATE_DNF: 6,
} as const

export const PitMode = {
  PIT_MODE_NONE: 0,
  PIT_MODE_DRIVING_INTO_PITS: 1,
  PIT_MODE_IN_PIT: 2,
  PIT_MODE_DRIVING_OUT_OF_PITS: 3,
  PIT_MODE_IN_GARAGE: 4,
  PIT_MODE_DRIVING_OUT_OF_GARAGE: 5,
} as const

// Flag colours (from Crew Chief eFlagColour)
export const FlagColour = {
  FLAG_COLOUR_NONE: 0,
  FLAG_COLOUR_GREEN: 1,
  FLAG_COLOUR_BLUE: 2,
  FLAG_COLOUR_WHITE_SLOW_CAR: 3,
  FLAG_COLOUR_WHITE_FINAL_LAP: 4,  // Final lap flag!
  FLAG_COLOUR_RED: 5,
  FLAG_COLOUR_YELLOW: 6,
  FLAG_COLOUR_DOUBLE_YELLOW: 7,
  FLAG_COLOUR_BLACK_AND_WHITE: 8,
  FLAG_COLOUR_BLACK_ORANGE_CIRCLE: 9,
  FLAG_COLOUR_BLACK: 10,
  FLAG_COLOUR_CHEQUERED: 11,       // Race finished!
} as const

// Crash damage state (from Crew Chief eCrashDamageState)
export const CrashState = {
  CRASH_DAMAGE_NONE: 0,
  CRASH_DAMAGE_OFFTRACK: 1,
  CRASH_DAMAGE_LARGE_PROP: 2,
  CRASH_DAMAGE_SPINNING: 3,
  CRASH_DAMAGE_ROLLING: 4,
} as const

// Yellow flag state (from Crew Chief YellowFlagState)
export const YellowFlagState = {
  YFS_INVALID: -1,
  YFS_NONE: 0,
  YFS_PENDING: 1,
  YFS_PITS_CLOSED: 2,
  YFS_PIT_LEAD_LAP: 3,
  YFS_PITS_OPEN: 4,
  YFS_PITS_OPEN2: 5,
  YFS_LAST_LAP: 6,
  YFS_RESUME: 7,
  YFS_RACE_HALT: 8,
} as const

// DRS state (from Crew Chief DrsState)
export const DrsState = {
  DRS_INSTALLED: 1,      // Car has DRS
  DRS_ZONE_RULES: 2,     // In DRS zone rules apply
  DRS_AVAILABLE_NEXT: 4, // DRS will be available soon
  DRS_AVAILABLE_NOW: 8,  // DRS can be activated
  DRS_ACTIVE: 16,        // DRS is currently active
} as const

// ============================================================================
// SESSION PHASE STATE MACHINE (Crew Chief approach)
// ============================================================================
// This provides smoother race completion detection by tracking session state
// transitions rather than just raw race state values

export const SessionPhase = {
  UNAVAILABLE: 0,      // No valid session data
  GRIDWALK: 1,         // On grid, in menu with time ticking
  FORMATION: 2,        // Formation lap in progress
  COUNTDOWN: 3,        // On grid, lights sequence starting
  GREEN: 4,            // Race/session is active and running
  FULL_COURSE_YELLOW: 5, // Safety car / FCY deployed
  CHECKERED: 6,        // Leader has finished, others still racing
  FINISHED: 7,         // Player's session/race is complete
} as const

export type SessionPhaseType = typeof SessionPhase[keyof typeof SessionPhase]

/**
 * Session phase state tracker - Crew Chief style
 * Maintains state machine for reliable session completion detection
 */
export interface SessionPhaseState {
  currentPhase: SessionPhaseType
  previousPhase: SessionPhaseType
  leaderHasFinishedRace: boolean
  sessionType: 'Practice' | 'Qualifying' | 'Race' | 'Test' | 'Unknown'
  sessionStartTime: number
  sessionRunningTime: number
  raceCompleteEmitted: boolean
  raceActuallyStarted: boolean // Crew Chief: true when we've seen RACING state in Race session
  // Track participant state for leader detection
  leaderLapsCompleted: number
  sessionLaps: number
  sessionTimeRemaining: number
  extraLapsAfterTime: number
  // Debug logging
  lastPhaseChangeTime: number
  phaseChangeLog: Array<{
    timestamp: number
    from: SessionPhaseType
    to: SessionPhaseType
    reason: string
  }>
  // Track Practice/Qualifying transition emissions to avoid duplicates
  lastTransitionEmitted?: string
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ParticipantInfo {
  isActive: boolean
  name: string
  worldPosition: [number, number, number]
  currentLapDistance: number
  racePosition: number
  lapsCompleted: number
  currentLap: number
  currentSector: number
  // Additional data from parallel arrays
  fastestLapTime: number
  lastLapTime: number
  raceState: number
  pitMode: number
  speed: number
  carName: string
  carClassName: string
  isPlayer: boolean
}

export interface SessionInfo {
  version: number
  buildVersion: number
  gameState: number
  gameStateName: string
  sessionState: number
  sessionStateName: string
  raceState: number
  raceStateName: string
  viewedParticipantIndex: number
  numParticipants: number
  carName: string
  carClassName: string
  lapsInEvent: number
  trackLocation: string
  trackVariation: string
  trackLength: number
  numSectors: number
  lapInvalidated: boolean
  bestLapTime: number
  lastLapTime: number
  currentTime: number
  splitTimeAhead: number
  splitTimeBehind: number
  eventTimeRemaining: number
  speed: number
  rpm: number
  maxRpm: number
  gear: number
  numGears: number
  pitMode: number
  pitSchedule: number
  
  // Flags (raw enums from shared memory)
  highestFlagColour: number
  highestFlagReason: number
  
  // Car Health Data (for commentary)
  oilTempCelsius: number
  oilPressureKPa: number
  waterTempCelsius: number
  waterPressureKPa: number
  fuelLevel: number        // Current fuel (0-1 or liters depending on game)
  fuelCapacity: number     // Max fuel capacity
  fuelPressureKPa: number
  
  // Weather/Environment
  ambientTemperature: number
  trackTemperature: number
  rainDensity: number      // 0 = dry, 1 = heavy rain
  windSpeed: number
  snowDensity: number      // 0 = none, 1 = heavy snow
  
  // Collision detection (NEW)
  lastOpponentCollisionIndex: number  // -1 = no collision, else participant index
  lastOpponentCollisionMagnitude: number  // Impact force
  
  // Crash/damage state (NEW)
  crashState: number       // CrashState enum (spinning, offtrack, etc.)
  aeroDamage: number       // 0-1 damage severity
  engineDamage: number     // 0-1 damage severity
  
  // Yellow flag / safety car (NEW)
  yellowFlagState: number  // YellowFlagState enum
  
  // DRS (NEW)
  drsState: number         // DrsState flags
  
  // Session timing (NEW)
  sessionDuration: number
  sessionAdditionalLaps: number
  enforcedPitStopLap: number
  
  // Tyre data (NEW - for player's car)
  tyreWear: [number, number, number, number]  // FL, FR, RL, RR
  tyreTemp: [number, number, number, number]
  brakeDamage: [number, number, number, number]
  suspensionDamage: [number, number, number, number]
}

export interface TelemetryData {
  session: SessionInfo
  participants: ParticipantInfo[]
  playerIndex: number
  isConnected: boolean
  timestamp: number
}

// ============================================================================
// WINDOWS API BINDINGS
// ============================================================================

let kernel32: any = null
let hMapFile: number | null = null
let pBuffer: any = null

function initWindowsAPI() {
  if (kernel32) return true
  
  try {
    kernel32 = koffi.load('kernel32.dll')
    
    // Define Windows API functions
    kernel32.OpenFileMappingA = kernel32.func('__stdcall', 'OpenFileMappingA', 'void*', ['uint', 'bool', 'str'])
    kernel32.MapViewOfFile = kernel32.func('__stdcall', 'MapViewOfFile', 'void*', ['void*', 'uint', 'uint', 'uint', 'size_t'])
    kernel32.UnmapViewOfFile = kernel32.func('__stdcall', 'UnmapViewOfFile', 'bool', ['void*'])
    kernel32.CloseHandle = kernel32.func('__stdcall', 'CloseHandle', 'bool', ['void*'])
    kernel32.GetLastError = kernel32.func('__stdcall', 'GetLastError', 'uint', [])
    
    return true
  } catch (err) {
    console.error('[SharedMemory] Failed to load kernel32.dll:', err)
    return false
  }
}

// ============================================================================
// SHARED MEMORY READER CLASS
// ============================================================================

export class PCars2SharedMemory {
  private isOpen: boolean = false
  private buffer: Buffer | null = null
  private lastError: string = ''
  private lastErrorLogMessage: string = ''
  private lastErrorLogTime: number = 0
  
  constructor() {
    initWindowsAPI()
  }

  private logErrorThrottled(message: string, minIntervalMs: number = 10000): void {
    const now = Date.now()
    if (message !== this.lastErrorLogMessage || now - this.lastErrorLogTime >= minIntervalMs) {
      console.error('[SharedMemory]', message)
      this.lastErrorLogMessage = message
      this.lastErrorLogTime = now
    }
  }
  
  /**
   * Open the shared memory region
   */
  open(): boolean {
    if (this.isOpen) return true
    
    if (!kernel32) {
      this.lastError = 'Windows API not initialized'
      return false
    }
    
    try {
      // Open the existing file mapping
      hMapFile = kernel32.OpenFileMappingA(FILE_MAP_READ, false, SHARED_MEMORY_NAME)
      
      if (!hMapFile || hMapFile === INVALID_HANDLE_VALUE) {
        const error = kernel32.GetLastError()
        this.lastError = `OpenFileMapping failed with error ${error}. Is AMS2 running with Shared Memory = Project Cars 2?`
        this.logErrorThrottled(this.lastError)
        return false
      }
      
      // Map view of file
      pBuffer = kernel32.MapViewOfFile(hMapFile, FILE_MAP_READ, 0, 0, SHARED_MEMORY_SIZE)
      
      if (!pBuffer) {
        const error = kernel32.GetLastError()
        this.lastError = `MapViewOfFile failed with error ${error}`
        this.logErrorThrottled(this.lastError)
        kernel32.CloseHandle(hMapFile)
        hMapFile = null
        return false
      }
      
      this.isOpen = true
      console.log('[SharedMemory] Successfully opened $pcars2$ shared memory')
      return true
      
    } catch (err) {
      this.lastError = `Exception: ${err}`
      console.error('[SharedMemory] Exception opening shared memory:', err)
      return false
    }
  }
  
  /**
   * Close the shared memory region
   */
  close(): void {
    if (pBuffer) {
      try {
        kernel32.UnmapViewOfFile(pBuffer)
      } catch (e) {
        // Ignore
      }
      pBuffer = null
    }
    
    if (hMapFile) {
      try {
        kernel32.CloseHandle(hMapFile)
      } catch (e) {
        // Ignore
      }
      hMapFile = null
    }
    
    this.isOpen = false
    this.buffer = null
    console.log('[SharedMemory] Closed shared memory')
  }
  
  /**
   * Check if shared memory is open and AMS2 is connected
   */
  isConnected(): boolean {
    return this.isOpen && pBuffer !== null
  }
  
  /**
   * Get the last error message
   */
  getLastError(): string {
    return this.lastError
  }
  
  /**
   * Read the current telemetry data from shared memory
   */
  read(): TelemetryData | null {
    if (!this.isConnected()) {
      // Try to open if not connected
      if (!this.open()) {
        return null
      }
    }
    
    try {
      // Read the entire shared memory block into a Buffer using koffi
      // koffi.decode returns an array for array types, then convert to Buffer
      const byteArray = koffi.decode(pBuffer, `uint8_t[${SHARED_MEMORY_SIZE}]`)
      const buffer = Buffer.from(byteArray)
      
      return this.parseBuffer(buffer)
      
    } catch (err) {
      console.error('[SharedMemory] Read error:', err)
      this.lastError = `Read error: ${err}`
      return null
    }
  }
  
  /**
   * Parse the raw buffer into structured data
   */
  private parseBuffer(buffer: Buffer): TelemetryData {
    // Debug: Log first 32 bytes to verify we're reading real data
    const firstBytes = buffer.slice(0, 32)
    const version = buffer.readUInt32LE(0)
    const buildVersion = buffer.readUInt32LE(4)
    
    // If version is 0 and buildVersion is 0, we're likely reading empty memory
    if (version === 0 && buildVersion === 0) {
      console.log('[SharedMemory] Warning: Reading all zeros - AMS2 may not have Shared Memory enabled')
      console.log('[SharedMemory] First 32 bytes:', firstBytes.toString('hex'))
    }
    // Removed verbose version logging - was too spammy
    
    // Read session info
    const gameState = buffer.readUInt32LE(OFFSETS.mGameState)
    const sessionState = buffer.readUInt32LE(OFFSETS.mSessionState)
    const raceState = buffer.readUInt32LE(OFFSETS.mRaceState)
    const viewedParticipantIndex = buffer.readInt32LE(OFFSETS.mViewedParticipantIndex)
    const numParticipants = buffer.readInt32LE(OFFSETS.mNumParticipants)
    
    const session: SessionInfo = {
      version: buffer.readUInt32LE(OFFSETS.mVersion),
      buildVersion: buffer.readUInt32LE(OFFSETS.mBuildVersionNumber),
      gameState,
      gameStateName: this.getGameStateName(gameState),
      sessionState,
      sessionStateName: this.getSessionStateName(sessionState),
      raceState,
      raceStateName: this.getRaceStateName(raceState),
      viewedParticipantIndex,
      numParticipants,
      carName: this.readString(buffer, OFFSETS.mCarName, STRING_LENGTH_MAX),
      carClassName: this.readString(buffer, OFFSETS.mCarClassName, STRING_LENGTH_MAX),
      lapsInEvent: buffer.readUInt32LE(OFFSETS.mLapsInEvent),
      trackLocation: this.readString(buffer, OFFSETS.mTrackLocation, STRING_LENGTH_MAX),
      trackVariation: this.readString(buffer, OFFSETS.mTrackVariation, STRING_LENGTH_MAX),
      trackLength: buffer.readFloatLE(OFFSETS.mTrackLength),
      numSectors: buffer.readInt32LE(OFFSETS.mNumSectors),
      lapInvalidated: buffer.readUInt8(OFFSETS.mLapInvalidated) !== 0,
      bestLapTime: buffer.readFloatLE(OFFSETS.mBestLapTime),
      lastLapTime: buffer.readFloatLE(OFFSETS.mLastLapTime),
      currentTime: buffer.readFloatLE(OFFSETS.mCurrentTime),
      splitTimeAhead: buffer.readFloatLE(OFFSETS.mSplitTimeAhead),
      splitTimeBehind: buffer.readFloatLE(OFFSETS.mSplitTimeBehind),
      eventTimeRemaining: buffer.readFloatLE(OFFSETS.mEventTimeRemaining),
      speed: buffer.readFloatLE(OFFSETS.mSpeed) * 3.6, // Convert m/s to km/h
      rpm: buffer.readFloatLE(OFFSETS.mRpm),
      maxRpm: buffer.readFloatLE(OFFSETS.mMaxRPM),
      gear: buffer.readInt32LE(OFFSETS.mGear),
      numGears: buffer.readInt32LE(OFFSETS.mNumGears),
      pitMode: buffer.readUInt32LE(OFFSETS.mPitMode),
      pitSchedule: buffer.readUInt32LE(OFFSETS.mPitSchedule),
      
      // Flags (raw enums; mapping is handled downstream and may be conservative)
      highestFlagColour: buffer.readUInt32LE(OFFSETS.mHighestFlagColour),
      highestFlagReason: buffer.readUInt32LE(OFFSETS.mHighestFlagReason),
      
      // Car Health Data
      oilTempCelsius: buffer.readFloatLE(OFFSETS.mOilTempCelsius),
      oilPressureKPa: buffer.readFloatLE(OFFSETS.mOilPressureKPa),
      waterTempCelsius: buffer.readFloatLE(OFFSETS.mWaterTempCelsius),
      waterPressureKPa: buffer.readFloatLE(OFFSETS.mWaterPressureKPa),
      fuelLevel: buffer.readFloatLE(OFFSETS.mFuelLevel),
      fuelCapacity: buffer.readFloatLE(OFFSETS.mFuelCapacity),
      fuelPressureKPa: buffer.readFloatLE(OFFSETS.mFuelPressureKPa),
      
      // Weather/Environment
      ambientTemperature: buffer.readFloatLE(OFFSETS.mAmbientTemperature),
      trackTemperature: buffer.readFloatLE(OFFSETS.mTrackTemperature),
      rainDensity: buffer.readFloatLE(OFFSETS.mRainDensity),
      windSpeed: buffer.readFloatLE(OFFSETS.mWindSpeed),
      snowDensity: buffer.readFloatLE(OFFSETS.mSnowDensity),
      
      // Collision detection (NEW)
      lastOpponentCollisionIndex: buffer.readInt32LE(OFFSETS.mLastOpponentCollisionIndex),
      lastOpponentCollisionMagnitude: buffer.readFloatLE(OFFSETS.mLastOpponentCollisionMagnitude),
      
      // Crash/damage state (NEW)
      crashState: buffer.readUInt32LE(OFFSETS.mCrashState),
      aeroDamage: buffer.readFloatLE(OFFSETS.mAeroDamage),
      engineDamage: buffer.readFloatLE(OFFSETS.mEngineDamage),
      
      // Yellow flag / safety car (NEW)
      yellowFlagState: buffer.readInt32LE(OFFSETS.mYellowFlagState),
      
      // DRS (NEW)
      drsState: buffer.readUInt32LE(OFFSETS.mDrsState),
      
      // Session timing (NEW)
      sessionDuration: buffer.readFloatLE(OFFSETS.mSessionDuration),
      sessionAdditionalLaps: buffer.readInt32LE(OFFSETS.mSessionAdditionalLaps),
      enforcedPitStopLap: buffer.readInt32LE(OFFSETS.mEnforcedPitStopLap),
      
      // Tyre data (NEW - for player's car)
      tyreWear: [
        buffer.readFloatLE(OFFSETS.mTyreWear),
        buffer.readFloatLE(OFFSETS.mTyreWear + 4),
        buffer.readFloatLE(OFFSETS.mTyreWear + 8),
        buffer.readFloatLE(OFFSETS.mTyreWear + 12),
      ],
      tyreTemp: [
        buffer.readFloatLE(OFFSETS.mTyreTemp),
        buffer.readFloatLE(OFFSETS.mTyreTemp + 4),
        buffer.readFloatLE(OFFSETS.mTyreTemp + 8),
        buffer.readFloatLE(OFFSETS.mTyreTemp + 12),
      ],
      brakeDamage: [
        buffer.readFloatLE(OFFSETS.mBrakeDamage),
        buffer.readFloatLE(OFFSETS.mBrakeDamage + 4),
        buffer.readFloatLE(OFFSETS.mBrakeDamage + 8),
        buffer.readFloatLE(OFFSETS.mBrakeDamage + 12),
      ],
      suspensionDamage: [
        buffer.readFloatLE(OFFSETS.mSuspensionDamage),
        buffer.readFloatLE(OFFSETS.mSuspensionDamage + 4),
        buffer.readFloatLE(OFFSETS.mSuspensionDamage + 8),
        buffer.readFloatLE(OFFSETS.mSuspensionDamage + 12),
      ],
    }
    
    // Read participants
    const participants: ParticipantInfo[] = []
    const validParticipants = Math.min(numParticipants, STORED_PARTICIPANTS_MAX)
    
    for (let i = 0; i < validParticipants; i++) {
      const participantOffset = OFFSETS.mParticipantInfo + (i * PARTICIPANT_SIZE)
      
      const isActive = buffer.readUInt8(participantOffset + PARTICIPANT_OFFSETS.mIsActive) !== 0
      
      if (!isActive && i >= numParticipants) continue
      
      const participant: ParticipantInfo = {
        isActive,
        name: this.readString(buffer, participantOffset + PARTICIPANT_OFFSETS.mName, STRING_LENGTH_MAX),
        worldPosition: [
          buffer.readFloatLE(participantOffset + PARTICIPANT_OFFSETS.mWorldPosition),
          buffer.readFloatLE(participantOffset + PARTICIPANT_OFFSETS.mWorldPosition + 4),
          buffer.readFloatLE(participantOffset + PARTICIPANT_OFFSETS.mWorldPosition + 8),
        ],
        currentLapDistance: buffer.readFloatLE(participantOffset + PARTICIPANT_OFFSETS.mCurrentLapDistance),
        racePosition: buffer.readUInt32LE(participantOffset + PARTICIPANT_OFFSETS.mRacePosition),
        lapsCompleted: buffer.readUInt32LE(participantOffset + PARTICIPANT_OFFSETS.mLapsCompleted),
        currentLap: buffer.readUInt32LE(participantOffset + PARTICIPANT_OFFSETS.mCurrentLap),
        currentSector: buffer.readInt32LE(participantOffset + PARTICIPANT_OFFSETS.mCurrentSector),
        // Read from parallel arrays
        fastestLapTime: buffer.readFloatLE(OFFSETS.mFastestLapTimes + (i * 4)),
        lastLapTime: buffer.readFloatLE(OFFSETS.mLastLapTimes + (i * 4)),
        raceState: buffer.readUInt32LE(OFFSETS.mRaceStates + (i * 4)),
        pitMode: buffer.readUInt32LE(OFFSETS.mPitModes + (i * 4)),
        speed: buffer.readFloatLE(OFFSETS.mSpeeds + (i * 4)) * 3.6, // Convert to km/h
        carName: this.readString(buffer, OFFSETS.mCarNames + (i * STRING_LENGTH_MAX), STRING_LENGTH_MAX),
        carClassName: this.readString(buffer, OFFSETS.mCarClassNames + (i * STRING_LENGTH_MAX), STRING_LENGTH_MAX),
        isPlayer: i === viewedParticipantIndex,
      }
      
      participants.push(participant)
    }
    
    // Sort participants by race position for convenience
    participants.sort((a, b) => a.racePosition - b.racePosition)
    
    return {
      session,
      participants,
      playerIndex: viewedParticipantIndex,
      isConnected: true,
      timestamp: Date.now(),
    }
  }
  
  /**
   * Read a null-terminated string from buffer
   */
  private readString(buffer: Buffer, offset: number, maxLength: number): string {
    if (offset + maxLength > buffer.length) return ''
    
    const bytes = buffer.slice(offset, offset + maxLength)
    const nullIndex = bytes.indexOf(0)
    const str = bytes.slice(0, nullIndex > 0 ? nullIndex : maxLength).toString('utf8')
    return str.replace(/[^\x20-\x7E]/g, '').trim()
  }
  
  /**
   * Get human-readable game state name
   */
  private getGameStateName(state: number): string {
    const names: Record<number, string> = {
      [GameState.GAME_EXITED]: 'Exited',
      [GameState.GAME_FRONT_END]: 'Front End',
      [GameState.GAME_INGAME_PLAYING]: 'Ingame Playing',
      [GameState.GAME_INGAME_PAUSED]: 'Ingame Paused',
      [GameState.GAME_INGAME_INMENU_TIME_TICKING]: 'Ingame In Menu',
      [GameState.GAME_INGAME_RESTARTING]: 'Restarting',
      [GameState.GAME_INGAME_REPLAY]: 'Ingame Replay',
      [GameState.GAME_FRONT_END_REPLAY]: 'Front End Replay',
    }
    return names[state] || `Unknown (${state})`
  }
  
  /**
   * Get human-readable session state name
   */
  private getSessionStateName(state: number): string {
    const names: Record<number, string> = {
      [SessionState.SESSION_INVALID]: 'Invalid',
      [SessionState.SESSION_PRACTICE]: 'Practice',
      [SessionState.SESSION_TEST]: 'Test',
      [SessionState.SESSION_QUALIFY]: 'Qualifying',
      [SessionState.SESSION_FORMATION_LAP]: 'Formation Lap',
      [SessionState.SESSION_RACE]: 'Race',
      [SessionState.SESSION_TIME_ATTACK]: 'Time Attack',
    }
    return names[state] || `Unknown (${state})`
  }
  
  /**
   * Get human-readable race state name
   */
  private getRaceStateName(state: number): string {
    const names: Record<number, string> = {
      [RaceState.RACESTATE_INVALID]: 'Invalid',
      [RaceState.RACESTATE_NOT_STARTED]: 'Not Started',
      [RaceState.RACESTATE_RACING]: 'Racing',
      [RaceState.RACESTATE_FINISHED]: 'Finished',
      [RaceState.RACESTATE_DISQUALIFIED]: 'Disqualified',
      [RaceState.RACESTATE_RETIRED]: 'Retired',
      [RaceState.RACESTATE_DNF]: 'DNF',
    }
    return names[state] || `Unknown (${state})`
  }
}

// Export singleton instance
export const sharedMemory = new PCars2SharedMemory()

