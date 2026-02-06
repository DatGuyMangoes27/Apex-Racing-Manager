// ============================================
// SOCIAL MEDIA SIMULATION CONFIGURATION
// ============================================
// Full social media system with posting, followers, trolls, and viral moments.

// ============================================
// PLATFORM TYPES
// ============================================

export type SocialPlatform = 
  | 'instagram'
  | 'twitter'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'

export type ContentType = 
  | 'photo'
  | 'video'
  | 'story'
  | 'text'
  | 'live'
  | 'reel'

export type PostTone = 
  | 'humble'
  | 'confident'
  | 'funny'
  | 'serious'
  | 'controversial'
  | 'promotional'
  | 'personal'
  | 'inspirational'
  | 'casual'
  | 'excited'

export type PostTopic = 
  | 'race_result'
  | 'race_preview'
  | 'behind_scenes'
  | 'personal_life'
  | 'partner_appreciation'
  | 'family'
  | 'hobby'
  | 'travel'
  | 'sponsor_shoutout'
  | 'charity'
  | 'political_stance'
  | 'controversial_opinion'
  | 'responding_to_haters'
  | 'milestone_celebration'
  | 'throwback'
  | 'motivation'
  | 'workout'
  | 'food'
  | 'fashion'

// ============================================
// SOCIAL MEDIA PROFILE
// ============================================

export interface SocialMediaProfile {
  platform: SocialPlatform
  handle: string
  verified: boolean
  
  // Followers
  followers: number
  following: number
  followersGrowthRate: number   // Weekly change
  
  // Engagement
  engagementRate: number        // % who interact (likes + comments / followers)
  avgLikes: number
  avgComments: number
  avgShares: number
  
  // Content
  totalPosts: number
  postsThisWeek: number
  scheduledPosts: ScheduledPost[]
  
  // Performance
  viralPosts: number            // Posts that went viral
  bestPerformingPost?: SocialPost
  worstPerformingPost?: SocialPost
  
  // Community
  trollActivity: number         // 0-100, how many haters
  fanClubSize: number           // Dedicated superfans
  controversyLevel: number      // Current controversy heat (decays over time)
  
  // Monetization
  isMonetized: boolean
  monthlyAdRevenue: number
  sponsoredPostRate: number     // What you charge per sponsored post
}

// ============================================
// SOCIAL POSTS
// ============================================

export interface SocialPost {
  id: string
  platform: SocialPlatform
  
  // Content
  contentType: ContentType
  topic: PostTopic
  tone: PostTone
  
  // The actual content
  contentPreview: string        // What player sees when picking
  fullContent: string           // What gets "posted"
  mediaAttached: boolean
  
  // Scheduling
  isScheduled: boolean
  scheduledFor?: { week: number; day: number; hour: number; year: number }
  postedAt?: { week: number; day: number; hour: number; year: number }
  
  // Results
  likes: number
  comments: number
  shares: number
  saves: number
  reach: number                 // Total people who saw it
  impressions: number           // Total views (including multiple from same person)
  
  // Analysis
  wentViral: boolean
  viralReason?: string
  sentimentScore: number        // -100 to 100
  
  // Sample reactions
  positiveComments: CommentSample[]
  negativeComments: CommentSample[]
  
  // Consequences
  followerChange: number
  engagementChange: number
  controversyGenerated: number
  
  // Sponsor/Partner reactions
  sponsorReactions?: SponsorReaction[]
  partnerReaction?: string
}

export interface ScheduledPost {
  id: string
  platform: SocialPlatform
  contentType: ContentType
  topic: PostTopic
  tone: PostTone
  contentPreview: string
  scheduledFor: { week: number; day: number; hour: number; year: number }
}

export interface CommentSample {
  username: string
  content: string
  sentiment: 'positive' | 'negative' | 'neutral'
  isVerified: boolean           // Famous person commenting?
  isTroll: boolean
  likes: number
}

export interface SponsorReaction {
  sponsorId: string
  sponsorName: string
  reaction: 'loved' | 'liked' | 'neutral' | 'concerned' | 'upset'
  reason: string
  satisfactionChange: number
}

// ============================================
// POST OPTIONS (For AI generation)
// ============================================

export interface PostOption {
  topic: PostTopic
  tone: PostTone
  contentType: ContentType
  
  preview: string               // Short description player sees
  
  // Potential outcomes
  expectedEngagement: 'low' | 'medium' | 'high' | 'viral_potential'
  riskLevel: 'safe' | 'mild' | 'risky' | 'controversial'
  
