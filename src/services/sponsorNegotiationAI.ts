/**
 * Sponsor Negotiation AI Service
 * 
 * Uses Gemini to generate dynamic, context-aware emails for sponsor negotiations.
 * Includes outreach emails, offer responses, counter-offer communications,
 * acceptance/decline notifications, and more.
 */

import {
  SponsorNegotiation,
  SponsorOffer,
  SponsorPersonalityType,
  OwnedTeam
} from '@/store/careerStore'
import { Sponsor } from '@/data/sponsors'
import { calculateOfferDifference } from '@/simulation/sponsors/negotiation'

// ============================================
// TYPES
// ============================================

export interface NegotiationEmailContext {
  teamName: string
  teamReputation: number
  teamBaseCountry: string
  ownerBackground?: string
  recentResults?: string[]
  sponsorName: string
  sponsorCategory: string
  sponsorTier: string
  personality: SponsorPersonalityType
  currentWeek: number
  currentYear: number
}

export interface OutreachEmailContext extends NegotiationEmailContext {
  estimatedDealValue: number
  compatibilityScore: number
}

export interface OfferEmailContext extends NegotiationEmailContext {
  offer: SponsorOffer
  initiatedBy: 'team' | 'sponsor'
  roundNumber: number
}

export interface CounterResponseContext extends NegotiationEmailContext {
  playerOffer: SponsorOffer
  sponsorOffer: SponsorOffer
  newOffer?: SponsorOffer
  response: 'accept' | 'counter' | 'withdraw'
  roundNumber: number
  maxRounds: number
}

export interface GeneratedNegotiationEmail {
  subject: string
  sender: string
  senderRole: string
  preview: string
  body: string
}

// ============================================
// GEMINI API INTEGRATION
// ============================================

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'

function getApiKey(): string | null {
  try {
    const settings = localStorage.getItem('app-settings')
    if (settings) {
      const parsed = JSON.parse(settings)
      return parsed.geminiApiKey || null
    }
  } catch (e) {
    console.warn('[NegotiationAI] Error reading API key from localStorage')
  }
  return null
}

export function isNegotiationAIAvailable(): boolean {
  return !!getApiKey()
}

function safeParseJSON(content: string): any {
  let jsonStr = content
  
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch && codeBlockMatch[1]) {
    jsonStr = codeBlockMatch[1].trim()
  } else {
    const jsonMatch = content.match(/(\{[\s\S]*\})/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }
  }
  
  jsonStr = jsonStr
    .replace(/,\s*}/g, '}')
    .replace(/,\s*\]/g, ']')
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .trim()
  
  return JSON.parse(jsonStr)
}

async function callGemini(
  systemPrompt: string, 
  userPrompt: string
): Promise<GeneratedNegotiationEmail | null> {
  const apiKey = getApiKey()
  if (!apiKey) return null
  
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-2.0-flash-lite',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1200,
        temperature: 0.8
      })
    })
    
    if (!response.ok) {
      console.warn('[NegotiationAI] API response not ok:', response.status)
      return null
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    
    if (!content) {
      console.warn('[NegotiationAI] No content in response')
      return null
    }
    
    return safeParseJSON(content)
  } catch (error) {
    console.warn('[NegotiationAI] Error calling Gemini:', error)
    return null
  }
}

// ============================================
// SYSTEM PROMPTS
// ============================================

const NEGOTIATION_SYSTEM_PROMPT = `You are an email content generator for a motorsport team management game. Generate realistic, professional business negotiation emails between sponsors and racing teams.

PERSONALITY GUIDE:
- formal: Professional, polite, uses proper business language
- casual: Friendly, uses first names, enthusiastic about racing
- demanding: Direct, sets high expectations, mentions specific requirements
- friendly: Warm, personable, shows genuine interest in partnership
- corporate: Very business-like, references KPIs and metrics, formal structure

IMPORTANT RULES:
1. Match the tone to the sponsor personality type provided
2. Include specific financial details when discussing offers
3. Make counter-offer emails acknowledge what was proposed and explain the counter
4. Keep body text to 3-4 paragraphs max
5. Preview should be first 50-80 characters of meaningful content
6. Use realistic sponsor representative names and titles

Return ONLY valid JSON in this exact format:
{
  "subject": "Email subject line",
  "sender": "Person's Full Name",
  "senderRole": "Title, Company Name",
  "preview": "First 50-80 chars preview...",
  "body": "Full email body with \\n\\n for paragraph breaks"
}`

