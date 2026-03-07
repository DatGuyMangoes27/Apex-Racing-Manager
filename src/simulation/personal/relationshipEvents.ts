// ============================================
// RELATIONSHIP EVENTS & DEPTH SYSTEM
// ============================================
// Handles relationship milestones, weekly events, arguments,
// breakups, date outcomes, and anniversary tracking.

import type { 
  RelationshipMilestone, 
  RelationshipMilestoneType,
  RelationshipTimeline,
  RelationshipEvent,
  RelationshipEventChoice,
  DateQuality,
  DateOutcome,
  ContactInfo,
  PotentialDate
} from '@/types/personalLife'
import type { Partner, DealBreakerGameState, MoodFactor } from '@/data/family-config'
import { findDealBreakerMapping } from '@/data/family-config'

// ============================================
// POOL MANAGEMENT
// ============================================

const MAX_CONTACTS = 30
const MAX_POTENTIAL_DATES = 8
const STALENESS_THRESHOLD_WEEKS = 16 // Remove contacts with no interaction for 16+ weeks

/**
 * Clean up stale contacts and enforce caps
 * Called during weekly processing
 */
export function cleanupContactPool(
  contacts: ContactInfo[],
  currentWeek: number,
  currentYear: number
): { cleaned: ContactInfo[]; removed: string[] } {
  const removed: string[] = []
  
  // Never remove partners, family, or favorites
  const protected_ = contacts.filter(c => 
    c.type === 'partner' || c.type === 'family' || c.isFavorite || 
    c.worldEntityId // Don't remove world character contacts
  )
  const removable = contacts.filter(c => 
    c.type !== 'partner' && c.type !== 'family' && !c.isFavorite && !c.worldEntityId
  )
  
  // Remove stale contacts (no interaction for too long)
  const fresh = removable.filter(c => {
    const lastWeek = c.lastInteractionWeek || c.metWeek || 0
    const lastYear = c.lastInteractionYear || c.metYear || currentYear
    const weeksSinceLast = (currentYear - lastYear) * 52 + (currentWeek - lastWeek)
    
    if (weeksSinceLast > STALENESS_THRESHOLD_WEEKS && c.relationshipLevel < 50) {
      removed.push(c.name)
      return false
    }
    return true
  })
  
  // Enforce cap - keep highest relationship contacts
  let sorted = fresh.sort((a, b) => b.relationshipLevel - a.relationshipLevel)
  const spaceForRemovable = MAX_CONTACTS - protected_.length
  if (sorted.length > spaceForRemovable) {
    const excess = sorted.slice(spaceForRemovable)
    excess.forEach(c => removed.push(c.name))
    sorted = sorted.slice(0, spaceForRemovable)
  }
  
  return {
    cleaned: [...protected_, ...sorted],
    removed
  }
}

/**
 * Clean up potential dates pool - enforce cap and remove stale
 */
export function cleanupDatePool(
  dates: PotentialDate[],
  currentWeek: number,
  currentYear: number
): { cleaned: PotentialDate[]; removed: string[] } {
  const removed: string[] = []
  
  // Remove very stale dates (no interaction for 8+ weeks)
  const fresh = dates.filter(d => {
    const weeksSince = (currentYear - d.metYear) * 52 + (currentWeek - d.metWeek)
    const lastInteraction = d.lastInteractionWeek 
      ? (currentYear - (d.lastInteractionYear || d.metYear)) * 52 + (currentWeek - d.lastInteractionWeek)
      : weeksSince
    
    if (lastInteraction > 8 && d.conversationStage === 'stranger') {
      removed.push(`${d.firstName} ${d.lastName}`)
      return false
    }
    return true
  })
  
  // Enforce cap - keep most recently met
  let sorted = fresh.sort((a, b) => {
    const aWeeks = a.metYear * 52 + a.metWeek
    const bWeeks = b.metYear * 52 + b.metWeek
    return bWeeks - aWeeks
  })
  
  if (sorted.length > MAX_POTENTIAL_DATES) {
    const excess = sorted.slice(MAX_POTENTIAL_DATES)
    excess.forEach(d => removed.push(`${d.firstName} ${d.lastName}`))
    sorted = sorted.slice(0, MAX_POTENTIAL_DATES)
  }
  
  return {
    cleaned: sorted,
    removed
  }
}

// ============================================
// RELATIONSHIP MILESTONE SYSTEM
// ============================================

/**
 * Create a default relationship timeline
 */
export function createRelationshipTimeline(startWeek: number, startYear: number): RelationshipTimeline {
  return {
    milestones: [{
      type: 'first_message',
      week: startWeek,
      year: startYear,
      description: 'First conversation started'
    }],
    startWeek,
    startYear,
    currentStage: 'talking',
    argumentCount: 0,
    unresolvedConflicts: 0,
    breakupWarningLevel: 0
  }
}

/**
 * Check if a milestone should unlock based on relationship state
 */
