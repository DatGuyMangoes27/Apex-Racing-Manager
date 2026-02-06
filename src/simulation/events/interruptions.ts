// ============================================
// MID-WEEK INTERRUPTION EVENTS
// ============================================
// Random events that pop up during the day, forcing the driver-owner
// to make quick decisions. These create the "something might happen
// any day" feeling that keeps non-race days engaging.
//
// Design principles:
// 1. Force a driver-vs-owner trade-off when possible
// 2. Have immediate, visible consequences
// 3. Be varied enough to feel surprising
// 4. Don't happen every day (target: ~30% chance per non-race day)

export interface InterruptionEvent {
  id: string
  title: string
  description: string
  category: 'racing' | 'business' | 'life'
  urgency: 'low' | 'medium' | 'high'
  /** The two choices the player faces (the core tension) */
  choices: InterruptionChoice[]
  /** Conditions that must be true for this interruption to be eligible */
  conditions?: InterruptionCondition[]
  /** Minimum career week for this to trigger */
  minWeek?: number
}

export interface InterruptionChoice {
  id: string
  text: string
  /** Which "hat" this choice serves */
  roleServed: 'racing' | 'business' | 'life'
  /** Time cost in hours (deducted from day budget) */
  timeCost: number
  /** Effects applied immediately */
  effects: Record<string, number>
  /** Optional follow-up event chain ID */
  chainEventId?: string
}

export interface InterruptionCondition {
  stat: string
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq'
  value: number
}

export interface GeneratedInterruption {
  event: InterruptionEvent
  resolvedTitle: string
  resolvedDescription: string
}

// ============================================
// INTERRUPTION TEMPLATES
// ============================================

