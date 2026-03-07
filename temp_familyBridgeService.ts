/**
 * Family Bridge Service
 * 
 * Provides conversion functions between the messaging system's ContactInfo/PotentialDate
 * types and the family system's Partner/Child types.
 * 
 * This service ensures data flows correctly between:
 * - Dating contacts ΓåÆ Family partners
 * - Family partners ΓåÆ Messaging contacts
 * - Bidirectional meter synchronization
 */

import type { ContactInfo, PotentialDate, NpcMood } from '@/types/personalLife'
import type { 
  Partner, 
  Child,
  RelationshipStatus,
  PartnerOrigin, 
  PartnerCareer,
  PartnerDesires,
  _MoodFactor,
  _FamilyTree
} from '@/data/family-config'
import type { Country } from '@/data/personal-finance-config'
  const newPartner: Partner = {
    ...partner,
    happiness: clamp(partner.happiness + (changes.happiness || 0), 0, 100),
    loveLevel: clamp(partner.loveLevel + (changes.love || 0), 0, 100),
    trustLevel: clamp(partner.trustLevel + (changes.trust || 0), 0, 100),
    compatibilityScore: clamp(partner.compatibilityScore + (changes.compatibility || 0), 0, 100)
  }
  
  const newContact: ContactInfo = {
    ...contact,
    affectionMeter: newPartner.happiness,
    romanceMeter: newPartner.loveLevel,
    trustMeter: newPartner.trustLevel,
    relationshipLevel: newPartner.compatibilityScore
  }
  
  return { partner: newPartner, contact: newContact }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// ============================================
// PREGNANCY STATE
// ============================================

export interface PregnancyState {
  isPregnant: boolean
  conceptionWeek?: number
  conceptionYear?: number
  expectedBirthWeek?: number
  expectedBirthYear?: number
  weeksPregnant?: number
  announced?: boolean
  gender?: 'male' | 'female' | 'unknown'
}

export function createPregnancyState(
  currentWeek: number,
  currentYear: number
): PregnancyState {
  // Pregnancy lasts about 40 weeks (we'll use 36 game weeks)
  const PREGNANCY_DURATION_WEEKS = 36
  
  let expectedBirthWeek = currentWeek + PREGNANCY_DURATION_WEEKS
  let expectedBirthYear = currentYear
  
  // Handle year rollover (assuming 52 weeks per year)
  while (expectedBirthWeek > 52) {
    expectedBirthWeek -= 52
    expectedBirthYear += 1
  }
  
  return {
    isPregnant: true,
    conceptionWeek: currentWeek,
    conceptionYear: currentYear,
    expectedBirthWeek,
    expectedBirthYear,
    weeksPregnant: 0,
    announced: false,
    gender: 'unknown'
  }
}

export function advancePregnancy(
  pregnancy: PregnancyState,
  weeksToAdvance: number = 1
): PregnancyState {
  if (!pregnancy.isPregnant) return pregnancy
  
  const newWeeksPregnant = (pregnancy.weeksPregnant || 0) + weeksToAdvance
  
  // Reveal gender around week 20
  let gender = pregnancy.gender
  if (newWeeksPregnant >= 20 && gender === 'unknown') {
    gender = Math.random() > 0.5 ? 'male' : 'female'
  }
  
  return {
    ...pregnancy,
    weeksPregnant: newWeeksPregnant,
    gender
  }
}

export function isReadyToBirth(pregnancy: PregnancyState): boolean {
  return pregnancy.isPregnant && (pregnancy.weeksPregnant || 0) >= 36
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Check if a contact can be promoted to partner
 */
export function canPromoteToPartner(contact: ContactInfo): { 
  canPromote: boolean
  reason?: string 
} {
  if (contact.type === 'partner') {
    return { canPromote: false, reason: 'Already a partner' }
  }
  
  if (contact.type !== 'potential_date') {
    return { canPromote: false, reason: 'Contact is not a potential romantic interest' }
  }
  
  if (contact.datingStatus !== 'exclusive') {
    return { canPromote: false, reason: 'Relationship must be exclusive before becoming official partners' }
  }
  
  if ((contact.romanceMeter || 0) < 50) {
    return { canPromote: false, reason: 'Romance level too low' }
  }
  
  return { canPromote: true }
}

/**
 * Check if partner can be proposed to
 */
export function canProposeToPartner(partner: Partner): {
  canPropose: boolean
  reason?: string
} {
  if (partner.relationshipStatus !== 'dating') {
    return { canPropose: false, reason: 'Must be dating before proposing' }
  }
  
  if (partner.loveLevel < 70) {
    return { canPropose: false, reason: 'Love level should be at least 70%' }
  }
  
  if (partner.trustLevel < 60) {
    return { canPropose: false, reason: 'Trust level should be at least 60%' }
  }
  
  return { canPropose: true }
}

/**
 * Check if partner can have children
 */
export function canHaveChild(
  partner: Partner,
  existingChildren: Child[],
  pregnancy?: PregnancyState
): {
  canHaveChild: boolean
  reason?: string
} {
  if (partner.relationshipStatus !== 'married') {
    return { canHaveChild: false, reason: 'Must be married to have children' }
  }
  
  if (pregnancy?.isPregnant) {
    return { canHaveChild: false, reason: 'Already expecting a child' }
  }
  
  if (existingChildren.length >= 6) {
    return { canHaveChild: false, reason: 'Maximum number of children reached' }
  }
  
  if (partner.age > 45) {
    return { canHaveChild: false, reason: 'Partner age makes having children unlikely' }
  }
  
  return { canHaveChild: true }
}

// ============================================
// EXPORT HELPERS
// ============================================

export {
  clamp
}
