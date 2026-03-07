/**
 * Relationships System
 * 
 * Manages relationships with team, engineer, and rivals.
 * Good relationships unlock benefits, bad relationships have consequences.
 */

import { RaceResult } from '@/store/careerStore';

// ============================================
// TYPES
// ============================================

export interface RivalRelation {
  driverId: string
  driverName: string
  relationship: number  // -100 to 100
  rivalryIntensity: number  // 0-100
  history: RivalHistoryEvent[]
  isActive: boolean
}

export interface RivalHistoryEvent {
  id: string
  type: 'collision' | 'on_track_battle' | 'overtake' | 'defense'
  week: number
  year: number
  description: string
  relationshipChange: number
  intensityChange: number
}

export interface RelationshipEffect {
  type: 'contract' | 'support' | 'information'
  target: string
  value: number
  description: string
}

export interface RelationshipState {
  teamRelationship: number  // 0-100
  engineerRelationship: number  // 0-100
  rivalRelationships: RivalRelation[]
}

// ============================================
// CONSTANTS
// ============================================

export const RELATIONSHIP_CHANGES = {
  WIN: 10,
  PODIUM: 5,
  POINTS_FINISH: 2,
  POOR_RESULT: -5,
  DNF_MECHANICAL: -3,
  DNF_DRIVER_ERROR: -8,
  DEBRIEF_SESSION: 2,
  GOOD_SETUP_FEEDBACK: 3,
  IGNORED_ADVICE: -2,
  ON_TRACK_BATTLE_CLEAN: 3,
  OVERTAKE_CLEAN: 1,
  COLLISION: -10,
  AGGRESSIVE_DEFENSE: -5
} as const

export const TEAM_RELATIONSHIP_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 60,
  NEUTRAL: 40,
  POOR: 20
} as const

// ============================================
// FUNCTIONS
// ============================================

/**
 * Update team relationship from race result
 */
export function updateDriverRelationship(
  currentRelationship: number,
  result: RaceResult,
  expectedPosition: number
): { newRelationship: number; change: number; reason: string } {
  let change = 0
  let reason = ''

  if (result.dnf) {
    // DNF handling - worse if driver error
    change = result.dnfReason?.includes('error') || result.dnfReason?.includes('crash')
      ? RELATIONSHIP_CHANGES.DNF_DRIVER_ERROR
      : RELATIONSHIP_CHANGES.DNF_MECHANICAL
    reason = result.dnfReason || 'Did not finish'
  } else if (result.racePosition === 1) {
    change = RELATIONSHIP_CHANGES.WIN
    reason = 'Race win!'
  } else if (result.racePosition <= 3) {
    change = RELATIONSHIP_CHANGES.PODIUM
    reason = 'Podium finish'
  } else if (result.racePosition <= 10) {
    change = RELATIONSHIP_CHANGES.POINTS_FINISH
    reason = 'Points finish'
  } else if (result.racePosition > expectedPosition + 5) {
    change = RELATIONSHIP_CHANGES.POOR_RESULT
    reason = `Finished below expectations (P${result.racePosition} vs expected P${expectedPosition})`
  }

  // Bonus for exceeding expectations
  if (result.racePosition < expectedPosition - 3) {
    change += 2
    reason += ' - exceeded expectations!'
  }

  const newRelationship = clamp(currentRelationship + change, 0, 100)
  
  return { newRelationship, change, reason }
}

/**
 * Update engineer relationship from technical activities
 */
export function updateEngineerRelationship(
  currentRelationship: number,
  activity: 'debrief' | 'feedback' | 'ignored_advice'
): number {
  let change = 0
  
  switch (activity) {
    case 'debrief':
      change = RELATIONSHIP_CHANGES.DEBRIEF_SESSION
      break
    case 'feedback':
      change = RELATIONSHIP_CHANGES.GOOD_SETUP_FEEDBACK
      break
    case 'ignored_advice':
      change = RELATIONSHIP_CHANGES.IGNORED_ADVICE
      break
  }

  return clamp(currentRelationship + change, 0, 100)
}

/**
 * Update rival relationship from on-track encounter
 */
