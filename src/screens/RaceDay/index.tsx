import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
  Trophy,
  HardDrive,
  Mic,
  ChevronRight,
  AlertTriangle,
  Wrench,
  Calendar,
  MapPin,
  FileCode,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Minus,
  Activity,
  ArrowRight,
  DollarSign,
  Wind,
} from 'lucide-react'
import { useToast } from '@/components/ui'
import { getDriverPortrait, getCutsceneImage } from '@/utils/generated-assets'
import { getTrackImage, findTrackImageFromManifest } from '@/utils/images'
import { useCareerStore } from '@/store/careerStore'
import type { TeamCar, CarPartWear, TelemetryRaceResult, SessionResult, ScheduledActivity } from '@/store/careerStore'
import type { AIModifierResult } from '@/simulation/aiModifiers'
import { useRivalStore } from '@/store/rivalStore'
import type { RaceEvent } from '@/store/rivalStore'
import { getPreRacePool, getDriverNarrative, getDriverNarrativeByName, getTrackNarrativeFromPreGen, isContentLoaded as isPreGenContentLoaded } from '@/services/preGeneratedContentService'
import { getNextGeminiApiKey } from '@/services/geminiKeyRotation'
import { buildCommentaryWorldSnapshot } from '@/services/commentaryWorldSnapshot'
import { AMS2_TRACKS } from '@/data/ams2-tracks'
import { AMS2_CAR_CLASSES } from '@/data/ams2-cars'
import { getActivityTimeCost } from '@/data/activity-time-costs'

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }
const CARD =
  'bg-[rgba(255,255,255,0.8)] border-[1.6px] border-black rounded-[16px] overflow-hidden shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]'

type SessionType = 'practice' | 'qualifying' | 'race'
type TelemetryStatus = { listening: boolean; receiving: boolean; lastPacket: number; participantCount: number }
type TelemetrySession = any // Electron telemetry session data

