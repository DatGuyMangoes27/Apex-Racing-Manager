import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Flag, DollarSign, Car, Users, Globe, 
  ChevronRight, Check, X, AlertCircle, Filter,
  Palette, Star, Calendar, MapPin, Layers, Building2,
  Plus, Minus, ShoppingCart, Eye, Lock, ArrowRight, RefreshCw, Pencil, Trash2
} from 'lucide-react'
import { useToast } from '@/components/ui'
import { getDriverPortrait, getChampionshipLogo } from '@/utils/generated-assets'
import { useCareerStore, TeamSeriesEntry, TeamCar } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import { CHAMPIONSHIPS, Championship, ChampionshipRegion, ChampionshipFormat, getSeriesMaxTeamCars } from '@/data/championships'
import { AMS2_CAR_CLASSES, CarClass } from '@/data/ams2-cars'
import { AMS2_TRACKS } from '@/data/ams2-tracks'
import { getClassLiveriesFromManifest, getFirstLiveryImage } from '@/utils/images'
import { getChampionshipTypeImage } from '@/data/stock-images'

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }
const CARD = 'bg-white border-[0.8px] border-black/20 rounded-[24px] overflow-hidden'

// ============================================
// TYPES
// ============================================

type TierFilter = 'all' | 'entry' | 'amateur' | 'semi-pro' | 'pro' | 'elite' | 'pinnacle'
type RegionFilter = 'all' | ChampionshipRegion
type FormatFilter = 'all' | ChampionshipFormat

interface LiveryOption {
  path: string
  name: string
}

// ============================================
// CONSTANTS
// ============================================

// Entry fees based on tier (rough estimates)
const ENTRY_FEES: Record<string, number> = {
  'entry': 5000,
  'amateur': 25000,
  'semi-pro': 75000,
  'pro': 200000,
  'elite': 500000,
  'pinnacle': 1500000,
  'historic': 100000
}

