/**
 * AMS2 Shared Memory Telemetry Manager
 * 
 * This module manages the shared memory connection to AMS2 and provides
 * telemetry data to the rest of the application via IPC.
 */

import { ipcMain, BrowserWindow } from 'electron'
import { PCars2SharedMemory, TelemetryData, RaceState, SessionState, GameState, FlagColour, CrashState, YellowFlagState, SessionPhase, SessionPhaseState, SessionPhaseType, PitMode } from './pcars2'
import { feedTelemetryToCommentary, feedRaceCompleteToCommentary } from '../commentary'

// ============================================================================
// STATE (Crew Chief-style Session Phase tracking)
// ============================================================================

interface TelemetryState {
  isRunning: boolean
  pollInterval: NodeJS.Timeout | null
  pollRate: number // Hz
  sharedMemory: PCars2SharedMemory
  lastData: TelemetryData | null
  // Crew Chief-style session phase state machine
  sessionPhase: SessionPhaseState
}

function createInitialSessionPhaseState(): SessionPhaseState {
  return {
    currentPhase: SessionPhase.UNAVAILABLE,
    previousPhase: SessionPhase.UNAVAILABLE,
    leaderHasFinishedRace: false,
    sessionType: 'Unknown',
    sessionStartTime: 0,
    sessionRunningTime: 0,
    raceCompleteEmitted: false,
    raceActuallyStarted: false, // Crew Chief: track if race actually started (saw RACING state)
    leaderLapsCompleted: 0,
    sessionLaps: 0,
    sessionTimeRemaining: Infinity,
    extraLapsAfterTime: 0,
    lastPhaseChangeTime: 0,
    phaseChangeLog: [],
  }
}

const state: TelemetryState = {
  isRunning: false,
  pollInterval: null,
  pollRate: 60, // 60 Hz default
  sharedMemory: new PCars2SharedMemory(),
  lastData: null,
  sessionPhase: createInitialSessionPhaseState(),
}

// ============================================================================
// TELEMETRY POLLING
// ============================================================================

function startPolling(mainWindow: BrowserWindow | null): void {
  if (state.isRunning) {
    console.log('[Telemetry] Already running')
    return
  }
  
  console.log(`[Telemetry] Starting shared memory polling at ${state.pollRate}Hz (Crew Chief-style detection)`)
  
  state.isRunning = true
  // Reset session phase state machine
  state.sessionPhase = createInitialSessionPhaseState()
  
  const pollIntervalMs = Math.floor(1000 / state.pollRate)
  
  state.pollInterval = setInterval(() => {
    pollTelemetry(mainWindow)
  }, pollIntervalMs)
  
  // Send initial status
  mainWindow?.webContents.send('telemetry:status', {
    listening: true,
    type: 'shared-memory',
    pollRate: state.pollRate,
  })
}

function stopPolling(): void {
  if (state.pollInterval) {
    clearInterval(state.pollInterval)
    state.pollInterval = null
  }
  
  state.sharedMemory.close()
  state.isRunning = false
  state.lastData = null
  
  console.log('[Telemetry] Stopped shared memory polling')
}

function pollTelemetry(mainWindow: BrowserWindow | null): void {
  const data = state.sharedMemory.read()
  
  if (!data) {
    // Not connected - send heartbeat with disconnected status
    mainWindow?.webContents.send('telemetry:heartbeat', {
      listening: state.isRunning,
      receiving: false,
      error: state.sharedMemory.getLastError(),
      participantCount: 0,
    })
    return
  }
  
  state.lastData = data
  
  // Convert to format expected by existing code
  const session = convertSessionInfo(data)
  const participants = convertParticipants(data)
  
  // Send session data
  mainWindow?.webContents.send('telemetry:session', session)
  
  // Send participant data
  mainWindow?.webContents.send('telemetry:participants', {
    participants,
    playerIndex: data.playerIndex,
  })
  
  // Check for race completion
  checkRaceCompletion(data, mainWindow)
  
  // Feed to commentary system
  feedTelemetryToCommentary(session, participants, data.playerIndex)
  
  // Send heartbeat with Crew Chief-style phase info
  mainWindow?.webContents.send('telemetry:heartbeat', {
    listening: state.isRunning,
    receiving: true,
    lastPacket: data.timestamp,
    participantCount: data.participants.length,
    gameState: data.session.gameStateName,
    sessionState: data.session.sessionStateName,
    raceState: data.session.raceStateName,
    // Crew Chief-style session phase info (for debugging)
    sessionPhase: getSessionPhaseName(state.sessionPhase.currentPhase),
    leaderHasFinished: state.sessionPhase.leaderHasFinishedRace,
    raceCompleteEmitted: state.sessionPhase.raceCompleteEmitted,
  })
}

