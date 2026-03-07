// ============================================
// PERSONAL FINANCE CONFIGURATION
// ============================================
// Configuration for personal wealth management separate from team finances.
// This enables the owner to have personal investments, real estate,
// family expenses, and realistic separation from team operations.

// Country type matches the locations used in owner-backgrounds.ts and travel-logistics.ts
export type Country = 
  | 'United Kingdom'
  | 'Germany'
  | 'Italy'
  | 'United States'
  | 'Japan'
  | 'Brazil'
  | 'France'
  | 'Netherlands'
  | 'Australia'
  | 'Monaco'
  | 'Switzerland'
  | 'Spain'
  | 'Portugal'
  | 'United Arab Emirates'
  | 'Singapore'
  | 'Canada'
  | 'Mexico'
  | 'South Africa'
  | 'Austria'

// ============================================
// PERSONAL FINANCIAL STATE
// ============================================

export interface PersonalFinancialState {
  // Core wealth
  liquidCash: number
  
  // Net worth is calculated: cash + investments + property equity - debt + team equity value
  // This is tracked for display but recalculated when needed
  cachedNetWorth: number
  lastNetWorthUpdate: number // week when last calculated
  
  // Income tracking (per month for display, processed weekly)
  monthlyIncome: PersonalIncomeBreakdown
  
  // Whether the player has explicitly configured their owner salary
  // If false/undefined, salary defaults to $0 (migration for old saves that had $15,000)
  ownerSalaryConfigured?: boolean
  
  // Expense tracking
  monthlyExpenses: PersonalExpenseBreakdown
  
  // Credit profile
  creditScore: number // 300-850, affects personal loan rates
  creditHistory: CreditHistoryEvent[]
  
  // Tax information
  taxResidency: Country
  lastTaxYear: number
  taxesPaidThisYear: number
  taxDeductionsThisYear: number
  
  // Personal loans and mortgages
  personalLoans: PersonalLoan[]
  mortgages: Mortgage[]
  
  // Personal guarantees on team loans (risk exposure)
  personalGuarantees: PersonalGuarantee[]
  
  // Divorce financial obligations (alimony, child support)
  divorceObligations?: {
    alimonyMonthly: number
    childSupportMonthly: number
    endDate?: { week: number; year: number }
    startDate: { week: number; year: number }
  }
  
  // Transaction history
  transactions: PersonalTransaction[]
}

export interface PersonalIncomeBreakdown {
  ownerSalary: number        // From team
  salary?: number            // Alias for ownerSalary
  dividends: number          // From team profits
  rentalIncome: number       // From properties
  investmentIncome: number   // From stocks/businesses
  investmentReturns?: number // Alias for investmentIncome
  endorsements: number       // From personal brand deals
  speakingFees: number       // From events
  other: number
}

export interface PersonalExpenseBreakdown {
  lifestyle: number          // Based on lifestyle level
  mortgagePayments: number   // Property loans
  loanPayments: number       // Personal loans
  familyExpenses: number     // Partner, children costs
  personalStaff: number      // Butler, chef, nanny, etc.
  staffSalaries?: number     // Alias for personalStaff
  hobbies: number            // Golf, collecting, etc.
  philanthropy: number       // Foundation costs
  insurance: number          // Health, life, liability
  insurances?: number        // Alias for insurance (plural)
  propertyMaintenance?: number  // Property upkeep
  childSupport?: number      // Child support payments
  alimony?: number           // Alimony payments
  services: number           // Luxury services (chef, driver, security, etc.)
  dietPlan: number           // Diet plan costs
  petUpkeep: number          // Pet food, vet, grooming
  vehicleCosts: number       // Maintenance + insurance
  membershipFees: number     // Club memberships
  rent: number               // Rental property costs
  other: number
}

// ============================================
// PERSONAL LOANS
// ============================================

export type PersonalLoanType = 
  | 'personal_loan'      // General purpose
  | 'credit_line'        // Revolving credit
  | 'margin_loan'        // Against investment portfolio
  | 'bridge_loan'        // Short-term high interest

export interface PersonalLoan {
  id: string
  type: PersonalLoanType
  lender: string
  purpose: string
  
  // Loan terms
  principal: number
  remainingBalance: number
  interestRate: number      // Annual rate as decimal (0.05 = 5%)
  termMonths: number
  monthsRemaining: number
  
  // Payments
  monthlyPayment: number
  totalInterestPaid: number
  nextPaymentDue: number    // Week number
  
  // Status
  isDelinquent: boolean
  missedPayments: number
  
  startDate: { week: number; year: number }
}

export interface Mortgage {
  id: string
  propertyId: string        // Links to owned property
  propertyName: string      // For display
  lender: string
  
  // Loan terms
  principal: number
  remainingBalance: number
  interestRate: number
  termYears: number
  yearsRemaining: number
  
  // Down payment info
  downPaymentAmount: number
  downPaymentPercent: number
  
  // Payments
  monthlyPayment: number
  totalInterestPaid: number
  nextPaymentDue: number
  
  // Equity
  currentEquity: number     // Property value - remaining balance
  
  startDate: { week: number; year: number }
}

// ============================================
// PERSONAL GUARANTEES (RISK EXPOSURE)
// ============================================

export type GuaranteeType = 
  | 'unlimited'          // Full personal liability
  | 'limited'            // Capped at specific amount
  | 'property_backed'    // Specific property as collateral

export interface PersonalGuarantee {
  id: string
  teamLoanId: string        // Reference to team loan being guaranteed
  teamLoanType: string      // 'bank_loan' | 'credit_line' | etc.
  loanDescription: string
  
  guaranteeType: GuaranteeType
  maxLiability: number      // Maximum personal exposure
  
  // For property-backed guarantees
  collateralPropertyIds?: string[]
  
