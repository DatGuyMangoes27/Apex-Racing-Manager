// ============================================
// INVESTMENTS SYSTEM LOGIC
// ============================================
// Handles index funds, real estate, side businesses, and team equity

import {
  IndexFundInvestment,
  RealEstateInvestment,
  SideBusiness,
  TeamEquitySale,
  InvestmentsState,
  TeamTransaction,
  OwnedTeam,
  RiskLevel,
  PropertyType,
  SideBusinessType
} from '@/store/careerStore'
import { INDEX_FUND_TEMPLATES, RealEstateTemplate, REAL_ESTATE_TEMPLATES, SIDE_BUSINESS_TEMPLATES, SideBusinessTemplate } from '@/data/financial-extended-config'
import { createTeamTransaction } from './teamFinances'

let investmentIdCounter = 0

function generateInvestmentId(prefix: string): string {
  return `${prefix}_${Date.now()}_${++investmentIdCounter}`
}

export function purchaseIndexFund(
  fundId: string,
  amount: number,
  currentWeek: number,
  currentYear: number
): { investment: IndexFundInvestment; transaction: TeamTransaction } | { error: string } {
  const template = INDEX_FUND_TEMPLATES.find(f => f.id === fundId)
  if (!template) {
    return { error: 'Invalid fund selected.' }
  }

  if (amount < template.minInvestment) {
    return { error: `Minimum investment is $${template.minInvestment.toLocaleString()}.` }
  }

  const investment: IndexFundInvestment = {
    id: generateInvestmentId('index_fund'),
    type: 'index_fund',
    name: template.name,
    investedAmount: amount,
    currentValue: amount,
    weekPurchased: currentWeek,
    yearPurchased: currentYear,
    riskLevel: template.riskLevel,
    weeklyVolatility: template.weeklyVolatility,
    expectedReturn: (template.expectedReturnMin + template.expectedReturnMax) / 2,
    fundName: template.name,
    shares: Math.floor(amount / template.minInvestment), // Use minInvestment as share price proxy
    purchaseValue: amount
  }

  const transaction = createTeamTransaction(
    'expense',
    'investment_purchase',
    amount,
    `Investment in ${template.name}`,
    currentWeek,
    currentYear,
    { countsTowardCostCap: false }
  )

  return { investment, transaction }
}

export function sellIndexFund(
  investment: IndexFundInvestment,
  percentageToSell: number,
  week: number,
  year: number
): { 
  updatedInvestment: IndexFundInvestment | null; 
  transaction: TeamTransaction; 
  proceeds: number;
  gainLoss: number;
} {
  const sellValue = Math.round(investment.currentValue * (percentageToSell / 100))
  const costBasis = Math.round(investment.investedAmount * (percentageToSell / 100))
  const gainLoss = sellValue - costBasis

  const transaction = createTeamTransaction(
    'income',
    'investment_sale',
    sellValue,
    `Sold ${percentageToSell}% of ${investment.name} (${gainLoss >= 0 ? 'gain' : 'loss'}: $${Math.abs(gainLoss).toLocaleString()})`,
    week,
    year,
    { countsTowardCostCap: false }
  )

  if (percentageToSell >= 100) {
    return { updatedInvestment: null, transaction, proceeds: sellValue, gainLoss }
  }

  const remainingPercent = 1 - (percentageToSell / 100)
  const updatedInvestment: IndexFundInvestment = {
    ...investment,
    investedAmount: Math.round(investment.investedAmount * remainingPercent),
    currentValue: Math.round(investment.currentValue * remainingPercent)
  }

  return { updatedInvestment, transaction, proceeds: sellValue, gainLoss }
}

export function updateIndexFundValue(investment: IndexFundInvestment): IndexFundInvestment {
  // Weekly return with volatility
  const baseWeeklyReturn = investment.expectedReturn / 52 / 100
  const volatility = investment.weeklyVolatility / 100
  
  // Random factor between -volatility and +volatility
  const randomFactor = (Math.random() - 0.5) * 2 * volatility
  const weeklyChange = baseWeeklyReturn + randomFactor

  const newValue = Math.round(investment.currentValue * (1 + weeklyChange))

  return {
    ...investment,
    currentValue: Math.max(1, newValue)  // Never go to 0
  }
}

