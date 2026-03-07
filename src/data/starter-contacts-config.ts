// ============================================
// STARTER CONTACTS CONFIGURATION
// ============================================
// Defines background-specific starter contacts for career creation.
// Each background has a curated roster of narratively coherent contacts
// so you don't start the game knowing absolutely nobody.

import type { ContactType } from '@/services/contactService'

// ============================================
// TYPES
// ============================================

export interface StarterContactArchetype {
  id: string
  defaultFirstName: string
  defaultLastName: string
  type: ContactType
  gender: 'male' | 'female'
  description: string                    // How you know them (shown on card)
  occupation: string
  ageRange: [number, number]             // [min, max]
  startingRelationshipLevel: number      // 0-100
  startingTrustLevel: number             // 0-100
  startingAffectionLevel: number         // 0-100
  traits: string[]                       // Personality traits
  introMessage: string                   // First message they send you
}

export interface PartnerTraitOption {
  id: string
  label: string
  description: string
  icon: string
}

export type RelationshipStatusOption = 'single' | 'dating' | 'married'

// ============================================
// PARTNER TRAIT OPTIONS
// ============================================
// Shown during career creation for partner personality selection

export const PARTNER_TRAIT_OPTIONS: PartnerTraitOption[] = [
  { id: 'supportive', label: 'Supportive', description: 'Always there during tough times', icon: 'Heart' },
  { id: 'ambitious', label: 'Ambitious', description: 'Career-focused and driven', icon: 'TrendingUp' },
  { id: 'racing_fan', label: 'Racing Fan', description: 'Loves motorsport as much as you', icon: 'Flag' },
  { id: 'career_focused', label: 'Career-Focused', description: 'Has their own successful career', icon: 'Briefcase' },
  { id: 'social_butterfly', label: 'Social Butterfly', description: 'Thrives in social settings', icon: 'Users' },
  { id: 'private_person', label: 'Private Person', description: 'Values personal space and quiet', icon: 'Shield' },
  { id: 'adventurous', label: 'Adventurous', description: 'Always up for new experiences', icon: 'Compass' },
  { id: 'family_oriented', label: 'Family-Oriented', description: 'Dreams of building a family', icon: 'Home' },
]

// ============================================
// BACKGROUND-SPECIFIC STARTER CONTACTS
// ============================================

