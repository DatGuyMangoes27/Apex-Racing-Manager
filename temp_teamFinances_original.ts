// ============================================
// TEAM FINANCES CORE LOGIC
// ============================================
// Handles all team-level financial processing:
// - Income: sponsors, prizes, manufacturer payments
// - Expenses: entry fees, development, travel, facilities
// - Budget tracking and cost cap compliance

import { 
  TeamTransaction, 
  TeamTransactionCategory,
  TeamSponsorDeal,
  TeamSponsorTarget,
  TeamFinancialState,
  TeamBudgets,
  OwnedTeam,
  TeamSeriesEntry,
  createDefaultExtendedFinancialState
} from '@/store/careerStore'
import { TeamTier } from '@/store/rivalStore'
import {
  PRIZE_POOLS_BY_TIER,
  calculateRacePrizeMoney,
  calculateSeasonPrizeMoney,
  getManufacturerPayment,
  FACILITY_COSTS_BY_TIER,
  DEVELOPMENT_COSTS_BY_TIER,
  COST_CAP_BY_TIER,
  _TEAM_SPONSOR_TIERS,
  _getTeamSponsorTierForReputation,
  _INCOME_CATEGORIES,
  _EXPENSE_CATEGORIES,
  SERIES_REVENUE_BY_TIER,
  MAINTENANCE_COSTS_BY_TIER,
  calculateWeeklyMaintenanceCost
} from '@/data/financial-config'
import {
  FacilityType,
  FACILITY_TYPES,
  FACILITY_NAMES,
  calculateFacilityWeeklyCost,
  calculateTotalFacilityCosts,
  calculateUpgradeCost,
  calculateUpgradeDuration,
  getFacilityLevelConfig,
  canUpgradeFacility
} from '@/data/facility-config'
import {
  calculateTravelCostEstimate,
  COUNTRIES,
  EXAMPLE_SERIES
} from '@/data/travel-logistics'

// ============================================
// TRANSACTION HELPERS
// ============================================

let transactionIdCounter = 0

export function createTeamTransaction(
  type: 'income' | 'expense',
  category: TeamTransactionCategory,
  amount: number,
  description: string,
  week: number,
  year: number,
  options: {
    seriesId?: string
    raceWeek?: number
    sponsorId?: string
    countsTowardCostCap?: boolean
  } = {}
): TeamTransaction {
  const countsTowardCostCap = options.countsTowardCostCap ?? (
    type === 'expense' && category !== 'entry_fee'
  )
  
  return {
    id: `team_tx_${year}_${week}_${++transactionIdCounter}`,
    date: new Date().toISOString(),
    week,
    year,
    type,
    category,
    amount,
    description,
    seriesId: options.seriesId,
    raceWeek: options.raceWeek,
    sponsorId: options.sponsorId,
    countsTowardCostCap
  }
}

// ============================================
// INCOME PROCESSING
// ============================================

/**
 * Process weekly sponsor payments for team sponsors
 */
export function processTeamSponsorPayments(
  team: OwnedTeam,
  week: number,
  year: number
): { transactions: TeamTransaction[]; updatedSponsors: TeamSponsorDeal[] } {
  const transactions: TeamTransaction[] = []
  const sponsors = team.finances?.sponsors || []
  const updatedSponsors = sponsors.map(sponsor => {
    if (!sponsor.active) return sponsor
    
    // Weekly payment = monthly / 4
    const weeklyPayment = Math.round(sponsor.monthlyPayment / 4)
    
    // Satisfaction modifier (similar to personal sponsors)
    const satisfactionModifier = getSponsorPaymentModifier(sponsor.satisfaction)
    const adjustedPayment = Math.round(weeklyPayment * satisfactionModifier)
    
    if (adjustedPayment > 0) {
      let description = `${sponsor.sponsorName} weekly payment`
      if (satisfactionModifier !== 1) {
        const pct = Math.round(satisfactionModifier * 100)
        description += ` (${pct}% - ${sponsor.satisfaction >= 80 ? 'Excellent' : sponsor.satisfaction >= 60 ? 'Good' : 'Warning'})`
      }
      
      transactions.push(createTeamTransaction(
        'income',
        'team_sponsor',
        adjustedPayment,
        description,
        week,
        year,
        { sponsorId: sponsor.id }
      ))
    }
    
    return sponsor
  })
  
  return { transactions, updatedSponsors }
}

/**
 * Get payment modifier based on sponsor satisfaction
 */
export function getSponsorPaymentModifier(satisfaction: number): number {
  if (satisfaction >= 80) return 1.1      // Excellent: +10%
  if (satisfaction >= 60) return 1.0      // Good: 100%
  if (satisfaction >= 40) return 0.75     // Warning: 75%
  if (satisfaction >= 20) return 0.5      // Critical: 50%
  return 0                                 // Terminated
}

/**
 * Process race result prize money for team
 */
export function processRacePrizeIncome(
  _team: OwnedTeam,
  position: number,
  tier: TeamTier,
  totalParticipants: number,
  seriesId: string,
  seriesName: string,
  week: number,
  year: number
): TeamTransaction | null {
  const prizeMoney = calculateRacePrizeMoney(position, tier, totalParticipants)
  
  if (prizeMoney <= 0) return null
  
  let description = `${seriesName} race prize - `
  if (position === 1) description += 'Win!'
  else if (position <= 3) description += `P${position} Podium`
  else description += `P${position}`
  
  return createTeamTransaction(
    'income',
    'prize_race',
    prizeMoney,
    description,
    week,
    year,
    { seriesId, raceWeek: week }
  )
}

/**
 * Process sponsor bonuses after a race
 */
export function processTeamSponsorRaceBonuses(
  team: OwnedTeam,
  position: number,
  week: number,
  year: number
): { transactions: TeamTransaction[]; updatedSponsors: TeamSponsorDeal[] } {
  const transactions: TeamTransaction[] = []
  const sponsors = team.finances?.sponsors || []
  
  const updatedSponsors = sponsors.map(sponsor => {
    if (!sponsor.active) return sponsor
    
    const updated = { ...sponsor }
    updated.seasonRaces = (updated.seasonRaces || 0) + 1
    
    // Win bonus
    if (position === 1 && sponsor.winBonus > 0) {
      const modifier = getSponsorPaymentModifier(sponsor.satisfaction)
      const bonus = Math.round(sponsor.winBonus * modifier)
      if (bonus > 0) {
        transactions.push(createTeamTransaction(
          'income',
          'team_sponsor',
          bonus,
          `${sponsor.sponsorName} win bonus`,
          week,
          year,
          { sponsorId: sponsor.id, raceWeek: week }
        ))
      }
      updated.seasonWins = (updated.seasonWins || 0) + 1
    }
    
    // Podium bonus
    if (position <= 3 && sponsor.podiumBonus > 0) {
      const modifier = getSponsorPaymentModifier(sponsor.satisfaction)
      const bonus = Math.round(sponsor.podiumBonus * modifier)
      if (bonus > 0) {
        transactions.push(createTeamTransaction(
          'income',
          'team_sponsor',
          bonus,
          `${sponsor.sponsorName} podium bonus`,
          week,
          year,
          { sponsorId: sponsor.id, raceWeek: week }
        ))
      }
      updated.seasonPodiums = (updated.seasonPodiums || 0) + 1
    }
    
    // Update satisfaction based on result
    const satisfactionChange = calculateRaceSatisfactionChange(position)
    updated.satisfaction = Math.max(0, Math.min(100, updated.satisfaction + satisfactionChange))
    
    // Update target progress
    updated.targets = updateSponsorTargetProgress(updated.targets, {
      wins: updated.seasonWins,
      podiums: updated.seasonPodiums,
      races: updated.seasonRaces
    })
    
    return updated
  })
  
  return { transactions, updatedSponsors }
}

function calculateRaceSatisfactionChange(position: number): number {
  if (position === 1) return 5      // Win
  if (position <= 3) return 3       // Podium
  if (position <= 10) return 1      // Points
  if (position <= 15) return 0      // Midfield
  return -1                          // Poor result
}

function updateSponsorTargetProgress(
  targets: TeamSponsorTarget[],
  stats: { wins: number; podiums: number; races: number }
): TeamSponsorTarget[] {
  return targets.map(target => {
    const updated = { ...target }
    
    switch (target.type) {
      case 'total_wins':
        updated.currentValue = stats.wins
        break
      case 'total_podiums':
        updated.currentValue = stats.podiums
        break
      case 'races_entered':
        updated.currentValue = stats.races
        break
      // championship_position handled at season end
    }
    
    updated.met = updated.currentValue >= updated.targetValue
    updated.exceeded = updated.currentValue > updated.targetValue * 1.2
    
    return updated
  })
}

/**
 * Process manufacturer payments (annual, paid in installments)
 */
export function processManufacturerPayment(
  _team: OwnedTeam,
  seriesEntry: TeamSeriesEntry,
  tier: TeamTier,
  week: number,
  year: number
): TeamTransaction | null {
  // Pay/receive quarterly (weeks 1, 13, 26, 39)
  if (![1, 13, 26, 39].includes(week)) return null
  
  const annualAmount = getManufacturerPayment(tier, seriesEntry.worksCustomer)
  const quarterlyAmount = Math.round(annualAmount / 4)
  
  if (quarterlyAmount === 0) return null
  
  if (quarterlyAmount > 0) {
    // Works team receives support
    return createTeamTransaction(
      'income',
      'manufacturer_support',
      quarterlyAmount,
      `${seriesEntry.manufacturerId || 'Manufacturer'} quarterly support payment`,
      week,
      year,
      { seriesId: seriesEntry.seriesId }
    )
  } else {
    // Customer team pays lease
    return createTeamTransaction(
      'expense',
      'manufacturer_lease',
      Math.abs(quarterlyAmount),
      `${seriesEntry.manufacturerId || 'Manufacturer'} quarterly lease payment`,
      week,
      year,
      { seriesId: seriesEntry.seriesId }
    )
  }
}