  // When does this trigger?
  triggerCondition: 'team_default' | 'team_bankruptcy' | 'missed_payments'
  
  // Status
  isTriggered: boolean
  amountClaimed: number
  
  createdDate: { week: number; year: number }
}

// ============================================
// TEAM EQUITY STAKE
// ============================================

export interface TeamEquityStake {
  // Ownership
  ownershipPercent: number  // 0-100
  sharesOwned: number       // If using share-based system
  totalShares: number       // Total shares in existence
  
  // Investment tracking
  totalInvested: number     // Cumulative personal investment
  investmentHistory: EquityInvestment[]
  
  // Valuation
  currentValuation: number  // Estimated team worth
  lastValuationDate: { week: number; year: number }
  valuationMethod: 'revenue_multiple' | 'asset_based' | 'market_comp'
  
  // Returns
  unrealizedGain: number    // currentValuation * ownership% - totalInvested
  totalDividendsReceived: number
  
  // External investors (dilute ownership)
  externalInvestors: ExternalInvestor[]
  
  // Dividend settings
  dividendPolicy: DividendPolicy
}

export interface EquityInvestment {
  id: string
  date: { week: number; year: number }
  amount: number
  type: 'initial' | 'additional' | 'loan_conversion'
  sharesReceived: number
  pricePerShare: number
  notes: string
}

export interface ExternalInvestor {
  id: string
  name: string
  type: 'individual' | 'fund' | 'corporate' | 'family_office' | 'private_equity' | 'angel' | 'consortium'
  
  investmentAmount: number
  ownershipPercent: number
  sharesOwned: number
  
  investmentDate: { week: number; year: number }
  
  // Terms
  terms: InvestorTerms
  
  // Relationship
  satisfaction: number      // 0-100
  boardSeat: boolean
  votingRights: boolean
}

export interface InvestorTerms {
  minimumReturn: number     // % annual return expected
  exitHorizon: number       // Years until they want to exit
  liquidationPreference: number // Multiple on investment if sold
  antiDilution: boolean
  dragAlongRights: boolean  // Can force sale
  tagAlongRights: boolean   // Can join in sale
  vetoRights: string[]      // Decisions they can veto
}

export interface DividendPolicy {
  enabled: boolean
  frequency: 'quarterly' | 'annually' | 'when_profitable'
  percentOfProfit: number   // % of profit to distribute
  minimumCashReserve: number // Team must keep this much cash
  lastDividendDate?: { week: number; year: number }
  lastDividendAmount?: number
}

// ============================================
// TRANSACTIONS
// ============================================

export type PersonalTransactionType = 'income' | 'expense' | 'transfer'

export type PersonalTransactionCategory = 
  // Income
  | 'salary'
  | 'dividends'
  | 'rental_income'
  | 'investment_gain'
  | 'endorsement'
  | 'speaking_fee'
  | 'property_sale'
  | 'stock_sale'
  | 'business_income'
  | 'prize_personal'
  | 'gift_received'
  | 'inheritance'
  | 'other_income'
  // Expenses
  | 'lifestyle'
  | 'mortgage_payment'
  | 'loan_payment'
  | 'property_purchase'
  | 'stock_purchase'
  | 'investment_loss'
  | 'family_expense'
  | 'personal_staff'
  | 'hobby_expense'
  | 'philanthropy'
  | 'insurance'
  | 'tax_payment'
  | 'legal_fee'
  | 'medical'
  | 'education'
  | 'other_expense'
  // Transfers
  | 'team_investment'
  | 'team_withdrawal'
  | 'inter_account'
  // Extended categories used by personal life actions
  | 'business_investment'
  | 'dividend'
  | 'entertainment'
  | 'family'
  | 'healthcare'
  | 'staff'
  | 'asset_sale'
  | 'charity'
  | 'other'

export interface PersonalTransaction {
  id: string
  date: { week: number; year: number }
  type: PersonalTransactionType
  category: PersonalTransactionCategory
  amount: number            // Positive for income, negative for expense
  description: string
  
  // Optional references
  relatedPropertyId?: string
  relatedInvestmentId?: string
  relatedLoanId?: string
  
  // For tax purposes
  taxDeductible: boolean
  taxCategory?: TaxCategory
}

// ============================================
// CREDIT HISTORY
// ============================================

export type CreditEventType = 
  | 'loan_opened'
  | 'loan_closed'
  | 'payment_on_time'
  | 'payment_late'
  | 'payment_missed'
  | 'credit_inquiry'
  | 'bankruptcy'
  | 'default'

export interface CreditHistoryEvent {
  date: { week: number; year: number }
  type: CreditEventType
  description: string
  scoreImpact: number       // Positive or negative
  loanId?: string
}

// ============================================
// TAX SYSTEM
// ============================================

export type TaxCategory = 
  | 'ordinary_income'       // Salary, business income
  | 'capital_gains_short'   // Investments held < 1 year
  | 'capital_gains_long'    // Investments held > 1 year
  | 'dividend_income'
  | 'rental_income'
  | 'self_employment'

export interface TaxBracket {
  minIncome: number
  maxIncome: number         // Infinity for top bracket
  rate: number              // As decimal (0.35 = 35%)
  baseAmount: number        // Tax on income below this bracket
}

export interface CountryTaxConfig {
  country: Country
  name: string
  
  // Income tax brackets
  incomeBrackets: TaxBracket[]
  
  // Special rates
  capitalGainsShortRate: number
  capitalGainsLongRate: number
  dividendRate: number
  
  // Deductions
  standardDeduction: number
  charitableDeductionLimit: number  // % of income
  mortgageInterestDeductible: boolean
  
  // Notes for flavor
  description: string
}