export function updateRivalRelationship(
  rival: RivalRelation,
  encounterType: 'clean_battle' | 'clean_overtake' | 'collision' | 'aggressive_defense',
  week: number,
  year: number
): RivalRelation {
  let relationshipChange = 0
  let intensityChange = 0
  let description = ''

  switch (encounterType) {
    case 'clean_battle':
      relationshipChange = RELATIONSHIP_CHANGES.ON_TRACK_BATTLE_CLEAN
      intensityChange = 5
      description = 'Hard but fair wheel-to-wheel racing'
      break
    case 'clean_overtake':
      relationshipChange = RELATIONSHIP_CHANGES.OVERTAKE_CLEAN
      intensityChange = 2
      description = 'Clean overtaking move'
      break
    case 'collision':
      relationshipChange = RELATIONSHIP_CHANGES.COLLISION
      intensityChange = 15
      description = 'On-track collision!'
      break
    case 'aggressive_defense':
      relationshipChange = RELATIONSHIP_CHANGES.AGGRESSIVE_DEFENSE
      intensityChange = 8
      description = 'Aggressive defending drew criticism'
      break
  }

  const event: RivalHistoryEvent = {
    id: `rival_${rival.driverId}_${week}_${year}`,
    type: encounterType === 'collision' ? 'collision' : 
          encounterType === 'clean_battle' ? 'on_track_battle' :
          encounterType === 'clean_overtake' ? 'overtake' : 'defense',
    week,
    year,
    description,
    relationshipChange,
    intensityChange
  }

  return {
    ...rival,
    relationship: clamp(rival.relationship + relationshipChange, -100, 100),
    rivalryIntensity: clamp(rival.rivalryIntensity + intensityChange, 0, 100),
    history: [...rival.history, event].slice(-20)  // Keep last 20 events
  }
}

/**
 * Get team relationship status
 */
export function getTeamRelationshipStatus(relationship: number): {
  status: string
  color: string
  effects: RelationshipEffect[]
} {
  if (relationship >= TEAM_RELATIONSHIP_THRESHOLDS.EXCELLENT) {
    return {
      status: 'Excellent',
      color: 'text-status-success',
      effects: [
        { type: 'contract', target: 'salary', value: 15, description: '+15% contract bonus' },
        { type: 'support', target: 'upgrades', value: 1, description: 'Priority for upgrades' },
        { type: 'information', target: 'strategy', value: 1, description: 'Better strategy calls' }
      ]
    }
  } else if (relationship >= TEAM_RELATIONSHIP_THRESHOLDS.GOOD) {
    return {
      status: 'Good',
      color: 'text-status-info',
      effects: [
        { type: 'contract', target: 'salary', value: 5, description: '+5% contract bonus' }
      ]
    }
  } else if (relationship >= TEAM_RELATIONSHIP_THRESHOLDS.NEUTRAL) {
    return {
      status: 'Neutral',
      color: 'text-text-muted',
      effects: []
    }
  } else if (relationship >= TEAM_RELATIONSHIP_THRESHOLDS.POOR) {
    return {
      status: 'Strained',
      color: 'text-status-warning',
      effects: [
        { type: 'contract', target: 'salary', value: -10, description: '-10% contract negotiation' },
        { type: 'support', target: 'priority', value: -1, description: 'Lower priority for upgrades' }
      ]
    }
  } else {
    return {
      status: 'Critical',
      color: 'text-status-error',
      effects: [
        { type: 'contract', target: 'risk', value: 1, description: 'At risk of being replaced' },
        { type: 'support', target: 'strategy', value: -1, description: 'Less team support' }
      ]
    }
  }
}

/**
 * Get rival relationship status
 */
export function getRivalRelationshipStatus(relationship: number): {
  status: string
  color: string
} {
  if (relationship >= 50) return { status: 'Respectful', color: 'text-status-success' }
  if (relationship >= 20) return { status: 'Professional', color: 'text-status-info' }
  if (relationship >= -20) return { status: 'Neutral', color: 'text-text-muted' }
  if (relationship >= -50) return { status: 'Tense', color: 'text-status-warning' }
  return { status: 'Hostile', color: 'text-status-error' }
}

/**
 * Check for rivalry events based on standings
 */
