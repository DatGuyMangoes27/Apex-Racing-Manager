import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Sunset,
  DollarSign,
  TrendingUp,
  Target,
  Award,
  Users,
  Briefcase,
  Mic,
  BookOpen,
  Heart,
  Building2,
  GraduationCap,
  Star,
  Clock,
  AlertTriangle,
  Check,
  ChevronRight,
  Shield,
  Sparkles
} from 'lucide-react'
import { Card, CardHeader, Button, Badge, Modal, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import type { 
  RetirementPlan, 
  PostRacingCareerPlan, 
  LegacyGoal,
  SuccessionPlan 
} from '@/data/retirement-config'
import { POST_RACING_CAREERS, LEGACY_GOALS } from '@/data/retirement-config'

// ============================================
// TYPES
// ============================================

interface RetirementPlannerProps {
  currentAge: number
  currentNetWorth: number
  annualIncome: number
  teamOwned: boolean
  teamName?: string
  retirementPlan: RetirementPlan
  onUpdatePlan: (updates: Partial<RetirementPlan>) => void
  onSetRetirementAge: (age: number) => void
  onSelectCareerPath: (pathId: string) => void
  onAddLegacyGoal: (goal: LegacyGoal) => void
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const CAREER_ICONS: Record<string, React.ReactNode> = {
  team_owner: <Building2 className="w-5 h-5" />,
  team_principal: <Briefcase className="w-5 h-5" />,
  pundit: <Mic className="w-5 h-5" />,
  racing_school: <GraduationCap className="w-5 h-5" />,
  business: <TrendingUp className="w-5 h-5" />,
  politics: <Users className="w-5 h-5" />,
  philanthropy: <Heart className="w-5 h-5" />,
  leisure: <Sunset className="w-5 h-5" />
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `$${Math.round(value / 1000)}K`
  }
  return `$${value.toLocaleString()}`
}

function getReadinessColor(value: number): string {
  if (value >= 80) return 'text-green-400'
  if (value >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

function getReadinessLabel(value: number): string {
  if (value >= 80) return 'Ready'
  if (value >= 50) return 'Preparing'
  return 'Not Ready'
}

// ============================================
// SUB-COMPONENTS
// ============================================

function FinancialReadinessCard({
  currentNetWorth,
  annualIncome,
  retirementTarget,
  yearsUntil
}: {
  currentNetWorth: number
  annualIncome: number
  retirementTarget: number
  yearsUntil: number
}) {
  const progress = Math.min(100, (currentNetWorth / retirementTarget) * 100)
  const projectedAtRetirement = currentNetWorth + (annualIncome * yearsUntil * 0.3) // Assume 30% savings
  const onTrack = projectedAtRetirement >= retirementTarget
  
  return (
    <Card variant="racing" padding="lg">
      <CardHeader 
        title="Financial Readiness" 
        icon={<DollarSign className="w-5 h-5" />}
      />
      
      <div className="mt-4 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-text-muted">Current Net Worth</span>
          <span className="text-2xl font-bold">{formatCurrency(currentNetWorth)}</span>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Progress to Goal</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-surface-darker rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${onTrack ? 'bg-green-500' : 'bg-yellow-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>$0</span>
            <span>Target: {formatCurrency(retirementTarget)}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/10">
          <div>
            <p className="text-xs text-text-muted">Projected at Retirement</p>
            <p className={`text-lg font-bold ${onTrack ? 'text-green-400' : 'text-yellow-400'}`}>
              {formatCurrency(projectedAtRetirement)}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Annual Income Needed</p>
            <p className="text-lg font-bold">{formatCurrency(retirementTarget * 0.04)}</p>
            <p className="text-xs text-text-muted">4% withdrawal rate</p>
          </div>
        </div>
        
        <div className={`p-3 rounded-lg ${onTrack ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
          <div className="flex items-center gap-2">
            {onTrack ? (
              <Check className="w-5 h-5 text-green-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            )}
            <span className={onTrack ? 'text-green-400' : 'text-yellow-400'}>
              {onTrack ? 'On track for retirement goals' : 'May need to increase savings or delay retirement'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

function CareerPathCard({
  career,
  isSelected,
  currentProgress,
  onSelect
}: {
  career: PostRacingCareerPlan
  isSelected: boolean
  currentProgress: number
  onSelect: () => void
}) {
  const canPursue = (career.requirements || []).every(r => r.met)
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      disabled={!canPursue}
      className={`
        p-4 rounded-xl text-left w-full transition-all
        ${isSelected 
          ? 'bg-racing-red/20 border-2 border-racing-red' 
          : canPursue
            ? 'bg-surface-dark/50 border-2 border-transparent hover:border-racing-red/30'
            : 'bg-surface-dark/30 border-2 border-transparent opacity-60'
        }
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isSelected ? 'bg-racing-red text-white' : 'bg-surface-darker text-text-muted'
          }`}>
            {CAREER_ICONS[career.path]}
          </div>
          <div>
            <h4 className="font-medium">{career.name}</h4>
            <Badge 
              variant={career.stressLevel === 'low' ? 'success' : career.stressLevel === 'high' ? 'danger' : 'warning'}
              size="sm"
            >
              {career.stressLevel} stress
            </Badge>
          </div>
        </div>
        {isSelected && <Check className="w-5 h-5 text-racing-red" />}
      </div>
      
      <p className="text-sm text-text-muted mb-3 line-clamp-2">{career.description}</p>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Expected Income</span>
          <span className="font-medium">{formatCurrency(typeof career.expectedIncome === 'number' ? career.expectedIncome : career.expectedIncomeNumber || ((career.expectedIncome.min + career.expectedIncome.max) / 2))}/year</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Fulfillment</span>
          <span className="font-medium">{career.fulfillmentRating}/100</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Preparation</span>
          <span className={getReadinessColor(currentProgress)}>{currentProgress}%</span>
        </div>
      </div>
      
      {!canPursue && (
        <div className="mt-3 pt-3 border-t border-border/10">
          <p className="text-xs text-red-400">Missing requirements:</p>
          <ul className="text-xs text-text-muted mt-1">
            {(career.requirements || []).filter(r => !r.met).map((r, i) => (
              <li key={i}>• {r.description}</li>
            ))}
          </ul>
        </div>
      )}
    </motion.button>
  )
}

function LegacyGoalCard({
  goal,
  _onComplete
}: {
  goal: LegacyGoal
  onComplete?: () => void
}) {
  return (
    <div className={`
      p-4 rounded-xl border
      ${goal.isComplete 
        ? 'bg-green-500/10 border-green-500/30' 
        : 'bg-surface-dark/30 border-border/10'
      }
    `}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {goal.isComplete ? (
            <Check className="w-5 h-5 text-green-400" />
          ) : (
            <Target className="w-5 h-5 text-text-muted" />
          )}
          <h4 className={`font-medium ${goal.isComplete ? 'text-green-400' : ''}`}>
            {goal.name}
          </h4>
        </div>
        <Badge variant={goal.isComplete ? 'success' : 'outline'} size="sm" className="capitalize">
          {goal.type}
        </Badge>
      </div>
      
      <p className="text-sm text-text-muted mb-3">{goal.description}</p>
      
      {!goal.isComplete && (
        <div className="space-y-2">
          <div className="h-2 bg-surface-darker rounded-full overflow-hidden">
            <div 
              className="h-full bg-racing-red"
              style={{ width: `${goal.progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-muted">
            <span>{goal.progressPercent}% complete</span>
            <span>{goal.howRemembered}</span>
          </div>
        </div>
      )}
      
      {goal.isComplete && (
        <p className="text-sm text-green-400 italic">"{goal.howRemembered}"</p>
      )}
    </div>
  )
}

function SuccessionPlanCard({
  plan,
  teamName,
  _onUpdate
}: {
  plan?: SuccessionPlan
  teamName?: string
  onUpdate: (updates: Partial<SuccessionPlan>) => void
}) {
  if (!teamName) {
    return (
      <Card variant="glass" padding="lg" className="text-center">
        <Building2 className="w-12 h-12 text-text-muted/30 mx-auto mb-3" />
        <h4 className="font-medium mb-2">No Team to Succeed</h4>
        <p className="text-sm text-text-muted">
          You need to own a team to create a succession plan.
        </p>
      </Card>
    )
  }
  
  return (
    <Card variant="glass" padding="lg">
      <CardHeader 
        title="Team Succession" 
        icon={<Building2 className="w-5 h-5" />}
        subtitle={teamName}
      />
      
      <div className="mt-4 space-y-4">
        {plan?.teamSuccessor ? (
          <div className="flex items-center gap-3 p-3 bg-surface-dark/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-racing-red to-racing-orange flex items-center justify-center text-white font-bold">
              {typeof plan.teamSuccessor === 'string' 
                ? plan.teamSuccessor.split(' ').map((n: string) => n[0]).join('')
                : plan.teamSuccessor.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <p className="font-medium">{typeof plan.teamSuccessor === 'string' ? plan.teamSuccessor : plan.teamSuccessor.name}</p>
              <p className="text-xs text-text-muted">Designated Successor</p>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400">No successor designated</span>
            </div>
          </div>
        )}
        
        <div>
          <h5 className="text-sm font-medium mb-2">Transition Plan</h5>
          <div className="space-y-2">
            {plan?.transitionPlan && plan.transitionPlan.length > 0 ? (
              plan.transitionPlan.map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 rounded-full bg-surface-darker flex items-center justify-center text-xs">
                    {i + 1}
                  </div>
                  <span className="text-text-muted">{typeof step === 'string' ? step : step.description}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-muted">No transition plan created yet</p>
            )}
          </div>
        </div>
        
        {plan?.childInRacing && (
          <div className="p-3 bg-racing-red/10 border border-racing-red/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-racing-red" />
              <span className="text-racing-red">{plan.childInRacing} is following in your footsteps</span>
            </div>
          </div>
        )}
        
        <Button variant="secondary" className="w-full">
          Edit Succession Plan
        </Button>
      </div>
    </Card>
  )
}

function MentalReadinessCard({
  mentalReadiness,
  identityCrisisRisk,
  supportNetwork
}: {
  mentalReadiness: number
  identityCrisisRisk: number
  supportNetwork: number
}) {
  return (
    <Card variant="glass" padding="lg">
      <CardHeader 
        title="Mental Readiness" 
        icon={<Heart className="w-5 h-5" />}
      />
      
      <div className="mt-4 space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-text-muted">Ready to Retire</span>
            <span className={`text-sm font-medium ${getReadinessColor(mentalReadiness)}`}>
              {getReadinessLabel(mentalReadiness)}
            </span>
          </div>
          <div className="h-2 bg-surface-darker rounded-full overflow-hidden">
            <div 
              className={`h-full ${mentalReadiness >= 80 ? 'bg-green-500' : mentalReadiness >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${mentalReadiness}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-text-muted">Identity Crisis Risk</span>
            <span className={`text-sm font-medium ${identityCrisisRisk > 60 ? 'text-red-400' : identityCrisisRisk > 30 ? 'text-yellow-400' : 'text-green-400'}`}>
              {identityCrisisRisk > 60 ? 'High' : identityCrisisRisk > 30 ? 'Moderate' : 'Low'}
            </span>
          </div>
          <div className="h-2 bg-surface-darker rounded-full overflow-hidden">
            <div 
              className={`h-full ${identityCrisisRisk > 60 ? 'bg-red-500' : identityCrisisRisk > 30 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${identityCrisisRisk}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-text-muted">Support Network</span>
            <span className="text-sm font-medium">{supportNetwork}/100</span>
          </div>
          <div className="h-2 bg-surface-darker rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500"
              style={{ width: `${supportNetwork}%` }}
            />
          </div>
        </div>
        
        {identityCrisisRisk > 60 && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-400">High risk of post-racing identity crisis</p>
                <p className="text-xs text-text-muted mt-1">
                  Consider developing hobbies and interests outside of racing to prepare.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function RetirementPlanner({
  currentAge,
  currentNetWorth,
  annualIncome,
  teamOwned,
  teamName,
  retirementPlan,
  onUpdatePlan,
  onSetRetirementAge,
  onSelectCareerPath,
  onAddLegacyGoal
}: RetirementPlannerProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [showAgeModal, setShowAgeModal] = useState(false)
  
  const yearsUntilRetirement = (retirementPlan.plannedRetirementAge || 45) - currentAge
  const retirementTarget = 20000000 // $20M target
  
  // Career path progress
  const careerProgress = useMemo(() => {
    const progress: Record<string, number> = {}
    POST_RACING_CAREERS.forEach(career => {
      const requirements = career.requirements || []
      const metCount = requirements.filter(r => r.met).length
      const careerId = career.id || career.path
      progress[careerId] = requirements.length > 0 ? Math.round((metCount / requirements.length) * 100) : 0
    })
    return progress
  }, [])
  
  // Legacy goals stats
  const completedGoals = retirementPlan.legacyGoals.filter(g => g.isComplete).length
  const totalGoals = retirementPlan.legacyGoals.length
  
  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="grid grid-cols-4 gap-4">
        <Card variant="racing" padding="md">
          <div className="flex items-center gap-3">
            <Sunset className="w-8 h-8 text-orange-400" />
            <div>
              <p className="text-2xl font-bold">{yearsUntilRetirement}</p>
              <p className="text-xs text-text-muted">Years Until Retirement</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" padding="md" className="text-center">
          <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-xl font-bold">{formatCurrency(currentNetWorth)}</p>
          <p className="text-xs text-text-muted">Net Worth</p>
        </Card>
        <Card variant="glass" padding="md" className="text-center">
          <Target className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-xl font-bold">{completedGoals}/{totalGoals}</p>
          <p className="text-xs text-text-muted">Legacy Goals</p>
        </Card>
        <Card variant="glass" padding="md" className="text-center">
          <Clock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <p className="text-xl font-bold">{retirementPlan.plannedRetirementAge || '??'}</p>
          <p className="text-xs text-text-muted">Retirement Age</p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-1 text-xs"
            onClick={() => setShowAgeModal(true)}
          >
            Change
          </Button>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="careers">Career Paths</TabsTrigger>
          <TabsTrigger value="legacy">Legacy Goals</TabsTrigger>
          <TabsTrigger value="succession">Succession</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-2 gap-6">
            <FinancialReadinessCard
              currentNetWorth={currentNetWorth}
              annualIncome={annualIncome}
              retirementTarget={retirementTarget}
              yearsUntil={yearsUntilRetirement}
            />
            
            <MentalReadinessCard
              mentalReadiness={retirementPlan.mentalReadiness}
              identityCrisisRisk={retirementPlan.identityCrisisRisk}
              supportNetwork={retirementPlan.supportNetwork}
            />
            
            {/* Primary Career Path */}
            <Card variant="glass" padding="lg" className="col-span-2">
              <CardHeader 
                title="Post-Racing Path" 
                icon={<Briefcase className="w-5 h-5" />}
                subtitle="Your planned career after racing"
              />
              
              {retirementPlan.primaryPlan ? (
                <div className="mt-4">
                  {POST_RACING_CAREERS.filter(c => (c.id || c.path) === retirementPlan.primaryPlan).map(career => {
                    const careerId = career.id || career.path
                    const expectedIncomeValue = typeof career.expectedIncome === 'number' 
                      ? career.expectedIncome 
                      : career.expectedIncomeNumber || ((career.expectedIncome.min + career.expectedIncome.max) / 2)
                    return (
                      <div key={careerId} className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-racing-red to-racing-orange flex items-center justify-center text-white">
                          {CAREER_ICONS[career.path]}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-lg">{career.name}</h4>
                          <p className="text-sm text-text-muted">{career.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm">
                              <span className="text-text-muted">Income:</span> {formatCurrency(expectedIncomeValue)}/yr
                            </span>
                            <span className="text-sm">
                              <span className="text-text-muted">Preparation:</span> 
                              <span className={getReadinessColor(careerProgress[careerId] || 0)}>
                                {' '}{careerProgress[careerId] || 0}%
                              </span>
                            </span>
                          </div>
                        </div>
                        <Button variant="secondary" onClick={() => setActiveTab('careers')}>
                          Change
                        </Button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="mt-4 text-center py-8">
                  <Sunset className="w-12 h-12 text-text-muted/30 mx-auto mb-3" />
                  <p className="text-text-muted mb-3">No post-racing career selected</p>
                  <Button onClick={() => setActiveTab('careers')}>
                    Choose a Path
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="careers">
          <Card variant="glass" padding="lg">
            <CardHeader 
              title="Post-Racing Career Options" 
              icon={<Briefcase className="w-5 h-5" />}
              subtitle="Choose your path after retiring from racing"
            />
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              {POST_RACING_CAREERS.map(career => {
                const careerId = career.id || career.path
                return (
                  <CareerPathCard
                    key={careerId}
                    career={career}
                    isSelected={retirementPlan.primaryPlan === careerId}
                    currentProgress={careerProgress[careerId] || 0}
                    onSelect={() => onSelectCareerPath(careerId)}
                  />
                )
              })}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="legacy">
          <Card variant="glass" padding="lg">
            <div className="flex items-center justify-between mb-4">
              <CardHeader 
                title="Legacy Goals" 
                icon={<Award className="w-5 h-5" />}
                subtitle="How do you want to be remembered?"
              />
              <Button>
                <Sparkles className="w-4 h-4 mr-1" />
                Add Goal
              </Button>
            </div>
            
            {retirementPlan.legacyGoals.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {retirementPlan.legacyGoals.map(goal => (
                  <LegacyGoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-text-muted/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Legacy Goals Yet</h3>
                <p className="text-text-muted mb-4">
                  Define what you want to achieve and how you want to be remembered.
                </p>
                <Button>Create Your First Goal</Button>
              </div>
            )}
            
            {/* Suggested Goals */}
            <div className="mt-6 pt-6 border-t border-border/10">
              <h4 className="font-medium mb-3">Suggested Goals</h4>
              <div className="flex flex-wrap gap-2">
                {LEGACY_GOALS.slice(0, 5).map((template, idx) => (
                  <Button 
                    key={`legacy-template-${idx}`}
                    variant="outline" 
                    size="sm"
                    onClick={() => onAddLegacyGoal({
                      id: `legacy_${Date.now()}_${idx}`,
                      ...template,
                      isComplete: false,
                      progressPercent: 0
                    })}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="succession">
          <div className="grid grid-cols-2 gap-6">
            <SuccessionPlanCard
              plan={retirementPlan.successionPlan}
              teamName={teamOwned ? teamName : undefined}
              onUpdate={(updates) => onUpdatePlan({ 
                successionPlan: { ...retirementPlan.successionPlan, ...updates } as SuccessionPlan
              })}
            />
            
            <Card variant="glass" padding="lg">
              <CardHeader 
                title="Knowledge Transfer" 
                icon={<GraduationCap className="w-5 h-5" />}
                subtitle="Passing on your wisdom"
              />
              
              <div className="mt-4 space-y-4">
                <div>
                  <h5 className="text-sm font-medium mb-2">Mentoring Drivers</h5>
                  {retirementPlan.successionPlan?.mentoringDrivers.length ? (
                    <div className="flex flex-wrap gap-2">
                      {retirementPlan.successionPlan.mentoringDrivers.map(driver => (
                        <Badge key={driver} variant="outline">{driver}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted">Not mentoring anyone yet</p>
                  )}
                </div>
                
                <div>
                  <h5 className="text-sm font-medium mb-2">Written Legacy</h5>
                  {retirementPlan.successionPlan?.writtenWisdom ? (
                    <p className="text-sm text-text-muted">
                      {retirementPlan.successionPlan.writtenWisdom}
                    </p>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Write Autobiography</Button>
                      <Button variant="outline" size="sm">Record Documentary</Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Retirement Age Modal */}
      <Modal
        isOpen={showAgeModal}
        onClose={() => setShowAgeModal(false)}
        title="Set Retirement Age"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-muted">
            Current age: {currentAge}. When do you plan to retire?
          </p>
          
          <div className="grid grid-cols-4 gap-2">
            {[40, 45, 50, 55, 60].map(age => (
              <Button
                key={age}
                variant={retirementPlan.plannedRetirementAge === age ? 'primary' : 'secondary'}
                onClick={() => {
                  onSetRetirementAge(age)
                  setShowAgeModal(false)
                }}
                disabled={age <= currentAge}
              >
                {age}
              </Button>
            ))}
          </div>
          
          <div className="pt-4 border-t border-border/10">
            <p className="text-xs text-text-muted">
              Note: Retiring too early may affect your legacy and financial security.
              Retiring too late may impact your health and enjoyment of retirement.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default RetirementPlanner
