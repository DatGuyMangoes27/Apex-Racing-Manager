import { CommentaryEvent, EventContext, CommentaryEventType, NarrativeMemory } from './engine'
import { commentaryLog } from '../services/debugLogger'
import { 
  getSeriesProfile, 
  buildAvoidTermsPrompt, 
  buildPreferredTermsPrompt,
  SeriesCategory,
  SERIES_PROFILES
} from '../../src/data/series-commentary'
import { getCommentaryEntityState, upsertCommentaryEntityState } from '../db/database'
import {
  buildPromptPacket,
  buildThreadCallbackGuide,
  buildThreadContinuitySummary,
  getCoverageHistorySnapshot,
  setCoverageHistorySnapshot,
} from './promptPacket'

/**
 * Script Generator
 * 
 * Uses Gemini 3 Flash to generate dynamic, colorful race commentary.
 * Supports Practice, Qualifying, Race, and color commentary.
 * Includes career context for personalized commentary.
 * Features anti-repetition system and energy level awareness.
 */

const PROMPT_MAX_CHARS = 24000
const COVERAGE_HISTORY_STATE_KEY = 'coverage_lane_history'
let coverageHistoryLoadedForSeries: string | null = null

function getSeriesCoverageEntityId(context: EventContext): string {
  return `coverage:${context.seriesName || context.seriesShortName || 'global'}`
}

function ensureCoverageHistoryLoaded(context: EventContext): void {
  const entityId = getSeriesCoverageEntityId(context)
  if (coverageHistoryLoadedForSeries === entityId) return

  const existing = getCommentaryEntityState('series', entityId)
  if (existing.success && existing.data) {
    const state = existing.data.find((item) => item.stateKey === COVERAGE_HISTORY_STATE_KEY)
    if (state && Array.isArray(state.value)) {
      setCoverageHistorySnapshot(state.value as any)
    }
  }
  coverageHistoryLoadedForSeries = entityId
}

function persistCoverageHistory(context: EventContext): void {
  const entityId = getSeriesCoverageEntityId(context)
  upsertCommentaryEntityState({
    entityType: 'series',
    entityId,
    stateKey: COVERAGE_HISTORY_STATE_KEY,
    value: getCoverageHistorySnapshot(),
    roundUpdated: context.currentRound,
  })
}

function clampPromptLength(prompt: string): string {
  if (prompt.length <= PROMPT_MAX_CHARS) return prompt
  const trimmed = `${prompt.slice(0, PROMPT_MAX_CHARS)}\n\n[Prompt truncated for token safety.]`
  commentaryLog.error('PROMPT_TRUNCATED', {
    originalLength: prompt.length,
    trimmedLength: trimmed.length,
    maxChars: PROMPT_MAX_CHARS,
  })
  return trimmed
}

function evaluateThreadResolutionQuality(event: CommentaryEvent, script: string): void {
  if (!['RACE_WIN', 'PODIUM_FINISH', 'RACE_FINISH', 'SESSION_END'].includes(event.type)) return
  const threads = event.context.narrativeThreads || []
  if (!threads.length) return
  const lower = script.toLowerCase()
  const payoffKeywords = ['payoff', 'finally', 'delivered', 'sealed', 'completed', 'came together',
    'answered', 'verdict', 'resolved', 'proved', 'statement', 'chapter closes']
  const cooldownKeywords = ['settled', 'reset', 'regroup', 'pressure off', 'next chapter', 'looking ahead',
    'wait for', 'next round', 'remains to be seen', 'cliffhanger', 'unfinished business']
  const hasPayoffSignal = payoffKeywords.some((k) => lower.includes(k))
  const hasCooldownSignal = cooldownKeywords.some((k) => lower.includes(k))
  commentaryLog.threadResolutionQuality(event.type, hasPayoffSignal, hasCooldownSignal)
}

/**
 * Remove any self-references that slip through the AI prompts
 * Catches phrases like "I'm Crofty", "this is Vicky", etc. for both commentators
 */
function removeSelfReferences(script: string): string {
  // Patterns that indicate self-reference (case insensitive) - covers both Crofty and Vicky
  const selfReferencePatterns = [
    // Crofty patterns (lead commentator)
    /\bi['']?m crofty\b/gi,           // "I'm Crofty", "Im Crofty"
    /\bthis is crofty\b/gi,           // "This is Crofty"
    /\bcrofty here\b/gi,              // "Crofty here"
    /\bmy name is crofty\b/gi,        // "My name is Crofty"
    /\bi['']?m your host,? crofty\b/gi, // "I'm your host, Crofty"
    /\bwelcome,? i['']?m crofty\b/gi, // "Welcome, I'm Crofty"
    /\bcrofty reporting\b/gi,         // "Crofty reporting"
    /\bcrofty speaking\b/gi,          // "Crofty speaking"
    /\bi,? crofty,?\b/gi,             // "I, Crofty," - self-identification
    // Vicky patterns (co-commentator)
    /\bi['']?m vicky\b/gi,           // "I'm Vicky", "Im Vicky"
    /\bthis is vicky\b/gi,           // "This is Vicky"
    /\bvicky here\b/gi,              // "Vicky here"
    /\bmy name is vicky\b/gi,        // "My name is Vicky"
    /\bi['']?m your host,? vicky\b/gi, // "I'm your host, Vicky"
    /\bwelcome,? i['']?m vicky\b/gi, // "Welcome, I'm Vicky"
    /\bvicky reporting\b/gi,         // "Vicky reporting"
    /\bvicky speaking\b/gi,          // "Vicky speaking"
    /\bi,? vicky,?\b/gi,             // "I, Vicky," - self-identification
  ]
  
  let cleaned = script
  let foundSelfReference = false
  
  for (const pattern of selfReferencePatterns) {
    if (pattern.test(cleaned)) {
      foundSelfReference = true
      // Remove the self-reference and clean up extra spaces/punctuation
      cleaned = cleaned.replace(pattern, '')
    }
  }
  
  if (foundSelfReference) {
    // Clean up any resulting double spaces, leading/trailing commas
    cleaned = cleaned
      .replace(/\s{2,}/g, ' ')           // Multiple spaces -> single
      .replace(/^[,.\s]+|[,\s]+$/g, '')  // Leading/trailing punctuation
      .replace(/\s+([,.])/g, '$1')       // Space before punctuation
      .trim()
    
    console.log('[ScriptGenerator] Removed self-reference from commentary')
  }
  
  return cleaned
}

/**
 * Validate if a name looks like a real driver name vs a team/manufacturer/car
 * Returns the name if valid, or null if it looks suspicious
 */
