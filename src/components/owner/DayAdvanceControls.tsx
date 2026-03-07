import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, FastForward, Sun, Moon, Play, Flag, Clock, TrendingUp, TrendingDown, Sunrise, Sunset } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { useCareerStore, getDayName } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import { useNavigate } from 'react-router-dom'
import { EndDayModal } from './EndDayModal'
import { InterruptionModal } from './InterruptionModal'
import { calculateFatigueZone, getDaySummary } from '@/simulation/timeBudget'
import { generateDailyInterruption, type InterruptionEvent, type InterruptionChoice } from '@/simulation/events/interruptions'
import { formatGameHour, getPeriodForHour, getHoursRemainingInPeriod, DAY_PERIODS, DAY_PERIOD_ORDER } from '@/data/day-periods-config'

interface TransitionHighlight {
  id: string
  icon: string
  text: string
  isPositive: boolean
}

interface DayAdvanceControlsProps {
  onDayAdvanced?: () => void
}

export function DayAdvanceControls({ onDayAdvanced }: DayAdvanceControlsProps) {
  const navigate = useNavigate()
  const {
    careerState,
    player,
    advanceDay,
    getActivitiesForDay,
    fastForwardPeriod,
    startFastForwardToRaceWeek,
    stopFastForward
  } = useCareerStore()
  const { getSeriesById } = useRivalStore()
  
  const [showTransition, setShowTransition] = useState(false)
  const [transitionInfo, setTransitionInfo] = useState({ day: 1, week: 1, year: 2024 })
  const [showEndDayModal, setShowEndDayModal] = useState(false)
  const [pendingInterruption, setPendingInterruption] = useState<InterruptionEvent | null>(null)
  const [showInterruption, setShowInterruption] = useState(false)
  const [transitionHighlights, setTransitionHighlights] = useState<TransitionHighlight[]>([])
  const previousAutoFastForwarding = useRef(false)
  
  if (!careerState || !player) return null
  
  const currentDay = careerState.currentDay ?? 1
  const currentWeek = careerState.currentWeek
  const currentYear = careerState.currentYear
  const dayName = getDayName(currentDay)
  
  // Get current series calendar (fallback to first entered series if currentSeriesId is not set)
  const resolvedSeriesId = player.currentSeriesId || careerState.seriesEntries?.[0]?.seriesId
  const currentSeries = resolvedSeriesId ? getSeriesById(resolvedSeriesId) : null
  const calendar = currentSeries?.calendar ?? []
  
  // Find upcoming race
  const currentRace = calendar.find(r => r.week === currentWeek)
  const nextRace = calendar.find(r => r.week > currentWeek)
  const upcomingRace = currentRace || nextRace
  
  // Check if it's race day (Sunday of race week)
  const isRaceDay = currentRace && currentDay === 7
  const isRaceWeekend = currentRace && currentDay >= 5  // Friday, Saturday, Sunday
  const isAutoFastForwarding = careerState.fastForward?.isActive ?? false
  const fastForwardTargetWeek = careerState.fastForward?.targetWeek
  const fastForwardTargetDay = careerState.fastForward?.targetDay
  const fastForwardStopReason = careerState.fastForward?.lastStopReason
  const fastForwardStopMessage = careerState.fastForward?.lastStopMessage
  const fastForwardLastSummary = careerState.fastForward?.lastSummary
  
  // Calculate days/weeks until next race
  const daysUntilRaceThisWeek = currentRace ? 7 - currentDay : null
  const weeksUntilNextRace = nextRace ? nextRace.week - currentWeek : null
  
  // Time budget info
  const dayBudget = careerState.dayBudget
  const daySummary = dayBudget ? getDaySummary(dayBudget) : null
  const hoursRemaining = daySummary?.hoursRemaining ?? dayBudget?.hoursRemaining ?? 16
  const activitiesCompleted = daySummary?.activitiesCompleted ?? dayBudget?.dayLog?.length ?? 0
  const fatigueZone = dayBudget ? calculateFatigueZone(dayBudget.hoursUsed) : 'green'
  const missedNotificationsToday = (careerState.missedNotifications ?? []).filter(
    notification => notification.timestamp.week === currentWeek
      && notification.timestamp.day === currentDay
      && notification.timestamp.year === currentYear
  )
  const incompleteActivities = getActivitiesForDay ? getActivitiesForDay(currentWeek, currentDay) : []

  const handleAdvanceDay = () => {
    // Show End Day summary modal before advancing
    setShowEndDayModal(true)
  }
  
  const handleConfirmEndDay = () => {
    setShowEndDayModal(false)

    // Only surface random interruption events during race weekend.
    const shouldAllowRandomInterruption = !!currentRace && currentDay >= 5
    if (shouldAllowRandomInterruption) {
      const interruption = generateDailyInterruption({
        currentWeek,
        currentDay,
        currentYear,
        isRaceWeek: !!currentRace,
        isRaceDay: !!(currentRace && currentDay === 7),
        reputation: careerState.ownedTeam?.reputation ?? player.reputation ?? 0,
        fatigue: player.mentalState?.fatigue ?? 0,
        stress: player.mentalState?.stress ?? 0,
        hasPartner: !!(careerState.personalLife as unknown as Record<string, unknown>)?.partner,
        staffCount: careerState.ownedTeam?.staff?.length ?? 0,
        teamCash: careerState.ownedTeam?.budgets?.cash ?? 0,
        personalCash: player.finances?.bankBalance ?? 0,
        boardMood: careerState.ownedTeam?.boardMood ?? 50,
      })

      if (interruption) {
        // Show the interruption modal before advancing
        setPendingInterruption(interruption.event)
        setShowInterruption(true)
        return // Don't advance yet - wait for player choice
      }
    }

    // No interruption - advance normally
    proceedWithDayAdvance()
  }
  
  const handleInterruptionChoice = useCallback((choice: InterruptionChoice) => {
    setShowInterruption(false)
    setPendingInterruption(null)
    
    // Apply choice effects to game state
    // Note: effects are applied through the store's existing mechanisms
    const { player: currentPlayer, careerState: currentState } = useCareerStore.getState()
    if (currentPlayer && currentState) {
      const updates: Record<string, unknown> = {}
      const playerUpdates: Record<string, unknown> = {}
      
      for (const [stat, value] of Object.entries(choice.effects)) {
        switch (stat) {
          case 'reputation':
            playerUpdates.reputation = Math.max(0, Math.min(100, (currentPlayer.reputation ?? 0) + value))
            break
          case 'fatigue':
            playerUpdates.mentalState = {
              ...currentPlayer.mentalState,
              fatigue: Math.max(0, Math.min(100, (currentPlayer.mentalState?.fatigue ?? 0) + value))
            }
            break
          case 'stress':
            playerUpdates.mentalState = {
              ...(playerUpdates.mentalState ?? currentPlayer.mentalState),
              stress: Math.max(0, Math.min(100, (currentPlayer.mentalState?.stress ?? 0) + value))
            }
            break
          case 'confidence':
            playerUpdates.mentalState = {
              ...(playerUpdates.mentalState ?? currentPlayer.mentalState),
              confidence: Math.max(0, Math.min(100, (currentPlayer.mentalState?.confidence ?? 50) + value))
            }
            break
          case 'fitness':
            playerUpdates.stats = {
              ...currentPlayer.stats,
              fitness: Math.max(0, Math.min(100, (currentPlayer.stats?.fitness ?? 50) + value))
            }
            break
          case 'cash':
            playerUpdates.finances = {
              ...currentPlayer.finances,
              bankBalance: (currentPlayer.finances?.bankBalance ?? 0) + value
            }
            break
          case 'teamCash':
            if (currentState.ownedTeam?.budgets) {
              updates.ownedTeam = {
                ...currentState.ownedTeam,
                budgets: {
                  ...currentState.ownedTeam.budgets,
                  cash: (currentState.ownedTeam.budgets.cash ?? 0) + value
                }
              }
            }
            break
          case 'morale':
            if (currentState.ownedTeam) {
              updates.ownedTeam = {
                ...(updates.ownedTeam ?? currentState.ownedTeam),
                teamMorale: Math.max(0, Math.min(100, (currentState.ownedTeam.teamMorale ?? 50) + value))
              }
            }
            break
          case 'boardMood':
            if (currentState.ownedTeam) {
              updates.ownedTeam = {
                ...(updates.ownedTeam ?? currentState.ownedTeam),
                boardMood: Math.max(0, Math.min(100, (currentState.ownedTeam.boardMood ?? 50) + value))
              }
            }
            break
          case 'fanSentiment':
            if (currentState.ownedTeam) {
              updates.ownedTeam = {
                ...(updates.ownedTeam ?? currentState.ownedTeam),
                fanSentiment: Math.max(0, Math.min(100, (currentState.ownedTeam.fanSentiment ?? 50) + value))
              }
            }
            break
        }
      }
      
      // Apply time cost (also advance the clock)
      if (choice.timeCost > 0 && currentState.dayBudget) {
        updates.dayBudget = {
          ...currentState.dayBudget,
          hoursUsed: currentState.dayBudget.hoursUsed + choice.timeCost,
          hoursRemaining: Math.max(0, currentState.dayBudget.hoursRemaining - choice.timeCost),
          currentHour: Math.min(23, (currentState.dayBudget.currentHour ?? 7) + choice.timeCost),
        }
      }
      
      // Update store
      if (Object.keys(playerUpdates).length > 0) {
        useCareerStore.setState({ player: { ...currentPlayer, ...playerUpdates } as typeof currentPlayer })
      }
      if (Object.keys(updates).length > 0) {
        useCareerStore.setState({ careerState: { ...currentState, ...updates } as typeof currentState })
      }
    }
    
    // Now proceed with day advance
    proceedWithDayAdvance()
  }, [])
  
  const captureStateSnapshot = () => {
    const s = useCareerStore.getState()
    const p = s.player
    const c = s.careerState
    return {
      fatigue: p?.mentalState?.fatigue ?? 0,
      stress: p?.mentalState?.stress ?? 0,
      confidence: p?.mentalState?.confidence ?? 50,
      morale: p?.mentalState?.morale ?? 50,
      fitness: p?.health?.fitness ?? 50,
      reputation: p?.reputation ?? 0,
      cash: p?.finances?.bankBalance ?? 0,
      teamCash: c?.ownedTeam?.budgets?.cash ?? 0,
      boardMood: c?.ownedTeam?.boardMood ?? 50,
      teamMorale: c?.ownedTeam?.teamMorale ?? 50,
    }
  }
  
  const generateHighlights = (before: Record<string, number>, after: Record<string, number>): TransitionHighlight[] => {
    const highlights: TransitionHighlight[] = []
    const labels: Record<string, { label: string; positiveUp: boolean; iconUp: string; iconDown: string }> = {
      fatigue: { label: 'Fatigue', positiveUp: false, iconUp: '😰', iconDown: '😌' },
      stress: { label: 'Stress', positiveUp: false, iconUp: '😬', iconDown: '😊' },
      confidence: { label: 'Confidence', positiveUp: true, iconUp: '💪', iconDown: '😔' },
      morale: { label: 'Morale', positiveUp: true, iconUp: '🙌', iconDown: '😞' },
      fitness: { label: 'Fitness', positiveUp: true, iconUp: '🏃', iconDown: '📉' },
      reputation: { label: 'Reputation', positiveUp: true, iconUp: '⭐', iconDown: '📉' },
      boardMood: { label: 'Board Mood', positiveUp: true, iconUp: '👔', iconDown: '😠' },
      teamMorale: { label: 'Team Morale', positiveUp: true, iconUp: '🤝', iconDown: '😤' },
    }
    
    for (const [key, config] of Object.entries(labels)) {
      const delta = (after[key] ?? 0) - (before[key] ?? 0)
      if (Math.abs(delta) >= 1) {
        const isUp = delta > 0
        const isPositive = config.positiveUp ? isUp : !isUp
        highlights.push({
          id: key,
          icon: isPositive ? config.iconUp : config.iconDown,
          text: `${config.label} ${isUp ? '+' : ''}${Math.round(delta)}`,
          isPositive
        })
      }
    }
    
    // Cash changes (larger threshold)
    const cashDelta = (after.cash ?? 0) - (before.cash ?? 0)
    if (Math.abs(cashDelta) >= 100) {
      highlights.push({
        id: 'cash',
        icon: cashDelta > 0 ? '💰' : '💸',
        text: `Balance ${cashDelta > 0 ? '+' : ''}$${cashDelta.toLocaleString()}`,
        isPositive: cashDelta > 0
      })
    }
    
    const teamCashDelta = (after.teamCash ?? 0) - (before.teamCash ?? 0)
    if (Math.abs(teamCashDelta) >= 500) {
      highlights.push({
        id: 'teamCash',
        icon: teamCashDelta > 0 ? '🏦' : '📊',
        text: `Team Budget ${teamCashDelta > 0 ? '+' : ''}$${teamCashDelta.toLocaleString()}`,
        isPositive: teamCashDelta > 0
      })
    }
    
    return highlights.slice(0, 4) // Max 4 highlights
  }
  
  const proceedWithDayAdvance = () => {
    const beforeState = captureStateSnapshot()
    
    const newDay = currentDay >= 7 ? 1 : currentDay + 1
    const newWeek = currentDay >= 7 ? currentWeek + 1 : currentWeek
    const newYear = currentDay >= 7 && currentWeek >= 52 ? currentYear + 1 : currentYear
    
    setTransitionInfo({ day: newDay, week: newWeek > 52 ? 1 : newWeek, year: newYear })
    setShowTransition(true)
    
    advanceDay()
    
    // advanceDay is synchronous and captureStateSnapshot reads from getState(),
    // so the store is already up-to-date — no setTimeout needed.
    const afterState = captureStateSnapshot()
    const highlights = generateHighlights(beforeState, afterState)
    setTransitionHighlights(highlights)
    
    const dismissDelay = highlights.length > 0 ? 2200 : 1500
    setTimeout(() => {
      setShowTransition(false)
      setTransitionHighlights([])
      onDayAdvanced?.()
    }, dismissDelay)
  }
  
  const handleSkipToRace = () => {
    const result = startFastForwardToRaceWeek()
    if (!result.success && result.reason) {
      console.warn('[DayAdvanceControls] Failed to start fast forward:', result.reason)
    }
  }
  
  const handleGoToRaceDay = () => {
    navigate('/race-day')
  }

  useEffect(() => {
    if (previousAutoFastForwarding.current && !isAutoFastForwarding) {
      onDayAdvanced?.()
    }
    previousAutoFastForwarding.current = isAutoFastForwarding
  }, [isAutoFastForwarding, onDayAdvanced])
  
  return (
    <>
      {/* Day/Week Display */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {currentDay <= 5 ? (
            <Sun className="w-5 h-5 text-accent-gold" />
          ) : (
            <Moon className="w-5 h-5 text-accent-blue" />
          )}
          <div>
            <p className="font-display font-bold text-lg">{dayName}</p>
            <p className="text-xs text-text-muted">Week {currentWeek}, {currentYear}</p>
          </div>
        </div>
        
        {/* Race Week Indicator */}
        {currentRace && (
          <Badge variant="red" size="lg" className="animate-pulse">
            <Flag className="w-4 h-4 mr-1" />
            Race Week
          </Badge>
        )}
      </div>
      
      {/* Current Time + Period + Hours Remaining */}
      {dayBudget && !isRaceDay && (() => {
        const currentHour = dayBudget.currentHour ?? 7
        const period = getPeriodForHour(currentHour)
        const periodConfig = DAY_PERIODS[period]
        const PeriodIcon = period === 'morning' ? Sunrise : period === 'night' ? Moon : period === 'evening' ? Sunset : Sun
        
        return (
          <div className="flex items-center gap-2">
            {/* Time of day display */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-dark/50 border border-border/20">
              <PeriodIcon className="w-3.5 h-3.5 text-text-muted" />
              <span className="font-mono text-sm text-text-secondary">
                {formatGameHour(currentHour)}
              </span>
              <span className="text-[10px] text-text-muted">
                {periodConfig.shortLabel}
              </span>
            </div>
            
            {/* Hours remaining badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
              fatigueZone === 'green' ? 'bg-status-success/10 border-status-success/30' :
              fatigueZone === 'yellow' ? 'bg-accent-orange/10 border-accent-orange/30' :
              'bg-accent-red/10 border-accent-red/30'
            }`}>
              <Clock className={`w-4 h-4 ${
                fatigueZone === 'green' ? 'text-status-success' :
                fatigueZone === 'yellow' ? 'text-accent-orange' :
                'text-accent-red'
              }`} />
              <span className={`font-mono font-bold text-sm ${
                fatigueZone === 'green' ? 'text-status-success' :
                fatigueZone === 'yellow' ? 'text-accent-orange' :
                'text-accent-red'
              }`}>
                {hoursRemaining}h left
              </span>
            </div>
          </div>
        )
      })()}
      
      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        {isRaceDay ? (
          <Button 
            variant="primary"
            onClick={handleGoToRaceDay}
          >
            <Play className="w-4 h-4 mr-2" />
            Go to Race
          </Button>
        ) : (
          <>
            {(() => {
              const curHour = dayBudget?.currentHour ?? 7
              const curPeriod = getPeriodForHour(curHour)
              const isNight = curPeriod === 'night'
              const noHours = hoursRemaining <= 0
              const showEndDay = isNight || noHours
              
              if (showEndDay) {
                return (
                  <Button 
                    variant={noHours ? 'primary' : 'secondary'}
                    onClick={handleAdvanceDay}
                      disabled={isAutoFastForwarding}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    End Day
                  </Button>
                )
              }
              
              // Show Fast Forward + secondary End Day
              const currentIdx = DAY_PERIOD_ORDER.indexOf(curPeriod)
              const nextPeriod = currentIdx < DAY_PERIOD_ORDER.length - 1 ? DAY_PERIOD_ORDER[currentIdx + 1] : 'night'
              const nextLabel = DAY_PERIODS[nextPeriod].shortLabel
              
              return (
                <>
                  <Button 
                    variant="primary"
                    onClick={() => fastForwardPeriod()}
                    disabled={isAutoFastForwarding}
                  >
                    <FastForward className="w-4 h-4 mr-2" />
                    Fast Forward to {nextLabel}
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={handleAdvanceDay}
                    disabled={isAutoFastForwarding}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    End Day
                  </Button>
                </>
              )
            })()}
            
            {!isAutoFastForwarding && upcomingRace && !isRaceWeekend && (
              <Button 
                variant="primary"
                onClick={handleSkipToRace}
              >
                <FastForward className="w-4 h-4 mr-2" />
                Advance to {currentRace ? 'Race Weekend' : `${upcomingRace.trackName.split(' ')[0]} (W${upcomingRace.week})`}
              </Button>
            )}
            {isAutoFastForwarding && (
              <Button
                variant="primary"
                onClick={() => stopFastForward('manual', 'Fast forward stopped by player.')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Stop Fast Forward
              </Button>
            )}
          </>
        )}
      </div>
      {isAutoFastForwarding && (
        <p className="text-xs text-text-muted">
          Fast-forwarding to Week {fastForwardTargetWeek ?? currentWeek}, Day {fastForwardTargetDay ?? 1}...
        </p>
      )}
      {!isAutoFastForwarding && fastForwardStopReason === 'critical_event' && fastForwardStopMessage && (
        <p className="text-xs text-accent-orange">
          Fast forward paused: {fastForwardStopMessage}
        </p>
      )}
      {!isAutoFastForwarding && fastForwardStopReason === 'completed' && fastForwardLastSummary && (
        <p className="text-xs text-status-success">
          Skip complete: {fastForwardLastSummary.skippedDays} days, Rep {fastForwardLastSummary.reputationDelta >= 0 ? '+' : ''}{fastForwardLastSummary.reputationDelta}, Cash {fastForwardLastSummary.personalCashDelta >= 0 ? '+' : ''}${fastForwardLastSummary.personalCashDelta.toLocaleString()}.
        </p>
      )}
      {!isAutoFastForwarding && fastForwardStopReason === 'manual' && fastForwardLastSummary && (
        <p className="text-xs text-text-muted">
          Skip stopped: {fastForwardLastSummary.skippedDays} days simulated.
        </p>
      )}
      
      {/* End Day Summary Modal */}
      <EndDayModal
        isOpen={showEndDayModal}
        onClose={() => setShowEndDayModal(false)}
        onConfirm={handleConfirmEndDay}
        hoursRemaining={hoursRemaining}
        activitiesCompleted={activitiesCompleted}
        missedNotifications={missedNotificationsToday}
        incompleteActivities={incompleteActivities}
      />
      
      {/* Interruption Event Modal */}
      <InterruptionModal
        isOpen={showInterruption}
        event={pendingInterruption}
        hoursRemaining={hoursRemaining}
        onChoice={handleInterruptionChoice}
      />
      
      {/* Transition Overlay */}
      <AnimatePresence>
        {showTransition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.1, opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-center"
            >
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent-red to-accent-orange flex items-center justify-center"
              >
                <Calendar className="w-12 h-12 text-white" />
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-text-muted text-lg mb-2"
              >
                TIME ADVANCES
              </motion.p>
              
              <motion.h2
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', bounce: 0.3 }}
                className="font-display font-black text-4xl bg-gradient-to-r from-accent-red via-accent-orange to-accent-gold bg-clip-text text-transparent"
              >
                {getDayName(transitionInfo.day)}
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-text-secondary text-xl mt-2"
              >
                Week {transitionInfo.week}, Season {transitionInfo.year}
              </motion.p>
              
              {/* Transition Highlights */}
              {transitionHighlights.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-wrap justify-center gap-2 mt-6 max-w-md mx-auto"
                >
                  {transitionHighlights.map((highlight, i) => (
                    <motion.div
                      key={highlight.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                        highlight.isPositive 
                          ? 'bg-status-success/20 text-status-success border border-status-success/30' 
                          : 'bg-status-error/20 text-status-error border border-status-error/30'
                      }`}
                    >
                      <span>{highlight.icon}</span>
                      <span>{highlight.text}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
              
              {/* Progress dots */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: transitionHighlights.length > 0 ? 0.9 : 0.6 }}
                className="flex justify-center gap-2 mt-6"
              >
                {[...Array(7)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i + 1 === transitionInfo.day ? 'bg-accent-red' : 'bg-surface-secondary'
                    }`}
                    animate={i + 1 === transitionInfo.day ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.5, repeat: 2 }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