// ============================================
// DRIVER SALARY PROCESSING
// ============================================

export interface DriverSalaryResult {
  baseSalary: number
  winBonus: number
  podiumBonus: number
  total: number
  transaction: TeamTransaction
}

/**
 * Process hired driver salary after a race
 * Creates proper transaction record and calculates bonuses
 */
export function processHiredDriverSalary(
  driverName: string,
  contract: {
    salary: number
    bonusPerWin: number
    bonusPerPodium: number
  },
  driverPosition: number,
  driverDnf: boolean,
  seriesName: string,
  trackName: string,
  week: number,
  year: number
): DriverSalaryResult {
  let total = contract.salary
  let winBonus = 0
  let podiumBonus = 0
  
  // Calculate bonuses based on actual driver result
  const isWin = driverPosition === 1 && !driverDnf
  const isPodium = driverPosition <= 3 && !driverDnf
  
  if (isWin && contract.bonusPerWin > 0) {
    winBonus = contract.bonusPerWin
    total += winBonus
  } else if (isPodium && contract.bonusPerPodium > 0) {
    podiumBonus = contract.bonusPerPodium
    total += podiumBonus
  }
  
  // Build description
  let description = `${driverName} race fee - ${seriesName} at ${trackName}`
  if (winBonus > 0) {
    description += ` (+ WIN bonus)`
  } else if (podiumBonus > 0) {
    description += ` (+ P${driverPosition} bonus)`
  }
  
  const transaction = createTeamTransaction(
    'expense',
    'other',  // Using 'other' as there's no 'driver_salary' category
    total,
    description,
    week,
    year,
    { raceWeek: week, countsTowardCostCap: true }
  )
  
  return {
    baseSalary: contract.salary,
    winBonus,
    podiumBonus,
    total,
    transaction
  }
}

// ============================================
// SERIES REVENUE PROCESSING
// ============================================

/**
 * Process series revenue (TV/participation money)
 * Distribution type varies by tier:
 * - Per-race: Paid after each race weekend
 * - Quarterly: Paid weeks 1, 13, 26, 39
 */
export function processSeriesRevenue(
  _team: OwnedTeam,
  seriesEntry: TeamSeriesEntry,
  tier: TeamTier,
  week: number,
  year: number,
  isRaceWeek: boolean = false,
  totalRacesInSeason: number = 12
): TeamTransaction | null {
  const config = SERIES_REVENUE_BY_TIER[tier]
  
  if (config.annualRevenue <= 0) return null
  
  if (config.distributionType === 'per-race') {
    // Per-race distribution: only pay on race weeks
    if (!isRaceWeek) return null
    
    const perRaceAmount = Math.round(config.annualRevenue / totalRacesInSeason)
    if (perRaceAmount <= 0) return null
    
    return createTeamTransaction(
      'income',
      'series_revenue',
      perRaceAmount,
      `${seriesEntry.seriesName} TV/participation revenue`,
      week,
      year,
      { seriesId: seriesEntry.seriesId, raceWeek: week, countsTowardCostCap: false }
    )
  } else {
    // Quarterly distribution: pay weeks 1, 13, 26, 39
    if (![1, 13, 26, 39].includes(week)) return null
    
    const quarterlyAmount = Math.round(config.annualRevenue / 4)
    if (quarterlyAmount <= 0) return null
    
    const quarterNames = { 1: 'Q1', 13: 'Q2', 26: 'Q3', 39: 'Q4' }
    
    return createTeamTransaction(
      'income',
      'series_revenue',
      quarterlyAmount,
      `${seriesEntry.seriesName} ${quarterNames[week as keyof typeof quarterNames]} participation payment`,
      week,
      year,
      { seriesId: seriesEntry.seriesId, countsTowardCostCap: false }
    )
  }
}

// ============================================
// CAR MAINTENANCE PROCESSING
// ============================================

/**
 * Process weekly car maintenance costs
 * Base maintenance + additional costs on race weeks
 */
export function processWeeklyCarMaintenance(
  team: OwnedTeam,
  tier: TeamTier,
  week: number,
  year: number,
  isRaceWeek: boolean = false
): TeamTransaction | null {
  const carCount = (team as { cars?: unknown[] }).cars?.length || 1
  const maintenanceCost = calculateWeeklyMaintenanceCost(tier, carCount, isRaceWeek)
  
  if (maintenanceCost <= 0) return null
  
  const description = isRaceWeek
    ? `Car maintenance & post-race service (${carCount} car${carCount > 1 ? 's' : ''})`
    : `Weekly car maintenance (${carCount} car${carCount > 1 ? 's' : ''})`
  
  return createTeamTransaction(
    'expense',
    'development',  // Using development category for maintenance
    maintenanceCost,
    description,
    week,
    year,
    { countsTowardCostCap: true }
  )
}

/**
 * Process repair costs after incidents
 */
export function processCarRepair(
  _team: OwnedTeam,
  tier: TeamTier,
  damageType: 'minor' | 'major' | 'engine' | 'gearbox',
  carId: string,
  week: number,
  year: number
): TeamTransaction {
  const config = MAINTENANCE_COSTS_BY_TIER[tier]
  
  let repairCost: number
  let description: string
  
  switch (damageType) {
    case 'minor':
      repairCost = config.minorRepair
      description = `Minor repair - Car #${carId}`
      break
    case 'major':
      repairCost = config.majorRepair
      description = `Major repair - Car #${carId}`
      break
    case 'engine':
      repairCost = config.engineRebuild
      description = `Engine rebuild - Car #${carId}`
      break
    case 'gearbox':
      repairCost = config.gearboxRebuild
      description = `Gearbox rebuild - Car #${carId}`
      break
  }
  
  return createTeamTransaction(
    'expense',
    'development',
    repairCost,
    description,
    week,
    year,
    { countsTowardCostCap: true }
  )
}

// ============================================
// SEASON END INCOME PROCESSING
// ============================================

/**
 * Process championship prize money at season end
 * Called once per series at the end of the season
 */
export function processChampionshipPrize(
  _team: OwnedTeam,
  championshipPosition: number,
  tier: TeamTier,
  seriesId: string,
  seriesName: string,
  week: number,
  year: number
): TeamTransaction | null {
  const prizeMoney = calculateSeasonPrizeMoney(championshipPosition, tier)
  
  if (prizeMoney <= 0) return null
  
  let description = `${seriesName} championship - `
  if (championshipPosition === 1) description += 'Champions!'
  else if (championshipPosition === 2) description += 'Runner-up'
  else if (championshipPosition === 3) description += '3rd Place'
  else if (championshipPosition <= 5) description += `P${championshipPosition} (Top 5)`
  else if (championshipPosition <= 10) description += `P${championshipPosition} (Top 10)`
  else description += `P${championshipPosition}`
  
  return createTeamTransaction(
    'income',
    'prize_championship',
    prizeMoney,
    description,
    week,
    year,
    { seriesId, countsTowardCostCap: false }
  )
}

/**
 * Process sponsor championship bonuses at season end
 * Pays out championshipBonus if team achieved sponsor's championship position target
 */
export function processTeamSponsorChampionshipBonuses(
  team: OwnedTeam,
  championshipPosition: number,
  week: number,
  year: number
): { transactions: TeamTransaction[]; updatedSponsors: TeamSponsorDeal[] } {
  const transactions: TeamTransaction[] = []
  const sponsors = team.finances?.sponsors || []
  
  const updatedSponsors = sponsors.map(sponsor => {
    if (!sponsor.active) return sponsor
    
    const updated = { ...sponsor }
    
    // Check championship position target
    const champTarget = sponsor.targets?.find(t => t.type === 'championship_position')
    const targetPosition = champTarget?.targetValue
    
    // Championship bonus if we met or beat the target
    if (targetPosition && championshipPosition <= targetPosition && sponsor.championshipBonus > 0) {
      const modifier = getSponsorPaymentModifier(sponsor.satisfaction)
      const bonus = Math.round(sponsor.championshipBonus * modifier)
      
      if (bonus > 0) {
        let description = `${sponsor.sponsorName} championship bonus`
        if (championshipPosition === 1) {
          description += ' - Title Winners!'
        } else if (championshipPosition < targetPosition) {
          description += ` - Beat target (P${championshipPosition} vs target P${targetPosition})`
        }
        
        transactions.push(createTeamTransaction(
          'income',
          'team_sponsor',
          bonus,
          description,
          week,
          year,
          { sponsorId: sponsor.id, countsTowardCostCap: false }
        ))
      }
      
      // Significant satisfaction boost for meeting championship target
      const satBoost = championshipPosition === 1 ? 15 : championshipPosition < targetPosition ? 10 : 5
      updated.satisfaction = Math.min(100, updated.satisfaction + satBoost)
    } else if (targetPosition && championshipPosition > targetPosition) {
      // Missed championship target - satisfaction penalty
      const satPenalty = Math.min(15, (championshipPosition - targetPosition) * 3)
      updated.satisfaction = Math.max(0, updated.satisfaction - satPenalty)
    }
    
    // Update championship position in targets
    updated.targets = (updated.targets || []).map(target => {
      if (target.type === 'championship_position') {
        return {
          ...target,
          currentValue: championshipPosition,
          met: championshipPosition <= target.targetValue,
          exceeded: championshipPosition < target.targetValue
        }
      }
      return target
    })
    
    return updated
  })
  
  return { transactions, updatedSponsors }
}

/**
 * Process end-of-season sponsor contract expirations and renewals
 */
