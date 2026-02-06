/**
 * Debug Logger Service
 * 
 * Writes logs directly to files for persistence.
 * Two log files: telemetry.log and commentary.log
 */

import { BrowserWindow, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

export interface LogEntry {
  timestamp: number
  timeStr: string
  type: string
  message: string
  details?: Record<string, any>
  level: 'info' | 'event' | 'warning' | 'decision' | 'error'
}

// Store reference to main window for IPC
let mainWindow: BrowserWindow | null = null

// Log file paths
let logDir: string = ''
let telemetryLogPath: string = ''
let commentaryLogPath: string = ''
let logsInitialized = false

// Initialize log files
function initLogFiles(): void {
  if (logsInitialized) return
  
  try {
    logDir = path.join(app.getPath('userData'), 'logs')
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    
    telemetryLogPath = path.join(logDir, 'telemetry.log')
    commentaryLogPath = path.join(logDir, 'commentary.log')
    
    // Clear old logs on startup (fresh session)
    fs.writeFileSync(telemetryLogPath, '')
    fs.writeFileSync(commentaryLogPath, '')
    
    logsInitialized = true
    console.log('[DebugLogger] Log files initialized at:', logDir)
  } catch (e) {
    console.error('[DebugLogger] Failed to initialize log files:', e)
  }
}

export function setLoggerWindow(window: BrowserWindow | null): void {
  mainWindow = window
  initLogFiles()
}

// Read logs from file
export function getLogsFromFile(): { telemetry: LogEntry[], commentary: LogEntry[] } {
  initLogFiles()
  
  const result = { telemetry: [] as LogEntry[], commentary: [] as LogEntry[] }
  
  try {
    if (fs.existsSync(telemetryLogPath)) {
      const content = fs.readFileSync(telemetryLogPath, 'utf-8')
      const lines = content.split('\n').filter(line => line.trim())
      result.telemetry = lines.map(line => {
        try { return JSON.parse(line) } catch { return null }
      }).filter(Boolean) as LogEntry[]
    }
    
    if (fs.existsSync(commentaryLogPath)) {
      const content = fs.readFileSync(commentaryLogPath, 'utf-8')
      const lines = content.split('\n').filter(line => line.trim())
      result.commentary = lines.map(line => {
        try { return JSON.parse(line) } catch { return null }
      }).filter(Boolean) as LogEntry[]
    }
  } catch (e) {
    console.error('[DebugLogger] Failed to read log files:', e)
  }
  
  return result
}

// Clear log files
export function clearLogFiles(): void {
  try {
    if (telemetryLogPath) fs.writeFileSync(telemetryLogPath, '')
    if (commentaryLogPath) fs.writeFileSync(commentaryLogPath, '')
  } catch (e) {
    console.error('[DebugLogger] Failed to clear log files:', e)
  }
}

// Append to log file
function appendToLogFile(filePath: string, entry: LogEntry): void {
  try {
    fs.appendFileSync(filePath, JSON.stringify(entry) + '\n')
  } catch (e) {
    // Silently fail - don't spam console
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  })
}

function createLogEntry(
  type: string, 
  message: string, 
  level: LogEntry['level'] = 'info',
  details?: Record<string, any>
): LogEntry {
  const now = new Date()
  return {
    timestamp: now.getTime(),
    timeStr: formatTime(now),
    type,
    message,
    level,
    details
  }
}

/**
 * Log telemetry events (session state, race finish, etc.)
 */
export function logTelemetryEvent(
  type: string, 
  message: string, 
  details?: Record<string, any>,
  level: LogEntry['level'] = 'event'
): void {
  initLogFiles()
  const entry = createLogEntry(type, message, level, details)
  
  // Also log to console for debugging
  console.log(`[TelemetryLog] ${entry.timeStr} ${type}: ${message}`, details || '')
  
  // Write to file (persistent)
  appendToLogFile(telemetryLogPath, entry)
  
  // Send to renderer (live updates)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('logs:telemetry', entry)
  }
}

/**
 * Log commentary decisions (theme selection, context usage, etc.)
 */
export function logCommentaryDecision(
  type: string, 
  message: string, 
  details?: Record<string, any>,
  level: LogEntry['level'] = 'decision'
): void {
  initLogFiles()
  const entry = createLogEntry(type, message, level, details)
  
  // Also log to console for debugging
  console.log(`[CommentaryLog] ${entry.timeStr} ${type}: ${message}`, details || '')
  
  // Write to file (persistent)
  appendToLogFile(commentaryLogPath, entry)
  
  // Send to renderer (live updates)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('logs:commentary', entry)
  }
}

