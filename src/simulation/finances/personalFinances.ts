// ============================================
// PERSONAL FINANCES SIMULATION
// ============================================
// Handles personal wealth management, loans, expenses,
// and financial processing separate from team finances.

import {
  PersonalFinancialState,
  PersonalIncomeBreakdown,
  PersonalLoan,
  Mortgage,
  PersonalTransaction,
  PersonalTransactionCategory,
  PersonalLoanType,
  CreditHistoryEvent,
  TeamEquityStake,
  PERSONAL_LOAN_CONFIGS,
  MORTGAGE_CONFIG,
  CREDIT_SCORE_CONFIG,
  LifestyleLevel,
  getCreditScoreCategory,
  calculatePersonalLoanRate,
  calculateMortgageRate,
  calculateMonthlyPayment,
  calculateNetWorth,
  TAX_CONFIGS,
  TaxCategory,
  Country
} from '@/data/personal-finance-config'
import type { StockHolding, BusinessVenture } from '@/data/investment-config'

// ============================================
// ID GENERATION
// ============================================

let personalIdCounter = 0

function generatePersonalId(prefix: string): string {
  return `${prefix}_${Date.now()}_${++personalIdCounter}`
}

// ============================================
// TRANSACTION CREATION
// ============================================

export function createPersonalTransaction(
  type: 'income' | 'expense' | 'transfer',
  category: PersonalTransactionCategory,
  amount: number,
  description: string,
  week: number,
  year: number,
  options?: {
    relatedPropertyId?: string
    relatedInvestmentId?: string
    relatedLoanId?: string
    taxDeductible?: boolean
  }
): PersonalTransaction {
  return {
    id: generatePersonalId('ptx'),
    date: { week, year },
    type,
    category,
    amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
    description,
    relatedPropertyId: options?.relatedPropertyId,
    relatedInvestmentId: options?.relatedInvestmentId,
    relatedLoanId: options?.relatedLoanId,
    taxDeductible: options?.taxDeductible ?? false
  }
}

// ============================================
// CREDIT SCORE MANAGEMENT
// ============================================

export function updateCreditScore(
  currentScore: number,
  event: 'onTimePayment' | 'latePayment' | 'missedPayment' | 'loanPaidOff' | 
         'newLoanOpened' | 'creditInquiry' | 'bankruptcy' | 'default' |
         'highUtilization' | 'lowUtilization' | 'monthlyRecovery'
): number {
  let impact: number
  
  if (event === 'monthlyRecovery') {
    impact = CREDIT_SCORE_CONFIG.monthlyRecovery
  } else {
    impact = CREDIT_SCORE_CONFIG.impacts[event]
  }
  
  return Math.max(
    CREDIT_SCORE_CONFIG.min,
    Math.min(CREDIT_SCORE_CONFIG.max, currentScore + impact)
  )
}

export function createCreditHistoryEvent(
  type: CreditHistoryEvent['type'],
  description: string,
  scoreImpact: number,
  week: number,
  year: number,
  loanId?: string
): CreditHistoryEvent {
  return {
    date: { week, year },
    type,
    description,
    scoreImpact,
    loanId
  }
}

// ============================================
// PERSONAL LOAN FUNCTIONS
// ============================================

export interface PersonalLoanApplicationResult {
  approved: boolean
  reason?: string
  loan?: PersonalLoan
  offeredRate?: number
  monthlyPayment?: number
}

