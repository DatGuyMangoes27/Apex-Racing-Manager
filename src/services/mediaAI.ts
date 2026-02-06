/**
 * Media AI Service
 * 
 * Uses Gemini Flash to dynamically generate press conference questions,
 * response options, and headlines. Keeps media interactions fresh and unpredictable.
 */

import { MediaTone, MediaPersona, MEDIA_REP_MULTIPLIERS } from '@/store/careerStore'

// ============================================
// TYPES
// ============================================

export interface PressConferenceContext {
  eventType: 'pre_race' | 'post_race_win' | 'post_race_podium' | 'post_race_dnf' | 'post_race_finish' | 'milestone_first_win' | 'milestone_first_podium' | 'milestone_championship' | 'contract_signed'
  playerName: string
  teamName: string
  seriesName: string
  seriesTier: string
  lastRaceResult?: { position: number; trackName: string; dnf?: boolean }
  rivalName?: string
  rivalIncident?: string
  currentStreak?: string
  controversyContext?: string
  mediaPersona?: MediaPersona
  recentHeadlines?: string[]
  trackName?: string
  championshipPosition?: number
}

export interface GeneratedResponseOption {
  id: string
  text: string
  tone: MediaTone
  // Hidden from player - determined by AI within constrained ranges
  hiddenEffects: {
    repEffect: number      // -0.3 to +0.1 (before tier scaling)
    rivalEffect?: number   // -0.2 to +0.1 if mentions rival
    teamEffect?: number    // -0.2 to +0.1 team satisfaction
    sponsorRisk?: boolean  // Could slightly upset sponsors
    controversyAdd?: number // 0-10 points to add to controversy level
  }
}

export interface GeneratedQuestion {
  id: string
  question: string
  context: string  // "The journalist leans in..."
  options: GeneratedResponseOption[]
  rivalMentioned?: string  // If this question involves a rival
}

export interface GeneratedHeadline {
  headline: string
  outlet: string
  sentiment: 'positive' | 'neutral' | 'negative' | 'controversial'
  rivalResponse?: string  // If rival responded to your statement
}

// ============================================
// COMPREHENSIVE GAME CONTEXT FOR AI GENERATION
// ============================================

/**
 * Rich game context passed to all AI generation functions
 * Contains team state, drivers, sponsors, cars, and recent performance
 */
export interface ComprehensiveGameContext {
  // Team basics
  teamName: string
  teamTier: 'amateur' | 'semi-pro' | 'professional' | 'elite'
  teamReputation: number      // 0-100
  
  // Satisfaction levels
  boardMood: number           // 0-100 - Board satisfaction
  teamMorale: number          // 0-100 - Average staff morale
  fanSentiment: number        // 0-100 - Fan sentiment
  
  // Financial state
  cashBalance: number
  isInDebt: boolean
  budgetPressure: 'low' | 'medium' | 'high' | 'critical'
  
  // Driver info
  primaryDriver?: {
    name: string
    position?: number         // Championship position
    wins: number
    podiums: number
    morale: number
    recentForm: 'improving' | 'consistent' | 'declining' | 'unknown'
  }
  secondDriver?: {
    name: string
    position?: number
    wins: number
    podiums: number
    satisfaction: number      // Contract satisfaction
  }
  
  // Car/Vehicle info
  carPerformance?: number     // 0-100
  carReliability?: number     // 0-100
  carCondition: 'excellent' | 'good' | 'fair' | 'poor'
  recentUpgrades?: string[]   // Recent development upgrades
  
  // Sponsors
  sponsors: Array<{
    name: string
    satisfaction: number      // 0-100
    isNewThisSeason: boolean
    slot: string             // 'title' | 'major' | 'associate' etc
  }>
  hasUnsatisfiedSponsors: boolean
  pendingSponsorDeals: number
  
  // Board targets
  boardTargets?: Array<{
    type: string              // 'championship_position' | 'wins' | 'points' etc
    target: number
    current: number
    onTrack: boolean
  }>
  
  // Season performance
  currentWeek: number
  currentYear: number
  isRaceWeek: boolean
  trackName?: string
  lastRaceResult?: {
    position: number
    trackName: string
    hadIncident: boolean
    gainedPositions?: number
  }
  championshipPosition?: number
  pointsToLeader?: number
  seasonWins: number
  seasonPodiums: number
  
  // Narrative context
  currentNarrative?: 'underdog_rise' | 'championship_push' | 'rebuilding' | 'crisis' | 'dominant' | 'dark_horse' | 'declining' | 'neutral'
  hasActiveControversy: boolean
  controversyTopic?: string
  
  // Recent events
  recentHeadlines?: string[]
  recentAchievements?: string[]  // 'first_win', 'new_sponsor', 'upgrade_complete' etc
}

/**
 * Build comprehensive context from game state
 */
export function buildComprehensiveContext(
  team: any,
  careerState: any,
  mediaState?: any
): ComprehensiveGameContext {
  // Calculate team morale from staff
  const staffMorale = team.staff?.length > 0
    ? Math.round(team.staff.reduce((sum: number, s: any) => sum + (s.morale || 70), 0) / team.staff.length)
    : 70
  
  // Budget pressure calculation
  const cash = team.budgets?.cash || 0
  const weeklyBurn = team.budgets?.weeklyBurnRate || 5000
  const weeksOfRunway = weeklyBurn > 0 ? cash / weeklyBurn : 999
  const budgetPressure = weeksOfRunway < 4 ? 'critical' : weeksOfRunway < 8 ? 'high' : weeksOfRunway < 16 ? 'medium' : 'low'
  
  // Car condition from wear
  const cars = careerState.cars || []
  const primaryCar = cars[0]
  const avgWear = primaryCar?.partWear 
    ? Object.values(primaryCar.partWear).reduce((sum: number, v: any) => sum + (typeof v === 'number' ? v : 0), 0) / 6
    : 0
  const carCondition = avgWear < 20 ? 'excellent' : avgWear < 40 ? 'good' : avgWear < 60 ? 'fair' : 'poor'
  
  // Check for unsatisfied sponsors
  const sponsors = team.finances?.sponsors || []
  const hasUnsatisfiedSponsors = sponsors.some((s: any) => s.satisfaction < 50)
  
  // Get primary driver (the player)
  const player = careerState.rpgState?.player
  const seasonResults = careerState.seasonResults
  
  // Get hired driver
  const hiredDriver = team.drivers?.[0]
  
  return {
    teamName: team.name,
    teamTier: team.tier || 'amateur',
    teamReputation: team.reputation || 50,
    
    boardMood: team.boardMood || 50,
    teamMorale: staffMorale,
    fanSentiment: team.fanSentiment || mediaState?.fanSentiment || 50,
    
    cashBalance: cash,
    isInDebt: cash < 0,
    budgetPressure,
    
    primaryDriver: player ? {
      name: player.name || 'You',
      position: seasonResults?.championshipPosition,
      wins: seasonResults?.wins || 0,
      podiums: seasonResults?.podiums || 0,
      morale: player.mentalState?.morale || 70,
      recentForm: seasonResults?.recentResults?.length > 2 
        ? (seasonResults.recentResults.slice(-3).every((r: number) => r <= 5) ? 'improving' : 'consistent')
        : 'unknown'
    } : undefined,
    
    secondDriver: hiredDriver ? {
      name: hiredDriver.name || 'Teammate',
      position: hiredDriver.seasonStats?.avgFinish ? Math.round(hiredDriver.seasonStats.avgFinish) : undefined,
      wins: hiredDriver.seasonStats?.wins || 0,
      podiums: hiredDriver.seasonStats?.podiums || 0,
      satisfaction: hiredDriver.contract?.satisfaction || 70
    } : undefined,
    
    carPerformance: primaryCar?.performance,
    carReliability: primaryCar?.reliability,
    carCondition,
    recentUpgrades: careerState.teamDevelopment?.completedUpgrades?.slice(-3).map((u: any) => u.name),
    
    sponsors: sponsors.map((s: any) => ({
      name: s.sponsorName,
      satisfaction: s.satisfaction || 70,
      isNewThisSeason: s.startYear === careerState.currentYear,
      slot: s.slot || 'associate'
    })),
    hasUnsatisfiedSponsors,
    pendingSponsorDeals: team.finances?.pendingSponsorOffers?.length || 0,
    
    boardTargets: careerState.boardTargets?.map((t: any) => ({
      type: t.type,
      target: t.target,
      current: t.current || 0,
      onTrack: (t.current || 0) >= (t.target * (careerState.currentWeek / 52))
    })),
    
    currentWeek: careerState.currentWeek || 1,
    currentYear: careerState.currentYear || new Date().getFullYear(),
    isRaceWeek: !!careerState.currentRaceWeekend,
    trackName: careerState.currentRaceWeekend?.trackName,
    lastRaceResult: careerState.lastRaceResult,
    championshipPosition: seasonResults?.championshipPosition,
    pointsToLeader: seasonResults?.pointsToLeader,
    seasonWins: seasonResults?.wins || 0,
    seasonPodiums: seasonResults?.podiums || 0,
    
    currentNarrative: mediaState?.currentNarrative?.current,
    hasActiveControversy: (mediaState?.activeControversies?.length || 0) > 0,
    controversyTopic: mediaState?.activeControversies?.[0]?.topic,
    
    recentHeadlines: mediaState?.recentHeadlines?.slice(-3).map((h: any) => h.headline),
    recentAchievements: careerState.recentAchievements || []
  }
}

/**
 * Format comprehensive context as AI prompt section
 */
export function formatContextForPrompt(ctx: ComprehensiveGameContext): string {
  const lines: string[] = []
  
  lines.push('=== TEAM STATUS ===')
  lines.push(`Team: ${ctx.teamName} (${ctx.teamTier} tier)`)
  lines.push(`Reputation: ${ctx.teamReputation}/100`)
  lines.push(`Board Mood: ${ctx.boardMood}/100 ${ctx.boardMood < 40 ? '⚠️ UNHAPPY' : ctx.boardMood > 70 ? '✓ Pleased' : ''}`)
  lines.push(`Team Morale: ${ctx.teamMorale}/100`)
  lines.push(`Fan Sentiment: ${ctx.fanSentiment}/100`)
  
  lines.push('')
  lines.push('=== FINANCIAL STATUS ===')
  lines.push(`Cash: $${ctx.cashBalance.toLocaleString()} ${ctx.isInDebt ? '🔴 IN DEBT' : ''}`)
  lines.push(`Budget Pressure: ${ctx.budgetPressure.toUpperCase()}`)
  
  if (ctx.primaryDriver) {
    lines.push('')
    lines.push('=== PRIMARY DRIVER ===')
    lines.push(`Name: ${ctx.primaryDriver.name}`)
    if (ctx.primaryDriver.position) lines.push(`Championship: P${ctx.primaryDriver.position}`)
    lines.push(`Season: ${ctx.primaryDriver.wins} wins, ${ctx.primaryDriver.podiums} podiums`)
    lines.push(`Morale: ${ctx.primaryDriver.morale}/100`)
    lines.push(`Form: ${ctx.primaryDriver.recentForm}`)
  }
  
  if (ctx.secondDriver) {
    lines.push('')
    lines.push('=== SECOND DRIVER ===')
    lines.push(`Name: ${ctx.secondDriver.name}`)
    lines.push(`Season: ${ctx.secondDriver.wins} wins, ${ctx.secondDriver.podiums} podiums`)
    lines.push(`Contract Satisfaction: ${ctx.secondDriver.satisfaction}/100`)
  }
  
  if (ctx.carPerformance !== undefined) {
    lines.push('')
    lines.push('=== CAR STATUS ===')
    lines.push(`Performance: ${ctx.carPerformance}/100`)
    lines.push(`Reliability: ${ctx.carReliability}/100`)
    lines.push(`Condition: ${ctx.carCondition.toUpperCase()}`)
    if (ctx.recentUpgrades?.length) {
      lines.push(`Recent Upgrades: ${ctx.recentUpgrades.join(', ')}`)
    }
  }
  
  if (ctx.sponsors.length > 0) {
    lines.push('')
    lines.push('=== SPONSORS ===')
    ctx.sponsors.forEach(s => {
      const status = s.satisfaction < 50 ? '⚠️ UNHAPPY' : s.satisfaction > 80 ? '✓ Happy' : ''
      const isNew = s.isNewThisSeason ? '(NEW)' : ''
      lines.push(`- ${s.name} [${s.slot}]: ${s.satisfaction}/100 satisfaction ${status} ${isNew}`)
    })
  }
  
  if (ctx.boardTargets?.length) {
    lines.push('')
    lines.push('=== BOARD TARGETS ===')
    ctx.boardTargets.forEach(t => {
      const status = t.onTrack ? '✓ On track' : '⚠️ Behind'
      lines.push(`- ${t.type}: ${t.current}/${t.target} ${status}`)
    })
  }
  
  lines.push('')
  lines.push('=== SEASON PROGRESS ===')
  lines.push(`Week ${ctx.currentWeek}, Year ${ctx.currentYear}`)
  if (ctx.isRaceWeek && ctx.trackName) {
    lines.push(`🏁 RACE WEEK at ${ctx.trackName}`)
  }
  if (ctx.championshipPosition) {
    lines.push(`Championship: P${ctx.championshipPosition}${ctx.pointsToLeader ? ` (${ctx.pointsToLeader} pts to leader)` : ''}`)
  }
  lines.push(`Season: ${ctx.seasonWins} wins, ${ctx.seasonPodiums} podiums`)
  
  if (ctx.lastRaceResult) {
    lines.push('')
    lines.push('=== LAST RACE ===')
    lines.push(`Result: P${ctx.lastRaceResult.position} at ${ctx.lastRaceResult.trackName}`)
    if (ctx.lastRaceResult.hadIncident) lines.push('⚠️ Had incident')
  }
  
  if (ctx.hasActiveControversy) {
    lines.push('')
    lines.push('=== ACTIVE CONTROVERSY ===')
    lines.push(`Topic: ${ctx.controversyTopic || 'Unknown'}`)
    lines.push('Media scrutiny is HIGH')
  }
  
  if (ctx.currentNarrative) {
    lines.push('')
    lines.push(`Current Media Narrative: ${ctx.currentNarrative.replace('_', ' ').toUpperCase()}`)
  }
  
  return lines.join('\n')
}

// ============================================
// GEMINI API INTEGRATION
// ============================================

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'

/**
 * Safely parse JSON from API response, handling common issues including truncated responses
 */
function safeParseJSON(content: string): any {
  // Step 1: Extract JSON from markdown code blocks
  let jsonStr = content
  
  // Try to extract from ```json ... ``` blocks (may be incomplete)
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*)/)
  if (codeBlockMatch && codeBlockMatch[1]) {
    // Remove closing ``` if present
    jsonStr = codeBlockMatch[1].replace(/```\s*$/, '').trim()
  } else {
    // Try to find raw JSON object
    const jsonMatch = content.match(/(\{[\s\S]*)/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }
  }
  
  // Step 2: Clean common JSON issues
  jsonStr = jsonStr
    .replace(/,\s*}/g, '}')       // Remove trailing commas before }
    .replace(/,\s*\]/g, ']')      // Remove trailing commas before ]
    .replace(/[\x00-\x1F\x7F]/g, ' ') // Remove control characters
    .replace(/\t/g, ' ')          // Replace tabs with spaces
    .trim()
  
  // Step 3: Try to parse
  try {
    return JSON.parse(jsonStr)
  } catch (firstError) {
    console.log('[MediaAI] First parse attempt failed, trying to repair JSON...')
    console.log('[MediaAI] Problematic JSON (first 500 chars):', jsonStr.substring(0, 500))
    
    // Step 4: Try to repair truncated JSON by extracting complete question objects
    try {
      // Find all complete question objects using regex
      const questionRegex = /\{\s*"question"\s*:\s*"([^"]+)"\s*,\s*"context"\s*:\s*"([^"]+)"\s*,\s*"rivalMentioned"\s*:\s*(?:null|"[^"]*")\s*,\s*"options"\s*:\s*\[([\s\S]*?)\]\s*\}/g
      const completeQuestions: any[] = []
      let match
      
      while ((match = questionRegex.exec(jsonStr)) !== null) {
        try {
          const questionObj = JSON.parse(match[0])
          completeQuestions.push(questionObj)
          console.log('[MediaAI] Extracted complete question:', questionObj.question.substring(0, 50) + '...')
        } catch (e) {
          // Skip malformed question
        }
      }
      
      if (completeQuestions.length > 0) {
        console.log('[MediaAI] Successfully extracted', completeQuestions.length, 'complete questions from truncated JSON')
        return { questions: completeQuestions }
      }
    } catch (e) {
      console.log('[MediaAI] Question extraction failed:', e)
    }
    
    // Step 5: Try simpler extraction - just find the first complete question
    try {
      // Look for a complete question object with at least one option
      const simpleQuestionMatch = jsonStr.match(/\{\s*"question"\s*:\s*"([^"]+)"[\s\S]*?"options"\s*:\s*\[[\s\S]*?\{[^}]+\}[\s\S]*?\][\s\S]*?\}/)
      if (simpleQuestionMatch) {
        // Try to find where this object ends properly
        let objStr = simpleQuestionMatch[0]
        
        // Balance braces
        let braceCount = 0
        let endIndex = 0
        for (let i = 0; i < objStr.length; i++) {
          if (objStr[i] === '{') braceCount++
          if (objStr[i] === '}') braceCount--
          if (braceCount === 0) {
            endIndex = i + 1
            break
          }
        }
        
        if (endIndex > 0) {
          objStr = objStr.substring(0, endIndex)
          const question = JSON.parse(objStr)
          console.log('[MediaAI] Extracted single question from truncated JSON')
          return { questions: [question] }
        }
      }
    } catch (e) {
      console.log('[MediaAI] Simple extraction also failed')
    }
    
    throw firstError
  }
}

const MEDIA_SYSTEM_PROMPT = `You are a motorsport press conference question generator. Generate realistic, contextual press conference questions that a racing driver would face.

CRITICAL RULES:
1. Questions must be realistic and professional
2. Each question needs 4 response options with different tones
3. The hidden effects must be TINY - reputation changes from -0.3 to +0.1 only
4. Most responses should be neutral (0) or slightly negative
5. Positive effects are RARE and small (+0.05 to +0.1)
6. Context matters: overconfident responses after bad results should be negative
7. Blaming team/others is always negative
8. Humble/diplomatic is usually neutral to slightly positive
9. Bold/aggressive has higher downside risk

Response format must be valid JSON matching the schema provided.`

const HEADLINE_SYSTEM_PROMPT = `You are a motorsport journalist generating headlines for racing news. Generate realistic headlines that reflect the driver's response and current media persona.

CRITICAL RULES:
1. Headlines must be realistic and fit motorsport media
2. Match the sentiment to how the response would actually be received
3. If the response was inappropriate for context (e.g., arrogant after DNF), headline should be negative
4. If response mentioned rival aggressively, potentially generate a rival counter-response
5. Outlet names should be realistic motorsport media (Autosport, Motorsport.com, RaceFans, etc.)

Response format must be valid JSON matching the schema provided.`

/**
 * Get the API key from settings store
 * Uses the same Gemini key as the commentary system
 */
async function getGeminiKey(): Promise<string | null> {
  try {
    // First try commentary settings (primary location)
    const commentaryStr = localStorage.getItem('commentary-settings')
    if (commentaryStr) {
      const commentary = JSON.parse(commentaryStr)
      if (commentary?.geminiKey) {
        return commentary.geminiKey
      }
    }
    
    // Try to get from window.electron if available
    if (typeof window !== 'undefined' && window.electron?.getSettings) {
      const settings = await window.electron.getSettings()
      if (settings?.geminiApiKey) {
        return settings.geminiApiKey
      }
    }
    
    // Fallback to career-settings (legacy)
    const settingsStr = localStorage.getItem('career-settings')
    if (settingsStr) {
      const settings = JSON.parse(settingsStr)
      if (settings?.state?.geminiApiKey) {
        return settings.state.geminiApiKey
      }
    }
    
    return null
  } catch (e) {
    console.error('[MediaAI] Failed to get API key:', e)
    return null
  }
}

/**
 * Helper to delay execution
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Generate press conference questions using Gemini with retry logic
 */
export async function generatePressQuestions(
  context: PressConferenceContext,
  questionCount: number = 2
): Promise<GeneratedQuestion[]> {
  console.log('[MediaAI] === PRESS QUESTION GENERATION START ===')
  console.log('[MediaAI] Context:', JSON.stringify({
    eventType: context.eventType,
    playerName: context.playerName,
    teamName: context.teamName,
    seriesTier: context.seriesTier
  }))
  
  const apiKey = await getGeminiKey()
  console.log('[MediaAI] API Key found:', apiKey ? `Yes (${apiKey.substring(0, 10)}...)` : 'NO')
  
  if (!apiKey) {
    console.log('[MediaAI] ❌ No API key, using FALLBACK questions')
    const fallback = getFallbackQuestions(context, questionCount)
    console.log('[MediaAI] Fallback questions:', fallback.map(q => q.question))
    return fallback
  }
  
  const prompt = buildQuestionPrompt(context, questionCount)
  const maxRetries = 3
  const retryDelays = [500, 1000, 2000] // Exponential backoff
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[MediaAI] Attempt ${attempt}/${maxRetries} - Calling Gemini API...`)
    
    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gemini-2.5-flash',
          messages: [
            { role: 'system', content: MEDIA_SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          max_tokens: 10000,
          temperature: 0.9
        })
      })
      
      console.log('[MediaAI] API Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[MediaAI] ❌ API error (attempt ${attempt}):`, response.status)
        console.error('[MediaAI] Error body:', errorText)
        
        if (attempt < maxRetries) {
          console.log(`[MediaAI] Retrying in ${retryDelays[attempt - 1]}ms...`)
          await delay(retryDelays[attempt - 1])
          continue
        }
        break
      }
      
      const data = await response.json()
      console.log('[MediaAI] Raw API response received')
      
      const content = data.choices?.[0]?.message?.content?.trim()
      
      if (!content) {
        console.error(`[MediaAI] ❌ Empty response content (attempt ${attempt})`)
        if (attempt < maxRetries) {
          console.log(`[MediaAI] Retrying in ${retryDelays[attempt - 1]}ms...`)
          await delay(retryDelays[attempt - 1])
          continue
        }
        break
      }
      
      console.log('[MediaAI] Content received (first 200 chars):', content.substring(0, 200))
      
      console.log('[MediaAI] Parsing JSON...')
      const parsed = safeParseJSON(content)
      const questions = parsed.questions || parsed
      
      if (!questions || questions.length === 0) {
        console.error(`[MediaAI] ❌ No questions parsed (attempt ${attempt})`)
        if (attempt < maxRetries) {
          console.log(`[MediaAI] Retrying in ${retryDelays[attempt - 1]}ms...`)
          await delay(retryDelays[attempt - 1])
          continue
        }
        break
      }
      
      console.log('[MediaAI] ✅ AI Generated', questions.length, 'questions:')
      questions.forEach((q: any, i: number) => {
        console.log(`[MediaAI]   Q${i + 1}: "${q.question?.substring(0, 60)}..."`)
      })
      
      // Validate and constrain effects
      const result = questions.map((q: any, i: number) => ({
        id: `gen_${Date.now()}_${i}`,
        question: q.question,
        context: q.context || 'The journalist awaits your response.',
        rivalMentioned: q.rivalMentioned,
        options: (q.options || []).map((opt: any, j: number) => ({
          id: `opt_${Date.now()}_${i}_${j}`,
          text: opt.text,
          tone: constrainTone(opt.tone),
          hiddenEffects: constrainEffects(opt.hiddenEffects || opt.effects || {})
        }))
      }))
      
      console.log('[MediaAI] === RETURNING AI QUESTIONS ===')
      return result
      
    } catch (e) {
      console.error(`[MediaAI] ❌ Exception during generation (attempt ${attempt}):`, e)
      
      if (attempt < maxRetries) {
        console.log(`[MediaAI] Retrying in ${retryDelays[attempt - 1]}ms...`)
        await delay(retryDelays[attempt - 1])
        continue
      }
    }
  }
  
  // All retries failed - use fallback
  console.log('[MediaAI] All retries failed, using FALLBACK questions')
  return getFallbackQuestions(context, questionCount)
}

