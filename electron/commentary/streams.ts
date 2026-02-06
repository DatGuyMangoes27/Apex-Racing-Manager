/**
 * Commentary Streams
 * 
 * Multi-stream architecture for parallel commentary processing.
 * Each stream handles different event types with appropriate priorities and expiry rules.
 */

import { CommentaryEvent, CommentaryEventType, EventContext } from './engine'

/**
 * Pre-generated commentary item (script + audio ready to play)
 */
export interface PreGeneratedItem {
  script: string
  audio: Buffer
  context: EventContext
  generatedAt: number
}

/**
 * Base interface for all commentary streams
 */
export interface CommentaryStream {
  name: string
  maxAge: number  // milliseconds, 0 = no expiry
  canPreGenerate: boolean
  
  addEvent(event: CommentaryEvent): void
  getNextEvent(): CommentaryEvent | null
  hasEvents(): boolean
  getQueueLength(): number
  expireStaleEvents(): number  // Returns count of expired events
  clear(): void
}

/**
 * Stream for live action events that need immediate, fresh data
 * Events: Overtakes, position changes, battles, race start
 */
export class LiveActionStream implements CommentaryStream {
  name = 'LiveAction'
  maxAge = 90000  // 90 seconds - longer commentary (40-80 words) needs more time per exchange
  canPreGenerate = false
  
  private queue: CommentaryEvent[] = []
  
  // Events that belong to this stream
  static readonly EVENT_TYPES: CommentaryEventType[] = [
    'RACE_START',
    'OVERTAKE',
    'POSITION_LOST',
    'BATTLE_FORMING',
    'GREAT_START',
    'POOR_START',
    'UNDER_PRESSURE',
    'RACE_WIN',
    'PODIUM_FINISH',
    'RACE_FINISH',
    'FASTEST_LAP',
    'PERSONAL_BEST',
    'SECTOR_PURPLE',
    'FIELD_BATTLE',
    // === NEW: Telemetry-driven high-priority events ===
    'CONTACT_DETECTED',        // Immediate reaction needed
    'PLAYER_SPINNING',         // Immediate reaction needed
    'PLAYER_OFFTRACK',         // Quick reaction
    'FCY_DEPLOYED',            // Important race event
    'FCY_ENDING',              // Important race event
    'FLAG_FINAL_LAP',          // Important flag
    // === Session phase high-priority events ===
    'SESSION_CHECKERED',       // Time's up - important!
    'SESSION_BEST_SET',        // Player just got P1 in session!
    'SESSION_BEST_STOLEN',     // Someone stole P1 from player!
    'QUALI_P1_SECURED',        // Pole position confirmed!
    'QUALI_FRONT_ROW_SECURED', // Front row confirmed!
    'QUALI_COMPLETE',          // Qualifying finished
    'PRACTICE_COMPLETE',       // Practice finished
  ]
  
  static isLiveActionEvent(type: CommentaryEventType): boolean {
    return LiveActionStream.EVENT_TYPES.includes(type)
  }
  
  addEvent(event: CommentaryEvent): void {
    // Don't add duplicates of the same event type
    const hasSameType = this.queue.some(e => e.type === event.type)
    if (hasSameType) {
      console.log(`[LiveAction] Skipping duplicate ${event.type}`)
      return
    }
    
    this.queue.push(event)
    console.log(`[LiveAction] Queued: ${event.type} (queue: ${this.queue.length})`)
  }
  
  getNextEvent(): CommentaryEvent | null {
    // Expire stale events first
    this.expireStaleEvents()
    
    if (this.queue.length === 0) return null
    
    // Sort by priority (high first) then by timestamp (oldest first)
    this.queue.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return a.timestamp - b.timestamp
    })
    
    return this.queue.shift() || null
  }
  
  hasEvents(): boolean {
    this.expireStaleEvents()
    return this.queue.length > 0
  }
  
  getQueueLength(): number {
    return this.queue.length
  }
  
  expireStaleEvents(): number {
    const now = Date.now()
    const before = this.queue.length
    
    this.queue = this.queue.filter(event => {
      const age = now - event.timestamp
      if (age > this.maxAge) {
        console.log(`[LiveAction] Expired stale event: ${event.type} (age: ${age}ms)`)
        return false
      }
      return true
    })
    
    return before - this.queue.length
  }
  
  clear(): void {
    this.queue = []
  }
}

