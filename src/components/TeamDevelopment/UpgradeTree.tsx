import { motion } from 'framer-motion'
import { 
  X, 
  Lock, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Target,
  Zap,
  ArrowRight
} from 'lucide-react'
import { Card, CardHeader, Badge, Button } from '@/components/ui'
import { 
  DevelopmentArea, 
  AreaProgress, 
  CarUpgrade,
  getUpgradesForArea,
  formatBudget,
  AREA_EFFECTS
} from '@/simulation/teamDevelopment'

interface UpgradeTreeProps {
  area: DevelopmentArea
  areaState: AreaProgress
  budget: number
  onStartResearch: (upgradeId: string) => boolean
  onClose: () => void
}

export function UpgradeTree({ 
  area, 
  areaState, 
  budget, 
  onStartResearch, 
  onClose 
}: UpgradeTreeProps) {
  const areaInfo = AREA_EFFECTS[area]
  const upgrades = getUpgradesForArea(area)
  
  // Group by tier
  const tier1 = upgrades.filter(u => u.tier === 1)
  const tier2 = upgrades.filter(u => u.tier === 2)
  const tier3 = upgrades.filter(u => u.tier === 3)
  
  const getUpgradeStatus = (upgrade: CarUpgrade): 'completed' | 'researching' | 'available' | 'locked' | 'unaffordable' => {
    if (areaState.completedUpgrades.includes(upgrade.id)) return 'completed'
    if (areaState.currentUpgradeId === upgrade.id) return 'researching'
    
    // Check prerequisite
    if (upgrade.prerequisiteId && !areaState.completedUpgrades.includes(upgrade.prerequisiteId)) {
      return 'locked'
    }
    
    // Check if already researching something else
    if (areaState.currentUpgradeId) return 'locked'
    
    // Check budget
    if (budget < upgrade.researchCost) return 'unaffordable'
    
    return 'available'
  }
  
  const handleStartResearch = (upgradeId: string) => {
    const success = onStartResearch(upgradeId)
    if (success) {
      // Optionally show feedback
    }
  }
  
  const renderUpgradeCard = (upgrade: CarUpgrade) => {
    const status = getUpgradeStatus(upgrade)
    
    return (
      <motion.div
        key={upgrade.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          p-3 rounded-lg border transition-all
          ${status === 'completed' ? 'bg-status-success/10 border-status-success/50' : ''}
          ${status === 'researching' ? 'bg-status-info/10 border-status-info/50 animate-pulse' : ''}
          ${status === 'available' ? 'bg-surface border-surface-border hover:border-accent-orange cursor-pointer' : ''}
          ${status === 'locked' ? 'bg-surface/50 border-surface-border/50 opacity-60' : ''}
          ${status === 'unaffordable' ? 'bg-surface/50 border-status-warning/50 opacity-75' : ''}
        `}
        onClick={() => status === 'available' && handleStartResearch(upgrade.id)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-sm flex items-center gap-2">
              {status === 'completed' && <CheckCircle2 className="w-4 h-4 text-status-success" />}
              {status === 'researching' && <Clock className="w-4 h-4 text-status-info animate-spin" />}
              {status === 'locked' && <Lock className="w-4 h-4 text-text-muted" />}
              {upgrade.name}
            </h4>
            <p className="text-xs text-text-muted mt-0.5">{upgrade.description}</p>
          </div>
          
          <Badge 
            variant={
              status === 'completed' ? 'green' :
              status === 'researching' ? 'blue' :
              status === 'available' ? 'orange' :
              'default'
            }
            size="sm"
          >
            T{upgrade.tier}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-text-muted">
              <DollarSign className="w-3 h-3" />
              {formatBudget(upgrade.researchCost)}
            </span>
            <span className="flex items-center gap-1 text-text-muted">
              <Target className="w-3 h-3" />
              {upgrade.pointsRequired} pts
            </span>
          </div>
          
          <span className="text-status-success font-mono">
            {(upgrade.aiModifierBonus * 100).toFixed(1)}% gain
          </span>
        </div>
        
        {status === 'available' && (
          <Button 
            variant="secondary" 
            size="sm" 
            className="w-full mt-2"
            onClick={(e) => {
              e.stopPropagation()
              handleStartResearch(upgrade.id)
            }}
          >
            <Zap className="w-3 h-3 mr-1" />
            Start Research
          </Button>
        )}
        
        {status === 'researching' && (
          <div className="mt-2 pt-2 border-t border-surface-border">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-status-info">Research Progress</span>
              <span className="text-status-info">
                {Math.round(areaState.researchProgress)}/{upgrade.pointsRequired} pts
              </span>
            </div>
            <div className="h-1.5 bg-background rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-status-info"
                initial={{ width: 0 }}
                animate={{ width: `${(areaState.researchProgress / upgrade.pointsRequired) * 100}%` }}
              />
            </div>
          </div>
        )}
        
        {status === 'unaffordable' && (
          <p className="text-xs text-status-warning mt-2 flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            Insufficient budget
          </p>
        )}
      </motion.div>
    )
  }
  
  return (
    <Card variant="default" padding="lg">
      <CardHeader 
        title={`${areaInfo.name} Upgrades`}
        subtitle={areaInfo.description}
        action={
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        }
      />
      
      <div className="grid grid-cols-3 gap-4">
        {/* Tier 1 */}
        <div>
          <h5 className="text-xs font-medium text-text-muted mb-2 flex items-center gap-2">
            <Badge variant="default" size="sm">Tier 1</Badge>
            Foundation
          </h5>
          <div className="space-y-2">
            {tier1.map(renderUpgradeCard)}
          </div>
        </div>
        
        {/* Tier 2 */}
        <div>
          <h5 className="text-xs font-medium text-text-muted mb-2 flex items-center gap-2">
            <Badge variant="blue" size="sm">Tier 2</Badge>
            Advanced
          </h5>
          <div className="space-y-2">
            {tier2.map(renderUpgradeCard)}
          </div>
        </div>
        
        {/* Tier 3 */}
        <div>
          <h5 className="text-xs font-medium text-text-muted mb-2 flex items-center gap-2">
            <Badge variant="orange" size="sm">Tier 3</Badge>
            Elite
          </h5>
          <div className="space-y-2">
            {tier3.map(renderUpgradeCard)}
          </div>
        </div>
      </div>
      
      {/* Upgrade Path Visualization */}
      <div className="mt-4 pt-4 border-t border-surface-border">
        <p className="text-xs text-text-muted flex items-center gap-2">
          <ArrowRight className="w-3 h-3" />
          Complete Tier 1 upgrades to unlock Tier 2, then Tier 2 for Tier 3
        </p>
      </div>
    </Card>
  )
}