// Tax configurations by country
// Using string keys for flexibility with country name variations
export const TAX_CONFIGS: Record<string, CountryTaxConfig> = {
  'United Kingdom': {
    country: 'United Kingdom',
    name: 'UK Tax System',
    incomeBrackets: [
      { minIncome: 0, maxIncome: 12570, rate: 0, baseAmount: 0 },
      { minIncome: 12570, maxIncome: 50270, rate: 0.20, baseAmount: 0 },
      { minIncome: 50270, maxIncome: 125140, rate: 0.40, baseAmount: 7540 },
      { minIncome: 125140, maxIncome: Infinity, rate: 0.45, baseAmount: 37488 }
    ],
    capitalGainsShortRate: 0.20,
    capitalGainsLongRate: 0.20,
    dividendRate: 0.3375,
    standardDeduction: 12570,
    charitableDeductionLimit: 1.0,
    mortgageInterestDeductible: false,
    description: 'Progressive income tax with no mortgage interest deduction'
  },
  'Germany': {
    country: 'Germany',
    name: 'German Tax System',
    incomeBrackets: [
      { minIncome: 0, maxIncome: 10908, rate: 0, baseAmount: 0 },
      { minIncome: 10908, maxIncome: 62810, rate: 0.14, baseAmount: 0 },
      { minIncome: 62810, maxIncome: 277826, rate: 0.42, baseAmount: 7262 },
      { minIncome: 277826, maxIncome: Infinity, rate: 0.45, baseAmount: 97534 }
    ],
    capitalGainsShortRate: 0.25,
    capitalGainsLongRate: 0.25,
    dividendRate: 0.25,
    standardDeduction: 10908,
    charitableDeductionLimit: 0.20,
    mortgageInterestDeductible: false,
    description: 'Progressive rates with flat capital gains tax'
  },
  'Italy': {
    country: 'Italy',
    name: 'Italian Tax System',
    incomeBrackets: [
      { minIncome: 0, maxIncome: 28000, rate: 0.23, baseAmount: 0 },
      { minIncome: 28000, maxIncome: 50000, rate: 0.35, baseAmount: 6440 },
      { minIncome: 50000, maxIncome: Infinity, rate: 0.43, baseAmount: 14140 }
    ],
    capitalGainsShortRate: 0.26,
    capitalGainsLongRate: 0.26,
    dividendRate: 0.26,
    standardDeduction: 8000,
    charitableDeductionLimit: 0.10,
    mortgageInterestDeductible: true,
    description: 'High rates but mortgage interest is deductible'
  },
  'United States': {
    country: 'United States',
    name: 'US Federal Tax System',
    incomeBrackets: [
      { minIncome: 0, maxIncome: 11600, rate: 0.10, baseAmount: 0 },
      { minIncome: 11600, maxIncome: 47150, rate: 0.12, baseAmount: 1160 },
      { minIncome: 47150, maxIncome: 100525, rate: 0.22, baseAmount: 5426 },
      { minIncome: 100525, maxIncome: 191950, rate: 0.24, baseAmount: 17168 },
      { minIncome: 191950, maxIncome: 243725, rate: 0.32, baseAmount: 39110 },
      { minIncome: 243725, maxIncome: 609350, rate: 0.35, baseAmount: 55678 },
      { minIncome: 609350, maxIncome: Infinity, rate: 0.37, baseAmount: 183647 }
    ],
    capitalGainsShortRate: 0.37,
    capitalGainsLongRate: 0.20,
    dividendRate: 0.20,
    standardDeduction: 14600,
    charitableDeductionLimit: 0.60,
    mortgageInterestDeductible: true,
    description: 'Complex brackets with favorable long-term capital gains'
  },
  'Japan': {
    country: 'Japan',
    name: 'Japanese Tax System',
    incomeBrackets: [
      { minIncome: 0, maxIncome: 1950000, rate: 0.05, baseAmount: 0 },
      { minIncome: 1950000, maxIncome: 3300000, rate: 0.10, baseAmount: 97500 },
      { minIncome: 3300000, maxIncome: 6950000, rate: 0.20, baseAmount: 232500 },
      { minIncome: 6950000, maxIncome: 9000000, rate: 0.23, baseAmount: 962500 },
      { minIncome: 9000000, maxIncome: 18000000, rate: 0.33, baseAmount: 1434000 },
      { minIncome: 18000000, maxIncome: 40000000, rate: 0.40, baseAmount: 4404000 },
      { minIncome: 40000000, maxIncome: Infinity, rate: 0.45, baseAmount: 13204000 }
    ],
    capitalGainsShortRate: 0.20,
    capitalGainsLongRate: 0.20,
    dividendRate: 0.20,
    standardDeduction: 480000,
    charitableDeductionLimit: 0.40,
    mortgageInterestDeductible: true,
    description: 'Many brackets with consistent capital gains treatment'
  },
  'Brazil': {
    country: 'Brazil',
    name: 'Brazilian Tax System',
    incomeBrackets: [
      { minIncome: 0, maxIncome: 26963, rate: 0, baseAmount: 0 },
      { minIncome: 26963, maxIncome: 33919, rate: 0.075, baseAmount: 0 },
      { minIncome: 33919, maxIncome: 45012, rate: 0.15, baseAmount: 522 },
      { minIncome: 45012, maxIncome: 55976, rate: 0.225, baseAmount: 1886 },
      { minIncome: 55976, maxIncome: Infinity, rate: 0.275, baseAmount: 4363 }
    ],
    capitalGainsShortRate: 0.15,
    capitalGainsLongRate: 0.15,
    dividendRate: 0,  // Dividends are tax-free in Brazil
    standardDeduction: 26963,
    charitableDeductionLimit: 0.06,
    mortgageInterestDeductible: false,
    description: 'Moderate rates with tax-free dividends'
  },
  'France': {
    country: 'France',
    name: 'French Tax System',
    incomeBrackets: [
      { minIncome: 0, maxIncome: 11294, rate: 0, baseAmount: 0 },
      { minIncome: 11294, maxIncome: 28797, rate: 0.11, baseAmount: 0 },
      { minIncome: 28797, maxIncome: 82341, rate: 0.30, baseAmount: 1925 },
      { minIncome: 82341, maxIncome: 177106, rate: 0.41, baseAmount: 17988 },
      { minIncome: 177106, maxIncome: Infinity, rate: 0.45, baseAmount: 56842 }
    ],
    capitalGainsShortRate: 0.30,
    capitalGainsLongRate: 0.30,
    dividendRate: 0.30,
    standardDeduction: 11294,
    charitableDeductionLimit: 0.20,
    mortgageInterestDeductible: false,
    description: 'High rates with flat 30% on investment income'
  },
  'Netherlands': {
    country: 'Netherlands',
    name: 'Dutch Tax System',
    incomeBrackets: [
      { minIncome: 0, maxIncome: 75518, rate: 0.3697, baseAmount: 0 },
      { minIncome: 75518, maxIncome: Infinity, rate: 0.495, baseAmount: 27924 }
    ],
    capitalGainsShortRate: 0.32,
    capitalGainsLongRate: 0.32,
    dividendRate: 0.32,
    standardDeduction: 0,
    charitableDeductionLimit: 0.10,
    mortgageInterestDeductible: true,
    description: 'Two brackets with wealth tax on investments'
  },
  'Australia': {
    country: 'Australia',
    name: 'Australian Tax System',
    incomeBrackets: [
      { minIncome: 0, maxIncome: 18200, rate: 0, baseAmount: 0 },
      { minIncome: 18200, maxIncome: 45000, rate: 0.19, baseAmount: 0 },
      { minIncome: 45000, maxIncome: 120000, rate: 0.325, baseAmount: 5092 },
      { minIncome: 120000, maxIncome: 180000, rate: 0.37, baseAmount: 29467 },
      { minIncome: 180000, maxIncome: Infinity, rate: 0.45, baseAmount: 51667 }
    ],
    capitalGainsShortRate: 0.45,
    capitalGainsLongRate: 0.225,  // 50% discount for assets held > 1 year
    dividendRate: 0.45,
    standardDeduction: 18200,
    charitableDeductionLimit: 1.0,
    mortgageInterestDeductible: false,
    description: 'Progressive rates with 50% CGT discount for long-term'
  },
  'Monaco': {
    country: 'Monaco',
    name: 'Monaco Tax System',
    incomeBrackets: [
      { minIncome: 0, maxIncome: Infinity, rate: 0, baseAmount: 0 }
    ],
    capitalGainsShortRate: 0,
    capitalGainsLongRate: 0,
    dividendRate: 0,
    standardDeduction: 0,
    charitableDeductionLimit: 0,
    mortgageInterestDeductible: false,
    description: 'No income tax - the tax haven option'
  },
  'Switzerland': {
    country: 'Switzerland',
    name: 'Swiss Tax System',
    incomeBrackets: [
      { minIncome: 0, maxIncome: 31600, rate: 0, baseAmount: 0 },
      { minIncome: 31600, maxIncome: 41400, rate: 0.0077, baseAmount: 0 },
      { minIncome: 41400, maxIncome: 55200, rate: 0.0088, baseAmount: 75 },
      { minIncome: 55200, maxIncome: 72500, rate: 0.0264, baseAmount: 197 },
      { minIncome: 72500, maxIncome: 78100, rate: 0.0297, baseAmount: 653 },
      { minIncome: 78100, maxIncome: 103600, rate: 0.0561, baseAmount: 820 },
      { minIncome: 103600, maxIncome: 134600, rate: 0.0693, baseAmount: 2250 },
      { minIncome: 134600, maxIncome: 176000, rate: 0.0792, baseAmount: 4399 },
      { minIncome: 176000, maxIncome: 755200, rate: 0.1098, baseAmount: 7680 },
      { minIncome: 755200, maxIncome: Infinity, rate: 0.1150, baseAmount: 71284 }
    ],
    capitalGainsShortRate: 0,
    capitalGainsLongRate: 0,
    dividendRate: 0.35,  // Withholding, but often refundable
    standardDeduction: 31600,
    charitableDeductionLimit: 0.20,
    mortgageInterestDeductible: true,
    description: 'Low federal rates (cantonal taxes vary) with no capital gains tax'
  },
  'Spain': {
    country: 'Spain',
    name: 'Spanish Tax System',
    incomeBrackets: [
      { minIncome: 0, maxIncome: 12450, rate: 0.19, baseAmount: 0 },
      { minIncome: 12450, maxIncome: 20200, rate: 0.24, baseAmount: 2366 },
      { minIncome: 20200, maxIncome: 35200, rate: 0.30, baseAmount: 4226 },
      { minIncome: 35200, maxIncome: 60000, rate: 0.37, baseAmount: 8726 },
      { minIncome: 60000, maxIncome: 300000, rate: 0.45, baseAmount: 17902 },
      { minIncome: 300000, maxIncome: Infinity, rate: 0.47, baseAmount: 125902 }
    ],
    capitalGainsShortRate: 0.23,
    capitalGainsLongRate: 0.23,
    dividendRate: 0.23,
    standardDeduction: 5550,
    charitableDeductionLimit: 0.15,
    mortgageInterestDeductible: false,
    description: 'Progressive rates with flat savings income tax'
  },
  'Portugal': {
    country: 'Portugal',
    name: 'Portuguese Tax System',
    incomeBrackets: [
      { minIncome: 0, maxIncome: 7703, rate: 0.1325, baseAmount: 0 },
      { minIncome: 7703, maxIncome: 11623, rate: 0.18, baseAmount: 1021 },
      { minIncome: 11623, maxIncome: 16472, rate: 0.23, baseAmount: 1727 },
      { minIncome: 16472, maxIncome: 21321, rate: 0.26, baseAmount: 2843 },
      { minIncome: 21321, maxIncome: 27146, rate: 0.3275, baseAmount: 4104 },
      { minIncome: 27146, maxIncome: 39791, rate: 0.37, baseAmount: 6012 },
      { minIncome: 39791, maxIncome: 51997, rate: 0.435, baseAmount: 10690 },
      { minIncome: 51997, maxIncome: 81199, rate: 0.45, baseAmount: 16000 },
      { minIncome: 81199, maxIncome: Infinity, rate: 0.48, baseAmount: 29141 }
    ],
    capitalGainsShortRate: 0.28,
    capitalGainsLongRate: 0.28,
    dividendRate: 0.28,
    standardDeduction: 4104,
    charitableDeductionLimit: 0.15,
    mortgageInterestDeductible: false,
    description: 'Progressive system with NHR regime for new residents'
  },
  'United Arab Emirates': {
    country: 'United Arab Emirates',
    name: 'UAE Tax System',
    incomeBrackets: [
      { minIncome: 0, maxIncome: Infinity, rate: 0, baseAmount: 0 }
    ],
    capitalGainsShortRate: 0,
    capitalGainsLongRate: 0,
    dividendRate: 0,
    standardDeduction: 0,
    charitableDeductionLimit: 0,
    mortgageInterestDeductible: false,
    description: 'No personal income tax - attractive for high earners'
  },
  'Singapore': {
    country: 'Singapore',
    name: 'Singapore Tax System',
    incomeBrackets: [
      { minIncome: 0, maxIncome: 20000, rate: 0, baseAmount: 0 },
      { minIncome: 20000, maxIncome: 30000, rate: 0.02, baseAmount: 0 },
      { minIncome: 30000, maxIncome: 40000, rate: 0.035, baseAmount: 200 },
      { minIncome: 40000, maxIncome: 80000, rate: 0.07, baseAmount: 550 },
      { minIncome: 80000, maxIncome: 120000, rate: 0.115, baseAmount: 3350 },
      { minIncome: 120000, maxIncome: 160000, rate: 0.15, baseAmount: 7950 },
      { minIncome: 160000, maxIncome: 200000, rate: 0.18, baseAmount: 13950 },
      { minIncome: 200000, maxIncome: 240000, rate: 0.19, baseAmount: 21150 },
      { minIncome: 240000, maxIncome: 280000, rate: 0.195, baseAmount: 28750 },
      { minIncome: 280000, maxIncome: 320000, rate: 0.20, baseAmount: 36550 },
      { minIncome: 320000, maxIncome: Infinity, rate: 0.22, baseAmount: 44550 }
    ],
    capitalGainsShortRate: 0,
    capitalGainsLongRate: 0,
    dividendRate: 0,
    standardDeduction: 0,
    charitableDeductionLimit: 0.25,
    mortgageInterestDeductible: false,
    description: 'Low progressive rates with no capital gains tax'
  },
  'Canada': {
    country: 'Canada',
    name: 'Canadian Tax System',
    incomeBrackets: [
      { minIncome: 0, maxIncome: 55867, rate: 0.15, baseAmount: 0 },
      { minIncome: 55867, maxIncome: 111733, rate: 0.205, baseAmount: 8380 },
      { minIncome: 111733, maxIncome: 154906, rate: 0.26, baseAmount: 19832 },
      { minIncome: 154906, maxIncome: 220000, rate: 0.29, baseAmount: 31057 },
      { minIncome: 220000, maxIncome: Infinity, rate: 0.33, baseAmount: 49934 }
    ],
    capitalGainsShortRate: 0.265,
    capitalGainsLongRate: 0.265,
    dividendRate: 0.33,
    standardDeduction: 15705,
    charitableDeductionLimit: 0.75,
    mortgageInterestDeductible: false,
    description: 'Progressive federal rates plus provincial rates on top'
  },
  'Mexico': {
    country: 'Mexico',
    name: 'Mexican Tax System',
    incomeBrackets: [
      { minIncome: 0, maxIncome: 8952, rate: 0.0192, baseAmount: 0 },
      { minIncome: 8952, maxIncome: 75984, rate: 0.064, baseAmount: 172 },
      { minIncome: 75984, maxIncome: 133536, rate: 0.1088, baseAmount: 4462 },
      { minIncome: 133536, maxIncome: 155229, rate: 0.16, baseAmount: 10724 },
      { minIncome: 155229, maxIncome: 185852, rate: 0.1792, baseAmount: 14194 },
      { minIncome: 185852, maxIncome: 374837, rate: 0.2136, baseAmount: 19682 },
      { minIncome: 374837, maxIncome: 590796, rate: 0.2352, baseAmount: 60049 },
      { minIncome: 590796, maxIncome: 1127926, rate: 0.30, baseAmount: 110842 },
      { minIncome: 1127926, maxIncome: 1503902, rate: 0.32, baseAmount: 271982 },
      { minIncome: 1503902, maxIncome: 4511707, rate: 0.34, baseAmount: 392294 },
      { minIncome: 4511707, maxIncome: Infinity, rate: 0.35, baseAmount: 1414947 }
    ],
    capitalGainsShortRate: 0.10,
    capitalGainsLongRate: 0.10,
    dividendRate: 0.10,
    standardDeduction: 0,
    charitableDeductionLimit: 0.07,
    mortgageInterestDeductible: true,
    description: 'Many brackets with low capital gains rate'
  },
  'South Africa': {
    country: 'South Africa',
    name: 'South African Tax System',
    incomeBrackets: [
      { minIncome: 0, maxIncome: 237100, rate: 0.18, baseAmount: 0 },
      { minIncome: 237100, maxIncome: 370500, rate: 0.26, baseAmount: 42678 },
      { minIncome: 370500, maxIncome: 512800, rate: 0.31, baseAmount: 77362 },
      { minIncome: 512800, maxIncome: 673000, rate: 0.36, baseAmount: 121475 },
      { minIncome: 673000, maxIncome: 857900, rate: 0.39, baseAmount: 179147 },
      { minIncome: 857900, maxIncome: 1817000, rate: 0.41, baseAmount: 251258 },
      { minIncome: 1817000, maxIncome: Infinity, rate: 0.45, baseAmount: 644489 }
    ],
    capitalGainsShortRate: 0.18,
    capitalGainsLongRate: 0.18,
    dividendRate: 0.20,
    standardDeduction: 0,
    charitableDeductionLimit: 0.10,
    mortgageInterestDeductible: false,
    description: 'Progressive rates with inclusion-based capital gains'
  },
  'Austria': {
    country: 'Austria',
    name: 'Austrian Tax System',
    incomeBrackets: [
      { minIncome: 0, maxIncome: 11693, rate: 0, baseAmount: 0 },
      { minIncome: 11693, maxIncome: 19134, rate: 0.20, baseAmount: 0 },
      { minIncome: 19134, maxIncome: 32075, rate: 0.30, baseAmount: 1488 },
      { minIncome: 32075, maxIncome: 62080, rate: 0.40, baseAmount: 5371 },
      { minIncome: 62080, maxIncome: 93120, rate: 0.48, baseAmount: 17373 },
      { minIncome: 93120, maxIncome: 1000000, rate: 0.50, baseAmount: 32272 },
      { minIncome: 1000000, maxIncome: Infinity, rate: 0.55, baseAmount: 485712 }
    ],
    capitalGainsShortRate: 0.275,
    capitalGainsLongRate: 0.275,
    dividendRate: 0.275,
    standardDeduction: 11693,
    charitableDeductionLimit: 0.10,
    mortgageInterestDeductible: false,
    description: 'Progressive rates with flat 27.5% on investment income'
  }
}