// Car costs based on tier
const CAR_COSTS: Record<string, number> = {
  'entry': 15000,
  'amateur': 50000,
  'semi-pro': 150000,
  'pro': 400000,
  'elite': 800000,
  'pinnacle': 2000000,
  'historic': 250000
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getTierColor(tier: string): string {
  switch (tier) {
    case 'pinnacle': return 'text-accent-gold'
    case 'elite': return 'text-accent-red'
    case 'pro': return 'text-accent-orange'
    case 'semi-pro': return 'text-status-info'
    case 'amateur': return 'text-status-success'
    case 'entry': return 'text-text-muted'
    default: return 'text-text-secondary'
  }
}

function getTierBadgeVariant(tier: string): 'default' | 'red' | 'outline' {
  switch (tier) {
    case 'pinnacle':
    case 'elite': return 'red'
    case 'pro':
    case 'semi-pro': return 'default'
    default: return 'outline'
  }
}

function getFormatIcon(format: ChampionshipFormat) {
  switch (format) {
    case 'endurance': return '24H'
    case 'sprint': return 'SPR'
    case 'mixed': return 'MIX'
    default: return format
  }
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount}`
}

function extractLiveryName(path: string): string {
  // Extract filename without extension from path
  const filename = path.split('/').pop() || ''
  return decodeURIComponent(filename.replace('.png', '').replace('.jpg', ''))
}

// ============================================
// COMPONENTS
// ============================================

interface SeriesCardProps {
  championship: Championship
  carClasses: CarClass[]
  entryFee: number
  isEntered: boolean
  carCount: number
  maxCars: number
  compatibleCarsCount: number
  hasAnyCompatibleCar: boolean
  canAffordEntry: boolean
  onAssignCar: () => void
  onGoToMarketplace: () => void
  onViewDetails: () => void
}

function SeriesCard({ 
  championship, 
  carClasses, 
  entryFee, 
  isEntered, 
  carCount, 
  maxCars,
  compatibleCarsCount,
  hasAnyCompatibleCar,
  canAffordEntry, 
  onAssignCar,
  onGoToMarketplace,
  onViewDetails 
}: SeriesCardProps) {
  const championshipLogoUrl = getChampionshipLogo(championship.id)
  const seriesImageUrl = championshipLogoUrl || getChampionshipTypeImage(championship.type)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <div className={`${CARD} relative transition-all duration-300 hover:shadow-lg ${isEntered ? 'ring-2 ring-[#00a63e]/40' : ''}`}>
        <div className="relative h-[112px] w-full overflow-hidden shrink-0 bg-[#f9fafb]">
          <img src={seriesImageUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-90 pointer-events-none" />
        </div>
        <div className="p-[16px]">
          <div className="flex items-start justify-between mb-[8px]">
            <div className="flex items-center gap-[6px] mb-[4px]">
              <span className="px-[6px] py-[2px] text-[10px] rounded-[6px] bg-[#f9fafb] text-[#0a0a0a] border-[0.8px] border-black/10" style={FBold}>{championship.tier.toUpperCase()}</span>
              <span className="px-[6px] py-[2px] text-[10px] rounded-[6px] border-[0.8px] border-black/10 text-[#4a5565]" style={FR}>{getFormatIcon(championship.format)}</span>
              {isEntered && (
                <span className="px-[6px] py-[2px] text-[10px] rounded-[6px] bg-[#00a63e] text-white flex items-center gap-[2px]" style={FBold}>
                  <Check className="w-[12px] h-[12px]" /> Entered
                </span>
              )}
            </div>
            <div className="flex items-center gap-[4px] text-[#4a5565] text-[11px]" style={FR}>
              <Globe className="w-[12px] h-[12px]" />{championship.region}
            </div>
          </div>
          <div className="mb-[8px]">
            <h3 className="text-[14px] text-[#0a0a0a] group-hover:text-[#2563eb] transition-colors" style={FBold}>{championship.shortName}</h3>
            <p className="text-[11px] text-[#4a5565]" style={FR}>{championship.name}</p>
          </div>
          <div className="flex flex-wrap gap-[4px] mb-[12px]">
            {carClasses.map(cls => (<span key={cls.id} className="text-[11px] px-[8px] py-[2px] bg-[#f9fafb] rounded-[6px] text-[#4a5565]" style={FR}>{cls.name}</span>))}
          </div>
          <div className="grid grid-cols-3 gap-[8px] mb-[12px] text-[11px]">
            <div className="text-center p-[8px] bg-[#f9fafb] rounded-[8px]">
              <div className="text-[#4a5565]" style={FR}>Rounds</div>
              <div className="text-[#0a0a0a]" style={FBold}>{championship.seasonRounds}</div>
            </div>
            <div className="text-center p-[8px] bg-[#f9fafb] rounded-[8px]">
              <div className="text-[#4a5565]" style={FR}>Prestige</div>
              <div className="text-[#0a0a0a]" style={FBold}>{championship.prestige}</div>
            </div>
            <div className="text-center p-[8px] bg-[#f9fafb] rounded-[8px]">
              <div className="text-[#4a5565]" style={FR}>Prize Pool</div>
              <div className="text-[#00a63e]" style={FBold}>{formatCurrency(championship.prizePool)}</div>
            </div>
          </div>
          <div className="flex items-center justify-between py-[8px] border-t border-black/10">
            {!isEntered ? (
              <>
                <div className="text-[11px]" style={FR}>
                  <span className="text-[#4a5565]">Entry Fee: </span>
                  <span className={canAffordEntry ? 'text-[#0a0a0a]' : 'text-[#ef4444]'} style={FBold}>{formatCurrency(entryFee)}</span>
                </div>
                <div className="text-[11px]" style={FR}>
                  {compatibleCarsCount > 0 ? <span className="text-[#00a63e]">{compatibleCarsCount} car{compatibleCarsCount > 1 ? 's' : ''} available</span> : <span className="text-[#4a5565]">No compatible cars</span>}
                </div>
              </>
            ) : (
              <>
                <div className="text-[11px]" style={FR}>
                  <span className="text-[#00a63e]">Entered</span>
                  <span className="text-[#4a5565]"> · {carCount}/{maxCars} cars</span>
                </div>
                {carCount < maxCars && compatibleCarsCount > 0 && (<div className="text-[11px] text-[#2563eb]" style={FR}>{compatibleCarsCount} car{compatibleCarsCount > 1 ? 's' : ''} can be added</div>)}
              </>
            )}
          </div>
          <div className="flex gap-[8px] mt-[12px]">
            {carCount >= maxCars ? (
              <button disabled className="flex-1 h-[32px] border-[0.8px] border-black/20 rounded-[12px] text-[12px] text-[#4a5565] flex items-center justify-center gap-[4px] cursor-not-allowed" style={FR}>
                <Check className="w-[16px] h-[16px]" /> Max Cars ({carCount}/{maxCars})
              </button>
            ) : hasAnyCompatibleCar ? (
              <button
                onClick={onAssignCar}
                disabled={!isEntered && !canAffordEntry}
                className={`flex-1 h-[32px] rounded-[12px] text-[12px] flex items-center justify-center gap-[4px] transition-colors ${
                  canAffordEntry || isEntered ? 'bg-black text-white hover:bg-black/90' : 'border-[0.8px] border-black/20 text-[#4a5565] cursor-not-allowed'
                }`}
                style={FBold}
              >
                {!isEntered && !canAffordEntry ? (<><Lock className="w-[14px] h-[14px]" /> Need {formatCurrency(entryFee)}</>) : (<><Flag className="w-[14px] h-[14px]" /> {isEntered ? 'Assign Car' : 'Enter'}</>)}
              </button>
            ) : (
              <button onClick={onGoToMarketplace} className="flex-1 h-[32px] border-[0.8px] border-black/20 rounded-[12px] text-[12px] text-[#0a0a0a] flex items-center justify-center gap-[4px] hover:bg-[#f9fafb] transition-colors" style={FBold}>
                <ShoppingCart className="w-[14px] h-[14px]" /> Buy a Car
              </button>
            )}
            <button onClick={onViewDetails} className="w-[32px] h-[32px] border-[0.8px] border-black/20 rounded-[12px] flex items-center justify-center text-[#4a5565] hover:bg-[#f9fafb] transition-colors">
              <Eye className="w-[16px] h-[16px]" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SeriesEntry() {
  const navigate = useNavigate()
  const { 
    careerState,
    player,
    enterSeries, 
    purchaseCar,
    withdrawFromSeries,
    upsertCar,
    addTransaction
  } = useCareerStore()
  const { getSeriesById, getStandings, generateCalendar, repairSeriesCalendar, regenerateAllCalendars, updateRoundTrack, addRound, removeRound, rivals } = useRivalStore()
  const { addToast } = useToast()
  
  // Filter state
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all')
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all')
  const [showFilters, setShowFilters] = useState(true)
  
  // Modal state
  const [selectedChampionship, setSelectedChampionship] = useState<Championship | null>(null)
  const [showCarModal, setShowCarModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedLivery, setSelectedLivery] = useState<LiveryOption | null>(null)
  const [selectedCar, setSelectedCar] = useState<TeamCar | null>(null)
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false)
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false)
  const [detailsTab, setDetailsTab] = useState<'overview' | 'schedule' | 'standings' | 'entry'>('overview')
  const [purchasedCarName, setPurchasedCarName] = useState<string | null>(null)
  const [purchasedCarImage, setPurchasedCarImage] = useState<string | null>(null)
  const [editingRound, setEditingRound] = useState<number | null>(null)
  const [showAddRound, setShowAddRound] = useState(false)
  const [addTrackId, setAddTrackId] = useState('')
  const [addLayoutId, setAddLayoutId] = useState('')
  const [addWeek, setAddWeek] = useState(1)

  const sortedTracks = useMemo(() =>
    [...AMS2_TRACKS]
      .filter(t => t.layouts.some(l => l.sourceVerified))
      .sort((a, b) => a.name.localeCompare(b.name)),
  [])

  // Get current budget
  const budget = careerState?.ownedTeam?.budgets?.cash || 0
  const seriesEntries = careerState?.seriesEntries || []
  const cars = careerState?.cars || []
  const drivers = careerState?.ownedTeam?.drivers || []
  const playerName = player ? `${player.firstName} ${player.lastName}` : 'You'
  
  // Helper to get driver name for a car
  const getDriverNameForCar = (car: TeamCar): string => {
    if (car.driverType === 'owner') {
      return playerName
    }
    if (car.driverType === 'hired') {
      // Find the hired driver assigned to this car
      const hiredDriver = drivers.find(d => d.carAssignment === car.carId)
      if (hiredDriver) {
        const rival = rivals.find(r => r.id === hiredDriver.driverId)
        if (rival) {
          return `${rival.firstName} ${rival.lastName}`
        }
      }
      return 'Hired Driver'
    }
    return 'Unassigned'
  }

  const getCarSeriesAssignments = (car: TeamCar): string[] => {
    const ids = Array.isArray(car.seriesIds) ? car.seriesIds.filter(Boolean) : []
    if (ids.length > 0) return Array.from(new Set(ids))
    return car.seriesId ? [car.seriesId] : []
  }
  
  // Get compatible cars not already assigned to this series
  const getCompatibleUnassignedCars = (championship: Championship): TeamCar[] => {
    return cars.filter(car => {
      const assignedSeries = getCarSeriesAssignments(car)
      if (assignedSeries.includes(championship.id)) return false
      // Car's class must be in the championship's allowed classes
      return championship.carClassIds.includes(car.chassisId)
    })
  }
  
  // Get ALL compatible cars (assigned or not) - for checking if user owns any suitable car
  const getAllCompatibleCars = (championship: Championship): TeamCar[] => {
    return cars.filter(car => championship.carClassIds.includes(car.chassisId))
  }
  
  // Filter championships; sort so eligible (have compatible cars) show first, then by prestige
  const filteredChampionships = useMemo(() => {
    const hasCompatibleCar = (champ: Championship) =>
      cars.some(car => champ.carClassIds.includes(car.chassisId))
    return CHAMPIONSHIPS.filter(champ => {
      if (tierFilter !== 'all' && champ.tier !== tierFilter) return false
      if (regionFilter !== 'all' && champ.region !== regionFilter) return false
      if (formatFilter !== 'all' && champ.format !== formatFilter) return false
      return true
    }).sort((a, b) => {
      const aEligible = hasCompatibleCar(a)
      const bEligible = hasCompatibleCar(b)
      if (aEligible !== bEligible) return bEligible ? 1 : -1
      return b.prestige - a.prestige
    })
  }, [tierFilter, regionFilter, formatFilter, cars])
  
  // Get car classes for a championship
  const getCarClasses = (championship: Championship): CarClass[] => {
    return championship.carClassIds
      .map(id => AMS2_CAR_CLASSES.find(c => c.id === id))
      .filter((c): c is CarClass => c !== undefined)
  }
  
  // Check if series is entered
  const isSeriesEntered = (seriesId: string): boolean => {
    return seriesEntries.some(e => e.seriesId === seriesId)
  }
  
  // Get car count for series
  const getCarCount = (seriesId: string): number => {
    return cars.filter(c => getCarSeriesAssignments(c).includes(seriesId)).length
  }
  
  // Get available liveries for the selected championship
  const availableLiveries = useMemo((): LiveryOption[] => {
    if (!selectedChampionship) return []
    
    const primaryClassId = selectedChampionship.carClassIds[0]
    if (!primaryClassId) return []
    
    const liveryPaths = getClassLiveriesFromManifest(primaryClassId)
    return liveryPaths.map(path => ({
      path,
      name: extractLiveryName(path)
    }))
  }, [selectedChampionship])
  
  // Perform the actual purchase (called after confirmation)
  const confirmPurchaseCar = () => {
    if (!selectedChampionship || !selectedLivery) return
    
    const carCost = CAR_COSTS[selectedChampionship.tier] || 100000
    const primaryClass = AMS2_CAR_CLASSES.find(c => c.id === selectedChampionship.carClassIds[0])
    
    const success = purchaseCar(
      selectedChampionship.id,
      selectedLivery.name,
      primaryClass?.id || 'unknown',
      primaryClass?.id || 'unknown',
      carCost,
      selectedChampionship.name,
      0,  // No entry fee; player pays when assigning via Assign Car modal
      selectedLivery.path  // Livery image path for garage display
    )
    
    if (success) {
      setPurchasedCarName(selectedLivery.name)
      setPurchasedCarImage(selectedLivery.path)
      setShowPurchaseConfirm(false)
      setShowPurchaseSuccess(true)
      addToast({
        type: 'success',
        title: 'Car Purchased',
        message: `${selectedLivery.name} is in your garage. Assign it to a series when you're ready.`,
        duration: 3000
      })
    } else {
      addToast({
        type: 'error',
        title: 'Purchase Failed',
        message: 'Insufficient funds.',
        duration: 3000
      })
    }
  }

  const closeCarModalAndReset = () => {
    setShowCarModal(false)
    setSelectedLivery(null)
    setShowPurchaseConfirm(false)
    setShowPurchaseSuccess(false)
    setPurchasedCarName(null)
    setPurchasedCarImage(null)
  }
  
  // Handle withdrawing from series
  const handleWithdraw = () => {
    if (!selectedChampionship) return
    
    withdrawFromSeries(selectedChampionship.id)
    addToast({
      type: 'info',
      title: 'Withdrawn from Series',
      message: `You have withdrawn from ${selectedChampionship.shortName}.`,
      duration: 3000
    })
    setShowDetailsModal(false)
  }
  
  // Handle assigning an owned car to a series
  const handleAssignCar = () => {
    if (!selectedChampionship || !selectedCar || !careerState?.ownedTeam) return
    
    const entryFee = ENTRY_FEES[selectedChampionship.tier] || 50000
    const isFirstCar = !isSeriesEntered(selectedChampionship.id)
    const carCount = getCarCount(selectedChampionship.id)
    
    // Check if we can afford entry fee (only for first car)
    if (isFirstCar && budget < entryFee) {
      addToast({
        type: 'error',
        title: 'Insufficient Funds',
        message: `You need ${formatCurrency(entryFee)} for the entry fee.`,
        duration: 3000
      })
      return
    }
    
    // Check max cars for this series
    const maxCars = getSeriesMaxTeamCars(selectedChampionship.id)
    if (carCount >= maxCars) {
      addToast({
        type: 'error',
        title: 'Maximum Cars Reached',
        message: `You already have ${maxCars} car${maxCars > 1 ? 's' : ''} in this series (maximum allowed).`,
        duration: 3000
      })
      return
    }
    
    // Assign the car to this series while preserving existing assignments
    const existingAssignments = getCarSeriesAssignments(selectedCar)
    const mergedAssignments = Array.from(new Set([...existingAssignments, selectedChampionship.id]))
    const nextDriverType =
      selectedCar.driverType === 'unassigned' && carCount === 0
        ? 'owner'
        : selectedCar.driverType
    const updatedCar: TeamCar = {
      ...selectedCar,
      seriesId: selectedCar.seriesId || selectedChampionship.id,
      seriesIds: mergedAssignments,
      driverType: nextDriverType
    }
    
    upsertCar(updatedCar)
    
    // Create series entry if first car
    if (isFirstCar) {
      enterSeries(
        selectedChampionship.id,
        selectedChampionship.name,
        entryFee
      )
      
      // Update player's currentSeriesId (first entered series, or if none set)
      if (player && (!player.currentSeriesId || !careerState.seriesEntries?.length)) {
        useCareerStore.setState(state => ({
          player: state.player ? { ...state.player, currentSeriesId: selectedChampionship.id } : state.player
        }))
      }
      
      // Record entry fee transaction
      addTransaction({
        type: 'expense',
        category: 'other',
        amount: entryFee,
        description: `Series entry fee: ${selectedChampionship.name}`,
        date: new Date().toISOString(),
        week: careerState.currentWeek,
        year: careerState.currentYear
      })
    }
    
    addToast({
      type: 'success',
      title: isFirstCar ? 'Entered Series!' : 'Car Assigned',
      message: isFirstCar 
        ? `You've entered ${selectedChampionship.shortName} with ${selectedCar.liveryName}!`
        : `${selectedCar.liveryName} assigned to ${selectedChampionship.shortName}`,
      duration: 4000
    })
    
    setShowAssignModal(false)
    setSelectedCar(null)
  }
  
  // Navigate to marketplace
  const goToMarketplace = () => {
    navigate('/marketplace')
  }

  const rerollAllSchedules = () => {
    const year = careerState?.currentYear || new Date().getFullYear()
    const confirmed = window.confirm(`Reroll all championship schedules for ${year}?`)
    if (!confirmed) return

    regenerateAllCalendars(year)
    addToast({
      type: 'success',
      title: 'Schedules rerolled',
      message: `All series schedules were regenerated for ${year}.`,
      duration: 3000
    })
  }
  
  // Summary of current entries
  const enteredCount = seriesEntries.length
  const totalCars = cars.length
  
  return (
    <div className="bg-white w-full h-full overflow-y-auto">
      <div className="p-[24px] flex flex-col gap-[24px]">
      {/* Header */}
      <div>
        <div className="flex items-center gap-[12px] mb-[4px]">
          <Trophy className="w-[28px] h-[28px] text-[#0a0a0a]" />
          <h1 className="text-[30px] text-[#0a0a0a] tracking-[-1.5px]" style={FB}>Series Entry</h1>
        </div>
        <p className="text-[14px] text-[#4a5565]" style={FR}>Enter championships and acquire cars for your team</p>
      </div>
      
      {/* Budget Bar */}
      <div className={`${CARD} p-[16px]`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[24px]">
              <div className="flex items-center gap-[8px]">
                <DollarSign className="w-[20px] h-[20px] text-[#00a63e]" />
                <div>
                  <div className="text-[11px] text-[#4a5565]" style={FR}>Available Budget</div>
                  <div className="text-[20px] text-[#00a63e]" style={FB}>{formatCurrency(budget)}</div>
                </div>
              </div>
              <div className="h-[32px] w-[1px] bg-black/10" />
              <div className="flex items-center gap-[8px]">
                <Flag className="w-[20px] h-[20px] text-[#ef4444]" />
                <div>
                  <div className="text-[11px] text-[#4a5565]" style={FR}>Series Entered</div>
                  <div className="text-[20px] text-[#0a0a0a]" style={FB}>{enteredCount}</div>
                </div>
              </div>
              <div className="flex items-center gap-[8px]">
                <Car className="w-[20px] h-[20px] text-[#ea580c]" />
                <div>
                  <div className="text-[11px] text-[#4a5565]" style={FR}>Total Cars</div>
                  <div className="text-[20px] text-[#0a0a0a]" style={FB}>{totalCars}</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-[8px]">
              <button onClick={() => setShowFilters(!showFilters)} className="h-[32px] px-[12px] border-[0.8px] border-black/20 rounded-[12px] text-[12px] text-[#0a0a0a] flex items-center gap-[8px] hover:bg-[#f9fafb] transition-colors" style={FBold}>
                <Filter className="w-[16px] h-[16px]" /> Filters
              </button>
              <button onClick={rerollAllSchedules} className="h-[32px] px-[12px] border-[0.8px] border-black/20 rounded-[12px] text-[12px] text-[#0a0a0a] flex items-center gap-[8px] hover:bg-[#f9fafb] transition-colors" style={FBold}>
                <RefreshCw className="w-[16px] h-[16px]" /> Reroll All Schedules
              </button>
            </div>
          </div>
      </div>
      
      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className={`${CARD} p-[16px]`}>
              <div className="flex flex-wrap gap-[16px]">
                <div>
                  <label className="text-[11px] text-[#4a5565] mb-[4px] block" style={FR}>Tier</label>
                  <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value as TierFilter)} className="bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[8px] px-[12px] py-[6px] text-[13px] text-[#0a0a0a]" style={FR}>
                    <option value="all">All Tiers</option>
                    <option value="entry">Entry</option>
                    <option value="amateur">Amateur</option>
                    <option value="semi-pro">Semi-Pro</option>
                    <option value="pro">Pro</option>
                    <option value="elite">Elite</option>
                    <option value="pinnacle">Pinnacle</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#4a5565] mb-[4px] block" style={FR}>Region</label>
                  <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value as RegionFilter)} className="bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[8px] px-[12px] py-[6px] text-[13px] text-[#0a0a0a]" style={FR}>
                    <option value="all">All Regions</option>
                    <option value="Global">Global</option>
                    <option value="Europe">Europe</option>
                    <option value="Americas">Americas</option>
                    <option value="Asia-Pacific">Asia-Pacific</option>
                    <option value="Brazil">Brazil</option>
                    <option value="Australia">Australia</option>
                    <option value="USA">USA</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#4a5565] mb-[4px] block" style={FR}>Format</label>
                  <select value={formatFilter} onChange={(e) => setFormatFilter(e.target.value as FormatFilter)} className="bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[8px] px-[12px] py-[6px] text-[13px] text-[#0a0a0a]" style={FR}>
                    <option value="all">All Formats</option>
                    <option value="sprint">Sprint</option>
                    <option value="endurance">Endurance</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                <div className="flex-1" />
                <div className="flex items-end">
                  <span className="text-[13px] text-[#4a5565]" style={FR}>Showing {filteredChampionships.length} of {CHAMPIONSHIPS.length} series</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Series Grid */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[16px]">
          {filteredChampionships.map(championship => {
            const carClasses = getCarClasses(championship)
            const entryFee = ENTRY_FEES[championship.tier] || 50000
            const isEntered = isSeriesEntered(championship.id)
            const carCount = getCarCount(championship.id)
            const compatibleCars = getCompatibleUnassignedCars(championship)
            const allCompatibleCars = getAllCompatibleCars(championship)
            const canAffordEntry = budget >= entryFee
            
            return (
              <SeriesCard
                key={championship.id}
                championship={championship}
                carClasses={carClasses}
                entryFee={entryFee}
                isEntered={isEntered}
                carCount={carCount}
                maxCars={getSeriesMaxTeamCars(championship.id)}
                compatibleCarsCount={compatibleCars.length}
                hasAnyCompatibleCar={allCompatibleCars.length > 0}
                canAffordEntry={canAffordEntry}
                onAssignCar={() => {
                  setSelectedChampionship(championship)
                  setShowAssignModal(true)
                }}
                onGoToMarketplace={goToMarketplace}
                onViewDetails={() => {
                  setSelectedChampionship(championship)
                  setShowDetailsModal(true)
                }}
              />
            )
          })}
        </div>
        
        {filteredChampionships.length === 0 && (
          <div className="text-center py-[48px]">
            <Trophy className="w-[48px] h-[48px] mx-auto text-[#4a5565] mb-[16px]" />
            <p className="text-[#4a5565] text-[14px]" style={FR}>No series match your filters.</p>
          </div>
        )}
      </div>
      
      {/* Car Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-[24px]" onClick={() => { setShowAssignModal(false); setSelectedCar(null) }}>
          <div className="bg-white rounded-[24px] max-w-[640px] w-full max-h-[85vh] overflow-y-auto p-[24px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-[16px]">
              <h2 className="text-[20px] text-[#0a0a0a]" style={FB}>{isSeriesEntered(selectedChampionship?.id || '') ? "Assign Car" : "Enter Series"}</h2>
              <button onClick={() => { setShowAssignModal(false); setSelectedCar(null) }} className="w-[32px] h-[32px] rounded-full bg-[#f9fafb] flex items-center justify-center text-[#4a5565] hover:bg-black/10 transition-colors text-[18px]">&times;</button>
            </div>
        {selectedChampionship ? (() => {
          const isFirstCar = !isSeriesEntered(selectedChampionship.id)
          const entryFee = ENTRY_FEES[selectedChampionship.tier] || 50000
          const compatibleCars = getCompatibleUnassignedCars(selectedChampionship)
          
          return (
          <div className="space-y-[16px]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[14px] text-[#0a0a0a]" style={FBold}>{selectedChampionship.shortName}</h3>
                <p className="text-[13px] text-[#4a5565]" style={FR}>
                  {isFirstCar ? 'Select a car to enter this series' : 'Select a car to add to your entry'}
                </p>
              </div>
              {isFirstCar && (
                <div className="text-right">
                  <div className="text-[11px] text-[#4a5565]" style={FR}>Entry Fee</div>
                  <div className="text-[18px] text-[#ef4444]" style={FB}>{formatCurrency(entryFee)}</div>
                </div>
              )}
            </div>
            
            <div className="max-h-[320px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-[12px]">
                {compatibleCars.map((car, index) => (
                  <motion.div
                    key={car.carId}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedCar(car)}
                    className={`cursor-pointer rounded-[12px] overflow-hidden border-[2px] transition-all ${
                      selectedCar?.carId === car.carId ? 'border-black ring-2 ring-black/20' : 'border-black/10 hover:border-black/30'
                    }`}
                  >
                    {car.liveryPath ? (
                      <img src={car.liveryPath} alt={car.liveryName || 'Car'} className="w-full h-[96px] object-cover" />
                    ) : (
                      <div className="w-full h-[96px] bg-[#f9fafb] flex items-center justify-center"><Car className="w-[40px] h-[40px] text-[#4a5565]" /></div>
                    )}
                    <div className="p-[12px] bg-[#f9fafb]">
                      <p className="text-[13px] text-[#0a0a0a] truncate" style={FBold}>{car.liveryName || car.chassisId}</p>
                      <div className="flex items-center gap-[8px] mt-[4px] text-[11px]" style={FR}>
                        <span className="text-[#2563eb]">Rel: {car.reliability}%</span>
                        <span className="text-[#ef4444]">Perf: {car.performance}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {compatibleCars.length === 0 && (
                <div className="text-center py-[32px]">
                  <Car className="w-[32px] h-[32px] mx-auto text-[#4a5565] mb-[8px]" />
                  <p className="text-[#4a5565] text-[13px] mb-[16px]" style={FR}>No compatible cars available for this series.</p>
                  <div className="flex flex-wrap gap-[8px] justify-center">
                    <button onClick={() => setShowCarModal(true)} className="h-[36px] px-[16px] bg-black text-white rounded-[12px] text-[12px] flex items-center gap-[8px] hover:bg-black/90 transition-colors" style={FBold}>
                      <Car className="w-[16px] h-[16px]" /> Buy new car for this series
                    </button>
                    <button onClick={goToMarketplace} className="h-[36px] px-[16px] border-[0.8px] border-black/20 rounded-[12px] text-[12px] text-[#0a0a0a] flex items-center gap-[8px] hover:bg-[#f9fafb] transition-colors" style={FBold}>
                      <ShoppingCart className="w-[16px] h-[16px]" /> Go to Marketplace
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {selectedCar && (
              <div className="bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[16px] p-[16px]">
                <div className="flex items-center gap-[16px]">
                  {selectedCar.liveryPath ? (
                    <img src={selectedCar.liveryPath} alt={selectedCar.liveryName || 'Car'} className="w-[96px] h-[64px] object-cover rounded-[8px]" />
                  ) : (
                    <div className="w-[96px] h-[64px] bg-[#f9fafb] rounded-[8px] flex items-center justify-center"><Car className="w-[32px] h-[32px] text-[#4a5565]" /></div>
                  )}
                  <div className="flex-1">
                    <p className="text-[14px] text-[#0a0a0a]" style={FBold}>{selectedCar.liveryName || selectedCar.chassisId}</p>
                    <p className="text-[13px] text-[#4a5565]" style={FR}>{isFirstCar ? 'Will be assigned as Owner Car (#1)' : 'Will be added as Car #2'}</p>
                  </div>
                  {isFirstCar && (
                    <div className="text-right">
                      <div className="text-[12px] text-[#4a5565]" style={FR}>Entry Fee</div>
                      <div className="text-[20px] text-[#ef4444]" style={FB}>{formatCurrency(entryFee)}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex gap-[12px]">
              <button onClick={() => { setShowAssignModal(false); setSelectedCar(null) }} className="flex-1 h-[40px] border-[0.8px] border-black/20 rounded-[12px] text-[13px] text-[#4a5565] hover:bg-[#f9fafb] transition-colors" style={FR}>Cancel</button>
              <button onClick={handleAssignCar} disabled={!selectedCar || (isFirstCar && budget < entryFee)} className="flex-1 h-[40px] bg-black text-white rounded-[16px] text-[13px] flex items-center justify-center gap-[8px] hover:bg-black/90 transition-colors disabled:bg-[#f9fafb] disabled:text-[#4a5565] disabled:cursor-not-allowed" style={FBold}>
                <Check className="w-[16px] h-[16px]" /> {isFirstCar ? 'Enter & Assign' : 'Assign Car'}
              </button>
            </div>
          </div>
        )})() : null}
          </div>
        </div>
      )}
      
      {/* Car Purchase Modal (livery picker → confirm → success) */}
      {showCarModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-[24px]" onClick={closeCarModalAndReset}>
          <div className="bg-white rounded-[24px] max-w-[640px] w-full max-h-[85vh] overflow-y-auto p-[24px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-[16px]">
              <h2 className="text-[20px] text-[#0a0a0a]" style={FB}>{showPurchaseSuccess ? 'Car Acquired' : showPurchaseConfirm ? 'Confirm Purchase' : 'Buy a Car'}</h2>
              <button onClick={closeCarModalAndReset} className="w-[32px] h-[32px] rounded-full bg-[#f9fafb] flex items-center justify-center text-[#4a5565] hover:bg-black/10 transition-colors text-[18px]">&times;</button>
            </div>
        {selectedChampionship && (
          <div className="space-y-[16px]">
            {showPurchaseSuccess ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-[16px]">
                <h3 className="text-[20px] text-[#00a63e] mb-[8px]" style={FB}>You&apos;ve acquired {purchasedCarName}!</h3>
                {purchasedCarImage && (
                  <img src={purchasedCarImage} alt={purchasedCarName || 'Car'} className="w-full max-w-[320px] h-[128px] object-cover rounded-[12px] mx-auto mb-[16px]" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                )}
                <p className="text-[#4a5565] text-[13px] mb-[24px]" style={FR}>Assign it to a series from Series Entry when you&apos;re ready to compete.</p>
                <div className="flex gap-[12px] justify-center">
                  <button onClick={closeCarModalAndReset} className="h-[40px] px-[16px] border-[0.8px] border-black/20 rounded-[12px] text-[13px] text-[#0a0a0a] hover:bg-[#f9fafb] transition-colors" style={FBold}>Done</button>
                  <button onClick={() => { closeCarModalAndReset(); setShowAssignModal(true) }} className="h-[40px] px-[16px] bg-black text-white rounded-[16px] text-[13px] flex items-center gap-[8px] hover:bg-black/90 transition-colors" style={FBold}>
                    <Flag className="w-[16px] h-[16px]" /> Assign to series
                  </button>
                </div>
              </motion.div>
            ) : showPurchaseConfirm && selectedLivery ? (
              <>
                <div className="flex items-center gap-[16px] p-[16px] bg-[#f9fafb] rounded-[16px] border-[0.8px] border-black/10">
                  <img src={selectedLivery.path} alt={selectedLivery.name} className="w-[96px] h-[64px] object-cover rounded-[8px]" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  <div className="flex-1">
                    <p className="text-[14px] text-[#0a0a0a]" style={FBold}>{selectedLivery.name}</p>
                    <p className="text-[13px] text-[#4a5565]" style={FR}>for {selectedChampionship.shortName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-[#4a5565]" style={FR}>Cost</div>
                    <div className="text-[18px] text-[#ef4444]" style={FB}>{formatCurrency(CAR_COSTS[selectedChampionship.tier] || 100000)}</div>
                    <div className="text-[11px] text-[#4a5565] mt-[4px]" style={FR}>Balance after: {formatCurrency(budget - (CAR_COSTS[selectedChampionship.tier] || 100000))}</div>
                  </div>
                </div>
                <div className="flex gap-[12px]">
                  <button onClick={() => setShowPurchaseConfirm(false)} className="flex-1 h-[40px] border-[0.8px] border-black/20 rounded-[12px] text-[13px] text-[#4a5565] hover:bg-[#f9fafb] transition-colors" style={FR}>Cancel</button>
                  <button onClick={confirmPurchaseCar} className="flex-1 h-[40px] bg-black text-white rounded-[16px] text-[13px] flex items-center justify-center gap-[8px] hover:bg-black/90 transition-colors" style={FBold}>
                    <Check className="w-[16px] h-[16px]" /> Confirm purchase
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] text-[#0a0a0a]" style={FBold}>{selectedChampionship.shortName}</h3>
                  <div className="text-right">
                    <div className="text-[11px] text-[#4a5565]" style={FR}>Car cost</div>
                    <div className="text-[18px] text-[#ef4444]" style={FB}>{formatCurrency(CAR_COSTS[selectedChampionship.tier] || 100000)}</div>
                    <div className="text-[11px] text-[#4a5565]" style={FR}>Balance: {formatCurrency(budget)}</div>
                  </div>
                </div>
                <p className="text-[13px] text-[#4a5565]" style={FR}>Select a livery. The car will be added to your garage unassigned; assign it to this series from the Assign Car modal when you want to enter.</p>
                <div className="max-h-[320px] overflow-y-auto">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-[12px]">
                    {availableLiveries.map((livery) => (
                      <motion.div
                        key={livery.path}
                        onClick={() => setSelectedLivery(livery)}
                        className={`cursor-pointer rounded-[12px] overflow-hidden border-[2px] transition-all ${
                          selectedLivery?.path === livery.path ? 'border-black ring-2 ring-black/20' : 'border-black/10 hover:border-black/30'
                        }`}
                      >
                        <img src={livery.path} alt={livery.name} className="w-full h-[96px] object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        <div className="p-[8px] bg-[#f9fafb]">
                          <p className="text-[13px] text-[#0a0a0a] truncate" style={FBold}>{livery.name}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {availableLiveries.length === 0 && (
                    <div className="text-center py-[32px] text-[#4a5565] text-[13px]" style={FR}>No liveries available for this series.</div>
                  )}
                </div>
                <div className="flex gap-[12px]">
                  <button onClick={closeCarModalAndReset} className="flex-1 h-[40px] border-[0.8px] border-black/20 rounded-[12px] text-[13px] text-[#4a5565] hover:bg-[#f9fafb] transition-colors" style={FR}>Cancel</button>
                  <button onClick={() => selectedLivery && setShowPurchaseConfirm(true)} disabled={!selectedLivery || budget < (CAR_COSTS[selectedChampionship.tier] || 100000)} className="flex-1 h-[40px] bg-black text-white rounded-[16px] text-[13px] flex items-center justify-center gap-[8px] hover:bg-black/90 transition-colors disabled:bg-[#f9fafb] disabled:text-[#4a5565] disabled:cursor-not-allowed" style={FBold}>
                    <Car className="w-[16px] h-[16px]" /> Buy car
                  </button>
                </div>
              </>
            )}
          </div>
        )}
          </div>
        </div>
      )}
      
      {/* Details Modal */}
      {showDetailsModal && selectedChampionship && (() => {
          const seriesData = getSeriesById(selectedChampionship.id)
          const standings = getStandings(selectedChampionship.id)
          const baseCalendar = seriesData?.calendar || []
          const fallbackCalendar = (
            baseCalendar.length === 0 &&
            (selectedChampionship.seasonRounds ?? 0) > 0
          )
            ? generateCalendar(selectedChampionship.id, careerState?.currentYear || new Date().getFullYear())
            : []
          const calendar = fallbackCalendar.length > 0 ? fallbackCalendar : baseCalendar
          const displayRoundCount = calendar.length > 0
            ? calendar.length
            : (selectedChampionship.seasonRounds || 0)
          const currentWeek = careerState?.currentWeek || 1
          const regenerateSchedule = () => {
            const rebuilt = repairSeriesCalendar(
              selectedChampionship.id,
              careerState?.currentYear || new Date().getFullYear()
            )
            if (rebuilt.length > 0) {
              addToast({ type: 'success', title: 'Schedule regenerated', message: `Generated ${rebuilt.length} round${rebuilt.length > 1 ? 's' : ''} for ${selectedChampionship.shortName}.`, duration: 3000 })
            } else {
              addToast({ type: 'warning', title: 'Could not regenerate schedule', message: 'No valid rounds could be generated for this series.', duration: 3500 })
            }
          }
          
          return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-[24px]" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white rounded-[24px] max-w-[800px] w-full max-h-[85vh] overflow-y-auto p-[24px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-[16px]">
              <h2 className="text-[20px] text-[#0a0a0a]" style={FB}>Series Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="w-[32px] h-[32px] rounded-full bg-[#f9fafb] flex items-center justify-center text-[#4a5565] hover:bg-black/10 transition-colors text-[18px]">&times;</button>
            </div>
          <div className="space-y-[16px]">
            {/* Header */}
            <div className="flex items-center gap-[16px] pb-[16px] border-b border-black/10">
              <div className="flex-1">
                <div className="flex items-center gap-[6px] mb-[4px]">
                  <span className="px-[8px] py-[2px] text-[11px] rounded-[6px] bg-[#f9fafb] text-[#0a0a0a] border-[0.8px] border-black/10" style={FBold}>{selectedChampionship.tier.toUpperCase()}</span>
                  <span className="px-[8px] py-[2px] text-[11px] rounded-[6px] border-[0.8px] border-black/10 text-[#4a5565]" style={FR}>{getFormatIcon(selectedChampionship.format)}</span>
                  {isSeriesEntered(selectedChampionship.id) && (
                    <span className="px-[8px] py-[2px] text-[11px] rounded-[6px] bg-[#00a63e] text-white flex items-center gap-[2px]" style={FBold}><Check className="w-[12px] h-[12px]" /> Entered</span>
                  )}
                </div>
                <h2 className="text-[20px] text-[#0a0a0a]" style={FB}>{selectedChampionship.name}</h2>
                <p className="text-[13px] text-[#4a5565]" style={FR}>{selectedChampionship.description}</p>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-[#4a5565]" style={FR}>Entry Fee</div>
                <div className="text-[18px] text-[#ef4444]" style={FB}>{formatCurrency(ENTRY_FEES[selectedChampionship.tier] || 50000)}</div>
              </div>
            </div>
            
            {/* Custom Tabs */}
            {(() => {
              const [detailTab, setDetailTab] = [detailsTab, setDetailsTab]
              return (
              <>
              <div className="flex gap-[4px] border-b border-black/10 pb-[4px]">
                {(['overview', 'schedule', 'standings', ...(isSeriesEntered(selectedChampionship.id) ? ['entry'] : [])] as const).map(tab => (
                  <button key={tab} onClick={() => setDetailTab(tab as any)} className={`px-[12px] py-[6px] text-[12px] rounded-[8px] transition-colors ${detailTab === tab ? 'bg-black text-white' : 'text-[#4a5565] hover:bg-[#f9fafb]'}`} style={FBold}>
                    {tab === 'overview' ? 'Overview' : tab === 'schedule' ? `Schedule (${displayRoundCount} rounds)` : tab === 'standings' ? `Standings ${standings.length > 0 ? `(${standings.length})` : ''}` : 'Your Entry'}
                  </button>
                ))}
              </div>
              
              {detailTab === 'overview' && (
                <div className="space-y-[16px]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-[12px]">
                  <div className="bg-[#f9fafb] rounded-[12px] p-[12px] text-center">
                    <Globe className="w-[20px] h-[20px] mx-auto mb-[4px] text-[#4a5565]" />
                    <div className="text-[11px] text-[#4a5565]" style={FR}>Region</div>
                    <div className="text-[14px] text-[#0a0a0a]" style={FBold}>{selectedChampionship.region}</div>
                  </div>
                  <div className="bg-[#f9fafb] rounded-[12px] p-[12px] text-center">
                    <Calendar className="w-[20px] h-[20px] mx-auto mb-[4px] text-[#4a5565]" />
                    <div className="text-[11px] text-[#4a5565]" style={FR}>Rounds</div>
                    <div className="text-[14px] text-[#0a0a0a]" style={FBold}>{displayRoundCount}</div>
                  </div>
                  <div className="bg-[#f9fafb] rounded-[12px] p-[12px] text-center">
                    <Star className="w-[20px] h-[20px] mx-auto mb-[4px] text-[#f59e0b]" />
                    <div className="text-[11px] text-[#4a5565]" style={FR}>Prestige</div>
                    <div className="text-[14px] text-[#0a0a0a]" style={FBold}>{selectedChampionship.prestige}</div>
                  </div>
                  <div className="bg-[#f9fafb] rounded-[12px] p-[12px] text-center">
                    <DollarSign className="w-[20px] h-[20px] mx-auto mb-[4px] text-[#00a63e]" />
                    <div className="text-[11px] text-[#4a5565]" style={FR}>Prize Pool</div>
                    <div className="text-[14px] text-[#00a63e]" style={FBold}>{formatCurrency(selectedChampionship.prizePool)}</div>
                  </div>
                </div>
                <div>
                  <h4 className="text-[13px] text-[#0a0a0a] mb-[8px]" style={FBold}>Car Classes</h4>
                  <div className="flex flex-wrap gap-[8px]">
                    {getCarClasses(selectedChampionship).map(cls => (
                      <span key={cls.id} className="px-[8px] py-[2px] text-[11px] border-[0.8px] border-black/10 rounded-[6px] text-[#4a5565]" style={FR}>{cls.name}</span>
                    ))}
                  </div>
                </div>
                </div>
              )}
              
              {detailTab === 'schedule' && (
                <div className="space-y-[8px]">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => { setShowAddRound(!showAddRound); setAddTrackId(''); setAddLayoutId('') }}
                    className="h-[32px] px-[12px] border-[0.8px] border-black/20 rounded-[12px] text-[12px] text-[#0a0a0a] flex items-center gap-[8px] hover:bg-[#f9fafb] transition-colors"
                    style={FBold}
                  >
                    <Plus className="w-[16px] h-[16px]" /> Add Round
                  </button>
                  <button onClick={regenerateSchedule} className="h-[32px] px-[12px] border-[0.8px] border-black/20 rounded-[12px] text-[12px] text-[#4a5565] flex items-center gap-[8px] hover:bg-[#f9fafb] transition-colors" style={FR}>
                    <RefreshCw className="w-[14px] h-[14px]" /> Regenerate
                  </button>
                </div>

                {showAddRound && (
                  <div className="p-[12px] rounded-[12px] border-[0.8px] border-[#3b82f6]/30 bg-[#3b82f6]/5 space-y-[8px]">
                    <div className="text-[12px] text-[#0a0a0a]" style={FBold}>Add New Round</div>
                    <div className="grid grid-cols-[1fr_1fr_80px] gap-[8px]">
                      <select
                        value={addTrackId}
                        onChange={(e) => { setAddTrackId(e.target.value); setAddLayoutId('') }}
                        className="h-[32px] px-[8px] text-[12px] text-[#0a0a0a] border-[0.8px] border-black/20 rounded-[8px] bg-white"
                        style={FR}
                      >
                        <option value="">Select track...</option>
                        {sortedTracks.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.country})</option>
                        ))}
                      </select>
                      <select
                        value={addLayoutId}
                        onChange={(e) => setAddLayoutId(e.target.value)}
                        className="h-[32px] px-[8px] text-[12px] text-[#0a0a0a] border-[0.8px] border-black/20 rounded-[8px] bg-white"
                        style={FR}
                        disabled={!addTrackId}
                      >
                        <option value="">Layout...</option>
                        {addTrackId && AMS2_TRACKS.find(t => t.id === addTrackId)?.layouts.filter(l => l.sourceVerified).map(l => (
                          <option key={l.id} value={l.id}>{l.name} ({l.lengthKm}km)</option>
                        ))}
                      </select>
                      <input
                        type="number" min={1} max={52} value={addWeek}
                        onChange={(e) => setAddWeek(parseInt(e.target.value) || 1)}
                        className="h-[32px] px-[8px] text-[12px] text-[#0a0a0a] border-[0.8px] border-black/20 rounded-[8px] bg-white text-center"
                        style={FR}
                        placeholder="Week"
                      />
                    </div>
                    <div className="flex gap-[8px] justify-end">
                      <button onClick={() => setShowAddRound(false)} className="h-[28px] px-[10px] text-[11px] text-[#4a5565] rounded-[8px] hover:bg-black/5" style={FR}>Cancel</button>
                      <button
                        disabled={!addTrackId || !addLayoutId}
                        onClick={() => {
                          addRound(selectedChampionship.id, addTrackId, addLayoutId, addWeek)
                          setShowAddRound(false)
                          setAddTrackId(''); setAddLayoutId('')
                          addToast({ type: 'success', title: 'Round added', message: `Added new round to ${selectedChampionship.shortName}.`, duration: 2500 })
                        }}
                        className="h-[28px] px-[10px] text-[11px] text-white bg-[#0a0a0a] rounded-[8px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1a1a1a]"
                        style={FBold}
                      >
                        Add Round
                      </button>
                    </div>
                  </div>
                )}

                {calendar.length > 0 ? (
                  <div className="max-h-[320px] overflow-y-auto space-y-[8px]">
                    {calendar.map((event) => {
                      const isCompleted = event.week < currentWeek
                      const isUpcoming = event.week === currentWeek
                      const isEditing = editingRound === event.round

                      if (isEditing) {
                        const editTrack = AMS2_TRACKS.find(t => t.id === event.trackId)
                        return (
                          <div key={event.id} className="p-[12px] rounded-[12px] border-[0.8px] border-[#f59e0b]/30 bg-[#f59e0b]/5 space-y-[8px]">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-[8px]">
                                <div className="w-[32px] h-[32px] rounded-full bg-[#f59e0b] text-white flex items-center justify-center text-[12px]" style={FBold}>{event.round}</div>
                                <span className="text-[12px] text-[#0a0a0a]" style={FBold}>Editing Round {event.round}</span>
                              </div>
                              <button onClick={() => setEditingRound(null)} className="text-[11px] text-[#4a5565] hover:text-[#0a0a0a]" style={FR}>Done</button>
                            </div>
                            <div className="grid grid-cols-[1fr_1fr] gap-[8px]">
                              <select
                                value={event.trackId}
                                onChange={(e) => {
                                  const t = AMS2_TRACKS.find(tr => tr.id === e.target.value)
                                  if (t) {
                                    const verifiedLayouts = t.layouts.filter(l => l.sourceVerified)
                                    const defaultLid = verifiedLayouts.find(l => l.id === t.defaultLayout)?.id || verifiedLayouts[0]?.id || t.layouts[0]?.id
                                    updateRoundTrack(selectedChampionship.id, event.round, t.id, defaultLid)
                                  }
                                }}
                                className="h-[32px] px-[8px] text-[12px] text-[#0a0a0a] border-[0.8px] border-black/20 rounded-[8px] bg-white"
                                style={FR}
                              >
                                {sortedTracks.map(t => (
                                  <option key={t.id} value={t.id}>{t.name} ({t.country})</option>
                                ))}
                              </select>
                              <select
                                value={event.layoutId}
                                onChange={(e) => updateRoundTrack(selectedChampionship.id, event.round, event.trackId, e.target.value)}
                                className="h-[32px] px-[8px] text-[12px] text-[#0a0a0a] border-[0.8px] border-black/20 rounded-[8px] bg-white"
                                style={FR}
                              >
                                {editTrack?.layouts.filter(l => l.sourceVerified).map(l => (
                                  <option key={l.id} value={l.id}>{l.name} ({l.lengthKm}km, {l.turns} turns)</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div key={event.id} className={`flex items-center gap-[16px] p-[12px] rounded-[12px] border-[0.8px] ${isUpcoming ? 'bg-[#ef4444]/10 border-[#ef4444]/30' : isCompleted ? 'bg-[#f9fafb]/50 border-black/10 opacity-60' : 'bg-[#f9fafb] border-black/10'} group`}>
                          <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center text-[12px] ${isUpcoming ? 'bg-[#ef4444] text-white' : isCompleted ? 'bg-black/5 text-[#4a5565]' : 'bg-black/5 text-[#0a0a0a]'}`} style={FBold}>{event.round}</div>
                          <div className="flex-1">
                            <div className="text-[13px] text-[#0a0a0a]" style={FBold}>{event.trackName}</div>
                            <div className="text-[11px] text-[#4a5565] flex items-center gap-[8px]" style={FR}>
                              <MapPin className="w-[12px] h-[12px]" />{event.country} · {event.layoutName} · {event.lengthKm}km
                            </div>
                          </div>
                          <div className="flex items-center gap-[8px]">
                            <div className="text-right mr-[4px]">
                              <div className="text-[12px] text-[#4a5565]" style={FR}>Week {event.week}</div>
                              {isCompleted && <div className="text-[11px] text-[#00a63e]" style={FR}><Check className="w-[12px] h-[12px] inline mr-[4px]" />Done</div>}
                              {isUpcoming && <div className="text-[11px] text-[#ef4444]" style={FBold}><Flag className="w-[12px] h-[12px] inline mr-[4px]" />This Week</div>}
                            </div>
                            {!isCompleted && (
                              <div className="flex gap-[4px] opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setEditingRound(event.round)}
                                  className="w-[28px] h-[28px] flex items-center justify-center rounded-[8px] border-[0.8px] border-black/15 hover:bg-[#f59e0b]/10 hover:border-[#f59e0b]/30 transition-colors"
                                  title="Edit track/layout"
                                >
                                  <Pencil className="w-[13px] h-[13px] text-[#4a5565]" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Remove Round ${event.round} (${event.trackName})?`)) {
                                      removeRound(selectedChampionship.id, event.round)
                                      addToast({ type: 'info', title: 'Round removed', message: `Removed ${event.trackName} from schedule.`, duration: 2500 })
                                    }
                                  }}
                                  className="w-[28px] h-[28px] flex items-center justify-center rounded-[8px] border-[0.8px] border-black/15 hover:bg-[#ef4444]/10 hover:border-[#ef4444]/30 transition-colors"
                                  title="Remove round"
                                >
                                  <Trash2 className="w-[13px] h-[13px] text-[#4a5565]" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-[32px]">
                    <Calendar className="w-[32px] h-[32px] mx-auto text-[#4a5565] mb-[8px]" />
                    <p className="text-[#4a5565] text-[13px]" style={FR}>Calendar not yet generated.{displayRoundCount > 0 ? ` Expected rounds: ${displayRoundCount}.` : ''}</p>
                    {displayRoundCount > 0 && (
                      <button onClick={regenerateSchedule} className="mt-[12px] h-[32px] px-[12px] border-[0.8px] border-black/20 rounded-[12px] text-[12px] text-[#0a0a0a] flex items-center gap-[8px] mx-auto hover:bg-[#f9fafb] transition-colors" style={FBold}>
                        <RefreshCw className="w-[16px] h-[16px]" /> Regenerate Schedule
                      </button>
                    )}
                  </div>
                )}
                </div>
              )}
              
              {detailTab === 'standings' && (
                <div className="space-y-[8px]">
                {standings.length > 0 ? (
                  <div className="max-h-[320px] overflow-y-auto">
                    <table className="w-full text-[12px]" style={FR}>
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b border-black/10">
                          <th className="text-left py-[8px] px-[8px] text-[#4a5565] w-[40px]" style={FBold}>Pos</th>
                          <th className="text-left py-[8px] px-[8px] text-[#4a5565]" style={FBold}>Driver</th>
                          <th className="text-left py-[8px] px-[8px] text-[#4a5565]" style={FBold}>Team</th>
                          <th className="text-center py-[8px] px-[8px] text-[#4a5565] w-[48px]" style={FBold}>Pts</th>
                          <th className="text-center py-[8px] px-[8px] text-[#4a5565] w-[40px]" style={FBold}>W</th>
                          <th className="text-center py-[8px] px-[8px] text-[#4a5565] w-[40px]" style={FBold}>Pod</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((standing, index) => (
                          <tr key={standing.driverId} className={`border-b border-black/5 ${standing.isPlayer ? 'bg-black/5' : index % 2 === 0 ? 'bg-[#f9fafb]/50' : ''}`}>
                            <td className="py-[6px] px-[8px]">
                              <span className={`inline-flex items-center justify-center w-[24px] h-[24px] rounded-[4px] text-[11px] ${
                                standing.position === 1 ? 'bg-[#f59e0b] text-black' :
                                standing.position === 2 ? 'bg-gray-400 text-black' :
                                standing.position === 3 ? 'bg-amber-700 text-white' :
                                'bg-[#f9fafb] text-[#4a5565]'
                              }`} style={FBold}>{standing.position}</span>
                            </td>
                            <td className="py-[6px] px-[8px]">
                              <div className="flex items-center gap-[8px]">
                                <img src={getDriverPortrait(standing.driverName)} alt="" className="w-[24px] h-[24px] rounded-full object-cover bg-gray-200" />
                                <span className={`${standing.isPlayer ? 'text-[#0a0a0a]' : 'text-[#0a0a0a]'}`} style={standing.isPlayer ? FBold : FR}>
                                  {standing.driverName}{standing.isPlayer && <span className="ml-[4px] text-[10px] text-[#4a5565]">(You)</span>}
                                </span>
                              </div>
                            </td>
                            <td className="py-[6px] px-[8px] text-[#4a5565]">{standing.teamName}</td>
                            <td className="py-[6px] px-[8px] text-center text-[#0a0a0a]" style={FBold}>{standing.points}</td>
                            <td className="py-[6px] px-[8px] text-center text-[#4a5565]">{standing.wins}</td>
                            <td className="py-[6px] px-[8px] text-center text-[#4a5565]">{standing.podiums}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-[32px]">
                    <Trophy className="w-[32px] h-[32px] mx-auto text-[#4a5565] mb-[8px]" />
                    <p className="text-[#4a5565] text-[13px]" style={FR}>No standings data available yet.</p>
                    <p className="text-[#4a5565] text-[11px] mt-[4px]" style={FR}>Standings will appear after the season begins.</p>
                  </div>
                )}
                </div>
              )}
              
              {detailTab === 'entry' && isSeriesEntered(selectedChampionship.id) && (
                <div className="space-y-[16px]">
                  <div className="bg-[#00a63e]/10 border-[0.8px] border-[#00a63e]/30 rounded-[16px] p-[16px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-[8px]">
                        <Check className="w-[20px] h-[20px] text-[#00a63e]" />
                        <span className="text-[13px] text-[#00a63e]" style={FBold}>You are entered in this series</span>
                      </div>
                      <div className="flex items-center gap-[8px]">
                        <Car className="w-[16px] h-[16px] text-[#4a5565]" />
                        <span className="text-[13px] text-[#4a5565]" style={FR}>{getCarCount(selectedChampionship.id)}/{getSeriesMaxTeamCars(selectedChampionship.id)} Cars</span>
                      </div>
                    </div>
                    <div className="mt-[12px] pt-[12px] border-t border-[#00a63e]/20">
                      <h5 className="text-[12px] text-[#4a5565] mb-[8px]" style={FBold}>Your Cars & Drivers</h5>
                      <div className="space-y-[8px]">
                        {cars.filter(c => getCarSeriesAssignments(c).includes(selectedChampionship.id)).map((car, idx) => (
                          <div key={car.carId} className="flex items-center gap-[12px] bg-[#f9fafb]/50 rounded-[12px] p-[12px]">
                            <div className="w-[32px] h-[32px] rounded-[8px] bg-[#f9fafb] flex items-center justify-center text-[12px] text-[#0a0a0a]" style={FBold}>#{idx + 1}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-[8px]">
                                <div className={`w-[8px] h-[8px] rounded-full flex-shrink-0 ${car.driverType === 'owner' ? 'bg-[#ef4444]' : car.driverType === 'hired' ? 'bg-[#00a63e]' : 'bg-[#4a5565]'}`} />
                                <span className="text-[13px] text-[#0a0a0a] truncate" style={FBold}>{getDriverNameForCar(car)}</span>
                                {car.driverType === 'owner' && <span className="px-[6px] py-[1px] text-[10px] bg-[#ef4444]/10 text-[#ef4444] rounded-[4px]" style={FBold}>Owner</span>}
                                {car.driverType === 'unassigned' && <span className="px-[6px] py-[1px] text-[10px] border-[0.8px] border-black/10 text-[#4a5565] rounded-[4px]" style={FR}>No Driver</span>}
                              </div>
                              <div className="flex items-center gap-[8px] mt-[4px]">
                                <Car className="w-[12px] h-[12px] text-[#4a5565]" />
                                <span className="text-[11px] text-[#4a5565] truncate" style={FR}>{car.liveryName}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-[12px] text-[11px]" style={FR}>
                              <div className="text-center">
                                <div className="text-[#2563eb]" style={FBold}>{car.reliability}%</div>
                                <div className="text-[#4a5565]">Rel</div>
                              </div>
                              <div className="text-center">
                                <div className="text-[#ef4444]" style={FBold}>{car.performance}</div>
                                <div className="text-[#4a5565]">Perf</div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {getCarCount(selectedChampionship.id) < getSeriesMaxTeamCars(selectedChampionship.id) && (
                          <div className="flex items-center justify-center gap-[8px] p-[12px] border-[2px] border-dashed border-black/10 rounded-[12px] text-[#4a5565]">
                            <Plus className="w-[16px] h-[16px]" />
                            <span className="text-[13px]" style={FR}>You can add {getSeriesMaxTeamCars(selectedChampionship.id) - getCarCount(selectedChampionship.id)} more car(s)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {standings.length > 0 && (
                    <div>
                      <h5 className="text-[12px] text-[#4a5565] mb-[8px]" style={FBold}>Your Championship Position</h5>
                      {(() => {
                        const playerStanding = standings.find(s => s.isPlayer)
                        if (playerStanding) {
                          return (
                            <div className="bg-[#f9fafb] rounded-[16px] p-[16px]">
                              <div className="grid grid-cols-4 gap-[16px] text-center">
                                <div><div className="text-[22px] text-[#ef4444]" style={FB}>{playerStanding.position}</div><div className="text-[11px] text-[#4a5565]" style={FR}>Position</div></div>
                                <div><div className="text-[22px] text-[#0a0a0a]" style={FB}>{playerStanding.points}</div><div className="text-[11px] text-[#4a5565]" style={FR}>Points</div></div>
                                <div><div className="text-[22px] text-[#00a63e]" style={FB}>{playerStanding.wins}</div><div className="text-[11px] text-[#4a5565]" style={FR}>Wins</div></div>
                                <div><div className="text-[22px] text-[#ea580c]" style={FB}>{playerStanding.podiums}</div><div className="text-[11px] text-[#4a5565]" style={FR}>Podiums</div></div>
                              </div>
                            </div>
                          )
                        }
                        return <div className="text-[13px] text-[#4a5565]" style={FR}>No race results yet.</div>
                      })()}
                    </div>
                  )}
                </div>
              )}
              </>
              )
            })()}
            
            {/* Actions */}
            <div className="flex gap-[12px] pt-[16px] border-t border-black/10">
              <button onClick={() => setShowDetailsModal(false)} className="flex-1 h-[40px] border-[0.8px] border-black/20 rounded-[12px] text-[13px] text-[#4a5565] hover:bg-[#f9fafb] transition-colors" style={FR}>Close</button>
              {isSeriesEntered(selectedChampionship.id) ? (
                <>
                  {getCarCount(selectedChampionship.id) < getSeriesMaxTeamCars(selectedChampionship.id) && (
                    <button onClick={() => { setShowDetailsModal(false); setShowCarModal(true) }} className="flex-1 h-[40px] bg-black text-white rounded-[16px] text-[13px] flex items-center justify-center gap-[8px] hover:bg-black/90 transition-colors" style={FBold}>
                      <Car className="w-[16px] h-[16px]" /> Buy Another Car
                    </button>
                  )}
                  <button onClick={handleWithdraw} className="h-[40px] px-[16px] border-[0.8px] border-[#ef4444] text-[#ef4444] rounded-[12px] text-[13px] flex items-center gap-[8px] hover:bg-[#ef4444]/10 transition-colors" style={FBold}>
                    <X className="w-[16px] h-[16px]" /> Withdraw
                  </button>
                </>
              ) : (
                <button onClick={() => { setShowDetailsModal(false); setSelectedChampionship(selectedChampionship); setShowAssignModal(true) }} className="flex-1 h-[40px] bg-black text-white rounded-[16px] text-[13px] flex items-center justify-center gap-[8px] hover:bg-black/90 transition-colors" style={FBold}>
                  <Plus className="w-[16px] h-[16px]" /> Enter Series
                </button>
              )}
            </div>
          </div>
          </div>
        </div>
        )})()}
      </div>
    </div>
  )
}
