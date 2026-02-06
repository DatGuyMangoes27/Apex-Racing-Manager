/**
 * Queue Manager
 * 
 * Orchestrates multiple commentary streams with priority-based scheduling.
 * Handles context refresh, stale event expiry, and parallel processing.
 */

import { CommentaryEvent, CommentaryEventType, EventContext } from './engine'
import { 
  LiveActionStream, 
  RaceStatusStream, 
  ColorCommentaryStream,
  PreGeneratedItem,
  getStreamForEvent
} from './streams'
import { 
  generateCommentary, 
  generateCoCommentaryResponse,
  generateCommentaryStream,
  generateCoCommentaryStream
} from './scriptGenerator'
import { synthesizeSpeech, synthesizeSpeechStreaming } from './voice'
import { playAudio, playAudioAndWait, getQueueLength as getAudioQueueLength, setVoiceBoost } from './audio'
import { BrowserWindow } from 'electron'
import { logCommentaryDecision } from '../services/debugLogger'

/**
 * Current telemetry state for context refresh
 */
interface TelemetryState {
  playerPosition: number
  currentLap: number
  totalLaps: number
  gapAhead?: number
  gapBehind?: number
  trackName: string
  sessionType?: string
  raceState?: string
}

/**
 * Queue Manager configuration
 */
interface QueueManagerConfig {
  geminiKey: string
  elevenLabsKey: string
  leadVoiceId: string
  coVoiceId: string
  onScript?: (data: { event: string; script: string; speaker: string; timestamp: number }) => void
  // Streaming config
  useStreaming?: boolean  // Enable streaming TTS for live events
  mainWindow?: BrowserWindow | null  // Window to send streaming audio to
}

/**
 * Queue Manager - coordinates all commentary streams
 */
class QueueManager {
  private liveStream: LiveActionStream
  private statusStream: RaceStatusStream
  private colorStream: ColorCommentaryStream
  
  private isProcessing = false
  private currentTelemetry: TelemetryState | null = null
  private config: QueueManagerConfig | null = null
  
  // Backlog threshold - skip co-commentator if this many events pending
  private backlogThreshold = 5  // Increased from 3 - allow more banter before skipping
  
  // Pre-generation state
  private isPreGenerating = false
  private lastPreGenerationTime = 0
  private preGenerationInterval = 15000  // Try to pre-generate every 15 seconds
  
  // Streaming state
  private streamingSessionId = 0
  private useStreaming = true  // Enable streaming by default for live events
  
  constructor() {
    this.liveStream = new LiveActionStream()
    this.statusStream = new RaceStatusStream()
    this.colorStream = new ColorCommentaryStream()
  }
  
  /**
   * Configure the queue manager with API keys and callbacks
   */
  configure(config: QueueManagerConfig): void {
    this.config = config
    if (config.useStreaming !== undefined) {
      this.useStreaming = config.useStreaming
    }
    console.log(`[QueueManager] Configured (streaming: ${this.useStreaming})`)
  }
  
  /**
   * Enable or disable streaming TTS
   */
  setStreaming(enabled: boolean): void {
    this.useStreaming = enabled
    console.log(`[QueueManager] Streaming ${enabled ? 'enabled' : 'disabled'}`)
  }
  
  /**
   * Update current telemetry state for context refresh
   */
  updateTelemetry(state: TelemetryState): void {
    this.currentTelemetry = state
  }
  
  /**
   * Route an event to the appropriate stream
   */
  routeEvent(event: CommentaryEvent): void {
    const stream = getStreamForEvent(event.type)
    
    switch (stream) {
      case 'live':
        this.liveStream.addEvent(event)
        break
      case 'status':
        this.statusStream.addEvent(event)
        break
      case 'color':
        this.colorStream.addEvent(event)
        break
    }
    
    // Trigger processing
    this.processNext()
  }
  
  /**
   * Get total pending events across all streams
   */
  getTotalPending(): number {
    return (
      this.liveStream.getQueueLength() +
      this.statusStream.getQueueLength() +
      this.colorStream.getQueueLength()
    )
  }
  
  /**
   * Check if system is backlogged
   */
  isBacklogged(): boolean {
    return this.getTotalPending() >= this.backlogThreshold
  }
  