export function applyForPersonalLoan(
  type: PersonalLoanType,
  requestedAmount: number,
  termMonths: number,
  purpose: string,
  creditScore: number,
  currentDebt: number,
  monthlyIncome: number,
  week: number,
  year: number
): PersonalLoanApplicationResult {
  const config = PERSONAL_LOAN_CONFIGS[type]
  
  // Check credit score requirement
  if (creditScore < config.minCreditScore) {
    return {
      approved: false,
      reason: `Credit score ${creditScore} is below minimum requirement of ${config.minCreditScore}`
    }
  }
  
  // Check amount limits
  if (requestedAmount < config.minAmount) {
    return {
      approved: false,
      reason: `Requested amount $${requestedAmount.toLocaleString()} is below minimum of $${config.minAmount.toLocaleString()}`
    }
  }
  
  if (requestedAmount > config.maxAmount) {
    return {
      approved: false,
      reason: `Requested amount $${requestedAmount.toLocaleString()} exceeds maximum of $${config.maxAmount.toLocaleString()}`
    }
  }
  
  // Check term limits
  if (termMonths < config.minTermMonths || termMonths > config.maxTermMonths) {
    return {
      approved: false,
      reason: `Term must be between ${config.minTermMonths} and ${config.maxTermMonths} months`
    }
  }
  
  // Calculate rate and payment
  const rate = calculatePersonalLoanRate(type, creditScore)
  const monthlyPayment = calculateMonthlyPayment(requestedAmount, rate, termMonths)
  
  // Check debt-to-income ratio
  const totalMonthlyDebt = currentDebt / 12 + monthlyPayment
  const debtToIncome = totalMonthlyDebt / monthlyIncome
  
  if (debtToIncome > config.maxDebtToIncomeRatio) {
    return {
      approved: false,
      reason: `Debt-to-income ratio of ${(debtToIncome * 100).toFixed(1)}% exceeds maximum of ${(config.maxDebtToIncomeRatio * 100)}%`,
      offeredRate: rate,
      monthlyPayment
    }
  }
  
  // Approved - create the loan
  const loan: PersonalLoan = {
    id: generatePersonalId('ploan'),
    type,
    lender: getRandomPersonalLender(),
    purpose,
    principal: requestedAmount,
    remainingBalance: requestedAmount,
    interestRate: rate,
    termMonths,
    monthsRemaining: termMonths,
    monthlyPayment,
    totalInterestPaid: 0,
    nextPaymentDue: week + 4, // First payment in ~1 month
    isDelinquent: false,
    missedPayments: 0,
    startDate: { week, year }
  }
  
  return {
    approved: true,
    loan,
    offeredRate: rate,
    monthlyPayment
  }
}

export function applyForMortgage(
  propertyId: string,
  propertyName: string,
  propertyValue: number,
  downPaymentAmount: number,
  termYears: number,
  creditScore: number,
  currentDebt: number,
  monthlyIncome: number,
  week: number,
  year: number
): { approved: boolean; reason?: string; mortgage?: Mortgage; monthlyPayment?: number } {
  const config = MORTGAGE_CONFIG
  
  // Check credit score
  if (creditScore < config.minCreditScore) {
    return {
      approved: false,
      reason: `Credit score ${creditScore} is below minimum requirement of ${config.minCreditScore}`
    }
  }
  
  // Check down payment
  const downPaymentPercent = (downPaymentAmount / propertyValue) * 100
  if (downPaymentPercent < config.minDownPaymentPercent) {
    return {
      approved: false,
      reason: `Down payment of ${downPaymentPercent.toFixed(1)}% is below minimum of ${config.minDownPaymentPercent}%`
    }
  }
  
  // Check term
  if (termYears < config.minTermYears || termYears > config.maxTermYears) {
    return {
      approved: false,
      reason: `Term must be between ${config.minTermYears} and ${config.maxTermYears} years`
    }
  }
  
  // Calculate loan details
  const principal = propertyValue - downPaymentAmount
  const rate = calculateMortgageRate(creditScore)
  const termMonths = termYears * 12
  const monthlyPayment = calculateMonthlyPayment(principal, rate, termMonths)
  
  // Check debt-to-income
  const totalMonthlyDebt = currentDebt / 12 + monthlyPayment
  const debtToIncome = totalMonthlyDebt / monthlyIncome
  
  if (debtToIncome > config.maxDebtToIncomeRatio) {
    return {
      approved: false,
      reason: `Debt-to-income ratio of ${(debtToIncome * 100).toFixed(1)}% exceeds maximum of ${config.maxDebtToIncomeRatio * 100}%`,
      monthlyPayment
    }
  }
  
  // Approved
  const mortgage: Mortgage = {
    id: generatePersonalId('mort'),
    propertyId,
    propertyName,
    lender: getRandomMortgageLender(),
    principal,
    remainingBalance: principal,
    interestRate: rate,
    termYears,
    yearsRemaining: termYears,
    downPaymentAmount,
    downPaymentPercent,
    monthlyPayment,
    totalInterestPaid: 0,
    nextPaymentDue: week + 4,
    currentEquity: downPaymentAmount,
    startDate: { week, year }
  }
  
  return {
    approved: true,
    mortgage,
    monthlyPayment
  }
}

