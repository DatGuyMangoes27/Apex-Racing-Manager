/**
 * Board Decision System
 * 
 * Generates strategic decisions that the board presents to the driver-owner.
 * These force meaningful choices about team direction, investment, and priorities.
 * Triggered during mandatory board meetings.
 */

export interface BoardDecision {
  id: string
  title: string
  description: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  category: 'financial' | 'strategic' | 'personnel' | 'facility' | 'regulatory'
  options: BoardDecisionOption[]
  /** Conditions for this decision to be eligible */
  conditions?: BoardDecisionCondition[]
  /** Only appears once per career */
  oneTime?: boolean
}

export interface BoardDecisionOption {
  id: string
  text: string
  description: string
  effects: Record<string, number>
  longTermEffects?: string
}

export interface BoardDecisionCondition {
  stat: string
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq'
  value: number
}

export interface BoardDecisionContext {
  currentWeek: number
  currentYear: number
  boardMood: number
  teamCash: number
  reputation: number
  staffCount: number
  championshipPosition: number
  teamDevPoints: number
  facilityAvgLevel: number
  isFirstSeason: boolean
  weeksUntilSeasonEnd: number
  previousDecisions: string[]
}

// ============================================
// BOARD DECISION TEMPLATES
// ============================================

const BOARD_DECISION_TEMPLATES: Omit<BoardDecision, 'id'>[] = [
  // ============================================
  // FINANCIAL DECISIONS
  // ============================================
  {
    title: 'Budget Reallocation Proposal',
    description: 'With the season underway, the board wants to discuss how the remaining budget should be allocated. There are competing priorities.',
    urgency: 'medium',
    category: 'financial',
    options: [
      {
        id: 'invest_rnd',
        text: 'Prioritize R&D — Invest Heavily in Car Development',
        description: 'Redirect 60% of remaining discretionary budget to R&D. Faster car, but tight margins elsewhere.',
        effects: { teamDevelopment: 8, teamCash: -15000, boardMood: 3, staffMorale: -3 },
        longTermEffects: 'Accelerated car development for 4 weeks, but reduced budget flexibility'
      },
      {
        id: 'invest_people',
        text: 'Invest in People — Staff Bonuses and Recruitment',
        description: 'Use budget for staff retention bonuses and hiring. Happy team, slower car development.',
        effects: { morale: 10, teamCash: -10000, boardMood: 2, staffRetention: 5 },
        longTermEffects: 'Improved staff loyalty and team atmosphere for the season'
      },
      {
        id: 'conserve',
        text: 'Conserve Budget — Maintain Current Course',
        description: 'Keep the budget balanced. No big moves, but financial security.',
        effects: { boardMood: 5, teamCash: 0 },
        longTermEffects: 'Financial stability but no performance gains'
      }
    ]
  },
  {
    title: 'Sponsor Renegotiation Opportunity',
    description: 'Your title sponsor is open to renegotiating terms mid-season. You could push for more money, more freedom, or a longer deal.',
    urgency: 'medium',
    category: 'financial',
    options: [
      {
        id: 'more_money',
        text: 'Push for Higher Payments',
        description: 'Negotiate for 20% more money, but commit to stricter performance targets.',
        effects: { teamCash: 25000, sponsorSatisfaction: -5, boardMood: 5 },
        longTermEffects: 'Higher income but more pressure to perform'
      },
      {
        id: 'more_freedom',
        text: 'Negotiate More Creative Freedom',
        description: 'Keep current money but reduce obligations. More time for racing prep.',
        effects: { fatigue: -5, stress: -5, sponsorSatisfaction: 3 },
        longTermEffects: 'Better work-life balance for the season'
      },
      {
        id: 'long_term',
        text: 'Lock in a Multi-Year Extension',
        description: 'Secure the sponsorship for 2 more years at current rates. Stability over maximization.',
        effects: { boardMood: 8, teamCash: 5000, reputation: 2 },
        longTermEffects: 'Financial security for multiple seasons'
      }
    ],
    conditions: [{ stat: 'reputation', operator: 'gte', value: 30 }]
  },
  
  // ============================================
  // STRATEGIC DECISIONS
  // ============================================
  {
    title: 'Championship Strategy Review',
    description: 'With the season reaching its midpoint, the board wants a clear championship strategy going forward.',
    urgency: 'high',
    category: 'strategic',
    options: [
      {
        id: 'all_in_title',
        text: 'Go All-In for the Championship',
        description: 'Maximum aggression. Push the car harder, take more risks, sacrifice reliability for speed.',
        effects: { confidence: 10, stress: 10, teamDevelopment: 3, carReliability: -5 },
        longTermEffects: 'Faster but less reliable car, higher risk/reward races'
      },
      {
        id: 'consistent_points',
        text: 'Focus on Consistent Points Scoring',
        description: 'Conservative approach. Protect the car, finish every race, accumulate points.',
        effects: { confidence: 3, stress: -5, carReliability: 5 },
        longTermEffects: 'More reliable finishes but potentially slower race pace'
      },
      {
        id: 'develop_next',
        text: 'Start Planning for Next Season',
        description: 'Accept this season\'s position and begin investing in next year\'s campaign.',
        effects: { boardMood: 5, teamDevelopment: 5, morale: -5 },
        longTermEffects: 'Head start on next season development, but may lose ground this year'
      }
    ],
    conditions: [{ stat: 'weeksUntilSeasonEnd', operator: 'lte', value: 25 }]
  },
  {
    title: 'Series Expansion Discussion',
    description: 'The board is discussing whether to enter an additional racing series next season. This would spread resources but increase visibility.',
    urgency: 'low',
    category: 'strategic',
    options: [
      {
        id: 'expand',
        text: 'Enter a Second Series',
        description: 'Commit to running a second program. More racing, more costs, more exposure.',
        effects: { reputation: 5, teamCash: -30000, boardMood: 3, stress: 8 },
        longTermEffects: 'Dual-series presence next season with increased costs and workload'
      },
      {
        id: 'focus',
        text: 'Stay Focused on Current Series',
        description: 'Concentrate all resources on dominating the current championship.',
        effects: { boardMood: 3, teamDevelopment: 3, confidence: 3 },
        longTermEffects: 'Deeper investment in current series competitiveness'
      },
      {
        id: 'explore_later',
        text: 'Explore Options but Decide Later',
        description: 'Keep the door open without committing. Revisit at season end.',
        effects: { boardMood: 1 },
        longTermEffects: 'Deferred decision — no immediate impact'
      }
    ],
    conditions: [
      { stat: 'reputation', operator: 'gte', value: 40 },
      { stat: 'weeksUntilSeasonEnd', operator: 'lte', value: 15 }
    ],
    oneTime: true
  },
  
  // ============================================
  // PERSONNEL DECISIONS
  // ============================================
  {
    title: 'Key Staff Contract Expiring',
    description: 'One of your senior team members\' contract is coming up for renewal. They\'ve had offers from competitors.',
    urgency: 'high',
    category: 'personnel',
    options: [
      {
        id: 'big_raise',
        text: 'Offer a Significant Pay Rise',
        description: 'Match the competitor offer plus a loyalty bonus. Expensive but retains talent.',
        effects: { teamCash: -8000, morale: 8, boardMood: -3 },
        longTermEffects: 'Key staff retained, team stability maintained'
      },
      {
        id: 'modest_raise',
        text: 'Offer a Modest Counter-Offer',
        description: 'A small raise with a promise of future opportunities. May not be enough.',
        effects: { teamCash: -3000, morale: 2 },
        longTermEffects: '50% chance of retaining the staff member'
      },
      {
        id: 'let_go',
        text: 'Wish Them Well and Promote from Within',
        description: 'Save the money and give an junior staff member a chance to step up.',
        effects: { morale: -5, teamCash: 3000, boardMood: 2 },
        longTermEffects: 'Temporary experience gap, but potential for fresh ideas'
      }
    ],
    conditions: [{ stat: 'staffCount', operator: 'gte', value: 3 }]
  },
  {
    title: 'Youth Academy Proposal',
    description: 'The board has received a proposal to establish a young driver academy. This could develop future talent and bring in additional funding.',
    urgency: 'low',
    category: 'personnel',
    options: [
      {
        id: 'full_academy',
        text: 'Launch a Full Academy Program',
        description: 'Invest in a comprehensive program with scouting, coaching, and testing opportunities.',
        effects: { teamCash: -20000, reputation: 8, boardMood: 5 },
        longTermEffects: 'Access to young talent pipeline, reputation as a development team'
      },
      {
        id: 'partnership',
        text: 'Partner with an Existing Academy',
        description: 'Collaborate with an established academy for shared resources and talent access.',
        effects: { teamCash: -5000, reputation: 3, boardMood: 3 },
        longTermEffects: 'Some talent access with lower investment'
      },
      {
        id: 'decline',
        text: 'Decline — Focus on Current Drivers',
        description: 'Not the right time for long-term youth development.',
        effects: { boardMood: -2 },
        longTermEffects: 'No youth investment, maintain current focus'
      }
    ],
    conditions: [
      { stat: 'reputation', operator: 'gte', value: 50 },
      { stat: 'teamCash', operator: 'gte', value: 50000 }
    ],
    oneTime: true
  },
  
  // ============================================
  // FACILITY DECISIONS
  // ============================================
  {
    title: 'Factory Expansion Opportunity',
    description: 'An adjacent property has become available. Expanding your facility footprint would allow for more departments but requires significant capital.',
    urgency: 'medium',
    category: 'facility',
    options: [
      {
        id: 'buy_expand',
        text: 'Purchase and Expand',
        description: 'Acquire the property and begin expansion. Opens up new facility options.',
        effects: { teamCash: -50000, boardMood: 5, reputation: 3 },
        longTermEffects: 'Unlocks additional facility upgrade paths next season'
      },
      {
        id: 'lease',
        text: 'Lease the Space Short-Term',
        description: 'Rent the space for immediate use without the capital commitment.',
        effects: { teamCash: -10000, boardMood: 2 },
        longTermEffects: 'Temporary extra space, flexible but not permanent'
      },
      {
        id: 'pass',
        text: 'Pass — Not the Right Time',
        description: 'Let this opportunity go. Another may come later.',
        effects: { boardMood: -3 },
        longTermEffects: 'No facility changes'
      }
    ],
    conditions: [
      { stat: 'teamCash', operator: 'gte', value: 60000 },
      { stat: 'facilityAvgLevel', operator: 'gte', value: 2 }
    ],
    oneTime: true
  },
  
  // ============================================
  // REGULATORY DECISIONS
  // ============================================
  {
    title: 'Regulation Change Briefing',
    description: 'The series has announced significant regulation changes for next season. The board needs to decide how to prepare.',
    urgency: 'high',
    category: 'regulatory',
    options: [
      {
        id: 'early_adapt',
        text: 'Begin Early Adaptation Now',
        description: 'Start redirecting R&D toward next year\'s regulations immediately. Sacrifice some pace this season.',
        effects: { teamDevelopment: -3, teamCash: -10000, boardMood: 5 },
        longTermEffects: 'Head start on regulation compliance, strong position next season'
      },
      {
        id: 'split_focus',
        text: 'Split Resources 50/50',
        description: 'Dedicate half the development effort to current regulations, half to next year.',
        effects: { teamDevelopment: -1, teamCash: -5000, boardMood: 3 },
        longTermEffects: 'Balanced approach — moderate readiness for both seasons'
      },
      {
        id: 'focus_now',
        text: 'Focus on This Season — Deal with Changes Later',
        description: 'Maximize current competitiveness. Handle regulation changes in the off-season.',
        effects: { teamDevelopment: 2, boardMood: -2 },
        longTermEffects: 'Maximum pace now but potential scramble for next season'
      }
    ],
    conditions: [{ stat: 'weeksUntilSeasonEnd', operator: 'lte', value: 20 }]
  }
]

