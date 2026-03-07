import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Clock, AlertTriangle, Plus, Percent, CheckCircle, X, CheckCircle2, Target, Landmark, CreditCard, Users, Wallet } from 'lucide-react';
import { Card, CardHeader, Badge, Button, Progress, Modal, useToast, BankLogo } from '@/components/ui';
import { getBankLogo } from '@/utils/generated-assets';
import { useCareerStore, createDefaultExtendedFinancialState } from '@/store/careerStore';
import type { BankLoan, LoansState, CreditLine, PrivateInvestor, TeamTransaction } from '@/store/careerStore';
import type { TeamTier } from '@/store/rivalStore';
import type { LoanApplicationResult, InvestorOfferResult, InvestorCounterOffer } from '@/simulation/finances/loans';
import { applyForBankLoan, applyForCreditLine, generateInvestorOffer, drawFromCreditLine, repayToCreditLine, payOffLoanEarly, buyoutInvestor } from '@/simulation/finances/loans';
import { BANK_LOAN_TERMS_BY_TIER, CREDIT_LINE_TERMS_BY_TIER, PRIVATE_INVESTOR_CONFIG_BY_TIER, calculateLoanWeeklyPayment } from '@/data/financial-extended-config';
import { formatCurrency } from '@/data/financial-config';
import { getActivityTimeCost } from '@/data/activity-time-costs';
import { routeNotification } from '@/services/notificationRouter';

// Simple CreditScoreGauge component
function CreditScoreGauge({ score }: { score: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 750) return 'text-status-success'
    if (s >= 700) return 'text-status-info'
    if (s >= 650) return 'text-status-warning'
    return 'text-status-danger'
  }
  
  return (
    <div className="text-center">
      <div className={`text-3xl font-bold font-mono ${getScoreColor(score)}`}>
        {score}
      </div>
    </div>
  )
}