/**
 * Generate headline based on player's response
 */
export async function generateHeadline(
  context: PressConferenceContext,
  question: GeneratedQuestion,
  selectedOption: GeneratedResponseOption
): Promise<GeneratedHeadline> {
  const apiKey = await getGeminiKey()
  
  if (!apiKey) {
    console.log('[MediaAI] No API key, using fallback headline')
    return getFallbackHeadline(context, selectedOption)
  }
  
  const prompt = buildHeadlinePrompt(context, question, selectedOption)
  
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          { role: 'system', content: HEADLINE_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.8
      })
    })
    
    if (!response.ok) {
      console.error('[MediaAI] Headline API error:', response.status)
      return getFallbackHeadline(context, selectedOption)
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    
    if (!content) {
      return getFallbackHeadline(context, selectedOption)
    }
    
    const parsed = safeParseJSON(content)
    
    return {
      headline: parsed.headline || `${context.playerName} speaks to the press`,
      outlet: parsed.outlet || 'Motorsport.com',
      sentiment: constrainSentiment(parsed.sentiment),
      rivalResponse: parsed.rivalResponse
    }
    
  } catch (e) {
    console.error('[MediaAI] Failed to generate headline:', e)
    return getFallbackHeadline(context, selectedOption)
  }
}

// ============================================
// PROMPT BUILDERS
// ============================================

function buildQuestionPrompt(context: PressConferenceContext, count: number): string {
  let eventDescription = ''
  
  switch (context.eventType) {
    case 'pre_race':
      eventDescription = `Pre-race press conference at ${context.trackName || 'the circuit'}. The driver is preparing for the upcoming race.`
      break
    case 'post_race_win':
      eventDescription = `Post-race press conference after WINNING at ${context.lastRaceResult?.trackName || 'the race'}. The driver is celebrating victory.`
      break
    case 'post_race_podium':
      eventDescription = `Post-race press conference after a P${context.lastRaceResult?.position} podium finish at ${context.lastRaceResult?.trackName}.`
      break
    case 'post_race_dnf':
      eventDescription = `Post-race press conference after a DNF (did not finish) at ${context.lastRaceResult?.trackName}. This is a difficult moment.`
      break
    case 'post_race_finish':
      eventDescription = `Post-race press conference after finishing P${context.lastRaceResult?.position} at ${context.lastRaceResult?.trackName}.`
      break
    case 'milestone_first_win':
      eventDescription = `Special press conference after ${context.playerName}'s FIRST CAREER VICTORY! A historic moment.`
      break
    case 'milestone_first_podium':
      eventDescription = `Special press conference after ${context.playerName}'s first career podium! A breakthrough result.`
      break
    case 'milestone_championship':
      eventDescription = `Championship celebration press conference. ${context.playerName} has just won the title!`
      break
    case 'contract_signed':
      eventDescription = `Press conference announcing ${context.playerName}'s new contract with ${context.teamName}.`
      break
  }
  
  let additionalContext = ''
  if (context.rivalName) {
    additionalContext += `\nKey rival in championship: ${context.rivalName}`
    if (context.rivalIncident) {
      additionalContext += ` (Recent incident: ${context.rivalIncident})`
    }
  }
  if (context.currentStreak) {
    additionalContext += `\nCurrent streak: ${context.currentStreak}`
  }
  if (context.controversyContext) {
    additionalContext += `\nRecent controversy: ${context.controversyContext}`
  }
  if (context.mediaPersona && context.mediaPersona.personaLevel !== 'unknown') {
    additionalContext += `\nDriver's media persona: ${context.mediaPersona.dominantTone} (${context.mediaPersona.personaLevel})`
    if (context.mediaPersona.controversyLevel > 30) {
      additionalContext += ` - currently under media scrutiny`
    }
  }
  if (context.championshipPosition) {
    additionalContext += `\nChampionship position: P${context.championshipPosition}`
  }

  return `Generate ${count} press conference questions for this scenario:

CONTEXT:
- Driver: ${context.playerName}
- Team: ${context.teamName}
- Series: ${context.seriesName} (${context.seriesTier} tier)
- Event: ${eventDescription}
${additionalContext}

Generate ${count} questions with 4 response options each. For each option, include:
- text: The response text (realistic driver quote)
- tone: One of: humble, confident, bold, aggressive, deflecting, diplomatic
- hiddenEffects: { repEffect: number (-0.3 to +0.1), teamEffect?: number, rivalEffect?: number, sponsorRisk?: boolean, controversyAdd?: number (0-10) }

IMPORTANT EFFECT GUIDELINES:
- repEffect MUST be between -0.3 and +0.1 (mostly 0 or negative)
- Humble/diplomatic: usually 0 to +0.05
- Confident: -0.05 to +0.05
- Bold: -0.1 to 0
- Aggressive: -0.2 to -0.1
- Context matters! Overconfident after DNF = -0.2 to -0.3

Respond with valid JSON:
{
  "questions": [
    {
      "question": "string",
      "context": "string describing the scene",
      "rivalMentioned": "string or null",
      "options": [...]
    }
  ]
}`
}

function buildHeadlinePrompt(
  context: PressConferenceContext,
  question: GeneratedQuestion,
  option: GeneratedResponseOption
): string {
  return `Generate a press headline based on this press conference moment:

CONTEXT:
- Driver: ${context.playerName}
- Team: ${context.teamName}
- Event type: ${context.eventType}
${context.lastRaceResult ? `- Last race: P${context.lastRaceResult.position} at ${context.lastRaceResult.trackName}${context.lastRaceResult.dnf ? ' (DNF)' : ''}` : ''}

QUESTION ASKED: "${question.question}"

DRIVER'S RESPONSE: "${option.text}"
(Tone: ${option.tone})

${question.rivalMentioned ? `This question involved rival: ${question.rivalMentioned}` : ''}
${context.mediaPersona?.controversyLevel && context.mediaPersona.controversyLevel > 30 ? 'Driver is currently under media scrutiny.' : ''}

Generate a realistic motorsport headline and outlet. If the response was inappropriate for the context (arrogant after failure, blaming team, etc.), the sentiment should be negative. If a rival was mentioned aggressively, optionally include a rivalResponse quote.

Respond with valid JSON:
{
  "headline": "string",
  "outlet": "string (e.g., Autosport, Motorsport.com, RaceFans)",
  "sentiment": "positive" | "neutral" | "negative" | "controversial",
  "rivalResponse": "string or null (rival's counter-statement if applicable)"
}`
}

// ============================================
// CONSTRAINT HELPERS
// ============================================

function constrainTone(tone: string): MediaTone {
  const validTones: MediaTone[] = ['confident', 'humble', 'bold', 'diplomatic', 'aggressive', 'deflecting']
  return validTones.includes(tone as MediaTone) ? tone as MediaTone : 'diplomatic'
}

function constrainSentiment(sentiment: string): 'positive' | 'neutral' | 'negative' | 'controversial' {
  const valid = ['positive', 'neutral', 'negative', 'controversial']
  return valid.includes(sentiment) ? sentiment as any : 'neutral'
}

function constrainEffects(effects: any): GeneratedResponseOption['hiddenEffects'] {
  return {
    repEffect: Math.max(-0.3, Math.min(0.1, effects.repEffect || 0)),
    teamEffect: effects.teamEffect ? Math.max(-0.2, Math.min(0.1, effects.teamEffect)) : undefined,
    rivalEffect: effects.rivalEffect ? Math.max(-0.2, Math.min(0.1, effects.rivalEffect)) : undefined,
    sponsorRisk: effects.sponsorRisk || false,
    controversyAdd: Math.max(0, Math.min(10, effects.controversyAdd || 0))
  }
}

// ============================================
// FALLBACK QUESTIONS (when API unavailable)
// ============================================

const FALLBACK_QUESTIONS: Record<string, GeneratedQuestion[]> = {
  'pre_race': [
    {
      id: 'fallback_pre_1',
      question: 'What are your expectations for this weekend?',
      context: 'The media room buzzes with anticipation.',
      options: [
        { id: 'fb_pre_1a', text: "We've prepared well. I'm quietly confident.", tone: 'confident', hiddenEffects: { repEffect: 0 } },
        { id: 'fb_pre_1b', text: "We'll take it step by step and see what the car can do.", tone: 'humble', hiddenEffects: { repEffect: 0.05 } },
        { id: 'fb_pre_1c', text: "I'm here to win. Nothing else matters.", tone: 'bold', hiddenEffects: { repEffect: -0.1, controversyAdd: 2 } },
        { id: 'fb_pre_1d', text: "The team has worked hard. We'll see where we stack up.", tone: 'diplomatic', hiddenEffects: { repEffect: 0, teamEffect: 0.05 } }
      ]
    },
    {
      id: 'fallback_pre_2',
      question: 'How do you rate your championship chances?',
      context: 'A pointed question from a senior journalist.',
      options: [
        { id: 'fb_pre_2a', text: "I believe we can fight for it if we execute well.", tone: 'confident', hiddenEffects: { repEffect: 0 } },
        { id: 'fb_pre_2b', text: "There are many strong competitors. We focus race by race.", tone: 'humble', hiddenEffects: { repEffect: 0.05 } },
        { id: 'fb_pre_2c', text: "We should be leading it. The competition knows it.", tone: 'aggressive', hiddenEffects: { repEffect: -0.15, controversyAdd: 5 } },
        { id: 'fb_pre_2d', text: "Let's not get ahead of ourselves. One race at a time.", tone: 'deflecting', hiddenEffects: { repEffect: 0 } }
      ]
    }
  ],
  'post_race_win': [
    {
      id: 'fallback_win_1',
      question: 'An incredible victory! How does it feel?',
      context: 'Cameras flash as you take your seat at the press conference.',
      options: [
        { id: 'fb_win_1a', text: "The team was perfect today. This is their win too.", tone: 'humble', hiddenEffects: { repEffect: 0.1, teamEffect: 0.1 } },
        { id: 'fb_win_1b', text: "We were simply the fastest. A dominant performance.", tone: 'bold', hiddenEffects: { repEffect: -0.05, controversyAdd: 3 } },
        { id: 'fb_win_1c', text: "Hard work pays off. We keep pushing every day.", tone: 'confident', hiddenEffects: { repEffect: 0.05 } },
        { id: 'fb_win_1d', text: "I showed today what I'm capable of. Remember this.", tone: 'aggressive', hiddenEffects: { repEffect: -0.1, controversyAdd: 5 } }
      ]
    },
    {
      id: 'fallback_win_2',
      question: 'What does this result mean for the championship?',
      context: 'A strategic question from a veteran journalist.',
      options: [
        { id: 'fb_win_2a', text: "We'll take it race by race. Long season ahead.", tone: 'humble', hiddenEffects: { repEffect: 0.05 } },
        { id: 'fb_win_2b', text: "This puts us right in the fight. We're a force now.", tone: 'confident', hiddenEffects: { repEffect: 0 } },
        { id: 'fb_win_2c', text: "The others should be worried. We're coming for them.", tone: 'aggressive', hiddenEffects: { repEffect: -0.1, controversyAdd: 4 } },
        { id: 'fb_win_2d', text: "It's good points. We focus on our own performance.", tone: 'diplomatic', hiddenEffects: { repEffect: 0 } }
      ]
    }
  ],
  'post_race_podium': [
    {
      id: 'fallback_podium_1',
      question: 'A strong podium finish. Are you satisfied?',
      context: 'The mixed zone is busy with reporters.',
      options: [
        { id: 'fb_pod_1a', text: "Great result for the team. We maximized our potential today.", tone: 'humble', hiddenEffects: { repEffect: 0.05, teamEffect: 0.05 } },
        { id: 'fb_pod_1b', text: "Good, but we're here to win. Next time we go for the top step.", tone: 'confident', hiddenEffects: { repEffect: 0 } },
        { id: 'fb_pod_1c', text: "Should have been more. We left performance on the table.", tone: 'aggressive', hiddenEffects: { repEffect: -0.1, teamEffect: -0.1 } },
        { id: 'fb_pod_1d', text: "It's progress. We're heading in the right direction.", tone: 'diplomatic', hiddenEffects: { repEffect: 0 } }
      ]
    },
    {
      id: 'fallback_podium_2',
      question: 'What was the key to your performance today?',
      context: 'Technical questions from the press pack.',
      options: [
        { id: 'fb_pod_2a', text: "The team's preparation. They gave me a great car.", tone: 'humble', hiddenEffects: { repEffect: 0.05, teamEffect: 0.1 } },
        { id: 'fb_pod_2b', text: "Execution. We nailed the strategy and I delivered when it mattered.", tone: 'confident', hiddenEffects: { repEffect: 0 } },
        { id: 'fb_pod_2c', text: "Pure pace. I was faster than some of the top runners today.", tone: 'bold', hiddenEffects: { repEffect: -0.05, controversyAdd: 2 } },
        { id: 'fb_pod_2d', text: "Everything came together. A good team effort all around.", tone: 'diplomatic', hiddenEffects: { repEffect: 0, teamEffect: 0.05 } }
      ]
    }
  ],
  'post_race_dnf': [
    {
      id: 'fallback_dnf_1',
      question: 'A difficult day. What happened out there?',
      context: 'The atmosphere is tense after your retirement.',
      options: [
        { id: 'fb_dnf_1a', text: "Racing. These things happen. We'll come back stronger.", tone: 'humble', hiddenEffects: { repEffect: 0.05 } },
        { id: 'fb_dnf_1b', text: "Technical issue. The team is investigating.", tone: 'diplomatic', hiddenEffects: { repEffect: 0, teamEffect: 0 } },
        { id: 'fb_dnf_1c', text: "Unacceptable. Someone needs to explain how this happened.", tone: 'aggressive', hiddenEffects: { repEffect: -0.2, teamEffect: -0.15, controversyAdd: 5 } },
        { id: 'fb_dnf_1d', text: "Frustrating. We had pace for a good result today.", tone: 'deflecting', hiddenEffects: { repEffect: 0 } }
      ]
    },
    {
      id: 'fallback_dnf_2',
      question: 'How do you recover from a setback like this?',
      context: 'A sympathetic journalist gives you a chance to look ahead.',
      options: [
        { id: 'fb_dnf_2a', text: "Put it behind us, focus on the next one. That's all you can do.", tone: 'humble', hiddenEffects: { repEffect: 0.05 } },
        { id: 'fb_dnf_2b', text: "We're still in this championship. One bad day won't define us.", tone: 'confident', hiddenEffects: { repEffect: 0 } },
        { id: 'fb_dnf_2c', text: "By making sure the people responsible fix the problem.", tone: 'aggressive', hiddenEffects: { repEffect: -0.1, teamEffect: -0.1, controversyAdd: 3 } },
        { id: 'fb_dnf_2d', text: "We regroup as a team and come back stronger next time.", tone: 'diplomatic', hiddenEffects: { repEffect: 0, teamEffect: 0.05 } }
      ]
    }
  ],
  'post_race_finish': [
    {
      id: 'fallback_finish_1',
      question: 'Walk us through your race today.',
      context: 'Journalists wait for your perspective.',
      options: [
        { id: 'fb_fin_1a', text: "We extracted everything from the car. A solid day.", tone: 'humble', hiddenEffects: { repEffect: 0.05 } },
        { id: 'fb_fin_1b', text: "Not where we want to be. We need to find more pace.", tone: 'confident', hiddenEffects: { repEffect: 0 } },
        { id: 'fb_fin_1c', text: "The car wasn't good enough. Simple as that.", tone: 'aggressive', hiddenEffects: { repEffect: -0.15, teamEffect: -0.1, sponsorRisk: true } },
        { id: 'fb_fin_1d', text: "Good learning experience. We know what to work on.", tone: 'diplomatic', hiddenEffects: { repEffect: 0, teamEffect: 0.05 } }
      ]
    },
    {
      id: 'fallback_finish_2',
      question: 'What are your goals for the rest of the season?',
      context: 'Forward-looking questions from the press.',
      options: [
        { id: 'fb_fin_2a', text: "Keep improving, keep learning. The results will come.", tone: 'humble', hiddenEffects: { repEffect: 0.05 } },
        { id: 'fb_fin_2b', text: "Fight for better positions. We have more potential to unlock.", tone: 'confident', hiddenEffects: { repEffect: 0 } },
        { id: 'fb_fin_2c', text: "I want wins. That's what I'm here for.", tone: 'bold', hiddenEffects: { repEffect: -0.05, controversyAdd: 2 } },
        { id: 'fb_fin_2d', text: "Take it race by race and maximize every opportunity.", tone: 'diplomatic', hiddenEffects: { repEffect: 0 } }
      ]
    }
  ],
  'milestone_first_win': [
    {
      id: 'fallback_firstwin_1',
      question: 'Your first career victory! What does this mean to you?',
      context: 'An emotional moment as you face the media after your historic win.',
      options: [
        { id: 'fb_fw_1a', text: "Everything I've worked for. Thank you to everyone who believed.", tone: 'humble', hiddenEffects: { repEffect: 0.1, teamEffect: 0.1 } },
        { id: 'fb_fw_1b', text: "This is just the beginning. Many more to come.", tone: 'confident', hiddenEffects: { repEffect: 0.05 } },
        { id: 'fb_fw_1c', text: "Finally! I've deserved this for a long time.", tone: 'bold', hiddenEffects: { repEffect: -0.1, controversyAdd: 3 } },
        { id: 'fb_fw_1d', text: "A dream come true. The team made this possible.", tone: 'diplomatic', hiddenEffects: { repEffect: 0.1, teamEffect: 0.1 } }
      ]
    },
    {
      id: 'fallback_firstwin_2',
      question: 'Who would you like to dedicate this victory to?',
      context: 'A personal question from a sympathetic journalist.',
      options: [
        { id: 'fb_fw_2a', text: "My family. They sacrificed so much to get me here.", tone: 'humble', hiddenEffects: { repEffect: 0.1 } },
        { id: 'fb_fw_2b', text: "Everyone at the team. From engineers to mechanics - they deserve this.", tone: 'humble', hiddenEffects: { repEffect: 0.05, teamEffect: 0.15 } },
        { id: 'fb_fw_2c', text: "To myself. I never stopped believing when others doubted me.", tone: 'bold', hiddenEffects: { repEffect: -0.05, controversyAdd: 2 } },
        { id: 'fb_fw_2d', text: "To all the fans who supported us from the beginning.", tone: 'diplomatic', hiddenEffects: { repEffect: 0.05 } }
      ]
    }
  ],
  'milestone_first_podium': [
    {
      id: 'fallback_firstpod_1',
      question: 'Your first career podium! How special is this moment?',
      context: 'Champagne still dripping as you arrive at the press conference.',
      options: [
        { id: 'fb_fp_1a', text: "Incredible. All the hard work, all the sacrifice - this is why.", tone: 'humble', hiddenEffects: { repEffect: 0.1, teamEffect: 0.05 } },
        { id: 'fb_fp_1b', text: "A breakthrough. Next target is the top step.", tone: 'confident', hiddenEffects: { repEffect: 0.05 } },
        { id: 'fb_fp_1c', text: "About time! I knew I belonged here.", tone: 'bold', hiddenEffects: { repEffect: -0.05, controversyAdd: 2 } },
        { id: 'fb_fp_1d', text: "The team gave me a car to fight with. We delivered together.", tone: 'diplomatic', hiddenEffects: { repEffect: 0.05, teamEffect: 0.1 } }
      ]
    },
    {
      id: 'fallback_firstpod_2',
      question: 'What does this mean for your confidence going forward?',
      context: 'Questions about the future flood in.',
      options: [
        { id: 'fb_fp_2a', text: "It proves we belong. But we stay humble and keep working.", tone: 'humble', hiddenEffects: { repEffect: 0.05 } },
        { id: 'fb_fp_2b', text: "Sky's the limit now. We know we can compete at the front.", tone: 'confident', hiddenEffects: { repEffect: 0 } },
        { id: 'fb_fp_2c', text: "I always had confidence. Now everyone else can see it too.", tone: 'bold', hiddenEffects: { repEffect: -0.05, controversyAdd: 2 } },
        { id: 'fb_fp_2d', text: "We take it step by step. This is just one result.", tone: 'diplomatic', hiddenEffects: { repEffect: 0 } }
      ]
    }
  ],
  'milestone_championship': [
    {
      id: 'fallback_champ_1',
      question: 'You are the champion! How does it feel to achieve this?',
      context: 'The ultimate achievement. The room falls silent awaiting your words.',
      options: [
        { id: 'fb_ch_1a', text: "A dream realized. Thank you to everyone on this journey.", tone: 'humble', hiddenEffects: { repEffect: 0.1, teamEffect: 0.1 } },
        { id: 'fb_ch_1b', text: "We were the best. The results speak for themselves.", tone: 'confident', hiddenEffects: { repEffect: 0 } },
        { id: 'fb_ch_1c', text: "Dominant season. Nobody could touch us.", tone: 'aggressive', hiddenEffects: { repEffect: -0.1, controversyAdd: 5 } },
        { id: 'fb_ch_1d', text: "Years of work. Every person on this team is a champion.", tone: 'diplomatic', hiddenEffects: { repEffect: 0.1, teamEffect: 0.1 } }
      ]
    },
    {
      id: 'fallback_champ_2',
      question: 'What message do you have for your rivals?',
      context: 'The room leans in, eager for a rivalry soundbite.',
      options: [
        { id: 'fb_ch_2a', text: "Respect to all of them. They pushed us to be better.", tone: 'humble', hiddenEffects: { repEffect: 0.1 } },
        { id: 'fb_ch_2b', text: "See you next year. We'll be even stronger.", tone: 'confident', hiddenEffects: { repEffect: 0 } },
        { id: 'fb_ch_2c', text: "They know who the best is now. End of discussion.", tone: 'aggressive', hiddenEffects: { repEffect: -0.15, controversyAdd: 6 } },
        { id: 'fb_ch_2d', text: "Great competitors deserve a great champion. We delivered.", tone: 'bold', hiddenEffects: { repEffect: -0.05, controversyAdd: 3 } }
      ]
    }
  ],
  'contract_signed': [
    {
      id: 'fallback_contract_1',
      question: "You've signed with a new team. What are your ambitions?",
      context: 'The team principal sits beside you at the announcement.',
      options: [
        { id: 'fb_con_1a', text: "Grateful for this opportunity. I'll give everything for this team.", tone: 'humble', hiddenEffects: { repEffect: 0.05, teamEffect: 0.1 } },
        { id: 'fb_con_1b', text: "I'm here to win. This team gives me that platform.", tone: 'confident', hiddenEffects: { repEffect: 0 } },
        { id: 'fb_con_1c', text: "Time to show what I can really do. Watch this space.", tone: 'bold', hiddenEffects: { repEffect: -0.05, controversyAdd: 2 } },
        { id: 'fb_con_1d', text: "Excited for this new chapter. Let's get to work.", tone: 'diplomatic', hiddenEffects: { repEffect: 0 } }
      ]
    },
    {
      id: 'fallback_contract_2',
      question: "Why did you choose this team over other options?",
      context: 'A probing question about your decision-making.',
      options: [
        { id: 'fb_con_2a', text: "They believed in me when it mattered. That loyalty means everything.", tone: 'humble', hiddenEffects: { repEffect: 0.05, teamEffect: 0.1 } },
        { id: 'fb_con_2b', text: "The project, the people, the potential. It all aligned perfectly.", tone: 'diplomatic', hiddenEffects: { repEffect: 0, teamEffect: 0.05 } },
        { id: 'fb_con_2c', text: "Simple - they're the best fit for what I want to achieve.", tone: 'confident', hiddenEffects: { repEffect: 0 } },
        { id: 'fb_con_2d', text: "Some teams talk, this team delivers. I'm ready to deliver with them.", tone: 'bold', hiddenEffects: { repEffect: -0.05, controversyAdd: 2 } }
      ]
    }
  ]
}