// ============================================
// DECISION GENERATION
// ============================================

export function generateBoardDecision(ctx: BoardDecisionContext): BoardDecision | null {
  // Board decisions happen every 8 weeks (during mandatory board meetings)
  if (ctx.currentWeek % 8 !== 0) return null
  
  // Filter eligible decisions
  const eligible = BOARD_DECISION_TEMPLATES.filter(template => {
    // Check one-time decisions
    if (template.oneTime && ctx.previousDecisions.some(d => d.startsWith(template.title.substring(0, 20)))) {
      return false
    }
    
    // Check conditions
    if (!template.conditions) return true
    return template.conditions.every(cond => {
      const statMap: Record<string, number> = {
        boardMood: ctx.boardMood,
        teamCash: ctx.teamCash,
        reputation: ctx.reputation,
        staffCount: ctx.staffCount,
        championshipPosition: ctx.championshipPosition,
        teamDevPoints: ctx.teamDevPoints,
        facilityAvgLevel: ctx.facilityAvgLevel,
        weeksUntilSeasonEnd: ctx.weeksUntilSeasonEnd
      }
      const val = statMap[cond.stat] ?? 0
      switch (cond.operator) {
        case 'gt': return val > cond.value
        case 'lt': return val < cond.value
        case 'gte': return val >= cond.value
        case 'lte': return val <= cond.value
        case 'eq': return val === cond.value
      }
    })
  })
  
  if (eligible.length === 0) return null
  
  // Pick one, weighted by urgency
  const weighted = eligible.flatMap(t => {
    const weight = t.urgency === 'critical' ? 4 : t.urgency === 'high' ? 3 : t.urgency === 'medium' ? 2 : 1
    return Array(weight).fill(t)
  })
  
  const template = weighted[Math.floor(Math.random() * weighted.length)]
  
  return {
    ...template,
    id: `board_decision_w${ctx.currentWeek}_y${ctx.currentYear}_${Math.random().toString(36).substr(2, 6)}`
  }
}
