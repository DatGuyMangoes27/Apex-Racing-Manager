// ============================================
// SOCIAL EVENTS & PHILANTHROPY CONFIGURATION
// ============================================
// Configuration for galas, networking, charity, rivalries, and scandals.

// ============================================
// SOCIAL EVENTS
// ============================================

export type SocialEventType =
  | 'gala'
  | 'charity_dinner'
  | 'sponsor_reception'
  | 'paddock_party'
  | 'awards_ceremony'
  | 'product_launch'
  | 'networking_dinner'
  | 'yacht_party'
  | 'season_opening'
  | 'championship_celebration'
  | 'charity_gala'
  | 'fashion_show'
  | 'team_celebration'
  | 'sponsor_dinner'
  | 'business_networking'
  | 'media_appearance'
  | 'interview'

export interface SocialEvent {
  id: string
  type: SocialEventType
  name: string
  description: string
  
  // When
  date: { week: number; year: number }
  
  // Cost and requirements
  cost: number
  isHosting: boolean            // Are you hosting or attending?
  hostingCostMultiplier?: number  // If hosting
  dresscode: 'casual' | 'business' | 'formal' | 'black_tie'
  
  // Requirements
  minimumReputation?: number
  inviteOnly: boolean
  
  // Effects
  effects: {
    publicImageChange: number
    networkingOpportunities: number
    sponsorImpressions: number
    mediaExposure: number
    partnerHappinessBonus?: number
    stressChange: number
  }
  
  // Attendees
  expectedAttendeeTypes: string[]
  vipGuests?: string[]
}

