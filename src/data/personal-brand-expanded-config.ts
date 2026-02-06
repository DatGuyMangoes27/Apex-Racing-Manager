// ============================================
// PERSONAL BRAND EXPANSION CONFIGURATION
// ============================================
// Book deals, documentaries, podcasts, and speaking engagements.

// ============================================
// DEAL TYPES
// ============================================

export type MediaDealType = 
  | 'autobiography'
  | 'business_book'
  | 'documentary'
  | 'docuseries'
  | 'podcast'
  | 'reality_show'
  | 'speaking'
  | 'masterclass'

export type DealStatus = 
  | 'offered'
  | 'negotiating'
  | 'signed'
  | 'in_production'
  | 'released'
  | 'completed'
  | 'cancelled'

// ============================================
// BOOK DEALS
// ============================================

export interface BookDeal {
  id: string
  type: 'autobiography' | 'memoir' | 'business' | 'fitness' | 'cooking' | 'children'
  title: string
  publisher: string
  
  // Status
  status: DealStatus
  
  // Writing
  ghostwriter?: GhostWriter
  chaptersCompleted: number
  totalChapters: number
  manuscriptDeadline: { week: number; year: number }
  
  // Financial
  advancePayment: number
  royaltyPercent: number
  projectedFirstYearSales: number
  
  // Content decisions
  revealLevel: 'sanitized' | 'honest' | 'tell_all'
  controversialTopics: ControversialTopic[]
  
  // People featured
  peopleInterviewed: string[]
  peopleMentioned: string[]
  
  // Impact
  expectedControversy: number   // 0-100
  expectedSales: { low: number; mid: number; high: number }
  relationshipRisks: { person: string; risk: string }[]
  
  // Publication
  publicationDate?: { week: number; year: number }
  actualSales?: number
  
  // Reviews
  criticScore?: number          // 0-100
  publicRating?: number         // 1-5 stars
}

export interface GhostWriter {
  id: string
  name: string
  reputation: string
  previousWorks: string[]
  
  fee: number                   // Total
  style: 'journalistic' | 'conversational' | 'literary'
  
  // Quality
  writingQuality: number        // 0-100
  researchDepth: number
  
  // Relationship
  hoursSpentInterviewing: number
}

export interface ControversialTopic {
  topic: string
  description: string
  
  // Risk assessment
  truthLevel: number            // 0-100, how accurate
  legalRisk: 'none' | 'low' | 'medium' | 'high'
  
  // People affected
  affectedPeople: { name: string; reaction: 'upset' | 'furious' | 'legal_action' }[]
  
  // Impact
  salesImpact: number           // Positive = more sales
  reputationImpact: number
  controversyGenerated: number
}

// ============================================
// DOCUMENTARIES
// ============================================

export interface DocumentaryDeal {
  id: string
  title: string
  type: 'documentary' | 'docuseries'
  platform: 'Netflix' | 'Amazon' | 'Apple' | 'HBO' | 'Disney+' | 'broadcast'
  
  // Status
  status: DealStatus
  
  // Production
  director: string
  productionCompany: string
  productionBudget: number
  
  // Filming
  filmingWeeksRequired: number
  filmingWeeksCompleted: number
  behindScenesAccess: 'limited' | 'moderate' | 'full' | 'unprecedented'
  
  // Content
  focusAreas: DocumentaryFocus[]
  interviewSubjects: InterviewSubject[]
  footageRights: boolean        // Access to race footage
  
  // Your control
  editorialControl: 'none' | 'consultation' | 'approval' | 'final_cut'
  canVetoContent: boolean
  
  // Financial
  upfrontPayment: number
  backendPercent: number        // Of profits
  
  // Timeline
  filmingStart?: { week: number; year: number }
  releaseDate?: { week: number; year: number }
  
  // Episodes (for docuseries)
  totalEpisodes?: number
  episodeLength?: number        // Minutes
  
  // Results
  viewership?: number           // Millions
  criticScore?: number          // Rotten Tomatoes
  awards?: string[]
}

export type DocumentaryFocus = 
  | 'career_journey'
  | 'championship_season'
  | 'team_building'
  | 'family_life'
  | 'controversies'
  | 'rivalries'
  | 'personal_struggles'
  | 'business_empire'

export interface InterviewSubject {
  name: string
  relationship: string
  hasAgreed: boolean
  
  // What they might say
  expectedTone: 'supportive' | 'honest' | 'critical'
  sensitiveTopics: string[]
  