  /**
   * Get the next event to process (priority: live > status > color)
   */
  private getNextEvent(): CommentaryEvent | null {
    // First, expire stale events in time-sensitive streams
    this.liveStream.expireStaleEvents()
    this.statusStream.expireStaleEvents()
    
    // Priority order: live action first
    if (this.liveStream.hasEvents()) {
      return this.liveStream.getNextEvent()
    }
    
    // Then race status
    if (this.statusStream.hasEvents()) {
      return this.statusStream.getNextEvent()
    }
    
    // Finally color commentary (only if we have pre-generated items or queued events)
    if (this.colorStream.hasPreGenerated()) {
      // Return a synthetic event for pre-generated content
      const preGen = this.colorStream.getPreGenerated()
      if (preGen) {
        return {
          type: 'COLOR_COMMENTARY' as CommentaryEventType,
          context: preGen.context,
          priority: 'low',
          timestamp: preGen.generatedAt,
          // Attach pre-generated data
          _preGenerated: preGen
        } as CommentaryEvent & { _preGenerated: PreGeneratedItem }
      }
    }
    
    if (this.colorStream.hasEvents()) {
      return this.colorStream.getNextEvent()
    }
    
    return null
  }
  
  /**
   * Refresh event context with current telemetry
   */
  private refreshContext(event: CommentaryEvent): CommentaryEvent {
    if (!this.currentTelemetry) return event
    
    // Only refresh certain fields that change rapidly
    return {
      ...event,
      context: {
        ...event.context,
        playerPosition: this.currentTelemetry.playerPosition,
        currentLap: this.currentTelemetry.currentLap,
        totalLaps: this.currentTelemetry.totalLaps,
        gapAhead: this.currentTelemetry.gapAhead,
        gapBehind: this.currentTelemetry.gapBehind,
        lapsRemaining: this.currentTelemetry.totalLaps - this.currentTelemetry.currentLap
      }
    }
  }
  
