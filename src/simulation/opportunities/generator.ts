/**
 * Team Opportunity Generation System
 * 
 * Generates organic opportunities for teams based on their reputation,
 * recent results, relationships, and random chance.
 */

import {
  TeamOpportunity,
  ALL_OPPORTUNITY_TEMPLATES,
  calculateOfferChance
} from '@/data/team-opportunities';

// ============================================
// TYPES
// ============================================

export interface OpportunityGenerationContext {
  teamReputation: number
  recentResults: Array<{ position: number; points: number }>
  currentWeek: number
  currentYear: number
  existingOpportunities: TeamOpportunity[]
  teamTier: string
}

// ============================================
// GENERATION
// ============================================

export function generateWeeklyOpportunities(
  context: OpportunityGenerationContext
): TeamOpportunity[] {
  const opportunities: TeamOpportunity[] = []
  
  for (const template of ALL_OPPORTUNITY_TEMPLATES) {
    const chance = calculateOfferChance(template, context.teamReputation)
    if (Math.random() < chance) {
      const expiresInWeeks = Math.max(1, Math.ceil(template.expirationDays / 7))
      const opp: TeamOpportunity = {
        ...template,
        instanceId: `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        generatedWeek: context.currentWeek,
        generatedYear: context.currentYear,
        expiresWeek: context.currentWeek + expiresInWeeks,
        expiresYear: context.currentYear,
        status: 'pending'
      }
      opportunities.push(opp)
    }
  }
  
  return opportunities
}

export function acceptOpportunity(opportunity: TeamOpportunity): TeamOpportunity {
  return { ...opportunity, status: 'accepted' }
}

export function declineOpportunity(opportunity: TeamOpportunity): TeamOpportunity {
  return { ...opportunity, status: 'declined' }
}

export function hasOpportunityExpired(opportunity: TeamOpportunity, currentWeek: number): boolean {
  return currentWeek > (opportunity.expiresWeek ?? opportunity.generatedWeek + 4)
}

export function completeOpportunity(opportunity: TeamOpportunity): TeamOpportunity {
  return { ...opportunity, status: 'completed' }
}