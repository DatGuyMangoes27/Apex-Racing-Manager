/**
 * Dialogue AI Service
 * 
 * Uses Gemini Flash to dynamically generate dialogue choices and NPC responses
 * for the messaging/social simulation system.
 * Falls back to templates if AI is unavailable.
 */

import type {
  MessageChoice,
  MessageTone,
  MessageChoiceCategory,
  NpcResponse,
  SocialBio
} from '@/data/messaging-config';

export interface DialogueGenerationContext {
  // Contact info
  contactName: string
  contactType: 'partner' | 'family' | 'friend' | 'business' | 'rival' | 'potential_date'
  traits: string[]
  bio?: SocialBio
  
  // Relationship state
  relationshipStatus?: string
  relationshipLevel: number
  affectionMeter: number
  romanceMeter: number
  trustMeter: number
  
  // Current mood
  currentMood: string
  moodEnergy: string
  
  // Conversation history
  lastMessageFromThem?: string
  daysSinceLastContact: number
  
  // Recent events
  recentEvents: Array<{
    event: string
    weeksAgo: number
    wasPositive: boolean
  }>
  
  // Player context
  playerName: string
  playerRecentRaceResult?: string
  playerCurrentStress: number
}

export interface MessageChoiceGeneration {
  choices: GeneratedChoice[]
}

export interface GeneratedChoice {
  category: string
  preview: string
  fullMessage: string
  tone: string
  riskLevel: 'safe' | 'mild' | 'risky' | 'bold'
  expectedReaction: string
}

export interface NpcResponseGeneration {
  message: string
  tone: string
  mood: string
  affectionChange: number
  romanceChange: number
  trustChange: number
  emotionalReaction: string
  suggestedFollowUp?: string
  wantsToMeetUp: boolean
}

// ============================================
// GEMINI API INTEGRATION
// ============================================

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'

/**
 * Get the stored Gemini API key
 */
function getApiKey(): string | null {
  try {
    const settings = localStorage.getItem('app-settings')
    if (settings) {
      const parsed = JSON.parse(settings)
      return parsed.geminiApiKey || null
    }
  } catch (e) {
    console.warn('[DialogueAI] Error reading API key from localStorage')
  }
  return null
}

/**
 * Check if AI dialogue generation is available
 */
export function isDialogueAIAvailable(): boolean {
  return !!getApiKey()
}

