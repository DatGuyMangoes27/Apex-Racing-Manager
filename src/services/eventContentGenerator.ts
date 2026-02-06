/**
 * Event Content Generator Service
 * 
 * Generates contextual AI-powered content for event gameplay scenarios
 * using the Gemini API and rich game state context.
 */

import { useCareerStore, ScheduledActivity, ActivityCategory } from '@/store/careerStore'

// ============================================
// CONTEXT INTERFACES
// ============================================

export interface EventContext {
  // Team Performance
  lastRacePosition?: number
  lastRaceTrack?: string
  championshipPosition?: number
  pointsToLeader?: number
  recentResults: {
    position: number
    track: string
    incidents?: string
    notes?: string
  }[]
  
  // Financial
  currentBudget: number
  burnRate: number
  profitLoss: string
  cashReserves: number
  
  // Relationships
  sponsorSatisfactions: {
    name: string
    tier: string
    satisfaction: number
    contractValue: number
  }[]
  boardMood: number
  teamMorale: number
  driverMorale?: number
  
  // Activity Specific
  activityType: ActivityCategory
  activityName: string
  attendees: string[]
  venue?: string
  
  // Team Info
  teamName: string
  teamReputation: number
  seriesName?: string
  seriesTier?: string
  
  // Driver info (if applicable)
  driverName?: string
  driverRating?: number
  
  // Timestamp
  currentWeek: number
  currentYear: number
}

export interface EventScenario {
  id: string
  title: string
  description: string
  rounds: EventRound[]
  totalRounds: number
  currentRound: number
  status: 'pending' | 'in_progress' | 'completed'
  outcomes: EventOutcome[]
}

export interface EventRound {
  roundNumber: number
  situation: string
  question: string
  speakerName?: string
  speakerRole?: string
  choices: EventChoice[]
  selectedChoiceId?: string
  outcome?: string
}

export interface EventChoice {
  id: string
  text: string
  tone: 'diplomatic' | 'bold' | 'cautious' | 'aggressive' | 'friendly' | 'professional'
  effects: {
    boardMood?: number
    teamMorale?: number
    sponsorSatisfaction?: number
    reputation?: number
    driverMorale?: number
    budgetImpact?: number
  }
  followUp?: string  // Sets up next round's situation
}

export interface EventOutcome {
  category: string
  value: number
  description: string
}

// ============================================
// CONTEXT BUILDER
// ============================================

/**
 * Build rich context data from the current career state
 */
export function buildEventContext(activity: ScheduledActivity): EventContext {
  const state = useCareerStore.getState()
  const { careerState, player } = state
  
  if (!careerState || !player) {
    throw new Error('Career state not available')
  }
  
  const ownedTeam = careerState.ownedTeam
  
  // Get recent race results from activity history or race weekend progress
  const recentResults: EventContext['recentResults'] = []
  
  // Calculate sponsor satisfactions
  const sponsorSatisfactions: EventContext['sponsorSatisfactions'] = []
  if (ownedTeam?.finances?.sponsors) {
    ownedTeam.finances.sponsors.forEach((sponsor: any) => {
      sponsorSatisfactions.push({
        name: sponsor.sponsorName || sponsor.name || 'Unknown',
        tier: sponsor.tier || 'minor',
        satisfaction: sponsor.satisfaction || 75,
        contractValue: sponsor.monthlyPayment || sponsor.contractValue || 0
      })
    })
  }
  
  // Calculate financials
  const cash = ownedTeam?.budgets?.cash ?? player.finances.bankBalance ?? 0
  // Calculate monthly income/expenses from finances if available
  const monthlyIncome = ownedTeam?.budgets?.yearToDateIncome ? 
    (ownedTeam.budgets.yearToDateIncome / Math.max(1, careerState.currentWeek / 4.33)) : 0
  const monthlyExpenses = ownedTeam?.budgets?.yearToDateExpenses ? 
    (ownedTeam.budgets.yearToDateExpenses / Math.max(1, careerState.currentWeek / 4.33)) : 0
  const burnRate = monthlyExpenses - monthlyIncome
  
  // Get last race position from race history
  const lastRace = player.raceHistory && player.raceHistory.length > 0 
    ? player.raceHistory[player.raceHistory.length - 1] 
    : null
  
  return {
    // Team Performance (placeholder - would come from race results)
    lastRacePosition: lastRace?.racePosition,
    lastRaceTrack: careerState.nextRaceTrack || lastRace?.trackName,
    championshipPosition: 0, // Would need to calculate from standings
    pointsToLeader: 0, // Would calculate from standings
    recentResults,
    
    // Financial
    currentBudget: cash,
    burnRate,
    profitLoss: burnRate < 0 ? 'profit' : burnRate > 0 ? 'loss' : 'break-even',
    cashReserves: cash,
    
    // Relationships
    sponsorSatisfactions,
    boardMood: ownedTeam?.boardMood ?? 75,
    teamMorale: ownedTeam?.teamMorale ?? 70,
    driverMorale: player.mentalState?.confidence ?? 75,
    
    // Activity Specific
    activityType: activity.category,
    activityName: activity.name,
    attendees: buildAttendeeList(activity),
    venue: activity.configuration?.venueName,
    
    // Team Info
    teamName: ownedTeam?.name ?? 'My Racing Team',
    teamReputation: ownedTeam?.reputation ?? player.reputation ?? 50,
    seriesName: careerState.seriesEntries?.[0]?.seriesName,
    seriesTier: undefined, // Not available in TeamSeriesEntry
    
    // Driver info
    driverName: `${player.firstName} ${player.lastName}`,
    driverRating: 70, // Would need to calculate from stats
    
    // Timestamp
    currentWeek: careerState.currentWeek,
    currentYear: careerState.currentYear
  }
}

