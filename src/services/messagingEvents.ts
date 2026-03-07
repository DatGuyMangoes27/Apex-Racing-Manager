// ============================================
// MESSAGING EVENTS SERVICE (Deep Immersion Edition)
// ============================================
// Event-based NPC message generation triggers.
// NPCs text the player based on 50+ game events creating a
// living social circle. All messages go through Gemini with
// full context when available, with template fallbacks.

import type { ContactInfo, ContactType, MessagingState } from '@/types/personalLife'
import type { TextMessage, MessageTone, Conversation, PhotoMessageCategory } from '@/data/messaging-config'
import { MESSAGING_CONFIG } from '@/data/messaging-config'
import { shouldAttachPhoto, pickPhotoCategory, MAX_PHOTOS_PER_WEEK, pickRandomCaption } from '@/data/photo-messages-config'
import { generateContactPhoto, type PhotoGenerationResult } from '@/services/photoMessageGenerator'

export type GameEventType =
  // Race (12)
  | 'race_win' | 'race_podium' | 'race_pole' | 'race_fastest_lap'
  | 'race_dnf' | 'race_crash' | 'race_recovery' | 'race_wet_heroics'
  | 'race_first_points' | 'consecutive_wins' | 'consecutive_podiums' | 'worst_result'
  // Championship (8)
  | 'championship_lead_taken' | 'championship_lead_lost'
  | 'championship_top3_entered' | 'championship_top3_lost'
  | 'championship_clinched' | 'championship_eliminated'
  | 'championship_milestone_points' | 'championship_tightest_fight'
  // Team (10)
  | 'sponsor_signed' | 'sponsor_lost' | 'sponsor_warning'
  | 'facility_upgrade' | 'staff_hired' | 'staff_departed'
  | 'board_warning' | 'board_praise' | 'car_unveiled' | 'manufacturing_complete'
  // Financial (6)
  | 'cash_crisis' | 'big_prize_payout' | 'cost_cap_warning'
  | 'investment_return' | 'property_purchased' | 'loan_approved'
  // Media (5)
  | 'viral_post' | 'controversy' | 'press_fallout'
  | 'reputation_milestone' | 'fan_milestone'
  // Personal (7)
  | 'player_birthday' | 'partner_anniversary' | 'child_milestone'
  | 'injury_sustained' | 'injury_recovered' | 'vacation_started' | 'hobby_achievement'
  // Seasonal (6)
  | 'pre_season' | 'mid_season_check' | 'post_season'
  | 'winter_break' | 'new_year' | 'holiday_greetings'
  // Periodic
  | 'weekly_checkin'

export interface GameEvent {
  type: GameEventType | string
  week: number
  year: number
  /** Optional data about the event for richer AI context */
  detail?: string
}

// ============================================
// MESSAGE TEMPLATES BY EVENT × CONTACT TYPE
// ============================================

interface MessageTemplate {
  content: string
  tone: MessageTone
  minRelationship?: number
  contactTypes?: ContactType[]
}