/**
 * Safely parse JSON from API response
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
  maxTokens: number = 1000
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
        temperature: 0.8 // Slightly creative for dialogue
      })
    })

    if (!response.ok) {
      console.warn('[DialogueAI] API error:', response.status)
      return null
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || null
  } catch (error) {
    console.warn('[DialogueAI] API call failed:', error)
    return null
  }
}

// ============================================
// PERSONALITY PROMPTS
// ============================================

const PERSONALITY_PROMPTS: Record<string, string> = {
  supportive: "They are warm, encouraging, and always interested in your racing career. They celebrate your wins genuinely and comfort you after losses.",
  jealous: "They can be insecure and need reassurance. They notice when you mention other people and can get upset easily.",
  ambitious: "They have their own career goals and respect drive in others. They appreciate being treated as equals and don't like being patronized.",
  romantic: "They love grand gestures, meaningful dates, and expressions of affection. They notice the little things and appreciate romance.",
  independent: "They value their own space and don't need constant attention, but appreciate quality time when together.",
  practical: "They are down-to-earth and sensible. They appreciate genuine effort over expensive gestures.",
  glamorous: "They enjoy the finer things in life and social events. They like being seen and appreciated.",
  private: "They prefer staying out of the spotlight and value quiet, intimate moments over public displays.",
  adventurous: "They love trying new things and spontaneous plans. They get bored with routine easily.",
  nurturing: "They are caring and attentive. They worry about your wellbeing and want to take care of you."
}

function getPersonalityPrompt(traits: string[]): string {
  return traits
    .map(t => PERSONALITY_PROMPTS[t] || '')
    .filter(Boolean)
    .join(' ')
}

// ============================================
// MESSAGE CHOICE GENERATION
// ============================================

const MESSAGE_CHOICE_SYSTEM_PROMPT = `You are a dialogue writer for a racing career simulation game. 
Generate realistic text message options that a racing team owner might send.

IMPORTANT RULES:
1. Generate exactly 4-5 message choices
2. Each choice should have a different tone/approach
3. Include at least one "safe" option and one "bold" option
4. Messages should feel natural, not robotic
5. Consider the relationship level - don't be too forward if relationship is low
6. Reference recent events when relevant
7. Keep messages concise (1-3 sentences)

Respond with ONLY valid JSON in this exact format:
{
  "choices": [
    {
      "category": "greeting|compliment|flirt|check_in|support|apology|invitation|share_news|make_plans",
      "preview": "Short preview (5-10 words)",
      "fullMessage": "The actual message to send",
      "tone": "friendly|flirty|romantic|supportive|apologetic|casual|excited|playful",
      "riskLevel": "safe|mild|risky|bold",
      "expectedReaction": "Brief description of likely response"
    }
  ]
}`

export async function generateMessageChoices(
  context: DialogueGenerationContext
): Promise<MessageChoice[]> {
  const personalityDesc = getPersonalityPrompt(context.traits)
  
  // Build bio context section if available
  const bioSection = context.bio ? `
THEIR BACKGROUND:
${context.bio.background}

THEIR CAREER:
${context.bio.careerNarrative}

PERSONALITY:
${context.bio.personalityDescription}

CURRENT LIFE:
${context.bio.lifeSituation}

FUN FACTS ABOUT THEM:
${context.bio.anecdotes.map(a => `- ${a}`).join('\n')}
` : ''
  
  const userPrompt = `Generate message options for texting ${context.contactName}.

RELATIONSHIP:
- Type: ${context.contactType}
- Status: ${context.relationshipStatus || 'friends'}
- Relationship Level: ${context.relationshipLevel}/100
- Affection: ${context.affectionMeter}/100
- Trust: ${context.trustMeter}/100
- Days since last contact: ${context.daysSinceLastContact}

THEIR PERSONALITY TRAITS:
${personalityDesc || 'No specific traits known.'}
${bioSection}
THEIR CURRENT STATE:
- Mood: ${context.currentMood} (${context.moodEnergy} energy)
${context.lastMessageFromThem ? `- Their last message: "${context.lastMessageFromThem}"` : '- Starting a new conversation'}

YOUR CONTEXT:
- You are: ${context.playerName}, a racing team owner
${context.playerRecentRaceResult ? `- Recent race result: ${context.playerRecentRaceResult}` : ''}
- Current stress level: ${context.playerCurrentStress}/100

RECENT EVENTS:
${context.recentEvents.length > 0 
  ? context.recentEvents.map(e => `- ${e.event} (${e.weeksAgo} weeks ago, ${e.wasPositive ? 'positive' : 'negative'})`).join('\n')
  : '- No notable recent events'}

Generate 4-5 appropriate message options. Reference their background, career, or interests when relevant to make messages feel personal.`

  const response = await callGeminiAPI(MESSAGE_CHOICE_SYSTEM_PROMPT, userPrompt)
  
  if (response) {
    try {
      const parsed = safeParseJSON(response) as MessageChoiceGeneration
      return parsed.choices.map((c, i) => ({
        id: `choice_${Date.now()}_${i}`,
        category: c.category as MessageChoiceCategory,
        preview: c.preview,
        fullMessage: c.fullMessage,
        tone: c.tone as MessageTone,
        riskLevel: c.riskLevel,
        couldBackfire: c.riskLevel === 'risky' || c.riskLevel === 'bold',
        expectedEffects: {},
        likelyResponses: [c.expectedReaction]
      }))
    } catch (e) {
      console.warn('[DialogueAI] Failed to parse message choices:', e)
    }
  }
  
  // Fallback to templates
  return generateFallbackChoices(context)
}

// ============================================
// NPC RESPONSE GENERATION
// ============================================

const NPC_RESPONSE_SYSTEM_PROMPT = `You are simulating how a person responds to a text message in a racing career game.
Generate a realistic response based on their personality and the message received.

IMPORTANT RULES:
1. Stay in character based on their traits
2. Consider their current mood and relationship level
3. The response should feel natural and human
4. Include appropriate emotional reactions
5. Meter changes should be small (-5 to +5 typically)
6. Only suggest meeting up if it makes sense contextually

Respond with ONLY valid JSON in this exact format:
{
  "message": "Their response message",
  "tone": "friendly|cold|warm|flirty|upset|excited|neutral",
  "mood": "happy|neutral|sad|angry|excited|worried|romantic",
  "affectionChange": 0,
  "romanceChange": 0,
  "trustChange": 0,
  "emotionalReaction": "delighted|happy|pleased|neutral|disappointed|upset|angry",
  "suggestedFollowUp": "Optional hint for player's next message",
  "wantsToMeetUp": false
}`

export async function generateNpcResponse(
  context: DialogueGenerationContext,
  playerMessage: string,
  messageCategory: string
): Promise<NpcResponse> {
  const personalityDesc = getPersonalityPrompt(context.traits)
  
  // Build bio context section if available
  const bioSection = context.bio ? `
THEIR BACKGROUND:
${context.bio.background}

THEIR CAREER:
${context.bio.careerNarrative}

DETAILED PERSONALITY:
${context.bio.personalityDescription}

CURRENT LIFE:
${context.bio.lifeSituation}
` : ''
  
  const userPrompt = `Generate ${context.contactName}'s response to this message.

THEIR PERSONALITY TRAITS:
${personalityDesc || 'No specific traits known.'}
${bioSection}
RELATIONSHIP:
- Type: ${context.contactType}
- Status: ${context.relationshipStatus || 'friends'}
- Relationship Level: ${context.relationshipLevel}/100
- Affection: ${context.affectionMeter}/100
- Romance: ${context.romanceMeter}/100
- Trust: ${context.trustMeter}/100

THEIR CURRENT STATE:
- Mood: ${context.currentMood} (${context.moodEnergy} energy)
- Days since you last talked: ${context.daysSinceLastContact}

THE MESSAGE THEY RECEIVED:
"${playerMessage}"
(Message type: ${messageCategory})

CONTEXT:
${context.recentEvents.length > 0 
  ? context.recentEvents.map(e => `- ${e.event} (${e.weeksAgo} weeks ago)`).join('\n')
  : '- No notable recent events'}

How does ${context.contactName} respond? Their response should reflect their unique background and personality. They might reference their career, interests, or life experiences naturally in conversation.`

  const response = await callGeminiAPI(NPC_RESPONSE_SYSTEM_PROMPT, userPrompt)
  
  if (response) {
    try {
      const parsed = safeParseJSON(response) as NpcResponseGeneration
      return {
        message: parsed.message,
        tone: parsed.tone as MessageTone,
        mood: parsed.mood,
        affectionChange: Math.max(-10, Math.min(10, parsed.affectionChange)),
        romanceChange: Math.max(-10, Math.min(10, parsed.romanceChange)),
        trustChange: Math.max(-10, Math.min(10, parsed.trustChange)),
        emotionalReaction: parsed.emotionalReaction as NpcResponse['emotionalReaction'],
        suggestedFollowUp: parsed.suggestedFollowUp,
        wantsToMeetUp: parsed.wantsToMeetUp
      }
    } catch (e) {
      console.warn('[DialogueAI] Failed to parse NPC response:', e)
    }
  }
  
  // Fallback
  return generateFallbackResponse(context, playerMessage, messageCategory)
}

// ============================================
// GIFT REACTION GENERATION
// ============================================

export interface GiftReactionContext {
  contactName: string
  traits: string[]
  relationshipLevel: number
  giftName: string
  giftValue: number
  occasion?: string
  theirPreferences?: string[]
}

export interface GiftReaction {
  message: string
  reaction: 'loved' | 'liked' | 'neutral' | 'disappointed'
  affectionChange: number
  trustChange: number
}

const GIFT_REACTION_SYSTEM_PROMPT = `You are simulating how someone reacts to receiving a gift.
Consider their personality, the gift, and the occasion.

Respond with ONLY valid JSON:
{
  "message": "Their reaction message",
  "reaction": "loved|liked|neutral|disappointed",
  "affectionChange": 0,
  "trustChange": 0
}`

export async function generateGiftReaction(
  context: GiftReactionContext
): Promise<GiftReaction> {
  const personalityDesc = getPersonalityPrompt(context.traits)
  
  const userPrompt = `How does ${context.contactName} react to receiving this gift?

THEIR PERSONALITY:
${personalityDesc}

GIFT DETAILS:
- Gift: ${context.giftName}
- Value: $${context.giftValue.toLocaleString()}
${context.occasion ? `- Occasion: ${context.occasion}` : '- No special occasion'}

RELATIONSHIP LEVEL: ${context.relationshipLevel}/100
${context.theirPreferences ? `\nTHEIR KNOWN PREFERENCES: ${context.theirPreferences.join(', ')}` : ''}`

  const response = await callGeminiAPI(GIFT_REACTION_SYSTEM_PROMPT, userPrompt, 500)
  
  if (response) {
    try {
      const parsed = safeParseJSON(response)
      return {
        message: parsed.message,
        reaction: parsed.reaction,
        affectionChange: Math.max(-5, Math.min(15, parsed.affectionChange)),
        trustChange: Math.max(-5, Math.min(10, parsed.trustChange))
      }
    } catch (e) {
      console.warn('[DialogueAI] Failed to parse gift reaction:', e)
    }
  }
  
  // Fallback
  return {
    message: `Thank you for the ${context.giftName}! That's so thoughtful.`,
    reaction: 'liked',
    affectionChange: 3,
    trustChange: 1
  }
}

// ============================================
// DATE MOMENT GENERATION
// ============================================

export interface DateMomentContext {
  contactName: string
  traits: string[]
  relationshipLevel: number
  dateType: string
  location: string
  momentInDate: 'arrival' | 'during' | 'end'
}

export interface DateMoment {
  description: string
  playerOptions: {
    choice: string
    outcome: string
    affectionChange: number
  }[]
}

const DATE_MOMENT_SYSTEM_PROMPT = `You are generating a romantic moment during a date for a game.
Create an interesting situation with 3 player choice options.

Respond with ONLY valid JSON:
{
  "description": "What's happening in this moment",
  "playerOptions": [
    {
      "choice": "What player can say/do",
      "outcome": "What happens",
      "affectionChange": 0
    }
  ]
}`

export async function generateDateMoment(
  context: DateMomentContext
): Promise<DateMoment> {
  const personalityDesc = getPersonalityPrompt(context.traits)
  
  const userPrompt = `Generate a ${context.momentInDate} moment during a ${context.dateType} with ${context.contactName}.

THEIR PERSONALITY:
${personalityDesc}

DATE DETAILS:
- Type: ${context.dateType}
- Location: ${context.location}
- Relationship Level: ${context.relationshipLevel}/100
- Moment: ${context.momentInDate === 'arrival' ? 'Just arrived' : context.momentInDate === 'during' ? 'Middle of date' : 'End of date'}

Generate an interesting moment with 3 player choices.`

  const response = await callGeminiAPI(DATE_MOMENT_SYSTEM_PROMPT, userPrompt, 800)
  
  if (response) {
    try {
      return safeParseJSON(response)
    } catch (e) {
      console.warn('[DialogueAI] Failed to parse date moment:', e)
    }
  }
  
  // Fallback
  return {
    description: `You're enjoying a nice ${context.dateType} with ${context.contactName}.`,
    playerOptions: [
      { choice: 'Compliment them', outcome: 'They smile warmly', affectionChange: 2 },
      { choice: 'Share a funny story', outcome: 'They laugh', affectionChange: 1 },
      { choice: 'Ask about their day', outcome: 'They appreciate your interest', affectionChange: 1 }
    ]
  }
}

// ============================================
// SOCIAL MEDIA COMMENT GENERATION
// ============================================

export interface SocialCommentContext {
  postTopic: string
  postTone: string
  followerCount: number
  controversyLevel: number
  trollDensity: number
}

export interface GeneratedComments {
  positive: { username: string; content: string }[]
  negative: { username: string; content: string }[]
  neutral: { username: string; content: string }[]
}

const SOCIAL_COMMENTS_SYSTEM_PROMPT = `Generate realistic social media comments for a racing team owner's post.
Include a mix of supportive fans, critics, and trolls based on the context.

Respond with ONLY valid JSON:
{
  "positive": [{"username": "@fan123", "content": "comment"}],
  "negative": [{"username": "@hater99", "content": "comment"}],
  "neutral": [{"username": "@user", "content": "comment"}]
}`

export async function generateSocialComments(
  context: SocialCommentContext
): Promise<GeneratedComments> {
  const userPrompt = `Generate comments for a social media post.

POST DETAILS:
- Topic: ${context.postTopic}
- Tone: ${context.postTone}
- Follower count: ${context.followerCount.toLocaleString()}
- Controversy level: ${context.controversyLevel}/100
- Troll density: ${context.trollDensity}/100

Generate 3 positive, 2 negative, and 2 neutral comments.`

  const response = await callGeminiAPI(SOCIAL_COMMENTS_SYSTEM_PROMPT, userPrompt, 600)
  
  if (response) {
    try {
      return safeParseJSON(response)
    } catch (e) {
      console.warn('[DialogueAI] Failed to parse social comments:', e)
    }
  }
  
  // Fallback
  return {
    positive: [
      { username: '@racingfan2024', content: 'Great post! Keep up the good work!' },
      { username: '@speedster99', content: 'Legend! 🔥' }
    ],
    negative: [
      { username: '@critic123', content: 'Overrated...' }
    ],
    neutral: [
      { username: '@observer', content: 'Interesting' }
    ]
  }
}

// ============================================
// SOCIAL CHARACTER BIO GENERATION
// ============================================

export interface SocialBioContext {
  name: string
  age: number
  gender?: 'male' | 'female'
  occupation?: string
  nationality?: string
  traits: string[]
  interests?: string[]
  metAt?: string
  contactType: 'partner' | 'family' | 'friend' | 'business' | 'rival' | 'potential_date'
  // Partner-specific
  origin?: string          // PartnerOrigin for partners
  career?: string          // PartnerCareer for partners
}

const SOCIAL_BIO_SYSTEM_PROMPT = `You are a character writer for a racing career simulation game.
Generate a rich, believable backstory and personality profile for an NPC that the player meets socially.

IMPORTANT RULES:
1. Write in third person ("She is...", "He grew up...")
2. Make the background feel grounded and realistic, not fantastical
3. The character lives in the world of motorsport glamour, high society, and jet-setting
4. Anecdotes should be specific, memorable, and help the player connect with the character
5. Keep all text concise - this is for a game UI, not a novel
6. The personality description should naturally weave in their traits
7. The life situation should feel current and dynamic

Respond with ONLY valid JSON in this exact format:
{
  "background": "2-3 sentences about where they grew up, family background, and what shaped them",
  "careerNarrative": "1-2 sentences about their professional journey and current work life",
  "anecdotes": ["fun fact 1", "fun fact 2", "fun fact 3"],
  "personalityDescription": "A paragraph (3-4 sentences) that describes how they come across in person, weaving in their personality traits naturally",
  "lifeSituation": "1 sentence about their current life context or recent change"
}`

/**
 * Generate a rich bio for a social character using AI
 * Falls back to template-based generation if AI is unavailable
 */
export async function generateSocialBio(
  context: SocialBioContext
): Promise<SocialBio> {
  const personalityDesc = getPersonalityPrompt(context.traits)
  
  const userPrompt = `Generate a character profile for ${context.name}.

CHARACTER DETAILS:
- Name: ${context.name}
- Age: ${context.age}
- Gender: ${context.gender || 'unknown'}
- Occupation: ${context.occupation || 'unknown'}
- Nationality: ${context.nationality || 'unknown'}
- Contact Type: ${context.contactType}
${context.origin ? `- How they met the player: ${context.origin.replace(/_/g, ' ')}` : ''}
${context.career ? `- Career field: ${context.career.replace(/_/g, ' ')}` : ''}

PERSONALITY TRAITS: ${context.traits.join(', ')}
${personalityDesc ? `\nTRAIT DESCRIPTIONS:\n${personalityDesc}` : ''}

${context.interests && context.interests.length > 0 ? `INTERESTS: ${context.interests.join(', ')}` : ''}

WORLD CONTEXT:
This person exists in the world of Formula racing. The player is a racing team owner who is wealthy and famous. Generate a backstory appropriate for someone a racing team owner would meet ${context.metAt ? `at a ${context.metAt}` : 'socially'}.

Generate a compelling, realistic character profile.`

  const response = await callGeminiAPI(SOCIAL_BIO_SYSTEM_PROMPT, userPrompt, 800)
  
  if (response) {
    try {
      const parsed = safeParseJSON(response)
      return {
        background: parsed.background || '',
        careerNarrative: parsed.careerNarrative || '',
        anecdotes: Array.isArray(parsed.anecdotes) ? parsed.anecdotes.slice(0, 3) : [],
        personalityDescription: parsed.personalityDescription || '',
        lifeSituation: parsed.lifeSituation || ''
      }
    } catch (e) {
      console.warn('[DialogueAI] Failed to parse social bio:', e)
    }
  }
  
  // Fallback to template-based generation
  return generateFallbackSocialBio(context)
}