/**
 * Build list of attendees based on activity configuration
 */
function buildAttendeeList(activity: ScheduledActivity): string[] {
  const attendees: string[] = []
  
  // Add team owner
  attendees.push('Team Owner (You)')
  
  // Add driver if required
  if (activity.requiresDriver) {
    attendees.push('Primary Driver')
  }
  
  // Add sponsor reps if present
  if (activity.configuration?.guests?.sponsorReps?.length) {
    activity.configuration.guests.sponsorReps.forEach(rep => {
      attendees.push(`${rep.sponsorName} Representatives (${rep.count})`)
    })
  }
  
  // Add staff based on activity type
  switch (activity.category) {
    case 'team':
      attendees.push('Chief Engineer')
      attendees.push('Team Manager')
      break
    case 'sponsor':
      attendees.push('Commercial Director')
      break
    case 'media':
      attendees.push('PR Manager')
      break
    case 'development':
      attendees.push('Technical Director')
      attendees.push('Chief Engineer')
      break
    case 'maintenance':
      attendees.push('Chief Mechanic')
      break
  }
  
  return attendees
}

// ============================================
// PROMPT TEMPLATES
// ============================================

const PROMPT_TEMPLATES: Record<string, (context: EventContext) => string> = {
  // Race Debrief
  'race_debrief': (ctx) => `
You are generating a race debrief scenario for a motorsport management game.

CONTEXT:
- Team: ${ctx.teamName}
- Series: ${ctx.seriesName || 'Unknown Series'} (${ctx.seriesTier || 'Unknown'} tier)
- Last Race: P${ctx.lastRacePosition || '?'} at ${ctx.lastRaceTrack || 'Unknown Track'}
- Championship Position: ${ctx.championshipPosition || '?'}
- Team Morale: ${ctx.teamMorale}/100
- Attendees: ${ctx.attendees.join(', ')}

Generate a race debrief scenario with 3-4 rounds of questions/discussions.

Each round should include:
1. A situation setup (what's being discussed)
2. A question or point raised by a team member (include their name/role)
3. 3-4 response options with different tones (diplomatic, bold, cautious, professional)
4. Each response should have clear effects on teamMorale, boardMood, or reputation (-5 to +5 range)

Topics to cover:
- Strategy decisions made during the race
- Driver performance analysis
- Car setup and technical issues
- Plans for improvement
- Next race preparation

Return as JSON with this structure:
{
  "title": "Race Debrief - [Track Name]",
  "description": "Post-race analysis session",
  "rounds": [
    {
      "roundNumber": 1,
      "situation": "...",
      "speakerName": "John Smith",
      "speakerRole": "Chief Engineer",
      "question": "...",
      "choices": [
        {"id": "1a", "text": "...", "tone": "diplomatic", "effects": {"teamMorale": 2}},
        ...
      ]
    }
  ]
}
`,

  // Board Meeting
  'board_meeting': (ctx) => `
You are generating a board meeting scenario for a motorsport management game.

CONTEXT:
- Team: ${ctx.teamName}
- Budget: $${ctx.currentBudget.toLocaleString()}
- Monthly Burn Rate: ${ctx.burnRate > 0 ? '-' : '+'}$${Math.abs(ctx.burnRate).toLocaleString()}
- Financial Status: ${ctx.profitLoss}
- Championship Position: ${ctx.championshipPosition || 'N/A'}
- Team Morale: ${ctx.teamMorale}/100
- Board Mood: ${ctx.boardMood}/100

Generate a board meeting scenario with 3-4 rounds of tough questions from board members.

Topics should include:
- Budget allocation and spending
- Performance expectations vs reality
- Strategic direction questions
- Investment priorities
- Long-term planning

Each response should primarily affect boardMood (-5 to +10 range).
Include at least one question about finances and one about competitive performance.

Return as JSON matching the race_debrief structure.
`,

  // Sponsor Meeting
  'sponsor_meeting': (ctx) => {
    const mainSponsor = ctx.sponsorSatisfactions[0]
    return `
You are generating a sponsor meeting scenario for a motorsport management game.

CONTEXT:
- Team: ${ctx.teamName}
- Sponsor: ${mainSponsor?.name || 'Primary Sponsor'}
- Sponsor Satisfaction: ${mainSponsor?.satisfaction || 75}/100
- Contract Value: $${(mainSponsor?.contractValue || 100000).toLocaleString()}
- Championship Position: ${ctx.championshipPosition || 'N/A'}
- Recent Performance: ${ctx.recentResults.length > 0 ? ctx.recentResults.map(r => `P${r.position}`).join(', ') : 'Mixed results'}

Generate a sponsor meeting scenario with 3-4 rounds.

Topics should include:
- Brand visibility and exposure concerns
- Performance expectations and disappointments
- Contract terms and renewal discussions
- Competing sponsor opportunities
- Activation ideas and requests

Each response should primarily affect sponsorSatisfaction (-10 to +10 range).
The sponsor should be ${mainSponsor && mainSponsor.satisfaction < 60 ? 'concerned and questioning the partnership' : mainSponsor && mainSponsor.satisfaction > 80 ? 'happy but looking for more value' : 'neutral but watchful'}.

Return as JSON matching the race_debrief structure.
`
  },

  // Team Meeting
  'team_meeting': (ctx) => `
You are generating a team meeting scenario for a motorsport management game.

CONTEXT:
- Team: ${ctx.teamName}
- Team Morale: ${ctx.teamMorale}/100
- Budget: $${ctx.currentBudget.toLocaleString()}
- Championship Position: ${ctx.championshipPosition || 'N/A'}
- Driver Rating: ${ctx.driverRating || 70}

Generate an internal team meeting with 3-4 rounds of discussions.

Topics should include:
- Staff concerns and suggestions
- Technical development priorities  
- Resource allocation
- Team dynamics and morale
- Upcoming challenges

Mix positive and negative discussions based on current morale level.
Responses should affect teamMorale and potentially reputation or budgetImpact.

Return as JSON matching the race_debrief structure.
`,

  // Financial Review
  'financial_review': (ctx) => `
You are generating a financial review meeting for a motorsport management game.

CONTEXT:
- Team: ${ctx.teamName}
- Current Cash: $${ctx.currentBudget.toLocaleString()}
- Monthly Burn Rate: ${ctx.burnRate > 0 ? '-' : '+'}$${Math.abs(ctx.burnRate).toLocaleString()}
- Status: ${ctx.profitLoss === 'loss' ? 'LOSING MONEY' : ctx.profitLoss === 'profit' ? 'Profitable' : 'Breaking Even'}
- Sponsor Income: ${ctx.sponsorSatisfactions.reduce((sum, s) => sum + s.contractValue, 0).toLocaleString()}
- Board Mood: ${ctx.boardMood}/100

Generate a quarterly financial review with 3 rounds.

Topics:
- Budget allocation questions
- Cost-cutting discussions
- Revenue generation ideas
- Investment decisions

Responses should affect boardMood and potentially budgetImpact.
If financial situation is dire, questions should be more aggressive.

Return as JSON matching the race_debrief structure.
`,

  // Media Event / Press Conference
  'media_event': (ctx) => `
You are generating a media/press event scenario for a motorsport management game.

CONTEXT:
- Team: ${ctx.teamName}
- Reputation: ${ctx.teamReputation}/100
- Championship Position: ${ctx.championshipPosition || 'N/A'}
- Last Race: P${ctx.lastRacePosition || '?'}
- Team Morale: ${ctx.teamMorale}/100

Generate a press conference/media event with 3-4 rounds of journalist questions.

Topics should include:
- Recent performance analysis
- Future expectations
- Team announcements
- Driver questions
- Controversial or probing questions

Responses should affect reputation and potentially fanSentiment.
Include at least one difficult/controversial question.

Return as JSON matching the race_debrief structure.
`
}

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