const EVENT_TEMPLATES: Record<string, MessageTemplate[]> = {
  // ── Race Results ──
  race_win: [
    { content: "Congratulations on the win! That was incredible to watch! 🏆", tone: 'excited', contactTypes: ['partner', 'family', 'friend'] },
    { content: "Great result today. That's exactly the kind of performance we need.", tone: 'professional', contactTypes: ['business', 'sponsor_rep'] },
    { content: "Not bad out there today. Don't let it go to your head.", tone: 'casual', contactTypes: ['rival', 'rival_driver'] },
    { content: "I'm so proud of you! That was amazing!", tone: 'warm', minRelationship: 60, contactTypes: ['partner'] },
    { content: "Winner winner! 🎉 Drinks are on you!", tone: 'playful', contactTypes: ['friend'] },
    { content: "Saw the race. Well deserved win!", tone: 'friendly', contactTypes: ['friend', 'potential_date'] },
    { content: "Brilliant drive today, boss. The car was singing out there.", tone: 'excited', contactTypes: ['team_staff'] },
    { content: "Good result. Enjoy it while it lasts.", tone: 'casual', contactTypes: ['rival_driver'] },
    { content: "The board is thrilled with that result. Great for the brand.", tone: 'professional', contactTypes: ['sponsor_rep'] },
    { content: "Impressive. I had my eye on you today.", tone: 'professional', contactTypes: ['team_principal'] },
  ],

  race_podium: [
    { content: "Great race! Podium finish, that's something to be proud of.", tone: 'supportive', contactTypes: ['partner', 'family', 'friend'] },
    { content: "Solid result today. Keep that momentum going!", tone: 'professional', contactTypes: ['business', 'sponsor_rep'] },
    { content: "Another podium! You're on a roll 💪", tone: 'excited', contactTypes: ['partner', 'friend'] },
    { content: "Good job keeping it together out there. Consistent.", tone: 'casual', contactTypes: ['team_staff'] },
    { content: "Nice job, but you know second isn't first.", tone: 'casual', contactTypes: ['rival_driver'] },
  ],

  race_pole: [
    { content: "POLE POSITION! That qualifying lap was incredible! 🔥", tone: 'excited', contactTypes: ['partner', 'family', 'friend'] },
    { content: "Pole! Now go convert it tomorrow.", tone: 'excited', contactTypes: ['team_staff'] },
    { content: "Front row. Impressive lap. See you at the start.", tone: 'casual', contactTypes: ['rival_driver'] },
  ],

  race_fastest_lap: [
    { content: "Fastest lap! You were flying out there!", tone: 'excited', contactTypes: ['friend', 'family'] },
    { content: "That fastest lap was a beauty. Pure pace.", tone: 'excited', contactTypes: ['team_staff'] },
  ],

  race_crash: [
    { content: "Are you okay?! I just saw what happened! 😰", tone: 'concerned', contactTypes: ['partner', 'family'] },
    { content: "Just heard about the crash. Hope you're alright!", tone: 'concerned', contactTypes: ['friend', 'potential_date'] },
    { content: "Tough break today. Hope you're not hurt.", tone: 'supportive', contactTypes: ['business', 'sponsor_rep'] },
    { content: "Please tell me you're safe", tone: 'concerned', minRelationship: 50, contactTypes: ['partner'] },
    { content: "Saw the incident. You OK? That looked nasty.", tone: 'concerned', contactTypes: ['rival_driver', 'team_principal'] },
    { content: "The car's in bits but that's what insurance is for. How are YOU?", tone: 'concerned', contactTypes: ['team_staff'] },
  ],

  race_dnf: [
    { content: "Tough day at the office. Don't let it get you down.", tone: 'supportive', contactTypes: ['partner', 'family', 'friend'] },
    { content: "That's racing sometimes. There'll be better days.", tone: 'casual', contactTypes: ['friend'] },
    { content: "Disappointing result. The season is long though.", tone: 'professional', contactTypes: ['business', 'sponsor_rep'] },
    { content: "I'm already looking at the data. We'll figure out what went wrong.", tone: 'professional', contactTypes: ['team_staff'] },
    { content: "Shame. I was hoping for a proper fight.", tone: 'casual', contactTypes: ['rival_driver'] },
  ],

  race_recovery: [
    { content: "From that far back?! What a drive! 🔥", tone: 'excited', contactTypes: ['friend', 'family', 'partner'] },
    { content: "That recovery drive was heroic. Best I've seen all year.", tone: 'excited', contactTypes: ['team_staff'] },
    { content: "OK I have to admit, that comeback was impressive.", tone: 'casual', contactTypes: ['rival_driver'] },
  ],

  race_wet_heroics: [
    { content: "You in the wet are something else! Rain master! 🌧️", tone: 'excited', contactTypes: ['friend', 'family', 'partner'] },
    { content: "Your wet weather pace is a serious weapon.", tone: 'excited', contactTypes: ['team_staff'] },
  ],

  // ── Championship Events ──
  championship_clinched: [
    { content: "CHAMPION!! I can't believe it! I'm so happy for you! 🏆🏆🏆", tone: 'excited', contactTypes: ['partner', 'family'] },
    { content: "Congratulations on the championship! What an achievement!", tone: 'excited', contactTypes: ['friend', 'business', 'potential_date'] },
    { content: "World champion. Well, I suppose you earned it.", tone: 'neutral', contactTypes: ['rival', 'rival_driver'] },
    { content: "We did it! CHAMPION! I'm so proud of this team!", tone: 'excited', contactTypes: ['team_staff'] },
    { content: "Championship! The board is absolutely ecstatic.", tone: 'excited', contactTypes: ['sponsor_rep'] },
    { content: "Congratulations. Well-deserved championship.", tone: 'professional', contactTypes: ['team_principal'] },
  ],

  championship_lead_taken: [
    { content: "You're leading the championship! This is huge!", tone: 'excited', contactTypes: ['partner', 'family', 'friend'] },
    { content: "P1 in the standings. Now the real pressure starts.", tone: 'professional', contactTypes: ['team_staff'] },
    { content: "Enjoy the top while you can. I'm coming for you.", tone: 'casual', contactTypes: ['rival_driver'] },
    { content: "Leading the championship! Our brand visibility is through the roof.", tone: 'excited', contactTypes: ['sponsor_rep'] },
  ],

  championship_lead_lost: [
    { content: "Don't worry about the standings. Lots of racing left.", tone: 'supportive', contactTypes: ['partner', 'family', 'friend'] },
    { content: "We need to regroup. I have some ideas on where we're losing time.", tone: 'professional', contactTypes: ['team_staff'] },
    { content: "Told you I was coming 😏", tone: 'playful', contactTypes: ['rival_driver'] },
  ],

  championship_eliminated: [
    { content: "I'm sorry. But what a season you've had regardless.", tone: 'supportive', contactTypes: ['partner', 'family', 'friend'] },
    { content: "Mathematically out, but we learned a lot this year.", tone: 'professional', contactTypes: ['team_staff'] },
  ],

  championship_tightest_fight: [
    { content: "This championship fight is INSANE. I can barely watch! 😱", tone: 'excited', contactTypes: ['friend', 'family', 'partner'] },
    { content: "It's going to the wire. Every point counts from here.", tone: 'professional', contactTypes: ['team_staff'] },
    { content: "May the best driver win. This is what racing is about.", tone: 'casual', contactTypes: ['rival_driver'] },
  ],

  // ── Team Events ──
  sponsor_signed: [
    { content: "Heard about the new sponsor deal. Big moves!", tone: 'friendly', contactTypes: ['friend', 'business'] },
    { content: "Congrats on the sponsorship! Things are coming together.", tone: 'supportive', contactTypes: ['partner', 'family'] },
    { content: "Welcome aboard! Looking forward to a great partnership.", tone: 'professional', contactTypes: ['sponsor_rep'] },
    { content: "New sponsor means more budget. This is great news.", tone: 'excited', contactTypes: ['team_staff'] },
  ],

  sponsor_lost: [
    { content: "Heard about the sponsor pulling out. That's rough.", tone: 'concerned', contactTypes: ['friend', 'family'] },
    { content: "Losing that sponsor is a blow. We need to adjust the budget.", tone: 'concerned', contactTypes: ['team_staff'] },
  ],

  facility_upgrade: [
    { content: "The new facility is looking amazing! Progress!", tone: 'excited', contactTypes: ['friend', 'partner'] },
    { content: "Upgrade complete! Can't wait to see the results on track.", tone: 'excited', contactTypes: ['team_staff'] },
  ],

  staff_hired: [
    { content: "Welcome to the new team member! Growing the squad.", tone: 'excited', contactTypes: ['team_staff'] },
  ],

  staff_departed: [
    { content: "I heard about the staffing change. Everything OK?", tone: 'concerned', contactTypes: ['friend', 'partner'] },
    { content: "Losing a colleague is never easy. We'll manage.", tone: 'supportive', contactTypes: ['team_staff'] },
  ],

  board_warning: [
    { content: "I heard the board isn't happy. Is everything alright?", tone: 'concerned', contactTypes: ['partner', 'family'] },
    { content: "The board pressure is intense right now. Hang in there.", tone: 'supportive', contactTypes: ['team_staff'] },
  ],

  board_praise: [
    { content: "Heard the board is really happy! Well done!", tone: 'excited', contactTypes: ['partner', 'friend'] },
    { content: "Board mood is great. We should ride this momentum.", tone: 'excited', contactTypes: ['team_staff'] },
  ],

  // ── Financial Events ──
  cash_crisis: [
    { content: "I heard things are tough financially. I'm here if you need to talk.", tone: 'concerned', contactTypes: ['partner', 'family', 'friend'] },
    { content: "Budget situation is critical. We need an emergency meeting.", tone: 'concerned', contactTypes: ['team_staff'] },
    { content: "We've noticed some budget concerns. Happy to discuss options.", tone: 'professional', contactTypes: ['sponsor_rep'] },
  ],

  big_prize_payout: [
    { content: "That prize money! Time to celebrate! 🎉", tone: 'excited', contactTypes: ['friend', 'partner'] },
    { content: "Nice payout. That'll help the budget considerably.", tone: 'excited', contactTypes: ['team_staff'] },
  ],

  investment_return: [
    { content: "Your investment paid off! Smart move!", tone: 'excited', contactTypes: ['friend', 'business'] },
  ],

  property_purchased: [
    { content: "New place?! When's the housewarming? 🏠", tone: 'excited', contactTypes: ['friend'] },
    { content: "Congrats on the new property! Moving up in the world.", tone: 'friendly', contactTypes: ['partner', 'family'] },
  ],

  // ── Media Events ──
  viral_post: [
    { content: "Your post blew up! Everyone's talking about it!", tone: 'excited', contactTypes: ['friend', 'partner'] },
    { content: "Great social engagement. The brand visibility is excellent.", tone: 'professional', contactTypes: ['sponsor_rep'] },
  ],

  controversy: [
    { content: "I saw the news... are you okay? What happened?", tone: 'concerned', contactTypes: ['partner', 'family', 'friend'] },
    { content: "The media situation is concerning. We should talk strategy.", tone: 'professional', contactTypes: ['team_staff'] },
    { content: "The board has noticed the controversy. We need to discuss.", tone: 'concerned', contactTypes: ['sponsor_rep'] },
  ],

  reputation_milestone: [
    { content: "Your reputation is growing! People are noticing you!", tone: 'excited', contactTypes: ['friend', 'business'] },
    { content: "I'm proud of how far you've come.", tone: 'warm', contactTypes: ['partner', 'family'] },
  ],

  // ── Personal Events ──
  player_birthday: [
    { content: "Happy Birthday!! 🎂🎉 Hope it's an amazing day!", tone: 'excited', contactTypes: ['friend', 'family', 'business', 'potential_date'] },
    { content: "Happy birthday, my love ❤️ I have something special planned for you!", tone: 'romantic', contactTypes: ['partner'] },
    { content: "Happy birthday, boss! The team has a little something for you.", tone: 'warm', contactTypes: ['team_staff'] },
    { content: "Happy birthday! Another year older, another year slower? 😏", tone: 'playful', contactTypes: ['rival_driver'] },
    { content: "Happy birthday! Wishing you a great year ahead.", tone: 'professional', contactTypes: ['sponsor_rep', 'team_principal'] },
  ],

  partner_anniversary: [
    { content: "Happy anniversary! Can't believe how fast time flies ❤️", tone: 'romantic', contactTypes: ['partner'] },
  ],

  child_milestone: [
    { content: "The kids are growing up so fast! Treasure these moments.", tone: 'warm', contactTypes: ['partner', 'family'] },
  ],

  injury_sustained: [
    { content: "Oh no, I heard about the injury. Please take care of yourself!", tone: 'concerned', contactTypes: ['partner', 'family', 'friend'] },
    { content: "Get well soon. The team needs you, but health comes first.", tone: 'supportive', contactTypes: ['team_staff'] },
    { content: "Hope you recover quickly. Racing isn't the same without you.", tone: 'supportive', contactTypes: ['rival_driver'] },
  ],

  injury_recovered: [
    { content: "So glad you're back to full health! 💪", tone: 'excited', contactTypes: ['partner', 'family', 'friend'] },
    { content: "Welcome back! The car's been waiting for you.", tone: 'excited', contactTypes: ['team_staff'] },
    { content: "Good to see you're back. Now I can beat you fair and square.", tone: 'playful', contactTypes: ['rival_driver'] },
  ],

  vacation_started: [
    { content: "Enjoy your vacation! You deserve it! 🏖️", tone: 'friendly', contactTypes: ['friend', 'family'] },
    { content: "Send me pictures! I'm so jealous!", tone: 'playful', contactTypes: ['friend'] },
  ],

  // ── Seasonal Events ──
  pre_season: [
    { content: "New season! Excited for you. Good luck out there!", tone: 'excited', contactTypes: ['partner', 'family', 'friend'] },
    { content: "Looking forward to a productive season together.", tone: 'professional', contactTypes: ['business', 'sponsor_rep'] },
    { content: "Let's make this our year. The car is looking strong.", tone: 'excited', contactTypes: ['team_staff'] },
    { content: "See you on track. May the best driver win.", tone: 'casual', contactTypes: ['rival_driver'] },
  ],

  mid_season_check: [
    { content: "How's the season going? Feels like it's flying by!", tone: 'friendly', contactTypes: ['friend', 'family'] },
    { content: "Halfway through! How are you holding up?", tone: 'supportive', contactTypes: ['partner'] },
  ],

  post_season: [
    { content: "What a season! Take some time to rest and recharge.", tone: 'supportive', contactTypes: ['partner', 'family'] },
    { content: "Season's done. When do we celebrate?", tone: 'playful', contactTypes: ['friend'] },
    { content: "Season review time. I'll have the data ready for Monday.", tone: 'professional', contactTypes: ['team_staff'] },
    { content: "Good season. Enjoy the break.", tone: 'casual', contactTypes: ['rival_driver'] },
  ],

  winter_break: [
    { content: "Enjoying the offseason? Don't get too comfy! 😄", tone: 'playful', contactTypes: ['friend'] },
    { content: "Hope you're getting some rest. You earned it ❤️", tone: 'warm', contactTypes: ['partner'] },
  ],

  new_year: [
    { content: "Happy New Year! 🎆 Here's to an amazing year ahead!", tone: 'excited', contactTypes: ['friend', 'family', 'partner', 'business', 'potential_date'] },
    { content: "Happy New Year! Let's make it a championship one.", tone: 'excited', contactTypes: ['team_staff'] },
    { content: "Happy New Year! Ready for another battle?", tone: 'casual', contactTypes: ['rival_driver'] },
  ],

  holiday_greetings: [
    { content: "Happy holidays! Hope you're spending time with loved ones 🎄", tone: 'warm', contactTypes: ['friend', 'family', 'business'] },
    { content: "Merry Christmas! Can't wait to see you ❤️", tone: 'romantic', contactTypes: ['partner'] },
  ],

  // ── Periodic ──
  weekly_checkin: [
    { content: "Hey! How's everything going? Haven't heard from you in a while.", tone: 'friendly', contactTypes: ['friend'] },
    { content: "Missing you! When are you free?", tone: 'warm', minRelationship: 60, contactTypes: ['partner'] },
    { content: "Just checking in. Hope all is well!", tone: 'friendly', contactTypes: ['potential_date'] },
    { content: "How are the preparations going for the next race?", tone: 'casual', contactTypes: ['friend', 'family'] },
    { content: "Quick update on my end - how's your week going?", tone: 'friendly', contactTypes: ['business'] },
    { content: "Any updates on the development plan? Happy to chat.", tone: 'professional', contactTypes: ['team_staff'] },
    { content: "How's life in the fast lane?", tone: 'casual', contactTypes: ['rival_driver'] },
    { content: "Hope the team is going well. Any news?", tone: 'professional', contactTypes: ['team_principal'] },
    { content: "Just touching base. The brand team had some ideas.", tone: 'professional', contactTypes: ['sponsor_rep'] },
  ],
}