/**
 * Generate a batch of social bios efficiently (for migration)
 * Sends multiple characters in one API call to reduce requests
 */
export async function generateSocialBioBatch(
  contexts: SocialBioContext[]
): Promise<Map<string, SocialBio>> {
  const results = new Map<string, SocialBio>()
  
  if (contexts.length === 0) return results
  
  // Limit batch size to 5 to keep prompt manageable
  const batchSize = Math.min(5, contexts.length)
  const batch = contexts.slice(0, batchSize)
  
  const characterSummaries = batch.map((ctx, i) => 
    `CHARACTER ${i + 1} (${ctx.name}):
- Age: ${ctx.age}, Gender: ${ctx.gender || 'unknown'}
- Occupation: ${ctx.occupation || 'unknown'}, Nationality: ${ctx.nationality || 'unknown'}
- Traits: ${ctx.traits.join(', ')}
${ctx.interests ? `- Interests: ${ctx.interests.join(', ')}` : ''}
- Contact Type: ${ctx.contactType}
${ctx.metAt ? `- Met at: ${ctx.metAt}` : ''}`
  ).join('\n\n')

  const batchSystemPrompt = `You are a character writer for a racing career simulation game.
Generate rich, believable backstories for multiple NPCs. The player is a racing team owner.

Respond with ONLY valid JSON as an array:
[
  {
    "name": "Character Name",
    "background": "2-3 sentences",
    "careerNarrative": "1-2 sentences",
    "anecdotes": ["fact 1", "fact 2", "fact 3"],
    "personalityDescription": "3-4 sentence paragraph",
    "lifeSituation": "1 sentence"
  }
]`

  const userPrompt = `Generate character profiles for these ${batch.length} characters:\n\n${characterSummaries}`

  const response = await callGeminiAPI(batchSystemPrompt, userPrompt, 1500)
  
  if (response) {
    try {
      const parsed = safeParseJSON(response)
      const bios = Array.isArray(parsed) ? parsed : [parsed]
      
      bios.forEach((bio: any, i: number) => {
        if (i < batch.length) {
          results.set(batch[i].name, {
            background: bio.background || '',
            careerNarrative: bio.careerNarrative || '',
            anecdotes: Array.isArray(bio.anecdotes) ? bio.anecdotes.slice(0, 3) : [],
            personalityDescription: bio.personalityDescription || '',
            lifeSituation: bio.lifeSituation || ''
          })
        }
      })
    } catch (e) {
      console.warn('[DialogueAI] Failed to parse bio batch:', e)
    }
  }
  
  // Fill in any missing with fallbacks
  for (const ctx of batch) {
    if (!results.has(ctx.name)) {
      results.set(ctx.name, generateFallbackSocialBio(ctx))
    }
  }
  
  // Handle remaining characters beyond the batch with individual fallbacks
  for (let i = batchSize; i < contexts.length; i++) {
    results.set(contexts[i].name, generateFallbackSocialBio(contexts[i]))
  }
  
  return results
}

// ============================================
// TEMPLATE-BASED BIO FALLBACK
// ============================================

const BACKGROUND_TEMPLATES = {
  origins: [
    'grew up in a close-knit family in {city}',
    'was raised in the bustling heart of {city}',
    'spent their formative years in {city}, surrounded by {influence}',
    'comes from a well-connected family in {city}',
    'had a cosmopolitan upbringing, splitting time between {city} and the countryside'
  ],
  influences: [
    'art and culture', 'business and entrepreneurship', 'academia and science',
    'sports and competition', 'music and creativity', 'travel and adventure'
  ],
  cities: {
    // Core nationalities (keep legacy + full nationality key)
    'American': ['New York', 'Los Angeles', 'Miami', 'San Francisco', 'Chicago'],
    'British': ['London', 'Manchester', 'Edinburgh', 'Oxford', 'Brighton'],
    'French': ['Paris', 'Nice', 'Lyon', 'Marseille', 'Bordeaux'],
    'Italian': ['Milan', 'Rome', 'Florence', 'Turin', 'Naples'],
    'German': ['Munich', 'Berlin', 'Hamburg', 'Frankfurt', 'Stuttgart'],
    'Spanish': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Marbella'],
    'Australian': ['Sydney', 'Melbourne', 'Gold Coast', 'Perth', 'Brisbane'],
    'Brazilian': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Curitiba'],
    'Japanese': ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya'],
    // Duplicate full-country keys for legacy compat
    'United Kingdom': ['London', 'Manchester', 'Edinburgh', 'Oxford', 'Brighton'],
    'United States': ['New York', 'Los Angeles', 'Miami', 'San Francisco', 'Chicago'],
    'Monaco': ['Monte Carlo', 'Monaco-Ville', 'La Condamine', 'Fontvieille'],
    'Switzerland': ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne'],
    'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'],
    // New expanded nationalities
    'Dutch': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'],
    'Finnish': ['Helsinki', 'Tampere', 'Turku', 'Espoo'],
    'Austrian': ['Vienna', 'Salzburg', 'Graz', 'Innsbruck'],
    'Belgian': ['Brussels', 'Antwerp', 'Ghent', 'Bruges'],
    'Swiss': ['Zurich', 'Geneva', 'Basel', 'Lausanne'],
    'Danish': ['Copenhagen', 'Aarhus', 'Odense'],
    'Swedish': ['Stockholm', 'Gothenburg', 'Malmö'],
    'Norwegian': ['Oslo', 'Bergen', 'Stavanger', 'Tromsø'],
    'Polish': ['Warsaw', 'Krakow', 'Gdansk', 'Wroclaw'],
    'Czech': ['Prague', 'Brno', 'Ostrava'],
    'Hungarian': ['Budapest', 'Debrecen', 'Szeged'],
    'Portuguese': ['Lisbon', 'Porto', 'Faro', 'Cascais'],
    'Greek': ['Athens', 'Thessaloniki', 'Mykonos', 'Santorini'],
    'Irish': ['Dublin', 'Cork', 'Galway', 'Limerick'],
    'Romanian': ['Bucharest', 'Cluj-Napoca', 'Timisoara'],
    'Croatian': ['Zagreb', 'Split', 'Dubrovnik'],
    'Serbian': ['Belgrade', 'Novi Sad', 'Nis'],
    'Ukrainian': ['Kyiv', 'Lviv', 'Odesa', 'Kharkiv'],
    'Turkish': ['Istanbul', 'Ankara', 'Izmir', 'Antalya'],
    'Russian': ['Moscow', 'Saint Petersburg', 'Sochi', 'Kazan'],
    'Monegasque': ['Monte Carlo', 'Monaco-Ville', 'La Condamine'],
    'Luxembourgish': ['Luxembourg City', 'Esch-sur-Alzette'],
    // Americas
    'Argentine': ['Buenos Aires', 'Mendoza', 'Córdoba', 'Rosario'],
    'Mexican': ['Mexico City', 'Monterrey', 'Guadalajara', 'Cancún'],
    'Canadian': ['Toronto', 'Montreal', 'Vancouver', 'Calgary'],
    'Colombian': ['Bogotá', 'Medellín', 'Cartagena', 'Cali'],
    'Chilean': ['Santiago', 'Valparaíso', 'Viña del Mar'],
    'Venezuelan': ['Caracas', 'Maracaibo', 'Valencia'],
    'Peruvian': ['Lima', 'Cusco', 'Arequipa'],
    'Uruguayan': ['Montevideo', 'Punta del Este'],
    // Asia & Pacific
    'Chinese': ['Shanghai', 'Beijing', 'Shenzhen', 'Hong Kong', 'Guangzhou'],
    'South Korean': ['Seoul', 'Busan', 'Incheon', 'Jeju'],
    'Indian': ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'],
    'Thai': ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya'],
    'Indonesian': ['Jakarta', 'Bali', 'Surabaya', 'Yogyakarta'],
    'Filipino': ['Manila', 'Cebu', 'Davao'],
    'New Zealander': ['Auckland', 'Wellington', 'Queenstown', 'Christchurch'],
    'Singaporean': ['Singapore'],
    'Malaysian': ['Kuala Lumpur', 'Penang', 'Johor Bahru'],
    'Vietnamese': ['Ho Chi Minh City', 'Hanoi', 'Da Nang'],
    'Taiwanese': ['Taipei', 'Kaohsiung', 'Taichung'],
    // Africa & Middle East
    'South African': ['Cape Town', 'Johannesburg', 'Durban', 'Pretoria'],
    'Nigerian': ['Lagos', 'Abuja', 'Port Harcourt'],
    'Kenyan': ['Nairobi', 'Mombasa', 'Nakuru'],
    'Moroccan': ['Casablanca', 'Marrakech', 'Rabat', 'Tangier'],
    'Egyptian': ['Cairo', 'Alexandria', 'Giza', 'Luxor'],
    'Emirati': ['Dubai', 'Abu Dhabi', 'Sharjah'],
    'Saudi': ['Riyadh', 'Jeddah', 'Dammam'],
    'Israeli': ['Tel Aviv', 'Jerusalem', 'Haifa'],
    'Lebanese': ['Beirut', 'Byblos', 'Tripoli'],
    'Qatari': ['Doha', 'Al Wakrah', 'Lusail'],
    'Bahraini': ['Manama', 'Muharraq', 'Riffa'],
    'Ghanaian': ['Accra', 'Kumasi', 'Tamale']
  } as Record<string, string[]>
}