const INTERRUPTION_TEMPLATES: Omit<InterruptionEvent, 'id'>[] = [
  // ============================================
  // DRIVER vs OWNER TRADE-OFFS
  // ============================================
  {
    title: 'Sponsor Wants an Urgent Meeting',
    description: 'Your title sponsor has called requesting an immediate meeting to discuss their brand visibility. You were planning to work on race setup.',
    category: 'business',
    urgency: 'high',
    choices: [
      {
        id: 'attend_meeting',
        text: 'Attend the sponsor meeting',
        roleServed: 'business',
        timeCost: 3,
        effects: { sponsorSatisfaction: 5, reputation: 1 },
      },
      {
        id: 'decline_meeting',
        text: 'Decline — focus on race prep',
        roleServed: 'racing',
        timeCost: 0,
        effects: { sponsorSatisfaction: -8, stress: -5 },
      }
    ],
  },
  {
    title: 'Chief Engineer Needs Your Input',
    description: 'Your Chief Engineer has hit a critical decision point on the car development. They need you to review data and make a call, but you had fitness training planned.',
    category: 'business',
    urgency: 'medium',
    choices: [
      {
        id: 'review_data',
        text: 'Review the engineering data',
        roleServed: 'business',
        timeCost: 2,
        effects: { teamDevelopment: 3, morale: 2 },
      },
      {
        id: 'skip_review',
        text: 'Let them decide — hit the gym instead',
        roleServed: 'racing',
        timeCost: 0,
        effects: { fitness: 2, morale: -3 },
      }
    ],
    conditions: [{ stat: 'staffCount', operator: 'gte', value: 1 }],
  },
  {
    title: 'Last-Minute PR Opportunity',
    description: 'A major motorsport media outlet wants a quick interview for their prime-time slot tonight. Great exposure, but you\'d lose your evening rest.',
    category: 'business',
    urgency: 'medium',
    choices: [
      {
        id: 'do_interview',
        text: 'Take the interview — great for the brand',
        roleServed: 'business',
        timeCost: 2,
        effects: { reputation: 3, fanSentiment: 5, fatigue: 8 },
      },
      {
        id: 'decline_interview',
        text: 'Decline — rest is more important',
        roleServed: 'racing',
        timeCost: 0,
        effects: { fatigue: -5 },
      }
    ],
    conditions: [{ stat: 'reputation', operator: 'gte', value: 20 }],
  },
  
  // ============================================
  // BUSINESS vs LIFE TRADE-OFFS
  // ============================================
  {
    title: 'Partner Wants Quality Time',
    description: 'Your partner calls, feeling neglected with your busy schedule. They want to spend the evening together. But you have sponsor reports to review.',
    category: 'life',
    urgency: 'medium',
    choices: [
      {
        id: 'spend_time',
        text: 'Spend the evening with your partner',
        roleServed: 'life',
        timeCost: 3,
        effects: { stress: -10, partnerHappiness: 8 },
      },
      {
        id: 'work_instead',
        text: 'Apologize — the reports can\'t wait',
        roleServed: 'business',
        timeCost: 0,
        effects: { partnerHappiness: -5, sponsorSatisfaction: 2, stress: 5 },
      }
    ],
    conditions: [{ stat: 'hasPartner', operator: 'eq', value: 1 }],
  },
  {
    title: 'Staff Conflict Escalating',
    description: 'Two of your team members are in a heated disagreement that\'s affecting the workshop atmosphere. As owner, only you can mediate.',
    category: 'business',
    urgency: 'high',
    choices: [
      {
        id: 'mediate',
        text: 'Drop everything and mediate',
        roleServed: 'business',
        timeCost: 2,
        effects: { morale: 8, fatigue: 5 },
      },
      {
        id: 'ignore',
        text: 'Let them sort it out — you have bigger priorities',
        roleServed: 'racing',
        timeCost: 0,
        effects: { morale: -10, stress: 3 },
      }
    ],
    conditions: [{ stat: 'staffCount', operator: 'gte', value: 2 }],
  },
  
  // ============================================
  // RACING vs LIFE TRADE-OFFS
  // ============================================
  {
    title: 'Surprise Birthday Party',
    description: 'Friends have organized a surprise birthday party for someone close to you tonight. Going means missing your planned simulator session.',
    category: 'life',
    urgency: 'low',
    choices: [
      {
        id: 'go_party',
        text: 'Go to the party — life isn\'t just racing',
        roleServed: 'life',
        timeCost: 4,
        effects: { stress: -15, fatigue: 5, reputation: 1 },
      },
      {
        id: 'skip_party',
        text: 'Stay focused on the sim — the race matters more',
        roleServed: 'racing',
        timeCost: 0,
        effects: { stress: 5, confidence: 3 },
      }
    ],
  },
  {
    title: 'Unexpected Gym Partner',
    description: 'A former F1 fitness coach is at your gym today and offers a one-on-one session. But you promised to tour potential investors around the facility.',
    category: 'racing',
    urgency: 'medium',
    choices: [
      {
        id: 'train_with_coach',
        text: 'Train with the coach — rare opportunity',
        roleServed: 'racing',
        timeCost: 3,
        effects: { fitness: 5, confidence: 3 },
      },
      {
        id: 'do_investor_tour',
        text: 'Keep the investor appointment',
        roleServed: 'business',
        timeCost: 3,
        effects: { teamCash: 5000, reputation: 2 },
      }
    ],
  },
  
  // ============================================
  // FINANCIAL PRESSURE INTERRUPTIONS
  // ============================================
  {
    title: 'Emergency Parts Needed',
    description: 'Your mechanic reports a critical component failure. A replacement is available rush-order for $8,000, or you can wait 2 weeks for standard delivery.',
    category: 'business',
    urgency: 'high',
    choices: [
      {
        id: 'rush_order',
        text: 'Rush order — can\'t risk race readiness',
        roleServed: 'racing',
        timeCost: 1,
        effects: { teamCash: -8000, carReliability: 10 },
      },
      {
        id: 'wait',
        text: 'Standard delivery — save the money',
        roleServed: 'business',
        timeCost: 0,
        effects: { carReliability: -5 },
      }
    ],
  },
  {
    title: 'Charity Gala Invitation',
    description: 'You\'ve been invited to a high-profile charity gala tonight. Tickets are $2,000, but the networking could attract new sponsors.',
    category: 'life',
    urgency: 'low',
    choices: [
      {
        id: 'attend_gala',
        text: 'Attend the gala — invest in relationships',
        roleServed: 'life',
        timeCost: 5,
        effects: { cash: -2000, reputation: 4, sponsorSatisfaction: 3, fatigue: 10 },
      },
      {
        id: 'skip_gala',
        text: 'Skip it — early night instead',
        roleServed: 'racing',
        timeCost: 0,
        effects: { fatigue: -5 },
      }
    ],
    conditions: [{ stat: 'reputation', operator: 'gte', value: 30 }],
  },
  
  // ============================================
  // WEATHER / OPPORTUNITY INTERRUPTIONS
  // ============================================
  {
    title: 'Rain Session Available',
    description: 'Heavy rain just started and the local track has a last-minute open session. Rare wet-weather practice — but your board meeting is in 2 hours.',
    category: 'racing',
    urgency: 'medium',
    choices: [
      {
        id: 'rain_practice',
        text: 'Hit the track — wet practice is invaluable',
        roleServed: 'racing',
        timeCost: 3,
        effects: { confidence: 5, wetSkill: 3 },
      },
      {
        id: 'keep_meeting',
        text: 'The board comes first',
        roleServed: 'business',
        timeCost: 0,
        effects: { boardMood: 3 },
      }
    ],
  },
  {
    title: 'Fan Meet & Greet Request',
    description: 'Local fans have organized a small meet at the track entrance. Taking 30 minutes would mean the world to them, but your schedule is tight.',
    category: 'life',
    urgency: 'low',
    choices: [
      {
        id: 'meet_fans',
        text: 'Stop and meet the fans',
        roleServed: 'life',
        timeCost: 1,
        effects: { fanSentiment: 8, reputation: 2, fatigue: 2 },
      },
      {
        id: 'wave_past',
        text: 'Wave and keep moving — no time today',
        roleServed: 'business',
        timeCost: 0,
        effects: { fanSentiment: -2 },
      }
    ],
  },
  
  // ============================================
  // RIVAL / COMPETITIVE INTERRUPTIONS
  // ============================================
  {
    title: 'Rival\'s Trash Talk Goes Viral',
    description: 'Your championship rival posted a provocative comment about your team on social media. Your PR team says you should respond, but engaging might distract you.',
    category: 'business',
    urgency: 'medium',
    choices: [
      {
        id: 'respond',
        text: 'Fire back — can\'t let that slide',
        roleServed: 'business',
        timeCost: 1,
        effects: { fanSentiment: 5, stress: 8, reputation: 1 },
        chainEventId: 'media_escalation',
      },
      {
        id: 'ignore',
        text: 'Stay silent — let the results do the talking',
        roleServed: 'racing',
        timeCost: 0,
        effects: { confidence: 3, stress: -3 },
      }
    ],
    conditions: [{ stat: 'reputation', operator: 'gte', value: 15 }],
  },
  // ============================================
  // RIVAL DRAMA EVENTS
  // ============================================
  {
    title: 'Rival Trash Talk in Media',
    description: 'Your championship rival has given an interview claiming you only got your results because of team orders and a faster car. The media wants your response.',
    category: 'racing',
    urgency: 'medium',
    choices: [
      {
        id: 'fire_back',
        text: 'Fire back — let them know you mean business',
        roleServed: 'racing',
        timeCost: 1,
        effects: { confidence: 8, stress: 10, reputation: 2, fanSentiment: 5 },
        chainEventId: 'media_escalation',
      },
      {
        id: 'stay_classy',
        text: 'Take the high road — let your driving do the talking',
        roleServed: 'business',
        timeCost: 0,
        effects: { confidence: 2, stress: -3, reputation: 1 },
      }
    ],
    conditions: [{ stat: 'reputation', operator: 'gte', value: 20 }],
    minWeek: 8,
  },
  {
    title: 'Rival Poaching Your Engineer',
    description: 'Word has reached you that a rival team has been in contact with your lead engineer, offering a significantly higher salary. You need to act fast.',
    category: 'business',
    urgency: 'high',
    choices: [
      {
        id: 'counter_offer',
        text: 'Make a counter-offer — you can\'t lose them',
        roleServed: 'business',
        timeCost: 2,
        effects: { teamCash: -5000, morale: 5, boardMood: -3 },
      },
      {
        id: 'let_them_go',
        text: 'Wish them well — focus on developing new talent',
        roleServed: 'racing',
        timeCost: 0,
        effects: { morale: -8, boardMood: -5, cash: 0 },
      }
    ],
    conditions: [{ stat: 'staffCount', operator: 'gte', value: 2 }],
    minWeek: 10,
  },
  {
    title: 'Rival Driver Form Collapse',
    description: 'Your closest championship rival has had a terrible run of results. The media is asking if you feel the pressure is off. Be careful — complacency kills.',
    category: 'racing',
    urgency: 'low',
    choices: [
      {
        id: 'stay_hungry',
        text: 'Stay hungry — double down on preparation',
        roleServed: 'racing',
        timeCost: 2,
        effects: { fatigue: 5, confidence: 5, stress: -5 },
      },
      {
        id: 'capitalize_media',
        text: 'Use the momentum — schedule media appearances',
        roleServed: 'business',
        timeCost: 2,
        effects: { reputation: 3, fanSentiment: 5, fatigue: 3 },
      }
    ],
    conditions: [{ stat: 'reputation', operator: 'gte', value: 15 }],
    minWeek: 12,
  },
  {
    title: 'On-Track Incident Aftermath',
    description: 'After last race, there\'s been a lot of talk about a controversial on-track incident involving your car. The stewards have cleared you, but your rival\'s team is fuming.',
    category: 'racing',
    urgency: 'high',
    choices: [
      {
        id: 'apologize',
        text: 'Reach out to the rival team and clear the air',
        roleServed: 'business',
        timeCost: 2,
        effects: { stress: -8, reputation: 2, morale: 3 },
      },
      {
        id: 'stand_ground',
        text: 'Stand your ground — racing is racing',
        roleServed: 'racing',
        timeCost: 0,
        effects: { confidence: 8, stress: 5, fanSentiment: 3 },
      }
    ],
    conditions: [{ stat: 'reputation', operator: 'gte', value: 10 }],
    minWeek: 6,
  },
  {
    title: 'Championship Standings Update',
    description: 'After the latest round of results, the championship has tightened dramatically. Your team wants a strategy meeting, but you were planning to train.',
    category: 'racing',
    urgency: 'medium',
    choices: [
      {
        id: 'strategy_meeting',
        text: 'Attend the strategy meeting — the title fight needs planning',
        roleServed: 'business',
        timeCost: 3,
        effects: { confidence: 5, morale: 5, fatigue: 5 },
      },
      {
        id: 'keep_training',
        text: 'Stick to your training plan — you race, they strategize',
        roleServed: 'racing',
        timeCost: 0,
        effects: { fitness: 2, morale: -3 },
      }
    ],
    conditions: [{ stat: 'reputation', operator: 'gte', value: 10 }],
    minWeek: 15,
  },
  {
    title: 'Rival Sends Gift to Paddock',
    description: 'In a surprisingly classy move, your championship rival has sent over a bottle of champagne with a note: "May the best driver win." The paddock is watching your response.',
    category: 'life',
    urgency: 'low',
    choices: [
      {
        id: 'reciprocate',
        text: 'Send something back — show respect for the competition',
        roleServed: 'life',
        timeCost: 1,
        effects: { reputation: 3, confidence: 3, cash: -500, stress: -5 },
      },
      {
        id: 'ignore',
        text: 'Ignore it — mind games won\'t work on you',
        roleServed: 'racing',
        timeCost: 0,
        effects: { confidence: 5, stress: 3 },
      }
    ],
    conditions: [{ stat: 'reputation', operator: 'gte', value: 25 }],
    minWeek: 10,
  },
  {
    title: 'Social Media War',
    description: 'A rival driver\'s fans have started a hashtag campaign mocking your recent results. Your own fanbase is rallying for you to respond. This could go viral either way.',
    category: 'business',
    urgency: 'medium',
    choices: [
      {
        id: 'engage_fans',
        text: 'Post a witty comeback — give the fans what they want',
        roleServed: 'business',
        timeCost: 1,
        effects: { fanSentiment: 10, reputation: 2, stress: 5 },
      },
      {
        id: 'stay_quiet',
        text: 'Stay off social media — let results speak',
        roleServed: 'racing',
        timeCost: 0,
        effects: { stress: -3, confidence: 3 },
      }
    ],
    conditions: [{ stat: 'reputation', operator: 'gte', value: 15 }],
    minWeek: 5,
  },
  {
    title: 'Rival Team Technical Protest',
    description: 'A rival team has lodged a technical protest against your car, claiming your rear diffuser is illegal. The investigation could take your attention away from race prep.',
    category: 'business',
    urgency: 'high',
    choices: [
      {
        id: 'handle_protest',
        text: 'Work with your engineers to prepare the defense',
        roleServed: 'business',
        timeCost: 4,
        effects: { fatigue: 8, stress: 15, morale: -5 },
      },
      {
        id: 'delegate_protest',
        text: 'Delegate to your team manager — you need to focus',
        roleServed: 'racing',
        timeCost: 1,
        effects: { stress: 8, boardMood: -3, morale: -3 },
      }
    ],
    conditions: [
      { stat: 'reputation', operator: 'gte', value: 30 },
      { stat: 'staffCount', operator: 'gte', value: 1 },
    ],
    minWeek: 12,
  },
]

