/**
 * Email AI Service
 * 
 * Uses Gemini Flash to dynamically generate unique email content for
 * sponsor communications, board messages, invitations, and more.
 * Falls back to templates if AI is unavailable.
 */

import type { EmailCategory } from '@/store/careerStore'
import { getStaffNameOrFallback } from '@/services/eventContentGenerator'
import { getNextGeminiApiKey } from '@/services/geminiKeyRotation'

// ============================================
// TYPES
// ============================================

export interface EmailGenerationContext {
  category: EmailCategory | string
  playerName: string
  teamName: string
  currentWeek: number
  currentYear: number
  boardMood?: number
  cash?: number
}

export interface SponsorEmailContext extends EmailGenerationContext {
  category: 'sponsor'
  sponsor: any
  emailType: 'offer' | 'warning' | 'renewal' | 'termination' | 'milestone'
}

export interface InvitationEmailContext extends EmailGenerationContext {
  category: 'invitation'
  invitation: any
}

export interface BoardEmailContext extends EmailGenerationContext {
  category: 'board'
  targetDescription: string
  currentValue?: number
  targetValue?: number
  deadline?: string
  warningLevel: 'concern' | 'warning' | 'critical'
}

export interface GeneratedEmailContent {
  subject: string
  body: string
  sender: string
  senderRole: string
  preview: string
}

// ============================================
// GEMINI API INTEGRATION
// ============================================

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'

/**
 * Get the stored Gemini API key.
 * Primary source: commentary-settings (where the Settings screen saves it).
 * Fallbacks: app-settings, career-settings (legacy).
 */
function getApiKey(): string | null {
  return getNextGeminiApiKey()
}

// ============================================
// AI AVAILABILITY CHECK
// ============================================

export function isAIEmailAvailable(): boolean {
  return !!getApiKey()
}

/**
 * Safely parse JSON from API response, handling code-block wrapping
 */
function safeParseJSON(content: string): any {
  let jsonStr = content

  // Extract from code blocks
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch && codeBlockMatch[1]) {
    jsonStr = codeBlockMatch[1].trim()
  } else {
    const jsonMatch = content.match(/(\{[\s\S]*\})/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }
  }

  // Clean common issues
  jsonStr = jsonStr
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .replace(/\t/g, '\\t')

  return JSON.parse(jsonStr)
}

/**
 * Call Gemini API with retry logic
 */
async function callGeminiAPI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 800
): Promise<string | null> {
  const apiKey = getApiKey()
  if (!apiKey) return null

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-2.0-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      console.warn('[EmailAI] API error:', response.status)
      return null
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || null
  } catch (error) {
    console.warn('[EmailAI] API call failed:', error)
    return null
  }
}

// ============================================
// SYSTEM PROMPTS
// ============================================

const EMAIL_SYSTEM_PROMPT = `You are an email writing assistant for a motorsport team management game.
You generate realistic, professional email content for various senders (sponsors, board members, event organizers, etc.).

Rules:
- Write in the character of the sender, not as the player
- Keep emails concise but professional — 2-4 paragraphs maximum
- Use realistic business language appropriate to motorsport
- Never break character or reference the game directly
- Vary your writing style based on sender role and email type
- Include specific numbers and details when provided in context

You MUST respond with ONLY a JSON object in this exact format:
{
  "subject": "email subject line",
  "body": "full email body text with proper paragraphs",
  "sender": "Sender Full Name",
  "senderRole": "Sender's Job Title, Organization",
  "preview": "1-sentence preview of the email content"
}`

// ============================================
// GENERATION FUNCTIONS
// ============================================

