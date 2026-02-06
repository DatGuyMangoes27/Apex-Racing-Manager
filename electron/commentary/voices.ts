/**
 * Voice Personas System
 * 
 * Defines the Lead and Analyst commentator personalities for TV broadcast-style
 * dual commentary. Handles voice routing based on content type.
 */

import type { CommentaryEventType } from './engine'
import type { ContentCategory, VoiceRole } from './contentPool'

// ============================================================================
// TYPES
// ============================================================================

export interface VoicePersona {
  id: VoiceRole
  name: string
  description: string
  role: string
  
  // ElevenLabs voice config
  elevenLabsVoiceId: string
  
  // Content routing
  contentTypes: CommentaryEventType[]
  contentCategories: ContentCategory[]
  
  // Speaking share (0-1, must sum to 1 across all personas)
  speakingShare: number
  
  // Voice characteristics for prompt engineering
  characteristics: {
    energy: 'high' | 'medium' | 'calm'
    style: 'excitable' | 'analytical' | 'conversational'
    expertise: string[]
  }
}

export interface TransitionPhrase {
  from: VoiceRole
  to: VoiceRole
  phrases: string[]
}

// ============================================================================
// VOICE PERSONAS
// ============================================================================

/**
 * Lead Commentator - Play-by-play, action calls, excitement
 * Think David Croft (F1), Martin Tyler (football)
 */
export const LEAD_COMMENTATOR: VoicePersona = {
  id: 'lead',
  name: 'Crofty',
  description: 'Excitable lead commentator who calls the action',
  role: 'Play-by-play, action calls, race excitement',
  
  elevenLabsVoiceId: 'KYXXenFO8IFao5NWmALZ', // Default - configurable
  
  contentTypes: [
    // High-action events - always Lead
    'RACE_START',
    'RACE_FINISH',
    'OVERTAKE',
    'LOST_POSITION',
    'BATTLE',
    'FASTEST_LAP',
    'SECTOR_RECORD',
    'INCIDENT',
    'SAFETY_CAR',
    'VSC_START',
    'VSC_END',
    'YELLOW_FLAG',
    'RED_FLAG',
    'CHECKERED_FLAG',
    'PODIUM_FINISH',
    'POINTS_FINISH',
    'MISTAKE',
    'PRESSURE_FROM_BEHIND',
    'PENALTY',
    
    // Commentary triggers
    'LAP_START',
    'HALF_DISTANCE',
    'FINAL_LAP'
  ],
  
  contentCategories: [
    'track_atmosphere',
    'corner_callout',
    'position_battle'
  ],
  
  speakingShare: 0.6, // 60% of total commentary
  
  characteristics: {
    energy: 'high',
    style: 'excitable',
    expertise: ['race action', 'overtakes', 'drama', 'history']
  }
}

/**
 * Analyst/Co-Commentator - Insight, strategy, driver psychology
 * Think Martin Brundle (F1), Gary Neville (football)
 */
export const ANALYST_COMMENTATOR: VoicePersona = {
  id: 'analyst',
  name: 'Ryan',
  description: 'Analytical co-commentator who provides insight',
  role: 'Strategy analysis, driver insight, technical explanation',
  
  elevenLabsVoiceId: 'cN8QEG2nMvJGkXYcFPLz', // Default - configurable
  
  contentTypes: [
    // Analysis events - always Analyst
    'PIT_ENTRY',
    'PIT_EXIT',
    'PIT_STOP',
    'TIRE_WEAR',
    'FUEL_STRATEGY',
    'GAP_CLOSING',
    'GAP_OPENING',
    'DRS_ENABLED',
    'PUSH_TO_PASS',
    'QUALIFYING_POSITION',
    'GRID_POSITION',
    
    // Color commentary
    'COLOR_COMMENTARY',
    'DRIVER_INTRO',
    'TRACK_INFO',
    'WEATHER_UPDATE',
    'CHAMPIONSHIP_CONTEXT',
    'MILESTONE'
  ],
  
  contentCategories: [
    'driver_background',
    'driver_style',
    'driver_rivalry',
    'championship_context',
    'strategy_talk',
    'weather_observation',
    'gap_analysis',
    'sector_observation',
    'track_history'
  ],
  
  speakingShare: 0.35, // 35% of total commentary (reduced to make room for pit reporter)
  
  characteristics: {
    energy: 'calm',
    style: 'analytical',
    expertise: ['strategy', 'driver psychology', 'technical', 'statistics']
  }
}

