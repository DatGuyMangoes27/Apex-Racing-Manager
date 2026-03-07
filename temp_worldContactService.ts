// ============================================
// WORLD CHARACTER CONTACT SERVICE
// ============================================
// Generates social contacts from actual game-world entities:
// rival drivers, team owners/principals, employed staff, and investors.

import type { ContactInfo } from '@/types/personalLife'
import type { NpcMood } from '@/data/messaging-config'
import { generateId } from '@/utils/personalLifeHelpers'
import { generateFallbackSocialBio } from '@/services/dialogueAI'
import type { SocialBioContext } from '@/services/dialogueAI'

// ============================================
// TYPES
// ============================================

export interface WorldEntityInfo {
  id: string
  name: string
  entityType: 'rival_driver' | 'team_owner' | 'staff' | 'investor'
  teamName?: string
  role?: string // e.g. 'Chief Engineer', 'Team Principal'
  nationality?: string
  reputation?: number
}

// ============================================
// HELPER
// ============================================

function createDefaultMood(): NpcMood {
  return {
    overall: 'neutral',
    energy: 'medium',
    receptiveness: 70,
    recentEvents: []
  }
}

// ============================================
// WORLD CONTACT GENERATION
// ============================================

/**
 * Generate a social contact from a game-world entity (rival driver, team owner, staff, investor)
 * These contacts are linked to actual world entities via worldEntityId
 */
export function generateWorldContact(
  entity: WorldEntityInfo,
  metAt: string,
  metWeek: number,
  metYear: number
): ContactInfo {
  // Determine contact type based on entity type
  let contactType: ContactInfo['type']
  switch (entity.entityType) {
    case 'rival_driver':
      contactType = 'rival'
      break
    case 'team_owner':
    case 'investor':
      contactType = 'business'
      break
    case 'staff':
      contactType = 'business'
      break
    default:
      contactType = 'friend'
  }
  
  // Generate traits based on entity type
  const traitPools: Record<string, string[]> = {
    rival_driver: ['competitive', 'driven', 'confident', 'ambitious', 'passionate', 'intense', 'focused'],
    team_owner: ['ambitious', 'strategic', 'charismatic', 'driven', 'calculating', 'sophisticated'],
    staff: ['intellectual', 'reliable', 'disciplined', 'patient', 'analytical', 'dedicated'],
    investor: ['calculating', 'ambitious', 'sophisticated', 'confident', 'strategic', 'shrewd']
  }
  
  const pool = traitPools[entity.entityType] || traitPools.staff
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  const traits = shuffled.slice(0, 3)
  
  // Generate bio
  const bioContext: SocialBioContext = {
    name: entity.name,
    age: entity.entityType === 'rival_driver' ? 25 + Math.floor(Math.random() * 15) : 40 + Math.floor(Math.random() * 20),
    gender: Math.random() > 0.3 ? 'male' : 'female', // Slight bias towards male in motorsport world
    occupation: entity.role || getOccupationForEntityType(entity.entityType),
    nationality: entity.nationality || 'British',
    traits,
    contactType,
    metAt
  }
  const bio = generateFallbackSocialBio(bioContext)
  
  // Relationship starts at different levels based on entity type
  let initialRelationship: number
  let initialTrust: number
  switch (entity.entityType) {
    case 'rival_driver':
      initialRelationship = 20 + Math.floor(Math.random() * 20) // 20-40
      initialTrust = 20
      break
    case 'team_owner':
      initialRelationship = 30 + Math.floor(Math.random() * 15) // 30-45
      initialTrust = 35
      break
    case 'staff':
      initialRelationship = 40 + Math.floor(Math.random() * 20) // 40-60
      initialTrust = 45
      break
    case 'investor':
      initialRelationship = 25 + Math.floor(Math.random() * 15) // 25-40
      initialTrust = 30
      break
    default:
      initialRelationship = 30
      initialTrust = 30
  }
  
  return {
    id: generateId(`world_${entity.entityType}`),
    name: entity.name,
    type: contactType,
    traits,
    bio,
    relationshipLevel: initialRelationship,
    affectionMeter: 30,
    romanceMeter: 0,
    trustMeter: initialTrust,
    currentMood: createDefaultMood(),
    isOnline: Math.random() > 0.3,
    lastSeen: 'Recently',
    isFavorite: false,
    metAt,
    metWeek,
    metYear,
    worldEntityId: entity.id,
    worldEntityType: entity.entityType
  }
}

function getOccupationForEntityType(type: string): string {
  switch (type) {
    case 'rival_driver': return 'Racing Driver'
    case 'team_owner': return 'Team Principal'
    case 'staff': return 'Motorsport Engineer'
    case 'investor': return 'Investor'
    default: return 'Motorsport Professional'
  }
}

// ============================================
// ENCOUNTER WEIGHTING
// ============================================

export interface WeightedEncounterPool {
  worldCharacterWeight: number // 0-1: chance of world character vs random NPC
  eligibleWorldEntities: WorldEntityInfo[]
}

/**
 * Get weighted encounter pool based on event type
 * Paddock events favor game-world characters, social events favor random NPCs
 */
