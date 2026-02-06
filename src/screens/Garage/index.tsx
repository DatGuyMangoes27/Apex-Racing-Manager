import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Car,
  Wrench,
  Users,
  TrendingUp,
  _Flag,
  _DollarSign,
  Building2,
  _Globe,
  Zap,
  _Target,
  _Award,
  _Clock,
  _FileText,
  Heart,
  Brain,
  _Activity,
  CheckCircle2,
  _Palette,
  LucideIcon,
  AlertTriangle,
  _Calendar,
  _CalendarCheck,
  _CalendarX,
  Megaphone,
  Shield,
  TrendingDown,
  _Mic,
  Settings,
  AlertCircle,
  User,
  UserPlus,
  UserMinus,
  Plus,
  X,
  _Star,
  _Search,
  _Filter,
  _Sparkles,
  _ChevronRight,
  _Info,
  BarChart3,
  GraduationCap,
  Dumbbell,
  CloudRain,
  BookOpen,
  ShoppingCart
} from 'lucide-react';
  const tierNum = parseInt(tier) || 5
  if (tierNum <= 2) return 'red'
  if (tierNum <= 4) return 'default'
  return 'outline'
}

// Get category display name and icon
function getCategoryInfo(category: string): { name: string; color: string } {
  const categories: Record<string, { name: string; color: string }> = {
    formula: { name: 'Open Wheel', color: 'text-accent-red' },
    gt: { name: 'GT Racing', color: 'text-accent-orange' },
    prototype: { name: 'Prototype', color: 'text-status-info' },
    touring: { name: 'Touring Car', color: 'text-status-success' },
    stock: { name: 'Stock Car', color: 'text-yellow-500' },
    kart: { name: 'Karting', color: 'text-purple-400' },
    rallycross: { name: 'Rallycross', color: 'text-emerald-400' },
    road: { name: 'Road Car', color: 'text-slate-400' },
    vintage: { name: 'Vintage', color: 'text-amber-600' }
  }
  return categories[category] || { name: category, color: 'text-text-muted' }
}

// Get relationship status
function getRelationshipStatus(value: number): { label: string; color: string } {
  if (value >= 50) return { label: 'Friendly', color: 'text-status-success' }
  if (value >= 20) return { label: 'Positive', color: 'text-accent-orange' }
  if (value >= -20) return { label: 'Neutral', color: 'text-text-muted' }
  if (value >= -50) return { label: 'Tense', color: 'text-status-warning' }
  return { label: 'Hostile', color: 'text-accent-red' }
}

// Format contract type
function _getContractTypeLabel(type: string | undefined): string {
  switch (type) {
    case 'works-program': return 'Works Driver'
    case 'customer-team': return 'Customer Team'
    case 'spec-series-team': return 'Spec Series'
    default: return 'Standard'
  }
}

// Get contract type color
function _getContractTypeColor(type: string | undefined): string {
  switch (type) {
    case 'works-program': return 'bg-accent-red'
    case 'customer-team': return 'bg-accent-orange'
    case 'spec-series-team': return 'bg-status-info'
    default: return 'bg-surface-elevated'
  }
}