function getFallbackQuestions(context: PressConferenceContext, count: number): GeneratedQuestion[] {
  const questions = FALLBACK_QUESTIONS[context.eventType] || FALLBACK_QUESTIONS['pre_race']
  return questions.slice(0, count)
}

function getFallbackHeadline(context: PressConferenceContext, option: GeneratedResponseOption): GeneratedHeadline {
  const outlets = ['Autosport', 'Motorsport.com', 'RaceFans', 'The Race', 'Crash.net']
  const outlet = outlets[Math.floor(Math.random() * outlets.length)]
  
  // Determine sentiment based on tone and effects
  let sentiment: 'positive' | 'neutral' | 'negative' | 'controversial' = 'neutral'
  
  if (option.hiddenEffects.repEffect > 0.03) {
    sentiment = 'positive'
  } else if (option.hiddenEffects.repEffect < -0.1) {
    sentiment = option.hiddenEffects.controversyAdd && option.hiddenEffects.controversyAdd > 3 ? 'controversial' : 'negative'
  }
  
  // Generate basic headline
  let headline = ''
  switch (option.tone) {
    case 'humble':
      headline = `${context.playerName} credits team after ${context.eventType.includes('win') ? 'victory' : 'result'}`
      break
    case 'confident':
      headline = `${context.playerName} confident of future success`
      break
    case 'bold':
      headline = `${context.playerName} makes bold statement to rivals`
      break
    case 'aggressive':
      headline = `${context.playerName}'s fiery response raises eyebrows`
      break
    case 'diplomatic':
      headline = `${context.playerName} takes measured approach in press conference`
      break
    case 'deflecting':
      headline = `${context.playerName} stays tight-lipped on ${context.eventType.includes('dnf') ? 'retirement' : 'future'}`
      break
    default:
      headline = `${context.playerName} speaks after ${context.lastRaceResult?.trackName || 'race weekend'}`
  }
  
  return {
    headline,
    outlet,
    sentiment
  }
}

// ============================================
// EFFECT APPLICATION HELPERS
// ============================================

/**
 * Apply media effects with tier scaling and seasonal caps
 */
export function calculateScaledMediaEffect(
  baseEffect: number,
  seriesTier: string,
  currentSeasonGain: number
): { scaledEffect: number; cappedEffect: number; hitCap: boolean } {
  const tierMultiplier = MEDIA_REP_MULTIPLIERS[seriesTier] || MEDIA_REP_MULTIPLIERS['pro']
  const scaledEffect = baseEffect * tierMultiplier
  
  // Check caps
  let cappedEffect = scaledEffect
  let hitCap = false
  
  if (scaledEffect > 0) {
    // Positive effect - check positive cap
    const remainingPositive = 2 - currentSeasonGain // MEDIA_SEASON_CAP_POSITIVE
    if (remainingPositive <= 0) {
      cappedEffect = 0
      hitCap = true
    } else if (scaledEffect > remainingPositive) {
      cappedEffect = remainingPositive
      hitCap = true
    }
  } else if (scaledEffect < 0) {
    // Negative effect - check negative floor
    const remainingNegative = -3 - currentSeasonGain // MEDIA_SEASON_CAP_NEGATIVE
    if (currentSeasonGain <= -3) {
      cappedEffect = 0
      hitCap = true
    } else if (scaledEffect < remainingNegative) {
      cappedEffect = remainingNegative
      hitCap = true
    }
  }
  
  return { scaledEffect, cappedEffect, hitCap }
}

// ============================================
// INTERVIEW SYSTEM
// ============================================

export interface InterviewContext {
  playerName: string
  teamName: string
  seriesName: string
  seriesTier: string
  tier: 'local' | 'national' | 'global' | 'tv'
  outletName: string
  lastRaceResult?: { position: number; trackName: string; dnf?: boolean }
  championshipPosition?: number
  contractExpiring?: boolean
  rivalName?: string
  controversyLevel?: number
  mediaPersona?: MediaPersona
  recentHeadlines?: string[]
  // Race week context
  isRaceWeek?: boolean
  isPostRace?: boolean
  upcomingTrack?: string
  recentWin?: boolean
  recentPodium?: boolean
  recentDNF?: boolean
}

const INTERVIEW_SYSTEM_PROMPT = `You are generating interview questions for a motorsport driver. The interview tier determines complexity and stakes:
- LOCAL: Friendly, simple questions from a small blog. Low stakes.
- NATIONAL: Professional questions about career and results. Medium stakes.
- GLOBAL: Probing questions from major motorsport media. High stakes, potential controversy.
- TV: High-profile broadcast interview. Very high stakes, career-defining potential.

Generate appropriate questions with 4 response options each. Hidden effects must be TINY and appropriate to stakes:
- Local: repEffect -0.1 to +0.05
- National: repEffect -0.15 to +0.08
- Global: repEffect -0.2 to +0.1
- TV: repEffect -0.3 to +0.15

Response format must be valid JSON matching the schema.`

/**
 * Generate interview questions based on tier with retry logic
 */
export async function generateInterviewQuestions(
  context: InterviewContext
): Promise<GeneratedQuestion[]> {
  console.log('[MediaAI] === INTERVIEW QUESTION GENERATION START ===')
  console.log('[MediaAI] Interview context:', {
    tier: context.tier,
    outlet: context.outletName,
    player: context.playerName
  })
  
  const apiKey = await getGeminiKey()
  console.log('[MediaAI] Interview API Key found:', apiKey ? `Yes (${apiKey.substring(0, 10)}...)` : 'NO')
  
  const questionCounts: Record<string, number> = {
    local: 1,
    national: 2,
    global: 2,
    tv: 3
  }
  const count = questionCounts[context.tier] || 2
  
  if (!apiKey) {
    console.log('[MediaAI] ❌ No API key for interview, using FALLBACK')
    return getFallbackInterviewQuestions(context, count)
  }
  
  const prompt = buildInterviewPrompt(context, count)
  const maxRetries = 3
  const retryDelays = [500, 1000, 2000] // Exponential backoff
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[MediaAI] Interview attempt ${attempt}/${maxRetries} - Calling Gemini...`)
    
    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gemini-2.5-flash',
          messages: [
            { role: 'system', content: INTERVIEW_SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          max_tokens: 10000,
          temperature: 0.9
        })
      })
      
      console.log('[MediaAI] Interview API Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[MediaAI] ❌ Interview API error (attempt ${attempt}):`, response.status)
        console.error('[MediaAI] Error:', errorText)
        
        if (attempt < maxRetries) {
          console.log(`[MediaAI] Retrying in ${retryDelays[attempt - 1]}ms...`)
          await delay(retryDelays[attempt - 1])
          continue
        }
        break
      }
      
      const data = await response.json()
      const content = data.choices?.[0]?.message?.content?.trim()
      
      if (!content) {
        console.error(`[MediaAI] ❌ Empty interview response (attempt ${attempt})`)
        if (attempt < maxRetries) {
          console.log(`[MediaAI] Retrying in ${retryDelays[attempt - 1]}ms...`)
          await delay(retryDelays[attempt - 1])
          continue
        }
        break
      }
      
      console.log('[MediaAI] Interview content received (first 200 chars):', content.substring(0, 200))
      
      const parsed = safeParseJSON(content)
      const questions = parsed.questions || parsed
      
      if (!questions || questions.length === 0) {
        console.error(`[MediaAI] ❌ No interview questions parsed (attempt ${attempt})`)
        if (attempt < maxRetries) {
          console.log(`[MediaAI] Retrying in ${retryDelays[attempt - 1]}ms...`)
          await delay(retryDelays[attempt - 1])
          continue
        }
        break
      }
      
      console.log('[MediaAI] ✅ AI Generated', questions.length, 'interview questions')
      
      return questions.map((q: any, i: number) => ({
        id: `int_${Date.now()}_${i}`,
        question: q.question,
        context: q.context || 'The interviewer awaits your response.',
        rivalMentioned: q.rivalMentioned,
        options: (q.options || []).map((opt: any, j: number) => ({
          id: `int_opt_${Date.now()}_${i}_${j}`,
          text: opt.text,
          tone: constrainTone(opt.tone),
          hiddenEffects: constrainInterviewEffects(opt.hiddenEffects || opt.effects || {}, context.tier)
        }))
      }))
      
    } catch (e) {
      console.error(`[MediaAI] ❌ Interview exception (attempt ${attempt}):`, e)
      
      if (attempt < maxRetries) {
        console.log(`[MediaAI] Retrying in ${retryDelays[attempt - 1]}ms...`)
        await delay(retryDelays[attempt - 1])
        continue
      }
    }
  }
  
  // All retries failed - use fallback
  console.log('[MediaAI] All interview retries failed, using FALLBACK')
  return getFallbackInterviewQuestions(context, count)
}

function constrainInterviewEffects(effects: any, tier: string): GeneratedResponseOption['hiddenEffects'] {
  const limits: Record<string, { minRep: number; maxRep: number }> = {
    local: { minRep: -0.1, maxRep: 0.05 },
    national: { minRep: -0.15, maxRep: 0.08 },
    global: { minRep: -0.2, maxRep: 0.1 },
    tv: { minRep: -0.3, maxRep: 0.15 }
  }
  const { minRep, maxRep } = limits[tier] || limits.national
  
  return {
    repEffect: Math.max(minRep, Math.min(maxRep, effects.repEffect || 0)),
    teamEffect: effects.teamEffect ? Math.max(-0.15, Math.min(0.1, effects.teamEffect)) : undefined,
    rivalEffect: effects.rivalEffect ? Math.max(-0.2, Math.min(0.1, effects.rivalEffect)) : undefined,
    sponsorRisk: effects.sponsorRisk || false,
    controversyAdd: Math.max(0, Math.min(15, effects.controversyAdd || 0))
  }
}

function buildInterviewPrompt(context: InterviewContext, count: number): string {
  const tierDescriptions: Record<string, string> = {
    local: `Friendly interview with ${context.outletName}, a small local motorsport blog. Keep questions simple and positive.`,
    national: `Professional interview with ${context.outletName}, a national sports outlet. Questions about career and recent results.`,
    global: `High-profile interview with ${context.outletName}, a major motorsport publication. Probing, potentially controversial questions.`,
    tv: `Prime-time TV interview with ${context.outletName}. The whole motorsport world is watching. Career-defining moment.`
  }
  
  let additionalContext = ''
  
  // RACE WEEK CONTEXT - Critical for contextual questions
  if (context.isRaceWeek && context.upcomingTrack) {
    additionalContext += `\n🏁 TIMING: RACE WEEK - Upcoming race at ${context.upcomingTrack}. Questions should focus on preparation and expectations.`
  } else if (context.isPostRace && context.lastRaceResult) {
    if (context.recentWin) {
      additionalContext += `\n🏆 TIMING: POST-RACE - Just WON at ${context.lastRaceResult.trackName}! Questions should celebrate the victory.`
    } else if (context.recentPodium) {
      additionalContext += `\n🥈 TIMING: POST-RACE - Just finished P${context.lastRaceResult.position} at ${context.lastRaceResult.trackName}. Questions about the strong result.`
    } else if (context.recentDNF) {
      additionalContext += `\n💔 TIMING: POST-RACE - DNF at ${context.lastRaceResult.trackName}. Questions about the disappointment.`
    } else {
      additionalContext += `\n🏎️ TIMING: POST-RACE - Finished P${context.lastRaceResult.position} at ${context.lastRaceResult.trackName}. Questions about the weekend.`
    }
  } else {
    additionalContext += `\n📅 TIMING: OFF-WEEK - Between races. More general career/personal questions.`
  }
  
  if (context.lastRaceResult && !context.isRaceWeek) {
    additionalContext += `\nLast race: P${context.lastRaceResult.position} at ${context.lastRaceResult.trackName}${context.lastRaceResult.dnf ? ' (DNF)' : ''}`
  }
  if (context.championshipPosition) {
    additionalContext += `\nChampionship position: P${context.championshipPosition}`
  }
  if (context.contractExpiring) {
    additionalContext += `\nContract status: EXPIRING - hot topic!`
  }
  if (context.rivalName) {
    additionalContext += `\nKey rival: ${context.rivalName}`
  }
  if (context.controversyLevel && context.controversyLevel > 30) {
    additionalContext += `\nDriver is currently under media scrutiny (controversy level: ${context.controversyLevel})`
  }

  return `Generate ${count} interview questions for this scenario:

INTERVIEW: ${tierDescriptions[context.tier]}

CONTEXT:
- Driver: ${context.playerName}
- Team: ${context.teamName}
- Series: ${context.seriesName} (${context.seriesTier} tier)
${additionalContext}

For each question, provide 4 response options with tones: humble, confident, bold, aggressive, diplomatic, or deflecting.
Include hiddenEffects for each option within the tier limits.

Respond with valid JSON:
{
  "questions": [
    {
      "question": "string",
      "context": "string describing the setting",
      "options": [
        { "text": "string", "tone": "string", "hiddenEffects": { "repEffect": number, "teamEffect"?: number, "sponsorRisk"?: boolean, "controversyAdd"?: number } }
      ]
    }
  ]
}`
}

const FALLBACK_INTERVIEW_QUESTIONS: Record<string, GeneratedQuestion[]> = {
  local: [
    {
      id: 'fb_int_local_1',
      question: "Thanks for taking the time! How's the season going for you?",
      context: 'A friendly blogger sets up their recorder.',
      options: [
        { id: 'fb_il_1a', text: "Really well, thanks! The team has been fantastic.", tone: 'humble', hiddenEffects: { repEffect: 0.03 } },
        { id: 'fb_il_1b', text: "Building momentum. Expect big things soon.", tone: 'confident', hiddenEffects: { repEffect: 0.02 } },
        { id: 'fb_il_1c', text: "We're on fire. Best I've ever felt.", tone: 'bold', hiddenEffects: { repEffect: -0.02, controversyAdd: 1 } },
        { id: 'fb_il_1d', text: "It's been a journey. Learning every race.", tone: 'diplomatic', hiddenEffects: { repEffect: 0.02 } }
      ]
    }
  ],
  national: [
    {
      id: 'fb_int_nat_1',
      question: "Your recent performances have caught attention. Where do you see your career heading?",
      context: 'A sports journalist flips open their notepad.',
      options: [
        { id: 'fb_in_1a', text: "I focus race by race. The results will follow.", tone: 'humble', hiddenEffects: { repEffect: 0.05 } },
        { id: 'fb_in_1b', text: "The top step. That's always the goal.", tone: 'confident', hiddenEffects: { repEffect: 0.03 } },
        { id: 'fb_in_1c', text: "I belong at the pinnacle. It's only a matter of time.", tone: 'bold', hiddenEffects: { repEffect: -0.05, controversyAdd: 3 } },
        { id: 'fb_in_1d', text: "Wherever the opportunities take me. I'm grateful for every chance.", tone: 'diplomatic', hiddenEffects: { repEffect: 0.04 } }
      ]
    },
    {
      id: 'fb_int_nat_2',
      question: "Your team has invested a lot in you. How's that relationship?",
      context: 'The journalist probes deeper.',
      options: [
        { id: 'fb_in_2a', text: "They believe in me and I deliver for them. It's mutual.", tone: 'confident', hiddenEffects: { repEffect: 0.03, teamEffect: 0.05 } },
        { id: 'fb_in_2b', text: "I'm forever grateful. They gave me this chance.", tone: 'humble', hiddenEffects: { repEffect: 0.05, teamEffect: 0.08 } },
        { id: 'fb_in_2c', text: "Let's just say I've outgrown some of their expectations.", tone: 'aggressive', hiddenEffects: { repEffect: -0.1, teamEffect: -0.1, controversyAdd: 5 } },
        { id: 'fb_in_2d', text: "We work well together. That's all that matters.", tone: 'deflecting', hiddenEffects: { repEffect: 0 } }
      ]
    }
  ],
  global: [
    {
      id: 'fb_int_glob_1',
      question: "There's been speculation about your future. Care to address the rumors?",
      context: 'A renowned motorsport journalist leans forward.',
      options: [
        { id: 'fb_ig_1a', text: "I'm happy where I am. The rest is just noise.", tone: 'diplomatic', hiddenEffects: { repEffect: 0.05 } },
        { id: 'fb_ig_1b', text: "My focus is on winning. The rest takes care of itself.", tone: 'confident', hiddenEffects: { repEffect: 0.03 } },
        { id: 'fb_ig_1c', text: "When the top teams come calling, you listen.", tone: 'bold', hiddenEffects: { repEffect: -0.1, teamEffect: -0.1, controversyAdd: 8 } },
        { id: 'fb_ig_1d', text: "No comment on that. I respect my current commitments.", tone: 'deflecting', hiddenEffects: { repEffect: 0, teamEffect: 0.03 } }
      ]
    },
    {
      id: 'fb_int_glob_2',
      question: "Your rivalry with [rival] has intensified. Is this personal now?",
      context: 'The question everyone wanted asked.',
      rivalMentioned: 'rival',
      options: [
        { id: 'fb_ig_2a', text: "It's competition. Nothing personal. We both want to win.", tone: 'diplomatic', hiddenEffects: { repEffect: 0.05 } },
        { id: 'fb_ig_2b', text: "I respect them. They push me to be better.", tone: 'humble', hiddenEffects: { repEffect: 0.08, rivalEffect: 0.05 } },
        { id: 'fb_ig_2c', text: "They know I'm faster. The results speak for themselves.", tone: 'aggressive', hiddenEffects: { repEffect: -0.1, rivalEffect: -0.15, controversyAdd: 10 } },
        { id: 'fb_ig_2d', text: "I don't think about them. I think about winning.", tone: 'confident', hiddenEffects: { repEffect: 0.02 } }
      ]
    }
  ],
  tv: [
    {
      id: 'fb_int_tv_1',
      question: "Millions are watching. In one sentence, who are you as a driver?",
      context: 'The studio lights are blinding. This is the big time.',
      options: [
        { id: 'fb_it_1a', text: "Someone who never stops working, never stops believing.", tone: 'humble', hiddenEffects: { repEffect: 0.1 } },
        { id: 'fb_it_1b', text: "A winner. Simple as that.", tone: 'confident', hiddenEffects: { repEffect: 0.05 } },
        { id: 'fb_it_1c', text: "The best driver on this grid. Full stop.", tone: 'aggressive', hiddenEffects: { repEffect: -0.15, controversyAdd: 12 } },
        { id: 'fb_it_1d', text: "A racer who lives for the sport and respects its history.", tone: 'diplomatic', hiddenEffects: { repEffect: 0.08 } }
      ]
    },
    {
      id: 'fb_int_tv_2',
      question: "Let's talk about that controversial moment. What really happened?",
      context: 'The host goes for the jugular.',
      options: [
        { id: 'fb_it_2a', text: "Racing incident. It happens. We've both moved on.", tone: 'diplomatic', hiddenEffects: { repEffect: 0.05 } },
        { id: 'fb_it_2b', text: "I made the right call. The stewards agreed.", tone: 'confident', hiddenEffects: { repEffect: 0 } },
        { id: 'fb_it_2c', text: "Look, if you can't handle hard racing, find another sport.", tone: 'aggressive', hiddenEffects: { repEffect: -0.2, controversyAdd: 15, sponsorRisk: true } },
        { id: 'fb_it_2d', text: "I've said all I'm going to say on that matter.", tone: 'deflecting', hiddenEffects: { repEffect: -0.05 } }
      ]
    },
    {
      id: 'fb_int_tv_3',
      question: "What legacy do you want to leave in motorsport?",
      context: 'A reflective moment on national television.',
      options: [
        { id: 'fb_it_3a', text: "To inspire the next generation. To show what's possible with hard work.", tone: 'humble', hiddenEffects: { repEffect: 0.12 } },
        { id: 'fb_it_3b', text: "Championships. Records. The stats that matter.", tone: 'confident', hiddenEffects: { repEffect: 0.05 } },
        { id: 'fb_it_3c', text: "I want them to remember me as the greatest of my era.", tone: 'bold', hiddenEffects: { repEffect: -0.05, controversyAdd: 5 } },
        { id: 'fb_it_3d', text: "Someone who gave everything for the sport they love.", tone: 'diplomatic', hiddenEffects: { repEffect: 0.1 } }
      ]
    }
  ]
}

function getFallbackInterviewQuestions(context: InterviewContext, count: number): GeneratedQuestion[] {
  const tierQuestions = FALLBACK_INTERVIEW_QUESTIONS[context.tier] || FALLBACK_INTERVIEW_QUESTIONS.national
  
  // Replace rivalry placeholder if we have a rival name
  return tierQuestions.slice(0, count).map(q => ({
    ...q,
    question: context.rivalName ? q.question.replace('[rival]', context.rivalName) : q.question,
    rivalMentioned: q.rivalMentioned === 'rival' ? context.rivalName : q.rivalMentioned
  }))
}

/**
 * Determine interview outcome based on responses
 */
export function calculateInterviewOutcome(
  responses: { tone: MediaTone; hiddenEffects: GeneratedResponseOption['hiddenEffects'] }[],
  tier: string
): { outcome: 'success' | 'neutral' | 'disaster'; bonusMultiplier: number; headline: string } {
  let totalRep = 0
  let controversyTotal = 0
  let disasterRisk = 0
  
  for (const resp of responses) {
    totalRep += resp.hiddenEffects.repEffect
    controversyTotal += resp.hiddenEffects.controversyAdd || 0
    
    if (resp.tone === 'aggressive') disasterRisk += 0.2
    if (resp.hiddenEffects.sponsorRisk) disasterRisk += 0.15
  }
  
  // Higher tiers = higher stakes
  const tierRiskMultiplier: Record<string, number> = {
    local: 0.5,
    national: 1.0,
    global: 1.5,
    tv: 2.0
  }
  disasterRisk *= tierRiskMultiplier[tier] || 1.0
  
  // Determine outcome
  let outcome: 'success' | 'neutral' | 'disaster'
  let bonusMultiplier: number
  let headline: string
  
  if (totalRep > 0.1 && disasterRisk < 0.3) {
    outcome = 'success'
    bonusMultiplier = 1.5
    headline = 'Interview wins over fans'
  } else if (disasterRisk > 0.6 || totalRep < -0.2) {
    outcome = 'disaster'
    bonusMultiplier = 0.25
    headline = 'Controversial interview sparks backlash'
  } else {
    outcome = 'neutral'
    bonusMultiplier = 1.0
    headline = 'Standard interview performance'
  }
  
  return { outcome, bonusMultiplier, headline }
}

