/**
 * Streaming Audio Player - PCM Version with Jitter Buffering (v2 - Robust Timing)
 * 
 * Uses Web Audio API to play PCM audio chunks as they arrive.
 * Implements a jitter buffer (pre-roll) to prevent static caused by network timing.
 */

declare global {
  interface Window {
    __streamingAudioState?: StreamingAudioState
  }
}

interface StreamingAudioState {
  audioContext: AudioContext | null
  gainNode: GainNode | null
  nextStartTime: number
  isPlaying: boolean
  volume: number
  voiceBoost: number // Per-voice volume multiplier
  instanceId: string
  ipcSetup: boolean
  activeSources: AudioBufferSourceNode[]
  leftoverByte: number | null
  // Buffering for jitter handling
  bufferQueue: Int16Array[]
  isBuffering: boolean
  minBufferMs: number 
  // PCM settings
  sampleRate: number
  channels: number
  // Track first chunk for fade-in
  isFirstChunkPlayed: boolean
}

// Voice boost map - Crofty v2 is quieter than Vicky
const VOICE_BOOSTS: Record<string, number> = {
  'byILgTtsBg1jwbuvslb2': 1.2, // Crofty V3
  'cmPhBFoVi6Q3CAWAx2Gr': 1.0, // Brundle
  'KYXXenFO8IFao5NWmALZ': 1.4, // Crofty v2 - needs 40% boost
  'CeyZm7wQSjZcnhOrE9l8': 1.3, // Original Crofty - needs 30% boost
}

function getState(): StreamingAudioState {
  if (!window.__streamingAudioState) {
    window.__streamingAudioState = {
      audioContext: null,
      gainNode: null,
      nextStartTime: 0,
      isPlaying: false,
      volume: 0.8,
      voiceBoost: 1.2, // Default boost for Crofty V3 (the default lead voice)
      instanceId: Math.random().toString(36).slice(2),
      ipcSetup: false,
      activeSources: [],
      leftoverByte: null,
      bufferQueue: [],
      isBuffering: true,
      minBufferMs: 300, // 300ms pre-roll for better quality with multilingual model
      sampleRate: 24000, // 24kHz for better quality
      channels: 1,
      isFirstChunkPlayed: false
    }
  }
  return window.__streamingAudioState
}

export function initStreamingAudio(): boolean {
  const state = getState()
  if (state.audioContext) return true
  
  try {
    state.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    state.gainNode = state.audioContext.createGain()
    state.gainNode.connect(state.audioContext.destination)
    // Apply voice boost (capped at 1.0 to prevent clipping)
    const effectiveVolume = Math.min(1.0, state.volume * state.voiceBoost)
    state.gainNode.gain.value = effectiveVolume
    console.log('[StreamingAudio v2] Initialized')
    return true
  } catch (error) {
    console.error('[StreamingAudio] Failed to initialize:', error)
    return false
  }
}

export function setStreamingVolume(vol: number): void {
  const state = getState()
  state.volume = Math.max(0, Math.min(1, vol))
  // Apply voice boost (capped at 1.0 to prevent clipping)
  const effectiveVolume = Math.min(1.0, state.volume * state.voiceBoost)
  if (state.gainNode) state.gainNode.gain.value = effectiveVolume
}

export function setStreamingVoiceBoost(voiceId: string): void {
  const state = getState()
  state.voiceBoost = VOICE_BOOSTS[voiceId] || 1.0
  console.log(`[StreamingAudio] Voice boost for ${voiceId}: ${state.voiceBoost}x`)
  // Re-apply volume with new boost
  const effectiveVolume = Math.min(1.0, state.volume * state.voiceBoost)
  if (state.gainNode) state.gainNode.gain.value = effectiveVolume
}

export function startStreamingSession(): number {
  const state = getState()
  if (!state.audioContext) initStreamingAudio()
  if (state.audioContext?.state === 'suspended') state.audioContext.resume()
  
  // DON'T call stopStreamingSession() here - let current audio play out!
  // Just reset the buffering state for the new stream
  
  state.isPlaying = true
  // Don't reset nextStartTime - let new audio queue after current audio
  // This ensures seamless transitions between events
  state.leftoverByte = null
  state.bufferQueue = []
  state.isBuffering = true
  state.isFirstChunkPlayed = false
  
  console.log('[StreamingAudio v2] Started session (Jitter Buffer: 300ms)')
  return 1
}

export function stopStreamingSession(): void {
  const state = getState()
  state.isPlaying = false
  for (const source of state.activeSources) {
    try { source.stop(); source.disconnect(); } catch {}
  }
  state.activeSources = []
  state.bufferQueue = []
}