export function processSeasonEndSponsorContracts(
  team: OwnedTeam,
  currentYear: number
): { 
  expiredSponsors: TeamSponsorDeal[]
  continuingSponsors: TeamSponsorDeal[]
  renewalCandidates: TeamSponsorDeal[]
} {
  const sponsors = team.finances?.sponsors || []
  
  const expiredSponsors: TeamSponsorDeal[] = []
  const continuingSponsors: TeamSponsorDeal[] = []
  const renewalCandidates: TeamSponsorDeal[] = []
  
  sponsors.forEach(sponsor => {
    if (!sponsor.active) {
      // Already terminated
      return
    }
    
    const contractEndYear = sponsor.startYear + sponsor.duration
    
    if (currentYear >= contractEndYear) {
      // Contract expired
      expiredSponsors.push(sponsor)
      
      // High satisfaction = renewal candidate
      if (sponsor.satisfaction >= 50) {
        renewalCandidates.push(sponsor)
      }
    } else {
      // Contract continues
      continuingSponsors.push({
        ...sponsor,
        // Reset season stats for new season
        seasonWins: 0,
        seasonPodiums: 0,
        seasonRaces: 0
      })
    }
  })
  
  return { expiredSponsors, continuingSponsors, renewalCandidates }
}

export interface SponsorRenewalOffer {
  sponsorId: string
  sponsorName: string
  currentDeal: TeamSponsorDeal
  // New terms
  newMonthlyPayment: number
  newWinBonus: number
  newPodiumBonus: number
  newChampionshipBonus: number
  newDuration: number
  // Comparison
  paymentChange: number          // % change from current
  performanceExpectationChange: 'higher' | 'same' | 'lower'
  expiresWeek: number            // Week when offer expires
}

/**
 * Generate renewal offers for expiring sponsor contracts
 * Better performance = better renewal terms
 */
export function generateSponsorRenewalOffers(
  _team: OwnedTeam,
  renewalCandidates: TeamSponsorDeal[],
  _teamReputation: number,
  championshipPosition: number,
  currentWeek: number,
  _currentYear: number
): SponsorRenewalOffer[] {
  const offers: SponsorRenewalOffer[] = []
  
  renewalCandidates.forEach(sponsor => {
    // Calculate performance factor based on satisfaction and results
    const satisfactionFactor = sponsor.satisfaction / 100  // 0.0 to 1.0
    
    // Championship performance factor (1st = 1.3, 2nd = 1.2, 3rd = 1.1, etc)
    const champFactor = championshipPosition === 1 ? 1.3 :
                        championshipPosition === 2 ? 1.2 :
                        championshipPosition === 3 ? 1.1 :
                        championshipPosition <= 5 ? 1.05 :
                        championshipPosition <= 10 ? 1.0 :
                        0.9
    
    // Target completion factor
    const targetsMet = (sponsor.targets || []).filter(t => t.met).length
    const totalTargets = (sponsor.targets || []).length || 1
    const targetFactor = 1 + ((targetsMet / totalTargets) * 0.2)  // Up to 20% bonus
    
    // Combined performance multiplier
    const performanceMultiplier = satisfactionFactor * champFactor * targetFactor
    
    // Calculate new payment (can go up or down based on performance)
    // Base: maintain current if meeting expectations, up to 30% increase for great performance
    const paymentMultiplier = 0.85 + (performanceMultiplier * 0.45)  // 0.85 to 1.30
    const newMonthlyPayment = Math.round(sponsor.monthlyPayment * paymentMultiplier / 100) * 100
    
    // Bonuses scale similarly
    const newWinBonus = Math.round(sponsor.winBonus * paymentMultiplier / 100) * 100
    const newPodiumBonus = Math.round(sponsor.podiumBonus * paymentMultiplier / 100) * 100
    const newChampionshipBonus = Math.round((sponsor.championshipBonus || 0) * paymentMultiplier / 100) * 100
    
    // Duration offer (better performance = longer offers available)
    const newDuration = performanceMultiplier >= 1.1 ? 3 :
                        performanceMultiplier >= 0.9 ? 2 :
                        1
    
    // Calculate payment change percentage
    const paymentChange = Math.round(((newMonthlyPayment - sponsor.monthlyPayment) / sponsor.monthlyPayment) * 100)
    
    // Performance expectations for renewal
    const performanceExpectationChange: 'higher' | 'same' | 'lower' = 
      paymentChange > 10 ? 'higher' :
      paymentChange < -10 ? 'lower' :
      'same'
    
    offers.push({
      sponsorId: sponsor.id,
      sponsorName: sponsor.sponsorName,
      currentDeal: sponsor,
      newMonthlyPayment,
      newWinBonus,
      newPodiumBonus,
      newChampionshipBonus,
      newDuration,
      paymentChange,
      performanceExpectationChange,
      expiresWeek: currentWeek + 4  // 4 weeks to respond
    })
  })
  
  return offers
}

/**
 * Accept a sponsor renewal offer
 */
export function acceptSponsorRenewal(
  currentDeal: TeamSponsorDeal,
  offer: SponsorRenewalOffer,
  currentYear: number
): TeamSponsorDeal {
  return {
    ...currentDeal,
    // Update payment terms
    monthlyPayment: offer.newMonthlyPayment,
    winBonus: offer.newWinBonus,
    podiumBonus: offer.newPodiumBonus,
    championshipBonus: offer.newChampionshipBonus,
    // Reset contract period
    startYear: currentYear,
    duration: offer.newDuration,
    // Reset stats for new contract period
    seasonWins: 0,
    seasonPodiums: 0,
    seasonRaces: 0,
    // Mark as active
    active: true,
    // Boost satisfaction for renewal commitment
    satisfaction: Math.min(100, currentDeal.satisfaction + 10)
  }
}

/**
 * Decline sponsor renewal - sponsor leaves
 */
export function declineSponsorRenewal(
  deal: TeamSponsorDeal
): TeamSponsorDeal {
  return {
    ...deal,
    active: false
  }
}

/**
 * Generate email content for sponsor renewal offer
 */
export function generateRenewalEmailContent(
  offer: SponsorRenewalOffer
): { subject: string; body: string } {
  const changeDescription = offer.paymentChange > 0 
    ? `increased by ${offer.paymentChange}%`
    : offer.paymentChange < 0
    ? `adjusted by ${offer.paymentChange}%`
    : 'maintained at current levels'
  
  const subject = `Contract Renewal Offer - ${offer.sponsorName}`
  
  const body = `Dear Team Principal,

${offer.sponsorName} has been pleased with our partnership and would like to discuss renewing our sponsorship agreement.

Based on your team's performance this season, we're prepared to offer the following terms:

**Proposed Contract:**
- Monthly Payment: $${offer.newMonthlyPayment.toLocaleString()} (${changeDescription})
- Win Bonus: $${offer.newWinBonus.toLocaleString()}
- Podium Bonus: $${offer.newPodiumBonus.toLocaleString()}
${offer.newChampionshipBonus > 0 ? `- Championship Bonus: $${offer.newChampionshipBonus.toLocaleString()}` : ''}
- Duration: ${offer.newDuration} year${offer.newDuration > 1 ? 's' : ''}

${offer.performanceExpectationChange === 'higher' 
  ? 'With the improved terms, we expect continued strong performance and increased visibility.'
  : offer.performanceExpectationChange === 'lower'
  ? 'We remain committed to our partnership despite recent challenges.'
  : 'We look forward to continuing our successful collaboration.'}

Please respond within 4 weeks if you wish to accept this offer.

Best regards,
${offer.sponsorName} Partnerships Team`

  return { subject, body }
}

// ============================================
// EXPENSE PROCESSING
// ============================================

/**
 * Process weekly facility/operational costs
 * Now uses dynamic facility levels for accurate cost calculation
 */
export function processWeeklyFacilityCosts(
  team: OwnedTeam,
  tier: TeamTier,
  week: number,
  year: number
): TeamTransaction {
  // Check if team has facility levels defined
  if (team.facilities) {
    // Calculate dynamic costs based on actual facility levels
    const facilityLevels: Record<FacilityType, number> = {
      aero: team.facilities.aero?.level || 1,
      chassis: team.facilities.chassis?.level || 1,
      engine: team.facilities.engine?.level || 1,
      sim: team.facilities.sim?.level || 1,
      manufacturing: team.facilities.manufacturing?.level || 1,
      marketing: team.facilities.marketing?.level || 1
    }
    
    let dynamicCost = calculateTotalFacilityCosts(tier, facilityLevels)
    
    // Add +20% surcharge for facilities with upgrades in progress
    let upgradeCount = 0
    for (const type of FACILITY_TYPES) {
      const facility = team.facilities[type]
      if (facility?.upgradeInProgress) {
        const baseCost = calculateFacilityWeeklyCost(tier, facility.level)
        dynamicCost += Math.round(baseCost * 0.2)
        upgradeCount++
      }
    }
    
    // Build description showing each facility's cost
    const costBreakdown = FACILITY_TYPES.map(type => {
      const level = facilityLevels[type]
      const cost = calculateFacilityWeeklyCost(tier, level)
      const upgrading = team.facilities![type]?.upgradeInProgress ? ' [upgrading +20%]' : ''
      return `${FACILITY_NAMES[type]} L${level}: $${cost.toLocaleString()}${upgrading}`
    }).join(', ')
    
    return createTeamTransaction(
      'expense',
      'facilities',
      dynamicCost,
      `Weekly facility operations${upgradeCount > 0 ? ` (${upgradeCount} upgrading)` : ''} (${costBreakdown})`,
      week,
      year
    )
  }
  
  // Fallback to static config if no facilities defined
  const config = FACILITY_COSTS_BY_TIER[tier]
  
  return createTeamTransaction(
    'expense',
    'facilities',
    config.weeklyOperationalCost,
    'Weekly facility operations',
    week,
    year
  )
}

/**
 * Process weekly R&D/development costs
 */