// ============================================
// LOAN PAYMENT PROCESSING
// ============================================

export interface LoanPaymentResult {
  success: boolean
  principalPaid: number
  interestPaid: number
  newBalance: number
  loanPaidOff: boolean
  transaction: PersonalTransaction
  creditEvent: CreditHistoryEvent
}

export function processPersonalLoanPayment(
  loan: PersonalLoan,
  personalCash: number,
  week: number,
  year: number
): LoanPaymentResult | { success: false; reason: string; creditEvent: CreditHistoryEvent } {
  if (personalCash < loan.monthlyPayment) {
    // Missed payment
    return {
      success: false,
      reason: `Insufficient funds for loan payment. Need $${loan.monthlyPayment.toLocaleString()}, have $${personalCash.toLocaleString()}`,
      creditEvent: createCreditHistoryEvent(
        'payment_missed',
        `Missed payment on ${loan.lender} ${loan.type}`,
        CREDIT_SCORE_CONFIG.impacts.missedPayment,
        week,
        year,
        loan.id
      )
    }
  }
  
  // Calculate interest and principal portions
  const monthlyRate = loan.interestRate / 12
  const interestPortion = loan.remainingBalance * monthlyRate
  const principalPortion = loan.monthlyPayment - interestPortion
  
  const newBalance = Math.max(0, loan.remainingBalance - principalPortion)
  const loanPaidOff = newBalance === 0
  
  const transaction = createPersonalTransaction(
    'expense',
    'loan_payment',
    loan.monthlyPayment,
    `${loan.lender} loan payment (Principal: $${principalPortion.toLocaleString()}, Interest: $${interestPortion.toLocaleString()})`,
    week,
    year,
    { relatedLoanId: loan.id }
  )
  
  const creditEvent = createCreditHistoryEvent(
    loanPaidOff ? 'loan_closed' : 'payment_on_time',
    loanPaidOff 
      ? `Paid off ${loan.lender} ${loan.type}` 
      : `On-time payment on ${loan.lender} ${loan.type}`,
    loanPaidOff 
      ? CREDIT_SCORE_CONFIG.impacts.loanPaidOff 
      : CREDIT_SCORE_CONFIG.impacts.onTimePayment,
    week,
    year,
    loan.id
  )
  
  return {
    success: true,
    principalPaid: principalPortion,
    interestPaid: interestPortion,
    newBalance,
    loanPaidOff,
    transaction,
    creditEvent
  }
}

export function processMortgagePayment(
  mortgage: Mortgage,
  personalCash: number,
  currentPropertyValue: number,
  week: number,
  year: number
): LoanPaymentResult | { success: false; reason: string; creditEvent: CreditHistoryEvent } {
  if (personalCash < mortgage.monthlyPayment) {
    return {
      success: false,
      reason: `Insufficient funds for mortgage payment. Need $${mortgage.monthlyPayment.toLocaleString()}, have $${personalCash.toLocaleString()}`,
      creditEvent: createCreditHistoryEvent(
        'payment_missed',
        `Missed mortgage payment on ${mortgage.propertyName}`,
        CREDIT_SCORE_CONFIG.impacts.missedPayment,
        week,
        year,
        mortgage.id
      )
    }
  }
  
  const monthlyRate = mortgage.interestRate / 12
  const interestPortion = mortgage.remainingBalance * monthlyRate
  const principalPortion = mortgage.monthlyPayment - interestPortion
  
  const newBalance = Math.max(0, mortgage.remainingBalance - principalPortion)
  const loanPaidOff = newBalance === 0
  
  // Update equity
  const _newEquity = currentPropertyValue - newBalance
  
  const transaction = createPersonalTransaction(
    'expense',
    'mortgage_payment',
    mortgage.monthlyPayment,
    `Mortgage payment on ${mortgage.propertyName}`,
    week,
    year,
    { relatedPropertyId: mortgage.propertyId, relatedLoanId: mortgage.id }
  )
  
  const creditEvent = createCreditHistoryEvent(
    loanPaidOff ? 'loan_closed' : 'payment_on_time',
    loanPaidOff 
      ? `Paid off mortgage on ${mortgage.propertyName}` 
      : `On-time mortgage payment on ${mortgage.propertyName}`,
    loanPaidOff 
      ? CREDIT_SCORE_CONFIG.impacts.loanPaidOff 
      : CREDIT_SCORE_CONFIG.impacts.onTimePayment,
    week,
    year,
    mortgage.id
  )
  
  return {
    success: true,
    principalPaid: principalPortion,
    interestPaid: interestPortion,
    newBalance,
    loanPaidOff,
    transaction,
    creditEvent
  }
}