// ============================================
// PERSONAL LOAN CONFIGURATION
// ============================================

export interface PersonalLoanConfig {
  type: PersonalLoanType
  name: string
  description: string
  
  // Loan parameters
  minAmount: number
  maxAmount: number
  minTermMonths: number
  maxTermMonths: number
  
  // Rate calculation
  baseRate: number          // Base interest rate
  creditScoreModifier: {    // Rate adjustment based on credit score
    excellent: number       // 750+
    good: number            // 700-749
    fair: number            // 650-699
    poor: number            // 600-649
    veryPoor: number        // Below 600
  }
  
  // Requirements
  minCreditScore: number
  maxDebtToIncomeRatio: number
  requiresCollateral: boolean
}

export const PERSONAL_LOAN_CONFIGS: Record<PersonalLoanType, PersonalLoanConfig> = {
  personal_loan: {
    type: 'personal_loan',
    name: 'Personal Loan',
    description: 'Unsecured loan for general purposes',
    minAmount: 10000,
    maxAmount: 500000,
    minTermMonths: 12,
    maxTermMonths: 84,
    baseRate: 0.08,
    creditScoreModifier: {
      excellent: -0.02,
      good: -0.01,
      fair: 0,
      poor: 0.03,
      veryPoor: 0.06
    },
    minCreditScore: 600,
    maxDebtToIncomeRatio: 0.43,
    requiresCollateral: false
  },
  credit_line: {
    type: 'credit_line',
    name: 'Personal Credit Line',
    description: 'Revolving credit with flexible access',
    minAmount: 25000,
    maxAmount: 1000000,
    minTermMonths: 12,
    maxTermMonths: 60,
    baseRate: 0.10,
    creditScoreModifier: {
      excellent: -0.025,
      good: -0.015,
      fair: 0,
      poor: 0.04,
      veryPoor: 0.08
    },
    minCreditScore: 650,
    maxDebtToIncomeRatio: 0.40,
    requiresCollateral: false
  },
  margin_loan: {
    type: 'margin_loan',
    name: 'Margin Loan',
    description: 'Loan secured against investment portfolio',
    minAmount: 50000,
    maxAmount: 5000000,
    minTermMonths: 1,
    maxTermMonths: 120,
    baseRate: 0.05,
    creditScoreModifier: {
      excellent: -0.01,
      good: -0.005,
      fair: 0,
      poor: 0.01,
      veryPoor: 0.02
    },
    minCreditScore: 550,  // Lower requirement due to collateral
    maxDebtToIncomeRatio: 0.60,
    requiresCollateral: true
  },
  bridge_loan: {
    type: 'bridge_loan',
    name: 'Bridge Loan',
    description: 'Short-term financing for immediate needs',
    minAmount: 100000,
    maxAmount: 2000000,
    minTermMonths: 3,
    maxTermMonths: 24,
    baseRate: 0.12,
    creditScoreModifier: {
      excellent: -0.02,
      good: -0.01,
      fair: 0,
      poor: 0.03,
      veryPoor: 0.05
    },
    minCreditScore: 650,
    maxDebtToIncomeRatio: 0.50,
    requiresCollateral: false
  }
}