export function processWeeklyDevelopmentCosts(
  _team: OwnedTeam,
  tier: TeamTier,
  developmentFocusMultiplier: number,  // 0.5 - 2.0 based on focus level
  week: number,
  year: number
): TeamTransaction {
  const config = DEVELOPMENT_COSTS_BY_TIER[tier]
  const cost = Math.round(config.weeklyRDBurnRate * developmentFocusMultiplier)
  
  return createTeamTransaction(
    'expense',
    'development',
    cost,
    `R&D and development (${Math.round(developmentFocusMultiplier * 100)}% intensity)`,
    week,
    year
  )
}

// ============================================
// FACILITY UPGRADE TRANSACTIONS
// ============================================

/**
 * Create a facility upgrade transaction
 * This is called when starting a facility upgrade
 */
export function processFacilityUpgradeStart(
  facilityType: FacilityType,
  currentLevel: number,
  tier: TeamTier,
  week: number,
  year: number
): TeamTransaction {
  const upgradeCost = calculateUpgradeCost(tier, currentLevel)
  const upgradeDuration = calculateUpgradeDuration(tier, currentLevel)
  const facilityName = FACILITY_NAMES[facilityType]
  const nextLevel = currentLevel + 1
  
  return createTeamTransaction(
    'expense',
    'facilities', // Using facilities category for upgrades
    upgradeCost,
    `${facilityName} upgrade: Level ${currentLevel} ΓåÆ ${nextLevel} (${upgradeDuration} weeks)`,
    week,
    year
  )
}

/**
 * Check if team can afford a facility upgrade
 */
export function canAffordFacilityUpgrade(
  team: OwnedTeam,
  _facilityType: FacilityType,
  currentLevel: number,
  tier: TeamTier
): { canAfford: boolean; cost: number; shortfall: number } {
  const cost = calculateUpgradeCost(tier, currentLevel)
  const cash = team.budgets?.cash || 0
  const canAfford = cash >= cost
  
  return {
    canAfford,
    cost,
    shortfall: canAfford ? 0 : cost - cash
  }
}

/**
 * Get detailed facility upgrade info for UI
 */
export function getFacilityUpgradeInfo(
  team: OwnedTeam,
  facilityType: FacilityType,
  currentLevel: number,
  tier: TeamTier,
  teamReputation: number
): {
  canUpgrade: boolean
  canAfford: boolean
  cost: number
  duration: number
  currentLevelConfig: ReturnType<typeof getFacilityLevelConfig>
  nextLevelConfig: ReturnType<typeof getFacilityLevelConfig> | null
  currentWeeklyCost: number
  nextWeeklyCost: number
  requirementError?: string
} {
  const currentLevelConfig = getFacilityLevelConfig(currentLevel)
  const nextLevelConfig = currentLevel < 5 ? getFacilityLevelConfig(currentLevel + 1) : null
  
  // Check upgrade requirements
  const facilityLevels: Record<FacilityType, number> = {
    aero: team.facilities?.aero?.level || 1,
    chassis: team.facilities?.chassis?.level || 1,
    engine: team.facilities?.engine?.level || 1,
    sim: team.facilities?.sim?.level || 1,
    manufacturing: team.facilities?.manufacturing?.level || 1,
    marketing: team.facilities?.marketing?.level || 1
  }
  
  const upgradeCheck = canUpgradeFacility(
    facilityType,
    currentLevel,
    teamReputation,
    tier,
    facilityLevels
  )
  
  // Check affordability
  const affordabilityCheck = canAffordFacilityUpgrade(team, facilityType, currentLevel, tier)
  
  return {
    canUpgrade: upgradeCheck.allowed && affordabilityCheck.canAfford,
    canAfford: affordabilityCheck.canAfford,
    cost: affordabilityCheck.cost,
    duration: calculateUpgradeDuration(tier, currentLevel),
    currentLevelConfig,
    nextLevelConfig,
    currentWeeklyCost: calculateFacilityWeeklyCost(tier, currentLevel),
    nextWeeklyCost: nextLevelConfig ? calculateFacilityWeeklyCost(tier, currentLevel + 1) : 0,
    requirementError: upgradeCheck.reason
  }
}

/**
 * Calculate total weekly facility costs for projection purposes
 */
export function calculateDynamicFacilityCosts(
  team: OwnedTeam,
  tier: TeamTier
): number {
  if (!team.facilities) {
    // Fallback to static config
    return FACILITY_COSTS_BY_TIER[tier].weeklyOperationalCost
  }
  
  const facilityLevels: Record<FacilityType, number> = {
    aero: team.facilities.aero?.level || 1,
    chassis: team.facilities.chassis?.level || 1,
    engine: team.facilities.engine?.level || 1,
    sim: team.facilities.sim?.level || 1,
    manufacturing: team.facilities.manufacturing?.level || 1,
    marketing: team.facilities.marketing?.level || 1
  }
  
  return calculateTotalFacilityCosts(tier, facilityLevels)
}

/**
 * Calculate travel costs for a race
 */
export function calculateRaceTravelCosts(
  team: OwnedTeam,
  seriesEntry: TeamSeriesEntry,
  tier: TeamTier
): number {
  const country = COUNTRIES[team.baseCountry]
  if (!country) {
    // Fallback if country not found
    return FACILITY_COSTS_BY_TIER[tier].weeklyOperationalCost * 0.5
  }
  
  // Find matching series in our travel data
  const seriesData = EXAMPLE_SERIES.find(s => 
    s.id === seriesEntry.seriesId || 
    s.name.toLowerCase().includes(seriesEntry.seriesName.toLowerCase())
  )
  
  if (seriesData) {
    const estimate = calculateTravelCostEstimate(team.baseCountry, seriesData)
    // Return per-race cost
    return Math.round((estimate.annualTravelCost + estimate.annualFreightCost) / seriesData.racesPerSeason)
  }
  
  // Fallback: tier-based estimate
  return FACILITY_COSTS_BY_TIER[tier].weeklyOperationalCost * 0.3
}

/**
 * Process travel costs for a race week
 */
export function processRaceTravelCosts(
  team: OwnedTeam,
  seriesEntry: TeamSeriesEntry,
  tier: TeamTier,
  week: number,
  year: number
): TeamTransaction {
  const cost = calculateRaceTravelCosts(team, seriesEntry, tier)
  
  return createTeamTransaction(
    'expense',
    'travel',
    cost,
    `${seriesEntry.seriesName} race travel & logistics`,
    week,
    year,
    { seriesId: seriesEntry.seriesId, raceWeek: week }
  )
}

/**
 * Process series entry fee (one-time at season start)
 */
export function processSeriesEntryFee(
  seriesEntry: TeamSeriesEntry,
  week: number,
  year: number
): TeamTransaction {
  return createTeamTransaction(
    'expense',
    'entry_fee',
    seriesEntry.entryFee,
    `${seriesEntry.seriesName} season entry fee`,
    week,
    year,
    { seriesId: seriesEntry.seriesId, countsTowardCostCap: false }
  )
}

// ============================================
// COST CAP TRACKING
// ============================================

export interface CostCapStatus {
  hasCostCap: boolean
  capAmount: number
  currentSpending: number
  remainingBudget: number
  percentUsed: number
  status: 'healthy' | 'warning' | 'critical' | 'exceeded'
  weeksRemaining: number  // Estimated weeks of budget at current rate
}

export function calculateCostCapStatus(
  team: OwnedTeam,
  tier: TeamTier,
  currentWeek: number
): CostCapStatus {
  const config = COST_CAP_BY_TIER[tier]
  
  if (!config.hasCostCap || !config.capAmount) {
    return {
      hasCostCap: false,
      capAmount: 0,
      currentSpending: 0,
      remainingBudget: Infinity,
      percentUsed: 0,
      status: 'healthy',
      weeksRemaining: Infinity
    }
  }
  
  const capAmount = config.capAmount
  const currentSpending = team.budgets?.costCapSpending || 0
  const remainingBudget = capAmount - currentSpending
  const percentUsed = (currentSpending / capAmount) * 100
  
  // Calculate status
  let status: CostCapStatus['status'] = 'healthy'
  if (percentUsed >= 100) status = 'exceeded'
  else if (percentUsed >= 95) status = 'critical'
  else if (percentUsed >= 80) status = 'warning'
  
  // Estimate weeks remaining
  const weeksElapsed = currentWeek
  const weeklyBurnRate = weeksElapsed > 0 ? currentSpending / weeksElapsed : 0
  const weeksRemaining = weeklyBurnRate > 0 
    ? Math.floor(remainingBudget / weeklyBurnRate)
    : Infinity
  
  return {
    hasCostCap: true,
    capAmount,
    currentSpending,
    remainingBudget: Math.max(0, remainingBudget),
    percentUsed,
    status,
    weeksRemaining
  }
}

// ============================================
// BUDGET HELPERS
// ============================================

