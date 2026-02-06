// ============================================
// INVESTMENT PORTFOLIO CONFIGURATION
// ============================================
// Configuration for stocks, index funds, and business ventures.

// ============================================
// STOCK MARKET
// ============================================

export type MarketSector = 
  | 'automotive'
  | 'tech'
  | 'energy'
  | 'consumer'
  | 'finance'
  | 'healthcare'
  | 'industrial'
  | 'materials'
  | 'luxury'
  | 'entertainment'

export type StockVolatility = 'very_low' | 'low' | 'medium' | 'high' | 'very_high'

export interface Stock {
  symbol: string
  companyName: string
  sector: MarketSector
  description: string
  
  // Price info
  currentPrice: number
  previousClose: number
  weekHigh52: number
  weekLow52: number
  
  // Characteristics
  volatility: StockVolatility
  dividendYield: number      // Annual % dividend
  marketCap: 'small' | 'mid' | 'large' | 'mega'
  
  // Racing relevance
  racingRelevance?: 'manufacturer' | 'sponsor' | 'partner' | 'competitor'
  synergyBonus?: number      // Bonus if you own shares in related companies
}

export interface StockHolding {
  stockSymbol: string
  companyName: string
  sector: MarketSector
  
  shares: number
  avgPurchasePrice: number
  totalInvested: number
  
  currentPrice: number
  currentValue: number
  unrealizedGain: number
  unrealizedGainPercent: number
  
  purchaseDate: { week: number; year: number }
  dividendsReceived: number
}

export interface StockTransaction {
  id: string
  stockSymbol: string
  type: 'buy' | 'sell'
  shares: number
  pricePerShare: number
  totalAmount: number
  date: { week: number; year: number }
  fees: number
}

// ============================================
// STOCK DATABASE
// ============================================