function playPCMChunk(pcmData: Int16Array, state: StreamingAudioState, isFirstChunk: boolean = false): void {
  if (!state.audioContext || !state.gainNode || !state.isPlaying || pcmData.length === 0) return
  
  const audioBuffer = state.audioContext.createBuffer(state.channels, pcmData.length, state.sampleRate)
  const channelData = audioBuffer.getChannelData(0)
  
  // Only apply fade-in on the FIRST chunk of a stream (prevents click at start)
  // Don't fade between chunks - they should seamlessly join
  const fadeLength = isFirstChunk ? Math.min(48, pcmData.length) : 0 // 2ms at 24kHz
  
  for (let i = 0; i < pcmData.length; i++) {
    let sample = pcmData[i] / 32768.0
    
    // Only fade-in on first chunk
    if (isFirstChunk && i < fadeLength) {
      sample *= (i / fadeLength)
    }
    
    channelData[i] = sample
  }

  const source = state.audioContext.createBufferSource()
  source.buffer = audioBuffer
  source.connect(state.gainNode)

  const now = state.audioContext.currentTime
  
  // If nextStartTime is too far in the past, reset to now with small buffer
  let startTime = state.nextStartTime
  if (startTime < now) {
    startTime = now + 0.01 // 10ms buffer for first chunk
  }
  
  source.start(startTime)
  state.nextStartTime = startTime + audioBuffer.duration
  
  state.activeSources.push(source)
  source.onended = () => {
    state.activeSources = state.activeSources.filter(s => s !== source)
  }
}

export async function playAudioChunk(chunk: any, _sessionId: number): Promise<void> {
  const state = getState()
  if (!state.isPlaying) {
    console.warn('[StreamingAudio] Chunk dropped - session not active')
    return
  }

  let rawData: Uint8Array
  if (chunk instanceof Uint8Array) rawData = chunk
  else if (chunk instanceof ArrayBuffer) rawData = new Uint8Array(chunk)
  else if (chunk?.data) rawData = new Uint8Array(chunk.data)
  else return

  // Alignment handling
  let workingData = rawData
  if (state.leftoverByte !== null) {
    const combined = new Uint8Array(rawData.length + 1)
    combined[0] = state.leftoverByte
    combined.set(rawData, 1)
    state.leftoverByte = null
    workingData = combined
  }
  if (workingData.length % 2 !== 0) {
    state.leftoverByte = workingData[workingData.length - 1]
    workingData = workingData.slice(0, -1)
  }
  if (workingData.length === 0) return

  const numSamples = workingData.length / 2
  const pcmData = new Int16Array(numSamples)
  const view = new DataView(workingData.buffer, workingData.byteOffset, workingData.byteLength)
  for (let i = 0; i < numSamples; i++) {
    pcmData[i] = view.getInt16(i * 2, true)
  }

  if (state.isBuffering) {
    state.bufferQueue.push(pcmData)
    const currentBufferedSamples = state.bufferQueue.reduce((acc, q) => acc + q.length, 0)
    const currentBufferedMs = (currentBufferedSamples / state.sampleRate) * 1000
    
    if (currentBufferedMs >= state.minBufferMs) {
      console.log(`[StreamingAudio v2] Threshold reached (${currentBufferedMs.toFixed(0)}ms), starting playback`)
      state.isBuffering = false
      let isFirst = !state.isFirstChunkPlayed
      while (state.bufferQueue.length > 0) {
        const next = state.bufferQueue.shift()
        if (next) {
          playPCMChunk(next, state, isFirst)
          if (isFirst) {
            state.isFirstChunkPlayed = true
            isFirst = false
          }
        }
      }
    }
  } else {
    const isFirst = !state.isFirstChunkPlayed
    playPCMChunk(pcmData, state, isFirst)
    if (isFirst) state.isFirstChunkPlayed = true
  }
}

export async function flushStreamingBuffer(_sessionId: number): Promise<void> {
  const state = getState()
  if (state.isBuffering && state.bufferQueue.length > 0) {
    state.isBuffering = false
    while (state.bufferQueue.length > 0) {
      const next = state.bufferQueue.shift()
      if (next) playPCMChunk(next, state)
    }
  }
  console.log('[StreamingAudio v2] Stream complete')
}

export function setupStreamingAudioIPC(): void {
  const state = getState()
  if (state.ipcSetup || typeof window === 'undefined' || !window.electron) return
  
  // Single listener setup - preload.ts handles clearing duplicates
  window.electron.onStreamingAudioChunk?.((data: any) => {
    // Auto-start session on first chunk of a new stream
    if (data.isFirst) {
      console.log('[StreamingAudio v2] Auto-starting session on first chunk')
      startStreamingSession()
    }
    playAudioChunk(data.chunk, data.sessionId)
  })
  window.electron.onStreamingAudioEnd?.((data: any) => {
    flushStreamingBuffer(data.sessionId)
  })
  window.electron.onStreamingAudioStop?.(() => {
    stopStreamingSession()
  })
  
  state.ipcSetup = true
  console.log('[StreamingAudio v2] IPC Ready')
}