const CAREER_NARRATIVES: Record<string, string[]> = {
  'Marketing Executive': [
    'Built a reputation in luxury brand marketing before pivoting to the automotive world.',
    'Climbed the ranks at a top agency and now leads campaigns for premium lifestyle brands.'
  ],
  'Doctor': [
    'Completed residency at a prestigious teaching hospital and now practices in private medicine.',
    'Specializes in sports medicine, which naturally draws them into the racing world.'
  ],
  'Lawyer': [
    'Works at a top-tier firm handling high-profile corporate cases and celebrity clients.',
    'Specializes in international commercial law, often dealing with motorsport contracts.'
  ],
  'Architect': [
    'Designs luxury residences and commercial spaces for high-net-worth clients.',
    'Known for blending modern aesthetics with sustainable design principles.'
  ],
  'Investment Banker': [
    'Manages portfolios for ultra-high-net-worth individuals in the sports and entertainment sector.',
    'Made a name in M&A deals involving luxury automotive brands.'
  ],
  'Fashion Designer': [
    'Launched their own label after years working at major fashion houses in Milan and Paris.',
    'Their collections often draw inspiration from motorsport aesthetics and engineering.'
  ],
  'Tech Entrepreneur': [
    'Founded a successful startup and now scouts for the next big thing in automotive tech.',
    'Built and sold a tech company, now angel investing in racing-adjacent ventures.'
  ],
  'Journalist': [
    'Covers the intersection of luxury, sport, and celebrity for a major international publication.',
    'Started in local news and worked their way up to covering the motorsport beat globally.'
  ],
  'Actress': [
    'Has appeared in several critically acclaimed films and is a fixture on the festival circuit.',
    'Rose to fame through a breakout role and now balances acting with producing.'
  ],
  'Model': [
    'Has graced the covers of major fashion magazines and walked for top designers.',
    'Transitioned from modeling into brand ambassadorship and lifestyle curation.'
  ],
  'Pilot': [
    'Flies private jets for executives and celebrities, with a passion for aviation history.',
    'Trained in the military before transitioning to civilian aviation in the luxury sector.'
  ],
  'Event Planner': [
    'Orchestrates exclusive galas and private parties for the elite motorsport community.',
    'Known for creating unforgettable experiences at Grand Prix weekends.'
  ],
  'Real Estate Developer': [
    'Develops luxury properties in Monaco, Dubai, and other jet-set destinations.',
    'Has a keen eye for locations where the racing elite want to live.'
  ],
  'Art Gallery Owner': [
    'Curates exhibitions that attract collectors from the motorsport and luxury worlds.',
    'Turned a passion for contemporary art into a thriving gallery business.'
  ],
  'Restaurant Owner': [
    'Runs acclaimed restaurants in cities that host Grand Prix events.',
    'Their flagship restaurant is a favorite post-race destination for drivers and team owners.'
  ],
  'Music Producer': [
    'Has produced chart-topping albums and is a regular at exclusive after-parties.',
    'Blends their love of electronic music with the high-energy world of motorsport.'
  ],
  'Fitness Trainer': [
    'Trains elite athletes and celebrities, specializing in performance and recovery.',
    'Built a fitness empire catering to high-profile clients in the sports world.'
  ],
  'Photographer': [
    'Captures moments at Grand Prix events and high-society gatherings for top publications.',
    'Known for intimate portrait work that reveals the person behind the public image.'
  ],
  'PR Manager': [
    'Manages crisis communications and image for high-profile personalities in motorsport.',
    'Has a reputation for turning bad press into career opportunities for their clients.'
  ],
  'Venture Capitalist': [
    'Invests in early-stage companies with a focus on automotive and clean energy.',
    'Has a portfolio that includes several racing-adjacent tech companies.'
  ],
  'Charity Director': [
    'Runs a major international charity focused on youth development through sport.',
    'Connects the wealthy motorsport community with causes that make a real difference.'
  ],
  'Social Media Influencer': [
    'Built a massive following documenting the glamorous side of the racing world.',
    'Parlayed social media fame into brand deals with luxury and automotive companies.'
  ],
  // NEW: Expanded occupation career narratives
  'Hedge Fund Manager': [
    'Runs a multi-billion fund focused on sports and entertainment assets.',
    'Made their fortune timing market shifts and now enjoys the spoils at racetracks worldwide.'
  ],
  'Private Equity Partner': [
    'Specializes in acquiring and growing luxury lifestyle brands.',
    'Led several high-profile buyouts in the automotive and hospitality sectors.'
  ],
  'Financial Advisor': [
    'Manages wealth for athletes and entertainers, understanding their unique financial needs.',
    'Built a boutique firm that caters exclusively to the motorsport community.'
  ],
  'Cryptocurrency Trader': [
    'Made an early fortune in crypto and now divides time between trading and the social circuit.',
    'Known in fintech circles for bold bets that usually pay off.'
  ],
  'Day Trader': [
    'Lives by the markets and thrives on the adrenaline of rapid-fire decisions.',
    'Treats trading like a sport, tracking performance metrics obsessively.'
  ],
  'Accountant': [
    'Handles complex financial structures for racing teams and luxury businesses.',
    'Known for being the discreet financial backbone behind several high-profile personalities.'
  ],
  'Insurance Broker': [
    'Specializes in insuring supercars, yachts, and high-value racing assets.',
    'Has an encyclopedic knowledge of risk that makes for surprisingly fascinating conversation.'
  ],
  'Management Consultant': [
    'Advises corporations on strategy, often traveling between global offices.',
    'Brings analytical rigor to every conversation, whether about business or weekend plans.'
  ],
  'CEO': [
    'Runs a company and is used to making decisions that affect hundreds of people.',
    'Built a company from scratch and now enjoys the lifestyle their success affords.'
  ],
  'CFO': [
    'Oversees finances for a major corporation, balancing budgets worth billions.',
    'Has a sharp analytical mind that extends to every aspect of life.'
  ],
  'Business Development Director': [
    'Opens new markets for their firm, traveling extensively across continents.',
    'Has a gift for spotting opportunities and building partnerships from scratch.'
  ],
  'Property Manager': [
    'Oversees luxury property portfolios in Monaco, London, and Dubai.',
    'Knows the real estate market inside and out, always scouting the next investment.'
  ],
  'Software Engineer': [
    'Builds cutting-edge applications and has a deep appreciation for precision engineering.',
    'Worked at top tech companies before going freelance to enjoy a more flexible lifestyle.'
  ],
  'AI Researcher': [
    'Pushes the boundaries of artificial intelligence at a leading research lab.',
    'Fascinated by the parallels between machine learning and racing strategy optimization.'
  ],
  'Robotics Engineer': [
    'Designs autonomous systems and sees motorsport as the ultimate proving ground.',
    'Their work bridges the gap between factory automation and cutting-edge racing tech.'
  ],
  'Data Scientist': [
    'Analyzes massive datasets to uncover patterns, a skill that translates well to race strategy.',
    'Built prediction models used by sports betting firms before moving into consultancy.'
  ],
  'Game Developer': [
    'Creates immersive gaming experiences and is a massive motorsport fan.',
    'Worked on a popular racing simulation and brings insider knowledge to conversations.'
  ],
  'Cybersecurity Expert': [
    'Protects high-value organizations from digital threats, maintaining a low but powerful profile.',
    'Has a quiet intensity that comes from years of working in high-stakes digital warfare.'
  ],
  'UX Designer': [
    'Designs intuitive digital experiences for luxury brands and tech startups.',
    'Has an eye for detail and aesthetics that extends to all aspects of life.'
  ],
  'CTO': [
    'Leads technology strategy for a fast-growing company, bridging vision and execution.',
    'Known for spotting tech trends early and translating them into business advantages.'
  ],
  'Product Manager': [
    'Ships products used by millions, balancing user needs with business goals.',
    'Has a methodical approach to problem-solving that serves them well socially too.'
  ],
  'Blockchain Developer': [
    'Builds decentralized applications and is deeply invested in the future of digital ownership.',
    'Attends crypto conferences and racing events with equal enthusiasm.'
  ],
  'Surgeon': [
    'Performs life-saving operations and carries the calm confidence of someone used to high-pressure decisions.',
    'Specializes in reconstructive surgery and has treated several racing accident survivors.'
  ],
  'Physiotherapist': [
    'Works with elite athletes to optimize performance and recovery.',
    'Has treated several racing drivers and understands the physical demands of the sport.'
  ],
  'Sports Psychologist': [
    'Helps athletes master the mental game, from pre-race nerves to post-season burnout.',
    'Brings a unique understanding of high-performance mindsets to every conversation.'
  ],
  'Dentist': [
    'Runs a high-end practice catering to celebrity and sports clientele.',
    'Has a perfectionist streak that extends far beyond dental work.'
  ],
  'Veterinarian': [
    'Cares for animals with the same dedication others bring to human medicine.',
    'Has a gentle, nurturing nature that makes everyone around them feel at ease.'
  ],
  'Pharmacist': [
    'Runs a successful pharmacy chain with locations near major sporting venues.',
    'Has deep knowledge of health and wellness that they happily share.'
  ],
  'Nutritionist': [
    'Advises elite athletes on optimal nutrition for peak performance.',
    'Helped several racing drivers fine-tune their diets for better race-day concentration.'
  ],
  'Dermatologist': [
    'Has a thriving practice and is known for their expertise in skincare for outdoor athletes.',
    'Combines medical precision with an aesthetic eye that shows in everything they do.'
  ],
  'Psychiatrist': [
    'Helps high-achievers navigate the psychological pressures of public life.',
    'Brings deep empathy and insight to conversations, making people feel truly heard.'
  ],
  'Neuroscientist': [
    'Studies the brain at a leading research institution, fascinated by human performance.',
    'Can explain the neuroscience behind split-second racing decisions with infectious enthusiasm.'
  ],
  'Marine Biologist': [
    'Studies ocean ecosystems and has traveled to some of the most remote places on Earth.',
    'Brings a perspective shaped by nature that contrasts beautifully with the glamorous racing world.'
  ],
  'Judge': [
    'Presides over complex cases and carries an air of authority softened by fairness.',
    'Has seen it all from the bench and brings wisdom and perspective to social settings.'
  ],
  'Diplomat': [
    'Navigates international relations with tact and grace honed over decades.',
    'Has lived in numerous countries and speaks several languages fluently.'
  ],
  'Ambassador': [
    'Represents their country abroad and moves through diplomatic circles with ease.',
    'Their social calendar rivals that of any celebrity, spanning state dinners to Grand Prix events.'
  ],
  'Patent Attorney': [
    'Protects cutting-edge innovations, including several motorsport technologies.',
    'Has a precise mind that appreciates both the legal and engineering sides of racing.'
  ],
  'Human Rights Lawyer': [
    'Fights for justice internationally and brings passion and principle to everything they do.',
    'Uses their racing connections to raise awareness for human rights causes.'
  ],
  'Policy Advisor': [
    'Shapes government policy on sport, transport, or energy - all areas that touch motorsport.',
    'Has insider knowledge of regulatory landscapes that makes for fascinating conversation.'
  ],
  'Tax Attorney': [
    'Helps high-net-worth individuals navigate complex international tax structures.',
    'Knows exactly how racing drivers and team owners structure their finances.'
  ],
  'Lobbyist': [
    'Influences policy decisions behind the scenes with charm and strategic thinking.',
    'Has connections in both government and industry that span the globe.'
  ],
  'Film Director': [
    'Has directed critically acclaimed films and brings a cinematic perspective to everything.',
    'Currently working on a documentary about the intersection of speed, danger, and human ambition.'
  ],
  'Screenwriter': [
    'Crafts compelling stories for screen and stage, always observing the world for material.',
    'Once pitched a racing drama that drew on real paddock stories (names changed, of course).'
  ],
  'Interior Designer': [
    'Creates stunning living spaces for the rich and famous across Europe.',
    'Has designed the homes of several racing personalities and team principals.'
  ],
  'Choreographer': [
    'Directs movement for stage and screen, bringing artistic vision to performance.',
    'Sees parallels between the precision of dance and the precision of racing.'
  ],
  'Author': [
    'Has published several bestselling novels and brings a storyteller\'s eye to every encounter.',
    'Currently researching a book set in the world of motorsport.'
  ],
  'Painter': [
    'Creates large-scale works that have been exhibited in galleries worldwide.',
    'Has done commissioned pieces for racing teams, capturing the energy of the sport.'
  ],
  'Sculptor': [
    'Works with metal and stone to create pieces that bridge art and engineering.',
    'Has created trophy designs for several prestigious racing events.'
  ],
  'Animator': [
    'Brings characters and worlds to life through animation at a major studio.',
    'Has a playful, creative energy that makes them fun to be around.'
  ],
  'Graphic Designer': [
    'Creates visual identities for brands, including several in the motorsport space.',
    'Has an eye for color, composition, and detail that extends to all aspects of life.'
  ],
  'DJ': [
    'Plays sets at exclusive clubs and Grand Prix afterparties around the world.',
    'Has a unique ability to read a room and create the perfect atmosphere.'
  ],
  'Musician': [
    'Performs and records music that blends genres in unexpected ways.',
    'Has played at several racing events and charity concerts in the paddock.'
  ],
  'Art Curator': [
    'Manages exhibitions at a prestigious gallery, connecting artists with collectors.',
    'Has an encyclopedic knowledge of art history and a sharp eye for emerging talent.'
  ],
  'Documentary Filmmaker': [
    'Creates compelling documentaries about human achievement and extreme sports.',
    'Currently filming a series about the personal lives of racing personalities.'
  ],
  'Racing Driver': [
    'Competes at a professional level and shares the same passion for speed.',
    'Understands the demands of the racing calendar better than anyone.'
  ],
  'Personal Trainer': [
    'Transforms bodies and mindsets for elite clients who demand results.',
    'Has trained several racing drivers to peak physical condition.'
  ],
  'Sports Agent': [
    'Represents athletes and negotiates contracts worth millions.',
    'Knows every team principal, sponsor, and media contact in the motorsport world.'
  ],
  'Sports Commentator': [
    'Brings races to life for millions of viewers with expert analysis and enthusiasm.',
    'A familiar face in the paddock who knows everyone and everything about the sport.'
  ],
  'Olympic Athlete': [
    'Competed at the highest level and brings elite athletic discipline to daily life.',
    'Now retired from competition but still deeply connected to the world of sport.'
  ],
  'Coach': [
    'Mentors aspiring athletes and has an instinct for unlocking human potential.',
    'Brings a motivational energy to social settings that lifts everyone around them.'
  ],
  'Yoga Instructor': [
    'Teaches mindfulness and movement to high-profile clients seeking balance.',
    'Brings a calm, centered presence that contrasts nicely with the racing world.'
  ],
  'Equestrian': [
    'Competes in show jumping and shares the same love of precision and courage.',
    'Moves between the equestrian and motorsport worlds with equal comfort.'
  ],
  'Professional Golfer': [
    'Competes on the pro circuit and shares the same sponsor relationships as racing.',
    'Known for their calm under pressure, a trait honed on championship courses.'
  ],
  'Chef': [
    'Runs a Michelin-starred restaurant that is a favorite among the racing elite.',
    'Creates culinary experiences that rival the excitement of race day.'
  ],
  'Sommelier': [
    'Has an extraordinary palate and can recommend the perfect wine for any occasion.',
    'Works at an exclusive restaurant frequented by the motorsport community.'
  ],
  'Hotel Manager': [
    'Runs a luxury hotel that hosts racing teams and celebrities during Grand Prix weekends.',
    'Has an impeccable attention to detail and a gift for making people feel welcome.'
  ],
  'Concierge': [
    'Arranges the impossible for ultra-high-net-worth clients as a lifestyle concierge.',
    'Has a contact list that reads like a who\'s who of the global elite.'
  ],
  'Luxury Travel Agent': [
    'Designs bespoke travel experiences for clients who expect the extraordinary.',
    'Plans race-weekend itineraries that combine the best of sport and leisure.'
  ],
  'Casino Manager': [
    'Runs operations at one of Monaco\'s legendary casinos.',
    'Understands risk and reward in a way that resonates with racing personalities.'
  ],
  'Nightclub Owner': [
    'Owns the hottest venues in Ibiza, Monaco, and Miami.',
    'Their parties during race weekends are the most sought-after invitations.'
  ],
  'Wine Merchant': [
    'Sources rare vintages for private collectors and exclusive restaurants.',
    'Has a passion for terroir that parallels the precision of motorsport engineering.'
  ],
  'Vineyard Owner': [
    'Produces award-winning wines at their estate in Tuscany, Napa, or Bordeaux.',
    'Invites racing friends to harvest season celebrations at their vineyard.'
  ],
  'Yacht Captain': [
    'Commands luxury vessels for the ultra-wealthy around the Mediterranean.',
    'Docks in Monaco for the Grand Prix every year, becoming a fixture of race weekend.'
  ],
  'Yacht Broker': [
    'Sells multi-million dollar yachts to the motorsport and entertainment elite.',
    'Understands the luxury lifestyle from the inside and can talk boats for hours.'
  ],
  'Aviation Consultant': [
    'Advises racing teams and wealthy individuals on private aviation solutions.',
    'Has logged thousands of flight hours and brings calm authority to any situation.'
  ],
  'Professor': [
    'Holds a chair at a prestigious university and brings academic depth to conversations.',
    'Studies a subject that occasionally intersects with the world of motorsport.'
  ],
  'Researcher': [
    'Conducts groundbreaking research that pushes the boundaries of human knowledge.',
    'Brings intellectual curiosity and rigor to social settings in a refreshing way.'
  ],
  'University Dean': [
    'Leads one of the world\'s top academic institutions with vision and authority.',
    'Moves between the academic and social elite with equal comfort.'
  ],
  'Archaeologist': [
    'Uncovers ancient civilizations and brings incredible stories from excavation sites.',
    'Has a sense of adventure and discovery that makes them endlessly fascinating.'
  ],
  'Jeweler': [
    'Creates bespoke pieces for royalty, celebrities, and the racing elite.',
    'Has an eye for beauty and craftsmanship that makes their work truly exceptional.'
  ],
  'Perfumer': [
    'Creates exclusive fragrances for a prestigious fashion house.',
    'Has an extraordinary sense of smell and an appreciation for subtlety in all things.'
  ],
  'Antique Dealer': [
    'Trades in rare antiques and has a showroom that attracts collectors from around the world.',
    'Can tell the history of any object at a glance and loves sharing those stories.'
  ],
  'Auctioneer': [
    'Commands the room at major auction houses, selling art and collectibles worth millions.',
    'Has a commanding presence and theatrical flair that makes them unforgettable.'
  ],
  'Private Investigator': [
    'Handles discreet investigations for high-profile clients, including racing teams.',
    'Has an observant, analytical mind and notices things others miss.'
  ],
  'Life Coach': [
    'Guides high-achievers through career transitions and personal growth.',
    'Has a gift for asking the right questions and helping people see their own potential.'
  ],
  'Stylist': [
    'Styles celebrities and athletes for public appearances and magazine covers.',
    'Has an eye for fashion that transforms how people present themselves to the world.'
  ],
  'Winemaker': [
    'Crafts exceptional wines using traditional methods at a boutique winery.',
    'Brings the same patience and precision to life that they bring to winemaking.'
  ],
  'Military Officer (Retired)': [
    'Served with distinction and now applies military discipline to business ventures.',
    'Carries an air of authority and calm that comes from years of service.'
  ],
  'Astronaut (Retired)': [
    'Has seen Earth from space and brings a profound perspective to everything.',
    'Now works in aerospace consulting and is a sought-after speaker on human achievement.'
  ],
  // Partner career types
  'model': ['Has graced the covers of major fashion magazines and walked for top designers.'],
  'athlete': ['Competes at an elite level and shares the same drive and discipline as a racing team owner.'],
  'business_exec': ['Runs a division at a multinational corporation, balancing boardroom pressure with social grace.'],
  'doctor': ['Practices medicine at a prestigious institution, bringing a grounded perspective to the jet-set world.'],
  'lawyer': ['Handles high-profile cases that occasionally intersect with the motorsport world.'],
  'entrepreneur': ['Built a business from the ground up and understands the pressures of leadership firsthand.'],
  'artist': ['Creates work that has been exhibited internationally, bringing a creative and free-spirited energy.'],
  'journalist': ['Covers the world of luxury, sport, and celebrity, with insider access everywhere.'],
  'scientist': ['Conducts cutting-edge research, bringing intellectual depth and curiosity to every conversation.'],
  'socialite': ['Moves through high society with ease, knowing everyone worth knowing in the paddock and beyond.'],
  'racing_driver': ['Shares the same passion for speed and competition, creating an instant connection.'],
  'engineer': ['Has a technical mind that appreciates the engineering side of motorsport.'],
  'team_staff': ['Works in the motorsport industry, understanding the demands and rhythms of the racing calendar.'],
  'none': ['Is between career chapters, taking time to figure out the next move.']
}

