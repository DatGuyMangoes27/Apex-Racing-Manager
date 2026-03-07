import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Wallet, TrendingUp, TrendingDown, Building2, Home, Briefcase,
  DollarSign, PiggyBank, Landmark, ChevronRight,
  ArrowUpRight, ArrowDownRight, BarChart3, PieChart, X,
  Pencil, Check, AlertTriangle
} from 'lucide-react'
import { 
  Card, 
  CardHeader, 
  Badge, 
  Button,
  Modal
} from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import type { PersonalFinancialState, TeamEquityStake, PersonalTransaction } from '@/data/personal-finance-config'
import { calculateNetWorth } from '@/data/personal-finance-config'
import type { StockHolding, BusinessVenture } from '@/data/investment-config'

// ============================================
// TYPES
// ============================================

interface WealthOverviewProps {
  finances: PersonalFinancialState
  teamEquity?: TeamEquityStake
  teamName: string
  teamBalance?: number
  currentWeek: number
  currentYear: number
  onInjectCapital?: (amount: number) => void
  onWithdrawFunds?: (amount: number) => void
  onSeekInvestors?: () => void
  onSetOwnerSalary?: (monthlySalary: number) => { success: boolean; message: string }
  stockHoldings?: StockHolding[]
  businessVentures?: BusinessVenture[]
  properties?: Array<{ currentValue?: number }>
}

// ============================================
// MAIN COMPONENT
// ============================================