// ============================================================================
// DATA CONVERSION (to match existing interfaces)
// ============================================================================

interface LegacySessionInfo {
  sessionType: string
  sessionState: string
  raceState: string
  trackName: string
  trackLength: number
  numParticipants: number
  lapsInEvent: number
  timeRemaining: number
  viewedParticipantIndex: number
  ambientTemp: number
  trackTemp: number
  currentLapTime: number
  bestLapTime: number
  lastLapTime: number
  speed: number
  rpm: number
  gear: number
  carName?: string
  carClass?: string
  // Flags (raw enums from shared memory)
  highestFlagColour?: number
  highestFlagReason?: number
  // Split times (accurate gap data from the game)
  splitTimeAhead?: number
  splitTimeBehind?: number
  // Weather
  rainDensity?: number
  windSpeed?: number
  snowDensity?: number
  // Fuel
  fuelLevel?: number
  fuelCapacity?: number
  // Car health (for commentary)
  oilTempCelsius?: number
  waterTempCelsius?: number
  // NEW: Collision detection
  lastOpponentCollisionIndex?: number
  lastOpponentCollisionMagnitude?: number
  // NEW: Crash/damage state
  crashState?: number
  aeroDamage?: number
  engineDamage?: number
  // NEW: Yellow flag state
  yellowFlagState?: number
  // NEW: Tyre wear/damage
  tyreWear?: [number, number, number, number]
  suspensionDamage?: [number, number, number, number]
}

interface LegacyParticipantInfo {
  name: string
  carIndex: number
  carClass: string
  racePosition: number
  lapsCompleted: number
  currentLap: number
  currentLapTime: number
  bestLapTime: number
  sector1Time: number
  sector2Time: number
  sector3Time: number
  lastLapTime: number
  currentLapValid: boolean
  pitMode: number
  isPlayer: boolean
}

function convertSessionInfo(data: TelemetryData): LegacySessionInfo {
  const s = data.session
  return {
    sessionType: s.sessionStateName,
    sessionState: s.gameStateName,
    raceState: s.raceStateName,
    trackName: s.trackVariation ? `${s.trackLocation} ${s.trackVariation}` : s.trackLocation,
    trackLength: s.trackLength,
    numParticipants: s.numParticipants,
    lapsInEvent: s.lapsInEvent,
    timeRemaining: s.eventTimeRemaining,
    viewedParticipantIndex: s.viewedParticipantIndex,
    ambientTemp: s.ambientTemperature,
    trackTemp: s.trackTemperature,
    currentLapTime: s.currentTime,
    bestLapTime: s.bestLapTime,
    lastLapTime: s.lastLapTime,
    speed: s.speed,
    rpm: s.rpm,
    gear: s.gear,
    carName: s.carName,
    carClass: s.carClassName,
    highestFlagColour: s.highestFlagColour,
    highestFlagReason: s.highestFlagReason,
    // Split times (accurate gap data from the game)
    splitTimeAhead: s.splitTimeAhead,
    splitTimeBehind: s.splitTimeBehind,
    // Weather
    rainDensity: s.rainDensity,
    windSpeed: s.windSpeed,
    snowDensity: s.snowDensity,
    // Fuel
    fuelLevel: s.fuelLevel,
    fuelCapacity: s.fuelCapacity,
    // Car health
    oilTempCelsius: s.oilTempCelsius,
    waterTempCelsius: s.waterTempCelsius,
    // NEW: Collision detection
    lastOpponentCollisionIndex: s.lastOpponentCollisionIndex,
    lastOpponentCollisionMagnitude: s.lastOpponentCollisionMagnitude,
    // NEW: Crash/damage state
    crashState: s.crashState,
    aeroDamage: s.aeroDamage,
    engineDamage: s.engineDamage,
    // NEW: Yellow flag state
    yellowFlagState: s.yellowFlagState,
    // NEW: Tyre wear/damage
    tyreWear: s.tyreWear,
    suspensionDamage: s.suspensionDamage,
  }
}

