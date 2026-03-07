/**
 * Voice Synthesis
 * 
 * Uses ElevenLabs API to convert commentary scripts to speech.
 * Supports streaming for lower latency.
 */

import https from 'https'

interface VoiceSettings {
  stability: number
  similarity_boost: number
  style: number
  use_speaker_boost: boolean
  speed?: number // 0.7 to 1.2 range
}

const CROFTY_VOICE_ID = 'byILgTtsBg1jwbuvslb2'
const VOICE_ID_PATTERN = /^[A-Za-z0-9]{16,64}$/

// Crofty v2 voice settings (tuned for his cloned voice)
const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.50,         // 50% - balanced stability
  similarity_boost: 0.75,  // 75% - higher fidelity to original voice
  style: 0.30,             // 30% - moderate expressiveness
  use_speaker_boost: true,
  speed: 1.0               // Normal speed
}

const VOICE_SETTINGS_OVERRIDES: Record<string, Partial<VoiceSettings>> = {
  // Reduce shoutiness for Crofty in v3
  [CROFTY_VOICE_ID]: {
    stability: 1.0,
    similarity_boost: 0.70,
    style: 0.12,
    speed: 0.95
  }
}

// Default ElevenLabs model ID
// v3 is now production-ready and supports streaming
const PRIMARY_TTS_MODEL_ID = 'eleven_v3'

const normalizeV3Stability = (value: number): 0 | 0.5 | 1 => {
  if (value <= 0.25) return 0
  if (value <= 0.75) return 0.5
  return 1
}

const resolveVoiceSettings = (voiceId: string, settings: Partial<VoiceSettings>): VoiceSettings => {
  const overrides = VOICE_SETTINGS_OVERRIDES[voiceId] || {}
  const resolved = { ...DEFAULT_VOICE_SETTINGS, ...overrides, ...settings }
  if (PRIMARY_TTS_MODEL_ID === 'eleven_v3') {
    resolved.stability = normalizeV3Stability(resolved.stability)
  }
  return resolved
}

const resolveRequestedVoiceId = async (requestedVoiceId: string, apiKey: string): Promise<string> => {
  const trimmed = (requestedVoiceId || '').trim()

  // Already a proper ElevenLabs voice id, use directly.
  if (VOICE_ID_PATTERN.test(trimmed)) {
    return trimmed
  }

  const availableVoices = await getAvailableVoices(apiKey)
  if (!availableVoices.length) {
    // If we cannot fetch voices, keep backward compatibility with requested value,
    // or fall back to Crofty if nothing was provided.
    return trimmed || CROFTY_VOICE_ID
  }

  if (!trimmed) {
    const fallback = availableVoices[0]?.voice_id || CROFTY_VOICE_ID
    console.warn('[Voice] Empty voice ID provided, defaulting to first available voice')
    return fallback
  }

  const normalized = trimmed.toLowerCase()
  const exactNameMatch = availableVoices.find(v => v.name?.toLowerCase() === normalized)
  if (exactNameMatch?.voice_id) {
    console.log(`[Voice] Resolved preset "${trimmed}" to voice ID ${exactNameMatch.voice_id.slice(0, 8)}...`)
    return exactNameMatch.voice_id
  }

  const partialNameMatch = availableVoices.find(v => v.name?.toLowerCase().includes(normalized))
  if (partialNameMatch?.voice_id) {
    console.log(`[Voice] Resolved voice alias "${trimmed}" to ${partialNameMatch.voice_id.slice(0, 8)}...`)
    return partialNameMatch.voice_id
  }

  const fallback = availableVoices[0]?.voice_id || CROFTY_VOICE_ID
  console.warn(`[Voice] Could not resolve voice "${trimmed}", using first available voice`)
  return fallback
}

/**
 * Synthesize speech using ElevenLabs (Node https module for Electron compatibility)
 */