/**
 * Generate event scenario using Gemini API
 */
export async function generateEventScenario(
  activity: ScheduledActivity,
  apiKey?: string
): Promise<EventScenario | null> {
  const context = buildEventContext(activity)
  
  // Determine which prompt template to use
  const templateKey = getPromptTemplateKey(activity)
  const promptBuilder = PROMPT_TEMPLATES[templateKey]
  
  if (!promptBuilder) {
    console.warn(`[EventGenerator] No prompt template for: ${templateKey}`)
    return generateFallbackScenario(activity, context)
  }
  
  const prompt = promptBuilder(context)
  
  // Try to use Gemini API if key is available
  const key = apiKey || getStoredApiKey()
  
  if (key) {
    try {
      const response = await callGeminiApi(key, prompt)
      if (response) {
        return parseGeminiResponse(response, activity, context)
      }
    } catch (error) {
      console.error('[EventGenerator] Gemini API error:', error)
    }
  }
  
  // Fallback to template-based generation
  return generateFallbackScenario(activity, context)
}

/**
 * Get the appropriate prompt template key for an activity
 */
function getPromptTemplateKey(activity: ScheduledActivity): string {
  // Check for specific activity types first
  const templateId = activity.templateId.toLowerCase()
  
  if (templateId.includes('debrief') || templateId.includes('race_debrief')) {
    return 'race_debrief'
  }
  if (templateId.includes('board')) {
    return 'board_meeting'
  }
  if (templateId.includes('sponsor') || templateId.includes('sponsor_meeting')) {
    return 'sponsor_meeting'
  }
  if (templateId.includes('financial') || templateId.includes('review')) {
    return 'financial_review'
  }
  if (templateId.includes('media') || templateId.includes('press')) {
    return 'media_event'
  }
  if (templateId.includes('team') || activity.category === 'team') {
    return 'team_meeting'
  }
  
  // Default based on category
  const category = activity.category
  switch (category) {
    case 'sponsor': return 'sponsor_meeting'
    case 'media': return 'media_event'
    case 'development': return 'team_meeting'
    case 'personal': return 'team_meeting'
    case 'race': return 'race_debrief'
    case 'maintenance': return 'team_meeting'
    case 'lifestyle': return 'team_meeting'
    default: return 'team_meeting'
  }
}

