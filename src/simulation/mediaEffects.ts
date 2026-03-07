/**
 * Media Effects System
 * 
 * Calculates and propagates the effects of media actions (duties, posts, press releases)
 * throughout the game's interconnected systems. Handles penalty processing and promise tracking.
 */

import {
  MediaDutyOption,
  MediaPromise,
  MediaDutySkipPenalty,
  MediaEffect,
  TeamMediaState
} from '../store/careerStore'

// Re-export type for consumers
export type { MediaEffect }

/**
 * Check if a media duty option triggers controversy
 */
export function checkControversyRisk(
  option: MediaDutyOption,
  context: {
    mediaScrutinyLevel: number
    recentControversies: number
  }
): { triggered: boolean; severity: number; headline?: string } {
  const baseRisk = option.effects.controversyRisk
  
  // Higher scrutiny increases controversy chance
  const scrutinyMod = 1 + (context.mediaScrutinyLevel / 200) // +0% to +50%
  
  // Recent controversies make media more watchful
  const historyMod = 1 + (context.recentControversies * 0.1) // +10% per recent controversy
  
  const adjustedRisk = baseRisk * scrutinyMod * historyMod
  
  const roll = Math.random() * 100
  const triggered = roll < adjustedRisk
  
  if (!triggered) {
    return { triggered: false, severity: 0 }
  }
  
  // Calculate severity (1-10)
  const baseSeverity = Math.ceil(baseRisk / 10)
  const severityVariance = Math.floor(Math.random() * 3) - 1 // -1 to +1
  const severity = Math.max(1, Math.min(10, baseSeverity + severityVariance))
  
  // Generate controversy headline based on option content
  const headline = generateControversyHeadline(option, severity)
  
  return { triggered, severity, headline }
}

/**
 * Generate a controversy headline based on the statement
 */
function generateControversyHeadline(option: MediaDutyOption, _severity: number): string {
  const templates: Record<string, string[]> = {
    aggressive: [
      'Team boss sparks controversy with bold claims',
      'Fiery comments draw criticism from paddock',
      'Outspoken owner faces backlash over remarks',
      'Bold statement divides opinion in paddock'
    ],
    confident: [
      'Over-confident claims raise eyebrows',
      'Team boss\' predictions questioned by rivals',
      'Bold confidence draws mixed reactions'
    ],
    criticizesTeam: [
      'Team owner publicly criticizes own staff',
      'Internal tensions surface in media duty',
      'Boss throws team under the bus in press'
    ],
    criticizesDriver: [
      'Team owner questions driver performance',
      'Driver thrown under bus by team boss',
      'Public criticism of driver raises concerns'
    ],
    makesPromises: [
      'Team boss makes bold promise to deliver',
      'High expectations set after public commitment',
      'Pressure mounts after ambitious promise'
    ]
  }
  
  let pool: string[] = []
  
  if (option.criticizesTeam) {
    pool = templates.criticizesTeam
  } else if (option.criticizesDriver) {
    pool = templates.criticizesDriver
  } else if (option.makesPromises) {
    pool = templates.makesPromises
  } else if (option.tone === 'aggressive') {
    pool = templates.aggressive
  } else {
    pool = templates.confident
  }
  
  return pool[Math.floor(Math.random() * pool.length)]
}

// ============================================
// FINE SYSTEM
// ============================================

/**
 * Check if a fine was issued based on option risk
 */
export function checkFineTrigger(
  option: MediaDutyOption,
  context: {
    seriesTier: string
    previousFines: number  // Count of fines this season
    controversyActive: boolean
  }
): { issued: boolean; amount: number; reason?: string } {
  const baseRisk = option.effects.fineRisk
  
  // Series tier affects fine likelihood (higher tiers = stricter rules)
  const tierMods: Record<string, number> = {
    'regional': 0.5,
    'national': 0.8,
    'continental': 1.0,
    'international': 1.2,
    'premier': 1.5
  }
  const tierMod = tierMods[context.seriesTier] || 1.0
  
  // Previous fines make officials more watchful
  const historyMod = 1 + (context.previousFines * 0.15)
  
  // Active controversy increases scrutiny
  const controversyMod = context.controversyActive ? 1.3 : 1.0
  
  const adjustedRisk = baseRisk * tierMod * historyMod * controversyMod
  
  const roll = Math.random() * 100
  const issued = roll < adjustedRisk
  
  if (!issued) {
    return { issued: false, amount: 0 }
  }
  
  // Calculate fine amount
  const baseAmount = option.effects.fineAmount || 10000
  const amountVariance = 0.8 + (Math.random() * 0.4) // 80% to 120%
  const amount = Math.round(baseAmount * tierMod * amountVariance)
  
  // Generate fine reason
  const reason = generateFineReason(option)
  
  return { issued, amount, reason }
}

/**
 * Generate a reason for the fine
 */
