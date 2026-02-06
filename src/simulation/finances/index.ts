// Financial simulation system
import { PlayerDriver, PlayerBackground } from '@/store/careerStore'
import { Series } from '@/store/rivalStore'
import {
  SPONSORS,
  Sponsor,
  SponsorPayment,
  calculatePaymentWithBonus
} from '@/data/sponsors';

type SponsorType = 'performance' | 'lifestyle' | 'traditional' | 'fan_focused'

function determineSponsorType(category: string): SponsorType {
  if (category.includes('performance') || category.includes('racing')) return 'performance'
  if (category.includes('lifestyle') || category.includes('luxury')) return 'lifestyle'
  if (category.includes('fan') || category.includes('social')) return 'fan_focused'
  return 'traditional'
}

function getSponsorWeights(sponsorType: SponsorType): { reputationWeight: number; mediaWeight: number } {
  switch (sponsorType) {
    case 'performance':
      return { reputationWeight: 0.8, mediaWeight: 0.2 }
    case 'lifestyle':
      return { reputationWeight: 0.3, mediaWeight: 0.7 }
    case 'traditional':
      return { reputationWeight: 0.6, mediaWeight: 0.4 }
    case 'fan_focused':
      return { reputationWeight: 0.4, mediaWeight: 0.6 }
    default:
      return { reputationWeight: 0.5, mediaWeight: 0.5 }
  }
}

/**
 * Generate media requirements for a sponsor deal
 */
function generateMediaRequirements(
  tier: string,
  sponsorType: SponsorType,
  monthlyPayment: number
): SponsorDeal['mediaRequirements'] {
  // Only lifestyle and fan-focused sponsors have strict media requirements
  if (sponsorType === 'performance') {
    return undefined // Performance sponsors don't care much about media
  }
  
  // Base shoutouts required scales with payment
  const baseShoutouts = tier === 'elite' ? 4 : tier === 'high' ? 3 : tier === 'mid' ? 2 : 1
  
  // Lifestyle sponsors want more shoutouts
  const shoutoutsRequired = sponsorType === 'lifestyle' 
    ? baseShoutouts + 1 
    : baseShoutouts
  
  // Min follower requirements based on tier
  const minFollowers = sponsorType === 'lifestyle' ? (
    tier === 'elite' ? 250000 :
    tier === 'high' ? 100000 :
    tier === 'mid' ? 50000 :
    25000
  ) : undefined
  
  // High-tier sponsors don't want controversy
  const noControversy = tier === 'elite' || (tier === 'high' && Math.random() > 0.5)
  
  // Arranged interviews based on tier
  const arrangedInterviews = tier === 'elite' ? 2 : tier === 'high' ? 1 : 0
  
  // Viral bonus based on monthly payment
  const bonusForViral = sponsorType === 'lifestyle' || sponsorType === 'fan_focused'
    ? Math.floor(monthlyPayment * 0.5)
    : undefined
  
  return {
    shoutoutsRequired,
    shoutoutsCompleted: 0,
    minFollowers,
    noControversy,
    arrangedInterviews: arrangedInterviews > 0 ? arrangedInterviews : undefined,
    arrangedInterviewsCompleted: arrangedInterviews > 0 ? 0 : undefined,
    bonusForViral
  }
}

export interface Transaction {
  id: string
  type: 'income' | 'expense'
  category: TransactionCategory
  description: string
  amount: number
  week: number
  year: number
}

export type TransactionCategory = 
  | 'salary'
  | 'prize'
  | 'sponsorship'
  | 'bonus'
  | 'seat_fee'
  | 'living_expenses'
  | 'equipment'
  | 'training'
  | 'travel'
  | 'other'

export interface SponsorDeal {
  id: string
  sponsorId: string           // Links to Sponsor in database
  sponsorName: string
  monthlyPayment: number      // Base monthly payment (before satisfaction modifier)
  bonusPerWin: number         // Base win bonus (before satisfaction modifier)
  bonusPerPodium: number      // Base podium bonus (before satisfaction modifier)
  duration: number            // seasons
  minReputation: number
  minMarketability?: number   // Marketability % needed to keep sponsor
  active: boolean
  startYear: number
  // Affiliation bonuses applied
  hasNationalityBonus: boolean
  hasManufacturerBonus: boolean
  hasSeriesBonus: boolean
  