/**
 * Pit Reporter - On-the-ground field correspondent
 * Think Ted Kravitz (F1 pit lane), Natalie Pinkham (grid walk)
 * Informal, reactive, interviewer-style commentary
 */
export const PIT_REPORTER: VoicePersona = {
  id: 'pit_reporter' as VoiceRole,
  name: 'Pit Reporter',
  description: 'Field correspondent reporting from pit lane and grid',
  role: 'Grid walk observations, pit lane updates, post-race reactions',
  
  elevenLabsVoiceId: '', // Configurable - user must set this
  
  contentTypes: [
    // Pit reporter specific events
    'PIT_REPORTER_GRID' as CommentaryEventType,
    'PIT_REPORTER_PIT_UPDATE' as CommentaryEventType,
    'PIT_REPORTER_POST_RACE' as CommentaryEventType,
    // Can also handle some pit activity
    'PIT_ACTIVITY' as CommentaryEventType,
  ],
  
  contentCategories: [
    'grid_walk' as ContentCategory,
    'pit_lane_report' as ContentCategory,
    'post_race' as ContentCategory,
  ],
  
  speakingShare: 0.05, // 5% of total commentary (rare but impactful)
  
  characteristics: {
    energy: 'medium',
    style: 'conversational',
    expertise: ['pit lane', 'team dynamics', 'interviews', 'atmosphere']
  }
}

// Module-level pit reporter voice ID (configurable)
let configuredPitReporterVoiceId = ''

/**
 * Set the pit reporter voice ID
 */
export function setPitReporterVoiceId(voiceId: string): void {
  configuredPitReporterVoiceId = voiceId
  console.log(`[Voices] Pit Reporter configured: ${voiceId ? voiceId.slice(0, 8) + '...' : 'disabled'}`)
}

/**
 * Get the pit reporter voice ID
 */
export function getPitReporterVoiceId(): string {
  return configuredPitReporterVoiceId
}

/**
 * Check if pit reporter is enabled (has a voice ID configured)
 */
export function isPitReporterEnabled(): boolean {
  return !!configuredPitReporterVoiceId
}

// ============================================================================
// TRANSITION PHRASES
// ============================================================================

/**
 * Natural handoff phrases between commentators
 */
export const TRANSITION_PHRASES: TransitionPhrase[] = [
  // Lead to Analyst
  {
    from: 'lead',
    to: 'analyst',
    phrases: [
      "What do you make of that?",
      "Your thoughts on that move?",
      "Talk us through that.",
      "How do you see that playing out?",
      "What's the thinking there?"
    ]
  },
  // Analyst to Lead
  {
    from: 'analyst',
    to: 'lead',
    phrases: [
      "And back to the action...",
      "But we've got racing to watch!",
      "Speaking of which...",
      "And there it is!",
      ""  // Sometimes no transition needed
    ]
  },
  // Lead to Pit Reporter
  {
    from: 'lead',
    to: 'pit_reporter' as VoiceRole,
    phrases: [
      "Let's go down to the pit lane...",
      "What's the word from the pits?",
      "Down on the grid, what are you seeing?",
      "What's the atmosphere like down there?"
    ]
  },
  // Pit Reporter to Lead
  {
    from: 'pit_reporter' as VoiceRole,
    to: 'lead',
    phrases: [
      "Back to you!",
      "That's the view from here.",
      "Plenty happening down here!",
      ""  // Sometimes no transition needed
    ]
  }
]

// ============================================================================
// VOICE ROUTING
// ============================================================================

let lastVoice: VoiceRole = 'lead'
let consecutiveSameVoice = 0

/**
 * Select the appropriate voice for an event type
 */
export function selectVoiceForEvent(eventType: CommentaryEventType): VoicePersona {
  // Check if Pit Reporter handles this event (and is enabled)
  if (isPitReporterEnabled() && PIT_REPORTER.contentTypes.includes(eventType as any)) {
    return { ...PIT_REPORTER, elevenLabsVoiceId: configuredPitReporterVoiceId }
  }
  
  // Check if Lead handles this event
  if (LEAD_COMMENTATOR.contentTypes.includes(eventType)) {
    return LEAD_COMMENTATOR
  }
  
  // Check if Analyst handles this event
  if (ANALYST_COMMENTATOR.contentTypes.includes(eventType)) {
    return ANALYST_COMMENTATOR
  }
  
  // Default: use weighted rotation
  return selectVoiceWeighted()
}

/**
 * Select the appropriate voice for a content category (color commentary)
 */