export const SOCIAL_EVENT_TEMPLATES: Omit<SocialEvent, 'id' | 'date'>[] = [
  {
    type: 'gala',
    name: 'Racing Industry Gala',
    description: 'Black-tie event celebrating motorsport excellence',
    cost: 5000,
    isHosting: false,
    dresscode: 'black_tie',
    inviteOnly: true,
    minimumReputation: 50,
    effects: {
      publicImageChange: 10,
      networkingOpportunities: 30,
      sponsorImpressions: 25,
      mediaExposure: 20,
      partnerHappinessBonus: 10,
      stressChange: 5
    },
    expectedAttendeeTypes: ['team_owner', 'sponsor_exec', 'celebrity', 'driver']
  },
  {
    type: 'charity_dinner',
    name: 'Motorsport Charity Dinner',
    description: 'Fundraising dinner for racing-related causes',
    cost: 10000,
    isHosting: false,
    dresscode: 'formal',
    inviteOnly: false,
    effects: {
      publicImageChange: 15,
      networkingOpportunities: 20,
      sponsorImpressions: 15,
      mediaExposure: 15,
      stressChange: -5
    },
    expectedAttendeeTypes: ['team_owner', 'business_mogul', 'celebrity', 'politician']
  },
  {
    type: 'sponsor_reception',
    name: 'Sponsor VIP Reception',
    description: 'Exclusive event for current and potential sponsors',
    cost: 2000,
    isHosting: true,
    hostingCostMultiplier: 10,
    dresscode: 'business',
    inviteOnly: true,
    effects: {
      publicImageChange: 5,
      networkingOpportunities: 15,
      sponsorImpressions: 40,
      mediaExposure: 5,
      stressChange: 10
    },
    expectedAttendeeTypes: ['sponsor_exec', 'business_mogul', 'banker']
  },
  {
    type: 'paddock_party',
    name: 'Paddock Party',
    description: 'Casual celebration in the racing paddock',
    cost: 1000,
    isHosting: false,
    dresscode: 'casual',
    inviteOnly: false,
    effects: {
      publicImageChange: 5,
      networkingOpportunities: 25,
      sponsorImpressions: 10,
      mediaExposure: 10,
      partnerHappinessBonus: 5,
      stressChange: -10
    },
    expectedAttendeeTypes: ['driver', 'team_owner', 'journalist', 'athlete']
  },
  {
    type: 'awards_ceremony',
    name: 'Motorsport Awards',
    description: 'Annual celebration of motorsport achievements',
    cost: 3000,
    isHosting: false,
    dresscode: 'black_tie',
    inviteOnly: true,
    minimumReputation: 40,
    effects: {
      publicImageChange: 15,
      networkingOpportunities: 20,
      sponsorImpressions: 20,
      mediaExposure: 30,
      stressChange: 5
    },
    expectedAttendeeTypes: ['driver', 'team_owner', 'celebrity', 'journalist']
  },
  {
    type: 'yacht_party',
    name: 'Monaco Yacht Party',
    description: 'Exclusive party aboard a superyacht',
    cost: 15000,
    isHosting: false,
    dresscode: 'formal',
    inviteOnly: true,
    minimumReputation: 70,
    effects: {
      publicImageChange: 20,
      networkingOpportunities: 35,
      sponsorImpressions: 30,
      mediaExposure: 25,
      partnerHappinessBonus: 15,
      stressChange: -15
    },
    expectedAttendeeTypes: ['business_mogul', 'celebrity', 'politician', 'team_owner']
  },
  {
    type: 'networking_dinner',
    name: 'Private Networking Dinner',
    description: 'Intimate dinner with key industry figures',
    cost: 5000,
    isHosting: true,
    hostingCostMultiplier: 3,
    dresscode: 'formal',
    inviteOnly: true,
    effects: {
      publicImageChange: 5,
      networkingOpportunities: 40,
      sponsorImpressions: 20,
      mediaExposure: 0,
      stressChange: 5
    },
    expectedAttendeeTypes: ['business_mogul', 'banker', 'sponsor_exec', 'lawyer']
  },
  {
    type: 'championship_celebration',
    name: 'Championship Celebration',
    description: 'Celebrating a championship victory',
    cost: 50000,
    isHosting: true,
    hostingCostMultiplier: 1,
    dresscode: 'formal',
    inviteOnly: false,
    effects: {
      publicImageChange: 25,
      networkingOpportunities: 30,
      sponsorImpressions: 35,
      mediaExposure: 50,
      partnerHappinessBonus: 20,
      stressChange: -20
    },
    expectedAttendeeTypes: ['driver', 'team_owner', 'sponsor_exec', 'celebrity', 'journalist']
  },
  {
    type: 'product_launch',
    name: 'Sponsor Product Launch',
    description: 'Attend a sponsor\'s product launch as a brand ambassador',
    cost: 0,
    isHosting: false,
    dresscode: 'business',
    inviteOnly: true,
    effects: {
      publicImageChange: 5,
      networkingOpportunities: 15,
      sponsorImpressions: 30,
      mediaExposure: 15,
      stressChange: 5
    },
    expectedAttendeeTypes: ['sponsor_exec', 'journalist', 'celebrity', 'business_mogul']
  },
  {
    type: 'charity_gala',
    name: 'Motorsport Charity Gala',
    description: 'Black-tie charity gala supporting racing safety and youth development',
    cost: 15000,
    isHosting: false,
    dresscode: 'black_tie',
    inviteOnly: false,
    effects: {
      publicImageChange: 20,
      networkingOpportunities: 25,
      sponsorImpressions: 20,
      mediaExposure: 20,
      partnerHappinessBonus: 10,
      stressChange: 0
    },
    expectedAttendeeTypes: ['business_mogul', 'celebrity', 'politician', 'team_owner']
  },
  {
    type: 'fashion_show',
    name: 'Fashion Week Event',
    description: 'High-profile fashion event blending motorsport and luxury lifestyle',
    cost: 8000,
    isHosting: false,
    dresscode: 'formal',
    inviteOnly: true,
    minimumReputation: 50,
    effects: {
      publicImageChange: 15,
      networkingOpportunities: 20,
      sponsorImpressions: 15,
      mediaExposure: 25,
      partnerHappinessBonus: 15,
      stressChange: -5
    },
    expectedAttendeeTypes: ['celebrity', 'business_mogul', 'journalist']
  },
  {
    type: 'team_celebration',
    name: 'Team Celebration',
    description: 'Internal celebration for a team milestone or victory',
    cost: 5000,
    isHosting: true,
    hostingCostMultiplier: 2,
    dresscode: 'casual',
    inviteOnly: true,
    effects: {
      publicImageChange: 3,
      networkingOpportunities: 5,
      sponsorImpressions: 5,
      mediaExposure: 5,
      partnerHappinessBonus: 10,
      stressChange: -15
    },
    expectedAttendeeTypes: ['driver', 'team_owner']
  },
  {
    type: 'sponsor_dinner',
    name: 'Exclusive Sponsor Dinner',
    description: 'Intimate dinner with key sponsor executives to strengthen partnerships',
    cost: 3000,
    isHosting: true,
    hostingCostMultiplier: 5,
    dresscode: 'formal',
    inviteOnly: true,
    effects: {
      publicImageChange: 3,
      networkingOpportunities: 20,
      sponsorImpressions: 40,
      mediaExposure: 0,
      stressChange: 5
    },
    expectedAttendeeTypes: ['sponsor_exec', 'business_mogul', 'banker']
  },
  {
    type: 'business_networking',
    name: 'Industry Networking Event',
    description: 'Professional networking event with motorsport industry leaders',
    cost: 2000,
    isHosting: false,
    dresscode: 'business',
    inviteOnly: false,
    effects: {
      publicImageChange: 5,
      networkingOpportunities: 40,
      sponsorImpressions: 15,
      mediaExposure: 5,
      stressChange: 5
    },
    expectedAttendeeTypes: ['business_mogul', 'banker', 'sponsor_exec', 'lawyer', 'team_owner']
  },
  {
    type: 'media_appearance',
    name: 'Media Appearance',
    description: 'TV show, podcast, or live event appearance to boost public profile',
    cost: 0,
    isHosting: false,
    dresscode: 'business',
    inviteOnly: true,
    effects: {
      publicImageChange: 15,
      networkingOpportunities: 10,
      sponsorImpressions: 10,
      mediaExposure: 35,
      stressChange: 10
    },
    expectedAttendeeTypes: ['journalist', 'celebrity']
  },
  {
    type: 'interview',
    name: 'Press Interview',
    description: 'Sit-down interview with a major media outlet or journalist',
    cost: 0,
    isHosting: false,
    dresscode: 'business',
    inviteOnly: true,
    effects: {
      publicImageChange: 10,
      networkingOpportunities: 5,
      sponsorImpressions: 5,
      mediaExposure: 25,
      stressChange: 10
    },
    expectedAttendeeTypes: ['journalist']
  },
  {
    type: 'season_opening',
    name: 'Season Opening Gala',
    description: 'Official season launch party celebrating the start of a new campaign',
    cost: 10000,
    isHosting: false,
    dresscode: 'black_tie',
    inviteOnly: false,
    effects: {
      publicImageChange: 10,
      networkingOpportunities: 25,
      sponsorImpressions: 25,
      mediaExposure: 30,
      partnerHappinessBonus: 10,
      stressChange: 0
    },
    expectedAttendeeTypes: ['driver', 'team_owner', 'sponsor_exec', 'journalist', 'celebrity']
  }
]