export async function generateSponsorEmail(
  context: SponsorEmailContext
): Promise<GeneratedEmailContent | null> {
  const { sponsor, emailType, teamName, currentWeek, currentYear } = context

  const emailTypePrompts: Record<string, string> = {
    offer: `Write a professional sponsorship offer email from ${sponsor.sponsorName} to ${teamName}.
The sponsor is offering:
- Monthly payment: $${sponsor.monthlyPayment?.toLocaleString() || 'negotiable'}
- Win bonus: $${sponsor.bonusPerWin?.toLocaleString() || '0'}
- Podium bonus: $${sponsor.bonusPerPodium?.toLocaleString() || '0'}
- Contract duration: ${sponsor.duration || 1} season(s)
The tone should be enthusiastic and professional. Make it feel like a real business opportunity.`,

    warning: `Write a concerned sponsorship warning email from ${sponsor.sponsorName} to ${teamName}.
Current sponsor satisfaction: ${sponsor.satisfaction ?? 50}%.
The sponsor is unhappy with the team's recent performance and is considering their options.
The tone should be firm but diplomatic — this is a business relationship at risk.`,

    renewal: `Write a sponsorship renewal proposal email from ${sponsor.sponsorName} to ${teamName}.
They want to renew their existing deal. Current satisfaction: ${sponsor.satisfaction ?? 70}%.
Monthly payment: $${sponsor.monthlyPayment?.toLocaleString() || 'TBD'}.
The tone should be positive but business-focused.`,

    termination: `Write a sponsorship termination email from ${sponsor.sponsorName} to ${teamName}.
The sponsor is ending their deal due to poor performance or low satisfaction (${sponsor.satisfaction ?? 30}%).
The tone should be professional and final, but not hostile. Thank the team for their time.`,

    milestone: `Write a congratulatory email from ${sponsor.sponsorName} to ${teamName}.
The sponsor is pleased with recent achievements and wants to acknowledge the milestone.
Satisfaction: ${sponsor.satisfaction ?? 80}%.
The tone should be warm and celebratory.`
  }

  const userPrompt = emailTypePrompts[emailType] || emailTypePrompts.offer
  const fullPrompt = `${userPrompt}\n\nContext: Week ${currentWeek} of ${currentYear}. Sponsor: ${sponsor.sponsorName}. Team: ${teamName}.`

  try {
    const raw = await callGeminiAPI(EMAIL_SYSTEM_PROMPT, fullPrompt)
    if (!raw) return null

    const parsed = safeParseJSON(raw)
    if (parsed?.subject && parsed?.body && parsed?.sender) {
      return {
        subject: parsed.subject,
        body: parsed.body,
        sender: parsed.sender,
        senderRole: parsed.senderRole || `Sponsorship Manager, ${sponsor.sponsorName}`,
        preview: parsed.preview || parsed.body.slice(0, 80) + '...'
      }
    }
  } catch (e) {
    console.warn('[EmailAI] Failed to parse sponsor email response:', e)
  }
  return null
}

export async function generateInvitationEmail(
  context: InvitationEmailContext
): Promise<GeneratedEmailContent | null> {
  const { invitation, teamName, currentWeek, currentYear } = context

  const userPrompt = `Write an invitation email to ${teamName} for a special motorsport event.
Event details:
- Event: ${invitation.name || invitation.title || 'Special Racing Event'}
- Type: ${invitation.type || 'invitational'}
- Prize/reward: ${invitation.prize || invitation.reward || 'TBD'}
- Location: ${invitation.location || invitation.venue || 'TBD'}
${invitation.description ? `- Description: ${invitation.description}` : ''}

The email should come from an event organizer and feel prestigious. Make the driver feel honored to be invited.
Context: Week ${currentWeek} of ${currentYear}. Team: ${teamName}.`

  try {
    const raw = await callGeminiAPI(EMAIL_SYSTEM_PROMPT, userPrompt)
    if (!raw) return null

    const parsed = safeParseJSON(raw)
    if (parsed?.subject && parsed?.body && parsed?.sender) {
      return {
        subject: parsed.subject,
        body: parsed.body,
        sender: parsed.sender,
        senderRole: parsed.senderRole || 'Event Director',
        preview: parsed.preview || parsed.body.slice(0, 80) + '...'
      }
    }
  } catch (e) {
    console.warn('[EmailAI] Failed to parse invitation email response:', e)
  }
  return null
}

