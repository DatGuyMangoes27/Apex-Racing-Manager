// ============================================
// LOANS SYSTEM LOGIC
// ============================================
// Handles bank loans, private investors, and credit lines

import {
  BankLoan,
  PrivateInvestor,
  CreditLine,
  InvestorMilestone,
  LoansState,
  TeamTransaction,
  OwnedTeam
} from '@/store/careerStore'
import { TeamTier } from '@/store/rivalStore'
import { applyLoanInterestPerk } from '@/simulation/perkSystem'
import {
  BANK_LOAN_TERMS_BY_TIER,
  CREDIT_LINE_TERMS_BY_TIER,
  PRIVATE_INVESTOR_CONFIG_BY_TIER,
  CREDIT_SCORE_FACTORS,
  calculateLoanWeeklyPayment,
  calculateCreditLineWeeklyInterest,
  calculateCreditLineMaintenanceFee,
  getRandomLenderName,
  getRandomInvestorName
} from '@/data/financial-extended-config'
import { createTeamTransaction } from './teamFinances'

// ============================================
// LOAN ID GENERATION
// ============================================

let loanIdCounter = 0

function generateLoanId(type: string): string {
  return `${type}_${Date.now()}_${++loanIdCounter}`
}

// ============================================
// CREDIT SCORE CALCULATIONS
// ============================================

export function calculateCreditScore(
  loansState: LoansState,
  team: OwnedTeam,
  seasonProfitable: boolean
): number {
  let score = loansState.creditScore

  // Debt to equity ratio impact
  const equity = team.budgets.cash + ((loansState as any).investments?.portfolioValue || 0)
  const debtRatio = equity > 0 ? loansState.totalDebt / equity : 1
  if (debtRatio > 0.5) {
    score += CREDIT_SCORE_FACTORS.highDebtRatio
  }

  // Seasonal performance
  if (seasonProfitable) {
    score += CREDIT_SCORE_FACTORS.profitableSeason
  } else {
    score += CREDIT_SCORE_FACTORS.unprofitableSeason
  }

  // Clamp to valid range
  return Math.max(CREDIT_SCORE_FACTORS.minScore, Math.min(CREDIT_SCORE_FACTORS.maxScore, score))
}

export function updateCreditScoreOnPayment(currentScore: number, onTime: boolean): number {
  const delta = onTime 
    ? CREDIT_SCORE_FACTORS.onTimePayment 
    : CREDIT_SCORE_FACTORS.latePayment
  return Math.max(
    CREDIT_SCORE_FACTORS.minScore, 
    Math.min(CREDIT_SCORE_FACTORS.maxScore, currentScore + delta)
  )
}

export function updateCreditScoreOnLoanPaidOff(currentScore: number): number {
  return Math.min(CREDIT_SCORE_FACTORS.maxScore, currentScore + CREDIT_SCORE_FACTORS.loanPaidOff)
}

// ============================================
// BANK LOAN FUNCTIONS
// ============================================

export interface LoanApplicationResult {
  approved: boolean
  reason?: string
  loan?: BankLoan
  offeredRate?: number
  offeredAmount?: number
}