// ============================================
// EVENT OUTCOMES
// ============================================

export interface EventOutcome {
  type: 'positive' | 'negative' | 'neutral'
  description: string
  effects: {
    reputationChange?: number
    newContact?: { type: string; name: string }
    sponsorLead?: { company: string; value: number }
    partnerReaction?: number
    mediaAttention?: number
  }
}

export const POSSIBLE_EVENT_OUTCOMES: Record<SocialEventType, EventOutcome[]> = {
  gala: [
    { type: 'positive', description: 'Made a great impression on potential sponsors', effects: { reputationChange: 5, sponsorLead: { company: 'Major Brand', value: 500000 } } },
    { type: 'positive', description: 'Connected with a media mogul', effects: { newContact: { type: 'business_mogul', name: 'Media Executive' }, reputationChange: 3 } },
    { type: 'neutral', description: 'Pleasant evening with no standout moments', effects: {} },
    { type: 'negative', description: 'Accidentally spilled wine on a sponsor', effects: { reputationChange: -5 } }
  ],
  charity_dinner: [
    { type: 'positive', description: 'Your generous donation made headlines', effects: { reputationChange: 10, mediaAttention: 15 } },
    { type: 'positive', description: 'Connected with philanthropic billionaire', effects: { newContact: { type: 'business_mogul', name: 'Philanthropist' } } },
    { type: 'neutral', description: 'A successful evening supporting good causes', effects: { reputationChange: 3 } }
  ],
  sponsor_reception: [
    { type: 'positive', description: 'Sponsor executives were very impressed', effects: { sponsorLead: { company: 'Tech Corp', value: 1000000 }, reputationChange: 5 } },
    { type: 'positive', description: 'Secured verbal commitment for next season', effects: { sponsorLead: { company: 'Finance Group', value: 750000 } } },
    { type: 'neutral', description: 'Professional event, relationships maintained', effects: {} },
    { type: 'negative', description: 'Technical issues marred the presentation', effects: { reputationChange: -3 } }
  ],
  paddock_party: [
    { type: 'positive', description: 'Great bonding with drivers and crew', effects: { reputationChange: 3 } },
    { type: 'positive', description: 'Your partner charmed everyone', effects: { partnerReaction: 10, reputationChange: 2 } },
    { type: 'neutral', description: 'Fun casual evening', effects: {} },
    { type: 'negative', description: 'Someone filmed an embarrassing moment', effects: { reputationChange: -5, mediaAttention: 10 } }
  ],
  awards_ceremony: [
    { type: 'positive', description: 'Gave a memorable acceptance speech', effects: { reputationChange: 10, mediaAttention: 20 } },
    { type: 'positive', description: 'Sat next to influential industry figure', effects: { newContact: { type: 'team_owner', name: 'Rival Owner' } } },
    { type: 'neutral', description: 'Enjoyed celebrating the season\'s achievements', effects: { reputationChange: 2 } }
  ],
  product_launch: [
    { type: 'positive', description: 'Product launch exceeded expectations', effects: { reputationChange: 8, sponsorLead: { company: 'Tech Partner', value: 300000 } } },
    { type: 'neutral', description: 'Standard corporate event', effects: {} }
  ],
  networking_dinner: [
    { type: 'positive', description: 'Closed a major deal over dinner', effects: { sponsorLead: { company: 'Investment Group', value: 2000000 } } },
    { type: 'positive', description: 'Made invaluable industry connections', effects: { newContact: { type: 'banker', name: 'Investment Banker' }, reputationChange: 3 } },
    { type: 'neutral', description: 'Productive discussions all around', effects: { reputationChange: 2 } }
  ],
  yacht_party: [
    { type: 'positive', description: 'Rubbed shoulders with the elite', effects: { reputationChange: 8, newContact: { type: 'celebrity', name: 'A-List Celebrity' } } },
    { type: 'positive', description: 'Your partner was the star of the evening', effects: { partnerReaction: 15, reputationChange: 5 } },
    { type: 'neutral', description: 'Luxurious evening on the water', effects: { reputationChange: 3 } },
    { type: 'negative', description: 'Photos leaked of wild party antics', effects: { reputationChange: -10, mediaAttention: 30 } }
  ],
  season_opening: [
    { type: 'positive', description: 'Optimism for the season boosted team morale', effects: { reputationChange: 5 } },
    { type: 'neutral', description: 'Standard season kickoff event', effects: {} }
  ],
  championship_celebration: [
    { type: 'positive', description: 'Epic celebration that will be remembered', effects: { reputationChange: 15, mediaAttention: 40 } },
    { type: 'positive', description: 'Sponsors thrilled with the exposure', effects: { sponsorLead: { company: 'Happy Sponsor', value: 500000 }, reputationChange: 10 } }
  ],
  charity_gala: [
    { type: 'positive', description: 'Your heartfelt speech moved the audience to donate generously', effects: { reputationChange: 12, mediaAttention: 20 } },
    { type: 'positive', description: 'A wealthy patron offered to co-sponsor your team\'s charity arm', effects: { sponsorLead: { company: 'Philanthropic Fund', value: 400000 }, reputationChange: 8 } },
    { type: 'neutral', description: 'A pleasant evening of giving back to the community', effects: { reputationChange: 5 } },
    { type: 'negative', description: 'Your donation was smaller than expected, drawing quiet criticism', effects: { reputationChange: -3 } }
  ],
  fashion_show: [
    { type: 'positive', description: 'Your appearance went viral on social media', effects: { reputationChange: 10, mediaAttention: 25 } },
    { type: 'positive', description: 'A luxury brand approached you for an endorsement deal', effects: { sponsorLead: { company: 'Luxury Fashion House', value: 300000 }, reputationChange: 5 } },
    { type: 'neutral', description: 'Enjoyed the show and made some new acquaintances', effects: { reputationChange: 2 } },
    { type: 'negative', description: 'Fashion critics panned your outfit choice', effects: { reputationChange: -5, mediaAttention: 15 } }
  ],
  team_celebration: [
    { type: 'positive', description: 'Team morale soared after a fantastic celebration', effects: { reputationChange: 5 } },
    { type: 'positive', description: 'Your toast honoring the crew was deeply appreciated', effects: { reputationChange: 3 } },
    { type: 'neutral', description: 'A fun evening with the team', effects: { reputationChange: 1 } },
    { type: 'negative', description: 'Someone overdid the celebrations and caused a scene', effects: { reputationChange: -4, mediaAttention: 10 } }
  ],
  sponsor_dinner: [
    { type: 'positive', description: 'Sponsor executive hinted at a major contract renewal', effects: { sponsorLead: { company: 'Premium Sponsor', value: 800000 }, reputationChange: 5 } },
    { type: 'positive', description: 'Built strong personal rapport with the sponsor CEO', effects: { newContact: { type: 'sponsor_exec', name: 'Sponsor CEO' }, reputationChange: 4 } },
    { type: 'neutral', description: 'Professional dinner, relationship maintained', effects: { reputationChange: 1 } },
    { type: 'negative', description: 'Awkward disagreement over contract terms soured the mood', effects: { reputationChange: -5 } }
  ],
  business_networking: [
    { type: 'positive', description: 'Connected with a venture capitalist interested in motorsport', effects: { sponsorLead: { company: 'Venture Capital Group', value: 1500000 }, reputationChange: 5 } },
    { type: 'positive', description: 'Exchanged contacts with several influential business leaders', effects: { newContact: { type: 'business_mogul', name: 'Industry Leader' }, reputationChange: 3 } },
    { type: 'neutral', description: 'Productive conversations but no immediate leads', effects: { reputationChange: 2 } },
    { type: 'negative', description: 'Came across as too aggressive in pitching your team', effects: { reputationChange: -3 } }
  ],
  media_appearance: [
    { type: 'positive', description: 'Your charisma won over the audience and went viral', effects: { reputationChange: 10, mediaAttention: 30 } },
    { type: 'positive', description: 'Delivered memorable soundbites that boosted your profile', effects: { reputationChange: 7, mediaAttention: 15 } },
    { type: 'neutral', description: 'Standard appearance, nothing remarkable', effects: { reputationChange: 2, mediaAttention: 5 } },
    { type: 'negative', description: 'An off-hand comment was taken out of context by tabloids', effects: { reputationChange: -8, mediaAttention: 25 } }
  ],
  interview: [
    { type: 'positive', description: 'Your candid insights were praised by fans and media alike', effects: { reputationChange: 8, mediaAttention: 15 } },
    { type: 'positive', description: 'Revealed team ambitions that excited the fanbase', effects: { reputationChange: 5, mediaAttention: 10 } },
    { type: 'neutral', description: 'Professional interview with standard talking points', effects: { reputationChange: 1, mediaAttention: 3 } },
    { type: 'negative', description: 'Accidentally leaked confidential team strategy', effects: { reputationChange: -10, mediaAttention: 20 } }
  ]
}

