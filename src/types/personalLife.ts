/**
 * Extended Personal Life Types
 * 
 * This file contains all type definitions for the expanded life simulation systems,
 * including messaging, hobbies, collections, social media, vacations, and retirement.
 */

import type { Conversation, TextMessage, NpcMood } from '@/data/messaging-config';
import type { DeepHobby, HobbyLesson, HobbyInstructor } from '@/data/hobbies-deep-config';
import type { Course, Certification, Book } from '@/data/education-config';
import type { Collection, CollectionEvent } from '@/data/collections-config';
import type { SocialMediaProfile, SocialPost, TrollEncounter } from '@/data/social-media-config';
import type { PrivacyState, PaparazziSighting, LeakedStory } from '@/data/privacy-config';
import type { BookDeal, DocumentaryDeal, PodcastDeal, SpeakingEngagement } from '@/data/personal-brand-expanded-config';
import type { CauseSupport, PoliticalStance, ActivismEvent } from '@/data/activism-config';
import type { Vacation } from '@/data/travel-config';
import type { LifestyleAssets, LifestyleScoreBreakdown } from '@/data/lifestyle-assets-config';
import type { RetirementPlan } from '@/data/retirement-config';

export interface SocialBio {
  background: string
  careerNarrative: string
  personalityDescription: string
  lifeSituation: string
  anecdotes: string[]
  interests?: string[]
  quirks?: string[]
  values?: string[]
}

export interface MessagingState {
  conversations: Record<string, Conversation>
  contacts: ContactInfo[]
  unreadTotal: number
  lastMessageTime?: { week: number; day: number; year: number }
  
  // Dating pool
  potentialDates: PotentialDate[]
  
  // Pending actions
  pendingGifts: PendingGift[]
  pendingDateInvites: PendingDateInvite[]
  
  // ── Group chats ──
  groupConversations?: Record<string, GroupConversation>
  
  // ── Social graph — who knows who ──
  socialConnections?: Record<string, string[]>  // contactId -> [known contact IDs]
  
  // ── Pending contact requests (gameplay actions requested by NPCs) ──
  pendingRequests?: ContactRequest[]
  
  // ── Queued NPC messages (delayed delivery for realism) ──
  queuedMessages?: QueuedNpcMessage[]
  
  // ── Pending NPC replies (background generation — player can leave the chat) ──
  pendingNpcReplies?: Record<string, PendingNpcReply>   // conversationId -> pending reply
  
  // ── Social action cooldown tracking ──
  socialActionHistory?: SocialActionRecord[]
}

// ============================================
// PENDING NPC REPLY (Background Generation)
// ============================================

export interface PendingNpcReply {
  conversationId: string
  contactId: string
  playerMessage: string
  messageCategory: string
  status: 'generating' | 'ready' | 'delivered'
  generatedResponse?: {
    message: string
    tone: string
    mood: string
    affectionChange: number
    romanceChange: number
    trustChange: number
    emotionalReaction: string
    suggestedFollowUp?: string
    wantsToMeetUp: boolean
    shouldEndConversation?: boolean
    topicTag?: string
    actionRequest?: any
  }
  queuedAt: number               // Date.now() when queued
  deliverAfterMs: number          // How many real ms to wait before showing (typing simulation)
}

// ============================================
// QUEUED NPC MESSAGES (Delayed Delivery)
// ============================================

export interface QueuedNpcMessage {
  id: string
  conversationId: string
  contactId: string
  message: TextMessage
  actionRequest?: {               // Invitation/offer from NPC-initiated message
    type: string
    description: string
    suggestedDay?: number
    timeCost?: number
    moneyCost?: number
  }
  scheduledDeliveryHour: number    // Game hour (0-24) when message should appear
  scheduledDeliveryDay: number     // Day of week (1-7)
  scheduledDeliveryWeek: number    // Week number
  scheduledDeliveryYear: number    // Year
  delivered: boolean
}

// ============================================
// GROUP CONVERSATIONS
// ============================================

export type GroupChatType = 'team_staff' | 'series_drivers' | 'family' | 'friend_group'

export interface GroupConversation {
  id: string
  name: string
  type: GroupChatType
  participantIds: string[]       // Contact IDs in the group
  
  messages: TextMessage[]
  lastMessageTime: { week: number; day: number; year: number }
  unreadCount: number
  
