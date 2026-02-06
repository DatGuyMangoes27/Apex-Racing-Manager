import { motion } from 'framer-motion'
import { Wrench, Wind, Car, Zap, Cpu, Clock, Check } from 'lucide-react'
import { Card, CardHeader, Badge, InfoTooltip, tooltipDefinitions } from '@/components/ui'
import { useCareerStore, DevelopmentArea, AREA_EFFECTS, UPGRADES } from '@/store/careerStore'

interface DevelopmentProgressWidgetProps {
  compact?: boolean
}

const areaIcons: Record<DevelopmentArea, typeof Wind> = {
  aerodynamics: Wind,
  chassis: Car,
  powertrain: Zap,
  electronics: Cpu
}

const areaColors: Record<DevelopmentArea, { text: string; bg: string }> = {
  aerodynamics: { text: 'text-accent-blue', bg: 'bg-accent-blue' },
  chassis: { text: 'text-accent-orange', bg: 'bg-accent-orange' },
  powertrain: { text: 'text-status-error', bg: 'bg-status-error' },
  electronics: { text: 'text-purple-400', bg: 'bg-purple-500' }
}

export function DevelopmentProgressWidget({ compact = false }: DevelopmentProgressWidgetProps) {
  const { careerState } = useCareerStore()
  
  const teamDev = careerState?.teamDevelopment
  
  if (!teamDev) {
    return (
      <Card variant="glass" padding={compact ? 'md' : 'lg'}>
        <div className="flex items-center gap-2 text-text-muted">
          <Wrench className="w-5 h-5" />
          <span className="text-sm">No active development</span>
        </div>
      </Card>
    )
  }
  
  const areas = teamDev.areas
  
  // Find active research across all areas
  const activeResearch: Array<{
    area: DevelopmentArea
    upgradeId: string
    progress: number
    upgradeName: string
  }> = []
  
  Object.entries(areas).forEach(([area, data]) => {
    if (data.currentUpgradeId && data.researchProgress < 100) {
      const upgrade = UPGRADES.find(u => u.id === data.currentUpgradeId)
      activeResearch.push({
        area: area as DevelopmentArea,
        upgradeId: data.currentUpgradeId,
        progress: data.researchProgress,
        upgradeName: upgrade?.name || 'Unknown'
      })
    }
  })
  
  // Count completed upgrades
  const totalCompleted = Object.values(areas).reduce(
    (sum, area) => sum + area.completedUpgrades.length, 
    0
  )
  
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${activeResearch.length > 0 ? 'bg-accent-blue/10' : 'bg-surface-secondary'} flex items-center justify-center`}>
          <Wrench className={`w-5 h-5 ${activeResearch.length > 0 ? 'text-accent-blue' : 'text-text-muted'}`} />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <p className="text-xs text-text-muted uppercase tracking-wider">R&D</p>
            <InfoTooltip 
              content={tooltipDefinitions.developmentPoints.description}
              position="bottom"
              iconSize={12}
            />
          </div>
          <p className="font-display font-bold text-xl">
            {activeResearch.length > 0 ? `${activeResearch.length} Active` : 'Idle'}
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <Card variant="glass" padding="lg">
      <CardHeader 
        title="Development Progress"
        icon={<Wrench className="w-5 h-5" />}
        action={
          <Badge variant={activeResearch.length > 0 ? 'blue' : 'gray'}>
            {totalCompleted} Upgrades
          </Badge>
        }
      />
      
      {/* Active Research */}
      {activeResearch.length > 0 ? (
        <div className="space-y-3 mb-4">
          <h4 className="text-xs uppercase tracking-wider text-text-muted font-medium">Active Research</h4>
          {activeResearch.map(research => {
            const AreaIcon = areaIcons[research.area]
            const colors = areaColors[research.area]
            
            return (
              <div 
                key={research.upgradeId}
                className="p-3 bg-surface-secondary/30 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AreaIcon className={`w-4 h-4 ${colors.text}`} />
                    <span className="text-sm font-medium">{research.upgradeName}</span>
                  </div>
                  <span className="text-xs text-text-muted">{Math.round(research.progress)}%</span>
                </div>
                <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${colors.bg} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${research.progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-4 bg-surface-secondary/20 rounded-lg text-center mb-4">
          <Clock className="w-6 h-6 mx-auto text-text-muted mb-2" />
          <p className="text-sm text-text-muted">No active research</p>
          <p className="text-xs text-text-muted mt-1">Visit Development to start an upgrade</p>
        </div>
      )}
      
      {/* Area Summary */}
      <div className="grid grid-cols-2 gap-2">
        {(Object.entries(areas) as [DevelopmentArea, typeof areas.aerodynamics][]).map(([area, data]) => {
          const AreaIcon = areaIcons[area]
          const colors = areaColors[area]
          const areaInfo = AREA_EFFECTS[area]
          
          return (
            <div 
              key={area}
              className="p-2 bg-surface-secondary/20 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-1">
                <AreaIcon className={`w-3 h-3 ${colors.text}`} />
                <span className="text-xs font-medium capitalize">{areaInfo.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">{Math.round(data.points)} pts</span>
                {data.completedUpgrades.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-status-success" />
                    <span className="text-xs text-status-success">{data.completedUpgrades.length}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Budget Info */}
      {teamDev.budget?.weeklyAllocation && teamDev.budget.weeklyAllocation > 0 && (
        <div className="mt-4 pt-3 border-t border-border-subtle">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Weekly R&D Budget</span>
            <span className="font-mono text-accent-gold">
              ${teamDev.budget.weeklyAllocation.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}
