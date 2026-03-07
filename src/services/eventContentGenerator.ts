/**
 * Event Content Generator Service
 * 
 * Generates contextual AI-powered content for event gameplay scenarios
 * using the Gemini API and rich game state context.
 */

import { useCareerStore, ScheduledActivity, ActivityCategory } from '@/store/careerStore'
import { STAFF_ROLE_NAMES, StaffMember, TeamStaffRole, TEAM_STAFF_ROLE_NAMES } from '@/data/facility-staff-config'
import { getGeminiKeyPool, getNextGeminiApiKey } from '@/services/geminiKeyRotation'

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
  activityDescription?: string
  activityTemplateId?: string
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
  
  // Interview Candidate (for staff_interview activities)
  interviewCandidate?: {
    name: string
    role: string
    roleName: string
    nationality: string
    age: number
    experience: number
    reputation: number
    skills: Record<string, number>
    traits: string[]
    personality?: string
    bio?: {
      background: string
      careerHighlights: string[]
      personalityNote: string
      strengths: string[]
      weaknesses: string[]
    }
    currentTeam?: string
    salary: number
    staffCategory: string
  }
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
    developmentPoints?: number
  }
  followUp?: string  // Sets up next round's situation
  /** AI-generated promise metadata — converted to ChoicePromiseDefinition in EventGameplayModal */
  promise?: {
    text: string
    shortText: string
    category: 'performance' | 'investment' | 'wellbeing' | 'strategy' | 'development'
    deadlineWeeks: number
    stakeholderRole: string
  }
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
    activityDescription: activity.description,
    activityTemplateId: activity.templateId,
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
    currentYear: careerState.currentYear,
    
    // Interview Candidate (populated for staff_interview activities)
    interviewCandidate: buildInterviewCandidateContext(activity, careerState)
  }
}

/**
 * Look up the interview candidate's full profile when the activity is a staff interview.
 */
function buildInterviewCandidateContext(
  activity: ScheduledActivity,
  careerState: any
): EventContext['interviewCandidate'] {
  if (!activity.templateId?.toLowerCase().includes('staff_interview')) return undefined
  const candidateId = activity.triggerData?.interviewCandidateId
  if (!candidateId) return undefined
  
  // Look up from market first, then world pool
  let candidate: StaffMember | undefined
  candidate = (careerState.facilityStaffMarket || []).find((s: StaffMember) => s.id === candidateId)
  if (!candidate) {
    const poolEntry = (careerState.worldStaffPool || []).find((w: any) => w.staff?.id === candidateId)
    if (poolEntry) candidate = poolEntry.staff
  }
  if (!candidate) return undefined
  
  // Build the bio context if available
  const preGenBio = candidate.preGenBio
  const runtimeBio = (candidate as any).bio
  const bio = preGenBio || runtimeBio
  const bioContext = bio ? {
    background: bio.background || bio.summary || '',
    careerHighlights: bio.careerHighlights || bio.achievements || [],
    personalityNote: bio.personalityNote || bio.personality || '',
    strengths: bio.strengths || [],
    weaknesses: bio.weaknesses || []
  } : undefined
  
  return {
    name: candidate.name,
    role: candidate.role,
    roleName: STAFF_ROLE_NAMES[candidate.role] || candidate.role,
    nationality: candidate.nationality,
    age: candidate.age,
    experience: candidate.experience,
    reputation: candidate.reputation,
    skills: { ...candidate.skills },
    traits: [...candidate.traits],
    personality: (candidate as any).personality,
    bio: bioContext,
    currentTeam: (candidate as any).currentTeam,
    salary: candidate.salary,
    staffCategory: candidate.staffCategory
  }
}

/**
 * Get the name (or role title) of an actual staff member by their role.
 * Returns undefined if no staff member with that role exists.
 */
export function getActualStaffName(role: TeamStaffRole): string | undefined {
  const state = useCareerStore.getState()
  const ownedTeam = state.careerState?.ownedTeam
  if (!ownedTeam) return undefined
  
  // Check team staff
  const teamStaff = ownedTeam.staff || []
  const match = teamStaff.find((s: any) => s.role === role)
  if (match) return match.name
  
  return undefined
}

/**
 * Get a staff name for a role, falling back to a generic label if not hired.
 * Use this for content that should still work without staff (e.g. "Team HQ").
 */
export function getStaffNameOrFallback(role: TeamStaffRole, fallback = 'Team HQ'): string {
  return getActualStaffName(role) ?? fallback
}

/**
 * Check whether the player's team has ANY hired staff at all.
 */
export function teamHasStaff(): boolean {
  const state = useCareerStore.getState()
  const ownedTeam = state.careerState?.ownedTeam
  if (!ownedTeam) return false
  return (ownedTeam.staff?.length ?? 0) > 0 || (ownedTeam.facilityStaff?.length ?? 0) > 0
}

/**
 * Build list of attendees based on activity configuration.
 * Uses actual staff roster — only includes roles that are actually hired.
 */
function buildAttendeeList(activity: ScheduledActivity): string[] {
  const attendees: string[] = []
  
  // Add team owner
  attendees.push('Team Owner (You)')
  
  // Add driver if required
  if (activity.requiresDriver) {
    const state = useCareerStore.getState()
    const driverName = state.player
      ? `${state.player.firstName} ${state.player.lastName}`
      : 'Primary Driver'
    attendees.push(driverName)
  }
  
  // Add sponsor reps if present
  if (activity.configuration?.guests?.sponsorReps?.length) {
    activity.configuration.guests.sponsorReps.forEach(rep => {
      attendees.push(`${rep.sponsorName} Representatives (${rep.count})`)
    })
  }
  
  // Add actual staff based on activity type — only if the role is hired
  const rolesToCheck: Record<string, TeamStaffRole[]> = {
    team: ['chief_engineer', 'team_manager'],
    sponsor: ['pr_manager', 'team_manager'],
    media: ['pr_manager'],
    development: ['technical_director', 'chief_engineer'],
    maintenance: ['chief_engineer', 'crew_chief'],
  }
  
  const roles = rolesToCheck[activity.category] || []
  for (const role of roles) {
    const staffName = getActualStaffName(role)
    if (staffName) {
      const roleTitle = TEAM_STAFF_ROLE_NAMES[role] || role
      attendees.push(`${staffName} (${roleTitle})`)
    }
  }
  
  return attendees
}

// ============================================
// PROMPT TEMPLATES
// ============================================

// ============================================
// GAME PHASE HELPERS
// ============================================

/**
 * Determine the current game phase based on context for appropriate topic generation
 */
function getGamePhase(ctx: EventContext): 'brand_new' | 'early_season' | 'pre_first_race' | 'mid_season' | 'late_season' {
  if (ctx.currentWeek <= 2) return 'brand_new'
  if (ctx.currentWeek <= 6 && ctx.recentResults.length === 0) return 'pre_first_race'
  if (ctx.currentWeek <= 6) return 'early_season'
  if (ctx.currentWeek >= 30) return 'late_season'
  return 'mid_season'
}

function getGamePhaseGuidance(ctx: EventContext): string {
  const phase = getGamePhase(ctx)
  const hasRaced = ctx.recentResults.length > 0 || !!ctx.lastRacePosition
  const hasSponsors = ctx.sponsorSatisfactions.length > 0
  
  switch (phase) {
    case 'brand_new':
      return `
CRITICAL CONTEXT - BRAND NEW TEAM (Week ${ctx.currentWeek}):
This is the very start of the career. The team has JUST been formed.
- NO races have happened yet. Do NOT ask about race results or performance.
- There is NO championship position yet. Do NOT reference standings.
- Financial data is preliminary - the team is still setting up.
- Topics should focus on: team vision, initial goals, first impressions, 
  setting expectations, building team culture, preparing for the first race,
  hiring priorities, facility setup, getting to know each other.
- The tone should be optimistic but grounded - everything is new and exciting.
- NPCs should be curious about YOUR vision as owner, not grilling you on results.`
    
    case 'pre_first_race':
      return `
CONTEXT - PRE-FIRST RACE (Week ${ctx.currentWeek}, no races yet):
The team is established but hasn't raced yet.
- NO race results exist. Do NOT ask about past performance on track.
- Topics should focus on: preparation for the first race, testing feedback,
  car readiness, driver integration, logistics planning, team confidence levels,
  sponsor expectations for debut, media build-up to first event.
- The tone should be anticipatory - everyone is eager for the first race.
${hasSponsors ? '- Sponsors are interested in launch plans and initial visibility.' : '- No sponsors yet - discussions might touch on attracting partners.'}`
    
    case 'early_season':
      return `
CONTEXT - EARLY SEASON (Week ${ctx.currentWeek}):
The season has just begun with limited race data.
${hasRaced ? `- Last race result: P${ctx.lastRacePosition} at ${ctx.lastRaceTrack}` : '- First race coming up soon.'}
- Topics should include: early form assessment, initial impressions of competition,
  adjustments needed based on early data, morale check-in, budget pacing.
- Keep expectations realistic - it's too early to judge the whole season.`
    
    case 'mid_season':
      return `
CONTEXT - MID SEASON (Week ${ctx.currentWeek}):
The season is well underway with meaningful data to discuss.
${hasRaced ? `- Most recent: P${ctx.lastRacePosition} at ${ctx.lastRaceTrack}` : ''}
- Championship Position: ${ctx.championshipPosition || 'N/A'}
- Topics can reference: trends, performance trajectory, championship targets,
  budget burn rate, development direction, staff performance, driver form.`
    
    case 'late_season':
      return `
CONTEXT - LATE SEASON (Week ${ctx.currentWeek}):
The season is nearing its end. Decisions carry extra weight.
${hasRaced ? `- Most recent: P${ctx.lastRacePosition} at ${ctx.lastRaceTrack}` : ''}
- Championship Position: ${ctx.championshipPosition || 'N/A'}
- Topics should include: season assessment, next year planning, contract renewals,
  budget for remaining races, final championship push or write-off.`
  }
}

/**
 * Common JSON structure instruction appended to all prompts
 */
const JSON_STRUCTURE_INSTRUCTION = `
Return as JSON with this EXACT structure (no other format):
{
  "title": "Short event title",
  "description": "One-line event description",
  "rounds": [
    {
      "roundNumber": 1,
      "situation": "What is happening in the scene",
      "speakerName": "Person's Name",
      "speakerRole": "Their Role/Title",
      "question": "What they say or ask you",
      "choices": [
        {"id": "1a", "text": "Your response option", "tone": "diplomatic", "effects": {"outcome": "good", "boardMood": 2, "teamMorale": 1}},
        {"id": "1b", "text": "A bold commitment that carries a promise", "tone": "bold", "effects": {"outcome": "good", "boardMood": -1, "reputation": 2}, "promise": {"text": "Deliver on the specific thing you committed to", "shortText": "Short label", "category": "performance", "deadlineWeeks": 4, "stakeholderRole": "Chief Engineer"}},
        {"id": "1c", "text": "Third option", "tone": "cautious", "effects": {"outcome": "neutral", "teamMorale": 2}},
        {"id": "1d", "text": "Fourth option", "tone": "professional", "effects": {"outcome": "bad", "boardMood": 1}}
      ]
    }
  ]
}

OUTCOME FIELD (required): Every choice MUST include an "outcome" field inside "effects". Valid values: "good", "bad", "neutral".
- "good" = a wise, well-received, or strategically sound response
- "bad" = a poor, risky, or off-putting response
- "neutral" = a safe but unremarkable response
Most scenarios should have a mix: typically 1-2 good, 1 neutral, and 0-1 bad choices per round.

Valid effect keys: outcome, boardMood, teamMorale, sponsorSatisfaction, reputation, driverMorale, budgetImpact, developmentPoints, fanSentiment
Stat effect values (boardMood, teamMorale, sponsorSatisfaction, reputation, driverMorale, developmentPoints, fanSentiment) should be integers from -3 to 3. Do NOT use + prefix on positive numbers.
budgetImpact is DIFFERENT — it represents actual dollar amounts. Use values like -25000, -10000, -5000, 5000, 10000 etc. Range: -25000 to 25000. Negative = cost to the team, positive = savings or revenue.
Valid tones: diplomatic, bold, cautious, professional, aggressive, friendly

PROMISE SYSTEM (important): Some bold/confident choices should carry a "promise" — a commitment the player is making that will be tracked.
- Add a "promise" object to 1-2 choices per scenario (NOT every choice — only ones where the player explicitly commits to something specific).
- promise.category must be one of: performance, investment, wellbeing, strategy, development
- promise.deadlineWeeks: how many weeks the player has to deliver (2-6 is typical)
- promise.stakeholderRole: who heard the promise (e.g. "Chief Engineer", "Sponsor Representative", "Team Member", "Board Member", "Journalist")
- Promises should feel natural — things like "we'll improve results", "I'll increase the budget", "we'll address burnout"
- If no choice naturally implies a commitment, don't force it.

Generate exactly 3 rounds with 3-4 choices each.`

// ============================================
// PROMPT TEMPLATES
// ============================================

/**
 * Build an activity-specific context block to inject into every AI prompt.
 * This ensures the AI always knows what specific activity it is generating
 * content for, not just the generic template category.
 */
function getActivityContextBlock(ctx: EventContext): string {
  return `
SPECIFIC ACTIVITY:
- Activity Name: "${ctx.activityName}"
- Activity Description: ${ctx.activityDescription || 'N/A'}
- Attendees: ${ctx.attendees.join(', ')}
${ctx.venue ? `- Venue: ${ctx.venue}` : ''}

CRITICAL: Generate scenarios specifically relevant to "${ctx.activityName}". 
Do NOT generate generic or off-topic content. Every round, question, and NPC 
dialogue MUST be directly related to this specific activity's purpose. If this 
is a finance meeting, ask about finances. If it's an HR session, discuss staffing.
If it's a sponsor check-in, discuss the sponsorship.`
}