// ============================================
// WEEKLY PROCESSING
// ============================================

export interface WeeklyPersonalFinancesResult {
  transactions: PersonalTransaction[]
  creditEvents: CreditHistoryEvent[]
  newCreditScore: number
  loansPaidOff: string[]
  warnings: string[]
  updatedLoans: PersonalLoan[]
  updatedMortgages: Mortgage[]
}

export function processWeeklyPersonalFinances(
  finances: PersonalFinancialState,
  week: number,
  year: number,
  lifestyleLevel: LifestyleLevel
): WeeklyPersonalFinancesResult {
  const transactions: PersonalTransaction[] = []
  const creditEvents: CreditHistoryEvent[] = []
  const loansPaidOff: string[] = []
  const warnings: string[] = []
  let newCreditScore = finances.creditScore
  
  // Individual lifestyle costs (vehicles, staff, hobbies, pets, etc.) are deducted
  // separately in the weekly tick - no base lifestyle cost to deduct here.
  
  // Process loan payments (check if due this week - monthly payments every 4 weeks)
  // Track updated loan objects with decremented balances
  const updatedLoans: PersonalLoan[] = finances.personalLoans.map(loan => {
    if (week >= loan.nextPaymentDue && loan.remainingBalance > 0) {
      const result = processPersonalLoanPayment(loan, finances.liquidCash, week, year)
      
      if (result.success === false) {
        creditEvents.push(result.creditEvent)
        newCreditScore = updateCreditScore(newCreditScore, 'missedPayment')
        warnings.push('Loan payment failed')
        // Mark delinquent but keep loan unchanged otherwise
        return {
          ...loan,
          isDelinquent: true,
          missedPayments: loan.missedPayments + 1
        }
      } else {
        transactions.push(result.transaction)
        creditEvents.push(result.creditEvent)
        newCreditScore = updateCreditScore(
          newCreditScore, 
          result.loanPaidOff ? 'loanPaidOff' : 'onTimePayment'
        )
        if (result.loanPaidOff) {
          loansPaidOff.push(loan.id)
        }
        // Update loan with new balance, interest paid, next payment date, months remaining
        return {
          ...loan,
          remainingBalance: result.newBalance,
          totalInterestPaid: loan.totalInterestPaid + result.interestPaid,
          monthsRemaining: Math.max(0, loan.monthsRemaining - 1),
          nextPaymentDue: week + 4,
          isDelinquent: false,
          missedPayments: 0
        }
      }
    }
    return loan
  }).filter(loan => loan.remainingBalance > 0) // Remove fully paid off loans
  
  // Process mortgage payments - track updated mortgage objects
  const updatedMortgages: Mortgage[] = finances.mortgages.map(mortgage => {
    if (week >= mortgage.nextPaymentDue && mortgage.remainingBalance > 0) {
      const currentPropertyValue = mortgage.currentEquity + mortgage.remainingBalance
      const result = processMortgagePayment(
        mortgage, 
        finances.liquidCash, 
        currentPropertyValue,
        week, 
        year
      )
      
      if (result.success === false) {
        creditEvents.push(result.creditEvent)
        newCreditScore = updateCreditScore(newCreditScore, 'missedPayment')
        warnings.push('Loan payment failed')
        return mortgage // Keep unchanged on missed payment
      } else {
        transactions.push(result.transaction)
        creditEvents.push(result.creditEvent)
        newCreditScore = updateCreditScore(
          newCreditScore, 
          result.loanPaidOff ? 'loanPaidOff' : 'onTimePayment'
        )
        if (result.loanPaidOff) {
          loansPaidOff.push(mortgage.id)
        }
        // Update mortgage with new balance, equity, interest paid, next payment date
        return {
          ...mortgage,
          remainingBalance: result.newBalance,
          totalInterestPaid: mortgage.totalInterestPaid + result.interestPaid,
          currentEquity: currentPropertyValue - result.newBalance,
          nextPaymentDue: week + 4,
          yearsRemaining: result.newBalance > 0 && mortgage.monthlyPayment > 0
            ? Math.ceil(result.newBalance / (mortgage.monthlyPayment * 12))
            : 0
        }
      }
    }
    return mortgage
  }).filter(mortgage => mortgage.remainingBalance > 0) // Remove fully paid off mortgages
  
  // Monthly credit score recovery (once per month, on week 1, 5, 9, etc.)
  if (week % 4 === 1 && creditEvents.length === 0) {
    newCreditScore = updateCreditScore(newCreditScore, 'monthlyRecovery')
  }
  
  return {
    transactions,
    creditEvents,
    newCreditScore,
    loansPaidOff,
    warnings,
    updatedLoans,
    updatedMortgages
  }
}

