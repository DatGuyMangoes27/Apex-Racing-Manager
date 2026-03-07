/**
 * Promise System
 * 
 * Football Manager-style commitment tracking for event dialogue choices.
 * When the player makes a commitment during an activity (e.g. "we're going for wins",
 * "your wellbeing is a priority"), it is tracked here with deadlines and consequences.
 * 
 * Promises are evaluated weekly to determine if they have been fulfilled or broken,
 * generating appropriate rewards/penalties and feedback emails.
 */

import type { ActivityEffect } from '@/store/careerStore'

// ============================================
// TYPES
// ============================================

export type PromiseCategory = 'performance' | 'investment' | 'wellbeing' | 'strategy' | 'development'
export type PromiseStatus = 'active' | 'fulfilled' | 'broken' | 'expiring'

/** Who heard the promise and will react */
export interface PromiseStakeholder {
  name: string
  role: string           // e.g. 'Chief Engineer', 'Sponsor Rep', 'Team Member'
  category: 'team' | 'sponsor' | 'media' | 'board' | 'personal'
}

/** 
 * How the promise is evaluated — checked each week.
 * Different evaluation types allow flexible conditions.
 */
export type PromiseEvaluationType =
  | 'stat_threshold'      // A stat must reach/exceed a value
  | 'race_result'         // Achieve a race result (position) within N races
  | 'spending_target'     // Spend X on a category (R&D, facilities, etc.)
  | 'schedule_activity'   // Schedule a specific type of activity within deadline
  | 'maintain_stat'       // Keep a stat above a floor for the duration
  | 'improve_stat'        // Increase a stat by a delta from its value when promise was made

export interface PromiseEvaluation {
  type: PromiseEvaluationType

  // For stat_threshold / maintain_stat / improve_stat
  stat?: string           // e.g. 'teamMorale', 'boardMood', 'sponsorSatisfaction'
  threshold?: number      // Value to reach or maintain
  delta?: number          // For improve_stat: required increase from baseline

  // For race_result
  maxPosition?: number    // e.g. 3 means "finish top 3"
  withinRaces?: number    // Number of upcoming races to achieve it

  // For spending_target
  spendingCategory?: string  // e.g. 'development', 'facilities'
  spendingAmount?: number    // Minimum amount to spend

  // For schedule_activity
  activityCategory?: string  // e.g. 'personal', 'team', 'sponsor'

  // Snapshot of stat value when promise was made (for improve_stat)
  baselineValue?: number
}

/**
 * A tracked player promise/commitment.
 */
export interface PlayerPromise {
  id: string
  text: string                       // Human-readable: "Win a race in the next 3 rounds"
  shortText: string                  // Brief label for UI: "Top 3 finish"
  category: PromiseCategory
  sourceActivityId: string           // Which event generated this
  sourceActivityName: string         // e.g. "Team Briefing"
  madeAtWeek: number
  madeAtYear: number
  deadlineWeek: number               // When it must be fulfilled by
  status: PromiseStatus

  // Who heard this promise
  stakeholders: PromiseStakeholder[]

  // How to check fulfillment
  evaluation: PromiseEvaluation

  // Consequences
  rewardsIfKept: ActivityEffect
  penaltiesIfBroken: ActivityEffect

  // Tracking
  fulfilledAtWeek?: number
  brokenAtWeek?: number
  reminderSent?: boolean             // Whether the "expiring soon" reminder was sent
}

/**
 * Inline promise definition attached to an event choice.
 * Converted to PlayerPromise when the player selects the choice.
 */
export interface ChoicePromiseDefinition {
  text: string
  shortText: string
  category: PromiseCategory
  evaluation: PromiseEvaluation
  deadlineWeeks: number              // How many weeks from now
  stakeholderRoles: string[]         // e.g. ['Chief Engineer', 'Team Member']
  stakeholderCategory: 'team' | 'sponsor' | 'media' | 'board' | 'personal'
  rewardsIfKept: ActivityEffect
  penaltiesIfBroken: ActivityEffect
}

