import { useMemo } from 'react'
import { 
  Wallet, Heart, Users, TrendingUp, 
  Activity, Star, Shield, Building2, Crown,
  Baby, HeartHandshake
} from 'lucide-react'
import { 
  Card, 
  CardHeader, 
  Badge, 
  Button
} from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import type { PersonalFinancialState, TeamEquityStake } from '@/data/personal-finance-config'
import type { Partner, Child, FamilyTree } from '@/data/family-config'
import type { OwnerHealth, PersonalBrand, SocialContact, Hobby, PersonalStaff, LifestyleLevel } from '@/data/lifestyle-config'
import type { Rivalry, Scandal, CharityFoundation, SocialEvent } from '@/data/social-events-config'
import type { LifestyleAssets, LifestyleScoreBreakdown } from '@/data/lifestyle-assets-config'
import type { CollectionsState } from '@/types/personalLife'
import { usePersonalLifeActions } from '@/hooks/usePersonalLifeActions'

// ============================================
// TYPES
// ============================================

export type SocialLogType = 
  | 'event_attended' | 'contact_met' | 'scandal_update' | 'rivalry_update'
  | 'endorsement' | 'philanthropy' | 'invitation' | 'public_image'
  | 'social_media' | 'privacy'

export interface SocialLogEntry {
  id: string
  week: number
  year: number
  type: SocialLogType
  title: string
  description: string
  impact?: 'positive' | 'negative' | 'neutral'
}

export interface PersonalLifeState {
  finances: PersonalFinancialState
  teamEquity?: TeamEquityStake
  
  // Family
  partner?: Partner
  children: Child[]
  familyTree?: FamilyTree
  pregnancy?: {
    isPregnant: boolean
    dueWeek?: number
    dueYear?: number
    trimester?: number
  }
  family?: {
    partner?: Partner
    children: Child[]
    familyTree?: FamilyTree
  }
  
  // Lifestyle
  health: OwnerHealth
  lifestyleLevel: LifestyleLevel           // Now calculated from assets
  lifestyleAssets?: LifestyleAssets        // Owned vehicles, furnishings, memberships
  lifestyleScore?: LifestyleScoreBreakdown // Calculated score breakdown
  hobbies: Hobby[]
  staff: PersonalStaff[]
  collections?: CollectionsState           // Collection items
  assets?: LifestyleAssets                 // Owned assets (alias for lifestyleAssets for compatibility)
  
  // Social
  brand: PersonalBrand
  contacts: SocialContact[]
  rivalries: Rivalry[]
  scandals: Scandal[]
  foundations: CharityFoundation[]
  upcomingEvents: SocialEvent[]
  socialLog?: SocialLogEntry[]
}

