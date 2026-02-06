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
  Check,
  X,
  AlertCircle,
} from 'lucide-react'
import { Card, CardHeader, Badge, Button, Progress } from '@/components/ui'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import type { ContractTarget, ContractSeasonStats } from '@/store/careerStore'

// Helper to get actual progress for a contract target
  const _getActualTargetProgress = (target: ContractTarget): number => {
    switch (target.type) {
      case 'points_minimum':
        return actualSeasonStats.points
      case 'podiums':
        return actualSeasonStats.podiums
      case 'wins':
        return actualSeasonStats.wins
      default:
        // For other types (championship_position, beat_teammate), use the stored value
        return target.currentProgress || 0
    }
  }

  // Get enriched offers with team and series data
  // Type guard to ensure team and series exist after filtering
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

  // Apply filters and sorting
  const filteredAndSortedOffers = useMemo(() => {
    let filtered = [...enrichedOffers]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(({ team, series: s }) => 
        team.name.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query) ||
        team.country.toLowerCase().includes(query)
      )
    }

    // Seat type filter
    if (seatFilter !== 'all') {
      filtered = filtered.filter(({ offer }) => {
        if (seatFilter === 'paid') return offer.salary > 0
        if (seatFilter === 'pay_driver') return offer.seatCost > 0
        return true
      })
    }

    // Tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(({ series: s }) => s.tier === tierFilter)
    }

    // Affordability filter
    if (affordabilityFilter === 'affordable') {
      filtered = filtered.filter(({ offer }) => 
        offer.seatCost === 0 || canAffordSeat(offer.seatCost)
      )
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'prestige':
          return (b.team?.prestige ?? 0) - (a.team?.prestige ?? 0)
        case 'salary_high':
          return b.offer.salary - a.offer.salary
        case 'salary_low':
          return a.offer.salary - b.offer.salary
        case 'seat_cost_low':
          // Put paid seats (no cost) first, then by seat cost
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

  // Get unique categories for stats
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
    // Initialize series selection with all available series
    setSelectedSeriesIds(offer.availableSeriesIds || [offer.seriesId])
    setShowOfferModal(true)
  }
  
  // Toggle series selection for multi-series contracts
  const _handleToggleSeries = (seriesId: string) => {
    setSelectedSeriesIds(prev => {
      if (prev.includes(seriesId)) {
        // Don't allow deselecting the last series
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

    // Check if seat requires payment (pay driver situation)
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
      // Deduct seat cost
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

    // Use player's selected series (which may be a subset of available series)
    const finalSelectedSeries = selectedSeriesIds.length > 0 ? selectedSeriesIds : [selectedOffer.seriesId]
    const primarySeriesId = finalSelectedSeries[0] // First selected is primary
    
    // Determine contract type based on selection
    let contractType: ContractType = selectedOffer.contractType || 'customer'
    if (selectedOffer.contractType === 'works-full' && finalSelectedSeries.length < (selectedOffer.availableSeriesIds?.length || 1)) {
      contractType = 'works-partial' // Player chose a subset of series
    }
    
    // Build current assignment from offer
    let currentAssignment: CurrentAssignment | undefined
    
    if (selectedOffer.offerType === 'works-program' && selectedOffer.likelyAssignment) {
      // Works program: use the likely assignment from the offer
      currentAssignment = {
        entryId: selectedOffer.likelyAssignment.entryId,
        entryName: selectedOffer.likelyAssignment.entryName,
        carName: selectedOffer.likelyAssignment.carName,
        carClassId: selectedOffer.likelyAssignment.carClassId,
        seriesId: selectedOffer.likelyAssignment.seriesId,
        seriesName: selectedOffer.likelyAssignment.seriesName
      }
    } else if (selectedOffer.fixedAssignment) {
      // Spec series or customer: use the fixed assignment
      currentAssignment = {
        entryId: selectedOffer.fixedAssignment.entryId,
        entryName: selectedOffer.fixedAssignment.entryName,
        carName: selectedOffer.fixedAssignment.carName,
        carClassId: selectedOffer.fixedAssignment.carClassId,
        seriesId: selectedOffer.fixedAssignment.seriesId,
        seriesName: selectedOffer.fixedAssignment.seriesName
      }
    }
    
    // Get team tier for generating contract details
    const offeringTeam = getTeamById(selectedOffer.teamId)
    const teamTier = selectedOffer.teamTier || offeringTeam?.tier || 'semi-pro'
    const primarySeries = getSeriesById(primarySeriesId)
    const totalRaces = selectedOffer.totalRaces || primarySeries?.calendar?.length || 12
    const gridSize = selectedOffer.gridSize || 24
    const playerReputation = player?.reputation || 50
    
    // Determine if this is for next season
    const isForNextSeason = selectedOffer.effectiveDate === 'next_season'
    const contractStartYear = isForNextSeason 
      ? (careerState?.currentYear || new Date().getFullYear()) + 1 
      : (careerState?.currentYear || new Date().getFullYear())
    
    // Generate enhanced contract details (with championship ID for accurate points scaling)
    const isWorksDriver = false // TODO: Determine from offer context if available
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

    // Create contract directly from offer data (more reliable)
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
      // Multi-series fields
      programId: selectedOffer.programId,
      manufacturerId: selectedOffer.manufacturerId,
      contractType,
      seriesIds: finalSelectedSeries,
      primarySeriesId,
      // NEW: Assignment tracking
      offerType: selectedOffer.offerType,
      currentAssignment,
      canBeReassigned: selectedOffer.offerType === 'works-program', // Only works drivers can be reassigned
      
      // ENHANCED CONTRACT DETAILS
      targets,
      mediaDuties,
      teamOption,
      playerOption,
      terminationConditions,
      renewalConditions,
      teamSatisfaction: DEFAULT_TEAM_SATISFACTION, // Start at 70
      satisfactionHistory: [], // Initialize empty history
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
    
    // Close modal first to prevent stale state issues
    setShowOfferModal(false)
    
    // Update stores - pass isForNextSeason to store as pending if needed
    setContract(contract, isForNextSeason)
    acceptContract(selectedOffer)
    
    // Detect calendar conflicts for multi-series contracts
    if (finalSelectedSeries.length > 1) {
      console.log('[Contract] Detecting calendar conflicts for multi-series contract')
      
      // Build calendars map from series data
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
      
      // Detect conflicts
      const conflicts = detectCalendarConflicts(finalSelectedSeries, calendars)
      
      if (conflicts.length > 0) {
        console.log(`[Contract] Found ${conflicts.length} calendar conflicts`)
        
        // Enrich conflicts with series names and prize money
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
        
        // Store conflicts in state for resolution
        setDetectedConflicts(enrichedConflicts)
        setCurrentConflictIndex(0)
        
        // Update career state with pending conflicts
        if (careerState) {
          updateCareerState({
            pendingConflicts: enrichedConflicts
          })
        }
        
        // Show conflict resolution modal after a short delay
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
    
    // Clear selection last
    setSelectedOffer(null)
    
    console.log('[Contract] Contract accepted successfully!')
    
    // === TIME BUDGET + CALENDAR + NOTIFICATION INTEGRATION ===
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
    
    // Show success toast
    addToast({
      type: 'success',
      title: isForNextSeason ? 'Contract Signed for Next Season!' : 'Contract Signed!',
      message: isForNextSeason 
        ? `You will join ${selectedOffer.teamName} next season. Your ${selectedOffer.duration}-year deal begins in ${contractStartYear}.`
        : `Welcome to ${selectedOffer.teamName}! Your ${selectedOffer.duration}-year deal begins now.`,
      duration: 5000
    })
    
    // Show save toast
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
    
    // Close modal first
    setShowOfferModal(false)
    
    // Remove from offers
    declineContract(selectedOffer)
    
    // Clear selection
    setSelectedOffer(null)
    
    console.log('[Contract] Offer declined successfully!')
    
    // Show info toast
    addToast({
      type: 'info',
      title: 'Offer Declined',
      message: `You declined the offer from ${teamName}.`,
      duration: 3000
    })
  }

  const handleRefreshOffers = () => {
    if (player) {
      generateContractOffers(player.id, player.reputation)
    }
  }

  // Handle conflict resolution
  const handleResolveConflict = (chosenSeriesId: string) => {
    const currentConflict = detectedConflicts[currentConflictIndex]
    if (!currentConflict) return
    
    // Resolve the conflict in the store
    resolveConflict(currentConflict.id, chosenSeriesId)
    
    // Move to next conflict or close modal
    if (currentConflictIndex < detectedConflicts.length - 1) {
      setCurrentConflictIndex(currentConflictIndex + 1)
    } else {
      // All conflicts resolved
      setShowConflictModal(false)
      setDetectedConflicts([])
      setCurrentConflictIndex(0)
      
      addToast({
        type: 'success',
        title: 'Conflicts Resolved',
        message: 'All race weekend conflicts have been resolved. You can view missed races in your season calendar.',
        duration: 5000
      })
      
      // Auto-save after resolving conflicts
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

  // Build series names and colors maps for conflict modal
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
  // Get all available series for multi-series contracts
  const _availableSeries = selectedOffer?.availableSeriesIds?.map(id => getSeriesById(id)).filter(Boolean) as Series[] || []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contracts"
        subtitle="Manage your racing contracts and find new opportunities"
        icon={<FileText className="w-6 h-6" />}
      />

      {/* Current Contract */}
      <Card variant="racing" padding="none" className="overflow-hidden">
        {/* Hero background for contracted state */}
        {player.contract && (
          <div className="absolute inset-0 h-48">
            <img 
              src={HERO_IMAGES.contracts}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80" />
          </div>
        )}
        
        <div className="relative p-6">
          <CardHeader title="Current Contract" />
          {player.contract ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-accent-green/20 backdrop-blur-sm border border-accent-green/30 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-accent-green" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl drop-shadow-lg">{player.contract.teamName}</h3>
                    <p className="text-text-secondary">{player.contract.seriesName}</p>
                  </div>
                </div>
              <div className="flex items-center gap-2">
                {/* Contract Status Badge */}
                {(() => {
                  const status = getContractStatus()
                  const yearsLeft = getYearsRemaining()
                  if (status === 'locked') {
                    return (
                      <Badge variant="blue">
                        <Clock className="w-3 h-3 mr-1" />
                        Locked ({yearsLeft}yr)
                      </Badge>
                    )
                  } else if (status === 'final_year') {
                    return (
                      <Badge variant="warning">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Final Year
                      </Badge>
                    )
                  }
                  return null
                })()}
                <Badge variant="green">
                  <Check className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-4 p-4 bg-surface rounded-xl">
              <div className="text-center">
                <p className="text-xs text-text-muted mb-1">Salary/Race</p>
                <p className="font-mono font-bold text-status-success">
                  ${player.contract.salary.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-muted mb-1">Win Bonus</p>
                <p className="font-mono font-bold text-accent-gold">
                  ${player.contract.bonusPerWin.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-muted mb-1">Podium Bonus</p>
                <p className="font-mono font-bold text-accent-blue">
                  ${player.contract.bonusPerPodium.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-muted mb-1">Expires</p>
                <p className="font-mono font-bold">
                  End of {player.contract.endYear}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-muted mb-1">Release Clause</p>
                <p className="font-mono font-bold text-status-error">
                  ${calculateReleaseClause().toLocaleString()}
                </p>
              </div>
            </div>
            
            {/* Contract Status Explanation */}
            {(() => {
              const status = getContractStatus()
              if (status === 'locked') {
                return (
                  <div className="p-3 bg-accent-blue/10 border border-accent-blue/30 rounded-lg">
                    <p className="text-sm text-accent-blue">
                      <strong>Contract Locked:</strong> Other teams must pay your release clause (${calculateReleaseClause().toLocaleString()}) to sign you.
                    </p>
                  </div>
                )
              } else if (status === 'final_year') {
                return (
                  <div className="p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg">
                    <p className="text-sm text-status-warning">
                      <strong>Final Year:</strong> You can negotiate with other teams for next season. Your contract expires at the end of this year.
                    </p>
                  </div>
                )
              }
              return null
            })()}

            {/* Compact link to Garage for full details */}
            <p className="text-xs text-text-muted text-center pt-2">
              View full contract details, targets & stats in the Garage → Contract tab
            </p>
          </div>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-status-warning/10 border border-status-warning/30 rounded-xl">
              <AlertCircle className="w-8 h-8 text-status-warning" />
              <div>
                <h3 className="font-medium text-status-warning">No Active Contract</h3>
                <p className="text-sm text-text-muted">
                  You need to sign with a team to participate in championships. Check the offers below!
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Player Status */}
      <Card variant="glass" padding="md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-text-muted mb-1">Reputation</p>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-accent-gold" />
                <span className="font-display font-bold text-xl">{(Math.round(player.reputation * 10) / 10).toFixed(1)}</span>
                <span className="text-text-muted">/100</span>
              </div>
            </div>
            <div className="w-px h-8 bg-surface-border" />
            <div className="text-center">
              <p className="text-xs text-text-muted mb-1">Available Funds</p>
              <p className="font-mono font-bold text-lg text-status-success">
                ${(player.finances?.bankBalance ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="w-px h-8 bg-surface-border" />
            <div className="flex items-center gap-4 text-sm">
              <div className="px-3 py-1 rounded-lg bg-status-success/10 text-status-success">
                {stats.paidSeats} paid seats
              </div>
              <div className="px-3 py-1 rounded-lg bg-status-warning/10 text-status-warning">
                {stats.payDriverSeats} pay-driver
              </div>
              <div className="px-3 py-1 rounded-lg bg-accent-blue/10 text-accent-blue">
                {stats.affordableSeats} affordable
              </div>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={handleRefreshOffers}>
            <Zap className="w-4 h-4 mr-2" />
            Refresh Offers
          </Button>
        </div>
      </Card>

      {/* Mid-Season Buyout Offers */}
      {(() => {
        const buyoutOffers = enrichedOffers.filter(e => e.offer.isBuyoutOffer)
        if (buyoutOffers.length === 0 || !player.contract) return null
        
        return (
          <Card variant="glass" padding="lg" className="border-2 border-status-error/30">
            <CardHeader 
              title="Mid-Season Buyout Offers" 
              subtitle={`${buyoutOffers.length} team${buyoutOffers.length > 1 ? 's' : ''} willing to pay your release clause`}
            />
            
            <div className="mb-4 p-3 bg-status-error/10 border border-status-error/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-status-error" />
                <div>
                  <p className="text-sm font-medium text-status-error">
                    Your release clause: ${calculateReleaseClause().toLocaleString()}
                  </p>
                  <p className="text-xs text-text-muted">
                    These teams are willing to pay this amount to sign you immediately
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {buyoutOffers.map(({ offer, team, series: seriesData }) => (
                <motion.div
                  key={`buyout-${offer.teamId}_${offer.seriesId}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-surface-elevated rounded-lg border border-status-error/30 hover:border-status-error/60 transition-all cursor-pointer"
                  onClick={() => handleViewOffer(offer)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-xs"
                        style={{ backgroundColor: team.color + '30', color: team.color }}
                      >
                        {team.shortName}
                      </div>
                      <div>
                        <h4 className="font-display font-semibold text-sm">{team.name}</h4>
                        <p className="text-xs text-text-muted">{seriesData.name}</p>
                      </div>
                    </div>
                    <Badge variant={seriesData.tier === 'elite' || seriesData.tier === 'pinnacle' ? 'gold' : 'blue'}>
                      {seriesData.tier}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Buyout Amount:</span>
                      <span className="font-bold text-status-error">${offer.buyoutCost?.toLocaleString()}</span>
                    </div>
                    {offer.signingBonus && (
                      <div className="flex justify-between">
                        <span className="text-text-muted">Your Signing Bonus:</span>
                        <span className="font-bold text-status-success">+${offer.signingBonus.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-text-muted">Salary:</span>
                      <span className="font-mono">${offer.salary.toLocaleString()}/race</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Duration:</span>
                      <span>{offer.duration} year{offer.duration > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-full mt-3 bg-status-error hover:bg-status-error/80"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewOffer(offer)
                    }}
                  >
                    View Offer Details
                  </Button>
                </motion.div>
              ))}
            </div>
          </Card>
        )
      })()}

      {/* Filters & Sort */}
      <Card variant="glass" padding="md">
        <div className="space-y-4">
          {/* Search and Toggle */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search teams, series, or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-red transition-colors"
              />
            </div>
            <Button 
              variant={showFilters ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-4 gap-4 pt-4 border-t border-surface-border"
            >
              {/* Seat Type */}
              <div>
                <label className="text-xs text-text-muted mb-2 block font-medium">Seat Type</label>
                <div className="flex gap-1">
                  <FilterButton 
                    active={seatFilter === 'all'} 
                    onClick={() => setSeatFilter('all')}
                  >
                    All
                  </FilterButton>
                  <FilterButton 
                    active={seatFilter === 'paid'} 
                    onClick={() => setSeatFilter('paid')}
                  >
                    <DollarSign className="w-3 h-3 mr-1" />
                    Paid
                  </FilterButton>
                  <FilterButton 
                    active={seatFilter === 'pay_driver'} 
                    onClick={() => setSeatFilter('pay_driver')}
                  >
                    <Wallet className="w-3 h-3 mr-1" />
                    Pay-Driver
                  </FilterButton>
                </div>
              </div>

              {/* Tier */}
              <div>
                <label className="text-xs text-text-muted mb-2 block font-medium">Tier</label>
                <div className="flex gap-1 flex-wrap">
                  <FilterButton 
                    active={tierFilter === 'all'} 
                    onClick={() => setTierFilter('all')}
                  >
                    All
                  </FilterButton>
                  <FilterButton 
                    active={tierFilter === 'elite'} 
                    onClick={() => setTierFilter('elite')}
                    variant="gold"
                  >
                    Elite
                  </FilterButton>
                  <FilterButton 
                    active={tierFilter === 'pro'} 
                    onClick={() => setTierFilter('pro')}
                    variant="blue"
                  >
                    Pro
                  </FilterButton>
                  <FilterButton 
                    active={tierFilter === 'professional'} 
                    onClick={() => setTierFilter('professional')}
                    variant="blue"
                  >
                    Professional
                  </FilterButton>
                  <FilterButton 
                    active={tierFilter === 'semi-pro'} 
                    onClick={() => setTierFilter('semi-pro')}
                  >
                    Semi-Pro
                  </FilterButton>
                  <FilterButton 
                    active={tierFilter === 'amateur'} 
                    onClick={() => setTierFilter('amateur')}
                  >
                    Amateur
                  </FilterButton>
                  <FilterButton 
                    active={tierFilter === 'entry'} 
                    onClick={() => setTierFilter('entry')}
                  >
                    Entry
                  </FilterButton>
                </div>
              </div>

              {/* Affordability */}
              <div>
                <label className="text-xs text-text-muted mb-2 block font-medium">Budget</label>
                <div className="flex gap-1">
                  <FilterButton 
                    active={affordabilityFilter === 'all'} 
                    onClick={() => setAffordabilityFilter('all')}
                  >
                    Show All
                  </FilterButton>
                  <FilterButton 
                    active={affordabilityFilter === 'affordable'} 
                    onClick={() => setAffordabilityFilter('affordable')}
                    variant="green"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Affordable
                  </FilterButton>
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="text-xs text-text-muted mb-2 block font-medium">Sort By</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="w-full px-3 py-1.5 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-red transition-colors"
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

          {/* Active filters summary */}
          {(seatFilter !== 'all' || tierFilter !== 'all' || affordabilityFilter !== 'all' || searchQuery) && (
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs text-text-muted">Active filters:</span>
              {searchQuery && (
                <Badge variant="default" size="sm" className="gap-1">
                  Search: "{searchQuery}"
                  <X className="w-3 h-3 cursor-pointer hover:text-status-danger" onClick={() => setSearchQuery('')} />
                </Badge>
              )}
              {seatFilter !== 'all' && (
                <Badge variant={seatFilter === 'paid' ? 'green' : 'orange'} size="sm" className="gap-1">
                  {seatFilter === 'paid' ? 'Paid Seats' : 'Pay-Driver'}
                  <X className="w-3 h-3 cursor-pointer hover:text-status-danger" onClick={() => setSeatFilter('all')} />
                </Badge>
              )}
              {tierFilter !== 'all' && (
                <Badge variant={tierFilter === 'elite' || tierFilter === 'pinnacle' ? 'gold' : tierFilter === 'professional' || tierFilter === 'pro' ? 'blue' : 'default'} size="sm" className="gap-1">
                  {tierFilter.charAt(0).toUpperCase() + tierFilter.slice(1)}
                  <X className="w-3 h-3 cursor-pointer hover:text-status-danger" onClick={() => setTierFilter('all')} />
                </Badge>
              )}
              {affordabilityFilter !== 'all' && (
                <Badge variant="green" size="sm" className="gap-1">
                  Affordable Only
                  <X className="w-3 h-3 cursor-pointer hover:text-status-danger" onClick={() => setAffordabilityFilter('all')} />
                </Badge>
              )}
              <button 
                onClick={() => { setSearchQuery(''); setSeatFilter('all'); setTierFilter('all'); setAffordabilityFilter('all'); }}
                className="text-xs text-accent-red hover:underline ml-2"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Available Offers */}
      <Card variant="glass" padding="lg">
        <CardHeader 
          title="Available Opportunities" 
          subtitle={`Showing ${filteredAndSortedOffers.length} of ${enrichedOffers.length} offers`}
        />

        {filteredAndSortedOffers.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
            {filteredAndSortedOffers.map(({ offer, team, series: seriesData }, index) => (
              <motion.div
                key={`${offer.teamId}_${offer.seriesId}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card 
                  variant="default" 
                  padding="none" 
                  hoverable 
                  className="overflow-hidden cursor-pointer"
                  onClick={() => handleViewOffer(offer)}
                >
                  {/* Header */}
                  <div 
                    className="p-4 border-b border-surface-border"
                    style={{ 
                      background: `linear-gradient(135deg, ${team.color}20 0%, transparent 100%)` 
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center font-display font-bold text-sm"
                          style={{ backgroundColor: team.color + '30', color: team.color }}
                        >
                          {team.shortName}
                        </div>
                        <div>
                          <h3 className="font-display font-semibold">{team.name}</h3>
                          <p className="text-sm text-text-muted">{seriesData.name}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={seriesData.tier === 'elite' || seriesData.tier === 'pinnacle' ? 'gold' : seriesData.tier === 'professional' || seriesData.tier === 'pro' ? 'blue' : 'default'}>
                          {seriesData.tier.charAt(0).toUpperCase() + seriesData.tier.slice(1)}
                        </Badge>
                        {offer.isBuyoutOffer && (
                          <Badge variant="error" size="sm">Buyout Offer</Badge>
                        )}
                        {offer.effectiveDate === 'next_season' && (
                          <Badge variant="warning" size="sm">Next Season</Badge>
                        )}
                        {offer.seatCost > 0 && (
                          <Badge variant="orange" size="sm">Pay-Driver</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Buyout Info Banner */}
                  {offer.isBuyoutOffer && offer.buyoutCost && (
                    <div className="px-4 py-2 bg-status-error/10 border-y border-status-error/30">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-status-error font-medium">
                          Team pays ${offer.buyoutCost.toLocaleString()} buyout to your current team
                        </span>
                        {offer.signingBonus && (
                          <span className="text-status-success font-medium">
                            +${offer.signingBonus.toLocaleString()} signing bonus for you
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Details */}
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-text-muted" />
                        <span>{offer.duration} year{offer.duration > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-text-muted" />
                        <span>Prestige: {team.prestige}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-text-muted" />
                        <span>{team.country}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-text-muted" />
                        <span>{seriesData.gridSize} cars</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-surface-border">
                      {offer.seatCost > 0 ? (
                        <div>
                          <span className="text-xs text-text-muted">Seat Cost</span>
                          <p className={`font-mono font-bold ${canAffordSeat(offer.seatCost) ? 'text-status-warning' : 'text-status-danger'}`}>
                            -${offer.seatCost.toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="text-xs text-text-muted">Salary/Race</span>
                          <p className="font-mono font-bold text-status-success">
                            ${offer.salary.toLocaleString()}
                          </p>
                        </div>
                      )}
                      <Button variant="ghost" size="sm">
                        View <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : enrichedOffers.length > 0 ? (
          <div className="text-center py-12">
            <Filter className="w-16 h-16 mx-auto text-text-muted mb-4" />
            <h3 className="font-display font-semibold text-xl mb-2">No Matching Offers</h3>
            <p className="text-text-muted max-w-md mx-auto mb-4">
              No offers match your current filters. Try adjusting your filter criteria.
            </p>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => { setSearchQuery(''); setSeatFilter('all'); setTierFilter('all'); setAffordabilityFilter('all'); }}
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-text-muted mb-4" />
            <h3 className="font-display font-semibold text-xl mb-2">No Offers Available</h3>
            <p className="text-text-muted max-w-md mx-auto mb-4">
              {player.reputation < 15 
                ? 'Your reputation is too low to attract team interest. Try training or participating in lower-tier events.'
                : 'No teams are currently interested. Try refreshing offers or waiting until next week.'}
            </p>
            <p className="text-sm text-text-muted">
              Current reputation: {(Math.round(player.reputation * 10) / 10).toFixed(1)}/100
            </p>
          </div>
        )}
      </Card>

      {/* Offer Detail Modal */}
      <Modal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        title="Contract Offer"
        size="lg"
      >
        {selectedOffer && selectedTeam && selectedSeries && (
          <div className="space-y-6">
            
            {/* ============================================ */}
            {/* WORKS PROGRAM OFFER */}
            {/* ============================================ */}
            {selectedOffer.offerType === 'works-program' && (
              <>
                {/* Program Header */}
                <div className="p-4 bg-gradient-to-r from-accent-gold/20 to-accent-gold/5 rounded-xl border border-accent-gold/30">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-display font-bold bg-accent-gold/20 text-accent-gold"
                    >
                      <Factory className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-xl">{selectedOffer.programName || selectedOffer.teamName}</h3>
                        <Badge variant="gold">Works Driver</Badge>
                      </div>
                      <p className="text-text-muted mt-1">Factory Driver Contract</p>
                      {selectedManufacturer && (
                        <p className="text-sm text-accent-gold mt-1">{selectedManufacturer.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Your Assignment Section */}
                {selectedOffer.likelyAssignment && (
                  <div className="p-4 bg-surface rounded-xl border border-surface-border">
                    <div className="flex items-center gap-2 mb-4">
                      <Car className="w-5 h-5 text-accent-gold" />
                      <h4 className="font-display font-semibold">Your Assignment</h4>
                      <span className="text-xs text-text-muted">(Team decides based on your performance)</span>
                    </div>
                    
                    <div className="p-4 bg-accent-gold/10 rounded-lg border border-accent-gold/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-display font-bold text-lg">{selectedOffer.likelyAssignment.entryName}</p>
                          <p className="text-accent-gold font-medium">{selectedOffer.likelyAssignment.carName}</p>
                          <p className="text-text-muted text-sm mt-1">{selectedOffer.likelyAssignment.seriesName}</p>
                        </div>
                        <Badge variant="gold" size="lg">Likely</Badge>
                      </div>
                      {selectedOffer.likelyAssignment.reason && (
                        <p className="text-sm text-text-muted mt-3 pt-3 border-t border-accent-gold/20">
                          <span className="text-accent-gold">Why:</span> {selectedOffer.likelyAssignment.reason}
                        </p>
                      )}
                    </div>
                    
                    <p className="text-xs text-text-muted mt-3 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      As a works driver, the manufacturer may reassign you between entries/series between seasons.
                    </p>
                  </div>
                )}

                {/* All Program Entries */}
                {selectedOffer.allProgramEntries && selectedOffer.allProgramEntries.length > 1 && (
                  <div className="p-4 bg-surface rounded-xl border border-surface-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="w-5 h-5 text-text-muted" />
                      <h4 className="font-display font-semibold text-sm">All Program Entries</h4>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedOffer.allProgramEntries.map(entry => (
                        <div 
                          key={entry.entryId} 
                          className={`flex items-center justify-between p-2 rounded-lg ${
                            entry.entryId === selectedOffer.likelyAssignment?.entryId 
                              ? 'bg-accent-gold/10 border border-accent-gold/30' 
                              : 'bg-background'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium">{entry.entryName}</p>
                            <p className="text-xs text-text-muted">{entry.seriesName}</p>
                          </div>
                          <div className="text-right">
                            {entry.currentDriverName ? (
                              <p className="text-xs text-text-muted">
                                {entry.currentDriverName} <span className="text-text-secondary">({entry.currentDriverRep})</span>
                              </p>
                            ) : (
                              <Badge variant="green" size="sm">Vacant</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ============================================ */}
            {/* SPEC SERIES TEAM OFFER */}
            {/* ============================================ */}
            {selectedOffer.offerType === 'spec-series-team' && selectedOffer.fixedAssignment && (
              <>
                {/* Team Header */}
                <div className="p-4 bg-surface rounded-xl border border-surface-border">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-display font-bold"
                      style={{ backgroundColor: selectedTeam.color + '30', color: selectedTeam.color }}
                    >
                      {selectedTeam.shortName}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-xl">{selectedTeam.name}</h3>
                        <Badge variant="purple">Spec Series</Badge>
                      </div>
                      <p className="text-text-muted">{selectedSeries.name}</p>
                    </div>
                  </div>
                </div>

                {/* Your Assignment (Fixed) */}
                <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Car className="w-5 h-5 text-purple-400" />
                    <h4 className="font-display font-semibold">Your Assignment</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-text-muted mb-1">Car</p>
                      <p className="font-display font-bold">{selectedOffer.fixedAssignment.carName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted mb-1">Series</p>
                      <p className="font-medium">{selectedOffer.fixedAssignment.seriesName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted mb-1">Team</p>
                      <p className="font-medium">{selectedTeam.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted mb-1">Role</p>
                      <p className="font-medium text-purple-400">Race Driver</p>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mt-4 pt-3 border-t border-purple-500/20">
                    Spec series: All cars are identical. Success comes down to pure driving skill.
                  </p>
                </div>
              </>
            )}

            {/* ============================================ */}
            {/* CUSTOMER TEAM OFFER */}
            {/* ============================================ */}
            {selectedOffer.offerType === 'customer-team' && selectedOffer.fixedAssignment && (
              <>
                {/* Team Header */}
                <div className="p-4 bg-surface rounded-xl border border-surface-border">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-display font-bold"
                      style={{ backgroundColor: selectedTeam.color + '30', color: selectedTeam.color }}
                    >
                      {selectedTeam.shortName}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-xl">{selectedTeam.name}</h3>
                        {selectedOffer.programType === 'factory-supported' ? (
                          <Badge variant="blue">Factory Supported</Badge>
                        ) : (
                          <Badge variant="default">Customer Team</Badge>
                        )}
                      </div>
                      <p className="text-text-muted">{selectedSeries.name}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {selectedTeam.country}
                        </span>
                        {selectedManufacturer && (
                          <span className="flex items-center gap-1">
                            <Factory className="w-3 h-3" /> {selectedManufacturer.name} equipment
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedOffer.seatCost > 0 && (
                      <Badge variant="orange">Pay-Driver</Badge>
                    )}
                  </div>
                </div>

                {/* Your Assignment (Fixed) */}
                <div className="p-4 bg-accent-blue/10 rounded-xl border border-accent-blue/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Car className="w-5 h-5 text-accent-blue" />
                    <h4 className="font-display font-semibold">Your Assignment</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-text-muted mb-1">Car</p>
                      <p className="font-display font-bold">{selectedOffer.fixedAssignment.carName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted mb-1">Series</p>
                      <p className="font-medium">{selectedOffer.fixedAssignment.seriesName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted mb-1">Entry</p>
                      <p className="font-medium">{selectedOffer.fixedAssignment.entryName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted mb-1">Role</p>
                      <p className="font-medium text-accent-blue">Race Driver</p>
                    </div>
                  </div>
                  {selectedOffer.programType === 'factory-supported' && (
                    <p className="text-xs text-text-muted mt-4 pt-3 border-t border-accent-blue/20">
                      Factory-supported: {selectedTeam.name} receives technical support from {selectedManufacturer?.name || 'the manufacturer'}.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* ============================================ */}
            {/* LIVERY SELECTION - Critical for AMS2 */}
            {/* ============================================ */}
            {selectedTeam.liveryNames && selectedTeam.liveryNames.length > 0 && (
              <div className="p-4 bg-accent-orange/10 border-2 border-accent-orange rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-5 h-5 text-accent-orange" />
                  <h4 className="font-display font-semibold text-accent-orange">
                    In-Game Livery Selection
                  </h4>
                </div>
                <p className="text-sm text-text-muted mb-3">
                  Select this livery in AMS2 when starting a race:
                </p>
                <div className="space-y-2">
                  {selectedTeam.liveryNames.map((livery, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-background/80 rounded-lg border border-accent-orange/30"
                    >
                      <p className="font-mono font-bold text-lg">{livery}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* COMMON SECTIONS (All Offer Types) */}
            {/* ============================================ */}

            {/* Contract Terms */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-text-muted text-sm mb-3 font-medium">Contract Terms</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-background rounded-lg">
                    <span className="text-text-muted">Duration</span>
                    <span className="font-medium">{selectedOffer.duration} season{selectedOffer.duration > 1 ? 's' : ''}</span>
                  </div>
                  {selectedOffer.seatCost > 0 ? (
                    <div className="flex justify-between p-3 bg-background rounded-lg">
                      <span className="text-text-muted">Seat Cost</span>
                      <span className={`font-mono font-bold ${canAffordSeat(selectedOffer.seatCost) ? 'text-status-warning' : 'text-status-danger'}`}>
                        -${selectedOffer.seatCost.toLocaleString()}/season
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between p-3 bg-background rounded-lg">
                      <span className="text-text-muted">Salary</span>
                      <span className="font-mono font-bold text-status-success">
                        ${selectedOffer.salary.toLocaleString()}/race
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between p-3 bg-background rounded-lg">
                    <span className="text-text-muted">Grid Size</span>
                    <span className="font-medium">{selectedSeries.gridSize} cars</span>
                  </div>
                  <div className="flex justify-between p-3 bg-background rounded-lg">
                    <span className="text-text-muted">Expires In</span>
                    <span className="font-medium">{selectedOffer.expiresWeek} weeks</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-text-muted text-sm mb-3 font-medium">Bonuses & Prizes</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-background rounded-lg">
                    <span className="text-text-muted">Win Bonus</span>
                    <span className="font-mono text-status-success">
                      +${selectedOffer.bonusPerWin.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-background rounded-lg">
                    <span className="text-text-muted">Podium Bonus</span>
                    <span className="font-mono text-status-success">
                      +${selectedOffer.bonusPerPodium.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-background rounded-lg">
                    <span className="text-text-muted">Race Win Prize</span>
                    <span className="font-mono text-accent-gold">
                      +${selectedSeries.prizeMoney.win.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-background rounded-lg">
                    <span className="text-text-muted">Podium Prize</span>
                    <span className="font-mono text-accent-blue">
                      +${selectedSeries.prizeMoney.podium.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================ */}
            {/* ENHANCED CONTRACT TERMS */}
            {/* ============================================ */}
            
            {/* Performance Targets */}
            {selectedOffer.hasPerformanceTargets && selectedOffer.targetSummary && selectedOffer.targetSummary.length > 0 && (
              <div className="p-4 bg-accent-gold/10 rounded-xl border border-accent-gold/30">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-accent-gold" />
                  <h4 className="font-display font-semibold text-accent-gold">Performance Expectations</h4>
                </div>
                <ul className="space-y-2">
                  {selectedOffer.targetSummary.map((target, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CircleDot className="w-4 h-4 text-accent-gold mt-0.5 flex-shrink-0" />
                      <span>{target}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-text-muted mt-3 pt-3 border-t border-accent-gold/20">
                  Meeting these targets keeps the team happy and may trigger auto-renewal bonuses.
                </p>
              </div>
            )}

            {/* Contract Options & Clauses */}
            {(selectedOffer.hasAutoRenewal || selectedOffer.hasTeamOption || selectedOffer.hasPlayerOption || selectedOffer.hasPerformanceClause) && (
              <div className="grid grid-cols-2 gap-4">
                {/* Renewal & Options */}
                <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <RefreshCw className="w-5 h-5 text-purple-400" />
                    <h4 className="font-display font-semibold text-purple-400">Contract Options</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    {selectedOffer.hasAutoRenewal && selectedOffer.renewalCondition && (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-purple-400" />
                        <span>Auto-renews: {selectedOffer.renewalCondition}</span>
                      </div>
                    )}
                    {selectedOffer.hasTeamOption && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-purple-400" />
                        <span>Team has option to extend</span>
                      </div>
                    )}
                    {selectedOffer.hasPlayerOption && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-400" />
                        <span>You have option to extend</span>
                      </div>
                    )}
                    {!selectedOffer.hasAutoRenewal && !selectedOffer.hasTeamOption && !selectedOffer.hasPlayerOption && (
                      <div className="flex items-center gap-2 text-text-muted">
                        <X className="w-4 h-4" />
                        <span>No extension options</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Termination Clauses */}
                <div className="p-4 bg-status-error/10 rounded-xl border border-status-error/30">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-status-error" />
                    <h4 className="font-display font-semibold text-status-error">Clauses</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    {selectedOffer.hasPerformanceClause && (
                      <div className="flex items-center gap-2">
                        <UserX className="w-4 h-4 text-status-error" />
                        <span>Performance clause active</span>
                      </div>
                    )}
                    {selectedOffer.dnfLimit && selectedOffer.dnfLimit < 10 && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-status-error" />
                        <span>Max {selectedOffer.dnfLimit} DNFs allowed</span>
                      </div>
                    )}
                    {!selectedOffer.hasPerformanceClause && (
                      <div className="flex items-center gap-2 text-text-muted">
                        <Check className="w-4 h-4" />
                        <span>No performance clause</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Media Duties */}
            {selectedOffer.hasMediaDuties && selectedOffer.mediaDutySummary && (
              <div className="p-4 bg-accent-blue/10 rounded-xl border border-accent-blue/30">
                <div className="flex items-center gap-2 mb-2">
                  <Newspaper className="w-5 h-5 text-accent-blue" />
                  <h4 className="font-display font-semibold text-accent-blue">Media Duties Required</h4>
                </div>
                <p className="text-sm">{selectedOffer.mediaDutySummary}</p>
                <p className="text-xs text-text-muted mt-2">
                  Failure to complete media duties may affect team satisfaction and contract bonuses.
                </p>
              </div>
            )}

            {/* Team Stats */}
            <div>
              <h4 className="text-text-muted text-sm mb-3 font-medium">Team Rating</h4>
              <div className="grid grid-cols-2 gap-4">
                <StatBar label="Prestige" value={selectedTeam.prestige} maxValue={100} />
                <StatBar 
                  label="Facilities" 
                  value={selectedTeam.facilities === 'elite' ? 100 : selectedTeam.facilities === 'professional' ? 75 : selectedTeam.facilities === 'standard' ? 50 : 25} 
                  maxValue={100}
                />
              </div>
            </div>

            {/* Affordability Warning */}
            {selectedOffer.seatCost > 0 && !canAffordSeat(selectedOffer.seatCost) && (
              <div className="flex items-center gap-3 p-4 bg-status-danger/10 border border-status-danger/30 rounded-xl">
                <AlertCircle className="w-6 h-6 text-status-danger" />
                <div>
                  <p className="font-medium text-status-danger">Insufficient Funds</p>
                  <p className="text-sm text-text-muted">
                    You need ${selectedOffer.seatCost.toLocaleString()} to pay for this seat. 
                    Your balance: ${(player.finances?.bankBalance ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-surface-border">
              <button
                type="button"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-transparent hover:bg-surface-secondary text-text-secondary hover:text-white transition-all"
                onClick={handleDeclineOffer}
              >
                <X className="w-4 h-4" />
                Decline
              </button>
              <button
                type="button"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-accent-red to-accent-red/80 hover:from-accent-redHover hover:to-accent-red text-white shadow-racing transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleAcceptOffer}
                disabled={(selectedOffer?.seatCost ?? 0) > 0 && !canAffordSeat(selectedOffer?.seatCost ?? 0)}
              >
                <Check className="w-4 h-4" />
                Accept Contract
              </button>
            </div>
          </div>
        )}
      </Modal>

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
  )
}

// Filter Button Component
interface FilterButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  variant?: 'default' | 'gold' | 'blue' | 'green' | 'orange'
}

function FilterButton({ active, onClick, children, variant = 'default' }: FilterButtonProps) {
  const variantClasses = {
    default: active ? 'bg-text-primary text-background' : 'bg-surface hover:bg-surface-secondary',
    gold: active ? 'bg-accent-gold text-background' : 'bg-surface hover:bg-accent-gold/20',
    blue: active ? 'bg-accent-blue text-background' : 'bg-surface hover:bg-accent-blue/20',
    green: active ? 'bg-status-success text-background' : 'bg-surface hover:bg-status-success/20',
    orange: active ? 'bg-accent-orange text-background' : 'bg-surface hover:bg-accent-orange/20',
  }

  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center
        ${variantClasses[variant]}
        border border-surface-border
      `}
    >
      {children}
    </button>
  )
}