export function synthesizeSpeech(
  text: string,
  apiKey: string,
  voiceId: string = CROFTY_VOICE_ID, // Crofty v2 - Lead commentator
  settings: Partial<VoiceSettings> = {}
): Promise<Buffer | null> {
  return new Promise((resolve) => {
    if (!apiKey) {
      console.error('[Voice] No API key provided')
      resolve(null)
      return
    }
    
    if (!text || text.length === 0) {
      console.error('[Voice] No text provided')
      resolve(null)
      return
    }
    
    void resolveRequestedVoiceId(voiceId, apiKey).then((resolvedVoiceId) => {
      const voiceSettings = resolveVoiceSettings(resolvedVoiceId, settings)
      
      const buildPostData = () => JSON.stringify({
        text,
        model_id: PRIMARY_TTS_MODEL_ID,
        voice_settings: {
          stability: voiceSettings.stability,
          similarity_boost: voiceSettings.similarity_boost,
          style: voiceSettings.style,
          use_speaker_boost: voiceSettings.use_speaker_boost
        },
        speed: voiceSettings.speed || 1.0 // Speed is top-level parameter
      })
      
      const attemptSynthesis = (): Promise<Buffer | null> => {
        return new Promise((attemptResolve) => {
          const postData = buildPostData()
          
          const options = {
            hostname: 'api.elevenlabs.io',
            port: 443,
            path: `/v1/text-to-speech/${resolvedVoiceId}`,
            method: 'POST',
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': apiKey,
              'Content-Length': Buffer.byteLength(postData)
            }
          }
          
          console.log(`[Voice] Synthesizing (${PRIMARY_TTS_MODEL_ID}) with ${resolvedVoiceId.slice(0, 8)}...:`, text.substring(0, 50) + '...')
          
          const req = https.request(options, (res) => {
            const chunks: Buffer[] = []
            
            res.on('data', (chunk) => {
              chunks.push(chunk)
            })
            
            res.on('end', () => {
              if (res.statusCode === 200) {
                const audioBuffer = Buffer.concat(chunks)
                console.log('[Voice] Synthesis complete, audio size:', audioBuffer.length, 'bytes')
                attemptResolve(audioBuffer)
              } else {
                const errorText = Buffer.concat(chunks).toString()
                console.error(`[Voice] API error (${PRIMARY_TTS_MODEL_ID}):`, res.statusCode, errorText)
                attemptResolve(null)
              }
            })
          })
          
          req.on('error', (error) => {
            console.error('[Voice] Synthesis error:', error.message)
            attemptResolve(null)
          })
          
          req.setTimeout(30000, () => {
            console.error('[Voice] Synthesis timeout')
            req.destroy()
            attemptResolve(null)
          })
          
          req.write(postData)
          req.end()
        })
      }
      
      attemptSynthesis().then(resolve)
    }).catch((error) => {
      console.error('[Voice] Failed to resolve voice ID:', error)
      resolve(null)
    })
  })
}

/**
 * Streaming speech synthesis using ElevenLabs streaming endpoint
 * 
 * Streams audio chunks as they're generated for much lower latency.
 * First audio chunk arrives in ~200-400ms instead of waiting 3-5 seconds for full audio.
 * 
 * @param text - Text to synthesize
 * @param apiKey - ElevenLabs API key
 * @param voiceId - Voice ID to use
 * @param onChunk - Callback called with each audio chunk as it arrives
 * @param latencyOptimization - 0-4, higher = lower latency (default: 3 for max speed)
 * @param settings - Optional voice settings
 * @returns Promise with timing info: { firstChunkMs, totalMs, totalBytes }
 */