// ============================================
// MORTGAGE CONFIGURATION
// ============================================

export interface MortgageConfig {
  name: string
  description: string
  
  minDownPaymentPercent: number
  maxLoanToValue: number
  minTermYears: number
  maxTermYears: number
  
  baseRate: number
  creditScoreModifier: {
    excellent: number
    good: number
    fair: number
    poor: number
    veryPoor: number
  }
  
  minCreditScore: number
  maxDebtToIncomeRatio: number
}

export const MORTGAGE_CONFIG: MortgageConfig = {
  name: 'Residential Mortgage',
  description: 'Loan secured against property purchase',
  minDownPaymentPercent: 10,
  maxLoanToValue: 90,
  minTermYears: 10,
  maxTermYears: 30,
  baseRate: 0.045,
  creditScoreModifier: {
    excellent: -0.005,
    good: -0.0025,
    fair: 0,
    poor: 0.01,
    veryPoor: 0.025
  },
  minCreditScore: 620,
  maxDebtToIncomeRatio: 0.43
}

// ============================================
// CREDIT SCORE CONFIGURATION
// ============================================

export const CREDIT_SCORE_CONFIG = {
  // Score ranges
  ranges: {
    excellent: { min: 750, max: 850 },
    good: { min: 700, max: 749 },
    fair: { min: 650, max: 699 },
    poor: { min: 600, max: 649 },
    veryPoor: { min: 300, max: 599 }
  },
  
  // Starting score by background
  startingScores: {
    self_made: 720,
    racing_dynasty: 780,
    tech_investor: 800,
    former_driver: 700,
    finance_mogul: 820,
    enthusiast: 680,
    corporate_exec: 760,
    lottery_winner: 650
  } as Record<string, number>,
  
  // Score impacts
  impacts: {
    onTimePayment: 2,
    latePayment: -15,
    missedPayment: -50,
    loanPaidOff: 15,
    newLoanOpened: -5,
    creditInquiry: -3,
    bankruptcy: -200,
    default: -100,
    highUtilization: -10,     // Using > 70% of available credit
    lowUtilization: 5         // Using < 30% of available credit
  },
  
  // Monthly passive recovery (when no negative events)
  monthlyRecovery: 1,
  
  // Min/max bounds
  min: 300,
  max: 850
}