// ============================================
// EVENT CHAIN DEFINITIONS
// ============================================

export interface EventChain {
  id: string
  /** Days delay before the follow-up triggers */
  delayDays: number
  /** The follow-up interruption */
  followUp: Omit<InterruptionEvent, 'id'>
}

export const EVENT_CHAINS: EventChain[] = [
  // Legacy chain (kept for backward compatibility)
  {
    id: 'media_escalation',
    delayDays: 2,
    followUp: {
      title: 'Media Wants Your Side of the Story',
      description: 'Your response to your rival has blown up. Three outlets want exclusive interviews. This is getting bigger than expected.',
      category: 'business',
      urgency: 'high',
      choices: [
        {
          id: 'full_interview',
          text: 'Give a full interview — control the narrative',
          roleServed: 'business',
          timeCost: 3,
          effects: { reputation: 5, fanSentiment: 8, fatigue: 8, stress: 10 },
          chainEventId: 'media_fallout',
        },
        {
          id: 'brief_statement',
          text: 'Issue a brief statement and move on',
          roleServed: 'racing',
          timeCost: 1,
          effects: { reputation: 1, stress: -5 },
        }
      ],
    }
  },
]

// Import and merge expanded chains
import { getAllEventChains } from './expandedChains'

/**
 * Get all event chains (base + expanded)
 */