// ============================================
// MAIN PROCESSING FUNCTION
// ============================================

/**
 * Generate NPC-initiated messages based on game events that happened this week.
 * Uses Gemini AI for personality-aware messages with template fallbacks.
 * Called once per week from the advanceWeek simulation loop.
 */
export async function processWeeklyMessagingEvents(
  messaging: MessagingState,
  week: number,
  year: number,
  events: GameEvent[],
  playerContext?: {
    playerName: string
    recentRaceResult?: string
    teamName?: string
    championshipPosition?: number
    currentWeek?: number
    currentDay?: number
    /** Children data for photo messages — passed from career state */
    children?: Array<{ id: string; firstName: string; portraitId?: string; age?: number }>
    hasChildren?: boolean
  }
): Promise<Array<{ conversationId: string; contactId: string; message: TextMessage; actionRequest?: { type: string; description: string; suggestedDay?: number; suggestedWeek?: number; eventName?: string; venue?: string; timeCost?: number; moneyCost?: number } | null }>> {
  const results: Array<{ conversationId: string; contactId: string; message: TextMessage; actionRequest?: { type: string; description: string; suggestedDay?: number; suggestedWeek?: number; eventName?: string; venue?: string; timeCost?: number; moneyCost?: number } | null }> = []
  const contacts = messaging.contacts || []

  if (contacts.length === 0) return results

  // Track photo generation count per batch
  let photoCount = 0
  const hasChildren = playerContext?.hasChildren || (playerContext?.children?.length || 0) > 0

  // Dynamically import AI generation (may not be available)
  let generateAI: typeof import('@/services/dialogueAI').generateNpcInitiatedMessage | null = null
  try {
    const { generateNpcInitiatedMessage } = await import('@/services/dialogueAI')
    generateAI = generateNpcInitiatedMessage
  } catch {
    console.warn('[MessagingEvents] AI generation unavailable, using templates only')
  }

  // ── Process each game event ──
  for (const event of events) {
    const templates = EVENT_TEMPLATES[event.type]
    if (!templates || templates.length === 0) continue

    for (const contact of contacts) {
      const eligible = templates.filter(t => {
        if (t.contactTypes && !t.contactTypes.includes(contact.type)) return false
        if (t.minRelationship && contact.relationshipLevel < t.minRelationship) return false
        return true
      })

      if (eligible.length === 0) continue

      // Probability-based: not every contact messages every time
      const responseChance = getResponseChance(contact, event.type)
      if (Math.random() > responseChance) continue

      const template = eligible[Math.floor(Math.random() * eligible.length)]
      
      // Try AI generation first, fall back to template
      let messageContent = personalizeMessage(template.content, contact, event)
      let messageTone = template.tone
      
      let actionRequest: { type: string; description: string; suggestedDay?: number; suggestedWeek?: number; eventName?: string; venue?: string; timeCost?: number; moneyCost?: number } | null = null
      
      if (generateAI) {
        try {
          // Get recent conversation history for context
          const conv = messaging.conversations[`conv_${contact.id}`] || messaging.conversations[`conv-${contact.id}`]
          const recentHistory = conv?.messages?.slice(-4).map(m => 
            `${m.sender === 'player' ? 'Player' : contact.name}: ${m.content}`
          )
          
          const aiResult = await generateAI(
            contact,
            event.type,
            event.detail,
            recentHistory,
            playerContext
          )
          if (aiResult) {
            messageContent = aiResult.message
            messageTone = aiResult.tone as any
            if (aiResult.actionRequest) {
              actionRequest = aiResult.actionRequest
            }
            console.log(`[MessagingEvents] AI-generated message from ${contact.name} (${event.type})${actionRequest ? ' [with invitation]' : ''}`)
          }
        } catch (e) {
          // Silently fall back to template
          console.warn(`[MessagingEvents] AI failed for ${contact.name}, using template`)
        }
      }

      const conversationId = `conv_${contact.id}`
      const message: TextMessage = {
        id: `msg-npc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        conversationId,
        sender: 'npc',
        content: messageContent,
        tone: messageTone,
        timestamp: { week, day: 1 + Math.floor(Math.random() * 5), hour: 8 + Math.floor(Math.random() * 12), year },
        isRead: false,
      }

      // ── Photo attachment (event-triggered) ──
      if (photoCount < MAX_PHOTOS_PER_WEEK) {
        const photoDecision = shouldAttachPhoto(contact.type as ContactType, event.type)
        if (photoDecision.shouldAttach) {
          const category = photoDecision.forcedCategory || pickPhotoCategory(contact.type, hasChildren)
          
          // Build child context if needed
          let childPortraitPath: string | undefined
          let childName: string | undefined
          if (category === 'kids' && playerContext?.children?.length) {
            const randomChild = playerContext.children[Math.floor(Math.random() * playerContext.children.length)]
            childName = randomChild.firstName
            if (randomChild.portraitId) {
              const { getChildPortrait } = await import('@/utils/generated-assets')
              childPortraitPath = getChildPortrait(randomChild.portraitId)
            }
          }

          try {
            const photoResult = await generateContactPhoto(contact, category, {
              childPortraitPath,
              childName,
              trackName: playerContext?.teamName ? undefined : undefined,
              teamName: playerContext?.teamName,
            })

            if (photoResult) {
              message.hasPhoto = true
              message.photoUrl = photoResult.photoUrl
              message.photoCategory = photoResult.photoCategory
              message.photoCaption = photoDecision.captionOverrides
                ? photoDecision.captionOverrides[Math.floor(Math.random() * photoDecision.captionOverrides.length)]
                : photoResult.photoCaption
              message.photoContactPortrait = photoResult.photoContactPortrait
              // Use caption as the message content for photo messages
              message.content = message.photoCaption || messageContent
              photoCount++
              console.log(`[MessagingEvents] 📷 Photo attached to message from ${contact.name} (${category})`)
            }
          } catch (e) {
            console.warn(`[MessagingEvents] Photo generation failed for ${contact.name}:`, e)
          }
        }
      }

      results.push({ conversationId, contactId: contact.id, message, actionRequest })
    }
  }

  // ── Weekly check-in messages (relationship-scaled) ──
  for (const contact of contacts) {
    // Skip contacts who already got an event message this week
    if (results.some(r => r.contactId === contact.id)) continue
    
    const checkInChance = getCheckInChance(contact)
    if (Math.random() > checkInChance) continue

    const checkinTemplates = EVENT_TEMPLATES['weekly_checkin']?.filter(t => {
      if (t.contactTypes && !t.contactTypes.includes(contact.type)) return false
      if (t.minRelationship && contact.relationshipLevel < t.minRelationship) return false
      return true
    }) || []

    if (checkinTemplates.length === 0) continue

    const template = checkinTemplates[Math.floor(Math.random() * checkinTemplates.length)]
    
    // Try AI generation for check-ins too
    let checkInContent = personalizeMessage(template.content, contact)
    let checkInTone = template.tone
    let checkInActionRequest: { type: string; description: string; suggestedDay?: number; suggestedWeek?: number; eventName?: string; venue?: string; timeCost?: number; moneyCost?: number } | null = null
    
    if (generateAI) {
      try {
        const conv = messaging.conversations[`conv_${contact.id}`] || messaging.conversations[`conv-${contact.id}`]
        const recentHistory = conv?.messages?.slice(-4).map(m => 
          `${m.sender === 'player' ? 'Player' : contact.name}: ${m.content}`
        )
        
        const aiResult = await generateAI(
          contact,
          'weekly_checkin',
          undefined,
          recentHistory,
          playerContext
        )
        if (aiResult) {
          checkInContent = aiResult.message
          checkInTone = aiResult.tone as any
          if (aiResult.actionRequest) {
            checkInActionRequest = aiResult.actionRequest
          }
        }
      } catch {
        // Fall back to template silently
      }
    }
    
    const conversationId = `conv_${contact.id}`
    const message: TextMessage = {
      id: `msg-npc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      conversationId,
      sender: 'npc',
      content: checkInContent,
      tone: checkInTone,
      timestamp: { week, day: 1 + Math.floor(Math.random() * 7), hour: 9 + Math.floor(Math.random() * 10), year },
      isRead: false,
    }

    // ── Photo attachment (weekly check-in) ──
    if (photoCount < MAX_PHOTOS_PER_WEEK) {
      const photoDecision = shouldAttachPhoto(contact.type as ContactType)
      if (photoDecision.shouldAttach) {
        const category = pickPhotoCategory(contact.type, hasChildren)

        let childPortraitPath: string | undefined
        let childName: string | undefined
        if (category === 'kids' && playerContext?.children?.length) {
          const randomChild = playerContext.children[Math.floor(Math.random() * playerContext.children.length)]
          childName = randomChild.firstName
          if (randomChild.portraitId) {
            try {
              const { getChildPortrait } = await import('@/utils/generated-assets')
              childPortraitPath = getChildPortrait(randomChild.portraitId)
            } catch { /* ignore */ }
          }
        }

        try {
          const photoResult = await generateContactPhoto(contact, category, {
            childPortraitPath,
            childName,
            teamName: playerContext?.teamName,
          })

          if (photoResult) {
            message.hasPhoto = true
            message.photoUrl = photoResult.photoUrl
            message.photoCategory = photoResult.photoCategory
            message.photoCaption = photoResult.photoCaption
            message.photoContactPortrait = photoResult.photoContactPortrait
            message.content = message.photoCaption || checkInContent
            photoCount++
            console.log(`[MessagingEvents] 📷 Check-in photo from ${contact.name} (${category})`)
          }
        } catch (e) {
          console.warn(`[MessagingEvents] Check-in photo failed for ${contact.name}:`, e)
        }
      }
    }

    results.push({ conversationId, contactId: contact.id, message, actionRequest: checkInActionRequest })
  }

  // ── NPC follow-up logic ──
  for (const contact of contacts) {
    if (results.some(r => r.contactId === contact.id)) continue

    const conv = messaging.conversations[`conv_${contact.id}`] || messaging.conversations[`conv-${contact.id}`]
    if (!conv) continue

    // Check if NPC was awaiting response and player ghosted
    if (conv.awaitingResponse && !conv.nudgeSent) {
      const ghostDays = conv.playerGhostedDays || 0
      if (ghostDays >= 2 && Math.random() < 0.5) {
        // Try AI-generated nudge first
        let nudgeContent: string | null = null
        
        if (generateAI) {
          try {
            const recentHistory = conv.messages?.slice(-4).map(m => 
              `${m.sender === 'player' ? 'Player' : contact.name}: ${m.content}`
            )
            const aiResult = await generateAI(
              contact,
              'ghosted_nudge',
              `Player hasn't responded in ${ghostDays} days`,
              recentHistory,
              playerContext
            )
            if (aiResult) nudgeContent = aiResult.message
          } catch { /* fall back */ }
        }
        
        if (!nudgeContent) {
          const nudgeMessages: Record<string, string[]> = {
            partner: ["Hey, everything okay? You've been quiet...", "Miss you... is everything alright? 💙"],
            family: ["Hey, just checking in. Haven't heard from you.", "You there? Getting worried!"],
            friend: ["Hellooo? Earth to you! 😄", "Hey stranger, you alive?"],
            team_staff: ["Just following up on our last chat. Let me know when you're free.", "Any thoughts on what we discussed?"],
            rival_driver: ["Cat got your tongue? 😏", "Too busy to reply? I get it, losing is tough."],
            default: ["Hey, just following up!", "Hi! Did you see my last message?"],
          }
          const pool = nudgeMessages[contact.type] || nudgeMessages.default
          nudgeContent = pool[Math.floor(Math.random() * pool.length)]
        }

        const conversationId = `conv_${contact.id}`
        const message: TextMessage = {
          id: `msg-npc-nudge-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          conversationId,
          sender: 'npc',
          content: nudgeContent,
          tone: contact.type === 'rival_driver' ? 'playful' : 'concerned',
          timestamp: { week, day: Math.min(7, (conv.lastMessageTime?.day || 1) + 2), hour: 10 + Math.floor(Math.random() * 8), year },
          isRead: false,
        }
        results.push({ conversationId, contactId: contact.id, message })
      }
    }

    // NPC follow-up: if player responded and NPC wants to continue
    if (conv.npcFollowUpPending && Math.random() < 0.45) {
      let followUpContent: string | null = null
      
      if (generateAI) {
        try {
          const recentHistory = conv.messages?.slice(-4).map(m => 
            `${m.sender === 'player' ? 'Player' : contact.name}: ${m.content}`
          )
          const aiResult = await generateAI(
            contact,
            'follow_up',
            'Continuing a previous conversation',
            recentHistory,
            playerContext
          )
          if (aiResult) followUpContent = aiResult.message
        } catch { /* fall back */ }
      }
      
      if (!followUpContent) {
        const followUpMessages: string[] = [
          "Oh by the way, I forgot to mention...",
          "One more thing I wanted to ask you about...",
          "That reminds me -",
          "I've been thinking about what you said...",
        ]
        followUpContent = followUpMessages[Math.floor(Math.random() * followUpMessages.length)]
      }

      const conversationId = `conv_${contact.id}`
      const message: TextMessage = {
        id: `msg-npc-followup-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        conversationId,
        sender: 'npc',
        content: followUpContent,
        tone: 'friendly',
        timestamp: { week, day: 1 + Math.floor(Math.random() * 5), hour: 9 + Math.floor(Math.random() * 10), year },
        isRead: false,
      }
      results.push({ conversationId, contactId: contact.id, message })
    }
  }

  return results
}

// ============================================
// PARTNER-SPECIFIC MESSAGE GENERATION
// ============================================

/**
 * Generate partner-specific messages based on relationship state.
 * Can be used for periodic partner check-ins, romantic gestures, etc.
 * Partner messages are also generated via processWeeklyMessagingEvents,
 * but this function provides a dedicated API for partner-only messaging.
 */
export async function generatePartnerMessages(
  messaging: MessagingState,
  week: number,
  year: number,
  playerContext?: {
    playerName: string
    teamName?: string
    recentRaceResult?: string
  }
): Promise<Array<{ conversationId: string; contactId: string; message: TextMessage }>> {
  const results: Array<{ conversationId: string; contactId: string; message: TextMessage }> = []
  const contacts = messaging.contacts || []
  const partner = contacts.find(c => c.type === 'partner')

  if (!partner) return results

  const conv = messaging.conversations[`conv_${partner.id}`] || messaging.conversations[`conv-${partner.id}`]
  const relationshipLevel = partner.relationshipLevel || 50

  // Dynamically import AI generation
  let generateAI: typeof import('@/services/dialogueAI').generateNpcInitiatedMessage | null = null
  try {
    const { generateNpcInitiatedMessage } = await import('@/services/dialogueAI')
    generateAI = generateNpcInitiatedMessage
  } catch {
    // AI unavailable
  }

  // Partner-specific periodic messages based on relationship health
  const partnerTemplates: { content: string; tone: MessageTone; minRelationship: number }[] = [
    { content: "I was just thinking about you ❤️", tone: 'romantic', minRelationship: 60 },
    { content: "Can't wait to see you later!", tone: 'warm', minRelationship: 50 },
    { content: "How's your day going?", tone: 'friendly', minRelationship: 30 },
    { content: "Miss you! When are you home?", tone: 'warm', minRelationship: 55 },
    { content: "I made dinner plans for us this weekend 😊", tone: 'excited', minRelationship: 65 },
    { content: "Hey, we need to talk about something when you're free.", tone: 'neutral', minRelationship: 20 },
    { content: "Just saw the sweetest thing and it reminded me of you 💕", tone: 'romantic', minRelationship: 70 },
    { content: "You've been so busy lately... I understand but I miss our time together.", tone: 'concerned', minRelationship: 40 },
  ]

  // Filter eligible templates
  const eligible = partnerTemplates.filter(t => relationshipLevel >= t.minRelationship)
  if (eligible.length === 0) return results

  // Chance-based: partner doesn't message every single week
  const messageChance = Math.min(0.8, 0.3 + relationshipLevel * 0.005)
  if (Math.random() > messageChance) return results

  const template = eligible[Math.floor(Math.random() * eligible.length)]

  let messageContent = template.content
  let messageTone = template.tone

  // Try AI generation for more natural messages
  if (generateAI) {
    try {
      const recentHistory = (conv as any)?.messages?.slice(-4).map((m: any) =>
        `${m.sender === 'player' ? 'Player' : partner.name}: ${m.content}`
      )
      const aiResult = await generateAI(
        partner,
        'partner_checkin',
        `Relationship level: ${relationshipLevel}`,
        recentHistory,
        playerContext
      )
      if (aiResult) {
        messageContent = aiResult.message
        messageTone = aiResult.tone as any
      }
    } catch {
      // Fall back to template
    }
  }

  const conversationId = `conv_${partner.id}`
  const message: TextMessage = {
    id: `msg-partner-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    conversationId,
    sender: 'npc',
    content: messageContent,
    tone: messageTone,
    timestamp: { week, day: 1 + Math.floor(Math.random() * 7), hour: 8 + Math.floor(Math.random() * 14), year },
    isRead: false,
  }

  results.push({ conversationId, contactId: partner.id, message })
  return results
}

// ============================================
// HELPERS
// ============================================

/**
 * Determine how likely a contact is to message about a specific event.
 */
function getResponseChance(contact: ContactInfo, eventType: string): number {
  const base: Record<string, number> = {
    partner: 0.85,
    family: 0.70,
    friend: 0.40,
    business: 0.25,
    potential_date: 0.20,
    rival: 0.15,
    team_staff: 0.60,
    rival_driver: 0.25,
    sponsor_rep: 0.35,
    team_principal: 0.15,
  }

  let chance = base[contact.type] ?? 0.20

  // High-impact events get higher response rates
  const highImpact = ['race_crash', 'championship_clinched', 'race_win', 'player_birthday', 'injury_sustained']
  if (highImpact.includes(eventType)) {
    chance = Math.min(1, chance + 0.30)
  }

  // Medium-impact events
  const medImpact = ['race_podium', 'championship_lead_taken', 'sponsor_signed', 'viral_post', 'new_year']
  if (medImpact.includes(eventType)) {
    chance = Math.min(1, chance + 0.15)
  }

  // Relationship level modifiers
  if (contact.relationshipLevel > 70) chance = Math.min(1, chance + 0.15)
  if (contact.relationshipLevel < 30) chance = Math.max(0.05, chance - 0.15)

  return chance
}

/**
 * Get check-in probability for a contact (weekly, no event trigger needed).
 * Uses the config-defined probabilities with relationship level bonus.
 */
function getCheckInChance(contact: ContactInfo): number {
  let chance = MESSAGING_CONFIG.checkInChance[contact.type] ?? 0.10

  // Close friends get a boost
  if (contact.type === 'friend' && contact.relationshipLevel > 70) {
    chance = Math.min(1, chance + 0.20)
  }
  
  // Very new contacts rarely check in
  if (contact.relationshipLevel < 20) {
    chance = Math.max(0.02, chance * 0.3)
  }

  return chance
}

/**
 * Personalize template messages with contact and event data.
 */
function personalizeMessage(content: string, contact: ContactInfo, event?: GameEvent): string {
  let result = content
  // Inject event detail if available
  if (event?.detail) {
    result = result.replace('{detail}', event.detail)
  }
  // Could add name-based personalization in the future
  return result
}

/**
 * Pick a random contact, weighted towards closer relationships.
 */
function pickRandomContact(contacts: ContactInfo[]): ContactInfo | null {
  if (contacts.length === 0) return null
  const weighted = contacts.map(c => ({ contact: c, weight: Math.max(10, c.relationshipLevel) }))
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0)
  let roll = Math.random() * totalWeight
  for (const w of weighted) {
    roll -= w.weight
    if (roll <= 0) return w.contact
  }
  return contacts[0]
}

// ============================================
// CONTACT-INITIATED GAMEPLAY REQUESTS
// ============================================

import type { ContactRequest, ContactRequestType } from '@/types/personalLife'

/**
 * Request templates mapped by contact type → request types.
 * Each template has conditions, costs, and rewards.
 */
const REQUEST_TEMPLATES: Array<{
  type: ContactRequestType
  contactTypes: string[]
  requiredOccupations?: string[]   // If set, contact's occupation must contain one of these strings
  minRelationship: number
  chancePerWeek: number  // 0-1
  description: (contactName: string) => string
  timeCost: number
  moneyCost?: number
  relationshipReward: number
  secondaryReward?: string
  expiresInWeeks: number
}> = [
  // ── Friend / Family requests ──
  {
    type: 'race_tickets',
    contactTypes: ['friend', 'family'],
    minRelationship: 40,
    chancePerWeek: 0.08,
    description: (name) => `${name} is asking if you can get them paddock passes for the next race weekend.`,
    timeCost: 0.5,
    moneyCost: 500,
    relationshipReward: 8,
    secondaryReward: '+5 public image (seen with friends)',
    expiresInWeeks: 2,
  },
  {
    type: 'dinner_invite',
    contactTypes: ['friend', 'family', 'partner'],
    minRelationship: 30,
    chancePerWeek: 0.12,
    description: (name) => `${name} wants to grab dinner this week. "Haven't seen you in ages!"`,
    timeCost: 3,
    moneyCost: 200,
    relationshipReward: 10,
    secondaryReward: '-5 stress',
    expiresInWeeks: 1,
  },
  {
    type: 'social_invite',
    contactTypes: ['friend', 'business'],
    minRelationship: 35,
    chancePerWeek: 0.06,
    description: (name) => `${name} invited you to a networking event this weekend. Could be good for connections.`,
    timeCost: 4,
    moneyCost: 0,
    relationshipReward: 5,
    secondaryReward: '+3 reputation, chance to meet new contacts',
    expiresInWeeks: 1,
  },
  // ── Partner requests ──
  {
    type: 'date_request',
    contactTypes: ['partner', 'potential_date'],
    minRelationship: 35,
    chancePerWeek: 0.15,
    description: (name) => `${name} wants to plan a date night. "We should do something special together."`,
    timeCost: 4,
    moneyCost: 300,
    relationshipReward: 12,
    secondaryReward: '+5 romance, -8 stress',
    expiresInWeeks: 1,
  },
  // ── Sponsor requests ──
  {
    type: 'sponsor_appearance',
    contactTypes: ['sponsor_rep'],
    minRelationship: 20,
    chancePerWeek: 0.10,
    description: (name) => `${name} from your sponsor wants you to attend a brand event. "It would really help our visibility."`,
    timeCost: 5,
    moneyCost: 0,
    relationshipReward: 8,
    secondaryReward: '+sponsor satisfaction, possible bonus',
    expiresInWeeks: 2,
  },
  // ── Staff requests ──
  {
    type: 'contract_talk',
    contactTypes: ['team_staff'],
    minRelationship: 25,
    chancePerWeek: 0.04,
    description: (name) => `${name} wants to discuss their contract terms privately. "Can we have a chat when you have a moment?"`,
    timeCost: 1,
    moneyCost: 0,
    relationshipReward: 6,
    secondaryReward: '+staff morale',
    expiresInWeeks: 3,
  },
  {
    type: 'advice',
    contactTypes: ['team_staff', 'friend', 'family'],
    minRelationship: 45,
    chancePerWeek: 0.06,
    description: (name) => `${name} is going through a tough time and wants your advice. "I could really use your perspective on something."`,
    timeCost: 1.5,
    moneyCost: 0,
    relationshipReward: 10,
    secondaryReward: '+trust',
    expiresInWeeks: 2,
  },
  // ── Rival requests ──
  {
    type: 'wager',
    contactTypes: ['rival_driver'],
    minRelationship: 30,
    chancePerWeek: 0.05,
    description: (name) => `${name} challenged you to a bet on the next race. "Loser buys dinner?"`,
    timeCost: 0,
    moneyCost: 1000,
    relationshipReward: 5,
    secondaryReward: 'Win: +$2000 + bragging rights. Lose: -$1000',
    expiresInWeeks: 1,
  },
  // ── Introduction requests ──
  {
    type: 'introduction',
    contactTypes: ['friend', 'business', 'sponsor_rep'],
    minRelationship: 50,
    chancePerWeek: 0.04,
    description: (name) => `${name} wants to introduce you to someone they think you'd get along with. "I know this great person you should meet."`,
    timeCost: 1,
    moneyCost: 0,
    relationshipReward: 5,
    secondaryReward: 'New contact added',
    expiresInWeeks: 3,
  },
  // ── Media requests (journalists only) ──
  {
    type: 'media_request',
    contactTypes: ['business'],
    requiredOccupations: ['journalist', 'reporter', 'editor', 'media', 'press', 'writer', 'blogger', 'columnist'],
    minRelationship: 20,
    chancePerWeek: 0.06,
    description: (name) => `${name} from the press is asking for a quick comment on recent events. "Just a few minutes of your time?"`,
    timeCost: 0.5,
    moneyCost: 0,
    relationshipReward: 4,
    secondaryReward: '+reputation from positive press',
    expiresInWeeks: 1,
  },
  // ── Charity requests ──
  {
    type: 'charity_ask',
    contactTypes: ['friend', 'business'],
    minRelationship: 40,
    chancePerWeek: 0.03,
    description: (name) => `${name} is organizing a charity fundraiser and wants your support. "Would you be willing to make an appearance?"`,
    timeCost: 3,
    moneyCost: 2000,
    relationshipReward: 8,
    secondaryReward: '+10 public image, +press coverage',
    expiresInWeeks: 2,
  },
]

/**
 * Generate contact-initiated requests during weekly processing.
 * Returns new requests to add to the messaging state.
 */
export function generateWeeklyContactRequests(
  contacts: ContactInfo[],
  currentWeek: number,
  currentYear: number,
  existingPendingRequests: ContactRequest[]
): ContactRequest[] {
  const newRequests: ContactRequest[] = []
  
  // Don't generate too many at once
  const maxNewRequests = 2
  const activePending = existingPendingRequests.filter(r => r.status === 'pending').length
  if (activePending >= 4) return [] // Already too many pending
  
  for (const template of REQUEST_TEMPLATES) {
    if (newRequests.length >= maxNewRequests) break
    
    // Find eligible contacts for this template
    const eligible = contacts.filter(c => {
      // Must match contact type
      if (!template.contactTypes.includes(c.type)) return false
      // Must meet minimum relationship
      if (c.relationshipLevel < template.minRelationship) return false
      // If template requires specific occupations, check them
      if (template.requiredOccupations && template.requiredOccupations.length > 0) {
        const contactOccupation = (c.occupation || '').toLowerCase()
        if (!contactOccupation || !template.requiredOccupations.some(occ => contactOccupation.includes(occ))) {
          return false
        }
      }
      return true
    })
    
    if (eligible.length === 0) continue
    
    // Roll for chance
    if (Math.random() > template.chancePerWeek) continue
    
    // Pick a random eligible contact
    const contact = pickRandomContact(eligible)
    if (!contact) continue
    
    // Don't create duplicate requests from same contact
    const alreadyHasRequest = existingPendingRequests.some(
      r => r.contactId === contact.id && r.status === 'pending'
    )
    if (alreadyHasRequest) continue
    
    const request: ContactRequest = {
      id: `req_${currentWeek}_${currentYear}_${Math.random().toString(36).substr(2, 6)}`,
      contactId: contact.id,
      type: template.type,
      description: template.description(contact.name.split(' ')[0]),
      timeCost: template.timeCost,
      moneyCost: template.moneyCost,
      relationshipReward: template.relationshipReward,
      secondaryReward: template.secondaryReward,
      expiresWeek: currentWeek + template.expiresInWeeks,
      expiresYear: currentYear,
      status: 'pending',
      wagerAmount: template.type === 'wager' ? template.moneyCost : undefined,
      wagerCondition: template.type === 'wager' ? 'Beat them in the next race' : undefined,
    }
    
    newRequests.push(request)
  }
  
  return newRequests
}

// ============================================
// MESSAGE IMPACT ON STATS
// ============================================

export interface MessagingStatEffects {
  stressChange: number    // Positive = more stress, negative = less
  moraleChange: number    // Positive = better mood
  reputationChange: number
  partnerHappinessChange: number
  teamMoraleChange: number
  reasons: string[]       // Human-readable reasons for the changes
}

/**
 * Calculate the stat effects of messaging activity for the past week.
 * Called during weekly processing to apply soft consequences.
 */
export function calculateMessagingImpact(
  messaging: MessagingState,
  currentWeek: number,
  _currentYear: number
): MessagingStatEffects {
  const effects: MessagingStatEffects = {
    stressChange: 0,
    moraleChange: 0,
    reputationChange: 0,
    partnerHappinessChange: 0,
    teamMoraleChange: 0,
    reasons: [],
  }
  
  const contacts = messaging.contacts || []
  const conversations = messaging.conversations || {}
  
  // ── Partner ghosting penalty ──
  const partner = contacts.find(c => c.type === 'partner')
  if (partner) {
    const partnerConvId = `conv_${partner.id}`
    const partnerConv = conversations[partnerConvId] as any
    const ghostedDays = partnerConv?.playerGhostedDays || 0
    
    if (ghostedDays >= 5) {
      effects.partnerHappinessChange -= 8
      effects.stressChange += 3
      effects.reasons.push(`Partner unhappy - no messages for ${ghostedDays} days`)
    } else if (ghostedDays >= 3) {
      effects.partnerHappinessChange -= 4
      effects.reasons.push(`Partner feeling ignored - ${ghostedDays} days without contact`)
    }
    
    // Active chatting bonus — count messages from the current week
    const partnerMsgs = (partnerConv?.messages || []) as any[]
    const exchangesThisWeek = partnerMsgs.filter((m: any) => 
      m?.timestamp?.week === currentWeek && m?.isPlayer
    ).length
    if (exchangesThisWeek >= 3) {
      effects.partnerHappinessChange += 5
      effects.stressChange -= 2
      effects.reasons.push('Active messaging with partner - relationship thriving')
    }
  }
  
  // ── Team staff contact bonus/penalty ──
  const staffContacts = contacts.filter(c => c.type === 'team_staff')
  let staffRecentChats = 0
  for (const staff of staffContacts) {
    const convId = `conv_${staff.id}`
    const conv = conversations[convId] as any
    if (conv?.messages?.length > 0) {
      const lastMsg = conv.messages[conv.messages.length - 1] // Most recent
      if (lastMsg?.timestamp) {
        const msgWeek = lastMsg.timestamp.week || 0
        if (Math.abs(msgWeek - currentWeek) <= 1) {
          staffRecentChats++
        }
      }
    }
  }
  
  if (staffContacts.length > 0) {
    if (staffRecentChats >= 2) {
      effects.teamMoraleChange += 3
      effects.reasons.push('Good communication with team - morale boost')
    } else if (staffContacts.length >= 3 && staffRecentChats === 0) {
      effects.teamMoraleChange -= 2
      effects.reasons.push('No contact with team staff this week')
    }
  }
  
  // ── Social isolation penalty (no messages with anyone) ──
  let anyRecentActivity = false
  for (const conv of Object.values(conversations) as any[]) {
    if (conv?.messages?.length > 0 && conv.messages[conv.messages.length - 1]?.timestamp?.week === currentWeek) {
      anyRecentActivity = true
      break
    }
  }
  
  if (!anyRecentActivity && contacts.length >= 5) {
    effects.stressChange += 5
    effects.moraleChange -= 3
    effects.reasons.push('Social isolation - no messaging activity this week')
  }
  
  // ── Declined requests penalty ──
  const pendingRequests = messaging.pendingRequests || []
  const expiredThisWeek = pendingRequests.filter(
    r => r.status === 'expired' && r.expiresWeek === currentWeek
  )
  for (const expired of expiredThisWeek) {
    const contact = contacts.find(c => c.id === expired.contactId)
    if (contact) {
      effects.stressChange += 1
      effects.reasons.push(`${contact.name}'s request expired unanswered`)
    }
  }
  
  const declinedRecently = pendingRequests.filter(r => r.status === 'declined')
  if (declinedRecently.length >= 3) {
    effects.reputationChange -= 2
    effects.reasons.push('Declined too many contact requests - reputation hit')
  }
  
  // ── Positive messaging with friends reduces stress ──
  const friendContacts = contacts.filter(c => c.type === 'friend')
  let friendChats = 0
  for (const friend of friendContacts) {
    const convId = `conv_${friend.id}`
    const conv = conversations[convId] as any
    if (conv?.messages?.length > 0 && conv.messages[conv.messages.length - 1]?.timestamp?.week === currentWeek) {
      friendChats++
    }
  }
  
  if (friendChats >= 2) {
    effects.stressChange -= 4
    effects.moraleChange += 2
    effects.reasons.push('Good social life - chatting with friends')
  }
  
  return effects
}
