/**
 * Contract Negotiation System
 * 
 * Adds counter-offers, term bargaining, and negotiation rounds
 * to the contract signing process.
 */

export interface NegotiationState {
  offerId: string
  teamName: string
  originalTerms: ContractTerms
  currentTerms: ContractTerms
  round: number
  maxRounds: number
  teamPatience: number // 0-100, decreases each round
  playerLeverage: number // Based on reputation, results, market demand
  history: NegotiationRound[]
  status: 'negotiating' | 'accepted' | 'rejected' | 'expired'
}

export interface ContractTerms {
  salary: number
  duration: number // seasons
  performanceBonus: number
  winBonus: number
  championshipBonus: number
  signingBonus: number
  releaseClause: number
  mediaObligations: 'light' | 'standard' | 'heavy'
  teamOrdersPriority: 'number_one' | 'equal' | 'number_two'
}

export interface NegotiationRound {
  round: number
  playerRequest: string
  teamResponse: string
  termsAfter: ContractTerms
  accepted: boolean
}

export interface NegotiationAction {
  id: string
  label: string
  description: string
  category: 'money' | 'duration' | 'bonuses' | 'clauses' | 'conditions'
  /** How much this annoys the team (-patience) */
  aggressiveness: number
}

// ============================================
// NEGOTIATION ACTIONS
// ============================================

export const NEGOTIATION_ACTIONS: NegotiationAction[] = [
  // Money
  {
    id: 'raise_salary_small',
    label: 'Request 10% Salary Increase',
    description: 'A modest salary increase — reasonable but still a push.',
    category: 'money',
    aggressiveness: 10
  },
  {
    id: 'raise_salary_large',
    label: 'Request 25% Salary Increase',
    description: 'A significant salary bump. The team may push back.',
    category: 'money',
    aggressiveness: 25
  },
  {
    id: 'signing_bonus',
    label: 'Request Signing Bonus',
    description: 'Ask for a one-time signing bonus on top of salary.',
    category: 'money',
    aggressiveness: 15
  },
  
  // Duration
  {
    id: 'shorter_deal',
    label: 'Request Shorter Contract',
    description: 'Reduce the contract length by 1 season for more flexibility.',
    category: 'duration',
    aggressiveness: 15
  },
  {
    id: 'longer_deal',
    label: 'Request Longer Contract',
    description: 'Extend the deal for more job security. Teams often prefer this.',
    category: 'duration',
    aggressiveness: 5
  },
  
  // Bonuses
  {
    id: 'higher_win_bonus',
    label: 'Increase Win Bonus',
    description: 'Double the per-win bonus payment.',
    category: 'bonuses',
    aggressiveness: 10
  },
  {
    id: 'championship_bonus',
    label: 'Add Championship Bonus',
    description: 'Request a significant bonus for winning the championship.',
    category: 'bonuses',
    aggressiveness: 8
  },
  
  // Clauses
  {
    id: 'release_clause',
    label: 'Request Release Clause',
    description: 'Add a clause that lets you leave mid-contract for a buyout fee.',
    category: 'clauses',
    aggressiveness: 20
  },
  {
    id: 'performance_exit',
    label: 'Performance Exit Clause',
    description: 'If the car is uncompetitive (bottom 25%), you can exit.',
    category: 'clauses',
    aggressiveness: 25
  },
  
  // Conditions
  {
    id: 'number_one_status',
    label: 'Request Number One Driver Status',
    description: 'Demand priority treatment in strategy and development.',
    category: 'conditions',
    aggressiveness: 30
  },
  {
    id: 'reduce_media',
    label: 'Reduce Media Obligations',
    description: 'Negotiate fewer mandatory media appearances.',
    category: 'conditions',
    aggressiveness: 10
  }
]

// ============================================
// NEGOTIATION ENGINE
// ============================================

export function createNegotiationState(
  offerId: string,
  teamName: string,
  terms: ContractTerms,
  playerReputation: number,
  teamTier: string
): NegotiationState {
  // Player leverage based on reputation and team tier
  const tierDemand: Record<string, number> = {
    'entry': 20, 'amateur': 25, 'semi-pro': 35, 'professional': 45,
    'pro': 55, 'elite': 65, 'pinnacle': 75
  }
  
  const leverage = Math.min(90, Math.max(10,
    (playerReputation * 0.5) + (100 - (tierDemand[teamTier] || 40)) * 0.3
  ))
  
  return {
    offerId,
    teamName,
    originalTerms: { ...terms },
    currentTerms: { ...terms },
    round: 0,
    maxRounds: 3,
    teamPatience: 80 + Math.floor(Math.random() * 20), // 80-100
    playerLeverage: leverage,
    history: [],
    status: 'negotiating'
  }
}