  // Performance Targets System
  satisfaction: number              // 0-100, starts at 70
  targets: SponsorTarget[]          // Season performance targets
  seasonWins: number                // Wins this season
  seasonPodiums: number             // Podiums this season  
  seasonRacesStarted: number        // Races started this season
  seasonDNFs: number                // DNFs this season
  lastEvaluatedWeek: number         // Last week satisfaction was updated
  warningIssued: boolean            // Has sponsor warned about poor performance?
  finalWarningIssued: boolean       // Has sponsor issued final warning?
  
  // Media Requirements System (NEW)
  mediaRequirements?: {
    shoutoutsRequired: number         // "Post X sponsor shoutouts this season"
    shoutoutsCompleted: number        // Track progress
    minFollowers?: number             // "Maintain X followers"
    noControversy?: boolean           // "No controversial posts while sponsored"
    arrangedInterviews?: number       // "Attend X sponsor-arranged interviews"
    arrangedInterviewsCompleted?: number
    bonusForViral?: number            // "$X bonus if post mentioning us goes viral"
  }
  
  // Sponsor Type (affects what they value)
  sponsorType?: 'performance' | 'lifestyle' | 'traditional' | 'fan_focused'
  reputationWeight?: number           // 0-1, how much they value racing reputation
  mediaWeight?: number                // 0-1, how much they value media star power
  
  // Sponsor Personality (determines reaction to posts)
  personality?: SponsorPersonality
  
  // Satisfaction History (track what caused changes)
  satisfactionHistory?: {
    week: number
    year: number
    oldValue: number
    newValue: number
    reason: string
    mediaEventId?: string
  }[]
}

// Re-export SponsorTarget for convenience
export type { SponsorTarget }

// ============================================
// SPONSOR REQUIREMENTS CHECKING
// ============================================

export interface RequirementCheck {
  met: boolean
  label: string
  current: string | number
  required: string | number
}

export interface SponsorEligibility {
  sponsor: Sponsor
  isEligible: boolean
  requirements: RequirementCheck[]
  payment: SponsorPayment       // Payment after affiliation bonuses
  bonuses: {
    nationality: boolean
    manufacturer: boolean
    series: boolean
  }
}

/**
 * Check if a player meets a specific sponsor's requirements
 */