interface PersonalLifeDashboardProps {
  state: PersonalLifeState
  currentWeek: number
  currentYear: number
  teamName: string
  onUpdateState?: (updates: Partial<PersonalLifeState>) => void
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PersonalLifeDashboard({
  state,
  currentWeek,
  currentYear,
  teamName,
  _onUpdateState
}: PersonalLifeDashboardProps) {
  const { addToast } = useToast()
  
  // Personal life actions
  const {
    planDate,
    spendTimeWithChild
  } = usePersonalLifeActions()

  // Calculate key metrics
  const netWorth = useMemo(() => {
    const liquid = state.finances.liquidCash
    const equity = state.teamEquity 
      ? state.teamEquity.currentValuation * (state.teamEquity.ownershipPercent / 100)
      : 0
    // Add real estate, investments value (would come from portfolio)
    return liquid + equity
  }, [state.finances, state.teamEquity])

  const monthlyIncome = useMemo(() => {
    const income = state.finances.monthlyIncome
    return (income.salary || 0) + (income.dividends || 0) + 
           (income.endorsements || 0) + (income.rentalIncome || 0) +
           (income.investmentReturns || 0)
  }, [state.finances.monthlyIncome])

  const monthlyExpenses = useMemo(() => {
    const expenses = state.finances.monthlyExpenses
    return (expenses.lifestyle || 0) + (expenses.staffSalaries || 0) +
           (expenses.propertyMaintenance || 0) + (expenses.insurances || 0) +
           (expenses.childSupport || 0) + (expenses.alimony || 0) +
           (expenses.loanPayments || 0) + (expenses.other || 0)
  }, [state.finances.monthlyExpenses])

  const familyHappiness = useMemo(() => {
    let total = 0
    let count = 0
    
    if (state.partner) {
      total += state.partner.happiness
      count++
    }
    
    state.children.forEach(child => {
      total += child.happiness
      count++
    })
    
    return count > 0 ? Math.round(total / count) : 100
  }, [state.partner, state.children])

  const activeScandals = state.scandals.filter(s => s.status !== 'resolved').length

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          icon={<Wallet className="w-5 h-5" />}
          label="Net Worth"
          value={`$${formatLargeNumber(netWorth)}`}
          color="gold"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Monthly Cash Flow"
          value={`${monthlyIncome - monthlyExpenses >= 0 ? '+' : ''}$${formatLargeNumber(monthlyIncome - monthlyExpenses)}`}
          color={monthlyIncome - monthlyExpenses >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          icon={<Heart className="w-5 h-5" />}
          label="Family Happiness"
          value={`${familyHappiness}%`}
          color={familyHappiness >= 70 ? 'success' : familyHappiness >= 40 ? 'warning' : 'danger'}
        />
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label="Health"
          value={`${state.health.physicalHealth}%`}
          color={state.health.physicalHealth >= 70 ? 'success' : state.health.physicalHealth >= 40 ? 'warning' : 'danger'}
        />
        <StatCard
          icon={<Star className="w-5 h-5" />}
          label="Public Image"
          value={`${state.brand.publicImage}`}
          color={state.brand.publicImage >= 70 ? 'success' : state.brand.publicImage >= 40 ? 'info' : 'warning'}
          alert={activeScandals > 0 ? `${activeScandals} scandal${activeScandals > 1 ? 's' : ''}` : undefined}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        {state.partner && state.partner.relationshipStatus === 'dating' && (
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => {
              const result = planDate('casual_dinner')
              addToast({
                type: result.success ? 'success' : 'error',
                title: result.success ? 'Date Planned' : 'Failed',
                message: result.success 
                  ? `Had a nice evening with ${state.partner?.firstName}! Happiness +${result.happinessGain || 0}`
                  : result.message
              })
            }}
          >
            <HeartHandshake className="w-4 h-4 mr-2" />
            Plan Date
          </Button>
        )}
        {state.children.length > 0 && (
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => {
              // Spend time with first child
              const firstChild = state.children[0]
              const result = spendTimeWithChild(firstChild.id)
              addToast({
                type: result.success ? 'success' : 'error',
                title: result.success ? 'Family Time' : 'Failed',
                message: result.success 
                  ? `${result.message} Bond +${result.bondGain || 0}`
                  : result.message
              })
            }}
          >
            <Baby className="w-4 h-4 mr-2" />
            Family Time
          </Button>
        )}
      </div>

      {/* Overview Content */}
      <OverviewTab 
        state={state}
        netWorth={netWorth}
        monthlyIncome={monthlyIncome}
        monthlyExpenses={monthlyExpenses}
        teamName={teamName}
        currentWeek={currentWeek}
        currentYear={currentYear}
      />
    </div>
  )
}

// ============================================
// OVERVIEW TAB
// ============================================

interface OverviewTabProps {
  state: PersonalLifeState
  netWorth: number
  monthlyIncome: number
  monthlyExpenses: number
  teamName: string
  currentWeek: number
  currentYear: number
}