  // Group avatar (optional, use first 4 participant portraits)
  avatarContactIds?: string[]
}

// ============================================
// CONTACT REQUESTS (NPC-initiated gameplay)
// ============================================

export type ContactRequestType = 
  | 'race_tickets'       // Friend wants paddock passes
  | 'dinner_invite'      // Friend/partner wants quality time
  | 'career_favor'       // Business contact wants help
  | 'sponsor_appearance' // Sponsor rep wants you at an event
  | 'contract_talk'      // Staff wants to discuss contract
  | 'date_request'       // Partner wants a date night
  | 'wager'              // Rival proposes a bet
  | 'introduction'       // Contact offers to introduce someone new
  | 'advice'             // Contact asks for advice
  | 'media_request'      // Journalist wants a comment/interview
  | 'charity_ask'        // Foundation contact asks for support
  | 'social_invite'      // Contact invites you to an event

export interface ContactRequest {
  id: string
  contactId: string
  type: ContactRequestType
  description: string            // AI-generated request text
  
  // Costs & rewards
  timeCost?: number              // Hours from day budget
  moneyCost?: number             // Cash cost
  relationshipReward?: number    // Relationship points gained
  secondaryReward?: string       // Description of additional reward
  
  // Scheduling
  suggestedDay?: number          // 1-7 (Mon-Sun) - proposed day for the event
  suggestedWeek?: number         // Week number the NPC proposed for the event
  scheduledWeek?: number         // Week number when event is scheduled
  scheduledDay?: number          // Day of week when event is scheduled (1-7)
  scheduledYear?: number         // Year when event is scheduled
  
  // Invitation metadata
  eventName?: string             // Short name for the invitation (e.g., "Luxury Partners Gathering")
  venue?: string                 // Optional location context
  
  // Deadline
  expiresWeek: number
  expiresYear: number
  
  // State
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'completed'
  
  // For wagers
  wagerAmount?: number
  wagerCondition?: string
}

// ============================================
// CONVERSATION TOPIC TRACKING
// ============================================

export interface ConversationTopic {
  topic: string                  // e.g., 'finances', 'spa_race', 'partner_issues'
  week: number
  year: number
  sentiment: 'positive' | 'neutral' | 'negative'
  /** Brief summary of what was discussed */
  summary?: string
}

export type ContactType = 'partner' | 'family' | 'friend' | 'business' | 'rival' | 'potential_date' | 'team_staff' | 'rival_driver' | 'sponsor_rep' | 'team_principal'

/** Knowledge tier determines what game-state information this contact would realistically know */
export type KnowledgeTier = 'public' | 'paddock' | 'inner_circle' | 'team_only' | 'partner_only'

export interface ContactInfo {
  id: string
  name: string
  type: ContactType
  traits: string[]
  
  // Portrait and identity
  portraitId?: string           // Links to asset system
  gender?: 'male' | 'female'    // For portrait matching
  nationality?: string
  age?: number
  occupation?: string
  
  // Bio - AI-generated backstory and personality details
  bio?: SocialBio
  
  // ── Pre-gen profile fields (carried through from pool data) ──
  pregenId?: string              // Link back to pool for lookup
  conversationTopics?: string[]  // What they naturally talk about
  canHelp?: string[]             // How they can help your career
  connectionToMotorsport?: string // Their link to the racing world
  personalitySummary?: string    // AI-friendly personality description
  educationLevel?: string
  wealthLevel?: string
  socialCircle?: string
  interests?: string[]           // Hobbies and interests
  
  // Pre-gen partner-specific fields (for romantic contacts)
  desires?: {
    wantsChildren: boolean
    desiredChildrenCount: number
    wantsMarriage: boolean
    lifestyleExpectations: string
    qualityTimeImportance: number
    socialLifeImportance: number
    privacyImportance: number
  }
  dealBreakers?: string[]
  loveLanguage?: string
  firstImpression?: string
  style?: string
  
  // Pre-gen staff-specific fields (for team_staff contacts)
  staffRole?: string             // chief_engineer, strategist, pr_manager, etc.
  staffPersonality?: string      // personality string from PreGenStaffProfile
  staffQuirks?: string[]         // quirks from PreGenStaffProfile
  
