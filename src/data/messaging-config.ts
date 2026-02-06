// ============================================
// MESSAGING & CONVERSATION CONFIGURATION
// ============================================
// Configuration for the AI-powered messaging system with dialogue choices.

// ============================================
// MESSAGE TYPES
// ============================================

export type MessageSender = 'player' | 'npc'

export type ConversationCategory = 
  | 'romantic'      // Partner/dating
  | 'family'        // Children, parents
  | 'business'      // Sponsors, staff, team
  | 'social'        // Friends, contacts
  | 'media'         // Press, journalists
  | 'rival'         // Rivalries

export type MessageTone = 
  | 'friendly'
  | 'flirty'
  | 'romantic'
  | 'supportive'
  | 'apologetic'
  | 'confrontational'
  | 'professional'
  | 'casual'
  | 'excited'
  | 'concerned'
  | 'playful'
  | 'neutral'
  | 'warm'

export interface TextMessage {
  id: string
  conversationId: string
  sender: MessageSender
  
  // Content
  content: string
  tone: MessageTone
  
  // Timing
  timestamp: { week: number; day: number; hour: number; year: number }
  isRead: boolean
  
  // If player message, which choice was selected
  choiceId?: string
  choiceCategory?: string
  
  // Effects (for NPC reactions)
  moodChange?: number
  affectionChange?: number
  trustChange?: number
  
  // Attachments
  hasGift?: boolean
  giftId?: string
  hasInvitation?: boolean
  invitationId?: string
  hasPhoto?: boolean
}

// ============================================
// CONVERSATIONS
// ============================================

export interface Conversation {
  id: string
  contactId: string
  contactName: string
  contactType: ConversationCategory
  
  // State
  isActive: boolean
  lastMessageTime: { week: number; day: number; year: number }
  unreadCount: number
  
  // Messages (most recent first)
  messages: TextMessage[]
  
  // Relationship context
  relationshipLevel: number     // 0-100
  currentMood: NpcMood
  
  // Conversation state
  currentTopic?: string
  awaitingResponse: boolean     // Is NPC expecting a reply
  conversationStage: 'new' | 'ongoing' | 'cooling_off' | 'stale'
}

export interface NpcMood {
  overall: 'happy' | 'neutral' | 'sad' | 'angry' | 'excited' | 'worried' | 'romantic'
  energy: 'high' | 'medium' | 'low'
  receptiveness: number         // 0-100, how open to conversation
  
  // Recent events affecting mood
  recentEvents: MoodEvent[]
}

export interface MoodEvent {
  type: string
  description: string
  moodImpact: number
  weeksAgo: number
}

// ============================================
// DIALOGUE CHOICE SYSTEM
// ============================================

export interface MessageChoice {
  id: string
  category: MessageChoiceCategory
  
  // Display
  preview: string               // Short version shown in choice wheel
  fullMessage: string           // What gets "sent"
  tone: MessageTone
  
  // Requirements
  requiresRelationshipLevel?: number
  requiresTrust?: number
  requiresRomanticStatus?: boolean  // Must be dating/married
  
  // Effects
  expectedEffects: {
    affection?: number
    trust?: number
    romance?: number
    mood?: string
  }
  
  // Risk
  riskLevel: 'safe' | 'mild' | 'risky' | 'bold'
  couldBackfire: boolean        // Might have negative reaction
  
  // Follow-up
  likelyResponses: string[]     // Categories of likely NPC responses
}

export type MessageChoiceCategory = 
  | 'greeting'
  | 'small_talk'
  | 'check_in'
  | 'compliment'
  | 'flirt'
  | 'deep_talk'
  | 'apology'
  | 'invitation'
  | 'gift'
  | 'support'
  | 'tease'
  | 'romantic'
  | 'goodbye'
  | 'question'
  | 'share_news'
  | 'make_plans'

// ============================================
// CONVERSATION CONTEXT
// ============================================

export interface ConversationContext {
  // Who you're talking to
  contactId: string
  contactName: string
  contactType: ConversationCategory
  
  // Their personality
  traits: string[]
  
  // Relationship state
  relationshipStatus?: 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'dating' | 'engaged' | 'married'
  relationshipLevel: number
  affectionMeter: number
  romanceMeter: number
  trustMeter: number
  
  // Current mood
  currentMood: NpcMood
  