// Convenience functions for specific telemetry events
export const telemetryLog = {
  sessionChange: (from: string, to: string) => 
    logTelemetryEvent('SESSION_CHANGE', `${from} -> ${to}`, { from, to }),
  
  phaseTransition: (from: string, to: string) => 
    logTelemetryEvent('PHASE_TRANSITION', `${from} -> ${to}`, { from, to }),
  
  raceFinished: (position: number, state: string) => 
    logTelemetryEvent('RACE_FINISHED', `Position ${position}, State: ${state}`, { position, state }),
  
  qualiComplete: (position: number) => 
    logTelemetryEvent('QUALI_COMPLETE', `Final Position: P${position}`, { position }),
  
  practiceComplete: () => 
    logTelemetryEvent('PRACTICE_COMPLETE', 'Practice session ended'),
  
  telemetryStart: (source: string) => 
    logTelemetryEvent('TELEMETRY_START', `Receiving ${source} data`, { source }, 'info'),
  
  telemetryStop: (reason: string) => 
    logTelemetryEvent('TELEMETRY_STOP', reason, { reason }, 'warning'),
  
  eventDetected: (eventType: string, details?: Record<string, any>) => 
    logTelemetryEvent('EVENT_DETECTED', eventType, details),
  
  stateChange: (field: string, from: any, to: any) => 
    logTelemetryEvent('STATE_CHANGE', `${field}: ${from} -> ${to}`, { field, from, to }, 'info'),
  
  // === PLAYER ACTIVITY STATE MACHINE LOGGING ===
  playerStateChange: (from: string, to: string, telemetry: { speed: number; pitMode?: number; currentLap: number }) => 
    logTelemetryEvent('PLAYER_STATE', `${from} -> ${to}`, { from, to, ...telemetry }, 'event'),
  
  eventValidation: (eventType: string, allowed: boolean, reason: string, redirectTo?: string) => 
    logTelemetryEvent('EVENT_VALIDATION', 
      allowed ? `✓ ${eventType} allowed` : `✗ ${eventType} blocked → ${redirectTo || 'dropped'}`,
      { eventType, allowed, reason, redirectTo },
      allowed ? 'info' : 'decision'
    ),
  
  // === ACTION DETECTION TELEMETRY ===
  actionCheck: (eventType: string, triggered: boolean, reason: string, details?: Record<string, any>) => 
    logTelemetryEvent('ACTION_CHECK', 
      triggered ? `✓ ${eventType} TRIGGERED` : `○ ${eventType} not triggered: ${reason}`,
      { eventType, triggered, reason, ...details },
      triggered ? 'event' : 'info'
    ),
  
  gapUpdate: (gapAhead: number | undefined, gapBehind: number | undefined, position: number) => 
    logTelemetryEvent('GAP_UPDATE', 
      `P${position} | Ahead: ${gapAhead?.toFixed(1) || '?'}s | Behind: ${gapBehind?.toFixed(1) || '?'}s`,
      { gapAhead, gapBehind, position },
      'info'
    ),
  
  error: (message: string, details?: Record<string, any>) => 
    logTelemetryEvent('ERROR', message, details, 'error')
}

// Convenience functions for specific commentary decisions
export const commentaryLog = {
  themeSelected: (theme: string, weight: number, history: string[]) => 
    logCommentaryDecision('THEME_SELECTED', `${theme} (weight: ${weight})`, { theme, weight, history }),
  
  strandSelected: (strand: string, history: string[]) => 
    logCommentaryDecision('STRAND_SELECTED', `Strand: ${strand}`, { strand, history }),
  
  topicChosen: (topic: string, eventType: string) => 
    logCommentaryDecision('TOPIC_CHOSEN', `${topic} for event ${eventType}`, { topic, eventType }),
  
  energyLevel: (level: string, reason: string) => 
    logCommentaryDecision('ENERGY_LEVEL', `${level} (${reason})`, { level, reason }),
  
  contextUsed: (contextFields: string[], details?: Record<string, any>) => 
    logCommentaryDecision('CONTEXT_USED', contextFields.join(', '), { fields: contextFields, ...details }),
  
  historyRef: (description: string, count?: number) => 
    logCommentaryDecision('HISTORY_REF', description, { count }),
  
  eventQueued: (eventType: string, priority: string) => 
    logCommentaryDecision('EVENT_QUEUED', `${eventType} (${priority} priority)`, { eventType, priority }, 'event'),
  
  scriptGenerated: (speaker: string, length: number) => 
    logCommentaryDecision('SCRIPT_GENERATED', `${speaker}: ${length} chars`, { speaker, length }, 'info'),
  
  promptBuilt: (theme: string, hasRivalData: boolean, hasCareerData: boolean) => 
    logCommentaryDecision('PROMPT_BUILT', `Theme: ${theme}`, { theme, hasRivalData, hasCareerData }),
  
  antiRepetition: (avoided: string) => 
    logCommentaryDecision('ANTI_REPETITION', `Avoided: ${avoided}`, { avoided }, 'info'),
  
  error: (message: string, details?: Record<string, any>) => 
    logCommentaryDecision('ERROR', message, details, 'error')
}


