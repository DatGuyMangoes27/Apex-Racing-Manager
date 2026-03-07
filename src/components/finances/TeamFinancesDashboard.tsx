import { useState, useMemo } from 'react'
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, ArrowUpDown, PieChart, BarChart3, AlertTriangle, CheckCircle, ChevronRight, Plus, Settings, Users, Building2, Wrench, Car, Star, Clock, Wallet, Receipt, Trophy, Award, Factory, Coins, CreditCard, FlaskConical, Truck, Megaphone, Gauge, ArrowUpRight, ArrowDownRight, Target } from 'lucide-react';
import { Card, CardHeader, Badge, Button, Progress, Tabs, TabsList, TabsTrigger, TabsContent, Modal, SponsorLogo, useToast } from '@/components/ui';
import { useCareerStore } from '@/store/careerStore';
import type { OwnedTeam, TeamSponsorDeal, TeamTransaction } from '@/store/careerStore';
import type { TeamTier } from '@/store/rivalStore';
import {
  getSponsorSatisfactionStatus,
  generateTeamSponsorOffers,
  acceptSponsorOffer,
  getSponsorSlotLabel
} from '@/simulation/finances/teamSponsors'
import { calculateCostCapStatus, calculateTeamRunway } from '@/simulation/finances/teamFinances'
import type { RunwayStatus, CostCapStatus } from '@/simulation/finances/teamFinances'
import { FACILITY_COSTS_BY_TIER, DEVELOPMENT_COSTS_BY_TIER, TRANSACTION_CATEGORY_LABELS, formatCurrency } from '@/data/financial-config'
import { getSponsorLogo } from '@/utils/generated-assets'
import { BudgetAllocationPanel } from './BudgetAllocationPanel'
import { FinancialCharts } from './FinancialCharts'
import { TransactionHistory } from './TransactionHistory'

// ============================================
// TYPES
// ============================================

interface TeamFinancesDashboardProps {
  team: OwnedTeam
  seriesEntries: Array<{ seriesId: string; seriesName: string; entryFee: number }>
  currentWeek: number
  currentYear: number
}

// ============================================
// MAIN COMPONENT
// ============================================