function convertParticipants(data: TelemetryData): LegacyParticipantInfo[] {
  return data.participants.map((p, index) => ({
    name: p.name,
    carIndex: index,
    carClass: p.carClassName || data.session.carClassName,
    racePosition: p.racePosition,
    lapsCompleted: p.lapsCompleted,
    currentLap: p.currentLap,
    currentLapTime: 0, // Not available per-participant in shared memory
    bestLapTime: p.fastestLapTime,
    sector1Time: 0,
    sector2Time: 0,
    sector3Time: 0,
    lastLapTime: p.lastLapTime,
    currentLapValid: true,
    pitMode: p.pitMode,
    isPlayer: p.isPlayer,
  }))
}

// ============================================================================
// CREW CHIEF-STYLE SESSION PHASE DETECTION
// ============================================================================
// This provides much more reliable race completion detection by:
// 1. Tracking session phase as a state machine
// 2. Separately tracking when the leader finishes (checkered phase)
// 3. Detecting player finish separately from leader finish
// 4. Comprehensive logging for debugging

/**
 * Get human-readable session phase name
 */
function getSessionPhaseName(phase: SessionPhaseType): string {
  const names: Record<SessionPhaseType, string> = {
    [SessionPhase.UNAVAILABLE]: 'Unavailable',
    [SessionPhase.GRIDWALK]: 'Gridwalk',
    [SessionPhase.FORMATION]: 'Formation',
    [SessionPhase.COUNTDOWN]: 'Countdown',
    [SessionPhase.GREEN]: 'Green',
    [SessionPhase.FULL_COURSE_YELLOW]: 'FCY/SafetyCar',
    [SessionPhase.CHECKERED]: 'Checkered',
    [SessionPhase.FINISHED]: 'Finished',
  }
  return names[phase] || `Unknown (${phase})`
}

/**
 * Map session type from AMS2 session state
 */
function mapSessionType(sessionState: number): 'Practice' | 'Qualifying' | 'Race' | 'Test' | 'Unknown' {
  switch (sessionState) {
    case SessionState.SESSION_PRACTICE:
      return 'Practice'
    case SessionState.SESSION_TEST:
      return 'Test'
    case SessionState.SESSION_QUALIFY:
      return 'Qualifying'
    case SessionState.SESSION_RACE:
    case SessionState.SESSION_FORMATION_LAP:
      return 'Race'
    default:
      return 'Unknown'
  }
}

/**
 * Crew Chief-style session phase mapper
 * Based on AMS2GameStateMapper.mapToSessionPhase()
 */
