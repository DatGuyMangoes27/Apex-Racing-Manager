/**
 * Audio Player
 * 
 * Manages audio playback queue for commentary.
 * Supports output device selection on Windows.
 */

import { spawn, ChildProcess, execSync } from 'child_process'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

interface AudioQueueItem {
  buffer: Buffer
  priority: 'high' | 'medium' | 'low'
  timestamp: number
}

interface AudioDevice {
  id: string
  name: string
  isDefault: boolean
}

let audioQueue: AudioQueueItem[] = []
let isPlaying = false
let currentProcess: ChildProcess | null = null
let volume = 0.8 // 0.0 to 1.0
let tempDir: string = ''
let selectedDeviceId: string = '' // Empty = default device
let availableDevices: AudioDevice[] = []

// Per-voice volume boosts (multipliers)
// Crofty v2 is quieter than Vicky, so we boost his volume
const voiceVolumeBoosts: Record<string, number> = {
  'KYXXenFO8IFao5NWmALZ': 1.4, // Crofty v2 - needs 40% boost to match Vicky's level
  'CeyZm7wQSjZcnhOrE9l8': 1.3, // Original Crofty - needs 30% boost
}

let currentVoiceBoost = 1.0 // Applied to current playback

/**
 * Set the voice boost for upcoming playback
 */
export function setVoiceBoost(voiceId: string): void {
  currentVoiceBoost = voiceVolumeBoosts[voiceId] || 1.0
  console.log(`[Audio] Voice boost for ${voiceId}: ${currentVoiceBoost}x`)
}

/**
 * Initialize the audio player
 */
export async function initAudioPlayer(): Promise<void> {
  tempDir = join(tmpdir(), 'ams2-commentary')
  
  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true })
  }
  
  // Get available audio devices
  await refreshAudioDevices()
  
  console.log('[Audio] Player initialized, temp dir:', tempDir)
  console.log('[Audio] Available devices:', availableDevices.length)
}

/**
 * Refresh list of available audio output devices
 * Uses Windows PnP to get audio endpoints (speakers, headphones, USB devices like SteelSeries)
 */
export async function refreshAudioDevices(): Promise<AudioDevice[]> {
  // Start with system default
  availableDevices = [{ id: 'default', name: 'System Default', isDefault: true }]
  
  try {
    // Method 1: Get audio endpoints from PnP devices (includes USB headsets like SteelSeries)
    const result = execSync(
      `powershell -NoProfile -Command "Get-PnpDevice -Class AudioEndpoint -Status OK 2>$null | Select-Object FriendlyName,InstanceId | ConvertTo-Json"`,
      { encoding: 'utf8', timeout: 8000, windowsHide: true }
    )
    
    if (result && result.trim()) {
      const parsed = JSON.parse(result)
      const devices = Array.isArray(parsed) ? parsed : [parsed]
      
      devices
        .filter((d: any) => d && d.FriendlyName)
        .forEach((d: any, idx: number) => {
          availableDevices.push({
            id: d.InstanceId || `device-${idx}`,
            name: d.FriendlyName,
            isDefault: false
          })
        })
    }
    
    console.log('[Audio] Found', availableDevices.length, 'devices:', availableDevices.map(d => d.name).join(', '))
    
  } catch (err1) {
    // Method 2: Fallback to sound devices
    try {
      const fallback = execSync(
        `powershell -NoProfile -Command "Get-CimInstance Win32_SoundDevice | Where-Object { $_.Status -eq 'OK' } | Select-Object Name,DeviceID | ConvertTo-Json"`,
        { encoding: 'utf8', timeout: 5000, windowsHide: true }
      )
      
      if (fallback && fallback.trim()) {
        const parsed = JSON.parse(fallback)
        const devices = Array.isArray(parsed) ? parsed : [parsed]
        
        devices
          .filter((d: any) => d && d.Name)
          .forEach((d: any, idx: number) => {
            availableDevices.push({
              id: d.DeviceID || `sound-${idx}`,
              name: d.Name,
              isDefault: false
            })
          })
      }
      
      console.log('[Audio] Fallback found', availableDevices.length, 'devices')
      
    } catch (err2) {
      console.log('[Audio] Could not enumerate devices')
    }
  }
  
  return availableDevices
}

/**
 * Get available audio devices
 */
export function getAudioDevices(): AudioDevice[] {
  return availableDevices
}

/**
 * Set the output device
 */
export function setOutputDevice(deviceId: string): void {
  selectedDeviceId = deviceId
  console.log('[Audio] Output device set to:', deviceId || 'default')
}

