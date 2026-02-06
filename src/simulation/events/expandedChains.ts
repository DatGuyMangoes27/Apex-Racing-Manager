/**
 * Expanded Event Chains
 * 
 * Multi-week storylines that play out over several days/weeks.
 * Each chain starts with a trigger event and has follow-up events
 * that depend on the player's choices.
 */

import type { EventChain } from './interruptions'

// ============================================
// EXPANDED EVENT CHAIN DEFINITIONS
// ============================================

export const EXPANDED_EVENT_CHAINS: EventChain[] = [
  // ============================================
  // MEDIA DRAMA ARC (3 events)
  // ============================================
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
  {
    id: 'media_fallout',
    delayDays: 3,
    followUp: {
      title: 'Interview Fallout: Sponsors Love It, Rival Doesn\'t',
      description: 'Your interview went viral. Sponsors are thrilled with the exposure, but your rival has doubled down with personal attacks. The paddock is divided.',
      category: 'business',
      urgency: 'medium',
      choices: [
        {
          id: 'capitalize',
          text: 'Capitalize on the buzz — schedule more media',
          roleServed: 'business',
          timeCost: 3,
          effects: { reputation: 3, sponsorSatisfaction: 8, fatigue: 10, stress: 8 },
        },
        {
          id: 'defuse',
          text: 'Publicly extend an olive branch to your rival',
          roleServed: 'life',
          timeCost: 1,
          effects: { stress: -10, reputation: 2, confidence: 3 },
        }
      ],
    }
  },
  
  // ============================================
  // ENGINEER POACHING ARC (2 events)
  // ============================================
  {
    id: 'engineer_poach_response',
    delayDays: 4,
    followUp: {
      title: 'Engineer Makes Their Decision',
      description: 'After considering your counter-offer, your engineer has reached a decision. They want to discuss it face-to-face.',
      category: 'business',
      urgency: 'high',
      choices: [
        {
          id: 'personal_meeting',
          text: 'Have a personal meeting — show them they matter',
          roleServed: 'business',
          timeCost: 2,
          effects: { morale: 8, fatigue: 3 },
        },
        {
          id: 'let_hr_handle',
          text: 'Let HR handle the formalities — you trust the process',
          roleServed: 'racing',
          timeCost: 0,
          effects: { morale: -2 },
        }
      ],
    }
  },
  
  // ============================================
  // SPONSOR CRISIS ARC (3 events)
  // ============================================
  {
    id: 'sponsor_crisis_start',
    delayDays: 1,
    followUp: {
      title: 'Sponsor CEO Demands Emergency Call',
      description: 'Your sponsor\'s CEO wants an urgent video call. Their brand has been associated with your team\'s recent controversy. This could make or break the deal.',
      category: 'business',
      urgency: 'critical',
      choices: [
        {
          id: 'take_call',
          text: 'Drop everything for the call — this sponsorship is critical',
          roleServed: 'business',
          timeCost: 2,
          effects: { sponsorSatisfaction: 5, fatigue: 5, stress: 10 },
          chainEventId: 'sponsor_crisis_resolve',
        },
        {
          id: 'schedule_later',
          text: 'Ask to reschedule — you need time to prepare',
          roleServed: 'racing',
          timeCost: 0,
          effects: { sponsorSatisfaction: -10, stress: 8 },
        }
      ],
    }
  },
  {
    id: 'sponsor_crisis_resolve',
    delayDays: 3,
    followUp: {
      title: 'Sponsor Wants Public Apology or They Walk',
      description: 'After your call, the sponsor has issued an ultimatum: publicly address the controversy or they\'ll activate the exit clause. The board is watching.',
      category: 'business',
      urgency: 'critical',
      choices: [
        {
          id: 'public_apology',
          text: 'Issue a public statement addressing concerns',
          roleServed: 'business',
          timeCost: 3,
          effects: { sponsorSatisfaction: 15, reputation: -3, confidence: -5, boardMood: 5 },
        },
        {
          id: 'call_bluff',
          text: 'Call their bluff — they need you as much as you need them',
          roleServed: 'racing',
          timeCost: 1,
          effects: { confidence: 10, sponsorSatisfaction: -15, reputation: 5, boardMood: -8 },
        }
      ],
    }
  },
  
  // ============================================
  // FAMILY EMERGENCY ARC (2 events)
  // ============================================
  {
    id: 'family_emergency',
    delayDays: 1,
    followUp: {
      title: 'Family Situation Worsening',
      description: 'The family situation you were dealing with has gotten more complex. You\'re being asked to fly home, but the race weekend is approaching.',
      category: 'life',
      urgency: 'high',
      choices: [
        {
          id: 'go_home',
          text: 'Family first — fly home immediately',
          roleServed: 'life',
          timeCost: 8,
          effects: { stress: -20, fatigue: 15, partnerHappiness: 15, confidence: -5 },
        },
        {
          id: 'stay_racing',
          text: 'Stay and race — deal with it after the weekend',
          roleServed: 'racing',
          timeCost: 0,
          effects: { stress: 15, confidence: -8, partnerHappiness: -10 },
        }
      ],
    }
  },
  
  // ============================================
  // TECHNICAL PROTEST ARC (3 events)
  // ============================================
  {
    id: 'protest_investigation',
    delayDays: 3,
    followUp: {
      title: 'Stewards Request Technical Inspection',
      description: 'The stewards have formally requested a detailed inspection of your car. Your engineering team is confident, but the process is stressful.',
      category: 'business',
      urgency: 'high',
      choices: [
        {
          id: 'cooperate_fully',
          text: 'Full cooperation — open up everything',
          roleServed: 'business',
          timeCost: 4,
          effects: { reputation: 3, stress: 10, fatigue: 5 },
          chainEventId: 'protest_verdict',
        },
        {
          id: 'legal_challenge',
          text: 'Challenge the basis of the protest through legal channels',
          roleServed: 'business',
          timeCost: 2,
          effects: { teamCash: -5000, reputation: -2, stress: 15 },
          chainEventId: 'protest_verdict',
        }
      ],
    }
  },
  {
    id: 'protest_verdict',
    delayDays: 5,
    followUp: {
      title: 'Technical Protest Verdict Is In',
      description: 'The stewards have reviewed the evidence and reached a decision. The paddock is watching closely.',
      category: 'business',
      urgency: 'high',
      choices: [
        {
          id: 'accept_verdict',
          text: 'Accept the verdict with grace — regardless of outcome',
          roleServed: 'business',
          timeCost: 1,
          effects: { reputation: 5, stress: -10, boardMood: 3 },
        },
        {
          id: 'use_as_motivation',
          text: 'Use it as fuel — prove them all wrong on track',
          roleServed: 'racing',
          timeCost: 0,
          effects: { confidence: 10, stress: 5, morale: 5 },
        }
      ],
    }
  },
  
  // ============================================
  // MANUFACTURER RELATIONSHIP ARC (2 events)
  // ============================================
  {
    id: 'manufacturer_test_invite',
    delayDays: 2,
    followUp: {
      title: 'Manufacturer Sends Evaluation Team',
      description: 'The manufacturer has sent engineers to evaluate your team\'s operations. They\'re watching how you run things. This could lead to a works deal.',
      category: 'business',
      urgency: 'medium',
      choices: [
        {
          id: 'impress_them',
          text: 'Put on a show — present your best side',
          roleServed: 'business',
          timeCost: 4,
          effects: { reputation: 5, fatigue: 8, boardMood: 5 },
        },
        {
          id: 'business_as_usual',
          text: 'Business as usual — let the quality speak for itself',
          roleServed: 'racing',
          timeCost: 0,
          effects: { reputation: 2, confidence: 3 },
        }
      ],
    }
  },
  
  // ============================================
  // PERSONAL SCANDAL ARC (3 events)
  // ============================================
  {
    id: 'scandal_breaks',
    delayDays: 1,
    followUp: {
      title: 'Story Goes Public: Damage Control Needed',
      description: 'The gossip you heard about has been published by a major outlet. Your phone is blowing up. The PR team needs direction.',
      category: 'life',
      urgency: 'critical',
      choices: [
        {
          id: 'full_damage_control',
          text: 'Full damage control — address it head-on',
          roleServed: 'business',
          timeCost: 4,
          effects: { reputation: -3, stress: 15, fanSentiment: -5 },
          chainEventId: 'scandal_aftermath',
        },
        {
          id: 'ignore_story',
          text: 'No comment — deny the story and move on',
          roleServed: 'racing',
          timeCost: 0,
          effects: { reputation: -5, stress: 10, confidence: -3 },
          chainEventId: 'scandal_aftermath',
        }
      ],
    }
  },
  {
    id: 'scandal_aftermath',
    delayDays: 5,
    followUp: {
      title: 'Scandal: The Dust Settles',
      description: 'A week later, the story has mostly blown over. But there are lasting effects. How do you want to rebuild?',
      category: 'life',
      urgency: 'medium',
      choices: [
        {
          id: 'charity_work',
          text: 'Do charity work — rebuild public image',
          roleServed: 'life',
          timeCost: 4,
          effects: { reputation: 5, fanSentiment: 8, stress: -5, fatigue: 5 },
        },
        {
          id: 'focus_results',
          text: 'Let your racing do the talking — win them back on track',
          roleServed: 'racing',
          timeCost: 0,
          effects: { confidence: 8, morale: 5 },
        }
      ],
    }
  },
  
  // ============================================
  // REGULATION CHANGE ARC (2 events)
  // ============================================
  {
    id: 'regulation_announcement',
    delayDays: 3,
    followUp: {
      title: 'Regulation Details Released: Team Must Adapt',
      description: 'The full technical regulations have been released. Some changes directly affect your car\'s strongest areas. Your engineers need guidance.',
      category: 'business',
      urgency: 'high',
      choices: [
        {
          id: 'immediate_redesign',
          text: 'Start redesigning immediately — can\'t afford to fall behind',
          roleServed: 'business',
          timeCost: 3,
          effects: { teamDevelopment: 5, teamCash: -10000, fatigue: 8, boardMood: 3 },
        },
        {
          id: 'wait_clarification',
          text: 'Wait for clarifications — avoid wasting resources on wrong interpretation',
          roleServed: 'racing',
          timeCost: 1,
          effects: { stress: 5, boardMood: -2 },
        }
      ],
    }
  },
  
  // ============================================
  // RETIREMENT PRESSURE ARC (2 events)
  // ============================================
  {
    id: 'retirement_question',
    delayDays: 2,
    followUp: {
      title: 'Journalist Presses on Retirement Plans',
      description: 'A prominent journalist has written a think-piece about your career length and when you might step back. It\'s gained traction in the paddock.',
      category: 'life',
      urgency: 'low',
      choices: [
        {
          id: 'dismiss_rumors',
          text: '"I\'ve never felt more motivated" — shut it down',
          roleServed: 'racing',
          timeCost: 1,
          effects: { confidence: 8, reputation: 2, stress: 5 },
        },
        {
          id: 'thoughtful_answer',
          text: 'Give a thoughtful, honest answer about your future',
          roleServed: 'life',
          timeCost: 2,
          effects: { reputation: 5, fanSentiment: 5, stress: -3 },
        }
      ],
    }
  },
]

/**
 * Get all event chains (original + expanded)
 */
export function getAllEventChains(): EventChain[] {
  return EXPANDED_EVENT_CHAINS
}