export function getFullEventChains(): EventChain[] {
  return [...EVENT_CHAINS, ...getAllEventChains()]
}

// ============================================
// GENERATION LOGIC
// ============================================

interface InterruptionContext {
  currentWeek: number
  currentDay: number
  currentYear: number
  isRaceWeek: boolean
  isRaceDay: boolean
  reputation: number
  fatigue: number
  stress: number
  hasPartner: boolean
  staffCount: number
  teamCash: number
  personalCash: number
  boardMood: number
}

/**
 * Attempt to generate a random interruption event for the current day.
 * Returns null if no event triggers (most days won't have one).
 */
export function generateDailyInterruption(context: InterruptionContext): GeneratedInterruption | null {
  // Don't interrupt on race days (day 7 of race week)
  if (context.isRaceDay) return null
  
  // Base chance: 25% on non-race days, 15% on race week non-race days
  // (race weeks should be more focused)
  const baseChance = context.isRaceWeek ? 0.15 : 0.25
  
  // Modifier: higher reputation = slightly more interruptions (fame has a cost)
  const reputationModifier = context.reputation > 50 ? 0.05 : 0
  
  // Modifier: early career has fewer interruptions
  const earlyCareerModifier = context.currentWeek < 8 ? -0.10 : 0
  
  const totalChance = baseChance + reputationModifier + earlyCareerModifier
  
  if (Math.random() > totalChance) return null
  
  // Filter eligible events
  const eligible = INTERRUPTION_TEMPLATES.filter(template => {
    if (!template.conditions) return true
    return template.conditions.every(cond => checkCondition(cond, context))
  })
  
  if (eligible.length === 0) return null
  
  // Pick a random event
  const template = eligible[Math.floor(Math.random() * eligible.length)]
  
  const event: InterruptionEvent = {
    ...template,
    id: `interrupt_${context.currentYear}_w${context.currentWeek}_d${context.currentDay}_${Math.random().toString(36).substr(2, 6)}`,
  }
  
  return {
    event,
    resolvedTitle: event.title,
    resolvedDescription: event.description,
  }
}

