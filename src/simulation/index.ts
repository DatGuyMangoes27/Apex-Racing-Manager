// Simulation exports
export * from './finances'
export * from './rivals'
export * from './events'
export * from './aiModifiers'
// Export sponsors explicitly to avoid conflicts with contracts
export * from './sponsors/negotiation'
export {
  // Types
  type SponsorTargetType,
  type SponsorTarget,
  type TargetTemplate,
  type SatisfactionChange,
  type SatisfactionLevel,
  // Constants
  GRACE_PERIOD_RACES as SPONSOR_GRACE_PERIOD_RACES,
  SATISFACTION_THRESHOLDS,
  SATISFACTION_MODIFIERS,
  MEDIA_SATISFACTION_MODIFIERS,
  PAYMENT_MODIFIERS,
  TARGET_TEMPLATES,
  SERIES_TIER_DIFFICULTY,
  REPUTATION_IMPACT,
  // Functions
  getSatisfactionLevel,
  getSatisfactionColor,
  calculateRaceSatisfactionChange as calculateSponsorRaceSatisfactionChange,
  calculateSeasonEndSatisfaction as calculateSponsorSeasonEndSatisfaction,
  // Re-export SatisfactionUpdateResult with a prefix to avoid conflict
  type SatisfactionUpdateResult as SponsorSatisfactionUpdateResult
} from './sponsors/targets'
export {
  DEFAULT_SATISFACTION,
  generateSponsorTargets,
  calculateAdjustedPayment,
  calculateAdjustedBonus
} from './sponsors'
// Export contracts explicitly
export {
  DEFAULT_TEAM_SATISFACTION,
  SATISFACTION_WARNING_THRESHOLD,
  SATISFACTION_FINAL_WARNING_THRESHOLD,
  SATISFACTION_TERMINATION_THRESHOLD,
  GRACE_PERIOD_RACES as CONTRACT_GRACE_PERIOD_RACES,
  type ContractSatisfactionModifiers,
  CONTRACT_SATISFACTION_MODIFIERS,
  type ContractTargetTemplate,
  CONTRACT_TARGET_TEMPLATES,
  generateContractTargets,
  updateContractTargets,
  finalizeContractTargets,
  isContractTargetMet,
  isContractTargetExceeded,
  type SatisfactionUpdateResult as ContractSatisfactionUpdateResult,
  calculateRaceSatisfactionChange as calculateContractRaceSatisfactionChange,
  calculateSeasonEndSatisfaction as calculateContractSeasonEndSatisfaction,
  type RenewalEvaluationResult,
  evaluateContractRenewal
} from './contracts'
// teamDevelopment exports TeamDevelopmentState which conflicts with aiModifiers
export type { TeamMilestone, CarUpgrade } from './teamDevelopment'
export {
  createDefaultTeamDevelopmentState,
  calculateTeamDevelopmentModifier,
  resetSeasonDevelopment
} from './teamDevelopment'
// health exports InjuryState which conflicts with aiModifiers
export type { InjurySeverity, InjuryType } from './health'
export {
  createDefaultInjuryState as createDefaultInjuryStateFromHealth,
  checkRandomInjury,
  getRestrictedActivities,
  getInjuryAIPenalty,
  getInjuryStatusText,
  canRaceWithInjury
} from './health'
export * from './relationships'
export * from './pressure'



