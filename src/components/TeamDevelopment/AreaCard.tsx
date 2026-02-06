import { motion } from 'framer-motion'
import { LucideIcon, ChevronRight, Target, CheckCircle2 } from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import { DevelopmentArea, AreaProgress, getAreaStatus } from '@/simulation/teamDevelopment'

interface AreaCardProps {
  area: DevelopmentArea
  areaInfo: {
    name: string
    description: string
    icon: string
    aiTargets: string[]
    color: string
  }
  areaState: AreaProgress
  icon: LucideIcon
  isSelected: boolean
  isFocused: boolean
  onClick: () => void
}

export function AreaCard({ 
  area, 
  areaInfo, 
  areaState, 
  icon: Icon,
  isSelected,
  isFocused,
  onClick 
}: AreaCardProps) {
  const status = getAreaStatus(areaState.points)
  const hasActiveResearch = !!areaState.currentUpgradeId
  const completedCount = areaState.completedUpgrades.length
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        variant={isSelected ? 'racing' : 'glass'} 
        padding="md"
        className={`cursor-pointer transition-all duration-200 ${
          isSelected ? 'ring-2 ring-accent-red' : ''
        } ${isFocused ? 'border-accent-orange border-2' : ''}`}
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${areaInfo.color} bg-current/10`}>
              <Icon className={`w-5 h-5 ${areaInfo.color}`} />
            </div>
            <div>
              <h3 className="font-semibold">{areaInfo.name}</h3>
              <p className="text-xs text-text-muted">{areaInfo.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isFocused && (
              <Badge variant="orange" size="sm">Focus</Badge>
            )}
            {hasActiveResearch && (
              <Badge variant="blue" size="sm">
                <Target className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
            <ChevronRight className={`w-4 h-4 text-text-muted transition-transform ${isSelected ? 'rotate-90' : ''}`} />
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text-muted">Progress</span>
            <span className={status.color}>{Math.round(areaState.points)}/100</span>
          </div>
          <div className="h-2 bg-background rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${
                area === 'aerodynamics' ? 'bg-blue-500' :
                area === 'chassis' ? 'bg-orange-500' :
                area === 'powertrain' ? 'bg-red-500' :
                'bg-purple-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${areaState.points}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        
        {/* Status and Completed Upgrades */}
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${status.color}`}>
            {status.status}
          </span>
          <span className="text-xs text-text-muted flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {completedCount} upgrades
          </span>
        </div>
        
        {/* Research Progress (if active) */}
        {hasActiveResearch && areaState.researchProgress > 0 && (
          <div className="mt-2 pt-2 border-t border-surface-border">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-status-info">Research Progress</span>
              <span className="text-status-info">{Math.round(areaState.researchProgress)}%</span>
            </div>
            <div className="h-1 bg-background rounded-full overflow-hidden">
              <div 
                className="h-full bg-status-info transition-all"
                style={{ width: `${Math.min(100, areaState.researchProgress)}%` }}
              />
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  )
}