export const STOCKS: Stock[] = [
  // Automotive sector (racing relevance)
  {
    symbol: 'POR',
    companyName: 'Porsche AG',
    sector: 'automotive',
    description: 'Premium sports car and racing manufacturer',
    currentPrice: 95,
    previousClose: 94,
    weekHigh52: 120,
    weekLow52: 75,
    volatility: 'medium',
    dividendYield: 0.02,
    marketCap: 'mega',
    racingRelevance: 'manufacturer',
    synergyBonus: 5
  },
  {
    symbol: 'FCAU',
    companyName: 'Ferrari NV',
    sector: 'automotive',
    description: 'Legendary Italian supercar manufacturer',
    currentPrice: 380,
    previousClose: 375,
    weekHigh52: 420,
    weekLow52: 280,
    volatility: 'medium',
    dividendYield: 0.008,
    marketCap: 'large',
    racingRelevance: 'manufacturer',
    synergyBonus: 5
  },
  {
    symbol: 'BMW',
    companyName: 'BMW Group',
    sector: 'automotive',
    description: 'German luxury automaker with motorsport heritage',
    currentPrice: 105,
    previousClose: 103,
    weekHigh52: 125,
    weekLow52: 85,
    volatility: 'medium',
    dividendYield: 0.045,
    marketCap: 'mega',
    racingRelevance: 'manufacturer',
    synergyBonus: 4
  },
  {
    symbol: 'TSLA',
    companyName: 'Tesla Inc',
    sector: 'automotive',
    description: 'Electric vehicle and clean energy company',
    currentPrice: 245,
    previousClose: 240,
    weekHigh52: 380,
    weekLow52: 140,
    volatility: 'very_high',
    dividendYield: 0,
    marketCap: 'mega'
  },
  {
    symbol: 'MRCDS',
    companyName: 'Mercedes-Benz Group',
    sector: 'automotive',
    description: 'German luxury automaker with F1 involvement',
    currentPrice: 75,
    previousClose: 74,
    weekHigh52: 90,
    weekLow52: 55,
    volatility: 'medium',
    dividendYield: 0.065,
    marketCap: 'mega',
    racingRelevance: 'manufacturer',
    synergyBonus: 5
  },
  
  // Tech sector
  {
    symbol: 'NVDA',
    companyName: 'NVIDIA Corp',
    sector: 'tech',
    description: 'GPU and AI computing leader, sim racing hardware',
    currentPrice: 485,
    previousClose: 480,
    weekHigh52: 520,
    weekLow52: 220,
    volatility: 'very_high',
    dividendYield: 0.001,
    marketCap: 'mega',
    racingRelevance: 'partner',
    synergyBonus: 3
  },
  {
    symbol: 'AMD',
    companyName: 'AMD Inc',
    sector: 'tech',
    description: 'Semiconductor company, gaming and simulation',
    currentPrice: 145,
    previousClose: 143,
    weekHigh52: 165,
    weekLow52: 90,
    volatility: 'high',
    dividendYield: 0,
    marketCap: 'large'
  },
  {
    symbol: 'AAPL',
    companyName: 'Apple Inc',
    sector: 'tech',
    description: 'Consumer electronics giant',
    currentPrice: 185,
    previousClose: 184,
    weekHigh52: 200,
    weekLow52: 155,
    volatility: 'low',
    dividendYield: 0.005,
    marketCap: 'mega'
  },
  
  // Energy sector
  {
    symbol: 'SHEL',
    companyName: 'Shell PLC',
    sector: 'energy',
    description: 'Energy company with motorsport sponsorship history',
    currentPrice: 62,
    previousClose: 61,
    weekHigh52: 70,
    weekLow52: 50,
    volatility: 'medium',
    dividendYield: 0.04,
    marketCap: 'mega',
    racingRelevance: 'sponsor',
    synergyBonus: 3
  },
  {
    symbol: 'XOM',
    companyName: 'ExxonMobil',
    sector: 'energy',
    description: 'Oil and gas supermajor with fuel partnerships',
    currentPrice: 105,
    previousClose: 104,
    weekHigh52: 120,
    weekLow52: 90,
    volatility: 'medium',
    dividendYield: 0.035,
    marketCap: 'mega',
    racingRelevance: 'sponsor',
    synergyBonus: 2
  },
  
  // Consumer/Luxury
  {
    symbol: 'LVMH',
    companyName: 'LVMH Moët Hennessy',
    sector: 'luxury',
    description: 'Luxury goods conglomerate with F1 sponsorship',
    currentPrice: 740,
    previousClose: 735,
    weekHigh52: 900,
    weekLow52: 620,
    volatility: 'medium',
    dividendYield: 0.018,
    marketCap: 'mega',
    racingRelevance: 'sponsor',
    synergyBonus: 4
  },
  {
    symbol: 'ROL',
    companyName: 'Rolex SA',
    sector: 'luxury',
    description: 'Luxury watch brand with motorsport heritage',
    currentPrice: 520,
    previousClose: 515,
    weekHigh52: 580,
    weekLow52: 450,
    volatility: 'low',
    dividendYield: 0,
    marketCap: 'large',
    racingRelevance: 'sponsor',
    synergyBonus: 5
  },
  {
    symbol: 'RBULL',
    companyName: 'Red Bull GmbH',
    sector: 'consumer',
    description: 'Energy drink company with major racing involvement',
    currentPrice: 180,
    previousClose: 178,
    weekHigh52: 210,
    weekLow52: 150,
    volatility: 'medium',
    dividendYield: 0,
    marketCap: 'large',
    racingRelevance: 'competitor',
    synergyBonus: -2  // Competitor - negative synergy
  },
  
  // Entertainment
  {
    symbol: 'EA',
    companyName: 'Electronic Arts',
    sector: 'entertainment',
    description: 'Gaming company with F1 and racing titles',
    currentPrice: 135,
    previousClose: 133,
    weekHigh52: 150,
    weekLow52: 110,
    volatility: 'medium',
    dividendYield: 0.006,
    marketCap: 'large',
    racingRelevance: 'partner',
    synergyBonus: 2
  },
  
  // Finance
  {
    symbol: 'JPM',
    companyName: 'JPMorgan Chase',
    sector: 'finance',
    description: 'Major investment bank',
    currentPrice: 195,
    previousClose: 193,
    weekHigh52: 215,
    weekLow52: 155,
    volatility: 'medium',
    dividendYield: 0.025,
    marketCap: 'mega'
  },
  {
    symbol: 'UBSG',
    companyName: 'UBS Group',
    sector: 'finance',
    description: 'Swiss banking giant with motorsport connections',
    currentPrice: 28,
    previousClose: 27.5,
    weekHigh52: 32,
    weekLow52: 22,
    volatility: 'medium',
    dividendYield: 0.04,
    marketCap: 'large',
    racingRelevance: 'sponsor',
    synergyBonus: 2
  }
]

