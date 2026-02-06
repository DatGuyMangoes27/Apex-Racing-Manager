import { motion } from 'framer-motion'
import { Users, Crown, User, AlertTriangle, Activity } from 'lucide-react'
import { Card, CardHeader, Badge } from '@/components/ui'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'

interface DriverLineupWidgetProps {
  compact?: boolean
}

export function DriverLineupWidget({ compact = false }: DriverLineupWidgetProps) {
  const { player, careerState } = useCareerStore()
  const { rivals } = useRivalStore()
  
  if (!player || !careerState) return null
  
  const ownedTeam = careerState.ownedTeam
  const teamDrivers = ownedTeam?.drivers ?? []
  
  // Get full driver info from rivals for hired drivers
  const hiredDriversWithInfo = teamDrivers.map(td => {
    const rivalDriver = rivals.find(r => r.id === td.driverId)
    return { ...td, rivalDriver }
  })
  
  // Calculate condition from mental state values
  const getConditionLevel = (fatigue: number, fitness: number) => {
    const condition = ((100 - fatigue) + fitness) / 2
    if (condition >= 80) return { label: 'Peak', color: 'text-status-success', bg: 'bg-status-success' }
    if (condition >= 60) return { label: 'Good', color: 'text-accent-blue', bg: 'bg-accent-blue' }
    if (condition >= 40) return { label: 'Fair', color: 'text-accent-orange', bg: 'bg-accent-orange' }
    return { label: 'Poor', color: 'text-status-error', bg: 'bg-status-error' }
  }
  
  const playerCondition = getConditionLevel(
    player.mentalState?.fatigue ?? 30,
    player.health?.fitness ?? 70
  )
  
  const ProgressBar = ({ value, color }: { value: number; color: string }) => (
    <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden flex-1">
      <motion.div
        className={`h-full ${color} rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  )
  
  if (compact) {
    const totalDrivers = 1 + teamDrivers.length
    const healthyDrivers = [
      player.health?.injured ? 0 : 1,
      ...teamDrivers.map(td => {
        const rival = rivals.find(r => r.id === td.driverId)
        return rival ? 1 : 0
      })
    ].reduce((a, b) => a + b, 0)
    
    return (
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${healthyDrivers === totalDrivers ? 'bg-status-success/10' : 'bg-accent-orange/10'} flex items-center justify-center`}>
          <Users className={`w-5 h-5 ${healthyDrivers === totalDrivers ? 'text-status-success' : 'text-accent-orange'}`} />
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider">Drivers</p>
          <p className="font-display font-bold text-xl">{healthyDrivers}/{totalDrivers}</p>
        </div>
      </div>
    )
  }
  
  return (
    <Card variant="glass" padding="lg">
      <CardHeader 
        title="Driver Lineup"
        icon={<Users className="w-5 h-5" />}
        action={
          <Badge variant="blue">{1 + teamDrivers.length} Driver{teamDrivers.length !== 0 ? 's' : ''}</Badge>
        }
      />
      
      <div className="space-y-4">
        {/* Owner/Primary Driver */}
        <div className="p-3 bg-surface-secondary/30 rounded-lg border border-accent-gold/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-accent-gold" />
              <span className="font-medium">{player.firstName} {player.lastName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="gold" size="sm">OWNER</Badge>
              {player.health?.injured && (
                <Badge variant="red" size="sm">
                  <AlertTriangle className="w-3 h-3 mr-1" /> INJURED
                </Badge>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-text-muted">Confidence</span>
                <span className="text-xs font-mono">{player.mentalState?.confidence ?? 50}%</span>
              </div>
              <ProgressBar 
                value={player.mentalState?.confidence ?? 50} 
                color="bg-accent-blue" 
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-text-muted">Fitness</span>
                <span className="text-xs font-mono">{player.health?.fitness ?? 70}%</span>
              </div>
              <ProgressBar 
                value={player.health?.fitness ?? 70} 
                color="bg-status-success" 
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-text-muted">Fatigue</span>
                <span className="text-xs font-mono">{player.mentalState?.fatigue ?? 30}%</span>
              </div>
              <ProgressBar 
                value={player.mentalState?.fatigue ?? 30} 
                color="bg-status-warning" 
              />
            </div>
          </div>
          
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-text-muted">Overall Condition</span>
            <span className={`text-xs font-medium ${playerCondition.color}`}>
              {playerCondition.label}
            </span>
          </div>
        </div>
        
        {/* Hired Drivers */}
        {hiredDriversWithInfo.map((driver, index) => {
          const rival = driver.rivalDriver
          if (!rival) return null
          
          // Calculate approximate condition for AI drivers
          const _aiCondition = getConditionLevel(20, 75) // AI drivers generally in good shape
          
          return (
            <div key={driver.driverId} className="p-3 bg-surface-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-accent-blue" />
                  <span className="font-medium">{rival.firstName} {rival.lastName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="blue" size="sm">CAR #{index + 2}</Badge>
                  <Badge 
                    variant={driver.contract.satisfaction >= 60 ? 'green' : 'orange'} 
                    size="sm"
                  >
                    {driver.contract.satisfaction}% Happy
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Skill</span>
                  <span className="font-mono">{Math.round(rival.stats.raceSkill * 100)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Experience</span>
                  <span className="font-mono">{rival.age} yrs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Contract Until</span>
                  <span className="font-mono">{driver.contract.endYear}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Salary</span>
                  <span className="font-mono">${(driver.contract.salary / 1000).toFixed(0)}k/race</span>
                </div>
              </div>
            </div>
          )
        })}
        
        {teamDrivers.length === 0 && (
          <div className="p-4 bg-surface-secondary/20 rounded-lg text-center">
            <Activity className="w-6 h-6 mx-auto text-text-muted mb-2" />
            <p className="text-sm text-text-muted">No additional drivers contracted</p>
            <p className="text-xs text-text-muted mt-1">Visit Contracts to hire a second driver</p>
          </div>
        )}
      </div>
    </Card>
  )
}