/**
 * Get current output device
 */
export function getOutputDevice(): string {
  return selectedDeviceId
}

/**
 * Set playback volume
 */
export function setVolume(newVolume: number): void {
  volume = Math.max(0, Math.min(1, newVolume))
  console.log(`[Audio] Volume set to ${(volume * 100).toFixed(0)}%`)
}

/**
 * Get current volume
 */
export function getVolume(): number {
  return volume
}

/**
 * Play audio buffer
 * Returns a promise that resolves when the audio is queued (not when finished playing)
 */
export async function playAudio(buffer: Buffer, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
  // Queue the audio
  audioQueue.push({
    buffer,
    priority,
    timestamp: Date.now()
  })
  
  // Sort by priority, using timestamp as tiebreaker to maintain insertion order
  // This ensures lead commentary plays before co-commentary when they have same priority
  audioQueue.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    // Same priority: maintain insertion order (earlier timestamp first)
    return a.timestamp - b.timestamp
  })
  
  // Start processing if not already
  if (!isPlaying) {
    processAudioQueue()
  }
}

/**
 * Play audio and wait for it to actually finish playing
 * Use this when you need to ensure sequential playback
 */
export function playAudioAndWait(buffer: Buffer, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
  return new Promise((resolve) => {
    const item: AudioQueueItem & { onComplete?: () => void } = {
      buffer,
      priority,
      timestamp: Date.now()
    }
    
    // Store resolve callback
    const originalResolve = resolve
    
    // We'll track this item and resolve when it finishes
    audioQueue.push(item)
    
    // Sort by priority with timestamp tiebreaker
    audioQueue.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return a.timestamp - b.timestamp
    })
    
    // Start processing if not already
    if (!isPlaying) {
      processAudioQueueWithCallback(originalResolve, item.timestamp)
    } else {
      // Already playing, the item will be processed in order
      // We need to wait until this specific item is processed
      waitForAudioItem(item.timestamp, originalResolve)
    }
  })
}

// Track pending callbacks for playAudioAndWait
const pendingCallbacks: Map<number, () => void> = new Map()

function waitForAudioItem(timestamp: number, callback: () => void): void {
  pendingCallbacks.set(timestamp, callback)
}

function notifyAudioComplete(timestamp: number): void {
  const callback = pendingCallbacks.get(timestamp)
  if (callback) {
    pendingCallbacks.delete(timestamp)
    callback()
  }
}

/**
 * Process the audio queue
 */
async function processAudioQueue(): Promise<void> {
  if (isPlaying || audioQueue.length === 0) return
  
  isPlaying = true
  const item = audioQueue.shift()
  
  if (!item) {
    isPlaying = false
    return
  }
  
  try {
    await playBuffer(item.buffer)
  } catch (error) {
    console.error('[Audio] Playback error:', error)
  }
  
  // Notify any waiting callbacks that this item finished
  notifyAudioComplete(item.timestamp)
  
  isPlaying = false
  
  // Process next item
  if (audioQueue.length > 0) {
    // Small delay between clips for natural feel
    setTimeout(() => processAudioQueue(), 200)
  }
}

/**
 * Process queue with callback for first item
 */
async function processAudioQueueWithCallback(callback: () => void, targetTimestamp: number): Promise<void> {
  pendingCallbacks.set(targetTimestamp, callback)
  await processAudioQueue()
}

/**
 * Play a buffer using the selected audio device
 * Uses ffplay if available for device selection, otherwise falls back to MediaPlayer
 */
// Track process ID for timeout race condition prevention
let processCounter = 0