// ============================================
// PERSONALITY TEMPLATES
// ============================================

const PERSONALITY_TRAITS: Record<SponsorPersonalityType, {
  greeting: string
  closing: string
  style: string
}> = {
  formal: {
    greeting: 'Dear Team Principal',
    closing: 'Best regards',
    style: 'professional and courteous'
  },
  casual: {
    greeting: 'Hey there',
    closing: 'Cheers',
    style: 'friendly and enthusiastic'
  },
  demanding: {
    greeting: 'Team Principal',
    closing: 'We expect your prompt response',
    style: 'direct and expectation-focused'
  },
  friendly: {
    greeting: 'Hi',
    closing: 'Looking forward to hearing from you',
    style: 'warm and personable'
  },
  corporate: {
    greeting: 'Dear Sir/Madam',
    closing: 'Kind regards',
    style: 'business-like with metrics focus'
  }
}

// ============================================
// EMAIL GENERATION FUNCTIONS
// ============================================

/**
 * Generate team outreach email to a sponsor
 */
export async function generateOutreachEmail(
  context: OutreachEmailContext
): Promise<GeneratedNegotiationEmail | null> {
  const userPrompt = `Generate an outreach email FROM ${context.teamName} racing team TO ${context.sponsorName}.

Context:
- Team: ${context.teamName}
- Team Reputation: ${context.teamReputation}/100
- Team Base Country: ${context.teamBaseCountry}
${context.ownerBackground ? `- Team Owner Background: ${context.ownerBackground}` : ''}
- Sponsor: ${context.sponsorName}
- Sponsor Category: ${context.sponsorCategory}
- Sponsor Tier: ${context.sponsorTier}
- Estimated Deal Value: $${context.estimatedDealValue.toLocaleString()}/year
- Compatibility Score: ${context.compatibilityScore}/100
${context.recentResults?.length ? `- Recent Results: ${context.recentResults.join(', ')}` : ''}

The team is reaching out to propose a sponsorship partnership. The email should:
1. Introduce the team and its achievements
2. Explain why this sponsor would be a good fit
3. Express interest in discussing terms
4. Be professional but show enthusiasm

The sender should be the Team Principal or Commercial Director of ${context.teamName}.`

  return callGemini(NEGOTIATION_SYSTEM_PROMPT, userPrompt)
}

/**
 * Generate sponsor's initial interest/offer email
 */
export async function generateInitialOfferEmail(
  context: OfferEmailContext
): Promise<GeneratedNegotiationEmail | null> {
  const { offer, personality, initiatedBy } = context
  const traits = PERSONALITY_TRAITS[personality]
  
  const totalAnnualValue = (offer.monthlyPayment * 12) + 
    (offer.winBonus * 3) + (offer.podiumBonus * 6) + 
    (offer.championshipBonus || 0)
  
  const userPrompt = `Generate a sponsorship offer email FROM ${context.sponsorName} TO ${context.teamName}.

Context:
- Sponsor: ${context.sponsorName} (${context.sponsorCategory})
- Sponsor Personality: ${personality} (${traits.style})
- Team: ${context.teamName}
- Team Reputation: ${context.teamReputation}/100
- This is ${initiatedBy === 'team' ? 'a RESPONSE to the team reaching out' : 'an UNSOLICITED approach from the sponsor'}

Offer Details:
- Position: ${offer.slot.charAt(0).toUpperCase() + offer.slot.slice(1)} Sponsor
- Monthly Payment: $${offer.monthlyPayment.toLocaleString()}
- Win Bonus: $${offer.winBonus.toLocaleString()}
- Podium Bonus: $${offer.podiumBonus.toLocaleString()}
${offer.championshipBonus > 0 ? `- Championship Bonus: $${offer.championshipBonus.toLocaleString()}` : ''}
- Contract Duration: ${offer.duration} year${offer.duration > 1 ? 's' : ''}
- Total Annual Value (est.): $${totalAnnualValue.toLocaleString()}

Performance Targets:
${offer.targets.map(t => `- ${t.description}`).join('\n')}

The email should:
1. ${initiatedBy === 'team' ? 'Thank the team for reaching out and express interest' : 'Introduce the sponsor and explain why they\'re interested'}
2. Present the offer terms clearly
3. Mention the performance targets expected
4. Invite the team to discuss or accept
5. Match the ${personality} personality style

The sender should be a Partnership Manager, Sponsorship Director, or similar from ${context.sponsorName}.`

  return callGemini(NEGOTIATION_SYSTEM_PROMPT, userPrompt)
}