  // Pre-gen rival driver fields
  driverPersonality?: 'aggressive' | 'calculating' | 'flashy' | 'steady' | 'inconsistent' | 'defensive'
  driverCareerStage?: 'rising' | 'peak' | 'declining' | 'veteran'
  driverTeamName?: string
  driverSeriesName?: string
  
  // Pre-gen sponsor rep fields
  sponsorName?: string
  sponsorTier?: string
  sponsorCategory?: string
  
  // Pre-gen team principal fields
  teamNarrativeId?: string
  teamPhilosophy?: string
  
  // Relationship meters
  relationshipLevel: number     // 0-100
  affectionMeter: number        // 0-100
  romanceMeter: number          // 0-100 (only for romantic contacts)
  trustMeter: number            // 0-100
  
  // Mood
  currentMood: NpcMood
  
  // Status
  isOnline?: boolean
  lastSeen?: string
  isFavorite?: boolean
  
  // For potential dates
  metAt?: string
  metWeek?: number
  metYear?: number
  datingStatus?: 'stranger' | 'acquaintance' | 'talking' | 'dating' | 'exclusive' | 'engaged' | 'married'
  
  // Starter contact flag (set during career creation)
  isStarterContact?: boolean
  
  // ── Emergent romance (partner-pool friends who can become romantic interests) ──
  romanticEligible?: boolean       // True if this contact can become a romantic interest (has partner pool portrait/data)
  partnerPoolId?: string           // Links back to partner pool profile for romance transition
  
  // ── Messaging behavior (derived from personality) ──
  messagingStyle?: {
    frequency: 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
    messageLength: 'very_short' | 'short' | 'medium' | 'long' | 'very_long'
    emojiUsage: 'none' | 'rare' | 'moderate' | 'frequent' | 'excessive'
    responseSpeed: 'instant' | 'fast' | 'normal' | 'slow' | 'very_slow'
    formality: 'very_formal' | 'formal' | 'casual' | 'very_casual' | 'slang'
  }
  
  // ── Social graph ──
  knownContactIds?: string[]     // Other contacts this person knows
  introducedBy?: string          // Contact ID who introduced this person
}

export interface PotentialDate {
  id: string
  firstName: string
  lastName: string
  age: number
  occupation: string
  nationality: string
  gender: 'male' | 'female'
  
  traits: string[]
  interests: string[]
  
  // Bio - AI-generated backstory and personality details
  bio?: SocialBio
  
  // Pre-gen partner fields carried through
  pregenId?: string
  desires?: {
    wantsChildren: boolean
    desiredChildrenCount: number
    wantsMarriage: boolean
    lifestyleExpectations: string
    qualityTimeImportance: number
    socialLifeImportance: number
    privacyImportance: number
  }
  dealBreakers?: string[]
  loveLanguage?: string
  firstImpression?: string
  style?: string
  educationLevel?: string
  wealthLevel?: string
  socialCircle?: string
  
  compatibilityScore: number
  interestLevel: number
  
  metAt: string
  metWeek: number
  metYear: number
  
  conversationStage: 'stranger' | 'acquaintance' | 'talking' | 'dating' | 'exclusive'
}

export interface PendingGift {
  id: string
  recipientId: string
  giftName: string
  giftValue: number
  sentWeek: number
  sentYear: number
  delivered: boolean
  reaction?: 'loved' | 'liked' | 'neutral' | 'disappointed'
}

export interface PendingDateInvite {
  id: string
  recipientId: string
  dateType: string
  location: string
  proposedWeek: number
  status: 'pending' | 'accepted' | 'declined' | 'completed'
}

// ============================================
// SOCIAL ACTION HISTORY (cooldown tracking)
// ============================================

export interface SocialActionRecord {
  actionId: string
  contactId: string
  executedWeek: number
  executedYear: number
}

// ============================================
// EXPANDED HOBBY STATE
// ============================================

export interface ExpandedHobbiesState {
  hobbies: DeepHobby[]
  scheduledLessons: HobbyLesson[]
  totalPracticeHoursThisWeek: number
  availablePracticeHours: number
  instructors: HobbyInstructor[]
}

// ============================================
// EDUCATION STATE
// ============================================

export interface EducationState {
  enrolledCourses: Course[]
  completedCourses: string[]
  certifications: Certification[]
  