const PROMPT_TEMPLATES: Record<string, (context: EventContext) => string> = {
  // Race Debrief
  'race_debrief': (ctx) => `
You are generating a race debrief scenario for a motorsport management game.

TEAM STATE:
- Team: ${ctx.teamName}
- Series: ${ctx.seriesName || 'Unknown Series'}
- Last Race: P${ctx.lastRacePosition || '?'} at ${ctx.lastRaceTrack || 'Unknown Track'}
- Championship Position: ${ctx.championshipPosition || 'N/A'}
- Team Morale: ${ctx.teamMorale}/100
- Driver: ${ctx.driverName || 'Team Driver'}

${getActivityContextBlock(ctx)}

${getGamePhaseGuidance(ctx)}

Generate a post-race debrief. Topics should be SPECIFIC to the race result above:
${ctx.lastRacePosition && ctx.lastRacePosition <= 3 ? '- Celebrate the strong result but look for areas to improve further' : ''}
${ctx.lastRacePosition && ctx.lastRacePosition > 10 ? '- Address what went wrong honestly, without being defeatist' : ''}
- Strategy decisions and what could have been done differently
- Car setup feedback from the driver
- Preparation priorities for the next race

Each response should primarily affect teamMorale and driverMorale (-5 to 5 range).
${JSON_STRUCTURE_INSTRUCTION}
`,

  // Board Meeting
  'board_meeting': (ctx) => `
You are generating a board meeting scenario for a motorsport management game.

TEAM STATE:
- Team: ${ctx.teamName}
- Budget: $${ctx.currentBudget.toLocaleString()}
- Board Mood: ${ctx.boardMood}/100
- Team Morale: ${ctx.teamMorale}/100
- Sponsors: ${ctx.sponsorSatisfactions.length > 0 ? ctx.sponsorSatisfactions.map(s => `${s.name} (${s.tier})`).join(', ') : 'None yet'}
- Series: ${ctx.seriesName || 'Not entered yet'}

${getActivityContextBlock(ctx)}

${getGamePhaseGuidance(ctx)}

Generate a board meeting scenario with 3 rounds. The questions MUST be appropriate for the current game phase above.
Each response should primarily affect boardMood (-5 to 5 range).

${JSON_STRUCTURE_INSTRUCTION}
`,

  // Sponsor Meeting
  'sponsor_meeting': (ctx) => {
    const mainSponsor = ctx.sponsorSatisfactions[0]
    return `
You are generating a sponsor meeting scenario for a motorsport management game.

TEAM STATE:
- Team: ${ctx.teamName}
- Sponsor: ${mainSponsor?.name || 'Primary Sponsor'}
- Sponsor Satisfaction: ${mainSponsor?.satisfaction || 75}/100
- Contract Value: $${(mainSponsor?.contractValue || 100000).toLocaleString()}
- Series: ${ctx.seriesName || 'Unknown Series'}

${getActivityContextBlock(ctx)}

${getGamePhaseGuidance(ctx)}

Generate a sponsor meeting with 3 rounds. Questions must fit the current phase:
${getGamePhase(ctx) === 'brand_new' || getGamePhase(ctx) === 'pre_first_race' 
  ? '- Sponsor wants to discuss launch activation plans, branding on the car, visibility goals\n- They are optimistic but want to see a clear marketing plan\n- Discuss social media strategy, fan engagement plans, debut event preparation'
  : `- The sponsor is ${mainSponsor && mainSponsor.satisfaction < 60 ? 'concerned and questioning the ROI' : mainSponsor && mainSponsor.satisfaction > 80 ? 'happy but pushing for more exposure' : 'neutral but evaluating the partnership'}\n- Discuss brand visibility metrics, activation plans, contract value`
}

Each response should primarily affect sponsorSatisfaction (-5 to 5 range).
${JSON_STRUCTURE_INSTRUCTION}
`
  },

  // Team Meeting
  'team_meeting': (ctx) => `
You are generating a team meeting scenario for a motorsport management game.

TEAM STATE:
- Team: ${ctx.teamName}
- Team Morale: ${ctx.teamMorale}/100
- Budget: $${ctx.currentBudget.toLocaleString()}
- Driver: ${ctx.driverName || 'Team Driver'}
- Series: ${ctx.seriesName || 'Not entered yet'}

${getActivityContextBlock(ctx)}

${getGamePhaseGuidance(ctx)}

Generate an internal team meeting with 3 rounds. Topics MUST match the current phase:
${getGamePhase(ctx) === 'brand_new' 
  ? '- Getting to know the team, establishing your leadership style\n- Setting initial development priorities and team culture\n- Discussing roles, expectations, and what kind of team you want to build'
  : getGamePhase(ctx) === 'pre_first_race'
  ? '- Pre-season testing feedback and car readiness\n- Team logistics and race weekend procedures\n- Driver confidence and preparation levels'
  : '- Staff workload and morale check-in\n- Technical development priorities\n- Resource allocation and upcoming challenges'
}

Each response should primarily affect teamMorale (-5 to 5 range).
${JSON_STRUCTURE_INSTRUCTION}
`,

  // Financial Review
  'financial_review': (ctx) => `
You are generating a financial review meeting for a motorsport management game.

TEAM STATE:
- Team: ${ctx.teamName}
- Current Cash: $${ctx.currentBudget.toLocaleString()}
- Monthly Burn Rate: ${ctx.burnRate > 0 ? '-' : '+'}$${Math.abs(ctx.burnRate).toLocaleString()}
- Status: ${ctx.profitLoss === 'loss' ? 'LOSING MONEY' : ctx.profitLoss === 'profit' ? 'Profitable' : 'Breaking Even'}
- Sponsor Income: $${ctx.sponsorSatisfactions.reduce((sum, s) => sum + s.contractValue, 0).toLocaleString()}
- Board Mood: ${ctx.boardMood}/100

${getActivityContextBlock(ctx)}

${getGamePhaseGuidance(ctx)}

Generate a financial review with 3 rounds. Topics MUST match the current phase:
${getGamePhase(ctx) === 'brand_new'
  ? '- Setting up initial budget allocations for the season\n- Discussing where to invest startup funds (equipment, staff, facilities)\n- Planning revenue targets and sponsor acquisition strategy'
  : getGamePhase(ctx) === 'pre_first_race'
  ? '- Pre-season spending review and remaining budget\n- Cost projections for the race calendar\n- Cash flow planning for the early races'
  : '- Budget allocation review and spending trends\n- Revenue vs expenses analysis\n- Investment decisions and cost-cutting opportunities'
}

Each response should primarily affect boardMood (-5 to 5 range).
${JSON_STRUCTURE_INSTRUCTION}
`,

  // Media Event / Press Conference
  'media_event': (ctx) => `
You are generating a media/press event scenario for a motorsport management game.

TEAM STATE:
- Team: ${ctx.teamName}
- Reputation: ${ctx.teamReputation}/100
- Driver: ${ctx.driverName || 'Team Driver'}
- Series: ${ctx.seriesName || 'Unknown Series'}

${getActivityContextBlock(ctx)}

${getGamePhaseGuidance(ctx)}

Generate a press event with 3 rounds of journalist questions. Questions MUST fit the phase:
${getGamePhase(ctx) === 'brand_new' || getGamePhase(ctx) === 'pre_first_race'
  ? '- Journalists ask about your ambitions, why you started a racing team\n- Questions about your driver choice and team philosophy\n- What fans can expect from this new team'
  : '- Questions about recent performance and trajectory\n- Probing questions about team challenges\n- Future expectations and goals'
}

Each response should primarily affect reputation (-5 to 5 range).
${JSON_STRUCTURE_INSTRUCTION}
`,

  // Pre-Race Strategy Briefing
  'pre_race_briefing': (ctx) => `
You are generating a pre-race strategy briefing for a motorsport management game.

TEAM STATE:
- Team: ${ctx.teamName}
- Series: ${ctx.seriesName || 'Unknown Series'}
- Next Race Track: ${ctx.lastRaceTrack || 'Unknown Track'}
- Team Morale: ${ctx.teamMorale}/100
- Driver: ${ctx.driverName || 'Team Driver'}
- Budget Remaining: $${ctx.currentBudget.toLocaleString()}

${getActivityContextBlock(ctx)}

${getGamePhaseGuidance(ctx)}

Generate a pre-race strategy briefing with 3 rounds:
${getGamePhase(ctx) === 'brand_new' || getGamePhase(ctx) === 'pre_first_race'
  ? '- Round 1: Chief Engineer presents initial car setup philosophy - choose approach for your debut\n- Round 2: Driver shares their feelings about racing for a new team\n- Round 3: Logistics - are we truly ready? Discuss any last concerns before the first event'
  : '- Round 1: Chief Engineer presents track analysis and setup options\n- Round 2: Driver raises concerns or requests about strategy\n- Round 3: Final strategy call with weather/conditions uncertainty'
}

Each response should affect teamMorale and driverMorale (-5 to 5 range).
${JSON_STRUCTURE_INSTRUCTION}
`,

  // Car Scrutineering / Technical Inspection
  'scrutineering': (ctx) => `
You are generating a car technical inspection scenario for a motorsport management game.

TEAM STATE:
- Team: ${ctx.teamName}
- Budget: $${ctx.currentBudget.toLocaleString()}
- Team Morale: ${ctx.teamMorale}/100

${getActivityContextBlock(ctx)}

${getGamePhaseGuidance(ctx)}

Generate a scrutineering inspection with 3 rounds:
${getGamePhase(ctx) === 'brand_new' || getGamePhase(ctx) === 'pre_first_race'
  ? '- Round 1: First-ever inspection - officials are thorough with new teams\n- Round 2: An area of the car needs minor adjustment to pass regulations\n- Round 3: Inspector gives general feedback - how you handle it sets a tone'
  : '- Round 1: Stewards find something borderline in the car setup\n- Round 2: A rival team has questioned a technical element\n- Round 3: Inspector asks about a new development component'
}

Effects should primarily affect reputation (-5 to 5 range).
${JSON_STRUCTURE_INSTRUCTION}
`,

  // Staff Hiring Interview
  'staff_interview': (ctx) => {
    const c = ctx.interviewCandidate
    const candidateBlock = c ? `
CANDIDATE PROFILE (use this to make all answers UNIQUE to this person):
- Name: ${c.name}
- Role: ${c.roleName} (${c.role})
- Staff Category: ${c.staffCategory === 'facility' ? 'Facility/R&D Staff' : 'Team/Race Staff'}
- Nationality: ${c.nationality}
- Age: ${c.age}, Experience: ${c.experience} years in motorsport
- Reputation: ${c.reputation}/100
- Skills: ${Object.entries(c.skills).map(([k, v]) => `${k}: ${v}/100`).join(', ')}
- Traits: ${c.traits.length > 0 ? c.traits.join(', ') : 'None'}
${c.personality ? `- Personality: ${c.personality}` : ''}
${c.currentTeam ? `- Currently employed at: ${c.currentTeam}` : '- Currently: Free Agent'}
- Salary expectation: $${c.salary.toLocaleString()}/week
${c.bio ? `
CANDIDATE BACKGROUND:
${c.bio.background ? `- Background: ${c.bio.background}` : ''}
${c.bio.careerHighlights?.length ? `- Career Highlights: ${c.bio.careerHighlights.join('; ')}` : ''}
${c.bio.personalityNote ? `- Known for: ${c.bio.personalityNote}` : ''}
${c.bio.strengths?.length ? `- Strengths: ${c.bio.strengths.join(', ')}` : ''}
${c.bio.weaknesses?.length ? `- Weaknesses: ${c.bio.weaknesses.join(', ')}` : ''}` : ''}

CRITICAL: The candidate's answers MUST reflect their unique profile above.
- A veteran aerodynamicist speaks differently than a young junior engineer.
- Their personality, nationality, and career history should color their responses.
- Reference specific details from their background in their answers.
- High-reputation candidates should be more confident; low-reputation ones more eager to prove themselves.
- Their strengths and weaknesses should naturally come through in how they answer.
` : ''
    return `
You are generating a HIRING INTERVIEW scenario for a motorsport management game.

CRITICAL: This is a JOB INTERVIEW. The player is the TEAM OWNER conducting the interview.
The candidate is being INTERVIEWED BY the player — NOT the other way around.

The flow is REVERSED compared to other events:
- The "choices" are QUESTIONS the team owner asks the candidate
- The "followUp" on each choice is the CANDIDATE'S ANSWER to that question
- The "question" field should describe the candidate's body language / demeanor, NOT a question they ask

TEAM STATE:
- Team: ${ctx.teamName}
- Team Reputation: ${ctx.teamReputation}/100
- Series: ${ctx.seriesName || 'Not entered yet'}
- Budget: $${ctx.currentBudget.toLocaleString()}
${candidateBlock}
${getActivityContextBlock(ctx)}

${getGamePhaseGuidance(ctx)}

INTERVIEW FORMAT - Generate 3 rounds where:
- Round 1: Opening — assess the candidate's motivation and fit. Why do they want to join?
- Round 2: Technical/competence — test their knowledge and skills for the specific role of ${c?.roleName || 'the position'}.
- Round 3: Closing — discuss expectations, culture fit, and any concerns.

For EACH round:
- "situation": Describe the scene and candidate's demeanor/body language (use their name: ${c?.name || 'the candidate'})
- "question": A brief note about the candidate's current state (e.g. "${c?.name || 'The candidate'} sits up straighter, ready for your question.")
- "speakerName": "You" (the team owner)
- "speakerRole": "Team Owner"
- "choices": 3-4 QUESTIONS the owner can ask (NOT responses!)
  - Each choice "text" is a QUESTION the owner asks — tailor questions to the candidate's specific role and background
  - Each choice "followUp" is the CANDIDATE'S ANSWER (2-3 sentences, in their voice, reflecting their unique profile)
  - Each choice "tone" reflects the owner's questioning style
  - Effects should reflect how well the question reveals useful info or builds rapport

Effects: teamMorale (how the team perceives your hiring process), boardMood (board approval of thoroughness), reputation (professionalism)
${JSON_STRUCTURE_INSTRUCTION}
`
  },

  // General Development Session
  'development_session': (ctx) => `
You are generating an R&D development session for a motorsport management game.

TEAM STATE:
- Team: ${ctx.teamName}
- Budget: $${ctx.currentBudget.toLocaleString()}
- Team Morale: ${ctx.teamMorale}/100

${getActivityContextBlock(ctx)}

${getGamePhaseGuidance(ctx)}

Generate a development review with 3 rounds:
${getGamePhase(ctx) === 'brand_new' || getGamePhase(ctx) === 'pre_first_race'
  ? '- Round 1: Technical Director presents initial car concept and where to focus first\n- Round 2: Discussion about simulation data vs real-world testing approach\n- Round 3: Setting development priorities for the opening races'
  : '- Round 1: Technical Director presents development path options\n- Round 2: A risky but promising innovation is proposed\n- Round 3: Resource allocation conflict between departments'
}

Effects should affect teamMorale and potentially budgetImpact (-5 to 5 range).
${JSON_STRUCTURE_INSTRUCTION}
`,

  // Maintenance / Car Damage Assessment
  'damage_assessment': (ctx) => `
You are generating a post-race car damage assessment for a motorsport management game.

TEAM STATE:
- Team: ${ctx.teamName}
- Last Race: P${ctx.lastRacePosition || '?'} at ${ctx.lastRaceTrack || 'Unknown Track'}
- Budget: $${ctx.currentBudget.toLocaleString()}
- Team Morale: ${ctx.teamMorale}/100

${getActivityContextBlock(ctx)}

${getGamePhaseGuidance(ctx)}

Generate a damage assessment with 3 rounds:
- Round 1: Chief Mechanic presents the damage report and repair options
- Round 2: A hidden issue is discovered - more serious than initially thought
- Round 3: Spare parts logistics - rush delivery vs standard shipping

Effects should primarily affect budgetImpact and teamMorale (-5 to 5 range).
${JSON_STRUCTURE_INSTRUCTION}
`,

  // Mid-Season Review
  'mid_season_review': (ctx) => `
You are generating a mid-season performance review for a motorsport management game.

TEAM STATE:
- Team: ${ctx.teamName}
- Championship Position: ${ctx.championshipPosition || 'Unknown'}
- Team Morale: ${ctx.teamMorale}/100
- Board Mood: ${ctx.boardMood}/100
- Budget: $${ctx.currentBudget.toLocaleString()}
- Recent Results: ${ctx.recentResults.map(r => `P${r.position} at ${r.track}`).join(', ') || 'No recent results'}

${getActivityContextBlock(ctx)}

${getGamePhaseGuidance(ctx)}

Generate a 3-round mid-season review:
- Round 1: Board assesses first-half performance - present your case
- Round 2: R&D direction for the second half - bold upgrade or incremental gains?
- Round 3: Staff performance and team energy - how to keep the team sharp

Effects should cover boardMood, teamMorale, developmentPoints (-5 to 5 range).
${JSON_STRUCTURE_INSTRUCTION}
`,

  // End of Season Wrap-up
  'end_of_season': (ctx) => `
You are generating an end-of-season wrap-up for a motorsport management game.

TEAM STATE:
- Team: ${ctx.teamName}
- Final Championship Position: ${ctx.championshipPosition || 'Unknown'}
- Team Morale: ${ctx.teamMorale}/100
- Board Mood: ${ctx.boardMood}/100
- Budget Remaining: $${ctx.currentBudget.toLocaleString()}
- Season Results: ${ctx.recentResults.map(r => `P${r.position} at ${r.track}`).join(', ') || 'Season data unavailable'}
- Driver: ${ctx.driverName || 'Team Driver'}

${getActivityContextBlock(ctx)}

${getGamePhaseGuidance(ctx)}

Generate a 3-round end-of-season scenario:
- Round 1: End-of-year gathering - deliver your season closing speech
- Round 2: Lead driver wants to discuss their future with the team
- Round 3: Board meeting to set next year's strategic direction

Effects should cover teamMorale, boardMood, driverMorale, reputation (-5 to 5 range).
${JSON_STRUCTURE_INSTRUCTION}
`,

  // Onboarding Meeting (new team owner orientation — no staff assumed)
  'onboarding_meeting': (ctx) => `
You are generating an onboarding scenario for a motorsport management game.
The player is a BRAND NEW team owner who may not have any staff hired yet.
Do NOT reference specific staff members unless the attendees list includes them.

TEAM STATE:
- Team: ${ctx.teamName}
- Activity: ${ctx.activityName}
- Description: ${ctx.activityDescription}
- Current Budget: $${ctx.currentBudget.toLocaleString()}
- Week: ${ctx.currentWeek}
- Attendees: ${ctx.attendees.join(', ')}

${getActivityContextBlock(ctx)}

Generate a 3-round onboarding scenario:
- Round 1: Introduction to the topic — set the scene as a self-guided orientation or advisor walkthrough
- Round 2: A decision point where the new owner sets a preference or direction
- Round 3: Wrap up — confirm understanding and look ahead

IMPORTANT: The player may be ALONE with no staff. Frame interactions as:
- Reading materials, watching training videos, or reviewing documentation
- An external advisor or board representative guiding them
- Self-reflection and decision-making
Do NOT invent staff members that don't exist.

Each response should affect teamMorale and boardMood (-3 to 3 range, small since it's onboarding).
${JSON_STRUCTURE_INSTRUCTION}
`,

  // Personal Activity (fitness, dinner, networking — player-focused, not team)
  'personal_activity': (ctx) => `
You are generating a personal life activity scenario for a motorsport management game.
This is a PERSONAL activity — not a team meeting. Focus on the player as an individual.

ACTIVITY:
- Name: ${ctx.activityName}
- Description: ${ctx.activityDescription}
- Attendees: ${ctx.attendees.join(', ')}

PLAYER STATE:
- Team: ${ctx.teamName}
- Reputation: ${ctx.teamReputation}/100
- Week: ${ctx.currentWeek}

${getActivityContextBlock(ctx)}

Generate a 3-round personal scenario:
- Round 1: Set the scene — the player is at the activity (gym, dinner, networking event, etc.)
- Round 2: A social or personal decision arises
- Round 3: Reflection or outcome — how it affects the player's wellbeing or connections

Keep the tone lighter and more personal than business meetings.
Each response should affect reputation and confidence/wellbeing (-3 to 3 range).
${JSON_STRUCTURE_INSTRUCTION}
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
  const keys = getRotatedApiKeys(apiKey)
  
  if (keys.length > 0) {
    console.log(`[EventGenerator] Gemini API keys found (${keys.length}), calling API for template: ${templateKey}`)
    try {
      const response = await callGeminiApi(keys, prompt)
      if (response) {
        console.log('[EventGenerator] Gemini API returned response, parsing...')
        const parsed = parseGeminiResponse(response, activity, context)
        if (parsed) {
          console.log(`[EventGenerator] Successfully generated AI scenario with ${parsed.rounds.length} rounds`)
          return parsed
        }
        console.warn('[EventGenerator] Failed to parse Gemini response, retrying with stricter JSON prompt')

        // One strict retry before template fallback. This addresses occasional
        // truncated/invalid JSON from the model.
        const strictPrompt = `${prompt}

CRITICAL OUTPUT REQUIREMENTS:
- Return ONLY ONE valid JSON object (no markdown, no code fences).
- Ensure all strings are properly escaped and the JSON is fully closed.
- Keep text concise so the response fits comfortably (max ~200 chars per long field).`
        const retryResponse = await callGeminiApi(keys, strictPrompt)
        if (retryResponse) {
          const retryParsed = parseGeminiResponse(retryResponse, activity, context)
          if (retryParsed) {
            console.log(`[EventGenerator] Successfully parsed strict-retry scenario with ${retryParsed.rounds.length} rounds`)
            return retryParsed
          }
        }
        console.warn('[EventGenerator] Strict retry also failed, falling back to templates')
      } else {
        console.warn('[EventGenerator] Gemini API returned null response, falling back to templates')
      }
    } catch (error) {
      console.error('[EventGenerator] Gemini API error:', error)
    }
  } else {
    console.warn('[EventGenerator] No Gemini API keys found - checked settings storage and VITE_GEMINI_API_KEYS')
  }
  
  // Fallback to template-based generation
  console.log('[EventGenerator] Using fallback template for:', templateKey)
  return generateFallbackScenario(activity, context)
}

/**
 * Get the appropriate prompt template key for an activity
 */
function getPromptTemplateKey(activity: ScheduledActivity): string {
  // Check for specific activity types first (more specific checks before general ones)
  const templateId = activity.templateId.toLowerCase()
  
  // ── MOST SPECIFIC CHECKS FIRST ──
  
  // Onboarding activities → dedicated onboarding template (no staff assumed)
  if (templateId.startsWith('onboarding_')) {
    // Some onboarding activities map better to specific templates
    if (templateId.includes('board')) return 'board_meeting'
    if (templateId.includes('financ') || templateId.includes('budget')) return 'financial_review'
    if (templateId.includes('sponsor')) return 'sponsor_meeting'
    if (templateId.includes('media') || templateId.includes('press') || templateId.includes('photo')) return 'media_event'
    if (templateId.includes('charity') || templateId.includes('visibility')) return 'media_event'
    // Personal onboarding activities
    if (templateId.includes('partner') || templateId.includes('gym') || templateId.includes('fitness') || templateId.includes('networking')) return 'personal_activity'
    // Everything else (team briefing, facility walkthrough, etc.) → onboarding
    return 'onboarding_meeting'
  }
  
  // Staff hiring interview — must be checked before generic 'team' match
  if (templateId.includes('staff_interview')) {
    return 'staff_interview'
  }
  
  // Press conferences — must be checked before 'press' or 'pre_race' matches
  if (templateId.includes('press_conference')) {
    return 'media_event'
  }
  
  if (templateId.includes('debrief') || templateId.includes('race_debrief')) {
    return 'race_debrief'
  }
  if (templateId.includes('board')) {
    return 'board_meeting'
  }
  if (templateId.includes('sponsor') || templateId.includes('sponsor_meeting')) {
    return 'sponsor_meeting'
  }
  // Mid-season review must be checked before generic 'review' match
  if (templateId.includes('mid_season') || templateId.includes('midseason')) {
    return 'mid_season_review'
  }
  // End of season must be checked before generic matches
  if (templateId.includes('end_of_season') || templateId.includes('season_wrap') || templateId.includes('season_end')) {
    return 'end_of_season'
  }
  if (templateId.includes('financ') || templateId.includes('budget')) {
    return 'financial_review'
  }
  if (templateId.includes('charity') || templateId.includes('visibility')) {
    return 'media_event'
  }
  if (templateId.includes('media') || templateId.includes('press')) {
    return 'media_event'
  }
  
  // Safety briefing → team meeting, NOT pre-race briefing
  if (templateId.includes('safety_briefing')) {
    return 'team_meeting'
  }
  // Context briefings (technical/series) → team meeting
  if (templateId.includes('context_technical') || templateId.includes('context_series')) {
    return 'team_meeting'
  }
  
  // Only genuine pre-race/strategy briefings
  if (templateId.includes('pre_race') || templateId.includes('strategy_briefing')) {
    return 'pre_race_briefing'
  }
  // Generic 'briefing' that didn't match above → team meeting (not pre-race)
  if (templateId.includes('briefing')) {
    return 'team_meeting'
  }
  
  // Facility inspection → team meeting (not car scrutineering)
  if (templateId.includes('facility_inspection')) {
    return 'team_meeting'
  }
  if (templateId.includes('scrutineer') || templateId.includes('technical_inspection')) {
    return 'scrutineering'
  }
  if (templateId.includes('damage') || templateId.includes('damage_assessment')) {
    return 'damage_assessment'
  }
  if (templateId.includes('development') || templateId.includes('rnd') || templateId.includes('r_and_d')) {
    return 'development_session'
  }
  if (templateId.includes('team') || activity.category === 'team') {
    return 'team_meeting'
  }
  
  // Default based on category
  const category = activity.category
  switch (category) {
    case 'sponsor': return 'sponsor_meeting'
    case 'media': return 'media_event'
    case 'development': return 'development_session'
    case 'personal': return 'personal_activity'
    case 'race': return 'race_debrief'
    case 'maintenance': return 'damage_assessment'
    case 'lifestyle': return 'personal_activity'
    default: return 'team_meeting'
  }
}

/**
 * Get all configured Gemini API keys from settings and env.
 * Supports:
 * - commentary-settings.geminiKey (single)
 * - commentary-settings.geminiKeys (array or comma-separated string)
 * - app-settings.geminiApiKey / geminiApiKeys
 * - career-settings.state.geminiApiKey / geminiApiKeys
 * - VITE_GEMINI_API_KEYS (comma/newline separated)
 */
function getStoredApiKeys(): string[] {
  return getGeminiKeyPool()
}

function getRotatedApiKeys(preferredApiKey?: string): string[] {
  const base = getStoredApiKeys()
  const primaryKey = preferredApiKey || getNextGeminiApiKey() || undefined
  return primaryKey
    ? [primaryKey, ...base.filter(k => k !== primaryKey)]
    : base
}

/**
 * Call Gemini API using the OpenAI-compatible endpoint (same as all other AI services)
 */
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'

async function callGeminiWithRotation(
  apiKeys: string[],
  payload: Record<string, unknown>,
  logPrefix: string
): Promise<string | null> {
  if (!apiKeys.length) return null

  for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
    const apiKey = apiKeys[keyIndex]
    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'unknown')
        if (response.status === 429 && keyIndex < apiKeys.length - 1) {
          console.warn(`${logPrefix} rate-limited on key ${keyIndex + 1}/${apiKeys.length}; rotating to next key`)
          // Small jitter before next key to reduce burst collisions.
          await new Promise(resolve => setTimeout(resolve, 150 + Math.floor(Math.random() * 150)))
          continue
        }
        console.error(`${logPrefix} Gemini API error:`, response.status, errorText)
        return null
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content
      if (!content) {
        console.warn(`${logPrefix} Gemini returned empty content`)
        return null
      }

      return content
    } catch (error) {
      if (keyIndex < apiKeys.length - 1) {
        console.warn(`${logPrefix} key ${keyIndex + 1}/${apiKeys.length} failed; rotating to next key`)
        continue
      }
      console.error(`${logPrefix} Gemini API call failed:`, error)
      return null
    }
  }

  return null
}

async function callGeminiApi(apiKeys: string[], prompt: string): Promise<string | null> {
  return callGeminiWithRotation(apiKeys, {
    model: 'gemini-2.0-flash',
    messages: [
      {
        role: 'system',
        content: 'You are a creative writer for a motorsport management game. You generate interactive event scenarios with contextual dialogue and meaningful choices. Always respond with valid JSON only - no markdown, no code blocks, just the JSON object.'
      },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    max_tokens: 2200,
    temperature: 0.6
  }, '[EventGenerator]')
}

/**
 * Safely extract and sanitize JSON from a response that may include markdown code blocks
 */
function extractJSON(text: string): string {
  let json = text
  
  // Try to extract from code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    json = codeBlockMatch[1].trim()
  } else {
    // Handle unterminated code fence responses (common when model truncates)
    const openCodeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*)$/)
    if (openCodeBlockMatch) {
      json = openCodeBlockMatch[1].trim()
    } else {
      // Try to find JSON object boundaries
      const firstBrace = text.indexOf('{')
      const lastBrace = text.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        json = text.substring(firstBrace, lastBrace + 1)
      } else if (firstBrace !== -1) {
        // If truncated and no closing brace, still return from first brace onward
        // so caller can decide to retry/fallback.
        json = text.substring(firstBrace)
      }
    }
  }
  
  // Sanitize: fix +N values (e.g. "+5" → "5") which aren't valid JSON
  // Match colon, optional whitespace, then +digit (not inside a string)
  json = json.replace(/:\s*\+(\d)/g, ': $1')
  
  return json.trim()
}

/**
 * Extract speaker name and role from various Gemini response formats.
 * Gemini may return: "Eleanor Vance (Lead Investor)" or separate fields.
 */
function parseSpeaker(round: any): { name?: string; role?: string } {
  // Direct fields
  if (round.speakerName) {
    return { name: round.speakerName, role: round.speakerRole }
  }
  
  // "speaker" field that may contain "Name (Role)" format
  const speaker = round.speaker || round.npcName || round.character || ''
  if (!speaker) return {}
  
  const match = speaker.match(/^(.+?)\s*\((.+?)\)\s*$/)
  if (match) {
    return { name: match[1].trim(), role: match[2].trim() }
  }
  
  return { name: speaker, role: round.speakerRole || round.role || round.title }
}

/**
 * Normalize effect keys from Gemini's varied naming into our standard keys
 */
function normalizeEffects(effects: any): Record<string, number> {
  if (!effects || typeof effects !== 'object') return {}
  
  const normalized: Record<string, number> = {}
  const keyMap: Record<string, string> = {
    'boardMood': 'boardMood',
    'board_mood': 'boardMood',
    'boardEffect': 'boardMood',
    'board_effect': 'boardMood',
    'teamMorale': 'teamMorale',
    'team_morale': 'teamMorale',
    'moraleEffect': 'teamMorale',
    'morale_effect': 'teamMorale',
    'morale': 'teamMorale',
    'sponsorSatisfaction': 'sponsorSatisfaction',
    'sponsor_satisfaction': 'sponsorSatisfaction',
    'sponsorEffect': 'sponsorSatisfaction',
    'reputation': 'reputation',
    'reputationEffect': 'reputation',
    'driverMorale': 'driverMorale',
    'driver_morale': 'driverMorale',
    'budgetImpact': 'budgetImpact',
    'budget_impact': 'budgetImpact',
    'budgetEffect': 'budgetImpact',
    'developmentPoints': 'developmentPoints',
    'development_points': 'developmentPoints',
    'devPoints': 'developmentPoints',
    'fanSentiment': 'fanSentiment',
    'fan_sentiment': 'fanSentiment',
  }
  
  for (const [key, value] of Object.entries(effects)) {
    if (typeof value === 'number') {
      const normalizedKey = keyMap[key] || key
      normalized[normalizedKey] = value
    }
  }
  
  return normalized
}

/**
 * Parse Gemini response into EventScenario.
 * Handles varied field names that Gemini might use.
 */
function parseGeminiResponse(
  response: string, 
  activity: ScheduledActivity,
  _context: EventContext
): EventScenario | null {
  try {
    const jsonStr = extractJSON(response)
    const parsed = JSON.parse(jsonStr)
    
    // Handle varied round structures from Gemini
    const rounds = parsed.rounds || parsed.scenarios || parsed.interactions || []
    
    return {
      id: `scenario_${Date.now()}`,
      title: parsed.title || parsed.meetingTitle || parsed.scenarioTitle || activity.name,
      description: parsed.description || parsed.scene || parsed.intro || parsed.setup || activity.description,
      rounds: rounds.map((round: any, idx: number) => {
        const speaker = parseSpeaker(round)
        
        // Handle varied choice structures
        const choices = (round.choices || round.options || round.responses || []).map((choice: any, cIdx: number) => ({
          id: choice.id || `${idx + 1}${String.fromCharCode(97 + cIdx)}`,
          text: choice.text || choice.response || choice.option || choice.dialogue || '',
          tone: choice.tone || choice.style || choice.approach || 'professional',
          effects: normalizeEffects(choice.effects || choice.impact || choice.outcomes || {}),
          followUp: choice.followUp || choice.follow_up || choice.reaction || choice.consequence
        }))
        
        return {
          roundNumber: round.roundNumber || round.round || idx + 1,
          situation: round.situation || round.scene || round.context || round.setup || '',
          question: round.question || round.dialogue || round.prompt || round.text || '',
          speakerName: speaker.name,
          speakerRole: speaker.role,
          choices
        }
      }),
      totalRounds: rounds.length,
      currentRound: 0,
      status: 'pending',
      outcomes: []
    }
  } catch (error) {
    console.error('[EventGenerator] Failed to parse Gemini response:', error)
    console.error('[EventGenerator] Raw response:', response?.substring(0, 500))
    return null
  }
}

// ============================================
// FALLBACK GENERATION
// ============================================

/**
 * Apply all context placeholders to a string
 */
function applyContextReplacements(text: string, context: EventContext): string {
  return text
    .replace(/\{teamName\}/g, context.teamName)
    .replace(/\{championshipPosition\}/g, String(context.championshipPosition || 'N/A'))
    .replace(/\{teamMorale\}/g, String(context.teamMorale))
    .replace(/\{budget\}/g, `$${context.currentBudget.toLocaleString()}`)
    .replace(/\{burnRate\}/g, `$${Math.abs(context.burnRate).toLocaleString()}`)
    .replace(/\{profitLoss\}/g, context.profitLoss)
    .replace(/\{boardMood\}/g, String(context.boardMood))
    .replace(/\{driverName\}/g, context.driverName || 'your driver')
    .replace(/\{seriesName\}/g, context.seriesName || 'the championship')
    .replace(/\{venue\}/g, context.venue || 'Team HQ')
    .replace(/\{lastRacePosition\}/g, String(context.lastRacePosition || 'N/A'))
    .replace(/\{lastRaceTrack\}/g, context.lastRaceTrack || 'the last race')
    .replace(/\{mainSponsor\}/g, context.sponsorSatisfactions[0]?.name || 'your primary sponsor')
    .replace(/\{reputation\}/g, String(context.teamReputation))
}

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
  
  // Map hardcoded role titles to actual staff names (or fallback)
  const speakerNameMap: Record<string, string> = {
    'Chief Engineer': getStaffNameOrFallback('chief_engineer', 'Lead Engineer'),
    'Team Manager': getStaffNameOrFallback('team_manager', 'Operations Lead'),
    'Technical Director': getStaffNameOrFallback('technical_director', 'Technical Lead'),
    'Commercial Director': getStaffNameOrFallback('pr_manager', 'Commercial Dept.'),
    'PR Manager': getStaffNameOrFallback('pr_manager', 'PR Dept.'),
  }
  const resolveSpeaker = (name?: string): string | undefined => {
    if (!name) return undefined
    return speakerNameMap[name] ?? name
  }

  // Apply ALL context placeholders to ALL text fields
  const customizedRounds = template.rounds.map(round => ({
    ...round,
    situation: applyContextReplacements(round.situation, context),
    question: applyContextReplacements(round.question, context),
    speakerName: resolveSpeaker(round.speakerName ? applyContextReplacements(round.speakerName, context) : undefined),
    speakerRole: round.speakerRole ? applyContextReplacements(round.speakerRole, context) : undefined,
    choices: round.choices.map(choice => ({
      ...choice,
      text: applyContextReplacements(choice.text, context),
      followUp: choice.followUp ? applyContextReplacements(choice.followUp, context) : undefined
    }))
  }))
  
  return {
    id: `fallback_${Date.now()}`,
    title: applyContextReplacements(template.title.replace('{activityName}', activity.name), context),
    description: applyContextReplacements(template.description, context),
    rounds: customizedRounds,
    totalRounds: customizedRounds.length,
    currentRound: 0,
    status: 'pending',
    outcomes: []
  }
}

// Fallback scenario templates
const FALLBACK_SCENARIOS: Record<string, Omit<EventScenario, 'id' | 'status' | 'outcomes'>> = {
  'staff_interview': {
    title: 'Staff Interview - {activityName}',
    description: 'Conduct a hiring interview with a candidate for your racing team',
    totalRounds: 3,
    currentRound: 0,
    rounds: [
      {
        roundNumber: 1,
        situation: 'The candidate sits across from you in the meeting room. They seem eager but a little nervous. This is their chance to prove they belong on your team.',
        speakerName: 'You',
        speakerRole: 'Team Owner',
        question: 'The candidate adjusts their posture, ready for your first question.',
        choices: [
          { id: '1a', text: 'Tell me what specifically drew you to {teamName}, knowing we\'re still building?', tone: 'diplomatic', effects: { teamMorale: 1 }, followUp: 'I\'ve been following your team\'s journey and I love the underdog mentality. The chance to be part of something from the ground up is rare — I want to help shape this team, not just fill a seat.' },
          { id: '1b', text: 'I\'ll be direct — this role demands a lot. What makes you think you can handle the pressure of a racing environment?', tone: 'bold', effects: { boardMood: 1 }, followUp: 'Pressure is where I do my best work. In my last role, I was responsible for critical deliveries under tight deadlines every race weekend. I thrive when the stakes are high.' },
          { id: '1c', text: 'Walk me through your experience. What\'s the most relevant thing you\'ve done for a role like this?', tone: 'professional', effects: { teamMorale: 1 }, followUp: 'At my previous team, I was responsible for coordinating between departments under race-weekend pressure. I improved our turnaround time by 15% and earned the trust of both engineers and mechanics.' },
          { id: '1d', text: 'Before we get into the technical stuff — what do you do when you\'re not working? I like to know who I\'m hiring.', tone: 'friendly', effects: { teamMorale: 1 }, followUp: 'Outside of work, I\'m a bit of a sim racing addict, honestly. I also volunteer coaching a local karting team on weekends. It keeps me connected to why I love this sport.' }
        ]
      },
      {
        roundNumber: 2,
        situation: 'The candidate has warmed up and seems more confident. Time to probe their technical knowledge and problem-solving ability.',
        speakerName: 'You',
        speakerRole: 'Team Owner',
        question: 'The candidate leans forward slightly, clearly in their element now.',
        choices: [
          { id: '2a', text: 'If you had to choose between reliability and performance gains with a limited budget, how would you approach that decision?', tone: 'professional', effects: { boardMood: 1 }, followUp: 'It depends on where you are in the season. Early on, reliability builds momentum and confidence. But if you\'re chasing points, you sometimes need to take a calculated risk on performance. I\'d always want to see the data before committing either way.' },
          { id: '2b', text: 'Tell me about a time you disagreed with a colleague on a technical decision. How did you handle it?', tone: 'diplomatic', effects: { teamMorale: 1 }, followUp: 'There was a setup disagreement before a race where I thought we were too aggressive on the front wing. I presented my data calmly, listened to their reasoning, and we found a compromise. The result was better than either of our original proposals.' },
          { id: '2c', text: 'We move fast here and things change constantly. Give me an example of how you\'ve adapted to a chaotic situation.', tone: 'bold', effects: { teamMorale: 1 }, followUp: 'In my last role, our car failed scrutineering 30 minutes before a session. I reorganised the entire crew rota, sourced a replacement part, and we made it out with two minutes to spare. Chaos is just another word for opportunity if you stay calm.' },
          { id: '2d', text: 'What\'s the biggest mistake you\'ve made in your career, and what did you learn from it?', tone: 'diplomatic', effects: { boardMood: 1 }, followUp: 'I once signed off on a parts order without double-checking the spec. It cost us a testing day. I learned to never assume — always verify, especially under time pressure. It made me much more meticulous.' }
        ]
      },
      {
        roundNumber: 3,
        situation: 'The interview is drawing to a close. Time to discuss expectations, team culture, and see if this person is the right fit.',
        speakerName: 'You',
        speakerRole: 'Team Owner',
        question: 'The candidate meets your gaze steadily — they clearly want this job.',
        choices: [
          { id: '3a', text: 'Where do you see yourself in two years? What does success look like for you here?', tone: 'professional', effects: { boardMood: 1 }, followUp: 'In two years, I want to be an integral part of your race operations. Success for me means the team is performing better because I\'m here — and that my colleagues trust me completely.' },
          { id: '3b', text: 'This team is young and the culture is still forming. What would you bring to the team dynamic?', tone: 'diplomatic', effects: { teamMorale: 1 }, followUp: 'I\'m someone who lifts the mood when things get tough. I work hard, I don\'t complain, and I make sure the people around me have what they need. I think culture is built in the small moments, not the big speeches.' },
          { id: '3c', text: 'I expect total commitment from everyone here. Long hours, race weekends away, high pressure. Is that something you\'re prepared for?', tone: 'bold', effects: { boardMood: 1 }, followUp: 'Absolutely. I know what this industry demands. I didn\'t apply here looking for a 9-to-5. I want to be part of a winning team, and that takes sacrifice. I\'m ready for it.' },
          { id: '3d', text: 'Is there anything you want to ask me? Anything about the team you\'re unsure about?', tone: 'friendly', effects: { teamMorale: 1 }, followUp: 'Just one thing — what\'s your vision for this team in the next few seasons? I want to know that the ambition matches what I\'m signing up for. If it does, I\'m all in.' }
        ]
      }
    ]
  },

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
          { id: '1a', text: 'We need to be more conservative from the start. Prioritize tire life over raw pace.', tone: 'cautious', effects: { teamMorale: 1 } },
          { id: '1b', text: 'Push harder early and plan for more stops. We can make up time in pit strategy.', tone: 'bold', effects: { reputation: 1, boardMood: -1 } },
          { id: '1c', text: 'Let\'s analyze the data more carefully before jumping to conclusions. What do the numbers say?', tone: 'diplomatic', effects: { teamMorale: 1 } },
          { id: '1d', text: 'This is unacceptable. I want a full report on what went wrong by tomorrow morning.', tone: 'aggressive', effects: { teamMorale: -2, boardMood: 1 } }
        ]
      },
      {
        roundNumber: 2,
        situation: 'The strategist shifts the discussion to race strategy decisions.',
        speakerName: 'Race Strategist',
        speakerRole: 'Strategy Department',
        question: 'There was a moment where we could have undercut the car ahead. We hesitated. Should we be more aggressive with strategy calls?',
        choices: [
          { id: '2a', text: 'Yes, we need to be bolder. Fortune favors the brave in racing.', tone: 'bold', effects: { teamMorale: 1, reputation: 1 } },
          { id: '2b', text: 'The call was correct at the time. Let\'s not second-guess with hindsight.', tone: 'diplomatic', effects: { teamMorale: 1 } },
          { id: '2c', text: 'We need better real-time data to make these calls. What can we improve?', tone: 'professional', effects: { teamMorale: 1 } },
          { id: '2d', text: 'Hesitation cost us positions. I expect better next time.', tone: 'aggressive', effects: { teamMorale: -1, boardMood: 1 } }
        ]
      },
      {
        roundNumber: 3,
        situation: 'The meeting turns to preparation for the next race.',
        speakerName: 'Team Manager',
        speakerRole: 'Operations',
        question: 'Looking ahead, what should be our focus for the next race? We have limited resources to allocate.',
        choices: [
          { id: '3a', text: 'Focus on reliability. We need to finish races before we can win them.', tone: 'cautious', effects: { boardMood: 1 } },
          { id: '3b', text: 'Performance upgrades. We need more pace to compete at the front.', tone: 'bold', effects: { teamMorale: 1, boardMood: -1, budgetImpact: -5000 } },
          { id: '3c', text: 'Balance both. Let\'s be smart about where we invest our time.', tone: 'diplomatic', effects: { teamMorale: 1 } },
          { id: '3d', text: 'Whatever gets us results. I trust the technical team to decide.', tone: 'professional', effects: { teamMorale: 1 } }
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
          { id: '1a', text: 'Every dollar is accounted for. I can walk you through our strategic allocations.', tone: 'professional', effects: { boardMood: 2 } },
          { id: '1b', text: 'Racing is expensive. These investments are necessary to stay competitive.', tone: 'bold', effects: { boardMood: -1, reputation: 1 } },
          { id: '1c', text: 'I understand the concern. Let me present our cost-reduction initiatives.', tone: 'diplomatic', effects: { boardMood: 2 } },
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
          { id: '2a', text: 'We have clear development targets. I\'m confident we\'ll see improvement in the coming races.', tone: 'diplomatic', effects: { boardMood: 1 } },
          { id: '2b', text: 'Rome wasn\'t built in a day. We\'re building something sustainable here.', tone: 'bold', effects: { boardMood: -2, teamMorale: 1 } },
          { id: '2c', text: 'I share your frustration. Here\'s what we\'re changing immediately...', tone: 'professional', effects: { boardMood: 2, teamMorale: -1 } },
          { id: '2d', text: 'The team is working hard. We need patience and continued support.', tone: 'cautious', effects: { boardMood: 1, teamMorale: 1 } }
        ]
      },
      {
        roundNumber: 3,
        situation: 'The board wants to discuss future strategic direction.',
        speakerName: 'Board Chairman',
        speakerRole: 'Chairman',
        question: 'Looking at the next 6-12 months, where should our strategic focus be?',
        choices: [
          { id: '3a', text: 'Consolidation. Strengthen what we have before expanding ambitions.', tone: 'cautious', effects: { boardMood: 1, reputation: -1 } },
          { id: '3b', text: 'Growth. This is the time to be aggressive and capture market opportunities.', tone: 'bold', effects: { boardMood: -1, reputation: 1 } },
          { id: '3c', text: 'Balanced approach. Maintain stability while pursuing targeted improvements.', tone: 'diplomatic', effects: { boardMood: 2 } },
          { id: '3d', text: 'Let me prepare a detailed strategic proposal for the board to review.', tone: 'professional', effects: { boardMood: 1 } }
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
          { id: '1a', text: 'I understand completely. Let me show you our enhanced activation plans.', tone: 'diplomatic', effects: { sponsorSatisfaction: 2 } },
          { id: '1b', text: 'Our on-track performance drives brand awareness that money can\'t buy.', tone: 'bold', effects: { sponsorSatisfaction: 1, reputation: 1 } },
          { id: '1c', text: 'We\'re committed to delivering value. What specific metrics matter most to you?', tone: 'professional', effects: { sponsorSatisfaction: 2 } },
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
          { id: '2a', text: 'We offer something unique - a genuine partnership, not just logo placement.', tone: 'diplomatic', effects: { sponsorSatisfaction: 2 } },
          { id: '2b', text: 'Our trajectory is upward. Get on board now before we become expensive.', tone: 'bold', effects: { sponsorSatisfaction: 1, reputation: 1 } },
          { id: '2c', text: 'I\'d hate to see you go. What would it take to strengthen our partnership?', tone: 'friendly', effects: { sponsorSatisfaction: 2, boardMood: -1 } },
          { id: '2d', text: 'We\'ve built something together. Stability has value in this sport.', tone: 'cautious', effects: { sponsorSatisfaction: 1 } }
        ]
      },
      {
        roundNumber: 3,
        situation: 'The sponsor brings up ideas for additional activations.',
        speakerName: 'Marketing Director',
        speakerRole: 'Sponsor Representative',
        question: 'We\'d like to do a factory tour event with some key clients. Can you accommodate this?',
        choices: [
          { id: '3a', text: 'Absolutely! We\'d be delighted to host your VIP clients.', tone: 'friendly', effects: { sponsorSatisfaction: 2, teamMorale: -1 } },
          { id: '3b', text: 'We can arrange something, but it will need to work around our race schedule.', tone: 'professional', effects: { sponsorSatisfaction: 1 } },
          { id: '3c', text: 'That\'s a great idea. Let\'s discuss how to make it a premium experience.', tone: 'diplomatic', effects: { sponsorSatisfaction: 2 } },
          { id: '3d', text: 'Factory access is sensitive. We\'ll need to discuss terms separately.', tone: 'cautious', effects: { sponsorSatisfaction: 0, boardMood: 1 } }
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
          { id: '1a', text: 'I hear you. Let\'s prioritize and focus on what matters most.', tone: 'diplomatic', effects: { teamMorale: 1 } },
          { id: '1b', text: 'This is racing. Pressure is part of the job. We push through.', tone: 'bold', effects: { teamMorale: -1, boardMood: 1 } },
          { id: '1c', text: 'I\'ll see if we can bring in additional resources to help.', tone: 'friendly', effects: { teamMorale: 2, budgetImpact: -10000 } },
          { id: '1d', text: 'Let\'s review the timeline. Maybe some targets need adjustment.', tone: 'cautious', effects: { teamMorale: 1, boardMood: -1 } }
        ]
      },
      {
        roundNumber: 2,
        situation: 'A staff member raises concerns about communication between departments.',
        speakerName: 'Operations Manager',
        speakerRole: 'Operations',
        question: 'There\'s been friction between engineering and operations. Information isn\'t flowing properly. How should we address this?',
        choices: [
          { id: '2a', text: 'Let\'s set up cross-department syncs to improve communication.', tone: 'professional', effects: { teamMorale: 1 } },
          { id: '2b', text: 'We\'re all on the same team here. Let\'s put personal issues aside.', tone: 'bold', effects: { teamMorale: 1 } },
          { id: '2c', text: 'I\'ll meet with both department heads to understand the issues.', tone: 'diplomatic', effects: { teamMorale: 1 } },
          { id: '2d', text: 'Professional conduct is expected. I\'ll address any problematic behavior directly.', tone: 'aggressive', effects: { teamMorale: -2, boardMood: 1 } }
        ]
      },
      {
        roundNumber: 3,
        situation: 'The meeting concludes with discussion of upcoming challenges.',
        speakerName: 'Team Manager',
        speakerRole: 'Management',
        question: 'Any final thoughts on how we can improve as a team going forward?',
        choices: [
          { id: '3a', text: 'I\'m proud of what we\'ve achieved. Let\'s keep the momentum going.', tone: 'friendly', effects: { teamMorale: 2 } },
          { id: '3b', text: 'We have areas to improve. Let\'s be honest with ourselves and get better.', tone: 'professional', effects: { teamMorale: 1, boardMood: 1 } },
          { id: '3c', text: 'Success comes from details. Everyone needs to do their job perfectly.', tone: 'bold', effects: { teamMorale: 1 } },
          { id: '3d', text: 'We\'re a team. We win together, we lose together. That\'s our strength.', tone: 'diplomatic', effects: { teamMorale: 2 } }
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
          { id: '1a', text: 'Let\'s review each line item and identify savings opportunities.', tone: 'professional', effects: { boardMood: 2 } },
          { id: '1b', text: 'Investment now pays dividends later. We shouldn\'t cut corners.', tone: 'bold', effects: { boardMood: -1, teamMorale: 1 } },
          { id: '1c', text: 'I\'ll work with sponsors to accelerate payment schedules.', tone: 'diplomatic', effects: { boardMood: 1, sponsorSatisfaction: -1 } },
          { id: '1d', text: 'What are the non-negotiable costs vs. discretionary spending?', tone: 'cautious', effects: { boardMood: 1 } }
        ]
      },
      {
        roundNumber: 2,
        situation: 'Revenue opportunities are discussed.',
        speakerName: 'Commercial Director',
        speakerRole: 'Commercial',
        question: 'We have potential new sponsorship leads, but closing them requires investment in hospitality. Should we proceed?',
        choices: [
          { id: '2a', text: 'Yes, you have to spend money to make money. Go ahead.', tone: 'bold', effects: { boardMood: -1, budgetImpact: -15000 } },
          { id: '2b', text: 'What\'s the expected ROI? I need to see the numbers first.', tone: 'professional', effects: { boardMood: 2 } },
          { id: '2c', text: 'Let\'s start small and scale up if we see traction.', tone: 'cautious', effects: { boardMood: 1 } },
          { id: '2d', text: 'Can we do it more cost-effectively? Virtual presentations perhaps?', tone: 'diplomatic', effects: { boardMood: 1 } }
        ]
      },
      {
        roundNumber: 3,
        situation: 'Final decisions need to be made about the upcoming period.',
        speakerName: 'Financial Controller',
        speakerRole: 'Finance',
        question: 'What should be our financial priority for the next month?',
        choices: [
          { id: '3a', text: 'Preserve cash. Build reserves for unexpected challenges.', tone: 'cautious', effects: { boardMood: 2, teamMorale: -1 } },
          { id: '3b', text: 'Invest in performance. We need results to attract sponsors.', tone: 'bold', effects: { boardMood: 0, teamMorale: 1, reputation: 1 } },
          { id: '3c', text: 'Balance both. Smart spending on high-value opportunities.', tone: 'diplomatic', effects: { boardMood: 1 } },
          { id: '3d', text: 'Focus on revenue generation. More income solves all problems.', tone: 'professional', effects: { boardMood: 1, sponsorSatisfaction: -1 } }
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
          { id: '1a', text: 'We\'re working hard and improvements are coming. Stay tuned.', tone: 'diplomatic', effects: { reputation: 1 } },
          { id: '1b', text: 'Racing has ups and downs. We\'re focused on the long game.', tone: 'professional', effects: { reputation: 1 } },
          { id: '1c', text: 'We\'re not satisfied, but we know what we need to do to turn it around.', tone: 'bold', effects: { reputation: 1 } },
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
          { id: '2a', text: 'Every team has challenges. We work through them professionally.', tone: 'diplomatic', effects: { reputation: 1 } },
          { id: '2b', text: 'I don\'t comment on rumors. Next question please.', tone: 'cautious', effects: { reputation: 0 } },
          { id: '2c', text: 'The team is unified and motivated. Don\'t believe everything you read.', tone: 'bold', effects: { reputation: 1, teamMorale: 1 } },
          { id: '2d', text: 'We have a strong culture. Any differences make us stronger.', tone: 'professional', effects: { reputation: 1 } }
        ]
      },
      {
        roundNumber: 3,
        situation: 'The final question touches on future plans.',
        speakerName: 'Industry Analyst',
        speakerRole: 'Press',
        question: 'What can fans expect from {teamName} in the coming season?',
        choices: [
          { id: '3a', text: 'Exciting things are in development. We\'re building something special.', tone: 'bold', effects: { reputation: 1 } },
          { id: '3b', text: 'Consistent improvement. We\'re taking it one step at a time.', tone: 'cautious', effects: { reputation: 1 } },
          { id: '3c', text: 'We have ambitious goals and a clear plan to achieve them.', tone: 'professional', effects: { reputation: 1 } },
          { id: '3d', text: 'Great racing! That\'s what we\'re all here for, isn\'t it?', tone: 'friendly', effects: { reputation: 1 } }
        ]
      }
    ]
  },
  
  'pre_race_briefing': {
    title: 'Pre-Race Strategy Briefing - {activityName}',
    description: 'Strategy discussion before the upcoming race weekend',
    totalRounds: 3,
    currentRound: 0,
    rounds: [
      {
        roundNumber: 1,
        situation: 'The engineering team has prepared their track analysis. The chief engineer presents setup options.',
        speakerName: 'Chief Engineer',
        speakerRole: 'Technical Lead',
        question: 'Based on our simulations, we have two viable setup directions: a low-downforce config for straight-line speed, or high downforce for better sector 2 performance. Which do you prefer?',
        choices: [
          { id: '1a', text: 'Go low downforce. We need to be competitive on the straights.', tone: 'bold', effects: { driverMorale: 1 } },
          { id: '1b', text: 'High downforce. Consistent lap times win races.', tone: 'cautious', effects: { teamMorale: 1 } },
          { id: '1c', text: 'Run both in free practice and let the data decide.', tone: 'professional', effects: { teamMorale: 1, driverMorale: 1 } },
          { id: '1d', text: 'What does the driver prefer? Their confidence matters most.', tone: 'diplomatic', effects: { teamMorale: 1, driverMorale: 2 } }
        ]
      },
      {
        roundNumber: 2,
        situation: 'The driver joins the briefing and raises concerns about race pace.',
        speakerName: 'Primary Driver',
        speakerRole: 'Driver',
        question: 'I struggled with the car balance last time out. I need to feel the front end better in slow corners. Can we address this?',
        choices: [
          { id: '2a', text: 'Absolutely. We\'ll work on front-end response during FP1.', tone: 'diplomatic', effects: { driverMorale: 2 } },
          { id: '2b', text: 'The setup was optimal by the numbers. Let\'s focus on your driving approach.', tone: 'bold', effects: { driverMorale: -2, teamMorale: 1 } },
          { id: '2c', text: 'Let\'s look at the telemetry together and find a compromise.', tone: 'professional', effects: { driverMorale: 2, teamMorale: 1 } },
          { id: '2d', text: 'We hear you. What specific corner characteristics are giving you trouble?', tone: 'friendly', effects: { driverMorale: 2, teamMorale: 1 } }
        ]
      },
      {
        roundNumber: 3,
        situation: 'Weather forecasts show rain is possible for qualifying.',
        speakerName: 'Race Strategist',
        speakerRole: 'Strategy',
        question: 'There\'s a 40% chance of rain during qualifying. Should we prepare a wet-weather backup strategy or commit to our dry setup?',
        choices: [
          { id: '3a', text: 'Prepare for both. Flexibility is our advantage.', tone: 'professional', effects: { teamMorale: 1 } },
          { id: '3b', text: 'Commit to dry. The forecast isn\'t certain enough to compromise our setup.', tone: 'bold', effects: { driverMorale: -1, reputation: 1 } },
          { id: '3c', text: 'Actually, rain could be our opportunity. Let\'s optimize for mixed conditions.', tone: 'bold', effects: { driverMorale: 1, reputation: 1 } },
          { id: '3d', text: 'What does the latest forecast say? Let\'s decide closer to the time.', tone: 'cautious', effects: { teamMorale: 1 } }
        ]
      }
    ]
  },
  
  'scrutineering': {
    title: 'Technical Inspection - {activityName}',
    description: 'Car scrutineering and technical compliance check',
    totalRounds: 3,
    currentRound: 0,
    rounds: [
      {
        roundNumber: 1,
        situation: 'The FIA technical delegate is inspecting your car. They\'ve flagged a measurement on the front wing endplate.',
        speakerName: 'FIA Technical Delegate',
        speakerRole: 'Steward',
        question: 'This measurement is right at the tolerance limit. We\'re going to need a closer inspection. How would you like to proceed?',
        choices: [
          { id: '1a', text: 'Of course, inspect whatever you need. We\'re confident in our compliance.', tone: 'professional', effects: { reputation: 1 } },
          { id: '1b', text: 'It\'s within the rules. The measurements speak for themselves.', tone: 'bold', effects: { reputation: 1 } },
          { id: '1c', text: 'We\'ll adjust it to be safely within limits. No need for further scrutiny.', tone: 'cautious', effects: { reputation: 0, teamMorale: -1 } },
          { id: '1d', text: 'We designed it to maximize performance within regulations. Innovation is part of racing.', tone: 'bold', effects: { reputation: 1, boardMood: -1 } }
        ]
      },
      {
        roundNumber: 2,
        situation: 'A rival team has informally questioned your car\'s floor design to the stewards.',
        speakerName: 'Chief Mechanic',
        speakerRole: 'Technical Team',
        question: 'Word is that {teamName}\'s rival has been asking stewards to look at our floor more closely. How do we handle this?',
        choices: [
          { id: '2a', text: 'Let them look. Our design is legal and we have nothing to hide.', tone: 'professional', effects: { reputation: 1, teamMorale: 1 } },
          { id: '2b', text: 'Typical gamesmanship. Focus on our own preparation and ignore it.', tone: 'diplomatic', effects: { teamMorale: 1 } },
          { id: '2c', text: 'Maybe we should look at THEIR car more closely. Two can play that game.', tone: 'aggressive', effects: { reputation: -1, teamMorale: 1, boardMood: -1 } },
          { id: '2d', text: 'File our own data showing compliance proactively. Control the narrative.', tone: 'professional', effects: { reputation: 1, boardMood: 1 } }
        ]
      },
      {
        roundNumber: 3,
        situation: 'The inspector asks about a new development component fitted to the car.',
        speakerName: 'FIA Technical Delegate',
        speakerRole: 'Steward',
        question: 'I see you\'ve introduced a new component. Can you explain the design philosophy and confirm regulatory compliance?',
        choices: [
          { id: '3a', text: 'Provide full technical documentation and a detailed explanation.', tone: 'professional', effects: { reputation: 1 } },
          { id: '3b', text: 'It complies with the regulations. Here are the relevant drawings.', tone: 'cautious', effects: { reputation: 1 } },
          { id: '3c', text: 'I\'d rather keep the details confidential. It meets the rules - that\'s what matters.', tone: 'bold', effects: { reputation: -1, boardMood: 1 } },
          { id: '3d', text: 'Our chief designer can walk you through the concept in detail.', tone: 'diplomatic', effects: { reputation: 1 } }
        ]
      }
    ]
  },
  
  'development_session': {
    title: 'R&D Development Review - {activityName}',
    description: 'Technical development priorities and resource allocation',
    totalRounds: 3,
    currentRound: 0,
    rounds: [
      {
        roundNumber: 1,
        situation: 'The Technical Director presents three development paths for the upcoming period.',
        speakerName: 'Technical Director',
        speakerRole: 'R&D Lead',
        question: 'We can focus on aerodynamic efficiency, chassis stiffness, or powertrain mapping. Each would take our remaining dev budget. Where should we focus?',
        choices: [
          { id: '1a', text: 'Aerodynamics. That\'s where the biggest performance gains are.', tone: 'bold', effects: { teamMorale: 1, reputation: 1 } },
          { id: '1b', text: 'Chassis work. A stable platform benefits everything else.', tone: 'professional', effects: { teamMorale: 1 } },
          { id: '1c', text: 'What does the simulation data suggest? Let the numbers guide us.', tone: 'diplomatic', effects: { teamMorale: 1 } },
          { id: '1d', text: 'Can we split resources and make incremental gains in all areas?', tone: 'cautious', effects: { boardMood: 1 } }
        ]
      },
      {
        roundNumber: 2,
        situation: 'An engineer proposes a risky but potentially breakthrough innovation.',
        speakerName: 'Senior Aerodynamicist',
        speakerRole: 'Engineering',
        question: 'I\'ve been working on an unconventional design concept. It\'s untested but CFD shows significant gains. It would take 3 weeks and a meaningful portion of our budget. Worth pursuing?',
        choices: [
          { id: '2a', text: 'Innovation is how we leapfrog the competition. Go for it.', tone: 'bold', effects: { teamMorale: 1, boardMood: -2, budgetImpact: -25000 } },
          { id: '2b', text: 'Interesting, but too risky right now. Let\'s table it for next season.', tone: 'cautious', effects: { teamMorale: -1, boardMood: 1 } },
          { id: '2c', text: 'Run more simulations first. If the data holds up, we\'ll commit.', tone: 'professional', effects: { teamMorale: 1 } },
          { id: '2d', text: 'Can we test a scaled prototype without committing full resources?', tone: 'diplomatic', effects: { teamMorale: 1, budgetImpact: -10000 } }
        ]
      },
      {
        roundNumber: 3,
        situation: 'Competition for engineering resources between departments intensifies.',
        speakerName: 'Team Manager',
        speakerRole: 'Operations',
        question: 'Both the aerodynamics and chassis departments are requesting more people. We can\'t expand both. How do you resolve this?',
        choices: [
          { id: '3a', text: 'Performance comes first. Aero gets the resources this cycle.', tone: 'bold', effects: { teamMorale: -1, reputation: 1 } },
          { id: '3b', text: 'Rotate staff between projects based on the development timeline.', tone: 'diplomatic', effects: { teamMorale: 1 } },
          { id: '3c', text: 'Hire temporary contractors. The investment will pay for itself.', tone: 'professional', effects: { teamMorale: 1, budgetImpact: -20000, boardMood: -1 } },
          { id: '3d', text: 'The department heads need to agree. I won\'t pick favorites.', tone: 'cautious', effects: { teamMorale: 1 } }
        ]
      }
    ]
  },
  
  'damage_assessment': {
    title: 'Car Damage Assessment - {activityName}',
    description: 'Post-incident damage assessment and repair planning',
    totalRounds: 3,
    currentRound: 0,
    rounds: [
      {
        roundNumber: 1,
        situation: 'The chief mechanic presents the damage report after the last event. Parts are laid out in the workshop.',
        speakerName: 'Chief Mechanic',
        speakerRole: 'Garage Lead',
        question: 'The front wing is damaged and the suspension has stress fractures. We can repair the wing but the suspension needs replacing. Full replacement is expensive but safer.',
        choices: [
          { id: '1a', text: 'Replace everything. Driver safety is non-negotiable.', tone: 'professional', effects: { teamMorale: 1, budgetImpact: -30000, boardMood: -1 } },
          { id: '1b', text: 'Repair what we can, replace only what\'s critical.', tone: 'cautious', effects: { budgetImpact: -15000 } },
          { id: '1c', text: 'How confident are you in the repairs holding up for the next race?', tone: 'diplomatic', effects: { teamMorale: 1, budgetImpact: -20000 } },
          { id: '1d', text: 'We\'re on a tight budget. Make the minimum repairs needed to race.', tone: 'aggressive', effects: { teamMorale: -2, boardMood: 1, budgetImpact: -8000 } }
        ]
      },
      {
        roundNumber: 2,
        situation: 'During deeper inspection, a hidden crack is found in the monocoque.',
        speakerName: 'Chief Mechanic',
        speakerRole: 'Garage Lead',
        question: 'Bad news - we found a hairline crack in the tub. A proper repair takes a week and costs significantly. A patch job would get us to the next race but it\'s risky.',
        choices: [
          { id: '2a', text: 'Do it properly. Missing one race is better than a structural failure.', tone: 'professional', effects: { teamMorale: 1, budgetImpact: -50000, boardMood: 1 } },
          { id: '2b', text: 'Patch it. We can\'t afford to miss the next round.', tone: 'bold', effects: { teamMorale: -1, budgetImpact: -10000, driverMorale: -3 } },
          { id: '2c', text: 'Get an independent assessment. I need a second opinion before deciding.', tone: 'cautious', effects: { teamMorale: 1, budgetImpact: -5000 } },
          { id: '2d', text: 'Is there a middle ground? Can we reinforce the area without full repair?', tone: 'diplomatic', effects: { teamMorale: 1, budgetImpact: -25000 } }
        ]
      },
      {
        roundNumber: 3,
        situation: 'Spare parts need to be sourced. Overnight delivery is available at premium cost.',
        speakerName: 'Logistics Manager',
        speakerRole: 'Logistics',
        question: 'The replacement parts can be air-freighted overnight for triple the cost, or shipped standard with arrival 3 days before the next race. Which do you prefer?',
        choices: [
          { id: '3a', text: 'Rush delivery. We need maximum preparation time.', tone: 'bold', effects: { teamMorale: 1, budgetImpact: -15000 } },
          { id: '3b', text: 'Standard shipping. 3 days is enough if we plan well.', tone: 'cautious', effects: { boardMood: 1, budgetImpact: -5000 } },
          { id: '3c', text: 'Can we source from a closer supplier, even if slightly different spec?', tone: 'diplomatic', effects: { budgetImpact: -8000 } },
          { id: '3d', text: 'Rush the critical parts, standard for the rest. Be smart about it.', tone: 'professional', effects: { teamMorale: 1, budgetImpact: -10000 } }
        ]
      }
    ]
  },
  
  'mid_season_review': {
    title: 'Mid-Season Performance Review - {activityName}',
    description: 'Comprehensive review at the season halfway mark',
    totalRounds: 3,
    currentRound: 0,
    rounds: [
      {
        roundNumber: 1,
        situation: 'The board has gathered for the mid-season assessment. Charts and data fill the screens.',
        speakerName: 'Board Chairman',
        speakerRole: 'Board',
        question: 'We\'re at the halfway point. The numbers tell a story - championship position {championshipPosition}, team morale at {teamMorale}%. How do you present the first half?',
        choices: [
          { id: '1a', text: 'Be brutally honest about shortcomings and present a detailed improvement plan.', tone: 'professional', effects: { boardMood: 2, teamMorale: -2, reputation: 1 } },
          { id: '1b', text: 'Emphasize the positives and frame challenges as opportunities for the second half.', tone: 'diplomatic', effects: { boardMood: 1, teamMorale: 1 } },
          { id: '1c', text: 'Let the data speak for itself and focus discussion on forward-looking strategy.', tone: 'cautious', effects: { boardMood: 1 } },
          { id: '1d', text: 'Take full responsibility for any underperformance and demand more from yourself.', tone: 'bold', effects: { boardMood: 2, teamMorale: 1 } }
        ]
      },
      {
        roundNumber: 2,
        situation: 'The technical director outlines two possible R&D paths for the remainder of the season.',
        speakerName: 'Technical Director',
        speakerRole: 'Technical',
        question: 'We have enough budget for one major push. Option A: aggressive aero upgrade package for 3 races\' time. Option B: reliability and setup optimisation for immediate but smaller gains.',
        choices: [
          { id: '2a', text: 'Go for the aggressive upgrade. We need to make a statement in the second half.', tone: 'bold', effects: { developmentPoints: 3, teamMorale: 1, budgetImpact: -40000 } },
          { id: '2b', text: 'Focus on reliability. Consistent points finishes will serve us better.', tone: 'cautious', effects: { developmentPoints: 1, boardMood: 1 } },
          { id: '2c', text: 'Split resources - some upgrades now, save some for a targeted push later.', tone: 'diplomatic', effects: { developmentPoints: 2, budgetImpact: -20000 } },
          { id: '2d', text: 'I want to see a detailed comparison before committing. More data needed.', tone: 'professional', effects: { boardMood: 1, developmentPoints: 1 } }
        ]
      },
      {
        roundNumber: 3,
        situation: 'Discussion turns to staff and operational performance for the second half of the season.',
        speakerName: 'Team Manager',
        speakerRole: 'Management',
        question: 'Some staff are showing signs of fatigue after a gruelling first half. Morale is mixed. What\'s your approach for keeping the team sharp?',
        choices: [
          { id: '3a', text: 'Announce performance bonuses for strong second-half results. Money talks.', tone: 'bold', effects: { teamMorale: 2, budgetImpact: -25000, boardMood: -1 } },
          { id: '3b', text: 'Restructure schedules to reduce fatigue. Rest is an investment.', tone: 'professional', effects: { teamMorale: 2, boardMood: 1 } },
          { id: '3c', text: 'Organise a team-building event. We need to reconnect as a unit.', tone: 'diplomatic', effects: { teamMorale: 1, budgetImpact: -5000 } },
          { id: '3d', text: 'Keep pushing. Championships aren\'t won by slowing down. The team will thank us later.', tone: 'aggressive', effects: { teamMorale: -2, boardMood: 1, developmentPoints: 1 } }
        ]
      }
    ]
  },
  
  'end_of_season': {
    title: 'End of Season Wrap-up - {activityName}',
    description: 'Season-ending celebration, review, and planning for next year',
    totalRounds: 3,
    currentRound: 0,
    rounds: [
      {
        roundNumber: 1,
        situation: 'The team gathers at the factory for the end-of-season dinner. Everyone is reflecting on the year.',
        speakerName: 'Team Manager',
        speakerRole: 'Management',
        question: 'The room is full - drivers, engineers, mechanics, sponsors. All eyes on you for the closing speech of the season. What\'s your message?',
        choices: [
          { id: '1a', text: 'Heartfelt gratitude. Thank every single person by department and highlight their contributions.', tone: 'diplomatic', effects: { teamMorale: 3, driverMorale: 2, reputation: 1 } },
          { id: '1b', text: 'Data-driven season recap. Show the progression, the improvements, the hard facts of growth.', tone: 'professional', effects: { teamMorale: 1, boardMood: 2 } },
          { id: '1c', text: 'Motivational fire. "This was just the beginning. Next year, we go for the title."', tone: 'bold', effects: { teamMorale: 2, driverMorale: 2, boardMood: 1 } },
          { id: '1d', text: 'Keep it short and let the team celebrate. Actions next year will speak louder than words.', tone: 'cautious', effects: { teamMorale: 2, driverMorale: 1 } }
        ]
      },
      {
        roundNumber: 2,
        situation: 'After dinner, your lead driver pulls you aside for a private conversation.',
        speakerName: 'Lead Driver',
        speakerRole: 'Driver',
        question: 'I want to talk about next year. Other teams have been asking about my availability. I love this team, but I need to know the plan. What can you tell me?',
        choices: [
          { id: '2a', text: 'Promise significant car improvements and a bigger budget allocation for next season.', tone: 'bold', effects: { driverMorale: 3, boardMood: -2, budgetImpact: -10000 } },
          { id: '2b', text: 'Be honest about where we stand but express your commitment to the partnership.', tone: 'professional', effects: { driverMorale: 2, boardMood: 1 } },
          { id: '2c', text: 'Remind them of the project we\'re building together. Loyalty and patience will pay off.', tone: 'diplomatic', effects: { driverMorale: 2, teamMorale: 1 } },
          { id: '2d', text: 'If they want to leave, that\'s their choice. We\'ll replace them with someone hungry.', tone: 'aggressive', effects: { driverMorale: -4, boardMood: 1, teamMorale: -2 } }
        ]
      },
      {
        roundNumber: 3,
        situation: 'The next morning, a boardroom meeting to set next year\'s strategic direction.',
        speakerName: 'Board Chairman',
        speakerRole: 'Board',
        question: 'The budget for next year is being finalised. We need a clear strategic direction. What\'s your vision?',
        choices: [
          { id: '3a', text: 'Aggressive expansion - bigger team, more resources, aim for the top.', tone: 'bold', effects: { boardMood: 1, teamMorale: 2, budgetImpact: -50000, developmentPoints: 3 } },
          { id: '3b', text: 'Consolidation - fix our weaknesses, improve reliability, build a solid foundation.', tone: 'professional', effects: { boardMood: 2, teamMorale: 1, developmentPoints: 2 } },
          { id: '3c', text: 'Complete technical overhaul - new design philosophy, different approach to the regulations.', tone: 'bold', effects: { boardMood: -1, teamMorale: 1, developmentPoints: 4, budgetImpact: -40000 } },
          { id: '3d', text: 'Follow the money - focus investments where sponsor ROI is highest.', tone: 'cautious', effects: { boardMood: 2, sponsorSatisfaction: 3, reputation: 1 } }
        ]
      }
    ]
  },

  'onboarding_meeting': {
    title: 'Onboarding - {activityName}',
    description: 'New team owner orientation session',
    totalRounds: 3,
    currentRound: 0,
    rounds: [
      {
        roundNumber: 1,
        situation: 'You sit at your desk in the newly acquired office. A welcome pack with the team\'s operations manual, org chart, and key contacts sits in front of you. Time to get oriented.',
        speakerName: 'Onboarding Guide',
        speakerRole: 'Orientation',
        question: 'Welcome to {teamName}. As the new owner, how would you like to start familiarising yourself with the team\'s operations?',
        choices: [
          { id: '1a', text: 'Read through every document methodically. I want to understand every process before making decisions.', tone: 'professional', effects: { boardMood: 2 } },
          { id: '1b', text: 'Skip the paperwork — I\'ll learn by doing. What\'s the most urgent thing right now?', tone: 'bold', effects: { teamMorale: 1 } },
          { id: '1c', text: 'Focus on the financials first. I need to understand our budget and runway.', tone: 'cautious', effects: { boardMood: 2 } },
          { id: '1d', text: 'Ask around. Talk to people, get a feel for the team culture and morale.', tone: 'diplomatic', effects: { teamMorale: 2 } }
        ]
      },
      {
        roundNumber: 2,
        situation: 'You\'ve been reviewing the team\'s current state. There are clear areas that need attention — staffing, sponsorship, car development. But resources are limited.',
        speakerName: 'Onboarding Guide',
        speakerRole: 'Orientation',
        question: 'You can\'t do everything at once. What\'s your first priority as the new team owner?',
        choices: [
          { id: '2a', text: 'Hiring key staff. We need people before we can do anything else.', tone: 'professional', effects: { boardMood: 1, teamMorale: 1 } },
          { id: '2b', text: 'Finding sponsors. Money is the foundation of everything in this sport.', tone: 'cautious', effects: { boardMood: 2 } },
          { id: '2c', text: 'Car performance. Everything else supports getting faster on track.', tone: 'bold', effects: { teamMorale: 1 } },
          { id: '2d', text: 'Building a culture. I want this team to be somewhere people are proud to work.', tone: 'diplomatic', effects: { teamMorale: 2 } }
        ]
      },
      {
        roundNumber: 3,
        situation: 'The orientation session wraps up. You have a clearer picture of where things stand and what needs to happen next.',
        speakerName: 'Onboarding Guide',
        speakerRole: 'Orientation',
        question: 'Any final thoughts on your approach to leading this team?',
        choices: [
          { id: '3a', text: 'I\'m going to be hands-on with every decision until I fully understand this team.', tone: 'professional', effects: { boardMood: 1, teamMorale: 1 } },
          { id: '3b', text: 'I\'ll delegate to experts as I hire them. My job is vision and direction, not micromanaging.', tone: 'diplomatic', effects: { boardMood: 2 } },
          { id: '3c', text: 'Results will speak for themselves. Let\'s stop talking and start executing.', tone: 'bold', effects: { teamMorale: 2 } },
          { id: '3d', text: 'Steady and sustainable growth. No rushed decisions — we build this properly.', tone: 'cautious', effects: { boardMood: 2 } }
        ]
      }
    ]
  },

  'personal_activity': {
    title: '{activityName}',
    description: 'A personal activity outside of team operations',
    totalRounds: 3,
    currentRound: 0,
    rounds: [
      {
        roundNumber: 1,
        situation: 'You arrive at the venue for {activityName}. It\'s a change of pace from the intensity of running a racing team.',
        speakerName: 'You',
        speakerRole: 'Personal',
        question: 'How do you approach this personal time?',
        choices: [
          { id: '1a', text: 'Fully disconnect from work. This is me-time and I\'m going to enjoy it.', tone: 'diplomatic', effects: { reputation: 1 } },
          { id: '1b', text: 'Keep it balanced — enjoy myself but stay available if the team needs me.', tone: 'professional', effects: { reputation: 1 } },
          { id: '1c', text: 'Use this as a networking opportunity. Every interaction is a chance to build connections.', tone: 'bold', effects: { reputation: 2 } },
          { id: '1d', text: 'Keep it short. I have too much on my plate to be spending time away from the team.', tone: 'cautious', effects: { boardMood: 1 } }
        ]
      },
      {
        roundNumber: 2,
        situation: 'During the activity, someone recognises you as a team owner and strikes up a conversation about motorsport.',
        speakerName: 'Acquaintance',
        speakerRole: 'Social Contact',
        question: 'They seem genuinely interested in your team and ask what you\'re building. How do you respond?',
        choices: [
          { id: '2a', text: 'Share your vision enthusiastically. You never know who might become a fan, sponsor, or ally.', tone: 'bold', effects: { reputation: 2 } },
          { id: '2b', text: 'Keep it modest. Underpromise and overdeliver — that\'s your style.', tone: 'cautious', effects: { reputation: 1 } },
          { id: '2c', text: 'Politely redirect the conversation. This is personal time, not a pitch meeting.', tone: 'diplomatic', effects: {} },
          { id: '2d', text: 'Exchange contact details. You can follow up properly during business hours.', tone: 'professional', effects: { reputation: 1 } }
        ]
      },
      {
        roundNumber: 3,
        situation: 'The activity wraps up. You reflect on the time spent away from the paddock.',
        speakerName: 'You',
        speakerRole: 'Personal',
        question: 'How do you feel heading back to team duties?',
        choices: [
          { id: '3a', text: 'Refreshed and energised. This was exactly what I needed.', tone: 'diplomatic', effects: { reputation: 1 } },
          { id: '3b', text: 'Motivated by new connections made. Time well invested.', tone: 'professional', effects: { reputation: 1 } },
          { id: '3c', text: 'Fired up. Ready to get back and push harder than ever.', tone: 'bold', effects: { teamMorale: 1 } },
          { id: '3d', text: 'Thoughtful. This perspective helps me make better decisions for the team.', tone: 'cautious', effects: { boardMood: 1 } }
        ]
      }
    ]
  }
}

// ============================================
// ACTIVITY COMPLETION NARRATIVE GENERATION
// ============================================

/**
 * Pre-written fallback narratives for auto-complete activities.
 * Used when Gemini API is unavailable.
 */
const FALLBACK_NARRATIVES: Record<string, string> = {
  'onboarding_facility_walkthrough':
    'You walked the factory floor, meeting engineers and mechanics at their stations. The smell of carbon fibre and machine oil filled the air as your team showed you the workshop, wind tunnel area, and design offices. You left with a much better feel for the team\'s working environment and daily operations.',
  'onboarding_inbox_comms':
    'The IT team walked you through the communication systems — email categories, priority flags, and action items. You now have a clear process for staying on top of the daily flood of messages that come with running a racing team.',
  'onboarding_calendar_time':
    'Your operations manager explained how the calendar system works — mandatory activities, optional ones, and how your time budget shapes each day. Understanding how to manage your hours is going to be crucial for juggling the demands of team ownership.',
  'onboarding_garage_car_intro':
    'The chief mechanic gave you a tour of the garage. You saw the car up close, examined the current setup, and learned about the maintenance cycles. The engineers explained driver assignments and how car development feeds into race-weekend preparation.',
  'onboarding_media_pr_intro':
    'Your press officer briefed you on the media landscape — how to handle journalists, social media strategy, and the importance of controlling your public image. In this sport, what you say off the track matters almost as much as what happens on it.',
  'onboarding_week1_wrap':
    'You gathered the key staff for a quick end-of-week check-in. Everyone shared their highlights and concerns from the first week. It was brief but useful — the team seems cautiously optimistic about the direction you\'re taking things.',
  'onboarding_gym_fitness':
    'You hit the gym for a solid session. A mix of cardio and strength work left you feeling sharp and energised. Staying physically fit isn\'t just about race readiness — it helps you stay mentally sharp during long, demanding days at the factory.',
  'onboarding_social_media_obligation':
    'You spent time crafting posts and engaging with followers online. A few behind-the-scenes shots from the factory went down well. Building your social media presence is a slow burn, but sponsors are always watching the engagement numbers.',
  'onboarding_safety_briefing':
    'The safety officer ran through mandatory compliance protocols — fire procedures, pit lane safety, and emergency contacts. It\'s not the most exciting part of the job, but it\'s essential and the FIA takes it seriously.',
  'onboarding_photo_shoot':
    'The photographer captured your official team portraits — solo shots, team group photos, and some candid workshop images. These will be used for sponsor decks, media packs, and the team\'s official branding materials.',
  'onboarding_partner_dinner':
    'You had a quiet dinner away from the racing world. Good food, good conversation, and a chance to decompress. Balancing the intensity of team ownership with personal relationships is going to be an ongoing challenge, but nights like this help.',
  'onboarding_attract_sponsors_session':
    'The commercial team ran through fan engagement strategies and how to make the team more attractive to sponsors. You discussed social media metrics, event activations, and what brands look for when choosing a motorsport partnership.',
}

/**
 * Generate a short AI-powered narrative summary for an activity that was
 * auto-completed (no interactive gameplay). Falls back to pre-written
 * templates when the Gemini API is unavailable.
 */
export async function generateCompletionNarrative(
  activity: ScheduledActivity
): Promise<string> {
  const fallback = FALLBACK_NARRATIVES[activity.templateId]
    || `You completed ${activity.name}. ${activity.description || 'The activity went as expected and the team appreciated your involvement.'}`

  // Try Gemini first
  const keys = getRotatedApiKeys()
  if (keys.length === 0) {
    console.log('[CompletionNarrative] No Gemini API keys, using fallback')
    return fallback
  }

  try {
    // Build minimal context
    const state = useCareerStore.getState()
    const teamName = state.careerState?.ownedTeam?.name || 'your racing team'
    const playerName = state.player
      ? `${state.player.firstName} ${state.player.lastName}`.trim()
      : 'the team owner'
    const week = state.careerState?.currentWeek ?? 1

    const prompt = `Generate a 2-3 sentence narrative summary of what happened during this motorsport team management activity. Write from the second-person perspective ("You ...") of the team owner/principal who just completed it. Be specific, immersive, and brief. Do NOT use any formatting, markdown, or bullet points — just plain prose sentences.

Activity: "${activity.name}"
Description: "${activity.description || 'N/A'}"
Team: "${teamName}"
Owner: "${playerName}"
Season week: ${week}

Respond with ONLY the narrative text, nothing else.`

    const contentRaw = await callGeminiWithRotation(keys, {
      model: 'gemini-2.0-flash',
      messages: [
        {
          role: 'system',
          content: 'You are a creative writer for a motorsport management game. Write brief, immersive narrative summaries. Respond with plain text only — no JSON, no markdown, no formatting.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.85
    }, '[CompletionNarrative]')

    const content = contentRaw?.trim()

    if (!content || content.length < 20) {
      console.warn('[CompletionNarrative] Gemini returned empty/short content')
      return fallback
    }

    console.log('[CompletionNarrative] AI narrative generated successfully')
    return content
  } catch (error) {
    console.error('[CompletionNarrative] Error generating narrative:', error)
    return fallback
  }
}

// ============================================
// ACTIVITY OUTCOME NARRATIVE GENERATOR
// ============================================
// Generates AI-powered narratives for the ActivityOutcomeModal.
// Produces category-aware, relationship-aware, context-rich summaries
// of how a personal/lifestyle/social activity went.

export interface ActivityOutcomeContext {
  category: ActivityCategory
  subcategory?: string             // e.g., 'dining', 'romantic', 'casual' for social
  activityName: string
  activityDescription?: string
  contactName?: string             // Who the activity was with (social/romance)
  contactType?: string             // 'partner', 'friend', 'business', etc.
  petName?: string                 // For pet activities
  petType?: string
  hobbyName?: string               // For hobby activities
  hobbyLevel?: number
  courseName?: string              // For education activities
  courseProgress?: string           // e.g., "Module 3/8"
  workoutType?: string             // For fitness activities
  outcomeQuality: 'great' | 'good' | 'neutral' | 'poor'
  // Relationship context (social/romance)
  relationshipLevel?: number       // 0-100
  loveLanguageMatch?: boolean
  sharedInterests?: string[]
  bonusMultiplier?: number
  // Effects that were applied
  effects: Record<string, number>  // e.g., { affection: 3, trust: 1.5, stressReduction: 8 }
}

// Fallback narrative templates per category (used when no API key)
const OUTCOME_FALLBACK_NARRATIVES: Record<string, Record<string, string[]>> = {
  social: {
    great: [
      'An absolutely wonderful time. The conversation flowed naturally and you both left in great spirits.',
      'Everything clicked perfectly. Great food, great company, great memories.',
      'One of those rare outings where everything just works. You could tell they had an amazing time too.',
    ],
    good: [
      'A pleasant outing with good conversation and a relaxed atmosphere.',
      'An enjoyable time together. Nothing dramatic, just a solid catch-up.',
      'A nice change of pace. You both seemed to appreciate the quality time.',
    ],
    neutral: [
      'A quiet outing. Pleasant enough, but nothing particularly memorable.',
      'You spent time together as planned. It was fine, if a bit uneventful.',
    ],
    poor: [
      'The timing felt off today. Awkward silences crept in more than you\'d like.',
      'Not your best outing. The vibe was a bit strained and you both seemed distracted.',
    ],
  },
  romance: {
    great: [
      'A truly magical evening. Every glance, every laugh, every quiet moment felt electric. You could see the happiness in their eyes.',
      'The kind of date you\'ll both remember. There was a warmth between you that made the world feel smaller and more perfect.',
      'An unforgettable time together. The connection between you deepened in ways that words can\'t quite capture.',
    ],
    good: [
      'A lovely date. You enjoyed each other\'s company and the romance was very much alive.',
      'A sweet evening together. Nothing over the top, but the genuine affection was clear.',
      'A really nice time. You both left feeling closer and more appreciated.',
    ],
    neutral: [
      'A pleasant date, though neither of you seemed fully present. Life\'s distractions crept in.',
      'An okay evening. The spark was there but muted -- perhaps you were both just tired.',
    ],
    poor: [
      'A tense evening. Something felt off between you and the conversation kept stalling.',
      'Not the date either of you had hoped for. The mood was flat and you both seemed relieved when it ended.',
    ],
  },
  family: {
    great: [
      'A wonderful family moment that you\'ll treasure. Everyone was laughing and genuinely happy.',
      'Quality time at its finest. These are the moments that make everything else worthwhile.',
    ],
    good: [
      'A pleasant family outing. Good bonding time that strengthened your connection.',
      'Time well spent with family. Simple moments, but meaningful ones.',
    ],
    neutral: [
      'A routine family activity. Nice to spend time together, even if it was uneventful.',
    ],
    poor: [
      'A challenging family moment. Tensions ran a bit high, but at least you showed up.',
    ],
  },
  fitness: {
    great: [
      'An outstanding session. You pushed through your limits and felt the rush of genuine progress.',
      'You crushed it today. Every rep, every set felt dialled in. Peak performance.',
    ],
    good: [
      'A solid workout. You put in honest effort and your body responded well.',
      'A good session. Consistent work that will pay dividends on race day.',
    ],
    neutral: [
      'An average session. You went through the motions but your heart wasn\'t fully in it today.',
    ],
    poor: [
      'A tough day. Your energy was low and the workout felt like a slog from start to finish.',
    ],
  },
  wellness: {
    great: [
      'A deeply restorative experience. You feel recharged and mentally clear.',
      'Exactly what you needed. The tension melted away and you left feeling like a new person.',
    ],
    good: [
      'A beneficial session. You feel noticeably better -- calmer and more grounded.',
      'A good investment in your wellbeing. The effects are subtle but real.',
    ],
    neutral: [
      'A standard session. Helpful in a maintenance sort of way, even if not transformative.',
    ],
    poor: [
      'You struggled to switch off today. The session helped a little, but your mind kept racing.',
    ],
  },
  education: {
    great: [
      'A breakthrough study session. Concepts that were murky suddenly became crystal clear.',
      'Everything clicked today. You absorbed the material quickly and feel genuinely smarter.',
    ],
    good: [
      'A productive session. You made solid progress through the material.',
      'Good, steady work. You can feel your understanding deepening with each session.',
    ],
    neutral: [
      'A routine study session. The material was dense but you chipped away at it.',
    ],
    poor: [
      'A frustrating session. The material wasn\'t sticking and your concentration kept drifting.',
    ],
  },
  hobby: {
    great: [
      'An inspired session. You surprised yourself with how much you\'ve improved.',
      'You were in the zone today. Time flew by and the results speak for themselves.',
    ],
    good: [
      'A satisfying practice session. Steady progress and a welcome break from racing.',
      'Good time spent on your hobby. You can feel the skill building session by session.',
    ],
    neutral: [
      'A quiet practice session. Nothing spectacular, but consistency is what matters.',
    ],
    poor: [
      'A frustrating session. Nothing seemed to go right and you left feeling a bit discouraged.',
    ],
  },
  pet: {
    great: [
      'A beautiful time with your companion. Their excitement was infectious and your stress just melted away.',
      'Pure joy. Your pet was in the best mood and the bond between you felt stronger than ever.',
    ],
    good: [
      'Quality time with your pet. A gentle reminder of the simple pleasures in life.',
      'A nice, relaxed session with your companion. They seemed happy and so did you.',
    ],
    neutral: [
      'Time spent with your pet as usual. Comfortable and routine, which isn\'t a bad thing.',
    ],
    poor: [
      'Your pet seemed a bit off today, and honestly so were you. Not the best session.',
    ],
  },
}

/**
 * Generate an AI-powered narrative for activity outcome.
 * Falls back to template-based narratives when Gemini API is unavailable.
 */
export async function generateActivityOutcomeNarrative(
  context: ActivityOutcomeContext
): Promise<string> {
  // Build fallback from templates
  const categoryTemplates = OUTCOME_FALLBACK_NARRATIVES[context.category] || OUTCOME_FALLBACK_NARRATIVES.social
  const qualityTemplates = categoryTemplates?.[context.outcomeQuality] || categoryTemplates?.good || ['The activity went as expected.']
  const fallbackTemplate = qualityTemplates[Math.floor(Math.random() * qualityTemplates.length)]
  
  // Simple variable replacement for fallback
  const fallback = fallbackTemplate
    .replace(/{contact}/g, context.contactName || 'your companion')
    .replace(/{petName}/g, context.petName || 'your pet')
    .replace(/{hobbyName}/g, context.hobbyName || 'your hobby')
    .replace(/{courseName}/g, context.courseName || 'the course')

  // Try Gemini first
  const keys = getRotatedApiKeys()
  if (keys.length === 0) {
    console.log('[ActivityOutcome] No Gemini API keys, using fallback')
    return fallback
  }

  try {
    const state = useCareerStore.getState()
    const playerName = state.player
      ? `${state.player.firstName} ${state.player.lastName}`.trim()
      : 'the team owner'
    const teamName = state.careerState?.ownedTeam?.name || 'your racing team'

    // Build rich context for the AI
    let contextDetails = ''
    if (context.contactName) {
      contextDetails += `\nCompanion: "${context.contactName}" (${context.contactType || 'contact'})`
      if (context.relationshipLevel !== undefined) {
        contextDetails += `\nRelationship level: ${context.relationshipLevel}/100`
      }
      if (context.loveLanguageMatch) {
        contextDetails += `\nThe activity matched their love language — they responded especially well`
      }
      if (context.sharedInterests && context.sharedInterests.length > 0) {
        contextDetails += `\nShared interests that enhanced the experience: ${context.sharedInterests.join(', ')}`
      }
    }
    if (context.petName) {
      contextDetails += `\nPet: "${context.petName}" (${context.petType || 'pet'})`
    }
    if (context.hobbyName) {
      contextDetails += `\nHobby: "${context.hobbyName}" (skill level: ${context.hobbyLevel || 'beginner'})`
    }
    if (context.courseName) {
      contextDetails += `\nCourse: "${context.courseName}" (progress: ${context.courseProgress || 'ongoing'})`
    }
    if (context.workoutType) {
      contextDetails += `\nWorkout type: "${context.workoutType}"`
    }

    // Build effects summary for the AI
    const effectsSummary = Object.entries(context.effects)
      .filter(([, v]) => v !== 0)
      .map(([k, v]) => `${k}: ${v > 0 ? '+' : ''}${v}`)
      .join(', ')

    const categoryDescriptions: Record<string, string> = {
      social: 'a social outing with someone from their personal life',
      romance: 'a romantic date or intimate moment with their partner/love interest',
      family: 'family time (parenting, bonding, or a family milestone)',
      fitness: 'a physical training or workout session',
      wellness: 'a health, wellness, or recovery activity (spa, therapy, medical)',
      education: 'a study or learning session for personal development',
      hobby: 'practicing a personal hobby outside of racing',
      pet: 'spending time with their pet',
    }

    const prompt = `Generate a 2-3 sentence narrative about how this personal activity went for a motorsport team owner. Write from the second-person perspective ("You ..."). The tone should match the outcome quality: "${context.outcomeQuality}". Be specific, immersive, and emotionally resonant. Do NOT use any formatting, markdown, or bullet points — just plain prose.

Activity: "${context.activityName}"
Description: "${context.activityDescription || 'N/A'}"
Category: ${categoryDescriptions[context.category] || context.category}
Outcome quality: ${context.outcomeQuality}
Player: "${playerName}" (owner of ${teamName})${contextDetails}
Effects: ${effectsSummary || 'minor positive effects'}

Respond with ONLY the narrative text, nothing else.`

    const contentRaw = await callGeminiWithRotation(keys, {
      model: 'gemini-2.0-flash',
      messages: [
        {
          role: 'system',
          content: 'You are a creative writer for a motorsport management game. Write brief, emotionally resonant narrative summaries for personal life activities. These should feel human and grounded, not corporate. Respond with plain text only — no JSON, no markdown, no formatting.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 250,
      temperature: 0.9
    }, '[ActivityOutcome]')

    const content = contentRaw?.trim()

    if (!content || content.length < 20) {
      console.warn('[ActivityOutcome] Gemini returned empty/short content')
      return fallback
    }

    console.log('[ActivityOutcome] AI narrative generated successfully')
    return content
  } catch (error) {
    console.error('[ActivityOutcome] Error generating narrative:', error)
    return fallback
  }
}

// Types are already exported above, no need to re-export