export function synthesizeSpeechStreaming(
  text: string,
  apiKey: string,
  voiceId: string = CROFTY_VOICE_ID, // Crofty v2 - Lead commentator
  onChunk: (chunk: Buffer, isFirst: boolean) => void,
  latencyOptimization: 0 | 1 | 2 | 3 | 4 = 3,
  settings: Partial<VoiceSettings> = {}
): Promise<{ success: boolean; firstChunkMs?: number; totalMs?: number; totalBytes?: number; error?: string }> {
  return new Promise((resolve) => {
    if (!apiKey) {
      console.error('[Voice] No API key provided')
      resolve({ success: false, error: 'No API key provided' })
      return
    }
    
    if (!text || text.length === 0) {
      console.error('[Voice] No text provided')
      resolve({ success: false, error: 'No text provided' })
      return
    }
    
    void resolveRequestedVoiceId(voiceId, apiKey).then((resolvedVoiceId) => {
      const voiceSettings = resolveVoiceSettings(resolvedVoiceId, settings)
      const startTime = Date.now()
      let firstChunkTime: number | null = null
      let totalBytes = 0
      let isFirstChunk = true
      
      const buildPostData = () => JSON.stringify({
        text,
        model_id: PRIMARY_TTS_MODEL_ID,
        voice_settings: {
          stability: voiceSettings.stability,
          similarity_boost: voiceSettings.similarity_boost,
          style: voiceSettings.style,
          use_speaker_boost: voiceSettings.use_speaker_boost
        },
        speed: voiceSettings.speed || 1.0 // Speed is top-level parameter
        // output_format and optimize_streaming_latency are set via query parameters
      })

      const fallbackToNonStreaming = async (
        attemptResolve: (value: { success: boolean; firstChunkMs?: number; totalMs?: number; totalBytes?: number; error?: string }) => void,
        reason: string
      ): Promise<void> => {
        console.warn(`[Voice] Streaming unavailable, falling back to standard TTS: ${reason}`)
        const fallbackStart = Date.now()
        const fallbackAudio = await synthesizeSpeech(text, apiKey, resolvedVoiceId, settings)
        if (!fallbackAudio || fallbackAudio.length === 0) {
          attemptResolve({ success: false, error: `Fallback synthesis failed (${reason})` })
          return
        }

        const firstChunkMs = fallbackStart - startTime
        totalBytes += fallbackAudio.length
        try {
          onChunk(fallbackAudio, true)
        } catch (err) {
          console.error('[Voice] Error in fallback chunk handler:', err)
        }

        const totalMs = Date.now() - startTime
        console.log(`[Voice] Fallback synthesis complete: ${totalBytes} bytes in ${totalMs}ms`)
        attemptResolve({
          success: true,
          firstChunkMs,
          totalMs,
          totalBytes
        })
      }
      
      const attemptStreaming = (): Promise<{ success: boolean; firstChunkMs?: number; totalMs?: number; totalBytes?: number; error?: string }> => {
        return new Promise((attemptResolve) => {
          const postData = buildPostData()
          
          // Use 24kHz PCM for better quality (22050 is also good if 24000 has issues)
          const optimizeLatencyParam = PRIMARY_TTS_MODEL_ID === 'eleven_v3'
            ? ''
            : `&optimize_streaming_latency=${latencyOptimization}`
          const options = {
            hostname: 'api.elevenlabs.io',
            port: 443,
            path: `/v1/text-to-speech/${resolvedVoiceId}/stream?output_format=pcm_24000${optimizeLatencyParam}`,
            method: 'POST',
            headers: {
              'Accept': '*/*', // Accept any format - let output_format control it
              'Content-Type': 'application/json',
              'xi-api-key': apiKey,
              'Content-Length': Buffer.byteLength(postData)
            }
          }
          
          console.log(`[Voice] Streaming synthesis starting (${PRIMARY_TTS_MODEL_ID}, latency ${latencyOptimization}, voice ${resolvedVoiceId.slice(0, 8)}...):`, text.substring(0, 50) + '...')
          
          const req = https.request(options, (res) => {
            if (res.statusCode !== 200) {
              let errorData = ''
              res.on('data', (chunk) => { errorData += chunk })
              res.on('end', async () => {
                console.error(`[Voice] Stream API error (${PRIMARY_TTS_MODEL_ID}):`, res.statusCode, errorData)
                if (res.statusCode === 404) {
                  await fallbackToNonStreaming(attemptResolve, '404 Not Found')
                  return
                }
                attemptResolve({ success: false, error: `API error: ${res.statusCode}` })
              })
              return
            }
            
            res.on('data', (chunk: Buffer) => {
              const now = Date.now()
              const isCurrentFirstChunk = isFirstChunk
              
              if (isFirstChunk) {
                firstChunkTime = now - startTime
                console.log(`[Voice] First chunk received in ${firstChunkTime}ms, size: ${chunk.length} bytes`)
                isFirstChunk = false
              }
              
              totalBytes += chunk.length
              
              // Call the chunk handler
              try {
                onChunk(chunk, isCurrentFirstChunk)
              } catch (err) {
                console.error('[Voice] Error in chunk handler:', err)
              }
            })
            
            res.on('end', () => {
              const totalTime = Date.now() - startTime
              console.log(`[Voice] Streaming complete: ${totalBytes} bytes in ${totalTime}ms (first chunk: ${firstChunkTime}ms)`)
              attemptResolve({
                success: true,
                firstChunkMs: firstChunkTime || 0,
                totalMs: totalTime,
                totalBytes
              })
            })
            
            res.on('error', (error) => {
              console.error('[Voice] Stream response error:', error.message)
              attemptResolve({ success: false, error: error.message })
            })
          })
          
          req.on('error', (error) => {
            console.error('[Voice] Stream request error:', error.message)
            attemptResolve({ success: false, error: error.message })
          })
          
          req.setTimeout(60000, () => {
            console.error('[Voice] Streaming timeout')
            req.destroy()
            attemptResolve({ success: false, error: 'Timeout' })
          })
          
          req.write(postData)
          req.end()
        })
      }
      
      attemptStreaming().then(resolve)
    }).catch((error) => {
      console.error('[Voice] Failed to resolve voice ID for streaming:', error)
      resolve({ success: false, error: 'Voice ID resolution failed' })
    })
  })
}