export const STARTER_CONTACTS: Record<string, StarterContactArchetype[]> = {
  self_made: [
    {
      id: 'sm_business_partner',
      defaultFirstName: 'Marcus',
      defaultLastName: 'Chen',
      type: 'friend',
      gender: 'male',
      description: 'Your old business partner from your entrepreneur days',
      occupation: 'Business Owner',
      ageRange: [35, 50],
      startingRelationshipLevel: 65,
      startingTrustLevel: 70,
      startingAffectionLevel: 55,
      traits: ['loyal', 'driven', 'supportive'],
      introMessage: "So you actually went and did it! A racing team... I always knew you'd do something crazy like this. Count me in for moral support!"
    },
    {
      id: 'sm_accountant',
      defaultFirstName: 'Sarah',
      defaultLastName: 'Mitchell',
      type: 'business',
      gender: 'female',
      description: 'Your trusted accountant who helped build your business',
      occupation: 'Accountant',
      ageRange: [32, 48],
      startingRelationshipLevel: 50,
      startingTrustLevel: 75,
      startingAffectionLevel: 40,
      traits: ['reliable', 'disciplined', 'cautious'],
      introMessage: "Congratulations on the new venture! I've set up the preliminary financial structure. We should talk about budgets soon - racing teams have unique tax implications."
    },
    {
      id: 'sm_racing_club',
      defaultFirstName: 'Dave',
      defaultLastName: 'Thompson',
      type: 'friend',
      gender: 'male',
      description: 'President of the local racing club you frequented',
      occupation: 'Racing Club President',
      ageRange: [45, 60],
      startingRelationshipLevel: 55,
      startingTrustLevel: 50,
      startingAffectionLevel: 45,
      traits: ['passionate', 'gregarious', 'knowledgeable'],
      introMessage: "Heard you're going pro! Everyone at the club is buzzing about it. If you ever need any local grassroots contacts, you know where to find me."
    },
    {
      id: 'sm_former_employee',
      defaultFirstName: 'Priya',
      defaultLastName: 'Sharma',
      type: 'friend',
      gender: 'female',
      description: 'Former employee who became a close friend over the years',
      occupation: 'Marketing Manager',
      ageRange: [28, 38],
      startingRelationshipLevel: 60,
      startingTrustLevel: 60,
      startingAffectionLevel: 50,
      traits: ['creative', 'enthusiastic', 'ambitious'],
      introMessage: "I can't believe you're starting a racing team! This is huge! If you need any marketing help getting the brand off the ground, I'm your person."
    }
  ],

  racing_dynasty: [
    {
      id: 'rd_family_friend',
      defaultFirstName: 'Giorgio',
      defaultLastName: 'Mancini',
      type: 'business',
      gender: 'male',
      description: 'Retired team principal and old friend of your family',
      occupation: 'Retired Team Principal',
      ageRange: [55, 70],
      startingRelationshipLevel: 60,
      startingTrustLevel: 65,
      startingAffectionLevel: 50,
      traits: ['wise', 'connected', 'demanding'],
      introMessage: "Your father would be proud. I remember when he was in your shoes - young, eager, and convinced he could change the sport. He did. Now it's your turn. Call me if you need guidance."
    },
    {
      id: 'rd_childhood_friend',
      defaultFirstName: 'Sophie',
      defaultLastName: 'Leclerc',
      type: 'friend',
      gender: 'female',
      description: 'Childhood friend who grew up in the paddock alongside you',
      occupation: 'Motorsport PR Consultant',
      ageRange: [27, 36],
      startingRelationshipLevel: 70,
      startingTrustLevel: 75,
      startingAffectionLevel: 65,
      traits: ['witty', 'loyal', 'charismatic'],
      introMessage: "Finally stepping out of the family shadow! Remember when we used to sneak into the garages as kids? Now you own one! I'll be watching every race."
    },
    {
      id: 'rd_journalist',
      defaultFirstName: 'James',
      defaultLastName: 'Crawford',
      type: 'business',
      gender: 'male',
      description: 'Motorsport journalist who covered your family for decades',
      occupation: 'Motorsport Journalist',
      ageRange: [45, 60],
      startingRelationshipLevel: 45,
      startingTrustLevel: 40,
      startingAffectionLevel: 35,
      traits: ['perceptive', 'ambitious', 'persistent'],
      introMessage: "Another chapter in the dynasty! I've been covering your family since before you were born. I'd love to do a profile piece on the new generation. What do you say?"
    },
    {
      id: 'rd_family_lawyer',
      defaultFirstName: 'Elizabeth',
      defaultLastName: 'Harrington',
      type: 'business',
      gender: 'female',
      description: 'The family lawyer who has handled your affairs for years',
      occupation: 'Motorsport Lawyer',
      ageRange: [42, 58],
      startingRelationshipLevel: 50,
      startingTrustLevel: 80,
      startingAffectionLevel: 35,
      traits: ['meticulous', 'intelligent', 'discreet'],
      introMessage: "Congratulations on the new team. I've reviewed the incorporation documents and everything is in order. Do let me know when you need contract templates for drivers and sponsors."
    },
    {
      id: 'rd_mechanic',
      defaultFirstName: 'Roberto',
      defaultLastName: 'Ferrari',
      type: 'friend',
      gender: 'male',
      description: 'Old family mechanic who worked on your father\'s cars',
      occupation: 'Retired Racing Mechanic',
      ageRange: [55, 65],
      startingRelationshipLevel: 65,
      startingTrustLevel: 70,
      startingAffectionLevel: 60,
      traits: ['humble', 'dedicated', 'nostalgic'],
      introMessage: "Ciao! I heard the news. The paddock won't know what hit it! If you ever need an old hand to look over a car, you know where to find me. Some things you can only learn by touch."
    }
  ],

  tech_investor: [
    {
      id: 'ti_cofounder',
      defaultFirstName: 'Alex',
      defaultLastName: 'Park',
      type: 'business',
      gender: 'male',
      description: 'Co-founder of your most successful tech venture',
      occupation: 'Tech CEO',
      ageRange: [30, 45],
      startingRelationshipLevel: 60,
      startingTrustLevel: 65,
      startingAffectionLevel: 50,
      traits: ['innovative', 'intense', 'competitive'],
      introMessage: "A racing team? That's either the most brilliant pivot or the most expensive hobby in history. Either way, I've got some telemetry ideas that could give you an edge. Let's talk data."
    },
    {
      id: 'ti_vc_partner',
      defaultFirstName: 'Victoria',
      defaultLastName: 'Reeves',
      type: 'business',
      gender: 'female',
      description: 'Venture capital partner from your investment days',
      occupation: 'Venture Capitalist',
      ageRange: [35, 50],
      startingRelationshipLevel: 50,
      startingTrustLevel: 55,
      startingAffectionLevel: 35,
      traits: ['analytical', 'ambitious', 'networked'],
      introMessage: "Interesting move into motorsport. The sponsorship market alone is worth billions globally. I know a few people who might want to talk about investment opportunities. Let me know."
    },
    {
      id: 'ti_tech_journo',
      defaultFirstName: 'Kai',
      defaultLastName: 'Nakamura',
      type: 'business',
      gender: 'male',
      description: 'Tech journalist who has followed your career moves',
      occupation: 'Technology Journalist',
      ageRange: [28, 40],
      startingRelationshipLevel: 40,
      startingTrustLevel: 35,
      startingAffectionLevel: 30,
      traits: ['curious', 'well-connected', 'sharp'],
      introMessage: "Tech mogul turns racing team owner - that's a headline. Would love to cover the story. What's the angle? Data-driven racing? Silicon Valley meets the paddock?"
    },
    {
      id: 'ti_college_friend',
      defaultFirstName: 'Nina',
      defaultLastName: 'Patel',
      type: 'friend',
      gender: 'female',
      description: 'College roommate who has remained a close friend',
      occupation: 'Software Architect',
      ageRange: [30, 40],
      startingRelationshipLevel: 65,
      startingTrustLevel: 70,
      startingAffectionLevel: 60,
      traits: ['supportive', 'humorous', 'grounded'],
      introMessage: "From late night coding sessions to owning a racing team. Our dorm room selves would NOT believe this. I'm so happy for you! When do I get a paddock pass?"
    }
  ],

  former_driver: [
    {
      id: 'fd_teammate',
      defaultFirstName: 'Carlos',
      defaultLastName: 'Ramirez',
      type: 'friend',
      gender: 'male',
      description: 'Your former teammate from your racing days',
      occupation: 'Racing Driver',
      ageRange: [28, 40],
      startingRelationshipLevel: 65,
      startingTrustLevel: 60,
      startingAffectionLevel: 55,
      traits: ['competitive', 'loyal', 'passionate'],
      introMessage: "So the old rival becomes a team boss! Never thought I'd see the day. If you're ever looking for a driver who knows how to push the car to the limit... well, you've got my number!"
    },
    {
      id: 'fd_engineer',
      defaultFirstName: 'Hanna',
      defaultLastName: 'Weber',
      type: 'business',
      gender: 'female',
      description: 'Racing engineer who worked on your car for three seasons',
      occupation: 'Race Engineer',
      ageRange: [30, 45],
      startingRelationshipLevel: 55,
      startingTrustLevel: 65,
      startingAffectionLevel: 45,
      traits: ['analytical', 'precise', 'calm'],
      introMessage: "Congratulations on the team! I always said you understood the car better than most engineers. If you need someone who knows how to translate driver feedback into setups, you know where I am."
    },
    {
      id: 'fd_agent',
      defaultFirstName: 'Richard',
      defaultLastName: 'Blake',
      type: 'business',
      gender: 'male',
      description: 'Your motorsport agent who managed your driving career',
      occupation: 'Motorsport Agent',
      ageRange: [40, 55],
      startingRelationshipLevel: 50,
      startingTrustLevel: 55,
      startingAffectionLevel: 40,
      traits: ['shrewd', 'charismatic', 'connected'],
      introMessage: "From driver to owner - now that's a career progression. I've got contacts across every series. If you need help signing talent or negotiating deals, I'm still your man."
    },
    {
      id: 'fd_fan_organizer',
      defaultFirstName: 'Mei',
      defaultLastName: 'Tanaka',
      type: 'friend',
      gender: 'female',
      description: 'Organized your fan club during your driving career',
      occupation: 'Events Coordinator',
      ageRange: [25, 35],
      startingRelationshipLevel: 55,
      startingTrustLevel: 50,
      startingAffectionLevel: 50,
      traits: ['enthusiastic', 'organized', 'loyal'],
      introMessage: "The fan club is going WILD about this! A team with your name on it?! We're already planning watch parties for every race. Your supporters are behind you 100%!"
    },
    {
      id: 'fd_journalist',
      defaultFirstName: 'Patrick',
      defaultLastName: 'O\'Brien',
      type: 'business',
      gender: 'male',
      description: 'Journalist who covered your entire racing career',
      occupation: 'Motorsport Journalist',
      ageRange: [38, 55],
      startingRelationshipLevel: 45,
      startingTrustLevel: 45,
      startingAffectionLevel: 35,
      traits: ['thorough', 'fair', 'experienced'],
      introMessage: "From cockpit to pitwall - that's a story worth telling. I covered every chapter of your driving career. Now I want to cover this one too. First interview?"
    }
  ],

  finance_mogul: [
    {
      id: 'fm_banker',
      defaultFirstName: 'Jonathan',
      defaultLastName: 'Whitfield',
      type: 'business',
      gender: 'male',
      description: 'Investment banker colleague from your finance career',
      occupation: 'Investment Banker',
      ageRange: [38, 55],
      startingRelationshipLevel: 50,
      startingTrustLevel: 50,
      startingAffectionLevel: 35,
      traits: ['calculating', 'ambitious', 'well-connected'],
      introMessage: "Racing teams are typically terrible investments, you know. But if anyone can make the numbers work, it's you. I might know some institutional investors interested in motorsport exposure."
    },
    {
      id: 'fm_lawyer',
      defaultFirstName: 'Catherine',
      defaultLastName: 'Ross',
      type: 'business',
      gender: 'female',
      description: 'Corporate lawyer who has handled your biggest deals',
      occupation: 'Corporate Lawyer',
      ageRange: [35, 50],
      startingRelationshipLevel: 50,
      startingTrustLevel: 65,
      startingAffectionLevel: 35,
      traits: ['sharp', 'meticulous', 'direct'],
      introMessage: "The incorporation papers are clean and your liability structure is solid. I've drafted standard NDA and contractor templates for the motorsport context. Call if you need them."
    },
    {
      id: 'fm_golf_friend',
      defaultFirstName: 'Robert',
      defaultLastName: 'Ashworth',
      type: 'friend',
      gender: 'male',
      description: 'Golf buddy from the country club',
      occupation: 'Private Equity Partner',
      ageRange: [40, 58],
      startingRelationshipLevel: 55,
      startingTrustLevel: 45,
      startingAffectionLevel: 45,
      traits: ['sociable', 'competitive', 'generous'],
      introMessage: "A racing team?! You're going to have to tell me all about it on the back nine this weekend. I've always thought motorsport was the ultimate executive perk."
    },
    {
      id: 'fm_advisor',
      defaultFirstName: 'Diana',
      defaultLastName: 'Laurent',
      type: 'business',
      gender: 'female',
      description: 'Your personal financial advisor',
      occupation: 'Financial Advisor',
      ageRange: [35, 50],
      startingRelationshipLevel: 50,
      startingTrustLevel: 70,
      startingAffectionLevel: 35,
      traits: ['prudent', 'analytical', 'trustworthy'],
      introMessage: "I've modeled the first-year burn rate projections for the team. We should schedule a review. I want to make sure your personal portfolio stays diversified regardless of how the team performs."
    }
  ],

  passionate_enthusiast: [
    {
      id: 'pe_best_friend',
      defaultFirstName: 'Tom',
      defaultLastName: 'Baker',
      type: 'friend',
      gender: 'male',
      description: 'Best friend from the racing fan community',
      occupation: 'Auto Mechanic',
      ageRange: [28, 42],
      startingRelationshipLevel: 75,
      startingTrustLevel: 80,
      startingAffectionLevel: 65,
      traits: ['loyal', 'passionate', 'encouraging'],
      introMessage: "MATE! You actually did it! I can't believe we went from watching races on the couch to you OWNING a team! I'm gonna be there for every single race. This is our dream coming true!"
    },
    {
      id: 'pe_mechanic',
      defaultFirstName: 'Jenny',
      defaultLastName: 'Cruz',
      type: 'friend',
      gender: 'female',
      description: 'Local mechanic buddy who shares your passion',
      occupation: 'Garage Owner',
      ageRange: [30, 45],
      startingRelationshipLevel: 60,
      startingTrustLevel: 65,
      startingAffectionLevel: 50,
      traits: ['hands-on', 'resourceful', 'tough'],
      introMessage: "Heard the news! If you ever need someone who knows their way around an engine on a budget, you know who to call. Can't wait to see your cars out there!"
    },
    {
      id: 'pe_forum_friend',
      defaultFirstName: 'Liam',
      defaultLastName: 'O\'Connor',
      type: 'friend',
      gender: 'male',
      description: 'Online racing forum friend you\'ve known for years',
      occupation: 'Sim Racing Content Creator',
      ageRange: [22, 35],
      startingRelationshipLevel: 50,
      startingTrustLevel: 55,
      startingAffectionLevel: 45,
      traits: ['geeky', 'enthusiastic', 'knowledgeable'],
      introMessage: "No way! The legend from the forums is starting an actual team?! The subreddit is going to explode when they hear this. Can I cover this for my channel? This is INCREDIBLE content!"
    },
    {
      id: 'pe_family_member',
      defaultFirstName: 'Maria',
      defaultLastName: 'Gonzalez',
      type: 'family',
      gender: 'female',
      description: 'Supportive family member who always believed in you',
      occupation: 'School Teacher',
      ageRange: [45, 60],
      startingRelationshipLevel: 80,
      startingTrustLevel: 85,
      startingAffectionLevel: 75,
      traits: ['nurturing', 'proud', 'caring'],
      introMessage: "I always told everyone you'd follow your heart someday. A racing team! Your father would be so proud. Please be careful with the finances, but know I'm behind you 100%."
    }
  ],

  corporate_executive: [
    {
      id: 'ce_assistant',
      defaultFirstName: 'Rachel',
      defaultLastName: 'Kim',
      type: 'business',
      gender: 'female',
      description: 'Former executive assistant who ran your corporate office',
      occupation: 'Operations Director',
      ageRange: [30, 42],
      startingRelationshipLevel: 55,
      startingTrustLevel: 70,
      startingAffectionLevel: 45,
      traits: ['organized', 'efficient', 'discrete'],
      introMessage: "I heard about the racing venture. Knowing you, it'll be run like a Fortune 500 company within a year. If you need someone to organize the operational side, I might be interested..."
    },
    {
      id: 'ce_board_colleague',
      defaultFirstName: 'Andrew',
      defaultLastName: 'Sterling',
      type: 'business',
      gender: 'male',
      description: 'Former board colleague from your corporate career',
      occupation: 'Corporate Director',
      ageRange: [45, 60],
      startingRelationshipLevel: 45,
      startingTrustLevel: 40,
      startingAffectionLevel: 30,
      traits: ['strategic', 'political', 'influential'],
      introMessage: "Motorsport, interesting. There's actually significant corporate hospitality value in racing sponsorship. Several companies on my current boards might be interested. Let's set up a call."
    },
    {
      id: 'ce_industry_contact',
      defaultFirstName: 'Fatima',
      defaultLastName: 'Al-Rashid',
      type: 'business',
      gender: 'female',
      description: 'Industry contact from cross-sector networking',
      occupation: 'Management Consultant',
      ageRange: [35, 48],
      startingRelationshipLevel: 45,
      startingTrustLevel: 45,
      startingAffectionLevel: 35,
      traits: ['strategic', 'well-traveled', 'perceptive'],
      introMessage: "I've been tracking the motorsport industry for a client. The sector is undervalued in terms of brand exposure per dollar. Smart move. I'd love to discuss market positioning over coffee."
    },
    {
      id: 'ce_club_friend',
      defaultFirstName: 'Philip',
      defaultLastName: 'Beaumont',
      type: 'friend',
      gender: 'male',
      description: 'Country club friend and confidant',
      occupation: 'Retired CEO',
      ageRange: [50, 65],
      startingRelationshipLevel: 55,
      startingTrustLevel: 50,
      startingAffectionLevel: 45,
      traits: ['refined', 'generous', 'wise'],
      introMessage: "A racing team! Now that's the kind of retirement project I wish I'd thought of. Much better than my vineyard. You'll have to host us in the hospitality suite!"
    },
    {
      id: 'ce_pr_consultant',
      defaultFirstName: 'Emma',
      defaultLastName: 'Stevens',
      type: 'business',
      gender: 'female',
      description: 'PR consultant who managed your corporate image',
      occupation: 'PR Consultant',
      ageRange: [32, 45],
      startingRelationshipLevel: 50,
      startingTrustLevel: 55,
      startingAffectionLevel: 40,
      traits: ['creative', 'connected', 'strategic'],
      introMessage: "This is a dream PR assignment - corporate exec turns racing team owner! The media narrative writes itself. We need to get ahead of the story. I'm drafting a press strategy now."
    }
  ],

  lottery_winner: [
    {
      id: 'lw_best_friend',
      defaultFirstName: 'Danny',
      defaultLastName: 'Wilson',
      type: 'friend',
      gender: 'male',
      description: 'Best friend from before you won the lottery',
      occupation: 'Electrician',
      ageRange: [28, 42],
      startingRelationshipLevel: 75,
      startingTrustLevel: 75,
      startingAffectionLevel: 65,
      traits: ['loyal', 'honest', 'grounded'],
      introMessage: "A racing team! You always said you'd do it if you had the money. Well, you've got the money now! Just... be careful, yeah? Don't blow it all in the first season. I want us to go to races for YEARS."
    },
    {
      id: 'lw_cousin',
      defaultFirstName: 'Lisa',
      defaultLastName: 'Morrison',
      type: 'family',
      gender: 'female',
      description: 'Your cousin who has been your rock through it all',
      occupation: 'Nurse',
      ageRange: [25, 38],
      startingRelationshipLevel: 70,
      startingTrustLevel: 70,
      startingAffectionLevel: 60,
      traits: ['caring', 'practical', 'protective'],
      introMessage: "I know I keep saying this, but please get proper financial advice before spending too much! That said... a racing team is pretty cool. Can I come watch? I'll bring the whole family!"
    },
    {
      id: 'lw_financial_advisor',
      defaultFirstName: 'Martin',
      defaultLastName: 'Brooks',
      type: 'business',
      gender: 'male',
      description: 'Financial advisor assigned to you by the lottery company',
      occupation: 'Financial Advisor',
      ageRange: [40, 55],
      startingRelationshipLevel: 40,
      startingTrustLevel: 50,
      startingAffectionLevel: 25,
      traits: ['cautious', 'professional', 'patient'],
      introMessage: "I understand you're pursuing a racing team venture. I have to be transparent - motorsport is high-risk. Let's set up a meeting to discuss budget limits and ensure your long-term financial security isn't compromised."
    },
    {
      id: 'lw_neighbor',
      defaultFirstName: 'Kate',
      defaultLastName: 'Hughes',
      type: 'friend',
      gender: 'female',
      description: 'Neighborhood friend who kept you grounded after the win',
      occupation: 'Small Business Owner',
      ageRange: [30, 45],
      startingRelationshipLevel: 55,
      startingTrustLevel: 60,
      startingAffectionLevel: 50,
      traits: ['warm', 'practical', 'supportive'],
      introMessage: "A racing team?! I nearly dropped my tea when I heard! The whole street is talking about it. We're all cheering for you. Don't forget about us little people when you're famous!"
    }
  ]
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getStarterContactsForBackground(backgroundId: string): StarterContactArchetype[] {
  return STARTER_CONTACTS[backgroundId] || []
}

export function getBackgroundSocialBlurb(backgroundId: string, backgroundName: string): string {
  const blurbs: Record<string, string> = {
    self_made: `As a Self-Made Entrepreneur, you've built lasting relationships through your business career. These are the people who know you best.`,
    racing_dynasty: `As a Racing Dynasty Heir, you grew up surrounded by motorsport royalty. The paddock is practically your extended family.`,
    tech_investor: `As a Tech Investor, your network spans Silicon Valley and beyond. These are the people who shaped your career.`,
    former_driver: `As a Former Racing Driver, you know the paddock inside out. Old teammates, engineers, and media contacts are part of your world.`,
    finance_mogul: `As a Finance Mogul, your network is built on deals and trust. These are the colleagues and connections that followed you from Wall Street.`,
    passionate_enthusiast: `As a Passionate Enthusiast, your circle is built on genuine love for the sport. Friends, family, and fellow fans who share your dream.`,
    corporate_executive: `As a Corporate Executive, you bring a professional network that spans industries. Your contacts open doors in the corporate world.`,
    lottery_winner: `As a Lottery Winner, your closest connections are the people who were there before the money. They keep you grounded.`,
  }
  return blurbs[backgroundId] || `As ${backgroundName}, you start your journey with a circle of people who know you.`
}