  // Conversation history
  lastMessageFromThem?: string
  lastMessageFromPlayer?: string
  conversationTopic?: string
  messagesSentToday: number
  daysSinceLastContact: number
  
  // Recent events
  recentEvents: {
    event: string
    weeksAgo: number
    wasPositive: boolean
  }[]
  
  // Player context
  playerRecentRaceResult?: 'win' | 'podium' | 'points' | 'dnf' | 'crash'
  playerRecentScandal?: string
  playerCurrentStress: number
  
  // Desires and grievances
  unfulfilledDesires: string[]
  recentGrievances: string[]
}

// ============================================
// NPC RESPONSES
// ============================================

export interface NpcResponse {
  message: string
  tone: MessageTone
  mood: string
  
  // Meter changes
  affectionChange: number
  romanceChange: number
  trustChange: number
  
  // Special triggers
  triggeredDesire?: string      // Fulfilled one of their wants
  triggeredGrievance?: string   // Something upset them
  
  // Follow-up suggestions
  suggestedFollowUp?: string    // "Ask about their day", "Apologize"
  wantsToMeetUp: boolean        // Suggesting a date/meetup
  
  // Emotional state
  emotionalReaction: 'delighted' | 'happy' | 'pleased' | 'neutral' | 'disappointed' | 'upset' | 'angry'
}

// ============================================
// MESSAGE TEMPLATES (FALLBACK)
// ============================================
// Used when AI generation is unavailable or for fast responses

export interface MessageTemplate {
  id: string
  category: MessageChoiceCategory
  tone: MessageTone
  
  // Templates with variables
  previewTemplates: string[]    // "{name}, how are you?"
  fullMessageTemplates: string[]
  
  // Context requirements
  requiresContext?: {
    relationshipMin?: number
    relationshipMax?: number
    moodIn?: string[]
    topicIn?: string[]
  }
  
  // Expected responses (also templates)
  responseTemplates: {
    positive: string[]
    neutral: string[]
    negative: string[]
  }
}

