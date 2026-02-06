/**
 * Extended Personal Life Types
 * 
 * This file contains all type definitions for the expanded life simulation systems,
 * including messaging, hobbies, collections, social media, vacations, and retirement.
 */

import type { Conversation, TextMessage, NpcMood } from '@/data/messaging-config';

export interface MessagingState {
  conversations: Record<string, Conversation>
  contacts: ContactInfo[]
  unreadTotal: number
  
  // Dating pool
  potentialDates: PotentialDate[]
  
  // Pending actions
  pendingGifts: PendingGift[]
  pendingDateInvites: PendingDateInvite[]
}

export interface ContactInfo {
  id: string
  name: string
  type: 'partner' | 'family' | 'friend' | 'business' | 'rival' | 'potential_date'
  traits: string[]
  
  // Portrait and identity
  portraitId?: string           // Links to asset system
  gender?: 'male' | 'female'    // For portrait matching
  
  // Bio - AI-generated backstory and personality details
  bio?: SocialBio
  
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
  datingStatus?: 'stranger' | 'acquaintance' | 'talking' | 'dating' | 'exclusive'
}

export interface PotentialDate {
  id: string
  firstName: string
  lastName: string
  age: number
  occupation: string
  nationality: string
  
  traits: string[]
  interests: string[]
  
  // Bio - AI-generated backstory and personality details
  bio?: SocialBio
  
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
// EXPANDED HOBBY STATE
// ============================================

export interface ExpandedHobbiesState {
  hobbies: DeepHobby[]
  scheduledLessons: HobbyLesson[]
  totalPracticeHoursThisWeek: number
  availablePracticeHours: number
  instructors: HobbyInstructor[]
}

export interface HobbyInstructor {
  id: string
  name: string
  hobbyId: string
  expertise: number
  lessonCost: number
  availability: number[]  // Days available
  relationship: number
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
// COMPLETE EXPANDED PERSONAL LIFE STATE
// ============================================

export interface ExpandedPersonalLifeState {
  // Core systems (from original PersonalLifeState)
  finances: PersonalFinancialState
  teamEquity?: TeamEquityStake
  partner?: Partner
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
  occupation?: string
  traits: string[]
  happiness: number
  
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
    pendingDateInvites: []
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