  currentlyReading?: Book
  booksRead: Book[]
  readingList: Book[]
  
  knowledgeAreas: Record<string, number>  // area -> level
  totalStudyHoursThisWeek: number
}

// ============================================
// COLLECTIONS STATE
// ============================================

export interface CollectionsState {
  collections: Collection[]
  upcomingEvents: CollectionEvent[]
  totalPortfolioValue: number
  totalAppreciation: number
  insuranceCosts: number
}

// ============================================
// SOCIAL MEDIA STATE (EXPANDED)
// ============================================

export interface ExpandedSocialMediaState {
  profiles: Record<string, SocialMediaProfile>
  recentPosts: SocialPost[]
  scheduledPosts: SocialPost[]
  pendingTrolls: TrollEncounter[]
  
  totalFollowers: number
  weeklyGrowth: number
  averageEngagement: number
  viralPostsCount: number
  
  controversyLevel: number
}

// ============================================
// PRIVACY STATE
// ============================================

export interface ExtendedPrivacyState extends PrivacyState {
  recentSightings: PaparazziSighting[]
  activeLeaks: LeakedStory[]
  suppressedStories: string[]
}

// ============================================
// PERSONAL BRAND STATE (EXPANDED)
// ============================================

export interface ExpandedBrandState {
  brandValue: number
  publicPerception: number
  authenticity: number
  
  bookDeal?: BookDeal
  documentaryDeal?: DocumentaryDeal
  podcastDeal?: PodcastDeal
  
  speakingEngagements: SpeakingEngagement[]
  upcomingSpeaking: SpeakingEngagement[]
  
  talkShowAppearances: number
  magazineCovers: number
  pendingInterviewRequests: InterviewRequest[]
}

export interface InterviewRequest {
  id: string
  outlet: string
  topic: string
  compensation: number
  deadline: { week: number; year: number }
  riskLevel: 'safe' | 'medium' | 'risky'
}

// ============================================
// ACTIVISM STATE
// ============================================

export interface ActivismState {
  supportedCauses: CauseSupport[]
  politicalStances: PoliticalStance[]
  upcomingEvents: ActivismEvent[]
  
  totalDonations: number
  awarenessRaised: number
  controversyFromActivism: number
  sponsorConcerns: string[]
}

// ============================================
// TRAVEL STATE
// ============================================

export interface TravelState {
  upcomingVacations: Vacation[]
  pastVacations: Vacation[]
  
  totalVacationDays: number
  memoriesCreated: string[]
  favoriteDestinations: string[]
  
  passportStamps: string[]  // Countries visited
}

// ============================================
// RETIREMENT STATE
// ============================================

export interface ExtendedRetirementState extends RetirementPlan {
  careerPathProgress: Record<string, number>  // path -> progress %
  completedLegacyGoals: string[]
  mentoringRelationships: MentoringRelationship[]
}

export interface MentoringRelationship {
  id: string
  driverName: string
  startYear: number
  progressMade: number
  lessonsGiven: number
}

// ============================================
// RELATIONSHIP MILESTONES & TIMELINE
// ============================================

export type RelationshipMilestoneType =
  | 'first_message'
  | 'first_date'
  | 'first_kiss'
  | 'became_exclusive'
  | 'said_i_love_you'
  | 'met_family'
  | 'moved_in'
  | 'first_vacation'
  | 'anniversary_1_year'
  | 'anniversary_5_year'
  | 'romantic_spark'      // Friend → potential_date transition
  | 'player_breakup'      // Player-initiated breakup
  | 'player_divorce'      // Player-initiated divorce

export interface RelationshipMilestone {
  type: RelationshipMilestoneType
  week: number
  year: number
  description: string
}

export interface RelationshipTimeline {
  milestones: RelationshipMilestone[]
  startWeek: number
  startYear: number
  currentStage: 'talking' | 'dating' | 'exclusive' | 'engaged' | 'married'
  argumentCount: number
  unresolvedConflicts: number
  breakupWarningLevel: number
}

export interface RelationshipEvent {
  id: string
  type: 'argument' | 'milestone' | 'date' | 'surprise' | 'crisis'
  description: string
  choices: RelationshipEventChoice[]
  week: number
  year: number
}