function mapToSessionPhase(
  data: TelemetryData,
  phaseState: SessionPhaseState
): SessionPhaseType {
  const { session, participants } = data
  const raceState = session.raceState
  const sessionState = session.sessionState
  const gameState = session.gameState
  const yellowFlagState = session.yellowFlagState
  const numParticipants = session.numParticipants
  const playerSpeed = session.speed
  
  // Find player and check their pit mode
  const player = participants.find(p => p.isPlayer)
  const playerPitMode = player?.pitMode ?? PitMode.PIT_MODE_NONE
  
  // No participants = unavailable
  if (numParticipants < 1) {
    return SessionPhase.UNAVAILABLE
  }
  
  const sessionType = mapSessionType(sessionState)
  
  // ============ RACE SESSION LOGIC ============
  if (sessionType === 'Race') {
    
    // Check for Full Course Yellow / Safety Car (takes priority)
    if (
      yellowFlagState === YellowFlagState.YFS_LAST_LAP ||
      yellowFlagState === YellowFlagState.YFS_PENDING ||
      yellowFlagState === YellowFlagState.YFS_PITS_CLOSED ||
      yellowFlagState === YellowFlagState.YFS_PITS_OPEN ||
      yellowFlagState === YellowFlagState.YFS_PITS_OPEN2 ||
      yellowFlagState === YellowFlagState.YFS_PIT_LEAD_LAP ||
      yellowFlagState === YellowFlagState.YFS_RACE_HALT
    ) {
      return SessionPhase.FULL_COURSE_YELLOW
    }
    
    // Race not started yet
    if (raceState === RaceState.RACESTATE_NOT_STARTED) {
      if (sessionState === SessionState.SESSION_FORMATION_LAP) {
        return SessionPhase.FORMATION
      } else if (gameState === GameState.GAME_INGAME_INMENU_TIME_TICKING) {
        return SessionPhase.GRIDWALK
      } else if (playerPitMode !== PitMode.PIT_MODE_IN_GARAGE) {
        return SessionPhase.COUNTDOWN
      } else {
        // In garage, keep previous phase
        return phaseState.previousPhase
      }
    }
    
    // Race is active
    if (raceState === RaceState.RACESTATE_RACING) {
      // If leader has finished, we're in checkered flag phase
      if (phaseState.leaderHasFinishedRace) {
        return SessionPhase.CHECKERED
      }
      return SessionPhase.GREEN
    }
    
    // Player has finished (Finished, DNF, Retired, Disqualified)
    if (
      raceState === RaceState.RACESTATE_FINISHED ||
      raceState === RaceState.RACESTATE_DNF ||
      raceState === RaceState.RACESTATE_DISQUALIFIED ||
      raceState === RaceState.RACESTATE_RETIRED
    ) {
      return SessionPhase.FINISHED
    }
  }
  
  // ============ PRACTICE / QUALIFYING / TEST LOGIC ============
  if (sessionType === 'Practice' || sessionType === 'Qualifying' || sessionType === 'Test') {
    const sessionRunTime = phaseState.sessionRunningTime
    const sessionTimeRemaining = session.eventTimeRemaining
    
    // Session time has run out (within 0.2 seconds tolerance)
    if (sessionRunTime > 0 && sessionTimeRemaining <= 0.2) {
      // If we were already finished, stay finished
      if (phaseState.previousPhase === SessionPhase.FINISHED) {
        return SessionPhase.FINISHED
      }
      
      // Checkered flag phase - player might be on their final lap
      // Check if player is still moving
      if (playerSpeed < 1) {
        // Player stopped - session is finished
        console.log('[SessionPhase] Practice/Quali finished - player stopped')
        return SessionPhase.FINISHED
      }
      
      // Player still driving - checkered phase
      return SessionPhase.CHECKERED
    }
    
    // Session is active
    if (
      phaseState.previousPhase !== SessionPhase.CHECKERED &&
      phaseState.previousPhase !== SessionPhase.FINISHED &&
      (raceState === RaceState.RACESTATE_RACING || raceState === RaceState.RACESTATE_NOT_STARTED)
    ) {
      return SessionPhase.GREEN
    }
  }
  
  return SessionPhase.UNAVAILABLE
}

/**
 * Check if leader has finished the race
 * Crew Chief tracks this by watching when P1 completes their final lap
 */
function checkLeaderFinished(data: TelemetryData, phaseState: SessionPhaseState): boolean {
  const { session, participants } = data
  
  // Already detected
  if (phaseState.leaderHasFinishedRace) return true
  
  // Find the leader (P1)
  const leader = participants.find(p => p.racePosition === 1)
  if (!leader) return false
  
  const sessionLaps = session.lapsInEvent
  const sessionTimeRemaining = session.eventTimeRemaining
  const extraLaps = session.sessionAdditionalLaps
  
  // Lap-based race: leader finishes when they complete all laps
  if (sessionLaps > 0) {
    if (leader.lapsCompleted >= sessionLaps) {
      console.log(`[SessionPhase] LEADER FINISHED (lap race): ${leader.name} completed ${leader.lapsCompleted}/${sessionLaps} laps`)
      return true
    }
  }
  
  // Time-based race: leader finishes when time runs out and they cross the line
  if (sessionTimeRemaining <= 0 && phaseState.sessionTimeRemaining > 0) {
    // Time just ran out - check if leader is on their final lap(s)
    const extraLapsStarted = leader.lapsCompleted - phaseState.leaderLapsCompleted
    if (extraLapsStarted > extraLaps) {
      console.log(`[SessionPhase] LEADER FINISHED (timed race): ${leader.name} completed extra laps after time`)
      return true
    }
  }
  
  // Update tracking
  phaseState.leaderLapsCompleted = leader.lapsCompleted
  
  return false
}

/**
 * Main session phase tracking function
 * This replaces the old checkRaceCompletion function with Crew Chief-style logic
 */
