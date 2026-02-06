/**
 * Team Opportunity Generation System
 * 
 * Generates organic opportunities for teams based on their reputation,
 * recent results, relationships, and random chance.
 */

import {
  TeamOpportunityTemplate,
  TeamOpportunity,
  ALL_OPPORTUNITY_TEMPLATES,
  _SPECIAL_EVENT_TEMPLATES,
  calculateOfferChance
} from '@/data/team-opportunities';