const PERSONALITY_DESCRIPTIONS_TEMPLATE: Record<string, string[]> = {
  supportive: [
    'the kind of person who remembers the small things and checks in when times are tough',
    'always the first to celebrate others\' wins and offer a shoulder during losses'
  ],
  ambitious: [
    'driven by clear goals and doesn\'t settle for anything less than excellence',
    'has a competitive edge that makes them both inspiring and occasionally intense'
  ],
  romantic: [
    'believes in grand gestures and meaningful moments',
    'has a way of making people feel like the only person in the room'
  ],
  adventurous: [
    'always planning the next trip or trying something new',
    'gets restless with routine and thrives on spontaneity'
  ],
  intellectual: [
    'can hold a conversation on almost anything and loves learning',
    'approaches life with curiosity and values depth over small talk'
  ],
  caring: [
    'has a natural warmth that puts everyone at ease',
    'genuinely invests in the wellbeing of people around them'
  ],
  humorous: [
    'can find humor in almost any situation and loves to make people laugh',
    'has a quick wit that keeps conversations lively and entertaining'
  ],
  sophisticated: [
    'moves through social situations with effortless grace and poise',
    'has refined tastes and an appreciation for the finer things'
  ],
  creative: [
    'sees the world differently and brings a unique perspective to everything',
    'always working on some project or idea that sparks their imagination'
  ],
  confident: [
    'carries themselves with a quiet assurance that commands attention',
    'knows what they want and isn\'t afraid to go after it'
  ],
  independent: [
    'values their own space and doesn\'t need anyone else to feel complete',
    'has built a life they\'re proud of on their own terms'
  ],
  passionate: [
    'throws themselves wholeheartedly into whatever catches their interest',
    'has an infectious energy when talking about things they care about'
  ],
  loyal: [
    'the kind of person who stands by you no matter what',
    'values deep, lasting connections over surface-level socializing'
  ],
  spontaneous: [
    'lives in the moment and makes every day an adventure',
    'has a knack for turning ordinary plans into unforgettable experiences'
  ],
  thoughtful: [
    'notices details others miss and remembers what matters to people',
    'takes time to consider things carefully before acting'
  ],
  charismatic: [
    'draws people in with natural magnetism and genuine interest',
    'has a presence that lights up any room they walk into'
  ],
  driven: [
    'relentlessly pursues their goals with focus and determination',
    'inspires others with their work ethic and vision'
  ],
  compassionate: [
    'feels deeply for others and goes out of their way to help',
    'brings empathy and understanding to every interaction'
  ],
  elegant: [
    'carries themselves with timeless grace and understated style',
    'appreciates beauty in all forms, from fashion to art to conversation'
  ],
  witty: [
    'always has a clever remark ready and keeps conversations sparkling',
    'has a sharp mind that makes even mundane topics entertaining'
  ],
  // Partner-specific traits
  jealous: [
    'can be possessive and needs frequent reassurance',
    'watches closely and sometimes reads too much into situations'
  ],
  social_butterfly: [
    'thrives in social settings and knows everyone at every event',
    'has an enormous social circle and loves bringing people together'
  ],
  private: [
    'guards their personal life carefully and avoids the spotlight',
    'prefers intimate gatherings to large public events'
  ],
  glamorous: [
    'always impeccably dressed and turns heads wherever they go',
    'has a taste for luxury and expects nothing less'
  ],
  practical: [
    'grounded and sensible, preferring substance over flash',
    'values genuine effort and authenticity over expensive gestures'
  ],
  nurturing: [
    'has a natural instinct to take care of people around them',
    'dreams of building a warm, loving family environment'
  ],
  racing_enthusiast: [
    'genuinely passionate about motorsport, not just the glamour',
    'can talk about racing strategy and engineering as easily as fashion'
  ],
  high_maintenance: [
    'expects the best in everything and isn\'t shy about saying so',
    'has exacting standards that can be both impressive and demanding'
  ],
  // NEW: Expanded positive traits
  generous: [
    'gives freely of their time, money, and attention without keeping score',
    'the kind of person who picks up the check before anyone notices'
  ],
  optimistic: [
    'sees possibility where others see problems, bringing infectious positivity',
    'has an unshakeable belief that things will work out, which can be both inspiring and frustrating'
  ],
  empathetic: [
    'feels deeply what others are going through and responds with genuine understanding',
    'has an almost uncanny ability to read people and anticipate their needs'
  ],
  patient: [
    'rarely rushes into things and gives people the space they need',
    'has a calm steadiness that makes them an anchor in any social situation'
  ],
  reliable: [
    'the person everyone calls when they need something done right',
    'shows up when they say they will and follows through on every promise'
  ],
  humble: [
    'downplays their achievements and lets their work speak for itself',
    'has accomplished more than most but you\'d never know it from talking to them'
  ],
  sincere: [
    'means exactly what they say and expects the same from others',
    'brings a refreshing honesty to conversations that can be disarming'
  ],
  warm: [
    'makes everyone feel welcome from the first moment of meeting',
    'has an inviting energy that turns strangers into friends quickly'
  ],
  disciplined: [
    'approaches life with structure and self-control that borders on impressive',
    'sets goals and achieves them methodically, whether in career or personal life'
  ],
  grateful: [
    'never takes anything for granted and expresses appreciation openly',
    'has a grounded perspective that comes from remembering where they started'
  ],
  playful: [
    'approaches life with a lightness that makes everyday moments fun',
    'has a childlike sense of wonder that they\'ve never lost'
  ],
  'open-minded': [
    'willing to try anything once and genuinely curious about different perspectives',
    'approaches new ideas and cultures with enthusiasm rather than judgment'
  ],
  principled: [
    'has a strong moral compass and stands by their values even when it\'s hard',
    'earns deep respect through their unwavering integrity'
  ],
  forgiving: [
    'doesn\'t hold grudges and gives people second chances',
    'believes in moving forward and not letting resentment weigh things down'
  ],
  // NEW: Negative traits
  materialistic: [
    'measures success in material possessions and isn\'t shy about flaunting wealth',
    'has expensive tastes and a tendency to judge others by what they own'
  ],
  secretive: [
    'keeps their cards close to their chest and reveals very little about themselves',
    'has an air of mystery that can be intriguing but also isolating'
  ],
  controlling: [
    'likes things done their way and struggles when others don\'t comply',
    'has a need for control that can make spontaneity feel threatening'
  ],
  impulsive: [
    'acts first and thinks later, which leads to both great adventures and regrettable decisions',
    'has a reckless streak that can be exciting in the moment but exhausting over time'
  ],
  arrogant: [
    'carries an air of superiority that can rub people the wrong way',
    'has genuine talent but an ego that sometimes overshadows it'
  ],
  cynical: [
    'sees hidden motives in everything and trusts very few people',
    'has been burned enough times to approach the world with deep skepticism'
  ],
  unreliable: [
    'has a habit of cancelling plans and not following through on commitments',
    'means well but consistently lets people down when it matters most'
  ],
  dramatic: [
    'turns every minor inconvenience into a crisis and thrives on emotional intensity',
    'has a flair for theatrics that can be entertaining but also exhausting'
  ],
  gossipy: [
    'knows everyone\'s business and can\'t resist sharing the latest scoop',
    'is a social hub but struggles to keep confidences'
  ],
  workaholic: [
    'defines themselves through their career and struggles to switch off',
    'cancels plans for work so often that friends have stopped being surprised'
  ],
  aloof: [
    'keeps an emotional distance that can feel cold or disinterested',
    'takes a long time to warm up and many people give up before they do'
  ],
  manipulative: [
    'has a talent for getting what they want, often at others\' expense',
    'plays social chess several moves ahead, which can be impressive and unsettling'
  ],
  vain: [
    'obsessively concerned with their appearance and how others perceive them',
    'spends more time in front of the mirror than most and expects constant compliments'
  ],
  entitled: [
    'expects special treatment everywhere and becomes difficult when they don\'t get it',
    'grew up with privilege and assumes the world revolves around their needs'
  ],
  petty: [
    'holds onto small grievances and brings them up at the worst possible times',
    'keeps a mental tally of perceived slights that surprises people with its detail'
  ],
  'passive-aggressive': [
    'expresses displeasure through subtle digs and silent treatment rather than direct confrontation',
    'says "it\'s fine" when it clearly isn\'t, leaving others to decode the real message'
  ],
  judgmental: [
    'forms strong opinions quickly and isn\'t afraid to share them, even when unsolicited',
    'has high standards for everyone around them that few can consistently meet'
  ],
  'self-centered': [
    'steers every conversation back to themselves and their experiences',
    'genuinely doesn\'t realize how little they ask about other people\'s lives'
  ],
  impatient: [
    'wants everything done yesterday and visibly struggles when things take time',
    'has a restless energy that makes waiting feel like torture'
  ],
  reckless: [
    'takes risks that others would consider foolish and somehow usually lands on their feet',
    'lives like there\'s no tomorrow, which is exciting until consequences catch up'
  ],
  dismissive: [
    'brushes off other people\'s concerns with frustrating ease',
    'has a habit of minimizing things that matter to others while magnifying their own issues'
  ],
  argumentative: [
    'will debate anything and everything, turning casual conversations into heated discussions',
    'has strong opinions on topics most people don\'t even think about'
  ],
  condescending: [
    'talks down to people without realizing it, making others feel small',
    'has a way of explaining things that implies everyone else is a step behind'
  ],
  // NEW: Complex / neutral traits
  perfectionist: [
    'holds themselves and others to impossibly high standards',
    'produces exceptional work but at the cost of constant stress and dissatisfaction'
  ],
  'old-fashioned': [
    'values tradition and manners in a world that often moves too fast for their taste',
    'has a charm that comes from a different era, which some find refreshing and others find limiting'
  ],
  restless: [
    'always looking for the next thing and struggles to stay in one place or role for long',
    'has a wandering spirit that makes them exciting but hard to pin down'
  ],
  competitive: [
    'turns everything into a contest and hates losing more than they love winning',
    'pushes themselves and others to excel, which can be motivating or exhausting'
  ],
  stubborn: [
    'once they\'ve made up their mind, nothing can change it',
    'has an iron will that serves them well in career but creates friction in relationships'
  ],
  sarcastic: [
    'uses humor as both a shield and a weapon, keeping people at arm\'s length',
    'has a razor-sharp wit that can be hilarious or cutting depending on the target'
  ],
  intense: [
    'approaches everything with a depth of focus and emotion that can be overwhelming',
    'doesn\'t know how to do anything at half-measure'
  ],
  mysterious: [
    'reveals themselves slowly, like a novel you can\'t put down',
    'has an enigmatic quality that makes people want to know more'
  ],
  reserved: [
    'takes time to open up but is deeply loyal once they do',
    'observes more than they speak, choosing their words carefully'
  ],
  idealistic: [
    'believes the world can be better and isn\'t afraid to say so',
    'sometimes struggles with the gap between how things are and how they should be'
  ],
  eccentric: [
    'marches to the beat of their own drum in a way that\'s either delightful or bewildering',
    'has unusual habits and interests that make them unforgettable'
  ],
  blunt: [
    'says exactly what they think, which is refreshing until it\'s about you',
    'values honesty over tact, sometimes to the detriment of social harmony'
  ],
  calculating: [
    'thinks several steps ahead in every situation, a trait that serves them well in business',
    'approaches relationships strategically, which some find impressive and others find cold'
  ],
  overprotective: [
    'guards the people they care about fiercely, sometimes to a suffocating degree',
    'their concern comes from a good place but can feel controlling'
  ],
  nostalgic: [
    'lives partly in the past, always comparing present experiences to cherished memories',
    'has a sentimental streak that makes them deeply romantic but sometimes resistant to change'
  ],
  mischievous: [
    'has a playful streak and loves pushing boundaries just to see what happens',
    'always the one with a twinkle in their eye and a plan for some harmless trouble'
  ],
  rebellious: [
    'instinctively pushes back against authority and convention',
    'has a nonconformist spirit that makes them either thrilling or exhausting to be around'
  ],
  obsessive: [
    'when they get interested in something, they go all in to an extraordinary degree',
    'has deep expertise in niche topics because they can\'t let things go half-explored'
  ],
  opinionated: [
    'has strong views on everything and is never short of something to say',
    'makes conversations lively but sometimes steamrolls quieter voices'
  ],
  fiery: [
    'burns with a passionate intensity that can be both attractive and volatile',
    'quick to anger but just as quick to forgive, living life at emotional full-throttle'
  ]
}