export function checkMilestoneUnlocks(
  timeline: RelationshipTimeline,
  partner: Partner | null,
  romanceLevel: number,
  trustLevel: number,
  weeksInRelationship: number
): RelationshipMilestone[] {
  const unlocked: RelationshipMilestone[] = []
  const existingTypes = new Set(timeline.milestones.map(m => m.type))
  
  // First date: romance > 40
  if (!existingTypes.has('first_date') && romanceLevel >= 40) {
    unlocked.push({ type: 'first_date', week: 0, year: 0, description: 'Went on your first date together' })
  }
  
  // First kiss: romance > 55
  if (!existingTypes.has('first_kiss') && romanceLevel >= 55 && existingTypes.has('first_date')) {
    unlocked.push({ type: 'first_kiss', week: 0, year: 0, description: 'Shared your first kiss' })
  }
  
  // Became exclusive: romance > 65, trust > 50
  if (!existingTypes.has('became_exclusive') && romanceLevel >= 65 && trustLevel >= 50) {
    unlocked.push({ type: 'became_exclusive', week: 0, year: 0, description: 'Decided to be exclusive' })
  }
  
  // Said I love you: romance > 80, trust > 65, at least 8 weeks
  if (!existingTypes.has('said_i_love_you') && romanceLevel >= 80 && trustLevel >= 65 && weeksInRelationship >= 8) {
    unlocked.push({ type: 'said_i_love_you', week: 0, year: 0, description: 'Said "I love you" for the first time' })
  }
  
  // Met family: trust > 70, at least 12 weeks
  if (!existingTypes.has('met_family') && trustLevel >= 70 && weeksInRelationship >= 12) {
    unlocked.push({ type: 'met_family', week: 0, year: 0, description: 'Met each other\'s families' })
  }
  
  // Moved in: trust > 75, romance > 75, at least 20 weeks
  if (!existingTypes.has('moved_in') && trustLevel >= 75 && romanceLevel >= 75 && weeksInRelationship >= 20) {
    unlocked.push({ type: 'moved_in', week: 0, year: 0, description: 'Moved in together' })
  }
  
  // First vacation: at least 6 weeks dating
  if (!existingTypes.has('first_vacation') && weeksInRelationship >= 6 && existingTypes.has('first_date')) {
    if (Math.random() < 0.1) { // 10% chance per week check
      unlocked.push({ type: 'first_vacation', week: 0, year: 0, description: 'Took your first vacation together' })
    }
  }
  
  // 1 year anniversary
  if (!existingTypes.has('anniversary_1_year') && weeksInRelationship >= 52) {
    unlocked.push({ type: 'anniversary_1_year', week: 0, year: 0, description: 'Celebrated your 1-year anniversary' })
  }
  
  // 5 year anniversary
  if (!existingTypes.has('anniversary_5_year') && weeksInRelationship >= 260) {
    unlocked.push({ type: 'anniversary_5_year', week: 0, year: 0, description: 'Celebrated your 5-year anniversary' })
  }
  
  return unlocked
}

// ============================================
// ROMANTIC SPARK CHECK (for emergent romance from friends)
// ============================================

/**
 * Check if a romanticEligible friend contact should trigger the "romantic spark" transition.
 * Called from weekly processing for each romanticEligible contact.
 */
export function shouldTriggerRomanticSpark(
  romanceMeter: number,
  affectionMeter: number
): boolean {
  return romanceMeter >= 25 && affectionMeter >= 40
}

// ============================================
// WEEKLY RELATIONSHIP EVENTS
// ============================================

const POSITIVE_EVENTS: Array<{ title: string; description: string; choices: RelationshipEventChoice[] }> = [
  {
    title: 'Surprise Dinner',
    description: 'Your partner has prepared a surprise candlelit dinner at home.',
    choices: [
      { id: 'love_it', label: 'Express your appreciation lovingly', effects: { happinessChange: 10, romanceChange: 8, affectionChange: 5 }, tone: 'romantic' },
      { id: 'practical', label: 'Thank them but mention you already ate', effects: { happinessChange: -5, romanceChange: -3 }, tone: 'practical' }
    ]
  },
  {
    title: 'Weekend Getaway Idea',
    description: 'Your partner suggests a spontaneous weekend trip together.',
    choices: [
      { id: 'say_yes', label: 'Enthusiastically agree', effects: { happinessChange: 8, romanceChange: 5, moneySpent: 2000 }, tone: 'romantic' },
      { id: 'busy', label: 'Say you\'re too busy with work', effects: { happinessChange: -8, romanceChange: -5 }, tone: 'dismissive' },
      { id: 'plan_later', label: 'Suggest planning something for next month', effects: { happinessChange: 2, trustChange: 3 }, tone: 'practical' }
    ]
  },
  {
    title: 'Proud of You',
    description: 'Your partner tells you how proud they are of your achievements.',
    choices: [
      { id: 'grateful', label: 'Tell them you couldn\'t do it without them', effects: { happinessChange: 8, affectionChange: 8, trustChange: 3 }, tone: 'supportive' },
      { id: 'humble', label: 'Downplay it modestly', effects: { happinessChange: 3, affectionChange: 2 }, tone: 'practical' }
    ]
  },
  {
    title: 'Gift from Partner',
    description: 'Your partner gives you a thoughtful gift that shows how well they know you.',
    choices: [
      { id: 'touched', label: 'Tell them it means the world', effects: { happinessChange: 10, romanceChange: 5, trustChange: 5 }, tone: 'romantic' },
      { id: 'return_gift', label: 'Rush out to get them something too', effects: { happinessChange: 5, moneySpent: 500 }, tone: 'supportive' }
    ]
  },
  {
    title: 'Shared Interest',
    description: 'You discover a new shared interest with your partner.',
    choices: [
      { id: 'explore', label: 'Plan to explore it together', effects: { happinessChange: 6, romanceChange: 4, affectionChange: 5 }, tone: 'romantic' },
      { id: 'solo', label: 'Prefer to keep it as your own thing', effects: { happinessChange: -2, affectionChange: -3 }, tone: 'dismissive' }
    ]
  }
]