/**
 * Get stored Gemini API key from settings
 */
function getStoredApiKey(): string | null {
  try {
    // Try localStorage first
    const settings = localStorage.getItem('game-settings')
    if (settings) {
      const parsed = JSON.parse(settings)
      return parsed.geminiApiKey || null
    }
  } catch (e) {
    console.warn('[EventGenerator] Could not read API key from storage')
  }
  return null
}

/**
 * Call Gemini API with prompt
 */
async function callGeminiApi(apiKey: string, prompt: string): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2000,
          responseMimeType: 'application/json'
        }
      })
    })
    
    if (!response.ok) {
      console.error('[EventGenerator] Gemini API error:', response.status)
      return null
    }
    
    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    return content || null
  } catch (error) {
    console.error('[EventGenerator] Gemini API call failed:', error)
    return null
  }
}

/**
 * Parse Gemini response into EventScenario
 */
function parseGeminiResponse(
  response: string, 
  activity: ScheduledActivity,
  _context: EventContext
): EventScenario | null {
  try {
    const parsed = JSON.parse(response)
    
    return {
      id: `scenario_${Date.now()}`,
      title: parsed.title || activity.name,
      description: parsed.description || activity.description,
      rounds: (parsed.rounds || []).map((round: any, idx: number) => ({
        roundNumber: round.roundNumber || idx + 1,
        situation: round.situation || '',
        question: round.question || '',
        speakerName: round.speakerName,
        speakerRole: round.speakerRole,
        choices: (round.choices || []).map((choice: any, cIdx: number) => ({
          id: choice.id || `${idx}_${cIdx}`,
          text: choice.text || '',
          tone: choice.tone || 'professional',
          effects: choice.effects || {}
        }))
      })),
      totalRounds: parsed.rounds?.length || 0,
      currentRound: 0,
      status: 'pending',
      outcomes: []
    }
  } catch (error) {
    console.error('[EventGenerator] Failed to parse Gemini response:', error)
    return null
  }
}

// ============================================
// FALLBACK GENERATION
// ============================================

/**
 * Generate a fallback scenario using templates when API is unavailable
 */
function generateFallbackScenario(
  activity: ScheduledActivity,
  context: EventContext
): EventScenario {
  const templateKey = getPromptTemplateKey(activity)
  
  // Get appropriate fallback template
  const template = FALLBACK_SCENARIOS[templateKey] || FALLBACK_SCENARIOS['team_meeting']
  
  // Customize template with context
  const customizedRounds = template.rounds.map(round => ({
    ...round,
    situation: round.situation
      .replace('{teamName}', context.teamName)
      .replace('{championshipPosition}', String(context.championshipPosition || '?'))
      .replace('{teamMorale}', String(context.teamMorale))
      .replace('{budget}', `$${context.currentBudget.toLocaleString()}`),
    question: round.question
      .replace('{teamName}', context.teamName)
  }))
  
  return {
    id: `fallback_${Date.now()}`,
    title: template.title.replace('{activityName}', activity.name),
    description: template.description,
    rounds: customizedRounds,
    totalRounds: customizedRounds.length,
    currentRound: 0,
    status: 'pending',
    outcomes: []
  }
}