// ============================================
// LIFESTYLE LEVELS
// ============================================

export type LifestyleLevel = 'frugal' | 'modest' | 'comfortable' | 'affluent' | 'luxury' | 'luxurious' | 'ultra_luxury'

export interface LifestyleLevelConfig {
  level: LifestyleLevel
  name: string
  description: string
  
  monthlyBaseCost: number
  
  // Effects
  reputationBonus: number
  sponsorAttractionBonus: number
  partnerHappinessBonus: number
  familyComfortBonus: number
  
  // Requirements
  minNetWorth: number
  minMonthlyIncome: number
}

export const LIFESTYLE_CONFIGS: Record<LifestyleLevel, LifestyleLevelConfig> = {
  frugal: {
    level: 'frugal',
    name: 'Frugal Living',
    description: 'Living below your means, prioritizing savings',
    monthlyBaseCost: 3000,
    reputationBonus: -5,
    sponsorAttractionBonus: -5,
    partnerHappinessBonus: -15,
    familyComfortBonus: -10,
    minNetWorth: 0,
    minMonthlyIncome: 0
  },
  modest: {
    level: 'modest',
    name: 'Modest Living',
    description: 'Simple apartment, economy car, minimal luxuries',
    monthlyBaseCost: 5000,
    reputationBonus: 0,
    sponsorAttractionBonus: 0,
    partnerHappinessBonus: -10,
    familyComfortBonus: -5,
    minNetWorth: 0,
    minMonthlyIncome: 0
  },
  comfortable: {
    level: 'comfortable',
    name: 'Comfortable',
    description: 'Nice house, reliable car, some luxuries',
    monthlyBaseCost: 15000,
    reputationBonus: 5,
    sponsorAttractionBonus: 5,
    partnerHappinessBonus: 0,
    familyComfortBonus: 0,
    minNetWorth: 500000,
    minMonthlyIncome: 20000
  },
  affluent: {
    level: 'affluent',
    name: 'Affluent',
    description: 'Upscale home, luxury vehicle, regular fine dining',
    monthlyBaseCost: 40000,
    reputationBonus: 10,
    sponsorAttractionBonus: 10,
    partnerHappinessBonus: 10,
    familyComfortBonus: 10,
    minNetWorth: 2000000,
    minMonthlyIncome: 60000
  },
  luxury: {
    level: 'luxury',
    name: 'Luxury',
    description: 'Mansion, exotic cars, personal staff, yacht',
    monthlyBaseCost: 120000,
    reputationBonus: 20,
    sponsorAttractionBonus: 20,
    partnerHappinessBonus: 20,
    familyComfortBonus: 20,
    minNetWorth: 10000000,
    minMonthlyIncome: 200000
  },
  luxurious: {
    level: 'luxurious',
    name: 'Luxurious',
    description: 'Ultra-premium lifestyle with elite amenities',
    monthlyBaseCost: 200000,
    reputationBonus: 25,
    sponsorAttractionBonus: 25,
    partnerHappinessBonus: 22,
    familyComfortBonus: 22,
    minNetWorth: 25000000,
    minMonthlyIncome: 350000
  },
  ultra_luxury: {
    level: 'ultra_luxury',
    name: 'Ultra Luxury',
    description: 'Multiple estates, private jet, full security detail',
    monthlyBaseCost: 350000,
    reputationBonus: 30,
    sponsorAttractionBonus: 30,
    partnerHappinessBonus: 25,
    familyComfortBonus: 25,
    minNetWorth: 50000000,
    minMonthlyIncome: 500000
  }
}