// ============================================
// PROMISE CREATION
// ============================================

let promiseCounter = 0

/**
 * Create a PlayerPromise from a choice definition and game context.
 */
export function createPromiseFromChoice(
  definition: ChoicePromiseDefinition,
  activityId: string,
  activityName: string,
  currentWeek: number,
  currentYear: number,
  currentStatValues?: Record<string, number>
): PlayerPromise {
  promiseCounter++
  const id = `promise_${currentWeek}_${currentYear}_${promiseCounter}_${Date.now()}`

  // For improve_stat, snapshot the baseline
  const evaluation: PromiseEvaluation = { ...definition.evaluation }
  if (evaluation.type === 'improve_stat' && evaluation.stat && currentStatValues) {
    evaluation.baselineValue = currentStatValues[evaluation.stat] ?? 0
  }

  return {
    id,
    text: definition.text,
    shortText: definition.shortText,
    category: definition.category,
    sourceActivityId: activityId,
    sourceActivityName: activityName,
    madeAtWeek: currentWeek,
    madeAtYear: currentYear,
    deadlineWeek: currentWeek + definition.deadlineWeeks,
    status: 'active',
    stakeholders: definition.stakeholderRoles.map(role => ({
      name: generateStakeholderName(role),
      role,
      category: definition.stakeholderCategory
    })),
    evaluation,
    rewardsIfKept: definition.rewardsIfKept,
    penaltiesIfBroken: definition.penaltiesIfBroken
  }
}

const STAKEHOLDER_NAMES: Record<string, string[]> = {
  'Chief Engineer': ['James Henderson', 'Sarah Mitchell', 'Marcus Weber'],
  'Team Member': ['Alex Porter', 'Emily Shaw', 'Carlos Vega'],
  'Sponsor Representative': ['Richard Blake', 'Sophia Laurent', 'David Kim'],
  'Partnership Manager': ['Lisa Anderson', 'Michael Torres', 'Jennifer Taylor'],
  'Sports Journalist': ['Tom Harrison', 'Rachel Murphy', 'Chris Donovan'],
  'Board Member': ['William Sterling', 'Margaret Chen', 'Robert Ashworth'],
  'Lead Engineer': ['Daniel Foster', 'Hannah Price', 'Viktor Nowak'],
  'Team Manager': ['Paul Reeves', 'Claire Morgan', 'Sean O\'Brien'],
  default: ['Alex Porter', 'Jordan Taylor', 'Sam Reeves']
}

function generateStakeholderName(role: string): string {
  const names = STAKEHOLDER_NAMES[role] || STAKEHOLDER_NAMES.default
  return names[Math.floor(Math.random() * names.length)]
}

// ============================================
// PROMISE EVALUATION
// ============================================

export interface PromiseEvaluationContext {
  currentWeek: number
  currentYear: number
  // Current stat values
  teamMorale: number
  boardMood: number
  sponsorSatisfaction: number
  reputation: number
  fanSentiment: number
  driverMorale: number
  confidence: number
  stress: number
  // Race results since promise was made
  recentRaceResults: { position: number; week: number }[]
  // Spending since promise was made
  recentSpending: { category: string; amount: number; week: number }[]
  // Scheduled activities
  scheduledActivities: { category: string; week: number; status: string }[]
}

export interface PromiseEvalResult {
  promise: PlayerPromise
  newStatus: PromiseStatus
  statusChanged: boolean
  effects: ActivityEffect        // Rewards or penalties to apply
  emailData?: {
    subject: string
    body: string
    sender: string
    senderRole: string
    category: string
  }
}

/**
 * Evaluate a single promise against the current game state.
 */