const NEGATIVE_EVENTS: Array<{ title: string; description: string; choices: RelationshipEventChoice[] }> = [
  {
    title: 'Forgotten Plans',
    description: 'You forgot about plans you made with your partner. They\'re upset.',
    choices: [
      { id: 'apologize', label: 'Sincerely apologize and make it up to them', effects: { happinessChange: -3, trustChange: -2, moneySpent: 300 }, tone: 'supportive' },
      { id: 'excuse', label: 'Make an excuse about being too busy', effects: { happinessChange: -8, trustChange: -8 }, tone: 'dismissive' },
      { id: 'confront', label: 'Get defensive about your busy schedule', effects: { happinessChange: -10, trustChange: -5, stressChange: 5 }, tone: 'confrontational' }
    ]
  },
  {
    title: 'Social Media Jealousy',
    description: 'Your partner is upset about a photo of you with someone at an event.',
    choices: [
      { id: 'explain', label: 'Calmly explain the context', effects: { happinessChange: -2, trustChange: 2 }, tone: 'supportive' },
      { id: 'dismiss', label: 'Tell them they\'re overreacting', effects: { happinessChange: -10, trustChange: -10, stressChange: 5 }, tone: 'dismissive' },
      { id: 'comfort', label: 'Reassure them and post a couple photo', effects: { happinessChange: 3, romanceChange: 3, trustChange: 5 }, tone: 'romantic' }
    ]
  },
  {
    title: 'Career Tension',
    description: 'Your partner feels neglected because of your demanding schedule.',
    choices: [
      { id: 'prioritize', label: 'Promise to make more time for them', effects: { happinessChange: 3, trustChange: 5, affectionChange: 3 }, tone: 'supportive' },
      { id: 'career_first', label: 'Explain that your career comes first right now', effects: { happinessChange: -12, trustChange: -5 }, tone: 'dismissive' },
      { id: 'compromise', label: 'Suggest a date night schedule', effects: { happinessChange: 5, romanceChange: 5, trustChange: 3 }, tone: 'practical' }
    ]
  },
  {
    title: 'Money Disagreement',
    description: 'You and your partner disagree about a significant purchase.',
    choices: [
      { id: 'listen', label: 'Hear them out and find a compromise', effects: { happinessChange: 2, trustChange: 5 }, tone: 'supportive' },
      { id: 'override', label: 'Buy it anyway - it\'s your money', effects: { happinessChange: -10, trustChange: -10, stressChange: 5 }, tone: 'confrontational' },
      { id: 'defer', label: 'Agree to think about it more', effects: { happinessChange: -1, trustChange: 3 }, tone: 'practical' }
    ]
  }
]

const NEUTRAL_EVENTS: Array<{ title: string; description: string; choices: RelationshipEventChoice[] }> = [
  {
    title: 'Quiet Evening',
    description: 'It\'s a rare quiet evening at home together. What do you do?',
    choices: [
      { id: 'together', label: 'Cook dinner together and watch a film', effects: { happinessChange: 5, romanceChange: 3, affectionChange: 3 }, tone: 'romantic' },
      { id: 'work', label: 'Catch up on work while they do their thing', effects: { happinessChange: -2, affectionChange: -2 }, tone: 'practical' },
      { id: 'deep_talk', label: 'Have a heart-to-heart conversation', effects: { happinessChange: 4, trustChange: 5, romanceChange: 2 }, tone: 'supportive' }
    ]
  },
  {
    title: 'Event Invitation',
    description: 'You\'ve been invited to a gala but your partner has other plans that night.',
    choices: [
      { id: 'skip', label: 'Skip the gala to be with them', effects: { happinessChange: 8, affectionChange: 5 }, tone: 'romantic' },
      { id: 'go_alone', label: 'Attend alone - networking is important', effects: { happinessChange: -3, trustChange: -2 }, tone: 'practical' },
      { id: 'reschedule', label: 'Ask if they can move their plans', effects: { happinessChange: -1, trustChange: -1 }, tone: 'practical' }
    ]
  },
  {
    title: 'Partner\'s Career News',
    description: 'Your partner shares news about their career - a new opportunity has come up.',
    choices: [
      { id: 'enthusiastic', label: 'Be fully supportive and enthusiastic', effects: { happinessChange: 8, trustChange: 5, affectionChange: 5 }, tone: 'supportive' },
      { id: 'worried', label: 'Express concern about how it affects your life', effects: { happinessChange: -5, trustChange: -3 }, tone: 'practical' },
      { id: 'celebrate', label: 'Take them out to celebrate', effects: { happinessChange: 10, romanceChange: 3, moneySpent: 500 }, tone: 'romantic' }
    ]
  }
]

/**
 * Generate a weekly relationship event (if applicable)
 * Returns null if no event occurs this week
 */