export function selectVoiceForContent(category: ContentCategory): VoicePersona {
  // Check if Lead handles this category
  if (LEAD_COMMENTATOR.contentCategories.includes(category)) {
    return LEAD_COMMENTATOR
  }
  
  // Check if Analyst handles this category
  if (ANALYST_COMMENTATOR.contentCategories.includes(category)) {
    return ANALYST_COMMENTATOR
  }
  
  // Default: use weighted rotation
  return selectVoiceWeighted()
}

/**
 * Weighted voice selection based on speaking share
 * Used for content that could go to either commentator
 */
export function selectVoiceWeighted(): VoicePersona {
  // Avoid too many consecutive lines from same voice
  if (consecutiveSameVoice >= 3) {
    return lastVoice === 'lead' ? ANALYST_COMMENTATOR : LEAD_COMMENTATOR
  }
  
  // Weighted random selection
  const roll = Math.random()
  return roll < LEAD_COMMENTATOR.speakingShare ? LEAD_COMMENTATOR : ANALYST_COMMENTATOR
}

/**
 * Track which voice was just used
 */
export function recordVoiceUsed(voice: VoiceRole): void {
  if (voice === lastVoice) {
    consecutiveSameVoice++
  } else {
    consecutiveSameVoice = 1
    lastVoice = voice
  }
}

/**
 * Get a transition phrase when switching voices
 */
export function getTransitionPhrase(from: VoiceRole, to: VoiceRole): string | null {
  // No transition needed if staying with same voice
  if (from === to) return null
  
  // 40% chance of using a transition phrase
  if (Math.random() > 0.4) return null
  
  const transition = TRANSITION_PHRASES.find(t => t.from === from && t.to === to)
  if (!transition) return null
  
  const phrase = transition.phrases[Math.floor(Math.random() * transition.phrases.length)]
  return phrase || null
}

/**
 * Reset voice tracking (e.g., at race start)
 */
export function resetVoiceTracking(): void {
  lastVoice = 'lead'
  consecutiveSameVoice = 0
}

// ============================================================================
// VOICE ID MANAGEMENT
// ============================================================================

let configuredLeadVoiceId = LEAD_COMMENTATOR.elevenLabsVoiceId
let configuredAnalystVoiceId = ANALYST_COMMENTATOR.elevenLabsVoiceId

/**
 * Configure ElevenLabs voice IDs
 */
export function setVoiceIds(leadVoiceId: string, analystVoiceId: string): void {
  configuredLeadVoiceId = leadVoiceId
  configuredAnalystVoiceId = analystVoiceId
  console.log(`[Voices] Configured: Lead=${leadVoiceId.slice(0, 8)}..., Analyst=${analystVoiceId.slice(0, 8)}...`)
}

/**
 * Get the ElevenLabs voice ID for a persona
 */
export function getVoiceId(persona: VoicePersona): string {
  return persona.id === 'lead' ? configuredLeadVoiceId : configuredAnalystVoiceId
}

/**
 * Get current voice IDs
 */
export function getConfiguredVoiceIds(): { lead: string; analyst: string } {
  return {
    lead: configuredLeadVoiceId,
    analyst: configuredAnalystVoiceId
  }
}

// ============================================================================
// PROMPT HELPERS
// ============================================================================

/**
 * Get voice-specific prompt instructions
 */
export function getVoicePromptInstructions(persona: VoicePersona): string {
  if (persona.id === 'lead') {
    return `You are ${persona.name}, the LEAD commentator.
- High energy, excited delivery
- Call the action as it happens
- Use short, punchy sentences when exciting
- Build dramatic tension
- You love motorsport history and love to reference it
- Express genuine emotion when dramatic moments happen`
  } else {
    return `You are ${persona.name}, the ANALYST co-commentator.
- Calm, measured delivery
- Provide insight and analysis
- Explain strategy and driver thinking
- Use technical knowledge appropriately
- Reference statistics when relevant
- Balance analysis with entertainment`
  }
}

/**
 * Get example speaking styles for each voice
 */
export function getVoiceSpeakingExamples(persona: VoicePersona): string[] {
  if (persona.id === 'lead') {
    return [
      "AND HE'S DONE IT! What a move into turn one!",
      "The gap is coming down, coming DOWN! This could be on!",
      "Lights out and away we go!",
      "Contact! That's contact at the chicane!"
    ]
  } else {
    return [
      "The strategy there is clear - they're going long on this stint to benefit from fresher tires later.",
      "He's been consistently in the 1:24s which suggests the tires are holding up well.",
      "That's a bold move from the championship leader, who really can't afford any mistakes today.",
      "Interesting choice on compound there. Could pay dividends in the closing laps."
    ]
  }
}