  /**
   * Process the next event in the queue
   */
  async processNext(): Promise<void> {
    if (this.isProcessing) return
    if (!this.config) {
      console.error('[QueueManager] Not configured')
      return
    }
    
    const event = this.getNextEvent()
    if (!event) {
      // No events to process - try pre-generation
      this.maybePreGenerate()
      return
    }
    
    this.isProcessing = true
    
    try {
      // Check if this is a pre-generated event
      const preGen = (event as any)._preGenerated as PreGeneratedItem | undefined
      
      if (preGen) {
        // ... (existing pre-gen logic)
        console.log(`[QueueManager] Playing pre-generated: "${preGen.script.substring(0, 50)}..."`)
        this.config.onScript?.({ event: event.type, script: preGen.script, speaker: 'lead', timestamp: Date.now() })
        setVoiceBoost(this.config.leadVoiceId) // Apply Crofty volume boost
        await playAudioAndWait(preGen.audio, 'low')
      } else {
        const refreshedEvent = this.refreshContext(event)
        const shouldStream = this.useStreaming && this.config.mainWindow && this.shouldUseStreaming(refreshedEvent.type, refreshedEvent.priority)
        const shouldCoRespond = !this.isBacklogged() && this.shouldCoRespond(refreshedEvent.type)

        if (shouldStream && this.config.mainWindow) {
          // ===== FULL END-TO-END STREAMING (Sequential: Lead finishes, then Co) =====
          this.streamingSessionId++
          const sessionId = this.streamingSessionId
          let firstChunkReceived = false
          const eventStartTime = Date.now()

          logCommentaryDecision('E2E_STREAM_START', `Starting ${refreshedEvent.type}`, { 
            eventType: refreshedEvent.type, 
            sessionId,
            willCoRespond: shouldCoRespond 
          })

          // 1. Generate FULL lead script (stream from Gemini, accumulate all fragments)
          let fullLeadScript = ''
          const leadScriptStart = Date.now()
          await generateCommentaryStream(
            refreshedEvent,
            this.config.geminiKey,
            (fragment) => {
              // Notify UI of each fragment for live text display
              this.config?.onScript?.({ 
                event: refreshedEvent.type, 
                script: fragment, 
                speaker: 'lead', 
                timestamp: Date.now(),
                isFragment: true 
              } as any)
              fullLeadScript += fragment
            }
          )
          const leadScriptTime = Date.now() - leadScriptStart
          
          // Send final complete script
          if (fullLeadScript) {
            this.config.onScript?.({ event: refreshedEvent.type, script: fullLeadScript, speaker: 'lead', timestamp: Date.now() })
            logCommentaryDecision('VICKY_SCRIPT_DONE', `Script ready: ${leadScriptTime}ms`, { 
              timeMs: leadScriptTime, 
              scriptLength: fullLeadScript.length,
              preview: fullLeadScript.substring(0, 60) + '...'
            })
          }

          // 2. Stream Lead TTS (ONE request for the full script)
          if (fullLeadScript) {
            const leadTTSStart = Date.now()
            let leadFirstChunkTime = 0
            await synthesizeSpeechStreaming(
              fullLeadScript,
              this.config.elevenLabsKey,
              this.config.leadVoiceId,
              (chunk: Buffer) => {
                if (!firstChunkReceived) {
                  leadFirstChunkTime = Date.now() - leadTTSStart
                  logCommentaryDecision('VICKY_FIRST_AUDIO', `First chunk: ${leadFirstChunkTime}ms`, { timeMs: leadFirstChunkTime })
                }
                this.config?.mainWindow?.webContents.send('commentary:streamingChunk', {
                  chunk: chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength),
                  sessionId,
                  isFirst: !firstChunkReceived
                })
                firstChunkReceived = true
              },
              3 // Level 3 = lower latency for live events
            )
            const leadTTSTime = Date.now() - leadTTSStart
            logCommentaryDecision('VICKY_TTS_DONE', `TTS complete: ${leadTTSTime}ms`, { totalTTSMs: leadTTSTime, firstChunkMs: leadFirstChunkTime })
          }

          // 3. Generate FULL co-script (only after lead TTS is completely done)
          let fullCoScript = ''
          if (shouldCoRespond && fullLeadScript) {
            const coScriptStart = Date.now()
            await generateCoCommentaryStream(
              refreshedEvent,
              fullLeadScript,
              this.config.geminiKey,
              (fragment) => {
                this.config?.onScript?.({ 
                  event: refreshedEvent.type, 
                  script: fragment, 
                  speaker: 'co', 
                  timestamp: Date.now(),
                  isFragment: true 
                } as any)
                fullCoScript += fragment
              }
            )
            const coScriptTime = Date.now() - coScriptStart
            
            if (fullCoScript) {
              this.config.onScript?.({ event: refreshedEvent.type, script: fullCoScript, speaker: 'co', timestamp: Date.now() })
              logCommentaryDecision('RYAN_SCRIPT_DONE', `Script ready: ${coScriptTime}ms`, { 
                timeMs: coScriptTime, 
                scriptLength: fullCoScript.length,
                preview: fullCoScript.substring(0, 60) + '...'
              })
            }

            // 4. Stream Co TTS (ONE request, same session for gapless playback)
            if (fullCoScript) {
              const coTTSStart = Date.now()
              let coFirstChunkTime = 0
              await synthesizeSpeechStreaming(
                fullCoScript,
                this.config.elevenLabsKey,
                this.config.coVoiceId,
                (chunk: Buffer) => {
                  if (coFirstChunkTime === 0) {
                    coFirstChunkTime = Date.now() - coTTSStart
                    logCommentaryDecision('RYAN_FIRST_AUDIO', `First chunk: ${coFirstChunkTime}ms`, { timeMs: coFirstChunkTime })
                  }
                  this.config?.mainWindow?.webContents.send('commentary:streamingChunk', {
                    chunk: chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength),
                    sessionId,
                    isFirst: false // Never first - lead already started the session
                  })
                },
                3 // Level 3 = lower latency for live events
              )
              const coTTSTime = Date.now() - coTTSStart
              logCommentaryDecision('RYAN_TTS_DONE', `TTS complete: ${coTTSTime}ms`, { totalTTSMs: coTTSTime, firstChunkMs: coFirstChunkTime })
            }
          }

          const totalEventTime = Date.now() - eventStartTime
          logCommentaryDecision('E2E_STREAM_COMPLETE', `Total: ${totalEventTime}ms`, { 
            eventType: refreshedEvent.type, 
            totalTimeMs: totalEventTime,
            hadCoResponse: fullCoScript.length > 0
          })

          // Signal stream end
          this.config.mainWindow.webContents.send('commentary:streamingEnd', { sessionId })

        } else {
          // ===== STANDARD BATCH SYNTHESIS (FALLBACK) =====
          const leadScript = await generateCommentary(refreshedEvent, this.config.geminiKey)
          if (leadScript) {
            this.config.onScript?.({ event: refreshedEvent.type, script: leadScript, speaker: 'lead', timestamp: Date.now() })
            const leadAudio = await synthesizeSpeech(leadScript, this.config.elevenLabsKey, this.config.leadVoiceId)
            if (leadAudio) {
              setVoiceBoost(this.config.leadVoiceId) // Apply Crofty volume boost
              await playAudioAndWait(leadAudio, refreshedEvent.priority)
            }

            if (shouldCoRespond) {
              const coScript = await generateCoCommentaryResponse(refreshedEvent, leadScript, this.config.geminiKey)
              if (coScript) {
                this.config.onScript?.({ event: refreshedEvent.type, script: coScript, speaker: 'co', timestamp: Date.now() })
                const coAudio = await synthesizeSpeech(coScript, this.config.elevenLabsKey, this.config.coVoiceId)
                if (coAudio) {
                  setVoiceBoost(this.config.coVoiceId) // Apply co-commentator volume (no boost needed for Vicky)
                  await playAudioAndWait(coAudio, refreshedEvent.priority)
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[QueueManager] Error processing event:', error)
    }
    
    this.isProcessing = false
    
    // Process next event after short delay
    if (this.getTotalPending() > 0) {
      setTimeout(() => this.processNext(), 500)
    } else {
      // No more events - try pre-generation
      this.maybePreGenerate()
    }
  }
  
  /**
   * Determine if we should use streaming TTS for this event
   * NOW: Always use streaming for ALL events - better quality & lower latency
   */
  private shouldUseStreaming(_eventType: CommentaryEventType, _priority: 'high' | 'medium' | 'low'): boolean {
    // Always use E2E streaming for all events - it's faster and better quality
    return true
  }
  
  /**
   * Determine if co-commentator should respond
   */
  private shouldCoRespond(eventType: CommentaryEventType): boolean {
    const responseChances: Partial<Record<CommentaryEventType, number>> = {
      RACE_START: 0.9,
      RACE_WIN: 0.95,
      PODIUM_FINISH: 0.85,
      OVERTAKE: 0.6,
      POSITION_LOST: 0.5,
      FASTEST_LAP: 0.7,
      PERSONAL_BEST: 0.5,
      GREAT_START: 0.8,
      POOR_START: 0.7,
      BATTLE_FORMING: 0.6,
      FINAL_LAPS: 0.7,
      // Color commentary - higher chance for banter
      TRIVIA_DROP: 0.8,
      DISAGREEMENT: 1.0,  // Always respond to set up disagreement
      TRACK_CHARACTER: 0.5,
    }
    
    const chance = responseChances[eventType] ?? 0.4
    return Math.random() < chance
  }
  
  /**
   * Pre-generation is DISABLED - E2E streaming is fast enough for real-time
   * All events now use the streaming pipeline directly.
   */
  private async maybePreGenerate(): Promise<void> {
    // DISABLED: E2E streaming handles everything in real-time now
    return
  }
  
  /**
   * Clear all queues
   */
  clearAll(): void {
    this.liveStream.clear()
    this.statusStream.clear()
    this.colorStream.clear()
    this.colorStream.clearPreGenerated()
    this.isProcessing = false
    console.log('[QueueManager] All queues cleared')
  }
  
  /**
   * Get status for debugging
   */
  getStatus(): {
    live: number
    status: number
    color: number
    preGenerated: number
    isProcessing: boolean
    isBacklogged: boolean
  } {
    return {
      live: this.liveStream.getQueueLength(),
      status: this.statusStream.getQueueLength(),
      color: this.colorStream.getQueueLength(),
      preGenerated: this.colorStream.getPreGeneratedCount(),
      isProcessing: this.isProcessing,
      isBacklogged: this.isBacklogged()
    }
  }
}

// Singleton instance
export const queueManager = new QueueManager()