export async function generateBoardEmail(
  context: BoardEmailContext
): Promise<GeneratedEmailContent | null> {
  const { teamName, targetDescription, currentValue, targetValue, deadline, warningLevel, boardMood, currentWeek, currentYear } = context

  const severityDescriptions: Record<string, string> = {
    concern: 'mildly concerned and advisory',
    warning: 'serious and pressing',
    critical: 'urgent and demanding immediate action'
  }

  const userPrompt = `Write an email from the Board of Directors to the Team Principal of ${teamName}.
The board is ${severityDescriptions[warningLevel] || 'concerned'} about a performance target.

Target: ${targetDescription}
${currentValue !== undefined ? `Current value: ${currentValue}` : ''}
${targetValue !== undefined ? `Target value: ${targetValue}` : ''}
${deadline ? `Deadline: ${deadline}` : ''}
Board mood: ${boardMood ?? 50}/100

The tone should match the severity level: "${warningLevel}".
${warningLevel === 'critical' ? 'The board is threatening consequences if targets are not met.' : ''}
${warningLevel === 'concern' ? 'Keep it diplomatic and advisory.' : ''}
Context: Week ${currentWeek} of ${currentYear}. Team: ${teamName}.`

  try {
    const raw = await callGeminiAPI(EMAIL_SYSTEM_PROMPT, userPrompt)
    if (!raw) return null

    const parsed = safeParseJSON(raw)
    if (parsed?.subject && parsed?.body && parsed?.sender) {
      return {
        subject: parsed.subject,
        body: parsed.body,
        sender: parsed.sender,
        senderRole: parsed.senderRole || `Chairman of the Board, ${teamName}`,
        preview: parsed.preview || parsed.body.slice(0, 80) + '...'
      }
    }
  } catch (e) {
    console.warn('[EmailAI] Failed to parse board email response:', e)
  }
  return null
}

export async function generateWelcomeEmail(
  context: EmailGenerationContext
): Promise<GeneratedEmailContent | null> {
  const { teamName, playerName, currentYear } = context

  const senderRole = getStaffNameOrFallback('team_manager', 'the team operations department')
  const userPrompt = `Write a welcome email from ${senderRole} to the new Team Principal of ${teamName}.
The player's name is ${playerName || 'the new Team Principal'}.
This is the start of the ${currentYear} season and their first day running the team.

The email should:
- Welcome them warmly to the role
- Briefly mention upcoming challenges (setting up sponsors, hiring staff, preparing for races)
- Express confidence in their leadership
- Mention that other departments will be in touch
Keep it encouraging and motivational. This is the first email the player sees.`

  try {
    const raw = await callGeminiAPI(EMAIL_SYSTEM_PROMPT, userPrompt)
    if (!raw) return null

    const parsed = safeParseJSON(raw)
    if (parsed?.subject && parsed?.body && parsed?.sender) {
      return {
        subject: parsed.subject,
        body: parsed.body,
        sender: parsed.sender,
        senderRole: parsed.senderRole || `Team Operations, ${teamName}`,
        preview: parsed.preview || parsed.body.slice(0, 80) + '...'
      }
    }
  } catch (e) {
    console.warn('[EmailAI] Failed to parse welcome email response:', e)
  }
  return null
}

export async function generateWeeklySummaryEmail(
  context: EmailGenerationContext
): Promise<GeneratedEmailContent | null> {
  const { teamName, currentWeek, currentYear, boardMood, cash } = context

  const weeklyRole = getStaffNameOrFallback('team_manager', 'the team operations department')
  const userPrompt = `Write a brief weekly operations summary email from ${weeklyRole} to the Team Principal of ${teamName}.
Week ${currentWeek} of ${currentYear}.

${cash !== undefined ? `Current cash reserves: $${cash.toLocaleString()}` : ''}
${boardMood !== undefined ? `Board satisfaction: ${boardMood}/100` : ''}

The email should:
- Summarize the operational state in 2-3 short paragraphs
- Mention any areas of concern (if low cash or low board mood)
- Keep a professional, informative tone
- End with a brief look ahead to next week
Keep it concise — this is a routine weekly update.`

  try {
    const raw = await callGeminiAPI(EMAIL_SYSTEM_PROMPT, userPrompt)
    if (!raw) return null

    const parsed = safeParseJSON(raw)
    if (parsed?.subject && parsed?.body && parsed?.sender) {
      return {
        subject: parsed.subject,
        body: parsed.body,
        sender: parsed.sender,
        senderRole: parsed.senderRole || `Team Operations, ${teamName}`,
        preview: parsed.preview || parsed.body.slice(0, 80) + '...'
      }
    }
  } catch (e) {
    console.warn('[EmailAI] Failed to parse weekly summary email response:', e)
  }
  return null
}