// ============================================
// REAL ESTATE FUNCTIONS
// ============================================

export function getAvailablePropertyTypes(): RealEstateTemplate[] {
  return Object.values(REAL_ESTATE_TEMPLATES)
}

export function purchaseProperty(
  propertyType: PropertyType,
  location: string,
  customName: string | undefined,
  currentWeek: number,
  currentYear: number
): { investment: RealEstateInvestment; transaction: TeamTransaction } | { error: string } {
  const template = REAL_ESTATE_TEMPLATES[propertyType]
  if (!template) {
    return { error: 'Invalid property type.' }
  }

  // Add some price variance based on location
  const priceVariance = 0.8 + Math.random() * 0.4  // 80% to 120%
  const purchasePrice = Math.round(template.basePurchasePrice * priceVariance)

  const investment: RealEstateInvestment = {
    id: generateInvestmentId('real_estate'),
    type: 'real_estate',
    propertyName: customName || `${location} ${template.name}`,
    propertyType,
    location,
    purchasePrice,
    currentValue: purchasePrice,
    monthlyRentalIncome: Math.round(template.monthlyRentalBase * priceVariance),
    monthlyExpenses: Math.round(template.monthlyExpensesBase * priceVariance),
    occupancyRate: template.occupancyRateBase,
    appreciation: template.appreciationMin + Math.random() * (template.appreciationMax - template.appreciationMin),
    purchasedWeek: currentWeek,
    purchasedYear: currentYear
  }

  const transaction = createTeamTransaction(
    'expense',
    'investment_purchase',
    purchasePrice,
    `Purchased ${investment.propertyName}`,
    currentWeek,
    currentYear,
    { countsTowardCostCap: false }
  )

  return { investment, transaction }
}

export function sellProperty(
  property: RealEstateInvestment,
  week: number,
  year: number
): { transaction: TeamTransaction; proceeds: number; gainLoss: number } {
  const gainLoss = property.currentValue - property.purchasePrice

  const transaction = createTeamTransaction(
    'income',
    'investment_sale',
    property.currentValue,
    `Sold ${property.propertyName} (${gainLoss >= 0 ? 'gain' : 'loss'}: $${Math.abs(gainLoss).toLocaleString()})`,
    week,
    year,
    { countsTowardCostCap: false }
  )

  return { transaction, proceeds: property.currentValue, gainLoss }
}

export function processWeeklyRentalIncome(
  property: RealEstateInvestment,
  week: number,
  year: number
): { transactions: TeamTransaction[]; netIncome: number } {
  const transactions: TeamTransaction[] = []
  
  // Weekly rental income (monthly / 4), adjusted by occupancy
  const weeklyRental = Math.round((property.monthlyRentalIncome / 4) * (property.occupancyRate / 100))
  const weeklyExpenses = Math.round(property.monthlyExpenses / 4)

  if (weeklyRental > 0) {
    transactions.push(createTeamTransaction(
      'income',
      'rental_income',
      weeklyRental,
      `${property.propertyName} rental income`,
      week,
      year,
      { countsTowardCostCap: false }
    ))
  }

  if (weeklyExpenses > 0) {
    transactions.push(createTeamTransaction(
      'expense',
      'business_expense',
      weeklyExpenses,
      `${property.propertyName} operating expenses`,
      week,
      year,
      { countsTowardCostCap: false }
    ))
  }

  return { transactions, netIncome: weeklyRental - weeklyExpenses }
}

export function updatePropertyValue(property: RealEstateInvestment): RealEstateInvestment {
  // Weekly appreciation (annual rate / 52)
  const weeklyAppreciation = property.appreciation / 100 / 52
  const newValue = Math.round(property.currentValue * (1 + weeklyAppreciation))

  // Small random occupancy fluctuation
  const occupancyChange = (Math.random() - 0.5) * 2  // ±1%
  const newOccupancy = Math.max(50, Math.min(100, property.occupancyRate + occupancyChange))

  return {
    ...property,
    currentValue: newValue,
    occupancyRate: Math.round(newOccupancy)
  }
}

// ============================================
// SIDE BUSINESS FUNCTIONS
// ============================================

export function getAvailableBusinessTypes(): SideBusinessTemplate[] {
  return Object.values(SIDE_BUSINESS_TEMPLATES)
}