// ============================================
// INDEX FUNDS
// ============================================

export interface IndexFund {
  symbol: string
  name: string
  description: string
  composition: MarketSector[]   // Sectors included
  
  currentPrice: number
  expenseRatio: number         // Annual fee %
  dividendYield: number
  volatility: StockVolatility
  
  annualizedReturn5Year: number  // Historical return
}

export const INDEX_FUNDS: IndexFund[] = [
  {
    symbol: 'VWRL',
    name: 'Global All-Cap Index',
    description: 'Diversified exposure to global equities',
    composition: ['tech', 'finance', 'healthcare', 'consumer', 'industrial', 'energy'],
    currentPrice: 95,
    expenseRatio: 0.002,
    dividendYield: 0.02,
    volatility: 'low',
    annualizedReturn5Year: 0.08
  },
  {
    symbol: 'QQQ',
    name: 'Tech Index Fund',
    description: 'Focused exposure to technology sector',
    composition: ['tech'],
    currentPrice: 380,
    expenseRatio: 0.002,
    dividendYield: 0.005,
    volatility: 'high',
    annualizedReturn5Year: 0.15
  },
  {
    symbol: 'LUXF',
    name: 'Luxury & Consumer Fund',
    description: 'Premium brands and luxury goods',
    composition: ['luxury', 'consumer'],
    currentPrice: 145,
    expenseRatio: 0.004,
    dividendYield: 0.012,
    volatility: 'medium',
    annualizedReturn5Year: 0.10
  },
  {
    symbol: 'AUTOF',
    name: 'Automotive Industry Fund',
    description: 'Global automotive and mobility sector',
    composition: ['automotive'],
    currentPrice: 78,
    expenseRatio: 0.003,
    dividendYield: 0.025,
    volatility: 'medium',
    annualizedReturn5Year: 0.06
  },
  {
    symbol: 'DIVD',
    name: 'High Dividend Fund',
    description: 'Stable companies with strong dividends',
    composition: ['finance', 'energy', 'industrial'],
    currentPrice: 52,
    expenseRatio: 0.003,
    dividendYield: 0.045,
    volatility: 'very_low',
    annualizedReturn5Year: 0.07
  }
]

// ============================================
// BUSINESS VENTURES
// ============================================

export type BusinessType = 
  | 'racing_school'
  | 'dealership'
  | 'merchandise_store'
  | 'esports_team'
  | 'restaurant'
  | 'gym_fitness'
  | 'karting_track'
  | 'sim_racing_center'
  | 'automotive_shop'
  | 'media_production'

export interface BusinessVenture {
  id: string
  type: BusinessType
  name: string
  description: string
  
  // Ownership
  investmentAmount: number
  ownershipPercent: number
  currentValuation: number
  
  // Operations
  monthlyRevenue: number
  monthlyExpenses: number
  monthlyProfit: number
  employeeCount: number
  
  // Performance
  reputation: number       // 0-100
  customerSatisfaction: number  // 0-100
  marketShare: number      // % in local market
  
  // Status
  status: 'startup' | 'growing' | 'stable' | 'struggling' | 'thriving'
  monthsOperating: number
  
  // Racing synergies
  synergyWithTeam: boolean
  synergyBonus?: {
    type: 'talent_pipeline' | 'merchandise_boost' | 'sponsor_attraction' | 'fan_engagement'
    value: number
    description: string
  }
  
  // Location
  location: string
  
  startDate: { week: number; year: number }
}

// ============================================
// BUSINESS TEMPLATES
// ============================================

export interface BusinessTemplate {
  type: BusinessType
  name: string
  description: string
  
  // Costs
  minInvestment: number
  maxInvestment: number
  
