import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Flag,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
  Thermometer,
  Droplets,
  Radio,
  Users,
  WifiOff,
} from 'lucide-react'
import { Card, CardHeader, Badge, Button, Progress } from '@/components/ui'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'

type SessionType = 'practice' | 'qualifying' | 'race'
type TelemetryStatus = { listening: boolean; receiving: boolean; lastPacket: number; participantCount: number }

export default function RaceDayScreen() {
  const [activeSession, setActiveSession] = useState<SessionType>('practice')
  const [sessionStatus, setSessionStatus] = useState<'pending' | 'ready' | 'in_progress' | 'completed'>('pending')
  const [isGeneratingXML, setIsGeneratingXML] = useState(false)
  const [xmlGenerated, setXmlGenerated] = useState(false)
  
  // Telemetry state
  const [telemetryStatus, setTelemetryStatus] = useState<TelemetryStatus>({
    listening: false,
    receiving: false,
    lastPacket: 0,
    participantCount: 0
  })
  const [liveSession, setLiveSession] = useState<TelemetrySession | null>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [_lastDetectedSessionType, setLastDetectedSessionType] = useState<string>('')
  
  // Race complete modal state
  const [showRaceCompleteModal, setShowRaceCompleteModal] = useState(false)
  const [raceCompleteData, setRaceCompleteData] = useState<{
    result: TelemetryRaceResult
    processed: { points: number; prizeMoney: number; repChange: number }
    debrief: {
      fatigue: number
      fitness: number
      stress: number
      confidence: number
      aiBreakdown: AIModifierResult['breakdown']
      totalModifier: number
      modifierDescription: string
      carCondition: 'excellent' | 'good' | 'worn' | 'critical'
      qualifyingPos: number | null
      positionsGained: number
    }
  } | null>(null)
  
  // Track if current race has been processed (prevent double-processing)
  // Use BOTH state and ref - ref for synchronous checking, state for React updates
  const [_raceProcessedForWeek, setRaceProcessedForWeek] = useState<number | null>(null)
  const _raceProcessedRef = useRef<number | null>(null)
  const sessionsProcessedThisWeek = useRef<Set<string>>(new Set())
  
  // Track if race has actually started (Crew Chief approach)
  // This prevents false "completed" detection during Quali->Race transition
  // where raceState might still be "Finished" from qualifying while sessionType is already "Race"
  const hasRaceActuallyStarted = useRef<boolean>(false)
  
  // Result input state
  const [finishPosition, setFinishPosition] = useState<number | ''>('')
  const [bestLapTime, setBestLapTime] = useState('')
  const [qualifyingPosition, setQualifyingPosition] = useState<number | ''>('')
  
  // Media Duty state
  const [showDutyReminder, setShowDutyReminder] = useState(true)
  
  // Car condition check state
  const [showCarConditionModal, setShowCarConditionModal] = useState(false)
  
  // Helper function to check if car can race
  const checkCarCondition = useCallback((car: TeamCar | undefined): { canRace: boolean; issues: { part: keyof CarPartWear; wear: number }[] } => {
    if (!car || !car.partWear) {
      return { canRace: true, issues: [] }
    }
    
    const criticalWearThreshold = 90
    const issues: { part: keyof CarPartWear; wear: number }[] = []
    
    const parts: (keyof CarPartWear)[] = ['engine', 'chassis', 'gearbox', 'brakes', 'suspension']
    for (const part of parts) {
      if (car.partWear[part] >= criticalWearThreshold) {
        issues.push({ part, wear: car.partWear[part] })
      }
    }
    
    return {
      canRace: issues.length === 0,
      issues
    }
  }, [])
  
  // Get active car for the current series
  const activeCar = useMemo(() => {
    if (!careerState?.cars || !player?.currentSeriesId) return undefined
    return careerState.cars.find(c => c.seriesId === player.currentSeriesId)
  }, [careerState?.cars, player?.currentSeriesId])
  
  // Check car condition
  const carConditionCheck = useMemo(() => {
    return checkCarCondition(activeCar)
  }, [activeCar, checkCarCondition])

  // Get current race from calendar OR invitational event
  const currentSeries = player?.currentSeriesId ? getSeriesById(player.currentSeriesId) : null
  const currentWeek = careerState?.currentWeek || 1
  
  // Check if this is an invitational week
  const isInvitational = isInvitationalWeek()
  const invitationalEvent = getCurrentInvitationalEvent()
  
  const currentRace = isInvitational && invitationalEvent 
    ? {
        id: invitationalEvent.instanceId,
        round: 0, // Special events don't have rounds
        trackId: invitationalEvent.trackId,
        trackName: invitationalEvent.trackName,
        layoutId: invitationalEvent.layoutId,
        layoutName: invitationalEvent.layoutName,
        country: 'International', // Will be determined by track
        lengthKm: 0, // Will be filled from track data
        week: invitationalEvent.week,
        sessions: { practice: true, qualifying: true, race: true, sprintRace: false }
      } as RaceEvent
    : currentSeries?.calendar?.find(
        event => event.week === currentWeek
      ) || currentSeries?.calendar?.[0]
  
  // Get track details
  const trackInfo = currentRace ? AMS2_TRACKS.find(t => t.id === currentRace.trackId) : null
  const layoutInfo = trackInfo?.layouts.find(l => l.id === currentRace?.layoutId) || trackInfo?.layouts[0]
  
  // Get car class info for invitational events
  const invitationalCarClass = invitationalEvent 
    ? AMS2_CAR_CLASSES.find(c => c.id === invitationalEvent.carClassId) 
    : null

  // Track if we've attempted auto-generation for this race weekend
  const [autoGenerateAttempted, setAutoGenerateAttempted] = useState(false)
  
  // TV Broadcast Commentary - Content pool generation state
  const [contentPoolStatus, setContentPoolStatus] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle')
  const [_contentPoolStats, setContentPoolStats] = useState<{ total: number; used: number; remaining: number } | null>(null)
  const contentPoolGenerated = useRef(false)
  
  // TV Broadcast Commentary - Scheduler state
  const schedulerStarted = useRef(false)
  const lastReportedLap = useRef(0)

  // Listen for telemetry updates
  useEffect(() => {
    const handleHeartbeat = (status: TelemetryStatus) => {
      setTelemetryStatus(status)
    }
    
    const handleSession = (session: TelemetrySession & { raceState?: string }) => {
      setLiveSession(session)
      
      // Auto-switch tab only when session type CHANGES (not on every update)
      // This allows users to view Practice/Qualifying results while in a Race
      const newSessionType = session.sessionType
      setLastDetectedSessionType(prev => {
        if (prev !== newSessionType && newSessionType) {
          // Session type changed - auto-switch to match
          if (newSessionType === 'Practice' || newSessionType === 'Test') {
            setActiveSession('practice')
          } else if (newSessionType === 'Qualifying') {
            setActiveSession('qualifying')
          } else if (newSessionType === 'Race') {
            setActiveSession('race')
            // Reset race started flag when transitioning TO a race session
            // This prevents false completion detection from stale "Finished" state
            hasRaceActuallyStarted.current = false
            console.log('[RaceDay] Reset hasRaceActuallyStarted for new Race session')
          }
        }
        return newSessionType || prev
      })
      
      const isRaceSession = session.sessionType === 'Race' || session.sessionType === 'Formation Lap'
      
      // Track if race has actually started (Crew Chief approach)
      // Only set this when we see "Racing" state in a Race session
      if (isRaceSession && !hasRaceActuallyStarted.current) {
        if (session.raceState === 'Racing') {
          hasRaceActuallyStarted.current = true
          console.log('[RaceDay] Race actually started - saw Racing state')
          
          // Start the TV Broadcast commentary scheduler
          if (!schedulerStarted.current && contentPoolStatus === 'ready') {
            const totalLaps = session.lapsInEvent || 20
            console.log(`[RaceDay] Starting commentary scheduler for ${totalLaps} lap race`)
            window.electron?.startScheduler?.(totalLaps)
            schedulerStarted.current = true
          }
        }
      }
      
      // Update scheduler with current lap (during race)
      if (isRaceSession && hasRaceActuallyStarted.current && schedulerStarted.current) {
        const currentLap = (session as any).currentLap || 0
        if (currentLap !== lastReportedLap.current) {
          lastReportedLap.current = currentLap
          window.electron?.updateSchedulerLap?.(currentLap)
        }
      }
      
      // Detect session state changes - check RACE state (Finished/Retired/DNF) not just game state
      // IMPORTANT: Only set 'completed' for RACE sessions (Crew Chief approach)
      // Qualifying/Practice use different handling via telemetry:raceComplete events
      if (sessionStatus !== 'completed') {
        const isFinished = session.raceState === 'Finished' || session.raceState === 'Retired' || session.raceState === 'DNF' ||
                          session.sessionState === 'Finished' || session.sessionState === 'Session Over'
        
        // Only mark race as completed if:
        // 1. It's a race session AND
        // 2. The race has actually started (we've seen "Racing" state) AND
        // 3. The race is now finished
        if (isFinished && isRaceSession && hasRaceActuallyStarted.current) {
          console.log(`[RaceDay] RACE session completed via telemetry. RaceState: ${session.raceState}, SessionType: ${session.sessionType}`)
          setSessionStatus('completed')
          
          // Stop the commentary scheduler
          if (schedulerStarted.current) {
            console.log('[RaceDay] Stopping commentary scheduler - race finished')
            window.electron?.stopScheduler?.()
            schedulerStarted.current = false
          }
        } else if (isFinished && isRaceSession && !hasRaceActuallyStarted.current) {
          // Race hasn't started yet but we're seeing "Finished" - this is a false positive
          // from the Quali->Race transition. Don't mark as completed.
          console.log(`[RaceDay] Ignoring false race completion - race hasn't started yet. RaceState: ${session.raceState}`)
        } else if (session.sessionState === 'Racing' || session.sessionState === 'Green Flag' ||
                   session.raceState === 'Racing') {
          setSessionStatus('in_progress')
        }
      }
    }
    
    const handleParticipants = (data: any) => {
      if (data?.participants) {
        setParticipants(data.participants)
      }
    }
    
    const handleRaceComplete = (data: TelemetryRaceResult) => {
      console.log('[RaceDay] Session complete detected:', data)
      
      // Guard: Don't process if we already processed THIS SESSION TYPE this week
      // Use REF for synchronous check to prevent race conditions from async state updates
      const currentWeek = careerState?.currentWeek
      const sessionKey = `${currentWeek}-${data.sessionType}`
      
      if (sessionsProcessedThisWeek.current.has(sessionKey)) {
        console.log('[RaceDay] Session already processed:', sessionKey, '- skipping duplicate')
        return
      }
      
      // IMMEDIATELY mark THIS SESSION as processed using ref (synchronous) to block any concurrent calls
      sessionsProcessedThisWeek.current.add(sessionKey)
      console.log('[RaceDay] Processing session:', sessionKey)
      
      const participantCount = data.allParticipants?.length || 0
      const sessionResult: SessionResult = {
        completed: true,
        bestLapTime: data.bestLapTime || 0,
        position: data.playerPosition,
        participantCount,
        completedAt: new Date().toISOString()
      }
      
      // Handle Practice session completion
      if (data.sessionType === 'Practice' || data.sessionType === 'Test') {
        console.log('[RaceDay] Practice session completed:', sessionResult)
        
        updateRaceWeekendProgress({
          trackId: currentRace?.trackId || '',
          week: careerState?.currentWeek || 0,
          year: careerState?.currentYear || 0,
          practice: sessionResult
        })
        
        setSessionStatus('completed')
        
        addToast({
          type: 'success',
          title: 'Practice Complete',
          message: `P${data.playerPosition} of ${participantCount} - Best lap: ${formatLapTime(data.bestLapTime || 0)}`,
          duration: 4000
        })
        
        return
      }
      
      // Handle Qualifying session completion
      if (data.sessionType === 'Qualifying') {
        console.log('[RaceDay] Qualifying session completed:', sessionResult)
        
        updateRaceWeekendProgress({
          trackId: currentRace?.trackId || '',
          week: careerState?.currentWeek || 0,
          year: careerState?.currentYear || 0,
          qualifying: sessionResult
        })
        
        setSessionStatus('completed')
        
        // Auto-fill the qualifying position in the results form
        setQualifyingPosition(data.playerPosition)
        
        const gridMessage = data.playerPosition === 1 
          ? '🏆 POLE POSITION!' 
          : data.playerPosition <= 3 
          ? `Front row start - P${data.playerPosition}` 
          : `Grid position: P${data.playerPosition}`
        
        addToast({
          type: data.playerPosition <= 3 ? 'achievement' : 'success',
          title: 'Qualifying Complete',
          message: `${gridMessage} - Best lap: ${formatLapTime(data.bestLapTime || 0)}`,
          duration: 5000
        })
        
        return
      }
      
      // Handle Race session completion (existing logic)
      if (data.sessionType !== 'Race') {
        console.log('[RaceDay] Not a Race session, skipping modal:', data.sessionType)
        return
      }
      
      console.log('[RaceDay] Processing RACE completion - will show modal')
      
      // Check if this is an invitational event
      const isCurrentInvitational = isInvitationalWeek()
      const currentInvitational = getCurrentInvitationalEvent()
      
      let processed: { points: number; prizeMoney: number; repChange: number }
      
      if (isCurrentInvitational && currentInvitational) {
        // Process invitational event completion
        const invitationalResult = completeInvitation(currentInvitational.instanceId, data.playerPosition)
        processed = {
          points: 0, // No championship points for invitationals
          prizeMoney: invitationalResult.prize,
          repChange: invitationalResult.reputationGained
        }
        console.log('[RaceDay] Processed INVITATIONAL result:', invitationalResult)
      } else {
        // Process regular race result
        processed = processRaceResult(data)
      }
      
      // Mark that we've processed a race this week (prevent double processing)
      if (careerState?.currentWeek) {
        setRaceProcessedForWeek(careerState.currentWeek)
      }
      
      // Mark race as complete in weekend progress with full result data
      const raceSessionResult: SessionResult = {
        completed: true,
        bestLapTime: data.bestLapTime || 0,
        position: data.playerPosition,
        participantCount: data.allParticipants?.length || data.totalParticipants,
        completedAt: new Date().toISOString()
      }
      
      updateRaceWeekendProgress({
        trackId: currentRace?.trackId || '',
        week: careerState?.currentWeek || 0,
        year: careerState?.currentYear || 0,
        race: raceSessionResult
      })
      
      // Update form for all AI drivers based on their race results
      if (data.allParticipants && currentSeries) {
        const gridSize = data.allParticipants.length
        data.allParticipants.forEach((participant: any) => {
          if (!participant.isPlayer && participant.name) {
            // Find the driver ID from name
            const drivers = useRivalStore.getState().rivals
            const driver = drivers.find(d => 
              `${d.firstName} ${d.lastName}` === participant.name
            )
            if (driver) {
              updateFormAfterRace(driver.id, participant.position, gridSize)
            }
          }
        })
        console.log(`[RaceDay] Updated form for ${data.allParticipants.length - 1} AI drivers`)
      }
      
      // Reset XML generated flag for next race
      setXmlGenerated(false)
      
      // Build debrief data snapshot (capture current state before it changes)
      const currentAiMod = getAIModifier()
      const playerSnap = useCareerStore.getState().player
      const carState = useCareerStore.getState().careerState
      const activeCar = carState?.cars?.find((c: TeamCar) => c.driverType === 'owner')
      const avgWear = activeCar?.partWear 
        ? Object.values(activeCar.partWear).reduce((a: number, b: unknown) => a + (typeof b === 'number' ? b : 0), 0) / Object.values(activeCar.partWear).length 
        : 0
      const carCondition: 'excellent' | 'good' | 'worn' | 'critical' = 
        avgWear < 20 ? 'excellent' : avgWear < 50 ? 'good' : avgWear < 80 ? 'worn' : 'critical'
      const qualiPos = carState?.raceWeekendProgress?.qualifying?.position ?? null
      const positionsGained = qualiPos ? qualiPos - data.playerPosition : 0
      
      const debrief = {
        fatigue: playerSnap?.mentalState?.fatigue ?? 0,
        fitness: playerSnap?.health?.fitness ?? 50,
        stress: playerSnap?.mentalState?.stress ?? 0,
        confidence: playerSnap?.mentalState?.confidence ?? 50,
        aiBreakdown: currentAiMod.breakdown,
        totalModifier: currentAiMod.modifier,
        modifierDescription: currentAiMod.description,
        carCondition,
        qualifyingPos: qualiPos,
        positionsGained
      }
      
      // Store data for modal
      console.log('[RaceDay] Showing Race Complete Modal now!', { position: data.playerPosition, dnf: data.dnf })
      setRaceCompleteData({ result: data, processed, debrief })
      setShowRaceCompleteModal(true)
      setSessionStatus('completed')
      
      // Show toast notification
      const pos = data.playerPosition
      if (data.dnf) {
        addToast({
          type: 'error',
          title: 'Race Retired',
          message: `DNF at ${data.trackName}. Better luck next time.`,
          duration: 5000
        })
      } else if (pos === 1) {
        addToast({
          type: 'achievement',
          title: '🏆 RACE WIN!',
          message: `Incredible victory at ${data.trackName}! +${processed.points} points, $${processed.prizeMoney.toLocaleString()}!`,
          duration: 8000
        })
      } else if (pos <= 3) {
        addToast({
          type: 'success',
          title: `🥈 Podium - P${pos}!`,
          message: `Great drive! +${processed.points} points, $${processed.prizeMoney.toLocaleString()} earned.`,
          duration: 6000
        })
      } else if (pos <= 10) {
        addToast({
          type: 'success',
          title: `Points Finish - P${pos}`,
          message: `Solid result! +${processed.points} points.`,
          duration: 5000
        })
      } else {
        addToast({
          type: 'info',
          title: `Race Finished - P${pos}`,
          message: `Completed at ${data.trackName}.`,
          duration: 4000
        })
      }
      
      // Check if this was the final race of the season
      setTimeout(() => {
        if (checkSeasonComplete()) {
          addToast({
            type: 'achievement',
            title: 'Season Complete!',
            message: 'All races finished. Head to Season Summary to review your results.',
            duration: 8000
          })
          // Auto-navigate to season end after a short delay
          setTimeout(() => {
            navigate('/season-end')
          }, 3000)
        }
      }, 500) // Small delay to let state settle
    }

    // @ts-ignore
    const unsubHeartbeat: (() => void) | undefined = window.electron?.on?.('telemetry:heartbeat', handleHeartbeat)
    // @ts-ignore
    const unsubSession: (() => void) | undefined = window.electron?.on?.('telemetry:session', handleSession)
    // @ts-ignore
    const unsubParticipants: (() => void) | undefined = window.electron?.on?.('telemetry:participants', handleParticipants)
    // @ts-ignore - onTelemetryRaceComplete doesn't return unsub, use removeListener for cleanup
    window.electron?.onTelemetryRaceComplete?.(handleRaceComplete)
    
    // Check initial status
    checkTelemetryStatus()

    return () => {
      // Cleanup IPC listeners to prevent memory leaks
      unsubHeartbeat?.()
      unsubSession?.()
      unsubParticipants?.()
      // Remove the race complete listener (registered via ipcRenderer.on, needs removeAllListeners)
      window.electron?.removeListener?.('telemetry:raceComplete', handleRaceComplete)
    }
  }, [processRaceResult, addToast])

  // Initialize sessionStatus from stored weekend progress on mount/tab change
  useEffect(() => {
    if (!careerState?.raceWeekendProgress) return
    
    const progress = careerState.raceWeekendProgress
    const matchesCurrentRace = progress.week === careerState.currentWeek && 
                               progress.year === careerState.currentYear
    
    if (!matchesCurrentRace) {
      // Clear processed sessions when week changes
      sessionsProcessedThisWeek.current.clear()
      return
    }
    
    // Check if the active session is already completed in stored progress
    if (activeSession === 'practice' && progress.practice?.completed) {
      setSessionStatus('completed')
    } else if (activeSession === 'qualifying' && progress.qualifying?.completed) {
      setSessionStatus('completed')
    } else if (activeSession === 'race' && progress.race?.completed) {
      setSessionStatus('completed')
    } else {
      // Reset to pending if session not completed (allows re-running sessions)
      setSessionStatus('pending')
    }
  }, [activeSession, careerState?.raceWeekendProgress, careerState?.currentWeek, careerState?.currentYear])

  const checkTelemetryStatus = async () => {
    try {
      // @ts-ignore
      const status = await window.electron?.invoke('telemetry:status')
      if (status) {
        setTelemetryStatus(prev => ({ ...prev, listening: status.isListening }))
      }
    } catch (err) {
      console.error('Failed to check telemetry status:', err)
    }
  }

  const handleConnectTelemetry = async () => {
    try {
      // @ts-ignore
      await window.electron?.invoke('telemetry:start')
      setTelemetryStatus(prev => ({ ...prev, listening: true }))
    } catch (err) {
      console.error('Failed to start telemetry:', err)
    }
  }

  /**
   * Generate AI driver XML for the current race weekend
   * This combines persistent skills with weekend form variance
   */
  const generateAIXML = useCallback(async () => {
    if (!currentSeries || !currentRace || !player) return false
    
    setIsGeneratingXML(true)
    
    try {
      // Prepare weekend form for all drivers
      prepareRaceWeekend(currentSeries.id, currentRace.trackId)
      
      // Get drivers with their calculated form
      const driversWithForm = getDriversWithForm(currentSeries.id, currentRace.trackId)
      
      // Get standings for championship position
      const standings = seasonStandings[currentSeries.id] || []
      
      // Map nationality back to country code
      const countryCodeMap: Record<string, string> = {
        'Brazil': 'BRA', 'UK': 'GBR', 'Germany': 'DEU', 'USA': 'USA',
        'France': 'FRA', 'Italy': 'ITA', 'Spain': 'ESP', 'Japan': 'JPN',
        'Australia': 'AUS', 'Netherlands': 'NLD', 'Belgium': 'BEL',
        'Austria': 'AUT', 'Portugal': 'PRT', 'Switzerland': 'CHE',
        'Mexico': 'MEX', 'Argentina': 'ARG', 'Canada': 'CAN',
        'New Zealand': 'NZL', 'Denmark': 'DNK', 'Sweden': 'SWE',
        'Norway': 'NOR', 'Finland': 'FIN', 'Poland': 'POL',
        'China': 'CHN', 'Thailand': 'THA', 'Monaco': 'MCO',
      }

      // Convert to the format expected by the XML generator
      // CRITICAL: Include liveryName from team data for AMS2 compatibility
      const persistentDriverData = driversWithForm.map(driver => {
        const standing = standings.find(s => 
          s.driverName === `${driver.firstName} ${driver.lastName}` || s.driverId === driver.id
        )
        
        // Get the team for this driver to access their exact livery name
        const driverTeam = getTeamById(driver.currentTeamId)
        // Use the first livery name from the team (each seat entry has a single livery)
        const liveryName = driverTeam?.liveryNames?.[0] || undefined
        
        if (!liveryName) {
          console.warn(`[RaceDay] No liveryName found for driver ${driver.firstName} ${driver.lastName} (team: ${driver.currentTeamId})`)
        }
        
        return {
          driverId: driver.id,
          driverName: `${driver.firstName} ${driver.lastName}`,
          country: countryCodeMap[driver.nationality] || 'USA',
          // CRITICAL: Pass exact livery name for AMS2 AI to work correctly
          liveryName,
          baseSkill: driver.baseSkill,
          weekendForm: driver.weekendForm,
          // Team development bonus - AI teams that have developed their car get a skill boost
          teamDevBonus: driver.teamDevBonus || 0,
          stats: driver.stats,
          formStreak: driver.formStreak,
          careerStage: driver.careerStage,
          championshipPosition: standing?.position || driversWithForm.length,
          totalDrivers: driversWithForm.length,
          seasonWins: driver.seasonStats?.wins || 0,
          seasonPodiums: driver.seasonStats?.podiums || 0,
          isPlayer: false // Will be filtered out
        }
      })
      
      // Get AMS2 path from settings
      const settings = localStorage.getItem('ams2-settings')
      const parsedSettings = settings ? JSON.parse(settings) : {}
      const ams2Path = parsedSettings.customAIPath || ''
      
      // Get the AI modifier for RPG effects
      const currentModifier = getAIModifier()
      
      // Get the carClassId for proper AMS2 filename mapping
      // This ensures the XML file is named correctly (e.g., P4.xml, Carrera Cup.xml)
      const carClassId = currentSeries.carClassId
      
      console.log(`[RaceDay] Generating AI XML for ${currentSeries.name} (carClassId: ${carClassId})`)
      console.log(`[RaceDay] Drivers with liveries: ${persistentDriverData.filter(d => d.liveryName).length}/${persistentDriverData.length}`)
      
      // Generate the XML with carClassId and RPG modifier
      // @ts-ignore
      const result = await window.electron?.generateRaceWeekendAI(
        persistentDriverData,
        currentSeries.name,
        { ams2Path, backupEnabled: true },
        carClassId,              // Pass carClassId for correct filename
        currentModifier.modifier  // Pass the RPG modifier
      )
      
      if (result?.success) {
        setXmlGenerated(true)
        const modifierPercent = (currentModifier.modifier * 100).toFixed(1)
        const modifierText = currentModifier.modifier !== 0 
          ? ` (${currentModifier.modifier < 0 ? '' : '+'}${modifierPercent}% RPG modifier)`
          : ''
        addToast({
          type: 'success',
          title: 'AI Drivers Updated',
          message: `Generated AI for ${result.driversGenerated} drivers${modifierText}`,
          duration: 3000
        })
        console.log(`[RaceDay] Generated AI XML: ${result.filePath} with modifier ${modifierPercent}%`)
        return true
      } else {
        console.error('[RaceDay] Failed to generate AI XML:', result?.error)
        addToast({
          type: 'warning',
          title: 'AI Generation Skipped',
          message: result?.error || 'Could not generate AI drivers',
          duration: 3000
        })
        return false
      }
    } catch (err) {
      console.error('[RaceDay] Error generating AI XML:', err)
      return false
    } finally {
      setIsGeneratingXML(false)
    }
  }, [currentSeries, currentRace, player, prepareRaceWeekend, getDriversWithForm, getTeamById, seasonStandings, addToast, getAIModifier])

  // Auto-generate AI XML when entering Race Day on a race week
  // NOTE: For invitational events, we skip XML generation since they use historic car classes
  // and the AI grid is different from the player's career series
  useEffect(() => {
    // Skip AI generation for invitational events - use default AMS2 AI
    if (isInvitational) {
      console.log('[RaceDay] Invitational event - skipping AI XML generation')
      return
    }
    
    // Only auto-generate if:
    // - It's a race week (currentRace exists)
    // - We haven't already generated
    // - We haven't attempted auto-generation yet
    // - Not currently generating
    if (currentRace && !xmlGenerated && !autoGenerateAttempted && !isGeneratingXML && currentSeries && player) {
      console.log('[RaceDay] Auto-generating AI for race weekend')
      setAutoGenerateAttempted(true)
      generateAIXML()
    }
  }, [currentRace, xmlGenerated, autoGenerateAttempted, isGeneratingXML, currentSeries, player, generateAIXML, isInvitational])

  // Reset auto-generate flag when race changes (new week)
  useEffect(() => {
    setAutoGenerateAttempted(false)
    contentPoolGenerated.current = false
    setContentPoolStatus('idle')
    setContentPoolStats(null)
    
    // Reset scheduler state
    if (schedulerStarted.current) {
      window.electron?.stopScheduler?.()
      schedulerStarted.current = false
    }
    lastReportedLap.current = 0
  }, [currentWeek])

  // TV Broadcast Commentary - Generate content pool when race loads
  useEffect(() => {
    const generateContentPool = async () => {
      // Skip if already generated, currently generating, or no race
      if (contentPoolGenerated.current || contentPoolStatus === 'generating' || !currentRace || !currentSeries || !player) {
        return
      }
      
      // Get API key from commentary settings
      let apiKey: string | null = null
      try {
        const commentaryStr = localStorage.getItem('commentary-settings')
        if (commentaryStr) {
          const commentary = JSON.parse(commentaryStr)
          if (commentary?.geminiKey && commentary?.enabled) {
            apiKey = commentary.geminiKey
          }
        }
      } catch (e) {
        console.warn('[RaceDay] Could not read commentary settings')
      }
      
      if (!apiKey) {
        console.log('[RaceDay] Commentary not configured, skipping content pool generation')
        return
      }
      
      // Wait for XML to be generated first (ensures drivers are set up)
      if (!xmlGenerated) {
        return
      }
      
      console.log('[RaceDay] Generating TV broadcast content pool...')
      setContentPoolStatus('generating')
      contentPoolGenerated.current = true
      
      try {
        // Build context for content pool
        const context = {
          trackId: currentRace.trackId,
          trackName: currentRace.trackName,
          seriesId: currentSeries.id,
          seriesName: currentSeries.name,
          drivers: participants.slice(0, 20).map((p, idx) => ({
            id: p.name?.replace(/\s+/g, '-').toLowerCase() || `driver-${idx}`,
            name: p.name || `Driver ${idx + 1}`,
            teamName: p.teamName || 'Unknown Team',
            position: idx + 1
          })),
          playerName: `${player.firstName} ${player.lastName}`,
          totalLaps: 20, // Default lap count - could be calculated from track length if needed
          championshipStandings: seasonStandings?.[currentSeries.id]?.slice(0, 10).map((s, i) => ({
            driverName: s.driverName,
            points: s.points,
            position: i + 1,
            wins: s.wins
          }))
        }
        
        const result = await window.electron?.generateContentPool?.(context, apiKey)
        
        if (result?.success) {
          setContentPoolStatus('ready')
          setContentPoolStats(result.stats || null)
          console.log('[RaceDay] Content pool ready:', result.stats)
        } else {
          setContentPoolStatus('error')
          console.error('[RaceDay] Content pool generation failed:', result?.error)
        }
      } catch (error) {
        setContentPoolStatus('error')
        console.error('[RaceDay] Content pool generation error:', error)
      }
    }
    
    generateContentPool()
  }, [currentRace, currentSeries, player, xmlGenerated, participants, seasonStandings, contentPoolStatus])

  const handleSubmitResults = () => {
    if (!player || !currentRace || !currentSeries || finishPosition === '') return
    
    const roundNumber = (currentSeries.calendar?.findIndex(e => e.week === currentWeek) ?? 0) + 1
    const points = calculatePoints(finishPosition as number)
    const prizeMoney = calculatePrizeMoney(finishPosition as number, currentSeries.prizeMoney)
    const position = finishPosition as number
    
    const result = {
      seriesId: currentSeries.id,
      round: roundNumber,
      trackId: currentRace.trackId,
      trackName: currentRace.trackName,
      date: new Date().toISOString(),
      qualifyingPosition: typeof qualifyingPosition === 'number' ? qualifyingPosition : position,
      racePosition: position,
      fastestLap: false, // Could add checkbox for this
      dnf: false,
      points,
      prizeMoney
    }
    
    addRaceResult(result)
    setSessionStatus('completed')
    
    // Show result toast
    const _positionSuffix = getOrdinalSuffix(position)
    if (position === 1) {
      addToast({
        type: 'achievement',
        title: '🏆 RACE WIN!',
        message: `Incredible! P1 at ${currentRace.trackName}! +${points} points, $${prizeMoney.toLocaleString()} prize money.`,
        duration: 6000
      })
    } else if (position <= 3) {
      addToast({
        type: 'success',
        title: `Podium Finish! P${position}`,
        message: `Great drive! +${points} points, $${prizeMoney.toLocaleString()} prize money.`,
        duration: 5000
      })
    } else if (position <= 10) {
      addToast({
        type: 'success',
        title: `Points Finish - P${position}`,
        message: `Solid result! +${points} points${prizeMoney > 0 ? `, $${prizeMoney.toLocaleString()}` : ''}.`,
        duration: 4000
      })
    } else {
      addToast({
        type: 'info',
        title: `Race Finished - P${position}`,
        message: `Completed at ${currentRace.trackName}.`,
        duration: 3000
      })
    }
    
    // Show save toast
    setTimeout(() => {
      addToast({
        type: 'save',
        title: 'Auto-Saved',
        message: 'Race result recorded.',
        duration: 2000
      })
    }, 500)
    
    // Reset form
    setFinishPosition('')
    setBestLapTime('')
    setQualifyingPosition('')
  }

  const getOrdinalSuffix = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return n + (s[(v - 20) % 10] || s[v] || s[0])
  }

  const calculatePrizeMoney = (position: number, prizeTable?: { win: number; podium: number; points: number }): number => {
    if (!prizeTable) return 0
    if (position === 1) return prizeTable.win
    if (position <= 3) return prizeTable.podium
    if (position <= 10) return prizeTable.points
    return 0
  }

  const calculatePoints = (position: number): number => {
    const pointsTable: Record<number, number> = {
      1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
      6: 8, 7: 6, 8: 4, 9: 2, 10: 1
    }
    return pointsTable[position] || 0
  }

  // Find player in participants
  const playerParticipant = participants.find(p => p.isPlayer)

  if (!player || !careerState) return null

  // Get stored race weekend progress
  const weekendProgress = careerState.raceWeekendProgress
  
  // Check if stored progress matches current race week
  const progressMatchesCurrentRace = weekendProgress && 
    weekendProgress.week === careerState.currentWeek && 
    weekendProgress.year === careerState.currentYear

  // Get pending media duties for this weekend
  const mediaState = careerState?.teamMediaState
  const pendingDuties = useMemo(() => {
    if (!mediaState?.dutySchedule?.weekendDuties) return []
    return mediaState.dutySchedule.weekendDuties.filter(
      d => (d.status === 'available' || d.status === 'upcoming') && 
           d.week === careerState?.currentWeek
    )
  }, [mediaState?.dutySchedule?.weekendDuties, careerState?.currentWeek])
  
  const activeDuties = pendingDuties.filter(d => d.status === 'available')
  const upcomingDuties = pendingDuties.filter(d => d.status === 'upcoming')
  
  // Determine which duty is relevant for current session
  const getRelevantDuty = (sessionType: SessionType): MediaDuty | undefined => {
    const dutyTypeMap: Record<SessionType, string[]> = {
      'practice': ['pre_practice', 'post_practice'],
      'qualifying': ['pre_qualifying', 'post_qualifying'],
      'race': ['pre_race', 'post_race']
    }
    const relevantTypes = dutyTypeMap[sessionType]
    return activeDuties.find(d => relevantTypes.includes(d.type))
  }
  
  const currentSessionDuty = getRelevantDuty(activeSession)

  const sessions = [
    { 
      id: 'practice', 
      label: 'Practice', 
      icon: Clock,
      completed: progressMatchesCurrentRace && weekendProgress.practice?.completed,
      result: progressMatchesCurrentRace ? weekendProgress.practice : undefined
    },
    { 
      id: 'qualifying', 
      label: 'Qualifying', 
      icon: Zap,
      completed: progressMatchesCurrentRace && weekendProgress.qualifying?.completed,
      result: progressMatchesCurrentRace ? weekendProgress.qualifying : undefined
    },
    { 
      id: 'race', 
      label: 'Race', 
      icon: Flag,
      completed: progressMatchesCurrentRace && weekendProgress.race?.completed,
      result: progressMatchesCurrentRace && weekendProgress.race?.completed ? {
        completed: true,
        bestLapTime: 0,
        position: 0,
        participantCount: 0,
        completedAt: new Date().toISOString()
      } : undefined
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={isInvitational ? "Invitational Event" : "Race Day"}
        subtitle={
          isInvitational && invitationalEvent 
            ? `${invitationalEvent.name} - ${invitationalEvent.trackName}`
            : currentRace 
              ? `Round ${currentSeries?.calendar?.indexOf(currentRace) ?? 0 + 1} - ${currentRace.trackName}`
              : 'No race scheduled'
        }
        icon={isInvitational ? <Trophy className="w-6 h-6 text-accent-gold" /> : <Flag className="w-6 h-6" />}
        actions={
          <div className="flex items-center gap-2">
            {telemetryStatus.listening ? (
              telemetryStatus.receiving ? (
                <Badge variant="green">
                  <HardDrive className="w-3 h-3 mr-1 animate-pulse" />
                  {telemetryStatus.raceState || liveSession?.sessionType || 'Connected'}
                </Badge>
              ) : (
                <Badge variant="orange">
                  <Radio className="w-3 h-3 mr-1" />
                  Waiting for AMS2...
                </Badge>
              )
            ) : (
              <Button variant="secondary" size="sm" onClick={handleConnectTelemetry}>
                <HardDrive className="w-4 h-4 mr-2" />
                Connect Telemetry
              </Button>
            )}
          </div>
        }
      />

      {/* Telemetry Status Bar - show when connected */}
      {telemetryStatus.listening && telemetryStatus.receiving && (
        <Card variant="glass" padding="sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-status-success rounded-full animate-pulse" />
                <span className="text-sm font-medium">AMS2 Connected</span>
              </div>
              <div className="h-4 w-px bg-surface-border" />
              <span className="text-sm text-text-muted">
                <span className="text-accent-orange">{liveSession?.sessionType || 'Session'}</span>
                {' • '}
                <span className={telemetryStatus.raceState === 'Racing' ? 'text-status-success' : ''}>{telemetryStatus.raceState || 'Ready'}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-muted">
                <Users className="w-3 h-3 inline mr-1" />
                {telemetryStatus.participantCount} drivers
              </span>
              {liveSession?.trackName && (
                <Badge variant="default" size="sm">
                  {liveSession.trackName}
                </Badge>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Invitational Event Banner */}
      {isInvitational && invitationalEvent && (
        <Card variant="racing" padding="lg" className="border-2 border-accent-gold bg-gradient-to-r from-accent-gold/10 to-accent-orange/10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-accent-gold/20 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-accent-gold" />
            </div>
            <div className="flex-1">
              <Badge variant="gold" className="mb-1">Special Invitational Event</Badge>
              <h3 className="font-display font-bold text-xl">{invitationalEvent.name}</h3>
              <p className="text-text-secondary">
                {invitationalEvent.organizerName} • {invitationalCarClass?.name || invitationalEvent.carClassName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">Prize Pool</p>
              <p className="font-display font-bold text-xl text-status-success">
                ${(invitationalEvent.rewards.prize / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-accent-orange">+{invitationalEvent.rewards.reputationBonus} Rep</p>
            </div>
          </div>
        </Card>
      )}

      {/* Media Duty Reminder - Show when there are pending duties */}
      {showDutyReminder && activeDuties.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <Card 
            variant="glass" 
            padding="md" 
            className="border-l-4 border-l-accent-orange bg-accent-orange/5"
          >
            <button 
              onClick={() => setShowDutyReminder(false)}
              className="absolute top-2 right-2 p-1 text-text-muted hover:text-text-primary transition-colors"
            >
              ×
            </button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-orange/20 flex items-center justify-center">
                  <Mic className="w-6 h-6 text-accent-orange" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-text-primary">Media Duties Pending</h3>
                    <Badge variant="warning" size="sm">{activeDuties.length} Active</Badge>
                  </div>
                  <p className="text-sm text-text-muted mt-0.5">
                    {activeDuties.map(d => getDutyDisplayInfo(d).name).join(', ')}
                  </p>
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => navigate('/media')}
                className="flex items-center gap-2"
              >
                <span>Complete Duties</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            {upcomingDuties.length > 0 && (
              <div className="mt-3 pt-3 border-t border-surface-border">
                <p className="text-xs text-text-muted">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {upcomingDuties.length} more duties scheduled for later this weekend
                </p>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Pre-Session Duty Alert - Show before starting a session with pending duty */}
      {currentSessionDuty && activeSession && (
        <Card 
          variant="glass" 
          padding="sm" 
          className="border border-status-warning bg-status-warning/5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-status-warning" />
              <div>
                <p className="text-sm font-medium text-status-warning">
                  Complete media duty before {activeSession}
                </p>
                <p className="text-xs text-text-muted">
                  {getDutyDisplayInfo(currentSessionDuty).name} - Skip penalty: ${currentSessionDuty.skipPenalty.fine.toLocaleString()}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/media')}
            >
              Go to Media
            </Button>
          </div>
        </Card>
      )}

      {/* Car Condition Warning - Show when car has critically worn parts */}
      {!carConditionCheck.canRace && activeCar && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card 
            variant="glass" 
            padding="md" 
            className="border-2 border-status-error bg-status-error/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-status-error/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-status-error" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-status-error">Car Not Race-Ready</h3>
                    <Badge variant="red" size="sm">{carConditionCheck.issues.length} Critical</Badge>
                  </div>
                  <p className="text-sm text-text-muted mt-0.5">
                    {carConditionCheck.issues.map(i => i.part).join(', ')} wear exceeds 90% - service required
                  </p>
                </div>
              </div>
              <Button 
                variant="primary"
                size="sm"
                onClick={() => navigate('/garage')}
                className="bg-status-error hover:bg-status-error/80"
              >
                <Wrench className="w-4 h-4 mr-2" />
                Service Car
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* No Race Warning */}
      {!currentRace && !isInvitational && (
        <Card variant="default" padding="lg">
          <div className="flex items-center gap-4 text-status-warning">
            <AlertCircle className="w-8 h-8" />
            <div>
              <h3 className="font-display font-semibold text-lg">No Race This Week</h3>
              <p className="text-text-muted">
                Check your calendar for upcoming race events. Current week: {currentWeek}
              </p>
            </div>
          </div>
        </Card>
      )}

      {currentRace && (
        <div className="grid grid-cols-3 gap-6">
          {/* Main Panel */}
          <div className="col-span-2 space-y-6">
            {/* Race Info Header with Track Image */}
            <Card variant="racing" padding="none" className="overflow-hidden">
              {/* Track Image Banner */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={getGeneratedTrackImage(currentRace.trackName, 'grandstand') || findTrackImageFromManifest(currentRace.trackName, layoutInfo?.name) || getTrackImageOriginal(currentRace.trackName, layoutInfo?.name)}
                  alt={currentRace.trackName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Try without layout name, fall back to original images
                    const target = e.currentTarget
                    if (!target.dataset.tried) {
                      target.dataset.tried = 'true'
                      target.src = findTrackImageFromManifest(currentRace.trackName) || getTrackImageOriginal(currentRace.trackName)
                    } else {
                      // Show gradient fallback
                      target.style.display = 'none'
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                
                {/* Weather Badge */}
                <div className="absolute top-4 right-4">
                  <Badge variant={currentRace.weather === 'rain' ? 'blue' : 'default'} size="lg">
                    {currentRace.weather === 'rain' ? '🌧️ Wet' : '☀️ Dry'}
                  </Badge>
                </div>
                
                {/* Track Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="font-display font-bold text-3xl mb-1 drop-shadow-lg">{currentRace.trackName}</h2>
                  <p className="text-text-secondary text-lg">{layoutInfo?.name || 'Grand Prix'} Layout</p>
                </div>
              </div>
              
              {/* Track Stats Bar */}
              <div className="p-4 bg-surface-secondary/50 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <span className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-accent-red" />
                    <span className="text-text-muted">Week</span>
                    <span className="font-bold">{currentWeek}</span>
                  </span>
                  <span className="flex items-center gap-2 text-sm">
                    <Timer className="w-4 h-4 text-accent-orange" />
                    <span className="text-text-muted">Length</span>
                    <span className="font-bold">{layoutInfo?.lengthKm ? `${layoutInfo.lengthKm.toFixed(2)} km` : 'N/A'}</span>
                  </span>
                  <span className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-accent-gold" />
                    <span className="text-text-muted">Turns</span>
                    <span className="font-bold">{layoutInfo?.turns || 'N/A'}</span>
                  </span>
                </div>
                <span className="flex items-center gap-2 text-sm">
                  <Car className="w-4 h-4 text-status-info" />
                  <span className="font-bold">{currentSeries?.gridSize || 20}</span>
                  <span className="text-text-muted">cars</span>
                </span>
              </div>
            </Card>

            {/* Session Selector */}
            <Card variant="glass" padding="none">
              <div className="flex border-b border-surface-border">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setActiveSession(session.id as SessionType)}
                    className={`
                      flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-all
                      ${activeSession === session.id 
                        ? 'bg-surface-secondary text-white border-b-2 border-accent-red' 
                        : 'text-text-muted hover:text-white hover:bg-surface/50'
                      }
                    `}
                  >
                    {session.completed ? (
                      <CheckCircle className="w-5 h-5 text-status-success" />
                    ) : (
                      <session.icon className="w-5 h-5" />
                    )}
                    {session.label}
                    {session.completed && (
                      <Badge variant="green" size="sm">Done</Badge>
                    )}
                    {!session.completed && liveSession?.sessionType?.toLowerCase().includes(session.id) && (
                      <span className="w-2 h-2 bg-status-success rounded-full animate-pulse" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-6">
                <SessionPanel
                  title={activeSession === 'practice' ? 'Free Practice' : activeSession === 'qualifying' ? 'Qualifying' : 'Race'}
                  description={
                    activeSession === 'practice' 
                      ? 'Test setups, learn the track, and prepare for qualifying'
                      : activeSession === 'qualifying'
                      ? 'Set your fastest lap to determine grid position'
                      : 'The main event - compete for championship points'
                  }
                  status={sessionStatus}
                  liveSession={liveSession}
                  isLive={telemetryStatus.receiving && liveSession?.sessionType?.toLowerCase().includes(activeSession)}
                  telemetryConnected={telemetryStatus.listening}
                  storedResult={sessions.find(s => s.id === activeSession)?.result as SessionResult | undefined}
                  isRaceSession={activeSession === 'race'}
                  isWeekendComplete={sessions.find(s => s.id === 'race')?.completed || false}
                  onAdvanceWeek={() => {
                    advanceWeek()
                    clearRaceWeekendProgress()
                    addToast({
                      type: 'success',
                      title: 'Week Advanced',
                      message: 'Moving to the next week of your career.',
                      duration: 3000
                    })
                    navigate('/')
                  }}
                  carConditionIssues={carConditionCheck.issues}
                  onShowCarConditionModal={() => setShowCarConditionModal(true)}
                />
              </div>
            </Card>

            {/* Live Participants (when receiving) */}
            {telemetryStatus.receiving && participants.length > 0 && (
              <Card variant="glass" padding="lg">
                <CardHeader 
                  title="Live Standings" 
                  subtitle={`${participants.length} participants`}
                  action={
                    <Badge variant="green" size="sm">
                      <Radio className="w-3 h-3 mr-1 animate-pulse" />
                      Live
                    </Badge>
                  }
                />
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {participants
                    .sort((a, b) => a.racePosition - b.racePosition)
                    .slice(0, 10)
                    .map((p, idx) => (
                      <div 
                        key={p.name || idx} 
                        className={`flex items-center gap-3 p-2 rounded ${p.isPlayer ? 'bg-accent-red/20 border border-accent-red/30' : 'bg-background/50'}`}
                      >
                        <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold
                          ${p.racePosition === 1 ? 'bg-accent-gold text-black' : 
                            p.racePosition === 2 ? 'bg-gray-400 text-black' :
                            p.racePosition === 3 ? 'bg-amber-700 text-white' : 'bg-surface-secondary'}`}
                        >
                          {p.racePosition}
                        </span>
                        <span className={`flex-1 text-sm ${p.isPlayer ? 'font-bold text-accent-red' : ''}`}>
                          {p.name || `Driver ${idx + 1}`}
                          {p.isPlayer && ' (You)'}
                        </span>
                        <span className="text-xs text-text-muted font-mono">
                          {p.bestLapTime > 0 ? formatLapTime(p.bestLapTime) : '-'}
                        </span>
                      </div>
                    ))}
                </div>
              </Card>
            )}

            {/* Race Results - Auto from Telemetry */}
            <Card variant="default" padding="lg">
              <CardHeader 
                title="Race Results" 
                subtitle={playerParticipant ? "Live results from telemetry" : "Waiting for telemetry data..."}
              />
              
              {/* Live Position Display */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-background/50 rounded-xl">
                  <p className="text-sm text-text-muted mb-1">Qualifying</p>
                  <p className={`font-display font-bold text-3xl ${qualifyingPosition && qualifyingPosition <= 3 ? 'text-accent-gold' : 'text-white'}`}>
                    {qualifyingPosition ? `P${qualifyingPosition}` : '-'}
                  </p>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-xl">
                  <p className="text-sm text-text-muted mb-1">Race Finish</p>
                  <p className={`font-display font-bold text-3xl ${playerParticipant?.racePosition && playerParticipant.racePosition <= 3 ? 'text-accent-gold' : 'text-white'}`}>
                    {playerParticipant?.racePosition ? `P${playerParticipant.racePosition}` : finishPosition ? `P${finishPosition}` : '-'}
                  </p>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-xl">
                  <p className="text-sm text-text-muted mb-1">Best Lap</p>
                  <p className="font-mono font-bold text-xl text-accent-cyan">
                    {playerParticipant?.bestLapTime && playerParticipant.bestLapTime > 0 
                      ? formatLapTime(playerParticipant.bestLapTime) 
                      : bestLapTime || '-'}
                  </p>
                </div>
              </div>

              {/* Points Preview */}
              {(playerParticipant?.racePosition || finishPosition) && (
                <div className="p-4 bg-background/50 rounded-xl mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Points for P{playerParticipant?.racePosition || finishPosition}:</span>
                    <span className="font-display font-bold text-2xl text-accent-gold">
                      +{calculatePoints((playerParticipant?.racePosition || finishPosition) as number)} pts
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  variant="primary" 
                  className="flex-1"
                  onClick={() => {
                    // Use telemetry data if available, fall back to manual
                    if (playerParticipant?.racePosition) {
                      setFinishPosition(playerParticipant.racePosition)
                      if (playerParticipant.bestLapTime > 0) {
                        setBestLapTime(formatLapTime(playerParticipant.bestLapTime))
                      }
                    }
                    handleSubmitResults()
                  }}
                  disabled={!playerParticipant?.racePosition && finishPosition === ''}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Race Result
                </Button>
              </div>
              
              {!playerParticipant && (
                <p className="text-xs text-text-muted/60 mt-3 text-center">
                  💡 Results will auto-populate from AMS2 telemetry. Enable Shared Memory in game settings.
                </p>
              )}
            </Card>

            {/* AI Generation Status */}
            <Card variant="glass" padding="lg">
              <CardHeader 
                title="AI Drivers" 
                subtitle="Weekend form applied to AI skill levels"
              />
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileCode className={`w-5 h-5 ${xmlGenerated ? 'text-status-success' : 'text-text-muted'}`} />
                    <div>
                      <p className="text-sm font-medium">
                        {xmlGenerated ? 'AI Ready' : 'Not Generated'}
                      </p>
                      <p className="text-xs text-text-muted">
                        {xmlGenerated ? 'Form variance applied' : 'Will auto-generate on launch'}
                      </p>
                    </div>
                  </div>
                  {xmlGenerated && (
                    <Badge variant="green" size="sm">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ready
                    </Badge>
                  )}
                </div>
                
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={generateAIXML}
                  disabled={isGeneratingXML || !currentSeries || !currentRace}
                >
                  {isGeneratingXML ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate AI
                    </>
                  )}
                </Button>
                <p className="text-xs text-text-muted text-center">
                  Regenerate to apply new random weekend variance
                </p>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Driver Status */}
            <Card variant="racing" padding="lg">
              <CardHeader title="Driver Status" />
              <div className="space-y-4">
                <StatBar label="Confidence" value={player.mentalState?.confidence ?? 50} color="orange" />
                <StatBar label="Focus" value={100 - (player.mentalState?.fatigue ?? 0)} color="blue" />
                <StatBar label="Stress" value={player.mentalState?.stress ?? 20} color="red" />
              </div>
            </Card>

            {/* RPG AI Modifier */}
            <Card variant="glass" padding="lg">
              <CardHeader 
                title="RPG Modifier" 
                subtitle="Affects AI difficulty"
              />
              <div className="space-y-4">
                {/* Modifier Display */}
                <div className={`
                  p-4 rounded-xl text-center
                  ${aiModifier.modifier < 0 
                    ? 'bg-status-success/20 border border-status-success/30' 
                    : aiModifier.modifier > 0 
                    ? 'bg-status-error/20 border border-status-error/30'
                    : 'bg-surface-secondary border border-surface-border'}
                `}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {aiModifier.modifier < 0 ? (
                      <TrendingDown className="w-5 h-5 text-status-success" />
                    ) : aiModifier.modifier > 0 ? (
                      <TrendingUp className="w-5 h-5 text-status-error" />
                    ) : (
                      <Minus className="w-5 h-5 text-text-muted" />
                    )}
                    <span className={`font-display font-bold text-2xl
                      ${aiModifier.modifier < 0 
                        ? 'text-status-success' 
                        : aiModifier.modifier > 0 
                        ? 'text-status-error'
                        : 'text-text-muted'}
                    `}>
                      {aiModifier.modifier < 0 ? '' : '+'}{(aiModifier.modifier * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">
                    {aiModifier.modifier < 0 
                      ? 'AI is weaker (your advantage)' 
                      : aiModifier.modifier > 0 
                      ? 'AI is stronger (disadvantage)'
                      : 'No active modifiers'}
                  </p>
                </div>

                {/* Breakdown */}
                <div className="space-y-2 text-sm">
                  {aiModifier.breakdown.teamDevelopment !== 0 && (
                    <div className="flex justify-between p-2 bg-background/30 rounded">
                      <span className="text-text-muted">Team Development</span>
                      <span className="text-status-success">
                        {(aiModifier.breakdown.teamDevelopment * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {aiModifier.breakdown.milestonePerks !== 0 && (
                    <div className="flex justify-between p-2 bg-background/30 rounded">
                      <span className="text-text-muted">Milestone Perks</span>
                      <span className="text-status-success">
                        {(aiModifier.breakdown.milestonePerks * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {aiModifier.breakdown.formBonus !== 0 && (
                    <div className="flex justify-between p-2 bg-background/30 rounded">
                      <span className="text-text-muted">Hot Streak</span>
                      <span className="text-status-success">
                        {(aiModifier.breakdown.formBonus * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {aiModifier.breakdown.injuryPenalty !== 0 && (
                    <div className="flex justify-between p-2 bg-background/30 rounded">
                      <span className="text-text-muted">Injury</span>
                      <span className="text-status-error">
                        +{(aiModifier.breakdown.injuryPenalty * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {aiModifier.breakdown.fatiguePenalty !== 0 && (
                    <div className="flex justify-between p-2 bg-background/30 rounded">
                      <span className="text-text-muted">Fatigue</span>
                      <span className="text-status-error">
                        +{(aiModifier.breakdown.fatiguePenalty * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {aiModifier.breakdown.pressurePenalty !== 0 && (
                    <div className="flex justify-between p-2 bg-background/30 rounded">
                      <span className="text-text-muted">Pressure</span>
                      <span className="text-status-error">
                        +{(aiModifier.breakdown.pressurePenalty * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {aiModifier.modifier === 0 && (
                    <div className="flex items-center justify-center gap-2 p-3 text-text-muted">
                      <Activity className="w-4 h-4" />
                      <span>Train and race to unlock modifiers</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Weather */}
            <Card variant="glass" padding="lg">
              <CardHeader title="Conditions" />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                  <Thermometer className="w-5 h-5 text-accent-orange" />
                  <div>
                    <p className="text-xs text-text-muted">Air Temp</p>
                    <p className="font-mono font-medium">
                      {currentRace.weather === 'rain' ? '18°C' : '24°C'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                  <Thermometer className="w-5 h-5 text-accent-red" />
                  <div>
                    <p className="text-xs text-text-muted">Track Temp</p>
                    <p className="font-mono font-medium">
                      {currentRace.weather === 'rain' ? '22°C' : '38°C'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg col-span-2">
                  <Droplets className="w-5 h-5 text-status-info" />
                  <div>
                    <p className="text-xs text-text-muted">Weather</p>
                    <p className="font-mono font-medium">
                      {currentRace.weather === 'rain' ? 'Rain - 80% chance' : 'Dry - 0% rain chance'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Championship Position */}
            <Card variant="default" padding="lg">
              <CardHeader title="Championship" />
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <span className="text-text-muted">Position</span>
                  <span className="font-display font-bold">-</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <span className="text-text-muted">Points</span>
                  <span className="font-mono font-bold text-accent-gold">0</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <span className="text-text-muted">Wins</span>
                  <span className="font-mono font-bold">{player.totalWins}</span>
                </div>
              </div>
            </Card>

            {/* Series Info */}
            {currentSeries && (
              <Card variant="default" padding="lg">
                <CardHeader title="Series" />
                <div className="space-y-2">
                  <p className="font-display font-semibold">{currentSeries.name}</p>
                  <p className="text-sm text-text-muted">
                    Round {(currentSeries.calendar?.findIndex(e => e.week === currentWeek) ?? 0) + 1} of {currentSeries.calendar?.length || 0}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
      
      {/* Car Condition Warning Modal */}
      <Modal
        isOpen={showCarConditionModal}
        onClose={() => setShowCarConditionModal(false)}
        title="Car Not Race-Ready"
        size="md"
      >
        <div className="space-y-6">
          <div className="text-center py-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-status-error/20 flex items-center justify-center mb-4">
              <AlertTriangle className="w-10 h-10 text-status-error" />
            </div>
            <h2 className="font-display font-bold text-xl mb-2">Critical Wear Detected</h2>
            <p className="text-text-muted">
              Your car has critically worn parts that must be serviced before racing.
            </p>
          </div>
          
          {/* Critical Parts List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-text-muted">Parts requiring immediate attention:</h4>
            {carConditionCheck.issues.map(issue => (
              <div 
                key={issue.part}
                className="flex items-center justify-between p-3 bg-status-error/10 border border-status-error/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Wrench className="w-5 h-5 text-status-error" />
                  <span className="font-medium capitalize">{issue.part}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-background rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-status-error"
                      style={{ width: `${issue.wear}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono text-status-error">{issue.wear.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 bg-status-warning/10 border border-status-warning/30 rounded-lg">
            <p className="text-sm text-status-warning">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Racing with critically worn parts will likely result in a DNF or mechanical failure.
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowCarConditionModal(false)}
            >
              Stay on Race Day
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => {
                setShowCarConditionModal(false)
                navigate('/garage')
              }}
            >
              <Wrench className="w-4 h-4 mr-2" />
              Go to Garage
            </Button>
          </div>
        </div>
      </Modal>

      {/* Race Complete Modal */}
      <Modal
        isOpen={showRaceCompleteModal}
        onClose={() => setShowRaceCompleteModal(false)}
        title="Race Complete"
        size="md"
      >
        {raceCompleteData && (
          <div className="space-y-6">
            {/* Cutscene Banner */}
            {(() => {
              const cutsceneId = raceCompleteData.result.dnf ? 'pit-stop-drama' :
                raceCompleteData.result.playerPosition === 1 ? 'podium-celebration' :
                raceCompleteData.result.playerPosition <= 3 ? 'garage-celebration' :
                'race-start'
              const cutsceneSrc = getCutsceneImage(cutsceneId)
              return cutsceneSrc ? (
                <div className="relative h-32 -mx-6 -mt-6 overflow-hidden rounded-t-lg">
                  <img 
                    src={cutsceneSrc}
                    alt="Race moment"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                </div>
              ) : null
            })()}
            
            {/* Position Header */}
            <div className="text-center py-6">
              <div className={`
                w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4
                ${raceCompleteData.result.playerPosition === 1 ? 'bg-gradient-to-br from-accent-gold to-yellow-600' :
                  raceCompleteData.result.playerPosition <= 3 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                  'bg-gradient-to-br from-surface-secondary to-surface'}
              `}>
                <span className="font-display font-black text-4xl text-white">
                  {raceCompleteData.result.dnf ? 'DNF' : `P${raceCompleteData.result.playerPosition}`}
                </span>
              </div>
              <h2 className="font-display font-bold text-2xl mb-1">
                {raceCompleteData.result.dnf ? 'Race Retired' :
                  raceCompleteData.result.playerPosition === 1 ? '🏆 VICTORY!' :
                  raceCompleteData.result.playerPosition <= 3 ? 'Podium Finish!' :
                  raceCompleteData.result.playerPosition <= 10 ? 'Points Finish' : 'Race Complete'}
              </h2>
              <p className="text-text-muted">{raceCompleteData.result.trackName}</p>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-background/50 rounded-xl">
                <Trophy className="w-6 h-6 mx-auto mb-2 text-accent-gold" />
                <p className="text-2xl font-bold text-accent-gold">+{raceCompleteData.processed.points}</p>
                <p className="text-xs text-text-muted">Points</p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-xl">
                <span className="text-2xl mb-2 block">💰</span>
                <p className="text-2xl font-bold text-status-success">${raceCompleteData.processed.prizeMoney.toLocaleString()}</p>
                <p className="text-xs text-text-muted">Prize Money</p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-xl">
                <span className="text-2xl mb-2 block">⭐</span>
                <p className={`text-2xl font-bold ${raceCompleteData.processed.repChange >= 0 ? 'text-status-success' : 'text-status-error'}`}>
                  {raceCompleteData.processed.repChange >= 0 ? '+' : ''}{raceCompleteData.processed.repChange}
                </p>
                <p className="text-xs text-text-muted">Reputation</p>
              </div>
            </div>
            
            {/* Race Debrief -- Contributing Factors */}
            {raceCompleteData.debrief && (
              <div className="p-4 bg-background/50 rounded-xl space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-text-primary">
                  <Activity className="w-4 h-4 text-accent-primary" />
                  Race Debrief — Contributing Factors
                </h4>
                
                {/* Qualifying vs Race */}
                {raceCompleteData.debrief.qualifyingPos && !raceCompleteData.result.dnf && (
                  <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
                    raceCompleteData.debrief.positionsGained > 0 
                      ? 'bg-status-success/10 text-status-success' 
                      : raceCompleteData.debrief.positionsGained < 0 
                        ? 'bg-status-error/10 text-status-error'
                        : 'bg-surface-secondary text-text-muted'
                  }`}>
                    {raceCompleteData.debrief.positionsGained > 0 ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : raceCompleteData.debrief.positionsGained < 0 ? (
                      <TrendingDown className="w-3.5 h-3.5" />
                    ) : (
                      <Minus className="w-3.5 h-3.5" />
                    )}
                    <span>
                      Qualified P{raceCompleteData.debrief.qualifyingPos} → Finished P{raceCompleteData.result.playerPosition}
                      {raceCompleteData.debrief.positionsGained > 0 
                        ? ` (gained ${raceCompleteData.debrief.positionsGained} places)` 
                        : raceCompleteData.debrief.positionsGained < 0 
                          ? ` (lost ${Math.abs(raceCompleteData.debrief.positionsGained)} places)`
                          : ' (held position)'}
                    </span>
                  </div>
                )}
                
                {/* Factor Rows */}
                <div className="space-y-1.5">
                  {/* Fatigue */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        raceCompleteData.debrief.fatigue >= 80 ? 'bg-status-error' : 
                        raceCompleteData.debrief.fatigue >= 50 ? 'bg-status-warning' : 'bg-status-success'
                      }`} />
                      <span className="text-text-muted">Fatigue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={
                        raceCompleteData.debrief.fatigue >= 80 ? 'text-status-error font-medium' : 
                        raceCompleteData.debrief.fatigue >= 50 ? 'text-status-warning' : 'text-status-success'
                      }>
                        {raceCompleteData.debrief.fatigue >= 80 ? 'HIGH' : raceCompleteData.debrief.fatigue >= 50 ? 'MODERATE' : 'LOW'}
                        {' '}({Math.round(raceCompleteData.debrief.fatigue)})
                      </span>
                      {raceCompleteData.debrief.aiBreakdown.fatiguePenalty !== 0 && (
                        <span className="text-status-error text-[10px] px-1.5 py-0.5 bg-status-error/10 rounded">
                          +{(raceCompleteData.debrief.aiBreakdown.fatiguePenalty * 100).toFixed(1)}% AI
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Fitness */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        raceCompleteData.debrief.fitness >= 70 ? 'bg-status-success' : 
                        raceCompleteData.debrief.fitness >= 40 ? 'bg-status-warning' : 'bg-status-error'
                      }`} />
                      <span className="text-text-muted">Fitness</span>
                    </div>
                    <span className={
                      raceCompleteData.debrief.fitness >= 70 ? 'text-status-success' : 
                      raceCompleteData.debrief.fitness >= 40 ? 'text-status-warning' : 'text-status-error'
                    }>
                      {raceCompleteData.debrief.fitness >= 70 ? 'STRONG' : raceCompleteData.debrief.fitness >= 40 ? 'ADEQUATE' : 'POOR'}
                      {' '}({Math.round(raceCompleteData.debrief.fitness)})
                    </span>
                  </div>
                  
                  {/* Car Condition */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        raceCompleteData.debrief.carCondition === 'excellent' ? 'bg-status-success' :
                        raceCompleteData.debrief.carCondition === 'good' ? 'bg-status-success' :
                        raceCompleteData.debrief.carCondition === 'worn' ? 'bg-status-warning' : 'bg-status-error'
                      }`} />
                      <span className="text-text-muted">Car Condition</span>
                    </div>
                    <span className={
                      raceCompleteData.debrief.carCondition === 'excellent' || raceCompleteData.debrief.carCondition === 'good' 
                        ? 'text-status-success' 
                        : raceCompleteData.debrief.carCondition === 'worn' ? 'text-status-warning' : 'text-status-error'
                    }>
                      {raceCompleteData.debrief.carCondition.toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Team Development */}
                  {raceCompleteData.debrief.aiBreakdown.teamDevelopment !== 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent-primary" />
                        <span className="text-text-muted">Team R&D</span>
                      </div>
                      <span className="text-accent-primary">
                        {(raceCompleteData.debrief.aiBreakdown.teamDevelopment * 100).toFixed(1)}% advantage
                      </span>
                    </div>
                  )}
                  
                  {/* Form / Hot Streak */}
                  {raceCompleteData.debrief.aiBreakdown.formBonus !== 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent-gold" />
                        <span className="text-text-muted">Hot Streak</span>
                      </div>
                      <span className="text-accent-gold">
                        {(raceCompleteData.debrief.aiBreakdown.formBonus * 100).toFixed(1)}% bonus
                      </span>
                    </div>
                  )}
                  
                  {/* Milestone Perks */}
                  {raceCompleteData.debrief.aiBreakdown.milestonePerks !== 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                        <span className="text-text-muted">Career Milestones</span>
                      </div>
                      <span className="text-purple-400">
                        {(raceCompleteData.debrief.aiBreakdown.milestonePerks * 100).toFixed(1)}% bonus
                      </span>
                    </div>
                  )}
                  
                  {/* Injury */}
                  {raceCompleteData.debrief.aiBreakdown.injuryPenalty !== 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-status-error" />
                        <span className="text-text-muted">Injury</span>
                      </div>
                      <span className="text-status-error font-medium">
                        +{(raceCompleteData.debrief.aiBreakdown.injuryPenalty * 100).toFixed(1)}% AI penalty
                      </span>
                    </div>
                  )}
                  
                  {/* Pressure */}
                  {raceCompleteData.debrief.aiBreakdown.pressurePenalty !== 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-status-error" />
                        <span className="text-text-muted">Title Pressure</span>
                      </div>
                      <span className="text-status-error">
                        +{(raceCompleteData.debrief.aiBreakdown.pressurePenalty * 100).toFixed(1)}% AI penalty
                      </span>
                    </div>
                  )}
                  
                  {/* Confidence */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        raceCompleteData.debrief.confidence >= 60 ? 'bg-status-success' :
                        raceCompleteData.debrief.confidence >= 30 ? 'bg-status-warning' : 'bg-status-error'
                      }`} />
                      <span className="text-text-muted">Confidence</span>
                    </div>
                    <span className={
                      raceCompleteData.debrief.confidence >= 60 ? 'text-status-success' :
                      raceCompleteData.debrief.confidence >= 30 ? 'text-status-warning' : 'text-status-error'
                    }>
                      {raceCompleteData.debrief.confidence >= 60 ? 'HIGH' : raceCompleteData.debrief.confidence >= 30 ? 'MODERATE' : 'LOW'}
                    </span>
                  </div>
                </div>
                
                {/* Overall AI Modifier Summary */}
                <div className={`mt-3 pt-3 border-t border-surface-border flex items-center justify-between text-xs`}>
                  <span className="font-medium text-text-primary">Overall Race Modifier</span>
                  <span className={`font-bold px-2 py-1 rounded ${
                    raceCompleteData.debrief.totalModifier < 0 
                      ? 'bg-status-success/10 text-status-success' 
                      : raceCompleteData.debrief.totalModifier > 0 
                        ? 'bg-status-error/10 text-status-error'
                        : 'bg-surface-secondary text-text-muted'
                  }`}>
                    {raceCompleteData.debrief.totalModifier < 0 ? '' : '+'}{(raceCompleteData.debrief.totalModifier * 100).toFixed(1)}%
                    {raceCompleteData.debrief.totalModifier < 0 ? ' (Your Advantage)' : 
                     raceCompleteData.debrief.totalModifier > 0 ? ' (AI Advantage)' : ' (Neutral)'}
                  </span>
                </div>
              </div>
            )}
            
            {/* Race Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-background/30 rounded">
                <span className="text-text-muted">Car</span>
                <span>{raceCompleteData.result.carName}</span>
              </div>
              <div className="flex justify-between p-2 bg-background/30 rounded">
                <span className="text-text-muted">Class</span>
                <span>{raceCompleteData.result.carClass}</span>
              </div>
              <div className="flex justify-between p-2 bg-background/30 rounded">
                <span className="text-text-muted">Laps Completed</span>
                <span>{raceCompleteData.result.lapsCompleted}</span>
              </div>
              {raceCompleteData.result.bestLapTime > 0 && (
                <div className="flex justify-between p-2 bg-background/30 rounded">
                  <span className="text-text-muted">Best Lap</span>
                  <span className="font-mono">{formatLapTime(raceCompleteData.result.bestLapTime)}</span>
                </div>
              )}
              <div className="flex justify-between p-2 bg-background/30 rounded">
                <span className="text-text-muted">Field Size</span>
                <span>{raceCompleteData.result.totalParticipants} drivers</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowRaceCompleteModal(false)}
              >
                Stay on Race Day
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  advanceWeek()
                  clearRaceWeekendProgress()
                  setShowRaceCompleteModal(false)
                  addToast({
                    type: 'success',
                    title: 'Week Advanced',
                    message: 'Race weekend complete! Moving to the next week.',
                    duration: 3000
                  })
                  navigate('/')
                }}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Finish Weekend
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

interface SessionPanelProps {
  title: string
  description: string
  status: 'pending' | 'ready' | 'in_progress' | 'completed'
  liveSession?: TelemetrySession | null
  isLive?: boolean
  telemetryConnected?: boolean
  storedResult?: SessionResult
  isRaceSession?: boolean
  isWeekendComplete?: boolean
  onAdvanceWeek?: () => void
  carConditionIssues?: { part: keyof CarPartWear; wear: number }[]
  onShowCarConditionModal?: () => void
}

function SessionPanel({ title, description, status, liveSession, isLive, telemetryConnected, storedResult, isRaceSession, isWeekendComplete, onAdvanceWeek, carConditionIssues, onShowCarConditionModal }: SessionPanelProps) {
  // If we have a stored result, show that instead
  const hasStoredResult = storedResult?.completed
  const effectiveStatus = hasStoredResult ? 'completed' : status
  const hasCarIssues = carConditionIssues && carConditionIssues.length > 0
  
  return (
    <div className="text-center py-8">
      <div className={`
        w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4
        ${hasCarIssues && !hasStoredResult
          ? 'bg-status-error/20 text-status-error'
          : isLive 
          ? 'bg-status-success/20 text-status-success animate-pulse' 
          : effectiveStatus === 'completed'
          ? 'bg-status-success/20 text-status-success'
          : telemetryConnected
          ? 'bg-accent-orange/20 text-accent-orange'
          : 'bg-surface-secondary text-text-muted'
        }
      `}>
        {hasCarIssues && !hasStoredResult ? (
          <AlertTriangle className="w-10 h-10" />
        ) : effectiveStatus === 'completed' ? (
          <CheckCircle className="w-10 h-10" />
        ) : isLive ? (
          <Radio className="w-10 h-10" />
        ) : telemetryConnected ? (
          <HardDrive className="w-10 h-10" />
        ) : (
          <Clock className="w-10 h-10" />
        )}
      </div>
      
      <h3 className="font-display font-bold text-2xl mb-2">{title}</h3>
      <p className="text-text-muted mb-6 max-w-md mx-auto">{description}</p>
      
      {/* Car Condition Warning in Session Panel */}
      {hasCarIssues && !hasStoredResult && (
        <div className="mb-6 p-4 bg-status-error/10 border border-status-error/30 rounded-xl max-w-md mx-auto">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-status-error" />
            <span className="font-medium text-status-error">Car Service Required</span>
          </div>
          <p className="text-sm text-text-muted mb-3">
            {carConditionIssues.map(i => i.part).join(', ')} wear is critical ({'>'}90%)
          </p>
          {onShowCarConditionModal && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onShowCarConditionModal}
              className="border-status-error text-status-error hover:bg-status-error/10"
            >
              View Details
            </Button>
          )}
        </div>
      )}

      {isLive ? (
        <div className="space-y-3">
          <Badge variant="green" size="lg">
            <Radio className="w-4 h-4 mr-2 animate-pulse" />
            Session In Progress
          </Badge>
          <p className="text-sm text-text-muted">
            {liveSession?.sessionState} • {liveSession?.numParticipants || 0} participants
          </p>
        </div>
      ) : hasStoredResult ? (
        // Show stored session results
        <div className="space-y-4">
          <Badge variant="green" size="lg">
            <CheckCircle className="w-4 h-4 mr-2" />
            Session Completed
          </Badge>
          
          {/* Results Summary */}
          <div className="bg-surface-secondary rounded-xl p-4 max-w-sm mx-auto">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-display font-bold text-accent-red">
                  P{storedResult.position}
                </p>
                <p className="text-xs text-text-muted">Position</p>
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-accent-orange">
                  {formatLapTime(storedResult.bestLapTime)}
                </p>
                <p className="text-xs text-text-muted">Best Lap</p>
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-status-info">
                  {storedResult.participantCount}
                </p>
                <p className="text-xs text-text-muted">Drivers</p>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-text-muted">
            Completed at {new Date(storedResult.completedAt).toLocaleTimeString()}
          </p>
          
          {/* Show advance week button when race is complete */}
          {isRaceSession && isWeekendComplete && onAdvanceWeek && (
            <Button
              variant="primary"
              className="mt-4"
              onClick={onAdvanceWeek}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Advance Week & Return Home
            </Button>
          )}
        </div>
      ) : effectiveStatus === 'completed' ? (
        <div className="space-y-4">
          <Badge variant="green" size="lg">
            <CheckCircle className="w-4 h-4 mr-2" />
            Completed
          </Badge>
          
          {/* Show advance week button when race is complete */}
          {isRaceSession && isWeekendComplete && onAdvanceWeek && (
            <Button
              variant="primary"
              onClick={onAdvanceWeek}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Advance Week & Return Home
            </Button>
          )}
        </div>
      ) : telemetryConnected ? (
        <div className="space-y-3">
          <Badge variant="orange" size="lg">
            <HardDrive className="w-4 h-4 mr-2" />
            Waiting for Session...
          </Badge>
          <p className="text-xs text-text-muted">
            Open AMS2 and start a session - it will be detected automatically
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <Badge variant="default" size="lg">
            <WifiOff className="w-4 h-4 mr-2" />
         