export function updateTeamBudgets(
  currentBudgets: TeamBudgets,
  transaction: TeamTransaction
): TeamBudgets {
  const updated = { ...currentBudgets }
  
  // Initialize overspends tracking if not present
  if (!updated.budgetOverspends) {
    updated.budgetOverspends = {
      development: 0,
      marketing: 0,
      travel: 0,
      contingency: 0,
      operations: 0
    }
  }
  
  if (transaction.type === 'income') {
    // Income always goes to general cash
    updated.cash += transaction.amount
    updated.yearToDateIncome = (updated.yearToDateIncome || 0) + transaction.amount
  } else {
    // For expenses, determine which budget category to deduct from
    // Map transaction category to budget category
    const categoryBudgetMap: Record<string, keyof typeof updated> = {
      'development': 'developmentBudget',
      'marketing': 'marketingBudget',
      'travel': 'travelBudget',
      'car_maintenance': 'contingencyBudget',
      'repairs': 'contingencyBudget',
      // Operations/facilities go to general cash
      'facilities': 'cash',
      'salaries': 'cash',
      'other': 'cash',
      // Sponsor-related expenses to marketing
      'sponsor_bonus': 'marketingBudget',
      'sponsor_event': 'marketingBudget'
    }
    
    const budgetField = categoryBudgetMap[transaction.category] || 'cash'
    const currentBudgetValue = (updated[budgetField] as number) || 0
    const newBudgetValue = currentBudgetValue - transaction.amount
    
    // Update the appropriate budget
    ;(updated[budgetField] as number) = newBudgetValue
    
    // Track overspending if category budget goes negative (not for cash)
    if (budgetField !== 'cash' && newBudgetValue < 0) {
      const overspendCategory = budgetField.replace('Budget', '') as keyof typeof updated.budgetOverspends
      if (overspendCategory in updated.budgetOverspends) {
        updated.budgetOverspends[overspendCategory] = Math.max(
          updated.budgetOverspends[overspendCategory],
          Math.abs(newBudgetValue)
        )
      }
    }
    
    // Always track in YTD expenses
    updated.yearToDateExpenses = (updated.yearToDateExpenses || 0) + transaction.amount
    
    if (transaction.countsTowardCostCap) {
      updated.costCapSpending = (updated.costCapSpending || 0) + transaction.amount
    }
  }
  
  return updated
}

export function processMultipleTransactions(
  currentBudgets: TeamBudgets,
  transactions: TeamTransaction[]
): TeamBudgets {
  return transactions.reduce(
    (budgets, tx) => updateTeamBudgets(budgets, tx),
    currentBudgets
  )
}

// ============================================
// RUNWAY CALCULATION
// ============================================

export interface RunwayStatus {
  currentCash: number
  weeklyBurnRate: number
  weeklyIncomeEstimate: number
  netWeeklyChange: number
  runwayWeeks: number
  status: 'healthy' | 'stable' | 'caution' | 'critical' | 'emergency'
}

export function calculateTeamRunway(
  team: OwnedTeam,
  tier: TeamTier,
  _weeksElapsed: number
): RunwayStatus {
  // Use dynamic facility costs if available, otherwise fall back to static config
  const weeklyFacilityCost = calculateDynamicFacilityCosts(team, tier)
  const devConfig = DEVELOPMENT_COSTS_BY_TIER[tier]
  
  // Calculate facility staff weekly salaries
  const facilityStaffCost = (team.facilityStaff || []).reduce(
    (sum, staff) => sum + (staff.salary || 0),
    0
  )
  
  // Calculate race-going staff weekly salaries (monthly / 4)
  const raceStaffCost = (team.staff || []).reduce(
    (sum, staff) => sum + Math.round((staff.contract?.salary || 0) / 4),
    0
  )
  
  // Weekly burn rate (facilities + R&D + staff salaries)
  const weeklyBurnRate = weeklyFacilityCost + devConfig.weeklyRDBurnRate + facilityStaffCost + raceStaffCost
  
  // Estimate weekly income from sponsors (handle undefined finances/sponsors)
  const sponsors = team.finances?.sponsors || []
  const activeSponsors = sponsors.filter(s => s.active)
  const weeklyIncomeEstimate = activeSponsors.reduce(
    (sum, s) => sum + Math.round(s.monthlyPayment / 4),
    0
  )
  
  const netWeeklyChange = weeklyIncomeEstimate - weeklyBurnRate
  const currentCash = team.budgets?.cash || 0
  
  // Calculate runway
  let runwayWeeks: number
  if (netWeeklyChange >= 0) {
    runwayWeeks = Infinity  // Income exceeds expenses
  } else {
    runwayWeeks = Math.floor(currentCash / Math.abs(netWeeklyChange))
  }
  
  // Determine status
  let status: RunwayStatus['status']
  if (runwayWeeks === Infinity || runwayWeeks >= 26) status = 'healthy'
  else if (runwayWeeks >= 12) status = 'stable'
  else if (runwayWeeks >= 6) status = 'caution'
  else if (runwayWeeks >= 2) status = 'critical'
  else status = 'emergency'
  
  return {
    currentCash,
    weeklyBurnRate,
    weeklyIncomeEstimate,
    netWeeklyChange,
    runwayWeeks,
    status
  }
}

// ============================================
// FINANCIAL SUMMARY
// ============================================

export function generateMonthlySummary(
  transactions: TeamTransaction[],
  month: number,
  year: number
): {
  month: number
  year: number
  totalIncome: number
  totalExpenses: number
  incomeByCategory: Record<string, number>
  expensesByCategory: Record<string, number>
} {
  // Filter transactions for this month (approximate: month = week / 4.33)
  const monthTransactions = transactions.filter(tx => {
    const txMonth = Math.floor(tx.week / 4.33)
    return tx.year === year && txMonth === month
  })
  
  const incomeByCategory: Record<string, number> = {}
  const expensesByCategory: Record<string, number> = {}
  let totalIncome = 0
  let totalExpenses = 0
  
  for (const tx of monthTransactions) {
    if (tx.type === 'income') {
      totalIncome += tx.amount
      incomeByCategory[tx.category] = (incomeByCategory[tx.category] || 0) + tx.amount
    } else {
      totalExpenses += tx.amount
      expensesByCategory[tx.category] = (expensesByCategory[tx.category] || 0) + tx.amount
    }
  }
  
  return {
    month,
    year,
    totalIncome,
    totalExpenses,
    incomeByCategory,
    expensesByCategory
  }
}

// ============================================
// INITIAL STATE HELPERS
// ============================================

export function createDefaultTeamBudgets(startingCash: number): TeamBudgets {
  return {
    cash: startingCash,
    capex: 0,
    opex: 0,
    costCapApplied: undefined,
    developmentBudget: Math.round(startingCash * 0.2),   // 20% for R&D
    travelBudget: Math.round(startingCash * 0.1),        // 10% for travel
    marketingBudget: Math.round(startingCash * 0.05),    // 5% for marketing
    contingencyBudget: Math.round(startingCash * 0.1),   // 10% emergency
    yearToDateIncome: 0,
    yearToDateExpenses: 0,
    costCapSpending: 0,
    projectedSeasonIncome: 0,
    projectedSeasonExpenses: 0,
    runwayWeeks: 52
  }
}

export function createDefaultTeamFinancialState(): TeamFinancialState {
  return {
    transactions: [],
    sponsors: [],
    pendingSponsorOffers: [],
    activeNegotiations: [],
    monthlySummaries: [],
    extended: createDefaultExtendedFinancialState()
  }
}

// ============================================
// BUDGET ENFORCEMENT
// ============================================

export interface BudgetLimit {
  softLimit: number   // Warning threshold
  hardLimit: number   // Absolute limit (cannot exceed)
}

export interface BudgetValidation {
  isValid: boolean
  exceededSoft: boolean
  exceededHard: boolean
  amountOverSoft: number
  amountOverHard: number
  warning?: string
}

export interface TeamBudgetStatus {
  cash: {
    current: number
    softLimit: number  // Minimum cash threshold for warnings
    status: 'healthy' | 'low' | 'critical' | 'insolvent'
    warning?: string
  }
  costCap: CostCapStatus
  allocations: {
    total: number
    available: number
    isOverAllocated: boolean
    overAllocatedAmount: number
  }
  runway: RunwayStatus
  warnings: string[]
  canSpend: (amount: number) => boolean
}

/**
 * Calculate comprehensive budget status for the team
 */
export function calculateTeamBudgetStatus(
  team: OwnedTeam,
  tier: TeamTier,
  currentWeek: number
): TeamBudgetStatus {
  const budgets = team.budgets
  const cash = budgets?.cash || 0
  const warnings: string[] = []
  
  // Cash status
  const cashSoftLimit = 50000  // Warning below $50k
  const cashStatus = cash < 0 ? 'insolvent' :
                     cash < 10000 ? 'critical' :
                     cash < cashSoftLimit ? 'low' : 'healthy'
  
  const cashWarning = cashStatus === 'insolvent' ? 'Team is insolvent! Immediate action required.' :
                      cashStatus === 'critical' ? 'Cash reserves critically low!' :
                      cashStatus === 'low' ? 'Cash reserves below recommended level' : undefined
  
  if (cashWarning) warnings.push(cashWarning)
  
  // Cost cap status
  const costCapStatus = calculateCostCapStatus(team, tier, currentWeek)
  if (costCapStatus.status === 'exceeded') {
    warnings.push('Cost cap exceeded! Penalties may apply.')
  } else if (costCapStatus.status === 'critical') {
    warnings.push('Cost cap nearly exhausted!')
  } else if (costCapStatus.status === 'warning') {
    warnings.push('Cost cap usage above 80%')
  }
  
  // Allocation status
  const totalAllocated = (budgets?.developmentBudget || 0) +
                         (budgets?.travelBudget || 0) +
                         (budgets?.marketingBudget || 0) +
                         (budgets?.contingencyBudget || 0)
  const isOverAllocated = totalAllocated > cash
  const overAllocatedAmount = Math.max(0, totalAllocated - cash)
  
  if (isOverAllocated) {
    warnings.push(`Budget over-allocated by $${overAllocatedAmount.toLocaleString()}`)
  }
  
  // Runway status
  const runwayStatus = calculateTeamRunway(team, tier, currentWeek)
  if (runwayStatus.status === 'emergency') {
    warnings.push('Financial emergency! Less than 2 weeks runway.')
  } else if (runwayStatus.status === 'critical') {
    warnings.push('Runway critical - less than 6 weeks of funding')
  } else if (runwayStatus.status === 'caution') {
    warnings.push('Runway warning - consider reducing expenses or finding sponsors')
  }
  
  // Check low budget allocations
  if ((budgets?.contingencyBudget || 0) < cash * 0.05 && cash > 50000) {
    warnings.push('Contingency fund below recommended 5%')
  }
  
  if ((budgets?.developmentBudget || 0) < cash * 0.10 && cash > 50000) {
    warnings.push('Development budget below recommended 10%')
  }
  
  return {
    cash: {
      current: cash,
      softLimit: cashSoftLimit,
      status: cashStatus,
      warning: cashWarning
    },
    costCap: costCapStatus,
    allocations: {
      total: totalAllocated,
      available: cash - totalAllocated,
      isOverAllocated,
      overAllocatedAmount
    },
    runway: runwayStatus,
    warnings,
    canSpend: (amount: number) => {
      // Check if we can afford this expense
      if (amount > cash) return false
      // Check if it would cause insolvency
      if (cash - amount < 0) return false
      // Check cost cap
      if (costCapStatus.hasCostCap && 
          costCapStatus.currentSpending + amount > costCapStatus.capAmount) {
        return false
      }
      return true
    }
  }
}