export function startSideBusiness(
  businessType: SideBusinessType,
  businessName: string,
  location: string,
  investmentAmount: number,
  currentWeek: number,
  currentYear: number
): { business: SideBusiness; transaction: TeamTransaction } | { error: string } {
  const template = SIDE_BUSINESS_TEMPLATES[businessType]
  if (!template) {
    return { error: 'Invalid business type.' }
  }

  if (investmentAmount < template.initialInvestmentMin) {
    return { error: `Minimum investment is $${template.initialInvestmentMin.toLocaleString()}.` }
  }

  if (investmentAmount > template.initialInvestmentMax) {
    return { error: `Maximum investment is $${template.initialInvestmentMax.toLocaleString()}.` }
  }

  // Investment amount affects starting revenue
  const investmentRatio = (investmentAmount - template.initialInvestmentMin) / 
    (template.initialInvestmentMax - template.initialInvestmentMin)
  const revenueMultiplier = 0.8 + investmentRatio * 0.4  // 80% to 120% of base

  const business: SideBusiness = {
    id: generateInvestmentId('side_business'),
    type: 'side_business',
    businessName,
    businessType,
    location,
    initialInvestment: investmentAmount,
    weeklyRevenue: Math.round(template.weeklyRevenueBase * revenueMultiplier),
    weeklyExpenses: template.weeklyExpensesBase,
    reputation: 50,  // Start at neutral
    staffCount: template.staffRequired,
    upgradeLevel: 0,
    founded: { week: currentWeek, year: currentYear },
    name: businessName,
    level: 0
  }

  const transaction = createTeamTransaction(
    'expense',
    'investment_purchase',
    investmentAmount,
    `Started ${businessName} (${template.name})`,
    currentWeek,
    currentYear,
    { countsTowardCostCap: false }
  )

  return { business, transaction }
}

export function sellSideBusiness(
  business: SideBusiness,
  week: number,
  year: number
): { transaction: TeamTransaction; proceeds: number } {
  // Business value based on revenue and reputation
  const template = SIDE_BUSINESS_TEMPLATES[business.businessType]
  const revenueMultiple = 26  // 6 months of revenue
  const reputationMultiplier = 0.5 + (business.reputation / 100)  // 0.5x to 1.5x
  
  // Include upgrade value
  const upgradeValue = template.upgradeCosts.slice(0, business.upgradeLevel + 1).reduce((a, b) => a + b, 0) * 0.5

  const baseValue = (business.weeklyRevenue - business.weeklyExpenses) * revenueMultiple
  const totalValue = Math.round((baseValue + upgradeValue) * reputationMultiplier)
  const proceeds = Math.max(1000, totalValue)  // Minimum sale value

  const transaction = createTeamTransaction(
    'income',
    'investment_sale',
    proceeds,
    `Sold ${business.businessName}`,
    week,
    year,
    { countsTowardCostCap: false }
  )

  return { transaction, proceeds }
}

export function upgradeSideBusiness(
  business: SideBusiness,
  week: number,
  year: number
): { updatedBusiness: SideBusiness; transaction: TeamTransaction } | { error: string } {
  const template = SIDE_BUSINESS_TEMPLATES[business.businessType]

  if (business.upgradeLevel >= template.upgradeCount) {
    return { error: 'Business is already at maximum upgrade level.' }
  }

  const upgradeCost = template.upgradeCosts[business.upgradeLevel + 1]
  const newMultiplier = template.upgradeMultipliers[business.upgradeLevel + 1]

  const updatedBusiness: SideBusiness = {
    ...business,
    upgradeLevel: business.upgradeLevel + 1,
    weeklyRevenue: Math.round(template.weeklyRevenueBase * newMultiplier),
    weeklyExpenses: Math.round(template.weeklyExpensesBase * (1 + business.upgradeLevel * 0.1))  // Expenses grow slightly
  }

  const transaction = createTeamTransaction(
    'expense',
    'investment_purchase',
    upgradeCost,
    `Upgraded ${business.businessName} to level ${business.upgradeLevel + 1}`,
    week,
    year,
    { countsTowardCostCap: false }
  )

  return { updatedBusiness, transaction }
}