function validateDriverName(name: string | undefined): string | null {
  if (!name || name.trim() === '') return null
  
  const trimmedName = name.trim()
  
  // Known team/manufacturer keywords (case insensitive check)
  const suspiciousKeywords = [
    // Team suffixes
    'racing', 'motorsport', 'team', 'sport', 'works', 'factory', 'junior', 'academy',
    // Manufacturers
    'bmw', 'mercedes', 'ferrari', 'porsche', 'audi', 'mclaren', 'williams', 'alpine',
    'alfa romeo', 'aston martin', 'haas', 'red bull', 'redbull', 'toro rosso', 'alphatauri',
    'lamborghini', 'bentley', 'jaguar', 'lexus', 'nissan', 'honda', 'toyota', 'hyundai',
    'chevrolet', 'ford', 'dodge', 'cadillac', 'corvette', 'camaro', 'mustang',
    // Car models/classes
    'gt3', 'gt4', 'gte', 'lmp1', 'lmp2', 'lmp3', 'dpi', 'lmdh', 'hypercar',
    'm4', 'm3', 'm8', '911', '992', '991', '488', '296', 'huracan', 'r8',
    'amg', 'vantage', 'continental', 'supra', 'nsx', 'z4', 'cayman', 'boxster',
    // Series names
    'formula', 'f1', 'f2', 'f3', 'f4', 'indycar', 'nascar', 'imsa', 'wec', 'elms'
  ]
  
  const lowerName = trimmedName.toLowerCase()
  
  // Check if name contains suspicious keywords
  for (const keyword of suspiciousKeywords) {
    if (lowerName.includes(keyword)) {
      console.log(`[ScriptGenerator] Filtered suspicious driver name: "${trimmedName}" (contains "${keyword}")`)
      return null
    }
  }
  
  // Check if name is ONLY a number (car number)
  if (/^\d+$/.test(trimmedName)) {
    console.log(`[ScriptGenerator] Filtered car number as driver name: "${trimmedName}"`)
    return null
  }
  
  // Check if name looks like a car designation (e.g., "#123", "Car 45")
  if (/^(#|car\s*|no\.?\s*)\d+$/i.test(trimmedName)) {
    console.log(`[ScriptGenerator] Filtered car designation: "${trimmedName}"`)
    return null
  }
  
  // Valid driver name - return it
  return trimmedName
}

/**
 * Get a safe driver name for use in commentary
 * Returns the validated name or a generic fallback
 */
function getSafeDriverName(name: string | undefined, fallback: string = 'the driver'): string {
  const validated = validateDriverName(name)
  return validated || fallback
}

// ===== 10-THEME ROTATION SYSTEM =====
// Prevents repetitive commentary by rotating narrative focus

type NarrativeTheme = 
  | 'TECHNICAL'        // Car health, temps, mechanical
  | 'CAREER'           // Rookie status, age, background story
  | 'DRIVER_BACKGROUND' // Rich driver lore/background packet
  | 'STANDINGS'        // Championship points, live standings
  | 'RIVALRY'          // Head-to-head with specific drivers
  | 'TRACK'            // Circuit character, weather, venue
  | 'STRATEGY'         // Momentum, deltas, tire management
  | 'EXPECTATION'      // Team tier, over/underachieving
  | 'TEAM_INFO'        // Team lore/culture/trajectory packet
  | 'PSYCHOLOGY'       // Pressure, mental game, nerves
  | 'TRACK_HISTORY'    // Historical record at this specific track
  | 'RECORD_CHASING'   // Chasing historical records, GOAT progress
  | 'MEDIA'            // Media persona, press headlines, public image
  | 'ACHIEVEMENTS'     // Consecutive wins, comebacks, hat tricks, etc.
  | 'CONTRACT_DYNAMICS' // Team satisfaction, warnings, contract pressure
  | 'SPONSOR_PRESSURE' // Sponsor satisfaction, commercial pressure
  | 'SESSION_MEMORY'

// Track recent commentary lines to avoid repetition
const recentLines: string[] = []
const MAX_RECENT_LINES = 50

// Track recent commentary topics to avoid repeating the same kind of line
export type NarrativeStrand = 'VENUE' | 'DRIVER' | 'TEAM' | 'SEASON' | 'SESSION'

type CommentaryTopic =
  | 'SAFETY_FLAGS'
  | 'ACTION_BATTLE'
  | 'OVERTAKE_MOVE'
  | 'DEFENCE_PRESSURE'
  | 'PACE_TREND'
  | 'STRATEGY_PIT'
  | 'STRATEGY_TYRES'
  | 'PSYCHOLOGY_DRAMA'
  | 'RIVALRY_DUEL'
  | 'STANDINGS_POINTS'
  | 'WEATHER_CONDITIONS'
  | 'TRACK_LIMITS'
  | 'TECHNICAL_CAR'
  | 'MEDIA_PADDOCK'
  | 'GENERAL_COLOR'

// Map NarrativeThemes to their high-level Strands
const THEME_TO_STRAND: Record<NarrativeTheme, NarrativeStrand> = {
  'TRACK': 'VENUE',
  'TRACK_HISTORY': 'VENUE',
  'DRIVER_BACKGROUND': 'DRIVER',
  'EXPECTATION': 'DRIVER',
  'ACHIEVEMENTS': 'DRIVER',
  'CAREER': 'DRIVER',
  'TEAM_INFO': 'TEAM',
  'CONTRACT_DYNAMICS': 'TEAM',
  'SPONSOR_PRESSURE': 'TEAM',
  'STANDINGS': 'SEASON',
  'RIVALRY': 'SEASON',
  'MEDIA': 'SEASON',
  'RECORD_CHASING': 'SEASON',
  'TECHNICAL': 'SESSION',
  'STRATEGY': 'SESSION',
  'SESSION_MEMORY': 'SESSION',
  'PSYCHOLOGY': 'DRIVER' // Psychology fits best into Driver strand
}

const strandHistory: NarrativeStrand[] = []
const STRAND_HISTORY_SIZE = 3

function trackRecentStrand(strand: NarrativeStrand): void {
  strandHistory.push(strand)
  if (strandHistory.length > STRAND_HISTORY_SIZE) {
    strandHistory.shift()
  }
}

const recentTopics: CommentaryTopic[] = []
const MAX_RECENT_TOPICS = 20

function trackRecentTopic(topic: CommentaryTopic): void {
  recentTopics.push(topic)
  if (recentTopics.length > MAX_RECENT_TOPICS) {
    recentTopics.shift()
  }
}

/**
 * SMART TOPIC SELECTION
 * Picks topics based on:
 * 1. Event type (obvious mappings)
 * 2. Current race situation (gaps, battles, momentum)
 * 3. Broadcast phase (early/mid/late session)
 * 4. Session type (practice/quali/race need different topics)
 * 5. Energy level (calm vs intense moments)
 */
function getTopicForEvent(eventType: CommentaryEventType, context: EventContext): CommentaryTopic {
  // Flags always get flag topic
  if (eventType.startsWith('FLAG_')) return 'SAFETY_FLAGS'

  // High-signal race action - direct mappings
  switch (eventType) {
    case 'OVERTAKE': return 'OVERTAKE_MOVE'
    case 'POSITION_LOST': return 'ACTION_BATTLE'
    case 'BATTLE_FORMING': return 'DEFENCE_PRESSURE'
    case 'UNDER_PRESSURE': return 'DEFENCE_PRESSURE'
    case 'GAP_CLOSING': return 'DEFENCE_PRESSURE'
    case 'PRESSURE_BUILDING': return 'DEFENCE_PRESSURE'
    case 'DEFENSIVE_DRIVING': return 'DEFENCE_PRESSURE'
    case 'PIT_ENTRY':
    case 'PIT_EXIT':
    case 'PIT_ACTIVITY':
      return 'STRATEGY_PIT'
    case 'WEATHER_CHANGE':
      return 'WEATHER_CONDITIONS'
    case 'TRACK_LIMITS':
      return 'TRACK_LIMITS'
    case 'CHAMPIONSHIP_UPDATE':
      return 'STANDINGS_POINTS'
    case 'RIVALRY_MENTION':
      return 'RIVALRY_DUEL'
    case 'TEAM_PRESSURE_MENTION':
    case 'SPONSOR_PRESSURE_MENTION':
    case 'MEDIA_HEADLINE_CALLBACK':
      return 'MEDIA_PADDOCK'
  }

  // ===== SMART COLOR COMMENTARY TOPIC SELECTION =====
  if (eventType === 'COLOR_COMMENTARY' || eventType === 'LAP_COMPLETE' || eventType === 'RANDOM_FACT' ||
      eventType === 'DRIVER_BACKGROUND' || eventType === 'TEAM_INFO' || eventType === 'TRIVIA_DROP' ||
      eventType === 'TRACK_CHARACTER' || eventType === 'CORNER_CALLOUT') {
    
    const broadcastPhase = context.broadcastPhase || 'mid-session'
    const sessionType = context.sessionType
    const hasValidTiming = context.hasValidTiming !== false
    
    // ===== PHASE-AWARE TOPIC SELECTION =====
    
    // EARLY SESSION - No timing data, fill with appropriate content
    if (broadcastPhase === 'early-session' || !hasValidTiming) {
      if (sessionType === 'Race') {
        // Early race laps - talk about the start, early battles, position changes
        const earlyRaceTopics: CommentaryTopic[] = ['ACTION_BATTLE', 'PSYCHOLOGY_DRAMA', 'PACE_TREND']
        // Check if there's actual early-race drama
        if (context.positionsGainedFromGrid !== undefined && Math.abs(context.positionsGainedFromGrid) >= 2) {
          return 'ACTION_BATTLE' // Big position change at start
        }
        return earlyRaceTopics[Math.floor(Math.random() * earlyRaceTopics.length)]
      }
      if (sessionType === 'Qualifying') {
        // Early quali - talk about the pressure, grid stakes, strategy
        const earlyQualiTopics: CommentaryTopic[] = ['PSYCHOLOGY_DRAMA', 'STRATEGY_PIT', 'GENERAL_COLOR']
        return earlyQualiTopics[Math.floor(Math.random() * earlyQualiTopics.length)]
      }
      // Early Practice - varied mix of topics for engaging broadcasts
      const hasActualWeather = (context.rainDensity !== undefined && context.rainDensity > 0) ||
                               (context.weatherCondition && context.weatherCondition !== 'dry')
      const earlyPracticeTopics: CommentaryTopic[] = [
        'GENERAL_COLOR', 'TECHNICAL_CAR', 'PACE_TREND',
        'PSYCHOLOGY_DRAMA', 'MEDIA_PADDOCK',
      ]
      if (hasActualWeather) earlyPracticeTopics.push('WEATHER_CONDITIONS')
      const filtered = earlyPracticeTopics.filter(t => !recentTopics.slice(-4).includes(t))
      const pool = filtered.length >= 2 ? filtered : earlyPracticeTopics
      return pool[Math.floor(Math.random() * pool.length)]
    }
    
    // LATE SESSION - Build tension, championship implications
    if (broadcastPhase === 'late-session') {
      if (sessionType === 'Race') {
        // Late race - DRAMA! Final push, championship implications
        if (context.championshipPosition && context.championshipPosition <= 3) {
          return 'STANDINGS_POINTS' // Championship on the line!
        }
        if ((context.gapAhead !== undefined && context.gapAhead < 2) || 
            (context.gapBehind !== undefined && context.gapBehind < 2)) {
          return 'DEFENCE_PRESSURE' // Late race battle!
        }
        return 'PSYCHOLOGY_DRAMA' // Final lap nerves
      }
      if (sessionType === 'Qualifying') {
        return 'PSYCHOLOGY_DRAMA' // Final qualifying attempts - the pressure!
      }
    }
    
    // ===== SITUATION-AWARE TOPIC SELECTION (MID-SESSION) =====
    
    // Priority 1: Active battle (close gaps) - most exciting!
    if ((context.gapAhead !== undefined && context.gapAhead < 1.5) || 
        (context.gapBehind !== undefined && context.gapBehind < 1.2)) {
      // In a fight! Decide between attack vs defence narrative
      if (context.gapAhead !== undefined && context.gapAhead < context.gapBehind!) {
        return 'ACTION_BATTLE' // Attacking
      }
      return 'DEFENCE_PRESSURE' // Defending
    }
    
    // Priority 2: Rival nearby - rivalry narrative takes over
    if (context.rivalName && context.rivalPosition) {
      const rivalGap = Math.abs((context.playerPosition || 99) - context.rivalPosition)
      if (rivalGap <= 2) {
        return 'RIVALRY_DUEL' // Rival is RIGHT THERE
      }
    }
    
    // Priority 3: Momentum shift - catching or falling back
    if (context.momentumStatus === 'catching') {
      return 'PACE_TREND' // Gaining ground - exciting!
    }
    if (context.momentumStatus === 'falling_back') {
      return 'PSYCHOLOGY_DRAMA' // Losing ground - concern!
    }
    
    // Priority 4: Pressure situation
    if (context.pressureLevel === 'intense' || context.pressureLevel === 'critical') {
      return 'PSYCHOLOGY_DRAMA'
    }
    
    // Priority 5: Clear air / stable running - wide variety
    const stableTopics: CommentaryTopic[] = [
      'PACE_TREND',        // Talk about consistency, lap times
      'GENERAL_COLOR',     // General observations
      'TECHNICAL_CAR',     // Car performance
      'PSYCHOLOGY_DRAMA',  // Driver mindset
      'MEDIA_PADDOCK',     // Paddock stories
    ]
    if (context.championshipPosition && context.championshipPosition <= 5) {
      stableTopics.push('STANDINGS_POINTS')
    }
    const stableFiltered = stableTopics.filter(t => !recentTopics.slice(-4).includes(t))
    const stablePool = stableFiltered.length >= 2 ? stableFiltered : stableTopics
    return stablePool[Math.floor(Math.random() * stablePool.length)]
  }

  return 'GENERAL_COLOR'
}

// Energy levels for varied delivery
export type EnergyLevel = 'calm' | 'building' | 'intense' | 'celebration'

// ===== CREATIVE FLAVOR SYSTEM =====
// Randomized elements to keep the AI from falling into patterns
// Expanded for more natural, varied TV commentary

const COMMENTARY_STYLES = [
  'Murray Walker style - infectious enthusiasm, slight hyperbole, legendary energy',
  'Martin Brundle style - technical insight wrapped in accessible language, ex-driver expertise', 
  'David Croft style - dramatic buildups, catchphrases, crowd-pleasing energy',
  'Ted Kravitz style - quirky observations, paddock insider knowledge, charming tangents',
  'Karun Chandhok style - data-driven analysis with genuine excitement',
  'Ben Edwards style - smooth, reassuring, knowledgeable calm',
  'Alex Jacques style - articulate, precise, storytelling excellence',
  'Jack Nicholls style - raw emotion, genuine excitement, infectious passion',
  'Natural conversational - like chatting with a knowledgeable friend in the pub',
  'Observational - noticing small details others might miss',
  'Wry humor - a touch of wit without forcing it',
  'Nostalgic - appreciating the moment as part of motorsport history'
]

const MOOD_FLAVORS = [
  'Paint a vivid picture - make listeners SEE the action',
  'Build narrative tension - this is a STORY unfolding',
  'Focus on the human element - emotion, determination, heartbreak',
  'Pure reaction - respond to what JUST happened on track',
  'Describe the ACTION - what are you literally seeing right now?',
  'In-the-moment excitement - as if seeing it unfold live for the first time',
  'Thoughtful analysis - taking a breath to consider what just happened',
  'Conversational aside - like turning to your co-commentator with a thought',
  'Describe the RACING - overtakes, battles, defensive moves happening NOW',
  'React to the PACE - who is fast, who is slow, gaps closing or opening',
  'Strategic observation - what are the teams thinking right now?',
  'Describe the INTENSITY - the commitment, the bravery, the aggression',
  'Focus on a MOMENT - one specific thing that just caught your eye',
  'React naturally - genuine excitement or concern about what you see'
]

const SENTENCE_STARTERS = [
  'Start with an exclamation or interjection',
  'Start by setting the scene ("Here at...")',
  'Start with a rhetorical question',
  'Start mid-thought as if the broadcast just cut to you',
  'Start with a dramatic pause/buildup ("Wait... YES!")',
  'Start with "And..." as if continuing a thought',
  'Start with "Well..." - casual, conversational',
  'Start with "You know..." - inclusive, friendly',
  'Start with "Look at this..." - directing attention',
  'Start with "That\'s..." - reactive, in-the-moment',
  'Start with "Now then..." - settling in for an observation',
  'Just start directly - no preamble needed'
]

const LINGUISTIC_TWISTS = [
  'Use one unusual but fitting adjective',
  'Include a motorsport metaphor',
  'Reference the specific track section if relevant',
  'Use alliteration subtly',
  'Include a brief moment of British understatement',
  'Add urgency with short, punchy phrases',
  'Let a sentence trail off naturally...',
  'Use a simile that paints a picture',
  'Throw in some onomatopoeia for the sounds',
  'Reference the sensory experience - heat, noise, smell',
  'Keep it deliberately simple - not every line needs to be clever',
  'No twist needed - sometimes plain commentary is best'
]

// ===== COMMENTARY FOCUS MODES =====
// Determines whether commentary should be player-focused, standalone, or about other drivers
type CommentaryFocusMode = 'player' | 'standalone' | 'other-drivers'

/**
 * Determines the commentary focus mode for color/observational events
 * Designed to match REAL TV broadcast style where commentary constantly moves around the field
 * 
 * In real motorsport commentary:
 * - The lead commentator jumps around the field constantly
 * - A mid-pack driver might get 10-15% of total airtime
 * - Battles throughout the order get equal attention
 * - Leaders get updates but so does everyone else
 * 
 * - player: Player-focused commentary (20%) - your battles, your story
 * - standalone: Pure observation about track/conditions/atmosphere (20%)
 * - other-drivers: Commentary about other drivers/teams/battles (60%) - the MAJORITY!
 */
function getCommentaryFocusMode(): CommentaryFocusMode {
  const roll = Math.random()
  if (roll < 0.20) return 'standalone'    // 20% - atmosphere, track, general observations
  if (roll < 0.80) return 'other-drivers' // 60% - other drivers, teams, their stories, their battles
  return 'player'                          // 20% - player-focused (realistic amount for a mid-pack driver)
}

// Standalone commentary prompts - NO player/driver mentions, focus on ACTUAL RACING ACTION
const STANDALONE_PROMPTS = [
  // Atmosphere/venue (use sparingly)
  (trackName: string) => `The crowd is on their feet at ${trackName}! Brief reaction to a moment of action. No driver names.`,
  
  // Actual race observations - what's happening NOW
  (trackName: string) => `Cars are running nose-to-tail through the fast section! Describe the close racing you're seeing.`,
  (trackName: string) => `Look at that late braking into the corner! Describe an aggressive move without naming drivers.`,
  (trackName: string) => `Side by side through the complex! Pure racing action - describe what you see.`,
  (trackName: string) => `The gaps are coming down across the board! Things are tightening up. Describe the closing gaps.`,
  (trackName: string) => `Sparks flying as someone runs over the kerbs! Brief reaction to on-track action.`,
  (trackName: string) => `That was close! Near contact there! React to a close moment without naming anyone.`,
  (trackName: string) => `Wheels inches apart through that sequence! Describe the wheel-to-wheel action.`,
  (trackName: string) => `Someone's gone deep into that corner! Brief observation about a lock-up or mistake.`,
  (trackName: string) => `The defensive lines being used here! Comment on the racing tactics you're seeing.`,
  (trackName: string) => `Smoke from the tyres as they push to the limit! Describe the intensity.`,
  (trackName: string) => `Look at that commitment through there! React to brave driving you're witnessing.`,
  (trackName: string) => `Multiple cars fighting for the same piece of track! Describe the congestion.`,
  (trackName: string) => `That's a bold move! React to an aggressive overtake attempt.`,
  (trackName: string) => `Positions are swapping all over the place! Describe the chaos in the order.`,
]

// Other-driver commentary prompts - about the field, focus on ACTUAL RACING MOMENTS
const OTHER_DRIVER_PROMPTS = [
  // Battles and overtakes
  (trackName: string, overtakenDriver?: string) => `${overtakenDriver || 'Someone'} has just pulled off a brilliant move on the outside! Describe the overtake.`,
  (trackName: string, overtakenDriver?: string) => `${overtakenDriver || 'A driver'} dives down the inside! Describe their aggressive pass.`,
  (trackName: string, overtakenDriver?: string) => `There's contact further back! ${overtakenDriver ? `${overtakenDriver} involved -` : ''} React to the incident.`,
  (trackName: string, overtakenDriver?: string) => `${overtakenDriver || 'Someone'} has run wide and lost positions! Describe the mistake.`,
  (trackName: string, overtakenDriver?: string) => `Brilliant defensive driving from ${overtakenDriver || 'one of the others'}! Describe how they held position.`,
  
  // Pace and performance
  (trackName: string, overtakenDriver?: string) => `${overtakenDriver || 'The leader'} is absolutely flying! Comment on their incredible pace right now.`,
  (trackName: string, overtakenDriver?: string) => `${overtakenDriver || 'Someone'} has found something in the car! They're suddenly rapid.`,
  (trackName: string, overtakenDriver?: string) => `The gap at the front is coming down! Describe the closing battle for the lead.`,
  (trackName: string, overtakenDriver?: string) => `${overtakenDriver || 'A driver'} is lighting up the timing screens! Purple sectors.`,
  
  // Struggles and drama
  (trackName: string, overtakenDriver?: string) => `${overtakenDriver || 'Someone'} is wrestling with the car! Describe their struggle.`,
  (trackName: string, overtakenDriver?: string) => `Smoke from ${overtakenDriver || 'one of the cars'}! Something might be wrong. React.`,
  (trackName: string, overtakenDriver?: string) => `${overtakenDriver || 'A driver'} is dropping back rapidly! Something's not right.`,
  (trackName: string, overtakenDriver?: string) => `${overtakenDriver || 'Someone'} is getting swamped by the cars behind! Describe the pressure.`,
  
  // Strategy and pit stops
  (trackName: string, overtakenDriver?: string) => `${overtakenDriver || 'A driver'} pits! React to the stop and comment on the strategy.`,
  (trackName: string, overtakenDriver?: string) => `Undercut attempt! ${overtakenDriver || 'Someone'} has come out ahead! Describe the position change.`,
]

// Map flag colour enum to human-friendly text for prompts.
function flagColourToText(flagColour: number | undefined): string | null {
  if (flagColour === undefined) return null
  switch (flagColour) {
    case 1: return 'GREEN'
    case 2: return 'BLUE'
    case 3: return 'WHITE'
    case 4: return 'YELLOW'
    case 5: return 'DOUBLE YELLOW'
    case 6: return 'BLACK'
    case 7: return 'CHEQUERED'
    default: return null
  }
}

// Track theme history to prevent repetition
let themeHistory: NarrativeTheme[] = []
const THEME_HISTORY_SIZE = 4  // Don't repeat a theme for 4 lines

/**
 * Select a narrative theme for this commentary line
 * NOW SMARTER - considers:
 * 1. Event type affinities
 * 2. Broadcast phase (early/mid/late)
 * 3. Energy level (calm vs intense)
 * 4. Session type (practice/quali/race)
 * 5. Recent theme history (avoid repetition)
 * 6. STRAND ROTATION (Venue vs Driver vs Team vs Season vs Session)
 */
function selectNarrativeTheme(eventType: CommentaryEventType, context: EventContext): NarrativeTheme {
  const broadcastPhase = context.broadcastPhase || 'mid-session'
  const sessionType = context.sessionType
  const energyLevel = calculateEnergyLevel(context)
  
  // ===== PHASE-SPECIFIC THEME POOLS =====
  // Loosened to allow more variety while still having phase "leanings"
  const phaseThemes: Record<string, NarrativeTheme[]> = {
    // Early session: Lean towards background, but allow anything unused
    'early-session': [
      'TRACK', 'TRACK_HISTORY', 'DRIVER_BACKGROUND', 'EXPECTATION', 
      'TEAM_INFO', 'MEDIA', 'STANDINGS', 'RIVALRY', 'TECHNICAL'
    ],
    
    // Mid session: Full variety based on what's happening
    'mid-session': [
      'RIVALRY', 'STRATEGY', 'PSYCHOLOGY', 'EXPECTATION', 
      'STANDINGS', 'TRACK', 'TECHNICAL', 'TEAM_INFO', 'MEDIA'
    ],
    
    // Late session: Lean towards championship and pressure
    'late-session': [
      'STANDINGS', 'PSYCHOLOGY', 'RIVALRY', 'EXPECTATION', 
      'STRATEGY', 'RECORD_CHASING', 'ACHIEVEMENTS'
    ],
    
    'pre-session': ['TRACK', 'TRACK_HISTORY', 'DRIVER_BACKGROUND', 'TEAM_INFO', 'MEDIA']
  }
  
  // ===== ENERGY-MATCHED THEMES =====
  const energyThemes: Record<EnergyLevel, NarrativeTheme[]> = {
    'calm': ['TRACK', 'TECHNICAL', 'TRACK_HISTORY', 'STRATEGY', 'STANDINGS', 'DRIVER_BACKGROUND', 'TEAM_INFO'],
    'building': ['STRATEGY', 'PSYCHOLOGY', 'EXPECTATION', 'RIVALRY', 'MEDIA'],
    'intense': ['RIVALRY', 'PSYCHOLOGY', 'EXPECTATION', 'STANDINGS'],
    'celebration': ['STANDINGS', 'EXPECTATION', 'MEDIA', 'ACHIEVEMENTS', 'RECORD_CHASING']
  }
  
  // Some events have natural theme affinities
  const eventThemeHints: Partial<Record<CommentaryEventType, NarrativeTheme[]>> = {
    'RACE_START': ['EXPECTATION', 'TRACK', 'RIVALRY', 'PSYCHOLOGY', 'STRATEGY'],
    'OVERTAKE': ['RIVALRY', 'STRATEGY', 'PSYCHOLOGY', 'EXPECTATION'],
    'POSITION_LOST': ['PSYCHOLOGY', 'STRATEGY', 'RIVALRY', 'EXPECTATION'],
    'GAP_CLOSING': ['STRATEGY', 'PSYCHOLOGY', 'RIVALRY', 'EXPECTATION'],
    'FINAL_LAPS': ['PSYCHOLOGY', 'STANDINGS', 'STRATEGY', 'RIVALRY'],
    'COLOR_COMMENTARY': ['RIVALRY', 'STRATEGY', 'PSYCHOLOGY', 'EXPECTATION', 'STANDINGS', 'TRACK', 'MEDIA', 'TEAM_INFO', 'DRIVER_BACKGROUND'],
    'DRIVER_BACKGROUND': ['DRIVER_BACKGROUND', 'EXPECTATION', 'PSYCHOLOGY', 'RIVALRY', 'MEDIA'],
    'CHAMPIONSHIP_UPDATE': ['STANDINGS', 'RIVALRY', 'PSYCHOLOGY', 'EXPECTATION'],
    'WEATHER_CHANGE': ['TRACK', 'STRATEGY', 'PSYCHOLOGY'],
    'RACE_FINISH': ['STANDINGS', 'EXPECTATION', 'PSYCHOLOGY', 'RIVALRY'],
    'RACE_WIN': ['STANDINGS', 'EXPECTATION', 'PSYCHOLOGY', 'MEDIA'],
    'PODIUM_FINISH': ['STANDINGS', 'EXPECTATION', 'PSYCHOLOGY', 'MEDIA'],
    'RIVALRY_MENTION': ['RIVALRY', 'PSYCHOLOGY', 'STANDINGS'],
    'TEAM_PRESSURE_MENTION': ['CONTRACT_DYNAMICS', 'PSYCHOLOGY', 'EXPECTATION'],
    'SPONSOR_PRESSURE_MENTION': ['SPONSOR_PRESSURE', 'PSYCHOLOGY'],
    'MEDIA_HEADLINE_CALLBACK': ['MEDIA', 'PSYCHOLOGY', 'RIVALRY'],
  }
  
  // 1. Start with event hints or phase pool
  let themePool = eventThemeHints[eventType] || phaseThemes[broadcastPhase] || phaseThemes['mid-session']
  
  // 2. Filter by energy appropriateness (unless it's a specific action event)
  if (eventType === 'COLOR_COMMENTARY' || eventType === 'RANDOM_FACT') {
    const energyPool = energyThemes[energyLevel]
    themePool = themePool.filter(t => energyPool.includes(t))
    if (themePool.length === 0) themePool = energyPool // Fallback
  }

  // 3. APPLY STRAND ROTATION
  // Find themes that belong to unused strands
  const availableStrands = (['VENUE', 'DRIVER', 'TEAM', 'SEASON', 'SESSION'] as NarrativeStrand[])
    .filter(s => !strandHistory.includes(s))
  
  const strandFilteredThemes = themePool.filter(t => {
    const strand = THEME_TO_STRAND[t]
    return availableStrands.includes(strand)
  })

  // Use strand-filtered themes if we have enough variety, otherwise use the full pool
  const finalPool = strandFilteredThemes.length >= 2 ? strandFilteredThemes : themePool

  // 4. Filter out recently used themes
  const availableThemes = finalPool.filter(t => !themeHistory.includes(t))
  const selectionPool = availableThemes.length > 0 ? availableThemes : finalPool
  
  // 5. Weighted selection
  const weightedThemes = selectionPool.map(theme => {
    let weight = 1
    
    // Boost themes that have rich data available
    switch (theme) {
      case 'TECHNICAL':
        if (context.carHealthStatus === 'critical') weight = 3
        else if (context.fuelLapsRemaining && context.fuelLapsRemaining < 3) weight = 2
        else weight = 0.7
        break
      case 'CAREER':
        if (context.isRookie && context.totalRaces && context.totalRaces <= 3) weight = 2
        else weight = 0.3
        break
      case 'STANDINGS':
        if (context.championshipPosition && context.championshipPosition <= 3) weight = 2
        break
      case 'RIVALRY':
        if (context.rivalName) weight = 2.5
        else weight = 1.2
        break
      case 'TRACK':
        if (context.isHomeRace) weight = 2
        else if (context.weatherCondition && context.weatherCondition !== 'dry') weight = 1.5
        else weight = 0.6
        break
      case 'STRATEGY':
        if (context.momentumStatus && context.momentumStatus !== 'stable') weight = 2
        else weight = 1.3
        break
      case 'EXPECTATION':
        if (context.performanceVsExpectation === 'overachieving') weight = 2
        if (context.performanceVsExpectation === 'underachieving') weight = 1.5
        else weight = 1.2
        break
      case 'PSYCHOLOGY':
        if (context.pressureLevel === 'critical' || context.pressureLevel === 'intense') weight = 2.5
        else weight = 1.3
        break
      case 'TRACK_HISTORY':
        if (context.isTrackDebut) weight = 2
        else weight = 0.5
        break
      case 'RECORD_CHASING':
        if (context.recordBreakingMoment) weight = 15
        else if (context.recordsNearBreaking?.some(r => r.remaining === 1)) weight = 10
        break
      case 'CONTRACT_DYNAMICS':
        if (context.teamFinalWarningIssued) weight = 6
        else if (context.teamWarningIssued) weight = 4
        break
      case 'SPONSOR_PRESSURE':
        if (context.sponsorPressureLevel === 'high') weight = 5
        break
      case 'MEDIA':
        if (context.recentPressClippings && context.recentPressClippings.length > 0) weight = 3
        break
    }
    
    return { theme, weight }
  })
  
  // Weighted random selection
  const totalWeight = weightedThemes.reduce((sum, t) => sum + t.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const { theme, weight } of weightedThemes) {
    random -= weight
    if (random <= 0) {
      // Track theme and strand history
      themeHistory.push(theme)
      if (themeHistory.length > THEME_HISTORY_SIZE) themeHistory.shift()
      
      const strand = THEME_TO_STRAND[theme]
      trackRecentStrand(strand)
      
      // Log selection
      commentaryLog.strandSelected(strand, [...strandHistory])
      commentaryLog.themeSelected(theme, weight, [...themeHistory])
      
      return theme
    }
  }
  
  return selectionPool[0]
}

/**
 * Build finish event prompts with narrative callbacks
 * Creates story-aware celebration or wrap-up commentary
 */
function buildFinishPrompt(
  type: 'win' | 'podium' | 'finish',
  context: EventContext,
  trackDesc: string,
  isEarlySeason: boolean
): string {
  const memory = context.narrativeMemory
  const carDesc = context.carName ? `in the ${context.carName}` : ''
  
  let prompt = ''
  let callbacks: string[] = []
  
  // Check for callback opportunities
  if (memory) {
    // Poor start → good finish = redemption story!
    if (memory.poorStart) {
      const positionsRecovered = memory.poorStart.toPosition - context.playerPosition
      if (positionsRecovered > 0) {
        callbacks.push(`REDEMPTION CALLBACK: Started TERRIBLY (dropped to P${memory.poorStart.toPosition} on lap 1) but recovered to P${context.playerPosition}! Reference this turnaround - "What a fightback from that dreadful start!"`)
      }
    }
    
    // Recovery drive narrative
    if (memory.isRecoveryDrive && memory.lowestPosition) {
      const recovered = memory.lowestPosition.position - context.playerPosition
      if (recovered >= 5) {
        callbacks.push(`RECOVERY CALLBACK: Was down in P${memory.lowestPosition.position} on lap ${memory.lowestPosition.lap}, finished P${context.playerPosition}! Mention the comeback - "From P${memory.lowestPosition.position} to P${context.playerPosition}, what a drive!"`)
      }
    }
    
    // Lead lost then regained
    if (memory.lostLead && memory.tookLead && context.playerPosition === 1) {
      callbacks.push(`LEAD DRAMA CALLBACK: Lost the lead on lap ${memory.lostLead.lap} but fought back! Mention this battle - "They lost it, but they took it back!"`)
    }
    
    // Great start maintained
    if (memory.greatStart && type === 'win') {
      callbacks.push(`GREAT START CALLBACK: Rocketed from P${memory.greatStart.fromPosition} at the start - controlled the race from there!`)
    }
    
    // Grid vs finish comparison
    if (context.gridPosition && context.gridPosition !== context.playerPosition) {
      const diff = context.gridPosition - context.playerPosition
      if (diff > 0 && diff >= 3) {
        callbacks.push(`GRID CALLBACK: Started P${context.gridPosition}, finished P${context.playerPosition} - gained ${diff} positions! Celebrate the improvement.`)
      } else if (diff < 0 && diff <= -3) {
        callbacks.push(`GRID CALLBACK: Started P${context.gridPosition}, finished P${context.playerPosition} - lost ${Math.abs(diff)} positions. Acknowledge the disappointment.`)
      }
    }
  }
  
  // Build the base prompt
  switch (type) {
    case 'win':
      // Don't always mention win count - it gets repetitive
      const winNum = (context.totalWins || 0) + 1
      const mentionWinCount = winNum % 5 === 0 && winNum > 1  // Only for milestone wins (5, 10, 15, etc.)
      prompt = `VICTORY! ${context.playerName} ${carDesc} HAS WON THE RACE ${trackDesc}! ${mentionWinCount ? `That's win number ${winNum}!` : 'Brilliant!'}`
      break
    case 'podium':
      prompt = `PODIUM! ${context.playerName} finishes P${context.playerPosition} ${trackDesc}! ${isEarlySeason ? 'Great start to the season!' : 'Solid points!'}`
      break
    case 'finish':
      prompt = `Checkered flag for ${context.playerName}, finishing P${context.playerPosition} ${trackDesc}. ${context.playerPosition <= 5 ? 'Solid result!' : context.playerPosition <= 10 ? 'Points on the board.' : context.playerPosition <= 15 ? 'Not the result they wanted.' : 'A difficult day.'}`
      break
  }
  
  // Add callback instructions if any
  if (callbacks.length > 0) {
    prompt += '\n\nSTORY CALLBACKS (weave these in naturally if they fit):\n'
    prompt += callbacks.map(c => `- ${c}`).join('\n')
    prompt += '\n\nMake the finish commentary tell the STORY of the race - not just the result!'
  }

  const finishEventType: CommentaryEventType =
    type === 'win' ? 'RACE_WIN' : type === 'podium' ? 'PODIUM_FINISH' : 'RACE_FINISH'
  const threadGuide = buildThreadCallbackGuide(finishEventType, context, 3)
  if (threadGuide) {
    prompt += `\n\n${threadGuide}`
  }
  
  return prompt
}

/**
 * Build narrative summary from race memory
 * Creates a "story so far" that the AI can reference for callbacks
 */
function buildNarrativeSummary(
  memory: NarrativeMemory, 
  eventType: CommentaryEventType,
  context: EventContext
): string {
  const parts: string[] = []
  
  // Only include narrative for certain event types that could benefit from callbacks
  const callbackEvents: CommentaryEventType[] = [
    'RACE_WIN', 'PODIUM_FINISH', 'RACE_FINISH', 'OVERTAKE', 'POSITION_LOST',
    'LAP_COMPLETE', 'FINAL_LAPS', 'HALFWAY_POINT', 'COLOR_COMMENTARY',
    'MOMENTUM_BUILDING', 'RECOVERY_DRIVE', 'CONSISTENCY_PRAISE'
  ]
  
  if (!callbackEvents.includes(eventType)) {
    return ''
  }
  
  parts.push('\nRACE STORY SO FAR (for callbacks and continuity):')
  
  // Poor start - great callback opportunity for recoveries/wins
  if (memory.poorStart && !memory.mentionedPoorStart) {
    parts.push(`- LAP ${memory.poorStart.lap}: POOR START - dropped from P${memory.poorStart.fromPosition} to P${memory.poorStart.toPosition} (lost ${memory.poorStart.positionsLost} places!)`)
    
    // Mark callback opportunity for finish events
    if (['RACE_WIN', 'PODIUM_FINISH', 'RACE_FINISH'].includes(eventType)) {
      if (context.playerPosition <= 3) {
        parts.push(`  >> CALLBACK OPPORTUNITY: They had a TERRIBLE start but fought back! "Remember that dreadful getaway? Look at them now!"`)
      }
    }
  }
  
  // Great start
  if (memory.greatStart && !memory.mentionedGreatStart) {
    parts.push(`- LAP ${memory.greatStart.lap}: GREAT START - rocketed from P${memory.greatStart.fromPosition} to P${memory.greatStart.toPosition} (gained ${memory.greatStart.positionsGained} places!)`)
  }
  
  // Lead changes narrative
  if (memory.tookLead) {
    parts.push(`- LAP ${memory.tookLead.lap}: TOOK THE LEAD${memory.tookLead.fromWho ? ` from ${memory.tookLead.fromWho}` : ''}!`)
  }
  if (memory.lostLead) {
    parts.push(`- LAP ${memory.lostLead.lap}: Lost the lead${memory.lostLead.toWho ? ` to ${memory.lostLead.toWho}` : ''}`)
    
    // If now winning after losing lead
    if (eventType === 'RACE_WIN' || (context.playerPosition === 1 && memory.tookLead)) {
      parts.push(`  >> CALLBACK: They lost the lead but FOUGHT BACK to reclaim it! Drama!`)
    }
  }
  
  // Recovery drive narrative
  if (memory.isRecoveryDrive && memory.lowestPosition && memory.highestPosition && !memory.mentionedRecovery) {
    const positionsRecovered = memory.lowestPosition.position - context.playerPosition
    if (positionsRecovered >= 3) {
      parts.push(`- RECOVERY DRIVE IN PROGRESS: Was as low as P${memory.lowestPosition.position} on lap ${memory.lowestPosition.lap}, now P${context.playerPosition}!`)
      parts.push(`  >> You can reference this comeback story - "What a fight back!"`)
    }
  }
  
  // Key overtakes (mention most recent significant ones)
  if (memory.bigOvertakes.length > 0) {
    const recentOvertakes = memory.bigOvertakes.slice(-3)
    const overtakeSum = recentOvertakes.map(o => `L${o.lap}: passed ${o.driver} for P${o.forPosition}`).join(', ')
    parts.push(`- Recent overtakes: ${overtakeSum}`)
  }
  
  // Consistency/pace story
  if (memory.personalBests >= 3) {
    parts.push(`- FINDING PACE: Set ${memory.personalBests} personal bests this race - car is coming alive!`)
  }
  
  // Only include if there's actual narrative content
  if (parts.length <= 1) {
    return ''
  }
  
  parts.push('')
  return parts.join('\n')
}

/**
 * Build theme-specific context string
 * Only includes data relevant to the selected theme
 */
function buildThemeContext(theme: NarrativeTheme, context: EventContext): string {
  let themeStr = `\nNARRATIVE FOCUS FOR THIS LINE: ${theme}\n`
  themeStr += `(This is OPTIONAL context - use it if it fits naturally, but feel free to SKIP IT ENTIRELY if this line works better as a general observation about the track, atmosphere, or other drivers. Not every line needs to reference the player's stats or situation.)\n\n`
  
  switch (theme) {
    case 'TECHNICAL':
      themeStr += `CAR STATUS:\n`
      if (context.carHealthStatus) {
        themeStr += `- Engine Health: ${context.carHealthStatus.toUpperCase()}\n`
        if (context.carHealthStatus === 'hot' || context.carHealthStatus === 'critical') {
          themeStr += `  → The car is under stress! Reference mechanical sympathy.\n`
        }
      }
      if (context.oilTempCelsius) themeStr += `- Oil Temp: ${context.oilTempCelsius.toFixed(0)}°C\n`
      if (context.waterTempCelsius) themeStr += `- Water Temp: ${context.waterTempCelsius.toFixed(0)}°C\n`
      if (context.fuelLapsRemaining !== undefined) {
        themeStr += `- Fuel: ~${context.fuelLapsRemaining} laps remaining\n`
        if (context.fuelLapsRemaining < 5) themeStr += `  → Running on fumes! Will they make it?\n`
      }
      break
      
    case 'CAREER':
      themeStr += `DRIVER STORY:\n`
      if (context.isRookie) themeStr += `- ROOKIE SEASON - still learning the ropes!\n`
      if (context.experienceLevel) themeStr += `- Experience: ${context.experienceLevel}\n`
      if (context.age) themeStr += `- Age: ${context.age} years old\n`
      if (context.scenarioName) themeStr += `- Background: ${context.scenarioName}\n`
      if (context.totalRaces !== undefined && context.totalRaces < 15) {
        themeStr += `- Only ${context.totalRaces} career races! Still a newcomer.\n`
      }
      if (context.nationality) themeStr += `- From: ${context.nationality}\n`
      break
      
    case 'STANDINGS':
      themeStr += `CHAMPIONSHIP PICTURE:\n`
      if (context.championshipPosition) {
        themeStr += `- Currently P${context.championshipPosition} in the championship\n`
        if (context.championshipPosition === 1) themeStr += `  → LEADING! Every point matters!\n`
        else if (context.championshipPosition <= 3) themeStr += `  → In title contention!\n`
      }
      if (context.championshipPoints !== undefined) themeStr += `- ${context.championshipPoints} points so far\n`
      if (context.seasonWins) themeStr += `- ${context.seasonWins} win(s) this season\n`
      break
      
    case 'RIVALRY':
      themeStr += `HEAD-TO-HEAD:\n`
      const validatedRivalName = validateDriverName(context.rivalName)
      if (validatedRivalName) {
        themeStr += `- Key Rival: ${validatedRivalName}\n`
        if (context.rivalPosition) {
          themeStr += `- Rival currently: P${context.rivalPosition}\n`
          if (context.playerPosition < context.rivalPosition) {
            themeStr += `  → AHEAD of rival! Psychological edge!\n`
          } else if (context.playerPosition > context.rivalPosition) {
            themeStr += `  → Behind rival - needs to respond!\n`
          }
        }
      } else if (context.rivalPosition) {
        // We have position but no valid name - still mention the rivalry generically
        themeStr += `- Rival currently: P${context.rivalPosition}\n`
      }
      const validatedBattleDriver = validateDriverName(context.overtakenDriver)
      if (validatedBattleDriver) {
        themeStr += `- Just battled: ${validatedBattleDriver}\n`
      } else if (context.overtakenDriver) {
        // Had a name but it was filtered - mention generically
        themeStr += `- Just battled: the car nearby\n`
      }
      break
      
    case 'TRACK':
      themeStr += `VENUE & CONDITIONS:\n`
      themeStr += `- Circuit: ${context.trackName}\n`
      if (context.isHomeRace) themeStr += `  → HOME RACE! The crowd is behind them!\n`
      if (context.weatherCondition && context.weatherCondition !== 'dry') {
        themeStr += `- Weather: ${context.weatherCondition.toUpperCase()}\n`
        if (context.rainDensity && context.rainDensity > 0.3) {
          themeStr += `  → Rain making things treacherous!\n`
        }
      }
      if (context.trackTemperature) themeStr += `- Track Temp: ${context.trackTemperature.toFixed(0)}°C\n`
      break
      
    case 'STRATEGY':
      themeStr += `TACTICAL PICTURE:\n`
      if (context.momentumStatus) {
        themeStr += `- Momentum: ${context.momentumStatus.toUpperCase()}\n`
        if (context.gapDelta3Laps) {
          const trend = context.gapDelta3Laps < 0 ? 'CLOSING' : 'FALLING BACK'
          themeStr += `  → ${trend} by ${Math.abs(context.gapDelta3Laps).toFixed(1)}s over 3 laps\n`
        }
      }
      if (context.consistencyRating) {
        themeStr += `- Consistency: ${context.consistencyRating}\n`
        if (context.consistencyRating === 'metronomic') {
          themeStr += `  → Incredibly consistent lap times!\n`
        }
      }
      if (context.gapAhead) themeStr += `- Gap ahead: ${context.gapAhead.toFixed(1)}s\n`
      break
      
    case 'EXPECTATION':
      themeStr += `PERFORMANCE VS EXPECTATION:\n`
      if (context.teamTier) themeStr += `- Team Level: ${context.teamTier.toUpperCase()}\n`
      if (context.expectedPosition) themeStr += `- Expected Finish: ~P${context.expectedPosition}\n`
      if (context.performanceVsExpectation) {
        themeStr += `- Status: ${context.performanceVsExpectation.toUpperCase()}\n`
        if (context.performanceVsExpectation === 'overachieving') {
          themeStr += `  → Driving ABOVE the car's level! Exceptional performance!\n`
        } else if (context.performanceVsExpectation === 'underachieving') {
          themeStr += `  → Not extracting the car's potential. Questions being asked.\n`
        }
      }
      break
      
    case 'PSYCHOLOGY':
      themeStr += `MENTAL STATE:\n`
      if (context.pressureLevel) {
        themeStr += `- Pressure: ${context.pressureLevel.toUpperCase()}\n`
        if (context.pressureLevel === 'critical') {
          themeStr += `  → Maximum pressure! Nerves of steel required!\n`
        } else if (context.pressureLevel === 'intense') {
          themeStr += `  → Under the pump! Can they hold their nerve?\n`
        }
      }
      if (context.underAttackLaps && context.underAttackLaps >= 2) {
        themeStr += `- Under attack for ${context.underAttackLaps} consecutive laps!\n`
      }
      if (context.racePhase === 'final_sprint') {
        themeStr += `- FINAL LAPS - no margin for error!\n`
      }
      break
      
    case 'TRACK_HISTORY':
      themeStr += `TRACK HISTORY:\n`
      if (context.isTrackDebut) {
        themeStr += `- TRACK DEBUT! First time racing at ${context.trackName}!\n`
        themeStr += `  → New territory - everything to learn!\n`
      } else if (context.trackHistory) {
        const th = context.trackHistory
        themeStr += `- ${context.trackName} History:\n`
        themeStr += `  • ${th.visits} previous visit${th.visits !== 1 ? 's' : ''}\n`
        
        if (th.wins > 0) {
          themeStr += `  • ${th.wins} WIN${th.wins !== 1 ? 'S' : ''} at this track!\n`
          if (context.isTrackDominator) {
            themeStr += `  → TRACK SPECIALIST! They DOMINATE here!\n`
          }
        }
        if (th.podiums > 0) {
          themeStr += `  • ${th.podiums} podium${th.podiums !== 1 ? 's' : ''} here\n`
        }
        if (th.consecutiveWins > 1) {
          themeStr += `  • ON A ${th.consecutiveWins}-RACE WIN STREAK at this venue!\n`
          themeStr += `  → Can they make it ${th.consecutiveWins + 1} in a row?!\n`
        }
        if (th.maxConsecutiveWins > 1 && th.consecutiveWins === 0) {
          themeStr += `  • Won ${th.maxConsecutiveWins} in a row here historically\n`
        }
        if (th.poles > 0) {
          themeStr += `  • ${th.poles} pole position${th.poles !== 1 ? 's' : ''}\n`
        }
        if (th.fastestLaps > 0) {
          themeStr += `  • ${th.fastestLaps} fastest lap${th.fastestLaps !== 1 ? 's' : ''}\n`
        }
        themeStr += `  • Best: P${th.bestFinish}, Avg: ${th.avgFinish.toFixed(1)}\n`
        
        if (context.isTrackNightmare) {
          themeStr += `  → This track has been a NIGHTMARE. Looking to turn things around!\n`
        }
        if (th.dnfs > 0 && th.dnfs > th.visits * 0.3) {
          themeStr += `  • ${th.dnfs} DNF${th.dnfs !== 1 ? 's' : ''} - reliability/incidents a concern here\n`
        }
        
        // Add historical narrative
        if (th.visits >= 5 && th.wins >= 2) {
          const winRate = (th.wins / th.visits * 100).toFixed(0)
          themeStr += `  → ${winRate}% win rate at this circuit! A happy hunting ground!\n`
        }
        if (th.firstVisitYear && th.lastVisitYear && th.lastVisitYear > th.firstVisitYear) {
          themeStr += `  • Racing here since ${th.firstVisitYear}\n`
        }
      }
      break
      
    case 'RECORD_CHASING':
      themeStr += `CHASING HISTORY:\n`
      
      // Record-breaking moment THIS RACE
      if (context.recordBreakingMoment) {
        themeStr += `[ALERT] HISTORY ALERT! A win TODAY breaks: ${context.recordBreakingMoment}\n`
        themeStr += `  --> THIS IS A HISTORIC MOMENT! MAKE A BIG DEAL OF IT!\n\n`
      }
      
      // Records near breaking
      if (context.recordsNearBreaking && context.recordsNearBreaking.length > 0) {
        themeStr += `RECORDS IN SIGHT:\n`
        for (const record of context.recordsNearBreaking.slice(0, 3)) { // Top 3 closest
          if (record.remaining === 1) {
            themeStr += `  [HOT] ONE MORE ${record.recordName.includes('Win') ? 'WIN' : 'to beat'} ${record.recordHolder}'s ${record.recordName}!\n`
            themeStr += `     Currently: ${record.currentValue} / Record: ${record.recordValue}\n`
            themeStr += `     --> THE NEXT ONE MAKES HISTORY!\n`
          } else if (record.remaining <= 3) {
            themeStr += `  [CLOSE] ${record.remaining} more to beat ${record.recordHolder}'s ${record.recordName}\n`
            themeStr += `     Currently: ${record.currentValue} / Record: ${record.recordValue}\n`
            themeStr += `     --> WITHIN STRIKING DISTANCE!\n`
          } else {
            themeStr += `  [STAT] ${record.remaining} away from ${record.recordHolder}'s ${record.recordName} (${record.recordValue})\n`
          }
        }
        themeStr += `\n`
      }
      
      // GOAT tier progress
      if (context.goatTier && context.goatTierProgress !== undefined) {
        themeStr += `GOAT STATUS: ${context.goatTier.toUpperCase()}\n`
        if (context.goatTierProgress >= 80 && context.nextGoatTier) {
          themeStr += `  → ${context.goatTierProgress}% to ${context.nextGoatTier}! So close to the next level!\n`
        } else if (context.goatTierProgress >= 50 && context.nextGoatTier) {
          themeStr += `  → Halfway to ${context.nextGoatTier} status\n`
        }
        themeStr += `\n`
      }
      
      // Triple Crown progress
      if (context.tripleCrownProgress && context.tripleCrownProgress.length > 0) {
        const activeCrowns = context.tripleCrownProgress.filter(tc => tc.legsCompleted > 0 && !tc.isComplete)
        if (activeCrowns.length > 0) {
          themeStr += `TRIPLE CROWN QUESTS:\n`
          for (const crown of activeCrowns) {
            themeStr += `  [CROWN] ${crown.crownName}: ${crown.legsCompleted}/${crown.totalLegs} legs\n`
            if (crown.nextLeg) {
              themeStr += `     --> Next: Win at ${crown.nextLeg}\n`
              if (crown.legsCompleted === 2) {
                themeStr += `     [KEY] ONE MORE LEG TO COMPLETE THE CROWN!\n`
              }
            }
          }
        }
        
        // Completed crowns
        const completedCrowns = context.tripleCrownProgress.filter(tc => tc.isComplete)
        if (completedCrowns.length > 0) {
          themeStr += `CROWNS WON: ${completedCrowns.map(c => c.crownName).join(', ')}\n`
        }
      }
      
      // Recent milestones (for immediate celebration)
      if (context.recentMilestones && context.recentMilestones.length > 0) {
        themeStr += `\nJUST ACHIEVED: ${context.recentMilestones.join(', ')}\n`
        themeStr += `  → Fresh accomplishments worth celebrating!\n`
      }
      break
      
    case 'MEDIA':
      themeStr += `MEDIA PERSONA & PUBLIC IMAGE:\n`
      if (context.mediaPersona && context.mediaPersona !== 'unknown') {
        themeStr += `- Known for being: ${context.mediaPersona.toUpperCase()}\n`
        const personaDescriptions: Record<string, string> = {
          confident: 'Projects self-belief, never doubts themselves',
          humble: 'Lets results speak, credits the team',
          bold: 'Makes headlines with daring statements',
          diplomatic: 'Careful with words, never controversial',
          aggressive: 'Speaks their mind, creates friction',
        }
        themeStr += `  → ${personaDescriptions[context.mediaPersona] || 'Developing their media identity'}\n`
      }
      if (context.mediaPersonaLevel && context.mediaPersonaLevel !== 'unknown') {
        themeStr += `- Media Profile: ${context.mediaPersonaLevel.toUpperCase()}\n`
        if (context.mediaPersonaLevel === 'iconic') {
          themeStr += `  → One of the most recognizable figures in the sport!\n`
        } else if (context.mediaPersonaLevel === 'established') {
          themeStr += `  → The press knows what to expect from them\n`
        }
      }
      // EXTENDED: Actual press clippings!
      if (context.recentPressClippings && context.recentPressClippings.length > 0) {
        themeStr += `RECENT HEADLINES (you can reference these!):\n`
        for (const clip of context.recentPressClippings) {
          themeStr += `  • "${clip.headline}" - ${clip.outlet} (${clip.sentiment})\n`
        }
        themeStr += `  → These are REAL headlines about the driver - feel free to reference them!\n`
      } else if (context.recentHeadline) {
        themeStr += `- Recent headline: "${context.recentHeadline}"\n`
        themeStr += `  → This was in the news recently - could reference it!\n`
      }
      if (context.rivalPressConflict) {
        themeStr += `- PRESS BEEF with ${context.rivalPressConflict}!\n`
        themeStr += `  → Tension from recent media comments between them\n`
      }
      if (context.controversyLevel !== undefined && context.controversyLevel > 30) {
        themeStr += `- Controversy Level: ${context.controversyLevel > 60 ? 'HIGH PROFILE' : 'UNDER SCRUTINY'}\n`
        if (context.controversyLevel > 60) {
          themeStr += `  → The media is watching their every move!\n`
        }
      }
      if (context.publicPerception !== undefined) {
        const percDescription = context.publicPerception >= 70 ? 'BELOVED fan favorite' :
                               context.publicPerception >= 50 ? 'respected' :
                               context.publicPerception >= 30 ? 'mixed reception' : 'controversial figure'
        themeStr += `- Public Image: ${percDescription}\n`
      }
      // Social media stats
      if (context.mediaFollowerCount && context.mediaFollowerCount > 10000) {
        const followerStr = context.mediaFollowerCount >= 1000000 
          ? `${(context.mediaFollowerCount / 1000000).toFixed(1)}M` 
          : context.mediaFollowerCount >= 1000 
          ? `${(context.mediaFollowerCount / 1000).toFixed(0)}K` 
          : context.mediaFollowerCount.toString()
        themeStr += `- Social Media: ${followerStr} followers${context.isVerifiedSocialMedia ? ' ✓ VERIFIED' : ''}\n`
        if (context.viralPostCount && context.viralPostCount > 0) {
          themeStr += `  • ${context.viralPostCount} viral post${context.viralPostCount !== 1 ? 's' : ''} this season!\n`
        }
      }
      break
      
    case 'ACHIEVEMENTS':
      themeStr += `CAREER ACHIEVEMENT STATS:\n`
      // Win streaks
      if (context.consecutiveWins && context.consecutiveWins >= 2) {
        themeStr += `- ON A ${context.consecutiveWins}-RACE WIN STREAK!\n`
        if (context.consecutiveWins >= 5) {
          themeStr += `  → ABSOLUTELY DOMINANT form! Winning machine!\n`
        } else if (context.consecutiveWins >= 3) {
          themeStr += `  → Incredible purple patch! The driver to beat!\n`
        }
      }
      // Podium streaks
      if (context.consecutivePodiums && context.consecutivePodiums >= 3) {
        themeStr += `- ${context.consecutivePodiums} CONSECUTIVE PODIUMS!\n`
        if (context.consecutivePodiums >= 5) {
          themeStr += `  → Extraordinary consistency at the sharp end!\n`
        }
      }
      // Points finish streak
      if (context.consecutivePoints && context.consecutivePoints >= 5) {
        themeStr += `- ${context.consecutivePoints} races in a row in the points!\n`
        themeStr += `  → Reliable scorer - always there when it matters\n`
      }
      // Hat tricks
      if (context.hatTricks && context.hatTricks > 0) {
        themeStr += `- ${context.hatTricks} CAREER HAT TRICK${context.hatTricks !== 1 ? 'S' : ''} (Pole + Win + Fastest Lap)\n`
        themeStr += `  → The complete package when at their best!\n`
      }
      // Grand slams (even rarer!)
      if (context.grandSlams && context.grandSlams > 0) {
        themeStr += `- ${context.grandSlams} GRAND SLAM${context.grandSlams !== 1 ? 'S' : ''} (Pole + Lead every lap + Win + FL)\n`
        themeStr += `  → PERFECTION! Utterly dominant performances!\n`
      }
      // Comeback wins
      if (context.comebackWins && context.comebackWins > 0) {
        themeStr += `- ${context.comebackWins} COMEBACK WIN${context.comebackWins !== 1 ? 'S' : ''} (from P10+)\n`
        themeStr += `  → A fighter! Never count them out!\n`
      }
      // Fastest laps
      if (context.totalFastestLaps && context.totalFastestLaps >= 5) {
        themeStr += `- ${context.totalFastestLaps} career fastest laps - raw pace!\n`
      }
      // Perfect seasons / DNF-free
      if (context.perfectSeasons && context.perfectSeasons > 0) {
        themeStr += `- ${context.perfectSeasons} PERFECT SEASON${context.perfectSeasons !== 1 ? 'S' : ''} (100% wins)!\n`
        themeStr += `  → Unmatched dominance!\n`
      }
      if (context.dnfFreeSeasons && context.dnfFreeSeasons > 0) {
        themeStr += `- ${context.dnfFreeSeasons} season${context.dnfFreeSeasons !== 1 ? 's' : ''} without a DNF\n`
        themeStr += `  → Reliability personified\n`
      }
      break
      
    case 'CONTRACT_DYNAMICS':
      themeStr += `TEAM RELATIONSHIP & CONTRACT:\n`
      // Team satisfaction status
      if (context.teamSatisfactionStatus) {
        const statusEmoji: Record<string, string> = {
          thrilled: '🌟',
          pleased: '👍',
          neutral: '😐',
          concerned: '⚠️',
          crisis: '🚨'
        }
        themeStr += `- Team Mood: ${statusEmoji[context.teamSatisfactionStatus] || ''} ${context.teamSatisfactionStatus.toUpperCase()}\n`
        
        if (context.teamSatisfactionStatus === 'thrilled') {
          themeStr += `  → The team LOVES them! A valued member of the family!\n`
        } else if (context.teamSatisfactionStatus === 'pleased') {
          themeStr += `  → Good standing with the team. Delivering results.\n`
        } else if (context.teamSatisfactionStatus === 'concerned') {
          themeStr += `  → Questions being asked in the paddock about their future...\n`
        } else if (context.teamSatisfactionStatus === 'crisis') {
          themeStr += `  → RELATIONSHIP CRISIS! Their seat is under serious threat!\n`
        }
      }
      // Team satisfaction number
      if (context.teamSatisfaction !== undefined) {
        themeStr += `- Team Satisfaction: ${context.teamSatisfaction}%\n`
      }
      // Warnings
      if (context.teamFinalWarningIssued) {
        themeStr += `- [CRITICAL] FINAL WARNING issued by team!\n`
        themeStr += `  → ONE MORE mistake and they could be DROPPED!\n`
      } else if (context.teamWarningIssued) {
        themeStr += `- [ALERT] Team has issued a formal WARNING\n`
        themeStr += `  → Management are watching closely. Needs results.\n`
      }
      // Contract targets
      if (context.contractTargetsTotal && context.contractTargetsTotal > 0) {
        themeStr += `- Contract Targets: ${context.contractTargetsMet || 0}/${context.contractTargetsTotal} met\n`
        if (context.contractTargetsMet === context.contractTargetsTotal) {
          themeStr += `  → All targets HIT! Secure position for next season!\n`
        } else if ((context.contractTargetsMet || 0) < context.contractTargetsTotal / 2) {
          themeStr += `  → Struggling to meet expectations. Pressure mounting.\n`
        }
      }
      // Contract ending
      if (context.contractEndingSoon) {
        themeStr += `- CONTRACT EXPIRING SOON!\n`
        themeStr += `  → Every result matters for their future. Showing what they can do!\n`
      }
      break
      
    case 'SPONSOR_PRESSURE':
      themeStr += `COMMERCIAL & SPONSOR SITUATION:\n`
      // Overall pressure level
      if (context.sponsorPressureLevel) {
        const pressureDesc: Record<string, string> = {
          none: 'Sponsors are content - no pressure',
          low: 'Minor sponsor concerns to address',
          moderate: 'Several sponsors expecting better',
          high: 'MAJOR commercial pressure! Sponsors unhappy!'
        }
        themeStr += `- Pressure Level: ${context.sponsorPressureLevel.toUpperCase()}\n`
        themeStr += `  → ${pressureDesc[context.sponsorPressureLevel]}\n`
      }
      // Sponsor counts
      if (context.sponsorsTotal && context.sponsorsTotal > 0) {
        themeStr += `- Active Sponsors: ${context.sponsorsTotal}\n`
        if (context.sponsorsSatisfied) {
          themeStr += `  • ${context.sponsorsSatisfied} satisfied (≥70%)\n`
        }
        if (context.sponsorsAtRisk && context.sponsorsAtRisk > 0) {
          themeStr += `  • ${context.sponsorsAtRisk} AT RISK (<40%)!\n`
          themeStr += `  → Commercial partners getting nervous!\n`
        }
        // All sponsors happy
        if (context.sponsorsSatisfied === context.sponsorsTotal) {
          themeStr += `  → All sponsors HAPPY! Strong commercial backing!\n`
        }
      }
      // Top sponsor
      if (context.topSponsorName) {
        themeStr += `- Primary Sponsor: ${context.topSponsorName}\n`
        themeStr += `  → Need to keep them visible on the podium!\n`
      }
      break
  }
  
  return themeStr
}

/**
 * Clear theme history (call on session change)
 */
export function clearThemeHistory(): void {
  themeHistory = []
}

// Commentary length modes based on event type
type CommentaryLength = 'quick' | 'narrative' | 'rambling'

interface LengthConfig {
  mode: CommentaryLength
  minWords: number
  maxWords: number
  sentences: string
  description: string
}

/**
 * Get commentary length configuration based on event type
 * - Quick: 15-25 words for rapid action (overtakes, incidents)
 * - Narrative: 40-60 words for color commentary, race start, milestones
 * - Rambling: 60-80 words for occasional longer observations with tangents
 */
function getCommentaryLength(eventType: CommentaryEventType): LengthConfig {
  // Events that benefit from longer, more narrative commentary
  const narrativeEvents: CommentaryEventType[] = [
    'RACE_START', 'COLOR_COMMENTARY', 'TRIVIA_DROP', 'TRACK_CHARACTER',
    'DRIVER_BACKGROUND', 'CHAMPIONSHIP_UPDATE', 'TEAM_INFO', 'HALFWAY_POINT',
    'RACE_FINISH', 'SESSION_START', 'SESSION_END'
  ]
  
  // Events that can occasionally be longer rambling observations
  const ramblingCandidates: CommentaryEventType[] = [
    'COLOR_COMMENTARY', 'TRIVIA_DROP', 'TRACK_CHARACTER', 'DRIVER_BACKGROUND',
    'RANDOM_FACT', 'RIVALRY_MENTION'
  ]
  
  // Quick events - action that needs immediate, punchy commentary
  const quickEvents: CommentaryEventType[] = [
    'OVERTAKE', 'POSITION_LOST', 'GAP_CLOSING', 'GAP_OPENING', 'PIT_ENTRY',
    'PIT_EXIT', 'SECTOR_PURPLE', 'FASTEST_LAP', 'PERSONAL_BEST', 'POOR_START',
    'GREAT_START', 'UNDER_PRESSURE', 'BATTLE_FORMING'
  ]
  
  // Check for rambling (30% chance for rambling candidates)
  if (ramblingCandidates.includes(eventType) && Math.random() < 0.3) {
    return {
      mode: 'rambling',
      minWords: 60,
      maxWords: 80,
      sentences: '3-4 sentences',
      description: 'Take your time with this one - allow yourself to wander into an interesting tangent, share a memory or observation, paint a vivid picture. This is your moment to add color and personality.'
    }
  }
  
  // Check for narrative events
  if (narrativeEvents.includes(eventType)) {
    return {
      mode: 'narrative',
      minWords: 40,
      maxWords: 60,
      sentences: '2-3 sentences',
      description: 'Take a moment to develop this thought. Set the scene, build context, let the story breathe.'
    }
  }
  
  // Default to quick for action events
  return {
    mode: 'quick',
    minWords: 15,
    maxWords: 30,
    sentences: '1-2 sentences',
    description: 'Punchy, immediate reaction. Capture the moment!'
  }
}

/**
 * Get random creative elements to inject variety
 * Sometimes returns minimal direction for more natural flow
 */
function getCreativeModifiers(): string {
  // 35% chance to give minimal/action-focused direction
  if (Math.random() < 0.35) {
    const simpleDirections = [
      'React to what is happening RIGHT NOW on track. Not stats, not history - the actual racing.',
      'Describe WHAT YOU SEE - cars, battles, overtakes, gaps closing. Live commentary.',
      'Focus on the ACTION. Is someone attacking? Defending? Making a mistake?',
      'Natural live reaction - respond to the racing as if you\'re watching it unfold.',
      'Comment on the RACING, not the stats. What\'s the on-track story right now?',
      'Be in the moment. What\'s exciting or interesting about THIS lap?',
      'Describe the battle. Who\'s closing? Who\'s struggling? What moves are happening?',
      'React genuinely to what you see - excitement, concern, anticipation.',
    ]
    return `\nCREATIVE DIRECTION: ${simpleDirections[Math.floor(Math.random() * simpleDirections.length)]}`
  }
  
  const style = COMMENTARY_STYLES[Math.floor(Math.random() * COMMENTARY_STYLES.length)]
  const mood = MOOD_FLAVORS[Math.floor(Math.random() * MOOD_FLAVORS.length)]
  
  // 50% chance to include starter suggestion
  const includeStarter = Math.random() < 0.5
  const starter = includeStarter ? SENTENCE_STARTERS[Math.floor(Math.random() * SENTENCE_STARTERS.length)] : null
  
  // 40% chance to include linguistic twist
  const includeTwist = Math.random() < 0.4
  const twist = includeTwist ? LINGUISTIC_TWISTS[Math.floor(Math.random() * LINGUISTIC_TWISTS.length)] : null
  
  let result = `
CREATIVE DIRECTION (suggestions, not requirements):
- Tone: ${style}
- Approach: ${mood}`
  
  if (starter) result += `\n- ${starter}`
  if (twist) result += `\n- ${twist}`
  
  return result
}

/**
 * Add a line to recent history (for anti-repetition)
 */
export function trackRecentLine(line: string): void {
  recentLines.push(line)
  if (recentLines.length > MAX_RECENT_LINES) {
    recentLines.shift()
  }
}

/**
 * Trigram overlap check — returns true if the candidate is too similar to any recent line.
 * Prevents verbatim or near-verbatim repeats that sound unnatural on broadcast.
 */
function isTooSimilarToRecent(candidate: string, threshold = 0.45): boolean {
  if (recentLines.length === 0) return false
  const candidateTrigrams = extractTrigrams(candidate)
  if (candidateTrigrams.size === 0) return false

  for (const recent of recentLines.slice(-15)) {
    const recentTrigrams = extractTrigrams(recent)
    if (recentTrigrams.size === 0) continue
    let overlap = 0
    for (const tri of candidateTrigrams) {
      if (recentTrigrams.has(tri)) overlap++
    }
    const similarity = overlap / Math.min(candidateTrigrams.size, recentTrigrams.size)
    if (similarity >= threshold) return true
  }
  return false
}

function extractTrigrams(text: string): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2)
  const trigrams = new Set<string>()
  for (let i = 0; i <= words.length - 3; i++) {
    trigrams.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`)
  }
  return trigrams
}

/**
 * Clear recent lines and theme history (e.g., on session change)
 */
export function clearRecentLines(): void {
  recentLines.length = 0
  recentTopics.length = 0
  clearThemeHistory()
}

/**
 * Calculate energy level based on race context
 */
export function calculateEnergyLevel(context: EventContext): EnergyLevel {
  // Celebration: win or podium finish
  if (context.playerPosition <= 3 && context.lapsRemaining === 0) {
    return 'celebration'
  }
  
  // Intense: close battle, final laps, or significant position change
  if (context.gapAhead !== undefined && context.gapAhead < 1.0) {
    return 'intense'
  }
  if (context.gapBehind !== undefined && context.gapBehind < 1.0) {
    return 'intense'
  }
  if (context.lapsRemaining !== undefined && context.lapsRemaining <= 3 && context.lapsRemaining > 0) {
    return 'intense'
  }
  
  // Building: gap closing, mid-race tension
  if (context.gapAhead !== undefined && context.gapAhead < 3.0) {
    return 'building'
  }
  if (context.gapBehind !== undefined && context.gapBehind < 2.0) {
    return 'building'
  }
  
  // Calm: cruising, big gaps, early race
  return 'calm'
}

/**
 * Build the prompt for Gemini based on the event type
 */
function buildPrompt(event: CommentaryEvent, energyLevel?: EnergyLevel): string {
  const { type, context } = event
  
  // Determine race/season context to avoid inappropriate "title decider" etc.
  const totalRaces = context.totalRaces || 0
  const currentRaceNum = (context.totalWins || 0) + (context.totalPodiums || 0) > 0 ? 
    Math.max(1, Math.floor(totalRaces / 3)) : 1
  const isEarlySeason = totalRaces < 3
  const isMidSeason = totalRaces >= 3 && totalRaces < 8
  const isLateSeason = totalRaces >= 8
  
  const seasonContext = isEarlySeason 
    ? 'This is early in the season - focus on showing potential and starting strong, NOT championship battles.'
    : isMidSeason 
    ? 'Mid-season racing - building momentum matters but avoid "title decider" language.'
    : 'Late season - championship pressure is real if they are in contention.'

  // Energy level instruction
  const energy = energyLevel || calculateEnergyLevel(context)
  const energyInstruction = {
    calm: 'Delivery style: Calm, measured, analytical. Observe and inform.',
    building: 'Delivery style: Building tension, anticipation. Something is developing...',
    intense: 'Delivery style: HIGH ENERGY! Urgent, excited, edge-of-seat commentary!',
    celebration: 'Delivery style: Pure joy and celebration! What a moment!'
  }[energy]

  // Anti-repetition: include recent lines to avoid
  const antiRepetition = recentLines.length > 0 
    ? `\n\nAVOID similar phrasing to these recent lines:\n${recentLines.slice(-5).map(l => `- "${l}"`).join('\n')}`
    : ''

  // Topic anti-repetition: avoid repeating the same kind of line over and over
  const recentTopicList = recentTopics.length > 0
    ? `\n\nRECENT TOPICS (avoid repeating these exact angles back-to-back):\n${recentTopics.slice(-6).map(t => `- ${t}`).join('\n')}`
    : ''
  const topicForThisLine = getTopicForEvent(type, context)
  
  // Log topic selection
  commentaryLog.topicChosen(topicForThisLine, type)

  // Get randomized creative direction for THIS specific line
  const creativeModifiers = getCreativeModifiers()
  
  // Get variable commentary length based on event type
  const lengthConfig = getCommentaryLength(type)

  // ===== BROADCASTER RHYTHMS (NEW) =====
  // dictates the structure and focus of the delivery
  type CommentaryRhythm = 'play-by-play' | 'trend-spotter' | 'speculator' | 'color-man'
  const rhythms: CommentaryRhythm[] = ['play-by-play', 'trend-spotter', 'speculator', 'color-man']
  const selectedRhythm = rhythms[Math.floor(Math.random() * rhythms.length)]
  
  const rhythmInstruction = {
    'play-by-play': 'RHYTHM: Play-by-play. Focus on the IMMEDIATE visuals - braking points, lines through corners, sparks, kerb-striking. Describe what you see in the moment.',
    'trend-spotter': 'RHYTHM: Trend-spotter. Focus on the narrative over several laps. Gaps closing/opening, consistency, catching or falling back. Use trends to tell the story.',
    'speculator': 'RHYTHM: Speculator. Focus on "what if" scenarios. Pit strategy, tire life, fuel management, potential moves. Look ahead to what might happen.',
    'color-man': 'RHYTHM: Color-man. Focus on atmosphere, driver psychology, track character, and the broader "vibe" of the event. Add personality and flavor.'
  }[selectedRhythm]

  // Get series-specific commentary profile
  const seriesCategory = (context.seriesCategory as SeriesCategory) || 'gt-sportscar'
  const seriesProfile = getSeriesProfile(seriesCategory)
  const avoidTermsSection = buildAvoidTermsPrompt(seriesCategory)
  const preferredTermsSection = buildPreferredTermsPrompt(seriesCategory)

  const baseInstructions = `You are a professional British motorsport commentator with years of experience.
Generate ${lengthConfig.sentences} of MEMORABLE commentary (${lengthConfig.minWords}-${lengthConfig.maxWords} words).

${lengthConfig.description}

${energyInstruction}
${rhythmInstruction}

SERIES TYPE: ${seriesProfile.displayName}
This is ${seriesProfile.category.toUpperCase()} racing.
${seriesProfile.culturalContext}

${avoidTermsSection}
${preferredTermsSection}

AUTHENTICITY RULES:
- Sound like REAL TV commentary, not AI-generated text
- Use natural speech patterns, contractions, and flow
- Reference SPECIFIC details (track name: ${context.trackName})
- Include numbers when relevant (positions, gaps, lap times)
- British broadcasting style - professional but passionate
- ${lengthConfig.mode === 'rambling' ? 'TAKE YOUR TIME - share anecdotes, observations, let the story breathe!' : lengthConfig.mode === 'narrative' ? 'Build the narrative - set context before the action.' : 'Be punchy and immediate!'}

NATURAL VARIETY (like real TV commentary):
- NOT every line needs to mention ${context.playerName} - real commentators observe the whole race
- Sometimes just describe the track, atmosphere, weather, or venue
- Sometimes talk about OTHER drivers and battles happening elsewhere
- Paint the picture of the moment - don't always tie everything back to one driver
- When the prompt asks you NOT to mention a specific driver, respect that completely

FOCUS ON THE ACTUAL RACING (this is critical!):
- Talk about what is HAPPENING on track - overtakes, battles, gaps, mistakes
- React to the MOMENT - not stats, not history, not the track layout
- Describe the ACTION - cars going wheel-to-wheel, defending, attacking
- Comment on PACE - who is fast, who is struggling, gaps closing or opening
- Real commentators react to live racing, they don't recite facts
- Do NOT constantly mention historical results, position, or career stats
- Every line should feel like a REACTION to something happening NOW

${creativeModifiers}

FORBIDDEN (AI tells - CRITICAL!):
- Generic phrases like "what a race" without specifics
- Starting every line the same way
- Clichés without context ("championship decider" early season)
- Mentioning being AI or generating content
- NEVER EVER refer to yourself by name - no "I'm Crofty", "this is Crofty", or ANY self-identification
- NEVER introduce yourself - just deliver the commentary as if mid-broadcast
- Don't write dialogue for other commentators - just your own lines

DATA ACCURACY (CRITICAL - read carefully!):
- DRIVER NAMES: Only use names EXPLICITLY provided in the context below. If a field says "a rival" or is empty, use generic terms like "the car ahead", "the driver behind", "the competition"
- NEVER INVENT DRIVER NAMES: Do not make up or guess driver names. If you don't have a name, don't use one
- SUSPICIOUS NAMES: If a "driver name" looks like a team name (contains "Racing", "Motorsport", "Team"), a manufacturer (BMW, Mercedes, Ferrari, Porsche, Audi, etc.), or a car model (GT3, 911, M4, etc.) - DO NOT use it as a driver name. Use "the car ahead" or "the competition" instead
- ENTITY TYPES - these are DIFFERENT things:
  * DRIVER = a person's name (the human driving) - typically a first name + surname like "Max Verstappen"
  * TEAM = the racing team organization (e.g., "Red Bull Racing", "BMW Motorsport")
  * MANUFACTURER = the car brand (e.g., "Ferrari", "BMW", "Mercedes", "Porsche")
  * CAR CLASS = the category (e.g., "GT3", "LMP2", "Formula")
- Team names and manufacturer names are NOT driver names - never use them as if they were people
- LAP TIMES & GAPS: Only mention specific times/gaps if provided in context. Otherwise speak generally ("closing the gap", "pulling away")
- STATISTICS: Never invent records, win counts, or achievements not in the context
- INCIDENTS: Don't fabricate contact, spins, or drama not mentioned in the prompt

${seasonContext}
TOPIC FOR THIS LINE: ${topicForThisLine}
(Stick to this topic. Make it feel like live TV. Don't drift into generic filler like \"the field is so competitive\" unless it's genuinely new.)
${antiRepetition}${recentTopicList}`

  // ===== 8-THEME CONTEXT ROTATION =====
  // Select ONE narrative theme to focus on - prevents repetitive mentions
  const selectedTheme = selectNarrativeTheme(type, context)
  const promptPacket = buildPromptPacket(type, context, { theme: selectedTheme, topic: topicForThisLine })
  
  // Log context fields being used
  const usedContextFields: string[] = []
  if (context.rivalName) usedContextFields.push('rivalData')
  if (context.gapAhead !== undefined) usedContextFields.push(`gapAhead=${context.gapAhead?.toFixed(1)}s`)
  if (context.gapBehind !== undefined) usedContextFields.push(`gapBehind=${context.gapBehind?.toFixed(1)}s`)
  if (context.gridPosition) usedContextFields.push('gridPosition')
  // Build comprehensive context logging
  const contextDetails: string[] = []
  
  // Core telemetry (most important!)
  if (context.playerPosition) contextDetails.push(`P${context.playerPosition}`)
  if (context.currentLap) contextDetails.push(`Lap ${context.currentLap}`)
  if (context.bestLapTime) contextDetails.push(`Best: ${context.bestLapTime.toFixed(3)}s`)
  if (context.lastLapTime) contextDetails.push(`Last: ${context.lastLapTime.toFixed(3)}s`)
  
  // Gaps (for battles)
  if (context.gapAhead !== undefined) contextDetails.push(`gapAhead=${context.gapAhead.toFixed(1)}s`)
  if (context.gapBehind !== undefined) contextDetails.push(`gapBehind=${context.gapBehind.toFixed(1)}s`)
  
  // Session info
  if (context.sessionType) contextDetails.push(`session=${context.sessionType}`)
  if (context.broadcastPhase) contextDetails.push(`phase=${context.broadcastPhase}`)
  
  // Career/narrative context
  if (context.totalWins !== undefined) contextDetails.push('careerData')
  if (context.teamSatisfactionStatus) contextDetails.push('teamPressure')
  if (context.sponsorPressureLevel) contextDetails.push('sponsorPressure')
  if (context.recentPressClippings?.length) contextDetails.push('mediaHeadlines')
  if (context.narrativeThreads && context.narrativeThreads.length > 0) contextDetails.push(`threads=${context.narrativeThreads.length}`)
  if (promptPacket.coverageLane) contextDetails.push(`coverage=${promptPacket.coverageLane}`)
  if (promptPacket.coverageTarget) contextDetails.push(`coverageTarget=${promptPacket.coverageTarget}`)
  
  if (contextDetails.length > 0) {
    commentaryLog.contextUsed(contextDetails, { eventType: type, theme: selectedTheme })
  }
  commentaryLog.coverageLaneSelected(promptPacket.coverageLane, promptPacket.coverageTarget)
  commentaryLog.threadCallbackGuide({
    eventType: type,
    hasGuide: promptPacket.threadTelemetry.hasGuide,
    activeStates: promptPacket.threadTelemetry.activeStates,
    stateCounts: promptPacket.threadTelemetry.stateCounts,
    finishResolutionRule: promptPacket.threadTelemetry.finishResolutionRule,
  })
  if (promptPacket.threadTelemetry.finishResolutionRule) {
    commentaryLog.threadResolutionRule(
      type,
      promptPacket.threadTelemetry.activePayoff,
      promptPacket.threadTelemetry.activeCooldown
    )
  }
  
  // ===== SESSION CONTEXT (CRITICAL - tells AI what session type this is) =====
  const sessionType = context.sessionType || 'Race'
  let sessionContextStr = ''
  
  if (sessionType === 'Practice' || sessionType === 'Test') {
    sessionContextStr = `
SESSION CONTEXT - THIS IS PRACTICE/TEST (NOT A RACE!):
- P1 in practice = "top of the timing sheets" NOT a "win" or "victory"
- Focus on: finding setup, learning track, building confidence
- There are NO race positions - only best lap time rankings
- Do NOT use race language: "lead", "victory", "battling", "defending"
- DO use: "fastest so far", "top of the times", "setting the pace in practice"
- This is about preparation, not competition
`
  } else if (sessionType === 'Qualifying') {
    sessionContextStr = `
SESSION CONTEXT - THIS IS QUALIFYING (NOT A RACE!):
- P1 in qualifying = "provisional pole" or "top of qualifying" NOT a "win"
- Focus on: one-lap pace, finding the perfect lap, grid position for race
- There are NO race positions - only qualifying positions for tomorrow's grid
- Do NOT use: "victory", "race win", "battling for position"
- DO use: "provisional pole", "front row", "grid slot", "qualifying position"
- The actual race hasn't happened yet - this decides the starting order
`
  } else {
    // RACE SESSION - add session memory context
    const gridPos = context.gridPosition
    const currentPos = context.playerPosition
    sessionContextStr = `
SESSION CONTEXT - THIS IS THE RACE:
`
    // Only mention grid comparison if it's significant (5+ positions) - avoid constant repetition
    if (gridPos && gridPos !== currentPos) {
      const posChange = gridPos - currentPos
      if (Math.abs(posChange) >= 5) {
        if (posChange > 0) {
          sessionContextStr += `- Significant progress from grid: started P${gridPos}, now P${currentPos}\n`
        } else {
          sessionContextStr += `- Notable drop from grid: started P${gridPos}, now P${currentPos}\n`
        }
      }
      // Don't mention small position changes constantly - it's repetitive
    }
    if (context.qualifyingGapToPole) {
      const gapStr = context.qualifyingGapToPole > 0 
        ? `${context.qualifyingGapToPole.toFixed(2)}s off pole in quali` 
        : `ON POLE - fastest in qualifying`
      sessionContextStr += `- Qualifying pace: ${gapStr}\n`
    }
    if (context.carCompetitiveness) {
      const compDesc = {
        'front-runner': 'Car is a FRONT-RUNNER - expect to fight for wins',
        'competitive': 'Car is COMPETITIVE - top 5 realistic',
        'midfield': 'Car is MIDFIELD - points finishes are the target',
        'struggling': 'Car is STRUGGLING - fighting for lower points',
        'backmarker': 'Car is a BACKMARKER - survival mode, any points a bonus'
      }[context.carCompetitiveness]
      sessionContextStr += `- ${compDesc}\n`
    }
  }
  
  // Build the PRODUCER'S NOTES (Narrative-driven context)
  let contextStr = `
${sessionContextStr}
PRODUCER'S NOTES (Live Briefing - do NOT list these as variables!):
- Primary Focus: ${context.playerName}
- Track Context: Racing at ${context.trackName}`

  if (context.currentLap && context.totalLaps) {
    contextStr += `\n- Race Status: Lap ${context.currentLap} of ${context.totalLaps}`
  }

  // Narrative Position Briefing
  let positionBrief = `- Track Position: Currently P${context.playerPosition}`
  if (context.gridPosition) {
    const change = context.gridPosition - context.playerPosition
    if (change > 2) positionBrief += ` (Strong climb from P${context.gridPosition})`
    else if (change < -2) positionBrief += ` (Falling back from P${context.gridPosition})`
  }
  contextStr += `\n${positionBrief}`

  // Live Racing Story (Trends over raw data)
  if (context.sessionType === 'Race') {
    contextStr += `\n- Current Narrative:`
    
    // Gaps & Momentum
    if (context.gapAhead !== undefined) {
      const catchingStr = context.momentumStatus === 'catching' 
        ? `catching the car ahead at ~${(context.gapClosingRate || 0).toFixed(2)}s/lap` 
        : `gap ahead holding steady at ${context.gapAhead.toFixed(1)}s`
      contextStr += `\n  * Pace Trend: ${catchingStr}`
    }
    
    // Pressure & Stability
    if (context.pressureLevel && context.pressureLevel !== 'relaxed') {
      const stabilityStr = context.pressureStability === 'cracking' 
        ? "showing signs of cracking under intense pressure"
        : context.pressureStability === 'firm'
        ? "holding firm despite the attack from behind"
        : "under pressure"
      contextStr += `\n  * Psychology: ${stabilityStr} (Gap behind: ${context.gapBehind?.toFixed(1) || '?'}s)`
    }

    // Overall Stability
    if (context.positionStability === 'stuck') {
      contextStr += `\n  * Track Vibe: Locked in a stalemate; no way through the midfield train.`
    } else if (context.positionStability === 'clear') {
      contextStr += `\n  * Track Vibe: In clean air, focusing on pure pace.`
    }

    if (context.racePhase) contextStr += `\n  * Session Phase: ${context.racePhase}`
  }

  // Team/Car Context
  if (context.teamName) {
    contextStr += `\n- Vehicle Brief: ${context.teamName} (${context.carCompetitiveness || 'midfield'} spec)`
  }
  
  // Add the THEMED context - only ONE theme per line
  contextStr += buildThemeContext(selectedTheme, context)
  
  // ===== RACE NARRATIVE MEMORY =====
  // Add story continuity - what has happened so far that's worth referencing
  if (context.narrativeMemory && context.sessionType === 'Race') {
    const narrativeStr = buildNarrativeSummary(context.narrativeMemory, type, context)
    if (narrativeStr) {
      contextStr += narrativeStr
    }
  }

  // Persisted cross-race continuity threads from commentary memory.
  const threadSummary = buildThreadContinuitySummary(context)
  if (threadSummary) {
    contextStr += `\n${threadSummary}\n`
  }

  // Relevance-layer packet keeps the model focused on live-appropriate context.
  contextStr += `\n${promptPacket.packet}`
  
  // Reputation summary (brief, only for narrative modes)
  if (lengthConfig.mode !== 'quick' && context.reputation !== undefined) {
    const repDesc = context.reputation >= 80 ? 'Established star' 
      : context.reputation >= 60 ? 'Rising talent'
      : context.reputation >= 40 ? 'Building reputation'
      : 'Newcomer'
    contextStr += `\nDRIVER STATUS: ${repDesc}\n`
  }
  
  // ===== TV BROADCAST: DRIVER NARRATIVES FOR COLORFUL COMMENTARY =====
  // Add rich background info about drivers for anecdotes and color
  if (context.driverNarratives && context.driverNarratives.length > 0) {
    // Include more drivers for diverse commentary - pick 6 random ones plus any mentioned
    const mentionedDrivers = context.driverNarratives.filter(d => {
      if (context.overtakenDriver && d.name.includes(context.overtakenDriver.split(' ').pop() || '')) return true
      if (context.rivalName && d.name === context.rivalName) return true
      if (context.championshipLeader && d.name === context.championshipLeader) return true
      return false
    })
    
    const otherDrivers = context.driverNarratives.filter(d => 
      !mentionedDrivers.includes(d) && d.name !== context.playerName
    )
    
    // Shuffle and pick random other drivers to ensure variety
    const shuffledOthers = otherDrivers.sort(() => Math.random() - 0.5).slice(0, 5)
    const driversToInclude = [...mentionedDrivers, ...shuffledOthers].slice(0, 6)
    
    if (driversToInclude.length > 0) {
      contextStr += `\n- OTHER DRIVERS ON GRID (use for diverse commentary):`
      driversToInclude.forEach(d => {
        contextStr += `\n  * ${d.name}`
        if (d.nationality) contextStr += ` (${d.nationality})`
        if (d.nickname) contextStr += ` "${d.nickname}"`
        if (d.careerStage === 'rising') contextStr += ` - Rising star`
        else if (d.careerStage === 'veteran') contextStr += ` - Veteran campaigner`
        else if (d.careerStage === 'peak') contextStr += ` - In their prime`
        if (d.drivingStyle) contextStr += ` | Style: ${d.drivingStyle}`
        if (d.championships && d.championships > 0) contextStr += ` | ${d.championships}x champion`
        if (d.careerHighlight) contextStr += `\n    Career highlight: ${d.careerHighlight}`
        if (d.famousQuote) contextStr += `\n    Quote: "${d.famousQuote}"`
        if (d.quirks && d.quirks.length > 0) {
          const randomQuirk = d.quirks[Math.floor(Math.random() * d.quirks.length)]
          contextStr += `\n    Fun fact: ${randomQuirk}`
        }
        if (d.rivalries && d.rivalries.length > 0) {
          contextStr += `\n    Rivalries: ${d.rivalries.slice(0, 2).join(', ')}`
        }
      })
    }
  }
  
  // ===== TV BROADCAST: TEAM NARRATIVES FOR COLORFUL COMMENTARY =====
  // Add rich background info about teams for diverse team commentary
  if (context.teamNarratives && context.teamNarratives.length > 0) {
    // Pick 4 random teams (excluding player's team) for variety
    const otherTeams = context.teamNarratives.filter(t => t.name !== context.teamName)
    const shuffledTeams = otherTeams.sort(() => Math.random() - 0.5).slice(0, 4)
    
    if (shuffledTeams.length > 0) {
      contextStr += `\n- OTHER TEAMS ON GRID (use for diverse commentary):`
      shuffledTeams.forEach(t => {
        contextStr += `\n  * ${t.name}`
        if (t.reputation) contextStr += ` - ${t.reputation}`
        if (t.teamPrincipal) contextStr += ` | Boss: ${t.teamPrincipal}`
        if (t.headquarters) contextStr += ` | Based: ${t.headquarters}`
        if (t.achievements && t.achievements.length > 0) {
          contextStr += `\n    Achievement: ${t.achievements[0]}`
        }
        if (t.fanBase) contextStr += `\n    Fans: ${t.fanBase}`
      })
    }
  }

  // Build track description for better context
  const trackDesc = context.trackName && context.trackName !== 'Unknown Track' 
    ? `here at ${context.trackName}` 
    : 'on track'
  
  const carDesc = context.carName 
    ? `in the ${context.carName}` 
    : context.carClass 
    ? `in the ${context.carClass} machine`
    : ''
  
  // Event-specific prompts
  const eventPrompts: Partial<Record<CommentaryEventType, string>> = {
    // Race events
    RACE_START: `RACE START ${trackDesc}! The lights have gone out! Generate exciting "lights out and away we go" style opening. Mention the track name (${context.trackName}) and starting position P${context.playerPosition}.`,
    
    OVERTAKE: `OVERTAKE! ${context.playerName} ${carDesc} has just passed ${context.overtakenDriver || 'a rival'} and moves up to P${context.playerPosition}! Generate excited overtake commentary - celebrate the move! Mention it happened ${trackDesc}.`,
    
    POSITION_LOST: `${context.playerName} has LOST a position ${trackDesc}, dropping to P${context.playerPosition}! Generate realistic commentary - show disappointment or concern. Don't sugarcoat it. Acknowledge what went wrong (outbraked, defended poorly, made a mistake, etc).`,
    
    FASTEST_LAP: `FASTEST LAP! ${context.playerName} ${carDesc} has set the fastest lap of the race ${trackDesc}! Purple sector energy!`,
    
    PERSONAL_BEST: `PERSONAL BEST! ${context.playerName} has improved their best lap time to ${context.bestLapTime ? formatLapTime(context.bestLapTime) : 'a new PB'}! Celebrate finding pace.`,
    
    GAP_CLOSING: `${context.playerName} is hunting down the car ahead - gap now ${context.gapAhead?.toFixed(1) || 'under 2'} seconds! Build tension about the potential overtake.`,
    
    GAP_OPENING: `${context.playerName} is pulling away, building a gap! Commentary about strong pace or managing tyres.`,
    
    FINAL_LAPS: `${context.lapsRemaining || 'Just a few'} LAPS TO GO ${trackDesc}! This is the business end of the race. Focus on the IMMEDIATE battle - ${context.playerPosition === 1 ? 'defending the lead' : `chasing P${context.playerPosition - 1}`}. ${isEarlySeason ? 'NO championship talk - it is too early in the season!' : ''}`,
    
    PODIUM_FINISH: buildFinishPrompt('podium', context, trackDesc, isEarlySeason),
    
    RACE_WIN: buildFinishPrompt('win', context, trackDesc, isEarlySeason),
    
    RACE_FINISH: buildFinishPrompt('finish', context, trackDesc, isEarlySeason),
    
    PIT_ENTRY: `${context.playerName} is pitting ${trackDesc}! The crew are ready!`,
    
    PIT_EXIT: `And ${context.playerName} rejoins the track! Commentary on track position.`,
    
    SECTOR_PURPLE: `PURPLE SECTOR! ${context.playerName} ${carDesc} is absolutely flying ${trackDesc}!`,
    
    BATTLE_FORMING: `Eyes on the mirrors! There's a car closing in rapidly on ${context.playerName} ${trackDesc}!`,

    // Flags (announce on change only; keep it sharp and safety-focused)
    FLAG_YELLOW: `YELLOW FLAGS! Caution ${trackDesc}! Something's gone wrong ahead! Be reactive - concern, warning, immediate attention. No analysis, just the fact that the yellows are waving.`,
    FLAG_DOUBLE_YELLOW: `DOUBLE YELLOWS! Danger ${trackDesc}! Serious caution required. Drivers need to be ready to stop. Short, urgent, safety-first!`,
    FLAG_GREEN: `Green flag! Back to it! Pedal to the metal ${trackDesc}! Immediate excitement - the race is back on!`,
    FLAG_BLUE: `Blue flag! Clear the way! ${context.playerName} needs to let them through. Mention the frustration or necessity.`,
    FLAG_WHITE: `White flag! Slow car or service vehicle ${trackDesc}. Watch out! Immediate warning.`,
    FLAG_BLACK: `BLACK FLAG! Oh, that's serious. Total disqualification. Factual but dramatic - someone's session is over.`,
    FLAG_CHEQUERED: `THE CHEQUERED FLAG! That's it! It's over ${trackDesc}! Brief, final, definitive.`,
    FLAG_FINAL_LAP: `FINAL LAP! One more time around! This is it ${trackDesc}! High energy, high stakes!`,
    
    // === NEW: Telemetry-driven events (from AMS2 shared memory) ===
    
    // Rival events
    RIVAL_PIT_ENTRY: `Someone's pitting! Strategy move! Watch the pit lane entrance ${trackDesc}!`,
    RIVAL_PIT_EXIT: `And they're back out! Rejoining the fray ${trackDesc}!`,
    RIVAL_FASTEST_LAP: `New fastest lap! The competition is finding another gear ${trackDesc}!`,
    RIVAL_RETIRED: `OUT! We've lost a car ${trackDesc}! Someone's race is done. Short, definitive.`,
    
    // Player incidents - quick, reactive commentary
    CONTACT_DETECTED: `CONTACT! They've touched! ${(context.lastCollisionMagnitude || 0) > 1.5 ? 'A massive hit!' : 'A light rub there!'} Immediate, shocked reaction. No analysis of who's at fault yet.`,
    PLAYER_SPINNING: `SPINNING! They've lost it! Round and round! Immediate concern - can they keep it out of the wall?`,
    PLAYER_OFFTRACK: `OFF TRACK! Into the dirt! Through the gravel! React to the excursion - can they get it back on the grey stuff?`,
    
    // Damage reports
    DAMAGE_REPORT: `Damage! Something's broken! ${(context.aeroDamage || 0) > 0.3 ? 'Bodywork is flapping!' : ''} ${(context.engineDamage || 0) > 0.3 ? 'The engine sounds sick!' : ''} Immediate concern.`,
    ENGINE_WARNING: `Smoke? Mechanical trouble! The engine is struggling ${trackDesc}! Nursing it home now.`,
    AERO_DAMAGE: `Wing damage! That's going to hurt the aero! Struggle for grip now ${trackDesc}.`,
    
    // Yellow flag / safety car
    FCY_DEPLOYED: `SAFETY CAR! Safety car is deployed! Neutralize the race! Dramatic shift in atmosphere.`,
    FCY_ENDING: `Safety car is in! Here we go again! Restart incoming ${trackDesc}! Build the tension for the green flag.`,
    
    // === Session phase events (Practice/Qualifying time management) ===
    SESSION_TIME_5MIN: `Five minutes remaining in this session ${trackDesc}! ${context.sessionType === 'Qualifying' ? 'Teams will be getting ready for their final qualifying runs!' : 'Time to make those last setup changes count!'} Brief reminder of time pressure.`,
    
    SESSION_TIME_1MIN: `FINAL MINUTE of the session ${trackDesc}! ${context.sessionType === 'Qualifying' ? 'This is it - last chance for a flying lap!' : 'Wrap it up - session ending soon!'} Urgent tone - time is running out!`,
    
    SESSION_TIME_30SEC: `THIRTY SECONDS LEFT ${trackDesc}! ${context.sessionType === 'Qualifying' ? 'Anyone not on a flying lap right now is OUT OF TIME!' : 'Session wrapping up!'} Urgent, dramatic delivery!`,
    
    SESSION_CHECKERED: `THE CHECKERED FLAG IS OUT! Time has expired ${trackDesc}! ${context.sessionType === 'Qualifying' ? 'Complete your flying lap - this is your LAST CHANCE for a time!' : 'Session is over - come in when ready!'} Dramatic moment - time's up but laps can be completed!`,
    
    SESSION_BEST_SET: `${context.playerName} goes FASTEST ${trackDesc}! ${context.sessionType === 'Qualifying' ? 'PROVISIONAL POLE POSITION!' : 'Top of the timing screens!'} ${context.overallSessionBest ? formatLapTime(context.overallSessionBest) : 'What a lap!'} - Celebrate this moment - P1 in the session!`,
    
    SESSION_BEST_STOLEN: `PROVISIONAL POLE HAS BEEN STOLEN! ${context.overallSessionBestDriver || 'Someone else'} goes faster ${trackDesc}! ${context.overallSessionBest ? formatLapTime(context.overallSessionBest) : ''} - ${context.playerName} has been bumped off the top spot! Dramatic reaction to losing P1!`,
    
    QUALI_P1_SECURED: `AND THAT'S IT! ${context.playerName} HAS POLE POSITION ${trackDesc}! What a qualifying session - they'll start from the front of the grid! Celebration and analysis of the quali performance!`,
    
    QUALI_FRONT_ROW_SECURED: `${context.playerName} locks out a FRONT ROW start ${trackDesc}! P${context.playerPosition} on the grid - they'll be right in the mix from the start! Comment on the solid qualifying.`,
    
    QUALI_COMPLETE: `Qualifying is COMPLETE ${trackDesc}! ${context.playerName} will start P${context.playerPosition} for the race. ${context.playerPosition <= 3 ? 'Excellent position for tomorrow!' : context.playerPosition <= 10 ? 'Solid position in the top 10!' : 'Work to do from there!'} Summarize the session.`,
    
    PRACTICE_COMPLETE: `Practice session is over ${trackDesc}! ${context.playerName} finished the session P${context.playerPosition}. ${context.playerPosition <= 5 ? 'Looking competitive heading into qualifying!' : 'Some work to do before the competitive sessions!'} Brief practice summary.`,
    
    // Start-specific events
    POOR_START: `OH NO! ${context.playerName} has had a TERRIBLE start! Dropped from P${context.previousPosition || '?'} down to P${context.playerPosition}! ${context.playerPosition - (context.previousPosition || 0) >= 5 ? 'An absolute disaster off the line!' : 'Lost several places in that opening sequence!'} Be critical - that was a poor getaway. Question what went wrong.`,
    
    GREAT_START: `WHAT A START! ${context.playerName} has rocketed up the order! From P${context.previousPosition || '?'} up to P${context.playerPosition}! ${(context.previousPosition || 0) - context.playerPosition >= 5 ? 'An absolutely stunning getaway!' : 'Brilliant off the line!'} Celebrate the aggression.`,
    
    UNDER_PRESSURE: `${context.playerName} is under SERIOUS pressure! Lost ${context.previousPosition ? context.playerPosition - context.previousPosition : 'multiple'} positions rapidly - now P${context.playerPosition}! The pack is all over them! Show concern - they're struggling to hold position. Question if they can keep it together.`,
    
    // Field commentary - sometimes player-focused, sometimes just observing the field
    FIELD_BATTLE: (() => {
      const focusMode = getCommentaryFocusMode()
      if (focusMode === 'standalone') {
        return `Great racing happening all through the field ${trackDesc}! Multiple battles developing across the order. Observe the competitive nature of the field without focusing on any one driver.`
      } else if (focusMode === 'other-drivers') {
        return `${context.overtakenDriver || 'Two drivers'} going wheel-to-wheel elsewhere on track ${trackDesc}! Fantastic racing - describe their battle. Just observe their fight, no need to relate it to anyone else.`
      }
      // Player-focused (original behavior)
      return context.gapBehind !== undefined && context.gapBehind < 2.0
        ? `${context.overtakenDriver || 'The car behind'} is RIGHT there! Just ${context.gapBehind?.toFixed(1) || 'a few'}s behind ${context.playerName}! They're looking to pounce - ${context.playerName} needs to stay focused on defence here ${trackDesc}!`
        : `${context.overtakenDriver || 'A driver'} has made a move just behind ${context.playerName}! That's interesting - could affect the battle! The running order around P${context.playerPosition} is really heating up ${trackDesc}.`
    })(),
    
    LEADER_UPDATE: (() => {
      const focusMode = getCommentaryFocusMode()
      if (focusMode === 'standalone' || focusMode === 'other-drivers') {
        // Just describe the leader - don't tie it back to player
        return `At the front, ${context.overtakenDriver || 'the leader'} is controlling the race beautifully ${trackDesc}. Observe their pace, their racecraft - they're managing this superbly. Just focus on what they're doing well.`
      }
      // Player-focused (original behavior)
      return context.playerPosition <= 5
        ? `At the front, ${context.overtakenDriver || 'the leader'} is setting the pace ${trackDesc}. ${context.playerName} in P${context.playerPosition} will be watching that gap carefully!`
        : `Meanwhile ${context.overtakenDriver || 'the leader'} continues at the front ${trackDesc}. Comment on the leader's pace and control.`
    })(),
    
    MIDFIELD_ACTION: (() => {
      const focusMode = getCommentaryFocusMode()
      if (focusMode === 'standalone') {
        return `The midfield is absolutely alive ${trackDesc}! Cars nose-to-tail, positions changing every lap. Observe the intensity of the racing without singling out any driver.`
      } else if (focusMode === 'other-drivers') {
        return `${context.overtakenDriver || 'A midfield runner'} is having a great scrap with the cars around them ${trackDesc}! Describe their battle - good honest racing. No need to relate it to anyone else's race.`
      }
      // Player-focused (original behavior)
      return context.gapAhead !== undefined && context.gapAhead < 3.0
        ? `${context.playerName} is hunting down ${context.overtakenDriver || 'the car ahead'}! The gap is ${context.gapAhead?.toFixed(1) || 'closing'}s and it's looking attackable ${trackDesc}! Can they find a way past?`
        : `${context.playerName} running P${context.playerPosition} with ${context.overtakenDriver || 'several drivers'} in close company ${trackDesc}. This is proper racing - any of these could gain or lose multiple spots!`
    })(),
    
    // Session events - BROADCAST STYLE INTROS (like real TV coverage!)
    SESSION_START: (() => {
      const seriesName = context.seriesName || context.carClass || 'championship'
      const playerTeam = context.teamName || 'the team'
      
      if (context.sessionType === 'Qualifying') {
        return `Welcome back to ${context.trackName}! This is qualifying for the ${seriesName}, and this is where the grid gets set. ${context.playerName} and ${playerTeam} will be looking to secure the best possible starting slot for the race. No winners today - just pole position and grid order on the line!`
      } else if (context.sessionType === 'Race') {
        const gridInfo = context.gridPosition ? `starting from P${context.gridPosition}` : 'taking their place on the grid'
        return `Welcome back to ${context.trackName}! Race day is here for the ${seriesName}. ${context.playerName} ${gridInfo} with ${playerTeam}. Lights out imminent - this is where it all counts!`
      } else {
        // Practice - most broadcast-friendly intro
        return `Welcome back to ${context.trackName}! We're live for practice ahead of the ${seriesName}. ${context.playerName} and ${playerTeam} getting their first laps in, learning the circuit, dialling in the setup. The stopwatches are running but remember - this is practice, not qualifying. Let's see who finds the pace early.`
      }
    })(),
    
    SESSION_END: context.sessionType === 'Qualifying'
      ? `Qualifying complete at ${context.trackName}. ${context.playerName} will start the race from P${context.playerPosition}. The grid is set - now it's time to race!`
      : `Practice session complete at ${context.trackName}. ${context.playerName} finished P${context.playerPosition} on the timing sheets. Brief wrap-up - not a race result, just practice pace.`,
    
    PRACTICE_IMPROVEMENT: `Good improvement on the timing screens! ${context.playerName} has found some time ${trackDesc} - ${context.bestLapTime ? formatLapTime(context.bestLapTime) : 'a new best'}! Remember: this is practice, building towards qualifying.`,
    
    QUALIFYING_ATTEMPT: `That's a quick qualifying lap from ${context.playerName} ${trackDesc}! ${context.bestLapTime ? formatLapTime(context.bestLapTime) : ''} - that puts them P${context.playerPosition} in qualifying! A good grid slot secured if it stands.`,
    
    POLE_POSITION: `PROVISIONAL POLE! ${context.playerName} ${carDesc} has gone FASTEST in qualifying at ${context.trackName}! That's P1 on the grid for the race - what a lap!`,
    
    FRONT_ROW: `That'll be a front row start! ${context.playerName} qualifies P${context.playerPosition} at ${context.trackName} - excellent qualifying position secured! A great slot on the grid for tomorrow.`,
    
    // General/color commentary (SESSION-AWARE)
    LAP_COMPLETE: (() => {
      const focusMode = getCommentaryFocusMode()
      // 50% chance to NOT mention position at all - just general lap observation
      const skipPositionMention = Math.random() < 0.5
      
      if (focusMode === 'standalone') {
        // Pure track/atmosphere observation - no driver or position
        const standalonePrompt = STANDALONE_PROMPTS[Math.floor(Math.random() * STANDALONE_PROMPTS.length)]
        return standalonePrompt(context.trackName)
      } else if (focusMode === 'other-drivers') {
        // Talk about what's happening elsewhere
        const otherPrompt = OTHER_DRIVER_PROMPTS[Math.floor(Math.random() * OTHER_DRIVER_PROMPTS.length)]
        return otherPrompt(context.trackName, context.overtakenDriver)
      }
      
      if (context.sessionType === 'Race') {
        if (skipPositionMention) {
          // Don't mention position - just general observation
          return `Another lap in the books ${trackDesc}. ${Math.random() < 0.5 ? 'The race continues.' : 'On we go.'} Brief observation about pace, conditions, or the racing - no need to state the position.`
        }
        // Only mention position occasionally, and only if there's something interesting to say
        const gridPos = context.gridPosition
        const posChanged = gridPos !== undefined && gridPos !== context.playerPosition
        if (posChanged && Math.abs(gridPos - context.playerPosition) >= 3) {
          return `Lap ${context.currentLap} ${trackDesc}. Significant position change from the start worth noting briefly.`
        }
        return `Lap ${context.currentLap} ${trackDesc}. Brief observation - could be about gaps, pace, track conditions, or just the racing. Don't always state the position.`
      }
      return `Lap complete ${trackDesc}. ${context.sessionType === 'Qualifying' ? 'Working on qualifying pace.' : 'Building confidence.'} Brief session observation.`
    })(),
    
    HALFWAY_POINT: `Halfway through the race ${trackDesc}! ${context.playerName} running P${context.playerPosition}. Commentary about what's to come in the second half.`,
    
    WEATHER_CHANGE: `Weather changing ${trackDesc}! Commentary about track conditions.`,
    
    TRACK_LIMITS: `Watch those track limits at ${context.trackName}! Brief commentary.`,
    
    COLOR_COMMENTARY: (() => {
      const focusMode = getCommentaryFocusMode()
      const sessionType = context.sessionType
      const broadcastPhase = context.broadcastPhase
      
      // ===== RACE - EARLY (Opening laps 1-3) =====
      if (sessionType === 'Race' && broadcastPhase === 'early-session') {
        const earlyRacePrompts = [
          `Opening laps at ${context.trackName}! ${context.playerName} ${context.gridPosition ? `started P${context.gridPosition}` : 'getting into the race'}. Comment on the start, first corner, early battles - the chaos of lap 1!`,
          `The race is young! Comment on how the field has shaken out after the start. Any incidents? Position changes? Early drama?`,
          `${context.playerName} through the opening exchanges! How did they get off the line? Any close calls? Early impressions of their race.`,
          `Settling into race rhythm now. Comment on the pack order after the start - who gained, who lost, who's in trouble?`,
        ]
        return earlyRacePrompts[Math.floor(Math.random() * earlyRacePrompts.length)]
      }
      
      // ===== RACE - LATE (Final laps) =====
      if (sessionType === 'Race' && broadcastPhase === 'late-session') {
        const lateRacePrompts = [
          `Final laps at ${context.trackName}! ${context.playerName} in P${context.playerPosition}. The tension! Comment on what's at stake, the gaps, the drama!`,
          `This is it - the business end of the race! Can ${context.playerName} hold on? Push for more? What's the strategy now?`,
          `Closing stages here! Every position matters. Comment on the battle ${context.playerName} is in and what they need to do.`,
        ]
        return lateRacePrompts[Math.floor(Math.random() * lateRacePrompts.length)]
      }
      
      // ===== QUALIFYING - TV BROADCAST STYLE =====
      // Qualifying is DRAMA! Real TV commentary covers:
      // - Other drivers' lap times and grid positions
      // - Team strategies (save tyres, track position, banker laps)
      // - The pressure of the one-lap shootout
      // - Who's looking quick, who's struggling
      // - Grid position implications for the race
      
      if (sessionType === 'Qualifying') {
        // Get other drivers and teams for varied commentary
        const otherDrivers = context.driverNarratives?.filter(d => d.name !== context.playerName) || []
        const otherTeams = context.teamNarratives?.filter(t => t.name !== context.teamName) || []
        const randomDriver = otherDrivers.length > 0 ? otherDrivers[Math.floor(Math.random() * otherDrivers.length)] : null
        const randomTeam = otherTeams.length > 0 ? otherTeams[Math.floor(Math.random() * otherTeams.length)] : null
        
        const isEarly = broadcastPhase === 'early-session' || !context.hasValidTiming
        const isLate = broadcastPhase === 'late-session'
        
        // ===== QUALIFYING - APPLY FOCUS MODE (60% other-drivers, 20% standalone, 20% player) =====
        
        if (focusMode === 'other-drivers') {
          const otherDriverQualiPrompts = isLate ? [
            // Late qualifying - drama about other drivers!
            randomDriver ? `${randomDriver.name} is on a hot lap RIGHT NOW! Can they improve? ${randomDriver.careerStage === 'veteran' ? 'The experience to deliver under pressure.' : 'Nerves of steel needed here!'}` : `Someone's on a flyer! Watch the timing screens - positions are about to change!`,
            randomDriver ? `The pressure on ${randomDriver.name}! They need to find time or they're stuck where they are. This is qualifying at its finest!` : `Drivers pushing to the absolute limit! One mistake and your qualifying is ruined!`,
            randomTeam ? `${randomTeam.name} gambling on one more run! Have they got the pace? The gamble that could define their weekend!` : `Teams rolling the dice! Do you go again or bank what you have? The eternal qualifying dilemma!`,
            `Grid positions shuffling! Every tenth matters here - the difference between front row and mid-pack. Pure pressure!`,
          ] : [
            // Early/mid qualifying - observations
            randomDriver ? `${randomDriver.name} has put in a solid banker lap! ${randomDriver.drivingStyle ? `That ${randomDriver.drivingStyle} approach` : 'Smart'} - get a time on the board, then improve.` : `Banker laps going in across the field. Get a time, build confidence, then push.`,
            randomDriver ? `Interesting strategy from ${randomDriver.name}! They're ${Math.random() > 0.5 ? 'sitting in the garage, waiting for track evolution' : 'out early, getting laps in'}. Different approaches to the same problem.` : `Different teams, different strategies. Some out early, some waiting. Who's got it right?`,
            randomTeam ? `The ${randomTeam.name} car looked mighty quick on that run! ${randomTeam.reputation || 'They\'ve clearly found something.'} One to watch for pole!` : `Some cars looking seriously quick! The grid is taking shape.`,
            `The qualifying order is starting to form. Watch who's sandbagging, who's showing their hand early...`,
          ]
          return otherDriverQualiPrompts[Math.floor(Math.random() * otherDriverQualiPrompts.length)]
        }
        
        if (focusMode === 'standalone') {
          const standaloneQualiPrompts = isLate ? [
            `The tension in this session is PALPABLE! Qualifying at ${context.trackName} - where heroes are made and hearts are broken. Final minutes!`,
            `Listen to that crowd react to every lap time! Qualifying drama at its absolute finest. Who wants it more?`,
            `Track evolution means these final laps could be THE laps. The rubber's down, the grip is there - it's all about execution now!`,
            `This is why we love qualifying! The one-lap shootout, the pressure, the drama. Everything on the line for grid position!`,
          ] : [
            `Qualifying underway at ${context.trackName}! The session that determines the grid. Every position matters, every tenth is crucial.`,
            `The cars are out, the stopwatches are running. Qualifying - where the weekend really begins to take shape.`,
            `${context.trackName} in qualifying trim. Low fuel, fresh tyres, maximum attack. This is motorsport at its purest.`,
            `The paddock is tense - qualifying always brings the pressure. Get it right here and the race is easier. Get it wrong...`,
          ]
          return standaloneQualiPrompts[Math.floor(Math.random() * standaloneQualiPrompts.length)]
        }
        
        // ===== PLAYER-FOCUSED (20%) =====
        const playerQualiPrompts = isLate ? [
          `Final minutes! ${context.playerName} currently P${context.playerPosition}. Is there one more push in them? The grid hangs in the balance!`,
          `This is it - last chance for ${context.playerName} to improve! Can they find more time? The pressure is immense!`,
          `${context.playerName} needs to decide - go again or bank P${context.playerPosition}? What would you do in their shoes?`,
          `The clock is ticking for ${context.playerName}! One more flying lap could change everything. Do they have the pace?`,
        ] : [
          `${context.playerName} heading out for their qualifying run. Talk about their strategy - banker lap first or straight to attack?`,
          `The crucial session for ${context.playerName}! Grid position defines so much of the race. Where will they line up?`,
          `${context.playerName} building tyre temp on the out-lap. Everything needs to be perfect for that one flying lap.`,
          `What does ${context.playerName} need from this session? A front row? Top five? Or just a solid midfield slot to race from?`,
        ]
        return playerQualiPrompts[Math.floor(Math.random() * playerQualiPrompts.length)]
      }
      
      // ===== PRACTICE - TV BROADCAST STYLE =====
      // Practice should be engaging too! Real TV commentary during practice covers:
      // - Other drivers' performance and comparisons
      // - Setup work and car behavior
      // - Team strategies for the weekend
      // - Track evolution
      // - Driver backgrounds and anecdotes
      // - Championship context
      
      if (sessionType === 'Practice' || sessionType === 'Test') {
        // Get other drivers and teams for varied commentary
        const otherDrivers = context.driverNarratives?.filter(d => d.name !== context.playerName) || []
        const otherTeams = context.teamNarratives?.filter(t => t.name !== context.teamName) || []
        const randomDriver = otherDrivers.length > 0 ? otherDrivers[Math.floor(Math.random() * otherDrivers.length)] : null
        const randomTeam = otherTeams.length > 0 ? otherTeams[Math.floor(Math.random() * otherTeams.length)] : null
        
        // ===== PRACTICE - APPLY FOCUS MODE (60% other-drivers, 20% standalone, 20% player) =====
        
        if (focusMode === 'other-drivers') {
          // Talk about OTHER drivers - this is what makes TV commentary interesting!
          const otherDriverPrompts = [
            // Quick lap observations
            randomDriver ? `${randomDriver.name} is looking really sharp out there! ${randomDriver.drivingStyle ? `That ${randomDriver.drivingStyle} style` : 'Their approach'} seems to suit this circuit. One to watch this weekend!` : `Someone's found some pace out there! A quick lap from one of the field - they're looking confident.`,
            randomDriver ? `Interesting to see ${randomDriver.name} exploring different lines through that section. ${randomDriver.careerStage === 'veteran' ? 'Experience showing there.' : 'Learning the track quickly.'}` : `Different approaches to that corner complex - some going wide, some hugging the apex.`,
            // Team observations
            randomTeam ? `The ${randomTeam.name} car looks well planted. ${randomTeam.reputation || 'They know what they\'re doing.'} Could be a strong weekend for them.` : `Some teams looking more settled than others early on. The setup work begins in earnest.`,
            randomTeam ? `${randomTeam.name} - ${randomTeam.origin || 'a well-established outfit'}. ${randomTeam.philosophy || 'They always bring competitive machinery.'} Let's see what they've got this weekend.` : `Teams spreading out on track, each doing their own program. The data gathering is crucial.`,
            // Driver backgrounds
            randomDriver?.quirks?.[0] ? `Did you know about ${randomDriver.name}? ${randomDriver.quirks[0]}` : `Great to see such a diverse grid assembled here. Experience mixing with youth, proven winners with hungry newcomers.`,
            randomDriver?.careerHighlight ? `${randomDriver.name} - remember when ${randomDriver.careerHighlight}? That's the kind of driver they are. Determined.` : `Some serious talent in this paddock. Every session is a statement.`,
            // Comparisons
            `The gap between the quick runners is already appearing. Watch how the different teams approach this circuit - some aggressive, some conservative.`,
            `Battles will form later, but you can already see who's comfortable. Some cars dancing through the corners, others looking for grip.`,
          ]
          return otherDriverPrompts[Math.floor(Math.random() * otherDriverPrompts.length)]
        }
        
        if (focusMode === 'standalone') {
          // Pure track/atmosphere observations - paint the picture
          const standalonePrompts = [
            `Listen to those engines echoing around ${context.trackName}! What a sound. The smell of race fuel, the anticipation - practice may be "just practice" but this is what it's all about.`,
            `Track conditions here at ${context.trackName} - the surface is ${Math.random() > 0.5 ? 'coming alive as the rubber goes down' : 'still quite green, grip building lap by lap'}. Watch those kerbs!`,
            `The paddock is a hive of activity between runs. Engineers poring over data, drivers debriefing, strategists planning. This is where races are won.`,
            `Weather-wise, ${Math.random() > 0.5 ? 'conditions are perfect for setting up' : 'teams keeping an eye on those clouds'}. Every practice lap is valuable data.`,
            `${context.trackName} really shows its character in these early sessions. The elevation changes, the technical sections, the high-speed sweeps - a proper challenge.`,
            `The rhythm of practice - out lap, push lap, in lap. Teams searching for that perfect balance. Millimetres of suspension travel, degrees of wing angle - it all matters.`,
            `What a grid we have assembled here! The quality of driving talent, the engineering excellence on display. This is motorsport at its finest.`,
            `The track is evolving as we speak. Early runners clearing the dust, putting rubber down. Later runners will benefit - but do you want track position or track data?`,
          ]
          return standalonePrompts[Math.floor(Math.random() * standalonePrompts.length)]
        }
        
        // ===== PLAYER-FOCUSED (20%) - still important but not dominant =====
        const hasValidTiming = context.hasValidTiming !== false
        const playerPrompts = [
          hasValidTiming 
            ? `${context.playerName} continuing their program out there. ${context.bestLapTime ? `A ${formatLapTime(context.bestLapTime)} their best so far.` : 'Building up the pace gradually.'} Finding the limits of the car.`
            : `${context.playerName} getting their eye in at ${context.trackName}. Learning the circuit, understanding the car - the methodical approach to a race weekend.`,
          `The ${context.teamName || 'team'} will be pleased with ${context.playerName}'s consistency. Setup work is about repeatability - can you nail the same corner the same way every lap?`,
          `${context.playerName} probing the limits through that section. Practice is the time to make mistakes - better now than in the race!`,
          `Watch ${context.playerName}'s lines through there - exploring different options, seeing what works. This is the homework that pays off later.`,
          `The feedback from ${context.playerName} will be crucial. "The rear is snappy", "I need more front end" - these sessions are a conversation between driver and engineer.`,
        ]
        return playerPrompts[Math.floor(Math.random() * playerPrompts.length)]
      }
      
      // ===== MID SESSION (Race/Quali) - Normal commentary =====
      if (focusMode === 'standalone') {
        const prompt = STANDALONE_PROMPTS[Math.floor(Math.random() * STANDALONE_PROMPTS.length)]
        return prompt(context.trackName)
      } else if (focusMode === 'other-drivers') {
        const prompt = OTHER_DRIVER_PROMPTS[Math.floor(Math.random() * OTHER_DRIVER_PROMPTS.length)]
        return prompt(context.trackName, context.overtakenDriver)
      }
      // Player-focused but about ACTUAL RACING, not generic observations
      const racingObservations = [
        `${context.playerName} is ${context.gapAhead && context.gapAhead < 2 ? 'right on the tail of the car ahead!' : context.gapBehind && context.gapBehind < 2 ? 'feeling the pressure from behind!' : 'in the thick of it!'} React to their current battle.`,
        `Watch ${context.playerName} through this section! Comment on their driving - lines, braking, commitment.`,
        `${context.playerName} managing the ${context.gapAhead !== undefined ? `${context.gapAhead.toFixed(1)}s gap to the car ahead` : 'space ahead'} - are they saving tyres or pushing? Brief tactical observation.`,
        `The pace from ${context.playerName} right now - react to whether they're quick, steady, or struggling.`,
        `${context.playerName} holding position well. Brief appreciation of their racecraft in traffic.`,
        `Can ${context.playerName} find a way past? Comment on their attempts to make progress.`,
        `Over the last few laps, has ${context.playerName} been gaining or losing ground? Brief trend comment using gaps/pace - avoid stating position unless it changed.`,
      ]
      return racingObservations[Math.floor(Math.random() * racingObservations.length)]
    })(),
    
    DRIVER_BACKGROUND: (() => {
      const focusMode = getCommentaryFocusMode()
      const sessionType = context.sessionType
      const broadcastPhase = context.broadcastPhase
      
      // ===== CHECK FOCUS MODE FIRST - Sometimes talk about OTHER drivers! =====
      // Get a random other driver from the narratives if available
      const otherDrivers = context.driverNarratives?.filter(d => d.name !== context.playerName) || []
      const randomOtherDriver = otherDrivers.length > 0 
        ? otherDrivers[Math.floor(Math.random() * otherDrivers.length)] 
        : null
      
      if (focusMode === 'other-drivers' && randomOtherDriver) {
        // Actually USE the narrative data we have about other drivers!
        const driverInfo: string[] = []
        if (randomOtherDriver.nationality) driverInfo.push(`${randomOtherDriver.nationality}`)
        if (randomOtherDriver.careerStage === 'rising') driverInfo.push('rising star')
        if (randomOtherDriver.careerStage === 'veteran') driverInfo.push('veteran campaigner')
        if (randomOtherDriver.championships && randomOtherDriver.championships > 0) driverInfo.push(`${randomOtherDriver.championships}x champion`)
        
        const prompts = [
          randomOtherDriver.drivingStyle 
            ? `Keep an eye on ${randomOtherDriver.name} out there! ${randomOtherDriver.drivingStyle}. Watch how they attack this track!`
            : `${randomOtherDriver.name} is having a busy session! Tell us about their approach to this circuit.`,
          randomOtherDriver.quirks?.[0]
            ? `Interesting fact about ${randomOtherDriver.name}: ${randomOtherDriver.quirks[0]} - That's the kind of driver they are!`
            : `${randomOtherDriver.name} is a fascinating driver to watch. Comment on their racing style.`,
          driverInfo.length > 0
            ? `${randomOtherDriver.name} - ${driverInfo.join(', ')}. One of the more interesting drivers in this field!`
            : `${randomOtherDriver.name} out there putting in the laps. A driver to watch in this session!`,
        ]
        return prompts[Math.floor(Math.random() * prompts.length)]
      }
      
      if (focusMode === 'standalone') {
        const standalonePrompts = [
          `The variety of talent in this field is impressive! Veterans mixing it with rising stars. Observe the different driving styles on display.`,
          `Look at the diversity of backgrounds out here - drivers from all sorts of racing disciplines coming together. Brief observation about the field.`,
          `This is what modern motorsport is all about - a melting pot of talent, experience, and ambition. Comment on the quality of this grid.`,
        ]
        return standalonePrompts[Math.floor(Math.random() * standalonePrompts.length)]
      }
      
      // ===== PLAYER-FOCUSED (only when focusMode === 'player') =====
      
      // ===== RACE - EARLY LAPS =====
      if (sessionType === 'Race' && broadcastPhase === 'early-session') {
        return `${context.playerName} into the early laps. Brief mention of their qualifying, their race record here, or what they're hoping to achieve today. Keep it race-focused!`
      }
      
      // ===== QUALIFYING - Mention their practice form, expectations =====
      if (sessionType === 'Qualifying' && (broadcastPhase === 'early-session' || !context.hasValidTiming)) {
        return `${context.playerName} starting their qualifying campaign. Comment on their practice pace, their qualifying history, what position they're targeting. Grid positions at stake!`
      }
      
      // ===== PRACTICE - Perfect time for driver introductions! =====
      if (sessionType === 'Practice' && (broadcastPhase === 'early-session' || !context.hasValidTiming)) {
        const earlyPrompts = [
          `Tell the viewers about ${context.playerName} - their journey to this point, where they came from, their racing background. Great time for an introduction while we wait for lap times!`,
          `${context.playerName} out there getting up to speed. Share some background on this driver - their history, their ambitions, what brought them here.`,
          `Good opportunity to introduce ${context.playerName} to our viewers. Who are they? Where did they come from? What's their story?`,
        ]
        return earlyPrompts[Math.floor(Math.random() * earlyPrompts.length)]
      }
      
      // Even for player focus, don't always recite stats - it's boring!
      const skipStats = Math.random() < 0.7  // 70% of the time, don't mention stats
      if (skipStats) {
        return `${context.playerName} out there doing what they do best. Brief natural observation about their driving style or approach - don't mention career stats.`
      }
      return context.totalWins || context.totalPodiums
        ? `Brief mention of ${context.playerName}'s experience - but keep it natural, don't just recite numbers.`
        : `${context.playerName} is building their racing career. Comment on their potential.`
    })(),
    
    TEAM_INFO: (() => {
      const focusMode = getCommentaryFocusMode()
      const sessionType = context.sessionType
      const broadcastPhase = context.broadcastPhase
      
      // ===== SOMETIMES TALK ABOUT OTHER TEAMS! =====
      const otherTeams = context.teamNarratives?.filter(t => t.name !== context.teamName) || []
      const randomOtherTeam = otherTeams.length > 0 
        ? otherTeams[Math.floor(Math.random() * otherTeams.length)]
        : null
      
      if (focusMode === 'other-drivers' && randomOtherTeam) {
        const teamInfo: string[] = []
        if (randomOtherTeam.origin) teamInfo.push(randomOtherTeam.origin)
        if (randomOtherTeam.philosophy) teamInfo.push(randomOtherTeam.philosophy)
        if (randomOtherTeam.teamPrincipal) teamInfo.push(`Run by ${randomOtherTeam.teamPrincipal}`)
        if (randomOtherTeam.headquarters) teamInfo.push(`Based in ${randomOtherTeam.headquarters}`)
        if (randomOtherTeam.achievements && randomOtherTeam.achievements.length > 0) {
          teamInfo.push(randomOtherTeam.achievements[0])
        }
        
        const prompts = [
          `Let's talk about ${randomOtherTeam.name}! ${teamInfo.slice(0, 2).join('. ')}. Tell us about this team.`,
          `${randomOtherTeam.name} - ${randomOtherTeam.reputation || 'a fascinating outfit'}. ${randomOtherTeam.philosophy || 'Building their program'}.`,
          `Eyes on ${randomOtherTeam.name} today! ${randomOtherTeam.fanBase || 'Great support behind them'}. ${randomOtherTeam.reputation || 'Respected in the paddock'}.`,
        ]
        return prompts[Math.floor(Math.random() * prompts.length)]
      }
      
      if (focusMode === 'standalone') {
        // General team/grid observation
        const standalonePrompts = [
          `What a diverse grid we have! Teams from all backgrounds, all budgets, all competing for glory ${trackDesc}. Brief observation about the competitive nature of the field.`,
          `The paddock atmosphere is electric today ${trackDesc}. Teams making final preparations, mechanics working their magic. Paint the picture!`,
          `So many stories in this pitlane. Big factory teams, small family outfits, everyone with the same dream. General observation about the team dynamic in the paddock.`,
        ]
        return standalonePrompts[Math.floor(Math.random() * standalonePrompts.length)]
      }
      
      // ===== PLAYER'S TEAM (original behavior) =====
      
      // ===== RACE - Talk about team strategy, what they're racing for =====
      if (sessionType === 'Race' && broadcastPhase === 'early-session') {
        return context.teamName
          ? `${context.teamName} into the race! Comment on their race strategy, what positions they're targeting, how they're set up for this race.`
          : `Comment on the team's race approach. What's the target today? What would be a good result?`
      }
      
      // ===== QUALIFYING - Team expectations for the grid =====
      if (sessionType === 'Qualifying' && (broadcastPhase === 'early-session' || !context.hasValidTiming)) {
        return context.teamName
          ? `${context.teamName} going for qualifying! What grid position are they targeting? How's the car felt in practice? Brief team expectations.`
          : `The team sending ${context.playerName} out for qualifying. What are the realistic expectations here?`
      }
      
      // ===== PRACTICE - Team background, setup goals =====
      if (sessionType === 'Practice' && (broadcastPhase === 'early-session' || !context.hasValidTiming)) {
        return context.teamName
          ? `Introduce ${context.teamName} to our viewers. Tell us about this outfit - their history, their approach, what they're hoping to achieve this weekend. No performance talk yet!`
          : `Tell us about the team behind ${context.playerName}. What's their setup like? What are they working towards?`
      }
      
      // Normal session - can reference performance
      return context.teamName 
        ? `Mention ${context.teamName} and how ${context.playerName} is getting on with the ${context.carName || context.carClass || 'machinery'}. Keep it brief.`
        : `Comment on ${context.playerName}'s racing ${carDesc}. Brief observation.`
    })(),
    
    CHAMPIONSHIP_UPDATE: isEarlySeason
      ? `Early days in the championship. ${context.playerName} looking to build momentum. ${context.championshipPoints ? `Currently on ${context.championshipPoints} points.` : ''}`
      : `${context.playerName} is P${context.championshipPosition || '?'} in the standings with ${context.championshipPoints || 0} points. Brief championship context.`,
    
    RIVALRY_MENTION: context.rivalName 
      ? `The battle with ${context.rivalName} continues ${trackDesc}! Brief rivalry commentary.`
      : `Competitive field out there ${trackDesc}. Brief observation.`,
    
    RANDOM_FACT: (() => {
      const sessionType = context.sessionType
      const broadcastPhase = context.broadcastPhase
      
      // ===== RACE - EARLY LAPS - Historical race facts, famous moments at this track =====
      if (sessionType === 'Race' && broadcastPhase === 'early-session') {
        const earlyRacePrompts = [
          `Share a famous racing moment from ${context.trackName}'s history - a legendary battle, an incredible comeback, a dramatic finish!`,
          `${context.trackName} has seen some incredible races. Share a memorable moment from the archives while we settle into this race.`,
          `Interesting fact time - what makes ${context.trackName} special for racing? Any unique characteristics that affect race strategy?`,
        ]
        return earlyRacePrompts[Math.floor(Math.random() * earlyRacePrompts.length)]
      }
      
      // ===== RACE - LATE - Championship/title implications, what's at stake =====
      if (sessionType === 'Race' && broadcastPhase === 'late-session') {
        return `Final laps! ${context.championshipPosition ? `With ${context.playerName} P${context.championshipPosition} in the championship, what could this result mean?` : 'What are the implications of this result?'} Championship context for the closing stages!`
      }
      
      // ===== QUALIFYING - Pole stats, qualifying records =====
      if (sessionType === 'Qualifying' && (broadcastPhase === 'early-session' || !context.hasValidTiming)) {
        const qualiPrompts = [
          `Qualifying trivia! Share something about ${context.trackName}'s qualifying history - record poles, dramatic sessions, famous qualifying battles.`,
          `The quest for pole position at ${context.trackName}! Any interesting facts about qualifying here? What makes a good qualifier at this circuit?`,
          `Grid positions matter! Share some context about how qualifying tends to play out at ${context.trackName}.`,
        ]
        return qualiPrompts[Math.floor(Math.random() * qualiPrompts.length)]
      }
      
      // ===== PRACTICE - Track facts, history, general motorsport trivia =====
      if (sessionType === 'Practice' && (broadcastPhase === 'early-session' || !context.hasValidTiming)) {
        const earlyPrompts = [
          `Share an interesting fact about ${context.trackName} - its history, famous moments, what makes it special. Perfect filler while we wait for times!`,
          `Tell us something the viewers might not know about this circuit. Any historical nuggets or technical details about ${context.trackName}?`,
          `Random motorsport trivia time! Share something interesting - could be about the track, the series, or racing in general.`,
          `${context.trackName} has quite the history. Share a memorable moment or interesting fact about this venue.`,
        ]
        return earlyPrompts[Math.floor(Math.random() * earlyPrompts.length)]
      }
      
      const focusMode = getCommentaryFocusMode()
      if (focusMode === 'standalone') {
        const prompt = STANDALONE_PROMPTS[Math.floor(Math.random() * STANDALONE_PROMPTS.length)]
        return prompt(context.trackName)
      } else if (focusMode === 'other-drivers') {
        // Use driver narratives for rich trivia about OTHER drivers
        const otherDrivers = context.driverNarratives?.filter(d => d.name !== context.playerName) || []
        const randomDriver = otherDrivers.length > 0 
          ? otherDrivers[Math.floor(Math.random() * otherDrivers.length)]
          : null
        
        if (randomDriver) {
          const info: string[] = []
          if (randomDriver.biography) info.push(randomDriver.biography.split('.').slice(0, 2).join('.') + '.')
          if (randomDriver.careerHighlight) info.push(`Career highlight: ${randomDriver.careerHighlight}`)
          if (randomDriver.quirks?.length) info.push(randomDriver.quirks[0])
          if (randomDriver.famousQuote) info.push(`They once said: "${randomDriver.famousQuote}"`)
          
          return `Tell us about ${randomDriver.name}! ${info.slice(0, 2).join(' ')} Share a fact or observation about this driver.`
        }
        
        // Fallback to generic other driver prompt
        const prompt = OTHER_DRIVER_PROMPTS[Math.floor(Math.random() * OTHER_DRIVER_PROMPTS.length)]
        return prompt(context.trackName, context.overtakenDriver)
      }
      return `Generate an interesting observation about the action ${trackDesc}. Comment on ${context.carClass ? `the ${context.carClass} racing` : 'the competitive field'} or ${context.playerName}'s performance in P${context.playerPosition}.`
    })(),
    
    // ===== SITUATIONAL EVENTS (NEW) =====
    MOMENTUM_BUILDING: `${context.playerName} is building serious momentum! Gained ${context.previousPosition ? context.previousPosition - context.playerPosition : 'multiple'} positions in the last few laps - now P${context.playerPosition}! The car is working beautifully ${trackDesc}. Celebrate the forward progress.`,
    
    DEFENSIVE_DRIVING: `Brilliant defensive work from ${context.playerName}! Held position under intense pressure ${trackDesc}. That's P${context.playerPosition} secure for now! Praise the racecraft.`,
    
    CONSISTENCY_PRAISE: `Metronomic consistency from ${context.playerName} ${carDesc}! Lap after lap of near-identical times ${trackDesc}. This is the mark of a quality driver. Praise their reliability.`,
    
    RECOVERY_DRIVE: `What a recovery drive! ${context.playerName} dropped positions early but has been climbing back through the field ${trackDesc}. Now up to P${context.playerPosition}! Fighting spirit.`,
    
    PRESSURE_BUILDING: `The gap is coming down! ${context.playerName} is closing in on the car ahead - now just ${context.gapAhead?.toFixed(1) || 'under 2'} seconds ${trackDesc}! Build anticipation for a potential move.`,
    
    GAP_CALCULATION: `Let's do the maths - ${context.playerName} has ${context.gapAhead?.toFixed(1) || 'a gap'} seconds to find with ${context.lapsRemaining || 'several'} laps remaining. That's ${context.gapAhead && context.lapsRemaining ? (context.gapAhead / context.lapsRemaining * 10).toFixed(0) : 'a few'} tenths per lap needed. Calculate whether it's achievable.`,
    
    // ===== PRACTICE/QUALIFYING SPECIFIC (NEW) =====
    OTHER_DRIVER_HOTLAP: `One of the other ${context.carClass || ''} runners has just improved their time ${trackDesc}! The competition is heating up. Brief observation about the competitive field.`,
    
    TRACK_EVOLUTION: (() => {
      const variants = [
        `The track is really coming alive now ${trackDesc}. More rubber going down, grip levels rising — everyone gaining confidence.`,
        `Lap times tumbling across the board ${trackDesc} — the surface evolution is in full swing. This is when the real pace emerges.`,
        `You can see the track surface improving ${trackDesc}. Drivers pushing harder now the grip's coming to them.`,
        `${trackDesc} — the circuit's maturing nicely. Track temperatures up, rubber embedded, and the times are reflecting that.`,
        `Interesting phase of the session ${trackDesc} — track evolution meaning everyone's finding time, but not everyone equally.`,
      ]
      return variants[Math.floor(Math.random() * variants.length)]
    })(),
    
    SECTOR_COMPARISON: `${context.playerName} looking ${Math.random() < 0.5 ? 'strong' : 'competitive'} through sector ${context.sectorNumber || '1'} ${trackDesc}. Brief sector-specific observation.`,
    
    PIT_ACTIVITY: `There's plenty of activity in the pit lane ${trackDesc}. Drivers coming in for setup changes and fresh rubber. Brief observation about the session.`,
    
    // ===== TRACK SPECIFIC (NOW WITH VERIFIED DATA) =====
    CORNER_CALLOUT: (() => {
      const focusMode = getCommentaryFocusMode()
      
      // Only call out corners when we have VERIFIED telemetry data
      const speed = context.speed || context.lastLapTime ? Math.round((context.speed || 0)) : null
      const sector = context.currentSector
      
      // Build verified context
      const verified = [
        `Track: ${context.trackName}`,
        speed ? `Speed: ~${speed}kph` : null,
        sector ? `Sector: ${sector}` : null,
        context.playerPosition ? `Position: P${context.playerPosition}` : null
      ].filter(Boolean).join(', ')
      
      if (focusMode === 'standalone') {
        return `${context.trackName} in action! Generate a brief observation about the track section we're viewing - how it challenges the cars, what it demands of the drivers. Keep it general and atmospheric, no specific driver mentions.`
      }
      
      if (focusMode === 'other-drivers') {
        // Talk about another driver's approach to the circuit
        const otherDrivers = context.driverNarratives?.filter(d => d.name !== context.playerName) || []
        const randomDriver = otherDrivers.length > 0 
          ? otherDrivers[Math.floor(Math.random() * otherDrivers.length)]
          : null
        
        if (randomDriver) {
          const styleNote = randomDriver.drivingStyle
          return `Eyes on ${randomDriver.name} out there at ${context.trackName}. ${styleNote ? `Known for being ${styleNote}.` : ''} Brief observation about their approach through this section.`
        }
        
        return `One of the ${context.carClass || ''} runners threading through this section at ${context.trackName}. Brief observation about technique or commitment.`
      }
      
      return `${context.playerName} on track at ${context.trackName}.
VERIFIED DATA: ${verified}
Generate a brief observation about their driving - commitment, lines, or pace. 
IMPORTANT: Do NOT invent specific corner names unless you know ${context.trackName} well. 
Instead, use generic terms like "through the complex", "into the braking zone", "out of that section".
Keep it grounded in what the telemetry shows.`
    })(),
    
    TRACK_CHARACTER: (() => {
      const focusMode = getCommentaryFocusMode()
      const otherDrivers = context.driverNarratives?.filter(d => d.name !== context.playerName) || []
      const randomDriver = otherDrivers.length > 0 ? otherDrivers[Math.floor(Math.random() * otherDrivers.length)] : null
      
      // VARIED track commentary - different angles each time
      const trackAngles = [
        // Technical challenges
        `The technical section at ${context.trackName} really separates the good from the great. That combination of corners demands precision - get it wrong and you lose tenths.`,
        `${context.trackName} is all about commitment. Those high-speed sections reward bravery - lift off and you lose time, but get it wrong and you're in the barriers.`,
        // Historical significance
        `So much history at ${context.trackName}! Great battles, famous victories, heartbreaking defeats - these walls have seen it all. The pressure of racing here is immense.`,
        `${context.trackName} - a circuit that rewards drivers who trust their instincts. The greats have always shone here. Who'll add their name to the list this weekend?`,
        // Atmosphere/venue
        `Listen to that crowd! ${context.trackName} always delivers an atmosphere. The fans here know their racing - they appreciate the craft, the commitment, the courage.`,
        `${context.trackName} in all its glory. The backdrop, the elevation changes, the challenge - this is why drivers love coming here.`,
        // Setup challenges  
        `The setup compromise at ${context.trackName} is fascinating. Low drag for the straights? Or downforce for the corners? Every team makes different choices.`,
        `Tyre management will be key at ${context.trackName}. The abrasive surface, the high-speed loads - save too much and you're slow, push too hard and you're sliding.`,
      ]
      
      if (focusMode === 'other-drivers' && randomDriver) {
        // Tie track character to another driver
        const driverTrackPrompts = [
          `${randomDriver.name} really seems to suit ${context.trackName}! ${randomDriver.drivingStyle ? `That ${randomDriver.drivingStyle} approach` : 'Their style'} works well here. Watch them through the technical sections.`,
          `I always associate ${context.trackName} with drivers like ${randomDriver.name} - ${randomDriver.careerStage === 'veteran' ? 'the experienced campaigners who know every inch' : 'the hungry young guns looking to make a name'}. This circuit rewards their approach.`,
        ]
        return driverTrackPrompts[Math.floor(Math.random() * driverTrackPrompts.length)]
      }
      
      // Return a random track angle for variety
      return trackAngles[Math.floor(Math.random() * trackAngles.length)]
    })(),
    
    // ===== BANTER (NEW) =====
    TRIVIA_DROP: (() => {
      const focusMode = getCommentaryFocusMode()
      if (focusMode === 'standalone') {
        return `Here's a fun fact: Generate an interesting piece of racing trivia or observation about ${context.trackName}, ${context.carClass ? `${context.carClass} racing` : 'motorsport'}, or something relevant to the venue/series. Keep it brief and interesting. Do NOT mention any specific drivers.`
      } else if (focusMode === 'other-drivers') {
        // Use rich driver/team narratives for trivia
        const otherDrivers = context.driverNarratives?.filter(d => d.name !== context.playerName) || []
        const otherTeams = context.teamNarratives?.filter(t => t.name !== context.teamName) || []
        
        // 60% chance to pick a driver, 40% chance to pick a team
        if (Math.random() < 0.6 && otherDrivers.length > 0) {
          const randomDriver = otherDrivers[Math.floor(Math.random() * otherDrivers.length)]
          const quirk = randomDriver.quirks?.length 
            ? randomDriver.quirks[Math.floor(Math.random() * randomDriver.quirks.length)]
            : null
          
          if (quirk) {
            return `Did you know about ${randomDriver.name}? ${quirk} Share this interesting fact about the driver.`
          }
          if (randomDriver.famousQuote) {
            return `${randomDriver.name} once said: "${randomDriver.famousQuote}". Tell us more about this driver's character!`
          }
          return `Let's talk about ${randomDriver.name}! ${randomDriver.careerHighlight || randomDriver.nickname || 'An interesting character in this paddock'}. Brief driver trivia.`
        } else if (otherTeams.length > 0) {
          const randomTeam = otherTeams[Math.floor(Math.random() * otherTeams.length)]
          
          if (randomTeam.teamPrincipal) {
            return `Here's a fun fact about ${randomTeam.name}: Led by ${randomTeam.teamPrincipal}, ${randomTeam.reputation || 'a fascinating outfit'}. Share this team trivia!`
          }
          return `Did you know ${randomTeam.name}? ${randomTeam.origin || randomTeam.philosophy || 'An interesting team'}. Brief team trivia.`
        }
        
        // Fallback to generic other driver prompt
        const prompt = OTHER_DRIVER_PROMPTS[Math.floor(Math.random() * OTHER_DRIVER_PROMPTS.length)]
        return prompt(context.trackName, context.overtakenDriver)
      }
      return `Here's a fun fact: Generate an interesting piece of racing trivia or observation about ${context.trackName}, ${context.carClass ? `${context.carClass} racing` : 'motorsport'}, or something relevant to the current situation. Keep it brief and interesting.`
    })(),
    
    DISAGREEMENT: `Make a slightly controversial or debatable observation about ${context.playerName}'s current approach or strategy ${trackDesc}. Something that Vicky might offer a different perspective on - set up a brief discussion point. Keep it light and fun, not critical.`,
    
    // ===== RECORD/ACHIEVEMENT EVENTS (NEW) =====
    RECORD_BROKEN: context.recordBreakingMoment
      ? `[HISTORY] HISTORY IS MADE! ${context.playerName} has just BROKEN ${context.recordBreakingMoment}! This is an ENORMOUS moment - go BIG with your celebration! Reference the magnitude of what has just been achieved. This is the kind of moment that gets replayed for decades!`
      : `${context.playerName} has broken a record ${trackDesc}! Generate excited celebration of this historic achievement!`,
    
    RECORD_APPROACHING: context.recordsNearBreaking && context.recordsNearBreaking.length > 0
      ? (() => {
          const closest = context.recordsNearBreaking[0]
          if (closest.remaining === 1) {
            return `HISTORY BECKONS! ${context.playerName} is just ONE away from breaking ${closest.recordHolder}'s ${closest.recordName}! ${closest.currentValue} currently - the record is ${closest.recordValue}! Build incredible tension - the next one makes HISTORY!`
          } else {
            return `${context.playerName} is closing in on the record books! Just ${closest.remaining} more to beat ${closest.recordHolder}'s ${closest.recordName}! Currently on ${closest.currentValue}, record stands at ${closest.recordValue}. Build anticipation for this chase for history!`
          }
        })()
      : `${context.playerName} is approaching a record ${trackDesc}! Generate excitement about the chase for history.`,
    
    MILESTONE_UNLOCKED: context.recentMilestones && context.recentMilestones.length > 0
      ? `MILESTONE ACHIEVED! ${context.playerName} has just unlocked: ${context.recentMilestones.join(', ')}! Celebrate this career achievement! Reference what it means for their journey toward greatness.`
      : `${context.playerName} has hit a milestone in their career ${trackDesc}! Celebrate this achievement.`,
    
    TRIPLE_CROWN_LEG: context.tripleCrownProgress && context.tripleCrownProgress.some(tc => tc.legsCompleted > 0)
      ? (() => {
          const activeCrown = context.tripleCrownProgress.find(tc => tc.legsCompleted > 0 && !tc.isComplete)
          if (activeCrown && activeCrown.legsCompleted === 2) {
            return `ONE LEG TO GO! ${context.playerName} is just ONE victory away from completing the ${activeCrown.crownName}! They need to win at ${activeCrown.nextLeg}! Only a handful of drivers in history have achieved this - build MASSIVE anticipation!`
          } else if (activeCrown) {
            return `${context.playerName} has ${activeCrown.legsCompleted} of ${activeCrown.totalLegs} legs of the ${activeCrown.crownName}! Next up: ${activeCrown.nextLeg}. Reference this incredible quest!`
          }
          return `${context.playerName} is on the path to Triple Crown glory! Generate excitement about this legendary pursuit.`
        })()
      : `${context.playerName} is chasing a Triple Crown ${trackDesc}! Reference this legendary motorsport achievement.`,
    
    // ===== MILESTONE CELEBRATION EVENTS (NEW) =====
    MILESTONE_WIN_STREAK: context.consecutiveWins && context.consecutiveWins >= 3
      ? `WINNING STREAK! ${context.playerName} has now won ${context.consecutiveWins} RACES IN A ROW ${trackDesc}! ${context.consecutiveWins >= 5 ? 'An absolutely DOMINANT purple patch! Who can stop them?!' : 'Building serious momentum - the driver to beat!'} Generate excited celebration of this streak!`
      : `${context.playerName} is on a winning run ${trackDesc}! Celebrate the momentum!`,
    
    MILESTONE_PODIUM_STREAK: context.consecutivePodiums && context.consecutivePodiums >= 5
      ? `REMARKABLE CONSISTENCY! ${context.playerName} has finished on the podium for ${context.consecutivePodiums} RACES IN A ROW! That's extraordinary - always there at the sharp end! Generate commentary celebrating this incredible run of form.`
      : `${context.playerName} continues their podium streak ${trackDesc}! Consistency personified!`,
    
    MILESTONE_COMEBACK: context.comebackWins
      ? `THE FIGHTBACK SPECIALIST DOES IT AGAIN! ${context.playerName} ${carDesc} has pulled off ANOTHER comeback victory ${trackDesc}! That's ${context.comebackWins} career wins from outside the top 10! Never count them out! Generate passionate celebration of this fighting spirit!`
      : `A comeback victory for ${context.playerName}! From deep in the pack to the top step - what a drive!`,
    
    MILESTONE_HAT_TRICK: `HAT TRICK! ${context.playerName} has achieved the PERFECT RACE ${trackDesc}! Pole position, race win, AND fastest lap! That's ${context.hatTricks ? context.hatTricks : 'another'} hat trick for the collection! Generate maximum excitement - this is motorsport perfection!`,
    
    MILESTONE_GRAND_SLAM: `GRAND SLAM! ABSOLUTE PERFECTION! ${context.playerName} has achieved motorsport's ultimate flex ${trackDesc}! Pole position, LED EVERY LAP, won the race, AND set fastest lap! That's ${context.grandSlams ? context.grandSlams : 'a'} grand slam! Generate historic levels of excitement - this is the rarest achievement in racing!`,
    
    // ===== TEAM/SPONSOR NARRATIVE EVENTS (NEW) =====
    TEAM_PRESSURE_MENTION: context.teamFinalWarningIssued
      ? `The pressure is IMMENSE on ${context.playerName} ${trackDesc}. ${context.teamName ? `${context.teamName} have` : 'The team have'} issued a FINAL WARNING - their seat is on the line! Every corner, every lap matters now. Generate tense commentary about the career-defining pressure.`
      : context.teamWarningIssued
      ? `${context.playerName} knows the management are watching closely ${trackDesc}. A formal warning from ${context.teamName || 'the team'} means results are needed - and soon. Generate commentary about the mounting internal pressure.`
      : context.teamSatisfactionStatus === 'crisis'
      ? `Behind the scenes, ${context.playerName}'s relationship with ${context.teamName || 'the team'} is at breaking point ${trackDesc}. The paddock is buzzing with rumors. Generate subtle commentary hinting at the internal tensions.`
      : `${context.playerName} will be keen to keep ${context.teamName || 'the team'} happy with a strong result ${trackDesc}. Generate brief mention of team dynamics.`,
    
    SPONSOR_PRESSURE_MENTION: context.sponsorPressureLevel === 'high'
      ? `The commercial side of ${context.playerName}'s career ${trackDesc}... let's just say the sponsors are expecting results. ${context.sponsorsAtRisk ? `${context.sponsorsAtRisk} sponsor${context.sponsorsAtRisk > 1 ? 's' : ''} not entirely satisfied` : 'Questions being asked'} in the boardroom. Generate brief commentary about commercial pressure without being too specific.`
      : context.sponsorPressureLevel === 'moderate'
      ? `${context.playerName} needs to keep the sponsors smiling ${trackDesc}. ${context.topSponsorName ? `${context.topSponsorName} will` : 'The commercial partners will'} want to see their driver on the podium. Generate brief mention of commercial expectations.`
      : context.sponsorsSatisfied && context.sponsorsTotal && context.sponsorsSatisfied === context.sponsorsTotal
      ? `${context.playerName}'s sponsors must be delighted with this performance ${trackDesc}! ${context.topSponsorName ? `${context.topSponsorName}` : 'The commercial partners'} are getting their money's worth! Generate positive mention of sponsor satisfaction.`
      : `${context.playerName} flying the flag for their sponsors ${trackDesc}. Brief positive commercial mention.`,
    
    MEDIA_HEADLINE_CALLBACK: context.recentPressClippings && context.recentPressClippings.length > 0
      ? (() => {
          const clip = context.recentPressClippings[0]
          return `You know, ${clip.outlet} had a headline this week: "${clip.headline}". ${clip.sentiment === 'positive' ? 'And they look right so far!' : clip.sentiment === 'negative' ? 'And they\'ll be watching closely...' : 'Interesting timing to prove a point...'} Generate commentary that naturally references this ACTUAL headline about the driver.`
        })()
      : context.recentHeadline
      ? `"${context.recentHeadline}" - that was the headline this week. ${context.playerName} out to prove a point ${trackDesc}! Generate commentary referencing this recent press coverage.`
      : `${context.playerName} will be hoping for positive headlines after this ${trackDesc}. Generate brief media mention.`,
    
    // === AUTHENTIC TV BROADCAST: STRATEGY SPECULATION ===
    STRATEGY_SPECULATION: (() => {
      const estimatedStops = (context as any).estimatedStops || 'unknown'
      const raceProgress = (context as any).raceProgress || 50
      return `Speculate on the pit strategy happening in this race ${trackDesc}. We're ${raceProgress}% through the race. ${estimatedStops === 1 ? 'Looks like most teams are targeting a one-stop strategy here.' : estimatedStops === 2 ? 'This could be a two-stopper given the tyre degradation.' : 'The pit window is open - who will blink first?'} Generate insightful strategy analysis like a real commentator would. Reference fuel, tyres, or track position as appropriate.`
    })(),
    
    STRATEGY_UNDERCUT_ATTEMPT: (() => {
      const rivalName = (context as any).rivalPittingName || 'a rival'
      const pitLap = (context as any).pitLap || context.currentLap
      return `${rivalName} has just pitted on lap ${pitLap} ${trackDesc}! That's an early stop - could this be an UNDERCUT attempt? Generate excited commentary about the strategic implications. Will they emerge ahead? This is the chess game of motorsport!`
    })(),
    
    STRATEGY_OVERCUT_ATTEMPT: (() => {
      const rivalName = (context as any).rivalPittingName || 'a rival'
      return `${context.playerName} is staying out while ${rivalName} has already pitted ${trackDesc}. The OVERCUT is on! Generate commentary about the strategic gamble - can they use the clear track to make up time? The pit wall will be watching those sector times closely!`
    })(),
    
    PIT_WINDOW_OPEN: (() => {
      const pitWindowLap = (context as any).pitWindowLap || Math.round(context.totalLaps * 0.25)
      return `We're approaching lap ${pitWindowLap} ${trackDesc} and the PIT WINDOW is now OPEN! Expect to see some strategic action in the next few laps. Generate commentary about the anticipation - which team will pull the trigger first?`
    })(),
    
    STRATEGY_COMMITTED: `${context.playerName} has made their stop - they're committed to their strategy now ${trackDesc}! Generate brief commentary about the strategic picture.`,
    
    // === AUTHENTIC TV BROADCAST: CROWD / ATMOSPHERE ===
    CROWD_ROAR: (() => {
      const isHomeHero = (context as any).isHomeHero
      const homeCountry = (context as any).homeCountry
      if (isHomeHero && homeCountry) {
        return `LISTEN TO THAT CROWD! The ${homeCountry} fans are going WILD ${trackDesc}! Their hero is on the charge! Generate excited commentary about the incredible atmosphere - the home crowd roaring them on! This is what motorsport is all about!`
      }
      return `The crowd is on their feet ${trackDesc}! What a moment! Generate excited commentary about the electric atmosphere - the fans are loving this!`
    })(),
    
    ATMOSPHERE_ELECTRIC: `The atmosphere here ${trackDesc} is absolutely ELECTRIC! What a race we're having! Generate commentary about the incredible spectacle - multiple battles, drama unfolding. The fans are getting their money's worth today!`,
    
    // === AUTHENTIC TV BROADCAST: BREATHING ROOM / PACING ===
    BREATHING_ROOM: (() => {
      const phrases = [
        `Let's just take a moment to appreciate those sounds ${trackDesc}... the symphony of motorsport.`,
        `Beautiful conditions here ${trackDesc}... what a setting for racing.`,
        `Sometimes you just have to sit back and enjoy racing like this ${trackDesc}.`,
        `The sounds, the atmosphere ${trackDesc}... this is why we love this sport.`,
        `Gorgeous racing here ${trackDesc}. Let's enjoy this for a moment.`,
      ]
      return phrases[Math.floor(Math.random() * phrases.length)] + ` Generate a brief, atmospheric observation. Keep it SHORT and reflective - let the racing breathe.`
    })(),
    
    // === AUTHENTIC TV BROADCAST: POST-RACE ===
    COOLDOWN_LAP: (() => {
      const finalPos = (context as any).finalPosition || context.playerPosition
      const posGained = (context as any).positionsGained || 0
      const overtakes = (context as any).overtakesMade || 0
      
      let cooldownContext = ''
      if (finalPos === 1) {
        cooldownContext = `WINNER! ${context.playerName} takes the victory ${trackDesc}! What a drive!`
      } else if (finalPos <= 3) {
        cooldownContext = `PODIUM! ${context.playerName} crosses the line in P${finalPos} ${trackDesc}!`
      } else if (posGained > 5) {
        cooldownContext = `What a recovery drive! ${context.playerName} finishes P${finalPos} after gaining ${posGained} positions ${trackDesc}!`
      } else if (posGained < -5) {
        cooldownContext = `A difficult day for ${context.playerName}, finishing P${finalPos} ${trackDesc}. Not the result they wanted.`
      } else {
        cooldownContext = `${context.playerName} brings it home in P${finalPos} ${trackDesc}. ${overtakes > 3 ? `Plenty of action with ${overtakes} overtakes!` : 'Solid drive.'}`
      }
      
      return `${cooldownContext} Generate cool-down lap commentary - reflective, emotional if warranted. Reference the key moments if it was a great drive. Allow the moment to breathe.`
    })(),
    
    POST_RACE_REFLECTION: (() => {
      const highlights = (context as any).narrativeHighlights || []
      const startPos = (context as any).startPosition || 0
      const finalPos = (context as any).finalPosition || context.playerPosition
      
      let reflectionContext = `${context.playerName} started P${startPos}, finished P${finalPos} ${trackDesc}.`
      if (highlights.length > 0) {
        reflectionContext += ` Key moments: ${highlights.join(', ')}.`
      }
      
      return `${reflectionContext} Generate thoughtful post-race analysis. What worked? What didn't? Reference specific moments from the race if available. This is the wrap-up segment.`
    })(),
    
    CHAMPIONSHIP_IMPLICATIONS: (() => {
      const points = (context as any).pointsScored || 0
      const newPos = (context as any).newChampionshipPosition || context.championshipPosition
      const gapToLeader = (context as any).pointsGapToLeader || context.pointsGapToLeader
      const titleStatus = (context as any).titleFightStatus || context.titleFightStatus
      
      let championshipContext = `${context.playerName} scores ${points} points today, moving to P${newPos} in the championship.`
      if (gapToLeader !== undefined && gapToLeader > 0) {
        championshipContext += ` ${gapToLeader} points off the lead.`
      }
      if (titleStatus === 'close_battle') {
        championshipContext += ' This championship is going down to the wire!'
      } else if (titleStatus === 'must_win') {
        championshipContext += ' Every point crucial now in the title fight!'
      }
      
      return `${championshipContext} Generate championship implications commentary. What does this result mean for the bigger picture? Keep it concise but impactful.`
    })(),
    
    // === AUTHENTIC TV BROADCAST: PIT REPORTER ===
    PIT_REPORTER_GRID: (() => {
      return `[PIT REPORTER VOICE - informal, on-the-ground] I'm here on the grid ${trackDesc} and I can tell you the atmosphere is incredible! ${context.teamName ? `Just spoke to the ${context.teamName} engineers - they're feeling confident about the setup.` : 'The mechanics are doing their final checks.'} Generate a grid walk style report - informal, reactive, interviewer-like. Short observations from pitlane perspective.`
    })(),
    
    PIT_REPORTER_PIT_UPDATE: (() => {
      return `[PIT REPORTER VOICE - urgent, reactive] I'm here in the pit lane ${trackDesc} and there's a LOT of activity! Generate a pit lane update - what's happening, who's in, quick observations. Keep it punchy and reactive like a real pit reporter would deliver.`
    })(),
    
    PIT_REPORTER_POST_RACE: (() => {
      const finalPos = (context as any).finalPosition || context.playerPosition
      const isWin = finalPos === 1
      const isPodium = finalPos <= 3
      
      return `[PIT REPORTER VOICE - emotional, post-race] I'm here in parc fermé ${trackDesc} and ${isWin ? 'the celebrations are already starting!' : isPodium ? 'there are hugs all round!' : 'the team are gathering the data.'} Generate a post-race pit lane report - emotional reactions, team celebrations or commiserations. Interview-style observations.`
    })(),
  }
  
  const eventPrompt = eventPrompts[type] || `Commentary for event: ${type}`
  
  return `${baseInstructions}

EVENT TYPE: ${type}
${contextStr}

TASK: ${eventPrompt}

Generate ONLY the commentary line, nothing else. No quotes around it. Keep it natural and broadcast-authentic.`
}