// ============================================
// TEAM VALUATION CONFIGURATION
// ============================================

export const TEAM_VALUATION_CONFIG = {
  // Revenue multiple method
  revenueMultiples: {
    entry: 1.5,
    amateur: 2.0,
    'semi-pro': 2.5,
    professional: 3.0,
    pro: 4.0,
    elite: 5.0,
    pinnacle: 8.0
  } as Record<string, number>,
  
  // Modifiers
  modifiers: {
    championshipWinner: 1.25,    // 25% boost if defending champion
    topThreeFinish: 1.10,        // 10% boost for top 3
    recentWins: 0.02,            // 2% per win this season
    facilityLevel: 0.05,         // 5% per average facility level
    staffQuality: 0.03,          // 3% per average staff rating above 70
    reputationBonus: 0.002,      // 0.2% per reputation point
    negativeBoard: 0.85,         // 15% reduction if board mood < 30
    financialTrouble: 0.70       // 30% reduction if debt > 50% of assets
  },
  
  // Minimum valuations by tier
  minimumValuations: {
    entry: 100000,
    amateur: 300000,
    'semi-pro': 750000,
    professional: 2000000,
    pro: 5000000,
    elite: 15000000,
    pinnacle: 50000000
  } as Record<string, number>
}

// ============================================
// DEFAULT STATE FACTORIES
// ============================================