export function generateWeeklyRelationshipEvent(
  partnerHappiness: number,
  romanceLevel: number,
  trustLevel: number,
  unresolvedConflicts: number,
  currentWeek: number,
  currentYear: number
): RelationshipEvent | null {
  // Base chance: 30% per week, modified by state
  let chance = 0.30
  
  // More events when relationship is strained
  if (partnerHappiness < 40) chance += 0.15
  if (unresolvedConflicts > 2) chance += 0.10
  
  // Fewer events when everything is great
  if (partnerHappiness > 80 && romanceLevel > 80) chance -= 0.10
  
  if (Math.random() > chance) return null
  
  // Weight event type based on state
  const roll = Math.random()
  let eventPool: typeof POSITIVE_EVENTS
  let eventType: 'positive' | 'negative' | 'neutral'
  
  if (unresolvedConflicts > 2 || partnerHappiness < 30) {
    // More likely negative when things are bad
    if (roll < 0.5) { eventPool = NEGATIVE_EVENTS; eventType = 'negative' }
    else if (roll < 0.8) { eventPool = NEUTRAL_EVENTS; eventType = 'neutral' }
    else { eventPool = POSITIVE_EVENTS; eventType = 'positive' }
  } else if (partnerHappiness > 70 && romanceLevel > 60) {
    // More likely positive when things are good
    if (roll < 0.5) { eventPool = POSITIVE_EVENTS; eventType = 'positive' }
    else if (roll < 0.8) { eventPool = NEUTRAL_EVENTS; eventType = 'neutral' }
    else { eventPool = NEGATIVE_EVENTS; eventType = 'negative' }
  } else {
    // Balanced
    if (roll < 0.35) { eventPool = POSITIVE_EVENTS; eventType = 'positive' }
    else if (roll < 0.65) { eventPool = NEUTRAL_EVENTS; eventType = 'neutral' }
    else { eventPool = NEGATIVE_EVENTS; eventType = 'negative' }
  }
  
  const template = eventPool[Math.floor(Math.random() * eventPool.length)]
  
  return {
    id: `rel_event_${currentWeek}_${currentYear}_${Date.now()}`,
    type: eventType,
    title: template.title,
    description: template.description,
    choices: template.choices,
    week: currentWeek,
    year: currentYear,
    resolved: false
  }
}

// ============================================
// ARGUMENT / CONFLICT SYSTEM
// ============================================

const ARGUMENT_TRIGGERS = [
  'spending habits',
  'time management',
  'jealousy over a coworker',
  'not enough quality time',
  'career priorities',
  'social media post',
  'family interference',
  'household responsibilities',
  'different future plans',
  'broken promise'
]

/**
 * Check if an argument should trigger this week
 */
export function shouldTriggerArgument(
  partnerHappiness: number,
  trustLevel: number,
  unresolvedConflicts: number,
  partnerTraits: string[]
): boolean {
  let chance = 0.05 // Base 5% per week
  
  // Negative traits increase argument chance
  if (partnerTraits.includes('jealous') || partnerTraits.includes('possessive')) chance += 0.08
  if (partnerTraits.includes('dramatic') || partnerTraits.includes('controlling')) chance += 0.06
  if (partnerTraits.includes('passive_aggressive') || partnerTraits.includes('argumentative')) chance += 0.06
  if (partnerTraits.includes('high_maintenance') || partnerTraits.includes('materialistic')) chance += 0.04
  
  // Stacking unresolved conflicts increase chance
  chance += unresolvedConflicts * 0.05
  
  // Low happiness increases chance
  if (partnerHappiness < 40) chance += 0.10
  if (partnerHappiness < 20) chance += 0.10
  
  // Low trust increases chance
  if (trustLevel < 40) chance += 0.08
  
  // Positive traits decrease chance
  if (partnerTraits.includes('supportive') || partnerTraits.includes('patient')) chance -= 0.05
  if (partnerTraits.includes('nurturing') || partnerTraits.includes('forgiving')) chance -= 0.05
  
  return Math.random() < Math.max(0, Math.min(0.5, chance))
}

/**
 * Generate an argument event with trait-weighted topics
 */
export function generateArgument(
  currentWeek: number,
  currentYear: number,
  partnerTraits: string[] = []
): RelationshipEvent {
  const trigger = partnerTraits.length > 0
    ? pickTraitWeightedArgumentTrigger(partnerTraits)
    : ARGUMENT_TRIGGERS[Math.floor(Math.random() * ARGUMENT_TRIGGERS.length)]
  
  return {
    id: `argument_${currentWeek}_${currentYear}_${Date.now()}`,
    type: 'argument',
    title: 'Argument',
    description: `You and your partner got into an argument about ${trigger}.`,
    choices: [
      { 
        id: 'apologize', 
        label: 'Apologize and try to resolve it', 
        effects: { happinessChange: 2, trustChange: 3, conflictResolved: true, stressChange: 5 }, 
        tone: 'supportive' 
      },
      { 
        id: 'compromise', 
        label: 'Suggest a compromise', 
        effects: { happinessChange: 0, trustChange: 5, conflictResolved: true }, 
        tone: 'practical' 
      },
      { 
        id: 'stand_ground', 
        label: 'Stand your ground', 
        effects: { happinessChange: -8, trustChange: -5, stressChange: 8 }, 
        tone: 'confrontational' 
      },
      { 
        id: 'walk_away', 
        label: 'Walk away and cool off', 
        effects: { happinessChange: -3, trustChange: -2, stressChange: 3 }, 
        tone: 'dismissive' 
      }
    ],
    week: currentWeek,
    year: currentYear,
    resolved: false
  }
}

