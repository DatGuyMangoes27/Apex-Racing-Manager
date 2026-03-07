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
  
  // Photo attachment details (when hasPhoto is true)
  photoUrl?: string                // Resolved image path
  photoCategory?: PhotoMessageCategory
  photoCaption?: string            // Text that accompanies the photo (shown as message content)
  photoContactPortrait?: boolean   // True if the photo is a selfie using the contact's portrait
  
  // Session tracking
  isSessionEnd?: boolean           // True if this message ends a conversation session
}

// ============================================
// PHOTO MESSAGE TYPES
// ============================================

export type PhotoMessageCategory =
  | 'selfie'           // Contact sends a selfie (uses their portrait)
  | 'scenery'          // Travel/scenic "saw this, thought of you"
  | 'kids'             // Photos of children (uses child portrait)
  | 'food'             // Restaurant/cooking pics
  | 'activity'         // Hobby/workout/outing pics
  | 'couple_memory'    // Old photo together, throwback
  | 'pet'              // Pet pictures
  | 'work'             // At work/career achievements
  | 'event'            // Party/social event pics
  | 'race_day'         // At the track, watching the race

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
  
  // ── Topic history (conversation memory) ──
  topicHistory?: Array<{
    topic: string              // e.g., 'finances', 'spa_race', 'relationship'
    week: number
    year: number
    sentiment: 'positive' | 'neutral' | 'negative'
    summary?: string           // Brief summary for AI context
  }>
  
  // ── Session tracking (time cost & limits) ──
  exchangesToday?: number       // Exchanges in current day (for session limits)
  lastExchangeDay?: number      // Day of last exchange
  totalExchanges?: number       // All-time exchange count
  
  // ── NPC follow-up tracking ──
  npcFollowUpPending?: boolean  // NPC wants to follow up
  playerGhostedDays?: number    // How many days since player last replied
  nudgeSent?: boolean           // Has NPC already sent a nudge for ghosting
  
  // ── Pinned status ──
  isPinned?: boolean
  
  // ── Cached AI-generated message choices ──
  // Prevents regeneration on component remount / app refresh
  cachedChoices?: {
    choices: Array<{
      id: string
      category: string
      preview: string
      fullMessage: string
      tone: string
      intentTag?: string
      riskLevel: string
      couldBackfire?: boolean
      expectedEffects?: Record<string, unknown>
      likelyResponses?: string[]
    }>
    generatedForDay: { week: number; day: number; year: number }
    afterMessageId: string  // ID of last message when choices were generated
    isAIGenerated?: boolean  // Whether choices came from AI (true) or template fallback (false/undefined)
  }
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
  
  // Intent tag — visible label so the player knows the purpose of this reply
  // Optional for backward compat with cached/template choices; UI derives it from category+tone when missing.
  intentTag?: MessageIntentTag
  
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

