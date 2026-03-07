// ============================================
// PORTFOLIO MANAGER
// ============================================
// Handles stock trading, index fund investments,
// business ventures, and market simulation.

import {
  type Stock,
  type StockHolding,
  type StockTransaction,
  type BusinessVenture,
  type BusinessType,
  type BusinessTemplate,
  STOCKS,
  INDEX_FUNDS,
  BUSINESS_TEMPLATES,
  MARKET_CONFIG,
  getStockBySymbol,
  calculateBusinessValuation
} from '@/data/investment-config';
import type { PersonalTransaction } from '@/data/personal-finance-config';
import { createPersonalTransaction } from '@/simulation/finances/personalFinances';

// ============================================
// ID GENERATION
// ============================================

let investmentIdCounter = 0
function generateInvestmentId(prefix: string): string {
  return `${prefix}_${Date.now()}_${++investmentIdCounter}`
}

// ============================================
// STOCK BUY / SELL
// ============================================

export interface BuyStockResult {
  success: boolean
  reason?: string
  holding?: StockHolding
  transaction?: PersonalTransaction
}

export function buyStock(
  symbol: string,
  shares: number,
  personalCash: number,
  week: number,
  year: number,
  existingHoldings: StockHolding[]
): BuyStockResult {
  const stock = getStockBySymbol(symbol)
  if (!stock) return { success: false, reason: 'Invalid stock symbol.' }
  if (shares < 1) return { success: false, reason: 'Must buy at least 1 share.' }

  const totalCost = Math.round(stock.currentPrice * shares)
  if (totalCost > personalCash) {
    return {
      success: false,
      reason: `Insufficient funds. Need $${totalCost.toLocaleString()}, have $${personalCash.toLocaleString()}`
    }
  }

  const transaction = createPersonalTransaction(
    'expense',
    'other_expense',
    totalCost,
    `Stock purchase: ${shares} shares of ${stock.companyName} (${symbol})`,
    week,
    year,
    { relatedInvestmentId: symbol }
  )

  const existing = existingHoldings.find(h => h.stockSymbol === symbol)
  const avgPurchasePrice = existing
    ? (existing.avgPurchasePrice * existing.shares + stock.currentPrice * shares) / (existing.shares + shares)
    : stock.currentPrice
  const totalInvested = existing ? existing.totalInvested + totalCost : totalCost
  const newShares = existing ? existing.shares + shares : shares
  const currentValue = Math.round(stock.currentPrice * newShares)
  const unrealizedGain = currentValue - totalInvested
  const unrealizedGainPercent = totalInvested > 0 ? (unrealizedGain / totalInvested) * 100 : 0

  const holding: StockHolding = {
    stockSymbol: symbol,
    companyName: stock.companyName,
    sector: stock.sector,
    shares: newShares,
    avgPurchasePrice: Math.round(avgPurchasePrice * 100) / 100,
    totalInvested,
    currentPrice: stock.currentPrice,
    currentValue,
    unrealizedGain,
    unrealizedGainPercent,
    purchaseDate: existing ? existing.purchaseDate : { week, year },
    dividendsReceived: existing ? existing.dividendsReceived : 0
  }

  return { success: true, holding, transaction }
}

export interface SellStockResult {
  success: boolean
  reason?: string
  updatedHoldings: StockHolding[]
  transaction?: PersonalTransaction
  proceeds: number
}

export function sellStock(
  holdings: StockHolding[],
  symbol: string,
  sharesToSell: number,
  week: number,
  year: number,
  stocks: Stock[]
): SellStockResult {
  const stock = stocks.find(s => s.symbol === symbol)
  const holding = holdings.find(h => h.stockSymbol === symbol)
  if (!holding) return { success: false, reason: 'You do not own this stock.', updatedHoldings: holdings }
  if (sharesToSell < 1) return { success: false, reason: 'Must sell at least 1 share.', updatedHoldings: holdings }
  if (sharesToSell > holding.shares) {
    return { success: false, reason: `You only own ${holding.shares} shares.`, updatedHoldings: holdings }
  }

  const pricePerShare = stock ? stock.currentPrice : holding.currentPrice
  const proceeds = Math.round(pricePerShare * sharesToSell)
  const transaction = createPersonalTransaction(
    'income',
    'other_income',
    proceeds,
    `Stock sale: ${sharesToSell} shares of ${holding.companyName} (${symbol})`,
    week,
    year,
    { relatedInvestmentId: symbol }
  )

  if (sharesToSell >= holding.shares) {
    return {
      success: true,
      updatedHoldings: holdings.filter(h => h.stockSymbol !== symbol),
      transaction,
      proceeds
    }
  }

  const remainingShares = holding.shares - sharesToSell
  const remainingInvested = Math.round(holding.totalInvested * (remainingShares / holding.shares))
  const currentValue = Math.round(pricePerShare * remainingShares)
  const unrealizedGain = currentValue - remainingInvested
  const updatedHolding: StockHolding = {
    ...holding,
    shares: remainingShares,
    totalInvested: remainingInvested,
    currentValue,
    unrealizedGain,
    unrealizedGainPercent: remainingInvested > 0 ? (unrealizedGain / remainingInvested) * 100 : 0
  }
  const updatedHoldings = holdings.map(h => (h.stockSymbol === symbol ? updatedHolding : h))
  return { success: true, updatedHoldings, transaction, proceeds }
}

// ============================================
// WEEKLY STOCK PRICE UPDATE
// ============================================

/** Volatility to weekly price move (approximate) */
const VOLATILITY_MULT: Record<string, number> = {
  very_low: 0.002,
  low: 0.005,
  medium: 0.012,
  high: 0.02,
  very_high: 0.035
}

export function updateStockPricesForHoldings(
  holdings: StockHolding[],
  stocks: Stock[]
): StockHolding[] {
  return holdings.map(holding => {
    const stock = stocks.find(s => s.symbol === holding.stockSymbol)
    if (!stock) return holding
    const mult = VOLATILITY_MULT[stock.volatility] ?? 0.01
    const change = (Math.random() - 0.5) * 2 * mult
    const newPrice = Math.max(stock.weekLow52 * 0.5, Math.min(stock.weekHigh52 * 1.2, stock.currentPrice * (1 + change)))
    const newPriceRounded = Math.round(newPrice * 100) / 100
    const currentValue = Math.round(newPriceRounded * holding.shares)
    const unrealizedGain = currentValue - holding.totalInvested
    return {
      ...holding,
      currentPrice: newPriceRounded,
      currentValue,
      unrealizedGain,
      unrealizedGainPercent: holding.totalInvested > 0 ? (unrealizedGain / holding.totalInvested) * 100 : 0
    }
  })
}

export function processDividends(
  holdings: StockHolding[],
  stocks: Stock[],
  week: number,
  year: number
): { updatedHoldings: StockHolding[]; transactions: PersonalTransaction[] } {
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