/**
 * Validate a proposed expense against budget limits
 */
export function validateExpense(
  team: OwnedTeam,
  tier: TeamTier,
  amount: number,
  countsTowardCostCap: boolean = true
): BudgetValidation {
  const cash = team.budgets?.cash || 0
  const costCapStatus = calculateCostCapStatus(team, tier, 0)
  
  // Check cash limits
  const cashSoftLimit = 10000  // Warn if spending would leave us with less than $10k
  const cashHardLimit = 0       // Cannot spend more than we have
  
  const remainingAfterSpend = cash - amount
  const exceedsCashSoft = remainingAfterSpend < cashSoftLimit
  const exceedsCashHard = remainingAfterSpend < cashHardLimit
  
  // Check cost cap limits
  let exceedsCostCapSoft = false
  let exceedsCostCapHard = false
  
  if (countsTowardCostCap && costCapStatus.hasCostCap) {
    const newSpending = costCapStatus.currentSpending + amount
    const capAmount = costCapStatus.capAmount
    exceedsCostCapSoft = newSpending > capAmount * 0.95  // 95% soft limit
    exceedsCostCapHard = newSpending > capAmount         // 100% hard limit
  }
  
  // Determine overall validity
  const exceedsSoft = exceedsCashSoft || exceedsCostCapSoft
  const exceedsHard = exceedsCashHard || exceedsCostCapHard
  
  // Generate warning messages
  let warning: string | undefined
  if (exceedsHard) {
    if (exceedsCashHard) {
      warning = `Insufficient funds. Need $${amount.toLocaleString()}, have $${cash.toLocaleString()}`
    } else if (exceedsCostCapHard) {
      warning = `Would exceed cost cap limit of $${costCapStatus.capAmount.toLocaleString()}`
    }
  } else if (exceedsSoft) {
    if (exceedsCashSoft) {
      warning = `This expense would leave cash reserves below $${cashSoftLimit.toLocaleString()}`
    } else if (exceedsCostCapSoft) {
      warning = 'This expense would put you above 95% of the cost cap'
    }
  }
  
  return {
    isValid: !exceedsHard,
    exceededSoft: exceedsSoft,
    exceededHard: exceedsHard,
    amountOverSoft: exceedsSoft && !exceedsHard ? (exceedsCashSoft ? cashSoftLimit - remainingAfterSpend : 0) : 0,
    amountOverHard: exceedsHard ? (exceedsCashHard ? amount - cash : 0) : 0,
    warning
  }
}

// ============================================
// SPENDING MECHANICS
// ============================================

export interface MarketingSpendResult {
  transaction: TeamTransaction
  sponsorInterestBoost: number  // Percentage boost to sponsor interest
  mediaExposureGain: number     // Media points gained
}

/**
 * Process marketing spend - campaigns to attract sponsors
 * Returns transaction and effects on sponsor attraction
 */
export function processMarketingSpend(
  team: OwnedTeam,
  tier: TeamTier,
  campaignType: 'social_media' | 'pr_campaign' | 'sponsor_event' | 'media_day',
  week: number,
  year: number
): MarketingSpendResult | null {
  const marketingBudget = team.budgets?.marketingBudget || 0
  const cash = team.budgets?.cash || 0
  
  // Campaign costs and effects by type
  const campaignConfig = {
    social_media: { 
      costMultiplier: 0.02,  // 2% of marketing budget
      minCost: 500,
      maxCost: 50000,
      interestBoost: 2,
      mediaGain: 5
    },
    pr_campaign: {
      costMultiplier: 0.10,  // 10% of marketing budget
      minCost: 5000,
      maxCost: 200000,
      interestBoost: 5,
      mediaGain: 15
    },
    sponsor_event: {
      costMultiplier: 0.20,  // 20% of marketing budget
      minCost: 10000,
      maxCost: 500000,
      interestBoost: 10,
      mediaGain: 25
    },
    media_day: {
      costMultiplier: 0.15,  // 15% of marketing budget
      minCost: 8000,
      maxCost: 300000,
      interestBoost: 8,
      mediaGain: 20
    }
  }
  
  const config = campaignConfig[campaignType]
  const baseCost = Math.max(config.minCost, Math.min(config.maxCost, 
    Math.round(marketingBudget * config.costMultiplier)))
  
  // Can't afford it
  if (baseCost > cash) return null
  if (baseCost > marketingBudget) return null
  
  // Scale effects by tier (higher tiers get slightly diminished returns on small spends)
  const tierEffectiveness = {
    entry: 1.5,
    amateur: 1.3,
    'semi-pro': 1.1,
    professional: 1.0,
    pro: 0.9,
    elite: 0.8,
    pinnacle: 0.7
  }[tier]
  
  const campaignNames = {
    social_media: 'Social media campaign',
    pr_campaign: 'PR campaign',
    sponsor_event: 'Sponsor networking event',
    media_day: 'Media day'
  }
  
  return {
    transaction: createTeamTransaction(
      'expense',
      'other',
      baseCost,
      campaignNames[campaignType],
      week,
      year,
      { countsTowardCostCap: false }  // Marketing typically not under cost cap
    ),
    sponsorInterestBoost: Math.round(config.interestBoost * tierEffectiveness),
    mediaExposureGain: Math.round(config.mediaGain * tierEffectiveness)
  }
}

export interface ContingencyWithdrawalResult {
  success: boolean
  amountWithdrawn: number
  reason: string
  newContingencyBalance: number
  newCashBalance: number
}

/**
 * Withdraw from contingency fund to cover cash shortfall
 * Can be triggered automatically or manually
 */
export function withdrawFromContingency(
  team: OwnedTeam,
  requestedAmount: number,
  reason: string = 'Cash shortfall'
): ContingencyWithdrawalResult {
  const contingency = team.budgets?.contingencyBudget || 0
  const cash = team.budgets?.cash || 0
  
  if (contingency <= 0) {
    return {
      success: false,
      amountWithdrawn: 0,
      reason: 'No contingency funds available',
      newContingencyBalance: 0,
      newCashBalance: cash
    }
  }
  
  // Withdraw up to available contingency
  const amountWithdrawn = Math.min(requestedAmount, contingency)
  
  return {
    success: true,
    amountWithdrawn,
    reason,
    newContingencyBalance: contingency - amountWithdrawn,
    newCashBalance: cash + amountWithdrawn
  }
}

/**
 * Auto-contingency: Check if team needs emergency funds
 * Returns withdrawal details if triggered
 */
export function checkAutoContingency(
  team: OwnedTeam,
  _tier: TeamTier,
  weeklyBurnRate: number
): ContingencyWithdrawalResult | null {
  const cash = team.budgets?.cash || 0
  const contingency = team.budgets?.contingencyBudget || 0
  
  // Trigger auto-contingency if cash falls below 2 weeks of expenses
  const emergencyThreshold = weeklyBurnRate * 2
  
  if (cash < emergencyThreshold && contingency > 0) {
    // Withdraw enough to cover 4 weeks of expenses
    const targetCash = weeklyBurnRate * 4
    const shortfall = targetCash - cash
    
    return withdrawFromContingency(
      team,
      shortfall,
      'Emergency auto-withdrawal - cash reserves critically low'
    )
  }
  
  return null
}

/**
 * Validate expense against allocated budget category
 * Returns true if expense fits within allocation, false otherwise
 */
export function validateBudgetAllocation(
  team: OwnedTeam,
  category: 'development' | 'travel' | 'marketing' | 'contingency',
  amount: number
): { isValid: boolean; remaining: number; allocated: number; warning?: string } {
  const budgets = team.budgets || {}
  
  const allocations = {
    development: budgets.developmentBudget || 0,
    travel: budgets.travelBudget || 0,
    marketing: budgets.marketingBudget || 0,
    contingency: budgets.contingencyBudget || 0
  }
  
  const allocated = allocations[category]
  const remaining = allocated - amount
  
  if (amount > allocated) {
    return {
      isValid: false,
      remaining: 0,
      allocated,
      warning: `Expense of $${amount.toLocaleString()} exceeds ${category} budget of $${allocated.toLocaleString()}`
    }
  }
  
  // Warn if this would use most of the budget
  const usagePercent = (amount / allocated) * 100
  let warning: string | undefined
  if (usagePercent > 50 && remaining < 10000) {
    warning = `This would use ${usagePercent.toFixed(0)}% of remaining ${category} budget`
  }
  
  return {
    isValid: true,
    remaining,
    allocated,
    warning
  }
}

/**
 * Process expense with budget enforcement
 * Validates against allocations and returns adjusted transaction
 */