// Intent tags — high-level labels shown on reply choices so players
// can clearly see what pursuing each option signals.
export type MessageIntentTag =
  | 'flirting'            // Actively flirting / showing romantic interest
  | 'romance'             // Deepening an existing romantic relationship
  | 'friendly'            // General friendly chat
  | 'supportive'          // Offering emotional support / encouragement
  | 'professional'        // Business / work-related
  | 'banter'              // Playful teasing / joking around
  | 'confrontational'     // Picking a fight / calling someone out
  | 'apologetic'          // Apologising / making amends
  | 'planning'            // Making plans / scheduling
  | 'curious'             // Asking questions / showing interest in them
  | 'news'                // Sharing or reacting to news

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
  | 'decline'

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
  
  // Conversation flow control
  shouldEndConversation?: boolean  // AI thinks this is a natural stopping point
  
  // Topic tracking (from AI)
  topicTag?: string             // Extracted topic tag for conversation memory e.g. "race_results", "relationship_future"
  
  // Emotional state
  emotionalReaction: 'delighted' | 'happy' | 'pleased' | 'neutral' | 'disappointed' | 'upset' | 'angry'
  
  // Action request (NPC offers an invite, favor, introduction, etc.)
  actionRequest?: {
    type: 'social_invite' | 'dinner_invite' | 'date_request' | 'introduction' | 'sponsor_appearance' | 'career_favor' | 'race_tickets' | 'advice' | 'media_request' | 'charity_ask'
    description: string
    timeCost?: number
    moneyCost?: number
    suggestedDay?: number         // 1-7 (Mon-Sun) - when the event should happen
    relationshipReward?: number
  } | null
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
        intentTag: 'news',
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
        intentTag: 'romance',
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
        intentTag: 'supportive',
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
        intentTag: 'friendly',
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
        intentTag: 'apologetic',
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
        intentTag: 'apologetic',
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
        intentTag: 'supportive',
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
        intentTag: 'planning',
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
  
  // ── Time costs ──
  timeCostPerExchange: 0.25,      // Hours (15 min) per exchange (your msg + their reply)
  maxExchangesPerSession: 6,      // NPC wraps up after this many exchanges per day
  
  // Response times
  npcResponseDelayMinutes: { min: 5, max: 120 },
  
  // Relationship effects
  noContactDecayDays: 7,          // Start losing points after this
  decayPerWeek: 2,                // Affection loss per week of no contact
  
  // ── Ghosting consequences ──
  ghostingThresholds: {
    partner: { warnDays: 2, trustDropPerDay: 2 },
    family: { warnDays: 4, trustDropPerDay: 1 },
    friend: { warnDays: 5, trustDropPerDay: 0.5 },
    team_staff: { warnDays: 3, trustDropPerDay: 1 },
    business: { warnDays: 5, trustDropPerDay: 0.5 },
    rival_driver: { warnDays: 999, trustDropPerDay: 0 },  // Rivals don't care
    sponsor_rep: { warnDays: 3, trustDropPerDay: 1 },
    team_principal: { warnDays: 7, trustDropPerDay: 0.3 },
    rival: { warnDays: 999, trustDropPerDay: 0 },
    potential_date: { warnDays: 3, trustDropPerDay: 1.5 },
  } as Record<string, { warnDays: number; trustDropPerDay: number }>,
  
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
  trustLossPerNegativeConvo: 5,
  
  // ── NPC check-in frequency by contact type (weekly probability) ──
  checkInChance: {
    partner: 0.60,
    family: 0.50,
    friend: 0.20,       // 40% if relationship > 70
    business: 0.10,
    rival: 0.05,
    potential_date: 0.15,
    team_staff: 0.25,
    rival_driver: 0.15,
    sponsor_rep: 0.10,
    team_principal: 0.05,
  } as Record<string, number>,
  
  // ── Reputation-gated contact tiers ──
  reputationContactTiers: [
    { minRep: 0,  maxRep: 25,  contactTypes: ['friend', 'business'], wealthLevels: ['modest', 'comfortable'] },
    { minRep: 25, maxRep: 50,  contactTypes: ['friend', 'business'], wealthLevels: ['comfortable', 'affluent'] },
    { minRep: 50, maxRep: 75,  contactTypes: ['friend', 'business'], wealthLevels: ['affluent', 'wealthy'] },
    { minRep: 75, maxRep: 100, contactTypes: ['friend', 'business'], wealthLevels: ['wealthy', 'elite'] },
  ],
}

// ============================================
// PERSONALITY → MESSAGING BEHAVIOR MAP
// ============================================

export interface MessagingBehavior {
  frequency: 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
  messageLength: 'very_short' | 'short' | 'medium' | 'long' | 'very_long'
  emojiUsage: 'none' | 'rare' | 'moderate' | 'frequent' | 'excessive'
  responseSpeed: 'instant' | 'fast' | 'normal' | 'slow' | 'very_slow'
  formality: 'very_formal' | 'formal' | 'casual' | 'very_casual' | 'slang'
}

/**
 * Map pre-gen personality traits to texting behavior.
 * Traits from the contact's `traits[]` array are looked up here.
 * Multiple traits are merged (later traits override earlier ones).
 */