// ============================================
// PHILANTHROPY
// ============================================

export type CharityCause =
  | 'youth_motorsport'
  | 'road_safety'
  | 'environmental'
  | 'education'
  | 'healthcare'
  | 'disaster_relief'
  | 'veterans'
  | 'animal_welfare'
  | 'arts_culture'

export interface CharityFoundation {
  id: string
  name: string
  cause: CharityCause
  establishedDate: { week: number; year: number }
  
  // Financials
  annualBudget: number
  totalDonated: number
  
  // Impact
  impactScore: number           // 0-100, effectiveness
  publicAwareness: number       // 0-100
  
  // Benefits
  taxDeductionPercentage: number
  reputationBonus: number
  
  // Events
  annualGalaDate?: { week: number; year: number }
}

export interface CharityEvent {
  id: string
  foundationId: string
  type: 'gala' | 'fundraiser' | 'awareness_campaign' | 'direct_aid'
  name: string
  
  cost: number
  amountRaised: number
  
  // Effects
  reputationGain: number
  mediaExposure: number
  taxDeductible: boolean
}

export const CHARITY_CAUSE_CONFIG: Record<CharityCause, {
  name: string
  description: string
  baseReputationBonus: number
  taxDeductionRate: number
  mediaAppeal: number
  minimumInitialDonation: number
  publicImageBonus: number
}> = {
  youth_motorsport: {
    name: 'Youth Motorsport Development',
    description: 'Supporting the next generation of racing talent',
    baseReputationBonus: 15,
    taxDeductionRate: 0.30,
    mediaAppeal: 70,
    minimumInitialDonation: 100000,
    publicImageBonus: 15
  },
  road_safety: {
    name: 'Road Safety Initiatives',
    description: 'Promoting safe driving and reducing accidents',
    baseReputationBonus: 12,
    taxDeductionRate: 0.25,
    mediaAppeal: 60,
    minimumInitialDonation: 75000,
    publicImageBonus: 12
  },
  environmental: {
    name: 'Environmental Sustainability',
    description: 'Green racing and environmental protection',
    baseReputationBonus: 10,
    taxDeductionRate: 0.25,
    mediaAppeal: 65,
    minimumInitialDonation: 150000,
    publicImageBonus: 10
  },
  education: {
    name: 'Education & STEM',
    description: 'Supporting education in engineering and science',
    baseReputationBonus: 10,
    taxDeductionRate: 0.30,
    mediaAppeal: 55,
    minimumInitialDonation: 100000,
    publicImageBonus: 10
  },
  healthcare: {
    name: 'Healthcare & Medical Research',
    description: 'Supporting medical research and healthcare access',
    baseReputationBonus: 12,
    taxDeductionRate: 0.30,
    mediaAppeal: 60,
    minimumInitialDonation: 200000,
    publicImageBonus: 12
  },
  disaster_relief: {
    name: 'Disaster Relief',
    description: 'Providing aid during natural disasters',
    baseReputationBonus: 15,
    taxDeductionRate: 0.35,
    mediaAppeal: 80,
    minimumInitialDonation: 50000,
    publicImageBonus: 18
  },
  veterans: {
    name: 'Veterans Support',
    description: 'Supporting military veterans and their families',
    baseReputationBonus: 12,
    taxDeductionRate: 0.30,
    mediaAppeal: 65,
    minimumInitialDonation: 75000,
    publicImageBonus: 12
  },
  animal_welfare: {
    name: 'Animal Welfare',
    description: 'Protecting animals and wildlife conservation',
    baseReputationBonus: 8,
    taxDeductionRate: 0.20,
    mediaAppeal: 70,
    minimumInitialDonation: 50000,
    publicImageBonus: 8
  },
  arts_culture: {
    name: 'Arts & Culture',
    description: 'Supporting arts, museums, and cultural preservation',
    baseReputationBonus: 8,
    taxDeductionRate: 0.25,
    mediaAppeal: 45,
    minimumInitialDonation: 100000,
    publicImageBonus: 6
  }
}

