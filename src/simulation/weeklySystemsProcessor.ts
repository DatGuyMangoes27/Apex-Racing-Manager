/**
 * Weekly Systems Processor
 * 
 * Bridge module that orchestrates all the orphaned simulation systems
 * (pressure, relationships, health/injury, media effects) during weekly processing.
 * 
 * This module is called from advanceWeek() to avoid making large edits to careerStore.ts.
 * It reads current state, runs all subsystems, and returns a bundle of effects to apply.
 */

import { getStaffNameOrFallback } from '@/services/eventContentGenerator'
import {
  calculatePressure,
  calculatePressureAIModifier,
  processWeeklyPressure,
  createPressureEvent,
  getPressureStatus,
  getBackgroundPressureDescription,
  type PressureState,
  type PressureEffect
} from '@/simulation/pressure'

import {
  processWeeklyRelationships,
  updateTeamRelationshipFromRace,
  getTeamRelationshipStatus,
  createDefaultRelationshipState,
  checkRivalryEvents,
  type RelationshipState
} from '@/simulation/relationships'

import {
  checkRandomInjury,
  checkOvertrainingInjury,
  processInjuryHealing as healthProcessInjuryHealing,
  createInjuryEvent,
  getInjuryStatusText,
  type InjuryState as HealthInjuryState
} from '@/simulation/health'

import {
  calculateMediaScoreModifier,
  checkPromiseFulfillment,
  calculatePromiseFulfillmentEffects,
  calculatePromiseBreakEffects,
  aggregateEffects,
  type MediaEffect
} from '@/simulation/mediaEffects'

import {
  processWeeklyPromises,
  type PlayerPromise,
  type PromiseEvaluationContext,
  type PromiseProcessingResult
} from '@/simulation/promises'

// ============================================
// TYPES
// ============================================

export interface WeeklyProcessingContext {
  // Player state
  playerReputation: number
  playerFatigue: number
  playerFitness: number
  playerStress: number
  playerConfidence: number
  playerMentalStrength: number
  playerNationality: string
  playerBackground?: any
  playerStats: any
  
  // Championship state
  championshipPosition: number
  pointsToLeader: number
  roundsRemaining: number
  totalRounds: number
  isHomeRace: boolean
  isContractYear: boolean
  recentResults: any[]
  
  // Team state
  hasOwnedTeam: boolean
  boardMood: number
  teamMorale: number
  teamCash: number
  staffCount: number
  
  // Calendar state
  currentWeek: number
  currentYear: number
  isRaceWeek: boolean
  
  // Media state
  mediaState?: any
  upgradesMade?: string[]
  performanceImprovement?: number
  
  // Existing states to process
  existingPressureState?: PressureState
  existingRelationshipState?: RelationshipState
  existingInjuryState?: HealthInjuryState
  latestRaceResult?: { position: number; expectedPosition: number; dnf?: boolean }
  
  // Promise system data
  promises?: PlayerPromise[]
  sponsorSatisfaction?: number
  driverMorale?: number
  fanSentiment?: number
  recentRaceResults?: { position: number; week: number }[]
  recentSpending?: { category: string; amount: number; week: number }[]
  scheduledActivities?: { category: string; week: number; status: string }[]
}

export interface WeeklyProcessingResult {
  // Pressure system results
  pressureState: PressureState
  pressureEffect: PressureEffect
  pressureEmail?: {
    subject: string
    body: string
    category: string
    sender: string
    senderRole: string
  }
  
  // Relationship system results
  relationshipState: RelationshipState
  relationshipEmails: Array<{
    subject: string
    body: string
    category: string
    sender: string
    senderRole: string
  }>
  
  // Health system results
  injuryOccurred: boolean
  newInjury?: HealthInjuryState
  injuryState?: HealthInjuryState
  injuryEmail?: {
    subject: string
    body: string
    category: string
    sender: string
    senderRole: string
  }
  
  // Media effects results  
  mediaScoreModifier: number
  promiseResults: Array<{
    promiseId: string
    fulfilled: boolean
    broken: boolean
    effects: MediaEffect[]
  }>
  