function OverviewTab({
  state,
  netWorth,
  monthlyIncome,
  monthlyExpenses,
  teamName,
  _currentWeek,
  currentYear
}: OverviewTabProps) {
  const dynastyYears = state.familyTree 
    ? currentYear - state.familyTree.dynastyStartDate.year 
    : 0

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Financial Summary */}
      <Card variant="racing" padding="lg">
        <CardHeader 
          title="Financial Summary" 
          icon={<Wallet className="w-5 h-5" />}
        />
        <div className="space-y-4">
          <div className="p-4 bg-background rounded-lg">
            <p className="text-sm text-text-muted">Net Worth</p>
            <p className="font-mono font-bold text-3xl text-accent-gold">
              ${netWorth.toLocaleString()}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-background rounded-lg">
              <p className="text-xs text-text-muted">Liquid Cash</p>
              <p className="font-mono font-bold text-lg text-status-success">
                ${state.finances.liquidCash.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="text-xs text-text-muted">Team Equity</p>
              <p className="font-mono font-bold text-lg text-accent-blue">
                {state.teamEquity?.ownershipPercent.toFixed(1) || 100}%
              </p>
            </div>
          </div>

          <div className="border-t border-surface-border pt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-muted">Monthly Income</span>
              <span className="font-mono text-status-success">+${monthlyIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-muted">Monthly Expenses</span>
              <span className="font-mono text-status-danger">-${monthlyExpenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>Net Monthly</span>
              <span className={`font-mono ${monthlyIncome - monthlyExpenses >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
                {monthlyIncome - monthlyExpenses >= 0 ? '+' : ''}${(monthlyIncome - monthlyExpenses).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Family Status */}
      <Card variant="glass" padding="lg">
        <CardHeader 
          title="Family" 
          icon={<Heart className="w-5 h-5" />}
        />
        <div className="space-y-4">
          {state.partner ? (
            <div className="p-4 bg-background rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">{state.partner.firstName} {state.partner.lastName}</p>
                  <p className="text-sm text-text-muted capitalize">
                    {state.partner.relationshipStatus}
                  </p>
                </div>
                <Badge 
                  variant={
                    state.partner.happiness >= 70 ? 'green' :
                    state.partner.happiness >= 40 ? 'yellow' : 'red'
                  }
                >
                  {state.partner.happiness}% Happy
                </Badge>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    state.partner.happiness >= 70 ? 'bg-status-success' :
                    state.partner.happiness >= 40 ? 'bg-status-warning' : 'bg-status-danger'
                  }`}
                  style={{ width: `${state.partner.happiness}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="p-4 bg-background rounded-lg text-center">
              <Heart className="w-8 h-8 mx-auto mb-2 text-text-muted" />
              <p className="text-text-muted">Single</p>
              <p className="text-xs text-text-muted mt-1">Use the Phone to meet people</p>
            </div>
          )}

          {state.children.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-text-muted flex items-center gap-2">
                <Baby className="w-4 h-4" />
                {state.children.length} Child{state.children.length > 1 ? 'ren' : ''}
              </p>
              {state.children.slice(0, 3).map(child => (
                <div 
                  key={child.id}
                  className="flex items-center justify-between p-2 bg-background/50 rounded-lg"
                >
                  <div>
                    <span className="text-sm font-medium">{child.firstName}</span>
                    <span className="text-xs text-text-muted ml-2">Age {child.age}</span>
                  </div>
                  {child.racingDevelopment?.isActive && (
                    <Badge variant="blue" size="sm">Racing</Badge>
                  )}
                </div>
              ))}
              {state.children.length > 3 && (
                <p className="text-xs text-text-muted text-center">
                  +{state.children.length - 3} more
                </p>
              )}
            </div>
          ) : (
            <div className="p-3 bg-background/50 rounded-lg text-center text-sm text-text-muted">
              No children yet
            </div>
          )}

          {state.familyTree && (
            <div className="p-3 bg-accent-gold/10 border border-accent-gold/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-accent-gold" />
                <span className="text-sm font-medium">Dynasty</span>
              </div>
              <p className="text-xs text-text-muted mt-1">
                {dynastyYears} years • {state.familyTree.legacy.totalFamilyChampionships} championships
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Lifestyle & Health */}
      <Card variant="glass" padding="lg">
        <CardHeader 
          title="Lifestyle" 
          icon={<Activity className="w-5 h-5" />}
        />
        <div className="space-y-4">
          {/* Health */}
          <div className="p-4 bg-background rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Health</span>
              <span className="text-xs text-text-muted">Age {state.health.age}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <HealthBar 
                label="Physical" 
                value={state.health.physicalHealth} 
              />
              <HealthBar 
                label="Mental" 
                value={state.health.mentalHealth} 
              />
              <HealthBar 
                label="Fitness" 
                value={state.health.fitness} 
              />
              <HealthBar 
                label="Stress" 
                value={100 - state.health.stressLevel}
                inverted 
              />
            </div>
          </div>

          {/* Lifestyle Level */}
          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
            <span className="text-sm">Lifestyle</span>
            <Badge variant="outline" className="capitalize">
              {state.lifestyleLevel.replace('_', ' ')}
            </Badge>
          </div>

          {/* Hobbies */}
          {state.hobbies.length > 0 && (
            <div className="p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-text-muted mb-2">Active Hobbies</p>
              <div className="flex flex-wrap gap-1">
                {state.hobbies.slice(0, 4).map(hobby => (
                  <Badge key={hobby.type} variant="outline" size="sm">
                    {hobby.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Staff Summary */}
          {state.staff.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Users className="w-4 h-4" />
              <span>{state.staff.length} personal staff members</span>
            </div>
          )}
        </div>
      </Card>

      {/* Social & Reputation */}
      <Card variant="glass" padding="lg" className="col-span-2">
        <CardHeader 
          title="Reputation & Social" 
          icon={<Star className="w-5 h-5" />}
        />
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-background rounded-lg">
            <p className="text-sm text-text-muted mb-2">Public Image</p>
            <div className="flex items-end gap-2">
              <span className="font-mono font-bold text-3xl">{state.brand.publicImage}</span>
              <span className="text-text-muted text-sm mb-1">/100</span>
            </div>
            <div className="h-2 bg-surface rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-accent-gold"
                style={{ width: `${state.brand.publicImage}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-background rounded-lg">
            <p className="text-sm text-text-muted mb-2">Brand Strength</p>
            <div className="flex items-end gap-2">
              <span className="font-mono font-bold text-3xl">{state.brand.brandValue}</span>
              <span className="text-text-muted text-sm mb-1">/100</span>
            </div>
            <div className="h-2 bg-surface rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-accent-blue"
                style={{ width: `${state.brand.brandValue}%` }}
              />
            </div>
            <p className="text-xs text-text-muted mt-2">
              Speaking fee: ${state.brand.speakingFee.toLocaleString()}
            </p>
          </div>

          <div className="p-4 bg-background rounded-lg">
            <p className="text-sm text-text-muted mb-2">Network</p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Contacts</span>
                <span className="font-mono">{state.contacts.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Endorsements</span>
                <span className="font-mono">{state.brand.endorsements.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Foundations</span>
                <span className="font-mono">{state.foundations.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Issues */}
        {(state.scandals.filter(s => s.status !== 'resolved').length > 0 || 
          state.rivalries.filter(r => r.isActive).length > 0) && (
          <div className="mt-4 p-4 bg-status-danger/10 border border-status-danger/30 rounded-lg">
            <p className="text-sm font-medium text-status-danger mb-2">Active Issues</p>
            <div className="space-y-1">
              {state.scandals.filter(s => s.status !== 'resolved').map(scandal => (
                <div key={scandal.id} className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-status-danger" />
                  <span>{scandal.name}</span>
                  <Badge variant="red" size="sm">{scandal.status}</Badge>
                </div>
              ))}
              {state.rivalries.filter(r => r.isActive).map(rivalry => (
                <div key={rivalry.id} className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-status-warning" />
                  <span>Rivalry with {rivalry.rivalName}</span>
                  <Badge variant="yellow" size="sm">{rivalry.intensity}%</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Team Ownership */}
      {state.teamEquity && (
        <Card variant="racing" padding="lg">
          <CardHeader 
            title={`${teamName} Ownership`} 
            icon={<Building2 className="w-5 h-5" />}
          />
          <div className="space-y-4">
            <div className="p-4 bg-background rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">Your Stake</span>
                <Badge variant="blue">
                  {state.teamEquity.ownershipPercent.toFixed(1)}%
                </Badge>
              </div>
              <p className="font-mono font-bold text-2xl text-accent-blue">
                ${(state.teamEquity.currentValuation * state.teamEquity.ownershipPercent / 100).toLocaleString()}
              </p>
              <p className="text-xs text-text-muted mt-1">
                of ${state.teamEquity.currentValuation.toLocaleString()} valuation
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-text-muted">Total Invested</span>
                <p className="font-mono">${state.teamEquity.totalInvested.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-text-muted">Dividends Received</span>
                <p className="font-mono text-status-success">
                  ${state.teamEquity.totalDividendsReceived.toLocaleString()}
                </p>
              </div>
            </div>

            {state.teamEquity.externalInvestors.length > 0 && (
              <div className="pt-3 border-t border-surface-border">
                <p className="text-xs text-text-muted">
                  {state.teamEquity.externalInvestors.length} external investor{state.teamEquity.externalInvestors.length > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  color: 'success' | 'danger' | 'warning' | 'info' | 'gold'
  alert?: string
}

function StatCard({ icon, label, value, color, alert }: StatCardProps) {
  const colorClasses = {
    success: 'text-status-success bg-status-success/20',
    danger: 'text-status-danger bg-status-danger/20',
    warning: 'text-status-warning bg-status-warning/20',
    info: 'text-status-info bg-status-info/20',
    gold: 'text-accent-gold bg-accent-gold/20'
  }
  const valueColors = {
    success: 'text-status-success',
    danger: 'text-status-danger',
    warning: 'text-status-warning',
    info: 'text-status-info',
    gold: 'text-accent-gold'
  }

  return (
    <Card variant="glass" padding="md">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          {icon}
        </div>
        {alert && (
          <Badge variant="red" size="sm">{alert}</Badge>
        )}
      </div>
      <p className="text-text-muted text-sm">{label}</p>
      <p className={`font-mono font-bold text-xl ${valueColors[color]}`}>
        {value}
      </p>
    </Card>
  )
}

interface HealthBarProps {
  label: string
  value: number
  inverted?: boolean
}

function HealthBar({ label, value, inverted }: HealthBarProps) {
  const displayValue = inverted ? 100 - value : value
  const color = displayValue >= 70 ? 'bg-status-success' :
                displayValue >= 40 ? 'bg-status-warning' : 'bg-status-danger'

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-muted">{label}</span>
        <span>{Math.round(displayValue)}%</span>
      </div>
      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
        <div 
          className={`h-full ${color}`}
          style={{ width: `${displayValue}%` }}
        />
      </div>
    </div>
  )
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatLargeNumber(num: number): string {
  const absNum = Math.abs(num)
  if (absNum >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B'
  }
  if (absNum >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (absNum >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString()
}