  // Effects
  followerEffect: { min: number; max: number }
  controversyRisk: number       // 0-100
  
  // Requirements
  requiresRelationship?: boolean  // For partner posts
  requiresRaceResult?: 'win' | 'podium' | 'any'
  requiresSponsor?: string
}

// Post templates for different scenarios
export const POST_TEMPLATES: Record<PostTopic, {
  templates: string[]
  tones: PostTone[]
  expectedEngagement: 'low' | 'medium' | 'high'
  controversyRisk: number
}> = {
  race_result: {
    templates: [
      "P{position} today! {reaction} Already focused on {next_race}.",
      "What a race! P{position} and I couldn't be happier with how we performed today.",
      "Tough day, P{position}. Not the result we wanted but we'll come back stronger."
    ],
    tones: ['humble', 'confident', 'serious'],
    expectedEngagement: 'high',
    controversyRisk: 10
  },
  behind_scenes: {
    templates: [
      "Early morning at the factory. This is where the magic happens.",
      "Simulator work never stops. Getting ready for {next_race}.",
      "Love spending time with the team. These are the moments that count."
    ],
    tones: ['casual', 'personal', 'humble'],
    expectedEngagement: 'medium',
    controversyRisk: 0
  },
  partner_appreciation: {
    templates: [
      "Couldn't do this without you by my side. {partner_name}",
      "My biggest supporter. Thank you for everything.",
      "Date night with my favorite person."
    ],
    tones: ['personal', 'humble'],
    expectedEngagement: 'high',
    controversyRisk: 5
  },
  family: {
    templates: [
      "Family time is the best time.",
      "Teaching the next generation!",
      "Nothing better than being home with my family."
    ],
    tones: ['personal', 'humble', 'casual'],
    expectedEngagement: 'medium',
    controversyRisk: 0
  },
  sponsor_shoutout: {
    templates: [
      "Grateful to have @{sponsor} on this journey with us!",
      "Big thanks to @{sponsor} for their continued support.",
      "Proud to represent @{sponsor}. Check out their latest!"
    ],
    tones: ['promotional', 'humble'],
    expectedEngagement: 'low',
    controversyRisk: 0
  },
  charity: {
    templates: [
      "Honored to support {charity_name}. Every contribution helps.",
      "Amazing day at {charity_event}. So inspired by everyone involved.",
      "Giving back is important. Proud to announce our support for {charity_name}."
    ],
    tones: ['humble', 'inspirational', 'serious'],
    expectedEngagement: 'medium',
    controversyRisk: 5
  },
  political_stance: {
    templates: [
      "We need to talk about {issue}. This matters.",
      "Standing up for what's right. {issue} affects us all.",
      "Using my platform to raise awareness about {issue}."
    ],
    tones: ['serious', 'controversial'],
    expectedEngagement: 'high',
    controversyRisk: 70
  },
  controversial_opinion: {
    templates: [
      "Unpopular opinion: {opinion}",
      "I know this might be controversial, but {opinion}",
      "Time to say what everyone's thinking: {opinion}"
    ],
    tones: ['confident', 'controversial'],
    expectedEngagement: 'high',
    controversyRisk: 80
  },
  responding_to_haters: {
    templates: [
      "To everyone doubting us: watch this space.",
      "Keep talking. We'll keep winning.",
      "The noise only makes us stronger."
    ],
    tones: ['confident', 'controversial'],
    expectedEngagement: 'high',
    controversyRisk: 40
  },
  motivation: {
    templates: [
      "Every setback is a setup for a comeback.",
      "Hard work beats talent when talent doesn't work hard.",
      "The grind never stops. Let's go!"
    ],
    tones: ['inspirational', 'confident'],
    expectedEngagement: 'medium',
    controversyRisk: 0
  },
  throwback: {
    templates: [
      "Throwback to {memory}. Time flies!",
      "Can't believe it's been {years} years since this moment.",
      "One of my favorite memories. {memory}"
    ],
    tones: ['casual', 'personal', 'humble'],
    expectedEngagement: 'medium',
    controversyRisk: 0
  },
  hobby: {
    templates: [
      "Off-track vibes. Working on my {hobby} skills.",
      "There's more to life than racing! Today: {hobby}",
      "Balance is everything. {hobby} time!"
    ],
    tones: ['casual', 'personal'],
    expectedEngagement: 'medium',
    controversyRisk: 0
  },
  travel: {
    templates: [
      "Exploring {destination}. What a beautiful place!",
      "Quick getaway before the next race. {destination}",
      "Found this gem in {destination}. Highly recommend!"
    ],
    tones: ['casual', 'personal'],
    expectedEngagement: 'medium',
    controversyRisk: 5
  },
  milestone_celebration: {
    templates: [
      "{milestone}! Can't believe we made it. Thank you all!",
      "Just hit {milestone}! Grateful for every single one of you.",
      "From nothing to {milestone}. The journey continues!"
    ],
    tones: ['humble', 'excited'],
    expectedEngagement: 'high',
    controversyRisk: 0
  },
  workout: {
    templates: [
      "No days off. Putting in the work.",
      "Early morning session. The grind never stops.",
      "Physical prep is 50% of racing. Let's go!"
    ],
    tones: ['confident', 'casual'],
    expectedEngagement: 'low',
    controversyRisk: 0
  },
  food: {
    templates: [
      "Fuel for the next race. Eating clean!",
      "Cheat day earned. {food}",
      "Best {food} I've ever had. {location}"
    ],
    tones: ['casual', 'funny'],
    expectedEngagement: 'low',
    controversyRisk: 0
  },
  fashion: {
    templates: [
      "Race day fit. @{brand}",
      "New merch just dropped! Link in bio.",
      "Keeping it stylish off the track."
    ],
    tones: ['casual', 'promotional'],
    expectedEngagement: 'medium',
    controversyRisk: 0
  },
  race_preview: {
    templates: [
      "Race week! {track_name} is special. Let's make it count.",
      "Ready for {track_name}. Car feels great, team is dialed in.",
      "Preview: {track_name}. Here's what we're expecting..."
    ],
    tones: ['confident', 'serious'],
    expectedEngagement: 'medium',
    controversyRisk: 0
  },
  personal_life: {
    templates: [
      "Life update: {update}",
      "Not everything is about racing. Here's what I've been up to.",
      "Real talk: {personal_thought}"
    ],
    tones: ['personal', 'casual', 'serious'],
    expectedEngagement: 'medium',
    controversyRisk: 20
  }
}

