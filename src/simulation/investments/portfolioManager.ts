// ============================================
// PORTFOLIO MANAGER
// ============================================
// Handles stock trading, index fund investments,
// business ventures, and market simulation.

import type {
  Stock,
  StockHolding,
  StockTransaction,
  BusinessVenture,
  BusinessType,
  _BusinessTemplate,
  _STOCKS,
  _INDEX_FUNDS,
  BUSINESS_TEMPLATES,
  MARKET_CONFIG,
  getStockBySymbol,
  calculateBusinessValuation
} from '@/data/investment-config';
  // Only process dividends on quarterly payment weeks
  if (!MARKET_CONFIG.dividendPaymentWeeks.includes(week)) {
    return { updatedHoldings: holdings, transactions: [] }
  }
  
  const transactions: PersonalTransaction[] = []
  
  const updatedHoldings = holdings.map(holding => {
    const stock = stocks.find(s => s.symbol === holding.stockSymbol)
    if (!stock || stock.dividendYield === 0) return holding
    
    // Quarterly dividend = annual yield / 4
    const quarterlyYield = stock.dividendYield / 4
    const dividendAmount = holding.currentValue * quarterlyYield
    
    if (dividendAmount > 0) {
      transactions.push(createPersonalTransaction(
        'income',
        'dividends',
        dividendAmount,
        `Quarterly dividend from ${stock.companyName} (${stock.symbol})`,
        week,
        year,
        { relatedInvestmentId: stock.symbol }
      ))
      
      return {
        ...holding,
        dividendsReceived: holding.dividendsReceived + dividendAmount
      }
    }
    
    return holding
  })
  
  return { updatedHoldings, transactions }
}

// ============================================
// BUSINESS VENTURES
// ============================================

export interface BusinessStartResult {
  success: boolean
  reason?: string
  business?: BusinessVenture
  transaction?: PersonalTransaction
}

export function startBusiness(
  type: BusinessType,
  name: string,
  investmentAmount: number,
  ownershipPercent: number,
  location: string,
  personalCash: number,
  ownerReputation: number,
  week: number,
  year: number
): BusinessStartResult {
  const template = BUSINESS_TEMPLATES[type]
  
  // Check investment bounds
  if (investmentAmount < template.minInvestment) {
    return {
      success: false,
      reason: `Minimum investment for ${template.name} is $${template.minInvestment.toLocaleString()}`
    }
  }
  
  if (investmentAmount > template.maxInvestment) {
    return {
      success: false,
      reason: `Maximum investment for ${template.name} is $${template.maxInvestment.toLocaleString()}`
    }
  }
  
  if (investmentAmount > personalCash) {
    return {
      success: false,
      reason: `Insufficient funds. Need $${investmentAmount.toLocaleString()}, have $${personalCash.toLocaleString()}`
    }
  }
  
  // Check reputation requirement
  if (template.minReputation && ownerReputation < template.minReputation) {
    return {
      success: false,
      reason: `${template.name} requires at least ${template.minReputation} reputation (you have ${ownerReputation})`
    }
  }
  
  // Calculate initial financials
  const monthlyRevenue = Math.round(investmentAmount * template.expectedMonthlyRevenuePerInvestment)
  const monthlyExpenses = Math.round(monthlyRevenue * (1 - template.profitMargin))
  const monthlyProfit = monthlyRevenue - monthlyExpenses
  
  // Add some variance
  const variance = 1 + (Math.random() - 0.5) * MARKET_CONFIG.businessPerformanceVariance
  
  const business: BusinessVenture = {
    id: generateInvestmentId('biz'),
    type,
    name,
    description: template.description,
    investmentAmount,
    ownershipPercent,
    currentValuation: investmentAmount,
    monthlyRevenue: Math.round(monthlyRevenue * variance),
    monthlyExpenses: Math.round(monthlyExpenses * variance),
    monthlyProfit: Math.round(monthlyProfit * variance),
    employeeCount: Math.ceil(investmentAmount / 50000),  // Rough estimate
    reputation: 50,
    customerSatisfaction: 70,
    marketShare: 1,
    status: 'startup',
    monthsOperating: 0,
    synergyWithTeam: template.racingSynergy,
    synergyBonus: template.racingSynergy ? {
      type: template.synergyType!,
      value: template.synergyValue!,
      description: getSynergyDescription(template.synergyType!)
    } : undefined,
    location,
    startDate: { week, year }
  }
  
  const transaction = createPersonalTransaction(
    'expense',
    'other_expense',
    investmentAmount,
    `Investment in ${name} (${template.name}) - ${ownershipPercent}% ownership`,
    week,
    year,
    { relatedInvestmentId: business.id }
  )
  
  return {
    success: true,
    business,
    transaction
  }
}

function getSynergyDescription(type: string): string {
  const descriptions: Record<string, string> = {
    talent_pipeline: 'Discover and develop future racing talent',
    merchandise_boost: 'Boost team merchandise sales',
    sponsor_attraction: 'Attract additional sponsors',
    fan_engagement: 'Increase fan engagement and following'
  }
  return descriptions[type] || ''
}