export function checkSponsorRequirements(
  sponsor: Sponsor,
  player: PlayerDriver,
  currentSeriesTier?: string,
  manufacturerId?: string
): RequirementCheck[] {
  const checks: RequirementCheck[] = []
  const reqs = sponsor.requirements
  
  // Reputation check
  checks.push({
    met: player.reputation >= reqs.minReputation,
    label: 'Reputation',
    current: player.reputation,
    required: `${reqs.minReputation}+`
  })
  
  // Marketability check
  checks.push({
    met: player.stats.marketability >= reqs.minMarketability,
    label: 'Marketability',
    current: `${player.stats.marketability}%`,
    required: `${reqs.minMarketability}%+`
  })
  
  // Series tier check
  if (reqs.seriesTiers && reqs.seriesTiers.length > 0) {
    const tierMet = currentSeriesTier ? reqs.seriesTiers.includes(currentSeriesTier) : false
    checks.push({
      met: tierMet,
      label: 'Series Tier',
      current: currentSeriesTier || 'None',
      required: reqs.seriesTiers.join(', ')
    })
  }
  
  // Nationality check
  if (reqs.nationalities && reqs.nationalities.length > 0) {
    const nationalityMet = reqs.nationalities.includes(player.nationality)
    checks.push({
      met: nationalityMet,
      label: 'Nationality',
      current: player.nationality,
      required: reqs.nationalities.join(', ')
    })
  }
  
  // Manufacturer check
  if (reqs.manufacturerIds && reqs.manufacturerIds.length > 0) {
    const manufacturerMet = manufacturerId ? reqs.manufacturerIds.includes(manufacturerId) : false
    checks.push({
      met: manufacturerMet,
      label: 'Manufacturer',
      current: manufacturerId || 'None',
      required: reqs.manufacturerIds.join(', ')
    })
  }
  
  // Wins check
  if (reqs.minWins !== undefined && reqs.minWins > 0) {
    checks.push({
      met: player.totalWins >= reqs.minWins,
      label: 'Career Wins',
      current: player.totalWins,
      required: `${reqs.minWins}+`
    })
  }
  
  // Podiums check
  if (reqs.minPodiums !== undefined && reqs.minPodiums > 0) {
    checks.push({
      met: player.totalPodiums >= reqs.minPodiums,
      label: 'Career Podiums',
      current: player.totalPodiums,
      required: `${reqs.minPodiums}+`
    })
  }
  
  // Championships check
  if (reqs.minChampionships !== undefined && reqs.minChampionships > 0) {
    checks.push({
      met: player.championships >= reqs.minChampionships,
      label: 'Championships',
      current: player.championships,
      required: `${reqs.minChampionships}+`
    })
  }
  
  // Races check
  if (reqs.minRaces !== undefined && reqs.minRaces > 0) {
    checks.push({
      met: player.totalRaces >= reqs.minRaces,
      label: 'Career Races',
      current: player.totalRaces,
      required: `${reqs.minRaces}+`
    })
  }
  
  return checks
}

/**
 * Get full eligibility info for a sponsor including payment calculations
 */
export function getSponsorEligibility(
  sponsor: Sponsor,
  player: PlayerDriver,
  currentSeriesTier?: string,
  manufacturerId?: string,
  seriesCategory?: string
): SponsorEligibility {
  const requirements = checkSponsorRequirements(sponsor, player, currentSeriesTier, manufacturerId)
  const isEligible = requirements.every(r => r.met)
  
  // Determine which bonuses apply
  const bonuses = {
    nationality: sponsor.nationalityBonus?.includes(player.nationality) ?? false,
    manufacturer: manufacturerId ? (sponsor.manufacturerBonus?.includes(manufacturerId) ?? false) : false,
    series: seriesCategory ? (sponsor.seriesBonus?.includes(seriesCategory) ?? false) : false
  }
  
  // Get base payment tier based on player's series tier
  let paymentTier: 'entry' | 'mid' | 'elite' = 'entry'
  if (currentSeriesTier) {
    if (['elite', 'pinnacle'].includes(currentSeriesTier)) {
      paymentTier = 'elite'
    } else if (['semi-pro', 'pro', 'professional'].includes(currentSeriesTier)) {
      paymentTier = 'mid'
    }
  }
  
  const basePayment = sponsor.paymentTiers[paymentTier]
  
  // Apply affiliation bonuses
  const payment = calculatePaymentWithBonus(
    sponsor,
    basePayment,
    player.nationality,
    manufacturerId,
    seriesCategory
  )
  
  return {
    sponsor,
    isEligible,
    requirements,
    payment,
    bonuses
  }
}

/**
 * Get all sponsors with their eligibility status for the player
 */
export function getAllSponsorsWithEligibility(
  player: PlayerDriver,
  currentSeriesTier?: string,
  manufacturerId?: string,
  seriesCategory?: string
): SponsorEligibility[] {
  return SPONSORS.map(sponsor => 
    getSponsorEligibility(sponsor, player, currentSeriesTier, manufacturerId, seriesCategory)
  )
}

export interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  netChange: number
  incomeBreakdown: Record<string, number>
  expenseBreakdown: Record<string, number>
}

// Calculate prize money based on finishing position
export function calculatePrizeMoney(position: number, series: Series): number {
  if (position === 1) return series.prizeMoney.win
  if (position <= 3) return series.prizeMoney.podium
  if (position <= 10) return Math.floor(series.prizeMoney.points * (11 - position) / 10)
  return 0
}