  // Promise system results
  promiseProcessingResult?: PromiseProcessingResult
  promiseEmails: Array<{
    subject: string
    body: string
    category: string
    sender: string
    senderRole: string
  }>
  
  // Aggregate stat changes to apply
  statChanges: {
    stress: number
    confidence: number
    boardMood: number
    teamMorale: number
    reputation: number
    fanSentiment: number
    sponsorSatisfaction: number
  }
}

// ============================================
// MAIN PROCESSING FUNCTION
// ============================================

export function processWeeklySystems(ctx: WeeklyProcessingContext): WeeklyProcessingResult {
  const result: WeeklyProcessingResult = {
    pressureState: ctx.existingPressureState || {
      currentPressure: 20,
      pressureType: 'normal',
      titleFight: false,
      homeRace: false,
      lastResult: 'none',
      streakType: 'none',
      streakLength: 0
    },
    pressureEffect: {
      aiModifier: 0,
      reputationMultiplier: 1,
      stressChange: 0,
      description: 'No significant pressure'
    },
    relationshipState: ctx.existingRelationshipState || createDefaultRelationshipState(),
    relationshipEmails: [],
    injuryOccurred: false,
    injuryState: ctx.existingInjuryState,
    mediaScoreModifier: 0,
    promiseResults: [],
    promiseEmails: [],
    statChanges: {
      stress: 0,
      confidence: 0,
      boardMood: 0,
      teamMorale: 0,
      reputation: 0,
      fanSentiment: 0,
      sponsorSatisfaction: 0
    }
  }
  
  // ============================================
  // 1. PRESSURE SYSTEM
  // ============================================
  try {
    const pressureState = calculatePressure(
      ctx.championshipPosition,
      ctx.pointsToLeader,
      ctx.roundsRemaining,
      ctx.totalRounds,
      ctx.isHomeRace,
      ctx.isContractYear,
      ctx.recentResults,
      ctx.playerBackground
    )
    
    // Process weekly pressure decay/growth
    const processedPressure = processWeeklyPressure(
      pressureState.currentPressure,
      ctx.isRaceWeek
    )
    pressureState.currentPressure = processedPressure
    
    // Calculate pressure effects on the player
    const pressureEffect = calculatePressureAIModifier(
      pressureState,
      ctx.playerMentalStrength
    )
    
    result.pressureState = pressureState
    result.pressureEffect = pressureEffect
    result.statChanges.stress += pressureEffect.stressChange
    
    // Generate pressure email for high pressure situations
    const pressureEvent = createPressureEvent(pressureState, ctx.currentWeek, ctx.currentYear)
    if (pressureEvent) {
      const status = getPressureStatus(pressureState.currentPressure)
      const bgDescription = ctx.playerBackground 
        ? getBackgroundPressureDescription(ctx.playerBackground) 
        : null
      
      result.pressureEmail = {
        subject: `${status.icon} ${pressureEvent.title}`,
        body: `**Championship Pressure Report — Week ${ctx.currentWeek}**\n\n` +
          `Current pressure level: **${status.level}** (${pressureState.currentPressure}/100)\n\n` +
          `${pressureEffect.description}\n\n` +
          (pressureState.titleFight ? '🏆 You are in a **title fight**! Every point matters.\n\n' : '') +
          (pressureState.streakType === 'winning' ? `🔥 ${pressureState.streakLength}-race winning streak building momentum.\n` : '') +
          (pressureState.streakType === 'losing' ? `⚠️ ${pressureState.streakLength}-race losing streak adding pressure.\n` : '') +
          (bgDescription ? `\n_${bgDescription}_` : '') +
          (pressureEffect.stressChange > 0 ? `\n\n⚡ Stress impact: +${pressureEffect.stressChange} this week` : '') +
          (pressureEffect.stressChange < 0 ? `\n\n😌 Pressure relief: ${pressureEffect.stressChange} stress this week` : ''),
        category: 'personal',
        sender: 'Sports Psychologist',
        senderRole: 'Mental Performance'
      }
    }
  } catch (e) {
    console.warn('[WeeklySystems] Pressure system error:', e)
  }
  
  // ============================================
  // 2. RELATIONSHIP SYSTEM
  // ============================================
  try {
    // Process weekly relationship drift
    const updatedRelationships = processWeeklyRelationships(result.relationshipState)
    result.relationshipState = updatedRelationships

    if (ctx.latestRaceResult) {
      result.relationshipState = updateTeamRelationshipFromRace(
        result.relationshipState,
        ctx.latestRaceResult
      )
    }
    
    // Check for relationship milestone emails
    const teamRel = result.relationshipState.teamRelationship
    const teamStatus = getTeamRelationshipStatus(teamRel)
    
    // Generate emails for extreme relationship states
    if (teamRel <= 25 && ctx.hasOwnedTeam) {
      result.relationshipEmails.push({
        subject: '⚠️ Team Morale Warning: Staff Dissatisfaction Rising',
        body: `The team atmosphere has deteriorated significantly.\n\n` +
          `**Team Relationship: ${teamStatus.status}** (${Math.round(teamRel)}/100)\n\n` +
          `Effects:\n${teamStatus.effects.map(e => `- ${e.description}`).join('\n')}\n\n` +
          `Consider attending team events, providing positive feedback after races, and investing in staff welfare to improve relations.`,
        category: 'team',
        sender: getStaffNameOrFallback('team_manager', 'Team Operations'),
        senderRole: 'Operations'
      })
      result.statChanges.teamMorale -= 3
    } else if (teamRel >= 85) {
      // Occasional positive feedback at high relationship
      if (Math.random() < 0.15) {
        result.relationshipEmails.push({
          subject: '💪 Team Spirit at All-Time High',
          body: `The team is buzzing with positive energy!\n\n` +
            `**Team Relationship: ${teamStatus.status}** (${Math.round(teamRel)}/100)\n\n` +
            `Benefits:\n${teamStatus.effects.map(e => `- ${e.description}`).join('\n')}\n\n` +
            `Your leadership and results are keeping everyone motivated. Keep it up!`,
          category: 'team',
          sender: getStaffNameOrFallback('team_manager', 'Team Operations'),
          senderRole: 'Operations'
        })
        result.statChanges.teamMorale += 2
      }
    }
    
    // Engineer relationship effects
    const engRel = updatedRelationships.engineerRelationship
    if (engRel <= 30) {
      result.statChanges.confidence -= 2
      if (Math.random() < 0.2) {
        result.relationshipEmails.push({
          subject: 'Communication Breakdown with Race Engineer',
          body: `Your race engineer has flagged that communication during sessions has been strained.\n\n` +
            `**Engineer Relationship:** ${Math.round(engRel)}/100\n\n` +
            `This may affect setup quality and race strategy calls. Consider scheduling debrief sessions to rebuild trust.`,
          category: 'team',
          sender: 'Race Engineer',
          senderRole: 'Engineering'
        })
      }
    } else if (engRel >= 80) {
      result.statChanges.confidence += 1
    }
    
    // Rival relationship drama emails
    for (const rival of updatedRelationships.rivalRelationships) {
      if (rival.isActive && rival.rivalryIntensity >= 70 && Math.random() < 0.25) {
        result.relationshipEmails.push({
          subject: `Rivalry with ${rival.driverName} Intensifying`,
          body: `The rivalry with **${rival.driverName}** continues to heat up.\n\n` +
            `Rivalry Intensity: **${rival.rivalryIntensity}/100**\n` +
            `Relationship: **${rival.relationship > 0 ? 'Respectful' : rival.relationship > -50 ? 'Tense' : 'Hostile'}**\n\n` +
            (rival.history.length > 0 
              ? `Recent incident: _${rival.history[rival.history.length - 1].description}_\n\n`
              : '') +
            `The media and fans are watching this closely. How you handle this rivalry could define your season.`,
          category: 'personal',
          sender: 'Media Relations',
          senderRole: 'PR Department'
        })
      }
    }
  } catch (e) {
    console.warn('[WeeklySystems] Relationship system error:', e)
  }
  
  // ============================================
  // 3. HEALTH / INJURY SYSTEM
  // ============================================
  try {
    if (result.injuryState) {
      result.injuryState = healthProcessInjuryHealing(result.injuryState, ctx.playerFitness)
    }

    // Random injury check (0.5% base chance per week)
    const randomInjury = checkRandomInjury(ctx.playerStats)
    if (randomInjury) {
      result.injuryOccurred = true
      result.newInjury = randomInjury
      result.injuryState = randomInjury
      
      const injuryEvent = createInjuryEvent(randomInjury, ctx.currentWeek, ctx.currentYear)
      result.injuryEmail = {
        subject: `🏥 Injury Report: ${injuryEvent.title}`,
        body: `**Medical Report — Week ${ctx.currentWeek}**\n\n` +
          `Diagnosis: **${injuryEvent.title}** (${randomInjury.severity})\n` +
          `${injuryEvent.description}\n\n` +
          `Recovery time: **${randomInjury.recoveryWeeksRemaining} week(s)**\n` +
          `AI difficulty impact: **+${(injuryEvent.aiPenalty * 100).toFixed(1)}%**\n\n` +
          (injuryEvent.trainingRestrictions.length > 0 
            ? `Training restrictions:\n${injuryEvent.trainingRestrictions.map(r => `- ${r} (unavailable during recovery)`).join('\n')}\n\n`
            : '') +
          `Focus on recovery. Higher fitness levels will speed up healing.`,
        category: 'personal',
        sender: 'Team Doctor',
        senderRole: 'Medical'
      }
    }
    
    // Overtraining check (when fatigue is very high)
    if (!result.injuryOccurred && ctx.playerFatigue >= 90) {
      const overtrainingInjury = checkOvertrainingInjury(ctx.playerStats, ctx.playerFatigue)
      if (overtrainingInjury) {
        result.injuryOccurred = true
        result.newInjury = overtrainingInjury
        result.injuryState = overtrainingInjury
        
        const injuryEvent = createInjuryEvent(overtrainingInjury, ctx.currentWeek, ctx.currentYear)
        result.injuryEmail = {
          subject: `⚠️ Overtraining Alert: ${injuryEvent.title}`,
          body: `**Medical Report — Week ${ctx.currentWeek}**\n\n` +
            `Your body has reached its limits.\n\n` +
            `Diagnosis: **${injuryEvent.title}** (${overtrainingInjury.severity})\n` +
            `Cause: Overtraining (fatigue at ${ctx.playerFatigue}%)\n\n` +
            `Recovery time: **${overtrainingInjury.recoveryWeeksRemaining} week(s)**\n\n` +
            `You need to manage your workload better. Consider scheduling more rest days and monitoring your fatigue levels.`,
          category: 'personal',
          sender: 'Team Doctor',
          senderRole: 'Medical'
        }
      }
    }
  } catch (e) {
    console.warn('[WeeklySystems] Health system error:', e)
  }
  
  // ============================================
  // 4. MEDIA EFFECTS SYSTEM
  // ============================================
  try {
    if (ctx.mediaState?.dutySchedule) {
      result.mediaScoreModifier = calculateMediaScoreModifier(ctx.mediaState)
      
      // Check promise fulfillment
      const activePromises = ctx.mediaState.dutySchedule.activePromises || []
      for (const promise of activePromises) {
        if (promise.fulfilled || promise.broken) continue
        
        const fulfillmentCheck = checkPromiseFulfillment(promise, {
          currentWeek: ctx.currentWeek,
          currentYear: ctx.currentYear,
          recentResults: ctx.recentResults.map(r => ({
            position: r.racePosition || 99,
            trackName: r.trackName || ''
          })),
          upgradesMade: ctx.upgradesMade || [],
          performanceImprovement: ctx.performanceImprovement || 0
        })
        
        if (fulfillmentCheck.fulfilled) {
          const weeksEarly = promise.deadline - ctx.currentWeek
          const effects = calculatePromiseFulfillmentEffects(promise, Math.max(0, weeksEarly))
          result.promiseResults.push({
            promiseId: promise.id,
            fulfilled: true,
            broken: false,
            effects
          })
          
          // Apply aggregated effects
          const agg = aggregateEffects(effects)
          result.statChanges.reputation += agg.get('reputation') || 0
          result.statChanges.fanSentiment += agg.get('fanSentiment') || 0
          result.statChanges.sponsorSatisfaction += agg.get('sponsorSatisfaction') || 0
          result.statChanges.boardMood += agg.get('boardMood') || 0
          result.statChanges.teamMorale += agg.get('teamMorale') || 0
        } else if (fulfillmentCheck.broken) {
          const weeksOverdue = ctx.currentWeek - promise.deadline
          const effects = calculatePromiseBreakEffects(promise, Math.max(0, weeksOverdue))
          result.promiseResults.push({
            promiseId: promise.id,
            fulfilled: false,
            broken: true,
            effects
          })
          
          const agg = aggregateEffects(effects)
          result.statChanges.reputation += agg.get('reputation') || 0
          result.statChanges.fanSentiment += agg.get('fanSentiment') || 0
          result.statChanges.sponsorSatisfaction += agg.get('sponsorSatisfaction') || 0
          result.statChanges.boardMood += agg.get('boardMood') || 0
          result.statChanges.teamMorale += agg.get('teamMorale') || 0
        }
      }
    }
  } catch (e) {
    console.warn('[WeeklySystems] Media effects system error:', e)
  }
  
  // ============================================
  // 5. PROMISE / COMMITMENT TRACKING SYSTEM
  // ============================================
  try {
    const promises = ctx.promises || []
    const activePromises = promises.filter(p => p.status === 'active' || p.status === 'expiring')
    
    if (activePromises.length > 0) {
      const promiseCtx: PromiseEvaluationContext = {
        currentWeek: ctx.currentWeek,
        currentYear: ctx.currentYear,
        teamMorale: ctx.teamMorale,
        boardMood: ctx.boardMood,
        sponsorSatisfaction: ctx.sponsorSatisfaction ?? 70,
        reputation: ctx.playerReputation,
        fanSentiment: ctx.fanSentiment ?? 50,
        driverMorale: ctx.driverMorale ?? 70,
        confidence: ctx.playerConfidence,
        stress: ctx.playerStress,
        recentRaceResults: ctx.recentRaceResults ?? [],
        recentSpending: ctx.recentSpending ?? [],
        scheduledActivities: ctx.scheduledActivities ?? []
      }
      
      const promiseResult = processWeeklyPromises(promises, promiseCtx)
      result.promiseProcessingResult = promiseResult
      
      // Apply promise effects to stat changes
      if (promiseResult.effects) {
        result.statChanges.boardMood += (promiseResult.effects as any).boardMood || 0
        result.statChanges.teamMorale += (promiseResult.effects as any).teamMorale || 0
        result.statChanges.reputation += (promiseResult.effects as any).reputation || 0
        result.statChanges.fanSentiment += (promiseResult.effects as any).fanSentiment || 0
        result.statChanges.sponsorSatisfaction += (promiseResult.effects as any).sponsorSatisfaction || 0
        result.statChanges.confidence += (promiseResult.effects as any).confidence || 0
        result.statChanges.stress += (promiseResult.effects as any).stress || 0
      }
      
      // Collect promise emails
      result.promiseEmails = promiseResult.emails.map(e => ({
        subject: e.subject,
        body: e.body,
        sender: e.sender,
        senderRole: e.senderRole,
        category: e.category
      }))
      
      const fulfilled = promiseResult.updatedPromises.filter(p => p.status === 'fulfilled' && p.fulfilledAtWeek === ctx.currentWeek).length
      const broken = promiseResult.updatedPromises.filter(p => p.status === 'broken' && p.brokenAtWeek === ctx.currentWeek).length
      const expiring = promiseResult.updatedPromises.filter(p => p.status === 'expiring' && !promises.find(op => op.id === p.id && op.status === 'expiring')).length
      
      if (fulfilled + broken + expiring > 0) {
        console.log(`[WeeklySystems] Promise evaluation: ${fulfilled} fulfilled, ${broken} broken, ${expiring} expiring`)
      }
    }
  } catch (e) {
    console.warn('[WeeklySystems] Promise system error:', e)
  }
  
  return result
}