// ============================================
// RIVALRIES
// ============================================

export type RivalryType =
  | 'professional'       // Pure competition
  | 'personal'           // Personal grudge
  | 'business'           // Business/sponsor conflict
  | 'family'             // Family/dynasty rivalry
  | 'political'          // Motorsport politics

export interface Rivalry {
  id: string
  rivalId: string
  rivalName: string
  rivalType: 'team_owner' | 'driver' | 'sponsor_exec'
  
  type: RivalryType
  intensity: number         // 0-100
  
  origin: string           // How it started
  originDate: { week: number; year: number }
  
  // History
  publicClashes: number
  mediaIncidents: number
  
  // Effects
  mediaAttention: number    // Boost from rivalry
  motivationBonus: number   // Drives you to perform
  stressIncrease: number    // Negative effect
  
  // Status
  isActive: boolean
  lastInteraction?: { week: number; year: number }
}

export const RIVALRY_EVENTS = [
  { trigger: 'poached_sponsor', description: 'Stole your major sponsor', intensityChange: 20 },
  { trigger: 'public_criticism', description: 'Criticized you in the media', intensityChange: 15 },
  { trigger: 'sabotage_accusation', description: 'Accused of sabotaging your team', intensityChange: 25 },
  { trigger: 'hired_your_star', description: 'Hired away your star driver', intensityChange: 20 },
  { trigger: 'political_move', description: 'Blocked you in motorsport politics', intensityChange: 15 },
  { trigger: 'personal_insult', description: 'Made personal comments about you', intensityChange: 30 },
  { trigger: 'family_slight', description: 'Insulted your family legacy', intensityChange: 35 }
]