// ============================================
// REALISTIC LIVING EXPENSES
// Scaled to match new economy where sponsors pay $50k-$10M/year
// Entry career: $2k-$5k/month | Mid career: $5k-$15k/month | Elite: $15k-$50k/month
// ============================================

// Calculate monthly living expenses based on reputation and marketability
export function calculateLivingExpenses(player: PlayerDriver): number {
  // Base monthly expenses for a professional racer
  const baseExpenses = 2000 // $2k/month minimum
  
  // Reputation scales living costs (higher rep = higher lifestyle expectations)
  // 0 rep = 1x, 50 rep = 2.5x, 100 rep = 5x
  const reputation = player.reputation || 0
  const reputationModifier = 1 + (reputation / 25)
  
  // Marketability adds lifestyle costs (endorsements require appearances, travel, etc)
  // 0 mark = 1x, 50 mark = 1.5x, 100 mark = 2x
  // Note: marketability is in player.stats.marketability
  const marketability = player.stats?.marketability || 50
  const marketabilityModifier = 1 + (marketability / 100)
  
  // Combined: Entry racer ($2k), Mid-career racer ($10-15k), Elite racer ($30-50k)
  return Math.floor(baseExpenses * reputationModifier * marketabilityModifier)
}

// Calculate monthly training costs - professional training is expensive
export function calculateTrainingCosts(intensityLevel: number): number {
  // Level 1: Basic gym ($500/mo), Level 5: Full pro program with trainers/facilities ($5000/mo)
  const baseCost = 500
  return Math.floor(baseCost * intensityLevel)
}

// Tier to numeric value mapping for cost calculations
const TIER_VALUES: Record<string, number> = {
  'entry': 1,
  'amateur': 2,
  'semi-pro': 3,
  'pro': 4,
  'professional': 4,
  'elite': 5,
  'pinnacle': 6
}

// Calculate monthly equipment costs - helmet, suit, gloves, HANS, shoes, etc
export function calculateEquipmentCosts(seriesTier: string | number): number {
  // Entry: ~$300/mo (basic gear), Pinnacle: ~$3000/mo (F1-grade custom equipment)
  const baseCost = 300
  const tierValue = typeof seriesTier === 'number' 
    ? seriesTier 
    : (TIER_VALUES[seriesTier] || 2)
  return Math.floor(baseCost * tierValue)
}

// Calculate manager fee (percentage of income)
export function calculateManagerFee(income: number, managerLevel: number): number {
  const feePercentage = 0.05 + (managerLevel * 0.02) // 5% base + 2% per level
  return Math.floor(income * feePercentage)
}

// Generate monthly financial summary
export function generateMonthlySummary(
  transactions: Transaction[],
  month: number,
  year: number
): FinancialSummary {
  const monthTransactions = transactions.filter(t => {
    const weekInMonth = Math.ceil(t.week / 4.33)
    return weekInMonth === month && t.year === year
  })

  const incomeBreakdown: Record<string, number> = {}
  const expenseBreakdown: Record<string, number> = {}
  let totalIncome = 0
  let totalExpenses = 0

  monthTransactions.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount
      incomeBreakdown[t.category] = (incomeBreakdown[t.category] || 0) + t.amount
    } else {
      totalExpenses += Math.abs(t.amount)
      expenseBreakdown[t.category] = (expenseBreakdown[t.category] || 0) + Math.abs(t.amount)
    }
  })

  return {
    totalIncome,
    totalExpenses,
    netChange: totalIncome - totalExpenses,
    incomeBreakdown,
    expenseBreakdown
  }
}

/**
 * Generate available sponsor offers based on player stats and current situation
 * Uses the realistic sponsor database with multi-criteria requirements
 * Now includes background-aware sponsor attraction logic
 */
