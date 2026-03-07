import { useState, useEffect } from 'react'
import { 
  Settings as SettingsIcon, Folder, Play, WifiOff, 
  Check, X, AlertCircle, RefreshCw, Save, Monitor,
  Gamepad2, Radio, HardDrive, Volume2, Eye, Users, ChevronRight,
  FileCode, Mic, Key, Volume1, VolumeX, TestTube, Wrench, Trash2, Layers, Zap, DollarSign, Sparkles, Heart, UserPlus
} from 'lucide-react'
import { useToast } from '@/components/ui'

// Local UI components implementing new design system
function Card({ children, className = '', variant: _v, padding: _p, ...rest }: any) {
  return <div className={`bg-white border-[0.8px] border-black/20 rounded-[24px] overflow-hidden ${className}`} {...rest}>{children}</div>
}
function CardHeader({ title, subtitle, action, icon, children }: { title?: string; subtitle?: string; action?: React.ReactNode; icon?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="px-[20px] pt-[16px] pb-[8px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[8px]">
          {icon}
          <div>
            <h3 className="text-[18px] text-[#0a0a0a]" style={{ fontFamily: "'Arial Black', 'Arial', sans-serif" }}>{title}</h3>
            {subtitle && <p className="text-[13px] text-[#4a5565]" style={{ fontFamily: "'Arial', sans-serif" }}>{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}
function Badge({ children, variant: _v, size: _s, className = '' }: any) {
  return <span className={`inline-flex items-center text-[11px] px-[8px] py-[2px] rounded-[8px] border-[0.8px] border-black/20 text-[#4a5565] ${className}`}>{children}</span>
}
function Button({ children, variant = 'primary', size: _s, className = '', disabled, onClick, ...rest }: any) {
  const base = variant === 'primary' || variant === 'danger'
    ? 'bg-black text-white rounded-[16px]'
    : variant === 'ghost'
      ? 'bg-transparent hover:bg-black/5 rounded-[12px]'
      : 'border-[0.8px] border-black/20 rounded-[12px] bg-white'
  return <button className={`px-[16px] py-[8px] text-[14px] transition-colors disabled:opacity-50 ${base} ${className}`} disabled={disabled} onClick={onClick} {...rest}>{children}</button>
}
import { initStreamingAudio, startStreamingSession, setStreamingVoiceBoost, stopStreamingSession } from '@/services/streamingAudio'
import { getGeminiKeyPool } from '@/services/geminiKeyRotation'
import { buildCommentaryWorldSnapshot } from '@/services/commentaryWorldSnapshot'
import { getDriverNarrative, getDriverNarrativeByName, getTeamNarrative, getTeamNarrativeByName, isContentLoaded as isPreGenContentLoaded } from '@/services/preGeneratedContentService'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import {
  getRecordsNearBreaking,
  getTripleCrownProgress,
  getNextTierInfo,
  checkIfWinBreaksRecord
} from '@/data/achievements';

// Local type definitions for settings
interface AMS2Settings {
  gamePath: string
  autoConnect: boolean
  disableVR: boolean
  telemetryPort: number
}

interface CommentarySettings {
  enabled: boolean
  geminiKey: string
  geminiKeys?: string[]
  elevenLabsKey: string
  voiceId: string
  coCommentatorVoiceId: string
  pitReporterVoiceId: string
  volume: number
  audioDeviceId: string
}

interface AudioDevice {
  id: string
  name: string
  isDefault?: boolean
}

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }
const _CARD = 'bg-white border-[0.8px] border-black/20 rounded-[24px] overflow-hidden'

type TelemetryStatus = { listening: boolean; receiving: boolean; lastPacket: number; participantCount: number }

const DEFAULT_SETTINGS: AMS2Settings = {
  gamePath: '',
  autoConnect: false,
  disableVR: false,
  telemetryPort: 9000
}

const DEFAULT_COMMENTARY: CommentarySettings = {
  enabled: false,
  geminiKey: '',
  elevenLabsKey: '',
  voiceId: 'byILgTtsBg1jwbuvslb2',
  coCommentatorVoiceId: 'cmPhBFoVi6Q3CAWAx2Gr',
  pitReporterVoiceId: '',
  volume: 80,
  audioDeviceId: ''
}

const isElectron = !!(window as any).electron

const VOICE_OPTIONS: Array<{ id: string; name: string; description: string }> = [
  { id: 'byILgTtsBg1jwbuvslb2', name: 'Crofty V3', description: 'Lead commentator - David Croft style' },
  { id: 'cmPhBFoVi6Q3CAWAx2Gr', name: 'Brundle', description: 'Co-commentator - Martin Brundle style' },
  { id: 'CeyZm7wQSjZcnhOrE9l8', name: 'Crofty (v1)', description: 'Original Crofty voice clone' },
  { id: 'V0cljQmo7wpx8LTdbqfJ', name: 'Vicky Cowan', description: 'Pro British radio presenter' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', description: 'Dominant, firm' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', description: 'Husky trickster' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', description: 'Deep, confident, energetic' },
]

function getTeamSatisfactionStatus(satisfaction: number | undefined): string {
  const s = satisfaction ?? 70
  if (s >= 80) return 'Excellent'
  if (s >= 60) return 'Good'
  if (s >= 40) return 'Neutral'
  if (s >= 20) return 'Unhappy'
  return 'Critical'
}

function getSponsorSatisfactionData(sponsorDeals: any[] | undefined) {
  if (!sponsorDeals || sponsorDeals.length === 0) {
    return {
      sponsorsSatisfied: 0,
      sponsorsAtRisk: 0,
      sponsorsTotal: 0,
      topSponsorName: undefined,
      sponsorPressureLevel: 'none' as const
    }
  }
  const activeSponsors = sponsorDeals.filter((d: any) => d.active !== false)
  const satisfied = activeSponsors.filter((d: any) => (d.satisfaction ?? 70) >= 70).length
  const atRisk = activeSponsors.filter((d: any) => (d.satisfaction ?? 70) < 40).length
  const topSponsor = activeSponsors.reduce((top: any, current: any) => 
    (current.payment ?? 0) > (top?.payment ?? 0) ? current : top
  , activeSponsors[0])
  
  return {
    sponsorsSatisfied: satisfied,
    sponsorsAtRisk: atRisk,
    sponsorsTotal: activeSponsors.length,
    topSponsorName: topSponsor?.sponsorName,
    sponsorPressureLevel: (atRisk / Math.max(activeSponsors.length, 1)) >= 0.5 ? 'high' as const : atRisk > 0 ? 'moderate' as const : 'none' as const
  }
}

function getSponsorPressure(sponsorDeals: any[]) {
  if (!sponsorDeals || sponsorDeals.length === 0) {
    return {
      sponsorsSatisfied: 0,
      sponsorsAtRisk: 0,
      sponsorsTotal: 0,
      topSponsorName: undefined,
      sponsorPressureLevel: 'none' as const
    }
  }
  
  const activeSponsors = sponsorDeals.filter(d => d.active !== false)
  const satisfied = activeSponsors.filter(d => (d.satisfaction ?? 70) >= 70).length
  const atRisk = activeSponsors.filter(d => (d.satisfaction ?? 70) < 40).length
  
  // Find top sponsor by payment
  const topSponsor = activeSponsors.reduce((top, current) => 
    (current.payment ?? 0) > (top?.payment ?? 0) ? current : top
  , activeSponsors[0])
  
  // Calculate overall pressure level
  let pressureLevel: 'none' | 'low' | 'moderate' | 'high' = 'none'
  if (activeSponsors.length > 0) {
    const riskRatio = atRisk / activeSponsors.length
    if (riskRatio >= 0.5) pressureLevel = 'high'
    else if (riskRatio >= 0.25) pressureLevel = 'moderate'
    else if (atRisk > 0) pressureLevel = 'low'
  }
  
  return {
    sponsorsSatisfied: satisfied,
    sponsorsAtRisk: atRisk,
    sponsorsTotal: activeSponsors.length,
    topSponsorName: topSponsor?.sponsorName,
    sponsorPressureLevel: pressureLevel
  }
}

export function Settings() {
  const [settings, setSettings] = useState<AMS2Settings>(() => {
    try {
      const saved = localStorage.getItem('ams2-settings')
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })
  
  const [commentary, setCommentary] = useState<CommentarySettings>(() => {
    try {
      const saved = localStorage.getItem('commentary-settings')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Merge with defaults so missing fields (from older schemas) get default values
        // Also handle legacy key name 'openAIKey' -> 'geminiKey'
        return {
          ...DEFAULT_COMMENTARY,
          ...parsed,
          geminiKeys: Array.isArray(parsed.geminiKeys) ? parsed.geminiKeys : undefined,
          geminiKey: parsed.geminiKey || parsed.openAIKey || parsed.geminiKeys?.[0] || DEFAULT_COMMENTARY.geminiKey,
        }
      }
      return DEFAULT_COMMENTARY
    } catch {
      return DEFAULT_COMMENTARY
    }
  })
  
  const [telemetryStatus, setTelemetryStatus] = useState<TelemetryStatus>({
    listening: false,
    receiving: false,
    lastPacket: 0,
    participantCount: 0
  })
  
  const [isConnecting, setIsConnecting] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [pathValid, setPathValid] = useState<boolean | null>(null)
  
  // Live data preview
  const [liveSession, setLiveSession] = useState<any>(null)
  const [liveParticipants, setLiveParticipants] = useState<any[]>([])
  const [updateCount, setUpdateCount] = useState(0)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  
  // XML Generation state
  const [isGeneratingXML, setIsGeneratingXML] = useState(false)
  const [xmlResult, setXmlResult] = useState<{ success: boolean; message: string } | null>(null)
  
  // Commentary state
  const [_commentaryStatus, setCommentaryStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [lastCommentaryScript, setLastCommentaryScript] = useState<string>('')
  const [lastCoCommentaryScript, setLastCoCommentaryScript] = useState<string>('')
  const [isTesting, setIsTesting] = useState(false)
  const [isTestingBanter, setIsTestingBanter] = useState(false)
  const [isTestingQueue, setIsTestingQueue] = useState(false)
  const [isTestingBroadcast, setIsTestingBroadcast] = useState(false)
  const [broadcastTestProgress, setBroadcastTestProgress] = useState<{ elapsed: number; total: number } | null>(null)
  const [isRegeneratingNarratives, setIsRegeneratingNarratives] = useState(false)
  const [narrativeProgress, setNarrativeProgress] = useState<{ series: string; progress: number } | null>(null)
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([])
  const [isLoadingDevices, setIsLoadingDevices] = useState(false)
  const [isTestingAudio, setIsTestingAudio] = useState(false)
  const [isTestingStreaming, setIsTestingStreaming] = useState(false)
  const [streamingLatency, setStreamingLatency] = useState<{ firstChunkMs: number; totalMs: number } | null>(null)
  
  // Career data for XML generation and repair
  const { player, careerState, hasActiveCareer, repairCareerData, repairPhoneMessages, recalculateTeamReputation, recalculateMarketability, recalculatePrizeMoney, recalculateEconomy, normalizeCurrentCareerEconomy, upgradeContractsAndSponsors, reassignStaffPortraits, setDatingPreference, replaceContactsWithPartnerPool, reassignActivityTimeslots } = useCareerStore()
  const { getStandings, getSeriesById, migrateNarrativesForAllSeries, needsNarrativeMigration, fixAllTeamEconomics, migrateSeriesData, getBackgroundNarrativeStatus, needsTeamNarrativeMigration, startBackgroundTeamNarrativeGeneration, getBackgroundTeamNarrativeStatus } = useRivalStore()
  
  // Team narrative generation is now tracked in the store (persists across navigation)
  const teamNarrativeStatus = getBackgroundTeamNarrativeStatus()
  const [isRepairing, setIsRepairing] = useState(false)
  const [repairResult, setRepairResult] = useState<{
    duplicateRacesRemoved: number
    duplicateTransactionsRemoved: number
    statsRecalculated: boolean
    standingsFixed: boolean
    oldRep: number
    newRep: number
    oldBalance: number
    newBalance: number
  } | null>(null)
  const [isResettingTeamRep, setIsResettingTeamRep] = useState(false)
  const [teamRepResetResult, setTeamRepResetResult] = useState<{ oldRep: number; newRep: number } | null>(null)
  const [isResettingMarketability, setIsResettingMarketability] = useState(false)
  const [marketabilityResetResult, setMarketabilityResetResult] = useState<{ oldMarketability: number; newMarketability: number } | null>(null)
  const [isReassigningTimeslots, setIsReassigningTimeslots] = useState(false)
  const [timeslotResult, setTimeslotResult] = useState<number | null>(null)
  const [isRepairingMessages, setIsRepairingMessages] = useState(false)
  const [messageRepairResult, setMessageRepairResult] = useState<{ conversationsFixed: number; queuedFixed: number; pendingRepliesFixed: number; queuedDelivered: number } | null>(null)
  const [isFixingPrizeMoney, setIsFixingPrizeMoney] = useState(false)
  const [prizeMoneyResult, setPrizeMoneyResult] = useState<{ racesFixed: number; oldTotal: number; newTotal: number; difference: number } | null>(null)
  const [isFixingEconomy, setIsFixingEconomy] = useState(false)
  const [economyResult, setEconomyResult] = useState<{ teamsUpdated: number; oldSeatCost: number; newSeatCost: number; oldSalary: number; newSalary: number; seatFeeDifference: number; message: string } | null>(null)
  const [isNormalizingCareerEconomy, setIsNormalizingCareerEconomy] = useState(false)
  const [careerEconomyNormalizeResult, setCareerEconomyNormalizeResult] = useState<{
    sponsorsAdjusted: number
    pendingOffersAdjusted: number
    sponsorsDeactivatedForSlotCap: number
    weeklyIncomeBefore: number
    weeklyIncomeAfter: number
    weeklyCap: number
    message: string
  } | null>(null)
  const [isUpgradingContracts, setIsUpgradingContracts] = useState(false)
  const [upgradeResult, setUpgradeResult] = useState<{ 
    contractsUpgraded: number
    sponsorsKept: number
    sponsorsRemoved: number
    removedNames: string[]
    message: string 
  } | null>(null)
  const [isReassigningPortraits, setIsReassigningPortraits] = useState(false)
  const [portraitResult, setPortraitResult] = useState<{ totalStaff: number; reassigned: number; duplicatesFixed: number; message: string } | null>(null)
  const [replaceContactIds, setReplaceContactIds] = useState<string[]>([])
  const [isReplacingContacts, setIsReplacingContacts] = useState(false)
  const [replaceResult, setReplaceResult] = useState<{ replaced: number; error?: string } | null>(null)
  const { addToast } = useToast()

  // Helper function to build and send rich career data to commentary system
  const sendCareerDataToCommentary = async () => {
    if (!isElectron || !player) return
    
    try {
      // Get last race from history
      const lastRace = player.raceHistory?.[player.raceHistory.length - 1]
      
      // Get current series standings
      const currentSeriesId = player.currentSeriesId || careerState?.seriesEntries?.[0]?.seriesId
      const standings = currentSeriesId ? getStandings(currentSeriesId) : []
      const playerStanding = standings.find(s => s.driverName === `${player.firstName} ${player.lastName}`)
      
      // Get full series info
      const currentSeriesInfo = currentSeriesId ? getSeriesById(currentSeriesId) : null
      const calendar = currentSeriesInfo?.calendar || []
      
      // Find championship leader and last race winner
      const sortedStandings = [...standings].sort((a, b) => b.points - a.points)
      const championshipLeader = sortedStandings.length > 0 ? sortedStandings[0] : null
      
      // Find actual last race winner from race history
      let lastRaceWinner = null
      if (lastRace && lastRace.racePosition === 1) {
        // Player won last race
        lastRaceWinner = { name: `${player.firstName} ${player.lastName}`, position: 1 }
      } else if (lastRace) {
        // Find who won the last race by checking standings for drivers with recent wins
        // This is approximate - ideally we'd track actual race winners
        const lastRaceStanding = sortedStandings.find(s => 
          s.wins > 0 && s.driverName !== `${player.firstName} ${player.lastName}`
        )
        if (lastRaceStanding) {
          lastRaceWinner = { name: lastRaceStanding.driverName, position: 1 }
        }
      }
      
      // ===== CALENDAR & SEASON DATA =====
      const currentRound = careerState?.currentRound || 0
      const totalRounds = calendar.length
      const currentWeek = careerState?.currentWeek || 1
      
      // Find next race
      const upcomingCalendarRaces = calendar
        .filter(event => event.week >= currentWeek)
        .sort((a, b) => a.week - b.week)
      const nextRace = upcomingCalendarRaces[0]
      
      // Get next 2-3 upcoming races
      const upcomingRaces = upcomingCalendarRaces.slice(0, 3).map(event => ({
        round: event.round,
        trackName: event.trackName,
        week: event.week
      }))
      
      // Get last 3 races from history
      const previousRaces = (player.raceHistory || []).slice(-3).map(race => ({
        trackName: race.trackName,
        position: race.racePosition,
        round: race.round || 0
      }))
      
      // ===== FULL CHAMPIONSHIP STANDINGS =====
      const playerIndex = playerStanding ? sortedStandings.findIndex(s => s.driverName === playerStanding.driverName) : -1
      const playerPosition = playerIndex >= 0 ? playerIndex + 1 : undefined
      const leaderPoints = championshipLeader?.points || 0
      
      const fullStandings = sortedStandings.slice(0, 10).map((s, index) => ({
        position: index + 1,
        name: s.driverName,
        teamName: s.teamName,
        points: s.points,
        wins: s.wins,
        gapToLeader: leaderPoints - s.points,
        isPlayer: s.driverName === `${player.firstName} ${player.lastName}`
      }))
      
      // Find driver ahead/behind in standings
      const driverAhead = playerIndex > 0 ? sortedStandings[playerIndex - 1] : null
      const driverBehind = playerIndex >= 0 && playerIndex < sortedStandings.length - 1 ? sortedStandings[playerIndex + 1] : null
      
      // ===== DRIVER NARRATIVES FOR TV BROADCAST COMMENTARY =====
      // Get ALL drivers in current series - no filtering! We need diverse commentary
      const allRivals = useRivalStore.getState().rivals
      const seriesDrivers = allRivals.filter(r => r.currentSeriesId === currentSeriesId)
      
      // Build compact narratives for ALL series drivers (for diverse commentary)
      // STRICT mode: only use Content Studio pre-generated narratives.
      const preGenReady = isPreGenContentLoaded()
      const driverNarrativesForCommentary = seriesDrivers
        .map((r) => {
          const n = preGenReady
            ? (getDriverNarrative(r.id) || getDriverNarrativeByName(r.firstName, r.lastName))
            : null
          return {
            name: `${r.firstName} ${r.lastName}`,
            nationality: r.nationality,
            age: r.age,
            teamId: r.currentTeamId,
            careerStage: r.careerStage,
            totalWins: r.totalWins,
            championships: r.championships,
            rivalryIntensity: r.rivalryIntensity,
            // Map pre-gen bundle fields to commentary fields
            biography: (n as any)?.biography as string | undefined,
            drivingStyle: (n as any)?.drivingStyle as string | undefined,
            rivalries: (n as any)?.rivalries as string[] | undefined,
            quirks: (n as any)?.quirks as string[] | undefined,
            nickname: (n as any)?.nickname as string | undefined,
            famousQuote: (n as any)?.famousQuote as string | undefined,
            careerHighlight: (n as any)?.careerHighlight as string | undefined,
            careerLowPoint: (n as any)?.careerLowPoint as string | undefined,
          }
        })
      
      // ===== TEAM NARRATIVES FOR TV BROADCAST COMMENTARY =====
      // Get ALL teams in current series for diverse team commentary
      const allTeams = useRivalStore.getState().teams || []
      // Ensure allTeams is an array (defensive check for corrupted/old save data)
      const teamsArray = Array.isArray(allTeams) ? allTeams : []
      const seriesTeams = teamsArray.filter(t => t.seriesId === currentSeriesId)
      
      const teamNarrativesForCommentary = seriesTeams
        .map((t) => {
          const n = preGenReady ? (getTeamNarrative(t.id) || getTeamNarrativeByName(t.name)) : null
          return {
            teamId: t.id,
            name: t.name,
            shortName: t.shortName,
            // Map pre-gen bundle fields (origin, philosophy, achievements, teamPrincipal, keyFigures, headquarters, reputation, fanBase)
            origin: (n as any)?.origin as string | undefined,
            philosophy: (n as any)?.philosophy as string | undefined,
            achievements: ((n as any)?.achievements as string[] | undefined)?.slice(0, 3),
            teamPrincipal: (n as any)?.teamPrincipal as string | undefined,
            headquarters: (n as any)?.headquarters as string | undefined,
            reputation: (n as any)?.reputation as string | undefined,
            fanBase: (n as any)?.fanBase as string | undefined,
          }
        })
      
      // Calculate title fight status
      const pointsGapToLeader = playerStanding ? leaderPoints - playerStanding.points : 0
      const racesRemaining = totalRounds - currentRound
      const maxPointsRemaining = racesRemaining * 25 // Assuming 25 points per win
      let titleFightStatus: 'dominant_lead' | 'comfortable' | 'close_battle' | 'must_win' | 'out_of_contention' = 'close_battle'
      
      if (playerPosition === 1) {
        if (pointsGapToLeader === 0 && driverBehind && (playerStanding?.points || 0) - driverBehind.points > maxPointsRemaining) {
          titleFightStatus = 'dominant_lead'
        } else if (driverBehind && (playerStanding?.points || 0) - driverBehind.points > maxPointsRemaining * 0.5) {
          titleFightStatus = 'comfortable'
        } else {
          titleFightStatus = 'close_battle'
        }
      } else {
        if (pointsGapToLeader > maxPointsRemaining) {
          titleFightStatus = 'out_of_contention'
        } else if (pointsGapToLeader > maxPointsRemaining * 0.7) {
          titleFightStatus = 'must_win'
        } else {
          titleFightStatus = 'close_battle'
        }
      }
      
      // ===== SEASON FORM =====
      const thisSeasonRaces = (player.raceHistory || []).filter(r => new Date(r.date).getFullYear() === careerState?.currentYear)
      const seasonPodiums = thisSeasonRaces.filter(r => r.racePosition <= 3).length
      const seasonDNFs = thisSeasonRaces.filter(r => r.racePosition === 0 || r.dnf).length
      const finishedRaces = thisSeasonRaces.filter(r => r.racePosition > 0 && !r.dnf)
      const seasonAvgFinish = finishedRaces.length > 0 
        ? finishedRaces.reduce((sum, r) => sum + r.racePosition, 0) / finishedRaces.length 
        : 0
      const seasonBestFinish = finishedRaces.length > 0 
        ? Math.min(...finishedRaces.map(r => r.racePosition)) 
        : 0
      
      // Calculate current streak from race history
      let currentStreak = ''
      if (player.raceHistory && player.raceHistory.length > 0) {
        const recentRaces = player.raceHistory.slice(-5)
        const consecutivePodiums = recentRaces.filter(r => r.racePosition <= 3).length
        const consecutiveWins = recentRaces.filter(r => r.racePosition === 1).length
        const consecutivePointsFinishes = recentRaces.filter(r => r.racePosition <= 10).length
        
        if (consecutiveWins >= 2) {
          currentStreak = `${consecutiveWins} wins in a row!`
        } else if (consecutivePodiums >= 3) {
          currentStreak = `${consecutivePodiums} podiums in last 5 races`
        } else if (consecutivePointsFinishes >= 4) {
          currentStreak = `Consistent points finisher - ${consecutivePointsFinishes}/5 in points`
        } else if (recentRaces.length > 0) {
          const avgPosition = recentRaces.reduce((sum, r) => sum + r.racePosition, 0) / recentRaces.length
          currentStreak = avgPosition <= 5 ? 'Strong recent form' : avgPosition <= 10 ? 'Building momentum' : 'Looking to bounce back'
        }
      }
      
      // Get team info (defensive check for corrupted save data)
      const teamsForLookup = useRivalStore.getState().teams || []
      const currentTeam = player.currentTeamId && Array.isArray(teamsForLookup) ? 
        teamsForLookup.find(t => t.id === player.currentTeamId) : null
      
      // Find rival in standings (defensive check)
      const rivalsArray = useRivalStore.getState().rivals || []
      const rivalStanding = Array.isArray(rivalsArray) ? standings.find(s => 
        rivalsArray.some(r => `${r.firstName} ${r.lastName}` === s.driverName && r.careerActive)
      ) : null
      
      // Check contract status for pressure theme
      const contractRacesLeft = player.contract?.endYear 
        ? (player.contract.endYear - (useCareerStore.getState().careerState?.currentYear || 2024)) * 12 
        : undefined
      const hasContractPressure = contractRacesLeft !== undefined && contractRacesLeft <= 6

      const worldSnapshot = buildCommentaryWorldSnapshot({
        seriesId: currentSeriesId,
        seriesName: currentSeriesInfo?.name,
        currentRound,
        totalRounds,
        racesRemaining,
        titleFightStatus,
        standings: sortedStandings.map((s, index) => ({
          position: index + 1,
          driverName: s.driverName,
          teamName: s.teamName,
          points: s.points,
          wins: s.wins,
          avgFinish: s.avgFinish,
        })),
        teams: seriesTeams.map((t) => ({
          id: t.id,
          name: t.name,
          shortName: t.shortName,
          narrative: {
            recentForm: t.narrative?.recentForm,
          },
        })),
        drivers: seriesDrivers.map((r) => ({
          id: r.id,
          firstName: r.firstName,
          lastName: r.lastName,
          currentTeamId: r.currentTeamId,
          currentTeamName: seriesTeams.find((t) => t.id === r.currentTeamId)?.name,
          totalWins: r.totalWins,
          rivalryIntensity: r.rivalryIntensity,
          narrative: {
            recentForm: r.narrative?.recentForm,
          },
        })),
        sponsorDeals: player.finances?.sponsorDeals || [],
        ownedTeam: careerState?.ownedTeam ? {
          boardMood: careerState.ownedTeam.boardMood,
          budgets: {
            runwayWeeks: careerState.ownedTeam.budgets?.runwayWeeks,
          },
        } : undefined,
      })
      
      // Build rich career data for 8-Theme System
      const careerData = {
        playerName: `${player.firstName} ${player.lastName}`.replace(/\s+/g, ' ').trim(),
        teamName: currentTeam?.name || player.contract?.teamName || careerState?.ownedTeam?.name,
        
        // Championship data
        championshipPosition: playerPosition,
        championshipPoints: playerStanding?.points ?? undefined,
        
        // Career stats
        totalWins: player.totalWins,
        totalPodiums: player.totalPodiums,
        totalRaces: player.totalRaces,
        seasonWins: playerStanding?.wins || 0,
        reputation: careerState?.ownedTeam?.reputation ?? player.reputation,
        
        // Background info (8-Theme: CAREER)
        scenarioName: player.background?.scenarioId || player.scenario,
        age: player.age,
        nationality: player.nationality,
        experienceLevel: player.totalRaces < 10 ? 'Rookie' : player.totalRaces < 30 ? 'Sophomore' : 'Veteran',
        isRookie: player.totalRaces < 12, // Assume 12 races is a rookie season
        
        // Historical context (8-Theme: STANDINGS)
        lastRaceResult: lastRace?.racePosition,
        lastTrackName: lastRace?.trackName,
        currentStreak,
        
        // Rivalry context (8-Theme: RIVALRY)
        rivalName: rivalStanding?.driverName ?? undefined,
        // rivalPosition will be set live from telemetry
        
        // Other drivers context
        championshipLeader: championshipLeader && championshipLeader.driverName !== `${player.firstName} ${player.lastName}` 
          ? championshipLeader.driverName : undefined,
        championshipLeaderPosition: undefined, // Set live from telemetry
        lastRaceWinner: lastRaceWinner?.name ?? undefined,
        lastRaceWinnerPosition: undefined, // Set live from telemetry
        
        // Psychology context (8-Theme: PSYCHOLOGY)
        contractPressure: hasContractPressure,
        
        // Track history (8-Theme: TRACK_HISTORY) - will be populated per-track from live telemetry
        // See buildTrackHistoryContext function for how this is used
        allTrackHistory: player.trackHistory || {},
        
        // GOAT Progress (8-Theme: RECORD_CHASING)
        goatTier: player.goatProgress?.currentTier,
        goatTierProgress: player.goatProgress?.tierProgress,
        nextGoatTier: player.goatProgress?.currentTier 
          ? getNextTierInfo(player.goatProgress.currentTier)?.nextTierName 
          : undefined,
        
        // Records near breaking (filtered to ones within reach)
        recordsNearBreaking: getRecordsNearBreaking(
          player.goatProgress,
          {
            totalWins: player.totalWins,
            totalPodiums: player.totalPodiums,
            totalPoles: player.totalPoles,
            totalFastestLaps: player.totalFastestLaps,
            championships: player.championships,
            totalRaces: player.totalRaces
          },
          10 // Within 10 of breaking
        ),
        
        // Triple crown progress
        tripleCrownProgress: getTripleCrownProgress(player.goatProgress),
        
        // Check if winning the next race would break any record
        recordBreakingMoment: checkIfWinBreaksRecord(
          player.goatProgress,
          { totalWins: player.totalWins, championships: player.championships }
        ),
        
        // Recently unlocked milestones (from this session)
        recentMilestones: player.goatProgress?.newlyUnlocked || [],
        
        // ===== NEW: MEDIA PERSONA & SOCIAL (Theme 11 Extended) =====
        mediaPersona: careerState?.mediaPersona?.dominantTone || 'unknown',
        mediaPersonaLevel: careerState?.mediaPersona?.personaLevel || 'unknown',
        controversyLevel: careerState?.mediaPersona?.controversyLevel || 0,
        publicPerception: careerState?.mediaPersona?.publicPerception || 50,
        
        // Actual press clippings (last 3 for AI to reference)
        recentPressClippings: (careerState?.pressClippings || [])
          .slice(-3)
          .map(clip => ({
            headline: clip.headline,
            sentiment: clip.sentiment,
            outlet: clip.outlet
          })),
        recentHeadline: careerState?.pressClippings?.slice(-1)[0]?.headline,
        
        // Social media stats
        mediaFollowerCount: careerState?.socialMediaState?.followerCount || 0,
        isVerifiedSocialMedia: careerState?.socialMediaState?.verifiedStatus || false,
        viralPostCount: careerState?.socialMediaState?.viralPosts || 0,
        
        // ===== NEW: EXTENDED ACHIEVEMENT STATS (Theme 12) =====
        consecutiveWins: player.consecutiveWins || 0,
        consecutivePodiums: player.consecutivePodiums || 0,
        consecutivePoints: player.consecutivePoints || 0,
        comebackWins: player.comebackWins || 0,
        hatTricks: player.hatTricks || 0,
        grandSlams: player.grandSlams || 0,
        totalFastestLaps: player.totalFastestLaps || 0,
        perfectSeasons: player.perfectSeasons || 0,
        dnfFreeSeasons: player.dnfFreeSeasons || 0,
        
        // ===== NEW: CONTRACT & TEAM DYNAMICS (Theme 13) =====
        teamSatisfaction: player.contract?.teamSatisfaction,
        teamSatisfactionStatus: getTeamSatisfactionStatus(player.contract?.teamSatisfaction),
        teamWarningIssued: player.contract?.warningIssued || false,
        teamFinalWarningIssued: player.contract?.finalWarningIssued || false,
        contractTargetsMet: player.contract?.targets?.filter(t => t.met).length || 0,
        contractTargetsTotal: player.contract?.targets?.length || 0,
        contractEndingSoon: player.contract?.endYear 
          ? (player.contract.endYear - (careerState?.currentYear || 2024)) <= 1
          : false,
        
        // ===== NEW: SPONSOR SATISFACTION (Theme 14) =====
        ...getSponsorSatisfactionData(player.finances?.sponsorDeals),
        
        // ===== CALENDAR & SEASON PROGRESS =====
        currentRound,
        totalRounds,
        seasonProgress: totalRounds > 0 ? Math.round((currentRound / totalRounds) * 100) : 0,
        nextRaceTrack: nextRace?.trackName,
        nextRaceWeek: nextRace?.week,
        upcomingRaces,
        previousRaces,
        isSeasonOpener: currentRound === 1,
        isSeasonFinale: currentRound === totalRounds,
        racesRemaining,
        
        // ===== FULL CHAMPIONSHIP STANDINGS =====
        fullStandings,
        pointsGapToLeader,
        pointsGapToAhead: driverAhead ? driverAhead.points - (playerStanding?.points || 0) : 0,
        pointsGapToBehind: driverBehind ? (playerStanding?.points || 0) - driverBehind.points : 0,
        driverAheadInStandings: driverAhead?.driverName ?? undefined,
        driverBehindInStandings: driverBehind?.driverName ?? undefined,
        titleFightStatus,
        mathematicallyAlive: pointsGapToLeader <= maxPointsRemaining,
        maxPointsRemaining,
        pointsNeededForTitle: pointsGapToLeader + 1, // Need 1 more than leader
        
        // ===== SERIES/CHAMPIONSHIP INFO =====
        seriesName: currentSeriesInfo?.name,
        seriesShortName: currentSeriesInfo?.shortName,
        seriesTier: currentSeriesInfo?.tier as 'factory' | 'pro' | 'semi-pro' | 'amateur' | 'historic' | undefined,
        seriesCategory: currentSeriesInfo?.category,
        seriesPrestige: currentSeriesInfo?.prestige,
        isMultiClass: currentSeriesInfo?.multiClass,
        worldSnapshot,
        commentaryDataSource: 'content_studio' as const,
        
        // ===== TV BROADCAST: DRIVER NARRATIVES FOR COLORFUL COMMENTARY =====
        // Rich backstories, driving styles, anecdotes for ALL drivers in series
        driverNarratives: driverNarrativesForCommentary,
        
        // ===== TV BROADCAST: TEAM NARRATIVES FOR COLORFUL COMMENTARY =====
        // Rich team backgrounds for diverse team commentary
        teamNarratives: teamNarrativesForCommentary,
        
        // ===== SEASON FORM =====
        seasonPodiums,
        seasonPoles: playerStanding?.poles || 0,
        seasonFastestLaps: playerStanding?.fastestLaps || 0,
        seasonDNFs,
        seasonAvgFinish: Math.round(seasonAvgFinish * 10) / 10, // Round to 1 decimal
        seasonBestFinish,
        racesCompletedThisSeason: thisSeasonRaces.length,
      }
      
      console.log('[Settings] Sending rich career data to commentary:', careerData)
      await window.electron?.setCommentaryCareerData?.(careerData)
    } catch (err) {
      console.error('[Settings] Failed to send career data to commentary:', err)
    }
  }

  // Listen for telemetry status updates
  useEffect(() => {
    if (!isElectron) return

    const handleHeartbeat = (status: TelemetryStatus) => {
      setTelemetryStatus(status)
    }
    
    const handleSession = (data: any) => {
      setLiveSession(data)
      setUpdateCount(prev => prev + 1)
      setLastUpdateTime(new Date())
    }
    
    const handleParticipants = (data: any) => {
      // Data comes as an array directly, or as object with participants key
      const participants = Array.isArray(data) ? data : data?.participants || []
      if (participants.length > 0) {
        setLiveParticipants(participants.slice(0, 10)) // Only show first 10
      }
    }

    try {
      window.electron?.on?.('telemetry:heartbeat', handleHeartbeat)
      window.electron?.on?.('telemetry:session', handleSession)
      window.electron?.on?.('telemetry:participants', handleParticipants)
      
      // Check initial status
      checkTelemetryStatus()

      return () => {
        // Cleanup IPC listeners to prevent memory leaks
        if (window.electron?.removeListener) {
          window.electron?.removeListener?.('telemetry:heartbeat', handleHeartbeat)
          window.electron?.removeListener?.('telemetry:session', handleSession)
          window.electron?.removeListener?.('telemetry:participants', handleParticipants)
        }
      }
    } catch (err) {
      console.error('Failed to setup telemetry listener:', err)
    }
  }, [])

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (isElectron && settings.autoConnect && !telemetryStatus.listening) {
      handleConnectTelemetry()
    }
  }, [])

  const checkTelemetryStatus = async () => {
    if (!isElectron) return
    try {
      const status = await window.electron?.invoke('telemetry:status') as any
      if (status) {
        setTelemetryStatus(prev => ({ ...prev, listening: status.isListening }))
      }
    } catch (err) {
      console.error('Failed to check telemetry status:', err)
    }
  }

  const handleConnectTelemetry = async () => {
    if (!isElectron) {
      console.log('Electron not available - telemetry disabled')
      return
    }
    setIsConnecting(true)
    try {
      await window.electron?.invoke('telemetry:start')
      setTelemetryStatus(prev => ({ ...prev, listening: true }))
    } catch (err) {
      console.error('Failed to start telemetry:', err)
    }
    setIsConnecting(false)
  }

  const handleDisconnectTelemetry = async () => {
    if (!isElectron) return
    try {
      await window.electron?.invoke('telemetry:stop')
      setTelemetryStatus({ listening: false, receiving: false, lastPacket: 0, participantCount: 0 })
    } catch (err) {
      console.error('Failed to stop telemetry:', err)
    }
  }

  const handleLaunchAMS2 = async () => {
    if (!isElectron) {
      console.log('Electron not available - cannot launch AMS2')
      return
    }
    setIsLaunching(true)
    try {
      // Pass noVR option based on settings
      await window.electron?.invoke('ams2:launch', settings.gamePath, { noVR: settings.disableVR })
      console.log('Launching AMS2 with VR:', settings.disableVR ? 'disabled' : 'enabled')
    } catch (err) {
      console.error('Failed to launch AMS2:', err)
    }
    setTimeout(() => setIsLaunching(false), 3000)
  }

  const handleBrowsePath = async () => {
    if (!isElectron) {
      console.log('Electron not available - cannot open dialog')
      return
    }
    try {
      const result = await window.electron?.invoke('dialog:openDirectory') as any
      if (result && !result.canceled && result.filePaths?.[0]) {
        setSettings(prev => ({ ...prev, gamePath: result.filePaths[0] }))
        validatePath(result.filePaths[0])
      }
    } catch (err) {
      console.error('Failed to open directory dialog:', err)
    }
  }

  const validatePath = async (path: string) => {
    if (!isElectron) {
      setPathValid(null)
      return
    }
    try {
      const valid = await window.electron?.invoke('ams2:validatePath', path) as any
      setPathValid(valid ?? false)
    } catch (err) {
      setPathValid(false)
    }
  }

  const handleSaveSettings = () => {
    localStorage.setItem('ams2-settings', JSON.stringify(settings))
    setSaveMessage('Settings saved!')
    setTimeout(() => setSaveMessage(''), 2000)
    
    // Also show save toast
    addToast({
      type: 'save',
      title: 'Settings Saved',
      message: 'Your preferences have been saved.',
      duration: 2000
    })
  }
  
  // Commentary handlers
  const handleSaveCommentary = async () => {
    const keyPool = getGeminiKeyPool()
    const payload: CommentarySettings = {
      ...commentary,
      geminiKeys: keyPool,
      geminiKey: commentary.geminiKey || keyPool[0] || '',
    }
    // ALWAYS save to localStorage first
    localStorage.setItem('commentary-settings', JSON.stringify(payload))
    setCommentary(payload)
    console.log('[Settings] Saved commentary settings to localStorage:', payload)
    
    if (isElectron) {
      try {
        // Configure the commentary system with both voices
        await window.electron?.setCommentaryAPIKeys?.(payload.geminiKey, payload.elevenLabsKey)
        await window.electron?.setCommentaryVoices?.(
          payload.voiceId, 
          payload.coCommentatorVoiceId, 
          payload.volume
        )
        // Set pit reporter voice if configured
        if (payload.pitReporterVoiceId) {
          await window.electron?.setPitReporterVoice?.(payload.pitReporterVoiceId)
        }
        await window.electron?.setCommentaryEnabled?.(payload.enabled)
        
        // Send rich career data to commentary system for narrative context
        if (payload.enabled) {
          await sendCareerDataToCommentary()
        }
        
        addToast({
          type: 'success',
          title: 'Commentary Settings Saved',
          message: commentary.enabled ? 'Dual commentary team is ready!' : 'Settings saved.',
          duration: 3000
        })
      } catch (err) {
        console.error('Failed to configure commentary:', err)
        addToast({
          type: 'error',
          title: 'Configuration Error',
          message: 'Failed to configure commentary system.',
          duration: 4000
        })
      }
    } else {
      // Still show success for non-electron (settings saved to localStorage)
      addToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Commentary settings saved locally.',
        duration: 2000
      })
    }
  }
  
  const handleTestCommentary = async () => {
    if (!isElectron || !commentary.geminiKey || !commentary.elevenLabsKey) {
      addToast({
        type: 'warning',
        title: 'Missing API Keys',
        message: 'Please enter both Gemini and ElevenLabs API keys.',
        duration: 4000
      })
      return
    }
    
    setIsTesting(true)
    setCommentaryStatus('testing')
    
    try {
      // First configure keys and voices
      await window.electron?.setCommentaryAPIKeys?.(commentary.geminiKey, commentary.elevenLabsKey)
      await window.electron?.setCommentaryVoices?.(
        commentary.voiceId, 
        commentary.coCommentatorVoiceId, 
        commentary.volume
      )
      await window.electron?.setCommentaryEnabled?.(true)
      
      // Test connection
      const result = await window.electron?.testCommentaryConnection?.(commentary.elevenLabsKey) as any
      
      if (result?.success) {
        setCommentaryStatus('success')
        addToast({
          type: 'success',
          title: 'Connection Successful!',
          message: 'Commentary system is ready. Try a test event!',
          duration: 4000
        })
        
        // Trigger a test event
        await window.electron?.testCommentaryEvent?.('OVERTAKE')
      } else {
        setCommentaryStatus('error')
        addToast({
          type: 'error',
          title: 'Connection Failed',
          message: 'Could not connect to ElevenLabs. Check your API key.',
          duration: 4000
        })
      }
    } catch (err) {
      console.error('Test failed:', err)
      setCommentaryStatus('error')
    } finally {
      setIsTesting(false)
    }
  }
  
  // Listen for commentary scripts
  useEffect(() => {
    if (!isElectron) return
    
    const handleScript = (data: any) => {
      if (data?.script) {
        // Handle lead vs co-commentator
        if (data.speaker === 'co') {
          setLastCoCommentaryScript(data.script)
        } else {
          setLastCommentaryScript(data.script)
        }
      }
    }
    
    window.electron?.onCommentaryScript?.(handleScript)
    
    // Load commentary settings on mount
    if (commentary.enabled && commentary.geminiKey && commentary.elevenLabsKey) {
      window.electron?.setCommentaryAPIKeys?.(commentary.geminiKey, commentary.elevenLabsKey)
      window.electron?.setCommentaryVoices?.(commentary.voiceId, commentary.coCommentatorVoiceId, commentary.volume)
      // Set pit reporter voice if configured
      if (commentary.pitReporterVoiceId) {
        window.electron?.setPitReporterVoice?.(commentary.pitReporterVoiceId)
      }
      window.electron?.setCommentaryEnabled?.(true)
      // Send rich career data for narrative context
      sendCareerDataToCommentary()
    }
    
    // Load audio devices
    loadAudioDevices()
  }, [])
  
  const loadAudioDevices = async () => {
    if (!isElectron) return
    setIsLoadingDevices(true)
    try {
      const result = await window.electron?.getCommentaryAudioDevices?.() as any
      if (result?.success && result.devices) {
        setAudioDevices(result.devices)
      }
    } catch (err) {
      console.error('Failed to load audio devices:', err)
    } finally {
      setIsLoadingDevices(false)
    }
  }
  
  const handleTestAudio = async () => {
    if (!isElectron) return
    setIsTestingAudio(true)
    try {
      const result = await window.electron?.testCommentaryAudio?.() as any
      if (result?.success) {
        addToast({
          type: 'success',
          title: 'Audio Test',
          message: 'You should hear a beep!',
          duration: 2000
        })
      } else {
        addToast({
          type: 'error',
          title: 'Audio Test Failed',
          message: 'Could not play test audio.',
          duration: 3000
        })
      }
    } catch (err) {
      console.error('Audio test failed:', err)
    } finally {
      setIsTestingAudio(false)
    }
  }
  
  const handleAudioDeviceChange = async (deviceId: string) => {
    setCommentary(prev => ({ ...prev, audioDeviceId: deviceId }))
    if (isElectron) {
      await window.electron?.setCommentaryAudioDevice?.(deviceId)
    }
  }
  
  const handleTestBanter = async () => {
    if (!isElectron || !commentary.geminiKey || !commentary.elevenLabsKey) {
      addToast({
        type: 'warning',
        title: 'Missing API Keys',
        message: 'Please enter both Gemini and ElevenLabs API keys.',
        duration: 4000
      })
      return
    }
    
    setIsTestingBanter(true)
    setLastCommentaryScript('')
    setLastCoCommentaryScript('')
    
    try {
      addToast({
        type: 'info',
        title: 'Testing Banter...',
        message: 'Generating commentary dialogue between Vicky & Ryan!',
        duration: 3000
      })
      
      const result = await window.electron?.testCommentaryBanter?.(
        commentary.geminiKey,
        commentary.elevenLabsKey,
        commentary.voiceId,
        commentary.coCommentatorVoiceId
      ) as any
      
      if (result?.success) {
        if (result.leadScript) setLastCommentaryScript(result.leadScript)
        if (result.coScript) setLastCoCommentaryScript(result.coScript)
        
        addToast({
          type: 'success',
          title: 'Banter Test Complete!',
          message: 'Both commentators should have spoken!',
          duration: 4000
        })
      } else {
        addToast({
          type: 'error',
          title: 'Banter Test Failed',
          message: result?.error || 'Could not generate banter.',
          duration: 4000
        })
      }
    } catch (err) {
      console.error('Banter test failed:', err)
      addToast({
        type: 'error',
        title: 'Test Error',
        message: 'Something went wrong during the banter test.',
        duration: 4000
      })
    } finally {
      setIsTestingBanter(false)
    }
  }

  // Test streaming TTS with latency measurement
  const handleTestStreaming = async () => {
    if (!isElectron || !commentary.elevenLabsKey) {
      addToast({
        type: 'warning',
        title: 'Missing API Key',
        message: 'Please enter your ElevenLabs API key.',
        duration: 4000
      })
      return
    }
    
    setIsTestingStreaming(true)
    setStreamingLatency(null)
    setLastCommentaryScript('')
    
    try {
      addToast({
        type: 'info',
        title: 'Testing Streaming TTS ⚡',
        message: 'Measuring latency with streaming audio...',
        duration: 3000
      })
      
      // Initialize and start the streaming audio session BEFORE triggering the test
      // This sets up the Web Audio context and enables chunk playback
      initStreamingAudio()
      setStreamingVoiceBoost(commentary.voiceId) // Apply Crofty volume boost for streaming
      startStreamingSession()
      
      const result = await window.electron?.testCommentaryStreaming?.(
        commentary.geminiKey || '',
        commentary.elevenLabsKey,
        commentary.voiceId,
        commentary.coCommentatorVoiceId
      )
      
      if (result?.success) {
        if (result.script) setLastCommentaryScript(result.script)
        setStreamingLatency({
          firstChunkMs: result.firstChunkMs || 0,
          totalMs: result.totalMs || 0
        })
        
        addToast({
          type: 'success',
          title: `Streaming Test Complete! ⚡`,
          message: `First audio in ${result.firstChunkMs}ms! (Total: ${result.totalMs}ms)`,
          duration: 6000
        })
      } else {
        addToast({
          type: 'error',
          title: 'Streaming Test Failed',
          message: result?.error || 'Could not stream audio.',
          duration: 4000
        })
      }
    } catch (err) {
      console.error('Streaming test failed:', err)
      addToast({
        type: 'error',
        title: 'Test Error',
        message: 'Something went wrong during the streaming test.',
        duration: 4000
      })
    } finally {
      setIsTestingStreaming(false)
    }
  }

  const handleTestQueueSequence = async () => {
    if (!isElectron || !commentary.geminiKey || !commentary.elevenLabsKey) {
      addToast({
        type: 'warning',
        title: 'Missing API Keys',
        message: 'Please enter both Gemini and ElevenLabs API keys.',
        duration: 4000
      })
      return
    }
    
    setIsTestingQueue(true)
    
    try {
      addToast({
        type: 'info',
        title: 'Testing Queue Sequence...',
        message: 'Firing 5 events through the priority queue system!',
        duration: 5000
      })
      
      const result = await window.electron?.testCommentaryQueueSequence?.(
        commentary.geminiKey,
        commentary.elevenLabsKey,
        commentary.voiceId,
        commentary.coCommentatorVoiceId
      )
      
      if (result?.success) {
        addToast({
          type: 'success',
          title: 'Queue Test Started!',
          message: `${result.message} Check console for processing order.`,
          duration: 6000
        })
      } else {
        addToast({
          type: 'error',
          title: 'Queue Test Failed',
          message: result?.error || 'Could not start queue sequence.',
          duration: 4000
        })
      }
    } catch (err) {
      console.error('Queue sequence test failed:', err)
      addToast({
        type: 'error',
        title: 'Test Error',
        message: 'Something went wrong during the queue test.',
        duration: 4000
      })
    } finally {
      setIsTestingQueue(false)
    }
  }

  // Test TV Broadcast Commentary - Simulates 2 minutes of continuous commentary
  const handleTestBroadcast = async () => {
    if (!isElectron || !commentary.geminiKey || !commentary.elevenLabsKey) {
      addToast({
        type: 'warning',
        title: 'Missing API Keys',
        message: 'Please enter both Gemini and ElevenLabs API keys.',
        duration: 4000
      })
      return
    }
    
    setIsTestingBroadcast(true)
    setBroadcastTestProgress({ elapsed: 0, total: 60 })
    
    const TEST_DURATION_MS = 60000 // 1 minute (reduced - uses streaming which is fast)
    const startTime = Date.now()
    
    try {
      addToast({
        type: 'info',
        title: 'TV Broadcast Test Starting',
        message: 'Using streaming system - generating live commentary...',
        duration: 3000
      })
      
      // Initialize streaming audio for playback
      initStreamingAudio()
      setStreamingVoiceBoost(commentary.voiceId)
      startStreamingSession()
      
      // Progress updater
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime
        setBroadcastTestProgress({ elapsed: Math.floor(elapsed / 1000), total: 60 })
        if (elapsed >= TEST_DURATION_MS) {
          clearInterval(progressInterval)
        }
      }, 1000)
      
      // Use the SAME streaming system that works perfectly
      // Run multiple streaming tests with different TV broadcast scenarios
      const scenarios = [
        { delay: 0, scenario: 'race_start', description: 'Race Start' },
        { delay: 12000, scenario: 'battle', description: 'Gap Closing Battle' },
        { delay: 24000, scenario: 'overtake', description: 'Overtake Move' },
        { delay: 36000, scenario: 'final_laps', description: 'Final Laps Drama' },
        { delay: 48000, scenario: 'podium', description: 'Podium Finish' },
      ]
      
      for (const { delay, scenario, description } of scenarios) {
        // Wait for the scheduled time
        const waitTime = delay - (Date.now() - startTime)
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
        
        // Check if test was cancelled
        if (Date.now() - startTime >= TEST_DURATION_MS) break
        
        // Run streaming test with specific TV broadcast scenario
        console.log(`[BroadcastTest] Running scenario: ${description}`)
        addToast({
          type: 'info',
          title: description,
          message: 'Generating commentary...',
          duration: 3000
        })
        
        await window.electron?.testCommentaryStreaming?.(
          commentary.geminiKey,
          commentary.elevenLabsKey,
          commentary.voiceId,
          commentary.coCommentatorVoiceId,
          scenario // Pass the specific scenario type
        )
      }
      
      // Wait for remaining time
      const remaining = TEST_DURATION_MS - (Date.now() - startTime)
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining))
      }
      
      // Cleanup
      clearInterval(progressInterval)
      stopStreamingSession()
      
      addToast({
        type: 'success',
        title: 'Broadcast Test Complete',
        message: 'The 2-minute TV broadcast simulation has finished!',
        duration: 4000
      })
      
    } catch (err) {
      console.error('Broadcast test failed:', err)
      addToast({
        type: 'error',
        title: 'Test Error',
        message: 'Something went wrong during the broadcast test.',
        duration: 4000
      })
      
      // Cleanup on error
      await window.electron?.stopScheduler?.()
      await window.electron?.clearContentPool?.()
      
    } finally {
      setIsTestingBroadcast(false)
      setBroadcastTestProgress(null)
    }
  }

  // Regenerate narratives for existing career
  const handleRegenerateNarratives = async () => {
    if (!isElectron || !commentary.geminiKey) {
      addToast({
        type: 'warning',
        title: 'Missing API Key',
        message: 'Please enter your Gemini API key to generate narratives.',
        duration: 4000
      })
      return
    }
    
    if (!hasActiveCareer) {
      addToast({
        type: 'warning',
        title: 'No Active Career',
        message: 'Start a career first to generate driver narratives.',
        duration: 4000
      })
      return
    }
    
    setIsRegeneratingNarratives(true)
    setNarrativeProgress({ series: 'Starting...', progress: 0 })
    
    try {
      addToast({
        type: 'info',
        title: 'Generating Narratives',
        message: 'Building rich backstories for TV Broadcast commentary...',
        duration: 5000
      })
      
      // Call the migration function from rivalStore with progress callback
      await migrateNarrativesForAllSeries(
        commentary.geminiKey,
        (seriesName: string, progress: number) => {
          setNarrativeProgress({
            series: seriesName,
            progress: isNaN(progress) ? 0 : progress
          })
        }
      )
      
      addToast({
        type: 'success',
        title: 'Narratives Generated!',
        message: 'Your career now has rich backstories for TV Broadcast commentary.',
        duration: 5000
      })
      
    } catch (error) {
      console.error('[Settings] Narrative generation failed:', error)
      addToast({
        type: 'error',
        title: 'Generation Failed',
        message: error instanceof Error ? error.message : 'Failed to generate narratives',
        duration: 5000
      })
    } finally {
      setIsRegeneratingNarratives(false)
      setNarrativeProgress(null)
    }
  }

  // Handle team narrative generation for existing careers (BACKGROUND)
  const handleRegenerateTeamNarratives = () => {
    if (!isElectron || !commentary.geminiKey) {
      addToast({
        type: 'warning',
        title: 'Missing API Key',
        message: 'Please enter your Gemini API key to generate team narratives.',
        duration: 4000
      })
      return
    }
    
    if (!hasActiveCareer) {
      addToast({
        type: 'warning',
        title: 'No Active Career',
        message: 'Start a career first to generate team narratives.',
        duration: 4000
      })
      return
    }
    
    // Start background generation (persists across navigation!)
    startBackgroundTeamNarrativeGeneration(commentary.geminiKey)
    
    addToast({
      type: 'info',
      title: 'Team Narratives Generating',
      message: 'Building backstories in background - you can navigate away!',
      duration: 5000
    })
  }

  // Handle series data migration (points systems and commentary profiles)
  const handleMigrateSeriesData = () => {
    if (!hasActiveCareer) {
      addToast({
        type: 'warning',
        title: 'No Active Career',
        message: 'Start a career first to update series data.',
        duration: 4000
      })
      return
    }
    
    try {
      const result = migrateSeriesData()
      
      // Also recalculate existing contract targets to match the new point system
      const contractResult = useCareerStore.getState().recalculateContractTargets()
      
      // Recalculate championship standings for the player's current series
      const storeState = useCareerStore.getState()
      const playerSeriesId = storeState.player?.currentSeriesId || storeState.careerState?.seriesEntries?.[0]?.seriesId
      let standingsRecalculated = false
      if (playerSeriesId) {
        const standingsResult = useRivalStore.getState().recalculateStandingsWithNewPoints(playerSeriesId)
        standingsRecalculated = standingsResult.success
        if (standingsResult.success && standingsResult.oldLeaderPoints !== standingsResult.newLeaderPoints) {
          console.log(`[Settings] Standings recalculated: leader ${standingsResult.oldLeaderPoints} → ${standingsResult.newLeaderPoints} pts`)
        }
      }
      
      addToast({
        type: 'success',
        title: 'Series Data Updated',
        message: `${result.seriesUpdated} series updated with authentic points systems and commentary profiles.`,
        duration: 6000
      })
      
      // Show standings update info
      if (standingsRecalculated) {
        setTimeout(() => {
          addToast({
            type: 'info',
            title: 'Standings Recalculated',
            message: 'Championship standings have been recalculated using the correct point system for your series.',
            duration: 6000
          })
        }, 500)
      }
      
      // Show contract update info if targets were recalculated
      if (contractResult.newPointsTarget && contractResult.oldPointsTarget !== contractResult.newPointsTarget) {
        setTimeout(() => {
          addToast({
            type: 'info',
            title: 'Contract Updated',
            message: contractResult.message,
            duration: 8000
          })
        }, 1000)
      }
      
      // Show detailed info in a second toast
      if (result.seriesUpdated > 0) {
        setTimeout(() => {
          addToast({
            type: 'info',
            title: 'What Changed',
            message: 'Future races will use series-specific points (Stock Car ≠ GT3 ≠ F1). Commentary will use appropriate terminology.',
            duration: 8000
          })
        }, 2000)
      }
    } catch (error) {
      console.error('[Settings] Series data migration failed:', error)
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: error instanceof Error ? error.message : 'Failed to update series data',
        duration: 5000
      })
    }
  }

  const handleGenerateCareerXML = async () => {
    const resolvedSeriesId = player?.currentSeriesId || careerState?.seriesEntries?.[0]?.seriesId
    if (!isElectron || !resolvedSeriesId) {
      addToast({
        type: 'error',
        title: 'Cannot Generate XML',
        message: 'You need an active career with a championship to generate AI drivers.',
        duration: 4000
      })
      return
    }
    
    setIsGeneratingXML(true)
    setXmlResult(null)
    
    try {
      const standings = getStandings(resolvedSeriesId)
      const currentSeries = getSeriesById(resolvedSeriesId)
      
      if (standings.length === 0) {
        addToast({
          type: 'error',
          title: 'No Standings Data',
          message: 'Complete at least one race to generate AI drivers.',
          duration: 4000
        })
        setIsGeneratingXML(false)
        return
      }
      
      const config = {
        ams2Path: settings.gamePath ? `${settings.gamePath}\\UserData\\CustomAIDrivers` : '',
        backupEnabled: true
      }
      
      const result = await window.electron?.generateCareerAI?.(
        standings,
        currentSeries?.name || 'Career',
        config
      ) as any
      
      if (result?.success) {
        setXmlResult({
          success: true,
          message: `Generated ${result.driversGenerated} AI drivers to ${result.filePath}`
        })
        addToast({
          type: 'success',
          title: 'AI Drivers Generated!',
          message: `Created XML for ${result.driversGenerated} drivers`,
          duration: 5000
        })
      } else {
        setXmlResult({
          success: false,
          message: result?.error || 'Unknown error generating XML'
        })
        addToast({
          type: 'error',
          title: 'Generation Failed',
          message: result?.error || 'Unknown error',
          duration: 4000
        })
      }
    } catch (error) {
      console.error('XML generation error:', error)
      setXmlResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsGeneratingXML(false)
    }
  }

  const timeSinceLastUpdate = telemetryStatus.lastPacket 
    ? Math.round((Date.now() - telemetryStatus.lastPacket) / 1000)
    : null

  return (
    <div className="bg-white w-full h-full overflow-y-auto">
      <div className="p-[24px] flex flex-col gap-[24px]">
      {/* Warning when not in Electron */}
      {!isElectron && (
        <div className="bg-[#fef3c7] border-[0.8px] border-[#f59e0b]/30 rounded-[24px] overflow-hidden">
          <div className="flex items-center gap-[12px] p-[16px]">
            <AlertCircle className="w-[24px] h-[24px] text-[#f59e0b] flex-shrink-0" />
            <div>
              <p className="text-[14px] text-[#f59e0b]" style={FBold}>Running in Browser Mode</p>
              <p className="text-[13px] text-[#4a5565]" style={FR}>
                AMS2 integration requires the Electron app. Launch with <code className="bg-black/5 px-[4px] rounded-[4px]">npm run electron:dev</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center gap-[12px]">
        <SettingsIcon className="w-[24px] h-[24px] text-[#0a0a0a]" />
        <div>
          <h1 className="text-[30px] text-[#0a0a0a] tracking-[-1.5px]" style={FB}>Settings</h1>
          <p className="text-[14px] text-[#4a5565]" style={FR}>Configure AMS2 integration and telemetry</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* AMS2 Connection Status */}
        <Card variant="racing" padding="lg">
          <CardHeader title="Shared Memory Connection" />
          
          <div className="space-y-6">
            {/* Status Display */}
            <div className="p-4 rounded-xl bg-background/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {telemetryStatus.listening ? (
                    telemetryStatus.receiving ? (
                      <div className="w-12 h-12 rounded-full bg-status-success/20 flex items-center justify-center">
                        <HardDrive className="w-6 h-6 text-status-success animate-pulse" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-status-warning/20 flex items-center justify-center">
                        <Radio className="w-6 h-6 text-status-warning" />
                      </div>
                    )
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center">
                      <WifiOff className="w-6 h-6 text-text-muted" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-display font-semibold text-lg">
                      {telemetryStatus.listening 
                        ? telemetryStatus.receiving 
                          ? 'AMS2 Connected' 
                          : 'Waiting for AMS2...'
                        : 'Not Connected'
                      }
                    </h3>
                    <p className="text-sm text-text-muted">
                      {telemetryStatus.receiving 
                        ? `${telemetryStatus.gameState || 'In Game'}`
                        : telemetryStatus.error || 'Shared Memory'}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={telemetryStatus.receiving ? 'green' : telemetryStatus.listening ? 'orange' : 'default'}
                  size="lg"
                >
                  {telemetryStatus.receiving ? 'Live' : telemetryStatus.listening ? 'Waiting' : 'Offline'}
                </Badge>
              </div>

              {telemetryStatus.listening && (
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-surface-border">
                  <div className="text-center">
                    <p className="text-xs text-text-muted mb-1">Participants</p>
                    <p className="font-mono font-bold text-lg">{telemetryStatus.participantCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-text-muted mb-1">Last Update</p>
                    <p className="font-mono font-bold text-lg">
                      {timeSinceLastUpdate !== null ? `${timeSinceLastUpdate}s ago` : '-'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-text-muted mb-1">Race State</p>
                    <p className={`font-mono font-bold text-lg ${telemetryStatus.receiving ? 'text-status-success' : 'text-status-warning'}`}>
                      {telemetryStatus.raceState || (telemetryStatus.receiving ? 'Active' : 'Idle')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Connection Controls */}
            <div className="flex gap-3">
              {!telemetryStatus.listening ? (
                <Button 
                  variant="primary" 
                  className="flex-1"
                  onClick={handleConnectTelemetry}
                  loading={isConnecting}
                >
                  <HardDrive className="w-4 h-4 mr-2" />
                  Connect to AMS2
                </Button>
              ) : (
                <Button 
                  variant="danger" 
                  className="flex-1"
                  onClick={handleDisconnectTelemetry}
                >
                  <WifiOff className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              )}
              <Button 
                variant="secondary"
                onClick={checkTelemetryStatus}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Launch AMS2 */}
        <Card variant="glass" padding="lg">
          <CardHeader title="Launch Game" />
          
          <div className="space-y-6">
            {/* Game Path */}
            <div>
              <label className="text-sm text-text-muted mb-2 block">AMS2 Installation Path</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={settings.gamePath}
                    onChange={(e) => {
                      setSettings(prev => ({ ...prev, gamePath: e.target.value }))
                      setPathValid(null)
                    }}
                    className="w-full px-4 py-2 bg-surface border border-surface-border rounded-lg text-sm pr-10 focus:outline-none focus:border-accent-red"
                    placeholder="C:\Steam\steamapps\common\Automobilista 2"
                  />
                  {pathValid !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {pathValid ? (
                        <Check className="w-4 h-4 text-status-success" />
                      ) : (
                        <X className="w-4 h-4 text-status-danger" />
                      )}
                    </div>
                  )}
                </div>
                <Button variant="secondary" onClick={handleBrowsePath}>
                  <Folder className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-text-muted mt-1">
                Path should contain AMS2AVX.exe or AMS2.exe
              </p>
            </div>

            {/* Launch Button */}
            <div className="p-4 rounded-xl bg-background/50 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-red to-accent-orange flex items-center justify-center">
                  <Gamepad2 className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-semibold">Automobilista 2</h3>
                  <p className="text-sm text-text-muted">Launch game and start racing</p>
                </div>
              </div>
              
              <Button 
                variant="primary" 
                size="lg" 
                className="w-full"
                onClick={handleLaunchAMS2}
                loading={isLaunching}
              >
                <Play className="w-5 h-5 mr-2" />
                Launch AMS2
              </Button>
            </div>

            {/* Quick Settings */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-background/50 rounded-lg cursor-pointer hover:bg-background/70 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.disableVR}
                  onChange={(e) => setSettings(prev => ({ ...prev, disableVR: e.target.checked }))}
                  className="w-4 h-4 rounded border-surface-border text-accent-red focus:ring-accent-red"
                />
                <div className="flex-1">
                  <p className="font-medium">Launch without VR</p>
                  <p className="text-xs text-text-muted">Adds -novr flag to prevent VR headset activation</p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 bg-background/50 rounded-lg cursor-pointer hover:bg-background/70 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.autoConnect}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoConnect: e.target.checked }))}
                  className="w-4 h-4 rounded border-surface-border text-accent-red focus:ring-accent-red"
                />
                <div className="flex-1">
                  <p className="font-medium">Auto-connect telemetry</p>
                  <p className="text-xs text-text-muted">Start listening when app opens</p>
                </div>
              </label>
            </div>
          </div>
        </Card>
      </div>

      {/* Shared Memory Configuration */}
      <Card variant="glass" padding="lg">
        <CardHeader title="Shared Memory Configuration" />
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm text-text-muted mb-3 font-medium">Connection Status</h4>
            <div className="p-4 bg-background/50 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Method</span>
                <span className="font-mono text-sm text-accent-cyan">Shared Memory</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Memory Map</span>
                <span className="font-mono text-sm text-accent-orange">$pcars2$</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Status</span>
                <Badge variant={telemetryStatus.receiving ? 'green' : telemetryStatus.listening ? 'orange' : 'default'} size="sm">
                  {telemetryStatus.receiving ? 'Connected' : telemetryStatus.listening ? 'Waiting' : 'Offline'}
                </Badge>
              </div>
              {telemetryStatus.receiving && telemetryStatus.sessionState && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Session</span>
                  <span className="font-mono text-sm">{telemetryStatus.sessionState}</span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm text-text-muted mb-3 font-medium">AMS2 In-Game Setup</h4>
            <div className="p-4 bg-background/50 rounded-xl space-y-2 text-sm">
              <p className="text-text-secondary font-medium">Enable Shared Memory in AMS2:</p>
              <ol className="list-decimal list-inside space-y-1 text-text-muted">
                <li>Open AMS2 → Options → System</li>
                <li>Set <span className="text-accent-orange font-mono">Shared Memory</span> to <span className="text-status-success font-mono">Project CARS 2</span></li>
                <li>Save and return to game</li>
              </ol>
              <p className="text-xs text-status-info mt-2">
                ✅ Shared Memory is more reliable than UDP and provides direct access to all telemetry data.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-surface-border">
          {saveMessage && (
            <span className="text-status-success text-sm mr-4 flex items-center gap-2">
              <Check className="w-4 h-4" />
              {saveMessage}
            </span>
          )}
          <Button variant="primary" onClick={handleSaveSettings}>
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </Card>

      {/* AI Driver XML Generation */}
      <Card variant="glass" padding="lg">
        <CardHeader 
          title="AI Driver Generation" 
          subtitle="Generate CustomAIDrivers XML based on championship standings"
        />
        
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Generate AI driver skill levels based on your career championship standings. 
            Better performing drivers will have higher AI skill values, making the competition more realistic.
          </p>
          
          <div className="p-4 bg-background/50 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Current Championship</span>
              <span className="font-medium">
                {(player?.currentSeriesId || careerState?.seriesEntries?.[0]?.seriesId)
                  ? getSeriesById(player?.currentSeriesId || careerState?.seriesEntries?.[0]?.seriesId || '')?.name || 'Unknown Series'
                  : 'No active championship'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Drivers in Standings</span>
              <span className="font-mono">
                {(player?.currentSeriesId || careerState?.seriesEntries?.[0]?.seriesId)
                  ? getStandings(player?.currentSeriesId || careerState?.seriesEntries?.[0]?.seriesId || '').length
                  : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Output Directory</span>
              <span className="font-mono text-xs truncate max-w-xs">
                {settings.gamePath ? `${settings.gamePath}\\UserData\\CustomAIDrivers` : 'Not configured'}
              </span>
            </div>
          </div>
          
          {xmlResult && (
            <div className={`p-4 rounded-xl ${xmlResult.success ? 'bg-status-success/10 border border-status-success/30' : 'bg-status-error/10 border border-status-error/30'}`}>
              <div className="flex items-center gap-2">
                {xmlResult.success ? (
                  <Check className="w-4 h-4 text-status-success" />
                ) : (
                  <X className="w-4 h-4 text-status-error" />
                )}
                <span className={`text-sm ${xmlResult.success ? 'text-status-success' : 'text-status-error'}`}>
                  {xmlResult.message}
                </span>
              </div>
            </div>
          )}
          
          <Button 
            variant="primary" 
            onClick={handleGenerateCareerXML}
            disabled={isGeneratingXML || !(player?.currentSeriesId || careerState?.seriesEntries?.[0]?.seriesId) || !isElectron}
            className="w-full"
          >
            {isGeneratingXML ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileCode className="w-4 h-4 mr-2" />
                Generate AI Drivers XML
              </>
            )}
          </Button>
          
          <p className="text-xs text-text-muted">
            💡 The generated XML will adjust AI skill based on championship position. 
            Leaders get ~0.95 skill, bottom drivers get ~0.60 skill.
          </p>
        </div>
      </Card>

      {/* AI Commentary System */}
      <Card variant="racing" padding="lg">
        <CardHeader 
          title="🎙️ AI Race Commentary" 
          subtitle="Dynamic commentary powered by GPT-4 and ElevenLabs"
        />
        
        <div className="space-y-6">
          {/* Enable Toggle */}
          <label className="flex items-center gap-4 p-4 bg-background/50 rounded-xl cursor-pointer hover:bg-background/70 transition-colors">
            <input
              type="checkbox"
              checked={commentary.enabled}
              onChange={(e) => setCommentary(prev => ({ ...prev, enabled: e.target.checked }))}
              className="w-5 h-5 rounded border-surface-border text-accent-red focus:ring-accent-red"
            />
            <div className="flex-1">
              <p className="font-display font-semibold text-lg">Enable AI Commentary</p>
              <p className="text-sm text-text-muted">
                Get live, dynamic race commentary during your races
              </p>
            </div>
            {commentary.enabled && (
              <Badge variant="green" size="sm">
                <Mic className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
          </label>
          
          {/* API Keys */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm text-text-muted mb-2">
                <Key className="w-4 h-4" />
                Gemini API Key
              </label>
              <input
                type="password"
                value={commentary.geminiKey}
                onChange={(e) => setCommentary(prev => ({ ...prev, geminiKey: e.target.value }))}
                placeholder="sk-..."
                className="w-full px-4 py-3 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-red"
              />
              <p className="text-xs text-text-muted mt-1">
                Used for generating commentary scripts
              </p>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-text-muted mb-2">
                <Key className="w-4 h-4" />
                ElevenLabs API Key
              </label>
              <input
                type="password"
                value={commentary.elevenLabsKey}
                onChange={(e) => setCommentary(prev => ({ ...prev, elevenLabsKey: e.target.value }))}
                placeholder="xi_..."
                className="w-full px-4 py-3 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-red"
              />
              <p className="text-xs text-text-muted mt-1">
                Used for text-to-speech synthesis
              </p>
            </div>
          </div>
          
          {/* Voice Selection - Main + Co-commentator */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm text-text-muted mb-2">
                <Mic className="w-4 h-4 text-accent-red" />
                Lead Commentator
              </label>
              <select
                value={commentary.voiceId}
                onChange={(e) => setCommentary(prev => ({ ...prev, voiceId: e.target.value }))}
                className="w-full px-4 py-3 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-red"
              >
                {VOICE_OPTIONS.map(voice => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} - {voice.description}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-muted mt-1">Main play-by-play commentator</p>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-text-muted mb-2">
                <Mic className="w-4 h-4 text-accent-orange" />
                Co-Commentator (Color)
              </label>
              <select
                value={commentary.coCommentatorVoiceId}
                onChange={(e) => setCommentary(prev => ({ ...prev, coCommentatorVoiceId: e.target.value }))}
                className="w-full px-4 py-3 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-orange"
              >
                {VOICE_OPTIONS.map(voice => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} - {voice.description}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-muted mt-1">Adds analysis, banter & color</p>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-text-muted mb-2">
                <Mic className="w-4 h-4 text-accent-secondary" />
                Pit Reporter (Optional)
              </label>
              <select
                value={commentary.pitReporterVoiceId}
                onChange={(e) => setCommentary(prev => ({ ...prev, pitReporterVoiceId: e.target.value }))}
                className="w-full px-4 py-3 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-secondary"
              >
                <option value="">Disabled</option>
                {VOICE_OPTIONS.map(voice => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} - {voice.description}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-muted mt-1">Field reporter for grid walk, pit lane & post-race</p>
            </div>
          </div>
          
          {/* Audio Output Device */}
          <div>
            <label className="flex items-center gap-2 text-sm text-text-muted mb-2">
              <HardDrive className="w-4 h-4" />
              Audio Output Device
            </label>
            <div className="flex gap-2">
              <select
                value={commentary.audioDeviceId}
                onChange={(e) => handleAudioDeviceChange(e.target.value)}
                className="flex-1 px-4 py-3 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-red"
              >
                <option value="">System Default</option>
                {audioDevices.map(device => (
                  <option key={device.id} value={device.id}>
                    {device.name} {device.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
              <Button variant="ghost" size="sm" onClick={loadAudioDevices} disabled={isLoadingDevices}>
                <RefreshCw className={`w-4 h-4 ${isLoadingDevices ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <p className="text-xs text-text-muted/60 mt-1.5">
              💡 <strong>SteelSeries Sonar:</strong> Add this app to your desired channel in Sonar's Apps list (look for "Electron" in dev mode)
            </p>
          </div>
          
          {/* Volume and Audio Test */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm text-text-muted mb-2">
                <Volume2 className="w-4 h-4" />
                Volume: {Math.round(commentary.volume * 100)}%
              </label>
              <div className="flex items-center gap-3">
                <VolumeX className="w-4 h-4 text-text-muted" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={commentary.volume}
                  onChange={(e) => setCommentary(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                  className="flex-1 h-2 bg-surface-secondary rounded-lg appearance-none cursor-pointer accent-accent-red"
                />
                <Volume1 className="w-4 h-4 text-text-muted" />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-text-muted mb-2">
                <TestTube className="w-4 h-4" />
                Test Audio Output
              </label>
              <Button 
                variant="secondary" 
                onClick={handleTestAudio}
                disabled={isTestingAudio}
                className="w-full"
              >
                {isTestingAudio ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Playing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Play Test Sound
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Status Display - Dual Commentator */}
          {(lastCommentaryScript || lastCoCommentaryScript) && (
            <div className="p-4 bg-background/50 rounded-xl border border-surface-border space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-muted font-medium">Last Commentary:</p>
                {streamingLatency && (
                  <div className="flex items-center gap-2 text-xs">
                    <Zap className="w-3 h-3 text-accent-yellow" />
                    <span className="text-accent-yellow font-mono">
                      First audio: {streamingLatency.firstChunkMs}ms
                    </span>
                    <span className="text-text-muted">|</span>
                    <span className="text-text-secondary font-mono">
                      Total: {streamingLatency.totalMs}ms
                    </span>
                  </div>
                )}
              </div>
              {lastCommentaryScript && (
                <div className="flex items-start gap-2">
                  <span className="text-xs bg-accent-red/20 text-accent-red px-2 py-0.5 rounded font-medium">Crofty</span>
                  <p className="text-sm italic text-accent-orange flex-1">"{lastCommentaryScript}"</p>
                </div>
              )}
              {lastCoCommentaryScript && (
                <div className="flex items-start gap-2">
                  <span className="text-xs bg-accent-blue/20 text-accent-blue px-2 py-0.5 rounded font-medium">Vicky</span>
                  <p className="text-sm italic text-accent-cyan flex-1">"{lastCoCommentaryScript}"</p>
                </div>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="primary" 
              className="flex-1"
              onClick={handleSaveCommentary}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Commentary Settings
            </Button>
            <Button 
              variant="secondary"
              onClick={handleTestCommentary}
              disabled={isTesting || !commentary.geminiKey || !commentary.elevenLabsKey}
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Test
                </>
              )}
            </Button>
            <Button 
              variant="racing"
              onClick={handleTestBanter}
              disabled={isTestingBanter || !commentary.geminiKey || !commentary.elevenLabsKey}
            >
              {isTestingBanter ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Test Banter
                </>
              )}
            </Button>
            <Button 
              variant="primary"
              onClick={handleTestStreaming}
              disabled={isTestingStreaming || !commentary.elevenLabsKey}
              title="Test low-latency streaming TTS"
            >
              {isTestingStreaming ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Streaming...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Test Streaming ⚡
                </>
              )}
            </Button>
            <Button 
              variant="racing"
              onClick={handleTestQueueSequence}
              disabled={isTestingQueue || !commentary.geminiKey || !commentary.elevenLabsKey}
            >
              {isTestingQueue ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Queuing...
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4 mr-2" />
                  Test Queue
                </>
              )}
            </Button>
          </div>
          
          {/* TV Broadcast Test - Full 2 minute simulation */}
          <div className="p-4 bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 border border-accent-primary/30 rounded-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-medium text-accent-primary flex items-center gap-2">
                  <Radio className="w-4 h-4" />
                  TV Broadcast Test
                </h4>
                <p className="text-xs text-text-muted mt-1">
                  Simulates 2 minutes of continuous race commentary with both voices, 
                  content pool, and scheduler - just like a real broadcast!
                </p>
              </div>
              <Button 
                variant="primary"
                onClick={handleTestBroadcast}
                disabled={isTestingBroadcast || !commentary.geminiKey || !commentary.elevenLabsKey}
                className="whitespace-nowrap"
              >
                {isTestingBroadcast ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Broadcasting...
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4 mr-2" />
                    Start 2min Test
                  </>
                )}
              </Button>
            </div>
            
            {/* Progress bar during test */}
            {broadcastTestProgress && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">
                    Lap {Math.min(30, Math.floor(broadcastTestProgress.elapsed / 8) + 1)} of 30 (simulated)
                  </span>
                  <span className="text-accent-primary font-mono">
                    {Math.floor(broadcastTestProgress.elapsed / 60)}:{String(broadcastTestProgress.elapsed % 60).padStart(2, '0')} / 2:00
                  </span>
                </div>
                <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-1000"
                    style={{ width: `${(broadcastTestProgress.elapsed / broadcastTestProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Regenerate Narratives for Existing Career */}
          {hasActiveCareer && (
            <div className="p-4 bg-gradient-to-r from-status-info/10 to-accent-primary/10 border border-status-info/30 rounded-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-medium text-status-info flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Generate Driver Narratives
                  </h4>
                  <p className="text-xs text-text-muted mt-1">
                    {needsNarrativeMigration() 
                      ? 'Your career is missing driver backstories. Generate them now for richer commentary!'
                      : 'Regenerate backstories for all drivers to refresh commentary content.'}
                  </p>
                </div>
                <Button 
                  variant={needsNarrativeMigration() ? 'primary' : 'secondary'}
                  onClick={handleRegenerateNarratives}
                  disabled={isRegeneratingNarratives || !commentary.geminiKey}
                  className="whitespace-nowrap"
                >
                  {isRegeneratingNarratives ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {needsNarrativeMigration() ? 'Generate Now' : 'Regenerate'}
                    </>
                  )}
                </Button>
              </div>
              
              {/* Progress bar during generation - shows local or background progress */}
              {(() => {
                const bgStatus = getBackgroundNarrativeStatus()
                const showProgress = narrativeProgress || bgStatus.isRunning
                const progressSeries = narrativeProgress?.series || bgStatus.currentSeries || 'Generating...'
                const progressValue = narrativeProgress?.progress ?? bgStatus.progress
                
                return showProgress ? (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted flex items-center gap-2">
                        {bgStatus.isRunning && !narrativeProgress && (
                          <span className="w-2 h-2 bg-accent-primary rounded-full animate-pulse" />
                        )}
                        {progressSeries}
                        {bgStatus.isRunning && !narrativeProgress && (
                          <span className="text-accent-primary/70">(background)</span>
                        )}
                      </span>
                      <span className="text-accent-primary font-mono">
                        {Math.round(progressValue * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-status-info to-accent-primary transition-all duration-300"
                        style={{ width: `${progressValue * 100}%` }}
                      />
                    </div>
                    {bgStatus.isRunning && !narrativeProgress && (
                      <p className="text-xs text-text-muted">
                        Running in background - you can navigate away and it will continue!
                      </p>
                    )}
                  </div>
                ) : null
              })()}
            </div>
          )}
          
          {/* Generate Team Narratives for Existing Career */}
          {hasActiveCareer && (
            <div className="p-4 bg-gradient-to-r from-accent-warning/10 to-accent-primary/10 border border-accent-warning/30 rounded-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-medium text-accent-warning flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Generate Team Narratives
                  </h4>
                  <p className="text-xs text-text-muted mt-1">
                    {needsTeamNarrativeMigration() 
                      ? 'Your teams are missing backstories. Generate them for diverse commentary about other teams!'
                      : 'Regenerate team backstories to refresh commentary about other teams.'}
                  </p>
                </div>
                <Button 
                  variant={needsTeamNarrativeMigration() ? 'primary' : 'secondary'}
                  onClick={handleRegenerateTeamNarratives}
                  disabled={teamNarrativeStatus.isRunning || !commentary.geminiKey}
                  className="whitespace-nowrap"
                >
                  {teamNarrativeStatus.isRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {needsTeamNarrativeMigration() ? 'Generate Now' : 'Regenerate'}
                    </>
                  )}
                </Button>
              </div>
              
              {/* Progress bar during generation (persists across navigation!) */}
              {teamNarrativeStatus.isRunning && teamNarrativeStatus.currentSeries && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">{teamNarrativeStatus.currentSeries}</span>
                    <span className="text-accent-warning font-mono">
                      {Math.round(teamNarrativeStatus.progress * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-accent-warning to-accent-primary transition-all duration-300"
                      style={{ width: `${teamNarrativeStatus.progress * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-muted">
                    Running in background - you can navigate away!
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Update Series Data for Existing Career */}
          {hasActiveCareer && (
            <div className="p-4 bg-gradient-to-r from-accent-secondary/10 to-accent-primary/10 border border-accent-secondary/30 rounded-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-medium text-accent-secondary flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Update Series Data
                  </h4>
                  <p className="text-xs text-text-muted mt-1">
                    Apply authentic point systems and commentary profiles. Each series will use its real-world points (Stock Car Brasil ≠ GT3 ≠ F1) and commentary will use appropriate terminology.
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    <span className="text-accent-secondary">Note:</span> Contracts use position targets, so they'll work with any point system. This mainly affects displayed points and commentary style.
                  </p>
                </div>
                <Button 
                  variant="secondary"
                  onClick={handleMigrateSeriesData}
                  className="whitespace-nowrap"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Update Data
                </Button>
              </div>
            </div>
          )}
          
          {/* Info */}
          <div className="p-4 bg-status-info/10 border border-status-info/30 rounded-xl">
            <h4 className="font-medium text-status-info mb-2">✨ Commentary Features:</h4>
            <ul className="text-xs text-text-muted space-y-1">
              <li>• <strong>Practice:</strong> Session start, lap improvements, setup feedback</li>
              <li>• <strong>Qualifying:</strong> Hot lap commentary, pole position celebration, grid position updates</li>
              <li>• <strong>Race:</strong> Overtakes, battles, final laps, podium finish, race win</li>
              <li>• <strong>Color Commentary:</strong> Championship context, team info, driver career stats, rivalry mentions</li>
              <li>• <strong>General Chatter:</strong> Track observations, strategic insights, random facts between events</li>
            </ul>
            <p className="text-xs text-text-muted mt-2">
              💡 Career data is automatically included for personalized commentary!
            </p>
          </div>
          
          {/* Cost Estimate */}
          <p className="text-xs text-text-muted text-center">
            💡 Estimated cost: ~$0.02-0.05 per race (GPT-4) + ~$0.50-1.00 per race (ElevenLabs)
          </p>
        </div>
      </Card>

      {/* Live Data Preview - Only show when telemetry is active */}
      {telemetryStatus.listening && (
        <Card variant="racing" padding="lg">
          <CardHeader 
            title="Live Telemetry Data" 
            action={
              <div className="flex items-center gap-3">
                <Badge variant={telemetryStatus.receiving ? 'green' : 'default'}>
                  {telemetryStatus.receiving ? 'Connected' : 'Waiting'}
                </Badge>
                {lastUpdateTime && (
                  <span className="text-xs text-text-muted">
                    Last: {lastUpdateTime.toLocaleTimeString()}
                  </span>
                )}
              </div>
            }
          />
          
          <div className="grid grid-cols-2 gap-6">
            {/* Session Info */}
            <div>
              <h4 className="text-sm text-text-muted mb-3 font-medium flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                Session Data
              </h4>
              {liveSession ? (
                <div className="p-4 bg-background/50 rounded-xl space-y-2 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Track:</span>
                    <span className="text-status-success">{liveSession.trackName || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Session:</span>
                    <span className="text-accent-orange">{liveSession.sessionType || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Game State:</span>
                    <span>{liveSession.sessionState || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Race State:</span>
                    <span className={liveSession.raceState === 'Racing' ? 'text-status-success' : ''}>{liveSession.raceState || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Participants:</span>
                    <span>{liveSession.numParticipants || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Laps:</span>
                    <span>{liveSession.lapsInEvent || 0}</span>
                  </div>
                  {liveSession.carName && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Car:</span>
                      <span className="text-accent-cyan truncate max-w-[150px]">{liveSession.carName}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-background/50 rounded-xl text-center text-text-muted">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Waiting for session data...</p>
                  <p className="text-xs mt-1">Start a session in AMS2</p>
                </div>
              )}
            </div>
            
            {/* Participants */}
            <div>
              <h4 className="text-sm text-text-muted mb-3 font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Participants (Top 10)
              </h4>
              {liveParticipants.length > 0 ? (
                <div className="p-4 bg-background/50 rounded-xl max-h-48 overflow-y-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="text-text-muted">
                        <th className="text-left pb-2">Pos</th>
                        <th className="text-left pb-2">Driver</th>
                        <th className="text-right pb-2">Lap</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveParticipants
                        .sort((a, b) => (a.racePosition || 999) - (b.racePosition || 999))
                        .map((p, idx) => (
                        <tr key={idx} className={p.isPlayer ? 'text-accent-red font-bold' : ''}>
                          <td className="py-1">{p.racePosition || '-'}</td>
                          <td className="py-1 truncate max-w-[150px]">
                            {p.name || `Driver ${idx + 1}`}
                            {p.isPlayer && ' (You)'}
                          </td>
                          <td className="py-1 text-right">{p.currentLap || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-background/50 rounded-xl text-center text-text-muted">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No participants yet</p>
                  <p className="text-xs mt-1">Join or start a race</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Connection Health */}
          <div className="mt-4 pt-4 border-t border-surface-border">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-background/50 rounded-lg text-center">
                <p className="text-xs text-text-muted mb-1">Connection</p>
                <p className={`font-mono font-bold text-lg ${telemetryStatus.receiving ? 'text-status-success' : 'text-status-warning'}`}>
                  {telemetryStatus.receiving ? 'Active' : 'Waiting'}
                </p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg text-center">
                <p className="text-xs text-text-muted mb-1">Data Updates</p>
                <p className="font-mono font-bold text-lg">{updateCount}</p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg text-center">
                <p className="text-xs text-text-muted mb-1">Method</p>
                <p className="font-mono font-bold text-lg text-accent-cyan">Shared Mem</p>
              </div>
            </div>

            {/* Debug info - collapsible */}
            <details className="group mt-4">
              <summary className="cursor-pointer text-sm text-text-muted hover:text-text-secondary flex items-center gap-2">
                <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                Debug Data
              </summary>
              <div className="mt-3">
                <pre className="p-4 bg-background rounded-lg text-xs font-mono overflow-auto max-h-40 text-text-muted">
{JSON.stringify({ 
  session: liveSession, 
  participants: liveParticipants.slice(0, 3),
  status: telemetryStatus
}, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        </Card>
      )}

      {/* Data Capture Info */}
      <Card variant="default" padding="lg">
        <CardHeader title="What Gets Captured" />
        
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-background/50 rounded-xl text-center">
            <Monitor className="w-8 h-8 mx-auto text-accent-blue mb-2" />
            <h4 className="font-medium mb-1">Race Results</h4>
            <p className="text-xs text-text-muted">Final positions, lap times, gaps</p>
          </div>
          <div className="p-4 bg-background/50 rounded-xl text-center">
            <Eye className="w-8 h-8 mx-auto text-accent-orange mb-2" />
            <h4 className="font-medium mb-1">Performance</h4>
            <p className="text-xs text-text-muted">Sector times, consistency</p>
          </div>
          <div className="p-4 bg-background/50 rounded-xl text-center">
            <HardDrive className="w-8 h-8 mx-auto text-accent-green mb-2" />
            <h4 className="font-medium mb-1">Session Data</h4>
            <p className="text-xs text-text-muted">Track, weather, session type</p>
          </div>
          <div className="p-4 bg-background/50 rounded-xl text-center">
            <Volume2 className="w-8 h-8 mx-auto text-accent-red mb-2" />
            <h4 className="font-medium mb-1">Live Telemetry</h4>
            <p className="text-xs text-text-muted">Real-time race monitoring</p>
          </div>
        </div>
      </Card>

      {/* Career Data Repair */}
      {player && (
        <Card variant="racing" padding="lg">
          <CardHeader 
            title="Career Data Repair" 
            action={
              <Badge variant="default">
                <Wrench className="w-3 h-3 mr-1" />
                Maintenance
              </Badge>
            }
          />
          
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              If you experienced bugs with duplicate race results, incorrect positions, or inflated prize money, 
              this tool will clean up your career data without losing your actual race results.
            </p>

            <div className="p-4 bg-background/50 rounded-xl space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-status-warning" />
                This repair will:
              </h4>
              <ul className="text-xs text-text-muted space-y-1 ml-6 list-disc">
                <li>Remove duplicate race results (keep first occurrence per round)</li>
                <li>Remove duplicate prize money transactions</li>
                <li>Recalculate total races, wins, podiums, and poles from actual history</li>
                <li>Recalculate reputation based on actual race performances</li>
                <li>Recalculate financial balance from cleaned transactions</li>
              </ul>
            </div>

            {repairResult && (
              <div className="p-4 bg-status-success/10 border border-status-success/30 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-status-success">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Repair Complete!</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-text-muted">Duplicate Races Removed</p>
                    <p className="font-mono font-bold text-lg">{repairResult.duplicateRacesRemoved}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Duplicate Transactions Removed</p>
                    <p className="font-mono font-bold text-lg">{repairResult.duplicateTransactionsRemoved}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Reputation</p>
                    <p className="font-mono">
                      <span className="text-text-muted">{repairResult.oldRep}</span>
                      <span className="mx-2">→</span>
                      <span className="text-status-success font-bold">{repairResult.newRep}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-text-muted">Balance</p>
                    <p className="font-mono">
                      <span className="text-text-muted">${repairResult.oldBalance.toLocaleString()}</span>
                      <span className="mx-2">→</span>
                      <span className="text-status-success font-bold">${repairResult.newBalance.toLocaleString()}</span>
                    </p>
                  </div>
                </div>
                {repairResult.standingsFixed && (
                  <div className="pt-2 border-t border-status-success/20">
                    <div className="flex items-center gap-2 text-sm text-status-success">
                      <Check className="w-4 h-4" />
                      <span>Championship standings race counts fixed</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button
              variant="secondary"
              onClick={() => {
                setIsRepairing(true)
                setRepairResult(null)
                
                // Small delay to show loading state
                setTimeout(() => {
                  const result = repairCareerData()
                  setRepairResult(result)
                  setIsRepairing(false)
                  
                  if (result.duplicateRacesRemoved > 0 || result.duplicateTransactionsRemoved > 0) {
                    addToast({
                      type: 'success',
                      title: 'Career Data Repaired',
                      message: `Removed ${result.duplicateRacesRemoved} duplicate races and ${result.duplicateTransactionsRemoved} duplicate transactions.`,
                      duration: 5000
                    })
                  } else {
                    addToast({
                      type: 'info',
                      title: 'No Issues Found',
                      message: 'Your career data looks clean! No repairs were needed.',
                      duration: 4000
                    })
                  }
                }, 500)
              }}
              disabled={isRepairing}
              className="w-full"
            >
              {isRepairing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Repairing...
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4 mr-2" />
                  Repair Career Data
                </>
              )}
            </Button>
            
            {/* Team Reputation Normalization Section */}
            <div className="pt-4 mt-4 border-t border-surface-border">
              <h4 className="font-medium text-sm mb-2">Normalize Team Reputation</h4>
              <p className="text-xs text-text-muted mb-3">
                Recalculate your team reputation based on current team state and performance.
                Use this if team rep progression got inflated or drifted.
              </p>
              
              {teamRepResetResult && (
                <div className="mb-3 p-3 rounded-lg bg-surface-secondary/50 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Old Team Reputation:</span>
                    <span className="font-mono">{teamRepResetResult.oldRep}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">New Team Reputation:</span>
                    <span className={`font-mono font-bold ${teamRepResetResult.newRep > teamRepResetResult.oldRep ? 'text-green-400' : teamRepResetResult.newRep < teamRepResetResult.oldRep ? 'text-red-400' : 'text-text-primary'}`}>
                      {teamRepResetResult.newRep}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-surface-border mt-1">
                    <span className="text-text-muted">Change:</span>
                    <span className={`font-mono ${teamRepResetResult.newRep - teamRepResetResult.oldRep > 0 ? 'text-green-400' : teamRepResetResult.newRep - teamRepResetResult.oldRep < 0 ? 'text-red-400' : 'text-text-muted'}`}>
                      {teamRepResetResult.newRep - teamRepResetResult.oldRep > 0 ? '+' : ''}{teamRepResetResult.newRep - teamRepResetResult.oldRep}
                    </span>
                  </div>
                </div>
              )}
              
              <Button
                variant="secondary"
                onClick={() => {
                  setIsResettingTeamRep(true)
                  setTeamRepResetResult(null)
                  
                  setTimeout(() => {
                    const result = recalculateTeamReputation()
                    setTeamRepResetResult(result)
                    setIsResettingTeamRep(false)
                    
                    const change = result.newRep - result.oldRep
                    addToast({
                      type: change !== 0 ? 'success' : 'info',
                      title: 'Team Reputation Normalized',
                      message: change !== 0 
                        ? `Team reputation ${change > 0 ? 'increased' : 'decreased'} from ${result.oldRep} to ${result.newRep} (${change > 0 ? '+' : ''}${change})`
                        : `Team reputation unchanged at ${result.newRep}`,
                      duration: 5000
                    })
                  }, 300)
                }}
                disabled={isResettingTeamRep}
                className="w-full"
              >
                {isResettingTeamRep ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Recalculating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Normalize Team Reputation
                  </>
                )}
              </Button>
            </div>

            {/* Normalize Current Career Economy Section */}
            <div className="pt-4 mt-4 border-t border-surface-border">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Normalize Current Career Economy
              </h4>
              <p className="text-xs text-text-muted mb-3">
                Rebalances your <strong>existing sponsor deals</strong> to the current economy rules immediately.
                Use this if your current save was created before the latest sponsor balancing changes.
              </p>

              {careerEconomyNormalizeResult && (
                <div className="mb-3 p-3 rounded-lg bg-surface-secondary/50 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Sponsor Deals Adjusted:</span>
                    <span className="font-mono font-bold text-amber-300">{careerEconomyNormalizeResult.sponsorsAdjusted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Pending Offers Adjusted:</span>
                    <span className="font-mono">{careerEconomyNormalizeResult.pendingOffersAdjusted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Over-Cap Sponsors Deactivated:</span>
                    <span className={`font-mono ${careerEconomyNormalizeResult.sponsorsDeactivatedForSlotCap > 0 ? 'text-red-300 font-bold' : ''}`}>
                      {careerEconomyNormalizeResult.sponsorsDeactivatedForSlotCap}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Weekly Income Before:</span>
                    <span className="font-mono">${careerEconomyNormalizeResult.weeklyIncomeBefore.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Weekly Income After:</span>
                    <span className="font-mono font-bold text-green-400">${careerEconomyNormalizeResult.weeklyIncomeAfter.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-surface-border mt-1">
                    <span className="text-text-muted">Weekly Cap:</span>
                    <span className="font-mono">${careerEconomyNormalizeResult.weeklyCap.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <Button
                variant="secondary"
                onClick={() => {
                  setIsNormalizingCareerEconomy(true)
                  setCareerEconomyNormalizeResult(null)

                  setTimeout(() => {
                    const result = normalizeCurrentCareerEconomy()
                    setCareerEconomyNormalizeResult(result)
                    setIsNormalizingCareerEconomy(false)

                    addToast({
                      type: result.sponsorsAdjusted > 0 ? 'success' : 'info',
                      title: result.sponsorsAdjusted > 0 ? 'Career Economy Normalized' : 'No Changes Needed',
                      message: result.message,
                      duration: 5000
                    })
                  }, 300)
                }}
                disabled={isNormalizingCareerEconomy}
                className="w-full"
              >
                {isNormalizingCareerEconomy ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Normalizing Economy...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Normalize Current Career Economy
                  </>
                )}
              </Button>
            </div>

            {/* Reset Marketability Section */}
            <div className="pt-4 mt-4 border-t border-surface-border">
              <h4 className="font-medium text-sm mb-2">Reset Marketability</h4>
              <p className="text-xs text-text-muted mb-3">
                Recalculate your marketability based on your scenario's base stats, backstory traits, and actual career achievements (wins, podiums, championships).
              </p>
              
              {marketabilityResetResult && (
                <div className="mb-3 p-3 rounded-lg bg-surface-secondary/50 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Old Marketability:</span>
                    <span className="font-mono">{marketabilityResetResult.oldMarketability}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">New Marketability:</span>
                    <span className={`font-mono font-bold ${marketabilityResetResult.newMarketability > marketabilityResetResult.oldMarketability ? 'text-green-400' : marketabilityResetResult.newMarketability < marketabilityResetResult.oldMarketability ? 'text-red-400' : 'text-text-primary'}`}>
                      {marketabilityResetResult.newMarketability}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-surface-border mt-1">
                    <span className="text-text-muted">Change:</span>
                    <span className={`font-mono ${marketabilityResetResult.newMarketability - marketabilityResetResult.oldMarketability > 0 ? 'text-green-400' : marketabilityResetResult.newMarketability - marketabilityResetResult.oldMarketability < 0 ? 'text-red-400' : 'text-text-muted'}`}>
                      {marketabilityResetResult.newMarketability - marketabilityResetResult.oldMarketability > 0 ? '+' : ''}{marketabilityResetResult.newMarketability - marketabilityResetResult.oldMarketability}
                    </span>
                  </div>
                </div>
              )}
              
              <Button
                variant="secondary"
                onClick={() => {
                  setIsResettingMarketability(true)
                  setMarketabilityResetResult(null)
                  
                  setTimeout(() => {
                    const result = recalculateMarketability()
                    setMarketabilityResetResult(result)
                    setIsResettingMarketability(false)
                    
                    const change = result.newMarketability - result.oldMarketability
                    addToast({
                      type: change !== 0 ? 'success' : 'info',
                      title: 'Marketability Recalculated',
                      message: change !== 0 
                        ? `Marketability ${change > 0 ? 'increased' : 'decreased'} from ${result.oldMarketability} to ${result.newMarketability} (${change > 0 ? '+' : ''}${change})`
                        : `Marketability unchanged at ${result.newMarketability}`,
                      duration: 5000
                    })
                  }, 300)
                }}
                disabled={isResettingMarketability}
                className="w-full"
              >
                {isResettingMarketability ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Recalculating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset Marketability
                  </>
                )}
              </Button>
            </div>

            {/* Reassign Activity Timeslots Section */}
            <div className="pt-4 mt-4 border-t border-surface-border">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-accent-cyan" />
                Reassign Activity Timeslots
              </h4>
              <p className="text-xs text-text-muted mb-3">
                Retroactively assign proper time-of-day periods (Morning, Afternoon, Evening, Night) to all existing 
                scheduled activities that are currently missing a timeslot. New activities will automatically get timeslots going forward.
              </p>
              
              {timeslotResult !== null && (
                <div className={`mb-3 p-3 rounded-lg text-sm ${timeslotResult > 0 ? 'bg-status-success/10 border border-status-success/30' : 'bg-surface-secondary/50'}`}>
                  <div className="flex items-center gap-2">
                    {timeslotResult > 0 ? (
                      <Check className="w-4 h-4 text-status-success" />
                    ) : (
                      <Check className="w-4 h-4 text-text-muted" />
                    )}
                    <span className={timeslotResult > 0 ? 'text-status-success font-medium' : 'text-text-muted'}>
                      {timeslotResult > 0 
                        ? `${timeslotResult} activities reassigned to proper timeslots!`
                        : 'All activities already have timeslots assigned.'}
                    </span>
                  </div>
                </div>
              )}
              
              <Button
                variant="secondary"
                onClick={() => {
                  setIsReassigningTimeslots(true)
                  setTimeslotResult(null)
                  
                  setTimeout(() => {
                    const count = reassignActivityTimeslots()
                    setTimeslotResult(count)
                    setIsReassigningTimeslots(false)
                    
                    addToast({
                      type: count > 0 ? 'success' : 'info',
                      title: 'Activity Timeslots',
                      message: count > 0 
                        ? `Reassigned ${count} activities to proper time-of-day slots.`
                        : 'All activities already have timeslots.',
                      duration: 4000
                    })
                  }, 300)
                }}
                disabled={isReassigningTimeslots}
                className="w-full"
              >
                {isReassigningTimeslots ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Reassigning...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reassign Timeslots
                  </>
                )}
              </Button>
            </div>

            {/* Repair Phone Messages Section */}
            <div className="pt-4 mt-4 border-t border-surface-border">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-400" />
                Repair Phone Messages
              </h4>
              <p className="text-xs text-text-muted mb-3">
                Fixes NPC messages that were generated with an incorrect conversation key format 
                and immediately delivers any queued messages that were waiting for a future day. 
                All pending messages will appear in your phone right away.
              </p>
              
              {messageRepairResult && (
                <div className={`mb-3 p-3 rounded-lg text-sm ${messageRepairResult.conversationsFixed + messageRepairResult.queuedFixed + messageRepairResult.pendingRepliesFixed + messageRepairResult.queuedDelivered > 0 ? 'bg-status-success/10 border border-status-success/30' : 'bg-surface-secondary/50'}`}>
                  {messageRepairResult.conversationsFixed + messageRepairResult.queuedFixed + messageRepairResult.pendingRepliesFixed + messageRepairResult.queuedDelivered > 0 ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-status-success font-medium">
                        <Check className="w-4 h-4" />
                        Messages Repaired!
                      </div>
                      {messageRepairResult.conversationsFixed > 0 && (
                        <p className="text-xs text-text-muted ml-6">{messageRepairResult.conversationsFixed} conversation key(s) fixed</p>
                      )}
                      {messageRepairResult.queuedDelivered > 0 && (
                        <p className="text-xs text-green-400 ml-6 font-medium">{messageRepairResult.queuedDelivered} queued message(s) delivered to your phone</p>
                      )}
                      {messageRepairResult.queuedFixed > 0 && (
                        <p className="text-xs text-text-muted ml-6">{messageRepairResult.queuedFixed} queued message ID(s) normalized</p>
                      )}
                      {messageRepairResult.pendingRepliesFixed > 0 && (
                        <p className="text-xs text-text-muted ml-6">{messageRepairResult.pendingRepliesFixed} pending reply(ies) fixed</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-text-muted">
                      <Check className="w-4 h-4" />
                      All messages already using correct format and no queued messages pending.
                    </div>
                  )}
                </div>
              )}
              
              <Button
                variant="secondary"
                onClick={() => {
                  setIsRepairingMessages(true)
                  setMessageRepairResult(null)
                  
                  setTimeout(() => {
                    const result = repairPhoneMessages()
                    setMessageRepairResult(result)
                    setIsRepairingMessages(false)
                    
                    const total = result.conversationsFixed + result.queuedFixed + result.pendingRepliesFixed + result.queuedDelivered
                    addToast({
                      type: total > 0 ? 'success' : 'info',
                      title: total > 0 ? 'Phone Messages Repaired' : 'No Issues Found',
                      message: total > 0 
                        ? `Fixed ${result.conversationsFixed} conversation(s), delivered ${result.queuedDelivered} queued message(s). Check your phone!`
                        : 'All phone messages are using the correct format and no queued messages pending.',
                      duration: 5000
                    })
                  }, 300)
                }}
                disabled={isRepairingMessages}
                className="w-full"
              >
                {isRepairingMessages ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Repairing Messages...
                  </>
                ) : (
                  <>
                    <Wrench className="w-4 h-4 mr-2" />
                    Repair Phone Messages
                  </>
                )}
              </Button>
            </div>

            {/* Fix Prize Money Section */}
            <div className="pt-4 mt-4 border-t border-surface-border">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                Fix Prize Money
              </h4>
              <p className="text-xs text-text-muted mb-3">
                Retroactively recalculate prize money for all past races using correct series data. 
                This fixes a bug where races were using incorrect base values instead of your series' actual prize pool.
              </p>
              
              {prizeMoneyResult && (
                <div className="mb-3 p-3 rounded-lg bg-surface-secondary/50 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Races Fixed:</span>
                    <span className="font-mono">{prizeMoneyResult.racesFixed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Old Total:</span>
                    <span className="font-mono">${prizeMoneyResult.oldTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">New Total:</span>
                    <span className="font-mono font-bold text-green-400">${prizeMoneyResult.newTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-surface-border mt-1">
                    <span className="text-text-muted">Added to Balance:</span>
                    <span className={`font-mono font-bold ${prizeMoneyResult.difference > 0 ? 'text-green-400' : 'text-text-muted'}`}>
                      +${prizeMoneyResult.difference.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              
              <Button
                variant="secondary"
                onClick={() => {
                  setIsFixingPrizeMoney(true)
                  setPrizeMoneyResult(null)
                  
                  setTimeout(() => {
                    const result = recalculatePrizeMoney()
                    setPrizeMoneyResult(result)
                    setIsFixingPrizeMoney(false)
                    
                    if (result.racesFixed > 0) {
                      addToast({
                        type: 'success',
                        title: 'Prize Money Fixed!',
                        message: `Fixed ${result.racesFixed} races. Added $${result.difference.toLocaleString()} to your balance!`,
                        duration: 6000
                      })
                    } else {
                      addToast({
                        type: 'info',
                        title: 'No Changes Needed',
                        message: 'All prize money values are already correct.',
                        duration: 4000
                      })
                    }
                  }, 300)
                }}
                disabled={isFixingPrizeMoney}
                className="w-full"
              >
                {isFixingPrizeMoney ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Fixing Prize Money...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Fix Prize Money
                  </>
                )}
              </Button>
            </div>

            {/* Fix Economy Section */}
            <div className="pt-4 mt-4 border-t border-surface-border">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Fix Economy (Seat Costs & Salaries)
              </h4>
              <p className="text-xs text-text-muted mb-3">
                Updates seat costs and salary ranges to use realistic tier-based values. 
                Elite/Pinnacle teams will pay you instead of requiring payment.
              </p>
              
              {economyResult && (
                <div className="mb-3 p-3 rounded-lg bg-surface-secondary/50 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Team:</span>
                    <span className="font-mono">{economyResult.teamsUpdated > 0 ? 'Updated' : 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Seat Cost:</span>
                    <span className="font-mono">
                      ${economyResult.oldSeatCost.toLocaleString()} → <span className="text-yellow-400">${economyResult.newSeatCost.toLocaleString()}</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Salary (season):</span>
                    <span className="font-mono">
                      ${economyResult.oldSalary.toLocaleString()} → <span className="text-green-400">${economyResult.newSalary.toLocaleString()}</span>
                    </span>
                  </div>
                  {economyResult.seatFeeDifference > 0 && (
                    <div className="flex justify-between mt-2 pt-2 border-t border-surface-border">
                      <span className="text-text-muted">Seat Fee Adjustment:</span>
                      <span className="font-mono text-red-400">
                        -${economyResult.seatFeeDifference.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              <Button
                variant="secondary"
                onClick={() => {
                  setIsFixingEconomy(true)
                  setEconomyResult(null)
                  
                  setTimeout(() => {
                    // First fix ALL team economics in rivalStore
                    const teamFixResult = fixAllTeamEconomics()
                    console.log(`[Settings] Team economics fix: ${teamFixResult.message}`)
                    
                    // Then fix player's contract economics
                    const result = recalculateEconomy()
                    setEconomyResult(result)
                    setIsFixingEconomy(false)
                    
                    const totalFixed = result.teamsUpdated + teamFixResult.teamsFixed
                    if (totalFixed > 0) {
                      addToast({
                        type: 'success',
                        title: 'Economy Updated!',
                        message: `Fixed ${teamFixResult.teamsFixed} teams, ${result.message}`,
                        duration: 6000
                      })
                    } else {
                      addToast({
                        type: 'info',
                        title: 'No Changes',
                        message: 'All economics already correct.',
                        duration: 4000
                      })
                    }
                  }, 300)
                }}
                disabled={isFixingEconomy}
                className="w-full"
              >
                {isFixingEconomy ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating Economy...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Fix Economy
                  </>
                )}
              </Button>
            </div>

            {/* Reassign Staff Portraits Section */}
            <div className="pt-4 mt-4 border-t border-surface-border">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Reassign Staff Portraits
              </h4>
              <p className="text-xs text-text-muted mb-3">
                Re-imports all staff portraits, assigning a unique image to every staff member in your career. 
                Fixes duplicate portrait images that may have been assigned to different people.
              </p>
              
              {portraitResult && (
                <div className="mb-3 p-3 rounded-lg bg-surface-secondary/50 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Total Staff:</span>
                    <span className="font-mono">{portraitResult.totalStaff}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Portraits Changed:</span>
                    <span className="font-mono font-bold text-blue-400">{portraitResult.reassigned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Duplicates Fixed:</span>
                    <span className={`font-mono font-bold ${portraitResult.duplicatesFixed > 0 ? 'text-green-400' : 'text-text-muted'}`}>
                      {portraitResult.duplicatesFixed}
                    </span>
                  </div>
                </div>
              )}
              
              <Button
                variant="secondary"
                onClick={() => {
                  setIsReassigningPortraits(true)
                  setPortraitResult(null)
                  
                  setTimeout(() => {
                    const result = reassignStaffPortraits()
                    setPortraitResult(result)
                    setIsReassigningPortraits(false)
                    
                    addToast({
                      type: result.reassigned > 0 ? 'success' : 'info',
                      title: result.reassigned > 0 ? 'Staff Portraits Reassigned!' : 'No Changes Needed',
                      message: result.message,
                      duration: 5000
                    })
                  }, 300)
                }}
                disabled={isReassigningPortraits}
                className="w-full"
              >
                {isReassigningPortraits ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Reassigning Portraits...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Reassign Staff Portraits
                  </>
                )}
              </Button>
            </div>

            {/* Upgrade Contracts & Sponsors Section */}
            <div className="pt-4 mt-4 border-t border-surface-border">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-400" />
                Reset Sponsors & Contracts
              </h4>
              <p className="text-xs text-text-muted mb-3">
                <strong>Removes sponsors you no longer qualify for</strong> based on your current reputation ({(Math.round((player?.reputation ?? 0) * 10) / 10).toFixed(1)}%) and marketability ({player?.stats?.marketability ?? 0}%). 
                Remaining sponsors will have their media features reset.
              </p>
              
              {upgradeResult && (
                <div className="mb-3 p-3 rounded-lg text-sm bg-surface-secondary/50 border border-surface-border space-y-2">
                  {upgradeResult.sponsorsRemoved > 0 && (
                    <div className="p-2 bg-red-500/10 border border-red-500/30 rounded">
                      <div className="flex justify-between mb-1">
                        <span className="text-red-400 font-medium">Sponsors Removed:</span>
                        <span className="font-mono text-red-400 font-bold">
                          {upgradeResult.sponsorsRemoved}
                        </span>
                      </div>
                      <p className="text-xs text-red-300/70">
                        {upgradeResult.removedNames.join(', ')}
                      </p>
                    </div>
                  )}
                  {upgradeResult.sponsorsKept > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Sponsors Kept & Reset:</span>
                      <span className="font-mono text-status-success font-bold">
                        {upgradeResult.sponsorsKept}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-muted">Team Contract Updated:</span>
                    <span className={`font-mono ${upgradeResult.contractsUpgraded > 0 ? 'text-status-success font-bold' : 'text-text-muted'}`}>
                      {upgradeResult.contractsUpgraded > 0 ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              )}
              
              <Button
                variant="danger"
                onClick={() => {
                  setIsUpgradingContracts(true)
                  setUpgradeResult(null)
                  
                  setTimeout(() => {
                    const result = upgradeContractsAndSponsors()
                    setUpgradeResult(result)
                    setIsUpgradingContracts(false)
                    
                    addToast({
                      type: result.sponsorsRemoved > 0 ? 'warning' : 'success',
                      title: result.sponsorsRemoved > 0 ? 'Sponsors Removed!' : 'Media System Reset!',
                      message: result.message,
                      duration: 6000
                    })
                  }, 500)
                }}
                disabled={isUpgradingContracts || !player?.contract}
                className="w-full"
              >
                {isUpgradingContracts ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Unqualified & Reset
                  </>
                )}
              </Button>
              
              <p className="text-xs text-text-muted mt-2">
                ⚠️ <strong className="text-red-400">Warning:</strong> This will permanently remove sponsors you no longer meet the requirements for (rep/marketability). 
                Remaining sponsors will be reset with: media duties, sponsor types, shoutout requirements, controversy clauses, and viral bonuses.
              </p>
            </div>

            <p className="text-xs text-text-muted text-center mt-4">
              ⚠️ These actions cannot be undone. Make sure to save your game before proceeding.
            </p>
          </div>
        </Card>
      )}

      {/* Dating preference & replace contacts with romanceable options */}
      {hasActiveCareer && (
        <Card variant="glass" padding="lg">
          <CardHeader 
            title="Dating preference & romanceable contacts" 
            icon={<Heart className="w-5 h-5" />}
          />
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Orientation / dating preference</p>
              <p className="text-xs text-text-muted mb-3">
                Used for romanceable contacts: only people matching this preference can become romantic interests. Others stay friends/business.
              </p>
              <div className="flex flex-wrap gap-2">
                {(['women', 'men', 'both', 'none'] as const).map((pref) => (
                  <Button
                    key={pref}
                    variant={(careerState as { datingPreference?: string })?.datingPreference === pref ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setDatingPreference(pref)}
                  >
                    {pref === 'women' ? 'Women' : pref === 'men' ? 'Men' : pref === 'both' ? 'Both' : 'None'}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-text-muted mt-2">
                Current: <strong className="text-text-primary">
                  {((): string => {
                    const p = (careerState as { datingPreference?: string })?.datingPreference
                    return p === 'women' ? 'Women' : p === 'men' ? 'Men' : p === 'both' ? 'Both' : p === 'none' ? 'None' : 'Not set (defaults to Both)'
                  })()}
                </strong>
              </p>
            </div>

            <div className="pt-4 border-t border-surface-border">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Replace contacts with partner-pool people
              </p>
              <p className="text-xs text-text-muted mb-3">
                Select 1–2 friend or business contacts to replace with new people from the partner pool. Those matching your preference above can become romanceable later; others stay normal contacts.
              </p>
              {(careerState?.messaging?.contacts ?? []).filter((c: { type: string }) => c.type === 'friend' || c.type === 'business').length === 0 ? (
                <p className="text-xs text-text-muted">No friend or business contacts to replace.</p>
              ) : (
                <>
                  <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                    {(careerState?.messaging?.contacts ?? [])
                      .filter((c: { type: string }) => c.type === 'friend' || c.type === 'business')
                      .map((c: { id: string; name: string; type: string }) => (
                        <label key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-background/50 hover:bg-background/70 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={replaceContactIds.includes(c.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (replaceContactIds.length >= 2) return
                                setReplaceContactIds([...replaceContactIds, c.id])
                              } else {
                                setReplaceContactIds(replaceContactIds.filter(id => id !== c.id))
                              }
                            }}
                            className="rounded border-surface-border"
                          />
                          <span className="text-sm text-text-primary">{c.name}</span>
                          <span className="text-xs text-text-muted capitalize">({c.type})</span>
                        </label>
                      ))}
                  </div>
                  <p className="text-xs text-text-muted mb-2">Selected: {replaceContactIds.length} (max 2)</p>
                  {replaceResult && (
                    <div className={`mb-3 p-3 rounded-lg text-sm ${replaceResult.error ? 'bg-red-500/10 border border-red-500/30' : 'bg-status-success/10 border border-status-success/30'}`}>
                      {replaceResult.error ? replaceResult.error : `Replaced ${replaceResult.replaced} contact(s).`}
                    </div>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={replaceContactIds.length === 0 || isReplacingContacts}
                    onClick={() => {
                      setReplaceResult(null)
                      setIsReplacingContacts(true)
                      const result = replaceContactsWithPartnerPool(replaceContactIds)
                      setReplaceResult(result)
                      setIsReplacingContacts(false)
                      if (result.replaced > 0) {
                        setReplaceContactIds([])
                        addToast({ type: 'success', message: `Contacts replaced: ${result.replaced} contact(s) replaced with partner-pool people.` })
                      } else if (result.error) {
                        addToast({ type: 'error', message: result.error })
                      }
                    }}
                  >
                    {isReplacingContacts ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                    Replace selected
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
    </div>
  )
}
