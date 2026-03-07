import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Users,
  Building2,
  Star,
  Clock,
  DollarSign,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  AlertCircle,
  Search,
  Filter,
  Zap,
  Wallet,
  MapPin,
  Flag,
  Factory,
  Car,
  Layers,
  Palette,
  Target,
  CircleDot,
  RefreshCw,
  UserX,
  AlertTriangle,
  Newspaper,
} from 'lucide-react'
import { getTeamLogo } from '@/utils/generated-assets'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import type { ContractTarget, ContractSeasonStats, Contract, ContractType, CurrentAssignment } from '@/store/careerStore'
import type { ContractOffer, Team, Series } from '@/store/rivalStore'
import {
  generateContractTargets,
  generateTerminationConditions,
  generateRenewalConditions,
  generateMediaDuties,
  generateTeamOption,
  generatePlayerOption,
  DEFAULT_TEAM_SATISFACTION,
} from '@/simulation/contracts'
import { ConflictModal } from '@/components/ConflictModal'
import { HERO_IMAGES } from '@/data/stock-images'
import { routeNotification } from '@/services/notificationRouter'

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }
const CARD = 'bg-white border-[0.8px] border-black/20 rounded-[24px] overflow-hidden'
const INNER = 'bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[16px] p-[16px]'

type SortOption = 'prestige' | 'salary_high' | 'salary_low' | 'seat_cost_low' | 'seat_cost_high' | 'duration'