export function applyForBankLoan(
  requestedAmount: number,
  termWeeks: number,
  tier: TeamTier,
  creditScore: number,
  currentDebt: number,
  currentCash: number,
  collateral?: string,
  currentWeek?: number,
  currentYear?: number
): LoanApplicationResult {
  const terms = BANK_LOAN_TERMS_BY_TIER[tier]

  // Check credit score threshold
  if (creditScore < terms.approvalThreshold) {
    return {
      approved: false,
      reason: `Credit score ${creditScore} is below the required ${terms.approvalThreshold} for your tier.`
    }
  }

  // Check amount limits
  if (requestedAmount < terms.minAmount) {
    return {
      approved: false,
      reason: `Minimum loan amount is ${terms.minAmount.toLocaleString()}.`
    }
  }

  if (requestedAmount > terms.maxAmount) {
    return {
      approved: false,
      reason: `Maximum loan amount for your tier is ${terms.maxAmount.toLocaleString()}.`
    }
  }

  // Check term limits
  if (termWeeks < terms.minTerm || termWeeks > terms.maxTerm) {
    return {
      approved: false,
      reason: `Loan term must be between ${terms.minTerm} and ${terms.maxTerm} weeks.`
    }
  }

  // Check collateral requirement
  if (terms.requiresCollateral && !collateral) {
    return {
      approved: false,
      reason: 'Collateral is required for loans at your tier level.'
    }
  }

  // Debt to cash ratio check
  const projectedDebt = currentDebt + requestedAmount
  if (projectedDebt > currentCash * 3) {
    return {
      approved: false,
      reason: 'Your debt-to-cash ratio would be too high. Pay down existing debt first.'
    }
  }

  // Calculate interest rate (base rate adjusted by credit score)
  // Better credit = lower rate
  const creditAdjustment = (creditScore - 650) / 100 * -0.5  // ±0.5% per 100 points from 650
  const offeredRate = Math.max(2, terms.baseInterestRate + creditAdjustment)

  // Calculate weekly payment
  const weeklyPayment = calculateLoanWeeklyPayment(requestedAmount, offeredRate, termWeeks)

  const loan: BankLoan = {
    id: generateLoanId('bank_loan'),
    type: 'bank',
    lender: getRandomLenderName(),
    principal: requestedAmount,
    interestRate: offeredRate,
    remainingBalance: requestedAmount,
    weeklyPayment,
    totalWeeks: termWeeks,
    weeksRemaining: termWeeks,
    startWeek: currentWeek || 1,
    startYear: currentYear || 2025,
    status: 'active',
    collateral
  }

  return {
    approved: true,
    loan,
    offeredRate,
    offeredAmount: requestedAmount
  }
}

export function processWeeklyLoanPayment(
  loan: BankLoan,
  availableCash: number,
  week: number,
  year: number
): { updatedLoan: BankLoan; transaction?: TeamTransaction; missedPayment: boolean } {
  if (loan.status !== 'active') {
    return { updatedLoan: loan, missedPayment: false }
  }

  const canPay = availableCash >= loan.weeklyPayment

  if (!canPay) {
    // Missed payment - could lead to default
    return {
      updatedLoan: {
        ...loan,
        status: loan.weeksRemaining <= 4 ? 'defaulted' : 'active'  // Default if close to end and can't pay
      },
      missedPayment: true
    }
  }

  // Calculate interest portion of payment (apply loan interest perk)
  const effectiveRate = applyLoanInterestPerk(loan.interestRate / 100 / 52)
  const weeklyInterest = Math.round(loan.remainingBalance * effectiveRate)
  const principalPayment = loan.weeklyPayment - weeklyInterest
  const newBalance = Math.max(0, loan.remainingBalance - principalPayment)
  const newWeeksRemaining = loan.weeksRemaining - 1

  // Check if paid off
  const isPaidOff = newBalance <= 0 || newWeeksRemaining <= 0

  const updatedLoan: BankLoan = {
    ...loan,
    remainingBalance: isPaidOff ? 0 : newBalance,
    weeksRemaining: isPaidOff ? 0 : newWeeksRemaining,
    status: isPaidOff ? 'paid_off' : 'active'
  }

  // Create transaction for payment
  const transaction = createTeamTransaction(
    'expense',
    'loan_payment',
    loan.weeklyPayment,
    `${loan.lender} loan payment (Principal: $${principalPayment.toLocaleString()}, Interest: $${weeklyInterest.toLocaleString()})`,
    week,
    year,
    { countsTowardCostCap: false }
  )

  return { updatedLoan, transaction, missedPayment: false }
}

export function payOffLoanEarly(
  loan: BankLoan,
  week: number,
  year: number
): { updatedLoan: BankLoan; transaction: TeamTransaction; totalPaid: number } {
  // Early payoff - no penalty, just pay remaining balance
  const totalPaid = loan.remainingBalance

  const updatedLoan: BankLoan = {
    ...loan,
    remainingBalance: 0,
    weeksRemaining: 0,
    status: 'paid_off'
  }

  const transaction = createTeamTransaction(
    'expense',
    'loan_payment',
    totalPaid,
    `${loan.lender} loan early payoff`,
    week,
    year,
    { countsTowardCostCap: false }
  )

  return { updatedLoan, transaction, totalPaid }
}

// ============================================
// CREDIT LINE FUNCTIONS
// ============================================

export interface CreditLineApplicationResult {
  approved: boolean
  reason?: string
  creditLine?: CreditLine
}