export function generateSponsorOffers(
  player: PlayerDriver,
  currentYear: number,
  currentSeriesTier?: string,
  manufacturerId?: string,
  seriesCategory?: string,
  existingSponsorIds: string[] = [],
  totalRacesInSeason: number = 12,
  gridSize: number = 20
): SponsorDeal[] {
  const offers: SponsorDeal[] = []
  
  // Get all sponsors with eligibility
  const eligibleSponsors = getAllSponsorsWithEligibility(
    player,
    currentSeriesTier,
    manufacturerId,
    seriesCategory
  ).filter(e => e.isEligible && !existingSponsorIds.includes(e.sponsor.id))
  
  // Determine how many offers to generate based on marketability and background
  let marketabilityBonus = 0
  
  // Background bonuses to number of offers
  if (player.background) {
    // High social media following = more sponsor interest
    if (player.background.socialMediaFollowers >= 500000) marketabilityBonus += 15
    else if (player.background.socialMediaFollowers >= 100000) marketabilityBonus += 10
    else if (player.background.socialMediaFollowers >= 50000) marketabilityBonus += 5
    
    // Family legacy attracts sponsors
    if (player.background.familyLegacy) marketabilityBonus += 10
    
    // Sim racing crossover has built-in sponsor appeal
    if (player.background.isSimRacingCrossover) marketabilityBonus += 5
  }
  
  const effectiveMarketability = Math.min(100, player.stats.marketability + marketabilityBonus)
  const maxOffers = Math.ceil(effectiveMarketability / 20) // 1-5 offers based on marketability
  const targetOffers = Math.min(maxOffers, eligibleSponsors.length)
  
  // Sort by tier (higher tier sponsors more likely with higher reputation)
  const tierWeight: Record<string, number> = { 'entry': 1, 'mid': 2, 'high': 3, 'elite': 4 }
  
  // Weighted random selection favoring appropriate tier sponsors
  const weightedSelection: SponsorEligibility[] = []
  
  eligibleSponsors.forEach(e => {
    // Base weight from tier match
    let weight = 1
    const _sponsorTierValue = tierWeight[e.sponsor.tier] || 1
    
    // Weight based on player reputation matching sponsor tier
    if (player.reputation < 25 && e.sponsor.tier === 'entry') weight += 3
    else if (player.reputation >= 25 && player.reputation < 50 && e.sponsor.tier === 'mid') weight += 3
    else if (player.reputation >= 50 && player.reputation < 75 && e.sponsor.tier === 'high') weight += 3
    else if (player.reputation >= 75 && e.sponsor.tier === 'elite') weight += 3
    
    // Bonus weight for affiliation matches
    if (e.bonuses.nationality) weight += 2
    if (e.bonuses.manufacturer) weight += 2
    if (e.bonuses.series) weight += 1
    
    // ============================================
    // BACKGROUND-SPECIFIC SPONSOR ATTRACTION
    // ============================================
    const backgroundBonus = calculateBackgroundSponsorBonus(player.background, e.sponsor)
    weight += backgroundBonus
    
    // ============================================
    // OWNER PERK SPONSOR BONUSES
    // ============================================
    // Corporate network helps attract corporate/business sponsors
    if (hasCorporateNetwork() && 
        (['corporate', 'business', 'finance', 'automotive', 'luxury'].includes(e.sponsor.category.toLowerCase())
        || e.sponsor.tier === 'elite')) {
      weight += 3
    }
    
    // Tech partners help attract tech/innovation sponsors
    if (hasTechPartners() && 
        ['tech', 'electronics', 'gaming', 'esports', 'innovation', 'tech_gaming'].includes(e.sponsor.category.toLowerCase())) {
      weight += 3
    }
    
    // Grassroots support helps attract local/regional sponsors
    if (hasGrassrootsSupport() && 
        (['local', 'regional', 'food', 'beverage', 'lifestyle'].includes(e.sponsor.category.toLowerCase())
        || e.sponsor.tier === 'entry')) {
      weight += 2
    }
    
    // Ensure weight is at least 1
    weight = Math.max(1, weight)
    
    // Add sponsor multiple times based on weight for weighted random
    for (let i = 0; i < weight; i++) {
      weightedSelection.push(e)
    }
  })
  
  // Randomly select sponsors from weighted pool
  const selectedSponsors = new Set<string>()
  let attempts = 0
  const maxAttempts = 100
  
  while (selectedSponsors.size < targetOffers && attempts < maxAttempts) {
    attempts++
    if (weightedSelection.length === 0) break
    
    const randomIndex = Math.floor(Math.random() * weightedSelection.length)
    const selected = weightedSelection[randomIndex]
    
    if (!selectedSponsors.has(selected.sponsor.id)) {
      selectedSponsors.add(selected.sponsor.id)
      
      // Generate performance targets for this sponsor
      const targets = generateSponsorTargets(
        selected.sponsor.tier,
        currentSeriesTier || 'semi-pro',
        totalRacesInSeason,
        gridSize
      )
      
      // Determine sponsor type and weights based on category
      const sponsorType = determineSponsorType(selected.sponsor.category)
      const { reputationWeight, mediaWeight } = getSponsorWeights(sponsorType)
      
      // Generate media requirements based on sponsor tier and type
      const mediaRequirements = generateMediaRequirements(
        selected.sponsor.tier,
        sponsorType,
        selected.payment.monthly
      )
      
      // Apply owner perk bonus to payment values
      const baseMonthlyPayment = selected.payment.monthly
      const adjustedMonthlyPayment = applySponsorPerk(baseMonthlyPayment)
      const adjustedWinBonus = applySponsorPerk(selected.payment.winBonus)
      const adjustedPodiumBonus = applySponsorPerk(selected.payment.podiumBonus)
      
      // Create the sponsor deal offer with performance tracking
      offers.push({
        id: `sponsor_${selected.sponsor.id}_${currentYear}_${Date.now()}`,
        sponsorId: selected.sponsor.id,
        sponsorName: selected.sponsor.name,
        monthlyPayment: adjustedMonthlyPayment,
        bonusPerWin: adjustedWinBonus,
        bonusPerPodium: adjustedPodiumBonus,
        duration: 1 + Math.floor(Math.random() * 2), // 1-2 seasons
        minReputation: selected.sponsor.requirements.minReputation,
        minMarketability: selected.sponsor.requirements.minMarketability,
        active: false,
        startYear: currentYear,
        hasNationalityBonus: selected.bonuses.nationality,
        hasManufacturerBonus: selected.bonuses.manufacturer,
        hasSeriesBonus: selected.bonuses.series,
        // Performance tracking fields
        satisfaction: DEFAULT_SATISFACTION,
        targets,
        seasonWins: 0,
        seasonPodiums: 0,
        seasonRacesStarted: 0,
        seasonDNFs: 0,
        lastEvaluatedWeek: 0,
        warningIssued: false,
        finalWarningIssued: false,
        // NEW: Media requirements and sponsor type
        sponsorType,
        reputationWeight,
        mediaWeight,
        mediaRequirements,
        // Sponsor personality (determines reaction to media posts)
        personality: getSponsorPersonality(sponsorType)
      })
    }
  }
  
  return offers
}

