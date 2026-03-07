import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Car,
  Wrench,
  Users,
  TrendingUp,
  Zap,
  Target,
  Award,
  Clock,
  Settings,
  AlertCircle,
  User,
  UserPlus,
  UserMinus,
  Plus,
  ChevronLeft,
  ChevronRight,
  Star,
  Shield,
  TrendingDown,
  Brain,
  Building2,
  Megaphone,
  BarChart3,
  Dumbbell,
  CloudRain,
  BookOpen,
  ShoppingCart,
  RefreshCw,
  AlertTriangle,
  LucideIcon
} from 'lucide-react'
import { StaffPortrait, useToast } from '@/components/ui'
import { useCareerStore, type TeamCar, PART_BASE_COSTS, SERVICE_LEVEL_CONFIG } from '@/store/careerStore'
import type { CarPartWear, ServiceLevel, TeamDriver, PartServiceSelection, HiredDriverContract } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import type { RivalDriver } from '@/store/rivalStore'
import { DevelopmentDashboard } from '@/components/TeamDevelopment'
import { TRAINING_PROGRAMS, calculateLevelProgress, calculateProgramTotalCost } from '@/data/driver-development-config'
import type { TrainingProgram } from '@/data/driver-development-config'
import type { TeamStaffRole } from '@/data/facility-staff-config'
import { AMS2_CAR_CLASSES } from '@/data/ams2-cars'
import { getClassLiveriesFromManifest, getCarClassFolder } from '@/utils/images'
import { getPortraitByManifestId, getFallbackPortrait, getStaffPortrait, getRandomStaffPortraitByRole } from '@/utils/generated-assets'
import { getManufacturerForCarClass, getManufacturer } from '@/data/manufacturers'
import { generatePostImage, type PostImageContext } from '@/services/mediaAI'
import { LiveryGenerator } from '@/components/LiveryGenerator'

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }
const CARD = 'bg-[rgba(255,255,255,0.8)] border-[1.6px] border-black rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] overflow-hidden'

const garageCarImageCache = new Map<string, string>()
const garageCarImageInFlight = new Map<string, Promise<string | null>>()
const GARAGE_IMAGE_DB_NAME = 'garage-image-cache'
const GARAGE_IMAGE_STORE_NAME = 'images'
const GARAGE_IMAGE_KEY_PREFIX = 'owner-car::'
let garageImageDbPromise: Promise<IDBDatabase> | null = null

function openGarageImageDb(): Promise<IDBDatabase> {
  if (garageImageDbPromise) return garageImageDbPromise
  garageImageDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(GARAGE_IMAGE_DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(GARAGE_IMAGE_STORE_NAME)) {
        db.createObjectStore(GARAGE_IMAGE_STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Failed to open Garage image cache DB'))
  })
  return garageImageDbPromise
}

async function getPersistentGarageImage(cacheKey: string): Promise<string | null> {
  try {
    const db = await openGarageImageDb()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(GARAGE_IMAGE_STORE_NAME, 'readonly')
      const store = tx.objectStore(GARAGE_IMAGE_STORE_NAME)
      const req = store.get(cacheKey)
      req.onsuccess = () => resolve((req.result as string) || null)
      req.onerror = () => reject(req.error || new Error('Failed to read cached Garage image'))
    })
  } catch { return null }
}