// ============================================
// SOCIAL MEDIA POST GENERATION
// ============================================

export interface SocialPostContext {
  playerName: string
  teamName: string
  seriesName: string
  postType: string
  tone: MediaTone
  lastRaceResult?: { position: number; trackName: string; dnf?: boolean }
  followerCount: number
  mediaPersona?: MediaPersona
  // Race week context
  isRaceWeek?: boolean
  isPostRace?: boolean
  upcomingTrack?: string
  recentWin?: boolean
  recentPodium?: boolean
  recentDNF?: boolean
}

// ============================================
// AI SOCIAL POST GENERATION
// ============================================

const SOCIAL_POST_SYSTEM_PROMPT = `You are a social media manager for a racing driver. Generate authentic, engaging social media posts that match the driver's tone and the context of the post.

CRITICAL RULES:
1. Posts must feel authentic and match the tone exactly
2. Include appropriate emojis (2-4 per post)
3. Keep posts concise (under 280 characters)
4. Match the post type context (training, fan appreciation, race result, etc.)
5. Humble posts are grateful and modest
6. Confident posts are self-assured but respectful
7. Bold posts make statements and show swagger
8. Aggressive posts are provocative and confrontational
9. Diplomatic posts are professional and careful
10. Deflecting posts are minimal and vague

Respond with ONLY the post text, no JSON wrapping.`

export interface AIPostContext {
  playerName: string
  teamName: string
  seriesName: string
  postType: string
  tone: MediaTone
  lastRaceResult?: { position: number; trackName: string; dnf?: boolean }
  followerCount: number
  rivalName?: string
  controversyLevel?: number
  championshipPosition?: number
  isChampionshipContender?: boolean
  // Race week context
  isRaceWeek?: boolean
  isPostRace?: boolean
  upcomingTrack?: string
  recentWin?: boolean
  recentPodium?: boolean
  recentDNF?: boolean
}

/**
 * Generate social media post text using AI
 */
export async function generateAISocialPost(context: AIPostContext): Promise<string | null> {
  const apiKey = await getGeminiKey()
  
  if (!apiKey) {
    console.log('[MediaAI] No API key for social post generation')
    return null
  }
  
  const prompt = buildSocialPostPrompt(context)
  
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          { role: 'system', content: SOCIAL_POST_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.95
      })
    })
    
    if (!response.ok) {
      console.error('[MediaAI] Social post API error:', response.status)
      return null
    }
    
    const data = await response.json()
    const finishReason = data.choices?.[0]?.finish_reason
    let content = data.choices?.[0]?.message?.content?.trim()
    
    console.log('[MediaAI] Social post finish_reason:', finishReason)
    console.log('[MediaAI] Social post raw content:', content)
    
    if (!content) {
      console.log('[MediaAI] No content in social post response')
      return null
    }
    
    // Check if response was truncated
    if (finishReason === 'length') {
      console.log('[MediaAI] Social post was truncated, using fallback')
      return null
    }
    
    // Clean up the response - remove any quotes, code blocks, or formatting
    content = content
      .replace(/```[\s\S]*?```/g, '')  // Remove code blocks
      .replace(/^["'`]|["'`]$/g, '')   // Remove surrounding quotes
      .replace(/^Post:\s*/i, '')        // Remove "Post:" prefix if present
      .replace(/^\*\*.*?\*\*\s*/g, '') // Remove bold text headers
      .replace(/\n/g, ' ')              // Replace newlines with spaces
      .trim()
    
    // If content is too short (likely truncated), return null to use fallback
    if (content.length < 30) {
      console.log('[MediaAI] Social post too short, likely truncated. Using fallback.')
      return null
    }
    
    console.log('[MediaAI] Generated social post:', content)
    return content
    
  } catch (e) {
    console.error('[MediaAI] Social post generation failed:', e)
    return null
  }
}

function buildSocialPostPrompt(context: AIPostContext): string {
  const postTypeDescriptions: Record<string, string> = {
    training_update: 'Training/gym session update - showing dedication',
    fan_appreciation: 'Thanking fans for their support',
    post_race_win: `Celebrating a race WIN at ${context.lastRaceResult?.trackName || 'the track'}`,
    post_race_podium: `Celebrating a P${context.lastRaceResult?.position} podium finish at ${context.lastRaceResult?.trackName || 'the track'}`,
    race_photo: 'Sharing a racing photo from the weekend',
    behind_scenes: 'Behind the scenes content from the paddock/factory',
    team_appreciation: 'Thanking the team and crew',
    fan_qa: 'Announcing a Q&A session with fans',
    charity_highlight: 'Highlighting charity/community work',
    sponsor_shoutout: 'Thanking sponsors and partners',
    track_preview: `Previewing the upcoming race at ${context.lastRaceResult?.trackName || 'the next track'}`,
    throwback_memory: 'Throwback/memory post about a past moment',
    equipment_showcase: 'Showing off helmet, gear, or equipment',
    lifestyle_post: 'Life outside racing - relaxation, hobbies',
    championship_push: 'Championship battle/title push content',
    comeback_update: 'Comeback/recovery update after setback',
    rival_callout: `Calling out or responding to rival ${context.rivalName || 'competitor'}`,
    team_criticism: 'Expressing frustration with team/equipment',
    incident_reaction: 'Reacting to an on-track incident',
    paddock_gossip: 'Commenting on paddock news/rumors',
    media_clap_back: 'Responding to media criticism'
  }
  
  let additionalContext = ''
  
  // RACE WEEK CONTEXT - Critical for contextual posts
  if (context.isRaceWeek && context.upcomingTrack) {
    additionalContext += `\n🏁 RACE WEEK: Upcoming race at ${context.upcomingTrack}! Post should focus on the upcoming race, preparation, or excitement.`
  } else if (context.isPostRace && context.lastRaceResult) {
    if (context.recentWin) {
      additionalContext += `\n🏆 POST-RACE (VICTORY): Just won at ${context.lastRaceResult.trackName}! Post should celebrate the win.`
    } else if (context.recentPodium) {
      additionalContext += `\n🥈 POST-RACE (PODIUM): Just finished P${context.lastRaceResult.position} at ${context.lastRaceResult.trackName}! Post should reflect on the result.`
    } else if (context.recentDNF) {
      additionalContext += `\n💔 POST-RACE (DNF): Retired from the race at ${context.lastRaceResult.trackName}. Post should address the setback.`
    } else {
      additionalContext += `\n🏎️ POST-RACE: Finished P${context.lastRaceResult.position} at ${context.lastRaceResult.trackName}. Post should reflect on the weekend.`
    }
  } else {
    additionalContext += '\n📅 OFF-WEEK: Between races. Post can be about training, fans, or general content.'
  }
  
  if (context.lastRaceResult && !context.isRaceWeek) {
    additionalContext += `\nLast race: P${context.lastRaceResult.position} at ${context.lastRaceResult.trackName}${context.lastRaceResult.dnf ? ' (DNF)' : ''}`
  }
  if (context.championshipPosition) {
    additionalContext += `\nChampionship position: P${context.championshipPosition}`
  }
  if (context.isChampionshipContender) {
    additionalContext += '\nCurrently in title contention!'
  }
  if (context.rivalName && context.postType.includes('rival')) {
    additionalContext += `\nRival: ${context.rivalName}`
  }
  if (context.controversyLevel && context.controversyLevel > 30) {
    additionalContext += '\nCurrently under media scrutiny'
  }
  additionalContext += `\nFollower count: ${context.followerCount.toLocaleString()}`

  return `Generate a social media post for this racing driver:

DRIVER: ${context.playerName}
TEAM: ${context.teamName}
SERIES: ${context.seriesName}
POST TYPE: ${postTypeDescriptions[context.postType] || context.postType}
TONE: ${context.tone.toUpperCase()}
${additionalContext}

Generate ONLY the post text (under 280 chars), nothing else. Include 2-4 relevant emojis.`
}

// ============================================
// TEMPLATE FALLBACK POST GENERATION
// ============================================

const POST_TEMPLATES: Record<string, Record<MediaTone, string[]>> = {
  training_update: {
    humble: [
      "Another day grinding 💪 Always room to improve. #NeverStop",
      "Early morning sim session complete. The work continues 🏎️",
      "Putting in the hours. Every session counts. #WorkInProgress"
    ],
    confident: [
      "Feeling sharp after today's training. Ready for anything 💪",
      "Every lap makes me faster. The competition should be worried 🏁",
      "Training complete. Confidence at an all-time high 🔥"
    ],
    bold: [
      "Outworking everyone. No one puts in the hours I do 💪🔥",
      "While they sleep, I train. That's why I win 🏆",
      "Training isn't optional - it's why I'm the best 💯"
    ],
    aggressive: [
      "Training while my rivals are probably playing video games 😤",
      "The gap between me and everyone else just got wider 💪",
      "Working harder than anyone. Don't @ me with excuses 🔥"
    ],
    diplomatic: [
      "Great training session today. Grateful for the facilities and team support 🙏",
      "Continuous improvement is the goal. One session at a time 🏎️",
      "Investing in myself. The journey continues 💪"
    ],
    deflecting: [
      "Training day ✅",
      "Putting in the work 🏎️",
      "Back at it 💪"
    ]
  },
  fan_appreciation: {
    humble: [
      "To everyone supporting me - THANK YOU 🙏 You make this possible",
      "The messages, the flags, the cheers - I see it all. Grateful for each of you ❤️",
      "This journey wouldn't mean anything without you all. Thank you 🙏"
    ],
    confident: [
      "Best fans in motorsport! Your energy pushes me to greatness 🏆",
      "Shoutout to the best fanbase out there! Let's keep winning together 💪",
      "My fans understand greatness. That's why you support me 🔥"
    ],
    bold: [
      "My fans are ride or die. The ONLY fanbase that matters 🔥",
      "To my army: we're just getting started. World domination incoming 💪",
      "Best fans, best driver. Coincidence? I think not 😎"
    ],
    aggressive: [
      "My fans get it. The haters? They'll learn 😤",
      "Thanks to everyone who believed when others doubted. We remember 💪",
      "Real fans only. The rest can unfollow 🔥"
    ],
    diplomatic: [
      "Grateful for every single supporter. Your encouragement means everything 🙏",
      "To the fans around the world - thank you for making this sport special ❤️",
      "Racing is nothing without the fans. Thank you all 🏎️"
    ],
    deflecting: [
      "Thanks everyone 🙏",
      "Appreciate the support ❤️",
      "Grateful 🏎️"
    ]
  },
  post_race_win: {
    humble: [
      "P1! 🏆 This one's for the team. Couldn't do it without every single person in that garage 🙏",
      "Winner!! Still can't believe it. Thank you all for believing in me ❤️",
      "Victory! The team was perfect today. Blessed to be part of this 🏁"
    ],
    confident: [
      "Victory! 🏆 Hard work pays off. This is what we train for 💪",
      "P1! When you prepare like we do, results follow 🏁",
      "Another one! The momentum is building 🔥"
    ],
    bold: [
      "WINNER! 🏆 Did anyone really doubt it? 😎",
      "P1! I told you I'd win. I always do 💪🔥",
      "Victory! This is my era. Get used to it 🏆"
    ],
    aggressive: [
      "P1! Talk all you want - I answer on track 😤🏆",
      "WINNER! To everyone who doubted: SCOREBOARD 🔥",
      "Victory! Keep the same energy when I'm on top 💪"
    ],
    diplomatic: [
      "Race win! 🏆 Incredible teamwork and strategy. Grateful for this moment 🙏",
      "P1! What a race. Thank you to everyone who made this possible 🏁",
      "Victory! The whole team executed perfectly today. Proud moment ❤️"
    ],
    deflecting: [
      "P1! 🏆",
      "Win! Thanks everyone 🏁",
      "Got the job done today 💪"
    ]
  },
  post_race_podium: {
    humble: [
      "P{POS}! Podium! 🏆 So happy for the team. We maximized everything today 🙏",
      "Podium finish! Learning and improving every race. Thank you all ❤️",
      "P{POS}! A step in the right direction. Grateful for this result 🏁"
    ],
    confident: [
      "Podium! P{POS}! 🏆 Solid performance. Next time, the top step 💪",
      "P{POS}! We're right there. The wins are coming 🔥",
      "Another podium! Consistency is king 🏁"
    ],
    bold: [
      "P{POS}! Podium is nice but I race for P1. Next time 🔥",
      "Podium! 🏆 Good, but not good enough. I want MORE 💪",
      "P{POS}! A taste of what's coming. Prepare yourselves 😎"
    ],
    aggressive: [
      "P{POS}! Podium despite [everything/everyone]. Imagine what I'll do with a fair fight 😤",
      "Podium! Could've won but we'll take it. For now 💪",
      "P{POS}! The doubters are running out of excuses 🔥"
    ],
    diplomatic: [
      "P{POS}! Great result for the team. Building momentum 🏁",
      "Podium! 🏆 Every point matters. Happy with today's work 🙏",
      "P{POS}! Solid performance from everyone. Onwards and upwards 💪"
    ],
    deflecting: [
      "P{POS}! Podium 🏆",
      "Good result today 🏁",
      "Happy with that 💪"
    ]
  },
  race_photo: {
    humble: [
      "Living the dream 📸 So grateful to be doing what I love 🏎️",
      "Race weekend vibes 📸 Thank you all for the incredible support 🙏",
      "Moments like these make all the hard work worth it 📸❤️"
    ],
    confident: [
      "Race day ready 📸 Time to deliver 💪",
      "In my element 📸 This is where I belong 🏎️",
      "Weekend warrior 📸 Let's go racing 🔥"
    ],
    bold: [
      "Main character energy 📸😎",
      "Built for this 📸 Watch and learn 🔥",
      "Looking like a winner because I am one 📸💪"
    ],
    aggressive: [
      "Race face on 📸 No mercy this weekend 😤",
      "Locked in 📸 My competitors should be nervous 🔥",
      "Picture says it all 📸 Hungry and ready to feast 💪"
    ],
    diplomatic: [
      "Another race weekend, another opportunity 📸 Excited for what's ahead 🏎️",
      "Grateful for every race 📸 Let's make it count 🙏",
      "Race day 📸 Time to focus and execute 💪"
    ],
    deflecting: [
      "Race weekend 📸",
      "Ready to go 🏎️",
      "Let's race 🏁"
    ]
  },
  behind_scenes: {
    humble: [
      "The team behind the scenes 🎬 These people work miracles 🙏",
      "BTS of race prep 🎬 So many people making this happen ❤️",
      "Factory visit 🎬 Always learning, always grateful 🏎️"
    ],
    confident: [
      "Behind the scenes look 🎬 This is how winners prepare 💪",
      "Exclusive access 🎬 The championship-winning operation 🔥",
      "Factory time 🎬 Building something special here 🏎️"
    ],
    bold: [
      "Sneak peek at greatness in the making 🎬😎",
      "BTS 🎬 This is what a winning team looks like 💪",
      "Factory tour 🎬 Future champions only 🔥"
    ],
    aggressive: [
      "BTS 🎬 While others post, we work 😤",
      "The grind never stops 🎬 Outworking everyone 💪",
      "Factory secrets 🎬 Good luck catching up 🔥"
    ],
    diplomatic: [
      "Behind the scenes 🎬 Teamwork makes the dream work 🏎️",
      "A look at the operation 🎬 Proud to be part of this 🙏",
      "Factory focus 🎬 Everyone working toward the same goal ❤️"
    ],
    deflecting: [
      "BTS 🎬",
      "Team visit 🏎️",
      "Work mode 💪"
    ]
  },
  team_appreciation: {
    humble: [
      "To my team: THANK YOU 🙏 None of this is possible without you ❤️",
      "The unsung heroes 🙏 These people give everything for this sport",
      "Grateful for the best team in the paddock 🏎️❤️"
    ],
    confident: [
      "Best team in the business 💪 That's why we win 🏆",
      "Team appreciation post 🙏 We're built different 🔥",
      "My crew 💪 Champions behind the champions 🏎️"
    ],
    bold: [
      "The best team with the best driver 💪 Unstoppable combination 🔥",
      "My team = my family = my army 🏆 Enemies beware 😎",
      "These legends deserve a raise 💪 Making me look good every week 🔥"
    ],
    aggressive: [
      "My team works harder than your whole organization 😤",
      "Team appreciation 💪 You can't beat us because you can't outwork us 🔥",
      "Best crew in the paddock. Facts 💪 Don't @ me"
    ],
    diplomatic: [
      "Shoutout to the incredible team 🙏 Your dedication is inspiring ❤️",
      "Team first, always 🏎️ Grateful for every single person",
      "The people who make it all possible 🙏 Thank you ❤️"
    ],
    deflecting: [
      "Team 🙏",
      "Grateful 🏎️",
      "Thank you team ❤️"
    ]
  },
  fan_qa: {
    humble: [
      "Q&A time! 🎤 Ask me anything - I'm an open book 🙏",
      "Fan Q&A! 🎤 Love connecting with you all ❤️ Drop your questions!",
      "Your questions, my answers 🎤 Let's chat! 🏎️"
    ],
    confident: [
      "Q&A session! 🎤 Hit me with your best questions 💪",
      "Fan questions incoming! 🎤 Ready for anything 🔥",
      "Q&A time! 🎤 Let's hear what you want to know 🏎️"
    ],
    bold: [
      "Q&A! 🎤 Ask anything - I've got nothing to hide 😎",
      "Fan Q&A! 🎤 Unfiltered answers only 🔥",
      "Questions? 🎤 I'll tell you the truth others won't 💪"
    ],
    aggressive: [
      "Q&A! 🎤 Bring it. I'll answer the haters too 😤",
      "Fan questions! 🎤 No filter, no excuses 🔥",
      "Q&A time! 🎤 Trolls will be educated 💪"
    ],
    diplomatic: [
      "Fan Q&A! 🎤 Love hearing from you all. Ask away! 🙏",
      "Q&A session! 🎤 Great way to connect with supporters ❤️",
      "Questions welcome! 🎤 Happy to share insights 🏎️"
    ],
    deflecting: [
      "Q&A 🎤",
      "Ask me questions 🏎️",
      "Taking questions 💪"
    ]
  },
  charity_highlight: {
    humble: [
      "Proud to support [cause] 🙏 These moments remind us what really matters ❤️",
      "Charity work today 🙏 Using this platform for good is a privilege",
      "Giving back 🙏 So grateful to help those in need ❤️"
    ],
    confident: [
      "Supporting [cause] today 💪 Drivers have a responsibility to give back",
      "Charity event 🙏 Important to use our voice for good 🔥",
      "Making a difference 💪 Racing gives me the platform, I choose to help ❤️"
    ],
    bold: [
      "Big charity push today 💪 Motorsport can change the world 🌍",
      "Supporting [cause] 🙏 Time to make some noise 🔥",
      "Charity work 💪 Actions speak louder than words - let's GO 🏆"
    ],
    aggressive: [
      "Charity matters more than racing 🙏 If you disagree, unfollow me",
      "Supporting [cause] 💪 Some things are bigger than winning",
      "Real talk: give back or shut up 🙏 Today I'm giving back ❤️"
    ],
    diplomatic: [
      "Honored to support [cause] 🙏 Important work being done here ❤️",
      "Charity highlight 🙏 Grateful for the opportunity to help",
      "Giving back to the community 🙏 One of my proudest moments ❤️"
    ],
    deflecting: [
      "Charity day 🙏",
      "Giving back ❤️",
      "Important cause 🙏"
    ]
  },
  // === NEW POST TYPES ===
  sponsor_shoutout: {
    humble: [
      "Huge thanks to our partners for believing in us 🙏 Couldn't do it without you! #Grateful",
      "Shoutout to the incredible sponsors who make this journey possible ❤️",
      "So thankful for our partners' support 🙏 Together we achieve more 🏎️"
    ],
    confident: [
      "Big thanks to our sponsors for backing a winning team 💪🏆",
      "Proud to partner with the best brands in the business 🔥 #Partnership",
      "Our sponsors see the potential - together we deliver 💪"
    ],
    bold: [
      "The best driver deserves the best sponsors 😎 Thank you for believing! 🔥",
      "Shoutout to partners who back champions 💪 You picked the right one!",
      "Our sponsors know a winner when they see one 🏆 Let's GO!"
    ],
    aggressive: [
      "Unlike some, our sponsors back winners 💪 Thanks for the support!",
      "To our partners: your investment in excellence is paying off 🔥",
      "Premium sponsors for a premium driver 😤 That's how it should be"
    ],
    diplomatic: [
      "Grateful for our partners' continued support 🙏 Building something special together",
      "Pleased to work with such fantastic brands 🏎️ Thank you all!",
      "Partnership appreciation post 🙏 The support makes all the difference ❤️"
    ],
    deflecting: [
      "Thanks to our sponsors 🙏",
      "Grateful for the support 🏎️",
      "Partner appreciation 💪"
    ]
  },
  track_preview: {
    humble: [
      "Can't wait for {TRACK}! 🏁 Always a challenge here. Need to be at my best 🙏",
      "Race week! {TRACK} coming up - time to focus and deliver 🏎️",
      "Excited for {TRACK}! Such an incredible venue. Grateful to race here 🙏"
    ],
    confident: [
      "{TRACK} race week! 🏁 Feeling prepared and ready to perform 💪",
      "One of my favorite tracks coming up! {TRACK} here we come 🔥",
      "Race week at {TRACK}! The preparation has been perfect 🏎️"
    ],
    bold: [
      "{TRACK} is MY track 😎 Ready to put on a show 🔥🏆",
      "Race week! {TRACK} won't know what hit it 💪",
      "Arriving at {TRACK} like I own the place. Because soon I will 🏁"
    ],
    aggressive: [
      "{TRACK} time! 😤 I have unfinished business here 🔥",
      "Race week at {TRACK}! My rivals should be nervous 💪",
      "Heading to {TRACK}. Time to make a statement 🏁"
    ],
    diplomatic: [
      "Looking forward to racing at {TRACK}! Great track, great atmosphere 🏎️",
      "Race week preview: {TRACK} 🏁 Historic venue, excited to compete",
      "{TRACK} coming up! Always a pleasure to race at such venues 🙏"
    ],
    deflecting: [
      "{TRACK} race week 🏁",
      "Ready for the next one 🏎️",
      "Race preview 💪"
    ]
  },
  throwback_memory: {
    humble: [
      "Throwback to that special moment 📅 Still grateful for every experience 🙏",
      "Looking back at how far we've come 📅 The journey continues ❤️",
      "Memories like this keep me motivated 📅 Thank you all for being part of it 🏎️"
    ],
    confident: [
      "Throwback! 📅 Remember this one? That was a good day 💪",
      "From there to here 📅 The best is yet to come 🔥",
      "Looking back at the wins 📅 Building something legendary 🏆"
    ],
    bold: [
      "Throwback to when I showed everyone what I'm made of 📅😎",
      "This moment changed everything 📅 And I'm just getting started 🔥",
      "Classic moment 📅 Add it to the highlight reel 🏆💪"
    ],
    aggressive: [
      "Throwback to proving the doubters wrong 📅 Again 😤",
      "Remember this? 📅 Some of you owe me an apology 🔥",
      "Looking back 📅 Still better than most people's best day 💪"
    ],
    diplomatic: [
      "Throwback Thursday 📅 Great memories from the journey so far 🙏",
      "Looking back 📅 Grateful for every step of this incredible path ❤️",
      "Memory lane 📅 So many people to thank along the way 🏎️"
    ],
    deflecting: [
      "Throwback 📅",
      "Good times 🏎️",
      "Memories 🙏"
    ]
  },
  equipment_showcase: {
    humble: [
      "New lid reveal! 🪖 So grateful to the team for this beauty 🙏",
      "Helmet showcase! 🪖 Love the work that goes into every detail ❤️",
      "Racing gear check 🪖 Blessed to wear these colors 🏎️"
    ],
    confident: [
      "Helmet game strong! 🪖 Looking good, driving better 💪",
      "New gear alert! 🪖 Ready to look fast and be fast 🔥",
      "Fresh helmet design 🪖 Champion vibes only 🏆"
    ],
    bold: [
      "Best looking helmet in the paddock 🪖😎 Obviously",
      "New lid, same winner 🪖 Let's go! 🔥💪",
      "Helmet reveal! 🪖 This is what a champion wears 🏆"
    ],
    aggressive: [
      "New helmet 🪖 The last thing my rivals see before I pass them 😤",
      "Gear upgrade! 🪖 Now I look as good as I drive 🔥",
      "Fresh lid 🪖 Intimidation factor: maximum 💪"
    ],
    diplomatic: [
      "Proud to showcase this helmet design 🪖 Incredible craftsmanship 🙏",
      "New gear reveal! 🪖 Thank you to everyone who made this possible ❤️",
      "Equipment check 🪖 Grateful for top-quality gear 🏎️"
    ],
    deflecting: [
      "New gear 🪖",
      "Helmet reveal 🏎️",
      "Racing equipment 💪"
    ]
  },
  lifestyle_post: {
    humble: [
      "Life outside the car 🌴 Grateful for these moments of peace 🙏",
      "Rest day vibes 🌴 Recharging for the next challenge ❤️",
      "Behind the driver is a regular person 🌴 Family time is everything 🏎️"
    ],
    confident: [
      "Work hard, play hard 🌴 Balance is key to success 💪",
      "Living the dream, one day at a time 🌴 #BlessedLife 🔥",
      "Lifestyle check 🌴 Champions know how to relax too 🏆"
    ],
    bold: [
      "This is the life 🌴😎 You wish you were here",
      "Living my best life 🌴 Racing hard, relaxing harder 🔥",
      "Main character energy 24/7 🌴💪 On and off track"
    ],
    aggressive: [
      "My day off > Your best day 🌴😤",
      "Relaxing like a champion 🌴 Because I can 🔥",
      "Life's good when you're winning 🌴 Stay mad 💪"
    ],
    diplomatic: [
      "Enjoying some time away from the track 🌴 Balance is important 🙏",
      "Life outside racing 🌴 Grateful for these moments ❤️",
      "Rest and recovery 🌴 Ready to come back stronger 🏎️"
    ],
    deflecting: [
      "Day off 🌴",
      "Life outside racing 🏎️",
      "Relaxing 🙏"
    ]
  },
  championship_push: {
    humble: [
      "Championship battle heating up! 👑 Every point matters. Time to focus 🙏",
      "In the fight for the title 👑 Grateful for this opportunity ❤️",
      "Title push mode 👑 Let's give everything and see where we end up 🏎️"
    ],
    confident: [
      "Championship push! 👑 We're ready to fight for this 💪",
      "Title contention 👑 This is what we've been building for 🔥",
      "In the mix for the championship 👑 Time to deliver 🏆"
    ],
    bold: [
      "Coming for that title 👑 Try and stop me 😎",
      "Championship mode: ACTIVATED 👑 This one's mine 🔥💪",
      "Title fight? More like title claim 👑 Watch this space 🏆"
    ],
    aggressive: [
      "Championship time 👑 I'm taking this and nobody's stopping me 😤",
      "Title push 👑 My rivals should be worried. Very worried 🔥",
      "Coming for the crown 👑 All gas, no brakes 💪"
    ],
    diplomatic: [
      "Focused on the championship 👑 Every race counts now 🏎️",
      "In the title fight 👑 Exciting times ahead 🙏",
      "Championship battle 👑 Honored to be competing at this level ❤️"
    ],
    deflecting: [
      "Championship push 👑",
      "Title fight 🏎️",
      "Every point counts 💪"
    ]
  },
  comeback_update: {
    humble: [
      "Working our way back 🔥 Tough times don't last, tough teams do 🙏",
      "Comeback loading 🔥 Learning from every setback ❤️",
      "Not where we want to be, but we're fighting 🔥 Thank you for the support 🏎️"
    ],
    confident: [
      "Comeback szn 🔥 We're not done yet - not even close 💪",
      "Bouncing back stronger 🔥 This is just a chapter, not the story 🏆",
      "Resilience mode 🔥 Watch us turn this around 🔥"
    ],
    bold: [
      "Comeback incoming 🔥 You thought we were done? Think again 😎",
      "Writing my redemption arc 🔥 Stay tuned 💪",
      "Down but NEVER out 🔥 The comeback will be legendary 🏆"
    ],
    aggressive: [
      "To everyone who counted us out: we're coming 🔥😤",
      "Comeback mode 🔥 Doubters will be silenced 💪",
      "Remember who laughed when we struggled 🔥 We remember too"
    ],
    diplomatic: [
      "Building back momentum 🔥 Focused on improvement 🙏",
      "Recovery update 🔥 Taking it one step at a time ❤️",
      "Comeback journey 🔥 Grateful for everyone's patience 🏎️"
    ],
    deflecting: [
      "Working on it 🔥",
      "Getting better 🏎️",
      "Comeback loading 💪"
    ]
  },
  // === CONTROVERSIAL POST TYPES ===
  rival_callout: {
    humble: [
      "Some drivers should focus more on their own driving 🎯 Just saying... 🤷",
      "Interesting tactics from certain competitors 🎯 We take note 🏎️",
      "I try to stay humble but some people make it hard 🎯 You know who you are"
    ],
    confident: [
      "Hey {RIVAL}, I'll be waiting at the next race 🎯 Bring your A-game 💪",
      "Some drivers talk a lot for people who finish behind me 🎯🏆",
      "To my rival: keep watching my mirrors, that's the view you're used to 🎯"
    ],
    bold: [
      "{RIVAL} wants smoke? They'll get smoke 🎯🔥 See you on track",
      "Calling out {RIVAL}! Let's settle this where it matters 🎯💪",
      "Some people should race as well as they talk 🎯 Looking at you, {RIVAL} 😎"
    ],
    aggressive: [
      "{RIVAL} is all talk and no pace 🎯 Facts 😤",
      "Hey {RIVAL}! Your driving is as bad as your personality 🎯🔥",
      "Someone tell {RIVAL} that I own them on track 🎯 The numbers don't lie 💪"
    ],
    diplomatic: [
      "Healthy rivalry makes us all better 🎯 Right, {RIVAL}? 🏎️",
      "Competition brings out the best in us 🎯 Looking forward to the next battle 🙏",
      "Respect the competition, but I'm here to win 🎯 {RIVAL} knows this 💪"
    ],
    deflecting: [
      "Rivalry talk 🎯",
      "Looking forward to racing {RIVAL} 🏎️",
      "May the best driver win 💪"
    ]
  },
  team_criticism: {
    humble: [
      "Frustrated today but we'll figure it out together 😤 Hard conversations needed 🏎️",
      "Not the performance we needed 😤 I know we can do better as a team",
      "Difficult day 😤 Time for honest discussions about where we are"
    ],
    confident: [
      "We need to step it up as a team 😤 I'm doing my part 💪",
      "Expecting more from the operation 😤 We've got work to do 🏎️",
      "Today showed we need improvements 😤 Starting Monday"
    ],
    bold: [
      "Honestly? The team let me down today 😤 I deserve better equipment 🔥",
      "Hard to win when the car isn't there 😤 Time for changes",
      "I can only drive what I'm given 😤 And what I'm given isn't good enough"
    ],
    aggressive: [
      "The team dropped the ball today 😤 Unacceptable performance 🔥",
      "I'm doing MY job. Others need to do theirs 😤💪",
      "I'm fed up with losing due to things outside my control 😤 Heads need to roll"
    ],
    diplomatic: [
      "We need to have some conversations as a team 😤 Room for improvement",
      "Not pointing fingers but we need to analyze today's performance 🏎️",
      "Constructive criticism time 😤 We can do better than this"
    ],
    deflecting: [
      "Frustrating day 😤",
      "We need to improve 🏎️",
      "Not good enough 💪"
    ]
  },
  incident_reaction: {
    humble: [
      "Racing incident. These things happen. Moving on 💥 🙏",
      "Contact on track today 💥 I'll review the footage and learn from it",
      "That move was questionable 💥 But I'll take the high road 🏎️"
    ],
    confident: [
      "Interesting move there 💥 Some people need driving lessons 💪",
      "About that incident today 💥 I know what I saw. Do you? 🏁",
      "Racing hard is one thing, that was something else 💥 Moving on 🔥"
    ],
    bold: [
      "That wasn't racing, that was desperation 💥 I see you 😎",
      "Some drivers crack under pressure 💥 Couldn't handle me being faster 🔥",
      "Incident? More like a gift - exposed who can't race wheel to wheel 💥💪"
    ],
    aggressive: [
      "What a DIRTY move! 💥 No respect for that kind of racing 😤",
      "If you can't beat me clean, try harder 💥 Not cheat harder 🔥",
      "Absolutely unacceptable driving 💥 Stewards better take notice 💪"
    ],
    diplomatic: [
      "Racing incident under investigation 💥 I'll let the stewards decide 🏎️",
      "Things got heated out there 💥 That's motorsport. Next race 🙏",
      "Contact on track 💥 Part of racing. No hard feelings... for now 💪"
    ],
    deflecting: [
      "Racing incident 💥",
      "These things happen 🏎️",
      "Moving on 💪"
    ]
  },
  paddock_gossip: {
    humble: [
      "Interesting things happening in the paddock lately 🗣️ Just observations... 🏎️",
      "The silly season rumors are wild 🗣️ Not saying anything but... 🙏",
      "Hearing some interesting things around here 🗣️ That's all I'll say ❤️"
    ],
    confident: [
      "Paddock talk is fascinating 🗣️ Some of you aren't ready for what's coming 💪",
      "If the rumors I'm hearing are true... wow 🗣️ Just wow 🔥",
      "Things are about to get interesting around here 🗣️ Stay tuned 🏁"
    ],
    bold: [
      "The paddock politics are WILD right now 🗣️ I'm just watching and laughing 😎",
      "Some teams are in chaos behind the scenes 🗣️ Not naming names... yet 🔥",
      "If you knew what I know about some of these teams 🗣️ Popcorn time 💪"
    ],
    aggressive: [
      "Some people in this paddock are snakes 🗣️ You know who you are 😤",
      "The politics here disgust me sometimes 🗣️ Just let us race 🔥",
      "Hearing things that would shock the fans 🗣️ The truth always comes out 💪"
    ],
    diplomatic: [
      "Interesting dynamics in the paddock this season 🗣️ Motorsport is fascinating 🏎️",
      "The story behind the scenes is always interesting 🗣️ More to racing than driving 🙏",
      "Paddock observations 🗣️ This sport never gets boring ❤️"
    ],
    deflecting: [
      "Paddock life 🗣️",
      "Interesting times 🏎️",
      "No comment 🙏"
    ]
  },
  media_clap_back: {
    humble: [
      "Saw some headlines today 🔙 I'll let my driving do the talking 🙏",
      "The media doesn't always get it right 🔙 That's okay. I know the truth 🏎️",
      "Addressing the recent articles 🔙 Taking the high road. Results will speak ❤️"
    ],
    confident: [
      "To the media: write what you want 🔙 I'm focused on winning 💪",
      "Headlines don't win championships. I do 🔙 Stay tuned 🔥",
      "Some journalists need new material 🔙 My track record speaks for itself 🏆"
    ],
    bold: [
      "Media got it wrong AGAIN 🔙 Do some actual research 😎",
      "That article was a joke 🔙 I've forgotten more about racing than that writer knows 🔥",
      "Fake news alert! 🔙 The truth doesn't match their narrative 💪"
    ],
    aggressive: [
      "Absolute GARBAGE journalism 🔙 How do these people have jobs? 😤",
      "To that reporter: see you in the paddock 🔙 We need to talk 🔥",
      "Media trying to create drama 🔙 I'm creating WINS. Big difference 💪"
    ],
    diplomatic: [
      "Some recent coverage has been... interesting 🔙 I prefer to focus forward 🏎️",
      "Media response: I understand they need stories 🔙 But accuracy matters 🙏",
      "Addressing recent press 🔙 Happy to clarify the facts ❤️"
    ],
    deflecting: [
      "No comment on that 🔙",
      "Moving forward 🏎️",
      "Results will speak 💪"
    ]
  }
}