/**
 * Get all locked sponsors (those the player doesn't qualify for)
 */
export function getLockedSponsors(
  player: PlayerDriver,
  currentSeriesTier?: string,
  manufacturerId?: string,
  seriesCategory?: string
): SponsorEligibility[] {
  return getAllSponsorsWithEligibility(
    player,
    currentSeriesTier,
    manufacturerId,
    seriesCategory
  ).filter(e => !e.isEligible)
}

/**
 * Get all available sponsors (those the player qualifies for)
 */
export function getAvailableSponsors(
  player: PlayerDriver,
  currentSeriesTier?: string,
  manufacturerId?: string,
  seriesCategory?: string,
  existingSponsorIds: string[] = []
): SponsorEligibility[] {
  return getAllSponsorsWithEligibility(
    player,
    currentSeriesTier,
    manufacturerId,
    seriesCategory
  ).filter(e => e.isEligible && !existingSponsorIds.includes(e.sponsor.id))
}

// Process race result finances
export function processRaceResultFinances(
  player: PlayerDriver,
  position: number,
  series: Series,
  sponsorDeals: SponsorDeal[],
  currentWeek: number,
  currentYear: number
): Transaction[] {
  const transactions: Transaction[] = []

  // Prize money
  const prizeMoney = calculatePrizeMoney(position, series)
  if (prizeMoney > 0) {
    transactions.push({
      id: `prize_${currentYear}_${currentWeek}`,
      type: 'income',
      category: 'prize',
      description: `Prize Money - P${position}`,
      amount: prizeMoney,
      week: currentWeek,
      year: currentYear
    })
  }

  // Salary (if contracted)
  if (player.finances.salary > 0) {
    transactions.push({
      id: `salary_${currentYear}_${currentWeek}`,
      type: 'income',
      category: 'salary',
      description: 'Race Salary',
      amount: player.finances.salary,
      week: currentWeek,
      year: currentYear
    })
  }

  // Sponsor bonuses
  sponsorDeals.filter(s => s.active).forEach(sponsor => {
    if (position === 1 && sponsor.bonusPerWin > 0) {
      transactions.push({
        id: `sponsor_win_${sponsor.id}_${currentWeek}`,
        type: 'income',
        category: 'bonus',
        description: `${sponsor.sponsorName} Win Bonus`,
        amount: sponsor.bonusPerWin,
        week: currentWeek,
        year: currentYear
      })
    } else if (position <= 3 && sponsor.bonusPerPodium > 0) {
      transactions.push({
        id: `sponsor_podium_${sponsor.id}_${currentWeek}`,
        type: 'income',
        category: 'bonus',
        description: `${sponsor.sponsorName} Podium Bonus`,
        amount: sponsor.bonusPerPodium,
        week: currentWeek,
        year: currentYear
      })
    }
  })

  return transactions
}