export function processWeeklySideBusinessRevenue(
  business: SideBusiness,
  week: number,
  year: number
): { transactions: TeamTransaction[]; netIncome: number; updatedBusiness: SideBusiness } {
  const transactions: TeamTransaction[] = []

  // Revenue adjusted by reputation
  const reputationMultiplier = 0.5 + (business.reputation / 100)  // 0.5x to 1.5x
  const adjustedRevenue = Math.round(business.weeklyRevenue * reputationMultiplier)

  if (adjustedRevenue > 0) {
    transactions.push(createTeamTransaction(
      'income',
      'business_revenue',
      adjustedRevenue,
      `${business.businessName} weekly revenue`,
      week,
      year,
      { countsTowardCostCap: false }
    ))
  }

  if (business.weeklyExpenses > 0) {
    transactions.push(createTeamTransaction(
      'expense',
      'business_expense',
      business.weeklyExpenses,
      `${business.businessName} operating expenses`,
      week,
      year,
      { countsTowardCostCap: false }
    ))
  }

  // Update reputation based on profitability
  const template = SIDE_BUSINESS_TEMPLATES[business.businessType]
  const netIncome = adjustedRevenue - business.weeklyExpenses
  let reputationChange = 0

  if (netIncome > 0) {
    reputationChange = template.reputationGrowthRate
  } else if (netIncome < 0) {
    reputationChange = -template.reputationGrowthRate * 0.5
  }

  // Random small fluctuation
  reputationChange += (Math.random() - 0.5) * 0.5

  const updatedBusiness: SideBusiness = {
    ...business,
    reputation: Math.max(0, Math.min(100, business.reputation + reputationChange))
  }

  return { transactions, netIncome, updatedBusiness }
}

// ============================================
// TEAM EQUITY SALE FUNCTIONS
// ============================================

export function sellTeamEquity(
  percentageToSell: number,
  investorName: string | undefined,
  currentOwnershipPercentage: number,
  teamValuation: number,
  votingRights: boolean,
  specialTerms: string | undefined,
  week: number,
  year: number
): { equitySale: TeamEquitySale; transaction: TeamTransaction; newOwnershipPercentage: number } | { error: string } {
  if (percentageToSell <= 0 || percentageToSell > 49) {
    return { error: 'You can sell between 0.1% and 49% equity in a single transaction.' }
  }

  const newOwnership = currentOwnershipPercentage - percentageToSell
  if (newOwnership < 51) {
    return { error: 'You must retain at least 51% ownership to maintain control.' }
  }

  const salePrice = Math.round(teamValuation * (percentageToSell / 100))

  const equitySale: TeamEquitySale = {
    id: generateInvestmentId('equity_sale'),
    investorName: investorName || getRandomInvestorName(),
    percentageSold: percentageToSell,
    salePrice,
    soldWeek: week,
    soldYear: year,
    specialTerms,
    votingRights
  }

  const transaction = createTeamTransaction(
    'income',
    'equity_sale',
    salePrice,
    `Sold ${percentageToSell.toFixed(1)}% equity to ${equitySale.investorName}`,
    week,
    year,
    { countsTowardCostCap: false }
  )

  return { equitySale, transaction, newOwnershipPercentage: newOwnership }
}

// ============================================
// INVESTMENTS STATE AGGREGATION
// ============================================