export function evaluatePromise(
  promise: PlayerPromise,
  ctx: PromiseEvaluationContext
): PromiseEvalResult {
  const result: PromiseEvalResult = {
    promise,
    newStatus: promise.status,
    statusChanged: false,
    effects: {}
  }

  // Skip already resolved promises
  if (promise.status === 'fulfilled' || promise.status === 'broken') {
    return result
  }

  const weeksRemaining = promise.deadlineWeek - ctx.currentWeek
  const isFulfilled = checkFulfillment(promise, ctx)
  const isExpired = weeksRemaining <= 0

  if (isFulfilled) {
    // Promise fulfilled!
    result.newStatus = 'fulfilled'
    result.statusChanged = true
    result.effects = promise.rewardsIfKept
    result.promise = {
      ...promise,
      status: 'fulfilled',
      fulfilledAtWeek: ctx.currentWeek
    }

    const stakeholderName = promise.stakeholders[0]?.name ?? 'Team'
    const stakeholderRole = promise.stakeholders[0]?.role ?? 'Team'
    result.emailData = {
      subject: `Promise Kept: "${promise.shortText}"`,
      body: `You committed to "${promise.text}" during ${promise.sourceActivityName} in Week ${promise.madeAtWeek}.\n\n` +
        `**You delivered.** This hasn't gone unnoticed.\n\n` +
        `The people who heard you make this commitment are impressed. ` +
        `Your credibility and trust within the team have grown.\n\n` +
        `_"Actions speak louder than words, and you proved that today."_\n— ${stakeholderName}`,
      sender: stakeholderName,
      senderRole: stakeholderRole,
      category: promise.stakeholders[0]?.category ?? 'team'
    }
  } else if (isExpired) {
    // Promise broken — deadline passed without fulfillment
    result.newStatus = 'broken'
    result.statusChanged = true
    result.effects = promise.penaltiesIfBroken
    result.promise = {
      ...promise,
      status: 'broken',
      brokenAtWeek: ctx.currentWeek
    }

    const stakeholderName = promise.stakeholders[0]?.name ?? 'Team'
    const stakeholderRole = promise.stakeholders[0]?.role ?? 'Team'
    result.emailData = {
      subject: `Broken Promise: "${promise.shortText}"`,
      body: `During ${promise.sourceActivityName} in Week ${promise.madeAtWeek}, you said: "${promise.text}"\n\n` +
        `**The deadline has passed and you didn't deliver.**\n\n` +
        `People remember what you say. Breaking commitments erodes trust and ` +
        `makes others question whether your words carry weight.\n\n` +
        `_"I was counting on what you said. Now I'm not sure what to believe."_\n— ${stakeholderName}`,
      sender: stakeholderName,
      senderRole: stakeholderRole,
      category: promise.stakeholders[0]?.category ?? 'team'
    }
  } else if (weeksRemaining <= 1 && !promise.reminderSent) {
    // About to expire — send a reminder
    result.newStatus = 'expiring'
    result.statusChanged = true
    result.promise = {
      ...promise,
      status: 'expiring',
      reminderSent: true
    }

    const stakeholderName = promise.stakeholders[0]?.name ?? 'Team'
    const stakeholderRole = promise.stakeholders[0]?.role ?? 'Team'
    result.emailData = {
      subject: `Reminder: "${promise.shortText}" — Deadline Approaching`,
      body: `Just a reminder — during ${promise.sourceActivityName} you committed to:\n\n` +
        `> "${promise.text}"\n\n` +
        `**You have less than a week to follow through.** People are watching.\n\n` +
        `_"I haven't forgotten what you said. I hope you haven't either."_\n— ${stakeholderName}`,
      sender: stakeholderName,
      senderRole: stakeholderRole,
      category: promise.stakeholders[0]?.category ?? 'team'
    }
  }

  return result
}

/**
 * Check if a promise's fulfillment condition is met.
 */
