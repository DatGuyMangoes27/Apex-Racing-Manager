import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  TrendingUp, 
  Zap, 
  Wind, 
  Car, 
  Cpu, 
  DollarSign,
  Building2,
  Users,
  AlertTriangle,
  ArrowRight,
  Gauge,
  Smile,
  Frown,
  Meh,
  Target,
  Minus,
  Plus,
  FlaskConical
} from 'lucide-react'
import { Card, CardHeader, Button } from '@/components/ui'
import { useCareerStore, DevelopmentArea, AREA_EFFECTS, formatBudget, FacilityType } from '@/store/careerStore'
import { AreaCard } from './AreaCard'
import { UpgradeTree } from './UpgradeTree'
import { EventFeed } from './EventFeed'
import { FACILITY_NAMES, calculateStaffEffectivenessBonus } from '@/data/facility-config'

interface DevelopmentDashboardProps {
  onInitialize?: () => void
}

export function DevelopmentDashboard({ onInitialize }: DevelopmentDashboardProps) {
  const navigate = useNavigate()
  const { 
    careerState, 
    initializeTeamDevelopment,
    setDevFocus,
    setDevBudget,
    startResearch,
    getTeamDevModifier
  } = useCareerStore()
  
  const [selectedArea, setSelectedArea] = useState<DevelopmentArea | null>(null)
  
  const teamDev = careerState?.teamDevelopment
  const events = careerState?.developmentEvents || []
  
  // Get current team info for Team Owner mode
  const currentTeam = useMemo(() => {
    if (careerState?.ownedTeam) {
      return {
        id: careerState.ownedTeam.id,
        name: careerState.ownedTeam.name,
        tier: careerState.ownedTeam.tier
      }
    }
    return null
  }, [careerState?.ownedTeam])
  
  // Calculate AI modifier
  const aiModifier = getTeamDevModifier()
  
  // Calculate facility status and staff effectiveness
  const facilityStatus = useMemo(() => {
    if (!careerState?.ownedTeam?.facilities) return null
    
    const rdFacilities: FacilityType[] = ['aero', 'chassis', 'engine', 'sim']
    const facilities = careerState.ownedTeam.facilities
    const teamStaff = careerState.ownedTeam.staff || []
    
    const status: Record<FacilityType, { 
      level: number
      staffCount: number 
      effectiveness: number
      facilityName: string
    }> = {} as Record<FacilityType, { level: number; staffCount: number; effectiveness: number; facilityName: string }>
    
    let totalEffectiveness = 0
    let facilityCount = 0
    
    for (const facilityType of rdFacilities) {
      const facility = facilities[facilityType]
      if (!facility) continue
      
      const assignedStaffMembers = (facility.assignedStaff || [])
        .map(staffId => teamStaff.find(s => s.id === staffId))
        .filter((s): s is NonNullable<typeof s> => s !== undefined)
      
      const effectiveness = assignedStaffMembers.length > 0
        ? calculateStaffEffectivenessBonus(
            facilityType,
            assignedStaffMembers.map(staff => ({
              skills: staff.skills,
              specializations: staff.specializations,
              experience: staff.experience
            }))
          )
        : 0
      
      status[facilityType] = {
        level: facility.level,
        staffCount: assignedStaffMembers.length,
        effectiveness,
        facilityName: FACILITY_NAMES[facilityType]
      }
      
      totalEffectiveness += effectiveness
      facilityCount++
    }
    
    return {
      facilities: status,
      totalEffectiveness,
      averageEffectiveness: facilityCount > 0 ? totalEffectiveness / facilityCount : 0
    }
  }, [careerState?.ownedTeam?.facilities, careerState?.ownedTeam?.staff])
  
  // Calculate budget status including active research costs
  const budgetStatus = useMemo(() => {
    if (!careerState?.ownedTeam?.budgets || !teamDev) return null
    
    const devBudget = careerState.ownedTeam.budgets.developmentBudget || 0
    const weeklyAllocation = teamDev.budget.weeklyAllocation
    
    // Calculate active research - count how many areas have active research
    const areas: DevelopmentArea[] = ['aerodynamics', 'chassis', 'powertrain', 'electronics']
    const activeResearchCount = areas.filter(area => teamDev.areas[area].currentUpgradeId !== null).length
    
    // Weekly cost = base allocation (fuels development points)
    // Active research just uses development points, initial cost was paid upfront
    const weeksRemaining = weeklyAllocation > 0 ? Math.floor(devBudget / weeklyAllocation) : 999
    
    return {
      developmentBudget: devBudget,
      weeklyAllocation,
      activeResearchCount,
      weeksRemaining,
      isLow: weeksRemaining < 8 && weeksRemaining > 0,
      isCritical: weeksRemaining < 4 && weeksRemaining > 0
    }
  }, [careerState?.ownedTeam?.budgets, teamDev])
  
  // Get team morale
  const teamMorale = careerState?.ownedTeam?.teamMorale ?? 50
  const getMoraleIcon = (morale: number) => {
    if (morale >= 70) return Smile
    if (morale >= 40) return Meh
    return Frown
  }
  const getMoraleColor = (morale: number) => {
    if (morale >= 70) return 'text-status-success'
    if (morale >= 40) return 'text-status-warning'
    return 'text-status-error'
  }
  const getMoraleLabel = (morale: number) => {
    if (morale >= 80) return 'Excellent'
    if (morale >= 70) return 'High'
    if (morale >= 50) return 'Normal'
    if (morale >= 30) return 'Low'
    return 'Critical'
  }
  
  // Handle initialization
  const handleInitialize = () => {
    initializeTeamDevelopment()
    onInitialize?.()
  }
  
  // If no team development state, show initialization prompt
  if (!teamDev) {
    return (
      <Card variant="glass" padding="lg" className="text-center py-12">
        <TrendingUp className="w-16 h-16 mx-auto mb-4 text-text-muted" />
        <h3 className="font-display font-bold text-xl mb-2">Team Development</h3>
        <p className="text-text-muted mb-6 max-w-md mx-auto">
          Invest in R&D to develop your cars throughout the season.
          Assign staff to facilities and allocate budget for maximum development speed.
        </p>
        {careerState?.ownedTeam ? (
          <Button variant="primary" onClick={handleInitialize}>
            <Zap className="w-4 h-4 mr-2" />
            Initialize Development Program
          </Button>
        ) : (
          <p className="text-status-warning text-sm">
            Set up your team to access development features
          </p>
        )}
      </Card>
    )
  }
  
  const areas: DevelopmentArea[] = ['aerodynamics', 'chassis', 'powertrain', 'electronics']
  
  const getAreaIcon = (area: DevelopmentArea) => {
    switch (area) {
      case 'aerodynamics': return Wind
      case 'chassis': return Car
      case 'powertrain': return Zap
      case 'electronics': return Cpu
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-accent-red" />
            Team Development
          </h2>
          <p className="text-text-muted text-sm">
            {currentTeam?.name || 'Your Team'} • Season {careerState?.currentYear}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Performance Gain Display */}
          <Card variant="glass" padding="sm" className="px-4">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-status-success" />
              <div>
                <p className="text-xs text-text-muted">Performance Gain</p>
                <p className={`font-mono font-bold ${aiModifier < 0 ? 'text-status-success' : 'text-text-muted'}`}>
                  {aiModifier < 0 ? `${(aiModifier * 100).toFixed(1)}%` : '0%'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        {/* Main Panel - Area Cards and Upgrade Trees */}
        <div className="col-span-2 space-y-6">
          {/* Development Areas Grid */}
          <div className="grid grid-cols-2 gap-4">
            {areas.map((area) => {
              const areaInfo = AREA_EFFECTS[area]
              const areaState = teamDev.areas[area]
              const Icon = getAreaIcon(area)
              
              return (
                <AreaCard
                  key={area}
                  area={area}
                  areaInfo={areaInfo}
                  areaState={areaState}
                  icon={Icon}
                  isSelected={selectedArea === area}
                  isFocused={teamDev.budget.focusArea === area}
                  onClick={() => setSelectedArea(selectedArea === area ? null : area)}
                />
              )
            })}
          </div>
          
          {/* Upgrade Tree - Shows when area is selected */}
          {selectedArea && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <UpgradeTree
                area={selectedArea}
                areaState={teamDev.areas[selectedArea]}
                budget={budgetStatus?.developmentBudget || 0}
                onStartResearch={startResearch}
                onClose={() => setSelectedArea(null)}
              />
            </motion.div>
          )}
          
          {/* Focus Area Selection */}
          <Card variant="default" padding="md">
            <CardHeader 
              title="Development Focus" 
              icon={<Target className="w-4 h-4 text-accent-red" />}
            />
            <div className="grid grid-cols-5 gap-2 mt-3">
              <Button
                variant={teamDev.budget.focusArea === 'balanced' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setDevFocus('balanced')}
                className="text-xs"
              >
                Balanced
              </Button>
              {areas.map((area) => (
                <Button
                  key={area}
                  variant={teamDev.budget.focusArea === area ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setDevFocus(area)}
                  className="text-xs capitalize"
                >
                  {area.slice(0, 4)}
                </Button>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-2">
              {teamDev.budget.focusArea === 'balanced' 
                ? 'Resources split evenly across all areas'
                : `60% of resources focused on ${teamDev.budget.focusArea}`}
            </p>
          </Card>
        </div>
        
        {/* Sidebar - Team Status */}
        <div className="space-y-6">
          {/* Event Feed */}
          <EventFeed events={events} />
          
          {/* Facilities Summary */}
          {facilityStatus && (
            <Card variant="default" padding="md">
              <CardHeader 
                title="R&D Facilities" 
                icon={<Building2 className="w-4 h-4 text-accent-blue" />}
              />
              <div className="space-y-3">
                {Object.entries(facilityStatus.facilities).map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{data.facilityName}</span>
                      <span className="text-xs text-text-muted">Lv.{data.level}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-text-muted" />
                      <span className="text-xs text-text-muted">{data.staffCount}</span>
                      {data.effectiveness > 0 && (
                        <span className="text-xs text-status-success">
                          +{(data.effectiveness * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-border">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-between"
                    onClick={() => navigate('/career/facilities')}
                  >
                    Manage Facilities
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
          
          {/* Staff Effectiveness */}
          {facilityStatus && facilityStatus.totalEffectiveness > 0 && (
            <Card variant="default" padding="md">
              <CardHeader 
                title="Staff Effectiveness" 
                icon={<Gauge className="w-4 h-4 text-status-info" />}
              />
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-muted">Combined Bonus</span>
                  <span className="font-mono font-bold text-status-success">
                    +{(facilityStatus.totalEffectiveness * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-accent-blue to-status-success"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, facilityStatus.totalEffectiveness * 400)}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted">
                  Staff assigned to R&D facilities boost development speed
                </p>
              </div>
            </Card>
          )}
          
          {/* Team Morale Impact */}
          <Card variant="default" padding="md">
            <CardHeader 
              title="Team Morale" 
              icon={(() => {
                const MoraleIcon = getMoraleIcon(teamMorale)
                return <MoraleIcon className={`w-4 h-4 ${getMoraleColor(teamMorale)}`} />
              })()}
            />
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-muted">Current Morale</span>
                <span className={`font-mono font-bold ${getMoraleColor(teamMorale)}`}>
                  {teamMorale} - {getMoraleLabel(teamMorale)}
                </span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${
                    teamMorale >= 70 ? 'bg-status-success' : 
                    teamMorale >= 40 ? 'bg-status-warning' : 'bg-status-error'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${teamMorale}%` }}
                />
              </div>
              <p className="text-xs text-text-muted">
                {teamMorale >= 70 ? 'High morale: +10% development speed' : 
                 teamMorale >= 40 ? 'Normal morale: No modifier' : 
                 'Low morale: -15% development speed'}
              </p>
            </div>
          </Card>
          
          {/* Budget Status */}
          {budgetStatus && (
            <Card variant={budgetStatus.isCritical ? 'glass' : 'default'} padding="md" 
                  className={budgetStatus.isCritical ? 'border-status-error' : ''}>
              <CardHeader 
                title="R&D Budget" 
                icon={budgetStatus.isLow 
                  ? <AlertTriangle className="w-4 h-4 text-status-warning" />
                  : <DollarSign className="w-4 h-4 text-status-success" />
                }
              />
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-muted">Available Budget</span>
                  <span className={`font-mono font-bold ${
                    budgetStatus.isCritical ? 'text-status-error' : 
                    budgetStatus.isLow ? 'text-status-warning' : 'text-status-success'
                  }`}>
                    {formatBudget(budgetStatus.developmentBudget)}
                  </span>
                </div>
                
                {/* Active Research */}
                {budgetStatus.activeResearchCount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-muted flex items-center gap-1">
                      <FlaskConical className="w-3 h-3" /> Active Research
                    </span>
                    <span className="font-mono text-sm text-accent-blue">
                      {budgetStatus.activeResearchCount} project{budgetStatus.activeResearchCount > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                
                {/* Weekly R&D Allocation Control */}
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-text-muted">Weekly R&D Spend</span>
                    <span className="font-mono font-bold">{formatBudget(budgetStatus.weeklyAllocation)}/wk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDevBudget(Math.max(1000, budgetStatus.weeklyAllocation - 1000))}
                      disabled={budgetStatus.weeklyAllocation <= 1000}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-status-info to-accent-blue"
                        animate={{ width: `${Math.min(100, (budgetStatus.weeklyAllocation / 20000) * 100)}%` }}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDevBudget(Math.min(20000, budgetStatus.weeklyAllocation + 1000))}
                      disabled={budgetStatus.weeklyAllocation >= 20000}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    Higher spend = faster research completion
                  </p>
                </div>
                
                {/* Runway */}
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-sm text-text-muted">Budget Runway</span>
                  <span className={`font-mono font-bold ${
                    budgetStatus.isCritical ? 'text-status-error' : 
                    budgetStatus.isLow ? 'text-status-warning' : 'text-text-primary'
                  }`}>
                    {budgetStatus.weeksRemaining > 100 ? '100+' : budgetStatus.weeksRemaining} weeks
                  </span>
                </div>
                
                {budgetStatus.isLow && (
                  <p className="text-xs text-status-warning">
                    Budget running low. Reduce weekly spend or request more funds.
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