  // Expected performance
  expectedMonthlyRevenuePerInvestment: number  // Revenue as % of investment
  profitMargin: number                         // % of revenue that's profit
  breakEvenMonths: number
  
  // Risk profile
  riskLevel: 'low' | 'medium' | 'high' | 'very_high'
  failureChance: number                        // Annual % chance of failure
  
  // Racing relevance
  racingSynergy: boolean
  synergyType?: 'talent_pipeline' | 'merchandise_boost' | 'sponsor_attraction' | 'fan_engagement'
  synergyValue?: number
  
  // Requirements
  minReputation?: number                       // Owner reputation needed
  requiresRacingExperience?: boolean
}

export const BUSINESS_TEMPLATES: Record<BusinessType, BusinessTemplate> = {
  racing_school: {
    type: 'racing_school',
    name: 'Racing Driver School',
    description: 'Train the next generation of racing talent',
    minInvestment: 500000,
    maxInvestment: 3000000,
    expectedMonthlyRevenuePerInvestment: 0.02,  // 2% of investment monthly
    profitMargin: 0.25,
    breakEvenMonths: 18,
    riskLevel: 'medium',
    failureChance: 0.08,
    racingSynergy: true,
    synergyType: 'talent_pipeline',
    synergyValue: 15,
    minReputation: 40,
    requiresRacingExperience: true
  },
  dealership: {
    type: 'dealership',
    name: 'Exotic Car Dealership',
    description: 'Sell high-end sports and luxury vehicles',
    minInvestment: 2000000,
    maxInvestment: 10000000,
    expectedMonthlyRevenuePerInvestment: 0.025,
    profitMargin: 0.08,
    breakEvenMonths: 24,
    riskLevel: 'medium',
    failureChance: 0.10,
    racingSynergy: true,
    synergyType: 'sponsor_attraction',
    synergyValue: 10,
    minReputation: 50
  },
  merchandise_store: {
    type: 'merchandise_store',
    name: 'Racing Merchandise Store',
    description: 'Official team gear and racing memorabilia',
    minInvestment: 100000,
    maxInvestment: 500000,
    expectedMonthlyRevenuePerInvestment: 0.03,
    profitMargin: 0.35,
    breakEvenMonths: 12,
    riskLevel: 'low',
    failureChance: 0.05,
    racingSynergy: true,
    synergyType: 'merchandise_boost',
    synergyValue: 20
  },
  esports_team: {
    type: 'esports_team',
    name: 'Esports Racing Team',
    description: 'Compete in sim racing championships',
    minInvestment: 200000,
    maxInvestment: 2000000,
    expectedMonthlyRevenuePerInvestment: 0.015,
    profitMargin: 0.20,
    breakEvenMonths: 24,
    riskLevel: 'high',
    failureChance: 0.15,
    racingSynergy: true,
    synergyType: 'fan_engagement',
    synergyValue: 15,
    requiresRacingExperience: true
  },
  restaurant: {
    type: 'restaurant',
    name: 'Upscale Restaurant',
    description: 'Fine dining establishment',
    minInvestment: 500000,
    maxInvestment: 3000000,
    expectedMonthlyRevenuePerInvestment: 0.035,
    profitMargin: 0.12,
    breakEvenMonths: 30,
    riskLevel: 'high',
    failureChance: 0.20,
    racingSynergy: false
  },
  gym_fitness: {
    type: 'gym_fitness',
    name: 'Performance Fitness Center',
    description: 'Elite training facility',
    minInvestment: 300000,
    maxInvestment: 1500000,
    expectedMonthlyRevenuePerInvestment: 0.025,
    profitMargin: 0.30,
    breakEvenMonths: 20,
    riskLevel: 'low',
    failureChance: 0.08,
    racingSynergy: false
  },
  karting_track: {
    type: 'karting_track',
    name: 'Karting Track & Venue',
    description: 'Indoor or outdoor karting facility',
    minInvestment: 1000000,
    maxInvestment: 5000000,
    expectedMonthlyRevenuePerInvestment: 0.018,
    profitMargin: 0.25,
    breakEvenMonths: 36,
    riskLevel: 'medium',
    failureChance: 0.10,
    racingSynergy: true,
    synergyType: 'talent_pipeline',
    synergyValue: 10,
    minReputation: 30
  },
  sim_racing_center: {
    type: 'sim_racing_center',
    name: 'Sim Racing Entertainment Center',
    description: 'High-end racing simulators for public use',
    minInvestment: 200000,
    maxInvestment: 1000000,
    expectedMonthlyRevenuePerInvestment: 0.028,
    profitMargin: 0.35,
    breakEvenMonths: 18,
    riskLevel: 'medium',
    failureChance: 0.12,
    racingSynergy: true,
    synergyType: 'fan_engagement',
    synergyValue: 10
  },
  automotive_shop: {
    type: 'automotive_shop',
    name: 'Performance Auto Shop',
    description: 'Tuning and modification shop',
    minInvestment: 150000,
    maxInvestment: 800000,
    expectedMonthlyRevenuePerInvestment: 0.03,
    profitMargin: 0.28,
    breakEvenMonths: 16,
    riskLevel: 'low',
    failureChance: 0.07,
    racingSynergy: false
  },
  media_production: {
    type: 'media_production',
    name: 'Racing Media Company',
    description: 'Content production and broadcasting',
    minInvestment: 300000,
    maxInvestment: 2000000,
    expectedMonthlyRevenuePerInvestment: 0.02,
    profitMargin: 0.22,
    breakEvenMonths: 24,
    riskLevel: 'high',
    failureChance: 0.15,
    racingSynergy: true,
    synergyType: 'fan_engagement',
    synergyValue: 12,
    minReputation: 45
  }
}