export function processMonthlyBusiness(
  business: BusinessVenture,
  week: number,
  year: number
): { updatedBusiness: BusinessVenture; transaction: PersonalTransaction | null; event: string | null } {
  // Apply monthly variance
  const variance = 1 + (Math.random() - 0.5) * 0.1  // ±5% monthly variance
  
  const actualProfit = Math.round(business.monthlyProfit * variance * (business.ownershipPercent / 100))
  
  let event: string | null = null
  let newStatus = business.status
  
  // Status progression based on months operating and profitability
  const months = business.monthsOperating + 1
  const template = BUSINESS_TEMPLATES[business.type]
  
  if (months >= 6) {
    if (actualProfit > business.monthlyProfit * 1.2) {
      if (business.status !== 'thriving') {
        newStatus = 'thriving'
        event = `${business.name} is thriving! Exceeding profit expectations.`
      }
    } else if (actualProfit > business.monthlyProfit * 0.8) {
      if (business.status === 'startup') {
        newStatus = months >= 12 ? 'stable' : 'growing'
        event = `${business.name} has reached ${newStatus} status.`
      }
    } else if (actualProfit < business.monthlyProfit * 0.5) {
      if (business.status !== 'struggling') {
        newStatus = 'struggling'
        event = `${business.name} is struggling. Consider intervention.`
      }
    }
  }
  
  // Random failure check (annual probability converted to monthly)
  const monthlyFailureChance = template.failureChance / 12
  if (Math.random() < monthlyFailureChance && business.status === 'struggling') {
    event = `${business.name} has failed and will be closed.`
    // Caller should handle business closure
  }
  
  const updatedBusiness: BusinessVenture = {
    ...business,
    monthsOperating: months,
    status: newStatus,
    currentValuation: calculateBusinessValuation({ ...business, monthsOperating: months }, months * 4),
    // Update satisfaction based on profitability
    customerSatisfaction: Math.min(100, Math.max(20, 
      business.customerSatisfaction + (actualProfit > 0 ? 1 : -2)
    )),
    reputation: Math.min(100, Math.max(0,
      business.reputation + (newStatus === 'thriving' ? 1 : newStatus === 'struggling' ? -1 : 0)
    ))
  }
  
  // Only create income transaction if profitable
  const transaction = actualProfit > 0 ? createPersonalTransaction(
    'income',
    'business_income',
    actualProfit,
    `Monthly profit share from ${business.name}`,
    week,
    year,
    { relatedInvestmentId: business.id }
  ) : null
  
  return { updatedBusiness, transaction, event }
}

// ============================================
// PORTFOLIO SUMMARY
// ============================================

export interface InvestmentPortfolioSummary {
  // Stocks
  stocksValue: number
  stocksGain: number
  stocksGainPercent: number
  stockCount: number
  
  // Index Funds (same structure as stocks)
  indexFundsValue: number
  indexFundsGain: number
  
  // Businesses
  businessesValue: number
  businessesCount: number
  monthlyBusinessIncome: number
  
  // Total
  totalInvestmentsValue: number
  totalInvested: number
  totalGain: number
  totalGainPercent: number
  
  // Diversification
  sectorAllocation: Record<string, number>
}

export function calculateInvestmentPortfolioSummary(
  stockHoldings: StockHolding[],
  businesses: BusinessVenture[]
): InvestmentPortfolioSummary {
  // Stocks
  const stocksValue = stockHoldings.reduce((sum, h) => sum + h.currentValue, 0)
  const stocksInvested = stockHoldings.reduce((sum, h) => sum + h.totalInvested, 0)
  const stocksGain = stocksValue - stocksInvested
  const stocksGainPercent = stocksInvested > 0 ? (stocksGain / stocksInvested) * 100 : 0
  
  // Businesses
  const businessesValue = businesses.reduce((sum, b) => sum + b.currentValuation * (b.ownershipPercent / 100), 0)
  const businessesInvested = businesses.reduce((sum, b) => sum + b.investmentAmount, 0)
  const monthlyBusinessIncome = businesses.reduce((sum, b) => 
    sum + (b.monthlyProfit > 0 ? b.monthlyProfit * (b.ownershipPercent / 100) : 0), 0
  )
  
  // Total
  const totalInvestmentsValue = stocksValue + businessesValue
  const totalInvested = stocksInvested + businessesInvested
  const totalGain = totalInvestmentsValue - totalInvested
  const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0
  
  // Sector allocation
  const sectorAllocation: Record<string, number> = {}
  for (const holding of stockHoldings) {
    sectorAllocation[holding.sector] = (sectorAllocation[holding.sector] || 0) + holding.currentValue
  }
  
  return {
    stocksValue,
    stocksGain,
    stocksGainPercent,
    stockCount: stockHoldings.length,
    indexFundsValue: 0,  // Could add index fund tracking
    indexFundsGain: 0,
    businessesValue,
    businessesCount: businesses.length,
    monthlyBusinessIncome,
    totalInvestmentsValue,
    totalInvested,
    totalGain,
    totalGainPercent,
    sectorAllocation
  }
}