export default function RaceDayScreen() {
  const navigate = useNavigate()
  const {
    player,
    careerState,
    isInvitationalWeek,
    getCurrentInvitationalEvent,
    getAIModifier,
    processRaceResult,
    updateRaceWeekendProgress,
    markScheduledActivityCompleted,
    completeInvitation,
    consumeHoursFromBudget
  } = useCareerStore()
  const {
    getSeriesById,
    getDriversWithForm,
    getTeamById,
    seasonStandings,
    prepareRaceWeekend,
    updateFormAfterRace,
    rivals,
    getTeamDevelopmentRanking,
    teams: rivalTeams
  } = useRivalStore()
  const { addToast } = useToast()
  const isElectron = !!(window as any).electron
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
  
  // Beat-by-beat reveal step: 0=moment, 1=story, 2=consequences, 3=nextChapter
  const [revealStep, setRevealStep] = useState(0)

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
  
  // Compute AI modifier from store
  const aiModifier = useMemo(() => getAIModifier(), [getAIModifier])

  // Compute field development intel for the player's series
  const fieldDevelopment = useMemo(() => {
    const resolvedSeriesId = player?.currentSeriesId || careerState?.seriesEntries?.[0]?.seriesId
    if (!resolvedSeriesId) return null
    const ranking = getTeamDevelopmentRanking(resolvedSeriesId)
    if (!ranking || ranking.length === 0) return null
    const maxPoints = 400
    const avgPoints = ranking.reduce((sum, t) => sum + t.totalPoints, 0) / ranking.length
    const topTeam = ranking[0]
    const bottomTeam = ranking[ranking.length - 1]
    return {
      avgPercent: Math.min(100, (avgPoints / maxPoints) * 100),
      topTeam,
      bottomTeam,
      ranking,
      totalTeams: ranking.length
    }
  }, [player?.currentSeriesId, careerState?.seriesEntries, getTeamDevelopmentRanking, rivalTeams])

  const rivalByFullName = useMemo(() => {
    const map = new Map<string, (typeof rivals)[number]>()
    for (const r of rivals || []) {
      map.set(`${r.firstName} ${r.lastName}`.trim().toLowerCase(), r)
    }
    return map
  }, [rivals])

  const getParticipantPortrait = useCallback((driverName?: string): string => {
    if (!driverName) return ''
    const normalizedName = driverName.trim().toLowerCase()

    if (player) {
      const playerName = `${player.firstName} ${player.lastName}`.trim().toLowerCase()
      if (normalizedName === playerName) {
        return (
          getDriverPortrait(player.id) ||
          getDriverPortrait(`${player.firstName} ${player.lastName}`, player.nationality || player.country) ||
          ''
        )
      }
    }

    const rival = rivalByFullName.get(normalizedName)
    if (rival) {
      return (
        getDriverPortrait(rival.id) ||
        getDriverPortrait(`${rival.firstName} ${rival.lastName}`, rival.nationality || rival.country) ||
        ''
      )
    }

    // Last resort: try manifest name lookup directly.
    return getDriverPortrait(driverName) || ''
  }, [player, rivalByFullName])

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
  const activeSeriesId = useMemo(() => {
    const entries = careerState?.seriesEntries || []
    if (entries.length === 0) return player?.currentSeriesId
    const playerSeriesHasRaceThisWeek = player?.currentSeriesId
      ? !!getSeriesById(player.currentSeriesId)?.calendar?.some(e => e.week === (careerState?.currentWeek || 1))
      : false
    if (playerSeriesHasRaceThisWeek) return player?.currentSeriesId
    const raceWeekEntry = entries.find((entry) => getSeriesById(entry.seriesId)?.calendar?.some(e => e.week === (careerState?.currentWeek || 1)))
    return raceWeekEntry?.seriesId || player?.currentSeriesId || entries[0]?.seriesId
  }, [careerState?.seriesEntries, careerState?.currentWeek, player?.currentSeriesId, getSeriesById])

  const activeCar = useMemo(() => {
    if (!careerState?.cars || !activeSeriesId) return undefined
    return careerState.cars.find(c => {
      const ids = Array.isArray(c.seriesIds) && c.seriesIds.length > 0
        ? c.seriesIds
        : (c.seriesId ? [c.seriesId] : [])
      return ids.includes(activeSeriesId)
    })
  }, [careerState?.cars, activeSeriesId])
  
  // Check car condition
  const carConditionCheck = useMemo(() => {
    return checkCarCondition(activeCar)
  }, [activeCar, checkCarCondition])

  // Get current race from calendar OR invitational event
  const currentSeries = activeSeriesId ? getSeriesById(activeSeriesId) : null
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
      ) || currentSeries?.calendar?.find(
        event => event.week > currentWeek
      ) || currentSeries?.calendar?.[currentSeries.calendar.length - 1]
  
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
          // Reset commentary timeline whenever AMS2 changes session.
          if (schedulerStarted.current) {
            window.electron?.stopScheduler?.()
            schedulerStarted.current = false
            lastReportedLap.current = 0
          }

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
      
      const sessionType = session.sessionType || ''
      const isRaceSession = sessionType === 'Race' || sessionType === 'Formation Lap'
      const isCommentarySession =
        sessionType === 'Practice' ||
        sessionType === 'Test' ||
        sessionType === 'Qualifying' ||
        isRaceSession
      const hasSessionStarted =
        !!sessionType &&
        session.sessionState !== 'Session Over' &&
        session.raceState !== 'Finished' &&
        session.raceState !== 'Retired' &&
        session.raceState !== 'DNF' &&
        (
        session.raceState === 'Racing' ||
        session.sessionState === 'Racing' ||
        session.sessionState === 'Green Flag' ||
        (((session as any).currentLap || 0) > 0) ||
        (((session as any).sessionTimeRemaining || 0) > 0)
        )
      
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
      
      // Start commentary scheduler for any active session (practice/quali/race).
      if (isCommentarySession && hasSessionStarted && !schedulerStarted.current && contentPoolStatus === 'ready') {
        const fallbackLaps = Math.max(12, (((session as any).currentLap || 0) + 12))
        const totalLaps = session.lapsInEvent || fallbackLaps
        console.log(`[RaceDay] Starting commentary scheduler (${sessionType}) for ~${totalLaps} laps`)
        window.electron?.startScheduler?.(totalLaps)
        schedulerStarted.current = true
      }

      // Update scheduler with current lap (during practice/quali/race)
      if (isCommentarySession && hasSessionStarted && schedulerStarted.current) {
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
      if (schedulerStarted.current) {
        window.electron?.stopScheduler?.()
        schedulerStarted.current = false
        lastReportedLap.current = 0
      }
      const syncSessionActivityCompletion = (sessionType: 'Practice' | 'Qualifying' | 'Race') => {
        try {
          const latest = useCareerStore.getState()
          const cs = latest.careerState
          const raceWeek = cs?.currentWeek || 1
          const entries = cs?.seriesEntries || []
          const raceWeekEntry = entries.find((entry) =>
            useRivalStore.getState().getSeriesById(entry.seriesId)?.calendar?.some(e => e.week === raceWeek)
          )
          const seriesId = activeSeriesId || raceWeekEntry?.seriesId || latest.player?.currentSeriesId
          if (!cs || !seriesId) return
          const week = cs.currentWeek
          const prefix = sessionType === 'Practice'
            ? `race_session_practice_${seriesId}`
            : sessionType === 'Qualifying'
              ? `race_session_qualifying_${seriesId}`
              : `race_session_race_${seriesId}`
          const target = (cs.scheduledActivities || []).find(a =>
            a.status === 'scheduled' &&
            a.scheduledWeek === week &&
            a.templateId === prefix
          )
          if (target) {
            latest.markScheduledActivityCompleted(target.id)
          }
        } catch (e) {
          console.warn('[RaceDay] Failed to sync calendar session completion:', e)
        }
      }
      
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
        const practiceCost = getActivityTimeCost('race_practice')
        if (practiceCost.hours > 0 && consumeHoursFromBudget) {
          consumeHoursFromBudget(practiceCost.hours, practiceCost.drain, 'Free Practice', 'race_practice')
        }
        updateRaceWeekendProgress({
          trackId: currentRace?.trackId || '',
          week: careerState?.currentWeek || 0,
          year: careerState?.currentYear || 0,
          practice: sessionResult
        })
        syncSessionActivityCompletion('Practice')
        
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
        const qualiCost = getActivityTimeCost('race_qualifying')
        if (qualiCost.hours > 0 && consumeHoursFromBudget) {
          consumeHoursFromBudget(qualiCost.hours, qualiCost.drain, 'Qualifying', 'race_qualifying')
        }
        updateRaceWeekendProgress({
          trackId: currentRace?.trackId || '',
          week: careerState?.currentWeek || 0,
          year: careerState?.currentYear || 0,
          qualifying: sessionResult
        })
        syncSessionActivityCompletion('Qualifying')
        
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
      
      // Race session time cost
      const raceCost = getActivityTimeCost('race_race')
      if (raceCost.hours > 0 && consumeHoursFromBudget) {
        consumeHoursFromBudget(raceCost.hours, raceCost.drain, 'Race', 'race_race')
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
      syncSessionActivityCompletion('Race')
      
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
      setRevealStep(0)
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
  }, [processRaceResult, markScheduledActivityCompleted, addToast, activeSeriesId])

  // ── Commentary engine initialization ──
  // The main-process commentary engine must be configured+enabled from here,
  // because the Settings page (the only other source) may not be mounted.
  useEffect(() => {
    if (!isElectron) return

    let enabled = false
    let geminiKey = ''
    let elevenLabsKey = ''
    let voiceId = ''
    let coVoiceId = ''
    let pitReporterVoiceId = ''
    let volume = 80

    try {
      const raw = localStorage.getItem('commentary-settings')
      if (raw) {
        const s = JSON.parse(raw)
        enabled = !!s.enabled
        geminiKey = s.geminiKey || s.openAIKey || (Array.isArray(s.geminiKeys) ? s.geminiKeys[0] : '') || ''
        elevenLabsKey = s.elevenLabsKey || ''
        voiceId = s.voiceId || ''
        coVoiceId = s.coCommentatorVoiceId || ''
        pitReporterVoiceId = s.pitReporterVoiceId || ''
        volume = s.volume ?? 80
      }
    } catch { /* corrupt localStorage – leave defaults */ }

    if (!enabled || !geminiKey || !elevenLabsKey) {
      console.log('[RaceDay] Commentary not enabled or keys missing – skipping engine init')
      return
    }

    console.log('[RaceDay] Initialising commentary engine from localStorage')
    window.electron?.setCommentaryAPIKeys?.(geminiKey, elevenLabsKey)
    window.electron?.setCommentaryVoices?.(voiceId, coVoiceId, volume)
    if (pitReporterVoiceId) {
      window.electron?.setPitReporterVoice?.(pitReporterVoiceId)
    }
    window.electron?.setCommentaryEnabled?.(true)

    // No cleanup — the commentary engine runs in the main process and must
    // survive page navigation. Telemetry flows from shared memory regardless
    // of which renderer page is active. Disabling is handled explicitly by
    // the Settings toggle or on app close (stopCommentary in main.ts).
  }, [isElectron])

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
      
      // Do not hard-block commentary on XML generation.
      // XML improves AI setup, but commentary should still run in practice/quali/race
      // even if XML generation fails or is skipped.

      // ── Try pre-generated content pool first ──
      if (isPreGenContentLoaded()) {
        const trackId = currentRace.trackId
        const layoutId = currentRace.layoutId
        const preGenPool = getPreRacePool(trackId, layoutId)
        if (preGenPool) {
          console.log(`[RaceDay] Using pre-generated content pool for track: ${trackId}, layout: ${layoutId || 'default'}`)
          setContentPoolStatus('generating')
          contentPoolGenerated.current = true

          try {
            // Feed the pre-generated pool into the broadcast scheduler via IPC
            const result = await window.electron?.loadPreGeneratedContentPool?.({
              trackId,
              seriesId: currentSeries.id,
              pool: preGenPool
            })

            if (result?.success) {
              setContentPoolStatus('ready')
              setContentPoolStats(result.stats || null)
              console.log('[RaceDay] Pre-generated content pool loaded:', result.stats)
              return
            }
            // If IPC handler doesn't exist or fails, fall through to Gemini
            console.log('[RaceDay] Pre-generated pool IPC not available, falling back to Gemini')
          } catch {
            console.log('[RaceDay] Pre-generated pool load failed, falling back to Gemini')
          }

          // Reset for Gemini fallback
          contentPoolGenerated.current = false
          setContentPoolStatus('idle')
        }
      }
      
      // ── Fallback: Gemini generation ──
      
      // Check whether commentary is enabled, then use rotated Gemini key.
      let apiKey: string | null = null
      let commentaryEnabled = false
      try {
        const commentaryStr = localStorage.getItem('commentary-settings')
        if (commentaryStr) {
          const commentary = JSON.parse(commentaryStr)
          commentaryEnabled = !!commentary?.enabled
        }
      } catch (e) {
        console.warn('[RaceDay] Could not read commentary settings')
      }
      if (commentaryEnabled) {
        apiKey = getNextGeminiApiKey()
      }
      
      if (!apiKey) {
        console.log('[RaceDay] Commentary not configured, skipping content pool generation')
        return
      }
      
      console.log('[RaceDay] Generating RICH TV broadcast content pool via Gemini...')
      setContentPoolStatus('generating')
      contentPoolGenerated.current = true
      
      try {
        // ── Build comprehensive content pool context from ALL game data ──
        const playerName = `${player.firstName} ${player.lastName}`
        const ownedTeam = careerState?.ownedTeam
        const personalLife = careerState?.personalLife
        const standings = seasonStandings?.[currentSeries.id]
        const playerStanding = standings?.find(s => s.isPlayer || s.driverName === playerName)
        const playerChampPos = playerStanding ? standings!.indexOf(playerStanding) + 1 : undefined
        const trackHistory = player.trackHistory?.[currentRace.trackId]
        const raceWeekendProgress = careerState?.raceWeekendProgress
        
        // Championship drama calculation
        const champLeader = standings?.[0]
        const driverAhead = playerChampPos && playerChampPos > 1 ? standings?.[playerChampPos - 2] : undefined
        const driverBehind = playerChampPos && standings ? standings[playerChampPos] : undefined
        const pointsGapToLeader = champLeader && playerStanding ? champLeader.points - playerStanding.points : 0
        const currentRound = (currentSeries.calendar?.findIndex(e => e.week === currentWeek) ?? 0) + 1
        const totalRounds = currentSeries.calendar?.length || 0
        const racesRemaining = totalRounds - currentRound
        
        // Season form from race history
        const currentYear = careerState?.currentYear || 2024
        const thisSeasonRaces = (player.raceHistory || []).filter(r => r.date?.startsWith(String(currentYear)))
        const seasonDNFs = thisSeasonRaces.filter(r => r.dnf).length
        const seasonAvgFinish = thisSeasonRaces.length > 0
          ? thisSeasonRaces.reduce((sum, r) => sum + (r.racePosition || 20), 0) / thisSeasonRaces.length
          : 0
        const seasonBestFinish = thisSeasonRaces.length > 0
          ? Math.min(...thisSeasonRaces.map(r => r.racePosition || 99))
          : 0
        const lastRace = thisSeasonRaces[thisSeasonRaces.length - 1]
        
        // Streak calculation
        let currentStreak = ''
        if (player.consecutiveWins && player.consecutiveWins > 1) currentStreak = `${player.consecutiveWins} consecutive wins`
        else if (player.consecutivePodiums && player.consecutivePodiums > 1) currentStreak = `${player.consecutivePodiums} consecutive podiums`
        else if (player.consecutivePoints && player.consecutivePoints > 3) currentStreak = `${player.consecutivePoints} consecutive points finishes`
        
        // Title fight status
        const maxPointsPerRace = 25 // Approximate
        const maxPointsRemaining = racesRemaining * maxPointsPerRace
        let titleFightStatus = 'out_of_contention'
        if (pointsGapToLeader === 0 && playerChampPos === 1) titleFightStatus = 'leading'
        else if (pointsGapToLeader <= maxPointsRemaining * 0.3) titleFightStatus = 'contending'
        else if (pointsGapToLeader <= maxPointsRemaining) titleFightStatus = 'long_shot'
        
        // Sponsor pressure
        const sponsors = ownedTeam?.finances?.sponsors || []
        const sponsorWarnings = sponsors.filter(s => (s as any).warningIssued).length
        const sponsorTargetsMet = sponsors.reduce((count, s) => count + ((s as any).targets?.filter((t: any) => t.met)?.length || 0), 0)
        const sponsorTargetsTotal = sponsors.reduce((count, s) => count + ((s as any).targets?.length || 0), 0)
        
        // Staff morale average
        const staffMoraleAvg = ownedTeam?.staff?.length 
          ? Math.round(ownedTeam.staff.reduce((sum, s) => sum + (s.morale || 50), 0) / ownedTeam.staff.length) 
          : undefined
        
        // Facility levels
        const facilities = ownedTeam?.facilities
        const facilityLevels = facilities ? {
          aero: facilities.aero?.level || 1,
          chassis: facilities.chassis?.level || 1,
          engine: facilities.engine?.level || 1,
          sim: facilities.sim?.level || 1,
          manufacturing: facilities.manufacturing?.level || 1,
        } : undefined
        const upgradeInProgress = facilities
          ? Object.entries(facilities).find(([, f]) => (f as any)?.upgradeInProgress)?.[0]
            ? `${Object.entries(facilities).find(([, f]) => (f as any)?.upgradeInProgress)?.[0]} facility upgrading to Level ${((Object.entries(facilities).find(([, f]) => (f as any)?.upgradeInProgress)?.[1] as any)?.level || 1) + 1}`
            : undefined
          : undefined
        
        // Financial snapshot
        const budgets = ownedTeam?.budgets
        const runwayWeeks = budgets?.runwayWeeks || 0
        const runwayStatus = runwayWeeks > 12 ? 'healthy' : runwayWeeks > 6 ? 'stable' : runwayWeeks > 2 ? 'caution' : runwayWeeks > 0 ? 'critical' : 'emergency'
        const costCapPct = budgets?.costCapSpending && (ownedTeam as any)?.costCapLimit 
          ? Math.round((budgets.costCapSpending / (ownedTeam as any).costCapLimit) * 100) 
          : undefined
        const merchRevenue = ownedTeam?.finances?.extended?.merchandise?.weeklyRevenue
        
        // Personal life highlights
        const partner = personalLife?.partner
        const children = personalLife?.children || []
        const health = personalLife?.health
        const relationshipStatus = partner?.marriageYear ? 'married' 
          : partner?.datingStartYear ? 'dating' 
          : 'single'
        
        // Pressure state
        const rpgState = careerState?.rpgState
        const pressureState = rpgState ? {
          currentPressure: (rpgState as any).pressure?.currentPressure || 0,
          pressureType: (rpgState as any).pressure?.pressureType || 'normal',
          titleFight: titleFightStatus === 'leading' || titleFightStatus === 'contending',
          homeRace: false, // Would need nationality matching with track country
          contractPressure: player.contract?.endYear ? (player.contract.endYear - currentYear) <= 1 : false,
          streakType: player.consecutiveWins && player.consecutiveWins > 0 ? 'winning' as const : undefined,
          streakLength: player.consecutiveWins || player.consecutivePodiums || undefined,
        } : undefined
        
        // Media profile
        const mediaPersona = careerState?.mediaPersona
        const socialState = careerState?.socialMediaState
        
        // Hired driver (teammate)
        const hiredDriver = ownedTeam?.drivers?.[0]
        
        // Track narrative from Content Studio pre-generated content (layout-specific with venue fallback)
        let trackNarrative: any = getTrackNarrativeFromPreGen(currentRace.trackId, currentRace.layoutId)
        if (!trackNarrative) {
          try {
            const cached = localStorage.getItem(`track-narrative-${currentRace.trackId}`)
            if (cached) trackNarrative = JSON.parse(cached)
          } catch { /* ignore */ }
        }
        
        // Driver narratives from Content Studio pre-generated content (strict source policy)
        const driversWithForm = currentSeries ? getDriversWithForm(currentSeries.id) : []
        const preGenNarrativesReady = isPreGenContentLoaded()
        const seriesDriverByName = new Map(
          driversWithForm.map((driver) => [`${driver.firstName} ${driver.lastName}`.trim(), driver])
        )
        const rivalState = useRivalStore.getState()
        const seriesTeams = (Array.isArray(rivalState.teams) ? rivalState.teams : []).filter((team) => team.seriesId === currentSeries.id)
        const seriesDrivers = (Array.isArray(rivalState.rivals) ? rivalState.rivals : []).filter((driver) => driver.currentSeriesId === currentSeries.id)

        const worldSnapshot = buildCommentaryWorldSnapshot({
          seriesId: currentSeries.id,
          seriesName: currentSeries.name,
          currentRound,
          totalRounds,
          racesRemaining,
          titleFightStatus,
          standings: (standings || []).map((s, index) => ({
            position: index + 1,
            driverName: s.driverName,
            teamName: s.teamName,
            points: s.points,
            wins: s.wins,
            avgFinish: s.avgFinish,
          })),
          teams: seriesTeams.map((team) => ({
            id: team.id,
            name: team.name,
            shortName: team.shortName,
            narrative: {
              recentForm: team.narrative?.recentForm,
            },
          })),
          drivers: seriesDrivers.map((driver) => ({
            id: driver.id,
            firstName: driver.firstName,
            lastName: driver.lastName,
            currentTeamId: driver.currentTeamId,
            currentTeamName: seriesTeams.find((team) => team.id === driver.currentTeamId)?.name,
            totalWins: driver.totalWins,
            rivalryIntensity: driver.rivalryIntensity,
            narrative: {
              recentForm: driver.narrative?.recentForm,
            },
          })),
          sponsorDeals: (ownedTeam?.finances?.sponsors as Array<{ active?: boolean; satisfaction?: number }> | undefined) || [],
          ownedTeam: ownedTeam ? {
            boardMood: ownedTeam.boardMood,
            budgets: {
              runwayWeeks: ownedTeam.budgets?.runwayWeeks,
            },
          } : undefined,
        })
        
        // Build the FULL rich context
        const context = {
          trackId: currentRace.trackId,
          trackName: currentRace.trackName,
          trackNarrative,
          seriesId: currentSeries.id,
          seriesName: currentSeries.name,
          seriesCategory: currentSeries.category as any,
          worldSnapshot,
          
          drivers: participants.slice(0, 20).map((p, idx) => {
            const rivalDriver = seriesDriverByName.get((p.name || '').trim())
            const preGenNarrative = preGenNarrativesReady && rivalDriver
              ? (getDriverNarrative(rivalDriver.id) || getDriverNarrativeByName(rivalDriver.firstName, rivalDriver.lastName))
              : null
            return {
              id: p.name?.replace(/\s+/g, '-').toLowerCase() || `driver-${idx}`,
              name: p.name || `Driver ${idx + 1}`,
              teamName: p.teamName || 'Unknown Team',
              position: idx + 1,
              narrative: preGenNarrative ? {
                id: rivalDriver?.id || '',
                biography: (preGenNarrative as any).biography,
                drivingStyle: (preGenNarrative as any).drivingStyle,
                rivalries: (preGenNarrative as any).rivalries,
                quirks: (preGenNarrative as any).quirks,
                nickname: (preGenNarrative as any).nickname,
                famousQuote: (preGenNarrative as any).famousQuote,
                careerHighlight: (preGenNarrative as any).careerHighlight,
                careerLowPoint: (preGenNarrative as any).careerLowPoint,
              } as any : undefined,
              pointsPosition: standings?.findIndex(s => s.driverName === p.name) !== -1 
                ? (standings?.findIndex(s => s.driverName === p.name) ?? -1) + 1 
                : undefined,
            }
          }),
          
          playerName,
          playerPointsPosition: playerChampPos,
          totalLaps: 20,
          weather: currentRace.weather || undefined,
          sessionType: activeSession as 'practice' | 'qualifying' | 'race',
          
          // Qualifying/practice results from weekend progress
          qualifyingPosition: raceWeekendProgress?.qualifying?.position,
          qualifyingBest: raceWeekendProgress?.qualifying?.bestLapTime,
          practiceBest: raceWeekendProgress?.practice?.bestLapTime,
          
          championshipStandings: standings?.slice(0, 10).map((s, i) => ({
            driverName: s.driverName,
            points: s.points,
            position: i + 1,
            wins: s.wins,
            podiums: s.podiums,
            dnfs: s.dnfs,
            avgFinish: s.avgFinish,
            isPlayer: s.isPlayer || s.driverName === playerName,
          })),
          
          // Player career context
          playerCareer: {
            totalRaces: player.totalRaces || 0,
            totalWins: player.totalWins || 0,
            totalPodiums: player.totalPodiums || 0,
            totalPoles: player.totalPoles || 0,
            totalFastestLaps: player.totalFastestLaps || 0,
            championships: player.championships || 0,
            consecutiveWins: player.consecutiveWins || 0,
            consecutivePodiums: player.consecutivePodiums || 0,
            consecutivePoints: player.consecutivePoints || 0,
            comebackWins: player.comebackWins || 0,
            hatTricks: player.hatTricks || 0,
            grandSlams: player.grandSlams || 0,
            wetRaceWins: player.wetRaceWins,
            reputation: player.reputation || 50,
            experienceLevel: (player.totalRaces || 0) < 10 ? 'Rookie' : (player.totalRaces || 0) < 30 ? 'Sophomore' : 'Veteran',
            isRookie: (player.totalRaces || 0) < 12,
            age: player.age || 25,
            nationality: player.nationality || 'Unknown',
          },
          
          // Player track history at THIS track
          playerTrackHistory: trackHistory ? {
            visits: trackHistory.visits || 0,
            wins: trackHistory.wins || 0,
            podiums: trackHistory.podiums || 0,
            poles: trackHistory.poles || 0,
            fastestLaps: trackHistory.fastestLaps || 0,
            dnfs: trackHistory.dnfs || 0,
            bestFinish: trackHistory.bestFinish || 99,
            worstFinish: trackHistory.worstFinish || 0,
            avgFinish: trackHistory.avgFinish || 0,
            consecutiveWins: trackHistory.consecutiveWins || 0,
            maxConsecutiveWins: trackHistory.maxConsecutiveWins || 0,
            lastResult: trackHistory.lastResult || 0,
            firstVisitYear: trackHistory.firstVisitYear || currentYear,
            lastVisitYear: trackHistory.lastVisitYear || currentYear,
            seriesRacedHere: trackHistory.seriesRacedHere || [],
          } : { visits: 0, wins: 0, podiums: 0, poles: 0, fastestLaps: 0, dnfs: 0, bestFinish: 99, worstFinish: 0, avgFinish: 0, consecutiveWins: 0, maxConsecutiveWins: 0, lastResult: 0, firstVisitYear: currentYear, lastVisitYear: currentYear, seriesRacedHere: [] },
          
          // Season form
          seasonForm: {
            seasonWins: playerStanding?.wins || 0,
            seasonPodiums: playerStanding?.podiums || 0,
            seasonPoles: playerStanding?.poles || 0,
            seasonFastestLaps: playerStanding?.fastestLaps || 0,
            seasonDNFs,
            seasonAvgFinish: seasonAvgFinish || (playerStanding?.avgFinish || 0),
            seasonBestFinish: seasonBestFinish || (playerStanding?.bestFinish || 0),
            racesCompleted: thisSeasonRaces.length || (playerStanding?.races || 0),
            currentStreak,
            lastRaceResult: lastRace?.racePosition,
            lastTrackName: lastRace?.trackName,
          },
          
          // GOAT progress
          goatProgress: player.goatProgress ? {
            currentTier: player.goatProgress.currentTier || 'unknown',
            tierProgress: player.goatProgress.tierProgress || 0,
            recordsNearBreaking: undefined, // Would need getRecordsNearBreaking utility
            recordBreakingMoment: undefined,
            recentMilestones: player.goatProgress.newlyUnlocked || [],
            tripleCrownProgress: undefined,
          } : undefined,
          
          // Championship drama
          championshipDrama: standings ? {
            pointsGapToLeader,
            pointsGapToAhead: driverAhead ? driverAhead.points - (playerStanding?.points || 0) : 0,
            pointsGapToBehind: driverBehind ? (playerStanding?.points || 0) - driverBehind.points : 0,
            driverAheadInStandings: driverAhead?.driverName,
            driverBehindInStandings: driverBehind?.driverName,
            titleFightStatus,
            mathematicallyAlive: pointsGapToLeader <= maxPointsRemaining,
            maxPointsRemaining,
            racesRemaining,
            isSeasonOpener: currentRound === 1,
            isSeasonFinale: currentRound === totalRounds,
            currentRound,
            totalRounds,
          } : undefined,
          
          // Team dynamics
          teamDynamics: ownedTeam ? {
            teamName: ownedTeam.name,
            teamReputation: ownedTeam.reputation || 50,
            teamMorale: ownedTeam.teamMorale,
            boardMood: ownedTeam.boardMood,
            carPerformance: activeCar ? (activeCar as any).performance : undefined,
            carReliability: activeCar ? (activeCar as any).reliability : undefined,
            staffMoraleAvg,
            facilityLevels,
            upgradeInProgress,
            hiredDriverName: hiredDriver ? `Driver #2` : undefined,
            hiredDriverSeasonWins: hiredDriver?.seasonStats?.wins,
            hiredDriverSeasonPodiums: hiredDriver?.seasonStats?.podiums,
          } : undefined,
          
          // Financial snapshot
          financialSnapshot: ownedTeam ? {
            runwayStatus,
            costCapUsagePercent: costCapPct,
            activeSponsorCount: sponsors.length,
            merchandiseWeeklyRevenue: merchRevenue,
            sponsorsAtRisk: sponsors.filter(s => ((s as any).satisfaction || 50) < 40).length || undefined,
          } : undefined,
          
          // Sponsor pressure
          sponsorPressure: sponsors.length > 0 ? {
            totalSponsors: sponsors.length,
            sponsorWarnings,
            targetsMetCount: sponsorTargetsMet,
            targetsTotalCount: sponsorTargetsTotal,
            titleSponsorHappy: sponsors.find(s => (s as any).slot === 'title') 
              ? ((sponsors.find(s => (s as any).slot === 'title') as any).satisfaction || 50) >= 60 
              : undefined,
          } : undefined,
          
          // Personal life
          personalLife: personalLife ? {
            relationshipStatus,
            partnerName: partner ? `${partner.firstName}` : undefined,
            childrenCount: children.length,
            recentLifeEvent: undefined, // Could compute from recent events
            healthLevel: health?.overall || 50,
            fitnessLevel: health?.fitness || health?.fitnessLevel || 50,
            stressLevel: health?.stress || 0,
            lifestyleTier: personalLife.lifestyleLevel?.tier || 'modest',
            injuryStatus: player.health?.injured ? `Recovering from ${player.health.injuryType || 'injury'}` : undefined,
          } : undefined,
          
          // Media profile
          mediaProfile: mediaPersona ? {
            mediaPersona: mediaPersona.dominantTone || 'unknown',
            followerCount: socialState?.followerCount || 0,
            recentHeadline: careerState?.pressClippings?.slice(-1)[0]?.headline,
            controversyLevel: mediaPersona.controversyLevel || 0,
            publicPerception: mediaPersona.publicPerception || 50,
            viralPosts: socialState?.viralPosts,
          } : undefined,
          
          // Pressure state
          pressureState,
          
          // Logistics
          logisticsSnapshot: ownedTeam?.spareParts ? {
            raceKitReady: (ownedTeam.spareParts.raceSparesKits?.length || 0) > 0,
            partsShortage: (ownedTeam.spareParts.inventory?.length || 0) < 5,
            manufacturingActive: (ownedTeam.spareParts.manufacturingQueue?.length || 0) > 0,
            manufacturingJobs: ownedTeam.spareParts.manufacturingQueue?.length,
          } : undefined,
          
          // Contract context
          contractContext: player.contract ? {
            contractEndingSoon: player.contract.endYear ? (player.contract.endYear - currentYear) <= 1 : false,
            contractTargetsMet: player.contract.targets?.filter((t: any) => t.met)?.length || 0,
            contractTargetsTotal: player.contract.targets?.length || 0,
            teamSatisfaction: player.contract.teamSatisfaction,
            teamWarningIssued: player.contract.warningIssued || false,
          } : undefined,
        }
        
        console.log('[RaceDay] Rich context built:', {
          hasTrackHistory: !!context.playerTrackHistory?.visits,
          hasSeasonForm: !!context.seasonForm?.racesCompleted,
          hasTeamDynamics: !!context.teamDynamics,
          hasFinancials: !!context.financialSnapshot,
          hasPersonalLife: !!context.personalLife,
          hasMedia: !!context.mediaProfile,
          hasPressure: !!context.pressureState,
          hasChampDrama: !!context.championshipDrama,
          hasGoat: !!context.goatProgress,
        })
        
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

  // Get pending media duties for this weekend from calendar-backed race expected activities
  const currentDay = careerState.currentDay ?? 1
  const pendingDuties = useMemo(() => {
    return (careerState.scheduledActivities || []).filter((a): a is ScheduledActivity =>
      a.status === 'scheduled' &&
      a.category === 'media' &&
      a.triggeredBy === 'race_weekend_expected' &&
      a.scheduledWeek === careerState.currentWeek &&
      (a.templateId || '').includes('race_expected_')
    )
  }, [careerState.scheduledActivities, careerState.currentWeek])
  
  const activeDuties = pendingDuties.filter(d => (d.scheduledDay || 1) <= currentDay)
  const upcomingDuties = pendingDuties.filter(d => (d.scheduledDay || 1) > currentDay)
  
  // Determine which duty is relevant for current session based on race weekend day
  const getRelevantDuty = (sessionType: SessionType): ScheduledActivity | undefined => {
    const expectedDayBySession: Record<SessionType, number> = {
      practice: 5,
      qualifying: 6,
      race: 7,
    }
    const expectedDay = expectedDayBySession[sessionType]
    return activeDuties.find(d => (d.scheduledDay || 1) === expectedDay)
  }
  
  const toCalendarDutyState = (duty: ScheduledActivity) => ({
    activityId: duty.id,
    templateId: duty.templateId || '',
    name: duty.name,
    description: duty.description,
    category: duty.category,
  })
  
  const getDutyConsequenceText = (duty: ScheduledActivity): string => {
    const e = duty.effectsOnMiss || {}
    const parts: string[] = []
    if (e.reputation) parts.push(`Reputation ${e.reputation > 0 ? '+' : ''}${e.reputation}`)
    if (e.sponsorSatisfaction) parts.push(`Sponsor ${e.sponsorSatisfaction > 0 ? '+' : ''}${e.sponsorSatisfaction}`)
    if (e.fanSentiment) parts.push(`Fans ${e.fanSentiment > 0 ? '+' : ''}${e.fanSentiment}`)
    if (e.boardMood) parts.push(`Board ${e.boardMood > 0 ? '+' : ''}${e.boardMood}`)
    return parts.length > 0 ? parts.join(' · ') : 'Potential PR fallout'
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

  const roundNumber = currentSeries?.calendar ? (currentSeries.calendar.findIndex(e => e.week === currentWeek) + 1) : 0
  const totalRounds = currentSeries?.calendar?.length || 0

  const championshipData = useMemo(() => {
    if (!activeSeriesId) return { standings: [] as any[], playerStanding: null as any, leaderPoints: 0 }
    const st = seasonStandings[activeSeriesId] || []
    const ps = st.find((s: any) => s.isPlayer) || null
    return { standings: st, playerStanding: ps, leaderPoints: st[0]?.points || 0 }
  }, [activeSeriesId, seasonStandings])

  return (
    <div className="bg-white w-full h-full overflow-y-auto">
      <div className="p-[24px] flex flex-col gap-[24px]">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[12px]">
          {isInvitational ? <Trophy className="w-[24px] h-[24px] text-[#f0b100]" /> : <Flag className="w-[24px] h-[24px]" />}
          <h1 className="text-[24px] text-black tracking-[-1.2px]" style={FB}>{isInvitational ? "Invitational Event" : "Race Day"}</h1>
        </div>
        <div className="flex items-center gap-[8px]">
          {telemetryStatus.listening ? (
            telemetryStatus.receiving ? (
              <span className="px-[10px] py-[4px] text-[11px] rounded-full bg-[#00a63e] text-white flex items-center gap-[4px]" style={FBold}>
                <HardDrive className="w-[12px] h-[12px] animate-pulse" /> {telemetryStatus.raceState || liveSession?.sessionType || 'Connected'}
              </span>
            ) : (
              <span className="px-[10px] py-[4px] text-[11px] rounded-full bg-[#f0b100] text-white flex items-center gap-[4px]" style={FBold}>
                <Radio className="w-[12px] h-[12px]" /> Waiting for AMS2...
              </span>
            )
          ) : (
            <button onClick={handleConnectTelemetry} className="h-[32px] px-[12px] border-[1.6px] border-black rounded-full text-[11px] text-black flex items-center gap-[6px] hover:bg-[#f9fafb] transition-colors" style={FBold}>
              <HardDrive className="w-[14px] h-[14px]" /> Connect Telemetry
            </button>
          )}
        </div>
      </div>

      {/* Invitational Event Banner */}
      {isInvitational && invitationalEvent && (
        <div className={`${CARD} p-[20px] border-l-4 border-l-[#f0b100]`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-[#f0b100]/20 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-[#f0b100]" />
            </div>
            <div className="flex-1">
              <span className="px-[8px] py-[2px] text-[11px] rounded-full bg-[#f0b100]/10 text-[#f0b100] mb-[4px] inline-block" style={FBold}>Special Invitational Event</span>
              <h3 className="text-[16px] text-black" style={FB}>{invitationalEvent.name}</h3>
              <p className="text-[12px] text-[#4a5565]" style={FR}>
                {invitationalEvent.organizerName} • {invitationalCarClass?.name || invitationalEvent.carClassName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#4a5565] uppercase" style={FBold}>Prize Pool</p>
              <p className="text-[20px] text-[#00a63e]" style={FB}>${(invitationalEvent.rewards.prize / 1000).toFixed(0)}k</p>
              <p className="text-[11px] text-[#ff6900]" style={FBold}>+{invitationalEvent.rewards.reputationBonus} Rep</p>
            </div>
          </div>
        </div>
      )}

      {/* Media Duty Reminder */}
      {showDutyReminder && activeDuties.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <div className={`${CARD} p-[16px] border-l-4 border-l-[#ff6900]`}>
            <button onClick={() => setShowDutyReminder(false)} className="absolute top-2 right-2 p-1 text-[#4a5565] hover:text-black transition-colors">×</button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#ff6900]/20 flex items-center justify-center">
                  <Mic className="w-6 h-6 text-[#ff6900]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[13px] text-black" style={FBold}>Media Duties Pending</h3>
                    <span className="px-[6px] py-[2px] text-[10px] rounded-full bg-[#ff6900]/10 text-[#ff6900]" style={FBold}>{activeDuties.length} Active</span>
                  </div>
                  <p className="text-[12px] text-[#4a5565] mt-0.5" style={FR}>{activeDuties.map(d => d.name).join(', ')}</p>
                </div>
              </div>
              <button onClick={() => navigate('/media', { state: { calendarDuty: toCalendarDutyState(activeDuties[0]) } })} className="h-[32px] px-[12px] bg-black text-white rounded-full text-[11px] flex items-center gap-[6px] hover:bg-black/90 transition-colors" style={FBold}>
                Complete Duties <ChevronRight className="w-[14px] h-[14px]" />
              </button>
            </div>
            {upcomingDuties.length > 0 && (
              <div className="mt-3 pt-3 border-t border-black/10">
                <p className="text-[11px] text-[#4a5565]" style={FR}><Clock className="w-3 h-3 inline mr-1" />{upcomingDuties.length} more duties scheduled for later this weekend</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Pre-Session Duty Alert */}
      {currentSessionDuty && activeSession && (
        <div className={`${CARD} p-[12px] border-l-4 border-l-[#f0b100]`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#f0b100]" />
              <div>
                <p className="text-[12px] text-[#f0b100]" style={FBold}>Complete media duty before {activeSession}</p>
                <p className="text-[11px] text-[#4a5565]" style={FR}>{currentSessionDuty.name} - {getDutyConsequenceText(currentSessionDuty)}</p>
              </div>
            </div>
            <button onClick={() => navigate('/media', { state: { calendarDuty: toCalendarDutyState(currentSessionDuty) } })} className="h-[28px] px-[10px] bg-black text-white rounded-full text-[11px] hover:bg-black/90 transition-colors" style={FBold}>
              Go to Media
            </button>
          </div>
        </div>
      )}

      {/* Car Condition Warning */}
      {!carConditionCheck.canRace && activeCar && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className={`${CARD} p-[16px] border-l-4 border-l-[#fb2c36]`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#fb2c36]/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-[#fb2c36]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[13px] text-[#fb2c36]" style={FBold}>Car Not Race-Ready</h3>
                    <span className="px-[6px] py-[2px] text-[10px] rounded-full bg-[#fb2c36]/10 text-[#fb2c36]" style={FBold}>{carConditionCheck.issues.length} Critical</span>
                  </div>
                  <p className="text-[12px] text-[#4a5565] mt-0.5" style={FR}>{carConditionCheck.issues.map(i => i.part).join(', ')} wear exceeds 90%</p>
                </div>
              </div>
              <button onClick={() => navigate('/garage')} className="h-[32px] px-[12px] bg-[#fb2c36] text-white rounded-full text-[12px] flex items-center gap-[6px] hover:bg-[#fb2c36]/80 transition-colors" style={FBold}>
                <Wrench className="w-[14px] h-[14px]" /> Service Car
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* No Race Warning */}
      {!currentRace && !isInvitational && (
        <div className={`${CARD} p-[20px]`}>
          <div className="flex items-center gap-4 text-[#f0b100]">
            <AlertCircle className="w-8 h-8" />
            <div>
              <h3 className="text-[16px] text-black" style={FB}>No Race This Week</h3>
              <p className="text-[13px] text-[#4a5565]" style={FR}>Check your calendar for upcoming race events. Current week: {currentWeek}</p>
            </div>
          </div>
        </div>
      )}

      {currentRace && (
        <>
          {/* ═══ TOP BANNER ═══ */}
          <div className={CARD}>
            <div className="relative h-[200px] overflow-hidden">
              <img
                src={getTrackImage(currentRace.trackName, layoutInfo?.name)}
                alt={currentRace.trackName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget
                  if (!target.dataset.tried) {
                    target.dataset.tried = 'true'
                    target.src = findTrackImageFromManifest(currentRace.trackName) || getTrackImage(currentRace.trackName)
                  } else {
                    target.style.display = 'none'
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

              {/* Track info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-[24px]">
                <span className="px-[10px] py-[4px] bg-black text-white text-[11px] rounded-full inline-block mb-[8px]" style={FBold}>
                  ROUND {roundNumber}/{totalRounds}
                </span>
                <h1 className="text-[30px] text-white tracking-[-1.5px]" style={FB}>{currentRace.trackName}</h1>
                <p className="text-[14px] text-white/80 flex items-center gap-[6px] mt-[4px]" style={FR}>
                  <MapPin className="w-[14px] h-[14px]" /> {layoutInfo?.name || 'Grand Prix'} Layout
                </p>
              </div>

              {/* Weather badge top-right */}
              <div className="absolute top-[16px] right-[16px]">
                <span className={`px-[10px] py-[4px] text-[11px] rounded-full ${currentRace.weather === 'rain' ? 'bg-[#2b7fff] text-white' : 'bg-white/90 text-black'}`} style={FBold}>
                  {currentRace.weather === 'rain' ? '🌧️ Wet' : '☀️ Dry'}
                </span>
              </div>
            </div>

            {/* 4 stat boxes */}
            <div className="p-[16px] grid grid-cols-4 gap-[12px]">
              {[
                { label: 'LENGTH', value: layoutInfo?.lengthKm ? `${layoutInfo.lengthKm.toFixed(2)} km` : 'N/A' },
                { label: 'TURNS', value: String(layoutInfo?.turns || 'N/A') },
                { label: 'GRID', value: String(currentSeries?.gridSize || 20) },
                { label: 'WEATHER', value: currentRace.weather === 'rain' ? 'Wet' : 'Dry' },
              ].map(stat => (
                <div key={stat.label} className="bg-[#f9fafb] border-[1.6px] border-[#e5e7eb] rounded-[14px] p-[14px] text-center">
                  <p className="text-[9px] text-[#4a5565] uppercase tracking-[0.5px] mb-[4px]" style={FBold}>{stat.label}</p>
                  <p className="text-[20px] text-black" style={FB}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ THREE COLUMN GRID ═══ */}
          <div className="grid grid-cols-12 gap-[16px]">
            {/* ── LEFT COLUMN ── */}
            <div className="col-span-4 flex flex-col gap-[16px]">

            {/* SESSION Card */}
              <div className={CARD}>
                <div className="px-[16px] py-[12px] border-b-[1.6px] border-black flex items-center gap-[8px]">
                  <Zap className="w-[16px] h-[16px]" />
                  <span className="text-[14px] text-black tracking-[-0.7px]" style={FB}>SESSION</span>
                </div>
                <div className="p-[16px]">
                  {/* Pill tabs */}
                  <div className="flex gap-[6px] mb-[16px]">
                    {sessions.map(session => (
                      <button
                        key={session.id}
                        onClick={() => setActiveSession(session.id as SessionType)}
                        className={`flex-1 py-[8px] px-[10px] rounded-full text-[11px] flex items-center justify-center gap-[4px] transition-all ${
                          activeSession === session.id
                            ? 'bg-black text-white'
                            : 'bg-[#f3f4f6] text-black hover:bg-[#e5e7eb]'
                        }`}
                        style={FBold}
                      >
                        {session.completed && <CheckCircle className="w-[12px] h-[12px]" />}
                        {session.label.toUpperCase()}
                        {!session.completed && liveSession?.sessionType?.toLowerCase().includes(session.id) && (
                          <span className="w-[6px] h-[6px] bg-[#00a63e] rounded-full animate-pulse" />
                        )}
                      </button>
                    ))}
                  </div>
                  <SessionPanel
                    title={activeSession === 'practice' ? 'Free Practice' : activeSession === 'qualifying' ? 'Qualifying' : 'Race'}
                    description={
                      activeSession === 'practice' ? 'Test setups and learn the track'
                        : activeSession === 'qualifying' ? 'Set your fastest lap for grid position'
                        : 'The main event — compete for points'
                    }
                    status={sessionStatus}
                    liveSession={liveSession}
                    isLive={telemetryStatus.receiving && liveSession?.sessionType?.toLowerCase().includes(activeSession)}
                    telemetryConnected={telemetryStatus.listening}
                    storedResult={sessions.find(s => s.id === activeSession)?.result as SessionResult | undefined}
                    isRaceSession={activeSession === 'race'}
                    isWeekendComplete={sessions.find(s => s.id === 'race')?.completed || false}
                    onAdvanceWeek={() => {
                      useCareerStore.getState().advanceWeek()
                      useCareerStore.getState().clearRaceWeekendProgress()
                      setTimeout(() => useCareerStore.getState().autoCompletePostRaceActivities(), 0)
                      addToast({ type: 'success', message: 'Moving to the next week of your career.', duration: 3000 })
                      navigate('/')
                    }}
                    carConditionIssues={carConditionCheck.issues}
                    onShowCarConditionModal={() => setShowCarConditionModal(true)}
                  />
                </div>
              </div>

            {/* DRIVER STATUS Card */}
              <div className={CARD}>
                <div className="px-[16px] py-[12px] border-b-[1.6px] border-black flex items-center gap-[8px]">
                  <Users className="w-[16px] h-[16px]" />
                  <span className="text-[14px] text-black tracking-[-0.7px]" style={FB}>DRIVER STATUS</span>
                </div>
                <div className="p-[16px] space-y-[12px]">
                  {[
                    { label: 'Confidence', value: player.mentalState?.confidence ?? 50 },
                    { label: 'Focus', value: 100 - (player.mentalState?.fatigue ?? 0) },
                    { label: 'Composure', value: 100 - (player.mentalState?.stress ?? 20) },
                  ].map(stat => {
                    const statusLabel = stat.value >= 80 ? 'EXCELLENT' : stat.value >= 50 ? 'GOOD' : 'LOW'
                    const statusColor = stat.value >= 80 ? '#00a63e' : stat.value >= 50 ? '#ff6900' : '#fb2c36'
                    return (
                      <div key={stat.label}>
                        <div className="flex items-center justify-between mb-[6px]">
                          <span className="text-[12px] text-black" style={FBold}>{stat.label}</span>
                          <span className="text-[10px] px-[8px] py-[2px] rounded-full" style={{ ...FBold, backgroundColor: `${statusColor}15`, color: statusColor }}>{statusLabel}</span>
                        </div>
                        <div className="h-[8px] bg-[#e5e7eb] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500 bg-black" style={{ width: `${stat.value}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* TRACK CONDITIONS Card */}
              <div className={CARD}>
                <div className="px-[16px] py-[12px] border-b-[1.6px] border-black flex items-center gap-[8px]">
                  <Thermometer className="w-[16px] h-[16px]" />
                  <span className="text-[14px] text-black tracking-[-0.7px]" style={FB}>TRACK CONDITIONS</span>
                </div>
                <div className="p-[16px]">
                  <div className="grid grid-cols-2 gap-[10px]">
                    <div className="bg-[#fff7ed] border-[1.6px] border-[#ffd6a8] rounded-[14px] p-[14px]">
                      <div className="flex items-center gap-[6px] mb-[6px]">
                        <Thermometer className="w-[14px] h-[14px] text-[#ff6900]" />
                        <span className="text-[9px] text-[#ff6900] uppercase tracking-[0.5px]" style={FBold}>AIR</span>
                      </div>
                      <p className="text-[16px] text-black" style={FB}>{currentRace.weather === 'rain' ? '18°C' : '24°C'}</p>
                    </div>
                    <div className="bg-[#fef2f2] border-[1.6px] border-[#fecaca] rounded-[14px] p-[14px]">
                      <div className="flex items-center gap-[6px] mb-[6px]">
                        <Thermometer className="w-[14px] h-[14px] text-[#fb2c36]" />
                        <span className="text-[9px] text-[#fb2c36] uppercase tracking-[0.5px]" style={FBold}>TRACK</span>
                      </div>
                      <p className="text-[16px] text-black" style={FB}>{currentRace.weather === 'rain' ? '22°C' : '38°C'}</p>
                    </div>
                    <div className="bg-[#eff6ff] border-[1.6px] border-[#bfdbfe] rounded-[14px] p-[14px]">
                      <div className="flex items-center gap-[6px] mb-[6px]">
                        <Wind className="w-[14px] h-[14px] text-[#2b7fff]" />
                        <span className="text-[9px] text-[#2b7fff] uppercase tracking-[0.5px]" style={FBold}>WIND</span>
                      </div>
                      <p className="text-[12px] text-black" style={FBold}>Light Breeze</p>
                    </div>
                    <div className="bg-[#eff6ff] border-[1.6px] border-[#bfdbfe] rounded-[14px] p-[14px]">
                      <div className="flex items-center gap-[6px] mb-[6px]">
                        <Droplets className="w-[14px] h-[14px] text-[#2b7fff]" />
                        <span className="text-[9px] text-[#2b7fff] uppercase tracking-[0.5px]" style={FBold}>RAIN</span>
                      </div>
                      <p className="text-[16px] text-black" style={FB}>{currentRace.weather === 'rain' ? '80%' : '0%'}</p>
                    </div>
                  </div>
                  <div className="mt-[12px] bg-[#f9fafb] rounded-full px-[14px] py-[8px] text-center">
                    <span className="text-[11px] text-[#4a5565]" style={FR}>
                      {currentRace.weather === 'rain' ? '🌧️ Rainy Conditions' : '☀️ Clear Skies'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          {/* ── CENTER COLUMN ── */}
            <div className="col-span-5 flex flex-col gap-[16px]">
              {/* TELEMETRY & RESULTS Card */}
              <div className={CARD}>
                <div className="px-[16px] py-[12px] border-b-[1.6px] border-black flex items-center gap-[8px]">
                  <Activity className="w-[16px] h-[16px]" />
                  <span className="text-[14px] text-black tracking-[-0.7px]" style={FB}>TELEMETRY & RESULTS</span>
                </div>
                <div className="p-[16px]">
                  <div className="grid grid-cols-3 gap-[12px] mb-[12px]">
                    <div className="bg-[#f9fafb] border-[1.6px] border-[#e5e7eb] rounded-[14px] p-[14px] text-center">
                      <p className="text-[9px] text-[#4a5565] uppercase tracking-[0.5px] mb-[4px]" style={FBold}>QUALIFYING</p>
                      <p className={`text-[24px] ${qualifyingPosition && qualifyingPosition <= 3 ? 'text-[#f0b100]' : 'text-black'}`} style={FB}>
                        {qualifyingPosition ? `P${qualifyingPosition}` : '—'}
                      </p>
                    </div>
                    <div className="bg-[#f9fafb] border-[1.6px] border-[#e5e7eb] rounded-[14px] p-[14px] text-center">
                      <p className="text-[9px] text-[#4a5565] uppercase tracking-[0.5px] mb-[4px]" style={FBold}>RACE FINISH</p>
                      <p className={`text-[24px] ${(playerParticipant?.racePosition ?? (typeof finishPosition === 'number' ? finishPosition : 99)) <= 3 ? 'text-[#f0b100]' : 'text-black'}`} style={FB}>
                        {playerParticipant?.racePosition ? `P${playerParticipant.racePosition}` : finishPosition ? `P${finishPosition}` : '—'}
                      </p>
                    </div>
                    <div className="bg-[#f9fafb] border-[1.6px] border-[#e5e7eb] rounded-[14px] p-[14px] text-center">
                      <p className="text-[9px] text-[#4a5565] uppercase tracking-[0.5px] mb-[4px]" style={FBold}>BEST LAP</p>
                      <p className="text-[16px] text-black font-mono" style={FBold}>
                        {playerParticipant?.bestLapTime && playerParticipant.bestLapTime > 0 ? formatLapTime(playerParticipant.bestLapTime) : bestLapTime || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-[12px] mb-[16px]">
                    <div className="bg-[#f9fafb] border-[1.6px] border-[#e5e7eb] rounded-[14px] p-[10px] text-center">
                      <p className="text-[9px] text-[#4a5565] uppercase tracking-[0.5px] mb-[2px]" style={FBold}>TOP SPEED</p>
                      <p className="text-[13px] text-black" style={FB}>—</p>
                    </div>
                    <div className="bg-[#f9fafb] border-[1.6px] border-[#e5e7eb] rounded-[14px] p-[10px] text-center">
                      <p className="text-[9px] text-[#4a5565] uppercase tracking-[0.5px] mb-[2px]" style={FBold}>AVG SPEED</p>
                      <p className="text-[13px] text-black" style={FB}>—</p>
                    </div>
                    <div className="bg-[#f9fafb] border-[1.6px] border-[#e5e7eb] rounded-[14px] p-[10px] text-center">
                      <p className="text-[9px] text-[#4a5565] uppercase tracking-[0.5px] mb-[2px]" style={FBold}>INCIDENTS</p>
                      <p className="text-[13px] text-black" style={FB}>—</p>
                    </div>
                  </div>

                  {!playerParticipant && finishPosition === '' ? (
                    <div className="bg-[#f9fafb] rounded-[14px] p-[24px] text-center">
                      <Clock className="w-[24px] h-[24px] text-[#99a1af] mx-auto mb-[8px]" />
                      <p className="text-[12px] text-[#4a5565]" style={FR}>Waiting for session data...</p>
                      <p className="text-[10px] text-[#99a1af] mt-[4px]" style={FR}>Results auto-populate from AMS2 telemetry</p>
                    </div>
                  ) : (
                    <div className="space-y-[12px]">
                      {(playerParticipant?.racePosition || finishPosition) && (
                        <div className="bg-[#f9fafb] border-[1.6px] border-[#e5e7eb] rounded-[14px] p-[12px] flex items-center justify-between">
                          <span className="text-[12px] text-[#4a5565]" style={FR}>Points for P{playerParticipant?.racePosition || finishPosition}</span>
                          <span className="text-[18px] text-[#f0b100]" style={FB}>+{calculatePoints((playerParticipant?.racePosition || finishPosition) as number)} pts</span>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          if (playerParticipant?.racePosition) {
                            setFinishPosition(playerParticipant.racePosition)
                            if (playerParticipant.bestLapTime > 0) setBestLapTime(formatLapTime(playerParticipant.bestLapTime))
                          }
                          handleSubmitResults()
                        }}
                        disabled={!playerParticipant?.racePosition && finishPosition === ''}
                        className="w-full h-[40px] bg-black text-white rounded-full text-[13px] flex items-center justify-center gap-[8px] hover:bg-black/90 transition-colors disabled:bg-[#e5e7eb] disabled:text-[#99a1af] disabled:cursor-not-allowed"
                        style={FBold}
                      >
                        <CheckCircle className="w-[16px] h-[16px]" /> Confirm Race Result
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* FIELD DEVELOPMENT Card */}
              {fieldDevelopment && (
                <div className={CARD}>
                  <div className="px-[16px] py-[12px] border-b-[1.6px] border-black flex items-center justify-between">
                    <div className="flex items-center gap-[8px]">
                      <TrendingUp className="w-[16px] h-[16px]" />
                      <span className="text-[14px] text-black tracking-[-0.7px]" style={FB}>FIELD DEVELOPMENT</span>
                    </div>
                    <span className="text-[10px] text-[#4a5565]" style={FR}>Rival car development</span>
                  </div>
                  <div className="p-[16px] space-y-[12px]">
                    <div>
                      <div className="flex justify-between mb-[6px]">
                        <span className="text-[11px] text-[#9810fa]" style={FBold}>Field Average</span>
                        <span className="text-[11px] text-[#9810fa]" style={FBold}>{fieldDevelopment.avgPercent.toFixed(0)}%</span>
                      </div>
                      <div className="h-[8px] bg-[#e5e7eb] rounded-full overflow-hidden">
                        <div className="h-full bg-black rounded-full transition-all" style={{ width: `${fieldDevelopment.avgPercent}%` }} />
                      </div>
                    </div>
                    {fieldDevelopment.ranking.slice(0, 5).map((team, i) => {
                      const pct = Math.min(100, (team.totalPoints / 400) * 100)
                      
                      return (
                        <div key={team.teamId}>
                          <div className="flex justify-between mb-[4px]">
                            <span className={`text-[11px] truncate mr-2 ${i === 0 ? 'text-black' : 'text-[#4a5565]'}`} style={i === 0 ? FBold : FR}>
                              {i + 1}. {team.teamName}
                            </span>
                            <span className="text-[11px] text-[#4a5565] shrink-0" style={FR}>{pct.toFixed(0)}%</span>
                          </div>
                          <div className="h-[6px] bg-[#e5e7eb] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all bg-black" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                    {fieldDevelopment.totalTeams > 5 && (
                      <p className="text-[10px] text-[#99a1af] text-center" style={FR}>+ {fieldDevelopment.totalTeams - 5} more teams</p>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="col-span-3 flex flex-col gap-[16px]">

              {/* RPG MODIFIERS Card */}
              <div className={CARD}>
                <div className="px-[16px] py-[12px] border-b-[1.6px] border-black flex items-center gap-[8px]">
                  <Zap className="w-[16px] h-[16px]" />
                  <span className="text-[14px] text-black tracking-[-0.7px]" style={FB}>RPG MODIFIERS</span>
                </div>
                <div className="p-[16px]">
                  <div className="grid grid-cols-3 gap-[10px] mb-[12px]">
                    <div className="bg-[#f0fdf4] border-[1.6px] border-[#bbf7d0] rounded-[14px] p-[12px] text-center">
                      <p className="text-[9px] text-[#00a63e] uppercase tracking-[0.5px] mb-[4px]" style={FBold}>AI WEAKNESS</p>
                      <p className="text-[20px] text-[#00a63e]" style={FB}>
                        {((aiModifier.breakdown.teamDevelopment + aiModifier.breakdown.milestonePerks + aiModifier.breakdown.formBonus) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-[#fef2f2] border-[1.6px] border-[#fecaca] rounded-[14px] p-[12px] text-center">
                      <p className="text-[9px] text-[#fb2c36] uppercase tracking-[0.5px] mb-[4px]" style={FBold}>PRESSURE</p>
                      <p className="text-[20px] text-[#fb2c36]" style={FB}>
                        +{((aiModifier.breakdown.injuryPenalty + aiModifier.breakdown.fatiguePenalty + aiModifier.breakdown.pressurePenalty) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-[#f9fafb] border-[1.6px] border-[#e5e7eb] rounded-[14px] p-[12px] text-center">
                      <p className="text-[9px] text-[#4a5565] uppercase tracking-[0.5px] mb-[4px]" style={FBold}>NET</p>
                      <p className={`text-[20px] ${aiModifier.modifier < 0 ? 'text-[#00a63e]' : aiModifier.modifier > 0 ? 'text-[#fb2c36]' : 'text-black'}`} style={FB}>
                        {aiModifier.modifier < 0 ? '' : '+'}{(aiModifier.modifier * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#eff6ff] border-[1.6px] border-[#bfdbfe] rounded-[14px] p-[12px]">
                    <p className="text-[11px] text-[#2b7fff] text-center" style={FR}>
                      {aiModifier.modifier < 0 ? 'AI is weaker — your training & development is paying off' : aiModifier.modifier > 0 ? 'AI is stronger — injury, fatigue or pressure is hurting you' : 'No active modifiers — train and race to unlock advantages'}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI DRIVERS Card */}
              <div className={CARD}>
                <div className="px-[16px] py-[12px] border-b-[1.6px] border-black flex items-center justify-between">
                  <div className="flex items-center gap-[8px]">
                    <FileCode className="w-[16px] h-[16px]" />
                    <span className="text-[14px] text-black tracking-[-0.7px]" style={FB}>AI DRIVERS</span>
                  </div>
                  {xmlGenerated && (
                    <span className="text-[10px] px-[8px] py-[2px] rounded-full bg-[#00a63e]/10 text-[#00a63e]" style={FBold}>Ready</span>
                  )}
                </div>
                <div className="p-[16px] flex items-center justify-between">
                  <div>
                    <p className="text-[12px] text-black" style={FBold}>{xmlGenerated ? 'AI Ready — Form variance applied' : 'Not Generated'}</p>
                    <p className="text-[10px] text-[#4a5565]" style={FR}>{xmlGenerated ? 'Regenerate for new random weekend variance' : 'Will auto-generate on launch'}</p>
                  </div>
                  <button
                    onClick={generateAIXML}
                    disabled={isGeneratingXML || !currentSeries || !currentRace}
                    className="h-[32px] px-[14px] border-[1.6px] border-black rounded-full text-[11px] text-black flex items-center gap-[6px] hover:bg-[#f9fafb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={FBold}
                  >
                    {isGeneratingXML ? <><Loader2 className="w-[14px] h-[14px] animate-spin" /> Generating...</> : <><RefreshCw className="w-[14px] h-[14px]" /> Regenerate</>}
                  </button>
                </div>
              </div>
              {/* CHAMPIONSHIP Card */}
              <div className={CARD}>
                <div className="px-[16px] py-[12px] border-b-[1.6px] border-black flex items-center gap-[8px]">
                  <Trophy className="w-[16px] h-[16px]" />
                  <span className="text-[14px] text-black tracking-[-0.7px]" style={FB}>CHAMPIONSHIP</span>
                </div>
                <div className="p-[16px]">
                  <div className="bg-black rounded-[14px] p-[16px] text-center mb-[12px]">
                    <p className="text-[9px] text-white/60 uppercase tracking-[0.5px] mb-[4px]" style={FBold}>POSITION</p>
                    <p className="text-[36px] text-white" style={FB}>#{championshipData.playerStanding?.position || '—'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-[10px]">
                    <div className="bg-[#f9fafb] border-[1.6px] border-[#e5e7eb] rounded-[14px] p-[12px] text-center">
                      <p className="text-[9px] text-[#4a5565] uppercase tracking-[0.5px] mb-[2px]" style={FBold}>POINTS</p>
                      <p className="text-[20px] text-[#f0b100]" style={FB}>{championshipData.playerStanding?.points || 0}</p>
                    </div>
                    <div className="bg-[#f9fafb] border-[1.6px] border-[#e5e7eb] rounded-[14px] p-[12px] text-center">
                      <p className="text-[9px] text-[#4a5565] uppercase tracking-[0.5px] mb-[2px]" style={FBold}>TO LEADER</p>
                      <p className="text-[20px] text-black" style={FB}>
                        {championshipData.playerStanding?.position === 1 ? '—' : `${championshipData.leaderPoints - (championshipData.playerStanding?.points || 0)}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* STANDINGS Card */}
              <div className={CARD}>
                <div className="px-[16px] py-[12px] border-b-[1.6px] border-black flex items-center gap-[8px]">
                  <Flag className="w-[16px] h-[16px]" />
                  <span className="text-[14px] text-black tracking-[-0.7px]" style={FB}>STANDINGS</span>
                </div>
                <div className="p-[16px] space-y-[8px]">
                  {(() => {
                    const top5 = championshipData.standings.slice(0, 5)
                    const playerInTop5 = top5.some((s: any) => s.isPlayer)
                    const rows = playerInTop5 ? top5 : [...top5.slice(0, 4), championshipData.playerStanding].filter(Boolean)
                    return rows.map((s: any) => s && (
                      <div
                        key={s.driverId}
                        className={`flex items-center gap-[10px] px-[12px] py-[10px] rounded-[12px] border-[1.6px] ${
                          s.isPlayer ? 'bg-[#ff6900] border-[#ff6900] text-white' : 'bg-[#f9fafb] border-[#e5e7eb]'
                        }`}
                      >
                        <span className={`text-[12px] w-[20px] text-center ${s.isPlayer ? 'text-white' : 'text-[#4a5565]'}`} style={FBold}>P{s.position}</span>
                        <span className={`flex-1 text-[12px] truncate ${s.isPlayer ? 'text-white' : 'text-black'}`} style={FBold}>{s.driverName}</span>
                        <span className={`text-[12px] font-mono ${s.isPlayer ? 'text-white/80' : 'text-[#4a5565]'}`} style={FR}>{s.points}pts</span>
                      </div>
                    ))
                  })()}
                  {championshipData.standings.length === 0 && (
                    <div className="text-center py-[16px]">
                      <p className="text-[11px] text-[#99a1af]" style={FR}>No standings data yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* SERIES Card */}
              {currentSeries && (
                <div className={CARD}>
                  <div className="px-[16px] py-[12px] border-b-[1.6px] border-black flex items-center gap-[8px]">
                    <Calendar className="w-[16px] h-[16px]" />
                    <span className="text-[14px] text-black tracking-[-0.7px]" style={FB}>SERIES</span>
                  </div>
                  <div className="p-[16px]">
                    <p className="text-[13px] text-black mb-[4px]" style={FBold}>{currentSeries.name}</p>
                    <p className="text-[11px] text-[#4a5565]" style={FR}>Round {roundNumber} of {totalRounds}</p>
                  </div>
                </div>
              )}

              {/* LIVE STANDINGS (when telemetry connected) */}
              {telemetryStatus.receiving && participants.length > 0 && (
                <div className={CARD}>
                  <div className="px-[16px] py-[12px] border-b-[1.6px] border-black flex items-center justify-between">
                    <div className="flex items-center gap-[8px]">
                      <Radio className="w-[16px] h-[16px]" />
                      <span className="text-[14px] text-black tracking-[-0.7px]" style={FB}>LIVE</span>
                    </div>
                    <span className="text-[10px] px-[8px] py-[2px] rounded-full bg-[#00a63e]/10 text-[#00a63e] flex items-center gap-[4px]" style={FBold}>
                      <span className="w-[6px] h-[6px] bg-[#00a63e] rounded-full animate-pulse" /> {participants.length} drivers
                    </span>
                  </div>
                  <div className="p-[12px] space-y-[4px] max-h-[300px] overflow-y-auto">
                    {participants
                      .sort((a, b) => a.racePosition - b.racePosition)
                      .slice(0, 10)
                      .map((p, idx) => (
                        <div key={p.name || idx} className={`flex items-center gap-[8px] px-[10px] py-[6px] rounded-[10px] ${p.isPlayer ? 'bg-[#ff6900] text-white' : 'bg-[#f9fafb]'}`}>
                          <span className={`w-[20px] h-[20px] rounded-[6px] flex items-center justify-center text-[10px] ${
                            p.racePosition === 1 ? 'bg-[#f0b100] text-black' :
                            p.racePosition === 2 ? 'bg-gray-400 text-black' :
                            p.racePosition === 3 ? 'bg-amber-700 text-white' :
                            p.isPlayer ? 'bg-white/20 text-white' : 'bg-[#e5e7eb]'
                          }`} style={FBold}>{p.racePosition}</span>
                          {getParticipantPortrait(p.name) ? (
                            <img src={getParticipantPortrait(p.name)} alt={p.name || `Driver ${idx + 1}`} className="w-[20px] h-[20px] rounded-full object-cover bg-gray-200 border border-black/10" />
                          ) : (
                            <div className="w-[20px] h-[20px] rounded-full bg-[#e5e7eb] border border-black/10 flex items-center justify-center text-[8px] text-[#4a5565]" style={FBold}>
                              {(p.name || `D${idx + 1}`).split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                            </div>
                          )}
                          <span className={`flex-1 text-[11px] ${p.isPlayer ? 'text-white' : 'text-black'}`} style={p.isPlayer ? FBold : FR}>
                            {p.name || `Driver ${idx + 1}`}{p.isPlayer && ' (You)'}
                          </span>
                          <span className={`text-[10px] font-mono ${p.isPlayer ? 'text-white/80' : 'text-[#4a5565]'}`}>
                            {p.bestLapTime > 0 ? formatLapTime(p.bestLapTime) : '-'}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      {/* Car Condition Warning Modal */}
      {showCarConditionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-[24px]" onClick={() => setShowCarConditionModal(false)}>
          <div className={`bg-white border-[1.6px] border-black rounded-[16px] max-w-[520px] w-full max-h-[85vh] overflow-y-auto p-[24px]`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-[16px]">
              <h2 className="text-[20px] text-black tracking-[-1px]" style={FB}>Car Not Race-Ready</h2>
              <button onClick={() => setShowCarConditionModal(false)} className="w-[32px] h-[32px] rounded-full bg-[#f9fafb] flex items-center justify-center text-[#4a5565] hover:bg-[#e5e7eb] transition-colors text-[18px]">&times;</button>
            </div>
            <div className="space-y-[20px]">
              <div className="text-center py-[12px]">
                <div className="w-[72px] h-[72px] mx-auto rounded-full bg-[#fb2c36]/15 flex items-center justify-center mb-[12px]">
                  <AlertTriangle className="w-[36px] h-[36px] text-[#fb2c36]" />
                </div>
                <h2 className="text-[16px] text-black mb-[6px]" style={FB}>Critical Wear Detected</h2>
                <p className="text-[12px] text-[#4a5565]" style={FR}>Your car has critically worn parts that must be serviced before racing.</p>
              </div>

              <div className="space-y-[8px]">
                <h4 className="text-[11px] text-[#4a5565] uppercase tracking-[0.5px]" style={FBold}>Parts requiring attention</h4>
                {carConditionCheck.issues.map(issue => (
                  <div key={issue.part} className="flex items-center justify-between p-[12px] bg-[#fef2f2] border-[1.6px] border-[#fecaca] rounded-[14px]">
                    <div className="flex items-center gap-[10px]">
                      <Wrench className="w-[18px] h-[18px] text-[#fb2c36]" />
                      <span className="text-[12px] capitalize" style={FBold}>{issue.part}</span>
                    </div>
                    <div className="flex items-center gap-[8px]">
                      <div className="w-[80px] h-[8px] bg-[#e5e7eb] rounded-full overflow-hidden">
                        <div className="h-full bg-[#fb2c36] rounded-full" style={{ width: `${issue.wear}%` }} />
                      </div>
                      <span className="text-[11px] font-mono text-[#fb2c36]" style={FBold}>{issue.wear.toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-[12px] bg-[#fff7ed] border-[1.6px] border-[#ffd6a8] rounded-[14px]">
                <p className="text-[11px] text-[#ff6900]" style={FR}>
                  <AlertCircle className="w-[14px] h-[14px] inline mr-[6px]" />
                  Racing with critically worn parts will likely result in a DNF or mechanical failure.
                </p>
              </div>

              <div className="flex gap-[12px]">
                <button onClick={() => setShowCarConditionModal(false)} className="flex-1 h-[40px] border-[1.6px] border-black rounded-full text-[13px] text-black hover:bg-[#f9fafb] transition-colors" style={FBold}>Stay on Race Day</button>
                <button onClick={() => { setShowCarConditionModal(false); navigate('/garage') }} className="flex-1 h-[40px] bg-black text-white rounded-full text-[13px] flex items-center justify-center gap-[8px] hover:bg-black/90 transition-colors" style={FBold}>
                  <Wrench className="w-[14px] h-[14px]" /> Go to Garage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Race Complete Modal — Beat-by-beat reveal */}
      {showRaceCompleteModal && (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-[24px]" onClick={() => setShowRaceCompleteModal(false)}>
        <div className="bg-white border-[1.6px] border-black rounded-[16px] max-w-[520px] w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {raceCompleteData && (() => {
          const { result, processed, debrief } = raceCompleteData
          const pos = result.playerPosition
          const isDnf = result.dnf
          const isVictory = !isDnf && pos === 1
          const isPodium = !isDnf && pos <= 3
          const isPoints = !isDnf && pos <= 10

          // ── Cutscene image ──────────────────────────────────────────────
          const cutsceneId = isDnf ? 'pit-stop-drama' : isVictory ? 'podium-celebration' : isPodium ? 'garage-celebration' : 'race-start'
          const cutsceneSrc = getCutsceneImage(cutsceneId)

          // ── Position styling ────────────────────────────────────────────
          const posRingClass = isVictory
            ? 'bg-[#f0b100] shadow-lg shadow-[#f0b100]/30'
            : isPodium ? 'bg-gradient-to-br from-gray-300 to-gray-500'
            : isDnf ? 'bg-[#fb2c36]'
            : 'bg-black'

          // ── Narrative lines (logic-based, no AI) ───────────────────────
          const storyLines: string[] = []
          if (debrief.qualifyingPos && !isDnf) {
            const gained = debrief.positionsGained
            if (gained > 2) storyLines.push(`Started P${debrief.qualifyingPos} and charged through the field — a ${gained}-place gain.`)
            else if (gained > 0) storyLines.push(`Gained ${gained} ${gained === 1 ? 'place' : 'places'} from P${debrief.qualifyingPos} to finish P${pos}.`)
            else if (gained < 0) storyLines.push(`Dropped ${Math.abs(gained)} ${Math.abs(gained) === 1 ? 'place' : 'places'} from qualifying P${debrief.qualifyingPos}.`)
            else storyLines.push(`Held P${pos} from qualifying to the flag.`)
          }
          if (debrief.aiBreakdown.injuryPenalty > 0) storyLines.push('Racing through injury cost you — recovery before the next round is essential.')
          else if (debrief.fatigue >= 80) storyLines.push('High fatigue hurt your pace in the later stages — rest up before next time.')
          else if (debrief.aiBreakdown.formBonus > 0.05) storyLines.push(`Hot streak delivering — ${(debrief.aiBreakdown.formBonus * 100).toFixed(0)}% edge on form alone.`)
          else if (debrief.aiBreakdown.teamDevelopment > 0.05) storyLines.push(`R&D advantage showing — ${(debrief.aiBreakdown.teamDevelopment * 100).toFixed(0)}% car edge.`)
          else if (debrief.carCondition === 'worn' || debrief.carCondition === 'critical') storyLines.push('Car wear is building — prioritise a service before the next race.')
          if (storyLines.length === 0) storyLines.push('Clean race. The results speak for themselves.')

          // ── Next race info ─────────────────────────────────────────────
          const nextRace = currentSeries?.calendar?.find(r => r.week > (careerState?.currentWeek || 0))
          const weeksToNext = nextRace ? nextRace.week - (careerState?.currentWeek || 0) : null

          // ── Championship position ──────────────────────────────────────
          const standings = activeSeriesId ? (seasonStandings[activeSeriesId] || []) : []
          const myStanding = standings.find(s => s.isPlayer)
          const leader = standings[0]
          const pointsGap = myStanding && leader && myStanding.position !== 1
            ? leader.points - myStanding.points
            : 0

          // ── Handle finish weekend ──────────────────────────────────────
          const handleFinishWeekend = () => {
            useCareerStore.getState().advanceWeek()
            useCareerStore.getState().clearRaceWeekendProgress()
            // Auto-complete routine post-race activities (debrief, damage check) after
            // advanceWeek() has had a chance to schedule them
            setTimeout(() => useCareerStore.getState().autoCompletePostRaceActivities(), 0)
            setShowRaceCompleteModal(false)
            addToast({ type: 'success', message: 'Race weekend complete!', duration: 2500 })
            navigate('/')
          }

          return (
            <div className="relative -mx-6 -mt-6">
              {/* Cutscene header image */}
              {cutsceneSrc && (
                <div className="relative h-40 overflow-hidden rounded-t-lg">
                  <img src={cutsceneSrc} alt="Race moment" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent" />
                </div>
              )}

              <div className="px-6 pb-6 space-y-0">
                {/* ── BEAT 0 — The Moment ───────────────────────────────── */}
                <AnimatePresence mode="wait">
                  {revealStep === 0 && (
                    <motion.div key="beat0"
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.3 }}
                      className="text-center pt-4 space-y-4"
                    >
                      <div className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center ${posRingClass}`}>
                        <span className="font-black text-4xl text-white tracking-tight">
                          {isDnf ? 'DNF' : `P${pos}`}
                        </span>
                      </div>
                      <div>
                        <h2 className="font-black text-3xl mb-1 text-[#111827]">
                          {isDnf ? 'Race Retired' : isVictory ? 'VICTORY' : isPodium ? 'Podium Finish' : isPoints ? 'Points Finish' : 'Race Complete'}
                        </h2>
                        <p className="text-[#374151] text-sm font-medium">{result.trackName}</p>
                        {currentSeries && <p className="text-[#6b7280] text-xs mt-0.5 font-medium">{currentSeries.name}</p>}
                      </div>
                      <button
                        onClick={() => setRevealStep(1)}
                        className="w-full py-3 rounded-full bg-[#f9fafb] border-[1.6px] border-[#e5e7eb] hover:bg-[#e5e7eb] text-[13px] transition-colors flex items-center justify-center gap-2"
                        style={FBold}
                      >
                        The Story <ChevronRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}

                  {/* ── BEAT 1 — The Story ──────────────────────────────── */}
                  {revealStep === 1 && (
                    <motion.div key="beat1"
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.3 }}
                      className="pt-4 space-y-4"
                    >
                      <h3 className="font-bold text-lg text-center">The Story</h3>

                      {/* Qualifying delta */}
                      {debrief.qualifyingPos && !isDnf && (
                        <div className={`flex items-center gap-3 p-3 rounded-xl text-sm ${
                          debrief.positionsGained > 0 ? 'bg-[#00a63e]/10 text-[#00a63e]' :
                          debrief.positionsGained < 0 ? 'bg-[#ef4444]/10 text-[#ef4444]' :
                          'bg-[#f9fafb] text-[#4a5565]'
                        }`}>
                          {debrief.positionsGained > 0 ? <TrendingUp className="w-4 h-4 flex-shrink-0" /> :
                           debrief.positionsGained < 0 ? <TrendingDown className="w-4 h-4 flex-shrink-0" /> :
                           <Minus className="w-4 h-4 flex-shrink-0" />}
                          <span>P{debrief.qualifyingPos} → P{pos}</span>
                        </div>
                      )}

                      {/* Narrative lines */}
                      <div className="space-y-2">
                        {storyLines.map((line, i) => (
                          <p key={i} className="text-sm text-[#374151] leading-relaxed">{line}</p>
                        ))}
                      </div>

                      {/* Key factor pill */}
                      <div className="flex flex-wrap gap-2">
                        {debrief.fatigue >= 70 && (
                          <span className="px-2.5 py-1 rounded-full text-xs bg-[#ea580c]/15 text-[#ea580c] border border-[#ea580c]/25">High Fatigue</span>
                        )}
                        {debrief.aiBreakdown.formBonus > 0.03 && (
                          <span className="px-2.5 py-1 rounded-full text-xs bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/25">Hot Streak</span>
                        )}
                        {debrief.aiBreakdown.injuryPenalty > 0 && (
                          <span className="px-2.5 py-1 rounded-full text-xs bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/25">Injury</span>
                        )}
                        {(debrief.carCondition === 'worn' || debrief.carCondition === 'critical') && (
                          <span className="px-2.5 py-1 rounded-full text-xs bg-[#ea580c]/15 text-[#ea580c] border border-[#ea580c]/25">Car Wear</span>
                        )}
                        {debrief.carCondition === 'excellent' && (
                          <span className="px-2.5 py-1 rounded-full text-xs bg-[#00a63e]/15 text-[#00a63e] border border-[#00a63e]/25">Fresh Car</span>
                        )}
                      </div>

                      <button
                        onClick={() => setRevealStep(2)}
                        className="w-full py-3 rounded-full bg-[#f9fafb] border-[1.6px] border-[#e5e7eb] hover:bg-[#e5e7eb] text-[13px] transition-colors flex items-center justify-center gap-2"
                        style={FBold}
                      >
                        The Consequences <ChevronRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}

                  {/* ── BEAT 2 — The Consequences ───────────────────────── */}
                  {revealStep === 2 && (
                    <motion.div key="beat2"
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.3 }}
                      className="pt-4 space-y-4"
                    >
                      <h3 className="font-bold text-lg text-center">The Consequences</h3>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-[#f9fafb] rounded-xl border border-[#e5e7eb]">
                          <Trophy className="w-5 h-5 mx-auto mb-1.5 text-[#f59e0b]" />
                          <p className={`text-xl font-bold ${processed.points > 0 ? 'text-[#f59e0b]' : 'text-[#374151]'}`}>
                            {processed.points > 0 ? `+${processed.points}` : '—'}
                          </p>
                          <p className="text-[11px] text-[#6b7280] mt-0.5 font-medium">Points</p>
                        </div>
                        <div className="text-center p-3 bg-[#f9fafb] rounded-xl border border-[#e5e7eb]">
                          <DollarSign className="w-5 h-5 mx-auto mb-1.5 text-[#00a63e]" />
                          <p className="text-xl font-bold text-[#00a63e]">
                            ${(processed.prizeMoney / 1000).toFixed(0)}k
                          </p>
                          <p className="text-[11px] text-[#6b7280] mt-0.5 font-medium">Prize</p>
                        </div>
                        <div className="text-center p-3 bg-[#f9fafb] rounded-xl border border-[#e5e7eb]">
                          <Activity className="w-5 h-5 mx-auto mb-1.5 text-[#2563eb]" />
                          <p className={`text-xl font-bold ${processed.repChange >= 0 ? 'text-[#00a63e]' : 'text-[#ef4444]'}`}>
                            {processed.repChange >= 0 ? '+' : ''}{processed.repChange}
                          </p>
                          <p className="text-[11px] text-[#6b7280] mt-0.5 font-medium">Reputation</p>
                        </div>
                      </div>

                      {/* Championship delta */}
                      {myStanding && (
                        <div className="p-3 bg-[#f9fafb] rounded-xl border border-[#e5e7eb] flex items-center justify-between text-sm">
                          <span className="text-[#374151] font-medium">Championship</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#111827]">P{myStanding.position}</span>
                            {pointsGap > 0 && (
                              <span className="text-xs text-[#6b7280] font-medium">{pointsGap} pts off lead</span>
                            )}
                            {myStanding.position === 1 && (
                              <span className="text-xs text-[#f59e0b] font-bold">LEADING</span>
                            )}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => setRevealStep(3)}
                        className="w-full py-3 rounded-full bg-[#f9fafb] border-[1.6px] border-[#e5e7eb] hover:bg-[#e5e7eb] text-[13px] transition-colors flex items-center justify-center gap-2"
                        style={FBold}
                      >
                        What&apos;s Next <ChevronRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}

                  {/* ── BEAT 3 — The Next Chapter ────────────────────────── */}
                  {revealStep === 3 && (
                    <motion.div key="beat3"
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.3 }}
                      className="pt-4 space-y-4"
                    >
                      <h3 className="font-bold text-lg text-center">What's Next</h3>

                      {nextRace ? (
                        <div className="p-4 bg-[#ea580c]/10 border border-[#ea580c]/30 rounded-xl">
                          <div className="flex items-start gap-3">
                            <Flag className="w-5 h-5 text-[#ea580c] mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-sm text-[#111827]">{nextRace.trackName}</p>
                              <p className="text-xs text-[#6b7280] mt-0.5 font-medium">
                                {weeksToNext === 1 ? 'Next week' : `${weeksToNext} weeks away`} · Round {nextRace.round}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-[#f9fafb] rounded-xl border border-[#e5e7eb] text-center">
                          <Trophy className="w-6 h-6 mx-auto mb-2 text-[#f59e0b]" />
                          <p className="font-semibold text-sm text-[#111827]">Season Complete</p>
                          <p className="text-xs text-[#6b7280] mt-1">All races finished. Check your season summary.</p>
                        </div>
                      )}

                      {myStanding && standings.length > 0 && (
                        <div className="space-y-1.5">
                          {standings.slice(0, 3).map((s, i) => (
                            <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${s.isPlayer ? 'bg-[#2563eb] border border-[#2563eb]' : 'bg-[#f9fafb] border border-[#e5e7eb]'}`}>
                              <span className={`w-5 text-center font-bold text-xs ${s.isPlayer ? 'text-white/80' : 'text-[#6b7280]'}`}>P{s.position}</span>
                              <span className={`flex-1 text-xs font-semibold ${s.isPlayer ? 'text-white' : 'text-[#374151]'}`}>{s.driverName}</span>
                              <span className={`font-mono text-xs font-medium ${s.isPlayer ? 'text-white/90' : 'text-[#6b7280]'}`}>{s.points}pts</span>
                            </div>
                          ))}
                          {myStanding.position > 3 && (
                            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm bg-[#2563eb] border border-[#2563eb]">
                              <span className="w-5 text-center font-bold text-white/80 text-xs">P{myStanding.position}</span>
                              <span className="flex-1 text-xs text-white font-semibold">{myStanding.driverName}</span>
                              <span className="font-mono text-xs text-white/90 font-medium">{myStanding.points}pts</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Primary CTA */}
                      <button
                        onClick={handleFinishWeekend}
                        className="w-full py-3.5 rounded-full text-[13px] transition-all bg-black text-white hover:bg-black/90 flex items-center justify-center gap-2"
                        style={FBold}
                      >
                        <ArrowRight className="w-4 h-4" />
                        Finish Weekend
                      </button>
                      <button
                        onClick={() => setShowRaceCompleteModal(false)}
                        className="w-full py-2 text-[11px] text-[#4a5565] hover:text-black transition-colors"
                        style={FR}
                      >
                        Stay on Race Day
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Step dots */}
                <div className="flex justify-center gap-1.5 pt-4">
                  {[0,1,2,3].map(i => (
                    <button
                      key={i}
                      onClick={() => i < revealStep + 1 && setRevealStep(i)}
                      className={`rounded-full transition-all ${i === revealStep ? 'w-4 h-1.5 bg-black' : i < revealStep ? 'w-1.5 h-1.5 bg-[#99a1af] hover:bg-[#4a5565]' : 'w-1.5 h-1.5 bg-[#e5e7eb]'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        })()}
        </div>
      </div>
      )}
    </div>
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
  const hasStoredResult = storedResult?.completed
  const effectiveStatus = hasStoredResult ? 'completed' : status
  const hasCarIssues = carConditionIssues && carConditionIssues.length > 0

  return (
    <div className="text-center py-[16px]">
      {/* Status area */}
      <div className={`inline-flex items-center gap-[8px] px-[14px] py-[8px] rounded-full mb-[12px] ${
        hasCarIssues && !hasStoredResult ? 'bg-[#fef2f2] border-[1.6px] border-[#fecaca]'
        : isLive ? 'bg-[#00a63e] text-white'
        : effectiveStatus === 'completed' ? 'bg-[#f0fdf4] border-[1.6px] border-[#bbf7d0]'
        : telemetryConnected ? 'bg-[#fff7ed] border-[1.6px] border-[#ffd6a8]'
        : 'bg-[#f9fafb] border-[1.6px] border-[#e5e7eb]'
      }`}>
        {hasCarIssues && !hasStoredResult ? (
          <><AlertTriangle className="w-[14px] h-[14px] text-[#fb2c36]" /><span className="text-[11px] text-[#fb2c36]" style={FBold}>Car Service Required</span></>
        ) : effectiveStatus === 'completed' ? (
          <><CheckCircle className="w-[14px] h-[14px] text-[#00a63e]" /><span className="text-[11px] text-[#00a63e]" style={FBold}>Completed</span></>
        ) : isLive ? (
          <><Radio className="w-[14px] h-[14px] animate-pulse" /><span className="text-[11px]" style={FBold}>In Progress</span></>
        ) : telemetryConnected ? (
          <><HardDrive className="w-[14px] h-[14px] text-[#ff6900]" /><span className="text-[11px] text-[#ff6900]" style={FBold}>Waiting for Session</span></>
        ) : (
          <><WifiOff className="w-[14px] h-[14px] text-[#99a1af]" /><span className="text-[11px] text-[#4a5565]" style={FBold}>Telemetry Not Connected</span></>
        )}
      </div>

      <h3 className="text-[16px] text-black mb-[4px]" style={FB}>{title}</h3>
      <p className="text-[11px] text-[#4a5565] mb-[16px]" style={FR}>{description}</p>

      {/* Car Condition Warning */}
      {hasCarIssues && !hasStoredResult && (
        <div className="mb-[16px] p-[12px] bg-[#fef2f2] border-[1.6px] border-[#fecaca] rounded-[14px]">
          <p className="text-[11px] text-[#fb2c36] mb-[8px]" style={FR}>
            {carConditionIssues.map(i => i.part).join(', ')} wear is critical ({'>'}90%)
          </p>
          {onShowCarConditionModal && (
            <button onClick={onShowCarConditionModal} className="h-[28px] px-[12px] border-[1.6px] border-[#fb2c36] text-[#fb2c36] rounded-full text-[11px] hover:bg-[#fb2c36]/10 transition-colors" style={FBold}>
              View Details
            </button>
          )}
        </div>
      )}

      {isLive ? (
        <div className="space-y-[8px]">
          <p className="text-[11px] text-[#4a5565]" style={FR}>
            {liveSession?.sessionState} • {liveSession?.numParticipants || 0} participants
          </p>
        </div>
      ) : hasStoredResult ? (
        <div className="space-y-[12px]">
          <div className="bg-[#f9fafb] border-[1.6px] border-[#e5e7eb] rounded-[14px] p-[12px]">
            <div className="grid grid-cols-3 gap-[12px] text-center">
              <div>
                <p className="text-[20px] text-[#ff6900]" style={FB}>P{storedResult.position}</p>
                <p className="text-[9px] text-[#4a5565] uppercase tracking-[0.5px]" style={FBold}>Position</p>
              </div>
              <div>
                <p className="text-[16px] text-black font-mono" style={FBold}>{formatLapTime(storedResult.bestLapTime)}</p>
                <p className="text-[9px] text-[#4a5565] uppercase tracking-[0.5px]" style={FBold}>Best Lap</p>
              </div>
              <div>
                <p className="text-[20px] text-[#2b7fff]" style={FB}>{storedResult.participantCount}</p>
                <p className="text-[9px] text-[#4a5565] uppercase tracking-[0.5px]" style={FBold}>Drivers</p>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-[#99a1af]" style={FR}>Completed at {new Date(storedResult.completedAt).toLocaleTimeString()}</p>
          {isRaceSession && isWeekendComplete && onAdvanceWeek && (
            <button onClick={onAdvanceWeek} className="mt-[8px] h-[36px] px-[16px] bg-black text-white rounded-full text-[12px] flex items-center gap-[6px] mx-auto hover:bg-black/90 transition-colors" style={FBold}>
              <ArrowRight className="w-[14px] h-[14px]" /> Advance Week
            </button>
          )}
        </div>
      ) : effectiveStatus === 'completed' ? (
        <div className="space-y-[12px]">
          {isRaceSession && isWeekendComplete && onAdvanceWeek && (
            <button onClick={onAdvanceWeek} className="h-[36px] px-[16px] bg-black text-white rounded-full text-[12px] flex items-center gap-[6px] mx-auto hover:bg-black/90 transition-colors" style={FBold}>
              <ArrowRight className="w-[14px] h-[14px]" /> Advance Week
            </button>
          )}
        </div>
      ) : telemetryConnected ? (
        <p className="text-[11px] text-[#4a5565]" style={FR}>Open AMS2 and start a session — it will be detected automatically</p>
      ) : (
        <p className="text-[11px] text-[#99a1af]" style={FR}>Connect to AMS2 using the button above</p>
      )}
    </div>
  )
}

function formatLapTime(seconds: number): string {
  if (seconds <= 0) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return `${mins}:${secs.padStart(6, '0')}`
}