const LIFE_SITUATIONS = [
  'Recently relocated to {city} to be closer to the European racing circuit.',
  'Just returned from an extended trip abroad and is settling back into social life.',
  'Going through an exciting career transition that has them buzzing with energy.',
  'Recently launched a new project and is looking for like-minded people to connect with.',
  'Has been focusing on personal growth and is in a great place right now.',
  'Just moved into a new place in {city} and is rediscovering the local scene.',
  'Is at a crossroads professionally and open to new opportunities and connections.',
  'Recently achieved a major milestone and is celebrating by expanding their social circle.',
  'Balancing a busy career with a desire to enjoy life more outside of work.',
  'Has been traveling extensively and is looking to put down roots for a while.',
  'Just got out of a long relationship and is rediscovering who they are.',
  'Recently became single after years of marriage and is navigating a new chapter.',
  'Moved to {city} on a whim after a life-changing trip that shifted their perspective.',
  'Is recovering from a career setback but determined to come back stronger.',
  'Just received a major promotion and is adjusting to a more visible, demanding role.',
  'Sold their business last year and is figuring out what to do with newfound freedom.',
  'Recently inherited a family estate near {city} and is deciding whether to settle there.',
  'Training for their first marathon while juggling a demanding career.',
  'Has been volunteering abroad and just returned with a broader worldview.',
  'Is writing a book about their experiences and is looking for new stories to tell.',
  'Just adopted a rescue dog and their social life now revolves around the dog park.',
  'Recently got into investing and is obsessed with learning about new markets.',
  'Is in the middle of renovating a villa near {city} and loves talking about the process.',
  'Just celebrated a birthday milestone and is feeling reflective about what comes next.',
  'Split time between {city} and another city, always on the move between two lives.'
]