export default function ContractsScreen() {
  const careerState = useCareerStore() as any
  const {
    contract,
    player,
    currentWeek,
    currentYear,
    pendingContractOffers = [],
    actualSeasonStats = {} as any,
    setContract,
    addToast,
    addTransaction,
    canAffordSeat,
    detectCalendarConflicts,
    resolveConflict,
    updateCareerState,
    consumeHoursFromBudget,
    addPersonalCalendarEntry,
    getActivityTimeCost,
    getContractStatus,
    getYearsRemaining,
    calculateReleaseClause,
    getProgram,
    getManufacturer,
  } = careerState
  const {
    getTeamById,
    getSeriesById,
    getAllSeries,
    teams,
    series,
    acceptContract,
    declineContract,
    generateContractOffers,
  } = useRivalStore() as any
  const [activeTab, setActiveTab] = useState('overview')
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [seatFilter, setSeatFilter] = useState<'all' | 'paid' | 'pay_driver'>('all')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [affordabilityFilter, setAffordabilityFilter] = useState<'all' | 'affordable'>('all')
  const [sortOption, setSortOption] = useState<SortOption>('prestige')
  const [selectedSeriesIds, setSelectedSeriesIds] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [detectedConflicts, setDetectedConflicts] = useState<any[]>([])
  const [currentConflictIndex, setCurrentConflictIndex] = useState(0)
  const effectiveReputation = careerState?.ownedTeam?.reputation ?? player?.reputation ?? 50

  const _getActualTargetProgress = (target: ContractTarget): number => {
    switch (target.type) {
      case 'points_minimum':
        return actualSeasonStats.points
      case 'podiums':
        return actualSeasonStats.podiums
      case 'wins':
        return actualSeasonStats.wins
      default:
        return target.currentProgress || 0
    }
  }

  const enrichedOffers = useMemo(() => {
    return pendingContractOffers
      .map(offer => {
        const team = getTeamById(offer.teamId)
        const seriesData = getSeriesById(offer.seriesId)
        return { offer, team, series: seriesData }
      })
      .filter((e): e is { offer: ContractOffer; team: Team; series: Series } => 
        e.team !== undefined && e.series !== undefined
      )
  }, [pendingContractOffers, getTeamById, getSeriesById])

  const filteredAndSortedOffers = useMemo(() => {
    let filtered = [...enrichedOffers]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(({ team, series: s }) => 
        team.name.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query) ||
        team.country.toLowerCase().includes(query)
      )
    }

    if (seatFilter !== 'all') {
      filtered = filtered.filter(({ offer }) => {
        if (seatFilter === 'paid') return offer.salary > 0
        if (seatFilter === 'pay_driver') return offer.seatCost > 0
        return true
      })
    }

    if (tierFilter !== 'all') {
      filtered = filtered.filter(({ series: s }) => s.tier === tierFilter)
    }

    if (affordabilityFilter === 'affordable') {
      filtered = filtered.filter(({ offer }) => 
        offer.seatCost === 0 || canAffordSeat(offer.seatCost)
      )
    }

    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'prestige':
          return (b.team?.prestige ?? 0) - (a.team?.prestige ?? 0)
        case 'salary_high':
          return b.offer.salary - a.offer.salary
        case 'salary_low':
          return a.offer.salary - b.offer.salary
        case 'seat_cost_low':
          if (a.offer.seatCost === 0 && b.offer.seatCost > 0) return -1
          if (a.offer.seatCost > 0 && b.offer.seatCost === 0) return 1
          return a.offer.seatCost - b.offer.seatCost
        case 'seat_cost_high':
          return b.offer.seatCost - a.offer.seatCost
        case 'duration':
          return b.offer.duration - a.offer.duration
        default:
          return 0
      }
    })

    return filtered
  }, [enrichedOffers, searchQuery, seatFilter, tierFilter, affordabilityFilter, sortOption, canAffordSeat])

  const stats = useMemo(() => {
    const paidSeats = enrichedOffers.filter(e => e.offer.salary > 0).length
    const payDriverSeats = enrichedOffers.filter(e => e.offer.seatCost > 0).length
    const affordableSeats = enrichedOffers.filter(e => 
      e.offer.seatCost === 0 || canAffordSeat(e.offer.seatCost)
    ).length
    
    return { paidSeats, payDriverSeats, affordableSeats, total: enrichedOffers.length }
  }, [enrichedOffers, canAffordSeat])

  if (!player) return null

  const handleViewOffer = (offer: ContractOffer) => {
    setSelectedOffer(offer)
    setSelectedSeriesIds(offer.availableSeriesIds || [offer.seriesId])
    setShowOfferModal(true)
  }
  
  const _handleToggleSeries = (seriesId: string) => {
    setSelectedSeriesIds(prev => {
      if (prev.includes(seriesId)) {
        if (prev.length === 1) return prev
        return prev.filter(id => id !== seriesId)
      } else {
        return [...prev, seriesId]
      }
    })
  }

  const handleAcceptOffer = () => {
    console.log('[Contract] Accept clicked')
    
    if (!selectedOffer) {
      console.log('[Contract] No selected offer')
      return
    }
    
    if (!player) {
      console.log('[Contract] No player')
      return
    }
    
    console.log('[Contract] Processing offer:', selectedOffer.teamName)

    const seatCost = selectedOffer.seatCost || 0
    if (seatCost > 0) {
      if (!canAffordSeat(seatCost)) {
        addToast({
          type: 'error',
          title: 'Insufficient Funds',
          message: `You need $${seatCost.toLocaleString()} for this seat.`,
          duration: 4000
        })
        return
      }
      addTransaction({
        type: 'expense',
        category: 'seat_fee',
        amount: seatCost,
        description: `Seat fee for ${selectedOffer.teamName} in ${selectedOffer.seriesName}`,
        date: new Date().toISOString(),
        week: 1,
        year: new Date().getFullYear()
      })
      console.log('[Contract] Deducted seat cost:', seatCost)
    }

    const finalSelectedSeries = selectedSeriesIds.length > 0 ? selectedSeriesIds : [selectedOffer.seriesId]
    const primarySeriesId = finalSelectedSeries[0]
    
    let contractType: ContractType = selectedOffer.contractType || 'customer'
    if (selectedOffer.contractType === 'works-full' && finalSelectedSeries.length < (selectedOffer.availableSeriesIds?.length || 1)) {
      contractType = 'works-partial'
    }
    
    let currentAssignment: CurrentAssignment | undefined
    
    if (selectedOffer.offerType === 'works-program' && selectedOffer.likelyAssignment) {
      currentAssignment = {
        entryId: selectedOffer.likelyAssignment.entryId,
        entryName: selectedOffer.likelyAssignment.entryName,
        carName: selectedOffer.likelyAssignment.carName,
        carClassId: selectedOffer.likelyAssignment.carClassId,
        seriesId: selectedOffer.likelyAssignment.seriesId,
        seriesName: selectedOffer.likelyAssignment.seriesName
      }
    } else if (selectedOffer.fixedAssignment) {
      currentAssignment = {
        entryId: selectedOffer.fixedAssignment.entryId,
        entryName: selectedOffer.fixedAssignment.entryName,
        carName: selectedOffer.fixedAssignment.carName,
        carClassId: selectedOffer.fixedAssignment.carClassId,
        seriesId: selectedOffer.fixedAssignment.seriesId,
        seriesName: selectedOffer.fixedAssignment.seriesName
      }
    }
    
    const offeringTeam = getTeamById(selectedOffer.teamId)
    const teamTier = selectedOffer.teamTier || offeringTeam?.tier || 'semi-pro'
    const primarySeries = getSeriesById(primarySeriesId)
    const totalRaces = selectedOffer.totalRaces || primarySeries?.calendar?.length || 12
    const gridSize = selectedOffer.gridSize || 24
    const playerReputation = player?.reputation || 50
    
    const isForNextSeason = selectedOffer.effectiveDate === 'next_season'
    const contractStartYear = isForNextSeason 
      ? (careerState?.currentYear || new Date().getFullYear()) + 1 
      : (careerState?.currentYear || new Date().getFullYear())
    
    const isWorksDriver = false
    const targets = selectedOffer.hasPerformanceTargets !== false 
      ? generateContractTargets(teamTier, totalRaces, gridSize, isWorksDriver, primarySeries?.championshipId) 
      : undefined
    
    const mediaDuties = selectedOffer.hasMediaDuties 
      ? generateMediaDuties(teamTier) 
      : undefined
    
    const teamOption = selectedOffer.hasTeamOption 
      ? generateTeamOption(teamTier, playerReputation) 
      : undefined
    
    const playerOption = selectedOffer.hasPlayerOption 
      ? generatePlayerOption(teamTier, playerReputation) 
      : undefined
    
    const terminationConditions = selectedOffer.hasPerformanceClause !== false 
      ? generateTerminationConditions(teamTier) 
      : undefined
    
    const renewalConditions = selectedOffer.hasAutoRenewal 
      ? generateRenewalConditions(teamTier, selectedOffer.duration) 
      : undefined

    const contract: Contract = {
      teamId: selectedOffer.teamId,
      teamName: selectedOffer.offerType === 'works-program' ? (selectedOffer.programName || selectedOffer.teamName) : selectedOffer.teamName,
      seriesId: primarySeriesId,
      seriesName: selectedOffer.seriesName,
      salary: selectedOffer.salary,
      bonusPerWin: selectedOffer.bonusPerWin,
      bonusPerPodium: selectedOffer.bonusPerPodium,
      startYear: contractStartYear,
      endYear: contractStartYear + selectedOffer.duration,
      programId: selectedOffer.programId,
      manufacturerId: selectedOffer.manufacturerId,
      contractType,
      seriesIds: finalSelectedSeries,
      primarySeriesId,
      offerType: selectedOffer.offerType,
      currentAssignment,
      canBeReassigned: selectedOffer.offerType === 'works-program',
      targets,
      mediaDuties,
      teamOption,
      playerOption,
      terminationConditions,
      renewalConditions,
      teamSatisfaction: DEFAULT_TEAM_SATISFACTION,
      satisfactionHistory: [],
      seasonStats: {
        dnfCount: 0,
        wins: 0,
        podiums: 0,
        points: 0,
        racesCompleted: 0,
        teammateBattleWins: 0,
        teammateBattleLosses: 0,
        warningsIssued: 0,
        seasonYear: contractStartYear
      }
    }

    console.log('[Contract] Creating contract with enhanced details:', contract)
    
    setShowOfferModal(false)
    
    setContract(contract, isForNextSeason)
    acceptContract(selectedOffer)
    
    if (finalSelectedSeries.length > 1) {
      console.log('[Contract] Detecting calendar conflicts for multi-series contract')
      
      const calendars: Record<string, Array<{ week: number; trackId: string; trackName: string; country: string; round: number }>> = {}
      
      finalSelectedSeries.forEach(seriesId => {
        const seriesData = getSeriesById(seriesId)
        if (seriesData?.calendar) {
          calendars[seriesId] = seriesData.calendar.map((race, idx) => ({
            week: race.week,
            trackId: race.trackId,
            trackName: race.trackName,
            country: race.country,
            round: idx + 1
          }))
        }
      })
      
      const conflicts = detectCalendarConflicts(finalSelectedSeries, calendars)
      
      if (conflicts.length > 0) {
        console.log(`[Contract] Found ${conflicts.length} calendar conflicts`)
        
        const enrichedConflicts = conflicts.map(conflict => ({
          ...conflict,
          races: conflict.races.map(race => {
            const seriesData = getSeriesById(race.seriesId)
            return {
              ...race,
              seriesName: seriesData?.name || race.seriesId,
              prizeMoney: seriesData?.prizeMoney || { win: 0, podium: 0 }
            }
          })
        }))
        
        setDetectedConflicts(enrichedConflicts)
        setCurrentConflictIndex(0)
        
        if (careerState) {
          updateCareerState({
            pendingConflicts: enrichedConflicts
          })
        }
        
        setTimeout(() => {
          setShowConflictModal(true)
        }, 500)
        
        addToast({
          type: 'warning',
          title: 'Calendar Conflicts Detected',
          message: `You have ${conflicts.length} race weekend conflicts to resolve.`,
          duration: 5000
        })
      }
    }
    
    setSelectedOffer(null)
    
    console.log('[Contract] Contract accepted successfully!')
    
    const contractTimeCost = getActivityTimeCost('contract_negotiation')
    if (contractTimeCost.hours > 0) {
      consumeHoursFromBudget(contractTimeCost.hours, contractTimeCost.drain, `Contract: ${selectedOffer.teamName}`, 'contract_negotiation')
    }
    addPersonalCalendarEntry({
      name: `Contract Signed: ${selectedOffer.teamName}`,
      description: `Signed ${selectedOffer.duration}-year deal with ${selectedOffer.teamName}`,
      activityId: 'contract_negotiation',
      week: careerState?.currentWeek ?? 1,
      day: careerState?.currentDay ?? 1,
      duration: contractTimeCost.hours,
      drainLevel: contractTimeCost.drain,
      calendarEntryType: 'personal',
      category: 'team',
      immediate: true
    })
    routeNotification({
      category: 'staff_hr',
      subject: `Contract Signed: ${selectedOffer.teamName}`,
      body: `Congratulations! Your ${selectedOffer.duration}-year contract with ${selectedOffer.teamName} has been finalized. Welcome aboard!`,
    })
    
    addToast({
      type: 'success',
      title: isForNextSeason ? 'Contract Signed for Next Season!' : 'Contract Signed!',
      message: isForNextSeason 
        ? `You will join ${selectedOffer.teamName} next season. Your ${selectedOffer.duration}-year deal begins in ${contractStartYear}.`
        : `Welcome to ${selectedOffer.teamName}! Your ${selectedOffer.duration}-year deal begins now.`,
      duration: 5000
    })
    
    setTimeout(() => {
      addToast({
        type: 'save',
        title: 'Auto-Saved',
        message: 'Your progress has been saved.',
        duration: 2000
      })
    }, 500)
  }

  const handleDeclineOffer = () => {
    console.log('[Contract] Decline clicked')
    
    if (!selectedOffer) {
      console.log('[Contract] No selected offer to decline')
      return
    }
    
    const teamName = selectedOffer.teamName
    console.log('[Contract] Declining offer from:', teamName)
    
    setShowOfferModal(false)
    
    declineContract(selectedOffer)
    
    setSelectedOffer(null)
    
    console.log('[Contract] Offer declined successfully!')
    
    addToast({
      type: 'info',
      title: 'Offer Declined',
      message: `You declined the offer from ${teamName}.`,
      duration: 3000
    })
  }

  const handleRefreshOffers = () => {
    if (player) {
      generateContractOffers(player.id, effectiveReputation)
    }
  }

  const handleResolveConflict = (chosenSeriesId: string) => {
    const currentConflict = detectedConflicts[currentConflictIndex]
    if (!currentConflict) return
    
    resolveConflict(currentConflict.id, chosenSeriesId)
    
    if (currentConflictIndex < detectedConflicts.length - 1) {
      setCurrentConflictIndex(currentConflictIndex + 1)
    } else {
      setShowConflictModal(false)
      setDetectedConflicts([])
      setCurrentConflictIndex(0)
      
      addToast({
        type: 'success',
        title: 'Conflicts Resolved',
        message: 'All race weekend conflicts have been resolved. You can view missed races in your season calendar.',
        duration: 5000
      })
      
      setTimeout(() => {
        addToast({
          type: 'save',
          title: 'Auto-Saved',
          message: 'Calendar choices saved.',
          duration: 2000
        })
      }, 500)
    }
  }

  const seriesNames: Record<string, string> = {}
  const seriesColors: Record<string, string> = {}
  series.forEach(s => {
    seriesNames[s.id] = s.name
    seriesColors[s.id] = teams.find(t => t.seriesId === s.id)?.color || '#666666'
  })

  const selectedTeam = selectedOffer ? getTeamById(selectedOffer.teamId) : null
  const selectedSeries = selectedOffer ? getSeriesById(selectedOffer.seriesId) : null
  const _selectedProgram = selectedOffer?.programId ? getProgram(selectedOffer.programId) : null
  const selectedManufacturer = selectedOffer?.manufacturerId ? getManufacturer(selectedOffer.manufacturerId) : null
  const _availableSeries = selectedOffer?.availableSeriesIds?.map(id => getSeriesById(id)).filter(Boolean) as Series[] || []

  return (
    <div className="bg-white w-full h-full overflow-y-auto">
      <div className="p-[24px] flex flex-col gap-[24px]">
        {/* Header */}
        <div className="flex items-center gap-[12px]">
          <FileText className="w-[28px] h-[28px] text-[#0a0a0a]" />
          <div>
            <h1 className="text-[30px] text-[#0a0a0a] tracking-[-1.5px] leading-tight" style={FB}>Contracts</h1>
            <p className="text-[14px] text-[#4a5565]" style={FR}>Manage your racing contracts and find new opportunities</p>
          </div>
        </div>

        {/* Current Contract */}
        <div className={`${CARD} relative`}>
          {player.contract && (
            <div className="absolute inset-0 h-[192px]">
              <img 
                src={HERO_IMAGES.contracts}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover opacity-20"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/80" />
            </div>
          )}
          
          <div className="relative p-[24px]">
            <h3 className="text-[18px] text-[#0a0a0a] tracking-[-0.5px] mb-[16px]" style={FB}>Current Contract</h3>
            {player.contract ? (
              <div className="flex flex-col gap-[16px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[16px]">
                    <div className="w-[64px] h-[64px] rounded-[16px] bg-[#dcfce7] border-[0.8px] border-[#00a63e]/30 flex items-center justify-center">
                      <Building2 className="w-[32px] h-[32px] text-[#00a63e]" />
                    </div>
                    <div>
                      <h3 className="text-[20px] text-[#0a0a0a]" style={FB}>{player.contract.teamName}</h3>
                      <p className="text-[14px] text-[#4a5565]" style={FR}>{player.contract.seriesName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-[8px]">
                    {(() => {
                      const status = getContractStatus()
                      const yearsLeft = getYearsRemaining()
                      if (status === 'locked') {
                        return (
                          <span className="flex items-center gap-[4px] px-[10px] py-[4px] bg-[#dbeafe] text-[#3b82f6] rounded-[10px] text-[12px]" style={FBold}>
                            <Clock className="w-[12px] h-[12px]" />
                            Locked ({yearsLeft}yr)
                          </span>
                        )
                      } else if (status === 'final_year') {
                        return (
                          <span className="flex items-center gap-[4px] px-[10px] py-[4px] bg-[#fef3c7] text-[#b45309] rounded-[10px] text-[12px]" style={FBold}>
                            <AlertCircle className="w-[12px] h-[12px]" />
                            Final Year
                          </span>
                        )
                      }
                      return null
                    })()}
                    <span className="flex items-center gap-[4px] px-[10px] py-[4px] bg-[#dcfce7] text-[#00a63e] rounded-[10px] text-[12px]" style={FBold}>
                      <Check className="w-[12px] h-[12px]" />
                      Active
                    </span>
                  </div>
                </div>
            
                <div className="grid grid-cols-5 gap-[16px] p-[16px] bg-[#f9fafb] rounded-[16px]">
                  <div className="text-center">
                    <p className="text-[12px] text-[#4a5565] mb-[4px]" style={FR}>Salary/Race</p>
                    <p className="font-mono text-[#00a63e]" style={FBold}>
                      ${player.contract.salary.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[12px] text-[#4a5565] mb-[4px]" style={FR}>Win Bonus</p>
                    <p className="font-mono text-[#f59e0b]" style={FBold}>
                      ${player.contract.bonusPerWin.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[12px] text-[#4a5565] mb-[4px]" style={FR}>Podium Bonus</p>
                    <p className="font-mono text-[#3b82f6]" style={FBold}>
                      ${player.contract.bonusPerPodium.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[12px] text-[#4a5565] mb-[4px]" style={FR}>Expires</p>
                    <p className="font-mono text-[#0a0a0a]" style={FBold}>
                      End of {player.contract.endYear}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[12px] text-[#4a5565] mb-[4px]" style={FR}>Release Clause</p>
                    <p className="font-mono text-[#ef4444]" style={FBold}>
                      ${calculateReleaseClause().toLocaleString()}
                    </p>
                  </div>
                </div>
            
                {(() => {
                  const status = getContractStatus()
                  if (status === 'locked') {
                    return (
                      <div className="p-[12px] bg-[#dbeafe] border-[0.8px] border-[#3b82f6]/30 rounded-[12px]">
                        <p className="text-[13px] text-[#3b82f6]" style={FR}>
                          <strong style={FBold}>Contract Locked:</strong> Other teams must pay your release clause (${calculateReleaseClause().toLocaleString()}) to sign you.
                        </p>
                      </div>
                    )
                  } else if (status === 'final_year') {
                    return (
                      <div className="p-[12px] bg-[#fef3c7] border-[0.8px] border-[#f59e0b]/30 rounded-[12px]">
                        <p className="text-[13px] text-[#b45309]" style={FR}>
                          <strong style={FBold}>Final Year:</strong> You can negotiate with other teams for next season. Your contract expires at the end of this year.
                        </p>
                      </div>
                    )
                  }
                  return null
                })()}

                <p className="text-[12px] text-[#4a5565] text-center pt-[8px]" style={FR}>
                  View full contract details, targets & stats in the Garage → Contract tab
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-[16px] p-[16px] bg-[#fef3c7] border-[0.8px] border-[#f59e0b]/30 rounded-[16px]">
                <AlertCircle className="w-[32px] h-[32px] text-[#f59e0b]" />
                <div>
                  <h3 className="text-[15px] text-[#b45309]" style={FBold}>No Active Contract</h3>
                  <p className="text-[13px] text-[#4a5565]" style={FR}>
                    You need to sign with a team to participate in championships. Check the offers below!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Player Status */}
        <div className={`${CARD} p-[16px]`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[24px]">
              <div className="text-center">
                <p className="text-[12px] text-[#4a5565] mb-[4px]" style={FR}>Team Reputation</p>
                <div className="flex items-center gap-[8px]">
                  <Star className="w-[16px] h-[16px] text-[#f59e0b]" />
                  <span className="text-[20px] text-[#0a0a0a]" style={FB}>{(Math.round(effectiveReputation * 10) / 10).toFixed(1)}</span>
                  <span className="text-[#4a5565] text-[13px]" style={FR}>/100</span>
                </div>
              </div>
              <div className="w-[1px] h-[32px] bg-black/10" />
              <div className="text-center">
                <p className="text-[12px] text-[#4a5565] mb-[4px]" style={FR}>Available Funds</p>
                <p className="font-mono text-[18px] text-[#00a63e]" style={FBold}>
                  ${(player.finances?.bankBalance ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="w-[1px] h-[32px] bg-black/10" />
              <div className="flex items-center gap-[16px] text-[13px]" style={FR}>
                <div className="px-[12px] py-[4px] rounded-[10px] bg-[#dcfce7] text-[#00a63e]">
                  {stats.paidSeats} paid seats
                </div>
                <div className="px-[12px] py-[4px] rounded-[10px] bg-[#fef3c7] text-[#b45309]">
                  {stats.payDriverSeats} pay-driver
                </div>
                <div className="px-[12px] py-[4px] rounded-[10px] bg-[#dbeafe] text-[#3b82f6]">
                  {stats.affordableSeats} affordable
                </div>
              </div>
            </div>
            <button
              onClick={handleRefreshOffers}
              className="flex items-center gap-[8px] px-[14px] py-[10px] border-[0.8px] border-black/20 rounded-[12px] text-[13px] text-[#0a0a0a] hover:bg-[#f9fafb] transition-colors"
              style={FBold}
            >
              <Zap className="w-[16px] h-[16px]" />
              Refresh Offers
            </button>
          </div>
        </div>

        {/* Mid-Season Buyout Offers */}
        {(() => {
          const buyoutOffers = enrichedOffers.filter(e => e.offer.isBuyoutOffer)
          if (buyoutOffers.length === 0 || !player.contract) return null
          
          return (
            <div className={`${CARD} p-[24px] border-[2px] border-[#ef4444]/30`}>
              <div className="mb-[16px]">
                <h3 className="text-[18px] text-[#0a0a0a] tracking-[-0.5px]" style={FB}>Mid-Season Buyout Offers</h3>
                <p className="text-[13px] text-[#4a5565]" style={FR}>{buyoutOffers.length} team{buyoutOffers.length > 1 ? 's' : ''} willing to pay your release clause</p>
              </div>
              
              <div className="mb-[16px] p-[12px] bg-[#fee2e2] border-[0.8px] border-[#ef4444]/30 rounded-[12px]">
                <div className="flex items-center gap-[12px]">
                  <Wallet className="w-[20px] h-[20px] text-[#ef4444]" />
                  <div>
                    <p className="text-[14px] text-[#ef4444]" style={FBold}>
                      Your release clause: ${calculateReleaseClause().toLocaleString()}
                    </p>
                    <p className="text-[12px] text-[#4a5565]" style={FR}>
                      These teams are willing to pay this amount to sign you immediately
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-[16px]">
                {buyoutOffers.map(({ offer, team, series: seriesData }) => (
                  <motion.div
                    key={`buyout-${offer.teamId}_${offer.seriesId}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`${INNER} cursor-pointer hover:border-[#ef4444]/40 transition-all`}
                    onClick={() => handleViewOffer(offer)}
                  >
                    <div className="flex items-start justify-between mb-[12px]">
                      <div className="flex items-center gap-[12px]">
                        <img src={getTeamLogo(team.id)} alt={team.name} className="w-[40px] h-[40px] rounded-[10px] object-contain bg-white" />
                        <div>
                          <h4 className="text-[14px] text-[#0a0a0a]" style={FBold}>{team.name}</h4>
                          <p className="text-[12px] text-[#4a5565]" style={FR}>{seriesData.name}</p>
                        </div>
                      </div>
                      <span className={`px-[8px] py-[2px] rounded-[8px] text-[11px] ${
                        seriesData.tier === 'elite' || seriesData.tier === 'pinnacle' ? 'bg-[#fef3c7] text-[#b45309]' : 'bg-[#dbeafe] text-[#3b82f6]'
                      }`} style={FBold}>{seriesData.tier}</span>
                    </div>
                    
                    <div className="flex flex-col gap-[8px] text-[13px]" style={FR}>
                      <div className="flex justify-between">
                        <span className="text-[#4a5565]">Buyout Amount:</span>
                        <span className="text-[#ef4444]" style={FBold}>${offer.buyoutCost?.toLocaleString()}</span>
                      </div>
                      {offer.signingBonus && (
                        <div className="flex justify-between">
                          <span className="text-[#4a5565]">Your Signing Bonus:</span>
                          <span className="text-[#00a63e]" style={FBold}>+${offer.signingBonus.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-[#4a5565]">Salary:</span>
                        <span className="font-mono">${offer.salary.toLocaleString()}/race</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#4a5565]">Duration:</span>
                        <span>{offer.duration} year{offer.duration > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    
                    <button 
                      className="w-full mt-[12px] px-[14px] py-[10px] bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-[12px] text-[13px] transition-colors"
                      style={FBold}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewOffer(offer)
                      }}
                    >
                      View Offer Details
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Filters & Sort */}
        <div className={`${CARD} p-[16px]`}>
          <div className="flex flex-col gap-[16px]">
            <div className="flex items-center gap-[16px]">
              <div className="relative flex-1 max-w-[400px]">
                <Search className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#4a5565]" />
                <input
                  type="text"
                  placeholder="Search teams, series, or country..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-[40px] pr-[16px] py-[10px] bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[12px] text-[14px] text-[#0a0a0a] focus:outline-none focus:border-black/30 transition-colors"
                  style={FR}
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-[8px] px-[14px] py-[10px] rounded-[12px] text-[13px] border-[0.8px] border-black/20 transition-colors ${
                  showFilters ? 'bg-[#f9fafb]' : 'hover:bg-[#f9fafb]'
                }`}
                style={FBold}
              >
                <Filter className="w-[16px] h-[16px]" />
                Filters
                <ChevronDown className={`w-[16px] h-[16px] transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-4 gap-[16px] pt-[16px] border-t border-black/10"
              >
                <div>
                  <label className="text-[12px] text-[#4a5565] mb-[8px] block" style={FBold}>Seat Type</label>
                  <div className="flex gap-[4px]">
                    <FilterButton active={seatFilter === 'all'} onClick={() => setSeatFilter('all')}>All</FilterButton>
                    <FilterButton active={seatFilter === 'paid'} onClick={() => setSeatFilter('paid')}>
                      <DollarSign className="w-[12px] h-[12px] mr-[4px]" />Paid
                    </FilterButton>
                    <FilterButton active={seatFilter === 'pay_driver'} onClick={() => setSeatFilter('pay_driver')}>
                      <Wallet className="w-[12px] h-[12px] mr-[4px]" />Pay-Driver
                    </FilterButton>
                  </div>
                </div>

                <div>
                  <label className="text-[12px] text-[#4a5565] mb-[8px] block" style={FBold}>Tier</label>
                  <div className="flex gap-[4px] flex-wrap">
                    {['all', 'elite', 'pro', 'professional', 'semi-pro', 'amateur', 'entry'].map(t => (
                      <FilterButton key={t} active={tierFilter === t} onClick={() => setTierFilter(t)}>
                        {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                      </FilterButton>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[12px] text-[#4a5565] mb-[8px] block" style={FBold}>Budget</label>
                  <div className="flex gap-[4px]">
                    <FilterButton active={affordabilityFilter === 'all'} onClick={() => setAffordabilityFilter('all')}>Show All</FilterButton>
                    <FilterButton active={affordabilityFilter === 'affordable'} onClick={() => setAffordabilityFilter('affordable')}>
                      <Check className="w-[12px] h-[12px] mr-[4px]" />Affordable
                    </FilterButton>
                  </div>
                </div>

                <div>
                  <label className="text-[12px] text-[#4a5565] mb-[8px] block" style={FBold}>Sort By</label>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="w-full px-[12px] py-[8px] bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[10px] text-[13px] text-[#0a0a0a] focus:outline-none focus:border-black/30 transition-colors"
                    style={FR}
                  >
                    <option value="prestige">Team Prestige (High → Low)</option>
                    <option value="salary_high">Salary (High → Low)</option>
                    <option value="salary_low">Salary (Low → High)</option>
                    <option value="seat_cost_low">Seat Cost (Low → High)</option>
                    <option value="seat_cost_high">Seat Cost (High → Low)</option>
                    <option value="duration">Contract Length</option>
                  </select>
                </div>
              </motion.div>
            )}

            {(seatFilter !== 'all' || tierFilter !== 'all' || affordabilityFilter !== 'all' || searchQuery) && (
              <div className="flex items-center gap-[8px] pt-[8px]">
                <span className="text-[12px] text-[#4a5565]" style={FR}>Active filters:</span>
                {searchQuery && (
                  <span className="flex items-center gap-[4px] px-[8px] py-[3px] bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[8px] text-[12px]" style={FR}>
                    Search: "{searchQuery}"
                    <X className="w-[12px] h-[12px] cursor-pointer hover:text-[#ef4444]" onClick={() => setSearchQuery('')} />
                  </span>
                )}
                {seatFilter !== 'all' && (
                  <span className={`flex items-center gap-[4px] px-[8px] py-[3px] rounded-[8px] text-[12px] ${
                    seatFilter === 'paid' ? 'bg-[#dcfce7] text-[#00a63e]' : 'bg-[#fef3c7] text-[#b45309]'
                  }`} style={FR}>
                    {seatFilter === 'paid' ? 'Paid Seats' : 'Pay-Driver'}
                    <X className="w-[12px] h-[12px] cursor-pointer" onClick={() => setSeatFilter('all')} />
                  </span>
                )}
                {tierFilter !== 'all' && (
                  <span className={`flex items-center gap-[4px] px-[8px] py-[3px] rounded-[8px] text-[12px] ${
                    tierFilter === 'elite' || tierFilter === 'pinnacle' ? 'bg-[#fef3c7] text-[#b45309]' : 
                    tierFilter === 'professional' || tierFilter === 'pro' ? 'bg-[#dbeafe] text-[#3b82f6]' : 'bg-[#f9fafb] text-[#0a0a0a]'
                  }`} style={FR}>
                    {tierFilter.charAt(0).toUpperCase() + tierFilter.slice(1)}
                    <X className="w-[12px] h-[12px] cursor-pointer" onClick={() => setTierFilter('all')} />
                  </span>
                )}
                {affordabilityFilter !== 'all' && (
                  <span className="flex items-center gap-[4px] px-[8px] py-[3px] bg-[#dcfce7] text-[#00a63e] rounded-[8px] text-[12px]" style={FR}>
                    Affordable Only
                    <X className="w-[12px] h-[12px] cursor-pointer" onClick={() => setAffordabilityFilter('all')} />
                  </span>
                )}
                <button 
                  onClick={() => { setSearchQuery(''); setSeatFilter('all'); setTierFilter('all'); setAffordabilityFilter('all'); }}
                  className="text-[12px] text-[#ef4444] hover:underline ml-[8px]"
                  style={FR}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Available Offers */}
        <div className={`${CARD} p-[24px]`}>
          <div className="mb-[16px]">
            <h3 className="text-[18px] text-[#0a0a0a] tracking-[-0.5px]" style={FB}>Available Opportunities</h3>
            <p className="text-[13px] text-[#4a5565]" style={FR}>Showing {filteredAndSortedOffers.length} of {enrichedOffers.length} offers</p>
          </div>

          {filteredAndSortedOffers.length > 0 ? (
            <div className="grid grid-cols-2 gap-[16px] max-h-[600px] overflow-y-auto pr-[8px]">
              {filteredAndSortedOffers.map(({ offer, team, series: seriesData }, index) => (
                <motion.div
                  key={`${offer.teamId}_${offer.seriesId}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleViewOffer(offer)}
                  className={`${CARD} cursor-pointer hover:shadow-lg transition-shadow`}
                >
                  <div 
                    className="p-[16px] border-b border-black/10"
                    style={{ 
                      background: `linear-gradient(135deg, ${team.color}15 0%, transparent 100%)` 
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-[12px]">
                        <img src={getTeamLogo(team.id)} alt={team.name} className="w-[48px] h-[48px] rounded-[12px] object-contain bg-white" />
                        <div>
                          <h3 className="text-[15px] text-[#0a0a0a]" style={FBold}>{team.name}</h3>
                          <p className="text-[13px] text-[#4a5565]" style={FR}>{seriesData.name}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-[4px]">
                        <span className={`px-[8px] py-[2px] rounded-[8px] text-[11px] ${
                          seriesData.tier === 'elite' || seriesData.tier === 'pinnacle' ? 'bg-[#fef3c7] text-[#b45309]' : 
                          seriesData.tier === 'professional' || seriesData.tier === 'pro' ? 'bg-[#dbeafe] text-[#3b82f6]' : 'bg-[#f9fafb] text-[#4a5565]'
                        }`} style={FBold}>{seriesData.tier.charAt(0).toUpperCase() + seriesData.tier.slice(1)}</span>
                        {offer.isBuyoutOffer && (
                          <span className="px-[8px] py-[2px] bg-[#fee2e2] text-[#ef4444] rounded-[8px] text-[11px]" style={FBold}>Buyout Offer</span>
                        )}
                        {offer.effectiveDate === 'next_season' && (
                          <span className="px-[8px] py-[2px] bg-[#fef3c7] text-[#b45309] rounded-[8px] text-[11px]" style={FBold}>Next Season</span>
                        )}
                        {offer.seatCost > 0 && (
                          <span className="px-[8px] py-[2px] bg-[#fef3c7] text-[#b45309] rounded-[8px] text-[11px]" style={FBold}>Pay-Driver</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {offer.isBuyoutOffer && offer.buyoutCost && (
                    <div className="px-[16px] py-[8px] bg-[#fee2e2] border-y border-[#ef4444]/30">
                      <div className="flex items-center justify-between text-[13px]" style={FR}>
                        <span className="text-[#ef4444]" style={FBold}>
                          Team pays ${offer.buyoutCost.toLocaleString()} buyout
                        </span>
                        {offer.signingBonus && (
                          <span className="text-[#00a63e]" style={FBold}>
                            +${offer.signingBonus.toLocaleString()} signing bonus
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-[16px] flex flex-col gap-[12px]">
                    <div className="grid grid-cols-2 gap-[12px] text-[13px]" style={FR}>
                      <div className="flex items-center gap-[8px] text-[#0a0a0a]">
                        <Clock className="w-[16px] h-[16px] text-[#4a5565]" />
                        <span>{offer.duration} year{offer.duration > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-[8px] text-[#0a0a0a]">
                        <Star className="w-[16px] h-[16px] text-[#4a5565]" />
                        <span>Prestige: {team.prestige}</span>
                      </div>
                      <div className="flex items-center gap-[8px] text-[#0a0a0a]">
                        <MapPin className="w-[16px] h-[16px] text-[#4a5565]" />
                        <span>{team.country}</span>
                      </div>
                      <div className="flex items-center gap-[8px] text-[#0a0a0a]">
                        <Flag className="w-[16px] h-[16px] text-[#4a5565]" />
                        <span>{seriesData.gridSize} cars</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-[8px] border-t border-black/10">
                      {offer.seatCost > 0 ? (
                        <div>
                          <span className="text-[12px] text-[#4a5565]" style={FR}>Seat Cost</span>
                          <p className={`font-mono ${canAffordSeat(offer.seatCost) ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`} style={FBold}>
                            -${offer.seatCost.toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[12px] text-[#4a5565]" style={FR}>Salary/Race</span>
                          <p className="font-mono text-[#00a63e]" style={FBold}>
                            ${offer.salary.toLocaleString()}
                          </p>
                        </div>
                      )}
                      <span className="flex items-center gap-[4px] text-[13px] text-[#4a5565] hover:text-[#0a0a0a]" style={FR}>
                        View <ChevronRight className="w-[16px] h-[16px]" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : enrichedOffers.length > 0 ? (
            <div className="text-center py-[48px]">
              <Filter className="w-[64px] h-[64px] mx-auto text-[#4a5565] mb-[16px]" />
              <h3 className="text-[20px] text-[#0a0a0a] mb-[8px]" style={FBold}>No Matching Offers</h3>
              <p className="text-[14px] text-[#4a5565] max-w-[400px] mx-auto mb-[16px]" style={FR}>
                No offers match your current filters. Try adjusting your filter criteria.
              </p>
              <button 
                onClick={() => { setSearchQuery(''); setSeatFilter('all'); setTierFilter('all'); setAffordabilityFilter('all'); }}
                className="px-[14px] py-[10px] border-[0.8px] border-black/20 rounded-[12px] text-[13px] text-[#0a0a0a] hover:bg-[#f9fafb] transition-colors"
                style={FBold}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="text-center py-[48px]">
              <Users className="w-[64px] h-[64px] mx-auto text-[#4a5565] mb-[16px]" />
              <h3 className="text-[20px] text-[#0a0a0a] mb-[8px]" style={FBold}>No Offers Available</h3>
              <p className="text-[14px] text-[#4a5565] max-w-[400px] mx-auto mb-[16px]" style={FR}>
                {effectiveReputation < 15 
                  ? 'Your reputation is too low to attract team interest. Try training or participating in lower-tier events.'
                  : 'No teams are currently interested. Try refreshing offers or waiting until next week.'}
              </p>
              <p className="text-[13px] text-[#4a5565]" style={FR}>
                Current team reputation: {(Math.round(effectiveReputation * 10) / 10).toFixed(1)}/100
              </p>
            </div>
          )}
        </div>

        {/* Offer Detail Modal */}
        {showOfferModal && selectedOffer && selectedTeam && selectedSeries && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-[24px]" onClick={() => setShowOfferModal(false)}>
            <div className="bg-white rounded-[24px] w-full max-w-[720px] max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-[24px] border-b border-black/10 flex items-center justify-between">
                <h2 className="text-[22px] text-[#0a0a0a] tracking-[-0.5px]" style={FB}>Contract Offer</h2>
                <button onClick={() => setShowOfferModal(false)} className="w-[36px] h-[36px] rounded-full hover:bg-[#f9fafb] flex items-center justify-center transition-colors">
                  <X className="w-[20px] h-[20px] text-[#4a5565]" />
                </button>
              </div>
              <div className="p-[24px] flex flex-col gap-[24px]">
            
                {/* WORKS PROGRAM OFFER */}
                {selectedOffer.offerType === 'works-program' && (
                  <>
                    <div className="p-[16px] bg-gradient-to-r from-[#fef3c7] to-[#fef3c7]/30 rounded-[16px] border-[0.8px] border-[#f59e0b]/30">
                      <div className="flex items-center gap-[16px]">
                        <div className="w-[64px] h-[64px] rounded-[16px] flex items-center justify-center bg-[#fef3c7] text-[#f59e0b]">
                          <Factory className="w-[32px] h-[32px]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-[8px]">
                            <h3 className="text-[20px] text-[#0a0a0a]" style={FB}>{selectedOffer.programName || selectedOffer.teamName}</h3>
                            <span className="px-[8px] py-[2px] bg-[#fef3c7] text-[#b45309] rounded-[8px] text-[11px]" style={FBold}>Works Driver</span>
                          </div>
                          <p className="text-[13px] text-[#4a5565] mt-[4px]" style={FR}>Factory Driver Contract</p>
                          {selectedManufacturer && (
                            <p className="text-[13px] text-[#f59e0b] mt-[4px]" style={FBold}>{selectedManufacturer.name}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {selectedOffer.likelyAssignment && (
                      <div className={INNER}>
                        <div className="flex items-center gap-[8px] mb-[16px]">
                          <Car className="w-[20px] h-[20px] text-[#f59e0b]" />
                          <h4 className="text-[15px] text-[#0a0a0a]" style={FBold}>Your Assignment</h4>
                          <span className="text-[12px] text-[#4a5565]" style={FR}>(Team decides based on your performance)</span>
                        </div>
                        
                        <div className="p-[16px] bg-[#fef3c7]/50 rounded-[12px] border-[0.8px] border-[#f59e0b]/30">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[17px] text-[#0a0a0a]" style={FB}>{selectedOffer.likelyAssignment.entryName}</p>
                              <p className="text-[14px] text-[#f59e0b]" style={FBold}>{selectedOffer.likelyAssignment.carName}</p>
                              <p className="text-[13px] text-[#4a5565] mt-[4px]" style={FR}>{selectedOffer.likelyAssignment.seriesName}</p>
                            </div>
                            <span className="px-[12px] py-[4px] bg-[#fef3c7] text-[#b45309] rounded-[10px] text-[13px]" style={FBold}>Likely</span>
                          </div>
                          {selectedOffer.likelyAssignment.reason && (
                            <p className="text-[13px] text-[#4a5565] mt-[12px] pt-[12px] border-t border-[#f59e0b]/20" style={FR}>
                              <span className="text-[#f59e0b]" style={FBold}>Why:</span> {selectedOffer.likelyAssignment.reason}
                            </p>
                          )}
                        </div>
                        
                        <p className="text-[12px] text-[#4a5565] mt-[12px] flex items-center gap-[4px]" style={FR}>
                          <AlertCircle className="w-[12px] h-[12px]" />
                          As a works driver, the manufacturer may reassign you between entries/series between seasons.
                        </p>
                      </div>
                    )}

                    {selectedOffer.allProgramEntries && selectedOffer.allProgramEntries.length > 1 && (
                      <div className={INNER}>
                        <div className="flex items-center gap-[8px] mb-[12px]">
                          <Layers className="w-[20px] h-[20px] text-[#4a5565]" />
                          <h4 className="text-[14px] text-[#0a0a0a]" style={FBold}>All Program Entries</h4>
                        </div>
                        <div className="flex flex-col gap-[8px] max-h-[192px] overflow-y-auto">
                          {selectedOffer.allProgramEntries.map(entry => (
                            <div 
                              key={entry.entryId} 
                              className={`flex items-center justify-between p-[8px] rounded-[10px] ${
                                entry.entryId === selectedOffer.likelyAssignment?.entryId 
                                  ? 'bg-[#fef3c7]/50 border-[0.8px] border-[#f59e0b]/30' 
                                  : 'bg-white'
                              }`}
                            >
                              <div>
                                <p className="text-[13px] text-[#0a0a0a]" style={FBold}>{entry.entryName}</p>
                                <p className="text-[12px] text-[#4a5565]" style={FR}>{entry.seriesName}</p>
                              </div>
                              <div className="text-right">
                                {entry.currentDriverName ? (
                                  <p className="text-[12px] text-[#4a5565]" style={FR}>
                                    {entry.currentDriverName} <span className="text-[#0a0a0a]/60">({entry.currentDriverRep})</span>
                                  </p>
                                ) : (
                                  <span className="px-[8px] py-[2px] bg-[#dcfce7] text-[#00a63e] rounded-[8px] text-[11px]" style={FBold}>Vacant</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* SPEC SERIES TEAM OFFER */}
                {selectedOffer.offerType === 'spec-series-team' && selectedOffer.fixedAssignment && (
                  <>
                    <div className={INNER}>
                      <div className="flex items-center gap-[16px]">
                        <div className="w-[64px] h-[64px] rounded-[16px] flex items-center justify-center text-[22px]" style={{ ...FB, backgroundColor: selectedTeam.color + '30', color: selectedTeam.color }}>
                          {selectedTeam.shortName}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-[8px]">
                            <h3 className="text-[20px] text-[#0a0a0a]" style={FB}>{selectedTeam.name}</h3>
                            <span className="px-[8px] py-[2px] bg-[#ede9fe] text-[#8b5cf6] rounded-[8px] text-[11px]" style={FBold}>Spec Series</span>
                          </div>
                          <p className="text-[13px] text-[#4a5565]" style={FR}>{selectedSeries.name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-[16px] bg-[#ede9fe]/50 rounded-[16px] border-[0.8px] border-[#8b5cf6]/30">
                      <div className="flex items-center gap-[8px] mb-[12px]">
                        <Car className="w-[20px] h-[20px] text-[#8b5cf6]" />
                        <h4 className="text-[15px] text-[#0a0a0a]" style={FBold}>Your Assignment</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-[16px]">
                        <div><p className="text-[12px] text-[#4a5565] mb-[4px]" style={FR}>Car</p><p className="text-[#0a0a0a]" style={FB}>{selectedOffer.fixedAssignment.carName}</p></div>
                        <div><p className="text-[12px] text-[#4a5565] mb-[4px]" style={FR}>Series</p><p className="text-[#0a0a0a]" style={FBold}>{selectedOffer.fixedAssignment.seriesName}</p></div>
                        <div><p className="text-[12px] text-[#4a5565] mb-[4px]" style={FR}>Team</p><p className="text-[#0a0a0a]" style={FBold}>{selectedTeam.name}</p></div>
                        <div><p className="text-[12px] text-[#4a5565] mb-[4px]" style={FR}>Role</p><p className="text-[#8b5cf6]" style={FBold}>Race Driver</p></div>
                      </div>
                      <p className="text-[12px] text-[#4a5565] mt-[16px] pt-[12px] border-t border-[#8b5cf6]/20" style={FR}>
                        Spec series: All cars are identical. Success comes down to pure driving skill.
                      </p>
                    </div>
                  </>
                )}

                {/* CUSTOMER TEAM OFFER */}
                {selectedOffer.offerType === 'customer-team' && selectedOffer.fixedAssignment && (
                  <>
                    <div className={INNER}>
                      <div className="flex items-center gap-[16px]">
                        <div className="w-[64px] h-[64px] rounded-[16px] flex items-center justify-center text-[22px]" style={{ ...FB, backgroundColor: selectedTeam.color + '30', color: selectedTeam.color }}>
                          {selectedTeam.shortName}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-[8px]">
                            <h3 className="text-[20px] text-[#0a0a0a]" style={FB}>{selectedTeam.name}</h3>
                            {selectedOffer.programType === 'factory-supported' ? (
                              <span className="px-[8px] py-[2px] bg-[#dbeafe] text-[#3b82f6] rounded-[8px] text-[11px]" style={FBold}>Factory Supported</span>
                            ) : (
                              <span className="px-[8px] py-[2px] bg-[#f9fafb] text-[#4a5565] rounded-[8px] text-[11px]" style={FBold}>Customer Team</span>
                            )}
                          </div>
                          <p className="text-[13px] text-[#4a5565]" style={FR}>{selectedSeries.name}</p>
                          <div className="flex items-center gap-[16px] mt-[8px] text-[13px] text-[#4a5565]" style={FR}>
                            <span className="flex items-center gap-[4px]"><MapPin className="w-[12px] h-[12px]" /> {selectedTeam.country}</span>
                            {selectedManufacturer && (
                              <span className="flex items-center gap-[4px]"><Factory className="w-[12px] h-[12px]" /> {selectedManufacturer.name} equipment</span>
                            )}
                          </div>
                        </div>
                        {selectedOffer.seatCost > 0 && (
                          <span className="px-[8px] py-[2px] bg-[#fef3c7] text-[#b45309] rounded-[8px] text-[11px]" style={FBold}>Pay-Driver</span>
                        )}
                      </div>
                    </div>

                    <div className="p-[16px] bg-[#dbeafe]/30 rounded-[16px] border-[0.8px] border-[#3b82f6]/30">
                      <div className="flex items-center gap-[8px] mb-[12px]">
                        <Car className="w-[20px] h-[20px] text-[#3b82f6]" />
                        <h4 className="text-[15px] text-[#0a0a0a]" style={FBold}>Your Assignment</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-[16px]">
                        <div><p className="text-[12px] text-[#4a5565] mb-[4px]" style={FR}>Car</p><p className="text-[#0a0a0a]" style={FB}>{selectedOffer.fixedAssignment.carName}</p></div>
                        <div><p className="text-[12px] text-[#4a5565] mb-[4px]" style={FR}>Series</p><p className="text-[#0a0a0a]" style={FBold}>{selectedOffer.fixedAssignment.seriesName}</p></div>
                        <div><p className="text-[12px] text-[#4a5565] mb-[4px]" style={FR}>Entry</p><p className="text-[#0a0a0a]" style={FBold}>{selectedOffer.fixedAssignment.entryName}</p></div>
                        <div><p className="text-[12px] text-[#4a5565] mb-[4px]" style={FR}>Role</p><p className="text-[#3b82f6]" style={FBold}>Race Driver</p></div>
                      </div>
                      {selectedOffer.programType === 'factory-supported' && (
                        <p className="text-[12px] text-[#4a5565] mt-[16px] pt-[12px] border-t border-[#3b82f6]/20" style={FR}>
                          Factory-supported: {selectedTeam.name} receives technical support from {selectedManufacturer?.name || 'the manufacturer'}.
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* LIVERY SELECTION */}
                {selectedTeam.liveryNames && selectedTeam.liveryNames.length > 0 && (
                  <div className="p-[16px] bg-[#fff7ed] border-[2px] border-[#f97316] rounded-[16px]">
                    <div className="flex items-center gap-[8px] mb-[12px]">
                      <Palette className="w-[20px] h-[20px] text-[#f97316]" />
                      <h4 className="text-[15px] text-[#f97316]" style={FBold}>In-Game Livery Selection</h4>
                    </div>
                    <p className="text-[13px] text-[#4a5565] mb-[12px]" style={FR}>
                      Select this livery in AMS2 when starting a race:
                    </p>
                    <div className="flex flex-col gap-[8px]">
                      {selectedTeam.liveryNames.map((livery, idx) => (
                        <div key={idx} className="p-[12px] bg-white/80 rounded-[12px] border-[0.8px] border-[#f97316]/30">
                          <p className="font-mono text-[17px] text-[#0a0a0a]" style={FBold}>{livery}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* COMMON: Contract Terms */}
                <div className="grid grid-cols-2 gap-[24px]">
                  <div>
                    <h4 className="text-[13px] text-[#4a5565] mb-[12px]" style={FBold}>Contract Terms</h4>
                    <div className="flex flex-col gap-[12px]">
                      <div className="flex justify-between p-[12px] bg-[#f9fafb] rounded-[12px]">
                        <span className="text-[#4a5565] text-[13px]" style={FR}>Duration</span>
                        <span className="text-[#0a0a0a] text-[13px]" style={FBold}>{selectedOffer.duration} season{selectedOffer.duration > 1 ? 's' : ''}</span>
                      </div>
                      {selectedOffer.seatCost > 0 ? (
                        <div className="flex justify-between p-[12px] bg-[#f9fafb] rounded-[12px]">
                          <span className="text-[#4a5565] text-[13px]" style={FR}>Seat Cost</span>
                          <span className={`font-mono text-[13px] ${canAffordSeat(selectedOffer.seatCost) ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`} style={FBold}>
                            -${selectedOffer.seatCost.toLocaleString()}/season
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between p-[12px] bg-[#f9fafb] rounded-[12px]">
                          <span className="text-[#4a5565] text-[13px]" style={FR}>Salary</span>
                          <span className="font-mono text-[13px] text-[#00a63e]" style={FBold}>${selectedOffer.salary.toLocaleString()}/race</span>
                        </div>
                      )}
                      <div className="flex justify-between p-[12px] bg-[#f9fafb] rounded-[12px]">
                        <span className="text-[#4a5565] text-[13px]" style={FR}>Grid Size</span>
                        <span className="text-[#0a0a0a] text-[13px]" style={FBold}>{selectedSeries.gridSize} cars</span>
                      </div>
                      <div className="flex justify-between p-[12px] bg-[#f9fafb] rounded-[12px]">
                        <span className="text-[#4a5565] text-[13px]" style={FR}>Expires In</span>
                        <span className="text-[#0a0a0a] text-[13px]" style={FBold}>{selectedOffer.expiresWeek} weeks</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[13px] text-[#4a5565] mb-[12px]" style={FBold}>Bonuses & Prizes</h4>
                    <div className="flex flex-col gap-[12px]">
                      <div className="flex justify-between p-[12px] bg-[#f9fafb] rounded-[12px]">
                        <span className="text-[#4a5565] text-[13px]" style={FR}>Win Bonus</span>
                        <span className="font-mono text-[13px] text-[#00a63e]" style={FBold}>+${selectedOffer.bonusPerWin.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-[12px] bg-[#f9fafb] rounded-[12px]">
                        <span className="text-[#4a5565] text-[13px]" style={FR}>Podium Bonus</span>
                        <span className="font-mono text-[13px] text-[#00a63e]" style={FBold}>+${selectedOffer.bonusPerPodium.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-[12px] bg-[#f9fafb] rounded-[12px]">
                        <span className="text-[#4a5565] text-[13px]" style={FR}>Race Win Prize</span>
                        <span className="font-mono text-[13px] text-[#f59e0b]" style={FBold}>+${selectedSeries.prizeMoney.win.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-[12px] bg-[#f9fafb] rounded-[12px]">
                        <span className="text-[#4a5565] text-[13px]" style={FR}>Podium Prize</span>
                        <span className="font-mono text-[13px] text-[#3b82f6]" style={FBold}>+${selectedSeries.prizeMoney.podium.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Targets */}
                {selectedOffer.hasPerformanceTargets && selectedOffer.targetSummary && selectedOffer.targetSummary.length > 0 && (
                  <div className="p-[16px] bg-[#fef3c7]/50 rounded-[16px] border-[0.8px] border-[#f59e0b]/30">
                    <div className="flex items-center gap-[8px] mb-[12px]">
                      <Target className="w-[20px] h-[20px] text-[#f59e0b]" />
                      <h4 className="text-[15px] text-[#f59e0b]" style={FBold}>Performance Expectations</h4>
                    </div>
                    <ul className="flex flex-col gap-[8px]">
                      {selectedOffer.targetSummary.map((target, idx) => (
                        <li key={idx} className="flex items-start gap-[8px] text-[13px] text-[#0a0a0a]" style={FR}>
                          <CircleDot className="w-[16px] h-[16px] text-[#f59e0b] mt-[2px] flex-shrink-0" />
                          <span>{target}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[12px] text-[#4a5565] mt-[12px] pt-[12px] border-t border-[#f59e0b]/20" style={FR}>
                      Meeting these targets keeps the team happy and may trigger auto-renewal bonuses.
                    </p>
                  </div>
                )}

                {/* Contract Options & Clauses */}
                {(selectedOffer.hasAutoRenewal || selectedOffer.hasTeamOption || selectedOffer.hasPlayerOption || selectedOffer.hasPerformanceClause) && (
                  <div className="grid grid-cols-2 gap-[16px]">
                    <div className="p-[16px] bg-[#ede9fe]/30 rounded-[16px] border-[0.8px] border-[#8b5cf6]/30">
                      <div className="flex items-center gap-[8px] mb-[12px]">
                        <RefreshCw className="w-[20px] h-[20px] text-[#8b5cf6]" />
                        <h4 className="text-[15px] text-[#8b5cf6]" style={FBold}>Contract Options</h4>
                      </div>
                      <div className="flex flex-col gap-[8px] text-[13px]" style={FR}>
                        {selectedOffer.hasAutoRenewal && selectedOffer.renewalCondition && (
                          <div className="flex items-center gap-[8px] text-[#0a0a0a]">
                            <Check className="w-[16px] h-[16px] text-[#8b5cf6]" />
                            <span>Auto-renews: {selectedOffer.renewalCondition}</span>
                          </div>
                        )}
                        {selectedOffer.hasTeamOption && (
                          <div className="flex items-center gap-[8px] text-[#0a0a0a]">
                            <Building2 className="w-[16px] h-[16px] text-[#8b5cf6]" />
                            <span>Team has option to extend</span>
                          </div>
                        )}
                        {selectedOffer.hasPlayerOption && (
                          <div className="flex items-center gap-[8px] text-[#0a0a0a]">
                            <Users className="w-[16px] h-[16px] text-[#8b5cf6]" />
                            <span>You have option to extend</span>
                          </div>
                        )}
                        {!selectedOffer.hasAutoRenewal && !selectedOffer.hasTeamOption && !selectedOffer.hasPlayerOption && (
                          <div className="flex items-center gap-[8px] text-[#4a5565]">
                            <X className="w-[16px] h-[16px]" />
                            <span>No extension options</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-[16px] bg-[#fee2e2]/30 rounded-[16px] border-[0.8px] border-[#ef4444]/30">
                      <div className="flex items-center gap-[8px] mb-[12px]">
                        <AlertTriangle className="w-[20px] h-[20px] text-[#ef4444]" />
                        <h4 className="text-[15px] text-[#ef4444]" style={FBold}>Clauses</h4>
                      </div>
                      <div className="flex flex-col gap-[8px] text-[13px]" style={FR}>
                        {selectedOffer.hasPerformanceClause && (
                          <div className="flex items-center gap-[8px] text-[#0a0a0a]">
                            <UserX className="w-[16px] h-[16px] text-[#ef4444]" />
                            <span>Performance clause active</span>
                          </div>
                        )}
                        {selectedOffer.dnfLimit && selectedOffer.dnfLimit < 10 && (
                          <div className="flex items-center gap-[8px] text-[#0a0a0a]">
                            <AlertCircle className="w-[16px] h-[16px] text-[#ef4444]" />
                            <span>Max {selectedOffer.dnfLimit} DNFs allowed</span>
                          </div>
                        )}
                        {!selectedOffer.hasPerformanceClause && (
                          <div className="flex items-center gap-[8px] text-[#4a5565]">
                            <Check className="w-[16px] h-[16px]" />
                            <span>No performance clause</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Media Duties */}
                {selectedOffer.hasMediaDuties && selectedOffer.mediaDutySummary && (
                  <div className="p-[16px] bg-[#dbeafe]/30 rounded-[16px] border-[0.8px] border-[#3b82f6]/30">
                    <div className="flex items-center gap-[8px] mb-[8px]">
                      <Newspaper className="w-[20px] h-[20px] text-[#3b82f6]" />
                      <h4 className="text-[15px] text-[#3b82f6]" style={FBold}>Media Duties Required</h4>
                    </div>
                    <p className="text-[13px] text-[#0a0a0a]" style={FR}>{selectedOffer.mediaDutySummary}</p>
                    <p className="text-[12px] text-[#4a5565] mt-[8px]" style={FR}>
                      Failure to complete media duties may affect team satisfaction and contract bonuses.
                    </p>
                  </div>
                )}

                {/* Team Stats */}
                <div>
                  <h4 className="text-[13px] text-[#4a5565] mb-[12px]" style={FBold}>Team Rating</h4>
                  <div className="grid grid-cols-2 gap-[16px]">
                    <div className="p-[12px] bg-[#f9fafb] rounded-[12px]">
                      <div className="flex justify-between mb-[6px]">
                        <span className="text-[12px] text-[#4a5565]" style={FR}>Prestige</span>
                        <span className="text-[12px] text-[#0a0a0a]" style={FBold}>{selectedTeam.prestige}/100</span>
                      </div>
                      <div className="h-[8px] bg-[#e5e7eb] rounded-full overflow-hidden">
                        <div className="h-full bg-black rounded-full" style={{ width: `${selectedTeam.prestige}%` }} />
                      </div>
                    </div>
                    <div className="p-[12px] bg-[#f9fafb] rounded-[12px]">
                      <div className="flex justify-between mb-[6px]">
                        <span className="text-[12px] text-[#4a5565]" style={FR}>Facilities</span>
                        <span className="text-[12px] text-[#0a0a0a]" style={FBold}>
                          {selectedTeam.facilities === 'elite' ? '100' : selectedTeam.facilities === 'professional' ? '75' : selectedTeam.facilities === 'standard' ? '50' : '25'}/100
                        </span>
                      </div>
                      <div className="h-[8px] bg-[#e5e7eb] rounded-full overflow-hidden">
                        <div className="h-full bg-black rounded-full" style={{ width: `${selectedTeam.facilities === 'elite' ? 100 : selectedTeam.facilities === 'professional' ? 75 : selectedTeam.facilities === 'standard' ? 50 : 25}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Affordability Warning */}
                {selectedOffer.seatCost > 0 && !canAffordSeat(selectedOffer.seatCost) && (
                  <div className="flex items-center gap-[12px] p-[16px] bg-[#fee2e2] border-[0.8px] border-[#ef4444]/30 rounded-[16px]">
                    <AlertCircle className="w-[24px] h-[24px] text-[#ef4444]" />
                    <div>
                      <p className="text-[14px] text-[#ef4444]" style={FBold}>Insufficient Funds</p>
                      <p className="text-[13px] text-[#4a5565]" style={FR}>
                        You need ${selectedOffer.seatCost.toLocaleString()} to pay for this seat. 
                        Your balance: ${(player.finances?.bankBalance ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-[12px] pt-[16px] border-t border-black/10">
                  <button
                    type="button"
                    className="flex-1 inline-flex items-center justify-center gap-[8px] px-[16px] py-[12px] text-[14px] rounded-[16px] border-[0.8px] border-black/20 text-[#4a5565] hover:bg-[#f9fafb] transition-all"
                    onClick={handleDeclineOffer}
                    style={FBold}
                  >
                    <X className="w-[16px] h-[16px]" />
                    Decline
                  </button>
                  <button
                    type="button"
                    className="flex-1 inline-flex items-center justify-center gap-[8px] px-[16px] py-[12px] text-[14px] rounded-[16px] bg-black hover:bg-black/80 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleAcceptOffer}
                    disabled={(selectedOffer?.seatCost ?? 0) > 0 && !canAffordSeat(selectedOffer?.seatCost ?? 0)}
                    style={FBold}
                  >
                    <Check className="w-[16px] h-[16px]" />
                    Accept Contract
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Conflict Resolution Modal */}
        <ConflictModal
          conflict={detectedConflicts[currentConflictIndex] || null}
          isOpen={showConflictModal}
          onClose={() => setShowConflictModal(false)}
          onResolve={handleResolveConflict}
          seriesNames={seriesNames}
          seriesColors={seriesColors}
        />
      </div>
    </div>
  )
}

interface FilterButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-[12px] py-[8px] text-[12px] rounded-[10px] transition-all flex items-center border-[0.8px] ${
        active 
          ? 'bg-black text-white border-black' 
          : 'bg-[#f9fafb] text-[#4a5565] border-black/10 hover:bg-[#f3f4f6]'
      }`}
      style={{ fontFamily: "'Arial', sans-serif", fontWeight: 700 }}
    >
      {children}
    </button>
  )
}
