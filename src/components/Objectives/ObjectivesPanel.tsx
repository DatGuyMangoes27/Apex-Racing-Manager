import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Target,
  CheckCircle2,
  ChevronRight,
  Car,
  Trophy,
  DollarSign,
  Users,
  Calendar,
  Handshake,
  AlertTriangle,
  Heart,
  Clock,
  FileText,
  Wrench,
  ShieldAlert,
  CheckCheck,
  XCircle,
} from 'lucide-react'
import { Card, CardHeader, Badge, Button } from '@/components/ui'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import type { PlayerPromise } from '@/simulation/promises'

type RoleTag = 'racing' | 'business' | 'life'

interface Objective {
  id: string
  title: string
  description: string
  progress?: number
  maxProgress?: number
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  icon: typeof Target
  roleTag?: RoleTag
  action?: {
    label: string
    path: string
  }
}

const ROLE_TAG_STYLES: Record<RoleTag, { bg: string; text: string; label: string }> = {
  racing: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'Racing' },
  business: { bg: 'bg-accent-orange/20', text: 'text-accent-orange', label: 'Business' },
  life: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Life' },
}

export function ObjectivesPanel() {
  const navigate = useNavigate()
  const { player, careerState } = useCareerStore()
  const { series, getSeriesById } = useRivalStore()
  
  const objectives = useMemo(() => {
    if (!player || !careerState) return []
    
    const team = careerState.ownedTeam
    const objs: Objective[] = []
    
    // Check if player has cars
    const hasCars = (careerState.cars?.length ?? 0) > 0
    
    // Check if entered a series
    const hasSeriesEntry = player.currentSeriesId !== undefined && player.currentSeriesId !== null
    
    // Check for drivers assigned
    const hasDrivers = (team?.drivers?.length ?? 0) > 0
    
    // Check for sponsors
    const hasSponsors = (team?.finances?.sponsors?.filter(s => s.active)?.length ?? 0) > 0
    
    // Check for staff
    const hasKeyStaff = (team?.staff?.length ?? 0) >= 2
    
    // Get current series info
    const currentSeries = player.currentSeriesId ? getSeriesById(player.currentSeriesId) : null
    const racesCompleted = player.raceHistory?.filter(r => r.seriesId === player.currentSeriesId).length ?? 0
    const totalRaces = currentSeries?.calendar?.length ?? 0
    
    // === NEW PLAYER OBJECTIVES ===
    // Urgency escalation: after week 4, incomplete critical tasks become urgent
    const isUrgent = (careerState.currentWeek ?? 1) >= 4 && !careerState.onboardingComplete
    
    // 1. Buy first car
    if (!hasCars) {
      objs.push({
        id: 'first-car',
        title: isUrgent ? 'URGENT: Buy a Car Now!' : 'Acquire Your First Car',
        description: isUrgent 
          ? `Week ${careerState.currentWeek} and still no car! Your team cannot compete without one. Visit the Marketplace immediately.`
          : 'Visit the Marketplace to purchase a car to race with.',
        completed: false,
        priority: 'high',
        icon: Car,
        roleTag: 'business',
        action: {
          label: 'Go to Marketplace',
          path: '/marketplace'
        }
      })
    }
    
    // 2. Enter a series
    if (hasCars && !hasSeriesEntry) {
      objs.push({
        id: 'enter-series',
        title: isUrgent ? 'URGENT: Enter a Series!' : 'Enter Your First Series',
        description: isUrgent
          ? `You have a car but no series entry! Races won't wait — register for a championship now.`
          : 'Choose a racing series that fits your car and budget.',
        completed: false,
        priority: 'high',
        icon: Trophy,
        roleTag: 'racing',
        action: {
          label: 'Browse Series',
          path: '/series-entry'
        }
      })
    }
    
    // 3. Assign drivers
    if (hasCars && !hasDrivers) {
      objs.push({
        id: 'assign-driver',
        title: isUrgent ? 'URGENT: Assign a Driver!' : 'Assign a Driver',
        description: isUrgent
          ? `Your car has no driver! Assign yourself or hire a driver immediately.`
          : 'Assign yourself or hire a driver to compete in races.',
        completed: false,
        priority: 'high',
        icon: Users,
        roleTag: 'business',
        action: {
          label: 'Manage Garage',
          path: '/garage'
        }
      })
    }
    
    // 4. Get sponsors (urgency escalation: show even without low funds after week 4)
    if (!hasSponsors && (isUrgent || (team?.budgets?.cash ?? 0) < 500000)) {
      objs.push({
        id: 'get-sponsors',
        title: isUrgent ? 'URGENT: Find Sponsors!' : 'Attract Sponsors',
        description: isUrgent
          ? `No sponsor income! Your cash will run out. Visit the Sponsor Market before it's too late.`
          : 'Sponsors provide regular income to fund your team operations.',
        completed: false,
        priority: isUrgent ? 'high' : 'medium',
        icon: Handshake,
        roleTag: 'business',
        action: {
          label: 'Sponsor Market',
          path: '/sponsor-market'
        }
      })
    }
    
    // 5. Hire staff
    if (!hasKeyStaff) {
      objs.push({
        id: 'hire-staff',
        title: isUrgent ? 'URGENT: Hire Staff!' : 'Build Your Team',
        description: isUrgent
          ? `Your team is understaffed! At minimum hire a Chief Engineer. Visit the Staff Market now.`
          : 'Hire a Chief Engineer and Strategist to improve performance.',
        completed: false,
        priority: isUrgent ? 'high' : 'medium',
        icon: Users,
        roleTag: 'business',
        action: {
          label: 'Staff Market',
          path: '/staff-market'
        }
      })
    }
    
    // === ONGOING OBJECTIVES ===
    
    // Race completion progress
    if (hasSeriesEntry && currentSeries && totalRaces > 0) {
      objs.push({
        id: 'complete-season',
        title: 'Complete the Season',
        description: `Finish all races in ${currentSeries.name}`,
        progress: racesCompleted,
        maxProgress: totalRaces,
        completed: racesCompleted >= totalRaces,
        priority: 'medium',
        icon: Calendar,
        roleTag: 'racing',
        action: racesCompleted < totalRaces ? {
          label: 'View Calendar',
          path: '/calendar'
        } : undefined
      })
    }
    
    // Check for upcoming race this week
    const currentWeek = careerState.currentWeek
    const currentDay = careerState.currentDay ?? 1
    const calendar = currentSeries?.calendar ?? []
    const currentRace = calendar.find(r => r.week === currentWeek)
    
    if (currentRace && currentDay === 7) {
      objs.push({
        id: 'race-today',
        title: 'Race Day!',
        description: `Race at ${currentRace.trackName} is ready to begin.`,
        completed: false,
        priority: 'high',
        icon: Trophy,
        roleTag: 'racing',
        action: {
          label: 'Go to Race Day',
          path: '/race-day'
        }
      })
    }
    
    // Board targets
    const boardTargets = careerState.boardTargets ?? []
    const mandatoryTargets = boardTargets.filter(t => t.severity === 'mandatory' && !t.met)
    
    if (mandatoryTargets.length > 0) {
      objs.push({
        id: 'board-targets',
        title: 'Meet Board Expectations',
        description: `${mandatoryTargets.length} mandatory target${mandatoryTargets.length > 1 ? 's' : ''} to complete`,
        progress: boardTargets.filter(t => t.met).length,
        maxProgress: boardTargets.length,
        completed: false,
        priority: 'high',
        icon: Target,
        roleTag: 'business',
      })
    }
    
    // Financial health check
    const runway = team ? calculateRunway(team.budgets?.cash ?? 0, team) : 0
    if (runway < 12 && runway > 0) {
      objs.push({
        id: 'improve-finances',
        title: 'Improve Financial Health',
        description: `Only ${runway} weeks of runway remaining. Increase income or cut costs.`,
        completed: false,
        priority: 'high',
        icon: DollarSign,
        roleTag: 'business',
        action: {
          label: 'View Finances',
          path: '/finances'
        }
      })
    }
    
    // Check for pending sponsor offers
    const pendingOffers = team?.finances?.pendingSponsorOffers ?? []
    if (pendingOffers.length > 0) {
      objs.push({
        id: 'review-sponsors',
        title: 'Review Sponsor Offers',
        description: `${pendingOffers.length} sponsor offer${pendingOffers.length > 1 ? 's' : ''} waiting for your response.`,
        completed: false,
        priority: 'medium',
        icon: FileText,
        roleTag: 'business',
        action: {
          label: 'View Offers',
          path: '/finances'
        }
      })
    }
    
    // === DRIVER-OWNER TENSION ALERTS ===
    
    // High fatigue warning before race week
    const nextRace = calendar.find(r => r.week > currentWeek) ?? currentRace
    const weeksUntilRace = nextRace ? nextRace.week - currentWeek : 99
    const fatigue = player.mentalState?.fatigue ?? 0
    
    if (fatigue >= 60 && weeksUntilRace <= 2) {
      objs.push({
        id: 'high-fatigue-race',
        title: 'Fatigue Alert: Race Coming',
        description: `Fatigue is at ${Math.round(fatigue)}. Consider resting before the race to avoid performance penalties.`,
        completed: false,
        priority: 'high',
        icon: AlertTriangle,
        roleTag: 'racing',
        action: {
          label: 'View Calendar',
          path: '/calendar'
        }
      })
    }
    
    // High stress warning
    const stress = player.mentalState?.stress ?? 0
    if (stress >= 70) {
      objs.push({
        id: 'high-stress',
        title: 'Stress is Mounting',
        description: `Stress at ${Math.round(stress)}. Take personal time or it could affect your driving and decision-making.`,
        completed: false,
        priority: 'high',
        icon: Heart,
        roleTag: 'life',
        action: {
          label: 'Personal Life',
          path: '/personal-life'
        }
      })
    }
    
    // Mandatory activities due today
    const todayMandatory = (careerState.scheduledActivities ?? []).filter(
      a => a.mandatory && 
           a.status === 'scheduled' && 
           a.scheduledWeek === currentWeek && 
           a.scheduledDay === currentDay
    )
    if (todayMandatory.length > 0) {
      objs.push({
        id: 'mandatory-today',
        title: `${todayMandatory.length} Mandatory Event${todayMandatory.length > 1 ? 's' : ''} Today`,
        description: todayMandatory.map(a => a.name).join(', ') + ' — missing these will have consequences.',
        completed: false,
        priority: 'high',
        icon: Clock,
        roleTag: todayMandatory[0].requiresOwner ? 'business' : 'racing',
        action: {
          label: 'View Calendar',
          path: '/calendar'
        }
      })
    }
    
    // Low board mood
    const boardMood = careerState.ownedTeam?.boardMood ?? 50
    if (boardMood < 35) {
      objs.push({
        id: 'board-unhappy',
        title: 'Board Confidence Critical',
        description: `Board mood is at ${Math.round(boardMood)}%. Focus on meeting targets or risk consequences.`,
        completed: false,
        priority: 'high',
        icon: AlertTriangle,
        roleTag: 'business',
      })
    }
    
    // Check for unread emails
    const unreadEmails = careerState.emails?.filter(e => !e.read).length ?? 0
    if (unreadEmails > 3) {
      objs.push({
        id: 'read-emails',
        title: 'Check Your Inbox',
        description: `${unreadEmails} unread emails waiting for your attention.`,
        completed: false,
        priority: 'low',
        icon: FileText,
        roleTag: 'business',
        action: {
          label: 'Open Inbox',
          path: '/emails'
        }
      })
    }
    
    // Development suggestion if idle
    const teamDev = careerState.teamDevelopment
    const hasActiveResearch = teamDev && Object.values(teamDev.areas).some(
      area => area.currentUpgradeId && area.researchProgress < 100
    )
    
    if (!hasActiveResearch && hasCars && hasSeriesEntry) {
      objs.push({
        id: 'start-development',
        title: 'Start R&D Research',
        description: 'No active development. Research upgrades to improve your car.',
        completed: false,
        priority: 'low',
        icon: Wrench,
        roleTag: 'business',
        action: {
          label: 'Development',
          path: '/garage'
        }
      })
    }
    
    // Sort by priority then completion status
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    objs.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
    
    return objs
  }, [player, careerState, series, getSeriesById])
  
  // If no objectives, show a success state
  if (objectives.length === 0) {
    return (
      <Card variant="glass" padding="lg">
        <div className="text-center py-4">
          <CheckCircle2 className="w-12 h-12 mx-auto text-status-success mb-3" />
          <h3 className="font-display font-bold text-lg">All Caught Up!</h3>
          <p className="text-sm text-text-muted mt-1">
            No immediate objectives. Keep racing and building your team!
          </p>
        </div>
      </Card>
    )
  }
  
  // Limit to top 5 objectives
  const displayedObjectives = objectives.slice(0, 5)
  const incompleteCount = objectives.filter(o => !o.completed).length

  return (
    <Card variant="racing" padding="lg">
      <CardHeader 
        title="Current Objectives"
        icon={<Target className="w-5 h-5" />}
        action={
          <Badge variant={incompleteCount > 0 ? 'orange' : 'green'}>
            {incompleteCount > 0 ? `${incompleteCount} Pending` : 'Complete'}
          </Badge>
        }
      />
      
      <div className="space-y-3">
        {displayedObjectives.map((obj, index) => {
          const Icon = obj.icon
          
          return (
            <motion.div
              key={obj.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                p-3 rounded-lg border transition-colors
                ${obj.completed 
                  ? 'bg-status-success/10 border-status-success/30' 
                  : obj.priority === 'high'
                    ? 'bg-accent-orange/10 border-accent-orange/30'
                    : 'bg-surface-secondary/50 border-surface-border'
                }
              `}
            >
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                  ${obj.completed 
                    ? 'bg-status-success/20 text-status-success' 
                    : obj.priority === 'high'
                      ? 'bg-accent-orange/20 text-accent-orange'
                      : 'bg-surface-secondary text-text-muted'
                  }
                `}>
                  {obj.completed ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`font-medium text-sm ${obj.completed ? 'text-status-success' : ''}`}>
                      {obj.title}
                    </h4>
                    {obj.priority === 'high' && !obj.completed && (
                      <Badge variant="orange" size="sm">Priority</Badge>
                    )}
                    {obj.roleTag && !obj.completed && (
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${ROLE_TAG_STYLES[obj.roleTag].bg} ${ROLE_TAG_STYLES[obj.roleTag].text}`}>
                        {ROLE_TAG_STYLES[obj.roleTag].label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{obj.description}</p>
                  
                  {/* Progress Bar */}
                  {obj.progress !== undefined && obj.maxProgress !== undefined && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-text-muted mb-1">
                        <span>Progress</span>
                        <span>{obj.progress}/{obj.maxProgress}</span>
                      </div>
                      <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            obj.completed ? 'bg-status-success' : 'bg-accent-orange'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${(obj.progress / obj.maxProgress) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Action Button */}
                  {obj.action && !obj.completed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 -ml-2"
                      onClick={() => navigate(obj.action!.path)}
                    >
                      {obj.action.label}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
      
      {objectives.length > 5 && (
        <p className="text-xs text-text-muted text-center mt-3">
          +{objectives.length - 5} more objectives
        </p>
      )}
    </Card>
  )
}

// ============================================
// COMMITMENTS PANEL (Promise Tracking)
// ============================================

const PROMISE_STATUS_STYLES: Record<PlayerPromise['status'], { bg: string; text: string; border: string; label: string; icon: typeof Target }> = {
  active: { bg: 'bg-accent-blue/10', text: 'text-accent-blue', border: 'border-accent-blue/30', label: 'Active', icon: Target },
  expiring: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Expiring', icon: ShieldAlert },
  fulfilled: { bg: 'bg-status-success/10', text: 'text-status-success', border: 'border-status-success/30', label: 'Kept', icon: CheckCheck },
  broken: { bg: 'bg-status-error/10', text: 'text-status-error', border: 'border-status-error/30', label: 'Broken', icon: XCircle },
}

const PROMISE_CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  performance: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'Performance' },
  investment: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Investment' },
  wellbeing: { bg: 'bg-pink-500/20', text: 'text-pink-400', label: 'Wellbeing' },
  strategy: { bg: 'bg-violet-500/20', text: 'text-violet-400', label: 'Strategy' },
  development: { bg: 'bg-accent-orange/20', text: 'text-accent-orange', label: 'Development' },
}

export function CommitmentsPanel() {
  const { careerState } = useCareerStore()
  
  const promises = useMemo(() => {
    if (!careerState?.promises) return []
    // Show active/expiring first, then recently resolved
    return [...careerState.promises]
      .sort((a, b) => {
        const statusOrder = { expiring: 0, active: 1, fulfilled: 2, broken: 3 }
        const statusDiff = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
        if (statusDiff !== 0) return statusDiff
        return a.deadlineWeek - b.deadlineWeek
      })
  }, [careerState?.promises])
  
  // Only show active/expiring and recent resolutions
  const currentWeek = careerState?.currentWeek ?? 1
  const displayPromises = promises.filter(p => {
    if (p.status === 'active' || p.status === 'expiring') return true
    // Show fulfilled/broken for 2 weeks after resolution
    const resolvedWeek = p.fulfilledAtWeek ?? p.brokenAtWeek ?? 0
    return (currentWeek - resolvedWeek) <= 2
  }).slice(0, 5)
  
  if (displayPromises.length === 0) return null
  
  const activeCount = promises.filter(p => p.status === 'active' || p.status === 'expiring').length
  const expiringCount = promises.filter(p => p.status === 'expiring').length
  
  return (
    <Card variant="glass" padding="lg" className="mt-4">
      <CardHeader 
        title="Your Commitments"
        icon={<ShieldAlert className="w-5 h-5" />}
        action={
          <div className="flex items-center gap-2">
            {expiringCount > 0 && (
              <Badge variant="orange" size="sm">{expiringCount} Expiring</Badge>
            )}
            <Badge variant={activeCount > 0 ? 'blue' : 'green'} size="sm">
              {activeCount > 0 ? `${activeCount} Active` : 'All Resolved'}
            </Badge>
          </div>
        }
      />
      
      <div className="space-y-2 mt-1">
        {displayPromises.map((promise, index) => {
          const statusStyle = PROMISE_STATUS_STYLES[promise.status]
          const categoryStyle = PROMISE_CATEGORY_STYLES[promise.category] ?? PROMISE_CATEGORY_STYLES.strategy
          const StatusIcon = statusStyle.icon
          const weeksLeft = promise.deadlineWeek - currentWeek
          const isResolved = promise.status === 'fulfilled' || promise.status === 'broken'
          
          return (
            <motion.div
              key={promise.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-3 rounded-lg border transition-colors ${statusStyle.bg} ${statusStyle.border}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${statusStyle.bg} ${statusStyle.text}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`font-medium text-sm ${isResolved ? statusStyle.text : 'text-text-primary'}`}>
                      {promise.shortText}
                    </h4>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${categoryStyle.bg} ${categoryStyle.text}`}>
                      {categoryStyle.label}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                      {statusStyle.label}
                    </span>
                  </div>
                  
                  <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{promise.text}</p>
                  
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-text-muted">
                    {!isResolved && (
                      <span className={`flex items-center gap-1 ${weeksLeft <= 1 ? 'text-amber-400 font-medium' : ''}`}>
                        <Clock className="w-3 h-3" />
                        {weeksLeft <= 0 ? 'Due now' : `${weeksLeft}w left`}
                      </span>
                    )}
                    <span>From: {promise.sourceActivityName}</span>
                    {promise.stakeholders[0] && (
                      <span>Heard by: {promise.stakeholders[0].name}</span>
                    )}
                  </div>
                  
                  {/* Deadline progress bar for active promises */}
                  {!isResolved && (
                    <div className="mt-2">
                      <div className="h-1 bg-surface-secondary rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            weeksLeft <= 1 ? 'bg-amber-400' : 
                            weeksLeft <= 2 ? 'bg-accent-orange' : 
                            'bg-accent-blue'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${Math.max(5, Math.min(100, 
                              ((promise.deadlineWeek - promise.madeAtWeek - weeksLeft) / 
                               Math.max(1, promise.deadlineWeek - promise.madeAtWeek)) * 100
                            ))}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
      
      {promises.filter(p => p.status === 'active' || p.status === 'expiring').length > 5 && (
        <p className="text-xs text-text-muted text-center mt-3">
          +{promises.filter(p => p.status === 'active' || p.status === 'expiring').length - 5} more commitments
        </p>
      )}
    </Card>
  )
}

// Simple runway calculation
function calculateRunway(cash: number, team: any): number {
  if (!team) return 0
  
  const staffCosts = (team.staff?.reduce((sum: number, s: any) => sum + (s.salary || 0), 0) || 0) / 52
  const operationalCosts = (team.budgets?.opex || 0) / 52
  const weeklyBurn = Math.round(staffCosts + operationalCosts + 5000)
  
  return weeklyBurn > 0 ? Math.floor(cash / weeklyBurn) : 999
}