export function TeamFinancesDashboard({ 
  team, 
  seriesEntries,
  currentWeek, 
  currentYear 
}: TeamFinancesDashboardProps) {
  const { addToast } = useToast()
  const [selectedSponsor, setSelectedSponsor] = useState<TeamSponsorDeal | null>(null)
  const [showSponsorModal, setShowSponsorModal] = useState(false)
  
  const teamTier: TeamTier = team.tier || 'amateur'
  
  // Get all transactions
  const transactions = useMemo(() => 
    team.finances?.transactions || [],
    [team.finances?.transactions]
  )
  
  // Calculate financial metrics
  const costCapStatus = useMemo(() => 
    calculateCostCapStatus(team, teamTier, currentWeek),
    [team, teamTier, currentWeek]
  )
  
  const runwayStatus = useMemo(() => 
    calculateTeamRunway(team, teamTier, currentWeek),
    [team, teamTier, currentWeek]
  )
  
  // Transaction summaries
  const transactionSummary = useMemo(() => {
    const transactions = team.finances?.transactions || []
    const currentYearTx = transactions.filter(tx => tx.year === currentYear)
    
    const totalIncome = currentYearTx
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0)
    
    const totalExpenses = currentYearTx
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0)
    
    const incomeByCategory: Record<string, number> = {}
    const expensesByCategory: Record<string, number> = {}
    
    currentYearTx.forEach(tx => {
      if (tx.type === 'income') {
        incomeByCategory[tx.category] = (incomeByCategory[tx.category] || 0) + tx.amount
      } else {
        expensesByCategory[tx.category] = (expensesByCategory[tx.category] || 0) + tx.amount
      }
    })
    
    return { totalIncome, totalExpenses, incomeByCategory, expensesByCategory }
  }, [team.finances?.transactions, currentYear])
  
  // Recent transactions
  const recentTransactions = useMemo(() => {
    const transactions = team.finances?.transactions || []
    return [...transactions]
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.week - a.week
      })
      .slice(0, 15)
  }, [team.finances?.transactions])
  
  // Active sponsors
  const activeSponsors = team.finances?.sponsors?.filter(s => s.active) || []
  const pendingOffers = team.finances?.pendingSponsorOffers || []
  
  // Monthly sponsor income estimate
  const monthlySponsorIncome = activeSponsors.reduce((sum, s) => sum + s.monthlyPayment, 0)

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <FinanceStatCard
          icon={<Wallet className="w-5 h-5" />}
          label="Team Cash"
          value={team.budgets?.cash || 0}
          color={(team.budgets?.cash || 0) >= 0 ? 'success' : 'danger'}
        />
        <FinanceStatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="YTD Income"
          value={transactionSummary.totalIncome}
          color="success"
        />
        <FinanceStatCard
          icon={<TrendingDown className="w-5 h-5" />}
          label="YTD Expenses"
          value={transactionSummary.totalExpenses}
          color="danger"
        />
        <FinanceStatCard
          icon={<Building2 className="w-5 h-5" />}
          label="Sponsor Income"
          value={monthlySponsorIncome}
          suffix="/month"
          color={monthlySponsorIncome > 0 ? 'success' : 'warning'}
        />
      </div>

      {/* Financial Health Indicators */}
      <div className="grid grid-cols-2 gap-4">
        <RunwayCard status={runwayStatus} />
        {costCapStatus.hasCostCap && (
          <CostCapCard status={costCapStatus} />
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="sponsors">
            Sponsors
            {pendingOffers.length > 0 && (
              <Badge variant="red" size="sm" className="ml-2">
                {pendingOffers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-3 gap-6">
            {/* Transaction History */}
            <div className="col-span-2">
              <Card variant="glass" padding="lg">
                <CardHeader 
                  title="Recent Transactions" 
                  subtitle={`${team.finances?.transactions?.length || 0} total transactions`}
                />
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((tx, index) => (
                      <TransactionRow key={tx.id} transaction={tx} index={index} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-text-muted">
                      <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No transactions yet</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Quick Summary */}
            <div className="space-y-6">
              <Card variant="racing" padding="lg">
                <CardHeader title="Weekly Burn Rate" />
                <div className="space-y-4">
                  <BudgetItem 
                    label="Facility Operations" 
                    amount={-FACILITY_COSTS_BY_TIER[teamTier].weeklyOperationalCost} 
                    type="expense" 
                  />
                  <BudgetItem 
                    label="R&D / Development" 
                    amount={-DEVELOPMENT_COSTS_BY_TIER[teamTier].weeklyRDBurnRate} 
                    type="expense" 
                  />
                  <BudgetItem 
                    label="Sponsor Income" 
                    amount={Math.round(monthlySponsorIncome / 4)} 
                    type="income" 
                  />
                  <div className="border-t border-surface-border pt-4">
                    <BudgetItem 
                      label="Net Weekly" 
                      amount={runwayStatus.netWeeklyChange} 
                      type={runwayStatus.netWeeklyChange >= 0 ? 'income' : 'expense'}
                      bold
                    />
                  </div>
                </div>
              </Card>

              <Card variant="default" padding="lg">
                <CardHeader title="Active Sponsors" />
                {activeSponsors.length > 0 ? (
                  <div className="space-y-2">
                    {activeSponsors.slice(0, 3).map(sponsor => (
                      <div 
                        key={sponsor.id} 
                        className="flex items-center justify-between p-2 bg-background/50 rounded-lg cursor-pointer hover:bg-background/70"
                        onClick={() => {
                          setSelectedSponsor(sponsor)
                          setShowSponsorModal(true)
                        }}
                      >
                        <div>
                          <span className="font-medium text-sm">{sponsor.sponsorName}</span>
                          <p className="text-xs text-text-muted">{getSponsorSlotLabel(sponsor.slot)}</p>
                        </div>
                        <span className="font-mono text-status-success text-sm">
                          ${sponsor.monthlyPayment.toLocaleString()}/mo
                        </span>
                      </div>
                    ))}
                    {activeSponsors.length > 3 && (
                      <p className="text-sm text-text-muted text-center">
                        +{activeSponsors.length - 3} more
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted text-center py-4">
                    No active sponsors
                  </p>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="income">
          <Card variant="glass" padding="lg">
            <CardHeader 
              title="Income Sources" 
              subtitle={`Year ${currentYear} earnings`}
            />
            <div className="grid grid-cols-2 gap-4">
              <IncomeSourceCard
                title="Team Sponsors"
                amount={transactionSummary.incomeByCategory['team_sponsor'] || 0}
                icon={<Building2 className="w-5 h-5" />}
                description="Monthly payments from team sponsors"
              />
              <IncomeSourceCard
                title="Race Prizes"
                amount={transactionSummary.incomeByCategory['prize_race'] || 0}
                icon={<Trophy className="w-5 h-5" />}
                description="Prize money from race results"
              />
              <IncomeSourceCard
                title="Championship Prizes"
                amount={transactionSummary.incomeByCategory['prize_championship'] || 0}
                icon={<Award className="w-5 h-5" />}
                description="Season-end championship bonuses"
              />
              <IncomeSourceCard
                title="Manufacturer Support"
                amount={transactionSummary.incomeByCategory['manufacturer_support'] || 0}
                icon={<Factory className="w-5 h-5" />}
                description="Works team support payments"
              />
              <IncomeSourceCard
                title="Series Revenue"
                amount={transactionSummary.incomeByCategory['series_revenue'] || 0}
                icon={<Coins className="w-5 h-5" />}
                description="TV and participation revenue"
              />
            </div>
            
            <div className="mt-6 p-4 bg-status-success/10 border border-status-success/30 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Year-to-Date Income</span>
                <span className="font-mono font-bold text-2xl text-status-success">
                  ${transactionSummary.totalIncome.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card variant="glass" padding="lg">
            <CardHeader 
              title="Expenses" 
              subtitle={`Year ${currentYear} spending`}
            />
            <div className="grid grid-cols-2 gap-4">
              <ExpenseCard
                title="Entry Fees"
                amount={transactionSummary.expensesByCategory['entry_fee'] || 0}
                icon={<CreditCard className="w-5 h-5" />}
                description="Series entry costs"
                countsTowardCap={false}
              />
              <ExpenseCard
                title="Development & R&D"
                amount={transactionSummary.expensesByCategory['development'] || 0}
                icon={<FlaskConical className="w-5 h-5" />}
                description="Research and upgrades"
                countsTowardCap={true}
              />
              <ExpenseCard
                title="Travel & Logistics"
                amount={transactionSummary.expensesByCategory['travel'] || 0}
                icon={<Truck className="w-5 h-5" />}
                description="Race travel and freight"
                countsTowardCap={true}
              />
              <ExpenseCard
                title="Facility Operations"
                amount={transactionSummary.expensesByCategory['facilities'] || 0}
                icon={<Wrench className="w-5 h-5" />}
                description="Base operational costs"
                countsTowardCap={true}
              />
              <ExpenseCard
                title="Manufacturer Lease"
                amount={transactionSummary.expensesByCategory['manufacturer_lease'] || 0}
                icon={<Factory className="w-5 h-5" />}
                description="Customer team payments"
                countsTowardCap={true}
              />
              <ExpenseCard
                title="Staff Salaries"
                amount={transactionSummary.expensesByCategory['salaries'] || 0}
                icon={<DollarSign className="w-5 h-5" />}
                description="Race & facility staff wages"
                countsTowardCap={true}
              />
              <ExpenseCard
                title="Marketing & PR"
                amount={(transactionSummary.expensesByCategory['marketing'] || 0) + 
                        (transactionSummary.expensesByCategory['sponsor_event'] || 0) +
                        (transactionSummary.expensesByCategory['sponsor_bonus'] || 0)}
                icon={<Megaphone className="w-5 h-5" />}
                description="Events, promotions, sponsor activities"
                countsTowardCap={false}
              />
              <ExpenseCard
                title="Car Maintenance"
                amount={(transactionSummary.expensesByCategory['car_maintenance'] || 0) +
                        (transactionSummary.expensesByCategory['repairs'] || 0)}
                icon={<Wrench className="w-5 h-5" />}
                description="Parts, repairs, upkeep"
                countsTowardCap={true}
              />
              <ExpenseCard
                title="Other"
                amount={transactionSummary.expensesByCategory['other'] || 0}
                icon={<Receipt className="w-5 h-5" />}
                description="Miscellaneous expenses"
                countsTowardCap={true}
              />
            </div>
            
            <div className="mt-6 p-4 bg-status-danger/10 border border-status-danger/30 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Year-to-Date Expenses</span>
                <span className="font-mono font-bold text-2xl text-status-danger">
                  -${transactionSummary.totalExpenses.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="sponsors">
          <div className="space-y-6">
            {/* Pending Offers */}
            {pendingOffers.length > 0 && (
              <Card variant="racing" padding="lg">
                <CardHeader 
                  title="Sponsor Offers" 
                  subtitle={`${pendingOffers.length} offer${pendingOffers.length > 1 ? 's' : ''} waiting`}
                />
                <div className="grid grid-cols-2 gap-4">
                  {pendingOffers.map((offer, index) => (
                    <TeamSponsorOfferCard
                      key={offer.id}
                      offer={offer}
                      index={index}
                      onView={() => {
                        setSelectedSponsor(offer)
                        setShowSponsorModal(true)
                      }}
                    />
                  ))}
                </div>
              </Card>
            )}
            
            {/* Active Sponsors */}
            <Card variant="glass" padding="lg">
              <CardHeader 
                title="Active Sponsors" 
                subtitle={`${activeSponsors.length} sponsor${activeSponsors.length !== 1 ? 's' : ''}`}
              />
              {activeSponsors.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {activeSponsors.map((sponsor, index) => (
                    <ActiveTeamSponsorCard
                      key={sponsor.id}
                      sponsor={sponsor}
                      index={index}
                      currentYear={currentYear}
                      onClick={() => {
                        setSelectedSponsor(sponsor)
                        setShowSponsorModal(true)
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-text-muted">
                  <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No active sponsors</p>
                  <p className="text-sm mt-1">Sponsors will approach you as your reputation grows</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budget">
          <div className="grid grid-cols-2 gap-6">
            {/* Budget Allocation Panel - Interactive */}
            <div className="col-span-2">
              <BudgetAllocationPanel 
                team={team} 
                currentWeek={currentWeek} 
                currentYear={currentYear}
              />
            </div>
            
            {/* Spending vs Allocated */}
            <Card variant="glass" padding="lg">
              <CardHeader title="Spending vs Allocated" subtitle="This season's usage" />
              <div className="space-y-4">
                <BudgetAllocationBar
                  label="Development"
                  allocated={team.budgets?.developmentBudget || 0}
                  spent={transactionSummary.expensesByCategory['development'] || 0}
                  color="blue"
                />
                <BudgetAllocationBar
                  label="Travel"
                  allocated={team.budgets?.travelBudget || 0}
                  spent={transactionSummary.expensesByCategory['travel'] || 0}
                  color="orange"
                />
                <BudgetAllocationBar
                  label="Marketing"
                  allocated={team.budgets?.marketingBudget || 0}
                  spent={(transactionSummary.expensesByCategory['marketing'] || 0) + 
                         (transactionSummary.expensesByCategory['sponsor_event'] || 0) +
                         (transactionSummary.expensesByCategory['sponsor_bonus'] || 0)}
                  color="purple"
                />
                <BudgetAllocationBar
                  label="Contingency"
                  allocated={team.budgets?.contingencyBudget || 0}
                  spent={(transactionSummary.expensesByCategory['car_maintenance'] || 0) +
                         (transactionSummary.expensesByCategory['repairs'] || 0)}
                  color="green"
                />
              </div>
            </Card>

            {costCapStatus.hasCostCap ? (
              <Card variant="glass" padding="lg">
                <CardHeader title="Cost Cap Tracking" />
                <CostCapDetailView status={costCapStatus} />
              </Card>
            ) : (
              <Card variant="glass" padding="lg">
                <CardHeader title="Financial Summary" />
                <div className="space-y-4">
                  <div className="p-4 bg-background rounded-lg">
                    <p className="text-sm text-text-muted">Total Cash</p>
                    <p className="font-mono font-bold text-2xl text-status-success">
                      ${(team.budgets?.cash || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-background rounded-lg">
                    <p className="text-sm text-text-muted">Net Weekly Change</p>
                    <p className={`font-mono font-bold text-xl ${
                      runwayStatus.netWeeklyChange >= 0 ? 'text-status-success' : 'text-status-danger'
                    }`}>
                      {runwayStatus.netWeeklyChange >= 0 ? '+' : ''}${runwayStatus.netWeeklyChange.toLocaleString()}/week
                    </p>
                  </div>
                  <div className="p-4 bg-background rounded-lg">
                    <p className="text-sm text-text-muted">Financial Runway</p>
                    <p className="font-mono font-bold text-xl">
                      {runwayStatus.runwayWeeks === Infinity ? 'Sustainable' : `${runwayStatus.runwayWeeks} weeks`}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <Card variant="glass" padding="lg" className="col-span-2">
              <CardHeader title="Series Entries" />
              <div className="space-y-3">
                {seriesEntries.map(entry => (
                  <div 
                    key={entry.seriesId}
                    className="flex items-center justify-between p-4 bg-background/50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">{entry.seriesName}</h4>
                      <p className="text-sm text-text-muted">Entry Fee Paid</p>
                    </div>
                    <span className="font-mono text-status-danger">
                      -${entry.entryFee.toLocaleString()}
                    </span>
                  </div>
                ))}
                {seriesEntries.length === 0 && (
                  <p className="text-center py-4 text-text-muted">
                    No series entries yet
                  </p>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-6">
            {/* Financial Charts */}
            <FinancialCharts 
              transactions={transactions}
              currentWeek={currentWeek}
              currentYear={currentYear}
            />
            
            {/* Full Transaction History */}
            <TransactionHistory 
              transactions={transactions}
              currentWeek={currentWeek}
              currentYear={currentYear}
            />
          </div>
        </TabsContent>

      </Tabs>

      {/* Sponsor Detail Modal */}
      <Modal
        isOpen={showSponsorModal}
        onClose={() => {
          setShowSponsorModal(false)
          setSelectedSponsor(null)
        }}
        title="Sponsor Details"
        size="md"
      >
        {selectedSponsor && (
          <TeamSponsorDetailView
            sponsor={selectedSponsor}
            currentYear={currentYear}
            onClose={() => {
              setShowSponsorModal(false)
              setSelectedSponsor(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface FinanceStatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  suffix?: string
  color: 'success' | 'danger' | 'info' | 'warning'
}

function FinanceStatCard({ icon, label, value, suffix, color }: FinanceStatCardProps) {
  const colorClasses = {
    success: 'text-status-success',
    danger: 'text-status-danger',
    info: 'text-status-info',
    warning: 'text-status-warning'
  }
  const bgClasses = {
    success: 'bg-status-success/20',
    danger: 'bg-status-danger/20',
    info: 'bg-status-info/20',
    warning: 'bg-status-warning/20'
  }

  return (
    <Card variant="glass" padding="md">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${bgClasses[color]} flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-text-muted text-sm">{label}</p>
      <p className={`font-mono font-bold text-2xl ${colorClasses[color]}`}>
        ${Math.abs(value).toLocaleString()}
        {suffix && <span className="text-sm text-text-muted font-normal">{suffix}</span>}
      </p>
    </Card>
  )
}

function RunwayCard({ status }: { status: RunwayStatus }) {
  const statusColors = {
    healthy: 'text-status-success border-status-success/30 bg-status-success/10',
    stable: 'text-status-info border-status-info/30 bg-status-info/10',
    caution: 'text-status-warning border-status-warning/30 bg-status-warning/10',
    critical: 'text-accent-orange border-accent-orange/30 bg-accent-orange/10',
    emergency: 'text-status-danger border-status-danger/30 bg-status-danger/10'
  }

  return (
    <Card variant="glass" padding="lg" className={`border ${statusColors[status.status]}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Gauge className="w-6 h-6" />
          <div>
            <h3 className="font-medium">Financial Runway</h3>
            <p className="text-sm text-text-muted">
              {status.runwayWeeks === Infinity 
                ? 'Sustainable' 
                : `${status.runwayWeeks} weeks of funding`
              }
            </p>
          </div>
        </div>
        <Badge 
          variant={
            status.status === 'healthy' ? 'green' :
            status.status === 'stable' ? 'blue' :
            status.status === 'caution' ? 'yellow' :
            status.status === 'critical' ? 'orange' : 'red'
          }
        >
          {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
        </Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-text-muted">Weekly Burn</p>
          <p className="font-mono font-bold text-status-danger">
            -${status.weeklyBurnRate.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Weekly Income</p>
          <p className="font-mono font-bold text-status-success">
            +${status.weeklyIncomeEstimate.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Net Change</p>
          <p className={`font-mono font-bold ${
            status.netWeeklyChange >= 0 ? 'text-status-success' : 'text-status-danger'
          }`}>
            {status.netWeeklyChange >= 0 ? '+' : '-'}${Math.abs(status.netWeeklyChange).toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  )
}

function CostCapCard({ status }: { status: CostCapStatus }) {
  const statusColors = {
    healthy: 'text-status-success border-status-success/30',
    warning: 'text-status-warning border-status-warning/30',
    critical: 'text-accent-orange border-accent-orange/30',
    exceeded: 'text-status-danger border-status-danger/30'
  }

  return (
    <Card variant="glass" padding="lg" className={`border ${statusColors[status.status]}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6" />
          <div>
            <h3 className="font-medium">Cost Cap</h3>
            <p className="text-sm text-text-muted">
              {formatCurrency(status.remainingBudget)} remaining
            </p>
          </div>
        </div>
        <Badge 
          variant={
            status.status === 'healthy' ? 'green' :
            status.status === 'warning' ? 'yellow' :
            status.status === 'critical' ? 'orange' : 'red'
          }
        >
          {status.percentUsed.toFixed(1)}% Used
        </Badge>
      </div>
      
      <div className="h-3 bg-background rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${
            status.status === 'healthy' ? 'bg-status-success' :
            status.status === 'warning' ? 'bg-status-warning' :
            status.status === 'critical' ? 'bg-accent-orange' : 'bg-status-danger'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, status.percentUsed)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-text-muted">
        <span>${status.currentSpending.toLocaleString()} spent</span>
        <span>${status.capAmount.toLocaleString()} cap</span>
      </div>
    </Card>
  )
}

function TransactionRow({ transaction, index }: { transaction: TeamTransaction; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center justify-between p-4 bg-background/50 rounded-lg"
    >
      <div className="flex items-center gap-4">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${transaction.type === 'income' 
            ? 'bg-status-success/20 text-status-success' 
            : 'bg-status-danger/20 text-status-danger'
          }
        `}>
          {transaction.type === 'income' 
            ? <ArrowUpRight className="w-5 h-5" />
            : <ArrowDownRight className="w-5 h-5" />
          }
        </div>
        <div>
          <p className="font-medium">{transaction.description}</p>
          <p className="text-sm text-text-muted">
            {TRANSACTION_CATEGORY_LABELS[transaction.category] || transaction.category} • Week {transaction.week}
          </p>
        </div>
      </div>
      <span className={`
        font-mono font-bold text-lg
        ${transaction.type === 'income' ? 'text-status-success' : 'text-status-danger'}
      `}>
        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
      </span>
    </motion.div>
  )
}

interface BudgetItemProps {
  label: string
  amount: number
  type: 'income' | 'expense'
  bold?: boolean
}

function BudgetItem({ label, amount, type, bold }: BudgetItemProps) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-text-secondary ${bold ? 'font-medium' : ''}`}>{label}</span>
      <span className={`
        font-mono ${bold ? 'font-bold text-lg' : 'font-medium'}
        ${type === 'income' ? 'text-status-success' : 'text-status-danger'}
      `}>
        {type === 'income' ? '+' : '-'}${Math.abs(amount).toLocaleString()}
      </span>
    </div>
  )
}

interface IncomeSourceCardProps {
  title: string
  amount: number
  icon: React.ReactNode
  description: string
}

function IncomeSourceCard({ title, amount, icon, description }: IncomeSourceCardProps) {
  return (
    <div className="p-4 bg-background/50 rounded-xl border border-surface-border">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-status-success">{icon}</span>
          <h4 className="font-medium">{title}</h4>
        </div>
      </div>
      <p className="font-mono font-bold text-2xl text-status-success mb-2">
        ${amount.toLocaleString()}
      </p>
      <p className="text-sm text-text-muted">{description}</p>
    </div>
  )
}

interface ExpenseCardProps {
  title: string
  amount: number
  icon: React.ReactNode
  description: string
  countsTowardCap: boolean
}

function ExpenseCard({ title, amount, icon, description, countsTowardCap }: ExpenseCardProps) {
  return (
    <div className="p-4 bg-background/50 rounded-xl border border-surface-border">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-status-danger">{icon}</span>
          <h4 className="font-medium">{title}</h4>
        </div>
        {countsTowardCap && (
          <Badge variant="outline" size="sm" className="text-xs">
            Cost Cap
          </Badge>
        )}
      </div>
      <p className="font-mono font-bold text-2xl text-status-danger mb-2">
        -${amount.toLocaleString()}
      </p>
      <p className="text-sm text-text-muted">{description}</p>
    </div>
  )
}

interface TeamSponsorOfferCardProps {
  offer: TeamSponsorDeal
  index: number
  onView: () => void
}

function TeamSponsorOfferCard({ offer, index, onView }: TeamSponsorOfferCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card variant="default" padding="md" hoverable className="cursor-pointer" onClick={onView}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-gold/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-accent-gold" />
            </div>
            <div>
              <h4 className="font-medium">{offer.sponsorName}</h4>
              <p className="text-sm text-text-muted">{getSponsorSlotLabel(offer.slot)}</p>
            </div>
          </div>
          <Badge variant="orange" size="sm">New</Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-text-muted">Monthly</p>
            <p className="font-mono font-bold text-status-success">${offer.monthlyPayment.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Win</p>
            <p className="font-mono font-bold text-accent-gold">+${offer.winBonus.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Podium</p>
            <p className="font-mono font-bold text-accent-blue">+${offer.podiumBonus.toLocaleString()}</p>
          </div>
        </div>
        
        <Button variant="secondary" className="w-full mt-3" size="sm">
          View Details
        </Button>
      </Card>
    </motion.div>
  )
}

interface ActiveTeamSponsorCardProps {
  sponsor: TeamSponsorDeal
  index: number
  currentYear: number
  onClick: () => void
}

function ActiveTeamSponsorCard({ sponsor, index, currentYear, onClick }: ActiveTeamSponsorCardProps) {
  const yearsRemaining = (sponsor.startYear + sponsor.duration) - currentYear
  const satisfactionStatus = getSponsorSatisfactionStatus(sponsor.satisfaction)
  const isWarning = sponsor.satisfaction < 60
  const isCritical = sponsor.satisfaction < 40

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card 
        variant="glass" 
        padding="md" 
        hoverable 
        className={`cursor-pointer ${
          isCritical ? 'border-red-500/50' : isWarning ? 'border-amber-500/30' : ''
        }`}
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <SponsorLogo
              src={getSponsorLogo(sponsor.id || sponsor.sponsorName)}
              name={sponsor.sponsorName}
              height="md"
            />
            <div>
              <h4 className="font-medium">{sponsor.sponsorName}</h4>
              <p className="text-xs text-text-muted">{getSponsorSlotLabel(sponsor.slot)}</p>
            </div>
          </div>
          <Badge variant={isCritical ? 'red' : isWarning ? 'yellow' : 'green'} size="sm">
            {isCritical ? 'At Risk' : isWarning ? 'Warning' : 'Active'}
          </Badge>
        </div>

        {/* Satisfaction Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text-muted">Satisfaction</span>
            <span className={satisfactionStatus.color}>{sponsor.satisfaction}%</span>
          </div>
          <div className="h-1.5 bg-background rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                sponsor.satisfaction >= 60 ? 'bg-status-success' :
                sponsor.satisfaction >= 40 ? 'bg-status-warning' : 'bg-status-danger'
              }`}
              style={{ width: `${sponsor.satisfaction}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-text-muted">
            <Clock className="w-3 h-3 inline mr-1" />
            {yearsRemaining} yr{yearsRemaining !== 1 ? 's' : ''} left
          </span>
          <span className="font-mono text-status-success">
            ${sponsor.monthlyPayment.toLocaleString()}/mo
          </span>
        </div>
      </Card>
    </motion.div>
  )
}

interface TeamSponsorDetailViewProps {
  sponsor: TeamSponsorDeal
  currentYear: number
  onClose: () => void
}

function TeamSponsorDetailView({ sponsor, currentYear, onClose }: TeamSponsorDetailViewProps) {
  const yearsRemaining = (sponsor.startYear + sponsor.duration) - currentYear
  const satisfactionStatus = getSponsorSatisfactionStatus(sponsor.satisfaction)
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-surface rounded-xl">
        <div className="w-14 h-14 rounded-xl bg-accent-gold/20 flex items-center justify-center">
          <Building2 className="w-7 h-7 text-accent-gold" />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-bold text-xl">{sponsor.sponsorName}</h3>
          <p className="text-text-muted">{getSponsorSlotLabel(sponsor.slot)} Sponsor</p>
        </div>
        <Badge 
          variant={sponsor.active ? 'green' : 'orange'} 
          size="sm"
        >
          {sponsor.active ? 'Active' : 'Pending'}
        </Badge>
      </div>

      {/* Satisfaction */}
      <div className="p-4 bg-surface rounded-xl">
        <div className="flex justify-between mb-2">
          <span className="font-medium">Sponsor Satisfaction</span>
          <span className={satisfactionStatus.color}>{satisfactionStatus.label}</span>
        </div>
        <div className="h-3 bg-background rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${
              sponsor.satisfaction >= 60 ? 'bg-status-success' :
              sponsor.satisfaction >= 40 ? 'bg-status-warning' : 'bg-status-danger'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${sponsor.satisfaction}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-xs text-text-muted mt-2">
          {sponsor.warningIssued && !sponsor.finalWarningIssued && '⚠️ Warning issued - improve performance'}
          {sponsor.finalWarningIssued && '❌ Final warning - contract at risk'}
        </p>
      </div>

      {/* Deal Terms */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-background rounded-lg">
          <span className="text-text-muted text-sm">Monthly Payment</span>
          <p className="font-mono font-bold text-xl text-status-success">
            ${sponsor.monthlyPayment.toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-background rounded-lg">
          <span className="text-text-muted text-sm">Contract Length</span>
          <p className="font-mono font-bold text-xl">
            {yearsRemaining} yr{yearsRemaining !== 1 ? 's' : ''} left
          </p>
        </div>
        <div className="p-3 bg-background rounded-lg">
          <span className="text-text-muted text-sm">Win Bonus</span>
          <p className="font-mono font-bold text-xl text-accent-gold">
            +${sponsor.winBonus.toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-background rounded-lg">
          <span className="text-text-muted text-sm">Podium Bonus</span>
          <p className="font-mono font-bold text-xl text-accent-blue">
            +${sponsor.podiumBonus.toLocaleString()}
          </p>
        </div>
        {sponsor.championshipBonus > 0 && (
          <div className="p-3 bg-background rounded-lg col-span-2">
            <span className="text-text-muted text-sm">Championship Bonus</span>
            <p className="font-mono font-bold text-xl text-purple-400">
              +${sponsor.championshipBonus.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Season Stats */}
      <div className="p-4 bg-surface rounded-xl">
        <h4 className="font-medium mb-3">Season Performance</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-text-muted">Races</p>
            <p className="font-mono font-bold text-xl">{sponsor.seasonRaces}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Wins</p>
            <p className="font-mono font-bold text-xl text-accent-gold">{sponsor.seasonWins}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Podiums</p>
            <p className="font-mono font-bold text-xl text-accent-blue">{sponsor.seasonPodiums}</p>
          </div>
        </div>
      </div>

      {/* Targets */}
      {sponsor.targets.length > 0 && (
        <div className="p-4 bg-surface rounded-xl">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Contract Targets
          </h4>
          <div className="space-y-2">
            {sponsor.targets.map(target => (
              <div 
                key={target.id}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  target.exceeded ? 'bg-status-success/20' :
                  target.met ? 'bg-status-info/20' : 'bg-background'
                }`}
              >
                <span className="text-sm">{target.description}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">
                    {target.currentValue}/{target.targetValue}
                  </span>
                  {target.exceeded ? (
                    <Badge variant="green" size="sm">Exceeded!</Badge>
                  ) : target.met ? (
                    <Badge variant="blue" size="sm">Complete</Badge>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contract Value */}
      <div className="p-4 bg-status-success/10 border border-status-success/30 rounded-xl">
        <div className="flex items-center justify-between">
          <span className="font-medium">Estimated Annual Value</span>
          <span className="font-mono font-bold text-2xl text-status-success">
            ${(sponsor.monthlyPayment * 12).toLocaleString()}
          </span>
        </div>
      </div>

      <Button variant="ghost" className="w-full" onClick={onClose}>
        Close
      </Button>
    </div>
  )
}

function BudgetAllocationBar({ 
  label, 
  allocated, 
  spent, 
  color 
}: { 
  label: string
  allocated: number
  spent: number
  color: 'blue' | 'orange' | 'purple' | 'green'
}) {
  const percentage = allocated > 0 ? (spent / allocated) * 100 : 0
  const colorClasses = {
    blue: 'bg-status-info',
    orange: 'bg-accent-orange',
    purple: 'bg-purple-500',
    green: 'bg-status-success'
  }

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm">{label}</span>
        <span className="text-sm text-text-muted">
          ${spent.toLocaleString()} / ${allocated.toLocaleString()}
        </span>
      </div>
      <div className="h-2 bg-background rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClasses[color]}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  )
}

function CostCapDetailView({ status }: { status: CostCapStatus }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="p-3 bg-background rounded-lg">
          <p className="text-xs text-text-muted">Cap Amount</p>
          <p className="font-mono font-bold text-xl">${status.capAmount.toLocaleString()}</p>
        </div>
        <div className="p-3 bg-background rounded-lg">
          <p className="text-xs text-text-muted">Spent</p>
          <p className="font-mono font-bold text-xl text-status-danger">
            ${status.currentSpending.toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-background rounded-lg">
          <p className="text-xs text-text-muted">Remaining</p>
          <p className={`font-mono font-bold text-xl ${
            status.remainingBudget > 0 ? 'text-status-success' : 'text-status-danger'
          }`}>
            ${status.remainingBudget.toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-background rounded-lg">
          <p className="text-xs text-text-muted">Est. Weeks Left</p>
          <p className="font-mono font-bold text-xl">
            {status.weeksRemaining === Infinity ? '∞' : status.weeksRemaining}
          </p>
        </div>
      </div>

      {status.status === 'exceeded' && (
        <div className="p-3 bg-status-danger/20 border border-status-danger/30 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-status-danger" />
            <span className="text-status-danger font-medium">Cost Cap Exceeded!</span>
          </div>
          <p className="text-sm text-text-muted mt-1">
            You have exceeded the cost cap. This may result in penalties.
          </p>
        </div>
      )}
    </div>
  )
}

export default TeamFinancesDashboard