// ============================================
// TROLL SYSTEM
// ============================================

export interface TrollEncounter {
  id: string
  platform: SocialPlatform
  
  // The troll
  trollUsername: string
  trollFollowers: number        // Some trolls have big followings
  isVerified: boolean           // Verified troll = bigger problem
  
  // The attack
  attackType: TrollAttackType
  content: string               // What they said
  visibility: 'low' | 'medium' | 'high'  // How many people saw it
  
  // Response options (AI-generated)
  responseOptions: TrollResponse[]
  
  // Timing
  occurredAt: { week: number; day: number; year: number }
  
  // Status
  hasResponded: boolean
  responseChosen?: string
  outcome?: TrollOutcome
}

export type TrollAttackType = 
  | 'performance_criticism'     // "You're a bad driver"
  | 'personal_attack'          // "You're ugly/stupid"
  | 'relationship_mockery'     // "Your partner deserves better"
  | 'political_attack'         // Attacking your stance
  | 'jealousy'                 // "Only rich because of daddy"
  | 'conspiracy'               // "Cheating" accusations
  | 'team_attack'              // "Your team sucks"
  | 'sponsor_attack'           // Going after your sponsors

export interface TrollResponse {
  id: string
  type: TrollResponseType
  preview: string               // Short description
  fullResponse?: string         // What you'd say
  
  // Consequences
  reputationEffect: number
  viralChance: number           // Could go viral (good or bad)
  trollReactionChance: number   // Might escalate
  fanReaction: 'love_it' | 'mixed' | 'disappointed'
  sponsorReaction: 'approve' | 'neutral' | 'concerned'
}

export type TrollResponseType = 
  | 'ignore'
  | 'classy_response'
  | 'funny_comeback'
  | 'aggressive'
  | 'block'
  | 'legal_threat'
  | 'call_out'

export interface TrollOutcome {
  trollBehavior: 'backed_off' | 'escalated' | 'deleted' | 'doubled_down'
  publicReaction: 'supported_you' | 'mixed' | 'sided_with_troll'
  mediaPickedUp: boolean
  followerChange: number
  reputationChange: number
}

// ============================================
// VIRAL MECHANICS
// ============================================

export interface ViralEvent {
  id: string
  postId: string
  platform: SocialPlatform
  