export function createDefaultPersonalFinances(
  startingCash: number,
  taxResidency: Country,
  backgroundId?: string
): PersonalFinancialState {
  const creditScore = backgroundId && CREDIT_SCORE_CONFIG.startingScores[backgroundId]
    ? CREDIT_SCORE_CONFIG.startingScores[backgroundId]
    : 700
  
  return {
    liquidCash: startingCash,
    cachedNetWorth: startingCash,
    lastNetWorthUpdate: 0,
    
    monthlyIncome: {
      ownerSalary: 0,
      dividends: 0,
      rentalIncome: 0,
      investmentIncome: 0,
      endorsements: 0,
      speakingFees: 0,
      other: 0
    },
    
    monthlyExpenses: {
      lifestyle: 0,
      mortgagePayments: 0,
      loanPayments: 0,
      familyExpenses: 0,
      personalStaff: 0,
      hobbies: 0,
      philanthropy: 0,
      insurance: 0,
      other: 0
    },
    
    creditScore,
    creditHistory: [],
    
    taxResidency,
    lastTaxYear: 0,
    taxesPaidThisYear: 0,
    taxDeductionsThisYear: 0,
    
    personalLoans: [],
    mortgages: [],
    personalGuarantees: [],
    
    transactions: []
  }
}

export function createDefaultTeamEquity(
  initialInvestment: number,
  teamValuation?: number
): TeamEquityStake {
  const valuation = teamValuation || initialInvestment
  
  return {
    ownershipPercent: 100,
    sharesOwned: 1000000,  // 1 million shares
    totalShares: 1000000,
    
    totalInvested: initialInvestment,
    investmentHistory: [{
      id: `equity_initial_${Date.now()}`,
      date: { week: 1, year: 1 },
      amount: initialInvestment,
      type: 'initial',
      sharesReceived: 1000000,
      pricePerShare: initialInvestment / 1000000,
      notes: 'Initial team founding investment'
    }],
    
    currentValuation: valuation,
    lastValuationDate: { week: 1, year: 1 },
    valuationMethod: 'asset_based',
    
    unrealizedGain: valuation - initialInvestment,
    totalDividendsReceived: 0,
    
    externalInvestors: [],
    
    dividendPolicy: {
      enabled: false,
      frequency: 'quarterly',
      percentOfProfit: 25,
      minimumCashReserve: 500000
    }
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getCreditScoreCategory(score: number): 'excellent' | 'good' | 'fair' | 'poor' | 'veryPoor' {
  if (score >= CREDIT_SCORE_CONFIG.ranges.excellent.min) return 'excellent'
  if (score >= CREDIT_SCORE_CONFIG.ranges.good.min) return 'good'
  if (score >= CREDIT_SCORE_CONFIG.ranges.fair.min) return 'fair'
  if (score >= CREDIT_SCORE_CONFIG.ranges.poor.min) return 'poor'
  return 'veryPoor'
}

export function calculatePersonalLoanRate(
  loanType: PersonalLoanType,
  creditScore: number
): number {
  const config = PERSONAL_LOAN_CONFIGS[loanType]
  const category = getCreditScoreCategory(creditScore)
  return config.baseRate + config.creditScoreModifier[category]
}

export function calculateMortgageRate(creditScore: number): number {
  const category = getCreditScoreCategory(creditScore)
  return MORTGAGE_CONFIG.baseRate + MORTGAGE_CONFIG.creditScoreModifier[category]
}

export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  const monthlyRate = annualRate / 12
  if (monthlyRate === 0) return principal / termMonths
  
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1)
}

export function calculateNetWorth(
  personalFinances: PersonalFinancialState,
  teamEquity: TeamEquityStake,
  propertyValues: number,
  investmentValues: number
): number {
  // Assets
  const liquidAssets = personalFinances.liquidCash
  const propertyEquity = propertyValues - personalFinances.mortgages.reduce(
    (sum, m) => sum + m.remainingBalance, 0
  )
  const investments = investmentValues
  const teamEquityValue = teamEquity.currentValuation * (teamEquity.ownershipPercent / 100)
  
  // Liabilities
  const personalDebt = personalFinances.personalLoans.reduce(
    (sum, l) => sum + l.remainingBalance, 0
  )
  const guaranteeExposure = personalFinances.personalGuarantees
    .filter(g => g.isTriggered)
    .reduce((sum, g) => sum + g.amountClaimed, 0)
  
  return liquidAssets + propertyEquity + investments + teamEquityValue - personalDebt - guaranteeExposure
}

export function getRecommendedLifestyle(netWorth: number, monthlyIncome: number): LifestyleLevel {
  // Find the highest lifestyle level the person can afford
  const levels: LifestyleLevel[] = ['ultra_luxury', 'luxury', 'affluent', 'comfortable', 'modest']
  
  for (const level of levels) {
    const config = LIFESTYLE_CONFIGS[level]
    if (netWorth >= config.minNetWorth && monthlyIncome >= config.minMonthlyIncome) {
      return level
    }
  }
  
  return 'modest'
}