// ============================================
// INCOME PROCESSING
// ============================================

export function processOwnerSalary(
  amount: number,
  week: number,
  year: number
): PersonalTransaction {
  return createPersonalTransaction(
    'income',
    'salary',
    amount,
    'Owner salary from team',
    week,
    year,
    { taxDeductible: false }
  )
}

export function processDividendPayment(
  amount: number,
  teamName: string,
  week: number,
  year: number
): PersonalTransaction {
  return createPersonalTransaction(
    'income',
    'dividends',
    amount,
    `Dividend payment from ${teamName}`,
    week,
    year,
    { taxDeductible: false }
  )
}

export function processEndorsementIncome(
  amount: number,
  brandName: string,
  week: number,
  year: number
): PersonalTransaction {
  return createPersonalTransaction(
    'income',
    'endorsement',
    amount,
    `Endorsement payment from ${brandName}`,
    week,
    year,
    { taxDeductible: false }
  )
}

export function processRentalIncome(
  amount: number,
  propertyName: string,
  propertyId: string,
  week: number,
  year: number
): PersonalTransaction {
  return createPersonalTransaction(
    'income',
    'rental_income',
    amount,
    `Rental income from ${propertyName}`,
    week,
    year,
    { relatedPropertyId: propertyId, taxDeductible: false }
  )
}

// ============================================
// MONTHLY INCOME SYNC
// ============================================
// Recalculates all income sources from actual game state.
// Mirrors the "Sync Monthly Expense Tracking" block in careerStore.ts.

export interface SyncMonthlyIncomeParams {
  currentIncome: PersonalIncomeBreakdown
  ownerSalary: number                    // Configured owner salary (monthly)
  stockHoldings: StockHolding[]          // Player's stock portfolio
  businessVentures: BusinessVenture[]    // Player's business investments
  properties: Array<{                    // Player's real estate
    monthlyRentalIncome?: number
    monthlyExpenses?: number
    occupancyRate?: number
    currentValue?: number
  }>
  teamEquity?: TeamEquityStake           // Team equity for dividend calc
  teamAnnualRevenue?: number             // For dividend income estimation
}

/**
 * Recalculates monthly income breakdown from actual owned assets/investments.
 * Endorsements and speakingFees are preserved (synced elsewhere).
 */
export function syncMonthlyIncome(params: SyncMonthlyIncomeParams): PersonalIncomeBreakdown {
  const {
    currentIncome,
    ownerSalary,
    stockHoldings,
    businessVentures,
    properties,
    teamEquity,
    teamAnnualRevenue
  } = params

  // Owner salary: use the configured value
  const syncedOwnerSalary = ownerSalary

  // Rental income: sum net rental income from all properties
  const rentalIncome = properties.reduce((sum, prop) => {
    const grossRental = (prop.monthlyRentalIncome || 0) * ((prop.occupancyRate || 0) / 100)
    const netRental = grossRental - (prop.monthlyExpenses || 0)
    return sum + Math.max(0, netRental)
  }, 0)

  // Investment income from stocks: estimate monthly dividend yield
  // dividend yield is annual %, so monthly = (value * yield / 100) / 12
  const stockDividendIncome = stockHoldings.reduce((sum, holding) => {
    // Use dividendsReceived as a proxy: if holding has accumulated dividends, estimate monthly
    // For a rough monthly figure, use currentValue * estimated yield
    // We don't have yield per holding, so estimate 2% annual average if they have any value
    const estimatedAnnualDividend = holding.currentValue * 0.02
    return sum + Math.floor(estimatedAnnualDividend / 12)
  }, 0)

  // Investment income from business ventures: monthly profit * ownership %
  const businessIncome = businessVentures.reduce((sum, biz) => {
    if (biz.monthlyProfit > 0) {
      return sum + Math.floor(biz.monthlyProfit * (biz.ownershipPercent / 100))
    }
    return sum
  }, 0)

  const investmentIncome = stockDividendIncome + businessIncome

  // Team dividends: from dividend policy if enabled
  let dividends = 0
  if (teamEquity?.dividendPolicy?.enabled && teamAnnualRevenue) {
    const annualDividendPool = teamAnnualRevenue * (teamEquity.dividendPolicy.percentOfProfit / 100)
    const ownerShare = annualDividendPool * (teamEquity.ownershipPercent / 100)
    dividends = Math.floor(ownerShare / 12) // Monthly estimate
  }

  return {
    ownerSalary: Math.round(syncedOwnerSalary),
    dividends: Math.round(dividends),
    rentalIncome: Math.round(rentalIncome),
    investmentIncome: Math.round(investmentIncome),
    // Preserve endorsements and speakingFees - they are synced by other systems
    endorsements: currentIncome.endorsements || 0,
    speakingFees: currentIncome.speakingFees || 0,
    other: currentIncome.other || 0
  }
}