/**
 * Generate sponsor response to player's counter offer
 */
export async function generateCounterResponseEmail(
  context: CounterResponseContext
): Promise<GeneratedNegotiationEmail | null> {
  const { playerOffer, sponsorOffer, newOffer, response, personality, roundNumber, maxRounds } = context
  const traits = PERSONALITY_TRAITS[personality]
  
  const difference = calculateOfferDifference(sponsorOffer, playerOffer)
  const differencePercent = Math.round(difference * 100)
  
  let responsePrompt = ''
  
  if (response === 'accept') {
    responsePrompt = `The sponsor is ACCEPTING the team's counter offer.

The email should:
1. Express pleasure at reaching an agreement
2. Confirm the accepted terms
3. Mention next steps (contracts, announcements)
4. Be enthusiastic about the partnership`
  } else if (response === 'withdraw') {
    responsePrompt = `The sponsor is WITHDRAWING from negotiations (walking away).

Reasons could include:
- Too many negotiation rounds (${roundNumber}/${maxRounds})
- Team asked for ${differencePercent}% more than offered
- Sponsor losing patience

The email should:
1. Express regret that an agreement couldn't be reached
2. ${personality === 'demanding' ? 'Be firm about the decision' : 'Leave door open for future opportunities'}
3. Keep it professional
4. Be brief but clear`
  } else {
    // Counter offer
    const newTotalValue = newOffer ? 
      (newOffer.monthlyPayment * 12) + (newOffer.winBonus * 3) + (newOffer.podiumBonus * 6) : 0
    
    responsePrompt = `The sponsor is making a COUNTER offer.

Team's proposal:
- Monthly: $${playerOffer.monthlyPayment.toLocaleString()}
- Win Bonus: $${playerOffer.winBonus.toLocaleString()}
- Podium Bonus: $${playerOffer.podiumBonus.toLocaleString()}
- Duration: ${playerOffer.duration} years
- Team asked for ${differencePercent}% more than our last offer

Our new counter offer:
- Monthly: $${newOffer?.monthlyPayment.toLocaleString()}
- Win Bonus: $${newOffer?.winBonus.toLocaleString()}
- Podium Bonus: $${newOffer?.podiumBonus.toLocaleString()}
- Duration: ${newOffer?.duration} years
- New Total Annual Value (est.): $${newTotalValue.toLocaleString()}

Negotiation round: ${roundNumber} of ${maxRounds} max

The email should:
1. Acknowledge the team's counter proposal
2. ${personality === 'demanding' ? 'Express that expectations need to be realistic' : 'Show willingness to meet partway'}
3. Present the revised offer
4. ${roundNumber >= maxRounds - 1 ? 'Hint this may be final opportunity' : 'Invite continued discussion'}
5. Match the ${personality} personality style`
  }

  const userPrompt = `Generate a negotiation response email FROM ${context.sponsorName} TO ${context.teamName}.

Context:
- Sponsor: ${context.sponsorName} (${context.sponsorCategory})
- Sponsor Personality: ${personality} (${traits.style})
- Team: ${context.teamName}
- Negotiation Round: ${roundNumber}

${responsePrompt}

The sender should be the same Partnership Manager/Director from previous emails.`

  return callGemini(NEGOTIATION_SYSTEM_PROMPT, userPrompt)
}

/**
 * Generate team's counter proposal email (for sent folder)
 */
export async function generateTeamCounterEmail(
  context: OfferEmailContext,
  previousOffer: SponsorOffer
): Promise<GeneratedNegotiationEmail | null> {
  const { offer, personality } = context
  const traits = PERSONALITY_TRAITS[personality]
  
  const difference = calculateOfferDifference(previousOffer, offer)
  const differencePercent = Math.round(difference * 100)
  
  const userPrompt = `Generate a counter proposal email FROM ${context.teamName} TO ${context.sponsorName}.

Context:
- Team: ${context.teamName}
- Team Reputation: ${context.teamReputation}/100
- Sponsor: ${context.sponsorName} (${context.sponsorCategory})
- Sponsor Personality: ${personality} (${traits.style})
- Negotiation Round: ${context.roundNumber}

Sponsor's Previous Offer:
- Monthly: $${previousOffer.monthlyPayment.toLocaleString()}
- Win Bonus: $${previousOffer.winBonus.toLocaleString()}
- Podium Bonus: $${previousOffer.podiumBonus.toLocaleString()}
- Duration: ${previousOffer.duration} years

Team's Counter Proposal:
- Monthly: $${offer.monthlyPayment.toLocaleString()}
- Win Bonus: $${offer.winBonus.toLocaleString()}
- Podium Bonus: $${offer.podiumBonus.toLocaleString()}
- Duration: ${offer.duration} years
- Requesting ${differencePercent}% ${differencePercent > 0 ? 'more' : 'less'} value

The email should:
1. Thank the sponsor for their offer
2. Express continued interest in partnership
3. Explain why the team believes improved terms are justified
4. Present the counter proposal professionally
5. Remain respectful of the sponsor's position

The sender should be the Team Principal or Commercial Director of ${context.teamName}.`

  return callGemini(NEGOTIATION_SYSTEM_PROMPT, userPrompt)
}