/**
 * Generate social media post text
 */
export function generatePostText(context: SocialPostContext): string {
  const typeTemplates = POST_TEMPLATES[context.postType]
  if (!typeTemplates) {
    return `Just another day in motorsport 🏎️ #Racing`
  }
  
  const toneTemplates = typeTemplates[context.tone] || typeTemplates.diplomatic
  const template = toneTemplates[Math.floor(Math.random() * toneTemplates.length)]
  
  // Replace placeholders
  let post = template
  if (context.lastRaceResult) {
    post = post.replace('{POS}', context.lastRaceResult.position.toString())
    post = post.replace('{TRACK}', context.lastRaceResult.trackName)
  }
  post = post.replace('[cause]', 'this important cause')
  post = post.replace('[everything/everyone]', 'the odds')
  
  return post
}

// ============================================
// ENGAGEMENT SIMULATION
// ============================================

export interface EngagementResult {
  likes: number
  comments: number
  shares: number
  wentViral: boolean
  viralMultiplier: number
  followerGain: number
  hadBacklash: boolean
  backlashSeverity: number
  sentiment: 'positive' | 'mixed' | 'negative'
  fanReactions: string[]
}

const FAN_REACTIONS = {
  positive: [
    "🔥🔥🔥", "Legend!", "GOAT in the making!", "Let's gooo!", "Massive respect 🙏",
    "Best driver on the grid!", "This is why we support you!", "Champion mentality!",
    "Love this energy!", "King/Queen of racing 👑", "Inspiring stuff!",
    "Pure class!", "We believe in you!", "The future is bright!", "Keep winning! 🏆"
  ],
  neutral: [
    "Good luck!", "Interesting...", "Cool post", "👍", "Keep at it",
    "Fair enough", "Noted", "Ok", "Makes sense", "We'll see"
  ],
  negative: [
    "Focus on driving instead of social media 🙄", "Overrated", "Talk is cheap",
    "Let your results do the talking", "Cringe", "This ain't it", 
    "Humble yourself", "Back it up on track then", "All talk, no substance",
    "Your rival is better", "Sponsors must be thrilled... 🙄"
  ],
  rivalry: [
    "[@RIVAL] would never post this", "[@RIVAL] is clear", "But can you beat [@RIVAL]?",
    "[@RIVAL] living rent free", "Meanwhile [@RIVAL] is winning",
    "[@RIVAL] > you", "[@RIVAL] doesn't need social media"
  ]
}

/**
 * Simulate engagement for a social media post
 */
export function simulateEngagement(
  followerCount: number,
  engagementRate: number,
  postType: string,
  tone: MediaTone,
  context: {
    recentWin?: boolean
    recentPodium?: boolean
    controversyLevel?: number
    rivalName?: string
  }
): EngagementResult {
  // Base engagement from followers and rate
  const baseEngagement = followerCount * (engagementRate / 100)
  
  // Post type multipliers
  const typeMultipliers: Record<string, number> = {
    post_race_win: 3.0,
    post_race_podium: 2.0,
    charity_highlight: 1.5,
    fan_appreciation: 1.3,
    behind_scenes: 1.2,
    fan_qa: 1.4,
    training_update: 0.8,
    race_photo: 1.0,
    team_appreciation: 1.1
  }
  const typeMultiplier = typeMultipliers[postType] || 1.0
  
  // Tone affects engagement and risk
  const toneEffects: Record<MediaTone, { engagementMod: number; backlashRisk: number; viralBoost: number }> = {
    humble: { engagementMod: 0.9, backlashRisk: 0.02, viralBoost: 0.05 },
    confident: { engagementMod: 1.0, backlashRisk: 0.05, viralBoost: 0.08 },
    bold: { engagementMod: 1.3, backlashRisk: 0.15, viralBoost: 0.15 },
    diplomatic: { engagementMod: 0.85, backlashRisk: 0.01, viralBoost: 0.03 },
    aggressive: { engagementMod: 1.5, backlashRisk: 0.25, viralBoost: 0.20 },
    deflecting: { engagementMod: 0.6, backlashRisk: 0.01, viralBoost: 0.01 }
  }
  const toneEffect = toneEffects[tone] || toneEffects.diplomatic
  
  // Calculate viral chance
  let viralChance = 0.05 // 5% base
  if (context.recentWin) viralChance += 0.10
  if (postType === 'post_race_win') viralChance += 0.10
  viralChance += toneEffect.viralBoost
  if (context.controversyLevel && context.controversyLevel > 50) viralChance += 0.05
  
  const wentViral = Math.random() < viralChance
  const viralMultiplier = wentViral ? 8 + Math.random() * 7 : 1 // 8-15x if viral
  
  // Calculate backlash chance
  let backlashChance = toneEffect.backlashRisk
  if (context.controversyLevel && context.controversyLevel > 30) {
    backlashChance += context.controversyLevel / 500 // Extra scrutiny
  }
  const hadBacklash = Math.random() < backlashChance
  const backlashSeverity = hadBacklash ? 0.3 + Math.random() * 0.5 : 0 // 30-80% severity
  
  // Final engagement numbers
  const rawLikes = baseEngagement * typeMultiplier * toneEffect.engagementMod * viralMultiplier
  const likes = Math.floor(rawLikes * (0.8 + Math.random() * 0.4)) // ±20% variance
  const comments = Math.floor(likes * (0.03 + Math.random() * 0.04)) // 3-7% comment rate
  const shares = Math.floor(likes * (0.01 + Math.random() * 0.02)) // 1-3% share rate
  
  // Follower gain - FIXED: Better scaling with minimum gains
  // Base follower gain per post type (guarantee minimum growth)
  const baseFollowerGains: Record<string, number> = {
    post_race_win: 50,
    post_race_podium: 35,
    charity_highlight: 25,
    fan_appreciation: 20,
    behind_scenes: 15,
    fan_qa: 25,
    training_update: 10,
    race_photo: 12,
    team_appreciation: 18,
    sponsor_shoutout: 8,
    track_preview: 15,
    throwback_memory: 20,
    equipment_showcase: 12,
    lifestyle_post: 25,
    championship_push: 30,
    comeback_update: 22,
    rival_callout: 40,      // Controversial = high engagement
    team_criticism: 35,     // Controversial
    incident_reaction: 30,  // Controversial
    paddock_gossip: 28,     // Controversial
    media_clap_back: 38     // Controversial
  }
  const baseGain = baseFollowerGains[postType] || 15
  
  // Engagement bonus (0.25% of likes - realistic conversion)
  const engagementBonus = Math.floor(likes * 0.0025)
  
  // Small accounts grow faster (catch-up mechanic) - adjusted for higher thresholds
  const smallAccountBonus = followerCount < 50000 ? 2.5 : 
                            followerCount < 100000 ? 2.0 : 
                            followerCount < 250000 ? 1.5 : 
                            followerCount < 500000 ? 1.2 : 1.0
  
  // Viral multiplier - realistic (3-10x instead of 50-500x)
  const viralFollowerMultiplier = wentViral ? (3 + Math.random() * 7) : 1
  
  let followerGain = Math.floor((baseGain + engagementBonus) * smallAccountBonus * viralFollowerMultiplier)
  
  // Backlash severely reduces gains (but doesn't eliminate them)
  if (hadBacklash) {
    followerGain = Math.max(1, Math.floor(followerGain * 0.1))
  }
  
  // Ensure minimum gain of 5 followers per post (unless backlash)
  if (!hadBacklash && followerGain < 5) followerGain = 5
  
  // Sentiment based on backlash and tone
  let sentiment: 'positive' | 'mixed' | 'negative' = 'positive'
  if (hadBacklash && backlashSeverity > 0.5) {
    sentiment = 'negative'
  } else if (hadBacklash || (tone === 'aggressive' || tone === 'bold')) {
    sentiment = 'mixed'
  }
  
  // Generate fan reactions
  const fanReactions: string[] = []
  const reactionCount = 3 + Math.floor(Math.random() * 3) // 3-5 reactions
  
  for (let i = 0; i < reactionCount; i++) {
    if (sentiment === 'negative' || (sentiment === 'mixed' && Math.random() < 0.4)) {
      // Add negative reaction
      const negatives = FAN_REACTIONS.negative
      if (context.rivalName && Math.random() < 0.3) {
        const rivalComment = FAN_REACTIONS.rivalry[Math.floor(Math.random() * FAN_REACTIONS.rivalry.length)]
        fanReactions.push(rivalComment.replace('[@RIVAL]', context.rivalName))
      } else {
        fanReactions.push(negatives[Math.floor(Math.random() * negatives.length)])
      }
    } else if (sentiment === 'mixed' && Math.random() < 0.3) {
      const neutrals = FAN_REACTIONS.neutral
      fanReactions.push(neutrals[Math.floor(Math.random() * neutrals.length)])
    } else {
      const positives = FAN_REACTIONS.positive
      fanReactions.push(positives[Math.floor(Math.random() * positives.length)])
    }
  }
  
  return {
    likes,
    comments,
    shares,
    wentViral,
    viralMultiplier,
    followerGain,
    hadBacklash,
    backlashSeverity,
    sentiment,
    fanReactions
  }
}

// ============================================
// MEDIA DUTY SYSTEM - AI GENERATION
// ============================================

import { 
  MediaDutyType, 
  MediaDutyOption, 
  MediaDutyOptionEffects,
  TeamPostTone
} from '../store/careerStore'
import { getDutyConfig, DUTY_CONTEXT_PROMPTS } from '../data/media-schedule'

/**
 * Context for generating media duty options
 */
export interface MediaDutyContext {
  dutyType: MediaDutyType
  teamName: string
  teamTier: string
  trackName: string
  seriesName: string
  currentWeek: number
  currentYear: number
  
  // Performance context
  practicePosition?: number
  qualifyingPosition?: number
  racePosition?: number
  gridPosition?: number
  positionsGained?: number
  hadIncident?: boolean
  incidentDescription?: string
  hadTechnicalIssue?: boolean
  issueDescription?: string
  
  // Driver context
  driverName?: string
  driverMorale?: number
  
  // Standings context
  championshipPosition?: number
  pointsToLeader?: number
  pointsToRival?: number
  nearestRival?: string
  
  // Team context
  boardMood?: number
  teamMorale?: number
  developmentFocus?: string
  recentUpgrades?: string[]
  