  // What happened
  viralReason: ViralReason
  peakReach: number
  duration: number              // Days it was trending
  
  // Impact
  followerGain: number
  mediaAttention: boolean
  celebrityMentions: string[]
  memeCreated: boolean
  
  // Consequences
  sponsorReactions: SponsorReaction[]
  partnerReaction?: string
  teamReaction?: string
}

export type ViralReason = 
  | 'funny_moment'
  | 'controversial_take'
  | 'emotional_post'
  | 'celebrity_interaction'
  | 'perfect_timing'
  | 'relatable_content'
  | 'scandal_adjacent'
  | 'meme_worthy'

// ============================================
// PLATFORM CONFIGURATION
// ============================================

export const PLATFORM_CONFIG: Record<SocialPlatform, {
  name: string
  maxPostLength: number
  contentTypes: ContentType[]
  engagementMultiplier: number    // Instagram is more engaged than Twitter
  viralThreshold: number          // Engagement needed to go viral
  trollDensity: number           // How many trolls (0-100)
  monetizationThreshold: number  // Followers needed to monetize
  sponsoredPostMultiplier: number // What you can charge relative to followers
}> = {
  instagram: {
    name: 'Instagram',
    maxPostLength: 2200,
    contentTypes: ['photo', 'video', 'story', 'reel', 'live'],
    engagementMultiplier: 1.2,
    viralThreshold: 0.1,         // 10% engagement = viral
    trollDensity: 40,
    monetizationThreshold: 10000,
    sponsoredPostMultiplier: 0.01 // $0.01 per follower per post
  },
  twitter: {
    name: 'X (Twitter)',
    maxPostLength: 280,
    contentTypes: ['text', 'photo', 'video'],
    engagementMultiplier: 0.8,
    viralThreshold: 0.05,        // Easier to go viral
    trollDensity: 70,            // Most trolls
    monetizationThreshold: 5000,
    sponsoredPostMultiplier: 0.005
  },
  tiktok: {
    name: 'TikTok',
    maxPostLength: 150,
    contentTypes: ['video', 'live'],
    engagementMultiplier: 2.0,    // Highest engagement
    viralThreshold: 0.15,
    trollDensity: 50,
    monetizationThreshold: 1000,
    sponsoredPostMultiplier: 0.02
  },
  youtube: {
    name: 'YouTube',
    maxPostLength: 5000,
    contentTypes: ['video', 'live'],
    engagementMultiplier: 0.5,
    viralThreshold: 0.03,
    trollDensity: 60,
    monetizationThreshold: 1000,
    sponsoredPostMultiplier: 0.03
  },
  linkedin: {
    name: 'LinkedIn',
    maxPostLength: 3000,
    contentTypes: ['text', 'photo', 'video'],
    engagementMultiplier: 0.3,
    viralThreshold: 0.02,
    trollDensity: 10,             // Most professional
    monetizationThreshold: 50000,
    sponsoredPostMultiplier: 0.05
  }
}

// ============================================
// CONFIGURATION
// ============================================