// Default message templates for common scenarios
export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  // Greetings
  {
    id: 'greeting_casual',
    category: 'greeting',
    tone: 'casual',
    previewTemplates: ['Hey!', 'Hi there', 'What\'s up?'],
    fullMessageTemplates: [
      'Hey {name}! How\'s it going?',
      'Hi there! Been thinking about you.',
      'What\'s up? Hope you\'re having a good day!'
    ],
    responseTemplates: {
      positive: ['Hey! Great to hear from you!', 'Hi! I was just thinking about you!'],
      neutral: ['Hey, how are you?', 'Hi! What\'s up?'],
      negative: ['Oh, hi...', 'Hey.']
    }
  },
  {
    id: 'greeting_romantic',
    category: 'greeting',
    tone: 'romantic',
    previewTemplates: ['Good morning beautiful', 'Missing you', 'Thinking of you'],
    fullMessageTemplates: [
      'Good morning, beautiful. You\'re the first thing on my mind.',
      'Can\'t stop thinking about you today.',
      'Missing you more than words can say.'
    ],
    requiresContext: { relationshipMin: 60 },
    responseTemplates: {
      positive: ['Aww, you\'re so sweet! I miss you too!', 'That made my whole day!'],
      neutral: ['That\'s sweet of you.', 'Thanks, thinking of you too.'],
      negative: ['Thanks...', 'You\'re being awfully affectionate.']
    }
  },
  
  // Compliments
  {
    id: 'compliment_appearance',
    category: 'compliment',
    tone: 'flirty',
    previewTemplates: ['You looked amazing', 'Stunning as always', 'Can\'t get over you'],
    fullMessageTemplates: [
      'You looked absolutely amazing at {event}.',
      'Still can\'t get over how stunning you looked.',
      'Just saw a photo of you - you take my breath away.'
    ],
    requiresContext: { relationshipMin: 40 },
    responseTemplates: {
      positive: ['Stop it, you\'re making me blush!', 'You always know what to say!'],
      neutral: ['Thank you, that\'s sweet.', 'Aww thanks!'],
      negative: ['Thanks, I guess.', 'You\'re being weird.']
    }
  },
  {
    id: 'compliment_achievement',
    category: 'compliment',
    tone: 'supportive',
    previewTemplates: ['Proud of you', 'You crushed it', 'Amazing work'],
    fullMessageTemplates: [
      'I\'m so proud of what you\'ve accomplished!',
      'You absolutely crushed it! I knew you could do it.',
      'Your hard work is really paying off. So proud of you.'
    ],
    responseTemplates: {
      positive: ['Thank you so much! That means everything to me!', 'Your support means the world!'],
      neutral: ['Thanks, I appreciate that.', 'Thank you for saying that.'],
      negative: ['Thanks.', 'I guess.']
    }
  },
  
  // Check-ins
  {
    id: 'checkin_how_are_you',
    category: 'check_in',
    tone: 'friendly',
    previewTemplates: ['How are you?', 'How\'s your day?', 'Everything okay?'],
    fullMessageTemplates: [
      'Hey, just checking in. How are you doing?',
      'How\'s your day going so far?',
      'Just wanted to make sure everything\'s okay with you.'
    ],
    responseTemplates: {
      positive: ['I\'m doing great! Thanks for asking!', 'Really good actually! How about you?'],
      neutral: ['I\'m okay, thanks for checking in.', 'Same old, same old. You?'],
      negative: ['Not the best day...', 'Could be better honestly.']
    }
  },
  
  // Support
  {
    id: 'support_after_bad_day',
    category: 'support',
    tone: 'supportive',
    previewTemplates: ['I\'m here for you', 'That\'s tough', 'Sending love'],
    fullMessageTemplates: [
      'I\'m here for you, whatever you need.',
      'That sounds really tough. Want to talk about it?',
      'Sending you all my love. You\'ve got this.'
    ],
    responseTemplates: {
      positive: ['Thank you so much. I really needed to hear that.', 'You always know what to say.'],
      neutral: ['I appreciate that.', 'Thanks.'],
      negative: ['I just need some space right now.', 'I\'d rather not talk about it.']
    }
  },
  
  // Making plans
  {
    id: 'plans_dinner',
    category: 'make_plans',
    tone: 'excited',
    previewTemplates: ['Dinner tonight?', 'Let\'s go out', 'Free this weekend?'],
    fullMessageTemplates: [
      'How about dinner tonight? I know a great place.',
      'I\'d love to take you out this weekend. What do you think?',
      'Any chance you\'re free for a date night?'
    ],
    requiresContext: { relationshipMin: 30 },
    responseTemplates: {
      positive: ['Yes! I\'d love that!', 'That sounds amazing, count me in!'],
      neutral: ['Let me check my schedule.', 'Maybe, what did you have in mind?'],
      negative: ['I\'m pretty busy...', 'I don\'t know if I can.']
    }
  },
  
  // Apologies
  {
    id: 'apology_missed_event',
    category: 'apology',
    tone: 'apologetic',
    previewTemplates: ['I\'m so sorry', 'Please forgive me', 'I messed up'],
    fullMessageTemplates: [
      'I\'m so sorry about missing {event}. It won\'t happen again.',
      'I know I messed up. Please give me a chance to make it right.',
      'I feel terrible about what happened. Can we talk?'
    ],
    responseTemplates: {
      positive: ['I appreciate the apology. Let\'s move past it.', 'Thank you for saying that. I forgive you.'],
      neutral: ['Okay... let\'s talk.', 'I need some time to think about it.'],
      negative: ['It\'s going to take more than that.', 'I\'m still upset.']
    }
  },
  
  // Flirting
  {
    id: 'flirt_thinking_of_you',
    category: 'flirt',
    tone: 'flirty',
    previewTemplates: ['Can\'t stop thinking about you', 'You\'re on my mind', 'Distracted by you'],
    fullMessageTemplates: [
      'Can\'t stop thinking about you today... it\'s very distracting.',
      'You\'ve been on my mind all day.',
      'I keep getting distracted thinking about your smile.'
    ],
    requiresContext: { relationshipMin: 50 },
    responseTemplates: {
      positive: ['Oh really? Tell me more...', 'You\'re pretty distracting yourself.'],
      neutral: ['That\'s sweet.', 'Aww.'],
      negative: ['That\'s... forward.', 'We should probably slow down.']
    }
  },
  
  // Sharing news
  {
    id: 'share_race_win',
    category: 'share_news',
    tone: 'excited',
    previewTemplates: ['I won!', 'Guess what happened!', 'Big news!'],
    fullMessageTemplates: [
      'I won the race! I can\'t believe it!',
      'Guess what? We got the victory! All that hard work paid off!',
      'Big news - we\'re race winners! Wish you could have been there!'
    ],
    responseTemplates: {
      positive: ['CONGRATULATIONS! I\'m so proud of you!', 'YES! I knew you could do it! Celebrating tonight?'],
      neutral: ['Congrats!', 'That\'s great news.'],
      negative: ['Cool.', 'Nice.']
    }
  },
  
  // Invitations
  {
    id: 'invite_to_event',
    category: 'invitation',
    tone: 'excited',
    previewTemplates: ['Come to my event?', 'I\'d love you there', 'Join me?'],
    fullMessageTemplates: [
      'I have a {event} coming up and I\'d really love it if you could be there.',
      'Would you like to join me at {event}? It would mean a lot.',
      'I\'m hosting {event} and you\'re at the top of my guest list!'
    ],
    responseTemplates: {
      positive: ['I\'d love to! Count me in!', 'Absolutely! I wouldn\'t miss it!'],
      neutral: ['Let me check my calendar.', 'What date is it?'],
      negative: ['I\'m not sure I can make it.', 'I\'ll have to pass, sorry.']
    }
  }
]

