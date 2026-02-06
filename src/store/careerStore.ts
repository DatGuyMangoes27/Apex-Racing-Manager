import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useState, useEffect, useRef } from 'react'
import type { PersonalLifeState, SocialLogEntry, SocialLogType } from '@/components/personal/PersonalLifeDashboard'
import type { 
  ExpandedPersonalLifeState, 
  MessagingState, 
  ContactInfo,
  PotentialDate,
  ExpandedHobbiesState,
  CollectionsState,
  ExpandedSocialMediaState,
  TravelState,
  ExtendedRetirementState
} from '@/types/personalLife'
import {
  createDefaultMessagingState,
  createDefaultExpandedHobbiesState,
  createDefaultCollectionsState,
  createDefaultExpandedSocialMediaState,
  createDefaultTravelState,
  createDefaultRetirementState,
  createDefaultEducationState,
  createDefaultPrivacyState,
  createDefaultExpandedBrandState,
  createDefaultActivismState
} from '@/types/personalLife'
// Circular dependency with rivalStore is safe - we only access useRivalStore.getState() inside functions
import { useRivalStore, getSalaryRangeForTier } from './rivalStore'
import { getWeeksInYear, getLastWeekLength, advanceDayInWeekSystem } from '@/utils/calendar'
import { 
  calculateFatigueCarryOver, 
  calculateRestRecovery, 
  calculateMentalFatigueImpact, 
  resetDayBudget, 
  TIME_BUDGET_CONFIG 
} from '@/simulation/timeBudget'
import { MANUFACTURERS, type ManufacturerPartsCosts } from '@/data/manufacturers'
import type { TelemetryParticipant, ProgramEntryInfo, MidSeasonReassignment, TeamTier } from './rivalStore'
import { getPointsSystem, getPointsForPosition } from '@/data/points-systems'
import { getChampionshipById, getSeriesMaxTeamCars } from '@/data/championships'
import { 
  calculateRaceXP, 
  calculateLevelFromXP,
  calculatePassiveSkillGrowth,
  TRAINING_PROGRAMS,
  calculateTrainingEffectiveness,
  calculateTrainingSkillGains,
  type RaceResultForXP,
  type CareerStage as DriverCareerStage,
  type TrainingProgram
} from '@/data/driver-development-config'
import { useScoutingStore } from './scoutingStore'
import { SponsorDeal, processWeeklyExpenses, generateSponsorOffers as generateSponsorOffersFromSim, getSponsorPersonality } from '@/simulation/finances'
import { generateSponsorTargets } from '@/simulation/sponsors'
import { ALL_ACTIVITY_TRIGGERS, TriggerContext, evaluateTriggerConditions, createActivityFromTrigger } from '@/simulation/activities'
import { getActivityTimeCost } from '@/data/activity-time-costs'
import { routeNotification } from '@/services/notificationRouter'
import { 
  MANDATORY_ACTIVITY_TEMPLATES,
  shouldTriggerActivity,
  createMandatoryActivity,
  calculateDeadline
} from '@/simulation/activities/mandatoryActivities'
import {
  processTeamSponsorPayments,
  processWeeklyFacilityCosts,
  processWeeklyDevelopmentCosts,
  processManufacturerPayment,
  processSeriesRevenue,
  processWeeklyCarMaintenance,
  processChampionshipPrize,
  processTeamSponsorRaceBonuses,
  processTeamSponsorChampionshipBonuses,
  processSeasonEndSponsorContracts,
  generateSponsorRenewalOffers,
  generateRenewalEmailContent,
  updateTeamBudgets,
  updateTeamProjections,
  createDefaultTeamBudgets,
  createTeamTransaction,
  createDefaultTeamFinancialState,
  processFacilityUpgradeStart,
  canAffordFacilityUpgrade,
  getFacilityUpgradeInfo,
  calculateDynamicFacilityCosts,
  processRacePrizeIncome,
  processRaceTravelCosts,
  processCarRepair
} from '@/simulation/finances/teamFinances'
import { processWeeklyLoans } from '@/simulation/finances/loans'
import { triggerPersonalGuarantee } from '@/simulation/finances/equityManager'
import { 
  applyStaffCostPerk,
  applyFanEngagementPerk,
  applyMediaCoveragePerk
} from '@/simulation/perkSystem'
import { 
  calculateRaceSatisfactionChange as calculateContractSatisfactionChange,
  updateContractTargets,
  updateSeasonStats as updateContractSeasonStats,
  DEFAULT_TEAM_SATISFACTION,
  RaceResultForContract,
  evaluateContractRenewal
} from '@/simulation/contracts'
import { processWeeklyInvestments } from '@/simulation/finances/investments'
import { processWeeklySales, SalesContext } from '@/simulation/finances/merchandise'
import { processWeeklyPersonalFinances, processAnnualTaxes } from '@/simulation/finances/personalFinances'
import { processWeeklySpareParts, calculateWeeklySparePartsCosts } from '@/simulation/logistics/weeklyProcessing'
import {
  processWeeklyHealth,
  processWeeklyBrand,
  processWeeklySocialCircle,
  processWeeklyStaff,
  calculateHobbyBenefits,
  processAnnualStaff,
  processAnnualHobby,
  addReputationEvent,
  createSocialContact,
  processAnnualEndorsements
} from '@/simulation/personal/lifestyleManager'
import {
  processWeeklyAssets,
  calculateLifestyleScore
} from '@/simulation/personal/lifestyleAssetsManager'
import { createDefaultLifestyleAssets } from '@/data/lifestyle-assets-config'
import { getLifestyleTier } from '@/data/lifestyle-config'
import {
  attendSocialEvent,
  hostSocialEvent,
  processWeeklyRivalries,
  processRivalryEvent,
  processScandalWeek,
  calculateOngoingScandalEffects,
  createScandal,
  processAnnualPhilanthropy
} from '@/simulation/personal/socialEventsManager'
import { processWeeklyRelationship, calculateDivorceSettlement, processDivorce } from '@/simulation/personal/relationshipManager'
import { processWeeklyFamily } from '@/simulation/personal/familyManager'
import {
  SOCIAL_EVENT_TEMPLATES,
  RIVALRY_EVENTS,
  getPrivacyLevel as getPrivacyLevelConfig
} from '@/data/social-events-config'
import type { ScandalType } from '@/data/social-events-config'
import { 
  SPONSORS, 
  SponsorPriority, 
  SponsorPriorityType, 
  SponsorExpectations 
} from '@/data/sponsors'
import { 
  checkWorksReassignment, 
  generateReassignmentEvent, 
  ReassignmentInfo, 
  CareerEvent,
  generateSponsorWarningEvent,
  generateSponsorTerminationEvent,
  generateSponsorHappyEvent
} from '@/simulation/events'
import {
  generateStaffMarket,
  refreshStaffMarket as refreshMarketSimulation,
  initiateNegotiation as initiateNegotiationSimulation,
  processNegotiationRound,
  calculateCandidateImpact as calculateCandidateImpactSimulation
} from '@/simulation/staffMarket'
import { 
  calculateRaceSatisfactionChange, 
  updateTargetProgress, 
  calculateAdjustedBonus,
  calculateAdjustedPayment,
  shouldIssueWarning,
  shouldTerminateContract,
  getSponsorMoodSummary,
  REPUTATION_IMPACT,
  RaceResultForSatisfaction,
  getPaymentModifier,
  calculateSeasonEndSatisfaction,
  finalizeSeasonTargets,
  DEFAULT_SATISFACTION,
  SponsorTarget,
  processWeeklyNegotiations
} from '@/simulation/sponsors'
import {
  RPGState,
  MilestoneProgress,
  TeamDevelopmentState as AIModifierTeamDevState,
  InjuryState,
  AIModifierResult,
  createDefaultRPGState,
  createDefaultMilestones,
  createDefaultInjuryState,
  calculateAIModifier,
  updateMilestones,
  calculatePodiumStreak,
  getNewlyUnlockedMilestones,
  formatMilestoneName,
  MILESTONE_PERKS
} from '@/simulation/aiModifiers'
import {
  TeamDevelopmentState,
  DevelopmentArea,
  TeamDevelopmentEvent,
  createDefaultTeamDevelopmentState,
  applyWeeklyDevelopment,
  startUpgradeResearch,
  setDevelopmentFocus,
  setWeeklyAllocation,
  addResultBonus,
  calculateTeamDevelopmentModifier,
  resetSeasonDevelopment,
  applyEventEffects,
  getAvailableUpgrades,
  getUpgradeById,
  UPGRADES,
  AREA_EFFECTS,
  formatBudget
} from '@/simulation/teamDevelopment'
import { 
  FacilityType,
  FACILITY_TYPES,
  FACILITY_NAMES,
  getFacilityLevelConfig,
  calculateUpgradeCost,
  calculateUpgradeDuration,
  calculateFacilityWeeklyCost,
  canUpgradeFacility,
  getFacilitySummary,
  calculateFacilityUpgradeCost,
  getUpgradeDuration,
  getFacilityStaffSlots,
  getFacilityRDBonus,
  calculateStaffEffectivenessBonus,
  calculateTotalFacilityWeeklyCosts,
  getAllFacilityTypes,
  MAX_FACILITY_LEVEL
} from '@/data/facility-config'
import {
  FacilityStaffMember,
  TeamStaffMember,
  StaffMember,
  FacilityStaffRole,
  TeamStaffRole as FacilityConfigTeamStaffRole,
  generateFacilityStaff,
  generateTeamStaff,
  calculateContractCost,
  generateWorldStaffPool
} from '@/data/facility-staff-config'
import { inferGenderFromName } from '@/data/staff-names'
import { getPortraitIdByGender } from '@/utils/generated-assets'
import { generateFallbackSocialBio } from '@/services/dialogueAI'
import { processWeeklySystems, type WeeklyProcessingContext } from '@/simulation/weeklySystemsProcessor'
import { generateAllFeedback, type FeedbackContext } from '@/simulation/feedbackLoops'
import { generateFamilyMilestones, type FamilyContext } from '@/simulation/familyMilestones'
import { generateBoardDecision, type BoardDecisionContext } from '@/simulation/boardDecisions'
import { generateWeatherForecast, generateWeatherForecastEmail } from '@/simulation/weatherForecast'
import { generateMidSeasonDirective, generatePreSeasonRegulations, generateRegulationEmail } from '@/simulation/regulationChanges'
import { checkRetirementTriggers, generateRetirementPromptEmail, type RetirementContext } from '@/simulation/retirementSystem'
import type { SocialBioContext } from '@/services/dialogueAI'
import type { SparePartType, ShippingMethod } from '@/data/spare-parts-config'
import type { WorldRegion } from '@/data/travel-logistics'

// Re-export SponsorDeal for UI components
export type { SponsorDeal }

// Re-export Sponsor personality types
export type { SponsorPriority, SponsorPriorityType, SponsorExpectations }

// Re-export Invitational types
export type { InvitationalEvent, InvitationalEventTemplate }

// Re-export RPG types
export type { RPGState, MilestoneProgress, InjuryState, AIModifierResult }
export type { TeamDevelopmentState, DevelopmentArea, TeamDevelopmentEvent }
export { UPGRADES, AREA_EFFECTS, formatBudget, getAvailableUpgrades, getUpgradeById }

// Local helper functions for tier-based economy (fallbacks if rivalStore functions unavailable)
function getSeatCostForTierLocal(tier: TeamTier): number {
  switch (tier) {
    case 'entry': return 25000
    case 'amateur': return 75000
    case 'semi-pro': return 200000
    case 'professional': return 350000
    case 'pro': return 400000
    case 'elite': return 0
    case 'pinnacle': return 0
    default: return 25000
  }
}

function getSalaryRangeForTierLocal(tier: TeamTier): { min: number; max: number } {
  switch (tier) {
    case 'entry': return { min: 0, max: 0 }
    case 'amateur': return { min: 0, max: 0 }
    case 'semi-pro': return { min: 0, max: 50000 }
    case 'professional': return { min: 30000, max: 150000 }
    case 'pro': return { min: 80000, max: 350000 }
    case 'elite': return { min: 200000, max: 800000 }
    case 'pinnacle': return { min: 500000, max: 3000000 }
    default: return { min: 0, max: 0 }
  }
}

// Simple hash function for consistent randomness
function hashStringLocal(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

// Calculate seat cost with variation based on team prestige
function calculateSeatCostWithVariationLocal(tier: TeamTier, prestige: number, randomSeed?: number): number {
  const baseCost = getSeatCostForTierLocal(tier)
  if (baseCost === 0) return 0
  
  // Prestige multiplier: 0.7x to 1.4x
  const prestigeMultiplier = 0.7 + (prestige / 100) * 0.7
  
  // Random variation: ±15%
  const random = randomSeed !== undefined 
    ? ((randomSeed % 1000) / 1000)
    : Math.random()
  const randomVariation = 0.85 + (random * 0.3)
  
  return Math.round((baseCost * prestigeMultiplier * randomVariation) / 1000) * 1000
}

// Calculate salary range with variation based on prestige
function calculateSalaryRangeWithVariationLocal(tier: TeamTier, prestige: number): { min: number; max: number } {
  const baseRange = getSalaryRangeForTierLocal(tier)
  if (baseRange.max === 0) return { min: 0, max: 0 }
  
  // Prestige multiplier: 0.6x to 1.5x
  const prestigeMultiplier = 0.6 + (prestige / 100) * 0.9
  
  return {
    min: Math.round((baseRange.min * prestigeMultiplier) / 1000) * 1000,
    max: Math.round((baseRange.max * prestigeMultiplier) / 1000) * 1000
  }
}

import { 
  PlayerBackground, 
  BackgroundScenarioId, 
  BACKGROUND_SCENARIOS,
  createBackgroundFromScenario,
  getScenarioById
} from '@/data/backgrounds'

import { normalizeTrackName, getTrackDisplayName } from '@/data/track-aliases'
import { 
  InvitationalEvent,
  InvitationalEventTemplate,
  getEligibleEventTemplates,
  selectEventTemplate,
  generateInvitationalEvent,
  calculateInvitationChance,
  INVITATIONAL_TEMPLATES
} from '@/data/invitational-events'
import { 
  TeamOpportunity,
  TeamOpportunityTemplate,
  OpportunityCategory
} from '@/data/team-opportunities'
import {
  generateWeeklyOpportunities,
  acceptOpportunity as acceptOpportunityFn,
  declineOpportunity as declineOpportunityFn,
  hasOpportunityExpired,
  completeOpportunity,
  OpportunityGenerationContext
} from '@/simulation/opportunities/generator'
import {
  generateInvitationEmail,
  generateSponsorOfferEmail,
  generateSponsorWarningEmail,
  generateBoardWarningEmail,
  generateWelcomeEmail,
  generateWeeklySummaryEmail
} from '@/simulation/emailGeneration'
import { generateRivalDrama } from '@/simulation/rivals/rivalDrama'
import { 
  GOATProgress, 
  GOATTier,
  createDefaultGOATProgress, 
  calculateGOATTier, 
  calculateTierProgress,
  checkMilestoneCondition,
  ALL_MILESTONES,
  TRIPLE_CROWNS,
  HISTORICAL_RECORDS,
  getMilestoneById
} from '@/data/achievements'

// Re-export background types
export type { PlayerBackground, BackgroundScenarioId }

// Re-export GOAT types
export type { GOATProgress, GOATTier }

// Legacy type alias for backwards compatibility
export type CareerScenario = BackgroundScenarioId

export interface DriverStats {
  racecraft: number      // 0-100: Overtaking, defending, racecraft
  consistency: number    // 0-100: Fewer mistakes
  wetSkill: number       // 0-100: Rain performance
  tireManagement: number // 0-100: Tire wear optimization
  technicalFeedback: number // 0-100: Helps team development
  mentalStrength: number // 0-100: Performance under pressure
  fitness: number        // 0-100: Physical endurance
  marketability: number  // 0-100: Sponsor attraction
}

export interface DriverMentalState {
  confidence: number     // 0-100: Self-belief
  stress: number         // 0-100: Pressure level
  fatigue: number        // 0-100: Tiredness (affects performance)
  morale: number         // 0-100: Happiness
}

export interface DriverHealth {
  fitness: number        // 0-100: Current fitness level
  injured: boolean
  injuryType?: string
  recoveryWeeks?: number
}

export interface DriverFinances {
  bankBalance: number
  salary: number         // Per race
  bonusPerWin: number
  bonusPerPodium: number
  debts: number
  transactions: FinancialTransaction[]
  sponsorDeals: SponsorDeal[]  // Active sponsor contracts
}

// ============================================
// PERSONAL FINANCES (Owner Path)
// ============================================
// Re-export types from personal-finance-config for convenience
export type {
  PersonalFinancialState,
  PersonalLoan,
  Mortgage,
  PersonalGuarantee,
  PersonalTransaction,
  TeamEquityStake,
  ExternalInvestor,
  LifestyleLevel
} from '@/data/personal-finance-config'

// Import the actual types for use in this file
import type {
  PersonalFinancialState,
  TeamEquityStake,
  LifestyleLevel
} from '@/data/personal-finance-config'
import { LIFESTYLE_CONFIGS } from '@/data/personal-finance-config'

export interface FinancialTransaction {
  id: string
  date: string           // ISO date
  week: number
  year: number
  type: 'income' | 'expense'
  category: 'salary' | 'bonus' | 'prize' | 'sponsorship' | 'seat_fee' | 'training' | 'equipment' | 'travel' | 'living_expenses' | 'other'
  amount: number
  description: string
}

// Legacy contract type (kept for backwards compatibility)
export type ContractType = 'works-full' | 'works-partial' | 'factory-supported' | 'customer' | 'spec';

// New contract type based on offer type
export type ContractOfferType = 'works-program' | 'spec-series-team' | 'customer-team';

// Current assignment details - what car/entry you're racing
export interface CurrentAssignment {
  entryId: string           // Team entry ID
  entryName: string         // Display name (e.g., "BMW M Hybrid V8 #25")
  carName: string           // Car name (e.g., "BMW M Hybrid V8")
  carClassId: string        // For car class lookup
  seriesId: string          // Series you're racing in
  seriesName: string        // Series display name
}

// Contract status determines what offers a player can receive
export type ContractStatus = 'locked' | 'final_year' | 'free_agent'

// ============================================
// CONTRACT TARGET SYSTEM (similar to sponsor targets)
// ============================================

export type ContractTargetType = 
  | 'championship_position'  // Finish in top X in championship
  | 'points_minimum'         // Score at least X points
  | 'wins'                   // Win at least X races
  | 'podiums'                // Score at least X podiums
  | 'beat_teammate'          // Beat teammate in championship

export type ContractTargetSeverity = 'mandatory' | 'expected' | 'bonus'

export interface ContractTarget {
  id: string
  type: ContractTargetType
  targetValue: number         // The target to achieve
  currentProgress: number     // Current progress towards target
  description: string         // Human-readable description
  met: boolean                // Whether target has been met
  exceeded: boolean           // Whether target was exceeded
  severity: ContractTargetSeverity  // mandatory = termination risk, expected = warning, bonus = extra reward
  isInverse?: boolean         // For targets where lower is better (not currently used)
}

// ============================================
// RENEWAL AND EXTENSION OPTIONS
// ============================================

export type AutoRenewCondition = 'meets_targets' | 'championship_top3' | 'championship_top5' | 'team_option' | 'mutual' | 'none'

export interface RenewalConditions {
  autoRenewIf: AutoRenewCondition
  extensionYears: number        // How many years to extend
  salaryIncrease: number        // Percentage increase on renewal (e.g., 10 = 10%)
  renewalBonusPerWin?: number   // Updated bonus per win on renewal
  renewalBonusPerPodium?: number // Updated bonus per podium on renewal
}

export interface TeamOption {
  canExtend: boolean
  years: number                 // Years to extend if exercised
  deadline: number              // Week number to exercise by (0 = end of season)
  exercised?: boolean
  salaryOnExtension?: number    // Fixed salary if exercised
}

export interface PlayerOption {
  canExtend: boolean
  years: number
  deadline: number              // Week number to exercise by
  exercised?: boolean
  salaryOnExtension?: number
}

// ============================================
// TERMINATION CLAUSES
// ============================================

export interface TerminationConditions {
  performanceClause: boolean      // Can be fired for poor performance
  missedTargetLimit: number       // How many mandatory targets can be missed (usually 1-2)
  dnfPenalty: boolean             // DNF penalties active
  maxDNFsBeforeWarning: number    // e.g., 3
  maxDNFsBeforeTermination: number // e.g., 5
  canBeTerminatedMidSeason: boolean // If true, can be fired during season
}

// ============================================
// MEDIA DUTIES
// ============================================

export interface MediaDutyProgress {
  press: number
  social: number
  events: number
}

export type MediaDutyPenalty = 'salary_reduction' | 'satisfaction_drop' | 'both'

export interface MediaDuties {
  pressConferencesRequired: number  // Required per season
  socialMediaPosts: number          // Required per season
  teamEventsRequired: number        // Required per season
  completed: MediaDutyProgress
  penalty: MediaDutyPenalty
  penaltyAmount?: number            // Percentage for salary reduction or points for satisfaction
}

// ============================================
// CONTRACT SEASON STATISTICS
// ============================================

export interface ContractSeasonStats {
  dnfCount: number              // DNFs this season
  wins: number                  // Wins this season
  podiums: number               // Podiums this season
  points: number                // Points this season
  racesCompleted: number        // Races completed this season
  teammateBattleWins: number    // Races where player beat teammate
  teammateBattleLosses: number  // Races where teammate beat player
  warningsIssued: number        // Warnings issued this season
  seasonYear: number            // Year these stats are for
}

export type ContractRole = 
  | 'driver' 
  | 'staff-chief-engineer' 
  | 'staff-technical-director'
  | 'staff-strategist' 
  | 'staff-team-manager'
  | 'staff-pr-manager'
  | 'staff-crew-chief'
  | 'staff-data-engineer'
  | 'staff-reserve-driver'

export interface Contract {
  teamId: string
  teamName: string
  seriesId: string           // Primary series (for backwards compatibility)
  seriesName: string
  salary: number
  bonusPerWin: number
  bonusPerPodium: number
  startYear: number
  endYear: number
  clauseValue?: number       // Buyout/release clause - what other teams must pay to sign you
  
  // Multi-series program fields (legacy)
  programId?: string         // Links to RacingProgram if works contract
  manufacturerId?: string    // e.g., 'bmw', 'porsche'
  contractType: ContractType
  /** All series IDs included in this contract */
  seriesIds: string[]
  /** Primary series for conflict resolution */
  primarySeriesId: string
  
  // Contract type and assignment tracking
  offerType?: ContractOfferType         // Type of contract (works/spec/customer)
  currentAssignment?: CurrentAssignment  // Current car/entry assignment
  canBeReassigned: boolean               // If true, manufacturer can reassign (works only)
  role?: ContractRole                    // Driver vs staff role (owner-driver uses driver role)
  synergyTags?: string[]                 // Chemistry hooks for future expansion
  escalationClausePct?: number           // Salary escalator per year/option
  buyoutAmount?: number                  // Optional buyout to terminate early
  
  // ============================================
  // ENHANCED CONTRACT FEATURES
  // ============================================
  
  // Performance Goals
  targets?: ContractTarget[]              // Performance targets for this contract
  
  // Renewal & Extension Options
  renewalConditions?: RenewalConditions   // Conditions for automatic renewal
  teamOption?: TeamOption                 // Team's option to extend
  playerOption?: PlayerOption             // Player's option to extend
  
  // Termination Clauses
  terminationConditions?: TerminationConditions  // When contract can be terminated
  
  // Team Satisfaction (like sponsor satisfaction)
  teamSatisfaction?: number               // 0-100 (starts at 70)
  warningIssued?: boolean                 // If team has issued a warning
  finalWarningIssued?: boolean            // If final warning has been issued
  satisfactionHistory?: {                 // Track what caused satisfaction changes
    week: number
    year: number
    oldValue: number
    newValue: number
    reason: string
    mediaEventId?: string
  }[]
  
  // Media Duties
  mediaDuties?: MediaDuties               // Required media activities
  
  // Season Stats Tracking
  seasonStats?: ContractSeasonStats       // Current season statistics
}

export interface RaceResult {
  id: string
  seriesId: string
  round: number
  trackId: string
  trackName: string
  date: string
  qualifyingPosition: number
  racePosition: number
  fastestLap: boolean
  dnf: boolean
  dnfReason?: string
  points: number
  prizeMoney: number
  wasWet?: boolean
}

// ============================================
// TRACK HISTORY SYSTEM
// ============================================

/**
 * Historical statistics for a single track
 * Used for commentary ("4 wins in 21 visits") and GOAT achievements
 */
export interface TrackHistory {
  trackId: string              // Canonical track ID (from track-aliases.ts)
  trackName: string            // Display name
  visits: number               // Total times raced here
  wins: number
  podiums: number
  poles: number
  fastestLaps: number
  dnfs: number
  bestFinish: number           // Best race position (1 = win)
  worstFinish: number          // Worst race position
  avgFinish: number            // Running average finish position
  consecutiveWins: number      // Current win streak at this track
  maxConsecutiveWins: number   // All-time best streak at this track
  consecutiveVisits: number    // Current visits without DNF
  lastVisitYear: number
  firstVisitYear: number
  lastResult: number           // Last race position
  seriesRacedHere: string[]    // Which series player has raced here
}

/** Calendar conflict when player has multiple races on the same weekend */
export interface CalendarConflict {
  id: string
  week: number
  year: number
  races: Array<{
    seriesId: string
    seriesName: string
    trackId: string
    trackName: string
    country: string
    round: number
    totalRounds: number
    standingsPosition: number
    pointsToLeader: number
    prizeMoney: { win: number; podium: number }
  }>
  resolved: boolean
  chosenSeriesId?: string
}

// ============================================
// TEAM OWNERSHIP (Stage 1 scaffolding)
// ============================================

export type TeamStaffRole = 
  | 'chief_engineer'      // Car setup, engineering decisions
  | 'technical_director'  // Overall R&D leadership
  | 'strategist'          // Pit timing, tire strategy, race calls
  | 'team_manager'        // Operations, logistics, coordination
  | 'pr_manager'          // Media relations, sponsor liaison
  | 'crew_chief'          // Pit crew leadership, reliability
  | 'data_engineer'       // Telemetry analysis, simulation
  | 'reserve_driver'      // Testing, backup driver

// Contract for staff members
export interface StaffContract {
  salary: number           // Monthly salary
  startYear: number
  endYear: number
  bonus?: number           // Performance bonus
  buyoutClause?: number
}

// Re-export FacilityType from config and FacilityStaffMember
export type { FacilityType }
export type { FacilityStaffMember, FacilityStaffRole } from '@/data/facility-staff-config'

export interface TeamStaff {
  id: string
  name: string
  gender?: 'male' | 'female'
  portraitId?: string       // Persistent portrait reference from manifest
  role: TeamStaffRole
  nationality?: string
  skills: {
    reliability: number   // 0-100
    strategy: number      // 0-100
    pit: number           // 0-100
    aeroAssist?: number   // hook for future expansion
  }
  morale: number          // 0-100
  fatigue: number         // 0-100
  contract?: StaffContract
  assignedFacility?: FacilityType  // Which facility this staff member is assigned to
  specializations?: StaffSpecialization[]  // Unique traits/abilities
  personality?: StaffPersonality
  experience?: number     // Years in motorsport
  age?: number
  bio?: StaffBio          // Full biography and career history
}

// ============================================
// STAFF JOB MARKET SYSTEM
// ============================================

// Staff specialization traits that provide unique bonuses
export type StaffSpecialization = 
  | 'setup_wizard'      // +15% setup optimization
  | 'pit_master'        // -10% pit stop time
  | 'data_analyst'      // +10% telemetry insights
  | 'motivator'         // +5 team morale
  | 'cost_cutter'       // -10% development costs
  | 'talent_scout'      // Better driver evaluations
  | 'media_savvy'       // +15% sponsor attraction
  | 'tire_whisperer'    // +10% tire management
  | 'reliability_guru'  // -15% mechanical failures
  | 'aero_specialist'   // +20% aero development

// Staff personality affects negotiation and team chemistry
export type StaffPersonality = 'ambitious' | 'loyal' | 'demanding' | 'flexible'

// Current employment status of a candidate
export type StaffAvailabilityStatus = 'available' | 'employed' | 'retiring'

// Skills interface (reusable)
export interface StaffSkills {
  reliability: number   // 0-100
  strategy: number      // 0-100
  pit: number           // 0-100
  aeroAssist?: number   // hook for future expansion
}

// Enhanced staff candidate in job market
// Work history entry for staff career
export interface WorkHistoryEntry {
  team: string
  role: string
  years: string                // e.g., "2018-2022"
  achievement?: string         // Notable accomplishment at this team
}

// Full staff biography
export interface StaffBio {
  background: string           // Career narrative paragraph
  careerHighlights: string[]   // Key achievements
  workHistory: WorkHistoryEntry[]
  personalityNote: string      // How they're known to work
  strengths: string[]
  weaknesses: string[]
}

export interface StaffCandidate {
  id: string
  name: string
  role: TeamStaffRole
  nationality: string
  age: number
  experience: number           // Years in motorsport
  reputation: number           // 1-100, affects salary expectations
  skills: StaffSkills
  specializations: StaffSpecialization[]  // 1-2 unique traits
  personality: StaffPersonality
  currentStatus: StaffAvailabilityStatus
  salaryExpectation: number    // Monthly salary expectation
  contractPreference: number   // Preferred contract years
  availability: number         // Weeks until available (0 = immediately)
  interestedTeams: string[]    // AI teams also interested (for competition)
  // Rich biography data
  bio: StaffBio
}

// ============================================
// WORLD STAFF POOL SYSTEM
// ============================================

export type WorldStaffPoolStatus = 'available' | 'employed_ai' | 'employed_player' | 'retired' | 'cooldown'

export interface WorldStaffMember {
  staff: StaffMember  // FacilityStaffMember | TeamStaffMember (from facility-staff-config)
  status: WorldStaffPoolStatus
  employedBy?: string           // AI team name or player team ID
  cooldownWeeksRemaining?: number  // Weeks until available again after firing
  enteredPoolYear: number       // Year this person entered the pool
  retirementAge: number         // Pre-calculated retirement age (55-68)
}

// Contract offer for negotiations
export interface StaffContractOffer {
  salary: number               // Monthly salary
  signingBonus: number
  performanceBonus: number     // Annual performance bonus
  contractLength: number       // Years
  buyoutClause: number
  facilitiesPromised?: FacilityType[]  // Promised facility assignments
}

// Negotiation state tracking
export interface StaffNegotiation {
  id: string
  candidateId: string
  candidateName: string
  stage: 'initial' | 'counter' | 'final' | 'complete' | 'rejected' | 'accepted'
  playerOffer: StaffContractOffer
  candidateCounter?: StaffContractOffer
  negotiationRounds: number
  maxRounds: number
  mood: 'positive' | 'neutral' | 'negative'
  startedWeek: number
  expiresWeek: number          // Negotiation has a time limit
}

// Impact preview when considering hiring a candidate
export interface StaffImpactPreview {
  developmentBonus: {
    aero: number
    chassis: number
    engine: number
    sim: number
    manufacturing: number
    marketing: number
  }
  racePerformance: {
    pitStopBonus: number       // Percentage reduction in pit time
    strategyBonus: number      // Percentage improvement in strategy
    reliabilityBonus: number   // Percentage reduction in failures
    tireManagement: number     // Percentage improvement in tire life
  }
  teamImpact: {
    moraleBonus: number        // Points added to team morale
    chemistryScore: number     // How well they fit with existing staff
    budgetImpact: number       // Total annual cost (salary + bonuses)
  }
}

// Contract for hired team drivers (NOT the owner-driver)
export interface HiredDriverContract {
  salary: number                // Per-race salary/appearance fee
  monthlyRetainer?: number      // Base monthly retainer (paid weekly)
  bonusPerWin: number
  bonusPerPodium: number
  startYear: number
  endYear: number
  targets: ContractTarget[]     // Performance targets
  buyoutClause?: number
  satisfaction: number          // 0-100
}

// Hired driver assigned to player's team (owner always drives their assigned car)
export interface TeamDriver {
  driverId: string              // References RivalDriver.id
  carAssignment: string         // carId from TeamCar - the car this driver is assigned to
  contract: HiredDriverContract
  synergyTags?: string[]        // Chemistry hooks for future
  seasonStats?: {
    races: number
    wins: number
    podiums: number
    points: number
    avgFinish: number
    bestFinish: number
    dnfs: number
  }
  // Development tracking
  development?: {
    experiencePoints: number
    experienceLevel: number
    trainingProgram: string | null  // TrainingProgram type
    trainingStartWeek: number
    trainingStartYear: number
    trainingProgress: number        // 0-100%
    skillBoosts: Record<string, number>  // Accumulated skill boosts from training
    recentRaceXP: number[]          // Last 5 race XP earnings
  }
}

export interface TeamUpgradeTask {
  id: string
  type: 'performance' | 'reliability'
  cost: number
  weeksRemaining: number
  qualityRoll?: number   // For variance hooks
}

// ============================================
// CAR MARKETPLACE SYSTEM
// ============================================

// Part wear for individual components (0 = perfect, 100 = worn out)
export interface CarPartWear {
  engine: number      // Affects power output
  chassis: number     // Affects handling
  gearbox: number     // Affects shift reliability & DNF risk
  brakes: number      // Affects stopping power
  suspension: number  // Affects grip/stability
}

// Service level types for granular part servicing
export type ServiceLevel = 'light' | 'standard' | 'rebuild'

// Part service selection for granular servicing
export interface PartServiceSelection {
  part: keyof CarPartWear
  level: ServiceLevel
}

// Service level configuration
export const SERVICE_LEVEL_CONFIG: Record<ServiceLevel, { 
  label: string
  wearReduction: number  // Percentage of wear removed
  costMultiplier: number // Multiplier for base cost
  description: string 
}> = {
  light: {
    label: 'Light Service',
    wearReduction: 20,
    costMultiplier: 0.3,
    description: 'Quick inspection and minor adjustments'
  },
  standard: {
    label: 'Standard Service', 
    wearReduction: 50,
    costMultiplier: 0.6,
    description: 'Full service with component refreshing'
  },
  rebuild: {
    label: 'Full Rebuild',
    wearReduction: 100, // Resets to 0%
    costMultiplier: 1.0,
    description: 'Complete component replacement'
  }
}

// Part base costs (multiplied by tier factor)
export const PART_BASE_COSTS: Record<keyof CarPartWear, number> = {
  engine: 15000,
  chassis: 12000,
  gearbox: 8000,
  brakes: 3000,
  suspension: 5000
}

// Service record entry
export interface CarServiceRecord {
  week: number
  year: number
  type: 'full' | 'partial' | 'repair' | 'granular'
  cost: number
  partsReplaced?: (keyof CarPartWear)[]
  partServices?: PartServiceSelection[]  // For granular service tracking
  description?: string
}

// Car's racing history/provenance (for used cars)
export interface CarProvenance {
  previousOwners: number
  originalPurchaseYear?: number
  raceHistory?: {
    races: number
    wins: number
    podiums: number
    dnfs: number
  }
  notableResults?: string[]  // e.g., "Le Mans 24h - 3rd Place 2024"
  accidentHistory?: number   // Number of significant crashes
}

// Installed car upgrade
export interface CarUpgrade {
  id: string
  name: string
  type: 'performance' | 'reliability' | 'handling'
  effect: number  // +/- modifier (e.g., +5 performance)
  cost: number
  installedWeek: number
  installedYear: number
}

// Manufacturer Relationship
export interface ManufacturerRelationship {
  favor: number           // 0-100
  totalPurchases: number  // Number of cars purchased
  totalSpent: number      // Total money spent with manufacturer
  lastInteractionWeek: number
  lastInteractionYear: number
}

// ============================================
// SPARE PARTS LOGISTICS SYSTEM
// ============================================

// Re-export for convenience
export type { SparePartType, ShippingMethod }

// Individual spare part in inventory
export interface SparePart {
  id: string
  type: SparePartType
  manufacturerId: string          // Who made it (manufacturer ID or 'in-house')
  quality: number                 // 80-100%, affects reliability
  productionWeek: number          // When manufactured
  productionYear: number
  location: string                // warehouseId, 'hq', 'in-transit', or 'at-race-{raceId}'
  cost: number                    // Acquisition cost
  isInHouse: boolean              // Made by team vs purchased from manufacturer
}

// Part shipment in transit
export type PartShipmentStatus = 'in_transit' | 'delivered' | 'delayed'

export interface PartShipment {
  id: string
  parts: string[]                 // SparePart IDs
  origin: string                  // Warehouse ID or 'hq'
  originRegion: WorldRegion
  destination: string             // Warehouse ID or 'race-{raceId}'
  destinationRegion: WorldRegion
  departureWeek: number
  departureYear: number
  estimatedArrivalWeek: number
  estimatedArrivalYear: number
  actualArrivalWeek?: number
  actualArrivalYear?: number
  method: ShippingMethod
  cost: number
  status: PartShipmentStatus
  raceId?: string                 // If shipping for specific race
}

// Order from manufacturer
export type PartOrderStatus = 'processing' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled'

export interface PartOrder {
  id: string
  partType: SparePartType
  quantity: number
  manufacturerId: string
  orderWeek: number
  orderYear: number
  estimatedArrivalWeek: number
  estimatedArrivalYear: number
  destinationWarehouse: string    // Warehouse ID or 'hq'
  status: PartOrderStatus
  rushOrder: boolean              // 2x cost, 50% faster
  unitCost: number
  totalCost: number
  deliveredParts?: string[]       // SparePart IDs when delivered
}

// In-house manufacturing job
export type ManufacturingJobStatus = 'queued' | 'in_progress' | 'completed' | 'cancelled'

export interface ManufacturingJob {
  id: string
  partType: SparePartType
  quantity: number
  startWeek: number
  startYear: number
  completionWeek: number
  completionYear: number
  qualityTarget: number           // Based on facility level when started
  status: ManufacturingJobStatus
  materialCost: number
  laborCost: number
  producedParts?: string[]        // SparePart IDs when completed
}

// Regional warehouse for parts storage
export interface PartsWarehouse {
  id: string
  hubId: string                   // Reference to existing LogisticsHub
  name: string
  region: WorldRegion
  country: string
  capacity: number                // Max parts storage
  upgradeLevel: number            // 0-3, affects capacity
  currentParts: string[]          // SparePart IDs stored here
  rentalActive: boolean
  weeklyRentalCost: number
  activatedWeek?: number
  activatedYear?: number
}

// Spares kit allocated to a specific race
export type RaceSparesKitStatus = 'planning' | 'shipping' | 'at_track' | 'returned' | 'used'

export interface RaceSparesKit {
  raceId: string
  raceName: string
  trackId: string
  raceWeek: number
  raceYear: number
  trackRegion: WorldRegion
  allocatedParts: Record<SparePartType, string[]>  // Part IDs per type
  usedParts: string[]             // Parts consumed during race
  status: RaceSparesKitStatus
  minimumRequired: Record<SparePartType, number>   // Recommended spares
  shipmentId?: string             // Associated shipment if shipping
  returnShipmentId?: string       // Return shipment after race
}

// Auto-reorder thresholds
export interface AutoReorderThresholds {
  brakes: number
  suspension: number
  gearbox: number
  engine: number
  chassis: number
}

// Main spare parts state
export interface SparePartsState {
  inventory: SparePart[]
  warehouses: PartsWarehouse[]
  activeShipments: PartShipment[]
  pendingOrders: PartOrder[]
  manufacturingQueue: ManufacturingJob[]
  raceSparesKits: RaceSparesKit[]
  // HQ storage
  hqCapacity: number              // Based on manufacturing facility level
  // Settings
  autoReorderEnabled: boolean
  autoReorderThresholds: AutoReorderThresholds
  // Statistics
  totalPartsManufactured: number
  totalPartsPurchased: number
  totalPartsUsed: number
}

// Marketplace listing
export type MarketplaceListingType = 'new' | 'used' | 'auction'
export type CarCondition = 'excellent' | 'good' | 'fair' | 'project'

export interface MarketplaceListing {
  id: string
  carClassId: string
  carClassName: string
  manufacturerId: string
  manufacturerName: string
  liveryName: string
  liveryPath: string
  
  // Listing type
  listingType: MarketplaceListingType
  condition: CarCondition
  
  // Car stats
  partWear: CarPartWear
  mileage: number
  reliability: number      // Calculated from part wear
  performance: number      // Base + upgrades - wear penalties
  
  // Provenance (used/auction only)
  provenance?: CarProvenance
  serviceHistory: CarServiceRecord[]
  
  // Upgrades included
  installedUpgrades: CarUpgrade[]
  
  // Pricing
  basePrice: number         // MSRP for new, calculated for used
  currentPrice: number      // After condition/market adjustments
  priceBreakdown?: {
    base: number
    wearDiscount: number
    mileageDiscount: number
    serviceBonus: number
    provenanceBonus: number
    upgradeValue: number
    marketDemand: number
  }
  
  // Auction specific
  auctionEndWeek?: number
  auctionEndYear?: number
  currentBid?: number
  minimumBid?: number
  bidCount?: number
  playerBid?: number
  lastBidder?: 'player' | 'rival'  // Track who made the last bid
  
  // Availability
  listedWeek: number
  listedYear: number
  availableUntilWeek: number
  availableUntilYear: number
  seriesCompatible: string[]  // Which series this car can race in
}

export interface TeamCar {
  carId: string
  seriesId?: string         // Optional - car may not be assigned to a series yet
  chassisId: string
  engineId: string
  liveryName?: string       // AMS2 livery assignment
  liveryPath?: string       // Full path to livery image
  
  // Base stats
  performance: number       // Base perf rating (0-100)
  reliability: number       // Base reliability rating (0-100)
  
  // Detailed wear (replaces single 'wear' number)
  partWear: CarPartWear
  mileage: number           // km equivalent
  
  // Service & maintenance
  serviceHistory: CarServiceRecord[]
  lastServiceWeek?: number
  lastServiceYear?: number
  nextServiceDue?: number   // Mileage when service is due
  inService?: boolean
  
  // Provenance (if purchased used)
  provenance?: CarProvenance
  
  // Upgrades
  installedUpgrades: CarUpgrade[]
  upgradeQueue: TeamUpgradeTask[]
  
  // Purchase info
  purchasePrice: number
  purchaseType: MarketplaceListingType
  purchaseWeek: number
  purchaseYear: number
  
  // Legacy fields for compatibility
  wear?: number             // Deprecated - use partWear
  complianceFlags?: string[]
  
  // Driver assignment
  driverType: 'owner' | 'hired' | 'unassigned'
  hiredDriverId?: string
}

export interface TeamSeriesEntry {
  seriesId: string
  seriesName: string
  carCount: number       // constrained by series
  entryFee: number
  manufacturerId?: string
  worksCustomer: 'customer' | 'works'
  costCap?: number
  status: 'active' | 'pending' | 'inactive'
  conflictRules?: string  // hook for future
}

// Budget category types for activity classification
export type BudgetCategory = 'development' | 'marketing' | 'travel' | 'operations' | 'contingency' | 'personal'

// Track overspending by category
export interface BudgetOverspends {
  development: number    // Amount overspent in development budget
  marketing: number      // Amount overspent in marketing budget
  travel: number         // Amount overspent in travel budget
  contingency: number    // Amount overspent in contingency budget
  operations: number     // Amount overspent from general operations
}

export interface TeamBudgets {
  cash: number
  capex: number
  opex: number
  costCapApplied?: number
  // Enhanced budget tracking
  developmentBudget: number       // Allocated for R&D
  travelBudget: number            // Allocated for logistics
  marketingBudget: number         // Allocated for sponsor attraction
  contingencyBudget: number       // Emergency reserves
  operationsBudget?: number       // General operations (optional, falls back to cash)
  // Tracking
  yearToDateIncome: number
  yearToDateExpenses: number
  costCapSpending: number         // Spending counted toward cost cap
  // Overspend tracking
  budgetOverspends?: BudgetOverspends  // Track overspending by category
  // Projections
  projectedSeasonIncome: number   // Estimated income for the season
  projectedSeasonExpenses: number // Estimated expenses for the season
  runwayWeeks: number             // Auto-calculated financial runway
}

// ============================================
// TEAM TRANSACTIONS
// ============================================

export type TeamTransactionCategory =
  // Income
  | 'team_sponsor'           // Team sponsorship payments
  | 'prize_race'             // Per-race prize money
  | 'prize_championship'     // Season-end championship bonus
  | 'manufacturer_support'   // Works team support payments
  | 'series_revenue'         // TV/participation revenue
  // Expenses
  | 'entry_fee'              // Series entry costs
  | 'manufacturer_lease'     // Customer team lease payments
  | 'development'            // R&D and upgrade costs
  | 'travel'                 // Logistics costs per race
  | 'facilities'             // Base operational costs
  | 'marketing'              // Marketing campaigns and activities
  | 'sponsor_event'          // Sponsor events and activations
  | 'sponsor_bonus'          // Sponsor bonus payments (on achievements)
  | 'car_maintenance'        // Car maintenance and repairs
  | 'repairs'                // Emergency repairs
  | 'salaries'               // Staff and driver salaries
  | 'other'                  // Miscellaneous
  // Loan-related
  | 'loan_disbursement'      // Receiving loan funds
  | 'loan_payment'           // Paying back loan principal
  | 'loan_interest'          // Interest payments on loans
  | 'credit_line_draw'       // Drawing from credit line
  | 'credit_line_repay'      // Repaying credit line
  | 'credit_line_fee'        // Credit line maintenance fees
  | 'investor_milestone_penalty' // Penalty for missing investor milestones
  // Investment-related
  | 'investment_purchase'    // Buying investments (stocks, property, business)
  | 'investment_sale'        // Selling investments
  | 'investment_income'      // Passive income from investments
  | 'dividend'               // Dividend payments
  | 'rental_income'          // Real estate rental income
  | 'business_revenue'       // Side business income
  | 'business_expense'       // Side business operating costs
  | 'equity_sale'            // Selling team equity
  // Merchandise-related
  | 'merchandise_sales'      // Revenue from merchandise
  | 'merchandise_production' // Cost to produce merchandise
  | 'merchandise_store_costs' // Store operating costs

export interface TeamTransaction {
  id: string
  date: string
  week: number
  year: number
  type: 'income' | 'expense'
  category: TeamTransactionCategory
  amount: number
  description: string
  // Metadata
  seriesId?: string          // Related series
  raceWeek?: number          // If race-related
  sponsorId?: string         // If sponsor-related
  countsTowardCostCap: boolean
}

// ============================================
// TEAM SPONSORS (different from personal sponsors)
// ============================================

export type TeamSponsorSlot = 'title' | 'primary' | 'secondary' | 'associate'

export interface TeamSponsorTarget {
  id: string
  type: 'championship_position' | 'total_wins' | 'total_podiums' | 'races_entered'
  targetValue: number
  currentValue: number
  description: string
  met: boolean
  exceeded: boolean
}

export interface TeamSponsorDeal {
  id: string
  sponsorId: string
  sponsorName: string
  slot: TeamSponsorSlot
  // Payments
  monthlyPayment: number
  winBonus: number
  podiumBonus: number
  championshipBonus: number
  // Contract details
  startYear: number
  duration: number           // Years
  active: boolean
  // Satisfaction & performance
  satisfaction: number       // 0-100
  targets: TeamSponsorTarget[]
  // Season tracking
  seasonWins: number
  seasonPodiums: number
  seasonRaces: number
  // Warning state
  warningIssued: boolean
  finalWarningIssued: boolean
}

// ============================================
// TEAM FINANCIAL STATE
// ============================================

export interface TeamFinancialState {
  transactions: TeamTransaction[]
  sponsors: TeamSponsorDeal[]
  pendingSponsorOffers: TeamSponsorDeal[]
  // Active negotiations
  activeNegotiations: SponsorNegotiation[]
  // Monthly summaries for reports
  monthlySummaries: Array<{
    month: number
    year: number
    totalIncome: number
    totalExpenses: number
    incomeByCategory: Record<string, number>
    expensesByCategory: Record<string, number>
  }>
  // Extended financial features (loans, investments, merchandise)
  extended?: ExtendedFinancialState
  
  // Team valuation
  teamValue?: number
}

// ============================================
// SPONSOR NEGOTIATION SYSTEM
// ============================================

export type NegotiationStatus = 
  | 'outreach_sent'        // Team sent outreach, waiting for response
  | 'pending_response'     // Waiting for sponsor reply
  | 'reviewing_offer'      // Player reviewing sponsor's offer
  | 'counter_pending'      // Counter sent, awaiting sponsor response
  | 'accepted'             // Deal done
  | 'declined'             // Player declined
  | 'sponsor_withdrew'     // Sponsor walked away
  | 'expired'              // Negotiation timed out

export type SponsorPersonalityType = 'formal' | 'casual' | 'demanding' | 'friendly' | 'corporate'

export interface SponsorOffer {
  slot: TeamSponsorSlot
  monthlyPayment: number
  winBonus: number
  podiumBonus: number
  championshipBonus: number
  duration: number           // Years
  targets: TeamSponsorTarget[]
}

export interface NegotiationRound {
  roundNumber: number
  proposedBy: 'team' | 'sponsor'
  offer: SponsorOffer
  response?: 'accept' | 'counter' | 'decline'
  responseWeek?: number
  responseYear?: number
  emailId: string
}

export interface SponsorNegotiation {
  id: string
  sponsorId: string
  sponsorName: string
  sponsorCategory: string
  sponsorTier: string
  initiatedBy: 'team' | 'sponsor'
  status: NegotiationStatus
  
  // Sponsor personality affects responses
  personality: SponsorPersonalityType
  patience: number           // 1-5, affects max rounds
  
  // Current offer on the table
  currentOffer: SponsorOffer
  
  // Original offer (for comparison)
  initialOffer: SponsorOffer
  
  // Negotiation history
  rounds: NegotiationRound[]
  maxRounds: number          // Based on sponsor patience (3-5)
  
  // Timing
  startedWeek: number
  startedYear: number
  expiresWeek: number
  expiresYear: number
  lastActivityWeek: number
  lastActivityYear: number
  lastEmailId: string
  
  // Response timing (days until next response)
  nextResponseWeek?: number
}

// Individual facility state
export interface FacilityState {
  level: number                    // 1-5
  upgradeInProgress: boolean
  upgradeStartWeek?: number
  upgradeStartYear?: number
  upgradeCompletionWeek?: number
  upgradeCompletionYear?: number
  assignedStaff: string[]          // Staff IDs assigned to this facility
}

// All team facilities
export interface TeamFacilities {
  aero: FacilityState
  chassis: FacilityState
  engine: FacilityState
  sim: FacilityState
  manufacturing: FacilityState
  marketing: FacilityState
}

// Helper to create default facility state
export function createDefaultFacilityState(level: number = 1): FacilityState {
  return {
    level,
    upgradeInProgress: false,
    assignedStaff: []
  }
}

// Helper to create default facilities
export function createDefaultFacilities(): TeamFacilities {
  return {
    aero: createDefaultFacilityState(),
    chassis: createDefaultFacilityState(),
    engine: createDefaultFacilityState(),
    sim: createDefaultFacilityState(),
    manufacturing: createDefaultFacilityState(),
    marketing: createDefaultFacilityState()
  }
}

// Helper to create default spare parts state
export function createDefaultSparePartsState(manufacturingLevel: number = 1): SparePartsState {
  // HQ capacity scales with manufacturing facility level
  // Base 50 + 25 per level
  const hqCapacity = 50 + (manufacturingLevel * 25)
  
  return {
    inventory: [],
    warehouses: [],
    activeShipments: [],
    pendingOrders: [],
    manufacturingQueue: [],
    raceSparesKits: [],
    hqCapacity,
    autoReorderEnabled: false,
    autoReorderThresholds: {
      brakes: 3,
      suspension: 2,
      gearbox: 1,
      engine: 1,
      chassis: 0
    },
    totalPartsManufactured: 0,
    totalPartsPurchased: 0,
    totalPartsUsed: 0
  }
}

export interface BoardTarget {
  id: string
  type: 'champ_position' | 'points_min' | 'budget_cap' | 'dnf_limit' | 'dev_milestone'
  targetValue: number
  currentProgress: number
  severity: ContractTargetSeverity
  met: boolean
  exceeded: boolean
  description: string
}

// Hired staff contract (can be facility staff or team staff)
export interface HiredFacilityStaff extends Omit<FacilityStaffMember, 'role'> {
  role: FacilityStaffRole | FacilityConfigTeamStaffRole  // Can be either facility or team role
  hiredWeek: number
  hiredYear: number
  contractEndYear: number
  assignedFacility?: FacilityType
  morale: number  // 0-100
  // Team staff specific fields (optional, present if staffCategory === 'team')
  racesWorked?: number
  championshipsWon?: number
}

export interface OwnedTeam {
  id: string
  name: string
  colors?: { primary: string; secondary: string }
  logoId?: string
  baseCountry: string
  manufacturerAlignment?: string
  reputation: number
  fanSentiment: number
  boardMood: number
  locationPerk?: string
  tier: TeamTier                 // Team's competitive tier (affects costs, prizes, etc.)
  budgets: TeamBudgets
  facilities: TeamFacilities
  staff: TeamStaff[]             // Race-going staff (engineers, strategists, etc.)
  facilityStaff: HiredFacilityStaff[]  // Factory/HQ staff (aerodynamicists, etc.)
  drivers: TeamDriver[]          // Hired drivers (NOT owner - owner is always PlayerDriver)
  // Team-level finances (replacing personal driver finances)
  finances: TeamFinancialState
  // Spare parts logistics system
  spareParts?: SparePartsState
  // Team metrics
  teamMorale?: number            // Overall team morale (0-100)
  developmentSpeedModifier?: number  // Modifier for development speed (1.0 = normal, < 1.0 = slower)
}

// ============================================
// TEAM MEDIA SYSTEM
// ============================================

export type TeamPostType = 
  | 'race_result' | 'race_preview' | 'qualifying_result'
  | 'driver_spotlight' | 'driver_signing' | 'driver_birthday'
  | 'sponsor_highlight' | 'sponsor_activation'
  | 'development_update' | 'upgrade_reveal'
  | 'behind_scenes' | 'factory_tour' | 'team_photo'
  | 'throwback' | 'milestone_celebration'
  | 'fan_engagement' | 'poll' | 'qa_session'
  | 'controversial_take' | 'rivalry_post'
  | 'charity' | 'community'
  // Merchandise posts
  | 'merch_drop' | 'collection_launch' | 'store_opening' | 'limited_edition' | 'merch_restock'

export type TeamPostTone = 'professional' | 'exciting' | 'humble' | 'defiant' | 'controversial' | 'confident' | 'aggressive' | 'diplomatic'

export type MediaReachTier = 'local' | 'regional' | 'national' | 'global' | 'legendary'

export type MediaNarrativeType = 
  | 'underdog_rise' | 'championship_push' | 'rebuilding' 
  | 'crisis' | 'dominant' | 'dark_horse' | 'declining' | 'neutral'

export type ControversyType = 
  | 'driver_incident' | 'team_error' | 'financial' 
  | 'technical_illegal' | 'statement_backlash' | 'internal_conflict'

export type ControversySeverity = 'minor' | 'moderate' | 'major' | 'critical'

export type ControversyResponseType = 'apologize' | 'defend' | 'no_comment' | 'deflect' | 'counter_attack'

export type DriverMediaPersonality = 'reserved' | 'professional' | 'charismatic' | 'controversial' | 'fan_favorite'

export type JournalistSpecialty = 'technical' | 'business' | 'drama' | 'general' | 'investigative'

export type PressReleaseType = 'announcement' | 'statement' | 'apology' | 'celebration' | 'teaser' | 'crisis_response'

export type PressConferenceType = 
  | 'pre_race' | 'post_race' | 'season_launch' | 'mid_season'
  | 'driver_announcement' | 'sponsor_unveil' | 'crisis_response' | 'season_review'

export type FanEventType = 
  | 'autograph_session' | 'factory_tour' | 'fan_meetup' 
  | 'charity_event' | 'merchandise_launch' | 'virtual_qa'
  | 'meetup' | 'virtual' | 'charity' | 'exclusive' | 'merchandise'

export interface MediaEffect {
  type: 'fan_sentiment' | 'board_mood' | 'sponsor_satisfaction' | 'team_reputation' | 'media_score' | 'journalist_relation' | 'driver_morale'
    | 'fanSentiment' | 'boardMood' | 'sponsorSatisfaction' | 'teamMorale' | 'driverMorale' | 'reputation' | 'developmentBoost'
  target?: string                 // ID if targeting specific entity
  value?: number
  amount?: number                 // Alternative to value used in mediaEffects
  reason?: string
  source?: string
  description?: string
}

export interface TeamPost {
  id: string
  week: number
  year: number
  type: TeamPostType
  content: string
  tone: TeamPostTone
  engagement: { 
    likes: number
    shares: number
    comments: number
    sentiment: number           // -100 to 100
  }
  wentViral: boolean
  hadBacklash: boolean
  sponsorMention?: string         // If highlighting sponsor
  driverMention?: string          // If featuring driver
  effects: MediaEffect[]
  scheduledFor?: number           // Week if scheduled
  posted: boolean
}

export interface ScheduledPost {
  id: string
  type: TeamPostType
  content: string
  tone: TeamPostTone
  scheduledWeek: number
  sponsorMention?: string
  driverMention?: string
  autoPost: boolean               // If true, posts automatically
}

export interface ContentSlot {
  week: number
  day: number                     // 1-7
  postId?: string                 // If filled
  recommended?: TeamPostType      // Suggested post type
  sponsorRequired?: string        // If sponsor needs post this week
}

export interface TeamSocialAccount {
  followers: number
  followersHistory: { week: number; count: number }[]
  verified: boolean
  verifiedAt?: number             // Follower count when verified
  totalPosts: number
  viralPosts: number
  engagementRate: number          // Average engagement %
  scheduledPosts: ScheduledPost[]
  postHistory: TeamPost[]
  contentCalendar: ContentSlot[]
}

export interface PressRelease {
  id: string
  week: number
  year: number
  type: PressReleaseType
  headline: string
  body: string
  tone: TeamPostTone
  embargoUntil?: number           // Week to release
  released: boolean
  coverage: {
    reach: MediaReachTier
    outlets: number
    sentiment: number             // -100 to 100
  }
  effects: MediaEffect[]
}

export interface Controversy {
  id: string
  startWeek: number
  startYear: number
  type: ControversyType
  severity: ControversySeverity
  headline: string
  description: string
  decayRate: number               // How fast it fades per week
  currentIntensity: number        // 0-100
  responded: boolean
  responseType?: ControversyResponseType
  responseWeek?: number
  responseEffectiveness?: number  // 0-100
  effects: {
    fanSentiment: number
    boardMood: number
    sponsorSatisfaction: number
    reputation: number
  }
  resolved: boolean
  resolvedWeek?: number
}

export interface JournalistRelation {
  id: string
  name: string
  outlet: string
  outletTier: 'blog' | 'local' | 'national' | 'global'
  specialty: JournalistSpecialty
  relationship: number            // -100 to 100
  recentInteractions: { week: number; type: string; change: number }[]
  exclusivesGiven: number
  isHostile: boolean
  lastContact?: number            // Week
}

export interface MediaNarrative {
  current: MediaNarrativeType
  strength: number                // 0-100, how established
  startedWeek: number
  previousNarratives: { 
    narrative: MediaNarrativeType
    startWeek: number
    endWeek: number 
  }[]
  factors: string[]               // What's driving current narrative
}

export interface DriverMediaProfile {
  driverId: string
  driverName: string
  marketability: number           // 0-100
  mediaPersonality: DriverMediaPersonality
  socialFollowers: number
  mediaTrainingLevel: number      // 0-5
  controversyRisk: number         // 0-100
  interviewsCompleted: number
  interviewEarnings: number
  pendingApprovals: string[]      // Post IDs awaiting approval
  recentHeadlines: string[]       // Recent headlines about this driver
}

export interface InterviewRequest {
  id: string
  driverId: string
  driverName: string
  outlet: string
  outletTier: 'blog' | 'local' | 'national' | 'global' | 'tv' | 'podcast'
  topic: 'career' | 'team' | 'controversy' | 'personal' | 'technical' | 'rivalry'
  payment: number
  riskLevel: 'low' | 'medium' | 'high' | 'very_high'
  potentialUpside: string         // What could go well
  potentialRisk: string           // What could go wrong
  expiresWeek: number
  status: 'pending' | 'approved' | 'denied' | 'completed'
  outcome?: {
    sentiment: 'positive' | 'neutral' | 'negative' | 'disaster'
    headline?: string
    effects: MediaEffect[]
  }
}

export interface MediaObligation {
  id: string
  sponsorId: string
  sponsorName: string
  type: 'social_post' | 'media_day' | 'activation_event' | 'press_mention' | 'driver_appearance'
  description: string
  required: number
  completed: number
  deadline: number                // Week
  penalty: number                 // Satisfaction hit if missed
  bonus?: number                  // Payment if exceeded
  bonusThreshold?: number         // How many extra for bonus
}

export interface TeamHeadline {
  id: string
  week: number
  year: number
  headline: string
  outlet: string
  outletTier: 'blog' | 'local' | 'national' | 'global'
  sentiment: 'positive' | 'neutral' | 'negative'
  topic: 'results' | 'business' | 'drivers' | 'controversy' | 'development' | 'general'
  relatedTo?: string              // Entity ID if about specific thing
  saved: boolean                  // User can save notable headlines
  effects?: MediaEffect[]
}

export interface PressConference {
  id: string
  week: number
  year: number
  type: PressConferenceType
  title: string
  description: string
  questionsAsked: PressConferenceQuestion[]
  completed: boolean
  outcome?: {
    headlines: string[]
    fanSentimentChange: number
    boardMoodChange: number
    driverMoraleChanges?: Record<string, number>
  }
}

export interface PressConferenceQuestion {
  id: string
  question: string
  topic: 'strategy' | 'drivers' | 'results' | 'development' | 'business' | 'controversy' | 'future'
  askedBy: string                 // Journalist name
  options: PressConferenceResponse[]
  selectedResponse?: string       // Response ID
}

export interface PressConferenceResponse {
  id: string
  text: string
  tone: TeamPostTone
  effects: {
    fanSentiment?: number
    boardMood?: number
    sponsorSatisfaction?: number
    reputation?: number
    driverMorale?: number         // If about drivers
    journalistRelation?: number   // With asking journalist
    controversyRisk?: number      // Might spark controversy
  }
}

export interface FanEvent {
  id: string
  type: FanEventType
  name: string
  description: string
  scheduledWeek: number
  cost: number
  duration: number                // Hours
  capacity?: number               // Max attendees
  attended?: number               // Actual attendees
  completed: boolean
  effects: {
    fanSentiment: number
    boardMood?: number
    revenue?: number              // If generates income
    reputation?: number
  }
  requiresDriver: boolean
  driverAssigned?: string
}

export interface FanClubStats {
  members: number
  membersHistory: { week: number; count: number }[]
  tier: 'basic' | 'growing' | 'established' | 'massive' | 'legendary'
  weeklyGrowth: number
  exclusiveContentReleased: number
  memberSatisfaction: number      // 0-100
}

export interface MerchandiseStats {
  totalSales: number
  weeklySales: number
  popularItems: string[]
  recentBoosts: { week: number; reason: string; boost: number }[]
}

// ============================================
// LOANS SYSTEM
// ============================================

export type LoanType = 'bank' | 'private_investor' | 'credit_line'
export type LoanStatus = 'active' | 'paid_off' | 'defaulted' | 'renegotiating'

export interface BankLoan {
  id: string
  type: 'bank'
  lender: string
  principal: number
  interestRate: number           // Annual %
  remainingBalance: number
  weeklyPayment: number
  totalWeeks: number
  weeksRemaining: number
  startWeek: number
  startYear: number
  status: LoanStatus
  collateral?: string            // e.g., 'facilities', 'equipment'
}

export interface InvestorMilestone {
  id: string
  description: string
  targetWeek: number
  targetYear: number
  completed: boolean
  penalty?: number               // Payment if missed
}

export interface PrivateInvestor {
  id: string
  type: 'private_investor'
  investorName: string
  investmentAmount: number
  equityStake: number            // % of team ownership given up
  milestones: InvestorMilestone[]
  boardSeatGranted: boolean      // Affects board patience
  exitClause?: { year: number; buybackMultiple: number }
  status: 'active' | 'bought_out' | 'exited'
  investedWeek: number
  investedYear: number
  // Alias properties for backward compatibility
  name?: string                  // Alias for investorName
}

export interface CreditLine {
  id: string
  type: 'credit_line'
  lender: string
  maxCredit: number
  currentDrawn: number
  interestRate: number           // Only on drawn amount
  maintenanceFee: number         // Weekly fee for having credit available
  status: 'available' | 'frozen' | 'closed'
  approvedWeek: number
  approvedYear: number
}

export interface LoansState {
  bankLoans: BankLoan[]
  privateInvestors: PrivateInvestor[]
  creditLines: CreditLine[]
  totalDebt: number
  weeklyDebtService: number
  debtToEquityRatio: number
  creditScore: number            // 300-850, affects loan approval and rates
}

// ============================================
// INVESTMENTS SYSTEM
// ============================================

export type InvestmentType = 'index_fund' | 'real_estate' | 'side_business' | 'team_equity_sale'
export type RiskLevel = 'low' | 'medium' | 'high'

export interface IndexFundInvestment {
  id: string
  type: 'index_fund'
  name: string                   // e.g., "Motorsport Industry ETF"
  investedAmount: number
  currentValue: number
  weekPurchased: number
  yearPurchased: number
  riskLevel: RiskLevel
  weeklyVolatility: number       // % variance per week
  expectedReturn: number         // Annual %
  // Required properties
  fundName: string               // Fund name
  shares: number                 // Number of shares owned
  purchaseValue: number         // Original purchase value
}

export type PropertyType = 'warehouse' | 'office' | 'sim_center' | 'retail_space'

export interface RealEstateInvestment {
  id: string
  type: 'real_estate'
  propertyName: string
  propertyType: PropertyType
  location: string
  purchasePrice: number
  currentValue: number
  monthlyRentalIncome: number
  monthlyExpenses: number
  occupancyRate: number          // 0-100
  appreciation: number           // Annual %
  purchasedWeek: number
  purchasedYear: number
}

export type SideBusinessType = 'racing_school' | 'sim_center' | 'karting_track' | 'parts_shop' | 'driving_experience'

export interface SideBusiness {
  id: string
  type: 'side_business'
  businessName: string
  businessType: SideBusinessType
  location: string
  initialInvestment: number
  weeklyRevenue: number
  weeklyExpenses: number
  reputation: number             // 0-100, affects revenue
  staffCount: number
  upgradeLevel: number           // 0-5
  founded: { week: number; year: number }
  // Required properties
  name: string                   // Business name
  level: number                  // Business level
}

export interface TeamEquitySale {
  id: string
  investorName: string
  percentageSold: number
  salePrice: number
  soldWeek: number
  soldYear: number
  specialTerms?: string
  votingRights: boolean          // Did they get voting rights?
  // Alias properties for backward compatibility
  buyerName?: string             // Alias for investorName
}

export interface InvestmentsState {
  indexFunds: IndexFundInvestment[]
  realEstate: RealEstateInvestment[]
  sideBusinesses: SideBusiness[]
  equitySales: TeamEquitySale[]
  totalInvested: number
  weeklyPassiveIncome: number
  portfolioValue: number
  ownershipPercentage: number    // 100% minus equity sold
}

// ============================================
// EXTENDED MERCHANDISE SYSTEM
// ============================================

export type MerchCategory = 'apparel' | 'accessories' | 'collectibles' | 'memorabilia' | 'digital'
export type MerchRarity = 'standard' | 'limited' | 'exclusive' | 'ultra_rare'

export interface MerchProduct {
  id: string
  name: string
  category: MerchCategory
  description: string
  basePrice: number
  productionCost: number
  rarity: MerchRarity
  imageId?: string
  // Inventory
  stockLevel: number
  reorderPoint: number
  weeklyProduction: number
  // Sales tracking
  totalSold: number
  weeklyAverageSold: number
  lastRestockWeek: number
  // Status
  active: boolean
  launchWeek: number
  launchYear: number
  discontinuedWeek?: number
}

export type CollectionTheme = 'season' | 'victory' | 'anniversary' | 'driver' | 'collaboration' | 'holiday'

export interface MerchCollection {
  id: string
  name: string                   // e.g., "2025 Season Collection", "Victory Edition"
  description: string
  theme: CollectionTheme
  products: string[]             // Product IDs
  launchWeek: number
  launchYear: number
  endWeek?: number
  endYear?: number
  collaborationPartner?: string
  exclusiveToMembers: boolean
  marketingBudget: number
  salesMultiplier: number        // Boost from marketing
  active: boolean
}

export type StoreType = 'online' | 'physical' | 'popup' | 'event'

export interface MerchStore {
  id: string
  name: string
  type: StoreType
  location?: string
  weeklyCost: number
  weeklyFootTraffic: number
  conversionRate: number         // 0-100
  opened: { week: number; year: number }
  closed?: { week: number; year: number }
  products: string[]             // Products available at this store
  active: boolean
}

export interface MerchandiseFullState {
  products: MerchProduct[]
  collections: MerchCollection[]
  stores: MerchStore[]
  // Analytics
  totalRevenue: number
  totalCosts: number
  weeklyRevenue: number
  weeklyCosts: number
  weeklyProfit: number
  topSellingProducts: string[]
  revenueHistory: { week: number; year: number; revenue: number; profit: number }[]
  // Fan engagement bonuses
  fanClubDiscount: number        // % discount for fan club members
  memberExclusiveRevenue: number
  // Alerts
  lowStockAlerts: string[]       // Product IDs with low stock
}

// ============================================
// EXTENDED FINANCIAL STATE
// ============================================

export interface ExtendedFinancialState {
  loans: LoansState
  investments: InvestmentsState
  merchandise: MerchandiseFullState
}

// Helper function to create default extended financial state
export function createDefaultExtendedFinancialState(): ExtendedFinancialState {
  return {
    loans: {
      bankLoans: [],
      privateInvestors: [],
      creditLines: [],
      totalDebt: 0,
      weeklyDebtService: 0,
      debtToEquityRatio: 0,
      creditScore: 650
    },
    investments: {
      indexFunds: [],
      realEstate: [],
      sideBusinesses: [],
      equitySales: [],
      totalInvested: 0,
      weeklyPassiveIncome: 0,
      portfolioValue: 0,
      ownershipPercentage: 100
    },
    merchandise: {
      products: [],
      collections: [],
      stores: [{
        id: 'online-store-default',
        name: 'Team Online Store',
        type: 'online',
        weeklyCost: 500,
        weeklyFootTraffic: 1000,
        conversionRate: 3,
        opened: { week: 1, year: 2025 },
        products: [],
        active: true
      }],
      totalRevenue: 0,
      totalCosts: 0,
      weeklyRevenue: 0,
      weeklyCosts: 0,
      weeklyProfit: 0,
      topSellingProducts: [],
      revenueHistory: [],
      fanClubDiscount: 10,
      memberExclusiveRevenue: 0,
      lowStockAlerts: []
    }
  }
}

// ============================================
// MEDIA DUTY SYSTEM
// ============================================

export type MediaDutyType = 
  | 'pre_weekend_briefing'    // Thursday - set expectations
  | 'pre_practice'            // Friday morning - setup talk
  | 'post_practice'           // Friday evening - initial impressions
  | 'pre_qualifying'          // Saturday morning - qualifying approach
  | 'post_qualifying'         // Saturday evening - grid reaction
  | 'pre_race'                // Sunday morning - race strategy
  | 'post_race'               // Sunday evening - race reaction
  | 'post_weekend_debrief'    // Monday - full weekend analysis

export type MediaDutyStatus = 'upcoming' | 'available' | 'completed' | 'skipped' | 'missed'

export interface MediaDutySkipPenalty {
  fine: number
  sponsorSatisfaction: number   // Applied to all sponsors
  boardMood: number
  fanSentiment: number
  reputation: number
}

export interface MediaDutyOptionEffects {
  sponsorSatisfaction: number       // General sponsor impact
  specificSponsorId?: string        // If targeting specific sponsor
  specificSponsorBonus?: number     // Bonus for specific sponsor
  boardMood: number
  teamMorale: number                // Staff morale
  driverMorale: number              // Hired driver morale
  fanSentiment: number
  reputation: number
  developmentBoost?: number         // Rare: "team is focused" narrative
  controversyRisk: number           // 0-100, chance to spark controversy
  fineRisk: number                  // 0-100, chance of FIA/series fine
  fineAmount?: number               // Fine amount if triggered
}

export interface MediaDutyOption {
  id: string
  content: string                   // AI-generated statement
  tone: TeamPostTone
  topic: string                     // What aspect it focuses on (strategy, drivers, development, etc.)
  effects: MediaDutyOptionEffects
  // Contextual flags for AI generation
  mentionsRival?: string
  mentionsSponsor?: string
  criticizesTeam?: boolean
  criticizesDriver?: boolean
  makesPromises?: boolean           // Risky: must deliver or backlash
  promiseType?: 'result_promise' | 'upgrade_promise' | 'improvement_promise'
  promiseTarget?: string            // "win at Monza", "top 5 finish"
  promiseDeadline?: number          // Week by which promise must be fulfilled
}

export interface MediaDuty {
  id: string
  type: MediaDutyType
  week: number
  year: number
  day: number                       // Which day this occurs (4=Thu, 5=Fri, 6=Sat, 7=Sun, 1=Mon)
  trackId: string
  trackName: string
  seriesId: string
  seriesName: string
  mandatory: boolean
  status: MediaDutyStatus
  deadline: number                  // Day number by which it must be done
  // Generated content
  generatedOptions?: MediaDutyOption[]
  selectedOptionId?: string
  selectedOption?: MediaDutyOption  // The option that was selected
  // Outcome
  effectsApplied?: MediaEffect[]
  controversyTriggered?: boolean
  fineIssued?: number
  headlineGenerated?: string
  // Consequence if skipped/missed
  skipPenalty: MediaDutySkipPenalty
}

export interface MediaPromise {
  id: string
  madeWeek: number
  madeYear: number
  dutyId: string                    // Which duty created this promise
  type: 'result_promise' | 'upgrade_promise' | 'improvement_promise'
  target: string                    // "win at Monza", "top 5 finish", "reliability improvements"
  description: string               // Human-readable description
  deadline: number                  // Week by which promise must be fulfilled
  deadlineYear: number
  fulfilled: boolean
  broken: boolean
  checkedAt?: number                // Week when it was checked
  consequenceApplied: boolean
}

export interface MediaDutySchedule {
  weekendDuties: MediaDuty[]        // All duties for current/upcoming weekend
  activePromises: MediaPromise[]    // Promises that haven't been resolved
  completedDutiesThisSeason: number
  missedDutiesThisSeason: number
  finesPaidThisSeason: number
  controversiesFromMedia: number
}

// Configuration for each duty type
export interface MediaDutyConfig {
  type: MediaDutyType
  day: number                       // Day of week (1=Mon, 7=Sun)
  name: string
  description: string
  topics: string[]                  // Relevant topics for this duty
  baseFineMultiplier: number        // Multiplier for fine calculation
  isPreSession: boolean             // True if before a session
  relatedSession?: 'practice' | 'qualifying' | 'race'
}

// Main team media state
export interface TeamMediaState {
  // Core Metrics
  mediaScore: number              // 0-100 composite
  mediaReachTier: MediaReachTier
  
  // Social Media
  teamSocial: TeamSocialAccount
  
  // Fan Engagement
  fanSentiment: number            // 0-100
  fanSentimentTrend: 'rising' | 'stable' | 'falling'
  fanSentimentHistory: { week: number; value: number; reason?: string }[]
  fanClub: FanClubStats
  merchandise: MerchandiseStats
  fanEvents: FanEvent[]
  
  // Press & PR
  pressReleases: PressRelease[]
  pressConferences: PressConference[]
  activeControversies: Controversy[]
  journalistRelations: JournalistRelation[]
  currentNarrative: MediaNarrative
  
  // Headlines
  teamHeadlines: TeamHeadline[]
  
  // Driver Media
  driverMediaProfiles: DriverMediaProfile[]
  pendingInterviewRequests: InterviewRequest[]
  completedInterviews: InterviewRequest[]
  
  // Obligations
  sponsorMediaObligations: MediaObligation[]
  
  // Board
  boardPRSatisfaction: number     // 0-100
  
  // Season tracking
  seasonMediaEvents: number
  seasonViralPosts: number
  seasonControversies: number
  seasonFanEventsHeld: number
  
  // Media Duty System
  dutySchedule: MediaDutySchedule
}

// Helper to create default team media state
export function createDefaultTeamMediaState(teamName: string): TeamMediaState {
  return {
    mediaScore: 30,
    mediaReachTier: 'local',
    teamSocial: {
      followers: 1000,
      followersHistory: [],
      verified: false,
      totalPosts: 0,
      viralPosts: 0,
      engagementRate: 2.5,
      scheduledPosts: [],
      postHistory: [],
      contentCalendar: []
    },
    fanSentiment: 50,
    fanSentimentTrend: 'stable',
    fanSentimentHistory: [],
    fanClub: {
      members: 100,
      membersHistory: [],
      tier: 'basic',
      weeklyGrowth: 0,
      exclusiveContentReleased: 0,
      memberSatisfaction: 70
    },
    merchandise: {
      totalSales: 0,
      weeklySales: 0,
      popularItems: [],
      recentBoosts: []
    },
    fanEvents: [],
    pressReleases: [],
    pressConferences: [],
    activeControversies: [],
    journalistRelations: [],
    currentNarrative: {
      current: 'neutral',
      strength: 0,
      startedWeek: 1,
      previousNarratives: [],
      factors: []
    },
    teamHeadlines: [],
    driverMediaProfiles: [],
    pendingInterviewRequests: [],
    completedInterviews: [],
    sponsorMediaObligations: [],
    boardPRSatisfaction: 60,
    seasonMediaEvents: 0,
    seasonViralPosts: 0,
    seasonControversies: 0,
    seasonFanEventsHeld: 0,
    dutySchedule: {
      weekendDuties: [],
      activePromises: [],
      completedDutiesThisSeason: 0,
      missedDutiesThisSeason: 0,
      finesPaidThisSeason: 0,
      controversiesFromMedia: 0
    }
  }
}

// Calculate media score from components
export function calculateMediaScore(state: TeamMediaState): number {
  let score = 0
  
  // Social media presence (30%)
  const followerScore = Math.min(30, (state.teamSocial.followers / 100000) * 30)
  score += followerScore
  
  // Fan sentiment (25%)
  score += (state.fanSentiment / 100) * 25
  
  // Press coverage quality (20%)
  const recentPositiveHeadlines = state.teamHeadlines
    .filter(h => h.sentiment === 'positive')
    .slice(-10).length
  score += (recentPositiveHeadlines / 10) * 20
  
  // Controversy penalty (up to -15%)
  const activeControversy = state.activeControversies
    .reduce((sum, c) => sum + c.currentIntensity, 0)
  score -= Math.min(15, activeControversy / 10)
  
  // Board satisfaction bonus (10%)
  score += (state.boardPRSatisfaction / 100) * 10
  
  // Apply media coverage perk modifier (owner background can boost media coverage)
  const baseScore = Math.max(0, Math.min(100, Math.round(score)))
  return applyMediaCoveragePerk(baseScore)
}

// Determine media reach tier based on score and followers
export function determineMediaReachTier(score: number, followers: number): MediaReachTier {
  if (score >= 90 && followers >= 500000) return 'legendary'
  if (score >= 70 && followers >= 100000) return 'global'
  if (score >= 50 && followers >= 25000) return 'national'
  if (score >= 30 && followers >= 5000) return 'regional'
  return 'local'
}

// ============================================
// EMAIL SYSTEM
// ============================================

export type EmailCategory = 
  | 'sponsor'      // Sponsor communications
  | 'board'        // Board/ownership messages
  | 'contract'     // Contract offers
  | 'invitation'   // Race invitations
  | 'media'        // Media/PR requests
  | 'team'         // Internal team updates
  | 'system'       // System notifications

export interface Email {
  id: string
  category: EmailCategory
  subject: string
  sender: string
  senderRole?: string        // e.g., "CEO, Acme Sponsors"
  preview: string            // First ~100 chars
  body: string               // Full message
  receivedDay: number
  receivedWeek: number
  receivedYear: number
  read: boolean
  starred: boolean
  archived: boolean
  // Action-related
  actionType?: 
    | 'accept_decline' 
    | 'respond' 
    | 'acknowledge' 
    | 'navigate'
    | 'negotiate_sponsor'    // Opens negotiation modal
    | 'review_counter'       // Review counter offer from sponsor
    | 'activity_reminder'    // Reminder for upcoming activity
    | 'activity_today'       // Activity is scheduled for today
    | 'mandatory_activity'   // Mandatory activity notification
    | 'budget_warning'       // Budget overspend warning
    | 'opportunity_media'         // Media appearance opportunity
    | 'opportunity_manufacturer'  // Manufacturer program opportunity
    | 'opportunity_special'       // Special event opportunity
    | 'opportunity_media'    // Media appearance opportunity
    | 'opportunity_manufacturer'  // Manufacturer program opportunity
    | 'opportunity_special'  // Special event opportunity
  actionData?: Record<string, unknown> & {
    negotiationId?: string   // ID of active negotiation
    sponsorId?: string       // Sponsor being negotiated with
    offerTerms?: SponsorOffer // Current offer terms
  }
  expiresWeek?: number       // For time-sensitive items
  expiresYear?: number       // Year for expiry
}

// Day name helpers
export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
export type DayName = typeof DAY_NAMES[number]

export function getDayName(dayNumber: number): DayName {
  return DAY_NAMES[(dayNumber - 1) % 7]
}

// ============================================
// SCHEDULED ACTIVITY SYSTEM
// ============================================

export type ActivityCategory = 
  | 'sponsor'       // Sponsor events and meetings
  | 'team'          // Team building, meetings
  | 'development'   // R&D sessions, testing
  | 'media'         // Press events, interviews
  | 'personal'      // Training, rest, personal time
  | 'race'          // Race weekends (auto-generated)
  | 'maintenance'   // Car maintenance, service
  | 'lifestyle'     // Hobbies, pets, education, fitness

export type ActivityStatus = 'scheduled' | 'completed' | 'missed' | 'cancelled'

// ============================================
// TIME BUDGET SYSTEM TYPES
// ============================================

/** How draining an activity is - affects fatigue carry-over */
export type DrainLevel = 'restorative' | 'low' | 'normal' | 'high' | 'exhausting'

/** How a calendar entry is categorized for display and time budget */
export type CalendarEntryType = 'personal' | 'team' | 'mandatory' | 'travel'

/** A single logged activity in the day's time budget */
export interface DayLogEntry {
  activityId: string
  name: string
  hoursSpent: number
  drainLevel: DrainLevel
  effectiveHours: number      // After drain multiplier (for fatigue calc)
  timestamp: number           // Order completed (incrementing counter)
}

/** The daily time budget state - tracks hours remaining, fatigue, and what was done today */
export interface DayBudgetState {
  totalHours: number                    // Base pool for this day (default 16, minus penalties + bonuses)
  hoursUsed: number                     // Hours consumed today
  hoursRemaining: number                // totalHours - hoursUsed
  fatigueDebt: number                   // Accumulated carry-over penalty from previous days
  jetLagPenalty: number                 // Hours lost from recent travel
  activitiesCompletedToday: string[]    // IDs of completed activities
  dayLog: DayLogEntry[]                 // What was done today (for summary screen)
}

/** Creates a fresh day budget state */
export function createDefaultDayBudgetState(fatigueDebt: number = 0, jetLagPenalty: number = 0): DayBudgetState {
  const BASE_HOURS = 16
  const MIN_DAILY_HOURS = 10
  const totalHours = Math.max(MIN_DAILY_HOURS, BASE_HOURS - fatigueDebt - jetLagPenalty)
  return {
    totalHours,
    hoursUsed: 0,
    hoursRemaining: totalHours,
    fatigueDebt,
    jetLagPenalty,
    activitiesCompletedToday: [],
    dayLog: []
  }
}

export interface ActivityEffect {
  // Positive effects
  boardMood?: number           // +/- board mood
  sponsorSatisfaction?: number // +/- for specific sponsor or all
  sponsorId?: string           // If specific sponsor
  teamMorale?: number          // +/- staff morale
  driverFatigue?: number       // +/- fatigue (negative = rest)
  driverMorale?: number        // +/- player morale
  reputation?: number          // +/- reputation
  cash?: number                // +/- money
  developmentPoints?: number   // +/- R&D points
  fanSentiment?: number        // +/- fan sentiment
  // Mental state effects (from event gameplay and career events)
  confidence?: number          // +/- confidence
  stress?: number              // +/- stress
  fitness?: number             // +/- driver fitness
  marketability?: number       // +/- marketability
  mentalStrength?: number      // +/- mental strength
  // Special effects
  unlocksSponsorBonus?: boolean
  reducesMaintenanceCost?: boolean
  preventsBreakdown?: boolean
}

// ============================================
// ACTIVITY CONFIGURATION SYSTEM
// Full configuration for customizable activities
// ============================================

// Guest management for activities
export interface SponsorRepInvite {
  sponsorId: string
  sponsorName: string
  count: number
  vipTreatment: boolean  // +cost, +satisfaction
}

export interface MediaInvite {
  type: 'local_press' | 'national_media' | 'international' | 'influencers'
  count: number
  exclusiveAccess: boolean  // Higher cost, better coverage
}

export interface FanAttendees {
  count: number
  ticketPrice: number      // Can charge admission or make free (0)
  merchandiseAvailable: boolean
}

export interface VIPGuest {
  type: 'board_members' | 'potential_sponsors' | 'celebrities' | 'officials' | 'drivers'
  count: number
}

export interface ActivityGuests {
  sponsorReps: SponsorRepInvite[]
  mediaInvites: MediaInvite[]
  fanAttendees?: FanAttendees
  vipGuests: VIPGuest[]
  totalCount: number  // Calculated total
}

// Media coverage options for activities
export interface MediaCoverageConfig {
  pressRelease: boolean           // $500, basic coverage
  photographerHired: boolean      // $1000, social media content
  videoTeamHired: boolean         // $3000, promo video
  livestream: boolean             // $2000, fan engagement
  exclusiveInterviews: boolean    // Free, but time cost
  socialMediaCoverage: boolean    // Internal team posting
}

// Full activity configuration
export interface ActivityConfiguration {
  // Venue
  venueId: string
  venueName?: string  // Cached for display
  
  // Guests
  guests: ActivityGuests
  
  // Catering
  cateringId: string
  cateringName?: string  // Cached for display
  
  // Media
  mediaCoverage: MediaCoverageConfig
  
  // Budget
  allocatedBudget: number
  estimatedCost: number
  
  // Additional
  notes?: string
  customName?: string  // Override activity name
}

// Cost breakdown for activity configuration
export interface ActivityCostBreakdown {
  venueCost: number
  cateringCost: number
  mediaCost: number
  guestCosts: {
    vipTreatment: number
    mediaExclusivity: number
    fanEvent: number
  }
  staffCosts: number
  miscCosts: number
  subtotal: number
  
  // Modifiers
  reputationDiscount: number
  sponsorSubsidy: number
  locationBonus: number
  
  total: number
}

// Trigger source for auto-generated activities
export type ActivityTriggerSource = 
  | 'race_win'
  | 'race_podium'
  | 'championship_lead'
  | 'race_dnf'
  | 'season_end'
  | 'sponsor_obligation'
  | 'sponsor_warning'
  | 'sponsor_anniversary'
  | 'board_warning'
  | 'staff_morale_low'
  | 'new_staff'
  | 'facility_upgrade'
  | 'pre_season'
  | 'mid_season'
  | 'random_opportunity'
  | 'media_request'
  | 'charity_invitation'
  | 'crisis_management'
  | 'manual'  // User scheduled
  | 'mandatory'
  | 'travel'

// Miss consequences for mandatory activities
export interface ActivityMissConsequences {
  boardMoodPenalty?: number
  sponsorPenalties?: { sponsorId: string; amount: number }[]
  reputationPenalty?: number
  contractViolation?: boolean  // Violates sponsor/contract term
  fineAmount?: number
}

export interface ScheduledActivity {
  id: string
  templateId: string           // Reference to activity template
  name: string
  description: string
  category: ActivityCategory
  budgetCategory?: BudgetCategory  // Which budget this activity draws from
  
  // Scheduling
  scheduledWeek: number
  scheduledDay: number         // 1-7 (start day)
  duration: number             // Hours per day (affects fatigue)
  spanDays: number             // How many days the activity spans (default 1)
  
  // Rescheduling
  rescheduleCost?: number      // Cost to reschedule this activity
  timesRescheduled?: number    // How many times it's been moved
  
  // Status
  status: ActivityStatus
  completedWeek?: number
  completedDay?: number
  
  // Effects
  effectsOnComplete: ActivityEffect
  effectsOnMiss: ActivityEffect
  
  // Requirements
  requiredCash?: number        // Cost to attend
  requiredStaffRole?: TeamStaffRole  // Needs this staff member
  requiresDriver?: boolean     // Player must attend
  
  // Linked entities
  sponsorId?: string           // Linked sponsor
  staffId?: string             // Linked staff member
  opportunityId?: string       // Linked team opportunity
  
  // Priority and importance
  mandatory?: boolean          // Cannot be cancelled
  canReschedule?: boolean      // Can be moved
  rescheduleDeadline?: number  // Week by which it must happen
  
  // === NEW: Full Configuration Support ===
  configuration?: ActivityConfiguration  // Full config if customized
  totalCost?: number                     // Calculated from configuration
  costBreakdown?: ActivityCostBreakdown  // Detailed cost breakdown
  
  // Expected vs actual outcomes (for configured activities)
  expectedOutcome?: ActivityEffect       // Predicted based on config
  actualOutcome?: ActivityEffect         // After completion
  
  // Trigger system for auto-generated activities
  triggeredBy?: ActivityTriggerSource    // What caused this activity
  triggerData?: {                        // Additional trigger context
    raceRound?: number
    sponsorId?: string
    staffId?: string
    relatedEventId?: string
  }
  autoScheduled?: boolean                // System placed it
  suggestedWeek?: number                 // Recommended timing (if flexible)
  
  // Consequences for mandatory activities
  missConsequences?: ActivityMissConsequences
  
  // Mandatory activity specific fields
  requiresOwner?: boolean        // Owner must attend (can't delegate)
  deadline?: {                   // When activity must be completed by
    week: number
    day: number
  }
  urgencyLevel?: 'low' | 'medium' | 'high' | 'critical'
  
  // Time Budget System fields
  drainLevel?: DrainLevel                // How tiring this activity is (affects fatigue carry-over)
  calendarEntryType?: CalendarEntryType  // How this displays on the calendar (personal/team/mandatory/travel)
}

// Activity templates - predefined activities that can be scheduled
export interface ActivityTemplate {
  id: string
  name: string
  description: string
  category: ActivityCategory
  budgetCategory?: BudgetCategory  // Which budget this activity draws from
  duration: number             // Default hours per day
  spanDays?: number            // How many days activity spans (default 1)
  baseCost: number             // Base cost to run
  rescheduleCostPercent?: number  // % of base cost to reschedule (default 25%)
  
  // Default effects
  defaultEffectsOnComplete: ActivityEffect
  defaultEffectsOnMiss: ActivityEffect
  
  // Requirements
  minReputation?: number
  requiresStaffRole?: TeamStaffRole
  requiresDriver?: boolean
  
  // Scheduling constraints
  canScheduleOnRaceWeek?: boolean
  maxPerSeason?: number
  cooldownWeeks?: number       // Min weeks between same activity
  
  // Availability
  requiresSponsor?: boolean    // Only available if have sponsors
  requiresStaff?: boolean      // Only if have staff hired
  
  // === NEW: Configuration Options ===
  // Venue requirements
  supportedVenueTypes?: string[]  // Which venue types work for this activity
  minVenueCapacity?: number       // Minimum venue capacity needed
  maxVenueCapacity?: number       // Maximum useful capacity
  preferredVenueType?: string     // Best venue type for this activity
  
  // Guest configuration
  allowsSponsorGuests?: boolean   // Can invite sponsor reps
  allowsMediaGuests?: boolean     // Can invite media
  allowsFanAttendees?: boolean    // Can have fans attend
  allowsVIPGuests?: boolean       // Can invite VIPs
  minGuests?: number              // Minimum guests needed
  maxGuests?: number              // Maximum guests allowed
  
  // Catering requirements
  requiresCatering?: boolean      // Must have catering
  minCateringTier?: 'basic' | 'business' | 'premium' | 'luxury' | 'gala'
  
  // Media options
  allowsMediaCoverage?: boolean   // Can configure media
  requiresMediaCoverage?: boolean // Must have some media
  
  // Facility requirements (for development activities)
  requiresFacilityLevel?: {
    type: 'aero' | 'chassis' | 'engine' | 'sim' | 'manufacturing' | 'marketing'
    minLevel: number
  }
  
  // Configuration flexibility
  isConfigurable?: boolean        // Can be fully configured (vs simple schedule)
  canCustomizeName?: boolean      // Can rename the activity
}

// Pre-defined activity templates
export const ACTIVITY_TEMPLATES: ActivityTemplate[] = [
  // === SPONSOR ACTIVITIES ===
  {
    id: 'sponsor_event_small',
    name: 'Sponsor Meet & Greet',
    description: 'Attend a sponsor networking event. Good for relationship building.',
    category: 'sponsor',
    budgetCategory: 'marketing',
    duration: 4,
    baseCost: 0,
    defaultEffectsOnComplete: {
      sponsorSatisfaction: 5,
      driverFatigue: 10,
      reputation: 1
    },
    defaultEffectsOnMiss: {
      sponsorSatisfaction: -10,
      boardMood: -3
    },
    requiresDriver: true,
    canScheduleOnRaceWeek: false,
    requiresSponsor: true,
    // Configuration options
    supportedVenueTypes: ['team_hq', 'hotel_conference', 'restaurant'],
    preferredVenueType: 'hotel_conference',
    minGuests: 5,
    maxGuests: 30,
    allowsSponsorGuests: true,
    allowsMediaGuests: false,
    allowsFanAttendees: false,
    requiresCatering: true,
    minCateringTier: 'business',
    isConfigurable: true
  },
  {
    id: 'sponsor_event_major',
    name: 'Major Sponsor Gala',
    description: 'High-profile 2-day sponsor event. Excellent for satisfaction but demanding.',
    category: 'sponsor',
    budgetCategory: 'marketing',
    duration: 6,           // 6 hours per day
    spanDays: 2,           // 2-day event
    baseCost: 2000,
    rescheduleCostPercent: 40,  // Significant planning involved
    defaultEffectsOnComplete: {
      sponsorSatisfaction: 15,
      driverFatigue: 25,
      reputation: 3,
      unlocksSponsorBonus: true
    },
    defaultEffectsOnMiss: {
      sponsorSatisfaction: -25,
      boardMood: -10,
      reputation: -2
    },
    requiresDriver: true,
    canScheduleOnRaceWeek: false,
    maxPerSeason: 4,
    requiresSponsor: true,
    // Configuration options - FULLY CONFIGURABLE
    supportedVenueTypes: ['hotel_conference', 'track_facility', 'stadium', 'exhibition_center'],
    preferredVenueType: 'hotel_conference',
    minVenueCapacity: 50,
    maxVenueCapacity: 500,
    minGuests: 30,
    maxGuests: 300,
    allowsSponsorGuests: true,
    allowsMediaGuests: true,
    allowsFanAttendees: true,
    allowsVIPGuests: true,
    requiresCatering: true,
    minCateringTier: 'premium',
    allowsMediaCoverage: true,
    requiresMediaCoverage: true,
    isConfigurable: true,
    canCustomizeName: true
  },
  {
    id: 'sponsor_product_launch',
    name: 'Product Launch Appearance',
    description: 'Represent your team at a sponsor product launch. Paid appearance.',
    category: 'sponsor',
    budgetCategory: 'marketing',
    duration: 6,
    baseCost: -5000, // Negative = they pay you
    defaultEffectsOnComplete: {
      sponsorSatisfaction: 10,
      driverFatigue: 15,
      cash: 5000,
      reputation: 2
    },
    defaultEffectsOnMiss: {
      sponsorSatisfaction: -20,
      cash: -5000 // Penalty
    },
    requiresDriver: true,
    canScheduleOnRaceWeek: false,
    cooldownWeeks: 4,
    requiresSponsor: true,
    // Not configurable - sponsor handles all event logistics (venue, catering, media)
    // Player is a paid guest/attendee, not the host
    isConfigurable: false
  },
  
  // === TEAM ACTIVITIES ===
  {
    id: 'team_meeting',
    name: 'Team Strategy Meeting',
    description: 'Review performance and plan upcoming races with your team.',
    category: 'team',
    budgetCategory: 'operations',
    duration: 3,
    baseCost: 0,
    defaultEffectsOnComplete: {
      teamMorale: 5,
      boardMood: 2
    },
    defaultEffectsOnMiss: {
      teamMorale: -5,
      boardMood: -2
    },
    requiresDriver: true,
    canScheduleOnRaceWeek: true,
    requiresStaff: true,
    // Configuration
    supportedVenueTypes: ['team_hq', 'hotel_conference', 'virtual'],
    preferredVenueType: 'team_hq',
    minGuests: 3,
    maxGuests: 20,
    allowsSponsorGuests: false,
    allowsMediaGuests: false,
    requiresCatering: false,
    isConfigurable: false  // Simple activity
  },
  {
    id: 'team_building',
    name: 'Team Building Day',
    description: 'Offsite team bonding activity. Great for morale.',
    category: 'team',
    budgetCategory: 'operations',
    duration: 8,
    baseCost: 3000,
    defaultEffectsOnComplete: {
      teamMorale: 15,
      driverMorale: 10,
      boardMood: 3
    },
    defaultEffectsOnMiss: {
      teamMorale: -10
    },
    requiresDriver: true,
    canScheduleOnRaceWeek: false,
    maxPerSeason: 6,
    cooldownWeeks: 6,
    requiresStaff: true,
    // Configuration - FULLY CONFIGURABLE
    supportedVenueTypes: ['hotel_conference', 'track_facility', 'restaurant'],
    preferredVenueType: 'hotel_conference',
    minVenueCapacity: 10,
    maxVenueCapacity: 100,
    minGuests: 10,
    maxGuests: 50,
    allowsSponsorGuests: false,
    allowsMediaGuests: false,
    allowsFanAttendees: false,
    allowsVIPGuests: false,
    requiresCatering: true,
    minCateringTier: 'business',
    isConfigurable: true,
    canCustomizeName: true
  },
  {
    id: 'staff_review',
    name: 'Staff Performance Review',
    description: 'Conduct performance reviews with key staff members.',
    category: 'team',
    budgetCategory: 'operations',
    duration: 4,
    baseCost: 0,
    defaultEffectsOnComplete: {
      teamMorale: 3,
      boardMood: 5
    },
    defaultEffectsOnMiss: {
      teamMorale: -8,
      boardMood: -5
    },
    requiresDriver: false, // Manager can do it
    canScheduleOnRaceWeek: false,
    maxPerSeason: 4,
    requiresStaff: true,
    // Configuration
    supportedVenueTypes: ['team_hq'],
    isConfigurable: false  // Internal activity
  },
  
  // === DEVELOPMENT ACTIVITIES ===
  {
    id: 'test_session',
    name: 'Private Test Session',
    description: 'Dedicated 2-day testing at a track. Helps development and driver familiarity.',
    category: 'development',
    budgetCategory: 'development',
    duration: 8,           // 8 hours per day
    spanDays: 2,           // 2-day event
    baseCost: 15000,
    rescheduleCostPercent: 50,  // Track bookings are expensive to reschedule
    defaultEffectsOnComplete: {
      developmentPoints: 10,
      driverFatigue: 30,
      driverMorale: 5
    },
    defaultEffectsOnMiss: {
      developmentPoints: -5,
      cash: -5000 // Cancellation fee
    },
    requiresDriver: true,
    canScheduleOnRaceWeek: false,
    maxPerSeason: 8,
    cooldownWeeks: 3,
    // Configuration - track-based, configurable
    supportedVenueTypes: ['track_facility'],
    preferredVenueType: 'track_facility',
    minVenueCapacity: 10,
    allowsSponsorGuests: true,
    allowsMediaGuests: true,  // Can invite media to watch
    allowsFanAttendees: false,
    requiresCatering: false,
    allowsMediaCoverage: true,
    isConfigurable: true,
    canCustomizeName: false
  },
  {
    id: 'simulator_session',
    name: 'Simulator Development',
    description: 'Sim session to develop setups and driver skills. Lower cost than track time.',
    category: 'development',
    budgetCategory: 'development',
    duration: 4,
    baseCost: 2000,
    defaultEffectsOnComplete: {
      developmentPoints: 3,
      driverFatigue: 10
    },
    defaultEffectsOnMiss: {},
    requiresDriver: true,
    canScheduleOnRaceWeek: true,
    cooldownWeeks: 1,
    // Configuration - HQ-based
    supportedVenueTypes: ['team_hq'],
    preferredVenueType: 'team_hq',
    requiresFacilityLevel: { type: 'sim', minLevel: 1 },  // Basic simulator
    isConfigurable: false  // Simple internal activity
  },
  {
    id: 'engineering_review',
    name: 'Engineering Deep Dive',
    description: 'Technical review session with engineers to optimize car performance.',
    category: 'development',
    budgetCategory: 'development',
    duration: 6,
    baseCost: 1000,
    defaultEffectsOnComplete: {
      developmentPoints: 5,
      teamMorale: 3
    },
    defaultEffectsOnMiss: {
      teamMorale: -3
    },
    requiresDriver: false,
    requiresStaffRole: 'chief_engineer',
    canScheduleOnRaceWeek: false,
    cooldownWeeks: 2,
    requiresStaff: true,
    // Configuration - HQ-based
    supportedVenueTypes: ['team_hq'],
    preferredVenueType: 'team_hq',
    isConfigurable: false  // Internal technical activity
  },
  
  // === MEDIA ACTIVITIES ===
  {
    id: 'press_day',
    name: 'Media Day',
    description: 'Full day of press interviews and photoshoots. Great for exposure.',
    category: 'media',
    budgetCategory: 'marketing',
    duration: 8,
    baseCost: 1000,
    defaultEffectsOnComplete: {
      reputation: 5,
      fanSentiment: 8,
      driverFatigue: 20,
      sponsorSatisfaction: 5
    },
    defaultEffectsOnMiss: {
      reputation: -3,
      fanSentiment: -5
    },
    requiresDriver: true,
    canScheduleOnRaceWeek: false,
    maxPerSeason: 6,
    // Configuration - FULLY CONFIGURABLE
    supportedVenueTypes: ['team_hq', 'hotel_conference', 'track_facility', 'exhibition_center'],
    preferredVenueType: 'team_hq',
    minVenueCapacity: 20,
    maxVenueCapacity: 200,
    minGuests: 10,
    maxGuests: 100,
    allowsSponsorGuests: true,
    allowsMediaGuests: true,
    allowsFanAttendees: false,
    allowsVIPGuests: true,
    requiresCatering: true,
    minCateringTier: 'business',
    allowsMediaCoverage: true,
    requiresMediaCoverage: true,
    isConfigurable: true,
    canCustomizeName: true
  },
  {
    id: 'podcast_appearance',
    name: 'Podcast Interview',
    description: 'Appear on a motorsport podcast. Good reach with minimal effort.',
    category: 'media',
    budgetCategory: 'marketing',
    duration: 2,
    baseCost: 0,
    defaultEffectsOnComplete: {
      reputation: 2,
      fanSentiment: 5,
      driverFatigue: 5
    },
    defaultEffectsOnMiss: {
      reputation: -1
    },
    requiresDriver: true,
    canScheduleOnRaceWeek: true,
    cooldownWeeks: 2,
    // Configuration - simple, virtual-friendly
    supportedVenueTypes: ['team_hq', 'virtual'],
    preferredVenueType: 'virtual',
    allowsMediaGuests: false,
    isConfigurable: false  // Simple activity
  },
  {
    id: 'fan_event',
    name: 'Fan Meet & Autograph Session',
    description: 'Meet fans, sign autographs, take photos. Builds grassroots support.',
    category: 'media',
    budgetCategory: 'marketing',
    duration: 4,
    baseCost: 500,
    defaultEffectsOnComplete: {
      fanSentiment: 12,
      reputation: 2,
      driverFatigue: 15,
      driverMorale: 5
    },
    defaultEffectsOnMiss: {
      fanSentiment: -8
    },
    requiresDriver: true,
    canScheduleOnRaceWeek: true,
    cooldownWeeks: 3,
    // Configuration - FULLY CONFIGURABLE
    supportedVenueTypes: ['hotel_conference', 'track_facility', 'stadium', 'exhibition_center'],
    preferredVenueType: 'track_facility',
    minVenueCapacity: 50,
    maxVenueCapacity: 2000,
    minGuests: 20,
    maxGuests: 1000,
    allowsSponsorGuests: true,
    allowsMediaGuests: true,
    allowsFanAttendees: true,
    allowsVIPGuests: false,
    requiresCatering: false,  // Optional for fan events
    allowsMediaCoverage: true,
    isConfigurable: true,
    canCustomizeName: true
  },
  
  // === PERSONAL ACTIVITIES ===
  {
    id: 'rest_day',
    name: 'Rest & Recovery',
    description: 'Take a day off to recover. Essential for maintaining peak performance.',
    category: 'personal',
    budgetCategory: 'personal',
    duration: 8,
    baseCost: 0,
    defaultEffectsOnComplete: {
      driverFatigue: -25,
      driverMorale: 10
    },
    defaultEffectsOnMiss: {},
    requiresDriver: true,
    canScheduleOnRaceWeek: false
  },
  {
    id: 'training_session',
    name: 'Physical Training',
    description: 'Intensive fitness training to improve stamina and focus.',
    category: 'personal',
    budgetCategory: 'personal',
    duration: 4,
    baseCost: 500,
    defaultEffectsOnComplete: {
      driverFatigue: 15, // Tiring but beneficial
      driverMorale: 5
    },
    defaultEffectsOnMiss: {},
    requiresDriver: true,
    canScheduleOnRaceWeek: true,
    cooldownWeeks: 1
  },
  {
    id: 'mental_coaching',
    name: 'Mental Performance Coaching',
    description: 'Work with a sports psychologist on race-day mental preparation.',
    category: 'personal',
    budgetCategory: 'personal',
    duration: 3,
    baseCost: 2000,
    defaultEffectsOnComplete: {
      driverMorale: 15,
      driverFatigue: -5
    },
    defaultEffectsOnMiss: {},
    requiresDriver: true,
    canScheduleOnRaceWeek: true,
    cooldownWeeks: 2,
    minReputation: 30
  },
  
  // === MAINTENANCE ACTIVITIES ===
  {
    id: 'car_service',
    name: 'Full Car Service',
    description: 'Comprehensive service and inspection of race car.',
    category: 'maintenance',
    budgetCategory: 'contingency',
    duration: 8,
    baseCost: 8000,
    defaultEffectsOnComplete: {
      preventsBreakdown: true,
      reducesMaintenanceCost: true
    },
    defaultEffectsOnMiss: {
      boardMood: -5
    },
    requiresDriver: false,
    canScheduleOnRaceWeek: false,
    cooldownWeeks: 4
  },
  {
    id: 'quick_inspection',
    name: 'Quick Inspection',
    description: 'Basic check and minor adjustments. Quick but limited.',
    category: 'maintenance',
    budgetCategory: 'contingency',
    duration: 2,
    baseCost: 1500,
    defaultEffectsOnComplete: {},
    defaultEffectsOnMiss: {},
    requiresDriver: false,
    canScheduleOnRaceWeek: true
  },
  
  // === TEAM/OWNER-FOCUSED ACTIVITIES ===
  {
    id: 'investor_meeting',
    name: 'Investor Meeting',
    description: 'Present your team vision to potential investors. Could secure additional funding.',
    category: 'sponsor',
    budgetCategory: 'marketing',
    duration: 4,
    baseCost: 2000,
    defaultEffectsOnComplete: {
      cash: 25000,
      boardMood: 5,
      reputation: 2
    },
    defaultEffectsOnMiss: {
      boardMood: -5,
      reputation: -1
    },
    requiresDriver: false,
    canScheduleOnRaceWeek: false,
    maxPerSeason: 4,
    cooldownWeeks: 6,
    minReputation: 40,
    // Configuration
    supportedVenueTypes: ['team_hq', 'hotel_conference', 'restaurant'],
    preferredVenueType: 'hotel_conference',
    minGuests: 2,
    maxGuests: 15,
    allowsSponsorGuests: false,
    allowsMediaGuests: false,
    allowsVIPGuests: true,
    requiresCatering: true,
    minCateringTier: 'premium',
    isConfigurable: true
  },
  {
    id: 'sponsor_acquisition_pitch',
    name: 'Sponsor Acquisition Pitch',
    description: 'Present your team to prospective sponsors. Success depends on reputation and results.',
    category: 'sponsor',
    budgetCategory: 'marketing',
    duration: 3,
    baseCost: 1500,
    defaultEffectsOnComplete: {
      reputation: 3,
      boardMood: 3
    },
    defaultEffectsOnMiss: {
      reputation: -2,
      boardMood: -3
    },
    requiresDriver: false,
    canScheduleOnRaceWeek: false,
    cooldownWeeks: 4,
    // Configuration
    supportedVenueTypes: ['team_hq', 'hotel_conference'],
    preferredVenueType: 'team_hq',
    minGuests: 3,
    maxGuests: 20,
    allowsSponsorGuests: false,
    allowsMediaGuests: false,
    allowsVIPGuests: true,
    requiresCatering: true,
    minCateringTier: 'business',
    isConfigurable: true
  },
  {
    id: 'facility_planning',
    name: 'Facility Upgrade Planning',
    description: 'Strategic planning session for HQ improvements and expansion.',
    category: 'development',
    budgetCategory: 'development',
    duration: 6,
    baseCost: 500,
    defaultEffectsOnComplete: {
      developmentPoints: 5,
      boardMood: 3,
      teamMorale: 2
    },
    defaultEffectsOnMiss: {
      boardMood: -2
    },
    requiresDriver: false,
    canScheduleOnRaceWeek: false,
    maxPerSeason: 4,
    cooldownWeeks: 8,
    requiresStaff: true,
    // Configuration - HQ only
    supportedVenueTypes: ['team_hq'],
    preferredVenueType: 'team_hq',
    isConfigurable: false
  },
  {
    id: 'staff_recruitment_day',
    name: 'Staff Recruitment Day',
    description: 'Interview and recruit new team members. Essential for team growth.',
    category: 'team',
    budgetCategory: 'operations',
    duration: 8,
    baseCost: 3000,
    defaultEffectsOnComplete: {
      teamMorale: 5,
      boardMood: 3
    },
    defaultEffectsOnMiss: {
      teamMorale: -5
    },
    requiresDriver: false,
    canScheduleOnRaceWeek: false,
    maxPerSeason: 6,
    cooldownWeeks: 4,
    // Configuration
    supportedVenueTypes: ['team_hq', 'hotel_conference'],
    preferredVenueType: 'team_hq',
    allowsSponsorGuests: false,
    allowsMediaGuests: false,
    requiresCatering: true,
    minCateringTier: 'basic',
    isConfigurable: true
  },
  {
    id: 'marketing_campaign',
    name: 'Marketing Campaign Launch',
    description: 'Launch a promotional campaign to boost team visibility and fan engagement.',
    category: 'media',
    budgetCategory: 'marketing',
    duration: 4,
    baseCost: 8000,
    defaultEffectsOnComplete: {
      fanSentiment: 15,
      reputation: 4,
      sponsorSatisfaction: 5
    },
    defaultEffectsOnMiss: {
      fanSentiment: -5,
      reputation: -2
    },
    requiresDriver: false,
    canScheduleOnRaceWeek: true,
    maxPerSeason: 4,
    cooldownWeeks: 6,
    minReputation: 30,
    // Configuration
    supportedVenueTypes: ['team_hq', 'hotel_conference', 'exhibition_center'],
    preferredVenueType: 'team_hq',
    allowsSponsorGuests: true,
    allowsMediaGuests: true,
    allowsFanAttendees: false,
    allowsMediaCoverage: true,
    requiresMediaCoverage: true,
    isConfigurable: true,
    canCustomizeName: true
  },
  {
    id: 'factory_tour',
    name: 'Factory Tour',
    description: 'Host sponsors and VIPs for an exclusive tour of team facilities.',
    category: 'sponsor',
    budgetCategory: 'marketing',
    duration: 4,
    baseCost: 1000,
    defaultEffectsOnComplete: {
      sponsorSatisfaction: 10,
      boardMood: 3,
      reputation: 2
    },
    defaultEffectsOnMiss: {
      sponsorSatisfaction: -8,
      boardMood: -3
    },
    requiresDriver: false,
    canScheduleOnRaceWeek: false,
    cooldownWeeks: 3,
    requiresSponsor: true,
    // Configuration - HQ only
    supportedVenueTypes: ['team_hq'],
    preferredVenueType: 'team_hq',
    minGuests: 5,
    maxGuests: 30,
    allowsSponsorGuests: true,
    allowsMediaGuests: true,
    allowsVIPGuests: true,
    requiresCatering: true,
    minCateringTier: 'business',
    allowsMediaCoverage: true,
    isConfigurable: true
  },
  {
    id: 'board_strategy_session',
    name: 'Board Strategy Session',
    description: 'Quarterly strategic planning meeting with the board of directors.',
    category: 'team',
    budgetCategory: 'operations',
    duration: 6,
    baseCost: 0,
    defaultEffectsOnComplete: {
      boardMood: 10,
      teamMorale: 3
    },
    defaultEffectsOnMiss: {
      boardMood: -15,
      teamMorale: -5
    },
    requiresDriver: false,
    canScheduleOnRaceWeek: false,
    maxPerSeason: 4,
    cooldownWeeks: 10,
    // Configuration - HQ only, internal
    supportedVenueTypes: ['team_hq'],
    preferredVenueType: 'team_hq',
    isConfigurable: false
  },
  {
    id: 'budget_review',
    name: 'Budget Review Meeting',
    description: 'Financial review and budget planning session with finance team.',
    category: 'team',
    budgetCategory: 'operations',
    duration: 4,
    baseCost: 0,
    defaultEffectsOnComplete: {
      boardMood: 5
    },
    defaultEffectsOnMiss: {
      boardMood: -8
    },
    requiresDriver: false,
    canScheduleOnRaceWeek: false,
    maxPerSeason: 6,
    cooldownWeeks: 6,
    // Configuration - HQ only, internal
    supportedVenueTypes: ['team_hq'],
    preferredVenueType: 'team_hq',
    isConfigurable: false
  },
  {
    id: 'supplier_negotiations',
    name: 'Supplier Negotiations',
    description: 'Negotiate with parts and equipment suppliers for better deals.',
    category: 'development',
    budgetCategory: 'development',
    duration: 5,
    baseCost: 500,
    defaultEffectsOnComplete: {
      developmentPoints: 3,
      boardMood: 3
    },
    defaultEffectsOnMiss: {
      boardMood: -2
    },
    requiresDriver: false,
    canScheduleOnRaceWeek: false,
    cooldownWeeks: 4,
    // Configuration
    supportedVenueTypes: ['team_hq', 'hotel_conference', 'restaurant'],
    preferredVenueType: 'team_hq',
    minGuests: 2,
    maxGuests: 10,
    allowsSponsorGuests: false,
    allowsMediaGuests: false,
    allowsVIPGuests: true,
    requiresCatering: true,
    minCateringTier: 'business',
    isConfigurable: true
  },
  {
    id: 'community_outreach',
    name: 'Community Outreach Event',
    description: 'Local charity or school visit to build community relationships.',
    category: 'media',
    budgetCategory: 'marketing',
    duration: 4,
    baseCost: 2000,
    defaultEffectsOnComplete: {
      fanSentiment: 10,
      reputation: 3,
      teamMorale: 5
    },
    defaultEffectsOnMiss: {
      fanSentiment: -5,
      reputation: -2
    },
    requiresDriver: false,
    canScheduleOnRaceWeek: true,
    cooldownWeeks: 4,
    // Configuration
    supportedVenueTypes: ['team_hq', 'exhibition_center'],
    preferredVenueType: 'team_hq',
    minGuests: 10,
    maxGuests: 100,
    allowsSponsorGuests: true,
    allowsMediaGuests: true,
    allowsFanAttendees: true,
    allowsMediaCoverage: true,
    isConfigurable: true,
    canCustomizeName: true
  },

  // === LIFESTYLE ACTIVITIES ===
  {
    id: 'fitness_session',
    name: 'Fitness Training',
    description: 'Dedicated gym session or personal training to stay in peak physical condition.',
    category: 'lifestyle',
    budgetCategory: 'personal',
    duration: 2,
    baseCost: 200,
    defaultEffectsOnComplete: {},
    defaultEffectsOnMiss: {},
    requiresDriver: true,
    canScheduleOnRaceWeek: true,
    isConfigurable: false
  },
  {
    id: 'hobby_time',
    name: 'Personal Hobby',
    description: 'Spend time on personal hobbies and interests outside of racing.',
    category: 'lifestyle',
    budgetCategory: 'personal',
    duration: 3,
    baseCost: 500,
    defaultEffectsOnComplete: {},
    defaultEffectsOnMiss: {},
    requiresDriver: true,
    canScheduleOnRaceWeek: false,
    isConfigurable: false
  },
  {
    id: 'education_course',
    name: 'Education & Learning',
    description: 'Take a course or workshop in business, engineering, or leadership.',
    category: 'lifestyle',
    budgetCategory: 'personal',
    duration: 4,
    baseCost: 2000,
    defaultEffectsOnComplete: {},
    defaultEffectsOnMiss: {},
    requiresDriver: true,
    canScheduleOnRaceWeek: false,
    isConfigurable: false
  },
  {
    id: 'family_time',
    name: 'Family Day',
    description: 'Quality time with family to maintain personal relationships and wellbeing.',
    category: 'lifestyle',
    budgetCategory: 'personal',
    duration: 6,
    baseCost: 300,
    defaultEffectsOnComplete: {},
    defaultEffectsOnMiss: {},
    requiresDriver: true,
    canScheduleOnRaceWeek: false,
    isConfigurable: false
  },
  {
    id: 'wellness_retreat',
    name: 'Wellness Retreat',
    description: 'Short retreat for mental and physical recovery -- spa, meditation, or countryside getaway.',
    category: 'lifestyle',
    budgetCategory: 'personal',
    duration: 8,
    baseCost: 3000,
    defaultEffectsOnComplete: {},
    defaultEffectsOnMiss: {},
    requiresDriver: true,
    canScheduleOnRaceWeek: false,
    isConfigurable: false
  }
]

// Telemetry race result from shared memory
export interface TelemetryRaceResult {
  playerPosition: number
  playerName: string
  totalParticipants: number
  lapsCompleted: number
  bestLapTime: number
  lastLapTime: number
  trackName: string
  carName: string
  carClass: string
  dnf: boolean
  sessionType: string
  rainDensity?: number  // 0 = dry, >0 = wet (from shared memory)
  allParticipants: Array<{
    name: string
    position: number
    lapsCompleted: number
    bestLapTime: number
    isPlayer: boolean
  }>
}

// Points system - F1 style
export const POINTS_BY_POSITION: Record<number, number> = {
  1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
  6: 8, 7: 6, 8: 4, 9: 2, 10: 1
}

// Prize money by position (scaled by series tier later)
export const BASE_PRIZE_MONEY: Record<number, number> = {
  1: 10000, 2: 7500, 3: 5000, 4: 3500, 5: 2500,
  6: 2000, 7: 1500, 8: 1000, 9: 750, 10: 500
}

export interface PlayerDriver {
  id: string
  firstName: string
  lastName: string
  nationality: string
  dateOfBirth: string    // ISO date string
  age: number
  careerStartAge: number
  scenario: CareerScenario
  stats: DriverStats
  mentalState: DriverMentalState
  health: DriverHealth
  finances: DriverFinances
  contract?: Contract
  pendingContract?: Contract     // Contract signed for next season (doesn't replace current)
  currentTeamId?: string
  currentSeriesId?: string
  totalRaces: number
  totalWins: number
  totalPodiums: number
  totalPoles: number
  championships: number
  reputation: number     // 0-100: Overall fame/standing
  raceHistory: RaceResult[]
  
  // New background system
  background?: PlayerBackground  // Full background data with narrative effects
  
  // Historical track data for commentary and achievements
  trackHistory: Record<string, TrackHistory>  // Key is canonical track ID
  
  // GOAT Progress tracking for "Becoming the GOAT" system
  goatProgress: GOATProgress
  
  // Extended stats for achievements
  totalFastestLaps: number
  consecutiveWins: number
  consecutivePodiums: number
  consecutivePoints: number
  hatTricks: number          // Pole + Win + Fastest Lap
  grandSlams: number         // Pole + Lead every lap + Win + Fastest Lap
  comebackWins: number       // Wins from P10+
  seasonsCompleted: number
  perfectSeasons: number     // Seasons with 100% wins
  dnfFreeSeasons: number     // Seasons without DNF
  seriesChampionships: string[]  // List of series IDs won
  
  // Special achievement tracking
  multiClassWins?: number      // Wins in multi-class races
  lastLapWins?: number         // Wins with last-lap overtake
  giantKillerWins?: number     // Wins in lower-tier car vs higher-tier
  wetRaceWins?: number         // Wins in wet conditions
  nightRaceWins?: number       // Wins in night races
  qualifyingKingSeasons?: number  // Seasons with pole at every race
  cleanSweepSeasons?: number   // Seasons with win+pole+FL at every race
  continentsWonAt?: string[]   // Continents where player has won
  categoriesWithChampionships?: string[]  // Racing categories with championships (formula, gt, prototype)
  
  // Media Star Power (Dual-Path Progression System)
  mediaStarPower: MediaStarPower
  
  // Traits for personality and background
  traits?: string[]
  
  // ============================================
  // PERSONAL LIFE & FINANCES (Owner Path)
  // ============================================
  // These fields are used when playing as a team owner
  
  // Personal wealth separate from team finances
  personalFinances?: PersonalFinancialState
  
  // Equity stake in owned team
  teamEquity?: TeamEquityStake
  
  // Current lifestyle level (affects expenses, reputation, family happiness)
  lifestyleLevel?: LifestyleLevel
  
  // Owner salary configuration (how much you pay yourself from the team)
  ownerSalary?: {
    weeklyAmount: number
    enabled: boolean
    countsTowardCostCap: boolean
  }
  
  // Dating preferences (sexual orientation for encounter system)
  datingPreference?: 'men' | 'women' | 'both' | 'none'
}

// Sponsor review result for season-end summary
export interface SponsorSeasonReview {
  sponsorName: string
  satisfaction: number
  targetsReview: Array<{ description: string; met: boolean; exceeded: boolean }>
  consequence: 'bonus' | 'normal' | 'reduced' | 'terminated'
}

// ============================================
// RACE WEEKEND PROGRESS TRACKING
// ============================================

export interface SessionResult {
  completed: boolean
  bestLapTime: number      // In seconds
  position: number         // Final position in session
  participantCount: number // Total participants
  completedAt: string      // ISO timestamp
}

export interface RaceWeekendProgress {
  trackId: string
  week: number
  year: number
  practice?: SessionResult
  qualifying?: SessionResult
  race?: {
    completed: boolean
    // Full race data is stored in raceHistory
  }
}

// Persistent weekend history (not cleared on week advance)
export interface WeekendSessionHistory {
  trackId: string
  trackName: string
  week: number
  year: number
  seriesId: string
  practicePosition?: number
  practiceBestLap?: number
  qualifyingPosition?: number
  qualifyingBestLap?: number
}

// ============================================
// MEDIA SYSTEM TYPES
// ============================================

export type MediaTone = 'confident' | 'humble' | 'bold' | 'diplomatic' | 'aggressive' | 'deflecting'
export type MediaPersonaLevel = 'unknown' | 'emerging' | 'established' | 'iconic'
export type MediaEventType = 'press_conference' | 'interview' | 'social_post' | 'team_event'

export interface MediaEvent {
  id: string
  type: MediaEventType
  week: number
  year: number
  eventContext?: string  // "post_race_win", "pre_race", etc.
  response?: { 
    questionId: string
    optionId: string
    tone: MediaTone
    responseText: string
  }
  headline?: string
  effects: { type: string; target: string; value: number }[]
  rivalMentioned?: string  // If response mentioned a rival
  // Sentiment Impact Tracking
  sponsorImpacts?: {
    sponsorId: string
    sponsorName: string
    change: number        // +8, -10, etc.
    reason: string        // "Sponsor shoutout", "Controversy clause violation"
  }[]
  teamImpact?: {
    change: number
    reason: string        // "Team appreciation post", "Public criticism"
  }
}

export interface MediaPersona {
  dominantTone: MediaTone | 'unknown'
  toneHistory: Record<string, number>  // tone -> count
  personaLevel: MediaPersonaLevel
  publicPerception: number  // 0-100, affects sponsor/fan reactions
  controversyLevel: number  // 0-100, high = more scrutiny
}

export interface PressClipping {
  id: string
  week: number
  year: number
  headline: string
  outlet: string
  sentiment: 'positive' | 'neutral' | 'negative' | 'controversial'
  relatedEventId?: string
  rivalResponse?: string  // If rival responded to your statement
}

// ============================================
// SOCIAL MEDIA SYSTEM
// ============================================

export type InterviewTier = 'local' | 'national' | 'global' | 'tv' | 'podcast' | 'documentary' | 'live_stream' | 'rival_media' | 'sponsor_arranged'
export type InterviewOutcome = 'success' | 'neutral' | 'disaster'

export interface SocialMediaState {
  followerCount: number
  engagementRate: number  // 0-10 as percentage
  verifiedStatus: boolean  // Unlocks at 50k followers
  totalPosts: number
  viralPosts: number
  lastPostEngagement?: {
    likes: number
    comments: number
    shares: number
    sentiment: 'positive' | 'mixed' | 'negative'
  }
}

export interface SocialPost {
  id: string
  week: number
  year: number
  type: string  // 'training_update', 'race_photo', etc.
  tone: MediaTone
  content: string  // Generated post text
  engagement: {
    likes: number
    comments: number
    shares: number
  }
  wentViral: boolean
  hadBacklash: boolean
  fanReactions: string[]  // Sample comments
}

export interface InterviewEvent {
  id: string
  week: number
  year: number
  outlet: string
  tier: InterviewTier
  questionsAsked: number
  responses: { questionId: string; optionId: string; tone: MediaTone }[]
  outcome: InterviewOutcome
  payment: number
  bonusEarned: number
  headline?: string
}

// Helper to create default social media state
export function createDefaultSocialMediaState(tier: string, reputation: number): SocialMediaState {
  // Starting followers based on tier and reputation
  const baseFollowers: Record<string, [number, number]> = {
    'amateur': [500, 2000],
    'semi-pro': [2000, 10000],
    'pro': [10000, 50000],
    'elite': [50000, 200000],
    'pinnacle': [200000, 500000]
  }
  
  const [min, max] = baseFollowers[tier] || baseFollowers['pro']
  const repMultiplier = reputation / 100
  const followerCount = Math.floor(min + (max - min) * repMultiplier)
  
  return {
    followerCount,
    engagementRate: 3 + Math.random() * 2, // 3-5% base engagement
    verifiedStatus: followerCount >= 50000,
    totalPosts: 0,
    viralPosts: 0
  }
}

// ============================================
// MEDIA STAR POWER SYSTEM (Dual-Path Progression)
// ============================================

export type MediaPersonalityType = 'unknown' | 'professional' | 'entertainer' | 'controversial' | 'beloved'

export interface MediaStarPower {
  followers: number           // Raw follower count (synced with socialMediaState)
  engagementRate: number      // Average engagement % (synced with socialMediaState)
  viralMoments: number        // Count of viral posts
  mediaPersonality: MediaPersonalityType
  starRating: number          // 0-100 calculated score (like reputation but for media)
}

// Calculate Media Star Rating from state (realistic thresholds)
export function calculateMediaStarRating(
  followers: number,
  engagementRate: number,
  viralMoments: number,
  mediaPersonality: MediaPersonalityType
): number {
  let rating = 0
  
  // Follower tiers (0-40 points) - updated for realistic social media scale
  if (followers >= 5000000) rating += 40       // 5M+ = Superstar
  else if (followers >= 2500000) rating += 35  // 2.5M+ = Social Media Star
  else if (followers >= 1000000) rating += 28  // 1M+ = Major Star
  else if (followers >= 500000) rating += 22   // 500K+ = Star
  else if (followers >= 250000) rating += 16   // 250K+ = Verified
  else if (followers >= 100000) rating += 10   // 100K+ = Influencer
  else if (followers >= 25000) rating += 5     // 25K+ = Notable
  else rating += Math.floor(followers / 5000)  // Under 25K scales slowly
  
  // Engagement rate (0-30 points) - engagement rate is 0-10
  rating += Math.min(30, engagementRate * 5)
  
  // Viral moments (0-20 points)
  rating += Math.min(20, viralMoments * 4)
  
  // Personality bonus (0-10 points)
  if (mediaPersonality === 'beloved') rating += 10
  else if (mediaPersonality === 'entertainer') rating += 7
  else if (mediaPersonality === 'controversial') rating += 5 // Famous but risky
  else if (mediaPersonality === 'professional') rating += 3
  
  return Math.min(100, rating)
}

// Create default Media Star Power based on tier and reputation
export function createDefaultMediaStarPower(tier: string, reputation: number): MediaStarPower {
  const socialState = createDefaultSocialMediaState(tier, reputation)
  const followers = socialState.followerCount
  const engagementRate = socialState.engagementRate
  
  return {
    followers,
    engagementRate,
    viralMoments: 0,
    mediaPersonality: 'unknown',
    starRating: calculateMediaStarRating(followers, engagementRate, 0, 'unknown')
  }
}

// Determine media personality based on tone history and controversy
export function determineMediaPersonality(
  toneHistory: Record<string, number>,
  controversyLevel: number,
  publicPerception: number
): MediaPersonalityType {
  const totalInteractions = Object.values(toneHistory).reduce((a, b) => a + b, 0)
  if (totalInteractions < 10) return 'unknown'
  
  const humbleCount = (toneHistory['humble'] || 0) + (toneHistory['diplomatic'] || 0)
  const boldCount = (toneHistory['bold'] || 0) + (toneHistory['aggressive'] || 0)
  const entertainingCount = (toneHistory['confident'] || 0) + (toneHistory['bold'] || 0)
  
  const humbleRatio = humbleCount / totalInteractions
  const boldRatio = boldCount / totalInteractions
  
  // High controversy = controversial personality
  if (controversyLevel > 50 || boldRatio > 0.5) return 'controversial'
  
  // High perception + humble = beloved
  if (publicPerception > 70 && humbleRatio > 0.4) return 'beloved'
  
  // Engaging content = entertainer
  if (entertainingCount / totalInteractions > 0.5) return 'entertainer'
  
  // Default to professional
  return 'professional'
}

// Follower milestones with expanded unlocks (realistic thresholds)
export const FOLLOWER_MILESTONES: Record<number, { name: string; description: string; unlocks?: string[] }> = {
  10000: { name: 'Rising Voice', description: 'Your voice is being heard!', unlocks: ['basic_interviews'] },
  25000: { name: 'Notable', description: 'Your social presence is growing!', unlocks: ['sponsor_interest_10'] },
  100000: { name: 'Influencer', description: 'Brands are taking notice!', unlocks: ['podcast_invites'] },
  250000: { name: 'Verified', description: 'You\'ve earned verified status!', unlocks: ['national_media', 'verified_badge'] },
  500000: { name: 'Star', description: 'A true fan favorite!', unlocks: ['premium_lifestyle_sponsors'] },
  1000000: { name: 'Major Star', description: 'Global recognition!', unlocks: ['global_media', 'documentary_offers'] },
  2500000: { name: 'Social Media Star', description: 'Elite status achieved!', unlocks: ['elite_sponsors', 'tv_priority'] },
  5000000: { name: 'Superstar', description: 'Five million followers - legendary!', unlocks: ['bidding_wars', 'max_leverage'] }
}

// Media reputation scaling by series tier
export const MEDIA_REP_MULTIPLIERS: Record<string, number> = {
  'amateur': 0.1,
  'semi-pro': 0.2,
  'pro': 0.4,
  'elite': 0.6,
  'pinnacle': 1.0
}

// Seasonal caps for media reputation effects
export const MEDIA_SEASON_CAP_POSITIVE = 2    // Max +2 rep per season from media
export const MEDIA_SEASON_CAP_NEGATIVE = -3   // Max -3 rep per season from media

// Helper to create default media persona
export function createDefaultMediaPersona(): MediaPersona {
  return {
    dominantTone: 'unknown',
    toneHistory: {},
    personaLevel: 'unknown',
    publicPerception: 50,
    controversyLevel: 0
  }
}

export interface CareerState {
  currentYear: number
  currentWeek: number    // 1-52 or 1-53 depending on year
  currentDay: number     // 1-7 (Monday=1, Sunday=7)
  currentRound: number   // Current round in the championship (0 = pre-season)
  seasonStarted: boolean
  seasonCompleted: boolean
  nextRaceWeek?: number
  nextRaceTrack?: string
  // Multi-series support
  pendingConflicts: CalendarConflict[]
  resolvedConflicts: CalendarConflict[]
  // Sponsor system
  pendingSponsorOffers: SponsorDeal[]
  lastSponsorGenerationWeek: number  // Track when offers were last generated
  lastSeasonSponsorReviews?: SponsorSeasonReview[]  // Results from end-of-season sponsor evaluation
  // RPG System
  rpgState: RPGState
  // Career Events
  events: CareerEvent[]
  // Media cooldowns (separate from removed training system)
  mediaCooldowns: Record<string, number>
  // Race weekend progress (practice, qualifying results)
  raceWeekendProgress?: RaceWeekendProgress
  // Team ownership state (Stage 1)
  ownedTeam?: OwnedTeam | null
  seriesEntries?: TeamSeriesEntry[]
  cars?: TeamCar[]
  boardTargets?: BoardTarget[]
  boardWarnings?: number
  costCapCompliance?: boolean
  // Media System - persistent state
  mediaHistory: MediaEvent[]
  mediaPersona: MediaPersona
  completedPressConferences: Record<string, string[]>  // Key: "{week}_{year}_{eventType}", Value: answered question IDs
  pressClippings: PressClipping[]
  seasonMediaRepGain: number  // Track total rep gained from media this season (capped at +2, floor at -3)
  // Social Media System
  socialMediaState: SocialMediaState
  socialPosts: SocialPost[]
  interviewHistory: InterviewEvent[]
  // NEW: Full Team Development System
  teamDevelopment?: TeamDevelopmentState
  developmentEvents: TeamDevelopmentEvent[]
  
  // Invitational Events System
  pendingInvitations: InvitationalEvent[]       // Invitations awaiting player response
  acceptedInvitations: InvitationalEvent[]      // Accepted invitations on calendar
  completedInvitations: InvitationalEvent[]     // Past invitational events (for history)
  declinedInvitationsThisSeason: number         // Track declines for invitation frequency
  invitationsThisSeason: number                 // Track total invitations received
  eventsUsedThisYear: string[]                  // Template IDs used this year (for annual limits)
  eventHistory: { templateId: string; year: number }[]  // History for biennial/quadrennial events
  
  // Team Opportunities System (non-racing opportunities)
  pendingOpportunities: TeamOpportunity[]       // Opportunities awaiting response
  acceptedOpportunities: TeamOpportunity[]      // Accepted opportunities
  completedOpportunities: TeamOpportunity[]     // Completed opportunities (history)
  declinedOpportunitiesThisSeason: string[]     // Template IDs declined this season
  acceptedOpportunitiesThisSeason: string[]     // Template IDs accepted this season
  lastOpportunityOfferWeeks: Record<string, number>  // Track when each template was last offered
  
  // Email System
  emails: Email[]
  
  // Scheduled Activities System
  scheduledActivities: ScheduledActivity[]
  activityHistory: ScheduledActivity[]       // Completed/missed activities
  
  // Car Marketplace System
  marketplaceListings: MarketplaceListing[]
  marketplaceLastRefreshWeek: number
  marketplaceLastRefreshYear: number
  
  // Team Media System
  teamMediaState?: TeamMediaState
  
  // Manufacturer Relationship System
  manufacturerRelationships: Record<string, ManufacturerRelationship>
  
  // Staff Market (both Facility and Team staff)
  facilityStaffMarket: StaffMember[]
  facilityStaffMarketLastRefreshWeek: number
  facilityStaffMarketLastRefreshYear: number
  
  // World Staff Pool - persistent pool of all known staff in the game world
  worldStaffPool: WorldStaffMember[]
  
  // Tutorial/Onboarding System
  tutorialCompleted: boolean              // Whether the first-time tutorial has been completed
  visitedScreens: string[]                // Track which screens the player has visited
  helpDismissedScreens: string[]          // Screens where help has been dismissed
  
  // Personal Life System (Team Owner mode)
  personalLife?: PersonalLifeState        // Personal finances, family, lifestyle, and social management
  playerLastName?: string                 // Player's last name for family tree and personal life
  
  // Extended Life Simulation Systems
  messaging?: MessagingState              // Phone, conversations, dating
  expandedHobbies?: ExpandedHobbiesState  // Deep hobby system with skill progression
  collections?: CollectionsState          // Cars, watches, art, wine collections
  socialMediaExpanded?: ExpandedSocialMediaState  // Full social media simulation
  travel?: TravelState                    // Vacations and travel
  retirement?: ExtendedRetirementState    // Retirement planning
  
  // Time Budget System (Hour Pool + Fatigue)
  dayBudget: DayBudgetState              // Current day's time budget, fatigue debt, and activity log
  
  // Persistent weekend session history (practice/qualifying results kept across weeks)
  weekendSessionHistory?: WeekendSessionHistory[]
}

interface CareerStore {
  // State
  hasActiveCareer: boolean
  player: PlayerDriver | null
  careerState: CareerState | null
  
  // Actions
  createCareer: (player: PlayerDriver) => void
  updatePlayer: (updates: Partial<PlayerDriver>) => void
  updateStats: (updates: Partial<DriverStats>) => void
  updateMentalState: (updates: Partial<DriverMentalState>) => void
  updateFinances: (updates: Partial<DriverFinances>) => void
  addTransaction: (transaction: Omit<FinancialTransaction, 'id'>) => void
  updateCareerState: (updates: Partial<CareerState>) => void
  // Team ownership setters
  setOwnedTeam: (team: OwnedTeam) => void
  updateOwnedTeam: (updates: Partial<OwnedTeam>) => void
  setSeriesEntries: (entries: TeamSeriesEntry[]) => void
  upsertSeriesEntry: (entry: TeamSeriesEntry) => void
  setCars: (cars: TeamCar[]) => void
  upsertCar: (car: TeamCar) => void
  setBoardTargets: (targets: BoardTarget[]) => void
  updateBoardTargetProgress: (id: string, progress: Partial<BoardTarget>) => void
  
  // Series Entry & Car Acquisition (Owner mode)
  enterSeries: (seriesId: string, seriesName: string, entryFee: number, manufacturerId?: string) => boolean
  purchaseCar: (seriesId: string, liveryName: string, chassisId: string, engineId: string, cost: number, seriesName?: string, entryFee?: number) => boolean
  sellCar: (carId: string, refundAmount: number) => void
  withdrawFromSeries: (seriesId: string) => void
  
  // Roster Management (Owner mode)
  signHiredDriver: (driverId: string, contract: HiredDriverContract, carId: string) => boolean
  releaseHiredDriver: (driverId: string) => void
  updateHiredDriverContract: (driverId: string, updates: Partial<HiredDriverContract>) => void
  // Driver Development
  startDriverTraining: (driverId: string, programId: string) => { success: boolean; error?: string }
  cancelDriverTraining: (driverId: string) => void
  processDriverTrainingWeekly: () => void
  getDriverDevelopmentState: (driverId: string) => TeamDriver['development'] | undefined
  hireStaff: (staff: TeamStaff) => boolean
  releaseStaff: (staffId: string) => void
  updateStaffContract: (staffId: string, updates: Partial<StaffContract>) => void
  
  // Staff Job Market System
  staffJobMarket: StaffCandidate[]
  activeNegotiations: StaffNegotiation[]
  lastMarketRefresh: number
  refreshStaffMarket: () => void
  startNegotiation: (candidateId: string, offer: StaffContractOffer) => StaffNegotiation | null
  submitNegotiationOffer: (negotiationId: string, offer: StaffContractOffer) => StaffNegotiation | null
  acceptNegotiation: (negotiationId: string) => boolean
  cancelNegotiation: (negotiationId: string) => void
  getCandidateById: (candidateId: string) => StaffCandidate | undefined
  getCandidateImpact: (candidateId: string) => StaffImpactPreview | null
  
  // Facility Management
  upgradeFacility: (facilityType: FacilityType) => { success: boolean; error?: string; duration?: number }
  completeUpgrade: (facilityType: FacilityType) => void
  assignStaffToFacility: (staffId: string, facilityType: FacilityType) => { success: boolean; error?: string }
  removeStaffFromFacility: (staffId: string) => void
  getFacilityBonus: (facilityType: FacilityType) => number
  getFacilityEffectiveBonus: (facilityType: FacilityType) => number  // Including staff modifier
  calculateTotalFacilityOperationalCosts: () => number
  processFacilityUpgrades: () => void  // Called weekly to check/complete upgrades
  
  // Roster helpers
  getHiredDriver: () => TeamDriver | undefined
  getHiredDrivers: () => TeamDriver[]
  getHiredDriverById: (driverId: string) => TeamDriver | undefined
  getHiredDriverForCar: (carId: string) => TeamDriver | undefined
  hasSecondCarSlot: () => boolean
  getStaffByRole: (role: TeamStaffRole) => TeamStaff | undefined
  advanceWeek: () => void
  advanceDay: () => void
  
  // Time Budget System
  consumeHoursFromBudget: (hours: number, drainLevel: DrainLevel, activityName: string, activityId?: string) => boolean
  getHoursRemaining: () => number
  getFatigueZone: () => 'green' | 'yellow' | 'red'
  canAffordTime: (hours: number) => boolean
  addPersonalCalendarEntry: (entry: {
    name: string
    description?: string
    activityId: string
    week: number
    day: number
    duration: number
    drainLevel: DrainLevel
    calendarEntryType: CalendarEntryType
    category?: ActivityCategory
    immediate?: boolean  // true = mark as completed right away (for "did it now" actions)
  }) => void
  
  // Team Media System
  initializeTeamMedia: (teamName: string) => void
  updateTeamMediaState: (updates: Partial<TeamMediaState>) => void
  addTeamPost: (post: Omit<TeamPost, 'id'>) => void
  addTeamHeadline: (headline: Omit<TeamHeadline, 'id'>) => void
  addPressRelease: (release: Omit<PressRelease, 'id'>) => void
  addControversy: (controversy: Omit<Controversy, 'id'>) => void
  respondToControversy: (controversyId: string, responseType: ControversyResponseType) => void
  addInterviewRequest: (request: Omit<InterviewRequest, 'id'>) => void
  handleInterviewRequest: (requestId: string, approve: boolean) => void
  updateFanSentiment: (change: number, reason?: string) => void
  scheduleFanEvent: (event: Omit<FanEvent, 'id'>) => void
  completeFanEvent: (eventId: string, attended: number) => void
  updateJournalistRelation: (journalistId: string, change: number, reason: string) => void
  processWeeklyMediaDecay: () => void
  
  // Media Duty System
  generateWeekendDuties: (trackId: string, trackName: string, seriesId: string, seriesName: string, week: number, year: number) => void
  setDutyOptions: (dutyId: string, options: MediaDutyOption[]) => void
  completeDuty: (dutyId: string, selectedOptionId: string) => void
  skipDuty: (dutyId: string) => void
  processMissedDuties: () => void
  addMediaPromise: (promise: Omit<MediaPromise, 'id'>) => void
  checkPromises: () => void
  fulfillPromise: (promiseId: string) => void
  breakPromise: (promiseId: string) => void
  getActiveDuties: () => MediaDuty[]
  getUpcomingDuties: () => MediaDuty[]
  getDutyScheduleStats: () => MediaDutySchedule
  
  // Email System
  addEmail: (email: Omit<Email, 'id'>) => void
  markEmailRead: (emailId: string) => void
  markEmailUnread: (emailId: string) => void
  toggleEmailStarred: (emailId: string) => void
  archiveEmail: (emailId: string) => void
  deleteEmail: (emailId: string) => void
  getUnreadEmailCount: () => number
  getEmailsByCategory: (category: EmailCategory) => Email[]
  setContract: (contract: Contract, isForNextSeason?: boolean) => void
  activatePendingContract: () => void  // Activate pending contract at season start
  clearContract: () => void
  addRaceResult: (result: Omit<RaceResult, 'id'>) => void
  processRaceResult: (telemetryResult: TelemetryRaceResult) => { points: number; prizeMoney: number; repChange: number }
  resetCareer: () => void
  repairCareerData: () => { 
    duplicateRacesRemoved: number
    duplicateTransactionsRemoved: number
    statsRecalculated: boolean
    standingsFixed: boolean
    oldRep: number
    newRep: number
    oldBalance: number
    newBalance: number
  }
  recalculateReputation: () => { oldRep: number; newRep: number }
  recalculateTeamReputation: () => { oldRep: number; newRep: number }
  recalculateMarketability: () => { oldMarketability: number; newMarketability: number }
  recalculatePrizeMoney: () => { 
    racesFixed: number
    oldTotal: number
    newTotal: number
    difference: number
  }
  recalculateEconomy: () => {
    teamsUpdated: number
    oldSeatCost: number
    newSeatCost: number
    oldSalary: number
    newSalary: number
    seatFeeDifference: number
    message: string
  }
  upgradeContractsAndSponsors: () => { 
    contractsUpgraded: number
    sponsorsKept: number
    sponsorsRemoved: number
    removedNames: string[]
    message: string 
  }
  recalculateContractTargets: () => {
    oldPointsTarget: number | null
    newPointsTarget: number | null
    scaleFactor: number
    message: string
  }
  
  // Season management
  checkSeasonComplete: () => boolean
  endSeason: () => SeasonSummary | null
  
  // Computed helpers
  getUpcomingRace: () => { week: number; track: string } | null
  canAffordSeat: (seatCost: number) => boolean
  
  // Calendar conflict management
  detectCalendarConflicts: (seriesIds: string[], calendars: Record<string, Array<{ week: number; trackId: string; trackName: string; country: string; round: number }>>) => CalendarConflict[]
  resolveConflict: (conflictId: string, chosenSeriesId: string) => void
  getNextConflict: () => CalendarConflict | null
  hasUnresolvedConflicts: () => boolean
  
  // Sponsor management
  generateSponsorOffers: () => SponsorDeal[]
  acceptSponsorDeal: (dealId: string) => void
  declineSponsorDeal: (dealId: string) => void
  getActiveSponsorDeals: () => SponsorDeal[]
  expireOldSponsorDeals: () => void
  
  // RPG System
  updateRPGState: (updates: Partial<RPGState>) => void
  updateTeamDevelopment: (updates: Partial<AIModifierTeamDevState>) => void
  updateMilestonesFromPlayer: () => Array<{ key: keyof MilestoneProgress; perk: typeof MILESTONE_PERKS[keyof MilestoneProgress] }>
  
  // NEW: Full Team Development System
  initializeTeamDevelopment: () => void
  processWeeklyDevelopment: () => { pointsGained: Record<DevelopmentArea, number>; completedUpgrades: string[]; events: TeamDevelopmentEvent[] }
  setDevFocus: (area: DevelopmentArea | 'balanced') => void
  setDevBudget: (amount: number) => void
  startResearch: (upgradeId: string) => boolean
  addRaceResultBonus: (wins: number, podiums: number, pointsFinishes: number) => void
  getTeamDevModifier: () => number
  resetTeamDevForSeason: () => void
  setInjury: (injury: InjuryState) => void
  healInjury: () => void
  getAIModifier: () => AIModifierResult
  getRPGState: () => RPGState
  isRaceWeek: () => boolean
  
  // Contract Status & Market Value
  getContractStatus: () => ContractStatus
  getYearsRemaining: () => number
  calculateMarketValue: () => number
  calculateReleaseClause: () => number
  processContractBuyout: (buyoutAmount: number, newContract: Contract) => boolean
  
  // Race Weekend Progress
  updateRaceWeekendProgress: (updates: Partial<RaceWeekendProgress>) => void
  clearRaceWeekendProgress: () => void
  
  // GOAT Progress System
  updateGOATProgress: () => { newMilestones: string[]; newTripleCrownLegs: string[]; newRecordsBroken: string[] }
  checkAndUnlockMilestones: () => string[]  // Returns newly unlocked milestone IDs
  
  // Media Star Power System
  updateMediaStarPower: (updates: Partial<MediaStarPower>) => void
  syncMediaStarPower: () => void  // Syncs mediaStarPower with socialMediaState
  
  // Invitational Events System
  generateInvitation: () => InvitationalEvent | null
  acceptInvitation: (invitationId: string) => void
  declineInvitation: (invitationId: string) => { reputationPenalty: number; organizerPenalty: number; message: string }
  completeInvitation: (invitationId: string, position: number) => { prize: number; reputationGained: number }
  getPendingInvitations: () => InvitationalEvent[]
  getAcceptedInvitations: () => InvitationalEvent[]
  getCurrentInvitationalEvent: () => InvitationalEvent | null
  isInvitationalWeek: () => boolean
  
  // Team Opportunities System
  acceptOpportunity: (opportunityId: string, scheduledWeek: number, scheduledDay: number) => TeamOpportunity | null
  declineOpportunity: (opportunityId: string) => { success: boolean; consequences: TeamOpportunity['consequences'] | null }
  completeOpportunityEvent: (opportunityId: string, performanceMultiplier?: number) => { success: boolean; rewards: TeamOpportunity['rewards'] | null }
  getPendingOpportunities: () => TeamOpportunity[]
  getAcceptedOpportunities: () => TeamOpportunity[]
  
  // Scheduled Activities System
  scheduleActivity: (templateId: string, week: number, day: number, sponsorId?: string) => ScheduledActivity | null
  cancelActivity: (activityId: string) => boolean
  rescheduleActivity: (activityId: string, newWeek: number, newDay: number) => boolean
  completeActivity: (activityId: string, effectsOverride?: ActivityEffect) => ActivityEffect | null
  missActivity: (activityId: string) => ActivityEffect | null
  getScheduledActivities: (week?: number) => ScheduledActivity[]
  getActivityHistory: () => ScheduledActivity[]
  getAvailableActivities: () => ActivityTemplate[]
  processScheduledActivities: () => void  // Called during advanceDay
  
  // Activity Configuration & Validation (NEW)
  validateActivityRequirements: (templateId: string) => { 
    valid: boolean
    errors: string[]
    warnings: string[]
  }
  calculateActivityCost: (templateId: string, configuration: ActivityConfiguration) => ActivityCostBreakdown
  getActivityOpportunities: () => ScheduledActivity[]  // Available triggered events (optional)
  getMandatoryActivities: () => ScheduledActivity[]    // Required activities with deadlines
  scheduleConfiguredActivity: (
    templateId: string, 
    week: number, 
    day: number, 
    configuration: ActivityConfiguration
  ) => ScheduledActivity | null
  generateTriggeredActivities: (raceResult?: 'win' | 'podium' | 'points' | 'dnf' | null) => ScheduledActivity[]
  generateActivityReminders: () => void  // Generate email reminders for upcoming activities
  generateMandatoryActivities: () => void  // Check and create mandatory activities based on triggers
  processOverspendConsequences: () => void  // Apply penalties for budget overspending
  
  // Driver/Owner Conflict System
  hasReserveDriver: () => boolean  // Check if team has a reserve driver on staff
  getActivitiesForDay: (week: number, day: number) => ScheduledActivity[]  // Get all activities for a specific day
  canAttendActivity: (activityId: string) => {
    canAttend: boolean
    reason?: 'conflict' | 'no_reserve' | 'driver_needed'
    conflictingActivities?: ScheduledActivity[]
    resolutionOptions?: string[]
  }
  checkScheduleConflict: (week: number, day: number, requiresDriver?: boolean, requiresOwner?: boolean) => {
    hasConflict: boolean
    conflictType?: 'driver' | 'owner' | 'both'
    conflictingActivities: ScheduledActivity[]
    canResolveWithReserve: boolean
  }
  
  // Car Marketplace System
  refreshMarketplaceListings: () => void
  purchaseFromMarketplace: (listingId: string, seriesId?: string, seriesName?: string, entryFee?: number) => boolean
  placeBid: (listingId: string, bidAmount: number) => boolean
  processMarketplaceWeekly: () => { expiredListings: string[]; auctionResults: Array<{ listingId: string; won: boolean; price: number }> }
  getMarketplaceListings: (filters?: { type?: MarketplaceListingType; classId?: string; condition?: CarCondition }) => MarketplaceListing[]
  serviceCar: (carId: string, serviceType: 'full' | 'partial') => { cost: number; partsServiced: (keyof CarPartWear)[] } | null
  serviceCarGranular: (carId: string, partSelections: PartServiceSelection[]) => { cost: number; partsServiced: PartServiceSelection[] } | null
  // Car Inspection and Wear (internal use)
  _generateCarInspectionEmail: (car: TeamCar, carClassName: string, manufacturerId: string) => void
  _sendCriticalWearWarning: (car: TeamCar, criticalParts: (keyof CarPartWear)[], currentWear: CarPartWear) => void
  // Manufacturer Relationship Functions
  getManufacturerRelationship: (manufacturerId: string) => ManufacturerRelationship | null
  getManufacturerDiscount: (manufacturerId: string) => { carDiscount: number; partsDiscount: number; tier: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum' }
  updateManufacturerRelationship: (manufacturerId: string, interactionType: 'purchase' | 'parts' | 'race_win' | 'race_podium', amount?: number) => void
  decayManufacturerFavor: () => void
  
  // Facility Staff Management
  refreshFacilityStaffMarket: () => void
  hireFacilityStaff: (staffId: string) => { success: boolean; error?: string; staff?: HiredFacilityStaff }
  fireFacilityStaff: (staffId: string) => { success: boolean; error?: string }
  assignFacilityStaffToFacility: (staffId: string, facilityType: FacilityType) => { success: boolean; error?: string }
  unassignFacilityStaffFromFacility: (staffId: string) => { success: boolean; error?: string }
  getFacilityStaffMarket: () => FacilityStaffMember[]
  getHiredFacilityStaff: () => HiredFacilityStaff[]
  
  // Tutorial/Onboarding System
  markTutorialComplete: () => void
  trackScreenVisit: (screenPath: string) => void
  dismissHelpForScreen: (screenPath: string) => void
  resetTutorial: () => void
  
  // ============================================
  // EXTENDED LIFE SIMULATION ACTIONS
  // ============================================
  
  // Messaging & Dating System
  initializeMessaging: () => void
  addContact: (contact: ContactInfo) => void
  removeContact: (contactId: string) => void
  updateContact: (contactId: string, updates: Partial<ContactInfo>) => void
  addMessage: (conversationId: string, message: { content: string; isPlayer: boolean }) => void
  markConversationRead: (conversationId: string) => void
  startConversation: (contactId: string) => string  // Returns conversation ID
  sendGift: (contactId: string, giftName: string, giftValue: number) => void
  sendDateInvite: (contactId: string, dateType: string, location: string, week: number) => void
  processDateInviteResponse: (inviteId: string, accepted: boolean) => void
  updateRelationshipMeters: (contactId: string, changes: { affection?: number; romance?: number; trust?: number }) => void
  generatePotentialDate: () => PotentialDate | null
  
  // Expanded Hobbies System
  initializeExpandedHobbies: () => void
  startHobby: (hobbyId: string) => void
  practiceHobby: (hobbyId: string, hours: number) => { xpGained: number; levelUp: boolean }
  scheduleHobbyLesson: (hobbyId: string, instructorId: string, week: number, day: number) => void
  completeHobbyLesson: (lessonId: string) => { xpGained: number; skillBoost: number }
  getHobbyProgress: (hobbyId: string) => { level: number; xp: number; mastery: string } | null
  
  // Collections System
  initializeCollections: () => void
  addToCollection: (collectionType: string, item: any) => void
  sellFromCollection: (collectionType: string, itemId: string) => { soldFor: number }
  updateCollectionValues: () => { totalAppreciation: number }
  getCollectionSummary: () => { totalValue: number; itemCount: number; appreciation: number }
  
  // Expanded Social Media System  
  initializeSocialMediaExpanded: () => void
  createSocialPost: (platform: string, content: string, topic: string, tone: string) => void
  respondToTroll: (trollId: string, responseType: string) => { outcomeType: string; followerChange: number }
  schedulePost: (platform: string, content: string, scheduledWeek: number, scheduledDay: number) => void
  processWeeklySocialMedia: () => { followerGrowth: number; engagementRate: number; viralPosts: number }
  
  // Travel & Vacations System
  initializeTravel: () => void
  planVacation: (destination: string, startWeek: number, duration: number, companions: string[]) => void
  cancelVacation: (vacationId: string) => { refundAmount: number }
  completeVacation: (vacationId: string) => { stressReduction: number; relationshipBoosts: Record<string, number> }
  
  // Retirement Planning System
  initializeRetirement: () => void
  updateRetirementPlan: (updates: Partial<ExtendedRetirementState>) => void
  selectPostRacingPath: (pathId: string) => void
  addLegacyGoal: (goal: { name: string; description: string; targetValue: number }) => void
  progressLegacyGoal: (goalId: string, progress: number) => void
  assessRetirementReadiness: () => { financial: number; mental: number; career: number; overall: number }
}

export interface SeasonSummary {
  year: number
  seriesName: string
  finalPosition: number
  totalDrivers: number
  points: number
  wins: number
  podiums: number
  races: number
  prizeMoney: number
  isChampion: boolean
}

const initialCareerState: CareerState = {
  currentYear: 2024,
  currentWeek: 1,
  currentDay: 1,  // Monday
  currentRound: 0,
  seasonStarted: false,
  seasonCompleted: false,
  pendingConflicts: [],
  resolvedConflicts: [],
  pendingSponsorOffers: [],
  lastSponsorGenerationWeek: 0,
  ownedTeam: null,
  seriesEntries: [],
  cars: [],
  boardTargets: [],
  boardWarnings: 0,
  costCapCompliance: true,
  rpgState: createDefaultRPGState(),
  events: [],
  mediaCooldowns: {},
  // Media System
  mediaHistory: [],
  mediaPersona: createDefaultMediaPersona(),
  completedPressConferences: {},
  pressClippings: [],
  seasonMediaRepGain: 0,
  // Social Media System
  socialMediaState: createDefaultSocialMediaState('pro', 50),
  socialPosts: [],
  interviewHistory: [],
  // Team Development System
  developmentEvents: [],
  // Invitational Events System
  pendingInvitations: [],
  acceptedInvitations: [],
  completedInvitations: [],
  declinedInvitationsThisSeason: 0,
  invitationsThisSeason: 0,
  eventsUsedThisYear: [],
  // Team Opportunities System
  pendingOpportunities: [],
  acceptedOpportunities: [],
  completedOpportunities: [],
  declinedOpportunitiesThisSeason: [],
  acceptedOpportunitiesThisSeason: [],
  lastOpportunityOfferWeeks: {},
  eventHistory: [],
  // Email System
  emails: [],
  // Scheduled Activities System
  scheduledActivities: [],
  activityHistory: [],
  // Car Marketplace System
  marketplaceListings: [],
  marketplaceLastRefreshWeek: 0,
  marketplaceLastRefreshYear: 0,
  // Manufacturer Relationship System
  manufacturerRelationships: {},
  // Facility Staff Market
  facilityStaffMarket: [],
  facilityStaffMarketLastRefreshWeek: 0,
  facilityStaffMarketLastRefreshYear: 0,
  // World Staff Pool
  worldStaffPool: [],
  // Tutorial/Onboarding System
  tutorialCompleted: false,
  visitedScreens: [],
  helpDismissedScreens: [],
  // Extended Life Simulation Systems
  messaging: createDefaultMessagingState(),
  expandedHobbies: createDefaultExpandedHobbiesState(),
  collections: createDefaultCollectionsState(),
  socialMediaExpanded: createDefaultExpandedSocialMediaState(),
  travel: createDefaultTravelState(),
  retirement: createDefaultRetirementState(),
  // Time Budget System
  dayBudget: createDefaultDayBudgetState()
}

// ============================================
// CAREER DATA MIGRATION
// Rebuilds trackHistory and goatProgress for existing saves
// ============================================

/**
 * Rebuild trackHistory from existing raceHistory
 * This is needed for saves created before trackHistory was added
 */
function rebuildTrackHistoryFromRaceHistory(raceHistory: RaceResult[]): Record<string, TrackHistory> {
  const trackHistory: Record<string, TrackHistory> = {}
  
  // Sort by date to process in chronological order
  const sortedRaces = [...raceHistory].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  
  // Track consecutive wins per track and consecutive visits without DNF
  const lastWinPerTrack: Record<string, boolean> = {}
  const lastDnfPerTrack: Record<string, boolean> = {}
  
  for (const race of sortedRaces) {
    const trackId = normalizeTrackName(race.trackName)
    const raceYear = new Date(race.date).getFullYear()
    
    if (!trackHistory[trackId]) {
      trackHistory[trackId] = {
        trackId,
        trackName: race.trackName,
        visits: 0,
        wins: 0,
        podiums: 0,
        poles: 0,
        fastestLaps: 0,
        dnfs: 0,
        bestFinish: 99,
        worstFinish: 0,
        avgFinish: 0,
        consecutiveWins: 0,
        maxConsecutiveWins: 0,
        consecutiveVisits: 0,
        lastVisitYear: raceYear,
        firstVisitYear: raceYear,
        lastResult: 0,
        seriesRacedHere: []
      }
    }
    
    const th = trackHistory[trackId]
    
    // Update visit count
    th.visits++
    
    // Track last result
    th.lastResult = race.racePosition
    
    // Track series raced here
    if (race.seriesId && !th.seriesRacedHere.includes(race.seriesId)) {
      th.seriesRacedHere.push(race.seriesId)
    }
    
    // Update win count and streaks
    if (race.racePosition === 1) {
      th.wins++
      
      // Check for consecutive wins
      if (lastWinPerTrack[trackId]) {
        th.consecutiveWins++
      } else {
        th.consecutiveWins = 1
      }
      th.maxConsecutiveWins = Math.max(th.maxConsecutiveWins, th.consecutiveWins)
      lastWinPerTrack[trackId] = true
    } else {
      th.consecutiveWins = 0
      lastWinPerTrack[trackId] = false
    }
    
    // Update consecutive visits (no DNF streak)
    if (!race.dnf) {
      if (!lastDnfPerTrack[trackId]) {
        th.consecutiveVisits++
      } else {
        th.consecutiveVisits = 1
      }
      lastDnfPerTrack[trackId] = false
    } else {
      th.consecutiveVisits = 0
      lastDnfPerTrack[trackId] = true
    }
    
    // Update podium count
    if (race.racePosition <= 3 && !race.dnf) {
      th.podiums++
    }
    
    // Update pole count
    if (race.qualifyingPosition === 1) {
      th.poles++
    }
    
    // Update fastest laps
    if (race.fastestLap) {
      th.fastestLaps++
    }
    
    // Update DNF count
    if (race.dnf) {
      th.dnfs++
    }
    
    // Update best/worst finish
    if (!race.dnf) {
      if (race.racePosition < th.bestFinish) {
        th.bestFinish = race.racePosition
      }
      if (race.racePosition > th.worstFinish) {
        th.worstFinish = race.racePosition
      }
    }
    
    // Update average finish (running average)
    if (!race.dnf) {
      const prevTotal = th.avgFinish * (th.visits - 1)
      th.avgFinish = (prevTotal + race.racePosition) / th.visits
    }
    
    // Update year tracking
    th.lastVisitYear = Math.max(th.lastVisitYear, raceYear)
    th.firstVisitYear = Math.min(th.firstVisitYear, raceYear)
  }
  
  return trackHistory
}

/**
 * Migrate player data to ensure trackHistory and goatProgress exist
 * Called during career load for backwards compatibility
 */
export function migratePlayerData(player: PlayerDriver): PlayerDriver {
  if (!player) return player
  
  let migrated = { ...player }
  let needsUpdate = false
  
  // Rebuild trackHistory if empty but we have raceHistory
  if ((!migrated.trackHistory || Object.keys(migrated.trackHistory).length === 0) 
      && migrated.raceHistory && migrated.raceHistory.length > 0) {
    console.log('[Migration] Rebuilding trackHistory from', migrated.raceHistory.length, 'races')
    migrated.trackHistory = rebuildTrackHistoryFromRaceHistory(migrated.raceHistory)
    needsUpdate = true
  }
  
  // Initialize goatProgress if missing
  if (!migrated.goatProgress) {
    console.log('[Migration] Initializing goatProgress')
    migrated.goatProgress = createDefaultGOATProgress()
    needsUpdate = true
  }
  
  // Ensure trackHistory exists (even if empty)
  if (!migrated.trackHistory) {
    migrated.trackHistory = {}
    needsUpdate = true
  }
  
  // Initialize mediaStarPower if missing (new dual-path progression system)
  if (!migrated.mediaStarPower) {
    console.log('[Migration] Initializing mediaStarPower from existing social media state')
    // Derive tier from reputation
    const rep = migrated.reputation || 50
    const tier = rep >= 80 ? 'elite' : rep >= 60 ? 'pro' : rep >= 40 ? 'semi-pro' : 'amateur'
    migrated.mediaStarPower = createDefaultMediaStarPower(tier, rep)
    needsUpdate = true
  }
  
  // Initialize datingPreference if missing - default to 'both' so encounters work
  if (!migrated.datingPreference) {
    migrated.datingPreference = 'both'
    needsUpdate = true
  }
  
  if (needsUpdate) {
    console.log('[Migration] Player data migrated - trackHistory entries:', Object.keys(migrated.trackHistory).length)
  }
  
  return migrated
}

/**
 * Migrate career state to ensure new fields exist for backwards compatibility
 * Called during career load
 */
export function migrateCareerState(careerState: CareerState | null): CareerState | null {
  if (!careerState) return careerState
  
  let migrated = { ...careerState }
  let needsUpdate = false
  
  // Migrate ownedTeam to include drivers array
  if (migrated.ownedTeam && !migrated.ownedTeam.drivers) {
    console.log('[Migration] Adding drivers array to ownedTeam')
    migrated.ownedTeam = {
      ...migrated.ownedTeam,
      drivers: []
    }
    needsUpdate = true
  }
  
  // Migrate cars to include driverType field
  if (migrated.cars && migrated.cars.length > 0) {
    const migratedCars = migrated.cars.map((car, index) => {
      if (car.driverType === undefined) {
        console.log('[Migration] Adding driverType to car:', car.carId)
        // First car is owner, rest are unassigned
        return {
          ...car,
          driverType: index === 0 ? 'owner' as const : 'unassigned' as const
        }
      }
      return car
    })
    if (migratedCars.some((c, i) => c !== migrated.cars![i])) {
      migrated.cars = migratedCars
      needsUpdate = true
    }
  }
  
  // Migrate marketplace state
  if (!migrated.marketplaceListings) {
    console.log('[Migration] Adding marketplace state')
    migrated.marketplaceListings = []
    migrated.marketplaceLastRefreshWeek = 0
    migrated.marketplaceLastRefreshYear = 0
    needsUpdate = true
  }
  
  // Migrate manufacturer relationships
  if (!migrated.manufacturerRelationships) {
    console.log('[Migration] Adding manufacturer relationships')
    migrated.manufacturerRelationships = {}
    needsUpdate = true
  }
  
  // Migrate extended life simulation systems
  if (!migrated.messaging) {
    console.log('[Migration] Adding messaging state')
    migrated.messaging = createDefaultMessagingState()
    needsUpdate = true
  }
  
  if (!migrated.expandedHobbies) {
    console.log('[Migration] Adding expanded hobbies state')
    migrated.expandedHobbies = createDefaultExpandedHobbiesState()
    needsUpdate = true
  }
  
  if (!migrated.collections) {
    console.log('[Migration] Adding collections state')
    migrated.collections = createDefaultCollectionsState()
    needsUpdate = true
  }
  
  if (!migrated.socialMediaExpanded) {
    console.log('[Migration] Adding expanded social media state')
    migrated.socialMediaExpanded = createDefaultExpandedSocialMediaState()
    needsUpdate = true
  }
  
  if (!migrated.travel) {
    console.log('[Migration] Adding travel state')
    migrated.travel = createDefaultTravelState()
    needsUpdate = true
  }
  
  if (!migrated.retirement) {
    console.log('[Migration] Adding retirement state')
    migrated.retirement = createDefaultRetirementState()
    needsUpdate = true
  }
  
  // Fix personalLife brand values (should be 0-100, not large dollar amounts)
  if (migrated.personalLife?.brand) {
    const brand = migrated.personalLife.brand
    let brandNeedsUpdate = false
    
    // If brandValue > 100, it's using the old dollar-based system
    if (brand.brandValue > 100) {
      console.log('[Migration] Fixing personalLife.brand.brandValue from', brand.brandValue, 'to 0-100 scale')
      // Convert: rough estimate based on $500k = 25 (starting), $10M+ = 90+
      migrated.personalLife.brand.brandValue = Math.min(100, Math.max(10, Math.round(Math.log10(brand.brandValue) * 15 - 55)))
      brandNeedsUpdate = true
    }
    
    if (brand.publicImage > 100) {
      migrated.personalLife.brand.publicImage = Math.min(100, Math.max(10, brand.publicImage / 100))
      brandNeedsUpdate = true
    }
    
    if (brand.mediaPresence > 100) {
      migrated.personalLife.brand.mediaPresence = Math.min(100, Math.max(10, brand.mediaPresence / 100))
      brandNeedsUpdate = true
    }
    
    // Fix speaking fee if it's unreasonably high (should be $1k-$21k based on new formula)
    if (brand.speakingFee > 25000) {
      const newBrandValue = migrated.personalLife.brand.brandValue
      migrated.personalLife.brand.speakingFee = Math.round(1000 + (newBrandValue * 200))
      brandNeedsUpdate = true
    }
    
    if (brandNeedsUpdate) {
      console.log('[Migration] Fixed brand values:', migrated.personalLife.brand)
      needsUpdate = true
    }
  }
  
  // Migrate world staff pool - initialize if missing
  if (!migrated.worldStaffPool || migrated.worldStaffPool.length === 0) {
    console.log('[Migration] Initializing world staff pool')
    const currentYear = migrated.currentYear || new Date().getFullYear()
    const tier = migrated.ownedTeam?.tier || 'amateur'
    migrated.worldStaffPool = generateWorldStaffPool(currentYear, tier)
    needsUpdate = true
  }

  // Migrate existing facility staff to include gender and portraitId
  if (migrated.ownedTeam?.facilityStaff) {
    let staffMigrated = false
    migrated.ownedTeam.facilityStaff = migrated.ownedTeam.facilityStaff.map((staff: any) => {
      if (!staff.gender || !staff.portraitId) {
        staffMigrated = true
        const firstName = staff.name?.split(' ')[0] || 'Unknown'
        const gender = staff.gender || inferGenderFromName(firstName)
        const portraitId = staff.portraitId || getPortraitIdByGender(gender, staff.id || 'fallback')
        return { ...staff, gender, portraitId }
      }
      return staff
    })
    if (staffMigrated) {
      console.log('[Migration] Backfilled gender/portraitId on hired facility staff')
      needsUpdate = true
    }
  }

  // Migrate facility staff market to include gender and portraitId
  if (migrated.facilityStaffMarket && migrated.facilityStaffMarket.length > 0) {
    let marketMigrated = false
    migrated.facilityStaffMarket = migrated.facilityStaffMarket.map((staff: any) => {
      if (!staff.gender || !staff.portraitId) {
        marketMigrated = true
        const firstName = staff.name?.split(' ')[0] || 'Unknown'
        const gender = staff.gender || inferGenderFromName(firstName)
        const portraitId = staff.portraitId || getPortraitIdByGender(gender, staff.id || 'fallback')
        return { ...staff, gender, portraitId }
      }
      return staff
    })
    if (marketMigrated) {
      console.log('[Migration] Backfilled gender/portraitId on market staff')
      needsUpdate = true
    }
  }

  // Migrate messaging contacts - backfill bios for contacts without them
  if (migrated.messaging?.contacts && migrated.messaging.contacts.length > 0) {
    let contactsBioMigrated = false
    migrated.messaging.contacts = migrated.messaging.contacts.map((contact: any) => {
      if (!contact.bio) {
        contactsBioMigrated = true
        const bioContext: SocialBioContext = {
          name: contact.name || 'Unknown',
          age: 30, // Default age since contacts don't store age
          gender: contact.gender,
          traits: contact.traits || [],
          contactType: contact.type || 'friend',
          metAt: contact.metAt
        }
        return { ...contact, bio: generateFallbackSocialBio(bioContext) }
      }
      return contact
    })
    if (contactsBioMigrated) {
      console.log('[Migration] Backfilled bios on messaging contacts')
      needsUpdate = true
    }
  }

  // Migrate potential dates - backfill bios
  if (migrated.messaging?.potentialDates && migrated.messaging.potentialDates.length > 0) {
    let datesBioMigrated = false
    migrated.messaging.potentialDates = migrated.messaging.potentialDates.map((date: any) => {
      if (!date.bio) {
        datesBioMigrated = true
        const bioContext: SocialBioContext = {
          name: `${date.firstName || 'Unknown'} ${date.lastName || ''}`.trim(),
          age: date.age || 30,
          gender: date.gender,
          occupation: date.occupation,
          nationality: date.nationality,
          traits: date.traits || [],
          interests: date.interests || [],
          contactType: 'potential_date',
          metAt: date.metAt
        }
        return { ...date, bio: generateFallbackSocialBio(bioContext) }
      }
      return date
    })
    if (datesBioMigrated) {
      console.log('[Migration] Backfilled bios on potential dates')
      needsUpdate = true
    }
  }

  // Migrate partner - backfill bio
  if (migrated.personalLife?.family?.partner && !migrated.personalLife.family.partner.bio) {
    const partner = migrated.personalLife.family.partner
    const bioContext: SocialBioContext = {
      name: `${partner.firstName || 'Unknown'} ${partner.lastName || ''}`.trim(),
      age: partner.age || 30,
      nationality: partner.nationality,
      traits: partner.traits || [],
      contactType: 'partner',
      origin: partner.origin,
      career: partner.career
    }
    migrated.personalLife.family.partner = {
      ...partner,
      bio: generateFallbackSocialBio(bioContext)
    }
    console.log('[Migration] Backfilled bio on partner')
    needsUpdate = true
  }

  if (needsUpdate) {
    console.log('[Migration] Career state migrated')
  }
  
  return migrated
}

export const useCareerStore = create<CareerStore>()(
  persist(
    (set, get) => ({
      hasActiveCareer: false,
      player: null,
      careerState: null,
      
      // Staff Job Market state
      staffJobMarket: [],
      activeNegotiations: [],
      lastMarketRefresh: 0,

      createCareer: (player) => {
        console.log('[CareerStore] Creating career for', player.firstName, player.lastName)
        const startYear = new Date().getFullYear()
        // Calculate what day of week January 1st is (1=Mon, 7=Sun)
        const jan1 = new Date(startYear, 0, 1)
        const jan1DayOfWeek = jan1.getDay() === 0 ? 7 : jan1.getDay()
        
        set({
          hasActiveCareer: true,
          player,
          careerState: {
            ...initialCareerState,
            currentYear: startYear,
            currentDay: jan1DayOfWeek  // Start on actual Jan 1st weekday
          }
        })
        // Save to native database for reliable persistence
        setTimeout(() => {
          const state = useCareerStore.getState()
          console.log('[CareerStore] After createCareer:', { hasActiveCareer: state.hasActiveCareer })
          saveToNativeDB()
        }, 100)
      },

      updatePlayer: (updates) => {
        const { player } = get()
        if (player) {
          set({ player: { ...player, ...updates } })
        }
      },

      updateStats: (updates) => {
        const { player } = get()
        if (player) {
          set({
            player: {
              ...player,
              stats: { ...player.stats, ...updates }
            }
          })
        }
      },

      updateMentalState: (updates) => {
        const { player } = get()
        if (player) {
          set({
            player: {
              ...player,
              mentalState: { ...player.mentalState, ...updates }
            }
          })
        }
      },

      updateFinances: (updates) => {
        const { player } = get()
        if (player) {
          set({
            player: {
              ...player,
              finances: { ...player.finances, ...updates }
            }
          })
        }
      },

      addTransaction: (transaction) => {
        const { player, careerState } = get()
        if (player && careerState) {
          const newTransaction: FinancialTransaction = {
            ...transaction,
            id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            week: careerState.currentWeek,
            year: careerState.currentYear,
            date: new Date().toISOString()
          }
          
          const newBalance = transaction.type === 'income'
            ? player.finances.bankBalance + transaction.amount
            : player.finances.bankBalance - transaction.amount
          
          set({
            player: {
              ...player,
              finances: {
                ...player.finances,
                bankBalance: newBalance,
                transactions: [...player.finances.transactions, newTransaction]
              }
            }
          })
        }
      },

      updateCareerState: (updates) => {
        const { careerState } = get()
        if (careerState) {
          set({ careerState: { ...careerState, ...updates } })
        }
      },

      setOwnedTeam: (team) => {
        const { careerState } = get()
        if (careerState) {
          // Generate welcome email for new team
          const welcomeEmail = generateWelcomeEmail(team.name, careerState)
          
          set({ 
            careerState: { 
              ...careerState, 
              ownedTeam: team,
              emails: [{ ...welcomeEmail, id: `email_welcome_${team.id}` }, ...(careerState.emails || [])]
            } 
          })
        }
      },

      updateOwnedTeam: (updates) => {
        const { careerState } = get()
        if (careerState) {
          const current = careerState.ownedTeam || null
          set({ careerState: { ...careerState, ownedTeam: current ? { ...current, ...updates } : { ...(updates as OwnedTeam) } } })
        }
      },

      setSeriesEntries: (entries) => {
        const { careerState } = get()
        if (careerState) {
          set({ careerState: { ...careerState, seriesEntries: entries } })
        }
      },

      upsertSeriesEntry: (entry) => {
        const { careerState } = get()
        if (!careerState) return
        const existing = careerState.seriesEntries || []
        const idx = existing.findIndex(e => e.seriesId === entry.seriesId)
        const updated = idx >= 0
          ? existing.map(e => e.seriesId === entry.seriesId ? { ...e, ...entry } : e)
          : [...existing, entry]
        set({ careerState: { ...careerState, seriesEntries: updated } })
      },

      setCars: (cars) => {
        const { careerState } = get()
        if (careerState) {
          set({ careerState: { ...careerState, cars } })
        }
      },

      upsertCar: (car) => {
        const { careerState } = get()
        if (!careerState) return
        const existing = careerState.cars || []
        const idx = existing.findIndex(c => c.carId === car.carId)
        const updated = idx >= 0
          ? existing.map(c => c.carId === car.carId ? { ...c, ...car } : c)
          : [...existing, car]
        set({ careerState: { ...careerState, cars: updated } })
      },

      setBoardTargets: (targets) => {
        const { careerState } = get()
        if (careerState) {
          set({ careerState: { ...careerState, boardTargets: targets } })
        }
      },

      updateBoardTargetProgress: (id, progress) => {
        const { careerState } = get()
        if (!careerState) return
        const targets = careerState.boardTargets || []
        const updated = targets.map(t => t.id === id ? { ...t, ...progress } : t)
        set({ careerState: { ...careerState, boardTargets: updated } })
      },

      // ============================================
      // Series Entry & Car Acquisition (Owner mode)
      // ============================================
      
      enterSeries: (seriesId, seriesName, entryFee, manufacturerId) => {
        const { careerState } = get()
        if (!careerState?.ownedTeam) return false
        
        // Check budget
        if (careerState.ownedTeam.budgets.cash < entryFee) {
          console.log('[enterSeries] Insufficient funds:', careerState.ownedTeam.budgets.cash, '<', entryFee)
          return false
        }
        
        // Deduct entry fee
        const updatedBudgets = {
          ...careerState.ownedTeam.budgets,
          cash: careerState.ownedTeam.budgets.cash - entryFee
        }
        
        // Create series entry
        const newEntry: TeamSeriesEntry = {
          seriesId,
          seriesName,
          carCount: 0, // Will increase when cars are purchased
          entryFee,
          manufacturerId,
          worksCustomer: 'customer',
          status: 'active'
        }
        
        const existingEntries = careerState.seriesEntries || []
        
        set({
          careerState: {
            ...careerState,
            ownedTeam: { ...careerState.ownedTeam, budgets: updatedBudgets },
            seriesEntries: [...existingEntries, newEntry]
          }
        })
        
        // Add proper TeamTransaction record for entry fee
        const entryFeeTx: TeamTransaction = {
          id: `team_tx_${careerState.currentYear}_${careerState.currentWeek}_entry_${seriesId}`,
          date: new Date().toISOString(),
          week: careerState.currentWeek,
          year: careerState.currentYear,
          type: 'expense',
          category: 'entry_fee',
          amount: entryFee,
          description: `Series entry fee: ${seriesName}`,
          countsTowardCostCap: false
        }
        
        const teamAfterEntry = get().careerState?.ownedTeam
        if (teamAfterEntry) {
          set({
            careerState: {
              ...get().careerState!,
              ownedTeam: {
                ...teamAfterEntry,
                finances: {
                  ...teamAfterEntry.finances,
                  transactions: [...(teamAfterEntry.finances?.transactions || []), entryFeeTx]
                }
              }
            }
          })
        }
        
        console.log('[enterSeries] Entered series:', seriesName, 'Fee:', entryFee)
        return true
      },
      
      purchaseCar: (seriesId, liveryName, chassisId, engineId, cost, seriesName?: string, entryFee?: number) => {
        const { careerState } = get()
        if (!careerState?.ownedTeam) return false
        
        // Check if series entry exists
        let seriesEntry = (careerState.seriesEntries || []).find(e => e.seriesId === seriesId)
        const needsNewEntry = !seriesEntry
        
        // Calculate total cost (car + entry fee if new entry needed)
        const actualEntryFee = needsNewEntry ? (entryFee || 0) : 0
        const totalCost = cost + actualEntryFee
        
        // Check budget for total cost
        if (careerState.ownedTeam.budgets.cash < totalCost) {
          console.log('[purchaseCar] Insufficient funds:', careerState.ownedTeam.budgets.cash, '<', totalCost)
          return false
        }
        
        // Check if already at max cars for this series
        const existingCarsInSeries = (careerState.cars || []).filter(c => c.seriesId === seriesId)
        const maxCarsForSeries = getSeriesMaxTeamCars(seriesId)
        if (existingCarsInSeries.length >= maxCarsForSeries) {
          console.log('[purchaseCar] Max cars reached for series:', seriesId, `(${maxCarsForSeries} max)`)
          return false
        }
        
        // Deduct total cost
        const updatedBudgets = {
          ...careerState.ownedTeam.budgets,
          cash: careerState.ownedTeam.budgets.cash - totalCost
        }
        
        // Determine if this is car #1 (owner) or car #2 (for hired driver)
        const isFirstCar = existingCarsInSeries.length === 0
        
        // Create car with full marketplace-compatible structure
        const newCar: TeamCar = {
          carId: `car_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          seriesId,
          chassisId,
          engineId,
          liveryName,
          performance: 100,     // New car = full performance
          reliability: 100,     // New car = full reliability
          
          // Part wear (new car = minimal)
          partWear: {
            engine: 0,
            chassis: 0,
            gearbox: 0,
            brakes: 0,
            suspension: 0
          },
          mileage: 0,
          
          // Service & maintenance
          serviceHistory: [],
          installedUpgrades: [],
          upgradeQueue: [],
          
          // Purchase info
          purchasePrice: cost,
          purchaseType: 'new' as const,
          purchaseWeek: careerState.currentWeek,
          purchaseYear: careerState.currentYear,
          
          // Driver assignment
          driverType: isFirstCar ? 'owner' : 'unassigned'
        }
        
        // Create or update series entry
        let updatedEntries: TeamSeriesEntry[]
        if (needsNewEntry) {
          // Create new series entry
          const newEntry: TeamSeriesEntry = {
            seriesId,
            seriesName: seriesName || seriesId,
            carCount: 1,
            entryFee: actualEntryFee,
            worksCustomer: 'customer',
            status: 'active'
          }
          updatedEntries = [...(careerState.seriesEntries || []), newEntry]
          console.log('[purchaseCar] Created new series entry:', seriesName || seriesId)
        } else {
          // Update existing entry car count
          updatedEntries = (careerState.seriesEntries || []).map(e => 
            e.seriesId === seriesId 
              ? { ...e, carCount: e.carCount + 1 }
              : e
          )
        }
        
        const existingCars = careerState.cars || []
        
        set({
          careerState: {
            ...careerState,
            ownedTeam: { ...careerState.ownedTeam, budgets: updatedBudgets },
            seriesEntries: updatedEntries,
            cars: [...existingCars, newCar]
          }
        })
        
        // Add transaction for car purchase
        get().addTransaction({
          type: 'expense',
          category: 'equipment',
          amount: cost,
          description: `Car purchase: ${liveryName}`,
          date: new Date().toISOString(),
          week: careerState.currentWeek,
          year: careerState.currentYear
        })
        
        // Add separate transaction for entry fee if applicable
        if (needsNewEntry && actualEntryFee > 0) {
          get().addTransaction({
            type: 'expense',
            category: 'other',
            amount: actualEntryFee,
            description: `Series entry fee: ${seriesName || seriesId}`,
            date: new Date().toISOString(),
            week: careerState.currentWeek,
            year: careerState.currentYear
          })
        }
        
        console.log('[purchaseCar] Purchased car:', liveryName, 'Cost:', cost, needsNewEntry ? `+ Entry fee: ${actualEntryFee}` : '', 'Driver type:', newCar.driverType)
        
        // === NOTIFICATION INTEGRATION ===
        routeNotification({
          category: 'team_manager',
          subject: `New Car Acquired: ${liveryName}`,
          body: `A new car has been purchased for the team.\n\nChassis: ${chassisId}\nCost: $${cost.toLocaleString()}${needsNewEntry ? `\nEntry fee: $${actualEntryFee.toLocaleString()}` : ''}`,
          emailCategory: 'team',
        })
        return true
      },
      
      sellCar: (carId, refundAmount) => {
        const { careerState } = get()
        if (!careerState?.ownedTeam) return
        
        const car = (careerState.cars || []).find(c => c.carId === carId)
        if (!car) return
        
        // If car had a hired driver, release them
        if (car.driverType === 'hired' && car.hiredDriverId) {
          get().releaseHiredDriver(car.hiredDriverId)
        }
        
        // Remove car
        const updatedCars = (careerState.cars || []).filter(c => c.carId !== carId)
        
        // Update series entry car count
        const updatedEntries = (careerState.seriesEntries || []).map(e => 
          e.seriesId === car.seriesId 
            ? { ...e, carCount: Math.max(0, e.carCount - 1) }
            : e
        )
        
        // Add refund
        const updatedBudgets = {
          ...careerState.ownedTeam.budgets,
          cash: careerState.ownedTeam.budgets.cash + refundAmount
        }
        
        set({
          careerState: {
            ...careerState,
            ownedTeam: { ...careerState.ownedTeam, budgets: updatedBudgets },
            seriesEntries: updatedEntries,
            cars: updatedCars
          }
        })
        
        if (refundAmount > 0) {
          get().addTransaction({
            type: 'income',
            category: 'other',
            amount: refundAmount,
            description: `Car sale: ${car.liveryName || carId}`,
            date: new Date().toISOString(),
            week: careerState.currentWeek,
            year: careerState.currentYear
          })
        }
        
        console.log('[sellCar] Sold car:', carId, 'Refund:', refundAmount)
        
        // === NOTIFICATION INTEGRATION ===
        if (refundAmount > 0) {
          routeNotification({
            category: 'team_manager',
            subject: `Car Sold: ${car?.liveryName || carId}`,
            body: `${car?.liveryName || 'A team car'} has been sold. Proceeds: $${refundAmount.toLocaleString()}.`,
            emailCategory: 'team',
          })
        }
      },
      
      withdrawFromSeries: (seriesId) => {
        const { careerState } = get()
        if (!careerState) return
        
        // Remove all cars for this series
        const carsInSeries = (careerState.cars || []).filter(c => c.seriesId === seriesId)
        for (const car of carsInSeries) {
          get().sellCar(car.carId, 0) // No refund for withdrawal
        }
        
        // Remove series entry
        const updatedEntries = (careerState.seriesEntries || []).filter(e => e.seriesId !== seriesId)
        
        set({
          careerState: {
            ...careerState,
            seriesEntries: updatedEntries
          }
        })
        
        console.log('[withdrawFromSeries] Withdrew from series:', seriesId)
      },
      
      // ============================================
      // Roster Management (Owner mode)
      // ============================================
      
      signHiredDriver: (driverId, contract, carId) => {
        const { careerState } = get()
        if (!careerState?.ownedTeam) return false
        
        // Check if this driver is already hired
        const existingDriver = careerState.ownedTeam.drivers.find(d => d.driverId === driverId)
        if (existingDriver) {
          console.log('[signHiredDriver] Driver already hired:', driverId)
          return false
        }
        
        // Check if car exists and is unassigned
        const car = (careerState.cars || []).find(c => c.carId === carId)
        if (!car || car.driverType !== 'unassigned') {
          console.log('[signHiredDriver] Car not available:', carId)
          return false
        }
        
        // Check if another driver is already assigned to this car
        const carAlreadyAssigned = careerState.ownedTeam.drivers.some(d => d.carAssignment === carId)
        if (carAlreadyAssigned) {
          console.log('[signHiredDriver] Car already has a driver assigned:', carId)
          return false
        }
        
        // Calculate signing fee (1 month of salary)
        const signingFee = contract.salary
        if (careerState.ownedTeam.budgets.cash < signingFee) {
          console.log('[signHiredDriver] Insufficient funds for signing fee')
          return false
        }
        
        // Create hired driver with development tracking
        const newDriver: TeamDriver = {
          driverId,
          carAssignment: carId,
          contract,
          seasonStats: {
            races: 0,
            wins: 0,
            podiums: 0,
            points: 0,
            avgFinish: 0,
            bestFinish: 99,
            dnfs: 0
          },
          // Initialize development state
          development: {
            experiencePoints: 0,
            experienceLevel: 1,
            trainingProgram: null,
            trainingStartWeek: 0,
            trainingStartYear: 0,
            trainingProgress: 0,
            skillBoosts: {},
            recentRaceXP: []
          }
        }
        
        // Update car assignment
        const updatedCars = (careerState.cars || []).map(c => 
          c.carId === carId 
            ? { ...c, driverType: 'hired' as const, hiredDriverId: driverId }
            : c
        )
        
        // Deduct signing fee
        const updatedBudgets = {
          ...careerState.ownedTeam.budgets,
          cash: careerState.ownedTeam.budgets.cash - signingFee
        }
        
        set({
          careerState: {
            ...careerState,
            ownedTeam: {
              ...careerState.ownedTeam,
              budgets: updatedBudgets,
              drivers: [...careerState.ownedTeam.drivers, newDriver]
            },
            cars: updatedCars
          }
        })
        
        // Add transaction for signing fee
        get().addTransaction({
          type: 'expense',
          category: 'other',
          amount: signingFee,
          description: `Driver signing fee: ${driverId}`,
          date: new Date().toISOString(),
          week: careerState.currentWeek,
          year: careerState.currentYear
        })
        
        console.log('[signHiredDriver] Signed driver:', driverId, 'to car:', carId, '| Total hired drivers:', careerState.ownedTeam.drivers.length + 1)
        
        // === NOTIFICATION INTEGRATION ===
        routeNotification({
          category: 'team_manager',
          subject: `Driver Signed: ${driverId}`,
          body: `A new driver has been signed to the team and assigned to car ${carId}.`,
          emailCategory: 'team',
        })
        return true
      },
      
      releaseHiredDriver: (driverId) => {
        const { careerState } = get()
        if (!careerState?.ownedTeam) return
        
        const hiredDriver = careerState.ownedTeam.drivers.find(d => d.driverId === driverId)
        if (!hiredDriver) {
          console.log('[releaseHiredDriver] Driver not found:', driverId)
          return
        }
        
        // Check for buyout clause
        const buyoutCost = hiredDriver.contract.buyoutClause || 0
        let updatedBudgets = careerState.ownedTeam.budgets
        
        if (buyoutCost > 0 && careerState.ownedTeam.budgets.cash >= buyoutCost) {
          // Deduct buyout
          updatedBudgets = {
            ...careerState.ownedTeam.budgets,
            cash: careerState.ownedTeam.budgets.cash - buyoutCost
          }
          
          get().addTransaction({
            type: 'expense',
            category: 'other',
            amount: buyoutCost,
            description: `Driver buyout: ${driverId}`,
            date: new Date().toISOString(),
            week: careerState.currentWeek,
            year: careerState.currentYear
          })
        }
        
        // Update car assignment - unassign the car this driver was using
        const updatedCars = (careerState.cars || []).map(c => 
          c.hiredDriverId === driverId 
            ? { ...c, driverType: 'unassigned' as const, hiredDriverId: undefined }
            : c
        )
        
        // Remove driver from the team's driver list
        const updatedDrivers = careerState.ownedTeam.drivers.filter(d => d.driverId !== driverId)
        
        set({
          careerState: {
            ...careerState,
            ownedTeam: {
              ...careerState.ownedTeam,
              budgets: updatedBudgets,
              drivers: updatedDrivers
            },
            cars: updatedCars
          }
        })
        
        console.log('[releaseHiredDriver] Released driver:', driverId, '| Remaining drivers:', updatedDrivers.length)
        
        // === NOTIFICATION INTEGRATION ===
        routeNotification({
          category: 'team_manager',
          subject: `Driver Released: ${driverId}`,
          body: `A hired driver has been released from the team.${hiredDriver.contract?.buyoutClause ? ` Buyout processed.` : ''}`,
          emailCategory: 'team',
        })
      },
      
      updateHiredDriverContract: (driverId, updates) => {
        const { careerState } = get()
        if (!careerState?.ownedTeam) return
        
        const driverExists = careerState.ownedTeam.drivers.some(d => d.driverId === driverId)
        if (!driverExists) {
          console.log('[updateHiredDriverContract] Driver not found:', driverId)
          return
        }
        
        const updatedDrivers = careerState.ownedTeam.drivers.map(d => 
          d.driverId === driverId
            ? { ...d, contract: { ...d.contract, ...updates } }
            : d
        )
        
        set({
          careerState: {
            ...careerState,
            ownedTeam: { ...careerState.ownedTeam, drivers: updatedDrivers }
          }
        })
      },
      
      // ============================================
      // Driver Development - Training System
      // ============================================
      
      startDriverTraining: (driverId, programId) => {
        const { careerState } = get()
        if (!careerState?.ownedTeam) {
          return { success: false, error: 'No team' }
        }
        
        const driver = careerState.ownedTeam.drivers.find(d => d.driverId === driverId)
        if (!driver) {
          return { success: false, error: 'Driver not found' }
        }
        
        // Check if already training
        if (driver.development?.trainingProgram) {
          return { success: false, error: 'Driver is already in training' }
        }
        
        // Validate program
        const program = TRAINING_PROGRAMS[programId as TrainingProgram]
        if (!program) {
          return { success: false, error: 'Invalid training program' }
        }
        
        // Check if we can afford the weekly cost
        if (careerState.ownedTeam.budgets.cash < program.weeklyCost) {
          return { success: false, error: 'Insufficient funds for training' }
        }
        
        // Start training
        const updatedDrivers = careerState.ownedTeam.drivers.map(d => {
          if (d.driverId !== driverId) return d
          
          const currentDev = d.development || {
            experiencePoints: 0,
            experienceLevel: 1,
            trainingProgram: null,
            trainingStartWeek: 0,
            trainingStartYear: 0,
            trainingProgress: 0,
            skillBoosts: {},
            recentRaceXP: []
          }
          
          return {
            ...d,
            development: {
              ...currentDev,
              trainingProgram: programId,
              trainingStartWeek: careerState.currentWeek,
              trainingStartYear: careerState.currentYear,
              trainingProgress: 0
            }
          }
        })
        
        // Deduct first week's cost
        const updatedBudgets = {
          ...careerState.ownedTeam.budgets,
          cash: careerState.ownedTeam.budgets.cash - program.weeklyCost
        }
        
        set({
          careerState: {
            ...careerState,
            ownedTeam: {
              ...careerState.ownedTeam,
              budgets: updatedBudgets,
              drivers: updatedDrivers
            }
          }
        })
        
        // Add transaction
        get().addTransaction({
          type: 'expense',
          category: 'training',
          amount: program.weeklyCost,
          description: `${program.name} for ${driverId}`,
          date: new Date().toISOString(),
          week: careerState.currentWeek,
          year: careerState.currentYear
        })
        
        console.log(`[Training] Started ${program.name} for ${driverId} - $${program.weeklyCost}/week`)
        return { success: true }
      },
      
      cancelDriverTraining: (driverId) => {
        const { careerState } = get()
        if (!careerState?.ownedTeam) return
        
        const updatedDrivers = careerState.ownedTeam.drivers.map(d => {
          if (d.driverId !== driverId || !d.development) return d
          
          return {
            ...d,
            development: {
              ...d.development,
              trainingProgram: null,
              trainingProgress: 0,
              trainingStartWeek: 0,
              trainingStartYear: 0
            }
          }
        })
        
        set({
          careerState: {
            ...careerState,
            ownedTeam: {
              ...careerState.ownedTeam,
              drivers: updatedDrivers
            }
          }
        })
        
        console.log(`[Training] Cancelled training for ${driverId}`)
      },
      
      processDriverTrainingWeekly: () => {
        const { careerState } = get()
        if (!careerState?.ownedTeam) return
        
        let totalTrainingCost = 0
        const completedTraining: { driverId: string; program: string }[] = []
        
        const updatedDrivers = careerState.ownedTeam.drivers.map(driver => {
          if (!driver.development?.trainingProgram) return driver
          
          const program = TRAINING_PROGRAMS[driver.development.trainingProgram as TrainingProgram]
          if (!program) return driver
          
          // Calculate progress increment (100% / duration weeks)
          const progressIncrement = 100 / program.durationWeeks
          const newProgress = Math.min(100, driver.development.trainingProgress + progressIncrement)
          
          // Add weekly cost
          totalTrainingCost += program.weeklyCost
          
          // Check if training completed
          if (newProgress >= 100) {
            // Training complete! Apply skill gains
            const driverSatisfaction = driver.contract.satisfaction || 70
            const simFacilityLevel = careerState.ownedTeam?.facilities?.sim?.level ?? 1
            const hasRelevantFacility = program.facilityBonus === 'sim'
            
            const effectiveness = calculateTrainingEffectiveness(
              'peak', // Use peak for hired drivers by default
              driverSatisfaction,
              simFacilityLevel,
              hasRelevantFacility
            )
            
            const skillGains = calculateTrainingSkillGains(program, effectiveness)
            
            // Merge skill gains with existing boosts
            const existingBoosts = driver.development.skillBoosts || {}
            const newBoosts: Record<string, number> = { ...existingBoosts }
            for (const [skill, gain] of Object.entries(skillGains)) {
              newBoosts[skill] = (newBoosts[skill] || 0) + (gain || 0)
            }
            
            completedTraining.push({
              driverId: driver.driverId,
              program: program.name
            })
            
            console.log(`[Training] ${driver.driverId} completed ${program.name}:`, skillGains)
            
            return {
              ...driver,
              development: {
                ...driver.development,
                trainingProgram: null,
                trainingProgress: 0,
                trainingStartWeek: 0,
                trainingStartYear: 0,
                skillBoosts: newBoosts
              }
            }
          }
          
          // Training in progress
          return {
            ...driver,
            development: {
              ...driver.development,
              trainingProgress: newProgress
            }
          }
        })
        
        // Check if we can afford training costs
        let updatedBudgets = careerState.ownedTeam.budgets
        if (totalTrainingCost > 0) {
          if (updatedBudgets.cash < totalTrainingCost) {
            // Can't afford - cancel all training
            console.log(`[Training] Cannot afford weekly costs ($${totalTrainingCost}), cancelling all training`)
            const driversWithCancelledTraining = updatedDrivers.map(d => {
              if (!d.development?.trainingProgram) return d
              return {
                ...d,
                development: {
                  ...d.development,
                  trainingProgram: null,
                  trainingProgress: 0
                }
              }
            })
            
            set({
              careerState: {
                ...careerState,
                ownedTeam: {
                  ...careerState.ownedTeam,
                  drivers: driversWithCancelledTraining
                }
              }
            })
            return
          }
          
          updatedBudgets = {
            ...updatedBudgets,
            cash: updatedBudgets.cash - totalTrainingCost
          }
          
          // Add transaction
          get().addTransaction({
            type: 'expense',
            category: 'training',
            amount: totalTrainingCost,
            description: 'Driver training programs',
            date: new Date().toISOString(),
            week: careerState.currentWeek,
            year: careerState.currentYear
          })
        }
        
        set({
          careerState: {
            ...careerState,
            ownedTeam: {
              ...careerState.ownedTeam,
              budgets: updatedBudgets,
              drivers: updatedDrivers
            }
          }
        })
        
        if (completedTraining.length > 0) {
          console.log(`[Training] Completed programs this week:`, completedTraining)
          
          // Sync skill boosts to rivalStore for each completed training
          for (const completed of completedTraining) {
            const driver = updatedDrivers.find(d => d.driverId === completed.driverId)
            if (driver?.development?.skillBoosts) {
              // Update the rival driver's skills with accumulated boosts
              useRivalStore.getState().updateHiredDriverSkills(
                driver.driverId,
                driver.development.skillBoosts
              )
            }
          }
        }
      },
      
      getDriverDevelopmentState: (driverId) => {
        const { careerState } = get()
        const driver = careerState?.ownedTeam?.drivers.find(d => d.driverId === driverId)
        return driver?.development
      },
      
      hireStaff: (staff) => {
        const { careerState } = get()
        if (!careerState?.ownedTeam) return false
        
        // Check if role already filled
        const existingStaff = careerState.ownedTeam.staff.find(s => s.role === staff.role)
        if (existingStaff) {
          console.log('[hireStaff] Role already filled:', staff.role)
          return false
        }
        
        // Check budget for first month salary
        const firstMonthCost = staff.contract?.salary || 0
        if (firstMonthCost > 0 && careerState.ownedTeam.budgets.cash < firstMonthCost) {
          console.log('[hireStaff] Insufficient funds for first month salary')
          return false
        }
        
        // Deduct first month if applicable
        let updatedBudgets = careerState.ownedTeam.budgets
        if (firstMonthCost > 0) {
          updatedBudgets = {
            ...careerState.ownedTeam.budgets,
            cash: careerState.ownedTeam.budgets.cash - firstMonthCost
          }
          
          get().addTransaction({
            type: 'expense',
            category: 'other',
            amount: firstMonthCost,
            description: `Staff signing: ${staff.name} (${staff.role})`,
            date: new Date().toISOString(),
            week: careerState.currentWeek,
            year: careerState.currentYear
          })
        }
        
        set({
          careerState: {
            ...careerState,
            ownedTeam: {
              ...careerState.ownedTeam,
              budgets: updatedBudgets,
              staff: [...careerState.ownedTeam.staff, staff]
            }
          }
        })
        
        console.log('[hireStaff] Hired staff:', staff.name, 'Role:', staff.role)
        return true
      },
      
      releaseStaff: (staffId) => {
        const { careerState } = get()
        if (!careerState?.ownedTeam) return
        
        const staff = careerState.ownedTeam.staff.find(s => s.id === staffId)
        if (!staff) return
        
        // Check for buyout clause
        const buyoutCost = staff.contract?.buyoutClause || 0
        if (buyoutCost > 0 && careerState.ownedTeam.budgets.cash >= buyoutCost) {
          const updatedBudgets = {
            ...careerState.ownedTeam.budgets,
            cash: careerState.ownedTeam.budgets.cash - buyoutCost
          }
          
          get().addTransaction({
            type: 'expense',
            category: 'other',
            amount: buyoutCost,
            description: `Staff buyout: ${staff.name}`,
            date: new Date().toISOString(),
            week: careerState.currentWeek,
            year: careerState.currentYear
          })
          
          set({
            careerState: {
              ...careerState,
              ownedTeam: { ...careerState.ownedTeam, budgets: updatedBudgets }
            }
          })
        }
        
        set({
          careerState: {
            ...careerState,
            ownedTeam: {
              ...careerState.ownedTeam,
              staff: careerState.ownedTeam.staff.filter(s => s.id !== staffId)
            }
          }
        })
        
        console.log('[releaseStaff] Released staff:', staffId)
        
        // === NOTIFICATION INTEGRATION ===
        routeNotification({
          category: 'team_manager',
          subject: `Staff Released: ${staff.name}`,
          body: `${staff.name} (${staff.role.replace(/_/g, ' ')}) has been released from the team.${buyoutCost > 0 ? ` Buyout paid: $${buyoutCost.toLocaleString()}.` : ''}`,
          emailCategory: 'team',
        })
      },
      
      updateStaffContract: (staffId, updates) => {
        const { careerState } = get()
        if (!careerState?.ownedTeam) return
        
        const updatedStaff = careerState.ownedTeam.staff.map(s => 
          s.id === staffId 
            ? { ...s, contract: s.contract ? { ...s.contract, ...updates } : undefined }
            : s
        )
        
        set({
          careerState: {
            ...careerState,
            ownedTeam: { ...careerState.ownedTeam, staff: updatedStaff }
          }
        })
      },
      
      // ============================================
      // STAFF JOB MARKET FUNCTIONS
      // ============================================
      
      refreshStaffMarket: () => {
        const { staffJobMarket, lastMarketRefresh, careerState } = get()
        const currentWeek = careerState?.currentWeek || 1
        
        let newMarket: StaffCandidate[]
        if (staffJobMarket.length === 0) {
          // First time - generate fresh market
          newMarket = generateStaffMarket()
          console.log('[StaffMarket] Generated initial market with', newMarket.length, 'candidates')
        } else {
          // Refresh existing market
          newMarket = refreshMarketSimulation(staffJobMarket, currentWeek)
          console.log('[StaffMarket] Refreshed market, now has', newMarket.length, 'candidates')
        }
        
        set({
          staffJobMarket: newMarket,
          lastMarketRefresh: currentWeek
        })
      },
      
      startNegotiation: (candidateId, offer) => {
        const { staffJobMarket, activeNegotiations, careerState } = get()
        
        const candidate = staffJobMarket.find(c => c.id === candidateId)
        if (!candidate) {
          console.log('[StaffMarket] Candidate not found:', candidateId)
          return null
        }
        
        // Check if already negotiating with this candidate
        if (activeNegotiations.some(n => n.candidateId === candidateId && n.stage !== 'rejected' && n.stage !== 'accepted')) {
          console.log('[StaffMarket] Already negotiating with candidate:', candidateId)
          return null
        }
        
        const currentWeek = careerState?.currentWeek || 1
        let negotiation = initiateNegotiationSimulation(candidate, offer, currentWeek)
        
        // Process the initial offer
        negotiation = processNegotiationRound(negotiation, candidate, offer)
        
        set({
          activeNegotiations: [...activeNegotiations, negotiation]
        })
        
        console.log('[StaffMarket] Started negotiation with', candidate.name, 'Stage:', negotiation.stage)
        return negotiation
      },
      
      submitNegotiationOffer: (negotiationId, offer) => {
        const { activeNegotiations, staffJobMarket } = get()
        
        const negotiationIndex = activeNegotiations.findIndex(n => n.id === negotiationId)
        if (negotiationIndex === -1) {
          console.log('[StaffMarket] Negotiation not found:', negotiationId)
          return null
        }
        
        const negotiation = activeNegotiations[negotiationIndex]
        const candidate = staffJobMarket.find(c => c.id === negotiation.candidateId)
        if (!candidate) {
          console.log('[StaffMarket] Candidate no longer in market')
          return null
        }
        
        const updatedNegotiation = processNegotiationRound(negotiation, candidate, offer)
        
        const updatedNegotiations = [...activeNegotiations]
        updatedNegotiations[negotiationIndex] = updatedNegotiation
        
        set({ activeNegotiations: updatedNegotiations })
        
        console.log('[StaffMarket] Negotiation updated, Stage:', updatedNegotiation.stage, 'Mood:', updatedNegotiation.mood)
        return updatedNegotiation
      },
      
      acceptNegotiation: (negotiationId) => {
        const { activeNegotiations, staffJobMarket, careerState } = get()
        
        const negotiation = activeNegotiations.find(n => n.id === negotiationId)
        if (!negotiation || (negotiation.stage !== 'accepted' && negotiation.stage !== 'final')) {
          console.log('[StaffMarket] Cannot accept negotiation in current stage')
          return false
        }
        
        const candidate = staffJobMarket.find(c => c.id === negotiation.candidateId)
        if (!candidate) {
          console.log('[StaffMarket] Candidate no longer available')
          return false
        }
        
        // Create TeamStaff from candidate and offer
        const offer = negotiation.playerOffer
        const newStaff: TeamStaff = {
          id: candidate.id,
          name: candidate.name,
          role: candidate.role,
          nationality: candidate.nationality,
          skills: candidate.skills,
          morale: 70,
          fatigue: 0,
          contract: {
            salary: offer.salary,
            startYear: careerState?.currentYear || new Date().getFullYear(),
            endYear: (careerState?.currentYear || new Date().getFullYear()) + offer.contractLength,
            bonus: offer.performanceBonus,
            buyoutClause: offer.buyoutClause
          },
          specializations: candidate.specializations,
          personality: candidate.personality,
          experience: candidate.experience,
          age: candidate.age
        }
        
        // Use existing hireStaff function
        const success = get().hireStaff(newStaff)
        
        if (success) {
          // IMPORTANT: Get fresh state after hireStaff made its changes
          // Using stale careerState would overwrite the newly added staff!
          const freshState = get()
          const freshCareerState = freshState.careerState
          
          // Pay signing bonus using fresh state
          if (offer.signingBonus > 0 && freshCareerState?.ownedTeam) {
            get().addTransaction({
              type: 'expense',
              category: 'other',
              amount: offer.signingBonus,
              description: `Signing bonus for ${candidate.name}`,
              date: new Date().toISOString(),
              week: freshCareerState.currentWeek,
              year: freshCareerState.currentYear
            })
            
            // Get fresh state again after addTransaction
            const afterTransactionState = get().careerState
            if (afterTransactionState?.ownedTeam) {
              set({
                careerState: {
                  ...afterTransactionState,
                  ownedTeam: {
                    ...afterTransactionState.ownedTeam,
                    budgets: {
                      ...afterTransactionState.ownedTeam.budgets,
                      cash: afterTransactionState.ownedTeam.budgets.cash - offer.signingBonus
                    }
                  }
                }
              })
            }
          }
          
          // Remove candidate from market and update negotiation status
          // Get fresh state to preserve all changes
          const finalState = get()
          set({
            staffJobMarket: finalState.staffJobMarket.filter(c => c.id !== candidate.id),
            activeNegotiations: finalState.activeNegotiations.map(n => 
              n.id === negotiationId ? { ...n, stage: 'complete' as const } : n
            )
          })
          
          console.log('[StaffMarket] Hired', candidate.name, 'as', candidate.role)
        }
        
        return success
      },
      
      cancelNegotiation: (negotiationId) => {
        const { activeNegotiations } = get()
        
        set({
          activeNegotiations: activeNegotiations.filter(n => n.id !== negotiationId)
        })
        
        console.log('[StaffMarket] Cancelled negotiation:', negotiationId)
      },
      
      getCandidateById: (candidateId) => {
        const { staffJobMarket } = get()
        return staffJobMarket.find(c => c.id === candidateId)
      },
      
      getCandidateImpact: (candidateId) => {
        const { staffJobMarket, careerState } = get()
        
        const candidate = staffJobMarket.find(c => c.id === candidateId)
        if (!candidate) return null
        
        const existingStaff = careerState?.ownedTeam?.staff || []
        const teamMorale = careerState?.ownedTeam?.teamMorale || 50
        
        return calculateCandidateImpactSimulation(candidate, existingStaff, teamMorale)
      },
      
      // Facility Management
      upgradeFacility: (facilityType) => {
        const { careerState } = get()
        if (!careerState?.ownedTeam) return { success: false, error: 'No team found' }
        
        let facility = careerState.ownedTeam.facilities?.[facilityType]
        
        // Handle legacy format where facility might be just a number
        if (typeof facility === 'number') {
          facility = { level: facility, upgradeInProgress: false, assignedStaff: [] }
        }
        
        if (!facility) return { success: false, error: 'Facility not found' }
        
        // Ensure level is a valid number (default to 1 if undefined)
        const currentLevel = facility.level ?? 1
        
        if (facility.upgradeInProgress) {
          return { success: false, error: 'Upgrade already in progress' }
        }
        
        if (currentLevel >= MAX_FACILITY_LEVEL) {
          return { success: false, error: 'Facility already at maximum level' }
        }
        
        const tier = careerState.ownedTeam.tier || 'amateur'
        const upgradeCost = calculateFacilityUpgradeCost(facilityType, currentLevel, tier)
        const duration = getUpgradeDuration(facilityType, currentLevel)
        
        // Validate that costs are valid numbers
        if (isNaN(upgradeCost) || upgradeCost <= 0) {
          console.error(`[upgradeFacility] Invalid upgrade cost calculated: ${upgradeCost} for ${facilityType} level ${currentLevel}`)
          return { success: false, error: 'Unable to calculate upgrade cost' }
        }
        
        // Check if team can afford it (using budgets.cash, not finances.balance)
        const currentCash = careerState.ownedTeam.budgets?.cash ?? 0
        if (currentCash < upgradeCost) {
          return { success: false, error: `Insufficient funds. Need $${upgradeCost.toLocaleString()}, have $${currentCash.toLocaleString()}` }
        }
        
        // Deduct cost and start upgrade
        const completionWeek = careerState.currentWeek + duration
        const completionYear = careerState.currentYear + Math.floor((careerState.currentWeek + duration - 1) / 52)
        const adjustedCompletionWeek = ((completionWeek - 1) % 52) + 1
        
        // Create updated facility state (ensure proper FacilityState structure)
        const updatedFacility: FacilityState = {
          level: currentLevel,
          upgradeInProgress: true,
          upgradeStartWeek: careerState.currentWeek,
          upgradeStartYear: careerState.currentYear,
          upgradeCompletionWeek: adjustedCompletionWeek,
          upgradeCompletionYear: completionYear,
          assignedStaff: facility.assignedStaff || []
        }
        
        const updatedFacilities = {
          ...careerState.ownedTeam.facilities,
          [facilityType]: updatedFacility
        }
        
        const newCash = currentCash - upgradeCost
        
        // Add transaction record using createTeamTransaction
        const transaction = createTeamTransaction(
          'expense',
          'facilities',
          upgradeCost,
          `${facilityType.charAt(0).toUpperCase() + facilityType.slice(1)} facility upgrade (Level ${currentLevel} → ${currentLevel + 1})`,
          careerState.currentWeek,
          careerState.currentYear
        )
        
        set({
          careerState: {
            ...careerState,
            ownedTeam: {
              ...careerState.ownedTeam,
              facilities: updatedFacilities,
              budgets: {
                ...careerState.ownedTeam.budgets,
                cash: newCash
              },
              finances: {
                ...careerState.ownedTeam.finances!,
                transactions: [...(careerState.ownedTeam.finances?.transactions ?? []), transaction]
              }
            }
          }
        })
        
        console.log(`[upgradeFacility] Started upgrade for ${facilityType}: Level ${currentLevel} → ${currentLevel + 1}, Cost: $${upgradeCost}, Duration: ${duration} weeks`)
        return { success: true, duration }
      },
      
      completeUpgrade: (facilityType) => {
        const { careerState } = get()
        if (!careerState?.ownedTeam?.facilities) return
        
        const facility = careerState.ownedTeam.facilities[facilityType]
        if (!facility || !facility.upgradeInProgress) return
        
        const updatedFacilities = {
          ...careerState.ownedTeam.facilities,
          [facilityType]: {
            ...facility,
            level: facility.level + 1,
            upgradeInProgress: false,
            upgradeStartWeek: undefined,
            upgradeStartYear: undefined,
            upgradeCompletionWeek: undefined,
            upgradeCompletionYear: undefined
          }
        }
        
        set({
          careerState: {
            ...careerState,
            ownedTeam: {
              ...careerState.ownedTeam,
              facilities: updatedFacilities
            }
          }
        })
        
        console.log(`[completeUpgrade] ${facilityType} upgraded to Level ${facility.level + 1}`)
      },
      
      assignStaffToFacility: (staffId, facilityType) => {
        const { careerState } = get()
        if (!careerState?.ownedTeam) return { success: false, error: 'No team found' }
        
        const staff = careerState.ownedTeam.staff.find(s => s.id === staffId)
        if (!staff) return { success: false, error: 'Staff not found' }
        
        const facility = careerState.ownedTeam.facilities?.[facilityType]
        if (!facility) return { success: false, error: 'Facility not found' }
        
        // Check if staff is already assigned somewhere
        if (staff.assignedFacility) {
          return { success: false, error: 'Staff already assigned to a facility. Remove them first.' }
        }
        
        // Check if facility has room
        const maxSlots = getFacilityStaffSlots(facility.level)
        if (facility.assignedStaff.length >= maxSlots) {
          return { success: false, error: `Facility full. Max ${maxSlots} staff at level ${facility.level}` }
        }
        
        // Update staff and facility
        const updatedStaff = careerState.ownedTeam.staff.map(s =>
          s.id === staffId ? { ...s, assignedFacility: facilityType } : s
        )
        
        const updatedFacilities = {
          ...careerState.ownedTeam.facilities,
          [facilityType]: {
            ...facility,
            assignedStaff: [...facility.assignedStaff, staffId]
          }
        }
        
        set({
          careerState: {
            ...careerState,
            ownedTeam: {
              ...careerState.ownedTeam,
              staff: updatedStaff,
              facilities: updatedFacilities
            }
          }
        })
        
        console.log(`[assignStaffToFacility] Assigned ${staff.name} to ${facilityType}`)
        return { success: true }
      },
      
      removeStaffFromFacility: (staffId) => {
        const { careerState } = get()
        if (!careerState?.ownedTeam) return
        
        const staff = careerState.ownedTeam.staff.find(s => s.id === staffId)
        if (!staff || !staff.assignedFacility) return
        
        const facilityType = staff.assignedFacility
        const facility = careerState.ownedTeam.facilities?.[facilityType]
        if (!facility) return
        
        // Update staff and facility
        const updatedStaff = careerState.ownedTeam.staff.map(s =>
          s.id === staffId ? { ...s, assignedFacility: undefined } : s
        )
        
        const updatedFacilities = {
          ...careerState.ownedTeam.facilities,
          [facilityType]: {
            ...facility,
            assignedStaff: facility.assignedStaff.filter(id => id !== staffId)
          }
        }
        
        set({
          careerState: {
            ...careerState,
            ownedTeam: {
              ...careerState.ownedTeam,
              staff: updatedStaff,
              facilities: updatedFacilities
            }
          }
        })
        
        console.log(`[removeStaffFromFacility] Removed ${staff.name} from ${facilityType}`)
      },
      
      getFacilityBonus: (facilityType) => {
        const { careerState } = get()
        if (!careerState?.ownedTeam?.facilities) return 0
        
        const facility = careerState.ownedTeam.facilities[facilityType]
        if (!facility) return 0
        
        return getFacilityRDBonus(facility.level)
      },
      
      getFacilityEffectiveBonus: (facilityType) => {
        const { careerState } = get()
        if (!careerState?.ownedTeam?.facilities) return 0
        
        const facility = careerState.ownedTeam.facilities[facilityType]
        if (!facility) return 0
        
        const baseBonus = getFacilityRDBonus(facility.level)
        
        // Calculate staff contribution
        const assignedStaff = facility.assignedStaff
          .map(staffId => careerState.ownedTeam!.staff.find(s => s.id === staffId))
          .filter((s): s is NonNullable<typeof s> => !!s)
          .map(s => ({
            skills: s.skills,
            specializations: s.specializations,
            experience: s.experience
          }))
        
        const staffBonus = calculateStaffEffectivenessBonus(facilityType, assignedStaff)
        
        // Staff bonus is additive to the base bonus
        return baseBonus + staffBonus
      },
      
      calculateTotalFacilityOperationalCosts: () => {
        const { careerState } = get()
        if (!careerState?.ownedTeam?.facilities) return 0
        
        return calculateTotalFacilityWeeklyCosts(
          careerState.ownedTeam.facilities,
          careerState.ownedTeam.tier
        )
      },
      
      processFacilityUpgrades: () => {
        const { careerState, completeUpgrade } = get()
        if (!careerState?.ownedTeam?.facilities) return
        
        const facilityTypes = getAllFacilityTypes()
        
        for (const facilityType of facilityTypes) {
          const facility = careerState.ownedTeam.facilities[facilityType]
          if (facility?.upgradeInProgress) {
            // Check if upgrade is complete
            const isComplete = 
              (careerState.currentYear > (facility.upgradeCompletionYear ?? 0)) ||
              (careerState.currentYear === facility.upgradeCompletionYear && 
               careerState.currentWeek >= (facility.upgradeCompletionWeek ?? 0))
            
            if (isComplete) {
              completeUpgrade(facilityType)
              console.log(`[processFacilityUpgrades] Completed upgrade for ${facilityType}`)
              // === NOTIFICATION + CALENDAR INTEGRATION ===
              routeNotification({
                category: 'facility',
                subject: `Facility Upgrade Complete: ${facilityType}`,
                body: `The upgrade for your ${facilityType} facility has been completed! The improved facility is now operational and ready for use.`,
                emailCategory: 'team'
              })
              const { addPersonalCalendarEntry } = get()
              addPersonalCalendarEntry({
                name: `Facility Complete: ${facilityType}`,
                description: `${facilityType} facility upgrade completed`,
                activityId: 'facility_upgrade_progress',
                week: careerState.currentWeek,
                day: careerState.currentDay ?? 1,
                duration: 0,
                drainLevel: 'normal',
                calendarEntryType: 'team',
                category: 'team',
                immediate: true
              })
            }
          }
        }
      },
      
      // Roster helpers
      
      // Get all hired drivers
      getHiredDrivers: () => {
        const { careerState } = get()
        return careerState?.ownedTeam?.drivers || []
      },
      
      // Get a specific hired driver by their driver ID
      getHiredDriverById: (driverId) => {
        const { careerState } = get()
        return careerState?.ownedTeam?.drivers.find(d => d.driverId === driverId)
      },
      
      // Get the hired driver assigned to a specific car
      getHiredDriverForCar: (carId) => {
        const { careerState } = get()
        return careerState?.ownedTeam?.drivers.find(d => d.carAssignment === carId)
      },
      
      // Legacy: Get first hired driver (for backwards compatibility)
      getHiredDriver: () => {
        const { careerState } = get()
        return careerState?.ownedTeam?.drivers[0]
      },
      
      hasSecondCarSlot: () => {
        const { careerState } = get()
        if (!careerState?.cars) return false
        // Team has unassigned cars available (not just second car)
        return (careerState.cars || []).some(c => c.driverType === 'unassigned')
      },
      
      getStaffByRole: (role) => {
        const { careerState } = get()
        return careerState?.ownedTeam?.staff.find(s => s.role === role)
      },

      advanceWeek: () => {
        const { careerState, player } = get()
        if (careerState && player) {
          let newWeek = careerState.currentWeek + 1
          let newYear = careerState.currentYear
          let newAge = player.age
          let updatedPlayer = { ...player }
          let updatedCareerState = { ...careerState }
          
          // ============================================
          // Process Weekly Expenses
          // ============================================
          const currentSeries = player.currentSeriesId 
            ? useRivalStore.getState().getSeriesById(player.currentSeriesId)
            : undefined
          
          const expenseTransactions = processWeeklyExpenses(
            player,
            currentSeries,
            careerState.currentWeek,
            careerState.currentYear
          )
          
          // Apply expense transactions
          let newBalance = player.finances.bankBalance
          const newTransactions = [...player.finances.transactions]
          
          expenseTransactions.forEach(tx => {
            newBalance += tx.amount // amount is negative for expenses
            newTransactions.push({
              id: tx.id,
              date: new Date().toISOString(),
              week: tx.week,
              year: tx.year,
              type: tx.type,
              category: tx.category as FinancialTransaction['category'],
              amount: Math.abs(tx.amount), // Store as positive, type indicates expense
              description: tx.description
            })
          })
          
          updatedPlayer = {
            ...updatedPlayer,
            finances: {
              ...updatedPlayer.finances,
              bankBalance: newBalance,
              transactions: newTransactions
            }
          }
          
          console.log(`[CareerStore] Week ${careerState.currentWeek}: Processed ${expenseTransactions.length} expense transactions`)
          
          // ============================================
          // Process Owned Team Staff Salaries (weekly portion)
          // ============================================
          const ownedTeam = updatedCareerState.ownedTeam
          if (ownedTeam && ownedTeam.staff.length > 0) {
            let totalStaffCost = 0
            const staffCount = ownedTeam.staff.length
            
            ownedTeam.staff.forEach(staff => {
              if (staff.contract?.salary) {
                // Weekly portion of monthly salary (apply staff cost perk modifier)
                const baseWeeklySalary = Math.floor(staff.contract.salary / 4)
                const weeklySalary = applyStaffCostPerk(baseWeeklySalary)
                totalStaffCost += weeklySalary
              }
            })
            
            if (totalStaffCost > 0) {
              // Create proper transaction for cost cap tracking
              const staffSalaryTx: TeamTransaction = {
                id: `team_tx_${careerState.currentYear}_${careerState.currentWeek}_staff_salaries`,
                date: new Date().toISOString(),
                week: careerState.currentWeek,
                year: careerState.currentYear,
                type: 'expense',
                category: 'salaries',
                amount: totalStaffCost,
                description: `Staff salaries (${staffCount} members)`,
                countsTowardCostCap: true
              }
              
              // Use updateTeamBudgets for proper cost cap tracking
              const updatedStaffBudgets = updateTeamBudgets(ownedTeam.budgets, staffSalaryTx)
              
              updatedCareerState = {
                ...updatedCareerState,
                ownedTeam: {
                  ...ownedTeam,
                  budgets: updatedStaffBudgets,
                  finances: {
                    ...ownedTeam.finances,
                    transactions: [...ownedTeam.finances.transactions, staffSalaryTx]
                  }
                }
              }
              
              console.log(`[CareerStore] Week ${careerState.currentWeek}: Staff salaries -$${totalStaffCost} (cost cap tracked)`)
            }
          }
          
          // ============================================
          // Process Hired Driver Retainer (weekly portion of monthly retainer)
          // ============================================
          const teamForDriverSalary = updatedCareerState.ownedTeam
          if (teamForDriverSalary && teamForDriverSalary.drivers.length > 0) {
            const hiredDriver = teamForDriverSalary.drivers[0]
            const monthlyRetainer = hiredDriver?.contract?.monthlyRetainer || 0
            
            if (monthlyRetainer > 0) {
              // Weekly portion of monthly retainer
              const weeklyRetainer = Math.floor(monthlyRetainer / 4)
              
              // Create proper transaction for cost cap tracking
              const driverName = hiredDriver?.driverId || 'Hired Driver'
              const retainerTx: TeamTransaction = {
                id: `team_tx_${careerState.currentYear}_${careerState.currentWeek}_driver_retainer`,
                date: new Date().toISOString(),
                week: careerState.currentWeek,
                year: careerState.currentYear,
                type: 'expense',
                category: 'salaries',
                amount: weeklyRetainer,
                description: `Driver retainer - ${driverName}`,
                countsTowardCostCap: true
              }
              
              // Use updateTeamBudgets for proper cost cap tracking
              const updatedDriverBudgets = updateTeamBudgets(teamForDriverSalary.budgets, retainerTx)
              
              updatedCareerState = {
                ...updatedCareerState,
                ownedTeam: {
                  ...teamForDriverSalary,
                  budgets: updatedDriverBudgets,
                  finances: {
                    ...teamForDriverSalary.finances,
                    transactions: [...(teamForDriverSalary.finances?.transactions || []), retainerTx]
                  }
                }
              }
              
              console.log(`[CareerStore] Week ${careerState.currentWeek}: Driver retainer -$${weeklyRetainer} (cost cap tracked)`)
            }
          }
          
          // ============================================
          // Process Facility Staff Salaries (weekly)
          // ============================================
          const teamForFacilityStaff = updatedCareerState.ownedTeam
          if (teamForFacilityStaff && teamForFacilityStaff.facilityStaff && teamForFacilityStaff.facilityStaff.length > 0) {
            let totalFacilityStaffCost = 0
            const facilityStaffCount = teamForFacilityStaff.facilityStaff.length
            
            teamForFacilityStaff.facilityStaff.forEach(staff => {
              // Facility staff salaries are stored as weekly amounts
              totalFacilityStaffCost += staff.salary
            })
            
            if (totalFacilityStaffCost > 0) {
              // Create proper transaction for cost cap tracking
              const facilityStaffTx: TeamTransaction = {
                id: `team_tx_${careerState.currentYear}_${careerState.currentWeek}_facility_staff`,
                date: new Date().toISOString(),
                week: careerState.currentWeek,
                year: careerState.currentYear,
                type: 'expense',
                category: 'salaries',
                amount: totalFacilityStaffCost,
                description: `Facility staff salaries (${facilityStaffCount} members)`,
                countsTowardCostCap: true
              }
              
              // Use updateTeamBudgets for proper cost cap tracking
              const updatedFacilityStaffBudgets = updateTeamBudgets(teamForFacilityStaff.budgets, facilityStaffTx)
              
              updatedCareerState = {
                ...updatedCareerState,
                ownedTeam: {
                  ...teamForFacilityStaff,
                  budgets: updatedFacilityStaffBudgets,
                  finances: {
                    ...teamForFacilityStaff.finances,
                    transactions: [...(teamForFacilityStaff.finances?.transactions || []), facilityStaffTx]
                  }
                }
              }
              
              console.log(`[CareerStore] Week ${careerState.currentWeek}: Facility staff salaries -$${totalFacilityStaffCost} (cost cap tracked)`)
            }
          }
          
          // ============================================
          // Process Sponsor Payments (weekly portion with satisfaction modifier)
          // ============================================
          const activeSponsors = player.finances.sponsorDeals.filter(d => d.active)
          if (activeSponsors.length > 0) {
            let sponsorIncome = 0
            
            activeSponsors.forEach(sponsor => {
              // Calculate payment with satisfaction modifier
              const satisfaction = sponsor.satisfaction ?? 70
              const modifier = getPaymentModifier(satisfaction)
              const baseWeeklyPayment = Math.floor(sponsor.monthlyPayment / 4)
              const weeklyPayment = Math.floor(baseWeeklyPayment * modifier)
              
              sponsorIncome += weeklyPayment
              
              // Build description with modifier info if reduced
              let description = `${sponsor.sponsorName} Weekly Payment`
              if (modifier < 1.0) {
                description += ` (${Math.round(modifier * 100)}% - low satisfaction)`
              } else if (modifier > 1.0) {
                description += ` (+${Math.round((modifier - 1) * 100)}% - excellent satisfaction)`
              }
              
              newTransactions.push({
                id: `sponsor_${sponsor.id}_w${careerState.currentWeek}_${Date.now()}`,
                date: new Date().toISOString(),
                week: careerState.currentWeek,
                year: careerState.currentYear,
                type: 'income',
                category: 'sponsorship',
                amount: weeklyPayment,
                description
              })
            })
            
            updatedPlayer = {
              ...updatedPlayer,
              finances: {
                ...updatedPlayer.finances,
                bankBalance: updatedPlayer.finances.bankBalance + sponsorIncome,
                transactions: newTransactions
              }
            }
            
            console.log(`[CareerStore] Week ${careerState.currentWeek}: Sponsor income +$${sponsorIncome}`)
          }
          
          // ============================================
          // Process Team-Level Finances (Weekly)
          // ============================================
          if (updatedCareerState.ownedTeam?.finances) {
            const team = updatedCareerState.ownedTeam
            const teamTransactions: TeamTransaction[] = []
            let updatedTeamBudgets = { ...team.budgets }
            
            // 1. Process team sponsor weekly payments
            const sponsorResult = processTeamSponsorPayments(
              team,
              careerState.currentWeek,
              careerState.currentYear
            )
            teamTransactions.push(...sponsorResult.transactions)
            
            // 2. Process weekly facility costs (based on team tier)
            // Determine team tier from series entries or default to 'amateur'
            const teamTier: TeamTier = team.tier || 'amateur'
            const facilityCost = processWeeklyFacilityCosts(team, teamTier, careerState.currentWeek, careerState.currentYear)
            teamTransactions.push(facilityCost)
            
            // 3. Process weekly R&D costs (based on development focus)
            // Development intensity multiplier: 0.5 = low, 1.0 = normal, 1.5 = high, 2.0 = max
            const weeklyAllocation = updatedCareerState.teamDevelopment?.budget?.weeklyAllocation
            const devIntensity = weeklyAllocation && weeklyAllocation > 0
              ? Math.min(2.0, Math.max(0.5, weeklyAllocation / 50000)) // Normalize to 0.5-2x based on allocation
              : 1.0
            const devCost = processWeeklyDevelopmentCosts(team, teamTier, devIntensity, careerState.currentWeek, careerState.currentYear)
            teamTransactions.push(devCost)
            
            // 4. Process manufacturer payments (quarterly)
            const seriesEntries = updatedCareerState.seriesEntries || []
            if (seriesEntries.length > 0) {
              for (const entry of seriesEntries) {
                if (entry.manufacturerId) {
                  const mfrPayment = processManufacturerPayment(
                    team,
                    entry,
                    teamTier,
                    careerState.currentWeek,
                    careerState.currentYear
                  )
                  if (mfrPayment) {
                    teamTransactions.push(mfrPayment)
                  }
                }
              }
            }
            
            // 5. Process series revenue (TV/participation money)
            if (seriesEntries.length > 0) {
              const currentWeek = careerState.currentWeek
              const rivalStoreForRevenue = useRivalStore.getState()
              
              for (const entry of seriesEntries) {
                // Get series calendar to check race weeks and total races
                const seriesData = rivalStoreForRevenue.getSeriesById(entry.seriesId)
                const seriesCalendar = seriesData?.calendar || []
                const totalRaces = seriesCalendar.length
                
                // Check if current week is a race week for this series
                const isRaceWeek = seriesCalendar.some((race: { week: number }) => race.week === currentWeek)
                
                const seriesRevenue = processSeriesRevenue(
                  team,
                  entry,
                  teamTier,
                  careerState.currentWeek,
                  careerState.currentYear,
                  isRaceWeek,
                  totalRaces || 12
                )
                if (seriesRevenue) {
                  teamTransactions.push(seriesRevenue)
                }
              }
            }
            
            // 6. Process car maintenance costs
            {
              // Check if current week is a race week
              const currentWeek = careerState.currentWeek
              const rivalStoreForMaintenance = useRivalStore.getState()
              const isRaceWeekForMaintenance = seriesEntries.some(entry => {
                const seriesData = rivalStoreForMaintenance.getSeriesById(entry.seriesId)
                return seriesData?.calendar?.some((race: { week: number }) => race.week === currentWeek)
              })
              
              const maintenanceCost = processWeeklyCarMaintenance(
                team,
                teamTier,
                careerState.currentWeek,
                careerState.currentYear,
                isRaceWeekForMaintenance
              )
              if (maintenanceCost) {
                teamTransactions.push(maintenanceCost)
              }
            }
            
            // 7. Process race travel costs (on race weeks)
            {
              const currentWeekForTravel = careerState.currentWeek
              const rivalStoreForTravel = useRivalStore.getState()
              
              for (const entry of seriesEntries) {
                const seriesDataForTravel = rivalStoreForTravel.getSeriesById(entry.seriesId)
                const isRaceWeekForTravel = seriesDataForTravel?.calendar?.some(
                  (race: { week: number }) => race.week === currentWeekForTravel
                )
                
                if (isRaceWeekForTravel) {
                  // Calculate travel costs based on team HQ region vs race location
                  const travelCost = processRaceTravelCosts(
                    team,
                    entry,
                    teamTier,
                    currentWeekForTravel,
                    careerState.currentYear
                  )
                  
                  if (travelCost && travelCost.amount > 0) {
                    // Factor in car count - multiply by number of cars in this series
                    const carsInSeries = (updatedCareerState.cars || []).filter(
                      c => c.seriesId === entry.seriesId
                    ).length
                    if (carsInSeries > 1) {
                      travelCost.amount = Math.round(travelCost.amount * (1 + (carsInSeries - 1) * 0.6))
                      travelCost.description += ` (${carsInSeries} cars)`
                    }
                    
                    teamTransactions.push(travelCost)
                    console.log(`[Team Finances] Race travel costs for ${entry.seriesName}: -$${travelCost.amount.toLocaleString()}`)
                  }
                }
              }
            }
            
            // Apply all transactions to budget
            for (const tx of teamTransactions) {
              updatedTeamBudgets = updateTeamBudgets(updatedTeamBudgets, tx)
            }
            
            // Update team state
            updatedCareerState = {
              ...updatedCareerState,
              ownedTeam: {
                ...team,
                budgets: updatedTeamBudgets,
                finances: {
                  ...team.finances,
                  transactions: [...team.finances.transactions, ...teamTransactions],
                  sponsors: sponsorResult.updatedSponsors
                }
              }
            }
            
            // Log financial summary
            const income = teamTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
            const expenses = teamTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
            console.log(`[Team Finances] Week ${careerState.currentWeek}: Income +$${income.toLocaleString()}, Expenses -$${expenses.toLocaleString()}, Cash: $${updatedTeamBudgets.cash.toLocaleString()}`)
          }
          
          // ============================================
          // Process Extended Finances (Loans, Investments, Merchandise)
          // ============================================
          if (updatedCareerState.ownedTeam?.finances?.extended) {
            const team = updatedCareerState.ownedTeam
            const extended = team.finances.extended!
            let extendedTransactions: TeamTransaction[] = []
            let updatedExtended: ExtendedFinancialState = {
              loans: { ...extended.loans },
              investments: { ...extended.investments },
              merchandise: { ...extended.merchandise }
            }
            let updatedBudgets = { ...team.budgets }
            
            // 1. Process Loans (payments, interest, credit line fees)
            if (extended.loans) {
              const teamEquity = updatedBudgets.cash + (extended.investments?.portfolioValue || 0)
              const loansResult = processWeeklyLoans(
                extended.loans,
                updatedBudgets.cash,
                teamEquity,
                newWeek,
                newYear
              )
              
              extendedTransactions.push(...loansResult.transactions)
              updatedExtended.loans = loansResult.updatedLoans
              
              // Apply loan expenses to budget
              updatedBudgets.cash -= loansResult.totalExpenses
              
              if (loansResult.missedPayments > 0) {
                console.log(`[Loans] Week ${newWeek}: WARNING - ${loansResult.missedPayments} missed payment(s)!`)
                
                // === NOTIFICATION INTEGRATION ===
                routeNotification({
                  category: 'finances',
                  subject: `ALERT: ${loansResult.missedPayments} Missed Loan Payment(s)`,
                  body: `Your team missed ${loansResult.missedPayments} loan payment(s) this week due to insufficient cash.\n\nThis will damage your credit rating. Consecutive missed payments (3+) may trigger personal guarantees.\n\nCurrent team cash: $${updatedBudgets.cash.toLocaleString()}`,
                  emailCategory: 'team',
                  urgency: 'high'
                })
                
                // Check personal guarantees: if 3+ consecutive missed payments, trigger guarantees
                const guarantees = updatedCareerState.personalLife?.finances?.personalGuarantees || []
                const untriggeredGuarantees = guarantees.filter(g => !g.isTriggered)
                
                if (loansResult.missedPayments >= 3 && untriggeredGuarantees.length > 0) {
                  let totalGuaranteeClaimed = 0
                  const updatedGuarantees = guarantees.map(g => {
                    if (g.isTriggered) return g
                    
                    // Find the defaulted loan amount
                    const defaultedLoan = loansResult.updatedLoans.bankLoans?.find(
                      l => l.id === g.teamLoanId && l.status === 'defaulted'
                    )
                    
                    if (defaultedLoan) {
                      const result = triggerPersonalGuarantee(g, defaultedLoan.remainingBalance)
                      totalGuaranteeClaimed += result.amountClaimed
                      return { ...g, isTriggered: true, amountClaimed: result.amountClaimed }
                    }
                    return g
                  })
                  
                  if (totalGuaranteeClaimed > 0 && updatedCareerState.personalLife) {
                    updatedCareerState = {
                      ...updatedCareerState,
                      personalLife: {
                        ...updatedCareerState.personalLife,
                        finances: {
                          ...updatedCareerState.personalLife.finances,
                          liquidCash: updatedCareerState.personalLife.finances.liquidCash - totalGuaranteeClaimed,
                          personalGuarantees: updatedGuarantees,
                          transactions: [...updatedCareerState.personalLife.finances.transactions, {
                            id: `guarantee_claim_${newWeek}_${newYear}`,
                            date: { week: newWeek, year: newYear },
                            type: 'expense' as const,
                            category: 'other_expense' as const,
                            amount: -totalGuaranteeClaimed,
                            description: `Personal guarantee triggered - team loan default`,
                            taxDeductible: false
                          }]
                        }
                      }
                    }
                    // Apply guarantee amount to team's loan balance
                    updatedBudgets.cash += totalGuaranteeClaimed
                    console.log(`[Loans] Personal guarantee triggered: $${totalGuaranteeClaimed.toLocaleString()} claimed from personal funds`)
                    
                    // === NOTIFICATION INTEGRATION ===
                    routeNotification({
                      category: 'finances',
                      subject: `CRITICAL: Personal Guarantee Triggered`,
                      body: `Due to your team defaulting on loan payments, your personal guarantee has been triggered.\n\n**Amount claimed from personal funds: $${totalGuaranteeClaimed.toLocaleString()}**\n\nThis has been deducted from your personal savings. Seek additional funding immediately to prevent further defaults.`,
                      emailCategory: 'team',
                      urgency: 'high'
                    })
                  }
                }
              }
            }
            
            // 2. Process Investments (market updates, rental income, business revenue)
            if (extended.investments) {
              const investmentsResult = processWeeklyInvestments(
                extended.investments,
                newWeek,
                newYear
              )
              
              extendedTransactions.push(...investmentsResult.transactions)
              updatedExtended.investments = investmentsResult.updatedInvestments
              
              // Apply net investment income to budget
              updatedBudgets.cash += investmentsResult.totalIncome - investmentsResult.totalExpenses
              
              if (investmentsResult.totalIncome > 0) {
                console.log(`[Investments] Week ${newWeek}: Passive income +$${investmentsResult.totalIncome.toLocaleString()}`)
              }
            }
            
            // 3. Process Merchandise (sales, production, store costs)
            if (extended.merchandise) {
              // Build sales context from current state
              const teamMediaStateForMerch = updatedCareerState.teamMediaState
              const socialFollowers = teamMediaStateForMerch?.teamSocial?.followers || 1000
              const fanClubMembers = teamMediaStateForMerch?.fanClub?.members || 0
              const mediaScore = teamMediaStateForMerch?.mediaScore || 30
              
              // Check recent race performance from player's race history (last ~4 races)
              const playerHistory = updatedPlayer?.raceHistory || []
              // Get recent races from this year, sorted by date descending, take last 4
              const thisYearRaces = playerHistory.filter((r: RaceResult) => 
                new Date(r.date).getFullYear() === newYear
              )
              const recentResults = thisYearRaces.slice(-4) // Most recent 4 races
              const recentWins = recentResults.filter((r: RaceResult) => r.racePosition === 1).length
              const recentPodiums = recentResults.filter((r: RaceResult) => r.racePosition <= 3).length
              
              // Check if current week is a race week
              const rivalStoreForMerch = useRivalStore.getState()
              const seriesEntriesForMerch = updatedCareerState.seriesEntries || []
              const isRaceWeek = seriesEntriesForMerch.some(entry => {
                const seriesData = rivalStoreForMerch.getSeriesById(entry.seriesId)
                return seriesData?.calendar?.some((race: { week: number }) => race.week === newWeek)
              })
              
              const salesContext: SalesContext = {
                socialFollowers,
                fanClubMembers,
                recentWins,
                recentPodiums,
                mediaScore,
                isRaceWeek,
                seasonWeek: newWeek
              }
              
              const merchResult = processWeeklySales(
                extended.merchandise,
                salesContext,
                newWeek,
                newYear
              )
              
              extendedTransactions.push(...merchResult.transactions)
              updatedExtended.merchandise = merchResult.updatedState
              
              // Apply merch net to budget
              updatedBudgets.cash += merchResult.totalRevenue - merchResult.totalCosts
              
              if (merchResult.totalRevenue > 0) {
                console.log(`[Merchandise] Week ${newWeek}: Revenue +$${merchResult.totalRevenue.toLocaleString()}, Profit: $${(merchResult.totalRevenue - merchResult.totalCosts).toLocaleString()}`)
              }
            }
            
            // Update team with extended financial state
            updatedCareerState = {
              ...updatedCareerState,
              ownedTeam: {
                ...team,
                budgets: updatedBudgets,
                finances: {
                  ...team.finances,
                  transactions: [...team.finances.transactions, ...extendedTransactions],
                  extended: updatedExtended
                }
              }
            }
          }
          
          // ============================================
          // Process Sponsor Negotiations (Weekly)
          // ============================================
          if (updatedCareerState.ownedTeam?.finances) {
            const negotiationResult = processWeeklyNegotiations(
              updatedCareerState.ownedTeam,
              newWeek,
              newYear
            )
            
            // Update negotiations in team finances
            let allNegotiations = [
              ...negotiationResult.updatedNegotiations,
              ...negotiationResult.newApproaches
            ]
            
            // Add any new sponsor deals
            let teamSponsors = [...updatedCareerState.ownedTeam.finances.sponsors]
            for (const deal of negotiationResult.completedDeals) {
              teamSponsors.push(deal)
            }
            
            // Generate emails for negotiation events
            const newEmails: Email[] = []
            for (const emailEvent of negotiationResult.emailsToGenerate) {
              const negot = emailEvent.negotiation
              let subject = ''
              let body = ''
              let actionType: Email['actionType'] = undefined
              
              switch (emailEvent.type) {
                case 'outreach_response':
                  if (emailEvent.response === 'interested') {
                    subject = `RE: Partnership Inquiry - ${negot.sponsorName}`
                    body = `Thank you for your interest in partnering with ${negot.sponsorName}.\n\nWe have reviewed your proposal and would like to discuss a potential partnership further. Please find attached our initial offer for consideration.\n\nWe look forward to your response.`
                    actionType = 'negotiate_sponsor'
                  } else {
                    subject = `RE: Partnership Inquiry - ${negot.sponsorName}`
                    body = `Thank you for reaching out about a potential partnership with ${negot.sponsorName}.\n\nAfter careful consideration, we have decided not to pursue a partnership at this time. ${
                      emailEvent.response === 'soft_decline' 
                        ? 'We may reconsider in the future as your team continues to grow.'
                        : 'We wish you the best of luck in your endeavors.'
                    }`
                  }
                  break
                  
                case 'counter_response':
                  if (emailEvent.response === 'accept') {
                    subject = `Partnership Agreement Confirmed - ${negot.sponsorName}`
                    body = `We are pleased to confirm our partnership agreement!\n\nThe terms have been finalized and the contract is ready for signatures. Welcome to the ${negot.sponsorName} family.\n\nWe look forward to a successful partnership.`
                  } else if (emailEvent.response === 'counter') {
                    subject = `RE: Partnership Terms - ${negot.sponsorName}`
                    body = `Thank you for your counter proposal.\n\nAfter internal discussions, we have prepared an updated offer for your consideration. Please review the attached terms and let us know your decision.\n\nWe remain interested in reaching an agreement.`
                    actionType = 'review_counter'
                  } else {
                    subject = `Partnership Discussions Concluded - ${negot.sponsorName}`
                    body = `Unfortunately, we have been unable to reach mutually agreeable terms for a partnership.\n\nWe appreciate the time you have invested in these discussions and wish your team success in the upcoming season.`
                  }
                  break
                  
                case 'sponsor_approach':
                  subject = `Partnership Interest - ${negot.sponsorName}`
                  body = `${negot.sponsorName} has been following your team's progress and we are impressed with your performance.\n\nWe would like to discuss a potential sponsorship partnership. Please find attached our initial proposal for your consideration.\n\nWe hope to hear from you soon.`
                  actionType = 'negotiate_sponsor'
                  break
                  
                case 'negotiation_expired':
                  subject = `Partnership Inquiry Expired - ${negot.sponsorName}`
                  body = `The negotiation window for our partnership discussions has closed.\n\nIf you are still interested in partnering with ${negot.sponsorName}, please reach out again in the future.`
                  break
              }
              
              if (subject && body) {
                newEmails.push({
                  id: `email_neg_${negot.id}_${newWeek}_${Date.now()}`,
                  category: 'sponsor',
                  subject,
                  sender: negot.sponsorName,
                  senderRole: 'Sponsorship Manager',
                  preview: body.substring(0, 100),
                  body,
                  receivedDay: 1,  // Monday
                  receivedWeek: newWeek,
                  receivedYear: newYear,
                  read: false,
                  starred: false,
                  archived: false,
                  actionType,
                  actionData: actionType ? {
                    negotiationId: negot.id,
                    sponsorId: negot.sponsorId,
                    offerTerms: negot.currentOffer
                  } : undefined
                })
              }
            }
            
            // Update the owned team
            updatedCareerState = {
              ...updatedCareerState,
              ownedTeam: {
                ...updatedCareerState.ownedTeam,
                finances: {
                  ...updatedCareerState.ownedTeam.finances,
                  activeNegotiations: allNegotiations,
                  sponsors: teamSponsors
                }
              },
              emails: [...newEmails, ...(updatedCareerState.emails || [])]
            }
            
            // Log summary
            if (negotiationResult.newApproaches.length > 0) {
              console.log(`[Sponsor Negotiations] Week ${newWeek}: ${negotiationResult.newApproaches.length} new sponsor approach(es)`)
            }
            if (negotiationResult.completedDeals.length > 0) {
              console.log(`[Sponsor Negotiations] Week ${newWeek}: ${negotiationResult.completedDeals.length} deal(s) completed!`)
            }
            if (negotiationResult.emailsToGenerate.length > 0) {
              console.log(`[Sponsor Negotiations] Week ${newWeek}: ${negotiationResult.emailsToGenerate.length} negotiation email(s) generated`)
            }
          }
          
          // ============================================
          // Process Spare Parts Logistics (Weekly)
          // ============================================
          if (updatedCareerState.ownedTeam?.spareParts) {
            const team = updatedCareerState.ownedTeam
            const spareParts = team.spareParts!
            const manufacturingLevel = team.facilities?.manufacturing?.level || 1
            const hqRegion = 'europe' as any // Default HQ region for logistics
            const teamTierForParts = (team.tier || 'semi_pro') as any
            
            // Gather upcoming races for kit preparation
            const rivalStoreForParts = useRivalStore.getState()
            const seriesEntriesForParts = updatedCareerState.seriesEntries || []
            const upcomingRacesForParts: Array<{
              raceId: string
              raceName: string
              trackId: string
              raceWeek: number
              raceYear: number
              trackRegion: any
            }> = []
            
            for (const entry of seriesEntriesForParts) {
              const seriesData = rivalStoreForParts.getSeriesById(entry.seriesId)
              if (seriesData?.calendar) {
                for (const race of seriesData.calendar) {
                  if (race.week >= newWeek && race.week <= newWeek + 4) {
                    upcomingRacesForParts.push({
                      raceId: `${entry.seriesId}_${race.week}`,
                      raceName: race.trackName || `Race Week ${race.week}`,
                      trackId: race.trackId || '',
                      raceWeek: race.week,
                      raceYear: newYear,
                      trackRegion: race.country || hqRegion
                    })
                  }
                }
              }
            }
            
            const sparePartsResult = processWeeklySpareParts(
              spareParts,
              newWeek,
              newYear,
              manufacturingLevel,
              hqRegion,
              teamTierForParts,
              upcomingRacesForParts
            )
            
            // Calculate costs and deduct from team budget
            const sparePartsCosts = calculateWeeklySparePartsCosts(sparePartsResult)
            
            let updatedTeamBudgetsForParts = { ...team.budgets }
            const sparePartsTransactions: TeamTransaction[] = []
            
            if (sparePartsCosts.warehouseRental > 0) {
              updatedTeamBudgetsForParts.cash -= sparePartsCosts.warehouseRental
              sparePartsTransactions.push({
                id: `spare_warehouse_${newWeek}_${newYear}`,
                type: 'expense',
                category: 'facilities',
                amount: sparePartsCosts.warehouseRental,
                description: 'Warehouse rental costs',
                week: newWeek,
                year: newYear,
                date: new Date().toISOString(),
                countsTowardCostCap: true
              } as TeamTransaction)
            }
            
            if (sparePartsCosts.autoOrders > 0) {
              updatedTeamBudgetsForParts.cash -= sparePartsCosts.autoOrders
              sparePartsTransactions.push({
                id: `spare_orders_${newWeek}_${newYear}`,
                type: 'expense',
                category: 'car_maintenance',
                amount: sparePartsCosts.autoOrders,
                description: 'Spare parts auto-reorder costs',
                week: newWeek,
                year: newYear,
                date: new Date().toISOString(),
                countsTowardCostCap: true
              } as TeamTransaction)
            }
            
            updatedCareerState = {
              ...updatedCareerState,
              ownedTeam: {
                ...team,
                spareParts: sparePartsResult.updatedState,
                budgets: updatedTeamBudgetsForParts,
                finances: {
                  ...team.finances,
                  transactions: [...team.finances.transactions, ...sparePartsTransactions]
                }
              }
            }
            
            if (sparePartsCosts.total > 0) {
              console.log(`[Spare Parts] Week ${newWeek}: Costs -$${sparePartsCosts.total.toLocaleString()} (Warehouse: $${sparePartsCosts.warehouseRental.toLocaleString()}, Orders: $${sparePartsCosts.autoOrders.toLocaleString()})`)
            }
            
            // Log alerts
            sparePartsResult.alerts.forEach(alert => {
              console.log(`[Spare Parts] ${alert.severity.toUpperCase()}: ${alert.message}`)
            })
          }
          
          // ============================================
          // Process Personal Life (Weekly)
          // ============================================
          if (updatedCareerState.personalLife) {
            const personalLife = updatedCareerState.personalLife
            let updatedPersonalLife = { ...personalLife }
            
            // 1. Process Weekly Health
            // Estimate work hours based on activities (base ~45 hours, more during race weeks)
            const rivalStoreForRaceCheck = useRivalStore.getState()
            const seriesEntriesForHealth = updatedCareerState.seriesEntries || []
            const isRaceWeekForHealth = seriesEntriesForHealth.some(entry => {
              const seriesData = rivalStoreForRaceCheck.getSeriesById(entry.seriesId)
              return seriesData?.calendar?.some((race: { week: number }) => race.week === newWeek)
            })
            
            const workHours = isRaceWeekForHealth ? 60 : 45 // More hours during race weeks
            const qualityTimeHours = personalLife.partner ? 5 : 2 // More if has partner
            const exerciseHours = personalLife.hobbies.some(h => 
              h.type === 'golf' || h.type === 'fishing'
            ) ? 4 : 2
            
            const healthResult = processWeeklyHealth(
              personalLife.health,
              workHours,
              qualityTimeHours,
              exerciseHours,
              personalLife.lifestyleLevel,
              careerState.currentWeek,
              careerState.currentYear
            )
            
            updatedPersonalLife = {
              ...updatedPersonalLife,
              health: healthResult.updatedHealth
            }
            
            // Log health events
            if (healthResult.events.length > 0) {
              healthResult.events.forEach(event => {
                console.log(`[Personal Life] ${event}`)
              })
            }
            if (healthResult.newConditions.length > 0) {
              console.log(`[Personal Life] New health condition(s): ${healthResult.newConditions.map(c => c.name).join(', ')}`)
            }
            
            // 2. Process Weekly Personal Finances
            // Map lifestyle level to finance config compatible type (frugal -> modest)
            const financeLifestyleLevel = personalLife.lifestyleLevel === 'frugal' 
              ? 'modest' 
              : personalLife.lifestyleLevel as 'modest' | 'comfortable' | 'affluent' | 'luxury' | 'ultra_luxury'
            const financeResult = processWeeklyPersonalFinances(
              personalLife.finances,
              careerState.currentWeek,
              careerState.currentYear,
              financeLifestyleLevel
            )
            
            // Apply finance transactions
            let newLiquidCash = personalLife.finances.liquidCash
            for (const tx of financeResult.transactions) {
              newLiquidCash += tx.amount // amount is negative for expenses
            }
            
            // Also deduct personal staff salaries (weekly portion)
            const totalWeeklyStaffCost = personalLife.staff.reduce((sum, s) => sum + Math.floor(s.salary / 4), 0)
            newLiquidCash -= totalWeeklyStaffCost
            
            // Deduct hobby costs (weekly portion of monthly)
            const totalWeeklyHobbyCost = personalLife.hobbies.reduce((sum, h) => sum + Math.floor((h.currentMonthlyCost || h.annualCost / 12) / 4), 0)
            newLiquidCash -= totalWeeklyHobbyCost
            
            // Deduct healthcare costs (weekly portion of annual)
            const weeklyHealthcareCost = Math.floor(personalLife.health.annualHealthcareCost / 52)
            newLiquidCash -= weeklyHealthcareCost
            
            // Deduct privacy/security costs (weekly portion of monthly)
            const rawPrivacyForCost = updatedPersonalLife.brand.privacyLevel || 'balanced'
            const validPrivacyForCost = (['open_book', 'balanced', 'private', 'reclusive'].includes(rawPrivacyForCost) ? rawPrivacyForCost : 'balanced') as 'open_book' | 'balanced' | 'private' | 'reclusive'
            const privacyCostConfig = getPrivacyLevelConfig(validPrivacyForCost)
            const weeklyPrivacyCost = Math.floor(privacyCostConfig.monthlySecurityCost / 4)
            newLiquidCash -= weeklyPrivacyCost
            
            // ============================================
            // 2f. Process Personal INCOME (weekly portion of monthly income)
            // Owner salary, endorsements, dividends, rental, investments, speaking fees
            // ============================================
            const monthlyIncome = updatedPersonalLife.finances.monthlyIncome
            const incomeTransactions: typeof financeResult.transactions = []
            let totalWeeklyIncome = 0
            
            // Owner salary from team (weekly portion of monthly)
            const weeklyOwnerSalary = Math.floor((monthlyIncome.ownerSalary || 0) / 4)
            if (weeklyOwnerSalary > 0) {
              // Only pay if team has sufficient cash
              const teamForSalary = updatedCareerState.ownedTeam
              if (teamForSalary && teamForSalary.budgets.cash >= weeklyOwnerSalary) {
                totalWeeklyIncome += weeklyOwnerSalary
                incomeTransactions.push({
                  id: `personal_salary_${newWeek}_${careerState.currentYear}`,
                  type: 'income',
                  category: 'salary',
                  amount: weeklyOwnerSalary,
                  description: 'Weekly owner salary from team',
                  week: newWeek,
                  year: careerState.currentYear,
                  date: new Date().toISOString()
                } as any)
                
                // Deduct from team cash
                updatedCareerState = {
                  ...updatedCareerState,
                  ownedTeam: updatedCareerState.ownedTeam ? {
                    ...updatedCareerState.ownedTeam,
                    budgets: {
                      ...updatedCareerState.ownedTeam.budgets,
                      cash: updatedCareerState.ownedTeam.budgets.cash - weeklyOwnerSalary
                    }
                  } : updatedCareerState.ownedTeam
                }
              }
            }
            
            // Endorsement income (weekly portion of monthly)
            const weeklyEndorsementIncome = Math.floor((monthlyIncome.endorsements || 0) / 4)
            if (weeklyEndorsementIncome > 0) {
              totalWeeklyIncome += weeklyEndorsementIncome
              incomeTransactions.push({
                id: `personal_endorsement_${newWeek}_${careerState.currentYear}`,
                type: 'income',
                category: 'endorsement',
                amount: weeklyEndorsementIncome,
                description: 'Weekly endorsement income',
                week: newWeek,
                year: careerState.currentYear,
                date: new Date().toISOString()
              } as any)
            }
            
            // Dividend income (weekly portion of monthly)
            const weeklyDividendIncome = Math.floor((monthlyIncome.dividends || 0) / 4)
            if (weeklyDividendIncome > 0) {
              totalWeeklyIncome += weeklyDividendIncome
              incomeTransactions.push({
                id: `personal_dividends_${newWeek}_${careerState.currentYear}`,
                type: 'income',
                category: 'dividends',
                amount: weeklyDividendIncome,
                description: 'Weekly dividend income',
                week: newWeek,
                year: careerState.currentYear,
                date: new Date().toISOString()
              } as any)
            }
            
            // Rental income (weekly portion of monthly)
            const weeklyRentalIncome = Math.floor((monthlyIncome.rentalIncome || 0) / 4)
            if (weeklyRentalIncome > 0) {
              totalWeeklyIncome += weeklyRentalIncome
              incomeTransactions.push({
                id: `personal_rental_${newWeek}_${careerState.currentYear}`,
                type: 'income',
                category: 'rental_income',
                amount: weeklyRentalIncome,
                description: 'Weekly rental property income',
                week: newWeek,
                year: careerState.currentYear,
                date: new Date().toISOString()
              } as any)
            }
            
            // Investment income (weekly portion of monthly)
            const weeklyInvestmentIncome = Math.floor((monthlyIncome.investmentIncome || 0) / 4)
            if (weeklyInvestmentIncome > 0) {
              totalWeeklyIncome += weeklyInvestmentIncome
              incomeTransactions.push({
                id: `personal_investment_${newWeek}_${careerState.currentYear}`,
                type: 'income',
                category: 'investment_gain',
                amount: weeklyInvestmentIncome,
                description: 'Weekly investment income',
                week: newWeek,
                year: careerState.currentYear,
                date: new Date().toISOString()
              } as any)
            }
            
            // Speaking fees (weekly portion of monthly)
            const weeklySpeakingFees = Math.floor((monthlyIncome.speakingFees || 0) / 4)
            if (weeklySpeakingFees > 0) {
              totalWeeklyIncome += weeklySpeakingFees
              incomeTransactions.push({
                id: `personal_speaking_${newWeek}_${careerState.currentYear}`,
                type: 'income',
                category: 'speaking_fee',
                amount: weeklySpeakingFees,
                description: 'Weekly speaking engagement fees',
                week: newWeek,
                year: careerState.currentYear,
                date: new Date().toISOString()
              } as any)
            }
            
            // Other income (weekly portion of monthly)
            const weeklyOtherIncome = Math.floor((monthlyIncome.other || 0) / 4)
            if (weeklyOtherIncome > 0) {
              totalWeeklyIncome += weeklyOtherIncome
              incomeTransactions.push({
                id: `personal_other_${newWeek}_${careerState.currentYear}`,
                type: 'income',
                category: 'other',
                amount: weeklyOtherIncome,
                description: 'Weekly miscellaneous income',
                week: newWeek,
                year: careerState.currentYear,
                date: new Date().toISOString()
              } as any)
            }
            
            // Apply income to liquid cash
            newLiquidCash += totalWeeklyIncome
            
            if (totalWeeklyIncome > 0) {
              console.log(`[Personal Income] Week ${newWeek}: +$${totalWeeklyIncome.toLocaleString()} (Salary: $${weeklyOwnerSalary.toLocaleString()}, Endorsements: $${weeklyEndorsementIncome.toLocaleString()}, Dividends: $${weeklyDividendIncome.toLocaleString()}, Rental: $${weeklyRentalIncome.toLocaleString()}, Investments: $${weeklyInvestmentIncome.toLocaleString()}, Speaking: $${weeklySpeakingFees.toLocaleString()})`)
            }
            
            updatedPersonalLife = {
              ...updatedPersonalLife,
              finances: {
                ...updatedPersonalLife.finances,
                liquidCash: newLiquidCash,
                creditScore: financeResult.newCreditScore,
                personalLoans: financeResult.updatedLoans,
                mortgages: financeResult.updatedMortgages,
                transactions: [...updatedPersonalLife.finances.transactions, ...financeResult.transactions, ...incomeTransactions]
              }
            }
            
            // Log loan/mortgage updates
            if (financeResult.loansPaidOff.length > 0) {
              console.log(`[Personal Finances] Loans/mortgages paid off: ${financeResult.loansPaidOff.join(', ')}`)
            }
            
            // Log warnings
            if (financeResult.warnings.length > 0) {
              financeResult.warnings.forEach(warning => {
                console.log(`[Personal Finances] Warning: ${warning}`)
              })
            }
            
            const totalWeeklyExpenses = totalWeeklyStaffCost + totalWeeklyHobbyCost + weeklyHealthcareCost
            if (totalWeeklyExpenses > 0) {
              console.log(`[Personal Life] Week ${careerState.currentWeek}: Personal expenses -$${totalWeeklyExpenses.toLocaleString()} (Staff: $${totalWeeklyStaffCost}, Hobbies: $${totalWeeklyHobbyCost}, Healthcare: $${weeklyHealthcareCost})`)
            }
            
            // 2g. Process Divorce Obligations (alimony + child support, weekly portion)
            const divorceObl = updatedPersonalLife.finances.divorceObligations
            if (divorceObl) {
              // Check if obligations have expired
              const oblExpired = divorceObl.endDate && (
                newYear > divorceObl.endDate.year || 
                (newYear === divorceObl.endDate.year && newWeek > divorceObl.endDate.week)
              )
              
              if (oblExpired) {
                // Clear obligations
                updatedPersonalLife = {
                  ...updatedPersonalLife,
                  finances: {
                    ...updatedPersonalLife.finances,
                    divorceObligations: undefined
                  }
                }
                console.log(`[Personal Life] Divorce obligations expired.`)
              } else {
                const weeklyAlimony = Math.floor((divorceObl.alimonyMonthly || 0) / 4)
                const weeklyChildSupport = Math.floor((divorceObl.childSupportMonthly || 0) / 4)
                const totalWeeklyDivorce = weeklyAlimony + weeklyChildSupport
                
                if (totalWeeklyDivorce > 0) {
                  updatedPersonalLife = {
                    ...updatedPersonalLife,
                    finances: {
                      ...updatedPersonalLife.finances,
                      liquidCash: updatedPersonalLife.finances.liquidCash - totalWeeklyDivorce,
                      transactions: [...updatedPersonalLife.finances.transactions, {
                        id: `divorce_payments_${newWeek}_${careerState.currentYear}`,
                        date: { week: newWeek, year: careerState.currentYear },
                        type: 'expense' as const,
                        category: 'family_expense' as const,
                        amount: -totalWeeklyDivorce,
                        description: `Divorce payments (Alimony: $${weeklyAlimony.toLocaleString()}, Child support: $${weeklyChildSupport.toLocaleString()})`,
                        taxDeductible: true
                      }]
                    }
                  }
                  console.log(`[Personal Life] Divorce payments: -$${totalWeeklyDivorce.toLocaleString()} (Alimony: $${weeklyAlimony}, Child support: $${weeklyChildSupport})`)
                }
              }
            }
            
            // 2b. Process Lifestyle Assets (vehicles, furnishings, memberships)
            // Initialize lifestyle assets if missing (migration from old saves)
            const currentAssets = updatedPersonalLife.lifestyleAssets || createDefaultLifestyleAssets()
            const isMonthEnd = newWeek % 4 === 0
            
            const assetResult = processWeeklyAssets(
              currentAssets,
              newWeek,
              careerState.currentYear,
              isMonthEnd
            )
            
            // Deduct asset costs from liquid cash
            let assetAdjustedCash = updatedPersonalLife.finances.liquidCash - assetResult.totalCosts
            
            updatedPersonalLife = {
              ...updatedPersonalLife,
              lifestyleAssets: assetResult.updatedAssets,
              finances: {
                ...updatedPersonalLife.finances,
                liquidCash: assetAdjustedCash
              }
            }
            
            if (assetResult.totalCosts > 0) {
              console.log(`[Personal Life] Asset costs: -$${assetResult.totalCosts.toLocaleString()} (Vehicles: $${assetResult.costBreakdown.vehicleMaintenance + assetResult.costBreakdown.vehicleInsurance}, Memberships: $${assetResult.costBreakdown.membershipFees})`)
            }
            
            // Log asset events
            assetResult.events.forEach(event => {
              console.log(`[Personal Life] ${event}`)
            })
            
            // 2c. Calculate Lifestyle Score from Assets
            // Estimate primary residence value from furnishings (real estate system not fully integrated yet)
            const primaryResidenceValue = (assetResult.updatedAssets.furnishings || [])
              .reduce((sum: number, f: any) => sum + (f.currentValue || f.purchasePrice || 0), 0)
            // Get collections value from personal life collections state
            const collectionsValue = updatedPersonalLife.collections?.totalPortfolioValue || 0
            
            const lifestyleScoreResult = calculateLifestyleScore(
              primaryResidenceValue,
              assetResult.updatedAssets,
              collectionsValue,
              updatedPersonalLife.staff,
              updatedPersonalLife.hobbies
            )
            
            // Update lifestyle level based on calculated score
            updatedPersonalLife = {
              ...updatedPersonalLife,
              lifestyleLevel: lifestyleScoreResult.level,
              lifestyleScore: lifestyleScoreResult
            }
            
            // 3. Apply Lifestyle Bonuses to Brand
            const lifestyleTier = getLifestyleTier(updatedPersonalLife.lifestyleLevel)
            
            // Calculate total bonuses from staff
            const staffBenefits = personalLife.staff.reduce((acc, staff) => ({
              stressReduction: acc.stressReduction + (staff.benefits.stressReduction || 0),
              publicImageBonus: acc.publicImageBonus + (staff.benefits.publicImageBonus || 0)
            }), { stressReduction: 0, publicImageBonus: 0 })
            
            // Calculate total bonuses from hobbies
            const hobbyBenefits = calculateHobbyBenefits(personalLife.hobbies)
            
            // Apply stress reduction from staff
            if (staffBenefits.stressReduction > 0) {
              updatedPersonalLife = {
                ...updatedPersonalLife,
                health: {
                  ...updatedPersonalLife.health,
                  stressLevel: Math.max(0, updatedPersonalLife.health.stressLevel - staffBenefits.stressReduction * 0.2)
                }
              }
            }
            
            // 4. Process Weekly Brand (decay old reputation events)
            const updatedBrand = processWeeklyBrand(
              personalLife.brand,
              careerState.currentWeek,
              careerState.currentYear
            )
            
            // Apply lifestyle and hobby public image bonuses (gradual effect)
            const targetImageBonus = (lifestyleTier?.publicImageBonus || 0) + hobbyBenefits.totalPublicImageBonus + staffBenefits.publicImageBonus
            const currentImage = updatedBrand.publicImage
            const imageAdjustment = Math.sign(targetImageBonus) * Math.min(0.5, Math.abs(targetImageBonus) * 0.02) // Gradual change
            
            updatedPersonalLife = {
              ...updatedPersonalLife,
              brand: {
                ...updatedBrand,
                publicImage: Math.max(0, Math.min(100, currentImage + imageAdjustment))
              }
            }
            
            // -- Social Activity Log: collect entries during weekly processing --
            const socialLogEntries: SocialLogEntry[] = []
            const logId = () => `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
            const pushLog = (type: SocialLogType, title: string, description: string, impact?: 'positive' | 'negative' | 'neutral') => {
              socialLogEntries.push({ id: logId(), week: newWeek, year: careerState.currentYear, type, title, description, impact })
            }
            
            // 5. Process Weekly Social Circle (relationship decay)
            if ((updatedPersonalLife.contacts || []).length > 0) {
              updatedPersonalLife = {
                ...updatedPersonalLife,
                contacts: processWeeklySocialCircle(
                  updatedPersonalLife.contacts,
                  careerState.currentWeek,
                  careerState.currentYear
                )
              }
            }
            
            // 5b. Process Weekly Staff Satisfaction (morale, turnover checks)
            if ((updatedPersonalLife.staff || []).length > 0) {
              const staffResult = processWeeklyStaff(
                updatedPersonalLife.staff,
                newWeek,
                careerState.currentYear
              )
              updatedPersonalLife = {
                ...updatedPersonalLife,
                staff: staffResult.updatedStaff
              }
              // Log staff departures
              for (const quitter of staffResult.staffWhoQuit) {
                pushLog('event_attended', `Staff Departure: ${quitter.name}`, `Your ${quitter.role.replace('_', ' ')} has left due to low satisfaction.`, 'negative')
              }
              // Log other staff notifications
              for (const notification of staffResult.notifications) {
                pushLog('event_attended', 'Staff Update', notification, 'negative')
              }
            }
            
            // 6. Process Scheduled Social Events
            let totalEventCosts = 0
            const currentUpcomingEvents = updatedPersonalLife.upcomingEvents || []
            const eventsThisWeek = currentUpcomingEvents.filter(
              e => e.date.week === newWeek && e.date.year === (newWeek < careerState.currentWeek ? careerState.currentYear + 1 : careerState.currentYear)
            )
            const remainingEvents = currentUpcomingEvents.filter(
              e => !(e.date.week === newWeek && e.date.year === (newWeek < careerState.currentWeek ? careerState.currentYear + 1 : careerState.currentYear))
            )
            
            if (eventsThisWeek.length > 0) {
              let eventCashAdjustment = 0
              const newContactsFromEvents: ReturnType<typeof createSocialContact>[] = []
              let eventBrandUpdates = { ...updatedPersonalLife.brand }
              
              for (const event of eventsThisWeek) {
                const partnerPresent = !!updatedPersonalLife.partner
                
                if (event.isHosting) {
                  // Host the event
                  const hostResult = hostSocialEvent(
                    event,
                    event.cost,
                    event.expectedAttendeeTypes,
                    newWeek,
                    careerState.currentYear
                  )
                  
                  // Add reputation event instead of direct image change (gradual)
                  eventBrandUpdates = addReputationEvent(eventBrandUpdates, {
                    type: hostResult.success ? 'positive' : 'negative',
                    category: 'business',
                    description: hostResult.message,
                    impact: hostResult.reputationGain,
                    date: { week: newWeek, year: careerState.currentYear },
                    decayWeeks: 8
                  })
                  
                  // Generate contacts from networking
                  for (let i = 0; i < hostResult.newContacts; i++) {
                    const attendeeType = event.expectedAttendeeTypes[
                      Math.floor(Math.random() * event.expectedAttendeeTypes.length)
                    ] as any
                    const firstNames = ['Alexander', 'Victoria', 'Marcus', 'Elena', 'James', 'Sofia', 'Charles', 'Isabella', 'Richard', 'Valentina']
                    const lastNames = ['Sterling', 'DuPont', 'Rothschild', 'Nakamura', 'Okonkwo', 'Petrov', 'Vandenberg', 'Castellano', 'Ashworth', 'Lindström']
                    const randomName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
                    const newContact = createSocialContact(attendeeType, randomName, 25)
                    newContact.lastInteraction = { week: newWeek, year: careerState.currentYear }
                    newContactsFromEvents.push(newContact)
                  }
                  
                  // Deduct hosting costs
                  const hostingCost = hostResult.totalCost || event.cost || 0
                  if (hostingCost > 0) {
                    totalEventCosts += hostingCost
                  }
                  
                  console.log(`[Social Events] Hosted ${event.name}: ${hostResult.message} (Cost: $${hostingCost.toLocaleString()})`)
                  pushLog('event_attended', `Hosted: ${event.name}`, hostResult.message, hostResult.success ? 'positive' : 'negative')
                } else {
                  // Attend the event
                  const attendResult = attendSocialEvent(
                    event,
                    eventBrandUpdates.publicImage,
                    eventBrandUpdates,
                    partnerPresent
                  )
                  
                  // Add reputation event instead of direct image change (gradual)
                  eventBrandUpdates = addReputationEvent(eventBrandUpdates, {
                    type: attendResult.reputationChange >= 0 ? 'positive' : 'negative',
                    category: 'business',
                    description: attendResult.outcome.description,
                    impact: Math.round(attendResult.reputationChange * 0.5),
                    date: { week: newWeek, year: careerState.currentYear },
                    decayWeeks: 6
                  })
                  
                  // Generate contacts from outcome
                  for (const contact of attendResult.newContacts) {
                    const contactType = (contact.type || 'business_mogul') as any
                    const newContact = createSocialContact(contactType, contact.name, 30)
                    newContact.lastInteraction = { week: newWeek, year: careerState.currentYear }
                    newContactsFromEvents.push(newContact)
                  }
                  
                  // Apply stress change from event
                  updatedPersonalLife = {
                    ...updatedPersonalLife,
                    health: {
                      ...updatedPersonalLife.health,
                      stressLevel: Math.max(0, Math.min(100, updatedPersonalLife.health.stressLevel + event.effects.stressChange))
                    }
                  }
                  
                  // Deduct attendance costs
                  const attendanceCost = event.cost || 0
                  if (attendanceCost > 0) {
                    totalEventCosts += attendanceCost
                  }
                  
                  console.log(`[Social Events] Attended ${event.name}: ${attendResult.outcome.description} (Cost: $${attendanceCost.toLocaleString()})`)
                  pushLog('event_attended', `Attended: ${event.name}`, attendResult.outcome.description, attendResult.reputationChange >= 0 ? 'positive' : 'negative')
                }
              }
              
              // Merge new contacts (avoid duplicates by name)
              const existingContactNames = new Set((updatedPersonalLife.contacts || []).map(c => c.name))
              const uniqueNewContacts = newContactsFromEvents.filter(c => !existingContactNames.has(c.name))
              
              updatedPersonalLife = {
                ...updatedPersonalLife,
                brand: eventBrandUpdates,
                contacts: [...(updatedPersonalLife.contacts || []), ...uniqueNewContacts],
                upcomingEvents: remainingEvents,
                finances: {
                  ...updatedPersonalLife.finances,
                  liquidCash: updatedPersonalLife.finances.liquidCash + eventCashAdjustment - totalEventCosts,
                  transactions: totalEventCosts > 0 ? [...updatedPersonalLife.finances.transactions, {
                    id: `social_events_${newWeek}_${careerState.currentYear}`,
                    date: { week: newWeek, year: careerState.currentYear },
                    type: 'expense' as const,
                    category: 'lifestyle' as const,
                    amount: -totalEventCosts,
                    description: `Social event costs (${eventsThisWeek.length} events)`,
                    taxDeductible: false
                  }] : updatedPersonalLife.finances.transactions
                }
              }
              
              if (uniqueNewContacts.length > 0) {
                console.log(`[Social Events] Met ${uniqueNewContacts.length} new contact(s) at events this week`)
                for (const c of uniqueNewContacts) {
                  pushLog('contact_met', `New Contact: ${c.name}`, `Met ${c.name} (${c.type.replace(/_/g, ' ')}) at a social event`, 'positive')
                }
              }
            } else {
              updatedPersonalLife = {
                ...updatedPersonalLife,
                upcomingEvents: remainingEvents
              }
            }
            
            // 7. Automatic Event Invitation Generation
            // Every 2-4 weeks, roll for event invitations based on public image
            const publicImage = updatedPersonalLife.brand.publicImage || 35
            const brandValue = updatedPersonalLife.brand.brandValue || 25
            const invitationChance = (publicImage / 100) * 0.4 + (brandValue / 100) * 0.2 // 10-60% chance per week
            
            if (Math.random() < invitationChance && (updatedPersonalLife.upcomingEvents || []).length < 5 && newWeek % 2 === 0) {
              // Filter templates by reputation requirements
              const eligibleTemplates = SOCIAL_EVENT_TEMPLATES.filter(t => {
                const minRep = t.minimumReputation || 0
                return publicImage >= minRep * 0.8 // Can attend if within 80% of requirement
              })
              
              if (eligibleTemplates.length > 0) {
                // Bias toward better events with higher image
                const template = eligibleTemplates[Math.floor(Math.random() * eligibleTemplates.length)]
                const eventWeek = newWeek + 1 + Math.floor(Math.random() * 3) // 1-3 weeks ahead
                const eventYear = eventWeek > 52 ? careerState.currentYear + 1 : careerState.currentYear
                const adjustedWeek = eventWeek > 52 ? eventWeek - 52 : eventWeek
                
                const newEvent = {
                  ...template,
                  id: `event-auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  date: { week: adjustedWeek, year: eventYear },
                  isHosting: false // Invitations are always as attendee
                }
                
                updatedPersonalLife = {
                  ...updatedPersonalLife,
                  upcomingEvents: [...(updatedPersonalLife.upcomingEvents || []), newEvent]
                }
                
                console.log(`[Social Events] Received invitation to ${newEvent.name} (Week ${adjustedWeek})`)
                pushLog('invitation', `Invitation: ${newEvent.name}`, `You've been invited to ${newEvent.name} in Week ${adjustedWeek}`, 'neutral')
              }
            }
            
            // 8. Process Scandal Lifecycle
            const activeScandals = (updatedPersonalLife.scandals || []).filter(s => s.status !== 'resolved')
            if (activeScandals.length > 0) {
              // Map any legacy privacy level values to valid ones
              const rawPrivacy = updatedPersonalLife.brand.privacyLevel || 'balanced'
              const validPrivacy = (['open_book', 'balanced', 'private', 'reclusive'].includes(rawPrivacy) ? rawPrivacy : 'balanced') as 'open_book' | 'balanced' | 'private' | 'reclusive'
              const privacyConfig = getPrivacyLevelConfig(validPrivacy)
              
              const updatedScandals = (updatedPersonalLife.scandals || []).map(scandal => {
                if (scandal.status === 'resolved') return scandal
                const updated = processScandalWeek(scandal, privacyConfig, scandal.hasResponded)
                // Fix peakMediaWeek if transitioning to peak
                if (updated.status === 'peak' && !scandal.peakMediaWeek?.year) {
                  updated.peakMediaWeek = { week: newWeek, year: careerState.currentYear }
                }
                return updated
              })
              
              // Apply ongoing scandal effects
              const scandalEffects = calculateOngoingScandalEffects(updatedScandals)
              
              updatedPersonalLife = {
                ...updatedPersonalLife,
                scandals: updatedScandals,
                brand: {
                  ...updatedPersonalLife.brand,
                  publicImage: Math.max(0, updatedPersonalLife.brand.publicImage - scandalEffects.reputationDrain * 0.3)
                },
                health: {
                  ...updatedPersonalLife.health,
                  stressLevel: Math.min(100, updatedPersonalLife.health.stressLevel + scandalEffects.stressIncrease * 0.2)
                }
              }
              
              // Apply partner trust damage from scandals
              if (updatedPersonalLife.partner && scandalEffects.partnerTrustDamage > 0) {
                updatedPersonalLife = {
                  ...updatedPersonalLife,
                  partner: {
                    ...updatedPersonalLife.partner,
                    trustLevel: Math.max(0, updatedPersonalLife.partner.trustLevel - scandalEffects.partnerTrustDamage * 0.3)
                  }
                }
              }
              
              if (scandalEffects.reputationDrain > 0) {
                console.log(`[Scandals] Active scandals draining reputation: -${scandalEffects.reputationDrain.toFixed(1)}, stress +${scandalEffects.stressIncrease.toFixed(1)}`)
                pushLog('scandal_update', 'Scandal Impact', `Active scandals are hurting your reputation (-${scandalEffects.reputationDrain.toFixed(1)}) and increasing stress (+${scandalEffects.stressIncrease.toFixed(1)})`, 'negative')
              }
            }
            
            // 9. Random Scandal Generation
            // Higher public image = more media scrutiny = higher chance
            const scandalChanceBase = 0.005 // 0.5% base chance per week
            const imageScrutiny = (publicImage / 100) * 0.015 // Up to 1.5% extra at max image
            const privacyModifier = updatedPersonalLife.brand.privacyLevel === 'open_book' ? 0.02 :
                                    updatedPersonalLife.brand.privacyLevel === 'balanced' ? 0 :
                                    updatedPersonalLife.brand.privacyLevel === 'private' ? -0.005 :
                                    updatedPersonalLife.brand.privacyLevel === 'reclusive' ? -0.01 :
                                    0 // default
            const totalScandalChance = Math.max(0, scandalChanceBase + imageScrutiny + privacyModifier)
            const unresolvedScandalCount = (updatedPersonalLife.scandals || []).filter(s => s.status !== 'resolved').length
            
            if (Math.random() < totalScandalChance && unresolvedScandalCount < 2) {
              const scandalTypes: ScandalType[] = ['financial', 'cheating', 'personal', 'affair', 'substance', 'criminal', 'political', 'safety']
              // Filter out affair if no partner
              const eligibleTypes = updatedPersonalLife.partner 
                ? scandalTypes 
                : scandalTypes.filter(t => t !== 'affair')
              const randomType = eligibleTypes[Math.floor(Math.random() * eligibleTypes.length)]
              
              try {
                const hasEvidence = Math.random() < 0.3 // 30% chance of hard evidence
                const newScandal = createScandal(randomType, newWeek, careerState.currentYear, hasEvidence)
                
                updatedPersonalLife = {
                  ...updatedPersonalLife,
                  scandals: [...(updatedPersonalLife.scandals || []), newScandal]
                }
                
                console.log(`[Scandals] New scandal brewing: ${newScandal.name} (${newScandal.severity})`)
                pushLog('scandal_update', `New Scandal: ${newScandal.name}`, `A ${newScandal.severity} severity scandal has emerged: ${newScandal.description || newScandal.name}`, 'negative')
                // === PHONE NOTIFICATIONS FOR SCANDAL ===
                // Friends react
                routeNotification({
                  category: 'friends',
                  subject: 'Scandal alert',
                  body: `Hey, I just saw the news about "${newScandal.name}". Are you okay? Let me know if you need anything.`,
                })
                // Partner reacts if exists
                if (updatedPersonalLife.partner) {
                  routeNotification({
                    category: 'partner',
                    subject: 'We need to talk',
                    body: `I saw the story about "${newScandal.name}" online. We should talk about this. Call me when you can.`,
                  })
                }
                // PR team reacts via email
                routeNotification({
                  category: 'media_pr',
                  subject: `PR Alert: ${newScandal.name}`,
                  body: `A ${newScandal.severity} severity scandal has emerged: "${newScandal.name}". We need to discuss our response strategy immediately. Options include denial, apology, or no comment.`,
                  emailCategory: 'media',
                  urgency: 'high'
                })
              } catch (e) {
                // Template not found - skip
              }
            }
            
            // 10. Process Weekly Rivalries
            if ((updatedPersonalLife.rivalries || []).length > 0) {
              let updatedRivalries = processWeeklyRivalries(
                updatedPersonalLife.rivalries,
                newWeek,
                careerState.currentYear
              )
              
              // Random rivalry events for active rivalries
              updatedRivalries = updatedRivalries.map(rivalry => {
                if (!rivalry.isActive) return rivalry
                
                // 8% chance per week of a rivalry event
                if (Math.random() < 0.08) {
                  const eventIdx = Math.floor(Math.random() * RIVALRY_EVENTS.length)
                  const rivalryEvent = RIVALRY_EVENTS[eventIdx]
                  const isPublic = Math.random() < 0.5
                  
                  const updated = processRivalryEvent(
                    rivalry,
                    rivalryEvent.trigger,
                    isPublic,
                    newWeek,
                    careerState.currentYear
                  )
                  
                  console.log(`[Rivalries] ${rivalry.rivalName}: ${rivalryEvent.description}${isPublic ? ' (public)' : ''}`)
                  pushLog('rivalry_update', `Rivalry: ${rivalry.rivalName}`, `${rivalryEvent.description}${isPublic ? ' (covered by media)' : ''}`, isPublic ? 'negative' : 'neutral')
                  return updated
                }
                
                return rivalry
              })
              
              updatedPersonalLife = {
                ...updatedPersonalLife,
                rivalries: updatedRivalries
              }
            }
            
            // 11. Process Weekly Partner Relationship
            if (updatedPersonalLife.partner) {
              const partnerAttentionGiven = qualityTimeHours > 3 // Based on quality time
              const partnerTravelAway = isRaceWeekForHealth // Simplified: race weeks = travel
              
              const updatedPartner = processWeeklyRelationship(
                updatedPersonalLife.partner,
                partnerAttentionGiven,
                partnerTravelAway,
                updatedPersonalLife.health.stressLevel
              )
              
              updatedPersonalLife = {
                ...updatedPersonalLife,
                partner: updatedPartner
              }
              
              // Check for divorce trigger: if relationship has critically deteriorated
              const isMarried = updatedPartner.relationshipStatus === 'married'
              const isDating = updatedPartner.relationshipStatus === 'dating' || updatedPartner.relationshipStatus === 'engaged'
              const criticallyLow = updatedPartner.happiness < 15 && updatedPartner.loveLevel < 15 && updatedPartner.trustLevel < 20
              
              if (criticallyLow) {
                if (isMarried) {
                  // Trigger divorce with full financial settlement
                  console.log(`[Personal Life] Relationship critically deteriorated - triggering divorce from ${updatedPartner.firstName}`)
                  
                  const teamEquityValue = updatedPersonalLife.teamEquity 
                    ? updatedPersonalLife.teamEquity.currentValuation * (updatedPersonalLife.teamEquity.ownershipPercent / 100) 
                    : 0
                  const playerNetWorth = updatedPersonalLife.finances.liquidCash + teamEquityValue
                  
                  const marriageStartYear = updatedPartner.marriageDate?.year || careerState.currentYear
                  const marriageDuration = careerState.currentYear - marriageStartYear
                  const childrenCount = (updatedPersonalLife.children || []).filter(
                    c => updatedPartner.childrenIds?.includes(c.id)
                  ).length
                  
                  // Calculate settlement (no prenup stored on state, pass null)
                  const settlement = calculateDivorceSettlement(
                    updatedPartner,
                    playerNetWorth,
                    marriageDuration,
                    childrenCount,
                    null
                  )
                  
                  // Process the divorce
                  const divorceResult = processDivorce(
                    updatedPartner,
                    settlement,
                    newWeek,
                    careerState.currentYear
                  )
                  
                  // Apply one-time asset loss (percentage of liquid cash)
                  const assetLoss = Math.round(updatedPersonalLife.finances.liquidCash * divorceResult.oneTimeAssetLoss)
                  
                  updatedPersonalLife = {
                    ...updatedPersonalLife,
                    partner: divorceResult.exPartner,
                    finances: {
                      ...updatedPersonalLife.finances,
                      liquidCash: updatedPersonalLife.finances.liquidCash - assetLoss,
                      divorceObligations: {
                        alimonyMonthly: divorceResult.monthlyObligations.alimony,
                        childSupportMonthly: divorceResult.monthlyObligations.childSupport,
                        startDate: { week: newWeek, year: careerState.currentYear },
                        endDate: divorceResult.monthlyObligations.endDate
                      },
                      transactions: [...updatedPersonalLife.finances.transactions, {
                        id: `divorce_settlement_${newWeek}_${careerState.currentYear}`,
                        date: { week: newWeek, year: careerState.currentYear },
                        type: 'expense' as const,
                        category: 'family_expense' as const,
                        amount: -assetLoss,
                        description: `Divorce settlement - ${settlement.assetDivision}% asset division ($${assetLoss.toLocaleString()})`,
                        taxDeductible: false
                      }]
                    }
                  }
                  
                  console.log(`[Personal Life] DIVORCE: Lost $${assetLoss.toLocaleString()} in settlement. Alimony: $${divorceResult.monthlyObligations.alimony}/mo, Child support: $${divorceResult.monthlyObligations.childSupport}/mo`)
                } else if (isDating) {
                  // Dating/engaged breakup - no financial consequences, just remove partner
                  console.log(`[Personal Life] Relationship ended with ${updatedPartner.firstName} (breakup - not married, no financial obligations)`)
                  updatedPersonalLife = {
                    ...updatedPersonalLife,
                    partner: undefined
                  }
                }
              }
            }
            
            // 12. Process Weekly Family (children)
            if ((updatedPersonalLife.children || []).length > 0 && updatedPersonalLife.familyTree) {
              const familyResult = processWeeklyFamily(
                updatedPersonalLife.children,
                updatedPersonalLife.familyTree,
                newWeek,
                careerState.currentYear
              )
              
              // Deduct child costs
              updatedPersonalLife = {
                ...updatedPersonalLife,
                children: familyResult.updatedChildren,
                familyTree: familyResult.updatedTree,
                finances: {
                  ...updatedPersonalLife.finances,
                  liquidCash: updatedPersonalLife.finances.liquidCash - familyResult.monthlyChildCosts
                }
              }
              
              if (familyResult.events.length > 0) {
                familyResult.events.forEach(evt => console.log(`[Family] ${evt}`))
              }
            }
            
            // 13. Process Philanthropy (gradual growth + annual processing)
            const foundations = updatedPersonalLife.foundations || []
            if (foundations.length > 0) {
              // Weekly: gradual impact and awareness growth
              const updatedFoundations = foundations.map(f => {
                // Gradual impact score growth (slow, based on total donated)
                const impactGrowth = f.totalDonated > 0 ? Math.min(0.1, f.totalDonated / 5000000) : 0
                
                // Gradual public awareness growth  
                const awarenessGrowth = f.totalDonated > 100000 ? 0.05 : 0
                
                return {
                  ...f,
                  impactScore: Math.min(100, f.impactScore + impactGrowth),
                  publicAwareness: Math.min(100, f.publicAwareness + awarenessGrowth)
                }
              })
              
              updatedPersonalLife = {
                ...updatedPersonalLife,
                foundations: updatedFoundations
              }
              
              // Annual processing at year start (week 1)
              if (newWeek === 1) {
                const totalDonationsThisYear = updatedPersonalLife.finances.taxDeductionsThisYear || 0
                const annualResult = processAnnualPhilanthropy(
                  updatedPersonalLife.foundations,
                  totalDonationsThisYear
                )
                
                // Add reputation event for annual philanthropy
                let philBrand = updatedPersonalLife.brand
                if (annualResult.reputationGain > 0) {
                  philBrand = addReputationEvent(philBrand, {
                    type: 'positive',
                    category: 'charity',
                    description: `Your charitable foundations made a significant impact this year (+${annualResult.reputationGain} reputation)`,
                    impact: annualResult.reputationGain,
                    date: { week: newWeek, year: careerState.currentYear },
                    decayWeeks: 12
                  })
                }
                
                updatedPersonalLife = {
                  ...updatedPersonalLife,
                  foundations: annualResult.updatedFoundations,
                  brand: philBrand,
                  finances: {
                    ...updatedPersonalLife.finances,
                    taxDeductionsThisYear: 0 // Reset for new year
                  }
                }
                
                console.log(`[Philanthropy] Annual review: Tax deduction $${annualResult.totalTaxDeduction.toLocaleString()}, Reputation +${annualResult.reputationGain}`)
                pushLog('philanthropy', 'Annual Philanthropy Review', `Your foundations earned a $${annualResult.totalTaxDeduction.toLocaleString()} tax deduction and +${annualResult.reputationGain} reputation`, annualResult.reputationGain > 0 ? 'positive' : 'neutral')
              }
              
              // Periodic reputation events from foundations (every ~8 weeks)
              if (newWeek % 8 === 0 && foundations.length > 0) {
                const topFoundation = foundations.reduce((best, f) => f.impactScore > best.impactScore ? f : best, foundations[0])
                if (topFoundation.impactScore > 30) {
                  const messages = [
                    `Your ${topFoundation.name} helped hundreds of people this quarter`,
                    `${topFoundation.name} recognized for community impact`,
                    `Local media coverage of ${topFoundation.name}'s work`,
                    `${topFoundation.name} reaches new milestone in charitable giving`
                  ]
                  const msg = messages[Math.floor(Math.random() * messages.length)]
                  
                  let foundationBrand = updatedPersonalLife.brand
                  foundationBrand = addReputationEvent(foundationBrand, {
                    type: 'positive',
                    category: 'charity',
                    description: msg,
                    impact: Math.round(topFoundation.impactScore / 20),
                    date: { week: newWeek, year: careerState.currentYear },
                    decayWeeks: 4
                  })
                  
                  updatedPersonalLife = {
                    ...updatedPersonalLife,
                    brand: foundationBrand
                  }
                  
                  console.log(`[Philanthropy] ${msg}`)
                  pushLog('philanthropy', topFoundation.name, msg, 'positive')
                }
              }
            }
            
            // 14. Process Annual Endorsements (at year start)
            if (newWeek === 1 && (updatedPersonalLife.brand.endorsements || []).length > 0) {
              const endorseResult = processAnnualEndorsements(updatedPersonalLife.brand)
              
              // Log expired endorsements
              for (const expired of endorseResult.expiredDeals) {
                pushLog('endorsement', `Endorsement Expired: ${expired}`, `Your endorsement deal with ${expired} has ended`, 'negative')
                
                // Check for renewal: if public image still high enough, offer renewal
                const originalDeal = updatedPersonalLife.brand.endorsements.find(e => e.brandName === expired)
                if (originalDeal) {
                  const publicImg = updatedPersonalLife.brand.publicImage || 35
                  if (publicImg >= originalDeal.minimumPublicImage) {
                    // Generate renewal offer at 80-120% of original value
                    const renewalMultiplier = 0.8 + Math.random() * 0.4
                    const renewalValue = Math.round(originalDeal.annualValue * renewalMultiplier)
                    const renewalEndorsement = {
                      ...originalDeal,
                      id: `endorsement-renewal-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                      annualValue: renewalValue,
                      yearsRemaining: originalDeal.durationYears,
                      durationYears: originalDeal.durationYears
                    }
                    
                    // Add renewal back to endorsements
                    endorseResult.updatedBrand = {
                      ...endorseResult.updatedBrand,
                      endorsements: [...endorseResult.updatedBrand.endorsements, renewalEndorsement]
                    }
                    
                    pushLog('endorsement', `Endorsement Renewed: ${expired}`, `${expired} renewed your deal at $${renewalValue.toLocaleString()}/year (${renewalMultiplier >= 1 ? 'raised' : 'reduced'})`, 'positive')
                    
                    console.log(`[Endorsements] ${expired} renewed at $${renewalValue.toLocaleString()}/year`)
                  } else {
                    console.log(`[Endorsements] ${expired} declined renewal (public image too low: ${publicImg} < ${originalDeal.minimumPublicImage})`)
                  }
                }
              }
              
              // Recalculate total endorsement income
              const newEndorsementIncome = endorseResult.updatedBrand.endorsements.reduce(
                (sum, e) => sum + Math.floor(e.annualValue / 12), 0
              )
              
              updatedPersonalLife = {
                ...updatedPersonalLife,
                brand: endorseResult.updatedBrand,
                finances: {
                  ...updatedPersonalLife.finances,
                  monthlyIncome: {
                    ...updatedPersonalLife.finances.monthlyIncome,
                    endorsements: newEndorsementIncome
                  }
                }
              }
              
              if (endorseResult.expiredDeals.length > 0) {
                console.log(`[Endorsements] Annual review: ${endorseResult.expiredDeals.length} deal(s) expired, total income $${endorseResult.totalIncome.toLocaleString()}`)
              }
            }
            
            // 15. Dynamic Social Media Following
            {
              const currentFollowing = updatedPersonalLife.brand.socialMediaFollowing || 10000
              const currentPublicImage = updatedPersonalLife.brand.publicImage || 35
              
              // Base weekly growth from public image (higher image = more growth)
              let weeklyGrowth = Math.floor(currentPublicImage * 50 * (currentFollowing / 100000 + 0.5))
              
              // Event attendance boosts (count events this week)
              const eventsThisWeekCount = eventsThisWeek?.length || 0
              weeklyGrowth += eventsThisWeekCount * (500 + Math.floor(Math.random() * 1500))
              
              // Scandal impact: lose 1-5% during active scandals
              const activeScandalCount = (updatedPersonalLife.scandals || []).filter(s => s.status !== 'resolved').length
              if (activeScandalCount > 0) {
                const lossPercent = 0.01 + Math.random() * 0.04 * activeScandalCount
                weeklyGrowth -= Math.floor(currentFollowing * lossPercent)
              }
              
              // Endorsement boost: each active endorsement adds followers
              const activeEndorsements = (updatedPersonalLife.brand.endorsements || []).length
              weeklyGrowth += activeEndorsements * 200
              
              // Rivalry media attention: high-intensity rivalries add followers
              const highIntensityRivalries = (updatedPersonalLife.rivalries || []).filter(r => r.isActive && r.intensity > 50).length
              weeklyGrowth += highIntensityRivalries * 300
              
              // Cap growth at 10% per week
              const maxGrowth = Math.floor(currentFollowing * 0.10)
              weeklyGrowth = Math.min(weeklyGrowth, maxGrowth)
              
              // Floor at small loss (followers don't drop below 1000)
              const newFollowing = Math.max(1000, currentFollowing + weeklyGrowth)
              
              updatedPersonalLife = {
                ...updatedPersonalLife,
                brand: {
                  ...updatedPersonalLife.brand,
                  socialMediaFollowing: newFollowing
                }
              }
              
              // Milestone log entries
              const milestones = [100000, 500000, 1000000, 5000000, 10000000]
              for (const milestone of milestones) {
                if (currentFollowing < milestone && newFollowing >= milestone) {
                  const milestoneLabel = milestone >= 1000000 
                    ? `${(milestone / 1000000).toFixed(0)}M` 
                    : `${(milestone / 1000).toFixed(0)}K`
                  pushLog('social_media', `${milestoneLabel} Followers!`, `You've reached ${milestoneLabel} social media followers — a major milestone!`, 'positive')
                  console.log(`[Social Media] Milestone reached: ${milestoneLabel} followers!`)
                }
              }
            }
            
            // 16. Gradual Public Image Drift
            // Instead of instant changes, public image drifts toward a "target" based on reputation events
            {
              const brand = updatedPersonalLife.brand
              const positiveEvents = (brand.reputationEvents || []).filter(e => e.type === 'positive')
              const negativeEvents = (brand.reputationEvents || []).filter(e => e.type === 'negative')
              
              const positiveWeight = positiveEvents.reduce((sum, e) => sum + e.impact * (e.decayWeeks / 10), 0)
              const negativeWeight = negativeEvents.reduce((sum, e) => sum + Math.abs(e.impact) * (e.decayWeeks / 10), 0)
              
              // Target image: base 35 + positive - negative contributions
              const baseImage = 35
              const targetImage = Math.max(5, Math.min(100, baseImage + positiveWeight * 0.3 - negativeWeight * 0.3))
              
              // Drift toward target (1-2 points per week)
              const currentImg = brand.publicImage
              const diff = targetImage - currentImg
              const driftRate = Math.sign(diff) * Math.min(2, Math.abs(diff) * 0.15)
              
              updatedPersonalLife = {
                ...updatedPersonalLife,
                brand: {
                  ...updatedPersonalLife.brand,
                  publicImage: Math.max(0, Math.min(100, currentImg + driftRate))
                }
              }
            }
            
            // -- Merge social log entries, cap at 100 --
            if (socialLogEntries.length > 0) {
              const existingLog = updatedPersonalLife.socialLog || []
              const mergedLog = [...socialLogEntries, ...existingLog].slice(0, 100)
              updatedPersonalLife = {
                ...updatedPersonalLife,
                socialLog: mergedLog
              }
            }
            
            // ============================================
            // Incrementally track tax-deductible expenses this week
            // ============================================
            {
              const currentTransactions = updatedPersonalLife.finances.transactions || []
              // Check only recent transactions from this week
              const thisWeekDeductible = currentTransactions
                .filter(tx => 
                  tx.date?.week === newWeek && 
                  tx.date?.year === careerState.currentYear &&
                  tx.type === 'expense' && 
                  tx.taxDeductible === true
                )
                .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
              
              if (thisWeekDeductible > 0) {
                updatedPersonalLife = {
                  ...updatedPersonalLife,
                  finances: {
                    ...updatedPersonalLife.finances,
                    taxDeductionsThisYear: (updatedPersonalLife.finances.taxDeductionsThisYear || 0) + thisWeekDeductible
                  }
                }
              }
            }
            
            // ============================================
            // Sync Monthly Expense Tracking (for UI display and financial summary)
            // ============================================
            {
              const lifestyleConfig = LIFESTYLE_CONFIGS[
                (updatedPersonalLife.lifestyleLevel === 'frugal' ? 'modest' : updatedPersonalLife.lifestyleLevel) as keyof typeof LIFESTYLE_CONFIGS
              ]
              
              const lifestyleMonthlyCost = lifestyleConfig?.monthlyBaseCost || 2000
              const loanPayments = updatedPersonalLife.finances.personalLoans
                .filter(l => l.remainingBalance > 0)
                .reduce((sum, l) => sum + l.monthlyPayment, 0)
              const mortgagePayments = updatedPersonalLife.finances.mortgages
                .filter(m => m.remainingBalance > 0)
                .reduce((sum, m) => sum + m.monthlyPayment, 0)
              const hobbyExpenses = updatedPersonalLife.hobbies
                .reduce((sum, h) => sum + (h.currentMonthlyCost || h.annualCost / 12), 0)
              const staffExpenses = updatedPersonalLife.staff
                .reduce((sum, s) => sum + Math.floor(s.salary / 12), 0)
              const foundationExpenses = (updatedPersonalLife.foundations || [])
                .reduce((sum: number, f) => sum + Math.floor((f.annualBudget || 0) / 12), 0)
              const healthcareMonthly = Math.floor(updatedPersonalLife.health.annualHealthcareCost / 12)
              const privacyLevelForExpense = updatedPersonalLife.brand?.privacyLevel || 'balanced'
              const privacyConfigForExpense = (['open_book', 'balanced', 'private', 'reclusive'].includes(privacyLevelForExpense) 
                ? getPrivacyLevelConfig(privacyLevelForExpense as any) 
                : getPrivacyLevelConfig('balanced'))
              const securityMonthly = privacyConfigForExpense.monthlySecurityCost || 0
              
              // Family expenses: child costs
              const childMonthlyExpenses = (updatedPersonalLife.children || []).length > 0
                ? (updatedPersonalLife.children || []).reduce((sum: number, child) => {
                    const age = newYear - (child.birthDate?.year || newYear)
                    // Base cost scales with age: $500-$3000/month
                    return sum + Math.floor(500 + (age * 200))
                  }, 0)
                : 0
              
              updatedPersonalLife = {
                ...updatedPersonalLife,
                finances: {
                  ...updatedPersonalLife.finances,
                  monthlyExpenses: {
                    lifestyle: Math.round(lifestyleMonthlyCost),
                    loanPayments: Math.round(loanPayments),
                    mortgagePayments: Math.round(mortgagePayments),
                    familyExpenses: Math.round(childMonthlyExpenses),
                    personalStaff: Math.round(staffExpenses),
                    hobbies: Math.round(hobbyExpenses),
                    philanthropy: Math.round(foundationExpenses),
                    insurance: Math.round(healthcareMonthly),
                    other: Math.round(securityMonthly)
                  }
                }
              }
            }
            
            // Update personal life state
            updatedCareerState = {
              ...updatedCareerState,
              personalLife: updatedPersonalLife
            }
            
            console.log(`[Personal Life] Week ${careerState.currentWeek}: Health ${updatedPersonalLife.health.physicalHealth}%, Stress ${updatedPersonalLife.health.stressLevel}%, Cash $${updatedPersonalLife.finances.liquidCash.toLocaleString()}`)
          }
          
          // ============================================
          // Handle Year Rollover
          // ============================================
          // Use dynamic weeks calculation - some years have 52 weeks, others have 53
          const weeksInCurrentYear = getWeeksInYear(careerState.currentYear)
          if (newWeek > weeksInCurrentYear) {
            newWeek = 1
            newYear += 1
            newAge += 1
            
            // Calculate the correct starting day for January 1st of the new year
            const jan1NewYear = new Date(newYear, 0, 1)
            const jan1DayOfWeek = jan1NewYear.getDay() === 0 ? 7 : jan1NewYear.getDay()
            
            // Expire old sponsor deals at year end
            let validSponsors = updatedPlayer.finances.sponsorDeals.filter(deal => 
              deal.active && deal.startYear + deal.duration > newYear
            )
            
            const expiredCount = updatedPlayer.finances.sponsorDeals.length - validSponsors.length
            if (expiredCount > 0) {
              console.log(`[CareerStore] ${expiredCount} sponsor deal(s) expired at season end`)
            }
            
            console.log(`[CareerStore] Year rollover: ${careerState.currentYear} -> ${newYear}. Jan 1 is day ${jan1DayOfWeek} (${['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][jan1DayOfWeek]})`)
            
            // Reset season state for new year
            updatedCareerState = {
              ...updatedCareerState,
              currentWeek: newWeek,
              currentYear: newYear,
              currentDay: jan1DayOfWeek, // Start on the correct day of week for Jan 1
              currentRound: 0,
              seasonStarted: false,
              seasonCompleted: false,
              pendingSponsorOffers: [], // Clear old sponsor offers
              lastSponsorGenerationWeek: 0,
              // Reset invitational counters for new season
              pendingInvitations: [],
              acceptedInvitations: [],
              declinedInvitationsThisSeason: 0,
              invitationsThisSeason: 0,
              eventsUsedThisYear: [], // Reset annual event tracking
              // eventHistory is preserved across years for biennial/quadrennial tracking
              // Reset opportunity counters for new season
              pendingOpportunities: [],
              acceptedOpportunities: [],
              declinedOpportunitiesThisSeason: [],
              acceptedOpportunitiesThisSeason: [],
              // lastOpportunityOfferWeeks is preserved for cooldown tracking
            }
            
            // ============================================
            // Annual Personal Life Processing
            // ============================================
            if (updatedCareerState.personalLife) {
              const personalLife = updatedCareerState.personalLife
              let updatedPersonalLife = { ...personalLife }
              
              // 1. Age the player's health (affects life expectancy calculations)
              const healthAgeFactor = Math.max(0, (newAge - 50) * 0.5) // Health declines faster after 50
              updatedPersonalLife = {
                ...updatedPersonalLife,
                health: {
                  ...updatedPersonalLife.health,
                  age: newAge,
                  // Slight physical health decline with age (0-1% per year after 40)
                  physicalHealth: Math.max(0, updatedPersonalLife.health.physicalHealth - 
                    (newAge > 40 ? Math.min(1, (newAge - 40) * 0.1) : 0)
                  ),
                  // Update life expectancy based on current health and lifestyle
                  lifeExpectancy: Math.max(
                    newAge + 10, // At least 10 more years
                    Math.round(
                      75 + // Base life expectancy
                      (updatedPersonalLife.health.physicalHealth - 50) * 0.2 + // Health factor
                      (100 - updatedPersonalLife.health.stressLevel) * 0.1 - // Stress factor
                      healthAgeFactor + // Age penalty
                      (updatedPersonalLife.health.healthcareLevel === 'world_class' ? 5 :
                       updatedPersonalLife.health.healthcareLevel === 'concierge' ? 4 :
                       updatedPersonalLife.health.healthcareLevel === 'premium' ? 2 : 0) // Healthcare bonus
                    )
                  )
                }
              }
              
              // 2. Process annual staff tenure and loyalty
              if (personalLife.staff.length > 0) {
                const staffResult = processAnnualStaff(personalLife.staff)
                updatedPersonalLife = {
                  ...updatedPersonalLife,
                  staff: staffResult.updatedStaff
                }
                console.log(`[Personal Life] Annual staff review: ${staffResult.updatedStaff.length} staff member(s) updated, total annual salary $${staffResult.totalSalaryCost.toLocaleString()}`)
              }
              
              // 3. Process annual hobby progression (years active increment)
              if (personalLife.hobbies.length > 0) {
                updatedPersonalLife = {
                  ...updatedPersonalLife,
                  hobbies: personalLife.hobbies.map(hobby => processAnnualHobby(hobby))
                }
                console.log(`[Personal Life] Hobbies: ${personalLife.hobbies.map(h => `${h.name} (${h.yearsActive + 1} years)`).join(', ')}`)
              }
              
              // 4. Healthcare cost already deducted weekly (annualCost/52 per week)
              // No additional annual deduction needed - weekly processing handles this
              const annualHealthcareCost = updatedPersonalLife.health.annualHealthcareCost
              
              console.log(`[Personal Life] Year ${newYear}: Age ${newAge}, Life Expectancy ${updatedPersonalLife.health.lifeExpectancy}, Annual Healthcare $${annualHealthcareCost.toLocaleString()}/yr (deducted weekly)`)
              
              // 5. Process Annual Taxes (based on previous year's income)
              if (updatedPersonalLife.finances.taxResidency) {
                const previousYear = newYear - 1
                const taxResult = processAnnualTaxes(
                  updatedPersonalLife.finances,
                  previousYear
                )
                
                if (taxResult.totalTaxOwed > 0) {
                  updatedPersonalLife = {
                    ...updatedPersonalLife,
                    finances: {
                      ...updatedPersonalLife.finances,
                      liquidCash: updatedPersonalLife.finances.liquidCash - taxResult.totalTaxOwed,
                      taxesPaidThisYear: taxResult.totalTaxOwed,
                      taxDeductionsThisYear: taxResult.totalDeductions,
                      lastTaxYear: previousYear,
                      transactions: [...updatedPersonalLife.finances.transactions, taxResult.taxTransaction]
                    }
                  }
                  
                  console.log(`[Taxes] Year ${previousYear} tax bill: $${taxResult.totalTaxOwed.toLocaleString()} (${taxResult.country}, effective rate: ${(taxResult.effectiveRate * 100).toFixed(1)}%)`)
                  console.log(`[Taxes] Breakdown - Income: $${taxResult.incomeTax.toLocaleString()}, Capital Gains: $${taxResult.capitalGainsTax.toLocaleString()}, Dividends: $${taxResult.dividendTax.toLocaleString()}`)
                  console.log(`[Taxes] Deductions applied: $${taxResult.totalDeductions.toLocaleString()} (Standard: $${taxResult.breakdown.standardDeduction.toLocaleString()}, Charitable: $${taxResult.breakdown.charitableDeductions.toLocaleString()})`)
                } else {
                  console.log(`[Taxes] No tax owed for year ${previousYear} (${updatedPersonalLife.finances.taxResidency})`)
                }
              }
              
              // 6. Deduct foundation annual budgets
              const foundations = updatedPersonalLife.foundations || []
              if (foundations.length > 0) {
                let totalFoundationCost = 0
                for (const foundation of foundations) {
                  if (foundation.annualBudget > 0) {
                    totalFoundationCost += foundation.annualBudget
                  }
                }
                
                if (totalFoundationCost > 0) {
                  updatedPersonalLife = {
                    ...updatedPersonalLife,
                    finances: {
                      ...updatedPersonalLife.finances,
                      liquidCash: updatedPersonalLife.finances.liquidCash - totalFoundationCost,
                      transactions: [...updatedPersonalLife.finances.transactions, {
                        id: `foundation_annual_${newYear}`,
                        date: { week: 1, year: newYear },
                        type: 'expense' as const,
                        category: 'philanthropy' as const,
                        amount: -totalFoundationCost,
                        description: `Annual foundation budgets (${foundations.length} foundation${foundations.length > 1 ? 's' : ''})`,
                        taxDeductible: true
                      }]
                    }
                  }
                  console.log(`[Personal Life] Foundation annual budgets: -$${totalFoundationCost.toLocaleString()} (${foundations.length} foundation${foundations.length > 1 ? 's' : ''})`)
                }
              }
              
              updatedCareerState = {
                ...updatedCareerState,
                personalLife: updatedPersonalLife
              }
            }
            
            // ============================================
            // Reset Year-to-Date Financial Tracking
            // ============================================
            if (updatedCareerState.ownedTeam?.budgets) {
              console.log(`[CareerStore] Resetting YTD financial tracking for new year ${newYear}`)
              const previousYearStats = {
                income: updatedCareerState.ownedTeam.budgets.yearToDateIncome,
                expenses: updatedCareerState.ownedTeam.budgets.yearToDateExpenses,
                costCapSpending: updatedCareerState.ownedTeam.budgets.costCapSpending
              }
              console.log(`[CareerStore] Previous year financial totals:`, previousYearStats)
              
              updatedCareerState = {
                ...updatedCareerState,
                ownedTeam: {
                  ...updatedCareerState.ownedTeam,
                  budgets: {
                    ...updatedCareerState.ownedTeam.budgets,
                    yearToDateIncome: 0,
                    yearToDateExpenses: 0,
                    costCapSpending: 0,
                    budgetOverspends: undefined // Clear overspend tracking for new season
                  }
                }
              }
            }
            
            // ============================================
            // Reset Championship Standings for New Season
            // ============================================
            console.log(`[CareerStore] Triggering championship standings reset for new year ${newYear}`)
            useRivalStore.getState().resetSeasonStandings()
            
            // ============================================
            // Regenerate Series Calendars for New Year
            // ============================================
            console.log(`[CareerStore] Regenerating all series calendars for year ${newYear}`)
            useRivalStore.getState().regenerateAllCalendars(newYear)
            
            // ============================================
            // World Staff Pool - Seasonal Lifecycle
            // ============================================
            if (updatedCareerState.worldStaffPool && updatedCareerState.worldStaffPool.length > 0) {
              let seasonalPool = [...updatedCareerState.worldStaffPool]
              let retiredCount = 0
              let newGraduatesCount = 0
              let aiChurnCount = 0
              let aiHiredCount = 0
              
              // 1. Age all staff by 1 year
              seasonalPool = seasonalPool.map(member => ({
                ...member,
                staff: { ...member.staff, age: member.staff.age + 1 }
              }))
              
              // 2. Retire staff past their retirement age
              seasonalPool = seasonalPool.filter(member => {
                if (member.staff.age >= member.retirementAge && member.status !== 'employed_player') {
                  retiredCount++
                  return false // Remove from pool
                }
                return true
              })
              
              // 3. Simulate AI team churn: 10-20% of employed_ai staff become available
              seasonalPool = seasonalPool.map(member => {
                if (member.status === 'employed_ai' && Math.random() < 0.15) {
                  aiChurnCount++
                  return { ...member, status: 'available' as const, employedBy: undefined }
                }
                return member
              })
              
              // 4. Simulate AI hiring: some available high-reputation staff get hired by AI teams
              const aiTeams = ['Red Bull Racing', 'Mercedes AMG', 'McLaren', 'Ferrari', 'Aston Martin',
                             'Alpine', 'Williams', 'AlphaTauri', 'Alfa Romeo', 'Haas F1',
                             'Porsche Motorsport', 'BMW Motorsport', 'Toyota Gazoo Racing']
              seasonalPool = seasonalPool.map(member => {
                if (member.status === 'available' && member.staff.reputation > 65 && Math.random() < 0.25) {
                  aiHiredCount++
                  return { 
                    ...member, 
                    status: 'employed_ai' as const, 
                    employedBy: aiTeams[Math.floor(Math.random() * aiTeams.length)] 
                  }
                }
                return member
              })
              
              // 5. Generate 10-20 new graduates (young, low-experience staff)
              const graduateCount = 10 + Math.floor(Math.random() * 11)
              const tierForGrads = updatedCareerState.ownedTeam?.tier || 'amateur'
              const facilityGradRoles: import('@/data/facility-staff-config').FacilityStaffRole[] = [
                'junior_engineer', 'junior_engineer', 'junior_engineer', // Weighted toward juniors
                'aerodynamicist', 'structural_engineer', 'simulation_specialist'
              ]
              const teamGradRoles: FacilityConfigTeamStaffRole[] = [
                'data_analyst', 'race_engineer', 'crew_chief', 'performance_engineer'
              ]
              
              for (let i = 0; i < graduateCount; i++) {
                if (Math.random() < 0.6) {
                  const role = facilityGradRoles[Math.floor(Math.random() * facilityGradRoles.length)]
                  const staff = generateFacilityStaff(role, tierForGrads, true)
                  // Override age to be young graduate
                  staff.age = 22 + Math.floor(Math.random() * 4) // 22-25
                  staff.experience = Math.max(0, staff.age - 22)
                  seasonalPool.push({
                    staff,
                    status: 'available',
                    enteredPoolYear: newYear,
                    retirementAge: 55 + Math.floor(Math.random() * 14)
                  })
                } else {
                  const role = teamGradRoles[Math.floor(Math.random() * teamGradRoles.length)]
                  const staff = generateTeamStaff(role, tierForGrads, true)
                  staff.age = 23 + Math.floor(Math.random() * 4) // 23-26
                  staff.experience = Math.max(0, staff.age - 23)
                  seasonalPool.push({
                    staff,
                    status: 'available',
                    enteredPoolYear: newYear,
                    retirementAge: 55 + Math.floor(Math.random() * 14)
                  })
                }
                newGraduatesCount++
              }
              
              updatedCareerState = {
                ...updatedCareerState,
                worldStaffPool: seasonalPool,
                // Refresh market view
                facilityStaffMarket: seasonalPool
                  .filter(m => m.status === 'available')
                  .map(m => m.staff)
                  .sort((a, b) => b.reputation - a.reputation)
              }
              
              console.log(`[WorldStaffPool] Seasonal update: ${retiredCount} retired, ${newGraduatesCount} graduates, ${aiChurnCount} left AI teams, ${aiHiredCount} hired by AI. Pool: ${seasonalPool.length} total, ${seasonalPool.filter(m => m.status === 'available').length} available`)
            }
            
            // ============================================
            // Regenerate Sponsor Performance Targets
            // ============================================
            // Regenerate targets for all active sponsor deals
            const rivalStoreForTargets = useRivalStore.getState()
            const playerSeries = updatedPlayer.currentSeriesId 
              ? rivalStoreForTargets.getSeriesById(updatedPlayer.currentSeriesId)
              : null
            const totalRacesInSeason = playerSeries?.calendar?.length || 12
            const gridSize = playerSeries?.gridSize || 20
            const seriesTier = playerSeries?.tier || 'semi-pro'
            
            if (validSponsors.length > 0) {
              console.log(`[CareerStore] Regenerating performance targets for ${validSponsors.length} sponsor(s)`)
              
              validSponsors = validSponsors.map(sponsor => {
                // Look up sponsor tier from SPONSORS database or default to 'mid'
                const sponsorData = SPONSORS.find(s => s.id === sponsor.sponsorId)
                const sponsorTier = sponsorData?.tier || 'mid' as const
                
                // Generate fresh targets for new season
                const newTargets = generateSponsorTargets(
                  sponsorTier,
                  seriesTier,
                  totalRacesInSeason,
                  gridSize
                )
                
                console.log(`[CareerStore] New targets for ${sponsor.sponsorName}:`, newTargets.map(t => t.description).join(', '))
                
                return {
                  ...sponsor,
                  targets: newTargets
                }
              })
            }
            
            // Also regenerate targets for team sponsors if owned team exists
            if (updatedCareerState.ownedTeam?.finances?.sponsors) {
              const teamSeries = updatedCareerState.seriesEntries?.[0]?.seriesId
                ? rivalStoreForTargets.getSeriesById(updatedCareerState.seriesEntries[0].seriesId)
                : null
              const teamTotalRaces = teamSeries?.calendar?.length || 12
              const teamGridSize = teamSeries?.gridSize || 20
              const teamSeriesTier = teamSeries?.tier || 'semi-pro'
              
              const updatedTeamSponsors = updatedCareerState.ownedTeam.finances.sponsors.map(sponsor => {
                if (!sponsor.active) return sponsor
                
                // Generate fresh targets for team sponsor
                const sponsorTier = 'mid' as const // Team sponsors use mid tier for now
                const newTargets = generateSponsorTargets(
                  sponsorTier,
                  teamSeriesTier,
                  teamTotalRaces,
                  teamGridSize
                )
                
                console.log(`[CareerStore] New team sponsor targets for ${sponsor.sponsorName}`)
                
                return {
                  ...sponsor,
                  // Reset season stats for new year
                  seasonWins: 0,
                  seasonPodiums: 0,
                  seasonRacesStarted: 0,
                  seasonDNFs: 0,
                  warningIssued: false,
                  finalWarningIssued: false,
                  targets: newTargets.map(t => ({
                    id: t.id,
                    type: t.type as 'championship_position' | 'total_wins' | 'total_podiums' | 'races_entered',
                    targetValue: t.targetValue,
                    currentValue: 0,
                    description: t.description,
                    met: false,
                    exceeded: false
                  }))
                }
              })
              
              updatedCareerState = {
                ...updatedCareerState,
                ownedTeam: {
                  ...updatedCareerState.ownedTeam,
                  finances: {
                    ...updatedCareerState.ownedTeam.finances,
                    sponsors: updatedTeamSponsors
                  }
                }
              }
            }
            
            // ============================================
            // Staff Contract Expiry & Renewal Notifications
            // ============================================
            if (updatedCareerState.ownedTeam?.facilityStaff && updatedCareerState.ownedTeam.facilityStaff.length > 0) {
              const staffNotificationEmails: Email[] = []
              const expiringStaff: HiredFacilityStaff[] = []
              const renewedStaff: HiredFacilityStaff[] = []
              
              // Resolve HR sender from team staff (look for HR, team_manager, or principal roles)
              const allTeamStaff = [...(updatedCareerState.ownedTeam.staff ?? []), ...(updatedCareerState.ownedTeam.facilityStaff ?? [])]
              const hrStaff = allTeamStaff.find((s: any) => {
                const role = ((s as any).role || '').toLowerCase()
                const specialty = ((s as any).specialty || '').toLowerCase()
                return role.includes('hr') || role.includes('human_resources') || role.includes('personnel') || 
                       role.includes('team_manager') || role.includes('principal') ||
                       specialty.includes('hr') || specialty.includes('personnel')
              })
              const hrSenderName = (hrStaff as any)?.name || 'HR Department'
              const hrSenderRole = hrStaff ? 'HR Director' : 'Human Resources'
              
              updatedCareerState.ownedTeam.facilityStaff.forEach(staff => {
                if (staff.contractEndYear === newYear) {
                  // Contract expires this year - notify player
                  expiringStaff.push(staff)
                  
                  const emailBody = `Dear Team Owner,\n\nThis is to notify you that ${staff.name} (${staff.role.replace(/_/g, ' ')}) has a contract that expires at the end of this season.\n\nCurrent Salary: $${staff.salary?.toLocaleString() || 'N/A'}/month\nMorale: ${staff.morale}%\n\nPlease review their performance and decide whether to offer a contract extension. Staff with expiring contracts who are not renewed will leave the team at season end.\n\nBest regards,\n${hrSenderName}`
                  
                  // Generate email notification about expiring contract
                  const email: Email = {
                    id: `email_staff_expiry_${staff.id}_${Date.now()}`,
                    category: 'team',
                    subject: `Contract Expiring: ${staff.name}`,
                    sender: hrSenderName,
                    senderRole: hrSenderRole,
                    preview: emailBody.slice(0, 100) + '...',
                    body: emailBody,
                    receivedDay: 1,
                    receivedWeek: 1,
                    receivedYear: newYear,
                    read: false,
                    starred: false,
                    archived: false
                  }
                  staffNotificationEmails.push(email)
                  
                  console.log(`[CareerStore] Staff contract expiring: ${staff.name} (${staff.role})`)
                } else if (staff.contractEndYear < newYear) {
                  // Contract already expired - staff should be removed
                  // But for now, auto-renew for 1 year to avoid abrupt departures
                  renewedStaff.push({
                    ...staff,
                    contractEndYear: newYear + 1
                  })
                  
                  const renewalBody = `Dear Team Owner,\n\n${staff.name} (${staff.role.replace(/_/g, ' ')}) has had their contract automatically renewed for 1 year as no action was taken before the previous contract expired.\n\nNew Contract End: ${newYear + 1}\nSalary: $${staff.salary?.toLocaleString() || 'N/A'}/month\n\nIf you wish to release this staff member, please use the Staff Management interface.\n\nBest regards,\n${hrSenderName}`
                  
                  // Generate notification about auto-renewal
                  const email: Email = {
                    id: `email_staff_renewed_${staff.id}_${Date.now()}`,
                    category: 'team',
                    subject: `Contract Auto-Renewed: ${staff.name}`,
                    sender: hrSenderName,
                    senderRole: hrSenderRole,
                    preview: renewalBody.slice(0, 100) + '...',
                    body: renewalBody,
                    receivedDay: 1,
                    receivedWeek: 1,
                    receivedYear: newYear,
                    read: false,
                    starred: false,
                    archived: false
                  }
                  staffNotificationEmails.push(email)
                  
                  console.log(`[CareerStore] Staff contract auto-renewed: ${staff.name} (${staff.role})`)
                }
              })
              
              // Update facility staff with renewed contracts
              if (renewedStaff.length > 0) {
                const updatedFacilityStaff = updatedCareerState.ownedTeam.facilityStaff.map(staff => {
                  const renewed = renewedStaff.find(r => r.id === staff.id)
                  return renewed || staff
                })
                
                updatedCareerState = {
                  ...updatedCareerState,
                  ownedTeam: {
                    ...updatedCareerState.ownedTeam,
                    facilityStaff: updatedFacilityStaff
                  }
                }
              }
              
              // Add notification emails
              if (staffNotificationEmails.length > 0) {
                updatedCareerState = {
                  ...updatedCareerState,
                  emails: [...(updatedCareerState.emails || []), ...staffNotificationEmails]
                }
                console.log(`[CareerStore] Generated ${staffNotificationEmails.length} staff contract notification email(s)`)
              }
            }
            
            updatedPlayer = {
              ...updatedPlayer,
              age: newAge,
              finances: {
                ...updatedPlayer.finances,
                sponsorDeals: validSponsors
              }
            }
            
            // ============================================
            // Activate Pending Contract at Season Start
            // ============================================
            if (updatedPlayer.pendingContract) {
              console.log(`[CareerStore] Activating pending contract with ${updatedPlayer.pendingContract.teamName} for new season`)
              
              // Sync teammate knowledge for new team
              const pendingRivalStore = useRivalStore.getState()
              const pendingTeam = pendingRivalStore.getTeamById(updatedPlayer.pendingContract.teamId)
              if (pendingTeam && pendingTeam.drivers.length > 0) {
                const teammateIds = pendingTeam.drivers
                const teammateNames: Record<string, string> = {}
                
                teammateIds.forEach(driverId => {
                  const driver = pendingRivalStore.rivals.find(r => r.id === driverId)
                  if (driver) {
                    teammateNames[driverId] = `${driver.firstName} ${driver.lastName}`
                  }
                })
                
                const scoutingStore = useScoutingStore.getState()
                scoutingStore.syncTeammateKnowledge(teammateIds, teammateNames)
              }
              
              // Activate the pending contract
              const activatedContract = updatedPlayer.pendingContract
              updatedPlayer = {
                ...updatedPlayer,
                contract: activatedContract,
                pendingContract: undefined,
                currentTeamId: activatedContract.teamId,
                currentSeriesId: activatedContract.seriesId,
                finances: {
                  ...updatedPlayer.finances,
                  salary: activatedContract.salary,
                  bonusPerWin: activatedContract.bonusPerWin,
                  bonusPerPodium: activatedContract.bonusPerPodium,
                  sponsorDeals: validSponsors
                }
              }
            }
          } else {
            updatedCareerState = {
              ...updatedCareerState,
              currentWeek: newWeek,
              currentYear: newYear
            }
          }
          
          // ============================================
          // Refresh Staff Job Market (weekly)
          // ============================================
          const { lastMarketRefresh, staffJobMarket } = get()
          // Refresh market every 2 weeks or if empty
          if (staffJobMarket.length === 0 || newWeek - lastMarketRefresh >= 2 || newWeek < lastMarketRefresh) {
            // Use setTimeout to avoid nested state updates
            setTimeout(() => {
              get().refreshStaffMarket()
            }, 0)
          }
          
          // ============================================
          // World Staff Pool - Weekly Cooldown Tick
          // ============================================
          if (updatedCareerState.worldStaffPool && updatedCareerState.worldStaffPool.length > 0) {
            let poolChanged = false
            const updatedPool = updatedCareerState.worldStaffPool.map(member => {
              // Decrement cooldown for fired staff
              if (member.status === 'cooldown' && member.cooldownWeeksRemaining && member.cooldownWeeksRemaining > 0) {
                poolChanged = true
                const remaining = member.cooldownWeeksRemaining - 1
                if (remaining <= 0) {
                  // Cooldown expired - staff becomes available again
                  return { ...member, status: 'available' as const, cooldownWeeksRemaining: undefined }
                }
                return { ...member, cooldownWeeksRemaining: remaining }
              }
              return member
            })
            
            if (poolChanged) {
              updatedCareerState = {
                ...updatedCareerState,
                worldStaffPool: updatedPool,
                // Also refresh the market view since new staff may be available
                facilityStaffMarket: updatedPool
                  .filter(m => m.status === 'available')
                  .map(m => m.staff)
                  .sort((a, b) => b.reputation - a.reputation)
              }
            }
          }
          
          // ============================================
          // Process Messaging Events (weekly NPC messages)
          // ============================================
          if (updatedCareerState.messaging && updatedCareerState.messaging.contacts.length > 0) {
            // Import dynamically to avoid circular dependency
            import('@/services/messagingEvents').then(({ processWeeklyMessagingEvents }) => {
              const currentMessaging = get().careerState?.messaging
              if (!currentMessaging) return
              
              // Collect recent game events (this could be expanded based on recent activity)
              const recentEvents: import('@/services/messagingEvents').GameEvent[] = []
              
              // Check for recent race results
              const playerHistory = updatedPlayer.raceHistory || []
              const lastRace = playerHistory[playerHistory.length - 1]
              if (lastRace && new Date(lastRace.date).getFullYear() === newYear) {
                // Add race event based on result
                if (lastRace.racePosition === 1) {
                  recentEvents.push({ type: 'race_win', week: newWeek, year: newYear })
                } else if (lastRace.racePosition <= 3) {
                  recentEvents.push({ type: 'race_podium', week: newWeek, year: newYear })
                } else if (lastRace.racePosition <= 10) {
                  recentEvents.push({ type: 'race_points', week: newWeek, year: newYear })
                } else if (lastRace.dnfReason) {
                  if (lastRace.dnfReason.includes('crash') || lastRace.dnfReason.includes('accident')) {
                    recentEvents.push({ type: 'race_crash', week: newWeek, year: newYear })
                  } else {
                    recentEvents.push({ type: 'race_dnf', week: newWeek, year: newYear })
                  }
                }
              }
              
              // Generate NPC messages based on events
              const generatedMessages = processWeeklyMessagingEvents(
                currentMessaging,
                newWeek,
                newYear,
                recentEvents
              )
              
              if (generatedMessages.length > 0) {
                console.log(`[Messaging] Week ${newWeek}: Generated ${generatedMessages.length} NPC message(s)`)
                
                // Add messages to conversations
                const updatedConversations = { ...currentMessaging.conversations }
                let totalNewUnread = 0
                
                for (const genMsg of generatedMessages) {
                  const existingConv = updatedConversations[genMsg.conversationId]
                  
                  if (existingConv) {
                    // Add to existing conversation
                    updatedConversations[genMsg.conversationId] = {
                      ...existingConv,
                      messages: [...existingConv.messages, genMsg.message],
                      unreadCount: existingConv.unreadCount + 1,
                      lastMessageTime: genMsg.message.timestamp,
                      awaitingResponse: true
                    }
                  } else {
                    // Create new conversation
                    const contact = currentMessaging.contacts.find(c => c.id === genMsg.contactId)
                    if (contact) {
                      updatedConversations[genMsg.conversationId] = {
                        id: genMsg.conversationId,
                        contactId: genMsg.contactId,
                        contactName: contact.name,
                        contactType: contact.type === 'partner' || contact.type === 'potential_date' ? 'romantic' : 
                                     contact.type === 'family' ? 'family' : 'social',
                        isActive: true,
                        lastMessageTime: genMsg.message.timestamp,
                        unreadCount: 1,
                        messages: [genMsg.message],
                        relationshipLevel: contact.relationshipLevel,
                        currentMood: contact.currentMood,
                        awaitingResponse: true,
                        conversationStage: 'ongoing'
                      } as import('@/data/messaging-config').Conversation
                    }
                  }
                  totalNewUnread++
                }
                
                // Update messaging state
                set({
                  careerState: {
                    ...get().careerState!,
                    messaging: {
                      ...currentMessaging,
                      conversations: updatedConversations,
                      unreadTotal: currentMessaging.unreadTotal + totalNewUnread,
                      lastMessageTime: { week: newWeek, day: 1, year: newYear }
                    }
                  }
                })
              }
            }).catch(err => {
              console.error('[Messaging] Failed to process weekly messages:', err)
            })
          }
          
          // ============================================
          // Sync Partner Meters (Family <-> Messaging)
          // ============================================
          // Ensure partner in family and contact in messaging have synced meters
          const personalLifeForSync = updatedCareerState.personalLife
          const messagingForSync = updatedCareerState.messaging
          
          if (personalLifeForSync?.partner && messagingForSync?.contacts) {
            const partnerContact = messagingForSync.contacts.find(c => c.type === 'partner')
            
            if (partnerContact) {
              // Use family partner as source of truth
              const partner = personalLifeForSync.partner
              
              // Update contact meters to match partner
              const syncedContacts = messagingForSync.contacts.map(c => {
                if (c.type === 'partner') {
                  return {
                    ...c,
                    affectionMeter: partner.happiness ?? c.affectionMeter,
                    romanceMeter: partner.loveLevel ?? c.romanceMeter,
                    trustMeter: partner.trustLevel ?? c.trustMeter,
                    relationshipLevel: partner.compatibilityScore ?? c.relationshipLevel
                  }
                }
                return c
              })
              
              updatedCareerState = {
                ...updatedCareerState,
                messaging: {
                  ...messagingForSync,
                  contacts: syncedContacts
                }
              }
            }
          }

          // ============================================
          // Passive Recovery (replaces training system)
          // ============================================
          const rivalStore = useRivalStore.getState()
          const currentSeriesForWeek = updatedPlayer.currentSeriesId 
            ? rivalStore.getSeriesById(updatedPlayer.currentSeriesId)
            : null
          const nextWeekIsRaceWeek = currentSeriesForWeek?.calendar?.some(
            event => event.week === newWeek
          ) || false
          
          // ============================================
          // Season Started Flag - Set on First Race Week
          // ============================================
          if (nextWeekIsRaceWeek && !updatedCareerState.seasonStarted) {
            console.log(`[CareerStore] Season officially starting - first race week of ${updatedCareerState.currentYear}`)
            updatedCareerState = {
              ...updatedCareerState,
              seasonStarted: true
            }
          }

          // Fatigue recovery: More on off-weeks, less on race weeks
          const baseRecovery = nextWeekIsRaceWeek ? 5 : 15
          const fitnessBonus = (updatedPlayer.stats.fitness / 100) * 5 // Up to 5 extra recovery
          const fatigueRecovery = baseRecovery + fitnessBonus
          
          // Stress natural decay: stress reduces over time, faster on off-weeks
          const currentStress = updatedPlayer.mentalState.stress || 0
          const stressDecay = nextWeekIsRaceWeek ? 2 : 5 // More recovery on off-weeks
          const newStress = Math.max(0, currentStress - stressDecay)
          
          // Confidence natural regression toward baseline (50): 
          // High confidence slowly falls, low confidence slowly rises
          const currentConfidence = updatedPlayer.mentalState.confidence
          const confidenceBaseline = 50
          let confidenceChange = 0
          if (currentConfidence > confidenceBaseline + 5) {
            confidenceChange = -1 // Slowly fall back toward baseline
          } else if (currentConfidence < confidenceBaseline - 5) {
            confidenceChange = nextWeekIsRaceWeek ? 0 : 1 // Slowly recover on off-weeks
          }
          
          updatedPlayer = {
            ...updatedPlayer,
            mentalState: {
              ...updatedPlayer.mentalState,
              fatigue: Math.max(0, updatedPlayer.mentalState.fatigue - fatigueRecovery),
              // Slight morale boost on off-weeks (rest and relaxation)
              morale: nextWeekIsRaceWeek 
                ? updatedPlayer.mentalState.morale 
                : Math.min(100, updatedPlayer.mentalState.morale + 2),
              // Stress natural weekly decay
              stress: newStress,
              // Confidence regression toward baseline
              confidence: Math.max(0, Math.min(100, currentConfidence + confidenceChange))
            }
          }

          // ============================================
          // Process Injury Healing
          // ============================================
          if (updatedCareerState.rpgState.injury.injured) {
            const injury = updatedCareerState.rpgState.injury
            const fitnessModifier = updatedPlayer.stats.fitness / 100
            const healingRate = 0.5 + (fitnessModifier * 0.5)
            const weeksHealed = Math.ceil(healingRate)
            const newRecoveryWeeks = Math.max(0, injury.recoveryWeeksRemaining - weeksHealed)

            if (newRecoveryWeeks <= 0) {
              console.log('[CareerStore] Injury healed!')
              updatedCareerState = {
                ...updatedCareerState,
                rpgState: {
                  ...updatedCareerState.rpgState,
                  injury: createDefaultInjuryState()
                }
              }
            } else {
              updatedCareerState = {
                ...updatedCareerState,
                rpgState: {
                  ...updatedCareerState.rpgState,
                  injury: {
                    ...injury,
                    recoveryWeeksRemaining: newRecoveryWeeks
                  }
                }
              }
              console.log(`[CareerStore] Injury recovery: ${newRecoveryWeeks} weeks remaining`)
            }
          }

          // ============================================
          // Update Team Development (Legacy - from technical feedback)
          // ============================================
          const techFeedbackBonus = (updatedPlayer.stats.technicalFeedback / 100) * 0.5 // 0-0.5 points per week
          updatedCareerState = {
            ...updatedCareerState,
            rpgState: {
              ...updatedCareerState.rpgState,
              teamDevelopment: {
                ...updatedCareerState.rpgState.teamDevelopment,
                points: Math.min(100, updatedCareerState.rpgState.teamDevelopment.points + techFeedbackBonus),
                weeklyGrowthRate: techFeedbackBonus,
                lastUpdatedWeek: newWeek
              }
            }
          }
          
          // ============================================
          // NEW: Full Team Development System
          // ============================================
          if (updatedCareerState.teamDevelopment) {
            // Process player team development
            const techFeedback = updatedPlayer.stats?.technicalFeedback || 50
            
            // Get facility levels for R&D bonuses
            const facilityLevels = updatedCareerState.ownedTeam?.facilities ? {
              aero: updatedCareerState.ownedTeam.facilities.aero?.level || 1,
              chassis: updatedCareerState.ownedTeam.facilities.chassis?.level || 1,
              engine: updatedCareerState.ownedTeam.facilities.engine?.level || 1,
              sim: updatedCareerState.ownedTeam.facilities.sim?.level || 1,
              manufacturing: updatedCareerState.ownedTeam.facilities.manufacturing?.level || 1,
              marketing: updatedCareerState.ownedTeam.facilities.marketing?.level || 1
            } : undefined
            
            const devResult = applyWeeklyDevelopment(
              updatedCareerState.teamDevelopment,
              techFeedback,
              newWeek,
              newYear,
              undefined, // moraleModifiers
              facilityLevels
            )
            
            // Apply event effects
            let finalDevState = devResult.newState
            for (const event of devResult.events) {
              finalDevState = applyEventEffects(finalDevState, event, newWeek)
            }
            
            updatedCareerState = {
              ...updatedCareerState,
              teamDevelopment: finalDevState,
              developmentEvents: [...(updatedCareerState.developmentEvents || []).slice(-20), ...devResult.events]
            }
            
            if (devResult.completedUpgrades.length > 0) {
              console.log(`[Team Dev] Completed: ${devResult.completedUpgrades.map(u => u.name).join(', ')}`)
              // === EMAIL NOTIFICATION FOR R&D BREAKTHROUGHS ===
              routeNotification({
                category: 'technical',
                subject: `R&D Complete: ${devResult.completedUpgrades.map(u => u.name).join(', ')}`,
                body: `The engineering team has completed research on:\n\n${devResult.completedUpgrades.map(u => `- **${u.name}**: ${u.description || 'Upgrade ready for deployment'}`).join('\n')}\n\nThese upgrades are now active and contributing to car performance.`,
                emailCategory: 'team'
              })
            }
          }
          
          // Update AI team development
          const aiDevEvents = rivalStore.updateAllTeamDevelopment(newWeek)
          if (aiDevEvents.length > 0) {
            console.log(`[AI Team Dev] ${aiDevEvents.length} team events this week`)
          }
          
          // ============================================
          // Process Facility Upgrades (check/complete)
          // ============================================
          get().processFacilityUpgrades()
          
          // ============================================
          // Process Driver Training (progress/complete)
          // ============================================
          get().processDriverTrainingWeekly()

          console.log(`[CareerStore] New week ${newWeek}: RaceWeek=${nextWeekIsRaceWeek}, Fatigue=${Math.round(updatedPlayer.mentalState.fatigue)}%`)
          
          // ============================================
          // Low Team Budget Warning
          // ============================================
          const finalTeamCash = updatedCareerState.ownedTeam?.budgets?.cash ?? 0
          const weeklyBurn = (updatedCareerState.ownedTeam?.budgets?.yearToDateExpenses ?? 0) / Math.max(1, newWeek - 1) || 50000
          const weeksOfRunway = weeklyBurn > 0 ? Math.floor(finalTeamCash / weeklyBurn) : 999
          if (finalTeamCash > 0 && weeksOfRunway <= 4) {
            routeNotification({
              category: 'finances',
              subject: weeksOfRunway <= 2 ? 'CRITICAL: Team Budget Almost Empty' : 'Warning: Low Team Budget',
              body: `Your team has $${finalTeamCash.toLocaleString()} remaining, which covers approximately ${weeksOfRunway} week(s) of expenses.\n\n${weeksOfRunway <= 2 ? 'This is critical. You need to secure additional funding immediately or cut costs drastically.' : 'Consider reducing expenses, seeking sponsors, or securing investment to ensure financial stability.'}`,
              emailCategory: 'team',
              urgency: weeksOfRunway <= 2 ? 'high' : 'normal'
            })
          }

          // ============================================
          // Check for Mid-Season Works Reassignment
          // ============================================
          if (updatedPlayer.contract?.canBeReassigned && 
              updatedPlayer.contract?.offerType === 'works-program' && 
              updatedPlayer.contract?.programId &&
              updatedPlayer.contract?.currentAssignment) {
            
            const rivalStore = useRivalStore.getState()
            const midSeasonOpp = rivalStore.checkMidSeasonReassignment(
              updatedPlayer.contract.programId,
              updatedPlayer.contract.currentAssignment.entryId,
              updatedPlayer.reputation
            )
            
            if (midSeasonOpp) {
              console.log(`[CareerStore] Mid-season opportunity: ${midSeasonOpp.reason} - ${midSeasonOpp.newEntryName}`)
              
              // Update player's assignment for injury cover
              const newAssignment: CurrentAssignment = {
                entryId: midSeasonOpp.newEntryId,
                entryName: midSeasonOpp.newEntryName,
                carName: midSeasonOpp.newCarName,
                carClassId: midSeasonOpp.newCarClassId,
                seriesId: midSeasonOpp.newSeriesId,
                seriesName: midSeasonOpp.newSeriesName
              }
              
              // Generate an event for this reassignment
              const injuryCoverEvent = {
                id: `injury_cover_${newWeek}_${newYear}_${Date.now()}`,
                type: 'opportunity' as const,
                severity: 'major' as const,
                title: 'Called Up for Injury Cover!',
                description: `${midSeasonOpp.injuredDriverName} has been injured, and ${updatedPlayer.contract.teamName} has called you up to race the ${midSeasonOpp.newCarName} in ${midSeasonOpp.newSeriesName}. This is ${midSeasonOpp.duration === 'temporary' ? 'a one-race opportunity' : 'for the remainder of the season'}.`,
                week: newWeek,
                year: newYear,
                effects: [
                  { stat: 'morale', change: 25 },
                  { stat: 'confidence', change: 15 }
                ],
                resolved: false
              }
              
              const currentEvents = updatedCareerState.events || []
              
              // Update contract with new assignment
              updatedPlayer = {
                ...updatedPlayer,
                contract: {
                  ...updatedPlayer.contract,
                  currentAssignment: newAssignment,
                  seriesId: midSeasonOpp.newSeriesId,
                  seriesName: midSeasonOpp.newSeriesName
                },
                currentSeriesId: midSeasonOpp.newSeriesId,
                currentTeamId: midSeasonOpp.newEntryId
              }
              
              updatedCareerState = {
                ...updatedCareerState,
                events: [...currentEvents, injuryCoverEvent]
              }
              
              console.log(`[CareerStore] Player reassigned for injury cover: ${midSeasonOpp.newEntryName}`)
            }
          }
          
          // ============================================
          // Clear Race Weekend Progress (new week = new race weekend)
          // ============================================
          // Clear progress when advancing to a new week
          // This ensures session data doesn't persist incorrectly
          updatedCareerState = {
            ...updatedCareerState,
            raceWeekendProgress: undefined
          }
          
          console.log('[CareerStore] Race weekend progress cleared for new week')
          
          // ============================================
          // Invitational Events - Check for New Invitations
          // ============================================
          // Only check on non-race weeks when player has a contract
          if (!nextWeekIsRaceWeek && updatedPlayer.contract && updatedPlayer.reputation >= 30) {
            // Calculate how many weeks until next race
            const weeksUntilNextRace = currentSeriesForWeek?.calendar
              ?.filter(e => e.week > newWeek)
              ?.reduce((min, e) => Math.min(min, e.week - newWeek), 52) ?? 52
            
            // Calculate invitation chance
            const invitationChance = calculateInvitationChance(
              updatedPlayer.reputation,
              weeksUntilNextRace,
              updatedCareerState.invitationsThisSeason || 0,
              updatedCareerState.declinedInvitationsThisSeason || 0,
              5 // Target 5 invitations per season
            )
            
            // Roll for invitation
            const roll = Math.random()
            if (roll < invitationChance) {
              console.log(`[Invitational] Invitation roll: ${(roll * 100).toFixed(1)}% < ${(invitationChance * 100).toFixed(1)}% - Generating invitation...`)
              
              // Get player context
              const manufacturerId = updatedPlayer.contract?.manufacturerId
              const sponsorIds = updatedPlayer.finances.sponsorDeals
                .filter(s => s.active)
                .map(s => s.id)
              
              // Get eligible templates (with frequency checking)
              const eligibleTemplates = getEligibleEventTemplates(
                updatedPlayer.reputation,
                manufacturerId,
                sponsorIds,
                updatedPlayer.nationality,
                updatedCareerState.currentYear,
                updatedCareerState.eventsUsedThisYear || [],
                updatedCareerState.eventHistory || []
              )
              
              if (eligibleTemplates.length > 0) {
                // Select a template
                const template = selectEventTemplate(eligibleTemplates, updatedPlayer.reputation)
                
                if (template) {
                  // Find a suitable event week
                  let eventWeek = newWeek + 1
                  const nextRace = currentSeriesForWeek?.calendar?.find(r => r.week > newWeek)
                  const nextRaceWeek = nextRace?.week || 52
                  
                  // Make sure event week doesn't conflict with races
                  if (eventWeek < nextRaceWeek && eventWeek <= 52) {
                    // Generate the event
                    const event = generateInvitationalEvent(template, eventWeek, updatedCareerState.currentYear)
                    
                    // Generate email for invitation
                    const invitationEmail = generateInvitationEmail(event, updatedCareerState)
                    
                    updatedCareerState = {
                      ...updatedCareerState,
                      pendingInvitations: [...(updatedCareerState.pendingInvitations || []), event],
                      invitationsThisSeason: (updatedCareerState.invitationsThisSeason || 0) + 1,
                      // Track that this event has been used this year (for frequency limits)
                      eventsUsedThisYear: [...(updatedCareerState.eventsUsedThisYear || []), template.id],
                      // Add email notification
                      emails: [{ ...invitationEmail, id: `email_inv_${event.instanceId}` }, ...(updatedCareerState.emails || [])]
                    }
                    
                    console.log(`[Invitational] Generated: ${event.name} at ${event.trackName} (Week ${eventWeek}) - Car: #${event.assignedCar.liveryNumber} ${event.assignedCar.liveryName}`)
                  }
                }
              }
            } else {
              console.log(`[Invitational] No invitation this week (roll: ${(roll * 100).toFixed(1)}% >= ${(invitationChance * 100).toFixed(1)}%)`)
            }
          }
          
          // ============================================
          // Expire Old Invitations
          // ============================================
          const validPendingInvitations = (updatedCareerState.pendingInvitations || []).filter(
            inv => inv.expiresWeek >= newWeek && inv.year === updatedCareerState.currentYear
          )
          if (validPendingInvitations.length !== (updatedCareerState.pendingInvitations || []).length) {
            const expiredCount = (updatedCareerState.pendingInvitations || []).length - validPendingInvitations.length
            console.log(`[Invitational] ${expiredCount} invitation(s) expired`)
            updatedCareerState = {
              ...updatedCareerState,
              pendingInvitations: validPendingInvitations
            }
          }
          
          // ============================================
          // Generate Team Opportunities (weekly)
          // Non-racing opportunities like media, manufacturer programs, special events
          // ============================================
          if (updatedCareerState.ownedTeam) {
            // Build generation context
            // Get recent races from raceHistory - use date string to filter for current year
            const recentRaces = (updatedPlayer.raceHistory || [])
              .filter(r => r.date && new Date(r.date).getFullYear() === updatedCareerState.currentYear)
              .slice(-5)
            
            const generationContext: OpportunityGenerationContext = {
              reputation: updatedPlayer.reputation,
              teamName: updatedCareerState.ownedTeam.name,
              playerNationality: updatedPlayer.nationality,
              recentResults: {
                wins: recentRaces.filter(r => r.racePosition === 1).length,
                podiums: recentRaces.filter(r => r.racePosition <= 3).length,
                races: recentRaces.length
              },
              hasWonChampionship: (updatedPlayer.championships || 0) > 0,
              manufacturerRelationships: updatedCareerState.manufacturerRelationships || {},
              activeSponsors: (updatedCareerState.ownedTeam.finances?.sponsors || []) as unknown as SponsorDeal[],
              currentWeek: newWeek,
              currentYear: newYear,
              teamAge: 1, // Default to 1 season as team age tracking isn't in OwnedTeam
              acceptedOpportunitiesThisSeason: updatedCareerState.acceptedOpportunitiesThisSeason || [],
              declinedOpportunitiesThisSeason: updatedCareerState.declinedOpportunitiesThisSeason || [],
              lastOpportunityWeeks: updatedCareerState.lastOpportunityOfferWeeks || {},
              pendingOpportunities: updatedCareerState.pendingOpportunities || []
            }
            
            // Generate opportunities
            const opportunityResult = generateWeeklyOpportunities(generationContext)
            
            if (opportunityResult.opportunities.length > 0) {
              // Create emails and update state for each opportunity
              const newOpportunityEmails: Email[] = []
              const newPendingOpportunities = [...(updatedCareerState.pendingOpportunities || [])]
              const updatedLastOfferWeeks = { ...(updatedCareerState.lastOpportunityOfferWeeks || {}) }
              
              for (const opportunity of opportunityResult.opportunities) {
                // Determine email action type based on category
                let actionType: Email['actionType'] = 'opportunity_special'
                if (opportunity.category === 'media_appearance') {
                  actionType = 'opportunity_media'
                } else if (opportunity.category === 'manufacturer_program') {
                  actionType = 'opportunity_manufacturer'
                }
                
                // Create email
                const email: Email = {
                  id: `email_opp_${opportunity.instanceId}`,
                  category: 'media',
                  subject: opportunity.emailSubjectTemplate,
                  sender: opportunity.organizerName,
                  senderRole: opportunity.organizerType === 'manufacturer' ? 'Motorsport Division'
                    : opportunity.organizerType === 'media' ? 'Programming Director'
                    : opportunity.organizerType === 'sponsor' ? 'Marketing Manager'
                    : opportunity.organizerType === 'charity' ? 'Event Coordinator'
                    : 'Event Organizer',
                  preview: opportunity.emailBodyTemplate.substring(0, 100),
                  body: opportunity.emailBodyTemplate,
                  receivedDay: 1,
                  receivedWeek: newWeek,
                  receivedYear: newYear,
                  read: false,
                  starred: false,
                  archived: false,
                  actionType,
                  actionData: {
                    opportunityId: opportunity.instanceId,
                    opportunityCategory: opportunity.category
                  },
                  expiresWeek: opportunity.expiresWeek,
                  expiresYear: opportunity.expiresYear
                }
                
                newOpportunityEmails.push(email)
                newPendingOpportunities.push(opportunity)
                updatedLastOfferWeeks[opportunity.id] = newWeek
                
                console.log(`[Opportunities] Generated: ${opportunity.name} (${opportunity.category}) - Prestige: ${opportunity.prestige}`)
              }
              
              updatedCareerState = {
                ...updatedCareerState,
                pendingOpportunities: newPendingOpportunities,
                lastOpportunityOfferWeeks: updatedLastOfferWeeks,
                emails: [...newOpportunityEmails, ...(updatedCareerState.emails || [])]
              }
            }
            
            // Expire old opportunities
            const validPendingOpportunities = (updatedCareerState.pendingOpportunities || []).filter(
              opp => !hasOpportunityExpired(opp, newWeek, newYear)
            )
            if (validPendingOpportunities.length !== (updatedCareerState.pendingOpportunities || []).length) {
              const expiredOppCount = (updatedCareerState.pendingOpportunities || []).length - validPendingOpportunities.length
              console.log(`[Opportunities] ${expiredOppCount} opportunity(ies) expired`)
              updatedCareerState = {
                ...updatedCareerState,
                pendingOpportunities: validPendingOpportunities
              }
            }
          }
          
          // ============================================
          // Process Car Marketplace (weekly)
          // ============================================
          if (updatedCareerState.marketplaceListings && updatedCareerState.marketplaceListings.length > 0) {
            const listings = updatedCareerState.marketplaceListings
            let expiredCount = 0
            let auctionUpdates = 0
            
            // Process listings - expire old ones and update auctions
            const updatedListings = listings.filter(listing => {
              // Check auction end
              if (listing.listingType === 'auction') {
                const isEnded = listing.auctionEndYear! < newYear ||
                  (listing.auctionEndYear === newYear && listing.auctionEndWeek! <= newWeek)
                
                if (isEnded) {
                  // Player wins only if they have the highest bid AND they were the last to bid
                  const playerWon = listing.playerBid && 
                    listing.playerBid >= (listing.currentBid || 0) &&
                    listing.lastBidder === 'player'
                  
                  if (playerWon) {
                    console.log(`[Marketplace] Player won auction for ${listing.carClassName}!`)
                    // Auto-purchase won auctions
                    const purchaseSuccess = get().purchaseFromMarketplace(
                      listing.id,
                      listing.seriesCompatible[0],
                      listing.carClassName
                    )
                    if (!purchaseSuccess) {
                      console.log(`[Marketplace] Failed to complete auction purchase - insufficient funds?`)
                    }
                  } else if (listing.playerBid) {
                    // Player lost - send notification via routing system
                    routeNotification({
                      category: 'supply_chain',
                      subject: `Auction Lost: ${listing.carClassName}`,
                      body: `The auction for **${listing.carClassName}** has ended.\n\n**Results:**\n- Your bid: $${listing.playerBid.toLocaleString()}\n- Winning bid: $${(listing.currentBid || 0).toLocaleString()}\n\nUnfortunately, another bidder outbid you at the last moment. Better luck next time!\n\nNew listings are added regularly - check the Marketplace for similar vehicles.`,
                      emailCategory: 'team'
                    })
                    console.log(`[Marketplace] Player lost auction for ${listing.carClassName}. Winning bid: $${listing.currentBid}`)
                  }
                  expiredCount++
                  return false
                }
                
                // Process rival bids
                // - Higher chance (55%) when player is leading to create competition
                // - Lower chance (30%) when no player bid
                // - Rivals won't overpay (max 115% of base price)
                const bidChance = listing.playerBid ? 0.55 : 0.30
                const maxRivalBid = Math.round(listing.basePrice * 1.15)
                const currentBid = listing.currentBid || listing.minimumBid || 0
                
                if (Math.random() < bidChance && currentBid < maxRivalBid) {
                  const bidIncrement = Math.round(currentBid * (0.05 + Math.random() * 0.1))
                  const newBid = currentBid + Math.max(1000, bidIncrement)
                  
                  // Only bid if within max price
                  if (newBid <= maxRivalBid) {
                    const wasPlayerLeading = listing.lastBidder === 'player'
                    listing.currentBid = newBid
                    listing.bidCount = (listing.bidCount || 0) + 1
                    listing.lastBidder = 'rival'  // Track that rival made the last bid
                    auctionUpdates++
                    
                    // If player was outbid, send notification via routing system
                    if (wasPlayerLeading && listing.playerBid) {
                      routeNotification({
                        category: 'supply_chain',
                        subject: `Outbid: ${listing.carClassName} Auction`,
                        body: `You have been **outbid** on the following auction:\n\n**${listing.carClassName}**\n- ${listing.liveryName}\n- Condition: ${listing.condition}\n\n**Auction Status:**\n- Your bid: $${listing.playerBid.toLocaleString()}\n- Current bid: $${newBid.toLocaleString()}\n- Minimum to win: $${Math.round(newBid * 1.05).toLocaleString()}\n- Auction ends: Week ${listing.auctionEndWeek}\n\nIf you wish to remain competitive, please place a higher bid before the auction closes.`,
                        emailCategory: 'team',
                        urgency: 'high'
                      })
                      console.log(`[Marketplace] Player outbid on ${listing.carClassName}. New bid: $${newBid}`)
                    }
                  }
                }
              }
              
              // Check used car expiration
              if (listing.listingType === 'used') {
                const isExpired = listing.availableUntilYear < newYear ||
                  (listing.availableUntilYear === newYear && listing.availableUntilWeek <= newWeek)
                
                if (isExpired) {
                  expiredCount++
                  return false
                }
              }
              
              return true
            })
            
            if (expiredCount > 0 || auctionUpdates > 0) {
              console.log(`[Marketplace] Week ${newWeek}: ${expiredCount} listings expired, ${auctionUpdates} auctions updated`)
            }
            
            updatedCareerState = {
              ...updatedCareerState,
              marketplaceListings: updatedListings
            }
            
            // Refresh marketplace every 4 weeks or if running low on listings
            const weeksSinceRefresh = newWeek - (updatedCareerState.marketplaceLastRefreshWeek || 0)
            const shouldRefresh = weeksSinceRefresh >= 4 || updatedListings.length < 10
            
            if (shouldRefresh && updatedCareerState.ownedTeam) {
              console.log(`[Marketplace] Refreshing listings (weeks since last: ${weeksSinceRefresh}, current count: ${updatedListings.length})`)
              // Schedule a refresh after the state update
              setTimeout(() => {
                get().refreshMarketplaceListings()
              }, 100)
            }
          }
          
          // ============================================
          // Process Media Duties & Promises (End of Week)
          // ============================================
          const currentMediaState = updatedCareerState.teamMediaState
          if (currentMediaState) {
            let updatedMediaState = { ...currentMediaState }
            
            // Process any remaining missed duties from the week
            const missedDuties = updatedMediaState.dutySchedule.weekendDuties.filter(
              d => (d.status === 'upcoming' || d.status === 'available') && 
                   d.week < newWeek  // Previous week's duties
            )
            
            if (missedDuties.length > 0) {
              let totalFine = 0
              let totalFanPenalty = 0
              
              const updatedDuties = updatedMediaState.dutySchedule.weekendDuties.map(d => {
                const isMissed = missedDuties.find(m => m.id === d.id)
                if (isMissed) {
                  totalFine += isMissed.skipPenalty.fine
                  totalFanPenalty += isMissed.skipPenalty.fanSentiment
                  return { ...d, status: 'missed' as const }
                }
                return d
              })
              
              const newFanSentiment = Math.max(0, Math.min(100, 
                updatedMediaState.fanSentiment + totalFanPenalty
              ))
              
              updatedMediaState = {
                ...updatedMediaState,
                fanSentiment: newFanSentiment,
                dutySchedule: {
                  ...updatedMediaState.dutySchedule,
                  weekendDuties: updatedDuties,
                  missedDutiesThisSeason: updatedMediaState.dutySchedule.missedDutiesThisSeason + missedDuties.length,
                  finesPaidThisSeason: updatedMediaState.dutySchedule.finesPaidThisSeason + totalFine
                }
              }
              
              // Add fine transaction
              if (totalFine > 0) {
                get().addTransaction({
                  date: new Date().toISOString(),
                  type: 'expense',
                  category: 'other',
                  amount: totalFine,
                  description: `Missed media duties fine (${missedDuties.length} duties)`,
                  week: careerState.currentWeek,
                  year: careerState.currentYear
                })
              }
              
              console.log(`[Media] Week ${careerState.currentWeek}: ${missedDuties.length} duties missed, fines: $${totalFine}`)
            }
            
            // Check promises for deadline
            const checkedPromises = updatedMediaState.dutySchedule.activePromises.map(promise => {
              if (promise.fulfilled || promise.broken) return promise
              
              // Check if past deadline
              const isPastDeadline = 
                newYear > promise.deadlineYear ||
                (newYear === promise.deadlineYear && newWeek > promise.deadline)
              
              if (isPastDeadline && !promise.checkedAt) {
                // Promise is broken
                console.log(`[Media] Promise broken: "${promise.target}"`)
                return { 
                  ...promise, 
                  broken: true, 
                  checkedAt: newWeek,
                  consequenceApplied: true 
                }
              }
              
              return promise
            })
            
            // Apply broken promise penalties
            const newlyBroken = checkedPromises.filter(p => p.broken && !currentMediaState.dutySchedule.activePromises.find(op => op.id === p.id)?.broken)
            if (newlyBroken.length > 0) {
              const fanPenalty = newlyBroken.length * -10
              const newFanSentimentAfterPromises = Math.max(0, updatedMediaState.fanSentiment + fanPenalty)
              
              updatedMediaState = {
                ...updatedMediaState,
                fanSentiment: newFanSentimentAfterPromises,
                dutySchedule: {
                  ...updatedMediaState.dutySchedule,
                  activePromises: checkedPromises
                }
              }
            } else {
              updatedMediaState = {
                ...updatedMediaState,
                dutySchedule: {
                  ...updatedMediaState.dutySchedule,
                  activePromises: checkedPromises
                }
              }
            }
            
            // Process media decay
            // Decay controversies
            const controversies = updatedMediaState.activeControversies.map(c => ({
              ...c,
              currentIntensity: Math.max(0, c.currentIntensity - c.decayRate)
            })).filter(c => c.currentIntensity > 5 || !c.resolved)
            
            // Mark resolved controversies
            const resolvedControversies = controversies.map(c => ({
              ...c,
              resolved: c.currentIntensity <= 5,
              resolvedWeek: c.currentIntensity <= 5 ? newWeek : c.resolvedWeek
            }))
            
            updatedMediaState = {
              ...updatedMediaState,
              activeControversies: resolvedControversies
            }
            
            // Apply updated media state
            updatedCareerState = {
              ...updatedCareerState,
              teamMediaState: updatedMediaState
            }
          }
          
          // ============================================
          // Weekly Fan Sentiment & Board Mood Processing
          // ============================================
          if (updatedCareerState.ownedTeam) {
            let ownedTeam = updatedCareerState.ownedTeam
            
            // Fan sentiment: slight weekly drift based on recent performance
            // Without positive events, sentiment slowly decays toward a neutral 50
            const currentFanSentiment = ownedTeam.fanSentiment ?? 50
            if (currentFanSentiment > 55) {
              // Above neutral: slow decay without positive reinforcement
              ownedTeam = { ...ownedTeam, fanSentiment: Math.round((currentFanSentiment - 0.5) * 10) / 10 }
            } else if (currentFanSentiment < 40) {
              // Very low: slight natural recovery (fans are hopeful)
              ownedTeam = { ...ownedTeam, fanSentiment: Math.round((currentFanSentiment + 0.25) * 10) / 10 }
            }
            
            // Board mood: drift toward neutral based on financial health
            const currentBoardMood = ownedTeam.boardMood ?? 50
            const teamCash = ownedTeam.budgets?.cash ?? 0
            const isFinanciallyHealthy = teamCash > 0
            
            let boardMoodChange = 0
            if (currentBoardMood > 60 && !isFinanciallyHealthy) {
              boardMoodChange = -1 // Board unhappy about finances
            } else if (currentBoardMood > 55) {
              boardMoodChange = -0.3 // Natural slow decay when high
            } else if (currentBoardMood < 40 && isFinanciallyHealthy) {
              boardMoodChange = 0.5 // Recovering if finances are OK
            } else if (currentBoardMood < 30) {
              boardMoodChange = 0.25 // Very low: slight natural recovery
            }
            
            if (boardMoodChange !== 0) {
              ownedTeam = { 
                ...ownedTeam, 
                boardMood: Math.round(Math.max(0, Math.min(100, currentBoardMood + boardMoodChange)) * 10) / 10 
              }
            }
            
            updatedCareerState = {
              ...updatedCareerState,
              ownedTeam
            }
          }
          
          // ============================================
          // Generate Rival Drama Events (weekly)
          // ============================================
          {
            const rivalStore = useRivalStore.getState()
            const playerSeriesId = updatedPlayer.currentSeriesId || ''
            const currentStandings = rivalStore.getStandings(playerSeriesId)
            
            if (currentStandings.length >= 2) {
              const playerStanding = currentStandings.find(s => s.isPlayer || s.driverName === `${updatedPlayer.firstName} ${updatedPlayer.lastName}`)
              
              // Find closest non-player rival in standings
              const closestRivalStanding = currentStandings.find(s => !s.isPlayer && s.driverName !== `${updatedPlayer.firstName} ${updatedPlayer.lastName}`)
              
              let closestRivalData: Parameters<typeof generateRivalDrama>[0]['closestRival'] = undefined
              if (closestRivalStanding) {
                const rivalDriver = rivalStore.rivals.find(r => 
                  `${r.firstName} ${r.lastName}` === closestRivalStanding.driverName
                )
                if (rivalDriver) {
                  closestRivalData = {
                    name: closestRivalStanding.driverName,
                    position: closestRivalStanding.position,
                    points: closestRivalStanding.points,
                    wins: closestRivalStanding.wins,
                    formStreak: rivalDriver.formStreak ?? 0,
                    lastRacePosition: rivalDriver.lastRacePosition ?? 10,
                    relationshipWithPlayer: rivalDriver.relationshipWithPlayer ?? 0,
                    rivalryIntensity: rivalDriver.rivalryIntensity ?? 30,
                  }
                }
              }
              
              const dramaResult = generateRivalDrama({
                playerName: `${updatedPlayer.firstName} ${updatedPlayer.lastName}`,
                playerPosition: playerStanding?.position ?? 1,
                playerPoints: playerStanding?.points ?? 0,
                playerWins: playerStanding?.wins ?? 0,
                playerReputation: updatedPlayer.reputation,
                currentWeek: newWeek,
                currentYear: newYear,
                standings: currentStandings.slice(0, 5),
                closestRival: closestRivalData,
                seriesName: currentSeriesForWeek?.name || 'Championship',
              })
              
              if (dramaResult.emails.length > 0) {
                const rivalEmails: Email[] = dramaResult.emails.map((e, i) => ({
                  ...e,
                  id: `email_rival_drama_w${newWeek}_${newYear}_${i}`
                }))
                
                updatedCareerState = {
                  ...updatedCareerState,
                  emails: [...rivalEmails, ...(updatedCareerState.emails || [])]
                }
                
                console.log(`[CareerStore] Rival drama email generated for Week ${newWeek}`)
              }
            }
          }
          
          // ============================================
          // Generate Weekly Summary Email
          // ============================================
          {
            const teamCash = updatedCareerState.ownedTeam?.budgets?.cash ?? updatedPlayer.finances.bankBalance
            const boardMoodVal = updatedCareerState.ownedTeam?.boardMood ?? 50
            // Find the next upcoming race week for the summary
            const nextRaceWeek = currentSeriesForWeek?.calendar
              ?.filter((e: { week: number }) => e.week >= newWeek)
              ?.sort((a: { week: number }, b: { week: number }) => a.week - b.week)[0]?.week
            
            const weeklySummary = generateWeeklySummaryEmail(
              updatedCareerState,
              teamCash,
              boardMoodVal,
              nextRaceWeek
            )
            
            const summaryEmail: Email = {
              ...weeklySummary,
              id: `email_weekly_summary_w${newWeek}_${newYear}`
            }
            
            updatedCareerState = {
              ...updatedCareerState,
              emails: [summaryEmail, ...(updatedCareerState.emails || [])]
            }
            
            console.log(`[CareerStore] Weekly summary email generated for Week ${newWeek}`)
          }
          
          // ============================================
          // Process Orphaned Simulation Systems (Pressure, Relationships, Health, Media)
          // ============================================
          try {
            const weeklySystemsCtx: WeeklyProcessingContext = {
              playerReputation: updatedPlayer.reputation,
              playerFatigue: updatedPlayer.mentalState.fatigue,
              playerFitness: updatedPlayer.stats.fitness,
              playerStress: updatedPlayer.mentalState.stress || 0,
              playerConfidence: updatedPlayer.mentalState.confidence,
              playerMentalStrength: updatedPlayer.stats.mentalStrength || 50,
              playerNationality: updatedPlayer.nationality,
              playerBackground: updatedPlayer.background,
              playerStats: updatedPlayer.stats,
              championshipPosition: updatedCareerState.championshipPosition || 10,
              pointsToLeader: updatedCareerState.pointsToLeader || 0,
              roundsRemaining: updatedCareerState.roundsRemaining || 20,
              totalRounds: updatedCareerState.totalRounds || 20,
              isHomeRace: false,
              isContractYear: updatedPlayer.contract?.endYear === newYear,
              recentResults: updatedPlayer.raceHistory?.slice(-5) || [],
              hasOwnedTeam: !!updatedCareerState.ownedTeam,
              boardMood: updatedCareerState.ownedTeam?.boardMood ?? 50,
              teamMorale: updatedCareerState.ownedTeam?.morale ?? 50,
              teamCash: updatedCareerState.ownedTeam?.budgets?.cash ?? 0,
              staffCount: updatedCareerState.ownedTeam?.staff?.length ?? 0,
              currentWeek: newWeek,
              currentYear: newYear,
              isRaceWeek: nextWeekIsRaceWeek,
              mediaState: updatedCareerState.teamMediaState,
              existingPressureState: updatedCareerState.pressureState,
              existingRelationshipState: updatedCareerState.relationshipState
            }
            
            const weeklyResult = processWeeklySystems(weeklySystemsCtx)
            
            // Apply stat changes from subsystems
            updatedPlayer = {
              ...updatedPlayer,
              mentalState: {
                ...updatedPlayer.mentalState,
                stress: Math.max(0, Math.min(100, (updatedPlayer.mentalState.stress || 0) + weeklyResult.statChanges.stress)),
                confidence: Math.max(0, Math.min(100, updatedPlayer.mentalState.confidence + weeklyResult.statChanges.confidence))
              },
              reputation: Math.max(0, Math.min(100, updatedPlayer.reputation + weeklyResult.statChanges.reputation))
            }
            
            // Store pressure and relationship states
            updatedCareerState = {
              ...updatedCareerState,
              pressureState: weeklyResult.pressureState,
              relationshipState: weeklyResult.relationshipState
            }
            
            // Apply board mood changes
            if (updatedCareerState.ownedTeam && weeklyResult.statChanges.boardMood !== 0) {
              updatedCareerState = {
                ...updatedCareerState,
                ownedTeam: {
                  ...updatedCareerState.ownedTeam,
                  boardMood: Math.max(0, Math.min(100, 
                    (updatedCareerState.ownedTeam.boardMood ?? 50) + weeklyResult.statChanges.boardMood
                  ))
                }
              }
            }
            
            // Generate emails from subsystems
            const subsystemEmails: Email[] = []
            if (weeklyResult.pressureEmail) {
              subsystemEmails.push({
                ...weeklyResult.pressureEmail,
                id: `email_pressure_w${newWeek}_${newYear}`,
                receivedDay: 1,
                receivedWeek: newWeek,
                receivedYear: newYear,
                read: false,
                starred: false,
                archived: false
              } as Email)
            }
            for (const relEmail of weeklyResult.relationshipEmails) {
              subsystemEmails.push({
                ...relEmail,
                id: `email_rel_w${newWeek}_${newYear}_${Math.random().toString(36).substr(2, 4)}`,
                receivedDay: 1,
                receivedWeek: newWeek,
                receivedYear: newYear,
                read: false,
                starred: false,
                archived: false
              } as Email)
            }
            if (weeklyResult.injuryEmail) {
              subsystemEmails.push({
                ...weeklyResult.injuryEmail,
                id: `email_injury_w${newWeek}_${newYear}`,
                receivedDay: 1,
                receivedWeek: newWeek,
                receivedYear: newYear,
                read: false,
                starred: false,
                archived: false
              } as Email)
            }
            
            // Apply injury if one occurred
            if (weeklyResult.injuryOccurred && weeklyResult.newInjury) {
              updatedCareerState = {
                ...updatedCareerState,
                rpgState: {
                  ...updatedCareerState.rpgState,
                  injury: weeklyResult.newInjury as any
                }
              }
            }
            
            if (subsystemEmails.length > 0) {
              updatedCareerState = {
                ...updatedCareerState,
                emails: [...subsystemEmails, ...(updatedCareerState.emails || [])]
              }
            }
            
            console.log(`[WeeklySystems] Pressure: ${weeklyResult.pressureState.currentPressure}, ` +
              `Injury: ${weeklyResult.injuryOccurred}, Emails: ${subsystemEmails.length}`)
          } catch (e) {
            console.warn('[CareerStore] Weekly systems processing error:', e)
          }
          
          // ============================================
          // Weather Forecast (race weeks)
          // ============================================
          if (nextWeekIsRaceWeek && currentSeriesForWeek) {
            try {
              const nextRace = currentSeriesForWeek.calendar?.find((e: any) => e.week === newWeek)
              if (nextRace?.trackName) {
                const forecast = generateWeatherForecast(nextRace.trackName, newWeek)
                const weatherEmail = generateWeatherForecastEmail(forecast)
                updatedCareerState = {
                  ...updatedCareerState,
                  currentWeatherForecast: forecast,
                  emails: [{
                    ...weatherEmail,
                    id: `email_weather_w${newWeek}_${newYear}`,
                    receivedDay: 1,
                    receivedWeek: newWeek,
                    receivedYear: newYear,
                    read: false,
                    starred: false,
                    archived: false
                  } as Email, ...(updatedCareerState.emails || [])]
                }
              }
            } catch (e) {
              console.warn('[CareerStore] Weather forecast error:', e)
            }
          }
          
          // ============================================
          // Regulation Changes (mid-season directives)
          // ============================================
          try {
            const directive = generateMidSeasonDirective(newWeek, newYear)
            if (directive) {
              const regEmail = generateRegulationEmail(directive)
              updatedCareerState = {
                ...updatedCareerState,
                regulationChanges: [...(updatedCareerState.regulationChanges || []), directive],
                emails: [{
                  ...regEmail,
                  id: `email_reg_w${newWeek}_${newYear}`,
                  receivedDay: 1,
                  receivedWeek: newWeek,
                  receivedYear: newYear,
                  read: false,
                  starred: false,
                  archived: false
                } as Email, ...(updatedCareerState.emails || [])]
              }
              console.log(`[Regulations] Mid-season directive: ${directive.title}`)
            }
          } catch (e) {
            console.warn('[CareerStore] Regulation changes error:', e)
          }
          
          // ============================================
          // Retirement System Check (annually at week 40+)
          // ============================================
          if (newWeek >= 40 && newWeek <= 42) {
            try {
              const retCtx: RetirementContext = {
                playerAge: (updatedPlayer as any).age || 25,
                yearsInSport: newYear - ((updatedCareerState as any).careerStartYear || newYear),
                totalWins: updatedPlayer.totalWins || 0,
                totalChampionships: (updatedPlayer as any).championships || 0,
                totalRaces: updatedPlayer.totalRaces || 0,
                totalPodiums: updatedPlayer.totalPodiums || 0,
                totalPoles: updatedPlayer.totalPoles || 0,
                recentSeasonPositions: (updatedCareerState as any).recentSeasonPositions || [],
                currentFitness: updatedPlayer.stats.fitness,
                currentStress: updatedPlayer.mentalState.stress || 0,
                totalEarnings: updatedPlayer.finances.bankBalance,
                teamValue: updatedCareerState.ownedTeam?.budgets?.cash ?? 0,
                dynastyGeneration: (updatedCareerState as any).dynastyGeneration || 1,
                hasSuccessor: false,
                currentWeek: newWeek,
                currentYear: newYear,
                injuryCount: (updatedCareerState as any).totalInjuries || 0,
                boardMood: updatedCareerState.ownedTeam?.boardMood ?? 50
              }
              
              const retCheck = checkRetirementTriggers(retCtx)
              const retEmail = generateRetirementPromptEmail(retCheck, retCtx)
              
              if (retEmail) {
                updatedCareerState = {
                  ...updatedCareerState,
                  emails: [{
                    ...retEmail,
                    id: `email_retirement_w${newWeek}_${newYear}`,
                    receivedDay: 1,
                    receivedWeek: newWeek,
                    receivedYear: newYear,
                    read: false,
                    starred: false,
                    archived: false
                  } as Email, ...(updatedCareerState.emails || [])]
                }
                console.log(`[Retirement] Prompt generated: ${retCheck.urgency}`)
              }
            } catch (e) {
              console.warn('[CareerStore] Retirement check error:', e)
            }
          }
          
          // ============================================
          // Family Milestone Emails
          // ============================================
          try {
            const familyCtx: FamilyContext = {
              hasPartner: !!(updatedCareerState as any).expandedPersonalLife?.partner,
              partnerName: (updatedCareerState as any).expandedPersonalLife?.partner?.name,
              partnerHappiness: (updatedCareerState as any).expandedPersonalLife?.partner?.happiness,
              isMarried: (updatedCareerState as any).expandedPersonalLife?.partner?.married,
              children: (updatedCareerState as any).expandedPersonalLife?.children || [],
              dynastyGeneration: (updatedCareerState as any).dynastyGeneration,
              playerAge: (updatedPlayer as any).age || 25,
              yearsInSport: newYear - ((updatedCareerState as any).careerStartYear || newYear),
              totalWins: updatedPlayer.totalWins || 0,
              totalChampionships: (updatedPlayer as any).championships || 0,
              currentWeek: newWeek,
              currentYear: newYear
            }
            
            const familyEmails = generateFamilyMilestones(familyCtx)
            if (familyEmails.length > 0) {
              const mappedEmails: Email[] = familyEmails.map((e, i) => ({
                ...e,
                id: `email_family_w${newWeek}_${newYear}_${i}`,
                receivedDay: 1,
                receivedWeek: newWeek,
                receivedYear: newYear,
                read: false,
                starred: false,
                archived: false
              } as Email))
              
              updatedCareerState = {
                ...updatedCareerState,
                emails: [...mappedEmails, ...(updatedCareerState.emails || [])]
              }
            }
          } catch (e) {
            console.warn('[CareerStore] Family milestones error:', e)
          }
          
          // ============================================
          // Feedback Loop Emails (staff, R&D, facilities, sponsors, privacy, lifestyle, board)
          // ============================================
          try {
            const feedbackCtx: FeedbackContext = {
              staffCount: updatedCareerState.ownedTeam?.staff?.length ?? 0,
              staffRoles: (updatedCareerState.ownedTeam?.staff || []).map((s: any) => ({
                role: s.role || 'general',
                name: s.name || 'Staff',
                skill: s.skill || 50
              })),
              teamDevPoints: updatedCareerState.teamDevelopment?.totalPoints ?? updatedCareerState.rpgState?.teamDevelopment?.points ?? 0,
              activeResearch: (updatedCareerState.teamDevelopment?.activeResearch || []).map((r: any) => ({
                name: r.name || 'Research',
                progress: r.progress || 0,
                total: r.totalWeeks || 10
              })),
              completedUpgrades: [],
              facilities: {},
              sponsors: (updatedCareerState.ownedTeam?.finances?.sponsors || []).map((s: any) => ({
                name: s.name || 'Sponsor',
                satisfaction: s.satisfaction ?? 50,
                targets: (s.targets || []).map((t: any) => ({
                  description: t.description || '',
                  current: t.current || 0,
                  target: t.target || 1,
                  met: t.met || false
                }))
              })),
              carPerformanceRating: updatedCareerState.teamDevelopment?.totalPoints ?? 0,
              privacyLevel: (updatedCareerState as any).expandedPersonalLife?.privacy?.level ?? 50,
              lifestyleAssets: [],
              personalStaff: [],
              boardMood: updatedCareerState.ownedTeam?.boardMood ?? 50,
              boardTargets: (updatedCareerState.ownedTeam as any)?.boardTargets || [],
              currentWeek: newWeek,
              currentYear: newYear
            }
            
            const feedbackEmails = generateAllFeedback(feedbackCtx)
            if (feedbackEmails.length > 0) {
              const mappedEmails: Email[] = feedbackEmails.map((e, i) => ({
                ...e,
                id: `email_feedback_w${newWeek}_${newYear}_${i}`,
                receivedDay: 1,
                receivedWeek: newWeek,
                receivedYear: newYear,
                read: false,
                starred: false,
                archived: false
              } as Email))
              
              updatedCareerState = {
                ...updatedCareerState,
                emails: [...mappedEmails, ...(updatedCareerState.emails || [])]
              }
            }
          } catch (e) {
            console.warn('[CareerStore] Feedback loops error:', e)
          }
          
          // Apply all updates
          set({
            careerState: updatedCareerState,
            player: updatedPlayer
          })
          
          // Simulate races in other championships for this week
          // This keeps the "world" progressing even when player isn't racing
          useRivalStore.getState().simulateOtherSeries(newWeek, player.currentSeriesId || null)
          
          // Process weekly media decay (controversy resolution, media score recalc)
          get().processWeeklyMediaDecay()
          
          // Process weekly social media (follower growth, engagement, trolls)
          get().processWeeklySocialMedia()
        }
      },

      advanceDay: () => {
        const { careerState, player } = get()
        if (!careerState || !player) return
        
        // ============================================
        // TIME BUDGET: Process end-of-day fatigue before advancing
        // ============================================
        const currentDayBudget = careerState.dayBudget || createDefaultDayBudgetState()
        
        // Calculate fatigue carry-over from today's activities
        const carryOver = calculateFatigueCarryOver(currentDayBudget.dayLog)
        const restRecovery = calculateRestRecovery(currentDayBudget.hoursUsed)
        const netFatigueChange = carryOver - restRecovery
        const newFatigueDebt = Math.min(
          TIME_BUDGET_CONFIG.MAX_FATIGUE_DEBT,
          Math.max(0, currentDayBudget.fatigueDebt + netFatigueChange)
        )
        
        // Update mentalState.fatigue based on how hard today was
        const mentalFatigueImpact = calculateMentalFatigueImpact(currentDayBudget.hoursUsed)
        const updatedMentalFatigue = Math.min(100, Math.max(0, player.mentalState.fatigue + mentalFatigueImpact))
        
        // Create fresh day budget for tomorrow
        const newDayBudget = resetDayBudget(newFatigueDebt, 0) // jet lag handled separately
        
        // Log the end-of-day summary
        if (currentDayBudget.dayLog.length > 0) {
          console.log(`[TimeBudget] End of day: ${currentDayBudget.hoursUsed}h used, carry-over: ${carryOver}h, rest recovery: ${restRecovery}h, new fatigue debt: ${newFatigueDebt}h, tomorrow pool: ${newDayBudget.totalHours}h`)
        }
        
        // ============================================
        // Calendar day advancement
        // ============================================
        
        // Use the calendar utility to properly handle partial weeks at year boundaries
        const { newDay, newWeek, newYear, weekChanged, yearChanged } = advanceDayInWeekSystem(
          careerState.currentWeek,
          careerState.currentDay,
          careerState.currentYear
        )
        
        // If the week changed, we need to call advanceWeek for all the weekly processing
        if (weekChanged) {
          // Apply time budget updates before weekly processing
          set({
            careerState: {
              ...careerState,
              dayBudget: newDayBudget
            },
            player: {
              ...player,
              mentalState: {
                ...player.mentalState,
                fatigue: updatedMentalFatigue
              }
            }
          })
          
          // Call advanceWeek which handles all the weekly logic including year rollover
          get().advanceWeek()
          // After advanceWeek, get the updated state and set the correct day
          // (advanceWeek doesn't know about partial last weeks, so we override with correct day)
          const { careerState: newCareerState } = get()
          if (newCareerState) {
            set({
              careerState: {
                ...newCareerState,
                currentDay: newDay,
                currentWeek: newWeek,
                currentYear: newYear,
                dayBudget: newDayBudget  // Ensure day budget persists through weekly processing
              }
            })
          }
          return
        }
        
        // Just advance the day without weekly processing
        set({
          careerState: {
            ...careerState,
            currentDay: newDay,
            dayBudget: newDayBudget  // Reset day budget for the new day
          },
          player: {
            ...player,
            mentalState: {
              ...player.mentalState,
              fatigue: updatedMentalFatigue
            }
          }
        })
        
        // Process missed media duties for the day that just ended
        // Duties that were available yesterday but not completed are now missed
        get().processMissedDuties()
        
        // Update duty statuses - make upcoming duties available based on day
        if (careerState.teamMediaState?.dutySchedule?.weekendDuties) {
          const updatedDuties = careerState.teamMediaState.dutySchedule.weekendDuties.map(duty => {
            // If duty is for today and still upcoming, make it available
            if (duty.status === 'upcoming' && 
                duty.week === careerState.currentWeek && 
                duty.day === newDay) {
              return { ...duty, status: 'available' as const }
            }
            return duty
          })
          
          const { careerState: currentState } = get()
          if (currentState?.teamMediaState) {
            set({
              careerState: {
                ...currentState,
                teamMediaState: {
                  ...currentState.teamMediaState,
                  dutySchedule: {
                    ...currentState.teamMediaState.dutySchedule,
                    weekendDuties: updatedDuties
                  }
                }
              }
            })
          }
        }
        
        // Process any scheduled activities that were missed
        get().processScheduledActivities()
        
        // Generate activity reminders for upcoming events
        get().generateActivityReminders()
        
        // Check for any mandatory activities that should be triggered
        get().generateMandatoryActivities()
        
        // Apply weekly overspend consequences (processed on day 1)
        get().processOverspendConsequences()
        
        console.log(`[CareerStore] Day advanced to ${getDayName(newDay)} (Day ${newDay}), Week ${careerState.currentWeek}`)
      },

      // ============================================
      // TIME BUDGET SYSTEM ACTIONS
      // ============================================
      
      consumeHoursFromBudget: (hours: number, drainLevel: DrainLevel, activityName: string, activityId?: string) => {
        const { careerState } = get()
        if (!careerState) return false
        
        const { dayBudget } = careerState
        if (!dayBudget || dayBudget.hoursRemaining < hours) {
          console.log(`[TimeBudget] Cannot afford ${hours}h for "${activityName}" - only ${dayBudget?.hoursRemaining ?? 0}h remaining`)
          return false
        }
        
        // Calculate effective hours (drain multiplier for fatigue tracking)
        const drainMultipliers: Record<DrainLevel, number> = {
          restorative: -0.5,
          low: 0.75,
          normal: 1.0,
          high: 1.5,
          exhausting: 2.0
        }
        const effectiveHours = hours * drainMultipliers[drainLevel]
        
        const newEntry: DayLogEntry = {
          activityId: activityId || `action_${Date.now()}`,
          name: activityName,
          hoursSpent: hours,
          drainLevel,
          effectiveHours,
          timestamp: dayBudget.dayLog.length + 1
        }
        
        const updatedBudget: DayBudgetState = {
          ...dayBudget,
          hoursUsed: dayBudget.hoursUsed + hours,
          hoursRemaining: dayBudget.hoursRemaining - hours,
          dayLog: [...dayBudget.dayLog, newEntry],
          activitiesCompletedToday: activityId 
            ? [...dayBudget.activitiesCompletedToday, activityId]
            : dayBudget.activitiesCompletedToday
        }
        
        set({
          careerState: {
            ...careerState,
            dayBudget: updatedBudget
          }
        })
        
        console.log(`[TimeBudget] Consumed ${hours}h (${drainLevel} drain) for "${activityName}" - ${updatedBudget.hoursRemaining}h remaining`)
        return true
      },
      
      getHoursRemaining: () => {
        const { careerState } = get()
        return careerState?.dayBudget?.hoursRemaining ?? 16
      },
      
      getFatigueZone: () => {
        const { careerState } = get()
        const hoursUsed = careerState?.dayBudget?.hoursUsed ?? 0
        if (hoursUsed <= 10) return 'green'
        if (hoursUsed <= 13) return 'yellow'
        return 'red'
      },
      
      canAffordTime: (hours: number) => {
        const { careerState } = get()
        return (careerState?.dayBudget?.hoursRemaining ?? 16) >= hours
      },
      
      addPersonalCalendarEntry: (entry) => {
        const { careerState } = get()
        if (!careerState) return
        
        const isCurrentDay = entry.week === careerState.currentWeek && entry.day === (careerState.currentDay ?? 1)
        
        const activity: ScheduledActivity = {
          id: `personal_${entry.activityId}_${entry.week}_${entry.day}_${Date.now()}`,
          templateId: entry.activityId,
          name: entry.name,
          description: entry.description || entry.name,
          category: entry.category || 'personal',
          scheduledWeek: entry.week,
          scheduledDay: entry.day,
          duration: entry.duration,
          spanDays: 1,
          status: (entry.immediate || isCurrentDay) ? 'completed' : 'scheduled',
          mandatory: false,
          canReschedule: false,
          drainLevel: entry.drainLevel,
          calendarEntryType: entry.calendarEntryType,
          autoScheduled: false,
          triggeredBy: 'manual',
          requiresOwner: true,
          requiresDriver: false,
          effectsOnComplete: {} as any,
          effectsOnMiss: {} as any,
        }
        
        set({
          careerState: {
            ...careerState,
            scheduledActivities: [...(careerState.scheduledActivities || []), activity]
          }
        })
        
        console.log(`[Calendar] Added entry: "${entry.name}" on W${entry.week}D${entry.day} (${entry.calendarEntryType}, ${entry.drainLevel}, ${entry.duration}h)`)
      },

      // Email System Actions
      addEmail: (emailData) => {
        const { careerState } = get()
        if (!careerState) return
        
        const newEmail: Email = {
          ...emailData,
          id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
        
        set({
          careerState: {
            ...careerState,
            emails: [newEmail, ...(careerState.emails || [])]  // New emails at the top
          }
        })
        
        console.log(`[CareerStore] Email added: ${newEmail.subject} from ${newEmail.sender}`)
      },

      markEmailRead: (emailId) => {
        const { careerState } = get()
        if (!careerState) return
        
        set({
          careerState: {
            ...careerState,
            emails: (careerState.emails || []).map(e => 
              e.id === emailId ? { ...e, read: true } : e
            )
          }
        })
      },

      markEmailUnread: (emailId) => {
        const { careerState } = get()
        if (!careerState) return
        
        set({
          careerState: {
            ...careerState,
            emails: (careerState.emails || []).map(e => 
              e.id === emailId ? { ...e, read: false } : e
            )
          }
        })
      },

      toggleEmailStarred: (emailId) => {
        const { careerState } = get()
        if (!careerState) return
        
        set({
          careerState: {
            ...careerState,
            emails: (careerState.emails || []).map(e => 
              e.id === emailId ? { ...e, starred: !e.starred } : e
            )
          }
        })
      },

      archiveEmail: (emailId) => {
        const { careerState } = get()
        if (!careerState) return
        
        set({
          careerState: {
            ...careerState,
            emails: (careerState.emails || []).map(e => 
              e.id === emailId ? { ...e, archived: true } : e
            )
          }
        })
      },

      deleteEmail: (emailId) => {
        const { careerState } = get()
        if (!careerState) return
        
        set({
          careerState: {
            ...careerState,
            emails: (careerState.emails || []).filter(e => e.id !== emailId)
          }
        })
      },

      getUnreadEmailCount: () => {
        const { careerState } = get()
        if (!careerState || !careerState.emails) return 0
        return careerState.emails.filter(e => !e.read && !e.archived).length
      },

      getEmailsByCategory: (category) => {
        const { careerState } = get()
        if (!careerState || !careerState.emails) return []
        return careerState.emails.filter(e => e.category === category && !e.archived)
      },

      // ============================================
      // Team Media System
      // ============================================

      initializeTeamMedia: (teamName) => {
        const { careerState } = get()
        if (!careerState) return
        
        set({
          careerState: {
            ...careerState,
            teamMediaState: createDefaultTeamMediaState(teamName)
          }
        })
      },

      updateTeamMediaState: (updates) => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return
        
        set({
          careerState: {
            ...careerState,
            teamMediaState: { ...careerState.teamMediaState, ...updates }
          }
        })
      },

      addTeamPost: (post) => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return
        
        const newPost: TeamPost = {
          ...post,
          id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
        
        const teamSocial = careerState.teamMediaState.teamSocial
        const newFollowers = teamSocial.followers + (post.wentViral ? Math.floor(Math.random() * 5000) + 1000 : Math.floor(Math.random() * 200) + 50)
        
        set({
          careerState: {
            ...careerState,
            teamMediaState: {
              ...careerState.teamMediaState,
              teamSocial: {
                ...teamSocial,
                followers: newFollowers,
                totalPosts: teamSocial.totalPosts + 1,
                viralPosts: teamSocial.viralPosts + (post.wentViral ? 1 : 0),
                postHistory: [newPost, ...teamSocial.postHistory].slice(0, 100)
              },
              seasonViralPosts: careerState.teamMediaState.seasonViralPosts + (post.wentViral ? 1 : 0)
            }
          }
        })
      },

      addTeamHeadline: (headline) => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return
        
        const newHeadline: TeamHeadline = {
          ...headline,
          id: `headline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
        
        set({
          careerState: {
            ...careerState,
            teamMediaState: {
              ...careerState.teamMediaState,
              teamHeadlines: [newHeadline, ...careerState.teamMediaState.teamHeadlines].slice(0, 100)
            }
          }
        })
      },

      addPressRelease: (release) => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return
        
        const newRelease: PressRelease = {
          ...release,
          id: `release_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
        
        set({
          careerState: {
            ...careerState,
            teamMediaState: {
              ...careerState.teamMediaState,
              pressReleases: [newRelease, ...careerState.teamMediaState.pressReleases].slice(0, 50),
              seasonMediaEvents: careerState.teamMediaState.seasonMediaEvents + 1
            }
          }
        })
      },

      addControversy: (controversy) => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return
        
        const newControversy: Controversy = {
          ...controversy,
          id: `controversy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
        
        // Apply initial effects
        const sentimentChange = controversy.severity === 'critical' ? -20 :
                               controversy.severity === 'major' ? -12 :
                               controversy.severity === 'moderate' ? -6 : -3
        
        set({
          careerState: {
            ...careerState,
            teamMediaState: {
              ...careerState.teamMediaState,
              activeControversies: [...careerState.teamMediaState.activeControversies, newControversy],
              fanSentiment: Math.max(0, careerState.teamMediaState.fanSentiment + sentimentChange),
              seasonControversies: careerState.teamMediaState.seasonControversies + 1
            }
          }
        })
      },

      respondToControversy: (controversyId, responseType) => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return
        
        const controversies = careerState.teamMediaState.activeControversies.map(c => {
          if (c.id !== controversyId) return c
          
          // Calculate response effectiveness based on type and severity
          let effectiveness = 50
          if (responseType === 'apologize' && c.type !== 'statement_backlash') effectiveness = 70
          if (responseType === 'defend' && c.severity === 'minor') effectiveness = 60
          if (responseType === 'no_comment') effectiveness = 30
          if (responseType === 'deflect') effectiveness = 40
          if (responseType === 'counter_attack') effectiveness = Math.random() > 0.5 ? 80 : 20
          
          // Add some randomness
          effectiveness += Math.floor(Math.random() * 20) - 10
          
          return {
            ...c,
            responded: true,
            responseType,
            responseWeek: careerState.currentWeek,
            responseEffectiveness: effectiveness,
            decayRate: c.decayRate * (1 + effectiveness / 100) // Better response = faster decay
          }
        })
        
        set({
          careerState: {
            ...careerState,
            teamMediaState: {
              ...careerState.teamMediaState,
              activeControversies: controversies
            }
          }
        })
      },

      addInterviewRequest: (request) => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return
        
        const newRequest: InterviewRequest = {
          ...request,
          id: `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
        
        set({
          careerState: {
            ...careerState,
            teamMediaState: {
              ...careerState.teamMediaState,
              pendingInterviewRequests: [...careerState.teamMediaState.pendingInterviewRequests, newRequest]
            }
          }
        })
      },

      handleInterviewRequest: (requestId, approve) => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return
        
        const request = careerState.teamMediaState.pendingInterviewRequests.find(r => r.id === requestId)
        if (!request) return
        
        const pending = careerState.teamMediaState.pendingInterviewRequests.filter(r => r.id !== requestId)
        
        if (approve) {
          // Move to completed with outcome to be determined later
          const approvedRequest = { ...request, status: 'approved' as const }
          set({
            careerState: {
              ...careerState,
              teamMediaState: {
                ...careerState.teamMediaState,
                pendingInterviewRequests: pending,
                completedInterviews: [...careerState.teamMediaState.completedInterviews, approvedRequest]
              }
            }
          })
        } else {
          // Just remove from pending
          set({
            careerState: {
              ...careerState,
              teamMediaState: {
                ...careerState.teamMediaState,
                pendingInterviewRequests: pending
              }
            }
          })
        }
      },

      updateFanSentiment: (change, reason) => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return
        
        // Apply fan engagement perk bonus to sentiment changes
        const adjustedChange = applyFanEngagementPerk(change)
        const newSentiment = Math.max(0, Math.min(100, careerState.teamMediaState.fanSentiment + adjustedChange))
        const oldSentiment = careerState.teamMediaState.fanSentiment
        
        // Determine trend
        let trend: 'rising' | 'stable' | 'falling' = 'stable'
        if (newSentiment > oldSentiment + 3) trend = 'rising'
        else if (newSentiment < oldSentiment - 3) trend = 'falling'
        
        set({
          careerState: {
            ...careerState,
            teamMediaState: {
              ...careerState.teamMediaState,
              fanSentiment: newSentiment,
              fanSentimentTrend: trend,
              fanSentimentHistory: [
                ...careerState.teamMediaState.fanSentimentHistory,
                { week: careerState.currentWeek, value: newSentiment, reason }
              ].slice(-52) // Keep last year
            }
          }
        })
      },

      scheduleFanEvent: (event) => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return
        
        const newEvent: FanEvent = {
          ...event,
          id: `fan_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
        
        set({
          careerState: {
            ...careerState,
            teamMediaState: {
              ...careerState.teamMediaState,
              fanEvents: [...careerState.teamMediaState.fanEvents, newEvent]
            }
          }
        })
      },

      completeFanEvent: (eventId, attended) => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return
        
        const events = careerState.teamMediaState.fanEvents.map(e => {
          if (e.id !== eventId) return e
          return { ...e, completed: true, attended }
        })
        
        const event = careerState.teamMediaState.fanEvents.find(e => e.id === eventId)
        if (!event) return
        
        // Apply effects
        const sentimentBoost = event.effects.fanSentiment * (attended / (event.capacity || attended))
        
        set({
          careerState: {
            ...careerState,
            teamMediaState: {
              ...careerState.teamMediaState,
              fanEvents: events,
              fanSentiment: Math.min(100, careerState.teamMediaState.fanSentiment + sentimentBoost),
              seasonFanEventsHeld: careerState.teamMediaState.seasonFanEventsHeld + 1
            }
          }
        })
      },

      updateJournalistRelation: (journalistId, change, reason) => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return
        
        const journalists = careerState.teamMediaState.journalistRelations.map(j => {
          if (j.id !== journalistId) return j
          const newRelation = Math.max(-100, Math.min(100, j.relationship + change))
          return {
            ...j,
            relationship: newRelation,
            isHostile: newRelation < -30,
            lastContact: careerState.currentWeek,
            recentInteractions: [
              ...j.recentInteractions,
              { week: careerState.currentWeek, type: reason, change }
            ].slice(-10)
          }
        })
        
        set({
          careerState: {
            ...careerState,
            teamMediaState: {
              ...careerState.teamMediaState,
              journalistRelations: journalists
            }
          }
        })
      },

      processWeeklyMediaDecay: () => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return
        
        // Decay controversies
        const controversies = careerState.teamMediaState.activeControversies.map(c => ({
          ...c,
          currentIntensity: Math.max(0, c.currentIntensity - c.decayRate)
        })).filter(c => c.currentIntensity > 5 || !c.resolved)
        
        // Mark resolved controversies
        const resolved = controversies.map(c => ({
          ...c,
          resolved: c.currentIntensity <= 5,
          resolvedWeek: c.currentIntensity <= 5 ? careerState.currentWeek : c.resolvedWeek
        }))
        
        // Recalculate media score
        const updatedState = { ...careerState.teamMediaState, activeControversies: resolved }
        const newMediaScore = calculateMediaScore(updatedState)
        const newReachTier = determineMediaReachTier(newMediaScore, updatedState.teamSocial.followers)
        
        set({
          careerState: {
            ...careerState,
            teamMediaState: {
              ...updatedState,
              mediaScore: newMediaScore,
              mediaReachTier: newReachTier
            }
          }
        })
      },

      // ============================================
      // Media Duty System Actions
      // ============================================

      generateWeekendDuties: (trackId, trackName, seriesId, seriesName, week, year) => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return

        // Define the duty configurations with their schedule
        const dutyConfigs: MediaDutyConfig[] = [
          { type: 'pre_weekend_briefing', day: 4, name: 'Pre-Weekend Briefing', description: 'Set expectations for the upcoming weekend', topics: ['expectations', 'strategy', 'preparation', 'goals'], baseFineMultiplier: 1.5, isPreSession: false },
          { type: 'pre_practice', day: 5, name: 'Pre-Practice Statement', description: 'Share initial setup approach', topics: ['setup', 'weather', 'track_conditions', 'technical'], baseFineMultiplier: 1.0, isPreSession: true, relatedSession: 'practice' },
          { type: 'post_practice', day: 5, name: 'Post-Practice Debrief', description: 'React to practice performance', topics: ['pace', 'setup_progress', 'issues', 'confidence'], baseFineMultiplier: 1.0, isPreSession: false, relatedSession: 'practice' },
          { type: 'pre_qualifying', day: 6, name: 'Pre-Qualifying Statement', description: 'Discuss qualifying approach', topics: ['strategy', 'tire_strategy', 'target_position', 'weather'], baseFineMultiplier: 1.2, isPreSession: true, relatedSession: 'qualifying' },
          { type: 'post_qualifying', day: 6, name: 'Post-Qualifying Reaction', description: 'React to qualifying result', topics: ['grid_position', 'lap_analysis', 'race_outlook', 'rivals'], baseFineMultiplier: 1.2, isPreSession: false, relatedSession: 'qualifying' },
          { type: 'pre_race', day: 7, name: 'Pre-Race Statement', description: 'Share race strategy outlook', topics: ['strategy', 'start_plan', 'tire_strategy', 'weather', 'rivals'], baseFineMultiplier: 1.5, isPreSession: true, relatedSession: 'race' },
          { type: 'post_race', day: 7, name: 'Post-Race Reaction', description: 'React to race outcome', topics: ['result', 'incidents', 'strategy_execution', 'points', 'championship'], baseFineMultiplier: 2.0, isPreSession: false, relatedSession: 'race' },
          { type: 'post_weekend_debrief', day: 1, name: 'Post-Weekend Debrief', description: 'Full weekend analysis and forward look', topics: ['overall_analysis', 'lessons_learned', 'next_race', 'development'], baseFineMultiplier: 1.5, isPreSession: false }
        ]

        // Calculate base fine based on team tier and series prestige
        const team = careerState.ownedTeam
        const baseFine = team ? Math.round(team.budgets.cash * 0.001) : 5000 // 0.1% of budget or $5000

        // Generate duties for this weekend
        const newDuties: MediaDuty[] = dutyConfigs.map(config => ({
          id: `duty-${week}-${year}-${config.type}`,
          type: config.type,
          week,
          year,
          day: config.day,
          trackId,
          trackName,
          seriesId,
          seriesName,
          mandatory: true,
          status: 'upcoming' as MediaDutyStatus,
          deadline: config.day + (config.isPreSession ? 0 : 1), // Must complete before or on the session day
          skipPenalty: {
            fine: Math.round(baseFine * config.baseFineMultiplier),
            sponsorSatisfaction: -5,
            boardMood: -3,
            fanSentiment: -2,
            reputation: -1
          }
        }))

        // Filter out any duties that already exist for this week
        const existingDutyIds = careerState.teamMediaState.dutySchedule.weekendDuties
          .filter(d => d.week === week && d.year === year)
          .map(d => d.id)
        
        const filteredNewDuties = newDuties.filter(d => !existingDutyIds.includes(d.id))

        set({
          careerState: {
            ...careerState,
            teamMediaState: {
              ...careerState.teamMediaState,
              dutySchedule: {
                ...careerState.teamMediaState.dutySchedule,
                weekendDuties: [
                  ...careerState.teamMediaState.dutySchedule.weekendDuties,
                  ...filteredNewDuties
                ]
              }
            }
          }
        })
      },

      setDutyOptions: (dutyId, options) => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return

        const weekendDuties = careerState.teamMediaState.dutySchedule.weekendDuties.map(duty => {
          if (duty.id === dutyId) {
            return {
              ...duty,
              generatedOptions: options,
              status: 'available' as MediaDutyStatus
            }
          }
          return duty
        })

        set({
          careerState: {
            ...careerState,
            teamMediaState: {
              ...careerState.teamMediaState,
              dutySchedule: {
                ...careerState.teamMediaState.dutySchedule,
                weekendDuties
              }
            }
          }
        })
      },

      completeDuty: (dutyId, selectedOptionId) => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return

        const duty = careerState.teamMediaState.dutySchedule.weekendDuties.find(d => d.id === dutyId)
        if (!duty || !duty.generatedOptions) return

        const selectedOption = duty.generatedOptions.find(o => o.id === selectedOptionId)
        if (!selectedOption) return

        // Apply effects
        const effects = selectedOption.effects

        // Check for controversy trigger
        const controversyTriggered = Math.random() * 100 < effects.controversyRisk

        // Check for fine trigger
        const fineIssued = Math.random() * 100 < effects.fineRisk ? effects.fineAmount || 0 : 0

        // Update duty status
        const weekendDuties = careerState.teamMediaState.dutySchedule.weekendDuties.map(d => {
          if (d.id === dutyId) {
            return {
              ...d,
              status: 'completed' as MediaDutyStatus,
              selectedOptionId,
              selectedOption,
              controversyTriggered,
              fineIssued
            }
          }
          return d
        })

        // Calculate new fan sentiment
        const newFanSentiment = Math.max(0, Math.min(100, 
          careerState.teamMediaState.fanSentiment + effects.fanSentiment
        ))

        // Add promise if the option makes one
        let activePromises = [...careerState.teamMediaState.dutySchedule.activePromises]
        if (selectedOption.makesPromises && selectedOption.promiseType && selectedOption.promiseTarget) {
          const newPromise: MediaPromise = {
            id: `promise-${dutyId}-${Date.now()}`,
            madeWeek: careerState.currentWeek,
            madeYear: careerState.currentYear,
            dutyId,
            type: selectedOption.promiseType,
            target: selectedOption.promiseTarget,
            description: selectedOption.content,
            deadline: selectedOption.promiseDeadline || careerState.currentWeek + 4,
            deadlineYear: careerState.currentYear,
            fulfilled: false,
            broken: false,
            consequenceApplied: false
          }
          activePromises = [...activePromises, newPromise]
        }

        set({
          careerState: {
            ...careerState,
            teamMediaState: {
              ...careerState.teamMediaState,
              fanSentiment: newFanSentiment,
              dutySchedule: {
                ...careerState.teamMediaState.dutySchedule,
                weekendDuties,
                activePromises,
                completedDutiesThisSeason: careerState.teamMediaState.dutySchedule.completedDutiesThisSeason + 1,
                finesPaidThisSeason: careerState.teamMediaState.dutySchedule.finesPaidThisSeason + fineIssued,
                controversiesFromMedia: careerState.teamMediaState.dutySchedule.controversiesFromMedia + (controversyTriggered ? 1 : 0)
              }
            }
          }
        })

        // If fine issued, add transaction
        if (fineIssued > 0) {
          get().addTransaction({
            date: new Date().toISOString(),
            type: 'expense',
            category: 'other',
            amount: fineIssued,
            description: `Media duty fine - ${duty.trackName}`,
            week: careerState.currentWeek,
            year: careerState.currentYear
          })
        }
      },

      skipDuty: (dutyId) => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return

        const duty = careerState.teamMediaState.dutySchedule.weekendDuties.find(d => d.id === dutyId)
        if (!duty) return

        // Apply skip penalty
        const penalty = duty.skipPenalty

        // Update duty status
        const weekendDuties = careerState.teamMediaState.dutySchedule.weekendDuties.map(d => {
          if (d.id === dutyId) {
            return { ...d, status: 'skipped' as MediaDutyStatus }
          }
          return d
        })

        // Calculate new fan sentiment
        const newFanSentiment = Math.max(0, Math.min(100, 
          careerState.teamMediaState.fanSentiment + penalty.fanSentiment
        ))

        set({
          careerState: {
            ...careerState,
            teamMediaState: {
              ...careerState.teamMediaState,
              fanSentiment: newFanSentiment,
              dutySchedule: {
                ...careerState.teamMediaState.dutySchedule,
                weekendDuties,
                missedDutiesThisSeason: careerState.teamMediaState.dutySchedule.missedDutiesThisSeason + 1,
                finesPaidThisSeason: careerState.teamMediaState.dutySchedule.finesPaidThisSeason + penalty.fine
              }
            }
          }
        })

        // Add fine transaction
        if (penalty.fine > 0) {
          get().addTransaction({
            date: new Date().toISOString(),
            type: 'expense',
            category: 'other',
            amount: penalty.fine,
            description: `Media duty skip fine - ${duty.trackName}`,
            week: careerState.currentWeek,
            year: careerState.currentYear
          })
        }
      },

      processMissedDuties: () => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return

        const currentDay = careerState.currentDay || 1
        
        // Find duties that are past their deadline and still upcoming/available
        const missedDuties = careerState.teamMediaState.dutySchedule.weekendDuties.filter(
          d => d.status === 'upcoming' || d.status === 'available'
        ).filter(d => {
          // If duty is from previous week, it's missed
          if (d.week < careerState.currentWeek) return true
          // If same week but past deadline day
          if (d.week === careerState.currentWeek && currentDay > d.deadline) return true
          return false
        })

        if (missedDuties.length === 0) return

        // Process each missed duty
        let totalFine = 0
        let totalFanSentimentChange = 0

        const updatedDuties = careerState.teamMediaState.dutySchedule.weekendDuties.map(d => {
          const missed = missedDuties.find(m => m.id === d.id)
          if (missed) {
            totalFine += missed.skipPenalty.fine
            totalFanSentimentChange += missed.skipPenalty.fanSentiment
            return { ...d, status: 'missed' as MediaDutyStatus }
          }
          return d
        })

        const newFanSentiment = Math.max(0, Math.min(100, 
          careerState.teamMediaState.fanSentiment + totalFanSentimentChange
        ))

        set({
          careerState: {
            ...careerState,
            teamMediaState: {
              ...careerState.teamMediaState,
              fanSentiment: newFanSentiment,
              dutySchedule: {
                ...careerState.teamMediaState.dutySchedule,
                weekendDuties: updatedDuties,
                missedDutiesThisSeason: careerState.teamMediaState.dutySchedule.missedDutiesThisSeason + missedDuties.length,
                finesPaidThisSeason: careerState.teamMediaState.dutySchedule.finesPaidThisSeason + totalFine
              }
            }
          }
        })

        // Add consolidated fine transaction
        if (totalFine > 0) {
          get().addTransaction({
            date: new Date().toISOString(),
            type: 'expense',
            category: 'other',
            amount: totalFine,
            description: `Missed media duties fine (${missedDuties.length} duties)`,
            week: careerState.currentWeek,
            year: careerState.currentYear
          })
        }
      },

      addMediaPromise: (promiseData) => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return

        const newPromise: MediaPromise = {
          ...promiseData,
          id: `promise-${Date.now()}`
        }

        set({
          careerState: {
            ...careerState,
            teamMediaState: {
              ...careerState.teamMediaState,
              dutySchedule: {
                ...careerState.teamMediaState.dutySchedule,
                activePromises: [...careerState.teamMediaState.dutySchedule.activePromises, newPromise]
              }
            }
          }
        })
      },

      checkPromises: () => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return

        // Check all active promises for deadline
        const activePromises = careerState.teamMediaState.dutySchedule.activePromises.map(promise => {
          // Skip already resolved promises
          if (promise.fulfilled || promise.broken) return promise

          // Check if past deadline
          const isPastDeadline = 
            careerState.currentYear > promise.deadlineYear ||
            (careerState.currentYear === promise.deadlineYear && careerState.currentWeek > promise.deadline)

          if (isPastDeadline && !promise.checkedAt) {
            // Promise broken - will be handled by breakPromise action when consequence is applied
            return { ...promise, checkedAt: careerState.currentWeek }
          }

          return promise
        })

        set({
          careerState: {
            ...careerState,
            teamMediaState: {
              ...careerState.teamMediaState,
              dutySchedule: {
                ...careerState.teamMediaState.dutySchedule,
                activePromises
              }
            }
          }
        })
      },

      fulfillPromise: (promiseId) => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return

        const activePromises = careerState.teamMediaState.dutySchedule.activePromises.map(p => {
          if (p.id === promiseId) {
            return { ...p, fulfilled: true, consequenceApplied: true }
          }
          return p
        })

        // Bonus for fulfilling promise
        const newFanSentiment = Math.min(100, careerState.teamMediaState.fanSentiment + 5)

        set({
          careerState: {
            ...careerState,
            teamMediaState: {
              ...careerState.teamMediaState,
              fanSentiment: newFanSentiment,
              dutySchedule: {
                ...careerState.teamMediaState.dutySchedule,
                activePromises
              }
            }
          }
        })
      },

      breakPromise: (promiseId) => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return

        const promise = careerState.teamMediaState.dutySchedule.activePromises.find(p => p.id === promiseId)
        if (!promise || promise.consequenceApplied) return

        const activePromises = careerState.teamMediaState.dutySchedule.activePromises.map(p => {
          if (p.id === promiseId) {
            return { ...p, broken: true, consequenceApplied: true }
          }
          return p
        })

        // Penalty for breaking promise
        const newFanSentiment = Math.max(0, careerState.teamMediaState.fanSentiment - 10)

        set({
          careerState: {
            ...careerState,
            teamMediaState: {
              ...careerState.teamMediaState,
              fanSentiment: newFanSentiment,
              dutySchedule: {
                ...careerState.teamMediaState.dutySchedule,
                activePromises
              }
            }
          }
        })
      },

      getActiveDuties: () => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return []

        return careerState.teamMediaState.dutySchedule.weekendDuties.filter(
          d => d.status === 'available' && d.week === careerState.currentWeek
        )
      },

      getUpcomingDuties: () => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) return []

        return careerState.teamMediaState.dutySchedule.weekendDuties.filter(
          d => d.status === 'upcoming' && d.week === careerState.currentWeek
        )
      },

      getDutyScheduleStats: () => {
        const { careerState } = get()
        if (!careerState || !careerState.teamMediaState) {
          return {
            weekendDuties: [],
            activePromises: [],
            completedDutiesThisSeason: 0,
            missedDutiesThisSeason: 0,
            finesPaidThisSeason: 0,
            controversiesFromMedia: 0
          }
        }
        return careerState.teamMediaState.dutySchedule
      },

      setContract: (contract, isForNextSeason = false) => {
        const { player, careerState } = get()
        if (player) {
          // Calculate release clause if not already set
          let releaseClause = contract.clauseValue
          if (!releaseClause && careerState) {
            // Calculate based on player's current market value
            const marketValue = get().calculateMarketValue()
            const yearsRemaining = contract.endYear - (isForNextSeason ? careerState.currentYear + 1 : careerState.currentYear)
            
            // Get tier from the new team
            const rivalStore = useRivalStore.getState()
            const newTeam = rivalStore.getTeamById(contract.teamId)
            
            const tierMultipliers: Record<string, number> = {
              'entry': 0.5, 'amateur': 0.75, 'semi-pro': 1.0,
              'professional': 1.25, 'pro': 1.5, 'elite': 2.0, 'pinnacle': 3.0
            }
            const tierMultiplier = tierMultipliers[newTeam?.tier || 'semi-pro'] || 1.0
            const yearsMultiplier = 1 + (yearsRemaining * 0.5)
            
            releaseClause = Math.max(10000, Math.round(marketValue * tierMultiplier * yearsMultiplier))
            console.log(`[CareerStore] Calculated release clause: $${releaseClause} (market value: $${marketValue}, tier: ${newTeam?.tier}, years: ${yearsRemaining})`)
          }
          
          const contractWithClause: Contract = {
            ...contract,
            clauseValue: releaseClause
          }
          
          // If this is a contract for next season and player has a current contract, store as pending
          if (isForNextSeason && player.contract) {
            console.log(`[CareerStore] Storing contract as pending for next season with ${contract.teamName}`)
            set({
              player: {
                ...player,
                pendingContract: contractWithClause
              }
            })
          } else {
            // Immediate contract - replace current contract
            set({
              player: {
                ...player,
                contract: contractWithClause,
                pendingContract: undefined, // Clear any pending contract
                currentTeamId: contract.teamId,
                currentSeriesId: contract.seriesId,
                finances: {
                  ...player.finances,
                  salary: contract.salary,
                  bonusPerWin: contract.bonusPerWin,
                  bonusPerPodium: contract.bonusPerPodium
                }
              }
            })
            
            // Sync teammate knowledge - teammates should be fully known
            const rivalStore = useRivalStore.getState()
            const scoutingStore = useScoutingStore.getState()
            const team = rivalStore.getTeamById(contract.teamId)
            
            if (team && team.drivers.length > 0) {
              // Get all teammates (other drivers on the same team)
              const teammateIds = team.drivers
              const teammateNames: Record<string, string> = {}
              
              teammateIds.forEach(driverId => {
                const driver = rivalStore.rivals.find(r => r.id === driverId)
                if (driver) {
                  teammateNames[driverId] = `${driver.firstName} ${driver.lastName}`
                }
              })
              
              // Sync teammate knowledge to complete level
              scoutingStore.syncTeammateKnowledge(teammateIds, teammateNames)
              console.log(`[CareerStore] Synced teammate knowledge for ${teammateIds.length} drivers`)
            }
            
            // Initialize team development for the new contract
            const tier = team?.tier || 'amateur'
            const newDevState = createDefaultTeamDevelopmentState(tier)
            const currentCareerState = get().careerState
            if (currentCareerState) {
              set({
                careerState: {
                  ...currentCareerState,
                  teamDevelopment: newDevState,
                  developmentEvents: []
                }
              })
              console.log(`[Team Development] Auto-initialized for ${contract.teamName} (tier: ${tier})`)
            }
          }
        }
      },

      activatePendingContract: () => {
        const { player } = get()
        if (player?.pendingContract) {
          const pendingContract = player.pendingContract
          console.log(`[CareerStore] Activating pending contract with ${pendingContract.teamName}`)
          
          // Sync teammate knowledge for new team
          const rivalStore = useRivalStore.getState()
          const scoutingStore = useScoutingStore.getState()
          const team = rivalStore.getTeamById(pendingContract.teamId)
          
          if (team && team.drivers.length > 0) {
            const teammateIds = team.drivers
            const teammateNames: Record<string, string> = {}
            
            teammateIds.forEach(driverId => {
              const driver = rivalStore.rivals.find(r => r.id === driverId)
              if (driver) {
                teammateNames[driverId] = `${driver.firstName} ${driver.lastName}`
              }
            })
            
            scoutingStore.syncTeammateKnowledge(teammateIds, teammateNames)
            console.log(`[CareerStore] Synced teammate knowledge for ${teammateIds.length} drivers at new team`)
          }
          
          set({
            player: {
              ...player,
              contract: pendingContract,
              pendingContract: undefined,
              currentTeamId: pendingContract.teamId,
              currentSeriesId: pendingContract.seriesId,
              finances: {
                ...player.finances,
                salary: pendingContract.salary,
                bonusPerWin: pendingContract.bonusPerWin,
                bonusPerPodium: pendingContract.bonusPerPodium
              }
            }
          })
          
          // === NOTIFICATION INTEGRATION ===
          routeNotification({
            category: 'team_manager',
            subject: `Contract Activated: ${pendingContract.teamName}`,
            body: `Your contract with **${pendingContract.teamName}** is now active.\n\nSalary: $${pendingContract.salary.toLocaleString()}/year\nSeries: ${pendingContract.seriesName}\n\nGood luck this season!`,
            emailCategory: 'contract',
          })
        }
      },

      clearContract: () => {
        const { player } = get()
        if (player) {
          set({
            player: {
              ...player,
              contract: undefined,
              currentTeamId: undefined,
              currentSeriesId: undefined,
              finances: {
                ...player.finances,
                salary: 0,
                bonusPerWin: 0,
                bonusPerPodium: 0
              }
            }
          })
        }
      },

      addRaceResult: (result) => {
        const { player, careerState } = get()
        if (player && careerState) {
          // Guard: Check if we already have a result for this round in this series
          // Also check by week to prevent duplicates from different code paths
          const existingResult = player.raceHistory.find(
            r => r.seriesId === result.seriesId && r.round === result.round
          )
          
          if (existingResult) {
            console.log(`[CareerStore] Duplicate result detected for ${result.seriesId} Round ${result.round} - skipping`)
            return
          }
          
          const newResult: RaceResult = {
            ...result,
            id: `race_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }
          
          console.log(`[CareerStore] Adding race result: ${result.seriesId} Round ${result.round} - P${result.racePosition}`)
          
          // Update stats based on result
          const newWins = result.racePosition === 1 ? player.totalWins + 1 : player.totalWins
          const newPodiums = result.racePosition <= 3 ? player.totalPodiums + 1 : player.totalPodiums
          const newPoles = result.qualifyingPosition === 1 ? player.totalPoles + 1 : player.totalPoles
          
          // Note: Reputation is calculated and applied in processRaceResult() with tier-adjusted formula.
          // Do NOT apply reputation here to avoid double-counting.
          
          set({
            player: {
              ...player,
              totalRaces: player.totalRaces + 1,
              totalWins: newWins,
              totalPodiums: newPodiums,
              totalPoles: newPoles,
              raceHistory: [...player.raceHistory, newResult]
            },
            careerState: {
              ...careerState
              // Note: Removed currentRound increment - using calendar-based rounds instead
            }
          })
          
          // Add prize money transaction
          if (result.prizeMoney > 0) {
            get().addTransaction({
              type: 'income',
              category: 'prize',
              amount: result.prizeMoney,
              description: `Prize money - Round ${result.round} at ${result.trackName}`,
              date: new Date().toISOString(),
              week: careerState.currentWeek,
              year: careerState.currentYear
            })
          }
        }
      },

      processRaceResult: (telemetryResult): { points: number; prizeMoney: number; repChange: number } => {
        const { player, careerState } = get()
        if (!player || !careerState) {
          console.log('[CareerStore] Cannot process race result - no active career')
          return { points: 0, prizeMoney: 0, repChange: 0 }
        }
        
        // Get the correct round number from the calendar based on current week
        const currentSeries = useRivalStore.getState().getSeriesById(player.currentSeriesId || '')
        const calendarEvent = currentSeries?.calendar?.find(
          event => event.week === careerState.currentWeek
        )
        const calendarRound = calendarEvent?.round || 1
        
        // Check if we already processed this week's race (prevent duplicates)
        const existingRaceThisWeek = player.raceHistory.find(
          r => r.seriesId === player.currentSeriesId && r.round === calendarRound
        )
        if (existingRaceThisWeek) {
          console.log(`[CareerStore] Race already processed for ${player.currentSeriesId} Round ${calendarRound} - skipping duplicate`)
          return { points: 0, prizeMoney: 0, repChange: 0 }
        }
        
        const position = telemetryResult.playerPosition
        const dnf = telemetryResult.dnf
        
        // Calculate championship points using dynamic point system
        let points = 0
        if (!dnf) {
          const championship = currentSeries?.championshipId 
            ? getChampionshipById(currentSeries.championshipId) 
            : null
          const pointsSystem = getPointsSystem(championship?.pointsSystemId || 'standard')
          points = getPointsForPosition(pointsSystem, position)
        }
        
        // Calculate prize money using actual series data
        let prizeMoney = 0
        if (!dnf && currentSeries?.prizeMoney) {
          if (position === 1) {
            prizeMoney = currentSeries.prizeMoney.win
          } else if (position <= 3) {
            prizeMoney = currentSeries.prizeMoney.podium
          } else if (position <= 10) {
            prizeMoney = currentSeries.prizeMoney.points
          }
        } else if (!dnf) {
          // Fallback to base prize money if series data not available
          prizeMoney = BASE_PRIZE_MONEY[position] || (position <= 15 ? 250 : 0)
        }
        
        // ============================================
        // REBALANCED REPUTATION SYSTEM
        // Base gains reduced, with series tier multiplier
        // ============================================
        
        // Get series tier for reputation multiplier
        const seriesTierMultipliers: Record<string, number> = {
          'entry': 0.5,
          'amateur': 0.5,
          'semi-pro': 0.75,
          'professional': 1.0,
          'pro': 1.0,
          'elite': 1.25,
          'pinnacle': 1.5
        }
        
        // Try to get the series tier from rival store
        const currentSeriesData = useRivalStore.getState().getSeriesById(player.currentSeriesId || '')
        const seriesTier = currentSeriesData?.tier || 'amateur'
        const tierMultiplier = seriesTierMultipliers[seriesTier] || 1.0
        
        // Base reputation gains (REDUCED from original)
        let baseRepChange = 0
        if (dnf) {
          baseRepChange = -1  // Was -2
        } else if (position === 1) {
          baseRepChange = 2   // Was 5
        } else if (position <= 3) {
          baseRepChange = 1.5 // Was 3
        } else if (position <= 5) {
          baseRepChange = 1   // Was 2
        } else if (position <= 10) {
          baseRepChange = 0.5 // Was 1
        } else if (position > telemetryResult.totalParticipants * 0.75) {
          baseRepChange = -0.5 // Was -1
        }
        
        // Check for fastest lap bonus (compare best lap times)
        const playerBestLap = telemetryResult.bestLapTime
        const fastestLap = playerBestLap > 0 && telemetryResult.allParticipants.every(
          p => !p.bestLapTime || p.bestLapTime >= playerBestLap
        )
        if (fastestLap) {
          baseRepChange += 0.5 // Was +1
        }
        
        // Apply tier multiplier
        let repChange = Math.round(baseRepChange * tierMultiplier * 10) / 10
        
        // Consistency bonus (check for podium/points streaks)
        const recentRaces = player.raceHistory.slice(-5)
        const recentPodiums = recentRaces.filter(r => r.racePosition <= 3 && !r.dnf).length
        const recentPointsFinishes = recentRaces.filter(r => r.racePosition <= 10 && !r.dnf).length
        
        if (position <= 3 && !dnf && recentPodiums >= 2) {
          repChange += 0.5 // Consistency bonus for 3 podiums in last 5
          console.log('[CareerStore] Podium consistency bonus applied')
        }
        if (position <= 10 && !dnf && recentPointsFinishes >= 4) {
          repChange += 0.25 // Points consistency bonus
        }
        
        console.log(`[CareerStore] Rep calculation: Base ${baseRepChange} × Tier ${tierMultiplier} (${seriesTier}) = ${repChange}`)
        
        console.log(`[CareerStore] Processing race result: P${position} at Round ${calendarRound}, Points: ${points}, Prize: $${prizeMoney}, Rep: ${repChange > 0 ? '+' : ''}${repChange}`)
        
        // Normalize track name to canonical ID for consistent tracking
        const canonicalTrackId = normalizeTrackName(telemetryResult.trackName)
        const trackDisplayName = getTrackDisplayName(canonicalTrackId) || telemetryResult.trackName
        
        // Get qualifying position from race weekend progress if available
        const weekendProgress = careerState.raceWeekendProgress
        const qualiPosition = (weekendProgress?.qualifying?.position) || position
        
        // Create the race result using calendar-based round
        const raceResult: Omit<RaceResult, 'id'> = {
          seriesId: player.currentSeriesId || 'unknown',
          round: calendarRound,
          trackId: canonicalTrackId,
          trackName: trackDisplayName,
          date: new Date().toISOString(),
          qualifyingPosition: qualiPosition,
          racePosition: position,
          fastestLap,
          dnf,
          dnfReason: dnf ? 'Retired' : undefined,
          points,
          prizeMoney,
          wasWet: (telemetryResult.rainDensity ?? 0) > 0.1
        }
        
        // Use existing addRaceResult to save the result (race history + totals only)
        get().addRaceResult(raceResult)
        
        // Save weekend session history (practice/qualifying results) for long-term stats
        if (weekendProgress) {
          const currentHistory = careerState.weekendSessionHistory || []
          const weekendEntry: WeekendSessionHistory = {
            trackId: canonicalTrackId,
            trackName: trackDisplayName,
            week: careerState.currentWeek,
            year: careerState.currentYear,
            seriesId: player.currentSeriesId || 'unknown',
            practicePosition: weekendProgress.practice?.position,
            practiceBestLap: weekendProgress.practice?.bestLapTime,
            qualifyingPosition: weekendProgress.qualifying?.position,
            qualifyingBestLap: weekendProgress.qualifying?.bestLapTime
          }
          set({
            careerState: {
              ...get().careerState!,
              weekendSessionHistory: [...currentHistory, weekendEntry]
            }
          })
        }
        
        // Apply the tier-adjusted reputation change from above calculation
        const playerAfterResult = get().player
        if (playerAfterResult && repChange !== 0) {
          set({
            player: {
              ...playerAfterResult,
              reputation: Math.round(Math.min(100, Math.max(0, playerAfterResult.reputation + repChange)) * 10) / 10
            }
          })
        }
        
        // ============================================
        // Update Track History Statistics
        // ============================================
        const currentTrackHistory = player.trackHistory || {}
        const existingHistory = currentTrackHistory[canonicalTrackId]
        
        // Calculate if this continues a win streak at this track
        const wasWin = position === 1 && !dnf
        const wasPodium = position <= 3 && !dnf
        const newConsecutiveWins = existingHistory 
          ? (wasWin ? existingHistory.consecutiveWins + 1 : 0)
          : (wasWin ? 1 : 0)
        const newMaxConsecutiveWins = existingHistory
          ? Math.max(existingHistory.maxConsecutiveWins, newConsecutiveWins)
          : newConsecutiveWins
        
        // Calculate new average finish
        const previousVisits = existingHistory?.visits || 0
        const previousAvg = existingHistory?.avgFinish || 0
        const newAvgFinish = previousVisits > 0
          ? ((previousAvg * previousVisits) + position) / (previousVisits + 1)
          : position
        
        // Get existing series list
        const existingSeriesHere = existingHistory?.seriesRacedHere || []
        const currentSeriesId = player.currentSeriesId || 'unknown'
        const updatedSeriesHere = existingSeriesHere.includes(currentSeriesId)
          ? existingSeriesHere
          : [...existingSeriesHere, currentSeriesId]
        
        const updatedTrackHistory: TrackHistory = {
          trackId: canonicalTrackId,
          trackName: trackDisplayName,
          visits: (existingHistory?.visits || 0) + 1,
          wins: (existingHistory?.wins || 0) + (wasWin ? 1 : 0),
          podiums: (existingHistory?.podiums || 0) + (wasPodium ? 1 : 0),
          poles: (existingHistory?.poles || 0) + (qualiPosition === 1 ? 1 : 0),
          fastestLaps: (existingHistory?.fastestLaps || 0) + (fastestLap ? 1 : 0),
          dnfs: (existingHistory?.dnfs || 0) + (dnf ? 1 : 0),
          bestFinish: existingHistory 
            ? Math.min(existingHistory.bestFinish, position) 
            : position,
          worstFinish: existingHistory
            ? Math.max(existingHistory.worstFinish, position)
            : position,
          avgFinish: Math.round(newAvgFinish * 10) / 10,
          consecutiveWins: newConsecutiveWins,
          maxConsecutiveWins: newMaxConsecutiveWins,
          consecutiveVisits: dnf ? 0 : (existingHistory?.consecutiveVisits || 0) + 1,
          lastVisitYear: careerState.currentYear,
          firstVisitYear: existingHistory?.firstVisitYear || careerState.currentYear,
          lastResult: position,
          seriesRacedHere: updatedSeriesHere
        }
        
        // Update player with new track history
        const playerAfterRace = get().player
        if (playerAfterRace) {
          set({
            player: {
              ...playerAfterRace,
              trackHistory: {
                ...playerAfterRace.trackHistory,
                [canonicalTrackId]: updatedTrackHistory
              }
            }
          })
          console.log(`[CareerStore] Updated track history for ${trackDisplayName}: ${updatedTrackHistory.visits} visits, ${updatedTrackHistory.wins} wins`)
        }
        
        // ============================================
        // Process Race Financial Payments (Driver Path)
        // ============================================
        {
          const currentPlayerForPay = get().player
          if (currentPlayerForPay) {
            let totalRaceIncome = 0
            
            // 1. Prize money (already calculated above)
            if (prizeMoney > 0) {
              get().addTransaction({
                type: 'income',
                category: 'prize',
                amount: prizeMoney,
                description: `Race prize money - P${position}${dnf ? ' (DNF)' : ''}`,
                date: new Date().toISOString(),
                week: careerState.currentWeek,
                year: careerState.currentYear
              })
              totalRaceIncome += prizeMoney
            }
            
            // 2. Per-race salary from contract
            const raceSalary = currentPlayerForPay.finances.salary || 0
            if (raceSalary > 0) {
              get().addTransaction({
                type: 'income',
                category: 'salary',
                amount: raceSalary,
                description: 'Race salary payment',
                date: new Date().toISOString(),
                week: careerState.currentWeek,
                year: careerState.currentYear
              })
              totalRaceIncome += raceSalary
            }
            
            // 3. Win bonus
            if (position === 1 && !dnf && currentPlayerForPay.finances.bonusPerWin > 0) {
              get().addTransaction({
                type: 'income',
                category: 'bonus',
                amount: currentPlayerForPay.finances.bonusPerWin,
                description: 'Race win bonus!',
                date: new Date().toISOString(),
                week: careerState.currentWeek,
                year: careerState.currentYear
              })
              totalRaceIncome += currentPlayerForPay.finances.bonusPerWin
            }
            // 4. Podium bonus (only if not already got win bonus, and position 2-3)
            else if (position <= 3 && !dnf && currentPlayerForPay.finances.bonusPerPodium > 0) {
              get().addTransaction({
                type: 'income',
                category: 'bonus',
                amount: currentPlayerForPay.finances.bonusPerPodium,
                description: `Podium bonus - P${position}`,
                date: new Date().toISOString(),
                week: careerState.currentWeek,
                year: careerState.currentYear
              })
              totalRaceIncome += currentPlayerForPay.finances.bonusPerPodium
            }
            
            if (totalRaceIncome > 0) {
              console.log(`[CareerStore] Race income: +$${totalRaceIncome.toLocaleString()} (Prize: $${prizeMoney.toLocaleString()}, Salary: $${raceSalary.toLocaleString()})`)
            }
          }
        }
        
        // ============================================
        // Update Personal Life Brand & Public Image (Team Owner mode)
        // ============================================
        const brandCareerState = get().careerState
        if (brandCareerState?.personalLife?.brand) {
          const brand = brandCareerState.personalLife.brand
          
          // Calculate public image change based on race result and series tier
          let imageChange = 0
          let brandChange = 0
          let mediaChange = 0
          
          if (dnf) {
            imageChange = -0.5 * tierMultiplier
            brandChange = -0.25 * tierMultiplier
          } else if (position === 1) {
            imageChange = 2 * tierMultiplier    // Win = big boost
            brandChange = 1.5 * tierMultiplier
            mediaChange = 1 * tierMultiplier
          } else if (position <= 3) {
            imageChange = 1 * tierMultiplier    // Podium = moderate boost
            brandChange = 0.5 * tierMultiplier
            mediaChange = 0.5 * tierMultiplier
          } else if (position <= 5) {
            imageChange = 0.5 * tierMultiplier  // Top 5 = small boost
            brandChange = 0.25 * tierMultiplier
          } else if (position <= 10) {
            imageChange = 0.1 * tierMultiplier  // Points finish = tiny boost
          } else if (position > telemetryResult.totalParticipants * 0.8) {
            imageChange = -0.25 * tierMultiplier // Bad finish = slight negative
          }
          
          // Apply changes (clamped to 0-100)
          const newPublicImage = Math.min(100, Math.max(0, brand.publicImage + imageChange))
          const newBrandValue = Math.min(100, Math.max(0, brand.brandValue + brandChange))
          const newMediaPresence = Math.min(100, Math.max(0, brand.mediaPresence + mediaChange))
          
          // Update speaking fee based on brand value (scales with brand)
          const newSpeakingFee = Math.round(1000 + (newBrandValue * 200))  // $1k base + up to $20k
          
          // Sync speaking fees to monthly income (assume ~0.5 gigs per month average)
          const monthlySpeakingIncome = Math.floor(newSpeakingFee * 0.5)
          
          set({
            careerState: {
              ...brandCareerState,
              personalLife: {
                ...brandCareerState.personalLife,
                brand: {
                  ...brand,
                  publicImage: Math.round(newPublicImage * 10) / 10,
                  brandValue: Math.round(newBrandValue * 10) / 10,
                  mediaPresence: Math.round(newMediaPresence * 10) / 10,
                  speakingFee: newSpeakingFee
                },
                finances: {
                  ...brandCareerState.personalLife.finances,
                  monthlyIncome: {
                    ...brandCareerState.personalLife.finances.monthlyIncome,
                    speakingFees: monthlySpeakingIncome
                  }
                }
              }
            }
          })
          
          if (imageChange !== 0) {
            console.log(`[CareerStore] Personal brand updated: Image ${imageChange > 0 ? '+' : ''}${imageChange.toFixed(1)} → ${newPublicImage.toFixed(1)}, Brand ${brandChange > 0 ? '+' : ''}${brandChange.toFixed(1)} → ${newBrandValue.toFixed(1)}, Speaking fee: $${newSpeakingFee}/gig ($${monthlySpeakingIncome}/mo)`)
          }
        }
        
        // Update championship standings with ALL participant results
        if (player.currentSeriesId && telemetryResult.allParticipants.length > 0) {
          const playerFullName = `${player.firstName} ${player.lastName}`
          
          // Convert telemetry participants to the format needed by rivalStore
          const raceParticipants: TelemetryParticipant[] = telemetryResult.allParticipants.map(p => ({
            name: p.name,
            position: p.position,
            lapsCompleted: p.lapsCompleted,
            bestLapTime: p.bestLapTime,
            isPlayer: p.isPlayer || p.name === playerFullName || p.name === telemetryResult.playerName
          }))
          
          // Update standings in rival store (pass session type to ensure only races count)
          useRivalStore.getState().updateStandingsFromRace(
            player.currentSeriesId,
            raceParticipants,
            playerFullName,
            'Race' // Explicitly mark as race session
          )
          
          console.log(`[CareerStore] Updated standings for ${player.currentSeriesId} with ${raceParticipants.length} participants`)
        }
        
        // ============================================
        // Process Hired Driver Payments and Development (for all hired drivers)
        // ============================================
        if (careerState.ownedTeam && careerState.ownedTeam.drivers.length > 0) {
          let totalDriverPayments = 0
          let updatedBudgets = { ...careerState.ownedTeam.budgets }
          
          const updatedDrivers = careerState.ownedTeam.drivers.map(hiredDriver => {
            if (!hiredDriver?.contract) return hiredDriver
            
            let driverPayment = hiredDriver.contract.salary
            
            // Simulate each hired driver's race result
            // Position relative to player with some variance
            const variance = Math.floor(Math.random() * 7) - 3  // -3 to +3
            const simulatedDriverPosition = Math.max(1, Math.min(
              position + variance,
              telemetryResult.totalParticipants
            ))
            const driverWon = simulatedDriverPosition === 1
            const driverPodium = simulatedDriverPosition <= 3
            const driverDnf = dnf && Math.random() < 0.3  // 30% chance to also DNF if player DNFs
            
            // Calculate bonuses
            if (driverWon && hiredDriver.contract.bonusPerWin) {
              driverPayment += hiredDriver.contract.bonusPerWin
              console.log(`[CareerStore] Hired driver ${hiredDriver.driverId} win bonus: +$${hiredDriver.contract.bonusPerWin}`)
            } else if (driverPodium && hiredDriver.contract.bonusPerPodium) {
              driverPayment += hiredDriver.contract.bonusPerPodium
              console.log(`[CareerStore] Hired driver ${hiredDriver.driverId} podium bonus: +$${hiredDriver.contract.bonusPerPodium}`)
            }
            
            totalDriverPayments += driverPayment
            
            // Update season stats
            const updatedDriverStats = hiredDriver.seasonStats ? {
              ...hiredDriver.seasonStats,
              races: hiredDriver.seasonStats.races + 1,
              wins: hiredDriver.seasonStats.wins + (driverWon ? 1 : 0),
              podiums: hiredDriver.seasonStats.podiums + (driverPodium ? 1 : 0),
              points: hiredDriver.seasonStats.points + (simulatedDriverPosition <= 10 ? 11 - simulatedDriverPosition : 0),
              avgFinish: ((hiredDriver.seasonStats.avgFinish * hiredDriver.seasonStats.races) + simulatedDriverPosition) / (hiredDriver.seasonStats.races + 1),
              bestFinish: Math.min(hiredDriver.seasonStats.bestFinish, simulatedDriverPosition),
              dnfs: hiredDriver.seasonStats.dnfs + (driverDnf ? 1 : 0)
            } : {
              races: 1,
              wins: driverWon ? 1 : 0,
              podiums: driverPodium ? 1 : 0,
              points: simulatedDriverPosition <= 10 ? 11 - simulatedDriverPosition : 0,
              avgFinish: simulatedDriverPosition,
              bestFinish: simulatedDriverPosition,
              dnfs: driverDnf ? 1 : 0
            }
            
            // ============================================
            // Calculate XP for driver development
            // ============================================
            // Get the rival driver to check career stage
            const rivalDriver = useRivalStore.getState().rivals.find(r => r.id === hiredDriver.driverId)
            const careerStage: DriverCareerStage = rivalDriver?.careerStage || 'peak'
            
            // Create race result for XP calculation
            const raceResultForXP: RaceResultForXP = {
              week: careerState.currentWeek,
              year: careerState.currentYear,
              position: simulatedDriverPosition,
              gridPosition: simulatedDriverPosition + Math.floor(Math.random() * 3) - 1, // Estimate grid position
              wasWet: (telemetryResult as any)?.rainDensity > 0.1 || false,
              hadBattles: simulatedDriverPosition <= 10, // Assume top 10 had battles
              dnf: driverDnf,
              polePosition: simulatedDriverPosition === 1 && Math.random() < 0.3 // 30% chance if won
            }
            
            const xpEarned = calculateRaceXP(raceResultForXP, careerStage)
            
            // Update development state
            const currentDev = hiredDriver.development || {
              experiencePoints: 0,
              experienceLevel: 1,
              trainingProgram: null,
              trainingStartWeek: 0,
              trainingStartYear: 0,
              trainingProgress: 0,
              skillBoosts: {},
              recentRaceXP: []
            }
            
            const newXP = currentDev.experiencePoints + xpEarned
            const newLevel = calculateLevelFromXP(newXP)
            const leveledUp = newLevel > currentDev.experienceLevel
            
            if (leveledUp) {
              console.log(`[CareerStore] Hired driver ${hiredDriver.driverId} leveled up to ${newLevel}!`)
            }
            
            // Keep last 5 race XP values
            const recentXP = [...(currentDev.recentRaceXP || []), xpEarned].slice(-5)
            
            const updatedDevelopment = {
              ...currentDev,
              experiencePoints: newXP,
              experienceLevel: newLevel,
              recentRaceXP: recentXP
            }
            
            console.log(`[CareerStore] Hired driver ${hiredDriver.driverId}: P${simulatedDriverPosition}, +${xpEarned} XP (total: ${newXP})`)
            
            return {
              ...hiredDriver,
              seasonStats: updatedDriverStats,
              development: updatedDevelopment
            }
          })
          
          // Deduct total payments from team budget using updateTeamBudgets for proper tracking
          if (totalDriverPayments > 0) {
            const driverPaymentTx = createTeamTransaction(
              'expense',
              'salaries',
              totalDriverPayments,
              `Hired driver race payments (${updatedDrivers.length} driver${updatedDrivers.length > 1 ? 's' : ''})`,
              careerState.currentWeek,
              careerState.currentYear,
              { countsTowardCostCap: true }
            )
            updatedBudgets = updateTeamBudgets(updatedBudgets, driverPaymentTx)
            
            const currentTeamForDriverPay = get().careerState!.ownedTeam!
            set({
              careerState: {
                ...get().careerState!,
                ownedTeam: {
                  ...currentTeamForDriverPay,
                  budgets: updatedBudgets,
                  drivers: updatedDrivers,
                  finances: {
                    ...currentTeamForDriverPay.finances,
                    transactions: [...currentTeamForDriverPay.finances.transactions, driverPaymentTx]
                  }
                }
              }
            })
            
            console.log(`[CareerStore] Total hired driver payments: -$${totalDriverPayments}`)
          } else {
            set({
              careerState: {
                ...get().careerState!,
                ownedTeam: {
                  ...get().careerState!.ownedTeam!,
                  budgets: updatedBudgets,
                  drivers: updatedDrivers
                }
              }
            })
          }
        }
        
        // ============================================
        // Process Team Race Prize Money (Team Owner Path)
        // ============================================
        {
          const teamForPrize = get().careerState?.ownedTeam
          if (teamForPrize) {
            const teamTierForPrize = teamForPrize.tier || 'amateur'
            const seriesNameForPrize = currentSeries?.name || 'Unknown Series'
            const prizeTransaction = processRacePrizeIncome(
              teamForPrize,
              position,
              teamTierForPrize,
              telemetryResult.totalParticipants,
              player.currentSeriesId || '',
              seriesNameForPrize,
              careerState.currentWeek,
              careerState.currentYear
            )
            
            if (prizeTransaction) {
              // Apply prize money to team budgets using updateTeamBudgets for proper tracking
              const updatedTeamForPrize = get().careerState?.ownedTeam
              if (updatedTeamForPrize) {
                const updatedPrizeBudgets = updateTeamBudgets(updatedTeamForPrize.budgets, prizeTransaction)
                set({
                  careerState: {
                    ...get().careerState!,
                    ownedTeam: {
                      ...updatedTeamForPrize,
                      budgets: updatedPrizeBudgets,
                      finances: {
                        ...updatedTeamForPrize.finances,
                        transactions: [...updatedTeamForPrize.finances.transactions, prizeTransaction]
                      }
                    }
                  }
                })
                console.log(`[CareerStore] Team prize money: +$${prizeTransaction.amount.toLocaleString()} for P${position}`)
              }
            }
          }
        }
        
        // ============================================
        // Process Team Sponsor Race Bonuses (win/podium bonuses from team sponsors)
        // ============================================
        {
          const teamForSponsorBonus = get().careerState?.ownedTeam
          if (teamForSponsorBonus && teamForSponsorBonus.finances?.sponsors?.length > 0) {
            const sponsorRaceBonusResult = processTeamSponsorRaceBonuses(
              teamForSponsorBonus,
              position,
              careerState.currentWeek,
              careerState.currentYear
            )
            
            if (sponsorRaceBonusResult.transactions.length > 0) {
              // Apply sponsor bonuses using updateTeamBudgets for proper yearToDate/costCap tracking
              let updatedSponsorBudgets = { ...teamForSponsorBonus.budgets }
              for (const tx of sponsorRaceBonusResult.transactions) {
                updatedSponsorBudgets = updateTeamBudgets(updatedSponsorBudgets, tx)
              }
              const totalTeamSponsorBonus = sponsorRaceBonusResult.transactions.reduce((sum, tx) => sum + tx.amount, 0)
              
              set({
                careerState: {
                  ...get().careerState!,
                  ownedTeam: {
                    ...teamForSponsorBonus,
                    budgets: updatedSponsorBudgets,
                    finances: {
                      ...teamForSponsorBonus.finances,
                      transactions: [...teamForSponsorBonus.finances.transactions, ...sponsorRaceBonusResult.transactions],
                      sponsors: sponsorRaceBonusResult.updatedSponsors
                    }
                  }
                }
              })
              console.log(`[CareerStore] Team sponsor race bonuses: +$${totalTeamSponsorBonus.toLocaleString()}`)
            } else {
              // Still update sponsor satisfaction/targets even without bonus payments
              set({
                careerState: {
                  ...get().careerState!,
                  ownedTeam: {
                    ...teamForSponsorBonus,
                    finances: {
                      ...teamForSponsorBonus.finances,
                      sponsors: sponsorRaceBonusResult.updatedSponsors
                    }
                  }
                }
              })
            }
          }
        }
        
        // ============================================
        // Process Sponsor Bonuses & Satisfaction for Race Results
        // ============================================
        const activeSponsors = player.finances.sponsorDeals.filter(d => d.active)
        let totalSponsorBonus = 0
        const updatedSponsorDeals = [...player.finances.sponsorDeals]
        const sponsorWarnings: string[] = []
        const sponsorTerminations: string[] = []
        
        // Calculate what race number this is in the season
        const seasonRaces = player.raceHistory.filter(r => 
          r.seriesId === player.currentSeriesId
        )
        const raceNumber = seasonRaces.length + 1
        
        // Determine if this is a points finish
        const isPointsFinish = !dnf && position <= 10
        
        activeSponsors.forEach(sponsor => {
          const sponsorIndex = updatedSponsorDeals.findIndex(d => d.id === sponsor.id)
          if (sponsorIndex === -1) return
          
          // Create race result for satisfaction calculation
          const raceResult: RaceResultForSatisfaction = {
            position,
            isDNF: dnf,
            gridSize: telemetryResult.totalParticipants,
            isPointsFinish,
            raceNumber
          }
          
          // Calculate satisfaction change
          const satisfactionUpdate = calculateRaceSatisfactionChange(
            sponsor.satisfaction ?? 70,
            raceResult
          )
          
          // Update sponsor deal with new satisfaction
          let updatedSponsor = { 
            ...updatedSponsorDeals[sponsorIndex],
            satisfaction: satisfactionUpdate.newSatisfaction,
            lastEvaluatedWeek: careerState.currentWeek,
            seasonRacesStarted: (sponsor.seasonRacesStarted ?? 0) + 1
          }
          
          // Update season stats
          if (position === 1 && !dnf) {
            updatedSponsor.seasonWins = (sponsor.seasonWins ?? 0) + 1
          }
          if (position <= 3 && !dnf) {
            updatedSponsor.seasonPodiums = (sponsor.seasonPodiums ?? 0) + 1
          }
          if (dnf) {
            updatedSponsor.seasonDNFs = (sponsor.seasonDNFs ?? 0) + 1
          }
          
          // Update targets progress
          if (updatedSponsor.targets && updatedSponsor.targets.length > 0) {
            updatedSponsor.targets = updatedSponsor.targets.map(target => 
              updateTargetProgress(target, {
                position,
                isDNF: dnf,
                gridSize: telemetryResult.totalParticipants
              })
            )
          }
          
          // Check for warning thresholds
          if (shouldIssueWarning(sponsor.satisfaction ?? 70, satisfactionUpdate.newSatisfaction)) {
            if (!sponsor.warningIssued) {
              updatedSponsor.warningIssued = true
              sponsorWarnings.push(sponsor.sponsorName)
              console.log(`[CareerStore] Sponsor warning from ${sponsor.sponsorName}: satisfaction dropped to ${satisfactionUpdate.newSatisfaction}`)
            } else if (!sponsor.finalWarningIssued && satisfactionUpdate.newSatisfaction < 30) {
              updatedSponsor.finalWarningIssued = true
              sponsorWarnings.push(`${sponsor.sponsorName} (FINAL WARNING)`)
              console.log(`[CareerStore] FINAL WARNING from ${sponsor.sponsorName}!`)
            }
          }
          
          // Check for contract termination
          if (shouldTerminateContract(satisfactionUpdate.newSatisfaction)) {
            updatedSponsor.active = false
            sponsorTerminations.push(sponsor.sponsorName)
            console.log(`[CareerStore] ${sponsor.sponsorName} has TERMINATED sponsorship due to poor performance!`)
          }
          
          // Process bonuses (adjusted by satisfaction)
          if (!dnf) {
            let bonusAmount = 0
            let bonusDescription = ''
            
            if (position === 1 && sponsor.bonusPerWin > 0) {
              bonusAmount = calculateAdjustedBonus(sponsor.bonusPerWin, updatedSponsor.satisfaction)
              bonusDescription = `${sponsor.sponsorName} Win Bonus`
            } else if (position <= 3 && sponsor.bonusPerPodium > 0) {
              bonusAmount = calculateAdjustedBonus(sponsor.bonusPerPodium, updatedSponsor.satisfaction)
              bonusDescription = `${sponsor.sponsorName} Podium Bonus`
            }
            
            if (bonusAmount > 0 && updatedSponsor.active) {
              totalSponsorBonus += bonusAmount
              get().addTransaction({
                type: 'income',
                category: 'bonus',
                amount: bonusAmount,
                description: bonusDescription,
                date: new Date().toISOString(),
                week: careerState.currentWeek,
                year: careerState.currentYear
              })
              console.log(`[CareerStore] Sponsor bonus: +$${bonusAmount} from ${sponsor.sponsorName} (satisfaction: ${updatedSponsor.satisfaction})`)
            }
          }
          
          updatedSponsorDeals[sponsorIndex] = updatedSponsor
        })
        
        // Update player with new sponsor data
        const currentPlayerForSponsors = get().player
        if (currentPlayerForSponsors) {
          set({
            player: {
              ...currentPlayerForSponsors,
              finances: {
                ...currentPlayerForSponsors.finances,
                sponsorDeals: updatedSponsorDeals
              }
            }
          })
        }
        
        // Generate career events for sponsor warnings
        const currentEvents = careerState.events || []
        const newEvents: CareerEvent[] = []
        
        // Add warning events
        for (const warning of sponsorWarnings) {
          const isFinal = warning.includes('FINAL WARNING')
          const sponsorName = warning.replace(' (FINAL WARNING)', '')
          const sponsor = updatedSponsorDeals.find(s => s.sponsorName === sponsorName)
          if (sponsor) {
            newEvents.push(generateSponsorWarningEvent(
              sponsorName,
              sponsor.satisfaction ?? 70,
              isFinal,
              careerState.currentWeek,
              careerState.currentYear
            ))
          }
        }
        
        // Add termination events
        for (const termination of sponsorTerminations) {
          const sponsor = player.finances.sponsorDeals.find(s => s.sponsorName === termination)
          if (sponsor) {
            newEvents.push(generateSponsorTerminationEvent(
              termination,
              sponsor.monthlyPayment,
              careerState.currentWeek,
              careerState.currentYear
            ))
          }
        }
        
        // === EMAIL NOTIFICATIONS FOR SPONSOR WARNINGS/TERMINATIONS ===
        for (const warning of sponsorWarnings) {
          const isFinal = warning.includes('FINAL WARNING')
          const sponsorName = warning.replace(' (FINAL WARNING)', '')
          routeNotification({
            category: 'sponsor',
            subject: isFinal ? `FINAL WARNING: ${sponsorName} Sponsorship at Risk` : `Sponsor Warning: ${sponsorName} Unhappy`,
            body: isFinal
              ? `${sponsorName} has issued a FINAL WARNING. Their satisfaction is critically low. If performance does not improve immediately, they will terminate the contract. Review their expectations urgently.`
              : `${sponsorName} has expressed concerns about team performance. Their satisfaction is declining. Review their expectations and make improvements before the situation worsens.`,
            emailCategory: 'sponsor',
            urgency: 'high'
          })
        }
        for (const termination of sponsorTerminations) {
          const sponsor = player.finances.sponsorDeals.find(s => s.sponsorName === termination)
          routeNotification({
            category: 'sponsor',
            subject: `Contract Terminated: ${termination}`,
            body: `${termination} has terminated their sponsorship contract due to ongoing dissatisfaction with team performance.${sponsor ? ` This represents a loss of $${sponsor.monthlyPayment.toLocaleString()} per month in sponsorship revenue.` : ''} Seek replacement sponsors as soon as possible.`,
            emailCategory: 'sponsor',
            urgency: 'high'
          })
        }

        // Add events to career state
        if (newEvents.length > 0) {
          const updatedCareerStateForEvents = get().careerState
          if (updatedCareerStateForEvents) {
            set({
              careerState: {
                ...updatedCareerStateForEvents,
                events: [...currentEvents, ...newEvents]
              }
            })
          }
        }
        
        // Apply reputation penalty for terminated sponsors
        if (sponsorTerminations.length > 0) {
          const repPenalty = sponsorTerminations.length * REPUTATION_IMPACT.sponsorTerminated
          const marketabilityPenalty = sponsorTerminations.length * REPUTATION_IMPACT.marketabilityPenalty
          
          const playerAfterTerminations = get().player
          if (playerAfterTerminations) {
            set({
              player: {
                ...playerAfterTerminations,
                reputation: Math.round(Math.max(0, playerAfterTerminations.reputation + repPenalty) * 10) / 10,
                stats: {
                  ...playerAfterTerminations.stats,
                  marketability: Math.max(0, playerAfterTerminations.stats.marketability + marketabilityPenalty)
                }
              }
            })
            console.log(`[CareerStore] Reputation penalty: ${repPenalty}, Marketability penalty: ${marketabilityPenalty}`)
          }
        }
        
        if (totalSponsorBonus > 0) {
          console.log(`[CareerStore] Total sponsor bonuses: +$${totalSponsorBonus}`)
        }
        
        // === RACE RESULT SUMMARY EMAIL ===
        const posOrdinal = position === 1 ? '1st' : position === 2 ? '2nd' : position === 3 ? '3rd' : `${position}th`
        const resultSummary = dnf 
          ? `Unfortunately, you did not finish the race (DNF).`
          : `You finished in ${posOrdinal} position${fastestLap ? ' with the fastest lap!' : '.'}`
        const bonusInfo = totalSponsorBonus > 0 ? `\n\n**Sponsor Bonuses:** $${totalSponsorBonus.toLocaleString()}` : ''
        const warningInfo = sponsorWarnings.length > 0 ? `\n\n**Sponsor Concerns:** ${sponsorWarnings.join(', ')} have expressed dissatisfaction.` : ''
        
        routeNotification({
          category: 'race_engineer',
          subject: `Race Result: ${posOrdinal}${dnf ? ' (DNF)' : ''}`,
          body: `**Race Debrief**\n\n${resultSummary}\n\n**Points Earned:** ${points}${bonusInfo}${warningInfo}\n\nDetailed performance analysis is available in the Stats section.`,
          emailCategory: 'team'
        })

        // ============================================
        // Update Contract (Team) Satisfaction After Race
        // ============================================
        const playerForContract = get().player
        if (playerForContract?.contract && playerForContract.contract.teamSatisfaction !== undefined) {
          const contract = playerForContract.contract
          const seasonStats: ContractSeasonStats = contract.seasonStats || {
            racesCompleted: 0,
            wins: 0,
            podiums: 0,
            points: 0,
            dnfCount: 0,
            teammateBattleWins: 0,
            teammateBattleLosses: 0,
            warningsIssued: 0,
            seasonYear: careerState.currentYear
          }
          
          const contractRaceResult: RaceResultForContract = {
            position,
            isDNF: dnf,
            gridSize: telemetryResult.totalParticipants,
            isPointsFinish: !dnf && position <= 10,
            raceNumber: seasonStats.racesCompleted + 1,
            pointsScored: points,
            beatTeammate: false, // Will be determined by teammate comparison
            teammatePosition: undefined
          }
          
          // Check teammate comparison if available
          const playerTeam = useRivalStore.getState().getTeamById(playerForContract.currentTeamId || '')
          if (playerTeam && telemetryResult.allParticipants.length > 0) {
            const playerFullName = `${playerForContract.firstName} ${playerForContract.lastName}`
            const teammateResult = telemetryResult.allParticipants.find(p => 
              !p.isPlayer && p.name !== playerFullName && 
              playerTeam.drivers.some(d => {
                const rivalDriver = useRivalStore.getState().rivals.find(r => r.id === d)
                return rivalDriver && `${rivalDriver.firstName} ${rivalDriver.lastName}` === p.name
              })
            )
            if (teammateResult) {
              contractRaceResult.teammatePosition = teammateResult.position
              contractRaceResult.beatTeammate = position < teammateResult.position
            }
          }
          
          const maxDNFsBeforeWarning = contract.terminationConditions?.maxDNFsBeforeWarning || 5
          const contractSatisfactionUpdate = calculateContractSatisfactionChange(
            contract.teamSatisfaction ?? DEFAULT_TEAM_SATISFACTION,
            contractRaceResult,
            seasonStats.dnfCount + (dnf ? 1 : 0),
            maxDNFsBeforeWarning
          )
          
          // Update contract targets
          const updatedTargets = contract.targets 
            ? updateContractTargets(contract.targets, contractRaceResult)
            : undefined
          
          // Update season stats
          const updatedSeasonStats = updateContractSeasonStats(seasonStats, contractRaceResult)
          
          // Build satisfaction history entry
          const historyEntry = {
            week: careerState.currentWeek,
            year: careerState.currentYear,
            oldValue: contract.teamSatisfaction ?? DEFAULT_TEAM_SATISFACTION,
            newValue: contractSatisfactionUpdate.newSatisfaction,
            reason: contractSatisfactionUpdate.reason
          }
          
          // Check for warnings
          let warningIssued = contract.warningIssued || false
          let finalWarningIssued = contract.finalWarningIssued || false
          if (contractSatisfactionUpdate.triggeredWarning && !warningIssued) {
            warningIssued = true
            console.log(`[CareerStore] Team contract WARNING: satisfaction dropped to ${contractSatisfactionUpdate.newSatisfaction}`)
            routeNotification({
              category: 'team_manager',
              subject: `Performance Warning: ${contract.teamName}`,
              body: `Your performance has not met expectations. Team satisfaction has dropped to ${contractSatisfactionUpdate.newSatisfaction}%.\n\nReason: ${contractSatisfactionUpdate.reason || 'Below-par results'}\n\nPlease improve your results to avoid further action.`,
              emailCategory: 'team',
              urgency: 'high'
            })
          }
          if (contractSatisfactionUpdate.triggeredFinalWarning && !finalWarningIssued) {
            finalWarningIssued = true
            console.log(`[CareerStore] Team contract FINAL WARNING: satisfaction at ${contractSatisfactionUpdate.newSatisfaction}`)
            routeNotification({
              category: 'team_manager',
              subject: `FINAL WARNING: ${contract.teamName} Contract at Risk`,
              body: `This is your **final warning**. Team satisfaction is critically low at ${contractSatisfactionUpdate.newSatisfaction}%.\n\nIf results do not improve immediately, your contract will be terminated. This is not a decision we take lightly, but the team's competitive future must come first.`,
              emailCategory: 'team',
              urgency: 'high'
            })
          }
          
          // Check for termination
          if (contractSatisfactionUpdate.triggeredTermination) {
            console.log(`[CareerStore] Team contract TERMINATED: satisfaction at ${contractSatisfactionUpdate.newSatisfaction}`)
            // Generate termination email
            get().addEmail({
              category: 'team',
              subject: 'Contract Terminated - Poor Performance',
              sender: contract.teamName,
              senderRole: 'Team Principal',
              preview: `Due to continued poor performance, your contract with ${contract.teamName} has been terminated...`,
              body: `Dear Driver,\n\nWe regret to inform you that your contract with **${contract.teamName}** has been terminated effective immediately due to sustained poor performance.\n\nTeam satisfaction had dropped to ${contractSatisfactionUpdate.newSatisfaction}%, which is below the termination threshold.\n\nYou are now a free agent and may seek offers from other teams.\n\nRegards,\n${contract.teamName} Management`,
              receivedDay: careerState.currentDay,
              receivedWeek: careerState.currentWeek,
              receivedYear: careerState.currentYear,
              read: false,
              starred: false,
              archived: false,
              actionType: 'acknowledge'
            })
            
            // Clear the contract
            set({
              player: {
                ...get().player!,
                contract: undefined,
                currentTeamId: undefined,
                currentSeriesId: undefined
              }
            })
          } else {
            // Update contract with new satisfaction
            set({
              player: {
                ...get().player!,
                contract: {
                  ...contract,
                  teamSatisfaction: contractSatisfactionUpdate.newSatisfaction,
                  warningIssued,
                  finalWarningIssued,
                  targets: updatedTargets || contract.targets,
                  seasonStats: updatedSeasonStats,
                  satisfactionHistory: [...(contract.satisfactionHistory || []), historyEntry]
                }
              }
            })
          }
          
          if (contractSatisfactionUpdate.change !== 0) {
            console.log(`[CareerStore] Contract satisfaction: ${contractSatisfactionUpdate.change > 0 ? '+' : ''}${contractSatisfactionUpdate.change} (${contractSatisfactionUpdate.reason}) → ${contractSatisfactionUpdate.newSatisfaction}`)
          }
        }
        
        // ============================================
        // Race-Based Skill Progression
        // ============================================
        // Skills improve automatically from racing experience
        const currentPlayer = get().player
        if (currentPlayer) {
          let newStats = { ...currentPlayer.stats }
          let newMentalState = { ...currentPlayer.mentalState }
          
          // Base XP: Every race gives some experience
          const racingSkills: (keyof typeof newStats)[] = ['racecraft', 'consistency', 'tireManagement']
          const randomSkill = racingSkills[Math.floor(Math.random() * racingSkills.length)]
          newStats[randomSkill] = Math.min(100, newStats[randomSkill] + 0.5)
          
          // Performance bonuses based on result
          if (dnf) {
            // DNF: Small fitness loss but gain mental strength (learn from failure)
            newStats.fitness = Math.max(0, newStats.fitness - 0.5)
            newStats.mentalStrength = Math.min(100, newStats.mentalStrength + 1)
            newMentalState.confidence = Math.max(0, newMentalState.confidence - 5)
          } else if (position === 1) {
            // Win: Big racecraft boost + confidence
            newStats.racecraft = Math.min(100, newStats.racecraft + 2)
            newMentalState.confidence = Math.min(100, newMentalState.confidence + 10)
            newMentalState.morale = Math.min(100, newMentalState.morale + 15)
          } else if (position <= 3) {
            // Podium: Consistency boost
            newStats.consistency = Math.min(100, newStats.consistency + 1.5)
            newMentalState.confidence = Math.min(100, newMentalState.confidence + 5)
            newMentalState.morale = Math.min(100, newMentalState.morale + 10)
          } else if (position <= 5) {
            // Top 5: Random skill boost
            const topSkills: (keyof typeof newStats)[] = ['racecraft', 'consistency', 'tireManagement', 'technicalFeedback']
            const bonusSkill = topSkills[Math.floor(Math.random() * topSkills.length)]
            newStats[bonusSkill] = Math.min(100, newStats[bonusSkill] + 1)
            newMentalState.morale = Math.min(100, newMentalState.morale + 5)
          } else if (position <= 10) {
            // Top 10: Small random skill boost
            const smallBoostSkills: (keyof typeof newStats)[] = ['consistency', 'tireManagement']
            const smallBoostSkill = smallBoostSkills[Math.floor(Math.random() * smallBoostSkills.length)]
            newStats[smallBoostSkill] = Math.min(100, newStats[smallBoostSkill] + 0.5)
          } else {
            // Poor result: Slight morale drop
            newMentalState.morale = Math.max(0, newMentalState.morale - 3)
          }
          
          // Fastest lap bonus
          if (fastestLap) {
            newMentalState.confidence = Math.min(100, newMentalState.confidence + 3)
          }
          
          // Racing adds some fatigue
          newMentalState.fatigue = Math.min(100, newMentalState.fatigue + 15)
          
          // Update player with new stats
          set({
            player: {
              ...currentPlayer,
              stats: newStats,
              mentalState: newMentalState
            }
          })
          
          console.log(`[CareerStore] Race progression: +${randomSkill}, Position P${position}`)
        }
        
        // ============================================
        // Update Achievement Tracking Stats
        // ============================================
        const latestPlayer = get().player
        if (latestPlayer) {
          const isWin = position === 1 && !dnf
          const isPodium = position <= 3 && !dnf
          const isPointsFinish = position <= 10 && !dnf
          const isComeback = isWin && latestPlayer.raceHistory.length > 0 && 
            latestPlayer.raceHistory[latestPlayer.raceHistory.length - 1]?.qualifyingPosition >= 10
          
          // Update consecutive streaks
          let newConsecutiveWins = latestPlayer.consecutiveWins || 0
          let newConsecutivePodiums = latestPlayer.consecutivePodiums || 0
          let newConsecutivePoints = latestPlayer.consecutivePoints || 0
          
          if (isWin) {
            newConsecutiveWins++
          } else {
            newConsecutiveWins = 0
          }
          
          if (isPodium) {
            newConsecutivePodiums++
          } else {
            newConsecutivePodiums = 0
          }
          
          if (isPointsFinish) {
            newConsecutivePoints++
          } else {
            newConsecutivePoints = 0
          }
          
          // Update fastest laps and other stats
          const newTotalFastestLaps = (latestPlayer.totalFastestLaps || 0) + (fastestLap ? 1 : 0)
          const newComebackWins = (latestPlayer.comebackWins || 0) + (isComeback ? 1 : 0)
          
          // Check for hat trick (assuming pole from qualifyingPosition in current race)
          // Note: This is simplified - ideally we'd track quali separately
          const currentQualiPos = latestPlayer.raceHistory.length > 0 
            ? latestPlayer.raceHistory[latestPlayer.raceHistory.length - 1]?.qualifyingPosition 
            : 99
          const isHatTrick = isWin && currentQualiPos === 1 && fastestLap
          const newHatTricks = (latestPlayer.hatTricks || 0) + (isHatTrick ? 1 : 0)
          
          set({
            player: {
              ...latestPlayer,
              totalFastestLaps: newTotalFastestLaps,
              consecutiveWins: newConsecutiveWins,
              consecutivePodiums: newConsecutivePodiums,
              consecutivePoints: newConsecutivePoints,
              comebackWins: newComebackWins,
              hatTricks: newHatTricks
            }
          })
          
          // Trigger GOAT progress update
          const goatResults = get().updateGOATProgress()
          
          if (goatResults.newMilestones.length > 0) {
            console.log(`[CareerStore] New milestones unlocked:`, goatResults.newMilestones)
            // === EMAIL NOTIFICATION FOR MILESTONE UNLOCKS ===
            routeNotification({
              category: 'media_pr',
              subject: `Milestone Unlocked: ${goatResults.newMilestones.map((m: string) => formatMilestoneName(m as keyof MilestoneProgress)).join(', ')}`,
              body: `Congratulations! You've unlocked new career milestones:\n\n${goatResults.newMilestones.map((m: string) => `- ${formatMilestoneName(m as keyof MilestoneProgress)}`).join('\n')}\n\nThese achievements will be recognized by fans, media, and sponsors alike.`,
              emailCategory: 'team'
            })
          }
          if (goatResults.newTripleCrownLegs.length > 0) {
            console.log(`[CareerStore] Triple Crown legs completed:`, goatResults.newTripleCrownLegs)
            routeNotification({
              category: 'media_pr',
              subject: `Triple Crown Progress!`,
              body: `You've completed new legs of the Triple Crown: ${goatResults.newTripleCrownLegs.join(', ')}. The motorsport world is watching your historic journey.`,
              emailCategory: 'team'
            })
          }
          if (goatResults.newRecordsBroken.length > 0) {
            console.log(`[CareerStore] Records broken:`, goatResults.newRecordsBroken)
            routeNotification({
              category: 'media_pr',
              subject: `Records Broken!`,
              body: `You've broken new records: ${goatResults.newRecordsBroken.join(', ')}. Your name is being etched into motorsport history.`,
              emailCategory: 'team'
            })
          }
        }
        
        // ============================================
        // Apply Post-Race Wear to Car
        // ============================================
        const currentCareerState = get().careerState
        if (currentCareerState?.ownedTeam && currentCareerState.cars && currentCareerState.cars.length > 0) {
          // Find the car being raced (owner's car in the current series)
          const currentSeriesIdForWear = player.currentSeriesId
          const racedCarIndex = currentCareerState.cars.findIndex(
            c => c.seriesId === currentSeriesIdForWear && c.driverType === 'owner'
          )
          
          if (racedCarIndex !== -1) {
            const racedCar = currentCareerState.cars[racedCarIndex]
            
            // Determine race length type from series format
            const seriesFormat = currentSeriesData?.format || 'sprint'
            const lengthMultiplier = seriesFormat === 'endurance' ? 1.5 
              : seriesFormat === 'sprint' ? 0.7 
              : 1.0
            
            // Calculate wear for each component
            const calculateComponentWear = (
              component: keyof CarPartWear, 
              baseWear: number,
              hasDNF: boolean,
              wasInContact: boolean
            ): number => {
              // Base wear rates per component
              const componentBaseRates: Record<keyof CarPartWear, number> = {
                brakes: 6,      // Brakes wear most per race
                engine: 4.5,    // Engine takes significant stress
                gearbox: 3.5,   // Gearbox moderate wear from shifts
                suspension: 4,  // Suspension from bumps and curbs
                chassis: 2      // Chassis lowest unless incidents
              }
              
              let wear = componentBaseRates[component] * lengthMultiplier
              
              // Add randomness (+/- 2%)
              wear += (Math.random() - 0.5) * 4
              
              // DNF adds extra wear (mechanical stress from failure)
              if (hasDNF) {
                wear += component === 'engine' || component === 'gearbox' 
                  ? Math.random() * 10 + 5 // Engine/gearbox failures cause significant wear
                  : Math.random() * 5
              }
              
              // Contact/incidents add chassis and suspension wear
              if (wasInContact) {
                if (component === 'chassis') wear += Math.random() * 8 + 4
                if (component === 'suspension') wear += Math.random() * 6 + 3
              }
              
              return Math.max(0, Math.min(100, baseWear + wear))
            }
            
            // Check if there was contact (estimate from position changes in race)
            // If player finished much lower than their quali position, assume some contact
            const qualiPosition = telemetryResult.playerPosition // Simplified - using race position
            const wasInContact = dnf || (position - qualiPosition > 5)
            
            const newPartWear: CarPartWear = {
              engine: calculateComponentWear('engine', racedCar.partWear.engine, dnf, wasInContact),
              chassis: calculateComponentWear('chassis', racedCar.partWear.chassis, dnf, wasInContact),
              gearbox: calculateComponentWear('gearbox', racedCar.partWear.gearbox, dnf, wasInContact),
              brakes: calculateComponentWear('brakes', racedCar.partWear.brakes, dnf, wasInContact),
              suspension: calculateComponentWear('suspension', racedCar.partWear.suspension, dnf, wasInContact)
            }
            
            // Calculate mileage added (50-300km depending on race type)
            const baseMileage = seriesFormat === 'endurance' ? 200 
              : seriesFormat === 'sprint' ? 80 
              : 120
            const mileageAdded = Math.round(baseMileage + (Math.random() - 0.5) * 50)
            
            // Calculate new reliability
            const avgWear = Object.values(newPartWear).reduce((sum, v) => sum + v, 0) / 5
            const newReliability = Math.max(40, Math.round(100 - avgWear * 0.6))
            
            // Update the car
            const updatedCars = [...currentCareerState.cars]
            updatedCars[racedCarIndex] = {
              ...racedCar,
              partWear: newPartWear,
              mileage: racedCar.mileage + mileageAdded,
              reliability: newReliability
            }
            
            set({
              careerState: {
                ...currentCareerState,
                cars: updatedCars
              }
            })
            
            // Log wear changes
            const wearChanges = {
              engine: Math.round(newPartWear.engine - racedCar.partWear.engine),
              chassis: Math.round(newPartWear.chassis - racedCar.partWear.chassis),
              gearbox: Math.round(newPartWear.gearbox - racedCar.partWear.gearbox),
              brakes: Math.round(newPartWear.brakes - racedCar.partWear.brakes),
              suspension: Math.round(newPartWear.suspension - racedCar.partWear.suspension)
            }
            
            console.log(`[CareerStore] Post-race wear applied: Engine +${wearChanges.engine}%, Brakes +${wearChanges.brakes}%, Reliability: ${newReliability}%`)
            
            // Check for critical wear and potentially send warning email
            const criticalParts = (Object.keys(newPartWear) as (keyof CarPartWear)[])
              .filter(part => newPartWear[part] >= 80)
            
            if (criticalParts.length > 0) {
              get()._sendCriticalWearWarning(racedCar, criticalParts, newPartWear)
            }
            
            // ============================================
            // Process Car Repair Costs (DNF or high damage)
            // ============================================
            const teamForRepair = get().careerState?.ownedTeam
            if (teamForRepair) {
              const teamTierForRepair = teamForRepair.tier || 'amateur'
              let damageType: 'minor' | 'major' | 'engine' | 'gearbox' | null = null
              
              if (dnf) {
                // DNF: Determine damage type based on which component has highest wear
                const maxWearPart = (Object.entries(newPartWear) as [keyof typeof newPartWear, number][])
                  .reduce((max, [part, wear]) => wear > max[1] ? [part, wear] : max, ['engine' as keyof typeof newPartWear, 0])
                
                if (maxWearPart[0] === 'engine' && maxWearPart[1] > 70) {
                  damageType = 'engine'
                } else if (maxWearPart[0] === 'gearbox' && maxWearPart[1] > 70) {
                  damageType = 'gearbox'
                } else {
                  damageType = 'major'
                }
              } else if (wasInContact && newReliability < 60) {
                // Contact damage but finished the race
                damageType = 'minor'
              }
              
              if (damageType) {
                const repairTransaction = processCarRepair(
                  teamForRepair,
                  teamTierForRepair,
                  damageType,
                  racedCar.carId,
                  careerState.currentWeek,
                  careerState.currentYear
                )
                
                // Apply repair cost to team budgets using updateTeamBudgets for proper tracking
                const updatedRepairBudgets = updateTeamBudgets(teamForRepair.budgets, repairTransaction)
                set({
                  careerState: {
                    ...get().careerState!,
                    ownedTeam: {
                      ...teamForRepair,
                      budgets: updatedRepairBudgets,
                      finances: {
                        ...teamForRepair.finances,
                        transactions: [...teamForRepair.finances.transactions, repairTransaction]
                      }
                    }
                  }
                })
                
                console.log(`[CareerStore] Car repair (${damageType}): -$${repairTransaction.amount.toLocaleString()}`)
              }
            }
          }
        }
        
        // ============================================
        // Update Financial Projections (after race results)
        // ============================================
        const latestCareerStateForProjections = get().careerState
        if (latestCareerStateForProjections?.ownedTeam) {
          const teamForProj = latestCareerStateForProjections.ownedTeam
          const tierForProj: TeamTier = teamForProj.tier || 'amateur'
          
          // Calculate races remaining in season
          const seriesForProj = useRivalStore.getState().getSeriesById(player.currentSeriesId || '')
          const currentWeekForProj = latestCareerStateForProjections.currentWeek
          const racesRemainingForProj = seriesForProj?.calendar?.filter(
            (r: { week: number }) => r.week > currentWeekForProj
          ).length || 0
          const seasonEndWeekForProj = seriesForProj?.calendar?.reduce(
            (max: number, r: { week: number }) => Math.max(max, r.week), 48
          ) || 48
          
          // Get current championship position estimate
          const standings = useRivalStore.getState().getStandings(player.currentSeriesId || '')
          const playerStanding = standings.find(s => s.isPlayer)
          const expectedPosition = playerStanding?.position || 10
          
          // Get development intensity
          const devIntensity = latestCareerStateForProjections.teamDevelopment?.budget?.weeklyAllocation
            ? Math.min(2.0, Math.max(0.5, latestCareerStateForProjections.teamDevelopment.budget.weeklyAllocation / 50000))
            : 1.0
          
          // Update projections
          const updatedBudgetsWithProjections = updateTeamProjections(
            teamForProj,
            tierForProj,
            currentWeekForProj,
            seasonEndWeekForProj,
            racesRemainingForProj,
            expectedPosition,
            devIntensity
          )
          
          set({
            careerState: {
              ...latestCareerStateForProjections,
              ownedTeam: {
                ...teamForProj,
                budgets: updatedBudgetsWithProjections
              }
            }
          })
        }
        
        // Recalculate marketability after race results (wins/podiums affect it)
        setTimeout(() => get().recalculateMarketability(), 100)
        
        // Recalculate team reputation after each race (tracks player performance)
        setTimeout(() => get().recalculateTeamReputation(), 150)
        
        // Note: Media presence from race results is already updated in the
        // "Personal Life Brand & Public Image" section above (lines ~11781-11849)
        // which applies tier-scaled mediaPresence changes. No additional update needed here.
        
        return { points, prizeMoney, repChange }
      },

      resetCareer: () => {
        set({
          hasActiveCareer: false,
          player: null,
          careerState: null
        })
      },

      repairCareerData: () => {
        const { player, careerState } = get()
        if (!player || !careerState) {
          return { 
            duplicateRacesRemoved: 0, 
            duplicateTransactionsRemoved: 0, 
            statsRecalculated: false,
            standingsFixed: false,
            oldRep: 0,
            newRep: 0,
            oldBalance: 0,
            newBalance: 0
          }
        }

        console.log('[CareerStore] Starting career data repair...')
        const oldRep = player.reputation
        const oldBalance = player.finances.bankBalance

        // ============================================
        // 1. REMOVE DUPLICATE RACE RESULTS
        // ============================================
        // The bug created multiple entries with DIFFERENT round numbers for the SAME track
        // So we need to detect duplicates by track name + approximate date (same day)
        const seenRaces = new Set<string>()
        const cleanedRaceHistory: RaceResult[] = []
        let duplicateRacesRemoved = 0

        // Sort by date (oldest first) to keep the first occurrence
        const sortedRaces = [...player.raceHistory].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )

        for (const race of sortedRaces) {
          // Create key using track name + date (just the day, not time) to catch same-day duplicates
          const raceDate = race.date ? race.date.substring(0, 10) : 'unknown' // YYYY-MM-DD
          const trackKey = race.trackName.toLowerCase().replace(/[^a-z0-9]/g, '')
          const key = `${race.seriesId}_${trackKey}_${raceDate}`
          
          if (!seenRaces.has(key)) {
            seenRaces.add(key)
            cleanedRaceHistory.push(race)
          } else {
            duplicateRacesRemoved++
            console.log(`[Repair] Removing duplicate race: ${race.seriesId} Round ${race.round} at ${race.trackName} (${raceDate})`)
          }
        }

        // ============================================
        // 2. RENUMBER ROUNDS BASED ON CALENDAR ORDER
        // ============================================
        // After removing duplicates, fix the round numbers to match calendar
        const currentSeries = useRivalStore.getState().getSeriesById(player.currentSeriesId || '')
        const calendar = currentSeries?.calendar || []
        
        // Create a map of trackId -> round number from calendar
        const trackToRound = new Map<string, number>()
        calendar.forEach(event => {
          // Match by track name (normalize for comparison)
          const normalizedTrack = event.trackName.toLowerCase().replace(/[^a-z0-9]/g, '')
          trackToRound.set(normalizedTrack, event.round)
        })
        
        // Fix round numbers in cleaned race history
        const fixedRaceHistory = cleanedRaceHistory.map((race, index) => {
          const normalizedTrack = race.trackName.toLowerCase().replace(/[^a-z0-9]/g, '')
          const correctRound = trackToRound.get(normalizedTrack) || (index + 1)
          if (race.round !== correctRound) {
            console.log(`[Repair] Fixing round: ${race.trackName} R${race.round} -> R${correctRound}`)
          }
          return { ...race, round: correctRound }
        })

        // ============================================
        // 3. REMOVE DUPLICATE PRIZE MONEY TRANSACTIONS
        // ============================================
        // The bug created multiple prize transactions with different round numbers but same track
        const seenPrizeTransactions = new Set<string>()
        const cleanedTransactions: FinancialTransaction[] = []
        let duplicateTransactionsRemoved = 0
        let totalPrizeMoneyRemoved = 0

        // Sort by date (oldest first)
        const sortedTransactions = [...player.finances.transactions].sort((a, b) =>
          new Date(a.date || '').getTime() - new Date(b.date || '').getTime()
        )

        for (const tx of sortedTransactions) {
          // Check if this is a prize money transaction
          if (tx.category === 'prize' && tx.description?.includes('Prize money')) {
            // Extract track name from description like "Prize money - Round 2 at Spielberg Spielberg_Modern"
            const trackMatch = tx.description.match(/at (.+)$/)
            if (trackMatch) {
              const trackName = trackMatch[1].toLowerCase().replace(/[^a-z0-9]/g, '')
              // Use week + year + track as the key (not round number!)
              const key = `prize_${tx.week}_${tx.year}_${trackName}`
              if (!seenPrizeTransactions.has(key)) {
                seenPrizeTransactions.add(key)
                cleanedTransactions.push(tx)
              } else {
                duplicateTransactionsRemoved++
                totalPrizeMoneyRemoved += tx.amount
                console.log(`[Repair] Removing duplicate prize transaction: ${tx.description}`)
              }
            } else {
              cleanedTransactions.push(tx)
            }
          } else {
            cleanedTransactions.push(tx)
          }
        }

        // ============================================
        // 4. RECALCULATE STATS FROM CLEANED RACE HISTORY
        // ============================================
        const actualWins = fixedRaceHistory.filter(r => r.racePosition === 1).length
        const actualPodiums = fixedRaceHistory.filter(r => r.racePosition <= 3).length
        const actualPoles = fixedRaceHistory.filter(r => r.qualifyingPosition === 1).length
        const actualRaces = fixedRaceHistory.length

        console.log(`[Repair] Recalculated stats: ${actualRaces} races, ${actualWins} wins, ${actualPodiums} podiums, ${actualPoles} poles`)

        // ============================================
        // 5. RECALCULATE REPUTATION
        // ============================================
        // Use aligned values matching recalculateReputation() system
        let calculatedRep = 30 // Base reputation
        
        for (const race of fixedRaceHistory) {
          if (race.dnf) calculatedRep -= 1
          else if (race.racePosition === 1) calculatedRep += 2
          else if (race.racePosition <= 3) calculatedRep += 1.5
          else if (race.racePosition <= 5) calculatedRep += 1
          else if (race.racePosition <= 10) calculatedRep += 0.5
          else if (race.racePosition > 15) calculatedRep -= 0.5
          if (race.fastestLap) calculatedRep += 0.5
        }
        
        // Clamp to valid range
        const newRep = Math.min(100, Math.max(0, calculatedRep))

        // ============================================
        // 6. RECALCULATE FINANCIAL BALANCE
        // ============================================
        // Sum up all cleaned transactions
        const newBalance = cleanedTransactions.reduce((sum, tx) => {
          if (tx.type === 'income') return sum + tx.amount
          if (tx.type === 'expense') return sum - tx.amount
          return sum
        }, 0)

        console.log(`[Repair] Balance: ${oldBalance} -> ${newBalance} (removed ${totalPrizeMoneyRemoved} in duplicate prizes)`)
        console.log(`[Repair] Reputation: ${oldRep} -> ${newRep}`)
        console.log(`[Repair] Races: ${player.raceHistory.length} -> ${fixedRaceHistory.length} (removed ${duplicateRacesRemoved})`)

        // ============================================
        // 7. FIX SPONSOR STATS
        // ============================================
        // The bug inflated seasonRacesStarted and seasonDNFs - recalculate from actual race history
        const actualDNFs = fixedRaceHistory.filter(r => r.dnf).length
        
        const fixedSponsorDeals = player.finances.sponsorDeals.map(sponsor => ({
          ...sponsor,
          seasonRacesStarted: actualRaces,
          seasonDNFs: actualDNFs
        }))
        
        console.log(`[Repair] Fixed sponsor stats: ${actualRaces} races, ${actualDNFs} DNFs (was ${player.finances.sponsorDeals[0]?.seasonRacesStarted ?? 0} races, ${player.finances.sponsorDeals[0]?.seasonDNFs ?? 0} DNFs)`)

        // ============================================
        // 8. APPLY ALL FIXES
        // ============================================
        set({
          player: {
            ...player,
            raceHistory: fixedRaceHistory,
            totalRaces: actualRaces,
            totalWins: actualWins,
            totalPodiums: actualPodiums,
            totalPoles: actualPoles,
            reputation: newRep,
            finances: {
              ...player.finances,
              transactions: cleanedTransactions,
              bankBalance: newBalance,
              sponsorDeals: fixedSponsorDeals
            }
          }
        })

        // ============================================
        // 9. FIX RIVAL STANDINGS RACE COUNTS
        // ============================================
        let standingsFixed = false
        const seriesId = player.currentSeriesId
        if (seriesId) {
          const rivalStore = useRivalStore.getState()
          const actualRaceCount = fixedRaceHistory.length
          
          console.log(`[Repair] Fixing standings race count for ${seriesId} to ${actualRaceCount}`)
          rivalStore.resetStandingsRaceCount(seriesId, actualRaceCount)
          standingsFixed = true
        }

        console.log(`[CareerStore] Career data repair complete!`)
        console.log(`  - Duplicate races removed: ${duplicateRacesRemoved}`)
        console.log(`  - Duplicate transactions removed: ${duplicateTransactionsRemoved}`)
        console.log(`  - Stats recalculated: true`)
        console.log(`  - Standings fixed: ${standingsFixed}`)

        return {
          duplicateRacesRemoved,
          duplicateTransactionsRemoved,
          statsRecalculated: true,
          standingsFixed,
          oldRep,
          newRep,
          oldBalance,
          newBalance
        }
      },
      
      recalculateReputation: () => {
        const { player, careerState } = get()
        if (!player) {
          return { oldRep: 0, newRep: 0 }
        }
        
        const oldRep = player.reputation
        const currentYear = careerState?.currentYear || new Date().getFullYear()
        
        // Get starting reputation from background/scenario
        const scenario = player.scenario ? getScenarioById(player.scenario) : null
        let calculatedRep = scenario?.startingReputation || 30
        
        // ============================================
        // UNIFIED REPUTATION CONSTANTS
        // These values match the per-race system exactly
        // ============================================
        const REPUTATION_TIER_MULTIPLIERS: Record<string, number> = {
          'entry': 0.5,
          'amateur': 0.5,
          'semi-pro': 0.75,
          'professional': 1.0,
          'pro': 1.0,
          'elite': 1.25,
          'pinnacle': 1.5
        }
        
        // Per-season reputation gain caps by tier (race results only)
        const SEASON_REP_CAPS: Record<string, number> = {
          'entry': 8,
          'amateur': 8,
          'semi-pro': 12,
          'professional': 15,
          'pro': 15,
          'elite': 20,
          'pinnacle': 25
        }
        
        // Default grid sizes by series tier (for field-relative calculations)
        const defaultGridSizes: Record<string, number> = {
          'entry': 16,
          'amateur': 20,
          'semi-pro': 24,
          'pro': 28,
          'professional': 28,
          'elite': 32,
          'pinnacle': 20
        }
        
        // Championship bonus scaled by tier
        const CHAMPIONSHIP_BONUS_BY_TIER: Record<string, number> = {
          'entry': 3,
          'amateur': 3,
          'semi-pro': 5,
          'professional': 8,
          'pro': 8,
          'elite': 12,
          'pinnacle': 15
        }
        
        // Track breakdown for logging
        let totalRaceRep = 0
        let champRep = 0
        let decayPenalty = 0
        
        // ============================================
        // GROUP RACES BY SEASON for per-season caps and recency weighting
        // ============================================
        // We estimate season from race date: extract year from the ISO date string
        const racesBySeason: Record<number, { races: typeof player.raceHistory; seriesTier: string }> = {}
        
        for (const race of player.raceHistory) {
          const raceYear = race.date ? new Date(race.date).getFullYear() : currentYear
          if (!racesBySeason[raceYear]) {
            const seriesData = useRivalStore.getState().getSeriesById(race.seriesId || '')
            racesBySeason[raceYear] = { races: [], seriesTier: seriesData?.tier || 'amateur' }
          }
          racesBySeason[raceYear].races.push(race)
        }
        
        // Track win counts per tier for diminishing returns
        const winsByTier: Record<string, number> = {}
        
        // Process each season's races with caps and recency weighting
        for (const [yearStr, seasonData] of Object.entries(racesBySeason)) {
          const year = parseInt(yearStr)
          const seasonsAgo = currentYear - year
          
          // Recency weighting: older results contribute less
          let recencyMultiplier = 1.0
          if (seasonsAgo >= 5) {
            recencyMultiplier = 0.25  // 5+ seasons ago = 25%
          } else if (seasonsAgo >= 3) {
            recencyMultiplier = 0.5   // 3-4 seasons ago = 50%
          } else if (seasonsAgo >= 2) {
            recencyMultiplier = 0.75  // 2 seasons ago = 75%
          }
          // Current + last season = 100%
          
          let seasonRep = 0
          const seriesTier = seasonData.seriesTier
          const tierMultiplier = REPUTATION_TIER_MULTIPLIERS[seriesTier] || 1.0
          const seasonCap = SEASON_REP_CAPS[seriesTier] || 15
          
          for (const race of seasonData.races) {
            const seriesData = useRivalStore.getState().getSeriesById(race.seriesId || '')
            const raceTier = seriesData?.tier || seriesTier
            const raceTierMult = REPUTATION_TIER_MULTIPLIERS[raceTier] || tierMultiplier
            const gridSize = seriesData?.gridSize || defaultGridSizes[raceTier] || 24
            const positionPercent = (race.racePosition / gridSize) * 100
            
            let raceRep = 0
            
            if (race.dnf) {
              raceRep = -1
            } else if (race.racePosition === 1) {
              // Diminishing returns: after 5 wins at the same tier, 50% reduced
              const tierWinCount = winsByTier[raceTier] || 0
              const diminishingFactor = tierWinCount >= 5 ? 0.5 : 1.0
              winsByTier[raceTier] = tierWinCount + 1
              raceRep = 2 * raceTierMult * diminishingFactor
            } else if (race.racePosition <= 3) {
              raceRep = 1.5 * raceTierMult
            } else if (positionPercent <= 20) {
              raceRep = 1 * raceTierMult
            } else if (positionPercent <= 40) {
              raceRep = 0.5 * raceTierMult
            } else if (positionPercent >= 75) {
              const penaltyMultiplier = Math.min(1.5, (positionPercent - 75) / 25 + 0.5)
              raceRep = -0.5 * penaltyMultiplier
            }
            
            // Bonus for fastest lap or pole
            if (race.fastestLap) raceRep += 0.5 * raceTierMult
            if (race.qualifyingPosition === 1) raceRep += 0.5 * raceTierMult
            
            seasonRep += raceRep
          }
          
          // Apply per-season cap (only caps positive gains, penalties pass through)
          const cappedSeasonRep = seasonRep > 0 ? Math.min(seasonRep, seasonCap) : seasonRep
          
          // Apply recency weighting
          totalRaceRep += cappedSeasonRep * recencyMultiplier
        }
        
        calculatedRep += totalRaceRep
        
        // ============================================
        // CHAMPIONSHIP BONUSES - Scaled by tier
        // ============================================
        // We use seriesChampionships to identify which series were won
        // and look up the tier for each championship
        const seriesChampionships = player.seriesChampionships || []
        for (const seriesId of seriesChampionships) {
          const seriesData = useRivalStore.getState().getSeriesById(seriesId)
          const champTier = seriesData?.tier || 'amateur'
          champRep += CHAMPIONSHIP_BONUS_BY_TIER[champTier] || 5
        }
        // If championships count > seriesChampionships length (legacy data), add remainder at default
        const unaccountedChamps = Math.max(0, player.championships - seriesChampionships.length)
        champRep += unaccountedChamps * 5
        calculatedRep += champRep
        
        // ============================================
        // INACTIVITY DECAY
        // -1 rep per season with no races
        // ============================================
        // Count seasons between first race and current year with no races
        if (player.raceHistory.length > 0) {
          const firstRaceYear = Math.min(...player.raceHistory.map(r => 
            r.date ? new Date(r.date).getFullYear() : currentYear
          ))
          for (let y = firstRaceYear; y < currentYear; y++) {
            if (!racesBySeason[y] || racesBySeason[y].races.length === 0) {
              decayPenalty += 1
            }
          }
          calculatedRep -= decayPenalty
        }
        
        // === MEDIA REPUTATION ===
        // Include current season media reputation gain (from interviews, sponsor events, etc)
        const mediaRep = careerState?.seasonMediaRepGain || 0
        calculatedRep += mediaRep
        
        // === INTERVIEW HISTORY ===
        // Calculate reputation from past interviews (for completed seasons)
        let interviewRep = 0
        const interviewHistory = careerState?.interviewHistory || []
        for (const interview of interviewHistory) {
          // Only count interviews from previous seasons (current season is in seasonMediaRepGain)
          if (interview.year < currentYear) {
            if (interview.outcome === 'success') {
              interviewRep += 0.5
            } else if (interview.outcome === 'disaster') {
              interviewRep -= 1
            }
            // neutral = 0
          }
        }
        calculatedRep += interviewRep
        
        // Round to 1 decimal, then clamp to valid range
        const newRep = Math.round(Math.min(100, Math.max(0, calculatedRep)) * 10) / 10
        
        console.log(`[CareerStore] Recalculating reputation: ${oldRep} -> ${newRep}`)
        console.log(`  - Base from scenario: ${scenario?.startingReputation || 30}`)
        console.log(`  - Race results (with recency, caps, diminishing): ${totalRaceRep >= 0 ? '+' : ''}${totalRaceRep.toFixed(1)}`)
        console.log(`  - Championships (tier-scaled): +${champRep.toFixed(1)}`)
        console.log(`  - Inactivity decay: -${decayPenalty.toFixed(1)}`)
        console.log(`  - Media (this season): ${mediaRep >= 0 ? '+' : ''}${mediaRep.toFixed(1)}`)
        console.log(`  - Interviews (past): ${interviewRep >= 0 ? '+' : ''}${interviewRep.toFixed(1)}`)
        console.log(`  - Races processed: ${player.raceHistory.length}`)
        console.log(`  - Seasons processed: ${Object.keys(racesBySeason).length}`)
        console.log(`  - Wins by tier: ${JSON.stringify(winsByTier)}`)
        
        // Update player reputation
        set({
          player: {
            ...player,
            reputation: newRep
          }
        })
        
        // Also update team reputation if team is owned
        setTimeout(() => get().recalculateTeamReputation(), 50)
        
        // Update GOAT progress after reputation change
        setTimeout(() => get().updateGOATProgress(), 100)
        
        return { oldRep, newRep }
      },

      // ============================================
      // TEAM REPUTATION RECALCULATION
      // Updates ownedTeam.reputation based on performance factors
      // ============================================
      recalculateTeamReputation: () => {
        const { player, careerState } = get()
        if (!careerState?.ownedTeam) {
          return { oldRep: 0, newRep: 0 }
        }
        
        const team = careerState.ownedTeam
        const oldRep = team.reputation
        
        // Start from the player reputation as the primary driver of team rep
        // Team reputation tracks player rep but is influenced by team-specific factors
        const playerRep = player?.reputation || 30
        
        // Base: weighted blend of player rep and current team rep
        // Team rep follows player rep but changes more gradually
        let calculatedRep = playerRep * 0.5
        
        // === RACE PERFORMANCE (current season) ===
        const currentYear = careerState.currentYear
        const currentSeasonRaces = player?.raceHistory?.filter(r => {
          const raceYear = r.date ? new Date(r.date).getFullYear() : currentYear
          return raceYear === currentYear
        }) || []
        
        if (currentSeasonRaces.length > 0) {
          const wins = currentSeasonRaces.filter(r => r.racePosition === 1 && !r.dnf).length
          const podiums = currentSeasonRaces.filter(r => r.racePosition <= 3 && !r.dnf).length
          const winRate = wins / currentSeasonRaces.length
          const podiumRate = podiums / currentSeasonRaces.length
          
          // High win/podium rates boost team rep
          calculatedRep += winRate * 15   // Up to +15 for 100% win rate
          calculatedRep += podiumRate * 10 // Up to +10 for 100% podium rate
        }
        
        // === CHAMPIONSHIPS ===
        const champCount = player?.championships || 0
        calculatedRep += Math.min(champCount * 3, 15)  // Up to +15 from championships
        
        // === SPONSOR SATISFACTION ===
        const activeSponsors = player?.finances?.sponsorDeals?.filter(d => d.active) || []
        if (activeSponsors.length > 0) {
          const avgSatisfaction = activeSponsors.reduce((sum, s) => sum + (s.satisfaction || 50), 0) / activeSponsors.length
          // Satisfaction above 60 = bonus, below 40 = penalty
          calculatedRep += (avgSatisfaction - 50) / 10  // -5 to +5
        }
        
        // === FACILITY DEVELOPMENT LEVEL ===
        if (team.facilities) {
          const facilityLevels = Object.values(team.facilities).map((f: any) => f?.level || 1)
          if (facilityLevels.length > 0) {
            const avgLevel = facilityLevels.reduce((a: number, b: number) => a + b, 0) / facilityLevels.length
            calculatedRep += (avgLevel - 1) * 2  // +2 per average facility level above 1
          }
        }
        
        // === TEAM TIER BASELINE ===
        // Being in a higher tier naturally means more reputation
        const tierBaselines: Record<string, number> = {
          'entry': 5,
          'amateur': 10,
          'semi-pro': 15,
          'professional': 20,
          'pro': 20,
          'elite': 25,
          'pinnacle': 30
        }
        calculatedRep += tierBaselines[team.tier] || 10
        
        // Clamp to 0-100
        const newRep = Math.round(Math.min(100, Math.max(0, calculatedRep)) * 10) / 10
        
        console.log(`[CareerStore] Recalculating team reputation: ${oldRep} -> ${newRep}`)
        console.log(`  - Player rep contribution: ${(playerRep * 0.5).toFixed(1)}`)
        console.log(`  - Tier baseline: ${tierBaselines[team.tier] || 10}`)
        console.log(`  - Season races: ${currentSeasonRaces.length}`)
        
        // Update the owned team
        set({
          careerState: {
            ...careerState,
            ownedTeam: {
              ...team,
              reputation: newRep
            }
          }
        })
        
        return { oldRep, newRep }
      },

      recalculateMarketability: () => {
        const { player } = get()
        if (!player) {
          return { oldMarketability: 0, newMarketability: 0 }
        }
        
        const oldMarketability = player.stats.marketability
        
        // Get base marketability from scenario (now much lower values)
        const scenario = player.scenario ? getScenarioById(player.scenario) : null
        let calculatedMarketability = scenario?.baseStats?.marketability || 15
        
        // Add backstory trait bonuses (reduced)
        if (player.background?.backstoryTraits) {
          for (const traitId of player.background.backstoryTraits) {
            // Social Media Star trait gives +15 marketability (was +25)
            if (traitId === 'social_media_star') {
              calculatedMarketability += 15
            }
            // Famous family gives small boost (was +10)
            if (traitId === 'famous_family' || traitId === 'racing_dynasty') {
              calculatedMarketability += 5
            }
          }
        }
        
        // SLOW progression based on actual career achievements (aligned with reputation)
        // Wins give +0.5 marketability each (was +1, max 10 instead of 15)
        const winBonus = Math.min(player.totalWins * 0.5, 10)
        calculatedMarketability += winBonus
        
        // Podiums give +0.25 marketability each (was +0.5, max 5 instead of 10)
        const podiumBonus = Math.min(Math.floor(player.totalPodiums * 0.25), 5)
        calculatedMarketability += podiumBonus
        
        // Championships give +3 each (was +5)
        calculatedMarketability += player.championships * 3
        
        // Social media followers give smaller bonus (from mediaStarPower if available)
        if (player.mediaStarPower) {
          const followers = player.mediaStarPower.followers || 0
          // Reduced bonuses from followers
          if (followers >= 1000000) calculatedMarketability += 10      // Was +15
          else if (followers >= 500000) calculatedMarketability += 6   // Was +10
          else if (followers >= 100000) calculatedMarketability += 3   // Was +5
          else if (followers >= 50000) calculatedMarketability += 1    // Was +2
          
          // Viral moments boost marketability (reduced)
          const viralMoments = player.mediaStarPower.viralMoments || 0
          calculatedMarketability += Math.min(viralMoments * 1, 5) // Was *2 max 10, now *1 max 5
        }
        
        // Clamp to valid range
        const newMarketability = Math.min(100, Math.max(0, Math.round(calculatedMarketability)))
        
        console.log(`[CareerStore] Recalculating marketability: ${oldMarketability} -> ${newMarketability}`)
        console.log(`  - Base from scenario: ${scenario?.baseStats?.marketability || 15}`)
        console.log(`  - Win bonus: +${winBonus}`)
        console.log(`  - Podium bonus: +${podiumBonus}`)
        console.log(`  - Championship bonus: +${player.championships * 3}`)
        
        // Update player marketability
        set({
          player: {
            ...player,
            stats: {
              ...player.stats,
              marketability: newMarketability
            }
          }
        })
        
        return { oldMarketability, newMarketability }
      },

      /**
       * Retroactively recalculate prize money for all races using correct series data
       * This fixes the bug where BASE_PRIZE_MONEY was used instead of series.prizeMoney
       * Also updates the corresponding transactions to match
       */
      recalculatePrizeMoney: () => {
        const { player } = get()
        if (!player || !player.raceHistory || player.raceHistory.length === 0) {
          return { racesFixed: 0, oldTotal: 0, newTotal: 0, difference: 0 }
        }
        
        const rivalStore = useRivalStore.getState()
        let racesFixed = 0
        let transactionsFixed = 0
        let oldTotal = 0
        let newTotal = 0
        
        // Build a map of race round/track to correct prize money
        const prizeMoneyCorrections: Map<string, { oldAmount: number; newAmount: number; trackName: string }> = new Map()
        
        // Recalculate prize money for each race
        const updatedRaceHistory = player.raceHistory.map(race => {
          oldTotal += race.prizeMoney
          
          // Skip DNF races (no prize money)
          if (race.dnf) {
            newTotal += 0
            return { ...race, prizeMoney: 0 }
          }
          
          // Get series data for this race
          const series = rivalStore.getSeriesById(race.seriesId)
          
          let correctPrizeMoney = race.prizeMoney // Default to existing if can't fix
          
          if (series?.prizeMoney) {
            const position = race.racePosition
            if (position === 1) {
              correctPrizeMoney = series.prizeMoney.win
            } else if (position <= 3) {
              correctPrizeMoney = series.prizeMoney.podium
            } else if (position <= 10) {
              correctPrizeMoney = series.prizeMoney.points
            } else {
              correctPrizeMoney = 0 // Outside points
            }
            
            if (correctPrizeMoney !== race.prizeMoney) {
              racesFixed++
              // Store correction for transaction matching
              const key = `Round ${race.round} at ${race.trackName}`
              prizeMoneyCorrections.set(key, {
                oldAmount: race.prizeMoney,
                newAmount: correctPrizeMoney,
                trackName: race.trackName
              })
              console.log(`[CareerStore] Fixed prize money for ${race.trackName}: $${race.prizeMoney} -> $${correctPrizeMoney}`)
            }
          }
          
          newTotal += correctPrizeMoney
          return { ...race, prizeMoney: correctPrizeMoney }
        })
        
        // Also fix the transactions to match
        const updatedTransactions = player.finances.transactions.map(tx => {
          // Look for prize money transactions
          if (tx.category === 'prize' && tx.type === 'income') {
            // Try to match by description pattern "Prize money - Round X at TrackName"
            const match = tx.description.match(/Prize money - (Round \d+ at .+)/)
            if (match) {
              const key = match[1]
              const correction = prizeMoneyCorrections.get(key)
              if (correction && tx.amount === correction.oldAmount) {
                transactionsFixed++
                console.log(`[CareerStore] Fixed transaction: "${tx.description}" $${tx.amount} -> $${correction.newAmount}`)
                return { ...tx, amount: correction.newAmount }
              }
            }
            // Also try matching just by track name in description
            for (const [key, correction] of prizeMoneyCorrections.entries()) {
              if (tx.description.includes(correction.trackName) && tx.amount === correction.oldAmount) {
                transactionsFixed++
                console.log(`[CareerStore] Fixed transaction: "${tx.description}" $${tx.amount} -> $${correction.newAmount}`)
                prizeMoneyCorrections.delete(key) // Don't match same correction twice
                return { ...tx, amount: correction.newAmount }
              }
            }
          }
          return tx
        })
        
        const difference = newTotal - oldTotal
        
        // Update race history, transactions, and balance
        const newBalance = player.finances.bankBalance + difference
        
        console.log(`[CareerStore] Prize money recalculation complete:`)
        console.log(`  - Races fixed: ${racesFixed}`)
        console.log(`  - Transactions fixed: ${transactionsFixed}`)
        console.log(`  - Old total: $${oldTotal.toLocaleString()}`)
        console.log(`  - New total: $${newTotal.toLocaleString()}`)
        console.log(`  - Difference: $${difference.toLocaleString()}`)
        console.log(`  - Old balance: $${player.finances.bankBalance.toLocaleString()}`)
        console.log(`  - New balance: $${newBalance.toLocaleString()}`)
        
        set({
          player: {
            ...player,
            raceHistory: updatedRaceHistory,
            finances: {
              ...player.finances,
              transactions: updatedTransactions,
              bankBalance: newBalance
            }
          }
        })
        
        return { racesFixed, oldTotal, newTotal, difference }
      },

      /**
       * Recalculate economy values (seat costs, salaries) based on tier
       * This fixes existing careers that have outdated economy values
       * Also updates seat fee transactions to match
       */
      recalculateEconomy: () => {
        const { player, careerState } = get()
        if (!player) {
          return { teamsUpdated: 0, oldSeatCost: 0, newSeatCost: 0, oldSalary: 0, newSalary: 0, seatFeeDifference: 0, message: 'No active career found' }
        }
        
        const rivalStore = useRivalStore.getState()
        let teamsUpdated = 0
        let oldSeatCost = 0
        let newSeatCost = 0
        let oldSalary = 0
        let newSalary = 0
        let seatFeeDifference = 0
        let transactionsFixed = 0
        
        // Get current team (defensive check for corrupted save data)
        const teamsArray = Array.isArray(rivalStore.teams) ? rivalStore.teams : []
        const currentTeam = player.currentTeamId 
          ? teamsArray.find(t => t.id === player.currentTeamId)
          : null
        
        if (currentTeam) {
          oldSeatCost = currentTeam.seatCost || 0
          oldSalary = player.finances.salary || 0
          
          // Get tier-based values WITH VARIATION based on prestige
          const tierSeatCost = calculateSeatCostWithVariationLocal(currentTeam.tier, currentTeam.prestige, hashStringLocal(currentTeam.id))
          const tierSalaryRange = calculateSalaryRangeWithVariationLocal(currentTeam.tier, currentTeam.prestige)
          
          // Calculate new salary based on player reputation within range
          const salaryFactor = Math.min(1, (player.reputation || 50) / 100)
          const calculatedSalary = Math.round(tierSalaryRange.min + (tierSalaryRange.max - tierSalaryRange.min) * salaryFactor)
          
          // For pay-driver tiers, salary should be 0
          const isPayDriver = !['elite', 'pinnacle'].includes(currentTeam.tier)
          newSalary = isPayDriver ? 0 : calculatedSalary
          newSeatCost = tierSeatCost
          
          console.log(`[CareerStore] Calculating seat cost for ${currentTeam.name}: tier=${currentTeam.tier}, prestige=${currentTeam.prestige}, cost=$${tierSeatCost.toLocaleString()}`)
          
          teamsUpdated = 1
          
          // Find and update seat fee transactions for current year
          const currentYear = careerState?.currentYear || new Date().getFullYear()
          let updatedTransactions = [...player.finances.transactions]
          let totalSeatFeeAdjustment = 0
          
          updatedTransactions = updatedTransactions.map(tx => {
            // Look for seat fee transactions (they're expenses with 'seat' in description)
            if (tx.type === 'expense' && tx.year === currentYear && 
                (tx.category === 'seat_fee' || tx.description.toLowerCase().includes('seat'))) {
              const oldAmount = Math.abs(tx.amount) // Seat fees are stored as negative
              
              // Only fix if it looks like the old incorrect amount
              if (oldAmount < tierSeatCost && oldAmount > 0) {
                const difference = tierSeatCost - oldAmount
                totalSeatFeeAdjustment += difference
                transactionsFixed++
                console.log(`[CareerStore] Fixed seat fee transaction: $${oldAmount.toLocaleString()} -> $${tierSeatCost.toLocaleString()}`)
                return { ...tx, amount: -tierSeatCost } // Negative for expense
              }
            }
            return tx
          })
          
          seatFeeDifference = totalSeatFeeAdjustment
          
          // Update balance (charge the difference for seat fees)
          const newBalance = player.finances.bankBalance - totalSeatFeeAdjustment
          
          console.log(`[CareerStore] Economy recalculated for ${currentTeam.name}:`)
          console.log(`  - Tier: ${currentTeam.tier}`)
          console.log(`  - Seat Cost: $${oldSeatCost.toLocaleString()} -> $${newSeatCost.toLocaleString()}`)
          console.log(`  - Salary: $${oldSalary.toLocaleString()} -> $${newSalary.toLocaleString()}/season`)
          console.log(`  - Pay Driver: ${isPayDriver}`)
          console.log(`  - Seat Fee Transactions Fixed: ${transactionsFixed}`)
          console.log(`  - Additional Seat Fee Charged: $${totalSeatFeeAdjustment.toLocaleString()}`)
          console.log(`  - New Balance: $${newBalance.toLocaleString()}`)
          
          // Update player
          set({
            player: {
              ...player,
              contract: player.contract ? {
                ...player.contract
              } as Contract : undefined,
              finances: {
                ...player.finances,
                transactions: updatedTransactions,
                bankBalance: newBalance,
                salary: newSalary / 14 // Per-race salary (assuming ~14 races)
              }
            }
          })
        }
        
        const message = teamsUpdated > 0 
          ? `Updated economy for your team. Seat cost: $${newSeatCost.toLocaleString()}${seatFeeDifference > 0 ? `, Additional charge: $${seatFeeDifference.toLocaleString()}` : ''}`
          : 'No team to update'
        
        return { teamsUpdated, oldSeatCost, newSeatCost, oldSalary, newSalary, seatFeeDifference, message }
      },

      /**
       * Upgrade existing contracts and sponsors to include new media system features
       * This ALWAYS resets/overwrites media data (not just when missing)
       */
      upgradeContractsAndSponsors: () => {
        const { player, careerState } = get()
        if (!player) {
          return { contractsUpgraded: 0, sponsorsKept: 0, sponsorsRemoved: 0, removedNames: [], totalDeducted: 0, message: 'No active career found' }
        }

        let contractsUpgraded = 0
        let sponsorsKept = 0
        let sponsorsRemoved = 0
        let totalDeducted = 0
        const removedNames: string[] = []

        // Get player's current stats for eligibility check
        const playerReputation = player.reputation
        const playerMarketability = player.stats.marketability
        
        // Get current time for payment calculations
        const currentYear = careerState?.currentYear || new Date().getFullYear()
        const currentWeek = careerState?.currentWeek || 1

        // ============================================
        // 1. Upgrade Team Contract with MediaDuties (ALWAYS reset)
        // ============================================
        let updatedContract = player.contract
        if (updatedContract) {
          // Determine duties based on team tier
          const contractTeamId = updatedContract.teamId
          const teamData = useRivalStore.getState().teams.find(t => t.id === contractTeamId)
          const teamTier = teamData?.tier || 'amateur'
          
          // Base requirements based on tier
          let pressConferencesRequired = 4  // per season
          let socialMediaPosts = 10
          let teamEventsRequired = 2
          
          if (teamTier === 'elite' || teamTier === 'pinnacle') {
            pressConferencesRequired = 8
            socialMediaPosts = 20
            teamEventsRequired = 4
          } else if (teamTier === 'professional' || teamTier === 'pro') {
            pressConferencesRequired = 6
            socialMediaPosts = 15
            teamEventsRequired = 3
          }
          
          updatedContract = {
            ...updatedContract,
            mediaDuties: {
              pressConferencesRequired,
              socialMediaPosts,
              teamEventsRequired,
              completed: {
                press: 0,
                social: 0,
                events: 0
              },
              penalty: 'satisfaction_drop' as const,
              penaltyAmount: 10
            },
            satisfactionHistory: updatedContract.satisfactionHistory || [] // Ensure history is initialized
          }
          contractsUpgraded = 1
          console.log('[CareerStore] Upgraded team contract with media duties:', updatedContract.mediaDuties)
        }

        // ============================================
        // 2. Check Sponsor Eligibility & Remove Unqualified
        // ============================================
        const keptSponsorDeals: SponsorDeal[] = []
        
        for (const deal of player.finances.sponsorDeals) {
          // Look up original sponsor in the SPONSORS database
          const originalSponsor = SPONSORS.find(s => s.id === deal.sponsorId)
          
          // Get requirements - prefer from deal, fallback to original sponsor
          const minReputation = deal.minReputation
          const minMarketability = deal.minMarketability ?? originalSponsor?.requirements?.minMarketability ?? 0
          
          // Check if player still qualifies
          const meetsReputation = playerReputation >= minReputation
          const meetsMarketability = playerMarketability >= minMarketability
          
          if (!meetsReputation || !meetsMarketability) {
            // Player no longer qualifies - remove this sponsor
            // Calculate payments to deduct (as if sponsorship never happened)
            const weeksActive = Math.max(0, ((currentYear - deal.startYear) * 52) + currentWeek)
            const monthsActive = Math.ceil(weeksActive / 4)
            const totalMonthlyPaid = monthsActive * deal.monthlyPayment
            const totalBonusesPaid = (deal.seasonWins * deal.bonusPerWin) + (deal.seasonPodiums * deal.bonusPerPodium)
            const sponsorPaymentsToDeduct = totalMonthlyPaid + totalBonusesPaid
            
            totalDeducted += sponsorPaymentsToDeduct
            sponsorsRemoved++
            removedNames.push(deal.sponsorName)
            console.log(`[CareerStore] REMOVED sponsor "${deal.sponsorName}" - Player doesn't qualify (Rep: ${playerReputation}/${minReputation}, Market: ${playerMarketability}/${minMarketability}). Deducting $${sponsorPaymentsToDeduct.toLocaleString()} in payments.`)
            continue // Don't add to kept list
          }
          
          // Player still qualifies - upgrade with media features
          sponsorsKept++
          
          // Determine sponsor type based on name/category patterns
          const name = deal.sponsorName.toLowerCase()
          let sponsorType: 'performance' | 'lifestyle' | 'traditional' | 'fan_focused' = 'traditional'
          
          // Performance sponsors
          if (name.includes('tire') || name.includes('brake') || name.includes('oil') || 
              name.includes('fuel') || name.includes('parts') || name.includes('auto') ||
              name.includes('racing') || name.includes('motor') || name.includes('pioneer')) {
            sponsorType = 'performance'
          }
          // Lifestyle sponsors
          else if (name.includes('energy') || name.includes('drink') || name.includes('fashion') ||
                   name.includes('apparel') || name.includes('tech') || name.includes('gaming') ||
                   name.includes('style') || name.includes('wear')) {
            sponsorType = 'lifestyle'
          }
          // Fan-focused sponsors  
          else if (name.includes('fan') || name.includes('stream') || name.includes('media') ||
                   name.includes('social') || name.includes('merch')) {
            sponsorType = 'fan_focused'
          }
          // Traditional sponsors (banks, regional, insurance, etc.)
          else if (name.includes('bank') || name.includes('regional') || name.includes('savings') ||
                   name.includes('insurance') || name.includes('local')) {
            sponsorType = 'traditional'
          }

          // Get weights based on type
          const weights = {
            'performance': { reputationWeight: 0.8, mediaWeight: 0.2 },
            'lifestyle': { reputationWeight: 0.3, mediaWeight: 0.7 },
            'traditional': { reputationWeight: 0.6, mediaWeight: 0.4 },
            'fan_focused': { reputationWeight: 0.4, mediaWeight: 0.6 }
          }[sponsorType]

          // Generate media requirements based on sponsor type and payment
          let mediaRequirements: typeof deal.mediaRequirements = undefined
          
          // Only lifestyle, traditional, and fan-focused sponsors have media requirements
          // Performance sponsors don't care much about media
          if (sponsorType !== 'performance') {
            const tier = deal.monthlyPayment >= 15000 ? 'elite' 
                       : deal.monthlyPayment >= 8000 ? 'high' 
                       : deal.monthlyPayment >= 3000 ? 'mid' 
                       : 'entry'
            
            const baseShoutouts = tier === 'elite' ? 4 : tier === 'high' ? 3 : tier === 'mid' ? 2 : 1
            const shoutoutsRequired = sponsorType === 'lifestyle' ? baseShoutouts + 1 : baseShoutouts
            
            const minFollowers = sponsorType === 'lifestyle' ? (
              tier === 'elite' ? 250000 :
              tier === 'high' ? 100000 :
              tier === 'mid' ? 50000 :
              25000
            ) : undefined
            
            const noControversy = tier === 'elite' || (tier === 'high' && Math.random() > 0.5)
            const arrangedInterviews = tier === 'elite' ? 2 : tier === 'high' ? 1 : 0
            const bonusForViral = (sponsorType === 'lifestyle' || sponsorType === 'fan_focused')
              ? Math.floor(deal.monthlyPayment * 0.5)
              : undefined
            
            mediaRequirements = {
              shoutoutsRequired,
              shoutoutsCompleted: 0,
              minFollowers,
              noControversy,
              arrangedInterviews: arrangedInterviews > 0 ? arrangedInterviews : undefined,
              arrangedInterviewsCompleted: arrangedInterviews > 0 ? 0 : undefined,
              bonusForViral
            }
          }

          console.log(`[CareerStore] KEPT sponsor "${deal.sponsorName}" with type: ${sponsorType}`)
          
          keptSponsorDeals.push({
            ...deal,
            minMarketability: minMarketability, // Ensure this is set
            sponsorType,
            reputationWeight: weights.reputationWeight,
            mediaWeight: weights.mediaWeight,
            mediaRequirements,
            // Add sponsor personality (determines reaction to media posts)
            personality: getSponsorPersonality(sponsorType),
            // Reset satisfaction to default but PRESERVE race stats
            satisfaction: DEFAULT_SATISFACTION,
            // Preserve race stats - don't reset these!
            seasonWins: deal.seasonWins ?? 0,
            seasonPodiums: deal.seasonPodiums ?? 0,
            seasonRacesStarted: deal.seasonRacesStarted ?? 0,
            seasonDNFs: deal.seasonDNFs ?? 0,
            warningIssued: false,
            finalWarningIssued: false,
            satisfactionHistory: [] // Clear history (new feature starts fresh)
          })
        }

        // ============================================
        // 3. Apply Updates (including payment deduction)
        // ============================================
        const updatedTransactions = [...player.finances.transactions]
        
        // Add deduction transaction if any sponsors were removed
        if (totalDeducted > 0) {
          updatedTransactions.push({
            id: `sponsor_removal_deduction_${Date.now()}`,
            type: 'expense' as const,
            category: 'other',
            description: `Sponsorship payments reversed (${removedNames.join(', ')})`,
            amount: -totalDeducted,
            week: currentWeek,
            year: currentYear,
            date: new Date().toISOString()
          })
        }
        
        set({
          player: {
            ...player,
            contract: updatedContract || player.contract,
            finances: {
              ...player.finances,
              bankBalance: player.finances.bankBalance - totalDeducted,
              sponsorDeals: keptSponsorDeals,
              transactions: updatedTransactions
            }
          }
        })

        // Also sync media star power if not present
        setTimeout(() => get().syncMediaStarPower(), 100)

        // Build message
        let message = ''
        if (sponsorsRemoved > 0) {
          message = `Removed ${sponsorsRemoved} sponsor(s) you no longer qualify for: ${removedNames.join(', ')}. `
          if (totalDeducted > 0) {
            message += `Deducted $${totalDeducted.toLocaleString()} in payments. `
          }
        }
        if (sponsorsKept > 0) {
          message += `Reset ${sponsorsKept} sponsor(s) with new media features.`
        }
        if (contractsUpgraded > 0) {
          message += ` Updated team contract media duties.`
        }
        if (!message) {
          message = 'No sponsors to update.'
        }

        console.log(`[CareerStore] ${message}`)
        
        return { contractsUpgraded, sponsorsKept, sponsorsRemoved, removedNames, totalDeducted, message: message.trim() }
      },

      /**
       * Recalculate contract points targets based on series-specific point system
       * Call this after updating series data to fix existing contracts
       */
      recalculateContractTargets: () => {
        const { player } = get()
        if (!player?.contract?.targets) {
          return { oldPointsTarget: null, newPointsTarget: null, scaleFactor: 1, message: 'No contract targets found' }
        }

        const contract = player.contract
        const rivalStore = useRivalStore.getState()
        const series = rivalStore.getSeriesById(contract.seriesId || contract.primarySeriesId)
        
        if (!series?.championshipId) {
          return { oldPointsTarget: null, newPointsTarget: null, scaleFactor: 1, message: 'Series not found or no championship linked' }
        }

        // Get the championship and its point system
        const championship = getChampionshipById(series.championshipId)
        if (!championship?.pointsSystemId) {
          return { oldPointsTarget: null, newPointsTarget: null, scaleFactor: 1, message: 'Championship not found or no point system set' }
        }

        const pointsSystem = getPointsSystem(championship.pointsSystemId)
        const maxPointsPerRace = pointsSystem?.points?.[1] || 25 // Position 1 points
        
        // Calculate scale factor (F1 baseline is 25 points for a win)
        const scaleFactor = maxPointsPerRace / 25

        // Find the points_minimum target and update it
        let oldPointsTarget: number | null = null
        let newPointsTarget: number | null = null

        const updatedTargets = (contract.targets || []).map(target => {
          if (target.type === 'points_minimum') {
            oldPointsTarget = target.targetValue
            
            // If the target looks like it was set with F1 points (divisible by 5, under 250)
            // then scale it. Otherwise, assume it's already scaled.
            const looksLikeF1Points = target.targetValue <= 250 && target.targetValue % 5 === 0
            
            if (looksLikeF1Points && scaleFactor !== 1) {
              // Scale the target
              newPointsTarget = Math.round(target.targetValue * scaleFactor)
              
              // Also scale current progress proportionally (maintain completion %)
              const progressRatio = target.currentProgress / target.targetValue
              const newProgress = Math.round(newPointsTarget * progressRatio)
              
              console.log(`[CareerStore] Scaling points target: ${oldPointsTarget} → ${newPointsTarget} (factor: ${scaleFactor.toFixed(2)})`)
              console.log(`[CareerStore] Progress: ${target.currentProgress} → ${newProgress}`)
              
              return {
                ...target,
                targetValue: newPointsTarget,
                currentProgress: newProgress,
                description: `Score at least ${newPointsTarget} championship points`,
                // Recalculate met/exceeded status
                met: newProgress >= newPointsTarget,
                exceeded: newProgress >= newPointsTarget * 1.2
              }
            }
          }
          return target
        })

        // Update the contract
        set({
          player: {
            ...player,
            contract: {
              ...contract,
              targets: updatedTargets
            }
          }
        })

        const message = newPointsTarget && oldPointsTarget && newPointsTarget !== oldPointsTarget
          ? `Points target updated: ${oldPointsTarget} → ${newPointsTarget} (${championship.name} uses ${maxPointsPerRace} pts/win)`
          : 'Contract targets are already correctly scaled'

        return { oldPointsTarget, newPointsTarget, scaleFactor, message }
      },

      checkSeasonComplete: () => {
        const { player, careerState } = get()
        if (!player?.currentSeriesId || !careerState) return false
        
        const currentSeries = useRivalStore.getState().getSeriesById(player.currentSeriesId)
        if (!currentSeries?.calendar) return false
        
        const totalRounds = currentSeries.calendar.length
        const completedRounds = player.raceHistory.filter(
          r => r.seriesId === player.currentSeriesId
        ).length
        
        return completedRounds >= totalRounds
      },

      endSeason: () => {
        const { player, careerState } = get()
        if (!player?.currentSeriesId || !careerState) return null
        
        const rivalStore = useRivalStore.getState()
        const currentSeries = rivalStore.getSeriesById(player.currentSeriesId)
        const standings = rivalStore.getStandings(player.currentSeriesId)
        
        if (!currentSeries) return null
        
        // Find player's standing
        const playerFullName = `${player.firstName} ${player.lastName}`
        const playerStanding = standings.find(s => s.isPlayer || s.driverName === playerFullName)
        
        // Calculate season stats from race history
        const seasonRaces = player.raceHistory.filter(r => r.seriesId === player.currentSeriesId)
        const totalPrizeMoney = seasonRaces.reduce((sum, r) => sum + r.prizeMoney, 0)
        const wins = seasonRaces.filter(r => r.racePosition === 1).length
        const podiums = seasonRaces.filter(r => r.racePosition <= 3).length
        
        const summary: SeasonSummary = {
          year: careerState.currentYear,
          seriesName: currentSeries.name,
          finalPosition: playerStanding?.position || standings.length + 1,
          totalDrivers: standings.length,
          points: playerStanding?.points || 0,
          wins,
          podiums,
          races: seasonRaces.length,
          prizeMoney: totalPrizeMoney,
          isChampion: playerStanding?.position === 1
        }
        
        // Mark season as completed and increment seasonsCompleted
        const updatedSeasonsCompleted = (player.seasonsCompleted || 0) + 1
        set({
          careerState: {
            ...careerState,
            seasonCompleted: true
          },
          player: {
            ...player,
            seasonsCompleted: updatedSeasonsCompleted
          }
        })
        
        // Add championship bonus for winning
        if (summary.isChampion) {
          const playerAfterSeasonMark = get().player!
          const championBonus = currentSeries.prizeMoney?.win ? currentSeries.prizeMoney.win * 3 : 50000
          get().addTransaction({
            type: 'income',
            category: 'bonus',
            amount: championBonus,
            description: `${currentSeries.name} Championship Winner Bonus!`,
            date: new Date().toISOString(),
            week: careerState.currentWeek,
            year: careerState.currentYear
          })
          
          // Increase reputation for championship (scaled by series tier)
          const CHAMP_BONUS_BY_TIER: Record<string, number> = {
            'entry': 3, 'amateur': 3, 'semi-pro': 5,
            'professional': 8, 'pro': 8, 'elite': 12, 'pinnacle': 15
          }
          const champRepBonus = CHAMP_BONUS_BY_TIER[currentSeries.tier] || 5
          const newRep = Math.min(100, playerAfterSeasonMark.reputation + champRepBonus)
          console.log(`[CareerStore] Championship bonus: +${champRepBonus} rep (tier: ${currentSeries.tier})`)
          // Track championship in seriesChampionships history
          const updatedChampionships = [...(playerAfterSeasonMark.seriesChampionships || [])]
          if (!updatedChampionships.includes(player.currentSeriesId!)) {
            updatedChampionships.push(player.currentSeriesId!)
          }
          set({
            player: {
              ...playerAfterSeasonMark,
              reputation: newRep,
              championships: playerAfterSeasonMark.championships + 1,
              seriesChampionships: updatedChampionships
            }
          })
          
          // Championship win: Major boost to personal brand (Team Owner mode)
          const championCareerState = get().careerState
          if (championCareerState?.personalLife?.brand) {
            const brand = championCareerState.personalLife.brand
            const seriesTierBonus = currentSeries.tier === 'pinnacle' ? 2 : 
                                    currentSeries.tier === 'elite' ? 1.5 : 1
            
            const championImageBoost = 10 * seriesTierBonus  // Big boost for championships
            const championBrandBoost = 8 * seriesTierBonus
            const championMediaBoost = 5 * seriesTierBonus
            
            const newPublicImage = Math.min(100, brand.publicImage + championImageBoost)
            const newBrandValue = Math.min(100, brand.brandValue + championBrandBoost)
            const newMediaPresence = Math.min(100, brand.mediaPresence + championMediaBoost)
            const newSpeakingFee = Math.round(1000 + (newBrandValue * 200))
            const championMonthlySpeaking = Math.floor(newSpeakingFee * 0.5)
            
            set({
              careerState: {
                ...championCareerState,
                personalLife: {
                  ...championCareerState.personalLife,
                  brand: {
                    ...brand,
                    publicImage: Math.round(newPublicImage * 10) / 10,
                    brandValue: Math.round(newBrandValue * 10) / 10,
                    mediaPresence: Math.round(newMediaPresence * 10) / 10,
                    speakingFee: newSpeakingFee
                  },
                  finances: {
                    ...championCareerState.personalLife.finances,
                    monthlyIncome: {
                      ...championCareerState.personalLife.finances.monthlyIncome,
                      speakingFees: championMonthlySpeaking
                    }
                  }
                }
              }
            })
            console.log(`[CareerStore] Championship win: Personal brand boosted! Image: ${newPublicImage.toFixed(1)}, Brand: ${newBrandValue.toFixed(1)}, Speaking: $${championMonthlySpeaking}/mo`)
          }
        }
        
        // ============================================
        // SEASON END: Evaluate Sponsor Performance Targets
        // ============================================
        const currentPlayer = get().player
        if (currentPlayer) {
          const activeSponsors = currentPlayer.finances.sponsorDeals.filter(d => d.active)
          const updatedSponsorDeals = [...currentPlayer.finances.sponsorDeals]
          let totalRepChange = 0
          let totalMarketabilityChange = 0
          const sponsorReviews: Array<{
            sponsorName: string
            satisfaction: number
            targetsReview: Array<{ description: string; met: boolean; exceeded: boolean }>
            consequence: 'bonus' | 'normal' | 'reduced' | 'terminated'
          }> = []
          
          activeSponsors.forEach(sponsor => {
            const sponsorIndex = updatedSponsorDeals.findIndex(d => d.id === sponsor.id)
            if (sponsorIndex === -1) return
            
            // Finalize all season targets with actual final position
            let finalizedTargets = sponsor.targets || []
            if (finalizedTargets.length > 0) {
              finalizedTargets = finalizeSeasonTargets(
                finalizedTargets,
                summary.finalPosition,
                seasonRaces.length,
                sponsor.seasonRacesStarted ?? seasonRaces.length
              )
            }
            
            // Calculate end-of-season satisfaction change based on targets
            const satisfactionUpdate = calculateSeasonEndSatisfaction(
              sponsor.satisfaction ?? 70,
              finalizedTargets
            )
            
            let updatedSponsor = {
              ...updatedSponsorDeals[sponsorIndex],
              targets: finalizedTargets,
              satisfaction: satisfactionUpdate.newSatisfaction
            }
            
            // Determine consequence tier
            let consequence: 'bonus' | 'normal' | 'reduced' | 'terminated' = 'normal'
            if (satisfactionUpdate.newSatisfaction >= 80) {
              consequence = 'bonus'
              // Happy sponsors boost reputation and marketability
              totalRepChange += REPUTATION_IMPACT.seasonCompleteBonus
              totalMarketabilityChange += REPUTATION_IMPACT.marketabilityBonus
            } else if (satisfactionUpdate.newSatisfaction >= 60) {
              consequence = 'normal'
            } else if (satisfactionUpdate.newSatisfaction >= 20) {
              consequence = 'reduced'
            } else {
              consequence = 'terminated'
              updatedSponsor.active = false
              // Termination penalties
              totalRepChange += REPUTATION_IMPACT.sponsorTerminated
              totalMarketabilityChange += REPUTATION_IMPACT.marketabilityPenalty
            }
            
            // Build review for UI
            sponsorReviews.push({
              sponsorName: sponsor.sponsorName,
              satisfaction: satisfactionUpdate.newSatisfaction,
              targetsReview: finalizedTargets.map(t => ({
                description: t.description,
                met: t.met,
                exceeded: t.exceeded
              })),
              consequence
            })
            
            // Reset season stats for next season (if deal continues)
            if (updatedSponsor.active) {
              updatedSponsor.seasonWins = 0
              updatedSponsor.seasonPodiums = 0
              updatedSponsor.seasonRacesStarted = 0
              updatedSponsor.seasonDNFs = 0
              updatedSponsor.warningIssued = false
              updatedSponsor.finalWarningIssued = false
              // Targets will be regenerated when season starts
            }
            
            updatedSponsorDeals[sponsorIndex] = updatedSponsor
            
            console.log(`[CareerStore] Sponsor review - ${sponsor.sponsorName}: ${satisfactionUpdate.newSatisfaction}% satisfaction, ${consequence}`)
          })
          
          // Apply reputation/marketability changes
          set({
            player: {
              ...currentPlayer,
              reputation: Math.max(0, Math.min(100, currentPlayer.reputation + totalRepChange)),
              stats: {
                ...currentPlayer.stats,
                marketability: Math.max(0, Math.min(100, currentPlayer.stats.marketability + totalMarketabilityChange))
              },
              finances: {
                ...currentPlayer.finances,
                sponsorDeals: updatedSponsorDeals
              }
            }
          })
          
          // Store sponsor reviews for the SeasonEnd screen to display
          const updatedCareerState = get().careerState
          if (updatedCareerState) {
            set({
              careerState: {
                ...updatedCareerState,
                lastSeasonSponsorReviews: sponsorReviews
              }
            })
          }
          
          console.log(`[CareerStore] Season end sponsor evaluation: Rep change ${totalRepChange}, Marketability change ${totalMarketabilityChange}`)
        }
        
        // ============================================
        // SEASON END: Evaluate Contract Renewal/Termination
        // ============================================
        const playerForContractEnd = get().player
        if (playerForContractEnd?.contract) {
          const contract = playerForContractEnd.contract
          const isLastYear = contract.endYear <= careerState.currentYear + 1
          
          // Evaluate renewal if contract is expiring
          if (isLastYear && contract.targets) {
            const renewalResult = evaluateContractRenewal(
              contract,
              contract.targets,
              summary.finalPosition,
              careerState.currentYear
            )
            
            if (renewalResult.shouldRenew) {
              console.log(`[CareerStore] Contract auto-renewed: ${renewalResult.reason}`)
              set({
                player: {
                  ...get().player!,
                  contract: {
                    ...get().player!.contract!,
                    endYear: renewalResult.newEndYear || contract.endYear + 1,
                    salary: renewalResult.newSalary || contract.salary,
                    bonusPerWin: renewalResult.newBonusPerWin || contract.bonusPerWin,
                    bonusPerPodium: renewalResult.newBonusPerPodium || contract.bonusPerPodium,
                    teamSatisfaction: DEFAULT_TEAM_SATISFACTION, // Reset for new period
                    warningIssued: false,
                    finalWarningIssued: false
                  }
                }
              })
              
              get().addEmail({
                category: 'team',
                subject: 'Contract Renewed!',
                sender: contract.teamName,
                senderRole: 'Team Principal',
                preview: `Great news! Your contract has been renewed...`,
                body: `Congratulations!\n\n${renewalResult.reason}\n\nYour contract with **${contract.teamName}** has been extended.\n\nNew salary: $${(renewalResult.newSalary || contract.salary).toLocaleString()}/year\n\nRegards,\n${contract.teamName} Management`,
                receivedDay: careerState.currentDay,
                receivedWeek: careerState.currentWeek,
                receivedYear: careerState.currentYear,
                read: false,
                starred: false,
                archived: false,
                actionType: 'acknowledge'
              })
            } else {
              console.log(`[CareerStore] Contract not renewed: ${renewalResult.reason}`)
            }
          }
          
          // Reset contract season stats for next season
          if (playerForContractEnd.contract) {
            set({
              player: {
                ...get().player!,
                contract: {
                  ...get().player!.contract!,
                  seasonStats: {
                    racesCompleted: 0,
                    wins: 0,
                    podiums: 0,
                    points: 0,
                    dnfCount: 0,
                    teammateBattleWins: 0,
                    teammateBattleLosses: 0,
                    warningsIssued: 0,
                    seasonYear: careerState.currentYear + 1
                  }
                }
              }
            })
          }
        }
        
        // Recalculate reputation and marketability at season end for consistency
        setTimeout(() => {
          get().recalculateReputation()
          get().recalculateMarketability()
        }, 200)
        
        // === NEW: Trigger end-of-season driver updates and transfers ===
        
        // 1. Update driver skills based on season performance for ALL series
        // This ensures the entire "living world" progresses -- drivers in every series
        // age, improve/decline, update career stage, and get career totals updated.
        const allSeries = rivalStore.series || []
        allSeries.forEach(s => {
          rivalStore.updateDriversAfterSeason(s.id)
        })
        console.log(`[CareerStore] Updated driver skills for all ${allSeries.length} series (including ${currentSeries.name})`)
        
        // 1b. Apply passive skill growth for hired drivers (natural aging/development)
        const playerAfterSeason = get().player
        const ownedTeamForPassive = get().careerState?.ownedTeam
        if (playerAfterSeason && ownedTeamForPassive && ownedTeamForPassive.drivers.length > 0) {
          const updatedHiredDrivers = ownedTeamForPassive.drivers.map(hiredDriver => {
            const rivalDriver = useRivalStore.getState().rivals.find(r => r.id === hiredDriver.driverId)
            if (!rivalDriver) return hiredDriver
            
            const careerStage: DriverCareerStage = rivalDriver.careerStage || 'peak'
            const developmentRate = rivalDriver.developmentRate || 0.01
            const dev = hiredDriver.development
            const leveledUp = dev ? dev.experienceLevel > (dev.experiencePoints > 0 ? calculateLevelFromXP(dev.experiencePoints - 50) : 1) : false
            
            const passiveGrowth = calculatePassiveSkillGrowth(leveledUp, careerStage, developmentRate)
            
            if (passiveGrowth !== 0) {
              const currentBoosts = dev?.skillBoosts || {}
              const updatedBoosts = { ...currentBoosts }
              
              // Apply passive growth to base skill via raceSkill boost
              updatedBoosts.raceSkill = (updatedBoosts.raceSkill || 0) + passiveGrowth
              
              console.log(`[CareerStore] Passive growth for ${hiredDriver.driverId}: ${passiveGrowth > 0 ? '+' : ''}${passiveGrowth.toFixed(3)} (${careerStage})`)
              
              return {
                ...hiredDriver,
                development: {
                  ...(dev || { experiencePoints: 0, experienceLevel: 1, trainingProgram: null, trainingStartWeek: 0, trainingStartYear: 0, trainingProgress: 0, recentRaceXP: [] }),
                  skillBoosts: updatedBoosts
                }
              }
            }
            return hiredDriver
          })
          
          set({
            careerState: {
              ...get().careerState!,
              ownedTeam: {
                ...ownedTeamForPassive,
                drivers: updatedHiredDrivers
              }
            }
          })
        }
        
        // 2. Run the transfer window (promotions, demotions, retirements)
        const transferNews = rivalStore.runTransferWindow(careerState.currentYear + 1)
        console.log(`[CareerStore] Transfer window completed: ${transferNews.length} moves`)
        
        // 3. Process AI team economics (sponsors, facilities, budgets, prestige)
        const teamEconomicsNews = rivalStore.processTeamEconomicsEndOfSeason(careerState.currentYear)
        console.log(`[CareerStore] Team economics processed: ${teamEconomicsNews.length} changes`)
        
        // 4. Generate new rookie drivers for next season
        const newRookies = rivalStore.generateSeasonRookies(careerState.currentYear + 1)
        console.log(`[CareerStore] Generated ${newRookies.length} new rookies for next season`)
        
        // 4. Check for works contract reassignment
        if (player.contract?.canBeReassigned && player.contract?.offerType === 'works-program' && player.contract?.programId) {
          console.log(`[CareerStore] Checking works contract reassignment for ${player.contract.teamName}`)
          
          // Get all entries in the player's program
          const programEntries = rivalStore.getProgramEntries(player.contract.programId)
          
          // Convert to the format expected by checkWorksReassignment
          const entriesForCheck = programEntries.map((entry: ProgramEntryInfo) => ({
            entryId: entry.entryId,
            entryName: entry.entryName,
            carName: entry.carName,
            seriesId: entry.seriesId,
            seriesName: entry.seriesName,
            currentDriverRep: entry.currentDriverRep,
            tier: entry.tier
          }))
          
          const reassignment = checkWorksReassignment(
            player.reputation,
            player.contract.currentAssignment?.entryId || player.contract.teamId,
            entriesForCheck,
            playerStanding?.position || standings.length,
            standings.length
          )
          
          if (reassignment) {
            console.log(`[CareerStore] Works reassignment: ${reassignment.reason} - Moving to ${reassignment.newEntryName}`)
            
            // Find the team for carClassId lookup
            const newTeam = rivalStore.getTeamById(reassignment.newEntryId)
            
            // Update player's contract assignment
            const newAssignment: CurrentAssignment = {
              entryId: reassignment.newEntryId,
              entryName: reassignment.newEntryName,
              carName: reassignment.newCarName,
              carClassId: newTeam?.carClassId || player.contract.currentAssignment?.carClassId || '',
              seriesId: reassignment.newSeriesId,
              seriesName: reassignment.newSeriesName
            }
            
            // Generate reassignment event
            const reassignEvent = generateReassignmentEvent(
              reassignment,
              player.contract.teamName,
              careerState.currentWeek,
              careerState.currentYear
            )
            
            // Update player contract with new assignment
            const updatedContract = {
              ...player.contract,
              currentAssignment: newAssignment,
              seriesId: reassignment.newSeriesId,
              seriesName: reassignment.newSeriesName
            }
            
            // Update player state with new contract and add event to career events
            const currentEvents = careerState.events || []
            set({
              player: {
                ...player,
                contract: updatedContract,
                currentSeriesId: reassignment.newSeriesId,
                currentTeamId: reassignment.newEntryId
              },
              careerState: {
                ...careerState,
                events: [...currentEvents, reassignEvent]
              }
            })
            
            console.log(`[CareerStore] Player reassigned: ${reassignEvent.title}`)
          }
        }
        
        // ============================================
        // TEAM OWNER MODE: Season End Financial Processing
        // ============================================
        const latestCareerState = get().careerState
        if (latestCareerState?.ownedTeam) {
          const ownedTeam = latestCareerState.ownedTeam
          const seriesEntries = latestCareerState.seriesEntries || []
          const tier = (ownedTeam.tier || 'amateur') as TeamTier
          
          let allTransactions: TeamTransaction[] = []
          let updatedSponsors = ownedTeam.finances?.sponsors || []
          
          // Process each series the team is entered in
          seriesEntries.forEach(entry => {
            // Get standings for this series
            const entryStandings = rivalStore.getStandings(entry.seriesId)
            // Find team's position (using team name or player as driver-owner)
            const teamStanding = entryStandings.find(s => 
              s.isPlayer || 
              s.driverName === `${player?.firstName} ${player?.lastName}` ||
              s.teamName?.toLowerCase().includes(ownedTeam.name.toLowerCase())
            )
            const teamPosition = teamStanding?.position || entryStandings.length + 1
            
            // 1. Championship Prize Money
            const prizeTx = processChampionshipPrize(
              ownedTeam,
              teamPosition,
              tier,
              entry.seriesId,
              entry.seriesName,
              latestCareerState.currentWeek,
              latestCareerState.currentYear
            )
            if (prizeTx) {
              allTransactions.push(prizeTx)
              console.log(`[CareerStore] Team earned championship prize: P${teamPosition} in ${entry.seriesName} = $${prizeTx.amount.toLocaleString()}`)
            }
          })
          
          // 2. Sponsor Championship Bonuses (based on best result if multiple series)
          const bestPosition = Math.min(...seriesEntries.map(entry => {
            const standings = rivalStore.getStandings(entry.seriesId)
            const teamStanding = standings.find(s => 
              s.isPlayer || 
              s.driverName === `${player?.firstName} ${player?.lastName}`
            )
            return teamStanding?.position || standings.length + 1
          }))
          
          if (bestPosition < Infinity) {
            const sponsorBonusResult = processTeamSponsorChampionshipBonuses(
              ownedTeam,
              bestPosition,
              latestCareerState.currentWeek,
              latestCareerState.currentYear
            )
            allTransactions.push(...sponsorBonusResult.transactions)
            updatedSponsors = sponsorBonusResult.updatedSponsors
            
            if (sponsorBonusResult.transactions.length > 0) {
              const totalBonuses = sponsorBonusResult.transactions.reduce((sum, tx) => sum + tx.amount, 0)
              console.log(`[CareerStore] Team earned $${totalBonuses.toLocaleString()} in sponsor championship bonuses`)
            }
          }
          
          // 3. Process sponsor contract expirations
          const contractResult = processSeasonEndSponsorContracts(
            { ...ownedTeam, finances: { ...ownedTeam.finances, sponsors: updatedSponsors } },
            latestCareerState.currentYear
          )
          
          if (contractResult.expiredSponsors.length > 0) {
            console.log(`[CareerStore] ${contractResult.expiredSponsors.length} sponsor contract(s) expired`)
          }
          
          // 4. Generate renewal offers and emails for eligible sponsors
          if (contractResult.renewalCandidates.length > 0) {
            console.log(`[CareerStore] ${contractResult.renewalCandidates.length} sponsor(s) eligible for renewal`)
            
            // Generate renewal offers
            const renewalOffers = generateSponsorRenewalOffers(
              { ...ownedTeam, finances: { ...ownedTeam.finances, sponsors: updatedSponsors } },
              contractResult.renewalCandidates,
              player?.reputation || 50,
              bestPosition < Infinity ? bestPosition : 10,
              latestCareerState.currentWeek,
              latestCareerState.currentYear
            )
            
            // Generate email for each renewal offer
            const renewalEmails: Email[] = renewalOffers.map(offer => {
              const emailContent = generateRenewalEmailContent(offer)
              return {
                id: `email_renewal_${offer.sponsorId}_${Date.now()}`,
                category: 'sponsor' as EmailCategory,
                subject: emailContent.subject,
                sender: offer.sponsorName,
                senderRole: 'Partnerships Team',
                preview: emailContent.body.substring(0, 100) + '...',
                body: emailContent.body,
                receivedDay: 1,
                receivedWeek: latestCareerState.currentWeek,
                receivedYear: latestCareerState.currentYear,
                read: false,
                starred: true,
                archived: false,
                actionType: 'negotiate_sponsor' as const,
                actionData: {
                  negotiationId: `renewal_${offer.sponsorId}`,
                  sponsorId: offer.sponsorId,
                  sponsorName: offer.sponsorName,
                  isRenewal: true,
                  renewalOffer: offer
                },
                expiresWeek: offer.expiresWeek
              }
            })
            
            // Add renewal emails
            if (renewalEmails.length > 0) {
              const currentEmails = latestCareerState.emails || []
              set({
                careerState: {
                  ...get().careerState!,
                  emails: [...currentEmails, ...renewalEmails]
                }
              })
              console.log(`[CareerStore] Generated ${renewalEmails.length} sponsor renewal offer emails`)
            }
          }
          
          // Update team financials using updateTeamBudgets for proper tracking
          const existingTransactions = ownedTeam.finances?.transactions || []
          let updatedBudgets = { ...ownedTeam.budgets }
          for (const tx of allTransactions) {
            updatedBudgets = updateTeamBudgets(updatedBudgets, tx)
          }
          
          set({
            careerState: {
              ...latestCareerState,
              ownedTeam: {
                ...ownedTeam,
                budgets: updatedBudgets,
                finances: {
                  ...ownedTeam.finances,
                  transactions: [...existingTransactions, ...allTransactions],
                  sponsors: contractResult.continuingSponsors
                }
              }
            }
          })
          
          console.log(`[CareerStore] Team owner season end processed: $${allTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()} total income`)
        }
        
        console.log(`[CareerStore] Season ended: ${summary.seriesName} - P${summary.finalPosition} ${summary.isChampion ? '🏆 CHAMPION!' : ''}`)
        
        return summary
      },

      getUpcomingRace: () => {
        const { player, careerState } = get()
        if (!player?.currentSeriesId || !careerState) return null
        
        // This would query the rivalStore for the calendar
        // For now return null - will be implemented with the calendar screen
        return null
      },

      canAffordSeat: (seatCost) => {
        const { player } = get()
        if (!player) return false
        return player.finances.bankBalance >= seatCost
      },

      // ============================================
      // Calendar Conflict Management
      // ============================================
      
      detectCalendarConflicts: (seriesIds, calendars) => {
        const { careerState } = get()
        if (!careerState) return []
        
        // Group races by week
        const racesByWeek: Record<number, Array<{
          seriesId: string
          trackId: string
          trackName: string
          country: string
          round: number
          totalRounds: number
        }>> = {}
        
        seriesIds.forEach(seriesId => {
          const calendar = calendars[seriesId]
          if (!calendar) return
          
          const totalRounds = calendar.length
          calendar.forEach(race => {
            if (!racesByWeek[race.week]) {
              racesByWeek[race.week] = []
            }
            racesByWeek[race.week].push({
              seriesId,
              trackId: race.trackId,
              trackName: race.trackName,
              country: race.country,
              round: race.round,
              totalRounds
            })
          })
        })
        
        // Find weeks with multiple races (conflicts)
        const conflicts: CalendarConflict[] = []
        
        Object.entries(racesByWeek).forEach(([weekStr, races]) => {
          const week = parseInt(weekStr)
          if (races.length > 1) {
            // This is a conflict
            conflicts.push({
              id: `conflict-${careerState.currentYear}-w${week}`,
              week,
              year: careerState.currentYear,
              races: races.map(race => ({
                seriesId: race.seriesId,
                seriesName: race.seriesId, // Will be resolved by UI
                trackId: race.trackId,
                trackName: race.trackName,
                country: race.country,
                round: race.round,
                totalRounds: race.totalRounds,
                standingsPosition: 0, // Will be updated dynamically
                pointsToLeader: 0,    // Will be updated dynamically
                prizeMoney: { win: 0, podium: 0 } // Will be set by UI
              })),
              resolved: false
            })
          }
        })
        
        // Sort by week
        conflicts.sort((a, b) => a.week - b.week)
        
        console.log(`[CareerStore] Detected ${conflicts.length} calendar conflicts`)
        
        return conflicts
      },

      resolveConflict: (conflictId, chosenSeriesId) => {
        const { careerState } = get()
        if (!careerState) return
        
        const conflict = careerState.pendingConflicts.find(c => c.id === conflictId)
        if (!conflict) {
          console.warn(`[CareerStore] Conflict ${conflictId} not found`)
          return
        }
        
        const resolvedConflict: CalendarConflict = {
          ...conflict,
          resolved: true,
          chosenSeriesId
        }
        
        set({
          careerState: {
            ...careerState,
            pendingConflicts: careerState.pendingConflicts.filter(c => c.id !== conflictId),
            resolvedConflicts: [...careerState.resolvedConflicts, resolvedConflict]
          }
        })
        
        console.log(`[CareerStore] Resolved conflict ${conflictId}: chose ${chosenSeriesId}`)
      },

      getNextConflict: () => {
        const { careerState } = get()
        if (!careerState || careerState.pendingConflicts.length === 0) return null
        
        // Return the earliest unresolved conflict
        const sorted = [...careerState.pendingConflicts]
          .filter(c => !c.resolved)
          .sort((a, b) => a.week - b.week)
        
        return sorted[0] || null
      },

      hasUnresolvedConflicts: () => {
        const { careerState } = get()
        if (!careerState?.pendingConflicts) return false
        return careerState.pendingConflicts.some(c => !c.resolved)
      },

      // ============================================
      // Sponsor Management
      // ============================================

      generateSponsorOffers: () => {
        const { player, careerState } = get()
        if (!player || !careerState) return []
        
        // Get current series info for sponsor generation
        const currentSeries = player.currentSeriesId 
          ? useRivalStore.getState().getSeriesById(player.currentSeriesId)
          : undefined
        
        // Get manufacturer from contract if available
        const manufacturerId = player.contract?.manufacturerId
        
        // Get existing sponsor IDs to filter them out
        const existingSponsorIds = player.finances.sponsorDeals.map(d => d.sponsorId)
        
        // Generate new offers using the enhanced simulation function
        const newOffers = generateSponsorOffersFromSim(
          player, 
          careerState.currentYear,
          currentSeries?.tier,
          manufacturerId,
          currentSeries?.category, // e.g., 'gt3', 'formula', 'touring'
          existingSponsorIds
        )
        
        // Generate emails for each sponsor offer
        const sponsorEmails = newOffers.map(offer => ({
          ...generateSponsorOfferEmail(offer, careerState),
          id: `email_sponsor_${offer.id}`
        }))
        
        // Update state with new pending offers and emails
        set({
          careerState: {
            ...careerState,
            pendingSponsorOffers: newOffers,
            lastSponsorGenerationWeek: careerState.currentWeek,
            emails: [...sponsorEmails, ...(careerState.emails || [])]
          }
        })
        
        console.log(`[CareerStore] Generated ${newOffers.length} sponsor offers with emails`)
        return newOffers
      },

      acceptSponsorDeal: (dealId: string) => {
        const { player, careerState } = get()
        if (!player || !careerState) return
        
        const deal = careerState.pendingSponsorOffers.find(d => d.id === dealId)
        if (!deal) {
          console.warn(`[CareerStore] Sponsor deal ${dealId} not found`)
          return
        }
        
        // Activate the deal and add to player's sponsors
        const activeDeal: SponsorDeal = {
          ...deal,
          active: true,
          startYear: careerState.currentYear
        }
        
        set({
          player: {
            ...player,
            finances: {
              ...player.finances,
              sponsorDeals: [...player.finances.sponsorDeals, activeDeal]
            }
          },
          careerState: {
            ...careerState,
            pendingSponsorOffers: careerState.pendingSponsorOffers.filter(d => d.id !== dealId)
          }
        })
        
        console.log(`[CareerStore] Accepted sponsor deal: ${deal.sponsorName}`)
      },

      declineSponsorDeal: (dealId: string) => {
        const { careerState } = get()
        if (!careerState) return
        
        const deal = careerState.pendingSponsorOffers.find(d => d.id === dealId)
        
        set({
          careerState: {
            ...careerState,
            pendingSponsorOffers: careerState.pendingSponsorOffers.filter(d => d.id !== dealId)
          }
        })
        
        console.log(`[CareerStore] Declined sponsor deal: ${deal?.sponsorName || dealId}`)
      },

      getActiveSponsorDeals: () => {
        const { player } = get()
        if (!player) return []
        return player.finances.sponsorDeals.filter(d => d.active)
      },

      expireOldSponsorDeals: () => {
        const { player, careerState } = get()
        if (!player || !careerState) return
        
        const currentYear = careerState.currentYear
        const updatedDeals = player.finances.sponsorDeals.map(deal => {
          // Check if deal has expired (startYear + duration <= currentYear)
          if (deal.active && deal.startYear + deal.duration <= currentYear) {
            console.log(`[CareerStore] Sponsor deal expired: ${deal.sponsorName}`)
            return { ...deal, active: false }
          }
          return deal
        })
        
        // Remove expired deals entirely
        const activeDeals = updatedDeals.filter(d => d.active)
        
        if (activeDeals.length !== player.finances.sponsorDeals.length) {
          set({
            player: {
              ...player,
              finances: {
                ...player.finances,
                sponsorDeals: activeDeals
              }
            }
          })
        }
      },

      // ============================================
      // RPG System
      // ============================================

      updateRPGState: (updates: Partial<RPGState>) => {
        const { careerState } = get()
        if (!careerState) return
        
        set({
          careerState: {
            ...careerState,
            rpgState: {
              ...careerState.rpgState,
              ...updates
            }
          }
        })
      },

      updateTeamDevelopment: (updates: Partial<AIModifierTeamDevState>) => {
        const { careerState } = get()
        if (!careerState) return
        
        set({
          careerState: {
            ...careerState,
            rpgState: {
              ...careerState.rpgState,
              teamDevelopment: {
                ...careerState.rpgState.teamDevelopment,
                ...updates
              }
            }
          }
        })
      },
      
      // ============================================
      // NEW: Full Team Development System
      // ============================================
      
      initializeTeamDevelopment: () => {
        const { player, careerState } = get()
        if (!player || !careerState) return
        
        // Get team tier for budget calculation from rivalStore
        const { getTeamById } = useRivalStore.getState()
        const team = player.contract?.teamId ? getTeamById(player.contract.teamId) : null
        const tier = team?.tier || 'amateur'
        const newDevState = createDefaultTeamDevelopmentState(tier)
        
        set({
          careerState: {
            ...careerState,
            teamDevelopment: newDevState,
            developmentEvents: []
          }
        })
        
        console.log(`[Team Development] Initialized for tier: ${tier}, budget: ${formatBudget(newDevState.budget.seasonTotal)}`)
      },
      
      processWeeklyDevelopment: () => {
        const { player, careerState } = get()
        if (!player || !careerState || !careerState.teamDevelopment) {
          return { pointsGained: { aerodynamics: 0, chassis: 0, powertrain: 0, electronics: 0 }, completedUpgrades: [], events: [] }
        }
        
        const techFeedback = player.stats?.technicalFeedback || 50
        const currentWeek = careerState.currentWeek
        const currentYear = careerState.currentYear
        
        // Get facility levels for R&D bonuses
        const facilityLevels = careerState.ownedTeam?.facilities ? {
          aero: careerState.ownedTeam.facilities.aero?.level || 1,
          chassis: careerState.ownedTeam.facilities.chassis?.level || 1,
          engine: careerState.ownedTeam.facilities.engine?.level || 1,
          sim: careerState.ownedTeam.facilities.sim?.level || 1,
          manufacturing: careerState.ownedTeam.facilities.manufacturing?.level || 1,
          marketing: careerState.ownedTeam.facilities.marketing?.level || 1
        } : undefined
        
        // Calculate staff effectiveness bonuses for each R&D facility
        let staffBonuses: Record<FacilityType, number> | undefined
        if (careerState.ownedTeam?.facilities && careerState.ownedTeam?.staff) {
          const teamStaff = careerState.ownedTeam.staff
          const facilities = careerState.ownedTeam.facilities
          
          // R&D facilities that contribute to development
          const rdFacilities: FacilityType[] = ['aero', 'chassis', 'engine', 'sim']
          
          staffBonuses = {
            aero: 0,
            chassis: 0,
            engine: 0,
            sim: 0,
            manufacturing: 0,
            marketing: 0
          }
          
          for (const facilityType of rdFacilities) {
            const facility = facilities[facilityType]
            if (facility && facility.assignedStaff.length > 0) {
              // Look up actual staff objects from IDs
              const assignedStaffMembers = facility.assignedStaff
                .map(staffId => teamStaff.find(s => s.id === staffId))
                .filter((s): s is TeamStaff => s !== undefined)
              
              if (assignedStaffMembers.length > 0) {
                // Calculate bonus using facility-config function
                staffBonuses[facilityType] = calculateStaffEffectivenessBonus(
                  facilityType,
                  assignedStaffMembers.map(staff => ({
                    skills: staff.skills,
                    specializations: staff.specializations,
                    experience: staff.experience
                  }))
                )
              }
            }
          }
        }
        
        // Get team morale for morale modifier
        // MoraleModifiers expects: teamMorale, driverMorale, boardMood, controversyCount, missedDuties
        const teamMorale = careerState.ownedTeam?.teamMorale ?? 50
        const boardMood = careerState.teamMediaState?.boardPRSatisfaction ?? 50
        
        // Use player's morale as driver morale (player is the team owner/driver)
        const driverMoraleAvg = player.mentalState?.morale ?? 50
        
        // Count active controversies from media state
        const controversyCount = careerState.teamMediaState?.activeControversies?.length ?? 0
        // Count missed activities from schedule (activities with 'missed' status)
        const allActivities = careerState.scheduledActivities || []
        const missedDuties = allActivities.filter(a => a.status === 'missed').length
        
        const moraleModifiers = {
          teamMorale,
          driverMorale: driverMoraleAvg,
          boardMood,
          controversyCount,
          missedDuties
        }
        
        // Check available development budget and cap weekly allocation if needed
        const availableDevBudget = careerState.ownedTeam?.budgets?.developmentBudget ?? 0
        const weeklyAllocation = careerState.teamDevelopment.budget.weeklyAllocation
        
        // If team's development budget is lower than what's allocated, cap it
        const effectiveWeeklyAllocation = Math.min(weeklyAllocation, availableDevBudget)
        
        // Temporarily adjust the weekly allocation if needed
        let developmentStateToUse = careerState.teamDevelopment
        if (effectiveWeeklyAllocation < weeklyAllocation) {
          developmentStateToUse = {
            ...careerState.teamDevelopment,
            budget: {
              ...careerState.teamDevelopment.budget,
              weeklyAllocation: effectiveWeeklyAllocation
            }
          }
          console.log(`[Team Development] Weekly allocation capped from $${weeklyAllocation} to $${effectiveWeeklyAllocation} due to budget constraints`)
        }
        
        const result = applyWeeklyDevelopment(
          developmentStateToUse,
          techFeedback,
          currentWeek,
          currentYear,
          moraleModifiers,
          facilityLevels,
          staffBonuses
        )
        
        // Apply any event effects
        let finalState = result.newState
        for (const event of result.events) {
          finalState = applyEventEffects(finalState, event, currentWeek)
        }
        
        // Sync development budget with team's development budget
        // Deduct the weekly allocation from team's developmentBudget
        let updatedOwnedTeam = careerState.ownedTeam
        if (updatedOwnedTeam && effectiveWeeklyAllocation > 0) {
          const newDevBudget = Math.max(0, availableDevBudget - effectiveWeeklyAllocation)
          updatedOwnedTeam = {
            ...updatedOwnedTeam,
            budgets: {
              ...updatedOwnedTeam.budgets,
              developmentBudget: newDevBudget
            }
          }
          
          // Log warning if budget is getting low
          if (newDevBudget < weeklyAllocation * 4) {
            console.log(`[Team Development] Warning: Development budget running low ($${newDevBudget} remaining)`)
          }
          
          // Create transaction for development spending
          if (updatedOwnedTeam.finances) {
            const devTransaction = createTeamTransaction(
              'expense',
              'development',
              effectiveWeeklyAllocation,
              `Weekly R&D allocation (Development System)`,
              currentWeek,
              currentYear
            )
            updatedOwnedTeam = {
              ...updatedOwnedTeam,
              finances: {
                ...updatedOwnedTeam.finances,
                transactions: [...(updatedOwnedTeam.finances.transactions || []), devTransaction]
              }
            }
          }
        }
        
        // Also update the legacy RPG state for AI modifier calculation
        const legacyTeamDev = {
          points: finalState.totalPoints / 4, // Scale down for legacy system
          weeklyGrowthRate: finalState.weeklyGrowthRate,
          lastUpdatedWeek: currentWeek
        }
        
        set({
          careerState: {
            ...careerState,
            teamDevelopment: finalState,
            developmentEvents: [...(careerState.developmentEvents || []).slice(-20), ...result.events],
            rpgState: {
              ...careerState.rpgState,
              teamDevelopment: legacyTeamDev
            },
            ownedTeam: updatedOwnedTeam
          }
        })
        
        if (result.completedUpgrades.length > 0) {
          console.log(`[Team Development] Completed upgrades: ${result.completedUpgrades.map(u => u.name).join(', ')}`)
        }
        
        return {
          pointsGained: result.pointsGained,
          completedUpgrades: result.completedUpgrades.map(u => u.name),
          events: result.events
        }
      },
      
      setDevFocus: (area: DevelopmentArea | 'balanced') => {
        const { careerState } = get()
        if (!careerState || !careerState.teamDevelopment) return
        
        const newState = setDevelopmentFocus(careerState.teamDevelopment, area)
        
        set({
          careerState: {
            ...careerState,
            teamDevelopment: newState
          }
        })
        
        console.log(`[Team Development] Focus set to: ${area}`)
      },
      
      setDevBudget: (amount: number) => {
        const { careerState } = get()
        if (!careerState || !careerState.teamDevelopment) return
        
        const newState = setWeeklyAllocation(careerState.teamDevelopment, amount)
        
        set({
          careerState: {
            ...careerState,
            teamDevelopment: newState
          }
        })
      },
      
      startResearch: (upgradeId: string) => {
        const { careerState, consumeHoursFromBudget, addPersonalCalendarEntry } = get()
        if (!careerState || !careerState.teamDevelopment) return false
        
        const newState = startUpgradeResearch(careerState.teamDevelopment, upgradeId)
        
        if (!newState) {
          console.log(`[Team Development] Cannot start research for: ${upgradeId}`)
          return false
        }
        
        const upgrade = getUpgradeById(upgradeId)
        
        // === TIME BUDGET + CALENDAR INTEGRATION ===
        const researchTimeCost = getActivityTimeCost('sponsor_negotiation') // ~2h, normal drain (R&D briefing)
        if (researchTimeCost.hours > 0) {
          consumeHoursFromBudget(researchTimeCost.hours, researchTimeCost.drain, `R&D Briefing: ${upgrade?.name || upgradeId}`, 'sponsor_negotiation')
        }
        addPersonalCalendarEntry({
          name: `R&D Research: ${upgrade?.name || upgradeId}`,
          description: `Started research project: ${upgrade?.name || upgradeId}`,
          activityId: 'sponsor_negotiation',
          week: careerState.currentWeek,
          day: careerState.currentDay ?? 1,
          duration: researchTimeCost.hours,
          drainLevel: researchTimeCost.drain,
          calendarEntryType: 'team',
          category: 'development',
          immediate: true
        })
        
        set({
          careerState: {
            ...careerState,
            teamDevelopment: newState
          }
        })
        
        console.log(`[Team Development] Started research: ${upgrade?.name}`)
        return true
      },
      
      addRaceResultBonus: (wins: number, podiums: number, pointsFinishes: number) => {
        const { player, careerState } = get()
        if (!player || !careerState || !careerState.teamDevelopment) return
        
        // Get team tier from rivalStore
        const { getTeamById } = useRivalStore.getState()
        const team = player.contract?.teamId ? getTeamById(player.contract.teamId) : null
        const tier = team?.tier || 'amateur'
        const newState = addResultBonus(careerState.teamDevelopment, tier, wins, podiums, pointsFinishes)
        
        const bonusAdded = newState.budget.bonusFromResults - careerState.teamDevelopment.budget.bonusFromResults
        
        set({
          careerState: {
            ...careerState,
            teamDevelopment: newState
          }
        })
        
        if (bonusAdded > 0) {
          console.log(`[Team Development] Race result bonus: +${formatBudget(bonusAdded)}`)
        }
      },
      
      getTeamDevModifier: () => {
        const { careerState } = get()
        if (!careerState || !careerState.teamDevelopment) return 0
        
        return calculateTeamDevelopmentModifier(careerState.teamDevelopment)
      },
      
      resetTeamDevForSeason: () => {
        const { player, careerState } = get()
        if (!player || !careerState || !careerState.teamDevelopment) return
        
        // Get team tier from rivalStore
        const { getTeamById } = useRivalStore.getState()
        const team = player.contract?.teamId ? getTeamById(player.contract.teamId) : null
        const tier = team?.tier || 'amateur'
        const newState = resetSeasonDevelopment(careerState.teamDevelopment, tier)
        
        set({
          careerState: {
            ...careerState,
            teamDevelopment: newState,
            developmentEvents: []
          }
        })
        
        console.log(`[Team Development] Reset for new season. Retained ${Math.round(newState.totalPoints)} points`)
      },

      updateMilestonesFromPlayer: () => {
        const { player, careerState } = get()
        if (!player || !careerState) return []
        
        const oldMilestones = careerState.rpgState.milestones
        const newMilestones = updateMilestones(oldMilestones, player)
        
        // Check for newly unlocked milestones
        const newlyUnlocked = getNewlyUnlockedMilestones(oldMilestones, newMilestones)
        
        if (newlyUnlocked.length > 0) {
          console.log('[CareerStore] New milestones unlocked:', newlyUnlocked.map(m => formatMilestoneName(m.key)))
          
          // Update the podium streak
          const podiumStreak = calculatePodiumStreak(player.raceHistory)
          
          set({
            careerState: {
              ...careerState,
              rpgState: {
                ...careerState.rpgState,
                milestones: newMilestones,
                recentPodiumStreak: podiumStreak
              }
            }
          })
        }
        
        return newlyUnlocked
      },

      setInjury: (injury: InjuryState) => {
        const { careerState } = get()
        if (!careerState) return
        
        console.log(`[CareerStore] Setting injury: ${injury.severity} - ${injury.type || 'unknown'}`)
        
        set({
          careerState: {
            ...careerState,
            rpgState: {
              ...careerState.rpgState,
              injury
            }
          }
        })
      },

      healInjury: () => {
        const { careerState, player } = get()
        if (!careerState || !careerState.rpgState.injury.injured) return
        
        const injury = careerState.rpgState.injury
        
        // Calculate healing progress based on fitness
        const fitnessModifier = player ? player.stats.fitness / 100 : 0.5
        const healingRate = 0.5 + (fitnessModifier * 0.5) // 0.5 to 1.0 weeks of healing per week
        const weeksHealed = Math.ceil(healingRate)
        
        const newRecoveryWeeks = Math.max(0, injury.recoveryWeeksRemaining - weeksHealed)
        
        if (newRecoveryWeeks <= 0) {
          // Fully healed
          console.log('[CareerStore] Injury healed!')
          set({
            careerState: {
              ...careerState,
              rpgState: {
                ...careerState.rpgState,
                injury: createDefaultInjuryState()
              }
            }
          })
        } else {
          // Still recovering
          set({
            careerState: {
              ...careerState,
              rpgState: {
                ...careerState.rpgState,
                injury: {
                  ...injury,
                  recoveryWeeksRemaining: newRecoveryWeeks
                }
              }
            }
          })
          console.log(`[CareerStore] Injury recovery: ${newRecoveryWeeks} weeks remaining`)
        }
      },

      getAIModifier: () => {
        const { player, careerState } = get()
        if (!player || !careerState) {
          return {
            modifier: 0,
            breakdown: {
              teamDevelopment: 0,
              milestonePerks: 0,
              formBonus: 0,
              injuryPenalty: 0,
              fatiguePenalty: 0,
              pressurePenalty: 0,
              total: 0
            },
            description: 'No active career'
          }
        }
        
        // Update championship position info from rival store
        const rivalStore = useRivalStore.getState()
        const standings = player.currentSeriesId 
          ? rivalStore.getStandings(player.currentSeriesId)
          : []
        const playerFullName = `${player.firstName} ${player.lastName}`
        const playerStanding = standings.find(s => s.isPlayer || s.driverName === playerFullName)
        const leaderStanding = standings[0]
        
        // Get series calendar length
        const currentSeries = player.currentSeriesId 
          ? rivalStore.getSeriesById(player.currentSeriesId)
          : null
        const totalRounds = currentSeries?.calendar?.length || 0
        const completedRounds = player.raceHistory.filter(r => r.seriesId === player.currentSeriesId).length
        
        // Build RPG state with current info
        const rpgState: RPGState = {
          ...careerState.rpgState,
          championshipPosition: playerStanding?.position || 0,
          totalDriversInChampionship: standings.length,
          roundsRemaining: Math.max(0, totalRounds - completedRounds),
          pointsToLeader: playerStanding && leaderStanding 
            ? leaderStanding.points - playerStanding.points 
            : 0,
          recentPodiumStreak: calculatePodiumStreak(player.raceHistory)
        }
        
        return calculateAIModifier(player, rpgState)
      },

      getRPGState: () => {
        const { careerState } = get()
        if (!careerState) return createDefaultRPGState()
        return careerState.rpgState
      },

      isRaceWeek: () => {
        const { player, careerState } = get()
        if (!player || !careerState || !player.currentSeriesId) return false

        const rivalStore = useRivalStore.getState()
        const currentSeries = rivalStore.getSeriesById(player.currentSeriesId)
        if (!currentSeries?.calendar) return false

        return currentSeries.calendar.some(
          event => event.week === careerState.currentWeek
        )
      },

      // ============================================
      // Contract Status & Market Value
      // ============================================

      /**
       * Get the player's current contract status
       * - 'locked': Under contract, not in final year (can only move via buyout)
       * - 'final_year': In final year of contract (can negotiate for next season)
       * - 'free_agent': No contract (can sign immediately)
       */
      getContractStatus: (): ContractStatus => {
        const { player, careerState } = get()
        if (!player?.contract || !careerState) return 'free_agent'
        
        const currentYear = careerState.currentYear
        const yearsRemaining = player.contract.endYear - currentYear
        
        if (yearsRemaining <= 0) return 'free_agent'
        if (yearsRemaining === 1) return 'final_year'
        return 'locked'
      },

      /**
       * Get years remaining on current contract
       */
      getYearsRemaining: (): number => {
        const { player, careerState } = get()
        if (!player?.contract || !careerState) return 0
        
        return Math.max(0, player.contract.endYear - careerState.currentYear)
      },

      /**
       * Calculate the player's current market value based on performance
       * This affects release clause and contract offers
       * Scaled to realistic motorsport transfer values
       */
      calculateMarketValue: (): number => {
        const { player, careerState } = get()
        if (!player || !careerState) return 0
        
        // Base market values by tier (realistic motorsport values)
        const tierBaseValues: Record<string, number> = {
          'entry': 10000,          // Karting - minimal
          'amateur': 50000,        // GT5/Caterham
          'semi-pro': 200000,      // GT4/Carrera Cup
          'professional': 500000,  // GT3 Pro-Am
          'pro': 1000000,          // GT3/LMP2
          'elite': 3000000,        // Factory programs
          'pinnacle': 10000000,    // WEC/LMDh factory
        }
        
        // Get current tier from contract or estimate from reputation
        const rivalStore = useRivalStore.getState()
        const rivalTeamsArray = Array.isArray(rivalStore.teams) ? rivalStore.teams : []
        const currentTeam = player.contract?.teamId 
          ? rivalTeamsArray.find(t => t.id === player.contract!.teamId)
          : null
        
        // Estimate tier from reputation if no contract
        const estimatedTier = player.reputation >= 75 ? 'elite' :
                              player.reputation >= 55 ? 'pro' :
                              player.reputation >= 40 ? 'professional' :
                              player.reputation >= 25 ? 'semi-pro' :
                              player.reputation >= 15 ? 'amateur' : 'entry'
        
        const tier = currentTeam?.tier || estimatedTier
        const baseValue = tierBaseValues[tier] || 50000
        
        // Reputation multiplier (0.5x to 2x based on reputation 0-100)
        const repMultiplier = 0.5 + (player.reputation / 100) * 1.5
        
        // Performance bonus from career results
        const wins = player.totalWins || 0
        const podiums = player.totalPodiums || 0
        const championships = player.championships || 0
        const performanceMultiplier = 1 + (wins * 0.05) + (podiums * 0.02) + (championships * 0.3)
        
        // Career stage multiplier (prime years are most valuable)
        const age = player.age || 25
        let careerStageMultiplier = 1.0
        if (age >= 22 && age <= 30) careerStageMultiplier = 1.2 // Prime years
        else if (age < 22) careerStageMultiplier = 0.85 // Young, unproven
        else if (age > 35) careerStageMultiplier = 0.7 // Veteran discount
        
        // Championship position bonus (if in a series)
        let positionBonus = 0
        if (player.currentSeriesId) {
          const standings = rivalStore.seasonStandings[player.currentSeriesId] || []
          const playerStanding = standings.find(s => 
            s.driverName === `${player.firstName} ${player.lastName}` || s.driverId === player.id
          )
          if (playerStanding) {
            // Position bonus as percentage of base value
            if (playerStanding.position === 1) positionBonus = baseValue * 0.5
            else if (playerStanding.position === 2) positionBonus = baseValue * 0.3
            else if (playerStanding.position === 3) positionBonus = baseValue * 0.15
            else if (playerStanding.position <= 5) positionBonus = baseValue * 0.05
          }
        }
        
        // ============================================
        // MEDIA STAR POWER BONUS (NEW)
        // ============================================
        // High media star power increases marketability and contract leverage
        let mediaStarBonus = 1.0
        if (player.mediaStarPower) {
          const starRating = player.mediaStarPower.starRating || 0
          // Star rating 0-100 gives 1.0x to 1.5x multiplier
          mediaStarBonus = 1.0 + (starRating / 100) * 0.5
          
          // Extra bonus for viral moments (marketability appeal)
          const viralMoments = player.mediaStarPower.viralMoments || 0
          if (viralMoments >= 5) mediaStarBonus += 0.1
          else if (viralMoments >= 2) mediaStarBonus += 0.05
          
          // Beloved/entertainer personalities are more marketable
          if (player.mediaStarPower.mediaPersonality === 'beloved') mediaStarBonus += 0.15
          else if (player.mediaStarPower.mediaPersonality === 'entertainer') mediaStarBonus += 0.1
          
          // High followers bonus (lifestyle sponsors pay premium)
          const followers = player.mediaStarPower.followers || 0
          if (followers >= 500000) mediaStarBonus += 0.2
          else if (followers >= 250000) mediaStarBonus += 0.1
          else if (followers >= 100000) mediaStarBonus += 0.05
        }
        
        const totalValue = Math.round(
          (baseValue * repMultiplier * performanceMultiplier + positionBonus) * careerStageMultiplier * mediaStarBonus
        )
        
        return totalValue
      },

      /**
       * Calculate the current release clause value
       * This is what other teams must pay to sign the player mid-contract
       */
      calculateReleaseClause: (): number => {
        const { player, careerState } = get()
        if (!player?.contract || !careerState) return 0
        
        const marketValue = get().calculateMarketValue()
        const yearsRemaining = get().getYearsRemaining()
        
        // Get tier from current team
        const rivalStore = useRivalStore.getState()
        const currentTeam = player.contract.teamId 
          ? rivalStore.getTeamById(player.contract.teamId)
          : null
        
        // Tier multiplier - higher tier teams demand more
        const tierMultipliers: Record<string, number> = {
          'entry': 0.5,
          'amateur': 0.75,
          'semi-pro': 1.0,
          'professional': 1.25,
          'pro': 1.5,
          'elite': 2.0,
          'pinnacle': 3.0
        }
        const tierMultiplier = tierMultipliers[currentTeam?.tier || 'semi-pro'] || 1.0
        
        // Years remaining multiplier - more years = higher clause
        const yearsMultiplier = 1 + (yearsRemaining * 0.5)
        
        // Calculate release clause
        const releaseClause = Math.round(marketValue * tierMultiplier * yearsMultiplier)
        
        // Minimum clause of $10,000
        return Math.max(10000, releaseClause)
      },

      /**
       * Process a contract buyout - another team pays to release the player
       * @param buyoutAmount - Amount paid by the new team (should match release clause)
       * @param newContract - The new contract being signed
       * @returns true if buyout was successful
       */
      processContractBuyout: (buyoutAmount: number, newContract: Contract): boolean => {
        const { player, careerState } = get()
        if (!player?.contract || !careerState) return false
        
        const releaseClause = get().calculateReleaseClause()
        
        // Buyout must meet or exceed release clause
        if (buyoutAmount < releaseClause) {
          console.log(`[CareerStore] Buyout rejected: $${buyoutAmount} < $${releaseClause} release clause`)
          return false
        }
        
        // Player receives signing bonus (20% of buyout)
        const signingBonus = Math.round(buyoutAmount * 0.2)
        
        // Record the buyout transaction
        get().addTransaction({
          type: 'income',
          category: 'bonus',
          amount: signingBonus,
          description: `Signing bonus from ${newContract.teamName} (contract buyout)`,
          date: new Date(careerState.currentYear, 0, careerState.currentWeek * 7).toISOString(),
          week: careerState.currentWeek,
          year: careerState.currentYear
        })
        
        console.log(`[CareerStore] Contract buyout processed: $${buyoutAmount} clause, $${signingBonus} signing bonus`)
        
        // Clear old contract and set new one
        // The new contract should have the release clause set
        const contractWithClause: Contract = {
          ...newContract,
          clauseValue: get().calculateReleaseClause() // Recalculate for new contract
        }
        
        set({
          player: {
            ...player,
            contract: contractWithClause,
            currentSeriesId: newContract.primarySeriesId,
            currentTeamId: newContract.teamId
          }
        })
        
        return true
      },

      // ============================================
      // Race Weekend Progress
      // ============================================
      
      updateRaceWeekendProgress: (updates: Partial<RaceWeekendProgress>) => {
        const { careerState } = get()
        if (!careerState) return
        
        const currentProgress = careerState.raceWeekendProgress || {
          trackId: '',
          week: careerState.currentWeek,
          year: careerState.currentYear
        }
        
        set({
          careerState: {
            ...careerState,
            raceWeekendProgress: {
              ...currentProgress,
              ...updates,
              // Merge nested session objects properly
              practice: updates.practice 
                ? { ...currentProgress.practice, ...updates.practice }
                : currentProgress.practice,
              qualifying: updates.qualifying
                ? { ...currentProgress.qualifying, ...updates.qualifying }
                : currentProgress.qualifying,
              race: updates.race
                ? { ...currentProgress.race, ...updates.race }
                : currentProgress.race
            }
          }
        })
        
        console.log('[CareerStore] Race weekend progress updated:', updates)
      },
      
      clearRaceWeekendProgress: () => {
        const { careerState } = get()
        if (!careerState) return
        
        set({
          careerState: {
            ...careerState,
            raceWeekendProgress: undefined
          }
        })
        
        console.log('[CareerStore] Race weekend progress cleared')
      },
      
      // ============================================
      // GOAT PROGRESS SYSTEM
      // ============================================
      
      checkAndUnlockMilestones: () => {
        const { player } = get()
        if (!player) return []
        
        const newlyUnlocked: string[] = []
        const currentProgress = player.goatProgress || createDefaultGOATProgress()
        
        // Build player stats object for milestone checking
        // Include ALL stats needed for special conditions
        const playerStats = {
          totalRaces: player.totalRaces,
          totalWins: player.totalWins,
          totalPodiums: player.totalPodiums,
          totalPoles: player.totalPoles,
          totalFastestLaps: player.totalFastestLaps || 0,
          championships: player.championships,
          consecutiveWins: player.consecutiveWins || 0,
          consecutivePodiums: player.consecutivePodiums || 0,
          consecutivePoints: player.consecutivePoints || 0,
          trackHistory: Object.fromEntries(
            Object.entries(player.trackHistory || {}).map(([id, th]) => [
              id, 
              { wins: th.wins, visits: th.visits }
            ])
          ),
          seriesChampionships: player.seriesChampionships || [],
          hatTricks: player.hatTricks || 0,
          grandSlams: player.grandSlams || 0,
          comebackWins: player.comebackWins || 0,
          seasonsCompleted: player.seasonsCompleted || 0,
          perfectSeasons: player.perfectSeasons || 0,
          dnfFreeSeasons: player.dnfFreeSeasons || 0,
          // Special condition stats (these require explicit tracking)
          multiClassWins: player.multiClassWins || 0,
          lastLapWins: player.lastLapWins || 0,
          giantKillerWins: player.giantKillerWins || 0,
          wetRaceWins: player.wetRaceWins || 0,
          nightRaceWins: player.nightRaceWins || 0,
          qualifyingKingSeasons: player.qualifyingKingSeasons || 0,
          cleanSweepSeasons: player.cleanSweepSeasons || 0,
          continentsWonAt: player.continentsWonAt || [],
          categoriesWithChampionships: player.categoriesWithChampionships || []
        }
        
        // Check each milestone AND re-validate existing unlocked ones
        const updatedMilestones = { ...currentProgress.milestones }
        let milestonesReset = 0
        
        for (const milestone of ALL_MILESTONES) {
          const currentStatus = updatedMilestones[milestone.id]
          const conditionMet = checkMilestoneCondition(milestone, playerStats)
          
          // If already unlocked, verify it should still be unlocked
          if (currentStatus === 'unlocked' || currentStatus === 'newly_unlocked') {
            if (!conditionMet) {
              // This milestone was incorrectly unlocked - reset it
              updatedMilestones[milestone.id] = 'locked'
              milestonesReset++
              console.log(`[GOAT] Resetting incorrectly unlocked milestone: ${milestone.name}`)
            }
            continue
          }
          
          // Check if conditions are met for locked milestones
          if (conditionMet) {
            updatedMilestones[milestone.id] = 'newly_unlocked'
            newlyUnlocked.push(milestone.id)
            console.log(`[GOAT] Milestone unlocked: ${milestone.name}`)
          }
        }
        
        if (milestonesReset > 0) {
          console.log(`[GOAT] Reset ${milestonesReset} incorrectly unlocked milestones`)
        }
        
        // Calculate new tier
        const tripleLegsCompleted = Object.values(currentProgress.tripleCrowns).reduce(
          (count, crown) => count + Object.values(crown).filter(Boolean).length, 0
        )
        const newTier = calculateGOATTier(
          player.reputation,
          player.totalWins,
          player.championships,
          tripleLegsCompleted,
          currentProgress.recordsBroken
        )
        
        // Calculate tier progress (considers ALL requirements, not just reputation)
        const tierProgress = calculateTierProgress(newTier.id, {
          reputation: player.reputation,
          totalWins: player.totalWins,
          totalPodiums: player.totalPodiums,
          totalRaces: player.totalRaces,
          championships: player.championships
        })
        
        // Collect earned titles from newly unlocked milestones
        const newTitles: string[] = []
        for (const milestoneId of newlyUnlocked) {
          const milestone = getMilestoneById(milestoneId)
          if (milestone?.rewards?.unlockTitle) {
            newTitles.push(milestone.rewards.unlockTitle)
          }
        }
        
        // Update player with new GOAT progress
        set({
          player: {
            ...player,
            goatProgress: {
              ...currentProgress,
              currentTier: newTier.id,
              tierProgress,
              milestones: updatedMilestones,
              newlyUnlocked,
              totalMilestonesUnlocked: Object.values(updatedMilestones).filter(
                s => s === 'unlocked' || s === 'newly_unlocked'
              ).length,
              legendaryMilestonesUnlocked: ALL_MILESTONES.filter(
                m => m.rarity === 'legendary' && 
                (updatedMilestones[m.id] === 'unlocked' || updatedMilestones[m.id] === 'newly_unlocked')
              ).length,
              earnedTitles: [...(currentProgress.earnedTitles || []), ...newTitles]
            }
          }
        })
        
        return newlyUnlocked
      },
      
      updateGOATProgress: () => {
        const { player, careerState } = get()
        if (!player || !careerState) {
          return { newMilestones: [], newTripleCrownLegs: [], newRecordsBroken: [] }
        }
        
        const results = {
          newMilestones: [] as string[],
          newTripleCrownLegs: [] as string[],
          newRecordsBroken: [] as string[]
        }
        
        // Check milestones
        results.newMilestones = get().checkAndUnlockMilestones()
        
        // Get updated player after milestone check
        const updatedPlayer = get().player
        if (!updatedPlayer) return results
        
        const currentProgress = updatedPlayer.goatProgress || createDefaultGOATProgress()
        const updatedTripleCrowns = { ...currentProgress.tripleCrowns }
        const updatedRecordProgress = { ...currentProgress.recordProgress }
        
        // Check Triple Crown legs
        for (const crown of TRIPLE_CROWNS) {
          if (!updatedTripleCrowns[crown.id]) {
            updatedTripleCrowns[crown.id] = {}
          }
          
          for (const leg of crown.legs) {
            // Skip already completed legs
            if (updatedTripleCrowns[crown.id][leg.id]) continue
            
            let legCompleted = false
            
            if (leg.eventType === 'race' && leg.trackId !== '*') {
              // Check for race win at specific track
              const trackHistory = updatedPlayer.trackHistory?.[leg.trackId]
              if (trackHistory && trackHistory.wins > 0) {
                // Check if any of the valid series match
                if (leg.seriesIds.includes('*') || 
                    trackHistory.seriesRacedHere?.some(s => leg.seriesIds.includes(s))) {
                  legCompleted = true
                }
              }
            } else if (leg.eventType === 'championship') {
              // Check for series championship
              const playerChampionships = updatedPlayer.seriesChampionships || []
              if (leg.seriesIds.some(s => playerChampionships.includes(s))) {
                legCompleted = true
              }
            }
            
            if (legCompleted) {
              updatedTripleCrowns[crown.id][leg.id] = true
              results.newTripleCrownLegs.push(`${crown.id}:${leg.id}`)
              console.log(`[GOAT] Triple Crown leg completed: ${crown.name} - ${leg.name}`)
            }
          }
        }
        
        // Check for completed Triple Crowns
        const completedCrowns: string[] = [...(currentProgress.completedCrowns || [])]
        for (const crown of TRIPLE_CROWNS) {
          if (completedCrowns.includes(crown.id)) continue
          
          const allLegsCompleted = crown.legs.every(
            leg => updatedTripleCrowns[crown.id]?.[leg.id]
          )
          
          if (allLegsCompleted) {
            completedCrowns.push(crown.id)
            console.log(`[GOAT] TRIPLE CROWN COMPLETED: ${crown.name}!`)
          }
        }
        
        // Check Historical Records
        for (const record of HISTORICAL_RECORDS) {
          const currentRecordProgress = updatedRecordProgress[record.id]
          if (!currentRecordProgress || currentRecordProgress.beaten) continue
          
          // Get current player value based on record path
          let currentValue = 0
          
          if (record.yourValuePath.startsWith('trackHistory.')) {
            // Track-specific record
            const parts = record.yourValuePath.split('.')
            const trackId = parts[1]
            const stat = parts[2] as 'wins' | 'visits'
            currentValue = updatedPlayer.trackHistory?.[trackId]?.[stat] || 0
          } else {
            // Direct player stat
            const statKey = record.yourValuePath as keyof typeof updatedPlayer
            currentValue = (updatedPlayer[statKey] as number) || 0
          }
          
          // Update progress
          updatedRecordProgress[record.id] = {
            ...currentRecordProgress,
            currentValue
          }
          
          // Check if record is beaten
          if (currentValue > record.recordValue && !currentRecordProgress.beaten) {
            updatedRecordProgress[record.id].beaten = true
            updatedRecordProgress[record.id].beatenDate = new Date().toISOString()
            results.newRecordsBroken.push(record.id)
            console.log(`[GOAT] RECORD BROKEN: ${record.name}! ${currentValue} > ${record.recordValue}`)
          }
        }
        
        // Calculate records broken count
        const recordsBroken = Object.values(updatedRecordProgress).filter(r => r.beaten).length
        
        // Collect titles from completed crowns
        const crownTitles = completedCrowns
          .filter(id => !currentProgress.completedCrowns?.includes(id))
          .map(id => TRIPLE_CROWNS.find(c => c.id === id)?.rewards.unlockTitle)
          .filter(Boolean) as string[]
        
        // Collect titles from broken records
        const recordTitles = results.newRecordsBroken
          .map(id => HISTORICAL_RECORDS.find(r => r.id === id)?.beatReward.unlockTitle)
          .filter(Boolean) as string[]
        
        // Recalculate tier with updated data
        const tripleLegsCompleted = Object.values(updatedTripleCrowns).reduce(
          (count, crown) => count + Object.values(crown).filter(Boolean).length, 0
        )
        const newTier = calculateGOATTier(
          updatedPlayer.reputation,
          updatedPlayer.totalWins,
          updatedPlayer.championships,
          tripleLegsCompleted,
          recordsBroken
        )
        const tierProgress = calculateTierProgress(newTier.id, {
          reputation: updatedPlayer.reputation,
          totalWins: updatedPlayer.totalWins,
          totalPodiums: updatedPlayer.totalPodiums,
          totalRaces: updatedPlayer.totalRaces,
          championships: updatedPlayer.championships
        })
        
        // Update player with complete GOAT progress
        set({
          player: {
            ...updatedPlayer,
            goatProgress: {
              ...updatedPlayer.goatProgress,
              currentTier: newTier.id,
              tierProgress,
              tripleCrowns: updatedTripleCrowns,
              completedCrowns,
              recordProgress: updatedRecordProgress,
              recordsBroken,
              earnedTitles: [
                ...(updatedPlayer.goatProgress?.earnedTitles || []),
                ...crownTitles,
                ...recordTitles
              ]
            }
          }
        })
        
        return results
      },
      
      // Media Star Power System
      updateMediaStarPower: (updates: Partial<MediaStarPower>) => {
        const { player } = get()
        if (player) {
          const updatedStarPower = { ...player.mediaStarPower, ...updates }
          // Recalculate star rating
          updatedStarPower.starRating = calculateMediaStarRating(
            updatedStarPower.followers,
            updatedStarPower.engagementRate,
            updatedStarPower.viralMoments,
            updatedStarPower.mediaPersonality
          )
          set({
            player: {
              ...player,
              mediaStarPower: updatedStarPower
            }
          })
        }
      },
      
      syncMediaStarPower: () => {
        const { player, careerState } = get()
        if (!player || !careerState) return
        
        // Sync from socialMediaState to mediaStarPower with null safety
        const socialState = careerState.socialMediaState || createDefaultSocialMediaState('pro', 50)
        const mediaPersona = careerState.mediaPersona || createDefaultMediaPersona()
        
        // Determine media personality from persona data with null safety
        const newPersonality = determineMediaPersonality(
          mediaPersona.toneHistory || {},
          mediaPersona.controversyLevel || 0,
          mediaPersona.publicPerception || 50
        )
        
        const updatedStarPower: MediaStarPower = {
          followers: socialState.followerCount || 0,
          engagementRate: socialState.engagementRate || 3,
          viralMoments: socialState.viralPosts || 0,
          mediaPersonality: newPersonality,
          starRating: calculateMediaStarRating(
            socialState.followerCount || 0,
            socialState.engagementRate || 3,
            socialState.viralPosts || 0,
            newPersonality
          )
        }
        
        set({
          player: {
            ...player,
            mediaStarPower: updatedStarPower
          }
        })
      },

      // ============================================
      // INVITATIONAL EVENTS SYSTEM
      // ============================================
      
      generateInvitation: () => {
        const { player, careerState } = get()
        if (!player || !careerState) return null
        
        // Get player context
        const manufacturerId = player.contract?.manufacturerId
        const sponsorIds = player.finances.sponsorDeals
          .filter(s => s.active)
          .map(s => s.id)
        const nationality = player.nationality
        
        // Get eligible templates based on player's status (with frequency checking)
        const eligibleTemplates = getEligibleEventTemplates(
          player.reputation,
          manufacturerId,
          sponsorIds,
          nationality,
          careerState.currentYear,
          careerState.eventsUsedThisYear || [],
          careerState.eventHistory || []
        )
        
        if (eligibleTemplates.length === 0) {
          console.log('[Invitational] No eligible event templates for player')
          return null
        }
        
        // Select a template weighted by player reputation
        const template = selectEventTemplate(eligibleTemplates, player.reputation)
        if (!template) return null
        
        // Find a suitable gap week (2+ weeks after current week, before next race)
        const currentSeries = player.currentSeriesId
          ? useRivalStore.getState().getSeriesById(player.currentSeriesId)
          : null
        
        let eventWeek = careerState.currentWeek + 2 // Minimum 2 weeks from now
        
        if (currentSeries?.calendar) {
          // Find the next race week
          const nextRace = currentSeries.calendar.find(r => r.week > careerState.currentWeek)
          const nextRaceWeek = nextRace?.week || 52
          
          // Place the invitational in a gap week
          if (eventWeek >= nextRaceWeek) {
            // No room before next race - try to find a gap after
            const raceAfterNext = currentSeries.calendar.find(r => r.week > nextRaceWeek)
            if (raceAfterNext && raceAfterNext.week - nextRaceWeek >= 3) {
              eventWeek = nextRaceWeek + 1
            } else {
              console.log('[Invitational] No suitable gap week found')
              return null
            }
          }
        }
        
        // Generate the event instance
        const event = generateInvitationalEvent(template, eventWeek, careerState.currentYear)
        
        // Generate email for invitation
        const invitationEmail = generateInvitationEmail(event, careerState)
        
        // Add to pending invitations and track used event
        set({
          careerState: {
            ...careerState,
            pendingInvitations: [...careerState.pendingInvitations, event],
            invitationsThisSeason: careerState.invitationsThisSeason + 1,
            eventsUsedThisYear: [...(careerState.eventsUsedThisYear || []), template.id],
            emails: [{ ...invitationEmail, id: `email_inv_${event.instanceId}` }, ...(careerState.emails || [])]
          }
        })
        
        console.log(`[Invitational] Generated invitation: ${event.name} at ${event.trackName} (Week ${event.week})`)
        console.log(`[Invitational] Assigned: #${event.assignedCar.liveryNumber} ${event.assignedCar.liveryName}`)
        return event
      },

      acceptInvitation: (invitationId: string) => {
        const { careerState, player } = get()
        if (!careerState || !player) return
        
        // Handle older saves that don't have these arrays
        const pendingInvitations = careerState.pendingInvitations || []
        const acceptedInvitations = careerState.acceptedInvitations || []
        
        const invitation = pendingInvitations.find(i => i.instanceId === invitationId)
        if (!invitation) {
          console.warn(`[Invitational] Invitation not found: ${invitationId}`)
          return
        }
        
        // Move from pending to accepted
        const updatedInvitation: InvitationalEvent = {
          ...invitation,
          status: 'accepted'
        }
        
        set({
          careerState: {
            ...careerState,
            pendingInvitations: pendingInvitations.filter(i => i.instanceId !== invitationId),
            acceptedInvitations: [...acceptedInvitations, updatedInvitation]
          }
        })
        
        console.log(`[Invitational] Accepted invitation: ${invitation.name}`)
      },

      declineInvitation: (invitationId: string) => {
        const { careerState, player } = get()
        if (!careerState || !player) {
          return { reputationPenalty: 0, organizerPenalty: 0, message: 'No active career' }
        }
        
        // Handle older saves that don't have these arrays
        const pendingInvitations = careerState.pendingInvitations || []
        
        const invitation = pendingInvitations.find(i => i.instanceId === invitationId)
        if (!invitation) {
          return { reputationPenalty: 0, organizerPenalty: 0, message: 'Invitation not found' }
        }
        
        // Apply consequences
        const { reputationPenalty, organizerRelationPenalty, description } = invitation.declineConsequences
        
        // Update player reputation
        const newReputation = Math.max(0, player.reputation - reputationPenalty)
        
        // Track decline
        set({
          player: {
            ...player,
            reputation: newReputation
          },
          careerState: {
            ...careerState,
            pendingInvitations: pendingInvitations.filter(i => i.instanceId !== invitationId),
            declinedInvitationsThisSeason: (careerState.declinedInvitationsThisSeason || 0) + 1
          }
        })
        
        console.log(`[Invitational] Declined invitation: ${invitation.name} - ${description}`)
        
        return {
          reputationPenalty,
          organizerPenalty: organizerRelationPenalty,
          message: description
        }
      },

      completeInvitation: (invitationId: string, position: number) => {
        const { careerState, player } = get()
        if (!careerState || !player) {
          return { prize: 0, reputationGained: 0 }
        }
        
        // Handle older saves that don't have acceptedInvitations
        const acceptedInvitations = careerState.acceptedInvitations || []
        const invitation = acceptedInvitations.find(i => i.instanceId === invitationId)
        if (!invitation) {
          console.warn(`[Invitational] Accepted invitation not found: ${invitationId}`)
          return { prize: 0, reputationGained: 0 }
        }
        
        // Calculate rewards based on position
        const positionMultiplier = position === 1 ? 1.5 : position <= 3 ? 1.2 : position <= 5 ? 1.0 : 0.5
        const prize = Math.floor(invitation.rewards.prize * positionMultiplier)
        const reputationGained = Math.floor(invitation.rewards.reputationBonus * positionMultiplier)
        
        // Update invitation with result
        const completedInvitation: InvitationalEvent = {
          ...invitation,
          status: 'completed',
          result: {
            position,
            prize,
            reputationGained
          }
        }
        
        // Add prize money transaction
        const newTransactions = [...player.finances.transactions, {
          id: `inv_prize_${invitationId}_${Date.now()}`,
          date: new Date().toISOString(),
          week: careerState.currentWeek,
          year: careerState.currentYear,
          type: 'income' as const,
          category: 'prize' as const,
          amount: prize,
          description: `${invitation.name} - P${position} Prize`
        }]
        
        // Add to event history for biennial/quadrennial tracking
        const newEventHistory = [...(careerState.eventHistory || []), {
          templateId: invitation.id,
          year: careerState.currentYear
        }]
        
        set({
          player: {
            ...player,
            reputation: Math.min(100, player.reputation + reputationGained),
            finances: {
              ...player.finances,
              bankBalance: player.finances.bankBalance + prize,
              transactions: newTransactions
            }
          },
          careerState: {
            ...careerState,
            acceptedInvitations: acceptedInvitations.filter(i => i.instanceId !== invitationId),
            completedInvitations: [...(careerState.completedInvitations || []), completedInvitation],
            eventHistory: newEventHistory
          }
        })
        
        console.log(`[Invitational] Completed ${invitation.name}: P${position}, Prize: $${prize}, Rep: +${reputationGained}`)
        console.log(`[Invitational] Car: #${invitation.assignedCar.liveryNumber} ${invitation.assignedCar.liveryName}`)
        
        return { prize, reputationGained }
      },

      getPendingInvitations: () => {
        const { careerState } = get()
        // Handle older saves that don't have pendingInvitations
        return careerState?.pendingInvitations || []
      },

      getAcceptedInvitations: () => {
        const { careerState } = get()
        // Handle older saves that don't have acceptedInvitations
        return careerState?.acceptedInvitations || []
      },

      getCurrentInvitationalEvent: () => {
        const { careerState } = get()
        if (!careerState) return null
        
        // Handle older saves that don't have acceptedInvitations
        const acceptedInvitations = careerState.acceptedInvitations || []
        // Find an accepted invitation for the current week
        return acceptedInvitations.find(i => i.week === careerState.currentWeek) || null
      },

      isInvitationalWeek: () => {
        const { careerState } = get()
        if (!careerState) return false
        
        // Handle older saves that don't have acceptedInvitations
        const acceptedInvitations = careerState.acceptedInvitations || []
        return acceptedInvitations.some(i => i.week === careerState.currentWeek)
      },
      
      // ============================================
      // TEAM OPPORTUNITIES SYSTEM
      // Non-racing opportunities (media, manufacturer, special events)
      // ============================================
      
      acceptOpportunity: (opportunityId: string, scheduledWeek: number, scheduledDay: number) => {
        const { careerState, player } = get()
        if (!careerState || !player) return null
        
        const pendingOpportunities = careerState.pendingOpportunities || []
        const opportunity = pendingOpportunities.find(o => o.instanceId === opportunityId)
        
        if (!opportunity) {
          console.warn(`[Opportunities] Opportunity not found: ${opportunityId}`)
          return null
        }
        
        // Accept the opportunity with scheduling
        const acceptedOpportunity = acceptOpportunityFn(opportunity, scheduledWeek, scheduledDay)
        
        // Create a scheduled activity for this opportunity
        const activityId = `opp_${opportunity.instanceId}`
        const scheduledActivity: ScheduledActivity = {
          id: activityId,
          templateId: opportunity.id,
          name: opportunity.name,
          description: opportunity.description,
          category: opportunity.category === 'media_appearance' ? 'media' 
            : opportunity.category === 'manufacturer_program' ? 'development'
            : 'sponsor',
          scheduledWeek,
          scheduledDay,
          duration: opportunity.duration,
          spanDays: opportunity.durationDays,
          status: 'scheduled',
          requiredCash: 0, // Opportunities don't cost money to attend
          effectsOnComplete: {
            reputation: opportunity.rewards.reputation,
            cash: opportunity.rewards.cash,
            fanSentiment: opportunity.rewards.fanSentiment,
            sponsorSatisfaction: opportunity.rewards.sponsorSatisfaction
          },
          effectsOnMiss: {
            reputation: -(opportunity.consequences.reputationLoss || 0),
            fanSentiment: -(opportunity.consequences.fanSentimentLoss || 0)
          },
          // Store opportunity reference for completion
          opportunityId: opportunity.instanceId
        }
        
        set({
          careerState: {
            ...careerState,
            pendingOpportunities: pendingOpportunities.filter(o => o.instanceId !== opportunityId),
            acceptedOpportunities: [...(careerState.acceptedOpportunities || []), acceptedOpportunity],
            acceptedOpportunitiesThisSeason: [...(careerState.acceptedOpportunitiesThisSeason || []), opportunity.id],
            scheduledActivities: [...(careerState.scheduledActivities || []), scheduledActivity]
          }
        })
        
        console.log(`[Opportunities] Accepted: ${opportunity.name} - Scheduled for Week ${scheduledWeek}, Day ${scheduledDay}`)
        
        // === NOTIFICATION INTEGRATION ===
        routeNotification({
          category: opportunity.category === 'media_appearance' ? 'media_pr' : opportunity.category === 'manufacturer_program' ? 'technical' : 'sponsor',
          subject: `Opportunity Accepted: ${opportunity.name}`,
          body: `You've accepted "${opportunity.name}" and it has been scheduled for Week ${scheduledWeek}, Day ${scheduledDay}.\n\nDuration: ${opportunity.duration} hour(s)\n${opportunity.rewards.cash ? `Payment: $${opportunity.rewards.cash.toLocaleString()}` : ''}`,
          emailCategory: opportunity.category === 'media_appearance' ? 'media' : 'team'
        })

        return acceptedOpportunity
      },
      
      declineOpportunity: (opportunityId: string) => {
        const { careerState, player } = get()
        if (!careerState || !player) {
          return { success: false, consequences: null }
        }
        
        const pendingOpportunities = careerState.pendingOpportunities || []
        const opportunity = pendingOpportunities.find(o => o.instanceId === opportunityId)
        
        if (!opportunity) {
          console.warn(`[Opportunities] Opportunity not found: ${opportunityId}`)
          return { success: false, consequences: null }
        }
        
        // Get decline consequences
        const consequences = opportunity.consequences
        
        // Apply reputation loss
        let newReputation = player.reputation
        if (consequences.reputationLoss) {
          newReputation = Math.max(0, player.reputation - consequences.reputationLoss)
        }
        
        // Apply relationship loss if applicable
        let updatedManufacturerRelationships = { ...careerState.manufacturerRelationships }
        if (consequences.relationshipLoss?.type === 'manufacturer' && consequences.relationshipLoss.id) {
          const currentRel = updatedManufacturerRelationships[consequences.relationshipLoss.id]
          if (currentRel) {
            updatedManufacturerRelationships[consequences.relationshipLoss.id] = {
              ...currentRel,
              favor: Math.max(0, currentRel.favor - consequences.relationshipLoss.amount)
            }
          }
        }
        
        // Apply fan sentiment loss
        let updatedTeamMediaState = careerState.teamMediaState
        if (consequences.fanSentimentLoss && updatedTeamMediaState) {
          updatedTeamMediaState = {
            ...updatedTeamMediaState,
            fanSentiment: Math.max(0, updatedTeamMediaState.fanSentiment - consequences.fanSentimentLoss)
          }
        }
        
        set({
          player: {
            ...player,
            reputation: newReputation
          },
          careerState: {
            ...careerState,
            pendingOpportunities: pendingOpportunities.filter(o => o.instanceId !== opportunityId),
            declinedOpportunitiesThisSeason: [...(careerState.declinedOpportunitiesThisSeason || []), opportunity.id],
            manufacturerRelationships: updatedManufacturerRelationships,
            teamMediaState: updatedTeamMediaState
          }
        })
        
        console.log(`[Opportunities] Declined: ${opportunity.name}`)
        if (consequences.reputationLoss) {
          console.log(`[Opportunities] Reputation -${consequences.reputationLoss}`)
        }
        
        return { success: true, consequences }
      },
      
      completeOpportunityEvent: (opportunityId: string, performanceMultiplier: number = 1.0) => {
        const { careerState, player } = get()
        if (!careerState || !player) {
          return { success: false, rewards: null }
        }
        
        const acceptedOpportunities = careerState.acceptedOpportunities || []
        const opportunity = acceptedOpportunities.find(o => o.instanceId === opportunityId)
        
        if (!opportunity) {
          console.warn(`[Opportunities] Accepted opportunity not found: ${opportunityId}`)
          return { success: false, rewards: null }
        }
        
        // Complete the opportunity
        const completedOpp = completeOpportunity(opportunity, performanceMultiplier)
        const rewards = completedOpp.result?.actualRewards
        
        if (!rewards) {
          return { success: false, rewards: null }
        }
        
        // Apply rewards
        let newReputation = player.reputation
        if (rewards.reputation) {
          newReputation = Math.min(100, player.reputation + rewards.reputation)
        }
        
        let newBalance = player.finances.bankBalance
        const newTransactions = [...player.finances.transactions]
        if (rewards.cash) {
          newBalance += rewards.cash
          newTransactions.push({
            id: `tx_opp_${opportunityId}_${Date.now()}`,
            date: new Date().toISOString(),
            week: careerState.currentWeek,
            year: careerState.currentYear,
            type: 'income',
            category: 'bonus',
            amount: rewards.cash,
            description: `${opportunity.name} - Appearance fee`
          })
        }
        
        // Apply manufacturer favor boost
        let updatedManufacturerRelationships = { ...careerState.manufacturerRelationships }
        if (rewards.manufacturerFavor && opportunity.conditions?.requiresManufacturer?.[0]) {
          const manufacturerId = opportunity.conditions.requiresManufacturer[0]
          const currentRel = updatedManufacturerRelationships[manufacturerId] || {
            favor: 0,
            totalPurchases: 0,
            totalSpent: 0,
            lastInteractionWeek: careerState.currentWeek,
            lastInteractionYear: careerState.currentYear
          }
          updatedManufacturerRelationships[manufacturerId] = {
            ...currentRel,
            favor: Math.min(100, currentRel.favor + rewards.manufacturerFavor),
            lastInteractionWeek: careerState.currentWeek,
            lastInteractionYear: careerState.currentYear
          }
        }
        
        // Apply fan sentiment boost
        let updatedTeamMediaState = careerState.teamMediaState
        if (rewards.fanSentiment && updatedTeamMediaState) {
          updatedTeamMediaState = {
            ...updatedTeamMediaState,
            fanSentiment: Math.min(100, updatedTeamMediaState.fanSentiment + rewards.fanSentiment)
          }
        }
        
        set({
          player: {
            ...player,
            reputation: newReputation,
            finances: {
              ...player.finances,
              bankBalance: newBalance,
              transactions: newTransactions
            }
          },
          careerState: {
            ...careerState,
            acceptedOpportunities: acceptedOpportunities.filter(o => o.instanceId !== opportunityId),
            completedOpportunities: [...(careerState.completedOpportunities || []), completedOpp],
            manufacturerRelationships: updatedManufacturerRelationships,
            teamMediaState: updatedTeamMediaState
          }
        })
        
        console.log(`[Opportunities] Completed: ${opportunity.name}`)
        console.log(`[Opportunities] Rewards: Rep +${rewards.reputation || 0}, Cash +$${rewards.cash || 0}`)
        
        return { success: true, rewards }
      },
      
      getPendingOpportunities: () => {
        const { careerState } = get()
        return careerState?.pendingOpportunities || []
      },
      
      getAcceptedOpportunities: () => {
        const { careerState } = get()
        return careerState?.acceptedOpportunities || []
      },
      
      // ============================================
      // SCHEDULED ACTIVITIES SYSTEM
      // ============================================
      
      scheduleActivity: (templateId: string, week: number, day: number, sponsorId?: string) => {
        const { careerState, player } = get()
        if (!careerState || !player) return null
        
        const template = ACTIVITY_TEMPLATES.find(t => t.id === templateId)
        if (!template) {
          console.warn(`[Activities] Template not found: ${templateId}`)
          return null
        }
        
        // Check reputation requirement
        if (template.minReputation && player.reputation < template.minReputation) {
          console.warn(`[Activities] Insufficient reputation for ${templateId}`)
          return null
        }
        
        // Check if already scheduled at same time
        const existingActivities = careerState.scheduledActivities || []
        const hasSameTimeConflict = existingActivities.some(
          a => a.scheduledWeek === week && a.scheduledDay === day && a.status === 'scheduled'
        )
        if (hasSameTimeConflict) {
          console.warn(`[Activities] Time conflict for week ${week} day ${day}`)
          return null
        }
        
        // Check for driver/owner scheduling conflicts
        const { checkScheduleConflict } = get()
        const conflictCheck = checkScheduleConflict(
          week, 
          day, 
          template.requiresDriver ?? true, 
          !template.requiresDriver // If doesn't require driver, treat as owner-only
        )
        
        if (conflictCheck.hasConflict) {
          console.warn(`[Activities] Driver/Owner conflict detected:`, {
            type: conflictCheck.conflictType,
            conflicting: conflictCheck.conflictingActivities.map(a => a.name),
            canResolve: conflictCheck.canResolveWithReserve
          })
          // Still allow scheduling but log warning - UI should handle displaying this to user
        }
        
        // Check cooldown
        if (template.cooldownWeeks) {
          const recentSame = [...existingActivities, ...(careerState.activityHistory || [])]
            .filter(a => a.templateId === templateId && a.status === 'completed')
            .sort((a, b) => (b.completedWeek || 0) - (a.completedWeek || 0))[0]
          
          if (recentSame && (careerState.currentWeek - (recentSame.completedWeek || 0)) < template.cooldownWeeks) {
            console.warn(`[Activities] Cooldown not met for ${templateId}`)
            return null
          }
        }
        
        // Check max per season
        if (template.maxPerSeason) {
          const thisSeasonCount = [...existingActivities, ...(careerState.activityHistory || [])]
            .filter(a => a.templateId === templateId && a.status === 'completed')
            .length
          
          if (thisSeasonCount >= template.maxPerSeason) {
            console.warn(`[Activities] Max per season reached for ${templateId}`)
            return null
          }
        }
        
        // Calculate span days and reschedule cost
        const spanDays = template.spanDays || 1
        const rescheduleCost = template.baseCost > 0 
          ? Math.floor(template.baseCost * ((template.rescheduleCostPercent || 25) / 100))
          : 0
        
        // Check if multi-day activity would overflow the week
        if (day + spanDays - 1 > 7) {
          console.warn(`[Activities] Activity would span beyond the week`)
          return null
        }
        
        // Check for conflicts across all days the activity would span
        for (let d = day; d < day + spanDays; d++) {
          const conflictOnDay = existingActivities.some(a => {
            const aSpan = a.spanDays || 1
            const aStartDay = a.scheduledDay
            const aEndDay = aStartDay + aSpan - 1
            return a.scheduledWeek === week && 
                   a.status === 'scheduled' &&
                   d >= aStartDay && d <= aEndDay
          })
          if (conflictOnDay) {
            console.warn(`[Activities] Day ${d} is blocked by another activity`)
            return null
          }
        }
        
        // Create the activity
        const activity: ScheduledActivity = {
          id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          templateId,
          name: template.name,
          description: template.description,
          category: template.category,
          budgetCategory: template.budgetCategory || 'operations',
          scheduledWeek: week,
          scheduledDay: day,
          duration: template.duration,
          spanDays,
          status: 'scheduled',
          effectsOnComplete: { ...template.defaultEffectsOnComplete },
          effectsOnMiss: { ...template.defaultEffectsOnMiss },
          requiredCash: template.baseCost > 0 ? template.baseCost : undefined,
          requiredStaffRole: template.requiresStaffRole,
          requiresDriver: template.requiresDriver ?? true,
          sponsorId,
          canReschedule: true,
          rescheduleCost,
          timesRescheduled: 0
        }
        
        // Add to scheduled activities
        set({
          careerState: {
            ...careerState,
            scheduledActivities: [...existingActivities, activity]
          }
        })
        
        console.log(`[Activities] Scheduled: ${activity.name} for Week ${week} Day ${day}`)
        return activity
      },
      
      cancelActivity: (activityId: string) => {
        const { careerState } = get()
        if (!careerState) return false
        
        const activities = careerState.scheduledActivities || []
        const activity = activities.find(a => a.id === activityId)
        
        if (!activity || activity.mandatory) {
          console.warn(`[Activities] Cannot cancel: ${activityId}`)
          return false
        }
        
        // Remove from scheduled
        set({
          careerState: {
            ...careerState,
            scheduledActivities: activities.filter(a => a.id !== activityId)
          }
        })
        
        console.log(`[Activities] Cancelled: ${activity.name}`)
        return true
      },
      
      rescheduleActivity: (activityId: string, newWeek: number, newDay: number) => {
        const { careerState, player } = get()
        if (!careerState) return false
        
        const activities = careerState.scheduledActivities || []
        const activity = activities.find(a => a.id === activityId)
        
        if (!activity || !activity.canReschedule) {
          console.warn(`[Activities] Cannot reschedule: ${activityId}`)
          return false
        }
        
        // Check deadline
        if (activity.rescheduleDeadline && newWeek > activity.rescheduleDeadline) {
          console.warn(`[Activities] Past reschedule deadline for: ${activityId}`)
          return false
        }
        
        const spanDays = activity.spanDays || 1
        
        // Check if activity would overflow the week
        if (newDay + spanDays - 1 > 7) {
          console.warn(`[Activities] Activity would span beyond the week`)
          return false
        }
        
        // Check for conflicts across all days the activity would span
        for (let d = newDay; d < newDay + spanDays; d++) {
          const conflictOnDay = activities.some(a => {
            if (a.id === activityId) return false // Skip self
            const aSpan = a.spanDays || 1
            const aStartDay = a.scheduledDay
            const aEndDay = aStartDay + aSpan - 1
            return a.scheduledWeek === newWeek && 
                   a.status === 'scheduled' &&
                   d >= aStartDay && d <= aEndDay
          })
          if (conflictOnDay) {
            console.warn(`[Activities] Day ${d} is blocked by another activity`)
            return false
          }
        }
        
        // Check for driver/owner conflicts
        const { checkScheduleConflict } = get()
        const conflictCheck = checkScheduleConflict(
          newWeek, 
          newDay, 
          activity.requiresDriver, 
          activity.requiresOwner
        )
        
        if (conflictCheck.hasConflict) {
          console.warn(`[Activities] Driver/Owner conflict for reschedule:`, {
            type: conflictCheck.conflictType,
            conflicting: conflictCheck.conflictingActivities.map(a => a.name)
          })
        }
        
        // Calculate reschedule cost (increases with each reschedule)
        const baseRescheduleCost = activity.rescheduleCost || 0
        const timesRescheduled = activity.timesRescheduled || 0
        const rescheduleCost = Math.floor(baseRescheduleCost * (1 + timesRescheduled * 0.5)) // 50% more each time
        
        // Check if can afford reschedule cost (soft enforcement - warn but allow)
        const ownedTeam = careerState.ownedTeam
        
        // Deduct reschedule cost from appropriate budget category
        let updatedCareerState = { ...careerState }
        if (rescheduleCost > 0 && ownedTeam) {
          const budgetCategory = activity.budgetCategory || 'operations'
          const currentBudgets = ownedTeam.budgets
          const currentOverspends = currentBudgets.budgetOverspends || {
            development: 0,
            marketing: 0,
            travel: 0,
            contingency: 0,
            operations: 0
          }
          
          // Map budget category to budget field
          const budgetFieldMap: Record<string, keyof typeof currentBudgets> = {
            development: 'developmentBudget',
            marketing: 'marketingBudget',
            travel: 'travelBudget',
            contingency: 'contingencyBudget',
            operations: 'cash',
            personal: 'cash'
          }
          
          const budgetField = budgetFieldMap[budgetCategory] || 'cash'
          const currentBudgetValue = (currentBudgets[budgetField] as number) || 0
          const newBudgetValue = currentBudgetValue - rescheduleCost
          
          // Track overspending if budget goes negative
          const overspendAmount = newBudgetValue < 0 ? Math.abs(newBudgetValue) : 0
          const wasAlreadyOverspent = currentOverspends[budgetCategory as keyof typeof currentOverspends] || 0
          const newOverspendAmount = overspendAmount > 0 
            ? Math.max(overspendAmount, wasAlreadyOverspent)
            : wasAlreadyOverspent
          
          const updatedOverspends = {
            ...currentOverspends,
            [budgetCategory]: newOverspendAmount
          }
          
          if (newBudgetValue < 0 && !wasAlreadyOverspent) {
            console.warn(`[Activities] Reschedule cost overspends ${budgetCategory} budget by $${Math.abs(newBudgetValue).toLocaleString()}`)
            
            // Send budget warning email for reschedule-caused overspend
            const budgetCategoryNames: Record<string, string> = {
              development: 'Development & R&D',
              marketing: 'Marketing & PR',
              travel: 'Travel & Logistics',
              contingency: 'Contingency Reserve',
              operations: 'Operations',
              personal: 'Personal'
            }
            const categoryName = budgetCategoryNames[budgetCategory] || budgetCategory
            
            routeNotification({
              category: 'finances',
              subject: `Budget Warning: ${categoryName} Overspent`,
              body: `**BUDGET ALERT**\n\nYour **${categoryName}** budget has exceeded its allocation due to rescheduling costs.\n\n**Current Deficit:** $${Math.abs(newBudgetValue).toLocaleString()}\n**Activity Rescheduled:** ${activity.name}\n**Reschedule Fee:** $${rescheduleCost.toLocaleString()}\n\nFrequent rescheduling increases costs. Consider:\n- Better advance planning to avoid rescheduling\n- Reallocating funds from other budget categories\n- Reducing activity scope to lower costs`,
              emailCategory: 'team',
              urgency: 'high'
            })
          }
          
          updatedCareerState = {
            ...updatedCareerState,
            ownedTeam: {
              ...ownedTeam,
              budgets: {
                ...ownedTeam.budgets,
                [budgetField]: newBudgetValue,
                budgetOverspends: updatedOverspends,
                yearToDateExpenses: (ownedTeam.budgets.yearToDateExpenses || 0) + rescheduleCost
              }
            }
          }
        }
        
        // Update activity
        set({
          careerState: {
            ...updatedCareerState,
            scheduledActivities: activities.map(a => 
              a.id === activityId 
                ? { 
                    ...a, 
                    scheduledWeek: newWeek, 
                    scheduledDay: newDay,
                    timesRescheduled: (a.timesRescheduled || 0) + 1
                  }
                : a
            )
          }
        })
        
        console.log(`[Activities] Rescheduled ${activity.name} to Week ${newWeek} Day ${newDay}`)
        return true
      },
      
      completeActivity: (activityId: string, effectsOverride?: ActivityEffect) => {
        const { careerState, player } = get()
        if (!careerState || !player) return null
        
        const activities = careerState.scheduledActivities || []
        const activity = activities.find(a => a.id === activityId)
        
        if (!activity) {
          console.warn(`[Activities] Activity not found: ${activityId}`)
          return null
        }
        
        // Use override effects from gameplay if provided, otherwise use default activity effects
        const effects = effectsOverride || activity.effectsOnComplete
        
        // Apply effects
        let updatedPlayer = { ...player }
        let updatedCareerState = { ...careerState }
        let updatedOwnedTeam = careerState.ownedTeam ? { ...careerState.ownedTeam } : undefined
        
        // Fatigue
        if (effects.driverFatigue && updatedPlayer.mentalState) {
          updatedPlayer.mentalState = {
            ...updatedPlayer.mentalState,
            fatigue: Math.max(0, Math.min(100, updatedPlayer.mentalState.fatigue + effects.driverFatigue))
          }
        }
        
        // Morale
        if (effects.driverMorale && updatedPlayer.mentalState) {
          updatedPlayer.mentalState = {
            ...updatedPlayer.mentalState,
            morale: Math.max(0, Math.min(100, updatedPlayer.mentalState.morale + effects.driverMorale))
          }
        }
        
        // Reputation
        if (effects.reputation) {
          updatedPlayer.reputation = Math.max(0, Math.min(100, updatedPlayer.reputation + effects.reputation))
        }
        
        // Cash
        if (effects.cash) {
          updatedPlayer.finances = {
            ...updatedPlayer.finances,
            bankBalance: updatedPlayer.finances.bankBalance + effects.cash
          }
        }
        
        // Board mood
        if (effects.boardMood && updatedOwnedTeam) {
          updatedOwnedTeam.boardMood = Math.max(0, Math.min(100, updatedOwnedTeam.boardMood + effects.boardMood))
        }
        
        // Team morale (staff)
        if (effects.teamMorale && updatedOwnedTeam) {
          updatedOwnedTeam.staff = updatedOwnedTeam.staff.map(s => ({
            ...s,
            morale: Math.max(0, Math.min(100, (s.morale || 70) + effects.teamMorale!))
          }))
        }
        
        // Fan sentiment
        if (effects.fanSentiment && updatedOwnedTeam) {
          updatedOwnedTeam.fanSentiment = Math.max(0, Math.min(100, updatedOwnedTeam.fanSentiment + effects.fanSentiment))
        }
        
        // Sponsor satisfaction
        if (effects.sponsorSatisfaction) {
          if (activity.sponsorId) {
            // Update specific sponsor
            updatedPlayer.finances = {
              ...updatedPlayer.finances,
              sponsorDeals: updatedPlayer.finances.sponsorDeals.map(s => 
                s.id === activity.sponsorId
                  ? { ...s, satisfaction: Math.max(0, Math.min(100, (s.satisfaction || 70) + effects.sponsorSatisfaction!)) }
                  : s
              )
            }
          } else {
            // Update all sponsors
            updatedPlayer.finances = {
              ...updatedPlayer.finances,
              sponsorDeals: updatedPlayer.finances.sponsorDeals.map(s => ({
                ...s,
                satisfaction: Math.max(0, Math.min(100, (s.satisfaction || 70) + effects.sponsorSatisfaction!))
              }))
            }
          }
        }
        
        // Development points
        if (effects.developmentPoints && updatedCareerState.teamDevelopment) {
          // Add to current focus area or distribute evenly
          const focus = updatedCareerState.teamDevelopment.budget?.focusArea || 'balanced'
          if (focus !== 'balanced') {
            const focusArea = focus as DevelopmentArea
            updatedCareerState.teamDevelopment = {
              ...updatedCareerState.teamDevelopment,
              areas: {
                ...updatedCareerState.teamDevelopment.areas,
                [focusArea]: {
                  ...updatedCareerState.teamDevelopment.areas[focusArea],
                  points: updatedCareerState.teamDevelopment.areas[focusArea].points + effects.developmentPoints
                }
              }
            }
          }
        }
        
        // Confidence
        if (effects.confidence && updatedPlayer.mentalState) {
          updatedPlayer.mentalState = {
            ...updatedPlayer.mentalState,
            confidence: Math.max(0, Math.min(100, updatedPlayer.mentalState.confidence + effects.confidence))
          }
        }
        
        // Stress
        if (effects.stress && updatedPlayer.mentalState) {
          updatedPlayer.mentalState = {
            ...updatedPlayer.mentalState,
            stress: Math.max(0, Math.min(100, (updatedPlayer.mentalState.stress || 0) + effects.stress))
          }
        }
        
        // Fitness (driver performance fitness)
        if (effects.fitness) {
          updatedPlayer.stats = {
            ...updatedPlayer.stats,
            fitness: Math.max(0, Math.min(100, updatedPlayer.stats.fitness + effects.fitness))
          }
        }
        
        // Marketability
        if (effects.marketability) {
          updatedPlayer.stats = {
            ...updatedPlayer.stats,
            marketability: Math.max(0, Math.min(100, updatedPlayer.stats.marketability + effects.marketability))
          }
        }
        
        // Mental Strength
        if (effects.mentalStrength) {
          updatedPlayer.stats = {
            ...updatedPlayer.stats,
            mentalStrength: Math.max(0, Math.min(100, updatedPlayer.stats.mentalStrength + effects.mentalStrength))
          }
        }
        
        // Mark activity as completed
        const completedActivity: ScheduledActivity = {
          ...activity,
          status: 'completed',
          completedWeek: careerState.currentWeek,
          completedDay: careerState.currentDay
        }
        
        // Move to history
        set({
          player: updatedPlayer,
          careerState: {
            ...updatedCareerState,
            ownedTeam: updatedOwnedTeam,
            scheduledActivities: activities.filter(a => a.id !== activityId),
            activityHistory: [...(careerState.activityHistory || []), completedActivity]
          }
        })
        
        console.log(`[Activities] Completed: ${activity.name}`, effects)
        
        // === NOTIFICATION INTEGRATION ===
        const effectsSummary: string[] = []
        if (effects.cash) effectsSummary.push(`Payment: $${effects.cash.toLocaleString()}`)
        if (effects.reputation) effectsSummary.push(`Reputation: ${effects.reputation > 0 ? '+' : ''}${effects.reputation}`)
        if (effects.sponsorSatisfaction) effectsSummary.push(`Sponsor satisfaction: ${effects.sponsorSatisfaction > 0 ? '+' : ''}${effects.sponsorSatisfaction}`)
        routeNotification({
          category: activity.category === 'media' ? 'media_pr' : activity.category === 'sponsor' ? 'sponsor' : 'team_manager',
          subject: `Activity Complete: ${activity.name}`,
          body: `"${activity.name}" has been completed successfully.${effectsSummary.length > 0 ? `\n\n**Results:**\n${effectsSummary.map(e => `- ${e}`).join('\n')}` : ''}`,
          emailCategory: activity.category === 'media' ? 'media' : activity.category === 'sponsor' ? 'sponsor' : 'team'
        })

        return effects
      },
      
      missActivity: (activityId: string) => {
        const { careerState, player } = get()
        if (!careerState || !player) return null
        
        const activities = careerState.scheduledActivities || []
        const activity = activities.find(a => a.id === activityId)
        
        if (!activity) return null
        
        const effects = activity.effectsOnMiss
        
        // Apply negative effects (similar to completeActivity but with miss effects)
        let updatedPlayer = { ...player }
        let updatedOwnedTeam = careerState.ownedTeam ? { ...careerState.ownedTeam } : undefined
        
        // Fatigue (missing activities can still cause stress-fatigue)
        if (effects.driverFatigue && updatedPlayer.mentalState) {
          updatedPlayer.mentalState = {
            ...updatedPlayer.mentalState,
            fatigue: Math.max(0, Math.min(100, updatedPlayer.mentalState.fatigue + effects.driverFatigue))
          }
        }
        
        // Morale (missing activities should hurt morale)
        if (effects.driverMorale && updatedPlayer.mentalState) {
          updatedPlayer.mentalState = {
            ...updatedPlayer.mentalState,
            morale: Math.max(0, Math.min(100, updatedPlayer.mentalState.morale + effects.driverMorale))
          }
        }
        
        if (effects.reputation) {
          updatedPlayer.reputation = Math.max(0, Math.min(100, updatedPlayer.reputation + effects.reputation))
        }
        
        if (effects.cash) {
          updatedPlayer.finances = {
            ...updatedPlayer.finances,
            bankBalance: updatedPlayer.finances.bankBalance + effects.cash
          }
        }
        
        if (effects.boardMood && updatedOwnedTeam) {
          updatedOwnedTeam.boardMood = Math.max(0, Math.min(100, updatedOwnedTeam.boardMood + effects.boardMood))
        }
        
        // Team morale (staff) - missing team activities can affect staff morale
        if (effects.teamMorale && updatedOwnedTeam) {
          updatedOwnedTeam.staff = updatedOwnedTeam.staff.map(s => ({
            ...s,
            morale: Math.max(0, Math.min(100, (s.morale || 70) + effects.teamMorale!))
          }))
        }
        
        // Fan sentiment - missing fan events should hurt sentiment
        if (effects.fanSentiment && updatedOwnedTeam) {
          updatedOwnedTeam.fanSentiment = Math.max(0, Math.min(100, updatedOwnedTeam.fanSentiment + effects.fanSentiment))
        }
        
        if (effects.sponsorSatisfaction) {
          if (activity.sponsorId) {
            updatedPlayer.finances = {
              ...updatedPlayer.finances,
              sponsorDeals: updatedPlayer.finances.sponsorDeals.map(s => 
                s.id === activity.sponsorId
                  ? { ...s, satisfaction: Math.max(0, (s.satisfaction || 70) + effects.sponsorSatisfaction!) }
                  : s
              )
            }
          } else {
            updatedPlayer.finances = {
              ...updatedPlayer.finances,
              sponsorDeals: updatedPlayer.finances.sponsorDeals.map(s => ({
                ...s,
                satisfaction: Math.max(0, (s.satisfaction || 70) + effects.sponsorSatisfaction!)
              }))
            }
          }
        }
        
        // Confidence (missing events can hurt confidence)
        if (effects.confidence && updatedPlayer.mentalState) {
          updatedPlayer.mentalState = {
            ...updatedPlayer.mentalState,
            confidence: Math.max(0, Math.min(100, updatedPlayer.mentalState.confidence + effects.confidence))
          }
        }
        
        // Stress (missing events can increase stress)
        if (effects.stress && updatedPlayer.mentalState) {
          updatedPlayer.mentalState = {
            ...updatedPlayer.mentalState,
            stress: Math.max(0, Math.min(100, (updatedPlayer.mentalState.stress || 0) + effects.stress))
          }
        }
        
        // Fitness (missing fitness activities can reduce fitness)
        if (effects.fitness) {
          updatedPlayer.stats = {
            ...updatedPlayer.stats,
            fitness: Math.max(0, Math.min(100, updatedPlayer.stats.fitness + effects.fitness))
          }
        }
        
        // Marketability
        if (effects.marketability) {
          updatedPlayer.stats = {
            ...updatedPlayer.stats,
            marketability: Math.max(0, Math.min(100, updatedPlayer.stats.marketability + effects.marketability))
          }
        }
        
        // Mental Strength
        if (effects.mentalStrength) {
          updatedPlayer.stats = {
            ...updatedPlayer.stats,
            mentalStrength: Math.max(0, Math.min(100, updatedPlayer.stats.mentalStrength + effects.mentalStrength))
          }
        }
        
        // Mark as missed
        const missedActivity: ScheduledActivity = {
          ...activity,
          status: 'missed',
          completedWeek: careerState.currentWeek,
          completedDay: careerState.currentDay
        }
        
        set({
          player: updatedPlayer,
          careerState: {
            ...careerState,
            ownedTeam: updatedOwnedTeam,
            scheduledActivities: activities.filter(a => a.id !== activityId),
            activityHistory: [...(careerState.activityHistory || []), missedActivity]
          }
        })
        
        console.log(`[Activities] Missed: ${activity.name}`, effects)
        return effects
      },
      
      getScheduledActivities: (week?: number) => {
        const { careerState } = get()
        const activities = careerState?.scheduledActivities || []
        
        if (week !== undefined) {
          return activities.filter(a => a.scheduledWeek === week && a.status === 'scheduled')
        }
        return activities.filter(a => a.status === 'scheduled')
      },
      
      getActivityHistory: () => {
        const { careerState } = get()
        return careerState?.activityHistory || []
      },
      
      getAvailableActivities: () => {
        const { careerState, player } = get()
        if (!careerState || !player) return []
        
        const ownedTeam = careerState.ownedTeam
        const hasSponsors = (player.finances.sponsorDeals || []).filter(s => s.active).length > 0
        const hasStaff = (ownedTeam?.staff || []).length > 0
        
        return ACTIVITY_TEMPLATES.filter(template => {
          // Check reputation
          if (template.minReputation && player.reputation < template.minReputation) return false
          
          // Check sponsor requirement
          if (template.requiresSponsor && !hasSponsors) return false
          
          // Check staff requirement
          if (template.requiresStaff && !hasStaff) return false
          
          // Check specific staff role
          if (template.requiresStaffRole) {
            const hasRole = ownedTeam?.staff.some(s => s.role === template.requiresStaffRole)
            if (!hasRole) return false
          }
          
          return true
        })
      },
      
      processScheduledActivities: () => {
        const { careerState, completeActivity, missActivity } = get()
        if (!careerState) return
        
        const currentWeek = careerState.currentWeek
        const currentDay = careerState.currentDay ?? 1
        const activities = careerState.scheduledActivities || []
        
        // Find activities that should have been completed by now
        activities.forEach(activity => {
          if (activity.status !== 'scheduled') return
          
          const isPast = activity.scheduledWeek < currentWeek || 
            (activity.scheduledWeek === currentWeek && activity.scheduledDay < currentDay)
          
          if (isPast) {
            // Auto-complete if driver not required, otherwise miss
            if (!activity.requiresDriver) {
              completeActivity(activity.id)
            } else {
              missActivity(activity.id)
            }
          }
        })
      },
      
      // ============================================
      // ACTIVITY CONFIGURATION & VALIDATION
      // ============================================
      
      validateActivityRequirements: (templateId: string) => {
        const { careerState, player } = get()
        const errors: string[] = []
        const warnings: string[] = []
        
        if (!careerState || !player) {
          return { valid: false, errors: ['No active career'], warnings: [] }
        }
        
        const template = ACTIVITY_TEMPLATES.find(t => t.id === templateId)
        if (!template) {
          return { valid: false, errors: ['Activity template not found'], warnings: [] }
        }
        
        const ownedTeam = careerState.ownedTeam
        const activeSponsors = (player.finances.sponsorDeals || []).filter(s => s.active)
        const staff = ownedTeam?.staff || []
        const facilities = ownedTeam?.facilities
        const cash = ownedTeam?.budgets?.cash ?? player.finances.bankBalance ?? 0
        
        // Check reputation requirement
        if (template.minReputation && player.reputation < template.minReputation) {
          errors.push(`Requires ${template.minReputation} reputation (you have ${player.reputation})`)
        }
        
        // Check sponsor requirement
        if (template.requiresSponsor && activeSponsors.length === 0) {
          errors.push('Requires at least one active sponsor')
        }
        
        // Check staff requirement
        if (template.requiresStaff && staff.length === 0) {
          errors.push('Requires at least one staff member')
        }
        
        // Check specific staff role
        if (template.requiresStaffRole) {
          const hasRole = staff.some(s => s.role === template.requiresStaffRole)
          if (!hasRole) {
            errors.push(`Requires a ${template.requiresStaffRole.replace('_', ' ')}`)
          }
        }
        
        // Check facility requirements
        if (template.requiresFacilityLevel && facilities) {
          const facilityState = facilities[template.requiresFacilityLevel.type as FacilityType]
          const facilityLevel = facilityState?.level || 0
          if (facilityLevel < template.requiresFacilityLevel.minLevel) {
            errors.push(`Requires ${template.requiresFacilityLevel.type} facility level ${template.requiresFacilityLevel.minLevel} (you have ${facilityLevel})`)
          }
        }
        
        // Check base cost affordability
        if (template.baseCost > 0 && cash < template.baseCost) {
          errors.push(`Insufficient funds: need $${template.baseCost.toLocaleString()}, have $${cash.toLocaleString()}`)
        }
        
        // Check max per season
        if (template.maxPerSeason) {
          const thisSeasonCount = (careerState.activityHistory || []).filter(a => 
            a.templateId === templateId && 
            a.completedWeek && 
            a.status === 'completed'
          ).length
          const scheduledCount = (careerState.scheduledActivities || []).filter(a => 
            a.templateId === templateId && 
            a.status === 'scheduled'
          ).length
          
          if (thisSeasonCount + scheduledCount >= template.maxPerSeason) {
            errors.push(`Maximum ${template.maxPerSeason} per season reached`)
          }
        }
        
        // Check cooldown
        if (template.cooldownWeeks) {
          const lastActivity = [...(careerState.activityHistory || []), ...(careerState.scheduledActivities || [])]
            .filter(a => a.templateId === templateId)
            .sort((a, b) => (b.scheduledWeek || 0) - (a.scheduledWeek || 0))[0]
          
          if (lastActivity) {
            const weeksSince = careerState.currentWeek - (lastActivity.scheduledWeek || 0)
            if (weeksSince < template.cooldownWeeks) {
              errors.push(`Cooldown: ${template.cooldownWeeks - weeksSince} weeks remaining`)
            }
          }
        }
        
        // Warnings (non-blocking)
        if (template.requiresDriver && (player.mentalState?.fatigue || 0) > 80) {
          warnings.push('Driver fatigue is high - activity may have reduced effectiveness')
        }
        
        if (staff.some(s => (s.morale || 50) < 30)) {
          warnings.push('Staff morale is low - consider team building activities')
        }
        
        return {
          valid: errors.length === 0,
          errors,
          warnings
        }
      },
      
      calculateActivityCost: (templateId: string, configuration: ActivityConfiguration) => {
        const { careerState, player } = get()
        const template = ACTIVITY_TEMPLATES.find(t => t.id === templateId)
        
        // Default breakdown
        const breakdown: ActivityCostBreakdown = {
          venueCost: 0,
          cateringCost: 0,
          mediaCost: 0,
          guestCosts: { vipTreatment: 0, mediaExclusivity: 0, fanEvent: 0 },
          staffCosts: 0,
          miscCosts: 0,
          subtotal: 0,
          reputationDiscount: 0,
          sponsorSubsidy: 0,
          locationBonus: 0,
          total: 0
        }
        
        if (!template || !careerState) return breakdown
        
        const ownedTeam = careerState.ownedTeam
        const reputation = player?.reputation || 50
        
        // Import venue and catering data dynamically (these would be imported at top of file in real impl)
        // For now, use configuration values
        
        // Venue cost (from configuration)
        breakdown.venueCost = configuration.estimatedCost * 0.4 // Venue typically 40% of total
        
        // Catering cost
        const guestCount = configuration.guests.totalCount || 10
        breakdown.cateringCost = guestCount * 50 // Average per person
        
        // Media costs
        if (configuration.mediaCoverage.pressRelease) breakdown.mediaCost += 500
        if (configuration.mediaCoverage.photographerHired) breakdown.mediaCost += 1000
        if (configuration.mediaCoverage.videoTeamHired) breakdown.mediaCost += 3000
        if (configuration.mediaCoverage.livestream) breakdown.mediaCost += 2000
        
        // Guest costs
        const vipTreatmentCount = configuration.guests.sponsorReps.filter(s => s.vipTreatment).reduce((sum, s) => sum + s.count, 0)
        breakdown.guestCosts.vipTreatment = vipTreatmentCount * 200
        
        const exclusiveMediaCount = configuration.guests.mediaInvites.filter(m => m.exclusiveAccess).reduce((sum, m) => sum + m.count, 0)
        breakdown.guestCosts.mediaExclusivity = exclusiveMediaCount * 500
        
        if (configuration.guests.fanAttendees) {
          // Fan events might have costs or revenue depending on ticket price
          const fanCount = configuration.guests.fanAttendees.count
          const ticketPrice = configuration.guests.fanAttendees.ticketPrice
          breakdown.guestCosts.fanEvent = Math.max(0, (fanCount * 20) - (fanCount * ticketPrice)) // Cost minus revenue
        }
        
        // Staff costs (if activity requires extra staff time)
        if (template.requiresStaff || template.requiresStaffRole) {
          breakdown.staffCosts = 500 // Overtime/additional compensation
        }
        
        // Base cost from template
        breakdown.miscCosts = template.baseCost
        
        // Calculate subtotal
        breakdown.subtotal = breakdown.venueCost + breakdown.cateringCost + breakdown.mediaCost +
          breakdown.guestCosts.vipTreatment + breakdown.guestCosts.mediaExclusivity + 
          breakdown.guestCosts.fanEvent + breakdown.staffCosts + breakdown.miscCosts
        
        // Apply modifiers
        // Reputation discount (up to 15% at 100 rep)
        breakdown.reputationDiscount = breakdown.subtotal * Math.min(reputation / 666, 0.15)
        
        // Sponsor subsidy (if sponsors are attending and satisfied)
        const activeSponsors = (player?.finances.sponsorDeals || []).filter(s => s.active)
        const satisfiedSponsors = activeSponsors.filter(s => (s.satisfaction || 50) >= 70)
        if (satisfiedSponsors.length > 0 && template.category === 'sponsor') {
          breakdown.sponsorSubsidy = breakdown.subtotal * 0.1 // 10% subsidy
        }
        
        // Location bonus (if team HQ is in a cost-effective country)
        if (ownedTeam?.locationPerk) {
          breakdown.locationBonus = breakdown.subtotal * 0.05 // 5% bonus
        }
        
        // Final total
        breakdown.total = Math.round(
          breakdown.subtotal - breakdown.reputationDiscount - breakdown.sponsorSubsidy - breakdown.locationBonus
        )
        
        return breakdown
      },
      
      getActivityOpportunities: () => {
        const { careerState } = get()
        if (!careerState) return []
        
        // Return triggered activities that are optional (not mandatory)
        return (careerState.scheduledActivities || []).filter(a => 
          a.autoScheduled && 
          !a.mandatory && 
          a.status === 'scheduled'
        )
      },
      
      getMandatoryActivities: () => {
        const { careerState } = get()
        if (!careerState) return []
        
        // Return mandatory activities that haven't been completed
        return (careerState.scheduledActivities || []).filter(a => 
          a.mandatory && 
          a.status === 'scheduled'
        ).sort((a, b) => {
          // Sort by deadline urgency
          const aDeadline = a.rescheduleDeadline || a.scheduledWeek
          const bDeadline = b.rescheduleDeadline || b.scheduledWeek
          return aDeadline - bDeadline
        })
      },
      
      scheduleConfiguredActivity: (
        templateId: string, 
        week: number, 
        day: number, 
        configuration: ActivityConfiguration
      ) => {
        const { careerState, validateActivityRequirements, calculateActivityCost } = get()
        if (!careerState) return null
        
        // Validate requirements
        const validation = validateActivityRequirements(templateId)
        if (!validation.valid) {
          console.log('[scheduleConfiguredActivity] Validation failed:', validation.errors)
          return null
        }
        
        const template = ACTIVITY_TEMPLATES.find(t => t.id === templateId)
        if (!template) return null
        
        // Calculate costs
        const costBreakdown = calculateActivityCost(templateId, configuration)
        
        // Get owned team for budget checks
        const ownedTeam = careerState.ownedTeam
        
        // Soft enforcement: Check category budget but allow overspending
        // We check against total available (category + cash if needed) but warn about overspend
        const budgetCategory = template.budgetCategory || 'operations'
        const budgetFieldMap: Record<string, string> = {
          development: 'developmentBudget',
          marketing: 'marketingBudget',
          travel: 'travelBudget',
          contingency: 'contingencyBudget',
          operations: 'cash',
          personal: 'cash'
        }
        const budgetField = budgetFieldMap[budgetCategory] || 'cash'
        const categoryBudgetValue = (ownedTeam?.budgets?.[budgetField as keyof typeof ownedTeam.budgets] as number) ?? 0
        const generalCash = ownedTeam?.budgets?.cash ?? 0
        
        // Calculate if this would cause overspend
        const wouldOverspend = costBreakdown.total > categoryBudgetValue
        const overspendAmount = wouldOverspend ? costBreakdown.total - Math.max(0, categoryBudgetValue) : 0
        
        // Hard check: Must have SOME funds available (either in category or general cash)
        // This prevents scheduling activities with absolutely no money
        const totalAvailable = budgetField === 'cash' 
          ? generalCash 
          : categoryBudgetValue + generalCash
        
        if (costBreakdown.total > totalAvailable * 2) {
          // Only block if trying to spend more than 2x total available (extreme overspend)
          console.log('[scheduleConfiguredActivity] Extreme overspend blocked:', costBreakdown.total, '>', totalAvailable * 2)
          return null
        }
        
        // Warn about overspending but allow it
        if (wouldOverspend && overspendAmount > 0) {
          console.warn(`[scheduleConfiguredActivity] Activity will overspend ${budgetCategory} budget by $${overspendAmount.toLocaleString()}`)
        }
        
        // Check for driver/owner conflicts
        const { checkScheduleConflict } = get()
        const conflictCheck = checkScheduleConflict(
          week, 
          day, 
          template.requiresDriver ?? true, 
          !template.requiresDriver // If doesn't require driver, treat as owner-only
        )
        
        if (conflictCheck.hasConflict) {
          console.warn('[scheduleConfiguredActivity] Driver/Owner conflict detected:', {
            type: conflictCheck.conflictType,
            conflicting: conflictCheck.conflictingActivities.map(a => a.name),
            canResolve: conflictCheck.canResolveWithReserve
          })
          // Log warning but allow scheduling - UI should handle displaying this
        }
        
        // Calculate span days and reschedule cost
        const spanDays = template.spanDays || 1
        const rescheduleCost = template.baseCost > 0 
          ? Math.floor(template.baseCost * ((template.rescheduleCostPercent || 25) / 100))
          : 0
        
        // Create the scheduled activity
        const activity: ScheduledActivity = {
          id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          templateId,
          name: configuration.customName || template.name,
          description: template.description,
          category: template.category,
          budgetCategory: template.budgetCategory || 'operations',
          scheduledWeek: week,
          scheduledDay: day,
          duration: template.duration,
          spanDays,
          status: 'scheduled',
          effectsOnComplete: { ...template.defaultEffectsOnComplete },
          effectsOnMiss: { ...template.defaultEffectsOnMiss },
          requiredCash: costBreakdown.total,
          requiresDriver: template.requiresDriver,
          requiredStaffRole: template.requiresStaffRole,
          canReschedule: true,
          rescheduleCost,
          timesRescheduled: 0,
          
          // Configuration
          configuration,
          totalCost: costBreakdown.total,
          costBreakdown,
          
          // Expected outcome based on configuration quality
          expectedOutcome: { ...template.defaultEffectsOnComplete },
          
          triggeredBy: 'manual',
          autoScheduled: false
        }
        
        // Boost effects based on configuration quality
        if (configuration.guests.totalCount > 50) {
          activity.effectsOnComplete.reputation = (activity.effectsOnComplete.reputation || 0) + 2
          activity.effectsOnComplete.fanSentiment = (activity.effectsOnComplete.fanSentiment || 0) + 5
        }
        
        // Media coverage boosts
        if (configuration.mediaCoverage.videoTeamHired) {
          activity.effectsOnComplete.reputation = (activity.effectsOnComplete.reputation || 0) + 1
        }
        if (configuration.mediaCoverage.livestream) {
          activity.effectsOnComplete.fanSentiment = (activity.effectsOnComplete.fanSentiment || 0) + 10
        }
        
        // Deduct cost from appropriate category budget
        if (ownedTeam) {
          const budgetCategory = template.budgetCategory || 'operations'
          const currentBudgets = ownedTeam.budgets
          const currentOverspends = currentBudgets.budgetOverspends || {
            development: 0,
            marketing: 0,
            travel: 0,
            contingency: 0,
            operations: 0
          }
          
          // Map budget category to budget field
          const budgetFieldMap: Record<string, keyof typeof currentBudgets> = {
            development: 'developmentBudget',
            marketing: 'marketingBudget',
            travel: 'travelBudget',
            contingency: 'contingencyBudget',
            operations: 'cash',  // Operations fall back to general cash
            personal: 'cash'     // Personal expenses from general cash
          }
          
          const budgetField = budgetFieldMap[budgetCategory] || 'cash'
          const currentBudgetValue = (currentBudgets[budgetField] as number) || 0
          const newBudgetValue = currentBudgetValue - costBreakdown.total
          
          // Track overspending if budget goes negative
          const overspendAmount = newBudgetValue < 0 ? Math.abs(newBudgetValue) : 0
          const wasAlreadyOverspent = currentOverspends[budgetCategory as keyof typeof currentOverspends] || 0
          const newOverspendAmount = overspendAmount > 0 
            ? Math.max(overspendAmount, wasAlreadyOverspent)
            : wasAlreadyOverspent
          
          const updatedOverspends = {
            ...currentOverspends,
            [budgetCategory]: newOverspendAmount
          }
          
          const updatedBudgets = {
            ...currentBudgets,
            [budgetField]: newBudgetValue,  // Can go negative (soft enforcement)
            budgetOverspends: updatedOverspends,
            yearToDateExpenses: (currentBudgets.yearToDateExpenses || 0) + costBreakdown.total
          }
          
          // Log if overspending and send warning email
          if (newBudgetValue < 0 && !wasAlreadyOverspent) {
            console.warn(`[Budget] ${budgetCategory} budget overspent by $${Math.abs(newBudgetValue).toLocaleString()}`)
            
            // Send budget warning email
            const budgetCategoryNames: Record<string, string> = {
              development: 'Development & R&D',
              marketing: 'Marketing & PR',
              travel: 'Travel & Logistics',
              contingency: 'Contingency Reserve',
              operations: 'Operations',
              personal: 'Personal'
            }
            const categoryName = budgetCategoryNames[budgetCategory] || budgetCategory
            
            routeNotification({
              category: 'finances',
              subject: `Budget Warning: ${categoryName} Overspent`,
              body: `**BUDGET ALERT**\n\nYour **${categoryName}** budget has exceeded its allocation.\n\n**Current Deficit:** $${Math.abs(newBudgetValue).toLocaleString()}\n**Activity:** ${activity.name}\n**Cost:** $${costBreakdown.total.toLocaleString()}\n\nThis overspend will have consequences on team operations.\n\n**Recommendation:** Consider reallocating funds from other budget categories or reducing spending.`,
              emailCategory: 'team',
              urgency: 'high'
            })
          }
          
          // Create a transaction for tracking purposes
          // Map budget category to transaction category for accurate reporting
          const transactionCategoryMap: Record<string, TeamTransactionCategory> = {
            development: 'development',
            marketing: template.category === 'sponsor' ? 'sponsor_event' : 'marketing',
            travel: 'travel',
            contingency: template.category === 'maintenance' ? 'car_maintenance' : 'other',
            operations: 'facilities',
            personal: 'other'
          }
          const txCategory = transactionCategoryMap[budgetCategory] || 'other'
          
          const activityTransaction = createTeamTransaction(
            'expense',
            txCategory,
            costBreakdown.total,
            `Activity: ${activity.name}`,
            careerState.currentWeek,
            careerState.currentYear
          )
          
          // Update with transaction record
          set({
            careerState: {
              ...careerState,
              ownedTeam: { 
                ...ownedTeam, 
                budgets: updatedBudgets,
                finances: {
                  ...(ownedTeam.finances || {}),
                  transactions: [...(ownedTeam.finances?.transactions || []), activityTransaction]
                }
              },
              scheduledActivities: [...(careerState.scheduledActivities || []), activity]
            }
          })
        } else {
          set({
            careerState: {
              ...careerState,
              scheduledActivities: [...(careerState.scheduledActivities || []), activity]
            }
          })
        }
        
        console.log('[scheduleConfiguredActivity] Activity scheduled:', activity.name, 'Week', week, 'Day', day, 'Cost:', costBreakdown.total)
        return activity
      },
      
      generateTriggeredActivities: (raceResult?: 'win' | 'podium' | 'points' | 'dnf' | null) => {
        const { careerState, player } = get()
        if (!careerState || !player) return []
        
        const ownedTeam = careerState.ownedTeam
        const activeSponsors = (player.finances.sponsorDeals || []).filter(s => s.active)
        const staff = ownedTeam?.staff || []
        
        // Build trigger context
        const context: TriggerContext = {
          currentWeek: careerState.currentWeek,
          currentDay: careerState.currentDay ?? 1,
          reputation: player.reputation,
          hasSponsors: activeSponsors.length > 0,
          hasStaff: staff.length > 0,
          boardMood: ownedTeam?.boardMood ?? 50,
          avgSponsorSatisfaction: activeSponsors.length > 0 
            ? activeSponsors.reduce((sum, s) => sum + (s.satisfaction ?? 50), 0) / activeSponsors.length
            : 50,
          avgStaffMorale: staff.length > 0
            ? staff.reduce((sum, s) => sum + (s.morale ?? 50), 0) / staff.length
            : 50,
          lastRaceResult: raceResult,
          isChampionshipLeader: false, // Would need to check standings
          recentTriggers: [], // Would track in careerState
          activityCounts: {} // Would calculate from history
        }
        
        // Calculate activity counts from history
        const history = careerState.activityHistory || []
        const scheduled = careerState.scheduledActivities || []
        const allActivities = [...history, ...scheduled]
        
        allActivities.forEach(a => {
          if (a.triggeredBy) {
            const key = a.templateId
            context.activityCounts[key] = (context.activityCounts[key] || 0) + 1
          }
        })
        
        // Find triggers that should fire
        const triggersToFire = ALL_ACTIVITY_TRIGGERS.filter(trigger => {
          // For race result triggers, only fire if we have a matching result
          if (trigger.source === 'race_win' && raceResult !== 'win') return false
          if (trigger.source === 'race_podium' && raceResult !== 'podium') return false
          if (trigger.source === 'race_dnf' && raceResult !== 'dnf') return false
          if (trigger.source === 'championship_lead' && !context.isChampionshipLeader) return false
          
          return evaluateTriggerConditions(trigger, context)
        })
        
        // Generate activities from triggers
        const generatedActivities: ScheduledActivity[] = []
        
        triggersToFire.forEach(trigger => {
          // Check if we already have this activity scheduled
          const alreadyScheduled = scheduled.some(a => 
            a.triggeredBy === trigger.source && 
            a.templateId === trigger.id &&
            a.status === 'scheduled'
          )
          
          if (!alreadyScheduled) {
            const activity = createActivityFromTrigger(trigger, context, {
              raceRound: careerState.currentRound
            })
            generatedActivities.push(activity)
          }
        })
        
        // Add generated activities to state
        if (generatedActivities.length > 0) {
          set({
            careerState: {
              ...careerState,
              scheduledActivities: [...scheduled, ...generatedActivities]
            }
          })
          
          console.log(`[generateTriggeredActivities] Generated ${generatedActivities.length} activities:`, 
            generatedActivities.map(a => a.name).join(', '))
        }
        
        return generatedActivities
      },
      
      generateActivityReminders: () => {
        const { careerState, addEmail, getScheduledActivities } = get()
        if (!careerState) return
        
        const currentWeek = careerState.currentWeek
        const currentDay = careerState.currentDay ?? 1
        const currentYear = careerState.currentYear
        
        // Get all scheduled activities
        const allActivities = getScheduledActivities()
        
        // Dynamic sender resolution: checks actual staff roster, falls back to generic department
        const getDepartmentInfo = (category: string) => {
          const ownedTeam = careerState.ownedTeam
          const allStaff = [...(ownedTeam?.staff ?? []), ...(ownedTeam?.facilityStaff ?? [])]
          
          const roleMap: Record<string, { searchTerms: string[]; fallbackName: string; fallbackRole: string }> = {
            'sponsor':      { searchTerms: ['sponsorship', 'commercial', 'partnerships'], fallbackName: 'Commercial Department', fallbackRole: 'Commercial Director' },
            'team':         { searchTerms: ['team_manager', 'manager', 'principal'],      fallbackName: 'Team Management',       fallbackRole: 'Team Manager' },
            'media':        { searchTerms: ['pr', 'media', 'communications', 'press'],    fallbackName: 'PR Department',         fallbackRole: 'PR Manager' },
            'development':  { searchTerms: ['technical', 'engineering', 'chief_engineer'], fallbackName: 'Technical Department',  fallbackRole: 'Technical Director' },
            'maintenance':  { searchTerms: ['facilities', 'operations'],                  fallbackName: 'Operations Team',       fallbackRole: 'Operations Manager' },
          }
          
          const mapping = roleMap[category] ?? roleMap['team']
          
          // Try to find a real staff member for this category
          for (const member of allStaff) {
            const m = member as unknown as Record<string, unknown>
            const memberRole = (m.role as string || '').toLowerCase()
            const memberSpecialty = (m.specialty as string || '').toLowerCase()
            for (const term of mapping.searchTerms) {
              if (memberRole.includes(term) || memberSpecialty.includes(term)) {
                return { 
                  name: m.name as string || mapping.fallbackName, 
                  role: mapping.fallbackRole 
                }
              }
            }
          }
          
          return { name: mapping.fallbackName, role: mapping.fallbackRole }
        }
        
        // Check for tomorrow's activities (day-before reminders)
        const tomorrowDay = currentDay === 7 ? 1 : currentDay + 1
        const tomorrowWeek = currentDay === 7 ? currentWeek + 1 : currentWeek
        
        allActivities.forEach(activity => {
          // Check if activity is tomorrow
          if (activity.scheduledWeek === tomorrowWeek && activity.scheduledDay === tomorrowDay) {
            const dept = getDepartmentInfo(activity.category)
            const guestSummary = activity.configuration?.guests?.totalCount 
              ? `${activity.configuration.guests.totalCount} guests expected` 
              : 'No external guests'
            const costInfo = activity.totalCost ? `$${activity.totalCost.toLocaleString()}` : activity.requiredCash ? `~$${activity.requiredCash.toLocaleString()}` : 'TBD'
            
            addEmail({
              category: activity.category === 'sponsor' ? 'sponsor' : activity.category === 'media' ? 'media' : 'team',
              subject: `Reminder: ${activity.name} Tomorrow`,
              sender: dept.name,
              senderRole: dept.role,
              preview: `Don't forget you have ${activity.name} scheduled for tomorrow.`,
              body: `Hi,

This is a reminder that you have **${activity.name}** scheduled for tomorrow.

**Event Details:**
- Venue: ${activity.configuration?.venueName || 'Team HQ'}
- Attendees: ${guestSummary}
- Estimated Cost: ${costInfo}

Please ensure all preparations are in order. The ${dept.name.toLowerCase()} has everything ready for your arrival.

Best regards,
${dept.name}`,
              receivedDay: currentDay,
              receivedWeek: currentWeek,
              receivedYear: currentYear,
              read: false,
              starred: false,
              archived: false,
              actionType: 'activity_reminder',
              actionData: { activityId: activity.id }
            })
          }
          
          // Check if activity is today (day-of reminders)
          if (activity.scheduledWeek === currentWeek && activity.scheduledDay === currentDay) {
            const dept = getDepartmentInfo(activity.category)
            
            let contextualInfo = ''
            if (activity.category === 'sponsor' && activity.configuration?.guests?.sponsorReps?.length) {
              const sponsors = activity.configuration.guests.sponsorReps.map(s => s.sponsorName).join(', ')
              contextualInfo = `\n\n**Sponsor representatives from ${sponsors} will be attending.**`
            }
            if (activity.category === 'media' && activity.configuration?.guests?.mediaInvites?.length) {
              contextualInfo = `\n\n**Media personnel have been confirmed and are ready for coverage.**`
            }
            
            addEmail({
              category: activity.category === 'sponsor' ? 'sponsor' : activity.category === 'media' ? 'media' : 'team',
              subject: `${activity.name} Today - Action Required`,
              sender: dept.name,
              senderRole: dept.role,
              preview: `Your ${activity.name} is scheduled for today. Click to attend.`,
              body: `Hi,

Your **${activity.name}** is scheduled for **today**.
${contextualInfo}

**Location:** ${activity.configuration?.venueName || 'Team HQ'}

When you're ready, head to the Calendar to attend this event.

Best regards,
${dept.name}`,
              receivedDay: currentDay,
              receivedWeek: currentWeek,
              receivedYear: currentYear,
              read: false,
              starred: true,  // Star day-of reminders for visibility
              archived: false,
              actionType: 'activity_today',
              actionData: { activityId: activity.id }
            })
          }
        })
      },
      
      generateMandatoryActivities: () => {
        const { careerState, player, addEmail } = get()
        if (!careerState || !player) return
        
        const currentWeek = careerState.currentWeek
        const currentDay = careerState.currentDay ?? 1
        const currentYear = careerState.currentYear
        
        // Build context for trigger checks
        const existingActivities = careerState.scheduledActivities || []
        
        // Find last and next race weeks from series entries
        let lastRaceWeek: number | undefined
        let nextRaceWeek: number | undefined
        let allRaceWeeks: number[] = []
        
        // Gather race weeks from all series entries
        const seriesEntries = careerState.seriesEntries || []
        seriesEntries.forEach((entry: any) => {
          if (entry.calendar?.length) {
            entry.calendar.forEach((race: any) => {
              if (race.week) {
                allRaceWeeks.push(race.week)
              }
            })
          }
        })
        
        // Also check nextRaceWeek from careerState if available
        if (careerState.nextRaceWeek) {
          allRaceWeeks.push(careerState.nextRaceWeek)
        }
        
        if (allRaceWeeks.length > 0) {
          const pastRaces = allRaceWeeks.filter(week => week < currentWeek)
          const futureRaces = allRaceWeeks.filter(week => week > currentWeek)
          
          if (pastRaces.length > 0) {
            lastRaceWeek = Math.max(...pastRaces)
          }
          if (futureRaces.length > 0) {
            nextRaceWeek = Math.min(...futureRaces)
          }
        }
        
        // Calculate season milestones
        const seasonStartWeek = allRaceWeeks.length > 0 ? Math.min(...allRaceWeeks) : 1
        const seasonEndWeek = allRaceWeeks.length > 0 ? Math.max(...allRaceWeeks) : 52
        const seasonMidpoint = Math.floor((seasonStartWeek + seasonEndWeek) / 2)
        
        const context = {
          currentWeek,
          currentDay,
          lastRaceWeek,
          nextRaceWeek,
          seasonStartWeek,
          seasonEndWeek,
          seasonMidpoint,
          existingActivities
        }
        
        const newActivities: ScheduledActivity[] = []
        
        MANDATORY_ACTIVITY_TEMPLATES.forEach((template: any) => {
          if (shouldTriggerActivity(template, context)) {
            // Calculate deadline
            const deadline = calculateDeadline(currentWeek, currentDay, template.deadlineDays)
            
            // Create the mandatory activity
            const activity = createMandatoryActivity(
              template,
              currentWeek,
              currentDay,
              deadline.week,
              deadline.day
            )
            
            newActivities.push(activity)
            
            // Send notification email about this mandatory activity
            const urgencyTextMap: Record<string, string> = {
              'low': 'for your information',
              'medium': 'requires attention soon',
              'high': 'requires urgent attention',
              'critical': 'CRITICAL - must be addressed immediately'
            }
            const urgencyText = urgencyTextMap[template.urgencyLevel as string] || 'requires attention'
            
            // Dynamic sender resolution for mandatory activity notifications
            const mandatorySenderInfo = (() => {
              const ownedTeam = careerState.ownedTeam
              const allStaff = [...(ownedTeam?.staff ?? []), ...(ownedTeam?.facilityStaff ?? [])]
              
              // Try to find team manager or operations staff
              const searchTerms = ['team_manager', 'manager', 'operations', 'principal']
              for (const member of allStaff) {
                const m = member as unknown as Record<string, unknown>
                const memberRole = (m.role as string || '').toLowerCase()
                for (const term of searchTerms) {
                  if (memberRole.includes(term)) {
                    return { 
                      name: m.name as string || 'Team Management', 
                      role: 'Operations Director' 
                    }
                  }
                }
              }
              return { name: 'Team Management', role: 'Operations Director' }
            })()
            
            addEmail({
              category: 'team',
              subject: `Mandatory: ${template.name} Required`,
              sender: mandatorySenderInfo.name,
              senderRole: mandatorySenderInfo.role,
              preview: `A mandatory ${template.name.toLowerCase()} has been scheduled and ${urgencyText}.`,
              body: `Hi,

A **mandatory activity** has been scheduled that requires your attention.

**${template.name}**
${template.description}

**Deadline:** Week ${deadline.week}, Day ${deadline.day}
**Duration:** ${template.duration} hours
**Priority:** ${template.urgencyLevel.toUpperCase()}

${template.requiresDriver && template.requiresOwner ? '⚠️ Both you and the driver must attend this event.' : template.requiresOwner ? '⚠️ As team owner, your presence is required.' : '✓ This can be delegated to appropriate staff.'}

**Failure to complete this activity will result in:**
${Object.entries(template.effectsOnMiss).map(([key, value]: [string, any]) => 
  `• ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${value > 0 ? '+' : ''}${value}`
).join('\n')}

Please schedule this at your earliest convenience via the Calendar.

Best regards,
${mandatorySenderInfo.name}`,
              receivedDay: currentDay,
              receivedWeek: currentWeek,
              receivedYear: currentYear,
              read: false,
              starred: template.urgencyLevel === 'critical' || template.urgencyLevel === 'high',
              archived: false,
              actionType: 'mandatory_activity',
              actionData: { 
                activityId: activity.id,
                templateId: template.id,
                deadline: deadline
              }
            })
            
            console.log(`[CareerStore] Mandatory activity triggered: ${template.name}`)
          }
        })
        
        // Add new mandatory activities to the store
        if (newActivities.length > 0) {
          set({
            careerState: {
              ...careerState,
              scheduledActivities: [
                ...(careerState.scheduledActivities || []),
                ...newActivities
              ]
            }
          })
        }
      },
      
      // ============================================
      // BUDGET OVERSPEND CONSEQUENCES
      // ============================================
      
      processOverspendConsequences: () => {
        const { careerState } = get()
        if (!careerState?.ownedTeam) return
        
        const budgets = careerState.ownedTeam.budgets
        const overspends = budgets.budgetOverspends
        if (!overspends) return
        
        // Only process once per week (on day 1)
        if (careerState.currentDay !== 1) return
        
        let sponsorSatisfactionPenalty = 0
        let teamMoralePenalty = 0
        let boardMoodPenalty = 0
        let developmentSpeedModifier = 1.0
        
        // Marketing overspend: -5 sponsor satisfaction per $10k overspent
        if (overspends.marketing > 0) {
          sponsorSatisfactionPenalty += Math.floor(overspends.marketing / 10000) * 5
          console.log(`[Budget] Marketing overspend penalty: -${sponsorSatisfactionPenalty} sponsor satisfaction`)
        }
        
        // Development overspend: -10% development speed penalty
        if (overspends.development > 0) {
          developmentSpeedModifier = 0.9  // 10% slower development
          console.log(`[Budget] Development overspend penalty: -10% development speed`)
        }
        
        // Travel overspend: Team morale penalty
        if (overspends.travel > 0) {
          teamMoralePenalty += Math.floor(overspends.travel / 5000) * 3
          console.log(`[Budget] Travel overspend penalty: -${teamMoralePenalty} team morale`)
        }
        
        // Contingency used: Board concern
        if (overspends.contingency > 0) {
          boardMoodPenalty += Math.floor(overspends.contingency / 10000) * 5
          console.log(`[Budget] Contingency overspend penalty: -${boardMoodPenalty} board mood`)
        }
        
        // Operations overspend: General penalties
        if (overspends.operations > 0) {
          const operationsPenalty = Math.floor(overspends.operations / 15000) * 2
          boardMoodPenalty += operationsPenalty
          teamMoralePenalty += operationsPenalty
          console.log(`[Budget] Operations overspend penalty: -${operationsPenalty} board mood & morale`)
        }
        
        // Apply consequences if any penalties exist
        if (sponsorSatisfactionPenalty > 0 || teamMoralePenalty > 0 || boardMoodPenalty > 0) {
          const currentSponsors = careerState.ownedTeam.finances?.sponsors || []
          
          // Apply sponsor satisfaction penalty
          const updatedSponsors = currentSponsors.map(sponsor => ({
            ...sponsor,
            satisfaction: Math.max(0, (sponsor.satisfaction || 100) - sponsorSatisfactionPenalty)
          }))
          
          // Get current morale/board values
          const currentBoardMood = careerState.teamMediaState?.boardPRSatisfaction || 50
          const currentTeamMorale = careerState.ownedTeam.teamMorale || 50
          
          set({
            careerState: {
              ...careerState,
              ownedTeam: {
                ...careerState.ownedTeam,
                finances: {
                  ...careerState.ownedTeam.finances,
                  sponsors: updatedSponsors
                },
                teamMorale: Math.max(0, currentTeamMorale - teamMoralePenalty),
                // Store development speed modifier for use in development calculations
                developmentSpeedModifier: developmentSpeedModifier
              },
              teamMediaState: careerState.teamMediaState ? {
                ...careerState.teamMediaState,
                boardPRSatisfaction: Math.max(0, currentBoardMood - boardMoodPenalty)
              } : undefined
            }
          })
          
          console.log(`[Budget] Weekly overspend consequences applied:`, {
            sponsorSatisfactionPenalty,
            teamMoralePenalty,
            boardMoodPenalty,
            developmentSpeedModifier
          })
        }
      },
      
      // ============================================
      // DRIVER/OWNER CONFLICT SYSTEM
      // ============================================
      
      hasReserveDriver: () => {
        const { careerState } = get()
        if (!careerState?.ownedTeam) return false
        
        // Check if team has a reserve driver on staff
        const staff = careerState.ownedTeam.staff || []
        return staff.some(s => s.role === 'reserve_driver')
      },
      
      getActivitiesForDay: (week: number, day: number) => {
        const { careerState } = get()
        if (!careerState) return []
        
        // Return activities where the queried day falls within their span
        return (careerState.scheduledActivities || []).filter(a => {
          if (a.scheduledWeek !== week || a.status !== 'scheduled') return false
          
          const startDay = a.scheduledDay
          const spanDays = a.spanDays || 1
          const endDay = startDay + spanDays - 1
          
          // Day is within the activity's span
          return day >= startDay && day <= endDay
        })
      },
      
      canAttendActivity: (activityId: string) => {
        const { careerState, hasReserveDriver, getActivitiesForDay, player } = get()
        if (!careerState || !player) {
          return { canAttend: false, reason: 'no_reserve' as const }
        }
        
        // Find the activity
        const activity = careerState.scheduledActivities?.find(a => a.id === activityId)
        if (!activity) {
          return { canAttend: true } // Activity not found, assume can attend
        }
        
        // Get all activities for the same day
        const sameDayActivities = getActivitiesForDay(activity.scheduledWeek, activity.scheduledDay)
        
        // Check if player is both driver and owner
        const isDriverOwner = careerState.ownedTeam !== null && careerState.ownedTeam !== undefined
        
        if (!isDriverOwner) {
          // If not owner, no conflict possible
          return { canAttend: true }
        }
        
        // Filter activities that require driver vs owner-only
        const driverRequiredActivities = sameDayActivities.filter(a => a.requiresDriver)
        const ownerOnlyActivities = sameDayActivities.filter(a => a.requiresOwner && !a.requiresDriver)
        
        // Check for conflict - both driver and owner duties on same day
        if (driverRequiredActivities.length > 0 && ownerOnlyActivities.length > 0) {
          const hasReserve = hasReserveDriver()
          
          if (!hasReserve) {
            // Determine which activities conflict with this one
            const conflicting = activity.requiresDriver ? ownerOnlyActivities : driverRequiredActivities
            
            return {
              canAttend: false,
              reason: 'conflict' as const,
              conflictingActivities: conflicting,
              resolutionOptions: [
                'Hire a reserve driver to cover driving duties',
                'Reschedule one of the conflicting activities',
                'Cancel one of the activities (may have consequences)'
              ]
            }
          }
          
          // With reserve driver, can attend owner duties while reserve covers driving
          if (!activity.requiresDriver && activity.requiresOwner) {
            return {
              canAttend: true,
              reason: undefined,
              resolutionOptions: ['Reserve driver will cover any driving duties']
            }
          }
        }
        
        // No conflict
        return { canAttend: true }
      },
      
      checkScheduleConflict: (week: number, day: number, requiresDriver?: boolean, requiresOwner?: boolean) => {
        const { careerState, hasReserveDriver, getActivitiesForDay } = get()
        
        const result = {
          hasConflict: false,
          conflictType: undefined as 'driver' | 'owner' | 'both' | undefined,
          conflictingActivities: [] as ScheduledActivity[],
          canResolveWithReserve: false
        }
        
        if (!careerState?.ownedTeam) {
          // Not in owner mode, no conflicts
          return result
        }
        
        const existingActivities = getActivitiesForDay(week, day)
        
        if (existingActivities.length === 0) {
          return result
        }
        
        // Check what's already scheduled
        const existingDriverDuties = existingActivities.filter(a => a.requiresDriver)
        const existingOwnerDuties = existingActivities.filter(a => a.requiresOwner && !a.requiresDriver)
        
        // Determine conflict type
        if (requiresDriver && existingOwnerDuties.length > 0) {
          result.hasConflict = true
          result.conflictType = 'driver'
          result.conflictingActivities = existingOwnerDuties
          result.canResolveWithReserve = true // Reserve can cover driving
        }
        
        if (requiresOwner && !requiresDriver && existingDriverDuties.length > 0) {
          result.hasConflict = true
          result.conflictType = 'owner'
          result.conflictingActivities = existingDriverDuties
          result.canResolveWithReserve = true // Reserve can cover driving while owner does meeting
        }
        
        // Both required - conflict with either type
        if (requiresDriver && requiresOwner) {
          if (existingDriverDuties.length > 0 || existingOwnerDuties.length > 0) {
            result.hasConflict = true
            result.conflictType = 'both'
            result.conflictingActivities = [...existingDriverDuties, ...existingOwnerDuties]
            result.canResolveWithReserve = false // Can't delegate when both are needed
          }
        }
        
        // Check if reserve driver resolves the conflict
        if (result.hasConflict && result.canResolveWithReserve && hasReserveDriver()) {
          result.hasConflict = false // Conflict resolved
        }
        
        return result
      },
      
      // ============================================
      // CAR MARKETPLACE ACTIONS
      // ============================================
      
      refreshMarketplaceListings: () => {
        const { careerState, player } = get()
        if (!careerState || !player) return
        
        // Dynamically import marketplace functions
        import('@/simulation/marketplace').then(({ generateMarketplaceListings }) => {
          const ownedCarClassIds = (careerState.cars || []).map(c => c.chassisId)
          
          // Determine player tier from reputation or series entries
          let playerTier = 'entry'
          if (player.reputation >= 80) playerTier = 'elite'
          else if (player.reputation >= 60) playerTier = 'pro'
          else if (player.reputation >= 45) playerTier = 'professional'
          else if (player.reputation >= 30) playerTier = 'semi-pro'
          else if (player.reputation >= 15) playerTier = 'amateur'
          
          const listings = generateMarketplaceListings(
            careerState.currentWeek,
            careerState.currentYear,
            playerTier,
            ownedCarClassIds
          )
          
          set({
            careerState: {
              ...careerState,
              marketplaceListings: listings,
              marketplaceLastRefreshWeek: careerState.currentWeek,
              marketplaceLastRefreshYear: careerState.currentYear
            }
          })
          
          console.log('[Marketplace] Generated', listings.length, 'listings')
        })
      },
      
      purchaseFromMarketplace: (listingId: string, seriesId?: string, seriesName?: string, entryFee: number = 0) => {
        const { careerState, addTransaction, getManufacturerDiscount, updateManufacturerRelationship } = get()
        if (!careerState || !careerState.ownedTeam) return false
        
        const listing = careerState.marketplaceListings.find(l => l.id === listingId)
        if (!listing) {
          console.log('[Marketplace] Listing not found:', listingId)
          return false
        }
        
        // Get manufacturer discount
        const manufacturerId = listing.manufacturerId.toLowerCase().replace(/\s+/g, '-')
        const discount = getManufacturerDiscount(manufacturerId)
        
        // For auctions, use the player's winning bid (no discount on auctions)
        // For regular purchases, apply manufacturer discount
        let basePrice = listing.listingType === 'auction' 
          ? (listing.playerBid || listing.currentPrice)
          : listing.currentPrice
        
        const discountAmount = listing.listingType === 'auction' 
          ? 0 
          : Math.round(basePrice * discount.carDiscount)
        const price = basePrice - discountAmount
        
        const totalCost = price + entryFee
        
        if (discountAmount > 0) {
          console.log(`[Marketplace] Applied ${discount.tier} discount: -$${discountAmount} (${Math.round(discount.carDiscount * 100)}%)`)
        }
        
        if (careerState.ownedTeam.budgets.cash < totalCost) {
          console.log('[Marketplace] Insufficient funds')
          return false
        }
        
        // Determine series ID - use provided or from listing
        const targetSeriesId = seriesId || listing.seriesCompatible[0]
        const targetSeriesName = seriesName || targetSeriesId
        
        // Check if we already have max cars for this series
        const existingCarsInSeries = (careerState.cars || []).filter(c => c.seriesId === targetSeriesId)
        const maxCarsForSeries = getSeriesMaxTeamCars(targetSeriesId)
        if (existingCarsInSeries.length >= maxCarsForSeries) {
          console.log('[Marketplace] Max cars reached for series:', targetSeriesId, `(${maxCarsForSeries} max)`)
          return false
        }
        
        const isFirstCar = existingCarsInSeries.length === 0
        
        // Create new car from listing
        const newCar: TeamCar = {
          carId: `car_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          seriesId: targetSeriesId,
          chassisId: listing.carClassId,
          engineId: listing.carClassId,
          liveryName: listing.liveryName,
          liveryPath: listing.liveryPath,
          
          performance: listing.performance,
          reliability: listing.reliability,
          
          partWear: { ...listing.partWear },
          mileage: listing.mileage,
          
          serviceHistory: [...listing.serviceHistory],
          provenance: listing.provenance ? { ...listing.provenance } : undefined,
          installedUpgrades: [...listing.installedUpgrades],
          upgradeQueue: [],
          
          purchasePrice: price,
          purchaseType: listing.listingType,
          purchaseWeek: careerState.currentWeek,
          purchaseYear: careerState.currentYear,
          
          driverType: isFirstCar ? 'owner' : 'unassigned'
        }
        
        // Update budgets
        const updatedBudgets = {
          ...careerState.ownedTeam.budgets,
          cash: careerState.ownedTeam.budgets.cash - totalCost
        }
        
        // Create/update series entry if needed
        let updatedEntries = [...(careerState.seriesEntries || [])]
        const existingEntry = updatedEntries.find(e => e.seriesId === targetSeriesId)
        
        if (!existingEntry) {
          updatedEntries.push({
            seriesId: targetSeriesId,
            seriesName: targetSeriesName,
            carCount: 1,
            entryFee,
            worksCustomer: 'customer',
            status: 'active'
          })
        } else {
          updatedEntries = updatedEntries.map(e => 
            e.seriesId === targetSeriesId 
              ? { ...e, carCount: e.carCount + 1 }
              : e
          )
        }
        
        // Remove listing from marketplace
        const updatedListings = careerState.marketplaceListings.filter(l => l.id !== listingId)
        
        // Update state
        set({
          careerState: {
            ...careerState,
            ownedTeam: {
              ...careerState.ownedTeam,
              budgets: updatedBudgets
            },
            cars: [...(careerState.cars || []), newCar],
            seriesEntries: updatedEntries,
            marketplaceListings: updatedListings
          }
        })
        
        // Record transaction
        addTransaction({
          type: 'expense',
          category: 'equipment',
          amount: price,
          description: `Car purchase: ${listing.carClassName} (${listing.liveryName})`,
          date: new Date().toISOString(),
          week: careerState.currentWeek,
          year: careerState.currentYear
        })
        
        if (entryFee > 0) {
          addTransaction({
            type: 'expense',
            category: 'other',
            amount: entryFee,
            description: `Series entry fee: ${targetSeriesName}`,
            date: new Date().toISOString(),
            week: careerState.currentWeek,
            year: careerState.currentYear
          })
        }
        
        // Update manufacturer relationship (favor + purchase tracking)
        updateManufacturerRelationship(manufacturerId, 'purchase', price)
        
        // For used/auction cars, trigger technical inspection report email
        if (listing.listingType === 'used' || listing.listingType === 'auction') {
          // Delay slightly to ensure car is in state
          setTimeout(() => {
            get()._generateCarInspectionEmail(newCar, listing.carClassName, manufacturerId)
          }, 100)
        }
        
        console.log('[Marketplace] Purchased car:', listing.carClassName, 'for', price, discountAmount > 0 ? `(saved $${discountAmount})` : '')
        return true
      },
      
      placeBid: (listingId: string, bidAmount: number) => {
        const { careerState } = get()
        if (!careerState) return false
        
        const listingIndex = careerState.marketplaceListings.findIndex(l => l.id === listingId)
        if (listingIndex === -1) return false
        
        const listing = careerState.marketplaceListings[listingIndex]
        if (listing.listingType !== 'auction') return false
        
        const minimumBid = listing.currentBid 
          ? listing.currentBid + Math.max(1000, Math.round(listing.currentBid * 0.05))
          : listing.minimumBid || 0
        
        if (bidAmount < minimumBid) {
          console.log('[Marketplace] Bid too low. Minimum:', minimumBid)
          return false
        }
        
        // Update listing with player's bid
        const updatedListings = [...careerState.marketplaceListings]
        updatedListings[listingIndex] = {
          ...listing,
          playerBid: bidAmount,
          currentBid: bidAmount,
          bidCount: (listing.bidCount || 0) + 1,
          lastBidder: 'player'  // Track that player made the last bid
        }
        
        set({
          careerState: {
            ...careerState,
            marketplaceListings: updatedListings
          }
        })
        
        console.log('[Marketplace] Placed bid:', bidAmount, 'on', listing.carClassName)
        return true
      },
      
      processMarketplaceWeekly: () => {
        const { careerState, purchaseFromMarketplace } = get()
        if (!careerState) return { expiredListings: [], auctionResults: [] }
        
        const currentWeek = careerState.currentWeek
        const currentYear = careerState.currentYear
        const expiredListings: string[] = []
        const auctionResults: Array<{ listingId: string; won: boolean; price: number }> = []
        
        // Process each listing
        const updatedListings = careerState.marketplaceListings.filter(listing => {
          // Check if auction ended
          if (listing.listingType === 'auction') {
            const isEnded = listing.auctionEndYear! < currentYear ||
              (listing.auctionEndYear === currentYear && listing.auctionEndWeek! <= currentWeek)
            
            if (isEnded) {
              // Check if player won
              // Player wins if they have the highest bid (either lastBidder is 'player' 
              // or their bid matches/exceeds current bid and they were the last to bid at that amount)
              const playerWon = listing.playerBid && 
                listing.playerBid >= (listing.currentBid || 0) &&
                listing.lastBidder === 'player'
              
              if (playerWon) {
                auctionResults.push({ 
                  listingId: listing.id, 
                  won: true, 
                  price: listing.playerBid || listing.currentBid || 0 
                })
                console.log(`[Marketplace] Player won auction for ${listing.carClassName} at $${listing.playerBid?.toLocaleString()}`)
                
                // Send auction win confirmation via routing system
                routeNotification({
                  category: 'supply_chain',
                  subject: `Auction Won: ${listing.carClassName}`,
                  body: `**Congratulations!** You have won the auction for **${listing.carClassName}**.\n\n**Auction Details:**\n- Final Price: $${(listing.playerBid || listing.currentBid || 0).toLocaleString()}\n- Condition: ${listing.condition || 'Used'}\n- Livery: ${listing.liveryName || 'Default'}\n\nThe car has been added to your garage and is ready for preparation. Our technical team will conduct a full inspection and send you a detailed report shortly.`,
                  emailCategory: 'team'
                })
              } else {
                auctionResults.push({ 
                  listingId: listing.id, 
                  won: false, 
                  price: listing.currentBid || 0 
                })
                console.log(`[Marketplace] Player lost auction for ${listing.carClassName}. Winning bid: $${listing.currentBid?.toLocaleString()} by rival`)
              }
              return false // Remove ended auction
            }
            
            // Process rival bids
            // Higher chance when player is leading (60%), lower when no player bid (30%)
            const rivalBidChance = listing.playerBid ? 0.6 : 0.3
            const shouldRivalBid = Math.random() < rivalBidChance
            
            if (shouldRivalBid) {
              const currentBid = listing.currentBid || listing.minimumBid || 0
              
              // Rivals won't pay more than 15% above base price
              const maxRivalBid = listing.basePrice * 1.15
              
              if (currentBid < maxRivalBid) {
                // Bid increment: 5-15% of current bid (min $1,000)
                const bidIncrement = Math.round(currentBid * (0.05 + Math.random() * 0.1))
                const newBid = currentBid + Math.max(1000, bidIncrement)
                
                // Only bid if under max
                if (newBid <= maxRivalBid) {
                  const wasPlayerLeading = listing.lastBidder === 'player'
                  listing.currentBid = newBid
                  listing.bidCount = (listing.bidCount || 0) + 1
                  listing.lastBidder = 'rival'
                  console.log(`[Marketplace] Rival bid on ${listing.carClassName}: $${newBid.toLocaleString()}`)
                  
                  // If player was outbid, send notification via routing system
                  if (wasPlayerLeading && listing.playerBid) {
                    routeNotification({
                      category: 'supply_chain',
                      subject: `Outbid: ${listing.carClassName} Auction`,
                      body: `You have been **outbid** on the following auction:\n\n**${listing.carClassName}**\n- ${listing.liveryName}\n- Condition: ${listing.condition}\n\n**Auction Status:**\n- Your bid: $${listing.playerBid.toLocaleString()}\n- Current bid: $${newBid.toLocaleString()}\n- Minimum to win: $${Math.round(newBid * 1.05).toLocaleString()}\n- Auction ends: Week ${listing.auctionEndWeek}\n\nIf you wish to remain competitive, please place a higher bid before the auction closes.`,
                      emailCategory: 'team',
                      urgency: 'high'
                    })
                  }
                }
              }
            }
          }
          
          // Check if listing expired (used cars only, new cars refresh)
          if (listing.listingType === 'used') {
            const isExpired = listing.availableUntilYear < currentYear ||
              (listing.availableUntilYear === currentYear && listing.availableUntilWeek <= currentWeek)
            
            if (isExpired) {
              expiredListings.push(listing.id)
              return false
            }
          }
          
          return true
        })
        
        set({
          careerState: {
            ...careerState,
            marketplaceListings: updatedListings
          }
        })
        
        // Auto-purchase won auctions
        for (const result of auctionResults) {
          if (result.won) {
            // The listing is already removed, need to find compatible series
            // For now, just log - player needs to manually claim
            console.log('[Marketplace] Won auction:', result.listingId, 'for', result.price)
          }
        }
        
        return { expiredListings, auctionResults }
      },
      
      getMarketplaceListings: (filters?: { type?: MarketplaceListingType; classId?: string; condition?: CarCondition }) => {
        const { careerState } = get()
        if (!careerState) return []
        
        let listings = careerState.marketplaceListings || []
        
        if (filters) {
          if (filters.type) {
            listings = listings.filter(l => l.listingType === filters.type)
          }
          if (filters.classId) {
            listings = listings.filter(l => l.carClassId === filters.classId)
          }
          if (filters.condition) {
            listings = listings.filter(l => l.condition === filters.condition)
          }
        }
        
        return listings
      },
      
      // Generate a technical inspection report for a purchased car and send email
      _generateCarInspectionReport: (car: TeamCar, carClassName: string, manufacturerId: string) => {
        const { careerState, addEmail } = get()
        if (!careerState) return
        
        // Resolve Technical Department sender from team staff
        const allStaffForTech = [...(careerState.ownedTeam?.staff ?? []), ...(careerState.ownedTeam?.facilityStaff ?? [])]
        const techStaff = allStaffForTech.find((s: any) => {
          const role = ((s as any).role || '').toLowerCase()
          const specialty = ((s as any).specialty || '').toLowerCase()
          return role.includes('technical') || role.includes('engineering') || role.includes('chief_engineer') ||
                 specialty.includes('technical') || specialty.includes('engineering')
        })
        const techSenderName = (techStaff as any)?.name || 'Technical Department'
        const techSenderRole = techStaff ? 'Chief Engineer' : 'Technical Department'
        
        // Get manufacturer parts costs
        const normalizedManufacturerId = manufacturerId.toLowerCase().replace(/\s+/g, '-')
        const manufacturer = MANUFACTURERS[normalizedManufacturerId]
        const partsCosts: ManufacturerPartsCosts = manufacturer?.partsCosts || {
          engine: 10000, chassis: 8000, brakes: 2500, suspension: 3500, gearbox: 7000
        }
        
        // Analyze each part
        interface InspectionItem {
          part: keyof CarPartWear
          partName: string
          wear: number
          status: 'critical' | 'needs-attention' | 'fair' | 'good'
          estimatedRepairCost: number
          priority: 'immediate' | 'soon' | 'can-wait'
          notes: string
        }
        
        const getPartStatus = (wear: number): 'critical' | 'needs-attention' | 'fair' | 'good' => {
          if (wear >= 80) return 'critical'
          if (wear >= 50) return 'needs-attention'
          if (wear >= 25) return 'fair'
          return 'good'
        }
        
        const getPriority = (wear: number): 'immediate' | 'soon' | 'can-wait' => {
          if (wear >= 80) return 'immediate'
          if (wear >= 50) return 'soon'
          return 'can-wait'
        }
        
        const getPartNotes = (part: keyof CarPartWear, wear: number): string => {
          const status = getPartStatus(wear)
          const notesMap: Record<keyof CarPartWear, Record<string, string>> = {
            engine: {
              critical: 'Engine showing severe wear. Significant power loss expected. Replacement strongly recommended before racing.',
              'needs-attention': 'Engine wear approaching concerning levels. Schedule rebuild within 2-3 races.',
              fair: 'Engine in acceptable condition. Monitor oil consumption and temperatures.',
              good: 'Engine performing well. Standard maintenance schedule applies.'
            },
            chassis: {
              critical: 'Chassis integrity compromised. Safety inspection required before any track time.',
              'needs-attention': 'Minor structural fatigue detected. Consider reinforcement before endurance races.',
              fair: 'Chassis shows normal wear patterns. Regular inspection recommended.',
              good: 'Chassis in excellent condition. No immediate concerns.'
            },
            gearbox: {
              critical: 'Gearbox requires immediate attention. Risk of failure during race conditions.',
              'needs-attention': 'Synchros and bearings showing wear. Plan for rebuild soon.',
              fair: 'Gearbox functioning normally with minor wear. Monitor shift feel.',
              good: 'Transmission in great shape. Fluid change on standard schedule.'
            },
            brakes: {
              critical: 'Brake system critically worn. DO NOT race until replaced. Safety hazard.',
              'needs-attention': 'Pads and rotors nearing replacement threshold. Service before next event.',
              fair: 'Brakes adequate for several more sessions. Plan replacement parts.',
              good: 'Braking system in excellent condition.'
            },
            suspension: {
              critical: 'Suspension components beyond service life. Handling severely compromised.',
              'needs-attention': 'Dampers and bushings showing age. Will affect consistent lap times.',
              fair: 'Suspension performing adequately. Minor alignment adjustments may help.',
              good: 'Suspension geometry and components in optimal condition.'
            }
          }
          return notesMap[part][status]
        }
        
        // Calculate repair cost based on wear level
        const getRepairCost = (part: keyof CarPartWear, wear: number): number => {
          const baseCost = partsCosts[part]
          if (wear >= 80) return baseCost // Full replacement
          if (wear >= 50) return Math.round(baseCost * 0.6) // Major service
          if (wear >= 25) return Math.round(baseCost * 0.3) // Minor service
          return 0 // No immediate cost
        }
        
        const partNames: Record<keyof CarPartWear, string> = {
          engine: 'Engine',
          chassis: 'Chassis',
          gearbox: 'Gearbox',
          brakes: 'Brakes',
          suspension: 'Suspension'
        }
        
        const inspectionItems: InspectionItem[] = (Object.keys(car.partWear) as (keyof CarPartWear)[]).map(part => ({
          part,
          partName: partNames[part],
          wear: car.partWear[part],
          status: getPartStatus(car.partWear[part]),
          estimatedRepairCost: getRepairCost(part, car.partWear[part]),
          priority: getPriority(car.partWear[part]),
          notes: getPartNotes(part, car.partWear[part])
        }))
        
        // Sort by priority (immediate first)
        const priorityOrder = { immediate: 0, soon: 1, 'can-wait': 2 }
        inspectionItems.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
        
        // Calculate totals
        const immediateItems = inspectionItems.filter(i => i.priority === 'immediate')
        const soonItems = inspectionItems.filter(i => i.priority === 'soon')
        const avgWear = Object.values(car.partWear).reduce((sum, v) => sum + v, 0) / 5
        
        const immediateCost = immediateItems.reduce((sum, i) => sum + i.estimatedRepairCost, 0)
        const soonCost = soonItems.reduce((sum, i) => sum + i.estimatedRepairCost, 0)
        const totalEstimatedCost = inspectionItems.reduce((sum, i) => sum + i.estimatedRepairCost, 0)
        
        // Determine overall condition
        const overallCondition = avgWear >= 60 ? 'Poor' 
          : avgWear >= 40 ? 'Fair'
          : avgWear >= 20 ? 'Good'
          : 'Excellent'
        
        // Build email body
        const formatCurrency = (n: number) => `$${n.toLocaleString()}`
        
        let emailBody = `Hi,

Our technical team has completed a thorough inspection of your newly acquired **${carClassName}** (${car.liveryName || 'Team Livery'}).

## Overall Assessment
**Condition Rating:** ${overallCondition} (${Math.round(100 - avgWear)}% overall)
**Mileage:** ${car.mileage.toLocaleString()} km
**Reliability Rating:** ${car.reliability}%

---

## Component Analysis

`

        // Add each component's details
        for (const item of inspectionItems) {
          const statusEmoji = item.status === 'critical' ? '🔴' 
            : item.status === 'needs-attention' ? '🟡'
            : item.status === 'fair' ? '🟢'
            : '✅'
          
          emailBody += `### ${statusEmoji} ${item.partName}
**Wear Level:** ${Math.round(item.wear)}%
**Status:** ${item.status.replace('-', ' ').toUpperCase()}
**Priority:** ${item.priority.replace('-', ' ')}
${item.estimatedRepairCost > 0 ? `**Estimated Cost:** ${formatCurrency(item.estimatedRepairCost)}` : '**Cost:** No immediate service needed'}

${item.notes}

`
        }

        emailBody += `---

## Cost Summary

`
        
        if (immediateItems.length > 0) {
          emailBody += `**⚠️ IMMEDIATE (Before Racing):** ${formatCurrency(immediateCost)}
${immediateItems.map(i => `  • ${i.partName}: ${formatCurrency(i.estimatedRepairCost)}`).join('\n')}

`
        }
        
        if (soonItems.length > 0) {
          emailBody += `**📋 RECOMMENDED (Within 2-4 Races):** ${formatCurrency(soonCost)}
${soonItems.map(i => `  • ${i.partName}: ${formatCurrency(i.estimatedRepairCost)}`).join('\n')}

`
        }
        
        emailBody += `**Total Estimated Repair/Service Cost:** ${formatCurrency(totalEstimatedCost)}

---

## Recommendations

`
        
        if (immediateItems.length > 0) {
          emailBody += `The car **should not be raced** until the critical issues are addressed. We recommend a full service before the car sees any track time.

`
        } else if (soonItems.length > 0) {
          emailBody += `The car is **safe to race** but we recommend scheduling service soon to maintain optimal performance and reliability.

`
        } else {
          emailBody += `The car is in **excellent condition** and ready for competition. Standard maintenance schedule applies.

`
        }
        
        emailBody += `Please let us know if you'd like to schedule any service work. The garage team is standing by.

Best regards,
${techSenderName}`

        // Send the email
        addEmail({
          category: 'team',
          subject: `Technical Inspection Complete: ${carClassName}`,
          sender: techSenderName,
          senderRole: techSenderRole,
          preview: `Our inspection of your ${carClassName} is complete. ${immediateItems.length > 0 ? 'CRITICAL ISSUES FOUND requiring attention.' : 'Car ready for service.'}`,
          body: emailBody,
          receivedDay: careerState.currentDay,
          receivedWeek: careerState.currentWeek,
          receivedYear: careerState.currentYear,
          read: false,
          starred: immediateItems.length > 0, // Auto-star if critical issues
          archived: false,
          actionType: 'acknowledge',
          actionData: {
            carId: car.carId,
            inspectionResults: {
              overallCondition,
              immediateCost,
              soonCost,
              totalCost: totalEstimatedCost,
              criticalParts: immediateItems.map(i => i.part),
              avgWear: Math.round(avgWear)
            }
          }
        })
        
        console.log(`[Inspection] Generated inspection report for ${carClassName}, condition: ${overallCondition}, total cost: ${formatCurrency(totalEstimatedCost)}`)
      },
      
      // Generate car inspection report and send email for used/auction car purchases
      _generateCarInspectionEmail: (car: TeamCar, carClassName: string, manufacturerId: string) => {
        const { careerState, addEmail } = get()
        if (!careerState) return
        
        // Resolve Technical Department sender from team staff
        const allStaffForInspection = [...(careerState.ownedTeam?.staff ?? []), ...(careerState.ownedTeam?.facilityStaff ?? [])]
        const techStaffInspection = allStaffForInspection.find((s: any) => {
          const role = ((s as any).role || '').toLowerCase()
          const specialty = ((s as any).specialty || '').toLowerCase()
          return role.includes('technical') || role.includes('engineering') || role.includes('chief_engineer') ||
                 specialty.includes('technical') || specialty.includes('engineering')
        })
        const inspectionSenderName = (techStaffInspection as any)?.name || 'Technical Department'
        const inspectionSenderRole = techStaffInspection ? 'Chief Engineer' : 'Technical Department'
        
        // Get manufacturer parts costs or use defaults
        const normalizedManufacturerId = manufacturerId.toLowerCase().replace(/\s+/g, '-')
        const manufacturer = MANUFACTURERS[normalizedManufacturerId]
        const partsCosts: ManufacturerPartsCosts = manufacturer?.partsCosts || {
          engine: 12000, chassis: 10000, brakes: 3000, suspension: 4000, gearbox: 8000
        }
        
        // Analyze each part
        interface InspectionItem {
          part: keyof CarPartWear
          partName: string
          wear: number
          status: 'critical' | 'needs-attention' | 'fair' | 'good'
          estimatedRepairCost: number
          priority: 'immediate' | 'soon' | 'can-wait'
          notes: string
        }
        
        const partNames: Record<keyof CarPartWear, string> = {
          engine: 'Engine',
          chassis: 'Chassis',
          gearbox: 'Gearbox',
          brakes: 'Brakes',
          suspension: 'Suspension'
        }
        
        const inspectionItems: InspectionItem[] = []
        let totalImmediateCost = 0
        let totalRecommendedCost = 0
        
        for (const [part, wear] of Object.entries(car.partWear) as [keyof CarPartWear, number][]) {
          const partCost = partsCosts[part]
          
          // Determine status and priority based on wear
          let status: InspectionItem['status']
          let priority: InspectionItem['priority']
          let notes: string
          let repairCost: number
          
          if (wear >= 80) {
            status = 'critical'
            priority = 'immediate'
            notes = 'Requires immediate replacement before racing. Risk of failure and DNF.'
            repairCost = partCost // Full replacement
            totalImmediateCost += repairCost
          } else if (wear >= 60) {
            status = 'needs-attention'
            priority = 'soon'
            notes = 'Recommend servicing within 2-3 races. Performance affected.'
            repairCost = Math.round(partCost * 0.6) // Refurbishment
            totalRecommendedCost += repairCost
          } else if (wear >= 30) {
            status = 'fair'
            priority = 'can-wait'
            notes = 'Acceptable condition. Monitor during season.'
            repairCost = Math.round(partCost * 0.3) // Minor service
          } else {
            status = 'good'
            priority = 'can-wait'
            notes = 'Good condition. No immediate action required.'
            repairCost = 0
          }
          
          inspectionItems.push({
            part,
            partName: partNames[part],
            wear,
            status,
            estimatedRepairCost: repairCost,
            priority,
            notes
          })
        }
        
        // Sort by priority (immediate first)
        const priorityOrder = { immediate: 0, soon: 1, 'can-wait': 2 }
        inspectionItems.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
        
        // Calculate overall condition
        const avgWear = Object.values(car.partWear).reduce((sum, w) => sum + w, 0) / 5
        const overallCondition = avgWear < 20 ? 'Excellent' : avgWear < 40 ? 'Good' : avgWear < 60 ? 'Fair' : 'Poor'
        
        // Build email body
        const immediateItems = inspectionItems.filter(i => i.priority === 'immediate')
        const soonItems = inspectionItems.filter(i => i.priority === 'soon')
        const okItems = inspectionItems.filter(i => i.priority === 'can-wait')
        
        let emailBody = `Hi,

Our technical team has completed a thorough inspection of your newly acquired **${carClassName}** (${car.liveryName || 'Team Livery'}).

## Overall Assessment
**Condition:** ${overallCondition}
**Mileage:** ${car.mileage.toLocaleString()} km
**Reliability Rating:** ${car.reliability}%
**Performance Rating:** ${car.performance}%

---

## Component Analysis

`
        
        // Add immediate repairs section
        if (immediateItems.length > 0) {
          emailBody += `### ⚠️ IMMEDIATE REPAIRS REQUIRED (Before Racing)\n\n`
          for (const item of immediateItems) {
            emailBody += `**${item.partName}** - ${item.wear}% worn (CRITICAL)\n`
            emailBody += `- ${item.notes}\n`
            emailBody += `- Estimated cost: $${item.estimatedRepairCost.toLocaleString()}\n\n`
          }
          emailBody += `**Total Immediate Repairs:** $${totalImmediateCost.toLocaleString()}\n\n---\n\n`
        }
        
        // Add recommended repairs section
        if (soonItems.length > 0) {
          emailBody += `### 🔧 Recommended Repairs (Within 2-4 Weeks)\n\n`
          for (const item of soonItems) {
            emailBody += `**${item.partName}** - ${item.wear}% worn\n`
            emailBody += `- ${item.notes}\n`
            emailBody += `- Estimated cost: $${item.estimatedRepairCost.toLocaleString()}\n\n`
          }
          emailBody += `**Total Recommended Repairs:** $${totalRecommendedCost.toLocaleString()}\n\n---\n\n`
        }
        
        // Add items in acceptable condition
        if (okItems.length > 0) {
          emailBody += `### ✓ Components in Acceptable Condition\n\n`
          for (const item of okItems) {
            emailBody += `**${item.partName}** - ${item.wear}% worn (${item.status.toUpperCase()})\n`
            emailBody += `- ${item.notes}\n\n`
          }
        }
        
        // Add summary
        emailBody += `---

## Cost Summary

| Category | Estimated Cost |
|----------|----------------|
| Immediate Repairs | $${totalImmediateCost.toLocaleString()} |
| Recommended Repairs | $${totalRecommendedCost.toLocaleString()} |
| **Total to Race-Ready** | **$${(totalImmediateCost + totalRecommendedCost).toLocaleString()}** |

${totalImmediateCost > 0 ? '\n⚠️ **Warning:** The car cannot be safely raced until immediate repairs are completed. Risk of mechanical failure and DNF is very high.\n' : ''}
${car.provenance ? `\n## Previous History\n- Previous owners: ${car.provenance.previousOwners}\n${car.provenance.raceHistory ? `- Race history: ${car.provenance.raceHistory.races} races, ${car.provenance.raceHistory.wins} wins, ${car.provenance.raceHistory.dnfs} DNFs\n` : ''}${car.provenance.accidentHistory ? `- Accident history: ${car.provenance.accidentHistory} recorded incidents\n` : ''}` : ''}

Please review this report and schedule any necessary repairs through the Garage.

Best regards,
**${inspectionSenderName}**
${careerState.ownedTeam?.name || 'Your Team'}`
        
        // Send email
        addEmail({
          category: 'team',
          subject: `Technical Inspection Complete: ${carClassName}`,
          sender: inspectionSenderName,
          senderRole: inspectionSenderRole,
          preview: `Inspection report for your ${carClassName}. Overall condition: ${overallCondition}. ${totalImmediateCost > 0 ? `Immediate repairs needed: $${totalImmediateCost.toLocaleString()}` : 'No immediate repairs needed.'}`,
          body: emailBody,
          receivedDay: careerState.currentDay,
          receivedWeek: careerState.currentWeek,
          receivedYear: careerState.currentYear,
          read: false,
          starred: totalImmediateCost > 0, // Star if urgent repairs needed
          archived: false,
          actionType: 'acknowledge',
          actionData: { 
            carId: car.carId,
            immediateRepairCost: totalImmediateCost,
            recommendedRepairCost: totalRecommendedCost
          }
        })
        
        console.log(`[Marketplace] Generated inspection report for ${carClassName}. Immediate repairs: $${totalImmediateCost}`)
      },
      
      // Send critical wear warning email after race when parts exceed 80%
      _sendCriticalWearWarning: (car: TeamCar, criticalParts: (keyof CarPartWear)[], currentWear: CarPartWear) => {
        const { careerState, addEmail } = get()
        if (!careerState) return
        
        // Resolve Technical Department sender from team staff
        const allStaffForWear = [...(careerState.ownedTeam?.staff ?? []), ...(careerState.ownedTeam?.facilityStaff ?? [])]
        const techStaffWear = allStaffForWear.find((s: any) => {
          const role = ((s as any).role || '').toLowerCase()
          const specialty = ((s as any).specialty || '').toLowerCase()
          return role.includes('technical') || role.includes('engineering') || role.includes('chief_engineer') ||
                 specialty.includes('technical') || specialty.includes('engineering')
        })
        const wearSenderName = (techStaffWear as any)?.name || 'Technical Department'
        const wearSenderRole = techStaffWear ? 'Chief Engineer' : 'Technical Department'
        
        const partNames: Record<keyof CarPartWear, string> = {
          engine: 'Engine',
          chassis: 'Chassis',
          gearbox: 'Gearbox',
          brakes: 'Brakes',
          suspension: 'Suspension'
        }
        
        // Get manufacturer parts costs for repair estimates
        const normalizedManufacturerId = car.chassisId?.toLowerCase().replace(/\s+/g, '-') || ''
        const manufacturer = MANUFACTURERS[normalizedManufacturerId]
        const partsCosts: ManufacturerPartsCosts = manufacturer?.partsCosts || {
          engine: 12000, chassis: 10000, brakes: 3000, suspension: 4000, gearbox: 8000
        }
        
        // Build critical parts list with costs
        let totalRepairCost = 0
        const criticalDetails = criticalParts.map(part => {
          const cost = partsCosts[part]
          totalRepairCost += cost
          return {
            part,
            name: partNames[part],
            wear: Math.round(currentWear[part]),
            cost
          }
        })
        
        // Determine severity
        const maxWear = Math.max(...criticalParts.map(p => currentWear[p]))
        const severity = maxWear >= 95 ? 'CRITICAL' : maxWear >= 90 ? 'URGENT' : 'WARNING'
        const failureRisk = maxWear >= 95 ? 'very high' : maxWear >= 90 ? 'high' : 'elevated'
        
        const emailBody = `Hi,

**${severity}: Critical Component Wear Detected**

Following our post-race analysis, we have identified components on your **${car.liveryName || 'Race Car'}** that have reached critical wear levels and require immediate attention.

---

## Components Requiring Immediate Service

${criticalDetails.map(d => `### ${d.name}
- **Current Wear:** ${d.wear}%
- **Status:** ${d.wear >= 95 ? '🔴 CRITICAL - Failure imminent' : d.wear >= 90 ? '🟠 URGENT - High risk of failure' : '🟡 WARNING - Service required'}
- **Estimated Replacement Cost:** $${d.cost.toLocaleString()}
`).join('\n')}

---

## Risk Assessment

**Overall Risk:** The car currently has a **${failureRisk} risk of mechanical failure** if raced in its current condition.

${maxWear >= 90 ? `⚠️ **RACING NOT RECOMMENDED** - There is a significant chance of DNF due to mechanical failure. We strongly advise servicing before the next race.\n` : ''}

## Cost Summary

| Service | Cost |
|---------|------|
${criticalDetails.map(d => `| ${d.name} Replacement | $${d.cost.toLocaleString()} |`).join('\n')}
| **Total Estimated** | **$${totalRepairCost.toLocaleString()}** |

---

Please schedule repairs through the Garage as soon as possible.

Best regards,
**${wearSenderName}**
${careerState.ownedTeam?.name || 'Your Team'}`
        
        addEmail({
          category: 'team',
          subject: `${severity}: Critical Wear on ${car.liveryName || 'Race Car'}`,
          sender: wearSenderName,
          senderRole: wearSenderRole,
          preview: `${criticalDetails.length} component(s) at critical wear: ${criticalParts.map(p => partNames[p]).join(', ')}. Estimated repair: $${totalRepairCost.toLocaleString()}.`,
          body: emailBody,
          receivedDay: careerState.currentDay,
          receivedWeek: careerState.currentWeek,
          receivedYear: careerState.currentYear,
          read: false,
          starred: maxWear >= 90, // Star if urgent or critical
          archived: false,
          actionType: 'acknowledge',
          actionData: {
            carId: car.carId,
            criticalParts,
            estimatedRepairCost: totalRepairCost
          }
        })
        
        console.log(`[CareerStore] Critical wear warning sent: ${criticalParts.map(p => partNames[p]).join(', ')} on ${car.liveryName}`)
      },
      
      serviceCar: (carId: string, serviceType: 'full' | 'partial') => {
        const { careerState, addTransaction } = get()
        if (!careerState || !careerState.ownedTeam) return null
        
        const carIndex = (careerState.cars || []).findIndex(c => c.carId === carId)
        if (carIndex === -1) return null
        
        const car = careerState.cars![carIndex]
        
        // Calculate service cost based on car value and service type
        const baseCost = car.purchasePrice * (serviceType === 'full' ? 0.05 : 0.02)
        const cost = Math.round(Math.max(1000, baseCost))
        
        if (careerState.ownedTeam.budgets.cash < cost) {
          console.log('[Service] Insufficient funds')
          return null
        }
        
        // Determine parts to service
        const partsServiced: (keyof CarPartWear)[] = serviceType === 'full'
          ? ['engine', 'chassis', 'gearbox', 'brakes', 'suspension']
          : ['brakes', 'suspension'] // Partial only does wear items
        
        // Reset wear for serviced parts
        const newWear = { ...car.partWear }
        for (const part of partsServiced) {
          newWear[part] = Math.max(0, newWear[part] - (serviceType === 'full' ? 80 : 30))
        }
        
        // Create service record
        const serviceRecord: CarServiceRecord = {
          week: careerState.currentWeek,
          year: careerState.currentYear,
          type: serviceType,
          cost,
          partsReplaced: partsServiced,
          description: serviceType === 'full' 
            ? 'Full service - all major components inspected and serviced'
            : 'Partial service - routine maintenance'
        }
        
        // Calculate new reliability
        const avgWear = Object.values(newWear).reduce((sum, v) => sum + v, 0) / 5
        const newReliability = Math.max(40, Math.round(100 - avgWear * 0.6))
        
        // Update car
        const updatedCars = [...careerState.cars!]
        updatedCars[carIndex] = {
          ...car,
          partWear: newWear,
          reliability: newReliability,
          serviceHistory: [serviceRecord, ...car.serviceHistory],
          lastServiceWeek: careerState.currentWeek,
          lastServiceYear: careerState.currentYear
        }
        
        // Update budgets
        const updatedBudgets = {
          ...careerState.ownedTeam.budgets,
          cash: careerState.ownedTeam.budgets.cash - cost
        }
        
        set({
          careerState: {
            ...careerState,
            ownedTeam: {
              ...careerState.ownedTeam,
              budgets: updatedBudgets
            },
            cars: updatedCars
          }
        })
        
        addTransaction({
          type: 'expense',
          category: 'equipment',
          amount: cost,
          description: `Car service (${serviceType}): ${car.liveryName || car.chassisId}`,
          date: new Date().toISOString(),
          week: careerState.currentWeek,
          year: careerState.currentYear
        })
        
        console.log('[Service] Serviced car:', car.carId, 'cost:', cost)
        return { cost, partsServiced }
      },
      
      serviceCarGranular: (carId: string, partSelections: PartServiceSelection[]) => {
        const { careerState, addTransaction } = get()
        if (!careerState || !careerState.ownedTeam) return null
        if (partSelections.length === 0) return null
        
        const carIndex = (careerState.cars || []).findIndex(c => c.carId === carId)
        if (carIndex === -1) return null
        
        const car = careerState.cars![carIndex]
        const tier = careerState.ownedTeam.tier || 'amateur'
        
        // Calculate tier multiplier for costs
        const tierMultipliers: Record<string, number> = {
          entry: 0.5,
          amateur: 0.75,
          semi_pro: 1.0,
          professional: 1.5,
          elite: 2.5,
          pinnacle: 5.0
        }
        const tierMultiplier = tierMultipliers[tier] || 1.0
        
        // Calculate total cost based on selected parts and service levels
        let totalCost = 0
        const newWear = { ...car.partWear }
        
        for (const selection of partSelections) {
          const baseCost = PART_BASE_COSTS[selection.part]
          const levelConfig = SERVICE_LEVEL_CONFIG[selection.level]
          const partCost = Math.round(baseCost * levelConfig.costMultiplier * tierMultiplier)
          totalCost += partCost
          
          // Apply wear reduction
          const currentWear = newWear[selection.part]
          if (selection.level === 'rebuild') {
            newWear[selection.part] = 0 // Reset to 0%
          } else {
            newWear[selection.part] = Math.max(0, currentWear - levelConfig.wearReduction)
          }
        }
        
        // Check if team can afford it
        if (careerState.ownedTeam.budgets.cash < totalCost) {
          console.log('[ServiceGranular] Insufficient funds:', careerState.ownedTeam.budgets.cash, '<', totalCost)
          return null
        }
        
        // Create service record
        const partsServiced = partSelections.map(s => s.part)
        const serviceDescription = partSelections
          .map(s => `${s.part}: ${SERVICE_LEVEL_CONFIG[s.level].label}`)
          .join(', ')
        
        const serviceRecord: CarServiceRecord = {
          week: careerState.currentWeek,
          year: careerState.currentYear,
          type: 'granular',
          cost: totalCost,
          partsReplaced: partsServiced,
          partServices: partSelections,
          description: `Granular service - ${serviceDescription}`
        }
        
        // Calculate new reliability
        const avgWear = Object.values(newWear).reduce((sum, v) => sum + v, 0) / 5
        const newReliability = Math.max(40, Math.round(100 - avgWear * 0.6))
        
        // Update car
        const updatedCars = [...careerState.cars!]
        updatedCars[carIndex] = {
          ...car,
          partWear: newWear,
          reliability: newReliability,
          serviceHistory: [serviceRecord, ...car.serviceHistory],
          lastServiceWeek: careerState.currentWeek,
          lastServiceYear: careerState.currentYear
        }
        
        // Update budgets
        const updatedBudgets = {
          ...careerState.ownedTeam.budgets,
          cash: careerState.ownedTeam.budgets.cash - totalCost
        }
        
        set({
          careerState: {
            ...careerState,
            ownedTeam: {
              ...careerState.ownedTeam,
              budgets: updatedBudgets
            },
            cars: updatedCars
          }
        })
        
        addTransaction({
          type: 'expense',
          category: 'equipment',
          amount: totalCost,
          description: `Car service (granular): ${car.liveryName || car.chassisId}`,
          date: new Date().toISOString(),
          week: careerState.currentWeek,
          year: careerState.currentYear
        })
        
        console.log('[ServiceGranular] Serviced car:', car.carId, 'parts:', partsServiced, 'cost:', totalCost)
        return { cost: totalCost, partsServiced: partSelections }
      },
      
      // ===========================================
      // MANUFACTURER RELATIONSHIP FUNCTIONS
      // ===========================================
      
      getManufacturerRelationship: (manufacturerId: string) => {
        const { careerState } = get()
        if (!careerState) return null
        
        return careerState.manufacturerRelationships[manufacturerId] || {
          favor: 0,
          totalPurchases: 0,
          totalSpent: 0,
          lastInteractionWeek: 0,
          lastInteractionYear: 0
        }
      },
      
      getManufacturerDiscount: (manufacturerId: string) => {
        const { careerState } = get()
        if (!careerState) return { carDiscount: 0, partsDiscount: 0, tier: 'none' as const }
        
        const relationship = careerState.manufacturerRelationships[manufacturerId]
        if (!relationship) return { carDiscount: 0, partsDiscount: 0, tier: 'none' as const }
        
        const favor = relationship.favor
        
        // Favor tiers and discounts
        if (favor >= 90) return { carDiscount: 0.20, partsDiscount: 0.15, tier: 'platinum' as const }
        if (favor >= 75) return { carDiscount: 0.15, partsDiscount: 0.10, tier: 'gold' as const }
        if (favor >= 50) return { carDiscount: 0.10, partsDiscount: 0.05, tier: 'silver' as const }
        if (favor >= 25) return { carDiscount: 0.05, partsDiscount: 0, tier: 'bronze' as const }
        
        return { carDiscount: 0, partsDiscount: 0, tier: 'none' as const }
      },
      
      updateManufacturerRelationship: (
        manufacturerId: string, 
        interactionType: 'purchase' | 'parts' | 'race_win' | 'race_podium', 
        amount?: number
      ) => {
        const { careerState } = get()
        if (!careerState) return
        
        const currentRelationship = careerState.manufacturerRelationships[manufacturerId] || {
          favor: 0,
          totalPurchases: 0,
          totalSpent: 0,
          lastInteractionWeek: 0,
          lastInteractionYear: 0
        }
        
        let favorGain = 0
        let purchaseIncrease = 0
        let spentIncrease = amount || 0
        
        switch (interactionType) {
          case 'purchase':
            favorGain = 15 // Buying a car gives significant favor
            purchaseIncrease = 1
            break
          case 'parts':
            favorGain = 3 // Buying parts gives small favor
            break
          case 'race_win':
            favorGain = 5 // Winning in their car
            spentIncrease = 0
            break
          case 'race_podium':
            favorGain = 2 // Podium in their car
            spentIncrease = 0
            break
        }
        
        const updatedRelationship: ManufacturerRelationship = {
          favor: Math.min(100, currentRelationship.favor + favorGain),
          totalPurchases: currentRelationship.totalPurchases + purchaseIncrease,
          totalSpent: currentRelationship.totalSpent + spentIncrease,
          lastInteractionWeek: careerState.currentWeek,
          lastInteractionYear: careerState.currentYear
        }
        
        set({
          careerState: {
            ...careerState,
            manufacturerRelationships: {
              ...careerState.manufacturerRelationships,
              [manufacturerId]: updatedRelationship
            }
          }
        })
        
        console.log(`[Manufacturer] Updated relationship with ${manufacturerId}: +${favorGain} favor (now ${updatedRelationship.favor})`)
      },
      
      decayManufacturerFavor: () => {
        const { careerState } = get()
        if (!careerState) return
        
        const currentWeek = careerState.currentWeek
        const currentYear = careerState.currentYear
        
        const updatedRelationships = { ...careerState.manufacturerRelationships }
        let decayCount = 0
        
        for (const [manufacturerId, relationship] of Object.entries(updatedRelationships)) {
          // Calculate weeks since last interaction
          const yearDiff = currentYear - relationship.lastInteractionYear
          const weekDiff = currentWeek - relationship.lastInteractionWeek + (yearDiff * 52)
          
          // Decay 1 favor per 4 weeks of inactivity (after initial 4 week grace period)
          if (weekDiff >= 8 && relationship.favor > 0) {
            const decayAmount = Math.floor((weekDiff - 4) / 4)
            updatedRelationships[manufacturerId] = {
              ...relationship,
              favor: Math.max(0, relationship.favor - decayAmount)
            }
            if (decayAmount > 0) decayCount++
          }
        }
        
        if (decayCount > 0) {
          set({
            careerState: {
              ...careerState,
              manufacturerRelationships: updatedRelationships
            }
          })
          console.log(`[Manufacturer] Decayed favor for ${decayCount} manufacturers`)
        }
      },
      
      // ============================================
      // FACILITY STAFF MANAGEMENT
      // ============================================
      
      refreshFacilityStaffMarket: () => {
        const { careerState } = get()
        if (!careerState?.ownedTeam) return
        
        const tier = careerState.ownedTeam.tier || 'amateur'
        let worldPool = [...(careerState.worldStaffPool || [])]
        
        // Initialize world pool if it doesn't exist yet
        if (worldPool.length === 0) {
          const currentYear = careerState.currentYear || new Date().getFullYear()
          worldPool = generateWorldStaffPool(currentYear, tier)
          console.log(`[Facility Staff] Initialized world pool with ${worldPool.length} members`)
        }
        
        // Filter available staff from the world pool for the market view
        const availableStaff = worldPool
          .filter(m => m.status === 'available')
          .map(m => m.staff)
          .sort((a, b) => b.reputation - a.reputation)
        
        // If very few available, add some fresh graduates to the pool
        if (availableStaff.length < 20) {
          const facilityRoles: FacilityStaffRole[] = ['aerodynamicist', 'structural_engineer', 'power_unit_engineer', 'simulation_specialist', 'junior_engineer', 'senior_engineer']
          const teamRoles: FacilityConfigTeamStaffRole[] = ['race_engineer', 'data_analyst', 'crew_chief', 'strategist']
          
          const needed = 20 - availableStaff.length
          for (let i = 0; i < needed; i++) {
            if (Math.random() < 0.6) {
              const role = facilityRoles[Math.floor(Math.random() * facilityRoles.length)]
              const staff = generateFacilityStaff(role, tier, true)
              worldPool.push({
                staff,
                status: 'available',
                enteredPoolYear: careerState.currentYear || new Date().getFullYear(),
                retirementAge: 55 + Math.floor(Math.random() * 14)
              })
              availableStaff.push(staff)
            } else {
              const role = teamRoles[Math.floor(Math.random() * teamRoles.length)]
              const staff = generateTeamStaff(role, tier, true)
              worldPool.push({
                staff,
                status: 'available',
                enteredPoolYear: careerState.currentYear || new Date().getFullYear(),
                retirementAge: 55 + Math.floor(Math.random() * 14)
              })
              availableStaff.push(staff)
            }
          }
        }
        
        set({
          careerState: {
            ...careerState,
            facilityStaffMarket: availableStaff,
            facilityStaffMarketLastRefreshWeek: careerState.currentWeek,
            facilityStaffMarketLastRefreshYear: careerState.currentYear,
            worldStaffPool: worldPool
          }
        })
        
        console.log(`[Facility Staff] Refreshed market: ${availableStaff.length} available from pool of ${worldPool.length}`)
      },
      
      hireFacilityStaff: (staffId: string) => {
        const { careerState } = get()
        if (!careerState?.ownedTeam) {
          return { success: false, error: 'No team owned' }
        }
        
        // Find staff in market
        const staffMember = careerState.facilityStaffMarket.find(s => s.id === staffId)
        if (!staffMember) {
          return { success: false, error: 'Staff member not found in market' }
        }
        
        // Calculate signing bonus (cast to FacilityStaffMember since contract cost calculation uses same fields)
        const signingBonus = calculateContractCost(staffMember as FacilityStaffMember)
        const cash = careerState.ownedTeam.budgets?.cash || 0
        
        if (cash < signingBonus) {
          return { success: false, error: `Insufficient funds for signing bonus ($${signingBonus.toLocaleString()} required)` }
        }
        
        // Create hired staff member (works for both facility and team staff)
        const isTeamStaff = 'staffCategory' in staffMember && staffMember.staffCategory === 'team'
        const teamStaff = staffMember as TeamStaffMember
        
        const hiredStaff = {
          ...staffMember,
          hiredWeek: careerState.currentWeek,
          hiredYear: careerState.currentYear,
          contractEndYear: careerState.currentYear + staffMember.contractYears,
          morale: 70 + Math.floor(Math.random() * 20), // 70-90 initial morale
          // Preserve team staff specific fields if applicable
          ...(isTeamStaff ? {
            racesWorked: teamStaff.racesWorked,
            championshipsWon: teamStaff.championshipsWon
          } : {})
        } as HiredFacilityStaff
        
        // Update state
        const updatedTeam = {
          ...careerState.ownedTeam,
          facilityStaff: [...(careerState.ownedTeam.facilityStaff || []), hiredStaff],
          budgets: {
            ...careerState.ownedTeam.budgets,
            cash: cash - signingBonus
          }
        }
        
        // Remove from market
        const updatedMarket = careerState.facilityStaffMarket.filter(s => s.id !== staffId)
        
        // Update world pool: mark this staff member as employed by player
        const updatedWorldPool = (careerState.worldStaffPool || []).map(m => 
          m.staff.id === staffId 
            ? { ...m, status: 'employed_player' as const, employedBy: careerState.ownedTeam?.name || 'Player Team' }
            : m
        )
        
        // Create transaction
        const transaction = createTeamTransaction(
          'expense',
          'salaries',
          signingBonus,
          `Signed ${staffMember.name} (${staffMember.role.replace('_', ' ')}) - Signing Bonus`,
          careerState.currentWeek,
          careerState.currentYear
        )
        
        set({
          careerState: {
            ...careerState,
            ownedTeam: {
              ...updatedTeam,
              finances: {
                ...updatedTeam.finances,
                transactions: [...(updatedTeam.finances?.transactions || []), transaction]
              }
            },
            facilityStaffMarket: updatedMarket,
            worldStaffPool: updatedWorldPool
          }
        })
        
        console.log(`[Facility Staff] Hired ${staffMember.name} for $${signingBonus.toLocaleString()} signing bonus`)
        return { success: true, staff: hiredStaff }
      },
      
      fireFacilityStaff: (staffId: string) => {
        const { careerState } = get()
        if (!careerState?.ownedTeam) {
          return { success: false, error: 'No team owned' }
        }
        
        const staffIndex = careerState.ownedTeam.facilityStaff?.findIndex(s => s.id === staffId) ?? -1
        if (staffIndex === -1) {
          return { success: false, error: 'Staff member not found' }
        }
        
        const staffMember = careerState.ownedTeam.facilityStaff![staffIndex]
        
        // Calculate severance (2 weeks salary)
        const severance = staffMember.salary * 2
        const cash = careerState.ownedTeam.budgets?.cash || 0
        
        if (cash < severance) {
          return { success: false, error: `Insufficient funds for severance ($${severance.toLocaleString()} required)` }
        }
        
        // Remove from player's team
        const updatedFacilityStaff = [...careerState.ownedTeam.facilityStaff!]
        updatedFacilityStaff.splice(staffIndex, 1)
        
        // Update world pool: set this staff to cooldown (4-8 weeks before re-entering market)
        const cooldownWeeks = 4 + Math.floor(Math.random() * 5) // 4-8 weeks
        const updatedWorldPool = (careerState.worldStaffPool || []).map(m => 
          m.staff.id === staffId 
            ? { ...m, status: 'cooldown' as const, employedBy: undefined, cooldownWeeksRemaining: cooldownWeeks }
            : m
        )
        
        // Create transaction
        const transaction = createTeamTransaction(
          'expense',
          'salaries',
          severance,
          `Terminated ${staffMember.name} - Severance Pay`,
          careerState.currentWeek,
          careerState.currentYear
        )
        
        set({
          careerState: {
            ...careerState,
            ownedTeam: {
              ...careerState.ownedTeam,
              facilityStaff: updatedFacilityStaff,
              budgets: {
                ...careerState.ownedTeam.budgets,
                cash: cash - severance
              },
              finances: {
                ...careerState.ownedTeam.finances,
                transactions: [...(careerState.ownedTeam.finances?.transactions || []), transaction]
              }
            },
            worldStaffPool: updatedWorldPool
          }
        })
        
        console.log(`[Facility Staff] Terminated ${staffMember.name}, severance: $${severance.toLocaleString()}, cooldown: ${cooldownWeeks} weeks`)
        return { success: true }
      },
      
      assignFacilityStaffToFacility: (staffId: string, facilityType: FacilityType) => {
        const { careerState } = get()
        if (!careerState?.ownedTeam) {
          return { success: false, error: 'No team owned' }
        }
        
        const staffIndex = careerState.ownedTeam.facilityStaff?.findIndex(s => s.id === staffId) ?? -1
        if (staffIndex === -1) {
          return { success: false, error: 'Staff member not found' }
        }
        
        // Check if facility has slots available
        const facilityState = careerState.ownedTeam.facilities?.[facilityType]
        const facilityLevel = facilityState?.level || 1
        const levelConfig = getFacilityLevelConfig(facilityLevel)
        const currentlyAssigned = careerState.ownedTeam.facilityStaff?.filter(
          s => s.assignedFacility === facilityType
        ).length || 0
        
        if (currentlyAssigned >= levelConfig.staffSlots) {
          return { success: false, error: `${FACILITY_NAMES[facilityType]} has no available slots (${currentlyAssigned}/${levelConfig.staffSlots})` }
        }
        
        // Update staff assignment
        const updatedFacilityStaff = [...careerState.ownedTeam.facilityStaff!]
        updatedFacilityStaff[staffIndex] = {
          ...updatedFacilityStaff[staffIndex],
          assignedFacility: facilityType
        }
        
        set({
          careerState: {
            ...careerState,
            ownedTeam: {
              ...careerState.ownedTeam,
              facilityStaff: updatedFacilityStaff
            }
          }
        })
        
        console.log(`[Facility Staff] Assigned ${updatedFacilityStaff[staffIndex].name} to ${FACILITY_NAMES[facilityType]}`)
        return { success: true }
      },
      
      unassignFacilityStaffFromFacility: (staffId: string) => {
        const { careerState } = get()
        if (!careerState?.ownedTeam) {
          return { success: false, error: 'No team owned' }
        }
        
        const staffIndex = careerState.ownedTeam.facilityStaff?.findIndex(s => s.id === staffId) ?? -1
        if (staffIndex === -1) {
          return { success: false, error: 'Staff member not found' }
        }
        
        // Update staff assignment
        const updatedFacilityStaff = [...careerState.ownedTeam.facilityStaff!]
        const previousFacility = updatedFacilityStaff[staffIndex].assignedFacility
        updatedFacilityStaff[staffIndex] = {
          ...updatedFacilityStaff[staffIndex],
          assignedFacility: undefined
        }
        
        set({
          careerState: {
            ...careerState,
            ownedTeam: {
              ...careerState.ownedTeam,
              facilityStaff: updatedFacilityStaff
            }
          }
        })
        
        console.log(`[Facility Staff] Unassigned ${updatedFacilityStaff[staffIndex].name} from ${previousFacility ? FACILITY_NAMES[previousFacility] : 'facility'}`)
        return { success: true }
      },
      
      getFacilityStaffMarket: (): FacilityStaffMember[] => {
        const { careerState } = get()
        const market = careerState?.facilityStaffMarket || []
        return market.filter((s): s is FacilityStaffMember => s.staffCategory === 'facility')
      },
      
      getHiredFacilityStaff: () => {
        const { careerState } = get()
        return careerState?.ownedTeam?.facilityStaff || []
      },
      
      // Tutorial/Onboarding System
      markTutorialComplete: () => {
        const { careerState } = get()
        if (!careerState) return
        
        set({
          careerState: {
            ...careerState,
            tutorialCompleted: true
          }
        })
        console.log('[Tutorial] Tutorial marked as complete')
      },
      
      trackScreenVisit: (screenPath: string) => {
        const { careerState } = get()
        if (!careerState) return
        
        const normalizedPath = screenPath.replace(/^\//, '').split('/')[0] || 'home'
        const visitedScreens = careerState.visitedScreens || []
        
        if (!visitedScreens.includes(normalizedPath)) {
          set({
            careerState: {
              ...careerState,
              visitedScreens: [...visitedScreens, normalizedPath]
            }
          })
        }
      },
      
      dismissHelpForScreen: (screenPath: string) => {
        const { careerState } = get()
        if (!careerState) return
        
        const normalizedPath = screenPath.replace(/^\//, '').split('/')[0] || 'home'
        const helpDismissedScreens = careerState.helpDismissedScreens || []
        
        if (!helpDismissedScreens.includes(normalizedPath)) {
          set({
            careerState: {
              ...careerState,
              helpDismissedScreens: [...helpDismissedScreens, normalizedPath]
            }
          })
        }
      },
      
      resetTutorial: () => {
        const { careerState } = get()
        if (!careerState) return
        
        set({
          careerState: {
            ...careerState,
            tutorialCompleted: false,
            visitedScreens: [],
            helpDismissedScreens: []
          }
        })
        console.log('[Tutorial] Tutorial state reset')
      },

      // ============================================
      // EXTENDED LIFE SIMULATION ACTIONS
      // ============================================

      // Messaging & Dating System
      initializeMessaging: () => {
        const { careerState } = get()
        if (!careerState) return
        
        set({
          careerState: {
            ...careerState,
            messaging: createDefaultMessagingState()
          }
        })
        console.log('[Messaging] Messaging system initialized')
      },

      addContact: (contact: ContactInfo) => {
        const { careerState } = get()
        if (!careerState?.messaging) return
        
        // Check if contact already exists
        if (careerState.messaging.contacts.some(c => c.id === contact.id)) {
          console.log('[Messaging] Contact already exists:', contact.id)
          return
        }
        
        set({
          careerState: {
            ...careerState,
            messaging: {
              ...careerState.messaging,
              contacts: [...careerState.messaging.contacts, contact]
            }
          }
        })
        console.log('[Messaging] Contact added:', contact.name)
      },

      removeContact: (contactId: string) => {
        const { careerState } = get()
        if (!careerState?.messaging) return
        
        set({
          careerState: {
            ...careerState,
            messaging: {
              ...careerState.messaging,
              contacts: careerState.messaging.contacts.filter(c => c.id !== contactId)
            }
          }
        })
        console.log('[Messaging] Contact removed:', contactId)
      },

      updateContact: (contactId: string, updates: Partial<ContactInfo>) => {
        const { careerState } = get()
        if (!careerState?.messaging) return
        
        set({
          careerState: {
            ...careerState,
            messaging: {
              ...careerState.messaging,
              contacts: careerState.messaging.contacts.map(c => 
                c.id === contactId ? { ...c, ...updates } : c
              )
            }
          }
        })
      },

      addMessage: (conversationId: string, message: { content: string; isPlayer: boolean }) => {
        const { careerState } = get()
        if (!careerState?.messaging) return
        
        const conversation = careerState.messaging.conversations[conversationId]
        const contact = careerState.messaging.contacts.find(c => c.id === conversationId.replace('conv_', ''))
        
        // Create properly typed TextMessage
        const newMessage: import('@/data/messaging-config').TextMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          conversationId,
          sender: message.isPlayer ? 'player' : 'npc',
          content: message.content,
          tone: 'casual',
          timestamp: { week: careerState.currentWeek, day: careerState.currentDay, hour: 12, year: careerState.currentYear },
          isRead: message.isPlayer
        }
        
        // Create properly typed Conversation
        const defaultMood: import('@/data/messaging-config').NpcMood = {
          overall: 'neutral',
          energy: 'medium',
          receptiveness: 70,
          recentEvents: []
        }
        
        const updatedConversation: import('@/data/messaging-config').Conversation = conversation ? {
          ...conversation,
          messages: [...conversation.messages, newMessage],
          lastMessageTime: { week: newMessage.timestamp.week, day: newMessage.timestamp.day, year: newMessage.timestamp.year },
          unreadCount: message.isPlayer ? conversation.unreadCount : conversation.unreadCount + 1
        } : {
          id: conversationId,
          contactId: conversationId.replace('conv_', ''),
          contactName: contact?.name || 'Unknown',
          contactType: (contact?.type === 'partner' ? 'romantic' : contact?.type === 'family' ? 'family' : 'social') as import('@/data/messaging-config').ConversationCategory,
          isActive: true,
          lastMessageTime: { week: newMessage.timestamp.week, day: newMessage.timestamp.day, year: newMessage.timestamp.year },
          unreadCount: message.isPlayer ? 0 : 1,
          messages: [newMessage],
          relationshipLevel: contact?.relationshipLevel || 50,
          currentMood: contact?.currentMood || defaultMood,
          awaitingResponse: !message.isPlayer,
          conversationStage: 'new'
        }
        
        set({
          careerState: {
            ...careerState,
            messaging: {
              ...careerState.messaging,
              conversations: {
                ...careerState.messaging.conversations,
                [conversationId]: updatedConversation
              },
              unreadTotal: message.isPlayer 
                ? careerState.messaging.unreadTotal 
                : careerState.messaging.unreadTotal + 1
            }
          }
        })
      },

      markConversationRead: (conversationId: string) => {
        const { careerState } = get()
        if (!careerState?.messaging) return
        
        const conversation = careerState.messaging.conversations[conversationId]
        if (!conversation) return
        
        const unreadDelta = conversation.unreadCount
        
        set({
          careerState: {
            ...careerState,
            messaging: {
              ...careerState.messaging,
              conversations: {
                ...careerState.messaging.conversations,
                [conversationId]: {
                  ...conversation,
                  unreadCount: 0,
                  messages: conversation.messages.map(m => ({ ...m, read: true }))
                }
              },
              unreadTotal: Math.max(0, careerState.messaging.unreadTotal - unreadDelta)
            }
          }
        })
      },

      startConversation: (contactId: string): string => {
        const { careerState } = get()
        if (!careerState?.messaging) return ''
        
        const conversationId = `conv_${contactId}`
        
        // If conversation already exists, return existing ID
        if (careerState.messaging.conversations[conversationId]) {
          return conversationId
        }
        
        const contact = careerState.messaging.contacts.find(c => c.id === contactId)
        
        const defaultMood: import('@/data/messaging-config').NpcMood = {
          overall: 'neutral',
          energy: 'medium',
          receptiveness: 70,
          recentEvents: []
        }
        
        const newConversation: import('@/data/messaging-config').Conversation = {
          id: conversationId,
          contactId,
          contactName: contact?.name || 'Unknown',
          contactType: (contact?.type === 'partner' ? 'romantic' : contact?.type === 'family' ? 'family' : 'social') as import('@/data/messaging-config').ConversationCategory,
          isActive: true,
          messages: [],
          lastMessageTime: { week: careerState.currentWeek, day: careerState.currentDay, year: careerState.currentYear },
          unreadCount: 0,
          relationshipLevel: contact?.relationshipLevel || 50,
          currentMood: contact?.currentMood || defaultMood,
          awaitingResponse: false,
          conversationStage: 'new'
        }
        
        set({
          careerState: {
            ...careerState,
            messaging: {
              ...careerState.messaging,
              conversations: {
                ...careerState.messaging.conversations,
                [conversationId]: newConversation
              }
            }
          }
        })
        
        return conversationId
      },

      sendGift: (contactId: string, giftName: string, giftValue: number) => {
        const { careerState } = get()
        if (!careerState?.messaging) return
        
        const pendingGift = {
          id: `gift_${Date.now()}`,
          recipientId: contactId,
          giftName,
          giftValue,
          sentWeek: careerState.currentWeek,
          sentYear: careerState.currentYear,
          delivered: false
        }
        
        set({
          careerState: {
            ...careerState,
            messaging: {
              ...careerState.messaging,
              pendingGifts: [...careerState.messaging.pendingGifts, pendingGift]
            }
          }
        })
        console.log('[Messaging] Gift sent:', giftName, 'to', contactId)
      },

      sendDateInvite: (contactId: string, dateType: string, location: string, week: number) => {
        const { careerState } = get()
        if (!careerState?.messaging) return
        
        const invite = {
          id: `date_${Date.now()}`,
          recipientId: contactId,
          dateType,
          location,
          proposedWeek: week,
          status: 'pending' as const
        }
        
        set({
          careerState: {
            ...careerState,
            messaging: {
              ...careerState.messaging,
              pendingDateInvites: [...careerState.messaging.pendingDateInvites, invite]
            }
          }
        })
        console.log('[Messaging] Date invite sent:', dateType, 'at', location)
      },

      processDateInviteResponse: (inviteId: string, accepted: boolean) => {
        const { careerState } = get()
        if (!careerState?.messaging) return
        
        set({
          careerState: {
            ...careerState,
            messaging: {
              ...careerState.messaging,
              pendingDateInvites: careerState.messaging.pendingDateInvites.map(inv =>
                inv.id === inviteId 
                  ? { ...inv, status: accepted ? 'accepted' as const : 'declined' as const }
                  : inv
              )
            }
          }
        })
      },

      updateRelationshipMeters: (contactId: string, changes: { affection?: number; romance?: number; trust?: number }) => {
        const { careerState } = get()
        if (!careerState?.messaging) return
        
        set({
          careerState: {
            ...careerState,
            messaging: {
              ...careerState.messaging,
              contacts: careerState.messaging.contacts.map(c => {
                if (c.id !== contactId) return c
                return {
                  ...c,
                  affectionMeter: Math.min(100, Math.max(0, c.affectionMeter + (changes.affection || 0))),
                  romanceMeter: Math.min(100, Math.max(0, c.romanceMeter + (changes.romance || 0))),
                  trustMeter: Math.min(100, Math.max(0, c.trustMeter + (changes.trust || 0)))
                }
              })
            }
          }
        })
      },

      generatePotentialDate: (): PotentialDate | null => {
        const { careerState } = get()
        if (!careerState?.messaging) return null
        
        const firstNames = ['Emma', 'Sofia', 'Isabella', 'Olivia', 'Charlotte', 'Amelia', 'Mia', 'Harper', 'Aria', 'Luna']
        const lastNames = ['Anderson', 'Martinez', 'Thompson', 'Garcia', 'Wilson', 'Moore', 'Taylor', 'Brown', 'Lee', 'Harris']
        const occupations = ['Model', 'Journalist', 'Marketing Executive', 'Entrepreneur', 'Lawyer', 'Doctor', 'Engineer', 'Artist', 'Chef', 'Producer']
        const nationalities = ['American', 'British', 'French', 'Italian', 'Spanish', 'Brazilian', 'Australian', 'Canadian', 'German', 'Japanese']
        const traits = ['Ambitious', 'Adventurous', 'Caring', 'Witty', 'Intelligent', 'Creative', 'Confident', 'Loyal', 'Spontaneous', 'Sophisticated']
        const interests = ['Travel', 'Art', 'Music', 'Sports', 'Fashion', 'Technology', 'Food & Wine', 'Fitness', 'Reading', 'Photography']
        const meetingPlaces = ['Charity Gala', 'Race Paddock', 'Sponsor Event', 'Social Media', 'Mutual Friends', 'Restaurant', 'Gym', 'Art Gallery']
        
        const newDate: PotentialDate = {
          id: `date_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
          lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
          age: 22 + Math.floor(Math.random() * 15),
          occupation: occupations[Math.floor(Math.random() * occupations.length)],
          nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
          traits: Array.from({ length: 2 + Math.floor(Math.random() * 2) }, () => 
            traits[Math.floor(Math.random() * traits.length)]
          ).filter((t, i, arr) => arr.indexOf(t) === i),
          interests: Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => 
            interests[Math.floor(Math.random() * interests.length)]
          ).filter((t, i, arr) => arr.indexOf(t) === i),
          compatibilityScore: 40 + Math.floor(Math.random() * 50),
          interestLevel: 30 + Math.floor(Math.random() * 40),
          metAt: meetingPlaces[Math.floor(Math.random() * meetingPlaces.length)],
          metWeek: careerState.currentWeek,
          metYear: careerState.currentYear,
          conversationStage: 'stranger'
        }
        
        set({
          careerState: {
            ...careerState,
            messaging: {
              ...careerState.messaging,
              potentialDates: [...careerState.messaging.potentialDates, newDate]
            }
          }
        })
        
        console.log('[Messaging] Generated potential date:', newDate.firstName, newDate.lastName)
        return newDate
      },

      // Expanded Hobbies System
      initializeExpandedHobbies: () => {
        const { careerState } = get()
        if (!careerState) return
        
        set({
          careerState: {
            ...careerState,
            expandedHobbies: createDefaultExpandedHobbiesState()
          }
        })
        console.log('[Hobbies] Expanded hobbies system initialized')
      },

      startHobby: (hobbyId: string) => {
        const { careerState } = get()
        if (!careerState?.expandedHobbies) return
        
        // Check if hobby already exists
        if (careerState.expandedHobbies.hobbies.some(h => h.id === hobbyId)) {
          console.log('[Hobbies] Hobby already started:', hobbyId)
          return
        }
        
        const newHobby: import('@/data/hobbies-deep-config').DeepHobby = {
          id: hobbyId,
          name: hobbyId.charAt(0).toUpperCase() + hobbyId.slice(1).replace(/_/g, ' '),
          category: 'sport',
          description: `Personal hobby: ${hobbyId}`,
          currentLevel: 1,
          experiencePoints: 0,
          xpToNextLevel: 100,
          masteryTier: 'novice',
          hasInstructor: false,
          lessonsCompleted: 0,
          practiceHoursThisWeek: 0,
          practiceHoursTotal: 0,
          optimalPracticeHours: 10,
          streakDays: 0,
          longestStreak: 0,
          milestonesUnlocked: [],
          canPerformPublicly: false,
          canTeachOthers: false,
          hobbyContacts: [],
          eventsAttended: 0,
          competitionsEntered: 0,
          competitionWins: 0,
          awardsWon: [],
          monthlyCost: 200,
          totalInvested: 0,
          startDate: { week: careerState.currentWeek, year: careerState.currentYear },
          yearsActive: 0,
          stressReductionBonus: 5,
          networkingBonus: 0,
          publicImageBonus: 0,
          specialAbilities: []
        }
        
        set({
          careerState: {
            ...careerState,
            expandedHobbies: {
              ...careerState.expandedHobbies,
              hobbies: [...careerState.expandedHobbies.hobbies, newHobby]
            }
          }
        })
        console.log('[Hobbies] Started new hobby:', hobbyId)
      },

      practiceHobby: (hobbyId: string, hours: number): { xpGained: number; levelUp: boolean } => {
        const { careerState } = get()
        if (!careerState?.expandedHobbies) return { xpGained: 0, levelUp: false }
        
        const hobby = careerState.expandedHobbies.hobbies.find(h => h.id === hobbyId)
        if (!hobby) return { xpGained: 0, levelUp: false }
        
        // Base XP: 10-15 per hour, with bonuses for streaks
        const baseXP = hours * (10 + Math.floor(Math.random() * 6))
        const streakBonus = Math.min(hobby.streakDays * 0.05, 0.5) // Up to 50% bonus
        const xpGained = Math.floor(baseXP * (1 + streakBonus))
        
        const newXP = hobby.experiencePoints + xpGained
        const levelUp = newXP >= hobby.xpToNextLevel
        const newLevel = levelUp ? hobby.currentLevel + 1 : hobby.currentLevel
        const remainingXP = levelUp ? newXP - hobby.xpToNextLevel : newXP
        const newXPToNext = levelUp ? Math.floor(hobby.xpToNextLevel * 1.5) : hobby.xpToNextLevel
        
        // Update mastery tier based on level
        type MasteryTier = import('@/data/hobbies-deep-config').MasteryTier
        let masteryTier: MasteryTier = hobby.masteryTier
        if (newLevel >= 95) masteryTier = 'master'
        else if (newLevel >= 80) masteryTier = 'expert'
        else if (newLevel >= 60) masteryTier = 'advanced'
        else if (newLevel >= 40) masteryTier = 'intermediate'
        else if (newLevel >= 20) masteryTier = 'beginner'
        
        // Update streak - check if practiced recently
        const lastPractice = hobby.lastPracticeDay
        const isConsecutive = lastPractice && (
          lastPractice.week === careerState.currentWeek - 1 || 
          (lastPractice.week === careerState.currentWeek && lastPractice.year === careerState.currentYear)
        )
        const newStreak = isConsecutive ? hobby.streakDays + 1 : 1
        
        set({
          careerState: {
            ...careerState,
            expandedHobbies: {
              ...careerState.expandedHobbies,
              hobbies: careerState.expandedHobbies.hobbies.map(h => 
                h.id === hobbyId ? {
                  ...h,
                  currentLevel: newLevel,
                  experiencePoints: remainingXP,
                  xpToNextLevel: newXPToNext,
                  masteryTier,
                  practiceHoursTotal: h.practiceHoursTotal + hours,
                  practiceHoursThisWeek: h.practiceHoursThisWeek + hours,
                  streakDays: newStreak,
                  longestStreak: Math.max(h.longestStreak, newStreak),
                  lastPracticeDay: { week: careerState.currentWeek, day: careerState.currentDay, year: careerState.currentYear }
                } : h
              ),
              totalPracticeHoursThisWeek: careerState.expandedHobbies.totalPracticeHoursThisWeek + hours
            }
          }
        })
        
        return { xpGained, levelUp }
      },

      scheduleHobbyLesson: (hobbyId: string, instructorId: string, week: number, day: number) => {
        const { careerState } = get()
        if (!careerState?.expandedHobbies) return
        
        const newLesson: import('@/data/hobbies-deep-config').HobbyLesson = {
          id: `lesson_${Date.now()}`,
          hobbyId,
          instructorId,
          lessonType: 'private',
          cost: 500,
          duration: 2,
          xpGain: { min: 30, max: 60 },
          networkingOpportunity: false,
          scheduledFor: { week, day, year: careerState.currentYear },
          isCompleted: false
        }
        
        set({
          careerState: {
            ...careerState,
            expandedHobbies: {
              ...careerState.expandedHobbies,
              scheduledLessons: [...careerState.expandedHobbies.scheduledLessons, newLesson]
            }
          }
        })
        console.log('[Hobbies] Lesson scheduled for hobby:', hobbyId)
      },

      completeHobbyLesson: (lessonId: string): { xpGained: number; skillBoost: number } => {
        const { careerState } = get()
        if (!careerState?.expandedHobbies) return { xpGained: 0, skillBoost: 0 }
        
        const lesson = careerState.expandedHobbies.scheduledLessons.find(l => l.id === lessonId)
        if (!lesson || lesson.isCompleted) return { xpGained: 0, skillBoost: 0 }
        
        const xpGained = lesson.xpGain.min + Math.floor(Math.random() * (lesson.xpGain.max - lesson.xpGain.min))
        const skillBoost = 5 + Math.floor(Math.random() * 5)
        
        // Apply XP to the hobby
        const hobby = careerState.expandedHobbies.hobbies.find(h => h.id === lesson.hobbyId)
        if (hobby) {
          const newXP = hobby.experiencePoints + xpGained
          const levelUp = newXP >= hobby.xpToNextLevel
          
          set({
            careerState: {
              ...careerState,
              expandedHobbies: {
                ...careerState.expandedHobbies,
                hobbies: careerState.expandedHobbies.hobbies.map(h => 
                  h.id === lesson.hobbyId ? {
                    ...h,
                    experiencePoints: levelUp ? newXP - h.xpToNextLevel : newXP,
                    currentLevel: levelUp ? h.currentLevel + 1 : h.currentLevel,
                    xpToNextLevel: levelUp ? Math.floor(h.xpToNextLevel * 1.5) : h.xpToNextLevel,
                    lessonsCompleted: h.lessonsCompleted + 1
                  } : h
                ),
                scheduledLessons: careerState.expandedHobbies.scheduledLessons.map(l =>
                  l.id === lessonId ? { ...l, isCompleted: true } : l
                )
              }
            }
          })
        }
        
        return { xpGained, skillBoost }
      },

      getHobbyProgress: (hobbyId: string): { level: number; xp: number; mastery: string } | null => {
        const { careerState } = get()
        if (!careerState?.expandedHobbies) return null
        
        const hobby = careerState.expandedHobbies.hobbies.find(h => h.id === hobbyId)
        if (!hobby) return null
        
        return {
          level: hobby.currentLevel,
          xp: hobby.experiencePoints,
          mastery: hobby.masteryTier
        }
      },

      // Collections System
      initializeCollections: () => {
        const { careerState } = get()
        if (!careerState) return
        
        set({
          careerState: {
            ...careerState,
            collections: createDefaultCollectionsState()
          }
        })
        console.log('[Collections] Collections system initialized')
      },

      addToCollection: (collectionType: string, item: any) => {
        const { careerState } = get()
        if (!careerState?.collections) return
        
        const existingCollection = careerState.collections.collections.find(c => c.type === collectionType)
        const itemValue = item.currentValue || item.purchasePrice || 0
        
        if (existingCollection) {
          // Add item to existing collection
          set({
            careerState: {
              ...careerState,
              collections: {
                ...careerState.collections,
                collections: careerState.collections.collections.map(c =>
                  c.type === collectionType ? {
                    ...c,
                    items: [...c.items, item],
                    totalPurchaseValue: c.totalPurchaseValue + itemValue,
                    currentMarketValue: c.currentMarketValue + itemValue,
                    totalItemsOwned: c.totalItemsOwned + 1
                  } : c
                ),
                totalPortfolioValue: careerState.collections.totalPortfolioValue + itemValue
              }
            }
          })
        } else {
          // Create new collection with proper types
          const newCollection: import('@/data/collections-config').Collection = {
            id: `col_${collectionType}_${Date.now()}`,
            type: collectionType as import('@/data/collections-config').CollectionType,
            name: collectionType.charAt(0).toUpperCase() + collectionType.slice(1),
            items: [item],
            totalPurchaseValue: itemValue,
            currentMarketValue: itemValue,
            appreciationRate: 0,
            hasShowroom: false,
            isInsured: false,
            insuranceCost: 0,
            isPubliclyKnown: false,
            hasBeenFeatured: false,
            visitorsAllowed: false,
            totalItemsOwned: 1,
            itemsSold: 0,
            totalProfitLoss: 0,
            startDate: { week: careerState.currentWeek, year: careerState.currentYear }
          }
          
          set({
            careerState: {
              ...careerState,
              collections: {
                ...careerState.collections,
                collections: [...careerState.collections.collections, newCollection],
                totalPortfolioValue: careerState.collections.totalPortfolioValue + itemValue
              }
            }
          })
        }
        console.log('[Collections] Item added to collection:', collectionType)
      },

      sellFromCollection: (collectionType: string, itemId: string): { soldFor: number } => {
        const { careerState } = get()
        if (!careerState?.collections) return { soldFor: 0 }
        
        const collection = careerState.collections.collections.find(c => c.type === collectionType)
        if (!collection) return { soldFor: 0 }
        
        const item = collection.items.find((i: any) => i.id === itemId)
        if (!item) return { soldFor: 0 }
        
        const soldFor = item.currentValue || item.purchasePrice || 0
        
        set({
          careerState: {
            ...careerState,
            collections: {
              ...careerState.collections,
              collections: careerState.collections.collections.map(c =>
                c.type === collectionType ? {
                  ...c,
                  items: c.items.filter((i: any) => i.id !== itemId),
                  currentMarketValue: c.currentMarketValue - soldFor,
                  itemsSold: c.itemsSold + 1,
                  totalProfitLoss: c.totalProfitLoss + (soldFor - (item.purchasePrice || 0))
                } : c
              ),
              totalPortfolioValue: careerState.collections.totalPortfolioValue - soldFor
            }
          }
        })
        
        console.log('[Collections] Item sold from collection:', collectionType, 'for', soldFor)
        return { soldFor }
      },

      updateCollectionValues: (): { totalAppreciation: number } => {
        const { careerState } = get()
        if (!careerState?.collections) return { totalAppreciation: 0 }
        
        let totalAppreciation = 0
        
        const updatedCollections = careerState.collections.collections.map(collection => {
          const updatedItems = collection.items.map((item: any) => {
            // Random appreciation/depreciation: -5% to +10%
            const appreciationRate = -0.05 + Math.random() * 0.15
            const oldValue = item.currentValue || item.purchasePrice || 0
            const newValue = Math.floor(oldValue * (1 + appreciationRate))
            const itemAppreciation = newValue - oldValue
            totalAppreciation += itemAppreciation
            
            return {
              ...item,
              currentValue: newValue
            }
          })
          
          const newMarketValue = updatedItems.reduce((sum: number, item: any) => sum + (item.currentValue || 0), 0)
          
          return {
            ...collection,
            items: updatedItems,
            currentMarketValue: newMarketValue,
            appreciationRate: collection.totalPurchaseValue > 0 
              ? ((newMarketValue - collection.totalPurchaseValue) / collection.totalPurchaseValue) * 100 
              : 0
          }
        })
        
        const newTotalPortfolioValue = updatedCollections.reduce((sum, c) => sum + c.currentMarketValue, 0)
        
        set({
          careerState: {
            ...careerState,
            collections: {
              ...careerState.collections,
              collections: updatedCollections,
              totalPortfolioValue: newTotalPortfolioValue,
              totalAppreciation: careerState.collections.totalAppreciation + totalAppreciation
            }
          }
        })
        
        return { totalAppreciation }
      },

      getCollectionSummary: (): { totalValue: number; itemCount: number; appreciation: number } => {
        const { careerState } = get()
        if (!careerState?.collections) return { totalValue: 0, itemCount: 0, appreciation: 0 }
        
        const itemCount = careerState.collections.collections.reduce(
          (sum, c) => sum + c.items.length, 0
        )
        
        return {
          totalValue: careerState.collections.totalPortfolioValue,
          itemCount,
          appreciation: careerState.collections.totalAppreciation
        }
      },

      // Expanded Social Media System
      initializeSocialMediaExpanded: () => {
        const { careerState } = get()
        if (!careerState) return
        
        set({
          careerState: {
            ...careerState,
            socialMediaExpanded: createDefaultExpandedSocialMediaState()
          }
        })
        console.log('[SocialMedia] Expanded social media system initialized')
      },

      createSocialPost: (platform: string, content: string, topic: string, tone: string) => {
        const { careerState } = get()
        if (!careerState?.socialMediaExpanded) return
        
        const profile = careerState.socialMediaExpanded.profiles[platform]
        if (!profile) return
        
        // Calculate engagement based on profile stats
        const baseEngagement = profile.engagementRate / 100
        const baseLikes = Math.floor(profile.followers * baseEngagement * (0.8 + Math.random() * 0.4))
        const baseComments = Math.floor(baseLikes * 0.1 * (0.5 + Math.random()))
        const baseShares = Math.floor(baseLikes * 0.05 * (0.3 + Math.random()))
        const calcEngagementRate = ((baseLikes + baseComments * 2 + baseShares * 3) / profile.followers) * 100
        const isViral = calcEngagementRate > 10
        
        const newPost: import('@/data/social-media-config').SocialPost = {
          id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          platform: platform as import('@/data/social-media-config').SocialPlatform,
          contentType: 'photo',
          topic: topic as import('@/data/social-media-config').PostTopic,
          tone: tone as import('@/data/social-media-config').PostTone,
          contentPreview: content.substring(0, 50),
          fullContent: content,
          mediaAttached: false,
          isScheduled: false,
          postedAt: { week: careerState.currentWeek, day: careerState.currentDay, hour: 12, year: careerState.currentYear },
          likes: baseLikes,
          comments: baseComments,
          shares: baseShares,
          saves: Math.floor(baseLikes * 0.02),
          reach: Math.floor(profile.followers * 0.3),
          impressions: Math.floor(profile.followers * 0.5),
          wentViral: isViral,
          sentimentScore: 50,
          positiveComments: [],
          negativeComments: [],
          followerChange: isViral ? Math.floor(100 + Math.random() * 500) : Math.floor(-20 + Math.random() * 50),
          engagementChange: 0,
          controversyGenerated: 0
        }
        
        set({
          careerState: {
            ...careerState,
            socialMediaExpanded: {
              ...careerState.socialMediaExpanded,
              recentPosts: [newPost, ...careerState.socialMediaExpanded.recentPosts].slice(0, 50),
              profiles: {
                ...careerState.socialMediaExpanded.profiles,
                [platform]: {
                  ...profile,
                  totalPosts: profile.totalPosts + 1,
                  postsThisWeek: profile.postsThisWeek + 1,
                  viralPosts: isViral ? profile.viralPosts + 1 : profile.viralPosts,
                  followers: profile.followers + newPost.followerChange
                }
              },
              viralPostsCount: isViral 
                ? careerState.socialMediaExpanded.viralPostsCount + 1 
                : careerState.socialMediaExpanded.viralPostsCount,
              totalFollowers: careerState.socialMediaExpanded.totalFollowers + newPost.followerChange
            }
          }
        })
        
        console.log('[SocialMedia] Post created on', platform, isViral ? '(VIRAL!)' : '')
      },

      respondToTroll: (trollId: string, responseType: string): { outcomeType: string; followerChange: number } => {
        const { careerState } = get()
        if (!careerState?.socialMediaExpanded) return { outcomeType: 'neutral', followerChange: 0 }
        
        const troll = careerState.socialMediaExpanded.pendingTrolls.find(t => t.id === trollId)
        if (!troll) return { outcomeType: 'neutral', followerChange: 0 }
        
        let outcomeType = 'neutral'
        let followerChange = 0
        
        // Determine outcome based on response type
        switch (responseType) {
          case 'ignore':
            outcomeType = 'ignored'
            followerChange = 0
            break
          case 'witty':
            outcomeType = Math.random() > 0.3 ? 'win' : 'backfire'
            followerChange = outcomeType === 'win' ? Math.floor(100 + Math.random() * 500) : -Math.floor(50 + Math.random() * 200)
            break
          case 'block':
            outcomeType = 'blocked'
            followerChange = 0
            break
          case 'report':
            outcomeType = 'reported'
            followerChange = 0
            break
          case 'engage':
            outcomeType = Math.random() > 0.5 ? 'de-escalated' : 'escalated'
            followerChange = outcomeType === 'de-escalated' ? Math.floor(50 + Math.random() * 200) : -Math.floor(100 + Math.random() * 300)
            break
          default:
            outcomeType = 'neutral'
        }
        
        // Update follower count
        const platform = troll.platform
        const profile = careerState.socialMediaExpanded.profiles[platform]
        
        set({
          careerState: {
            ...careerState,
            socialMediaExpanded: {
              ...careerState.socialMediaExpanded,
              pendingTrolls: careerState.socialMediaExpanded.pendingTrolls.filter(t => t.id !== trollId),
              profiles: profile ? {
                ...careerState.socialMediaExpanded.profiles,
                [platform]: {
                  ...profile,
                  followers: Math.max(0, profile.followers + followerChange)
                }
              } : careerState.socialMediaExpanded.profiles,
              totalFollowers: careerState.socialMediaExpanded.totalFollowers + followerChange
            }
          }
        })
        
        return { outcomeType, followerChange }
      },

      schedulePost: (platform: string, content: string, scheduledWeek: number, scheduledDay: number) => {
        const { careerState } = get()
        if (!careerState?.socialMediaExpanded) return
        
        const scheduledPost: import('@/data/social-media-config').SocialPost = {
          id: `scheduled_${Date.now()}`,
          platform: platform as import('@/data/social-media-config').SocialPlatform,
          contentType: 'photo',
          topic: 'behind_scenes',
          tone: 'casual',
          contentPreview: content.substring(0, 50),
          fullContent: content,
          mediaAttached: false,
          isScheduled: true,
          scheduledFor: { week: scheduledWeek, day: scheduledDay, hour: 12, year: careerState.currentYear },
          likes: 0,
          comments: 0,
          shares: 0,
          saves: 0,
          reach: 0,
          impressions: 0,
          wentViral: false,
          sentimentScore: 0,
          positiveComments: [],
          negativeComments: [],
          followerChange: 0,
          engagementChange: 0,
          controversyGenerated: 0
        }
        
        set({
          careerState: {
            ...careerState,
            socialMediaExpanded: {
              ...careerState.socialMediaExpanded,
              scheduledPosts: [...careerState.socialMediaExpanded.scheduledPosts, scheduledPost]
            }
          }
        })
        console.log('[SocialMedia] Post scheduled for week', scheduledWeek, 'day', scheduledDay)
      },

      processWeeklySocialMedia: (): { followerGrowth: number; engagementRate: number; viralPosts: number } => {
        const { careerState } = get()
        if (!careerState?.socialMediaExpanded) return { followerGrowth: 0, engagementRate: 0, viralPosts: 0 }
        
        let totalFollowerGrowth = 0
        let viralPosts = 0
        
        // Process each platform
        const updatedProfiles = { ...careerState.socialMediaExpanded.profiles }
        
        Object.keys(updatedProfiles).forEach(platform => {
          const profile = updatedProfiles[platform]
          
          // Base weekly growth
          const weeklyGrowth = profile.followersGrowthRate + Math.floor(Math.random() * 100) - 50
          profile.followers += weeklyGrowth
          totalFollowerGrowth += weeklyGrowth
          
          // Reset weekly counters
          profile.postsThisWeek = 0
        })
        
        // Check for troll encounters (10% chance per platform)
        const newTrolls: any[] = []
        Object.keys(updatedProfiles).forEach(platform => {
          if (Math.random() < 0.1) {
            newTrolls.push({
              id: `troll_${Date.now()}_${platform}`,
              platform,
              attackType: ['criticism', 'personal_attack', 'misinformation', 'spam'][Math.floor(Math.random() * 4)],
              severity: Math.floor(Math.random() * 3) + 1,
              content: 'Troll comment placeholder',
              timestamp: { week: careerState.currentWeek, day: 1, year: careerState.currentYear }
            })
          }
        })
        
        const totalFollowers = Object.values(updatedProfiles).reduce((sum, p) => sum + p.followers, 0)
        const avgEngagement = Object.values(updatedProfiles).reduce((sum, p) => sum + p.engagementRate, 0) / Object.keys(updatedProfiles).length
        
        set({
          careerState: {
            ...careerState,
            socialMediaExpanded: {
              ...careerState.socialMediaExpanded,
              profiles: updatedProfiles,
              totalFollowers,
              weeklyGrowth: totalFollowerGrowth,
              averageEngagement: avgEngagement,
              pendingTrolls: [...careerState.socialMediaExpanded.pendingTrolls, ...newTrolls]
            }
          }
        })
        
        return { 
          followerGrowth: totalFollowerGrowth, 
          engagementRate: avgEngagement, 
          viralPosts: careerState.socialMediaExpanded.viralPostsCount 
        }
      },

      // Travel & Vacations System
      initializeTravel: () => {
        const { careerState } = get()
        if (!careerState) return
        
        set({
          careerState: {
            ...careerState,
            travel: createDefaultTravelState()
          }
        })
        console.log('[Travel] Travel system initialized')
      },

      planVacation: (destination: string, startWeek: number, duration: number, companions: string[]) => {
        const { careerState } = get()
        if (!careerState?.travel) return
        
        const baseCostPerDay = 500 + Math.floor(Math.random() * 1500)
        const flightCost = 1000 + Math.floor(Math.random() * 3000)
        const accommodationCost = baseCostPerDay * duration
        const totalCost = flightCost + accommodationCost + (companions.length * baseCostPerDay * 0.5 * duration)
        
        // Create a simple destination object
        const destinationObj: import('@/data/travel-config').Destination = {
          id: `dest_${destination.toLowerCase().replace(/\s+/g, '_')}`,
          name: destination,
          country: destination,
          region: 'International',
          type: 'beach',
          visaRequired: false,
          travelTime: 4 + Math.floor(Math.random() * 12),
          bestSeason: ['summer'],
          luxuryOptions: true,
          privacyRating: 50 + Math.floor(Math.random() * 50),
          romanticRating: 60 + Math.floor(Math.random() * 40),
          familyFriendly: true,
          adventureOptions: true,
          celebrityHotspot: Math.random() > 0.5,
          networkingPotential: 30 + Math.floor(Math.random() * 50),
          averageDailyCost: {
            budget: 200,
            comfortable: 500,
            luxury: 1500,
            ultra_luxury: 5000
          },
          availableActivities: ['sightseeing', 'dining', 'spa', 'beach'],
          description: `A beautiful destination in ${destination}`,
          highlights: ['Stunning views', 'Local cuisine', 'Cultural experiences']
        }
        
        const vacationCompanions: import('@/data/travel-config').VacationCompanion[] = companions.map(c => ({
          id: c,
          name: c,
          relationship: 'friend' as const,
          addedCost: baseCostPerDay * 0.5 * duration
        }))
        
        const newVacation: import('@/data/travel-config').Vacation = {
          id: `vacation_${Date.now()}`,
          destination: destinationObj,
          startDate: { week: startWeek, day: 1, year: careerState.currentYear },
          duration,
          companions: vacationCompanions,
          isRomantic: vacationCompanions.some(c => c.relationship === 'partner'),
          isFamilyTrip: vacationCompanions.some(c => c.relationship === 'child' || c.relationship === 'family'),
          isSolo: vacationCompanions.length === 0,
          vacationType: 'beach',
          luxuryLevel: 'luxury',
          accommodationType: 'resort',
          costPerNight: baseCostPerDay,
          activities: [],
          activitiesCompleted: [],
          status: 'booked',
          totalCost,
          flightCost,
          accommodationCost,
          activitiesCost: 0,
          isPubliclyKnown: Math.random() > 0.7,
          paparazziRisk: 20 + Math.floor(Math.random() * 40)
        }
        
        // Deduct vacation cost from personal finances
        const personalLifeForVacation = careerState.personalLife
        if (personalLifeForVacation) {
          set({
            careerState: {
              ...careerState,
              travel: {
                ...careerState.travel,
                upcomingVacations: [...careerState.travel.upcomingVacations, newVacation]
              },
              personalLife: {
                ...personalLifeForVacation,
                finances: {
                  ...personalLifeForVacation.finances,
                  liquidCash: personalLifeForVacation.finances.liquidCash - totalCost,
                  transactions: [...personalLifeForVacation.finances.transactions, {
                    id: `vacation_${Date.now()}`,
                    date: { week: startWeek, year: careerState.currentYear },
                    type: 'expense' as const,
                    category: 'lifestyle' as const,
                    amount: -totalCost,
                    description: `Vacation to ${destination} (${duration} days)`,
                    taxDeductible: false
                  }]
                }
              }
            }
          })
        } else {
          set({
            careerState: {
              ...careerState,
              travel: {
                ...careerState.travel,
                upcomingVacations: [...careerState.travel.upcomingVacations, newVacation]
              }
            }
          })
        }
        console.log(`[Travel] Vacation planned to ${destination}, cost: $${totalCost.toLocaleString()}`)
      },

      cancelVacation: (vacationId: string): { refundAmount: number } => {
        const { careerState } = get()
        if (!careerState?.travel) return { refundAmount: 0 }
        
        const vacation = careerState.travel.upcomingVacations.find(v => v.id === vacationId)
        if (!vacation) return { refundAmount: 0 }
        
        // 50% refund for cancellations
        const refundAmount = Math.floor(vacation.totalCost * 0.5)
        
        // Deposit refund into personal finances
        const personalLifeForRefund = careerState.personalLife
        if (personalLifeForRefund) {
          set({
            careerState: {
              ...careerState,
              travel: {
                ...careerState.travel,
                upcomingVacations: careerState.travel.upcomingVacations.filter(v => v.id !== vacationId)
              },
              personalLife: {
                ...personalLifeForRefund,
                finances: {
                  ...personalLifeForRefund.finances,
                  liquidCash: personalLifeForRefund.finances.liquidCash + refundAmount,
                  transactions: [...personalLifeForRefund.finances.transactions, {
                    id: `vacation_refund_${Date.now()}`,
                    date: { week: careerState.currentWeek, year: careerState.currentYear },
                    type: 'income' as const,
                    category: 'other_income' as const,
                    amount: refundAmount,
                    description: `Vacation cancellation refund (50% of $${vacation.totalCost.toLocaleString()})`,
                    taxDeductible: false
                  }]
                }
              }
            }
          })
        } else {
          set({
            careerState: {
              ...careerState,
              travel: {
                ...careerState.travel,
                upcomingVacations: careerState.travel.upcomingVacations.filter(v => v.id !== vacationId)
              }
            }
          })
        }
        
        console.log(`[Travel] Vacation cancelled, refund: $${refundAmount.toLocaleString()}`)
        return { refundAmount }
      },

      completeVacation: (vacationId: string): { stressReduction: number; relationshipBoosts: Record<string, number> } => {
        const { careerState } = get()
        if (!careerState?.travel) return { stressReduction: 0, relationshipBoosts: {} }
        
        const vacation = careerState.travel.upcomingVacations.find(v => v.id === vacationId)
        if (!vacation) return { stressReduction: 0, relationshipBoosts: {} }
        
        // Generate random memories
        const possibleMemories = [
          'Amazing sunset views',
          'Local cuisine adventure',
          'Met interesting people',
          'Perfect weather',
          'Unexpected discovery',
          'Relaxing spa day',
          'Adventure activity',
          'Cultural experience'
        ]
        const memories = Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () =>
          possibleMemories[Math.floor(Math.random() * possibleMemories.length)]
        ).filter((m, i, arr) => arr.indexOf(m) === i)
        
        const stressReduction = 10 + vacation.duration * 5
        const relationshipBoosts: Record<string, number> = {}
        vacation.companions.forEach(c => {
          relationshipBoosts[c.id] = 5 + Math.floor(Math.random() * 10)
        })
        
        const outcome: import('@/data/travel-config').VacationOutcome = {
          stressReduction,
          memorablesMoments: memories,
          photosForSocialMedia: Math.floor(vacation.duration * 2),
          unexpectedEvents: [],
          wasPhotographed: Math.random() < vacation.paparazziRisk / 100,
          storiesPublished: [],
          healthBenefit: Math.floor(vacation.duration * 2),
          gotSick: Math.random() < 0.1,
          overallSatisfaction: 60 + Math.floor(Math.random() * 40)
        }
        
        const completedVacation: import('@/data/travel-config').Vacation = {
          ...vacation,
          status: 'completed',
          outcomes: outcome
        }
        
        set({
          careerState: {
            ...careerState,
            travel: {
              ...careerState.travel,
              upcomingVacations: careerState.travel.upcomingVacations.filter(v => v.id !== vacationId),
              pastVacations: [...careerState.travel.pastVacations, completedVacation],
              totalVacationDays: careerState.travel.totalVacationDays + vacation.duration,
              memoriesCreated: [...careerState.travel.memoriesCreated, ...memories],
              passportStamps: careerState.travel.passportStamps.includes(vacation.destination.country)
                ? careerState.travel.passportStamps
                : [...careerState.travel.passportStamps, vacation.destination.country]
            }
          }
        })
        
        return { stressReduction, relationshipBoosts }
      },

      // Retirement Planning System
      initializeRetirement: () => {
        const { careerState } = get()
        if (!careerState) return
        
        set({
          careerState: {
            ...careerState,
            retirement: createDefaultRetirementState()
          }
        })
        console.log('[Retirement] Retirement planning system initialized')
      },

      updateRetirementPlan: (updates: Partial<ExtendedRetirementState>) => {
        const { careerState } = get()
        if (!careerState?.retirement) return
        
        set({
          careerState: {
            ...careerState,
            retirement: {
              ...careerState.retirement,
              ...updates
            }
          }
        })
      },

      selectPostRacingPath: (pathId: string) => {
        const { careerState } = get()
        if (!careerState?.retirement) return
        
        type PostRacingPath = import('@/data/retirement-config').PostRacingPath
        
        const pathOptions: Array<{ id: PostRacingPath; name: string; description: string }> = [
          { id: 'team_principal', name: 'Team Principal', description: 'Lead a racing team as principal' },
          { id: 'pundit', name: 'TV Pundit/Commentator', description: 'Become a motorsport media personality' },
          { id: 'racing_school', name: 'Racing School Owner', description: 'Train the next generation of drivers' },
          { id: 'team_owner_continued', name: 'Team Owner', description: 'Continue as team owner full-time' },
          { id: 'philanthropy_full_time', name: 'Philanthropist', description: 'Focus on charitable work' },
          { id: 'business_ventures', name: 'Business Ventures', description: 'Pursue business opportunities' }
        ]
        
        const selectedPath = pathOptions.find(p => p.id === pathId)
        if (!selectedPath) return
        
        const newPath: import('@/data/retirement-config').PostRacingCareerPlan = {
          id: pathId,
          path: selectedPath.id,
          name: selectedPath.name,
          description: selectedPath.description,
          financialRequirement: 1000000,
          skillsRequired: [],
          contactsRequired: [],
          reputationRequired: 60,
          preparationSteps: [],
          currentProgress: 0,
          estimatedPrepTime: 24,
          expectedIncome: { min: 100000, max: 500000 },
          fulfillmentRating: 70,
          publicProfileMaintained: true,
          stressLevel: 'medium',
          timeCommitment: 'full_time',
          risks: [],
          successProbability: 70
        }
        
        set({
          careerState: {
            ...careerState,
            retirement: {
              ...careerState.retirement,
              primaryPath: newPath,
              careerPathProgress: {
                ...careerState.retirement.careerPathProgress,
                [pathId]: 0
              }
            }
          }
        })
        console.log('[Retirement] Selected post-racing path:', selectedPath.name)
      },

      addLegacyGoal: (goal: { name: string; description: string; targetValue: number }) => {
        const { careerState } = get()
        if (!careerState?.retirement) return
        
        const newGoal: import('@/data/retirement-config').LegacyGoal = {
          id: `goal_${Date.now()}`,
          type: 'racing_achievement',
          name: goal.name,
          description: goal.description,
          isComplete: false,
          progressPercent: 0,
          requirements: [],
          howRemembered: goal.name,
          lastingImpact: goal.description,
          publicAwareness: 0,
          historicalSignificance: 50
        }
        
        set({
          careerState: {
            ...careerState,
            retirement: {
              ...careerState.retirement,
              legacyGoals: [...careerState.retirement.legacyGoals, newGoal]
            }
          }
        })
        console.log('[Retirement] Legacy goal added:', goal.name)
      },

      progressLegacyGoal: (goalId: string, progress: number) => {
        const { careerState } = get()
        if (!careerState?.retirement) return
        
        set({
          careerState: {
            ...careerState,
            retirement: {
              ...careerState.retirement,
              legacyGoals: careerState.retirement.legacyGoals.map(g => {
                if (g.id !== goalId) return g
                const newProgress = Math.min(100, g.progressPercent + progress)
                return {
                  ...g,
                  progressPercent: newProgress,
                  isComplete: newProgress >= 100
                }
              }),
              completedLegacyGoals: careerState.retirement.legacyGoals
                .filter(g => g.id === goalId && g.progressPercent + progress >= 100)
                .map(g => g.id)
                .concat(careerState.retirement.completedLegacyGoals)
            }
          }
        })
      },

      assessRetirementReadiness: (): { financial: number; mental: number; career: number; overall: number } => {
        const { careerState, player } = get()
        if (!careerState?.retirement || !player) {
          return { financial: 0, mental: 0, career: 0, overall: 0 }
        }
        
        if (!careerState.retirement) {
          return { financial: 0, mental: 0, career: 0, overall: 0 }
        }
        
        // Financial readiness (based on retirement fund vs projected needs)
        const projectedAnnualNeed = 200000 // Assumed lifestyle cost
        const yearsOfCoverage = careerState.retirement.retirementFund / projectedAnnualNeed
        const financial = Math.min(100, (yearsOfCoverage / 30) * 100) // 30 years = 100%
        
        // Mental readiness
        const mental = careerState.retirement.mentalReadiness
        
        // Career path readiness
        const primaryPathId = careerState.retirement?.primaryPath?.id
        const primaryPathProgress = primaryPathId 
          ? (careerState.retirement.careerPathProgress?.[primaryPathId] || 0)
          : 0
        const career = primaryPathProgress
        
        // Overall (weighted average)
        const overall = Math.floor((financial * 0.4) + (mental * 0.3) + (career * 0.3))
        
        return { financial, mental, career, overall }
      }
    }),
    {
      name: 'ams2-career-storage',
      version: 1, // Versioning helps with migrations
      onRehydrateStorage: () => (state) => {
        // Called when hydration is complete
        if (state) {
          console.log('[CareerStore] Hydrated from storage', {
            hasActiveCareer: state.hasActiveCareer,
            playerName: state.player ? `${state.player.firstName} ${state.player.lastName}` : 'none'
          })
        } else {
          console.log('[CareerStore] No state found during hydration')
        }
      },
      // Ensure we only store essential data
      partialize: (state) => ({
        hasActiveCareer: state.hasActiveCareer,
        player: state.player,
        careerState: state.careerState
      })
    }
  )
)

// Force save function - call this after important changes
export const forceSaveCareer = () => {
  const state = useCareerStore.getState()
  console.log('[CareerStore] Force saving...', { hasActiveCareer: state.hasActiveCareer })
  // Trigger persist by doing a no-op set
  useCareerStore.setState({})
  // Also save to native database
  saveToNativeDB()
}

// Save debouncing to prevent overlapping saves
let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null
let saveInProgress = false

// Save to native Electron database (file-based, more reliable than localStorage)
// Debounced: waits 500ms after last call, and prevents overlapping saves
export const saveToNativeDB = async () => {
  if (typeof window === 'undefined' || !window.electron?.saveCareer) {
    console.log('[CareerStore] Native DB not available (not in Electron)')
    return
  }

  // Debounce: cancel previous pending save
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer)
  }

  return new Promise<void>((resolve) => {
    saveDebounceTimer = setTimeout(async () => {
      // Mutex: skip if a save is already running
      if (saveInProgress) {
        console.log('[CareerStore] Save already in progress - skipping')
        resolve()
        return
      }

      saveInProgress = true
      try {
        const careerState = useCareerStore.getState()
        const rivalState = (await import('./rivalStore')).useRivalStore.getState()
        
        if (!careerState.hasActiveCareer || !careerState.player) {
          console.log('[CareerStore] No career to save')
          return
        }
        
        const saveData = {
          player: careerState.player,
          careerState: careerState.careerState,
          rivals: rivalState.rivals,
          teams: rivalState.teams,
          series: rivalState.series,
          raceHistory: careerState.player?.raceHistory ?? [],
          seasonStandings: rivalState.seasonStandings,
          // newsEvents removed - not part of RivalStore interface
          pendingContractOffers: rivalState.pendingContractOffers ?? [],
          savedAt: new Date().toISOString()
        }
        
        console.log('[CareerStore] Saving to native DB...', { playerName: careerState.player ? `${careerState.player.firstName} ${careerState.player.lastName}` : 'none' })
        if (window.electron?.saveCareer) {
          await window.electron.saveCareer(saveData)
        }
        console.log('[CareerStore] Saved to native DB successfully')
      } catch (e) {
        console.error('[CareerStore] Failed to save to native DB:', e)
      } finally {
        saveInProgress = false
      }
      resolve()
    }, 500) // 500ms debounce
  })
}

// Load from native Electron database
export const loadFromNativeDB = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !window.electron?.loadCareer) {
    console.log('[CareerStore] Native DB not available (not in Electron)')
    return false
  }
  
  try {
    console.log('[CareerStore] Loading from native DB...')
    const result = await window.electron.loadCareer() as any
    
    if (!result.success || !result.data) {
      console.log('[CareerStore] No saved career found in native DB')
      return false
    }
    
    const { data } = result
    console.log('[CareerStore] Loaded from native DB:', { 
      playerName: data.player?.firstName,
      savedAt: data.savedAt 
    })
    
    // Migrate player and career state data for backwards compatibility
    const migratedPlayer = data.player ? migratePlayerData(data.player) : data.player
    const migratedCareerState = migrateCareerState(data.careerState)
    
    // Restore career store
    useCareerStore.setState({
      hasActiveCareer: true,
      player: migratedPlayer,
      careerState: migratedCareerState
    })
    
    // Update GOAT progress after loading to check for any milestones already achieved
    if (migratedPlayer) {
      setTimeout(() => {
        useCareerStore.getState().updateGOATProgress()
      }, 100)
    }
    
    // Restore rival store
    const { useRivalStore } = await import('./rivalStore')
    useRivalStore.setState({
      rivals: data.rivals ?? [],
      teams: data.teams ?? [],
      series: data.series ?? [],
      seasonStandings: data.seasonStandings ?? {},
      // newsEvents removed - not part of RivalStore interface
      pendingContractOffers: data.pendingContractOffers ?? []
    })
    
    return true
  } catch (e) {
    console.error('[CareerStore] Failed to load from native DB:', e)
    return false
  }
}

// Hook to check if the store has been hydrated
export const useCareerStoreHydration = () => {
  const [hydrated, setHydrated] = useState(false)
  const unsubRef = useRef<(() => void) | null>(null)
  
  useEffect(() => {
    const initializeStore = async () => {
      console.log('[CareerStore] Starting hydration...')
      
      // First, try to load from native Electron database (most reliable)
      const loadedFromNativeDB = await loadFromNativeDB()
      
      if (loadedFromNativeDB) {
        console.log('[CareerStore] Loaded from native DB - hydration complete')
        setHydrated(true)
        return
      }
      
      // Fallback: Check localStorage
      let storedState: any = null
      try {
        const stored = localStorage.getItem('ams2-career-storage')
        if (stored) {
          const parsed = JSON.parse(stored)
          storedState = parsed?.state ?? null
          console.log('[CareerStore] Found in localStorage:', {
            hasActiveCareer: parsed.state?.hasActiveCareer,
            hasPlayer: !!parsed.state?.player,
            playerName: parsed.state?.player ? `${parsed.state.player.firstName} ${parsed.state.player.lastName}` : 'none'
          })
        } else {
          console.log('[CareerStore] No data in localStorage')
        }
      } catch (e) {
        console.error('[CareerStore] Error reading localStorage:', e)
      }
      
      // Helper function to verify and restore state if needed
      const verifyAndRestore = () => {
        const currentState = useCareerStore.getState()
        console.log('[CareerStore] Verifying state:', {
          hasActiveCareer: currentState.hasActiveCareer,
          hasPlayer: !!currentState.player
        })

        // Fallback: if persisted data exists but hydration didn't restore it
        if (storedState?.hasActiveCareer && !currentState.hasActiveCareer) {
          console.warn('[CareerStore] State mismatch, restoring from localStorage')
          // Migrate player and career state data before restoring
          const migratedState = {
            ...storedState,
            player: storedState.player ? migratePlayerData(storedState.player) : storedState.player,
            careerState: migrateCareerState(storedState.careerState)
          }
          useCareerStore.setState(migratedState)
          // Update GOAT progress after restoring
          if (migratedState.player) {
            setTimeout(() => useCareerStore.getState().updateGOATProgress(), 100)
          }
        } else if (currentState.hasActiveCareer && currentState.player) {
          // Migrate existing player and career state data if needed
          const migratedPlayer = migratePlayerData(currentState.player)
          const migratedCareerState = migrateCareerState(currentState.careerState)
          if (migratedPlayer !== currentState.player || migratedCareerState !== currentState.careerState) {
            useCareerStore.setState({ 
              player: migratedPlayer,
              careerState: migratedCareerState
            })
          }
          // Update GOAT progress after migration
          setTimeout(() => useCareerStore.getState().updateGOATProgress(), 100)
        }
      }
      
      // Wait for Zustand persist hydration
      if (useCareerStore.persist.hasHydrated()) {
        console.log('[CareerStore] Already hydrated on mount')
        verifyAndRestore()
        setHydrated(true)
      } else {
        unsubRef.current = useCareerStore.persist.onFinishHydration(() => {
          console.log('[CareerStore] Hydration finished')
          verifyAndRestore()
          setHydrated(true)
        })
      }
    }
    
    initializeStore()
    
    return () => {
      if (unsubRef.current) {
        unsubRef.current()
      }
    }
  }, [])
  
  return hydrated
}


// Scenario presets - now pulls from the comprehensive backgrounds.ts
// This provides backwards compatibility while using the new system
export const CAREER_SCENARIOS: Record<CareerScenario, {
  name: string
  description: string
  startAge: number
  startingMoney: number
  startingReputation: number
  baseStats: DriverStats
}> = Object.fromEntries(
  Object.entries(BACKGROUND_SCENARIOS).map(([id, scenario]) => [
    id,
    {
      name: scenario.name,
      description: scenario.description,
      startAge: scenario.startAge,
      startingMoney: scenario.startingMoney,
      startingReputation: scenario.startingReputation,
      baseStats: scenario.baseStats
    }
  ])
) as Record<CareerScenario, {
  name: string
  description: string
  startAge: number
  startingMoney: number
  startingReputation: number
  baseStats: DriverStats
}>

// Helper to create a new player from a scenario
export function createPlayerFromScenario(
  scenario: CareerScenario,
  firstName: string,
  lastName: string,
  nationality: string,
  options?: {
    affiliatedManufacturer?: string
    backstoryTraits?: string[]
    customAge?: number
  }
): PlayerDriver {
  const preset = CAREER_SCENARIOS[scenario]
  const backgroundScenario = getScenarioById(scenario)
  
  // Use custom age if provided, otherwise use preset
  const age = options?.customAge || preset.startAge
  const birthYear = new Date().getFullYear() - age
  
  // Create background from scenario
  const background = backgroundScenario 
    ? createBackgroundFromScenario(
        backgroundScenario,
        options?.backstoryTraits || [],
        options?.affiliatedManufacturer
      )
    : undefined
  
  // Determine if this is a scenario with prior race history
  const hasRaceHistory = ['ex_pro_comeback', 'recovering_champion', 'national_champion'].includes(scenario)
  const isChampion = ['recovering_champion', 'national_champion'].includes(scenario)
  
  return {
    id: `player_${Date.now()}`,
    firstName,
    lastName,
    nationality,
    dateOfBirth: new Date(birthYear, 0, 1).toISOString(),
    age,
    careerStartAge: age,
    scenario,
    stats: { ...preset.baseStats },
    mentalState: {
      confidence: 60,
      stress: background?.mediaScrutinyLevel === 'intense' ? 40 : 30,
      fatigue: 10,
      morale: 70
    },
    health: {
      fitness: preset.baseStats.fitness,
      injured: false
    },
    finances: {
      bankBalance: preset.startingMoney,
      salary: 0,
      bonusPerWin: 0,
      bonusPerPodium: 0,
      debts: 0,
      transactions: [{
        id: 'initial',
        date: new Date().toISOString(),
        week: 1,
        year: new Date().getFullYear(),
        type: 'income',
        category: 'other',
        amount: preset.startingMoney,
        description: 'Starting funds'
      }],
      sponsorDeals: []
    },
    totalRaces: hasRaceHistory ? (isChampion ? 60 : 45) : 0,
    totalWins: hasRaceHistory ? (isChampion ? 8 : 3) : 0,
    totalPodiums: hasRaceHistory ? (isChampion ? 20 : 12) : 0,
    totalPoles: hasRaceHistory ? (isChampion ? 10 : 5) : 0,
    championships: isChampion ? 1 : 0,
    reputation: preset.startingReputation,
    raceHistory: [],
    background,
    trackHistory: {},  // Historical track data - builds up over career
    goatProgress: createDefaultGOATProgress(),  // GOAT achievement tracking
    
    // Extended stats for achievements
    totalFastestLaps: 0,
    consecutiveWins: 0,
    consecutivePodiums: 0,
    consecutivePoints: 0,
    hatTricks: 0,
    grandSlams: 0,
    comebackWins: hasRaceHistory ? 1 : 0,  // Ex-pros may have some comeback wins
    seasonsCompleted: 0,
    perfectSeasons: 0,
    dnfFreeSeasons: 0,
    seriesChampionships: isChampion ? ['previous-series'] : [],  // Placeholder for ex-champions
    
    // Media Star Power (Dual-Path Progression)
    // Derive tier from starting reputation
    mediaStarPower: createDefaultMediaStarPower(
      preset.startingReputation >= 80 ? 'elite' : 
      preset.startingReputation >= 60 ? 'pro' : 
      preset.startingReputation >= 40 ? 'semi-pro' : 'amateur',
      preset.startingReputation
    )
  }
}