// ============================================
// BREAKUP SYSTEM
// ============================================

export interface BreakupCondition {
  type: 'low_happiness' | 'low_trust' | 'too_many_conflicts' | 'neglect' | 'incompatible'
  severity: number // 0-100
  description: string
}

/**
 * Check conditions for AI-initiated breakup
 * Returns warning signs if breakup is approaching.
 * Now trait-aware: partner traits shift thresholds.
 */
export function checkBreakupConditions(
  partnerHappiness: number,
  trustLevel: number,
  romanceLevel: number,
  unresolvedConflicts: number,
  weeksSinceLastInteraction: number,
  partnerTraits: string[] = [],
  dealBreakerViolationTotal: number = 0
): BreakupCondition[] {
  const conditions: BreakupCondition[] = []
  
  // Trait modifiers for thresholds
  const isForgiving = partnerTraits.includes('forgiving') || partnerTraits.includes('patient')
  const isSupportive = partnerTraits.includes('supportive') || partnerTraits.includes('nurturing')
  const isJealous = partnerTraits.includes('jealous') || partnerTraits.includes('possessive')
  const isMaterialistic = partnerTraits.includes('materialistic') || partnerTraits.includes('high_maintenance')
  const isCommitmentPhobic = partnerTraits.includes('commitment_phobic')
  const isDramatic = partnerTraits.includes('dramatic')
  
  // Forgiving/patient partners tolerate more; dramatic/jealous partners tolerate less
  const happinessThreshold = isForgiving ? 15 : (isDramatic || isJealous ? 35 : 25)
  const trustThreshold = isForgiving ? 12 : (isJealous ? 28 : 20)
  const conflictThreshold = (isSupportive || isForgiving) ? 6 : (isDramatic ? 3 : 4)
  const neglectThreshold = (partnerTraits.includes('independent')) ? 10 : (isJealous || partnerTraits.includes('possessive') ? 4 : 6)
  const romanceThreshold = isCommitmentPhobic ? 25 : 15
  
  if (partnerHappiness < happinessThreshold) {
    conditions.push({
      type: 'low_happiness',
      severity: Math.max(0, 100 - partnerHappiness * 4),
      description: 'Your partner seems deeply unhappy in the relationship'
    })
  }
  
  if (trustLevel < trustThreshold) {
    conditions.push({
      type: 'low_trust',
      severity: Math.max(0, 100 - trustLevel * 5),
      description: 'Trust has broken down between you'
    })
  }
  
  if (unresolvedConflicts >= conflictThreshold) {
    conditions.push({
      type: 'too_many_conflicts',
      severity: Math.min(100, unresolvedConflicts * 20),
      description: 'Too many unresolved arguments are piling up'
    })
  }
  
  if (weeksSinceLastInteraction > neglectThreshold) {
    conditions.push({
      type: 'neglect',
      severity: Math.min(100, weeksSinceLastInteraction * 10),
      description: 'You haven\'t spent quality time together in weeks'
    })
  }
  
  if (romanceLevel < romanceThreshold && partnerHappiness < 40) {
    conditions.push({
      type: 'incompatible',
      severity: Math.max(0, 80 - romanceLevel - partnerHappiness / 2),
      description: isCommitmentPhobic
        ? 'They feel trapped and the relationship feels wrong'
        : 'The spark seems to have completely died'
    })
  }
  
  // Deal breaker violations compound into breakup risk
  if (dealBreakerViolationTotal >= 8) {
    conditions.push({
      type: 'incompatible',
      severity: Math.min(100, dealBreakerViolationTotal * 8),
      description: 'Too many deal breakers have been crossed'
    })
  }
  
  return conditions
}

/**
 * Should the AI partner initiate a breakup?
 */
export function shouldPartnerBreakUp(conditions: BreakupCondition[]): boolean {
  if (conditions.length === 0) return false
  
  const totalSeverity = conditions.reduce((sum, c) => sum + c.severity, 0)
  const maxSeverity = Math.max(...conditions.map(c => c.severity))
  
  // Multiple simultaneous issues OR one critical issue
  if (totalSeverity > 200 && conditions.length >= 2) return Math.random() < 0.3
  if (maxSeverity > 90) return Math.random() < 0.2
  if (totalSeverity > 150) return Math.random() < 0.1
  
  return false
}

// ============================================
// DATE OUTCOME SYSTEM
// ============================================

/**
 * Determine date quality based on compatibility, mood, and randomness
 */