/**
 * Stream for race status updates that can tolerate slightly older data
 * Events: Lap completion, gap updates, pit stops, race milestones
 */
export class RaceStatusStream implements CommentaryStream {
  name = 'RaceStatus'
  maxAge = 180000  // 180 seconds (3 min) - with longer commentary, need more processing time
  canPreGenerate = false
  
  private queue: CommentaryEvent[] = []
  
  // Events that belong to this stream
  static readonly EVENT_TYPES: CommentaryEventType[] = [
    'LAP_COMPLETE',
    'GAP_CLOSING',
    'GAP_OPENING',
    'PIT_ENTRY',
    'PIT_EXIT',
    'HALFWAY_POINT',
    'FINAL_LAPS',
    'MOMENTUM_BUILDING',
    'DEFENSIVE_DRIVING',
    'CONSISTENCY_PRAISE',
    'RECOVERY_DRIVE',
    'PRESSURE_BUILDING',
    'GAP_CALCULATION',
    'LEADER_UPDATE',
    'MIDFIELD_ACTION',
    'SESSION_START',
    'SESSION_END',
    'PRACTICE_IMPROVEMENT',
    'QUALIFYING_ATTEMPT',
    'POLE_POSITION',
    'FRONT_ROW',
    'OTHER_DRIVER_HOTLAP',
    'TRACK_EVOLUTION',
    'SECTOR_COMPARISON',
    'PIT_ACTIVITY',
    // === NEW: Telemetry-driven status events ===
    'RIVAL_PIT_ENTRY',         // Rival strategy updates
    'RIVAL_PIT_EXIT',          // Rival strategy updates
    'RIVAL_FASTEST_LAP',       // Rival lap time updates
    'RIVAL_RETIRED',           // Field changes
    'DAMAGE_REPORT',           // Car status
    'ENGINE_WARNING',          // Car status
    'AERO_DAMAGE',             // Car status
    // === Session time warning events ===
    'SESSION_TIME_5MIN',       // 5 minute warning
    'SESSION_TIME_1MIN',       // 1 minute warning
    'SESSION_TIME_30SEC',      // 30 second warning
  ]
  
  static isRaceStatusEvent(type: CommentaryEventType): boolean {
    return RaceStatusStream.EVENT_TYPES.includes(type)
  }
  
  addEvent(event: CommentaryEvent): void {
    // Don't add duplicates of the same event type
    const hasSameType = this.queue.some(e => e.type === event.type)
    if (hasSameType) {
      console.log(`[RaceStatus] Skipping duplicate ${event.type}`)
      return
    }
    
    this.queue.push(event)
    console.log(`[RaceStatus] Queued: ${event.type} (queue: ${this.queue.length})`)
  }
  
  getNextEvent(): CommentaryEvent | null {
    // Expire stale events first
    this.expireStaleEvents()
    
    if (this.queue.length === 0) return null
    
    // Sort by priority then timestamp
    this.queue.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return a.timestamp - b.timestamp
    })
    
    return this.queue.shift() || null
  }
  
  hasEvents(): boolean {
    this.expireStaleEvents()
    return this.queue.length > 0
  }
  
  getQueueLength(): number {
    return this.queue.length
  }
  
  expireStaleEvents(): number {
    const now = Date.now()
    const before = this.queue.length
    
    this.queue = this.queue.filter(event => {
      const age = now - event.timestamp
      if (age > this.maxAge) {
        console.log(`[RaceStatus] Expired stale event: ${event.type} (age: ${age}ms)`)
        return false
      }
      return true
    })
    
    return before - this.queue.length
  }
  
  clear(): void {
    this.queue = []
  }
}