export interface RelationshipEventChoice {
  id: string
  text: string
  effects: {
    happiness?: number
    love?: number
    trust?: number
    romance?: number
  }
  riskLevel: 'safe' | 'mild' | 'risky'
}

export type DateQuality = 'amazing' | 'great' | 'good' | 'awkward' | 'disaster'

export interface DateOutcome {
  quality: DateQuality
  description: string
  moodChange: number
  romanceChange: number
  trustChange: number
  specialMoment?: string
  milestone?: RelationshipMilestoneType
}

// ============================================
// SEPARATION PROCESS (Breakups & Divorces)
// ============================================

export interface SeparationProcess {
  type: 'breakup' | 'divorce'
  initiatedBy: 'player' | 'partner'
  startWeek: number
  startYear: number
  estimatedDurationDays: number   // Breakup: 2-4 days. Divorce: 28-112 days (4-16 weeks)
  daysElapsed: number
  isFinalized: boolean
  partnerName: string             // For UI display
  // Divorce-specific: preview for UI, full settlement for processDivorce at finalization
  settlementPreview?: {
    alimonyMonthly: number
    childSupportMonthly: number
    assetDivisionPercent: number
    estimatedAssetLoss: number
  }
  /** Full settlement calculated at initiation; used when finalizing divorce */
  settlement?: import('@/simulation/personal/relationshipManager').DivorceSettlement
}

// ============================================
// COMPLETE EXPANDED PERSONAL LIFE STATE
// ============================================

export interface ExpandedPersonalLifeState {
  // Core systems (from original PersonalLifeState)
  finances: PersonalFinancialState
  teamEquity?: TeamEquityStake
  partner?: Partner
  
  // Separation process (breakup/divorce in progress)
  separationProcess?: SeparationProcess
  children: Child[]
  familyTree?: FamilyTree
  health: OwnerHealth
  
  // LIFESTYLE SYSTEM - Asset-based calculation
  // lifestyleLevel is now CALCULATED from owned assets
  // Kept for backwards compatibility but should use lifestyleScore.level
  lifestyleLevel: LifestyleLevel
  lifestyleAssets: LifestyleAssets        // Owned vehicles, furnishings, memberships
  lifestyleScore?: LifestyleScoreBreakdown // Calculated breakdown of lifestyle score
  
  staff: PersonalStaff[]
  brand: PersonalBrand
  contacts: SocialContact[]
  rivalries: Rivalry[]
  scandals: Scandal[]
  foundations: CharityFoundation[]
  
  // NEW: Messaging & Dating
  messaging: MessagingState
  
  // NEW: Expanded Hobbies with skill progression
  expandedHobbies: ExpandedHobbiesState
  
  // NEW: Education & Learning
  education: EducationState
  
  // NEW: Collections
  collections: CollectionsState
  
  // NEW: Expanded Social Media
  socialMedia: ExpandedSocialMediaState
  
  // NEW: Privacy & Paparazzi
  privacy: ExtendedPrivacyState
  
  // NEW: Expanded Personal Brand
  expandedBrand: ExpandedBrandState
  
  // NEW: Activism & Causes
  activism: ActivismState
  
  // NEW: Travel & Vacations
  travel: TravelState
  
  // NEW: Retirement Planning
  retirement: ExtendedRetirementState
  
  // COMPUTED: Weekly lifestyle bonuses applied to gameplay
  // These are recalculated every week from owned assets and partner traits
  lifestyleFatigueReduction?: number     // Reduces daily fatigue debt (from diet/services energy bonus)
  lifestyleBonusHours?: number           // Extra hours per day (from luxury services timeFreedPerWeek)
  lifestylePrestigeBonus?: number        // Aggregated prestige from all assets (affects brand, sponsors, social events)
  lifestyleConfidenceBonus?: number      // Aggregated confidence from wardrobe (affects negotiations)
  lifestyleNetworkingBonus?: number      // Aggregated networking from memberships/wardrobe (affects social event contact quality)
  partnerSponsorAttractionBonus?: number // Partner trait bonus for sponsor interest
  partnerSocialEventBonus?: number       // Partner trait bonus for social event outcomes
  partnerPublicImageBonus?: number       // Partner trait bonus for public image
}

// ============================================
// RE-EXPORT BASE TYPES (for convenience)
// ============================================