// ============================================
// MARKET SIMULATION CONFIG
// ============================================

export const MARKET_CONFIG = {
  // Price movement (weekly)
  volatilityMultipliers: {
    very_low: 0.005,    // ±0.5% typical weekly move
    low: 0.015,         // ±1.5%
    medium: 0.03,       // ±3%
    high: 0.05,         // ±5%
    very_high: 0.08     // ±8%
  } as Record<StockVolatility, number>,
  
  // Market sentiment (affects all stocks)
  sentimentImpact: {
    bullish: 0.002,     // +0.2% baseline weekly
    neutral: 0,
    bearish: -0.002     // -0.2% baseline weekly
  },
  
  // Trading fees
  tradingFee: 0.001,    // 0.1% per trade
  minTradingFee: 5,     // Minimum $5 per trade
  
  // Dividend payment frequency
  dividendPaymentWeeks: [13, 26, 39, 52],  // Quarterly
  
  // Market hours (for flavor)
  marketOpen: '09:30',
  marketClose: '16:00',
  
  // Business performance variance
  businessPerformanceVariance: 0.2  // ±20% from expected
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function calculateStockReturn(
  holding: StockHolding
): { totalReturn: number; returnPercent: number; annualizedReturn: number } {
  const totalReturn = holding.currentValue - holding.totalInvested + holding.dividendsReceived
  const returnPercent = (totalReturn / holding.totalInvested) * 100
  
  // Simplified annualized return (would need actual dates for accuracy)
  const annualizedReturn = returnPercent  // Placeholder
  
  return { totalReturn, returnPercent, annualizedReturn }
}

export function getStockBySymbol(symbol: string): Stock | undefined {
  return STOCKS.find(s => s.symbol === symbol)
}

export function getIndexFundBySymbol(symbol: string): IndexFund | undefined {
  return INDEX_FUNDS.find(f => f.symbol === symbol)
}

export function calculateBusinessValuation(
  business: BusinessVenture,
  _weeksOperating: number
): number {
  // Simple valuation: annual profit * multiplier based on status
  const annualProfit = business.monthlyProfit * 12
  
  const multipliers = {
    startup: 2,
    growing: 4,
    stable: 3,
    struggling: 1,
    thriving: 5
  }
  
  const multiplier = multipliers[business.status]
  let valuation = annualProfit * multiplier
  
  // Add value for racing synergy
  if (business.synergyWithTeam && business.synergyBonus) {
    valuation *= 1.1
  }
  
  // Minimum valuation is investment amount * 0.5
  return Math.max(valuation, business.investmentAmount * 0.5)
}