export function WealthOverview({
  finances,
  teamEquity,
  teamName,
  teamBalance = 0,
  currentWeek,
  currentYear,
  onInjectCapital,
  onWithdrawFunds,
  onSeekInvestors,
  onSetOwnerSalary,
  stockHoldings = [],
  businessVentures = [],
  properties = []
}: WealthOverviewProps) {
  const maxWithdrawal = Math.floor(teamBalance * 0.5) // Can only withdraw up to 50% of team balance
  const [showTransactions, setShowTransactions] = useState(false)
  const [showInjectModal, setShowInjectModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showInvestorsModal, setShowInvestorsModal] = useState(false)
  const [capitalAmount, setCapitalAmount] = useState(100000)
  const [editingSalary, setEditingSalary] = useState(false)
  const [salaryInput, setSalaryInput] = useState(finances.monthlyIncome.ownerSalary || 0)
  const { addToast } = useToast()

  // Calculate totals
  const totalIncome = useMemo(() => {
    const income = finances.monthlyIncome
    return (income.ownerSalary || 0) + (income.dividends || 0) + 
           (income.endorsements || 0) + (income.rentalIncome || 0) +
           (income.investmentIncome || 0) + (income.speakingFees || 0) +
           (income.other || 0)
  }, [finances.monthlyIncome])

  const totalExpenses = useMemo(() => {
    const expenses = finances.monthlyExpenses
    return (expenses.personalStaff || 0) +
           (expenses.mortgagePayments || 0) +
           (expenses.familyExpenses || 0) + (expenses.hobbies || 0) +
           (expenses.loanPayments || 0) + (expenses.philanthropy || 0) +
           (expenses.services || 0) + (expenses.dietPlan || 0) +
           (expenses.petUpkeep || 0) + (expenses.vehicleCosts || 0) +
           (expenses.membershipFees || 0) + (expenses.rent || 0) +
           (expenses.other || 0)
  }, [finances.monthlyExpenses])

  const equityValue = teamEquity 
    ? teamEquity.currentValuation * (teamEquity.ownershipPercent / 100)
    : 0

  const totalDebt = useMemo(() => {
    const loanDebt = finances.personalLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0)
    const mortgageDebt = finances.mortgages.reduce((sum, m) => sum + m.remainingBalance, 0)
    return loanDebt + mortgageDebt
  }, [finances.personalLoans, finances.mortgages])

  // Dynamic net worth calculation as safety net (recalculated from actual values)
  const dynamicNetWorth = useMemo(() => {
    if (!teamEquity) return finances.cachedNetWorth
    
    const propertyValues = properties.reduce((sum, p) => sum + (p.currentValue || 0), 0)
    const stockValues = stockHoldings.reduce((sum, h) => sum + h.currentValue, 0)
    const bizValues = businessVentures.reduce(
      (sum, b) => sum + b.currentValuation * (b.ownershipPercent / 100), 0
    )
    const investmentValues = stockValues + bizValues
    
    return calculateNetWorth(finances, teamEquity, propertyValues, investmentValues)
  }, [finances, teamEquity, stockHoldings, businessVentures, properties])

  // Salary affordability check
  const salaryWeeksOfRunway = useMemo(() => {
    const weeklySalary = salaryInput / 4
    if (weeklySalary <= 0) return Infinity
    return Math.floor(teamBalance / weeklySalary)
  }, [salaryInput, teamBalance])

  const recentTransactions = finances.transactions.slice(-10).reverse()

  return (
    <div className="space-y-6">
      {/* Net Worth Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card variant="racing" padding="lg" className="col-span-2">
          <CardHeader 
            title="Net Worth" 
            icon={<Wallet className="w-5 h-5" />}
          />
          <div className="p-6 bg-background rounded-xl text-center">
            <p className="font-mono font-bold text-5xl text-accent-gold">
              ${dynamicNetWorth.toLocaleString()}
            </p>
            <p className="text-sm text-text-muted mt-2">
              Week {currentWeek}, Year {currentYear}
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-text-muted">Liquid Cash</p>
              <p className="font-mono font-bold text-lg text-status-success">
                ${finances.liquidCash.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-text-muted">Team Equity</p>
              <p className="font-mono font-bold text-lg text-accent-blue">
                ${equityValue.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-text-muted">Total Debt</p>
              <p className="font-mono font-bold text-lg text-status-danger">
                -${totalDebt.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Monthly Cash Flow */}
        <Card variant="glass" padding="lg" className="col-span-2">
          <CardHeader 
            title="Monthly Cash Flow" 
            icon={<BarChart3 className="w-5 h-5" />}
          />
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-status-success/10 border border-status-success/30 rounded-xl">
              <p className="text-sm text-status-success mb-1">Monthly Income</p>
              <p className="font-mono font-bold text-2xl text-status-success">
                +${totalIncome.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-status-danger/10 border border-status-danger/30 rounded-xl">
              <p className="text-sm text-status-danger mb-1">Monthly Expenses</p>
              <p className="font-mono font-bold text-2xl text-status-danger">
                -${totalExpenses.toLocaleString()}
              </p>
            </div>
          </div>

          <div className={`p-4 rounded-xl ${
            totalIncome - totalExpenses >= 0 
              ? 'bg-status-success/20 border border-status-success/40' 
              : 'bg-status-danger/20 border border-status-danger/40'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">Net Monthly</span>
              <span className={`font-mono font-bold text-2xl ${
                totalIncome - totalExpenses >= 0 ? 'text-status-success' : 'text-status-danger'
              }`}>
                {totalIncome - totalExpenses >= 0 ? '+' : ''}${(totalIncome - totalExpenses).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Income Breakdown */}
      <div className="grid grid-cols-2 gap-6">
        <Card variant="glass" padding="lg">
          <CardHeader 
            title="Income Sources" 
            icon={<TrendingUp className="w-5 h-5 text-status-success" />}
          />
          <div className="space-y-3">
            {/* Owner Salary - Editable */}
            {editingSalary ? (
              <div className="p-3 bg-background/50 rounded-lg border border-accent-blue/40">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-status-success/20 flex items-center justify-center text-status-success">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">Set Owner Salary</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-muted text-sm">$</span>
                  <input
                    type="number"
                    value={salaryInput}
                    onChange={(e) => setSalaryInput(Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 px-3 py-1.5 bg-background border border-surface-border rounded-lg font-mono text-sm focus:outline-none focus:border-accent-blue"
                    min={0}
                    step={1000}
                  />
                  <span className="text-text-muted text-xs">/mo</span>
                  <button
                    onClick={() => {
                      if (onSetOwnerSalary) {
                        const result = onSetOwnerSalary(salaryInput)
                        if (result.success) {
                          addToast({ type: 'success', title: 'Salary Updated', message: result.message })
                        } else {
                          addToast({ type: 'error', title: 'Failed', message: result.message })
                        }
                      }
                      setEditingSalary(false)
                    }}
                    className="p-1.5 rounded-lg bg-status-success/20 text-status-success hover:bg-status-success/30 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSalaryInput(finances.monthlyIncome.ownerSalary || 0)
                      setEditingSalary(false)
                    }}
                    className="p-1.5 rounded-lg bg-status-danger/20 text-status-danger hover:bg-status-danger/30 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {salaryWeeksOfRunway < 12 && salaryInput > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-status-warning">
                    <AlertTriangle className="w-3 h-3" />
                    Team can only sustain this for ~{salaryWeeksOfRunway} weeks
                  </div>
                )}
                <div className="grid grid-cols-4 gap-1 mt-2">
                  {[0, 5000, 10000, 15000, 25000, 50000, 75000, 100000].map(preset => (
                    <button
                      key={preset}
                      onClick={() => setSalaryInput(preset)}
                      className={`text-xs px-2 py-1 rounded font-mono transition-colors ${
                        salaryInput === preset 
                          ? 'bg-accent-blue/30 text-accent-blue' 
                          : 'bg-surface hover:bg-surface-secondary text-text-muted'
                      }`}
                    >
                      {preset === 0 ? '$0' : `$${(preset / 1000)}k`}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div 
                className="flex items-center justify-between p-3 bg-background/50 rounded-lg group cursor-pointer hover:bg-background/70 transition-colors"
                onClick={() => {
                  setSalaryInput(finances.monthlyIncome.ownerSalary || 0)
                  setEditingSalary(true)
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-status-success/20 flex items-center justify-center text-status-success">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <span className="text-sm">Owner Salary</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-status-success">
                    +${(finances.monthlyIncome.ownerSalary || 0).toLocaleString()}
                  </span>
                  <Pencil className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            )}
            <IncomeRow 
              label="Dividends" 
              amount={finances.monthlyIncome.dividends || 0}
              icon={<Building2 className="w-4 h-4" />}
            />
            <IncomeRow 
              label="Endorsements" 
              amount={finances.monthlyIncome.endorsements || 0}
              icon={<DollarSign className="w-4 h-4" />}
            />
            <IncomeRow 
              label="Rental Income" 
              amount={finances.monthlyIncome.rentalIncome || 0}
              icon={<Home className="w-4 h-4" />}
            />
            <IncomeRow 
              label="Investment Income" 
              amount={finances.monthlyIncome.investmentIncome || 0}
              icon={<TrendingUp className="w-4 h-4" />}
            />
            {(finances.monthlyIncome.speakingFees || 0) > 0 && (
              <IncomeRow 
                label="Speaking Fees" 
                amount={finances.monthlyIncome.speakingFees || 0}
                icon={<DollarSign className="w-4 h-4" />}
              />
            )}
          </div>
        </Card>

        <Card variant="glass" padding="lg">
          <CardHeader 
            title="Expenses" 
            icon={<TrendingDown className="w-5 h-5 text-status-danger" />}
          />
          <div className="space-y-3">
            {(finances.monthlyExpenses.personalStaff || 0) > 0 && (
              <ExpenseRow 
                label="Personal Staff" 
                amount={finances.monthlyExpenses.personalStaff || 0}
              />
            )}
            {(finances.monthlyExpenses.mortgagePayments || 0) > 0 && (
              <ExpenseRow 
                label="Mortgage Payments" 
                amount={finances.monthlyExpenses.mortgagePayments || 0}
              />
            )}
            {(finances.monthlyExpenses.loanPayments || 0) > 0 && (
              <ExpenseRow 
                label="Loan Payments" 
                amount={finances.monthlyExpenses.loanPayments || 0}
              />
            )}
            {(finances.monthlyExpenses.familyExpenses || 0) > 0 && (
              <ExpenseRow 
                label="Family Expenses" 
                amount={finances.monthlyExpenses.familyExpenses || 0}
              />
            )}
            {(finances.monthlyExpenses.hobbies || 0) > 0 && (
              <ExpenseRow 
                label="Hobbies" 
                amount={finances.monthlyExpenses.hobbies || 0}
              />
            )}
            {(finances.monthlyExpenses.philanthropy || 0) > 0 && (
              <ExpenseRow 
                label="Philanthropy" 
                amount={finances.monthlyExpenses.philanthropy || 0}
              />
            )}
            {(finances.monthlyExpenses.services || 0) > 0 && (
              <ExpenseRow 
                label="Services" 
                amount={finances.monthlyExpenses.services || 0}
              />
            )}
            {(finances.monthlyExpenses.dietPlan || 0) > 0 && (
              <ExpenseRow 
                label="Diet Plan" 
                amount={finances.monthlyExpenses.dietPlan || 0}
              />
            )}
            {(finances.monthlyExpenses.petUpkeep || 0) > 0 && (
              <ExpenseRow 
                label="Pet Care" 
                amount={finances.monthlyExpenses.petUpkeep || 0}
              />
            )}
            {(finances.monthlyExpenses.vehicleCosts || 0) > 0 && (
              <ExpenseRow 
                label="Vehicle Costs" 
                amount={finances.monthlyExpenses.vehicleCosts || 0}
              />
            )}
            {(finances.monthlyExpenses.membershipFees || 0) > 0 && (
              <ExpenseRow 
                label="Memberships" 
                amount={finances.monthlyExpenses.membershipFees || 0}
              />
            )}
            {(finances.monthlyExpenses.rent || 0) > 0 && (
              <ExpenseRow 
                label="Rent" 
                amount={finances.monthlyExpenses.rent || 0}
              />
            )}
            {(finances.monthlyExpenses.other || 0) > 0 && (
              <ExpenseRow 
                label="Security" 
                amount={finances.monthlyExpenses.other || 0}
              />
            )}
          </div>
        </Card>
      </div>

      {/* Team Equity Details */}
      {teamEquity && (
        <Card variant="racing" padding="lg">
          <CardHeader 
            title={`${teamName} Equity Stake`} 
            icon={<Building2 className="w-5 h-5" />}
          />
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-background rounded-lg">
              <p className="text-sm text-text-muted">Ownership</p>
              <p className="font-mono font-bold text-2xl text-accent-blue">
                {teamEquity.ownershipPercent.toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-background rounded-lg">
              <p className="text-sm text-text-muted">Your Equity Value</p>
              <p className="font-mono font-bold text-2xl text-accent-gold">
                ${equityValue.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-background rounded-lg">
              <p className="text-sm text-text-muted">Total Invested</p>
              <p className="font-mono font-bold text-2xl">
                ${teamEquity.totalInvested.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-background rounded-lg">
              <p className="text-sm text-text-muted">Unrealized Gain</p>
              <p className={`font-mono font-bold text-2xl ${
                equityValue - teamEquity.totalInvested >= 0 ? 'text-status-success' : 'text-status-danger'
              }`}>
                {equityValue - teamEquity.totalInvested >= 0 ? '+' : ''}
                ${(equityValue - teamEquity.totalInvested).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-text-muted mb-2">Team Cash Balance</p>
              <p className={`font-mono font-bold text-xl ${teamBalance > 100000 ? 'text-status-success' : teamBalance > 0 ? 'text-status-warning' : 'text-status-danger'}`}>
                ${teamBalance.toLocaleString()}
              </p>
              <p className="text-xs text-text-muted mt-1">
                Available for operations
              </p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-text-muted mb-2">Team Valuation</p>
              <p className="font-mono font-bold text-xl">
                ${teamEquity.currentValuation.toLocaleString()}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {teamEquity.totalShares.toLocaleString()} total shares
              </p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-text-muted mb-2">Total Dividends Received</p>
              <p className="font-mono font-bold text-xl text-status-success">
                ${teamEquity.totalDividendsReceived.toLocaleString()}
              </p>
            </div>
          </div>

          {teamEquity.externalInvestors.length > 0 && (
            <div className="mt-4 p-4 bg-background rounded-lg">
              <p className="text-sm font-medium mb-3">External Investors</p>
              <div className="space-y-2">
                {teamEquity.externalInvestors.map(investor => (
                  <div 
                    key={investor.id}
                    className="flex items-center justify-between p-2 bg-surface rounded-lg"
                  >
                    <div>
                      <span className="font-medium text-sm">{investor.name}</span>
                      <p className="text-xs text-text-muted capitalize">{investor.type.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm">{investor.ownershipPercent.toFixed(1)}%</span>
                      <p className="text-xs text-text-muted">
                        ${investor.investmentAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => setShowInjectModal(true)}
            >
              Inject Capital
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowWithdrawModal(true)}
            >
              Withdraw Funds
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowInvestorsModal(true)}
            >
              Seek Investors
            </Button>
          </div>
        </Card>
      )}

      {/* Loans & Debt */}
      {(finances.personalLoans.length > 0 || finances.mortgages.length > 0) && (
        <Card variant="glass" padding="lg">
          <CardHeader 
            title="Loans & Debt" 
            icon={<Landmark className="w-5 h-5" />}
          />
          <div className="space-y-4">
            {finances.personalLoans.map(loan => (
              <div 
                key={loan.id}
                className="p-4 bg-background rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{loan.purpose}</p>
                  <p className="text-sm text-text-muted">
                    {loan.interestRate}% APR • {loan.monthsRemaining} months remaining
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-status-danger">
                    ${loan.remainingBalance.toLocaleString()}
                  </p>
                  <p className="text-xs text-text-muted">
                    ${loan.monthlyPayment.toLocaleString()}/mo
                  </p>
                </div>
              </div>
            ))}

            {finances.mortgages.map(mortgage => (
              <div 
                key={mortgage.id}
                className="p-4 bg-background rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">Mortgage - {mortgage.propertyName || mortgage.propertyId}</p>
                  <p className="text-sm text-text-muted">
                    {mortgage.interestRate}% APR • {Math.max(0, Math.round((mortgage.yearsRemaining || 0) * 12))} months remaining
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-status-danger">
                    ${mortgage.remainingBalance.toLocaleString()}
                  </p>
                  <p className="text-xs text-text-muted">
                    ${mortgage.monthlyPayment.toLocaleString()}/mo
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card variant="glass" padding="lg">
        <CardHeader 
          title="Recent Transactions" 
          subtitle={`${finances.transactions.length} total`}
          action={
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowTransactions(true)}
            >
              View All
            </Button>
          }
        />
        <div className="space-y-2">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx, index) => (
              <TransactionRow key={`${tx.id}_${index}`} transaction={tx} index={index} />
            ))
          ) : (
            <p className="text-center py-8 text-text-muted">
              No transactions yet
            </p>
          )}
        </div>
      </Card>

      {/* Inject Capital Modal */}
      <Modal
        isOpen={showInjectModal}
        onClose={() => setShowInjectModal(false)}
        title="Inject Capital"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Transfer personal funds to your racing team. This will reduce your liquid cash
            and increase your team's budget.
          </p>
          
          <div className="p-3 bg-surface rounded-lg">
            <p className="text-xs text-text-muted">Available Personal Cash</p>
            <p className="font-mono font-bold text-xl text-status-success">
              ${finances.liquidCash.toLocaleString()}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-3">Select Amount to Inject</label>
            <div className="grid grid-cols-3 gap-2">
              {[25000, 50000, 100000, 250000, 500000, 1000000].map(amount => (
                <Button
                  key={amount}
                  variant={capitalAmount === amount ? 'primary' : 'secondary'}
                  size="sm"
                  disabled={amount > finances.liquidCash}
                  onClick={() => setCapitalAmount(amount)}
                  className="font-mono"
                >
                  ${(amount / 1000)}k
                </Button>
              ))}
            </div>
          </div>
          
          <div className="p-3 bg-accent-blue/10 border border-accent-blue/30 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm">Selected Amount</span>
              <span className="font-mono font-bold text-lg">${capitalAmount.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowInjectModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary"
              disabled={capitalAmount <= 0 || capitalAmount > finances.liquidCash}
              onClick={() => {
                if (onInjectCapital) {
                  onInjectCapital(capitalAmount)
                } else {
                  addToast({
                    type: 'success',
                    title: 'Capital Injected',
                    message: `$${capitalAmount.toLocaleString()} transferred to team budget`
                  })
                }
                setShowInjectModal(false)
                setCapitalAmount(100000)
              }}
            >
              Inject ${capitalAmount.toLocaleString()}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Withdraw Funds Modal */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title="Withdraw Funds"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Withdraw funds from your racing team to your personal account.
            This will reduce the team's available budget.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-surface rounded-lg">
              <p className="text-xs text-text-muted">Team Balance</p>
              <p className="font-mono font-bold text-lg text-accent-blue">
                ${teamBalance.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-surface rounded-lg">
              <p className="text-xs text-text-muted">Max Withdrawal (50%)</p>
              <p className="font-mono font-bold text-lg text-status-success">
                ${maxWithdrawal.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-3">Select Amount to Withdraw</label>
            <div className="grid grid-cols-3 gap-2">
              {[25000, 50000, 100000, 250000, 500000, 1000000]
                .filter(amount => amount <= maxWithdrawal)
                .map(amount => (
                  <Button
                    key={amount}
                    variant={capitalAmount === amount ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setCapitalAmount(amount)}
                    className="font-mono"
                  >
                    ${(amount / 1000)}k
                  </Button>
                ))}
              {maxWithdrawal > 0 && (
                <Button
                  variant={capitalAmount === maxWithdrawal ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setCapitalAmount(maxWithdrawal)}
                  className="font-mono col-span-3"
                >
                  Max: ${maxWithdrawal.toLocaleString()}
                </Button>
              )}
            </div>
            {maxWithdrawal === 0 && (
              <p className="text-sm text-status-warning mt-2">
                No funds available for withdrawal
              </p>
            )}
          </div>
          
          <div className="p-3 bg-accent-blue/10 border border-accent-blue/30 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm">Selected Amount</span>
              <span className="font-mono font-bold text-lg">${capitalAmount.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowWithdrawModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary"
              disabled={capitalAmount <= 0 || capitalAmount > maxWithdrawal}
              onClick={() => {
                if (onWithdrawFunds) {
                  onWithdrawFunds(capitalAmount)
                } else {
                  addToast({
                    type: 'success',
                    title: 'Funds Withdrawn',
                    message: `$${capitalAmount.toLocaleString()} transferred to personal account`
                  })
                }
                setShowWithdrawModal(false)
                setCapitalAmount(100000)
              }}
            >
              Withdraw ${capitalAmount.toLocaleString()}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Seek Investors Modal */}
      <Modal
        isOpen={showInvestorsModal}
        onClose={() => setShowInvestorsModal(false)}
        title="Seek Investors"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Find external investors for your racing team. Investors will provide capital
            in exchange for equity stake in the team.
          </p>
          <div className="space-y-3">
            <div className="p-4 bg-surface border border-border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Current Ownership</span>
                <span className="font-mono">{teamEquity?.ownershipPercent || 100}%</span>
              </div>
              <p className="text-sm text-text-muted">
                Team Valuation: ${teamEquity?.currentValuation.toLocaleString() || 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-400">
                Warning: Accepting investors will dilute your ownership stake.
                You may lose control of key team decisions.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowInvestorsModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={() => {
                if (onSeekInvestors) {
                  onSeekInvestors()
                } else {
                  addToast({
                    type: 'info',
                    title: 'Investor Search Started',
                    message: 'Potential investors will contact you through email'
                  })
                }
                setShowInvestorsModal(false)
              }}
            >
              Start Investor Search
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface IncomeRowProps {
  label: string
  amount: number
  icon: React.ReactNode
}

function IncomeRow({ label, amount, icon }: IncomeRowProps) {
  if (amount === 0) return null
  
  return (
    <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-status-success/20 flex items-center justify-center text-status-success">
          {icon}
        </div>
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-mono font-bold text-status-success">
        +${amount.toLocaleString()}
      </span>
    </div>
  )
}

interface ExpenseRowProps {
  label: string
  amount: number
}

function ExpenseRow({ label, amount }: ExpenseRowProps) {
  if (amount === 0) return null
  
  return (
    <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
      <span className="text-sm">{label}</span>
      <span className="font-mono font-bold text-status-danger">
        -${amount.toLocaleString()}
      </span>
    </div>
  )
}

interface TransactionRowProps {
  transaction: PersonalTransaction
  index: number
}

function TransactionRow({ transaction, index }: TransactionRowProps) {
  const isIncome = transaction.type === 'income'
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
    >
      <div className="flex items-center gap-3">
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center
          ${isIncome ? 'bg-status-success/20 text-status-success' : 'bg-status-danger/20 text-status-danger'}
        `}>
          {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        </div>
        <div>
          <p className="text-sm font-medium">{transaction.description}</p>
          <p className="text-xs text-text-muted capitalize">
            {transaction.category.replace('_', ' ')}
          </p>
        </div>
      </div>
      <span className={`font-mono font-bold ${isIncome ? 'text-status-success' : 'text-status-danger'}`}>
        {isIncome ? '+' : '-'}${transaction.amount.toLocaleString()}
      </span>
    </motion.div>
  )
}
