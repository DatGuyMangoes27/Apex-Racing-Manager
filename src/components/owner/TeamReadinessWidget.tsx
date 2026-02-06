import { motion } from 'framer-motion'
import { Shield, Users, Car, DollarSign, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { Card, CardHeader, Badge } from '@/components/ui'
import { useCareerStore } from '@/store/careerStore'

interface TeamReadinessWidgetProps {
  compact?: boolean
}

interface ReadinessItem {
  id: string
  label: string
  status: 'ready' | 'warning' | 'critical'
  detail: string
  icon: React.ReactNode
}

export function TeamReadinessWidget({ compact = false }: TeamReadinessWidgetProps) {
  const { careerState } = useCareerStore()
  
  const team = careerState?.ownedTeam
  const cars = careerState?.cars ?? []
  const staff = team?.staff ?? []
  
  // Calculate readiness items
  const readinessItems: ReadinessItem[] = []
  
  // Staff readiness
  const hasEnoughStaff = staff.length >= 2  // At least chief engineer and strategist
  const staffFatigue = staff.reduce((sum, s) => sum + (s.fatigue || 0), 0) / Math.max(1, staff.length)
  readinessItems.push({
    id: 'staff',
    label: 'Staff',
    status: hasEnoughStaff && staffFatigue < 50 ? 'ready' : staffFatigue > 70 ? 'critical' : 'warning',
    detail: hasEnoughStaff 
      ? `${staff.length} members, ${Math.round(100 - staffFatigue)}% energy`
      : 'Need more staff',
    icon: <Users className="w-4 h-4" />
  })
  
  // Fleet readiness
  const avgCarHealth = cars.length > 0 
    ? cars.reduce((sum, c) => sum + (100 - (c.wear ?? 0)), 0) / cars.length 
    : 100
  const carsInService = cars.filter(c => c.inService).length
  readinessItems.push({
    id: 'fleet',
    label: 'Fleet',
    status: avgCarHealth >= 70 && carsInService === 0 ? 'ready' : avgCarHealth < 40 ? 'critical' : 'warning',
    detail: cars.length > 0 
      ? `${cars.length} cars, ${Math.round(avgCarHealth)}% condition${carsInService > 0 ? `, ${carsInService} in service` : ''}`
      : 'No cars',
    icon: <Car className="w-4 h-4" />
  })
  
  // Financial readiness
  const cash = team?.budgets.cash ?? 0
  const weeklyBurn = (team?.budgets.opex ?? 0) / 52 + staff.reduce((sum, s) => sum + ((s.contract?.salary ?? 0) || 0) / 52, 0)
  const runwayWeeks = weeklyBurn > 0 ? Math.floor(cash / weeklyBurn) : 999
  readinessItems.push({
    id: 'finances',
    label: 'Finances',
    status: runwayWeeks >= 12 ? 'ready' : runwayWeeks < 4 ? 'critical' : 'warning',
    detail: `$${(cash / 1000).toFixed(0)}k, ${runwayWeeks >= 52 ? '52+' : runwayWeeks}w runway`,
    icon: <DollarSign className="w-4 h-4" />
  })
  
  // Overall readiness
  const criticalCount = readinessItems.filter(i => i.status === 'critical').length
  const warningCount = readinessItems.filter(i => i.status === 'warning').length
  const readyCount = readinessItems.filter(i => i.status === 'ready').length
  
  const overallStatus = criticalCount > 0 
    ? { label: 'Not Ready', color: 'text-status-error', bg: 'bg-status-error', variant: 'red' as const }
    : warningCount > 0 
      ? { label: 'Caution', color: 'text-accent-orange', bg: 'bg-accent-orange', variant: 'orange' as const }
      : { label: 'Race Ready', color: 'text-status-success', bg: 'bg-status-success', variant: 'green' as const }
  
  const readinessScore = Math.round((readyCount / readinessItems.length) * 100)
  
  // Get status icon
  const getStatusIcon = (status: ReadinessItem['status']) => {
    switch (status) {
      case 'ready': return <CheckCircle2 className="w-4 h-4 text-status-success" />
      case 'warning': return <AlertCircle className="w-4 h-4 text-accent-orange" />
      case 'critical': return <XCircle className="w-4 h-4 text-status-error" />
    }
  }
  
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${overallStatus.bg}/10 flex items-center justify-center ${overallStatus.color}`}>
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider">Team Rep</p>
          <p className="font-display font-bold text-xl">{team?.reputation ?? 0}</p>
        </div>
      </div>
    )
  }
  
  return (
    <Card variant="glass" padding="lg">
      <CardHeader 
        title="Team Readiness"
        icon={<Shield className="w-5 h-5" />}
        action={
          <Badge variant={overallStatus.variant} size="lg">
            {overallStatus.label}
          </Badge>
        }
      />
      
      {/* Readiness Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-secondary">Overall Readiness</span>
          <span className={`font-mono font-bold ${overallStatus.color}`}>{readinessScore}%</span>
        </div>
        <div className="h-3 bg-surface-secondary rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${overallStatus.bg} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${readinessScore}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
      
      {/* Readiness Items */}
      <div className="space-y-2">
        {readinessItems.map((item) => (
          <div 
            key={item.id}
            className={`p-3 rounded-lg flex items-center justify-between ${
              item.status === 'ready' ? 'bg-status-success/5' :
              item.status === 'warning' ? 'bg-accent-orange/5' :
              'bg-status-error/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-text-muted">{item.icon}</span>
              <div>
                <span className="text-sm font-medium">{item.label}</span>
                <p className="text-xs text-text-muted">{item.detail}</p>
              </div>
            </div>
            {getStatusIcon(item.status)}
          </div>
        ))}
      </div>
      
      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-surface-border flex items-center justify-center gap-4 text-xs">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-status-success" />
          {readyCount} Ready
        </span>
        <span className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-accent-orange" />
          {warningCount} Caution
        </span>
        <span className="flex items-center gap-1">
          <XCircle className="w-3 h-3 text-status-error" />
          {criticalCount} Critical
        </span>
      </div>
    </Card>
  )
}