export function calculateDateOutcome(
  compatibilityScore: number,
  partnerMood: number, // 0-100
  romanceLevel: number,
  sharedInterests: number // How many interests overlap
): DateOutcome {
  // Base quality score
  let qualityScore = compatibilityScore * 0.3 + partnerMood * 0.2 + romanceLevel * 0.2 + sharedInterests * 5
  
  // Add randomness (±20 points)
  qualityScore += (Math.random() * 40) - 20
  
  let quality: DateQuality
  let description: string
  let moodChange: number
  let romanceChange: number
  let trustChange: number
  let specialMoment: string | undefined
  let milestone: RelationshipMilestoneType | undefined
  
  if (qualityScore >= 80) {
    quality = 'amazing'
    description = 'An absolutely magical evening. Everything felt perfect.'
    moodChange = 15
    romanceChange = 12
    trustChange = 8
    if (romanceLevel > 50 && Math.random() < 0.3) {
      specialMoment = 'A spontaneous kiss under the stars'
      milestone = 'first_kiss'
    }
  } else if (qualityScore >= 60) {
    quality = 'great'
    description = 'A wonderful time together. You really connected.'
    moodChange = 10
    romanceChange = 8
    trustChange = 5
  } else if (qualityScore >= 40) {
    quality = 'good'
    description = 'A pleasant evening, though nothing extraordinary.'
    moodChange = 5
    romanceChange = 4
    trustChange = 3
  } else if (qualityScore >= 20) {
    quality = 'awkward'
    description = 'Some awkward silences and a few missteps. Not your best night.'
    moodChange = -3
    romanceChange = -2
    trustChange = 0
  } else {
    quality = 'disaster'
    description = 'Everything that could go wrong did. A night to forget.'
    moodChange = -10
    romanceChange = -8
    trustChange = -5
  }
  
  // Reveal a compatibility insight
  const compatibilityReveal = qualityScore >= 60 
    ? 'You discovered you share more in common than you thought.'
    : qualityScore < 30 
      ? 'You realized you have very different views on some things.'
      : undefined
  
  return {
    quality,
    description,
    moodChange,
    romanceChange,
    trustChange,
    compatibilityReveal,
    specialMoment,
    milestone
  }
}

// ============================================
// ANNIVERSARY SYSTEM
// ============================================

/**
 * Check if it's an anniversary week
 */
export function checkAnniversary(
  startWeek: number,
  startYear: number,
  currentWeek: number,
  currentYear: number
): { isAnniversary: boolean; years: number } | null {
  if (currentWeek === startWeek && currentYear > startYear) {
    return {
      isAnniversary: true,
      years: currentYear - startYear
    }
  }
  return null
}

/**
 * Generate an anniversary event
 */
export function generateAnniversaryEvent(
  years: number,
  currentWeek: number,
  currentYear: number,
  partnerName: string
): RelationshipEvent {
  const yearLabel = years === 1 ? '1st' : years === 2 ? '2nd' : years === 3 ? '3rd' : `${years}th`
  
  return {
    id: `anniversary_${currentYear}_${years}`,
    type: 'milestone',
    title: `${yearLabel} Anniversary`,
    description: `It's your ${yearLabel} anniversary with ${partnerName}! How do you celebrate?`,
    choices: [
      {
        id: 'grand_gesture',
        label: 'Plan an extravagant surprise',
        effects: { happinessChange: 15, romanceChange: 12, affectionChange: 10, moneySpent: 5000 * years },
        tone: 'romantic'
      },
      {
        id: 'intimate',
        label: 'Arrange an intimate, meaningful evening',
        effects: { happinessChange: 12, romanceChange: 10, trustChange: 8, moneySpent: 500 },
        tone: 'romantic'
      },
      {
        id: 'gift',
        label: 'Give a thoughtful gift',
        effects: { happinessChange: 8, affectionChange: 8, moneySpent: 1000 * years },
        tone: 'supportive'
      },
      {
        id: 'forgot',
        label: 'You forgot...',
        effects: { happinessChange: -20, trustChange: -15, romanceChange: -10 },
        tone: 'dismissive'
      }
    ],
    week: currentWeek,
    year: currentYear,
    resolved: false
  }
}

// ============================================
// DEAL BREAKER VIOLATION SYSTEM
// ============================================

export interface DealBreakerViolation {
  dealBreaker: string
  trustDamage: number
  romanceDamage: number
  warningMessage: string
  violationCount: number       // Total violations for this deal breaker
  isUltimatumTrigger: boolean  // True if this violation triggers an ultimatum
}

/**
 * Evaluate all deal breakers for a partner against current game state.
 * Returns violations found this check.
 */
export function evaluateDealBreakerViolations(
  partnerDealBreakers: string[],
  gameState: DealBreakerGameState,
  currentViolationCounts: Record<string, number>,
  warningsAlreadyGiven: string[]
): DealBreakerViolation[] {
  const violations: DealBreakerViolation[] = []
  
  for (const db of partnerDealBreakers) {
    const mapping = findDealBreakerMapping(db)
    if (!mapping) continue
    
    if (mapping.check(gameState)) {
      const currentCount = (currentViolationCounts[db] || 0) + 1
      const isUltimatum = currentCount >= mapping.ultimatumAfter && !warningsAlreadyGiven.includes(db)
      
      violations.push({
        dealBreaker: db,
        trustDamage: mapping.trustDamage,
        romanceDamage: mapping.romanceDamage,
        warningMessage: mapping.warningMessage,
        violationCount: currentCount,
        isUltimatumTrigger: isUltimatum
      })
    }
  }
  
  return violations
}

/**
 * Generate an ultimatum event when a deal breaker has been violated too many times.
 */