export function applyForCreditLine(
  tier: TeamTier,
  creditScore: number,
  currentWeek: number,
  currentYear: number
): CreditLineApplicationResult {
  const config = CREDIT_LINE_TERMS_BY_TIER[tier]

  if (creditScore < config.approvalThreshold) {
    return {
      approved: false,
      reason: `Credit score ${creditScore} is below the required ${config.approvalThreshold}.`
    }
  }

  const creditLine: CreditLine = {
    id: generateLoanId('credit_line'),
    type: 'credit_line',
    lender: getRandomLenderName(),
    maxCredit: config.maxCredit,
    currentDrawn: 0,
    interestRate: config.interestRate,
    maintenanceFee: calculateCreditLineMaintenanceFee(config.maxCredit, config.maintenanceFeePercent),
    status: 'available',
    approvedWeek: currentWeek,
    approvedYear: currentYear
  }

  return { approved: true, creditLine }
}

export function drawFromCreditLine(
  creditLine: CreditLine,
  amount: number,
  week: number,
  year: number
): { updatedCreditLine: CreditLine; transaction: TeamTransaction } | { error: string } {
  if (creditLine.status !== 'available') {
    return { error: 'Credit line is not available for draws.' }
  }

  const availableCredit = creditLine.maxCredit - creditLine.currentDrawn
  if (amount > availableCredit) {
    return { error: `Only $${availableCredit.toLocaleString()} available on credit line.` }
  }

  const updatedCreditLine: CreditLine = {
    ...creditLine,
    currentDrawn: creditLine.currentDrawn + amount
  }

  const transaction = createTeamTransaction(
    'income',
    'credit_line_draw',
    amount,
    `Credit line draw from ${creditLine.lender}`,
    week,
    year,
    { countsTowardCostCap: false }
  )

  return { updatedCreditLine, transaction }
}

export function repayToCreditLine(
  creditLine: CreditLine,
  amount: number,
  week: number,
  year: number
): { updatedCreditLine: CreditLine; transaction: TeamTransaction } | { error: string } {
  if (amount > creditLine.currentDrawn) {
    return { error: 'Repayment amount exceeds drawn balance.' }
  }

  const updatedCreditLine: CreditLine = {
    ...creditLine,
    currentDrawn: creditLine.currentDrawn - amount
  }

  const transaction = createTeamTransaction(
    'expense',
    'credit_line_repay',
    amount,
    `Credit line repayment to ${creditLine.lender}`,
    week,
    year,
    { countsTowardCostCap: false }
  )

  return { updatedCreditLine, transaction }
}

export function processWeeklyCreditLineCharges(
  creditLine: CreditLine,
  week: number,
  year: number
): { transactions: TeamTransaction[]; totalCharges: number } {
  const transactions: TeamTransaction[] = []
  let totalCharges = 0

  // Maintenance fee (always charged if active)
  if (creditLine.status === 'available') {
    transactions.push(createTeamTransaction(
      'expense',
      'credit_line_fee',
      creditLine.maintenanceFee,
      `${creditLine.lender} credit line maintenance fee`,
      week,
      year,
      { countsTowardCostCap: false }
    ))
    totalCharges += creditLine.maintenanceFee
  }

  // Interest on drawn amount
  if (creditLine.currentDrawn > 0) {
    const weeklyInterest = calculateCreditLineWeeklyInterest(creditLine.currentDrawn, creditLine.interestRate)
    transactions.push(createTeamTransaction(
      'expense',
      'loan_interest',
      weeklyInterest,
      `${creditLine.lender} credit line interest`,
      week,
      year,
      { countsTowardCostCap: false }
    ))
    totalCharges += weeklyInterest
  }

  return { transactions, totalCharges }
}

// ============================================
// PRIVATE INVESTOR FUNCTIONS
// ============================================

export interface InvestorOfferResult {
  investor: PrivateInvestor
  equityOffered: number
  investmentAmount: number
  milestones: InvestorMilestone[]
}