/**
 * Get available voices from ElevenLabs (using Node https)
 */
export function getAvailableVoices(apiKey: string): Promise<Array<{
  voice_id: string
  name: string
  preview_url: string
  labels: Record<string, string>
}>> {
  return new Promise((resolve) => {
    if (!apiKey) {
      resolve([])
      return
    }
    
    const options = {
      hostname: 'api.elevenlabs.io',
      port: 443,
      path: '/v1/voices',
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': apiKey
      }
    }
    
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data)
            resolve(json.voices || [])
          } catch {
            resolve([])
          }
        } else {
          resolve([])
        }
      })
    })
    
    req.on('error', () => resolve([]))
    req.setTimeout(10000, () => { req.destroy(); resolve([]) })
    req.end()
  })
}

/**
 * Test voice connection using Node's https module (more reliable in Electron)
 */
export function testVoiceConnection(apiKey: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!apiKey) {
      console.error('[Voice] No API key provided for connection test')
      resolve(false)
      return
    }
    
    console.log('[Voice] Testing connection with key:', apiKey.substring(0, 8) + '...')
    
    const options = {
      hostname: 'api.elevenlabs.io',
      port: 443,
      path: '/v1/user',
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': apiKey
      }
    }
    
    const req = https.request(options, (res) => {
      console.log('[Voice] Connection test response status:', res.statusCode)
      
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data)
            console.log('[Voice] Connection successful, user tier:', json.subscription?.tier || 'unknown')
          } catch {
            console.log('[Voice] Connection successful')
          }
          resolve(true)
        } else {
          console.error('[Voice] Connection test failed:', res.statusCode, data)
          resolve(false)
        }
      })
    })
    
    req.on('error', (error) => {
      console.error('[Voice] Connection test error:', error.message)
      resolve(false)
    })
    
    req.setTimeout(10000, () => {
      console.error('[Voice] Connection test timeout')
      req.destroy()
      resolve(false)
    })
    
    req.end()
  })
}

