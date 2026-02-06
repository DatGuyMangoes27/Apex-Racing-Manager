/**
 * Media Duty Schedule Configuration
 * 
 * Defines the mandatory media duties that occur during race weekends,
 * including their timing, topics, and penalty multipliers.
 */

import { MediaDutyConfig, MediaDutyType, MediaDutySkipPenalty, MediaDuty, MediaDutyStatus } from '../store/careerStore'

// ============================================
// DUTY CONFIGURATIONS
// ============================================

/**
 * Complete configuration for all media duty types
 * These define the structure and timing of mandatory media activities
 */
export const MEDIA_DUTY_CONFIGS: MediaDutyConfig[] = [
  {
    type: 'pre_weekend_briefing',
    day: 4, // Thursday
    name: 'Pre-Weekend Briefing',
    description: 'Set expectations and goals for the upcoming race weekend. This is your chance to outline the team\'s strategy and build anticipation.',
    topics: ['expectations', 'strategy', 'preparation', 'goals', 'weekend_targets', 'team_morale'],
    baseFineMultiplier: 1.5,
    isPreSession: false
  },
  {
    type: 'pre_practice',
    day: 5, // Friday morning
    name: 'Pre-Practice Statement',
    description: 'Discuss initial setup plans and approach for the practice sessions. Media wants to know how you\'re preparing.',
    topics: ['setup', 'weather', 'track_conditions', 'technical', 'tire_compounds', 'data_collection'],
    baseFineMultiplier: 1.0,
    isPreSession: true,
    relatedSession: 'practice'
  },
  {
    type: 'post_practice',
    day: 5, // Friday evening
    name: 'Post-Practice Debrief',
    description: 'React to practice performance and share initial impressions. Be careful about revealing too much about your true pace.',
    topics: ['pace', 'setup_progress', 'issues', 'confidence', 'balance', 'long_run_pace', 'reliability'],
    baseFineMultiplier: 1.0,
    isPreSession: false,
    relatedSession: 'practice'
  },
  {
    type: 'pre_qualifying',
    day: 6, // Saturday morning
    name: 'Pre-Qualifying Statement',
    description: 'Outline your qualifying strategy. Will you go for a conservative approach or push for a front-row start?',
    topics: ['strategy', 'tire_strategy', 'target_position', 'weather', 'track_evolution', 'traffic_management'],
    baseFineMultiplier: 1.2,
    isPreSession: true,
    relatedSession: 'qualifying'
  },
  {
    type: 'post_qualifying',
    day: 6, // Saturday evening
    name: 'Post-Qualifying Reaction',
    description: 'React to qualifying result and grid position. This sets the narrative for race day.',
    topics: ['grid_position', 'lap_analysis', 'race_outlook', 'rivals', 'opportunities', 'concerns', 'setup_changes'],
    baseFineMultiplier: 1.2,
    isPreSession: false,
    relatedSession: 'qualifying'
  },
  {
    type: 'pre_race',
    day: 7, // Sunday morning
    name: 'Pre-Race Statement',
    description: 'Share your race strategy outlook. Be strategic - reveal enough to satisfy sponsors but not enough to help competitors.',
    topics: ['strategy', 'start_plan', 'tire_strategy', 'weather', 'rivals', 'pit_windows', 'position_targets'],
    baseFineMultiplier: 1.5,
    isPreSession: true,
    relatedSession: 'race'
  },
  {
    type: 'post_race',
    day: 7, // Sunday evening
    name: 'Post-Race Reaction',
    description: 'React to race outcome. This is the most watched media moment - handle it carefully, especially after difficult results.',
    topics: ['result', 'incidents', 'strategy_execution', 'points', 'championship', 'team_performance', 'driver_performance'],
    baseFineMultiplier: 2.0, // Highest penalty - this is the most important
    isPreSession: false,
    relatedSession: 'race'
  },
  {
    type: 'post_weekend_debrief',
    day: 1, // Monday (following week)
    name: 'Post-Weekend Debrief',
    description: 'Full weekend analysis and forward look. Time to be honest about what worked and what didn\'t.',
    topics: ['overall_analysis', 'lessons_learned', 'next_race', 'development', 'season_outlook', 'improvements_needed'],
    baseFineMultiplier: 1.5,
    isPreSession: false
  }
]

// ============================================
// DUTY HELPER FUNCTIONS
// ============================================

/**
 * Get the configuration for a specific duty type
 */