// These should be imported from family-config or similar
export interface PersonalFinancialState {
  liquidCash: number
  netWorth: number
  monthlyIncome: {
    salary?: number
    dividends?: number
    endorsements?: number
    rentalIncome?: number
    investmentReturns?: number
  }
  monthlyExpenses: {
    lifestyle?: number
    staffSalaries?: number
    propertyMaintenance?: number
    insurances?: number
    childSupport?: number
    alimony?: number
    loanPayments?: number
    other?: number
  }
  taxBracket: number
  creditScore: number
  personalLoans: PersonalLoan[]
  mortgages: Mortgage[]
}

export interface PersonalLoan {
  id: string
  amount: number
  interestRate: number
  monthlyPayment: number
  remainingBalance: number
  purpose: string
}

export interface Mortgage {
  id: string
  propertyId: string
  principal: number
  interestRate: number
  monthlyPayment: number
  remainingBalance: number
  yearsRemaining: number
}

export interface TeamEquityStake {
  teamId: string
  ownershipPercent: number
  initialInvestment: number
  currentValuation: number
  purchaseYear: number
}

export interface Partner {
  id: string
  firstName: string
  lastName: string
  age: number
  gender: 'male' | 'female'
  occupation?: string
  nationality?: string
  traits: string[]
  happiness: number
  
  // Pre-gen profile link
  pregenId?: string
  
  // Pre-gen partner-specific data
  interests?: string[]
  desires?: {
    wantsChildren: boolean
    desiredChildrenCount: number
    wantsMarriage: boolean
    lifestyleExpectations: string
    qualityTimeImportance: number
    socialLifeImportance: number
    privacyImportance: number
  }
  dealBreakers?: string[]
  loveLanguage?: string
  firstImpression?: string
  style?: string
  educationLevel?: string
  wealthLevel?: string
  socialCircle?: string
  
  // Relationship meters
  affectionMeter: number
  romanceMeter: number
  trustMeter: number
  
  // Mood system
  currentMood: NpcMood
  
  // Relationship timeline
  metYear: number
  datingStartYear?: number
  marriageYear?: number
  divorceYear?: number
}

export interface Child {
  id: string
  firstName: string
  age: number
  gender: 'male' | 'female'
  birthYear: number
  happiness: number
  relationship: number
  
  // Development
  education?: string
  interests: string[]
  racingInterest?: number
  
  // Inheritance
  trustFundAmount?: number
}

export interface FamilyTree {
  generations: number
  dynastyYears: number
  totalChildren: number
  totalGrandchildren: number
}

export interface OwnerHealth {
  overall: number
  stress: number
  fitness: number
  fitnessLevel: number        // Alias for fitness (0-100)
  mentalHealth: number
  
  age: number
  lifeExpectancy: number
  
  activeConditions: string[]
  healthcareLevel: 'basic' | 'standard' | 'premium' | 'executive' | 'concierge'
}

export interface LifestyleLevel {
  tier: 'modest' | 'comfortable' | 'affluent' | 'luxurious' | 'ultra_luxury'
  monthlyCost: number
}

export interface PersonalStaff {
  id: string
  name: string
  role: string
  salary: number
  effectiveness: number
}

export interface PersonalBrand {
  value: number
  recognition: number
  reputation: number
}

export interface SocialContact {
  id: string
  name: string
  type: string
  relationship: number
}

export interface Rivalry {
  id: string
  rivalName: string
  intensity: number
  origin: string
  isActive: boolean
}

export interface Scandal {
  id: string
  type: string
  severity: number
  isResolved: boolean
  publicKnowledge: boolean
  reputationDamage: number
}