function checkCondition(condition: InterruptionCondition, context: InterruptionContext): boolean {
  const contextMap: Record<string, number> = {
    reputation: context.reputation,
    fatigue: context.fatigue,
    stress: context.stress,
    hasPartner: context.hasPartner ? 1 : 0,
    staffCount: context.staffCount,
    teamCash: context.teamCash,
    personalCash: context.personalCash,
    boardMood: context.boardMood,
  }
  
  const value = contextMap[condition.stat] ?? 0
  
  switch (condition.operator) {
    case 'gt': return value > condition.value
    case 'lt': return value < condition.value
    case 'gte': return value >= condition.value
    case 'lte': return value <= condition.value
    case 'eq': return value === condition.value
  }
}

/**
 * Check if there's a pending event chain that should trigger today.
 */
export function checkPendingChains(
  pendingChains: Array<{ chainId: string; triggerDay: number; triggerWeek: number; triggerYear: number }>,
  currentDay: number,
  currentWeek: number,
  currentYear: number
): GeneratedInterruption | null {
  const due = pendingChains.find(
    chain => chain.triggerDay === currentDay && 
             chain.triggerWeek === currentWeek && 
             chain.triggerYear === currentYear
  )
  
  if (!due) return null
  
  const allChains = getFullEventChains()
  const chainDef = allChains.find(c => c.id === due.chainId)
  if (!chainDef) return null
  
  const event: InterruptionEvent = {
    ...chainDef.followUp,
    id: `chain_${due.chainId}_${currentYear}_w${currentWeek}_d${currentDay}`,
  }
  
  return {
    event,
    resolvedTitle: event.title,
    resolvedDescription: event.description,
  }
}