export function generateInvestorOffer(
  tier: TeamTier,
  teamReputation: number,
  requestedAmount: number,
  currentWeek: number,
  currentYear: number
): InvestorOfferResult | { error: string } {
  const config = PRIVATE_INVESTOR_CONFIG_BY_TIER[tier]

  if (requestedAmount < config.minInvestment) {
    return { error: `Minimum investment is $${config.minInvestment.toLocaleString()}.` }
  }

  if (requestedAmount > config.maxInvestment) {
    return { error: `Maximum investment at your tier is $${config.maxInvestment.toLocaleString()}.` }
  }

  // Calculate equity based on amount and reputation
  // Higher reputation = investor accepts less equity
  const reputationFactor = Math.max(0.5, 1 - (teamReputation - 50) / 200)  // 0.5x to 1.25x
  const baseEquityPercent = (requestedAmount / config.maxInvestment) * config.maxEquityPercent
  const equityOffered = Math.max(
    config.minEquityPercent,
    Math.min(config.maxEquityPercent, baseEquityPercent * reputationFactor)
  )

  // Generate milestones
  const milestones: InvestorMilestone[] = []
  const milestoneTypes = [
    'Achieve top 10 in championship standings',
    'Secure a major sponsor deal',
    'Win at least one race',
    'Finish a season in top 5',
    'Expand to a second series'
  ]

  const milestonesCount = Math.min(config.typicalMilestoneCount, milestoneTypes.length)
  const selectedMilestones = [...milestoneTypes].sort(() => Math.random() - 0.5).slice(0, milestonesCount)

  selectedMilestones.forEach((description, i) => {
    milestones.push({
      id: `milestone_${Date.now()}_${i}`,
      description,
      targetWeek: 52,  // End of season
      targetYear: currentYear + Math.floor(i / 2),  // Stagger over years
      completed: false,
      penalty: Math.round(requestedAmount * 0.05)  // 5% of investment as penalty
    })
  })

  // Calculate buyback multiple
  const buybackMultiple = config.buybackMultipleRange[0] + 
    Math.random() * (config.buybackMultipleRange[1] - config.buybackMultipleRange[0])

  const investor: PrivateInvestor = {
    id: generateLoanId('investor'),
    type: 'private_investor',
    investorName: getRandomInvestorName(),
    investmentAmount: requestedAmount,
    equityStake: equityOffered,
    milestones,
    boardSeatGranted: equityOffered >= 20,  // Board seat if significant equity
    exitClause: {
      year: currentYear + 5,
      buybackMultiple: Math.round(buybackMultiple * 100) / 100
    },
    status: 'active',
    investedWeek: currentWeek,
    investedYear: currentYear
  }

  return {
    investor,
    equityOffered,
    investmentAmount: requestedAmount,
    milestones
  }
}

export function acceptInvestorOffer(
  offer: InvestorOfferResult,
  week: number,
  year: number
): { investor: PrivateInvestor; transaction: TeamTransaction } {
  const transaction = createTeamTransaction(
    'income',
    'equity_sale',
    offer.investmentAmount,
    `Investment from ${offer.investor.investorName} (${offer.equityOffered.toFixed(1)}% equity)`,
    week,
    year,
    { countsTowardCostCap: false }
  )

  return { investor: offer.investor, transaction }
}

export function processInvestorMilestones(
  investor: PrivateInvestor,
  currentWeek: number,
  currentYear: number,
  checkMilestoneCompletion: (milestone: InvestorMilestone) => boolean
): { updatedInvestor: PrivateInvestor; penalties: TeamTransaction[] } {
  const penalties: TeamTransaction[] = []
  
  const updatedMilestones = investor.milestones.map(milestone => {
    // Check if past deadline
    const isPastDeadline = currentYear > milestone.targetYear || 
      (currentYear === milestone.targetYear && currentWeek > milestone.targetWeek)

    if (milestone.completed) {
      return milestone
    }

    // Check if completed now
    if (checkMilestoneCompletion(milestone)) {
      return { ...milestone, completed: true }
    }

    // Apply penalty if past deadline and not completed
    if (isPastDeadline && milestone.penalty) {
      penalties.push(createTeamTransaction(
        'expense',
        'investor_milestone_penalty',
        milestone.penalty,
        `Missed milestone penalty: ${milestone.description}`,
        currentWeek,
        currentYear,
        { countsTowardCostCap: false }
      ))
    }

    return milestone
  })

  return {
    updatedInvestor: { ...investor, milestones: updatedMilestones },
    penalties
  }
}