function updateSessionPhase(data: TelemetryData, mainWindow: BrowserWindow | null): void {
  const phaseState = state.sessionPhase
  const now = Date.now()
  
  // Update session running time
  const currentSessionState = data.session.sessionState
  const previousSessionType = phaseState.sessionType
  const currentSessionType = mapSessionType(currentSessionState)
  
  // Detect new session (session type changed)
  if (currentSessionType !== previousSessionType && currentSessionType !== 'Unknown') {
    console.log(`[SessionPhase] NEW SESSION: ${previousSessionType} -> ${currentSessionType}`)
    
    // Emit session complete for the PREVIOUS session (if it was Practice or Qualifying)
    // This handles the case where user skips/ends a session early
    if (previousSessionType === 'Practice' || previousSessionType === 'Qualifying') {
      const player = data.participants.find(p => p.isPlayer)
      if (player) {
        // Use a separate flag for Practice/Qualifying transitions to avoid blocking Race completion
        const transitionKey = `${previousSessionType}-${phaseState.sessionStartTime}`
        if (!phaseState.lastTransitionEmitted || phaseState.lastTransitionEmitted !== transitionKey) {
          console.log(`[SessionPhase] ========================================`)
          console.log(`[SessionPhase] ${previousSessionType.toUpperCase()} SESSION COMPLETE (transition)`)
          console.log(`[SessionPhase] Player: ${player.name}`)
          console.log(`[SessionPhase] Position: P${player.racePosition}`)
          console.log(`[SessionPhase] Transitioning to: ${currentSessionType}`)
          console.log(`[SessionPhase] ========================================`)
          
          const sessionCompleteData = {
            playerPosition: player.racePosition,
            playerName: player.name,
            totalParticipants: data.session.numParticipants,
            lapsCompleted: player.lapsCompleted,
            bestLapTime: player.fastestLapTime > 0 ? player.fastestLapTime : undefined,
            lastLapTime: data.session.lastLapTime > 0 ? data.session.lastLapTime : undefined,
            trackName: data.session.trackVariation 
              ? `${data.session.trackLocation} ${data.session.trackVariation}` 
              : data.session.trackLocation,
            carName: data.session.carName,
            carClass: data.session.carClassName,
            dnf: false,
            sessionType: previousSessionType, // The session that just ended
            rainDensity: data.session.rainDensity ?? 0,
            allParticipants: data.participants.map(p => ({
              name: p.name,
              position: p.racePosition,
              lapsCompleted: p.lapsCompleted,
              bestLapTime: p.fastestLapTime,
              isPlayer: p.isPlayer,
            })),
          }
          
          mainWindow?.webContents.send('telemetry:raceComplete', sessionCompleteData)
          feedRaceCompleteToCommentary(sessionCompleteData)
          phaseState.lastTransitionEmitted = transitionKey
          console.log(`[SessionPhase] Emitted telemetry:raceComplete for ${previousSessionType} (transition)`)
        }
      }
    }
    
    // Reset state for new session
    phaseState.sessionType = currentSessionType
    phaseState.sessionStartTime = now
    phaseState.sessionRunningTime = 0
    phaseState.leaderHasFinishedRace = false
    phaseState.raceCompleteEmitted = false // Always reset for new session
    phaseState.raceActuallyStarted = false // Crew Chief: reset - race hasn't started yet
    phaseState.leaderLapsCompleted = 0
    phaseState.sessionLaps = data.session.lapsInEvent
    phaseState.sessionTimeRemaining = data.session.eventTimeRemaining
    phaseState.extraLapsAfterTime = data.session.sessionAdditionalLaps
    
    // Clear phase log for new session (keep last few entries for debugging)
    phaseState.phaseChangeLog = phaseState.phaseChangeLog.slice(-5)
  }
  
  // Update running time
  if (phaseState.sessionStartTime > 0) {
    phaseState.sessionRunningTime = (now - phaseState.sessionStartTime) / 1000
  }
  phaseState.sessionTimeRemaining = data.session.eventTimeRemaining
  
  // Check if leader has finished (for Race sessions)
  if (currentSessionType === 'Race' && !phaseState.leaderHasFinishedRace) {
    phaseState.leaderHasFinishedRace = checkLeaderFinished(data, phaseState)
  }
  
  // ============ CREW CHIEF: TRACK IF RACE ACTUALLY STARTED ============
  // Only set raceActuallyStarted when we see RACING state in a Race session
  // This prevents false finish detection during session transitions (Quali->Race)
  if (currentSessionType === 'Race' && !phaseState.raceActuallyStarted) {
    if (data.session.raceState === RaceState.RACESTATE_RACING) {
      console.log('[SessionPhase] Crew Chief: Race actually started - saw RACING state')
      phaseState.raceActuallyStarted = true
    }
  }
  
  // ============ IMMEDIATE RACE FINISH DETECTION ============
  // Fire immediately when we see RETIRED/FINISHED state - don't wait for phase change
  // This is more aggressive to catch quick retirements
  // IMPORTANT: Only fire if race ACTUALLY STARTED (Crew Chief approach)
  if (currentSessionType === 'Race' && phaseState.raceActuallyStarted && !phaseState.raceCompleteEmitted) {
    const raceState = data.session.raceState
    // Detect finish when race was actually running
    if (
      raceState === RaceState.RACESTATE_FINISHED ||
      raceState === RaceState.RACESTATE_RETIRED ||
      raceState === RaceState.RACESTATE_DNF ||
      raceState === RaceState.RACESTATE_DISQUALIFIED
    ) {
      const player = data.participants.find(p => p.isPlayer)
      if (player) {
        console.log(`[SessionPhase] ========================================`)
        console.log(`[SessionPhase] IMMEDIATE RACE FINISH DETECTED!`)
        console.log(`[SessionPhase] RaceState: ${data.session.raceStateName}`)
        console.log(`[SessionPhase] Player: ${player.name}`)
        console.log(`[SessionPhase] Position: P${player.racePosition}`)
        console.log(`[SessionPhase] Laps: ${player.lapsCompleted}`)
        console.log(`[SessionPhase] ========================================`)
        
        const raceCompleteData = {
          playerPosition: player.racePosition,
          playerName: player.name,
          totalParticipants: data.session.numParticipants,
          lapsCompleted: player.lapsCompleted,
          bestLapTime: data.session.bestLapTime,
          lastLapTime: data.session.lastLapTime,
          trackName: data.session.trackVariation 
            ? `${data.session.trackLocation} ${data.session.trackVariation}` 
            : data.session.trackLocation,
          carName: data.session.carName,
          carClass: data.session.carClassName,
          dnf: raceState === RaceState.RACESTATE_RETIRED || 
               raceState === RaceState.RACESTATE_DNF,
          sessionType: 'Race',
          rainDensity: data.session.rainDensity ?? 0,
          allParticipants: data.participants.map(p => ({
            name: p.name,
            position: p.racePosition,
            lapsCompleted: p.lapsCompleted,
            bestLapTime: p.fastestLapTime,
            isPlayer: p.isPlayer,
          })),
        }
        
        mainWindow?.webContents.send('telemetry:raceComplete', raceCompleteData)
        feedRaceCompleteToCommentary(raceCompleteData)
        phaseState.raceCompleteEmitted = true
        console.log(`[SessionPhase] Emitted telemetry:raceComplete event (immediate detection)`)
      }
    }
  }
  
  // Map to session phase using Crew Chief logic
  const newPhase = mapToSessionPhase(data, phaseState)
  
  // Phase changed - log it
  if (newPhase !== phaseState.currentPhase) {
    const oldPhaseName = getSessionPhaseName(phaseState.currentPhase)
    const newPhaseName = getSessionPhaseName(newPhase)
    
    console.log(`[SessionPhase] PHASE CHANGE: ${oldPhaseName} -> ${newPhaseName}`)
    console.log(`[SessionPhase]   RaceState: ${data.session.raceStateName}`)
    console.log(`[SessionPhase]   SessionState: ${data.session.sessionStateName}`)
    console.log(`[SessionPhase]   GameState: ${data.session.gameStateName}`)
    console.log(`[SessionPhase]   LeaderFinished: ${phaseState.leaderHasFinishedRace}`)
    console.log(`[SessionPhase]   SessionType: ${currentSessionType}`)
    
    // Log phase change
    phaseState.phaseChangeLog.push({
      timestamp: now,
      from: phaseState.currentPhase,
      to: newPhase,
      reason: `RaceState=${data.session.raceStateName}, LeaderFinished=${phaseState.leaderHasFinishedRace}`,
    })
    
    // Keep log trimmed
    if (phaseState.phaseChangeLog.length > 20) {
      phaseState.phaseChangeLog = phaseState.phaseChangeLog.slice(-20)
    }
    
    phaseState.previousPhase = phaseState.currentPhase
    phaseState.currentPhase = newPhase
    phaseState.lastPhaseChangeTime = now
  }
  
  // ============ RACE COMPLETE DETECTION ============
  // Emit race complete when we transition TO Finished phase
  // IMPORTANT: For Race sessions, only emit if the race actually started (Crew Chief approach)
  // This prevents false completion during Quali->Race transition where raceState might still be "Finished"
  const shouldEmitCompletion = newPhase === SessionPhase.FINISHED && 
                               !phaseState.raceCompleteEmitted &&
                               (currentSessionType !== 'Race' || phaseState.raceActuallyStarted)
  
  if (shouldEmitCompletion) {
    const player = data.participants.find(p => p.isPlayer)
    
    if (player) {
      console.log(`[SessionPhase] ========================================`)
      console.log(`[SessionPhase] RACE COMPLETE DETECTED!`)
      console.log(`[SessionPhase] Player: ${player.name}`)
      console.log(`[SessionPhase] Position: P${player.racePosition}`)
      console.log(`[SessionPhase] Laps: ${player.lapsCompleted}`)
      console.log(`[SessionPhase] Session: ${currentSessionType}`)
      console.log(`[SessionPhase] Track: ${data.session.trackLocation} ${data.session.trackVariation || ''}`)
      console.log(`[SessionPhase] RaceActuallyStarted: ${phaseState.raceActuallyStarted}`)
      console.log(`[SessionPhase] ========================================`)
      
      const raceCompleteData = {
        playerPosition: player.racePosition,
        playerName: player.name,
        totalParticipants: data.session.numParticipants,
        lapsCompleted: player.lapsCompleted,
        bestLapTime: data.session.bestLapTime,
        lastLapTime: data.session.lastLapTime,
        trackName: data.session.trackVariation 
          ? `${data.session.trackLocation} ${data.session.trackVariation}` 
          : data.session.trackLocation,
        carName: data.session.carName,
        carClass: data.session.carClassName,
        dnf: data.session.raceState === RaceState.RACESTATE_RETIRED || 
             data.session.raceState === RaceState.RACESTATE_DNF,
        sessionType: data.session.sessionStateName,
        rainDensity: data.session.rainDensity ?? 0,
        allParticipants: data.participants.map(p => ({
          name: p.name,
          position: p.racePosition,
          lapsCompleted: p.lapsCompleted,
          bestLapTime: p.fastestLapTime,
          isPlayer: p.isPlayer,
        })),
      }
      
      mainWindow?.webContents.send('telemetry:raceComplete', raceCompleteData)
      feedRaceCompleteToCommentary(raceCompleteData)
      
      phaseState.raceCompleteEmitted = true
      console.log(`[SessionPhase] Emitted telemetry:raceComplete event to frontend`)
    } else {
      console.log(`[SessionPhase] WARNING: Finished phase but no player found!`)
    }
  } else if (newPhase === SessionPhase.FINISHED && currentSessionType === 'Race' && !phaseState.raceActuallyStarted) {
    // Log that we're ignoring this false finish
    console.log(`[SessionPhase] Ignoring false race completion - race hasn't started yet (raceActuallyStarted: false)`)
  }
}