// ============================================
// SCANDALS & MEDIA
// ============================================

export type ScandalType =
  | 'financial'          // Money-related scandal
  | 'cheating'           // Rule violations
  | 'personal'           // Personal life scandal
  | 'affair'             // Relationship scandal
  | 'substance'          // Substance-related
  | 'criminal'           // Legal issues
  | 'political'          // Political controversy
  | 'safety'             // Safety violations

export interface Scandal {
  id: string
  type: ScandalType
  name: string
  description: string
  
  // Severity
  severity: 'minor' | 'moderate' | 'major' | 'catastrophic'
  
  // Timeline
  discoveryDate: { week: number; year: number }
  peakMediaWeek?: { week: number; year: number }
  resolutionDate?: { week: number; year: number }
  
  // Status
  status: 'brewing' | 'exposed' | 'peak' | 'declining' | 'resolved'
  publicAwareness: number     // 0-100
  
  // Impact
  reputationDamage: number    // Total damage
  sponsorImpact: number       // % sponsors affected
  partnerTrustDamage: number
  legalRisk: number           // 0-100
  
  // Response
  hasResponded: boolean
  responseType?: 'deny' | 'apologize' | 'no_comment' | 'legal_action' | 'spin'
  crisisManagementCost: number
  
  // Evidence
  hasHardEvidence: boolean
  whistleblower?: string
}

