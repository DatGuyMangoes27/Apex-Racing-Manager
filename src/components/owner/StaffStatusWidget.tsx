import { motion } from 'framer-motion'
import { Users2, Cog, Flag, User, AlertTriangle, Battery, Smile } from 'lucide-react'
import { Card, CardHeader, Badge, StaffPortrait } from '@/components/ui'
import { getStaffPortrait, getRandomStaffPortraitByRole, getPortraitByManifestId, getFallbackPortrait } from '@/utils/generated-assets'
import { useCareerStore, TeamStaffRole } from '@/store/careerStore'

interface StaffStatusWidgetProps {
  compact?: boolean
}

const roleIcons: Partial<Record<TeamStaffRole, typeof Cog>> & Record<string, typeof Cog> = {
  chief_engineer: Cog,
  strategist: Flag,
  technical_director: Cog,
  team_manager: User,
  pr_manager: User,
  crew_chief: Cog,
  data_engineer: Cog,
  reserve_driver: User
}

const roleLabels: Partial<Record<TeamStaffRole, string>> & Record<string, string> = {
  chief_engineer: 'Chief Engineer',
  strategist: 'Race Strategist',
  technical_director: 'Technical Director',
  team_manager: 'Team Manager',
  pr_manager: 'PR Manager',
  crew_chief: 'Crew Chief',
  data_engineer: 'Data Engineer',
  reserve_driver: 'Reserve Driver'
}

export function StaffStatusWidget({ compact = false }: StaffStatusWidgetProps) {
  const { careerState } = useCareerStore()
  
  const staff = careerState?.ownedTeam?.staff ?? []
  
  // Get status colors based on level
  const getStatusColor = (value: number) => {
    if (value >= 80) return { text: 'text-status-success', bg: 'bg-status-success' }
    if (value >= 60) return { text: 'text-accent-blue', bg: 'bg-accent-blue' }
    if (value >= 40) return { text: 'text-accent-orange', bg: 'bg-accent-orange' }
    return { text: 'text-status-error', bg: 'bg-status-error' }
  }
  
  // Calculate average morale
  const avgMorale = staff.length > 0
    ? Math.round(staff.reduce((sum, s) => sum + (s.morale ?? 70), 0) / staff.length)
    : 0
  
  // Count fatigued staff (fatigue > 60)
  const fatiguedCount = staff.filter(s => (s.fatigue ?? 30) > 60).length
  
  // Check if key roles are filled
  const hasChiefEngineer = staff.some(s => s.role === 'chief_engineer')
  const hasStrategist = staff.some(s => s.role === 'strategist')
  
  if (staff.length === 0) {
    return (
      <Card variant="glass" padding={compact ? 'md' : 'lg'}>
        <div className="flex items-center gap-2 text-text-muted">
          <Users2 className="w-5 h-5" />
          <span className="text-sm">No staff hired</span>
        </div>
        {!compact && (
          <p className="text-xs text-text-muted mt-2">
            Visit Contracts to hire key personnel
          </p>
        )}
      </Card>
    )
  }
  
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${fatiguedCount > 0 ? 'bg-status-warning/10' : 'bg-status-success/10'} flex items-center justify-center`}>
          <Users2 className={`w-5 h-5 ${fatiguedCount > 0 ? 'text-status-warning' : 'text-status-success'}`} />
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider">Staff</p>
          <p className="font-display font-bold text-xl">{staff.length} Hired</p>
        </div>
      </div>
    )
  }
  
  return (
    <Card variant="glass" padding="lg">
      <CardHeader 
        title="Staff Status"
        icon={<Users2 className="w-5 h-5" />}
        action={
          <Badge variant={fatiguedCount > 0 ? 'orange' : 'green'}>
            {fatiguedCount > 0 ? `${fatiguedCount} Tired` : `${avgMorale}% Morale`}
          </Badge>
        }
      />
      
      <div className="space-y-3">
        {staff.map(member => {
          const RoleIcon = roleIcons[member.role] || User
          const fatigue = member.fatigue ?? 30
          const morale = member.morale ?? 70
          const fatigueStatus = getStatusColor(100 - fatigue) // Invert for display
          const moraleStatus = getStatusColor(morale)
          
          return (
            <div 
              key={member.id}
              className="p-3 bg-surface-secondary/30 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <StaffPortrait
                    src={
                      member.portraitId
                        ? (getPortraitByManifestId(member.portraitId) || getFallbackPortrait(member.gender || 'male'))
                        : (getStaffPortrait(member.id) || getRandomStaffPortraitByRole(member.role))
                    }
                    name={member.name}
                    role={roleLabels[member.role]}
                    size="sm"
                  />
                  <div>
                    <span className="font-medium text-sm">{member.name}</span>
                    <span className="text-xs text-text-muted ml-2">
                      {roleLabels[member.role]}
                    </span>
                  </div>
                </div>
                {fatigue > 70 && (
                  <AlertTriangle className="w-4 h-4 text-status-warning" />
                )}
              </div>
              
              {/* Stats Bars */}
              <div className="grid grid-cols-2 gap-3">
                {/* Morale */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <Smile className="w-3 h-3 text-text-muted" />
                      <span className="text-xs text-text-muted">Morale</span>
                    </div>
                    <span className={`text-xs font-mono ${moraleStatus.text}`}>
                      {morale}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${moraleStatus.bg} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${morale}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
                
                {/* Fatigue (displayed as energy) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <Battery className="w-3 h-3 text-text-muted" />
                      <span className="text-xs text-text-muted">Energy</span>
                    </div>
                    <span className={`text-xs font-mono ${fatigueStatus.text}`}>
                      {100 - fatigue}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${fatigueStatus.bg} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${100 - fatigue}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Skills Summary */}
              {member.skills && (
                <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
                  <span>Skills:</span>
                  <span className="font-mono">
                    Strat {member.skills.strategy} | 
                    Rel {member.skills.reliability} | 
                    Pit {member.skills.pit}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Missing Roles Warning */}
      {(!hasChiefEngineer || !hasStrategist) && (
        <div className="mt-4 p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg">
          <div className="flex items-center gap-2 text-status-warning">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Missing Key Roles</span>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {!hasChiefEngineer && 'Chief Engineer • '}
            {!hasStrategist && 'Race Strategist'}
          </p>
        </div>
      )}
    </Card>
  )
}