const ANECDOTE_TEMPLATES = [
  'Once accidentally walked into the wrong VIP lounge at a Grand Prix and ended up making three new business contacts.',
  'Has a hidden talent for {hobby} that surprises everyone who finds out.',
  'Speaks {languages} languages fluently, picked up from years of international living.',
  'Is secretly an excellent cook who specializes in {cuisine} cuisine.',
  'Once ran into a celebrity at {place} and didn\'t recognize them, leading to a hilarious conversation.',
  'Has a collection of {collectible} that they\'re quietly proud of.',
  'Trained in {skill} as a teenager and still practices when no one is watching.',
  'Their go-to karaoke song is always something unexpectedly {genre}.',
  'Volunteers anonymously at a local {charity_type} every month.',
  'Has an irrational fear of {fear} that they try very hard to hide.',
  'Once won a bet by {achievement} and still brings it up at parties.',
  'Their phone background is a photo of {sentimental_thing}, which tells you everything about their priorities.',
  'Can name every Grand Prix winner from the last decade, despite claiming not to follow racing that closely.',
  'Has a morning routine that involves {routine} and refuses to start the day without it.',
  'Keeps a journal that they\'ve maintained since they were {journal_age} years old.',
  // NEW: More diverse anecdotes
  'Once got lost in {city_random} for three hours and considers it one of the best days of their life.',
  'Has a secret playlist of {genre} that they would never admit to listening to publicly.',
  'Was once mistaken for a famous person at {place} and played along for an entire evening.',
  'Keeps a detailed spreadsheet tracking every restaurant they\'ve ever eaten at, with ratings.',
  'Can fix almost anything mechanical, a skill inherited from a parent who was a {mechanical_relative}.',
  'Has been skydiving {skydive_count} times and plans to do it at least once more this year.',
  'Once cooked dinner for {celebrity_count} people at a charity event and somehow pulled it off.',
  'Their most prized possession is a signed {memorabilia} that they found at a flea market.',
  'Secretly writes {creative_hobby} under a pen name that even their closest friends don\'t know.',
  'Was a competitive {youth_sport} player as a teenager and still follows the sport closely.',
  'Has a tattoo that they got during a trip to {tattoo_city} that has a meaning only they know.',
  'Once accidentally booked a hotel in the wrong country and decided to just go with it.',
  'Learned to {unusual_skill} during lockdown and now does it almost obsessively.',
  'Has an alter ego that comes out specifically at karaoke nights.',
  'Made a pact with a friend to {pact_goal} by age 40, and they\'re determined to keep it.'
]

const ANECDOTE_FILLS: Record<string, string[]> = {
  hobby: ['painting watercolors', 'playing the piano', 'doing stand-up comedy', 'woodworking', 'salsa dancing', 'pottery', 'baking sourdough', 'playing chess competitively', 'restoring vintage motorcycles', 'knitting', 'DJing'],
  languages: ['three', 'four', 'three', 'two', 'five'],
  cuisine: ['Italian', 'Japanese', 'French', 'Thai', 'Argentinian', 'Mediterranean', 'Korean', 'Mexican', 'Indian', 'Moroccan'],
  place: ['an airport lounge', 'a coffee shop in Monaco', 'a charity gala', 'a ski resort', 'a yacht party', 'a bookshop in Paris', 'a Tokyo ramen shop', 'a London members\' club'],
  collectible: ['vintage watches', 'first-edition books', 'rare vinyl records', 'antique maps', 'racing memorabilia', 'vintage motorsport posters', 'classic car models', 'limited-edition sneakers'],
  skill: ['fencing', 'classical piano', 'martial arts', 'ballet', 'sailing', 'archery', 'boxing', 'figure skating', 'competitive swimming'],
  genre: ['80s power ballad', 'country', 'opera', 'punk rock', 'jazz standard', 'K-pop', 'death metal', 'Bollywood musical number', 'Disney soundtrack'],
  charity_type: ['animal shelter', 'youth mentoring program', 'food bank', 'hospital', 'children\'s literacy program', 'refugee support center'],
  fear: ['pigeons', 'escalators', 'clowns', 'thunderstorms', 'butterflies', 'revolving doors', 'mascots', 'deep water', 'house spiders'],
  achievement: ['eating an entire pizza in under 10 minutes', 'doing a backflip on a dare', 'correctly guessing every race winner in a season', 'holding their breath for three minutes', 'finishing a triathlon on zero training'],
  sentimental_thing: ['their childhood pet', 'a sunset they caught in Santorini', 'their parents on their wedding day', 'a mountain they climbed last summer', 'their first car', 'a handwritten letter from someone special'],
  routine: ['a specific brand of espresso', 'a 5K run', 'twenty minutes of meditation', 'reading the news in three languages', 'cold plunge followed by breathing exercises', 'journaling and green tea'],
  journal_age: ['fourteen', 'sixteen', 'twelve', 'fifteen', 'ten'],
  // NEW: fills for expanded anecdote templates
  city_random: ['Tokyo', 'Marrakech', 'Buenos Aires', 'Istanbul', 'Lisbon', 'Bangkok', 'Prague', 'Havana'],
  mechanical_relative: ['mechanic', 'carpenter', 'engineer', 'boat builder', 'watchmaker'],
  skydive_count: ['seven', 'twelve', 'twenty', 'five', 'thirty'],
  celebrity_count: ['forty', 'sixty', 'eighty', 'a hundred'],
  memorabilia: ['racing helmet', 'guitar', 'first-edition novel', 'film poster', 'basketball jersey'],
  creative_hobby: ['poetry', 'short fiction', 'a food blog', 'song lyrics', 'mystery novels'],
  youth_sport: ['tennis', 'football', 'swimming', 'volleyball', 'basketball', 'hockey', 'athletics'],
  tattoo_city: ['Tokyo', 'Barcelona', 'Bali', 'New York', 'Bangkok', 'Berlin'],
  unusual_skill: ['solve a Rubik\'s cube in under two minutes', 'do handstands', 'make sourdough bread from scratch', 'juggle', 'do magic card tricks'],
  pact_goal: ['run a marathon together', 'visit every continent', 'start a business together', 'learn to surf']
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function fillAnecdote(template: string): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const options = ANECDOTE_FILLS[key]
    return options ? pickRandom(options) : match
  })
}