export const SCANDAL_TEMPLATES: Omit<Scandal, 'id' | 'discoveryDate' | 'status' | 'publicAwareness' | 'hasResponded' | 'crisisManagementCost'>[] = [
  {
    type: 'financial',
    name: 'Tax Evasion Allegations',
    description: 'Accused of hiding assets offshore',
    severity: 'major',
    reputationDamage: 30,
    sponsorImpact: 40,
    partnerTrustDamage: 20,
    legalRisk: 60,
    hasHardEvidence: false
  },
  {
    type: 'cheating',
    name: 'Technical Regulation Breach',
    description: 'Team accused of illegal car modifications',
    severity: 'major',
    reputationDamage: 35,
    sponsorImpact: 30,
    partnerTrustDamage: 10,
    legalRisk: 40,
    hasHardEvidence: false
  },
  {
    type: 'affair',
    name: 'Extramarital Affair',
    description: 'Caught with someone other than your partner',
    severity: 'moderate',
    reputationDamage: 20,
    sponsorImpact: 15,
    partnerTrustDamage: 80,
    legalRisk: 5,
    hasHardEvidence: true
  },
  {
    type: 'personal',
    name: 'Paparazzi Photos',
    description: 'Embarrassing photos leaked to media',
    severity: 'minor',
    reputationDamage: 10,
    sponsorImpact: 5,
    partnerTrustDamage: 15,
    legalRisk: 0,
    hasHardEvidence: true
  },
  {
    type: 'substance',
    name: 'Substance Abuse Rumors',
    description: 'Rumors of alcohol or drug problems',
    severity: 'moderate',
    reputationDamage: 25,
    sponsorImpact: 35,
    partnerTrustDamage: 30,
    legalRisk: 10,
    hasHardEvidence: false
  },
  {
    type: 'criminal',
    name: 'Fraud Investigation',
    description: 'Under investigation for business fraud',
    severity: 'catastrophic',
    reputationDamage: 50,
    sponsorImpact: 70,
    partnerTrustDamage: 40,
    legalRisk: 80,
    hasHardEvidence: false
  },
  {
    type: 'safety',
    name: 'Safety Violation Cover-up',
    description: 'Accused of hiding safety issues',
    severity: 'major',
    reputationDamage: 40,
    sponsorImpact: 45,
    partnerTrustDamage: 20,
    legalRisk: 50,
    hasHardEvidence: false
  }
]