// ============================================
// STAFF MANAGEMENT HELPERS
// ============================================

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount}`
}

function getRoleDisplayName(role: TeamStaffRole): string {
  switch (role) {
    case 'chief_engineer': return 'Chief Engineer'
    case 'strategist': return 'Race Strategist'
    case 'team_manager': return 'Team Manager'
    case 'pr_manager': return 'PR Manager'
    case 'technical_director': return 'Technical Director'
    case 'reserve_driver': return 'Reserve Driver'
    case 'crew_chief': return 'Crew Chief'
    case 'data_engineer': return 'Data Engineer'
    default: return role
  }
}

function getRoleIcon(role: TeamStaffRole): LucideIcon {
  switch (role) {
    case 'chief_engineer': return Wrench
    case 'strategist': return Brain
    case 'team_manager': return Building2
    case 'pr_manager': return Megaphone
    case 'technical_director': return Settings
    case 'reserve_driver': return Car
    case 'crew_chief': return Users
    case 'data_engineer': return BarChart3
    default: return User
  }
}

function getSkillColor(value: number): string {
  if (value >= 80) return 'text-status-success'
  if (value >= 60) return 'text-accent-orange'
  if (value >= 40) return 'text-status-info'
  return 'text-text-muted'
}

function getSatisfactionColor(value: number): string {
  if (value >= 70) return 'text-status-success'
  if (value >= 40) return 'text-accent-orange'
  return 'text-status-error'
}

function getTrainingProgramIcon(programId: TrainingProgram) {
  switch (programId) {
    case 'simulator_sessions': return Zap
    case 'fitness_program': return Dumbbell
    case 'wet_weather_training': return CloudRain
    case 'racecraft_coaching': return Shield
    case 'mental_coaching': return Brain
    default: return BookOpen
  }
}

// Driver candidate interface for hiring
interface _DriverCandidate {
  driver: RivalDriver
  suggestedSalary: number
  signingFee: number
}

// ============================================
// ROSTER COMPONENTS
// ============================================

interface OwnerDriverCardProps {
  player: {
    firstName: string
    lastName: string
    nationality?: string
    reputation: number
  }
  car?: TeamCar
}

function OwnerDriverCard({ player, car }: OwnerDriverCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-accent-red/20 to-transparent p-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent-red/30 flex items-center justify-center">
            <User className="w-6 h-6 text-accent-red" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-text-primary">
                {player.firstName} {player.lastName}
              </h3>
              <Badge variant="red">Owner-Driver</Badge>
            </div>
            <p className="text-sm text-text-muted">{player.nationality || 'Unknown'}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-text-muted">Reputation</div>
            <div className="text-2xl font-bold text-accent-red">{player.reputation}</div>
          </div>
        </div>
      </div>
      
      {car && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Car className="w-4 h-4 text-text-muted" />
            <span className="text-sm font-medium text-text-secondary">Car #1</span>
          </div>
          <div className="bg-surface-secondary rounded-lg p-3">
            <p className="font-medium text-text-primary">{car.liveryName || 'No Livery'}</p>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <div className="text-xs text-text-muted">Performance</div>
                <StatBar label="" value={car.performance} maxValue={100} color="red" size="sm" showValue={false} />
              </div>
              <div>
                <div className="text-xs text-text-muted">Reliability</div>
                <StatBar label="" value={car.reliability} maxValue={100} color="green" size="sm" showValue={false} />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!car && (
        <div className="p-4 text-center text-text-muted">
          <Car className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No car assigned</p>
          <p className="text-xs">Enter a series to purchase a car</p>
        </div>
      )}
    </Card>
  )
}

interface HiredDriverCardProps {
  hiredDriver?: TeamDriver
  rivalDriver?: RivalDriver
  car?: TeamCar
  onHire: () => void
  onRelease: () => void
  onViewDetails: () => void
}

function HiredDriverCard({ hiredDriver, rivalDriver, car, onHire, onRelease, onViewDetails }: HiredDriverCardProps) {
  if (!hiredDriver || !rivalDriver) {
    return (
      <Card className="overflow-hidden border-dashed border-2 border-border-subtle bg-surface-secondary/30">
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-tertiary mx-auto mb-4 flex items-center justify-center">
            <UserPlus className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="font-semibold text-text-primary mb-2">Second Driver Slot</h3>
          <p className="text-sm text-text-muted mb-4">
            {car ? 'Hire a driver for Car #2' : 'Purchase a second car first'}
          </p>
          <Button 
            variant={car ? 'primary' : 'outline'} 
            onClick={onHire}
            disabled={!car}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Hire Driver
          </Button>
        </div>
      </Card>
    )
  }
  
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-accent-orange/20 to-transparent p-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent-orange/30 flex items-center justify-center">
            <User className="w-6 h-6 text-accent-orange" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-text-primary">
                {rivalDriver.firstName} {rivalDriver.lastName}
              </h3>
              <Badge variant="default">Hired Driver</Badge>
            </div>
            <p className="text-sm text-text-muted">{rivalDriver.nationality}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-text-muted">Rating</div>
            <div className="text-2xl font-bold text-accent-orange">{Math.round((rivalDriver.stats.raceSkill + rivalDriver.stats.qualifyingSkill + rivalDriver.stats.consistency) / 3 * 100)}</div>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Contract Info */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-secondary rounded p-2 text-center">
            <div className="text-xs text-text-muted">Salary/Race</div>
            <div className="font-semibold text-text-primary">{formatCurrency(hiredDriver.contract.salary)}</div>
          </div>
          <div className="bg-surface-secondary rounded p-2 text-center">
            <div className="text-xs text-text-muted">Contract</div>
            <div className="font-semibold text-text-primary">
              {hiredDriver.contract.startYear}-{hiredDriver.contract.endYear}
            </div>
          </div>
          <div className="bg-surface-secondary rounded p-2 text-center">
            <div className="text-xs text-text-muted">Satisfaction</div>
            <div className={`font-semibold ${getSatisfactionColor(hiredDriver.contract.satisfaction)}`}>
              {hiredDriver.contract.satisfaction}%
            </div>
          </div>
        </div>
        
        {/* Season Stats */}
        {hiredDriver.seasonStats && (
          <div>
            <h4 className="text-xs font-medium text-text-muted mb-2">Season Stats</h4>
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              <div>
                <div className="font-bold text-text-primary">{hiredDriver.seasonStats.races}</div>
                <div className="text-xs text-text-muted">Races</div>
              </div>
              <div>
                <div className="font-bold text-status-success">{hiredDriver.seasonStats.wins}</div>
                <div className="text-xs text-text-muted">Wins</div>
              </div>
              <div>
                <div className="font-bold text-accent-orange">{hiredDriver.seasonStats.podiums}</div>
                <div className="text-xs text-text-muted">Podiums</div>
              </div>
              <div>
                <div className="font-bold text-accent-red">{hiredDriver.seasonStats.points}</div>
                <div className="text-xs text-text-muted">Points</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Car Info */}
        {car && (
          <div className="bg-surface-secondary rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Car className="w-4 h-4 text-text-muted" />
              <span className="text-sm font-medium text-text-secondary">Car #2</span>
            </div>
            <p className="font-medium text-text-primary text-sm">{car.liveryName || 'No Livery'}</p>
          </div>
        )}
        
        {/* Development Summary */}
        <div className="bg-surface-secondary rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-accent-orange" />
              <span className="text-sm font-medium text-text-secondary">Development</span>
            </div>
            <Badge variant="default" className="bg-accent-orange/20 text-accent-orange text-xs">
              Lv {hiredDriver.development?.experienceLevel || 1}
            </Badge>
          </div>
          {hiredDriver.development?.trainingProgram && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent-orange transition-all"
                  style={{ width: `${hiredDriver.development.trainingProgress || 0}%` }}
                />
              </div>
              <span className="text-xs text-text-muted">Training</span>
            </div>
          )}
          {!hiredDriver.development?.trainingProgram && (
            <p className="text-xs text-text-muted mt-1">No active training</p>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="primary" size="sm" className="flex-1" onClick={onViewDetails}>
            <GraduationCap className="w-4 h-4 mr-1" />
            Development
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-status-error border-status-error hover:bg-status-error/10"
            onClick={onRelease}
          >
            <UserMinus className="w-4 h-4 mr-1" />
            Release
          </Button>
        </div>
      </div>
    </Card>
  )
}

interface DriverDevelopmentPanelProps {
  hiredDriver: TeamDriver
  rivalDriver: RivalDriver
  onStartTraining: (programId: string) => void
  onCancelTraining: () => void
  teamCash: number
}

function DriverDevelopmentPanel({ 
  hiredDriver, 
  _rivalDriver, 
  onStartTraining, 
  onCancelTraining,
  teamCash 
}: DriverDevelopmentPanelProps) {
  const dev = hiredDriver.development
  const currentProgram = dev?.trainingProgram ? TRAINING_PROGRAMS[dev.trainingProgram as TrainingProgram] : null
  const levelProgress = dev ? calculateLevelProgress(dev.experiencePoints) : 0
  
  return (
    <div className="space-y-4">
      {/* XP and Level */}
      <div className="bg-surface-secondary rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-accent-orange" />
            <span className="font-semibold text-text-primary">Development Level</span>
          </div>
          <Badge variant="default" className="bg-accent-orange/20 text-accent-orange">
            Level {dev?.experienceLevel || 1}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Experience Points</span>
            <span className="text-text-primary font-mono">{dev?.experiencePoints || 0} XP</span>
          </div>
          <div className="w-full h-2 bg-surface-tertiary rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-orange transition-all duration-300"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <div className="text-xs text-text-muted text-right">
            {levelProgress.toFixed(0)}% to next level
          </div>
        </div>
        
        {/* Recent XP */}
        {dev?.recentRaceXP && dev.recentRaceXP.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border-subtle">
            <div className="text-xs text-text-muted mb-1">Recent Race XP</div>
            <div className="flex gap-1">
              {dev.recentRaceXP.map((xp, i) => (
                <div 
                  key={i}
                  className={`flex-1 text-center py-1 rounded text-xs font-mono ${
                    xp >= 30 ? 'bg-status-success/20 text-status-success' :
                    xp >= 15 ? 'bg-accent-orange/20 text-accent-orange' :
                    'bg-surface-tertiary text-text-muted'
                  }`}
                >
                  +{xp}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Skill Boosts from Training */}
      {dev?.skillBoosts && Object.keys(dev.skillBoosts).length > 0 && (
        <div className="bg-surface-secondary rounded-lg p-4">
          <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-status-success" />
            Training Boosts
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(dev.skillBoosts).map(([skill, boost]) => (
              <div key={skill} className="flex justify-between text-sm">
                <span className="text-text-muted capitalize">{skill.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="text-status-success font-mono">+{((boost as number) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Current Training */}
      {currentProgram && (
        <div className="bg-accent-orange/10 border border-accent-orange/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = getTrainingProgramIcon(currentProgram.id)
                return <Icon className="w-5 h-5 text-accent-orange" />
              })()}
              <span className="font-semibold text-text-primary">{currentProgram.name}</span>
            </div>
            <Badge variant="default" className="bg-accent-orange text-white">In Progress</Badge>
          </div>
          
          <div className="space-y-2">
            <div className="w-full h-2 bg-surface-tertiary rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent-orange transition-all duration-300"
                style={{ width: `${dev?.trainingProgress || 0}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{(dev?.trainingProgress || 0).toFixed(0)}% complete</span>
              <span className="text-text-muted">{formatCurrency(currentProgram.weeklyCost)}/week</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3 w-full"
            onClick={onCancelTraining}
          >
            <X className="w-4 h-4 mr-1" />
            Cancel Training
          </Button>
        </div>
      )}
      
      {/* Available Training Programs */}
      {!currentProgram && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-text-secondary" />
            Training Programs
          </h4>
          {Object.values(TRAINING_PROGRAMS).map(program => {
            const Icon = getTrainingProgramIcon(program.id)
            const _totalCost = calculateProgramTotalCost(program)
            const canAfford = teamCash >= program.weeklyCost
            
            return (
              <div 
                key={program.id}
                className={`bg-surface-secondary rounded-lg p-3 border ${
                  canAfford ? 'border-border-subtle hover:border-accent-orange/50' : 'border-border-subtle opacity-60'
                } transition-colors`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-tertiary flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-text-primary">{program.name}</h5>
                      <span className="text-xs text-text-muted">{program.durationWeeks} weeks</span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{program.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs">
                        <span className="text-status-success">+{(program.primaryBonus * 100).toFixed(0)}% </span>
                        <span className="text-text-muted capitalize">{program.primarySkill.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                      <span className="text-xs text-text-muted">{formatCurrency(program.weeklyCost)}/wk</span>
                    </div>
                  </div>
                  <Button
                    variant={canAfford ? 'primary' : 'outline'}
                    size="sm"
                    disabled={!canAfford}
                    onClick={() => onStartTraining(program.id)}
                  >
                    Start
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================
// CAR CLASS IMAGE COMPONENT
// ============================================
interface CarClassImageProps {
  classId: string
  className: string
  fallbackIcon: LucideIcon
}

function _CarClassImage({ classId, className, fallbackIcon: FallbackIcon }: CarClassImageProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasError, setHasError] = useState(false)
  
  // Get images from manifest
  const images = getClassLiveriesFromManifest(classId)
  const folder = getCarClassFolder(classId)
  
  // Debug logging
  console.log('[CarClassImage] classId:', classId, 'folder:', folder, 'images count:', images.length)
  
  // Cycle through images every 5 seconds
  useEffect(() => {
    if (images.length <= 1) return
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [images.length])
  
  if (hasError || images.length === 0 || !folder) {
    return (
      <div className="aspect-video bg-background rounded-xl mb-6 flex items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-red/10 to-accent-orange/10 flex items-center justify-center">
          <div className="text-center z-10">
            <FallbackIcon className="w-24 h-24 mx-auto text-text-muted mb-4" />
            <p className="text-text-muted font-display font-semibold">{className}</p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="aspect-video bg-background rounded-xl mb-6 flex items-center justify-center overflow-hidden relative group">
      <img 
        src={images[currentIndex]}
        alt={className}
        className="w-full h-full object-contain transition-opacity duration-500"
        onError={(_e) => {
          // Try next image or show fallback
          if (currentIndex < images.length - 1) {
            setCurrentIndex(prev => prev + 1)
          } else {
            setHasError(true)
          }
        }}
      />
      
      {/* Image counter if multiple images */}
      {images.length > 1 && (
        <div className="absolute bottom-4 right-4 px-3 py-1 bg-background/80 rounded-full text-xs text-text-muted">
          {currentIndex + 1} / {images.length}
        </div>
      )}
      
      {/* Navigation arrows for multiple images */}
      {images.length > 1 && (
        <>
          <button 
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setCurrentIndex(prev => (prev - 1 + images.length) % images.length)}
          >
            ←
          </button>
          <button 
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setCurrentIndex(prev => (prev + 1) % images.length)}
          >
            →
          </button>
        </>
      )}
    </div>
  )
}

// Helper to calculate performance penalty from wear
function calculatePerformancePenalty(partWear: CarPartWear): number {
  // Each part contributes to performance penalty when worn
  // Engine: affects power (40% weight)
  // Chassis: affects handling (20% weight)
  // Gearbox: affects acceleration (15% weight)
  // Brakes: affects stopping (15% weight)
  // Suspension: affects grip (10% weight)
  const weights = {
    engine: 0.40,
    chassis: 0.20,
    gearbox: 0.15,
    brakes: 0.15,
    suspension: 0.10
  }
  
  let penalty = 0
  for (const [part, weight] of Object.entries(weights)) {
    const wear = partWear[part as keyof CarPartWear] || 0
    // Penalty starts at 50% wear and increases exponentially
    if (wear > 50) {
      const excessWear = wear - 50
      penalty += (excessWear / 50) * weight * 10 // Max 10% penalty per part at 100% wear
    }
  }
  
  return Math.round(penalty * 10) / 10 // Round to 1 decimal
}

// Get wear status color
function getWearStatusColor(wear: number): string {
  if (wear >= 90) return 'text-status-error'
  if (wear >= 70) return 'text-status-warning'
  if (wear >= 50) return 'text-accent-orange'
  return 'text-status-success'
}

// Get wear status badge variant
function _getWearBadgeVariant(wear: number): 'green' | 'default' | 'red' {
  if (wear >= 90) return 'red'
  if (wear >= 50) return 'default'
  return 'green'
}

export function Garage() {
  const { 
    player, 
    careerState, 
    getAIModifier, 
    serviceCar,
    serviceCarGranular, 
    getManufacturerDiscount,
    getHiredDriver,
    signHiredDriver,
    releaseHiredDriver,
    getStaffByRole,
    releaseStaff,
    _hasSecondCarSlot,
    _addTransaction,
    // Driver training
    startDriverTraining,
    cancelDriverTraining,
    consumeHoursFromBudget,
    addPersonalCalendarEntry
  } = useCareerStore()
  const { series, teams, rivals } = useRivalStore()
  const { addToast } = useToast()
  const navigate = useNavigate()
  
  // Service modal state
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [selectedCar, setSelectedCar] = useState<TeamCar | null>(null)
  const [selectedServiceType, setSelectedServiceType] = useState<'full' | 'partial' | 'replacement'>('full')
  const [selectedPartToReplace, setSelectedPartToReplace] = useState<keyof CarPartWear | null>(null)
  
  // Granular service state
  const [partServiceSelections, setPartServiceSelections] = useState<Record<keyof CarPartWear, ServiceLevel | null>>({
    engine: null,
    chassis: null,
    gearbox: null,
    brakes: null,
    suspension: null
  })
  
  // Service all cars state
  const [showServiceAllModal, setShowServiceAllModal] = useState(false)
  
  // Staff management state
  const [showHireDriverModal, setShowHireDriverModal] = useState(false)
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false)
  const [releaseTarget, setReleaseTarget] = useState<{ type: 'staff' | 'driver', id: string, name: string } | null>(null)
  
  // Staff management - navigates to Staff Market for hiring
  
  // Roster/Driver management state
  const [showDevelopmentModal, setShowDevelopmentModal] = useState(false)
  const [selectedDriverForDev, setSelectedDriverForDev] = useState<string | null>(null)
  
  // Calculate service costs for the selected car
  const _serviceCosts = useMemo(() => {
    if (!selectedCar) return null
    
    // Get manufacturer from chassisId or seriesId
    const carClass = selectedCar.seriesId ? AMS2_CAR_CLASSES.find(c => c.id === selectedCar.seriesId) : null
    const manufacturerId = carClass ? getManufacturerForCarClass(carClass.id)?.id || '' : ''
    const manufacturer = manufacturerId ? getManufacturer(manufacturerId) : undefined
    const discount = manufacturerId ? getManufacturerDiscount(manufacturerId) : { partsDiscount: 0, serviceDiscount: 0 }
    const discountMultiplier = 1 - (discount.partsDiscount || 0)
    
    // Full service: 5% of purchase price
    const fullServiceCost = Math.round(Math.max(1000, selectedCar.purchasePrice * 0.05))
    
    // Partial service: 2% of purchase price
    const partialServiceCost = Math.round(Math.max(1000, selectedCar.purchasePrice * 0.02))
    
    // Part replacement costs
    const partCosts: Record<keyof CarPartWear, number> = {
      engine: 0,
      chassis: 0,
      gearbox: 0,
      brakes: 0,
      suspension: 0
    }
    
    const parts: (keyof CarPartWear)[] = ['engine', 'chassis', 'gearbox', 'brakes', 'suspension']
    for (const part of parts) {
      let baseCost: number
      if (manufacturer?.partsCosts) {
        baseCost = manufacturer.partsCosts[part] || selectedCar.purchasePrice * 0.15
      } else {
        const fallbackMultipliers: Record<keyof CarPartWear, number> = {
          engine: 0.20,
          chassis: 0.15,
          gearbox: 0.12,
          brakes: 0.05,
          suspension: 0.08
        }
        baseCost = selectedCar.purchasePrice * fallbackMultipliers[part]
      }
      partCosts[part] = Math.round(baseCost * discountMultiplier)
    }
    
    return {
      fullService: fullServiceCost,
      partialService: partialServiceCost,
      replacement: partCosts,
      discount: discount.partsDiscount
    }
  }, [selectedCar, getManufacturerDiscount])
  
  // Calculate granular service cost
  const granularServiceCost = useMemo(() => {
    if (!selectedCar || !careerState?.ownedTeam) return 0
    
    const tier = careerState.ownedTeam.tier || 'amateur'
    const tierMultipliers: Record<string, number> = {
      entry: 0.5,
      amateur: 0.75,
      semi_pro: 1.0,
      professional: 1.5,
      elite: 2.5,
      pinnacle: 5.0
    }
    const tierMultiplier = tierMultipliers[tier] || 1.0
    
    let total = 0
    const parts: (keyof CarPartWear)[] = ['engine', 'chassis', 'gearbox', 'brakes', 'suspension']
    for (const part of parts) {
      const level = partServiceSelections[part]
      if (level) {
        const baseCost = PART_BASE_COSTS[part]
        const levelConfig = SERVICE_LEVEL_CONFIG[level]
        total += Math.round(baseCost * levelConfig.costMultiplier * tierMultiplier)
      }
    }
    return total
  }, [selectedCar, partServiceSelections, careerState?.ownedTeam?.tier])

  // Handle granular service action
  const handleGranularService = () => {
    if (!selectedCar) return
    
    const selections: PartServiceSelection[] = []
    const parts: (keyof CarPartWear)[] = ['engine', 'chassis', 'gearbox', 'brakes', 'suspension']
    for (const part of parts) {
      const level = partServiceSelections[part]
      if (level) {
        selections.push({ part, level })
      }
    }
    
    if (selections.length === 0) {
      addToast({
        type: 'error',
        title: 'No Parts Selected',
        message: 'Please select at least one part to service.',
        duration: 3000
      })
      return
    }
    
    const result = serviceCarGranular(selectedCar.carId, selections)
    
    if (result) {
      // === TIME BUDGET + CALENDAR + NOTIFICATION INTEGRATION ===
      const serviceTimeCost = getActivityTimeCost('facility_inspection')
      if (serviceTimeCost.hours > 0) {
        consumeHoursFromBudget(serviceTimeCost.hours, serviceTimeCost.drain, `Car Service: ${selections.length} part(s)`, 'facility_inspection')
      }
      addPersonalCalendarEntry({
        name: 'Car Service',
        description: `Serviced ${selections.length} part(s) for $${result.cost.toLocaleString()}`,
        activityId: 'facility_inspection',
        week: careerState!.currentWeek,
        day: careerState!.currentDay ?? 1,
        duration: serviceTimeCost.hours,
        drainLevel: serviceTimeCost.drain,
        calendarEntryType: 'team',
        category: 'maintenance',
        immediate: true
      })
      routeNotification({
        category: 'technical',
        subject: 'Car Service Complete',
        body: `Car service completed: ${selections.length} part(s) serviced for $${result.cost.toLocaleString()}.`,
      })

      addToast({
        type: 'success',
        title: 'Service Complete',
        message: `Serviced ${selections.length} part(s) for $${result.cost.toLocaleString()}`,
        duration: 4000
      })
      setShowServiceModal(false)
      setSelectedCar(null)
      // Reset selections
      setPartServiceSelections({
        engine: null,
        chassis: null,
        gearbox: null,
        brakes: null,
        suspension: null
      })
    } else {
      addToast({
        type: 'error',
        title: 'Service Failed',
        message: 'Insufficient funds for this service.',
        duration: 3000
      })
    }
  }

  // Handle service action (legacy - kept for backward compatibility)
  const _handleService = () => {
    if (!selectedCar) return
    
    if (selectedServiceType === 'replacement' && !selectedPartToReplace) {
      addToast({
        type: 'error',
        title: 'Select Part',
        message: 'Please select a part to replace.',
        duration: 3000
      })
      return
    }
    
    let result
    if (selectedServiceType === 'replacement' && selectedPartToReplace) {
      // Use serviceCarGranular for part replacement
      result = serviceCarGranular(selectedCar.carId, [{
        part: selectedPartToReplace,
        level: 'replacement' as ServiceLevel
      }])
    } else {
      // Use serviceCar for full or partial service
      result = serviceCar(selectedCar.carId, selectedServiceType as 'full' | 'partial')
    }
    
    if (result) {
      // === TIME BUDGET + CALENDAR + NOTIFICATION INTEGRATION ===
      const serviceTimeCost = getActivityTimeCost('facility_inspection')
      if (serviceTimeCost.hours > 0) {
        consumeHoursFromBudget(serviceTimeCost.hours, serviceTimeCost.drain, `Car ${selectedServiceType} Service`, 'facility_inspection')
      }
      addPersonalCalendarEntry({
        name: `Car ${selectedServiceType} Service`,
        description: `${selectedServiceType === 'replacement' ? `${selectedPartToReplace} replaced` : `${selectedServiceType} service completed`} for $${result.cost.toLocaleString()}`,
        activityId: 'facility_inspection',
        week: careerState!.currentWeek,
        day: careerState!.currentDay ?? 1,
        duration: serviceTimeCost.hours,
        drainLevel: serviceTimeCost.drain,
        calendarEntryType: 'team',
        category: 'maintenance',
        immediate: true
      })
      routeNotification({
        category: 'technical',
        subject: 'Car Service Complete',
        body: `${selectedServiceType === 'replacement' ? `${selectedPartToReplace} replaced` : `${selectedServiceType} service completed`} for $${result.cost.toLocaleString()}.`,
      })

      addToast({
        type: 'success',
        title: 'Service Complete',
        message: `${selectedServiceType === 'replacement' ? `${selectedPartToReplace} replaced` : `${selectedServiceType} service completed`} for $${result.cost.toLocaleString()}`,
        duration: 4000
      })
      setShowServiceModal(false)
      setSelectedCar(null)
      setSelectedPartToReplace(null)
    } else {
      addToast({
        type: 'error',
        title: 'Service Failed',
        message: 'Insufficient funds or car not found.',
        duration: 3000
      })
    }
  }
  
  // Open service modal for a car
  const openServiceModal = (car: TeamCar) => {
    setSelectedCar(car)
    setSelectedServiceType('full')
    setSelectedPartToReplace(null)
    setShowServiceModal(true)
  }

  if (!player) return null

  // Defensive: ensure arrays are actually arrays (handles corrupted localStorage)
  const teamsArray = Array.isArray(teams) ? teams : []
  const seriesArray = Array.isArray(series) ? series : []

  const currentSeries = seriesArray.find(s => s.id === player.currentSeriesId)
  const currentTeam = teamsArray.find(t => t.id === player.currentTeamId)
  
  // Get car class info from AMS2 data
  const carClass = currentSeries 
    ? AMS2_CAR_CLASSES.find(c => c.id === currentSeries.carClassId)
    : null
  
  // Get teammates (other drivers on the same team)
  const _teammates = currentTeam 
    ? rivals.filter(r => currentTeam.drivers.includes(r.id))
    : []
  
  // Pre-calculate team stats with safe fallbacks
  const _teamPrestige = currentTeam?.prestige ?? 0
  const _facilitiesValue = getFacilitiesValue(currentTeam?.facilities)
  const _budgetDisplay = getBudgetDisplay(currentTeam?.budget)
  
  // Get AI modifier for development tab
  const _aiModifier = careerState ? getAIModifier() : null
  const _rpgState = careerState?.rpgState
  
  // Get category info
  const _categoryInfo = carClass ? getCategoryInfo(carClass.category) : null
  
  // ============================================
  // ROSTER DATA
  // ============================================
  const ownedTeam = careerState?.ownedTeam
  const rosterDrivers = ownedTeam?.drivers || []
  const rosterBudget = ownedTeam?.budgets?.cash || 0
  const cars = careerState?.cars || []
  
  // Get hired driver data
  const hiredDriver = rosterDrivers.find(d => d.driverId !== player?.id)
  const hiredDriverRival = hiredDriver ? rivals.find(r => r.id === hiredDriver.driverId) : null
  
  // Get cars by driver assignment
  const ownerCar = cars.find(c => c.driverType === 'owner')
  const secondCar = cars.find(c => c.driverType === 'hired' || c.driverType === 'unassigned')
  
  // Get selected driver for development modal
  const devModalDriver = selectedDriverForDev 
    ? rosterDrivers.find(d => d.driverId === selectedDriverForDev)
    : null
  const devModalRival = devModalDriver 
    ? rivals.find(r => r.id === devModalDriver.driverId)
    : null
  
  // ============================================
  // ROSTER HANDLERS
  // ============================================
  
  // Handle opening development modal
  const handleOpenDevelopment = (driverId: string) => {
    setSelectedDriverForDev(driverId)
    setShowDevelopmentModal(true)
  }
  
  // Handle starting training
  const handleStartTraining = (driverId: string, programId: string) => {
    const result = startDriverTraining(driverId, programId)
    
    if (result.success) {
      const program = TRAINING_PROGRAMS[programId as TrainingProgram]
      addToast({
        type: 'success',
        title: 'Training Started',
        message: `Started ${program?.name || programId} program.`,
        duration: 3000
      })
    } else {
      addToast({
        type: 'error',
        title: 'Training Failed',
        message: result.error || 'Could not start training program.',
        duration: 3000
      })
    }
  }
  
  // Handle cancelling training
  const handleCancelTraining = (driverId: string) => {
    cancelDriverTraining(driverId)
    addToast({
      type: 'info',
      title: 'Training Cancelled',
      message: 'The training program has been cancelled.',
      duration: 3000
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Garage"
        subtitle={currentTeam ? currentTeam.name : 'No team assigned'}
        icon={<Car className="w-6 h-6" />}
      />

      <Tabs defaultValue="staff">
        <TabsList className="mb-6">
          <TabsTrigger value="staff">Staff & Drivers</TabsTrigger>
          <TabsTrigger value="fleet">Team Fleet</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
        </TabsList>

        {/* ============================================ */}
        {/* TAB: DEVELOPMENT */}
        {/* ============================================ */}
        <TabsContent value="development">
          <DevelopmentDashboard />
        </TabsContent>

        {/* ============================================ */}
        {/* TAB: STAFF & DRIVERS */}
        {/* ============================================ */}
        <TabsContent value="staff">
          <div className="space-y-8">
              {/* SECTION A: DRIVERS */}
              <div>
                <h2 className="text-xl font-display font-bold flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-accent-cyan" />
                  Drivers
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Owner-Driver (You) */}
                  <OwnerDriverCard 
                    player={{
                      firstName: player?.firstName || 'Unknown',
                      lastName: player?.lastName || 'Driver',
                      nationality: player?.nationality,
                      reputation: player?.reputation || 50
                    }}
                    car={ownerCar}
                  />
                  
                  {/* Second Driver Slot */}
                  <HiredDriverCard 
                    hiredDriver={hiredDriver}
                    rivalDriver={hiredDriverRival || undefined}
                    car={secondCar}
                    onHire={() => setShowHireDriverModal(true)}
                    onRelease={() => {
                      if (hiredDriver && hiredDriverRival) {
                        setReleaseTarget({ 
                          type: 'driver', 
                          id: hiredDriver.driverId, 
                          name: `${hiredDriverRival.firstName} ${hiredDriverRival.lastName}` 
                        })
                        setShowReleaseConfirm(true)
                      }
                    }}
                    onViewDetails={() => {
                      if (hiredDriver) {
                        handleOpenDevelopment(hiredDriver.driverId)
                      }
                    }}
                  />
                </div>
              </div>
              
              {/* SECTION B: TEAM STAFF */}
              <div>
                <h2 className="text-xl font-display font-bold flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-accent-purple" />
                  Team Staff
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Staff cards for each role - now includes crew_chief and data_engineer */}
                  {(['chief_engineer', 'technical_director', 'strategist', 'team_manager', 'pr_manager', 'crew_chief', 'data_engineer'] as TeamStaffRole[]).map(role => {
                    const staff = getStaffByRole(role)
                    const _RoleIcon = getRoleIcon(role)
                    
                    if (staff) {
                      // Get specialization display info
                      const staffSpecializations = staff.specializations || []
                      const hasSpecializations = staffSpecializations.length > 0
                      
                      return (
                        <Card key={role} className="p-5">
                          <div className="flex items-start gap-3">
                            <StaffPortrait
                              src={
                                staff.portraitId 
                                  ? (getPortraitByManifestId(staff.portraitId) || getFallbackPortrait(staff.gender || 'male'))
                                  : (getStaffPortrait(staff.id) || getRandomStaffPortraitByRole(role))
                              }
                              name={staff.name}
                              role={getRoleDisplayName(role)}
                              size="lg"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-text-muted mb-1">{getRoleDisplayName(role)}</p>
                              <h3 className="font-display font-semibold truncate">{staff.name}</h3>
                              {staff.nationality && (
                                <p className="text-xs text-text-muted">{staff.nationality}</p>
                              )}
                              
                              {/* Specializations */}
                              {hasSpecializations && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {staffSpecializations.map(specId => {
                                    const specInfo = getSpecializationDisplay(specId)
                                    return (
                                      <Badge 
                                        key={specId}
                                        variant={specInfo.rarity === 'rare' ? 'red' : specInfo.rarity === 'uncommon' ? 'default' : 'green'}
                                        className="text-[10px] px-1.5 py-0.5"
                                      >
                                        {specInfo.name}
                                      </Badge>
                                    )
                                  })}
                                </div>
                              )}
                              
                              {/* Skills */}
                              <div className="grid grid-cols-3 gap-2 mt-3">
                                <div className="text-center p-2 rounded bg-background/50">
                                  <p className="text-[10px] text-text-muted">Rel</p>
                                  <span className={`text-sm font-mono font-bold ${getSkillColor(staff.skills?.reliability || 50)}`}>
                                    {staff.skills?.reliability || 50}
                                  </span>
                                </div>
                                <div className="text-center p-2 rounded bg-background/50">
                                  <p className="text-[10px] text-text-muted">Str</p>
                                  <span className={`text-sm font-mono font-bold ${getSkillColor(staff.skills?.strategy || 50)}`}>
                                    {staff.skills?.strategy || 50}
                                  </span>
                                </div>
                                <div className="text-center p-2 rounded bg-background/50">
                                  <p className="text-[10px] text-text-muted">Pit</p>
                                  <span className={`text-sm font-mono font-bold ${getSkillColor(staff.skills?.pit || 50)}`}>
                                    {staff.skills?.pit || 50}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Bio preview - show personality note if available */}
                              {staff.bio?.personalityNote && (
                                <p className="text-xs text-text-muted mt-2 italic line-clamp-2">
                                  "{staff.bio.personalityNote}"
                                </p>
                              )}
                              
                              {/* Career highlight preview */}
                              {staff.bio?.workHistory && staff.bio.workHistory.length > 0 && (
                                <div className="mt-2 text-xs text-text-muted">
                                  <span className="text-accent-purple">Previously:</span>{' '}
                                  {staff.bio.workHistory[staff.bio.workHistory.length - 1]?.team}
                                </div>
                              )}
                              
                              {/* Contract info */}
                              {staff.contract && (
                                <div className="mt-3 pt-3 border-t border-surface-border flex items-center justify-between text-sm">
                                  <span className="text-text-muted">{formatCurrency(staff.contract.salary)}/mo</span>
                                  <span className="text-text-muted">Until {staff.contract.endYear}</span>
                                </div>
                              )}
                              
                              {/* Morale indicator */}
                              {staff.morale !== undefined && (
                                <div className="mt-2 flex items-center gap-2">
                                  <Heart className={`w-3 h-3 ${getSatisfactionColor(staff.morale)}`} />
                                  <span className={`text-xs ${getSatisfactionColor(staff.morale)}`}>
                                    {staff.morale >= 70 ? 'Happy' : staff.morale >= 40 ? 'Content' : 'Unhappy'}
                                  </span>
                                </div>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full mt-3 text-status-error hover:bg-status-error/10"
                                onClick={() => {
                                  setReleaseTarget({ type: 'staff', id: staff.id, name: staff.name })
                                  setShowReleaseConfirm(true)
                                }}
                              >
                                <UserMinus className="w-3 h-3 mr-1" />
                                Release
                              </Button>
                            </div>
                          </div>
                        </Card>
                      )
                    }
                    
                    // Empty slot - navigate to Job Market
                    return (
                      <Card 
                        key={role} 
                        className="p-5 border-2 border-dashed border-surface-border hover:border-accent-purple/50 transition-colors cursor-pointer"
                        onClick={() => navigate('/staff-market')}
                      >
                        <div className="flex flex-col items-center justify-center text-center min-h-[180px]">
                          <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center mb-2">
                            <Plus className="w-5 h-5 text-text-muted" />
                          </div>
                          <p className="text-sm font-medium">{getRoleDisplayName(role)}</p>
                          <p className="text-xs text-text-muted mt-1">Browse Job Market</p>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
              
              {/* SECTION C: CAR ASSIGNMENTS */}
              {careerState?.cars && careerState.cars.length > 0 && (
                <div>
                  <h2 className="text-xl font-display font-bold flex items-center gap-2 mb-4">
                    <Car className="w-5 h-5 text-accent-orange" />
                    Car Assignments
                  </h2>
                  
                  <Card className="p-6">
                    <div className="space-y-4">
                      {careerState.cars.map((car, index) => {
                        const hiredDriver = getHiredDriver()
                        const hiredDriverRival = hiredDriver ? rivals.find(r => r.id === hiredDriver.driverId) : null
                        const assignedTo = index === 0 ? 'Owner (You)' : 
                                          (hiredDriverRival ? `${hiredDriverRival.firstName} ${hiredDriverRival.lastName}` : 'Unassigned')
                        const seriesMeta = series.find(s => s.id === car.seriesId)
                        
                        return (
                          <div 
                            key={car.carId} 
                            className="flex items-center justify-between p-4 rounded-xl bg-background/50"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                index === 0 ? 'bg-accent-cyan/20' : 'bg-accent-purple/20'
                              }`}>
                                <Car className={`w-5 h-5 ${
                                  index === 0 ? 'text-accent-cyan' : 'text-accent-purple'
                                }`} />
                              </div>
                              <div>
                                <h4 className="font-display font-semibold">
                                  {car.liveryName || car.chassisId}
                                </h4>
                                <div className="flex items-center gap-2 text-sm text-text-muted">
                                  <span>{(() => {
                                    const carClass = car.seriesId ? AMS2_CAR_CLASSES.find(c => c.id === car.seriesId) : null
                                    const mfg = carClass ? getManufacturerForCarClass(carClass.id) : null
                                    return mfg ? mfg.name : 'Unknown'
                                  })()}</span>
                                  {seriesMeta && (
                                    <>
                                      <span>•</span>
                                      <span>{seriesMeta.name}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm font-medium">{assignedTo}</p>
                                <p className="text-xs text-text-muted">
                                  {index === 0 ? 'Primary Car' : 'Second Car'}
                                </p>
                              </div>
                              
                              <Badge 
                                variant={index === 0 ? 'green' : (hiredDriver ? 'default' : 'outline')}
                              >
                                {index === 0 ? 'You' : (hiredDriver ? 'Assigned' : 'Available')}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                </div>
              )}
            </div>
        </TabsContent>

        {/* ============================================ */}
        {/* TAB: TEAM FLEET (Owner cars) */}
        {/* ============================================ */}
        <TabsContent value="fleet">
          {(careerState?.cars?.length ?? 0) > 0 ? (
            <div className="space-y-4">
              {/* Service All Cars Header */}
              <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-xl">
                <div>
                  <h3 className="font-display font-semibold">Team Fleet</h3>
                  <p className="text-sm text-text-muted">
                    {careerState?.cars?.length} car(s) • 
                    {careerState?.cars?.filter(c => c.partWear && Object.values(c.partWear).some(w => w >= 70)).length || 0} need attention
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setShowServiceAllModal(true)}
                  className="flex items-center gap-2"
                >
                  <Wrench className="w-4 h-4" />
                  Service All Cars
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {careerState?.cars?.map(car => {
                const seriesMeta = seriesArray.find(s => s.id === car.seriesId)
                const performancePenalty = car.partWear ? calculatePerformancePenalty(car.partWear) : 0
                const avgWear = car.partWear 
                  ? Math.round(Object.values(car.partWear).reduce((sum, v) => sum + v, 0) / 5)
                  : 0
                const hasCriticalWear = car.partWear && Object.values(car.partWear).some(w => w >= 90)
                
                return (
                  <Card 
                    key={car.carId} 
                    variant="glass" 
                    padding="md" 
                    className={`space-y-3 ${hasCriticalWear ? 'border-2 border-status-error' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wide">Car</p>
                        <h3 className="font-display font-semibold text-lg break-words">
                          {car.liveryName || 'Unassigned Livery'}
                        </h3>
                        {seriesMeta && (
                          <p className="text-text-muted text-sm">{seriesMeta.name}</p>
                        )}
                        {/* Driver Assignment */}
                        <div className="flex items-center gap-2 mt-1">
                          <User className={`w-3 h-3 ${
                            car.driverType === 'owner' ? 'text-accent-red' : 
                            car.driverType === 'hired' ? 'text-status-success' : 'text-text-muted'
                          }`} />
                          <span className={`text-sm ${
                            car.driverType === 'owner' ? 'text-accent-red font-medium' : 
                            car.driverType === 'hired' ? 'text-text-secondary' : 'text-text-muted'
                          }`}>
                            {car.driverType === 'owner' ? `${player?.firstName} ${player?.lastName}` :
                             car.driverType === 'hired' ? (() => {
                               const hd = careerState?.ownedTeam?.drivers?.find(d => d.carAssignment === car.carId)
                               if (hd) {
                                 const rival = rivals.find(r => r.id === hd.driverId)
                                 return rival ? `${rival.firstName} ${rival.lastName}` : 'Hired Driver'
                               }
                               return 'Hired Driver'
                             })() : 'No Driver Assigned'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {car.driverType === 'owner' && (
                          <Badge variant="default" className="bg-accent-red/20 text-accent-red text-xs">
                            Owner
                          </Badge>
                        )}
                        {car.driverType === 'hired' && (
                          <Badge variant="default" className="bg-status-success/20 text-status-success text-xs">
                            Hired
                          </Badge>
                        )}
                        {car.driverType === 'unassigned' && (
                          <Badge variant="outline" className="text-text-muted text-xs">
                            Vacant
                          </Badge>
                        )}
                        {hasCriticalWear && (
                          <Badge variant="red" className="animate-pulse">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Service Required
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Performance Penalty Display */}
                    {performancePenalty > 0 && (
                      <div className={`p-3 rounded-lg ${
                        performancePenalty >= 5 ? 'bg-status-error/10 border border-status-error/30' :
                        performancePenalty >= 2 ? 'bg-status-warning/10 border border-status-warning/30' :
                        'bg-accent-orange/10 border border-accent-orange/30'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingDown className={`w-4 h-4 ${
                              performancePenalty >= 5 ? 'text-status-error' :
                              performancePenalty >= 2 ? 'text-status-warning' :
                              'text-accent-orange'
                            }`} />
                            <span className="text-sm font-medium">Performance Impact</span>
                          </div>
                          <span className={`font-mono font-bold ${
                            performancePenalty >= 5 ? 'text-status-error' :
                            performancePenalty >= 2 ? 'text-status-warning' :
                            'text-accent-orange'
                          }`}>
                            -{performancePenalty}%
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-1">
                          Due to wear on car components
                        </p>
                      </div>
                    )}
                    
                    {/* Part Wear Details */}
                    {car.partWear && (
                      <div className="space-y-2">
                        <p className="text-xs text-text-muted font-medium">Component Wear</p>
                        <div className="grid grid-cols-5 gap-1">
                          {(['engine', 'chassis', 'gearbox', 'brakes', 'suspension'] as const).map(part => (
                            <div key={part} className="text-center">
                              <div className="h-2 bg-background rounded-full overflow-hidden mb-1">
                                <div 
                                  className={`h-full ${
                                    car.partWear[part] >= 90 ? 'bg-status-error' :
                                    car.partWear[part] >= 70 ? 'bg-status-warning' :
                                    car.partWear[part] >= 50 ? 'bg-accent-orange' :
                                    'bg-status-success'
                                  }`}
                                  style={{ width: `${car.partWear[part]}%` }}
                                />
                              </div>
                              <p className={`text-[10px] capitalize ${getWearStatusColor(car.partWear[part])}`}>
                                {part.slice(0, 3)}
                              </p>
                              <p className={`text-[10px] font-mono ${getWearStatusColor(car.partWear[part])}`}>
                                {Math.round(car.partWear[part])}%
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-text-muted text-xs">Performance</p>
                        <p className="font-mono">{car.performance}</p>
                      </div>
                      <div>
                        <p className="text-text-muted text-xs">Reliability</p>
                        <p className="font-mono">{car.reliability}</p>
                      </div>
                      <div>
                        <p className="text-text-muted text-xs">Avg Wear</p>
                        <p className={`font-mono ${getWearStatusColor(avgWear)}`}>{avgWear}%</p>
                      </div>
                      <div>
                        <p className="text-text-muted text-xs">Mileage</p>
                        <p className="font-mono">{car.mileage.toLocaleString()} km</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap items-center">
                      <Badge variant="default">{car.chassisId}</Badge>
                      <Badge variant="outline">{car.engineId}</Badge>
                      <div className="flex-1" />
                      <Button
                        variant={hasCriticalWear ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => openServiceModal(car)}
                        className={hasCriticalWear ? 'bg-status-error hover:bg-status-error/80' : ''}
                      >
                        <Wrench className="w-4 h-4 mr-1" />
                        Service
                      </Button>
                    </div>
                  </Card>
                )
              })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-16">
              <div className="text-center max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-accent-orange/10 flex items-center justify-center mx-auto mb-4">
                  <Car className="w-10 h-10 text-accent-orange" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2">No Cars in Fleet</h3>
                <p className="text-text-muted mb-4">
                  Your team needs a car to compete! Visit the Marketplace to browse and purchase vehicles 
                  that are compatible with racing series you want to enter.
                </p>
                <div className="p-3 bg-accent-gold/10 border border-accent-gold/30 rounded-lg mb-4 text-left">
                  <h4 className="text-sm font-medium text-accent-gold mb-2">Getting Started Tips:</h4>
                  <ul className="text-xs text-text-secondary space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-accent-gold">1.</span>
                      Check your budget before shopping
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-gold">2.</span>
                      Look for cars compatible with your desired series
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-gold">3.</span>
                      Start with a reliable entry-level car
                    </li>
                  </ul>
                </div>
                <Button variant="racing" onClick={() => navigate('/marketplace')}>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Browse Marketplace
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Service Modal - Granular Part Selection */}
      <Modal
        isOpen={showServiceModal}
        onClose={() => {
          setShowServiceModal(false)
          setPartServiceSelections({
            engine: null,
            chassis: null,
            gearbox: null,
            brakes: null,
            suspension: null
          })
        }}
        title="Car Service"
        size="xl"
      >
        {selectedCar && (
          <div className="space-y-6">
            {/* Car Info Header */}
            <div className="p-4 bg-surface-secondary rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-semibold text-lg">{selectedCar.liveryName || selectedCar.chassisId}</h3>
                  <p className="text-sm text-text-muted">{(() => {
                    const carClass = selectedCar.seriesId ? AMS2_CAR_CLASSES.find(c => c.id === selectedCar.seriesId) : null
                    const mfg = carClass ? getManufacturerForCarClass(carClass.id) : null
                    return mfg ? mfg.name : 'Unknown'
                  })()} • {selectedCar.mileage.toLocaleString()} km</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">Average Wear</p>
                  <p className={`font-mono font-bold ${getWearStatusColor(
                    selectedCar.partWear 
                      ? Math.round(Object.values(selectedCar.partWear).reduce((a, b) => a + b, 0) / 5)
                      : 0
                  )}`}>
                    {selectedCar.partWear 
                      ? Math.round(Object.values(selectedCar.partWear).reduce((a, b) => a + b, 0) / 5)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>

            {/* Service Level Legend */}
            <div className="p-3 bg-background/50 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <span className="text-text-muted">Service Levels:</span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-accent-cyan/50" />
                    Light (-20%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-accent-orange/50" />
                    Standard (-50%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-status-success/50" />
                    Rebuild (→0%)
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPartServiceSelections({
                    engine: null,
                    chassis: null,
                    gearbox: null,
                    brakes: null,
                    suspension: null
                  })}
                >
                  Clear All
                </Button>
              </div>
            </div>
            
            {/* Part-by-Part Selection */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Select Parts to Service</h4>
              <div className="space-y-2">
                {(['engine', 'chassis', 'gearbox', 'brakes', 'suspension'] as const).map(part => {
                  const currentWear = selectedCar.partWear?.[part] || 0
                  const selectedLevel = partServiceSelections[part]
                  const tier = careerState?.ownedTeam?.tier || 'amateur'
                  const tierMultipliers: Record<string, number> = {
                    entry: 0.5,
                    amateur: 0.75,
                    semi_pro: 1.0,
                    professional: 1.5,
                    elite: 2.5,
                    pinnacle: 5.0
                  }
                  const tierMultiplier = tierMultipliers[tier] || 1.0
                  
                  // Calculate estimated wear after service
                  let estimatedWear = currentWear
                  if (selectedLevel) {
                    const config = SERVICE_LEVEL_CONFIG[selectedLevel]
                    estimatedWear = selectedLevel === 'rebuild' ? 0 : Math.max(0, currentWear - config.wearReduction)
                  }
                  
                  return (
                    <div 
                      key={part}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedLevel 
                          ? selectedLevel === 'rebuild' ? 'border-status-success bg-status-success/5' :
                            selectedLevel === 'standard' ? 'border-accent-orange bg-accent-orange/5' :
                            'border-accent-cyan bg-accent-cyan/5'
                          : 'border-surface-border bg-surface-secondary'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            currentWear >= 90 ? 'bg-status-error/20' :
                            currentWear >= 70 ? 'bg-status-warning/20' :
                            currentWear >= 50 ? 'bg-accent-orange/20' :
                            'bg-status-success/20'
                          }`}>
                            {part === 'engine' ? <Zap className={`w-5 h-5 ${getWearStatusColor(currentWear)}`} /> :
                             part === 'chassis' ? <Car className={`w-5 h-5 ${getWearStatusColor(currentWear)}`} /> :
                             part === 'gearbox' ? <Settings className={`w-5 h-5 ${getWearStatusColor(currentWear)}`} /> :
                             part === 'brakes' ? <AlertCircle className={`w-5 h-5 ${getWearStatusColor(currentWear)}`} /> :
                             <Wrench className={`w-5 h-5 ${getWearStatusColor(currentWear)}`} />}
                          </div>
                          <div>
                            <p className="font-semibold capitalize">{part}</p>
                            <div className="flex items-center gap-2 text-xs">
                              <span className={getWearStatusColor(currentWear)}>
                                {Math.round(currentWear)}% wear
                              </span>
                              {selectedLevel && (
                                <>
                                  <span className="text-text-muted">→</span>
                                  <span className="text-status-success">{Math.round(estimatedWear)}%</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Wear bar */}
                        <div className="w-24">
                          <div className="h-2 bg-background rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                currentWear >= 90 ? 'bg-status-error' :
                                currentWear >= 70 ? 'bg-status-warning' :
                                currentWear >= 50 ? 'bg-accent-orange' :
                                'bg-status-success'
                              }`}
                              style={{ width: `${currentWear}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Service Level Buttons */}
                      <div className="grid grid-cols-4 gap-2">
                        {/* None option */}
                        <button
                          onClick={() => setPartServiceSelections(prev => ({ ...prev, [part]: null }))}
                          className={`p-2 rounded-lg text-xs font-medium transition-all ${
                            !selectedLevel 
                              ? 'bg-background border-2 border-text-muted/30' 
                              : 'bg-background/50 border border-surface-border hover:border-text-muted/30'
                          }`}
                        >
                          <span className="block">None</span>
                          <span className="text-text-muted">$0</span>
                        </button>
                        
                        {/* Service levels */}
                        {(['light', 'standard', 'rebuild'] as ServiceLevel[]).map(level => {
                          const config = SERVICE_LEVEL_CONFIG[level]
                          const cost = Math.round(PART_BASE_COSTS[part] * config.costMultiplier * tierMultiplier)
                          const isSelected = selectedLevel === level
                          
                          return (
                            <button
                              key={level}
                              onClick={() => setPartServiceSelections(prev => ({ ...prev, [part]: level }))}
                              className={`p-2 rounded-lg text-xs font-medium transition-all ${
                                isSelected 
                                  ? level === 'rebuild' ? 'bg-status-success/20 border-2 border-status-success' :
                                    level === 'standard' ? 'bg-accent-orange/20 border-2 border-accent-orange' :
                                    'bg-accent-cyan/20 border-2 border-accent-cyan'
                                  : 'bg-background/50 border border-surface-border hover:border-text-muted/30'
                              }`}
                            >
                              <span className="block capitalize">{config.label.split(' ')[0]}</span>
                              <span className={isSelected ? 'text-status-success' : 'text-text-muted'}>
                                ${cost.toLocaleString()}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Total Cost & Action */}
            <div className="p-4 bg-surface-secondary rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-text-muted">Total Cost</span>
                  <p className="text-xs text-text-muted">
                    {Object.values(partServiceSelections).filter(v => v !== null).length} part(s) selected
                  </p>
                </div>
                <span className="font-display font-bold text-2xl text-status-success">
                  ${granularServiceCost.toLocaleString()}
                </span>
              </div>
              
              {careerState?.ownedTeam && (
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-text-muted">Team Budget</span>
                  <span className={`font-mono ${
                    careerState.ownedTeam.budgets.cash >= granularServiceCost
                      ? 'text-status-success' : 'text-status-error'
                  }`}>
                    ${careerState.ownedTeam.budgets.cash.toLocaleString()}
                  </span>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowServiceModal(false)
                    setPartServiceSelections({
                      engine: null,
                      chassis: null,
                      gearbox: null,
                      brakes: null,
                      suspension: null
                    })
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleGranularService}
                  disabled={granularServiceCost === 0 || (careerState?.ownedTeam?.budgets.cash || 0) < granularServiceCost}
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Confirm Service
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Service All Cars Modal */}
      <Modal
        isOpen={showServiceAllModal}
        onClose={() => setShowServiceAllModal(false)}
        title="Service All Cars"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-sm text-text-muted bg-surface-secondary p-4 rounded-xl">
            <p>
              Apply a quick service to all cars in your fleet. This will perform a standard service 
              on all high-wear components across your entire fleet.
            </p>
          </div>
          
          {/* Fleet Overview */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Fleet Status</h4>
            <div className="space-y-2">
              {careerState?.cars?.map(car => {
                const avgWear = car.partWear 
                  ? Math.round(Object.values(car.partWear).reduce((sum, v) => sum + v, 0) / 5)
                  : 0
                const hasCritical = car.partWear && Object.values(car.partWear).some(w => w >= 90)
                
                return (
                  <div 
                    key={car.carId}
                    className={`p-3 rounded-lg flex items-center justify-between ${
                      hasCritical ? 'bg-status-error/10 border border-status-error/30' :
                      avgWear >= 50 ? 'bg-status-warning/10' : 'bg-background/50'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{car.liveryName || car.chassisId}</p>
                      <p className="text-xs text-text-muted">{(() => {
                        const carClass = car.seriesId ? AMS2_CAR_CLASSES.find(c => c.id === car.seriesId) : null
                        const mfg = carClass ? getManufacturerForCarClass(carClass.id) : null
                        return mfg ? mfg.name : 'Unknown'
                      })()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-text-muted">Avg Wear</p>
                        <p className={`font-mono font-bold ${getWearStatusColor(avgWear)}`}>
                          {avgWear}%
                        </p>
                      </div>
                      {hasCritical && (
                        <AlertTriangle className="w-5 h-5 text-status-error" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Service Options */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Service Option</h4>
            <div className="p-4 bg-accent-cyan/10 border-2 border-accent-cyan rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-accent-cyan" />
                  <span className="font-semibold">Standard Fleet Service</span>
                </div>
                <span className="font-mono font-bold text-status-success">
                  ${((careerState?.cars?.length || 0) * 5000).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-text-muted">
                Applies standard service (-50% wear) to all parts on all {careerState?.cars?.length || 0} car(s)
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="p-4 bg-surface-secondary rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-text-muted">Total Cost</span>
              <span className="font-display font-bold text-2xl text-status-success">
                ${((careerState?.cars?.length || 0) * 5000).toLocaleString()}
              </span>
            </div>
            
            {careerState?.ownedTeam && (
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-text-muted">Team Budget</span>
                <span className={`font-mono ${
                  careerState.ownedTeam.budgets.cash >= (careerState?.cars?.length || 0) * 5000
                    ? 'text-status-success' : 'text-status-error'
                }`}>
                  ${careerState.ownedTeam.budgets.cash.toLocaleString()}
                </span>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowServiceAllModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  // Service all cars with standard service on all parts
                  let successCount = 0
                  careerState?.cars?.forEach(car => {
                    const allPartsStandard: PartServiceSelection[] = [
                      { part: 'engine', level: 'standard' },
                      { part: 'chassis', level: 'standard' },
                      { part: 'gearbox', level: 'standard' },
                      { part: 'brakes', level: 'standard' },
                      { part: 'suspension', level: 'standard' }
                    ]
                    const result = serviceCarGranular(car.carId, allPartsStandard)
                    if (result) successCount++
                  })
                  
                  if (successCount > 0) {
                    addToast({
                      type: 'success',
                      title: 'Fleet Serviced',
                      message: `Successfully serviced ${successCount} car(s)`,
                      duration: 4000
                    })
                  }
                  setShowServiceAllModal(false)
                }}
                disabled={(careerState?.ownedTeam?.budgets.cash || 0) < (careerState?.cars?.length || 0) * 5000}
              >
                <Wrench className="w-4 h-4 mr-2" />
                Service All Cars
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      
      {/* Hire Driver Modal */}
      <Modal
        isOpen={showHireDriverModal}
        onClose={() => setShowHireDriverModal(false)}
        title="Hire Driver"
        size="xl"
      >
        <div className="space-y-6">
          <div className="text-sm text-text-muted bg-surface-secondary p-4 rounded-xl">
            <p>
              Available drivers are looking for a team seat. Hire a driver to compete alongside you
              in your second car. Their performance will contribute to the team championship.
            </p>
          </div>
          
          {/* Available Drivers from rivals store */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Available Drivers
            </h4>
            
            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {rivals
                .filter(r => !r.currentTeamId || r.currentTeamId === 'free_agent')
                .slice(0, 8)
                .map(driver => {
                  const overallRating = Math.round((driver.stats.raceSkill + driver.stats.qualifyingSkill + driver.stats.consistency) / 3 * 100)
                  const paceRating = Math.round(driver.stats.raceSkill * 100)
                  const consistencyRating = Math.round(driver.stats.consistency * 100)
                  const suggestedSalary = Math.round(overallRating * 800 + (paceRating * 200))
                  const signingFee = Math.round(suggestedSalary * 0.5)
                  
                  return (
                    <Card key={driver.id} className="p-4 hover:border-accent-cyan/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-accent-purple/20 flex items-center justify-center">
                            <User className="w-6 h-6 text-accent-purple" />
                          </div>
                          <div>
                            <h4 className="font-display font-semibold">{driver.firstName} {driver.lastName}</h4>
                            <p className="text-sm text-text-muted">{driver.nationality}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                              <p className="text-xs text-text-muted">Overall</p>
                              <span className={`font-mono font-bold ${getSkillColor(overallRating)}`}>
                                {overallRating}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs text-text-muted">Pace</p>
                              <span className={`font-mono ${getSkillColor(paceRating)}`}>
                                {paceRating}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs text-text-muted">Cons</p>
                              <span className={`font-mono ${getSkillColor(consistencyRating)}`}>
                                {consistencyRating}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right min-w-[100px]">
                            <p className="text-xs text-text-muted">Contract</p>
                            <p className="font-mono text-sm">{formatCurrency(suggestedSalary)}/yr</p>
                            <p className="text-xs text-text-muted">+ {formatCurrency(signingFee)} signing</p>
                          </div>
                          
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              // Find the second car (unassigned) for the new driver
                              const secondCar = careerState?.cars?.find(c => c.driverType === 'unassigned')
                              if (!secondCar) {
                                addToast({
                                  type: 'error',
                                  title: 'No Car Available',
                                  message: 'You need a second unassigned car to hire a driver.'
                                })
                                return
                              }
                              
                              const contract: HiredDriverContract = {
                                startYear: new Date().getFullYear(),
                                endYear: new Date().getFullYear() + 2,
                                salary: suggestedSalary,
                                bonusPerWin: Math.round(suggestedSalary * 0.5),
                                bonusPerPodium: Math.round(suggestedSalary * 0.2),
                                targets: [],
                                satisfaction: 70
                              }
                              
                              const result = signHiredDriver(driver.id, contract, secondCar.carId)
                              if (result) {
                                addToast({
                                  type: 'success',
                                  title: 'Driver Signed!',
                                  message: `${driver.firstName} ${driver.lastName} has joined your team.`
                                })
                                setShowHireDriverModal(false)
                              } else {
                                addToast({
                                  type: 'error',
                                  title: 'Signing Failed',
                                  message: 'Could not complete the signing. Check your budget.'
                                })
                              }
                            }}
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Sign
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
            </div>
            
            {rivals.filter(r => !r.currentTeamId || r.currentTeamId === 'free_agent').length === 0 && (
              <div className="text-center py-8 text-text-muted">
                <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No free agent drivers available at this time.</p>
                <p className="text-sm">Check back next season for new talent.</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setShowHireDriverModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Release Confirmation Modal */}
      <Modal
        isOpen={showReleaseConfirm}
        onClose={() => {
          setShowReleaseConfirm(false)
          setReleaseTarget(null)
        }}
        title="Confirm Release"
        size="md"
      >
        {releaseTarget && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-status-error/20 flex items-center justify-center mx-auto mb-4">
                <UserMinus className="w-8 h-8 text-status-error" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">
                Release {releaseTarget.name}?
              </h3>
              <p className="text-text-muted">
                {releaseTarget.type === 'driver' 
                  ? 'This will terminate their contract and they will become a free agent. You may need to pay a termination fee.'
                  : 'This staff member will no longer contribute to team operations. You may need to pay severance.'}
              </p>
            </div>
            
            <div className="p-4 bg-status-error/10 rounded-xl border border-status-error/30">
              <div className="flex items-center gap-2 text-status-error mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Warning</span>
              </div>
              <p className="text-sm text-status-error/80">
                {releaseTarget.type === 'driver'
                  ? 'Your second car will be without a driver until you hire a replacement.'
                  : 'Team performance may decrease without this staff member.'}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowReleaseConfirm(false)
                  setReleaseTarget(null)
                }}
              >
                Keep
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-status-error hover:bg-status-error/80"
                onClick={() => {
                  if (releaseTarget.type === 'driver') {
                    releaseHiredDriver(releaseTarget.id)
                    addToast({
                      type: 'info',
                      title: 'Driver Released',
                      message: `${releaseTarget.name} has been released from the team.`
                    })
                  } else {
                    releaseStaff(releaseTarget.id)
                    addToast({
                      type: 'info',
                      title: 'Staff Released',
                      message: `${releaseTarget.name} has been released from the team.`
                    })
                  }
                  setShowReleaseConfirm(false)
                  setReleaseTarget(null)
                }}
              >
                <UserMinus className="w-4 h-4 mr-2" />
                Release
              </Button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Driver Development Modal */}
      <Modal
        isOpen={showDevelopmentModal && !!devModalDriver && !!devModalRival}
        onClose={() => {
          setShowDevelopmentModal(false)
          setSelectedDriverForDev(null)
        }}
        title={devModalRival ? `${devModalRival.firstName} ${devModalRival.lastName} - Development` : 'Driver Development'}
        size="lg"
      >
        {devModalDriver && devModalRival && (
          <div className="space-y-4">
            {/* Driver Header */}
            <div className="flex items-center gap-4 p-4 bg-surface-secondary rounded-lg">
              <div className="w-16 h-16 rounded-full bg-accent-orange/30 flex items-center justify-center">
                <User className="w-8 h-8 text-accent-orange" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-text-primary">
                  {devModalRival.firstName} {devModalRival.lastName}
                </h3>
                <p className="text-sm text-text-muted">{devModalRival.nationality}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm">
                    <span className="text-text-muted">Rating:</span>{' '}
                    <span className="font-semibold text-accent-orange">{Math.round((devModalRival.stats.raceSkill + devModalRival.stats.qualifyingSkill + devModalRival.stats.consistency) / 3 * 100)}</span>
                  </span>
                  <span className="text-sm">
                    <span className="text-text-muted">Age:</span>{' '}
                    <span className="font-semibold text-text-primary">{devModalRival.age}</span>
                  </span>
                  <Badge variant={
                    devModalRival.careerStage === 'rising' ? 'default' :
                    devModalRival.careerStage === 'peak' ? 'default' :
                    devModalRival.careerStage === 'declining' ? 'outline' :
                    'outline'
                  } className={
                    devModalRival.careerStage === 'rising' ? 'bg-status-success/20 text-status-success' :
                    devModalRival.careerStage === 'peak' ? 'bg-accent-orange/20 text-accent-orange' :
                    ''
                  }>
                    {devModalRival.careerStage.charAt(0).toUpperCase() + devModalRival.careerStage.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Development Panel */}
            <DriverDevelopmentPanel
              hiredDriver={devModalDriver}
              rivalDriver={devModalRival}
              onStartTraining={(programId) => handleStartTraining(devModalDriver.driverId, programId)}
              onCancelTraining={() => handleCancelTraining(devModalDriver.driverId)}
              teamCash={rosterBudget}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface TeammateCardProps {
  teammate: RivalDriver
}

function _TeammateCard({ teammate }: TeammateCardProps) {
  const relationship = getRelationshipStatus(teammate.relationshipWithPlayer)
  const avgSkill = (
    teammate.stats.raceSkill + 
    teammate.stats.qualifyingSkill + 
    teammate.stats.consistency
  ) / 3 * 100

  return (
    <div className="p-4 bg-background/50 rounded-lg border border-surface-border hover:border-surface-border/80 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium">{teammate.firstName} {teammate.lastName}</h4>
          <p className="text-xs text-text-muted">{teammate.nationality} • {teammate.age}yo</p>
        </div>
        <Badge variant="outline" className="text-xs">
          Rep {teammate.reputation}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="text-center p-2 bg-surface-card rounded">
          <p className="text-xs text-text-muted">Skill</p>
          <p className="font-mono font-bold text-sm">{avgSkill.toFixed(0)}</p>
        </div>
        <div className="text-center p-2 bg-surface-card rounded">
          <p className="text-xs text-text-muted">Wins</p>
          <p className="font-mono font-bold text-sm">{teammate.totalWins}</p>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs">
        <span className="text-text-muted">Relationship</span>
        <span className={relationship.color}>{relationship.label}</span>
      </div>
    </div>
  )
}

interface MilestoneCardProps {
  name: string
  unlocked: boolean
  perk: string
}

function _MilestoneCard({ name, unlocked, perk }: MilestoneCardProps) {
  return (
    <div className={`p-3 rounded-lg border transition-all ${
      unlocked 
        ? 'bg-status-success/10 border-status-success/30' 
        : 'bg-background/30 border-surface-border opacity-60'
    }`}>
      <div className="flex items-center gap-2 mb-1">
        {unlocked ? (
          <CheckCircle2 className="w-4 h-4 text-status-success" />
        ) : (
          <div className="w-4 h-4 rounded-full border border-surface-border" />
        )}
        <span className={`text-sm font-medium ${unlocked ? 'text-text-primary' : 'text-text-muted'}`}>
          {name}
        </span>
      </div>
      <p className="text-xs text-text-muted pl-6">{perk}</p>
    </div>
  )
}

interface ModifierRowProps {
  label: string
  value: number
  icon: React.ReactNode
  isNegative?: boolean
}

function _ModifierRow({ label, value, icon, isNegative }: ModifierRowProps) {
  if (value === 0) return null
  
  const displayValue = (value * 100).toFixed(1)
  const isGood = isNegative ? value === 0 : value < 0
  
  return (
    <div className="flex justify-between items-center p-2 bg-background/30 rounded">
      <span className="text-xs text-text-muted flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className={`font-mono text-xs font-medium ${
        isGood ? 'text-status-success' : 'text-accent-red'
      }`}>
        {value > 0 ? '+' : ''}{displayValue}%
      </span>
    </div>
  )
}