// Process weekly expenses
export function processWeeklyExpenses(
  player: PlayerDriver,
  series: Series | undefined,
  currentWeek: number,
  currentYear: number
): Transaction[] {
  const transactions: Transaction[] = []

  // Living expenses (weekly portion) - not affected by team perks
  const weeklyLiving = Math.floor(calculateLivingExpenses(player) / 4)
  transactions.push({
    id: `living_${currentYear}_${currentWeek}`,
    type: 'expense',
    category: 'living_expenses',
    description: 'Living Expenses',
    amount: -weeklyLiving,
    week: currentWeek,
    year: currentYear
  })

  // Equipment costs (weekly portion) - affected by operational cost perk
  if (series) {
    const baseWeeklyEquipment = Math.floor(calculateEquipmentCosts(series.tier) / 4)
    // Apply owner/location perks for cost reduction
    const weeklyEquipment = applyOperationalCostPerk(baseWeeklyEquipment)
    transactions.push({
      id: `equipment_${currentYear}_${currentWeek}`,
      type: 'expense',
      category: 'equipment',
      description: 'Equipment Maintenance',
      amount: -weeklyEquipment,
      week: currentWeek,
      year: currentYear
    })
  }

  return transactions
}

// Check if player can afford something
export function canAfford(player: PlayerDriver, amount: number): boolean {
  return player.finances.bankBalance >= amount
}

// Apply transaction to player finances
export function applyTransaction(
  player: PlayerDriver,
  transaction: Transaction
): PlayerDriver {
  return {
    ...player,
    finances: {
      ...player.finances,
      bankBalance: player.finances.bankBalance + transaction.amount
    }
  }
}

// Check for bankruptcy
// With realistic economy, allow more debt as costs are higher
export function checkBankruptcy(player: PlayerDriver): boolean {
  return player.finances.bankBalance < -150000 // Allow more debt for realistic economy
}

// ============================================
// TEAM FINANCES RE-EXPORTS
// ============================================
// Team-level financial systems (replacing personal driver finances)

export * from './teamFinances'
export * from './teamSponsors'

// ============================================
// PERSONAL FINANCES RE-EXPORTS
// ============================================
// Personal wealth management for owner path

export * from './personalFinances'
export * from './equityManager'