/**
 * Stream for color commentary that can be pre-generated
 * Events: Career facts, track history, driver info, trivia, banter
 */
export class ColorCommentaryStream implements CommentaryStream {
  name = 'Color'
  maxAge = 0  // No expiry - color commentary is timeless
  canPreGenerate = true
  
  private queue: CommentaryEvent[] = []
  private preGeneratedPool: PreGeneratedItem[] = []
  private maxPoolSize = 5  // Keep up to 5 pre-generated items ready
  
  // Events that belong to this stream
  static readonly EVENT_TYPES: CommentaryEventType[] = [
    'COLOR_COMMENTARY',
    'DRIVER_BACKGROUND',
    'TEAM_INFO',
    'CHAMPIONSHIP_UPDATE',
    'RIVALRY_MENTION',
    'RANDOM_FACT',
    'TRIVIA_DROP',
    'DISAGREEMENT',
    'TRACK_CHARACTER',
    'CORNER_CALLOUT',
    'WEATHER_CHANGE',
    'TRACK_LIMITS'
  ]
  
  static isColorEvent(type: CommentaryEventType): boolean {
    return ColorCommentaryStream.EVENT_TYPES.includes(type)
  }
  
  addEvent(event: CommentaryEvent): void {
    // Color events have low priority, limit queue size
    if (this.queue.length >= 3) {
      console.log(`[Color] Queue full, skipping ${event.type}`)
      return
    }
    
    // Don't add duplicates
    const hasSameType = this.queue.some(e => e.type === event.type)
    if (hasSameType) {
      return
    }
    
    this.queue.push(event)
    console.log(`[Color] Queued: ${event.type} (queue: ${this.queue.length})`)
  }
  
  getNextEvent(): CommentaryEvent | null {
    if (this.queue.length === 0) return null
    return this.queue.shift() || null
  }
  
  hasEvents(): boolean {
    return this.queue.length > 0
  }
  
  getQueueLength(): number {
    return this.queue.length
  }
  
  expireStaleEvents(): number {
    // Color events don't expire
    return 0
  }
  
  clear(): void {
    this.queue = []
  }
  
  // Pre-generation methods
  
  /**
   * Add a pre-generated item to the pool
   */
  addPreGenerated(item: PreGeneratedItem): void {
    if (this.preGeneratedPool.length >= this.maxPoolSize) {
      // Remove oldest item
      this.preGeneratedPool.shift()
    }
    this.preGeneratedPool.push(item)
    console.log(`[Color] Pre-generated pool: ${this.preGeneratedPool.length}/${this.maxPoolSize}`)
  }
  
  /**
   * Get a pre-generated item (removes from pool)
   */
  getPreGenerated(): PreGeneratedItem | null {
    if (this.preGeneratedPool.length === 0) return null
    return this.preGeneratedPool.shift() || null
  }
  
  /**
   * Check if we have pre-generated items ready
   */
  hasPreGenerated(): boolean {
    return this.preGeneratedPool.length > 0
  }
  
  /**
   * Get count of pre-generated items
   */
  getPreGeneratedCount(): number {
    return this.preGeneratedPool.length
  }
  
  /**
   * Check if pool needs more pre-generated items
   */
  needsMorePreGenerated(): boolean {
    return this.preGeneratedPool.length < this.maxPoolSize
  }
  
  /**
   * Clear pre-generated pool
   */
  clearPreGenerated(): void {
    this.preGeneratedPool = []
  }
}

/**
 * Determine which stream an event belongs to
 */
export function getStreamForEvent(type: CommentaryEventType): 'live' | 'status' | 'color' {
  if (LiveActionStream.isLiveActionEvent(type)) return 'live'
  if (RaceStatusStream.isRaceStatusEvent(type)) return 'status'
  if (ColorCommentaryStream.isColorEvent(type)) return 'color'
  
  // Default to status for unknown events
  console.warn(`[Streams] Unknown event type: ${type}, defaulting to status stream`)
  return 'status'
}