function checkFulfillment(promise: PlayerPromise, ctx: PromiseEvaluationContext): boolean {
  const { evaluation } = promise

  switch (evaluation.type) {
    case 'stat_threshold': {
      const currentVal = getStatValue(evaluation.stat ?? '', ctx)
      return currentVal >= (evaluation.threshold ?? 0)
    }

    case 'race_result': {
      // Check if any race since promise was made has a result <= maxPosition
      const racesAfterPromise = ctx.recentRaceResults.filter(r => r.week >= promise.madeAtWeek)
      return racesAfterPromise.some(r => r.position <= (evaluation.maxPosition ?? 3))
    }

    case 'spending_target': {
      // Check if total spending in category since promise exceeds target
      const spendingSincePromise = ctx.recentSpending
        .filter(s => s.category === evaluation.spendingCategory && s.week >= promise.madeAtWeek)
        .reduce((sum, s) => sum + s.amount, 0)
      return spendingSincePromise >= (evaluation.spendingAmount ?? 0)
    }

    case 'schedule_activity': {
      // Check if an activity of the required category was scheduled/completed since the promise
      return ctx.scheduledActivities.some(
        a => a.category === evaluation.activityCategory &&
             a.week >= promise.madeAtWeek &&
             (a.status === 'completed' || a.status === 'scheduled')
      )
    }

    case 'maintain_stat': {
      // Stat must currently be at or above the threshold
      const currentVal = getStatValue(evaluation.stat ?? '', ctx)
      return currentVal >= (evaluation.threshold ?? 0)
    }

    case 'improve_stat': {
      // Stat must have improved by at least delta from baseline
      const currentVal = getStatValue(evaluation.stat ?? '', ctx)
      const baseline = evaluation.baselineValue ?? 0
      return (currentVal - baseline) >= (evaluation.delta ?? 5)
    }

    default:
      return false
  }
}

function getStatValue(stat: string, ctx: PromiseEvaluationContext): number {
  switch (stat) {
    case 'teamMorale': return ctx.teamMorale
    case 'boardMood': return ctx.boardMood
    case 'sponsorSatisfaction': return ctx.sponsorSatisfaction
    case 'reputation': return ctx.reputation
    case 'fanSentiment': return ctx.fanSentiment
    case 'driverMorale': return ctx.driverMorale
    case 'confidence': return ctx.confidence
    case 'stress': return ctx.stress
    default: return 0
  }
}

// ============================================
// BATCH EVALUATION (called weekly)
// ============================================

export interface PromiseProcessingResult {
  updatedPromises: PlayerPromise[]
  effects: ActivityEffect
  emails: Array<{
    subject: string
    body: string
    sender: string
    senderRole: string
    category: string
  }>
}

/**
 * Process all active promises. Called from weekly systems processor.
 */
export function processWeeklyPromises(
  promises: PlayerPromise[],
  ctx: PromiseEvaluationContext
): PromiseProcessingResult {
  const result: PromiseProcessingResult = {
    updatedPromises: [...promises],
    effects: {},
    emails: []
  }

  for (let i = 0; i < result.updatedPromises.length; i++) {
    const promise = result.updatedPromises[i]
    if (promise.status === 'fulfilled' || promise.status === 'broken') continue

    const evalResult = evaluatePromise(promise, ctx)

    if (evalResult.statusChanged) {
      result.updatedPromises[i] = evalResult.promise

      // Accumulate effects
      for (const [key, value] of Object.entries(evalResult.effects)) {
        if (typeof value === 'number') {
          (result.effects as any)[key] = ((result.effects as any)[key] || 0) + value
        }
      }

      // Collect emails
      if (evalResult.emailData) {
        result.emails.push(evalResult.emailData)
      }
    }
  }

  return result
}

/**
 * Get summary counts for UI display.
 */
export function getPromiseSummary(promises: PlayerPromise[]) {
  return {
    active: promises.filter(p => p.status === 'active').length,
    expiring: promises.filter(p => p.status === 'expiring').length,
    fulfilled: promises.filter(p => p.status === 'fulfilled').length,
    broken: promises.filter(p => p.status === 'broken').length,
    total: promises.length
  }
}