async function setPersistentGarageImage(cacheKey: string, imageData: string): Promise<void> {
  try {
    const db = await openGarageImageDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(GARAGE_IMAGE_STORE_NAME, 'readwrite')
      const store = tx.objectStore(GARAGE_IMAGE_STORE_NAME)
      const req = store.put(imageData, cacheKey)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error || new Error('Failed to persist Garage image'))
    })
  } catch { /* swallow */ }
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`
  return `$${amount}`
}

function getRoleDisplayName(role: TeamStaffRole): string {
  switch (role) {
    case 'chief_engineer': return 'Chief Engineer'
    case 'strategist': return 'Race Strategist'
    case 'team_manager': return 'Team Manager'
    case 'pr_manager': return 'PR Manager'
    case 'technical_director': return 'Technical Director'
    case 'reserve_driver': return 'Reserve Driver'
    case 'crew_chief': return 'Crew Chief'
    case 'data_engineer': return 'Data Engineer'
    default: return role
  }
}

function getWearStatusColor(wear: number): string {
  if (wear >= 90) return 'text-[#ef4444]'
  if (wear >= 70) return 'text-[#f59e0b]'
  if (wear >= 50) return 'text-[#f97316]'
  return 'text-[#00a63e]'
}

function calculatePerformancePenalty(partWear: CarPartWear): number {
  const parts: (keyof CarPartWear)[] = ['engine', 'chassis', 'gearbox', 'brakes', 'suspension']
  let totalPenalty = 0
  const weights = {
    engine: 0.3,
    chassis: 0.25,
    gearbox: 0.15,
    brakes: 0.15,
    suspension: 0.15
  }
  for (const part of parts) {
    const wear = partWear[part]
    if (wear >= 70) {
      const severity = wear >= 90 ? 3 : wear >= 80 ? 2 : 1
      totalPenalty += severity * weights[part]
    }
  }
  return Math.round(totalPenalty)
}

function getSpecializationDisplay(specId: string): { name: string; rarity: string } {
  return { name: specId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), rarity: 'common' }
}

export function Garage() {
  const {
    player,
    careerState,
    getAIModifier,
    serviceCar,
    serviceCarGranular,
    getManufacturerDiscount,
    getHiredDriver,
    signHiredDriver,
    releaseHiredDriver,
    getStaffByRole,
    releaseStaff,
    _hasSecondCarSlot,
    _addTransaction,
    startDriverTraining,
    cancelDriverTraining,
    consumeHoursFromBudget,
    addPersonalCalendarEntry
  } = useCareerStore()
  const { series, teams, rivals } = useRivalStore()
  const { addToast } = useToast()
  const navigate = useNavigate()

  // Fleet carousel state
  const [selectedCarIndex, setSelectedCarIndex] = useState(0)

  // Service modal state
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [selectedCar, setSelectedCar] = useState<TeamCar | null>(null)
  const [selectedServiceType, setSelectedServiceType] = useState<'full' | 'partial' | 'replacement'>('full')
  const [selectedPartToReplace, setSelectedPartToReplace] = useState<keyof CarPartWear | null>(null)
  const [partServiceSelections, setPartServiceSelections] = useState<Record<keyof CarPartWear, ServiceLevel | null>>({
    engine: null, chassis: null, gearbox: null, brakes: null, suspension: null
  })
  const [showServiceAllModal, setShowServiceAllModal] = useState(false)

  // Staff management state
  const [showHireDriverModal, setShowHireDriverModal] = useState(false)
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false)
  const [releaseTarget, setReleaseTarget] = useState<{ type: 'staff' | 'driver'; id: string; name: string } | null>(null)

  // Development state
  const [showDevelopmentModal, setShowDevelopmentModal] = useState(false)
  const [selectedDriverForDev, setSelectedDriverForDev] = useState<string | null>(null)
  const [generatedOwnerCarImage, setGeneratedOwnerCarImage] = useState<string | null>(null)
  const [isGeneratingOwnerCarImage, setIsGeneratingOwnerCarImage] = useState(false)
  const [ownerCarImageRevision, setOwnerCarImageRevision] = useState(0)
  const forceOwnerCarRefreshRef = useRef(false)

  // Setup modal (new for Figma design)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [showLiveryGenerator, setShowLiveryGenerator] = useState(false)

  // Granular service cost
  const granularServiceCost = useMemo(() => {
    if (!selectedCar || !careerState?.ownedTeam) return 0
    const tier = careerState.ownedTeam.tier || 'amateur'
    const tierMultipliers: Record<string, number> = {
      entry: 0.5, amateur: 0.75, semi_pro: 1.0, professional: 1.5, elite: 2.5, pinnacle: 5.0
    }
    const tierMultiplier = tierMultipliers[tier] || 1.0
    let total = 0
    const parts: (keyof CarPartWear)[] = ['engine', 'chassis', 'gearbox', 'brakes', 'suspension']
    for (const part of parts) {
      const level = partServiceSelections[part]
      if (level) {
        const config = SERVICE_LEVEL_CONFIG[level]
        total += Math.round(PART_BASE_COSTS[part] * config.costMultiplier * tierMultiplier)
      }
    }
    return total
  }, [selectedCar, careerState?.ownedTeam, partServiceSelections])

  const handleGranularService = () => {
    if (!selectedCar) return
    const selections: PartServiceSelection[] = []
    const parts: (keyof CarPartWear)[] = ['engine', 'chassis', 'gearbox', 'brakes', 'suspension']
    for (const part of parts) {
      const level = partServiceSelections[part]
      if (level) selections.push({ part, level })
    }
    if (selections.length === 0) return
    const result = serviceCarGranular(selectedCar.carId, selections)
    if (result) {
      addToast({ type: 'success', message: `Service completed on ${selectedCar.liveryName || selectedCar.chassisId}`, duration: 3000 })
      setShowServiceModal(false)
      setPartServiceSelections({ engine: null, chassis: null, gearbox: null, brakes: null, suspension: null })
    } else {
      addToast({ type: 'error', message: 'Service failed. Check your budget.', duration: 3000 })
    }
  }

  const openServiceModal = (car: TeamCar) => {
    setSelectedCar(car)
    setSelectedServiceType('full')
    setSelectedPartToReplace(null)
    setShowServiceModal(true)
  }

  if (!player) return null

  const teamsArray = Array.isArray(teams) ? teams : []
  const seriesArray = Array.isArray(series) ? series : []
  const resolvedSeriesId = player.currentSeriesId || careerState?.seriesEntries?.[0]?.seriesId
  const currentSeries = seriesArray.find(s => s.id === resolvedSeriesId)
  const currentTeam = teamsArray.find(t => t.id === player.currentTeamId)
  const ownedTeam = careerState?.ownedTeam
  const rosterDrivers = ownedTeam?.drivers || []
  const rosterBudget = ownedTeam?.budgets?.cash || 0
  const cars = careerState?.cars || []

  const hiredDriver = rosterDrivers.find(d => d.driverId !== player?.id)
  const hiredDriverRival = hiredDriver ? rivals.find(r => r.id === hiredDriver.driverId) : null

  const ownerCar = cars.find(c => c.driverType === 'owner') || (cars.length > 0 && !cars.some(c => c.driverType === 'owner') ? cars[0] : undefined)
  const secondCar = cars.find(c => c.driverType === 'hired' || (c.driverType === 'unassigned' && c !== ownerCar))
  const activeSponsorNames = useMemo(
    () => (ownedTeam?.finances?.sponsors || []).filter(s => s.active).map(s => s.sponsorName).filter(Boolean),
    [ownedTeam?.finances?.sponsors]
  )

  const ownerCarImageKey = useMemo(() => {
    if (!ownerCar) return ''
    const sponsorSignature = [...activeSponsorNames].sort().join('|') || 'no-sponsors'
    return [GARAGE_IMAGE_KEY_PREFIX, ownerCar.carId, ownerCar.chassisId, ownerCar.engineId, ownerCar.liveryName || '', sponsorSignature].join('::')
  }, [ownerCar?.carId, ownerCar?.chassisId, ownerCar?.engineId, ownerCar?.liveryName, activeSponsorNames])

  const handleRegenerateOwnerCarImage = () => {
    forceOwnerCarRefreshRef.current = true
    setOwnerCarImageRevision(prev => prev + 1)
  }

  useEffect(() => {
    if (!ownerCar || !ownerCarImageKey) {
      setGeneratedOwnerCarImage(null)
      setIsGeneratingOwnerCarImage(false)
      return
    }
    let cancelled = false
    const forceRefresh = forceOwnerCarRefreshRef.current
    forceOwnerCarRefreshRef.current = false

    const resolveImage = async () => {
      if (!forceRefresh) {
        const memoryCached = garageCarImageCache.get(ownerCarImageKey)
        if (memoryCached) {
          if (!cancelled) { setGeneratedOwnerCarImage(memoryCached); setIsGeneratingOwnerCarImage(false) }
          return
        }
        const persistentCached = await getPersistentGarageImage(ownerCarImageKey)
        if (persistentCached) {
          garageCarImageCache.set(ownerCarImageKey, persistentCached)
          if (!cancelled) { setGeneratedOwnerCarImage(persistentCached); setIsGeneratingOwnerCarImage(false) }
          return
        }
      }
      setGeneratedOwnerCarImage(ownerCar.liveryPath || null)
      setIsGeneratingOwnerCarImage(true)

      const seriesMeta = ownerCar.seriesId ? seriesArray.find(s => s.id === ownerCar.seriesId) : undefined
      const carClassMeta = ownerCar.seriesId ? AMS2_CAR_CLASSES.find(c => c.id === ownerCar.seriesId) : undefined
      const manufacturerMeta = carClassMeta ? getManufacturerForCarClass(carClassMeta.id) : null

      const imageContext: PostImageContext = {
        postType: 'race_photo',
        tone: 'professional',
        playerName: `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Team Principal',
        teamName: ownedTeam?.name || currentTeam?.name || 'Your Team',
        seriesName: seriesMeta?.name || currentSeries?.name || 'Racing Series',
        teamTier: ownedTeam?.tier || currentTeam?.tier,
        carCount: cars.length,
        carType: carClassMeta?.name || manufacturerMeta?.name || 'race car',
        carModelName: ownerCar.liveryName || ownerCar.chassisId,
        carLiveryName: ownerCar.liveryName,
        carLiveryPath: ownerCar.liveryPath,
        carChassisId: ownerCar.chassisId,
        carEngineId: ownerCar.engineId,
        hasSeriesEntry: !!ownerCar.seriesId,
        staffCount: (ownedTeam?.staff?.length ?? 0) + (ownedTeam?.facilityStaff?.length ?? 0),
        sponsorNames: activeSponsorNames,
        isFirstSeason: (player.seasonsCompleted ?? 0) === 0,
        seasonsCompleted: player.seasonsCompleted ?? 0,
        baseCountry: ownedTeam?.baseCountry,
      }

      const inFlightKey = forceRefresh ? `${ownerCarImageKey}::refresh::${ownerCarImageRevision}` : ownerCarImageKey
      let inFlight = garageCarImageInFlight.get(inFlightKey)
      if (!inFlight) {
        inFlight = (async () => {
          try {
            const generatedImage = await generatePostImage(imageContext)
            const finalImage = generatedImage || ownerCar.liveryPath || null
            if (finalImage) {
              garageCarImageCache.set(ownerCarImageKey, finalImage)
              await setPersistentGarageImage(ownerCarImageKey, finalImage)
            }
            return finalImage
          } finally {
            garageCarImageInFlight.delete(inFlightKey)
          }
        })()
        garageCarImageInFlight.set(inFlightKey, inFlight)
      }

      const finalImage = await inFlight
      if (cancelled) return
      setGeneratedOwnerCarImage(finalImage)
      setIsGeneratingOwnerCarImage(false)
    }

    void resolveImage()
    return () => { cancelled = true }
  }, [ownerCarImageKey, ownerCar, seriesArray, ownedTeam?.name, ownedTeam?.tier, ownedTeam?.baseCountry,
    ownedTeam?.staff?.length, ownedTeam?.facilityStaff?.length, currentTeam?.name, currentTeam?.tier,
    currentSeries?.name, cars.length, activeSponsorNames, player.firstName, player.lastName,
    player.seasonsCompleted, ownerCarImageRevision])

  const devModalDriver = selectedDriverForDev
    ? rosterDrivers.find(d => d.driverId === selectedDriverForDev) : null
  const devModalRival = devModalDriver
    ? rivals.find(r => r.id === devModalDriver.driverId) : null

  const handleOpenDevelopment = (driverId: string) => {
    setSelectedDriverForDev(driverId)
    setShowDevelopmentModal(true)
  }

  const handleStartTraining = (driverId: string, programId: string) => {
    const result = startDriverTraining(driverId, programId)
    if (result.success) {
      const program = TRAINING_PROGRAMS[programId as TrainingProgram]
      addToast({ type: 'success', message: `Started ${program?.name || programId} program.`, duration: 3000 })
    } else {
      addToast({ type: 'error', message: result.error || 'Could not start training program.', duration: 3000 })
    }
  }

  const handleCancelTraining = (driverId: string) => {
    cancelDriverTraining(driverId)
    addToast({ type: 'info', message: 'The training program has been cancelled.', duration: 3000 })
  }

  // ============================================
  // COMPUTED DATA FOR FIGMA LAYOUT
  // ============================================
  const totalVehicles = cars.length
  const staffMembers = (ownedTeam?.staff?.length ?? 0) + (ownedTeam?.facilityStaff?.length ?? 0) + rosterDrivers.length
  const teamRating = ownedTeam?.reputation ?? player?.reputation ?? 50

  // Current car in carousel
  const currentCar = cars.length > 0 ? cars[Math.min(selectedCarIndex, cars.length - 1)] : null

  // Key staff: owner + hired driver + top staff members
  const keyStaff: { name: string; role: string; rating: number; portrait?: string }[] = []
  keyStaff.push({
    name: `${player.firstName} ${player.lastName}`.toUpperCase(),
    role: 'Lead Driver',
    rating: Math.round(((player.stats?.raceSkill ?? 0.7) + (player.stats?.qualifyingSkill ?? 0.7) + (player.stats?.consistency ?? 0.7)) / 3 * 100)
  })
  if (hiredDriverRival) {
    keyStaff.push({
      name: `${hiredDriverRival.firstName} ${hiredDriverRival.lastName}`.toUpperCase(),
      role: 'Driver',
      rating: Math.round((hiredDriverRival.stats.raceSkill + hiredDriverRival.stats.qualifyingSkill + hiredDriverRival.stats.consistency) / 3 * 100)
    })
  }
  const chiefEngineer = getStaffByRole('chief_engineer')
  if (chiefEngineer) {
    keyStaff.push({
      name: chiefEngineer.name.toUpperCase(),
      role: 'Chief Engineer',
      rating: Math.round(((chiefEngineer.skills?.reliability ?? 50) + (chiefEngineer.skills?.strategy ?? 50) + (chiefEngineer.skills?.pit ?? 50)) / 3),
      portrait: chiefEngineer.portraitId ? getPortraitByManifestId(chiefEngineer.portraitId) || undefined : undefined
    })
  }
  const teamManager = getStaffByRole('team_manager')
  if (teamManager) {
    keyStaff.push({
      name: teamManager.name.toUpperCase(),
      role: 'Team Principal',
      rating: Math.round(((teamManager.skills?.reliability ?? 50) + (teamManager.skills?.strategy ?? 50) + (teamManager.skills?.pit ?? 50)) / 3),
      portrait: teamManager.portraitId ? getPortraitByManifestId(teamManager.portraitId) || undefined : undefined
    })
  }

  // Facilities data
  const facilities = ownedTeam?.facilities
  const facilityItems: { name: string; level: number; progress: number }[] = []
  if (facilities) {
    const fMap: Record<string, string> = { aero: 'AERO', chassis: 'CHASSIS', engine: 'ENGINE', sim: 'SIM LAB', manufacturing: 'MANUFACTURING', marketing: 'MARKETING' }
    for (const [key, label] of Object.entries(fMap)) {
      const f = (facilities as any)[key]
      if (f) {
        const lvl = typeof f === 'number' ? f : f.level || 1
        facilityItems.push({ name: label, level: lvl, progress: Math.min((lvl / 5) * 100, 100) })
      }
    }
  }

  // Car stats for the carousel card
  const getCarStats = (car: TeamCar) => {
    const perf = car.performance ?? 0
    const rel = car.reliability ?? 0
    const avgWear = car.partWear ? Math.round(Object.values(car.partWear).reduce((s, v) => s + v, 0) / 5) : 0
    const durability = Math.max(0, 100 - avgWear)
    const handling = Math.round((perf + rel) / 2)
    return { speed: perf, accel: Math.round(perf * 0.92), handling, durability }
  }

  // Performance stats
  const totalRaces = player.totalRaces || 0
  const totalWins = player.totalWins || 0
  const totalPodiums = player.totalPodiums || 0
  const winRate = totalRaces > 0 ? Math.round((totalWins / totalRaces) * 100) : 0
  const podiumRate = totalRaces > 0 ? Math.round((totalPodiums / totalRaces) * 100) : 0
  const avgFinish = player.raceHistory && player.raceHistory.length > 0
    ? (player.raceHistory.reduce((sum, r) => sum + (r.position || 0), 0) / player.raceHistory.length).toFixed(1)
    : '—'

  // Maintenance items: cars with high wear components
  const maintenanceItems: { carName: string; issue: string; urgency: string }[] = []
  cars.forEach(car => {
    if (!car.partWear) return
    const parts: (keyof CarPartWear)[] = ['engine', 'chassis', 'gearbox', 'brakes', 'suspension']
    const worstPart = parts.reduce((worst, p) => car.partWear[p] > car.partWear[worst] ? p : worst, parts[0])
    const wear = car.partWear[worstPart]
    if (wear >= 50) {
      maintenanceItems.push({
        carName: (car.liveryName || car.chassisId || 'Car').toUpperCase(),
        issue: `${worstPart.charAt(0).toUpperCase() + worstPart.slice(1)} Service`,
        urgency: wear >= 90 ? 'CRITICAL' : wear >= 70 ? 'SOON' : 'MONITOR'
      })
    }
  })

  // Current car data
  const curCarStats = currentCar ? getCarStats(currentCar) : null
  const curCarSeries = currentCar?.seriesId ? seriesArray.find(s => s.id === currentCar.seriesId) : null
  const curCarClass = currentCar?.seriesId ? AMS2_CAR_CLASSES.find(c => c.id === currentCar.seriesId) : null
  const hasCriticalWear = currentCar?.partWear && Object.values(currentCar.partWear).some(w => w >= 90)
  const carImage = currentCar && ownerCar?.carId === currentCar.carId ? generatedOwnerCarImage : currentCar?.liveryPath

  return (
    <div className="bg-white w-full h-full overflow-y-auto relative">
      {/* Decorative blurs */}
      <div className="absolute bg-[#f3f4f6] blur-[64px] rounded-full w-[384px] h-[384px] right-0 top-0 pointer-events-none" />
      <div className="absolute bg-[#f9fafb] blur-[64px] rounded-full w-[384px] h-[384px] left-0 bottom-0 pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-[24px] p-[24px] h-full">
        {/* Header */}
        <div>
          <h1 className="text-[24px] text-black tracking-[-1.2px] leading-[32px]" style={FB}>GARAGE</h1>
          <p className="text-[12px] text-[#4a5565] leading-[16px]" style={FR}>Manage your team, vehicles, and facilities</p>
        </div>

        {/* 3-Column Layout */}
        <div className="flex gap-[16px] flex-1 min-h-0">

          {/* ====== LEFT COLUMN ====== */}
          <div className="w-[24%] flex flex-col gap-[16px] min-w-0">

            {/* Team Overview */}
            <div className={CARD}>
              <div className="border-b-[1.6px] border-black px-[16px] py-[16px]">
                <p className="text-[14px] text-black tracking-[-0.7px] leading-[20px]" style={FB}>TEAM OVERVIEW</p>
              </div>
              <div className="p-[16px] flex flex-col gap-[16px]">
                <div>
                  <p className="text-[12px] text-[#4a5565] leading-[16px]" style={FB}>TOTAL VEHICLES</p>
                  <p className="text-[36px] text-black leading-[40px]" style={FB}>{totalVehicles}</p>
                </div>
                <div>
                  <p className="text-[12px] text-[#4a5565] leading-[16px]" style={FB}>STAFF MEMBERS</p>
                  <p className="text-[36px] text-black leading-[40px]" style={FB}>{staffMembers}</p>
                </div>
                <div>
                  <p className="text-[12px] text-[#4a5565] leading-[16px]" style={FB}>TEAM RATING</p>
                  <p className="text-[36px] text-black leading-[40px]" style={FB}>{teamRating}</p>
                </div>
              </div>
            </div>

            {/* Key Staff */}
            <button onClick={() => navigate('/staff-market')} className={`${CARD} flex-1 min-h-0 text-left w-full`}>
              <div className="border-b-[1.6px] border-black px-[16px] py-[16px] flex items-center justify-between">
                <div className="flex items-center gap-[8px]">
                  <Users className="w-[16px] h-[16px] text-black" />
                  <p className="text-[14px] text-black tracking-[-0.7px] leading-[20px]" style={FB}>KEY STAFF</p>
                </div>
                <ChevronRight className="w-[16px] h-[16px] text-black" />
              </div>
              <div className="overflow-y-auto">
                {keyStaff.map((s, i) => (
                  <div key={i} className={`flex items-center gap-[12px] px-[12px] py-[12px] ${i < keyStaff.length - 1 ? 'border-b-[1.6px] border-[#f3f4f6]' : ''}`}>
                    <div className="w-[40px] h-[40px] rounded-full bg-[#f3f4f6] border-[1.6px] border-black flex items-center justify-center overflow-hidden shrink-0">
                      {s.portrait ? (
                        <img src={s.portrait} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-[20px] h-[20px] text-[#4a5565]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-black leading-[16px] truncate" style={FB}>{s.name}</p>
                      <p className="text-[10px] text-[#4a5565] leading-[15px]" style={FR}>{s.role}</p>
                    </div>
                    <p className="text-[20px] text-black leading-[28px] shrink-0" style={FB}>{s.rating}</p>
                  </div>
                ))}
              </div>
            </button>

            {/* Facilities */}
            <button onClick={() => navigate('/facilities')} className={`${CARD} text-left w-full`}>
              <div className="border-b-[1.6px] border-black px-[16px] py-[16px] flex items-center justify-between">
                <div className="flex items-center gap-[8px]">
                  <Building2 className="w-[16px] h-[16px] text-black" />
                  <p className="text-[14px] text-black tracking-[-0.7px] leading-[20px]" style={FB}>FACILITIES</p>
                </div>
                <ChevronRight className="w-[16px] h-[16px] text-black" />
              </div>
              <div className="p-[16px] flex flex-col gap-[12px]">
                {facilityItems.length > 0 ? facilityItems.slice(0, 3).map((f, i) => (
                  <div key={i} className="bg-[#f9fafb] border-[1.6px] border-[#e5e7eb] rounded-[14px] px-[14px] py-[14px]">
                    <div className="flex items-center justify-between mb-[8px]">
                      <p className="text-[12px] text-black leading-[16px]" style={FB}>{f.name}</p>
                      <div className="flex items-center gap-[8px]">
                        <p className="text-[12px] text-[#4a5565] leading-[16px]" style={FR}>LVL {f.level}</p>
                        <p className="text-[14px] text-black leading-[20px]" style={FB}>{Math.round(f.progress)}%</p>
                      </div>
                    </div>
                    <div className="h-[8px] bg-[#e5e7eb] rounded-full overflow-hidden">
                      <div className="h-full bg-black rounded-full" style={{ width: `${f.progress}%` }} />
                    </div>
                  </div>
                )) : (
                  <p className="text-[12px] text-[#4a5565] text-center py-[16px]" style={FR}>No facilities yet</p>
                )}
              </div>
            </button>
          </div>

          {/* ====== CENTER COLUMN ====== */}
          <div className="flex-1 flex flex-col gap-[16px] min-w-0">

            {/* Your Fleet Header */}
            <div className={`${CARD} px-[18px] py-[18px] flex items-center justify-between`}>
              <div>
                <p className="text-[24px] text-black tracking-[-1.2px] leading-[32px]" style={FB}>YOUR FLEET</p>
                <p className="text-[12px] text-[#4a5565] leading-[16px]" style={FR}>
                  {cars.length > 0 ? `Vehicle ${selectedCarIndex + 1} of ${cars.length}` : 'No vehicles'}
                </p>
              </div>
              <button
                onClick={() => navigate('/marketplace')}
                className="bg-black rounded-[16px] px-[16px] h-[32px] flex items-center gap-[8px]"
              >
                <Plus className="w-[16px] h-[16px] text-white" />
                <span className="text-[12px] text-white leading-[16px]" style={FB}>BUY CAR</span>
              </button>
            </div>

            {/* Car Showcase */}
            <div className={`${CARD} flex-1 min-h-0 flex flex-col`}>
              {currentCar ? (
                <>
                  {/* Car Image */}
                  <div className="relative bg-[#f3f4f6] border-b-[1.6px] border-black h-[50%] min-h-[200px] overflow-hidden">
                    {carImage ? (
                      <img
                        src={carImage}
                        alt={currentCar.liveryName || 'Car'}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-[64px] h-[64px] text-[#4a5565] opacity-30" />
                      </div>
                    )}

                    {/* Left/Right arrows */}
                    {cars.length > 1 && (
                      <>
                        <button
                          onClick={() => setSelectedCarIndex(i => (i - 1 + cars.length) % cars.length)}
                          className="absolute left-[16px] top-1/2 -translate-y-1/2 bg-[rgba(0,0,0,0.8)] rounded-full w-[48px] h-[48px] flex items-center justify-center"
                        >
                          <ChevronLeft className="w-[24px] h-[24px] text-white" />
                        </button>
                        <button
                          onClick={() => setSelectedCarIndex(i => (i + 1) % cars.length)}
                          className="absolute right-[16px] top-1/2 -translate-y-1/2 bg-[rgba(0,0,0,0.8)] rounded-full w-[48px] h-[48px] flex items-center justify-center"
                        >
                          <ChevronRight className="w-[24px] h-[24px] text-white" />
                        </button>
                      </>
                    )}

                    {/* Dots */}
                    {cars.length > 1 && (
                      <div className="absolute bottom-[16px] left-1/2 -translate-x-1/2 flex items-center gap-[8px]">
                        {cars.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedCarIndex(i)}
                            className={`rounded-full ${i === selectedCarIndex ? 'w-[32px] h-[8px] bg-white' : 'w-[8px] h-[8px] bg-white/50'}`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Status badge */}
                    <div className={`absolute top-[16px] right-[16px] ${hasCriticalWear ? 'bg-[#ef4444]' : 'bg-black'} rounded-full px-[16px] py-[8px]`}>
                      <p className="text-[14px] text-white leading-[20px]" style={FB}>
                        {hasCriticalWear ? 'SERVICE NEEDED' : 'RACE READY'}
                      </p>
                    </div>
                  </div>

                  {/* Car Info + Stats + Buttons */}
                  <div className="p-[24px] flex flex-col gap-[16px] flex-1">
                    {/* Name & Description */}
                    <div>
                      <p className="text-[30px] text-black tracking-[-1.5px] leading-[36px]" style={FB}>
                        {(currentCar.liveryName || currentCar.chassisId || 'Unknown Car').toUpperCase()}
                      </p>
                      <p className="text-[14px] text-[#4a5565] leading-[20px]" style={FR}>
                        {curCarClass?.name || curCarSeries?.name || 'Racing'} • {currentCar.mileage ? `${Math.round(currentCar.mileage).toLocaleString()} km` : '0 km'}
                      </p>
                    </div>

                    {/* 4 Stat Cards */}
                    {curCarStats && (
                      <div className="grid grid-cols-4 gap-[12px] flex-1">
                        {([
                          { label: 'SPEED', value: curCarStats.speed, icon: <Zap className="w-[16px] h-[16px] text-black" /> },
                          { label: 'ACCEL', value: curCarStats.accel, icon: <TrendingUp className="w-[16px] h-[16px] text-black" /> },
                          { label: 'HANDLING', value: curCarStats.handling, icon: <Target className="w-[16px] h-[16px] text-black" /> },
                          { label: 'DURABILITY', value: curCarStats.durability, icon: <Shield className="w-[16px] h-[16px] text-black" /> }
                        ] as const).map(stat => (
                          <div key={stat.label} className="bg-[#f9fafb] border-[1.6px] border-[#e5e7eb] rounded-[14px] p-[18px] flex flex-col gap-[8px]">
                            <div className="flex items-center gap-[8px]">
                              {stat.icon}
                              <p className="text-[12px] text-black leading-[16px]" style={FB}>{stat.label}</p>
                            </div>
                            <p className="text-[30px] text-black leading-[36px]" style={FB}>{stat.value}</p>
                            <div className="h-[8px] bg-[#e5e7eb] rounded-full overflow-hidden mt-auto">
                              <div className="h-full bg-black rounded-full" style={{ width: `${stat.value}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 4 Action Buttons */}
                    <div className="grid grid-cols-4 gap-[12px]">
                      <button
                        onClick={() => setShowSetupModal(true)}
                        className="bg-black rounded-[14px] h-[43px] flex items-center justify-center gap-[8px]"
                      >
                        <Settings className="w-[16px] h-[16px] text-white" />
                        <span className="text-[12px] text-white" style={FB}>SETUP</span>
                      </button>
                      <button
                        onClick={() => currentCar && openServiceModal(currentCar)}
                        className="bg-white border-[1.6px] border-black rounded-[14px] h-[43px] flex items-center justify-center gap-[8px]"
                      >
                        <Wrench className="w-[16px] h-[16px] text-black" />
                        <span className="text-[12px] text-black" style={FB}>REPAIR</span>
                      </button>
                      <button
                        onClick={() => navigate('/manufacturing')}
                        className="bg-white border-[1.6px] border-black rounded-[14px] h-[43px] flex items-center justify-center gap-[8px]"
                      >
                        <TrendingUp className="w-[16px] h-[16px] text-black" />
                        <span className="text-[12px] text-black" style={FB}>UPGRADE</span>
                      </button>
                      <button
                        onClick={() => setShowLiveryGenerator(true)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-[14px] h-[43px] flex items-center justify-center gap-[8px]"
                      >
                        <Star className="w-[16px] h-[16px] text-white" />
                        <span className="text-[12px] text-white" style={FB}>LIVERY</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-[40px]">
                  <Car className="w-[64px] h-[64px] text-[#4a5565] opacity-30 mb-[16px]" />
                  <p className="text-[18px] text-black mb-[8px]" style={FB}>No Cars in Fleet</p>
                  <p className="text-[14px] text-[#4a5565] text-center mb-[16px]" style={FR}>
                    Visit the Marketplace to purchase your first vehicle.
                  </p>
                  <button
                    onClick={() => navigate('/marketplace')}
                    className="bg-black rounded-[14px] px-[24px] h-[43px] flex items-center gap-[8px]"
                  >
                    <ShoppingCart className="w-[16px] h-[16px] text-white" />
                    <span className="text-[12px] text-white" style={FB}>BROWSE MARKETPLACE</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ====== RIGHT COLUMN ====== */}
          <div className="w-[24%] flex flex-col gap-[16px] min-w-0">

            {/* Development */}
            <button onClick={() => navigate('/manufacturing')} className={`${CARD} text-left w-full`}>
              <div className="border-b-[1.6px] border-black px-[16px] py-[16px] flex items-center justify-between">
                <p className="text-[14px] text-black tracking-[-0.7px] leading-[20px]" style={FB}>DEVELOPMENT</p>
                <ChevronRight className="w-[16px] h-[16px] text-black" />
              </div>
              <div>
                {cars.length > 0 ? (
                  <div>
                    {cars.slice(0, 3).map((car, i) => {
                      const avgWear = car.partWear ? Math.round(Object.values(car.partWear).reduce((s, v) => s + v, 0) / 5) : 0
                      const progress = Math.max(0, 100 - avgWear)
                      return (
                        <div key={car.carId} className={`px-[12px] py-[12px] flex flex-col gap-[8px] ${i < Math.min(cars.length, 3) - 1 ? 'border-b-[1.6px] border-[#f3f4f6]' : ''}`}>
                          <div className="flex items-center justify-between">
                            <p className="text-[12px] text-black leading-[16px]" style={FB}>
                              {(car.liveryName || car.chassisId || 'Car').substring(0, 20)}
                            </p>
                            <p className="text-[10px] text-[#4a5565] leading-[15px]" style={FR}>
                              {avgWear >= 70 ? 'NEEDS SERVICE' : 'READY'}
                            </p>
                          </div>
                          <div className="h-[8px] bg-[#e5e7eb] rounded-full overflow-hidden">
                            <div className="h-full bg-black rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-[12px] text-[#4a5565] text-center py-[24px]" style={FR}>No active projects</p>
                )}
              </div>
            </button>

            {/* Maintenance */}
            <div className={CARD}>
              <div className="border-b-[1.6px] border-black px-[16px] py-[16px] flex items-center gap-[8px]">
                <Wrench className="w-[16px] h-[16px] text-black" />
                <p className="text-[14px] text-black tracking-[-0.7px] leading-[20px]" style={FB}>MAINTENANCE</p>
              </div>
              <div>
                {maintenanceItems.length > 0 ? maintenanceItems.slice(0, 3).map((m, i) => (
                  <div key={i} className={`px-[12px] py-[12px] flex flex-col gap-[4px] ${i < Math.min(maintenanceItems.length, 3) - 1 ? 'border-b-[1.6px] border-[#f3f4f6]' : ''}`}>
                    <p className="text-[12px] text-black leading-[16px]" style={FB}>{m.carName}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-[#4a5565] leading-[15px]" style={FR}>{m.issue}</p>
                      <p className="text-[10px] text-black leading-[15px]" style={FB}>{m.urgency}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-[12px] text-[#4a5565] text-center py-[24px]" style={FR}>All cars in good condition</p>
                )}
              </div>
            </div>

            {/* Performance */}
            <div className={`${CARD} flex-1 min-h-0`}>
              <div className="border-b-[1.6px] border-black px-[16px] py-[16px] flex items-center gap-[8px]">
                <Star className="w-[16px] h-[16px] text-black" />
                <p className="text-[14px] text-black tracking-[-0.7px] leading-[20px]" style={FB}>PERFORMANCE</p>
              </div>
              <div className="p-[16px] flex flex-col gap-[16px]">
                <div>
                  <p className="text-[12px] text-[#4a5565] leading-[16px]" style={FB}>WIN RATE</p>
                  <p className="text-[36px] text-black leading-[40px]" style={FB}>{winRate}%</p>
                  <div className="h-[8px] bg-[#e5e7eb] rounded-full overflow-hidden mt-[4px]">
                    <div className="h-full bg-black rounded-full" style={{ width: `${winRate}%` }} />
                  </div>
                </div>
                <div>
                  <p className="text-[12px] text-[#4a5565] leading-[16px]" style={FB}>PODIUM RATE</p>
                  <p className="text-[36px] text-black leading-[40px]" style={FB}>{podiumRate}%</p>
                  <div className="h-[8px] bg-[#e5e7eb] rounded-full overflow-hidden mt-[4px]">
                    <div className="h-full bg-black rounded-full" style={{ width: `${podiumRate}%` }} />
                  </div>
                </div>
                <div>
                  <p className="text-[12px] text-[#4a5565] leading-[16px]" style={FB}>AVG FINISH</p>
                  <p className="text-[36px] text-black leading-[40px]" style={FB}>{avgFinish}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MODALS */}
      {/* ============================================ */}

      {/* Service Modal */}
      {showServiceModal && selectedCar && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={(e: any) => { if (e.target === e.currentTarget) { setShowServiceModal(false); setPartServiceSelections({ engine: null, chassis: null, gearbox: null, brakes: null, suspension: null }) } }}>
          <div className="bg-white rounded-[24px] w-full max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e: any) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-[20px] border-b-[1.6px] border-black">
              <h2 className="text-[20px] text-black" style={FB}>CAR SERVICE</h2>
              <button onClick={() => { setShowServiceModal(false); setPartServiceSelections({ engine: null, chassis: null, gearbox: null, brakes: null, suspension: null }) }} className="p-[4px] rounded-full hover:bg-black/5">
                <span className="text-[18px]">✕</span>
              </button>
            </div>
            <div className="p-[20px] overflow-y-auto space-y-[16px]">
              {/* Car Info */}
              <div className="p-[16px] bg-[#f9fafb] rounded-[14px]">
                {(selectedCar.liveryPath || (ownerCar?.carId === selectedCar.carId && generatedOwnerCarImage)) && (
                  <div className="rounded-[12px] overflow-hidden mb-[12px] h-[176px] bg-[#f3f4f6]">
                    <img
                      src={(ownerCar?.carId === selectedCar.carId ? generatedOwnerCarImage : null) || selectedCar.liveryPath}
                      alt={selectedCar.liveryName || 'Car'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] text-black" style={FB}>{selectedCar.liveryName || selectedCar.chassisId}</p>
                    <p className="text-[12px] text-[#4a5565]" style={FR}>{selectedCar.mileage.toLocaleString()} km</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#4a5565]" style={FR}>Avg Wear</p>
                    <p className="text-[14px] text-black" style={FB}>
                      {selectedCar.partWear ? Math.round(Object.values(selectedCar.partWear).reduce((a, b) => a + b, 0) / 5) : 0}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Service Legend */}
              <div className="flex items-center gap-[16px] text-[10px] text-[#4a5565]" style={FR}>
                <span>Service Levels:</span>
                <span className="flex items-center gap-[4px]"><span className="w-[10px] h-[10px] rounded bg-[#06b6d4]/50" /> Light (-20%)</span>
                <span className="flex items-center gap-[4px]"><span className="w-[10px] h-[10px] rounded bg-[#f97316]/50" /> Standard (-50%)</span>
                <span className="flex items-center gap-[4px]"><span className="w-[10px] h-[10px] rounded bg-[#00a63e]/50" /> Rebuild (→0%)</span>
              </div>

              {/* Part-by-Part */}
              <div className="space-y-[8px]">
                {(['engine', 'chassis', 'gearbox', 'brakes', 'suspension'] as const).map(part => {
                  const currentWear = selectedCar.partWear?.[part] || 0
                  const selectedLevel = partServiceSelections[part]
                  const tier = careerState?.ownedTeam?.tier || 'amateur'
                  const tierMult: Record<string, number> = { entry: 0.5, amateur: 0.75, semi_pro: 1.0, professional: 1.5, elite: 2.5, pinnacle: 5.0 }
                  const tierMultiplier = tierMult[tier] || 1.0
                  let estimatedWear = currentWear
                  if (selectedLevel) {
                    const config = SERVICE_LEVEL_CONFIG[selectedLevel]
                    estimatedWear = selectedLevel === 'rebuild' ? 0 : Math.max(0, currentWear - config.wearReduction)
                  }
                  return (
                    <div key={part} className={`p-[12px] rounded-[14px] border-[1.6px] transition-all ${
                      selectedLevel
                        ? selectedLevel === 'rebuild' ? 'border-[#00a63e] bg-[#00a63e]/5'
                          : selectedLevel === 'standard' ? 'border-[#f97316] bg-[#f97316]/5'
                          : 'border-[#06b6d4] bg-[#06b6d4]/5'
                        : 'border-[#e5e7eb] bg-[#f9fafb]'
                    }`}>
                      <div className="flex items-center justify-between mb-[8px]">
                        <div>
                          <p className="text-[12px] text-black capitalize" style={FB}>{part}</p>
                          <div className="flex items-center gap-[8px] text-[10px]">
                            <span className={getWearStatusColor(currentWear)} style={FR}>{Math.round(currentWear)}% wear</span>
                            {selectedLevel && (
                              <>
                                <span className="text-[#4a5565]">→</span>
                                <span className="text-[#00a63e]">{Math.round(estimatedWear)}%</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="w-[80px] h-[8px] bg-[#e5e7eb] rounded-full overflow-hidden">
                          <div className={`h-full ${currentWear >= 90 ? 'bg-[#ef4444]' : currentWear >= 70 ? 'bg-[#f59e0b]' : currentWear >= 50 ? 'bg-[#f97316]' : 'bg-[#00a63e]'}`} style={{ width: `${currentWear}%` }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-[6px]">
                        <button
                          onClick={() => setPartServiceSelections(prev => ({ ...prev, [part]: null }))}
                          className={`p-[6px] rounded-[8px] text-[10px] text-center ${!selectedLevel ? 'bg-white border-[1.6px] border-black/30' : 'bg-white/50 border border-[#e5e7eb]'}`}
                          style={FB}
                        >
                          <span className="block">None</span>
                          <span className="text-[#4a5565]" style={FR}>$0</span>
                        </button>
                        {(['light', 'standard', 'rebuild'] as ServiceLevel[]).map(level => {
                          const config = SERVICE_LEVEL_CONFIG[level]
                          const cost = Math.round(PART_BASE_COSTS[part] * config.costMultiplier * tierMultiplier)
                          const isSelected = selectedLevel === level
                          return (
                            <button
                              key={level}
                              onClick={() => setPartServiceSelections(prev => ({ ...prev, [part]: level }))}
                              className={`p-[6px] rounded-[8px] text-[10px] text-center ${
                                isSelected
                                  ? level === 'rebuild' ? 'bg-[#00a63e]/20 border-[1.6px] border-[#00a63e]'
                                    : level === 'standard' ? 'bg-[#f97316]/20 border-[1.6px] border-[#f97316]'
                                    : 'bg-[#06b6d4]/20 border-[1.6px] border-[#06b6d4]'
                                  : 'bg-white/50 border border-[#e5e7eb]'
                              }`}
                              style={FB}
                            >
                              <span className="block capitalize">{config.label.split(' ')[0]}</span>
                              <span className={isSelected ? 'text-[#00a63e]' : 'text-[#4a5565]'} style={FR}>${cost.toLocaleString()}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Total + Actions */}
              <div className="p-[16px] bg-[#f9fafb] rounded-[14px]">
                <div className="flex items-center justify-between mb-[12px]">
                  <div>
                    <p className="text-[12px] text-[#4a5565]" style={FR}>Total Cost</p>
                    <p className="text-[10px] text-[#4a5565]" style={FR}>{Object.values(partServiceSelections).filter(v => v !== null).length} part(s)</p>
                  </div>
                  <p className="text-[24px] text-[#00a63e]" style={FB}>${granularServiceCost.toLocaleString()}</p>
                </div>
                {careerState?.ownedTeam && (
                  <div className="flex items-center justify-between text-[12px] mb-[12px]">
                    <span className="text-[#4a5565]" style={FR}>Team Budget</span>
                    <span className={careerState.ownedTeam.budgets.cash >= granularServiceCost ? 'text-[#00a63e]' : 'text-[#ef4444]'} style={FBold}>
                      ${careerState.ownedTeam.budgets.cash.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex gap-[12px]">
                  <button
                    onClick={() => { setShowServiceModal(false); setPartServiceSelections({ engine: null, chassis: null, gearbox: null, brakes: null, suspension: null }) }}
                    className="flex-1 border-[1.6px] border-black rounded-[14px] h-[40px] text-[12px] text-black"
                    style={FB}
                  >Cancel</button>
                  <button
                    onClick={handleGranularService}
                    disabled={granularServiceCost === 0 || (careerState?.ownedTeam?.budgets.cash || 0) < granularServiceCost}
                    className="flex-1 bg-black rounded-[14px] h-[40px] text-[12px] text-white disabled:opacity-50 flex items-center justify-center gap-[8px]"
                    style={FB}
                  >
                    <Wrench className="w-[14px] h-[14px]" />
                    Confirm Service
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service All Cars Modal */}
      {showServiceAllModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={(e: any) => { if (e.target === e.currentTarget) setShowServiceAllModal(false) }}>
          <div className="bg-white rounded-[24px] w-full max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col" onClick={(e: any) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-[20px] border-b-[1.6px] border-black">
              <h2 className="text-[20px] text-black" style={FB}>SERVICE ALL CARS</h2>
              <button onClick={() => setShowServiceAllModal(false)} className="p-[4px] rounded-full hover:bg-black/5"><span className="text-[18px]">✕</span></button>
            </div>
            <div className="p-[20px] overflow-y-auto space-y-[16px]">
              <p className="text-[12px] text-[#4a5565]" style={FR}>Apply a standard service to all cars in your fleet.</p>
              {careerState?.cars?.map(car => {
                const avgWear = car.partWear ? Math.round(Object.values(car.partWear).reduce((s, v) => s + v, 0) / 5) : 0
                return (
                  <div key={car.carId} className={`p-[12px] rounded-[14px] flex items-center justify-between ${avgWear >= 70 ? 'bg-[#ef4444]/10' : 'bg-[#f9fafb]'}`}>
                    <div>
                      <p className="text-[12px] text-black" style={FB}>{car.liveryName || car.chassisId}</p>
                    </div>
                    <p className={`text-[12px] ${getWearStatusColor(avgWear)}`} style={FBold}>{avgWear}%</p>
                  </div>
                )
              })}
              <div className="p-[16px] bg-[#f9fafb] rounded-[14px]">
                <div className="flex items-center justify-between mb-[12px]">
                  <span className="text-[12px] text-[#4a5565]" style={FR}>Total Cost</span>
                  <span className="text-[24px] text-[#00a63e]" style={FB}>${((careerState?.cars?.length || 0) * 5000).toLocaleString()}</span>
                </div>
                <div className="flex gap-[12px]">
                  <button onClick={() => setShowServiceAllModal(false)} className="flex-1 border-[1.6px] border-black rounded-[14px] h-[40px] text-[12px] text-black" style={FB}>Cancel</button>
                  <button
                    onClick={() => {
                      let success = 0
                      careerState?.cars?.forEach(car => {
                        const allParts: PartServiceSelection[] = [
                          { part: 'engine', level: 'standard' }, { part: 'chassis', level: 'standard' },
                          { part: 'gearbox', level: 'standard' }, { part: 'brakes', level: 'standard' },
                          { part: 'suspension', level: 'standard' }
                        ]
                        if (serviceCarGranular(car.carId, allParts)) success++
                      })
                      if (success > 0) addToast({ type: 'success', message: `Serviced ${success} car(s)`, duration: 4000 })
                      setShowServiceAllModal(false)
                    }}
                    disabled={(careerState?.ownedTeam?.budgets.cash || 0) < (careerState?.cars?.length || 0) * 5000}
                    className="flex-1 bg-black rounded-[14px] h-[40px] text-[12px] text-white disabled:opacity-50 flex items-center justify-center gap-[8px]"
                    style={FB}
                  >
                    <Wrench className="w-[14px] h-[14px]" />
                    Service All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hire Driver Modal */}
      {showHireDriverModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={(e: any) => { if (e.target === e.currentTarget) setShowHireDriverModal(false) }}>
          <div className="bg-white rounded-[24px] w-full max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e: any) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-[20px] border-b-[1.6px] border-black">
              <h2 className="text-[20px] text-black" style={FB}>HIRE DRIVER</h2>
              <button onClick={() => setShowHireDriverModal(false)} className="p-[4px] rounded-full hover:bg-black/5"><span className="text-[18px]">✕</span></button>
            </div>
            <div className="p-[20px] overflow-y-auto space-y-[12px]">
              <p className="text-[12px] text-[#4a5565] mb-[8px]" style={FR}>Available drivers looking for a team seat.</p>
              {rivals.filter(r => !r.currentTeamId || r.currentTeamId === 'free_agent').slice(0, 8).map(driver => {
                const overall = Math.round((driver.stats.raceSkill + driver.stats.qualifyingSkill + driver.stats.consistency) / 3 * 100)
                const salary = Math.round(overall * 800 + Math.round(driver.stats.raceSkill * 100) * 200)
                const signing = Math.round(salary * 0.5)
                return (
                  <div key={driver.id} className="p-[12px] rounded-[14px] border-[1.6px] border-[#e5e7eb] flex items-center justify-between gap-[12px]">
                    <div className="flex items-center gap-[12px]">
                      <div className="w-[40px] h-[40px] rounded-full bg-[#f3f4f6] border-[1.6px] border-black flex items-center justify-center">
                        <User className="w-[20px] h-[20px] text-[#4a5565]" />
                      </div>
                      <div>
                        <p className="text-[12px] text-black" style={FB}>{driver.firstName} {driver.lastName}</p>
                        <p className="text-[10px] text-[#4a5565]" style={FR}>{driver.nationality} • Rating: {overall}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-[12px]">
                      <div className="text-right">
                        <p className="text-[10px] text-[#4a5565]" style={FR}>{formatCurrency(salary)}/yr</p>
                        <p className="text-[10px] text-[#4a5565]" style={FR}>+ {formatCurrency(signing)} signing</p>
                      </div>
                      <button
                        onClick={() => {
                          const sc = careerState?.cars?.find(c => c.driverType === 'unassigned')
                          if (!sc) { addToast({ type: 'error', message: 'No unassigned car available.' }); return }
                          const contract: HiredDriverContract = {
                            startYear: new Date().getFullYear(), endYear: new Date().getFullYear() + 2,
                            salary, bonusPerWin: Math.round(salary * 0.5), bonusPerPodium: Math.round(salary * 0.2),
                            targets: [], satisfaction: 70
                          }
                          const result = signHiredDriver(driver.id, contract, sc.carId)
                          if (result) {
                            addToast({ type: 'success', message: `${driver.firstName} ${driver.lastName} signed!` })
                            setShowHireDriverModal(false)
                          } else {
                            addToast({ type: 'error', message: 'Signing failed. Check budget.' })
                          }
                        }}
                        className="bg-black rounded-[10px] px-[12px] h-[32px] flex items-center gap-[6px]"
                      >
                        <UserPlus className="w-[14px] h-[14px] text-white" />
                        <span className="text-[10px] text-white" style={FB}>Sign</span>
                      </button>
                    </div>
                  </div>
                )
              })}
              {rivals.filter(r => !r.currentTeamId || r.currentTeamId === 'free_agent').length === 0 && (
                <p className="text-[12px] text-[#4a5565] text-center py-[32px]" style={FR}>No free agents available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Release Confirmation Modal */}
      {showReleaseConfirm && releaseTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={(e: any) => { if (e.target === e.currentTarget) { setShowReleaseConfirm(false); setReleaseTarget(null) } }}>
          <div className="bg-white rounded-[24px] w-full max-w-[450px] overflow-hidden" onClick={(e: any) => e.stopPropagation()}>
            <div className="p-[24px] text-center">
              <div className="w-[64px] h-[64px] rounded-full bg-[#ef4444]/20 flex items-center justify-center mx-auto mb-[16px]">
                <UserMinus className="w-[32px] h-[32px] text-[#ef4444]" />
              </div>
              <p className="text-[18px] text-black mb-[8px]" style={FB}>Release {releaseTarget.name}?</p>
              <p className="text-[12px] text-[#4a5565] mb-[16px]" style={FR}>
                {releaseTarget.type === 'driver'
                  ? 'This will terminate their contract. They will become a free agent.'
                  : 'This staff member will no longer contribute to operations.'}
              </p>
              <div className="flex gap-[12px]">
                <button onClick={() => { setShowReleaseConfirm(false); setReleaseTarget(null) }} className="flex-1 border-[1.6px] border-black rounded-[14px] h-[40px] text-[12px] text-black" style={FB}>Keep</button>
                <button
                  onClick={() => {
                    if (releaseTarget.type === 'driver') {
                      releaseHiredDriver(releaseTarget.id)
                      addToast({ type: 'info', message: `${releaseTarget.name} released.` })
                    } else {
                      releaseStaff(releaseTarget.id)
                      addToast({ type: 'info', message: `${releaseTarget.name} released.` })
                    }
                    setShowReleaseConfirm(false); setReleaseTarget(null)
                  }}
                  className="flex-1 bg-[#ef4444] rounded-[14px] h-[40px] text-[12px] text-white flex items-center justify-center gap-[8px]"
                  style={FB}
                >
                  <UserMinus className="w-[14px] h-[14px]" />
                  Release
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Setup Modal (basic placeholder) */}
      {showSetupModal && currentCar && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={(e: any) => { if (e.target === e.currentTarget) setShowSetupModal(false) }}>
          <div className="bg-white rounded-[24px] w-full max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col" onClick={(e: any) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-[20px] border-b-[1.6px] border-black">
              <h2 className="text-[20px] text-black" style={FB}>CAR SETUP</h2>
              <button onClick={() => setShowSetupModal(false)} className="p-[4px] rounded-full hover:bg-black/5"><span className="text-[18px]">✕</span></button>
            </div>
            <div className="p-[20px]">
              <p className="text-[14px] text-black mb-[8px]" style={FB}>{currentCar.liveryName || currentCar.chassisId}</p>
              <p className="text-[12px] text-[#4a5565] mb-[16px]" style={FR}>
                Car setup adjustments are applied through the AMS2 in-game setup system. Use this screen to review your car's current condition before heading to the track.
              </p>
              {currentCar.partWear && (
                <div className="space-y-[8px]">
                  <p className="text-[12px] text-black" style={FB}>Component Status</p>
                  {(['engine', 'chassis', 'gearbox', 'brakes', 'suspension'] as const).map(part => (
                    <div key={part} className="flex items-center gap-[12px]">
                      <p className="text-[12px] text-[#4a5565] capitalize w-[80px]" style={FR}>{part}</p>
                      <div className="flex-1 h-[8px] bg-[#e5e7eb] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${
                          currentCar.partWear[part] >= 90 ? 'bg-[#ef4444]' : currentCar.partWear[part] >= 70 ? 'bg-[#f59e0b]' : 'bg-[#00a63e]'
                        }`} style={{ width: `${100 - currentCar.partWear[part]}%` }} />
                      </div>
                      <p className="text-[12px] text-black w-[40px] text-right" style={FBold}>{Math.round(100 - currentCar.partWear[part])}%</p>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setShowSetupModal(false)} className="w-full bg-black rounded-[14px] h-[40px] text-[12px] text-white mt-[16px]" style={FB}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Development Modal */}
      {showDevelopmentModal && devModalDriver && devModalRival && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={(e: any) => { if (e.target === e.currentTarget) { setShowDevelopmentModal(false); setSelectedDriverForDev(null) } }}>
          <div className="bg-white rounded-[24px] w-full max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e: any) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-[20px] border-b-[1.6px] border-black">
              <h2 className="text-[20px] text-black" style={FB}>{devModalRival.firstName} {devModalRival.lastName} - DEVELOPMENT</h2>
              <button onClick={() => { setShowDevelopmentModal(false); setSelectedDriverForDev(null) }} className="p-[4px] rounded-full hover:bg-black/5"><span className="text-[18px]">✕</span></button>
            </div>
            <div className="p-[20px] overflow-y-auto">
              <div className="flex items-center gap-[16px] p-[16px] bg-[#f9fafb] rounded-[14px] mb-[16px]">
                <div className="w-[64px] h-[64px] rounded-full bg-[#f3f4f6] border-[1.6px] border-black flex items-center justify-center">
                  <User className="w-[32px] h-[32px] text-[#4a5565]" />
                </div>
                <div>
                  <p className="text-[18px] text-black" style={FB}>{devModalRival.firstName} {devModalRival.lastName}</p>
                  <p className="text-[12px] text-[#4a5565]" style={FR}>{devModalRival.nationality} • Age {devModalRival.age}</p>
                </div>
              </div>
              <DriverDevelopmentPanel
                hiredDriver={devModalDriver}
                rivalDriver={devModalRival}
                onStartTraining={(programId) => handleStartTraining(devModalDriver.driverId, programId)}
                onCancelTraining={() => handleCancelTraining(devModalDriver.driverId)}
                teamCash={rosterBudget}
              />
            </div>
          </div>
        </div>
      )}

      {/* AMS2 Livery Generator Modal */}
      <LiveryGenerator
        isOpen={showLiveryGenerator}
        onClose={() => setShowLiveryGenerator(false)}
        carClassId={currentCar?.seriesId || ''}
        teamName={ownedTeam?.name || 'My Team'}
        racingNumber={ownerCar?.liveryNumber?.toString() || '1'}
        sponsors={activeSponsorNames}
      />
    </div>
  )
}

// ============================================
// SUB-COMPONENTS (kept for development modal)
// ============================================

interface DriverDevelopmentPanelProps {
  hiredDriver: TeamDriver
  rivalDriver: RivalDriver
  onStartTraining: (programId: string) => void
  onCancelTraining: () => void
  teamCash: number
}

function DriverDevelopmentPanel({
  hiredDriver, rivalDriver, onStartTraining, onCancelTraining, teamCash
}: DriverDevelopmentPanelProps) {
  const dev = hiredDriver.development
  const currentProgram = dev?.trainingProgram ? TRAINING_PROGRAMS[dev.trainingProgram as TrainingProgram] : null
  const levelProgress = dev ? calculateLevelProgress(dev.experiencePoints) : 0

  return (
    <div className="space-y-[16px]">
      {/* Current XP/Level */}
      <div className="p-[12px] bg-[#f9fafb] rounded-[14px]">
        <div className="flex items-center justify-between mb-[8px]">
          <p className="text-[12px] text-black" style={FB}>Development Progress</p>
          <p className="text-[12px] text-[#4a5565]" style={FR}>Level {dev?.level || 1}</p>
        </div>
        <div className="h-[8px] bg-[#e5e7eb] rounded-full overflow-hidden">
          <div className="h-full bg-black rounded-full" style={{ width: `${levelProgress}%` }} />
        </div>
        <p className="text-[10px] text-[#4a5565] mt-[4px]" style={FR}>{dev?.experiencePoints || 0} XP • {levelProgress.toFixed(0)}% to next level</p>
      </div>

      {/* Current Training */}
      {currentProgram && (
        <div className="p-[12px] bg-[#06b6d4]/10 border-[1.6px] border-[#06b6d4] rounded-[14px]">
          <div className="flex items-center justify-between mb-[8px]">
            <div>
              <p className="text-[12px] text-black" style={FB}>{currentProgram.name}</p>
              <p className="text-[10px] text-[#4a5565]" style={FR}>Week {dev?.trainingWeeksCompleted || 0} of {currentProgram.durationWeeks}</p>
            </div>
            <button
              onClick={onCancelTraining}
              className="border-[1.6px] border-[#ef4444] rounded-[10px] px-[12px] h-[28px] text-[10px] text-[#ef4444]"
              style={FB}
            >Cancel</button>
          </div>
          <div className="h-[8px] bg-[#e5e7eb] rounded-full overflow-hidden">
            <div className="h-full bg-[#06b6d4] rounded-full" style={{ width: `${((dev?.trainingWeeksCompleted || 0) / currentProgram.durationWeeks) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Available Programs */}
      {!currentProgram && (
        <div className="space-y-[8px]">
          <p className="text-[12px] text-black" style={FB}>Available Training Programs</p>
          {Object.entries(TRAINING_PROGRAMS).map(([id, prog]) => {
            const totalCost = calculateProgramTotalCost(id as TrainingProgram)
            const canAfford = teamCash >= totalCost
            return (
              <div key={id} className="p-[12px] rounded-[14px] border-[1.6px] border-[#e5e7eb] flex items-center justify-between">
                <div>
                  <p className="text-[12px] text-black" style={FB}>{prog.name}</p>
                  <p className="text-[10px] text-[#4a5565]" style={FR}>{prog.durationWeeks} weeks • {formatCurrency(totalCost)}</p>
                </div>
                <button
                  onClick={() => onStartTraining(id)}
                  disabled={!canAfford}
                  className="bg-black rounded-[10px] px-[12px] h-[28px] text-[10px] text-white disabled:opacity-50"
                  style={FB}
                >Start</button>
              </div>
            )
          })}
        </div>
      )}

      {/* Stats Overview */}
      <div className="p-[12px] bg-[#f9fafb] rounded-[14px]">
        <p className="text-[12px] text-black mb-[8px]" style={FB}>Driver Stats</p>
        <div className="grid grid-cols-3 gap-[8px]">
          {[
            { label: 'Race', value: Math.round(rivalDriver.stats.raceSkill * 100) },
            { label: 'Quali', value: Math.round(rivalDriver.stats.qualifyingSkill * 100) },
            { label: 'Consistency', value: Math.round(rivalDriver.stats.consistency * 100) }
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-[10px] text-[#4a5565]" style={FR}>{s.label}</p>
              <p className="text-[18px] text-black" style={FB}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Garage