function generateFineReason(option: MediaDutyOption): string {
  const reasons: Record<string, string[]> = {
    aggressive: [
      'Bringing the sport into disrepute',
      'Unsportsmanlike comments',
      'Conduct prejudicial to the interests of competition'
    ],
    criticizesTeam: [
      'Public statements harmful to team personnel',
      'Breach of team confidentiality protocols'
    ],
    criticizesDriver: [
      'Public criticism of contracted competitor',
      'Statements harmful to driver relations'
    ],
    general: [
      'Breach of media code of conduct',
      'Inappropriate public statements',
      'Violation of series regulations on media conduct'
    ]
  }
  
  let pool: string[]
  
  if (option.criticizesTeam) {
    pool = reasons.criticizesTeam
  } else if (option.criticizesDriver) {
    pool = reasons.criticizesDriver
  } else if (option.tone === 'aggressive') {
    pool = reasons.aggressive
  } else {
    pool = reasons.general
  }
  
  return pool[Math.floor(Math.random() * pool.length)]
}

// ============================================
// PROMISE TRACKING
// ============================================

/**
 * Check if a promise has been fulfilled based on results
 */
export function checkPromiseFulfillment(
  promise: MediaPromise,
  context: {
    currentWeek: number
    currentYear: number
    recentResults: Array<{ position: number; trackName: string }>
    upgradesMade: string[]
    performanceImprovement: number  // % improvement since promise
  }
): { fulfilled: boolean; broken: boolean; reason?: string } {
  // Check if past deadline
  const isPastDeadline = 
    context.currentYear > promise.deadlineYear ||
    (context.currentYear === promise.deadlineYear && context.currentWeek > promise.deadline)
  
  let fulfilled = false
  let reason = ''
  
  switch (promise.type) {
    case 'result_promise':
      // Check if target result was achieved
      // Parse target like "win at Monza", "top 5 finish", "podium"
      const target = promise.target.toLowerCase()
      
      if (target.includes('win')) {
        fulfilled = context.recentResults.some(r => r.position === 1)
        reason = fulfilled ? 'Race win achieved' : 'Failed to achieve promised win'
      } else if (target.includes('podium')) {
        fulfilled = context.recentResults.some(r => r.position <= 3)
        reason = fulfilled ? 'Podium achieved' : 'Failed to achieve promised podium'
      } else if (target.includes('top 5')) {
        fulfilled = context.recentResults.some(r => r.position <= 5)
        reason = fulfilled ? 'Top 5 achieved' : 'Failed to achieve promised top 5'
      } else if (target.includes('top 10')) {
        fulfilled = context.recentResults.some(r => r.position <= 10)
        reason = fulfilled ? 'Top 10 achieved' : 'Failed to achieve promised top 10'
      } else if (target.includes('points')) {
        fulfilled = context.recentResults.some(r => r.position <= 10)
        reason = fulfilled ? 'Points scored' : 'Failed to score promised points'
      }
      break
      
    case 'upgrade_promise':
      // Check if upgrades were delivered
      fulfilled = context.upgradesMade.length > 0
      reason = fulfilled ? 'Upgrades delivered as promised' : 'Failed to deliver promised upgrades'
      break
      
    case 'improvement_promise':
      // Check if performance improved
      fulfilled = context.performanceImprovement >= 5 // 5% improvement threshold
      reason = fulfilled ? 'Performance improvement achieved' : 'Failed to show promised improvement'
      break
  }
  
  // If fulfilled before deadline, great
  if (fulfilled) {
    return { fulfilled: true, broken: false, reason }
  }
  
  // If past deadline and not fulfilled, broken
  if (isPastDeadline) {
    return { fulfilled: false, broken: true, reason }
  }
  
  // Still within deadline, neither fulfilled nor broken
  return { fulfilled: false, broken: false }
}

/**
 * Calculate effects of fulfilling a promise
 */
export function calculatePromiseFulfillmentEffects(
  promise: MediaPromise,
  weeksEarly: number // How many weeks before deadline
): MediaEffect[] {
  const effects: MediaEffect[] = []
  
  // Base bonus for keeping promise
  const baseBonus = 3
  
  // Early delivery bonus
  const earlyBonus = Math.min(3, Math.floor(weeksEarly / 2))
  
  // Promise type affects which metrics get boosted
  switch (promise.type) {
    case 'result_promise':
      effects.push({
        type: 'fanSentiment',
        amount: baseBonus + earlyBonus + 2,
        source: 'promise_fulfilled',
        description: 'Delivered on result promise'
      })
      effects.push({
        type: 'sponsorSatisfaction',
        amount: baseBonus + earlyBonus,
        source: 'promise_fulfilled',
        description: 'Delivered on result promise'
      })
      break
      
    case 'upgrade_promise':
      effects.push({
        type: 'teamMorale',
        amount: baseBonus + earlyBonus + 2,
        source: 'promise_fulfilled',
        description: 'Delivered promised upgrades'
      })
      effects.push({
        type: 'boardMood',
        amount: baseBonus + earlyBonus,
        source: 'promise_fulfilled',
        description: 'Delivered promised upgrades'
      })
      break
      
    case 'improvement_promise':
      effects.push({
        type: 'boardMood',
        amount: baseBonus + earlyBonus + 2,
        source: 'promise_fulfilled',
        description: 'Showed promised improvement'
      })
      effects.push({
        type: 'fanSentiment',
        amount: baseBonus + earlyBonus,
        source: 'promise_fulfilled',
        description: 'Showed promised improvement'
      })
      break
  }
  
  // Reputation boost for all fulfilled promises
  effects.push({
    type: 'reputation',
    amount: 2 + Math.floor(earlyBonus / 2),
    source: 'promise_fulfilled',
    description: 'Reputation boost for keeping promise'
  })
  
  return effects
}

