/**
 * Commentary Scheduler
 * 
 * Manages continuous TV broadcast-style commentary by monitoring silence
 * and triggering content from the pre-generated pool at appropriate intervals.
 */

import { 
  getNextContent, 
  getPoolStats, 
  getDriverContent,
  getSectorContent,
  getChampionshipContent,
  type GeneratedLine,
  type VoiceRole
} from './contentPool'

// ============================================================================
// TYPES
// ============================================================================

export type RacePhase = 'pre_race' | 'early' | 'mid' | 'late' | 'final'

export interface SchedulerState {
  isActive: boolean
  lastAudioEndTime: number
  currentPhase: RacePhase
  currentLap: number
  totalLaps: number
  
  // Audio tracking
  isAudioPlaying: boolean
  pendingContent: GeneratedLine | null
  
  // Silence thresholds (in ms)
  silenceThresholds: Record<RacePhase, { min: number; max: number }>
  
  // Statistics
  linesSpoken: number
  eventLineCount: number
  colorLineCount: number
}

export interface SchedulerConfig {
  // Whether scheduler is enabled
  enabled: boolean
  
  // Silence thresholds by phase (ms)
  earlyRaceSilence: { min: number; max: number }
  midRaceSilence: { min: number; max: number }
  lateRaceSilence: { min: number; max: number }
  finalLapsSilence: { min: number; max: number }
  
  // Content preferences
  preferColorInMidRace: boolean
  includeChampionshipContext: boolean
}

// ============================================================================
// STATE
// ============================================================================

const DEFAULT_CONFIG: SchedulerConfig = {
  enabled: true,
  earlyRaceSilence: { min: 8000, max: 12000 },
  midRaceSilence: { min: 15000, max: 25000 },
  lateRaceSilence: { min: 10000, max: 15000 },
  finalLapsSilence: { min: 5000, max: 10000 },
  preferColorInMidRace: true,
  includeChampionshipContext: true
}

let state: SchedulerState = {
  isActive: false,
  lastAudioEndTime: Date.now(),
  currentPhase: 'pre_race',
  currentLap: 0,
  totalLaps: 0,
  isAudioPlaying: false,
  pendingContent: null,
  silenceThresholds: {
    pre_race: { min: 5000, max: 10000 },
    early: { min: 8000, max: 12000 },
    mid: { min: 15000, max: 25000 },
    late: { min: 10000, max: 15000 },
    final: { min: 5000, max: 10000 }
  },
  linesSpoken: 0,
  eventLineCount: 0,
  colorLineCount: 0
}

let config = { ...DEFAULT_CONFIG }
let schedulerInterval: NodeJS.Timeout | null = null
let contentCallback: ((content: GeneratedLine) => void) | null = null

// ============================================================================
// SCHEDULER CONTROL
// ============================================================================

/**
 * Start the commentary scheduler
 */
export function startScheduler(
  totalLaps: number,
  onContentReady: (content: GeneratedLine) => void
): void {
  console.log(`[Scheduler] Starting for ${totalLaps} lap race`)
  
  state = {
    ...state,
    isActive: true,
    lastAudioEndTime: Date.now(),
    currentPhase: 'pre_race',
    currentLap: 0,
    totalLaps,
    isAudioPlaying: false,
    pendingContent: null,
    linesSpoken: 0,
    eventLineCount: 0,
    colorLineCount: 0
  }
  
  contentCallback = onContentReady
  
  // Start the scheduler loop
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
  }
  
  schedulerInterval = setInterval(runSchedulerTick, 3000) // Check every 3 seconds
  console.log('[Scheduler] Started')
}

/**
 * Stop the commentary scheduler
 */
export function stopScheduler(): void {
  console.log('[Scheduler] Stopping')
  
  state.isActive = false
  
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
  }
  
  contentCallback = null
}

/**
 * Update scheduler config
 */
export function setSchedulerConfig(newConfig: Partial<SchedulerConfig>): void {
  config = { ...config, ...newConfig }
  
  // Update silence thresholds from config
  state.silenceThresholds = {
    pre_race: { min: 5000, max: 10000 },
    early: config.earlyRaceSilence,
    mid: config.midRaceSilence,
    late: config.lateRaceSilence,
    final: config.finalLapsSilence
  }
}

// ============================================================================
// RACE STATE UPDATES
// ============================================================================

/**
 * Update current lap
 */
export function updateLap(currentLap: number): void {
  state.currentLap = currentLap
  state.currentPhase = detectRacePhase(currentLap, state.totalLaps)
}

/**
 * Notify scheduler that audio started playing
 */
export function onAudioStarted(): void {
  state.isAudioPlaying = true
}

/**
 * Notify scheduler that audio finished playing
 */