export function processEnforcedExpense(
  team: OwnedTeam,
  tier: TeamTier,
  category: 'development' | 'travel' | 'other',
  amount: number,
  description: string,
  week: number,
  year: number,
  useContingencyIfNeeded: boolean = false
): {
  transaction: TeamTransaction | null
  validation: BudgetValidation
  budgetCheck: { isValid: boolean; warning?: string }
  contingencyUsed: number
} {
  // First check overall expense validity
  const validation = validateExpense(team, tier, amount, true)
  
  // Check budget allocation (map 'other' to a generic check)
  const budgetCategory = category === 'other' ? 'development' : category
  const budgetCheck = validateBudgetAllocation(team, budgetCategory, amount)
  
  let contingencyUsed = 0
  
  // If expense invalid due to cash, try contingency
  if (!validation.isValid && useContingencyIfNeeded) {
    const cashNeeded = amount - (team.budgets?.cash || 0)
    const contingency = team.budgets?.contingencyBudget || 0
    
    if (cashNeeded <= contingency) {
      contingencyUsed = cashNeeded
      // Transaction is now valid with contingency backing
      return {
        transaction: createTeamTransaction(
          'expense',
          category === 'other' ? 'other' : category,
          amount,
          description + ' (contingency used)',
          week,
          year,
          { countsTowardCostCap: true }
        ),
        validation: { ...validation, isValid: true, warning: `$${contingencyUsed.toLocaleString()} withdrawn from contingency` },
        budgetCheck,
        contingencyUsed
      }
    }
  }
  
  if (!validation.isValid) {
    return {
      transaction: null,
      validation,
      budgetCheck,
      contingencyUsed: 0
    }
  }
  
  return {
    transaction: createTeamTransaction(
      'expense',
      category === 'other' ? 'other' : category,
      amount,
      description,
      week,
      year,
      { countsTowardCostCap: true }
    ),
    validation,
    budgetCheck,
    contingencyUsed
  }
}

/**
 * Generate budget warning events for weekly processing
 */
export function generateBudgetWarnings(
  team: OwnedTeam,
  tier: TeamTier,
  currentWeek: number,
  _currentYear: number
): {
  type: 'cash_low' | 'cost_cap_warning' | 'runway_critical' | 'over_allocated'
  severity: 'warning' | 'critical'
  message: string
}[] {
  const warnings: {
    type: 'cash_low' | 'cost_cap_warning' | 'runway_critical' | 'over_allocated'
    severity: 'warning' | 'critical'
    message: string
  }[] = []
  
  const status = calculateTeamBudgetStatus(team, tier, currentWeek)
  
  // Cash warnings
  if (status.cash.status === 'critical' || status.cash.status === 'insolvent') {
    warnings.push({
      type: 'cash_low',
      severity: 'critical',
      message: status.cash.status === 'insolvent' 
        ? 'Team is insolvent! Find sponsorship or funding immediately.'
        : 'Cash reserves critically low. Unable to cover operating costs.'
    })
  } else if (status.cash.status === 'low') {
    warnings.push({
      type: 'cash_low',
      severity: 'warning',
      message: 'Cash reserves below recommended levels.'
    })
  }
  
  // Cost cap warnings
  if (status.costCap.status === 'exceeded') {
    warnings.push({
      type: 'cost_cap_warning',
      severity: 'critical',
      message: 'Cost cap exceeded! Championship penalties may apply.'
    })
  } else if (status.costCap.status === 'critical') {
    warnings.push({
      type: 'cost_cap_warning',
      severity: 'critical',
      message: 'Approaching cost cap limit - minimize further spending.'
    })
  } else if (status.costCap.status === 'warning') {
    warnings.push({
      type: 'cost_cap_warning',
      severity: 'warning',
      message: 'Cost cap usage above 80% - budget carefully.'
    })
  }
  
  // Runway warnings
  if (status.runway.status === 'emergency' || status.runway.status === 'critical') {
    warnings.push({
      type: 'runway_critical',
      severity: 'critical',
      message: status.runway.status === 'emergency'
        ? 'Financial emergency! Less than 2 weeks of runway remaining.'
        : 'Runway critical - find sponsorship or reduce costs urgently.'
    })
  } else if (status.runway.status === 'caution') {
    warnings.push({
      type: 'runway_critical',
      severity: 'warning',
      message: 'Financial runway below recommended levels.'
    })
  }
  
  // Over-allocation warning
  if (status.allocations.isOverAllocated) {
    warnings.push({
      type: 'over_allocated',
      severity: 'warning',
      message: `Budget over-allocated by $${status.allocations.overAllocatedAmount.toLocaleString()}.`
    })
  }
  
  return warnings
}

// ============================================
// SEASON PROJECTION CALCULATOR
// ============================================

export interface SeasonProjection {
  // Income projections
  projectedSponsorIncome: number      // Remaining sponsor payments
  projectedPrizeIncome: number        // Estimated prize money based on performance
  projectedSeriesRevenue: number      // Remaining series/TV revenue
  projectedManufacturerIncome: number // Remaining manufacturer support (works teams)
  totalProjectedIncome: number
  
  // Expense projections
  projectedFacilityCosts: number      // Remaining facility costs
  projectedDevelopmentCosts: number   // Remaining R&D costs
  projectedMaintenanceCosts: number   // Remaining car maintenance
  projectedDriverCosts: number        // Remaining driver retainers/salaries
  projectedStaffCosts: number         // Remaining staff salaries
  projectedTravelCosts: number        // Estimated travel for remaining races
  totalProjectedExpenses: number
  
  // Summary
  netProjectedChange: number          // Total income - total expenses
  currentCash: number
  projectedEndOfSeasonCash: number
  weeksRemaining: number
  racesRemaining: number
}

/**
 * Calculate season financial projections
 * Estimates remaining income and expenses based on current performance and schedule
 */
export function calculateSeasonProjections(
  team: OwnedTeam,
  tier: TeamTier,
  currentWeek: number,
  seasonEndWeek: number = 48,
  racesRemaining: number,
  expectedChampionshipPosition: number = 5,
  developmentIntensity: number = 1.0
): SeasonProjection {
  const weeksRemaining = Math.max(0, seasonEndWeek - currentWeek)
  const sponsors = team.finances?.sponsors || []
  const activeSponsors = sponsors.filter(s => s.active)
  const carCount = (team as { cars?: unknown[] }).cars?.length || 1
  
  // === INCOME PROJECTIONS ===
  
  // 1. Sponsor income: weekly payments for remaining weeks
  const avgWeeklyPayment = activeSponsors.reduce((sum, s) => {
    const weeklyPayment = Math.round(s.monthlyPayment / 4)
    const modifier = getSponsorPaymentModifier(s.satisfaction)
    return sum + (weeklyPayment * modifier)
  }, 0)
  const projectedSponsorIncome = avgWeeklyPayment * weeksRemaining
  
  // 2. Prize money estimate based on expected position
  // Estimate race prizes (average of expected finish positions)
  const avgRacePrize = calculateRacePrizeMoney(expectedChampionshipPosition, tier, 24) // Default to 24 participants
  const raceWinChance = expectedChampionshipPosition <= 3 ? 0.1 : expectedChampionshipPosition <= 5 ? 0.05 : 0.02
  const racePodiumChance = expectedChampionshipPosition <= 3 ? 0.3 : expectedChampionshipPosition <= 5 ? 0.15 : 0.05
  
  const prizeConfig = PRIZE_POOLS_BY_TIER[tier]
  const expectedRacePrizes = racesRemaining * (
    (raceWinChance * prizeConfig.winBonus) +
    (racePodiumChance * prizeConfig.podiumBonus) +
    ((1 - raceWinChance - racePodiumChance) * avgRacePrize)
  )
  
  // Championship bonus estimate
  const expectedChampBonus = calculateSeasonPrizeMoney(expectedChampionshipPosition, tier)
  const projectedPrizeIncome = Math.round(expectedRacePrizes + expectedChampBonus)
  
  // 3. Series revenue for remaining period
  const seriesConfig = SERIES_REVENUE_BY_TIER[tier]
  let projectedSeriesRevenue = 0
  if (seriesConfig.distributionType === 'per-race') {
    projectedSeriesRevenue = Math.round((seriesConfig.annualRevenue / 12) * racesRemaining)
  } else {
    // Quarterly - estimate remaining quarters
    const quartersRemaining = Math.ceil(weeksRemaining / 13)
    projectedSeriesRevenue = Math.round((seriesConfig.annualRevenue / 4) * quartersRemaining)
  }
  
  // 4. Manufacturer income (works teams only)
  // This is simplified - assumes team continues receiving quarterly payments
  const quartersRemainingForMfr = Math.ceil(weeksRemaining / 13)
  const annualMfrSupport = getManufacturerPayment(tier, 'works')
  const projectedManufacturerIncome = annualMfrSupport > 0 
    ? Math.round((annualMfrSupport / 4) * quartersRemainingForMfr)
    : 0
  
  const totalProjectedIncome = projectedSponsorIncome + projectedPrizeIncome + 
    projectedSeriesRevenue + projectedManufacturerIncome
  
  // === EXPENSE PROJECTIONS ===
  
  // 1. Facility costs (use dynamic calculation if facilities exist)
  const weeklyFacilityCost = calculateDynamicFacilityCosts(team, tier)
  const projectedFacilityCosts = weeklyFacilityCost * weeksRemaining
  
  // 2. Development costs (based on intensity)
  const weeklyDevCost = Math.round(DEVELOPMENT_COSTS_BY_TIER[tier].weeklyRDBurnRate * developmentIntensity)
  const projectedDevelopmentCosts = weeklyDevCost * weeksRemaining
  
  // 3. Car maintenance
  const weeklyMaintenanceCost = calculateWeeklyMaintenanceCost(tier, carCount, false)
  const raceWeekMaintenanceCost = calculateWeeklyMaintenanceCost(tier, carCount, true)
  const projectedMaintenanceCosts = (weeklyMaintenanceCost * (weeksRemaining - racesRemaining)) +
    (raceWeekMaintenanceCost * racesRemaining)
  
  // 4. Driver costs (hired drivers)
  let projectedDriverCosts = 0
  const drivers = team.drivers || []
  if (drivers.length > 0) {
    const hiredDriver = drivers[0]
    if (hiredDriver?.contract) {
      // Monthly retainer
      const monthlyRetainer = hiredDriver.contract.monthlyRetainer || 0
      const weeklyRetainer = Math.floor(monthlyRetainer / 4)
      projectedDriverCosts += weeklyRetainer * weeksRemaining
      
      // Per-race fees
      const perRaceFee = hiredDriver.contract.salary || 0
      projectedDriverCosts += perRaceFee * racesRemaining
    }
  }
  
  // 5. Staff costs
  let projectedStaffCosts = 0
  const staff = team.staff || []
  staff.forEach(s => {
    if (s.contract?.salary) {
      const weeklySalary = Math.floor(s.contract.salary / 4)
      projectedStaffCosts += weeklySalary * weeksRemaining
    }
  })
  
  // 6. Travel costs (estimate per remaining race)
  // Simplified estimate based on tier
  const avgTravelCostPerRace = {
    entry: 2000,
    amateur: 5000,
    'semi-pro': 15000,
    professional: 35000,
    pro: 80000,
    elite: 180000,
    pinnacle: 450000
  }[tier] * carCount
  const projectedTravelCosts = avgTravelCostPerRace * racesRemaining
  
  const totalProjectedExpenses = projectedFacilityCosts + projectedDevelopmentCosts +
    projectedMaintenanceCosts + projectedDriverCosts + projectedStaffCosts + projectedTravelCosts
  
  // === SUMMARY ===
  const netProjectedChange = totalProjectedIncome - totalProjectedExpenses
  const currentCash = team.budgets?.cash || 0
  const projectedEndOfSeasonCash = currentCash + netProjectedChange
  
  return {
    projectedSponsorIncome,
    projectedPrizeIncome,
    projectedSeriesRevenue,
    projectedManufacturerIncome,
    totalProjectedIncome,
    
    projectedFacilityCosts,
    projectedDevelopmentCosts,
    projectedMaintenanceCosts,
    projectedDriverCosts,
    projectedStaffCosts,
    projectedTravelCosts,
    totalProjectedExpenses,
    
    netProjectedChange,
    currentCash,
    projectedEndOfSeasonCash,
    weeksRemaining,
    racesRemaining
  }
}