export function checkRivalryEvents(
  rival: RivalRelation,
  playerPosition: number,
  rivalPosition: number,
  roundsRemaining: number
): { eventType: 'title_fight' | 'close_battle' | 'none'; message?: string } {
  const positionDiff = Math.abs(playerPosition - rivalPosition)
  
  // Title fight check
  if (roundsRemaining <= 3 && positionDiff <= 2 && playerPosition <= 3) {
    return {
      eventType: 'title_fight',
      message: `Championship battle with ${rival.driverName}!`
    }
  }
  
  // Close battle check
  if (positionDiff <= 1) {
    return {
      eventType: 'close_battle',
      message: `Fighting for position with ${rival.driverName}`
    }
  }

  return { eventType: 'none' }
}

/**
 * Process weekly relationship decay/growth
 */
export function processWeeklyRelationships(
  state: RelationshipState
): RelationshipState {
  // Natural drift toward neutral (50)
  const teamDrift = state.teamRelationship > 50 ? -0.5 : 
                    state.teamRelationship < 50 ? 0.5 : 0
  const engineerDrift = state.engineerRelationship > 50 ? -0.5 : 
                        state.engineerRelationship < 50 ? 0.5 : 0

  // Rivalry intensity naturally cools down
  const updatedRivals = state.rivalRelationships.map(rival => ({
    ...rival,
    rivalryIntensity: Math.max(0, rival.rivalryIntensity - 1)
  }))

  return {
    ...state,
    teamRelationship: clamp(state.teamRelationship + teamDrift, 0, 100),
    engineerRelationship: clamp(state.engineerRelationship + engineerDrift, 0, 100),
    rivalRelationships: updatedRivals
  }
}

/**
 * Add or update a rival relationship
 */
export function addOrUpdateRival(
  state: RelationshipState,
  driverId: string,
  driverName: string,
  isActive: boolean = true
): RelationshipState {
  const existingRival = state.rivalRelationships.find(r => r.driverId === driverId)
  
  if (existingRival) {
    // Update existing
    return {
      ...state,
      rivalRelationships: state.rivalRelationships.map(r =>
        r.driverId === driverId ? { ...r, isActive } : r
      )
    }
  }

  // Add new rival
  const newRival: RivalRelation = {
    driverId,
    driverName,
    relationship: 0,  // Start neutral
    rivalryIntensity: 20,  // Some initial tension
    history: [],
    isActive
  }

  return {
    ...state,
    rivalRelationships: [...state.rivalRelationships, newRival]
  }
}

/**
 * Calculate contract modifier from relationships
 */
export function getContractModifierFromRelationships(
  teamRelationship: number,
  marketability: number
): { salaryModifier: number; description: string } {
  let modifier = 0
  const descriptions: string[] = []

  // Team relationship effect
  if (teamRelationship >= 80) {
    modifier += 0.15
    descriptions.push('+15% from excellent team relationship')
  } else if (teamRelationship >= 60) {
    modifier += 0.05
    descriptions.push('+5% from good team relationship')
  } else if (teamRelationship < 40) {
    modifier -= 0.1
    descriptions.push('-10% from poor team relationship')
  }

  // Marketability bonus
  if (marketability >= 80) {
    modifier += 0.1
    descriptions.push('+10% from high marketability')
  } else if (marketability >= 60) {
    modifier += 0.05
    descriptions.push('+5% from good marketability')
  }

  return {
    salaryModifier: modifier,
    description: descriptions.join(', ') || 'No modifiers'
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Create default relationship state
 */
export function createDefaultRelationshipState(): RelationshipState {
  return {
    teamRelationship: 50,
    engineerRelationship: 50,
    rivalRelationships: []
  }
}

// ============================================
// RACE-BASED RELATIONSHIP UPDATES
// ============================================

/**
 * Update team relationship based on race result
 */
export function updateTeamRelationshipFromRace(
  state: RelationshipState,
  result: { position: number; expectedPosition: number; dnf?: boolean }
): RelationshipState {
  let change = 0

  if (result.dnf) {
    change = -3 // DNF is bad but not the driver's fault usually
  } else if (result.position <= result.expectedPosition) {
    // Met or exceeded expectations
    change = Math.min(10, (result.expectedPosition - result.position + 1) * 2)
  } else {
    // Underperformed
    change = -Math.min(8, (result.position - result.expectedPosition) * 1.5)
  }

  return {
    ...state,
    teamRelationship: clamp(state.teamRelationship + change, 0, 100),
    engineerRelationship: clamp(state.engineerRelationship + change * 0.5, 0, 100)
  }
}

// ============================================
// HELPERS
// ============================================

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