function LoanCard({ loan, onPayOff }: { loan: BankLoan; onPayOff: () => void }) {
  const progress = ((loan.totalWeeks - loan.weeksRemaining) / loan.totalWeeks) * 100

  return (
    <Card variant="glass" padding="md" className="space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <BankLogo
            src={getBankLogo(loan.lender)}
            name={loan.lender}
            size="sm"
          />
          <div>
            <div className="font-semibold">{loan.lender}</div>
            <div className="text-sm text-text-muted">
              {loan.collateral ? `Secured by ${loan.collateral}` : 'Unsecured'}
            </div>
          </div>
        </div>
        <Badge variant={loan.status === 'active' ? 'green' : loan.status === 'paid_off' ? 'blue' : 'red'}>
          {loan.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-text-muted">Principal</div>
          <div className="font-mono">{formatCurrency(loan.principal)}</div>
        </div>
        <div>
          <div className="text-text-muted">Remaining</div>
          <div className="font-mono text-status-warning">{formatCurrency(loan.remainingBalance)}</div>
        </div>
        <div>
          <div className="text-text-muted">Interest Rate</div>
          <div className="font-mono">{loan.interestRate.toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-text-muted">Weekly Payment</div>
          <div className="font-mono text-status-danger">{formatCurrency(loan.weeklyPayment)}</div>
        </div>
      </div>

      {loan.status === 'active' && (
        <>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Progress</span>
              <span>{loan.totalWeeks - loan.weeksRemaining} / {loan.totalWeeks} weeks</span>
            </div>
            <div className="h-2 bg-background-elevated rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent-blue to-accent-gold"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={onPayOff}
          >
            Pay Off Early ({formatCurrency(loan.remainingBalance)})
          </Button>
        </>
      )}
    </Card>
  )
}

function CreditLineCard({
  creditLine,
  onDraw,
  onRepay
}: {
  creditLine: CreditLine
  onDraw: (amount: number) => void
  onRepay: (amount: number) => void
}) {
  const [drawAmount, setDrawAmount] = useState('')
  const [repayAmount, setRepayAmount] = useState('')
  const available = creditLine.maxCredit - creditLine.currentDrawn
  const utilizationPercent = (creditLine.currentDrawn / creditLine.maxCredit) * 100

  return (
    <Card variant="glass" padding="md" className="space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <BankLogo
            src={getBankLogo(creditLine.lender)}
            name={creditLine.lender}
            size="sm"
          />
          <div>
            <div className="font-semibold">{creditLine.lender}</div>
            <div className="text-sm text-text-muted">Revolving Credit Line</div>
          </div>
        </div>
        <Badge variant={creditLine.status === 'available' ? 'green' : 'red'}>
          {creditLine.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-text-muted">Credit Limit</div>
          <div className="font-mono">{formatCurrency(creditLine.maxCredit)}</div>
        </div>
        <div>
          <div className="text-text-muted">Available</div>
          <div className="font-mono text-status-success">{formatCurrency(available)}</div>
        </div>
        <div>
          <div className="text-text-muted">Currently Drawn</div>
          <div className="font-mono text-status-warning">{formatCurrency(creditLine.currentDrawn)}</div>
        </div>
        <div>
          <div className="text-text-muted">Interest Rate</div>
          <div className="font-mono">{creditLine.interestRate.toFixed(1)}%</div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Utilization</span>
          <span className={utilizationPercent > 80 ? 'text-status-danger' : ''}>{utilizationPercent.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-background-elevated rounded-full overflow-hidden">
          <div
            className={`h-full ${utilizationPercent > 80 ? 'bg-status-danger' : 'bg-status-success'}`}
            style={{ width: `${utilizationPercent}%` }}
          />
        </div>
      </div>

      {creditLine.status === 'available' && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <input
              type="number"
              placeholder="Draw amount..."
              value={drawAmount}
              onChange={(e) => setDrawAmount(e.target.value)}
              className="w-full px-2 py-1 text-sm bg-background-elevated border border-surface-border rounded text-white placeholder-text-muted"
            />
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => {
                const amount = parseInt(drawAmount)
                if (amount > 0 && amount <= available) {
                  onDraw(amount)
                  setDrawAmount('')
                }
              }}
              disabled={!drawAmount || parseInt(drawAmount) > available}
            >
              Draw Funds
            </Button>
          </div>
          <div className="space-y-1">
            <input
              type="number"
              placeholder="Repay amount..."
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              className="w-full px-2 py-1 text-sm bg-background-elevated border border-surface-border rounded text-white placeholder-text-muted"
            />
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => {
                const amount = parseInt(repayAmount)
                if (amount > 0 && amount <= creditLine.currentDrawn) {
                  onRepay(amount)
                  setRepayAmount('')
                }
              }}
              disabled={!repayAmount || parseInt(repayAmount) > creditLine.currentDrawn}
            >
              Repay
            </Button>
          </div>
        </div>
      )}

      <div className="text-xs text-text-muted">
        Weekly maintenance fee: {formatCurrency(creditLine.maintenanceFee)}
      </div>
    </Card>
  )
}

function InvestorCard({
  investor,
  currentWeek: _currentWeek,
  currentYear: _currentYear,
  onBuyout
}: {
  investor: PrivateInvestor
  currentWeek: number
  currentYear: number
  onBuyout: () => void
}) {
  const completedMilestones = investor.milestones.filter(m => m.completed).length
  const totalMilestones = investor.milestones.length

  return (
    <Card variant="glass" padding="md" className="space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold">{investor.investorName}</div>
          <div className="text-sm text-text-muted">Private Investor</div>
        </div>
        <Badge variant={investor.status === 'active' ? 'purple' : 'default'}>
          {investor.equityStake.toFixed(1)}% equity
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-text-muted">Investment</div>
          <div className="font-mono text-status-success">{formatCurrency(investor.investmentAmount)}</div>
        </div>
        <div>
          <div className="text-text-muted">Board Seat</div>
          <div className={investor.boardSeatGranted ? 'text-status-warning' : 'text-text-muted'}>
            {investor.boardSeatGranted ? 'Yes' : 'No'}
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Milestones</span>
          <span>{completedMilestones} / {totalMilestones}</span>
        </div>
        {investor.milestones.map(milestone => (
          <div key={milestone.id} className="flex items-start gap-2 text-sm">
            {milestone.completed ? (
              <CheckCircle2 className="w-4 h-4 text-status-success flex-shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
            )}
            <div>
              <div className={milestone.completed ? 'text-text-muted line-through' : ''}>
                {milestone.description}
              </div>
              {!milestone.completed && milestone.penalty && (
                <div className="text-xs text-status-danger">
                  Penalty if missed: {formatCurrency(milestone.penalty)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {investor.exitClause && investor.status === 'active' && (
        <div className="p-2 bg-background-elevated/50 rounded text-sm">
          <div className="text-text-muted">Buyout Terms</div>
          <div>
            {investor.exitClause.buybackMultiple}x until Year {investor.exitClause.year}
          </div>
          <div className="text-accent-gold font-mono">
            ≈ {formatCurrency(investor.investmentAmount * investor.exitClause.buybackMultiple)}
          </div>
        </div>
      )}

      {investor.status === 'active' && (
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={onBuyout}
        >
          Buy Out Investor
        </Button>
      )}
    </Card>
  )
}

// ============================================
// NEW LOAN MODAL
// ============================================

function NewLoanModal({
  isOpen,
  onClose,
  tier,
  creditScore,
  currentDebt,
  currentCash,
  currentWeek,
  currentYear,
  onApply
}: {
  isOpen: boolean
  onClose: () => void
  tier: TeamTier
  creditScore: number
  currentDebt: number
  currentCash: number
  currentWeek: number
  currentYear: number
  onApply: (loan: BankLoan) => void
}) {
  const terms = BANK_LOAN_TERMS_BY_TIER[tier]
  const [amount, setAmount] = useState(terms.minAmount.toString())
  const [termWeeks, setTermWeeks] = useState(terms.minTerm.toString())
  const [collateral, setCollateral] = useState('')
  const [result, setResult] = useState<LoanApplicationResult | null>(null)

  const weeklyPayment = useMemo(() => {
    const amt = parseInt(amount) || 0
    const weeks = parseInt(termWeeks) || 52
    return calculateLoanWeeklyPayment(amt, terms.baseInterestRate, weeks)
  }, [amount, termWeeks, terms.baseInterestRate])

  const handleApply = () => {
    const applicationResult = applyForBankLoan(
      parseInt(amount) || 0,
      parseInt(termWeeks) || 52,
      tier,
      creditScore,
      currentDebt,
      currentCash,
      terms.requiresCollateral ? collateral : undefined,
      currentWeek,
      currentYear
    )
    setResult(applicationResult)
    
    if (applicationResult.approved && applicationResult.loan) {
      onApply(applicationResult.loan)
      onClose()
    }
  }

  const handleAcceptCounterOffer = () => {
    if (result && !result.approved && result.loan) {
      onApply(result.loan)
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply for Bank Loan" size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 p-3 bg-background-elevated/50 rounded-lg text-sm">
          <div>
            <div className="text-text-muted">Credit Score</div>
            <div className={`font-mono ${creditScore >= terms.approvalThreshold ? 'text-status-success' : 'text-status-danger'}`}>
              {creditScore} / {terms.approvalThreshold} min
            </div>
          </div>
          <div>
            <div className="text-text-muted">Loan Range</div>
            <div className="font-mono">{formatCurrency(terms.minAmount)} - {formatCurrency(terms.maxAmount)}</div>
          </div>
          <div>
            <div className="text-text-muted">Base Rate</div>
            <div className="font-mono">{terms.baseInterestRate}% APR</div>
          </div>
          <div>
            <div className="text-text-muted">Term Range</div>
            <div className="font-mono">{terms.minTerm} - {terms.maxTerm} weeks</div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-text-muted mb-1">Loan Amount</label>
            <select
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 bg-background-elevated border border-surface-border rounded-lg text-white"
            >
              {Array.from({ length: Math.floor((terms.maxAmount - terms.minAmount) / 25000) + 1 }, (_, i) => {
                const amt = terms.minAmount + (i * 25000)
                return amt <= terms.maxAmount ? (
                  <option key={amt} value={amt}>{formatCurrency(amt)}</option>
                ) : null
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm text-text-muted mb-1">Term (weeks)</label>
            <select
              value={termWeeks}
              onChange={(e) => setTermWeeks(e.target.value)}
              className="w-full px-3 py-2 bg-background-elevated border border-surface-border rounded-lg text-white"
            >
              {[26, 39, 52, 78, 104, 156].filter(w => w >= terms.minTerm && w <= terms.maxTerm).map(weeks => (
                <option key={weeks} value={weeks}>
                  {weeks} weeks ({Math.round(weeks / 52 * 10) / 10} {weeks >= 52 ? 'years' : 'year'})
                </option>
              ))}
            </select>
          </div>

          {terms.requiresCollateral && (
            <div>
              <label className="block text-sm text-text-muted mb-1">Collateral (required)</label>
              <select
                value={collateral}
                onChange={(e) => setCollateral(e.target.value)}
                className="w-full px-3 py-2 bg-background-elevated border border-surface-border rounded-lg text-white placeholder-text-muted"
              >
                <option value="">Select collateral...</option>
                <option value="facilities">Team Facilities</option>
                <option value="equipment">Racing Equipment</option>
                <option value="cars">Team Cars</option>
              </select>
            </div>
          )}
        </div>

        <div className="p-3 bg-surface-800 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Estimated Weekly Payment</span>
            <span className="font-mono text-lg text-status-warning">{formatCurrency(weeklyPayment)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-text-muted">Total Interest</span>
            <span className="font-mono text-status-danger">
              {formatCurrency(weeklyPayment * parseInt(termWeeks || '52') - parseInt(amount || '0'))}
            </span>
          </div>
        </div>

        {result && !result.approved && (
          <div className="p-3 bg-status-danger/20 border border-status-danger/50 rounded-lg text-sm text-status-danger">
            {result.reason}
          </div>
        )}

        {result && !result.approved && result.loan && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setResult(null)} className="flex-1">Try different terms</Button>
            <Button variant="primary" onClick={handleAcceptCounterOffer} className="flex-1">Accept counter-offer</Button>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button 
            variant="primary" 
            onClick={handleApply} 
            className="flex-1"
            disabled={terms.requiresCollateral && !collateral}
          >
            Apply for Loan
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ============================================
// CREDIT LINE APPLICATION MODAL
// ============================================

function CreditLineModal({
  isOpen,
  onClose,
  tier,
  creditScore,
  currentWeek,
  currentYear,
  onApply
}: {
  isOpen: boolean
  onClose: () => void
  tier: TeamTier
  creditScore: number
  currentWeek: number
  currentYear: number
  onApply: (requestedLimit?: number) => void
}) {
  const config = CREDIT_LINE_TERMS_BY_TIER[tier]
  const minCredit = config.minCredit ?? 0
  const [requestedLimit, setRequestedLimit] = useState<string>(config.maxCredit.toString())

  const handleApply = () => {
    const limit = requestedLimit ? parseInt(requestedLimit, 10) : undefined
    const clamped = limit != null ? Math.min(config.maxCredit, Math.max(minCredit, limit)) : undefined
    onApply(clamped)
    onClose()
  }

  const presets = useMemo(() => {
    const step = Math.max(1, Math.floor((config.maxCredit - minCredit) / 4))
    return [minCredit, minCredit + step, minCredit + step * 2, minCredit + step * 3, config.maxCredit].filter((v, i, a) => a.indexOf(v) === i)
  }, [config.maxCredit, minCredit])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply for Credit Line" size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 p-3 bg-background-elevated/50 rounded-lg text-sm">
          <div>
            <div className="text-text-muted">Credit Score</div>
            <div className={`font-mono ${creditScore >= config.approvalThreshold ? 'text-status-success' : 'text-status-danger'}`}>
              {creditScore} / {config.approvalThreshold} min
            </div>
          </div>
          <div>
            <div className="text-text-muted">Tier Limit Range</div>
            <div className="font-mono">{formatCurrency(minCredit)} - {formatCurrency(config.maxCredit)}</div>
          </div>
          <div>
            <div className="text-text-muted">Interest Rate (drawn)</div>
            <div className="font-mono">{config.interestRate}% APR</div>
          </div>
          <div>
            <div className="text-text-muted">Approval Threshold</div>
            <div className="font-mono">{config.approvalThreshold}</div>
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-muted mb-1">Requested Credit Limit</label>
          <div className="flex gap-2 flex-wrap">
            {presets.map(amt => (
              <Button
                key={amt}
                variant={requestedLimit === String(amt) ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setRequestedLimit(String(amt))}
              >
                {formatCurrency(amt)}
              </Button>
            ))}
          </div>
          <input
            type="number"
            min={minCredit}
            max={config.maxCredit}
            value={requestedLimit}
            onChange={(e) => setRequestedLimit(e.target.value)}
            className="mt-2 w-full px-3 py-2 bg-background-elevated border border-surface-border rounded-lg text-white"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={handleApply} className="flex-1">
            Apply for Credit Line
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ============================================
// NEW INVESTOR MODAL
// ============================================

function NewInvestorModal({
  isOpen,
  onClose,
  tier,
  teamReputation,
  currentDebt,
  currentCash,
  currentWeek,
  currentYear,
  onAccept
}: {
  isOpen: boolean
  onClose: () => void
  tier: TeamTier
  teamReputation: number
  currentDebt: number
  currentCash: number
  currentWeek: number
  currentYear: number
  onAccept: (investor: PrivateInvestor) => void
}) {
  const config = PRIVATE_INVESTOR_CONFIG_BY_TIER[tier]
  const [amount, setAmount] = useState(config.minInvestment.toString())
  const [offer, setOffer] = useState<InvestorOfferResult | InvestorCounterOffer | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateOffer = () => {
    const result = generateInvestorOffer(
      tier,
      teamReputation,
      parseInt(amount) || config.minInvestment,
      currentWeek,
      currentYear,
      { currentDebt, currentCash }
    )
    if ('error' in result) {
      setError(result.error)
      setOffer(null)
    } else {
      setOffer(result)
      setError(null)
    }
  }

  const handleAccept = () => {
    if (offer && 'investor' in offer) {
      onAccept(offer.investor)
      onClose()
    }
  }

  const handleTryDifferent = () => {
    setOffer(null)
    setError(null)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Seek Private Investment" size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 p-3 bg-background-elevated/50 rounded-lg text-sm">
          <div>
            <div className="text-text-muted">Investment Range</div>
            <div className="font-mono">{formatCurrency(config.minInvestment)} - {formatCurrency(config.maxInvestment)}</div>
          </div>
          <div>
            <div className="text-text-muted">Equity Range</div>
            <div className="font-mono">{config.minEquityPercent}% - {config.maxEquityPercent}%</div>
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-muted mb-1">Investment Amount Sought</label>
          <select
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 bg-background-elevated border border-surface-border rounded-lg text-white"
          >
            {Array.from({ length: Math.floor((config.maxInvestment - config.minInvestment) / 50000) + 1 }, (_, i) => {
              const amt = config.minInvestment + (i * 50000)
              return amt <= config.maxInvestment ? (
                <option key={amt} value={amt}>{formatCurrency(amt)}</option>
              ) : null
            })}
          </select>
        </div>

        <Button variant="secondary" onClick={handleGenerateOffer} className="w-full">
          Generate Investor Offer
        </Button>

        {error && (
          <div className="p-3 bg-status-danger/20 border border-status-danger/50 rounded-lg text-sm text-status-danger">
            {error}
          </div>
        )}

        {offer && (
          <div className="space-y-3 p-3 bg-background-elevated/50 rounded-lg">
            <div className="font-semibold">{offer.investor.investorName}</div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-text-muted">Investment</div>
                <div className="font-mono text-status-success">{formatCurrency(offer.investmentAmount)}</div>
              </div>
              <div>
                <div className="text-text-muted">Equity Requested</div>
                <div className="font-mono text-status-warning">{offer.equityOffered.toFixed(1)}%</div>
              </div>
            </div>

            <div className="text-sm">
              <div className="text-text-muted mb-1">Required Milestones:</div>
              <ul className="space-y-1">
                {offer.milestones.map(m => (
                  <li key={m.id} className="flex items-center gap-2">
                    <Target className="w-3 h-3 text-accent-gold" />
                    {m.description}
                  </li>
                ))}
              </ul>
            </div>

            {offer.investor.boardSeatGranted && (
              <div className="text-sm text-status-warning flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Investor requests board seat (may affect team patience)
              </div>
            )}

            {offer.investor.exitClause && (
              <div className="text-sm text-text-muted">
                Buyback: {offer.investor.exitClause.buybackMultiple}x until Year {offer.investor.exitClause.year}
              </div>
            )}

            <div className="flex gap-2 mt-4 flex-wrap">
              <Button variant="secondary" onClick={handleTryDifferent} className="flex-1 min-w-0">Try different amount</Button>
              <Button variant="secondary" onClick={onClose} className="flex-1 min-w-0">Decline</Button>
              <Button variant="primary" onClick={handleAccept} className="flex-1 min-w-0">Accept Investment</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

interface LoansPanelProps {
  _teamId?: string
  tier: TeamTier
}

export function LoansPanel({ _teamId, tier }: LoansPanelProps) {
  const [showLoanModal, setShowLoanModal] = useState(false)
  const [showCreditLineModal, setShowCreditLineModal] = useState(false)
  const [showInvestorModal, setShowInvestorModal] = useState(false)
  const { addToast } = useToast()
  
  // Get data from store
  const { careerState, setOwnedTeam, consumeHoursFromBudget, addPersonalCalendarEntry } = useCareerStore()
  const ownedTeam = careerState?.ownedTeam
  const currentWeek = careerState?.currentWeek || 1
  const currentYear = careerState?.currentYear || 2024
  
  // Get or create loans state
  const loansState: LoansState = useMemo(() => {
    if (ownedTeam?.finances?.extended?.loans) {
      return ownedTeam.finances.extended.loans
    }
    return createDefaultExtendedFinancialState().loans
  }, [ownedTeam?.finances?.extended?.loans])
  
  // Update loans state in store
  const updateLoansState = useCallback((newLoansState: LoansState) => {
    if (!ownedTeam) return
    
    const currentExtended = ownedTeam.finances?.extended || createDefaultExtendedFinancialState()
    
    setOwnedTeam({
      ...ownedTeam,
      finances: {
        ...ownedTeam.finances,
        extended: {
          ...currentExtended,
          loans: newLoansState
        }
      }
    })
  }, [ownedTeam, setOwnedTeam])

  // Helper to create and record a transaction
  const createTransaction = (
    type: 'income' | 'expense',
    amount: number,
    description: string
  ): TeamTransaction => ({
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString(),
    week: currentWeek,
    year: currentYear,
    type,
    category: 'other',
    amount,
    description,
    countsTowardCostCap: false
  })

  // Helper to update cash and record transaction
  const updateCashAndTransaction = (
    cashChange: number,
    transaction: TeamTransaction
  ) => {
    if (!ownedTeam) return
    
    const newCash = (ownedTeam.budgets?.cash || 0) + cashChange
    const existingTransactions = ownedTeam.finances?.transactions || []
    
    setOwnedTeam({
      ...ownedTeam,
      budgets: {
        ...ownedTeam.budgets,
        cash: newCash
      },
      finances: {
        ...ownedTeam.finances,
        transactions: [...existingTransactions, transaction]
      }
    })
  }

  const handleApplyCreditLine = (requestedLimit?: number) => {
    // === TIME BUDGET INTEGRATION ===
    const loanTimeCost = getActivityTimeCost('loan_meeting')
    if (loanTimeCost.hours > 0) {
      consumeHoursFromBudget(loanTimeCost.hours, loanTimeCost.drain, 'Credit Line Application', 'loan_meeting')
    }
    addPersonalCalendarEntry({
      name: 'Credit Line Application',
      description: 'Meeting with bank to apply for credit line',
      activityId: 'loan_meeting',
      week: currentWeek,
      day: careerState?.currentDay ?? 1,
      duration: loanTimeCost.hours,
      drainLevel: loanTimeCost.drain,
      calendarEntryType: 'personal',
      category: 'personal',
      immediate: true
    })

    const result = applyForCreditLine(tier, loansState.creditScore, currentWeek, currentYear, requestedLimit)
    if (result.approved && result.creditLine) {
      updateLoansState({
        ...loansState,
        creditLines: [...loansState.creditLines, result.creditLine]
      })
      routeNotification({
        category: 'finances',
        subject: 'Credit Line Approved',
        body: `Your credit line application has been approved. ${formatCurrency(result.creditLine.maxCredit)} credit line from ${result.creditLine.lender}.`,
        emailCategory: 'team'
      })
      addToast({
        type: 'success',
        title: 'Credit Line Approved',
        message: `${formatCurrency(result.creditLine.maxCredit)} credit line from ${result.creditLine.lender}`
      })
    } else {
      addToast({
        type: 'error',
        title: 'Application Denied',
        message: result.reason || 'Unable to approve credit line'
      })
    }
  }
  
  const handleApplyForLoan = (loan: BankLoan) => {
    // === TIME BUDGET INTEGRATION ===
    const loanTimeCost = getActivityTimeCost('loan_meeting')
    if (loanTimeCost.hours > 0) {
      consumeHoursFromBudget(loanTimeCost.hours, loanTimeCost.drain, 'Loan Application Meeting', 'loan_meeting')
    }
    addPersonalCalendarEntry({
      name: 'Loan Application',
      description: `Loan application meeting with ${loan.lender}`,
      activityId: 'loan_meeting',
      week: currentWeek,
      day: careerState?.currentDay ?? 1,
      duration: loanTimeCost.hours,
      drainLevel: loanTimeCost.drain,
      calendarEntryType: 'personal',
      category: 'personal',
      immediate: true
    })

    // Add loan amount to cash
    const transaction = createTransaction(
      'income',
      loan.principal,
      `Bank loan received from ${loan.lender}`
    )
    updateCashAndTransaction(loan.principal, transaction)
    
    updateLoansState({
      ...loansState,
      bankLoans: [...loansState.bankLoans, loan],
      totalDebt: loansState.totalDebt + loan.principal,
      weeklyDebtService: loansState.weeklyDebtService + loan.weeklyPayment
    })
    
    routeNotification({
      category: 'finances',
      subject: 'Loan Approved',
      body: `Your loan application has been approved. ${formatCurrency(loan.principal)} received from ${loan.lender}.`,
      emailCategory: 'team'
    })
    addToast({ type: 'success', title: 'Loan Approved', message: `Received ${formatCurrency(loan.principal)} from ${loan.lender}` })
  }
  
  const handleAcceptInvestor = (investor: PrivateInvestor) => {
    // Add investor's capital to cash
    const transaction = createTransaction(
      'income',
      investor.investmentAmount,
      `Private investment from ${investor.investorName} (${investor.equityStake.toFixed(1)}% equity)`
    )
    updateCashAndTransaction(investor.investmentAmount, transaction)
    
    updateLoansState({
      ...loansState,
      privateInvestors: [...loansState.privateInvestors, investor]
    })
    
    addToast({ type: 'success', title: 'Investment Accepted', message: `Received ${formatCurrency(investor.investmentAmount)} from ${investor.investorName}` })
  }
  
  const handleDrawCreditLine = (creditLineId: string, amount: number) => {
    const creditLine = loansState.creditLines.find(cl => cl.id === creditLineId)
    if (!creditLine) return
    
    const result = drawFromCreditLine(creditLine, amount, currentWeek, currentYear)
    if ('error' in result) {
      addToast({ type: 'error', title: 'Draw Failed', message: result.error })
      return
    }
    
    updateCashAndTransaction(amount, result.transaction)
    
    const updated = loansState.creditLines.map(cl => 
      cl.id === creditLineId ? result.updatedCreditLine : cl
    )
    updateLoansState({
      ...loansState,
      creditLines: updated,
      totalDebt: loansState.totalDebt + amount
    })
    
    addToast({ type: 'success', title: 'Credit Drawn', message: `Drew ${formatCurrency(amount)} from credit line` })
  }
  
  const handleRepayCreditLine = (creditLineId: string, amount: number) => {
    const creditLine = loansState.creditLines.find(cl => cl.id === creditLineId)
    if (!creditLine) return
    
    // Check if we have enough cash
    const currentCash = ownedTeam?.budgets?.cash || 0
    if (currentCash < amount) {
      addToast({ type: 'error', title: 'Insufficient Funds', message: `Need ${formatCurrency(amount)} but only have ${formatCurrency(currentCash)}` })
      return
    }
    
    const result = repayToCreditLine(creditLine, amount, currentWeek, currentYear)
    if ('error' in result) {
      addToast({ type: 'error', title: 'Repayment Failed', message: result.error })
      return
    }
    
    updateCashAndTransaction(-amount, result.transaction)
    
    const updated = loansState.creditLines.map(cl => 
      cl.id === creditLineId ? result.updatedCreditLine : cl
    )
    updateLoansState({
      ...loansState,
      creditLines: updated,
      totalDebt: Math.max(0, loansState.totalDebt - amount)
    })
    
    addToast({ type: 'success', title: 'Credit Repaid', message: `Repaid ${formatCurrency(amount)} to credit line` })
  }
  
  const handlePayOffLoan = (loanId: string) => {
    const loan = loansState.bankLoans.find(l => l.id === loanId)
    if (!loan) return
    
    const currentCash = ownedTeam?.budgets?.cash || 0
    if (currentCash < loan.remainingBalance) {
      addToast({ type: 'error', title: 'Insufficient Funds', message: `Need ${formatCurrency(loan.remainingBalance)} but only have ${formatCurrency(currentCash)}` })
      return
    }
    
    const { updatedLoan, transaction, totalPaid } = payOffLoanEarly(loan, currentWeek, currentYear)
    updateCashAndTransaction(-totalPaid, transaction)
    
    const updated = loansState.bankLoans.map(l => (l.id === loanId ? updatedLoan : l))
    updateLoansState({
      ...loansState,
      bankLoans: updated,
      totalDebt: Math.max(0, loansState.totalDebt - totalPaid),
      weeklyDebtService: Math.max(0, loansState.weeklyDebtService - loan.weeklyPayment)
    })
    
    addToast({ type: 'success', title: 'Loan Paid Off', message: `Fully repaid ${formatCurrency(totalPaid)} to ${loan.lender}` })
  }
  
  const handleBuyoutInvestor = (investorId: string) => {
    const investor = loansState.privateInvestors.find(i => i.id === investorId)
    if (!investor) return
    
    const { buyoutCost, transaction } = buyoutInvestor(investor, currentYear, currentWeek, currentYear)
    
    const currentCash = ownedTeam?.budgets?.cash || 0
    if (currentCash < buyoutCost) {
      addToast({ type: 'error', title: 'Insufficient Funds', message: `Need ${formatCurrency(buyoutCost)} to buy out investor` })
      return
    }
    
    updateCashAndTransaction(-buyoutCost, transaction)
    
    const updated = loansState.privateInvestors.map(i =>
      i.id === investorId ? { ...i, status: 'bought_out' as const } : i
    )
    updateLoansState({
      ...loansState,
      privateInvestors: updated
    })
    
    addToast({ type: 'success', title: 'Investor Bought Out', message: `Paid ${formatCurrency(buyoutCost)} to buy out ${investor.investorName}` })
  }

  const activeLoans = loansState.bankLoans.filter(l => l.status === 'active')
  const activeCreditLines = loansState.creditLines.filter(cl => cl.status === 'available')
  const activeInvestors = loansState.privateInvestors.filter(i => i.status === 'active')

  return (
    <div className="space-y-6">
      {/* What affects credit + last change */}
      <Card variant="glass" padding="md" className="text-sm">
        <div className="font-semibold text-text-muted mb-1">What affects your credit</div>
        <p className="text-text-muted mb-2">
          On-time payments (+), missed payments (−), paying off loans (+), profitable seasons (+), losses (−), and high credit line utilization (−).
        </p>
        {loansState.lastWeekCreditChange != null && loansState.lastWeekCreditChange !== 0 && (
          <p className={loansState.lastWeekCreditChange >= 0 ? 'text-status-success' : 'text-status-danger'}>
            Last week: {loansState.lastWeekCreditChange >= 0 ? '+' : ''}{loansState.lastWeekCreditChange} points
          </p>
        )}
      </Card>

      {/* Warnings */}
      {(() => {
        const cash = ownedTeam?.budgets?.cash ?? 0
        const debtServicePct = cash > 0 ? (loansState.weeklyDebtService / cash) * 100 : 0
        const totalCreditLimit = loansState.creditLines.filter(cl => cl.status === 'available').reduce((s, cl) => s + cl.maxCredit, 0)
        const totalDrawn = loansState.creditLines.filter(cl => cl.status === 'available').reduce((s, cl) => s + cl.currentDrawn, 0)
        const utilizationPct = totalCreditLimit > 0 ? (totalDrawn / totalCreditLimit) * 100 : 0
        const showDebtWarning = debtServicePct > 30 && loansState.weeklyDebtService > 0
        const showUtilWarning = utilizationPct > 75 && totalCreditLimit > 0
        if (!showDebtWarning && !showUtilWarning) return null
        return (
          <div className="flex flex-col gap-2">
            {showDebtWarning && (
              <div className="p-3 bg-status-warning/20 border border-status-warning/50 rounded-lg text-sm text-status-warning flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Debt service is {debtServicePct.toFixed(0)}% of cash — consider reducing debt or increasing revenue.
              </div>
            )}
            {showUtilWarning && (
              <div className="p-3 bg-status-warning/20 border border-status-warning/50 rounded-lg text-sm text-status-warning flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                High credit utilization ({utilizationPct.toFixed(0)}%) may hurt your credit score.
              </div>
            )}
          </div>
        )
      })()}

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card variant="glass" padding="md" className="text-center">
          <CreditScoreGauge score={loansState.creditScore} />
          <div className="text-xs text-text-muted mt-2">Credit Score</div>
        </Card>

        <Card variant="glass" padding="md">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <Landmark className="w-4 h-4" />
            <span className="text-sm">Total Debt</span>
          </div>
          <div className="text-2xl font-bold font-mono text-status-danger">
            {formatCurrency(loansState.totalDebt)}
          </div>
          <div className="text-xs text-text-muted mt-1">
            Weekly service: {formatCurrency(loansState.weeklyDebtService)}
          </div>
        </Card>

        <Card variant="glass" padding="md">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <CreditCard className="w-4 h-4" />
            <span className="text-sm">Available Credit</span>
          </div>
          <div className="text-2xl font-bold font-mono text-status-success">
            {formatCurrency(activeCreditLines.reduce((sum, cl) => sum + (cl.maxCredit - cl.currentDrawn), 0))}
          </div>
          <div className="text-xs text-text-muted mt-1">
            {activeCreditLines.length} active credit line(s)
          </div>
        </Card>

        <Card variant="glass" padding="md">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">Investor Equity</span>
          </div>
          <div className="text-2xl font-bold font-mono text-accent-gold">
            {activeInvestors.reduce((sum, i) => sum + i.equityStake, 0).toFixed(1)}%
          </div>
          <div className="text-xs text-text-muted mt-1">
            {activeInvestors.length} private investor(s)
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="primary" onClick={() => setShowLoanModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Apply for Bank Loan
        </Button>
        <Button 
          variant="secondary" 
          onClick={() => setShowCreditLineModal(true)}
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Get Credit Line
        </Button>
        <Button variant="secondary" onClick={() => setShowInvestorModal(true)}>
          <Users className="w-4 h-4 mr-2" />
          Seek Investor
        </Button>
      </div>

      {/* Active Loans */}
      {activeLoans.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Landmark className="w-5 h-5 text-accent-gold" />
            Active Loans ({activeLoans.length})
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {activeLoans.map(loan => (
              <LoanCard 
                key={loan.id} 
                loan={loan} 
                onPayOff={() => handlePayOffLoan(loan.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Credit Lines */}
      {activeCreditLines.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-accent-blue" />
            Credit Lines ({activeCreditLines.length})
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {activeCreditLines.map(creditLine => (
              <CreditLineCard
                key={creditLine.id}
                creditLine={creditLine}
                onDraw={(amount) => handleDrawCreditLine(creditLine.id, amount)}
                onRepay={(amount) => handleRepayCreditLine(creditLine.id, amount)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Private Investors */}
      {activeInvestors.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Private Investors ({activeInvestors.length})
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {activeInvestors.map(investor => (
              <InvestorCard
                key={investor.id}
                investor={investor}
                currentWeek={currentWeek}
                currentYear={currentYear}
                onBuyout={() => handleBuyoutInvestor(investor.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeLoans.length === 0 && activeCreditLines.length === 0 && activeInvestors.length === 0 && (
        <Card variant="glass" padding="lg" className="text-center">
          <Wallet className="w-12 h-12 mx-auto text-text-muted mb-3" />
          <div className="text-lg font-semibold mb-1">No Active Financing</div>
          <div className="text-text-muted mb-4">
            Apply for a bank loan, open a credit line, or seek private investment to fund your team's growth.
          </div>
        </Card>
      )}

      {/* Modals */}
      <NewLoanModal
        isOpen={showLoanModal}
        onClose={() => setShowLoanModal(false)}
        tier={tier}
        creditScore={loansState.creditScore}
        currentDebt={loansState.totalDebt}
        currentCash={ownedTeam?.budgets?.cash || 0}
        currentWeek={currentWeek}
        currentYear={currentYear}
        onApply={handleApplyForLoan}
      />

      <CreditLineModal
        isOpen={showCreditLineModal}
        onClose={() => setShowCreditLineModal(false)}
        tier={tier}
        creditScore={loansState.creditScore}
        currentWeek={currentWeek}
        currentYear={currentYear}
        onApply={(creditLine) => {
          handleApplyCreditLine(creditLine)
          setShowCreditLineModal(false)
        }}
      />

      <NewInvestorModal
        isOpen={showInvestorModal}
        onClose={() => setShowInvestorModal(false)}
        tier={tier}
        teamReputation={ownedTeam?.reputation || 50}
        currentDebt={loansState.totalDebt}
        currentCash={ownedTeam?.budgets?.cash || 0}
        currentWeek={currentWeek}
        currentYear={currentYear}
        onAccept={handleAcceptInvestor}
      />
    </div>
  )
}