export function processNegotiationAction(
  state: NegotiationState,
  actionId: string
): { newState: NegotiationState; response: string; success: boolean } {
  const action = NEGOTIATION_ACTIONS.find(a => a.id === actionId)
  if (!action) {
    return { newState: state, response: 'Invalid action.', success: false }
  }
  
  const newState = { ...state }
  newState.round++
  
  // Reduce team patience
  const patienceLoss = action.aggressiveness * (1 - state.playerLeverage / 200)
  newState.teamPatience = Math.max(0, state.teamPatience - patienceLoss)
  
  // Calculate success chance based on leverage, aggressiveness, and patience
  const baseChance = state.playerLeverage / 100
  const aggressivenessPenalty = action.aggressiveness / 100
  const patienceBonus = state.teamPatience / 200
  const successChance = Math.min(0.9, Math.max(0.1, baseChance - aggressivenessPenalty + patienceBonus))
  
  const success = Math.random() < successChance
  let response = ''
  
  if (success) {
    // Apply the change
    const updatedTerms = applyNegotiationAction(state.currentTerms, actionId)
    newState.currentTerms = updatedTerms
    response = getSuccessResponse(action, state.teamName)
  } else {
    // Team counters with a smaller concession or rejects
    if (newState.teamPatience > 30) {
      const partialTerms = applyPartialNegotiationAction(state.currentTerms, actionId)
      newState.currentTerms = partialTerms
      response = getPartialResponse(action, state.teamName)
    } else {
      response = getRejectionResponse(action, state.teamName)
    }
  }
  
  // Record the round
  newState.history.push({
    round: newState.round,
    playerRequest: action.label,
    teamResponse: response,
    termsAfter: { ...newState.currentTerms },
    accepted: success
  })
  
  // Check if negotiation should end
  if (newState.round >= newState.maxRounds) {
    newState.status = newState.teamPatience > 20 ? 'negotiating' : 'expired'
  }
  if (newState.teamPatience <= 0) {
    newState.status = 'expired'
    response += '\n\nThe team has withdrawn the offer due to prolonged negotiations.'
  }
  
  return { newState, response, success }
}

function applyNegotiationAction(terms: ContractTerms, actionId: string): ContractTerms {
  const updated = { ...terms }
  
  switch (actionId) {
    case 'raise_salary_small': updated.salary = Math.round(terms.salary * 1.1); break
    case 'raise_salary_large': updated.salary = Math.round(terms.salary * 1.25); break
    case 'signing_bonus': updated.signingBonus = Math.round(terms.salary * 0.2); break
    case 'shorter_deal': updated.duration = Math.max(1, terms.duration - 1); break
    case 'longer_deal': updated.duration = terms.duration + 1; break
    case 'higher_win_bonus': updated.winBonus = terms.winBonus * 2; break
    case 'championship_bonus': updated.championshipBonus = Math.round(terms.salary * 0.5); break
    case 'release_clause': updated.releaseClause = Math.round(terms.salary * terms.duration * 0.5); break
    case 'performance_exit': updated.releaseClause = Math.round(terms.salary * 0.3); break
    case 'number_one_status': updated.teamOrdersPriority = 'number_one'; break
    case 'reduce_media': updated.mediaObligations = 'light'; break
  }
  
  return updated
}

function applyPartialNegotiationAction(terms: ContractTerms, actionId: string): ContractTerms {
  const updated = { ...terms }
  
  // Team offers half of what was requested
  switch (actionId) {
    case 'raise_salary_small': updated.salary = Math.round(terms.salary * 1.05); break
    case 'raise_salary_large': updated.salary = Math.round(terms.salary * 1.1); break
    case 'signing_bonus': updated.signingBonus = Math.round(terms.salary * 0.1); break
    case 'higher_win_bonus': updated.winBonus = Math.round(terms.winBonus * 1.5); break
    case 'championship_bonus': updated.championshipBonus = Math.round(terms.salary * 0.25); break
    case 'number_one_status': updated.teamOrdersPriority = 'equal'; break
  }
  
  return updated
}

function getSuccessResponse(action: NegotiationAction, teamName: string): string {
  return `${teamName} has agreed to your request for ${action.label.toLowerCase()}. The updated terms are reflected in the offer.`
}

function getPartialResponse(action: NegotiationAction, teamName: string): string {
  return `${teamName} can't fully meet your request, but they've made a counter-offer with a partial concession. They hope this shows good faith.`
}

function getRejectionResponse(action: NegotiationAction, teamName: string): string {
  return `${teamName} has firmly declined this request. They feel the current offer is already competitive. Pushing further may jeopardize the deal.`
}