// Dynamic system prompts for lead commentator (Crofty) - length controlled by prompt
// IMPORTANT: These avoid self-referencing and include strict data accuracy rules
const CROFTY_SYSTEM_PROMPTS = [
  'You are the lead commentator - a seasoned British motorsport broadcaster. CRITICAL: Only use driver names EXPLICITLY provided - NEVER invent names. No name given = "the car ahead", "a rival". Team names (BMW, Ferrari, Mercedes) are NOT driver names. Never fabricate stats. NEVER self-reference. No quotes. Sound LIVE.',
  'You are a veteran British racing commentator with decades of experience. STRICT: Only mention driver names from the prompt data. No name = use generic terms like "the competition" or "his rival". Teams/manufacturers are not drivers. Stick to facts - no invented stats. NEVER self-reference. No quotes.',
  'You are the voice of motorsport - a professional British commentator. DATA ACCURACY: Use ONLY driver names explicitly given. If no name provided, say "the car ahead" or "the driver behind". BMW/Mercedes/Ferrari are teams, NOT drivers. Never invent statistics. NEVER introduce yourself. No quotes.',
  'You are a professional British race commentator mixing insight with excitement. ACCURACY FIRST: Driver names must come from context - never invent. Generic terms when no name given. Only cite real data. NEVER refer to yourself. Match your energy to the moment. No quotes.',
  'You are a British motorsport commentator capturing live racing drama. CRITICAL: Only use driver names FROM THE CONTEXT. No name = "a rival", "the car ahead". Team names are teams, not people. Never fabricate times/stats. Every word matters. NEVER say your name. No quotes.'
]

