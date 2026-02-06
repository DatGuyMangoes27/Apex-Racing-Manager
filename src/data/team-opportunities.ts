/**
 * Team Opportunities System
 * 
 * Non-racing opportunities that arrive organically via email based on
 * team reputation, results, and relationships. These create an immersive
 * experience where the team feels like they're being approached for opportunities.
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export type OpportunityCategory = 
  | 'racing_invitation'      // Existing invitational racing events (handled by invitational-events.ts)
  | 'media_appearance'       // TV shows, podcasts, documentaries, interviews
  | 'manufacturer_program'   // Factory visits, development programs, testing
  | 'special_event'          // Charity events, exhibitions, celebrity events

export type OrganizerType = 
  | 'media'           // TV networks, podcasts, streaming services
  | 'manufacturer'    // Car manufacturers
  | 'sponsor'         // Sponsors and corporate partners
  | 'charity'         // Charitable organizations
  | 'governing_body'  // Racing federations, motorsport organizations
  | 'track'           // Race circuits
  | 'team'            // Other racing teams

export interface OpportunityRewards {
  cash?: number                    // Direct payment
  reputation?: number              // Reputation boost
  fanSentiment?: number           // Fan engagement boost (0-100 scale)
  sponsorSatisfaction?: number    // Boost to sponsor satisfaction
  manufacturerFavor?: number      // Boost to specific manufacturer relationship
  mediaExposure?: number          // PR/media value (affects future opportunities)
}

export interface OpportunityConsequences {
  reputationLoss?: number         // Reputation penalty for declining
  relationshipLoss?: {            // Relationship damage if declined
    type: 'manufacturer' | 'sponsor' | 'media'
    id?: string                    // Specific entity ID if applicable
    amount: number
  }
  fanSentimentLoss?: number       // Fan disappointment
}

export interface OpportunityConditions {
  requiresManufacturer?: string[]     // Must have relationship with these manufacturers
  requiresSponsor?: string[]          // Must have deal with one of these sponsors
  requiresSeriesParticipation?: string[]  // Must be competing in one of these series
  requiresRecentWin?: boolean         // Must have won recently
  requiresRecentPodium?: boolean      // Must have podiumed recently
  requiresChampionship?: boolean      // Must have won a championship
  requiresDriverAvailable?: boolean   // Requires driver (not just owner)
  requiresOwnerAvailable?: boolean    // Requires team owner specifically
  minTeamAge?: number                 // Minimum seasons as a team
  maxDeclinedOpportunities?: number   // Maximum declined opportunities this season
}

export interface TeamOpportunityTemplate {
  id: string
  category: OpportunityCategory
  name: string
  description: string
  organizerType: OrganizerType
  organizerName: string
  organizerLogo?: string           // Logo URL/path if available
  minReputation: number            // Minimum reputation to receive this opportunity
  prestige: number                 // How prestigious (affects reward scaling) 0-100
  duration: number                 // Hours of commitment required
  durationDays: number             // Days this activity blocks on calendar
  rewards: OpportunityRewards
  consequences: OpportunityConsequences
  conditions?: OpportunityConditions
  expirationDays: number           // Days to respond before opportunity expires
  frequency: 'common' | 'uncommon' | 'rare' | 'very_rare'  // How often this can be offered
  cooldownWeeks: number            // Minimum weeks between same opportunity
  emailSubjectTemplate: string     // Template for email subject
  emailBodyTemplate: string        // Template for email body
}

// Generated opportunity instance
export interface TeamOpportunity extends TeamOpportunityTemplate {
  instanceId: string               // Unique ID for this specific instance
  generatedWeek: number
  generatedYear: number
  expiresWeek: number
  expiresYear: number
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'completed'
  scheduledWeek?: number           // When it's scheduled if accepted
  scheduledDay?: number            // Day of week if accepted
  result?: {
    success: boolean
    actualRewards: OpportunityRewards
    narrative?: string             // Generated description of how it went
  }
}

// ============================================
// MEDIA APPEARANCE TEMPLATES
// ============================================

export const MEDIA_APPEARANCE_TEMPLATES: TeamOpportunityTemplate[] = [
  // ============ TV / Documentary ============
  {
    id: 'media-documentary-feature',
    category: 'media_appearance',
    name: 'Motorsport Documentary Feature',
    description: 'A major streaming service wants to feature your team in an episode of their motorsport documentary series. Their film crew would follow you for a race weekend.',
    organizerType: 'media',
    organizerName: 'StreamMax Sports',
    minReputation: 50,
    prestige: 75,
    duration: 16,
    durationDays: 3,
    rewards: {
      cash: 25000,
      reputation: 8,
      fanSentiment: 15,
      mediaExposure: 25
    },
    consequences: {
      reputationLoss: 3,
      fanSentimentLoss: 5
    },
    expirationDays: 14,
    frequency: 'rare',
    cooldownWeeks: 26,
    emailSubjectTemplate: 'Documentary Feature Request - StreamMax Sports',
    emailBodyTemplate: `Dear {{teamName}},

We're producing a new documentary series covering grassroots to professional motorsport, and your team's story has caught our attention. We'd love to feature you in an upcoming episode.

Our crew would follow your team for a race weekend, capturing the behind-the-scenes action, preparation, and race day atmosphere.

This would provide significant exposure for your team and sponsors.

Best regards,
StreamMax Sports Documentary Team`
  },
  {
    id: 'media-tv-guest-appearance',
    category: 'media_appearance',
    name: 'Racing TV Guest Appearance',
    description: 'A popular motorsport TV show has invited you as a guest to discuss your racing journey and provide expert commentary.',
    organizerType: 'media',
    organizerName: 'Motorsport Weekly TV',
    minReputation: 40,
    prestige: 60,
    duration: 4,
    durationDays: 1,
    rewards: {
      cash: 8000,
      reputation: 5,
      fanSentiment: 10,
      mediaExposure: 15
    },
    consequences: {
      reputationLoss: 2,
      fanSentimentLoss: 3
    },
    expirationDays: 10,
    frequency: 'uncommon',
    cooldownWeeks: 12,
    emailSubjectTemplate: 'Guest Appearance Invitation - Motorsport Weekly',
    emailBodyTemplate: `Hello {{teamName}},

We'd like to invite you as a guest on Motorsport Weekly's next episode. We're doing a feature on up-and-coming teams in the sport.

The recording would take about 4 hours including preparation and filming.

Looking forward to hearing from you!

Motorsport Weekly Production Team`
  },
  {
    id: 'media-news-interview',
    category: 'media_appearance',
    name: 'Prime Time News Interview',
    description: 'A national news network wants to feature your team in their sports segment, reaching millions of viewers.',
    organizerType: 'media',
    organizerName: 'National Sports Network',
    minReputation: 65,
    prestige: 80,
    duration: 3,
    durationDays: 1,
    rewards: {
      cash: 15000,
      reputation: 10,
      fanSentiment: 20,
      mediaExposure: 30,
      sponsorSatisfaction: 10
    },
    consequences: {
      reputationLoss: 4,
      fanSentimentLoss: 8
    },
    conditions: {
      requiresRecentWin: true
    },
    expirationDays: 7,
    frequency: 'rare',
    cooldownWeeks: 20,
    emailSubjectTemplate: 'URGENT: Prime Time Interview Request',
    emailBodyTemplate: `Dear {{teamName}},

Following your recent success, we'd like to feature you in our prime time sports segment this week.

This is a fantastic opportunity for national exposure. The interview would be brief but reach our audience of 5+ million viewers.

Please respond as soon as possible.

National Sports Network`
  },

  // ============ Podcasts ============
  {
    id: 'media-racing-podcast',
    category: 'media_appearance',
    name: 'Racing Podcast Interview',
    description: 'A popular motorsport podcast wants to do a deep-dive interview about your team, strategy, and journey in racing.',
    organizerType: 'media',
    organizerName: 'Beyond The Grid Podcast',
    minReputation: 30,
    prestige: 45,
    duration: 2,
    durationDays: 1,
    rewards: {
      cash: 3000,
      reputation: 3,
      fanSentiment: 8,
      mediaExposure: 10
    },
    consequences: {
      reputationLoss: 1
    },
    expirationDays: 14,
    frequency: 'common',
    cooldownWeeks: 8,
    emailSubjectTemplate: 'Podcast Interview Request - Beyond The Grid',
    emailBodyTemplate: `Hi {{teamName}},

I host Beyond The Grid, a podcast where we talk to people in motorsport about their journeys.

I'd love to have you on for an episode. It would be a relaxed conversation - no pressure, just sharing your story.

The interview typically runs about 90 minutes and can be done remotely.

Let me know if you're interested!

Cheers`
  },
  {
    id: 'media-industry-podcast',
    category: 'media_appearance',
    name: 'Motorsport Business Podcast',
    description: 'A business-focused podcast wants to discuss the commercial side of running a racing team.',
    organizerType: 'media',
    organizerName: 'The Pit Lane Business',
    minReputation: 35,
    prestige: 40,
    duration: 2,
    durationDays: 1,
    rewards: {
      cash: 2500,
      reputation: 2,
      sponsorSatisfaction: 8,
      mediaExposure: 8
    },
    consequences: {
      reputationLoss: 1
    },
    expirationDays: 14,
    frequency: 'common',
    cooldownWeeks: 10,
    emailSubjectTemplate: 'Interview Request - Pit Lane Business Podcast',
    emailBodyTemplate: `Dear {{teamName}},

We produce The Pit Lane Business, a podcast exploring the business side of motorsport.

We'd love to discuss how you've built your team, secured sponsorship, and manage the commercial aspects of racing.

It would be great exposure to potential sponsors who listen to our show.

Best,
The Pit Lane Business`
  },

  // ============ Commentary / Expert Roles ============
  {
    id: 'media-commentary-guest',
    category: 'media_appearance',
    name: 'Race Commentary Guest',
    description: 'The broadcast team wants you to provide expert co-commentary during an upcoming race.',
    organizerType: 'media',
    organizerName: 'Racing Broadcast Network',
    minReputation: 55,
    prestige: 65,
    duration: 6,
    durationDays: 1,
    rewards: {
      cash: 12000,
      reputation: 6,
      fanSentiment: 12,
      mediaExposure: 18
    },
    consequences: {
      reputationLoss: 2,
      fanSentimentLoss: 4
    },
    conditions: {
      requiresDriverAvailable: false  // Owner can do this
    },
    expirationDays: 10,
    frequency: 'uncommon',
    cooldownWeeks: 16,
    emailSubjectTemplate: 'Co-Commentary Invitation - Race Broadcast',
    emailBodyTemplate: `Hello {{teamName}},

We're looking for an expert co-commentator for our next race broadcast and thought of your team.

The role would involve providing technical insights and color commentary alongside our main commentator.

It's a great way to raise your profile in the paddock.

Racing Broadcast Network`
  },

  // ============ Social Media / Digital ============
  {
    id: 'media-youtube-collab',
    category: 'media_appearance',
    name: 'YouTube Racing Channel Feature',
    description: 'A popular motorsport YouTube channel wants to create content featuring your team.',
    organizerType: 'media',
    organizerName: 'Racing Edge YouTube',
    minReputation: 25,
    prestige: 35,
    duration: 4,
    durationDays: 1,
    rewards: {
      cash: 5000,
      reputation: 3,
      fanSentiment: 12,
      mediaExposure: 15
    },
    consequences: {
      reputationLoss: 1
    },
    expirationDays: 14,
    frequency: 'common',
    cooldownWeeks: 6,
    emailSubjectTemplate: 'Collab Request - Racing Edge',
    emailBodyTemplate: `Hey {{teamName}}!

I run Racing Edge on YouTube (800k subscribers) and I'd love to feature your team in an upcoming video.

Could be a day at the track, shop tour, whatever works for you. My audience loves seeing the real side of racing.

Hit me up if you're down!

- Racing Edge`
  }
]

// ============================================
// MANUFACTURER PROGRAM TEMPLATES
// ============================================

export const MANUFACTURER_PROGRAM_TEMPLATES: TeamOpportunityTemplate[] = [
  // ============ Factory Experiences ============
  {
    id: 'manufacturer-factory-tour',
    category: 'manufacturer_program',
    name: 'Factory Tour Invitation',
    description: 'A manufacturer has invited your team for an exclusive tour of their racing facility and heritage collection.',
    organizerType: 'manufacturer',
    organizerName: '{{manufacturerName}}',  // Dynamically replaced
    minReputation: 40,
    prestige: 55,
    duration: 8,
    durationDays: 1,
    rewards: {
      manufacturerFavor: 15,
      reputation: 4,
      fanSentiment: 5
    },
    consequences: {
      relationshipLoss: {
        type: 'manufacturer',
        amount: 10
      }
    },
    conditions: {
      requiresManufacturer: []  // Will be populated dynamically
    },
    expirationDays: 21,
    frequency: 'uncommon',
    cooldownWeeks: 26,
    emailSubjectTemplate: 'Exclusive Factory Tour Invitation',
    emailBodyTemplate: `Dear {{teamName}},

As a valued customer and racing partner, we'd like to invite you for an exclusive tour of our racing heritage facility.

You'll see our race shop, meet our engineers, and experience our motorsport history firsthand.

We look forward to hosting you.

{{manufacturerName}} Motorsport Division`
  },
  {
    id: 'manufacturer-development-test',
    category: 'manufacturer_program',
    name: 'Development Car Test Session',
    description: 'A manufacturer wants your feedback on a prototype vehicle. You\'ll have exclusive track time with their development team.',
    organizerType: 'manufacturer',
    organizerName: '{{manufacturerName}}',
    minReputation: 60,
    prestige: 80,
    duration: 12,
    durationDays: 2,
    rewards: {
      cash: 15000,
      manufacturerFavor: 25,
      reputation: 8,
      fanSentiment: 10
    },
    consequences: {
      relationshipLoss: {
        type: 'manufacturer',
        amount: 20
      },
      reputationLoss: 3
    },
    conditions: {
      requiresManufacturer: [],
      requiresDriverAvailable: true
    },
    expirationDays: 14,
    frequency: 'rare',
    cooldownWeeks: 30,
    emailSubjectTemplate: 'Confidential: Development Program Invitation',
    emailBodyTemplate: `CONFIDENTIAL

Dear {{teamName}},

We are developing a new competition vehicle and would value your input as an experienced racing team.

We're inviting select partners for exclusive testing sessions at our private facility. Your driver's feedback would be invaluable to our engineers.

This is an NDA-covered opportunity.

{{manufacturerName}} Competition Development`
  },
  {
    id: 'manufacturer-young-driver-coach',
    category: 'manufacturer_program',
    name: 'Young Driver Academy Guest Coach',
    description: 'A manufacturer\'s young driver program wants you to mentor their upcoming talent.',
    organizerType: 'manufacturer',
    organizerName: '{{manufacturerName}} Academy',
    minReputation: 50,
    prestige: 60,
    duration: 8,
    durationDays: 1,
    rewards: {
      cash: 8000,
      manufacturerFavor: 12,
      reputation: 5,
      fanSentiment: 8
    },
    consequences: {
      relationshipLoss: {
        type: 'manufacturer',
        amount: 8
      }
    },
    conditions: {
      requiresManufacturer: []
    },
    expirationDays: 14,
    frequency: 'uncommon',
    cooldownWeeks: 20,
    emailSubjectTemplate: 'Guest Coach Invitation - Young Driver Academy',
    emailBodyTemplate: `Dear {{teamName}},

Our Young Driver Academy is looking for experienced racers to mentor the next generation of talent.

We'd like to invite you to spend a day with our academy students, sharing your knowledge and experience.

It's a rewarding experience and strengthens our partnership.

{{manufacturerName}} Academy`
  },
  {
    id: 'manufacturer-heritage-drive',
    category: 'manufacturer_program',
    name: 'Heritage Collection Drive',
    description: 'A manufacturer is offering you the opportunity to drive their historic racing cars at a special event.',
    organizerType: 'manufacturer',
    organizerName: '{{manufacturerName}} Heritage',
    minReputation: 70,
    prestige: 85,
    duration: 6,
    durationDays: 1,
    rewards: {
      manufacturerFavor: 20,
      reputation: 7,
      fanSentiment: 15,
      mediaExposure: 12
    },
    consequences: {
      relationshipLoss: {
        type: 'manufacturer',
        amount: 15
      },
      reputationLoss: 2
    },
    conditions: {
      requiresManufacturer: [],
      requiresDriverAvailable: true
    },
    expirationDays: 21,
    frequency: 'rare',
    cooldownWeeks: 52,
    emailSubjectTemplate: 'Exclusive: Heritage Collection Driving Experience',
    emailBodyTemplate: `Dear {{teamName}},

We would like to offer you a once-in-a-lifetime opportunity to drive some of our most iconic racing cars from our heritage collection.

This is an extremely exclusive invitation extended only to our most valued partners.

{{manufacturerName}} Heritage Division`
  },
  {
    id: 'manufacturer-works-evaluation',
    category: 'manufacturer_program',
    name: 'Works Team Evaluation Session',
    description: 'A manufacturer is considering you for their factory racing program. This is an evaluation session.',
    organizerType: 'manufacturer',
    organizerName: '{{manufacturerName}} Motorsport',
    minReputation: 80,
    prestige: 95,
    duration: 16,
    durationDays: 2,
    rewards: {
      manufacturerFavor: 35,
      reputation: 12,
      fanSentiment: 20,
      mediaExposure: 25
    },
    consequences: {
      relationshipLoss: {
        type: 'manufacturer',
        amount: 30
      },
      reputationLoss: 5
    },
    conditions: {
      requiresManufacturer: [],
      requiresDriverAvailable: true,
      requiresChampionship: true
    },
    expirationDays: 10,
    frequency: 'very_rare',
    cooldownWeeks: 52,
    emailSubjectTemplate: 'CONFIDENTIAL: Works Team Opportunity',
    emailBodyTemplate: `STRICTLY CONFIDENTIAL

Dear {{teamName}},

Your performances have not gone unnoticed. We are evaluating potential additions to our factory racing program.

We would like to invite you for an evaluation session at our test facility. This is an opportunity to demonstrate your abilities at the highest level.

Please treat this communication with discretion.

{{manufacturerName}} Motorsport`
  },
  {
    id: 'manufacturer-customer-appreciation',
    category: 'manufacturer_program',
    name: 'Customer Appreciation Event',
    description: 'A manufacturer is hosting an appreciation event for their racing customers with exclusive experiences.',
    organizerType: 'manufacturer',
    organizerName: '{{manufacturerName}}',
    minReputation: 30,
    prestige: 40,
    duration: 6,
    durationDays: 1,
    rewards: {
      manufacturerFavor: 8,
      reputation: 2,
      fanSentiment: 5
    },
    consequences: {
      relationshipLoss: {
        type: 'manufacturer',
        amount: 5
      }
    },
    conditions: {
      requiresManufacturer: []
    },
    expirationDays: 21,
    frequency: 'common',
    cooldownWeeks: 16,
    emailSubjectTemplate: 'You\'re Invited: Customer Appreciation Event',
    emailBodyTemplate: `Dear {{teamName}},

You're invited to our annual Customer Appreciation Day!

Join us for a day of networking, driving experiences, and exclusive announcements about our upcoming racing programs.

We hope to see you there.

{{manufacturerName}} Customer Relations`
  }
]

// ============================================
// SPECIAL EVENT TEMPLATES
// ============================================

export const SPECIAL_EVENT_TEMPLATES: TeamOpportunityTemplate[] = [
  // ============ Charity Events ============
  {
    id: 'special-charity-karting',
    category: 'special_event',
    name: 'Charity Karting Event',
    description: 'A charity organization is hosting a celebrity karting event for a good cause.',
    organizerType: 'charity',
    organizerName: 'Racing for Hope Foundation',
    minReputation: 25,
    prestige: 35,
    duration: 5,
    durationDays: 1,
    rewards: {
      reputation: 4,
      fanSentiment: 15,
      mediaExposure: 8
    },
    consequences: {
      reputationLoss: 2,
      fanSentimentLoss: 8
    },
    expirationDays: 21,
    frequency: 'common',
    cooldownWeeks: 12,
    emailSubjectTemplate: 'Invitation: Charity Karting Event',
    emailBodyTemplate: `Dear {{teamName}},

You're invited to participate in our annual charity karting event! Race alongside celebrities and sports stars while raising money for children in need.

It's a fun day for a great cause, and great exposure for your team.

Racing for Hope Foundation`
  },
  {
    id: 'special-charity-auction',
    category: 'special_event',
    name: 'Motorsport Charity Auction',
    description: 'A charity gala is requesting your presence and a racing experience to auction.',
    organizerType: 'charity',
    organizerName: 'Motorsport Cares',
    minReputation: 45,
    prestige: 55,
    duration: 4,
    durationDays: 1,
    rewards: {
      reputation: 5,
      fanSentiment: 12,
      sponsorSatisfaction: 8,
      mediaExposure: 10
    },
    consequences: {
      reputationLoss: 2,
      fanSentimentLoss: 5
    },
    expirationDays: 21,
    frequency: 'uncommon',
    cooldownWeeks: 20,
    emailSubjectTemplate: 'Gala Invitation - Motorsport Cares',
    emailBodyTemplate: `Dear {{teamName}},

We're hosting our annual charity gala and would be honored to have you attend.

We'd also love if you could donate a racing experience for our auction - perhaps a ride-along or paddock tour?

Your presence would mean a lot to our cause.

Motorsport Cares`
  },

  // ============ Exhibition Events ============
  {
    id: 'special-motorsport-festival',
    category: 'special_event',
    name: 'Motorsport Festival Appearance',
    description: 'A major motorsport festival wants your team for demo runs and fan meet-and-greets.',
    organizerType: 'track',
    organizerName: 'Goodwood Festival',
    minReputation: 55,
    prestige: 70,
    duration: 12,
    durationDays: 2,
    rewards: {
      cash: 10000,
      reputation: 6,
      fanSentiment: 20,
      mediaExposure: 18,
      sponsorSatisfaction: 10
    },
    consequences: {
      reputationLoss: 3,
      fanSentimentLoss: 10
    },
    expirationDays: 30,
    frequency: 'rare',
    cooldownWeeks: 52,
    emailSubjectTemplate: 'Festival Invitation - Goodwood',
    emailBodyTemplate: `Dear {{teamName}},

We'd like to invite your team to participate in this year's festival!

Your cars would take part in demo runs, and you'd have a display area in the paddock for fan interactions.

This is excellent exposure with our 150,000+ attendees.

Goodwood Festival Team`
  },
  {
    id: 'special-classic-parade',
    category: 'special_event',
    name: 'Classic Car Parade',
    description: 'A prestigious classic car event wants you to participate in their parade of racing legends.',
    organizerType: 'track',
    organizerName: 'Historic Racing Association',
    minReputation: 40,
    prestige: 50,
    duration: 4,
    durationDays: 1,
    rewards: {
      reputation: 3,
      fanSentiment: 10,
      mediaExposure: 8
    },
    consequences: {
      reputationLoss: 1
    },
    expirationDays: 21,
    frequency: 'uncommon',
    cooldownWeeks: 20,
    emailSubjectTemplate: 'Parade Invitation - Historic Racing',
    emailBodyTemplate: `Dear {{teamName}},

Our annual classic racing festival includes a parade of contemporary racing teams. We'd love for you to participate!

It's a great chance to connect with the historic racing community.

Historic Racing Association`
  },

  // ============ Gaming / Esports ============
  {
    id: 'special-esports-crossover',
    category: 'special_event',
    name: 'Sim Racing Exhibition',
    description: 'An esports organization wants you to compete in a sim racing exhibition against top virtual racers.',
    organizerType: 'media',
    organizerName: 'Virtual Motorsport League',
    minReputation: 35,
    prestige: 45,
    duration: 4,
    durationDays: 1,
    rewards: {
      cash: 5000,
      reputation: 3,
      fanSentiment: 15,
      mediaExposure: 12
    },
    consequences: {
      fanSentimentLoss: 3
    },
    expirationDays: 14,
    frequency: 'common',
    cooldownWeeks: 16,
    emailSubjectTemplate: 'Sim Racing Challenge - VML',
    emailBodyTemplate: `Hey {{teamName}}!

We're hosting a Real vs Sim racing challenge and want to invite real racing teams to take on our top sim racers!

It's great content and really popular with fans. Prize money for winning too!

Virtual Motorsport League`
  },
  {
    id: 'special-gaming-event',
    category: 'special_event',
    name: 'Racing Game Launch Event',
    description: 'A video game publisher wants you to appear at their new racing game launch event.',
    organizerType: 'media',
    organizerName: 'SpeedWorks Games',
    minReputation: 45,
    prestige: 50,
    duration: 6,
    durationDays: 1,
    rewards: {
      cash: 12000,
      reputation: 4,
      fanSentiment: 18,
      mediaExposure: 15
    },
    consequences: {
      reputationLoss: 1
    },
    expirationDays: 14,
    frequency: 'uncommon',
    cooldownWeeks: 26,
    emailSubjectTemplate: 'Game Launch Appearance Request',
    emailBodyTemplate: `Dear {{teamName}},

We're launching our new racing simulation and would love to have real racing teams at our launch event!

You'd try the game on stage, meet fans, and be featured in our marketing materials.

SpeedWorks Games`
  },

  // ============ Corporate / VIP Events ============
  {
    id: 'special-corporate-hospitality',
    category: 'special_event',
    name: 'Corporate Hospitality Demo',
    description: 'A corporate sponsor wants you to provide demo laps and meet-and-greets for their VIP clients.',
    organizerType: 'sponsor',
    organizerName: '{{sponsorName}}',
    minReputation: 40,
    prestige: 45,
    duration: 6,
    durationDays: 1,
    rewards: {
      cash: 8000,
      sponsorSatisfaction: 15,
      reputation: 2
    },
    consequences: {
      relationshipLoss: {
        type: 'sponsor',
        amount: 12
      }
    },
    conditions: {
      requiresSponsor: []  // Dynamically populated
    },
    expirationDays: 14,
    frequency: 'common',
    cooldownWeeks: 8,
    emailSubjectTemplate: 'VIP Event Request - {{sponsorName}}',
    emailBodyTemplate: `Dear {{teamName}},

We're hosting a VIP client event and would love for you to be the star attraction!

Demo laps in your race car and a meet-and-greet with our top clients would be incredible. We'll compensate you for your time, of course.

{{sponsorName}} Marketing Team`
  },
  {
    id: 'special-product-launch',
    category: 'special_event',
    name: 'Sponsor Product Launch',
    description: 'A sponsor is launching a new product and wants your team featured at the event.',
    organizerType: 'sponsor',
    organizerName: '{{sponsorName}}',
    minReputation: 50,
    prestige: 55,
    duration: 5,
    durationDays: 1,
    rewards: {
      cash: 10000,
      sponsorSatisfaction: 20,
      reputation: 3,
      mediaExposure: 10
    },
    consequences: {
      relationshipLoss: {
        type: 'sponsor',
        amount: 18
      },
      reputationLoss: 2
    },
    conditions: {
      requiresSponsor: []
    },
    expirationDays: 10,
    frequency: 'uncommon',
    cooldownWeeks: 16,
    emailSubjectTemplate: 'Product Launch Invitation - {{sponsorName}}',
    emailBodyTemplate: `Dear {{teamName}},

We're launching our newest product line and want our racing partnership front and center!

Your car and team would be featured at the launch event, with media coverage and VIP guests.

This is a key opportunity for both of us.

{{sponsorName}}`
  },

  // ============ Elite / Prestigious Events ============
  {
    id: 'special-race-of-champions',
    category: 'special_event',
    name: 'Race of Champions Invitation',
    description: 'The prestigious Race of Champions wants you to compete representing your nation.',
    organizerType: 'governing_body',
    organizerName: 'Race of Champions Organization',
    minReputation: 75,
    prestige: 90,
    duration: 16,
    durationDays: 2,
    rewards: {
      cash: 30000,
      reputation: 12,
      fanSentiment: 25,
      mediaExposure: 30
    },
    consequences: {
      reputationLoss: 5,
      fanSentimentLoss: 12
    },
    conditions: {
      requiresChampionship: true
    },
    expirationDays: 21,
    frequency: 'very_rare',
    cooldownWeeks: 52,
    emailSubjectTemplate: 'OFFICIAL: Race of Champions Invitation',
    emailBodyTemplate: `Dear {{teamName}},

On behalf of the Race of Champions Organization, we are pleased to extend an official invitation to compete in this year's event.

Your achievements in motorsport have earned you a place among the world's best drivers. You would compete representing your nation against champions from all racing disciplines.

This is the highest honor in our sport.

Race of Champions Organization`
  },
  {
    id: 'special-legends-exhibition',
    category: 'special_event',
    name: 'Legends of Motorsport Exhibition',
    description: 'A prestigious exhibition of racing legends wants to feature you alongside motorsport icons.',
    organizerType: 'governing_body',
    organizerName: 'Motorsport Hall of Fame',
    minReputation: 70,
    prestige: 85,
    duration: 8,
    durationDays: 1,
    rewards: {
      reputation: 10,
      fanSentiment: 20,
      mediaExposure: 22
    },
    consequences: {
      reputationLoss: 3,
      fanSentimentLoss: 8
    },
    expirationDays: 30,
    frequency: 'very_rare',
    cooldownWeeks: 52,
    emailSubjectTemplate: 'Exhibition Invitation - Motorsport Hall of Fame',
    emailBodyTemplate: `Dear {{teamName}},

The Motorsport Hall of Fame is hosting a special exhibition celebrating the legends of our sport, and we want you to be part of it.

You would be featured alongside racing icons, with your achievements highlighted for fans and media.

This is a rare honor.

Motorsport Hall of Fame`
  },

  // ============ Community Events ============
  {
    id: 'special-school-visit',
    category: 'special_event',
    name: 'School Outreach Program',
    description: 'A local school has invited you to inspire young students about STEM and motorsport careers.',
    organizerType: 'charity',
    organizerName: 'Racing STEM Initiative',
    minReputation: 20,
    prestige: 25,
    duration: 4,
    durationDays: 1,
    rewards: {
      reputation: 2,
      fanSentiment: 10
    },
    consequences: {
      reputationLoss: 1,
      fanSentimentLoss: 5
    },
    expirationDays: 21,
    frequency: 'common',
    cooldownWeeks: 8,
    emailSubjectTemplate: 'School Visit Request',
    emailBodyTemplate: `Dear {{teamName}},

We're part of the Racing STEM Initiative, connecting racing teams with schools to inspire young minds.

Would you be willing to visit a local school to talk about racing, engineering, and teamwork? The kids would love it!

Racing STEM Initiative`
  },
  {
    id: 'special-fan-club-meet',
    category: 'special_event',
    name: 'Fan Club Meet and Greet',
    description: 'Your growing fanbase has organized an official meet and greet event.',
    organizerType: 'team',
    organizerName: '{{teamName}} Fan Club',
    minReputation: 35,
    prestige: 30,
    duration: 3,
    durationDays: 1,
    rewards: {
      fanSentiment: 20,
      reputation: 2
    },
    consequences: {
      fanSentimentLoss: 15,
      reputationLoss: 2
    },
    expirationDays: 14,
    frequency: 'common',
    cooldownWeeks: 12,
    emailSubjectTemplate: 'Fan Meet Request - Your Official Fan Club',
    emailBodyTemplate: `Dear {{teamName}},

Your fan club has grown significantly, and they're asking for an official meet and greet event!

The fans are your biggest supporters. A few hours with them would mean the world and build incredible loyalty.

{{teamName}} Fan Club`
  }
]

// ============================================
// ALL TEMPLATES COMBINED
// ============================================

export const ALL_OPPORTUNITY_TEMPLATES: TeamOpportunityTemplate[] = [
  ...MEDIA_APPEARANCE_TEMPLATES,
  ...MANUFACTURER_PROGRAM_TEMPLATES,
  ...SPECIAL_EVENT_TEMPLATES
]

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get templates available for a given reputation level
 */