export const SOCIAL_MEDIA_CONFIG = {
  // Posting
  maxPostsPerDay: 5,
  optimalPostsPerWeek: 10,
  
  // Growth
  baseGrowthRate: 0.01,           // 1% weekly if consistent
  viralGrowthMultiplier: 10,      // 10x growth during viral
  inactivityPenalty: 0.02,        // Lose 2% per week of no posting
  
  // Engagement
  baseEngagementRate: 0.03,       // 3% is healthy
  excellentEngagementRate: 0.08,
  
  // Controversy
  controversyDecayPerWeek: 10,    // Loses 10 points per week
  maxControversy: 100,
  
  // Trolls
  trollEncounterChancePerPost: 0.15,
  trollEscalationChance: 0.3,
  
  // Viral
  baseViralChance: 0.01,          // 1% chance per post
  viralDuration: { min: 3, max: 14 }, // Days
  
  // Monetization
  adRevenuePerThousandViews: 3,   // $3 CPM
  
  // Consequences
  sponsorConcernThreshold: 50,    // Controversy level that concerns sponsors
  
  // Follower milestones
  milestones: [1000, 10000, 100000, 500000, 1000000, 5000000, 10000000]
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

export function createSocialProfile(platform: SocialPlatform, handle: string): SocialMediaProfile {
  return {
    platform,
    handle,
    verified: false,
    followers: 0,
    following: 0,
    followersGrowthRate: 0,
    engagementRate: SOCIAL_MEDIA_CONFIG.baseEngagementRate,
    avgLikes: 0,
    avgComments: 0,
    avgShares: 0,
    totalPosts: 0,
    postsThisWeek: 0,
    scheduledPosts: [],
    viralPosts: 0,
    trollActivity: 0,
    fanClubSize: 0,
    controversyLevel: 0,
    isMonetized: false,
    monthlyAdRevenue: 0,
    sponsoredPostRate: 0
  }
}

export function createPost(
  platform: SocialPlatform,
  topic: PostTopic,
  tone: PostTone,
  contentType: ContentType,
  content: string
): SocialPost {
  return {
    id: `post_${platform}_${Date.now()}`,
    platform,
    contentType,
    topic,
    tone,
    contentPreview: content.substring(0, 100),
    fullContent: content,
    mediaAttached: contentType !== 'text',
    isScheduled: false,
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
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function calculateEngagementRate(post: SocialPost, followers: number): number {
  if (followers === 0) return 0
  const interactions = post.likes + post.comments + post.shares
  return interactions / followers
}

export function isViralPost(post: SocialPost, profile: SocialMediaProfile): boolean {
  const config = PLATFORM_CONFIG[post.platform]
  const engagementRate = calculateEngagementRate(post, profile.followers)
  return engagementRate >= config.viralThreshold
}

export function calculateSponsoredPostRate(profile: SocialMediaProfile): number {
  const config = PLATFORM_CONFIG[profile.platform]
  return Math.round(profile.followers * config.sponsoredPostMultiplier)
}

export function getPostRiskLevel(topic: PostTopic, _tone: PostTone): 'safe' | 'mild' | 'risky' | 'controversial' {
  const template = POST_TEMPLATES[topic]
  if (!template) return 'safe'
  
  if (template.controversyRisk >= 60) return 'controversial'
  if (template.controversyRisk >= 30) return 'risky'
  if (template.controversyRisk >= 10) return 'mild'
  return 'safe'
}

export function generateTrollResponse(attackType: TrollAttackType): TrollResponse[] {
  const baseResponses: TrollResponse[] = [
    {
      id: 'ignore',
      type: 'ignore',
      preview: 'Ignore and move on',
      reputationEffect: 0,
      viralChance: 0,
      trollReactionChance: 0.2,
      fanReaction: 'mixed',
      sponsorReaction: 'approve'
    },
    {
      id: 'block',
      type: 'block',
      preview: 'Block the user',
      reputationEffect: 0,
      viralChance: 0,
      trollReactionChance: 0.1,
      fanReaction: 'mixed',
      sponsorReaction: 'approve'
    },
    {
      id: 'classy',
      type: 'classy_response',
      preview: 'Respond with class',
      fullResponse: 'I appreciate all feedback. We\'re always working to improve.',
      reputationEffect: 5,
      viralChance: 0.1,
      trollReactionChance: 0.3,
      fanReaction: 'love_it',
      sponsorReaction: 'approve'
    },
    {
      id: 'funny',
      type: 'funny_comeback',
      preview: 'Hit back with humor',
      reputationEffect: 3,
      viralChance: 0.3,
      trollReactionChance: 0.4,
      fanReaction: 'love_it',
      sponsorReaction: 'neutral'
    },
    {
      id: 'aggressive',
      type: 'aggressive',
      preview: 'Fight fire with fire',
      reputationEffect: -5,
      viralChance: 0.5,
      trollReactionChance: 0.7,
      fanReaction: 'mixed',
      sponsorReaction: 'concerned'
    }
  ]
  
  // Add legal option for serious attacks
  if (attackType === 'personal_attack' || attackType === 'conspiracy') {
    baseResponses.push({
      id: 'legal',
      type: 'legal_threat',
      preview: 'Threaten legal action',
      fullResponse: 'These false statements are defamatory. My legal team has been notified.',
      reputationEffect: 2,
      viralChance: 0.4,
      trollReactionChance: 0.1,
      fanReaction: 'mixed',
      sponsorReaction: 'neutral'
    })
  }
  
  return baseResponses
}

export function checkForMilestone(
  previousFollowers: number,
  currentFollowers: number
): number | null {
  for (const milestone of SOCIAL_MEDIA_CONFIG.milestones) {
    if (previousFollowers < milestone && currentFollowers >= milestone) {
      return milestone
    }
  }
  return null
}