/**
 * Generate commentary using Gemini 3 Flash
 */
export async function generateCommentary(
  event: CommentaryEvent,
  apiKey: string
): Promise<string | null> {
  if (!apiKey) {
    console.error('[ScriptGenerator] No API key provided')
    return getFallbackLine(event.type)
  }
  
  // Calculate energy level for this event
  ensureCoverageHistoryLoaded(event.context)
  const energyLevel = calculateEnergyLevel(event.context)
  
  // Log energy level decision
  const energyReason = event.context.playerPosition === 1 ? 'in the lead' :
    (event.context.gapAhead !== undefined && event.context.gapAhead < 1.5) ? 'close battle' :
    (event.type === 'RACE_WIN' || event.type === 'PODIUM_FINISH') ? 'celebration' :
    'standard racing'
  commentaryLog.energyLevel(energyLevel, energyReason)
  
  const prompt = clampPromptLength(buildPrompt(event, energyLevel))
  persistCoverageHistory(event.context)
  
  // Dynamic temperature based on energy level and randomness
  const baseTemp = {
    calm: 0.7,
    building: 0.8,
    intense: 0.9,
    celebration: 0.95
  }[energyLevel]
  // Add slight randomness to temperature (capped at 1.0 to prevent incoherent output)
  const temperature = Math.min(1.0, baseTemp + (Math.random() * 0.1))
  
  // Pick a random system prompt for variety
  const systemPrompt = CROFTY_SYSTEM_PROMPTS[Math.floor(Math.random() * CROFTY_SYSTEM_PROMPTS.length)]
  
  try {
    // DEBUG: Log what we're sending
    const requestBody = {
      model: 'gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500, // Reduced from 4000 - sufficient for 15-80 word responses
      temperature
    }
    
    console.log(`[ScriptGenerator] Generating for event: ${event.type}`)
    console.log(`[ScriptGenerator] API Key (first 10 chars): ${apiKey?.substring(0, 10)}...`)
    console.log(`[ScriptGenerator] Temperature: ${temperature}, Energy: ${energyLevel}`)
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })
    
    // DEBUG: Log response status
    console.log(`[ScriptGenerator] Response status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const error = await response.text()
      console.error('[ScriptGenerator] API error response:', error)
      console.error('[ScriptGenerator] Falling back to preset line')
      return getFallbackLine(event.type)
    }
    
    const data = await response.json()
    
    // DEBUG: Log the full response structure
    console.log('[ScriptGenerator] Raw API response:', JSON.stringify(data, null, 2).substring(0, 500))
    
    const script = data.choices?.[0]?.message?.content?.trim()
    
    // DEBUG: Log extracted content
    console.log(`[ScriptGenerator] Extracted script: "${script}"`)
    
    if (!script || script.length < 3) {
      console.error(`[ScriptGenerator] Script too short or empty: "${script}"`)
      console.error('[ScriptGenerator] Full response data:', JSON.stringify(data))
      return getFallbackLine(event.type)
    }
    
    let cleanScript = script.replace(/^["']|["']$/g, '')
    cleanScript = removeSelfReferences(cleanScript)
    
    if (isTooSimilarToRecent(cleanScript)) {
      console.log(`[ScriptGenerator] Rejected near-duplicate line: "${cleanScript.slice(0, 60)}..."`)
      return getFallbackLine(event.type)
    }
    trackRecentLine(cleanScript)
    trackRecentTopic(getTopicForEvent(event.type, event.context))
    evaluateThreadResolutionQuality(event, cleanScript)
    
    console.log(`[ScriptGenerator] Final script (${cleanScript.length} chars): "${cleanScript}"`)
    commentaryLog.scriptGenerated('Lead', cleanScript.length)
    
    return cleanScript
    
  } catch (error) {
    console.error('[ScriptGenerator] Fetch error:', error)
    console.error('[ScriptGenerator] Error stack:', (error as Error).stack)
    return getFallbackLine(event.type)
  }
}

/**
 * Generate commentary script in streaming mode
 * Buffers tokens and calls onFragment whenever a complete sentence is ready.
 */
export async function generateCommentaryStream(
  event: CommentaryEvent,
  apiKey: string,
  onFragment: (text: string) => void
): Promise<string> {
  if (!apiKey) {
    const fallback = getFallbackLine(event.type)
    onFragment(fallback)
    return fallback
  }

  ensureCoverageHistoryLoaded(event.context)
  const energyLevel = calculateEnergyLevel(event.context)
  const prompt = clampPromptLength(buildPrompt(event, energyLevel))
  persistCoverageHistory(event.context)
  const baseTemp = { calm: 0.7, building: 0.8, intense: 0.9, celebration: 0.95 }[energyLevel]
  const temperature = Math.min(1.0, baseTemp + (Math.random() * 0.1))
  const systemPrompt = CROFTY_SYSTEM_PROMPTS[Math.floor(Math.random() * CROFTY_SYSTEM_PROMPTS.length)]

  let fullScript = ''
  let sentenceBuffer = ''

  try {
    console.log('[ScriptGenerator] Starting STREAMING text generation...')
    const startTime = Date.now()
    
    // Use native Gemini streaming API (more reliable than OpenAI-compat)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${apiKey}&alt=sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: 500
        }
      })
    })

    if (!response.ok || !response.body) {
      console.error('[ScriptGenerator] Stream request failed:', response.status)
      commentaryLog.error('LEAD_STREAM_REQUEST_FAILED', {
        status: response.status,
        statusText: response.statusText,
        eventType: event.type,
      })
      const fallback = getFallbackLine(event.type)
      onFragment(fallback)
      return fallback
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let chunkCount = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        try {
          const json = JSON.parse(trimmed.replace('data: ', ''))
          const content = json.candidates?.[0]?.content?.parts?.[0]?.text || ''
          if (content) {
            chunkCount++
            if (chunkCount === 1) {
              console.log(`[ScriptGenerator] First token received in ${Date.now() - startTime}ms`)
            }
            
            fullScript += content
            sentenceBuffer += content

            // If we hit a sentence ender, flush the buffer
            if (/[.!?]/.test(content) && sentenceBuffer.trim().length > 5) {
              const fragment = sentenceBuffer.trim().replace(/^["']|["']$/g, '')
              if (fragment) {
                console.log(`[ScriptGenerator] Fragment ${chunkCount}: "${fragment}" @ ${Date.now() - startTime}ms`)
                onFragment(fragment)
              }
              sentenceBuffer = ''
            }
          }
        } catch (e) {
          // Ignore parse errors for partial chunks
        }
      }
    }
    
    console.log(`[ScriptGenerator] Stream complete: ${chunkCount} chunks in ${Date.now() - startTime}ms`)

    // Flush remaining buffer
    const finalFragment = sentenceBuffer.trim().replace(/^["']|["']$/g, '')
    if (finalFragment) onFragment(finalFragment)

    let cleanFull = fullScript.trim().replace(/^["']|["']$/g, '')
    cleanFull = removeSelfReferences(cleanFull)
    if (isTooSimilarToRecent(cleanFull)) {
      console.log(`[ScriptGenerator] Rejected near-duplicate streamed line: "${cleanFull.slice(0, 60)}..."`)
      return ''
    }
    trackRecentLine(cleanFull)
    trackRecentTopic(getTopicForEvent(event.type, event.context))
    evaluateThreadResolutionQuality(event, cleanFull)
    commentaryLog.scriptGenerated('Lead (stream)', cleanFull.length)
    return cleanFull

  } catch (error) {
    console.error('[ScriptGenerator] Stream error:', error)
    commentaryLog.error('LEAD_STREAM_ERROR', {
      eventType: event.type,
      message: (error as Error)?.message || String(error),
    })
    const fallback = getFallbackLine(event.type)
    onFragment(fallback)
    return fallback
  }
}

/**
 * Generate co-commentator response in streaming mode
 */
export async function generateCoCommentaryStream(
  event: CommentaryEvent,
  leadScript: string,
  apiKey: string,
  onFragment: (text: string) => void
): Promise<string> {
  if (!apiKey) {
    const fallback = getCoFallbackLine(event.type)
    onFragment(fallback)
    return fallback
  }

  const { type, context } = event
  const energyLevel = calculateEnergyLevel(context)
  const shouldDisagree = shouldRyanDisagree()
  const responseStyle = getRyanResponseStyle()
  const ryanAntiRepetition = recentLines.length > 0 ? `\nAVOID phrases similar to: ${recentLines.slice(-3).join(', ')}` : ''
  const shuffledPhrases = [...VICKY_CO_CATCHPHRASES].sort(() => Math.random() - 0.5).slice(0, 4)
  const ryanLength = getRyanResponseLength(leadScript, type)
  const threadSummary = buildThreadContinuitySummary(context)
  const threadCallbacks = buildThreadCallbackGuide(type, context, 2)
  const ryanTemp = Math.min(1.0, 0.8 + (Math.random() * 0.15))
  const systemPrompt = VICKY_CO_SYSTEM_PROMPTS[Math.floor(Math.random() * VICKY_CO_SYSTEM_PROMPTS.length)]

  const prompt = `You are Vicky, a professional and articulate British female co-commentator.
Crofty (lead) just said: "${leadScript}"
STYLE: ${responseStyle}
LENGTH: ${ryanLength.minWords}-${ryanLength.maxWords} words. ${ryanLength.instruction}
${shouldDisagree ? 'BANTER MODE: Offer an alternative perspective or playful counterpoint.' : 'React naturally - build on it or add insight.'}
ENERGY: ${energyLevel.toUpperCase()}
CONTEXT: ${context.playerName}, P${context.playerPosition}, ${context.trackName}
DATA RULES: Never invent driver names. If Crofty mentioned a suspicious name (looks like a team/manufacturer), don't repeat it - use "that driver" instead.
THREAD CONTINUITY:
${threadSummary || '- No active long-term threads available right now.'}
${threadCallbacks || ''}
${ryanAntiRepetition}
PHRASES: ${shuffledPhrases.join(' / ')}
GENERATE: Response. No quotes.`

  let fullScript = ''
  let sentenceBuffer = ''

  try {
    console.log('[ScriptGenerator] Starting Vicky co-commentator STREAMING...')
    const startTime = Date.now()
    
    // Use native Gemini streaming API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${apiKey}&alt=sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }
        ],
        generationConfig: {
          temperature: ryanTemp,
          maxOutputTokens: 400
        }
      })
    })

    if (!response.ok || !response.body) {
      commentaryLog.error('CO_STREAM_REQUEST_FAILED', {
        status: response.status,
        statusText: response.statusText,
        eventType: event.type,
      })
      const fallback = getCoFallbackLine(event.type)
      onFragment(fallback)
      return fallback
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let chunkCount = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        try {
          const json = JSON.parse(trimmed.replace('data: ', ''))
          const content = json.candidates?.[0]?.content?.parts?.[0]?.text || ''
          if (content) {
            chunkCount++
            if (chunkCount === 1) {
              console.log(`[ScriptGenerator] Vicky co-commentator first token in ${Date.now() - startTime}ms`)
            }
            
            fullScript += content
            sentenceBuffer += content

            if (/[.!?]/.test(content) && sentenceBuffer.trim().length > 5) {
              const fragment = sentenceBuffer.trim().replace(/^["']|["']$/g, '')
              if (fragment) {
                console.log(`[ScriptGenerator] Vicky co-commentator fragment: "${fragment}" @ ${Date.now() - startTime}ms`)
                onFragment(fragment)
              }
              sentenceBuffer = ''
            }
          }
        } catch (e) {}
      }
    }
    
    console.log(`[ScriptGenerator] Vicky co-commentator complete: ${chunkCount} chunks in ${Date.now() - startTime}ms`)

    const finalFragment = sentenceBuffer.trim().replace(/^["']|["']$/g, '')
    if (finalFragment) onFragment(finalFragment)

    let cleanFull = fullScript.trim().replace(/^["']|["']$/g, '')
    cleanFull = removeSelfReferences(cleanFull)
    if (isTooSimilarToRecent(cleanFull)) {
      console.log(`[ScriptGenerator] Rejected near-duplicate co-commentary: "${cleanFull.slice(0, 60)}..."`)
      return ''
    }
    trackRecentLine(cleanFull)
    commentaryLog.scriptGenerated('Co (stream)', cleanFull.length)
    return cleanFull

  } catch (error) {
    console.error('[ScriptGenerator] Vicky co-commentator stream error:', error)
    commentaryLog.error('CO_STREAM_ERROR', {
      eventType: event.type,
      message: (error as Error)?.message || String(error),
    })
    const fallback = getCoFallbackLine(event.type)
    onFragment(fallback)
    return fallback
  }
}

/**
 * Format lap time for display
 */
function formatLapTime(seconds: number): string {
  if (seconds <= 0) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return `${mins}:${secs.padStart(6, '0')}`
}

// ===== COMMENTATOR PERSONALITIES =====

// Crofty - Lead Commentator
// Professional British commentator: articulate, measured excitement, proper racing terminology
const CROFTY_CATCHPHRASES = [
  "Absolutely sensational!",
  "What a drive this has been!",
  "Here at ${track}, we're witnessing something special!",
  "The pace is there, no question about it!",
  "That's racing at its finest!",
  "Exceptional stuff from ${driver}!",
  "This is what motorsport is all about!"
]

// Vicky - Co-Commentator  
// Professional British female co-commentator: insightful analysis, warm delivery, experienced broadcaster
const VICKY_CO_CATCHPHRASES = [
  "That's exceptional driving!",
  "Absolutely spot on!",
  "Really impressive work there!",
  "You can see the confidence building!",
  "That's the kind of move that wins championships!",
  "Textbook execution!",
  "Brilliant racecraft!",
  "That's quality right there!",
  "Well judged!",
  "Impressive composure!",
  "Really mature driving!",
  "Outstanding!"
]

// Vicky co-commentator response styles for variety
const VICKY_CO_RESPONSE_STYLES = [
  'Quick agreement with added insight',
  'Technical observation with professional analysis',
  'Express genuine enthusiasm',
  'Add a thoughtful observation',
  'Reference something specific Crofty said',
  'Concise professional reaction',
  'Add context or historical perspective',
  'Offer an alternative viewpoint gracefully'
]

// Vicky system prompts for co-commentator - includes strict data accuracy rules
const VICKY_CO_SYSTEM_PROMPTS = [
  'You are Vicky, a professional British female co-commentator with a warm broadcasting style. CRITICAL: Only use driver names FROM THE CONTEXT - never invent. No name = "the driver", "that car". Teams (BMW, Ferrari) are not driver names. Never fabricate stats. Articulate and insightful. No quotes.',
  'You are Vicky, bringing polished expertise to the broadcast. STRICT: Driver names must be explicitly provided. Use generic terms if no name given. BMW/Ferrari = teams, not people. Only cite real data. Measured analysis with genuine enthusiasm. No quotes.',
  'You are Vicky, respected co-commentator with years of experience. DATA RULES: Only mention drivers named in context. Distinguish drivers from teams from manufacturers. Never invent statistics. Sharp observations, professional delivery. No quotes.',
  'You are Vicky, experienced motorsport presenter who understands the drama. ACCURACY: Use ONLY driver names from the prompt. Generic terms when unnamed. Teams are organizations, not people. Stick to facts provided. Vary your responses naturally. No quotes.'
]

/**
 * Get Vicky's response length based on Crofty's line and event type
 * Vicky generally keeps it shorter than Crofty, but can elaborate on narrative moments
 */
function getRyanResponseLength(leadScript: string, eventType: CommentaryEventType): { minWords: number; maxWords: number; instruction: string } {
  const leadLength = leadScript.split(' ').length
  
  // For short lead lines (under 25 words), Vicky stays concise
  if (leadLength < 25) {
    return {
      minWords: 8,
      maxWords: 18,
      instruction: 'Keep it punchy! Quick reaction.'
    }
  }
  
  // For medium lead lines (25-45 words), Vicky can elaborate a bit
  if (leadLength < 45) {
    return {
      minWords: 15,
      maxWords: 30,
      instruction: 'You can develop your thought a bit more here.'
    }
  }
  
  // For long lead narratives (45+ words), Vicky can elaborate more
  // But still keep it conversational - she's reacting, not monologuing
  const isNarrativeEvent = ['COLOR_COMMENTARY', 'TRIVIA_DROP', 'TRACK_CHARACTER', 'DRIVER_BACKGROUND'].includes(eventType)
  
  if (isNarrativeEvent && Math.random() < 0.4) {
    // 40% chance Vicky expands on the topic
    return {
      minWords: 25,
      maxWords: 45,
      instruction: 'Crofty went long - you can expand on this! Share a thought, analysis, or observation. Let it breathe.'
    }
  }
  
  return {
    minWords: 15,
    maxWords: 30,
    instruction: 'Solid response - acknowledge what Crofty said and add your take.'
  }
}

// Types of banter interactions
type BanterType = 'agree' | 'disagree' | 'joke' | 'analysis'

/**
 * Determine if Vicky should disagree (for variety)
 */
function shouldRyanDisagree(): boolean {
  return Math.random() < 0.18 // 18% chance of playful disagreement
}

/**
 * Get Vicky's response style for this particular response
 */
function getRyanResponseStyle(): string {
  return VICKY_CO_RESPONSE_STYLES[Math.floor(Math.random() * VICKY_CO_RESPONSE_STYLES.length)]
}

/**
 * Generate a co-commentator response/banter
 * This creates natural back-and-forth dialogue
 */
export async function generateCoCommentaryResponse(
  event: CommentaryEvent,
  leadScript: string,
  apiKey: string
): Promise<string | null> {
  if (!apiKey) {
    return getCoFallbackLine(event.type)
  }
  
  const { type, context } = event
  const energyLevel = calculateEnergyLevel(context)
  const shouldDisagree = shouldRyanDisagree()
  const responseStyle = getRyanResponseStyle()
  
  // Build anti-repetition for Vicky co-commentator too
  const ryanAntiRepetition = recentLines.length > 0 
    ? `\nAVOID phrases similar to: ${recentLines.slice(-3).join(', ')}`
    : ''
  
  // Pick random catchphrases to suggest (different each time)
  const shuffledPhrases = [...VICKY_CO_CATCHPHRASES].sort(() => Math.random() - 0.5).slice(0, 4)
  
  // Get variable response length based on what Crofty said
  const ryanLength = getRyanResponseLength(leadScript, type)
  const threadSummary = buildThreadContinuitySummary(context)
  const threadCallbacks = buildThreadCallbackGuide(type, context, 2)

  const prompt = `You are Vicky, a professional and articulate British female co-commentator.

YOUR VIBE:
- Professional, insightful, polished broadcasting style
- Warm but authoritative - a respected voice in motorsport coverage
- Thoughtful analysis, genuine enthusiasm for the sport
- Can challenge with grace, always professional

Crofty (lead) just said: "${leadScript}"

YOUR RESPONSE STYLE FOR THIS LINE: ${responseStyle}
LENGTH GUIDANCE: ${ryanLength.minWords}-${ryanLength.maxWords} words. ${ryanLength.instruction}

${shouldDisagree ? `
BANTER MODE: Offer an alternative perspective or counterpoint with grace.
Examples: "I'm not so sure about that, Crofty..." / "Actually, I think there's another way to look at this..." / "Interesting take, but..."
` : `
React naturally to what Crofty said - build on it, agree enthusiastically, or add a quick insight.
`}

ENERGY: ${energyLevel.toUpperCase()} ${energyLevel === 'intense' ? '[HIGH]' : energyLevel === 'celebration' ? '[PARTY]' : ''}

QUICK CONTEXT:
- ${context.playerName}, P${context.playerPosition}, ${context.trackName}
${context.gapAhead ? `- ${context.gapAhead.toFixed(1)}s to car ahead` : ''}
${context.lastRaceResult ? `- Last race: P${context.lastRaceResult}` : ''}
${context.currentStreak ? `- Form: ${context.currentStreak}` : ''}
${threadSummary ? threadSummary.trim() : '- SEASON CONTINUITY THREADS: none active'}
${threadCallbacks || ''}
${ryanAntiRepetition}

DATA ACCURACY: Never invent driver names. If Crofty mentioned a name that sounds like a team or manufacturer, don't repeat it - use "that driver" or "the car ahead" instead.

PHRASES TO DRAW FROM (use sparingly):
${shuffledPhrases.join(' / ')}

GENERATE: Response (${ryanLength.minWords}-${ryanLength.maxWords} words). No quotes. Sound like you're reacting LIVE to what Crofty just said.`

  // Dynamic temperature - Vicky should be a bit more measured (capped at 1.0)
  const ryanTemp = Math.min(1.0, 0.8 + (Math.random() * 0.15))
  
  // Pick random system prompt
  const systemPrompt = VICKY_CO_SYSTEM_PROMPTS[Math.floor(Math.random() * VICKY_CO_SYSTEM_PROMPTS.length)]

  try {
    console.log(`[ScriptGenerator] Generating CO-commentary response`)
    console.log(`[ScriptGenerator] Lead said: "${leadScript.substring(0, 50)}..."`)
    console.log(`[ScriptGenerator] Vicky co-commentator temp: ${ryanTemp}, shouldDisagree: ${shouldDisagree}`)
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000, // Reduced from 3000 - sufficient for 8-40 word responses
        temperature: ryanTemp
      })
    })
    
    console.log(`[ScriptGenerator] Co-commentary response status: ${response.status}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ScriptGenerator] Co-commentary API error:', errorText)
      return getCoFallbackLine(event.type)
    }
    
    const data = await response.json()
    console.log('[ScriptGenerator] Co-commentary raw response:', JSON.stringify(data, null, 2).substring(0, 300))
    
    const script = data.choices?.[0]?.message?.content?.trim()
    console.log(`[ScriptGenerator] Co-commentary extracted: "${script}"`)
    
    if (!script || script.length < 3) {
      console.warn(`[ScriptGenerator] Co script too short: "${script}", using fallback`)
      return getCoFallbackLine(event.type)
    }
    
    let cleanScript = script.replace(/^["']|["']$/g, '')
    cleanScript = removeSelfReferences(cleanScript)
    
    // Track Vicky co-commentator's lines too
    trackRecentLine(cleanScript)
    
    console.log(`[ScriptGenerator] Co-commentary final: "${cleanScript}"`)
    
    return cleanScript
    
  } catch (error) {
    console.error('[ScriptGenerator] Co-commentary error:', error)
    console.error('[ScriptGenerator] Co-commentary stack:', (error as Error).stack)
    return getCoFallbackLine(event.type)
  }
}

/**
 * Fallback lines for co-commentator (Vicky's professional British style)
 */
function getCoFallbackLine(eventType: CommentaryEventType): string {
  const fallbacks: Partial<Record<CommentaryEventType, string[]>> = {
    RACE_START: [
      "Here we go then!",
      "Right, let's have it!",
      "This is gonna be brilliant!",
      "Scenes! Let's see what they've got!"
    ],
    OVERTAKE: [
      "Absolutely brilliant that!",
      "What a move, mate!",
      "That was textbook!",
      "Yeeeah! That's the business!"
    ],
    FASTEST_LAP: [
      "The pace is properly there!",
      "Flying out there!",
      "That's quality that is!",
      "Mad pace! Absolutely rapid!"
    ],
    RACE_WIN: [
      "Get in! What a drive!",
      "Absolutely smashed it!",
      "That's how you do it!",
      "Scenes! What a performance!"
    ],
    PODIUM_FINISH: [
      "Get in there!",
      "Brilliant result!",
      "Proper job that!",
      "That's massive for them!"
    ],
    FINAL_LAPS: [
      "This is it now!",
      "Massive moments here!",
      "Everything on the line!",
      "Oh mate, this is tense!"
    ],
    COLOR_COMMENTARY: [
      "Spot on!",
      "Couldn't agree more!",
      "That's exactly it!",
      "Yeah, absolutely!"
    ],
    POLE_POSITION: [
      "Nailed that lap!",
      "Front row, lovely!",
      "That's massive!",
      "What a lap that was!"
    ],
    POOR_START: [
      "Ouch, that's not ideal!",
      "Rough start that!",
      "Needs to claw it back now!",
      "Not the one, but plenty of racing left!"
    ],
    GREAT_START: [
      "What a launch!",
      "Absolutely nailed that start!",
      "That's how you do it!",
      "Scenes off the line!"
    ],
    UNDER_PRESSURE: [
      "Getting spicy now!",
      "Under the cosh here!",
      "Needs to dig deep!",
      "This is properly intense!"
    ],
    FIELD_BATTLE: [
      "Drama all over the place!",
      "Loving this racing!",
      "This is brilliant!",
      "Scenes throughout the field!"
    ],
    // New situational events
    MOMENTUM_BUILDING: [
      "He's on a proper charge!",
      "Building nicely here!",
      "The momentum's with them!"
    ],
    DEFENSIVE_DRIVING: [
      "Proper racecraft that!",
      "Held firm, class!",
      "Textbook defence!"
    ],
    CONSISTENCY_PRAISE: [
      "Like a metronome!",
      "So consistent, love to see it!",
      "Clean laps, quality driving!"
    ],
    RECOVERY_DRIVE: [
      "Fighting back beautifully!",
      "What a recovery this is!",
      "Never write them off!"
    ],
    PRESSURE_BUILDING: [
      "Ooh, this is getting tasty!",
      "Here we go!",
      "Something's brewing here!"
    ],
    GAP_CALCULATION: [
      "Gonna be tight that!",
      "The maths are looking spicy!",
      "Every tenth counts now!"
    ],
    // Practice/Quali
    OTHER_DRIVER_HOTLAP: [
      "Competition's heating up!",
      "Someone's on it!",
      "That'll spice things up!"
    ],
    TRACK_EVOLUTION: [
      "Track's coming to everyone now!",
      "Rubber going down nicely!",
      "Should get quicker yet!"
    ],
    // Track specific
    CORNER_CALLOUT: [
      "Beautiful through there!",
      "That's the fast line!",
      "Committed, love that!"
    ],
    TRACK_CHARACTER: [
      "What a circuit this is!",
      "Proper drivers' track!",
      "Love this place!"
    ],
    // Banter
    TRIVIA_DROP: [
      "Love a bit of trivia!",
      "Interesting that!",
      "You learn something new!"
    ],
    DISAGREEMENT: [
      "I dunno about that one, Vicky!",
      "Hmm, not so sure myself!",
      "See, I'd say different..."
    ],
    // Milestone celebration events
    MILESTONE_WIN_STREAK: [
      "On fire right now!",
      "No one's touching them!",
      "Proper purple patch!"
    ],
    MILESTONE_PODIUM_STREAK: [
      "Mr/Ms Consistent!",
      "Can't stay off that podium!",
      "Quality, every single race!"
    ],
    MILESTONE_COMEBACK: [
      "What a fighter!",
      "That's why you never give up!",
      "Comeback KING!"
    ],
    MILESTONE_HAT_TRICK: [
      "Perfect day that!",
      "Don't get better than a hat trick!",
      "CLEAN SWEEP!"
    ],
    MILESTONE_GRAND_SLAM: [
      "That's as good as it gets!",
      "Motor racing PERFECTION!",
      "GOAT material right there!"
    ],
    // Team/Sponsor narrative events
    TEAM_PRESSURE_MENTION: [
      "Big weekend for them this.",
      "Management watching closely.",
      "Career-defining stuff really."
    ],
    SPONSOR_PRESSURE_MENTION: [
      "Keep those sponsors smiling!",
      "Commercial boys watching!",
      "That's what the partners want to see!"
    ],
    MEDIA_HEADLINE_CALLBACK: [
      "Seen that headline, have you!",
      "Press are gonna love that!",
      "Write that one up journalists!"
    ],
    // === Authentic TV Broadcast ===
    STRATEGY_SPECULATION: [
      "Pit strategy unfolding!",
      "The chess game begins!",
      "Strategy time!"
    ],
    STRATEGY_UNDERCUT_ATTEMPT: [
      "UNDERCUT! They've pulled the trigger!",
      "Early stop! The undercut is ON!",
      "Strategic move there!"
    ],
    STRATEGY_OVERCUT_ATTEMPT: [
      "They're staying out! Overcut?",
      "Interesting call to stay out!",
      "Going long! Brave!"
    ],
    PIT_WINDOW_OPEN: [
      "Pit window's open!",
      "Here we go with the stops!",
      "Strategy phase now!"
    ],
    CROWD_ROAR: [
      "Listen to that CROWD!",
      "The fans are loving this!",
      "ATMOSPHERE!"
    ],
    ATMOSPHERE_ELECTRIC: [
      "Electric here!",
      "What a race!",
      "The fans are on their feet!"
    ],
    BREATHING_ROOM: [
      "Beautiful...",
      "Gorgeous racing this.",
      "Magnificent."
    ],
    COOLDOWN_LAP: [
      "That's it! Race over!",
      "Incredible stuff!",
      "What a drive!"
    ],
    POST_RACE_REFLECTION: [
      "What a race that was!",
      "Plenty to talk about there!",
      "Some drive that!"
    ],
    CHAMPIONSHIP_IMPLICATIONS: [
      "Big points today!",
      "Championship shakeup!",
      "Crucial for the standings!"
    ],
    PIT_REPORTER_GRID: [
      "Tension on the grid!",
      "Atmosphere building!",
      "Final preparations!"
    ],
    PIT_REPORTER_PIT_UPDATE: [
      "Busy in pit lane!",
      "Action here!",
      "Lots happening!"
    ],
    PIT_REPORTER_POST_RACE: [
      "Emotions running high!",
      "Team celebrations!",
      "Incredible scenes!"
    ]
  }
  
  const lines = fallbacks[eventType] || [
    "Yeah, absolutely!", 
    "Spot on!", 
    "Brilliant!",
    "Quality!",
    "Love to see it!"
  ]
  return lines[Math.floor(Math.random() * lines.length)]
}

/**
 * Generate a quick fallback line if API fails
 */
export function getFallbackLine(eventType: CommentaryEventType): string {
  const fallbacks: Partial<Record<CommentaryEventType, string[]>> = {
    RACE_START: [
      "And we're racing!",
      "Lights out, here we go!",
      "The race is underway!"
    ],
    OVERTAKE: [
      "What a move! Position gained!",
      "Through they go! Brilliant!",
      "That's racing! Up a spot!"
    ],
    POSITION_LOST: [
      "They've lost a position there.",
      "Drops a place in the battle.",
      "Fighting hard but loses out."
    ],
    FASTEST_LAP: [
      "Purple! Fastest lap of the race!",
      "That's the quickest anyone's gone!",
      "Mega lap! Fastest of the day!"
    ],
    PERSONAL_BEST: [
      "Personal best! Great improvement!",
      "That's their fastest lap yet!",
      "Finding pace, new PB!"
    ],
    FINAL_LAPS: [
      "Final laps! Everything to play for!",
      "This is it! The closing stages!",
      "Business end of the race now!"
    ],
    RACE_WIN: [
      "VICTORY! Incredible drive!",
      "They've won it! Fantastic!",
      "P1! What a performance!"
    ],
    PODIUM_FINISH: [
      "Podium! Brilliant result!",
      "On the box! Well deserved!",
      "Top three finish! Great drive!"
    ],
    RACE_FINISH: [
      "And that's the checkered flag!",
      "Race complete, solid drive.",
      "Job done at the flag."
    ],
    SESSION_START: [
      "Session underway!",
      "Green light, we're live!",
      "And we're on track!"
    ],
    PRACTICE_IMPROVEMENT: [
      "Good lap there!",
      "Finding the pace!",
      "That's more like it!"
    ],
    QUALIFYING_ATTEMPT: [
      "Quick lap! Moving up!",
      "That's a good one!",
      "Improvement on that attempt!"
    ],
    POLE_POSITION: [
      "POLE! They'll start from the front!",
      "P1 in qualifying! Brilliant!",
      "Top spot on the grid!"
    ],
    GAP_CLOSING: [
      "Closing in!",
      "The gap is coming down!",
      "Reeling them in!"
    ],
    COLOR_COMMENTARY: [
      "Fascinating battle developing here.",
      "The pace has been impressive.",
      "This championship is heating up!"
    ],
    HALFWAY_POINT: [
      "Halfway there!",
      "Half distance now.",
      "Midpoint of the race."
    ],
    // New start events
    POOR_START: [
      "Terrible start! Lost several places!",
      "Oh no, drops down the order!",
      "Disaster off the line!"
    ],
    GREAT_START: [
      "What a start! Rockets up the order!",
      "Brilliant getaway! Gained places!",
      "Flying start! Up several spots!"
    ],
    UNDER_PRESSURE: [
      "Under serious pressure now!",
      "The pack is all over them!",
      "Losing ground rapidly!"
    ],
    // Field events
    FIELD_BATTLE: [
      "Action elsewhere in the field!",
      "Battle happening behind!",
      "Drama in the midfield!"
    ],
    LEADER_UPDATE: [
      "Meanwhile at the front...",
      "The leader continues on.",
      "Race leader holding strong."
    ],
    MIDFIELD_ACTION: [
      "Plenty happening in the midfield!",
      "Battles all through the pack!",
      "Competitive racing throughout!"
    ],
    // Situational events
    MOMENTUM_BUILDING: [
      "Building serious momentum now!",
      "On a charge through the field!",
      "The pace is really there now!"
    ],
    DEFENSIVE_DRIVING: [
      "Holding position under pressure!",
      "Great defensive driving!",
      "Keeping them at bay!"
    ],
    CONSISTENCY_PRAISE: [
      "Metronomic consistency!",
      "Lap after lap, same pace!",
      "Textbook consistency!"
    ],
    RECOVERY_DRIVE: [
      "What a recovery drive!",
      "Fighting back through the field!",
      "Proper recovery run this!"
    ],
    PRESSURE_BUILDING: [
      "The gap is tumbling!",
      "Closing in fast!",
      "This could be on!"
    ],
    GAP_CALCULATION: [
      "The maths are interesting here...",
      "It's going to be tight!",
      "Can they find enough time?"
    ],
    // Practice/Quali specific
    OTHER_DRIVER_HOTLAP: [
      "Someone's improved their time!",
      "Competition heating up!",
      "Rival on a quick lap!"
    ],
    TRACK_EVOLUTION: [
      "Track's coming to us now.",
      "Times dropping across the board.",
      "Conditions improving."
    ],
    SECTOR_COMPARISON: [
      "Looking good through that sector!",
      "Competitive through there!",
      "Strong sector time!"
    ],
    PIT_ACTIVITY: [
      "Busy in the pit lane!",
      "Plenty of cars coming in!",
      "Activity in the pits."
    ],
    // Track specific
    CORNER_CALLOUT: [
      "Beautifully through there!",
      "Nailed that section!",
      "Perfect line through the corner!"
    ],
    TRACK_CHARACTER: [
      "What a circuit this is!",
      "This track rewards the brave!",
      "A proper drivers' circuit!"
    ],
    // Banter
    TRIVIA_DROP: [
      "Here's an interesting one...",
      "Fun fact for you...",
      "Did you know..."
    ],
    DISAGREEMENT: [
      "I'm not sure about that strategy...",
      "Interesting choice there...",
      "Let's see if that pays off..."
    ],
    // Record/Achievement events
    RECORD_BROKEN: [
      "HISTORY! A new record!",
      "THE RECORD IS BROKEN! Incredible!",
      "Into the history books! What a moment!"
    ],
    RECORD_APPROACHING: [
      "Closing in on history!",
      "The record is within reach!",
      "One step closer to making history!"
    ],
    MILESTONE_UNLOCKED: [
      "Another milestone achieved!",
      "Career milestone unlocked!",
      "What an achievement!"
    ],
    TRIPLE_CROWN_LEG: [
      "A Triple Crown leg secured!",
      "Closer to the Triple Crown!",
      "One more leg in the books!"
    ],
    // Milestone celebration events
    MILESTONE_WIN_STREAK: [
      "What a winning streak this is!",
      "They just keep winning!",
      "The dominant form continues!"
    ],
    MILESTONE_PODIUM_STREAK: [
      "Another podium! Consistency at its best!",
      "Podium after podium - remarkable!",
      "Always there at the sharp end!"
    ],
    MILESTONE_COMEBACK: [
      "The comeback king/queen strikes again!",
      "Never count them out! Another recovery!",
      "From the back to the front - incredible!"
    ],
    MILESTONE_HAT_TRICK: [
      "HAT TRICK! Pole, win, fastest lap!",
      "The perfect race! A hat trick!",
      "Triple whammy! What a performance!"
    ],
    MILESTONE_GRAND_SLAM: [
      "GRAND SLAM! Absolute perfection!",
      "The rarest achievement! Grand slam!",
      "Pole, led every lap, win AND fastest lap!"
    ],
    // Team/Sponsor narrative events
    TEAM_PRESSURE_MENTION: [
      "The pressure is on...",
      "Needs a result for the team today.",
      "Important weekend for their career."
    ],
    SPONSOR_PRESSURE_MENTION: [
      "The sponsors will be watching this.",
      "Commercial pressure building.",
      "Need to keep the partners happy."
    ],
    MEDIA_HEADLINE_CALLBACK: [
      "Making headlines today!",
      "That'll get them talking in the press!",
      "The media will be all over this!"
    ],
    // === Authentic TV Broadcast ===
    STRATEGY_SPECULATION: [
      "The pit strategy is starting to take shape here...",
      "Let's talk strategy - this is where races are won and lost!",
      "The strategists will be poring over the data right now."
    ],
    STRATEGY_UNDERCUT_ATTEMPT: [
      "UNDERCUT ATTEMPT! They've pulled the trigger early!",
      "That's an early stop - the undercut is ON!",
      "Strategic play! They're going for the undercut!"
    ],
    STRATEGY_OVERCUT_ATTEMPT: [
      "They're staying out! Going for the overcut!",
      "Interesting call to go long - can they make it work?",
      "The overcut is in play - fresh tyres vs track position!"
    ],
    PIT_WINDOW_OPEN: [
      "The pit window is now OPEN!",
      "Strategic phase begins - who will blink first?",
      "Expect to see pit stops in the next few laps!"
    ],
    CROWD_ROAR: [
      "LISTEN TO THAT CROWD!",
      "The fans are going WILD!",
      "What an atmosphere! Can you hear that?!"
    ],
    ATMOSPHERE_ELECTRIC: [
      "The atmosphere here is absolutely ELECTRIC!",
      "What a spectacle we're witnessing!",
      "This is motorsport at its absolute finest!"
    ],
    BREATHING_ROOM: [
      "Let's just enjoy these sounds for a moment...",
      "Beautiful racing this...",
      "Sometimes you just have to appreciate this sport."
    ],
    COOLDOWN_LAP: [
      "And that's it! What a race!",
      "CHECKERED FLAG! Race over!",
      "Incredible scenes as they cross the line!"
    ],
    POST_RACE_REFLECTION: [
      "What a race we've just witnessed!",
      "Plenty to unpack from that one!",
      "That was something special!"
    ],
    CHAMPIONSHIP_IMPLICATIONS: [
      "Big points scored today!",
      "That result shakes up the championship!",
      "Crucial for the standings that!"
    ],
    PIT_REPORTER_GRID: [
      "Down on the grid, the tension is palpable...",
      "The atmosphere here is incredible!",
      "Final preparations being made..."
    ],
    PIT_REPORTER_PIT_UPDATE: [
      "Plenty of activity in pit lane!",
      "The pit crews are earning their money today!",
      "Drama unfolding here!"
    ],
    PIT_REPORTER_POST_RACE: [
      "Emotions running high in parc fermé!",
      "Incredible scenes down here!",
      "The celebrations are in full swing!"
    ],
    // === NEW: Telemetry-driven event interjections ===
    // Flag
    FLAG_FINAL_LAP: [
      "FINAL LAP!",
      "Last lap! Here we go!",
      "One more lap to decide it!"
    ],
    // Rival events
    RIVAL_PIT_ENTRY: [
      "They're pitting!",
      "Into the pits!",
      "Pit stop for the competition!"
    ],
    RIVAL_PIT_EXIT: [
      "They're back out.",
      "Rejoining from the pits.",
      "Out of the pit lane."
    ],
    RIVAL_FASTEST_LAP: [
      "New fastest lap in the field!",
      "Someone's found some pace!",
      "Quick lap from the competition!"
    ],
    RIVAL_RETIRED: [
      "They're out!",
      "We've lost a car!",
      "Retirement from the race!"
    ],
    // Player incidents
    CONTACT_DETECTED: [
      "CONTACT!",
      "They've touched!",
      "Ooh! That's contact!"
    ],
    PLAYER_SPINNING: [
      "SPINNING!",
      "They've lost it!",
      "Round they go!"
    ],
    PLAYER_OFFTRACK: [
      "Off the track!",
      "Runs wide!",
      "Through the gravel!"
    ],
    // Damage
    DAMAGE_REPORT: [
      "Carrying damage there.",
      "That'll hurt their pace.",
      "Damage to deal with now."
    ],
    ENGINE_WARNING: [
      "Engine concerns...",
      "Something's not right mechanically.",
      "Reliability worries now."
    ],
    AERO_DAMAGE: [
      "Aero damage visible!",
      "That front wing looks bent!",
      "Bodywork damage there."
    ],
    // Yellow flag / safety car
    FCY_DEPLOYED: [
      "SAFETY CAR!",
      "Full course yellow!",
      "The safety car is out!"
    ],
    FCY_ENDING: [
      "Safety car coming in!",
      "Racing about to resume!",
      "Get ready for the restart!"
    ],
    
    // Session phase events
    SESSION_TIME_5MIN: [
      "Five minutes remaining!",
      "Last five minutes!",
      "Clock's ticking - five to go!"
    ],
    SESSION_TIME_1MIN: [
      "Final minute!",
      "One minute left!",
      "Last sixty seconds!"
    ],
    SESSION_TIME_30SEC: [
      "Thirty seconds!",
      "Almost out of time!",
      "Thirty to go!"
    ],
    SESSION_CHECKERED: [
      "Checkered flag is out!",
      "Time's up! Finish your lap!",
      "Session over - complete your lap!"
    ],
    SESSION_BEST_SET: [
      "Top of the charts!",
      "PROVISIONAL P1!",
      "Fastest time of the session!"
    ],
    SESSION_BEST_STOLEN: [
      "Bumped off the top!",
      "P1 GONE!",
      "They've been beaten!"
    ],
    QUALI_P1_SECURED: [
      "POLE POSITION!",
      "P1 is theirs!",
      "What a qualifying!"
    ],
    QUALI_FRONT_ROW_SECURED: [
      "Front row start!",
      "Top three on the grid!",
      "Great qualifying!"
    ],
    QUALI_COMPLETE: [
      "Qualifying done!",
      "Session complete!",
      "Grid is set!"
    ],
    PRACTICE_COMPLETE: [
      "Practice over!",
      "Session ends!",
      "That's practice done!"
    ]
  }
  
  const lines = fallbacks[eventType] || ["Racing action!"]
  return lines[Math.floor(Math.random() * lines.length)]
}