export function getAvailableTemplates(reputation: number): TeamOpportunityTemplate[] {
  return ALL_OPPORTUNITY_TEMPLATES.filter(t => reputation >= t.minReputation)
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: OpportunityCategory): TeamOpportunityTemplate[] {
  return ALL_OPPORTUNITY_TEMPLATES.filter(t => t.category === category)
}

/**
 * Get templates by frequency
 */
export function getTemplatesByFrequency(frequency: TeamOpportunityTemplate['frequency']): TeamOpportunityTemplate[] {
  return ALL_OPPORTUNITY_TEMPLATES.filter(t => t.frequency === frequency)
}

/**
 * Calculate base chance of an opportunity being offered
 * Based on reputation and frequency
 */
export function calculateOfferChance(template: TeamOpportunityTemplate, reputation: number): number {
  // Base chances by frequency
  const baseChances: Record<TeamOpportunityTemplate['frequency'], number> = {
    'common': 0.25,      // 25% base chance per week
    'uncommon': 0.12,    // 12% base chance per week
    'rare': 0.05,        // 5% base chance per week
    'very_rare': 0.02    // 2% base chance per week
  }
  
  const baseChance = baseChances[template.frequency]
  
  // Reputation modifier: higher reputation = higher chance
  // +0.5% per point of reputation above minimum
  const repExcess = Math.max(0, reputation - template.minReputation)
  const repModifier = 1 + (repExcess * 0.005)  // Each point adds 0.5%
  
  // Cap at 3x base chance
  return Math.min(baseChance * repModifier, baseChance * 3)
}