  // Weather/conditions
  isWet?: boolean
  trackConditions?: string
  
  // Sponsor context
  primarySponsor?: string
  sponsorSatisfaction?: number
  
  // Historical context
  lastRaceResult?: { position: number; trackName: string }
  currentStreak?: string
  seasonHighlight?: string
}

/**
 * System prompt for media duty option generation
 */
const MEDIA_DUTY_SYSTEM_PROMPT = `You are an AI assistant for a motorsport team management game. 
You generate media statement options for a team owner to choose from during mandatory media duties.

IMPORTANT RULES:
1. Generate EXACTLY 4 options with different tones and strategic implications
2. Each option should have clear trade-offs (risk vs reward)
3. Options should reflect realistic motorsport team owner statements
4. Include variety: safe/diplomatic options, bold options, deflecting options, and risky options
5. Effects should be constrained to realistic ranges
6. Some options may involve promises (risky!) or criticism (controversial!)

TONE MAPPING:
- confident: Positive, optimistic but measured
- humble: Modest, credit-sharing, diplomatic
- aggressive: Bold, direct, potentially controversial  
- professional: Neutral, business-like, safe
- diplomatic: Careful, avoiding controversy, political

EFFECT RANGES (per option):
- sponsorSatisfaction: -5 to +5
- boardMood: -5 to +5
- teamMorale: -5 to +5
- driverMorale: -5 to +5
- fanSentiment: -5 to +5
- reputation: -3 to +3
- developmentBoost: 0 to 5 (rare, only for "team focused" narratives)
- controversyRisk: 0 to 80 (chance %)
- fineRisk: 0 to 30 (chance %)
- fineAmount: 5000 to 50000 (if fineRisk > 0)

Response must be valid JSON array of 4 options.`

/**
 * Generate media duty options using AI
 */
export async function generateMediaDutyOptions(
  context: MediaDutyContext
): Promise<MediaDutyOption[] | null> {
  const apiKey = await getGeminiKey()
  
  if (!apiKey) {
    console.log('[MediaAI] No API key for media duty options')
    return getFallbackDutyOptions(context)
  }
  
  const prompt = buildMediaDutyPrompt(context)
  
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gemini-2.0-flash-lite',
        messages: [
          { role: 'system', content: MEDIA_DUTY_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: 3000,
        temperature: 0.85
      })
    })
    
    if (!response.ok) {
      console.error('[MediaAI] Media duty API error:', response.status)
      return getFallbackDutyOptions(context)
    }
    
    const data = await response.json()
    const finishReason = data.choices?.[0]?.finish_reason
    const content = data.choices?.[0]?.message?.content?.trim()
    
    console.log('[MediaAI] Media duty finish_reason:', finishReason)
    
    if (!content) {
      console.log('[MediaAI] No content in media duty response')
      return getFallbackDutyOptions(context)
    }
    
    if (finishReason === 'length') {
      console.log('[MediaAI] Media duty response truncated, using fallback')
      return getFallbackDutyOptions(context)
    }
    
    const parsed = safeParseJSON(content)
    
    if (!Array.isArray(parsed) || parsed.length < 3) {
      console.log('[MediaAI] Invalid media duty response structure, using fallback')
      return getFallbackDutyOptions(context)
    }
    
    // Validate and transform options
    const options: MediaDutyOption[] = parsed.map((opt: any, index: number) => ({
      id: `duty-opt-${Date.now()}-${index}`,
      content: opt.content || opt.text || opt.statement || 'Statement unavailable',
      tone: validateTone(opt.tone),
      topic: opt.topic || 'general',
      effects: validateEffects(opt.effects || opt.hiddenEffects || {}),
      mentionsRival: opt.mentionsRival,
      mentionsSponsor: opt.mentionsSponsor,
      criticizesTeam: opt.criticizesTeam,
      criticizesDriver: opt.criticizesDriver,
      makesPromises: opt.makesPromises,
      promiseType: opt.promiseType,
      promiseTarget: opt.promiseTarget,
      promiseDeadline: opt.promiseDeadline
    }))
    
    console.log('[MediaAI] Generated', options.length, 'media duty options')
    return options
    
  } catch (e) {
    console.error('[MediaAI] Media duty generation failed:', e)
    return getFallbackDutyOptions(context)
  }
}

/**
 * Validate and constrain tone value
 */
function validateTone(tone: string | undefined): TeamPostTone {
  const validTones: TeamPostTone[] = ['confident', 'humble', 'aggressive', 'professional', 'diplomatic']
  if (tone && validTones.includes(tone as TeamPostTone)) {
    return tone as TeamPostTone
  }
  return 'professional'
}

/**
 * Validate and constrain effect values to safe ranges
 */
function validateEffects(effects: any): MediaDutyOptionEffects {
  const clamp = (val: number | undefined, min: number, max: number): number => {
    if (val === undefined || isNaN(val)) return 0
    return Math.max(min, Math.min(max, val))
  }
  
  return {
    sponsorSatisfaction: clamp(effects.sponsorSatisfaction, -5, 5),
    specificSponsorId: effects.specificSponsorId,
    specificSponsorBonus: effects.specificSponsorBonus ? clamp(effects.specificSponsorBonus, 0, 10) : undefined,
    boardMood: clamp(effects.boardMood, -5, 5),
    teamMorale: clamp(effects.teamMorale, -5, 5),
    driverMorale: clamp(effects.driverMorale, -5, 5),
    fanSentiment: clamp(effects.fanSentiment, -5, 5),
    reputation: clamp(effects.reputation, -3, 3),
    developmentBoost: effects.developmentBoost ? clamp(effects.developmentBoost, 0, 5) : undefined,
    controversyRisk: clamp(effects.controversyRisk, 0, 80),
    fineRisk: clamp(effects.fineRisk, 0, 30),
    fineAmount: effects.fineRisk > 0 ? clamp(effects.fineAmount || 10000, 5000, 50000) : undefined
  }
}

/**
 * Build the prompt for media duty option generation
 */
function buildMediaDutyPrompt(context: MediaDutyContext): string {
  const config = getDutyConfig(context.dutyType)
  const contextPrompts = DUTY_CONTEXT_PROMPTS[context.dutyType] || []
  
  let situationContext = ''
  
  // Add performance context based on duty type
  if (context.dutyType.includes('practice')) {
    if (context.practicePosition) {
      situationContext += `Practice position: P${context.practicePosition}\n`
    }
    if (context.hadTechnicalIssue) {
      situationContext += `Technical issue: ${context.issueDescription || 'Reliability concern'}\n`
    }
  }
  
  if (context.dutyType.includes('qualifying')) {
    if (context.qualifyingPosition) {
      situationContext += `Qualifying position: P${context.qualifyingPosition}\n`
    }
    if (context.gridPosition) {
      situationContext += `Starting grid: P${context.gridPosition}\n`
    }
  }
  
  if (context.dutyType.includes('race')) {
    if (context.racePosition) {
      situationContext += `Race finish: P${context.racePosition}\n`
    }
    if (context.positionsGained !== undefined) {
      const gained = context.positionsGained
      situationContext += `Positions ${gained >= 0 ? 'gained' : 'lost'}: ${Math.abs(gained)}\n`
    }
    if (context.hadIncident) {
      situationContext += `Incident: ${context.incidentDescription || 'On-track incident occurred'}\n`
    }
  }
  
  // Add standings context
  if (context.championshipPosition) {
    situationContext += `Championship position: P${context.championshipPosition}\n`
  }
  if (context.nearestRival) {
    situationContext += `Nearest rival: ${context.nearestRival}${context.pointsToRival ? ` (${Math.abs(context.pointsToRival)} points ${context.pointsToRival > 0 ? 'behind' : 'ahead'})` : ''}\n`
  }
  
  // Add team context
  if (context.boardMood !== undefined) {
    const moodLabel = context.boardMood > 70 ? 'pleased' : context.boardMood > 40 ? 'satisfied' : 'concerned'
    situationContext += `Board mood: ${moodLabel}\n`
  }
  if (context.teamMorale !== undefined) {
    const moraleLabel = context.teamMorale > 70 ? 'high' : context.teamMorale > 40 ? 'moderate' : 'low'
    situationContext += `Team morale: ${moraleLabel}\n`
  }
  if (context.primarySponsor) {
    situationContext += `Primary sponsor: ${context.primarySponsor}\n`
  }
  
  // Add weather/conditions
  if (context.isWet) {
    situationContext += `Conditions: Wet/changeable weather\n`
  }
  
  // Add historical context
  if (context.lastRaceResult) {
    situationContext += `Previous race: P${context.lastRaceResult.position} at ${context.lastRaceResult.trackName}\n`
  }
  if (context.currentStreak) {
    situationContext += `Current form: ${context.currentStreak}\n`
  }
  
  const promptQuestions = contextPrompts.slice(0, 3).join('\n- ')
  
  return `Generate 4 media statement options for a team owner.

MEDIA DUTY: ${config?.name || context.dutyType}
DESCRIPTION: ${config?.description || 'Mandatory media appearance'}
TEAM: ${context.teamName}
TIER: ${context.teamTier}
SERIES: ${context.seriesName}
TRACK: ${context.trackName}
${context.driverName ? `DRIVER: ${context.driverName}` : ''}

CURRENT SITUATION:
${situationContext || 'Standard media session'}

KEY TOPICS TO CONSIDER:
- ${promptQuestions || 'General team performance and outlook'}

Generate 4 distinct options with different tones and risk levels:
1. SAFE/DIPLOMATIC - Low risk, modest gains
2. CONFIDENT - Moderate risk, decent upside
3. BOLD/AGGRESSIVE - Higher risk, higher reward
4. STRATEGIC - May include promises or specific claims (risky but impactful)

Return JSON array with this structure:
[
  {
    "content": "The full statement text (2-4 sentences)",
    "tone": "confident|humble|aggressive|professional|diplomatic",
    "topic": "main topic focus",
    "effects": {
      "sponsorSatisfaction": -5 to 5,
      "boardMood": -5 to 5,
      "teamMorale": -5 to 5,
      "driverMorale": -5 to 5,
      "fanSentiment": -5 to 5,
      "reputation": -3 to 3,
      "developmentBoost": 0-5 (optional, rare),
      "controversyRisk": 0-80,
      "fineRisk": 0-30,
      "fineAmount": 5000-50000 (if fineRisk > 0)
    },
    "mentionsRival": "rival name or null",
    "mentionsSponsor": "sponsor name or null",
    "criticizesTeam": false,
    "criticizesDriver": false,
    "makesPromises": false,
    "promiseType": "result_promise|upgrade_promise|improvement_promise or null",
    "promiseTarget": "specific promise target or null",
    "promiseDeadline": week number or null
  }
]`
}

/**
 * Fallback options when AI is unavailable
 */
function getFallbackDutyOptions(context: MediaDutyContext): MediaDutyOption[] {
  const config = getDutyConfig(context.dutyType)
  const _dutyName = config?.name || 'Media Duty'
  
  // Generate contextually appropriate fallback options
  const baseOptions: MediaDutyOption[] = [
    {
      id: `duty-opt-fallback-1`,
      content: `We're working hard as a team and focusing on continuous improvement. The ${context.trackName} circuit presents unique challenges and we're prepared to give our best effort. I'm confident in our preparation.`,
      tone: 'professional',
      topic: 'preparation',
      effects: {
        sponsorSatisfaction: 1,
        boardMood: 1,
        teamMorale: 1,
        driverMorale: 1,
        fanSentiment: 1,
        reputation: 0,
        controversyRisk: 5,
        fineRisk: 0
      }
    },
    {
      id: `duty-opt-fallback-2`,
      content: `The entire team has been putting in tremendous work behind the scenes. I want to thank everyone for their dedication. We're here to compete and show what ${context.teamName} is capable of.`,
      tone: 'humble',
      topic: 'team_appreciation',
      effects: {
        sponsorSatisfaction: 2,
        boardMood: 2,
        teamMorale: 3,
        driverMorale: 2,
        fanSentiment: 2,
        reputation: 1,
        controversyRisk: 2,
        fineRisk: 0
      }
    },
    {
      id: `duty-opt-fallback-3`,
      content: `We're not here to make up numbers. ${context.teamName} is ready to fight for every position and show our competitors what we can do. The results will speak for themselves.`,
      tone: 'confident',
      topic: 'competition',
      effects: {
        sponsorSatisfaction: 2,
        boardMood: 1,
        teamMorale: 2,
        driverMorale: 3,
        fanSentiment: 3,
        reputation: 1,
        controversyRisk: 15,
        fineRisk: 5
      }
    },
    {
      id: `duty-opt-fallback-4`,
      content: `We expect strong results this weekend. The development work we've done should pay off here at ${context.trackName}. I'll be disappointed if we don't see a significant step forward in performance.`,
      tone: 'aggressive',
      topic: 'expectations',
      effects: {
        sponsorSatisfaction: 3,
        boardMood: 2,
        teamMorale: 1,
        driverMorale: 2,
        fanSentiment: 4,
        reputation: 2,
        controversyRisk: 30,
        fineRisk: 10,
        fineAmount: 10000
      },
      makesPromises: true,
      promiseType: 'improvement_promise',
      promiseTarget: 'performance step forward',
      promiseDeadline: context.currentWeek + 2
    }
  ]
  
  return baseOptions
}

// ============================================
// SOCIAL MEDIA POST GENERATION
// ============================================

export type SocialPostType = 
  | 'race_result' 
  | 'practice_update' 
  | 'qualifying_result' 
  | 'team_update' 
  | 'behind_scenes' 
  | 'fan_engagement' 
  | 'sponsor_thank_you'
  | 'driver_spotlight'
  | 'development_tease'
  | 'throwback'
  | 'motivation'

export interface TeamSocialPostContext {
  postType: SocialPostType
  teamName: string
  teamTier: string
  driverName?: string
  // Recent results
  lastRacePosition?: number
  lastRaceTrack?: string
  qualifyingPosition?: number
  // Team state
  boardMood?: number
  teamMorale?: number
  fanSentiment?: number
  followerCount?: number
  // Sponsor info
  primarySponsor?: string
  allSponsors?: string[]
  // Championship
  championshipPosition?: number
  pointsTotal?: number
  // Current context
  currentWeek: number
  currentYear: number
  nextRaceTrack?: string
  isRaceWeek?: boolean
  // Development
  recentUpgrades?: string[]
  // Streaks/milestones
  currentStreak?: string
  milestones?: string[]
}

export interface SocialPostOption {
  id: string
  content: string
  tone: TeamPostTone
  hashtags: string[]
  effects: {
    followerGain: number
    engagementBoost: number
    fanSentiment: number
    sponsorSatisfaction: number
    viralChance: number
    backlashRisk: number
  }
  mentionsSponsor?: string
  includesMedia: 'photo' | 'video' | 'graphic' | 'none'
}

const TEAM_SOCIAL_POST_SYSTEM_PROMPT = `You are a social media manager for a professional motorsport racing team. Generate engaging social media posts that feel authentic to team social accounts.

Rules:
- Posts should be 1-2 sentences (social media appropriate length)
- Include relevant hashtags
- Match the requested tone and context
- Consider sponsor visibility but don't be too promotional
- Balance fan engagement with professional image
- Be realistic about racing situations`

/**
 * Generate AI social media post options for team accounts
 */
export async function generateSocialPostOptions(context: TeamSocialPostContext): Promise<SocialPostOption[] | null> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
  
  if (!apiKey) {
    console.log('[MediaAI] No API key, using fallback social posts')
    return getTeamFallbackSocialPosts(context)
  }
  
  const prompt = buildTeamSocialPostPrompt(context)
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AMS2 Career Manager'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-lite-001',
        messages: [
          { role: 'system', content: TEAM_SOCIAL_POST_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.85,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    })
    
    if (!response.ok) {
      console.log('[MediaAI] Social post API error:', response.status)
      return getTeamFallbackSocialPosts(context)
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    
    if (!content) {
      return getTeamFallbackSocialPosts(context)
    }
    
    const parsed = safeParseJSON(content)
    const posts = parsed?.posts || parsed
    
    if (!Array.isArray(posts) || posts.length < 3) {
      return getTeamFallbackSocialPosts(context)
    }
    
    return posts.map((post: any, index: number) => ({
      id: `social-opt-${Date.now()}-${index}`,
      content: post.content || post.text || '',
      tone: validateTone(post.tone),
      hashtags: Array.isArray(post.hashtags) ? post.hashtags.slice(0, 5) : ['#Racing', '#Motorsport'],
      effects: {
        followerGain: Math.max(0, Math.min(500, post.effects?.followerGain || 50)),
        engagementBoost: Math.max(0, Math.min(20, post.effects?.engagementBoost || 5)),
        fanSentiment: Math.max(-3, Math.min(3, post.effects?.fanSentiment || 1)),
        sponsorSatisfaction: Math.max(-2, Math.min(3, post.effects?.sponsorSatisfaction || 1)),
        viralChance: Math.max(0, Math.min(30, post.effects?.viralChance || 5)),
        backlashRisk: Math.max(0, Math.min(40, post.effects?.backlashRisk || 5))
      },
      mentionsSponsor: post.mentionsSponsor,
      includesMedia: validateMediaType(post.includesMedia)
    }))
    
  } catch (e) {
    console.error('[MediaAI] Social post generation failed:', e)
    return getTeamFallbackSocialPosts(context)
  }
}

function validateMediaType(type: string | undefined): 'photo' | 'video' | 'graphic' | 'none' {
  const valid = ['photo', 'video', 'graphic', 'none']
  return valid.includes(type || '') ? type as any : 'photo'
}

function buildTeamSocialPostPrompt(context: TeamSocialPostContext): string {
  let situationContext = ''
  
  // Add recent results
  if (context.lastRacePosition && context.lastRaceTrack) {
    situationContext += `Last race: P${context.lastRacePosition} at ${context.lastRaceTrack}\n`
  }
  if (context.qualifyingPosition) {
    situationContext += `Recent qualifying: P${context.qualifyingPosition}\n`
  }
  
  // Championship standing
  if (context.championshipPosition) {
    situationContext += `Championship: P${context.championshipPosition} with ${context.pointsTotal || 0} points\n`
  }
  
  // Team context
  if (context.teamMorale !== undefined) {
    const morale = context.teamMorale > 70 ? 'high' : context.teamMorale > 40 ? 'good' : 'challenging'
    situationContext += `Team atmosphere: ${morale}\n`
  }
  
  if (context.fanSentiment !== undefined) {
    const sentiment = context.fanSentiment > 70 ? 'very positive' : context.fanSentiment > 40 ? 'positive' : 'mixed'
    situationContext += `Fan sentiment: ${sentiment}\n`
  }
  
  // Sponsor info
  if (context.primarySponsor) {
    situationContext += `Primary sponsor: ${context.primarySponsor}\n`
  }
  
  // Streaks
  if (context.currentStreak) {
    situationContext += `Current streak: ${context.currentStreak}\n`
  }
  
  // Upcoming
  if (context.isRaceWeek && context.nextRaceTrack) {
    situationContext += `Race weekend: ${context.nextRaceTrack}\n`
  }
  
  return `Generate 4 social media post options for a ${context.teamTier}-tier racing team.

POST TYPE: ${context.postType.replace('_', ' ')}
TEAM: ${context.teamName}
${context.driverName ? `DRIVER: ${context.driverName}` : ''}
FOLLOWERS: ${context.followerCount?.toLocaleString() || '10,000'}

SITUATION:
${situationContext || 'Regular team update'}

Generate 4 distinct options with varying risk/reward:
1. SAFE - Low risk, modest engagement
2. ENGAGING - Good balance of engagement and safety  
3. BOLD - Higher engagement potential, some risk
4. RISKY - High viral potential but backlash possible

Return JSON:
{
  "posts": [
    {
      "content": "Post text (1-2 sentences, social media style)",
      "tone": "professional|confident|humble|exciting|bold",
      "hashtags": ["#Tag1", "#Tag2", "#Tag3"],
      "effects": {
        "followerGain": 0-500,
        "engagementBoost": 0-20,
        "fanSentiment": -3 to 3,
        "sponsorSatisfaction": -2 to 3,
        "viralChance": 0-30,
        "backlashRisk": 0-40
      },
      "mentionsSponsor": "sponsor name or null",
      "includesMedia": "photo|video|graphic|none"
    }
  ]
}`
}

function getTeamFallbackSocialPosts(context: TeamSocialPostContext): SocialPostOption[] {
  const teamName = context.teamName
  
  const posts: SocialPostOption[] = [
    {
      id: 'social-fallback-1',
      content: `Great work by the entire ${teamName} crew this week. Every detail matters in our pursuit of excellence. 💪`,
      tone: 'professional',
      hashtags: ['#TeamWork', '#Racing', '#Motorsport'],
      effects: {
        followerGain: 30,
        engagementBoost: 3,
        fanSentiment: 1,
        sponsorSatisfaction: 1,
        viralChance: 3,
        backlashRisk: 2
      },
      includesMedia: 'photo'
    },
    {
      id: 'social-fallback-2',
      content: `Can't wait for the next challenge! ${teamName} is ready to show what we're made of. Who's with us? 🏁`,
      tone: 'confident',
      hashtags: ['#RaceReady', '#Racing', teamName.replace(/\s+/g, '')],
      effects: {
        followerGain: 75,
        engagementBoost: 8,
        fanSentiment: 2,
        sponsorSatisfaction: 1,
        viralChance: 10,
        backlashRisk: 8
      },
      includesMedia: 'video'
    },
    {
      id: 'social-fallback-3',
      content: `To our incredible fans - your support means everything. Every cheer, every message, every mile traveled to see us. Thank you! ❤️`,
      tone: 'humble',
      hashtags: ['#Grateful', '#BestFans', '#Racing'],
      effects: {
        followerGain: 100,
        engagementBoost: 12,
        fanSentiment: 3,
        sponsorSatisfaction: 2,
        viralChance: 15,
        backlashRisk: 3
      },
      includesMedia: 'photo'
    },
    {
      id: 'social-fallback-4',
      content: `Some teams talk. We let our results do the talking. Watch this space. 👀🔥`,
      tone: 'aggressive',
      hashtags: ['#WatchUs', '#Racing', '#Motorsport'],
      effects: {
        followerGain: 150,
        engagementBoost: 15,
        fanSentiment: 2,
        sponsorSatisfaction: 1,
        viralChance: 25,
        backlashRisk: 20
      },
      includesMedia: 'graphic'
    }
  ]
  
  return posts
}

// ============================================
// PRESS RELEASE GENERATION
// ============================================

export type PressReleaseType = 
  | 'race_recap'
  | 'driver_signing'
  | 'sponsor_announcement'
  | 'development_update'
  | 'season_preview'
  | 'season_review'
  | 'partnership'
  | 'milestone'
  | 'apology'
  | 'general_statement'

export interface PressReleaseContext {
  releaseType: PressReleaseType
  teamName: string
  teamTier: string
  driverName?: string
  // Release-specific
  announcementSubject?: string
  // Results
  racePosition?: number
  trackName?: string
  seasonPoints?: number
  championshipPosition?: number
  // For signing/partnership
  newEntityName?: string
  // Team state
  boardMood?: number
  // Time
  currentWeek: number
  currentYear: number
}

