/**
 * Commentary System
 * 
 * AI-powered race commentary using Gemini 3 Flash and ElevenLabs.
 * Supports Practice, Qualifying, and Race sessions.
 * Includes color commentary using career data.
 */

import { ipcMain, BrowserWindow } from 'electron'
import { 
  initCommentaryEngine, 
  setCommentaryEnabled, 
  setAPIKeys, 
  getAPIKeys,
  setVoiceSettings,
  setDualVoiceSettings,
  setCareerData,
  processTelemetry,
  handleRaceComplete,
  handleSessionComplete,
  getAvailableVoices,
  testAudio
} from './engine'
import { 
  initAudioPlayer, 
  setVolume, 
  stopAllAudio, 
  getVolume,
  getAudioDevices,
  setOutputDevice,
  refreshAudioDevices,
  testAudioPlayback
} from './audio'
import { testVoiceConnection, getAvailableVoices as fetchElevenLabsVoices } from './voice'
import { 
  generateRaceContentPool,
  loadPreGeneratedContentPool,
  getContentPool, 
  clearContentPool, 
  getNextContent,
  getPoolStats,
  type ContentPoolContext,
  type GeneratedLine
} from './contentPool'
import {
  startScheduler,
  stopScheduler,
  updateLap,
  onAudioStarted,
  onAudioEnded,
  onEventCommentary,
  getSchedulerStatus,
  setSchedulerConfig,
  type RacePhase
} from './scheduler'
import {
  selectVoiceForContent,
  getVoiceId,
  recordVoiceUsed,
  resetVoiceTracking
} from './voices'
import { synthesizeSpeechStreaming } from './voice'
import {
  getRecentCommentaryMentions,
  getCommentaryEntityState,
  type CommentaryMentionQuery,
  type CommentaryEntityType,
} from '../db/database'

let isInitialized = false
let schedulerMainWindow: BrowserWindow | null = null

/**
 * Register all commentary IPC handlers
 */
