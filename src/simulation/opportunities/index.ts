/**
 * Team Opportunities System
 * 
 * Generates and manages organic opportunities that arrive via email.
 */

export * from './generator'

// Re-export templates and types for convenience
export {
  ALL_OPPORTUNITY_TEMPLATES,
  MEDIA_APPEARANCE_TEMPLATES,
  MANUFACTURER_PROGRAM_TEMPLATES,
  SPECIAL_EVENT_TEMPLATES,
  getAvailableTemplates,
  getTemplatesByCategory,
  getTemplatesByFrequency,
  calculateOfferChance
} from '@/data/team-opportunities'

export type {
  TeamOpportunityTemplate,
  TeamOpportunity,
  OpportunityCategory,
  OrganizerType,
  OpportunityRewards,
  OpportunityConsequences,
  OpportunityConditions
} from '@/data/team-opportunities'