/**
 * Calculate effects of breaking a promise
 */
export function calculatePromiseBreakEffects(
  promise: MediaPromise,
  weeksOverdue: number // How many weeks past deadline
): MediaEffect[] {
  const effects: MediaEffect[] = []
  
  // Base penalty for breaking promise
  const basePenalty = -5
  
  // Overdue penalty (worse the longer overdue)
  const overduePenalty = Math.min(-5, -Math.floor(weeksOverdue / 2))
  
  // All broken promises hurt reputation significantly
  effects.push({
    type: 'reputation',
    amount: basePenalty,
    source: 'promise_broken',
    description: 'Reputation damage for broken promise'
  })
  
  // Fan backlash
  effects.push({
    type: 'fanSentiment',
    amount: basePenalty + overduePenalty,
    source: 'promise_broken',
    description: 'Fan backlash over broken promise'
  })
  
  // Sponsor disappointment
  effects.push({
    type: 'sponsorSatisfaction',
    amount: Math.round((basePenalty + overduePenalty) * 0.7),
    source: 'promise_broken',
    description: 'Sponsor disappointment over broken promise'
  })
  
  // Board dissatisfaction
  effects.push({
    type: 'boardMood',
    amount: Math.round((basePenalty + overduePenalty) * 0.8),
    source: 'promise_broken',
    description: 'Board dissatisfied with unfulfilled commitment'
  })
  
  // Promise type specific effects
  switch (promise.type) {
    case 'upgrade_promise':
      effects.push({
        type: 'teamMorale',
        amount: basePenalty - 2,
        source: 'promise_broken',
        description: 'Team morale hit from undelivered upgrades'
      })
      break
      
    case 'improvement_promise':
      effects.push({
        type: 'driverMorale',
        amount: basePenalty - 2,
        source: 'promise_broken',
        description: 'Driver morale hit from lack of improvement'
      })
      break
  }
  
  return effects
}

// ============================================
// AGGREGATE EFFECT APPLICATION
// ============================================

/**
 * Aggregate multiple effects of the same type
 */
export function aggregateEffects(effects: MediaEffect[]): Map<string, number> {
  const aggregated = new Map<string, number>()
  
  for (const effect of effects) {
    const current = aggregated.get(effect.type) || 0
    aggregated.set(effect.type, current + (effect.amount ?? 0))
  }
  
  return aggregated
}

/**
 * Cap effect values to prevent extreme swings
 */
export function capEffectValue(
  type: string,
  value: number,
  currentValue: number
): number {
  // Maximum change per action
  const maxChanges: Record<string, number> = {
    sponsorSatisfaction: 10,
    boardMood: 10,
    teamMorale: 10,
    driverMorale: 10,
    fanSentiment: 15,
    reputation: 5,
    developmentBoost: 5
  }
  
  const maxChange = maxChanges[type] || 10
  const cappedValue = Math.max(-maxChange, Math.min(maxChange, value))
  
  // Ensure we don't go below 0 or above 100 for percentage-based values
  const percentageTypes = ['sponsorSatisfaction', 'boardMood', 'teamMorale', 'driverMorale', 'fanSentiment']
  if (percentageTypes.includes(type)) {
    const newValue = currentValue + cappedValue
    if (newValue < 0) return -currentValue
    if (newValue > 100) return 100 - currentValue
  }
  
  return cappedValue
}

// ============================================
// MEDIA SCORE MODIFIERS
// ============================================

/**
 * Calculate media score modifier based on recent duty performance
 */
export function calculateMediaScoreModifier(
  mediaState: TeamMediaState
): number {
  const schedule = mediaState.dutySchedule
  
  // Base modifier starts at 0
  let modifier = 0
  
  // Completed duties boost media score
  const completionRatio = schedule.completedDutiesThisSeason / 
    (schedule.completedDutiesThisSeason + schedule.missedDutiesThisSeason || 1)
  modifier += (completionRatio - 0.5) * 10 // -5 to +5 based on completion rate
  
  // Controversies hurt media score
  modifier -= schedule.controversiesFromMedia * 2
  
  // Fines indicate poor media management
  if (schedule.finesPaidThisSeason > 0) {
    modifier -= Math.min(5, Math.floor(schedule.finesPaidThisSeason / 10000))
  }
  
  // Active promises show ambition (slight boost)
  const activePromises = schedule.activePromises.filter(p => !p.fulfilled && !p.broken)
  modifier += Math.min(3, activePromises.length)
  
  return Math.round(modifier)
}