// ============================================
// PA WEEKLY PLANNING EMAIL (AI-enhanced)
// ============================================

export interface PlanningEmailContext extends EmailGenerationContext {
  mandatoryActivities: Array<{ name: string; duration: number; deadline?: string }>
  suggestions: Array<{ text: string; reason: string; urgency: string; category: string }>
  personalSuggestions: Array<{ text: string; reason: string }>
  mandatoryHours: number
  suggestedHours: number
  freeHours: number
  partnerName?: string
  stress?: number
  fitness?: number
}

export async function generateWeeklyPlanningEmail(
  context: PlanningEmailContext
): Promise<GeneratedEmailContent | null> {
  const {
    teamName, currentWeek, currentYear,
    mandatoryActivities, suggestions, personalSuggestions,
    mandatoryHours, suggestedHours, freeHours,
    partnerName, stress, fitness
  } = context

  const PA_SYSTEM_PROMPT = `You are a Personal Assistant in a motorsport team management game.
You write weekly planning emails to the Team Principal (the player).
Your tone is friendly, supportive, and organized — like a capable PA who genuinely cares.

Rules:
- Use structured sections: "Must Do", "Recommended", "Personal Touch", "Time Budget"
- Be specific with hours and deadlines
- Use bullet points for clarity
- Keep it warm but professional
- Never break character or reference "the game"
- Add encouraging notes where appropriate

Respond with ONLY a JSON object:
{
  "subject": "Weekly Planner — Week X",
  "body": "full planning email body",
  "sender": "PA Name",
  "senderRole": "Personal Assistant",
  "preview": "1-sentence preview"
}`

  const mandatoryList = mandatoryActivities.length > 0
    ? mandatoryActivities.map(a => `- ${a.name} (${a.duration}h${a.deadline ? `, due ${a.deadline}` : ''})`).join('\n')
    : '- No mandatory activities this week'
  
  const suggestionList = suggestions.slice(0, 5)
    .map(s => `- ${s.text} [${s.urgency}] — ${s.reason}`).join('\n')
  
  const personalList = personalSuggestions.slice(0, 3)
    .map(s => `- ${s.text} — ${s.reason}`).join('\n')

  const userPrompt = `Write a weekly planning email for the Team Principal of ${teamName}.
Week ${currentWeek} of Year ${currentYear}.

MANDATORY TASKS:
${mandatoryList}

RECOMMENDED ACTIONS:
${suggestionList || '- Nothing urgent this week'}

PERSONAL LIFE:
${personalList || '- Everything looks good'}
${partnerName ? `Partner: ${partnerName}` : ''}
${stress !== undefined ? `Stress level: ${stress}%` : ''}
${fitness !== undefined ? `Fitness: ${fitness}%` : ''}

TIME BUDGET:
- Mandatory: ${mandatoryHours}h
- Suggested: ${suggestedHours}h  
- Free time: ~${freeHours}h

End with a note about the auto-schedule button they can use.`

  try {
    const raw = await callGeminiAPI(PA_SYSTEM_PROMPT, userPrompt, 1000)
    if (!raw) return null

    const parsed = safeParseJSON(raw)
    if (parsed?.subject && parsed?.body && parsed?.sender) {
      return {
        subject: parsed.subject,
        body: parsed.body,
        sender: parsed.sender,
        senderRole: parsed.senderRole || 'Personal Assistant',
        preview: parsed.preview || parsed.body.slice(0, 80) + '...'
      }
    }
  } catch (e) {
    console.warn('[EmailAI] Failed to parse planning email response:', e)
  }
  return null
}