export function buyoutInvestor(
  investor: PrivateInvestor,
  currentYear: number,
  week: number,
  year: number
): { buyoutCost: number; transaction: TeamTransaction } {
  // Calculate buyout cost
  let buyoutCost = investor.investmentAmount

  // Apply buyback multiple if within exit clause period
  if (investor.exitClause && currentYear <= investor.exitClause.year) {
    buyoutCost = Math.round(investor.investmentAmount * investor.exitClause.buybackMultiple)
  } else {
    // After exit clause, negotiate (1.5x base)
    buyoutCost = Math.round(investor.investmentAmount * 1.5)
  }

  const transaction = createTeamTransaction(
    'expense',
    'equity_sale',  // Buying back equity
    buyoutCost,
    `Buyout of ${investor.investorName}'s ${investor.equityStake.toFixed(1)}% stake`,
    week,
    year,
    { countsTowardCostCap: false }
  )

  return { buyoutCost, transaction }
}

// ============================================
// LOANS STATE AGGREGATION
// ============================================

export function calculateLoansStateTotals(
  bankLoans: BankLoan[],
  _privateInvestors: PrivateInvestor[],
  creditLines: CreditLine[],
  teamEquity: number
): Partial<LoansState> {
  // Total debt
  const bankDebt = bankLoans
    .filter(l => l.status === 'active')
    .reduce((sum, l) => sum + l.remainingBalance, 0)
  const creditDebt = creditLines
    .filter(cl => cl.status === 'available')
    .reduce((sum, cl) => sum + cl.currentDrawn, 0)
  const totalDebt = bankDebt + creditDebt

  // Weekly debt service
  const weeklyBankPayments = bankLoans
    .filter(l => l.status === 'active')
    .reduce((sum, l) => sum + l.weeklyPayment, 0)
  const weeklyCreditFees = creditLines
    .filter(cl => cl.status === 'available')
    .reduce((sum, cl) => sum + cl.maintenanceFee + calculateCreditLineWeeklyInterest(cl.currentDrawn, cl.interestRate), 0)
  const weeklyDebtService = weeklyBankPayments + weeklyCreditFees

  // Debt to equity ratio
  const debtToEquityRatio = teamEquity > 0 ? totalDebt / teamEquity : 0

  return {
    totalDebt,
    weeklyDebtService,
    debtToEquityRatio
  }
}

// ============================================
// WEEKLY PROCESSING
// ============================================

export interface WeeklyLoansProcessingResult {
  updatedLoans: LoansState
  transactions: TeamTransaction[]
  totalExpenses: number
  missedPayments: number
  creditScoreChange: number
}

export function processWeeklyLoans(
  loansState: LoansState,
  availableCash: number,
  teamEquity: number,
  week: number,
  year: number
): WeeklyLoansProcessingResult {
  const transactions: TeamTransaction[] = []
  let totalExpenses = 0
  let missedPayments = 0
  let creditScoreChange = 0
  let remainingCash = availableCash

  // Process bank loans
  const updatedBankLoans = loansState.bankLoans.map(loan => {
    const result = processWeeklyLoanPayment(loan, remainingCash, week, year)
    
    if (result.transaction) {
      transactions.push(result.transaction)
      totalExpenses += result.transaction.amount
      remainingCash -= result.transaction.amount
    }

    if (result.missedPayment) {
      missedPayments++
      creditScoreChange += CREDIT_SCORE_FACTORS.missedPayment
    } else if (result.transaction) {
      creditScoreChange += CREDIT_SCORE_FACTORS.onTimePayment
    }

    if (result.updatedLoan.status === 'paid_off' && loan.status === 'active') {
      creditScoreChange += CREDIT_SCORE_FACTORS.loanPaidOff
    }

    return result.updatedLoan
  })

  // Process credit lines
  const updatedCreditLines = [...loansState.creditLines]
  loansState.creditLines.forEach((creditLine, _index) => {
    const result = processWeeklyCreditLineCharges(creditLine, week, year)
    transactions.push(...result.transactions)
    totalExpenses += result.totalCharges
    remainingCash -= result.totalCharges
  })

  // Calculate new credit score
  const newCreditScore = Math.max(
    CREDIT_SCORE_FACTORS.minScore,
    Math.min(CREDIT_SCORE_FACTORS.maxScore, loansState.creditScore + creditScoreChange)
  )

  // Calculate totals
  const totals = calculateLoansStateTotals(
    updatedBankLoans,
    loansState.privateInvestors,
    updatedCreditLines,
    teamEquity
  )

  const updatedLoans: LoansState = {
    ...loansState,
    bankLoans: updatedBankLoans,
    creditLines: updatedCreditLines,
    creditScore: newCreditScore,
    ...totals
  }

  return {
    updatedLoans,
    transactions,
    totalExpenses,
    missedPayments,
    creditScoreChange
  }
}
