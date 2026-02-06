// ============================================
// EQUITY MANAGER
// ============================================
// Handles team equity stakes, external investors,
// valuations, dividends, and capital movements.

import {
  TeamEquityStake,
  ExternalInvestor,
  InvestorTerms,
  EquityInvestment,
  DividendPolicy,
  PersonalGuarantee,
  GuaranteeType,
  PersonalTransaction,
  TEAM_VALUATION_CONFIG
} from '@/data/personal-finance-config'
import { OwnedTeam, TeamTransaction } from '@/store/careerStore'
import { TeamTier } from '@/store/rivalStore'
import { createPersonalTransaction } from './personalFinances'
import { createTeamTransaction } from './teamFinances'

// ============================================
// ID GENERATION
// ============================================

let equityIdCounter = 0

function generateEquityId(prefix: string): string {
  return `${prefix}_${Date.now()}_${++equityIdCounter}`
}

// ============================================
// TEAM VALUATION
// ============================================

export interface TeamValuationResult {
  valuation: number
  method: 'revenue_multiple' | 'asset_based' | 'market_comp'
  breakdown: {
    baseValue: number
    revenueMultiple: number
    modifiers: Array<{ name: string; effect: number }>
  }
}

export function calculateTeamValuation(
  team: OwnedTeam,
  tier: TeamTier,
  annualRevenue: number,
  seasonStats: {
    isChampion: boolean
    isTopThree: boolean
    winsThisSeason: number
    averageFacilityLevel: number
    averageStaffRating: number
  }
): TeamValuationResult {
  const config = TEAM_VALUATION_CONFIG
  
  // Base valuation from revenue multiple
  const revenueMultiple = config.revenueMultiples[tier] || 2.0
  let baseValue = annualRevenue * revenueMultiple
  
  // Apply minimum valuation
  const minimumValuation = config.minimumValuations[tier] || 100000
  baseValue = Math.max(baseValue, minimumValuation)
  
  // Calculate modifiers
  const modifiers: Array<{ name: string; effect: number }> = []
  let totalMultiplier = 1.0
  
  if (seasonStats.isChampion) {
    totalMultiplier *= config.modifiers.championshipWinner
    modifiers.push({ name: 'Defending Champion', effect: config.modifiers.championshipWinner })
  } else if (seasonStats.isTopThree) {
    totalMultiplier *= config.modifiers.topThreeFinish
    modifiers.push({ name: 'Top 3 Finish', effect: config.modifiers.topThreeFinish })
  }
  
  if (seasonStats.winsThisSeason > 0) {
    const winBonus = 1 + (seasonStats.winsThisSeason * config.modifiers.recentWins)
    totalMultiplier *= winBonus
    modifiers.push({ name: `${seasonStats.winsThisSeason} Wins`, effect: winBonus })
  }
  
  if (seasonStats.averageFacilityLevel > 0) {
    const facilityBonus = 1 + (seasonStats.averageFacilityLevel * config.modifiers.facilityLevel)
    totalMultiplier *= facilityBonus
    modifiers.push({ name: 'Facility Quality', effect: facilityBonus })
  }
  
  if (seasonStats.averageStaffRating > 70) {
    const staffBonus = 1 + ((seasonStats.averageStaffRating - 70) * config.modifiers.staffQuality)
    totalMultiplier *= staffBonus
    modifiers.push({ name: 'Staff Quality', effect: staffBonus })
  }
  
  if (team.reputation > 0) {
    const repBonus = 1 + (team.reputation * config.modifiers.reputationBonus)
    totalMultiplier *= repBonus
    modifiers.push({ name: 'Reputation', effect: repBonus })
  }
  
  if (team.boardMood < 30) {
    totalMultiplier *= config.modifiers.negativeBoard
    modifiers.push({ name: 'Board Concerns', effect: config.modifiers.negativeBoard })
  }
  
  // Check for financial trouble (debt > 50% of assets)
  const totalAssets = team.budgets.cash + baseValue * 0.5 // Rough asset estimate
  const totalDebt = team.finances?.extended?.loans?.totalDebt || 0
  if (totalDebt > totalAssets * 0.5) {
    totalMultiplier *= config.modifiers.financialTrouble
    modifiers.push({ name: 'Financial Concerns', effect: config.modifiers.financialTrouble })
  }
  
  const valuation = Math.round(baseValue * totalMultiplier)
  
  return {
    valuation,
    method: 'revenue_multiple',
    breakdown: {
      baseValue,
      revenueMultiple,
      modifiers
    }
  }
}