export function getDutyConfig(type: MediaDutyType): MediaDutyConfig | undefined {
  return MEDIA_DUTY_CONFIGS.find(config => config.type === type)
}

/**
 * Get all duty configs for a specific day
 */
export function getDutiesForDay(day: number): MediaDutyConfig[] {
  return MEDIA_DUTY_CONFIGS.filter(config => config.day === day)
}

/**
 * Get pre-session duties for a specific session type
 */
export function getPreSessionDuty(session: 'practice' | 'qualifying' | 'race'): MediaDutyConfig | undefined {
  return MEDIA_DUTY_CONFIGS.find(config => config.isPreSession && config.relatedSession === session)
}

/**
 * Get post-session duties for a specific session type
 */
export function getPostSessionDuty(session: 'practice' | 'qualifying' | 'race'): MediaDutyConfig | undefined {
  return MEDIA_DUTY_CONFIGS.find(config => !config.isPreSession && config.relatedSession === session)
}

/**
 * Calculate the skip penalty for a duty based on team budget and tier
 */
export function calculateSkipPenalty(
  config: MediaDutyConfig,
  teamBudget: number,
  teamTier: string
): MediaDutySkipPenalty {
  // Base fine is 0.1% of team budget
  const baseFine = Math.round(teamBudget * 0.001)
  
  // Tier affects penalty severity
  const tierMultipliers: Record<string, number> = {
    'entry': 0.5,
    'amateur': 0.75,
    'semi-pro': 1.0,
    'professional': 1.25,
    'pro': 1.5,
    'elite': 1.75,
    'pinnacle': 2.0
  }
  const tierMultiplier = tierMultipliers[teamTier] || 1.0
  
  // Calculate final fine
  const fine = Math.round(baseFine * config.baseFineMultiplier * tierMultiplier)
  
  // Higher tier teams face more scrutiny
  const baseSponsorPenalty = -5
  const baseBoardPenalty = -3
  const baseFanPenalty = -2
  const baseRepPenalty = -1
  
  return {
    fine,
    sponsorSatisfaction: Math.round(baseSponsorPenalty * tierMultiplier),
    boardMood: Math.round(baseBoardPenalty * tierMultiplier),
    fanSentiment: Math.round(baseFanPenalty * tierMultiplier),
    reputation: Math.round(baseRepPenalty * tierMultiplier)
  }
}

// ============================================
// DUTY GENERATION
// ============================================

/**
 * Generate all duties for a race weekend
 * Returns an array of MediaDuty objects ready to be added to the store
 */
export function generateWeekendDutiesData(
  trackId: string,
  trackName: string,
  seriesId: string,
  seriesName: string,
  week: number,
  year: number,
  teamBudget: number,
  teamTier: string
): MediaDuty[] {
  return MEDIA_DUTY_CONFIGS.map(config => {
    const skipPenalty = calculateSkipPenalty(config, teamBudget, teamTier)
    
    return {
      id: `duty-${week}-${year}-${config.type}`,
      type: config.type,
      week,
      year,
      day: config.day,
      trackId,
      trackName,
      seriesId,
      seriesName,
      mandatory: true,
      status: 'upcoming' as MediaDutyStatus,
      // Deadline logic: Pre-session duties must be done before session starts
      // Post-session duties can be done that day or the next morning
      deadline: config.isPreSession ? config.day : config.day + 1,
      skipPenalty
    }
  })
}

// ============================================
// DUTY CONTEXT HELPERS
// ============================================

/**
 * Topics and context suggestions for AI generation based on duty type
 */