export function generateUltimatumEvent(
  dealBreaker: string,
  partnerName: string,
  currentWeek: number,
  currentYear: number
): RelationshipEvent {
  return {
    id: `ultimatum_${currentWeek}_${currentYear}_${Date.now()}`,
    type: 'ultimatum',
    title: 'Serious Talk',
    description: `${partnerName} sits you down for a serious conversation. They say they can't keep ignoring this: "${dealBreaker}". Something needs to change.`,
    choices: [
      {
        id: 'promise_change',
        label: 'Promise to change and mean it',
        effects: { happinessChange: 5, trustChange: 8, conflictResolved: true },
        tone: 'supportive'
      },
      {
        id: 'acknowledge',
        label: 'Acknowledge the issue but make no promises',
        effects: { happinessChange: -3, trustChange: -2 },
        tone: 'practical'
      },
      {
        id: 'dismiss',
        label: 'Tell them they\'re overreacting',
        effects: { happinessChange: -15, trustChange: -12, romanceChange: -8, stressChange: 10 },
        tone: 'confrontational'
      },
      {
        id: 'deflect',
        label: 'Change the subject',
        effects: { happinessChange: -8, trustChange: -8, romanceChange: -3 },
        tone: 'dismissive'
      }
    ],
    week: currentWeek,
    year: currentYear,
    resolved: false
  }
}

/**
 * Apply deal breaker violations to a partner's state.
 * Returns updated partner and any mood factors added.
 */
export function applyDealBreakerViolations(
  partner: Partner,
  violations: DealBreakerViolation[]
): { updatedPartner: Partner; moodFactors: MoodFactor[] } {
  if (violations.length === 0) {
    return { updatedPartner: partner, moodFactors: [] }
  }
  
  let trustDelta = 0
  let loveDelta = 0
  const moodFactors: MoodFactor[] = []
  const updatedCounts = { ...partner.dealBreakerViolationCount }
  const updatedWarnings = [...partner.dealBreakerWarningsGiven]
  
  for (const v of violations) {
    trustDelta += v.trustDamage
    loveDelta += v.romanceDamage
    updatedCounts[v.dealBreaker] = v.violationCount
    
    if (v.isUltimatumTrigger) {
      updatedWarnings.push(v.dealBreaker)
    }
    
    moodFactors.push({
      reason: `${partner.firstName} ${v.warningMessage}`,
      impact: v.trustDamage + v.romanceDamage,
      weeksRemaining: 4,
      category: 'relationship'
    })
  }
  
  return {
    updatedPartner: {
      ...partner,
      trustLevel: Math.max(0, Math.min(100, partner.trustLevel + trustDelta)),
      loveLevel: Math.max(0, Math.min(100, partner.loveLevel + loveDelta)),
      dealBreakerViolationCount: updatedCounts,
      dealBreakerWarningsGiven: updatedWarnings,
      recentMoodFactors: [...partner.recentMoodFactors, ...moodFactors]
    },
    moodFactors
  }
}

// ============================================
// TRAIT-WEIGHTED ARGUMENT TOPICS
// ============================================

const TRAIT_ARGUMENT_TOPICS: Record<string, { topics: string[]; weight: number }> = {
  jealous: {
    topics: ['jealousy over someone at the paddock', 'you spending time with attractive colleagues', 'a flirty comment on social media'],
    weight: 0.6
  },
  possessive: {
    topics: ['you not replying to their texts fast enough', 'you going out without telling them', 'how much time you spend with your team'],
    weight: 0.6
  },
  materialistic: {
    topics: ['not spending enough on them', 'wanting a more luxurious lifestyle', 'comparing themselves to other partners in the paddock'],
    weight: 0.5
  },
  controlling: {
    topics: ['career decisions you made without consulting them', 'who you spend your free time with', 'your schedule being out of their control'],
    weight: 0.5
  },
  dramatic: {
    topics: ['something minor that got blown out of proportion', 'a misunderstood text message', 'feeling like you don\'t care enough'],
    weight: 0.5
  },
  high_maintenance: {
    topics: ['the quality of your date night not being good enough', 'not meeting their expectations', 'a gift they found disappointing'],
    weight: 0.4
  },
  workaholic: {
    topics: ['you never prioritizing the relationship', 'canceling plans for work again', 'feeling like you\'re married to your career'],
    weight: 0.4
  },
  passive_aggressive: {
    topics: ['something they won\'t directly tell you about', 'a build-up of small resentments', 'a sarcastic comment that went too far'],
    weight: 0.4
  },
  self_centered: {
    topics: ['you not listening when they talk', 'making everything about your racing', 'forgetting something important to them'],
    weight: 0.4
  },
  secretive: {
    topics: ['them hiding something from you', 'feeling like you don\'t really know them', 'a mysterious phone call they won\'t explain'],
    weight: 0.3
  },
  commitment_phobic: {
    topics: ['where the relationship is heading', 'future plans they keep avoiding', 'meeting each other\'s families'],
    weight: 0.3
  },
  party_animal: {
    topics: ['them coming home too late', 'their drinking habits', 'embarrassing behavior at a public event'],
    weight: 0.3
  }
}

/**
 * Pick an argument trigger weighted by partner traits.
 * Falls back to the generic pool for traits without specific topics.
 */