  // Risk
  couldDamage: boolean
  damageRisk: string
}

// ============================================
// PODCASTS
// ============================================

export interface PodcastDeal {
  id: string
  name: string
  type: 'interview' | 'storytelling' | 'educational' | 'cohost' | 'solo'
  
  // Status
  status: DealStatus
  
  // Format
  episodesPerMonth: number
  episodeLength: number         // Minutes
  hoursPerEpisode: number       // Recording + prep
  
  // Content
  topics: string[]
  format: 'conversation' | 'monologue' | 'panel' | 'interview'
  
  // Guests
  canInviteGuests: boolean
  guestBudget?: number
  notableGuests: string[]
  
  // Distribution
  platform: 'spotify_exclusive' | 'apple_exclusive' | 'multi_platform'
  
  // Financial
  dealValue: number             // Total deal value
  perEpisodePayment: number
  sponsorshipRevenue: number    // Per episode
  
  // Performance
  averageListeners?: number
  totalDownloads?: number
  chartPosition?: number
  
  // Duration
  contractLength: number        // Months
  episodesProduced: number
  
  // Benefits
  networkingValue: number       // 0-100
  brandBuildingValue: number
}

// ============================================
// SPEAKING ENGAGEMENTS
// ============================================

export interface SpeakingEngagement {
  id: string
  event: string
  organizer: string
  type: 'keynote' | 'panel' | 'fireside' | 'workshop' | 'commencement'
  
  // Details
  date: { week: number; year: number }
  location: string
  audienceSize: number
  duration: number              // Minutes
  
  // Topic
  topic: string
  customSpeech: boolean         // Or using standard speech
  
  // Financial
  fee: number
  expensesCovered: boolean
  
  // Preparation
  prepHoursRequired: number
  speechWriterUsed: boolean
  speechWriterCost?: number
  
  // Performance
  audienceReaction?: 'standing_ovation' | 'strong_applause' | 'polite' | 'mixed'
  mediaeCoverage?: boolean
  
  // Networking
  notableAttendeees: string[]
  connectionssMade: number
}

export interface SpeakingProfile {
  // Rates
  keynoteFee: number
  panelFee: number
  
  // Experience
  totalEngagements: number
  averageRating: number         // 1-5
  
  // Topics
  expertiseTopics: string[]
  
  // Agent
  hasAgent: boolean
  agentName?: string
  agentCommission?: number      // Percentage
  
  // Availability
  engagementsPerYear: number
  blackoutDates: { start: { week: number; year: number }; end: { week: number; year: number } }[]
}

// ============================================
// MASTERCLASS
// ============================================

export interface MasterclassDeal {
  id: string
  platform: 'MasterClass' | 'Skillshare' | 'own_platform'
  title: string
  
  // Content
  topic: string
  totalLessons: number
  lessonsFilmed: number
  totalRuntime: number          // Minutes
  
  // Production
  filmingDays: number
  productionQuality: 'standard' | 'premium' | 'cinematic'
  
  // Financial
  upfrontPayment: number
  revenueShare: number          // Percentage of subscriptions
  projectedAnnualRevenue: number
  
  // Performance
  enrollments?: number
  rating?: number               // 1-5
  completionRate?: number       // Percentage who finish
  
  // Marketing
  marketingCommitment: number   // What platform spends
  yourMarketingRequired: boolean
}

// ============================================
// DEAL OFFERS
// ============================================

export interface DealOffer {
  id: string
  type: MediaDealType
  offeredBy: string
  
  // Offer details
  description: string
  estimatedValue: number
  
  // Timeline
  offeredDate: { week: number; year: number }
  expiresDate: { week: number; year: number }
  
  // Requirements
  minimumReputation: number
  minimumFollowers: number
  
  // Negotiation
  isNegotiable: boolean
  negotiationRange: { min: number; max: number }
}

// ============================================
// CONFIGURATION
// ============================================