// ============================================
// CONVERSATION STARTERS BY CONTEXT
// ============================================

export interface ConversationStarter {
  context: string
  applicableWhen: {
    daysSinceContact?: { min?: number; max?: number }
    recentEvent?: string
    mood?: string[]
    relationshipMin?: number
    relationshipMax?: number
  }
  choices: Omit<MessageChoice, 'id'>[]
}

export const CONVERSATION_STARTERS: ConversationStarter[] = [
  {
    context: 'after_race_win',
    applicableWhen: { recentEvent: 'race_win' },
    choices: [
      {
        category: 'share_news',
        preview: 'Share the victory!',
        fullMessage: 'We did it! Won the race today! Wish you could have been there to celebrate!',
        tone: 'excited',
        expectedEffects: { affection: 3, mood: 'happy' },
        riskLevel: 'safe',
        couldBackfire: false,
        likelyResponses: ['congratulations', 'celebration']
      },
      {
        category: 'romantic',
        preview: 'First thought was you',
        fullMessage: 'Crossed the finish line and my first thought was of you. This win is for us.',
        tone: 'romantic',
        requiresRelationshipLevel: 60,
        expectedEffects: { affection: 8, romance: 5 },
        riskLevel: 'safe',
        couldBackfire: false,
        likelyResponses: ['touched', 'romantic_response']
      }
    ]
  },
  {
    context: 'after_race_loss',
    applicableWhen: { recentEvent: 'race_loss' },
    choices: [
      {
        category: 'support',
        preview: 'Reach out for support',
        fullMessage: 'Tough day at the track. Could use some cheering up if you\'re free to talk.',
        tone: 'casual',
        expectedEffects: { trust: 2 },
        riskLevel: 'safe',
        couldBackfire: false,
        likelyResponses: ['supportive', 'offer_comfort']
      }
    ]
  },
  {
    context: 'havent_talked_recently',
    applicableWhen: { daysSinceContact: { min: 7, max: 14 } },
    choices: [
      {
        category: 'check_in',
        preview: 'Hey stranger',
        fullMessage: 'Hey stranger! Been a while. How have you been?',
        tone: 'friendly',
        expectedEffects: { affection: 1 },
        riskLevel: 'safe',
        couldBackfire: false,
        likelyResponses: ['catch_up', 'neutral_greeting']
      },
      {
        category: 'apology',
        preview: 'Sorry for being distant',
        fullMessage: 'I\'m sorry I\'ve been so distant. Racing season has been crazy but that\'s no excuse. I miss talking to you.',
        tone: 'apologetic',
        expectedEffects: { trust: 3, affection: 2 },
        riskLevel: 'mild',
        couldBackfire: true,
        likelyResponses: ['understanding', 'slightly_hurt']
      }
    ]
  },
  {
    context: 'long_absence',
    applicableWhen: { daysSinceContact: { min: 21 } },
    choices: [
      {
        category: 'apology',
        preview: 'I\'ve been terrible...',
        fullMessage: 'I know I\'ve been terrible at keeping in touch. Life got crazy but that\'s not fair to you. Can we start fresh?',
        tone: 'apologetic',
        expectedEffects: { trust: -2, affection: 1 },
        riskLevel: 'risky',
        couldBackfire: true,
        likelyResponses: ['hurt', 'understanding', 'cold']
      }
    ]
  },
  {
    context: 'partner_upset',
    applicableWhen: { mood: ['sad', 'angry', 'worried'] },
    choices: [
      {
        category: 'support',
        preview: 'I can tell something\'s wrong',
        fullMessage: 'I can tell something\'s bothering you. I\'m here if you want to talk about it.',
        tone: 'supportive',
        expectedEffects: { trust: 3, affection: 2 },
        riskLevel: 'safe',
        couldBackfire: false,
        likelyResponses: ['opens_up', 'appreciative']
      },
      {
        category: 'make_plans',
        preview: 'Let me cheer you up',
        fullMessage: 'You seem down. Let me take you out and cheer you up. Anywhere you want to go.',
        tone: 'supportive',
        expectedEffects: { affection: 4, mood: 'better' },
        riskLevel: 'mild',
        couldBackfire: true,
        likelyResponses: ['grateful', 'wants_space']
      }
    ]
  }
]