// Fallback scenario templates
const FALLBACK_SCENARIOS: Record<string, Omit<EventScenario, 'id' | 'status' | 'outcomes'>> = {
  'race_debrief': {
    title: 'Race Debrief - {activityName}',
    description: 'Post-race team analysis and discussion',
    totalRounds: 3,
    currentRound: 0,
    rounds: [
      {
        roundNumber: 1,
        situation: 'The team has gathered in the debriefing room. The chief engineer pulls up the telemetry data on the main screen.',
        speakerName: 'Chief Engineer',
        speakerRole: 'Technical Lead',
        question: 'Looking at the data, our pace in the middle stint dropped off significantly. How do you want us to address tire management going forward?',
        choices: [
          { id: '1a', text: 'We need to be more conservative from the start. Prioritize tire life over raw pace.', tone: 'cautious', effects: { teamMorale: 2, boardMood: 1 } },
          { id: '1b', text: 'Push harder early and plan for more stops. We can make up time in pit strategy.', tone: 'bold', effects: { teamMorale: 1, reputation: 1, boardMood: -1 } },
          { id: '1c', text: 'Let\'s analyze the data more carefully before jumping to conclusions. What do the numbers say?', tone: 'diplomatic', effects: { teamMorale: 3 } },
          { id: '1d', text: 'This is unacceptable. I want a full report on what went wrong by tomorrow morning.', tone: 'aggressive', effects: { teamMorale: -2, boardMood: 2 } }
        ]
      },
      {
        roundNumber: 2,
        situation: 'The strategist shifts the discussion to race strategy decisions.',
        speakerName: 'Race Strategist',
        speakerRole: 'Strategy Department',
        question: 'There was a moment where we could have undercut the car ahead. We hesitated. Should we be more aggressive with strategy calls?',
        choices: [
          { id: '2a', text: 'Yes, we need to be bolder. Fortune favors the brave in racing.', tone: 'bold', effects: { teamMorale: 2, reputation: 1 } },
          { id: '2b', text: 'The call was correct at the time. Let\'s not second-guess with hindsight.', tone: 'diplomatic', effects: { teamMorale: 1, boardMood: 1 } },
          { id: '2c', text: 'We need better real-time data to make these calls. What can we improve?', tone: 'professional', effects: { teamMorale: 2, boardMood: 1 } },
          { id: '2d', text: 'Hesitation cost us positions. I expect better next time.', tone: 'aggressive', effects: { teamMorale: -1, boardMood: 2 } }
        ]
      },
      {
        roundNumber: 3,
        situation: 'The meeting turns to preparation for the next race.',
        speakerName: 'Team Manager',
        speakerRole: 'Operations',
        question: 'Looking ahead, what should be our focus for the next race? We have limited resources to allocate.',
        choices: [
          { id: '3a', text: 'Focus on reliability. We need to finish races before we can win them.', tone: 'cautious', effects: { teamMorale: 1, boardMood: 2 } },
          { id: '3b', text: 'Performance upgrades. We need more pace to compete at the front.', tone: 'bold', effects: { teamMorale: 2, boardMood: -1, budgetImpact: -5000 } },
          { id: '3c', text: 'Balance both. Let\'s be smart about where we invest our time.', tone: 'diplomatic', effects: { teamMorale: 2, boardMood: 1 } },
          { id: '3d', text: 'Whatever gets us results. I trust the technical team to decide.', tone: 'professional', effects: { teamMorale: 3 } }
        ]
      }
    ]
  },
  
  'board_meeting': {
    title: 'Board Meeting - {activityName}',
    description: 'Quarterly review with the board of directors',
    totalRounds: 3,
    currentRound: 0,
    rounds: [
      {
        roundNumber: 1,
        situation: 'The board members have assembled. The chairman opens with financial concerns.',
        speakerName: 'Board Chairman',
        speakerRole: 'Chairman',
        question: 'Our current budget shows we\'re spending at {budget}. The board needs assurance we\'re managing resources effectively. How do you respond?',
        choices: [
          { id: '1a', text: 'Every dollar is accounted for. I can walk you through our strategic allocations.', tone: 'professional', effects: { boardMood: 3 } },
          { id: '1b', text: 'Racing is expensive. These investments are necessary to stay competitive.', tone: 'bold', effects: { boardMood: -1, reputation: 1 } },
          { id: '1c', text: 'I understand the concern. Let me present our cost-reduction initiatives.', tone: 'diplomatic', effects: { boardMood: 4 } },
          { id: '1d', text: 'The finances are under control. Let\'s focus on the bigger picture.', tone: 'cautious', effects: { boardMood: 1 } }
        ]
      },
      {
        roundNumber: 2,
        situation: 'A board member raises questions about competitive performance.',
        speakerName: 'Board Member',
        speakerRole: 'Director',
        question: 'We\'re currently P{championshipPosition} in the championship. The board expected better. What\'s your plan to improve?',
        choices: [
          { id: '2a', text: 'We have clear development targets. I\'m confident we\'ll see improvement in the coming races.', tone: 'diplomatic', effects: { boardMood: 2 } },
          { id: '2b', text: 'Rome wasn\'t built in a day. We\'re building something sustainable here.', tone: 'bold', effects: { boardMood: -2, teamMorale: 2 } },
          { id: '2c', text: 'I share your frustration. Here\'s what we\'re changing immediately...', tone: 'professional', effects: { boardMood: 3, teamMorale: -1 } },
          { id: '2d', text: 'The team is working hard. We need patience and continued support.', tone: 'cautious', effects: { boardMood: 1, teamMorale: 2 } }
        ]
      },
      {
        roundNumber: 3,
        situation: 'The board wants to discuss future strategic direction.',
        speakerName: 'Board Chairman',
        speakerRole: 'Chairman',
        question: 'Looking at the next 6-12 months, where should our strategic focus be?',
        choices: [
          { id: '3a', text: 'Consolidation. Strengthen what we have before expanding ambitions.', tone: 'cautious', effects: { boardMood: 3, reputation: -1 } },
          { id: '3b', text: 'Growth. This is the time to be aggressive and capture market opportunities.', tone: 'bold', effects: { boardMood: 1, reputation: 2 } },
          { id: '3c', text: 'Balanced approach. Maintain stability while pursuing targeted improvements.', tone: 'diplomatic', effects: { boardMood: 4 } },
          { id: '3d', text: 'Let me prepare a detailed strategic proposal for the board to review.', tone: 'professional', effects: { boardMood: 2, teamMorale: 1 } }
        ]
      }
    ]
  },
  
  'sponsor_meeting': {
    title: 'Sponsor Meeting - {activityName}',
    description: 'Partnership review with key sponsor',
    totalRounds: 3,
    currentRound: 0,
    rounds: [
      {
        roundNumber: 1,
        situation: 'Your primary sponsor\'s marketing director has arrived with their team for a quarterly review.',
        speakerName: 'Marketing Director',
        speakerRole: 'Sponsor Representative',
        question: 'Our brand visibility metrics have been... mixed. We need to see better ROI from this partnership. What can you offer?',
        choices: [
          { id: '1a', text: 'I understand completely. Let me show you our enhanced activation plans.', tone: 'diplomatic', effects: { sponsorSatisfaction: 3 } },
          { id: '1b', text: 'Our on-track performance drives brand awareness that money can\'t buy.', tone: 'bold', effects: { sponsorSatisfaction: 1, reputation: 1 } },
          { id: '1c', text: 'We\'re committed to delivering value. What specific metrics matter most to you?', tone: 'professional', effects: { sponsorSatisfaction: 4 } },
          { id: '1d', text: 'We\'ve been delivering as contracted. Perhaps we should review expectations.', tone: 'cautious', effects: { sponsorSatisfaction: -1, boardMood: 1 } }
        ]
      },
      {
        roundNumber: 2,
        situation: 'The conversation turns to contract terms and future commitment.',
        speakerName: 'Marketing Director',
        speakerRole: 'Sponsor Representative',
        question: 'We\'ve received approaches from competitor teams. What makes continuing with {teamName} the right choice?',
        choices: [
          { id: '2a', text: 'We offer something unique - a genuine partnership, not just logo placement.', tone: 'diplomatic', effects: { sponsorSatisfaction: 3 } },
          { id: '2b', text: 'Our trajectory is upward. Get on board now before we become expensive.', tone: 'bold', effects: { sponsorSatisfaction: 1, reputation: 2 } },
          { id: '2c', text: 'I\'d hate to see you go. What would it take to strengthen our partnership?', tone: 'friendly', effects: { sponsorSatisfaction: 4, boardMood: -1 } },
          { id: '2d', text: 'We\'ve built something together. Stability has value in this sport.', tone: 'cautious', effects: { sponsorSatisfaction: 2 } }
        ]
      },
      {
        roundNumber: 3,
        situation: 'The sponsor brings up ideas for additional activations.',
        speakerName: 'Marketing Director',
        speakerRole: 'Sponsor Representative',
        question: 'We\'d like to do a factory tour event with some key clients. Can you accommodate this?',
        choices: [
          { id: '3a', text: 'Absolutely! We\'d be delighted to host your VIP clients.', tone: 'friendly', effects: { sponsorSatisfaction: 4, teamMorale: -1 } },
          { id: '3b', text: 'We can arrange something, but it will need to work around our race schedule.', tone: 'professional', effects: { sponsorSatisfaction: 2 } },
          { id: '3c', text: 'That\'s a great idea. Let\'s discuss how to make it a premium experience.', tone: 'diplomatic', effects: { sponsorSatisfaction: 3, reputation: 1 } },
          { id: '3d', text: 'Factory access is sensitive. We\'ll need to discuss terms separately.', tone: 'cautious', effects: { sponsorSatisfaction: 0, boardMood: 2 } }
        ]
      }
    ]
  },
  
  'team_meeting': {
    title: 'Team Meeting - {activityName}',
    description: 'Internal team discussion and planning',
    totalRounds: 3,
    currentRound: 0,
    rounds: [
      {
        roundNumber: 1,
        situation: 'The team has assembled for the weekly meeting. There\'s been some tension in the department.',
        speakerName: 'Chief Engineer',
        speakerRole: 'Engineering Lead',
        question: 'We\'re stretched thin trying to meet development targets. The team is feeling the pressure. What\'s your guidance?',
        choices: [
          { id: '1a', text: 'I hear you. Let\'s prioritize and focus on what matters most.', tone: 'diplomatic', effects: { teamMorale: 3 } },
          { id: '1b', text: 'This is racing. Pressure is part of the job. We push through.', tone: 'bold', effects: { teamMorale: -1, boardMood: 2 } },
          { id: '1c', text: 'I\'ll see if we can bring in additional resources to help.', tone: 'friendly', effects: { teamMorale: 4, budgetImpact: -10000 } },
          { id: '1d', text: 'Let\'s review the timeline. Maybe some targets need adjustment.', tone: 'cautious', effects: { teamMorale: 2, boardMood: -1 } }
        ]
      },
      {
        roundNumber: 2,
        situation: 'A staff member raises concerns about communication between departments.',
        speakerName: 'Operations Manager',
        speakerRole: 'Operations',
        question: 'There\'s been friction between engineering and operations. Information isn\'t flowing properly. How should we address this?',
        choices: [
          { id: '2a', text: 'Let\'s set up cross-department syncs to improve communication.', tone: 'professional', effects: { teamMorale: 3 } },
          { id: '2b', text: 'We\'re all on the same team here. Let\'s put personal issues aside.', tone: 'bold', effects: { teamMorale: 1 } },
          { id: '2c', text: 'I\'ll meet with both department heads to understand the issues.', tone: 'diplomatic', effects: { teamMorale: 2 } },
          { id: '2d', text: 'Professional conduct is expected. I\'ll address any problematic behavior directly.', tone: 'aggressive', effects: { teamMorale: -2, boardMood: 3 } }
        ]
      },
      {
        roundNumber: 3,
        situation: 'The meeting concludes with discussion of upcoming challenges.',
        speakerName: 'Team Manager',
        speakerRole: 'Management',
        question: 'Any final thoughts on how we can improve as a team going forward?',
        choices: [
          { id: '3a', text: 'I\'m proud of what we\'ve achieved. Let\'s keep the momentum going.', tone: 'friendly', effects: { teamMorale: 4 } },
          { id: '3b', text: 'We have areas to improve. Let\'s be honest with ourselves and get better.', tone: 'professional', effects: { teamMorale: 2, boardMood: 2 } },
          { id: '3c', text: 'Success comes from details. Everyone needs to do their job perfectly.', tone: 'bold', effects: { teamMorale: 1, boardMood: 1 } },
          { id: '3d', text: 'We\'re a team. We win together, we lose together. That\'s our strength.', tone: 'diplomatic', effects: { teamMorale: 5 } }
        ]
      }
    ]
  },
  
  'financial_review': {
    title: 'Financial Review - {activityName}',
    description: 'Monthly financial status review',
    totalRounds: 3,
    currentRound: 0,
    rounds: [
      {
        roundNumber: 1,
        situation: 'The finance team presents the current budget status.',
        speakerName: 'Financial Controller',
        speakerRole: 'Finance',
        question: 'We\'re currently at {budget} in reserves. At current burn rate, we need to make decisions about upcoming expenditure.',
        choices: [
          { id: '1a', text: 'Let\'s review each line item and identify savings opportunities.', tone: 'professional', effects: { boardMood: 4 } },
          { id: '1b', text: 'Investment now pays dividends later. We shouldn\'t cut corners.', tone: 'bold', effects: { boardMood: -1, teamMorale: 2 } },
          { id: '1c', text: 'I\'ll work with sponsors to accelerate payment schedules.', tone: 'diplomatic', effects: { boardMood: 2, sponsorSatisfaction: -1 } },
          { id: '1d', text: 'What are the non-negotiable costs vs. discretionary spending?', tone: 'cautious', effects: { boardMood: 3 } }
        ]
      },
      {
        roundNumber: 2,
        situation: 'Revenue opportunities are discussed.',
        speakerName: 'Commercial Director',
        speakerRole: 'Commercial',
        question: 'We have potential new sponsorship leads, but closing them requires investment in hospitality. Should we proceed?',
        choices: [
          { id: '2a', text: 'Yes, you have to spend money to make money. Go ahead.', tone: 'bold', effects: { boardMood: 1, budgetImpact: -15000 } },
          { id: '2b', text: 'What\'s the expected ROI? I need to see the numbers first.', tone: 'professional', effects: { boardMood: 3 } },
          { id: '2c', text: 'Let\'s start small and scale up if we see traction.', tone: 'cautious', effects: { boardMood: 2 } },
          { id: '2d', text: 'Can we do it more cost-effectively? Virtual presentations perhaps?', tone: 'diplomatic', effects: { boardMood: 2, teamMorale: 1 } }
        ]
      },
      {
        roundNumber: 3,
        situation: 'Final decisions need to be made about the upcoming period.',
        speakerName: 'Financial Controller',
        speakerRole: 'Finance',
        question: 'What should be our financial priority for the next month?',
        choices: [
          { id: '3a', text: 'Preserve cash. Build reserves for unexpected challenges.', tone: 'cautious', effects: { boardMood: 4, teamMorale: -1 } },
          { id: '3b', text: 'Invest in performance. We need results to attract sponsors.', tone: 'bold', effects: { boardMood: 0, teamMorale: 2, reputation: 1 } },
          { id: '3c', text: 'Balance both. Smart spending on high-value opportunities.', tone: 'diplomatic', effects: { boardMood: 3, teamMorale: 1 } },
          { id: '3d', text: 'Focus on revenue generation. More income solves all problems.', tone: 'professional', effects: { boardMood: 2, sponsorSatisfaction: -1 } }
        ]
      }
    ]
  },
  
  'media_event': {
    title: 'Press Conference - {activityName}',
    description: 'Media interaction and press questions',
    totalRounds: 3,
    currentRound: 0,
    rounds: [
      {
        roundNumber: 1,
        situation: 'Journalists have gathered for the press conference. The first question comes quickly.',
        speakerName: 'Sports Reporter',
        speakerRole: 'Press',
        question: 'The team\'s recent results haven\'t met expectations. Are you concerned about the direction things are heading?',
        choices: [
          { id: '1a', text: 'We\'re working hard and improvements are coming. Stay tuned.', tone: 'diplomatic', effects: { reputation: 2 } },
          { id: '1b', text: 'Racing has ups and downs. We\'re focused on the long game.', tone: 'professional', effects: { reputation: 1, teamMorale: 1 } },
          { id: '1c', text: 'We\'re not satisfied, but we know what we need to do to turn it around.', tone: 'bold', effects: { reputation: 2, boardMood: 1 } },
          { id: '1d', text: 'I\'d rather not speculate. Let\'s let the results speak for themselves.', tone: 'cautious', effects: { reputation: 0 } }
        ]
      },
      {
        roundNumber: 2,
        situation: 'A journalist probes about internal team dynamics.',
        speakerName: 'Motorsport Journalist',
        speakerRole: 'Media',
        question: 'There are rumors of tension within the team. Can you comment on team morale?',
        choices: [
          { id: '2a', text: 'Every team has challenges. We work through them professionally.', tone: 'diplomatic', effects: { reputation: 2, teamMorale: 1 } },
          { id: '2b', text: 'I don\'t comment on rumors. Next question please.', tone: 'cautious', effects: { reputation: 0 } },
          { id: '2c', text: 'The team is unified and motivated. Don\'t believe everything you read.', tone: 'bold', effects: { reputation: 1, teamMorale: 2 } },
          { id: '2d', text: 'We have a strong culture. Any differences make us stronger.', tone: 'professional', effects: { reputation: 2 } }
        ]
      },
      {
        roundNumber: 3,
        situation: 'The final question touches on future plans.',
        speakerName: 'Industry Analyst',
        speakerRole: 'Press',
        question: 'What can fans expect from {teamName} in the coming season?',
        choices: [
          { id: '3a', text: 'Exciting things are in development. We\'re building something special.', tone: 'bold', effects: { reputation: 3, boardMood: 1 } },
          { id: '3b', text: 'Consistent improvement. We\'re taking it one step at a time.', tone: 'cautious', effects: { reputation: 1 } },
          { id: '3c', text: 'We have ambitious goals and a clear plan to achieve them.', tone: 'professional', effects: { reputation: 2, boardMood: 1 } },
          { id: '3d', text: 'Great racing! That\'s what we\'re all here for, isn\'t it?', tone: 'friendly', effects: { reputation: 2, teamMorale: 1 } }
        ]
      }
    ]
  }
}

// Types are already exported above, no need to re-export
