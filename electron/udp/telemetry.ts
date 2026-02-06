import { ipcMain, BrowserWindow } from 'electron'
import * as dgram from 'dgram'
import { feedTelemetryToCommentary, feedRaceCompleteToCommentary } from '../commentary'

/**
 * AMS2 UDP Telemetry Parser - PROJECT CARS 1 FORMAT
 * 
 * AMS2 uses the PCARS1 UDP format (NOT PCARS2!)
 * The telemetry packet is 1367 bytes and contains all data in one struct.
 * 
 * Key differences from PCARS2:
 * - No PacketBase header
 * - Game state and session state are combined in one byte
 * - Single large packet instead of multiple packet types
 */

interface TelemetryState {
  isListening: boolean
  socket: dgram.Socket | null
  port: number
}

interface ParticipantInfo {
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

interface SessionInfo {
  sessionType: string
  sessionState: string
  trackName: string
  trackLength: number
  numParticipants: number
  lapsInEvent: number
  timeRemaining: number
  raceState: string
  viewedParticipantIndex: number
  ambientTemp: number
  trackTemp: number
  currentLapTime: number
  bestLapTime: number
  lastLapTime: number
  speed: number
  rpm: number
  gear: number
}

const state: TelemetryState = {
  isListening: false,
  socket: null,
  port: 5606
}

// Debug counter for logging (reset on each listener start)
let debugPacketCount = 0

// Race state tracking for detecting race completion
let previousRaceState: string = ''
let previousSessionType: string = ''
let raceCompleteEmitted = false
// Track if we've been racing at any point this session (handles intermediate states like yellow flags, pauses)
let hasBeenRacingThisSession = false

// PCARS1 Game states (lower 4 bits of gameSessionState byte)
const GAME_STATES: Record<number, string> = {
  0: 'Exited',
  1: 'Front End',
  2: 'Ingame Playing',
  3: 'Ingame Paused',
  4: 'Ingame In Menu',
  5: 'Ingame Replay',
  6: 'Ingame Multi-Player Replay'
}

// PCARS1 Session states (upper 4 bits of gameSessionState byte)
const SESSION_STATES: Record<number, string> = {
  0: 'Invalid',
  1: 'Practice',
  2: 'Test',
  3: 'Qualifying',
  4: 'Formation Lap',
  5: 'Race',
  6: 'Time Trial'
}

// Race states (from raceStateFlags)
const RACE_STATES: Record<number, string> = {
  0: 'Invalid',
  1: 'Not Started',
  2: 'Racing',
  3: 'Finished',
  4: 'Disqualified',
  5: 'Retired',
  6: 'DNF'
}

// Helper to read a null-terminated string from buffer
function readString(buffer: Buffer, offset: number, maxLength: number): string {
  if (offset + maxLength > buffer.length) {
    return ''
  }
  const bytes = buffer.slice(offset, offset + maxLength)
  const nullIndex = bytes.indexOf(0)
  const str = bytes.slice(0, nullIndex > 0 ? nullIndex : maxLength).toString('utf8')
  return str.replace(/[^\x20-\x7E]/g, '').trim()
}

/**
 * Parse PCARS1 Telemetry Packet (1367 bytes)
 * 
 * Based on PCARS1 SDK and SecondMonitor project:
 * https://gitlab.com/winzarten/SecondMonitor
 * 
 * Structure (verified offsets):
 * 0-1:   buildVersionNumber (u16)
 * 2:     packetType/sequenceNumber combined byte
 *        - Lower 2 bits: packet type (0 = car physics, 1 = participants, 2 = timings)
 *        - Upper 6 bits: sequence number
 * 3:     gameSessionState combined byte
 *        - Lower 4 bits: game state (0-6)
 *        - Upper 4 bits: session state (0-6)
 * 4:     viewedParticipantIndex (s8)
 * 5:     numParticipants (s8)
 * 6-9:   unfilteredThrottle, Brake, Steering, Clutch
 * 10:    raceStateFlags (u8) - lower 3 bits = race state
 * 11:    lapsInEvent (u8)
 * 12-15: bestLapTime (f32)
 * 16-19: lastLapTime (f32)
 * 20-23: currentTime (f32)
 * 24-35: split times (f32 x 3)
 * 36-39: eventTimeRemaining (f32)
 * 40-47: fastest lap times (f32 x 2)
 * 48-95: sector times (f32 x 12)
 * 96:    joyPad (u8)
 * 97:    highestFlag (u8)
 * 98:    pitModeSchedule (u8)
 * 99-100: oilTempCelsius (s16)
 * 101-102: oilPressureKPa (u16)
 * 103-104: waterTempCelsius (s16)
 * 105-106: waterPressureKPa (u16)
 * 107-108: fuelPressureKPa (u16)
 * 109:   carFlags (u8)
 * 110:   fuelCapacity (u8)
 * 111:   brake (u8)
 * 112:   throttle (u8)
 * 113:   clutch (u8)
 * 114:   steering (s8)
 * 115-118: fuelLevel (f32)
 * 119-122: speed (f32) - m/s
 * 123-124: rpm (u16)
 * 125-126: maxRpm (u16)
 * 127:   gearNumGears (u8) - low nibble = gear, high nibble = numGears
 * 128:   boostAmount (u8)
 * 129:   enforcedPitStopLap (s8)
 * 130:   crashState (u8)
 * 131-134: odometerKM (f32)
 * 135-206: orientation, velocity, acceleration vectors
 * 207-218: extentsCentre (f32 x 3)
 * 219-558: tyre data (85 bytes x 4 tyres)
 * 559-566: terrain (u8 x 4), tyreY (f32)
 * ... more car data ...
 * 
 * Participant Info Array (16 entries, 16 bytes each) starts at offset 584:
 * Each entry: worldPos[3](s16), currentLapDist(u16), racePos(u8), lapsCompleted(u8),
 *             currentLap(u8), sector(u8), lastSectorTime(f32)
 * 
 * After participant info (at ~840):
 * 840:   unfilteredThrottle2 (u8)
 * ...
 * 
 * Track info (at offset 948):
 * 948-1011: trackLocation (64 char string)
 * 1012-1075: trackVariation (64 char string)
 * 
 * Participant Names (at offset 1076, 64 bytes each, up to 16):
 * 1076-1139: participant 0 name
 * 1140-1203: participant 1 name
 * ... etc
 */
function parsePCARS1Packet(buffer: Buffer): { 
  session: Partial<SessionInfo>, 
  participants: ParticipantInfo[], 
  playerIndex: number,
  packetType: number
} {
  const participants: ParticipantInfo[] = []
  
  if (buffer.length < 100) {
    return { session: {}, participants, playerIndex: -1, packetType: -1 }
  }
  
  // Offset 0-1: Build version
  const buildVersion = buffer.readUInt16LE(0)
  
  // Offset 2: Packet type / sequence combined byte
  const packetTypeByte = buffer.readUInt8(2)
  const packetType = packetTypeByte & 0x03 // Lower 2 bits
  const sequenceNumber = (packetTypeByte >> 2) & 0x3F // Upper 6 bits
  
  // Offset 3: Game/Session state combined byte
  const gameSessionState = buffer.readUInt8(3)
  const gameState = gameSessionState & 0x0F // Lower 4 bits
  const sessionState = (gameSessionState >> 4) & 0x0F // Upper 4 bits
  
  // Offset 4-5: Participant info
  const viewedParticipantIndex = buffer.readInt8(4)
  const numParticipants = buffer.readInt8(5)
  
  // Offset 10: Race state flags
  const raceStateFlags = buffer.readUInt8(10)
  const raceState = raceStateFlags & 0x07 // Lower 3 bits
  
  // Offset 11: Laps in event
  const lapsInEvent = buffer.readUInt8(11)
  
  // Timing data (offsets 12-47)
  let bestLapTime = 0
  let lastLapTime = 0
  let currentLapTime = 0
  let eventTimeRemaining = 0
  
  if (buffer.length >= 48) {
    bestLapTime = buffer.readFloatLE(12)
    lastLapTime = buffer.readFloatLE(16)
    currentLapTime = buffer.readFloatLE(20)
    eventTimeRemaining = buffer.readFloatLE(36)
    
    // Filter invalid times (negative or impossibly large)
    if (bestLapTime < 0 || bestLapTime > 3600) bestLapTime = 0
    if (lastLapTime < 0 || lastLapTime > 3600) lastLapTime = 0
    if (currentLapTime < 0 || currentLapTime > 3600) currentLapTime = 0
  }
  
  // Speed (offset 119, f32) - in m/s
  let speed = 0
  if (buffer.length >= 123) {
    speed = buffer.readFloatLE(119)
    if (speed < 0 || speed > 150) speed = 0 // 150 m/s = 540 km/h max
  }
  
  // RPM (offset 123, u16)
  let rpm = 0
  if (buffer.length >= 125) {
    rpm = buffer.readUInt16LE(123)
    if (rpm > 20000) rpm = 0 // Sanity check
  }
  
  // MaxRPM (offset 125, u16)
  let maxRpm = 0
  if (buffer.length >= 127) {
    maxRpm = buffer.readUInt16LE(125)
  }
  
  // Gear (offset 127, u8) - low nibble = gear, high nibble = numGears
  let gear = 0
  if (buffer.length >= 128) {
    const gearByte = buffer.readUInt8(127)
    gear = gearByte & 0x0F // Low nibble is current gear
    // 15 = reverse, 0 = neutral, 1-7 = gears
    if (gear === 15) gear = -1
  }
  
  // Track name (offset 948, 64 bytes)
  let trackName = ''
  if (buffer.length >= 1012) {
    trackName = readString(buffer, 948, 64)
  }
  
  // Track variation (offset 1012, 64 bytes)
  let trackVariation = ''
  if (buffer.length >= 1076) {
    trackVariation = readString(buffer, 1012, 64)
  }
  
  // Track length - search for it in the raw data
  // According to PCARS1 spec, trackLength is sent in a specific packet
  // For now, try to find a reasonable value in the expected range
  let trackLength = 0
  
  // Try different potential offsets for track length
  const trackLengthOffsets = [840, 844, 848, 932, 936, 940, 944]
  for (const offset of trackLengthOffsets) {
    if (buffer.length >= offset + 4) {
      const val = buffer.readFloatLE(offset)
      if (val > 1000 && val < 30000) { // 1km to 30km
        trackLength = val
        break
      }
    }
  }
  
  // Ambient temp and track temp - try to find in weather section
  let ambientTemp = 0
  let trackTemp = 0
  
  // Weather data might be around offset 559-583
  if (buffer.length >= 564) {
    // Try some potential offsets for temperature
    const tempVal1 = buffer.readInt8(559)
    const tempVal2 = buffer.readInt8(560)
    if (tempVal1 > -20 && tempVal1 < 60) ambientTemp = tempVal1
    if (tempVal2 > -20 && tempVal2 < 80) trackTemp = tempVal2
  }
  
  const session: Partial<SessionInfo> = {
    sessionState: GAME_STATES[gameState] || `Game ${gameState}`,
    sessionType: SESSION_STATES[sessionState] || `Session ${sessionState}`,
    raceState: RACE_STATES[raceState] || `Race ${raceState}`,
    numParticipants: Math.max(0, numParticipants),
    viewedParticipantIndex,
    lapsInEvent,
    trackLength,
    trackName: trackName || trackVariation || '',
    timeRemaining: eventTimeRemaining > 0 ? eventTimeRemaining : 0,
    bestLapTime,
    lastLapTime,
    currentLapTime,
    speed: speed * 3.6, // Convert m/s to km/h
    rpm,
    gear,
    ambientTemp,
    trackTemp
  }
  
  // Avoid overwriting known track info with empty/unknown values.
  if (!session.trackName) {
    delete session.trackName
  }
  if (!session.trackLength || session.trackLength <= 0) {
    delete session.trackLength
  }

  // Parse participant names (starting at offset 1076 in PCARS1)
  // Each name is 64 bytes, up to 16 participants in the names section
  if (buffer.length >= 1367 && numParticipants > 0) {
    const NAMES_OFFSET = 1076
    const NAME_LENGTH = 64
    const maxParticipants = Math.min(numParticipants, 16)
    
    for (let i = 0; i < maxParticipants; i++) {
      const nameOffset = NAMES_OFFSET + (i * NAME_LENGTH)
      if (nameOffset + NAME_LENGTH <= buffer.length) {
        const name = readString(buffer, nameOffset, NAME_LENGTH)
        
        if (name && name.length > 0) {
          participants.push({
            name,
            carIndex: i,
            carClass: '',
            racePosition: 0, // Will be updated from participant info struct - don't assume position
            lapsCompleted: 0,
            currentLap: 0,
            currentLapTime: 0,
            bestLapTime: 0,
            sector1Time: 0,
            sector2Time: 0,
            sector3Time: 0,
            lastLapTime: 0,
            currentLapValid: true,
            pitMode: 0,
            isPlayer: i === viewedParticipantIndex
          })
        }
      }
    }
  }
  
  // Get participant info from the participantInfo array (offset 584)
  // Each sParticipantInfo struct is 16 bytes in PCARS1:
  // 0-1: worldPosition[0] (s16)
  // 2-3: worldPosition[1] (s16) 
  // 4-5: worldPosition[2] (s16)
  // 6-7: currentLapDistance (u16)
  // 8: racePosition (u8)
  // 9: lapsCompleted (u8)
  // 10: currentLap (u8)
  // 11: sector (u8)
  // 12-15: lastSectorTime (f32)
  if (buffer.length >= 840 && numParticipants > 0) {
    const PARTICIPANT_INFO_OFFSET = 584
    const PARTICIPANT_INFO_SIZE = 16
    
    // Debug: log first few participant info entries raw bytes
    if (debugPacketCount <= 3) {
      console.log(`[UDP] Participant info area (offset 584-648):`)
      for (let i = 0; i < Math.min(4, numParticipants); i++) {
        const off = PARTICIPANT_INFO_OFFSET + (i * PARTICIPANT_INFO_SIZE)
        const raw = buffer.slice(off, off + 16).toString('hex')
        const bytes = []
        for (let b = 0; b < 16; b++) {
          bytes.push(buffer.readUInt8(off + b))
        }
        console.log(`[UDP]   P${i}: ${raw} -> bytes: [${bytes.join(', ')}]`)
      }
    }
    
    for (let i = 0; i < Math.min(numParticipants, participants.length); i++) {
      const offset = PARTICIPANT_INFO_OFFSET + (i * PARTICIPANT_INFO_SIZE)
      if (offset + PARTICIPANT_INFO_SIZE <= buffer.length) {
        const racePosition = buffer.readUInt8(offset + 8)
        const lapsCompleted = buffer.readUInt8(offset + 9)
        const currentLap = buffer.readUInt8(offset + 10)
        const sector = buffer.readUInt8(offset + 11)
        
        // Sanity check: only update if values are reasonable
        // Position should be 1 to numParticipants (0 = not started/invalid)
        // Laps should be reasonable (0-999)
        const isValidPosition = racePosition >= 1 && racePosition <= Math.max(numParticipants, 64)
        const isValidLap = currentLap < 200 && lapsCompleted < 200
        
        if (participants[i]) {
          // Always use the UDP position if it's valid - don't fall back to index
          if (isValidPosition) {
            participants[i].racePosition = racePosition
          }
          // If position is 0 or invalid, keep whatever position was set before (don't override with i+1)
          
          if (isValidLap) {
            participants[i].lapsCompleted = lapsCompleted
            participants[i].currentLap = currentLap
          }
        }
      }
    }
    
    // Sort participants based on session type
    // For Practice/Qualifying/Test: sort by best lap time (fastest = P1)
    // For Race: use actual racePosition from UDP
    const sessionType = SESSION_STATES[sessionState] || ''
    if (sessionType === 'Practice' || sessionType === 'Qualifying' || sessionType === 'Test') {
      // Sort by best lap time - drivers with no time go to back
      participants.sort((a, b) => {
        if (a.bestLapTime <= 0 && b.bestLapTime <= 0) return a.carIndex - b.carIndex
        if (a.bestLapTime <= 0) return 1  // No time = back
        if (b.bestLapTime <= 0) return -1
        return a.bestLapTime - b.bestLapTime
      })
      // Reassign positions based on sorted order
      participants.forEach((p, idx) => p.racePosition = idx + 1)
    } else {
      // Race: use actual racePosition from UDP
      participants.sort((a, b) => a.racePosition - b.racePosition)
    }
  }
  
  // If we still have no participants but have numParticipants > 0,
  // create placeholder entries from participant info
  if (participants.length === 0 && numParticipants > 0 && buffer.length >= 840) {
    const PARTICIPANT_INFO_OFFSET = 584
    const PARTICIPANT_INFO_SIZE = 16
    
    for (let i = 0; i < Math.min(numParticipants, 32); i++) {
      const offset = PARTICIPANT_INFO_OFFSET + (i * PARTICIPANT_INFO_SIZE)
      if (offset + PARTICIPANT_INFO_SIZE <= buffer.length) {
        const racePositionRaw = buffer.readUInt8(offset + 8)
        const lapsCompletedRaw = buffer.readUInt8(offset + 9)
        const currentLapRaw = buffer.readUInt8(offset + 10)
        
        // Apply sanity checks - use actual UDP position, only fallback if truly invalid
        const racePosition = (racePositionRaw >= 1 && racePositionRaw <= Math.max(numParticipants, 64)) 
          ? racePositionRaw 
          : 0 // Keep as 0 if invalid - don't fake positions
        const lapsCompleted = (lapsCompletedRaw < 200) ? lapsCompletedRaw : 0
        const currentLap = (currentLapRaw < 200) ? currentLapRaw : 0
        
        // Only add participant if we have a valid position
        if (racePosition > 0) {
          participants.push({
            name: `Driver ${i + 1}`,
            carIndex: i,
            carClass: '',
            racePosition,
            lapsCompleted,
            currentLap,
            currentLapTime: 0,
            bestLapTime: 0,
            sector1Time: 0,
            sector2Time: 0,
            sector3Time: 0,
            lastLapTime: 0,
            currentLapValid: true,
            pitMode: 0,
            isPlayer: i === viewedParticipantIndex
          })
        }
      }
    }
    
    // Sort based on session type
    const sessionType = SESSION_STATES[sessionState] || ''
    if (sessionType === 'Practice' || sessionType === 'Qualifying' || sessionType === 'Test') {
      participants.sort((a, b) => {
        if (a.bestLapTime <= 0 && b.bestLapTime <= 0) return a.carIndex - b.carIndex
        if (a.bestLapTime <= 0) return 1
        if (b.bestLapTime <= 0) return -1
        return a.bestLapTime - b.bestLapTime
      })
      participants.forEach((p, idx) => p.racePosition = idx + 1)
    } else {
      participants.sort((a, b) => a.racePosition - b.racePosition)
    }
  }
  
  return { session, participants, playerIndex: viewedParticipantIndex, packetType }
}

/**
 * Parse AMS2 Participant Strings Packet (Type 1)
 * 
 * Based on the debug output, AMS2's participants packet (1347 bytes) has this structure:
 * Offset 3: Car name (64 bytes) - e.g., "Chevrolet Corvette Z06 GT3.R"
 * Offset 67: Car class (64 bytes) - e.g., "GT3_Gen2"
 * Offset 131: Track name (64 bytes) - e.g., "Nürburgring"
 * Offset 195: Track variation (64 bytes) - e.g., "Nordschleife 24 Hour 2025"
 * Offset 259+: Driver names (64 bytes each)
 */
function parseParticipantsPacket(buffer: Buffer): {
  participants: ParticipantInfo[]
  trackName: string
  trackVariation: string
  trackLength: number
  carName: string
  carClass: string
} {
  const participants: ParticipantInfo[] = []
  let trackName = ''
  let trackVariation = ''
  let trackLength = 0
  let carName = ''
  let carClass = ''
  
  // AMS2 participants packet is 1347 bytes
  if (buffer.length >= 259) {
    // Car name at offset 3
    carName = readString(buffer, 3, 64)

    // Car class at offset 67
    carClass = readString(buffer, 67, 64)

    // Track name at offset 131
    trackName = readString(buffer, 131, 64)

    // Track variation at offset 195
    trackVariation = readString(buffer, 195, 64)
    
    console.log(`[UDP] Participants packet parsed:`)
    console.log(`[UDP]   Car: "${carName}" Class: "${carClass}"`)
    console.log(`[UDP]   Track: "${trackName}" - "${trackVariation}"`)
    
    // Driver names start at offset 259, 64 bytes each
    const DRIVERS_START = 259
    const NAME_LENGTH = 64
    const maxDrivers = Math.floor((buffer.length - DRIVERS_START) / NAME_LENGTH)
    
    for (let i = 0; i < Math.min(maxDrivers, 21); i++) {
      const nameOffset = DRIVERS_START + (i * NAME_LENGTH)
      if (nameOffset + NAME_LENGTH <= buffer.length) {
        const name = readString(buffer, nameOffset, NAME_LENGTH)
        if (name && name.length > 1) {
          participants.push({
            name,
            carIndex: i,
            carClass: carClass,
            racePosition: 0, // Will be updated from telemetry packet - don't assume position
            lapsCompleted: 0,
            currentLap: 0,
            currentLapTime: 0,
            bestLapTime: 0,
            sector1Time: 0,
            sector2Time: 0,
            sector3Time: 0,
            lastLapTime: 0,
            currentLapValid: true,
            pitMode: 0,
            isPlayer: false
          })
        }
      }
    }
    
    if (participants.length > 0) {
      console.log(`[UDP]   Found ${participants.length} drivers: ${participants.slice(0, 3).map(p => p.name).join(', ')}...`)
    }
  }
  
  return { participants, trackName, trackVariation, trackLength, carName, carClass }
}

/**
 * Parse PCARS1 Timings Packet (Type 2)
 * 
 * Contains detailed timing info for all participants
 */
function parseTimingsPacket(buffer: Buffer): Array<{
  carIndex: number
  racePosition: number
  currentLapTime: number
  lastLapTime: number
}> {
  const timings: Array<{
    carIndex: number
    racePosition: number  
    currentLapTime: number
    lastLapTime: number
  }> = []
  
  // Debug: log raw timing packet data for first few packets
  if (debugPacketCount <= 5) {
    console.log(`[UDP] Parsing Timings packet: ${buffer.length} bytes`)
    console.log(`[UDP] Timings first 60 bytes: ${buffer.slice(0, 60).toString('hex')}`)
    
    // Scan for valid lap times (float values between 30 and 600 seconds)
    console.log(`[UDP] Scanning for valid lap times:`)
    for (let offset = 0; offset < Math.min(buffer.length - 4, 200); offset += 4) {
      const val = buffer.readFloatLE(offset)
      if (val > 30 && val < 600) {
        console.log(`[UDP]   Offset ${offset}: ${val.toFixed(3)}s (${(val/60).toFixed(2)} min)`)
      }
    }
  }
  
  // Timings packet structure varies - scan for valid data
  // Each participant timing entry is typically 16-24 bytes
  
  const numParticipants = buffer.length >= 6 ? buffer.readUInt8(5) : 0
  
  if (buffer.length >= 100 && numParticipants > 0) {
    // Try to extract timing data - offset starts after header
    const TIMING_ENTRY_SIZE = 24 // Typical size per participant
    const TIMING_START = 12 // After header

    const isValidTime = (val: number) => val > 0.01 && val < 3600

    for (let i = 0; i < Math.min(numParticipants, 32); i++) {
      const offset = TIMING_START + (i * TIMING_ENTRY_SIZE)
      if (offset + TIMING_ENTRY_SIZE <= buffer.length) {
        const idxCandidate = buffer.readUInt8(offset)
        const posCandidate1 = buffer.readUInt8(offset + 1)
        const posCandidate2 = buffer.readUInt8(offset + 3)

        const racePosition =
          (posCandidate1 > 0 && posCandidate1 <= 64) ? posCandidate1 :
          (posCandidate2 > 0 && posCandidate2 <= 64) ? posCandidate2 :
          0

        const t1 = buffer.readFloatLE(offset + 4)
        const t2 = buffer.readFloatLE(offset + 8)
        const t3 = buffer.readFloatLE(offset + 12)
        const t4 = buffer.readFloatLE(offset + 16)

        const candidateTimes = [t1, t2, t3, t4].filter(isValidTime)
        const currentLapTime = candidateTimes.length > 0 ? candidateTimes[0] : 0
        const lastLapTime = candidateTimes.length > 1 ? candidateTimes[1] : 0

        const carIndex = (idxCandidate >= 0 && idxCandidate < 64) ? idxCandidate : i

        if (racePosition > 0) {
          timings.push({
            carIndex,
            racePosition,
            currentLapTime,
            lastLapTime
          })
        }
      }
    }
  }
  
  return timings
}

// Start UDP listener
function startTelemetryListener(port: number, mainWindow: BrowserWindow | null): void {
  if (state.isListening && state.socket) {
    console.log('Telemetry listener already running on port', state.port)
    return
  }
  
  // Close any existing socket first
  if (state.socket) {
    try {
      state.socket.close()
    } catch (e) {
      // Ignore close errors
    }
    state.socket = null
  }
  
  state.port = port
  state.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
  
  let currentSession: Partial<SessionInfo> = {}
  let currentParticipants: ParticipantInfo[] = []
  let lastPacketTime = Date.now()
  let packetCount = 0
  debugPacketCount = 0 // Reset debug counter on new listener
  previousRaceState = '' // Reset race state tracking
  raceCompleteEmitted = false
  hasBeenRacingThisSession = false
  
  state.socket.on('message', (msg: Buffer) => {
    lastPacketTime = Date.now()
    packetCount++
    debugPacketCount++
    
    try {
      // Log packet info for debugging (first few packets)
      if (packetCount <= 10) {
        const packetTypeByte = msg.readUInt8(2)
        const pktType = packetTypeByte & 0x03
        console.log(`[UDP] Packet #${packetCount}: ${msg.length} bytes, type ${pktType}`)
        console.log(`[UDP] First 30 bytes: ${msg.slice(0, 30).toString('hex')}`)
        
        // For type 1 (Participants) packets, search for strings
        if (pktType === 1 || pktType === 2) {
          console.log(`[UDP] Type ${pktType} packet - searching for strings:`)
          for (let offset = 0; offset < msg.length - 16; offset++) {
            // Check if this looks like start of a valid ASCII string (letter or number)
            const firstByte = msg.readUInt8(offset)
            if (firstByte >= 65 && firstByte <= 122) { // A-Z or a-z
              const str = readString(msg, offset, 64)
              if (str && str.length >= 4 && /^[A-Za-z0-9\s\-\.]+$/.test(str)) {
                console.log(`[UDP]   Found string at offset ${offset}: "${str.substring(0, 40)}"`)
              }
            }
          }
        }
        
        // For type 0 (Telemetry), check key telemetry values
        if (pktType === 0 && msg.length >= 130) {
          const gameState = msg.readUInt8(3) & 0x0F
          const sessionState = (msg.readUInt8(3) >> 4) & 0x0F
          const numPart = msg.readInt8(5)
          const speed = msg.readFloatLE(119)
          const rpm = msg.readUInt16LE(123)
          const gear = msg.readUInt8(127) & 0x0F
          console.log(`[UDP] Telemetry - GameState: ${gameState}, Session: ${sessionState}, Participants: ${numPart}`)
          console.log(`[UDP] Telemetry - Speed: ${(speed * 3.6).toFixed(1)} km/h, RPM: ${rpm}, Gear: ${gear === 15 ? 'R' : gear}`)
        }
      }
      
      // Parse PCARS1 packet - different handling based on packet type
      const packetTypeByte = msg.readUInt8(2)
      const packetType = packetTypeByte & 0x03 // Lower 2 bits
      
      if (packetType === 0) {
        // Type 0: Car Physics / Telemetry (1367 bytes)
        const { session, participants, playerIndex } = parsePCARS1Packet(msg)
        
        if (Object.keys(session).length > 0) {
          currentSession = { ...currentSession, ...session }
          mainWindow?.webContents.send('telemetry:session', currentSession)
          
          // Detect race completion - only for actual race sessions
          const currentRaceState = session.raceState || ''
          const currentSessionType = currentSession.sessionType || ''

          // Reset flags when session type changes (e.g., Qualifying -> Race)
          if (currentSessionType && currentSessionType !== previousSessionType) {
            raceCompleteEmitted = false
            hasBeenRacingThisSession = false
            previousRaceState = ''
            previousSessionType = currentSessionType
          }
          
          // Track if we've ever been racing this session (handles pauses, yellow flags, etc.)
          if (currentSessionType === 'Race' && currentRaceState === 'Racing') {
            hasBeenRacingThisSession = true
          }
          
          // Detect finish - use hasBeenRacingThisSession instead of just checking previous frame
          // This handles cases where player goes through intermediate states (yellow flag, safety car, pause)
          const isFinished = currentRaceState === 'Finished' || currentRaceState === 'Retired' || currentRaceState === 'DNF'
          if (currentSessionType === 'Race' && hasBeenRacingThisSession && isFinished && !raceCompleteEmitted) {
            
            // Find the player participant
            const playerIndex = session.viewedParticipantIndex || 0
            const playerParticipant = currentParticipants.find(p => p.carIndex === playerIndex)
            
            if (playerParticipant) {
              console.log(`[UDP] Race complete detected! Player position: ${playerParticipant.racePosition}`)
              
              // Emit race complete event
              const raceCompleteData = {
                playerPosition: playerParticipant.racePosition,
                playerName: playerParticipant.name,
                totalParticipants: currentSession.numParticipants || currentParticipants.length,
                lapsCompleted: playerParticipant.lapsCompleted,
                bestLapTime: currentSession.bestLapTime || 0,
                lastLapTime: currentSession.lastLapTime || 0,
                trackName: currentSession.trackName || 'Unknown Track',
                carName: (currentSession as any).carName || 'Unknown Car',
                carClass: (currentSession as any).carClass || 'Unknown Class',
                dnf: currentRaceState === 'Retired' || currentRaceState === 'DNF',
                sessionType: currentSession.sessionType || 'Race',
                allParticipants: currentParticipants.map(p => ({
                  name: p.name,
                  position: p.racePosition,
                  lapsCompleted: p.lapsCompleted,
                  bestLapTime: p.bestLapTime,
                  isPlayer: p.isPlayer
                }))
              }
              
              mainWindow?.webContents.send('telemetry:raceComplete', raceCompleteData)
              
              // Feed to commentary system
              feedRaceCompleteToCommentary(raceCompleteData)
              
              raceCompleteEmitted = true
            }
          }
          
          // Reset flags when session changes (new practice/quali/race detected)
          if (currentSessionType === 'Race' && currentRaceState === 'Racing' && previousRaceState !== 'Racing' && previousRaceState !== '' && 
              previousRaceState !== 'Green Flag' && previousRaceState !== 'Formation' && previousRaceState !== 'Countdown') {
            // Starting a genuinely new race session
            raceCompleteEmitted = false
            hasBeenRacingThisSession = true
          }
          
          // Also reset when we detect we've completed and then start fresh
          if (currentSessionType === 'Race' && raceCompleteEmitted && currentRaceState === 'Racing') {
            raceCompleteEmitted = false
            hasBeenRacingThisSession = true
          }
          
          previousRaceState = currentRaceState
          if (currentSessionType) {
            previousSessionType = currentSessionType
          }
        }
        
        // Only use participants from type 0 if we don't have names yet
        if (participants.length > 0 && currentParticipants.length === 0) {
          currentParticipants = participants.map(p => ({
            ...p,
            isPlayer: p.carIndex === playerIndex
          }))
        }
        // Update positions from type 0 packet and set isPlayer
        if (participants.length > 0 && currentParticipants.length > 0) {
          participants.forEach(p => {
            const existing = currentParticipants.find(cp => cp.carIndex === p.carIndex)
            if (existing) {
              existing.racePosition = p.racePosition
              existing.lapsCompleted = p.lapsCompleted
              existing.currentLap = p.currentLap
              existing.isPlayer = (p.carIndex === playerIndex)
            }
          })
        }
        
        // Copy session lap times to the player participant
        // The session data has accurate lap times from the telemetry packet
        if (currentParticipants.length > 0 && session.currentLapTime !== undefined) {
          const player = currentParticipants.find(p => p.carIndex === playerIndex)
          if (player) {
            if (session.currentLapTime && session.currentLapTime > 0) {
              player.currentLapTime = session.currentLapTime
            }
            if (session.bestLapTime && session.bestLapTime > 0) {
              player.bestLapTime = session.bestLapTime
            }
            if (session.lastLapTime && session.lastLapTime > 0) {
              player.lastLapTime = session.lastLapTime
            }
          }
        }
        
        mainWindow?.webContents.send('telemetry:participants', {
          participants: currentParticipants,
          playerIndex
        })
        
        // Feed to commentary system
        feedTelemetryToCommentary(currentSession, currentParticipants, playerIndex)
        
      } else if (packetType === 1) {
        // Type 1: Participants (with names!) 
        const { participants, trackName, trackVariation, carName, carClass } = parseParticipantsPacket(msg)
        
        if (participants.length > 0) {
          const playerIndex = currentSession.viewedParticipantIndex || 0
          
          // Merge names with existing position data
          participants.forEach(p => {
            const existing = currentParticipants.find(cp => cp.carIndex === p.carIndex)
            if (existing) {
              existing.name = p.name
              existing.carClass = p.carClass
              existing.isPlayer = (p.carIndex === playerIndex)
            } else {
              p.isPlayer = (p.carIndex === playerIndex)
              currentParticipants.push(p)
            }
          })
          
          // If we got completely new data, replace
          if (currentParticipants.length === 0) {
            currentParticipants = participants.map(p => ({
              ...p,
              isPlayer: p.carIndex === playerIndex
            }))
          }
        }
        
        // Combine track name and variation for full name (e.g., "Barcelona Grand Prix")
        if (trackName && trackVariation) {
          currentSession.trackName = `${trackName} ${trackVariation}`
        } else if (trackVariation) {
          currentSession.trackName = trackVariation
        } else if (trackName) {
          currentSession.trackName = trackName
        }
        
        // Store car info in session
        if (carName) {
          (currentSession as any).carName = carName
        }
        if (carClass) {
          (currentSession as any).carClass = carClass
        }
        
        mainWindow?.webContents.send('telemetry:session', currentSession)
        mainWindow?.webContents.send('telemetry:participants', {
          participants: currentParticipants,
          playerIndex: currentSession.viewedParticipantIndex || 0
        })
        
      } else if (packetType === 2) {
        // Type 2: Timings
        const timings = parseTimingsPacket(msg)
        
        // Update participant positions and lap times from timing data
        timings.forEach(t => {
          const existing = currentParticipants.find(cp => cp.carIndex === t.carIndex)
          if (existing) {
            existing.racePosition = t.racePosition
            existing.currentLapTime = t.currentLapTime
            existing.lastLapTime = t.lastLapTime
          }
        })
        
        if (currentParticipants.length > 0) {
          mainWindow?.webContents.send('telemetry:participants', {
            participants: currentParticipants,
            playerIndex: currentSession.viewedParticipantIndex || 0
          })
        }
      }
      
      // Send raw packet info for debugging
      mainWindow?.webContents.send('telemetry:raw', {
        length: msg.length,
        timestamp: Date.now(),
        packetType,
        buildVersion: msg.length >= 2 ? msg.readUInt16LE(0) : 0,
        preview: msg.slice(0, Math.min(50, msg.length)).toString('hex')
      })
      
    } catch (err) {
      console.error('[UDP] Parse error:', err)
    }
  })
  
  state.socket.on('error', (err: NodeJS.ErrnoException) => {
    console.error('UDP socket error:', err.message)
    
    if (err.code === 'EADDRINUSE') {
      mainWindow?.webContents.send('telemetry:error', `Port ${port} is already in use. Close other applications using this port or change the UDP port in settings.`)
      mainWindow?.webContents.send('telemetry:status', { listening: false, port, error: 'Port in use' })
    } else {
      mainWindow?.webContents.send('telemetry:error', err.message)
    }
    
    state.isListening = false
    if (state.socket) {
      try {
        state.socket.close()
      } catch (e) {
        // Ignore
      }
      state.socket = null
    }
  })
  
  state.socket.on('listening', () => {
    const address = state.socket?.address()
    console.log(`[UDP] Telemetry listener started on port ${address?.port}`)
    state.isListening = true
    mainWindow?.webContents.send('telemetry:status', { listening: true, port: address?.port })
  })
  
  state.socket.bind(port)
  
  // Send heartbeat status periodically
  setInterval(() => {
    const timeSinceLastPacket = Date.now() - lastPacketTime
    const isReceiving = timeSinceLastPacket < 5000 // 5 second timeout
    
    mainWindow?.webContents.send('telemetry:heartbeat', {
      listening: state.isListening,
      receiving: isReceiving,
      lastPacket: lastPacketTime,
      participantCount: currentParticipants.length,
      packetCount
    })
  }, 1000)
}

// Stop UDP listener
function stopTelemetryListener(): void {
  if (state.socket) {
    state.socket.close()
    state.socket = null
  }
  state.isListening = false
  console.log('[UDP] Telemetry listener stopped')
}

// Register IPC handlers
export function registerTelemetryHandlers(mainWindow: BrowserWindow | null): void {
  ipcMain.handle('telemetry:start', async (_event, port: number = 5606) => {
    startTelemetryListener(port, mainWindow)
    return { success: true, port }
  })
  
  ipcMain.handle('telemetry:stop', async () => {
    stopTelemetryListener()
    return { success: true }
  })
  
  ipcMain.handle('telemetry:status', async () => {
    return {
      isListening: state.isListening,
      port: state.port
    }
  })
  
  ipcMain.handle('telemetry:setPort', async (_event, port: number) => {
    if (state.isListening) {
      stopTelemetryListener()
      startTelemetryListener(port, mainWindow)
    }
    state.port = port
    return { success: true, port }
  })
}

export { startTelemetryListener, stopTelemetryListener }