export function registerCommentaryHandlers(mainWindow: BrowserWindow | null): void {
  if (!mainWindow) {
    console.error('[Commentary] No main window provided')
    return
  }
  
  // Initialize the engine
  initCommentaryEngine(mainWindow)
  initAudioPlayer()
  isInitialized = true
  console.log('[Commentary] Handlers registered')
  
  // Enable/disable commentary
  ipcMain.handle('commentary:setEnabled', async (_event, enabled: boolean) => {
    setCommentaryEnabled(enabled)
    return { success: true, enabled }
  })
  
  // Configure API keys
  ipcMain.handle('commentary:setAPIKeys', async (_event, geminiKey: string, elevenLabsKey: string) => {
    setAPIKeys(geminiKey, elevenLabsKey)
    return { success: true }
  })
  
  // Set voice and volume (single voice - backward compat)
  ipcMain.handle('commentary:setVoice', async (_event, voiceId: string, volume: number) => {
    setVoiceSettings(voiceId, volume)
    return { success: true }
  })
  
  // Set dual voices (lead + co-commentator)
  ipcMain.handle('commentary:setVoices', async (_event, leadVoiceId: string, coVoiceId: string, volume: number) => {
    setDualVoiceSettings(leadVoiceId, coVoiceId, volume)
    return { success: true }
  })
  
  // Set pit reporter voice (third voice)
  ipcMain.handle('commentary:setPitReporterVoice', async (_event, voiceId: string) => {
    const { setPitReporterVoiceId } = await import('./voices')
    setPitReporterVoiceId(voiceId)
    console.log(`[Commentary] Pit reporter voice set: ${voiceId ? voiceId.slice(0, 8) + '...' : 'disabled'}`)
    return { success: true }
  })
  
  // Set volume only
  ipcMain.handle('commentary:setVolume', async (_event, volume: number) => {
    setVolume(volume)
    return { success: true, volume: getVolume() }
  })
  
  // Stop all audio
  ipcMain.handle('commentary:stop', async () => {
    stopAllAudio()
    return { success: true }
  })
  
  // Get built-in voice options
  ipcMain.handle('commentary:getVoices', async () => {
    return getAvailableVoices()
  })
  
  // Fetch voices from ElevenLabs API
  ipcMain.handle('commentary:fetchElevenLabsVoices', async (_event, apiKey: string) => {
    try {
      const voices = await fetchElevenLabsVoices(apiKey)
      return { success: true, voices }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })
  
  // Test ElevenLabs connection
  ipcMain.handle('commentary:testConnection', async (_event, apiKey: string) => {
    const connected = await testVoiceConnection(apiKey)
    return { success: connected }
  })
  
  // Test audio playback
  ipcMain.handle('commentary:testAudio', async () => {
    const success = await testAudioPlayback()
    return { success }
  })
  
  // Get available audio output devices
  ipcMain.handle('commentary:getAudioDevices', async () => {
    const devices = await refreshAudioDevices()
    return { success: true, devices }
  })
  
  // Set audio output device
  ipcMain.handle('commentary:setAudioDevice', async (_event, deviceId: string) => {
    setOutputDevice(deviceId)
    return { success: true }
  })
  
  // Set career data for color commentary
  ipcMain.handle('commentary:setCareerData', async (_event, data: any) => {
    setCareerData(data)
    return { success: true }
  })
  
  // Manual event trigger for testing
  ipcMain.handle('commentary:triggerEvent', async (_event, eventType: string, context: any) => {
    const { generateCommentary, generateCoCommentaryResponse } = await import('./scriptGenerator')
    const { synthesizeSpeech } = await import('./voice')
    const { playAudio, getVolume } = await import('./audio')
    const { getVoiceIds } = await import('./engine')
    
    try {
      const testEvent = {
        type: eventType as any,
        context: context || {
          playerName: 'Test Driver',
          playerPosition: 3,
          trackName: 'Interlagos',
          currentLap: 15,
          totalLaps: 30,
          sessionType: 'Race',
          teamName: 'Williams Racing',
          championshipPosition: 5
        },
        priority: 'high' as const,
        timestamp: Date.now()
      }
      
      // Notify frontend that test started
      mainWindow?.webContents.send('commentary:testStarted', { eventType })
      
      return { success: true, message: 'Test event triggered' }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })
  
  // Test banter between both commentators (using ultra-fast E2E streaming)
  ipcMain.handle('commentary:testBanter', async (_event, geminiKey: string, elevenLabsKey: string, leadVoice: string, coVoice: string) => {
    const { generateCommentaryStream, generateCoCommentaryStream } = await import('./scriptGenerator')
    const { synthesizeSpeechStreaming } = await import('./voice')
    
    try {
      console.log('[Commentary] ========== TEST BANTER (E2E v3) ==========')
      setAPIKeys(geminiKey, elevenLabsKey)
      const start = performance.now()
      
      const testEvent = {
        type: 'OVERTAKE' as const,
        context: {
          playerName: 'Test Driver',
          playerPosition: 3,
          previousPosition: 4,
          overtakenDriver: 'Hamilton',
          trackName: 'Silverstone',
          currentLap: 42,
          totalLaps: 52,
          sessionType: 'Race' as const,
          teamName: 'Williams Racing'
        },
        priority: 'high' as const,
        timestamp: Date.now()
      }
      
      currentStreamingSessionId++
      const sessionId = currentStreamingSessionId
      let isFirstChunk = true

      // Helper to stream TTS and wait
      const streamTTSAndWait = async (text: string, voice: string): Promise<void> => {
        await synthesizeSpeechStreaming(text, elevenLabsKey, voice, (chunk: Buffer) => {
          mainWindow?.webContents.send('commentary:streamingChunk', {
            chunk: chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength),
            sessionId,
            isFirst: isFirstChunk
          })
          isFirstChunk = false
        }, 1) // Level 1 = better quality
      }

      // 1. Stream Vicky script from Gemini
      console.log('[Commentary] Generating Vicky script...')
      let leadAccum = ''
      const leadScript = await generateCommentaryStream(testEvent, geminiKey, (fragment) => {
        leadAccum += (leadAccum ? ' ' : '') + fragment
        mainWindow?.webContents.send('commentary:script', { event: 'OVERTAKE', script: leadAccum, speaker: 'lead', timestamp: Date.now(), isFragment: true })
      })
      console.log(`[Commentary] Vicky script ready in ${(performance.now() - start).toFixed(0)}ms`)
      
      // 2. Send full Vicky script to TTS
      mainWindow?.webContents.send('commentary:script', { event: 'OVERTAKE', script: leadScript, speaker: 'lead', timestamp: Date.now(), isFragment: false })
      await streamTTSAndWait(leadScript, leadVoice)

      // 3. Stream Ryan script from Gemini
      console.log('[Commentary] Generating Ryan script...')
      const coStart = performance.now()
      let coAccum = ''
      const coScript = await generateCoCommentaryStream(testEvent, leadScript, geminiKey, (fragment) => {
        coAccum += (coAccum ? ' ' : '') + fragment
        mainWindow?.webContents.send('commentary:script', { event: 'OVERTAKE', script: coAccum, speaker: 'co', timestamp: Date.now(), isFragment: true })
      })
      console.log(`[Commentary] Ryan script ready in ${(performance.now() - coStart).toFixed(0)}ms`)
      
      // 4. Send full Ryan script to TTS
      mainWindow?.webContents.send('commentary:script', { event: 'OVERTAKE', script: coScript, speaker: 'co', timestamp: Date.now(), isFragment: false })
      await streamTTSAndWait(coScript, coVoice)

      mainWindow?.webContents.send('commentary:streamingEnd', { sessionId })
      
      console.log(`[Commentary] Banter complete in ${(performance.now() - start).toFixed(0)}ms`)
      return { success: true, leadScript, coScript, message: 'E2E Banter complete!' }
    } catch (error) {
      console.error('[Commentary] Banter test error:', error)
      return { success: false, error: String(error) }
    }
  })
  
  // Test queue sequence - fires multiple events through the queue manager
  ipcMain.handle('commentary:testQueueSequence', async (_event, geminiKey: string, elevenLabsKey: string, leadVoice: string, coVoice: string) => {
    const { queueManager } = await import('./queueManager')
    
    try {
      console.log('[Commentary] ========== QUEUE SEQUENCE TEST ==========')
      
      // Configure the queue manager
      setAPIKeys(geminiKey, elevenLabsKey)
      setDualVoiceSettings(leadVoice, coVoice, 0.8)
      
      // Test context with rich historical data for narrative testing
      const baseContext = {
        playerName: 'Test Driver',
        trackName: 'Interlagos',
        currentLap: 15,
        totalLaps: 30,
        sessionType: 'Race' as const,
        teamName: 'Williams Racing',
        championshipPosition: 3,
        championshipPoints: 156,
        totalWins: 2,
        totalPodiums: 5,
        seasonWins: 1,
        reputation: 72,
        // Historical context for narrative commentary
        lastRaceResult: 2,           // Podium last time!
        lastTrackName: 'Spa',        // Where the last race was
        currentStreak: '3 podiums in last 5 races',
        // Other drivers for comparison
        championshipLeader: 'Hamilton',
        championshipLeaderPosition: 4,  // Leader struggling this race!
        lastRaceWinner: 'Norris',
        lastRaceWinnerPosition: 12,     // Last winner having a tough day
        rivalName: 'Leclerc',
        rivalPosition: 6
      }
      
      // Fire a sequence of events with different priorities
      const testEvents = [
        {
          type: 'RACE_START' as const,
          context: { ...baseContext, playerPosition: 8 },
          priority: 'high' as const,
          timestamp: Date.now()
        },
        {
          type: 'OVERTAKE' as const,
          context: { ...baseContext, playerPosition: 7, previousPosition: 8, overtakenDriver: 'Verstappen' },
          priority: 'high' as const,
          timestamp: Date.now() + 100
        },
        {
          type: 'GAP_CLOSING' as const,
          context: { ...baseContext, playerPosition: 7, gapAhead: 1.2 },
          priority: 'medium' as const,
          timestamp: Date.now() + 200
        },
        {
          type: 'COLOR_COMMENTARY' as const,
          context: { ...baseContext, playerPosition: 7 },
          priority: 'low' as const,
          timestamp: Date.now() + 300
        },
        {
          type: 'OVERTAKE' as const,
          context: { ...baseContext, playerPosition: 6, previousPosition: 7, overtakenDriver: 'Leclerc' },
          priority: 'high' as const,
          timestamp: Date.now() + 400
        }
      ]
      
      console.log(`[Commentary] Routing ${testEvents.length} events to queue manager...`)
      
      // Route all events
      for (const event of testEvents) {
        console.log(`[Commentary] Routing: ${event.type} (priority: ${event.priority})`)
        queueManager.routeEvent(event)
      }
      
      // Log queue status
      const status = queueManager.getStatus()
      console.log('[Commentary] Queue status:', JSON.stringify(status, null, 2))
      
      return {
        success: true,
        message: `Queued ${testEvents.length} events. Watch the logs for processing order!`,
        queueStatus: status
      }
    } catch (error) {
      console.error('[Commentary] Queue sequence test error:', error)
      return { success: false, error: String(error) }
    }
  })
  
  // Get queue manager status
  ipcMain.handle('commentary:getQueueStatus', async () => {
    const { queueManager } = await import('./queueManager')
    return queueManager.getStatus()
  })

  // Query persisted commentary mentions (Phase 1 narrative memory)
  ipcMain.handle('commentary:getRecentMentions', async (_event, query?: CommentaryMentionQuery) => {
    return getRecentCommentaryMentions(query)
  })

  // Query persisted entity state snapshots (Phase 1 narrative memory)
  ipcMain.handle('commentary:getEntityState', async (_event, entityType: CommentaryEntityType, entityId: string) => {
    return getCommentaryEntityState(entityType, entityId)
  })
  
  // ============== STREAMING TTS HANDLERS ==============
  
  // Track current streaming session
  let currentStreamingSessionId = 0
  
  // Start a streaming session (returns session ID for renderer to track)
  ipcMain.handle('commentary:startStreamingSession', async () => {
    currentStreamingSessionId++
    console.log(`[Commentary] Started streaming session: ${currentStreamingSessionId}`)
    return { success: true, sessionId: currentStreamingSessionId }
  })
  
  // Stop current streaming session
  ipcMain.handle('commentary:stopStreamingSession', async () => {
    mainWindow?.webContents.send('commentary:streamingStop')
    console.log('[Commentary] Stopped streaming session')
    return { success: true }
  })
  
  // Test streaming TTS with latency measurement (Dual Commentator) - uses E2E streaming
  // Optional 'scenario' param allows different TV broadcast scenarios
  ipcMain.handle('commentary:testStreaming', async (_event, geminiKey: string, elevenLabsKey: string, voiceId: string, coVoiceId: string, scenario?: string) => {
    const { generateCommentaryStream, generateCoCommentaryStream } = await import('./scriptGenerator')
    const { synthesizeSpeechStreaming } = await import('./voice')
    
    try {
      console.log(`[Commentary] ========== TEST STREAMING TTS (${scenario || 'default'}) ==========`)
      
      // TV Broadcast scenarios - varied content for authentic feel
      const scenarios: Record<string, any> = {
        'race_start': {
          type: 'RACE_START',
          context: {
            playerName: 'Test Driver',
            playerPosition: 8,
            gridPosition: 8,
            trackName: 'Interlagos',
            currentLap: 1,
            totalLaps: 30,
            sessionType: 'Race',
            teamName: 'Full Time Racing',
            seriesName: 'Stock Car Brasil',
            polesitter: 'Rubens Barrichello',
            weather: 'Overcast'
          },
          priority: 'high'
        },
        'battle': {
          type: 'GAP_CLOSING',
          context: {
            playerName: 'Test Driver',
            playerPosition: 5,
            trackName: 'Interlagos',
            currentLap: 12,
            totalLaps: 30,
            sessionType: 'Race',
            teamName: 'Full Time Racing',
            gap: 0.4,
            targetDriver: 'Daniel Serra',
            targetTeam: 'Eurofarma RC',
            seriesName: 'Stock Car Brasil'
          },
          priority: 'high'
        },
        'overtake': {
          type: 'OVERTAKE',
          context: {
            playerName: 'Test Driver',
            playerPosition: 4,
            previousPosition: 5,
            overtakenDriver: 'Daniel Serra',
            trackName: 'Interlagos',
            currentLap: 15,
            totalLaps: 30,
            sessionType: 'Race',
            teamName: 'Full Time Racing',
            seriesName: 'Stock Car Brasil'
          },
          priority: 'high'
        },
        'final_laps': {
          type: 'FINAL_LAPS',
          context: {
            playerName: 'Test Driver',
            playerPosition: 3,
            trackName: 'Interlagos',
            currentLap: 28,
            totalLaps: 30,
            sessionType: 'Race',
            teamName: 'Full Time Racing',
            lapsRemaining: 2,
            gap: 1.2,
            leaderName: 'Felipe Massa',
            seriesName: 'Stock Car Brasil'
          },
          priority: 'high'
        },
        'podium': {
          type: 'PODIUM_FINISH',
          context: {
            playerName: 'Test Driver',
            playerPosition: 3,
            trackName: 'Interlagos',
            currentLap: 30,
            totalLaps: 30,
            sessionType: 'Race',
            teamName: 'Full Time Racing',
            raceWinner: 'Felipe Massa',
            secondPlace: 'Rubens Barrichello',
            seriesName: 'Stock Car Brasil'
          },
          priority: 'high'
        }
      }
      
      const testEvent = scenarios[scenario || 'overtake'] || scenarios['overtake']
      testEvent.timestamp = Date.now()
      
      currentStreamingSessionId++
      const sessionId = currentStreamingSessionId
      let isFirstChunk = true
      let firstChunkMs: number | undefined
      const start = performance.now()
      
      // Helper to stream TTS and wait for completion
      const streamTTSAndWait = async (text: string, voice: string): Promise<void> => {
        let chunkCount = 0
        const result = await synthesizeSpeechStreaming(text, elevenLabsKey, voice, (chunk: Buffer) => {
          chunkCount++
          if (isFirstChunk) {
            firstChunkMs = performance.now() - start
            console.log(`[Commentary] First audio chunk at ${firstChunkMs.toFixed(0)}ms`)
          }
          mainWindow?.webContents.send('commentary:streamingChunk', {
            chunk: chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength),
            sessionId,
            isFirst: isFirstChunk
          })
          isFirstChunk = false
        }, 1) // Level 1 = better quality, slightly more latency
        console.log(`[Commentary] TTS complete: ${chunkCount} chunks, ${result.totalBytes} bytes`)
      }

      // 1. Stream Lead script from Gemini (fast first token, UI updates)
      console.log('[Commentary] Generating Lead script (streaming)...')
      let leadAccum = ''
      const leadScript = await generateCommentaryStream(testEvent, geminiKey, (fragment) => {
        leadAccum += (leadAccum ? ' ' : '') + fragment
        mainWindow?.webContents.send('commentary:script', { 
          event: 'TEST_STREAMING', 
          script: leadAccum, 
          speaker: 'lead', 
          timestamp: Date.now(), 
          isFragment: true 
        })
      })
      console.log(`[Commentary] Lead script ready in ${(performance.now() - start).toFixed(0)}ms: "${leadScript}"`)
      
      // 2. Send FULL lead script to TTS (single request, clean audio)
      mainWindow?.webContents.send('commentary:script', { event: 'TEST_STREAMING', script: leadScript, speaker: 'lead', timestamp: Date.now(), isFragment: false })
      await streamTTSAndWait(leadScript, voiceId)
      
      // 3. Now generate Co script (can overlap with lead audio playing)
      console.log('[Commentary] Generating Ryan script (streaming)...')
      const coStart = performance.now()
      let coAccum = ''
      const coScript = await generateCoCommentaryStream(testEvent, leadScript, geminiKey, (fragment) => {
        coAccum += (coAccum ? ' ' : '') + fragment
        mainWindow?.webContents.send('commentary:script', { 
          event: 'TEST_STREAMING', 
          script: coAccum, 
          speaker: 'co', 
          timestamp: Date.now(), 
          isFragment: true 
        })
      })
      console.log(`[Commentary] Ryan script ready in ${(performance.now() - coStart).toFixed(0)}ms: "${coScript}"`)
      
      // 4. Send FULL co script to TTS
      mainWindow?.webContents.send('commentary:script', { event: 'TEST_STREAMING', script: coScript, speaker: 'co', timestamp: Date.now(), isFragment: false })
      await streamTTSAndWait(coScript, coVoiceId)

      mainWindow?.webContents.send('commentary:streamingEnd', { sessionId })
      
      return {
        success: true,
        firstChunkMs: firstChunkMs || 0,
        totalMs: performance.now() - start,
        script: leadScript
      }
      
    } catch (error) {
      console.error('[Commentary] Streaming test error:', error)
      return { success: false, error: String(error) }
    }
  })
  
  // Process telemetry - called from telemetry handler
  ipcMain.handle('commentary:processTelemetry', async (_event, session: any, participants: any[], playerIndex: number) => {
    processTelemetry(session, participants, playerIndex)
    return { success: true }
  })
  
  // Handle race complete
  ipcMain.handle('commentary:raceComplete', async (_event, data: any) => {
    handleRaceComplete(data)
    return { success: true }
  })
  
  // Handle session complete
  ipcMain.handle('commentary:sessionComplete', async (_event, data: any) => {
    handleSessionComplete(data)
    return { success: true }
  })
  
  // ============== TV BROADCAST CONTENT POOL ==============
  
  // Generate pre-race content pool
  ipcMain.handle('commentary:generateContentPool', async (_event, context: ContentPoolContext, apiKey: string) => {
    try {
      console.log('[Commentary] Generating content pool for', context.trackName)
      const pool = await generateRaceContentPool(context, apiKey, (stage, progress) => {
        mainWindow?.webContents.send('commentary:contentPoolProgress', { stage, progress })
      })
      return { success: true, stats: getPoolStats() }
    } catch (error) {
      console.error('[Commentary] Content pool generation failed:', error)
      return { success: false, error: String(error) }
    }
  })
  
  // Load pre-generated content pool (from Content Studio data)
  ipcMain.handle('commentary:loadPreGeneratedContentPool', async (_event, data: { trackId: string; seriesId: string; pool: any }) => {
    try {
      console.log(`[Commentary] Loading pre-generated content pool for track ${data.trackId}`)
      const pool = loadPreGeneratedContentPool(data.trackId, data.seriesId, data.pool)
      return { success: true, stats: getPoolStats() }
    } catch (error) {
      console.error('[Commentary] Pre-generated content pool load failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // Get next content from pool
  ipcMain.handle('commentary:getPoolContent', async (_event, category?: string, lapPhase?: string, voice?: string) => {
    const content = getNextContent(
      category as any,
      lapPhase as any,
      voice as any
    )
    return { success: true, content }
  })
  
  // Get pool statistics
  ipcMain.handle('commentary:getPoolStats', async () => {
    const stats = getPoolStats()
    return { success: true, stats }
  })
  
  // Clear content pool
  ipcMain.handle('commentary:clearContentPool', async () => {
    clearContentPool()
    return { success: true }
  })
  
  // ============== TV BROADCAST SCHEDULER ==============
  
  // Store mainWindow reference for scheduler callbacks
  schedulerMainWindow = mainWindow
  
  // Start the continuous commentary scheduler
  ipcMain.handle('commentary:startScheduler', async (_event, totalLaps: number) => {
    console.log(`[Commentary] Starting scheduler for ${totalLaps} lap race`)
    resetVoiceTracking()
    
    startScheduler(totalLaps, async (content: GeneratedLine) => {
      // Callback when scheduler wants to speak color commentary
      await handleSchedulerContent(content)
    })
    
    return { success: true }
  })
  
  // Stop the scheduler
  ipcMain.handle('commentary:stopScheduler', async () => {
    console.log('[Commentary] Stopping scheduler')
    stopScheduler()
    return { success: true }
  })
  
  // Update scheduler with current lap
  ipcMain.handle('commentary:updateSchedulerLap', async (_event, currentLap: number) => {
    updateLap(currentLap)
    return { success: true }
  })
  
  // Notify scheduler when audio events occur
  ipcMain.handle('commentary:audioStarted', async () => {
    onAudioStarted()
    return { success: true }
  })
  
  ipcMain.handle('commentary:audioEnded', async () => {
    onAudioEnded()
    return { success: true }
  })
  
  // Get scheduler status
  ipcMain.handle('commentary:getSchedulerStatus', async () => {
    const status = getSchedulerStatus()
    return { success: true, status }
  })
  
  // Configure scheduler thresholds
  ipcMain.handle('commentary:configureScheduler', async (_event, config: any) => {
    setSchedulerConfig(config)
    return { success: true }
  })
}

/**
 * Handle content from the scheduler
 * Selects appropriate voice and speaks the content
 */
async function handleSchedulerContent(content: GeneratedLine): Promise<void> {
  console.log(`[Scheduler->Commentary] Speaking: ${content.category} - "${content.text.substring(0, 50)}..."`)
  
  // Get configured API keys
  const { elevenLabsKey } = getAPIKeys()
  
  if (!elevenLabsKey) {
    console.warn('[Scheduler] No ElevenLabs key configured, skipping content')
    return
  }
  
  // Select voice based on content category
  const persona = selectVoiceForContent(content.category)
  const voiceId = getVoiceId(persona)
  
  recordVoiceUsed(persona.id)
  
  // Notify scheduler that audio is starting
  onAudioStarted()
  
  try {
    // Use streaming TTS for smooth playback
    if (schedulerMainWindow) {
      await synthesizeSpeechStreaming(
        content.text,
        elevenLabsKey,  // API key (was in wrong position!)
        voiceId,        // Voice ID
        (chunk: Buffer, isFirst: boolean) => {
          // Send chunk to renderer for playback
          schedulerMainWindow?.webContents.send('commentary:streamingChunk', {
            chunk: chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength),
            sessionId: Date.now(),
            isFirst
          })
        },
        3  // Latency level 3 for scheduler content (balanced)
      )
    }
    
    // Notify that event commentary was triggered (resets silence timer)
    onEventCommentary()
  } catch (error) {
    console.error('[Scheduler] TTS failed:', error)
  } finally {
    // Notify scheduler that audio ended
    onAudioEnded()
  }
}

/**
 * Hook into telemetry events
 * Call this from the telemetry handler to feed data to commentary
 */
export function feedTelemetryToCommentary(session: any, participants: any[], playerIndex: number): void {
  if (isInitialized) {
    processTelemetry(session, participants, playerIndex)
  }
}

/**
 * Hook into race complete events
 */
export function feedRaceCompleteToCommentary(data: any): void {
  if (isInitialized) {
    handleRaceComplete(data)
  }
}

/**
 * Hook into session complete events
 */
export function feedSessionCompleteToCommentary(data: any): void {
  if (isInitialized) {
    handleSessionComplete(data)
  }
}

/**
 * Update career data from frontend
 */
export function updateCareerData(data: any): void {
  if (isInitialized) {
    setCareerData(data)
  }
}

/**
 * Stop all commentary (called on app close)
 */
export function stopCommentary(): void {
  console.log('[Commentary] Stopping commentary system...')
  setCommentaryEnabled(false)
  stopAllAudio()
  isInitialized = false
}

export { setCommentaryEnabled, setAPIKeys, setVoiceSettings, setDualVoiceSettings, setCareerData }