function pickTraitWeightedArgumentTrigger(partnerTraits: string[]): string {
  // Build a weighted pool of trait-specific topics
  const weightedTopics: Array<{ topic: string; weight: number }> = []
  
  for (const trait of partnerTraits) {
    const config = TRAIT_ARGUMENT_TOPICS[trait]
    if (config) {
      for (const topic of config.topics) {
        weightedTopics.push({ topic, weight: config.weight })
      }
    }
  }
  
  // If we have trait-specific topics, use them with high probability
  if (weightedTopics.length > 0 && Math.random() < 0.7) {
    // Weighted random selection
    const totalWeight = weightedTopics.reduce((sum, t) => sum + t.weight, 0)
    let roll = Math.random() * totalWeight
    for (const wt of weightedTopics) {
      roll -= wt.weight
      if (roll <= 0) return wt.topic
    }
    return weightedTopics[0].topic
  }
  
  // Fallback to generic triggers
  return ARGUMENT_TRIGGERS[Math.floor(Math.random() * ARGUMENT_TRIGGERS.length)]
}

// ============================================
// DESIRE-BASED EVENT TRIGGERS
// ============================================

export interface DesirePressureEvent {
  type: 'marriage_pressure' | 'children_pressure'
  trustDecay: number
  happinessDecay: number
  message: string
  triggerConversation: boolean
}

/**
 * Check if partner desires are creating pressure events.
 * Called weekly after the main relationship check.
 */
export function checkDesirePressure(
  partner: Partner,
  weeksInRelationship: number,
  currentWeek: number,
  currentYear: number
): DesirePressureEvent | null {
  const desires = partner.desires
  
  // Marriage pressure: dating 2+ years, wants marriage, not yet engaged/married
  if (desires.wantsMarriage &&
      (partner.relationshipStatus === 'dating') &&
      weeksInRelationship >= 104) { // ~2 years
    
    const yearsWaiting = Math.floor((weeksInRelationship - 104) / 52)
    const trustDecay = -1 - yearsWaiting // Gets worse each year
    const shouldTriggerConvo = weeksInRelationship % 26 === 0 // Every ~6 months
    
    return {
      type: 'marriage_pressure',
      trustDecay: Math.max(-4, trustDecay),
      happinessDecay: -2,
      message: `${partner.firstName} has been hinting about the future of your relationship`,
      triggerConversation: shouldTriggerConvo
    }
  }
  
  // Children pressure: married 2+ years, wants children, no children yet
  if (desires.wantsChildren &&
      partner.relationshipStatus === 'married' &&
      partner.marriageDate &&
      partner.childrenIds.length < desires.desiredChildrenCount) {
    
    const marriageWeeks = (currentYear - partner.marriageDate.year) * 52 +
      (currentWeek - partner.marriageDate.week)
    
    if (marriageWeeks >= 104) { // 2+ years married
      const yearsWaiting = Math.floor((marriageWeeks - 104) / 52)
      const shouldTriggerConvo = marriageWeeks % 26 === 0
      
      return {
        type: 'children_pressure',
        trustDecay: -1,
        happinessDecay: Math.max(-3, -1 - yearsWaiting),
        message: `${partner.firstName} has brought up starting a family again`,
        triggerConversation: shouldTriggerConvo
      }
    }
  }
  
  return null
}

/**
 * Generate a "where is this going?" conversation event for desire pressure.
 */
export function generateDesirePressureEvent(
  pressure: DesirePressureEvent,
  partnerName: string,
  currentWeek: number,
  currentYear: number
): RelationshipEvent {
  const isMarriage = pressure.type === 'marriage_pressure'
  
  return {
    id: `desire_pressure_${currentWeek}_${currentYear}_${Date.now()}`,
    type: 'milestone',
    title: isMarriage ? 'Where Is This Going?' : 'Starting a Family',
    description: isMarriage
      ? `${partnerName} asks you where this relationship is heading. They clearly want to talk about the future.`
      : `${partnerName} brings up the topic of children again. They clearly want to start a family.`,
    choices: [
      {
        id: 'commit',
        label: isMarriage ? 'Reassure them you\'re thinking about it' : 'Tell them you want that too',
        effects: { happinessChange: 10, trustChange: 8, romanceChange: 5, conflictResolved: true },
        tone: 'supportive'
      },
      {
        id: 'honest_unsure',
        label: 'Be honest that you\'re not sure yet',
        effects: { happinessChange: -5, trustChange: 3, romanceChange: -3 },
        tone: 'practical'
      },
      {
        id: 'deflect',
        label: 'Change the subject',
        effects: { happinessChange: -10, trustChange: -8, romanceChange: -5 },
        tone: 'dismissive'
      },
      {
        id: 'reject',
        label: isMarriage ? 'Tell them you\'re not interested in marriage' : 'Say you don\'t want children',
        effects: { happinessChange: -20, trustChange: -10, romanceChange: -15, stressChange: 10 },
        tone: 'confrontational'
      }
    ],
    week: currentWeek,
    year: currentYear,
    resolved: false
  }
}

// ============================================
// EXPORTS
// ============================================

export {
  POSITIVE_EVENTS,
  NEGATIVE_EVENTS,
  NEUTRAL_EVENTS,
  ARGUMENT_TRIGGERS,
  TRAIT_ARGUMENT_TOPICS,
  MAX_CONTACTS,
  MAX_POTENTIAL_DATES,
  STALENESS_THRESHOLD_WEEKS
}