export const DUTY_CONTEXT_PROMPTS: Record<MediaDutyType, string[]> = {
  'pre_weekend_briefing': [
    'What are your realistic goals for this weekend?',
    'Any specific areas the team has been working on?',
    'How do you rate your chances at this circuit?',
    'Any pressure from the board or sponsors this weekend?',
    'Is there a particular rival you\'re focused on?'
  ],
  'pre_practice': [
    'What setup direction are you exploring initially?',
    'Any concerns about track conditions?',
    'What data are you prioritizing in practice?',
    'How is driver confidence heading into practice?',
    'Any technical updates being tested?'
  ],
  'post_practice': [
    'How did the car feel in practice?',
    'Are you satisfied with the pace shown?',
    'Any issues that need addressing overnight?',
    'How do you compare to your main rivals?',
    'Confidence level for qualifying?'
  ],
  'pre_qualifying': [
    'What\'s your qualifying strategy?',
    'Are you going for one run or two?',
    'How important is track position at this circuit?',
    'Any concerns about traffic or timing?',
    'What grid position would you be happy with?'
  ],
  'post_qualifying': [
    'Satisfied with your grid position?',
    'Did the car perform as expected?',
    'What opportunities do you see for the race?',
    'Any changes planned overnight?',
    'How do you rate your race pace vs rivals?'
  ],
  'pre_race': [
    'What\'s your race strategy in broad terms?',
    'How important is the start?',
    'Who are your main battles likely to be with?',
    'What would be a good result today?',
    'Any weather or tire strategy considerations?'
  ],
  'post_race': [
    'Overall assessment of the race?',
    'Did strategy work as planned?',
    'Any incidents to address?',
    'Happy with the points haul?',
    'What did you learn for next time?'
  ],
  'post_weekend_debrief': [
    'How would you summarize the weekend?',
    'What worked well?',
    'What needs improvement?',
    'How does this affect your championship position?',
    'What\'s the focus before the next race?'
  ]
}

/**
 * Get relevant topics for a specific duty based on context
 */
export function getRelevantTopics(
  dutyType: MediaDutyType,
  context: {
    isRaining?: boolean
    hadIncident?: boolean
    gainedPositions?: boolean
    lostPositions?: boolean
    hadTechnicalIssue?: boolean
    rivalNearby?: boolean
    fightingForPoints?: boolean
  }
): string[] {
  const config = getDutyConfig(dutyType)
  if (!config) return []
  
  const topics = [...config.topics]
  
  // Add contextual topics
  if (context.isRaining) {
    topics.push('weather_impact', 'wet_performance', 'tire_choice')
  }
  if (context.hadIncident) {
    topics.push('incident_explanation', 'damage_assessment', 'responsibility')
  }
  if (context.gainedPositions) {
    topics.push('overtakes', 'strategy_success', 'driver_performance')
  }
  if (context.lostPositions) {
    topics.push('pace_issues', 'strategy_review', 'what_went_wrong')
  }
  if (context.hadTechnicalIssue) {
    topics.push('reliability', 'technical_explanation', 'engineering_response')
  }
  if (context.rivalNearby) {
    topics.push('rivalry', 'direct_competition', 'battle_analysis')
  }
  if (context.fightingForPoints) {
    topics.push('points_importance', 'championship_impact', 'pressure')
  }
  
  return topics
}

// ============================================
// DUTY DISPLAY HELPERS
// ============================================

/**
 * Get a human-readable name for the day number
 */
export function getDayName(day: number): string {
  const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  return days[day] || 'Unknown'
}

/**
 * Get short display info for a duty
 */
export function getDutyDisplayInfo(duty: MediaDuty): {
  name: string
  dayName: string
  timeDescription: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
} {
  const config = getDutyConfig(duty.type)
  const dayName = getDayName(duty.day)
  
  let timeDescription = dayName
  if (config?.isPreSession) {
    timeDescription = `${dayName} Morning (Pre-${config.relatedSession?.charAt(0).toUpperCase()}${config.relatedSession?.slice(1)})`
  } else if (config?.relatedSession) {
    timeDescription = `${dayName} Evening (Post-${config.relatedSession?.charAt(0).toUpperCase()}${config.relatedSession?.slice(1)})`
  }
  
  // Determine urgency based on fine multiplier
  let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low'
  if (config) {
    if (config.baseFineMultiplier >= 2.0) urgency = 'critical'
    else if (config.baseFineMultiplier >= 1.5) urgency = 'high'
    else if (config.baseFineMultiplier >= 1.2) urgency = 'medium'
  }
  
  return {
    name: config?.name || duty.type,
    dayName,
    timeDescription,
    urgency
  }
}

/**
 * Get status color for UI display
 */
export function getDutyStatusColor(status: MediaDutyStatus): string {
  switch (status) {
    case 'upcoming': return 'blue'
    case 'available': return 'yellow'
    case 'completed': return 'green'
    case 'skipped': return 'orange'
    case 'missed': return 'red'
    default: return 'gray'
  }
}

/**
 * Get status label for UI display
 */
export function getDutyStatusLabel(status: MediaDutyStatus): string {
  switch (status) {
    case 'upcoming': return 'Upcoming'
    case 'available': return 'Available Now'
    case 'completed': return 'Completed'
    case 'skipped': return 'Skipped'
    case 'missed': return 'Missed (Penalty Applied)'
    default: return 'Unknown'
  }
}