/**
 * Generate deal acceptance confirmation email
 */
export async function generateAcceptanceEmail(
  context: OfferEmailContext
): Promise<GeneratedNegotiationEmail | null> {
  const { offer, personality } = context
  const traits = PERSONALITY_TRAITS[personality]
  
  const totalAnnualValue = (offer.monthlyPayment * 12) + 
    (offer.winBonus * 3) + (offer.podiumBonus * 6) + 
    (offer.championshipBonus || 0)
  
  const userPrompt = `Generate a deal confirmation/welcome email FROM ${context.sponsorName} TO ${context.teamName}.

Context:
- Sponsor: ${context.sponsorName} (${context.sponsorCategory})
- Sponsor Personality: ${personality} (${traits.style})
- Team: ${context.teamName}
- Negotiations completed after ${context.roundNumber} round(s)

Final Agreed Terms:
- Position: ${offer.slot.charAt(0).toUpperCase() + offer.slot.slice(1)} Sponsor
- Monthly Payment: $${offer.monthlyPayment.toLocaleString()}
- Win Bonus: $${offer.winBonus.toLocaleString()}
- Podium Bonus: $${offer.podiumBonus.toLocaleString()}
${offer.championshipBonus > 0 ? `- Championship Bonus: $${offer.championshipBonus.toLocaleString()}` : ''}
- Contract Duration: ${offer.duration} year${offer.duration > 1 ? 's' : ''}
- Total Annual Value (est.): $${totalAnnualValue.toLocaleString()}

The email should:
1. Congratulate on reaching an agreement
2. Confirm the final terms
3. Express excitement about the partnership
4. Mention next steps (contracts will follow, PR announcements, etc.)
5. Welcome the team to the sponsor family
6. Match the ${personality} personality style

This is a celebratory, positive email. The sender should be a senior executive from ${context.sponsorName}.`

  return callGemini(NEGOTIATION_SYSTEM_PROMPT, userPrompt)
}

/**
 * Generate outreach response email (sponsor responding to team approach)
 */
export async function generateOutreachResponseEmail(
  context: NegotiationEmailContext,
  response: 'interested' | 'soft_decline' | 'hard_decline'
): Promise<GeneratedNegotiationEmail | null> {
  const traits = PERSONALITY_TRAITS[context.personality]
  
  let responsePrompt = ''
  
  if (response === 'interested') {
    responsePrompt = `The sponsor is INTERESTED in the team's outreach and wants to discuss further.

The email should:
1. Thank the team for reaching out
2. Express genuine interest in the partnership opportunity
3. Mention they'd like to explore terms
4. Request a follow-up meeting or call
5. Be encouraging`
  } else if (response === 'soft_decline') {
    responsePrompt = `The sponsor is politely DECLINING but leaving the door open for future.

The team's reputation (${context.teamReputation}) is slightly below requirements but not far off.

The email should:
1. Thank the team for reaching out
2. Explain timing isn't right currently
3. Mention they're watching the team's progress
4. Suggest reaching out again in the future
5. Be polite and encouraging`
  } else {
    responsePrompt = `The sponsor is firmly DECLINING the partnership.

The team's reputation (${context.teamReputation}) is significantly below requirements.

The email should:
1. Thank the team for their interest
2. Politely explain they're not able to proceed
3. Keep it brief and professional
4. ${context.personality === 'demanding' ? 'Be direct about requirements not being met' : 'Be diplomatic about the decision'}`
  }

  const userPrompt = `Generate a response email FROM ${context.sponsorName} TO ${context.teamName} regarding their sponsorship outreach.

Context:
- Sponsor: ${context.sponsorName} (${context.sponsorCategory})
- Sponsor Tier: ${context.sponsorTier}
- Sponsor Personality: ${context.personality} (${traits.style})
- Team: ${context.teamName}
- Team Reputation: ${context.teamReputation}/100
- Team Base: ${context.teamBaseCountry}

${responsePrompt}

The sender should be a Partnerships or Sponsorship Manager from ${context.sponsorName}.`

  return callGemini(NEGOTIATION_SYSTEM_PROMPT, userPrompt)
}