export function calculateInvestmentsStateTotals(
  indexFunds: IndexFundInvestment[],
  realEstate: RealEstateInvestment[],
  sideBusinesses: SideBusiness[],
  equitySales: TeamEquitySale[]
): Partial<InvestmentsState> {
  // Portfolio value
  const fundValue = indexFunds.reduce((sum, f) => sum + f.currentValue, 0)
  const propertyValue = realEstate.reduce((sum, p) => sum + p.currentValue, 0)
  const businessValue = sideBusinesses.reduce((sum, b) => {
    // Estimate business value at 26x weekly net income
    const netWeekly = b.weeklyRevenue - b.weeklyExpenses
    return sum + Math.max(0, netWeekly * 26)
  }, 0)
  const portfolioValue = fundValue + propertyValue + businessValue

  // Total invested (original cost basis)
  const totalInvested = indexFunds.reduce((sum, f) => sum + f.investedAmount, 0) +
    realEstate.reduce((sum, p) => sum + p.purchasePrice, 0) +
    sideBusinesses.reduce((sum, b) => sum + b.initialInvestment, 0)

  // Weekly passive income estimate
  const weeklyRentalIncome = realEstate.reduce((sum, p) => {
    const weeklyRental = Math.round((p.monthlyRentalIncome / 4) * (p.occupancyRate / 100))
    const weeklyExpenses = Math.round(p.monthlyExpenses / 4)
    return sum + weeklyRental - weeklyExpenses
  }, 0)

  const weeklyBusinessIncome = sideBusinesses.reduce((sum, b) => {
    const reputationMultiplier = 0.5 + (b.reputation / 100)
    const adjustedRevenue = Math.round(b.weeklyRevenue * reputationMultiplier)
    return sum + adjustedRevenue - b.weeklyExpenses
  }, 0)

  // Dividends from funds (estimated weekly portion of annual return)
  const weeklyDividends = indexFunds.reduce((sum, f) => {
    const annualDividend = f.currentValue * (f.expectedReturn / 100) * 0.3  // 30% of return as dividends
    return sum + Math.round(annualDividend / 52)
  }, 0)

  const weeklyPassiveIncome = weeklyRentalIncome + weeklyBusinessIncome + weeklyDividends

  // Ownership percentage
  const totalEquitySold = equitySales.reduce((sum, es) => sum + es.percentageSold, 0)
  const ownershipPercentage = 100 - totalEquitySold

  return {
    totalInvested,
    weeklyPassiveIncome,
    portfolioValue,
    ownershipPercentage
  }
}

// ============================================
// WEEKLY PROCESSING
// ============================================

export interface WeeklyInvestmentsProcessingResult {
  updatedInvestments: InvestmentsState
  transactions: TeamTransaction[]
  totalIncome: number
  totalExpenses: number
}

export function processWeeklyInvestments(
  investmentsState: InvestmentsState,
  week: number,
  year: number
): WeeklyInvestmentsProcessingResult {
  const transactions: TeamTransaction[] = []
  let totalIncome = 0
  let totalExpenses = 0

  // Update index fund values
  const updatedIndexFunds = investmentsState.indexFunds.map(fund => {
    return updateIndexFundValue(fund)
  })

  // Process real estate
  const updatedRealEstate: RealEstateInvestment[] = []
  investmentsState.realEstate.forEach(property => {
    const result = processWeeklyRentalIncome(property, week, year)
    transactions.push(...result.transactions)
    
    if (result.netIncome > 0) {
      totalIncome += result.netIncome
    } else {
      totalExpenses += Math.abs(result.netIncome)
    }

    updatedRealEstate.push(updatePropertyValue(property))
  })

  // Process side businesses
  const updatedBusinesses: SideBusiness[] = []
  investmentsState.sideBusinesses.forEach(business => {
    const result = processWeeklySideBusinessRevenue(business, week, year)
    transactions.push(...result.transactions)
    
    if (result.netIncome > 0) {
      totalIncome += result.netIncome
    } else {
      totalExpenses += Math.abs(result.netIncome)
    }

    updatedBusinesses.push(result.updatedBusiness)
  })

  // Pay quarterly dividends (every 13 weeks)
  if (week % 13 === 0) {
    updatedIndexFunds.forEach(fund => {
      const quarterlyDividend = Math.round(fund.currentValue * (fund.expectedReturn / 100) * 0.3 / 4)
      if (quarterlyDividend > 0) {
        transactions.push(createTeamTransaction(
          'income',
          'dividend',
          quarterlyDividend,
          `${fund.name} quarterly dividend`,
          week,
          year,
          { countsTowardCostCap: false }
        ))
        totalIncome += quarterlyDividend
      }
    })
  }

  // Calculate totals
  const totals = calculateInvestmentsStateTotals(
    updatedIndexFunds,
    updatedRealEstate,
    updatedBusinesses,
    investmentsState.equitySales
  )

  const updatedInvestments: InvestmentsState = {
    ...investmentsState,
    indexFunds: updatedIndexFunds,
    realEstate: updatedRealEstate,
    sideBusinesses: updatedBusinesses,
    ...totals
  }

  return {
    updatedInvestments,
    transactions,
    totalIncome,
    totalExpenses
  }
}
