import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Generic IPC invoke
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  
  // Event listeners
  on: (channel: string, callback: (...args: any[]) => void) => {
    const subscription = (_event: any, ...args: any[]) => callback(...args)
    ipcRenderer.on(channel, subscription)
    return () => ipcRenderer.removeListener(channel, subscription)
  },
  
  removeListener: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback)
  },
  
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onMaximizedChange: (callback: (maximized: boolean) => void) => {
    ipcRenderer.on('window:maximized', (_event, maximized) => callback(maximized))
  },

  // AMS2 Integration
  launchAMS2: (gamePath: string, options?: { noVR?: boolean }) => ipcRenderer.invoke('ams2:launch', gamePath, options),
  validateAMS2Path: (gamePath: string) => ipcRenderer.invoke('ams2:validatePath', gamePath),
  
  // Dialogs
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  openFile: (options?: any) => ipcRenderer.invoke('dialog:openFile', options),

  // UDP Telemetry
  startTelemetry: (port?: number) => ipcRenderer.invoke('telemetry:start', port),
  stopTelemetry: () => ipcRenderer.invoke('telemetry:stop'),
  getTelemetryStatus: () => ipcRenderer.invoke('telemetry:status'),
  setTelemetryPort: (port: number) => ipcRenderer.invoke('telemetry:setPort', port),
  
  // Telemetry event listeners
  onTelemetrySession: (callback: (data: any) => void) => {
    ipcRenderer.on('telemetry:session', (_event, data) => callback(data))
  },
  onTelemetryParticipants: (callback: (data: any) => void) => {
    ipcRenderer.on('telemetry:participants', (_event, data) => callback(data))
  },
  onTelemetryHeartbeat: (callback: (data: any) => void) => {
    ipcRenderer.on('telemetry:heartbeat', (_event, data) => callback(data))
  },
  onTelemetryError: (callback: (error: string) => void) => {
    ipcRenderer.on('telemetry:error', (_event, error) => callback(error))
  },
  onTelemetryRaceComplete: (callback: (data: any) => void) => {
    ipcRenderer.on('telemetry:raceComplete', (_event, data) => callback(data))
  },
  
  // Session Phase Debug (Crew Chief-style detection)
  getSessionPhaseDebug: () => ipcRenderer.invoke('telemetry:getSessionPhaseDebug'),
  forceRaceComplete: () => ipcRenderer.invoke('telemetry:forceRaceComplete'),
  resetSessionPhase: () => ipcRenderer.invoke('telemetry:resetSessionPhase'),

  // XML Generator
  generateAIXML: (data: any) => ipcRenderer.invoke('xml:generateGrid', data),
  generateCareerAI: (standings: any[], seriesName: string, config: any) => 
    ipcRenderer.invoke('ams2:generateCareerAI', { standings, seriesName, config }),
  generateRaceWeekendAI: (drivers: any[], seriesName: string, config: any, carClassId?: string, aiModifier?: number) =>
    ipcRenderer.invoke('ams2:generateRaceWeekendAI', { drivers, seriesName, config, carClassId, aiModifier }),
  
  // Database operations
  saveCareer: (careerData: unknown) => ipcRenderer.invoke('db:saveCareer', careerData),
  loadCareer: () => ipcRenderer.invoke('db:loadCareer'),
  
  // Commentary system (Gemini 3 Flash + ElevenLabs)
  setCommentaryEnabled: (enabled: boolean) => ipcRenderer.invoke('commentary:setEnabled', enabled),
  setCommentaryAPIKeys: (geminiKey: string, elevenLabsKey: string) => 
    ipcRenderer.invoke('commentary:setAPIKeys', geminiKey, elevenLabsKey),
  setCommentaryVoice: (voiceId: string, volume: number) => 
    ipcRenderer.invoke('commentary:setVoice', voiceId, volume),
  setCommentaryVoices: (leadVoiceId: string, coVoiceId: string, volume: number) => 
    ipcRenderer.invoke('commentary:setVoices', leadVoiceId, coVoiceId, volume),
  setPitReporterVoice: (voiceId: string) => 
    ipcRenderer.invoke('commentary:setPitReporterVoice', voiceId),
  setCommentaryVolume: (volume: number) => ipcRenderer.invoke('commentary:setVolume', volume),
  stopCommentary: () => ipcRenderer.invoke('commentary:stop'),
  getCommentaryVoices: () => ipcRenderer.invoke('commentary:getVoices'),
  fetchElevenLabsVoices: (apiKey: string) => ipcRenderer.invoke('commentary:fetchElevenLabsVoices', apiKey),
  testCommentaryConnection: (apiKey: string) => ipcRenderer.invoke('commentary:testConnection', apiKey),
  testCommentaryAudio: () => ipcRenderer.invoke('commentary:testAudio'),
  getCommentaryAudioDevices: () => ipcRenderer.invoke('commentary:getAudioDevices'),
  setCommentaryAudioDevice: (deviceId: string) => ipcRenderer.invoke('commentary:setAudioDevice', deviceId),
  setCommentaryCareerData: (data: any) => ipcRenderer.invoke('commentary:setCareerData', data),
  triggerCommentaryEvent: (eventType: string, context?: any) => 
    ipcRenderer.invoke('commentary:triggerEvent', eventType, context),
  testCommentaryBanter: (geminiKey: string, elevenLabsKey: string, leadVoice: string, coVoice: string) =>
    ipcRenderer.invoke('commentary:testBanter', geminiKey, elevenLabsKey, leadVoice, coVoice),
  testCommentaryQueueSequence: (geminiKey: string, elevenLabsKey: string, leadVoice: string, coVoice: string) =>
    ipcRenderer.invoke('commentary:testQueueSequence', geminiKey, elevenLabsKey, leadVoice, coVoice),
  getCommentaryQueueStatus: () => ipcRenderer.invoke('commentary:getQueueStatus'),
  onCommentaryScript: (callback: (data: any) => void) => {
    ipcRenderer.on('commentary:script', (_event, data) => callback(data))
  },
  onCommentaryTestStarted: (callback: (data: any) => void) => {
    ipcRenderer.on('commentary:testStarted', (_event, data) => callback(data))
  },
  
  // Streaming audio for low-latency TTS
  testCommentaryStreaming: (geminiKey: string, elevenLabsKey: string, voiceId: string, coVoiceId: string, scenario?: string) =>
    ipcRenderer.invoke('commentary:testStreaming', geminiKey, elevenLabsKey, voiceId, coVoiceId, scenario),
  startStreamingSession: () => ipcRenderer.invoke('commentary:startStreamingSession'),
  stopStreamingSession: () => ipcRenderer.invoke('commentary:stopStreamingSession'),
  onStreamingAudioChunk: (callback: (data: { chunk: ArrayBuffer; sessionId: number; isFirst: boolean }) => void) => {
    // Remove ALL existing listeners to prevent duplicates from HMR
    ipcRenderer.removeAllListeners('commentary:streamingChunk')
    ipcRenderer.on('commentary:streamingChunk', (_event, data) => callback(data))
  },
  onStreamingAudioEnd: (callback: (data: { sessionId: number }) => void) => {
    ipcRenderer.removeAllListeners('commentary:streamingEnd')
    ipcRenderer.on('commentary:streamingEnd', (_event, data) => callback(data))
  },
  onStreamingAudioStop: (callback: () => void) => {
    ipcRenderer.removeAllListeners('commentary:streamingStop')
    ipcRenderer.on('commentary:streamingStop', (_event) => callback())
  },
  
  // Debug Logs (Telemetry + Commentary)
  onTelemetryLog: (callback: (data: any) => void) => {
    ipcRenderer.removeAllListeners('logs:telemetry')
    ipcRenderer.on('logs:telemetry', (_event, data) => callback(data))
  },
  onCommentaryLog: (callback: (data: any) => void) => {
    ipcRenderer.removeAllListeners('logs:commentary')
    ipcRenderer.on('logs:commentary', (_event, data) => callback(data))
  },
  saveLogsToFile: (telemetryLogs: any[], commentaryLogs: any[]) => 
    ipcRenderer.invoke('logs:saveToFile', telemetryLogs, commentaryLogs),
  getBufferedLogs: () => 
    ipcRenderer.invoke('logs:getBuffered'),
  
  // Narrative Generation (TV Broadcast Commentary Data)
  generateDriverNarratives: (drivers: any[], seriesName: string, apiKey: string, realDriverData?: any) =>
    ipcRenderer.invoke('narrative:generateDrivers', { drivers, seriesName, apiKey, realDriverData }),
  generateTrackNarrative: (track: any, apiKey: string) =>
    ipcRenderer.invoke('narrative:generateTrack', { track, apiKey }),
  generateTeamNarratives: (teams: any[], seriesName: string, apiKey: string) =>
    ipcRenderer.invoke('narrative:generateTeams', { teams, seriesName, apiKey }),
  getNarrativeProgress: () => ipcRenderer.invoke('narrative:getProgress'),
  onNarrativeProgress: (callback: (data: any) => void) => {
    ipcRenderer.removeAllListeners('narrative:progress')
    ipcRenderer.on('narrative:progress', (_event, data) => callback(data))
  },
  
  // TV Broadcast Content Pool (Pre-race color commentary generation)
  generateContentPool: (context: any, apiKey: string) =>
    ipcRenderer.invoke('commentary:generateContentPool', context, apiKey),
  getPoolContent: (category?: string, lapPhase?: string, voice?: string) =>
    ipcRenderer.invoke('commentary:getPoolContent', category, lapPhase, voice),
  getPoolStats: () => ipcRenderer.invoke('commentary:getPoolStats'),
  clearContentPool: () => ipcRenderer.invoke('commentary:clearContentPool'),
  onContentPoolProgress: (callback: (data: { stage: string; progress: number }) => void) => {
    ipcRenderer.removeAllListeners('commentary:contentPoolProgress')
    ipcRenderer.on('commentary:contentPoolProgress', (_event, data) => callback(data))
  },
  
  // TV Broadcast Scheduler (Continuous commentary system)
  startScheduler: (totalLaps: number) =>
    ipcRenderer.invoke('commentary:startScheduler', totalLaps),
  stopScheduler: () =>
    ipcRenderer.invoke('commentary:stopScheduler'),
  updateSchedulerLap: (currentLap: number) =>
    ipcRenderer.invoke('commentary:updateSchedulerLap', currentLap),
  notifyAudioStarted: () =>
    ipcRenderer.invoke('commentary:audioStarted'),
  notifyAudioEnded: () =>
    ipcRenderer.invoke('commentary:audioEnded'),
  getSchedulerStatus: () =>
    ipcRenderer.invoke('commentary:getSchedulerStatus'),
  configureScheduler: (config: any) =>
    ipcRenderer.invoke('commentary:configureScheduler', config),
})

