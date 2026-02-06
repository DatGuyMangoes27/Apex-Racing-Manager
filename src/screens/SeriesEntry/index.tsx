import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Flag, DollarSign, Car, Users, Globe, 
  ChevronRight, Check, X, AlertCircle, Filter,
  Palette, Star, Calendar, MapPin, Layers, Building2,
  Plus, Minus, ShoppingCart, Eye, Lock, ArrowRight
} from 'lucide-react'
import { Card, CardHeader, Button, Badge, PageHeader, Modal, useToast, HeroImage, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import { useCareerStore, TeamSeriesEntry, TeamCar } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import { CHAMPIONSHIPS, Championship, ChampionshipRegion, ChampionshipFormat, getSeriesMaxTeamCars } from '@/data/championships'
import { AMS2_CAR_CLASSES, CarClass } from '@/data/ams2-cars'
import { getClassLiveriesFromManifest, getFirstLiveryImage } from '@/utils/images'
import { getCategoryImage, getTierImage } from '@/data/stock-images'

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card 
        className={`relative overflow-hidden transition-all duration-300 hover:ring-2 ${
          isEntered ? 'ring-2 ring-status-success/50 bg-status-success/5' : 'hover:ring-accent-red/30'
        }`}
      >
        {/* Content */}
        <div className="p-4">
          {/* Header with badges */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={getTierBadgeVariant(championship.tier)} size="sm">
                {championship.tier.toUpperCase()}
              </Badge>
              <Badge variant="outline" size="sm">
                {getFormatIcon(championship.format)}
              </Badge>
              {isEntered && (
                <Badge variant="default" size="sm" className="bg-status-success text-white">
                  <Check className="w-3 h-3 mr-1" />
                  Entered
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-text-muted text-xs">
              <Globe className="w-3 h-3" />
              {championship.region}
            </div>
          </div>
          
          <div className="mb-2">
            <h3 className="font-semibold text-text-primary group-hover:text-accent-red transition-colors">
              {championship.shortName}
            </h3>
            <p className="text-xs text-text-muted">{championship.name}</p>
          </div>
          
          {/* Car Classes */}
          <div className="flex flex-wrap gap-1 mb-3">
            {carClasses.map(cls => (
              <span key={cls.id} className="text-xs px-2 py-0.5 bg-surface-secondary rounded text-text-secondary">
                {cls.name}
              </span>
            ))}
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
            <div className="text-center p-2 bg-surface-secondary/50 rounded">
              <div className="text-text-muted">Rounds</div>
              <div className="font-semibold text-text-primary">{championship.seasonRounds}</div>
            </div>
            <div className="text-center p-2 bg-surface-secondary/50 rounded">
              <div className="text-text-muted">Prestige</div>
              <div className={`font-semibold ${getTierColor(championship.tier)}`}>{championship.prestige}</div>
            </div>
            <div className="text-center p-2 bg-surface-secondary/50 rounded">
              <div className="text-text-muted">Prize Pool</div>
              <div className="font-semibold text-status-success">{formatCurrency(championship.prizePool)}</div>
            </div>
          </div>
          
          {/* Entry Info */}
          <div className="flex items-center justify-between py-2 border-t border-border-subtle">
            {!isEntered ? (
              <>
                <div className="text-xs">
                  <span className="text-text-muted">Entry Fee: </span>
                  <span className={`font-semibold ${canAffordEntry ? 'text-text-primary' : 'text-status-error'}`}>
                    {formatCurrency(entryFee)}
                  </span>
                </div>
                <div className="text-xs">
                  {compatibleCarsCount > 0 ? (
                    <span className="text-status-success">{compatibleCarsCount} car{compatibleCarsCount > 1 ? 's' : ''} available</span>
                  ) : (
                    <span className="text-text-muted">No compatible cars</span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="text-xs">
                  <span className="text-status-success">Entered</span>
                  <span className="text-text-muted"> • {carCount}/{maxCars} cars</span>
                </div>
                {carCount < maxCars && compatibleCarsCount > 0 && (
                  <div className="text-xs text-status-info">
                    {compatibleCarsCount} car{compatibleCarsCount > 1 ? 's' : ''} can be added
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 mt-3">
            {carCount >= maxCars ? (
              <Button variant="outline" size="sm" className="flex-1" disabled>
                <Check className="w-4 h-4 mr-1" />
                Max Cars ({carCount}/{maxCars})
              </Button>
            ) : hasAnyCompatibleCar ? (
              <Button 
                variant={canAffordEntry || isEntered ? 'primary' : 'outline'}
                size="sm" 
                className="flex-1"
                onClick={onAssignCar}
                disabled={!isEntered && !canAffordEntry}
              >
                {!isEntered && !canAffordEntry ? (
                  <>
                    <Lock className="w-4 h-4 mr-1" />
                    Need {formatCurrency(entryFee)}
                  </>
                ) : (
                  <>
                    <Flag className="w-4 h-4 mr-1" />
                    {isEntered ? 'Assign Car' : 'Enter'}
                  </>
                )}
              </Button>
            ) : (
              <Button 
                variant="outline"
                size="sm" 
                className="flex-1"
                onClick={onGoToMarketplace}
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                Buy a Car
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onViewDetails}>
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
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
  const { getSeriesById, getStandings, rivals } = useRivalStore()
  const { addToast } = useToast()
  
  // Filter state
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all')
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all')
  const [showFilters, setShowFilters] = useState(true)
  
  // Modal state
  const [selectedChampionship, setSelectedChampionship] = useState<Championship | null>(null)
  const [showEntryModal, setShowEntryModal] = useState(false)
  const [showCarModal, setShowCarModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedLivery, setSelectedLivery] = useState<LiveryOption | null>(null)
  const [selectedCar, setSelectedCar] = useState<TeamCar | null>(null)
  
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
  
  // Get unassigned cars that are compatible with a series
  const getCompatibleUnassignedCars = (championship: Championship): TeamCar[] => {
    return cars.filter(car => {
      // Car must be unassigned (no seriesId)
      if (car.seriesId) return false
      // Car's class must be in the championship's allowed classes
      return championship.carClassIds.includes(car.chassisId)
    })
  }
  
  // Get ALL compatible cars (assigned or not) - for checking if user owns any suitable car
  const getAllCompatibleCars = (championship: Championship): TeamCar[] => {
    return cars.filter(car => championship.carClassIds.includes(car.chassisId))
  }
  
  // Filter championships
  const filteredChampionships = useMemo(() => {
    return CHAMPIONSHIPS.filter(champ => {
      if (tierFilter !== 'all' && champ.tier !== tierFilter) return false
      if (regionFilter !== 'all' && champ.region !== regionFilter) return false
      if (formatFilter !== 'all' && champ.format !== formatFilter) return false
      return true
    }).sort((a, b) => b.prestige - a.prestige)
  }, [tierFilter, regionFilter, formatFilter])
  
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
    return cars.filter(c => c.seriesId === seriesId).length
  }
  
  // Handle entering a series
  const handleEnterSeries = () => {
    if (!selectedChampionship) return
    
    const entryFee = ENTRY_FEES[selectedChampionship.tier] || 50000
    const success = enterSeries(
      selectedChampionship.id,
      selectedChampionship.name,
      entryFee
    )
    
    if (success) {
      addToast({
        type: 'success',
        title: 'Series Entered',
        message: `Welcome to ${selectedChampionship.shortName}! Now purchase a car to compete.`,
        duration: 4000
      })
      setShowEntryModal(false)
      // Open car purchase modal
      setShowCarModal(true)
    } else {
      addToast({
        type: 'error',
        title: 'Entry Failed',
        message: 'Insufficient funds to enter this series.',
        duration: 3000
      })
    }
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
  
  // Handle purchasing a car (automatically enters series if first car)
  const handlePurchaseCar = () => {
    if (!selectedChampionship || !selectedLivery) return
    
    const carCost = CAR_COSTS[selectedChampionship.tier] || 100000
    const entryFee = ENTRY_FEES[selectedChampionship.tier] || 50000
    const primaryClass = AMS2_CAR_CLASSES.find(c => c.id === selectedChampionship.carClassIds[0])
    const isFirstCar = !isSeriesEntered(selectedChampionship.id)
    
    const success = purchaseCar(
      selectedChampionship.id,
      selectedLivery.name,
      primaryClass?.id || 'unknown',
      primaryClass?.id || 'unknown',
      carCost,
      selectedChampionship.name,  // Pass series name for entry creation
      isFirstCar ? entryFee : 0   // Pass entry fee only for first car
    )
    
    if (success) {
      addToast({
        type: 'success',
        title: isFirstCar ? 'Entered Series!' : 'Car Purchased',
        message: isFirstCar 
          ? `You've entered ${selectedChampionship.shortName} with your new ${selectedLivery.name}!`
          : `${selectedLivery.name} is ready for ${selectedChampionship.shortName}!`,
        duration: 4000
      })
      setShowCarModal(false)
      setSelectedLivery(null)
    } else {
      addToast({
        type: 'error',
        title: 'Purchase Failed',
        message: 'Insufficient funds or maximum cars reached.',
        duration: 3000
      })
    }
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
    
    // Assign the car to the series
    const updatedCar: TeamCar = {
      ...selectedCar,
      seriesId: selectedChampionship.id,
      driverType: carCount === 0 ? 'owner' : 'unassigned'
    }
    
    upsertCar(updatedCar)
    
    // Create series entry if first car
    if (isFirstCar) {
      enterSeries(
        selectedChampionship.id,
        selectedChampionship.name,
        entryFee
      )
      
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
  
  // Summary of current entries
  const enteredCount = seriesEntries.length
  const totalCars = cars.length
  
  return (
    <div className="min-h-screen pb-8">
      <PageHeader 
        title="Series Entry"
        subtitle="Enter championships and acquire cars for your team"
        icon={<Trophy className="w-6 h-6" />}
      />
      
      {/* Budget Bar */}
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-status-success" />
                <div>
                  <div className="text-xs text-text-muted">Available Budget</div>
                  <div className="text-xl font-bold text-status-success">{formatCurrency(budget)}</div>
                </div>
              </div>
              <div className="h-8 w-px bg-border-subtle" />
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-accent-red" />
                <div>
                  <div className="text-xs text-text-muted">Series Entered</div>
                  <div className="text-xl font-bold text-text-primary">{enteredCount}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-accent-orange" />
                <div>
                  <div className="text-xs text-text-muted">Total Cars</div>
                  <div className="text-xl font-bold text-text-primary">{totalCars}</div>
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </Card>
      </div>
      
      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-7xl mx-auto px-6 mb-6"
          >
            <Card className="p-4">
              <div className="flex flex-wrap gap-4">
                {/* Tier Filter */}
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Tier</label>
                  <select 
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value as TierFilter)}
                    className="bg-surface-secondary border border-border-subtle rounded px-3 py-1.5 text-sm text-text-primary"
                  >
                    <option value="all">All Tiers</option>
                    <option value="entry">Entry</option>
                    <option value="amateur">Amateur</option>
                    <option value="semi-pro">Semi-Pro</option>
                    <option value="pro">Pro</option>
                    <option value="elite">Elite</option>
                    <option value="pinnacle">Pinnacle</option>
                  </select>
                </div>
                
                {/* Region Filter */}
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Region</label>
                  <select 
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value as RegionFilter)}
                    className="bg-surface-secondary border border-border-subtle rounded px-3 py-1.5 text-sm text-text-primary"
                  >
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
                
                {/* Format Filter */}
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Format</label>
                  <select 
                    value={formatFilter}
                    onChange={(e) => setFormatFilter(e.target.value as FormatFilter)}
                    className="bg-surface-secondary border border-border-subtle rounded px-3 py-1.5 text-sm text-text-primary"
                  >
                    <option value="all">All Formats</option>
                    <option value="sprint">Sprint</option>
                    <option value="endurance">Endurance</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                
                <div className="flex-1" />
                
                <div className="flex items-end">
                  <span className="text-sm text-text-muted">
                    Showing {filteredChampionships.length} of {CHAMPIONSHIPS.length} series
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Series Grid */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 mx-auto text-text-muted mb-4" />
            <p className="text-text-muted">No series match your filters.</p>
          </div>
        )}
      </div>
      
      {/* Entry Confirmation Modal */}
      <Modal
        isOpen={showEntryModal}
        onClose={() => setShowEntryModal(false)}
        title="Enter Series"
        size="md"
      >
        {selectedChampionship && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-bold text-text-primary">{selectedChampionship.name}</h3>
              <p className="text-sm text-text-muted">{selectedChampionship.description}</p>
            </div>
            
            <div className="bg-surface-secondary rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-muted">Tier:</span>
                  <span className={`ml-2 font-semibold ${getTierColor(selectedChampionship.tier)}`}>
                    {selectedChampionship.tier.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">Region:</span>
                  <span className="ml-2 text-text-primary">{selectedChampionship.region}</span>
                </div>
                <div>
                  <span className="text-text-muted">Rounds:</span>
                  <span className="ml-2 text-text-primary">{selectedChampionship.seasonRounds}</span>
                </div>
                <div>
                  <span className="text-text-muted">Prize Pool:</span>
                  <span className="ml-2 text-status-success">{formatCurrency(selectedChampionship.prizePool)}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-surface-tertiary border border-border-subtle rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Entry Fee</span>
                <span className="text-xl font-bold text-accent-red">
                  {formatCurrency(ENTRY_FEES[selectedChampionship.tier] || 50000)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="text-text-muted">Your Budget</span>
                <span className={budget >= (ENTRY_FEES[selectedChampionship.tier] || 50000) ? 'text-status-success' : 'text-status-error'}>
                  {formatCurrency(budget)}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowEntryModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                className="flex-1" 
                onClick={handleEnterSeries}
                disabled={budget < (ENTRY_FEES[selectedChampionship.tier] || 50000)}
              >
                <Check className="w-4 h-4 mr-2" />
                Confirm Entry
              </Button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Car Assignment Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false)
          setSelectedCar(null)
        }}
        title={isSeriesEntered(selectedChampionship?.id || '') ? "Assign Car" : "Enter Series"}
        size="lg"
      >
        {selectedChampionship ? (() => {
          const isFirstCar = !isSeriesEntered(selectedChampionship.id)
          const entryFee = ENTRY_FEES[selectedChampionship.tier] || 50000
          const compatibleCars = getCompatibleUnassignedCars(selectedChampionship)
          
          return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-text-primary">{selectedChampionship.shortName}</h3>
                <p className="text-sm text-text-muted">
                  {isFirstCar ? 'Select a car to enter this series' : 'Select a car to add to your entry'}
                </p>
              </div>
              {isFirstCar && (
                <div className="text-right">
                  <div className="text-xs text-text-muted">Entry Fee</div>
                  <div className="text-lg font-bold text-accent-red">
                    {formatCurrency(entryFee)}
                  </div>
                </div>
              )}
            </div>
            
            {/* Car Selection Grid */}
            <div className="max-h-80 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {compatibleCars.map((car, index) => (
                  <motion.div
                    key={car.carId}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedCar(car)}
                    className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedCar?.carId === car.carId 
                        ? 'border-accent-red ring-2 ring-accent-red/30' 
                        : 'border-border-subtle hover:border-accent-red/50'
                    }`}
                  >
                    {car.liveryPath ? (
                      <img 
                        src={car.liveryPath} 
                        alt={car.liveryName || 'Car'}
                        className="w-full h-24 object-cover"
                      />
                    ) : (
                      <div className="w-full h-24 bg-surface-elevated flex items-center justify-center">
                        <Car className="w-10 h-10 text-text-muted" />
                      </div>
                    )}
                    <div className="p-3 bg-surface-secondary">
                      <p className="font-medium text-text-primary truncate">{car.liveryName || car.chassisId}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="text-status-info">Rel: {car.reliability}%</span>
                        <span className="text-accent-red">Perf: {car.performance}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {compatibleCars.length === 0 && (
                <div className="text-center py-8">
                  <Car className="w-8 h-8 mx-auto text-text-muted mb-2" />
                  <p className="text-text-muted text-sm mb-4">No compatible unassigned cars available.</p>
                  <Button variant="outline" onClick={goToMarketplace}>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Go to Marketplace
                  </Button>
                </div>
              )}
            </div>
            
            {/* Selected Car Summary */}
            {selectedCar && (
              <div className="bg-surface-tertiary border border-border-subtle rounded-lg p-4">
                <div className="flex items-center gap-4">
                  {selectedCar.liveryPath ? (
                    <img 
                      src={selectedCar.liveryPath} 
                      alt={selectedCar.liveryName || 'Car'}
                      className="w-24 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-24 h-16 bg-surface-elevated rounded flex items-center justify-center">
                      <Car className="w-8 h-8 text-text-muted" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-text-primary">{selectedCar.liveryName || selectedCar.chassisId}</p>
                    <p className="text-sm text-text-muted">
                      {isFirstCar ? 'Will be assigned as Owner Car (#1)' : 'Will be added as Car #2'}
                    </p>
                  </div>
                  {isFirstCar && (
                    <div className="text-right">
                      <div className="text-sm text-text-muted">Entry Fee</div>
                      <div className="text-xl font-bold text-accent-red">
                        {formatCurrency(entryFee)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                className="flex-1" 
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedCar(null)
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                className="flex-1" 
                onClick={handleAssignCar}
                disabled={!selectedCar || (isFirstCar && budget < entryFee)}
              >
                <Check className="w-4 h-4 mr-2" />
                {isFirstCar ? 'Enter & Assign' : 'Assign Car'}
              </Button>
            </div>
          </div>
        )})() : null}
        
      </Modal>
      
      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Series Details"
        size="xl"
      >
        {selectedChampionship && (() => {
          const seriesData = getSeriesById(selectedChampionship.id)
          const standings = getStandings(selectedChampionship.id)
          const calendar = seriesData?.calendar || []
          const currentWeek = careerState?.currentWeek || 1
          
          return (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-border-subtle">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={getTierBadgeVariant(selectedChampionship.tier)}>
                    {selectedChampionship.tier.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">
                    {getFormatIcon(selectedChampionship.format)}
                  </Badge>
                  {isSeriesEntered(selectedChampionship.id) && (
                    <Badge variant="default" className="bg-status-success text-white">
                      <Check className="w-3 h-3 mr-1" />
                      Entered
                    </Badge>
                  )}
                </div>
                <h2 className="text-xl font-bold text-text-primary">{selectedChampionship.name}</h2>
                <p className="text-sm text-text-muted">{selectedChampionship.description}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-text-muted">Entry Fee</div>
                <div className="text-lg font-bold text-accent-red">
                  {formatCurrency(ENTRY_FEES[selectedChampionship.tier] || 50000)}
                </div>
              </div>
            </div>
            
            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="schedule">
                  Schedule ({calendar.length} rounds)
                </TabsTrigger>
                <TabsTrigger value="standings">
                  Standings {standings.length > 0 && `(${standings.length})`}
                </TabsTrigger>
                {isSeriesEntered(selectedChampionship.id) && (
                  <TabsTrigger value="entry">Your Entry</TabsTrigger>
                )}
              </TabsList>
              
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-surface-secondary rounded-lg p-3 text-center">
                    <Globe className="w-5 h-5 mx-auto mb-1 text-text-muted" />
                    <div className="text-xs text-text-muted">Region</div>
                    <div className="font-semibold text-text-primary">{selectedChampionship.region}</div>
                  </div>
                  <div className="bg-surface-secondary rounded-lg p-3 text-center">
                    <Calendar className="w-5 h-5 mx-auto mb-1 text-text-muted" />
                    <div className="text-xs text-text-muted">Rounds</div>
                    <div className="font-semibold text-text-primary">{selectedChampionship.seasonRounds}</div>
                  </div>
                  <div className="bg-surface-secondary rounded-lg p-3 text-center">
                    <Star className="w-5 h-5 mx-auto mb-1 text-accent-gold" />
                    <div className="text-xs text-text-muted">Prestige</div>
                    <div className="font-semibold text-text-primary">{selectedChampionship.prestige}</div>
                  </div>
                  <div className="bg-surface-secondary rounded-lg p-3 text-center">
                    <DollarSign className="w-5 h-5 mx-auto mb-1 text-status-success" />
                    <div className="text-xs text-text-muted">Prize Pool</div>
                    <div className="font-semibold text-status-success">{formatCurrency(selectedChampionship.prizePool)}</div>
                  </div>
                </div>
                
                {/* Car Classes */}
                <div>
                  <h4 className="font-semibold text-text-primary mb-2">Car Classes</h4>
                  <div className="flex flex-wrap gap-2">
                    {getCarClasses(selectedChampionship).map(cls => (
                      <Badge key={cls.id} variant="outline">
                        {cls.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              {/* Schedule Tab */}
              <TabsContent value="schedule" className="space-y-2">
                {calendar.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto">
                    <div className="space-y-2">
                      {calendar.map((event, index) => {
                        const isCompleted = event.week < currentWeek
                        const isUpcoming = event.week === currentWeek
                        
                        return (
                          <div 
                            key={event.id}
                            className={`flex items-center gap-4 p-3 rounded-lg border ${
                              isUpcoming 
                                ? 'bg-accent-red/10 border-accent-red/30' 
                                : isCompleted 
                                  ? 'bg-surface-secondary/50 border-border-subtle opacity-60' 
                                  : 'bg-surface-secondary border-border-subtle'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              isUpcoming ? 'bg-accent-red text-white' : isCompleted ? 'bg-surface-tertiary text-text-muted' : 'bg-surface-tertiary text-text-primary'
                            }`}>
                              {event.round}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-text-primary">{event.trackName}</div>
                              <div className="text-xs text-text-muted flex items-center gap-2">
                                <MapPin className="w-3 h-3" />
                                {event.country}
                                <span className="text-text-muted">•</span>
                                <span>{event.layoutName}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-text-secondary">Week {event.week}</div>
                              {isCompleted && (
                                <div className="text-xs text-status-success">
                                  <Check className="w-3 h-3 inline mr-1" />
                                  Completed
                                </div>
                              )}
                              {isUpcoming && (
                                <div className="text-xs text-accent-red font-medium">
                                  <Flag className="w-3 h-3 inline mr-1" />
                                  This Week
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-8 h-8 mx-auto text-text-muted mb-2" />
                    <p className="text-text-muted text-sm">Calendar not yet generated for this series.</p>
                  </div>
                )}
              </TabsContent>
              
              {/* Standings Tab */}
              <TabsContent value="standings" className="space-y-2">
                {standings.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-surface-primary">
                        <tr className="border-b border-border-subtle">
                          <th className="text-left py-2 px-2 text-text-muted font-medium w-10">Pos</th>
                          <th className="text-left py-2 px-2 text-text-muted font-medium">Driver</th>
                          <th className="text-left py-2 px-2 text-text-muted font-medium">Team</th>
                          <th className="text-center py-2 px-2 text-text-muted font-medium w-16">Pts</th>
                          <th className="text-center py-2 px-2 text-text-muted font-medium w-12">W</th>
                          <th className="text-center py-2 px-2 text-text-muted font-medium w-12">Pod</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((standing, index) => (
                          <tr 
                            key={standing.driverId}
                            className={`border-b border-border-subtle/50 ${
                              standing.isPlayer ? 'bg-accent-red/10' : index % 2 === 0 ? 'bg-surface-secondary/30' : ''
                            }`}
                          >
                            <td className="py-2 px-2">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                                standing.position === 1 ? 'bg-accent-gold text-black' :
                                standing.position === 2 ? 'bg-gray-400 text-black' :
                                standing.position === 3 ? 'bg-amber-700 text-white' :
                                'bg-surface-tertiary text-text-secondary'
                              }`}>
                                {standing.position}
                              </span>
                            </td>
                            <td className="py-2 px-2">
                              <span className={`font-medium ${standing.isPlayer ? 'text-accent-red' : 'text-text-primary'}`}>
                                {standing.driverName}
                                {standing.isPlayer && <span className="ml-1 text-xs">(You)</span>}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-text-secondary">{standing.teamName}</td>
                            <td className="py-2 px-2 text-center font-bold text-text-primary">{standing.points}</td>
                            <td className="py-2 px-2 text-center text-text-secondary">{standing.wins}</td>
                            <td className="py-2 px-2 text-center text-text-secondary">{standing.podiums}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="w-8 h-8 mx-auto text-text-muted mb-2" />
                    <p className="text-text-muted text-sm">No standings data available yet.</p>
                    <p className="text-text-muted text-xs mt-1">Standings will appear after the season begins.</p>
                  </div>
                )}
              </TabsContent>
              
              {/* Your Entry Tab */}
              {isSeriesEntered(selectedChampionship.id) && (
                <TabsContent value="entry" className="space-y-4">
                  <div className="bg-status-success/10 border border-status-success/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-status-success" />
                        <span className="font-semibold text-status-success">You are entered in this series</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-text-muted" />
                        <span className="text-text-secondary">
                          {getCarCount(selectedChampionship.id)}/{getSeriesMaxTeamCars(selectedChampionship.id)} Cars
                        </span>
                      </div>
                    </div>
                    
                    {/* Show owned cars */}
                    <div className="mt-3 pt-3 border-t border-status-success/20">
                      <h5 className="text-sm font-medium text-text-secondary mb-2">Your Cars & Drivers</h5>
                      <div className="space-y-2">
                        {cars.filter(c => c.seriesId === selectedChampionship.id).map((car, idx) => (
                          <div key={car.carId} className="flex items-center gap-3 bg-surface-secondary/50 rounded-lg p-3">
                            {/* Car Number */}
                            <div className="w-8 h-8 rounded-lg bg-surface-tertiary flex items-center justify-center text-sm font-bold text-text-primary">
                              #{idx + 1}
                            </div>
                            
                            {/* Driver & Car Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  car.driverType === 'owner' ? 'bg-accent-red' : 
                                  car.driverType === 'hired' ? 'bg-status-success' : 'bg-text-muted'
                                }`} />
                                <span className="font-medium text-text-primary truncate">
                                  {getDriverNameForCar(car)}
                                </span>
                                {car.driverType === 'owner' && (
                                  <Badge variant="default" className="bg-accent-red/20 text-accent-red text-xs">
                                    Owner
                                  </Badge>
                                )}
                                {car.driverType === 'unassigned' && (
                                  <Badge variant="outline" className="text-text-muted text-xs">
                                    No Driver
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Car className="w-3 h-3 text-text-muted" />
                                <span className="text-xs text-text-muted truncate">{car.liveryName}</span>
                              </div>
                            </div>
                            
                            {/* Car Stats */}
                            <div className="flex items-center gap-3 text-xs">
                              <div className="text-center">
                                <div className="text-status-info font-semibold">{car.reliability}%</div>
                                <div className="text-text-muted">Rel</div>
                              </div>
                              <div className="text-center">
                                <div className="text-accent-red font-semibold">{car.performance}</div>
                                <div className="text-text-muted">Perf</div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Add more cars prompt */}
                        {getCarCount(selectedChampionship.id) < getSeriesMaxTeamCars(selectedChampionship.id) && (
                          <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border-subtle rounded-lg text-text-muted">
                            <Plus className="w-4 h-4" />
                            <span className="text-sm">
                              You can add {getSeriesMaxTeamCars(selectedChampionship.id) - getCarCount(selectedChampionship.id)} more car(s) to this series
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Player standings position if available */}
                  {standings.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-text-secondary mb-2">Your Championship Position</h5>
                      {(() => {
                        const playerStanding = standings.find(s => s.isPlayer)
                        if (playerStanding) {
                          return (
                            <div className="bg-surface-secondary rounded-lg p-4">
                              <div className="grid grid-cols-4 gap-4 text-center">
                                <div>
                                  <div className="text-2xl font-bold text-accent-red">{playerStanding.position}</div>
                                  <div className="text-xs text-text-muted">Position</div>
                                </div>
                                <div>
                                  <div className="text-2xl font-bold text-text-primary">{playerStanding.points}</div>
                                  <div className="text-xs text-text-muted">Points</div>
                                </div>
                                <div>
                                  <div className="text-2xl font-bold text-status-success">{playerStanding.wins}</div>
                                  <div className="text-xs text-text-muted">Wins</div>
                                </div>
                                <div>
                                  <div className="text-2xl font-bold text-accent-orange">{playerStanding.podiums}</div>
                                  <div className="text-xs text-text-muted">Podiums</div>
                                </div>
                              </div>
                            </div>
                          )
                        }
                        return (
                          <div className="text-sm text-text-muted">No race results yet.</div>
                        )
                      })()}
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
            
            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border-subtle">
              <Button variant="ghost" className="flex-1" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
              
              {isSeriesEntered(selectedChampionship.id) ? (
                <>
                  {getCarCount(selectedChampionship.id) < getSeriesMaxTeamCars(selectedChampionship.id) && (
                    <Button 
                      variant="primary" 
                      className="flex-1" 
                      onClick={() => {
                        setShowDetailsModal(false)
                        setShowCarModal(true)
                      }}
                    >
                      <Car className="w-4 h-4 mr-2" />
                      Buy Another Car
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="text-status-error border-status-error hover:bg-status-error/10"
                    onClick={handleWithdraw}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Withdraw
                  </Button>
                </>
              ) : (
                <Button 
                  variant="primary" 
                  className="flex-1" 
                  onClick={() => {
                    setShowDetailsModal(false)
                    setShowEntryModal(true)
                  }}
                  disabled={budget < (ENTRY_FEES[selectedChampionship.tier] || 50000)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Enter Series ({formatCurrency(ENTRY_FEES[selectedChampionship.tier] || 50000)})
                </Button>
              )}
            </div>
          </div>
        )})()}
      </Modal>
    </div>
  )
}