function getCityForNationality(nationality: string): string {
  const cities = BACKGROUND_TEMPLATES.cities[nationality]
  if (cities && cities.length > 0) {
    return pickRandom(cities)
  }
  return pickRandom(['London', 'Paris', 'New York', 'Milan', 'Monaco'])
}

/**
 * Template-based fallback bio generation when AI is unavailable
 */
export function generateFallbackSocialBio(context: SocialBioContext): SocialBio {
  const city = getCityForNationality(context.nationality || 'British')
  const influence = pickRandom(BACKGROUND_TEMPLATES.influences)
  
  // Background
  const originTemplate = pickRandom(BACKGROUND_TEMPLATES.origins)
  const originSentence = originTemplate
    .replace('{city}', city)
    .replace('{influence}', influence)
  
  const educationSnippets = [
    `After studying abroad, ${context.name.split(' ')[0]} found their way into the world of ${context.occupation || 'their profession'}.`,
    `${context.name.split(' ')[0]} always had a drive to succeed, which led them naturally into ${context.occupation || 'their field'}.`,
    `A chance encounter at university set ${context.name.split(' ')[0]} on the path to becoming ${context.occupation ? `a ${context.occupation}` : 'who they are today'}.`
  ]
  
  const background = `${context.name.split(' ')[0]} ${originSentence}. ${pickRandom(educationSnippets)}`
  
  // Career narrative
  const occupation = context.occupation || context.career || 'none'
  const careerOptions = CAREER_NARRATIVES[occupation] || CAREER_NARRATIVES['none'] || [
    `Works in ${occupation.replace(/_/g, ' ')} and has built a solid reputation in their field.`
  ]
  const careerNarrative = pickRandom(careerOptions)
  
  // Personality description
  const traitDescriptions = context.traits
    .map(t => {
      const options = PERSONALITY_DESCRIPTIONS_TEMPLATE[t]
      return options ? pickRandom(options) : null
    })
    .filter(Boolean)
  
  const firstName = context.name.split(' ')[0]
  let personalityDescription: string
  if (traitDescriptions.length >= 2) {
    personalityDescription = `${firstName} is ${traitDescriptions[0]}. ${context.gender === 'female' ? 'She' : context.gender === 'male' ? 'He' : 'They'}'s also ${traitDescriptions[1]}.`
    if (traitDescriptions.length >= 3) {
      personalityDescription += ` Those who know ${context.gender === 'female' ? 'her' : context.gender === 'male' ? 'him' : 'them'} well say ${context.gender === 'female' ? 'she' : context.gender === 'male' ? 'he' : 'they'}'s ${traitDescriptions[2]}.`
    }
  } else if (traitDescriptions.length === 1) {
    personalityDescription = `${firstName} is ${traitDescriptions[0]}. ${context.gender === 'female' ? 'She' : context.gender === 'male' ? 'He' : 'They'} makes a strong impression on everyone ${context.gender === 'female' ? 'she' : context.gender === 'male' ? 'he' : 'they'} meets.`
  } else {
    personalityDescription = `${firstName} is the kind of person who leaves an impression. ${context.gender === 'female' ? 'She' : context.gender === 'male' ? 'He' : 'They'} carries ${context.gender === 'female' ? 'herself' : context.gender === 'male' ? 'himself' : 'themselves'} with a quiet confidence that draws people in.`
  }
  
  // Life situation
  const lifeSituationTemplate = pickRandom(LIFE_SITUATIONS)
  const lifeSituation = lifeSituationTemplate.replace('{city}', city)
  
  // Anecdotes (pick 2-3 unique ones)
  const shuffledAnecdotes = [...ANECDOTE_TEMPLATES].sort(() => Math.random() - 0.5)
  const anecdoteCount = 2 + Math.floor(Math.random() * 2) // 2 or 3
  const anecdotes = shuffledAnecdotes.slice(0, anecdoteCount).map(fillAnecdote)
  
  return {
    background,
    careerNarrative,
    anecdotes,
    personalityDescription,
    lifeSituation
  }
}

// ============================================
// FALLBACK GENERATORS (Template-based)
// ============================================

function generateFallbackChoices(context: DialogueGenerationContext): MessageChoice[] {
  const choices: MessageChoice[] = []
  
  // Always include a casual greeting
  choices.push({
    id: `fallback_greeting_${Date.now()}`,
    category: 'greeting',
    preview: 'Hey, how are you?',
    fullMessage: `Hey ${context.contactName}! How's it going?`,
    tone: 'friendly',
    riskLevel: 'safe',
    couldBackfire: false,
    expectedEffects: { affection: 1 },
    likelyResponses: ['neutral_greeting']
  })
  
  // Check-in if haven't talked recently
  if (context.daysSinceLastContact > 3) {
    choices.push({
      id: `fallback_checkin_${Date.now()}`,
      category: 'check_in',
      preview: 'Just checking in',
      fullMessage: `Hey, just wanted to check in. Been a few days since we talked. Everything okay?`,
      tone: 'supportive',
      riskLevel: 'safe',
      couldBackfire: false,
      expectedEffects: { trust: 2 },
      likelyResponses: ['appreciative']
    })
  }
  
  // Flirty option if relationship is good
  if (context.relationshipLevel >= 50 && context.contactType === 'partner') {
    choices.push({
      id: `fallback_flirt_${Date.now()}`,
      category: 'flirt',
      preview: 'Thinking about you',
      fullMessage: `Can't stop thinking about you today. Just wanted you to know.`,
      tone: 'romantic',
      riskLevel: 'mild',
      couldBackfire: false,
      expectedEffects: { romance: 3, affection: 2 },
      likelyResponses: ['flattered']
    })
  }
  
  // Share news if recent race
  if (context.playerRecentRaceResult) {
    const isGood = context.playerRecentRaceResult === 'win' || context.playerRecentRaceResult === 'podium'
    choices.push({
      id: `fallback_news_${Date.now()}`,
      category: 'share_news',
      preview: isGood ? 'Great news from the race!' : 'Tough day at the track',
      fullMessage: isGood 
        ? `Great result at the race today! Wish you could have been there to celebrate!`
        : `Tough day at the track. Could use some cheering up if you're free to talk.`,
      tone: isGood ? 'excited' : 'casual',
      riskLevel: 'safe',
      couldBackfire: false,
      expectedEffects: { affection: 1 },
      likelyResponses: isGood ? ['congratulations'] : ['supportive']
    })
  }
  
  // Make plans
  choices.push({
    id: `fallback_plans_${Date.now()}`,
    category: 'make_plans',
    preview: 'Want to hang out?',
    fullMessage: `Hey, what are you up to this weekend? Would love to see you.`,
    tone: 'casual',
    riskLevel: 'mild',
    couldBackfire: true,
    expectedEffects: { affection: 2 },
    likelyResponses: ['interested', 'busy']
  })
  
  return choices.slice(0, 5) // Return max 5 choices
}

function generateFallbackResponse(
  context: DialogueGenerationContext,
  _playerMessage: string,
  _messageCategory: string
): NpcResponse {
  // Default response based on relationship and mood
  const isPositiveMood = ['happy', 'excited', 'romantic'].includes(context.currentMood)
  const isGoodRelationship = context.relationshipLevel >= 60
  
  let message = ''
  let affectionChange = 0
  let trustChange = 0
  let emotionalReaction: NpcResponse['emotionalReaction'] = 'neutral'
  
  if (isPositiveMood && isGoodRelationship) {
    message = `Hey! So good to hear from you! ${context.lastMessageFromThem ? 'I was just thinking about you.' : ''}`
    affectionChange = 2
    trustChange = 1
    emotionalReaction = 'happy'
  } else if (isPositiveMood) {
    message = `Hey! How's it going?`
    affectionChange = 1
    emotionalReaction = 'pleased'
  } else if (context.currentMood === 'sad' || context.currentMood === 'worried') {
    message = `Hey... Thanks for reaching out.`
    trustChange = 2
    emotionalReaction = 'pleased'
  } else {
    message = `Hey, what's up?`
    emotionalReaction = 'neutral'
  }
  
  // Adjust for long absence
  if (context.daysSinceLastContact > 14) {
    message = `Oh, hey! It's been a while. ${isGoodRelationship ? 'I was starting to wonder about you!' : 'What made you think of me?'}`
    trustChange -= 1
    emotionalReaction = isGoodRelationship ? 'pleased' : 'neutral'
  }
  
  return {
    message,
    tone: isPositiveMood ? 'warm' : 'neutral',
    mood: context.currentMood,
    affectionChange,
    romanceChange: 0,
    trustChange,
    emotionalReaction,
    wantsToMeetUp: false
  }
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Generate a complete conversation turn (player choices + initial context)
 */
export async function generateConversationTurn(
  context: DialogueGenerationContext
): Promise<{
  choices: MessageChoice[]
  contextualGreeting?: string
}> {
  const choices = await generateMessageChoices(context)
  
  // Generate contextual greeting if they sent the last message
  let contextualGreeting: string | undefined
  if (context.lastMessageFromThem) {
    contextualGreeting = `Responding to: "${context.lastMessageFromThem}"`
  }
  
  return { choices, contextualGreeting }
}

/**
 * Process a complete message exchange
 */
export async function processMessageExchange(
  context: DialogueGenerationContext,
  selectedChoice: MessageChoice
): Promise<{
  sentMessage: string
  response: NpcResponse
  updatedMeters: {
    affection: number
    romance: number
    trust: number
  }
}> {
  const response = await generateNpcResponse(
    context,
    selectedChoice.fullMessage,
    selectedChoice.category
  )
  
  return {
    sentMessage: selectedChoice.fullMessage,
    response,
    updatedMeters: {
      affection: context.affectionMeter + response.affectionChange,
      romance: context.romanceMeter + response.romanceChange,
      trust: context.trustMeter + response.trustChange
    }
  }
}
