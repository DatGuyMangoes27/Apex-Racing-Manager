import { motion } from 'framer-motion'
import { DollarSign, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, Badge, InfoTooltip, tooltipDefinitions } from '@/components/ui'
import { useCareerStore } from '@/store/careerStore'

interface RunwayWidgetProps {
  compact?: boolean
}

// Calculate weekly burn rate based on team costs
function calculateWeeklyBurn(careerState: any): number {
  const team = careerState.ownedTeam
  if (!team) return 0
  
  // Estimate weekly costs:
  // - Staff salaries (weekly portion)
  // - Car maintenance/running costs
  // - Operational costs
  const staffCosts = team.staff.reduce((sum: number, s: NonNullable<typeof team.staff[0]>) => sum + ((s.contract?.salary ?? 0) || 0), 0) / 52  // Annual to weekly
  const carCosts = (careerState.cars?.length || 0) * 5000  // Rough weekly running cost per car
  const operationalCosts = team.budgets.opex / 52  // Annual opex to weekly
  
  return Math.round(staffCosts + carCosts + operationalCosts)
}

export function RunwayWidget({ compact = false }: RunwayWidgetProps) {
  const { careerState } = useCareerStore()
  
  const cash = careerState?.ownedTeam?.budgets.cash ?? 0
  const weeklyBurn = calculateWeeklyBurn(careerState!)
  const runwayWeeks = weeklyBurn > 0 ? Math.floor(cash / weeklyBurn) : 999
  
  // Determine runway status
  const getRunwayStatus = (weeks: number) => {
    if (weeks >= 26) return { color: 'text-status-success', bg: 'bg-status-success', label: 'Healthy', variant: 'green' as const }
    if (weeks >= 12) return { color: 'text-accent-blue', bg: 'bg-accent-blue', label: 'Stable', variant: 'blue' as const }
    if (weeks >= 6) return { color: 'text-accent-orange', bg: 'bg-accent-orange', label: 'Caution', variant: 'orange' as const }
    if (weeks >= 2) return { color: 'text-status-warning', bg: 'bg-status-warning', label: 'Critical', variant: 'orange' as const }
    return { color: 'text-status-error', bg: 'bg-status-error', label: 'Emergency', variant: 'red' as const }
  }
  
  const runwayStatus = getRunwayStatus(runwayWeeks)
  
  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}k`
    return `$${amount}`
  }
  
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${runwayStatus.bg}/10 flex items-center justify-center ${runwayStatus.color}`}>
          <DollarSign className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <p className="text-xs text-text-muted uppercase tracking-wider">Runway</p>
            <InfoTooltip 
              content={tooltipDefinitions.runway.description}
              position="bottom"
              iconSize={12}
            />
          </div>
          <p className="font-display font-bold text-xl">
            {runwayWeeks >= 52 ? '52+' : runwayWeeks} <span className="text-sm font-normal text-text-muted">weeks</span>
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <Card variant="glass" padding="lg">
      <CardHeader 
        title="Financial Health"
        icon={<DollarSign className="w-5 h-5" />}
        action={
          <Badge variant={runwayStatus.variant} size="lg">
            {runwayStatus.label}
          </Badge>
        }
      />
      
      {/* Cash Balance */}
      <div className="mb-4 p-4 bg-surface-secondary/50 rounded-xl">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Cash Balance</span>
          <span className={`font-display font-bold text-2xl ${cash < 0 ? 'text-status-error' : 'text-status-success'}`}>
            {formatCurrency(cash)}
          </span>
        </div>
      </div>
      
      {/* Runway Visualization */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-secondary flex items-center gap-1">
            Runway
            <InfoTooltip 
              content={tooltipDefinitions.runway.description}
              position="right"
              iconSize={12}
            />
          </span>
          <span className={`font-mono font-bold ${runwayStatus.color}`}>
            {runwayWeeks >= 52 ? '52+' : runwayWeeks} weeks
          </span>
        </div>
        <div className="h-3 bg-surface-secondary rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${runwayStatus.bg} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (runwayWeeks / 52) * 100)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
      
      {/* Burn Rate */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-surface-secondary/30 rounded-lg">
          <div className="flex items-center gap-1 text-status-error mb-1">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Weekly Burn</span>
          </div>
          <p className="font-mono font-bold text-lg">{formatCurrency(weeklyBurn)}</p>
        </div>
        <div className="p-3 bg-surface-secondary/30 rounded-lg">
          <div className="flex items-center gap-1 text-status-success mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Monthly Need</span>
          </div>
          <p className="font-mono font-bold text-lg">{formatCurrency(weeklyBurn * 4)}</p>
        </div>
      </div>
      
      {/* Warning */}
      {runwayWeeks < 12 && (
        <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
          runwayWeeks < 6 ? 'bg-status-error/10 border border-status-error/30' : 'bg-status-warning/10 border border-status-warning/30'
        }`}>
          <AlertTriangle className={`w-4 h-4 ${runwayWeeks < 6 ? 'text-status-error' : 'text-status-warning'}`} />
          <span className="text-sm">
            {runwayWeeks < 6 
              ? 'Financial emergency! Secure funding immediately.' 
              : 'Low runway - consider cost reductions or new revenue.'}
          </span>
        </div>
      )}
    </Card>
  )
}