export interface PressReleaseOption {
  id: string
  headline: string
  content: string
  tone: TeamPostTone
  quote: string
  effects: {
    mediaScore: number
    fanSentiment: number
    sponsorSatisfaction: number
    boardMood: number
    reputation: number
    controversyRisk: number
  }
  formalityLevel: 'high' | 'medium' | 'casual'
}

const PRESS_RELEASE_SYSTEM_PROMPT = `You are a PR professional for a motorsport racing team. Generate formal press releases that are professional, newsworthy, and suitable for media distribution.

Rules:
- Headlines should be clear and impactful
- Content should be 2-3 paragraphs, professional tone
- Include a quote from the team principal/owner
- Match the formality to the announcement type
- Be realistic about racing situations`

/**
 * Generate AI press release options
 */
export async function generatePressReleaseOptions(context: PressReleaseContext): Promise<PressReleaseOption[] | null> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
  
  if (!apiKey) {
    console.log('[MediaAI] No API key, using fallback press releases')
    return getFallbackPressReleases(context)
  }
  
  const prompt = buildPressReleasePrompt(context)
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AMS2 Career Manager'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-lite-001',
        messages: [
          { role: 'system', content: PRESS_RELEASE_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      })
    })
    
    if (!response.ok) {
      return getFallbackPressReleases(context)
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    
    if (!content) {
      return getFallbackPressReleases(context)
    }
    
    const parsed = safeParseJSON(content)
    const releases = parsed?.releases || parsed
    
    if (!Array.isArray(releases) || releases.length < 3) {
      return getFallbackPressReleases(context)
    }
    
    return releases.map((rel: any, index: number) => ({
      id: `pr-opt-${Date.now()}-${index}`,
      headline: rel.headline || 'Press Release',
      content: rel.content || rel.body || '',
      tone: validateTone(rel.tone),
      quote: rel.quote || '',
      effects: {
        mediaScore: Math.max(0, Math.min(10, rel.effects?.mediaScore || 3)),
        fanSentiment: Math.max(-3, Math.min(5, rel.effects?.fanSentiment || 1)),
        sponsorSatisfaction: Math.max(-2, Math.min(5, rel.effects?.sponsorSatisfaction || 2)),
        boardMood: Math.max(-3, Math.min(5, rel.effects?.boardMood || 2)),
        reputation: Math.max(-2, Math.min(3, rel.effects?.reputation || 1)),
        controversyRisk: Math.max(0, Math.min(50, rel.effects?.controversyRisk || 5))
      },
      formalityLevel: validateFormality(rel.formalityLevel)
    }))
    
  } catch (e) {
    console.error('[MediaAI] Press release generation failed:', e)
    return getFallbackPressReleases(context)
  }
}

function validateFormality(level: string | undefined): 'high' | 'medium' | 'casual' {
  const valid = ['high', 'medium', 'casual']
  return valid.includes(level || '') ? level as any : 'medium'
}

function buildPressReleasePrompt(context: PressReleaseContext): string {
  let situationContext = ''
  
  if (context.releaseType === 'race_recap' && context.racePosition && context.trackName) {
    situationContext = `Race result: P${context.racePosition} at ${context.trackName}\n`
    if (context.championshipPosition) {
      situationContext += `Championship standing: P${context.championshipPosition}\n`
    }
  }
  
  if (context.releaseType === 'driver_signing' && context.newEntityName) {
    situationContext = `New driver: ${context.newEntityName}\n`
  }
  
  if (context.releaseType === 'sponsor_announcement' && context.newEntityName) {
    situationContext = `New sponsor: ${context.newEntityName}\n`
  }
  
  if (context.announcementSubject) {
    situationContext += `Subject: ${context.announcementSubject}\n`
  }
  
  return `Generate 3 press release options for a ${context.teamTier}-tier racing team.

RELEASE TYPE: ${context.releaseType.replace('_', ' ')}
TEAM: ${context.teamName}
${context.driverName ? `DRIVER: ${context.driverName}` : ''}

CONTEXT:
${situationContext || 'General team press release'}

Generate 3 options with different approaches:
1. FORMAL - Traditional, corporate style
2. BALANCED - Professional but personable  
3. ENGAGING - More dynamic, quotable

Return JSON:
{
  "releases": [
    {
      "headline": "Press release headline",
      "content": "2-3 paragraph press release body",
      "tone": "professional|confident|humble",
      "quote": "A quote from the team owner to include",
      "effects": {
        "mediaScore": 0-10,
        "fanSentiment": -3 to 5,
        "sponsorSatisfaction": -2 to 5,
        "boardMood": -3 to 5,
        "reputation": -2 to 3,
        "controversyRisk": 0-50
      },
      "formalityLevel": "high|medium|casual"
    }
  ]
}`
}

function getFallbackPressReleases(context: PressReleaseContext): PressReleaseOption[] {
  const teamName = context.teamName
  
  return [
    {
      id: 'pr-fallback-1',
      headline: `${teamName} Issues Official Statement`,
      content: `${teamName} is pleased to provide this update to our supporters, partners, and the wider motorsport community.\n\nThe team continues to work diligently towards our goals for the current season. We remain committed to excellence in all aspects of our operations, from engineering and development to fan engagement and partner relations.\n\nWe thank everyone for their continued support as we progress through the season.`,
      tone: 'professional',
      quote: "We're focused on continuous improvement and delivering results for all our stakeholders.",
      effects: {
        mediaScore: 3,
        fanSentiment: 1,
        sponsorSatisfaction: 2,
        boardMood: 2,
        reputation: 1,
        controversyRisk: 2
      },
      formalityLevel: 'high'
    },
    {
      id: 'pr-fallback-2',
      headline: `${teamName}: Committed to Success`,
      content: `${teamName} is writing to share our enthusiasm for the road ahead.\n\nOur team has been working tirelessly behind the scenes, and we're excited about the progress we're making. The dedication of every team member, from our engineers to our support staff, continues to drive us forward.\n\nWe look forward to demonstrating our capabilities on track and rewarding the faith our partners and fans have placed in us.`,
      tone: 'confident',
      quote: "Every challenge is an opportunity. This team has what it takes to compete at the highest level.",
      effects: {
        mediaScore: 5,
        fanSentiment: 2,
        sponsorSatisfaction: 3,
        boardMood: 3,
        reputation: 2,
        controversyRisk: 10
      },
      formalityLevel: 'medium'
    },
    {
      id: 'pr-fallback-3',
      headline: `${teamName} Addresses Supporters`,
      content: `To our amazing fans and partners,\n\n${teamName} wanted to take a moment to connect with everyone who makes this journey possible. Your support doesn't go unnoticed - it fuels our determination every single day.\n\nWe're putting everything we have into achieving our goals, and we promise to leave nothing on the table. This is just the beginning.`,
      tone: 'humble',
      quote: "Without our fans and partners, none of this would be possible. We race for you.",
      effects: {
        mediaScore: 6,
        fanSentiment: 4,
        sponsorSatisfaction: 3,
        boardMood: 2,
        reputation: 2,
        controversyRisk: 5
      },
      formalityLevel: 'casual'
    }
  ]
}

// ============================================
// FAN EVENT GENERATION
// ============================================

export type FanEventType = 
  | 'meet_greet'
  | 'factory_tour'
  | 'fan_day'
  | 'signing_session'
  | 'online_qa'
  | 'charity_event'
  | 'sponsor_activation'

export interface FanEventContext {
  eventType: FanEventType
  teamName: string
  teamTier: string
  driverName?: string
  // Location
  location?: string
  isVirtual: boolean
  // Sponsor tie-in
  sponsorName?: string
  // Team state
  fanSentiment?: number
  followerCount?: number
  // Time
  currentWeek: number
  currentYear: number
}

export interface FanEventOption {
  id: string
  name: string
  description: string
  expectedAttendance: number
  cost: number
  effects: {
    fanSentiment: number
    followerGain: number
    sponsorSatisfaction: number
    teamMorale: number
    mediaScore: number
  }
  risks: string[]
  duration: string
  requiresDriver: boolean
}

/**
 * Generate fan event options
 */
export function generateFanEventOptions(context: FanEventContext): FanEventOption[] {
  const baseAttendance = context.followerCount ? Math.floor(context.followerCount / 1000) : 50
  const tierMultiplier = context.teamTier === 'elite' ? 3 : context.teamTier === 'professional' ? 2 : context.teamTier === 'semi-pro' ? 1.5 : 1
  const timestamp = Date.now()
  
  const events: FanEventOption[] = [
    // In-Person Events
    {
      id: `event-opt-${timestamp}-1`,
      name: `${context.teamName} Fan Meet & Greet`,
      description: `An intimate gathering where fans can meet the team, get autographs, and hear behind-the-scenes stories.`,
      expectedAttendance: Math.floor(baseAttendance * tierMultiplier * 0.5),
      cost: 5000 * tierMultiplier,
      effects: {
        fanSentiment: 5,
        followerGain: 200,
        sponsorSatisfaction: 2,
        teamMorale: 2,
        mediaScore: 3
      },
      risks: ['Low turnout possible', 'Weather dependent if outdoor'],
      duration: '3 hours',
      requiresDriver: true
    },
    {
      id: `event-opt-${timestamp}-2`,
      name: `Factory Open Day`,
      description: `Invite fans to tour the team facilities, see the cars up close, and watch the team at work.`,
      expectedAttendance: Math.floor(baseAttendance * tierMultiplier * 0.3),
      cost: 15000 * tierMultiplier,
      effects: {
        fanSentiment: 8,
        followerGain: 300,
        sponsorSatisfaction: 4,
        teamMorale: 3,
        mediaScore: 6
      },
      risks: ['Security concerns', 'Disruption to operations', 'High logistics cost'],
      duration: 'Full day',
      requiresDriver: false
    },
    {
      id: `event-opt-${timestamp}-3`,
      name: `Autograph Signing Session`,
      description: `Team principals and drivers sign merchandise, photos, and memorabilia for dedicated fans.`,
      expectedAttendance: Math.floor(baseAttendance * tierMultiplier * 0.8),
      cost: 3000 * tierMultiplier,
      effects: {
        fanSentiment: 4,
        followerGain: 100,
        sponsorSatisfaction: 2,
        teamMorale: 1,
        mediaScore: 2
      },
      risks: ['Queue management', 'Time overrun'],
      duration: '2 hours',
      requiresDriver: true
    },
    {
      id: `event-opt-${timestamp}-4`,
      name: `Charity Gala Dinner`,
      description: `An exclusive black-tie event to raise money for charity while networking with VIP supporters.`,
      expectedAttendance: Math.floor(baseAttendance * tierMultiplier * 0.1),
      cost: 25000 * tierMultiplier,
      effects: {
        fanSentiment: 3,
        followerGain: 50,
        sponsorSatisfaction: 6,
        teamMorale: 2,
        mediaScore: 8
      },
      risks: ['High cost', 'Requires formal organization', 'VIP expectations'],
      duration: 'Evening',
      requiresDriver: true
    },
    {
      id: `event-opt-${timestamp}-5`,
      name: `Sim Racing Tournament`,
      description: `Host a sim racing competition where fans compete against team members on simulator rigs.`,
      expectedAttendance: Math.floor(baseAttendance * tierMultiplier * 0.4),
      cost: 8000 * tierMultiplier,
      effects: {
        fanSentiment: 6,
        followerGain: 400,
        sponsorSatisfaction: 3,
        teamMorale: 4,
        mediaScore: 5
      },
      risks: ['Technical setup required', 'Competition disputes'],
      duration: '4 hours',
      requiresDriver: false
    },
    
    // Virtual/Online Events
    {
      id: `event-opt-${timestamp}-6`,
      name: `Virtual Q&A Session`,
      description: `A live online session where fans worldwide can submit questions and interact with the team.`,
      expectedAttendance: Math.floor(baseAttendance * tierMultiplier * 2),
      cost: 1000,
      effects: {
        fanSentiment: 3,
        followerGain: 500,
        sponsorSatisfaction: 1,
        teamMorale: 1,
        mediaScore: 4
      },
      risks: ['Technical issues', 'Difficult questions'],
      duration: '1 hour',
      requiresDriver: true
    },
    {
      id: `event-opt-${timestamp}-7`,
      name: `Behind-the-Scenes Livestream`,
      description: `Stream live from the factory or paddock showing fans exclusive access to team operations.`,
      expectedAttendance: Math.floor(baseAttendance * tierMultiplier * 3),
      cost: 2000,
      effects: {
        fanSentiment: 4,
        followerGain: 800,
        sponsorSatisfaction: 2,
        teamMorale: 1,
        mediaScore: 5
      },
      risks: ['Revealing sensitive information', 'Technical issues'],
      duration: '2 hours',
      requiresDriver: false
    },
    {
      id: `event-opt-${timestamp}-8`,
      name: `Watch Party`,
      description: `Host a race watch party where fans gather (in-person or virtually) to watch the race together.`,
      expectedAttendance: Math.floor(baseAttendance * tierMultiplier * 1.5),
      cost: 4000 * tierMultiplier,
      effects: {
        fanSentiment: 5,
        followerGain: 250,
        sponsorSatisfaction: 3,
        teamMorale: 2,
        mediaScore: 3
      },
      risks: ['Poor race result dampens mood', 'Venue capacity'],
      duration: 'Race duration + 2 hours',
      requiresDriver: false
    },
    
    // Sponsor-Related Events
    {
      id: `event-opt-${timestamp}-9`,
      name: context.sponsorName ? `${context.sponsorName} Fan Experience` : `Sponsor Activation Event`,
      description: `A sponsored event that combines fan engagement with partner visibility. Great for sponsor relations.`,
      expectedAttendance: Math.floor(baseAttendance * tierMultiplier),
      cost: 8000 * tierMultiplier,
      effects: {
        fanSentiment: 4,
        followerGain: 150,
        sponsorSatisfaction: 8,
        teamMorale: 1,
        mediaScore: 5
      },
      risks: ['May feel too commercial', 'Sponsor expectations'],
      duration: '4 hours',
      requiresDriver: true
    },
    {
      id: `event-opt-${timestamp}-10`,
      name: `Merchandise Pop-Up Store`,
      description: `Set up a temporary merchandise store with exclusive items and meet-the-team opportunities.`,
      expectedAttendance: Math.floor(baseAttendance * tierMultiplier * 0.6),
      cost: 6000 * tierMultiplier,
      effects: {
        fanSentiment: 3,
        followerGain: 100,
        sponsorSatisfaction: 4,
        teamMorale: 1,
        mediaScore: 2
      },
      risks: ['Stock management', 'Location dependent'],
      duration: 'Full day',
      requiresDriver: false
    },
    
    // Exclusive/Premium Events  
    {
      id: `event-opt-${timestamp}-11`,
      name: `VIP Paddock Experience`,
      description: `Offer a limited number of fans exclusive paddock access during a race weekend.`,
      expectedAttendance: Math.floor(baseAttendance * tierMultiplier * 0.05),
      cost: 20000 * tierMultiplier,
      effects: {
        fanSentiment: 10,
        followerGain: 200,
        sponsorSatisfaction: 5,
        teamMorale: 1,
        mediaScore: 7
      },
      risks: ['Limited capacity', 'Security and logistics', 'High expectations'],
      duration: 'Race weekend',
      requiresDriver: true
    },
    {
      id: `event-opt-${timestamp}-12`,
      name: `Driver Ride-Along`,
      description: `Select fans get to experience passenger laps with a team driver in a road car.`,
      expectedAttendance: Math.floor(Math.min(20, baseAttendance * tierMultiplier * 0.02)),
      cost: 30000 * tierMultiplier,
      effects: {
        fanSentiment: 12,
        followerGain: 500,
        sponsorSatisfaction: 4,
        teamMorale: 3,
        mediaScore: 9
      },
      risks: ['Safety concerns', 'Insurance requirements', 'Weather dependent'],
      duration: 'Half day',
      requiresDriver: true
    }
  ]
  
  return events
}

// ============================================
// PRESS CONFERENCE GENERATION
// ============================================

export type PressConferenceType = 
  | 'pre_season'
  | 'post_race'
  | 'driver_announcement'
  | 'sponsor_announcement'
  | 'controversy_response'
  | 'milestone_celebration'
  | 'development_reveal'
  | 'mid_season_review'

export interface PressConferenceContext {
  conferenceType: PressConferenceType
  teamName: string
  teamTier: string
  driverName?: string
  // Recent performance
  lastRacePosition?: number
  championshipPosition?: number
  // Topic-specific
  announcementSubject?: string
  controversyTopic?: string
  // Team state
  boardMood?: number
  teamMorale?: number
  // Journalists
  journalistCount?: number
  hostileJournalists?: number
  // Time
  currentWeek: number
  currentYear: number
}

export interface PressConferenceQuestion {
  id: string
  question: string
  journalist: string
  outlet: string
  difficulty: 'easy' | 'medium' | 'hard' | 'hostile'
  topic: string
}

export interface PressConferenceAnswerOption {
  id: string
  answer: string
  tone: TeamPostTone
  effects: {
    mediaScore: number
    fanSentiment: number
    sponsorSatisfaction: number
    boardMood: number
    reputation: number
    controversyRisk: number
  }
  followUpRisk: number // Chance of hostile follow-up question
}

export interface PressConferenceOption {
  id: string
  name: string
  description: string
  questions: PressConferenceQuestion[]
  duration: string
  cost: number
  baseMediaScore: number
  difficulty: 'easy' | 'medium' | 'hard'
}

const _PRESS_CONFERENCE_SYSTEM_PROMPT = `You are generating press conference questions and answer options for a motorsport racing team's press conference.

Rules:
- Questions should feel like real journalist questions
- Include a mix of friendly and challenging questions
- Answer options should have clear trade-offs
- Consider the team's current situation and context`

/**
 * Generate press conference options
 */
export function generatePressConferenceOptions(context: PressConferenceContext): PressConferenceOption[] {
  const tierMultiplier = context.teamTier === 'elite' ? 3 : context.teamTier === 'professional' ? 2 : context.teamTier === 'semi-pro' ? 1.5 : 1
  const timestamp = Date.now()
  
  const options: PressConferenceOption[] = [
    {
      id: `pc-opt-${timestamp}-1`,
      name: 'Quick Press Briefing',
      description: 'A short 15-minute briefing with limited questions. Lower risk but less media coverage.',
      questions: generateBasicQuestions(context, 3),
      duration: '15 minutes',
      cost: 1000,
      baseMediaScore: 3,
      difficulty: 'easy'
    },
    {
      id: `pc-opt-${timestamp}-2`,
      name: 'Standard Press Conference',
      description: 'A typical 30-minute press conference with a mix of questions from various outlets.',
      questions: generateBasicQuestions(context, 5),
      duration: '30 minutes',
      cost: 3000 * tierMultiplier,
      baseMediaScore: 5,
      difficulty: 'medium'
    },
    {
      id: `pc-opt-${timestamp}-3`,
      name: 'Extended Media Session',
      description: 'A full hour-long session with in-depth questions. High risk but excellent coverage.',
      questions: generateBasicQuestions(context, 8),
      duration: '1 hour',
      cost: 5000 * tierMultiplier,
      baseMediaScore: 8,
      difficulty: 'hard'
    },
    {
      id: `pc-opt-${timestamp}-4`,
      name: 'Exclusive Interview',
      description: 'One-on-one with a major outlet. Focused questions but high visibility.',
      questions: generateBasicQuestions(context, 4),
      duration: '45 minutes',
      cost: 8000 * tierMultiplier,
      baseMediaScore: 7,
      difficulty: 'medium'
    }
  ]
  
  return options
}

function generateBasicQuestions(_context: PressConferenceContext, count: number): PressConferenceQuestion[] {
  const outlets = [
    'Motorsport Weekly', 'Racing Times', 'Speed Magazine', 'Auto News', 
    'The Racing Post', 'Pit Lane Report', 'Track & Field', 'Race Day Live'
  ]
  const journalists = [
    'Sarah Mitchell', 'James Rodriguez', 'Mike Thompson', 'Emma Chen',
    'David Williams', 'Lisa Park', 'Tom Anderson', 'Maria Santos'
  ]
  
  const questionTemplates: { question: string; difficulty: 'easy' | 'medium' | 'hard' | 'hostile'; topic: string }[] = [
    // Easy questions
    { question: `How is the team feeling heading into the next phase of the season?`, difficulty: 'easy', topic: 'general' },
    { question: `What are the team's goals for the upcoming races?`, difficulty: 'easy', topic: 'goals' },
    { question: `Can you tell us about the team atmosphere at the moment?`, difficulty: 'easy', topic: 'morale' },
    { question: `What's the focus area for development right now?`, difficulty: 'easy', topic: 'development' },
    
    // Medium questions
    { question: `The last few results haven't been what you hoped for. What needs to change?`, difficulty: 'medium', topic: 'performance' },
    { question: `How do you respond to criticism about the team's recent pace?`, difficulty: 'medium', topic: 'criticism' },
    { question: `Are you satisfied with the current driver lineup?`, difficulty: 'medium', topic: 'drivers' },
    { question: `There are rumors about budget constraints. Can you comment?`, difficulty: 'medium', topic: 'finances' },
    
    // Hard questions
    { question: `Some say the team has lost its competitive edge. How do you answer that?`, difficulty: 'hard', topic: 'competitiveness' },
    { question: `Your main sponsor seems unhappy with results. Is the partnership at risk?`, difficulty: 'hard', topic: 'sponsors' },
    { question: `What's your response to rumors of internal team conflicts?`, difficulty: 'hard', topic: 'internal' },
    
    // Hostile questions
    { question: `Don't you think it's time to admit this season has been a failure?`, difficulty: 'hostile', topic: 'failure' },
    { question: `With results like these, how do you justify your position as team principal?`, difficulty: 'hostile', topic: 'leadership' }
  ]
  
  // Select questions based on count, mixing difficulties
  const selected: PressConferenceQuestion[] = []
  const difficulties: ('easy' | 'medium' | 'hard' | 'hostile')[] = 
    count <= 3 ? ['easy', 'easy', 'medium'] :
    count <= 5 ? ['easy', 'easy', 'medium', 'medium', 'hard'] :
    ['easy', 'easy', 'medium', 'medium', 'medium', 'hard', 'hard', 'hostile']
  
  for (let i = 0; i < count; i++) {
    const difficulty = difficulties[i] || 'medium'
    const matching = questionTemplates.filter(q => q.difficulty === difficulty)
    const template = matching[Math.floor(Math.random() * matching.length)] || questionTemplates[0]
    
    selected.push({
      id: `question-${Date.now()}-${i}`,
      question: template.question,
      journalist: journalists[Math.floor(Math.random() * journalists.length)],
      outlet: outlets[Math.floor(Math.random() * outlets.length)],
      difficulty: template.difficulty,
      topic: template.topic
    })
  }
  
  return selected
}

/**
 * Generate answer options for a press conference question
 */