// ============================================
// NET WORTH RECALCULATION
// ============================================

export interface RecalcNetWorthParams {
  finances: PersonalFinancialState
  teamEquity: TeamEquityStake
  stockHoldings: StockHolding[]
  businessVentures: BusinessVenture[]
  properties: Array<{ currentValue?: number }>
  currentWeek: number
}

/**
 * Recalculates cachedNetWorth from actual asset values.
 * Returns updated cachedNetWorth and lastNetWorthUpdate values.
 */
export function recalculateNetWorth(params: RecalcNetWorthParams): {
  cachedNetWorth: number
  lastNetWorthUpdate: number
} {
  const {
    finances,
    teamEquity,
    stockHoldings,
    businessVentures,
    properties,
    currentWeek
  } = params

  // Sum property values
  const propertyValues = properties.reduce(
    (sum, p) => sum + (p.currentValue || 0), 0
  )

  // Sum investment values (stocks + business ownership value)
  const stockValues = stockHoldings.reduce(
    (sum, h) => sum + h.currentValue, 0
  )
  const businessValues = businessVentures.reduce(
    (sum, b) => sum + b.currentValuation * (b.ownershipPercent / 100), 0
  )
  const investmentValues = stockValues + businessValues

  const netWorth = calculateNetWorth(
    finances,
    teamEquity,
    propertyValues,
    investmentValues
  )

  return {
    cachedNetWorth: netWorth,
    lastNetWorthUpdate: currentWeek
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getRandomPersonalLender(): string {
  const lenders = [
    'First National Bank',
    'Citizens Financial',
    'Premium Lending Group',
    'Prestige Capital',
    'Elite Finance Solutions',
    'Wealth Partners Bank',
    'Private Client Banking',
    'Heritage Financial'
  ]
  return lenders[Math.floor(Math.random() * lenders.length)]
}

function getRandomMortgageLender(): string {
  const lenders = [
    'First National Mortgage',
    'Premier Home Loans',
    'Elite Property Finance',
    'Prestige Mortgage Group',
    'Heritage Home Lending',
    'Private Residence Bank',
    'Luxury Property Finance'
  ]
  return lenders[Math.floor(Math.random() * lenders.length)]
}

// ============================================
// FINANCIAL SUMMARY
// ============================================

export interface PersonalFinancialSummary {
  liquidCash: number
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyCashFlow: number
  debtToIncomeRatio: number
  creditScore: number
  creditCategory: string
}

export function calculatePersonalFinancialSummary(
  finances: PersonalFinancialState,
  propertyValues: number,
  investmentValues: number,
  teamEquityValue: number
): PersonalFinancialSummary {
  // Calculate totals
  const totalLoanDebt = finances.personalLoans.reduce((sum, l) => sum + l.remainingBalance, 0)
  const totalMortgageDebt = finances.mortgages.reduce((sum, m) => sum + m.remainingBalance, 0)
  const totalLiabilities = totalLoanDebt + totalMortgageDebt
  
  const totalAssets = finances.liquidCash + propertyValues + investmentValues + teamEquityValue
  const netWorth = totalAssets - totalLiabilities
  
  // Monthly figures
  const monthlyIncome = Object.values(finances.monthlyIncome).reduce((sum, v) => sum + v, 0)
  const monthlyExpenses = Object.values(finances.monthlyExpenses).reduce((sum, v) => sum + Math.abs(v), 0)
  const monthlyCashFlow = monthlyIncome - monthlyExpenses
  
  // Debt to income
  const monthlyDebtPayments = finances.monthlyExpenses.loanPayments + finances.monthlyExpenses.mortgagePayments
  const debtToIncomeRatio = monthlyIncome > 0 ? monthlyDebtPayments / monthlyIncome : 0
  
  return {
    liquidCash: finances.liquidCash,
    totalAssets,
    totalLiabilities,
    netWorth,
    monthlyIncome,
    monthlyExpenses,
    monthlyCashFlow,
    debtToIncomeRatio,
    creditScore: finances.creditScore,
    creditCategory: getCreditScoreCategory(finances.creditScore)
  }
}

// ============================================
// TAX CALCULATION SYSTEM
// ============================================

/**
 * Calculate income tax using progressive tax brackets for a given country
 * Uses the country's real-world tax bracket system
 */
export function calculateIncomeTax(
  annualIncome: number,
  country: Country,
  deductions: number = 0
): { taxOwed: number; effectiveRate: number; bracketBreakdown: Array<{ bracket: string; taxable: number; tax: number; rate: number }> } {
  const config = TAX_CONFIGS[country]
  if (!config) {
    // Fallback: 20% flat tax
    const taxOwed = Math.round(Math.max(0, annualIncome - deductions) * 0.20)
    return { taxOwed, effectiveRate: 0.20, bracketBreakdown: [] }
  }
  
  // Apply standard deduction + any additional deductions
  const totalDeductions = config.standardDeduction + deductions
  const taxableIncome = Math.max(0, annualIncome - totalDeductions)
  
  let totalTax = 0
  const bracketBreakdown: Array<{ bracket: string; taxable: number; tax: number; rate: number }> = []
  
  for (const bracket of config.incomeBrackets) {
    if (taxableIncome <= bracket.minIncome) break
    
    const taxableInBracket = Math.min(
      taxableIncome - bracket.minIncome,
      (bracket.maxIncome === Infinity ? taxableIncome : bracket.maxIncome) - bracket.minIncome
    )
    
    if (taxableInBracket > 0) {
      const taxInBracket = Math.round(taxableInBracket * bracket.rate)
      totalTax += taxInBracket
      
      bracketBreakdown.push({
        bracket: `$${bracket.minIncome.toLocaleString()} - ${bracket.maxIncome === Infinity ? '∞' : '$' + bracket.maxIncome.toLocaleString()}`,
        taxable: taxableInBracket,
        tax: taxInBracket,
        rate: bracket.rate
      })
    }
  }
  
  const effectiveRate = annualIncome > 0 ? totalTax / annualIncome : 0
  
  return {
    taxOwed: Math.round(totalTax),
    effectiveRate: Math.round(effectiveRate * 1000) / 1000,
    bracketBreakdown
  }
}

/**
 * Calculate capital gains tax based on holding period and country
 */
export function calculateCapitalGainsTax(
  gain: number,
  isLongTerm: boolean,
  country: Country
): number {
  if (gain <= 0) return 0
  
  const config = TAX_CONFIGS[country]
  if (!config) return Math.round(gain * 0.20)
  
  const rate = isLongTerm ? config.capitalGainsLongRate : config.capitalGainsShortRate
  return Math.round(gain * rate)
}

/**
 * Calculate dividend tax for a given country
 */
export function calculateDividendTax(
  amount: number,
  country: Country
): number {
  if (amount <= 0) return 0
  
  const config = TAX_CONFIGS[country]
  if (!config) return Math.round(amount * 0.20)
  
  return Math.round(amount * config.dividendRate)
}

/**
 * Process annual taxes for a player based on their transaction history
 * Should be called at year end in the annual processing section
 */
export interface AnnualTaxResult {
  totalTaxOwed: number
  incomeTax: number
  capitalGainsTax: number
  dividendTax: number
  totalDeductions: number
  effectiveRate: number
  country: Country
  taxTransaction: PersonalTransaction
  breakdown: {
    totalOrdinaryIncome: number
    totalCapitalGains: number
    totalDividendIncome: number
    charitableDeductions: number
    mortgageDeductions: number
    standardDeduction: number
  }
}

export function processAnnualTaxes(
  finances: PersonalFinancialState,
  year: number
): AnnualTaxResult {
  const country = finances.taxResidency
  const config = TAX_CONFIGS[country]
  
  // Gather all transactions for this year
  const yearTransactions = finances.transactions.filter(tx => tx.date.year === year)
  
  // Categorize income by tax type
  let totalOrdinaryIncome = 0
  let totalCapitalGainsShort = 0
  let totalCapitalGainsLong = 0
  let totalDividendIncome = 0
  let totalCharitableDeductions = 0
  let totalMortgageInterest = 0
  
  for (const tx of yearTransactions) {
    if (tx.type === 'income') {
      const category = tx.taxCategory || 'ordinary_income'
      
      switch (category) {
        case 'capital_gains_short':
          totalCapitalGainsShort += tx.amount
          break
        case 'capital_gains_long':
          totalCapitalGainsLong += tx.amount
          break
        case 'dividend_income':
          totalDividendIncome += tx.amount
          break
        default:
          totalOrdinaryIncome += tx.amount
          break
      }
    }
    
    // Track deductible expenses
    if (tx.type === 'expense' && tx.taxDeductible) {
      if (tx.category === 'philanthropy' || tx.description?.toLowerCase().includes('charit') || tx.description?.toLowerCase().includes('foundation') || tx.description?.toLowerCase().includes('donat')) {
        totalCharitableDeductions += Math.abs(tx.amount)
      } else if (tx.category === 'mortgage_payment') {
        totalMortgageInterest += Math.abs(tx.amount) * 0.4 // Estimate ~40% of mortgage payment is interest
      }
    }
  }
  
  // Cap charitable deductions per country config
  const charitableLimit = config 
    ? totalOrdinaryIncome * config.charitableDeductionLimit
    : totalOrdinaryIncome * 0.25
  const cappedCharitableDeductions = Math.min(totalCharitableDeductions, charitableLimit)
  
  // Mortgage interest deduction (only if country allows it)
  const mortgageDeduction = (config?.mortgageInterestDeductible) ? totalMortgageInterest : 0
  
  // Standard deduction
  const standardDeduction = config?.standardDeduction || 0
  
  // Calculate total additional deductions (beyond standard)
  const additionalDeductions = cappedCharitableDeductions + mortgageDeduction
  
  // Calculate income tax (standard deduction is applied inside calculateIncomeTax)
  const incomeTaxResult = calculateIncomeTax(totalOrdinaryIncome, country, additionalDeductions)
  
  // Calculate capital gains taxes
  const cgTaxShort = calculateCapitalGainsTax(totalCapitalGainsShort, false, country)
  const cgTaxLong = calculateCapitalGainsTax(totalCapitalGainsLong, true, country)
  const totalCapitalGainsTax = cgTaxShort + cgTaxLong
  
  // Calculate dividend tax
  const dividendTax = calculateDividendTax(totalDividendIncome, country)
  
  // Total tax
  const totalTaxOwed = incomeTaxResult.taxOwed + totalCapitalGainsTax + dividendTax
  const totalIncome = totalOrdinaryIncome + totalCapitalGainsShort + totalCapitalGainsLong + totalDividendIncome
  const effectiveRate = totalIncome > 0 ? totalTaxOwed / totalIncome : 0
  
  // Create tax payment transaction
  const taxTransaction = createPersonalTransaction(
    'expense',
    'tax_payment',
    totalTaxOwed,
    `Annual tax payment (${config?.name || country}) - Year ${year}`,
    1, // Week 1 of next year
    year + 1,
    { taxDeductible: false }
  )
  
  return {
    totalTaxOwed,
    incomeTax: incomeTaxResult.taxOwed,
    capitalGainsTax: totalCapitalGainsTax,
    dividendTax,
    totalDeductions: standardDeduction + additionalDeductions,
    effectiveRate: Math.round(effectiveRate * 1000) / 1000,
    country,
    taxTransaction,
    breakdown: {
      totalOrdinaryIncome,
      totalCapitalGains: totalCapitalGainsShort + totalCapitalGainsLong,
      totalDividendIncome,
      charitableDeductions: cappedCharitableDeductions,
      mortgageDeductions: mortgageDeduction,
      standardDeduction
    }
  }
}