// Legacy alias for the old function name
function checkRaceCompletion(data: TelemetryData, mainWindow: BrowserWindow | null): void {
  updateSessionPhase(data, mainWindow)
}

// ============================================================================
// IPC HANDLERS
// ============================================================================

export function registerSharedMemoryHandlers(mainWindow: BrowserWindow | null): void {
  // Start telemetry
  ipcMain.handle('telemetry:start', async (_event, options?: { pollRate?: number }) => {
    if (options?.pollRate) {
      state.pollRate = Math.max(1, Math.min(120, options.pollRate)) // Clamp 1-120 Hz
    }
    startPolling(mainWindow)
    return { success: true, type: 'shared-memory', pollRate: state.pollRate }
  })
  
  // Stop telemetry
  ipcMain.handle('telemetry:stop', async () => {
    stopPolling()
    return { success: true }
  })
  
  // Get status
  ipcMain.handle('telemetry:status', async () => {
    return {
      isListening: state.isRunning,
      type: 'shared-memory',
      pollRate: state.pollRate,
      isConnected: state.sharedMemory.isConnected(),
      lastError: state.sharedMemory.getLastError(),
    }
  })
  
  // Set poll rate
  ipcMain.handle('telemetry:setPollRate', async (_event, pollRate: number) => {
    state.pollRate = Math.max(1, Math.min(120, pollRate))
    
    // Restart polling if running
    if (state.isRunning) {
      stopPolling()
      startPolling(mainWindow)
    }
    
    return { success: true, pollRate: state.pollRate }
  })
  
  // Legacy UDP port handler (for compatibility - does nothing with shared memory)
  ipcMain.handle('telemetry:setPort', async (_event, _port: number) => {
    console.log('[Telemetry] Port setting ignored - using shared memory')
    return { success: true, type: 'shared-memory' }
  })
  
  // Get current data
  ipcMain.handle('telemetry:getData', async () => {
    if (state.lastData) {
      return {
        session: convertSessionInfo(state.lastData),
        participants: convertParticipants(state.lastData),
        playerIndex: state.lastData.playerIndex,
      }
    }
    return null
  })
  
  // Get session phase debug info (for Donnington debugging)
  ipcMain.handle('telemetry:getSessionPhaseDebug', async () => {
    const phaseState = state.sessionPhase
    return {
      currentPhase: getSessionPhaseName(phaseState.currentPhase),
      previousPhase: getSessionPhaseName(phaseState.previousPhase),
      leaderHasFinishedRace: phaseState.leaderHasFinishedRace,
      sessionType: phaseState.sessionType,
      sessionRunningTime: phaseState.sessionRunningTime,
      sessionTimeRemaining: phaseState.sessionTimeRemaining,
      raceCompleteEmitted: phaseState.raceCompleteEmitted,
      leaderLapsCompleted: phaseState.leaderLapsCompleted,
      sessionLaps: phaseState.sessionLaps,
      lastPhaseChangeTime: phaseState.lastPhaseChangeTime,
      phaseChangeLog: phaseState.phaseChangeLog.map(entry => ({
        timestamp: entry.timestamp,
        from: getSessionPhaseName(entry.from),
        to: getSessionPhaseName(entry.to),
        reason: entry.reason,
        timeAgo: Math.round((Date.now() - entry.timestamp) / 1000) + 's ago',
      })),
    }
  })
  
  // Force emit race complete (for debugging/recovery when detection fails)
  ipcMain.handle('telemetry:forceRaceComplete', async () => {
    if (!state.lastData) {
      return { success: false, error: 'No telemetry data available' }
    }
    
    const player = state.lastData.participants.find(p => p.isPlayer)
    if (!player) {
      return { success: false, error: 'No player found in telemetry' }
    }
    
    console.log(`[SessionPhase] FORCE RACE COMPLETE triggered by user`)
    console.log(`[SessionPhase] Current phase: ${getSessionPhaseName(state.sessionPhase.currentPhase)}`)
    
    const data = state.lastData
    const raceCompleteData = {
      playerPosition: player.racePosition,
      playerName: player.name,
      totalParticipants: data.session.numParticipants,
      lapsCompleted: player.lapsCompleted,
      bestLapTime: data.session.bestLapTime,
      lastLapTime: data.session.lastLapTime,
      trackName: data.session.trackVariation 
        ? `${data.session.trackLocation} ${data.session.trackVariation}` 
        : data.session.trackLocation,
      carName: data.session.carName,
      carClass: data.session.carClassName,
      dnf: data.session.raceState === RaceState.RACESTATE_RETIRED || 
           data.session.raceState === RaceState.RACESTATE_DNF,
      sessionType: data.session.sessionStateName,
      rainDensity: data.session.rainDensity ?? 0,
      allParticipants: data.participants.map(p => ({
        name: p.name,
        position: p.racePosition,
        lapsCompleted: p.lapsCompleted,
        bestLapTime: p.fastestLapTime,
        isPlayer: p.isPlayer,
      })),
    }
    
    // Get mainWindow from somewhere (we need to pass it through)
    // For now, just return the data so frontend can handle it
    state.sessionPhase.raceCompleteEmitted = true
    
    return { 
      success: true, 
      data: raceCompleteData,
      message: 'Force complete triggered - data returned for frontend handling'
    }
  })
  
  // Reset session phase state (for debugging)
  ipcMain.handle('telemetry:resetSessionPhase', async () => {
    console.log(`[SessionPhase] RESET triggered by user`)
    state.sessionPhase = createInitialSessionPhaseState()
    return { success: true }
  })
}

// Export for use in main.ts
export { startPolling as startTelemetry, stopPolling as stopTelemetry }