export function generateAnswerOptions(question: PressConferenceQuestion): PressConferenceAnswerOption[] {
  const timestamp = Date.now()
  
  // Generate context-appropriate answers based on question difficulty
  const options: PressConferenceAnswerOption[] = [
    {
      id: `answer-${timestamp}-1`,
      answer: "We're focused on our work and continue to push hard. The team is united and we're confident in our direction.",
      tone: 'professional',
      effects: {
        mediaScore: 2,
        fanSentiment: 1,
        sponsorSatisfaction: 2,
        boardMood: 2,
        reputation: 1,
        controversyRisk: 5
      },
      followUpRisk: 10
    },
    {
      id: `answer-${timestamp}-2`,
      answer: "I think our recent performance speaks to the challenges we face, but this team has the talent and resources to turn things around.",
      tone: 'confident',
      effects: {
        mediaScore: 3,
        fanSentiment: 2,
        sponsorSatisfaction: 2,
        boardMood: 1,
        reputation: 1,
        controversyRisk: 15
      },
      followUpRisk: 20
    },
    {
      id: `answer-${timestamp}-3`,
      answer: "We acknowledge there's work to do. We're not making excuses - we need to deliver better results and we're committed to doing exactly that.",
      tone: 'humble',
      effects: {
        mediaScore: 4,
        fanSentiment: 3,
        sponsorSatisfaction: 3,
        boardMood: 2,
        reputation: 2,
        controversyRisk: 10
      },
      followUpRisk: 15
    },
    {
      id: `answer-${timestamp}-4`,
      answer: "I find that question somewhat unfair given the context. We're fighting hard against well-funded competitors and making progress.",
      tone: 'aggressive',
      effects: {
        mediaScore: 5,
        fanSentiment: 2,
        sponsorSatisfaction: 1,
        boardMood: 0,
        reputation: 0,
        controversyRisk: 35
      },
      followUpRisk: 40
    }
  ]
  
  // Adjust based on question difficulty
  if (question.difficulty === 'hostile') {
    options.forEach(opt => {
      opt.effects.controversyRisk += 10
      opt.followUpRisk += 15
    })
  }
  
  return options
}

// ============================================
// EXCLUSIVE CONTENT GENERATION (Fan Club)
// ============================================

export type ExclusiveContentType = 
  | 'behind_scenes_video'
  | 'driver_interview'
  | 'factory_tour'
  | 'garage_access'
  | 'early_announcement'
  | 'team_diary'
  | 'technical_breakdown'
  | 'fan_qa'

export interface ExclusiveContentContext {
  teamName: string
  teamTier: string
  driverName?: string
  fanClubMembers: number
  memberSatisfaction: number
  currentWeek: number
  // Recent events for context
  lastRaceResult?: number
  trackName?: string
  recentUpgrade?: string
  isRaceWeek?: boolean
}

export interface ExclusiveContentOption {
  id: string
  type: ExclusiveContentType
  title: string
  description: string
  previewText: string
  effects: {
    memberSatisfaction: number
    memberGrowth: number
    followerConversion: number // % of members who become followers
    engagementBoost: number
  }
  productionCost: number
  icon: string
}

const EXCLUSIVE_CONTENT_TYPES: { type: ExclusiveContentType; name: string; icon: string; baseCost: number }[] = [
  { type: 'behind_scenes_video', name: 'Behind the Scenes Video', icon: '🎬', baseCost: 2000 },
  { type: 'driver_interview', name: 'Exclusive Driver Interview', icon: '🎤', baseCost: 3000 },
  { type: 'factory_tour', name: 'Virtual Factory Tour', icon: '🏭', baseCost: 5000 },
  { type: 'garage_access', name: 'Race Weekend Garage Access', icon: '🔧', baseCost: 4000 },
  { type: 'early_announcement', name: 'Early News Announcement', icon: '📢', baseCost: 1000 },
  { type: 'team_diary', name: 'Weekly Team Diary', icon: '📔', baseCost: 1500 },
  { type: 'technical_breakdown', name: 'Technical Car Breakdown', icon: '⚙️', baseCost: 3500 },
  { type: 'fan_qa', name: 'Live Fan Q&A Session', icon: '💬', baseCost: 2500 }
]

/**
 * Generate exclusive content options for fan club
 */
export function generateExclusiveContentOptions(context: ExclusiveContentContext): ExclusiveContentOption[] {
  const timestamp = Date.now()
  const tierMultiplier = context.teamTier === 'elite' ? 1.5 : context.teamTier === 'professional' ? 1.2 : 1
  
  const options: ExclusiveContentOption[] = EXCLUSIVE_CONTENT_TYPES.map((contentType, index) => {
    // Generate contextual preview text
    let previewText = ''
    switch(contentType.type) {
      case 'behind_scenes_video':
        previewText = context.isRaceWeek 
          ? `Exclusive footage from the ${context.trackName || 'race'} paddock showing the team's preparation and strategy discussions.`
          : `A day in the life at ${context.teamName} HQ - see how our engineers and crew prepare for success.`
        break
      case 'driver_interview':
        previewText = context.driverName 
          ? `Sit down with ${context.driverName} for an unfiltered conversation about their journey, challenges, and goals.`
          : `Exclusive one-on-one with our driver discussing the season so far and what's ahead.`
        break
      case 'factory_tour':
        previewText = `Take a virtual walk through the ${context.teamName} facility - from design office to wind tunnel to race bay.`
        break
      case 'garage_access':
        previewText = context.isRaceWeek
          ? `Live access to our garage at ${context.trackName || 'the circuit'} - watch setup changes and strategy calls in real-time.`
          : `Relive key moments from our recent race weekend with exclusive garage footage and team radio.`
        break
      case 'early_announcement':
        previewText = context.recentUpgrade
          ? `Be the first to know about our latest developments - ${context.recentUpgrade} - before the official press release.`
          : `Exclusive early access to team news and announcements before they go public.`
        break
      case 'team_diary':
        previewText = `This week at ${context.teamName}: personal stories, challenges overcome, and moments of triumph from our crew.`
        break
      case 'technical_breakdown':
        previewText = `Our chief engineer explains the science behind our latest car updates and why they matter on track.`
        break
      case 'fan_qa':
        previewText = `Join us live as our team principal answers your questions directly - no filters, no PR speak.`
        break
    }
    
    // Calculate effects based on content type and context
    const baseEffects = {
      memberSatisfaction: 5 + Math.floor(Math.random() * 5),
      memberGrowth: 2 + Math.floor(Math.random() * 3),
      followerConversion: 1 + Math.floor(Math.random() * 2),
      engagementBoost: 3 + Math.floor(Math.random() * 4)
    }
    
    // Premium content types give better effects
    if (['factory_tour', 'driver_interview', 'fan_qa'].includes(contentType.type)) {
      baseEffects.memberSatisfaction += 3
      baseEffects.memberGrowth += 2
      baseEffects.followerConversion += 1
    }
    
    return {
      id: `exc-content-${timestamp}-${index}`,
      type: contentType.type,
      title: contentType.name,
      description: `Release exclusive ${contentType.name.toLowerCase()} content for your fan club members.`,
      previewText,
      effects: baseEffects,
      productionCost: Math.round(contentType.baseCost * tierMultiplier),
      icon: contentType.icon
    }
  })
  
  return options
}

// ============================================
// AI-POWERED GENERATION FUNCTIONS
// ============================================

/**
 * AI-powered press conference question generation
 */
export async function generateAIPressConferenceQuestions(
  context: PressConferenceContext,
  count: number,
  gameContext?: ComprehensiveGameContext
): Promise<PressConferenceQuestion[]> {
  const apiKey = await getGeminiKey()
  
  if (!apiKey) {
    console.log('[MediaAI] No API key for press conference questions, using fallback')
    return generateBasicQuestions(context, count)
  }
  
  // Use comprehensive context if available
  const contextSection = gameContext 
    ? formatContextForPrompt(gameContext)
    : `Team: ${context.teamName}
Tier: ${context.teamTier}
Driver: ${context.driverName || 'Unknown'}
Championship Position: ${context.championshipPosition || 'N/A'}
Last Race Position: ${context.lastRacePosition || 'N/A'}
Board Mood: ${context.boardMood || 50}/100
Team Morale: ${context.teamMorale || 50}/100
Week: ${context.currentWeek}, Year: ${context.currentYear}`
  
  const prompt = `You are generating press conference questions for a motorsport team manager game.
The questions should be deeply contextual, referencing SPECIFIC details from the game state.

${contextSection}

${context.controversyTopic ? `⚠️ ACTIVE CONTROVERSY: ${context.controversyTopic}` : ''}
${context.announcementSubject ? `📢 ANNOUNCEMENT TOPIC: ${context.announcementSubject}` : ''}

Generate ${count} press conference questions from different journalists. 

IMPORTANT GUIDELINES:
- Reference SPECIFIC sponsors by name if they're unhappy
- Ask about SPECIFIC drivers by name
- Reference the car's condition/reliability if relevant
- Ask about board pressure if mood is low
- Reference recent race results specifically
- If there's budget pressure, journalists will ask about financial stability
- Poor championship position = more hard/hostile questions
- Good performance = more friendly questions
- Controversy = at least one hostile question about it

Return ONLY a JSON array:
[
  {
    "question": "The actual question text - make it specific and contextual",
    "journalist": "Journalist name",
    "outlet": "News outlet name",
    "difficulty": "easy|medium|hard|hostile",
    "topic": "general|performance|drivers|sponsors|development|controversy|finances|internal|car|board"
  }
]`

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gemini-2.0-flash-lite',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.8
      })
    })
    
    if (!response.ok) {
      console.error('[MediaAI] Press conference questions API error:', response.status)
      return generateBasicQuestions(context, count)
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    
    if (!content) {
      return generateBasicQuestions(context, count)
    }
    
    const parsed = safeParseJSON(content)
    
    if (!Array.isArray(parsed) || parsed.length < count) {
      return generateBasicQuestions(context, count)
    }
    
    return parsed.slice(0, count).map((q: any, i: number) => ({
      id: `question-ai-${Date.now()}-${i}`,
      question: q.question || 'How is the team doing?',
      journalist: q.journalist || 'Press Reporter',
      outlet: q.outlet || 'Motorsport News',
      difficulty: ['easy', 'medium', 'hard', 'hostile'].includes(q.difficulty) ? q.difficulty : 'medium',
      topic: q.topic || 'general'
    }))
    
  } catch (e) {
    console.error('[MediaAI] Press conference questions generation failed:', e)
    return generateBasicQuestions(context, count)
  }
}

/**
 * AI-powered press conference answer generation
 */
export async function generateAIAnswerOptions(
  question: PressConferenceQuestion,
  context: PressConferenceContext,
  gameContext?: ComprehensiveGameContext
): Promise<PressConferenceAnswerOption[]> {
  const apiKey = await getGeminiKey()
  
  if (!apiKey) {
    console.log('[MediaAI] No API key for answer options, using fallback')
    return generateAnswerOptions(question)
  }
  
  // Build context section
  const contextSection = gameContext 
    ? formatContextForPrompt(gameContext)
    : `Team: ${context.teamName}\nTier: ${context.teamTier}`
  
  const prompt = `You are generating answer options for a press conference in a motorsport team manager game.
The answers should reference SPECIFIC details from the game state when appropriate.

QUESTION FROM JOURNALIST:
"${question.question}"
- Asked by: ${question.journalist} from ${question.outlet}
- Difficulty: ${question.difficulty}
- Topic: ${question.topic}

${contextSection}

Generate 4 different answer options with varying tones and risk/reward trade-offs.

IMPORTANT: Make answers CONTEXTUAL:
- If question is about sponsors, reference actual sponsor names
- If about performance, reference actual championship position/results
- If about drivers, mention actual driver names
- If about finances, reflect actual budget situation
- If about car, reference actual car condition

Return ONLY a JSON array:
[
  {
    "answer": "The full contextual answer text (2-3 sentences)",
    "tone": "professional|confident|humble|aggressive|diplomatic",
    "effects": {
      "mediaScore": 1-5,
      "fanSentiment": -2 to 3,
      "sponsorSatisfaction": -2 to 3,
      "boardMood": -2 to 3,
      "reputation": -2 to 3,
      "controversyRisk": 5-50
    },
    "followUpRisk": 5-50
  }
]

Guidelines:
- Professional: Safe, neutral (low risk, low reward)
- Confident: Bold claims (medium risk, higher reward) - risky if performance is poor
- Humble: Acknowledging issues (good for damage control)
- Aggressive: Pushing back (high risk, can backfire) - especially risky with low board mood
- Diplomatic: Deflecting gracefully (safe but may seem evasive)`

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gemini-2.0-flash-lite',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200,
        temperature: 0.8
      })
    })
    
    if (!response.ok) {
      return generateAnswerOptions(question)
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    
    if (!content) {
      return generateAnswerOptions(question)
    }
    
    const parsed = safeParseJSON(content)
    
    if (!Array.isArray(parsed) || parsed.length < 3) {
      return generateAnswerOptions(question)
    }
    
    const validTones: TeamPostTone[] = ['professional', 'confident', 'humble', 'aggressive', 'diplomatic']
    
    return parsed.slice(0, 4).map((a: any, i: number) => ({
      id: `answer-ai-${Date.now()}-${i}`,
      answer: a.answer || 'No comment.',
      tone: validTones.includes(a.tone) ? a.tone : 'professional',
      effects: {
        mediaScore: Math.max(0, Math.min(5, a.effects?.mediaScore || 2)),
        fanSentiment: Math.max(-2, Math.min(3, a.effects?.fanSentiment || 1)),
        sponsorSatisfaction: Math.max(-2, Math.min(3, a.effects?.sponsorSatisfaction || 1)),
        boardMood: Math.max(-2, Math.min(3, a.effects?.boardMood || 1)),
        reputation: Math.max(-2, Math.min(3, a.effects?.reputation || 1)),
        controversyRisk: Math.max(5, Math.min(50, a.effects?.controversyRisk || 15))
      },
      followUpRisk: Math.max(5, Math.min(50, a.followUpRisk || 20))
    }))
    
  } catch (e) {
    console.error('[MediaAI] Answer options generation failed:', e)
    return generateAnswerOptions(question)
  }
}

/**
 * AI-powered fan event generation
 */
export async function generateAIFanEventOptions(
  context: FanEventContext,
  gameContext?: ComprehensiveGameContext
): Promise<FanEventOption[]> {
  const apiKey = await getGeminiKey()
  
  if (!apiKey) {
    console.log('[MediaAI] No API key for fan events, using fallback')
    return generateFanEventOptions(context)
  }
  
  const tierMultiplier = context.teamTier === 'elite' ? 3 : context.teamTier === 'professional' ? 2 : context.teamTier === 'semi-pro' ? 1.5 : 1
  const baseAttendance = context.followerCount ? Math.floor(context.followerCount / 1000) : 50
  
  // Use comprehensive context if available
  const contextSection = gameContext 
    ? formatContextForPrompt(gameContext)
    : `Team: ${context.teamName}
Tier: ${context.teamTier}
Followers: ${context.followerCount?.toLocaleString() || 'Unknown'}
Fan Sentiment: ${context.fanSentiment || 50}/100`
  
  const prompt = `You are generating fan event options for a motorsport team manager game.
Events should be CONTEXTUAL to the team's current situation.

${contextSection}

Current Week: ${context.currentWeek}

Generate 6 unique fan event options. Make them CONTEXTUAL:
- If there's a race weekend, suggest track-specific events
- If sponsors are unhappy, suggest sponsor activation events
- If team morale is low, suggest team-inclusive events
- If budget is tight, suggest low-cost virtual events
- If there's been a recent win, suggest celebration events
- Reference actual driver names in event descriptions

Event Types:
- Fan meetups (in-person) - good for fan sentiment
- Virtual events (online) - low cost, wide reach
- Charity events (community goodwill) - reputation boost
- Exclusive experiences (premium) - high cost, high reward
- Factory tours - showcases facilities
- Sponsor activations - keeps sponsors happy

Return ONLY a JSON array:
[
  {
    "name": "Contextual event name",
    "description": "2-3 sentence description referencing team context",
    "type": "meetup|virtual|charity|exclusive|merchandise|factory_tour",
    "cost": ${Math.round(1000 * tierMultiplier)}-${Math.round(15000 * tierMultiplier)},
    "attendanceEstimate": ${baseAttendance}-${baseAttendance * 10},
    "effects": {
      "fanSentiment": 2-15,
      "followerGrowth": 50-500,
      "merchandiseSales": 0-5000,
      "sponsorInterest": 0-3,
      "teamMorale": 0-3
    }
  }
]

Higher cost events = better effects. Race week events get bonus attendance.`

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gemini-2.0-flash-lite',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.8
      })
    })
    
    if (!response.ok) {
      return generateFanEventOptions(context)
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    
    if (!content) {
      return generateFanEventOptions(context)
    }
    
    const parsed = safeParseJSON(content)
    
    if (!Array.isArray(parsed) || parsed.length < 4) {
      return generateFanEventOptions(context)
    }
    
    const validTypes: FanEventType[] = ['meet_greet', 'online_qa', 'charity_event', 'signing_session', 'fan_day', 'factory_tour']
    const typeMap: Record<string, FanEventType> = {
      'meetup': 'meet_greet',
      'virtual': 'online_qa',
      'charity': 'charity_event',
      'exclusive': 'signing_session',
      'merchandise': 'fan_day',
      'factory_tour': 'factory_tour'
    }
    
    return parsed.slice(0, 6).map((e: any, i: number): FanEventOption => {
      const _eventType = e.type && typeMap[e.type] ? typeMap[e.type] : 
                       validTypes.includes(e.type) ? e.type as FanEventType : 
                       'meet_greet'
      return {
        id: `event-ai-${Date.now()}-${i}`,
        name: e.name || 'Fan Event',
        description: e.description || 'A special event for fans.',
        expectedAttendance: Math.max(10, Math.min(5000, e.attendanceEstimate || e.expectedAttendance || 100)),
        cost: Math.max(500, Math.min(20000, e.cost || 2000)),
        duration: e.duration || '2 hours',
        requiresDriver: e.requiresDriver || false,
        risks: e.risks || [],
        effects: {
          fanSentiment: Math.max(1, Math.min(15, e.effects?.fanSentiment || 5)),
          followerGain: Math.max(0, Math.min(1000, e.effects?.followerGrowth || e.effects?.followerGain || 100)),
          sponsorSatisfaction: Math.max(0, Math.min(5, e.effects?.sponsorInterest || e.effects?.sponsorSatisfaction || 0)),
          teamMorale: Math.max(0, Math.min(5, e.effects?.teamMorale || 1)),
          mediaScore: Math.max(0, Math.min(10, e.effects?.mediaScore || 2))
        }
      }
    })
    
  } catch (e) {
    console.error('[MediaAI] Fan event generation failed:', e)
    return generateFanEventOptions(context)
  }
}

/**
 * AI-powered exclusive content generation
 */
export async function generateAIExclusiveContentOptions(
  context: ExclusiveContentContext,
  gameContext?: ComprehensiveGameContext
): Promise<ExclusiveContentOption[]> {
  const apiKey = await getGeminiKey()
  
  if (!apiKey) {
    console.log('[MediaAI] No API key for exclusive content, using fallback')
    return generateExclusiveContentOptions(context)
  }
  
  const tierMultiplier = context.teamTier === 'elite' ? 1.5 : context.teamTier === 'professional' ? 1.2 : 1
  
  // Use comprehensive context if available
  const contextSection = gameContext 
    ? formatContextForPrompt(gameContext)
    : `Team: ${context.teamName}
Tier: ${context.teamTier}
Driver: ${context.driverName || 'Team Driver'}
Fan Club Members: ${context.fanClubMembers?.toLocaleString() || '500'}
Member Satisfaction: ${context.memberSatisfaction || 70}%`
  
  const prompt = `You are generating exclusive fan club content options for a motorsport team manager game.
Content should be DEEPLY CONTEXTUAL - reference specific team situations, drivers, sponsors, and recent events.

${contextSection}

Current Week: ${context.currentWeek}
${context.lastRaceResult ? `Last Race: P${context.lastRaceResult}` : ''}
${context.recentUpgrade ? `Recent Upgrade: ${context.recentUpgrade}` : ''}

Generate 6 unique exclusive content options. Make them HIGHLY CONTEXTUAL:
- Reference ACTUAL driver names in interview content
- Reference ACTUAL sponsor names in activation content  
- If there's a race weekend, suggest garage access or track content
- If there's been a recent upgrade, suggest technical breakdown content
- If board mood is low, suggest "transparency" content about challenges
- If there's been a win, suggest celebration/documentary content
- Reference the actual car condition if relevant

Content Types:
- behind_scenes_video: Factory/workshop footage
- driver_interview: One-on-one with specific driver
- factory_tour: Virtual facility walkthrough
- garage_access: Race weekend behind-the-scenes
- early_announcement: Sneak peeks at news before public
- team_diary: Weekly team stories and updates
- technical_breakdown: Engineering deep-dives
- fan_qa: Live Q&A sessions

Return ONLY a JSON array:
[
  {
    "type": "behind_scenes_video|driver_interview|factory_tour|garage_access|early_announcement|team_diary|technical_breakdown|fan_qa",
    "title": "Contextual content title",
    "description": "Short description",
    "previewText": "2-3 sentence teaser referencing SPECIFIC team context (driver names, track names, sponsors, etc.)",
    "productionCost": ${Math.round(1000 * tierMultiplier)}-${Math.round(6000 * tierMultiplier)},
    "effects": {
      "memberSatisfaction": 3-12,
      "memberGrowth": 1-5,
      "followerConversion": 0-3,
      "engagementBoost": 2-8
    }
  }
]`

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gemini-2.0-flash-lite',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1800,
        temperature: 0.8
      })
    })
    
    if (!response.ok) {
      return generateExclusiveContentOptions(context)
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    
    if (!content) {
      return generateExclusiveContentOptions(context)
    }
    
    const parsed = safeParseJSON(content)
    
    if (!Array.isArray(parsed) || parsed.length < 4) {
      return generateExclusiveContentOptions(context)
    }
    
    const validTypes: ExclusiveContentType[] = [
      'behind_scenes_video', 'driver_interview', 'factory_tour', 'garage_access',
      'early_announcement', 'team_diary', 'technical_breakdown', 'fan_qa'
    ]
    
    const typeIcons: Record<ExclusiveContentType, string> = {
      'behind_scenes_video': '🎬',
      'driver_interview': '🎤',
      'factory_tour': '🏭',
      'garage_access': '🔧',
      'early_announcement': '📢',
      'team_diary': '📔',
      'technical_breakdown': '⚙️',
      'fan_qa': '💬'
    }
    
    return parsed.slice(0, 6).map((c: any, i: number) => {
      const contentType = validTypes.includes(c.type) ? c.type : validTypes[i % validTypes.length]
      return {
        id: `exc-content-ai-${Date.now()}-${i}`,
        type: contentType,
        title: c.title || EXCLUSIVE_CONTENT_TYPES.find(t => t.type === contentType)?.name || 'Exclusive Content',
        description: c.description || `Exclusive ${contentType.replace(/_/g, ' ')} for members.`,
        previewText: c.previewText || `Special content from ${context.teamName}.`,
        effects: {
          memberSatisfaction: Math.max(1, Math.min(15, c.effects?.memberSatisfaction || 5)),
          memberGrowth: Math.max(0, Math.min(10, c.effects?.memberGrowth || 2)),
          followerConversion: Math.max(0, Math.min(5, c.effects?.followerConversion || 1)),
          engagementBoost: Math.max(1, Math.min(10, c.effects?.engagementBoost || 3))
        },
        productionCost: Math.max(500, Math.min(8000, c.productionCost || 2000)),
        icon: typeIcons[contentType as ExclusiveContentType] || '📺'
      }
    })
    
  } catch (e) {
    console.error('[MediaAI] Exclusive content generation failed:', e)
    return generateExclusiveContentOptions(context)
  }
}