// ============================================
// CAPITAL INJECTION (Personal → Team)
// ============================================

export interface CapitalInjectionResult {
  success: boolean
  reason?: string
  personalTransaction?: PersonalTransaction
  teamTransaction?: TeamTransaction
  newEquityInvestment?: EquityInvestment
  sharesIssued?: number
  newOwnershipPercent?: number
}

export function injectCapitalIntoTeam(
  amount: number,
  equity: TeamEquityStake,
  personalCash: number,
  teamName: string,
  week: number,
  year: number,
  notes?: string
): CapitalInjectionResult {
  if (amount <= 0) {
    return { success: false, reason: 'Amount must be positive' }
  }
  
  if (amount > personalCash) {
    return { success: false, reason: `Insufficient personal funds. Have $${personalCash.toLocaleString()}, need $${amount.toLocaleString()}` }
  }
  
  // Calculate shares to issue (based on current valuation)
  const pricePerShare = equity.currentValuation / equity.totalShares
  const sharesIssued = Math.round(amount / pricePerShare)
  
  // If owner owns 100%, no dilution - just add to investment
  // If there are external investors, this gets more complex
  let newOwnershipPercent = equity.ownershipPercent
  
  if (equity.externalInvestors.length > 0) {
    // New shares are issued, slightly diluting everyone proportionally
    const newTotalShares = equity.totalShares + sharesIssued
    const ownerNewShares = equity.sharesOwned + sharesIssued
    newOwnershipPercent = (ownerNewShares / newTotalShares) * 100
    
    // Note: External investors would also be diluted here
    // In reality, they might have anti-dilution protection
  }
  
  // Create transactions
  const personalTransaction = createPersonalTransaction(
    'transfer',
    'team_investment',
    amount,
    `Capital injection into ${teamName}`,
    week,
    year
  )
  
  const teamTransaction = createTeamTransaction(
    'income',
    'other',
    amount,
    `Owner capital injection`,
    week,
    year,
    { countsTowardCostCap: false }
  )
  
  const newEquityInvestment: EquityInvestment = {
    id: generateEquityId('inv'),
    date: { week, year },
    amount,
    type: 'additional',
    sharesReceived: sharesIssued,
    pricePerShare,
    notes: notes || 'Additional capital injection'
  }
  
  return {
    success: true,
    personalTransaction,
    teamTransaction,
    newEquityInvestment,
    sharesIssued,
    newOwnershipPercent
  }
}

// ============================================
// CAPITAL WITHDRAWAL (Team → Personal)
// ============================================

export interface CapitalWithdrawalResult {
  success: boolean
  reason?: string
  personalTransaction?: PersonalTransaction
  teamTransaction?: TeamTransaction
  warnings?: string[]
}