export interface CharityFoundation {
  id: string
  name: string
  cause: string
  totalRaised: number
  annualBudget: number
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

export function createDefaultMessagingState(): MessagingState {
  return {
    conversations: {},
    contacts: [],
    unreadTotal: 0,
    potentialDates: [],
    pendingGifts: [],
    pendingDateInvites: [],
    groupConversations: {},
    socialConnections: {},
    pendingRequests: [],
    socialActionHistory: [],
  }
}

export function createDefaultExpandedHobbiesState(): ExpandedHobbiesState {
  return {
    hobbies: [],
    scheduledLessons: [],
    totalPracticeHoursThisWeek: 0,
    availablePracticeHours: 10,
    instructors: []
  }
}

export function createDefaultEducationState(): EducationState {
  return {
    enrolledCourses: [],
    completedCourses: [],
    certifications: [],
    booksRead: [],
    readingList: [],
    knowledgeAreas: {},
    totalStudyHoursThisWeek: 0
  }
}

export function createDefaultCollectionsState(): CollectionsState {
  return {
    collections: [],
    upcomingEvents: [],
    totalPortfolioValue: 0,
    totalAppreciation: 0,
    insuranceCosts: 0
  }
}

export function createDefaultExpandedSocialMediaState(): ExpandedSocialMediaState {
  return {
    profiles: {
      instagram: {
        platform: 'instagram',
        handle: '@driver',
        verified: false,
        followers: 100000,
        following: 500,
        followersGrowthRate: 500,
        engagementRate: 3.5,
        avgLikes: 5000,
        avgComments: 200,
        avgShares: 100,
        totalPosts: 50,
        postsThisWeek: 0,
        scheduledPosts: [],
        viralPosts: 0,
        trollActivity: 10,
        fanClubSize: 1000,
        controversyLevel: 0,
        isMonetized: false,
        monthlyAdRevenue: 0,
        sponsoredPostRate: 0
      },
      twitter: {
        platform: 'twitter',
        handle: '@driver',
        verified: false,
        followers: 50000,
        following: 200,
        followersGrowthRate: 200,
        engagementRate: 2.0,
        avgLikes: 500,
        avgComments: 50,
        avgShares: 25,
        totalPosts: 100,
        postsThisWeek: 0,
        scheduledPosts: [],
        viralPosts: 0,
        trollActivity: 20,
        fanClubSize: 500,
        controversyLevel: 0,
        isMonetized: false,
        monthlyAdRevenue: 0,
        sponsoredPostRate: 0
      }
    },
    recentPosts: [],
    scheduledPosts: [],
    pendingTrolls: [],
    totalFollowers: 150000,
    weeklyGrowth: 700,
    averageEngagement: 2.75,
    viralPostsCount: 0,
    controversyLevel: 0
  }
}

export function createDefaultPrivacyState(): ExtendedPrivacyState {
  return {
    privacyLevel: 'balanced',
    securityTeamSize: 0,
    securityBudget: 0,
    homeSecurityLevel: 50,
    hasSecureCompound: false,
    paparazziInterest: 30,
    knownHangouts: [],
    paparazziAgencies: [],
    recentSightings: [],
    leakedStories: [],
    pendingLeaks: [],
    activeRestrainingOrders: 0,
    lawsuitsAgainstMedia: [],
    photosSoldThisYear: 0,
    storiesLeakedThisYear: 0,
    legalVictories: 0,
    activeLeaks: [],
    suppressedStories: []
  }
}

export function createDefaultExpandedBrandState(): ExpandedBrandState {
  return {
    brandValue: 500000,
    publicPerception: 70,
    authenticity: 80,
    speakingEngagements: [],
    upcomingSpeaking: [],
    talkShowAppearances: 0,
    magazineCovers: 0,
    pendingInterviewRequests: []
  }
}

export function createDefaultActivismState(): ActivismState {
  return {
    supportedCauses: [],
    politicalStances: [],
    upcomingEvents: [],
    totalDonations: 0,
    awarenessRaised: 0,
    controversyFromActivism: 0,
    sponsorConcerns: []
  }
}

export function createDefaultTravelState(): TravelState {
  return {
    upcomingVacations: [],
    pastVacations: [],
    totalVacationDays: 0,
    memoriesCreated: [],
    favoriteDestinations: [],
    passportStamps: []
  }
}

export function createDefaultRetirementState(): ExtendedRetirementState {
  return {
    plannedRetirementAge: 45,
    yearsUntilRetirement: 15,
    retirementFund: 0,
    targetRetirementFund: 5000000,
    passiveIncomeStreams: [],
    projectedMonthlyIncome: 0,
    financiallyReady: false,
    primaryPath: undefined,
    backupPath: undefined,
    exploredPaths: [],
    legacyGoals: [],
    mentalReadiness: 50,
    identityCrisisRisk: 30,
    supportNetwork: 60,
    preparationSteps: [],
    advisorsConsulted: [],
    careerPathProgress: {},
    completedLegacyGoals: [],
    mentoringRelationships: []
  }
}