// ============================================
// FALLBACK TEMPLATES
// ============================================

/**
 * Generate fallback template when AI is unavailable
 */
export function generateFallbackEmail(
  type: 'outreach' | 'offer' | 'counter_response' | 'acceptance' | 'withdrawal' | 'outreach_response',
  context: Partial<NegotiationEmailContext & OfferEmailContext & CounterResponseContext>,
  response?: 'interested' | 'soft_decline' | 'hard_decline' | 'accept' | 'counter' | 'withdraw'
): GeneratedNegotiationEmail {
  const sponsorName = context.sponsorName || 'Sponsor'
  const teamName = context.teamName || 'Team'
  const personality = context.personality || 'formal'
  const traits = PERSONALITY_TRAITS[personality]
  
  switch (type) {
    case 'outreach':
      return {
        subject: `Partnership Inquiry - ${teamName}`,
        sender: 'Commercial Director',
        senderRole: `Commercial Director, ${teamName}`,
        preview: `${teamName} would like to discuss a potential sponsorship...`,
        body: `${traits.greeting},\n\nOn behalf of ${teamName}, I am reaching out to explore a potential sponsorship partnership with ${sponsorName}.\n\nOur team has been making significant progress and we believe there could be excellent synergies between our organizations.\n\nWe would welcome the opportunity to discuss this further at your convenience.\n\n${traits.closing},\nCommercial Director\n${teamName}`
      }
    
    case 'offer':
      const offer = (context as OfferEmailContext).offer
      return {
        subject: `Sponsorship Proposal - ${sponsorName}`,
        sender: 'Partnership Manager',
        senderRole: `Partnership Manager, ${sponsorName}`,
        preview: `${sponsorName} is pleased to present a sponsorship offer...`,
        body: `${traits.greeting},\n\nWe are pleased to present ${teamName} with a sponsorship proposal.\n\nProposed Terms:\n- Position: ${offer?.slot || 'Secondary'} Sponsor\n- Monthly Payment: $${(offer?.monthlyPayment || 0).toLocaleString()}\n- Win Bonus: $${(offer?.winBonus || 0).toLocaleString()}\n- Podium Bonus: $${(offer?.podiumBonus || 0).toLocaleString()}\n- Duration: ${offer?.duration || 1} year(s)\n\nWe believe this partnership would benefit both parties and look forward to your response.\n\n${traits.closing},\nPartnership Manager\n${sponsorName}`
      }
    
    case 'counter_response':
      if (response === 'accept') {
        return {
          subject: `Partnership Agreement Reached - ${sponsorName}`,
          sender: 'Partnership Director',
          senderRole: `Partnership Director, ${sponsorName}`,
          preview: `We are delighted to confirm our agreement...`,
          body: `${traits.greeting},\n\nWe are delighted to confirm that we have reached an agreement on partnership terms.\n\nOur legal team will be in touch shortly with the formal contracts.\n\nWe look forward to a successful partnership.\n\n${traits.closing},\nPartnership Director\n${sponsorName}`
        }
      } else if (response === 'withdraw') {
        return {
          subject: `RE: Partnership Discussions - ${sponsorName}`,
          sender: 'Partnership Manager',
          senderRole: `Partnership Manager, ${sponsorName}`,
          preview: `Unfortunately, we are unable to proceed...`,
          body: `${traits.greeting},\n\nAfter careful consideration, we regret to inform you that we are unable to proceed with the partnership at this time.\n\nWe appreciate the discussions and wish ${teamName} continued success.\n\n${traits.closing},\nPartnership Manager\n${sponsorName}`
        }
      } else {
        const newOffer = (context as CounterResponseContext).newOffer
        return {
          subject: `RE: Partnership Proposal - ${sponsorName}`,
          sender: 'Partnership Manager',
          senderRole: `Partnership Manager, ${sponsorName}`,
          preview: `Thank you for your counter proposal. We would like to offer...`,
          body: `${traits.greeting},\n\nThank you for your counter proposal.\n\nAfter internal discussions, we would like to offer revised terms:\n- Monthly Payment: $${(newOffer?.monthlyPayment || 0).toLocaleString()}\n- Win Bonus: $${(newOffer?.winBonus || 0).toLocaleString()}\n- Podium Bonus: $${(newOffer?.podiumBonus || 0).toLocaleString()}\n\nWe hope these terms are more aligned with your expectations.\n\n${traits.closing},\nPartnership Manager\n${sponsorName}`
        }
      }
    
    case 'acceptance':
      return {
        subject: `Welcome to the ${sponsorName} Family!`,
        sender: 'Head of Partnerships',
        senderRole: `Head of Partnerships, ${sponsorName}`,
        preview: `Congratulations! We are thrilled to welcome you...`,
        body: `${traits.greeting},\n\nCongratulations! We are thrilled to officially welcome ${teamName} to the ${sponsorName} family.\n\nOur partnership marks an exciting new chapter, and we look forward to achieving great things together.\n\nFormal contracts will follow shortly. In the meantime, our marketing team will be in touch regarding announcements and branding.\n\n${traits.closing},\nHead of Partnerships\n${sponsorName}`
      }
    
    case 'outreach_response':
      if (response === 'interested') {
        return {
          subject: `RE: Partnership Inquiry - ${sponsorName}`,
          sender: 'Partnership Manager',
          senderRole: `Partnership Manager, ${sponsorName}`,
          preview: `Thank you for reaching out. We would be interested...`,
          body: `${traits.greeting},\n\nThank you for reaching out to ${sponsorName}.\n\nWe have reviewed your team's profile and would be interested in exploring a potential partnership. We will follow up shortly with a formal proposal.\n\n${traits.closing},\nPartnership Manager\n${sponsorName}`
        }
      } else if (response === 'soft_decline') {
        return {
          subject: `RE: Partnership Inquiry - ${sponsorName}`,
          sender: 'Partnership Manager',
          senderRole: `Partnership Manager, ${sponsorName}`,
          preview: `Thank you for your interest. At this time...`,
          body: `${traits.greeting},\n\nThank you for your interest in partnering with ${sponsorName}.\n\nWhile we are impressed by your team's progress, the timing isn't quite right for us at the moment. We encourage you to reach out again in the future as circumstances change.\n\nWe wish ${teamName} continued success.\n\n${traits.closing},\nPartnership Manager\n${sponsorName}`
        }
      } else {
        return {
          subject: `RE: Partnership Inquiry - ${sponsorName}`,
          sender: 'Partnership Manager',
          senderRole: `Partnership Manager, ${sponsorName}`,
          preview: `Thank you for your interest. Unfortunately...`,
          body: `${traits.greeting},\n\nThank you for your interest in partnering with ${sponsorName}.\n\nAfter careful consideration, we have decided not to proceed with a partnership at this time.\n\nWe appreciate your understanding.\n\n${traits.closing},\nPartnership Manager\n${sponsorName}`
        }
      }
    
    default:
      return {
        subject: `Partnership Communication - ${sponsorName}`,
        sender: 'Partnership Team',
        senderRole: `Partnerships, ${sponsorName}`,
        preview: `A message regarding our partnership discussions...`,
        body: `${traits.greeting},\n\nThank you for your continued interest in working with ${sponsorName}.\n\nWe will be in touch with more details soon.\n\n${traits.closing},\nPartnership Team\n${sponsorName}`
      }
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Build context for email generation from negotiation state
 */
export function buildEmailContext(
  negotiation: SponsorNegotiation,
  team: OwnedTeam,
  currentWeek: number,
  currentYear: number
): NegotiationEmailContext {
  return {
    teamName: team.name,
    teamReputation: team.reputation,
    teamBaseCountry: team.baseCountry,
    sponsorName: negotiation.sponsorName,
    sponsorCategory: negotiation.sponsorCategory,
    sponsorTier: negotiation.sponsorTier,
    personality: negotiation.personality,
    currentWeek,
    currentYear
  }
}

/**
 * Build outreach context from sponsor and team
 */
export function buildOutreachContext(
  sponsor: Sponsor,
  team: OwnedTeam,
  estimatedValue: number,
  compatibilityScore: number,
  currentWeek: number,
  currentYear: number
): OutreachEmailContext {
  return {
    teamName: team.name,
    teamReputation: team.reputation,
    teamBaseCountry: team.baseCountry,
    sponsorName: sponsor.name,
    sponsorCategory: sponsor.category,
    sponsorTier: sponsor.tier,
    personality: 'formal', // Default for outreach
    estimatedDealValue: estimatedValue,
    compatibilityScore,
    currentWeek,
    currentYear
  }
}