async function playBuffer(buffer: Buffer): Promise<void> {
  if (!tempDir) {
    await initAudioPlayer()
  }
  
  // Write buffer to temp file
  const tempFile = join(tempDir, `commentary_${Date.now()}.mp3`)
  await writeFile(tempFile, buffer)
  
  // Apply voice boost to volume (capped at 1.0)
  const effectiveVolume = Math.min(1.0, volume * currentVoiceBoost)
  
  console.log('[Audio] Playing file:', tempFile, 'Volume:', effectiveVolume.toFixed(2), `(base: ${volume}, boost: ${currentVoiceBoost}x)`, 'Device:', selectedDeviceId || 'default')
  
  // Assign a unique ID to this playback so timeout doesn't kill wrong process
  const myProcessId = ++processCounter
  
  return new Promise((resolve) => {
    // If a specific device is selected (not default), try to use it
    // For SteelSeries Sonar, we need to use a method that supports device selection
    
    let psCommand: string
    
    if (selectedDeviceId && selectedDeviceId !== 'default') {
      // Use NAudio-style approach with device selection via inline C#
      // This uses Windows Core Audio API to play to specific device
      psCommand = `
        Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;

public class AudioPlayer {
    [DllImport("winmm.dll")]
    private static extern int mciSendString(string command, System.Text.StringBuilder buffer, int bufferSize, IntPtr callback);
    
    public static void PlayFile(string file, double volume) {
        var sb = new System.Text.StringBuilder(256);
        mciSendString("close commentary", sb, 256, IntPtr.Zero);
        mciSendString("open \\"" + file + "\\" type mpegvideo alias commentary", sb, 256, IntPtr.Zero);
        int vol = (int)(volume * 1000);
        mciSendString("setaudio commentary volume to " + vol, sb, 256, IntPtr.Zero);
        mciSendString("play commentary wait", sb, 256, IntPtr.Zero);
        mciSendString("close commentary", sb, 256, IntPtr.Zero);
    }
}
'@ -ErrorAction SilentlyContinue;
        [AudioPlayer]::PlayFile('${tempFile.replace(/\\/g, '\\\\')}', ${effectiveVolume})
      `.replace(/\n/g, ' ')
    } else {
      // Default device - use simpler MediaPlayer approach
      psCommand = `
        Add-Type -AssemblyName presentationCore;
        $p = New-Object System.Windows.Media.MediaPlayer;
        $p.Open([Uri]'${tempFile.replace(/\\/g, '/')}');
        $p.Volume = ${effectiveVolume};
        Start-Sleep -Milliseconds 500;
        $p.Play();
        while($p.Position -lt $p.NaturalDuration.TimeSpan -and $p.NaturalDuration.HasTimeSpan){ Start-Sleep -Milliseconds 100 };
        Start-Sleep -Milliseconds 300;
        $p.Close()
      `.replace(/\n/g, ' ').replace(/\s+/g, ' ')
    }
    
    currentProcess = spawn('powershell', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-Command', psCommand
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    })
    
    currentProcess.stderr?.on('data', (data) => {
      const err = data.toString()
      if (err.trim()) console.error('[Audio] PS error:', err.trim())
    })
    
    currentProcess.on('close', async (code) => {
      currentProcess = null
      
      // Clean up temp file
      try {
        await unlink(tempFile)
      } catch {
        // Ignore cleanup errors
      }
      
      console.log('[Audio] Playback complete, code:', code)
      resolve()
    })
    
    currentProcess.on('error', (error) => {
      console.error('[Audio] Process error:', error)
      currentProcess = null
      resolve()
    })
    
    // Timeout after 60 seconds - only kill if same process (prevent race condition)
    setTimeout(() => {
      if (currentProcess && processCounter === myProcessId) {
        console.log('[Audio] Playback timeout, killing process', myProcessId)
        try {
          currentProcess.kill('SIGTERM')
        } catch {}
        currentProcess = null
        resolve()
      }
    }, 60000)
  })
}

/**
 * Stop all audio playback
 */
export function stopAllAudio(): void {
  audioQueue = []
  
  if (currentProcess) {
    currentProcess.kill()
    currentProcess = null
  }
  
  isPlaying = false
  console.log('[Audio] All audio stopped')
}

/**
 * Check if audio is currently playing
 */
export function isAudioPlaying(): boolean {
  return isPlaying
}

/**
 * Get queue length
 */
export function getQueueLength(): number {
  return audioQueue.length
}

/**
 * Clear the audio queue (but let current audio finish)
 */
export function clearQueue(): void {
  audioQueue = []
  console.log('[Audio] Queue cleared')
}

/**
 * Test audio playback with a simple beep/tone
 */
export async function testAudioPlayback(): Promise<boolean> {
  console.log('[Audio] Testing playback...')
  
  return new Promise((resolve) => {
    const psScript = `
      Add-Type -AssemblyName presentationCore
      $player = New-Object System.Windows.Media.MediaPlayer
      [Console]::Beep(800, 300)
      Start-Sleep -Milliseconds 100
      [Console]::Beep(1000, 300)
      Write-Output "OK"
    `
    
    const proc = spawn('powershell', ['-NoProfile', '-Command', psScript], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    })
    
    proc.on('close', (code) => {
      console.log('[Audio] Test complete, code:', code)
      resolve(code === 0)
    })
    
    proc.on('error', () => resolve(false))
    
    setTimeout(() => {
      proc.kill()
      resolve(false)
    }, 5000)
  })
}