/**
 * Update team's projection fields in budgets
 * Call this after major financial changes (race results, sponsor changes, budget changes)
 */
export function updateTeamProjections(
  team: OwnedTeam,
  tier: TeamTier,
  currentWeek: number,
  seasonEndWeek: number,
  racesRemaining: number,
  expectedChampionshipPosition: number,
  developmentIntensity: number
): TeamBudgets {
  const projections = calculateSeasonProjections(
    team,
    tier,
    currentWeek,
    seasonEndWeek,
    racesRemaining,
    expectedChampionshipPosition,
    developmentIntensity
  )
  
  return {
    ...team.budgets,
    projectedSeasonIncome: projections.totalProjectedIncome,
    projectedSeasonExpenses: projections.totalProjectedExpenses,
    runwayWeeks: projections.weeksRemaining > 0 && projections.netProjectedChange < 0
      ? Math.floor(projections.currentCash / Math.abs(projections.netProjectedChange / projections.weeksRemaining))
      : projections.weeksRemaining
  }
}

// ============================================
// SPARE PARTS LOGISTICS COSTS
// ============================================

/**
 * Process weekly warehouse rental costs
 */
export function processWarehouseRentalCosts(
  warehouses: { id: string; name: string; weeklyRentalCost: number; rentalActive: boolean }[],
  week: number,
  year: number
): TeamTransaction[] {
  const transactions: TeamTransaction[] = []
  
  for (const warehouse of warehouses) {
    if (!warehouse.rentalActive || warehouse.weeklyRentalCost <= 0) continue
    
    transactions.push(createTeamTransaction(
      'expense',
      'facilities',
      warehouse.weeklyRentalCost,
      `${warehouse.name} warehouse rental`,
      week,
      year,
      { countsTowardCostCap: true }
    ))
  }
  
  return transactions
}

/**
 * Process manufacturing job costs (when job is started)
 */
export function processManufacturingJobCost(
  partType: string,
  quantity: number,
  materialCost: number,
  laborCost: number,
  week: number,
  year: number
): TeamTransaction {
  const totalCost = materialCost + laborCost
  
  return createTeamTransaction(
    'expense',
    'development', // Manufacturing falls under development costs
    totalCost,
    `In-house ${partType} manufacturing (├ù${quantity}) - Materials: $${materialCost.toLocaleString()}, Labor: $${laborCost.toLocaleString()}`,
    week,
    year,
    { countsTowardCostCap: true }
  )
}

/**
 * Process parts purchase order cost (when order is placed)
 */
export function processPartsOrderCost(
  partType: string,
  quantity: number,
  manufacturerName: string,
  totalCost: number,
  isRushOrder: boolean,
  week: number,
  year: number
): TeamTransaction {
  const description = isRushOrder
    ? `Rush order: ${partType} ├ù${quantity} from ${manufacturerName}`
    : `Order: ${partType} ├ù${quantity} from ${manufacturerName}`
  
  return createTeamTransaction(
    'expense',
    'development', // Parts purchases fall under development
    totalCost,
    description,
    week,
    year,
    { countsTowardCostCap: true }
  )
}

/**
 * Process shipping/logistics costs
 */
export function processShippingCost(
  origin: string,
  destination: string,
  partCount: number,
  shippingMethod: string,
  cost: number,
  week: number,
  year: number,
  raceId?: string
): TeamTransaction {
  const methodNames: Record<string, string> = {
    standard: 'Standard Freight',
    express: 'Express Freight',
    air_freight: 'Air Freight'
  }
  
  const methodName = methodNames[shippingMethod] || shippingMethod
  const description = raceId
    ? `Race kit shipping (${methodName}): ${partCount} parts to track`
    : `Parts shipment (${methodName}): ${origin} ΓåÆ ${destination} (${partCount} parts)`
  
  return createTeamTransaction(
    'expense',
    'travel', // Shipping costs fall under travel/logistics
    cost,
    description,
    week,
    year,
    { raceWeek: raceId ? week : undefined, countsTowardCostCap: true }
  )
}

/**
 * Process auto-reorder costs
 * Called when automatic reordering triggers new parts orders
 */
export function processAutoReorderCosts(
  orders: { partType: string; quantity: number; cost: number }[],
  week: number,
  year: number
): TeamTransaction | null {
  if (orders.length === 0) return null
  
  const totalCost = orders.reduce((sum, o) => sum + o.cost, 0)
  const totalParts = orders.reduce((sum, o) => sum + o.quantity, 0)
  const partsDescription = orders.map(o => `${o.partType} ├ù${o.quantity}`).join(', ')
  
  return createTeamTransaction(
    'expense',
    'development',
    totalCost,
    `Auto-reorder: ${totalParts} parts (${partsDescription})`,
    week,
    year,
    { countsTowardCostCap: true }
  )
}

/**
 * Calculate total spare parts logistics costs for a week
 * Utility function for runway/projection calculations
 */
export function calculateWeeklySparePartsCosts(params: {
  activeWarehouses: { weeklyRentalCost: number }[]
  manufacturingJobCost?: number
  pendingOrdersCost?: number
  shippingCost?: number
}): number {
  let total = 0
  
  // Warehouse rentals
  total += params.activeWarehouses.reduce((sum, w) => sum + w.weeklyRentalCost, 0)
  
  // Optional costs that may not be weekly
  if (params.manufacturingJobCost) total += params.manufacturingJobCost
  if (params.pendingOrdersCost) total += params.pendingOrdersCost
  if (params.shippingCost) total += params.shippingCost
  
  return total
}

/**
 * Generate spare parts financial summary
 */
export function generateSparePartsFinancialSummary(
  transactions: TeamTransaction[],
  year: number
): {
  totalWarehouseRentals: number
  totalManufacturingCosts: number
  totalPartsOrders: number
  totalShippingCosts: number
  totalSparePartsCosts: number
} {
  const sparePartsTransactions = transactions.filter(tx => 
    tx.year === year && 
    tx.type === 'expense' &&
    (tx.description.includes('warehouse') ||
     tx.description.includes('manufacturing') ||
     tx.description.includes('Order:') ||
     tx.description.includes('Rush order:') ||
     tx.description.includes('Auto-reorder') ||
     tx.description.includes('shipping') ||
     tx.description.includes('Freight'))
  )
  
  let totalWarehouseRentals = 0
  let totalManufacturingCosts = 0
  let totalPartsOrders = 0
  let totalShippingCosts = 0
  
  for (const tx of sparePartsTransactions) {
    if (tx.description.includes('warehouse')) {
      totalWarehouseRentals += tx.amount
    } else if (tx.description.includes('manufacturing')) {
      totalManufacturingCosts += tx.amount
    } else if (tx.description.includes('Order:') || tx.description.includes('Rush order:') || tx.description.includes('Auto-reorder')) {
      totalPartsOrders += tx.amount
    } else if (tx.description.includes('shipping') || tx.description.includes('Freight')) {
      totalShippingCosts += tx.amount
    }
  }
  
  return {
    totalWarehouseRentals,
    totalManufacturingCosts,
    totalPartsOrders,
    totalShippingCosts,
    totalSparePartsCosts: totalWarehouseRentals + totalManufacturingCosts + totalPartsOrders + totalShippingCosts
  }
}

// ============================================
// EXPORTS
// ============================================

export {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES
} from '@/data/financial-config'