export const PERSONAL_BRAND_CONFIG = {
  // Book deals
  bookAdvanceRange: { min: 100000, max: 5000000 },
  ghostwriterCost: { min: 50000, max: 250000 },
  royaltyRange: { min: 0.1, max: 0.2 },
  averageBookSales: 50000,
  
  // Documentaries
  documentaryPaymentRange: { min: 500000, max: 10000000 },
  filmingTimeRange: { min: 4, max: 52 }, // Weeks
  
  // Podcasts
  podcastDealRange: { min: 100000, max: 5000000 },
  sponsorshipPerEpisode: { min: 5000, max: 50000 },
  
  // Speaking
  baseKeynoteFee: 25000,
  maxKeynoteFee: 500000,
  
  // Masterclass
  masterclassPayment: { min: 500000, max: 2000000 },
  
  // Requirements
  minimumReputationForBook: 50,
  minimumReputationForDocumentary: 60,
  minimumFollowersForPodcast: 100000,
  minimumReputationForSpeaking: 40,
  
  // Time commitments
  bookWritingHoursPerWeek: 10,
  documentaryFilmingHoursPerWeek: 20,
  podcastHoursPerWeek: 5,
  
  // Brand value increases
  bookReleaseReputation: 10,
  documentaryReleaseReputation: 15,
  podcastReputation: 5,
  speakingReputation: 3
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

export function createBookDeal(
  type: BookDeal['type'],
  publisher: string,
  advance: number
): BookDeal {
  return {
    id: `book_${Date.now()}`,
    type,
    title: 'Untitled',
    publisher,
    status: 'offered',
    chaptersCompleted: 0,
    totalChapters: 20,
    manuscriptDeadline: { week: 1, year: 2025 },
    advancePayment: advance,
    royaltyPercent: 0.15,
    projectedFirstYearSales: 50000,
    revealLevel: 'honest',
    controversialTopics: [],
    peopleInterviewed: [],
    peopleMentioned: [],
    expectedControversy: 20,
    expectedSales: { low: 25000, mid: 50000, high: 150000 },
    relationshipRisks: []
  }
}

export function createDocumentaryDeal(
  platform: DocumentaryDeal['platform'],
  director: string
): DocumentaryDeal {
  return {
    id: `doc_${Date.now()}`,
    title: 'Untitled Documentary',
    type: 'documentary',
    platform,
    status: 'offered',
    director,
    productionCompany: '',
    productionBudget: 5000000,
    filmingWeeksRequired: 26,
    filmingWeeksCompleted: 0,
    behindScenesAccess: 'moderate',
    focusAreas: ['career_journey'],
    interviewSubjects: [],
    footageRights: false,
    editorialControl: 'consultation',
    canVetoContent: false,
    upfrontPayment: 1000000,
    backendPercent: 5
  }
}

export function createPodcastDeal(
  platform: PodcastDeal['platform'],
  dealValue: number
): PodcastDeal {
  return {
    id: `podcast_${Date.now()}`,
    name: 'Untitled Podcast',
    type: 'interview',
    status: 'offered',
    episodesPerMonth: 4,
    episodeLength: 60,
    hoursPerEpisode: 3,
    topics: [],
    format: 'conversation',
    canInviteGuests: true,
    notableGuests: [],
    platform,
    dealValue,
    perEpisodePayment: dealValue / 48, // Assuming 1 year
    sponsorshipRevenue: 15000,
    contractLength: 12,
    episodesProduced: 0,
    networkingValue: 60,
    brandBuildingValue: 70
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function calculateBookRoyalties(
  unitsSold: number,
  bookPrice: number,
  royaltyPercent: number
): number {
  return Math.round(unitsSold * bookPrice * royaltyPercent)
}

export function calculateSpeakingFee(
  baseReputation: number,
  followers: number,
  recentAchievements: number
): number {
  let fee = PERSONAL_BRAND_CONFIG.baseKeynoteFee
  
  // Reputation multiplier
  fee *= (1 + baseReputation / 100)
  
  // Followers bonus
  fee += (followers / 100000) * 5000
  
  // Recent achievements
  fee += recentAchievements * 10000
  
  return Math.min(fee, PERSONAL_BRAND_CONFIG.maxKeynoteFee)
}

export function getAvailableDeals(
  reputation: number,
  followers: number,
  _existingDeals: string[]
): MediaDealType[] {
  const available: MediaDealType[] = []
  
  if (reputation >= PERSONAL_BRAND_CONFIG.minimumReputationForBook) {
    available.push('autobiography', 'business_book')
  }
  
  if (reputation >= PERSONAL_BRAND_CONFIG.minimumReputationForDocumentary) {
    available.push('documentary', 'docuseries')
  }
  
  if (followers >= PERSONAL_BRAND_CONFIG.minimumFollowersForPodcast) {
    available.push('podcast')
  }
  
  if (reputation >= PERSONAL_BRAND_CONFIG.minimumReputationForSpeaking) {
    available.push('speaking')
  }
  
  // Always available if somewhat known
  if (reputation >= 30) {
    available.push('masterclass')
  }
  
  return available
}