// ============================================
// GIFT INTEGRATION
// ============================================

export interface GiftMessage {
  giftId: string
  giftName: string
  message: string
  occasion?: string
}

// ============================================
// INVITATION INTEGRATION
// ============================================

export interface InvitationMessage {
  eventId: string
  eventName: string
  eventDate: { week: number; day: number; year: number }
  eventType: string
  message: string
  isVip: boolean
}

// ============================================
// CONFIGURATION
// ============================================

export const MESSAGING_CONFIG = {
  // Message limits
  maxMessagesPerDay: 10,          // Don't spam
  optimalMessagesPerWeek: 5,      // Sweet spot for relationship
  
  // Response times
  npcResponseDelayMinutes: { min: 5, max: 120 },
  
  // Relationship effects
  noContactDecayDays: 7,          // Start losing points after this
  decayPerWeek: 2,                // Affection loss per week of no contact
  
  // Conversation stages
  staleConversationDays: 14,      // When conversation becomes "stale"
  
  // Risk thresholds
  backfireChanceRisky: 0.3,       // 30% chance risky messages backfire
  backfireBold: 0.5,              // 50% for bold messages
  
  // Mood impacts
  goodMessageMoodBoost: 5,
  badMessageMoodDrop: 10,
  
  // Trust building
  trustGainPerPositiveConvo: 2,
  trustLossPerNegativeConvo: 5
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getApplicableStarters(context: ConversationContext): ConversationStarter[] {
  return CONVERSATION_STARTERS.filter(starter => {
    const { applicableWhen } = starter
    
    if (applicableWhen.daysSinceContact) {
      const { min, max } = applicableWhen.daysSinceContact
      if (min !== undefined && context.daysSinceLastContact < min) return false
      if (max !== undefined && context.daysSinceLastContact > max) return false
    }
    
    if (applicableWhen.recentEvent) {
      const hasEvent = context.recentEvents.some(e => 
        e.event === applicableWhen.recentEvent && e.weeksAgo <= 1
      )
      if (!hasEvent) return false
    }
    
    if (applicableWhen.mood) {
      if (!applicableWhen.mood.includes(context.currentMood.overall)) return false
    }
    
    if (applicableWhen.relationshipMin !== undefined) {
      if (context.relationshipLevel < applicableWhen.relationshipMin) return false
    }
    
    if (applicableWhen.relationshipMax !== undefined) {
      if (context.relationshipLevel > applicableWhen.relationshipMax) return false
    }
    
    return true
  })
}

export function getTemplateForContext(
  category: MessageChoiceCategory,
  context: ConversationContext
): MessageTemplate | undefined {
  return MESSAGE_TEMPLATES.find(template => {
    if (template.category !== category) return false
    
    if (template.requiresContext) {
      const req = template.requiresContext
      if (req.relationshipMin !== undefined && context.relationshipLevel < req.relationshipMin) return false
      if (req.relationshipMax !== undefined && context.relationshipLevel > req.relationshipMax) return false
      if (req.moodIn && !req.moodIn.includes(context.currentMood.overall)) return false
    }
    
    return true
  })
}

export function fillTemplate(template: string, variables: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }
  return result
}