export function withdrawCapitalFromTeam(
  amount: number,
  teamCash: number,
  minimumReserve: number,
  teamName: string,
  week: number,
  year: number
): CapitalWithdrawalResult {
  const warnings: string[] = []
  
  if (amount <= 0) {
    return { success: false, reason: 'Amount must be positive' }
  }
  
  const availableForWithdrawal = teamCash - minimumReserve
  
  if (amount > availableForWithdrawal) {
    return { 
      success: false, 
      reason: `Cannot withdraw $${amount.toLocaleString()}. Only $${Math.max(0, availableForWithdrawal).toLocaleString()} available after minimum reserve of $${minimumReserve.toLocaleString()}`
    }
  }
  
  // Warn if this takes significant amount
  if (amount > teamCash * 0.25) {
    warnings.push('This withdrawal represents more than 25% of team cash reserves')
  }
  
  const personalTransaction = createPersonalTransaction(
    'transfer',
    'team_withdrawal',
    amount,
    `Capital withdrawal from ${teamName}`,
    week,
    year
  )
  
  const teamTransaction = createTeamTransaction(
    'expense',
    'other',
    amount,
    `Owner capital withdrawal`,
    week,
    year,
    { countsTowardCostCap: false }
  )
  
  return {
    success: true,
    personalTransaction,
    teamTransaction,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

// ============================================
// OWNER SALARY
// ============================================

export interface OwnerSalaryConfig {
  weeklyAmount: number
  countsTowardCostCap: boolean
}

export function processOwnerSalaryPayment(
  config: OwnerSalaryConfig,
  teamCash: number,
  teamName: string,
  week: number,
  year: number
): CapitalWithdrawalResult {
  if (config.weeklyAmount <= 0) {
    return { success: true } // No salary configured
  }
  
  if (teamCash < config.weeklyAmount) {
    return {
      success: false,
      reason: `Team cannot afford owner salary. Need $${config.weeklyAmount.toLocaleString()}, team has $${teamCash.toLocaleString()}`
    }
  }
  
  const personalTransaction = createPersonalTransaction(
    'income',
    'salary',
    config.weeklyAmount,
    `Weekly owner salary from ${teamName}`,
    week,
    year
  )
  
  const teamTransaction = createTeamTransaction(
    'expense',
    'other',
    config.weeklyAmount,
    `Owner salary`,
    week,
    year,
    { countsTowardCostCap: config.countsTowardCostCap }
  )
  
  return {
    success: true,
    personalTransaction,
    teamTransaction
  }
}

// ============================================
// DIVIDENDS
// ============================================

export interface DividendResult {
  success: boolean
  reason?: string
  amount?: number
  personalTransaction?: PersonalTransaction
  teamTransaction?: TeamTransaction
}

export function processDividendDistribution(
  policy: DividendPolicy,
  equity: TeamEquityStake,
  teamProfitThisQuarter: number,
  teamCash: number,
  teamName: string,
  week: number,
  year: number
): DividendResult {
  if (!policy.enabled) {
    return { success: false, reason: 'Dividends are not enabled' }
  }
  
  if (teamProfitThisQuarter <= 0) {
    return { success: false, reason: 'Team is not profitable this period' }
  }
  
  // Calculate dividend pool
  const dividendPool = teamProfitThisQuarter * (policy.percentOfProfit / 100)
  
  // Check minimum cash reserve
  if (teamCash - dividendPool < policy.minimumCashReserve) {
    return { 
      success: false, 
      reason: `Distribution would put team below minimum cash reserve of $${policy.minimumCashReserve.toLocaleString()}`
    }
  }
  
  // Calculate owner's share
  const ownerDividend = dividendPool * (equity.ownershipPercent / 100)
  
  if (ownerDividend <= 0) {
    return { success: false, reason: 'No dividend amount to distribute' }
  }
  
  const personalTransaction = createPersonalTransaction(
    'income',
    'dividends',
    ownerDividend,
    `Quarterly dividend from ${teamName} (${equity.ownershipPercent.toFixed(1)}% ownership)`,
    week,
    year
  )
  
  const teamTransaction = createTeamTransaction(
    'expense',
    'other',
    dividendPool, // Full pool (includes any external investor shares)
    `Dividend distribution (${policy.percentOfProfit}% of quarterly profit)`,
    week,
    year,
    { countsTowardCostCap: false }
  )
  
  return {
    success: true,
    amount: ownerDividend,
    personalTransaction,
    teamTransaction
  }
}

// ============================================
// EXTERNAL INVESTORS
// ============================================

export interface InvestorOfferResult {
  investor: ExternalInvestor
  dilutionPercent: number
  newOwnerOwnership: number
  terms: InvestorTerms
}

export function generateInvestorOffer(
  equity: TeamEquityStake,
  investmentAmount: number,
  investorType: ExternalInvestor['type'],
  week: number,
  year: number
): InvestorOfferResult {
  // Calculate equity demanded based on current valuation
  const equityPercent = (investmentAmount / equity.currentValuation) * 100
  
  // Investors typically want a premium (more equity than pure math suggests)
  const premiumMultiplier = investorType === 'fund' ? 1.3 : 
                           investorType === 'corporate' ? 1.2 : 
                           investorType === 'individual' ? 1.15 : 1.25
  
  const requestedEquity = Math.min(49, equityPercent * premiumMultiplier) // Cap at 49%
  
  // Generate terms based on investor type
  const terms: InvestorTerms = generateInvestorTerms(investorType, requestedEquity)
  
  const newOwnerOwnership = equity.ownershipPercent - requestedEquity
  
  const investor: ExternalInvestor = {
    id: generateEquityId('investor'),
    name: generateInvestorName(investorType),
    type: investorType,
    investmentAmount,
    ownershipPercent: requestedEquity,
    sharesOwned: Math.round((requestedEquity / 100) * equity.totalShares),
    investmentDate: { week, year },
    terms,
    satisfaction: 70, // Starting satisfaction
    boardSeat: requestedEquity >= 20,
    votingRights: true
  }
  
  return {
    investor,
    dilutionPercent: requestedEquity,
    newOwnerOwnership,
    terms
  }
}

function generateInvestorTerms(type: ExternalInvestor['type'], equityPercent: number): InvestorTerms {
  const baseTerms: Record<ExternalInvestor['type'], Partial<InvestorTerms>> = {
    individual: {
      minimumReturn: 0.10,
      exitHorizon: 7,
      liquidationPreference: 1.0,
      antiDilution: false,
      dragAlongRights: false,
      tagAlongRights: true,
      vetoRights: []
    },
    fund: {
      minimumReturn: 0.20,
      exitHorizon: 5,
      liquidationPreference: 1.5,
      antiDilution: true,
      dragAlongRights: equityPercent >= 30,
      tagAlongRights: true,
      vetoRights: ['major_acquisition', 'debt_over_50pct']
    },
    corporate: {
      minimumReturn: 0.12,
      exitHorizon: 10,
      liquidationPreference: 1.0,
      antiDilution: false,
      dragAlongRights: false,
      tagAlongRights: true,
      vetoRights: ['competitor_partnership']
    },
    family_office: {
      minimumReturn: 0.15,
      exitHorizon: 8,
      liquidationPreference: 1.25,
      antiDilution: true,
      dragAlongRights: false,
      tagAlongRights: true,
      vetoRights: equityPercent >= 25 ? ['major_acquisition'] : []
    },
    private_equity: {
      minimumReturn: 0.25,
      exitHorizon: 5,
      liquidationPreference: 2.0,
      antiDilution: true,
      dragAlongRights: true,
      tagAlongRights: true,
      vetoRights: ['major_acquisition', 'debt_over_50pct', 'key_personnel_change']
    },
    angel: {
      minimumReturn: 0.15,
      exitHorizon: 7,
      liquidationPreference: 1.0,
      antiDilution: false,
      dragAlongRights: false,
      tagAlongRights: true,
      vetoRights: []
    },
    consortium: {
      minimumReturn: 0.18,
      exitHorizon: 6,
      liquidationPreference: 1.5,
      antiDilution: true,
      dragAlongRights: equityPercent >= 40,
      tagAlongRights: true,
      vetoRights: ['major_acquisition', 'debt_over_50pct']
    }
  }
  
  return baseTerms[type] as InvestorTerms
}

function generateInvestorName(type: ExternalInvestor['type']): string {
  const names: Record<ExternalInvestor['type'], string[]> = {
    individual: [
      'Marcus Wellington',
      'Alexandra Chen',
      'Richard Hartley',
      'Sofia Mendez',
      'James Blackwood'
    ],
    fund: [
      'Velocity Capital Partners',
      'Apex Growth Fund',
      'Meridian Ventures',
      'Summit Equity Partners',
      'Horizon Investment Group'
    ],
    corporate: [
      'TechDrive Industries',
      'GlobalMotion Corp',
      'Precision Holdings',
      'Velocity Media Group',
      'Performance Brands International'
    ],
    family_office: [
      'The Harrington Trust',
      'Beaumont Family Capital',
      'Van der Berg Holdings',
      'The Sterling Foundation',
      'Ashworth Private Investments'
    ],
    private_equity: [
      'Blackstone Racing Partners',
      'KKR Motorsport Fund',
      'Carlyle Performance Group',
      'TPG Racing Capital',
      'Apollo Motorsport Ventures'
    ],
    angel: [
      'Tech Angel Syndicate',
      'Racing Ventures Network',
      'Elite Investor Circle',
      'Performance Capital Angels',
      'Motorsport Angel Fund'
    ],
    consortium: [
      'European Racing Consortium',
      'Global Motorsport Alliance',
      'International Racing Partners',
      'Championship Investment Group',
      'Elite Racing Syndicate'
    ]
  }
  
  const options = names[type]
  return options[Math.floor(Math.random() * options.length)]
}

export function acceptInvestorOffer(
  equity: TeamEquityStake,
  offer: InvestorOfferResult,
  week: number,
  year: number
): {
  updatedEquity: TeamEquityStake
  teamTransaction: TeamTransaction
} {
  const updatedEquity: TeamEquityStake = {
    ...equity,
    ownershipPercent: offer.newOwnerOwnership,
    sharesOwned: equity.sharesOwned, // Owner shares don't change, total shares increase
    totalShares: equity.totalShares + offer.investor.sharesOwned,
    externalInvestors: [...equity.externalInvestors, offer.investor],
    currentValuation: equity.currentValuation + offer.investor.investmentAmount
  }
  
  const teamTransaction = createTeamTransaction(
    'income',
    'other',
    offer.investor.investmentAmount,
    `Investment from ${offer.investor.name} for ${offer.investor.ownershipPercent.toFixed(1)}% equity`,
    week,
    year,
    { countsTowardCostCap: false }
  )
  
  return { updatedEquity, teamTransaction }
}

// ============================================
// PERSONAL GUARANTEES
// ============================================

export function createPersonalGuarantee(
  teamLoanId: string,
  teamLoanType: string,
  loanDescription: string,
  loanAmount: number,
  guaranteeType: GuaranteeType,
  maxLiability?: number,
  collateralPropertyIds?: string[],
  week?: number,
  year?: number
): PersonalGuarantee {
  let liability = loanAmount
  
  if (guaranteeType === 'limited' && maxLiability !== undefined) {
    liability = Math.min(loanAmount, maxLiability)
  } else if (guaranteeType === 'property_backed') {
    // Liability would be based on property values, but we'll use the provided max
    liability = maxLiability || loanAmount
  }
  
  return {
    id: generateEquityId('guarantee'),
    teamLoanId,
    teamLoanType,
    loanDescription,
    guaranteeType,
    maxLiability: liability,
    collateralPropertyIds: guaranteeType === 'property_backed' ? collateralPropertyIds : undefined,
    triggerCondition: 'team_default',
    isTriggered: false,
    amountClaimed: 0,
    createdDate: { week: week || 1, year: year || 1 }
  }
}

export function triggerPersonalGuarantee(
  guarantee: PersonalGuarantee,
  amountOwed: number
): {
  amountClaimed: number
  personalTransaction: PersonalTransaction
} {
  const claimAmount = Math.min(amountOwed, guarantee.maxLiability)
  
  const personalTransaction = createPersonalTransaction(
    'expense',
    'other_expense',
    claimAmount,
    `Personal guarantee triggered: ${guarantee.loanDescription}`,
    0, 0 // Week/year should be provided by caller
  )
  
  return {
    amountClaimed: claimAmount,
    personalTransaction
  }
}

// ============================================
// EQUITY SUMMARY
// ============================================

export interface EquitySummary {
  ownershipPercent: number
  totalInvested: number
  currentValue: number
  unrealizedGain: number
  unrealizedGainPercent: number
  totalDividends: number
  totalReturn: number
  totalReturnPercent: number
  externalInvestorCount: number
  externalInvestorEquity: number
}

export function calculateEquitySummary(equity: TeamEquityStake): EquitySummary {
  const currentValue = equity.currentValuation * (equity.ownershipPercent / 100)
  const unrealizedGain = currentValue - equity.totalInvested
  const unrealizedGainPercent = equity.totalInvested > 0 
    ? (unrealizedGain / equity.totalInvested) * 100 
    : 0
  
  const totalReturn = unrealizedGain + equity.totalDividendsReceived
  const totalReturnPercent = equity.totalInvested > 0 
    ? (totalReturn / equity.totalInvested) * 100 
    : 0
  
  const externalInvestorEquity = equity.externalInvestors.reduce(
    (sum, inv) => sum + inv.ownershipPercent, 0
  )
  
  return {
    ownershipPercent: equity.ownershipPercent,
    totalInvested: equity.totalInvested,
    currentValue,
    unrealizedGain,
    unrealizedGainPercent,
    totalDividends: equity.totalDividendsReceived,
    totalReturn,
    totalReturnPercent,
    externalInvestorCount: equity.externalInvestors.length,
    externalInvestorEquity
  }
}