// Response effectiveness
export const SCANDAL_RESPONSES: Record<NonNullable<Scandal['responseType']>, {
  name: string
  costMultiplier: number
  effectivenessIfGuilty: number    // 0-100
  effectivenessIfInnocent: number  // 0-100
  mediaReaction: number            // Positive = good
  riskOfBackfire: number           // 0-100
}> = {
  deny: {
    name: 'Deny Everything',
    costMultiplier: 0.5,
    effectivenessIfGuilty: 20,
    effectivenessIfInnocent: 70,
    mediaReaction: -10,
    riskOfBackfire: 60
  },
  apologize: {
    name: 'Public Apology',
    costMultiplier: 1,
    effectivenessIfGuilty: 60,
    effectivenessIfInnocent: 40,
    mediaReaction: 20,
    riskOfBackfire: 20
  },
  no_comment: {
    name: 'No Comment',
    costMultiplier: 0.3,
    effectivenessIfGuilty: 30,
    effectivenessIfInnocent: 50,
    mediaReaction: -5,
    riskOfBackfire: 30
  },
  legal_action: {
    name: 'Legal Action Against Accusers',
    costMultiplier: 3,
    effectivenessIfGuilty: 10,
    effectivenessIfInnocent: 80,
    mediaReaction: -15,
    riskOfBackfire: 40
  },
  spin: {
    name: 'PR Spin Campaign',
    costMultiplier: 2,
    effectivenessIfGuilty: 50,
    effectivenessIfInnocent: 60,
    mediaReaction: 5,
    riskOfBackfire: 35
  }
}

// ============================================
// PRIVACY MANAGEMENT
// ============================================

export interface PrivacyLevel {
  level: 'open_book' | 'balanced' | 'private' | 'reclusive'
  monthlySecurityCost: number
  mediaAccessLevel: number        // 0-100
  paparazziRisk: number           // 0-100
  sponsorAppeal: number           // Effect on sponsors
  mysteryBonus: number            // Intrigue value
}

export const PRIVACY_LEVELS: PrivacyLevel[] = [
  {
    level: 'open_book',
    monthlySecurityCost: 5000,
    mediaAccessLevel: 90,
    paparazziRisk: 80,
    sponsorAppeal: 20,
    mysteryBonus: 0
  },
  {
    level: 'balanced',
    monthlySecurityCost: 15000,
    mediaAccessLevel: 50,
    paparazziRisk: 40,
    sponsorAppeal: 10,
    mysteryBonus: 10
  },
  {
    level: 'private',
    monthlySecurityCost: 50000,
    mediaAccessLevel: 20,
    paparazziRisk: 15,
    sponsorAppeal: -5,
    mysteryBonus: 20
  },
  {
    level: 'reclusive',
    monthlySecurityCost: 150000,
    mediaAccessLevel: 5,
    paparazziRisk: 5,
    sponsorAppeal: -15,
    mysteryBonus: 30
  }
]

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getPrivacyLevel(level: PrivacyLevel['level']): PrivacyLevel {
  return PRIVACY_LEVELS.find(p => p.level === level) || PRIVACY_LEVELS[1]
}

export function calculateScandalDamage(scandal: Scandal): number {
  const severityMultiplier = {
    minor: 0.5,
    moderate: 1,
    major: 2,
    catastrophic: 4
  }
  
  return Math.round(
    scandal.reputationDamage * 
    severityMultiplier[scandal.severity] * 
    (scandal.publicAwareness / 100)
  )
}

export function getEventTemplate(type: SocialEventType): Omit<SocialEvent, 'id' | 'date'> | undefined {
  return SOCIAL_EVENT_TEMPLATES.find(t => t.type === type)
}