export const PERSONALITY_MESSAGING_MAP: Record<string, Partial<MessagingBehavior>> = {
  // Frequency
  extrovert:        { frequency: 'high', messageLength: 'medium', emojiUsage: 'frequent' },
  introvert:        { frequency: 'low', messageLength: 'long', emojiUsage: 'rare' },
  social_butterfly: { frequency: 'very_high', messageLength: 'short', emojiUsage: 'excessive' },
  reserved:         { frequency: 'very_low', messageLength: 'medium', emojiUsage: 'none' },
  outgoing:         { frequency: 'high', emojiUsage: 'moderate' },
  shy:              { frequency: 'low', responseSpeed: 'slow' },
  
  // Response speed
  anxious:          { responseSpeed: 'instant', frequency: 'high' },
  busy:             { responseSpeed: 'very_slow', frequency: 'low' },
  laid_back:        { responseSpeed: 'slow', formality: 'very_casual' },
  impatient:        { responseSpeed: 'fast', messageLength: 'very_short' },
  patient:          { responseSpeed: 'normal', messageLength: 'long' },
  
  // Message style
  formal:           { formality: 'formal', emojiUsage: 'none', messageLength: 'medium' },
  casual:           { formality: 'casual', emojiUsage: 'moderate' },
  dramatic:         { messageLength: 'very_long', emojiUsage: 'frequent', frequency: 'high' },
  brief:            { messageLength: 'very_short', emojiUsage: 'none' },
  verbose:          { messageLength: 'very_long', emojiUsage: 'rare' },
  witty:            { messageLength: 'medium', formality: 'casual' },
  serious:          { formality: 'formal', emojiUsage: 'none', messageLength: 'medium' },
  
  // Personality-driven
  supportive:       { frequency: 'medium', messageLength: 'medium', responseSpeed: 'fast' },
  ambitious:        { formality: 'formal', messageLength: 'short', responseSpeed: 'slow' },
  romantic:         { emojiUsage: 'frequent', messageLength: 'long', frequency: 'high' },
  independent:      { frequency: 'low', responseSpeed: 'slow', messageLength: 'short' },
  practical:        { messageLength: 'short', formality: 'casual', emojiUsage: 'rare' },
  glamorous:        { emojiUsage: 'frequent', formality: 'casual', frequency: 'medium' },
  private:          { frequency: 'very_low', messageLength: 'short', emojiUsage: 'none' },
  adventurous:      { frequency: 'medium', emojiUsage: 'moderate', formality: 'very_casual' },
  nurturing:        { frequency: 'high', messageLength: 'long', responseSpeed: 'fast' },
  jealous:          { frequency: 'very_high', responseSpeed: 'instant', messageLength: 'medium' },
  materialistic:    { formality: 'casual', emojiUsage: 'frequent' },
  controlling:      { frequency: 'very_high', responseSpeed: 'instant', messageLength: 'long' },
  secretive:        { frequency: 'very_low', messageLength: 'very_short', emojiUsage: 'none' },
  
  // Age/style-driven (for general contacts)
  young:            { emojiUsage: 'excessive', formality: 'slang', messageLength: 'short' },
  mature:           { emojiUsage: 'rare', formality: 'formal', messageLength: 'medium' },
  professional:     { formality: 'formal', emojiUsage: 'none', responseSpeed: 'normal' },
  creative:         { messageLength: 'long', formality: 'casual', emojiUsage: 'moderate' },
}

/**
 * Compute the messaging style for a contact based on their traits.
 */
export function computeMessagingStyle(traits: string[]): MessagingBehavior {
  const defaults: MessagingBehavior = {
    frequency: 'medium',
    messageLength: 'medium',
    emojiUsage: 'moderate',
    responseSpeed: 'normal',
    formality: 'casual',
  }
  
  const merged = { ...defaults }
  for (const trait of traits) {
    const behavior = PERSONALITY_MESSAGING_MAP[trait.toLowerCase().replace(/\s+/g, '_')]
    if (behavior) {
      Object.assign(merged, behavior)
    }
  }
  return merged
}

// ============================================
// NPC SESSION FAREWELL TEMPLATES
// ============================================

export const SESSION_FAREWELL_TEMPLATES: Record<string, string[]> = {
  partner: [
    "I should let you focus. Talk later? ❤️",
    "Gotta run, but thinking of you!",
    "Love chatting but I need to head out. Miss you!",
  ],
  family: [
    "Alright, I'll let you get back to it. Take care!",
    "Should go - talk soon! Love you.",
    "Okay, enough chatting! Go win some races!",
  ],
  friend: [
    "Gotta bounce! Catch up later?",
    "I should get back to work 😅 Chat soon!",
    "This was fun! Let's grab drinks sometime.",
  ],
  business: [
    "I have a meeting shortly. Let's continue this later.",
    "Good catching up. I'll be in touch.",
    "Thanks for the chat. Talk soon.",
  ],
  team_staff: [
    "Back to the factory floor! We'll pick this up later.",
    "Good chat, boss. I'll get on that.",
    "Right, better get back to work. Cheers!",
  ],
  rival_driver: [
    "Save it for the track 😏",
    "Gotta go, my trainer's here. See you out there.",
    "Later. Don't get too comfortable up there.",
  ],
  sponsor_rep: [
    "Great chatting! I'll follow up with the team.",
    "Need to jump on another call. Let's reconnect soon.",
    "Thanks for your time. The board will be pleased.",
  ],
  team_principal: [
    "My engineers are waiting. Good talk.",
    "I should go manage my own circus. Talk soon.",
    "Interesting chat. Let's keep the lines open.",
  ],
  default: [
    "I should go! Talk later!",
    "Gotta run. Chat soon!",
    "Nice chatting. Catch you later!",
  ],
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