export function getWeightedEncounterPool(
  eventType: string,
  worldEntities: WorldEntityInfo[]
): WeightedEncounterPool {
  let worldCharacterWeight: number
  
  switch (eventType) {
    case 'paddock_social':
    case 'race_incident':
      worldCharacterWeight = 0.70 // 70% chance of meeting a world character
      break
    case 'team_celebration':
      worldCharacterWeight = 0.60
      break
    case 'sponsor_meeting':
    case 'contract_negotiation':
      worldCharacterWeight = 0.50
      break
    case 'media_event':
      worldCharacterWeight = 0.40
      break
    case 'gala':
      worldCharacterWeight = 0.30
      break
    case 'social_scene':
    default:
      worldCharacterWeight = 0.15 // Random social events mostly generate random NPCs
      break
  }
  
  return {
    worldCharacterWeight,
    eligibleWorldEntities: worldEntities
  }
}

/**
 * Pick a world entity for an encounter (if weighted roll succeeds)
 */
export function pickWorldEntityForEncounter(
  pool: WeightedEncounterPool,
  existingContactEntityIds: Set<string>
): WorldEntityInfo | null {
  if (Math.random() > pool.worldCharacterWeight) return null
  if (pool.eligibleWorldEntities.length === 0) return null
  
  // Filter out entities already in contacts
  const available = pool.eligibleWorldEntities.filter(e => !existingContactEntityIds.has(e.id))
  if (available.length === 0) return null
  
  // Pick random from available
  return available[Math.floor(Math.random() * available.length)]
}

// ============================================
// POACHING MECHANICS
// ============================================

export interface PoachingAttempt {
  id: string
  staffId: string
  staffName: string
  staffRole: string
  currentTeam: string // 'player' or AI team name
  poachingTeam: string // Who's trying to poach
  offeredSalary: number
  currentSalary: number
  staffLoyalty: number // 0-100
  chanceOfLeaving: number // 0-100
  deadline: { week: number; year: number }
  status: 'pending' | 'accepted' | 'rejected' | 'countered'
}

/**
 * Calculate chance a staff member leaves when poached
 */
export function calculatePoachingChance(
  staffSatisfaction: number, // 0-100
  salaryIncrease: number, // Percentage increase offered
  staffLoyalty: number, // 0-100
  poachingTeamReputation: number, // 0-100
  currentTeamReputation: number // 0-100
): number {
  let chance = 20 // Base 20% chance
  
  // Salary increase effect (up to +30%)
  chance += Math.min(30, salaryIncrease * 0.5)
  
  // Satisfaction effect
  if (staffSatisfaction < 40) chance += 20
  if (staffSatisfaction < 20) chance += 15
  if (staffSatisfaction > 70) chance -= 15
  if (staffSatisfaction > 85) chance -= 10
  
  // Loyalty effect
  chance -= staffLoyalty * 0.3
  
  // Reputation difference effect
  const repDiff = poachingTeamReputation - currentTeamReputation
  if (repDiff > 20) chance += 15
  if (repDiff > 40) chance += 10
  if (repDiff < -20) chance -= 15
  
  return Math.max(5, Math.min(85, chance))
}

/**
 * Generate a poaching attempt on one of the player's staff
 * Returns null if no attempt is generated
 */
export function generateAIPoachingAttempt(
  playerStaff: Array<{ id: string; name: string; role: string; salary: number; satisfaction: number; loyalty: number }>,
  aiTeamName: string,
  aiTeamReputation: number,
  playerTeamReputation: number,
  currentWeek: number,
  currentYear: number
): PoachingAttempt | null {
  // Base 5% chance per week that an AI team tries to poach
  if (Math.random() > 0.05) return null
  if (playerStaff.length === 0) return null
  
  // Target the least satisfied or most talented staff
  const sortedByVulnerability = [...playerStaff].sort((a, b) => a.satisfaction - b.satisfaction)
  const target = sortedByVulnerability[0]
  
  // Offer 15-40% salary increase
  const salaryIncrease = 15 + Math.floor(Math.random() * 25)
  const offeredSalary = Math.round(target.salary * (1 + salaryIncrease / 100))
  
  const chance = calculatePoachingChance(
    target.satisfaction,
    salaryIncrease,
    target.loyalty,
    aiTeamReputation,
    playerTeamReputation
  )
  
  return {
    id: `poach_${currentWeek}_${currentYear}_${target.id}`,
    staffId: target.id,
    staffName: target.name,
    staffRole: target.role,
    currentTeam: 'player',
    poachingTeam: aiTeamName,
    offeredSalary,
    currentSalary: target.salary,
    staffLoyalty: target.loyalty,
    chanceOfLeaving: chance,
    deadline: { week: currentWeek + 2, year: currentYear },
    status: 'pending'
  }
}

/**
 * Player attempts to poach an AI-employed staff member
 */
export function calculatePlayerPoachingOffer(
  staffReputation: number,
  staffCurrentSalary: number,
  playerTeamReputation: number,
  aiTeamReputation: number,
  offeredSalary: number
): { chanceOfSuccess: number; counterOfferLikely: boolean } {
  const salaryIncrease = ((offeredSalary - staffCurrentSalary) / staffCurrentSalary) * 100
  
  let chance = 15 // Base 15% - harder to poach from AI
  
  // Salary effect
  chance += Math.min(25, salaryIncrease * 0.4)
  
  // Team reputation effect
  const repDiff = playerTeamReputation - aiTeamReputation
  if (repDiff > 20) chance += 15
  if (repDiff > 40) chance += 10
  if (repDiff < -20) chance -= 15
  if (repDiff < -40) chance -= 10
  
  const counterOfferLikely = staffReputation > 70 && chance > 30
  
  return {
    chanceOfSuccess: Math.max(5, Math.min(70, chance)),
    counterOfferLikely
  }
}