// Also expose as electronAPI for backward compatibility
contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onMaximizedChange: (callback: (maximized: boolean) => void) => {
    ipcRenderer.on('window:maximized', (_event, maximized) => callback(maximized))
  },
})

// Type definitions for the renderer
declare global {
  interface Window {
    electron: {
      invoke: (channel: string, ...args: any[]) => Promise<any>
      on: (channel: string, callback: (...args: any[]) => void) => () => void
      removeListener: (channel: string, callback: (...args: any[]) => void) => void
      minimizeWindow: () => void
      maximizeWindow: () => void
      closeWindow: () => void
      isMaximized: () => Promise<boolean>
      onMaximizedChange: (callback: (maximized: boolean) => void) => void
      launchAMS2: (gamePath: string) => Promise<{ success: boolean; method?: string; error?: string }>
      validateAMS2Path: (gamePath: string) => Promise<boolean>
      openDirectory: () => Promise<{ canceled: boolean; filePaths: string[] }>
      openFile: (options?: any) => Promise<{ canceled: boolean; filePaths: string[] }>
      startTelemetry: (port?: number) => Promise<{ success: boolean; port: number }>
      stopTelemetry: () => Promise<{ success: boolean }>
      getTelemetryStatus: () => Promise<{ isListening: boolean; port: number }>
      setTelemetryPort: (port: number) => Promise<{ success: boolean; port: number }>
      onTelemetrySession: (callback: (data: any) => void) => void
      onTelemetryParticipants: (callback: (data: any) => void) => void
      onTelemetryHeartbeat: (callback: (data: any) => void) => void
      onTelemetryError: (callback: (error: string) => void) => void
      onTelemetryRaceComplete: (callback: (data: any) => void) => void
      // Session Phase Debug (Crew Chief-style detection)
      getSessionPhaseDebug: () => Promise<{
        currentPhase: string
        previousPhase: string
        leaderHasFinishedRace: boolean
        sessionType: string
        sessionRunningTime: number
        sessionTimeRemaining: number
        raceCompleteEmitted: boolean
        leaderLapsCompleted: number
        sessionLaps: number
        lastPhaseChangeTime: number
        phaseChangeLog: Array<{
          timestamp: number
          from: string
          to: string
          reason: string
          timeAgo: string
        }>
      }>
      forceRaceComplete: () => Promise<{ success: boolean; data?: any; error?: string; message?: string }>
      resetSessionPhase: () => Promise<{ success: boolean }>
      generateAIXML: (data: any) => Promise<any>
      generateCareerAI: (standings: any[], seriesName: string, config: any) => Promise<{ success: boolean; filePath: string; error?: string; driversGenerated: number }>
      generateRaceWeekendAI: (drivers: any[], seriesName: string, config: any, carClassId?: string, aiModifier?: number) => Promise<{ success: boolean; filePath: string; error?: string; driversGenerated: number; modifierApplied?: number }>
      saveCareer: (careerData: unknown) => Promise<void>
      loadCareer: () => Promise<unknown>
      // Commentary (Gemini 3 Flash + ElevenLabs)
      setCommentaryEnabled: (enabled: boolean) => Promise<{ success: boolean; enabled: boolean }>
      setCommentaryAPIKeys: (geminiKey: string, elevenLabsKey: string) => Promise<{ success: boolean }>
      setCommentaryVoice: (voiceId: string, volume: number) => Promise<{ success: boolean }>
      setCommentaryVoices: (leadVoiceId: string, coVoiceId: string, volume: number) => Promise<{ success: boolean }>
      setPitReporterVoice: (voiceId: string) => Promise<{ success: boolean }>
      setCommentaryVolume: (volume: number) => Promise<{ success: boolean; volume: number }>
      stopCommentary: () => Promise<{ success: boolean }>
      getCommentaryVoices: () => Promise<Array<{ id: string; name: string; description: string }>>
      fetchElevenLabsVoices: (apiKey: string) => Promise<{ success: boolean; voices?: any[] }>
      testCommentaryConnection: (apiKey: string) => Promise<{ success: boolean }>
      testCommentaryAudio: () => Promise<{ success: boolean }>
      getCommentaryAudioDevices: () => Promise<{ success: boolean; devices: Array<{ id: string; name: string; isDefault: boolean }> }>
      setCommentaryAudioDevice: (deviceId: string) => Promise<{ success: boolean }>
      setCommentaryCareerData: (data: any) => Promise<{ success: boolean }>
      triggerCommentaryEvent: (eventType: string, context?: any) => Promise<{ success: boolean; message?: string }>
      testCommentaryBanter: (geminiKey: string, elevenLabsKey: string, leadVoice: string, coVoice: string) => Promise<{ success: boolean; leadScript?: string; coScript?: string; message?: string; error?: string }>
      testCommentaryQueueSequence: (geminiKey: string, elevenLabsKey: string, leadVoice: string, coVoice: string) => Promise<{ success: boolean; message?: string; queueStatus?: any; error?: string }>
      getCommentaryQueueStatus: () => Promise<{ live: number; status: number; color: number; preGenerated: number; isProcessing: boolean; isBacklogged: boolean }>
      onCommentaryScript: (callback: (data: any) => void) => void
      onCommentaryTestStarted: (callback: (data: any) => void) => void
      // Streaming audio for low-latency TTS
      testCommentaryStreaming: (geminiKey: string, elevenLabsKey: string, voiceId: string, coVoiceId: string, scenario?: string) => Promise<{
        success: boolean
        firstChunkMs?: number
        totalMs?: number
        totalBytes?: number
        script?: string
        error?: string
      }>
      startStreamingSession: () => Promise<{ success: boolean; sessionId: number }>
      stopStreamingSession: () => Promise<{ success: boolean }>
      onStreamingAudioChunk?: (callback: (data: { chunk: ArrayBuffer; sessionId: number; isFirst: boolean }) => void) => void
      onStreamingAudioEnd?: (callback: (data: { sessionId: number }) => void) => void
      onStreamingAudioStop?: (callback: () => void) => void
      // Debug Logs
      onTelemetryLog?: (callback: (data: any) => void) => void
      onCommentaryLog?: (callback: (data: any) => void) => void
      saveLogsToFile?: (telemetryLogs: any[], commentaryLogs: any[]) => Promise<{ success: boolean; filePath?: string; error?: string }>
      // Narrative Generation (TV Broadcast Commentary Data)
      generateDriverNarratives: (drivers: any[], seriesName: string, apiKey: string, realDriverData?: any) => Promise<{ success: boolean; narratives?: Record<string, any>; error?: string }>
      generateTrackNarrative: (track: any, apiKey: string) => Promise<{ success: boolean; narrative?: any; error?: string }>
      generateTeamNarratives: (teams: any[], seriesName: string, apiKey: string) => Promise<{ success: boolean; narratives?: Record<string, any>; error?: string }>
      getNarrativeProgress: () => Promise<{ total: number; completed: number; currentBatch: string; status: string; error?: string }>
      onNarrativeProgress?: (callback: (data: any) => void) => void
      // TV Broadcast Content Pool
      generateContentPool: (context: any, apiKey: string) => Promise<{ success: boolean; stats?: { total: number; used: number; remaining: number }; error?: string }>
      getPoolContent: (category?: string, lapPhase?: string, voice?: string) => Promise<{ success: boolean; content?: any }>
      getPoolStats: () => Promise<{ success: boolean; stats?: { total: number; used: number; remaining: number } }>
      clearContentPool: () => Promise<{ success: boolean }>
      onContentPoolProgress?: (callback: (data: { stage: string; progress: number }) => void) => void
      // TV Broadcast Scheduler
      startScheduler: (totalLaps: number) => Promise<{ success: boolean }>
      stopScheduler: () => Promise<{ success: boolean }>
      updateSchedulerLap: (currentLap: number) => Promise<{ success: boolean }>
      notifyAudioStarted: () => Promise<{ success: boolean }>
      notifyAudioEnded: () => Promise<{ success: boolean }>
      getSchedulerStatus: () => Promise<{ success: boolean; status?: any }>
      configureScheduler: (config: any) => Promise<{ success: boolean }>
    }
    electronAPI: {
      minimizeWindow: () => void
      maximizeWindow: () => void
      closeWindow: () => void
      isMaximized: () => Promise<boolean>
      onMaximizedChange: (callback: (maximized: boolean) => void) => void
    }
  }
}