export function onAudioEnded(): void {
  state.isAudioPlaying = false
  state.lastAudioEndTime = Date.now()
}

/**
 * Notify scheduler that an event commentary was triggered
 * (Resets the silence timer since we have reactive content)
 */
export function onEventCommentary(): void {
  state.lastAudioEndTime = Date.now()
  state.eventLineCount++
}

// ============================================================================
// PHASE DETECTION
// ============================================================================

/**
 * Detect current race phase based on lap progress
 */
export function detectRacePhase(currentLap: number, totalLaps: number): RacePhase {
  if (currentLap === 0) return 'pre_race'
  
  const progress = currentLap / totalLaps
  
  if (progress < 0.1) return 'early'
  if (progress < 0.75) return 'mid'
  if (progress < 0.9) return 'late'
  return 'final'
}

/**
 * Get the current silence threshold range for this phase
 */
function getCurrentSilenceThreshold(): { min: number; max: number } {
  return state.silenceThresholds[state.currentPhase]
}

/**
 * Get a randomized threshold within the current range
 */
function getRandomizedThreshold(): number {
  const { min, max } = getCurrentSilenceThreshold()
  return min + Math.random() * (max - min)
}

// ============================================================================
// SCHEDULER TICK
// ============================================================================

/**
 * Main scheduler tick - runs every 3 seconds
 */
function runSchedulerTick(): void {
  if (!state.isActive || !config.enabled) return
  
  // Don't trigger if audio is playing
  if (state.isAudioPlaying) return
  
  // Calculate silence duration
  const silenceDuration = Date.now() - state.lastAudioEndTime
  const threshold = getRandomizedThreshold()
  
  // Check if we've been silent long enough
  if (silenceDuration < threshold) return
  
  // Check if we have content available
  const poolStats = getPoolStats()
  if (!poolStats || poolStats.remaining === 0) {
    console.log('[Scheduler] Content pool exhausted')
    return
  }
  
  // Select appropriate content for current phase
  const content = selectContentForPhase()
  
  if (content && contentCallback) {
    console.log(`[Scheduler] Triggering content: ${content.category} (phase: ${state.currentPhase}, silence: ${silenceDuration}ms)`)
    state.colorLineCount++
    state.linesSpoken++
    contentCallback(content)
  }
}

/**
 * Select content appropriate for the current race phase
 */
function selectContentForPhase(): GeneratedLine | null {
  const phase = state.currentPhase
  
  // Phase-specific content selection
  switch (phase) {
    case 'pre_race':
    case 'early':
      // Early race: focus on track and driver introductions
      return getNextContent(undefined, 'early') || 
             getNextContent('track_atmosphere') ||
             getNextContent('driver_background') ||
             getNextContent()
             
    case 'mid':
      // Mid race: strategy, gaps, championship implications
      if (config.preferColorInMidRace) {
        return getNextContent('strategy_talk', 'mid') ||
               getNextContent('championship_context') ||
               getNextContent('gap_analysis') ||
               getNextContent()
      }
      return getNextContent(undefined, 'mid') || getNextContent()
      
    case 'late':
      // Late race: championship context, position battles
      return getNextContent('championship_context', 'late') ||
             getNextContent('position_battle') ||
             getNextContent(undefined, 'late') ||
             getNextContent()
             
    case 'final':
      // Final laps: high energy, any available content
      return getNextContent(undefined, 'final') ||
             getNextContent('championship_context') ||
             getNextContent()
             
    default:
      return getNextContent()
  }
}

// ============================================================================
// STATUS & STATS
// ============================================================================

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): {
  isActive: boolean
  currentPhase: RacePhase
  currentLap: number
  totalLaps: number
  isAudioPlaying: boolean
  silenceDuration: number
  currentThreshold: { min: number; max: number }
  linesSpoken: number
  eventLines: number
  colorLines: number
} {
  return {
    isActive: state.isActive,
    currentPhase: state.currentPhase,
    currentLap: state.currentLap,
    totalLaps: state.totalLaps,
    isAudioPlaying: state.isAudioPlaying,
    silenceDuration: Date.now() - state.lastAudioEndTime,
    currentThreshold: getCurrentSilenceThreshold(),
    linesSpoken: state.linesSpoken,
    eventLines: state.eventLineCount,
    colorLines: state.colorLineCount
  }
}

/**
 * Get lap phase description for UI
 */
export function getPhaseDescription(phase: RacePhase): string {
  switch (phase) {
    case 'pre_race': return 'Pre-Race'
    case 'early': return 'Opening Laps'
    case 'mid': return 'Mid-Race'
    case 'late': return 'Closing Stages'
    case 'final': return 'Final Laps'
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  state as schedulerState,
  config as schedulerConfig
}

